import Quickshell
import Quickshell.Io
import Quickshell.Wayland
import QtQuick

/**
 * shell.qml
 * Standalone Quickshell entry point for TokenHawk.
 *
 * Native Desktop & Wayland LayerShell Requirements Handled:
 * 1. Transparent outer window (`color: "transparent"`).
 * 2. Visibility above normal application windows across workspaces (`WlrLayershell.layer: WlrLayer.Top`).
 * 3. Zero keyboard-focus stealing (`WlrLayershell.keyboardFocus: WlrKeyboardFocus.None`).
 * 4. Intentional input region (`mask: Region { item: overlayWidget }`) so transparent margins
 *    never block pointer clicks on underlying windows.
 * 5. Session lock safety: `WlrLayer.Top` stays below `ext-session-lock-v1` / `WlrLayer.Overlay`
 *    lock surfaces so quota balances never render above the lock screen.
 * 6. Data/Rendering separation: Loads normalized JSON fixture or `services/ai-usage` output
 *    via `FileView` rather than polling individual AI providers from QML.
 *
 * NOTE: Do NOT install or activate this file on the live desktop automatically.
 * Test in isolation with `quickshell -p ./quickshell/shell.qml`.
 */
ShellRoot {
    id: root

    property var loadedInstruments: []

    FileView {
        id: fixtureFile
        path: Qt.resolvedUrl("./fixtures/sample_instruments.json")
        watchChanges: true
        onLoaded: {
            try {
                var parsed = JSON.parse(fixtureFile.text())
                if (parsed && Array.isArray(parsed.instruments)) {
                    root.loadedInstruments = parsed.instruments
                }
            } catch (err) {
                console.warn("TokenHawk QML: Failed to parse fixture JSON:", err)
            }
        }
    }

    Variants {
        model: Quickshell.screens

        PanelWindow {
            id: panelWindow
            required property var modelData
            screen: modelData

            anchors {
                top: true
                right: true
            }

            margins {
                top: 16
                right: 16
            }

            implicitWidth: overlayWidget.width + 8
            implicitHeight: overlayWidget.height + 8
            color: "transparent"

            // Wayland LayerShell configuration
            WlrLayershell.namespace: "tokenhawk-quota-overlay"
            WlrLayershell.layer: WlrLayer.Top
            WlrLayershell.keyboardFocus: WlrKeyboardFocus.None
            exclusionMode: ExclusionMode.Ignore

            // Intentional input mask: only the visible widget surface receives pointer events
            mask: Region {
                item: overlayWidget
            }

            TokenHawkOverlay {
                id: overlayWidget
                anchors.centerIn: parent
                instruments: root.loadedInstruments
                rotationMode: "group"
                windowMode: "long"
                prepaidTreatment: "digital_readout"
                glassOpacity: 0.88
            }
        }
    }
}
