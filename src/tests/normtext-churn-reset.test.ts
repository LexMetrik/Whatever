import { describe, it, expect } from 'vitest';
import { istReinerDatumsChurn, ohneChurnFelder, setzeUnveraenderteEintraegeZurueck } from '../../scripts/normtext/churn-reset';

// §17 Befund (a2), 1.9.2026: Reset reinen Datums-Churns (erzeugt/abgerufen) nach Generator-Läufen.
// Fixture = Kopf eines Bund-Snapshots (public/normtext/bund/ADOV.json, Diff aus PR #596).

const alt = JSON.stringify({
  erzeugt: '2026-08-29',
  eintraege: [
    { id: 'bund/ADOV/art_1', stand: '2023-01-23', abgerufen: '2026-08-29', fassungsToken: '20230123', sha: 'x', bloecke: [{ absatz: '1', text: 'Diese Verordnung regelt:' }] },
    { id: 'bund/ADOV/art_2', stand: '2023-01-23', abgerufen: '2026-08-29', fassungsToken: '20230123', sha: 'y', bloecke: [] },
  ],
}, null, 2);

const nurDaten = alt.replaceAll('2026-08-29', '2026-08-31');

describe('istReinerDatumsChurn', () => {
  it('nur erzeugt/abgerufen verschoben ⇒ Churn (zurücksetzen)', () => {
    expect(nurDaten).not.toBe(alt);
    expect(istReinerDatumsChurn(alt, nurDaten)).toBe(true);
  });
  it('Text-Änderung neben dem Datums-Churn ⇒ Substanz (belassen)', () => {
    expect(istReinerDatumsChurn(alt, nurDaten.replace('regelt:', 'regelt neu:'))).toBe(false);
  });
  it('stand-/fassungsToken-/sha-Wechsel sind Substanz, kein Churn', () => {
    expect(istReinerDatumsChurn(alt, nurDaten.replace('"stand": "2023-01-23"', '"stand": "2026-01-01"'))).toBe(false);
    expect(istReinerDatumsChurn(alt, nurDaten.replace('"fassungsToken": "20230123"', '"fassungsToken": "20260101"'))).toBe(false);
    expect(istReinerDatumsChurn(alt, nurDaten.replace('"sha": "x"', '"sha": "z"'))).toBe(false);
  });
  it('gelöschter oder neuer Eintrag ⇒ Substanz', () => {
    const o = JSON.parse(nurDaten) as { eintraege: unknown[] };
    o.eintraege.pop();
    expect(istReinerDatumsChurn(alt, JSON.stringify(o))).toBe(false);
  });
  it('byte-gleich ⇒ kein Churn (nichts zu tun)', () => {
    expect(istReinerDatumsChurn(alt, alt)).toBe(false);
  });
  it('Nicht-JSON auf einer Seite ⇒ nie Churn (fail-closed)', () => {
    expect(istReinerDatumsChurn(alt, '{ kaputt')).toBe(false);
    expect(istReinerDatumsChurn('nicht json', nurDaten)).toBe(false);
  });
  it('ohneChurnFelder entfernt die Felder auf jeder Tiefe und lässt Arrays/Reihenfolge stehen', () => {
    expect(ohneChurnFelder({ erzeugt: 'x', a: [{ abgerufen: 'y', b: 1 }, 2], c: { erzeugt: 'z', d: null } }))
      .toEqual({ a: [{ b: 1 }, 2], c: { d: null } });
  });
});

// W2·27-BUND-FERTIG P1 (Posten «churn-reset je Eintrag», #1204: 1289 Einträge): eine Datei MIT
// Substanz behielt bisher in ALLEN Einträgen das neue `abgerufen` — auch in den unveränderten.
describe('setzeUnveraenderteEintraegeZurueck (je Eintrag)', () => {
  // Wie der Generator: JSON.stringify(…, null, 2), ohne Schlusszeilenumbruch (public/normtext/bund).
  const neuMitSubstanz = nurDaten.replace('regelt:', 'regelt neu:');

  it('unveränderter Eintrag bekommt sein altes `abgerufen` zurück, der geänderte behält das neue', () => {
    const r = setzeUnveraenderteEintraegeZurueck(alt, neuMitSubstanz);
    expect(r).not.toBeNull();
    const o = JSON.parse(r!.text) as { erzeugt: string; eintraege: { id: string; abgerufen: string; bloecke: { text?: string }[] }[] };
    expect(r!.zurueckgesetzt).toBe(1);
    expect(o.eintraege[0].abgerufen).toBe('2026-08-31'); // Substanz: neu
    expect(o.eintraege[0].bloecke[0].text).toBe('Diese Verordnung regelt neu:');
    expect(o.eintraege[1].abgerufen).toBe('2026-08-29'); // unverändert: alt
    expect(o.erzeugt).toBe('2026-08-31'); // Kopf einer Substanz-Datei bleibt neu
  });
  it('der unveränderte Eintrag ist danach byte-gleich zum Altstand (kein Datums-Churn im Diff)', () => {
    const r = setzeUnveraenderteEintraegeZurueck(alt, neuMitSubstanz)!;
    const o = JSON.parse(r.text) as { eintraege: unknown[] };
    const a = JSON.parse(alt) as { eintraege: unknown[] };
    expect(JSON.stringify(o.eintraege[1])).toBe(JSON.stringify(a.eintraege[1]));
  });
  it('Substanz in jedem Eintrag ⇒ nichts zurückgesetzt, Text unverändert', () => {
    const beide = neuMitSubstanz.replace('"sha": "y"', '"sha": "q"');
    const r = setzeUnveraenderteEintraegeZurueck(alt, beide)!;
    expect(r.zurueckgesetzt).toBe(0);
    expect(r.text).toBe(beide);
  });
  it('neuer Eintrag (id im Altstand unbekannt) bleibt unberührt', () => {
    const o = JSON.parse(neuMitSubstanz) as { eintraege: Record<string, unknown>[] };
    o.eintraege.push({ id: 'bund/ADOV/art_3', abgerufen: '2026-08-31', sha: 'n' });
    const r = setzeUnveraenderteEintraegeZurueck(alt, JSON.stringify(o, null, 2))!;
    const e = (JSON.parse(r.text) as { eintraege: { id: string; abgerufen: string }[] }).eintraege;
    expect(e[2]).toEqual({ id: 'bund/ADOV/art_3', abgerufen: '2026-08-31', sha: 'n' });
    expect(e[1].abgerufen).toBe('2026-08-29');
  });
  it('Schlusszeilenumbruch bleibt erhalten', () => {
    const r = setzeUnveraenderteEintraegeZurueck(`${alt}\n`, `${neuMitSubstanz}\n`)!;
    expect(r.text.endsWith('}\n')).toBe(true);
    expect(r.zurueckgesetzt).toBe(1);
  });
  it('fail-closed: Nicht-JSON, fehlende/doppelte ids, fremdes Format ⇒ null', () => {
    expect(setzeUnveraenderteEintraegeZurueck(alt, '{ kaputt')).toBeNull();
    expect(setzeUnveraenderteEintraegeZurueck('nicht json', neuMitSubstanz)).toBeNull();
    expect(setzeUnveraenderteEintraegeZurueck('{"a":1}', '{"a":2}')).toBeNull(); // kein `eintraege`
    const doppelt = JSON.parse(neuMitSubstanz) as { eintraege: unknown[] };
    doppelt.eintraege.push(doppelt.eintraege[1]);
    expect(setzeUnveraenderteEintraegeZurueck(alt, JSON.stringify(doppelt, null, 2))).toBeNull();
    expect(setzeUnveraenderteEintraegeZurueck(alt, neuMitSubstanz.replace(/\n\s*/g, ' '))).toBeNull(); // Format ≠ Generator
  });
});
