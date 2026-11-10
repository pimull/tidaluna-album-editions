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
