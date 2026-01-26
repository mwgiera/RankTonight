# Design Guidelines: Platform Ranker for Drivers

## Brand Identity

**Purpose**: Help multi-platform drivers make instant, data-driven decisions about which platform to drive for right now to maximize earnings.

**Aesthetic Direction**: Dashboard/Cockpit - Bold, utilitarian, and confidence-inspiring. This is a professional tool for working drivers, not a consumer social app. Think: clear hierarchy, decisive recommendations, speed over decoration. High contrast, immediate readability at a glance (even while driving at stoplights).

**Memorable Element**: The live recommendation card with animated confidence indicators - drivers should feel like they have a real-time earnings radar.

## Navigation Architecture

**Root Navigation**: Tab Bar (4 tabs)
1. **Now** - Current platform recommendation
2. **Zones** - Zone-based insights
3. **Log** - Manual earnings input
4. **Profile** - Settings and preferences

**No Authentication Required** (single-user utility app). Profile screen includes avatar customization and app preferences only.

## Color Palette

**Primary**: `#FF6B2C` (Vibrant Orange) - Urgent, action-oriented, high visibility  
**Success**: `#00C853` (Bold Green) - Strong recommendation, go signal  
**Warning**: `#FFC107` (Amber) - Medium confidence  
**Danger**: `#F44336` (Red) - Avoid this platform now  

**Background**: `#0A0E14` (Deep Navy-Black) - Reduces eye strain, dashboard feel  
**Surface**: `#1A1F2E` (Elevated Dark) - Cards and containers  
**Surface Light**: `#252B3D` - Secondary surfaces  

**Text Primary**: `#FFFFFF`  
**Text Secondary**: `#8A92A3`  
**Border**: `#2A3142`

## Typography

**Font**: System default (SF Pro for iOS, Roboto for Android) - Maximum legibility  
**Scale**:
- **Hero**: 48pt Bold (platform name on recommendation card)
- **H1**: 28pt Bold (screen titles)
- **H2**: 20pt Semibold (section headers)
- **Body**: 16pt Regular
- **Caption**: 14pt Regular
- **Small**: 12pt Medium (metadata, timestamps)

## Screen-by-Screen Specifications

### 1. Now (Tab 1) - Main Dashboard
**Purpose**: Show the current best platform to drive for with confidence level.

**Layout**:
- Header: Transparent, title "Now", right button for zone selector
- Main content: Scrollable
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Current time/date header (small, secondary text)
- **Recommendation Card** (primary focus):
  - Platform name (Hero typography)
  - Confidence bar (animated, color-coded: green/amber/red)
  - Confidence label: "Strong" / "Medium" / "Weak"
  - Score breakdown (demand, friction, incentives, reliability as horizontal bar segments)
- **Alternative Platforms List** (below card):
  - Ranked list cards showing 2nd, 3rd place platforms
  - Each shows platform name, score difference from #1, simple bar indicator
- Quick action button: "Log Earnings" (bottom floating button)

**Floating Elements**:
- "Log Earnings" FAB (bottom-right, uses exact shadow specs from guidelines)

### 2. Zones (Tab 2)
**Purpose**: Browse recommendations by zone/area.

**Layout**:
- Header: Transparent, title "Zones", no buttons
- Main content: Scrollable list
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Zone category filters (horizontal scrollable chips: Airport, Center, Residential, All)
- Zone list:
  - Each zone card shows:
    - Zone name
    - Current top platform (icon + name)
    - Demand indicator (fire icon + level: High/Medium/Low)
    - Friction indicator (traffic icon + level)
- Tap zone → navigates to Zone Detail screen

### 3. Zone Detail (Stack Screen, Modal)
**Purpose**: Deep dive into a specific zone's platform rankings.

**Layout**:
- Header: Default navigation with back button, zone name as title
- Main content: Scrollable
- Top inset: Spacing.xl
- Bottom inset: insets.bottom + Spacing.xl

**Components**:
- Time selector (horizontal scroll: Now, +1hr, +2hr, Evening, Night)
- Platform ranking cards (stacked vertically):
  - Platform name
  - Score with breakdown visualization
  - Expected demand/friction/incentives as mini-bar charts
- Historical trend chart (optional, simple line graph)

### 4. Log (Tab 3) - Earnings Input
**Purpose**: Manually log earnings to improve recommendations.

**Layout**:
- Header: Transparent, title "Log Earnings"
- Main content: Scrollable form
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Recent logs list (top section, collapsible):
  - Each entry: Platform icon, amount, zone, timestamp
- **Quick Log Form**:
  - Platform picker (segmented control or dropdown)
  - Amount input (large, numeric keypad)
  - Zone picker
  - Time period selector (Last Hour, Last 2 Hours, Custom)
  - Submit button (full-width, primary color)
- Empty state: "No earnings logged yet" with illustration

### 5. Profile (Tab 4)
**Purpose**: App settings and user preferences.

**Layout**:
- Header: Transparent, title "Profile"
- Main content: Scrollable
- Top inset: headerHeight + Spacing.xl
- Bottom inset: tabBarHeight + Spacing.xl

**Components**:
- Avatar + name (top, editable)
- Preferences section:
  - Preferred zones (multi-select)
  - Notification preferences (toggle: "Alert when top platform changes")
  - Temperature (τ) slider: "Recommendation confidence threshold"
- About section:
  - Model version
  - Data last updated timestamp
  - Clear data button

## Visual Design Principles

- All touchable elements have 50% opacity press feedback
- Platform recommendation card has subtle pulse animation when confidence is "Strong"
- Confidence bars use gradient fills (Success for strong, Warning for medium, Danger for weak)
- Icons: Feather icons from @expo/vector-icons
- Cards have 16pt border radius, 1px border with Border color
- Floating action button shadow: shadowOffset width 0 height 2, shadowOpacity 0.10, shadowRadius 2

## Assets to Generate

1. **icon.png** - App icon: Stylized speedometer/gauge with orange needle pointing up-right. Dark background with orange accent.
   - WHERE USED: Device home screen

2. **splash-icon.png** - Simplified version of app icon for splash screen
   - WHERE USED: App launch screen

3. **empty-logs.png** - Illustration of a notebook/clipboard with checkmark, orange accent
   - WHERE USED: Log screen when no earnings logged yet

4. **avatar-preset.png** - Simple driver avatar (generic steering wheel icon or driver silhouette)
   - WHERE USED: Profile screen default avatar

5. **platform-icons** (bolt.png, uber.png, freenow.png) - Simple, recognizable logos in monochrome white
   - WHERE USED: Throughout app for platform identification

All illustrations: Minimalist line art style, 2-color (white + primary orange), dark backgrounds, no gradients.