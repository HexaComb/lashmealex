---
name: Lashmealex
description: Warm artisan luxury for a Fresno lash-artist shop — editorial type, sharp grids, rose accents.
colors:
  warm-parchment: "#faf9f6"
  ink: "#121212"
  stone-muted: "#626262"
  hairline: "#e2e2e2"
  rose-accent: "#d46a8c"
  rose-soft: "#e7a4b8"
  rose-deep: "#b95174"
  rose-gold: "#d9b09f"
  rose-gold-mist: "#f5ddd2"
  surface-white: "#ffffff"
  surface-hover: "#f8f8f8"
  photo-well: "#f0f0f0"
typography:
  display:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cormorant Garamond, Georgia, serif"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1.1
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.3em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.4em"
rounded:
  none: "0px"
  full: "9999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  section: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-parchment}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-primary-hover:
    backgroundColor: "{colors.rose-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-parchment}"
    rounded: "{rounded.none}"
    padding: "16px 24px"
---

# Design System: Lashmealex

## 1. Overview

**Creative North Star: "The Curated Tray"**

Lashmealex reads like a salon backbar translated into pixels: warm parchment grounds, ink-black structure, and rose accents that appear where a practitioner would point (labels, hovers, key CTAs), not as wallpaper. Layout favors editorial grids and 1px borders over soft card stacks. Typography does the luxury work (Cormorant display + Jakarta body); corners stay square except for pills and avatars.

The system explicitly rejects cutesy kawaii beauty, generic Shopify themes, and AI-slop decoration (glass cards, gradient text, side-stripe callouts). Density is calm but efficient: product surfaces optimize for variant clarity and pickup confidence.

**Key Characteristics:**

- Light-only, warm neutral canvas with ink structure
- Zero default border-radius on UI chrome (full pills only where circular affordance is needed)
- Uppercase micro-labels with wide tracking for wayfinding
- Depth via borders and tonal panels, not floating shadows
- Accent rose used sparingly for emphasis and hover feedback
- Motion: short ease transitions; Framer Motion for entrance, no bounce

## 2. Colors: The Salon Palette

Warm parchment and ink carry most surfaces; rose and rose-gold are artisan highlights, not a candy coating.

### Primary

- **Rose Accent** (#d46a8c): Micro-labels, eyebrow text, and brand moments on marketing blocks. Never flood a full viewport.
- **Rose Deep** (#b95174): Primary hover state on buttons, active emphasis, focus rings. Hero CTAs may start here via overrides.

### Secondary

- **Rose Gold** (#d9b09f): Secondary warmth for supporting details, soft highlights, and balance against cool gray photo wells.
- **Rose Gold Mist** (#f5ddd2): Subtle fills and gentle backgrounds where pink would feel too loud.

### Tertiary

- **Rose Soft** (#e7a4b8): Disabled-adjacent states, light accents, skeleton shimmer midpoint (with hairline gray).

### Neutral

- **Warm Parchment** (#faf9f6): Page background; body text sits on ink, not here.
- **Ink** (#121212): Primary text, borders, default filled buttons, selection invert.
- **Stone Muted** (#626262): Supporting copy, metadata, de-emphasized UI.
- **Hairline** (#e2e2e2): Dividers, disabled fills, quiet borders inside panels.
- **Surface White** (#ffffff): Panels, cards, hero cells inside the grid.
- **Surface Hover** (#f8f8f8): Hover backgrounds on list rows and quiet surfaces.
- **Photo Well** (#f0f0f0): Image placeholder zones behind product photography.

### Named Rules

**The Accent Sparingly Rule.** Rose and rose-gold together should occupy well under 30% of any screen. If a section feels pink, remove a layer before adding another.

**The Ink Grid Rule.** Major layout blocks use 1px `ink` borders to form editorial cells. Prefer full borders over floating cards with heavy shadow.

## 3. Typography

**Display Font:** Cormorant Garamond (Georgia fallback)  
**Body Font:** Plus Jakarta Sans (system-ui fallback)  
**Label Font:** Plus Jakarta Sans (uppercase utility)

**Character:** Editorial luxury meets pro supply clarity. Display type is tall and confident; body stays small, readable, and neutral. Labels whisper in tracked uppercase.

### Hierarchy

- **Display** (500, clamp ~3.5rem–5.5rem, line-height 1): Hero headlines on home and campaign blocks. One display line per viewport when possible.
- **Headline** (500, 2.25rem / 36px, line-height ~1.1): Section titles, featured product names in side panels.
- **Title** (700, 14px, uppercase, letter-spacing 0.3em): Subheads, modal titles, strong UI labels.
- **Body** (400, 14px, line-height ~1.6, max ~65–75ch): Descriptions, cart copy, admin table text.
- **Label** (700, 10px, uppercase, letter-spacing 0.4em): Eyebrows ("Lashmealex", "Featured"), stat columns, filter chips.

### Named Rules

**The One Display Voice Rule.** Only Cormorant carries emotional weight. Jakarta never substitutes for a hero headline.

**The Tracking Rule.** Uppercase labels always use letter-spacing ≥ 0.3em. Sentence case body never inherits label tracking.

## 4. Elevation

Flat-by-default with structural borders. Depth is communicated through ink grid lines, white inset panels, and occasional soft shadows, not Material-style floating layers.

### Shadow Vocabulary

- **Card** (`0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)`): `.glass` panels, light containment.
- **Soft** (`0 12px 30px rgba(0,0,0,0.04)`): `.glass-heavy` emphasis, rare hero lifts.

### Named Rules

**The Border-First Rule.** If you need separation, add a hairline or ink border before adding shadow. Shadows do not replace grid structure.

## 5. Components

### Buttons

- **Shape:** Square corners (0px radius); uppercase 12px labels with 0.1em tracking.
- **Primary:** Ink fill, parchment text, 1px ink border; padding 16px 24px. Hero variants may override to rose-deep fill with hover to ink.
- **Hover / Focus:** Primary hovers to rose-deep with white text; secondary inverts to ink fill. Focus uses 1.5px rose-deep outline, 2px offset (`.focus-ring`).
- **Secondary:** Transparent with ink border; hover fills ink.
- **Ghost:** Bottom border only; hover shifts ink text and border to rose-deep.

### Chips / Tags

- **Style:** Uppercase label typography on transparent or hairline-bordered pills; selected states use ink fill or rose-deep text shift.
- **State:** Filter and variant chips mirror shop sidebar: quiet at rest, ink or rose-deep on active.

### Cards / Containers

- **Corner Style:** 0px on containers; product imagery may be rectangular crops without radius.
- **Background:** White panel on parchment page, or photo-well behind images.
- **Shadow Strategy:** Optional card shadow only on `.glass`; prefer `border border-foreground` editorial cells.
- **Border:** 1px ink for major grids; hairline inside for nested splits.
- **Internal Padding:** Generous (40–64px) on hero cells; 16–24px on product tiles.

### Inputs / Fields

- **Style:** Inherited font; 1px hairline or ink borders; square corners.
- **Focus:** Rose-deep outline via `.focus-ring`; no glow halos.
- **Error / Disabled:** Muted text on hairline background; opacity reduction on buttons.

### Navigation

- **Style:** Sticky header on parchment/white; ink icons (Lucide, 20–24px).
- **Typography:** Jakarta 14px links; active route uses weight or underline, not neon highlight.
- **Mobile:** Full-screen overlay menu with primary CTA at bottom; scroll lock when open.

### Product Grid Cell

- **Style:** Image-forward tile with uppercase micro-brand line, display name optional, price in Jakarta semibold.
- **Behavior:** Quick view opens modal (z-index 9010); add-to-cart respects stock with disabled hairline state.

## 6. Do's and Don'ts

### Do:

- **Do** keep the page on warm parchment with ink type and square grids.
- **Do** use Cormorant for emotional headlines and Jakarta for everything functional.
- **Do** reserve rose-deep for hovers, eyebrows, and one primary CTA per view.
- **Do** show Fresno / same-day pickup near checkout decisions.
- **Do** respect `prefers-reduced-motion` when adding new animations.

### Don't:

- **Don't** use cutesy kawaii beauty: glitter UI, bubble fonts, infantilizing pink floods, sticker motifs, or exclamation spam.
- **Don't** ship generic Shopify theme energy: rounded card grids, pastel gradients, or discount-banner clutter.
- **Don't** use AI-slop patterns: decorative glassmorphism, gradient text, side-stripe callouts, or hero-metric dashboards on the storefront.
- **Don't** add border-radius to buttons, cards, or inputs (only `full` for avatars/dots).
- **Don't** use gradient text or neon/dark crypto palettes.
- **Don't** nest cards inside cards; use border splits within one panel.
