// ─── Das EINE Bezugslinien-Orakel der Scroll-Spy-Sonden ─────────────────────
//
// Herkunft: FAHRPLAN-LESER-V3 §16 «Bezugslinien-Orakel liegt in zwei Specs»
// (§5-Nebenfund 18.9.2026), abgebaut in W2·29 S3 (23.9.2026). Bis dahin stand
// die Regel wortgleich in `leser-spy-w25d.e2e.ts` (`messen`) und
// `leser-marke-mitlaufen.e2e.ts` (`leseRueckstand`) — eine Korrektur an der
// einen Kopie wäre an der anderen still ausgeblieben (§5).
//
// DIE REGEL (Herleitung und Messreihen: `leser-spy-w25d.e2e.ts`, Kopf und
// `messen`):
//   · Bezugslinie = `scroll-margin-top` des ersten `[id^="art-"]` + 8 px —
//     GELESEN, nicht nachgerechnet (derselbe Wert, den `scrollIntoView` nimmt;
//     Rückfall 5 rem nur ohne Anker).
//   · Kandidaten = Artikel, die an der Linie noch nicht zu Ende sind und oben
//     im Sichtfeld beginnen (Zwischenraum-Regel des Readers, `inhalt-hooks.tsx`);
//     sonst der SICHTBARE Satz (§6.3-Deklaration W2·24, 6.9.2026); sonst alle.
//   · Wahl = Artikel, dessen Intervall die Linie enthält, sonst kleinste Distanz.
//
// WIE ES IN DIE SEITE KOMMT: `page.evaluate` serialisiert nur die übergebene
// Funktion — ein importierter Helfer existiert im Seitenkontext nicht. Das
// Orakel wird darum als QUELLTEXT über die DevTools-Auswertung installiert
// (`window.__lmLinie`); die Sonden rufen es in ihrem eigenen `evaluate`. Die
// Installation ist idempotent und kostet eine Auswertung je Aufruf.

export interface LinienOrakel {
  bezug: number;
  /** Token des Artikels an der Linie, `null` ohne Artikel. */
  token: string | null;
  rects: { token: string; top: number; bottom: number }[];
}

/** Läuft IM SEITENKONTEXT — darf nichts ausserhalb seines Rumpfs benutzen. */
function linienOrakel(): LinienOrakel {
  const artEls = [...document.querySelectorAll('[id^="art-"]')];
  const rects = artEls.map((el) => {
    const r = el.getBoundingClientRect();
    return { token: el.id.replace(/^art-/, ''), top: r.top, bottom: r.bottom };
  });
  const remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const landepunkt = artEls[0] ? (parseFloat(getComputedStyle(artEls[0]).scrollMarginTop) || 5 * remPx) : 5 * remPx;
  const bezug = landepunkt + 8;
  const hoehe = document.documentElement.clientHeight;
  const kandidaten = rects.filter((e) => e.bottom > bezug && e.top < hoehe);
  const sichtbar = rects.filter((e) => e.bottom > 0 && e.top < hoehe);
  const wahl = kandidaten.length > 0 ? kandidaten : (sichtbar.length > 0 ? sichtbar : rects);
  let token: string | null = null;
  let beste = Infinity;
  for (const e of wahl) {
    const d = bezug < e.top ? e.top - bezug : bezug > e.bottom ? bezug - e.bottom : 0;
    if (d === 0) { token = e.token; break; }
    if (d < beste) { beste = d; token = e.token; }
  }
  return { bezug, token, rects };
}

/** Macht `window.__lmLinie()` in der aktuellen Seite verfügbar (idempotent). */
export async function linienOrakelInstallieren(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(`window.__lmLinie = ${linienOrakel.toString()}`);
}
