# Native search implementation evidence

Inspected read-only installation: C:/Users/zhy18/AppData/Local/TIDAL/app-2.47.0/resources/original.asar. Its Windows configuration loads https://desktop.tidal.com/. Installed Luna package reports 1.20.2-beta.

The public desktop HTML referenced https://desktop.tidal.com/assets/index-DnY8hG-p.js. This current public bundle may differ from an already-running client's cached version. No installation files were modified and no account credentials were read.

Relevant implementation observations:

- The search saga emits search/SEARCH_RESULT_SUCCESS with { query, result } for a successful network response, or only { query } when cached results suffice.
- The search route completion event carries no payload. This matches the user's diagnostic screenshot.
- The list-name function uses search/albums/ followed by encodeURIComponent(query).
- The content reducer stores album IDs under content.albumLists[listName].sorted.defaultSort.items and album objects in content.albums.
- Search list membership, not membership of the global album cache, establishes that an album appeared for that query.

AVB-003-fix3 observes only search/SEARCH_RESULT_SUCCESS and schedules a microtask to read that exact query list after synchronous reducers run. It checks the observation generation before reading, so stop/reset/unload invalidates queued work. It makes no additional requests and does not dispatch actions. Results across observed queries are still accumulated; no completeness or matching claim is made.

Mock regression coverage includes query-only events, reducer updates after interception, exclusion of unrelated globally cached albums (including known test IDs), deduplication, unknown query, reset, and stop before queued reads. Actual installed-client compatibility remains pending.

## Artist Albums evidence and AVB-004

On 2026-11-12 the public desktop HTML still referenced index-DnY8hG-p.js. Inspection of that bundle establishes:
- RTK Query reducerPath is tidalApi.
- getArtistViewAllPage takes artistId and sourceType; artist Albums uses ARTIST_ALBUMS with initial limit 50 and offset 0.
- Its response data.items uses typed wrappers: { type: ALBUM, data: album }. The SI adapter reads data.id and data.title.
- The artist page requests Albums, singles, live albums, and compilations separately.
- The view-all cache may expire after leaving the page; client source specifies keepUnusedDataFor 300. The initial 50-item list can be truncated.

AVB-004 reads fulfilled tidalApi.queries entries only when endpointName is getArtistViewAllPage, originalArgs.artistId matches the seed artist, and sourceType is ARTIST_ALBUMS. RTK Query cache layout is an internal compatibility assumption requiring client verification. Unsupported/missing cache is reported explicitly.

TidalApi.album(47696788) supplies artist identity only. Neither seed album nor the other known ID is inserted into results. Album membership comes solely from typed ALBUM items in that artist's list; global content.albums may supply a title only after list membership is established. Results are labelled Artist Albums and kept separate from search. No dispatch, playback, collection mutation, direct artist endpoint request, or automatic pagination is performed.

## AVB-006.1 evidence and validation

The inspected public client bundle uses the v2 API gateway for search and artist view-all. Its DP context builder calls pP to convert en-us to en_US; the plugin now follows that conversion to address the artist HTTP 400. Resolution remains pending user verification.

The client dispatches router/PUSH with string routes. The plugin now dispatches /album/{id}. The album route and Luna albumItems helper both use pages/album; Luna describes rows/modules/pagedList.items. The adapter requests en_US and selects the ALBUM_LIST titled Other versions. That label/shape still requires live acceptance; mock fixtures are not live evidence. Native associations bypass suffix filtering; other modules are excluded.

The built-bundle lifecycle test checks the exported unload Set, timer/listener cleanup and absence of a competing onUnload hook. Metadata enrichment supplies counts and quality when returned, without inferring bit depth or sample rate. No further desktop interaction is performed following the user's request to test independently.

## AVB-006.2

User testing confirmed native versions work across several albums, but artist view-all still returns HTTP 400 and unlinked Currents remains unresolved in-client. The locale change alone did not fix that error.

Spatial labels now use both mediaMetadata.tags and audioModes. LOW/HIGH alone no longer become a misleading quality label. Lossless is cyan (#33ffee), Hi-Res lossless yellow (#ffd432), and Atmos blue (#6ab5ff), matching Luna Quality colors. A lossless badge does not assert 16-bit/44.1 kHz CD resolution. No Atmos filtering or MQA inference was added.

If artist view-all fails, discovery fetches the client's v2 artist page and reads typed ALBUM entries from supported list/card modules. Results are labelled Artist page; the original error and partial coverage notice remain visible. This is a fallback, not a claimed fix to the underlying HTTP 400. Mock tests verify both Currents directions without native associations, source isolation, failure and cancellation. Live fallback availability is pending user testing.

Exact sample rate and bit depth remain unavailable in this UI. Local Luna MediaItem source separates metadata qualityTags from playbackInfo/updateFormat (which may parse stream data); no playback or stream probing was introduced. Tidal Tags uses the same Luna qualityTags mechanism: https://github.com/Inrixia/luna-plugins/blob/master/plugins/TidalTags/src/setQualityTags.ts

## AVB-006.3: optional first-track specifications

The Versions button and settings instructions are English-only. Stereo release cards offer **Read first-track specs**. This requests the album page's first track and the same playbackinfo endpoint/parameters used by the installed Luna TidalApi.playbackInfo helper. It does not dispatch playback, parse or retrieve the audio manifest URLs, or download audio. The country code comes from the active session rather than Luna albumItems' hardcoded NZ helper URL.

The result is accepted only when track ID matches, audio mode is STEREO, quality is lossless, and bit depth/sample rate are plausible numeric values. Spatial cards do not offer this stereo probe. The displayed specification is explicitly for the first track and returned stream, not the entire album, maximum catalog capability, or a measured playback. Other tracks can differ. CD resolution requires exactly 16-bit/44100 Hz; lossless metadata alone is insufficient. Missing or downgraded responses stay unknown.

Source evidence: installed `node_modules/luna/plugins/lib/src/classes/TidalApi/index.ts` playbackInfo and albumItems; `types/PlaybackInfo.ts` provides trackId, audioMode, audioQuality, bitDepth, sampleRate. MediaItem.updateFormat can also parse stream data, but this plugin intentionally does not invoke it.

User testing reports artist HTTP 400 and missing Currents edition persist in AVB-006.2. No root-cause fix is claimed. Failed requests now show numeric subStatus and a short filtered userMessage for HTTP 400 when supplied by the server. Full response bodies and authentication values are not exposed. This should provide a concrete reason for the next fix. Optional specification behavior is locally tested but awaits installed-client acceptance.

## AVB-006.4

First-track specs load automatically after cards render, with at most two concurrent probes and a 30-release cap. Spatial cards keep their format badge rather than probing a stereo fallback. Closing or unloading aborts active requests and prevents queued probes from starting.

Discovery now follows Other Versions links from matched editions, not just the starting album. Each ID is visited once; expansion is capped at 12 additional pages and three concurrent requests. This addresses asymmetry such as the Moon original finding the anniversary stereo edition, whose native list then reveals Atmos. Fixtures verify the same three IDs from either stereo starting edition, cyclic links, exclusion of unrelated search albums and the cap. Complete global equivalence is not promised: inaccessible pages, directional links, query differences and limits may still affect coverage.

Click outside the panel or press Escape to close. The Close control is sticky while scrolling. Background clicks close without activating underlying controls. No TIDAL UI automation was used.

The user confirmed AVB-006.3 returned 24-bit/192 kHz for the anniversary first track. Artist requests still fail with HTTP 400/subStatus 1002; its cause and the unlinked Currents case remain unresolved. AVB-006.4 passes local build/tests but awaits user acceptance.

## AVB-006.5: native v2 request headers

Inspection of the downloaded public TIDAL bundle `index-DnY8hG-p.js` found an omitted transport requirement. `EP(headers,url)` sets Accept: application/json and, for v2 URLs, x-tidal-client-version from Ki(B.version). `B.version` uses tre(), reading window.wimp.dataset.version. Ki removes the build suffix and normalizes numeric components (2026.01.09-build -> 2026.1.9). Logged-in EP uses Authorization; x-tidal-token is used for the alternate unauthenticated branch, not both together.

AVB-006.4 reused Luna TidalApi.getAuthHeaders for every endpoint. That helper does not add a web client version header and supplies both authentication headers. AVB-006.5 adds a dedicated metadata transport that matches the native v2 headers. It derives the version from runtime wimp data (with the equivalent element lookup), never hardcodes a version, and preserves existing v1 authentication. If the web version cannot be read, v2 requests fail explicitly rather than sending a fabricated version. No user credentials are logged, exported or read by tooling.

Local tests verify normalization, runtime lookup, header construction at the fetch boundary, v1 preservation, cancellation and both Currents discovery directions through a mock HTTP transport. The fixture's rejection of incomplete headers verifies our wiring, not the real server's validation behavior. HTTP 400/subStatus 1002 can represent multiple request problems; this is a confirmed client/plug-in request discrepancy, but the live root cause and final resolution remain pending user verification.

Acceptance: reload AVB-006.5, open Currents and check for both album IDs (47696788 and 77699617), an Artist Albums source label, and absence of HTTP 400. Also check one previously failing Pink Floyd artist request. No desktop UI automation was performed.

## Live acceptance and visual release candidate

User testing confirmed AVB-006.5: no HTTP 400, Currents 47696788 from Search and 77699617 from Artist Albums, both with first-track 16-bit/44.1 kHz readings. This supersedes earlier pending-verification notes for that case.

0.1.0-rc.1 is a local presentation candidate. Compact cards, responsive styles and expandable diagnostics replace the diagnostic layout while preserving discovery. The real bundle was rendered with mock data in headless Edge at wide/narrow sizes. Actual-client visual acceptance remains pending. No publishing or TIDAL UI interaction occurred.
