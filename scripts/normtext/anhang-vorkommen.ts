// ── Anker-Auflösung für Anhang-Sektionen bei doppelter Fedlex-id ─────────────
//
// W2·27-BUND-FERTIG (30.9.2026, Gegenprüfung #1183): Gegenstück zu
// `amtlicherAnker` (artikel-vorkommen.ts, Haupttext-Pfad) für den ANHANG-Pfad —
// schliesst den Posten «Anhang-Pfad schreibt bei __N den Basis-Anker, Haupttext-
// Pfad den amtlichen Namens-Anker» (§5-Doppel, damals «latent, 0 Fälle»; seit
// dem VZV-Befund real).
//
// Befund VZV (SR 741.51, ELI cc/1976/2423_2423_2423, Konsolidierung 20260101):
// drei <section id="annex_u1">. Ein Browser löst ein doppeltes `id` immer auf
// das ERSTE Element auf — `#annex_u1` springt also zur «Beilage», auch für
// «Anhänge 5 und 6» und «Anhang 8 und 9». Anders als Artikel tragen
// Anhang-Sektionen KEINEN <a name="…">-Anker; die Sektion bietet aber in ihrem
// Kopf (<h1>) die id des Fussnoten-Markers (`fnbck-…`, die amtliche Aufhebungs-/
// Änderungsfussnote steht genau an der Überschrift). Sie ist im Dokument
// eindeutig und liegt im Kopf der richtigen Sektion.
//
// Live-Nachweis (Playwright, headless Chromium, 30.9.2026, Viewport 1280x900,
// networkidle + 4 s; Fedlex ist eine SPA und setzt den Sprung selbst):
//   …/eli/cc/1976/2423_2423_2423/de#annex_u1             → 3 Treffer, Sprung zu
//     «Beilage» (top=32px)
//   …/de#fnbck-d367071e19095 → 1 Treffer, Sektion «Anhänge 5 und 6», top=32px
//   …/de#fnbck-d367071e19320 → 1 Treffer, Sektion «Anhang 8 und 9», top=32px
//
// Regel eng gehalten (§7 «nichts fabrizieren»): genutzt wird nur eine id aus dem
// Kopf der N-ten Sektion, die im Dokument genau einmal als id="…" und nie als
// name="…" vorkommt. Sonst bleibt es beim Basis-Anker (= Verhalten vor diesem
// Fix, mit der bekannten Unschärfe «springt aufs erste Vorkommen», §8).
//
// Flüchtigkeit (Nachzug GP-Befund 30.9.2026, ergänzt): die `fnbck-…`-ids sind von
// Fedlex generiert und werden je Ausgabe (Konsolidierung) NEU erzeugt — sie sind
// nur für den gepinnten Stand gültig. Ändert sich der Pin, holt die Neugenerierung
// der Snapshots (npm run normtext) die neuen ids nach; der Drift-Riegel (B3,
// drift-logik.ts) fängt ein Doppelziel, check:normtext-netz die Fassung.

import { findeSectionEnde } from './extrahiere-fedlex.ts';

function zaehle(html: string, attr: 'id' | 'name', wert: string): number {
  const esc = wert.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...html.matchAll(new RegExp(`\\s${attr}="${esc}"`, 'gi'))].length;
}

/**
 * Fragment-tauglich für eine id: genau 1× als id="…" und 0× als name="…" im
 * Dokument (Gegenstück zu `istFragmentEindeutig`, das name-Anker prüft).
 */
export function istIdFragmentEindeutig(html: string, fragment: string): boolean {
  return zaehle(html, 'id', fragment) === 1 && zaehle(html, 'name', fragment) === 0;
}

/**
 * Synthese-Suffix «__N» (N-tes Vorkommen derselben Sektions-id, vergeben von
 * `alleAnhangAnker`/`alleArtikelTokens` in extrahiere-fedlex.ts) in Basis-id und
 * Vorkommens-Nummer zerlegen; `null` ohne Suffix (= erstes/einziges Vorkommen).
 * EINE Stelle für die Namenskonvention (§5): Anhang-Anker-Auflösung (unten) und
 * die Lokalisierung im Tor `check:segmente` (segmente-logik.ts `lokalisiereAnker`).
 */
export function zerlegeVorkommenSuffix(ankerRoh: string): { basis: string; nth: number } | null {
  const treffer = ankerRoh.match(/^(.*)__(\d+)$/);
  return treffer ? { basis: treffer[1], nth: Number(treffer[2]) } : null;
}

/**
 * Anker-Fragment für die quelleUrl eines Anhangs. Ohne Synthese-Suffix «__N»
 * (Normalfall) unverändert `ankerRoh` — byte-gleich zum Verhalten davor. Mit
 * «__N» die erste eindeutige id im Kopf der N-ten Sektion, sonst der Basis-Anker.
 */
export function amtlicherAnhangAnker(html: string, ankerRoh: string): string {
  const suffix = zerlegeVorkommenSuffix(ankerRoh);
  if (!suffix) return ankerRoh;
  const { basis: basisAnker, nth } = suffix;
  const esc = basisAnker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const opens = [...html.matchAll(new RegExp(`<section[^>]*\\sid="${esc}"[^>]*>`, 'gi'))];
  const open = opens[nth - 1];
  if (!open) return basisAnker;
  const start = open.index ?? 0;
  const innerStart = start + open[0].length;
  const ende = findeSectionEnde(html, start);
  const inner = html.slice(innerStart, ende);
  const kopfEnde = inner.search(/<\/h[1-6]>/i);
  if (kopfEnde === -1) return basisAnker;
  const kopf = inner.slice(0, kopfEnde);
  for (const m of kopf.matchAll(/\sid="([^"]+)"/gi)) {
    if (istIdFragmentEindeutig(html, m[1])) return m[1];
  }
  return basisAnker;
}
