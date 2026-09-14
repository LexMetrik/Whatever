import type { UebersichtsAngaben } from './uebersichtAngaben';
import type { RohdatenZeiger } from './rohdatenZeiger';

// ─── Übersichtsbox der Seitenleiste (FAHRPLAN-LESER-V3 Kap. 4b, Pos. 10) ─────
//
// Die Skizze schreibt sie als ZUGEKLAPPTE Zeile:
//
//   ▸ Übersicht  (SR 312.0 · 480 Art.)                  scrollt MIT weg
//
// Der Kern ist das «▸». Fedlex zeigt drei aufgeklappte Kästen über dem Baum;
// wer im Gesetz liest, sucht dort aber die Gliederung, nicht die Metadaten. Die
// Zusammenfassung in der Zeile beantwortet die Fragen, die man beim Ankommen
// wirklich hat; alles Weitere ist EINEN Klick entfernt und nichts ist versteckt
// (§8 — die Angaben bleiben im DOM und für Ctrl+F/Screenreader erreichbar,
// `<details>` blendet nur visuell aus).
//
// Warum natives `<details>/<summary>` und kein eigener Disclosure: Tastatur,
// `aria-expanded`, Screenreader-Ansage und der Zustand kommen vom Browser —
// eine nachgebaute Variante wäre mehr Code für weniger Verlässlichkeit
// (Design-Grundlage Kap. 1, «Familiarity»). Es gibt hier auch keinen Zustand zu
// persistieren: die Box ist eine Ankunfts-Auskunft, kein Arbeitsbereich.
//
// CLS (§15/2): geschlossen hat die Box eine feste Zeilenhöhe; das Aufklappen
// ist eine NUTZER-Geste unterhalb des klebenden Baum-Kopfes — es verschiebt
// nichts, was gerade gelesen wird — und die Box liegt im Aside, nicht im
// Lesekörper (zur Warn-Zelle s. u.).
//
// ═══ NEUFASSUNG 17.8.2026 · David: «sehr unästhetisch, insbesondere wenn es
//     aufgeklappt ist — mach das schöner und orientiere dich an Fedlex» ═══════
//
// GEMESSEN am Ist (D 1440, hell, aufgeklappt, fünf Erlassarten — Bilder in
// docs/ux-audit-2026-07/reader/leser-v3-uebersicht/vorher/, Zahlen aus mass.mjs):
//
//  (1) Die Ruhezeile lief komplett in der MONO-Stimme (`Geist Mono Variable`,
//      11 px) und brauchte darum an ALLEN FÜNF Erlassen DREI Zeilen. Die
//      Design-Grundlage begrenzt Mono ausdrücklich «auf SR-Nr./Aktenzeichen»
//      (Kap. 2.1) — genau der Befund, den S2 (Ä-(b)) für die Stand-Zeile des
//      Erlass-Kopfs schon behoben hatte; die Box hatte den Nachzug nie bekommen.
//  (2) Vier Zeilen der aufgeklappten Liste waren `truncate` — gebaut für die
//      BREITE Zone C der Ist-Hülle, nicht für eine 18-rem-Leiste. Gemessener
//      Textverlust: StPO «Art:» 282 px, BS-640.100 «Art:» 284 px, LugÜ 98 px,
//      VMWG 66 px, «Stand:» durchgehend 57 px. Erreichbar war der Rest nur im
//      `title` — und ein Tooltip ist keine Auskunft (§8).
//  (3) Im Inneren stand ein ZWEITES Etikett «Erlass-Übersicht» (Kapitälchen +
//      Brass + eigene Linie) unter einer Box, die schon «Übersicht» heisst —
//      zwei Überschriften und zwei waagrechte Linien in 20 px Abstand.
//  (4) Der Halbsatz «massgeblich ist die amtliche Fassung» stand an der StPO
//      ZWEIMAL (Warnung + Grundhinweis) — der H2b-Nachzug (B5) hatte den
//      zweiten WARN-Satz entfernt, den Grundhinweis darunter aber stehen lassen.
//  (5) ZWEI Disclosure-Ebenen: in der aufgeklappten Box lag ein weiteres
//      `<details>` «Mehr zu diesem Erlass» — und dessen `summary` trug zwei
//      Glyphen (eigenes «›» plus das App-weite `::after`, der Ä40-Befund an der
//      inneren Klappe). Dahinter versteckt: die vier §8-Sätze über die Grenzen
//      unserer eigenen Erfassung. Ein Ehrlichkeits-Hinweis hinter zwei Klicks
//      ist keiner.
//  (6) Vier Label-Breiten (21 · 36 · 46 · 38 px) und Doppelpunkte statt einer
//      Wertspalte: jede Zeile begann an einer anderen Stelle — kein Rhythmus,
//      und damit das Gegenteil von Fedlex' «Allgemeine Informationen».
//
// GEBAUT wird darum (Herleitung der Auswahl: `./uebersichtAngaben.ts`):
// EINE Sans-Stimme, eine Label-Spalte fester Breite, Werte darunter
// linksbündig ausgerichtet und UMBRECHEND statt gekappt, `tabular-nums` an den
// Datums-/Zahlenwerten, EINE Haarlinie über und EINE unter der Liste statt
// Kasten und Zwischenüberschrift, alle Abstände auf dem 4-px-Raster, EINE
// Klappe.
//
// ZWEI BEWUSSTE ABWEICHUNGEN, beide begründet statt übergangen:
//  · GRÖSSE. Der Auftrag nennt «Sans 13 px». Die Haus-Skala hat für die Leiste
//    keine 13er-Stufe: `body-s` (14 px) IST die Rolle, die die Design-Grundlage
//    Kap. 2.2 der Seitenleiste zuweist (dort `leser-chrome` genannt — und die
//    tailwind.config sagt ausdrücklich, dass ein zweiter Name für denselben Wert
//    die zweite Wahrheit wäre, die §5 verbietet). `leser-rand` misst zwar 13 px,
//    ist aber die MARGINALIEN-Rolle des Lesekörpers; sie hier zu borgen hiesse,
//    einem Token eine zweite Bedeutung zu geben. Also `body-s` für Liste und
//    Ruhezeile, `xs` (12 px) für Links und §8-Feinschrift.
//  · AUSRICHTUNG. Fedlex richtet seine Werte RECHTS aus (Karte ~200 px breit).
//    Hier nicht: nach der Label-Spalte bleiben rund 184 px, und ein umbrechender
//    Wert («Die Bundesversammlung der Schweizerischen Eidgenossenschaft») liefe
//    rechtsbündig mit ausgefranstem linken Rand — in einer schmalen Spalte
//    schlechter lesbar als linksbündig.

export function UebersichtBox({ angaben, rohdaten }: {
  angaben: UebersichtsAngaben;
  /** W2·5m · Zeiger auf UNSEREN JSON-Schnappschuss (`./rohdatenZeiger.ts`).
   *  EIGENE Prop und kein Feld von `angaben`: dort stehen die Angaben ÜBER den
   *  Erlass, hier der Weg zu unserem Artefakt davon — und die Trennung hält
   *  `uebersichtAngaben.ts` unter dem 420er-Deckel, den `leser-v3-fundament`
   *  setzt (Herleitung in `./rohdatenZeiger.ts`). Fehlt sie, bleibt die Box,
   *  was sie war (Hüllen-Sonden, Druck). */
  rohdaten?: RohdatenZeiger | null;
}) {
  // Ä97: `warnung` und `vorbehalt` werden hier BEWUSST nicht entnommen — beide
  // Aussagen gehören dem Erlass-Kopf (Herleitung unten an ihrer alten Stelle).
  const { ruhe, zeilen, links, hinweise } = angaben;
  return (
    // ── Ä5 (H2b) · WEISSRAUM, DANN LINIE — KEIN KASTEN ────────────────────────
    // Bis H2 war die Box ein gerahmter, getönter Kasten (`border border-line
    // bg-paper-sunken`) und damit die einzige Fläche der Leiste, die aussah wie
    // ein Bauteil. Design-Grundlage Kap. 8 Nr. 1 verbietet genau das: «Keine
    // Rahmen/Boxen um jedes Element — Trennung über Weissraum, dann Linie». Und
    // der Kasten trug einen DRITTEN Farbton unter den klebenden Sockel (Sheet
    // `paper-raised` · Sockel `paper` · Box `paper-sunken`) — gestapelte Töne,
    // die beim Scrollen als wandernder Streifen sichtbar wurden.
    // Unverändert gültig; Ä70 ändert daran nichts, es entfernt nur die ZWEITE
    // Linie, die im Inneren noch stand.
    <details data-v3-uebersicht className="group">
      <summary
        data-v3-uebersicht-zeile
        className="flex cursor-pointer list-none items-baseline gap-1.5 rounded-sm py-1 text-body-s leading-snug text-ink-600 transition-colors hover:text-brass-700 [&::-webkit-details-marker]:hidden">
        {/* Ä5 · das hängende «·» zwischen Etikett und Werten ist weg: die
            Zusammenfassung fügt ihre Teile SELBST mit «·», ein vierter Trenner
            derselben Zeichenform hing beim Umbruch allein am Zeilenende. Der
            Weissraum trennt zuverlässiger als ein Zeichen, das umbrechen kann. */}
        <span aria-hidden className="shrink-0 text-ink-400 transition-transform group-open:rotate-90">▸</span>
        <span className="min-w-0">
          <span className="font-medium text-ink-700">Übersicht</span>{' '}
          {/* Ä70 · Sans mit `tabular-nums` statt der Mono-Stimme (seit R6-B,
              5.9.2026, als `.lc-ziffern` geschrieben — gleiche Rolle). Die
              SR-Nummer bleibt der Fall, für den Mono reserviert ist (Kap. 2.1)
              — aber sie steht hier in EINER Zeile mit Zähl-Substantiven, und
              zwei Schriftstimmen in einer Zeile waren der sichtbare Teil des
              Befunds. Dieselbe Auflösungsrichtung wie S2/Ä-(b) am Kopf. */}
          <span className="lc-ziffern [overflow-wrap:anywhere]">{ruhe}</span>
        </span>
      </summary>

      {/* ── Warn-Zelle ────────────────────────────────────────────────────────
          Sie steht AUSSERHALB des Klapp-Inhalts und wird nie weggeklappt: eine
          Warnung, die man erst aufklappen muss, ist keine (Design-Grundlage
          Kap. 6 — Zeichen UND Wort, nie Farbe allein). Der Wortlaut ist der des
          Erlass-Kopfs (`nichtKonsolidiertSatz`, S3/F5) — bis hierher trug die
          Box einen ZWEITEN, eigenen Wortlaut für denselben Sachverhalt (§5).

          §15.2 — KEINE Höhen-Reservierung, und das ist eine Entscheidung, keine
          Lücke: die Box liegt im Aside, nicht im Lesekörper; die CLS-Sonde
          `e2e/leser-v3-kontext-cls` misst ausdrücklich die Lesespalte, und ein
          Nachwachsen hier verschiebt nur den Gliederungsbaum darunter. Eine
          Reserve wäre trotzdem sauberer — sie bräuchte aber die vier
          Fenster-Messwerte, die der Kopf mit `kopf-stand*` hat; ein einzelner
          geratener Wert wäre schlechter als keiner. Als Ä73 vermerkt, nicht
          stillschweigend weggelassen. */}
      {/* ── Ä81 (H4-Nachzug 18.8.2026) · NUR DER KOPF WARNT ────────────────────
          GEMESSEN 18.8.2026 (StPO, D 1440, Box zu UND aufgeklappt): der Satz
          «… noch nicht in den Text eingearbeitet — massgeblich ist die amtliche
          Fassung.» stand ZWEIMAL gleichzeitig sichtbar auf der Seite —
            1× `div[data-v3-uebersicht-warnung]` hier in der Seitenleiste,
            1× `p < div < header` im Erlass-Kopf.
          Ä28 hatte die Dopplung INNERHALB der Box abgeräumt und die Seiten-Summe
          dabei ausdrücklich auf zwei festgeschrieben. Das war der Zwischenstand,
          nicht das Ziel: die Box zieht ihre Grenze selbst anders (Herleitung in
          `./uebersichtAngaben`) —
            Kopf = WELCHER Erlass, WIE AKTUELL, WO die amtliche Fassung
            Box  = WOHER er kommt und WIE er gebaut ist
          — und eine offene Konsolidierung ist «wie aktuell», also Kopf-Sache. Ein
          zweiter Ruf an derselben Falz macht die Warnung nicht dringlicher,
          sondern beiläufiger (Design-Grundlage Kap. 1 Nr. 3).
          Der Leser verliert nichts: der Kopf warnt auf JEDER Breite und steht vor
          dem ersten Artikel, während die Box unter xl im Sheet liegt und erst
          geöffnet werden muss — die Warnung wäre dort die spätere von beiden.
          Das Feld `warnung` bleibt im reinen Modell samt seinen Sonden (es ist die
          Aussage über den Erlass, unabhängig davon, wer sie zeigt); nur diese
          Ausgabe entfällt.
          NICHT MITENTSCHIEDEN war der `vorbehalt` («nächste Fassung ab …») — er
          ist es jetzt (Ä97, s. u.). */}
      {/* ── Ä97 (Live-Ästhetik-Prüfung 18.8.2026) · JETZT GEMESSEN ─────────────
          Ä81 hat den Vorbehalt ausdrücklich offengelassen, weil zur Messung kein
          Erlass mit `naechsteFassungAb` zur Hand war. Am Live-Stand ist er da:
          das OR trägt @1440 gleichzeitig
            1× «⚠ nächste Fassung ab 01.10.2026» hier in der Seitenleiste,
            1× denselben Satz in der Stand-Zeile des Erlass-Kopfs
          (`parts/ErlassLeserKopf.tsx`, `stand`-Kette, `text-warn-700`).
          Damit gilt für ihn Wort für Wort die Ä81-Begründung: eine angekündigte
          Fassung ist eine Aussage darüber, WIE AKTUELL der Text ist — und das ist
          Kopf-Sache, nicht Steckbrief-Sache. Der Kopf warnt auf jeder Breite und
          steht vor dem ersten Artikel; die Box liegt unter xl im Sheet und muss
          erst geöffnet werden.
          Das Feld `vorbehalt` bleibt im reinen Modell samt seinen Sonden (es ist
          die Aussage über den Erlass, unabhängig davon, wer sie zeigt) — nur
          diese Ausgabe entfällt, genau wie bei `warnung`. Damit trägt die Box
          KEINE Warn-Zelle mehr; die Herleitung oben bleibt als Begründung dafür
          stehen, warum keine zurückkehren darf, ohne dass jemand den Kopf
          gegenprüft. */}

      {/* `data-v3-uebersicht-inhalt` statt einer Klassen-Kette als Testanker:
          die Reihenfolge «Warnung VOR den Kindern» ist eine Zusage über die
          Struktur und darf nicht an Utility-Klassen hängen, die eine
          Gestaltungsänderung mitnimmt (dieselbe Lehre wie der `data-fn-ref`-Fix
          in H2: ein Wächter darf ein Element nicht über sein Aussehen suchen). */}
      <div data-v3-uebersicht-inhalt className="lc-v3-steckbrief mt-1 pl-4 text-body-s leading-snug">
        {/* Die Label/Wert-Liste. `<dl>` und nicht `<table>`: es sind
            Begriff/Wert-Paare, keine Matrix — und ein Screenreader liest «Art →
            Bundesgesetz» statt Zellkoordinaten. Das Raster steht in index.css
            (`.lc-v3-steckbrief`), damit die Spaltenbreite EINMAL definiert ist
            und nicht an jeder Zeile klebt. */}
        {zeilen.length > 0 && (
          <dl data-v3-uebersicht-liste>
            {zeilen.map((z) => (
              <div key={z.id} data-v3-uebersicht-zeile-id={z.id}>
                <dt>{z.label}</dt>
                {/* Kein `truncate`: der Wert bricht um. Das war der schwerste
                    Ist-Befund (bis 284 px stiller Textverlust je Zeile). */}
                <dd className={z.ziffern ? 'lc-ziffern' : undefined}>{z.wert}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* Amtliche Ziele. Skizze 4e trennt Fakten und Aktionen — darum eine
            eigene Zeile unter der Liste, in derselben leisen Textlink-Form wie
            die Aktionen-Zeile des Erlass-Kopfs (`lc-chip`), nicht als Wert in
            der Wertspalte. */}
        {links.length > 0 && (
          <p data-v3-uebersicht-quellen className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs">
            {links.map((l) => (
              // ── Ä110-REST (Ästhetik-Nachzug 18.8.2026) · DER PFEIL STEHT
              //    HINTEN ────────────────────────────────────────────────────
              // Ä110 hat den NAMEN vereinheitlicht («Amtliche Fassung»), die
              // ZEICHENSTELLUNG aber nur im Erlass-Kopf gerichtet: dort steht
              // «Amtliche Fassung ↗», hier stand «↗ Amtliche Fassung» — zwei
              // Formen desselben Links, zwei Handbreit auseinander.
              // DIE REGEL, die beide Zeichen erklärt: «↗» sagt «führt weg» und
              // folgt darum dem Ziel wie ein Nachsatz; «⬇» sagt «holt her» und
              // geht dem Ziel voran, wie am Kopf-Chip «⬇ Amtliches PDF». Sie
              // hängt an der Bedeutung des Zeichens, nicht an einer Liste von
              // Links, und gilt darum auch für ein künftiges drittes Ziel.
              <a key={l.id} data-v3-uebersicht-link={l.id} href={l.href}
                target="_blank" rel="noopener noreferrer"
                className="text-brass-700">
                {l.zeichen === '↗'
                  ? <>{l.label} <span aria-hidden>↗</span></>
                  : <><span aria-hidden>{l.zeichen}</span> {l.label}</>}
              </a>
            ))}
          </p>
        )}

        {/* ── W2·5m · ROHDATEN (§7-Transparenz) ────────────────────────────
            EIGENE Zeile UNTER den amtlichen Zielen, nicht zwischen ihnen: die
            Zeile darüber führt zur massgeblichen Fassung, diese zu UNSERER
            Kopie davon. Stünden beide nebeneinander, wäre für einen Moment
            offen, welcher Link das Gesetz ist — genau die Verwechslung, die §7
            und §8 hier verbieten. Die Herleitung im Ganzen (samt der Begründung,
            warum der Fassungs-Token NICHT danebensteht) in
            `./rohdatenZeiger.ts`.
            «⬇» geht dem Ziel voran: das Zeichen sagt «holt her», die Regel dafür
            steht bei den Links darüber (Ä110-Rest). Kein `target="_blank"` —
            die Datei liegt auf DIESER Seite, und ein neuer Reiter wäre die Geste
            für «verlässt uns». */}
        {rohdaten && (
          <p data-v3-uebersicht-rohdaten className="mt-1 text-xs leading-snug text-ink-500">
            <a href={rohdaten.href} className="text-brass-700" download>
              <span aria-hidden>⬇</span> Rohdaten (JSON)
            </a>
            {/* Der Stand SAGT, welche Fassung in der Datei liegt — ohne ihn wäre
                der Download ein Artefakt ohne Datum (§7 Bst. a). */}
            {rohdaten.stand && <> — <span className="lc-ziffern">{`Fassung ${rohdaten.stand}`}</span></>}
          </p>
        )}

        {/* §8-Block: was die Anzeige über ihre EIGENEN Grenzen weiss. Bis Ä72
            lag er hinter einer zweiten Klappe «Mehr zu diesem Erlass»; jetzt
            steht er da, sobald die Box offen ist. Leer = nichts zu vermelden,
            dann entfällt der Block — «keine Einschränkungen» wäre eine Aussage,
            die wir nicht belegen können. */}
        {hinweise.length > 0 && (
          <ul data-v3-uebersicht-hinweise className="mt-2 space-y-1 pt-1 text-xs leading-snug text-ink-500">
            {hinweise.map((h) => <li key={h}>{h}</li>)}
          </ul>
        )}
      </div>
    </details>
  );
}
