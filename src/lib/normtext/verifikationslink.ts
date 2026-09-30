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

/** Fedlex-Artikel-id-Form (`art_…` bzw. `disp_u1/art_…`) — bei doppelter id mehrdeutig. */
const ARTIKEL_ID_FRAGMENT = /(^|\/)art_/;

/**
 * Outbound-Link «amtliche Fassung» für EINEN Artikel: die vom Generator
 * geschriebene per-Artikel-ELI-URL (`quelleUrl` trägt das `#art_…`-Fragment).
 * null (= kein Link, §8) bei: Kanton (kein Fedlex-eId-Raum), ganz aufgehobenem
 * Erlass (Kopf-Konvention «geltende Fassung»), Nicht-ELI-Quelle oder fehlendem
 * Fragment — und bei Synthese-Suffix `__N` (doppelte Fedlex-id), sofern das
 * Fragment kein eigener amtlicher Namens-Anker ist.
 *
 * `__N` (W2·27, Nebenfund #890): bei doppelter id fällt `amtlicherAnker()`
 * (scripts/normtext/artikel-vorkommen.ts) auf den Basis-Anker `art_…` zurück,
 * wenn der Namens-Anker des N-ten Vorkommens nicht eindeutig ist — der löst im
 * Browser auf das ERSTE Vorkommen auf, also auf einen fremden Artikel (§8). Nur
 * ein Fragment OHNE `art_`-id-Form (KKV 126_z__2 → `#ta126z`, amtlicher
 * `<a name>` VOR dem Kopf, im Dokument genau 1×) trifft die richtige Stelle und
 * wird durchgereicht.
 */
export function verifizierLinkArtikel(
  e: Pick<NormSnapshot, 'ebene' | 'artikel' | 'quelleUrl'>,
  erlass: Pick<BrowseErlass, 'aufgehoben'>,
): string | null {
  if (e.ebene !== 'bund' || erlass.aufgehoben) return null;
  if (!ELI_FORM.test(e.quelleUrl)) return null;
  const i = e.quelleUrl.indexOf('#');
  if (i < 0 || i === e.quelleUrl.length - 1) return null;
  if (/__\d+$/.test(e.artikel) && ARTIKEL_ID_FRAGMENT.test(e.quelleUrl.slice(i + 1))) return null;
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
