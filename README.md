# ecolmeditor

This fork brings Tim Crawford's editor runtime up to the Goldsmiths snapshot
downloaded on 2026-11-02, then adds the audio and playback fixes evaluated at
https://porter.net.nz/~alastair/ecolm-audio-repair/.
See [PUBLISHED-BASELINE.md](PUBLISHED-BASELINE.md) for the upstream comparison.

## Run locally

Requires Python 3 and ffmpeg; Node is used for the JavaScript tests.
Run from the repository root:

```sh
python3 tools/process_audio.py
python3 -m http.server 8874 --bind 127.0.0.1
```

Open http://127.0.0.1:8874/web/ to compare original and aligned samples, or
http://127.0.0.1:8874/test/new_index.html?tc_path=../web/branle_besard.tc
to play Tim's example score. The comparison page links to the editor.

## Changes

- Align the existing lute samples, retaining 5 ms before each detected attack.
- Generate PCM WAV banks for playback without depending on Ogg support.
- Resume audio in the user gesture and schedule notes after decoding completes.
- Cancel stale loads, report playback errors and fix score-import initialization.
- Add an optional **Follow playback** checkbox to centre each playing system.
  It is off by default and follows system changes, including after resume.

Each bank has 49 sounding notes and 39 silent placeholders. Original detected
starts ranged from 1–31 ms (G lute), 1–37 ms (E lute) and 7–78 ms (D minor);
aligned starts measure approximately 1–5 ms using the same detector.
The remaining PCM after trimming is preserved. These are detector measurements;
46 entries have threshold-sensitive attacks and are flagged for listening
review in the comparison page. No new recordings or missing pitches are created.

Generated WAV banks are about 59 MB each, compared with approximately 2.7 MB
for each original Ogg bank. The generated audio and analysis are ignored by
Git and rebuilt by the command above. The original banks are already tracked.

## Verify

```sh
node --test tests/playback.test.cjs
python3 -m unittest discover -s tests -p 'test_*.py' -v
```

The original repair was exercised in the in-app browser and Safari 27.2.
Tests cover loading/cancellation, scheduling, scrolling, sample preservation
and generated bank contents. Older Safari and iOS were not tested.

## Deployment layout

This fork uses the upstream repository layout: `test/`, `sft/` and the player
scripts are at the repository root. The earlier porter.net.nz evaluation copy
keeps those files inside `upstream/`; its public links remain valid.
The fork has not replaced that hosted directory. When deploying a checkout,
generate and transfer the WAV banks along with the scripts. A Git clone alone
does not contain the generated audio. Optional PDF export retains the editor's
existing external CDN dependencies.
