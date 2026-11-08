"""Decode archived Ogg notes, measure attacks, and build aligned PCM WAV banks.

Requires ffmpeg on PATH; all Python dependencies are from the standard library.
Original recordings and pitch mappings are never overwritten.
"""
import array
import base64
import hashlib
import io
import json
import math
from pathlib import Path
import re
import statistics
import subprocess
import sys
import wave

ROOT = Path(__file__).resolve().parents[1]
BANKS = ('G_lute', 'E_lute', 'Bar_lute')

def read_bank(path):
    text = path.read_text()
    entries = re.findall(r'"([A-G][b#]?[0-8])"\s*:\s*"data:audio/ogg;base64,([^\"]+)"', text)
    if len(entries) != 88 or len(dict(entries)) != 88:
        raise ValueError(f'{path}: expected 88 unique notes, got {len(entries)}')
    return {note: base64.b64decode(data, validate=True) for note, data in entries}

def decode(data):
    wav = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'pipe:0', '-c:a',
                          'pcm_s16le', '-f', 'wav', 'pipe:1'], input=data,
                         stdout=subprocess.PIPE, check=True).stdout
    with wave.open(io.BytesIO(wav)) as stream:
        rate, channels = stream.getframerate(), stream.getnchannels()
        pcm = array.array('h', stream.readframes(stream.getnframes()))
    if sys.byteorder != 'little':
        pcm.byteswap()
    return pcm, rate, channels

def envelope(pcm, rate, channels):
    window = max(1, round(rate / 1000))
    size = window * channels
    rms = [math.sqrt(sum(float(x)*x for x in pcm[i:i+size]) / len(pcm[i:i+size]))
           for i in range(0, len(pcm), size)]
    return rms, window

def onset(rms, fraction):
    threshold = max(rms) * fraction
    if threshold == 0:
        raise ValueError('Silent sample')
    for i in range(len(rms)-2):
        if min(rms[i:i+3]) >= threshold:
            return i
    raise ValueError('No sustained onset')

def write_wav(path, pcm, rate, channels):
    path.parent.mkdir(parents=True, exist_ok=True)
    out = array.array('h', pcm)
    if sys.byteorder != 'little':
        out.byteswap()
    with wave.open(str(path), 'wb') as stream:
        stream.setnchannels(channels)
        stream.setsampwidth(2)
        stream.setframerate(rate)
        stream.writeframes(out.tobytes())

def main():
    report = {'method': '1 ms RMS, 2% of peak sustained for 3 windows; retain 5 ms before onset',
              'banks': {}}
    for bank in BANKS:
        entries = read_bank(ROOT / 'sft' / bank / 'acoustic_grand_piano-ogg.js')
        notes = {}
        for note, data in entries.items():
            pcm, rate, channels = decode(data)
            rms, window = envelope(pcm, rate, channels)
            silent = not max(rms)
            candidates = [0, 0, 0] if silent else [onset(rms, f) * window for f in (0.01, 0.02, 0.04)]
            attack = candidates[1]
            # Retain the quiet beginning of the pluck, including codec pre-echo.
            trim = max(0, attack - round(rate * 0.005))
            output = pcm[trim*channels:]
            original_path = ROOT / 'web' / 'audio' / bank / 'original' / (note + '.wav')
            fixed_path = ROOT / 'web' / 'audio' / bank / 'aligned' / (note + '.wav')
            write_wav(original_path, pcm, rate, channels)
            write_wav(fixed_path, output, rate, channels)
            after_rms, after_window = envelope(output, rate, channels)
            notes[note] = {
                'silent': silent,
                'onset_ms': None if silent else round(attack / rate * 1000, 3),
                'removed_ms': round(trim / rate * 1000, 3),
                'aligned_onset_ms': None if silent else round(onset(after_rms, 0.02) * after_window / rate * 1000, 3),
                'threshold_spread_ms': round((max(candidates)-min(candidates))/rate*1000, 3),
                'review': (max(candidates)-min(candidates))/rate > 0.010,
                'sample_rate': rate, 'channels': channels,
                'frames': len(pcm)//channels, 'trim_frames': trim,
                'source_sha256': hashlib.sha256(data).hexdigest(),
                'envelope': [round(x/(max(rms) or 1), 4) for x in rms[:500]],
            }
        times = [n['onset_ms'] for n in notes.values() if not n['silent']]
        summary = {'notes': len(notes), 'sounding_notes': len(times), 'min_ms': min(times), 'max_ms': max(times),
                   'median_ms': statistics.median(times),
                   'review_notes': [k for k,v in notes.items() if v['review']]}
        report['banks'][bank] = {'summary': summary, 'notes': notes}
        print(bank, json.dumps(summary), flush=True)
        # Same wrapper/key names as the existing Soundfont loader expects.
        target = ROOT / 'sft' / bank / 'acoustic_grand_piano-wav.js'
        values = {note: 'data:audio/wav;base64,' + base64.b64encode(
            (ROOT / 'web' / 'audio' / bank / 'aligned' / (note + '.wav')).read_bytes()).decode()
            for note in notes}
        target.write_text('MIDI.Soundfont.acoustic_grand_piano = ' + json.dumps(values) + ';\n')
    (ROOT / 'web' / 'analysis.json').write_text(json.dumps(report, indent=2) + '\n')

if __name__ == '__main__':
    main()
