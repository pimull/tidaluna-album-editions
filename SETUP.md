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
- No TIDAL installation was found at the default LOCALAPPDATA/TIDAL location; no running TIDAL process was found. A custom installation is still possible.
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

## Verification and blocker

Official template cloned successfully. Dependency installation attempted with:

```powershell
pnpm install --store-dir ../../work/pnpm-store
```

Installation failed with ERR_PNPM_EPERM when pnpm tried to create a dependency symlink (undici-types). Dependencies are incomplete. Build, watch server, and in-client behavior have NOT been verified. Do not treat this as a working plugin milestone.

Next, investigate a project-local installation layout that avoids this symlink failure, or verify Windows symlink permissions. Do not delete existing files or change system settings without approval.

After dependency installation succeeds, run:

```powershell
pnpm run build
pnpm run watch
```

According to the official README, the DEV store should appear in Luna Settings > Plugin Store while watch is running. Load Example and verify the greeting and settings switch. The unchanged example also logs page changes and shows an alert on media transitions. Stop the development server with Ctrl+C.

Only advance after the build and client smoke test succeed. A build alone does not prove that the plugin loads in TIDAL.

## Boundaries

No remote repository was created, no code was pushed or published, and no PR was submitted. No TIDAL collection or installed application was modified. Subsequent implementation should use small, verified commits and English code/documentation, with Chinese explanations in chat.
