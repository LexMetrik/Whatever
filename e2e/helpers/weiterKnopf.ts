import type { Locator, Page } from '@playwright/test'

// Der «Weiter»-Knopf des Vorlagen-Wizards. EIN Ort für die Regex (P10b,
// W2·31-BILDSCHIRMBREITE): `/^Weiter/` traf unter 640 px ZUSÄTZLICH den Knopf
// «Weiterlesen» (Werkzeugkopf-Intro, `werkzeugkopf-intro-mobil.e2e.ts`) und
// scheiterte im strict mode (Beleg: #1193, vorlagen-hinweise-lesemass; dort
// zunächst `(?!lesen)`). Die Vorausschau `(?![a-zäöü])` verlangt eine Wortgrenze
// hinter «Weiter» und schliesst damit auch «Weitere anzeigen» aus; «Weiter →»
// (Schaltfläche des Wizards) bleibt der einzige Treffer.
export const weiterKnopf = (page: Page): Locator =>
  page.getByRole('button', { name: /^Weiter(?![a-zäöü])/ })
