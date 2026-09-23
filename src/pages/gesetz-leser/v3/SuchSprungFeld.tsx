import { useRef, type RefObject } from 'react';
import { suchFeldName, suchPlatzhalter } from './erlassAnsicht';

// ─── EIN Feld für Suchen UND Springen (FAHRPLAN-LESER-V3 Kap. 4b, Pos. 4) ────
//
// Der Ist-Leser hat ZWEI Eingaben für dieselbe Absicht «bring mich zu einer
// Stelle»: das In-Gesetz-Suchfeld im Kopf und den Quickjump «Art. N» im
// Gliederungs-Sheet (K2). V3 hat eines. Die Weiche ist der EINGABEWERT, nicht
// ein Umschalter:
//
//   «429» / «Art. 429» / «art429»  ⇒ auflösbar ⇒ Enter SPRINGT zum Artikel
//   alles andere                   ⇒ die bestehende In-Gesetz-Suche läuft
//
// Aufgelöst wird mit `loeseArtikelEingabe` (suchTreffer.ts) — derselben reinen
// Funktion, die der Ist-Quickjump benutzt (§5, keine zweite Erkennungsregel).
// Der Sprung selbst geht über `springeZuArtikel` des Rahmens und erbt damit den
// Sticky-Offset (`.nt-anker` → `--nt-stick`), den der Kopf setzt (Risiko R1).
//
// TASTATUR (Kap. 4h): `Esc` leert das Feld und schliesst die Trefferliste,
// SPRINGT ABER NICHT — die Scrollposition bleibt exakt stehen (Pos. 14,
// «recover from mistakes»). Darum ruft der Esc-Zweig ausdrücklich nichts als
// `setSuche('')`: jeder Sprung-Aufruf, auch ein «zurück an den Anfang», wäre
// eine Bewegung, die niemand angefordert hat. `stopPropagation` hält den
// Tastendruck zudem beim Feld — ein Esc, das die Trefferliste leert, soll nicht
// zusätzlich ein Overlay schliessen. AUSNAHME seit A2 (H2b-Nachzug): steht das
// Feld IN einem modalen Blatt, gehört Esc dem Dialog (`escLeert={false}`).
//
// `⌘K`/`Ctrl+K` und `/` liegen NICHT hier, sondern im Rahmen
// (`./suchKuerzel`): das Feld ist bei zugeklappter Spalte gar nicht im DOM, ein
// Kürzel darin wäre dann still wirkungslos (Bug-Check B1, 16.8.2026).

export function SuchSprungFeld({
  wert, setzeWert, loeseArtikel, onSprung, feldRef, onVor, onZurueck, hatTreffer = false,
  onBestaetigt,
  // Ä126: die Vorgaben sind KEINE dritten Literale, sondern dieselbe Quelle
  // ohne Erlass-Kürzel (§5) — sonst trüge ein Aufrufer ohne Erlass die Wörter
  // der Ist-Hülle («Im Gesetz suchen») mitten in die V3-Fläche.
  platzhalter = suchPlatzhalter(null), ariaName = suchFeldName(), escLeert = true,
}: {
  wert: string;
  setzeWert: (v: string) => void;
  /** Ä20 (H2b) — Platzhalter, aus dem Erlass abgeleitet (`erlassAnsicht.suchPlatzhalter`).
   *  Vorgabe ohne Beispiel: ein §-Erlass soll nie «Art. 429» angeboten bekommen. */
  platzhalter?: string;
  /** Ä112 (18.8.2026) — der zugängliche Name. Er trägt DIESELBE Auskunft wie
   *  der Platzhalter: WELCHER Erlass durchsucht wird. Ein Screenreader-Nutzer
   *  hörte bis hierher an beiden Feldern der Seite «suchen» und hatte keinen
   *  Anhalt, welches der App und welches dem Erlass gehört (§8) — der
   *  Platzhalter allein löst das nicht, er ist für den Namen nur der Rückfall.
   *  Vorgabe = der Wortlaut bis 18.8., damit ein Aufrufer ohne Erlass (Sonden,
   *  Ist-Hülle) unverändert bleibt. */
  ariaName?: string;
  /** «Art. 429» → Token, sonst `null`. Fehlt sie (Snapshot noch nicht da),
   *  bleibt das Feld eine reine Suche — nie ein totes Sprung-Versprechen (§8). */
  loeseArtikel?: (eingabe: string) => string | null;
  onSprung: (token: string) => void;
  /** Damit der Rahmen den Fokus setzen kann (Fläche öffnet → Feld fokussieren). */
  feldRef?: RefObject<HTMLInputElement | null>;
  /** H2 · ↓ bzw. ↑ im Feld: nächste/vorherige Fundstelle (Kap. 4h). */
  onVor?: () => void;
  onZurueck?: () => void;
  /** Gibt es überhaupt Fundstellen? Ohne sie tun ↑↓ und Enter nichts — und das
   *  Feld verspricht sie dann auch nicht (§8). */
  hatTreffer?: boolean;
  /** ── D38 (7.9.2026) · ENTER IST DIE BESTÄTIGUNG, NICHT NUR EIN SCHRITT ────
   *  Seit D38 liegt die Trefferliste über der Lesespalte, solange im Feld etwas
   *  steht (`./LeserTrefferSpalte`). Damit gibt es eine Frage, die es vorher
   *  nicht gab: WOMIT verlässt man die Liste und kommt beim Text an?
   *  ↑↓ können es nicht sein — sie durchmustern die Treffer, und wer die Liste
   *  bei jedem Schritt verlöre, könnte sie gar nicht durchmustern. Enter kann es:
   *  die Taste sagt in jeder Oberfläche «das da, nimm es», und sie tut hier
   *  ohnehin schon das Zielführende (Artikel-Sprung bzw. nächste Fundstelle).
   *  `onBestaetigt` läuft NACH beiden Enter-Zweigen und in beiden, denn beide
   *  sind eine Wahl: «Art. 429» meint diesen Artikel, ↵ ohne Token die nächste
   *  Fundstelle. Ungesetzt (Sonden, andere Aufrufer) ändert sich nichts. */
  onBestaetigt?: () => void;
  /** ── A2 (H2b-Nachzug) · WEM GEHÖRT `Esc`? ─────────────────────────────────
   *  Vorgabe `true` = das Ist-Verhalten von Pos. 14: Esc leert das Feld, springt
   *  nicht, und hält den Tastendruck bei sich (`stopPropagation`).
   *
   *  `false` setzt der Aufrufer dort, wo das Feld IN einem modalen Blatt steht.
   *  Dann gewinnt der Dialog: Esc schliesst ihn (ARIA-Dialog-Pattern, WCAG 2.1.2)
   *  statt still den Suchbegriff zu löschen. GEMESSEN 17.8.2026 @390 mit offenem
   *  Treffer-Blatt: Esc leerte das Feld und liess das Blatt offen stehen — der
   *  Leser drückte die Taste, die jeden Dialog schliesst, und verlor stattdessen
   *  seine Eingabe. Geleert wird im Blatt über das ✕ am Feld, das dort sichtbar
   *  neben der Eingabe steht. */
  escLeert?: boolean;
}) {
  const eigenerRef = useRef<HTMLInputElement>(null);
  const ref = feldRef ?? eigenerRef;

  const token = loeseArtikel && wert.trim() !== '' ? loeseArtikel(wert) : null;

  return (
    <div data-v3-suchsprung className="space-y-1">
      <div className="relative">
        {/* W2·29 S4 (Werkbank): Lupe im Unterstrich-Feld, reine Zier. */}
        <svg aria-hidden focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}
          strokeLinecap="round" className="pointer-events-none absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-600">
          <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M16.5 16.5 21 21" />
        </svg>
        <input
          ref={ref}
          // ── Ä16 (H2b) · EINE LÖSCHUNG, NICHT ZWEI ───────────────────────────
          // Gemessen 17.8.2026: das Feld war `type="search"`, Chromium malt dazu
          // seinen eigenen `::-webkit-search-cancel-button`, und daneben stand
          // `data-v3-such-leeren` — zwei ✕ mit derselben Wirkung, eines davon
          // ohne zugänglichen Namen und ohne 24-px-Trefferfläche.
          // GEWÄHLT: `type="text"` statt einer `appearance:none`-Regel auf dem
          // UA-Pseudoelement. Der Grund ist nicht Geschmack — eine Regel gegen
          // ein herstellereigenes Pseudoelement bewacht niemand, sie fällt
          // stillschweigend aus, sobald ein Browser sie umbenennt, und sie müsste
          // je Engine wiederholt werden. `type="text"` entfernt die Ursache statt
          // ihre Wirkung zu übermalen. Was `type="search"` beitrug, wird
          // ausdrücklich ersetzt: `role="searchbox"` trägt die Semantik,
          // `inputMode`/`enterKeyHint` die mobile Tastatur — das Feldverhalten
          // (Esc leert, Enter springt/rückt vor) liegt seit je im `onKeyDown`
          // dieser Datei und nie beim UA.
          type="text"
          role="searchbox"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={wert}
          onChange={(e) => setzeWert(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && escLeert) {
              // Kein Sprung, kein Scroll — nur leeren (Pos. 14). Und nicht
              // weiterreichen: sonst läge «Feld leeren» und «umgebendes Overlay
              // schliessen» auf demselben Tastendruck.
              // A2: steht das Feld in einem modalen Blatt, ist `escLeert` false —
              // dann läuft dieser Zweig gar nicht und Esc erreicht den Dialog.
              e.preventDefault();
              e.stopPropagation();
              setzeWert('');
              return;
            }
            // ↑↓ wechseln die Fundstelle (Kap. 4h). Sie liegen auf dem FELD und
            // nicht auf der Liste, weil die Hand beim Tippen dort ist — genau
            // dieselbe Erwartung, die jede Browser-Suchleiste bedient.
            // `preventDefault` ist Pflicht: sonst setzt der Browser zusätzlich
            // die Schreibmarke an den Feldanfang bzw. das Feldende.
            if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && hatTreffer) {
              e.preventDefault();
              if (e.key === 'ArrowDown') onVor?.();
              else onZurueck?.();
              return;
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              // Vorrang hat der ARTIKEL-Sprung: wer «Art. 429» tippt, meint
              // genau diesen Artikel und keine Fundstelle darin. Sonst rückt
              // Enter auf die nächste Fundstelle vor — die Taste tut damit
              // immer das, was das Feld gerade anbietet, und nie nichts.
              // D38: der Sprung ist gewählt ⇒ die Trefferliste gibt die
              // Lesefläche frei. NUR DANN — «Art. 99999» ohne auflösbares Ziel
              // und ohne Fundstelle bestätigt nichts, und die Liste trägt dann
              // die ehrliche Absage «Kein Artikel gefunden für …» (§8). Sie
              // wegzuschalten hiesse, die Antwort auf die Eingabe zu verbergen;
              // gemessen am Zwischenstand (`leser-r1-r2`, Quickjump @390: die
              // Absage war nach ↵ nicht mehr auffindbar).
              if (token) { onSprung(token); onBestaetigt?.(); }
              else if (hatTreffer) { onVor?.(); onBestaetigt?.(); }
            }
          }}
          placeholder={platzhalter}
          aria-label={ariaName}
          aria-describedby={token ? 'v3-sprung-hinweis' : undefined}
          // `pr-16` bzw. `pr-8`: Platz für ✕ und ⌘K, damit lange Eingaben nicht
          // unter den Bedienzeichen verschwinden.
          //
          // Ä14 (H2b): `.lc-input` allein malte im Fokus drei Kanten (Rahmen brass-600
          // + Doppelring `--ring`); `.lc-v3-feld` (index.css) setzt EINEN Ring (FL-4).
          className={`lc-input lc-v3-feld h-8 w-full min-w-0 py-0 pl-6 text-body-s ${wert !== '' ? 'pr-16 sm:pr-20' : 'pr-8 sm:pr-10'}`}
        />
        {/* R6-C (5.9.2026): die Glyphe kam aus `text-body-s leading-none` und
            stand damit als EINZIGE der drei «Suche leeren»-Flächen in 14 px —
            GEMESSEN am Preview: Tinte 10.67 px hier gegen 12.20 px in
            `start/UniversalSuche` und `pages/Suche` (gleiche Handlung, gleicher
            `aria-label`, 2:1 für 16 px). Jetzt `.lc-griff-glyph`, dieselbe
            Gestalt wie am `ui/SchliessKnopf`. Die BOX bleibt, wo sie ist
            (24×24; rund bis W2·29 S4, seither eckig) — sie gehört der Zeile, hier einem `h-8`-Feld mit
            ⌘K-Nachbarn; das ist dieselbe Trennung, die der Schliess-Baustein
            deklariert (Glyphe geteilt, Box der Umgebung). */}
        {/* ✕ — sichtbar und mit Namen. Es ist seit Ä16 (H2b) das EINZIGE: das
            native Kreuz von `type="search"` erschien je nach Browser gar nicht,
            trug keinen zugänglichen Namen und war kein 44-px-Ziel — darum trägt
            das Feld jetzt `type="text"` und dieser Knopf die Löschung allein.
            WICHTIG (Pos. 14): der Knopf leert NUR. Kein Sprung, kein Scroll,
            kein Fokusverlust — der Fokus bleibt im Feld, damit die nächste
            Eingabe ohne Umweg beginnt. */}
        {wert !== '' && (
          <button type="button" data-v3-such-leeren
            onClick={() => { setzeWert(''); ref.current?.focus(); }}
            aria-label="Suche leeren"
            title="Suche leeren (Esc)"
            className="absolute right-6 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center text-ink-600 transition-colors lc-hover-flaeche hover:text-ink-900 sm:right-9">
            <span aria-hidden className="lc-griff-glyph">✕</span>
          </button>
        )}
        {/* Das Kürzel steht sichtbar am Feld — ein Kürzel, das man kennen muss,
            ist keines (Design-Grundlage Kap. 8: sichtbar im Ruhezustand). Auf
            Touch-Breiten ausgeblendet, dort gibt es keine Tastatur.
            `ink-500`, NICHT `ink-400`: `ink-400` ist ein Deko-Token (~3.1:1 auf
            der Feldfläche) und trägt hier sichtbaren Text — axe meldete
            `color-contrast`, serious. Dieselbe Klasse wie W3.6 (25.6.2026) und
            der Menü-Befund vom 26.7.2026; `aria-hidden` hilft nicht, das Zeichen
            ist ja zu sehen. */}
        <kbd aria-hidden className="pointer-events-none absolute right-1 top-1/2 hidden -translate-y-1/2 select-none border border-line px-1 text-micro leading-4 text-ink-600 sm:block">⌘K</kbd>
      </div>
      {token && (
        <button type="button" id="v3-sprung-hinweis" data-v3-sprung-hinweis
          onClick={() => onSprung(token)}
          className="flex w-full items-center gap-1.5 border-b border-line px-2 py-1 text-left text-body-s text-brass-700 transition-colors lc-hover-flaeche">
          <span aria-hidden>→</span>
          <span>Zu <span className="num font-medium">{wert.trim()}</span> springen</span>
          <kbd aria-hidden className="ml-auto hidden text-micro text-ink-600 sm:block">↵</kbd>
        </button>
      )}
    </div>
  );
}
