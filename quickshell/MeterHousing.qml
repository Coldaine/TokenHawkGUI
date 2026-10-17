import QtQuick
import QtQuick.Layouts

/**
 * MeterHousing.qml
 * Reusable vertical instrument chamber supporting:
 * - Long-period only ('long', Default)
 * - Vertically stacked ('stacked': upper 33% short window + 4px collar + lower 62% primary)
 * - Overlaid companion ('companion': full-height primary + 5px right-edge track)
 * - Monetary modes: 'included_credit', 'prepaid_no_max' (Alt A & Alt B), 'enforced_cap',
 *   'personal_budget', and 'metered_uncapped'.
 */
Rectangle {
    id: root

    property string measurementMode: "percentage"
    property string windowMode: "long"
    property string prepaidTreatment: "digital_readout"
    property string capacityState: "nominal"
    property string observationStatus: "working"

    // Nullable-safe readings (-1 indicates null / unobserved / unbounded in QML JSON model)
    property real primaryRemaining: 62
    property real primaryLimit: 100
    property real primaryPercent: 62
    property bool hasCompanion: false
    property string companionLabel: "5H"
    property real companionPercent: -1
    property bool companionExhausted: false

    width: 26
    height: 92
    radius: 6
    color: "#05070b"
    border.width: 1
    border.color: {
        if (observationStatus === "auth_required" || observationStatus === "failing")
            return "#991b1b"
        if (observationStatus === "stale")
            return "#b45309"
        if (measurementMode === "personal_budget")
            return "#6d28d9"
        if (measurementMode === "enforced_cap")
            return "#d97706"
        return "#1e293b"
    }
    clip: true

    function fillColorForPct(pct, isShort) {
        if (pct <= 0) return "#ef4444"
        if (isShort) return pct <= 20 ? "#f59e0b" : "#06b6d4"
        if (measurementMode === "personal_budget") return "#a78bfa"
        if (pct <= 25) return "#ef4444"
        if (pct <= 50) return "#f59e0b"
        return "#76b900"
    }

    // 1. PREPAID BALANCE WITH NO KNOWN MAXIMUM (No fake percentage bar)
    Loader {
        anchors.fill: parent
        anchors.margins: 2
        active: root.measurementMode === "prepaid_no_max"
        sourceComponent: root.prepaidTreatment === "split_counter" ? splitCounterComp : digitalReadoutComp
    }

    Component {
        id: digitalReadoutComp
        Rectangle {
            radius: 4
            color: "#111428"
            border.width: 1
            border.color: "#312e81"

            ColumnLayout {
                anchors.fill: parent
                anchors.margins: 3
                spacing: 2

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "USD"
                    font.family: "JetBrains Mono"
                    font.pixelSize: 7
                    font.bold: true
                    color: "#a5b4fc"
                }

                Item { Layout.fillHeight: true }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "$" + Math.floor(Math.max(0, root.primaryRemaining))
                    font.family: "JetBrains Mono"
                    font.pixelSize: 9
                    font.bold: true
                    color: "#f1f5f9"
                }

                Text {
                    Layout.alignment: Qt.AlignHCenter
                    text: "." + Math.round((Math.max(0, root.primaryRemaining) % 1) * 100).toString().padStart(2, "0")
                    font.family: "JetBrains Mono"
                    font.pixelSize: 8
                    font.bold: true
                    color: "#a5b4fc"
                }

                Item { Layout.fillHeight: true }

                // Understated bottom framing bar (not a quantitative scale)
                Rectangle {
                    Layout.alignment: Qt.AlignHCenter
                    width: 10
                    height: 2
                    radius: 1
                    color: "#4f46e5"
                }
            }
        }
    }

    Component {
        id: splitCounterComp
        ColumnLayout {
            spacing: 1
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                radius: 3
                color: "#0f172a"
                border.width: 1
                border.color: "#1e293b"
                Column {
                    anchors.centerIn: parent
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: "$"
                        font.family: "JetBrains Mono"
                        font.pixelSize: 6
                        color: "#94a3b8"
                    }
                    Text {
                        anchors.horizontalCenter: parent.horizontalCenter
                        text: Math.floor(Math.max(0, root.primaryRemaining)).toString()
                        font.family: "JetBrains Mono"
                        font.pixelSize: 9
                        font.bold: true
                        color: "#ffffff"
                    }
                }
            }
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 30
                radius: 3
                color: "#1e1b4b"
                border.width: 1
                border.color: "#3730a3"
                Text {
                    anchors.centerIn: parent
                    text: "." + Math.round((Math.max(0, root.primaryRemaining) % 1) * 100).toString().padStart(2, "0")
                    font.family: "JetBrains Mono"
                    font.pixelSize: 8
                    font.bold: true
                    color: "#a5b4fc"
                }
            }
        }
    }

    // 2. UNCAPPED PAY-AS-YOU-GO (METERED) — No invented remaining capacity
    Rectangle {
        anchors.fill: parent
        anchors.margins: 2
        radius: 4
        visible: root.measurementMode === "metered_uncapped"
        color: "#0b0f19"
        border.width: 1
        border.color: "#1e293b"

        ColumnLayout {
            anchors.fill: parent
            anchors.margins: 2
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "PAYG"
                font.family: "JetBrains Mono"
                font.pixelSize: 6
                font.bold: true
                color: "#94a3b8"
            }
            Item { Layout.fillHeight: true }
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "M\nE\nT\nR"
                horizontalAlignment: Text.AlignHCenter
                font.family: "JetBrains Mono"
                font.pixelSize: 6
                font.bold: true
                color: "#cbd5e1"
            }
            Item { Layout.fillHeight: true }
            Text {
                Layout.alignment: Qt.AlignHCenter
                text: "OPEN"
                font.family: "JetBrains Mono"
                font.pixelSize: 6
                color: "#64748b"
            }
        }
    }

    // 3. PROPORTIONAL METERS (Long-period, Stacked, or Overlaid Companion)
    Item {
        anchors.fill: parent
        anchors.margins: 2
        visible: root.measurementMode !== "prepaid_no_max" && root.measurementMode !== "metered_uncapped"

        // Mode B: Vertically Stacked (Upper short compartment + Collar + Lower primary compartment)
        ColumnLayout {
            anchors.fill: parent
            spacing: 0
            visible: root.windowMode === "stacked" && root.hasCompanion

            // Upper Short Window Compartment (33%)
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: Math.round(parent.height * 0.33)
                color: "#05070b"
                clip: true

                Rectangle {
                    anchors.bottom: parent.bottom
                    width: parent.width
                    height: root.companionPercent <= 0
                            ? 2
                            : Math.max(4, Math.round(parent.height * (root.companionPercent / 100.0)))
                    color: root.fillColorForPct(root.companionPercent, true)
                }

                Text {
                    anchors.top: parent.top
                    anchors.topMargin: 1
                    anchors.horizontalCenter: parent.horizontalCenter
                    text: root.companionLabel
                    font.family: "JetBrains Mono"
                    font.pixelSize: 6
                    font.bold: true
                    color: root.companionExhausted ? "#fca5a5" : "#a5f3fc"
                }
            }

            // Structural Separator Collar (Prevents additive confusion)
            Rectangle {
                Layout.fillWidth: true
                Layout.preferredHeight: 4
                color: "#0b0f19"
                border.width: 1
                border.color: "#334155"
            }

            // Lower Primary Compartment (62%)
            Rectangle {
                Layout.fillWidth: true
                Layout.fillHeight: true
                color: "#05070b"
                clip: true

                Rectangle {
                    anchors.bottom: parent.bottom
                    width: parent.width
                    height: root.primaryPercent <= 0
                            ? 3
                            : Math.max(5, Math.round(parent.height * (root.primaryPercent / 100.0)))
                    radius: 2
                    color: root.fillColorForPct(root.primaryPercent, false)
                }
            }
        }

        // Mode A & C: Single Full-Height or Overlaid Right-Edge Companion
        RowLayout {
            anchors.fill: parent
            spacing: 2
            visible: !(root.windowMode === "stacked" && root.hasCompanion)

            // Main Primary Fill Chamber
            Item {
                Layout.fillWidth: true
                Layout.fillHeight: true

                Rectangle {
                    anchors.bottom: parent.bottom
                    width: parent.width
                    height: root.primaryPercent <= 0
                            ? 3
                            : Math.max(5, Math.round(parent.height * (root.primaryPercent / 100.0)))
                    radius: 3
                    color: root.fillColorForPct(root.primaryPercent, false)

                    // Liquid Meniscus Highlight
                    Rectangle {
                        anchors.top: parent.top
                        width: parent.width
                        height: 2
                        radius: 1
                        color: "#d9ffffff"
                    }
                }
            }

            // Narrow Companion Track along Right Edge (Only in 'companion' mode)
            Rectangle {
                Layout.preferredWidth: 5
                Layout.fillHeight: true
                visible: root.windowMode === "companion" && root.hasCompanion
                color: "#05070b"
                border.width: 1
                border.color: "#1e293b"

                Rectangle {
                    anchors.bottom: parent.bottom
                    width: parent.width
                    height: root.companionPercent <= 0
                            ? 4
                            : Math.max(6, Math.round(parent.height * (root.companionPercent / 100.0)))
                    color: root.companionExhausted ? "#ef4444" : "#06b6d4"

                    // Top non-color marker pip
                    Rectangle {
                        anchors.top: parent.top
                        width: parent.width
                        height: 2
                        color: "#ffffff"
                    }
                }
            }
        }
    }
}
