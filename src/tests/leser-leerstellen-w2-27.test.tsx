/**
 * W2·27-BUND-FERTIG · §8-ANZEIGE DER UNGEKLÄRTEN LEERSTELLEN (15.9.2026)
 * Auflage der Gegenprüfung #859.
 *
 * DER FEHLER, DEN DIESE DATEI HÄLT. Der Leser schrieb «· aufgehoben» an jeden
 * Artikel, dessen Body leer oder «…» ist — auch ohne amtlichen
 * Aufhebungsvermerk. Betroffen waren 98 Bund- und 481 Kanton-Artikel
 * (Basislinie `scripts/normtext/leerstellen-basislinie.json`, 14.9.2026),
 * darunter GELTENDE Bestimmungen. Vier belegte Klassen, alle hier als
 * Vorrichtung (Herleitung und Belege im Kopf von
 * `scripts/normtext/check-leerstellen.ts`):
 *   (1) Änderungsartikel     AVIG Art. 115, BGFA Art. 35
 *   (2) noch nicht in Kraft  AIG Art. 126f
 *   (3) amtlicher Vermerk    StGB Art. 108 («bleibt … leer»)
 *   (4) Anhänge              `annex_*`
 * Gegenprobe ist OR Art. 48: derselbe Body «…», aber MIT dem amtlichen Feld
 * `aufgehoben` — dort bleibt «· aufgehoben» richtig und muss stehen bleiben.
 *
 * ROT VOR DEM FIX (Wegwerf-Probe 15.9.2026): mit dem alten
 * `artikelGanzAufgehoben(e.bloecke, e.aufgehoben)` im Leser scheiterten die
 * Fälle «(1)–(4) sagen NICHT ‹aufgehoben›» mit «expected … not to contain
 * '· aufgehoben'».
 *
 * WAS DIESE DATEI NICHT PRÜFT: die Absatz-genaue Aufhebung. Ihr amtlicher Beleg
 * liegt nicht in der Darstellungsschicht (Bund: lazy geholter Historie-Shard;
 * Kanton: `abrogation_ellip` fällt zur Bauzeit weg) — Herleitung im Block
 * «LEERER BLOCK ≠ AUFHEBUNG» in `src/components/normtext/ArtikelBody.tsx`.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ArtikelLeser } from '../pages/gesetz-leser/parts';
import {
  artikelGanzAufgehoben, artikelLeerstellenStatus, leerstellenWort, LEERSTELLE_KURZ,
} from '../lib/normtext/darstellung';
import type { NormSnapshot } from '../lib/normtext/typen';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'AVIG', ebene: 'bund', kanton: null, kuerzel: 'AVIG', titel: 'Arbeitslosenversicherungsgesetz',
  sr: '837.0', rechtsgebiet: 'oeffentlich', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/AVIG.json', artikelAnzahl: 1, stand: '2026-01-01',
  quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/1982/2184_2184_2184/de', fassungsToken: '20260101',
  pdfPfad: null,
};

/** Snapshot-Eintrag in Ist-Form. `bloecke` und `aufgehoben` sind die beiden
 *  Grössen, um die es geht; alles Übrige ist Beiwerk. */
const eintrag = (
  artikel: string,
  bloecke: NormSnapshot['bloecke'],
  markiert?: true,
): NormSnapshot => ({
  id: `bund/AVIG/art_${artikel}`, ebene: 'bund', quelle: 'AVIG', erlass: 'AVIG',
  artikel, artikelLabel: `Art. ${artikel}`, bloecke,
  ...(markiert ? { aufgehoben: markiert } : {}),
  stand: '2026-01-01', quelleUrl: `https://x#art_${artikel}`, abgerufen: '2026-09-15',
  fassungsToken: '20260101', sha: artikel,
});

// Die Ist-Gestalt aller vier Klassen im committeten Korpus, gemessen 15.9.2026:
// EIN Block, `absatz: null`, Text «…», KEIN Feld `aufgehoben`.
const PLATZHALTER: NormSnapshot['bloecke'] = [{ absatz: null, text: '…' }];

describe('W2·27 (a) · artikelLeerstellenStatus — der Beleg entscheidet, nicht der Befund', () => {
  it('OR-48-artig: Platzhalter MIT amtlichem Feld ⇒ aufgehoben', () => {
    expect(artikelLeerstellenStatus(PLATZHALTER, true)).toBe('aufgehoben');
  });

  it('AVIG-115-artig (Änderungsartikel): Platzhalter OHNE Feld ⇒ leer-ungeklaert', () => {
    expect(artikelLeerstellenStatus(PLATZHALTER)).toBe('leer-ungeklaert');
  });

  it('der nackte amtliche Wortlaut «Aufgehoben» ohne Feld ist auch nur eine Vermutung', () => {
    // Bewusst KEIN Sonderweg: auch «Aufgehoben» im Body ist Stufe (3). Wer das
    // ändern will, braucht einen Beleg, dass der Adapter das Wort nie aus einem
    // Extraktionsrest erzeugt — den gibt es heute nicht (§7).
    expect(artikelLeerstellenStatus([{ text: 'Aufgehoben' }])).toBe('leer-ungeklaert');
  });

  it('lebender Wortlaut ⇒ lebt', () => {
    expect(artikelLeerstellenStatus([{ text: 'Der Bundesrat regelt die Einzelheiten.' }])).toBe('lebt');
  });

  it('Tabelle schlägt AUCH das amtliche Feld (G-AUFH-ART-Rangfolge bleibt) ⇒ lebt', () => {
    const mitTabelle = [{ text: '', tabelle: [{ beschreibung: 'x', betrag: '10' }] }];
    expect(artikelLeerstellenStatus(mitTabelle, true)).toBe('lebt');
    expect(artikelLeerstellenStatus([{ text: '', mehrspaltig: { zeilen: [['a', 'b']] } }], true)).toBe('lebt');
  });

  it('gar keine Blöcke: keine Aussage aus dem Nichts (§7) ⇒ lebt, ausser das Feld sagt es', () => {
    expect(artikelLeerstellenStatus([])).toBe('lebt');
    expect(artikelLeerstellenStatus([], true)).toBe('aufgehoben');
  });

  it('§5 — der Wächter sieht weiter die NACKTE Heuristik (check:leerstellen misst sie)', () => {
    // Beide Leerstellen-Arten sind für `artikelGanzAufgehoben` unverändert
    // `true`; nur die neue Funktion trennt sie. Liefe das auseinander, zählte
    // das Tor eine andere Menge als der Leser zeigt.
    expect(artikelGanzAufgehoben(PLATZHALTER)).toBe(true);
    expect(artikelGanzAufgehoben(PLATZHALTER, true)).toBe(true);
  });
});

describe('W2·27 (b) · leerstellenWort — EIN Wort für alle Flächen (§5)', () => {
  it('lebender Artikel bekommt kein Etikett (keine Zeile ohne Auskunft)', () => {
    expect(leerstellenWort('lebt')).toBeNull();
  });

  it('amtlich belegt heisst «aufgehoben», ungeklärt heisst «kein Text im Snapshot»', () => {
    expect(leerstellenWort('aufgehoben')).toBe('aufgehoben');
    expect(leerstellenWort('leer-ungeklaert')).toBe(LEERSTELLE_KURZ);
    expect(LEERSTELLE_KURZ).toBe('kein Text im Snapshot');
  });
});

describe('W2·27 (c) · der Leser sagt nur, was belegt ist (§8)', () => {
  const zeige = (e: NormSnapshot) =>
    renderToString(<ArtikelLeser e={e} erlass={erlass} basisPfad="/gesetze/bund/AVIG" />);

  // Die vier Klassen der Restmenge, je mit ihrem amtlichen Beispiel.
  const klassen: Array<[string, string]> = [
    ['115', '(1) Änderungsartikel — AVIG Art. 115'],
    ['35', '(1) Änderungsartikel — BGFA Art. 35'],
    ['126f', '(2) noch nicht in Kraft — AIG Art. 126f'],
    ['108', '(3) amtlicher Vermerk — StGB Art. 108'],
    ['annex_1', '(4) Anhang — annex_*'],
  ];
  for (const [artikel, klasse] of klassen) {
    it(`${klasse}: kein «aufgehoben», sondern der neutrale Hinweis`, () => {
      const out = zeige(eintrag(artikel, PLATZHALTER));
      expect(out).not.toContain('· aufgehoben');
      expect(out).toContain('kein Text im Snapshot');
    });
  }

  it('Gegenprobe OR-48-artig: MIT amtlichem Feld bleibt «· aufgehoben» stehen', () => {
    const out = zeige(eintrag('48', PLATZHALTER, true));
    expect(out).toContain('· aufgehoben');
    expect(out).not.toContain('kein Text im Snapshot');
  });

  it('Gegenprobe lebender Artikel: gar kein Zustandswort', () => {
    const out = zeige(eintrag('1', [{ absatz: '1', text: 'Das Gesetz bezweckt den Ausgleich.' }]));
    expect(out).not.toContain('· aufgehoben');
    expect(out).not.toContain('kein Text im Snapshot');
  });

  it('die Erläuterung steht am Hinweis, nennt aber keine der vier Ursachen als DIE Ursache', () => {
    const out = zeige(eintrag('115', PLATZHALTER));
    expect(out).toContain('Die amtliche Quelle zeigt hier keinen Wortlaut');
    expect(out).toContain('Massgeblich ist die amtliche Fassung.');
  });

  it('die Leerstelle bleibt eingeklappt und gedämpft — die Form ändert sich NICHT (§6)', () => {
    const out = zeige(eintrag('115', PLATZHALTER));
    // Dieselbe Dämpfungsklasse wie am aufgehobenen Artikel, kein neues Token (§13).
    expect(out).toContain('text-ink-500 font-normal');
    // Kein Klapp-Chevron: es gibt nichts zu entfalten.
    expect(out).not.toContain('▾');
    expect(out).not.toContain('▸');
  });
});
