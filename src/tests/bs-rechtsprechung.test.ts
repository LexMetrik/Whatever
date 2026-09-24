// ─── BS-Rechtsprechungs-Pipeline: netzfreie Parser-Tests gegen golden fixtures ─
//
// Fixtures = echte Portal-Antworten (rohbytes, windows-1252; URG-Art.-5-frei),
// committet unter scripts/rechtsprechung/fixtures/. Deckt beide Dokument-
// Vokabulare (aa*-Klassen / Word-Klassen), die Trefferlisten-Struktur, die
// Latin-1/Windows-1252-Fidelity und die docketSafe-Kollisionsregel (§3.2).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { encodeLatin1, dekodiereBs, trefferAnzahl, dokumentUrl, sucheUrl } from '../../scripts/rechtsprechung/bs-client';
import { parseTrefferliste, gnJahr } from '../../scripts/rechtsprechung/bs-inventar';
import { parseBsDokument, baueSnapshot, bereinigeQuellDebris, docketSafeVergabe, normAsciiWs, kopfDatum, plausiblesKopfDatum } from '../../scripts/rechtsprechung/bs-parse';
import { sha256EntscheidBloecke } from '../../scripts/normtext/sha-entscheide';
import type { InventarZeile } from '../../scripts/rechtsprechung/bs-inventar';

const FIX = join(process.cwd(), 'scripts', 'rechtsprechung', 'fixtures');
const fix = (name: string): Buffer => readFileSync(join(FIX, name));

describe('bs-client', () => {
  it('encodeLatin1 prozent-encodiert über Latin-1-Bytes (nie UTF-8)', () => {
    expect(encodeLatin1('31.12.2022')).toBe('31.12.2022');
    expect(encodeLatin1('ä')).toBe('%E4');            // UTF-8 wäre %C3%A4
    expect(encodeLatin1('a b')).toBe('a%20b');
    expect(() => encodeLatin1('€')).toThrow();         // ausserhalb Latin-1: ehrlich scheitern
  });

  it('dekodiereBs behandelt C1-Bytes als Windows-1252 (Browser-Semantik)', () => {
    expect(dekodiereBs(Buffer.from([0x96]))).toBe('–');   // en-dash, latin1 ergäbe U+0096
    expect(dekodiereBs(Buffer.from([0xe4]))).toBe('ä');
    expect(dekodiereBs(Buffer.from([0xa0]))).toBe(' ');
  });

  it('URLs tragen die Pflicht-Basis-Parameter; Dokument-URL das Pflicht-Template', () => {
    const u = dokumentUrl(77812);
    expect(u).toContain('Schema=BS_FI_WEB');
    expect(u).toContain('nF30_KEY=77812');
    expect(u).toContain('Template=search_result_document.html');   // ohne: 17-Byte-#ERROR bei HTTP 200
    expect(u).not.toContain('W10_KEY');                            // session-gebunden, nie einbetten
    const s = sucheUrl({ seite: 2, von: '01.01.2022', bis: '31.12.2022' });
    expect(s).toContain('nAnzahlTrefferProSeite=999');
    expect(s).toContain('nSeite=2');
    expect(s).not.toContain('bInstanzInt');                        // kastriert den Korpus (§1.4)
  });
});

describe('bs-inventar (Trefferlisten-Parse, strukturell)', () => {
  const html = dekodiereBs(fix('trefferliste-2023-gn.html'));

  it('Zeilenzahl == Portal-N («von N gefundenen»)', () => {
    const rows = parseTrefferliste(html);
    expect(trefferAnzahl(html)).toBe(3);
    expect(rows).toHaveLength(3);
  });

  it('Zeilen tragen Key/GN/Sekundär-GN/Daten/Titel', () => {
    const rows = parseTrefferliste(html);
    for (const r of rows) {
      expect(r.key).toBeGreaterThan(0);
      expect(r.gn).toMatch(/^[A-Z][A-Z0-9]*\.\d{4}\.\d+$/);
      expect(r.titel.length).toBeGreaterThan(0);
      expect(r.erstpublikation).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('gnJahr liest das mittlere GN-Segment', () => {
    expect(gnJahr('IV.2025.93')).toBe(2025);
    expect(gnJahr('ZB.2023.4')).toBe(2023);
    expect(gnJahr('unsinn')).toBeNull();
  });
});

describe('bs-parse (aa*-Klassen-Vokabular, Sozialversicherungsgericht)', () => {
  const p = parseBsDokument(fix('svg-iv-2025-93-datumlos.html'));

  it('Metadaten-Kopf vollständig; datumlos erkannt', () => {
    expect(p.gn).toBe('IV.2025.93');
    expect(p.gnSekundaer).toBe('SVG.2026.119');
    expect(p.court).toBe('bs_sozialversicherungsgericht');
    expect(p.datum).toBeNull();                       // Portal publiziert kein Entscheiddatum
    expect(p.erstpublikation).toBe('2026-06-23');
    expect(p.aktualisiert).toBe('2026-07-10');
    expect(p.titel).toBe('IVG Invalidenrente');
  });

  it('Abschnitte strukturell: Tatsachen → Entscheidungsgründe → Dispositiv', () => {
    expect(p.strukturQuelle).toBe('klassen');
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['sachverhalt', 'erwaegung', 'dispositiv']);
    const sv = p.abschnitte[0];
    expect(sv.bloecke.map((b) => b.marke).filter(Boolean)).toEqual(['I.', 'II.', 'III.']);
    const erw = p.abschnitte[1];
    const marken = erw.bloecke.map((b) => b.marke).filter(Boolean);
    expect(marken[0]).toBe('E. 1');
    expect(marken).toContain('E. 3.2');
    // Marken-Kette der Top-Ebene lückenlos (Fidelity §8.2).
    const tops = marken.filter((m) => /^E\. \d+$/.test(m!)).map((m) => Number(m!.slice(3)));
    expect(tops).toEqual([1, 2, 3, 4, 5]);
  });

  it('Dispositiv-Ziffern extrahiert («://:»-Konvention)', () => {
    expect(p.dispositivOrders[0]).toBe('Die Beschwerde wird abgewiesen.');
    expect(p.dispositivOrders.length).toBeGreaterThanOrEqual(4);
  });

  it('Typographie verbatim: NBSP erhalten, keine Entities/Tags/C1-Reste', () => {
    const text = p.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
    expect(text).toContain(' ');                  // NBSP nie ASCII-gefoldet
    expect(text).not.toMatch(/&(nbsp|auml|ouml|uuml);/);
    expect(text).not.toMatch(/<\/?(p|b|span|div|td|tr|br|img)\b[^>]*>/i);
    expect(text).not.toMatch(/[-]/);       // windows-1252 korrekt dekodiert
    expect(text).not.toContain('�');
  });
});

describe('bs-parse (Word-Klassen-Vokabular, Appellationsgericht)', () => {
  it('BEZ.2024.79: Marker-Segmentierung + Erwägungsmarken aus führendem <b>', () => {
    const p = parseBsDokument(fix('ag-bez-2024-79.html'));
    expect(p.gn).toBe('BEZ.2024.79');
    expect(p.court).toBe('bs_appellationsgericht');
    expect(p.datum).toBe('2024-12-30');
    expect(p.strukturQuelle).toBe('marker');
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['sachverhalt', 'erwaegung', 'dispositiv']);
    const marken = p.abschnitte[1].bloecke.map((b) => b.marke).filter(Boolean);
    expect(marken).toEqual(['E. 1', 'E. 2', 'E. 3', 'E. 4', 'E. 4.1', 'E. 4.2', 'E. 5']);
    expect(p.dispositivOrders[0]).toMatch(/^Die Beschwerde gegen den Entscheid des Zivilgerichts/);
  });

  it('ZB.2024.34: tiefe Erwägungs-Hierarchie (x.y.z) mit tiefe-Angabe', () => {
    const p = parseBsDokument(fix('ag-zb-2024.html'));
    const erw = p.abschnitte.find((a) => a.typ === 'erwaegung')!;
    const tief = erw.bloecke.find((b) => b.marke === 'E. 1.2.1');
    expect(tief?.tiefe).toBe(3);
    // Windows-1252-Typographie (en-dash/Apostroph) überlebt verbatim.
    const text = erw.bloecke.map((b) => b.text).join('\n');
    expect(text).toMatch(/[–’]/);
  });

  it('SB.2023.43 (Strafsache): Dispositiv mit vielen Ziffern vollständig', () => {
    const p = parseBsDokument(fix('ag-2024-3.html'));
    expect(p.gn).toBe('SB.2023.43');
    expect(p.abschnitte.map((a) => a.typ)).toContain('dispositiv');
    expect(p.dispositivOrders.length).toBeGreaterThanOrEqual(5);
  });
});

describe('Snapshot-Assemblierung (§3.4) + Kollisionsregel (§3.2)', () => {
  const zeile: InventarZeile = {
    key: 74438, gn: 'IV.2025.93', gnSekundaer: 'SVG.2026.119', datum: null,
    titel: 'IVG Invalidenrente', erstpublikation: '2026-06-23', aktualisiert: '2026-07-10',
  };

  // FACHLICHE ÄNDERUNG, deklariert (§6.3, W2·29-WERKBANK-LESER D2/B-1, 23.9.2026):
  // Bis hier erwartete dieser Test für das Fixture ohne Metadaten-Datum den
  // Platzhalter 2025-01-01 + datumUnbekannt. Das Fixture ist aber ein echtes
  // Portal-Dokument, dessen Deckblatt «URTEIL» / «vom 28. April 2026» trägt — das
  // Entscheiddatum steht in der amtlichen Quelle, der Platzhalter war falsch
  // (Befund B-1: «01.01.» erschien in den Bezügen als echtes Datum). Erwartet wird
  // jetzt das Kopf-Datum; der Platzhalter-Pfad bleibt eigens geprüft (nächster
  // Test, Kopf-Absatz aus dem Fixture entfernt).
  it('datumlos in den Metadaten: Datum aus dem Deckblatt («URTEIL» / «vom 28. April 2026»)', () => {
    const p = parseBsDokument(fix('svg-iv-2025-93-datumlos.html'));
    expect(p.datum).toBeNull();                        // Metadaten-Kopf ohne Entscheiddatum
    expect(p.datumKopf).toBe('2026-04-28');
    const s = baueSnapshot(p, zeile, p.gn, '2026-07-19');
    expect(s.datum).toBe('2026-04-28');
    expect(s.datumUnbekannt).toBeUndefined();
    expect(s.zitierung).toBe('Sozialversicherungsgericht BS IV.2025.93 vom 28.04.2026');
    expect(s.id).toBe('kanton/BS/bs_sozialversicherungsgericht/IV.2025.93');
    expect(s.quelle).toBe('gerichte-bs');
    expect(s.kuratierung).toBe('maschinell');
    expect(s.regeste).toBeNull();                      // Titel ist Betreff, keine Regeste (§8)
    expect(s.rubrum?.gegenstand).toBe('IVG Invalidenrente');
    expect(s.nummerSekundaer).toBe('SVG.2026.119');
    expect(s.fassungsToken).toBe('2026-07-10');        // aktualisiert als Drift-Token
    expect(s.sha).toBe(sha256EntscheidBloecke(s.abschnitte));
    // W2-TRENNUNG (29.8.2026): Das IV-Präfix (Invalidenversicherung) zeigt seit
    // der Zerlegung des Doppel-Topfs auf 'sozialversicherung' statt auf
    // 'sozial-abgaben' — deklarierte fachliche Änderung, §6.3.
    expect(s.sachgebiet).toBe('sozialversicherung');   // IV-Präfix
    expect(s.quelleUrl).toContain('nF30_KEY=74438');
  });

  it('ohne Deckblatt-Datum: ehrlicher Platzhalter <GN-Jahr>-01-01 + datumUnbekannt + Zitierung ohne «vom»', () => {
    // Dasselbe echte Dokument, nur der Datums-Absatz des Deckblatts entfernt.
    const roh = fix('svg-iv-2025-93-datumlos.html').toString('latin1');
    const ohneKopf = roh.replace(/>vom 28\. April 2026</, '>&nbsp;<');
    expect(ohneKopf).not.toBe(roh);
    const p = parseBsDokument(Buffer.from(ohneKopf, 'latin1'));
    expect(p.datumKopf).toBeNull();
    const s = baueSnapshot(p, zeile, p.gn, '2026-07-19');
    expect(s.datum).toBe('2025-01-01');
    expect(s.datumUnbekannt).toBe(true);
    expect(s.zitierung).toBe('Sozialversicherungsgericht BS IV.2025.93');
  });

  it('Kopf-Datum unplausibel (nach der Erstpublikation): bleibt ehrlich unbekannt', () => {
    const p = parseBsDokument(fix('svg-iv-2025-93-datumlos.html'));
    const s = baueSnapshot({ ...p, erstpublikation: '2026-01-01' }, zeile, p.gn, '2026-07-19');
    expect(s.datum).toBe('2025-01-01');
    expect(s.datumUnbekannt).toBe(true);
  });

  it('docketSafe: Erstes Dokument blank, weitere -YYYYMMDD, gleiches Datum zusätzlich -key', () => {
    const p1 = { gn: 'ZB.2023.4', datum: '2023-05-04' };
    const p2 = { gn: 'ZB.2023.4', datum: '2023-08-01' };
    const p3 = { gn: 'ZB.2023.4', datum: '2023-08-01' };
    const z = (key: number): InventarZeile => ({ ...zeile, key, gn: 'ZB.2023.4' });
    const m = docketSafeVergabe([
      { p: p2 as never, z: z(20) }, { p: p1 as never, z: z(10) }, { p: p3 as never, z: z(30) },
    ]);
    expect(m.get(10)).toBe('ZB.2023.4');
    expect(m.get(20)).toBe('ZB.2023.4-20230801');
    expect(m.get(30)).toBe('ZB.2023.4-20230801-30');
  });
});

describe('normAsciiWs (Typographie-Treue)', () => {
  it('kollabiert nur ASCII-Whitespace; NBSP/U+202F bleiben verbatim', () => {
    expect(normAsciiWs('a  \t\r\n b')).toBe('a b');
    expect(normAsciiWs('a  b')).toBe('a  b');
    expect(normAsciiWs('CHF 100')).toBe('CHF 100');
    expect(normAsciiWs('  rand  ')).toBe('rand');
  });
});


// ─── Fix-Welle 19.7.2026 (Fidelity-Befunde): synthetische Minimal-Dokumente ──
// Echte Portal-Strukturen nachgebildet (WordSection2/3, <li>-Listen, C0-Debris,
// Deckblatt-Prosa, SVG-Vokabular-Varianten); windows-1252-Bytes via latin1.

const KOPF = `<table>
<tr><td>Geschäftsnummer:</td><td>SB.2023.99</td></tr>
<tr><td>Instanz:</td><td>Appellationsgericht</td></tr>
<tr><td>Entscheiddatum:</td><td>15.03.2023</td></tr>
<tr><td>Titel:</td><td>Testbetreff</td></tr>
</table>`;
const doku = (body: string): Buffer => Buffer.from(`<html><body>${KOPF}${body}</body></html>`, 'latin1');

describe('bs-parse Fix-Welle 19.7.2026 (Fidelity-Befunde)', () => {
  it('liest ALLE WordSection-Divs: Dispositiv in WordSection2 geht nicht verloren', () => {
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Sachverhalt</p>
        <p class=MsoNormal>Es geschah etwas.</p>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Erste Erwägung.</p>
      </div>
      <div class=WordSection2>
        <p class=MsoNormal>Demgemäss erkennt das Verwaltungsgericht (Dreiergericht):</p>
        <p class=MsoNormal>://: Die Beschwerde wird abgewiesen.</p>
      </div>`));
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['sachverhalt', 'erwaegung', 'dispositiv']);
    expect(p.dispositivOrders).toContain('Die Beschwerde wird abgewiesen.');
  });

  it('nimmt <li>-Aufzählungen als Einheiten auf (Vorstrafenlisten AUS.2023.4/18)', () => {
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Der Beurteilte ist wiederholt straffällig:</p>
        <ul>
          <li class=MsoNormalCxSpMiddle>Strafbefehl der Staatsanwaltschaft A vom 1. Januar 2020.</li>
          <li class=MsoNormalCxSpMiddle>Urteil des Strafgerichts B vom 2. Februar 2021.</li>
        </ul>
      </div>`));
    const text = p.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
    expect(text).toContain('Strafbefehl der Staatsanwaltschaft A vom 1. Januar 2020.');
    expect(text).toContain('Urteil des Strafgerichts B vom 2. Februar 2021.');
  });

  it('bereinigt C0-Quell-Debris: verifizierte UTF-16-Drop-Paare gemappt, Rest entfernt', () => {
    expect(bereinigeQuellDebris('CHF 32\u0000\u0019370.60')).toBe('CHF 32\u2019370.60');
    expect(bereinigeQuellDebris('2023 \u0000\u0013 und somit')).toBe('2023 \u2013 und somit');
    expect(bereinigeQuellDebris('://:\u0000\u0002\u0002\u0002 Text')).toBe('://: Text');
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Betrag von CHF 32\u0000\u0019370.60 am 13. Februar 2023 \u0000\u0013 und somit\u0000.</p>
      </div>`));
    const text = p.abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join('\n');
    expect(text).toContain('CHF 32\u2019370.60');
    expect(text).toContain('2023 \u2013 und somit');
    // eslint-disable-next-line no-control-regex -- C0 ist der Prüfgegenstand
    expect(text).not.toMatch(/[\u0000-\u0008\u000b\u000e-\u001f]/);
  });

  it('Deckblatt-Ende quantitativ: substanzielle Prosa VOR dem ersten Marker wird Sachverhalt', () => {
    const prosa = 'Am 12. Juli 2020 kam es vor der Liegenschaft zu einem Vorfall. '.repeat(6); // >= 300 Zeichen
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Mitwirkende</p>
        <p class=MsoNormal>Dr. A. Muster (Vorsitz)</p>
        <p class=MsoNormal>${prosa}</p>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Erste Erwägung.</p>
      </div>`));
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['sachverhalt', 'erwaegung']);
    const sv = p.abschnitte[0].bloecke.map((b) => b.text).join('\n');
    expect(sv).toContain('Am 12. Juli 2020');
    expect(sv).not.toContain('Mitwirkende');            // kurzes Rubrum bleibt übersprungen
  });

  it('kurzes Deckblatt (alle Absätze < 300 Zeichen) wird weiterhin komplett übersprungen', () => {
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Mitwirkende</p>
        <p class=MsoNormal>Dr. A. Muster (Vorsitz)</p>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Erste Erwägung.</p>
      </div>`));
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['erwaegung']);
  });

  it('SVG-Varianten: «Entscheidgründe»-Marker + «… erkennt:» schlägt aaTatsachen-Fehlklasse (IV.2022.64)', () => {
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=aaText>Entscheidgründe</p>
        <p class=aaText><b>1.</b> Das Gericht ist zuständig.</p>
        <p class=aaTatsachen>Die Präsidentin des Sozialversicherungsgerichts erkennt:</p>
        <p class=aaArabisch1>://: Das Verfahren wird abgeschrieben.</p>
      </div>`));
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['erwaegung', 'dispositiv']);
    expect(p.dispositivOrders).toContain('Das Verfahren wird abgeschrieben.');
  });

  it('kein Rückfall aus dem Dispositiv: aaTatsachen-Rechtsmittelbelehrung bleibt im Dispositiv (UV.2024.30)', () => {
    const p = parseBsDokument(doku(`
      <div class=WordSection1>
        <p class=MsoNormal>Erwägungen</p>
        <p class=MsoNormal><b>1.</b> Erste Erwägung.</p>
        <p class=MsoNormal>Demgemäss erkennt das Sozialversicherungsgericht:</p>
        <p class=MsoNormal>://: Die Beschwerde wird abgewiesen.</p>
        <p class=aaTatsachen>Rechtsmittelbelehrung</p>
        <p class=MsoNormal>Gegen diesen Entscheid kann innert 30 Tagen Beschwerde erhoben werden.</p>
      </div>`));
    expect(p.abschnitte.map((a) => a.typ)).toEqual(['erwaegung', 'dispositiv']);
    const disp = p.abschnitte[1].bloecke.map((b) => b.text).join('\n');
    expect(disp).toContain('Rechtsmittelbelehrung');
  });
});

describe('kopfDatum — Entscheiddatum aus dem Deckblatt (B-1, strukturell)', () => {
  const e = (...t: string[]) => t.map((text) => ({ text }));
  it('Titelzeile + Ganzabsatz «vom …» ⇒ ISO-Datum (inkl. NBSP, Präsidial-Titel)', () => {
    expect(kopfDatum(e('Appellationsgericht', 'BES.2024.88', 'ENTSCHEID', 'vom 15. September 2025', 'Mitwirkende'))).toBe('2025-09-15');
    expect(kopfDatum(e('BV.2022.14', 'Urteil der Präsidentin', 'vom\u00a025. April 2023'))).toBe('2023-04-25');
    expect(kopfDatum(e('X', 'URTEIL', 'vom 2. Februar 2022'))).toBe('2022-02-02');
  });
  it('kein Treffer ohne Titelzeile davor oder bei Satz statt Ganzabsatz', () => {
    expect(kopfDatum(e('Mitwirkende', 'vom 15. September 2025'))).toBeNull();
    expect(kopfDatum(e('ENTSCHEID', 'Mit Eingabe vom 23. November 2023 reichte A____ Strafanzeige ein.'))).toBeNull();
  });
  it('Kalender-Gegenprobe: «vom 31. April» ist kein Datum', () => {
    expect(kopfDatum(e('URTEIL', 'vom 31. April 2025'))).toBeNull();
  });
  it('nur im Kopf-Fenster (die ersten 12 Einheiten)', () => {
    const lang = e(...Array.from({ length: 12 }, (_, i) => `Absatz ${i}`), 'URTEIL', 'vom 1. März 2024');
    expect(kopfDatum(lang)).toBeNull();
  });
  it('Plausibilität: nicht vor dem GN-Jahr, nicht nach der Erstpublikation', () => {
    expect(plausiblesKopfDatum('2025-09-15', 2024, '2026-04-10')).toBe('2025-09-15');
    expect(plausiblesKopfDatum('2023-12-31', 2024, null)).toBeNull();
    expect(plausiblesKopfDatum('2026-05-01', 2024, '2026-04-10')).toBeNull();
    expect(plausiblesKopfDatum(null, 2024, null)).toBeNull();
  });
});
