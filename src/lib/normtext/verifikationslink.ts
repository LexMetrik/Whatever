// EID-2 (W2·5d §12) — Verifizier-Deep-Links «amtliche Fassung an genau dieser Stelle».
//
// Reine, deterministische Ableitung der Outbound-Ziele auf die amtliche Fassung
// (§7/§8-Verifikations-Schicht). Bindend (§12.1/§12.4):
//   · NUR die ELI-Form (`https://www.fedlex.admin.ch/eli/…`), NIE die
//     versionsgebundene Filestore-URL;
//   · Fedlex-eIds sind reine, bei jeder Regeneration neu erzeugte OUTBOUND-Ziele —
//     nie eigene persistente Anker (die `#art-`-Konvention bleibt unangetastet, K2/R8);
//   · lieber KEIN Link als ein toter/unpräziser Link (§8).
//
// SSoT (§5): das Artikel-Fragment wird NICHT hier rückabgeleitet — der
// Snapshot-Generator schreibt die per-Artikel-ELI-URL (`quelleUrl#art_…`) bereits
// aus derselben Anker-Wahrheit (ankerZuToken, scripts/normtext/extrahiere-fedlex.ts)
// in jeden Eintrag. Dieser Builder validiert und reicht sie durch; der
// Paritäts-Sweep in src/tests/verifikationslink.test.ts beweist Fragment ↔ Token
// über ankerZuToken (Identität, nie Substring). Sektions-Ziele kommen aus der
// EID-1-Container-eId des Struktur-Sidecars (`gliederung[].eId`).

import type { NormSnapshot } from './typen';
import type { BrowseErlass } from './browse-typen';

/** Zitierfähige ELI-Basis (§12.0 Ziff. 3) — Identitäts-Präfix, kein Substring. */
const ELI_FORM = /^https:\/\/www\.fedlex\.admin\.ch\/eli\//;

/**
 * Positivliste für `__N`-Token (W2·27): das Fragment muss ein amtlicher Fedlex-NAMENS-Anker
 * sein, genau die Form, die amtlicherAnker() (scripts/normtext/artikel-vorkommen.ts) aus dem
 * `<a name="…">` vor dem Artikel-Kopf liefert: «a»+Nummer(+Buchstaben), ggf. mit «t»-Präfixen
 * (Wiederholungs-Vorkommen: `ta126z`, `tta1`) und Bereichs-Fortsetzung Nummer(+Buchstaben) (`a29a29f`, `a28d28f`). Kein «_»,
 * kein «/» — alle Struktur-ids (`art_…`, `disp_u1/art_…`, `annex_…`, `lvl_…`, `scope_…`,
 * `decl_…`) sind damit ausgeschlossen. Empirie (Erstsweep 30.9.2026): 3 171 <article> in ZGB/OR/KKV,
 * «ausnahmslos diese Form» — Nachzug-Messung 30.9.2026 (Gegenprüfung Runde 2): zu eng; 4/3 171
 * Bereichs-Namen beginnen den Bereich nicht mit «a» (ZGB `a28d28f`, OR `a226f226k`/`a663d663h`,
 * KKV `a107b107e`; dazu BetmG `a28b28l`, ERV `a148k148m`, SVG `a104c104d`). Mit der Form unten sind
 * 3 862/3 862 `<a name>` in 9 Filestore-Pins (ZGB, OR, KKV, BankV, BetmG, ERV, PaVo, SVG, VwVG)
 * gedeckt; `annex_1`, `lvl_u1`, `art_126_z`, `a`, `ta`, `xa126z`, `ta126z_x` bleiben ausgeschlossen. Eine Sperrliste wäre unvollständig: der Anhang-/Sektions-Pfad
 * des Generators schreibt bei `__N` den Basis-Anker (= 1. Vorkommen) und ruft amtlicherAnker()
 * nicht auf (Gegenprüfung PR #1166).
 */
const AMTLICHER_NAMENS_ANKER = /^t*a\d[a-z0-9]*$/;
// Linearform (Posten 30.9.2026): die frühere Fassung `^t*a\d+[a-z]*(?:\d+[a-z]*)*$` backtrackte
// katastrophal (28 Ziffern + Fremdzeichen ≈ 1,6 s, exponentiell). Sprachgleich: (\d+[a-z]*)(\d+[a-z]*)*
// = (\d+[a-z]*)+ ist genau die Menge der nichtleeren Wörter über [0-9a-z], die mit einer Ziffer
// beginnen (jedes solche Wort zerfällt eindeutig in maximale «Ziffern·Buchstaben»-Läufe, jeder Lauf
// beginnt mit einer Ziffer) = `\d[a-z0-9]*`. «t*» und «a» sind disjunkt → kein Backtracking.
// Beweis durch Differential-Test: src/tests/verifikationslink.test.ts («Regex-Äquivalenz»).

/**
 * Outbound-Link «amtliche Fassung» für EINEN Artikel: die vom Generator
 * geschriebene per-Artikel-ELI-URL (`quelleUrl` trägt das `#art_…`-Fragment).
 * null (= kein Link, §8) bei: Kanton (kein Fedlex-eId-Raum), ganz aufgehobenem
 * Erlass (Kopf-Konvention «geltende Fassung»), Nicht-ELI-Quelle oder fehlendem
 * Fragment — und bei Synthese-Suffix `__N` (doppelte Fedlex-id), sofern das
 * Fragment nicht die Positiv-Form eines amtlichen Namens-Ankers trägt.
 *
 * `__N` (W2·27, Nebenfund #890): bei doppelter id fällt `amtlicherAnker()`
 * (scripts/normtext/artikel-vorkommen.ts) auf den Basis-Anker `art_…` zurück,
 * wenn der Namens-Anker des N-ten Vorkommens nicht eindeutig ist — der löst im
 * Browser auf das ERSTE Vorkommen auf, also auf einen fremden Artikel (§8); der
 * Anhang-/Sektions-Pfad schreibt bei `__N` ohnehin den Basis-Anker. Nur ein
 * Fragment in der Positiv-Form des amtlichen Namens-Ankers (KKV 126_z__2 →
 * `#ta126z`, `<a name>` VOR dem Kopf, im Dokument genau 1×) trifft die richtige
 * Stelle und wird durchgereicht; alles andere → null.
 */
export function verifizierLinkArtikel(
  e: Pick<NormSnapshot, 'ebene' | 'artikel' | 'quelleUrl'>,
  erlass: Pick<BrowseErlass, 'aufgehoben'>,
): string | null {
  if (e.ebene !== 'bund' || erlass.aufgehoben) return null;
  if (!ELI_FORM.test(e.quelleUrl)) return null;
  const i = e.quelleUrl.indexOf('#');
  if (i < 0 || i === e.quelleUrl.length - 1) return null;
  if (/__\d+$/.test(e.artikel) && !AMTLICHER_NAMENS_ANKER.test(e.quelleUrl.slice(i + 1))) return null;
  return e.quelleUrl;
}

/**
 * Outbound-Link «amtliche Fassung» für EINE Gliederungsstufe: Erlass-Basis-URL
 * (ELI, ohne eigenes Fragment) + Container-eId aus dem EID-1-Sidecar. null bei
 * fehlender eId (Alt-Sidecar/Randtitel-Knoten/Kanton), Nicht-ELI-Basis oder
 * ganz aufgehobenem Erlass (§8: kein Link statt falscher Link).
 */
export function verifizierLinkSektion(
  erlass: Pick<BrowseErlass, 'ebene' | 'quelleUrl' | 'aufgehoben'>,
  eId: string | undefined,
): string | null {
  if (!eId || erlass.ebene !== 'bund' || erlass.aufgehoben) return null;
  if (!ELI_FORM.test(erlass.quelleUrl) || erlass.quelleUrl.includes('#')) return null;
  return `${erlass.quelleUrl}#${eId}`;
}
