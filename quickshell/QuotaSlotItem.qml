import QtQuick
import QtQuick.Layouts

/**
 * QuotaSlotItem.qml
 * Whole-assembly provider slot combining:
 * - Decoupled ObservationStatus badge ('STALE', 'AUTH', 'FAIL') + CapacityState
 * - Primary numeric/dollar reading & period badge
 * - MeterHousing component
 * - Provider identity badge (with honest 2-letter monospaced initials fallback)
 * - Reset countdown label
 */
Item {
    id: slotRoot

    property var itemData: ({})
    property string windowMode: "long"
    property string prepaidTreatment: "digital_readout"
    property bool isPinned: false

    width: 68
    height: 162

    readonly property string obsStatus: itemData.observationStatus || "working"
    readonly property string capState: itemData.capacityState || "nominal"
    readonly property string measMode: itemData.measurementMode || "percentage"

    ColumnLayout {
        anchors.fill: parent
        spacing: 2

        // 1. Observation Status Badge (Coexists with 0% exhausted capacityState)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            height: 13
            width: statusText.implicitWidth + 8
            radius: 3
            visible: slotRoot.obsStatus !== "working" || slotRoot.isPinned
            color: {
                if (slotRoot.obsStatus === "stale") return "#451a03"
                if (slotRoot.obsStatus === "auth_required" || slotRoot.obsStatus === "failing") return "#4c0519"
                return "#14532d"
            }
            border.width: 1
            border.color: {
                if (slotRoot.obsStatus === "stale") return "#d97706"
                if (slotRoot.obsStatus === "auth_required" || slotRoot.obsStatus === "failing") return "#e11d48"
                return "#76b900"
            }

            Text {
                id: statusText
                anchors.centerIn: parent
                text: {
                    if (slotRoot.obsStatus === "stale") return "STALE"
                    if (slotRoot.obsStatus === "auth_required") return "AUTH"
                    if (slotRoot.obsStatus === "failing") return "FAIL"
                    return "PIN"
                }
                font.family: "JetBrains Mono"
                font.pixelSize: 8
                font.bold: true
                color: "#f8fafc"
            }
        }

        // 2. Primary Reading (Tabular Monospace)
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: itemData.primaryDisplay || "--"
            font.family: "JetBrains Mono"
            font.pixelSize: 11
            font.bold: true
            color: {
                if (slotRoot.capState === "exhausted") return "#f87171"
                if (slotRoot.measMode === "prepaid_no_max") return "#a5b4fc"
                if (slotRoot.measMode === "personal_budget") return "#c4b5fd"
                if (slotRoot.capState === "warning") return "#fbbf24"
                return "#10b981"
            }
        }

        // 3. Period / Classification Label ('WEEKLY', 'INCLUDED', 'PREPAID', 'CAP', 'BUDGET', 'METERED')
        Text {
            Layout.alignment: Qt.AlignHCenter
            text: itemData.periodLabel || "WEEKLY"
            font.family: "JetBrains Mono"
            font.pixelSize: 8
            font.bold: slotRoot.measMode === "enforced_cap" || slotRoot.measMode === "personal_budget"
            color: slotRoot.measMode === "enforced_cap"
                   ? "#fcd34d"
                   : slotRoot.measMode === "personal_budget"
                   ? "#ddd6fe"
                   : "#94a3b8"
        }

        // 4. Vertical Instrument Housing
        MeterHousing {
            Layout.alignment: Qt.AlignHCenter
            measurementMode: slotRoot.measMode
            windowMode: slotRoot.windowMode
            prepaidTreatment: slotRoot.prepaidTreatment
            capacityState: slotRoot.capState
            observationStatus: slotRoot.obsStatus
            primaryRemaining: itemData.primaryRemaining !== undefined ? itemData.primaryRemaining : 0
            primaryLimit: itemData.primaryLimit !== undefined ? itemData.primaryLimit : 100
            primaryPercent: itemData.primaryPercent !== undefined ? itemData.primaryPercent : 0
            hasCompanion: Boolean(itemData.hasCompanion)
            companionLabel: itemData.companionLabel || "5H"
            companionPercent: itemData.companionPercent !== undefined ? itemData.companionPercent : -1
            companionExhausted: Boolean(itemData.companionExhausted)
        }

        // 5. Provider Badge (Honest 2-Letter Monospaced Initials or Verified SVG)
        Rectangle {
            Layout.alignment: Qt.AlignHCenter
            width: 20
            height: 20
            radius: 5
            color: "#0f172a"
            border.width: 1
            border.color: "#1e293b"

            Text {
                anchors.centerIn: parent
                text: itemData.providerInitials || "AI"
                font.family: "JetBrains Mono"
                font.pixelSize: 9
                font.bold: true
                color: itemData.accentColor || "#e2e8f0"
            }
        }

        // 6. Concise Account Label
        Text {
            Layout.alignment: Qt.AlignHCenter
            Layout.maximumWidth: 64
            elide: Text.ElideRight
            text: itemData.accountLabel || "Account"
            font.family: "Plus Jakarta Sans"
            font.pixelSize: 9
            font.bold: true
            color: "#e2e8f0"
        }

        // 7. Reset Countdown / Status Footer
        Text {
            Layout.alignment: Qt.AlignHCenter
            Layout.maximumWidth: 64
            elide: Text.ElideRight
            text: itemData.resetLabel || "No reset"
            font.family: "JetBrains Mono"
            font.pixelSize: 8
            color: slotRoot.capState === "exhausted" ? "#f87171" : "#94a3b8"
        }
    }
}
