# TokenHawk Quickshell / Qt Quick (QML) Implementation

This directory contains the native Qt Quick / Quickshell implementation of TokenHawk (`shell.qml`, `TokenHawkOverlay.qml`, `QuotaSlotItem.qml`, `MeterHousing.qml`, and `ThemeTokens.qml`).

## Safety & Desktop Non-Interference
- **Nothing in this repository modifies your live Hyprland, Omarchy, or systemd configuration.**
- Do not copy these files into `~/.config/quickshell/` until you have reviewed and tested them in isolation.

## Standalone Isolated Verification
Run the overlay against the bundled 8-account fixture (`./fixtures/sample_instruments.json`) without connecting to live provider accounts:

```bash
quickshell -p ./quickshell/shell.qml
```

## Architecture & Native Requirements Handled
1. **Transparent Surface**: `PanelWindow` uses `color: "transparent"`, while `TokenHawkOverlay.qml` applies `Qt.rgba(11/255, 15/255, 25/255, glassOpacity)`.
2. **Workspace Persistence**: `WlrLayershell.layer: WlrLayer.Top` keeps the instrument visible above ordinary application windows across workspaces.
3. **Zero Focus Stealing**: `WlrLayershell.keyboardFocus: WlrKeyboardFocus.None` prevents the overlay from intercepting typing in active editors or terminals.
4. **Intentional Input Mask**: `mask: Region { item: overlayWidget }` restricts pointer hit-testing strictly to the compact widget bounds so transparent margins never block clicks on underlying windows.
5. **Session Lock Safety**: `WlrLayer.Top` renders below `ext-session-lock-v1` / `WlrLayer.Overlay` lock surfaces so quota balances are never exposed above the lock screen.
6. **Data / Rendering Separation**: `shell.qml` reads normalized JSON from `FileView` (populated either by `sample_instruments.json` or by a background poller reading `services/ai-usage`), keeping HTTP/collector logic completely out of QML rendering components.
