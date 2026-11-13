# Album Editions 0.1.0

The first release of Album Editions, a TidaLuna plugin for browsing related album releases inside TIDAL.

- Combine Other Versions, search and artist albums, including releases missing from native associations.
- Follow linked editions and deduplicate by album ID.
- Compare automatic first-track bit depth and sample rate, with cyan lossless, yellow Hi-Res and blue Atmos labels.
- Open any edition inside TIDAL without starting playback.
- Browse compact cards, expandable release details and a responsive panel; close with Escape or an outside click.

First-track specifications describe the returned stream, not every track or proof of identical audio. Discovery is bounded and cannot guarantee complete coverage. MQA identification and Atmos filters are not included.

## Installation

After this release is published, add this custom store in Luna Settings:

https://github.com/pimull/tidaluna-album-editions/releases/latest/download/store.json

Install `album-editions`. Disable the old `album-version-browser` DEV plugin before enabling this release to avoid duplicate buttons.

## Validation

The author verified Currents editions 47696788 and 77699617 are discovered from different sources with no artist HTTP 400. Automatic specifications and the visual candidate were accepted in-client. Local build/regression tests pass; GitHub's Linux build must also pass before publication.

Based on the official Inrixia/luna-template; distributed with the existing AGPL-3.0 license.
