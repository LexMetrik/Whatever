import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { GruppenId, SuchGruppe, SuchTreffer } from '../../lib/universalSuche';
import { hervorhebungsStellen } from '../../lib/suche/hervorhebung';
import type { Abdeckung } from './useUniversalSuche';
import { suchOptionId } from './suchOptionId';
import { MEHR_TREFFER_ID } from './trefferAuswahl';
import { Leerzustand } from '../ui/Leerzustand';
import { RegisterMarke } from './RegisterMarke';
import { trefferArt, trefferKurzform, trefferTitel } from './trefferAnatomie';

// ─── Trefferpanel der Universal-Suche (geteilt: Header-Dropdown + Hero, §5) ──
//
// Reine Darstellung (§3): rendert die vom Aggregator gelieferten Gruppen als
// gruppierte Trefferliste. Identisch in Header und Startseiten-Hero, damit beide
// EINEN Suchweg zeigen. `onAuswahl` schliesst das Dropdown nach einem Klick.
//
// Tastatur/ARIA (Bug-Check §13/F4): Wird `listboxId` gesetzt, rendert das Panel
// als ARIA-Listbox (role=listbox + role=option je Treffer, stabile Options-IDs,
// aria-selected für den hervorgehobenen Treffer). Das steuernde Eingabefeld
// (Hero/Header) hält aria-activedescendant auf der aktiven Options-ID. Ohne
// `listboxId` bleibt das Markup wie zuvor (Header-Dropdown ohne Pfeil-Nav).
// Die knappe Trefferzahl wird über EINE sr-only Live-Region angesagt — nicht
// mehr das ganze Panel, das sonst bei jedem Tastendruck neu vorgelesen würde.

// ── F1–F4 (Prüfer D23, 6.9.2026) · DER BEHÄLTER EINER TREFFERZEILE ─────────
//
// C-4 (31.8.2026) hatte die ZEILEN-ANATOMIE nach `ui/TrefferZeile` gezogen —
// denselben Baustein, den die Katalog-Register tragen. Für das Such-Panel ist
// er mit D23 die falsche Anatomie geworden: er führt Titel + zweite Zeile +
// Marke, und genau diese drei Glieder waren der gemessene Befund (Volltitel,
// mehrzeiliges Snippet, gerahmtes Etikett; Zeilenhöhen 37–266 px). Das Panel
// baut darum jetzt DIESELBE Zeile wie sein eigener Leerzustand
// (`SucheLeerzustand`, seit D23): Registerstrich · Kurzform · Art rechts als
// Text. §5 ist gewahrt — die beiden Zustände EINES Panels teilen eine
// Anatomie; die Katalog-Register behalten ihre, weil dort eine Karte steht und
// kein Streifen (§1: zwei verschiedene Fälle nicht gleich behandeln).
//
// Hover und Auswahl laufen unverändert über die PAPIER-Stufe
// (`.lc-hover-flaeche` = `--well`) plus 2-px-Kantenstrich (`.hs-aktiv`), nicht
// über eine Messing-Tönung.
const ZEILE_CLS = 'lc-hover-flaeche flex items-center gap-3 px-4 py-2 text-body-s text-ink-900 no-underline transition-colors';

/** ── F6 · DIE SKELETT-ZEILE ─────────────────────────────────────────────────
 *
 *  GEMESSEN am Stand `c91541617`: das Panel stand 2.7 s lang auf 1 px («wird
 *  durchsucht …») und sprang dann auf 729 px, sobald der Artikel-Index kam.
 *  Ein Platzhalter, der die Höhe nicht reserviert, ist kein Platzhalter.
 *
 *  DIE HÖHE IST NICHT GESETZT, SONDERN GEERBT: die Skelett-Zeile trägt exakt
 *  die Klassen einer echten Zeile (`ZEILE_CLS`, oben) und darin
 *  EINE Zeile Text — geschützte Leerzeichen in `text-transparent`. Damit ist
 *  ihre Höhe per Konstruktion dieselbe wie die einer Trefferzeile (dieselbe
 *  Schriftgrösse, dieselbe Zeilenhöhe, dasselbe Polster), ohne eine Zahl, die
 *  bei der nächsten Typo-Änderung still auseinanderläuft (§13: keine
 *  Magic-Numbers).
 *  Die verschiedenen Breiten sind bewusst ungleich — eine Kolonne gleich
 *  langer Balken liest sich als Tabelle, nicht als «hier entsteht Text».
 */
const SKELETT_BREITEN = [26, 18, 30, 20, 24, 16];

function SkelettListe() {
  return (
    <ul aria-hidden className="pb-1.5">
      {SKELETT_BREITEN.map((n, i) => (
        <li key={i} className={`${ZEILE_CLS} pointer-events-none`}>
          <span className="h-4 w-[3px] shrink-0 bg-rule-soft" />
          {/* Der Balken sitzt am INNEREN Inline-Element: seine Breite ist damit
              die Breite des Textlaufs (n gesch\u00FCtzte Leerzeichen), nicht die
              volle Zeilenbreite. Die H\u00D6HE der Zeile kommt vom \u00E4usseren Span,
              der die Schriftgr\u00F6sse der Trefferzeile tr\u00E4gt. */}
          <span className="min-w-0 flex-1 truncate text-transparent">
            <span className="bg-rule-soft opacity-60">{'\u00A0'.repeat(n)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// Query-Wörter im Snippet/Untertitel deterministisch hervorheben (S3/#56).
// WELCHE Stellen das sind, entscheidet die Suche selbst: `hervorhebungsStellen`
// verwendet ihre Tokenisierung, ihre Normalisierung und ihre Wortgrenzen-Regel
// (§5). Bis 5.9.2026 baute diese Funktion ein eigenes Alternativ-Muster aus den
// Query-Wörtern OHNE Wortanfangs-Anker — sie markierte «or» mitten in
// «S·or·gfalt» und «miete» in «Ver·miete·r», obwohl der Index mit
// `tokenize: 'forward'` (Präfix ab Wortanfang) nie so getroffen hat (LM-187,
// Prod-Reproduktion 5.9.2026). Hier bleibt nur die DARSTELLUNG (§3): Text an den
// gelieferten Spannen schneiden, die Trefferstücke in <mark> fassen.
function markiere(text: string, q: string): ReactNode {
  const stellen = hervorhebungsStellen(text, q);
  if (stellen.length === 0) return text;
  // Hervorhebung über Gewicht + dunklere Tinte statt Farbfläche: eine brass-
  // Hintergrund-Tönung drückte den ink-500-Snippet-Text unter AA (axe: 4.23:1
  // auf brass-100) — Gewicht/ink-700 ist in BEIDEN Themes kontrastsicher, weil
  // der Hintergrund die Panel-Fläche bleibt (§13/F2).
  const teile: ReactNode[] = [];
  let pos = 0;
  stellen.forEach((s, i) => {
    if (s.start > pos) teile.push(text.slice(pos, s.start));
    teile.push(
      <mark key={i} className="bg-transparent font-semibold text-ink-700">{text.slice(s.start, s.ende)}</mark>,
    );
    pos = s.ende;
  });
  if (pos < text.length) teile.push(text.slice(pos));
  return teile;
}

function ZeileInhalt({ t, gruppe, sprung, q, artStumm }: {
  t: SuchTreffer; gruppe: GruppenId; sprung?: boolean; q: string;
  /** G19: die Zeile darüber trägt dieselbe Art — dann schweigt diese. */
  artStumm?: boolean;
}) {
  const art = artStumm ? null : trefferArt(t);
  return (
    <>
      {/* Der Registerstrich am Zeilenanfang — dasselbe Zeichen wie im
          Leerzustand, aus derselben Tabelle (`layout/bereiche`, §5). */}
      <RegisterMarke route={t.href} />
      {/* EINE Zeile, gekappt: die Höhe der Streifen ist ein CLS-Versprechen
          (§15.2), und sie war es bis hierher nicht — ein zweizeiliges Snippet
          machte aus 37 px bis zu 266 px. Der volle Titel UND das, was vorher
          als zweite Zeile stand, sind im `title` erhalten (§8: nichts geht
          verloren, es steht nur nicht mehr in der Liste).
          Die Query-Hervorhebung wandert mit: sie sitzt jetzt auf der Kurzform
          statt auf dem gefallenen Snippet — dieselbe Funktion, dieselbe
          Quelle (`lib/suche/hervorhebung`, deren Tokenisierung entscheidet). */}
      <span className="min-w-0 flex-1 truncate" title={trefferTitel(t)}>
        {markiere(trefferKurzform(t, gruppe), q)}
      </span>
      {/* Norm-Sprung (A5): «↵» sagt «Enter springt direkt» — keine Wiederholung
          des D9-Pfeilmusters, sondern eine andere Aussage. */}
      {sprung && <span aria-hidden className="lc-griff-glyph shrink-0 text-ink-900">↵</span>}
      {/* Die ART als ruhiger Text rechts, ohne Kasten (F1) — und der
          Leitentscheid als WORT statt als ★ (F4). Herleitung: `trefferArt`. */}
      {art && <span className="shrink-0 text-xs text-ink-500">{art}</span>}
    </>
  );
}

function Zeile({ t, gruppe, onAuswahl, onNavigate, optionId, aktiv, alsOption, sprung, q, artStumm, buendelStart }: {
  t: SuchTreffer;
  gruppe: GruppenId;
  onAuswahl?: () => void;
  onNavigate?: (href: string) => void;
  optionId?: string;
  aktiv?: boolean;
  alsOption?: boolean;
  sprung?: boolean;
  q: string;
  artStumm?: boolean;
  buendelStart?: boolean;
}) {
  // G19: die Haarlinie sitzt an der Zeile, nicht als eigener Knoten — ein
  // zusätzliches <li> zwischen den Optionen wäre im Listbox-Modus ein
  // aria-required-children-Verstoss (dieselbe Grenze, an der schon der
  // «alle N»-Sprung als echte role=option gebaut ist).
  const zeileCls = buendelStart ? `${ZEILE_CLS} border-t border-line/60` : ZEILE_CLS;
  // Listbox-Option: KEIN inneres <a> (ein fokussierbarer Link in role=option ist
  // nested-interactive, axe serious — Entscheid David 26.6.2026). Maus/Touch
  // navigieren über onNavigate; die Tastatur läuft über die Combobox (Enter im
  // Feld öffnet den aktiven Treffer, aria-activedescendant zeigt ihn an).
  if (alsOption) {
    return (
      <li role="option" id={optionId} aria-selected={!!aktiv}
        onClick={() => { onAuswahl?.(); onNavigate?.(t.href); }}
        className={`${zeileCls} cursor-pointer${aktiv ? ' hs-aktiv' : ''}`}>
        <ZeileInhalt t={t} gruppe={gruppe} sprung={sprung} q={q} artStumm={artStumm} />
      </li>
    );
  }
  return (
    <li>
      <Link to={t.href} onClick={onAuswahl} className={zeileCls}>
        <ZeileInhalt t={t} gruppe={gruppe} sprung={sprung} q={q} artStumm={artStumm} />
      </Link>
    </li>
  );
}

function Gruppe({ g, index, onAuswahl, onNavigate, listboxId, aktivId, q, sektionsRollen }: {
  g: SuchGruppe;
  index: number;
  onAuswahl?: () => void;
  onNavigate?: (href: string) => void;
  listboxId?: string;
  aktivId?: string;
  q: string;
  sektionsRollen?: boolean;
}) {
  // Gruppen-Landmarke: im Listbox-Modus zwingend (role=group in der Listbox); auf
  // der /suche-Seite (S5) optional per `sektionsRollen`, damit Screenreader die
  // Inhaltstyp-Abschnitte ansteuern können — ohne den Options-Modus.
  const alsGruppe = !!listboxId || !!sektionsRollen;
  // ── G19 (Gesamtprüfung 6.9.2026) · DER RHYTHMUS EINER TREFFERLISTE ────────
  // Gemessen @1440 auf `/suche` (Screen `gesamt-a-14`): in der
  // Gesetzestext-Gruppe stand rechts in JEDER der 200 Zeilen dasselbe Wort
  // «Gesetz», und die ersten 200 Treffer waren Art. 271 ff. DESSELBEN Erlasses
  // ohne jede Zäsur. Beides ist Wiederholung, nicht Auskunft: den Typ nennt
  // schon der Gruppenkopf darüber, und eine 200 Zeilen lange Fläche ohne
  // Gliederung liest sich als eine einzige.
  // Zwei rein darstellerische Ableitungen, beide ohne Eingriff in Reihenfolge
  // oder Auswahl der Treffer (Suchlogik unberührt, §5 — sie bleibt in
  // `lib/universalSuche.ts`):
  //   · die Art rechts erscheint nur, wo sie WECHSELT (Kanton, Regime,
  //     «Leitentscheid») — die Wiederholung schweigt;
  //   · wo mehrere Treffer auf dasselbe Dokument zeigen, trennt eine Haarlinie
  //     die Bündel. Sie erscheint NUR in Gruppen, in denen wirklich gebündelt
  //     wird — sonst wäre sie an jeder Zeile und damit wieder Rauschen.
  const rhythmus = useMemo(() => {
    const basis = g.treffer.map((t) => t.href.split('#')[0].split('?')[0]);
    const zaehl = new Map<string, number>();
    for (const b of basis) zaehl.set(b, (zaehl.get(b) ?? 0) + 1);
    const buendelt = [...zaehl.values()].some((n) => n > 1);
    const arten = g.treffer.map(trefferArt);
    return g.treffer.map((_t, i) => ({
      artStumm: arten[i] !== null && i > 0 && arten[i] === arten[i - 1],
      buendelStart: buendelt && i > 0 && basis[i] !== basis[i - 1],
    }));
  }, [g.treffer]);
  return (
    <div role={alsGruppe ? 'group' : undefined} aria-label={alsGruppe ? g.titel : undefined}
      className="lc-reveal border-t border-line first:border-t-0" style={{ animationDelay: `${index * 55}ms` }}>
      <div className="flex items-baseline gap-2 px-4 pt-3 pb-1">
        {/* K6 (W2·29, 23.9.2026): auf `/suche` (`sektionsRollen`) ist der
            Gruppentitel die Überschrift eines Abschnitts, nicht das Etikett
            eines Aufklapp-Felds — Tinte und Gewicht statt Etiketten-Stufe
            (Board «Unter-Suche»). Das Kopf-Dropdown (1.4.1) bleibt Etikett. */}
        <span className={sektionsRollen ? 'text-body-s font-semibold text-ink-900' : 'lc-overline'}>{g.titel}</span>
        {/* Zähler je Gruppe (A6) — ausser beim einzeiligen Norm-Sprung («1» wäre Lärm). */}
        {!g.laedt && g.id !== 'sprung' && <span className="num text-xs text-ink-500">{g.gesamt}</span>}
        {/* Listbox-Modus: KEIN <a> im Gruppenkopf — ein Link ist als Listbox-Kind
            ein axe-critical aria-required-children-Verstoss. Der «alle N»-Sprung
            wird dort als echte role=option am Gruppenende gerendert (unten). */}
        {g.mehrHref && !listboxId && (
          <Link to={g.mehrHref} onClick={onAuswahl} className="ml-auto text-body-s text-ink-700 underline hover:text-ink-900">
            alle {g.gesamt}
          </Link>
        )}
      </div>
      {/* Einmalige, dezente §8-Offenlegung (z. B. «Suchbegriffe verlassen den Browser»). */}
      {/* F3: der §8-Hinweis steht auf der FUSSNOTEN-Stufe (11 px), nicht auf
          der Satzgrösse — sonst trägt eine Liste drei Textgrössen (Zeile 14,
          Etikett 12, Hinweis 14) und liest sich als drei Ebenen statt als eine
          Liste mit Beiwerk. Dieselbe Stufe wie die Abdeckungs-Fusszeile unten. */}
      {g.hinweis && <p className="px-4 pb-1 text-micro leading-snug text-ink-500">{g.hinweis}</p>}
      {/* Externer Amtslink (BGE «nicht im Bestand» → search.bger.ch). Echter
          `<a target>` (kein Listbox-Option — External-Navigation), rel gesichert. */}
      {g.externLink && (
        <a href={g.externLink.href} target="_blank" rel="noopener noreferrer"
          className="mx-4 mb-2 mt-1 inline-flex items-center gap-1.5 text-body-s text-ink-700 no-underline hover:text-ink-900">
          {g.externLink.label} <span aria-hidden>↗</span>
        </a>
      )}
      {g.laedt
        // F6 · Mindesthöhen-Platzhalter (§15.2): bis hierher EINE Textzeile —
        // die Gruppe wuchs beim Eintreffen ihrer Treffer um ein Vielfaches.
        // Jetzt reserviert das Skelett so viele Zeilen, wie eine gekappte
        // Gruppe höchstens zeigt; der Text bleibt als ehrliche Auskunft (§8)
        // darüber stehen.
        ? <>
            <p className="px-4 pb-1 text-micro leading-snug text-ink-500">wird durchsucht …</p>
            <SkelettListe />
          </>
        : <ul role={listboxId ? 'none' : undefined} className="pb-1.5">
            {g.treffer.map((t, i) => {
              const oid = listboxId ? suchOptionId(listboxId, g.id, t.id) : undefined;
              return <Zeile key={`${g.id}:${t.id}`} t={t} gruppe={g.id} onAuswahl={onAuswahl} onNavigate={onNavigate}
                optionId={oid} aktiv={!!oid && oid === aktivId} alsOption={!!listboxId} sprung={g.id === 'sprung'} q={q}
                artStumm={rhythmus[i].artStumm} buendelStart={rhythmus[i].buendelStart} />;
            })}
            {/* «alle N Treffer»-Sprung als ARIA-Option (statt Kopf-Link, s. oben);
                in flacheTreffer() enthalten → per Pfeiltasten + Enter erreichbar. */}
            {listboxId && g.mehrHref && (() => {
              const oid = suchOptionId(listboxId, g.id, MEHR_TREFFER_ID);
              return (
                <li role="option" id={oid} aria-selected={oid === aktivId}
                  onClick={() => { onAuswahl?.(); onNavigate?.(g.mehrHref!); }}
                  className={`${ZEILE_CLS} cursor-pointer${oid === aktivId ? ' hs-aktiv' : ''}`}>
                  {/* D9: der Pfeil ist mit dem Pfeil-Muster der Treffer-Zeilen
                      gefallen — die Zeile sagt ihr Ziel im Wortlaut.
                      D23: der (leere) Marken-Platz hält den Titel in der Flucht
                      der Trefferzeilen darüber. */}
                  <RegisterMarke route={g.mehrHref!} />
                  <span className="min-w-0 flex-1 text-body-s font-medium text-ink-700 underline">alle {g.gesamt} Treffer anzeigen</span>
                </li>
              );
            })()}
          </ul>}
    </div>
  );
}

export function SuchResultate({ gruppen, allesGeladen, q, onAuswahl, onNavigate, listboxId, aktivId, vorschlag, abdeckung, onVorschlag, sektionsRollen, onLeeren, panelKlasse, wartet }: {
  gruppen: SuchGruppe[];
  allesGeladen: boolean;
  q: string;
  onAuswahl?: () => void;
  /** Maus/Touch-Navigation im Listbox-Modus (Optionen sind keine <a> mehr). */
  onNavigate?: (href: string) => void;
  /** Setzt das Panel in den ARIA-Listbox-Modus (Pfeil-Nav vom steuernden Feld). */
  listboxId?: string;
  /** Options-ID des aktuell hervorgehobenen Treffers (aria-activedescendant). */
  aktivId?: string;
  /** «Meinten Sie …?»-Vorschlag (S3) — oder null/undefined. */
  vorschlag?: string | null;
  /** §8-Korpus-Offenlegung für die Fusszeile (S3/E1) — oder null. */
  abdeckung?: Abdeckung | null;
  /** Übernimmt einen Vorschlag als neue Query (setzt das Feld). */
  onVorschlag?: (begriff: string) => void;
  /** /suche-Seite (S5): jede Gruppe als role=group-Landmarke (ohne Listbox). */
  sektionsRollen?: boolean;
  /** Setzt die Suche zurück (Weiterweg aus dem Null-Treffer-Leerzustand, B2). */
  onLeeren?: () => void;
  /** Zusatzklassen an der Listbox selbst (Kopf-Dropdown: Scroll-Kappung).
   *  WARUM AM role=listbox und nicht an der Hülle: axe `scrollable-region-focusable`
   *  (serious) verlangt für jede scrollende Fläche einen Tastaturzugang — und
   *  nimmt genau EINE Fläche aus: den Popup einer Combobox (`isComboboxPopup`,
   *  d. h. das per `aria-controls` referenzierte Element mit Popup-Rolle). Ein
   *  `tabIndex={-1}` an der Hülle genügt der Regel NICHT (ihr Check
   *  `focusable-element` prüft `isInTabOrder`, und −1 ist gerade nicht in der
   *  Tab-Ordnung); es sah nur deshalb grün aus, weil die Regel erst greift,
   *  sobald der Inhalt wirklich überläuft — im Parallel-Lauf vom 6.9.2026 tat er
   *  das und der Fall wurde rot. Scrollt die LISTBOX selbst, greift die Regel
   *  gar nicht erst, und ein Tab-Stopp im Widget (Cowork-Befund 38) entsteht
   *  trotzdem nicht. */
  panelKlasse?: string;
  /** F6 · true, solange der Nutzer bereits getippt hat, die Query aber noch
   *  nicht übernommen ist (120 ms Entprellung in `HeaderSuche`). GEMESSEN
   *  6.9.2026: in genau diesem Fenster stand das Kopf-Panel als 1-px-Streifen
   *  da — zwei Rahmen ohne Inhalt — und sprang danach auf 660 px. Ohne diese
   *  Auskunft KANN das Panel den Fall nicht kennen: es sieht nur `q`, und `q`
   *  ist in diesem Fenster leer. Die Hero-/`/suche`-Flächen übergeben sie
   *  nicht; dort heisst ein leeres `q` unverändert «es gibt keine Query». */
  wartet?: boolean;
}) {
  if (q === '') {
    if (!wartet) return null;
    // ── a11y-WURZEL (Blocker `Startseite mit offener Kopf-Suche`, 6.9.2026) ──
    //
    // GEMESSEN (e2e/a11y.e2e.ts:115, 6/10 rot, Ausgabe `e2e-pre-landung.log`):
    //   aria-valid-attr-value (critical) — Invalid ARIA attribute value:
    //   aria-controls="_r_0_"  · 1 Knoten, `input`
    // Das Feld meldet `aria-expanded` + `aria-controls={listboxId}`, sobald
    // etwas getippt ist (`zeigtPanel = offen && !feldLeer`, HeaderSuche). In
    // den 120 ms der Entprellung ist `q` aber noch leer — und dieser Zweig
    // rendert das Warte-Panel OHNE `id`/`role`. Damit zeigte `aria-controls`
    // auf ein Element, das es nicht gab: für axe eine ungültige Referenz, für
    // eine Sprachausgabe ein Widget, dessen Popup nicht auffindbar ist.
    // Der Fall ist ein RENNEN — der Wächter wartet auf `.lc-suchpanel`, und
    // diese Klasse trägt das Warte-Panel ebenfalls —, daher die 6/10.
    //
    // (Der Prüfbefund hatte `scrollable-region-focusable` an
    // `.lc-schwebeflaeche` vermutet; die gemessene Ausgabe nennt eine andere
    // Regel und einen anderen Knoten. §7: abweichend umgesetzt und
    // offengelegt. Die Scroll-Regel greift hier ohnehin nicht mehr — sie nimmt
    // genau das per `aria-controls` referenzierte Combobox-Popup aus, und das
    // ist dieses Element jetzt.)
    //
    // FIX AN DER WURZEL: das Warte-Panel IST der Popup — es bekommt Identität
    // und Rolle der Listbox, plus `aria-busy` für «die Optionen kommen noch».
    // Das ist zugleich das ARIA-Muster für eine ladende Listbox; ohne
    // `aria-busy` verlangte `aria-required-children` bereits Optionen.
    // Ohne `listboxId` (Hero, /suche) bleibt das Markup unverändert.
    return (
      <div className={`lc-suchpanel${panelKlasse ? ` ${panelKlasse}` : ' overflow-hidden'}`}
        role={listboxId ? 'listbox' : undefined} id={listboxId}
        aria-label={listboxId ? 'Suchtreffer' : undefined}
        aria-busy={listboxId ? true : undefined}>
        <p className="px-4 pt-3 pb-1 text-micro leading-snug text-ink-500">wird durchsucht …</p>
        <SkelettListe />
      </div>
    );
  }

  // §8-ehrlicher Zähler (S3/#5): solange Sektionen laden, ist die Zahl nicht final
  // → «N+ … wird noch durchsucht»; erst wenn alles geladen ist, die feste Zahl.
  const nochLaedt = !allesGeladen || gruppen.some((g) => g.laedt);
  // `unvollstaendig` (W2·5, gestaffelter Artikel-Index) ist NICHT dasselbe wie
  // `laedt`: Treffer sind bereits da und brauchbar, die Menge wächst nur noch.
  // Darum behält die Kopfzeile ihre Aufschlüsselung — der Überblick soll sofort
  // ablesbar sein — und trägt den Vorbehalt als Zusatz. Die Alternative («mindestens
  // N …») hätte die Aufschlüsselung bis zum Ende des Nachladens verschluckt und
  // damit weniger Auskunft gegeben, nicht mehr. Welche Ebene fehlt, sagt der
  // Hinweis AN der betroffenen Gruppe (universalSuche: EBENEN_FEHLT) — hier
  // bewusst ebenen-neutral formuliert, damit die Ebene nicht doppelt kodiert ist.
  const waechstNoch = gruppen.some((g) => g.unvollstaendig);
  const gesamt = gruppen.reduce((n, g) => n + (g.laedt ? 0 : g.gesamt), 0);
  // Ergebnis-Kopfzeile «n Treffer, davon x Erlasse / y Artikel» (IA-1, praxis #10):
  // die Aufschlüsselung nennt nur die tatsächlich getroffenen Inhaltsklassen
  // (Gesetze/Gesetzestext), damit ein Überblick sofort ablesbar ist — kein
  // «0 …»-Lärm (§8), Singular/Plural sauber.
  const zahl = (id: string) => gruppen.find((g) => g.id === id && !g.laedt)?.gesamt ?? 0;
  const erlasse = zahl('gesetz');
  const artikel = zahl('artikel');
  const teile: string[] = [];
  if (erlasse > 0) teile.push(`${erlasse} ${erlasse === 1 ? 'Erlass' : 'Erlasse'}`);
  if (artikel > 0) teile.push(`${artikel} Artikel`);
  const kopf = `${gesamt} Treffer${teile.length ? `, davon ${teile.join(' / ')}` : ''}`
    + (waechstNoch ? ' — wird noch ergänzt' : '');
  const status = gruppen.length === 0
    ? (allesGeladen ? 'Keine Treffer' : 'wird durchsucht …')
    : nochLaedt ? `mindestens ${gesamt} Treffer, wird noch durchsucht …` : kopf;

  return (
    <>
      {/* Knappe Live-Region: die Trefferzahl (mit Aufschlüsselung), nicht die ganze
          Liste (§13/F4). */}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
      {/* Sichtbare Ergebnis-Kopfzeile (IA-1): der Text erscheint erst, wenn alles
          geladen ist (der Leerfall steht ehrlich in der Karte selbst). aria-hidden,
          weil die Live-Region oben denselben Text bereits ansagt.
          §15.2/CLS-Fix (Shard-1-Last, 20.7.2026): Der SLOT wird bereits reserviert,
          sobald Gruppen da sind — solange geladen wird, hält ihn `invisible` auf
          voller Zeilenhöhe (Layout bleibt, kein sichtbarer Text). Erschien die
          Kopfzeile erst mit `!nochLaedt`, mountete sie unter Runner-Last SPÄT
          (ausserhalb des 500-ms-hadRecentInput-Fensters) ÜBER der bereits gemalten
          Trefferkarte und schob diese um eine Zeilenhöhe nach unten — der dominante
          A9-Shift (Δ≈0.125, `div#…lc-card` y+19). Mit reserviertem Slot bewegt sich
          die Karte beim Fertig-Werden nicht mehr. `invisible` ist eine echte
          Utility (keine Magic-Number, §13); der Slot bleibt aria-hidden. */}
      {gruppen.length > 0 && (
        /* D23: `px-1` -> `px-4 pt-2.5 pb-1.5`. Die Zeile stand 4 px vom Rand
           und damit weder in der Flucht der Gruppen-Etiketten darunter (px-4)
           noch mit Luft zur Feldkante — im Kopf-Dropdown klebte sie seit dem
           Wegfall der Huellen-Polsterung direkt am Unterstrich des Feldes.
           Die Flucht gilt an allen drei Orten gleich (§5). */
        /* F3 · EINE ETIKETT-STUFE. Die Zählzeile stand auf der SATZ-Grösse
           (14 px, `font-medium`) und war damit die vierte Textstufe des Panels,
           obwohl den Zähler längst jeder Gruppenkopf trägt («Artikel 40»,
           «Rechtsprechung 12»). Sie steht jetzt auf derselben Etiketten-Stufe
           wie diese Zähler (12 px, ink-500) — die Aufschlüsselung bleibt, sie
           drängt sich nur nicht mehr vor die Treffer.
           BEWUSST NICHT GESTRICHEN (deklarierte Abweichung, §7): zwei
           Lade-Synchronisationen ausserhalb dieses Pakets warten auf genau
           dieses Element — `e2e/gesetze-ia-v2-walks.e2e.ts` («N Treffer, davon
           …») und `e2e/norm-sprung.e2e.ts` («wird noch ergänzt»); es ist dort
           die einzige Marke dafür, dass JEDE Suchgruppe fertig geladen ist.
           Sie ersatzlos zu entfernen hiesse, zwei fremde Wächter umzubauen. */
        <p aria-hidden className={`px-4 pt-2 pb-1 text-xs text-ink-500${nochLaedt ? ' invisible' : ''}`}>{nochLaedt ? ' ' : (kopf || ' ')}</p>
      )}
      {/* «Meinten Sie …?» (S3) — deterministischer Tippfehler-Vorschlag, ausserhalb
          der Listbox (kein Options-Element), setzt bei Klick die Query. */}
      {vorschlag && (
        <p className="border-y border-rule-soft px-4 py-2 text-body-s text-ink-600">
          Meinten Sie{' '}
          <button type="button" onClick={() => onVorschlag?.(vorschlag)}
            className="font-medium text-ink-700 underline decoration-dotted underline-offset-2 hover:text-ink-900">
            {vorschlag}
          </button>
          ?
        </p>
      )}
      <div className={`lc-suchpanel${panelKlasse ? ` ${panelKlasse}` : ' overflow-hidden'}`}
        role={listboxId ? 'listbox' : undefined} id={listboxId}
        aria-label={listboxId ? 'Suchtreffer' : undefined}>
        {gruppen.length === 0
          ? (allesGeladen
              // B2 (W2·19-DESIGN-KONSISTENZ R6-B): der kanonische Leerzustand
              // (ui/Leerzustand, §5/§10) statt einer eigenen Kopie — mit
              // Rücksetz-Knopf wie die übrigen Null-Treffer-Fälle (Materialien,
              // Gesetze, RechnerUebersicht, Rechtsprechung, Katalog). Die
              // Hero-Suche (UniversalSuche, ohne lokalen Rücksetzer) übergibt
              // `onLeeren` nicht — dort ist der einzig ehrliche Ausweg ein
              // LINK auf die volle Suchseite mit derselben Query (R6-B).
              ? <div className="px-4 py-4">
                  <Leerzustand art="filter"
                    text={`Keine Treffer zu «${q}». Versuchen Sie einen Erlass, eine Norm oder ein Stichwort.`}
                    weiterweg={onLeeren
                      ? { text: 'Suche zurücksetzen', onKlick: onLeeren }
                      : { text: 'Alle Bereiche durchsuchen', href: `/suche?q=${encodeURIComponent(q)}` }} />
                </div>
              // F6 · GEMESSEN am Stand `c91541617`: das Panel stand 2.7 s auf
              // 1 px und sprang dann auf 729 px, sobald der Artikel-Index kam.
              // Das Skelett reserviert die Höhe einer gekappten Gruppe.
              : <>
                  <p className="px-4 pt-3 pb-1 text-micro leading-snug text-ink-500">wird durchsucht …</p>
                  <SkelettListe />
                </>)
          : gruppen.map((g, i) => <Gruppe key={g.id} g={g} index={i} onAuswahl={onAuswahl} onNavigate={onNavigate} listboxId={listboxId} aktivId={aktivId} q={q} sektionsRollen={sektionsRollen} />)}
      </div>
      {/* §8-Korpus-Offenlegung (S3/E1): was die Suche wirklich durchsucht, ausserhalb
          der Listbox. Link auf die Abdeckungsseite «Was ist drin». Erscheint — wie
          zuvor — sobald die Manifeste (gesetze+entscheide) da sind, NICHT erst wenn
          alles fertig geladen ist: das hielte die §8-Offenlegung auf dem langsamen
          Runner unnötig lange zurück (Fragilität genau dort, wo wir härten). Ihr
          kleiner, spät durch das Karten-Wachstum ausgelöster Rest-Shift bleibt weit
          unter Budget; den dominanten A9-Shift trägt die Kopfzeilen-Reservierung
          oben (§15.2). */}
      {abdeckung && (
        // 11px-Feinschrift in ink-600, nicht ink-500 (Auftrag David 25.6.2026,
        // Muster lc-fineprint): auf brass-getönten Flächen (Hero) fällt ink-500
        // bei 11px unter AA (axe 4.23:1) — ink-600 trägt AA in beiden Themes.
        // T2 (Design-Qualitäts-Pass 29.8.2026): Abdeckungs-Zeile auf der
        // 11-px-Stufe, gemessen @1440 auf `/suche` 630 px = 129 ch/Zeile
        // (WCAG 2.2 SC 1.4.8: 80). `max-w-kleintext` ist die Feinschrift-
        // Lesespalte (Herleitung am Token in `tailwind.config.js`). Die GRÖSSE
        // bleibt hier `micro`: anders als die Hinweise im Leser trägt diese
        // Zeile keinen Fliesstext, sondern eine Zahlen-Bilanz dicht unter dem
        // Trefferzähler.
        <p className="px-4 py-2.5 max-w-kleintext text-micro leading-snug text-ink-600">
          {/* «Erlasse (Bund + International)», nicht «Bund-Erlasse» (Cowork-Befund
              32, 18.8.2026): die Zahl zählt alle Volltext-Snapshots der Ebene
              `bund` — darunter die Staatsverträge/EU-Erlasse, die unter dieser
              Ebene geführt werden. Die /gesetze-Kachel «Bundesrecht» zählt den
              Katalog OHNE International (201 vs. 227): zwei Mengen, die ohne
              Benennung wie ein Widerspruch lasen (§8). */}
          {/* K3-Scharfschaltung (1.9.2026): der statische Index trägt keine
              kantonalen Artikel mehr — kantonaler Volltext kommt aus der
              Online-Suche und fehlt ohne Verbindung. «Nur nach Titel» allein
              wäre jetzt zu wenig gesagt (die Online-Suche findet sehr wohl im
              Wortlaut) und «durchsucht» zu viel (offline findet sie nichts);
              die Zeile nennt darum beides (§8). */}
          Durchsucht: {abdeckung.volltext} Erlasse im Volltext (Bund + International) · {abdeckung.bge} BGE ·
          {' '}kantonale Erlasse ({abdeckung.kantonTitel}): nach Titel — im Volltext nur online.{' '}
          {/* R3-NACHZUG 6.9.2026 (W2·24, Befund R3-F1): `no-underline` → `underline`.
              Der Verweis steht MITTEN in dieser Scope-Zeile und war allein durch
              die Farbe unterschieden — gemessen von axe 2.06:1 (hell) bzw. 1.85:1
              (dunkel) gegen den Fliesstext, beides unter der 3:1-Schranke für
              «Unterscheidung ohne Farbe» (WCAG 1.4.1). Seit dem Token-Tausch R1
              ist `brass-700` reine Tinte, die Farbe unterscheidet also gar nichts
              mehr. §5 des Fahrplans: Links unterstrichen. */}
          {/* F3 · der Pfeil ist mit dem D9-Pfeilmuster gefallen; der Verweis bleibt als
              unterstrichener Text mitten in der Scope-Zeile (R3-Nachzug oben). */}
          <Link to="/abdeckung" onClick={onAuswahl} className="text-ink-700 underline hover:text-ink-900">Was ist drin?</Link>
        </p>
      )}
    </>
  );
}
