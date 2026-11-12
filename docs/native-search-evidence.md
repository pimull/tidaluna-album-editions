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
