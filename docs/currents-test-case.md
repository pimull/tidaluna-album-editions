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

## Client-verified result: AVB-002-fix1

The user supplied a screenshot showing both successful metadata results in Luna:

| Field | Album 77699617 | Album 47696788 |
| --- | --- | --- |
| Title | Currents | Currents |
| Artist | Tame Impala | Tame Impala |
| Release date | 2015-07-17 | 2015-07-17 |
| Track count | 13 | 13 |
| UPC | 00602547362193 | 00602547306807 |
| Version | Not provided | Not provided |
| Record label | Not provided | Not provided |

Evidence source: user-provided screenshot of the running AVB-002-fix1 settings. UPC values are strings; leading zeroes must be preserved. Missing version/label fields do not establish that the releases lack versions or labels.

Acceptance: settings render, the read button works, and both album IDs return metadata in the user's current session. The read-only milestone is complete. No automatic discovery or grouping is verified. Matching visible fields and differing UPC values do not prove a mastering, mix, codec, or audio-content difference.

Next bounded milestone: investigate a source-supported album search path and test whether a Currents / Tame Impala query can discover both IDs without hard-coding them into search results. Do not implement grouping until search behavior is verified.

## AVB-003-fix3: Client search observation accepted

User screenshots show two events, 50 unique observed albums, and album 47696788 present. Album 77699617 was not observed in this run. This verifies native search result extraction, not full search coverage or automated search.

The user additionally reports that 77699617 is discoverable in the artist page Albums list, while 47696788 is visible in search but absent from that artist list. This artist-list behavior is a user observation pending plugin verification. The earlier decoder observations remain user reports only and do not drive matching.

Do not infer that 77699617 can never appear in search: query, country, cached result state, pagination, and catalog changes may affect coverage. The 50 results are candidates returned by search, not 50 editions of Currents. The visible list includes unrelated artists/albums and Currents B-Sides & Remixes, which must not be automatically grouped based only on a shared word or artist.

Next bounded milestone: inspect source-backed artist album-list retrieval, then verify whether that source supplies 77699617. Preserve provenance separately for search and artist-list results. Only after both sources are verified, combine candidates by album ID and evaluate related-release rules. Do not use the known-ID lookup to pretend automatic discovery succeeded.

## AVB-004 client acceptance

User screenshot confirms artist Tame Impala, ID 3736815, one matching ARTIST_ALBUMS list, five list items and five unique album IDs:
- Deadbeat: 466933846
- The Slow Rush: 130691516
- Currents: 77699617
- Lonerism: 28098315
- InnerSpeaker: 97122857

77699617 is present; 47696788 is not observed in this source. This independently verifies artist-list extraction and agrees with the user's earlier observation. Combined with the prior AVB-003-fix3 search acceptance, the two discovery sources expose different Currents releases. These were separate test runs, not a single exhaustive catalog snapshot. Search was inactive in the AVB-004 screenshot, so its zero counters do not invalidate the previous search verification.

The artist-source milestone is accepted. Next bounded milestone: combine source-labelled candidates by album ID and show a conservative Currents candidate group using artist identity and title, preserving both original releases and their source labels. Do not imply audio equivalence, complete discovery, or MQA verification. Keep automatic search/pagination and general edition-suffix matching outside this next minimal test unless separately scoped.
