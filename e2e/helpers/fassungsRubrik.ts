// ═══ W2·24-D40 · WO DIE FASSUNGS-AUSKUNFT SEIT DEM 7.9.2026 STEHT ═══════════
//
// David, wörtlich: «und wieso ist fassung nicht auch unten am artikel?». Bis D40
// stand «Gilt seit … ▸» in einem eigenen Slot am ARTIKELKOPF (`[data-hist-slot]`,
// `mt-4 min-h-beiwerk`); seither ist sie die erste Rubrik der Funktionszeile am
// Artikelende — Marke mit Zahl, Block auf Klick.
//
// DIESER HELFER IST DER EINE ORT, an dem die Sonden das wissen. Ohne ihn stünde
// derselbe Griff in sechs Specs sechsmal (§5), und die nächste Ortsverschiebung
// wäre wieder eine Sammel-Änderung. Er misst nichts und behauptet nichts — er
// benennt Selektoren und klappt auf.
import { expect, type Locator } from '@playwright/test';

/** Die Marke «n Fassungen ›» in der Funktionszeile eines Artikels. */
export const F_MARKE = '.lr7-bez-marke[data-reg="f"]';
/** Der aufgeklappte Block darunter (Badge «Gilt seit …» + Zeitleiste). */
export const F_BLOCK = '.lr7-bez-block[data-reg="f"]';
/**
 * Wartet, bis der Historie-Shard die Fassungs-Marke dieses Artikels gefüllt hat.
 * Sie kommt idle nach (`inhalt-zustand.tsx`), wie die Marken «Entscheide» und
 * «Materialien» aus der Zähl-Datei.
 */
export async function fassungsMarke(art: Locator, timeout = 15_000): Promise<Locator> {
  const marke = art.locator(F_MARKE);
  await expect(marke).toBeVisible({ timeout });
  return marke;
}

/**
 * Klappt die Fassungs-Rubrik auf und liefert die Zeile IM Block —
 * das, was bis D40 der Kopf-Slot zeigte.
 */
export async function fassungAufklappen(art: Locator, timeout = 15_000): Promise<Locator> {
  const marke = await fassungsMarke(art, timeout);
  if ((await marke.getAttribute('aria-expanded')) !== 'true') await marke.click();
  const block = art.locator(F_BLOCK);
  await expect(block).toBeVisible();
  return block.locator('[data-historie-zeile]');
}
