# Published editor baseline

Compared on 2026-11-08 with TimCrawford/ecolmeditor `main` at
`3a8abab` (2024-02-01, “Updated to 1 Feb 2024”). The `justify` branch
ends at `1bb7ed3` (2021-07-07).

The comparison uses the exact Goldsmiths files archived on 2026-11-02 from:

https://doc.gold.ac.uk/~mas01tc/ecolmeditor_Apr2025/ecolmeditor/test/new_index.html

The archive is the baseline commit `ccc43ac` of the local
`/Users/alastair/code/contract/ecolm-audio-repair` repository. Its source URLs
and SHA-256 hashes are recorded in `published-sources.json` in this fork.

Of the 64 archived runtime files, 45 match GitHub byte for byte and 19 differ.
All three lute Ogg banks and `soundfont-player.js` match. Differences include
the page markup and script loading, rendering/parser code, MIDI import and
playback controls. For example, the published player includes `playFrom` and
`TCindexFromChord` and comments dated 2026-10-01, which GitHub's main lacks.
This establishes that the GitHub checkout was behind the published editor;
it does not establish the status of server-side files absent from the archive.

The first update commit brings these runtime files to the archived published
baseline. The following repair commit carries the changes tested and hosted
at https://porter.net.nz/~alastair/ecolm-audio-repair/, with paths adapted to
this repository's root layout. Other existing repository files are retained.

This comparison is against the 2026-11-02 archive, not a fresh download of
Goldsmiths on 2026-11-08.
