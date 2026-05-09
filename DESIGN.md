---
name: Industrial Slate
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#bacac5'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#859490'
  outline-variant: '#3c4a46'
  surface-tint: '#3cddc7'
  primary: '#57f1db'
  on-primary: '#003731'
  primary-container: '#2dd4bf'
  on-primary-container: '#00574d'
  inverse-primary: '#006b5f'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#afe0ff'
  on-tertiary: '#00354a'
  tertiary-container: '#5ec9ff'
  on-tertiary-container: '#005371'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#62fae3'
  primary-fixed-dim: '#3cddc7'
  on-primary-fixed: '#00201c'
  on-primary-fixed-variant: '#005047'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#c4e7ff'
  tertiary-fixed-dim: '#7bd0ff'
  on-tertiary-fixed: '#001e2c'
  on-tertiary-fixed-variant: '#004c69'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  display-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  title-sm:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
    letterSpacing: 0.1em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  container-max: 1600px
---

## Brand & Style

This design system is engineered for the high-stakes environment of maritime logistics and vessel management. It prioritizes operational efficiency, data density, and mission-critical clarity. The aesthetic is "Industrial Tech"—merging the rugged reliability of maritime hardware with the sophisticated precision of modern aerospace interfaces.

The UI utilizes a **Dark Industrial** style with strategic **Glassmorphism**. Priority information is elevated through translucent surfaces that suggest a multi-layered "heads-up display" (HUD). The emotional response is one of calm control, professional authority, and technical accuracy. It avoids decorative elements in favor of functional high-fidelity components that remain legible under the fluctuating lighting conditions of a ship's bridge or a command center.

## Colors

The palette is anchored by **Deep Navy (#0f172a)** to minimize eye strain during long watches and night operations. **Neon Teal (#2dd4bf)** serves as the primary action and data highlight color, providing maximum contrast against the dark base for interactive elements and active status paths.

**Slate Grays (#64748b)** are utilized for secondary information, metadata, and inactive states to maintain a clear visual hierarchy. For functional signaling, the system employs a high-visibility semantic set: Teal for nominal operations, Sky Blue for secondary data, Amber for warnings, and Rose for critical alerts or vessel emergencies. Glass surfaces use a semi-transparent version of the Slate palette to maintain context with the layers beneath.

## Typography

This design system uses a dual-font approach to balance readability with technical precision. 

**Inter** is the primary workhorse for body text, navigation, and general UI labels, chosen for its exceptional legibility in high-density layouts. **JetBrains Mono** is reserved for headlines, data points (lat/long, timestamps, fuel levels), and status indicators. The monospaced nature of the data-heavy elements ensures that numerical values do not "jump" or shift when live-updating, which is critical for real-time maritime monitoring. 

Use `label-caps` for table headers and small metadata categories to evoke a "technical spec sheet" feel.

## Layout & Spacing

The design system employs a **Fluid-Fixed Hybrid Grid**. The sidebar and utility panels occupy fixed widths, while the central command area scales to fit the viewport. A strict 4px base unit ensures mathematical alignment of compact data cards.

- **Desktop (1440px+):** 12-column grid, 16px gutters, 24px outer margins. Use "Data Clusters" to group related metrics.
- **Tablet (768px-1439px):** 8-column grid, 12px gutters. Priority cards expand to full-width or half-width.
- **Mobile (Below 768px):** 4-column grid. All high-density tables reflow into vertical list cards.

Information density is "High." Whitespace is used only to separate distinct functional groups, not for decorative breathing room.

## Elevation & Depth

Depth in this design system is achieved through **Tonal Stacking** and **Glassmorphism**, rather than traditional drop shadows.

1.  **Level 0 (Background):** The deepest Navy (#020617), representing the base "vessel" or "environment."
2.  **Level 1 (Panels):** Slightly lighter Slate (#0f172a) with 1px solid borders (#1e293b).
3.  **Level 2 (Priority Cards):** Glassmorphic surfaces using a 40% opaque Slate background, a 16px backdrop blur, and a subtle 1px "inner glow" border (#5eead4 at 20% opacity).
4.  **Level 3 (Overlays/Modals):** High-opacity glass with a distinct Teal-tinted shadow (0px 8px 24px rgba(45, 212, 191, 0.15)) to signal immediate interaction required.

All borders are thin (1px) to maintain the industrial, high-precision aesthetic.

## Shapes

The shape language is **Soft-Industrial**. We avoid perfectly sharp corners to prevent the UI from feeling aggressive, but we also avoid high-radius "pill" shapes that feel too consumer-focused. 

A consistent `0.25rem` (4px) radius is applied to buttons, input fields, and standard cards. Larger priority containers may use `rounded-lg` (8px) to subtly differentiate them from the smaller technical data grid. This minimal rounding mimics the machined edges of maritime hardware and control consoles.

## Components

- **Buttons:** Primary buttons are solid Neon Teal with Navy text for maximum contrast. Secondary buttons are "Ghost" style with a Teal border and Teal text.
- **Status Indicators:** Small, circular "pips" with a 2px outer glow (bloom) in the color of the status (Teal, Amber, Rose). These must always be paired with a text label for accessibility.
- **Data Cards:** Compact, border-heavy containers. Use a "Header-Value-Trend" layout. The "Value" should use JetBrains Mono for technical emphasis.
- **Input Fields:** Darker than the surface they sit on, with a Neon Teal 2px bottom border on focus. 
- **Glassmorphic Priority Cards:** Reserved for the "Primary Vessel Status" or "Active Alert" to separate them visually from the static grid panels.
- **Telemetry Sparklines:** Minimal, high-contrast lines without axes, colored according to the data health (e.g., Teal for steady, Rose for volatile).
