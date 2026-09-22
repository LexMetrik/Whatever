// ─── Farbwelt-Regelkorpus: WAS geprüft wird (Assertion-Tabellen) ────────────
//
// Aus `scripts/check-farbwelt.ts` herausgelöst (31.8.2026, W2·20 —
// Steuerungs-Flächendeckel `scripts/check-*.ts`). Jeder Eintrag trägt seine
// Begründung und seine gemessene Herkunft unmittelbar bei sich; die
// Kommentare sind darum MIT ihrem Eintrag gewandert, nicht um Bytes zu
// verschieben, sondern weil sie ohne ihn nichts erklären.
//
//   · HIER: Pflichtpaare (WCAG hell+dunkel), Referenzwerte (§4b-B),
//     Fixpunkte, bekannte Risse mit Baseline, tailwind.config-Sollbestand,
//     Familien/Rampen und die APCA-Proben — reine Daten, keine Ausführung.
//   · `farbwelt-messung.ts`: WIE eine Farbe aufgelöst und gemessen wird.
//   · `check-farbwelt.ts`: das TOR — Ausführung, Fail/Warn-Politik, Bericht.
//
// Spezifikation (D-0), Quellen und Fail-/Warn-Politik stehen unverändert im
// Kopf von `scripts/check-farbwelt.ts`.

import tw from '../tailwind.config.js';
import type { Mode } from './farbwelt-messung';

// (a) WCAG-PFLICHTPAARE — heute erfüllt, FAIL bei Unterschreitung.
type Paar = { fg: string; bg: string; min: number; art: 'Text' | 'Nicht-Text'; quelle: string };
const TEXT = (fg: string, bg: string, quelle: string): Paar => ({ fg, bg, min: 4.5, art: 'Text', quelle });
const NICHT = (fg: string, bg: string, quelle: string): Paar => ({ fg, bg, min: 3.0, art: 'Nicht-Text', quelle });
export const PFLICHT: Paar[] = [
  // ── Kantonskarte (Bug-Check #568, 29.8.2026, §17-Wurzelfix): die Erfassungs-
  // grad-Füllungen tragen ihre Bedienbarkeit über die Kanten-Trennung — dunkel
  // liegt «vollständig» nur 0.05 über der 3:1-Schwelle; eine spätere
  // --ink-700-/Basis-Korrektur risse F2 sonst STUMM. Kante = --karte-kante.
  NICHT('karte-kante', 'karte-voll', 'Kantonskarte: Kanten-Trennung auf «vollständig»'),
  NICHT('karte-kante', 'karte-auswahl', 'Kantonskarte: Kanten-Trennung auf «Auswahl»'),
  NICHT('karte-kante', 'karte-duenn', 'Kantonskarte: Kanten-Trennung auf «dünn»'),
  NICHT('karte-kante', 'karte-leer', 'Kantonskarte: Kanten-Trennung auf «keine Erlasse»'),
  // ── QS-UI 8a, Verschärfung Stufe 1a: Fliesstext-Basis ───────────────────────
  // Befund des Audits (4.8.2026): ink-900 — der TRAGENDE Fliesstext-Ton der
  // ganzen App — war in keinem einzigen Pflichtpaar vertreten. Geprüft waren
  // nur die Sekundär-/Tertiär-Tiers (ink-600/500). Eine Verschiebung von
  // ink-900 wäre also stumm durch das Tor gegangen. Gemessen (culori, alle weit
  // über 4.5:1): paper 16.68·14.80 · surface 16.99·13.94 · well 15.81·15.52 ·
  // paper-raised 17.25·13.50 (hell·dunkel).
  TEXT('ink-900', 'paper', 'QS-UI 8a: Fliesstext auf Papier — Basis-Lesefläche'),
  TEXT('ink-900', 'surface', 'QS-UI 8a: Fliesstext auf Karte'),
  TEXT('ink-900', 'well', 'QS-UI 8a: Fliesstext auf Eingabefeld (.lc-input)'),
  TEXT('ink-900', 'paper-raised', 'QS-UI 8a: Fliesstext auf erhabener Fläche (Popover/Dialog)'),
  // ── QS-UI 8a, Verschärfung Stufe 1b: die Fläche --paper-raised ─────────────
  // Zweiter Audit-Befund: die Pflichtpaare kannten nur paper/surface/well. Die
  // vierte Flächen-Rolle --paper-raised (Popover, Dialog, Drawer, Menü) war
  // ungeprüft, obwohl `bg-paper-raised` an 283 Stellen in 13+ Komponenten steht
  // (u. a. Shell-Drawer, Reiter-/Verlauf-Übersicht, LeserAnsichtMenu,
  // GliederungSheet). Das ist die Fläche, auf der die Navigation stattfindet.
  // Gemessen: ink-600 7.61·7.53 · ink-500 5.27·5.04 · brass-700 5.60·9.11.
  TEXT('ink-600', 'paper-raised', 'QS-UI 8a: Sekundärtext im Popover/Dialog'),
  TEXT('ink-500', 'paper-raised', 'QS-UI 8a: Tertiärtext im Popover/Dialog'),
  TEXT('brass-700', 'paper-raised', 'QS-UI 8a: Link/Akzent im Popover/Dialog'),
  NICHT('focus', 'paper-raised', 'QS-UI 8a: --focus-Ring auf erhabener Fläche (5.60·5.98)'),
  // NICHT aufgenommen — bewusst, mit Grund (§8-Ehrlichkeit statt stiller Lücke):
  //   · placeholder/paper-raised dunkel = 4.532 gegen die 4.5-Schwelle. Derselbe
  //     Messer-Rand, den §11 für warn-line beschreibt (0.032 Abstand). Ein
  //     Platzhalter steht ausserdem in `.lc-input` (= --well), nicht auf
  //     paper-raised; das Paar wäre ein konstruierter Grund. → offen, in der
  //     Restliste des PR.
  //   · brass-line/paper-raised hell = 3.084, brass-line/paper hell = 2.982.
  //     Der zweite Wert läge unter der Schwelle — für BEIDE fand das Audit
  //     aber keinen Call-Site: `.lc-notice` und `.lc-akzent-brass` zeichnen
  //     ihre brass-Kante auf `--surface` (dort 3.28, seit je Pflichtpaar). Ein
  //     Riss-Eintrag ohne belegten Konsumenten wäre ein erfundener Befund (§7),
  //     darum bleibt es ein Messwert in der Audit-Liste, kein Tor-Eintrag.
  // ── QS-UI Teilpass (e), 5.9.2026: TEXT auf den TÖNUNGSFLÄCHEN ──────────────
  // Die Baseline kannte für die getönten Flächen nur ihre KANTEN (NICHT(...))
  // und je EINEN Textton (brass-800/brass-100, *-700/*-bg). Der Fliesstext und
  // der Sekundärtext, die real darauf stehen, waren ungeprüft — 76 Call-Sites
  // `bg-brass-100`, dazu jede `lc-notice`.
  // ANLASS ist kein Verdacht, sondern ein Fund: das neue Flächen-axe-Tor
  // meldete auf `/rechner/schkg-fristen` einen Feld-Hinweis in ink-500 im
  // brass-Kasten mit 4.36:1 (AA verlangt 4.5) — an dieser Baseline vorbei, weil
  // ink-500 nur gegen paper/surface/well/raised geprüft war. Nachgemessen am
  // Token (culori, hell·dunkel): ink-500/brass-100 = 4.366·4.543 — im HELLEN
  // Modus unter der Schwelle. Der Call-Site ist in derselben Einheit auf
  // ink-600 gehoben; der Tier ink-500 gehört damit NICHT auf brass-100, und
  // genau das hält die folgende Zeile fest, indem sie ink-600 als geprüften
  // Boden festnagelt (ink-500 bleibt bewusst aussen vor — ein Pflichtpaar
  // wäre heute rot, ein Riss-Eintrag eine Warnung ohne Konsumenten).
  // Gemessen, alle mit Reserve (hell·dunkel):
  //   ink-900/brass-100 14.283·12.173 · ink-600/brass-100 6.303·6.794
  //   brass-700/brass-100 4.634·8.217
  //   ink-900/{warn,danger,sage,slate}-bg 15.040·12.051 / 14.339·13.122 /
  //     14.688·12.584 / 14.531·12.822
  //   ink-600/{warn,danger,sage,slate}-bg 6.637·6.725 / 6.328·7.323 /
  //     6.482·7.023 / 6.412·7.156
  TEXT('ink-900', 'brass-100', 'QS-UI (e): Fliesstext im Hervorhebungskasten (.lc-highlight, bg-brass-100 ×76)'),
  TEXT('ink-600', 'brass-100', 'QS-UI (e): Sekundär-/Hinweistext im brass-Kasten — Boden statt ink-500 (4.366 hell)'),
  TEXT('brass-700', 'brass-100', 'QS-UI (e): Link/Akzent im brass-Kasten'),
  TEXT('ink-900', 'warn-bg', 'QS-UI (e): Fliesstext in lc-notice-warn'),
  TEXT('ink-900', 'danger-bg', 'QS-UI (e): Fliesstext in lc-notice-danger'),
  TEXT('ink-900', 'sage-bg', 'QS-UI (e): Fliesstext auf sage-Tönung'),
  TEXT('ink-900', 'slate-bg', 'QS-UI (e): Fliesstext auf slate-Tönung'),
  TEXT('ink-600', 'warn-bg', 'QS-UI (e): Sekundärtext in lc-notice-warn'),
  TEXT('ink-600', 'danger-bg', 'QS-UI (e): Sekundärtext in lc-notice-danger'),
  TEXT('ink-600', 'sage-bg', 'QS-UI (e): Sekundärtext auf sage-Tönung'),
  TEXT('ink-600', 'slate-bg', 'QS-UI (e): Sekundärtext auf slate-Tönung'),
  // Sekundär-/Meta-/Feinschrift-Basis (lc-overline/lc-fineprint/lc-notice = ink-600)
  TEXT('ink-600', 'well', 'lc-overline/lc-fineprint (index.css:350/374)'),
  TEXT('ink-600', 'paper', 'ink-600 Sekundärtext'),
  TEXT('ink-600', 'surface', 'ink-600 auf Karte'),
  // Tertiärtext ink-500 — D-4 (13.7.): well-Riss geheilt (4.48→4.62), jetzt Pflicht.
  TEXT('ink-500', 'paper', 'ink-500 Tertiärtext (D-4: 5.00)'),
  TEXT('ink-500', 'surface', 'ink-500 auf Karte (D-4: 5.17)'),
  TEXT('ink-500', 'well', 'ink-500 auf Eingabefeld (D-4 geheilt: 4.62, vorher 4.48)'),
  TEXT('placeholder', 'well', 'lc-input::placeholder (index.css:37/164)'),
  // Messing-Text/Links
  TEXT('brass-700', 'paper', 'a/--accent-text (index.css:90/214)'),
  TEXT('brass-700', 'surface', 'brass-700 auf Karte'),
  TEXT('brass-700', 'well', 'brass-700 auf Eingabefeld'),
  TEXT('brass-800', 'brass-100', 'lc-highlight .lc-overline (index.css:649/65)'),
  // Status-Badge-Text auf Tönungsfläche
  TEXT('sage-700', 'sage-bg', 'lc-badge-ok (index.css:525)'),
  TEXT('slate-700', 'slate-bg', 'lc-badge-soft (index.css:537)'),
  TEXT('warn-700', 'warn-bg', 'lc-badge-warn (index.css:528)'),
  TEXT('danger-700', 'danger-bg', 'lc-badge-danger (index.css:536)'),
  // Nicht-Text: Fokus-Ring (--focus) auf allen drei Flächen (WCAG 1.4.11)
  NICHT('focus', 'paper', '--focus Ring (index.css:91-95/187-189)'),
  NICHT('focus', 'surface', '--focus Ring auf Karte'),
  NICHT('focus', 'well', '--focus Ring auf Eingabefeld'),
  // Nicht-Text: Akzent-/Hinweis-Linien auf Karte.
  // Label-Wahrheit nachgezogen 3.8.2026: #418 entfernte .lc-akzent-warn und
  // .lc-akzent-danger aus index.css — die Labels benannten damit zwei Klassen,
  // die es nicht mehr gibt (und drei überholte Zeilennummern). Die GEPRÜFTEN
  // Token-Paare bleiben unverändert; nur der Text wird ehrlich.
  NICHT('brass-line', 'surface', 'lc-akzent-brass (index.css:583) / lc-notice-Kante (index.css:885)'),
  NICHT('warn-line', 'surface', 'warn-line auf Karte — konservativer Boden, echter Konsument ist lc-notice-warn (index.css:886)'),
  NICHT('danger-line', 'surface', 'border-t-danger-line auf lc-tile/lc-card (KuendigungSperrForm:228, VorlageKuendigungArbeitgeber:92, StrafZustaendigkeitTeil:479)'),
  // ── QS-UI 8a, Verschärfung Stufe 1c: Status-Kanten auf IHRER Tönungsfläche ──
  // ERLEDIGT der bis 3.8.2026 hier stehende OFFENE PUNKT. Er lautete: die
  // lc-notice-/Badge-Kanten rendern NICHT auf «surface», sondern auf der
  // getönten Fläche -bg (der strengere Grund) — aber warn-line/warn-bg lag mit
  // 3.008 nur 0.008 über der Schwelle, und ein Tor auf dieser Messerschneide
  // wäre bei jeder Token-Rundung gekippt. Genau deshalb war es keine Frage der
  // Tor-Politik, sondern des Tokens: QS-UI-WARNLINE (FAHRPLAN-UI-QUALITAET §11)
  // hat --warn-line um OKLCH L −0.020 abgedunkelt. Damit tragen alle vier
  // Status-Kanten Reserve und werden hart (culori, hell·dunkel):
  //   warn-line/warn-bg   3.264 · 3.948   (vorher 3.008 · 4.283)
  //   danger-line/danger-bg 5.538 · 6.685
  //   sage-line/sage-bg     4.022 · 8.441
  //   slate-line/slate-bg   4.625 · 7.768
  NICHT('warn-line', 'warn-bg', 'QS-UI 8a/§11: lc-notice-warn-Kante auf ihrer Tönungsfläche (index.css:974)'),
  NICHT('danger-line', 'danger-bg', 'QS-UI 8a: lc-notice-danger-Kante auf ihrer Tönungsfläche (index.css:975)'),
  NICHT('sage-line', 'sage-bg', 'QS-UI 8a: sage-Kante/Balken auf sage-Tönung'),
  NICHT('slate-line', 'slate-bg', 'QS-UI 8a: slate-Kante/Balken auf slate-Tönung'),
  // D-1.3: sage/slate-Linien-Aliasse (dunkel auf -700 gehoben) — Nicht-Text-
  // Kanten/Balken greifen den Alias, nie -500 direkt.
  NICHT('sage-line', 'surface', 'D-1.3 border-sage-line (Patientenverfügung u. a.)'),
  NICHT('slate-line', 'surface', 'D-1.3 --slate-line-Alias'),
  NICHT('danger-line', 'paper', 'D-1.3 border-t-danger-line/SperrtageZaehler-Balken'),
  // ── W2·24 · L5 (6.9.2026) · DIE BADGE-UMRISSE SIND NEUE NICHT-TEXT-KANTEN ─
  // `.lc-badge` traegt seit L5 statt einer Fuellung eine 1-px-Kante in der
  // Farbe seiner Rolle (`--badge-linie`). Badges stehen im Katalog auf dem
  // PAPIER, in Karten auf `--surface`, auf der schwebenden Ebene und in
  // Chip-Zeilen ueber `--well` — vier Gruende, alle vier Flaechen zu binden.
  // Bis hier war je Ton NUR das Paar gegen `--surface` gefuehrt; eine Kante,
  // die neu auf drei weiteren Flaechen steht, waere sonst ungemessen (§6.7).
  NICHT('sage-line', 'paper', 'L5 lc-badge-ok Umriss auf Papier (Katalog)'),
  NICHT('sage-line', 'well', 'L5 lc-badge-ok Umriss in der Chip-/Feldzeile'),
  NICHT('sage-line', 'paper-raised', 'L5 lc-badge-ok Umriss auf schwebender Ebene'),
  NICHT('slate-line', 'paper', 'L5 lc-badge-geplant/-soft Umriss auf Papier'),
  NICHT('slate-line', 'well', 'L5 lc-badge-geplant/-soft Umriss in der Chip-/Feldzeile'),
  NICHT('slate-line', 'paper-raised', 'L5 lc-badge-geplant/-soft auf schwebender Ebene'),
  NICHT('warn-line', 'paper', 'L5 lc-badge-entwurf Umriss auf Papier (Katalog)'),
  NICHT('warn-line', 'paper-raised', 'L5 lc-badge-entwurf auf schwebender Ebene'),
  NICHT('brass-line', 'paper', 'L5 lc-badge-massgeblich Umriss auf Papier'),
  NICHT('brass-line', 'paper-raised', 'L5 lc-badge-massgeblich auf schwebender Ebene'),
  // ── W2·24-DESIGN-IDENTITAET R1 (6.9.2026) · DIE VIER REGISTERFARBEN ────────
  // Sie sind ab jetzt die EINZIGE Farbe im Bild (Fahrplan §5) und tragen
  // Register-Zugehörigkeit als Strich, Reiter-Unterkante, Randmarke und — ab
  // R2/R3 — als Kopfzeile/Label-Text. Genau deshalb stehen sie hier als TEXT-
  // Pflichtpaare (4.5:1) und nicht bloss als Nicht-Text-Kanten: eine spätere
  // Verschiebung eines der vier Töne muss das Tor sehen, nicht das Auge.
  // GELTUNGSBEREICH bewusst dreiflächig (paper · surface · paper-raised) — das
  // sind die Flächen, auf denen ein Register-Ton je steht. NICHT dabei: --well
  // (Eingabefeld). Grund ist kein Wunsch, sondern eine Messung: reg-w/well hell
  // = 4.43:1, also unter AA — Registerfarbe gehört nicht in ein Eingabefeld, und
  // ein Pflichtpaar ohne Konsumenten wäre ein erfundener Befund (§7/§8).
  // Gemessen 6.9.2026 (culori, hell·dunkel), Protokoll:
  // abnahme/design-identitaet/KONTRAST-R1.md.
  TEXT('reg-g', 'paper', 'W2·24-R1: Register «Gesetze» auf Papier'),
  TEXT('reg-g', 'surface', 'W2·24-R1: Register «Gesetze» auf Karte'),
  TEXT('reg-g', 'paper-raised', 'W2·24-R1: Register «Gesetze» im Popover/Dialog'),
  TEXT('reg-r', 'paper', 'W2·24-R1: Register «Rechtsprechung» auf Papier'),
  TEXT('reg-r', 'surface', 'W2·24-R1: Register «Rechtsprechung» auf Karte'),
  TEXT('reg-r', 'paper-raised', 'W2·24-R1: Register «Rechtsprechung» im Popover/Dialog'),
  TEXT('reg-m', 'paper', 'W2·24-R1: Register «Materialien» auf Papier'),
  TEXT('reg-m', 'surface', 'W2·24-R1: Register «Materialien» auf Karte'),
  TEXT('reg-m', 'paper-raised', 'W2·24-R1: Register «Materialien» im Popover/Dialog'),
  TEXT('reg-w', 'paper', 'W2·24-R1: Register «Werkzeuge» auf Papier — der knappste der vier (4.88 hell)'),
  TEXT('reg-w', 'surface', 'W2·24-R1: Register «Werkzeuge» auf Karte'),
  TEXT('reg-w', 'paper-raised', 'W2·24-R1: Register «Werkzeuge» im Popover/Dialog'),
  // ── «FARBE ALS FLÄCHE» (W2·29-WERKBANK-TOKENS, Entscheid David 22.9.2026,
  // FAHRPLAN-WERKBANK-UMBAU §4 Ziff. 3). Reglement F0.2 sagte bis dahin «nie
  // als Fläche»; die vier `reg-*-flaeche`-Token lösen das ab. Der Entscheid
  // ändert die REGEL, nicht die SCHWELLEN: eine getönte Fläche ist nur dann
  // eine, wenn der Text darauf weiter AA erreicht. Darum steht jede der vier
  // Flächen hier mit DREI Auflagen — Fliesstext (ink-900), Sekundärtext
  // (ink-600) und die Registerfarbe auf der eigenen Fläche (Marke/Nicht-Text,
  // SC 1.4.11). Rezept und Messreihe stehen bei jedem Token in
  // `design/tokens.json`; gemessen 22.9.2026 (culori, hell·dunkel):
  //   reg-g-flaeche  ink-900 11.59·10.60 · ink-600 5.38·5.25 · reg-g 6.20·6.84
  //   reg-r-flaeche  ink-900 11.40·10.70 · ink-600 5.29·5.30 · reg-r 7.41·6.34
  //   reg-m-flaeche  ink-900 12.17·10.37 · ink-600 5.65·5.14 · reg-m 4.10·7.91
  //   reg-w-flaeche  ink-900 12.13·10.46 · ink-600 5.63·5.18 · reg-w 4.30·7.52
  // Die knappsten Werte sind die Registerfarbe auf ihrer eigenen Fläche im
  // HELLEN (4.10 / 4.30 gegen 3:1) — dort entscheidet eine Verschiebung von
  // `paper` oder der Registerfarbe zuerst, und genau dort greift das Tor.
  TEXT('ink-900', 'reg-g-flaeche', 'Farbe als Fläche: Fliesstext auf der Register-Fläche «Gesetze»'),
  TEXT('ink-600', 'reg-g-flaeche', 'Farbe als Fläche: Sekundärtext auf der Register-Fläche «Gesetze»'),
  NICHT('reg-g', 'reg-g-flaeche', 'Farbe als Fläche: Marke «Gesetze» auf der eigenen Fläche'),
  TEXT('ink-900', 'reg-r-flaeche', 'Farbe als Fläche: Fliesstext auf der Register-Fläche «Rechtsprechung»'),
  TEXT('ink-600', 'reg-r-flaeche', 'Farbe als Fläche: Sekundärtext auf der Register-Fläche «Rechtsprechung»'),
  NICHT('reg-r', 'reg-r-flaeche', 'Farbe als Fläche: Marke «Rechtsprechung» auf der eigenen Fläche'),
  TEXT('ink-900', 'reg-m-flaeche', 'Farbe als Fläche: Fliesstext auf der Register-Fläche «Materialien»'),
  TEXT('ink-600', 'reg-m-flaeche', 'Farbe als Fläche: Sekundärtext auf der Register-Fläche «Materialien»'),
  NICHT('reg-m', 'reg-m-flaeche', 'Farbe als Fläche: Marke «Materialien» auf der eigenen Fläche'),
  TEXT('ink-900', 'reg-w-flaeche', 'Farbe als Fläche: Fliesstext auf der Register-Fläche «Werkzeuge»'),
  TEXT('ink-600', 'reg-w-flaeche', 'Farbe als Fläche: Sekundärtext auf der Register-Fläche «Werkzeuge»'),
  NICHT('reg-w', 'reg-w-flaeche', 'Farbe als Fläche: Marke «Werkzeuge» auf der eigenen Fläche'),
];

// (Referenz) C-1/C-2/C-3-Farb-Wörterbuch (§4b-B) — dokumentierte Zahlen als
// Regressions-Referenz; Drift > Toleranz = FAIL.
// D-3 (srgb→oklab, 12.7.2026): NEU GEMESSEN — alle drei Paare sind Voll-Token
// auf dem soliden --well, kein color-mix im Pfad → Werte byte-identisch
// (4.81/3.47 · 5.24/9.43 · 4.91/10.48). Die oklab-Umstellung verschiebt
// sichtbar NUR die vier -bg-Rezepte (PFLICHT-Badge-Paare oben, alle ≥5.1:1);
// Mixe mit `transparent` rendern wegen premultiplied alpha raumunabhängig gleich.
type Ref = { fg: string; bg: string; hell: number; dunkel: number; quelle: string };
export const REF_TOL = 0.06;
// D-5/A38 (16.7.): --well heller/weisser (#F2EFE6→#F6F4EE) → die HELL-Werte steigen
// (hellerer Grund = mehr Kontrast); DUNKEL unverändert (dunkle Fläche unberührt, A38).
// Neu deterministisch gemessen (culori) und in §4b-B/§F2b nachgezogen.
// W2·24-DESIGN-IDENTITAET R1 (6.9.2026): --well ist von #F6F4EE auf #F0F0F0
// (hell) bzw. von #100F0A auf #0E0E0E (dunkel) gewandert und --brass-700 von
// Messing (#826225/#D8BD78) auf Tinte (#151515/#EDEDED). Alle drei Zeilen sind
// darum NEU GEMESSEN, nicht «nachgeführt» — die alten Zahlen bleiben als
// Herkunft stehen (§2b: ein datierter Beleg altert nicht, er wird ergänzt).
// W2·24 D12 «Lesekomfort» (6.9.2026): --well wandert von #F0F0F0/#0E0E0E auf
// die warm getoenten #F3F0EA/#131211 und --brass-700 mit der Tinte von #151515
// auf #25231F (Halations-Daempfung, s. index.css). Alle drei Zeilen sind darum
// NEU GEMESSEN (scripts/farbwelt-messung, culori). Die R1-Zahlen bleiben als
// Herkunft in dieser Quelle-Spalte stehen — ein datierter Beleg altert nicht,
// er wird ergaenzt (§2b).
export const REFERENZ: Ref[] = [
  { fg: 'slate-500', bg: 'well', hell: 4.86, dunkel: 3.38, quelle: 'C-1 lc-chip-entscheid Tick (§4b-B; D-5 war 5.03 → R1 4.86/3.47 → D12 4.86/3.38)' },
  { fg: 'warn-700', bg: 'well', hell: 5.30, dunkel: 9.20, quelle: 'C-2 Currency-Chip warn (§4b-B; D-5 war 5.48/9.43 → R1 5.29/9.49 → D12 5.30/9.20)' },
  { fg: 'brass-700', bg: 'well', hell: 13.79, dunkel: 14.19, quelle: 'C-3 Akzent-Tick = Tinte (D-5 war 5.13/10.48 Messing → R1 16.02/16.49 → D12 13.79/14.19)' },
];

// (Fixpunkt) --paper hell/dunkel sind unantastbare Anker (Fixpunkt 1).
// D-5/A38-Übersteuerung (16.7.): der frühere Hell-Fixpunkt #FAF8F2 ist durch Davids
// Direktive «ganze Website heller und weisser» ausdrücklich überschrieben → neuer,
// hellerer/weisserer Hell-Anker #FCFAF6 (deklariert, Tor bleibt scharf). DUNKEL bleibt
// unantastbar (A38 betrifft nur die helle Fläche; D-6 kommt separat).
// W2·24-DESIGN-IDENTITAET R1 (6.9.2026), Freigabe David 6.9.: das Papier ist
// nicht mehr creme, sondern weiss (hell) bzw. neutral-dunkel — Werte aus dem
// freigegebenen Referenzbild abnahme/design-identitaet/vorschlag-freigegeben.html.
// Hell weicht um eine Stufe vom Referenz-Reinweiss #FFFFFF ab, weil die
// Flächen-L-Leiter well<paper<surface<paper-raised (FAIL-Regel in
// check-farbwelt.ts) über dem Papier noch zwei hellere Flächen braucht;
// #FFFFFF ist jetzt --paper-raised, die schwebende Ebene.
// W2·24 D12 «Lesekomfort» (6.9.2026): beide Anker sind DEKLARIERT versetzt —
// #FBFBFB/#151515 waren die R1-Werte (Referenzbild, chromafrei). D12 toent das
// Papier warm (Piepenbrock/Buchner: leichte Toenung senkt die Blendung ohne
// Verlust der positiven Polaritaet) und hebt das dunkle Papier vom Fast-Schwarz
// weg. Die R1-Zahlen bleiben als Herkunft im Kommentar stehen (§2b), sie sind
// nicht falsch geworden, sondern abgeloest.
export const FIXPUNKT: { token: string; mode: Mode; soll: string }[] = [
  { token: 'paper', mode: 'hell', soll: '#FAF7F2' },
  { token: 'paper', mode: 'dunkel', soll: '#1B1917' },
];

// (Baseline) BEKANNTE RISSE (D-1-Input): heute unter Schwelle → WARNUNG, FAIL nur
// bei Verschlechterung gegenüber dem gemessenen Ist-Wert (Baseline-Guard).
export const BASELINE_TOL = 0.03;
export const RISSE: { fg: string; bg: string; mode: Mode; schwelle: number; ist: number; tag: string }[] = [
  // D-4 ✅ (13.7.): ink-500/well hell 4.48→4.62 (L −0.007 bei Hue-Normalisierung) —
  // aus RISSE entfernt, jetzt harte PFLICHT (s. o.).
  // D-1.3 ✅: alle direkten Nicht-Text-Call-Sites von danger-500 sind auf
  // --danger-line aliassiert (dunkel = -700, 7.54:1) — das Token-PAAR bleibt
  // als Baseline-Guard, bis D-4/D-5 die -500-Mitte selbst kalibriert.
  { fg: 'danger-500', bg: 'paper', mode: 'dunkel', schwelle: 3.0, ist: 2.72, tag: 'D-1.3 Call-Sites aliassiert (--danger-line); Token-Paar bis D-4/D-5' },
];

// ── 4 · tailwind.config-Drift-Wächter: jedes geprüfte Token muss als Utility
//        existieren (sonst stiller No-op, F7). ────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const twColors: Record<string, any> = (tw as any).theme?.extend?.colors ?? {};
export const CONFIG_TOKENS = new Set<string>();
for (const [fam, val] of Object.entries(twColors)) {
  if (val && typeof val === 'object') for (const s of Object.keys(val)) CONFIG_TOKENS.add(s === 'DEFAULT' ? fam : `${fam}-${s}`);
  else CONFIG_TOKENS.add(fam);
}
// Semantische :root-Aliase, die bewusst kein Utility sind (nur via var() genutzt).
// QS-UI 8a: `warn-line` und `danger-line` standen hier, EXISTIEREN aber als
// Utility (tailwind.config.js:51/52, `warn.line`/`danger.line` → border-warn-line).
// Die Ausnahme war damit breiter als ihre eigene Begründung und nahm genau die
// zwei Linien-Token aus dem No-op-Wächter heraus, die QS-UI 8a neu als
// Pflichtpaare führt — der Wächter hätte ihr Verschwinden aus der Config nicht
// gemeldet (F6/F7: eine Ausnahme, die nicht mehr stimmt, ist ein stiller Riss).
// Geprüft 4.8.2026 gegen die Config: nur die vier hier verbliebenen Namen sind
// tatsächlich reine :root-Aliase ohne Utility.
export const ALIAS = new Set(['focus', 'placeholder', 'brass-line', 'auf-gold']);

// (b) OKLCH Hue-Drift + L-Monotonie je Familie.
//  D-4 (13.7.): die ink-Achse ist auf EINEN Ziel-Hue (88°, brass-verwandt)
//  normalisiert → für ink SCHARF geschaltet (FAIL bei Hue-Drift >8° oder gebrochener
//  L-Monotonie). brass bleibt beratend (WARNUNG), bis D-9/Stripe-L-Anker entscheidet.
export const FAMILIEN: Record<string, string[]> = {
  ink: ['ink-900', 'ink-800', 'ink-700', 'ink-600', 'ink-500', 'ink-400', 'ink-300'],
  brass: ['brass-800', 'brass-700', 'brass-600', 'brass-500', 'brass-400', 'brass-300'],
};
export const HUE_DRIFT_MAX = 8;

// (d) APCA-Spalte — NUR beratend (Lc), nie Fail.
export const APCA_PROBEN: { fg: string; bg: string; label: string; ziel: number }[] = [
  { fg: 'ink-900', bg: 'paper', label: 'Fliesstext', ziel: 75 },
  { fg: 'ink-600', bg: 'paper', label: 'Meta/Sekundär', ziel: 60 },
  { fg: 'brass-700', bg: 'paper', label: 'Link/Akzent', ziel: 60 },
  { fg: 'focus', bg: 'paper', label: 'Nicht-Text Fokus', ziel: 45 },
  // W2·24-R1: der knappste der vier Registertöne als beratende APCA-Sonde.
  { fg: 'reg-w', bg: 'paper', label: 'Register Werkzeuge', ziel: 60 },
];
