"""Artifact checks: run after tools/process_audio.py."""
import base64
import json
from pathlib import Path
import unittest
import wave

ROOT = Path(__file__).resolve().parents[1]
REPORT = json.loads((ROOT / 'web/analysis.json').read_text())

def read(path):
    with wave.open(str(path)) as stream:
        return stream.getparams(), stream.readframes(stream.getnframes())

class AudioTests(unittest.TestCase):
    def test_every_sounding_note_preserves_all_pcm_after_trim(self):
        checked = 0
        for bank, info in REPORT['banks'].items():
            for note, details in info['notes'].items():
                original, before = read(ROOT / 'web/audio' / bank / 'original' / (note+'.wav'))
                aligned, after = read(ROOT / 'web/audio' / bank / 'aligned' / (note+'.wav'))
                self.assertEqual(original.nchannels, aligned.nchannels, (bank,note))
                self.assertEqual(original.framerate, aligned.framerate, (bank,note))
                self.assertEqual(before[details['trim_frames']*original.nchannels*2:],after,(bank,note))
                checked += 1
        self.assertEqual(checked,264)

    def test_silent_placeholders_are_not_fabricated_notes(self):
        for bank, info in REPORT['banks'].items():
            self.assertEqual(sum(n['silent'] for n in info['notes'].values()),39,bank)
            for note, details in info['notes'].items():
                if details['silent']:
                    _, pcm = read(ROOT / 'web/audio' / bank / 'aligned' / (note+'.wav'))
                    self.assertFalse(any(pcm),(bank,note))

    def test_detected_attacks_are_within_six_milliseconds(self):
        for bank, info in REPORT['banks'].items():
            for note, details in info['notes'].items():
                if not details['silent']:
                    self.assertLessEqual(details['aligned_onset_ms'],6,(bank,note))

    def test_editor_banks_contain_all_corrected_wav_files(self):
        for bank, info in REPORT['banks'].items():
            text=(ROOT/'sft'/bank/'acoustic_grand_piano-wav.js').read_text()
            mapping=json.loads(text[text.index('{'):text.rindex('}')+1])
            self.assertEqual(set(mapping),set(info['notes']))
            for note, data in mapping.items():
                prefix, encoded=data.split(',',1)
                self.assertEqual(prefix,'data:audio/wav;base64')
                self.assertEqual(base64.b64decode(encoded),(ROOT/'web/audio'/bank/'aligned'/(note+'.wav')).read_bytes())

if __name__ == '__main__':
    unittest.main()
