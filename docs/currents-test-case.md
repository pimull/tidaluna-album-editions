# Currents: first user-supplied test case

Artist and album as reported by the user: Tame Impala — Currents.

| Album ID | Supplied URL | User-reported playback observation |
| --- | --- | --- |
| 77699617 | https://tidal.com/album/77699617/u | Decoder indicated MQA during playback. |
| 47696788 | https://tidal.com/album/47696788/u | No MQA indication during playback. |

These are user observations, not verified format labels or proof about every track. They are recorded only as test context; no MQA detection, community reporting feature, or format-based grouping is implemented. The user reports that native Other Versions does not connect the two releases. This has not been independently verified.

## AVB-002 scope

Manually read these two IDs and display title, artist, version, release date, track count, UPC, and label. Missing values remain unknown. Two cards do not constitute a match decision. No search, playback, collection mutation, or third-party metadata request is made by this feature.

## Verified source surface

Installed Luna source pinned by pnpm-lock.yaml to 19b83373cacd55caddaa656e2481283d4ce06fd1:
- plugins/lib/src/classes/TidalApi/index.ts: TidalApi.album(id), a read request using the current session's credentials and country/locale; 403/404 return undefined. Its fetch helper memoizes results.
- plugins/lib/src/classes/index.ts and src/index.ts: export TidalApi through @luna/lib.
- plugins/lib/src/redux/types/store/content/Album.ts: displayed fields.

No dedicated album-search method was found in the inspected TidalApi class. Search payload types alone do not establish a callable search API. Album.title() was not used because it may request MusicBrainz data.

The two public sharing URLs were inaccessible through the research browser. Actual album identity, availability, and field values remain pending the user's client test. Installed Luna may differ from the build dependency.

## Manual acceptance test

Reload album-version-browser in Luna and open its settings. Confirm AVB-002, then click Read two test albums. Expect separate results for 77699617 and 47696788, each showing metadata or an explicit error. Verify the titles and artists before interpreting similarities. Send a screenshot of both results. Do not advance to automated matching until this succeeds.

Failures are isolated per album. Repeat clicks are disabled during requests. Results are held only in component memory; no persistence is implemented. The upstream request helper caches requests, so a retry may reuse a prior result.
