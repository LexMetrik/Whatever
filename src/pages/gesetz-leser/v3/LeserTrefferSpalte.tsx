import { useEffect, useRef } from 'react';
import { LeserTrefferListe } from './LeserTrefferListe';
import type { BestimmungsWort } from './erlassAnsicht';
import type { LeserV3Modell } from './leserV3Modell';

// ═══ D38 (David 7.9.2026) · DIE TREFFER ERSETZEN DEN GESETZESTEXT ═══════════
//
// BEFUND, wörtlich: «die suchresultate die erscheinen wenn man im gesetz sucht
// sollen nicht in der gliederung erscheinen sondern den gesetzestext ersetzen».
//
// WAS VORHER WAR — drei Orte für EINE Liste, keiner davon der Lesefläche:
//  · Spalte:  `LeserGliederung` tauschte den Gliederungsbaum gegen die Treffer.
//             Wer suchte, verlor damit die Gliederung, während er sie am
//             nötigsten hat (Ä32 musste eigens «alles auf/zu» abschalten, weil
//             der Knopf auf einen Baum zeigte, der gar nicht mehr dastand).
//  · Blatt:   `LeserTrefferBlatt` am Feld, 18 rem breit, halbe Fensterhöhe —
//             die Notlösung für die eingeklappte Spalte (Ä76).
//  · Sheet:   @390 dieselbe Liste im Bottom-Sheet, modal über allem.
// Drei Lagen, drei Geometrien, drei Wächter — für eine Auskunft, die den
// grössten Teil des Bildschirms verdient hätte: die 640 px breite Lesefläche
// zeigte derweil den Text, den man gerade nicht liest, weil man sucht.
//
// WAS JETZT IST: solange im Suchfeld etwas steht, liegt die Trefferliste über
// der LESESPALTE. Die Gliederung bleibt daneben stehen — unverändert, bedienbar,
// mit «alles auf/zu» und «Sie sind hier» wie im Ruhezustand.
//
// ── WARUM ÜBERLAGERN UND NICHT AUSTAUSCHEN ──────────────────────────────────
// Die naheliegende Bauart wäre `sucheAktiv ? <Liste/> : <Lesespalte/>`. Sie
// kostet DREI Dinge, die diese Fassung geschenkt bekommt:
//  (a) DIE LESESTELLUNG. Ein Austausch nimmt dem Dokument seine Höhe (OR:
//      ~1'686 Artikel), der Scroller klemmt auf 0, und beim Zurückschalten
//      müsste eine gemerkte Zahl die Position rekonstruieren. Hier bewegt sich
//      der Text NIE: die Liste liegt `absolute` darüber und nimmt keinen Platz.
//      Esc oder ein geleertes Feld geben den Text an genau der Stelle frei, an
//      der er stand — ohne eine Zeile Wiederherstellungs-Code (§2: kein
//      Zustand, der auseinanderlaufen kann).
//  (b) LAYOUT-SHIFT 0. Was keinen Platz nimmt, verschiebt nichts; die
//      Umschaltung Text↔Treffer ist per Konstruktion CLS-frei, nicht per
//      Messung (`leser-r1-r2` A9, `leser-v3-kontext-cls`).
//  (c) DEN SPRUNG ZURÜCK. `zeigeFundstelle` (inhalt-suchtreffer.tsx) sucht
//      `#art-…` IM DOM und scrollt dorthin. Wäre die Lesespalte ausgehängt,
//      müsste jeder Klick auf eine Trefferzeile erst remounten, zwei Frames
//      warten und dann springen. So ist der Text die ganze Zeit da: Klick →
//      Liste weicht, der Sprung läuft unverändert durch die bestehende
//      Mechanik (§5, keine zweite Sprungart).
// Preis, offengelegt (§8): der Gesetzestext bleibt gerendert, während man ihn
// nicht sieht. Er wird dadurch nicht teurer — er war schon da; teuer wären das
// Aushängen und das erneute Aufbauen bei jedem Wechsel (§15).
//
// §3: reine Anordnung. Die Liste rechnet nichts, diese Datei auch nicht — sie
// reicht die Werte des Modells durch (dasselbe Bauteil wie zuvor in der Spalte,
// §5) und sagt, WO sie liegen.

/** Luft über der aktiven Zeile beim Mitführen — die klebende Werkzeugzeile der
 *  Liste (`TrefferLeiste`) deckt die obersten Pixel des Scrollers ab. */
const LEISTE_LUFT = 48;

export function LeserTrefferSpalte({ m, bestimmungsWort, vollflaechig, onSprung, onSchliessen }: {
  m: LeserV3Modell;
  /** Ä23/B8 · Zähl-Substantiv aus dem Datenmodell («Artikel» / «Paragraphen»). */
  bestimmungsWort: BestimmungsWort;
  /** Deckelt das FENSTER die Höhe (Einzelansicht) oder der Pane-Scroller?
   *  Dieselbe Unterscheidung und dieselbe Formel wie an der Gliederungs-Spalte
   *  (`./LeserLeseZeile`) — und aus demselben Grund NICHT `imPane` benannt
   *  (Fundament-Sonde: eine Eigenschaft der Fläche, nicht der Hülle). */
  vollflaechig: boolean;
  /** Der Leser hat ein Ziel gewählt ⇒ die Liste weicht, der Text ist wieder da. */
  onSprung: () => void;
  /** Esc in der Liste — nimmt die Liste, nicht die Suche (der Begriff bleibt
   *  im Feld, die Zähler-Zeile führt mit «Treffer anzeigen →» zurück). */
  onSchliessen: () => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const stelle = m.aktivStelle;
  // ── DIE LAUFENDE STELLE BLEIBT IN SICHT ───────────────────────────────────
  // ↑↓ bewegen die Fundstelle; solange die Liste die Lesefläche hat, ist sie
  // das, was der Leser dabei ANSIEHT — eine Hervorhebung ausserhalb des
  // Scrollers wäre eine Rückmeldung, die niemand bekommt (§8).
  // KEIN `scrollIntoView`: das darf jeden Vorfahren mitscrollen, also auch die
  // Seite — und die Seite hält hier die Leseposition, die wir gerade nicht
  // antasten wollen (Lehre `inhalt-hooks.tsx`, «block:'nearest'»). Gerechnet
  // wird darum von Hand, und geschrieben wird ausschliesslich `scrollTop`
  // DIESES Scrollers.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !stelle) return;
    // ── W2·17-UI-BEFUNDE · PE-C5-B01 / PE-C7-B02 (1.10.2026) ──────────────────
    // ZWEI Abfragen mit Vorrang statt EINER Selektorliste: `querySelector` mit
    // `a, b` liefert das ERSTE Element in DOKUMENT-Reihenfolge, nicht das nach
    // Listenposition — und der Artikel-Knopf (`data-treffer-aktiv`) steht vor
    // seinen Fundstellen-Knöpfen. Gemessen (OR «Mieter», Art. 271a mit 17
    // Stellen, @1440×900): alle 17 laufenden Stellen lagen ausserhalb des
    // Scrollers (top 702…1072 px bei 710 px Höhe), weil immer der KOPF gemessen
    // und der Kopf nie bewegt werden musste. Der Artikel-Knopf ist nur der
    // Ersatz, wo es keine Stellen-Zeile gibt (Stelle nicht gerendert).
    const el = scroller.querySelector<HTMLElement>('[data-treffer-stelle-aktiv]')
      ?? scroller.querySelector<HTMLElement>('[data-treffer-aktiv]');
    if (!el) return;
    const z = el.getBoundingClientRect();
    const s = scroller.getBoundingClientRect();
    if (z.top < s.top + LEISTE_LUFT) scroller.scrollTop += z.top - s.top - LEISTE_LUFT;
    else if (z.bottom > s.bottom) scroller.scrollTop += z.bottom - s.bottom + 8;
  }, [stelle]);

  return (
    // `absolute inset-0`: die Fläche der Lese-Zelle, ohne einen Pixel im Fluss.
    // `bg-paper` deckt den Text — dieselbe opake Grundfläche wie der klebende
    // Kopf, damit keine Tonkante entsteht (Ä5). `print:hidden`: gedruckt wird
    // das Gesetz, nie die Suche (D28, Kanzlei-Akte).
    <div data-v3-treffer-spalte role="region" aria-label="Treffer"
      onKeyDown={(e) => {
        if (e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        onSchliessen();
      }}
      className="absolute inset-0 z-sticky bg-paper print:hidden">
      {/* Klebt am selben Anschlag wie jeder Artikel-Sprung (`--nt-stick`) und
          deckelt sich wie die Gliederungs-Spalte: EIN eigener Scroller, damit
          das Rad über der Liste die Liste bewegt und nicht die Seite darunter
          (`overscroll-contain`). `max-w-reading` ist das Lesemass — die Liste
          steht damit exakt über dem Textkörper, den sie vertritt.

          ── W2·17-UI-BEFUNDE · PE-C5-D01 (1.10.2026) · DER ANKER KLEBT, NICHT DER
              SCROLLER ──────────────────────────────────────────────────────────
          GEMESSEN (OR/«Kündigung», Seite gescrollt, 768/1280/1680): endet die
          Lese-Zelle über dem Seitenende — Dokument-Ende in der Fliess-Ansicht
          (Fusszeile darunter), kurzer Artikel in `?ansicht=artikel` —, schiebt
          die Elternkante den klebenden SCROLLER samt Werkzeugzeile nach oben aus
          dem Bild (Segment −166/−255/−256 px, Zähler und ↑↓ unerreichbar, kein
          Hinweis). `sticky` hält ein Element nur INNERHALB seines Elternkastens;
          der Kasten ist die Zelle, und die Zelle ist kürzer als der Scroller
          hoch ist, sobald man ans Ende kommt.
          JETZT klebt ein ANKER OHNE HÖHE (`h-0`, dieselbe Bauart wie die
          Blur-Kanten in `./LeserLeseZeile`), und der Scroller hängt `absolute`
          darunter: ein Element ohne Höhe wird erst vom Zellenrand selbst
          mitgenommen, nicht schon von dessen Nähe, und der Scroller ragt
          darunter frei über die Zelle hinaus (er trägt deshalb seine eigene
          Papier-Fläche). Der Anschlag ist derselbe (`--nt-stick`), im Fenster
          wie im Pane. */}
      <div data-v3-treffer-anker className="sticky h-0" style={{ top: 'var(--nt-stick)' }}>
      <div ref={scrollerRef} data-v3-treffer-spalte-scroller
        className="absolute inset-x-0 top-0 mx-auto w-full max-w-reading overflow-y-auto overscroll-contain bg-paper [scrollbar-width:thin]"
        style={{
          maxHeight: vollflaechig
            ? 'calc(100vh - var(--nt-stick) - 1.5rem)'
            : 'calc(100dvh - var(--leser-kopf-h) - var(--leser-sub-h) - 1rem)',
        }}>
        {m.sucheAktiv
          ? (
            <LeserTrefferListe treffer={m.treffer} begriff={m.sucheBegriff} fundstellen={m.fundstellen}
              bestimmungsWort={bestimmungsWort}
              aenderungenAus={m.aenderungenAus} position={m.trefferPos} aktivStelle={m.aktivStelle}
              bereich={m.suchBereich} setzeBereich={m.setzeSuchBereich}
              fundstellenFuer={m.fundstellenFuer}
              onZurueck={() => m.springeZuFundstelle?.(-1)} onVor={() => m.springeZuFundstelle?.(1)}
              onSprung={(t) => { m.springeZuTreffer?.(t); onSprung(); }}
              onSprungStelle={(t, r) => { m.springeZuStelle?.(t, r); onSprung(); }} />
          )
          : (
            // ── DIE 200 MS ZWISCHEN TASTENDRUCK UND TREFFERN ─────────────────
            // Die Trefferdaten sind ENTPRELLT (`inhalt-zustand.tsx`, 200 ms),
            // die Liste erscheint aber sofort mit dem ersten Zeichen — sonst
            // stünde der Text noch einen Wimpernschlag da und würde dann
            // verdeckt (ein Flackern, das man auf einem schwachen Telefon sieht).
            // In dieser Lücke sagt die Fläche, was sie tut, statt «Kein Artikel
            // gefunden» zu behaupten (§8: nichts erfinden, auch nicht für einen
            // Augenblick). KEIN Sprung dadurch: die Zeile liegt im selben
            // absoluten Kasten und nimmt keinen Platz im Fluss.
            <p data-v3-treffer-sucht role="status" className="px-1 py-2 text-body-s text-ink-500">
              sucht …
            </p>
          )}
      </div>
      </div>
    </div>
  );
}
