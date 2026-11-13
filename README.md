# Album Editions

A TidaLuna plugin that brings related album editions into one view, including releases missing from native Other Versions links.

Version **0.1.0** is prepared locally; publication is pending. Based on the official [Luna template](https://github.com/Inrixia/luna-template).

## Use

Open an album in TIDAL and click **Versions**. Results combine Other Versions, search and artist albums, deduplicate by album ID, and follow native links from matched editions. **Open album** navigates inside TIDAL without starting playback.

Stereo cards automatically read the first track's bit depth and sample rate. Lossless is cyan, Hi-Res yellow and Atmos blue. CD resolution requires exactly 16-bit/44.1 kHz. These values describe the returned first-track stream; other tracks may differ. Spatial cards retain their format label without probing a stereo fallback.

Expand **Release details** for sources, IDs and matching reasons, or **About these results** for discovery information. Incomplete sources remain visibly flagged. Close with Close, Escape or an outside click.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run build
pnpm test
pnpm run serve
```

Use the Luna DEV store on port 3000. Reuse an existing server. Reload after building. Source remains in `plugins/Example` from the template.

## Limits

Internal TIDAL endpoints may change. Heuristic matches require a shared artist ID and conservative title normalization; native associations are preserved. Matching does not prove identical audio or complete coverage.

Limits: 250 items per search/artist source, three artists, 12 additional related pages, 30 alternative details and 30 automatic specification probes (two concurrently). No MQA identification or Atmos filters are implemented.

Authentication stays in memory and is not logged or exported. The plugin does not alter collections, start playback or download audio. Repository-wide TypeScript checking has upstream and legacy errors; the production build and current regression suite pass.

## Verification

The user confirmed AVB-006.5 resolved the artist HTTP 400 and grouped Currents 47696788 from Search with 77699617 from Artist Albums. Automatic specifications also worked.

This candidate changes presentation, not discovery or specification logic. Wide/narrow layouts were inspected in a headless browser using the built plugin with mock data. The user accepted the visual candidate in TIDAL. Nothing has been published or submitted. See [release notes](docs/release-0.1.0.md).

## Publication

Repository: https://github.com/pimull/tidaluna-album-editions

Pushes and pull requests only build and test. Run **Prepare Release Draft** manually in GitHub Actions to create an unpublished release draft. Review its four assets and publish explicitly from GitHub Releases. The store URL after publication is:

```text
https://github.com/pimull/tidaluna-album-editions/releases/latest/download/store.json
```

The release plugin ID is `album-editions`. Disable the earlier `album-version-browser` DEV plugin before installing it. No release exists until the publishing step is completed.
