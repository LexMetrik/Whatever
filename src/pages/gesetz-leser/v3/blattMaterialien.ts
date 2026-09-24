import type { BotschaftBezug } from '../../../lib/materialien/botschaften';
import type { ArtikelHistorie } from '../../../lib/normtext/historie-parse';

// ═══ S6 W1f · DIE BOTSCHAFTEN ZU DIESEM ARTIKEL (Reiter «Materialien») ═══════
//
// Auftrag 24.9.2026 (Präzisierung zu Davids Meldung «erlassblatt scrollt nicht
// mit wenn sich artikel verändert»): jeder Reiter zeigt zuerst den Teil zum
// aktiven Artikel. Für «Materialien» gibt es keine eigene Artikel-Tabelle —
// aber die Fassungshistorie des Artikels nennt je Änderung ihre Fundstellen,
// darunter die Botschaft im Bundesblatt (Fussnoten-Link «BBl 2005 465»). Und
// die Botschaften-Liste des Erlasses trägt je Botschaft ihren Fedlex-Link.
//
// BEIDE LINKS TRAGEN DIESELBE ELI (gemessen 24.9.2026, BGBM Art. 2 im gebauten
// Stand): Fussnote «BBl 2005 465» → `https://fedlex.data.admin.ch/eli/fga/2005/54`,
// Botschaft 04.078 → `https://www.fedlex.admin.ch/eli/fga/2005/54/de`. Der
// Abgleich läuft darum über die ELI `fga/<Jahr>/<Nr>` als IDENTITÄT (CLAUDE.md
// §7: Wortgrenze statt Teilstring) — nie über das Seiten-Label, das in der
// Fussnote die BBl-SEITE (465), in der ELI die Dokument-Nummer (54) nennt.
//
// KEINE ZWEITE QUELLE (§5): beide Listen sind schon geladen — die Historie für
// die Fassungs-Karte, die Botschaften für den erlassweiten Reiter.

/** «…/eli/fga/2005/54/de» → «fga/2005/54»; kein Bundesblatt-Dokument ⇒ `null`. */
export function fgaSchluessel(url: string): string | null {
  const m = /\/eli\/fga\/(\d{4})\/(\d+)(?=[/?#]|$)/.exec(url);
  return m ? `fga/${m[1]}/${m[2]}` : null;
}

/** Die Botschaften des Erlasses, auf die eine Änderung DIESES Artikels verweist
 *  (Reihenfolge der Erlass-Liste). */
export function botschaftenZumArtikel(
  botschaften: readonly BotschaftBezug[] | null | undefined,
  historie: ArtikelHistorie | undefined,
): BotschaftBezug[] {
  if (!botschaften?.length || !historie?.ereignisse.length) return [];
  const belegt = new Set<string>();
  for (const e of historie.ereignisse) {
    for (const q of e.quellen) {
      const k = fgaSchluessel(q.url);
      if (k) belegt.add(k);
    }
  }
  return botschaften.filter((b) => {
    const k = fgaSchluessel(b.quelleUrl);
    return k !== null && belegt.has(k);
  });
}
