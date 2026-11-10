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
