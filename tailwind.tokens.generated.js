// @generated — erzeugt aus design/tokens.json durch `npm run gen:tokens`.
// NIE VON HAND ÄNDERN: `npm run check:tokens-drift` hält Quelle und diese
// Projektion byte-gleich (W2·29-WERKBANK-TOKENS, CLAUDE.md §5).
//
// `tailwind.config.js` importiert die Teile hier und ergänzt von Hand, was
// NICHT aus Token stammt — maxWidth, minHeight, transition*, screens und die
// color-mix-Rezepte (`line`, `rule-artikel`/`-struktur`, `*-bg`).
//
// Die Typo-Skala (`fontSize`) fehlt hier mit Absicht: sie steht als eigener
// @generated-Block IN `tailwind.config.js` — Begründung im Kopf von
// `scripts/design/tokens-generieren.ts` (Projektion (c)).
export const colors = {
  ink: {
    300: 'var(--ink-300)',
    400: 'var(--ink-400)',
    500: 'var(--ink-500)',
    600: 'var(--ink-600)',
    700: 'var(--ink-700)',
    800: 'var(--ink-800)',
    900: 'var(--ink-900)',
  },
  paper: {
    DEFAULT: 'var(--paper)',
    raised: 'var(--paper-raised)',
    sunken: 'var(--paper-sunken)',
  },
  surface: {
    DEFAULT: 'var(--surface)',
    raised: 'var(--surface-raised)',
  },
  well: 'var(--well)',
  rule: {
    DEFAULT: 'var(--rule)',
    soft: 'var(--rule-soft)',
  },
  brass: {
    100: 'var(--brass-100)',
    200: 'var(--brass-200)',
    300: 'var(--brass-300)',
    400: 'var(--brass-400)',
    500: 'var(--brass-500)',
    600: 'var(--brass-600)',
    700: 'var(--brass-700)',
    800: 'var(--brass-800)',
  },
  reg: {
    g: 'var(--reg-g)',
    r: 'var(--reg-r)',
    m: 'var(--reg-m)',
    w: 'var(--reg-w)',
    'g-flaeche': 'var(--reg-g-flaeche)',
    'r-flaeche': 'var(--reg-r-flaeche)',
    'm-flaeche': 'var(--reg-m-flaeche)',
    'w-flaeche': 'var(--reg-w-flaeche)',
  },
  auf: {
    gold: 'var(--auf-gold)',
    sage: 'var(--auf-sage)',
  },
  sage: {
    500: 'var(--sage-500)',
    700: 'var(--sage-700)',
    line: 'var(--sage-line)',
    solid: 'var(--sage-solid)',
    text: 'var(--sage-text)',
  },
  slate: {
    500: 'var(--slate-500)',
    700: 'var(--slate-700)',
    line: 'var(--slate-line)',
    solid: 'var(--slate-solid)',
    text: 'var(--slate-text)',
  },
  warn: {
    500: 'var(--warn-500)',
    700: 'var(--warn-700)',
    line: 'var(--warn-line)',
    solid: 'var(--warn-solid)',
    text: 'var(--warn-text)',
  },
  danger: {
    500: 'var(--danger-500)',
    700: 'var(--danger-700)',
    line: 'var(--danger-line)',
    solid: 'var(--danger-solid)',
    text: 'var(--danger-text)',
  },
  accent: {
    text: 'var(--accent-text)',
    bg: 'var(--accent-bg)',
    'bg-hover': 'var(--accent-bg-hover)',
    'line-decor': 'var(--accent-line-decor)',
    line: 'var(--accent-line)',
    solid: 'var(--accent-solid)',
    'text-strong': 'var(--accent-text-strong)',
    hover: 'var(--accent-hover)',
  },
  ok: {
    solid: 'var(--ok-solid)',
    text: 'var(--ok-text)',
    line: 'var(--ok-line)',
  },
  karte: {
    duenn: 'var(--karte-duenn)',
    auswahl: 'var(--karte-auswahl)',
    voll: 'var(--karte-voll)',
    leer: 'var(--karte-leer)',
    kante: 'var(--karte-kante)',
    marke: 'var(--karte-marke)',
  },
};

export const fontFamily = {
  display: ['var(--font-display)', 'system-ui', 'sans-serif'],
  sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
  serif: ['var(--font-serif)', 'Georgia', 'serif'],
  mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
};

export const borderRadius = {
  DEFAULT: 'var(--radius-sm)',
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  '2xl': 'var(--radius-2xl)',
};

export const boxShadow = {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
};

export const zIndex = {
  base: 'var(--z-base)',
  sticky: 'var(--z-sticky)',
  'entscheid-sticky': 'var(--z-entscheid-sticky)',
  'reader-scrim': 'var(--z-reader-scrim)',
  'reader-kopf': 'var(--z-reader-kopf)',
  'inhalt-kopf': 'var(--z-inhalt-kopf)',
  leiste: 'var(--z-leiste)',
  dropdown: 'var(--z-dropdown)',
  overlay: 'var(--z-overlay)',
  modal: 'var(--z-modal)',
};

export default { colors, fontFamily, borderRadius, boxShadow, zIndex };
