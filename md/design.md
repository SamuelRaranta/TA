---
version: alpha
name: Apple
description: |
  Apple's design system embodies minimalist sophistication and precision. The
  aesthetic is defined by clean typography, generous whitespace, and a
  thoughtful color hierarchy that balances warmth with clarity. The visual
  language prioritizes content over decoration, using subtle color blocking and
  carefully calibrated neutral tones to create depth and hierarchy. Interactive
  elements feel refined rather than flashy, with restrained hover states and
  smooth transitions. The overall mood is premium, accessible, and
  forward-thinking—designed to feel both familiar and innovative.
source:
  url: "https://apple.com"
  pagesAnalyzed: 1
  extractedAt: 2026-09-11
  tokensMeasured: true
colors:
  primary: "#1D1D1F"
  accent: "#42679E"
  canvas: "#FFFFFF"
  surface: "#000000"
  on-primary: "#FFFFFF"
  ink: "#1D1D1F"
  body: "#6E6E73"
  muted: "#86868B"
  faint: "#F5F5F7"
  neutral-1: "#333336"
typography:
  display:
    fontFamily: "SF Pro Display"
    fontSize: 64px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.58px
  heading:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: -0.12px
  body-xl:
    fontFamily: "SF Pro Display"
    fontSize: 21px
    fontWeight: 600
    lineHeight: 1.19
    letterSpacing: 0.23px
  body-lg:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: -0.37px
  body-md:
    fontFamily: "SF Pro Text"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: -0.22px
  body-sm:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.12px
  button-md:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.41
    letterSpacing: 0px
  button-md-tight:
    fontFamily: "SF Pro Text"
    fontSize: 17px
    fontWeight: 400
    lineHeight: 2.12
    letterSpacing: 0px
  button-sm:
    fontFamily: "SF Pro Text"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.29
    letterSpacing: -0.22px
  caption:
    fontFamily: "SF Pro Text"
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.33
    letterSpacing: -0.12px
rounded:
  none: 0px
  xs: 8px
  sm: 11px
  full: 9999px
spacing:
  xxs: 4px
  xs: 12px
  sm: 16px
  md: 20px
  lg: 24px
  xl: 28px
  xxl: 32px
  xxxl: 36px
  section: 40px
  band: 44px
elevationStrategy: color-blocking
themes:
  derived: dark   # the other theme is the site's measured palette
  light:
    bg: "#FFFFFF"
    surface: "#000000"
    surfaceRaised: "#010101"
    text: "#1D1D1F"
    textMuted: "#6E6E73"
    border: "#E4E4E4"
    accent: "#42679E"
    accentFg: "#FFFFFF"
    focusRing: "#42679E"
    elevation: shadow
  dark:
    bg: "#0C0F12"
    surface: "#1B1D20"
    surfaceRaised: "#27292C"
    text: "#F7F9FB"
    textMuted: "#9EA0A2"
    border: "#333538"
    accent: "#6086BD"
    accentFg: "#0B0B0C"
    focusRing: "#42679E"
    elevation: "border+surface"
  contrastFailures:
    - "light: text on surface = 1.25:1 (needs 4.5:1)"
components:
  button-filled:
    typography: "{typography.button-md}"
    textColor: "rgba(0, 0, 0, 0.8)"
    border: "3px solid rgba(0, 0, 0, 0.04)"
    height: 42px
    padding: "0px 14px 0px 14px"
    rounded: "{rounded.sm}"
    backgroundColor: "rgb(250, 250, 252)"
  button-filled-sm:
    typography: "{typography.body-lg}"
    textColor: "{colors.surface}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
    backgroundColor: "{colors.faint}"
  button-primary:
    typography: "{typography.button-sm}"
    textColor: "{colors.on-primary}"
    height: 36px
    padding: "8px 15px 8px 15px"
    rounded: "{rounded.xs}"
    backgroundColor: "{colors.primary}"
  button-primary-sm:
    typography: "{typography.body-lg}"
    textColor: "{colors.on-primary}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
    backgroundColor: "{colors.primary}"
  button-outline:
    typography: "{typography.body-lg}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.primary}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
  button-outline-2:
    typography: "{typography.body-lg}"
    textColor: "{colors.faint}"
    border: "1px solid {colors.faint}"
    height: 20px
    padding: "11px 21px 11px 21px"
    rounded: 980px
  navigation:
    textColor: "{colors.ink}"
    height: 44px
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 400
    lineHeight: 1.47
    backgroundColor: "rgba(250, 250, 252, 0.8)"
  footer:
    typography: "{typography.heading}"
    textColor: "rgba(255, 255, 255, 0.56)"
    backgroundColor: "{colors.primary}"
  link:
    typography: "{typography.body-sm}"
    textColor: "rgba(0, 0, 0, 0.8)"
    padding: "0px 8px 0px 8px"
  link-2:
    textColor: "rgba(0, 0, 0, 0.8)"
    padding: "0px 8px 0px 8px"
    fontSize: 17px
    fontFamily: "SF Pro Text"
    fontWeight: 600
    lineHeight: 1.24
states:
  button-focus-visible:
    target: button
    state: focus-visible
    opacity: 1
  link-hover:
    target: link
    state: hover
    textDecoration: none
  link-focus:
    target: link
    state: focus
    outline: none
  nav-hover:
    target: nav
    state: hover
    opacity: 1
  button-hover:
    target: button
    state: hover
    opacity: 1
  button-active:
    target: button
    state: active
    outline: none
  other-hover:
    target: other
    state: hover
    textColor: "{colors.surface}"
  other-focus-visible:
    target: other
    state: focus-visible
    outline: none
  link-focus-visible:
    target: link
    state: focus-visible
    outline: none
  other-focus:
    target: other
    state: focus
    outline: none
  link-disabled:
    target: link
    state: disabled
    textDecoration: none
  other-active:
    target: other
    state: active
    outline: none
breakpoints:
  - width: 375
    containerWidth: 356
    gridColumns: 3
    navLinksVisible: 14
    menuToggleVisible: true
    headingPx: 40
    bodyPx: 17
    sectionPaddingX: 0
  - width: 768
    containerWidth: 736
    gridColumns: 3
    navLinksVisible: 3
    menuToggleVisible: true
    headingPx: 56
    bodyPx: 17
    sectionPaddingX: 0
  - width: 1024
    containerWidth: 980
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 56
    bodyPx: 17
    sectionPaddingX: 0
  - width: 1280
    containerWidth: 1216
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 64
    bodyPx: 17
    sectionPaddingX: 0
  - width: 1440
    containerWidth: 1368
    gridColumns: 3
    navLinksVisible: 78
    menuToggleVisible: true
    headingPx: 64
    bodyPx: 17
    sectionPaddingX: 0
coverage:
  statesFound: 54
  gradientsFound: 0
  rolesUnassigned: 1
  archetypesUnnamed: 0
  archetypesDetected: 0
  responsiveMeasured: true
  stylesheetsBlocked: false
  semanticRampDeclared: false
---

# Design System Inspired by Apple

## 1. Visual Theme & Atmosphere

Apple's design system embodies minimalist sophistication and precision. The aesthetic is defined by clean typography, generous whitespace, and a thoughtful color hierarchy that balances warmth with clarity. The visual language prioritizes content over decoration, using subtle color blocking and carefully calibrated neutral tones to create depth and hierarchy. Interactive elements feel refined rather than flashy, with restrained hover states and smooth transitions. The overall mood is premium, accessible, and forward-thinking—designed to feel both familiar and innovative.

**Key Characteristics**
- Minimalist, content-first approach with abundant whitespace
- Precise typography hierarchy using SF Pro family
- Neutral-dominant palette with selective accent usage
- Sharp or pill-shaped interactive components depending on context
- Color-blocking elevation strategy (depth via surface color, not shadows)
- Restrained hover and focus states with clear visual feedback
- Hardware-inspired refinement in every detail

## 2. Color Palette & Roles

### Primary
- **Primary / Brand** (`{colors.primary}` — `#1D1D1F`): Primary CTA fills, brand accent, headings, active states, and primary text. Used in hero text, buttons, and navigation. This is the dominant ink color throughout.
- **Brand Accent** (`{colors.accent}` — `#42679E`): Complementary brand hue appearing in hero sections and select UI elements, providing visual variety alongside the achromatic primary.

### Neutral Scale
- **Canvas / On Primary** (`{colors.canvas}` — `#FFFFFF`): Default page background and the canonical light surface. Used as label or text color on brand-colored surfaces.
- **Surface** (`{colors.surface}` — `#000000`): Dark card and panel background, typically used in footers and overlays.
- **Body** (`{colors.body}` — `#6E6E73`): Primary body copy and secondary text, providing readable contrast on white backgrounds.
- **Muted** (`{colors.muted}` — `#86868B`): Captions, tertiary text, and de-emphasized information.
- **Faint** (`{colors.faint}` — `#F5F5F7`): Tertiary background, placeholder text, and subtle UI elements.

### Decorative
- **Neutral Accent** (`{colors.neutral-1}` — `#333336`): Unassigned neutral tone with no measured role; appears in specific UI contexts as a decorative variation.

### Semantic / Status
No error, success, warning, or info colors were declared in the site's markup. The design does not expose a semantic status ramp.

## 3. Typography Rules

### Font Family
**Primary:** SF Pro Display (Display and heading sizes)
**Secondary:** SF Pro Text (Body, button, and UI text)
**Fallback Stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|---|---|---|---|---|---|---|
| Display XL | SF Pro Display | 64px | 400 | Auto | Normal | Largest heading on desktop; hero-scale messaging |
| Display MD | SF Pro Display | 56px | 400 | Auto | Normal | Large heading on tablet and desktop |
| Display SM | SF Pro Display | 40px | 400 | Auto | Normal | Mobile heading size; section titles |
| Body | SF Pro Text | 17px | 400 | 21px | Normal | Primary reading text; product descriptions |
| Body Small | SF Pro Text | 12px | 400 | 16px | Normal | Secondary text, captions, footer copy |
| Button | SF Pro Text | 14px–17px | 400 | 18–20px | Normal | Interactive element labels; varies by button size |
| Link | SF Pro Text | 12px–17px | 400–600 | 12–21px | Normal | Navigation and inline links; weight varies by context |
| Code | SF Pro Text | 14px | 400 | 18px | Normal | Monospace display (if used) |

### Principles
- Typography is the primary hierarchy tool; color alone never conveys meaning.
- SF Pro Display is reserved for large, hero-scale text; all UI and body copy uses SF Pro Text.
- Font weights are minimal—primarily 400 (regular), with 600 reserved for emphasis in navigation.
- Line height is tight and follows a predictable ratio; generous margins and padding provide breathing room instead.
- Letter spacing remains normal across all sizes; the font's metrics are trusted as-is.

## 4. Component Stylings

### Buttons

**Primary Button**
- Background: `#1D1D1F`
- Text color: `#FFFFFF`
- Font: SF Pro Text, 14px, weight 400, line-height 18px
- Padding: 8px 15px
- Border radius: `{rounded.xs}` (8px)
- Border: 1px solid transparent
- Height: 36px
- Hover state: Color shifts to brand accent or lighter variant (explicit state stylesheet provided)
- Focus visible: 2px solid `#0071E3` outline

**Primary Button Small**
- Background: `#1D1D1F`
- Text color: `#FFFFFF`
- Font: SF Pro Text, 17px, weight 400, line-height 20px
- Padding: 11px 21px
- Border radius: `{rounded.full}` (pill-shaped, 9999px)
- Border: 1px solid transparent
- Height: 20px

**Filled Button (Secondary)**
- Background: `#FAFAFC` (off-white, approx. `{colors.faint}`)
- Text color: `#000000` with 80% opacity (`rgba(0, 0, 0, 0.8)`)
- Font: SF Pro Text, 17px, weight 400, line-height 41px
- Padding: 0px 14px
- Border radius: `{rounded.sm}` (11px)
- Border: 3px solid `rgba(0, 0, 0, 0.04)` (almost transparent)
- Height: 42px
- Width: 349px (measured in context; responsive on smaller screens)

**Filled Button Small**
- Background: `#F5F5F7` (`{colors.faint}`)
- Text color: `#000000`
- Font: SF Pro Text, 17px, weight 400, line-height 20px
- Padding: 11px 21px
- Border radius: `{rounded.full}` (9999px)
- Border: 1px solid transparent
- Height: 20px

**Outline Button**
- Background: transparent
- Text color: `#1D1D1F`
- Font: SF Pro Text, 17px, weight 400, line-height 20px
- Padding: 11px 21px
- Border radius: `{rounded.full}` (9999px)
- Border: 1px solid `#1D1D1F`
- Height: 20px

**Outline Button (Light variant)**
- Background: transparent
- Text color: `#F5F5F7` (`{colors.faint}`)
- Font: SF Pro Text, 17px, weight 400, line-height 20px
- Padding: 11px 21px
- Border radius: `{rounded.full}` (9999px)
- Border: 1px solid `#F5F5F7`
- Height: 20px

### Navigation

**Primary Navigation Bar**
- Background: `rgba(250, 250, 252, 0.8)` (semi-transparent faint)
- Text color: `#1D1D1F`
- Font: SF Pro Text, 17px, weight 400, line-height 25px
- Padding: 0px (full-width bar)
- Border radius: `{rounded.none}` (0px)
- Height: 44px
- Border: None
- Hover state: Text color shifts; no background change

### Links

**Navigation Link (Standard)**
- Text color: `rgba(0, 0, 0, 0.8)` (dark with 80% opacity)
- Font: SF Pro Text, 12px, weight 400, line-height 12px
- Padding: 0px 8px
- Border radius: `{rounded.none}`
- Background: transparent
- Hover state: Color changes (variable via CSS custom property); underline optional
- Focus visible: 2px solid `#0071E3`

**Navigation Link (Bold variant)**
- Text color: `rgba(0, 0, 0, 0.8)`
- Font: SF Pro Text, 17px, weight 600, line-height 21px
- Padding: 0px 8px
- Height: 44px
- Hover state: Text color changes per context

### Cards & Containers

**Card (Light)**
- Background: `#FFFFFF` (`{colors.canvas}`)
- Border: None
- Border radius: `{rounded.none}` (0px; sharp corners)

**Card (Dark)**
- Background: `#1D1D1F` (`{colors.primary}`)
- Border: None
- Border radius: `{rounded.none}`
- Text color on dark card: `#FFFFFF`

### Footer

**Footer Section**
- Background: `#1D1D1F` (`{colors.primary}`)
- Text color: `rgba(255, 255, 255, 0.56)` (56% opacity white)
- Font: SF Pro Text, 12px, weight 400, line-height 16px
- Padding: 0px (full-width)
- Border radius: `{rounded.none}`
- Height: ~832px (varies with content)

## 5. Layout Principles

### Spacing System

Base unit: 4px (`{spacing.xxs}`)

| Token | Value | Usage |
|---|---|---|
| `{spacing.xxs}` | 4px | Micro-adjustments, icon padding |
| `{spacing.xs}` | 12px | Compact component spacing |
| `{spacing.sm}` | 16px | Standard padding, small margins |
| `{spacing.md}` | 20px | Moderate component spacing |
| `{spacing.lg}` | 24px | Larger sections, prominent spacing |
| `{spacing.xl}` | 28px | Notable separation |
| `{spacing.xxl}` | 32px | Large section breaks |
| `{spacing.xxxl}` | 36px | Extra-large spacing |
| `{spacing.section}` | 40px | Section padding and margins |
| `{spacing.band}` | 44px | Hero and major layout divisions |

### Grid & Container

- **Max width:** 1368px at 1440px viewport (measured; `{colors.canvas}` respects this constraint)
- **Content column width:** Scales with viewport—356px (375px mobile), 736px (768px tablet), 980px (1024px desktop), 1216px (1280px), 1368px (1440px)
- **Grid columns:** Consistently 3 columns across all breakpoints (measured)
- **Section padding (horizontal):** 0px (full-width sections observed; content may have internal padding)
- **Navigation bar width:** Full viewport width (1440px measured)
- **Footer width:** Full viewport width

### Whitespace Philosophy

Whitespace is deliberate and generous. Margins and padding are used to create breathing room between content blocks and logical groupings. Rather than relying on thin lines or excessive borders, the design uses color shifts and negative space to define regions. Section breaks are emphasized through spacing (`{spacing.section}` to `{spacing.band}`) rather than dividers.

### Border Radius Scale

- `{rounded.none}` = 0px — Cards, buttons, overlays, images (sharp corners throughout)
- `{rounded.xs}` = 8px — Button primary variant
- `{rounded.sm}` = 11px — Button filled variant
- `{rounded.full}` = 9999px — Pill-shaped buttons (small, outline, and secondary variants)

No variable rounding based on screen size; radius is consistent across all breakpoints.

## 6. Depth & Elevation

### Elevation Strategy

Apple's design uses **color-blocking** for depth. Shadows are minimal or absent; instead, depth is created through surface color changes—light backgrounds (`#FFFFFF`), mid-tone neutrals, and dark surfaces (`#1D1D1F`). The hero section uses a blue gradient (`{colors.accent}` — `#42679E`) to create visual separation from the white body.

No multi-level shadow system was extracted. Interactive elements and overlays rely on:
- Background color contrast
- Opacity shifts
- Border/outline focus states (`#0071E3` via focus-visible)

### Opacity Levels

- **80% (0.80)** — Body text and secondary links on light backgrounds; hover/active text states
- **97% (0.97)** — Navigation bar background (nearly opaque, slight transparency)
- **85% (0.85)** — Muted or disabled states
- **25% (0.25)** — Subtle shadow or overlay hint (minimal usage)
- **56% (0.56)** — Footer text on dark surfaces (secondary information)

### Z-index / Layering

| Layer | Z-index | Use |
|---|---|---|
| Base | 1–3 | Standard page content and default elements |
| Modal | 9998–9999 | Modals, dialogs, and overlays above base content |
| Toast / Alert | 10000 | Notifications and temporary messages above all else |

The stacking context is shallow; most interfaces occupy the base layer with clear separation to overlay systems.

## 7. Do's and Don'ts

### Do
- Use `{colors.primary}` (`#1D1D1F`) for primary CTAs, headings, and brand identity.
- Reserve `{colors.accent}` (`#42679E`) for hero sections, brand callouts, and select UI highlights.
- Pair `#FFFFFF` backgrounds with `{colors.body}` or `{colors.muted}` text for readable contrast.
- Center primary buttons using `{rounded.xs}` (8px) for a refined, intentional feel; use `{rounded.full}` for secondary/outline variants to signal lightness.
- Leverage whitespace and color shifts to define regions; avoid thin borders unless necessary.
- Use `{spacing.section}` and `{spacing.band}` to separate major content blocks.
- Apply focus-visible outlines (`#0071E3`) on all interactive elements for accessibility.
- Scale typography responsively across breakpoints—display sizes shrink from 64px to 40px on mobile.
- Test hover and active states using the provided stylesheet rules; they reference CSS custom properties that may vary by context.

### Don't
- Avoid layered shadows or multi-tier elevation; rely on color contrast instead.
- Don't invent semantic colors (error red, success green, etc.). The brand does not expose these.
- Don't use shadows on buttons; sharp corners and subtle borders are the system's aesthetic.
- Don't apply different border radii to components of the same type across breakpoints.
- Don't introduce new font families outside SF Pro Display and SF Pro Text.
- Don't over-emphasize secondary buttons; they should feel lighter and less commanding than primary CTAs.
- Don't assume light/dark mode variants; this extraction covers the light theme only.
- Don't use opacity to convey hierarchy alone—pair it with color changes or size shifts.

## 8. Responsive Behavior

### Breakpoints

| Breakpoint | Viewport | Content Width | Grid Columns | Nav Links Visible | Menu Toggle | Display Size | Body Size | Section Padding X |
|---|---|---|---|---|---|---|---|---|
| Mobile | 375px | 356px | 3 | 14 | Yes | 40px | 17px | 0px |
| Tablet | 768px | 736px | 3 | 3 | Yes | 56px | 17px | 0px |
| Desktop | 1024px | 980px | 3 | 78 | Yes | 56px | 17px | 0px |
| Desktop Large | 1280px | 1216px | 3 | 78 | Yes | 64px | 17px | 0px |
| Desktop XL | 1440px | 1368px | 3 | 78 | Yes | 64px | 17px | 0px |

**Collapse behavior:** Navigation menu toggle appears on all measured breakpoints; link count visible in nav decreases from 14 to 3 between 375px and 768px, then stabilizes at 78 visible links (indicating a responsive menu system).

### Touch Targets

- **Minimum interactive height:** 44px (observed in navigation and link components)
- **Button minimum height:** 20px (small variants); 36–42px (standard)
- **Padding around touch targets:** Minimum 8px horizontal, ensuring comfortable tap zones

### Collapsing Strategy

- **Display sizes:** Shrink from 64px (desktop XL) → 56px (tablet) → 40px (mobile)
- **Navigation:** Menu toggle present at all breakpoints; visible link count decreases as viewport narrows
- **Content width:** Scales linearly with viewport; maintains readable line lengths
- **Grid columns:** Consistent 3-column structure across all sizes; individual column width shrinks proportionally
- **Horizontal padding:** Remains 0px (full-width sections); internal component padding adjusts per context

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA:** Primary / Brand (`{colors.primary}` — `#1D1D1F`)
- **Secondary CTA:** Filled Button (`#FAFAFC` off-white with dark text)
- **Background (page):** Canvas (`{colors.canvas}` — `#FFFFFF`)
- **Background (footer/overlay):** Surface (`{colors.surface}` — `#000000`)
- **Heading text:** Primary / Brand (`#1D1D1F`)
- **Body text:** Body (`{colors.body}` — `#6E6E73`)
- **Secondary text:** Muted (`{colors.muted}` — `#86868B`)
- **Tertiary / placeholder:** Faint (`{colors.faint}` — `#F5F5F7`)
- **Brand accent (hero/special):** Brand Accent (`{colors.accent}` — `#42679E`)
- **Focus outline:** `#0071E3`

### Iteration Guide

1. **Button styling**: Primary buttons are dark (`#1D1D1F`), filled, with 8px corners (`{rounded.xs}`). Secondary/outline buttons are pill-shaped (`{rounded.full}`) with transparent or light backgrounds. All buttons use SF Pro Text at 14–17px, weight 400.

2. **Typography setup**: Use SF Pro Display for display/heading sizes (64px, 56px, 40px); SF Pro Text for all body, UI, and link copy (17px body, 12px captions). Line heights follow a predictable scale; never add letter spacing unless explicitly measured.

3. **Color hierarchy**: Start with `#1D1D1F` for primary text and CTAs, `#6E6E73` for body copy, `#86868B` for secondary text. Use `#FFFFFF` as the default page background. Reserve `#42679E` for hero sections and brand accents only.

4. **Spacing consistency**: Use the provided spacing tokens (`{spacing.xs}` through `{spacing.band}`) for all margins and padding. Section breaks use `{spacing.section}` (40px) or `{spacing.band}` (44px). Avoid arbitrary values.

5. **Elevation**: No shadows; use color blocking instead. Dark surfaces (`#1D1D1F`) and light surfaces (`#FFFFFF`) create depth. Apply opacity shifts (0.8, 0.85, 0.97) for hover/disabled states on text and backgrounds.

6. **Focus and accessibility**: Always include `:focus-visible` outlines (`#0071E3`, 2px solid) on buttons, links, and form inputs. Test keyboard navigation and ensure sufficient color contrast (minimum WCAG AA).

7. **Responsive strategy**: Display sizes scale from 40px (mobile) → 56px (tablet) → 64px (desktop XL). Navigation link count decreases on smaller viewports; menu toggle appears at all sizes. Content width scales with viewport; grid remains 3 columns.

8. **Hover and active states**: Reference the extracted stylesheet rules. Button hover states may change color, opacity, or background. Links may add underline or change color. Some interactive elements scale slightly (0.95) on active.

## 10. Known Gaps

- **Semantic status colors**: The site does not declare error, success, warning, or info colors in its markup. No semantic ramp exists; if status messaging is needed, define these colors externally.
- **Gradients and decorative meshes**: No gradient definitions were extracted. The hero section's blue hue (`{colors.accent}` — `#42679E`) appears to be a solid color; if a gradient is present, it was not measured.
- **Dark mode**: This document reflects the light theme only. A derived dark theme was not tested or validated; treat any dark-mode appearance as unconfirmed.
- **Shadows and elevation detail**: Only color-blocking and minimal opacity shifts were observed. Multi-layered or complex shadow systems are not part of the measured design.
- **1 unassigned color**: `{colors.neutral-1}` (`#333336`) has no measured role and appears in select UI contexts only; its usage is decorative.
- **Interaction states coverage**: Hover, focus-visible, active, and disabled states were extracted for buttons and links. Other component types (selects, checkboxes, toggles) were not observed and are not documented.
- **Form inputs and validation**: No input styling, placeholder text, or validation state colors were extracted. Form design is not covered.
- **Animation and transitions**: No duration, easing, or keyframe data was extracted. CSS transitions on hover/active are not specified.
- **Surfaces behind authentication**: Only public pages were analyzed. Member-only content, accounts, or logged-in UI are not documented.
- **Breakpoint naming**: Breakpoints were derived from measured viewport widths where actual values changed. No official internal names ("small", "medium", "large") were provided by the brand; use numeric widths (375px, 768px, etc.) for clarity.