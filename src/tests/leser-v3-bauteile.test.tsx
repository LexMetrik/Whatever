import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { LeserKopf } from '../pages/gesetz-leser/v3/LeserKopf';
import { LeserSeitenleiste } from '../pages/gesetz-leser/v3/LeserSeitenleiste';
import { UebersichtBox } from '../pages/gesetz-leser/v3/UebersichtBox';
import { SuchSprungFeld } from '../pages/gesetz-leser/v3/SuchSprungFeld';
import type { KopfStufe } from '../pages/gesetz-leser/v3/kopfStufen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

// ─── Vertrags-Tests für die reinen V3-Bauteile (Auflage David 16.8.2026) ────
//
// Testtechnik wie im Repo üblich (Node-Env, KEIN jsdom/Testing-Library — beide
// sind hier nicht installiert, `npx vitest run` bricht sonst mit einem
// Auflösungsfehler ab, geprüft 16.8.2026): `renderToString` für die
// Markup-Zusicherungen (Reihenfolge, An-/Abwesenheit von Elementen), exakt das
// Muster aus `NormPopover.test.tsx` / `gesetz-leser-uebersicht-s6.test.tsx`.
//
// AUSNAHME `SuchSprungFeld` — Enter/Escape: die Entscheidlogik steckt (anders
// als bei `NormPopover`s `istSchliessTaste`) NICHT in einer exportierten
// reinen Funktion, sondern inline im `onKeyDown`-Prop des `<input>`. Ohne
// jsdom lässt sich kein echtes Tastatur-Ereignis auslösen. Statt die Logik im
// Test NACHZUBAUEN (das prüfte nur die Kopie, nie das Original — genau das
// Gegenteil von §6.7), wird der ECHTE, im Render gebundene `onKeyDown`-Callback
// abgegriffen: `react/jsx-(dev-)runtime` wird transparent umhüllt (Pass-
// Through, keine Verhaltensänderung), und jeder Aufruf mit `type === 'input'`
// wird mitgeschnitten. Der eingefangene Callback ist exakt die Closure, die
// die Komponente gebaut hat — der Test ruft sie direkt mit einem
// Mock-Event `{ key, preventDefault }` auf, wie es `istSchliessTaste(...)` in
// `NormPopover.test.tsx` mit Klartext-Objekten vormacht.

const eingefangeneInputs: Record<string, unknown>[] = [];

vi.mock('react/jsx-runtime', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  const wrap = (fn: (...a: unknown[]) => unknown) => (type: unknown, props: unknown, ...rest: unknown[]) => {
    if (type === 'input') eingefangeneInputs.push(props as Record<string, unknown>);
    return fn(type, props, ...rest);
  };
  return { ...mod, jsx: wrap(mod.jsx as never), jsxs: wrap(mod.jsxs as never) };
});
vi.mock('react/jsx-dev-runtime', async (importOriginal) => {
  const mod = await importOriginal<Record<string, unknown>>();
  const wrap = (fn: (...a: unknown[]) => unknown) => (type: unknown, props: unknown, ...rest: unknown[]) => {
    if (type === 'input') eingefangeneInputs.push(props as Record<string, unknown>);
    return fn(type, props, ...rest);
  };
  return { ...mod, jsxDEV: wrap(mod.jsxDEV as never) };
});

beforeEach(() => { eingefangeneInputs.length = 0; });

// ═══ LeserKopf ═══════════════════════════════════════════════════════════

const ERLASS: BrowseErlass = {
  key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht', sr: '220',
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/OR.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: 'x',
  pdfPfad: null,
};

function renderKopf(props: Partial<Parameters<typeof LeserKopf>[0]> & { stufe: KopfStufe }) {
  return renderToString(
    <MemoryRouter>
      {/* D1: der Kopf reicht `hatAenderungsvermerke` nur durch — hier `true`, damit
          die Fälle unten unverändert den vollen Schalter-Satz sehen; die Bedingung
          selbst prüft `e2e/leser-v3-umschalten` (a3) am gerenderten Erlass. */}
      {/* Ä87/Ä91 (H4-Nachzug 18.8.2026): die Prop `zeigeSchliessen` ist weg —
          die Kopfzeile trägt auf keiner Breite mehr ein ✕, ihr Ziel steht als
          beschrifteter Rücksprung in der Ort-Zone (Herleitung in
          `v3/kopfStufen.ts`, Zusage geprüft in `erlassAnsicht.hatRuecksprung`). */}
      {/* D27 (6.9.2026): die Prop `aktArtikel` ist weg — der laufende Artikel
          steht im Reiter, nicht mehr in dieser Zeile (Herleitung in
          `v3/LeserKopf.tsx`). */}
      {/* D35-F3: `aenderungsFussnoten` reichte der Kopf ebenso nur durch — hier
          ein Erlass MIT klassifizierter Historie, damit die Fälle unten die
          Dreier-Wahl ohne den §8-Hinweis sehen.
          §6.3-DEKLARATION (W2·26/Z8, 11.9.2026): die Durchreiche ist ersatzlos
          gefallen. Seit dem Mandat kennt die Wahl keine Fussnoten-KLASSEN mehr
          (sie zeigt den Apparat ganz oder gar nicht), damit hat der §8-Hinweis
          «hier unterscheiden sich zwei Stellungen nur in der Fassungs-Zeile»
          keinen Gegenstand mehr — und die Zahl, die ihn auslöste, keinen Leser
          (§17-Gegengewicht). Die Fälle unten sind unberührt. */}
      {/* D35-F2 (7.9.2026): `bestimmungsWort` reicht der Kopf ebenfalls nur
          durch — hier «Artikel» (Bund). Dass ein §-Erlass «Paragraphen»
          bekommt, prüft `leser-v3-erlassansicht.test.ts` an der einen
          Ableitung; hier stünde sonst eine zweite Wahrheit (§5/B8). */}
      {/* §6.3-DEKLARATION (S6 W1f, 24.9.2026): `bestimmungsWort` ist keine
          Prop des Kopfs mehr — ihr einziger Leser, die Rubriken-Wahl im
          Ansicht-Menü, ist mit der Funktionszeile gefallen. */}
      <LeserKopf erlass={ERLASS} fussnotenAnzahl={3}
        hatAenderungsvermerke {...props} />
    </MemoryRouter>,
  );
}

// ── §6.3-DEKLARATION (D27, David 6.9.2026) ─────────────────────────────────
// «diese funktion, dass es anzeigt in welchem artikel wir sind, soll der tab
// bekommen. es kann dann direkt im gesetz raus.» Der Fall prüfte bis hierher
// drei Kernelemente, darunter den LAUFENDEN ARTIKEL. Zwei davon (Kürzel,
// Ansicht-Öffner) sind unverändert; der dritte ist eine fachliche Änderung mit
// eigener Begründung und wird darum nicht stillschweigend gestrichen, sondern
// umgedreht: er steht als Zusage «die Zeile trägt den Ort NICHT MEHR» darunter.
describe('LeserKopf — Kürzel und Ansicht-Öffner sind IMMER da', () => {
  it.each<KopfStufe>(['voll', 'kompakt', 'mini'])('Stufe "%s": beide Kernelemente stehen', (stufe) => {
    const html = renderKopf({ stufe });
    expect(html).toContain('data-v3-kopf-kuerzel');
    expect(html).toContain('OR');
    expect(html).toContain('data-v3-ansicht');
  });
});

describe('D27 — die Kopfzeile trägt keine Brotkrume und keine Lesestellung', () => {
  it.each<KopfStufe>(['voll', 'kompakt', 'mini'])('Stufe "%s": weder Kette noch Rücksprung noch Artikel', (stufe) => {
    const html = renderKopf({ stufe });
    // Die Kette «Gesetze › Bund ›» und ihr enger Ersatz «‹ Gesetze». Geprüft
    // an den KETTEN-GLIEDERN, nicht am blossen Wort «Gesetze» — das steht auch
    // im `title` des Ansicht-Knopfes («… nur des Gesetzestexts») und wäre dort
    // ein Fehlalarm.
    expect(html).not.toContain('data-v3-kopf-krume-kurz');
    expect(html).not.toContain('>Gesetze<');
    expect(html).not.toContain('href="/gesetze"');
    expect(html).not.toContain('>Bund<');
    expect(html).not.toContain('&#x203A;'); // ›
    // Der laufende Artikel — er steht seit D27 im Reiter (`lib/tabs`).
    expect(html).not.toContain('data-v3-kopf-artikel');
    // Die Landmarke ist mit ihrem Inhalt gegangen: eine `nav` ohne Ziel wäre
    // für einen Screenreader eine leere Verheissung (§8).
    expect(html).not.toContain('Ort im Gesetz');
    // Die ZONE bleibt — sie ist die linke Spur, gegen die die Klapp-Sonde misst.
    expect(html).toContain('data-v3-kopf-ort');
  });
});

describe('LeserAnsichtV3 — `aria-controls` zeigt nie auf ein Panel, das es nicht gibt (B3)', () => {
  // Gefunden 16.8.2026 im Bug-Check: der Öffner trug `aria-controls` immer,
  // das Panel wird aber bedingt gerendert. Im Ruhezustand — und das ist der
  // Zustand, in dem der Leser fast immer steht — verwies das Attribut auf eine
  // Id ohne Element: axe `aria-valid-attr-value`, und ein Screenreader bietet
  // einen Sprung an, der ins Leere führt (§8). Den OFFENEN Zustand prüft
  // `e2e/leser-v3-umschalten.e2e.ts` (a) im echten Browser — hier gibt es
  // keinen Weg, den internen Zustand umzuschalten (Node-Env, kein jsdom).
  it.each<KopfStufe>(['voll', 'kompakt', 'mini'])('Stufe "%s": zu ⇒ kein aria-controls, aber aria-expanded=false', (stufe) => {
    const html = renderKopf({ stufe });
    expect(html).toContain('data-v3-ansicht');
    expect(html).toContain('aria-expanded="false"');
    // Der Ruhezustand rendert kein Panel — dann darf es auch keine Referenz geben.
    expect(html).not.toContain('data-v3-ansicht-panel');
    expect(html, 'aria-controls im geschlossenen Zustand — kaputte Id-Referenz')
      .not.toContain('aria-controls');
  });
});

// §6.3-DEKLARATION (V2, Nachzug 17.8.2026): unter 900 px fiel die Krume bis
// hierher GANZ weg — genau das war der Befund. Seit A-2 steht darüber keine
// App-Leiste mehr, die den Weg nach oben auffängt, und das ✕ springt an der
// Ebene vorbei. Neu schrumpft die Kette auf einen Rücksprung «‹ Gesetze» statt
// zu verschwinden. Geprüft wird darum dieselbe Zone mit einer PRÄZISEREN
// Aussage: was fällt, ist die KETTE (Ebene-Stufe + «›») und der Volltitel — der
// Rücksprung bleibt. Kein Aufweichen: die Ebene-Stufe wird auf beiden engen
// Zuschnitten weiterhin ausdrücklich als abwesend geprüft.
// ── §6.3-DEKLARATION (W2·24-R6/L10, 6.9.2026) · DER VOLLTITEL IST WEG ───────
// Die drei Fälle prüften bis hierher «Kette UND Volltitel». Der Volltitel steht
// seit R6 nicht mehr in der Kopfzeile — er stand dort DOPPELT: über der H1
// «Bundesgesetz betreffend die Ergänzung des ZGB (OR)» wiederholte die Krume
// denselben Namen, auf dem CISG zusätzlich abgeschnitten («… (Wiener
// Kaufrec…»). Das ist eine deklarierte fachliche Änderung, kein Refactoring:
// die ERWARTUNG des Tests ändert sich, nicht seine Absicht. Was er weiterhin
// misst, ist die Stufen-Mechanik der Kette — sie ist unberührt, und die beiden
// engen Stufen unten stehen byte-gleich (dort war der Volltitel schon vorher
// abwesend, die Zusage gilt jetzt für alle drei Stufen).
// ── §6.3-DEKLARATION (D27, David 6.9.2026) · DIE KETTE IST GANZ WEG ─────────
// Hier standen drei Fälle zur STUFEN-MECHANIK der Krume: «voll» trug die ganze
// Kette (Gesetze › Bund ›), «kompakt» und «mini» statt ihrer den Rücksprung
// «‹ Gesetze». Mit D27 gibt es weder das eine noch das andere — der Ort steht
// im Reiter, der Rücksprung in der Hauptnavigation. Die Stufen-Mechanik, die
// diese drei Fälle massen, existiert damit nicht mehr; sie stehenzulassen
// hiesse, ein Tor zu behalten, das nichts mehr bewachen kann (§6.7/§17).
// Die Zusage, die BLEIBT, steht im Fall «D27 — die Kopfzeile trägt keine
// Brotkrume und keine Lesestellung» weiter oben und prüft alle drei Stufen.
// Was die Kopf-STUFEN sonst noch entscheiden (Volltitel-Regel des Kürzels,
// Panel-Gestalt), ist unberührt und in `leser-v3-kopfstufen.test.ts` bewacht.

describe('LeserKopf — panelOeffner-Slot', () => {
  it('gesetzt: der Slot rendert seinen Inhalt', () => {
    const html = renderKopf({ stufe: 'voll', panelOeffner: <span data-panel-marker>PANEL</span> });
    expect(html).toContain('data-panel-marker');
    expect(html).toContain('PANEL');
  });

  it('NICHT gesetzt: kein leerer Kasten an seiner Stelle — die Griffe-Zeile geht direkt in den Ansicht-Öffner über', () => {
    const html = renderKopf({ stufe: 'voll' });
    expect(html).not.toContain('data-panel-marker');
    // Direkter Übergang von der Griffe-Leiste zum LeserAnsichtV3-Wrapper (kein
    // Zwischen-Element): das ist die konkrete Markup-Signatur von "nichts".
    expect(html).toMatch(/gap-1 sm:gap-1\.5"><div class="relative inline-flex">/);
  });
});

// ═══ LeserSeitenleiste ═══════════════════════════════════════════════════

function renderLeiste(props: Partial<Parameters<typeof LeserSeitenleiste>[0]> = {}) {
  return renderToString(
    <LeserSeitenleiste
      baum={<div data-marker-baum>BAUM</div>}
      onAlleAuf={() => {}} onAlleZu={() => {}} onAnfang={() => {}} alleOffen={false}
      {...props}
    />,
  );
}

describe('LeserSeitenleiste — feste Dokument-Reihenfolge', () => {
  // ── DEKLARIERTE VERTRAGSÄNDERUNG H2 (David 16.8.2026) ─────────────────────
  // Bis H1 lautete der Vertrag «Übersicht → Feld → Baumkopf → Baum → Extra»,
  // wobei das FELD ÜBER dem klebenden Block stand und mit der Übersichtsbox
  // wegscrollte. Davids Befund am gebauten Stand: «Das Suchfeld muss immer
  // zugreifbar sein, auch wenn ich in der Gliederung scrolle» — wer tief im
  // Baum der StPO stand, musste erst die Leiste hochscrollen, um zu suchen.
  //
  // NEU: das Feld ist Teil des KLEBENDEN Blocks und steht dort ZUOBERST.
  // Reihenfolge: Übersicht (scrollt weg) → [ Feld → Gliederungs-Kopfzeile ]
  // klebend → Baum → Extra. Der Test prüft jetzt genau das, inklusive der
  // Aussage, die den Unterschied trägt: das Feld liegt INNERHALB des klebenden
  // Blocks, nicht davor. Das ist nach §6.3 eine fachliche Änderung mit eigener
  // Begründung, kein stillschweigend nachgezogener Test.
  // C4 (H3-Nachzug): der Slot `extra` ist gestrichen (§17, kein Aufrufer über drei
  // Etappen) — die Reihenfolge-Zusage endet darum beim Baum. Die tragende Aussage
  // des Falls («das Feld liegt IM klebenden Block, nicht davor») bleibt Wort für
  // Wort dieselbe; nur das nicht mehr existierende Element fällt aus der Kette.
  // ── §6.3-DEKLARATION (D28, David 6.9.2026) ────────────────────────────────
  // «die suchleiste im gesetz, welche sich oben an der gliederung befindet, will
  // ich oben am gesetz». Der Fall prüfte die Reihenfolge Übersicht → [Feld →
  // Baumkopf] → Baum. Das FELD ist aus dieser Leiste heraus (es sitzt im
  // klebenden Kopf-Block, `v3/SuchZone.tsx`); die Reihenfolge-Zusage der übrigen
  // Elemente bleibt Wort für Wort dieselbe, die Feld-Zusage wird umgedreht.
  it('Übersicht → Baumkopf klebend → Baum', () => {
    const html = renderLeiste({ uebersicht: <div data-marker-u>U</div> });
    const iU = html.indexOf('data-marker-u');
    const iBaumkopf = html.indexOf('data-v3-leiste-baumkopf');
    const iB = html.indexOf('data-marker-baum');
    expect([iU, iBaumkopf, iB].every((i) => i >= 0)).toBe(true);
    // Die Übersichtsbox bleibt oben und ausserhalb — sie ist
    // Ankunfts-Information, kein Werkzeug, und darf wegscrollen.
    expect(iU).toBeLessThan(iBaumkopf);
    expect(iBaumkopf).toBeLessThan(iB);
  });

  it('D28: die Gliederung trägt KEIN Suchfeld mehr — auf keinem Weg', () => {
    // Kein Slot, keine Hülle, kein Rest-Markup. Rot-Beweis: mit dem alten
    // Bauteil (Feld im Sockel) stand `data-v3-leiste-feld` im Markup.
    const html = renderLeiste({ uebersicht: <div data-marker-u>U</div> });
    expect(html).not.toContain('data-v3-leiste-feld');
    expect(html).not.toContain('data-v3-suchsprung');
  });

  // C4: der Slot ist weg — die Zone kann darum nicht mehr erscheinen. Die Sonde
  // bleibt als NEGATIV-Beweis des Rückbaus stehen (sie wird rot, wenn jemand die
  // Zone ohne Aufrufer wieder einbaut); die Gegenprobe mit gesetztem Slot fällt
  // ersatzlos, weil es nichts mehr zu setzen gibt.
  it('C4: die Extra-Zone existiert nicht mehr', () => {
    expect(renderLeiste({})).not.toContain('data-v3-leiste-extra');
  });
});

// ═══ UebersichtBox ═══════════════════════════════════════════════════════

// §6.3-DEKLARATION (Ä70, 17.8.2026 — David: «mach das schöner und orientiere
// dich an Fedlex»). Die vier Fälle unten prüfen dieselben vier Zusagen wie vor
// dem Umbau; geändert hat sich, WOMIT die Box gefüttert wird. Bis Ä70 nahm sie
// eine fertige Zeichenkette (`zusammenfassung`), einen fertigen Warn-Knoten
// (`warnung`) und beliebige `children` — die Box war also ein Behälter, der über
// seinen Inhalt nichts wusste, und die Auswahl der Angaben lag beim Aufrufer.
// Jetzt nimmt sie EIN typisiertes Ergebnis (`angaben`) aus der reinen Funktion
// `uebersichtsAngaben`; die Box rendert nur noch. Ein Kinder-Slot existiert nicht
// mehr, weil es nichts mehr einzuhängen gibt.
//
// KEINE Assertion ist gelockert: «zu im Grundzustand», «die Zusammenfassung
// steht im DOM», «die Warnung steht VOR dem Klapp-Inhalt» und «ohne Warnung kein
// Warn-Markup» sind Zeichen für Zeichen dieselben Prüfungen. Neu hinzu kommt
// unten, was der Umbau ZUSÄTZLICH verspricht (genau EINE Klappe). Die
// Zeilen-Auswahl je Erlassart prüft der neue Vitest `leser-v3-uebersicht.test.ts`
// — nicht hier, weil sie zur reinen Funktion gehört, nicht zum Bauteil.
const ANGABEN_LEER = {
  ruhe: 'SR 210 · 480 Artikel',
  zeilen: [],
  links: [],
  warnung: null,
  vorbehalt: null,
  hinweise: [],
};

describe('UebersichtBox — zu im Grundzustand, Zusammenfassung bleibt im DOM', () => {
  it('<details> trägt KEIN `open`-Attribut', () => {
    const html = renderToString(<UebersichtBox angaben={ANGABEN_LEER} />);
    expect(html).toContain('data-v3-uebersicht');
    expect(/<details[^>]*\bopen\b[^>]*>/i.test(html)).toBe(false);
  });

  it('die Zusammenfassung steht im DOM (Ctrl+F/Screenreader, §8) — trotz zugeklappt', () => {
    const html = renderToString(<UebersichtBox angaben={ANGABEN_LEER} />);
    expect(html).toContain('SR 210 · 480 Artikel');
    expect(html).toContain('data-v3-uebersicht-zeile');
  });

  it('Ä97: die Box trägt GAR KEINE Warn-Zelle mehr — beide Aussagen gehören dem Kopf', () => {
    // ── §6.3-DEKLARATION, DRITTE UND LETZTE STUFE (Ä97, 18.8.2026) ──────────
    // Dieser Fall hiess bis heute «die Warn-Zelle steht VOR dem zugeklappten
    // Kinder-Block» und prüfte eine REIHENFOLGE. Die Reihenfolge gibt es nicht
    // mehr, weil es die Zelle nicht mehr gibt:
    //   Ä81 (H4-Nachzug) nahm die Konsolidierungs-Warnung aus der Box — sie
    //     stand gemessen zweimal gleichzeitig sichtbar auf der Seite.
    //   Ä97 (Live-Prüfung) nimmt den VORBEHALT aus demselben Grund. Ä81 hatte
    //     ihn ausdrücklich offengelassen, weil kein Erlass mit
    //     `naechsteFassungAb` zur Hand war; am Live-Stand trägt das OR @1440
    //     «⚠ nächste Fassung ab 01.10.2026» gleichzeitig in der Box UND in der
    //     Stand-Zeile des Erlass-Kopfs.
    // Damit wandert die geprüfte Zusage von «die Zelle steht an der richtigen
    // Stelle» zu «es gibt keine Zelle»: der Kopf sagt, WIE AKTUELL der Erlass
    // ist, die Box, WOHER er kommt und WIE er gebaut ist.
    // Die FELDER bleiben im reinen Modell samt ihren Sonden
    // (`leser-v3-uebersicht.test.ts`) — nur diese Ausgabe entfällt.
    // ROT ZU BEKOMMEN (§6.7): in `v3/UebersichtBox.tsx` den `vorbehalt`-Block
    // wieder einsetzen.
    const html = renderToString(
      <UebersichtBox angaben={{ ...ANGABEN_LEER, vorbehalt: 'nächste Fassung ab 01.01.2027' }} />,
    );
    expect(html).not.toContain('nächste Fassung ab 01.01.2027');
    expect(html).not.toContain('data-v3-uebersicht-warnung');
    // Positiv-Sonde: der Kinder-Block, vor dem die Zelle stand, ist unberührt —
    // die Box hat eine Ausgabe verloren, nicht ihre Struktur.
    expect(html).toContain('data-v3-uebersicht-inhalt');
  });

  it('Ä81: die Konsolidierungs-Warnung steht NICHT mehr in der Box — nur im Kopf', () => {
    // Gemessen 18.8.2026 (StPO, D 1440, Box zu wie aufgeklappt): der Satz stand
    // zweimal gleichzeitig sichtbar auf der Seite — in der Leiste und im
    // Erlass-Kopf. Die Box zieht ihre Grenze selbst anders (Kopf = wie aktuell,
    // Box = woher und wie gebaut); eine offene Konsolidierung ist «wie aktuell».
    // Das FELD bleibt im reinen Modell — nur diese Ausgabe entfällt.
    // ROT ZU BEKOMMEN (§6.7): in `v3/UebersichtBox.tsx` die `warnung`-Zeile
    // wieder in die Warn-Zelle setzen.
    const html = renderToString(
      <UebersichtBox angaben={{ ...ANGABEN_LEER, warnung: 'nicht konsolidiert' }} />,
    );
    expect(html).not.toContain('nicht konsolidiert');
    expect(html).not.toContain('data-v3-uebersicht-warnung');
  });

  it('ohne Warnung UND ohne Vorbehalt: keine Warn-Zelle im Markup', () => {
    const html = renderToString(<UebersichtBox angaben={ANGABEN_LEER} />);
    expect(html).not.toContain('data-v3-uebersicht-warnung');
  });

  // ── NEU mit Ä70 ──────────────────────────────────────────────────────────
  it('genau EINE Klappe — die zweite Ebene «Mehr zu diesem Erlass» ist weg', () => {
    // Ist-Befund 17.8.2026: die aufgeklappte Box trug ein zweites `<details>`,
    // und dahinter lagen die §8-Sätze über die Grenzen der eigenen Erfassung.
    // Ein Ehrlichkeits-Hinweis hinter zwei Klicks ist keiner (§8).
    const html = renderToString(
      <UebersichtBox angaben={{
        ...ANGABEN_LEER,
        zeilen: [{ id: 'art', label: 'Erlassart', wert: 'Bundesgesetz' }],
        links: [{ id: 'quelle', label: 'Amtliche Fassung', href: 'https://x.test', zeichen: '↗' as const }],
        hinweise: ['Kanton BS: Teilbestand, 859 Erlasse erfasst.'],
      }} />,
    );
    expect((html.match(/<details/g) ?? []).length).toBe(1);
    // Positiv-Sonde: der §8-Satz steht wirklich da, er ist nicht mit der
    // zweiten Klappe verschwunden.
    expect(html).toContain('859 Erlasse erfasst');
  });

  it('keine Zeile ohne Wert — eine leere Angabe erzeugt gar kein Label (§8)', () => {
    const html = renderToString(<UebersichtBox angaben={ANGABEN_LEER} />);
    // Ohne Zeilen entsteht die Liste gar nicht; ein «SR —» kann so nicht
    // entstehen, weil es kein Label ohne zugehörigen Wert gibt.
    expect(html).not.toContain('data-v3-uebersicht-liste');
  });
});

// ═══ SuchSprungFeld ══════════════════════════════════════════════════════

describe('SuchSprungFeld — Sprung-Hinweis folgt der Auflösbarkeit', () => {
  it('auflösbare Eingabe: der Sprung-Hinweis erscheint', () => {
    const html = renderToString(
      <SuchSprungFeld wert="429" setzeWert={() => {}} onSprung={() => {}} loeseArtikel={() => '429_tok'} />,
    );
    expect(html).toContain('data-v3-sprung-hinweis');
    expect(html).toContain('429');
  });

  it('NICHT auflösbare Eingabe: KEIN Sprung-Hinweis', () => {
    const html = renderToString(
      <SuchSprungFeld wert="Kündigung" setzeWert={() => {}} onSprung={() => {}} loeseArtikel={() => null} />,
    );
    expect(html).not.toContain('data-v3-sprung-hinweis');
  });

  it('fehlt `loeseArtikel` (Snapshot noch nicht da): KEIN Sprung-Hinweis — reine Suche (§8)', () => {
    const html = renderToString(
      <SuchSprungFeld wert="429" setzeWert={() => {}} onSprung={() => {}} />,
    );
    expect(html).not.toContain('data-v3-sprung-hinweis');
  });
});

describe('SuchSprungFeld — Enter springt, Escape leert und springt NICHT', () => {
  it('Enter bei auflösbarem Token ruft onSprung(token) auf', () => {
    const onSprung = vi.fn();
    const setzeWert = vi.fn();
    renderToString(
      <SuchSprungFeld wert="429" setzeWert={setzeWert} onSprung={onSprung} loeseArtikel={() => '429_tok'} />,
    );
    expect(eingefangeneInputs.length).toBe(1);
    const onKeyDown = eingefangeneInputs[0].onKeyDown as (e: { key: string; preventDefault: () => void }) => void;
    expect(typeof onKeyDown).toBe('function');
    onKeyDown({ key: 'Enter', preventDefault: () => {} });
    expect(onSprung).toHaveBeenCalledExactlyOnceWith('429_tok');
    expect(setzeWert).not.toHaveBeenCalled();
  });

  it('Escape ruft NUR setzeWert(\'\') — kein Sprung, auch wenn ein Token vorliegt', () => {
    const onSprung = vi.fn();
    const setzeWert = vi.fn();
    renderToString(
      <SuchSprungFeld wert="429" setzeWert={setzeWert} onSprung={onSprung} loeseArtikel={() => '429_tok'} />,
    );
    // `stopPropagation` gehoert seit dem B1-Nachzug dazu: im Sheet laegen sonst
    // «Feld leeren» und «Sheet schliessen» auf demselben Tastendruck.
    const onKeyDown = eingefangeneInputs[0].onKeyDown as (e: { key: string; preventDefault: () => void; stopPropagation: () => void }) => void;
    let gestoppt = false;
    onKeyDown({ key: 'Escape', preventDefault: () => {}, stopPropagation: () => { gestoppt = true; } });
    expect(gestoppt, 'Escape wird weitergereicht — das Sheet schliesst mit').toBe(true);
    expect(setzeWert).toHaveBeenCalledExactlyOnceWith('');
    expect(onSprung).not.toHaveBeenCalled();
  });

  it('Enter OHNE auflösbaren Token ruft nichts auf (kein Token, kein Sprung)', () => {
    const onSprung = vi.fn();
    const setzeWert = vi.fn();
    renderToString(
      <SuchSprungFeld wert="Kündigung" setzeWert={setzeWert} onSprung={onSprung} loeseArtikel={() => null} />,
    );
    const onKeyDown = eingefangeneInputs[0].onKeyDown as (e: { key: string; preventDefault: () => void }) => void;
    onKeyDown({ key: 'Enter', preventDefault: () => {} });
    expect(onSprung).not.toHaveBeenCalled();
    expect(setzeWert).not.toHaveBeenCalled();
  });
});
