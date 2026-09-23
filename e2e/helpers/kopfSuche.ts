import { expect, type Page } from '@playwright/test'

// ── DIE KOPF-SUCHE AUFMACHEN, AUF JEDER BREITE ───────────────────────────────
// Entscheid David 29.8.2026 (Design-Review C1/B10/L3): unter 480 px ist die
// globale Suche im Ruhezustand eine 44-px-Lupe, nicht ein 28-px-Rahmen. Das
// FELD steht dort erst im geöffneten Zustand im Streifen — `max-[480px]:hidden`
// in `HeaderSuche.tsx`. Damit hat der Weg zum Feld eine Breiten-Fallunter-
// scheidung bekommen, und die hat genau EINE Stelle (§5):
//
//   < 480 px  Lupe antippen  → Fokusmodus → Feld über die volle Streifenbreite
//   ≥ 480 px  Feld antippen  → unverändert wie seit S6
//
// Der Helfer prüft NICHTS weg: er stellt nur die Vorbedingung her, auf der die
// aufrufenden Wächter ihre eigene Zusage messen, und besteht dabei darauf, dass
// das Feld danach WIRKLICH den Fokus trägt. Eine tote Lupe (Knopf da, Feld ohne
// Fokus) lässt ihn scheitern — nicht erst die Assertion des Aufrufers.
const kopfSuchFeld = (page: Page) => page.getByRole('combobox', { name: /LexMetrik durchsuchen/ })

const kopfLupe = (page: Page) => page.locator('header.sticky [data-suche-lupe]')

/**
 * Öffnet die globale Kopf-Suche breitenunabhängig und gibt das fokussierte Feld
 * zurück. Wartet zuvor darauf, dass der Streifen hydriert ist (genau eines von
 * Lupe/Feld ist sichtbar) — sonst liefe der Aufruf in das bekannte Rennen
 * «Klick vor Hydration».
 */
export async function kopfSucheOeffnen(page: Page, timeout = 20_000) {
  const feld = kopfSuchFeld(page)
  const lupe = kopfLupe(page)
  await expect
    .poll(async () => ((await lupe.isVisible()) ? 'lupe' : (await feld.isVisible()) ? 'feld' : 'nichts'), { timeout })
    .not.toBe('nichts')
  if (await lupe.isVisible()) await lupe.click()
  else await feld.click()
  await expect(feld).toBeFocused({ timeout: 10_000 })
  return feld
}

// ── DIE SPRUNG-ZEILE DER KOPF-SUCHE (§6.3-DEKLARATION, 6.9.2026) ─────────────
// GEMESSEN am Vorstand: die Sprung-Zeile trug bis zur Treffer-Anatomie D23/F1
// ein gerahmtes Etikett mit dem Wort «Sprung» bzw. «Direkt öffnen»
// (`SuchTreffer.marke`, `.lc-badge-soft`). F1/F4 haben die AKTIONS-Etiketten
// gestrichen — nachlesbar in `src/components/suche/trefferAnatomie.ts`
// (`trefferArt`: `marke.ton === 'ok'` fällt weg, «die Zeile sagt das mit ihrem
// ↵, und die Gruppe heisst ohnehin Norm-Sprung»). Das Etikett war damit ein
// drittes Mal dasselbe Wort in derselben Liste.
//
// NICHTS WIRD AUFGEWEICHT: Die Zusage «die Sprung-Zeile ist als solche
// erkennbar und steht zuoberst» wird weiterhin geprüft, nur an der Stelle, an
// der sie jetzt steht — am «↵»-Griff der Zeile (`SuchResultate.ZeileInhalt`,
// gerendert genau für `gruppe.id === 'sprung'`, also für Norm- UND
// Entscheid-Sprung). Die Gruppen-Überschrift («Norm-Sprung» / «Entscheid-
// Sprung») bleibt in den aufrufenden Wächtern zusätzlich geprüft, wo sie es
// vorher war — es fällt kein Prüfpunkt weg.
//
// ROT ZU BEKOMMEN (§6.7): in `SuchResultate.tsx` das `{sprung && <span …>↵`
// streichen ⇒ jeder Sprung-Wächter (norm-sprung, gesetze-ia-v2-walks) reisst.
const sucheListbox = (page: Page) => page.getByRole('listbox', { name: 'Suchtreffer' })

/** Die Zeile, die «Enter springt direkt» verspricht — an ihrem «↵»-Griff. */
export const sprungZeile = (page: Page) => sucheListbox(page).getByRole('option').filter({ hasText: '↵' })
