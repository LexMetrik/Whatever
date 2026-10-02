/**
 * W2·7-BEZUG/B5 — der Zeitstrahl: Zahlen-Beleg und Markup.
 *
 * Zwei Dinge sind hier prüfenswert, und nur hier prüfbar:
 *
 *  (1) DIE VERTEILUNG STIMMT. Ein Histogramm ist eine Behauptung über den
 *      Bestand. Stimmt seine Summe nicht mit den Kanten überein, die die
 *      Auflistung unter den Artikeln zeigt, zieht der Nutzer an einer Grafik,
 *      die etwas anderes zählt als das, was er filtert (§5: keine zweite
 *      Zahl-Wahrheit; §8: keine Verteilung behaupten, die die Daten nicht
 *      tragen). Der Beleg läuft gegen die AUSGELIEFERTEN Shards, nicht gegen
 *      eine Attrappe — eine Attrappe könnte nur zeigen, dass die Funktion
 *      addieren kann.
 *
 *  (2) DAS MARKUP SAGT, WAS DER ZUSTAND IST. Aktiver Bereich sichtbar, leere
 *      Verteilung ehrlich benannt statt als leere Grafik gezeigt, Datumsfelder
 *      als echte Eingabe vorhanden (WCAG 2.1.1: die Zieh-Geste ist Abkürzung,
 *      nie einziger Weg).
 *
 * Die ZIEH-GESTE selbst braucht echte Pointer-Events und steht darum im e2e
 * (`e2e/bezuege-zeitstrahl-b5.e2e.ts`); ihre Rechnung (`bereichAusJahren`) ist
 * rein und in `bezug-zeit.test.ts` abgedeckt.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { renderToString } from 'react-dom/server';
import { BezugZeitWahl } from '../components/verzahnung/BezugZeitWahl';
import { histogrammAusShard } from '../pages/gesetz-leser/bezuegeLaden';
import { OFFENER_BEREICH, baueJahresHistogramm } from '../pages/gesetz-leser/bezugZeit';
import { waehleBezuege } from '../pages/gesetz-leser/bezugAuswahl';
import { bezuegeFuerArtikel, type BezugsShard } from '../lib/rechtsprechung/bezuege';
import { BEDIENBARE_KLASSEN } from '../pages/gesetz-leser/bezugAuswahl';
import type { BezugStatus } from '../lib/verzahnung/facetten';

const SHARD_ORDNER = 'public/rechtsprechung/bezuege';

/**
 * Verzeichnis-Inhalt EINMAL lesen — als Menge exakter Dateinamen.
 *
 * BEFUND 28.7.2026 (CI rot, lokal grün): der Test lud `bezuege/StPO.json`,
 * die Datei heisst aber `STPO.json` (Register-key, gross). Auf dem macOS-
 * Dateisystem ist der Pfad unempfindlich gegen Gross-/Kleinschreibung, auf dem
 * Linux-Runner nicht — der Fehler war lokal unsichtbar und riss erst die CI.
 *
 * Der Abgleich unten ist darum ein IDENTITÄTS-Vergleich gegen diese Menge und
 * kein `readFileSync`-Versuch: nur so scheitert die falsche Schreibung auch
 * dort, wo das Dateisystem sie durchgehen liesse. Ein Test, der lokal nicht
 * scheitern kann, ist kein Test (§6.7) — er verschiebt den Fehlschlag bloss in
 * die CI.
 */
const SHARD_DATEIEN: ReadonlySet<string> = new Set(readdirSync(SHARD_ORDNER));

function shard(key: string): BezugsShard {
  const datei = `${key}.json`;
  // Identität, nicht Insensitiv-Treffer: `SHARD_DATEIEN.has` vergleicht Bytes.
  if (!SHARD_DATEIEN.has(datei)) {
    const nah = [...SHARD_DATEIEN].filter((d) => d.toLowerCase() === datei.toLowerCase());
    throw new Error(
      `Shard «${datei}» gibt es in ${SHARD_ORDNER} nicht.`
      + (nah.length > 0 ? ` Gemeint ist wohl «${nah.join('», «')}» — Register-keys sind GROSS.` : ''),
    );
  }
  return JSON.parse(readFileSync(`${SHARD_ORDNER}/${datei}`, 'utf8')) as BezugsShard;
}

/** Kanten des Shards unabhängig von der Prüflingsfunktion nachzählen — sonst
 *  bewiese der Test bloss, dass dieselbe Schleife zweimal dasselbe liefert. */
function kantenZaehlen(s: BezugsShard, filter?: (st: BezugStatus) => boolean): number {
  let n = 0;
  for (const eintraege of Object.values(s.proArtikel)) {
    for (const e of eintraege) {
      const kopf = s.dokumente[e.key];
      if (!kopf) continue;
      if (filter && !filter(kopf.facetten.status)) continue;
      n += 1;
    }
  }
  return n;
}

describe('B5 · Summen-Identität gegen die ausgelieferten Shards', () => {
  // Drei Erlasse mit unterschiedlichem Zuschnitt: OR (BGE-lastig), StPO (der
  // grösste, alle vier Klassen), ZPO (ohne übrige BGer-Kante). Die keys sind die
  // Register-keys und darum GROSS geschrieben — `shard()` erzwingt das.
  for (const key of ['OR', 'STPO', 'ZPO']) {
    it(`${key}: Balken + ohneJahr = Zahl der Kanten (alle Klassen)`, () => {
      const s = shard(key);
      const h = histogrammAusShard(s, BEDIENBARE_KLASSEN, []);
      const summe = h.balken.reduce((a, b) => a + b.anzahl, 0);
      expect(summe + h.ohneJahr).toBe(kantenZaehlen(s));
      expect(summe).toBeGreaterThan(0);
    });

    it(`${key}: die Facetten wirken auf den Strahl wie auf die Auflistung`, () => {
      const s = shard(key);
      const h = histogrammAusShard(s, ['bge'], []);
      const summe = h.balken.reduce((a, b) => a + b.anzahl, 0);
      expect(summe + h.ohneJahr).toBe(kantenZaehlen(s, (st) => st === 'bge'));
    });
  }

  it('keine Klasse gewählt ⇒ leerer Strahl (nichts eingeschaltet, nichts gezeigt)', () => {
    const h = histogrammAusShard(shard('OR'), [], []);
    expect(h.balken).toEqual([]);
    expect(h.ohneJahr).toBe(0);
  });

  it('die Balken decken genau die belegten Jahre lückenlos ab (OR)', () => {
    const h = histogrammAusShard(shard('OR'), BEDIENBARE_KLASSEN, []);
    const jahre = h.balken.map((b) => b.jahr);
    expect(jahre).toEqual([...jahre].sort((a, b) => a - b));
    expect(jahre[jahre.length - 1] - jahre[0] + 1).toBe(jahre.length);
  });

  it('Strahl und Auflistung zählen DIESELBE Einheit — die Kante, nicht das Dokument', () => {
    // Gegenprobe zur naheliegenden Verwechslung: der Shard hat deutlich weniger
    // Dokumente als Kanten (ein Entscheid legt mehrere Artikel aus). Zählte der
    // Strahl Dokumente, stünde unter den Artikeln in Summe mehr, als er zeigt.
    const s = shard('OR');
    const h = histogrammAusShard(s, BEDIENBARE_KLASSEN, []);
    const summe = h.balken.reduce((a, b) => a + b.anzahl, 0) + h.ohneJahr;
    expect(summe).toBeGreaterThan(Object.keys(s.dokumente).length);

    // Und artikelweise aufaddiert kommt dieselbe Zahl heraus wie über die
    // Auswahl, die die Auflistung benutzt.
    let ueberAuswahl = 0;
    for (const token of Object.keys(s.proArtikel)) {
      ueberAuswahl += waehleBezuege(bezuegeFuerArtikel(s, token), BEDIENBARE_KLASSEN, []).length;
    }
    expect(ueberAuswahl).toBe(summe);
  });
});

describe('B5 · Markup der Zeit-Steuerung', () => {
  const h = baueJahresHistogramm([
    '2018-01-01', '2019-05-05', '2019-06-06', '2021-02-02', '2021-03-03', '2021-04-04',
  ]);

  it('rendert einen Balken je Jahr — lückenlos, auch für das leere 2020', () => {
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={h} onBereich={() => {}} />);
    for (const j of [2018, 2019, 2020, 2021]) expect(s).toContain(`data-zeitstrahl-jahr="${j}"`);
    expect(s).not.toContain('data-zeitstrahl-jahr="2017"');
    expect(s).not.toContain('data-zeitstrahl-jahr="2022"');
  });

  it('nennt die Randjahre als Achsen-Beschriftung', () => {
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={h} onBereich={() => {}} />);
    expect(s).toContain('>2018<');
    expect(s).toContain('>2021<');
  });

  it('bietet beide Datumsfelder als echte Eingabe an (WCAG 2.1.1)', () => {
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={h} onBereich={() => {}} />);
    expect(s).toContain('data-zeit-feld="von"');
    expect(s).toContain('data-zeit-feld="bis"');
    expect(s).toContain('type="date"');
  });

  it('offener Bereich: keine Zurücksetzen-Schaltfläche, kein Bereichs-Label', () => {
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={h} onBereich={() => {}} />);
    expect(s).not.toContain('Zeitraum aufheben');
  });

  it('aktiver Bereich: Label sichtbar UND ein Weg zurück (§8, kein Sackgassen-Filter)', () => {
    const s = renderToString(
      <BezugZeitWahl bereich={{ von: '2019-01-01', bis: '2021-12-31' }} histogramm={h} onBereich={() => {}} />,
    );
    expect(s).toContain('01.01.2019–31.12.2021');
    expect(s).toContain('Zeitraum aufheben');
  });

  it('gibt die Feldwerte aus dem Bereich wieder (gesteuerte Komponente)', () => {
    const s = renderToString(
      <BezugZeitWahl bereich={{ von: '2019-01-01', bis: '' }} histogramm={h} onBereich={() => {}} />,
    );
    expect(s).toContain('value="2019-01-01"');
  });

  it('weist Kanten OHNE Datum aus, statt sie verschwinden zu lassen (§8)', () => {
    const mit = baueJahresHistogramm(['2020-01-01', 'n/a', 'n/a']);
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={mit} onBereich={() => {}} />);
    expect(s).toContain('ohne Datum');
  });

  it('leere Verteilung: ehrlicher Satz statt leerer Grafik', () => {
    const s = renderToString(
      <BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={{ balken: [], ohneJahr: 0 }} onBereich={() => {}} />,
    );
    expect(s).not.toContain('data-zeitstrahl-jahr');
    expect(s).toContain('noch keine Verteilung geladen');
    // Die Felder bleiben trotzdem bedienbar — sie brauchen den Shard nicht.
    expect(s).toContain('data-zeit-feld="von"');
  });

  it('sagt ausdrücklich, dass die Verteilung DIESEN Erlass zeigt (§8)', () => {
    const s = renderToString(<BezugZeitWahl bereich={OFFENER_BEREICH} histogramm={h} onBereich={() => {}} />);
    expect(s).toContain('in diesem Erlass');
  });
});

/**
 * Nachzug E4-B01 (W2·17-UI-BEFUNDE, Prüfer-Befund 2.10.2026): der Strahl nutzt
 * dieselbe «wirksame Kantonwahl» wie die Liste. Gemessen vor dem Fix (OR + ZH,
 * ZH kommt in OR nicht vor): Strahl 930, Liste 1552 — der Fusssatz «930
 * Verknüpfungen in diesem Erlass» war falsch. Die Prüf-Seite zählt hier über
 * `waehleBezuege` je Artikel (die Auswahl der Liste), nicht über dieselbe
 * Schleife wie der Prüfling.
 */
describe('E4-B01 Nachzug · Strahl = Liste bei gespeicherter Kantonwahl', () => {
  const FAELLE: [string, string[]][] = [
    ['OR', ['ZH']], ['OR', ['BE']], ['STPO', ['GR']], ['ZGB', ['ZH']], ['OR', ['ZH', 'BE']],
  ];
  for (const [key, kantone] of FAELLE) {
    it(`${key} + ${kantone.join('/')}: Balken + ohneJahr = Summe der Liste über alle Artikel`, () => {
      const s = shard(key);
      const h = histogrammAusShard(s, BEDIENBARE_KLASSEN, kantone);
      const strahl = h.balken.reduce((a, b) => a + b.anzahl, 0) + h.ohneJahr;
      let liste = 0;
      for (const token of Object.keys(s.proArtikel)) {
        liste += waehleBezuege(bezuegeFuerArtikel(s, token), BEDIENBARE_KLASSEN, kantone).length;
      }
      expect(strahl).toBe(liste);
      expect(strahl).toBeGreaterThan(0);
    });
  }

  it('OR + ZH schneidet nichts (ZH fehlt in OR) — gleich viel wie ohne Kantonwahl', () => {
    const s = shard('OR');
    const mit = histogrammAusShard(s, BEDIENBARE_KLASSEN, ['ZH']);
    const ohne = histogrammAusShard(s, BEDIENBARE_KLASSEN, []);
    expect(mit).toEqual(ohne);
  });
});
