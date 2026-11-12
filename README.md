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
