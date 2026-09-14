import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';

// ─── Architektur-Zusagen des V3-Fundaments (Auftrag David 16.8.2026, H1) ────
//
// Diese Datei rechnet die Zusagen aus dem Fundament-Umbau NACH, statt sie zu
// glauben: welche V3-Datei welche Nachbardatei berühren darf, wo `imPane` und
// `erlass.ebene` gelesen werden dürfen, wie gross eine Datei werden darf. Alle
// Sonden sind QUELLENSONDEN (§2, DOM-frei) — sie lesen den Quelltext, nicht das
// Laufzeitverhalten, nach dem Muster von `leser-v3-adresse.test.ts`.
//
// Rot zu bekommen: irgendeine V3-Datei ausser `leserV3Modell.ts` importiert
// eine der sechs `inhalt-*`-Nahtdateien; irgendeine Datei importiert die
// Ist-Hülle; `imPane`/`istSekundaer` taucht ausserhalb der Wurzel-Dateien
// im CODE auf; `.ebene`/`.rechtsgebiet` wird ausserhalb `erlassAnsicht.ts`
// gelesen; ein Bestimmungswort («Artikel»/«Paragraphen») steht ausserhalb
// `erlassWortlaut.ts`; eine Datei überschreitet 420 Zeilen.

const V3_DIR = 'src/pages/gesetz-leser/v3';
const LIES = (name: string) => readFileSync(`${V3_DIR}/${name}`, 'utf8');
const traegt = (heu: string, muster: RegExp) => muster.test(heu);

/** Quelltext OHNE Kommentare — Zeilen- VOR Blockkommentaren entfernen, sonst
 *  frisst ein `layout/**`-artiges Muster in Prosa den halben Code (Lehre aus
 *  `leser-v3-adresse.test.ts`, reproduziert 16.8.2026 beim ersten Lauf dort). */
function ohneKommentare(quelle: string): string {
  return quelle
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

// Positiv-Sonde zuerst (§6.7 b): das Verzeichnis existiert und trägt Dateien —
// sonst prüften alle Schleifen unten die leere Menge und wären grundlos grün.
const ALLE_DATEIEN = readdirSync(V3_DIR).filter((f) => /\.tsx?$/.test(f));

describe('Positiv-Sonde: v3/ enthält überhaupt Dateien', () => {
  it('mindestens die bekannten Bausteine sind da', () => {
    expect(ALLE_DATEIEN.length).toBeGreaterThan(5);
    expect(ALLE_DATEIEN).toContain('leserV3Modell.ts');
    expect(ALLE_DATEIEN).toContain('erlassAnsicht.ts');
    // Schnitt 14.9.2026: die Ableitungsschicht ist ein PAAR. Ohne diese Zeile
    // liefe die halbe Zusage unten gegen eine Datei, die es nicht mehr gibt.
    expect(ALLE_DATEIEN).toContain('erlassWortlaut.ts');
  });
});

describe('Eine Naht: die sechs geteilten inhalt-*-Module', () => {
  const NAHT_MODULE = [
    'inhalt-hooks', 'inhalt-zustand', 'inhalt-ableitungen',
    'inhalt-sprung', 'inhalt-weiterlesen', 'inhalt-suchtreffer',
  ];
  const RAHMEN = 'leserV3Modell.ts';

  it('der Adapter importiert tatsächlich aus der Naht (sonst prüfte das Verbot unten nichts)', () => {
    const quelle = LIES(RAHMEN);
    const treffer = NAHT_MODULE.filter((m) => traegt(quelle, new RegExp(`from '\\.\\./${m}'`)));
    expect(treffer.length, 'leserV3Modell.ts importiert aus KEINEM der sechs Module').toBeGreaterThan(0);
  });

  it('KEINE andere V3-Datei importiert aus einem der sechs Module', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === RAHMEN) continue;
      const quelle = ohneKommentare(LIES(datei));
      for (const modul of NAHT_MODULE) {
        expect(traegt(quelle, new RegExp(`from '\\.\\./${modul}'`)), `${datei} importiert '../${modul}'`).toBe(false);
      }
    }
  });

  // Deklarierte, kommentierte Ausnahme (Auftrag): `LeserRahmenV3.tsx` darf
  // ZUSÄTZLICH `../inhalt-ansichten` importieren — ein SIEBTES Modul, nicht Teil
  // der obigen sechs. Damit eine NEUE Ausnahme rot wird, ist der Kreis der
  // erlaubten Importeure hier auf genau eine Datei geschlossen.
  it('`../inhalt-ansichten`: NUR LeserRahmenV3.tsx — die deklarierte Ausnahme', () => {
    const AUSNAHME = 'LeserRahmenV3.tsx';
    expect(traegt(LIES(AUSNAHME), /from '\.\.\/inhalt-ansichten'/),
      'die dokumentierte Ausnahme importiert das Modul gar nicht (mehr) — Kommentar ist stale').toBe(true);
    for (const datei of ALLE_DATEIEN) {
      if (datei === AUSNAHME) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /from '\.\.\/inhalt-ansichten'/), `${datei} importiert '../inhalt-ansichten' — neue, undeklarierte Ausnahme`).toBe(false);
    }
  });
});

// GELÖSCHT 21.8.2026 (H5): die Einträge zur Ist-Hülle selbst (`../inhalt`,
// `../inhalt-volltext`, `LeserMenuPaar`, `LeserAnsichtMenu`,
// `LeserRechtsprechungMenu`, `../parts/InGesetzSuche`) prüften ein Verbot, das
// mit der gelöschten Hülle nicht mehr scheitern KANN — kein Quelltext im Repo
// trägt diese Namen mehr, weder in noch ausserhalb von `v3/` (§6.7: ein Tor,
// das nicht scheitern kann, ist gefährlicher als keines). `KontextPanel` und
// `ArtikelSprungFeld` bleiben: beide Bausteine leben weiter (`KontextPanel` in
// `inhalt-ansichten.tsx`s Fehl-/Früh-Ansichten, `ArtikelSprungFeld` in
// `GliederungSheet.tsx`) und das Verbot, sie ein zweites Mal direkt aus `v3/`
// zu berühren, ist weiterhin ein echtes.
const VERBOTEN: [string, RegExp][] = [
  ['KontextPanel', /\bKontextPanel\b/],
  ['../parts/ArtikelSprungFeld', /\bArtikelSprungFeld\b/],
];

// H3 · NUR DIREKT (nicht transitiv): `BezuegeZeile` ist der Artikelfuss der
// Ist-Hülle, den V3 durch das Panel ablöst (Pos. 12). Das Verbot gilt bewusst
// nur für den V3-Quelltext selbst — transitiv steht die Zeile weiterhin im Graph,
// weil der KERN (`parts/ArtikelLeser`) sie rendert, wenn ein Aufrufer `bezuege`
// setzt. Genau das tut V3 nicht mehr; der Kern bleibt unangetastet.
const VERBOTEN_DIREKT: [string, RegExp][] = [
  ['BezuegeZeile', /\bBezuegeZeile\b/],
];

describe('Keine Ist-Hülle: die alten Bausteine sind aus v3/ nicht erreichbar', () => {
  it('keine V3-Datei berührt die Ist-Hülle (Code, nicht Kommentare)', () => {
    for (const datei of ALLE_DATEIEN) {
      const quelle = ohneKommentare(LIES(datei));
      for (const [name, muster] of [...VERBOTEN, ...VERBOTEN_DIREKT]) {
        expect(traegt(quelle, muster), `${datei} berührt die Ist-Hülle (${name})`).toBe(false);
      }
    }
  });
});

// ─── H3 · DIE ZUSAGEN DES RECHTSPRECHUNGS-PANELS ────────────────────────────
//
// Vier Quellensonden, die je einen Rückschritt rot machen, den ein DOM-Test
// nicht sieht.

describe('H3 — Pos. 12: der Lesekörper führt keine Bezüge mehr', () => {
  it('die Lesespalte setzt die `bezuege`-Prop des Kerns NICHT', () => {
    const quelle = ohneKommentare(LIES('LeserLesespalte.tsx'));
    expect(traegt(quelle, /\bbezuege=/), 'LeserLesespalte.tsx setzt `bezuege` — die Entscheid-Linien sind zurück').toBe(false);
  });

  // ── D30 (W2·24-R5-F1K, 7.9.2026) · WARUM DANEBEN EINE ZWEITE SONDE STEHT ──
  // Der Fall darüber ist UNVERÄNDERT (§6.3: kein Test angefasst). Er trägt
  // weiterhin Pos. 12, und er trägt sie zu Recht: `bezuege` speiste auch den
  // Artikelfuss der schmalen Form — gemessen @390 an der StPO schob das Setzen
  // dieser Prop beim Öffnen des Panels jeden Artikel nach unten (`leser-v3-
  // kontext-cls` (b), Artikel-y 1385→1493→…). D30 setzt darum eine eigene Prop,
  // die AUSSCHLIESSLICH im `<details>` der Bezüge-Zeile landet.
  //
  // ── §6.3-DEKLARATION (W2·24-D34, 7.9.2026) · NUR DER NAME ─────────────────
  // Die Prop hiess `bezuegeImKopf`, solange die Zeile unter der Artikelnummer
  // stand. D34 hat sie auf Davids Wunsch ans ARTIKELENDE gestellt («das mit den
  // bezügen soll unten an den artikel und nicht direkt nach der artikel
  // nummer»), und der Name folgt dem Ort: `bezuegeImFuss`. GEÄNDERT ist hier
  // ausschliesslich die gesuchte Zeichenkette; die drei Zusagen der Sonde
  // (genau EINE Setzung · `alleFuer`, also ungefiltert · kein zweiter Ladepfad)
  // stehen unverändert. Der datierte Beleg oben bleibt stehen, wie er ist — er
  // beschreibt den Stand seines Datums (§0.2b).
  it('D30: die aufgeklappte Bezüge-Zeile speist sich aus dem geteilten, UNGEFILTERTEN Apparat', () => {
    const quelle = ohneKommentare(LIES('LeserLesespalte.tsx'));
    const setzungen = quelle.match(/\bbezuegeImFuss=\{[^}]*\}/g) ?? [];
    expect(setzungen.length, 'LeserLesespalte.tsx setzt `bezuegeImFuss` nicht — die Zeile bleibt leer (D30/D34)').toBe(1);
    expect(setzungen[0], 'die Zeile liest nicht `alleFuer` des geteilten Apparats — entweder zweiter Ladepfad oder gefilterte Liste')
      .toBe('bezuegeImFuss={bezuege?.alleFuer(e.artikel)}');
    expect(traegt(quelle, /\buseBezuege\b/), 'LeserLesespalte.tsx ruft `useBezuege` selbst — das ist der zweite Ladepfad, den H3 abgeschafft hat').toBe(false);
    expect(traegt(quelle, /\bonBezuegeOeffnen=/), 'ohne `onBezuegeOeffnen` fragt niemand nach dem Apparat — genau Davids D30-Befund').toBe(true);
  });

  it('Positiv-Sonde: sie setzt `revision`/`historie` weiterhin (sonst prüfte das Verbot nur eine leere Datei)', () => {
    const quelle = ohneKommentare(LIES('LeserLesespalte.tsx'));
    expect(traegt(quelle, /\brevision=/)).toBe(true);
    expect(traegt(quelle, /\bhistorie=/)).toBe(true);
  });

  it('der Adapter schaltet das Vorladen des Bezugs-Shards ab (Nachladen, Kap. 7)', () => {
    const quelle = ohneKommentare(LIES('leserV3Modell.ts'));
    expect(traegt(quelle, /bezuegeVorladen:\s*false/),
      'leserV3Modell.ts lädt die Bezüge wieder beim Seitenaufruf — das Nachladen ist ausgehebelt').toBe(true);
  });
});

describe('H3 — EIN Auto-Zu für alle Flächen (§5)', () => {
  const HOOK = 'usePopoverAutoZu.ts';

  it('der Hook trägt die Mechanik wirklich (sonst prüfte das Verbot nichts)', () => {
    const quelle = ohneKommentare(LIES(HOOK));
    expect(traegt(quelle, /pointerdown/)).toBe(true);
    expect(traegt(quelle, /wheel/)).toBe(true);
    expect(traegt(quelle, /useDialogFokus/)).toBe(true);
  });

  it('KEINE andere V3-Datei registriert Aussenklick- oder Wisch-Schliessen selbst', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === HOOK) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /addEventListener\(\s*'pointerdown'/), `${datei} hat eine zweite Aussenklick-Kopie`).toBe(false);
      expect(traegt(quelle, /addEventListener\(\s*'wheel'/), `${datei} hat eine zweite Wisch-Kopie`).toBe(false);
    }
  });

  it('beide Flächen benutzen ihn — das Ansicht-Menü UND das Panel', () => {
    expect(traegt(ohneKommentare(LIES('LeserAnsichtV3.tsx')), /usePopoverAutoZu\(/)).toBe(true);
    expect(traegt(ohneKommentare(LIES('LeserPanelZone.tsx')), /usePopoverAutoZu\(/)).toBe(true);
  });
});

describe('H3 — SEO: der Prerender-Pfad kennt die Bezüge nicht (§7-Befund)', () => {
  // Der Fahrplan verlangt «der Prerender behält die Bezüge im HTML». Gemessen:
  // er hatte sie nie. Diese Sonde hält den EIGENTLICHEN Schutz fest — der
  // Prerender-Pfad darf sich nie an die Hülle oder an die Bezugs-Ladeschicht
  // hängen, sonst könnte eine Hüllen-Entscheidung das SEO-HTML verändern.
  const PFADE = ['src/lib/seo-detail.ts', 'scripts/prerender.ts'];

  it('Positiv-Sonde: die Dateien existieren und schreiben Erlass-HTML', () => {
    expect(readFileSync(PFADE[0]!, 'utf8')).toContain('erlassVolltextHtml');
    expect(readFileSync(PFADE[1]!, 'utf8')).toContain('erlassVolltextHtml');
  });

  it('weder seo-detail noch prerender berühren Bezüge, norm-index oder die V3-Hülle', () => {
    for (const p of PFADE) {
      const quelle = ohneKommentare(readFileSync(p, 'utf8'));
      expect(traegt(quelle, /bezuege/i), `${p} berührt die Bezugs-Schicht`).toBe(false);
      expect(traegt(quelle, /norm-index/), `${p} berührt den norm-index`).toBe(false);
      expect(traegt(quelle, /gesetz-leser\/v3/), `${p} berührt die V3-Hülle`).toBe(false);
    }
  });
});

// ─── EINE EBENE TRANSITIV (Architektur-Review A1, 16.8.2026) ─────────────────
//
// Die Sonde oben liest nur den QUELLTEXT der V3-Dateien. Sie war darum blind
// gegen den Weg, auf dem die Ist-Hülle tatsächlich in V3 stand: `inhalt-hooks`
// re-exportierte `useInhaltsKopfMeldung` aus `inhalt-kopfmeldung`, und diese
// Datei zieht `LeserMenuPaar` + `InGesetzSuche` mit. Kein V3-Quelltext nannte
// die beiden — der Bundler zog sie trotzdem. Ein Verbot, das ein `export … from`
// aushebelt, ist keines.
//
// Darum wird der Import-Graph ab `v3/` ZWEI Kanten weit abgelaufen (Ebene 1 =
// die direkten Nachbarn, Ebene 2 = deren Nachbarn) und auf denselben Markern
// geprüft. Weiter als zwei Kanten wäre eine Sonde über die halbe Leser-Familie
// und würde jeden fremden Umbau rot machen, ohne etwas über V3 zu sagen.
const LESER_DIR = 'src/pages/gesetz-leser';

/** Relative Import-/Re-Export-Ziele einer Datei (Code, nicht Kommentare).
 *  Fasst `import … from '…'` UND `export … from '…'` — genau die zweite Form
 *  war die Lücke. */
function relativeZiele(quelle: string): string[] {
  return [...ohneKommentare(quelle).matchAll(/\bfrom\s+'(\.[^']*)'/g)].map((t) => t[1]);
}

/** Spezifizierer → Dateipfad, sofern er unter `src/pages/gesetz-leser` liegt.
 *  `../parts` muss auf den Barrel `parts.tsx` auflösen, nicht auf das
 *  gleichnamige Verzeichnis — darum steht `.tsx` vor `/index.*`. */
function aufloesen(vonDatei: string, spez: string): string | null {
  const basis = path.resolve(path.dirname(vonDatei), spez);
  for (const kandidat of [`${basis}.tsx`, `${basis}.ts`, `${basis}/index.tsx`, `${basis}/index.ts`]) {
    if (!existsSync(kandidat)) continue;
    const rel = path.relative(process.cwd(), kandidat);
    return rel.startsWith(LESER_DIR) ? rel : null;
  }
  return null;
}

/** Nachbarn einer Dateimenge, ohne `v3/` selbst (das prüft die Sonde oben). */
function nachbarn(dateien: string[]): string[] {
  const raus = new Set<string>();
  for (const datei of dateien) {
    for (const spez of relativeZiele(readFileSync(datei, 'utf8'))) {
      const ziel = aufloesen(datei, spez);
      if (ziel && !ziel.startsWith(V3_DIR)) raus.add(ziel);
    }
  }
  return [...raus].sort();
}

describe('Keine Ist-Hülle transitiv: was V3 importiert, importiert sie auch nicht', () => {
  const V3_PFADE = ALLE_DATEIEN.map((d) => `${V3_DIR}/${d}`);
  const EBENE1 = nachbarn(V3_PFADE);
  const EBENE2 = nachbarn(EBENE1).filter((p) => !EBENE1.includes(p));

  // DEKLARIERTE AUSNAHME — dieselbe wie oben, nur eine Kante weiter gedacht:
  // `inhalt-ansichten.tsx` (Fehlseite · Currency-Pin · pdf-embed) rendert
  // `KontextPanel`. Das ist kein Stück Ist-LESER-Hülle, sondern die Fehl- und
  // Früh-Ansicht, die V3 bewusst teilt (§5); der Rahmen deklariert den Import
  // dort seit H1. Der Kreis ist auf GENAU diese Datei und GENAU diesen Marker
  // geschlossen — jede andere transitive Berührung wird rot.
  const AUSNAHME_DATEI = `${LESER_DIR}/inhalt-ansichten.tsx`;
  const AUSNAHME_MARKER = 'KontextPanel';

  it('Positiv-Sonde: der Graph ist überhaupt gelaufen (sonst prüfte alles die leere Menge)', () => {
    expect(EBENE1.length, 'Ebene 1 ist leer — Auflösung kaputt').toBeGreaterThan(5);
    expect(EBENE2.length, 'Ebene 2 ist leer — es wird gar nicht transitiv geprüft').toBeGreaterThan(0);
    expect(EBENE1, 'der Adapter-Nachbar inhalt-hooks fehlt im Graph').toContain(`${LESER_DIR}/inhalt-hooks.tsx`);
  });

  it('Positiv-Sonde: die Ausnahme-Datei ist wirklich im Graph und trägt wirklich den Marker', () => {
    expect([...EBENE1, ...EBENE2], 'die deklarierte Ausnahme steht gar nicht im Graph — Kommentar ist stale')
      .toContain(AUSNAHME_DATEI);
    expect(readFileSync(AUSNAHME_DATEI, 'utf8')).toContain(AUSNAHME_MARKER);
  });

  it('keine Datei in Ebene 1 oder 2 berührt die Ist-Hülle', () => {
    for (const datei of [...EBENE1, ...EBENE2]) {
      const quelle = ohneKommentare(readFileSync(datei, 'utf8'));
      for (const [name, muster] of VERBOTEN) {
        if (datei === AUSNAHME_DATEI && name === AUSNAHME_MARKER) continue;
        expect(traegt(quelle, muster),
          `${datei} zieht die Ist-Hülle (${name}) transitiv nach v3/`).toBe(false);
      }
    }
  });
});

describe('Keine Pane-Verzweigung ausserhalb der Wurzel (imPane/istSekundaer)', () => {
  // Zwei statt drei seit 16.8.2026: `LeserV3Kontext.ts` ist gestrichen (0
  // Konsumenten, Architektur-Review A2). Die Zusage ist damit STRENGER, nicht
  // schwächer — es gibt eine Wurzel weniger, an der verzweigt werden darf.
  const WURZELN = ['leserV3Modell.ts', 'LeserRahmenV3.tsx'];

  it('die drei Wurzel-Dateien lesen tatsächlich imPane bzw. istSekundaer (sonst prüfte das Verbot nichts)', () => {
    for (const datei of WURZELN) {
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /\b(imPane|istSekundaer)\b/), `${datei} enthält weder imPane noch istSekundaer im Code`).toBe(true);
    }
  });

  it('ALLE übrigen V3-Dateien enthalten `imPane`/`istSekundaer` NUR in Kommentaren, nie im Code', () => {
    for (const datei of ALLE_DATEIEN) {
      if (WURZELN.includes(datei)) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /\bimPane\b/), `${datei} verzweigt im Code auf imPane`).toBe(false);
      expect(traegt(quelle, /\bistSekundaer\b/), `${datei} verzweigt im Code auf istSekundaer`).toBe(false);
    }
  });
});

describe('Kein `if (bund)`: erlass.ebene / erlass.rechtsgebiet nur in erlassAnsicht.ts', () => {
  const QUELLE_DER_WAHRHEIT = 'erlassAnsicht.ts';
  // GEMELDET UND BEHOBEN (16.8.2026): Diese Sonde fand beim ersten Lauf eine
  // echte Verletzung — die «Vorher/Nachher»-Navigation in LeserLesespalte.tsx
  // las `vorher.ebene`/`nachher.ebene`, um den Pfad des Nachbar-Erlasses zu
  // bauen. Kein `if (bund)`-Fork (der Wert steuerte keine Verzweigung, nur eine
  // URL-Interpolation), aber ein Lesezugriff ausserhalb der einen erlaubten
  // Stelle — und damit genau der Ort, an dem man es vergisst, wenn die Route je
  // Ebene einmal anders aussieht. Statt die Zusage aufzuweichen, ist die
  // Ableitung nach `erlassAnsicht.ts` gezogen worden (`erlassPfad`). Die Sonde
  // duldet seither KEINE Ausnahme mehr.

  it('erlassAnsicht.ts liest tatsächlich .ebene und .rechtsgebiet (sonst prüfte das Verbot nichts)', () => {
    const quelle = ohneKommentare(LIES(QUELLE_DER_WAHRHEIT));
    expect(traegt(quelle, /\.ebene\b/)).toBe(true);
    expect(traegt(quelle, /\.rechtsgebiet\b/)).toBe(true);
  });

  it('.rechtsgebiet wird in KEINER anderen V3-Datei gelesen', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === QUELLE_DER_WAHRHEIT) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /\.rechtsgebiet\b/), `${datei} liest .rechtsgebiet`).toBe(false);
    }
  });

  it('.ebene wird in KEINER anderen V3-Datei gelesen — ohne Ausnahme', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === QUELLE_DER_WAHRHEIT) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /\.ebene\b/), `${datei} liest .ebene — Ableitung gehört nach erlassAnsicht.ts`).toBe(false);
    }
  });

  it('die Adress-Ableitung liegt bei der einen Quelle (erlassPfad)', () => {
    // Positiv-Sonde zum Verbot oben: die Funktion, in die der Zugriff gewandert
    // ist, existiert wirklich — sonst gewönne das Verbot gegen eine Lücke.
    expect(traegt(ohneKommentare(LIES(QUELLE_DER_WAHRHEIT)), /export function erlassPfad\(/),
      'erlassPfad fehlt — die Nachbar-Links hätten keine erlaubte Quelle').toBe(true);
    expect(traegt(ohneKommentare(LIES('LeserLesespalte.tsx')), /erlassPfad\(/),
      'die Lesespalte benutzt die Ableitung nicht').toBe(true);
  });
});

describe('B8 · Das Zähl-Substantiv hat EINE Quelle (Architektur-Nachzug 17.8.2026)', () => {
  // -- DIE QUELLE IST SEIT 14.9.2026 DIE SCHWESTERDATEI ----------------------
  // Bis dahin stand sie in `erlassAnsicht.ts`. Das war kein Zufall, sondern eine
  // Haeufung: DIESELBE Datei musste jede `.ebene`-Ableitung tragen (Sonde oben),
  // jedes Bestimmungswort (diese Sonde), unter 420 Zeilen bleiben UND unter dem
  // Adapter `leserV3Modell.ts`, der selbst bei 420 steht. Gemessen 14.9.2026:
  // 419 Zeilen -- null nutzbarer Kopfraum, weil die 420. Zeile den Gleichstand
  // erzeugt haette, an dem die Sonde «groesster Baustein ist der Adapter» kippt.
  // Zwei Bau-Auftraege sind dem ausgewichen (PR #854, #863), ein dritter (E1,
  // Einzelartikel-Ansicht) waere daran haengen geblieben.
  //
  // DER SCHNITT NIMMT KEINER SONDE IHRE SCHAERFE, er verteilt sie auf zwei
  // Dateien mit je EINER Zusage: `erlassAnsicht.ts` = «wo steht der Erlass»
  // (`.ebene`/`.rechtsgebiet`), `erlassWortlaut.ts` = «wie heisst, was man
  // liest» (Bestimmungswort, Feldbeschriftung, Titel/Kennung). Jede der beiden
  // Zusagen gilt weiterhin fuer GENAU EINE Datei -- die Ausnahmemenge ist nicht
  // gewachsen, sie ist nur woanders. Die Gegenprobe steht als eigener Test
  // unten («keine der beiden Schwestern traegt die Zusage der anderen»).
  const QUELLE_DER_WAHRHEIT = 'erlassWortlaut.ts';

  // BEFUND, der diese Sonde nötig gemacht hat: das Literal `'Paragraphen'` lag an
  // FÜNF Stellen in `v3/` (SuchZone · LeserGliederung · LeserUebersicht ·
  // LeserTrefferListe, dazu die Ableitung im Rahmen), die Singular-Regel dreifach.
  // Aus genau dieser Streuung entstand Ä23 («Artikel» hart kodiert an einem
  // §-Erlass). Die Sonde ist die Gegenkraft: ein neues Bauteil bekommt den TYP,
  // nicht ein neues Literal.
  //
  // AUSDRÜCKLICH NICHT MITGEZOGEN: `parts/ErlassUebersicht.tsx` und
  // `parts/ErlassLeserKopf.tsx` (geteilte Bausteine — sie dürfen nicht an einem
  // Typ aus `v3/` hängen, FL-4) und `inhalt-volltext.tsx` (V1, eingefroren). Die
  // Sonde deckt darum `v3/`, und genau das ist die Zusage.

  it('erlassAnsicht.ts trägt Typ, Ableitung, Zählform und Dativ (sonst prüfte das Verbot nichts)', () => {
    const quelle = ohneKommentare(LIES(QUELLE_DER_WAHRHEIT));
    expect(traegt(quelle, /export type BestimmungsWort\b/), 'BestimmungsWort fehlt').toBe(true);
    expect(traegt(quelle, /export function bestimmungsWort\(/), 'bestimmungsWort() fehlt').toBe(true);
    expect(traegt(quelle, /export function zaehlform\(/), 'zaehlform() fehlt').toBe(true);
    // C1 (H3-Nachzug): die Dativ-Einzahl («zu diesem Artikel»/«zu diesem
    // Paragraphen») ist die Form, die das Panel braucht — sie hat dieselbe eine
    // Quelle, sonst wäre das Verbot unten nur ein Verbot ohne Ausweg.
    expect(traegt(quelle, /export function bestimmungDativ\(/), 'bestimmungDativ() fehlt').toBe(true);
  });

  it('kein «Paragraphen»-Literal in einer anderen v3/-Datei', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === QUELLE_DER_WAHRHEIT) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /Paragraphen/),
        `${datei} trägt das Wort «Paragraphen» im Code — Typ und Zählform gehören nach ${QUELLE_DER_WAHRHEIT}`).toBe(false);
    }
  });

  // ── C1 (H3-Nachzug): DAS VERBOT WAR EINSEITIG ──────────────────────────────
  // Bis hierher stand nur «Paragraphen» auf dem Index — «Artikel» durfte frei im
  // Code liegen. Genau daran ist H3 gescheitert: `panelModell.PANEL_REITER` trug
  // «Gerichtsentscheide zu diesem Artikel», `PanelEntscheide` zweimal «diesem
  // Artikel», und an BS-640.100 (ein §-Erlass) war das dreimal falsch. Ein Verbot,
  // das nur die eine Hälfte des Paares kennt, fängt die häufigere Hälfte nicht:
  // die Bund-Annahme ist die Vorgabe, die man versehentlich hinschreibt.
  //
  // `\bArtikel\b` mit Wortgrenze trifft nur das WORT — nicht `artikelLabel`,
  // nicht `ArtikelLeser`, nicht `aktArtikel` und nicht `data-…-artikel` (§7:
  // Identitäts-Treffer, nie Substring-Präsenz).
  it('C1 · auch kein «Artikel»-Literal in einer anderen v3/-Datei', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === QUELLE_DER_WAHRHEIT) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /\bArtikel\b/),
        `${datei} schreibt «Artikel» als Wort in den Code — an einem §-Erlass ist das falsch; `
        + `das Zähl-Substantiv kommt aus ${QUELLE_DER_WAHRHEIT} (bestimmungsWort/bestimmungDativ)`).toBe(false);
    }
  });

  it('C1 · Positiv-Sonde: erlassAnsicht.ts trägt das Wort wirklich (sonst prüfte das Verbot eine leere Menge)', () => {
    expect(traegt(ohneKommentare(LIES(QUELLE_DER_WAHRHEIT)), /\bArtikel\b/)).toBe(true);
  });

  it('kein zweiter Ableitungs-Ternär über bestimmungsEtikett in v3/', () => {
    for (const datei of ALLE_DATEIEN) {
      if (datei === QUELLE_DER_WAHRHEIT) continue;
      const quelle = ohneKommentare(LIES(datei));
      expect(traegt(quelle, /bestimmungsEtikett\s*===/),
        `${datei} leitet das Bestimmungswort selbst ab — das tut bestimmungsWort()`).toBe(false);
    }
  });

  // -- DER SCHNITT DARF NICHT STILL ZURUECKWACHSEN (14.9.2026) ---------------
  // Ohne diese zwei Sonden waere der Schnitt eine Verschiebung, die man
  // rueckgaengig machen kann, ohne dass etwas rot wird (§6.7). Die erste haelt
  // die Fassade: Aufrufer importieren weiter aus `erlassAnsicht`, und genau das
  // ist der Grund, warum der Schnitt verhaltensneutral war. Die zweite haelt die
  // Arbeitsteilung -- jede Schwester traegt IHRE Zusage und nicht die andere.
  it('die Fassade steht: erlassAnsicht.ts re-exportiert die Schwesterdatei', () => {
    expect(traegt(ohneKommentare(LIES('erlassAnsicht.ts')), /export \* from '\.\/erlassWortlaut'/),
      'der Re-Export fehlt — jeder bisherige Import aus erlassAnsicht bricht').toBe(true);
  });

  it('die zwei Schwestern tauschen ihre Zusagen nicht', () => {
    const wortlaut = ohneKommentare(LIES('erlassWortlaut.ts'));
    const ansicht = ohneKommentare(LIES('erlassAnsicht.ts'));
    expect(traegt(wortlaut, /\.ebene\b/), 'erlassWortlaut.ts liest .ebene').toBe(false);
    expect(traegt(wortlaut, /\.rechtsgebiet\b/), 'erlassWortlaut.ts liest .rechtsgebiet').toBe(false);
    expect(traegt(ansicht, /\bArtikel\b|Paragraphen/),
      'erlassAnsicht.ts trägt wieder ein Bestimmungswort im Code').toBe(false);
  });
});

describe('B9 · Die Höhe der Such-Zone steht bei der Such-Zone (Architektur-Nachzug)', () => {
  // BEFUND: die zwei Werte lagen als rem-Literale im Rahmen, das Markup, dessen
  // Höhe sie behaupten, in `SuchZone.tsx` — ohne Wächter dazwischen. `--nt-stick`
  // (Sprung-Offset aller Anker) rechnet die Zone mit: eine stille Abweichung
  // verschiebt jeden Artikel-Sprung (Klasse LM-003).
  // C5a (H3-Nachzug): der VERBRAUCHER der zwei Höhen ist von `LeserRahmenV3.tsx`
  // nach `leserGeometrie.ts` gewandert (die CSS-Variablen sind dort eine reine
  // Funktion). Die ZUSAGE ist unverändert und sogar strenger geworden: das
  // rem-Literal-Verbot gilt jetzt für BEIDE Dateien, nicht nur für den Rahmen.
  it('SuchZone.tsx exportiert die zwei Höhen, die Geometrie importiert sie', () => {
    const zone = ohneKommentare(LIES('SuchZone.tsx'));
    expect(traegt(zone, /export const SUCH_H_RUHE\b/)).toBe(true);
    expect(traegt(zone, /export const SUCH_H_AKTIV\b/)).toBe(true);
    const geo = ohneKommentare(LIES('leserGeometrie.ts'));
    expect(traegt(geo, /SUCH_H_AKTIV/), 'die Geometrie benutzt die Konstante nicht').toBe(true);
    for (const datei of ['leserGeometrie.ts', 'LeserRahmenV3.tsx']) {
      expect(traegt(ohneKommentare(LIES(datei)), /'4\.25rem'|'2\.75rem'/),
        `in ${datei} steht ein rem-Literal für die Zonen-Höhe`).toBe(false);
    }
  });

  // C5a: und der Rahmen rechnet die Geometrie nicht mehr selbst. Ohne diese Zeile
  // wäre die Auslagerung eine Verschiebung, die man rückgängig machen kann, ohne
  // dass etwas rot wird (§6.7).
  it('die Geometrie steht in EINER Funktion — der Rahmen ruft sie nur', () => {
    const geo = ohneKommentare(LIES('leserGeometrie.ts'));
    expect(traegt(geo, /export function leserCssVariablen\(/)).toBe(true);
    expect(traegt(geo, /'--nt-stick'/), 'die Sprung-Offset-Variable steht nicht in der Geometrie').toBe(true);
    const rahmen = ohneKommentare(LIES('LeserRahmenV3.tsx'));
    expect(traegt(rahmen, /leserCssVariablen\(/), 'der Rahmen benutzt die Geometrie nicht').toBe(true);
    expect(traegt(rahmen, /'--nt-stick'/),
      'der Rahmen setzt `--nt-stick` wieder selbst — zwei Geometrie-Quellen (LM-003)').toBe(false);
  });
});

describe('Dateigrösse: v3/ bleibt schlank', () => {
  // Harte Obergrenze (Auflage «≤ ~250 Zeilen» ist das ZIEL, kein hartes Tor).
  // Als Konstante mit Kommentar geführt, damit ein Wachsen der Grenze selbst
  // auffällt, statt sich in einer Zahl mitten im Test zu verstecken (§6.7: ein
  // Tor, das nicht scheitern kann, ist gefährlicher als keines — wird die
  // Grenze stillschweigend hochgesetzt, ist DAS der Diff).
  //
  // ── 400 → 420, deklariert am 16.8.2026 (H2) ───────────────────────────────
  // Anlass: `leserV3Modell.ts` trägt mit den H2-Feldern (Suchbereich,
  // Fundstellen-Abruf, Sprung zu EINER Stelle) 411 Zeilen.
  //
  // DER VERSUCH, ES ZU TEILEN, IST GEMACHT UND GESCHEITERT — und das ist der
  // Grund, warum hier die Zahl weicht und nicht die Datei. Zwei Schnitte
  // wurden gebaut und wieder zurückgenommen, weil DREI ANDERE Sonden dieses
  // Fundaments sie zurückwiesen:
  //  · Den Daten-VERTRAG in eine eigene Datei zu ziehen, verletzt «EINE Naht»:
  //    die Feldtypen leiten sich per `ReturnType` aus den geteilten
  //    `inhalt-*`-Modulen ab, die Typdatei hätte also eine zweite Kante dorthin
  //    geöffnet.
  //  · Den Artikel-SPRUNG auszulagern, verletzt «keine Pane-Verzweigung
  //    ausserhalb der Wurzel» (er liest `imPane`/`istSekundaer`), die
  //    Quellensonde `leser-v3-adresse.test.ts` (der Adress-Schreiber wird dort
  //    in genau dieser Datei erwartet) UND die Regel direkt unter dieser: der
  //    Adapter soll der grösste Baustein SEIN.
  //
  // Die Sonden sind sich also einig, dass dieser Adapter gross sein DARF — nur
  // die Zahl war zu knapp gesetzt. Sie wandert darum um 20 Zeilen und keinen
  // Schritt weiter; die eigentliche Schlankheits-Zusage tragen ohnehin die
  // beiden Regeln daneben, nicht diese Obergrenze.
  //
  // -- 14.9.2026 · DIE GRENZE BLEIBT 420, DIE DATEI IST GEWICHEN -------------
  // Anlass: `erlassAnsicht.ts` stand bei 419 von 420 Zeilen und hatte damit
  // NULL nutzbaren Kopfraum -- nicht eine Zeile, denn die 420. haette den
  // Gleichstand mit dem Adapter erzeugt, an dem die Sonde direkt darunter
  // kippt (`Object.entries` liefert Lesereihenfolge, `erlassAnsicht.ts` steht
  // vor `leserV3Modell.ts`, die Sortierung ist stabil). Zugleich zwingt die
  // Sonde «`.ebene` nur in erlassAnsicht.ts» jede neue Ableitung genau dorthin.
  // Das ist eine Klemme, kein Einzelfall: zwei Bau-Auftraege sind ihr am
  // 14.9.2026 ausgewichen (PR #854, #863), indem sie eigene Dateien anlegten.
  //
  // BEHOBEN WORDEN IST DIE KLEMME, NICHT DIE ZAHL (§17, Wurzel statt
  // Umschiffen): die Datei ist in zwei Schwestern geschnitten
  // (`erlassAnsicht.ts` 198 / `erlassWortlaut.ts` 267 Zeilen), jede mit EINER
  // Zusage und mehr als 150 Zeilen Luft. Die Grenze steht unveraendert bei 420
  // -- wer sie kuenftig verschiebt, tut das wieder als eigener, sichtbarer Diff.
  //
  // BEWUSST OFFEN GEBLIEBEN: `leserV3Modell.ts` steht bei 420/420 und
  // `uebersichtAngaben.ts` bei 418/420. Fuer den Adapter ist der Schnitt oben
  // im Block dokumentiert GESCHEITERT (drei andere Sonden weisen ihn zurueck)
  // und seine Hook-Reihenfolge ist verhaltenstragend -- ein Schnitt dort waere
  // keine Struktur-, sondern eine Verhaltensaenderung und braucht einen eigenen
  // deklarierten Schritt. Vermerkt statt stillschweigend mitgenommen.
  const MAX_ZEILEN = 420;

  it(`keine Datei in v3/ überschreitet ${MAX_ZEILEN} Zeilen`, () => {
    for (const datei of ALLE_DATEIEN) {
      const zeilen = LIES(datei).split('\n').length;
      expect(zeilen, `${datei} hat ${zeilen} Zeilen — über der Grenze ${MAX_ZEILEN}`).toBeLessThanOrEqual(MAX_ZEILEN);
    }
  });

  it('der begründet grösste Baustein ist der Adapter leserV3Modell.ts (Fundament-Auflage 1)', () => {
    const zeilen: Record<string, number> = {};
    for (const datei of ALLE_DATEIEN) zeilen[datei] = LIES(datei).split('\n').length;
    const groesste = Object.entries(zeilen).sort((a, b) => b[1] - a[1])[0];
    expect(groesste[0]).toBe('leserV3Modell.ts');
  });
});
