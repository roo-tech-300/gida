---

name: Gida Premium Real Estate

colors:

  surface: '#131315'

  surface-dim: '#131315'

  surface-bright: '#39393b'

  surface-container-lowest: '#0e0e10'

  surface-container-low: '#1b1b1d'

  surface-container: '#201f21'

  surface-container-high: '#2a2a2c'

  surface-container-highest: '#353437'

  on-surface: '#e5e1e4'

  on-surface-variant: '#ccc3d8'

  inverse-surface: '#e5e1e4'

  inverse-on-surface: '#313032'

  outline: '#958da1'

  outline-variant: '#4a4455'

  surface-tint: '#d2bbff'

  primary: '#d2bbff'

  on-primary: '#3f008e'

  primary-container: '#7c3aed'

  on-primary-container: '#ede0ff'

  inverse-primary: '#732ee4'

  secondary: '#4ae176'

  on-secondary: '#003915'

  secondary-container: '#00b954'

  on-secondary-container: '#004119'

  tertiary: '#ffb784'

  on-tertiary: '#4f2500'

  tertiary-container: '#a15100'

  on-tertiary-container: '#ffe0cd'

  error: '#ffb4ab'

  on-error: '#690005'

  error-container: '#93000a'

  on-error-container: '#ffdad6'

  primary-fixed: '#eaddff'

  primary-fixed-dim: '#d2bbff'

  on-primary-fixed: '#25005a'

  on-primary-fixed-variant: '#5a00c6'

  secondary-fixed: '#6bff8f'

  secondary-fixed-dim: '#4ae176'

  on-secondary-fixed: '#002109'

  on-secondary-fixed-variant: '#005321'

  tertiary-fixed: '#ffdcc6'

  tertiary-fixed-dim: '#ffb784'

  on-tertiary-fixed: '#301400'

  on-tertiary-fixed-variant: '#713700'

  background: '#131315'

  on-background: '#e5e1e4'

  surface-variant: '#353437'

typography:

  display-price:

    fontFamily: Inter

    fontSize: 40px

    fontWeight: '800'

    lineHeight: 48px

    letterSpacing: -0.02em

  display-price-mobile:

    fontFamily: Inter

    fontSize: 32px

    fontWeight: '800'

    lineHeight: 38px

    letterSpacing: -0.02em

  headline-lg:

    fontFamily: Inter

    fontSize: 24px

    fontWeight: '700'

    lineHeight: 32px

    letterSpacing: -0.01em

  headline-md:

    fontFamily: Inter

    fontSize: 20px

    fontWeight: '600'

    lineHeight: 28px

  body-lg:

    fontFamily: Inter

    fontSize: 16px

    fontWeight: '400'

    lineHeight: 24px

  body-md:

    fontFamily: Inter

    fontSize: 14px

    fontWeight: '400'

    lineHeight: 20px

  label-caps:

    fontFamily: Inter

    fontSize: 12px

    fontWeight: '600'

    lineHeight: 16px

    letterSpacing: 0.1em

  label-sm:

    fontFamily: Inter

    fontSize: 11px

    fontWeight: '500'

    lineHeight: 14px

rounded:

  sm: 0.25rem

  DEFAULT: 0.5rem

  md: 0.75rem

  lg: 1rem

  xl: 1.5rem

  full: 9999px

spacing:

  base: 4px

  xs: 4px

  sm: 8px

  md: 16px

  lg: 24px

  xl: 32px

  gutter: 16px

  margin-mobile: 20px

  margin-desktop: 48px

---

## Brand & Style

The design system is engineered to evoke a sense of exclusive, high-tier real estate through a moody, high-contrast dark aesthetic. The brand personality is sophisticated and confident, prioritizing visual impact and high-fidelity precision. 

The design style combines **Minimalism** with **Glassmorphism**, drawing heavy inspiration from the Apple Wallet interface. It utilizes deep charcoal backgrounds to allow vibrant accents and high-quality property imagery to pop. The emotional response is one of security, luxury, and technological advancement, catering to a discerning audience that values clarity and premium aesthetics.

## Colors

The palette is built on a "Deep Night" foundation. 

- **Primary (#7C3AED):** An electric, vibrant purple used for primary actions, selection states, and brand highlights. 

- **Success (#22C55E):** A neon green reserved for positive growth indicators, "Available" status, and completed transactions.

- **Backgrounds:** The base layer is a deep charcoal (#0E0E10). Secondary surfaces use a slightly elevated gray (#1A1A1E) to create depth.

- **Typography:** Soft white (#F2F2F7) ensures high legibility against dark backgrounds without the harshness of pure white, while medium gray (#71717A) handles secondary information.

## Typography

The system uses **Inter** exclusively to maintain a systematic, geometric, and modern feel. 

Hierarchy is established through extreme scale and weight contrast. Pricing and key metrics use the **Display Price** style—massive, bold, and tightly spaced. Labels use **Label Caps**, which are small, uppercase, and heavily tracked (letter-spaced) to provide an architectural, premium feel. All headlines utilize tight negative letter-spacing to appear more "locked-in" and editorial.

## Layout & Spacing

This design system employs a **Fixed Grid** model for desktop (centered 1200px container) and a **Fluid Grid** for mobile devices. 

- **Spacing Rhythm:** Based on a 4px baseline grid. Padding and margins should always be multiples of 8px (8, 16, 24, 32, 48) to maintain vertical rhythm.

- **Mobile:** Uses 20px side margins with a 16px gutter between cards. 

- **Desktop:** Transitions to a 12-column layout with 24px gutters.

- **Content Flow:** Real estate listings should be presented in "stacks" or "carousels" with generous bottom padding (48px+) between logical sections to maintain a minimalist, uncluttered feel.

## Elevation & Depth

Depth is created through **Tonal Layering** and **Glassmorphism**, rather than traditional heavy shadows.

- **Surface Levels:** The background is #0E0E10. Cards and containers sit on #1A1A1E.

- **Glass Effects:** Top navigation bars and bottom action sheets use a backdrop-blur (20px) with a semi-transparent fill of the surface color (80% opacity). 

- **Outlines:** Instead of shadows, use a 1px "Inner Border" for cards with a hex code of #FFFFFF at 8% opacity. This creates a subtle "lit from above" edge highlight characteristic of premium OS interfaces.

- **Interaction:** On hover or tap, elements should slightly scale (1.02x) rather than increasing shadow spread.

## Shapes

The shape language is defined by "Smooth Rounding." 

Standard components (Cards, Input Fields) use a **16px corner radius**. Larger containers like image carousels or modals should use **24px (rounded-xl)**. Smaller elements like chips or tags use **8px (rounded-sm)**. Avoid pill-shaped buttons; stick to the 16px radius to maintain a consistent "squircle" aesthetic that feels modern and architectural.

## Components

- **Buttons:** Primary buttons use the #7C3AED fill with white text. No border. 16px corner radius. Fixed height of 56px for primary mobile actions.

- **Cards:** Property cards should feature full-bleed imagery at the top with the 1px subtle inner border highlight. Details reside on the #1A1A1E surface.

- **Input Fields:** Background should be #1A1A1E with a 1px border of #71717A at 20% opacity. On focus, the border changes to the primary purple.

- **Chips/Badges:** Small, 8px radius. For "New" or "Available," use the success green with 10% opacity for the background and 100% opacity for the text.

- **Pricing:** Always rendered in the **Display Price** typography style, placed at the bottom-left or top-right of property cards for immediate recognition.

- **Micro-interactions:** Use spring physics for transitions (stiffness: 300, damping: 30). Page transitions should feel like sliding layers.