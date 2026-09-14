/**
 * W2·5m · ROHDATEN-LINK JE ERLASS (§7-Transparenz)
 *
 * Die Übersichtsbox beantwortet, «woher der Text kommt und wie er gebaut ist»
 * (so hat Ä81/Ä97 ihre Grenze zum Erlass-Kopf gezogen). Der Schnappschuss, aus
 * dem der Leser rendert, ist die vollständigste Antwort darauf — und er ist
 * ab hier verlinkt, mit dem Stand, den er trägt.
 *
 * ZWEI DINGE, DIE DIESE SONDE BEWUSST FESTHÄLT:
 *  (1) Kein Link ohne Datei. Erlasse ohne Snapshot (nur-live-link, pdf-embed)
 *      bekommen keinen Rohdaten-Zeiger — dieselbe §8-Regel, nach der ein
 *      fehlendes `quelleUrl` gar keinen Link erzeugt statt eines toten.
 *  (2) Die amtliche Link-Zeile bleibt unberührt. `links` trägt weiter genau
 *      «quelle» und «pdf»; der Rohdaten-Zeiger ist ein EIGENES Bauteil
 *      (`v3/rohdatenZeiger.ts`) und eine eigene Prop der Box — sonst stünde
 *      unsere Kopie in einer Reihe mit der massgeblichen Fassung. Er hält
 *      `uebersichtAngaben.ts` zugleich unter dem 420er-Deckel aus
 *      `leser-v3-fundament.test.ts` (dort steht die volle Herleitung).
 *
 * ── GRENZE ZU Ä71 (18.8.2026), ausdrücklich, nicht stillschweigend ──────────
 * Ä71 hat den Fassungs-Token aus der Box entfernt und das belegt (Datumsform =
 * Stand in anderer Notation; Hash-Form = Maschinen-Provenienz; §7 Bst. d ist
 * die Drift-ERKENNUNG, nicht der Abdruck). Der Auftrag zu W2·5m verlangte ihn
 * sichtbar. Gebaut ist die Ä71-Linie: der Token steht IN der verlinkten Datei,
 * nicht in der Box. Ä71 und seine Sonde bleiben unverändert stehen — diese
 * Sonde hier hält nur fest, dass der neue Zeiger die alte Entscheidung nicht
 * heimlich aufweicht.
 *
 * ROT GEFAHREN (§6.7), 14.9.2026:
 *  · `href: `/normtext/${erlass.datei}`` → `erlass.quelleUrl`: «der Zeiger
 *    führt auf UNSEREN Snapshot» wird rot (4 Sonden).
 *  · `if (!erlass.datei) return null` gestrichen: «kein Snapshot, kein
 *    Zeiger» wird rot (2 Sonden).
 *  · `{rohdaten && (…)}` in `UebersichtBox.tsx` gestrichen: «die Box zeigt den
 *    Zeiger» wird rot.
 */
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { uebersichtsAngaben, type UebersichtsEingabe } from '../pages/gesetz-leser/v3/uebersichtAngaben';
import { rohdatenZeiger } from '../pages/gesetz-leser/v3/rohdatenZeiger';
import { UebersichtBox } from '../pages/gesetz-leser/v3/UebersichtBox';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

function erlassBauen(p: Partial<BrowseErlass>): BrowseErlass {
  return {
    key: 'OR', ebene: 'bund', kanton: null, kuerzel: 'OR', titel: 'Obligationenrecht',
    sr: '220', rechtsgebiet: 'privat', sprache: 'de', rang: 1, status: 'snapshot',
    datei: 'bund/OR.json', artikelAnzahl: 10, stand: '2026-01-01',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/27/317_321_377/de',
    fassungsToken: '20260101', pdfPfad: null,
    ...p,
  } as BrowseErlass;
}

function eingabe(p: Partial<UebersichtsEingabe> & { erlass: BrowseErlass }): UebersichtsEingabe {
  return {
    kopf: null, currency: undefined, erlassTyp: undefined, anzahl: 10,
    bestimmungsWort: 'Artikel', bestimmungsEtikettStatus: undefined,
    gliederungsTiefe: 0, kennzahlen: null, kantonSys: {}, kantonErlassAnzahl: null,
    nichtKonsolidiert: false, nichtKonsolidiertSeit: null,
    ...p,
  };
}

describe('W2·5m · Rohdaten-Zeiger (rein, `v3/rohdatenZeiger`)', () => {
  it('der Zeiger führt auf UNSEREN Snapshot unter `/normtext/…`, nicht auf die amtliche Quelle', () => {
    expect(rohdatenZeiger(erlassBauen({}))?.href).toBe('/normtext/bund/OR.json');
  });

  it('der Kantons-Snapshot liegt unter demselben Präfix — kein `if (bund)` (Ä70)', () => {
    const z = rohdatenZeiger(erlassBauen({
      key: 'BS-132.100', ebene: 'kanton', kanton: 'BS', sr: null, datei: 'kanton/BS-132.100.json',
    }));
    expect(z?.href).toBe('/normtext/kanton/BS-132.100.json');
  });

  it('der Zeiger nennt den Stand, den die Datei trägt (§7 Bst. a — kein Artefakt ohne Datum)', () => {
    const erlass = erlassBauen({ stand: '2025-04-01' });
    expect(rohdatenZeiger(erlass)?.stand).toBe('01.04.2025');
    // Derselbe Wert wie die Zeile «Stand» der Box, in derselben Schreibung (§5).
    expect(uebersichtsAngaben(eingabe({ erlass })).zeilen.find((z) => z.id === 'stand')?.wert)
      .toBe('01.04.2025');
  });

  it('kein Snapshot (nur-live-link/pdf-embed) ⇒ kein Zeiger statt eines toten Links (§8)', () => {
    expect(rohdatenZeiger(erlassBauen({ status: 'nur-live-link', datei: null, artikelAnzahl: 0 })))
      .toBeNull();
  });

  it('Erlass ohne Stand (2 von 1469, VD): Datei ja, Datum nein — keine leere Präposition (B8)', () => {
    const z = rohdatenZeiger(erlassBauen({ stand: '' }));
    expect(z?.href).toBe('/normtext/bund/OR.json');
    expect(z?.stand).toBeNull();
  });

  it('die AMTLICHE Link-Zeile bleibt unberührt — unsere Kopie steht nicht in ihrer Reihe', () => {
    const a = uebersichtsAngaben(eingabe({ erlass: erlassBauen({}) }));
    expect(a.links.map((l) => l.id)).toEqual(['quelle']);
    expect(a.links.some((l) => l.href.startsWith('/normtext/'))).toBe(false);
  });

  it('Ä71 bleibt stehen: der Fassungs-Token steht in KEINER Zeile und in keinem Link', () => {
    // Der Auftrag zu W2·5m wollte ihn sichtbar; Ä71 hat das 18.8.2026 mit
    // Messung verworfen, und §7 Bst. d verlangt die Drift-ERKENNUNG, nicht den
    // Abdruck des Hashes. Abweichung offengelegt (§7), Entscheid bei David.
    const erlass = erlassBauen({ fassungsToken: 'a3f9c0deadbeef' });
    const a = uebersichtsAngaben(eingabe({ erlass }));
    const sichtbar = [...a.zeilen.map((z) => z.wert), ...a.links.map((l) => l.label),
      rohdatenZeiger(erlass)?.stand ?? '', rohdatenZeiger(erlass)?.href ?? ''].join(' ');
    expect(sichtbar).not.toContain('a3f9c0');
  });
});

describe('W2·5m · Rohdaten-Zeiger (Darstellung, `v3/UebersichtBox`)', () => {
  const box = (erlass: BrowseErlass) => renderToString(
    <UebersichtBox angaben={uebersichtsAngaben(eingabe({ erlass }))} rohdaten={rohdatenZeiger(erlass)} />,
  );

  it('die Box zeigt den Zeiger als echten Link mit Stand', () => {
    const out = box(erlassBauen({ stand: '2025-04-01' }));
    expect(out).toContain('data-v3-uebersicht-rohdaten');
    expect(out).toContain('href="/normtext/bund/OR.json"');
    expect(out).toContain('Rohdaten (JSON)');
    expect(out).toContain('Fassung 01.04.2025');
  });

  it('der Zeiger bleibt auf dieser Seite — kein `target="_blank"` für eine eigene Datei', () => {
    const out = box(erlassBauen({}));
    const zeile = out.slice(out.indexOf('data-v3-uebersicht-rohdaten'));
    expect(zeile.slice(0, zeile.indexOf('</p>'))).not.toContain('target=');
  });

  it('ohne Snapshot bleibt die Zeile ganz weg (§8)', () => {
    const out = box(erlassBauen({ status: 'nur-live-link', datei: null, artikelAnzahl: 0 }));
    expect(out).not.toContain('data-v3-uebersicht-rohdaten');
  });

  it('ohne die Prop bleibt die Box, was sie war (Hüllen-Sonden, Druck)', () => {
    const out = renderToString(
      <UebersichtBox angaben={uebersichtsAngaben(eingabe({ erlass: erlassBauen({}) }))} />,
    );
    expect(out).not.toContain('data-v3-uebersicht-rohdaten');
  });
});
