# Album Version Browser

A TidaLuna album-version browser based on the official [Luna template](https://github.com/Inrixia/luna-template).

## AVB-006.1

Open an album in the TIDAL desktop client and click **Versions**. No pasted IDs or manual search is required. **Open in TIDAL** uses client navigation without starting playback.

Sources: current album, native Other Versions, album search, and artist Albums lists. Results are deduplicated by album ID. Native associations bypass title heuristics; other matches require a shared artist ID and a conservatively normalized title. Remaster, mix and deluxe suffixes are supported; B-sides and live recordings are not stripped indiscriminately.

Cards display release date, track count and available quality metadata. Bit depth and sample rate are not inferred. MQA identification and Atmos filters are not implemented.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run serve
```

Use the Luna DEV store on port 3000. Reuse an existing server and reload the plugin after building. Source remains in `plugins/Example` from the template.

## Limits and acceptance

Internal client endpoints and navigation actions are compatibility dependencies. Each search/artist source is capped at 250 items; only three credited artists and 30 alternative detail requests are supported. Source errors remain visible. Native discovery reads the returned page's English Other versions module; hidden/paginated modules and server label/schema changes can limit coverage. Requests use the signed-in client's region and in-memory authentication, never stored or logged. No collection mutations occur.

AVB-006 found Abbey Road versions in user testing. AVB-006.1 passes local discovery, navigation and built-bundle lifecycle tests. Its native source adapter, artist HTTP 400 correction and navigation still require installed-client verification. Repository-wide type checking fails in upstream dependencies and legacy diagnostic files; the build and current targeted tests pass. Earlier diagnostic UI smoke tests target obsolete milestones.

Acceptance: reload, open Let It Be (2021 Mix), compare official versions with source-labelled cards, open an alternative inside TIDAL and check track counts/quality. Repeat with Currents and Abbey Road. Results do not prove identical audio or complete catalog coverage.

## AVB-006.2 update

Format badges now recognize Atmos metadata before interpreting generic quality fields, with cyan Lossless, yellow Hi-Res and blue Atmos labels. Exact bit depth/sample rate and CD resolution remain unconfirmed. Artist view-all HTTP errors now trigger a source-labelled artist-page fallback; errors and incomplete coverage stay visible. This fallback uses the inspected client getArtistPageById endpoint and TI list shapes, and awaits installed-client verification. Current tests include unlinked Currents fixtures in both directions and format/color regressions.

## AVB-006.3 update

Click **Read first-track specs** on a stereo release to request its first track's exact lossless playback metadata. Playback is not started and audio is not downloaded. The returned sample rate and bit depth apply only to that track and stream. Missing fields or a spatial/lossy fallback do not become invented specifications. CD resolution requires 16-bit/44.1 kHz. This optional feature has mock regression coverage and awaits user testing.

The main button is now English-only. Artist HTTP 400 and the missing Currents version remain unresolved in user testing. A limited API error description is now shown if available; the fallback is not claimed as a verified solution.

## AVB-006.4 update

First-track resolution loads automatically (two concurrent requests, 30 releases maximum). Other Versions links are followed across matched editions, up to 12 additional pages, to reduce differences between entry points. The panel closes on outside click or Escape and keeps Close visible while scrolling. Closing cancels pending metadata work. Artist HTTP 400/code 1002 and the unlinked Currents case remain unresolved; association traversal does not fix the artist endpoint. Build and regression tests pass; installed-client acceptance remains pending.

## AVB-006.5 update

Corrects a verified discrepancy with the native client's v2 HTTP requests: runtime x-tidal-client-version and Accept headers, plus bearer-only authenticated v2 requests. The version comes from TIDAL's own web build metadata, not the plugin or desktop installer version. Missing runtime version is reported explicitly. All local tests and build pass; live resolution of artist HTTP 400 and Currents coverage requires user testing.
