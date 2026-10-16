import { datumAnzeige, DATUM_UNBEKANNT_TITEL } from '../../../components/rechtsprechung/format';
import { KanteMitVorschau } from '../../../components/verzahnung/KanteMitVorschau';
import {
  entscheidDatum, klassifiziereFassungsBezug, revisionFuerToken,
  type ArtikelRevision, type RevisionShard,
} from '../../../lib/verzahnung/artikel-revisionen';
import type { Bezug } from '../../../lib/rechtsprechung/bezuege';
import { datumInZitierung, regesteTeil } from './entscheideOrdnung';

// ─── Eine Fundstelle des Reiters «Entscheide» ───────────────────────────────
//
// Aus `PanelEntscheide.tsx` herausgelöst (LESER-NAV O-32, 16.10.2026): die Datei
// stand bei 419 von 420 Zeilen (Fundament-Sonde `leser-v3-fundament`), jede
// Ergänzung am Zeilenkopf hätte sie über die Grenze gehoben. Verhalten und
// Herleitungs-Kommentar sind unverändert hierher gezogen; neu ist nur der Tooltip
// am «o. D.»-Jahr (siehe `titel`).

/** §V1c-Klassifikation EINER Kante, gegen den bereits feststehenden Artikel
 *  des Panels — kein `viaArtikel`-Aggregat nötig (Herleitung Kontaktbogen H4
 *  §7b): das V3-Panel ist ohnehin je EINEN Artikel gescopet (Dateikopf), der
 *  Artikel-Token steht also schon fest, bevor die Klassifikation beginnt. */
function revidiertFuer(b: Bezug, artikel: string | null, shard: RevisionShard | null): ArtikelRevision | null {
  if (!artikel) return null;
  const rev = revisionFuerToken(shard, artikel);
  const eingestuft = klassifiziereFassungsBezug(entscheidDatum(b.datum, b.facetten.status), rev);
  return eingestuft === 'revidiert' ? (rev ?? null) : null;
}


/**
 * Eine Fundstelle: Zitierung · Datum · Regeste-Kurzzeile, verlinkt auf den
 * Entscheid. `?norm=` trägt die Fundstellen-Absicht — das Ziel springt zur
 * ersten Erwägung, die diese Norm zitiert (dieselbe Zusage wie am Artikelfuss).
 *
 * ── Ä106 (Live-Ästhetik-Prüfung 18.8.2026) · DAS ★ IST GESTRICHEN ───────────
 *
 * GEMESSEN am Live-Stand (StPO Art. 429, Reiter «Entscheide»): unter der
 * Overline «LEITENTSCHEIDE 25» trugen ALLE 25 Zeilen ein ★ — fünfundzwanzig
 * Zeichen für eine Auskunft, die der Gruppenkopf zwei Zeilen darüber einmal
 * gibt. Die Marke war als Auszeichnung IN einer gemischten Liste gedacht
 * («und nur als EIN Zusatz», Dichte-Regel); gemischte Listen gibt es hier aber
 * nicht: `gruppiereKanten` (`./panelModell`) legt je Status eine eigene Gruppe
 * an — innerhalb einer Gruppe haben ausnahmslos alle Einträge denselben Status.
 * Das ★ konnte also NIE etwas unterscheiden. Design-Grundlage Kap. 6 nennt
 * genau das die Icon-Flut: ein Zeichen, das an jedem Element steht, trägt keine
 * Information mehr.
 *
 * Die Auskunft bleibt vollständig (§8): der Gruppenkopf nennt die Klasse im
 * Wort («Leitentscheide») UND die Zahl — eine Marke, eine Zahl, wie es der
 * Prüfbefund verlangt.
 *
 * WÄRE die Gruppierung je aufgehoben (eine Liste über alle Instanzen), gehörte
 * die Marke zurück — dann trüge sie wieder einen Unterschied. Sie steht in der
 * Historie dieser Datei, nicht in einer toten Bedingung (§17: gestrichen statt
 * bewacht).
 *
 * ── §7b-DECKUNGSLÜCKE GESCHLOSSEN (21.8.2026, Kontaktbogen H4 §7b Pos. 3/5,
 *    Optik-Entscheid David 21.8.2026 nach Drei-Varianten-Vergleich) ─────────
 *
 * Bis hierhin war die Zeile ein blosser `<Link>` — kein Kurztext-Popover, kein
 * ⧉-Einstieg, kein ↻. Alle drei trägt bereits `KanteMitVorschau` (`W2·10-UI-NAV`,
 * bisher nur an der V1a-Leitfall-Zeile und den B4/B7-Bezüge-Linien gemountet,
 * §5: EIN Bauteil statt einer dritten Kopie):
 *   · Kurztext-Popover auf Hover/Fokus/↓, Esc schliesst (deckt
 *     `leitfaelle-chips.e2e.ts` Fall (d), s. `leser-v3-panel-kurztext.e2e.ts`).
 *   · ⧉ «nebeneinander öffnen» am Chip (Pane-Gating via `usePaneSteuerung`) —
 *     derselbe Einstieg, den `druck-fundstellen-z2.e2e.ts` für den
 *     Split-Ausdruck braucht (V3-Fall in derselben Datei).
 *   · ↻-Badge («Norm seit dem Entscheid revidiert») via `revidiertFuer` unten
 *     (deckt `normrevision-badge.e2e.ts`, s. `leser-v3-panel-revision-badge.e2e.ts`).
 * Das Datum wandert in den `sublabel`-Slot des Chips (`KantenChip` kennt genau
 * diesen Platz bereits, §5 — kein zweiter Anzeige-Pfad).
 *
 * DAVID-VORGABE 21.8.2026 (wörtlich, nach Vorlage dreier Varianten): «man soll
 * regeste direkt lesen können, damit man weiss um was der entscheid geht» —
 * die Regeste steht darum ZUSÄTZLICH zum Chip als eigene, lesbare Zeile
 * (`text-body-s`/14px, NICHT `text-micro` — Davids ausdrücklicher Einwand
 * gegen eine Kompakt-Variante mit Mikroschrift) direkt darunter, zweizeilig
 * gedeckelt (`line-clamp-2`). Das Popover bleibt VERTIEFUNG für den
 * ungekürzten Text, nie der einzige Zugang. Quelle ausschliesslich
 * `regesteKurz` aus dem Shard — nichts generiert (§2).
 */
export function Fundstelle({ b, normZitat, statusLabel, aktArtikel, revisionShard }: {
  b: Bezug; normZitat: string; statusLabel: string; aktArtikel: string | null; revisionShard: RevisionShard | null;
}) {
  // S6-W1b · E-8: trägt die Zitierung ihr Datum schon («… vom 12.12.2025»),
  // steht es nicht noch einmal als Unterzeile. B-2/E-6: ein führendes
  // Teil-Kennzeichen wird benannt statt nackt gesetzt (Herleitung an den
  // Funktionen in `./entscheideOrdnung`).
  const regeste = b.regesteKurz ? regesteTeil(b.regesteKurz) : null;
  // PE-E1-B01: Platzhalterdatum (`datumUnbekannt`) als «2025, o. D.», nie als echtes Datum (§8).
  return (
    <li data-v3-panel-entscheid={b.key} className="border-l-2 border-t border-line border-l-reg-r py-2 pl-2.5">
      <KanteMitVorschau
        ziel={`/rechtsprechung/${encodeURIComponent(b.key)}?norm=${encodeURIComponent(normZitat)}`}
        zitierung={b.zitierung}
        sublabel={datumInZitierung(b.zitierung) ? undefined : datumAnzeige(b.datum, b.datumUnbekannt)}
        kurztext={b.regesteKurz}
        statusLabel={statusLabel}
        revidiert={revidiertFuer(b, aktArtikel, revisionShard)}
        titel={b.datumUnbekannt && !datumInZitierung(b.zitierung) ? `${b.zitierung} — ${DATUM_UNBEKANNT_TITEL}` : undefined} />
      {regeste && (
        <p className="mt-1 text-body-s leading-snug text-ink-700 line-clamp-2">
          {regeste.teil && <span data-v3-panel-regeste-teil={regeste.teil} className="text-ink-600">{`Regeste ${regeste.teil}: `}</span>}
          {regeste.rest}
        </p>
      )}
    </li>
  );
}
