pragma Singleton
import QtQuick

/**
 * TokenHawk Centralized Design Tokens for Qt Quick / Quickshell.
 * Mirrors `lib/tokenhawk/designTokens.ts` 1:1 so Web and QML share identical
 * colors, geometry, typography, and motion timing.
 */
QtObject {
    // Surface & Structural Palette
    readonly property color canvasObsidian: "#07090e"
    readonly property color surfaceHousing: "#0b0f19"
    readonly property color chamberRecessed: "#05070b"
    readonly property color borderStructural: "#1e293b"
    readonly property color borderSubtle: "#0f172a"

    // Typography Colors
    readonly property color textPrimary: "#f1f5f9"
    readonly property color textSecondary: "#94a3b8"
    readonly property color textMuted: "#64748b"

    // Calibrated Capacity Accents
    readonly property color nominalPrimary: "#76b900"
    readonly property color nominalEmerald: "#10b981"
    readonly property color warningAmber: "#f59e0b"
    readonly property color criticalRed: "#ef4444"

    // Companion & Monetary Instrument Accents
    readonly property color companionCyan: "#06b6d4"
    readonly property color prepaidIndigo: "#818cf8"
    readonly property color budgetViolet: "#a78bfa"
    readonly property color meteredSlate: "#64748b"

    // Geometry & Slot Dimensions (Logical Pixels, DPI-scaled automatically by Qt)
    readonly property int compactSlotWidth: 68
    readonly property int compactSlotGap: 10
    readonly property int compactMeterHeight: 92
    readonly property int compactMeterWidth: 26
    readonly property real stackedUpperRatio: 0.33
    readonly property int stackedSeparatorHeight: 4
    readonly property int companionTrackWidth: 5
    readonly property int widgetPadding: 12
    readonly property int widgetRadius: 16
    readonly property int meterRadius: 6

    // Typography Families
    readonly property string fontSans: "Plus Jakarta Sans"
    readonly property string fontMono: "JetBrains Mono"

    // Default Display Preferences
    readonly property real defaultGlassOpacity: 0.88
    readonly property int defaultGroupIntervalMs: 8000
    readonly property int defaultRelayIntervalMs: 3000
}
