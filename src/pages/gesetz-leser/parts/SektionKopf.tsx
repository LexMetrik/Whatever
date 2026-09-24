import { FnRef } from '../../../components/normtext/ArtikelBody';
import type { Sektion } from '../../../lib/normtext/browse';
import { NEUER_TAB } from '../../../lib/benennung';
import { romanFrei, margLabel } from '../helpers';

// Gliederungs-Überschrift im Fliesstext: klappbar (Fedlex-analog), volle
// Bezeichnung, nach Ebene abgestuft.
export function SektionKopf({ s, refCb, offen, onToggle, bereich, bereichEinzel, amtlichUrl, randTiefe = 0 }: {
  s: Sektion; refCb: (el: HTMLElement | null) => void; offen: boolean; onToggle: () => void; bereich?: string;
  /** Die Sektion umfasst genau EINEN Artikel (Bereich = «Art. N», keine Spanne). */
  bereichEinzel?: boolean;
  /** EID-2 (W2·5d §12): fertig gebauter Verifizier-Deep-Link «amtliche Fassung»
   *  dieser Gliederungsstufe (ELI-Form `quelleUrl#<Container-eId>`, Builder
   *  verifikationslink.ts). undefined = kein Link (Kanton/Randtitel/Alt-Sidecar,
   *  §8 — nie ein toter Link). Reines Outbound-Chrome, kein eigener Anker (§12.4). */
  amtlichUrl?: string;
  /**
   * W2·19-GLIEDERUNG/S9 (Bau-Spec §6/3 «Randtitel-Stufung T1»): Position DIESES
   * Knotens innerhalb seiner eigenen Marginalien-Kette («A.»=0, «I.»=1, «1.»=2)
   * — NICHT `s.ebene` (die zählt ab der amtlichen Wurzel und wäre bei einer
   * fünfstufigen Kodifikation wie ZGB/OR nie klein). Nur an randtitel-Knoten
   * wirksam; amtliche Stufen stufen weiterhin über `s.ebene` (unverändert).
   * Bis hierher trugen ALLE randtitel-Knoten dieselbe Grösse/dasselbe Gewicht
   * — eine dreistufige Kette («A. / I. / 1.») blieb damit optisch flach, obwohl
   * der Einzug (renderSektion) sie längst verschachtelt zeigte. Reine Typo-
   * Abstufung, keine Farbe/Box (NORMTEXT §4b), 0-indiziert und bei 2 gedeckelt
   * (tiefere Ketten sind im Referenzbestand nicht belegt, §7 — nichts geraten).
   */
  randTiefe?: number;
}) {
  const { pre, rest } = romanFrei(s.label);
  // Vollwertige Abschnitts-Überschrift im Fliesstext: feine Overline mit dem
  // Aufzähler («Erster Abschnitt»), darunter der Sachtitel + Artikel-Bereich. Trägt
  // wieder die Standort-Info im Text (der frühere fliegende Running-Header entfällt).
  // Randtitel-promotete Knoten (6b: «A. …», «II. …») sind feine Marginalien-
  // Gruppierungen, KEINE amtlichen Teil/Titel/Abschnitt — darum durchgehend ruhig
  // (Serif-Stimme der Randtitel, kein Trenn-Strich, keine grossen Stufengrössen),
  // unabhängig von der Roh-Ebene. Die Verschachtelung trägt der Einzug-Strich
  // (renderSektion). Reine Darstellung (§3/§13, nur vorhandene Tokens).
  const mt = s.randtitel ? 'mt-4' : s.ebene <= 1 ? 'mt-8 first:mt-0' : s.ebene === 2 ? 'mt-6' : s.ebene === 3 ? 'mt-5' : 'mt-4';
  // Linien-Kanon (W2·5d G1): NUR die obersten Sektionen (Teil/Titel/Abschnitt,
  // ebene ≤ 1) tragen einen horizontalen Struktur-Trenner. Innere Sektionen
  // (ebene ≥ 2) und randtitel-promotete Knoten tragen KEINE Horizontal-Linie —
  // ihre Tiefe trägt Typo (titelStil) + Einzug (renderSektion), nicht eine
  // zweite Linie (Gegen-Lehre «Barcode/Gleisbett», DESIGN-REGLEMENT §Linien-Kanon
  // Regel 2). Die frühere feine ebene-2-Linie (`border-line/50`) entfällt.
  //
  // S6 W1g (Wunsch David 24.9.2026 «klarer unterteilt», Board «Fliesstext-Blatt»):
  // Randtitel-Abschnitte («II. Sicherheiten durch den Mieter») tragen jetzt die
  // leiseste der zwei Trennlinien, 1 px `--rule-soft` — sie gliedern den Fluss,
  // wo bis hier nur der Weissraum trennte. Innere amtliche Stufen (ebene ≥ 2)
  // bleiben ohne Linie; eine Randtitel-Stufe, die UNMITTELBAR auf einen anderen
  // Kopf folgt, verliert sie wieder (index.css `[data-sek-linie]`), damit
  // «E. / I. / 1.» kein Gleisbett wird (§N-4b Regel 2).
  const regel = s.randtitel ? 'border-t border-rule-soft pt-3' : s.ebene <= 1 ? 'border-t border-rule-struktur pt-4' : '';
  // Titelgrösse nach Tiefe (E, Auftrag David 26.6.2026): Fedlex-artig abgestuft —
  // oberste Stufe prominent (h2), dann h3, body-l, sonst base. font-semibold liegt
  // am Titel-Span (unten). Nur existierende Tokens (§13).
  const randStufe = Math.min(randTiefe, 2);
  // ── Ä7-REST (S2-Nachzug 17.8.2026, Ästhetik-Prüfer) ─────────────────────────
  // Die DRITTE Randtitel-Stufe lief auf `text-micro` = 11 px, Serif, Gewicht 500,
  // lh 1.2 (gemessen @1440 am OR: «1. Im Allgemeinen», «2. Betreffend Nebenpunkte»).
  // Damit war ein SEKTIONS-Kopf, der mehrere Artikel zusammenfasst, LEISER als der
  // Sachtitel eines einzelnen Artikels darunter (gemessen: Blatt-Randtitel 13 px,
  // Gewicht 600, Sans) und so klein wie der Fussnoten-Apparat (11 px) — die
  // Hierarchie war an dieser Stelle nicht bloss flach, sondern verkehrt.
  //
  // Die dritte Stufe geht darum auf DIESELBE Randtitel-Stufe, die David am
  // Bildbogen gewählt hat (F3 = V2, «Marginalie/Randtitel 0.8125 rem, Sans»,
  // Token `leser-rand` = 13 px / lh 1.35) und die `helpers.tsx:margStufeStil` für
  // die Randtitel AM ARTIKEL schon trägt — EINE Randtitel-Stufe für beide Orte
  // (§5) statt zweier Systeme.
  //
  // ABGRENZUNG, ausdrücklich NICHT geändert (§7): die Stufen 0 und 1 bleiben bei
  // `text-base`/`text-body-s` und Serif. David hat am Bogen den Satzspiegel des
  // ARTIKELS gesehen, nicht die Gliederungsköpfe; sie von 16 auf 13 px zu senken
  // wäre eine Änderung ohne Vorlage. Die Stufung bleibt 16 > 14 > 13 px — jetzt
  // aber nicht mehr nach unten offen.
  const titelStil = s.randtitel
    ? (randStufe === 0 ? 'text-base' : randStufe === 1 ? 'text-body-s' : 'text-leser-rand')
    : s.ebene === 0 ? 'text-h2' : s.ebene === 1 ? 'text-h3' : s.ebene === 2 ? 'text-body-l' : 'text-base';
  const titelFont = s.randtitel
    ? (randStufe === 2
        // Dritte Stufe = Randtitel-Sprache: Sans (Zwei-Stimmen-Regel, Grundlage
        // Kap. 2.1 — Serif ist der Wortlaut, Sans das Beiwerk) mit `font-medium`,
        // damit sie unter der zweiten Stufe (Serif 600) UND unter dem
        // Blatt-Randtitel am Artikel (Sans 600) bleibt.
        ? 'font-sans font-medium text-ink-800'
        : 'font-serif font-semibold text-ink-800')
    : 'font-display font-semibold text-ink-900';
  // G11: section-heading-Fussnoten-Marker. FnRef ist selbst ein <button> und darf
  // NICHT im Toggle-<button> liegen (verschachtelte Buttons) → der Marker sitzt als
  // Geschwister NEBEN dem Toggle in derselben Titelzeile. Nur zeigen, wenn der
  // Fussnoten-Schalter AN ist UND die Sektion OFFEN ist: das Popover-Ziel
  // (#fn-<artikel>-<nr>) lebt im {auf && …}-Block des Trägerartikels und ist bei
  // eingeklappter Sektion ungemountet → sonst toter Bedienpfad (§13 F4, analog zum
  // artOffen-Gate der Artikel-Marker).
  // W2·5d G2b: an `offen` gebunden (Popover-Ziel lebt im offenen Block), nicht mehr
  // am alten fussnotenAuf-Schalter; Prominenz via data-fussnoten-CSS (R9).
  const sekFn = offen && s.fussnoten && s.fussnoten.length > 0 ? s.fussnoten : null;
  return (
    <div ref={refCb} data-sek={s.id} data-normtext-linie data-sek-linie={s.randtitel ? 'rand' : undefined}
      className={`group/sekkopf nt-anker ${mt} ${regel}`}>
      {pre && (
        <button type="button" onClick={onToggle} aria-expanded={offen} className="group/sek block text-left">
          <span className="lc-overline group-hover/sek:text-ink-900">{pre}</span>
        </button>
      )}
      <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        {/* Einklapp-Marke deutlich (analog Fedlex, Auftrag David): jede Stufe
            inkl. Untergruppe ist klappbar — vorher war das Chevron zu blass/winzig,
            darum wirkte es, als ginge es nicht. Messing-Akzent macht es als
            Steuerelement erkennbar. */}
        <button type="button" onClick={onToggle} aria-expanded={offen} className="group/sek flex min-w-0 items-baseline gap-x-2 text-left">
          {/* S6 W1g (Entscheid David 24.9.2026): derselbe Klapp-Pfeil wie vor
              «Art. N» (`./ArtikelLeser`) — gleiche Spalte `w-4`, mittig, gleiche
              Grösse `text-micro`; bis hier stand er hier links bündig in
              `text-body-s` und damit gegen den des Artikels versetzt. */}
          <span className={`inline-flex w-4 shrink-0 justify-center text-micro transition-colors ${offen ? 'text-brass-600' : 'text-ink-500'} group-hover/sek:text-ink-900`}>{offen ? '▾' : '▸'}</span>
          {/* A30: bis/ter-Suffix des Randtitel-Enumerators hochgestellt (margLabel);
              No-op bei Sachtiteln ohne Enumerator-Suffix. */}
          <span className={`lc-wortumbruch ${titelFont} ${titelStil} group-hover/sek:text-ink-900`}>{margLabel(rest || s.label)}</span>
        </button>
        {sekFn && (
          <span className="shrink-0" data-fn-marker>
            {sekFn.map((f, i) => (
              <span key={`${f.artikel}-${f.nr}`}>{i > 0 && <span className="align-super text-[length:var(--hochgestellt)] text-ink-500">,</span>}<FnRef artikel={f.artikel} nr={f.nr} /></span>
            ))}
          </span>
        )}
        {/* Artikel-Bereich-Badge. Bei einer EINZELartikel-Sektion ist das «Art. N»
            redundant, sobald die Sektion OFFEN ist (der Artikel steht direkt
            darunter mit voller Kopfzeile, Auftrag David) → nur im eingeklappten
            Zustand zeigen. Echte Spannen («Art. 1–10») bleiben immer sichtbar. */}
        {/* Bereich-Badge («Art. 1–10»). W2·5d G3b-Overflow-Fix: NICHT mehr
            `shrink-0` — bei Anhang-/Protokoll-Sektionen setzte sich der Bereich aus
            Lang-Labels zusammen («Protokoll 1 über … – Vorbehalte und Erklärungen»)
            und sprengte als un-schrumpfbares Element @390 den Reader (scrollW 790,
            H-Overflow). `min-w-0` + Umbruch lässt ein langes Label brechen statt
            überlaufen; «Art. 1–10» bleibt kurz auf einer Zeile. Für reine Anhang-
            Sektionen wird der Bereich ohnehin unterdrückt (inhalt.tsx). Reine
            Darstellung (§3) — gleicher Text, nur umbruchfähig. */}
        {bereich && !(bereichEinzel && offen) && (
          <span className="num min-w-0 [overflow-wrap:anywhere] text-xs font-normal text-ink-500">{bereich}</span>
        )}
        {/* EID-2 (W2·5d §12): Verifizier-Deep-Link «amtliche Fassung an genau
            dieser Stelle» der Gliederungsstufe. Hover-dezent wie die Artikel-
            Aktionen (Zitat/Link in ArtikelLeser): opacity-0 bis Hover/Fokus,
            auf Touch immer sichtbar. Kein neues Chrome — ein Inline-Glied der
            bestehenden Titelzeile; target/rel wie bestehende amtliche Links. */}
        {amtlichUrl && (
          <a href={amtlichUrl} target="_blank" rel="noopener noreferrer"
            className="shrink-0 text-micro text-ink-500 no-underline opacity-0 transition-opacity group-hover/sekkopf:opacity-100 focus-visible:opacity-100 hover:text-ink-900 [@media(hover:none)]:opacity-100"
            aria-label={`Amtliche Fassung von «${s.label}» auf Fedlex öffnen ${NEUER_TAB}`}
            // Ä110 (18.8.2026): EINE Schreibung für EIN Ziel (s. ArtikelLeser).
            title="Amtliche Fassung an genau dieser Stelle (Fedlex)">Amtliche Fassung ↗</a>
        )}
      </span>
    </div>
  );
}
