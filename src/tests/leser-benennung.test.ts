import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { nichtKonsolidiertSatz } from '../lib/normtext/erlassKopfText';
import {
  AMTLICHE_FASSUNG, AMTLICHE_FASSUNG_AUFGEHOBEN, MASSGEBLICH_HALBSATZ, MASSGEBLICH_SATZ,
} from '../lib/benennung';

// ═══ BENENNUNGS-GLOSSAR DES LESERS — der Wächter (Ä97–Ä122, 18.8.2026) ══════
//
// ANLASS, gemessen: die Live-Ästhetik- und Benennungs-Prüfung vom 18.8.2026
// (`docs/ux-audit-2026-07/reader/leser-v3-h4/aesthetik-live-2026-08-18.md`) hat
// den grössten Abzug NICHT an Layout oder Farbe vergeben, sondern an der
// BENENNUNGS-STREUUNG: dieselbe Sache hiess je nach Ort verschieden —
//   Menü          «Ansicht» · «Darstellung» · «Darstellungsoptionen»
//   Fedlex-Link   «geltende Fassung» · «amtliche Fassung ↗» · «amtlich ↗»
//   Split-Fläche  «Reiter» · «Fenster» · «Pane» · «Split-View»
//   Fassungszeile Schalter «Änderungsvermerke» ↔ Element «FASSUNG»
//   «Übersicht»   Steckbrief-Box UND Fussnav-Link auf /gesetze
// Das ist kein Schönheitsfehler: wer «Ansicht» sucht und «Darstellung» liest,
// hält es für ein zweites Menü — und ein Screenreader-Nutzer, dem der
// `aria-label` etwas anderes sagt als das Auge liest, spricht mit dem sehenden
// Nachbarn über verschiedene Flächen (§8).
//
// DIE EINE WAHRHEIT ist seit 18.8.2026 das Glossar in der Design-Grundlage
// (`docs/ux-audit-2026-07/reader/leser-v3-design-grundlage.md`, Abschnitt
// «Benennung»). Diese Datei ist sein Wächter: sie hält fest, dass die
// verworfenen Wörter nicht zurückkommen und das gewählte wirklich dasteht.
//
// ── WARUM EINE QUELLENSONDE UND KEIN e2e ────────────────────────────────────
// Der Befund war ein WORT-Befund, kein Verhaltens-Befund. Ein e2e prüfte je
// eine Breite, einen Erlass und einen Zustand; die Streuung lebt aber in
// Attributen, die nur in seltenen Lagen sichtbar werden (`title` beim Hovern,
// `aria-label` nur für den Screenreader, Platzhalter nur im leeren Feld). Eine
// Sonde über den Quelltext trifft sie alle zugleich und kostet Millisekunden.
// Muster: `leser-v3-fundament.test.ts` (DOM-frei, §2).
//
// ── GELTUNGSBEREICH: DIE V3-FLÄCHE ──────────────────────────────────────────
// Geprüft wird `src/pages/gesetz-leser/v3/**` plus die GETEILTEN Bausteine, die
// V3 sichtbar rendert (`parts/ErlassLeserKopf.tsx`, `parts/ArtikelLeser.tsx`,
// `parts/SektionKopf.tsx`, `parts/ErlassKopfBlock.tsx`).
// AUSDRÜCKLICH NICHT: `parts/ErlassUebersicht.tsx` (geteilter Baustein,
// zusätzlich von den Fehl-/Früh-Ansichten in `inhalt-ansichten.tsx` gebraucht)
// und die App-Rahmen (`components/layout/**`, `components/NormPopover.tsx`).
// Sie tragen ältere Wörter weiter — das ist Absicht und nicht Nachlässigkeit:
// die App-Hälfte von Ä112/Ä118 ist eine eigene Entscheidung über die ganze
// Anwendung. Sie stehen als S-Zeilen im Fahrplan. (Die eingefrorene Ist-Hülle,
// bis H5 hier ebenfalls ausdrücklich ausgenommen, ist mit H5 — 21.8.2026 —
// gelöscht; die Ausnahme entfällt damit von selbst.)
// Wer den Bereich später ausweitet, ändert die Liste hier — und sieht sofort,
// wie viel noch offen ist.

const WURZEL = 'src/pages/gesetz-leser';
const V3_DIR = `${WURZEL}/v3`;

const GETEILTE_BAUSTEINE = [
  'parts/ErlassLeserKopf.tsx',
  'parts/ArtikelLeser.tsx',
  'parts/ArtikelLeser.leitfaelle.tsx',
  // W2·24-F (7.9.2026): die zwei §6.6-Splits von `ArtikelLeser.tsx` — sie
  // tragen sichtbare Wörter («Materialien», «Verweise», «Rechnen», «Vorlage»,
  // «Rechner») und standen bis zum Split IN der Datei darüber. Ohne diese zwei
  // Zeilen hätte der Split die Wörter still aus dem Geltungsbereich getragen.
  'parts/ArtikelLeser.kopfteile.tsx',
  // §6.3-DEKLARATION (W2·24-D34, 7.9.2026): die Datei hiess bis D33
  // `ArtikelLeser.bezuegeZone.tsx`. Sie ist mit D34 zum EINEN Bezüge-Fuss
  // beider Satzspiegel-Formen geworden und heisst darum `…bezuegeFuss.tsx`.
  // GEÄNDERT ist ausschliesslich der Pfad in dieser Liste — der
  // Geltungsbereich des Wächters (dieselbe Datei, dieselben Wörter) und
  // jede Zusage darüber sind unverändert.
  'parts/ArtikelLeser.bezuegeFuss.tsx',
  'parts/SektionKopf.tsx',
  // §6.3-DEKLARATION (W2·29-WERKBANK-LESER S2, 23.9.2026): hier stand
  // `parts/ErlassKopfBlock.tsx`. Der Ingress ist in das Titelblatt
  // `parts/ErlassLeserKopf.tsx` gezogen (oben gelistet) und die Datei
  // gelöscht — dieselben Wörter, derselbe Geltungsbereich.
];

const DATEIEN: string[] = [
  ...readdirSync(V3_DIR).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join('v3', f)),
  ...GETEILTE_BAUSTEINE,
];

const LIES = (rel: string) => readFileSync(`${WURZEL}/${rel}`, 'utf8');

/**
 * Quelltext OHNE Kommentare. Zwingend: die Herleitungen ZITIEREN die verworfenen
 * Wörter («hier stand ‹geltende Fassung›») — genau das soll erhalten bleiben und
 * darf den Wächter nicht auslösen.
 *
 * WORTGLEICH mit `leser-v3-fundament.test.ts` (§5) — und das ist keine
 * Bequemlichkeit, sondern das Ergebnis eines FALSCH-GRÜNEN ERSTLAUFS:
 *
 * ── DER ERSTE FILTER WAR EIN TOR, DAS NICHT SCHEITERN KONNTE (§6.7) ─────────
 * Er trug eine zusätzliche, scheinbar präzisere Regel für JSX-Kommentare,
 * `\{\s*\/\*[\s\S]*?\*\/\s*\}`. `\s` schliesst den ZEILENUMBRUCH ein — und
 * damit fing der Ausdruck auch dort an, wo eine geschweifte Klammer am
 * Zeilenende steht und der nächste Nicht-Leerraum ein Doc-Kommentar ist. In
 * `v3/LeserAnsichtV3.tsx` ist das die Props-Signatur:
 *   export function LeserAnsichtV3({ … }: {
 *     /** `true` = Handy-Zuschnitt …
 * GEMESSEN 18.8.2026: EIN Treffer über 6466 Zeichen, Zeile 80 bis 187 — der
 * ganze Props-Block UND die Attribute des Öffner-Knopfs verschwanden aus dem
 * geprüften Text. Die Sonde meldete «kein ‹Darstellungsoptionen› mehr»,
 * während das Wort im `aria-label` stand: sie prüfte eine Datei, aus der sie
 * die geprüfte Stelle selbst herausgeschnitten hatte.
 * AUFGEFALLEN ist es nur, weil der Rot-Beweis geführt wurde (der künstlich
 * eingebaute Rückfall blieb grün) — genau der Zweck von §6.7.
 * JETZT: dieselben zwei Regeln wie im Fundament-Wächter, Zeilen- VOR
 * Blockkommentaren. Ein JSX-Kommentar hinterlässt dabei ein nacktes Klammerpaar;
 * für Zeichenketten-Sonden ist das folgenlos.
 */
function ohneKommentare(quelle: string): string {
  return quelle
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Alle Dateien als EIN Text — für Aussagen über die Fläche, nicht die Datei. */
const FLAECHE = DATEIEN.map((d) => ohneKommentare(LIES(d))).join('\n');

/** Wortgrenzen-Treffer statt Substring-Präsenz (CLAUDE.md §7). «Fassung» darf
 *  in «Fassungs-Zeitleiste» vorkommen; «Darstellung» soll auch
 *  «Darstellungsoptionen» fangen — darum je Eintrag ein eigenes Muster. */
function trefferIn(text: string, muster: RegExp): boolean {
  return new RegExp(muster.source, muster.flags.replace('g', '')).test(text);
}

// ── POSITIV-SONDE ZUERST (§6.7 b) ───────────────────────────────────────────
// Ein Wächter, der die leere Menge prüft, ist grün und wertlos.
describe('Positiv-Sonde: die geprüfte Fläche existiert und trägt Beschriftungen', () => {
  it('die Dateiliste ist gefüllt und enthält die bekannten Träger', () => {
    expect(DATEIEN.length).toBeGreaterThan(20);
    expect(DATEIEN).toContain('v3/LeserAnsichtV3.tsx');
    expect(DATEIEN).toContain('v3/SuchBereichWahl.tsx');
    expect(DATEIEN).toContain('parts/ErlassLeserKopf.tsx');
  });

  it('der kommentarfreie Text ist nicht leer — die Filterung frisst nicht alles', () => {
    expect(FLAECHE.length).toBeGreaterThan(20_000);
    // Eine Beschriftung, die es garantiert gibt: ohne sie hätte der Filter zu
    // viel entfernt und jede Verbots-Sonde wäre grundlos grün.
    expect(FLAECHE).toContain('Fussnoten');
  });

  it('die Herleitungen dürfen die verworfenen Wörter zitieren — Kommentare zählen nicht', () => {
    // Gegenprobe zum Filter: im ROHTEXT steht «geltende Fassung» (in der
    // Ä110-Herleitung), im gefilterten Text nicht mehr. Fällt der Filter aus,
    // wird dieser Fall rot, bevor die Verbote unten falsch anschlagen.
    const roh = LIES('parts/ErlassLeserKopf.tsx');
    expect(roh).toContain('geltende Fassung');
    expect(ohneKommentare(roh)).not.toContain('geltende Fassung');
  });
});

// ═══ DAS GLOSSAR ════════════════════════════════════════════════════════════
//
// Je Eintrag: die SACHE, das gewählte Wort (muss vorkommen) und die verworfenen
// Wörter (dürfen nicht vorkommen). `gewaehlt` ist die Positiv-Hälfte — ohne sie
// wäre jedes Verbot auch dann grün, wenn die Beschriftung ganz verschwände.

interface GlossarEintrag {
  sache: string;
  gewaehlt: RegExp;
  verworfen: { wort: RegExp; statt: string }[];
}

const GLOSSAR: GlossarEintrag[] = [
  {
    sache: 'Menü der Darstellungsschalter (Ä114)',
    gewaehlt: /aria-label="Ansicht"/,
    verworfen: [
      { wort: /"Darstellungsoptionen"/, statt: 'aria-label="Ansicht"' },
      { wort: />Darstellung</, statt: '>Ansicht<' },
      { wort: /title=\{?[`"']Darstellung:/, statt: 'title="Ansicht: …"' },
    ],
  },
  {
    sache: 'Fedlex-Link am Erlass/Artikel (Ä110)',
    gewaehlt: /Amtliche Fassung ↗/,
    // GETROFFEN WIRD DAS LINK-LABEL, NICHT DER SATZ (§7, Identität statt
    // Substring-Präsenz). Ein blosses /geltende Fassung/ war beim ersten Lauf
    // rot an `parts/ArtikelLeser.tsx:77` — dort steht «Entscheide beziehen sich
    // auf die im Entscheidzeitpunkt geltende Fassung», ein fachlich richtiger
    // Satz über Rechtsprechung und kein Link auf Fedlex. Ein Wächter, der
    // Sprache statt Beschriftung misst, zwingt zur Verstümmelung korrekter
    // Sätze — darum die Klammerung an Pfeil bzw. Element-/Label-Grenze.
    verworfen: [
      { wort: /(↗\s*geltende Fassung|geltende Fassung\s*↗|>\s*geltende Fassung\s*<|label: '[^']*geltende Fassung)/, statt: '«Amtliche Fassung ↗»' },
      { wort: /amtliche Fassung ↗/, statt: '«Amtliche Fassung ↗» (gross)' },
      { wort: />\s*amtlich ↗\s*</, statt: '«Fedlex ↗» — das Ziel benennen' },
    ],
  },
  {
    // ── DEKLARIERTE FACHLICHE ÄNDERUNG (M8, 6.9.2026 — §6.3, kein Refactoring)
    // Ä118 hat 18.8.2026 «In neuem Fenster» gewählt, weil «Reiter» im Browser
    // besetzt sei und die Split-Sache «Fenster» heisse. Der Beleg gilt für
    // seinen Stand unverändert weiter — DAMALS gab es weder eine Reiterleiste
    // noch Pane-Marken. Seit dem R2-Nachzug trägt die Arbeitsleiste messbar
    // `title="Fenster links"`/`"Fenster rechts"`, und GEMESSEN 6.9.2026
    // (Prüfbefund R11 #28) öffnete der so beschriftete Knopf gar kein Fenster:
    // `panes: []`, keine `[data-pane]`-Spalte, stattdessen ein zweiter Reiter.
    // Der Knopf tut jetzt, was er sagt (`oeffneDaneben`), und heisst wie die
    // vier anderen Stellen mit derselben Wirkung: «Daneben öffnen».
    // Das Wort-VERBOT bleibt unverändert bestehen: «In neuem Reiter» kommt
    // nicht zurück. Neu verboten ist zusätzlich das alte «In neuem Fenster» —
    // es beschrieb eine Wirkung, die der Knopf nicht hatte.
    sache: 'Split-Fläche (Ä118/M8) — «Reiter» bleibt dem Panel, das Wort sagt die Wirkung',
    gewaehlt: /Daneben öffnen/,
    verworfen: [
      { wort: /In neuem Reiter/, statt: '«Daneben öffnen»' },
      { wort: /In neuem Fenster/, statt: '«Daneben öffnen»' },
    ],
  },
  {
    // §6.3-DEKLARATION (D35-F3, Entscheid David 7.9.2026): der Schalter ist eine
    // Stellung der Radiogruppe «Änderungen anzeigen als» geworden, seine
    // Beschriftung steht darum als Tabellen-Eintrag statt als JSX-Attribut
    // (`v3/LeserAenderungsWahl.tsx`). Das GLOSSAR-WORT ist unverändert
    // «Fassung» — Ä116 gilt Wort für Wort weiter, nur die Fundstelle wandert.
    // §6.3-DEKLARATION (S6 W1f, Entscheid David 24.9.2026): die Stellung
    // «Fassung» ist mit der Funktionszeile gefallen; die Fassungs-Auskunft
    // steht als Klappzeile im Erlass-Blatt (`v3/BlattArtikel.tsx`). Das
    // GLOSSAR-WORT bleibt «Fassung» (Ä116) — nur die Fundstelle wandert erneut,
    // und das verworfene «Änderungsvermerke» bleibt verworfen.
    sache: 'Fassungs-Zeile ↔ ihre Klappzeile im Erlass-Blatt (Ä116)',
    gewaehlt: /titel=\{`Fassung \$\{dieses\(wort\)\}`\}/,
    verworfen: [
      { wort: /label="Änderungsvermerke"/, statt: "«Fassung»" },
      { wort: /label: 'Änderungsvermerke'/, statt: "«Fassung»" },
      { wort: /titel=\{?["'`]Änderungsvermerke/, statt: "«Fassung»" },
    ],
  },
  {
    sache: 'Suchbereich «Überschriften» (Ä120)',
    gewaehlt: /kurz: 'Überschriften'/,
    verworfen: [{ wort: /kurz: 'Titel'/, statt: "kurz: 'Überschriften'" }],
  },
  {
    sache: 'Fussnav auf /gesetze (Ä119) — «Übersicht» bleibt der Steckbrief-Box',
    gewaehlt: /Alle Gesetze/,
    verworfen: [{ wort: /className="shrink-0 text-ink-500 hover:text-brass-700">Übersicht</, statt: '«Alle Gesetze»' }],
  },
  {
    sache: 'Trefferzähler (Ä103)',
    gewaehlt: /Fundstelle <span className="num">/,
    verworfen: [{ wort: /\{anzeige\}<\/span>\//, statt: '«Fundstelle n von m»' }],
  },
  {
    sache: 'Kopf-Standausweis (Ä-Rest: kein englisches Jargonwort)',
    gewaehlt: /Kopie vom/,
    verworfen: [{ wort: /Snapshot —/, statt: '«Kopie vom … — massgeblich ist die amtliche Fassung»' }],
  },
];

describe('Benennungs-Glossar: je Sache EIN Wort über die ganze V3-Fläche', () => {
  for (const e of GLOSSAR) {
    it(`${e.sache}: das gewählte Wort steht da`, () => {
      expect(trefferIn(FLAECHE, e.gewaehlt),
        `Das Glossar-Wort für «${e.sache}» kommt in der V3-Fläche gar nicht vor — ` +
        'entweder ist die Beschriftung verschwunden oder der Wächter zeigt auf die falsche Stelle.',
      ).toBe(true);
    });

    for (const v of e.verworfen) {
      it(`${e.sache}: «${v.wort.source}» kommt nicht mehr vor`, () => {
        const treffer = DATEIEN.filter((d) => trefferIn(ohneKommentare(LIES(d)), v.wort));
        expect(treffer,
          `Verworfenes Wort in ${treffer.join(', ')} — das Glossar sagt: ${v.statt}. ` +
          'Steht es in einer Herleitung, gehört es in einen Kommentar (die zählen hier nicht).',
        ).toEqual([]);
      });
    }
  }
});

// ── Ä111/Ä112 · DIE ZUGÄNGLICHEN NAMEN SAGEN, WAS SIE TUN ───────────────────
describe('Ä111/Ä112: zwei Griffe derselben Glyphe, zwei verschiedene Namen', () => {
  it('der ☰ des Lesers nennt die Handlung, nicht nur die Sache', () => {
    const rahmen = ohneKommentare(LIES('v3/LeserRahmenV3.tsx'));
    expect(rahmen).toContain('aria-label="Gliederung öffnen"');
    // Rot zu bekommen: den Namen auf «Gliederung» zurücksetzen — dann heisst er
    // wieder wie der ☰ der App-Topbar zwei Zentimeter daneben.
    expect(/aria-label="Gliederung"/.test(rahmen)).toBe(false);
  });

  it('das Leser-Suchfeld nennt seinen Erlass — im NAMEN, nicht im Platzhalter', () => {
    // 14.9.2026: die Feldbeschriftung ist mit dem Schnitt von `erlassAnsicht.ts`
    // in die Schwesterdatei `erlassWortlaut.ts` gewandert (Deckel-Wurzelfix,
    // s. `leser-v3-fundament.test.ts`). NUR DER PFAD folgt dem Umzug — jede
    // Zusage darunter steht Zeichen für Zeichen unverändert (§6.3).
    const ansicht = ohneKommentare(LIES('v3/erlassWortlaut.ts'));
    // ── Ä126 (18.8.2026) · DIE SIGNATUR IST DIE ZUSAGE ────────────────────
    // Bis hierher stand hier das Gegenteil: der Platzhalter MUSSTE das Kürzel
    // entgegennehmen. Gemessen an ZH-211.11 @390 waren das 465 px in einem
    // 280-px-Feld — das Registerfeld `kuerzel` ist nicht längenbeschränkt
    // (753/1469 über 20 Zeichen, längster Wert 521). Der Platzhalter darf
    // darum GAR KEINE Daten mehr annehmen; die Zusage steht in der Signatur,
    // wo ein späterer Bau sie nicht versehentlich unterläuft.
    expect(ansicht).toMatch(/export function suchPlatzhalter\(beispiel: string \| null\): string/);
    expect(ansicht).not.toMatch(/export function suchPlatzhalter\([^)]*kuerzel/);
    expect(ansicht).toMatch(/export function suchFeldName\(kuerzel/);
    // Genusfrei: der Artikel regiert «Erlass», das Kürzel steht als Apposition.
    expect(ansicht).toContain('Im Erlass ${k} suchen');
    const feld = ohneKommentare(LIES('v3/SuchSprungFeld.tsx'));
    expect(feld).toContain('aria-label={ariaName}');
  });
});

// ── Ä117 · EIN GEDANKENSTRICH ───────────────────────────────────────────────
describe('Ä117: der Leser führt genau EIN Gedankenstrich-Zeichen', () => {
  it('kein « – » (Halbgeviert mit Spatien) in Beschriftungen der V3-Fläche', () => {
    const treffer = DATEIEN.filter((d) => ohneKommentare(LIES(d)).includes(' – '));
    expect(treffer,
      `Halbgeviertstrich mit Spatien in ${treffer.join(', ')} — der Leser schreibt «—». ` +
      'Der Halbgeviertstrich bleibt dem BIS-Strich vorbehalten, und der steht ohne Spatien («Art. 1–10»).',
    ).toEqual([]);
  });

  it('Positiv-Sonde: «—» kommt in der Fläche wirklich vor', () => {
    // Ohne sie wäre das Verbot oben auch dann grün, wenn gar kein
    // Gedankenstrich mehr gesetzt würde.
    expect(FLAECHE).toContain('—');
  });
});

// ═══ DIE APP-FLÄCHE (W2·19-DESIGN-KONSISTENZ, Befunde B-1/B-2/B-3/B-6/A-3) ══
//
// GELTUNGSBEREICH-ERWEITERUNG, 31.8.2026. Der Kopf dieser Datei sagt seit dem
// 18.8.: «Wer den Bereich später ausweitet, ändert die Liste hier — und sieht
// sofort, wie viel noch offen ist.» Genau das passiert hier — und zwar, weil die
// dort als «eigene Entscheidung über die ganze Anwendung» zurückgestellte Hälfte
// von Ä110 inzwischen ENTSCHIEDEN ist:
//
// GEMESSEN (Design-Konsistenz, Finder-Welle B, Runde 1): derselbe Link auf die
// massgebliche amtliche Quelle trug ausserhalb der V3-Fläche vier Wortlaute und
// vier Optiken («Zur amtlichen Fassung ↗» als schwarzer Primärknopf ·
// «↗ geltende Fassung» · «↗ geltende Fassung auf Fedlex» · im Aufhebungs-Banner
// «↗ amtliche (aufgehobene) Fassung»), das Datum lief in zwei Anmutungen aus
// FÜNF byte-gleichen Formatierern, und der Vorbehalt stand in zwei Substantiven
// («Fassung» 10 : «Quelle» 5).
//
// WARUM DIE SONDEN HIER UND NICHT IN EINER EIGENEN DATEI: es ist dieselbe
// Sache (ein Ziel, ein Name) und dieselbe Technik (Quelltext-Scan ohne
// Kommentare). Zwei Wächter für ein Glossar wären genau die Streuung, gegen
// die dieser Wächter gebaut ist.
//
// Die V3-Fläche oben bleibt unberührt: sie hat ihre eigene Dateiliste, und die
// Kanon-Wörter stehen dort weiterhin als Literal (`parts/ArtikelLeser.tsx`,
// `parts/SektionKopf.tsx`) — der Baustein hat sie nicht verschluckt.

const APP_DATEIEN = [
  'components/ui/QuellLink.tsx',
  'components/ui/Datum.tsx',
  'components/NormPopover.tsx',
  'components/vorlagen/NormChip.tsx',
  'components/rechtsprechung/format.ts',
  'pages/MaterialLeser.tsx',
  'pages/gesetz-leser/parts/ErlassLeserKopf.tsx',
  'pages/gesetz-leser/parts/AmtlichesPdf.tsx',
  // ── R2-A-NACHZUG (31.8.2026): die sechs Flächen aus dem N2-Nachtrag ────────
  // (FAHRPLAN-DESIGN-KONSISTENZ §3), die B-6 nachgezogen haben und danach KEIN
  // «amtliche Quelle» mehr führen. Sie stehen hier, weil der Geltungsbereich
  // eines Wort-Wächters die Liste IST: was nicht in ihr steht, ist nicht
  // bewacht — und genau daran ist die Streuung nach Ä110 gewachsen.
  'lib/seo-detail.ts',
  'lib/verzahnung/glossar.ts',
  'components/verzahnung/statusRezept.ts',
  'pages/gesetz-leser/parts/ArtikelHistorie.tsx',
  'pages/Gesetze.tsx',
  'pages/Materialien.tsx',
  // S5c (25.9.2026): der Material-Hinweis wanderte aus `pages/MaterialLeser.tsx`
  // in diesen Baustein — ohne Eintrag fiele er aus dem Geltungsbereich.
  'components/materialien/GattungsHinweis.tsx',
];

// ═══ DIE ZWEI-BEGRIFFE-REGEL (R2-A, 31.8.2026) ══════════════════════════════
//
// B-6 sagt: EIN Nomen für das Massgebliche — «die amtliche Fassung». Beim
// Nachziehen der elf Rest-Stellen (N2-Nachtrag) hat sich gezeigt, dass «Quelle»
// nicht überall dasselbe Ding benennt. Die Prüffrage, an der die zwei Begriffe
// AUSEINANDERGEHALTEN werden — und die jede neue Stelle zu beantworten hat:
//
//   Steht statt des Wortes «der amtlich publizierte TEXT»?
//       → «die amtliche FASSUNG», aus `lib/benennung` (Nomen bzw. Satz).
//         Das ist der Vorbehalt: was gilt, wenn unsere Wiedergabe abweicht.
//   Muss man «FEDLEX» / «die Amtliche Sammlung» einsetzen, damit der Satz
//   stimmt?
//       → «die amtliche QUELLE» bzw. «die amtliche SAMMLUNG» BLEIBT. Das ist
//         kein zweites Wort für dasselbe, sondern ein anderes Ding: die
//         Publikationsstelle, auf die der Link zeigt.
//
// GEMESSEN am Bestand 31.8.2026 gibt es genau eine Fläche, die beide Fälle
// nebeneinander führt — das Kontext-Panel: sein Vorbehalt zu maschinell
// zugeordneten Botschaften/Vernehmlassungen meint den TEXT (nachgezogen), seine
// Fehler-Zeile «Amtliche Quelle: Fedlex ↗» und «Vollständige Liste über die
// amtliche Quelle (Fedlex)» meinen die PLATTFORM (unverändert). Darum steht sie
// nicht in `APP_DATEIEN` (dort gilt das pauschale Verbot), sondern hier — mit
// einem engeren Verbot und einer Positiv-Sonde auf die erlaubte Verwendung.
// Ohne diese Positiv-Sonde wäre die Ausnahme unsichtbar: wer sie eines Tages
// wegräumt, merkt es an keinem Wächter.
const ZWEI_BEGRIFFE_DATEIEN = ['components/kontext/KontextPanel.tsx'];

/** Der VORBEHALTSSATZ mit dem falschen Nomen — «massgeblich … die amtliche Quelle». */
const VORBEHALT_MIT_QUELLE = /[Mm]assgeblich (?:ist|bleibt)(?: stets)? die amtliche Quelle/;

const LIES_APP = (rel: string) => readFileSync(`src/${rel}`, 'utf8');
const APP_FLAECHE = APP_DATEIEN.map((d) => ohneKommentare(LIES_APP(d))).join('\n');

describe('Positiv-Sonde: die App-Fläche existiert und trägt den geteilten Baustein', () => {
  it('alle gelisteten Dateien sind lesbar und der gefilterte Text ist substanziell', () => {
    expect(APP_DATEIEN.length).toBe(15);
    expect(APP_FLAECHE.length).toBeGreaterThan(10_000);
    // Eine Beschriftung, die es garantiert gibt: ohne sie hätte der Filter zu
    // viel entfernt und jede Verbots-Sonde wäre grundlos grün.
    expect(APP_FLAECHE).toContain('Norm-Vorschau');
  });

  it('der Kanon-Wortlaut steht im Baustein — und wird dort gebaut, nicht kopiert', () => {
    const baustein = ohneKommentare(LIES_APP('components/ui/QuellLink.tsx'));
    expect(baustein).toContain('AMTLICHE_FASSUNG');
    expect(baustein).toContain('AMTLICHE_FASSUNG_AUFGEHOBEN');
    expect(baustein).toContain('↗');
    // Die Wörter selbst bleiben in der EINEN Wortquelle (§5) — der Baustein
    // darf sie nicht noch einmal ausschreiben.
    expect(baustein).not.toContain(`'${AMTLICHE_FASSUNG}'`);
    expect(baustein).not.toContain(`'${AMTLICHE_FASSUNG_AUFGEHOBEN}'`);
  });
});

describe('B-1/B-2: EIN Name und EINE Anatomie für den amtlichen Quell-Link', () => {
  const VERWORFEN: { wort: RegExp; statt: string }[] = [
    { wort: /↗\s*geltende Fassung/, statt: '«Amtliche Fassung ↗» (Pfeil hinten)' },
    { wort: /geltende Fassung\s*↗/, statt: '«Amtliche Fassung ↗» (kein «geltende»)' },
    { wort: /Zur amtlichen Fassung/, statt: '«Amtliche Fassung ↗»' },
    { wort: /↗\s*amtliche \(aufgehobene\) Fassung/, statt: '«Amtliche (aufgehobene) Fassung ↗»' },
    { wort: /↗\s*Nachfolge-Erlass/, statt: '«Nachfolge-Erlass: … ↗» (Pfeil hinten)' },
  ];

  for (const v of VERWORFEN) {
    it(`«${v.wort.source}» kommt in der App-Fläche nicht mehr vor`, () => {
      const treffer = APP_DATEIEN.filter((d) => trefferIn(ohneKommentare(LIES_APP(d)), v.wort));
      expect(treffer,
        `Verworfener Wortlaut in ${treffer.join(', ')} — der Kanon (Ä110) sagt: ${v.statt}. ` +
        'Steht er in einer Herleitung, gehört er in einen Kommentar (die zählen hier nicht).',
      ).toEqual([]);
    });
  }

  it('die vier Konsumenten ziehen den Link aus dem Baustein, statt ihn zu bauen', () => {
    for (const d of [
      'pages/gesetz-leser/parts/ErlassLeserKopf.tsx',
      'pages/MaterialLeser.tsx',
      'components/NormPopover.tsx',
      'components/vorlagen/NormChip.tsx',
    ]) {
      expect(ohneKommentare(LIES_APP(d)), `${d} führt den Quell-Link nicht über QuellLink`)
        .toContain('QuellLink');
    }
  });

  it('der Quell-Link im MaterialLeser ist kein Primärknopf mehr (ruhiger Textlink)', () => {
    // GEMESSEN: `lc-btn-primary` war die lauteste Form der Seite und stand auf
    // einem Link, der aus der Seite HINAUS zu einer Auskunft führt.
    expect(ohneKommentare(LIES_APP('pages/MaterialLeser.tsx'))).not.toContain('lc-btn-primary');
  });
});

describe('B-3: EIN Datums-Formatierer, EINE Anmutung', () => {
  it('keine zweite ISO-Datums-Regex in der App-Fläche', () => {
    // Die eine Quelle ist `datumCh` in `lib/normtext/erlassKopfText.ts`; jede
    // weitere Stelle mit derselben Regex ist eine Kopie, die auseinanderlaufen
    // kann (fünf gab es, alle byte-gleich).
    const treffer = APP_DATEIEN.filter((d) => /\(\\d\{4\}\)-\(\\d\{2\}\)-\(\\d\{2\}\)/.test(ohneKommentare(LIES_APP(d))));
    expect(treffer,
      `Eigener Datums-Formatierer in ${treffer.join(', ')} — Format UND Auszeichnung ` +
      'kommen aus `components/ui/Datum.tsx` (§5).',
    ).toEqual([]);
  });

  it('Positiv-Sonde: die eine Quelle trägt die Regex wirklich', () => {
    // Ohne sie wäre das Verbot oben auch dann grün, wenn gar kein Formatierer
    // mehr existierte.
    expect(readFileSync('src/lib/normtext/erlassKopfText.ts', 'utf8'))
      .toContain('/^(\\d{4})-(\\d{2})-(\\d{2})$/');
  });

  it('Materialien- und Norm-Vorschau-Datum laufen über den geteilten Baustein', () => {
    for (const d of ['pages/MaterialLeser.tsx', 'components/NormPopover.tsx']) {
      expect(ohneKommentare(LIES_APP(d)), `${d} zeichnet sein Datum nicht über <Datum> aus`)
        .toContain('<Datum iso=');
    }
  });

  it('die Mono-Stimme bleibt SR-Nummer und Aktenzeichen vorbehalten', () => {
    // Design-Grundlage Kap. 2.1. Im MaterialLeser umklammerte `.num` ein DATUM.
    expect(ohneKommentare(LIES_APP('pages/MaterialLeser.tsx'))).not.toContain('className="num"');
    // Gegenprobe: im Erlass-Kopf steht `.num` weiterhin — dort trägt es die
    // SR-Nummer, also genau den Fall, für den die Mono-Stimme reserviert ist.
    expect(ohneKommentare(LIES_APP('pages/gesetz-leser/parts/ErlassLeserKopf.tsx')))
      .toContain('className="num"');
  });
});

describe('B-6: EIN Substantiv für das Massgebliche — «Fassung», nicht «Quelle»', () => {
  it('keine «amtliche Quelle» mehr in der App-Fläche', () => {
    const treffer = APP_DATEIEN.filter((d) => ohneKommentare(LIES_APP(d)).includes('amtliche Quelle'));
    expect(treffer,
      `«amtliche Quelle» in ${treffer.join(', ')} — der Kanon (B-6) sagt «die amtliche ` +
      'Fassung», aus `lib/benennung.ts`. Tragend ist NICHT eine Mehrheitszählung ' +
      '(die gemeldete «10:5» ist nicht rekonstruierbar und gilt als falsifiziert, ' +
      'Gegenprüfung N1), sondern die Präzision: massgeblich ist nicht «eine Quelle», ' +
      'sondern der amtlich publizierte Text in seiner Fassung. Meint die Stelle die ' +
      'PLATTFORM (Fedlex) statt des Textes, gehört sie nicht in diese Liste — dann ' +
      'gilt die Zwei-Begriffe-Regel (s. `ZWEI_BEGRIFFE_DATEIEN`).',
    ).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: das Verbot findet den Vorher-Wortlaut', () => {
    // Ohne sie wäre der Fall auch dann grün, wenn `ohneKommentare` zu viel
    // entfernte (§6.7 b: ein Wächter, der nichts finden KANN, ist wertlos).
    const vorher = "erklaerung: 'Das Datum, ab dem die gezeigte Fassung einer Bestimmung"
      + " gilt. Massgeblich ist stets die amtliche Quelle.',";
    expect(ohneKommentare(vorher).includes('amtliche Quelle')).toBe(true);
  });

  it('die drei Träger ziehen den Vorbehalt aus der Wortquelle', () => {
    expect(ohneKommentare(LIES_APP('pages/gesetz-leser/parts/ErlassLeserKopf.tsx'))).toContain('MASSGEBLICH_HALBSATZ');
    expect(ohneKommentare(LIES_APP('pages/gesetz-leser/parts/AmtlichesPdf.tsx'))).toContain('MASSGEBLICH_HALBSATZ');
    // S5c (§6.3, deklariert, Entscheid David 25.9.2026 «je Gattung»): der
    // Material-Hinweis ist nach `components/materialien/GattungsHinweis`
    // gewandert (ein Satz je Gattung) — der Leser bindet ihn ein. Geprüft wird
    // der neue Träger; vorher `pages/MaterialLeser.tsx` enthält MASSGEBLICH_SATZ.
    expect(ohneKommentare(LIES_APP('components/materialien/GattungsHinweis.tsx'))).toContain('MASSGEBLICH_SATZ');
    expect(ohneKommentare(LIES_APP('pages/MaterialLeser.tsx'))).toContain('<GattungsHinweis');
  });

  it('§8: der Nachdruck «stets» überlebt die Vereinheitlichung', () => {
    // Ein Vereinheitlichen darf einen Ehrlichkeits-Satz nie abschwächen.
    expect(MASSGEBLICH_SATZ).toBe('Massgeblich ist stets die amtliche Fassung.');
    expect(MASSGEBLICH_HALBSATZ).toBe('massgeblich ist die amtliche Fassung');
  });

  it('der Risikopfad-Satz bleibt byte-gleich zum Stand vor der Anbindung', () => {
    // `erlassKopfText.nichtKonsolidiertSatz` hat den Halbsatz seit B-6 nicht
    // mehr als Literal. Die ERZEUGTE Zeichenkette muss dieselbe bleiben —
    // derselbe String steht im prerenderten SEO-Kopf (§5, `lib/seo-detail.ts`).
    expect(nichtKonsolidiertSatz('2025-07-01')).toBe(
      'Fedlex hat eine seit 01.07.2025 geltende Änderung noch nicht in den Text eingearbeitet'
      + ' — massgeblich ist die amtliche Fassung.',
    );
    expect(nichtKonsolidiertSatz(null)).toBe(
      'Fedlex hat eine geltende Änderung noch nicht in den Text eingearbeitet'
      + ' — massgeblich ist die amtliche Fassung.',
    );
  });
});

describe('B-6 · Zwei-Begriffe-Regel: «Quelle» bleibt der PLATTFORM vorbehalten', () => {
  it('kein Vorbehaltssatz führt dort noch «die amtliche Quelle»', () => {
    const treffer = ZWEI_BEGRIFFE_DATEIEN
      .filter((d) => VORBEHALT_MIT_QUELLE.test(ohneKommentare(LIES_APP(d))));
    expect(treffer,
      `Vorbehaltssatz mit «Quelle» in ${treffer.join(', ')} — der Vorbehalt meint den `
      + 'amtlich publizierten TEXT und heisst darum «die amtliche Fassung» '
      + '(`AMTLICHE_FASSUNG_NOMEN`). «Quelle» bleibt nur, wo die Plattform gemeint ist.',
    ).toEqual([]);
  });

  it('NEGATIV-KONTROLLE: der Ausdruck findet beide Vorher-Wortlaute', () => {
    // Wortlaut aus KontextPanel.tsx vor dem Fix (Stand 31.8.2026, Z. 383/509).
    expect(VORBEHALT_MIT_QUELLE.test(
      'fachlich nicht geprüft; massgeblich bleibt die amtliche Quelle.')).toBe(true);
    expect(VORBEHALT_MIT_QUELLE.test(
      'Massgeblich ist stets die amtliche Quelle.')).toBe(true);
    // Gegenprobe: die ERLAUBTE Verwendung darf der Ausdruck NICHT fangen.
    expect(VORBEHALT_MIT_QUELLE.test(
      'Vollständige Liste über die amtliche Quelle (Fedlex).')).toBe(false);
  });

  it('POSITIV-SONDE: die erlaubte Verwendung steht wirklich noch da', () => {
    // Die Ausnahme muss sichtbar bleiben — sonst ist das engere Verbot oben nur
    // ein pauschales Verbot mit mehr Zeichen.
    const panel = ohneKommentare(LIES_APP('components/kontext/KontextPanel.tsx'));
    expect(panel, 'die Plattform-Verwendung «Amtliche Quelle: … (Fedlex)» ist weg — '
      + 'dann gehört die Datei in `APP_DATEIEN` und die Ausnahme in den Rückbau')
      .toContain('amtliche Quelle');
  });

  it('und der Vorbehalt läuft dort über die Wortquelle, nicht über ein Literal', () => {
    expect(ohneKommentare(LIES_APP('components/kontext/KontextPanel.tsx')))
      .toContain('AMTLICHE_FASSUNG_NOMEN');
  });

  it('«Amtliche Sammlung» bleibt als eigener Fachbegriff (AS/RO) unangetastet', () => {
    // Sie benennt ein anderes Ding als die Fassung eines Erlasses: die
    // Publikationsreihe, in der die Änderungserlasse stehen. Ein Vereinheitlichen
    // auf «Fassung» wäre hier keine Vereinheitlichung, sondern ein Sachfehler.
    // WÄCHTER-DATEILISTE UM LEAF-MODUL ERGÄNZT (§6.6-Split, 12.9.2026, PR #830):
    // der Fachbegriff steht seither im ausgelagerten `RevisionenGruppe.tsx`
    // (Zeilen-Schwelle §6.6), nicht mehr in `KontextPanel.tsx` selbst — die
    // Sonde prüft darum additiv beide Dateien der App-Fläche zu diesem Feature.
    expect(ohneKommentare(LIES_APP('components/kontext/KontextPanel.tsx'))
      + ohneKommentare(LIES_APP('components/kontext/RevisionenGruppe.tsx')))
      .toContain('amtliche Sammlung');
  });
});

describe('A-3: das Material-Pane meldet seinen Dokumentnamen', () => {
  const MATERIAL = () => ohneKommentare(LIES_APP('pages/MaterialLeser.tsx'));

  it('kein imPane-Guard vor der Kopf-Meldung', () => {
    // GEMESSEN: mit `if (imPane) return;` hiess das Pane «Material öffnen»
    // (Verlauf-Fallback) statt «Materialien › WML». Die Melde-Kette ist
    // pane-lokal (`components/layout/Pane.tsx` legt einen eigenen
    // `InhaltsKopfMeldeProvider` um seinen RouteSwitch) — der Guard schützte
    // vor nichts und kostete den Namen.
    expect(MATERIAL()).not.toMatch(/if\s*\(\s*imPane\s*\)/);
    expect(MATERIAL(), 'die Prop trägt ohne den Guard keine Aussage mehr (§17 Rückbau)')
      .not.toContain('usePaneKontext');
  });

  it('Positiv-Sonde: die Meldung selbst steht noch da', () => {
    // Ohne sie wäre das Verbot oben auch dann grün, wenn die ganze Melde-Kette
    // verschwände — dann hiesse das Pane wieder «Material öffnen».
    expect(MATERIAL()).toContain('meldeKopf({ breadcrumb:');
    expect(MATERIAL()).toContain("label: 'Materialien'");
  });

  it('die pane-lokale Melde-Kette existiert wirklich (Grund des Rückbaus)', () => {
    // Der Guard war mit der Sorge begründet, die Meldung könnte den Kopf der
    // HAUPTfläche überschreiben. Diese Sonde hält fest, warum sie es nicht
    // kann — bricht der eigene Provider im Pane weg, wird der Rückbau falsch.
    expect(readFileSync('src/components/layout/Pane.tsx', 'utf8'))
      .toContain('<InhaltsKopfMeldeProvider value={setKopf}>');
  });
});

// ═══ R7 «BESCHRIFTUNGEN» (W2·24-DESIGN-IDENTITAET, Session E6, 6./7.9.2026) ═
//
// Befund F1: der Begriffs-Kanon schreibt «Entscheid» vor, nicht «Urteil» —
// die Filterzeile («Urteil ab/bis») und die generische Fallback-Datumszeile im
// Entscheid-Leser («Urteil vom …») sprachen trotzdem von «Urteil», obwohl sie
// für JEDE Instanz/Gerichtsbarkeit gelten, nicht nur für Urteile im engen
// Sinn (Beschlüsse/Verfügungen laufen über denselben Zweig).
//
// ALLOWLIST: «Urteil» bleibt ausserhalb dieser zwei Stellen ein echter
// Rechtsbegriff — Formular-Labels der Rechner/Vorlagen («vollstreckbares
// Urteil», Art. 80 SchKG) und der EntscheidLeser-Fliesstext «vollständiges
// Urteil» ↔ «amtlicher BGE-Auszug» (eine andere, bewusst beibehaltene
// Unterscheidung: volltextliches Urteil vs. kuratierter Sammlungsauszug, kein
// Synonym für «Entscheid»). Bewacht wird NUR der enge Begriffs-Kanon-Fall.
const R7_URTEIL_DATEIEN = [
  'components/rechtsprechung/EntscheidFilter.tsx',
  'components/rechtsprechung/EntscheidKopfTeile.tsx',
];

describe('R7 F1: Kanon «Entscheid», nicht «Urteil», in Filterzeile und Datumsfallback', () => {
  const VERBOTEN: RegExp[] = [/>Urteil ab</, />Urteil bis</, />Urteil vom /];

  for (const muster of VERBOTEN) {
    it(`«${muster.source}» kommt in den zwei bewachten Dateien nicht mehr vor`, () => {
      const treffer = R7_URTEIL_DATEIEN.filter((d) => muster.test(ohneKommentare(LIES_APP(d))));
      expect(treffer,
        `Verworfener Wortlaut in ${treffer.join(', ')} — der Begriffs-Kanon sagt «Entscheid», ` +
        'nicht «Urteil» (F1). Rechtsbegriff-Verwendungen ausserhalb dieser Filterzeile/Fallback ' +
        'sind davon nicht betroffen (Allowlist siehe Kommentar oben).',
      ).toEqual([]);
    });
  }

  it('Rot-Beweis: das Verbotsmuster hätte den alten Wortlaut wirklich getroffen', () => {
    expect('<span>Urteil ab</span>').toMatch(VERBOTEN[0]);
    expect('<span>Urteil bis</span>').toMatch(VERBOTEN[1]);
    expect('<span>Urteil vom <Datum /></span>').toMatch(VERBOTEN[2]);
  });

  it('Positiv-Sonde: der Kanon-Begriff steht jetzt wirklich da', () => {
    const filter = ohneKommentare(LIES_APP('components/rechtsprechung/EntscheidFilter.tsx'));
    expect(filter).toContain('Entscheid ab');
    expect(filter).toContain('Entscheid bis');
    expect(ohneKommentare(LIES_APP('components/rechtsprechung/EntscheidKopfTeile.tsx')))
      .toContain('Entscheid vom ');
  });
});

describe('R7 F2: ZitierMarke trägt den Kopier-Scope auch im aria-label (Fehlerbuch-18)', () => {
  // GEMESSEN (Finder, Session E6): `title` allein ist auf Touch unerreichbar
  // und nicht in jedem Screenreader-Baum verlässlich — dasselbe Muster wurde
  // im Erlass-Kopf (Amtliche-Fassung-Link, ArtikelLeser.tsx) und im
  // EntscheidLeser (5B-Nachzug) bereits behoben. `ZitierMarke` bedient JEDEN
  // Absatz-/Ziffernmarker in JEDEM Erlass und war der eine noch offene Fall.
  const ZITIER = () => ohneKommentare(LIES_APP('components/normtext/ArtikelBody.zitier.tsx'));

  it('aria-label steht neben title, mit demselben Scope-Text', () => {
    expect(ZITIER()).toContain('title={`${zitat} — kopieren`}');
    expect(ZITIER()).toContain('aria-label={`${zitat} — kopieren`}');
  });

  it('Rot-Beweis: ein Knopf ohne aria-label wäre am Muster erkennbar', () => {
    const nurTitle = '<button title={`${zitat} — kopieren`}>{children}</button>';
    expect(nurTitle).not.toContain('aria-label={`${zitat} — kopieren`}');
  });
});
