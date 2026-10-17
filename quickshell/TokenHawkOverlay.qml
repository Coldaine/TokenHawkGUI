import QtQuick
import QtQuick.Layouts

/**
 * TokenHawkOverlay.qml
 * Portable 3-position rotating quota overlay widget for Quickshell.
 * - Supports Group (8s), Relay (3s left-to-right), and Favorite (1 pinned + 2 rotating).
 * - Handles partially filled final groups (e.g. 8 accounts in 3 positions -> [3, 3, 2]).
 * - Automatically pauses rotation on pointer hover or expanded inventory view,
 *   resuming with a full reading interval.
 */
Rectangle {
    id: overlayRoot

    property var instruments: []
    property string rotationMode: "group" // 'group' | 'relay' | 'favorite'
    property int rotationIntervalMs: rotationMode === "relay" ? 3000 : 8000
    property string pinnedInstrumentId: "anth-work-max"
    property string windowMode: "long"
    property string prepaidTreatment: "digital_readout"
    property real glassOpacity: 0.88

    property bool isManuallyPaused: false
    property bool isExpanded: false
    property int groupPage: 0
    property int relayNextSlot: 0
    property int relayCursor: 3
    property var relayIndices: [0, 1, 2]

    readonly property bool isRotationPaused: hoverHandler.hovered || isManuallyPaused || isExpanded || instruments.length <= 3
    readonly property int totalGroupPages: Math.max(1, Math.ceil(instruments.length / 3))

    width: isExpanded ? 310 : 248
    height: mainLayout.implicitHeight + 24
    radius: 16
    color: Qt.rgba(11 / 255, 15 / 255, 25 / 255, glassOpacity)
    border.width: 1
    border.color: Qt.rgba(51 / 255, 65 / 255, 85 / 255, Math.min(1.0, glassOpacity + 0.15))

    HoverHandler {
        id: hoverHandler
    }

    // Deterministic rotation timer: restarting on unpause guarantees a full reading interval
    Timer {
        id: rotationTimer
        interval: overlayRoot.rotationIntervalMs
        repeat: true
        running: !overlayRoot.isRotationPaused
        onTriggered: overlayRoot.stepForward()
    }

    function stepForward() {
        if (instruments.length <= 3) return
        if (rotationMode === "group" || rotationMode === "favorite") {
            groupPage = (groupPage + 1) % totalGroupPages
        } else if (rotationMode === "relay") {
            var nextArr = relayIndices.slice()
            nextArr[relayNextSlot] = relayCursor % instruments.length
            relayIndices = nextArr
            relayNextSlot = (relayNextSlot + 1) % 3
            relayCursor = (relayCursor + 1) % instruments.length
        }
    }

    function stepBackward() {
        if (instruments.length <= 3) return
        groupPage = (groupPage - 1 + totalGroupPages) % totalGroupPages
    }

    function slotItemAt(slotIndex) {
        if (!instruments || instruments.length === 0) return null
        if (rotationMode === "relay") {
            var rIdx = relayIndices[slotIndex]
            return rIdx < instruments.length ? instruments[rIdx] : null
        }
        var idx = (groupPage * 3) + slotIndex
        return idx < instruments.length ? instruments[idx] : null
    }

    ColumnLayout {
        id: mainLayout
        anchors.fill: parent
        anchors.margins: 12
        spacing: 8

        // Header Bar: Title, Group Counter, Prev/Pause/Next, Expand Toggle
        RowLayout {
            Layout.fillWidth: true
            spacing: 6

            Text {
                text: "TOKENHAWK"
                font.family: "JetBrains Mono"
                font.pixelSize: 10
                font.bold: true
                color: "#e2e8f0"
            }

            Text {
                text: overlayRoot.rotationMode === "group"
                      ? "GRP " + (overlayRoot.groupPage + 1) + "/" + overlayRoot.totalGroupPages
                      : overlayRoot.rotationMode.toUpperCase()
                font.family: "JetBrains Mono"
                font.pixelSize: 9
                color: "#94a3b8"
            }

            Item { Layout.fillWidth: true }

            // Previous Button
            Rectangle {
                width: 18; height: 18; radius: 4
                color: "#0f172a"
                Text { anchors.centerIn: parent; text: "<"; font.family: "JetBrains Mono"; font.pixelSize: 9; color: "#cbd5e1" }
                MouseArea { anchors.fill: parent; onClicked: overlayRoot.stepBackward() }
            }

            // Pause / Resume Toggle
            Rectangle {
                width: 18; height: 18; radius: 4
                color: overlayRoot.isRotationPaused ? "#451a03" : "#0f172a"
                Text {
                    anchors.centerIn: parent
                    text: overlayRoot.isRotationPaused ? ">" : "||"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 8
                    color: overlayRoot.isRotationPaused ? "#fbbf24" : "#cbd5e1"
                }
                MouseArea {
                    anchors.fill: parent
                    onClicked: overlayRoot.isManuallyPaused = !overlayRoot.isManuallyPaused
                }
            }

            // Next Button
            Rectangle {
                width: 18; height: 18; radius: 4
                color: "#0f172a"
                Text { anchors.centerIn: parent; text: ">"; font.family: "JetBrains Mono"; font.pixelSize: 9; color: "#cbd5e1" }
                MouseArea { anchors.fill: parent; onClicked: overlayRoot.stepForward() }
            }

            // Expand Inventory Button
            Rectangle {
                width: 22; height: 18; radius: 4
                color: overlayRoot.isExpanded ? "#14532d" : "#0f172a"
                Text {
                    anchors.centerIn: parent
                    text: overlayRoot.isExpanded ? "3" : "ALL"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 8
                    font.bold: true
                    color: overlayRoot.isExpanded ? "#76b900" : "#cbd5e1"
                }
                MouseArea {
                    anchors.fill: parent
                    onClicked: overlayRoot.isExpanded = !overlayRoot.isExpanded
                }
            }
        }

        // 3-Position Compact Row (Preserves partial final group slots without shifting width)
        RowLayout {
            Layout.alignment: Qt.AlignHCenter
            spacing: 10
            visible: !overlayRoot.isExpanded

            Repeater {
                model: 3
                delegate: Item {
                    width: 68
                    height: 162
                    readonly property var currentData: overlayRoot.slotItemAt(index)

                    QuotaSlotItem {
                        anchors.fill: parent
                        visible: parent.currentData !== null
                        itemData: parent.currentData || ({})
                        windowMode: overlayRoot.windowMode
                        prepaidTreatment: overlayRoot.prepaidTreatment
                    }

                    // Partially filled last group placeholder (e.g., 8 accounts in 3 slots)
                    Rectangle {
                        anchors.fill: parent
                        visible: parent.currentData === null
                        radius: 8
                        color: "transparent"
                        border.width: 1
                        border.color: "#1e293b"
                        Text {
                            anchors.centerIn: parent
                            text: "EMPTY\nSLOT"
                            horizontalAlignment: Text.AlignHCenter
                            font.family: "JetBrains Mono"
                            font.pixelSize: 8
                            color: "#475569"
                        }
                    }
                }
            }
        }

        // Expanded Full Inventory Grid (Pauses rotation automatically)
        GridLayout {
            Layout.alignment: Qt.AlignHCenter
            columns: 4
            rowSpacing: 8
            columnSpacing: 8
            visible: overlayRoot.isExpanded

            Repeater {
                model: overlayRoot.instruments
                delegate: QuotaSlotItem {
                    itemData: modelData
                    windowMode: overlayRoot.windowMode
                    prepaidTreatment: overlayRoot.prepaidTreatment
                }
            }
        }
    }
}
