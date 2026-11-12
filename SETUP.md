# Milestone 0: Environment and official template inspection

## Scope

Build a TidaLuna album version browser incrementally. The first future test case is Currents by Tame Impala: two user-reported TIDAL editions not connected by Other Versions. Album URLs and matching behavior have not been verified yet. Dolby Atmos filters and community MQA reports are out of scope for now.

## Official sources

- Template: https://github.com/Inrixia/luna-template
- Template baseline: 37d1b69988832585b5c74601f380c31dc273e11e
- Client documentation: https://github.com/Inrixia/TidaLuna

The original README and example source remain unchanged. No album-search API has been assumed or implemented.

## Observed environment

- Windows / PowerShell
- Git: 2.48.1.windows.1
- Node.js: v23.9.0
- npm: 10.9.2
- pnpm: 10.5.2
- nvm and Corepack commands are present.
- The user confirmed that TIDAL and TidaLuna are installed and regularly used, and Luna Settings is available. The initial default-path probe did not locate that installation.
- Git author name and email are not configured. This setup checkpoint uses a command-scoped Codex identity, without changing user settings.

## Template map

- plugins/Example/package.json: plugin metadata and entry point.
- plugins/Example/src/index.ts: greeting log, settings export, cleanup set, page interception, and media transition alert.
- plugins/Example/src/Settings.tsx: React-based example settings switch.
- package.json: dependency declarations and build/watch/serve commands.
- pnpm-workspace.yaml: includes plugin subprojects.
- esbuild.config.ts: imports the official luna/buildPlugins build helper.
- tsconfig.json: inherits TypeScript configuration from Luna.
- .github/workflows: upstream automation; inspect before any future publishing.
- LICENSE: original template license, preserved.

The example uses Tracer, redux, MediaItem, LunaSettings, and LunaSwitchSetting. Their use is verified in the template source, not evidence that album searching or grouping is supported by those APIs.

## Initial installation failure (resolved)

Official template cloned successfully. Dependency installation attempted with:

```powershell
pnpm install --store-dir ../../work/pnpm-store
```

Installation failed with ERR_PNPM_EPERM when pnpm tried to create a dependency symlink (undici-types). This initially left dependencies incomplete. See the successful follow-up checks below.

Resolved using project-local .npmrc with node-linker=hoisted. The incomplete node_modules directory was preserved at ../../work/node_modules-incomplete. No Windows settings were changed.

After dependency installation succeeds, run:

```powershell
pnpm run build
pnpm run watch
```

According to the official README, the DEV store should appear in Luna Settings > Plugin Store while watch is running. Load Example and verify the greeting and settings switch. The unchanged example also logs page changes and shows an alert on media transitions. Stop the development server with Ctrl+C.

Only advance after the build and client smoke test succeed. A build alone does not prove that the plugin loads in TIDAL.

## Boundaries

No remote repository was created, no code was pushed or published, and no PR was submitted. No TIDAL collection or installed application was modified. Subsequent implementation should use small, verified commits and English code/documentation, with Chinese explanations in chat.


## Milestone 1: Build verified; client smoke test pending

- Installed dependencies successfully with pnpm 10.5.2 using the project-local hoisted layout.
- Preserved pnpm-lock.yaml in Git for reproducible dependency resolution. Luna resolves to commit 19b83373cacd55caddaa656e2481283d4ce06fd1 (package version 1.20.2-beta).
- pnpm run build exited successfully and generated dist/luna.example.mjs and its source map.
- pnpm run watch started successfully.
- HTTP GET http://localhost:3000/store.json returned 200 and listed luna.example.mjs.
- HTTP GET http://localhost:3000/luna.example.mjs returned 200.
- Plugin source is unchanged. No album browsing features were implemented.

Client smoke test: open Luna Settings > Plugin Store, find DEV, install/enable Example, and toggle Example Switch in its settings. Report whether it loads and whether the switch responds. The example greeting/switch uses Luna logging; the example also alerts on media transitions. Disable Example after testing if the alerts interrupt normal listening.

The development server was left running for this handoff. If it stops, open a terminal in this project and run pnpm run watch again. Client compatibility and runtime behavior remain unverified until this manual test succeeds.

The original template ignores the lockfile; this project tracks it so working dependency versions can be restored. Future installs should use pnpm install --frozen-lockfile --store-dir ../../work/pnpm-store.

## Milestone 2: Identify our local build (client check pending)

The user confirmed the original Example switch shows state notifications. That validates Example behavior but does not uniquely identify its source.

Changes:
- Changed the plugin ID to album-version-browser so it is distinct from @luna/example.
- Added the visible settings title Album Version Browser — AVB-001 and matching ON/OFF notifications.
- Removed the original page listener, profile-name access, and media-transition alert.
- Removed upstream author metadata from this project's plugin manifest; original template attribution and license remain in the repository.
- Kept the existing folder and official settings/logging APIs to minimize changes.

Verification: pnpm run build succeeded. The existing server at port 3000 returned a store listing album-version-browser.mjs and HTTP 200 plugin content containing AVB-001. A duplicate watch launch encountered EADDRINUSE; the duplicate session was stopped and the existing server reused.

Manual test: reopen Luna Settings > Plugin Store, locate album-version-browser (description includes AVB-001), install and enable it, open its settings, and toggle Album Version Browser — AVB-001. Expect an AVB-001 ON/OFF notification. Keep the original Example disabled. Report the exact marker seen before proceeding.

Limitations: no album search, no saved setting, and no changes to playback or the collection. The new plugin still needs client verification. Source reference for local discovery: the installed Luna PluginStoreTab renders http://127.0.0.1:3000 as its local store.

## Milestone 3: AVB-002 read-only album probe (client check pending)

The user screenshot confirmed AVB-001 is installed and its settings are visible. The user supplied two Currents album links; observations and source evidence are recorded in docs/currents-test-case.md.

AVB-002 replaces the diagnostic switch with a manual read button and two independent metadata results using the source-verified TidalApi.album method. Build passed. Client metadata retrieval and visual layout remain pending user verification. No automatic matching or MQA/Atmos features are implemented.

## AVB-002-fix1: Missing settings investigation

User report: AVB-002 appears in the description, but no settings/button is visible. Client success is not established.

Confirmed local defect: the original watch session (20797) retained @luna/example as the build-time plugin ID and kept writing dist/luna.example.* while reading the renamed manifest. The stale bundle referenced @luna/example, despite declaring album-version-browser in its JSON. That process was stopped, the output rebuilt, and only the current album-version-browser artifacts remain. Whether the user's installed entry was using the stale URL is not yet known.

A single serve-only session now serves the current build. Future source changes require pnpm run build. Restart watch when changing plugin identity; do not keep parallel build watchers.

Resilience change: @luna/lib is loaded only after the read button is clicked. A missing album API now produces a card-level message rather than blocking the settings export at module initialization. No alternate API or endpoint was invented.

Checks: build passed; node tests/settings-smoke.mjs passed with a mocked host that deliberately omits @luna/lib, verifying the Settings export, read button, and two error results. HTTP manifest and module checks confirmed AVB-002-fix1 at the current local URL. This mock does not verify real React rendering, installed Luna compatibility, or live album data.

Client retest: disable and re-enable album-version-browser, reopen the Plugins tab, and use the gear to show settings if available. Confirm AVB-002-fix1 and the read button. If the marker does not update, investigate the installed source URL before requesting any uninstall or reinstall.

## AVB-002-fix1 client acceptance

User screenshot confirms the settings and read button render and both requested albums return metadata. The read-only milestone is now client-verified. See docs/currents-test-case.md for the observed fields. No source change was needed after this acceptance, so build tests were not repeated. Automatic search and grouping remain unimplemented.

## AVB-003: Native search observation (client verification pending)

Product direction from user-provided Roon screenshots: group related releases of the same album while preserving edition names and track counts. Deluxe editions must not be excluded solely because their track count differs greatly. Automatic matching, codec labels, MQA reports, and Atmos filters remain out of scope for this milestone.

The installed Luna source exposes redux.intercept and types search/SEARCH_RESULT_SUCCESS as SearchResultPayload with albums.items. Sources: plugins/lib/src/redux/intercept.ts, types/actions/index.ts, and types/actions/Search.ts. This is an internal, version-dependent host event, not a documented public TIDAL search endpoint. No dedicated search method was found in the inspected TidalApi class; action types alone do not authorize inventing a dispatch payload.

AVB-003 adds a manually started observer of native searches. Users search in TIDAL themselves. The observer does not dispatch, cancel, or modify host actions, and does not initiate a catalog request. It collects at most 100 unique album summaries in memory across observed events until stopped, reset, or unloaded. Observation intentionally survives closing settings so users can search and return. The UI polling timer is cleaned up when settings unmounts; the plugin-level listener is cleaned up on stop/reset/unload.

Known IDs are used only as acceptance indicators. The existing direct lookup remains visibly separate and never supplies observer results. Results cannot be attributed to a particular query; do not search unrelated terms during the test. Missing IDs mean not observed, not unavailable. No automatic discovery, pagination, or grouping is implemented yet.

Checks passed: build, existing settings smoke test, observer smoke test (lifecycle, reset, deduplication, malformed/missing album-list handling, 100-item cap, no injected known IDs), and HTTP manifest/module marker check for AVB-003. Tests use a mocked host; actual event delivery and UI remain pending client verification.

Client test: reload plugin, confirm AVB-003, click Start / reset observation, search Currents Tame Impala in the native TIDAL search, open album results, return to plugin settings, click Stop observation, and report event count and both ID indicators. If no IDs are found, repeat separately with Currents after reset. Do not infer a match or search completeness from this diagnostic.

## AVB-003-fix1: Recursive cleanup regression

User reported Maximum call stack size exceeded from onUnload and Start remaining Not observing. Root cause reproduced: Luna loadExports adds the exported onUnload to the exported unloads set. Our stop routine iterated that same set, invoking onUnload, which called stop again. Both start (which first stops) and unload were affected. The earlier mock omitted the host registration step and therefore missed this failure. The previous search attempt is invalid evidence of discovery coverage.

Fix: keep listener disposers private, export only onUnload, and clear the private set before invoking listener disposers. Start/stop refresh UI immediately, with explicit ACTIVE/INACTIVE text. The regression test now models Luna registering onUnload before user actions and checks repeated cleanup. It failed against AVB-003 and passes against fix1. Existing settings smoke test and build pass; local HTTP code marker verified.

Client acceptance remains pending: reload and verify AVB-003-fix1. The old loaded version may emit its cleanup error once during replacement. If reload cannot replace it, a normal TIDAL exit/restart may be needed; do not force kill it or clear plugin storage. Once fix1 is loaded, Start must show ACTIVE before testing native search. Any recurring unload error or unchanged INACTIVE state blocks the milestone.

## AVB-003-fix2: Host cleanup and search shape diagnostics

User evidence: fix1 emitted the nonempty unloads warning and received three search success events but collected zero albums. This proves event delivery, not correct payload parsing or absence of the releases. The stopped state is expected after Stop.

Source diagnosis: LunaPlugin registers onUnload in its fallback _unloads if exports.unloads is absent, while unload() drains exports.unloads. The exports setter detects fallback residue. Fix2 exports a dedicated host cleanup set containing the internal cleanup function, but does not export onUnload. Private listener disposers remain separate, so neither recursion nor the fallback path is needed. Old host fallback state may cause a warning during migration; fresh-session verification is required if it persists.

Added bounded in-memory diagnostics: the last six events show root and one-level nested field names, types, array lengths, the expected albums.items shape, and first-item key names when available. No raw payload values, credentials, or search text are displayed or stored by this diagnostic. No speculative alternate parser is introduced. Stop preserves diagnostics; reset clears them.

Verification: build, settings smoke, and observer smoke tests pass. Tests assert exported host cleanup, repeated private cleanup, and distinguish missing albums.items from an empty array. HTTP verifies fix2 is served. Client cleanup behavior and actual event structure remain pending.

Client test: load AVB-003-fix2, Start and confirm ACTIVE, search Currents Tame Impala and open Albums, return, Stop, and capture Search event structure. A normal application restart may be needed to clear the previous version's leftover in-memory host state. Do not clear storage or reinstall Luna.

## AVB-003-diag1: Confirmed search payload mismatch

User screenshot shows three search/SEARCH_RESULT_SUCCESS payloads each containing only query:string; albums.items is undefined. This confirms event delivery and a mismatch with Luna's declared SearchResultPayload. Zero observed albums is not evidence of zero search results. The screenshot alone does not establish whether lifecycle warnings are gone.

Source inspection found search state has no declared result collection. Content has caches, but those cannot be assumed to represent a particular search. The action catalog also explicitly lists route/LOADER_DATA__SEARCH and route/LOADER_DATA__SEARCH--SUCCESS with unknown payloads. This diagnostic adds those two exact events without dispatching them or assuming their shape. No fabricated endpoint or cached-album shortcut is used.

Diagnostics now include event names and bounded structure traversal (depth 4, 60 lines per event, first array entry only, last six events). Scalar payload values are not printed. Nested field names may still reflect runtime map keys, so do not interpret this as a full payload privacy guarantee. No session/auth state is inspected. Unknown nested route payloads are not parsed as albums until client evidence establishes their meaning.

Checks passed: build, settings and observer mock tests, including query-only payload privacy and nested route shape reporting without injecting album results; HTTP marker check. Client event structure remains pending. Test: start observation, search Currents Tame Impala, open Albums, stop, and capture blocks labelled route/LOADER_DATA__SEARCH or its --SUCCESS event. This is diagnostic progress, not completion of search discovery.

## AVB-003-fix3: Source-backed query-cache reading

Diagnostic screenshot confirmed route completion has undefined payload and search success contains query only. Located actual installation using an explicit user path (the sandbox LOCALAPPDATA probe had missed it), then read the packaged configuration and public desktop application bundle. See docs/native-search-evidence.md for sources and findings.

Replaced speculative top-level result reading with the actual query-specific album-list path, read after reducers via microtask. Removed route diagnostics from registration. Build, settings smoke, query-cache regression tests, and local HTTP marker check passed. Client discovery remains pending; user should repeat one native search with fix3. No automatic search or grouping implemented.

## AVB-003-fix3 client acceptance

User screenshots confirm 50 search albums extracted, including 47696788, with 77699617 not observed. The native search observation milestone is accepted. Automatic search execution, exhaustive pagination, artist-list retrieval, and grouping are not verified. Artist-list discovery is the next bounded milestone; see docs/currents-test-case.md. No implementation changed, so build checks were not repeated.

## AVB-004: Artist Albums cache reader (client verification pending)

Added an Artist Albums source panel with manual read button. Visit Tame Impala's artist page and Albums section, then return and read. The existing verified search observer and known-ID lookup remain separate. The artist identity seed is 47696788; list results are not hard-coded. A missing list prompts visiting/reopening the artist page. Coverage is not guaranteed complete.

Validation: build, settings smoke, search observer smoke, pure artist-cache tests, and HTTP AVB-004 marker passed. Artist-cache tests verify artist/source isolation, no seeded membership, deduplication, missing and pending cache, malformed items, and 50-item truncation notice. Source title mapping was checked against the public client's SI adapter. Public HTML still references the inspected bundle.

The old development server was unavailable; a serve-only process was started on port 3000. No client verification or discovery of 77699617 is claimed yet. Next acceptance: screenshot of Artist Albums source including artist ID, matched-list count, and both target ID indicators. Do not proceed to grouping before verification.

## AVB-004 verified in client

The user's screenshot confirms artist 3736815, one matching list and five albums, with Currents 77699617 present and 47696788 absent from this observed list. Artist-source extraction is accepted; source coverage is not guaranteed exhaustive. No code changed after acceptance, so build tests were not repeated. See docs/currents-test-case.md for observed IDs and the next bounded milestone.

## AVB-005: Candidate cards (client acceptance pending)

Added a generic starting-album link/ID input and exact native search phrase input. The new panel reads the corresponding loaded search list and loaded ARTIST_ALBUMS lists for the starting album's artist IDs. It deduplicates by album ID, retains both source labels, and displays cover, original title/version, date, track count, ID and an ordinary TIDAL link. Cover URLs use the source-verified ContentBase.formatCoverUrl helper.

Only explicit source membership admits an ID; the seed lookup supplies matching metadata and never inserts itself. Global album cache supplies metadata only for admitted IDs. Candidates must share an artist ID and match the title after NFKC, whitespace and case normalization. Unknown metadata is counted. The UI reports missing source caches and partial coverage. No fixed Currents IDs are present in the generic collector/panel. Existing diagnostic panels remain below it for troubleshooting.

Scope limitations: manually load both native source pages, then supply the exact query; no automated fetching/pagination, persistence, Other Versions integration, suffix normalization, audio equivalence, MQA or Atmos feature. Different mix/deluxe titles are deliberately not grouped yet. This is the candidate-list milestone, not the finished one-click plugin.

Validation passed: build, existing settings/search/artist regression tests, new candidate tests (deduplication, combined provenance, same-title wrong-artist exclusion, derivative-title exclusion, no seed injection, whitespace/case handling, URL validation), and HTTP AVB-005 marker. Visual rendering and combined real-client results remain pending.

Acceptance: reload AVB-005, search Currents Tame Impala in TIDAL and open Albums results, visit Tame Impala Albums, then promptly return. Enter 47696788 and the exact search phrase, click Show candidate versions. Expected from previous source tests: 47696788 labelled Search and 77699617 labelled Artist Albums. Availability/cache expiry may affect this; report source status if a card is missing. Do not run another build milestone until this is verified.
