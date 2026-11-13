# 0.1.0 release candidate

Status: local 0.1.0-rc.1; not published.

## Changes

- Compact cards with consistent typography, covers, spacing and separators.
- Current-album indicator replaces a redundant disabled button.
- Cyan lossless/CD, yellow Hi-Res and blue spatial labels retained.
- Sources, IDs and matching reasons move into expandable Release details.
- Failures retain a visible warning; detailed messages expand on demand.
- Development diagnostics move to About these results.
- Sticky header, outside-click dismissal, Escape and keyboard focus outlines.
- Responsive narrow layout, missing-artwork placeholder and isolated styles.

## Validation

The real built bundle was visually inspected with simulated Moon editions in headless Edge at 1100px and 500px widths. Covers were mock illustrations. No TIDAL desktop interaction was used.

The user confirmed AVB-006.5 eliminated artist HTTP 400 and found both Currents editions with automatic specifications. This candidate retains that logic. Before publishing, check long titles, automatic specs, expanded details, navigation and closing after scrolling in the installed client. Publication requires a separate explicit instruction.
