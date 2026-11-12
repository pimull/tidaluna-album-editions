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
