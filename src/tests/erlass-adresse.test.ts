// ─── Tor: Erlass-Adresse (Cowork-Befund 45, Entscheid David 29.8.2026) ──────
//
// Bewacht drei Zusagen des Umzugs «Staatsverträge unter eigener Adresse»:
//
//   A  Die Adress-Ableitung ist EINE (§5) — kein zweiter Pfad-Formatierer im
//      Produktivcode. Das ist die Sonde gegen den Rückfall: der Befund entstand
//      NICHT dadurch, dass jemand die Regel falsch schrieb, sondern dadurch,
//      dass zwanzig Stellen sie je selbst schrieben und sieben davon `bund`
//      fest verdrahteten.
//   B  Die Annahme hinter `datenEbeneVonRoute` gilt: jeder Erlass mit
//      Routen-Ebene 'international' hat Daten-Ebene 'bund'. Käme je ein
//      kantonaler Staatsvertrag ins Register, wird DIESE Zeile rot, statt dass
//      der Leser still ein 404-Sidecar lädt und ohne Gliederung dasteht.
//   C  Die Weiterleitung der Alt-Adresse ist beidseitig richtig: Alt → Neu
//      springt, Neu und alles Übrige springen NICHT (eine Weiterleitung, die
//      auch auf der Zieladresse feuert, ist eine Endlosschleife).


// GRENZEN dieser Sonden (3. Prüf-Durchgang 29.8.2026, M9/M11/M12 — deklariert,
// nicht behoben): (a) src/tests|fixtures werden übersprungen — Rückfälle dort
// sind unsichtbar; (b) nur .ts/.tsx in vier Wurzeln — ausführbare .mjs-Mess-
// skripte (docs/ux-audit) messen weiter am Stub; (c) namensbasierte Zugriffs-
// Sonden fangen Optional-Chaining/Zwischenvariable/Import-Alias prinzipiell
// nicht. Wer die Klasse dort dicht braucht: Scan-Wurzeln/Endungen erweitern.

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  datenEbeneVonRoute,
  erlassAltPfad,
  erlassPfad,
  erlassPfadVonKey,
  routenEbene,
  kanonisierePfad,
  routenEbeneVonKey,
} from '../lib/normtext/erlassAdresse';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import { appDateien, ohneKommentare } from './appDateien';
import { umzugsZiel } from '../pages/gesetz-leser/adressUmzug';

const SRC = resolve(fileURLToPath(import.meta.url), '..', '..');

// ── A · Eine Ableitung ──────────────────────────────────────────────────────

/** Zeilen- und Blockkommentare entfernen, damit Herleitungs-PROSA (die die
 *  Alt-Form zwangsläufig zitiert) nicht als Verstoss zählt. Strings bleiben
 *  stehen — genau sie sollen gefunden werden.
 *
 *  R5-A (5.9.2026) · begruendete Ausnahme von `appDateien.ts`: dieser Waechter
 *  sucht nach ADRESSEN, also nach Zeichenketten mit `//` darin. Das geteilte
 *  Sieb streicht jede Zeile ab `//` und wuerde damit genau die gesuchten
 *  URL-Formen unsichtbar machen; das Sieb hier schuetzt `://` ausdruecklich
 *  (`(^|[^:])//`). Gleiche Absicht, notwendig anderes Sieb — keine Dublette.
 *
 *  Ergaenzung (W2·19 Kleinaufraeumen 30.9.2026): das Sieb selbst ist seither das
 *  geteilte `ohneKommentare` aus `appDateien.ts` — es streicht nur ganze
 *  Kommentarzeilen und laesst `://` in Code-Zeilen stehen (alle Tests dieser
 *  Datei unveraendert gruen). Was oben als Ausnahme gefuehrt wird, betrifft nur
 *  noch die eigene Verzeichnis-Wanderung `dateien()`.
 *
 *  Ergaenzung 2 (W2·19 Kleinaufraeumen 2, 30.9.2026): auch `dateien()` ist
 *  seither der geteilte Sweep `appDateien(['.ts', '.tsx'], wurzel)` — gemessen
 *  dieselbe Dateimenge wie die alte eigene Wanderung (src 820, scripts 424,
 *  e2e 207, abnahme 1; Mengenvergleich, kein `node_modules` unter den Wurzeln).
 *  Damit ruft diese Datei kein `readdirSync` mehr, und die Sweep-Ausnahme in
 *  `design-r5-konsistenz` (R5-A) ist entfallen; der Begruendungssatz oben bleibt
 *  stehen (Belege altern nicht). */
const dateien = (wurzel: string): string[] => appDateien(['.ts', '.tsx'], wurzel);

// Die eine erlaubte Stelle. Alles andere ruft sie.
const QUELLE = 'src/lib/normtext/erlassAdresse.ts';

// ── Die verbotenen Formen ───────────────────────────────────────────────────
//
// GESCHÄRFT NACH DER GEGENPRÜFUNG (29.8.2026, Mangel 4). Die erste Fassung sah
// nur `src/` und verlangte ein Anführungszeichen unmittelbar vor dem Pfad. Sie
// liess damit drei reale Rückfälle durch, darunter den, der zählt:
//
//     erlassPfadRoh(e.ebene, e.key)     ← Befund 45, exakt reproduziert
//
// Diese Zeile ruft brav die eine Quelle und verdrahtet trotzdem die DATEN-Ebene
// in die Adresse — die Sonde muss also nicht nur fragen, WER den Pfad baut,
// sondern WOMIT. Ebenfalls ergänzt: String-Verkettung und Pfade mit einem
// Präfix davor (`${SITE_URL}/gesetze/bund/${…}`).
//
// NICHT verboten ist eine VOLLSTÄNDIG feste Adresse wie `/gesetze/bund/OR`:
// die steht in Messskripten (`perf/lighthouse-budget.ts`, `messung-cwv.ts`) als
// fester Messpunkt, nicht als Ableitung. Verboten ist erst der Moment, in dem
// ein Schlüssel oder eine Ebene VARIABEL in den Pfad wandert.
// ZWEITER DURCHGANG (Gegenprüfung 29.8.2026): die geschärfte Fassung war immer
// noch durchlässig, und zwar an beiden Stellen, an denen es darauf ankam —
// `'/gesetze/bund/' + key` (die häufigere Verkettung) und der Aufruf mit einem
// blossen Bezeichner `ebene` nach Destrukturierung. Zusätzlich war die neue
// Fassade `basisAdresse` gar nicht genannt. Die Wurzel dahinter ist ein
// NAMENSPROBLEM: Routen-Segment und Register-Feld hiessen beide `ebene`. Die
// Parameter heissen jetzt `routenSegment`; damit lässt sich alles verbieten,
// was `ebene` heisst, ohne einen richtigen Aufruf zu treffen.

/** Die beiden Fassaden, die ein rohes Routen-Segment entgegennehmen. */
const FASSADEN = '(?:erlassPfadRoh|basisAdresse)';
/** Drei Zugriffsformen auf ein Feld namens `ebene`: Punkt, Klammer, Bezeichner. */
const EBENE_ARGUMENT = String.raw`(?:[\w$]+\s*\.\s*ebene\b|[\w$]+\s*\[\s*['"]ebene['"]\s*\]|ebene\s*[,)])`;

const VERBOTEN: { name: string; re: RegExp }[] = [
  { name: 'Template mit variabler Ebene', re: /`[^`]*\/gesetze\/\$\{/ },
  { name: 'Template mit variablem Schlüssel', re: /`[^`]*\/gesetze\/(bund|kanton|international)\/\$\{/ },
  { name: 'String-Verkettung', re: /['"]\/gesetze\/(?:bund\/|kanton\/|international\/)?['"]\s*\+/ },
  { name: 'Daten-Ebene in die Adresse gereicht', re: new RegExp(`${FASSADEN}\\(\\s*${EBENE_ARGUMENT}`) },
];

// ── Feste Adressen im Repo müssen kanonisch sein ────────────────────────────
//
// Die Ausnahme oben («vollständig feste Adresse = fester Messpunkt») hatte ein
// Loch, das die Gegenprüfung fand (29.8.2026, 2. Durchgang, Mangel 3): sie kann
// `/gesetze/bund/OR` (richtig) nicht von `/gesetze/bund/EMRK` (umgezogen)
// unterscheiden. `abnahme/responsive-audit/sweep.ts` mass darum an zwei
// Alt-Adressen — stumm falsch, weil die Seite ja erscheint; gemessen wurde die
// Weiterleitung. Dieselbe Falle traf acht e2e-Specs.
//
// Statt die Instanzen einzeln zu putzen, prüft das hier die KLASSE: jede feste
// Erlass-Adresse im Repo muss die sein, die das Register vorsieht.
// Eine Datei, die Alt-Adressen BRAUCHT — die Weiterleitungs-Specs — sagt es
// einmal in ihrem Kopf. Dateiweit und nicht je Zeile, weil die Adresse dort
// auch in Testnamen und Konstanten steht; eine Zeilen-Marke müsste in einen
// Testnamen hinein und wäre dort Lärm.
const ABSICHT = 'alt-adresse:absicht';

describe('feste Erlass-Adressen im Repo sind kanonisch', () => {
  it('keine Alt-Adresse in Code, Skripten, Messpunkten oder e2e', () => {
    const wurzeln = ['src', 'scripts', 'e2e', 'abnahme'].map((d) => join(SRC, '..', d));
    const kanonisch = new Map(ERLASS_REGISTER.map((e) => [e.key, routenEbene(e)] as const));
    const muster = /\/gesetze\/(bund|kanton|international)\/([A-Za-z0-9_.%-]+)/g;
    const sünder: string[] = [];
    for (const wurzel of wurzeln) {
      for (const p of dateien(wurzel)) {
        const rel = relative(join(SRC, '..'), p).replaceAll('\\', '/');
        const roh = readFileSync(p, 'utf8');
        if (roh.slice(0, 600).includes(ABSICHT)) continue;  // M10: Marke zählt nur im Datei-KOPF (erste 600 Zeichen) — ein Code-String weiter unten legt die Sonde nicht mehr still
        for (const zeile of ohneKommentare(roh).split('\n')) {
          for (const m of zeile.matchAll(muster)) {
            let key: string;
            try { key = decodeURIComponent(m[2]); } catch { continue; }
            const soll = kanonisch.get(key);
            if (soll && soll !== m[1]) sünder.push(`${rel}: ${m[0]} → /gesetze/${soll}/${key}`);
          }
        }
      }
    }
    expect(sünder, `feste Adressen zeigen auf die Alt-Form (Weiterleitung wird mitgemessen)`).toEqual([]);
  });
});

describe('§5 — die Erlass-Adresse hat EINE Quelle', () => {
  it('kein zweiter Pfad-Formatierer in src/ und scripts/', () => {
    const wurzeln = [SRC, join(SRC, '..', 'scripts')];
    const sünder: string[] = [];
    for (const wurzel of wurzeln) {
      for (const p of dateien(wurzel)) {
        const rel = relative(join(SRC, '..'), p).replaceAll('\\', '/');
        if (rel === QUELLE) continue;
        const code = ohneKommentare(readFileSync(p, 'utf8'));
        for (const { name, re } of VERBOTEN) if (re.test(code)) sünder.push(`${rel} — ${name}`);
      }
    }
    expect(sünder, `bauen die Erlass-Adresse selbst statt über ${QUELLE}`).toEqual([]);
  });

  it('die Sonde fängt jede der belegten Rückfall-Formen (Selbsttest)', () => {
    // Ohne diesen Fall wäre die Sonde eine Behauptung: sie kann grün sein, WEIL
    // sie nichts sieht. Hier steht, was sie sehen MUSS — die vier Formen, die
    // die Gegenprüfung als real durchgelassen belegt hat.
    const rückfälle = [
      'const a = `/gesetze/${e.ebene}/${e.key}`;',
      'const b = `/gesetze/bund/${key}`;',
      "const c = '/gesetze/' + e.ebene + '/' + encodeURIComponent(e.key);",
      'const d = `${SITE_URL}/gesetze/bund/${e.key}`;',
      'const f = erlassPfadRoh(e.ebene, e.key);',
      // Zweiter Durchgang der Gegenprüfung — diese fünf liefen vorher durch:
      "const g = '/gesetze/bund/' + encodeURIComponent(e.key);",
      'const h = "/gesetze/bund/" + key;',
      'const i = erlassPfadRoh(ebene, key);',
      "const j = erlassPfadRoh(e['ebene'], e.key);",
      'const k = basisAdresse(e.ebene, e.key);',
    ];
    for (const zeile of rückfälle) {
      expect(VERBOTEN.some(({ re }) => re.test(zeile)), `nicht gefangen: ${zeile}`).toBe(true);
    }
    // Gegenprobe: das Erlaubte darf NICHT anschlagen, sonst ist die Sonde ein
    // Hindernis statt eines Wächters.
    const erlaubt = [
      "{ pfad: '/gesetze/bund/OR', label: 'fester Messpunkt' },",
      'const a = erlassPfad(e);',
      'const b = erlassPfadVonKey(e.key, e.ebene);',
      'const c = erlassPfadRoh(routenSegment, schluessel);',
      'const d = basisAdresse(routenSegment, schluessel);',
      'const e2 = erlassPfadRoh(kanonisch, t.key);',
      // Das Register-Feld selbst lesen bleibt erlaubt — verboten ist nur, es in
      // eine ADRESSE zu reichen.
      "const f = e.ebene === 'bund' ? x : y;",
    ];
    for (const zeile of erlaubt) {
      expect(VERBOTEN.some(({ re }) => re.test(zeile)), `falsch gefangen: ${zeile}`).toBe(false);
    }
  });
});

// ── B · Routen-Ebene vs. Daten-Ebene ────────────────────────────────────────

describe('Routen-Ebene und Daten-Ebene', () => {
  const international = ERLASS_REGISTER.filter((e) => e.rechtsgebiet === 'international');

  it('das Register führt überhaupt Staatsverträge (sonst prüft alles darunter nichts)', () => {
    expect(international.length).toBeGreaterThan(30);
  });

  it('jeder Staatsvertrag trägt die Daten-Ebene bund — die Annahme von datenEbeneVonRoute', () => {
    const abweichend = international.filter((e) => e.ebene !== 'bund').map((e) => `${e.key} (${e.ebene})`);
    expect(
      abweichend,
      'Staatsvertrag mit anderer Daten-Ebene: datenEbeneVonRoute() lädt für ihn die falsche Datei',
    ).toEqual([]);
  });

  it('routenEbene: international schlägt die Ebene, sonst gilt die Ebene', () => {
    expect(routenEbene({ ebene: 'bund', rechtsgebiet: 'international' })).toBe('international');
    expect(routenEbene({ ebene: 'bund', rechtsgebiet: 'privat' })).toBe('bund');
    expect(routenEbene({ ebene: 'kanton', rechtsgebiet: 'privat' })).toBe('kanton');
  });

  it('datenEbeneVonRoute übersetzt nur die Adress-Ebene international', () => {
    expect(datenEbeneVonRoute('international')).toBe('bund');
    expect(datenEbeneVonRoute('bund')).toBe('bund');
    expect(datenEbeneVonRoute('kanton')).toBe('kanton');
  });

  it('erlassPfad setzt Staatsverträge unter /gesetze/international/', () => {
    expect(erlassPfad({ ebene: 'bund', rechtsgebiet: 'international', key: 'CISG' }))
      .toBe('/gesetze/international/CISG');
    expect(erlassPfad({ ebene: 'bund', rechtsgebiet: 'privat', key: 'OR' })).toBe('/gesetze/bund/OR');
  });

  it('die Schlüssel-Variante kommt ohne Erlass-Objekt zum selben Ergebnis', () => {
    for (const e of ERLASS_REGISTER) {
      expect(erlassPfadVonKey(e.key, e.ebene), `Schlüssel-Variante weicht ab für ${e.key}`)
        .toBe(erlassPfad(e));
    }
  });

  it('routenEbeneVonKey belässt unbekannte Schlüssel bei der übergebenen Ebene', () => {
    expect(routenEbeneVonKey('GIBTSNICHT', 'bund')).toBe('bund');
    expect(routenEbeneVonKey('GIBTSNICHT', 'kanton')).toBe('kanton');
  });

  it('das REGISTER entscheidet, nicht der Aufrufer (Gegenprüfung, Mangel 1)', () => {
    // Vorher war der zweite Parameter der Fallback für ALLE Keys — damit gab es
    // für jeden Bundeserlass eine zweite, voll funktionierende Adresse unter
    // /gesetze/international/, deren Brotkrume «Bund» sagte. Befund 45 im
    // Spiegelbild. Ein bekannter Schlüssel hat genau EINE Adresse.
    expect(routenEbeneVonKey('OR', 'international')).toBe('bund');
    expect(routenEbeneVonKey('OR', 'kanton')).toBe('bund');
    expect(routenEbeneVonKey('CISG', 'bund')).toBe('international');
    expect(routenEbeneVonKey('CISG', 'kanton')).toBe('international');
  });

  it('jeder Register-Erlass hat GENAU EINE Adresse — jede andere Ebene leitet', () => {
    for (const e of ERLASS_REGISTER) {
      for (const falsch of ['bund', 'kanton', 'international']) {
        if (falsch === routenEbene(e)) continue;
        expect(umzugsZiel(falsch, e.key), `${falsch}/${e.key} bleibt als Zweitadresse stehen`)
          .toBe(erlassPfad(e));
      }
    }
  });
});

// ── Gespeicherte Adressen (Reiter, Panes) ───────────────────────────────────

describe('kanonisierePfad — gespeicherte Alt-Adressen ziehen nach', () => {
  it('zieht die Erlass-Adresse nach und lässt Query und Anker stehen', () => {
    expect(kanonisierePfad('/gesetze/bund/CISG')).toBe('/gesetze/international/CISG');
    expect(kanonisierePfad('/gesetze/bund/CISG#art-35')).toBe('/gesetze/international/CISG#art-35');
    expect(kanonisierePfad('/gesetze/bund/CISG?r=2#art-35')).toBe('/gesetze/international/CISG?r=2#art-35');
  });

  it('lässt kanonische und fremde Pfade unverändert (byte-gleich)', () => {
    for (const p of [
      '/gesetze/international/CISG',
      '/gesetze/bund/OR#art-257_d',
      '/gesetze/kanton/BS-BeE%20786.100',
      '/rechtsprechung/bge-150-III-1',
      '/rechner/verjaehrung',
      '/',
      '',
    ]) {
      expect(kanonisierePfad(p), `unnötig verändert: ${p}`).toBe(p);
    }
  });

  it('ist idempotent — zweimal angewandt ändert nichts mehr', () => {
    const einmal = kanonisierePfad('/gesetze/bund/CISG#art-35');
    expect(kanonisierePfad(einmal)).toBe(einmal);
  });
});

// ── C · Weiterleitung der Alt-Adresse ───────────────────────────────────────

describe('Umzug der Alt-Adresse', () => {
  it('erlassAltPfad nennt die Alt-Form nur für Umgezogene', () => {
    expect(erlassAltPfad({ ebene: 'bund', rechtsgebiet: 'international', key: 'CISG' }))
      .toBe('/gesetze/bund/CISG');
    expect(erlassAltPfad({ ebene: 'bund', rechtsgebiet: 'privat', key: 'OR' })).toBeNull();
  });

  it('umzugsZiel führt die Alt-Adresse auf die kanonische', () => {
    expect(umzugsZiel('bund', 'CISG')).toBe('/gesetze/international/CISG');
    expect(umzugsZiel('bund', 'EMRK')).toBe('/gesetze/international/EMRK');
  });

  it('umzugsZiel feuert NICHT auf der Zieladresse (keine Schleife)', () => {
    expect(umzugsZiel('international', 'CISG')).toBeNull();
  });

  it('umzugsZiel lässt Nicht-Umgezogene und Unbekannte in Ruhe', () => {
    expect(umzugsZiel('bund', 'OR')).toBeNull();
    expect(umzugsZiel('kanton', 'BS-BeE 786.100')).toBeNull();
    expect(umzugsZiel('bund', 'GIBTSNICHT')).toBeNull();
    expect(umzugsZiel('bund', '')).toBeNull();
  });

  it('jeder Staatsvertrag hat genau EINE Alt-Adresse, die auf seine neue führt', () => {
    for (const e of ERLASS_REGISTER.filter((x) => x.rechtsgebiet === 'international')) {
      expect(umzugsZiel('bund', e.key), `Alt-Adresse von ${e.key} leitet nicht`).toBe(erlassPfad(e));
    }
  });
});
