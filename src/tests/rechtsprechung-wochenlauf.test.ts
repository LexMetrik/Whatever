import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  baenderFuer, vergleicheRegister, erkenneAusfaelle, leseBsDelta, waehleStichprobe,
  pruefeBge, pruefeBs, pruefeGenerisch, entscheide, mergeSchutzSperrt, baueBericht, baueCommit,
  TITEL, SCHLUSS, type RegEintrag, type BerichtDaten, type Lage,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { bandJahrVon } from '../../scripts/normtext/bge-bandjahr';
import { pruefePrKoerper } from '../../scripts/gegenpruefung/pr-schutz';
import { leseGegenpruefungAusSquash } from '../../scripts/gegenpruefung/squash-trailer';

const e = (key: string, gericht: string, datum: string, x: Partial<RegEintrag> = {}): RegEintrag => ({ key, gericht, datum, ...x });

describe('baenderFuer — Band = Jahr − 1874', () => {
  it('Randdaten: Jahreswechsel und Monatsmitte', () => {
    expect(baenderFuer('2026-09-28')).toEqual({ vor: 151, lauf: 152 });
    expect(baenderFuer('2027-01-04')).toEqual({ vor: 152, lauf: 153 });
    expect(baenderFuer('2026-12-31')).toEqual({ vor: 151, lauf: 152 });
  });
  it('ist die Umkehrung von bandJahrVon (eine Quelle, §5)', () => {
    for (const j of [2020, 2026, 2031]) expect(bandJahrVon(`${baenderFuer(`${j}-06-17`).lauf} I 1`)).toBe(j);
  });
  it('wirft ohne ISO-Datum (§2: kein stilles Heute)', () => {
    expect(() => baenderFuer('')).toThrow();
    expect(() => baenderFuer('28.9.2026')).toThrow();
  });
  it('am Bestand: kein BGE ist jünger als sein Band-Publikationsjahr, und es gibt Bände, die es erreichen', () => {
    const reg = JSON.parse(readFileSync('public/rechtsprechung/register.json', 'utf8')) as { entscheide: RegEintrag[] };
    const bge = reg.entscheide.filter((x) => x.gericht === 'bge' && x.bgeReferenz);
    expect(bge.length).toBeGreaterThan(100);
    const maxJahr = new Map<number, number>();
    for (const x of bge) {
      const band = parseInt(x.bgeReferenz!, 10);
      maxJahr.set(band, Math.max(maxJahr.get(band) ?? 0, Number(x.datum.slice(0, 4))));
    }
    for (const [band, jahr] of maxJahr) expect(jahr, `Band ${band}`).toBeLessThanOrEqual(band + 1874);
    expect([...maxJahr].some(([band, jahr]) => jahr === band + 1874)).toBe(true);
  });
});

describe('vergleicheRegister', () => {
  it('neu/entfernt/je Gericht, Verweise zählen nicht', () => {
    const vorher = [e('a', 'bge', '2026-01-01'), e('b', 'bs_x', '2026-02-03'), e('v', 'bger', '2026-01-01', { verweis: true })];
    const nachher = [e('a', 'bge', '2026-01-01'), e('c', 'bge', '2026-05-11'), e('v2', 'bger', '2026-05-11', { verweis: true })];
    const r = vergleicheRegister(vorher, nachher);
    expect(r.neu.map((x) => x.key)).toEqual(['c']);
    expect(r.entfernt.map((x) => x.key)).toEqual(['b']);
    expect(r.jeGericht).toEqual([
      { gericht: 'bge', vorher: 1, nachher: 2, neuestes: '2026-05-11' },
      { gericht: 'bs_x', vorher: 1, nachher: 0, neuestes: null },
    ]);
  });
});

describe('erkenneAusfaelle / leseBsDelta', () => {
  const log = [
    '[bge-baender] Zielbände [151,152] · Bestand 5173',
    '[bge-baender] 0 IDs enumeriert (OCL nicht erreichbar?) — Korpus unberührt.',
    '[kanton] sg_gerichte: übersprungen — 0 IDs (Listing nicht erreichbar)',
    '[additiv] übersprungen (1): sg_gerichte',
    '[bs-import] 3 Fetch-Fehler — Fehlerliste: x',
    '[eidg] bvger: 40 geholt (davon 5 schon im Bestand) → 5 gewählt',
    '[bs-delta] Plan: +2 neu · 1 aktualisiert · 3700 unverändert (byte-treu) · −1 Takedown',
    '[bs-delta]   aktualisiert: bs_appellationsgericht_ZB.2025.1 (key 7): datum 2025-01-02→2025-01-03',
    '[bs-delta]   Takedown (aus dem Portal verschwunden, wird entfernt): bs_zivilgericht_P.2024.9',
  ].join('\n');
  it('hebt Ausfall-Zeilen, nicht Erfolgszeilen', () => {
    const a = erkenneAusfaelle(log);
    expect(a).toHaveLength(4);
    expect(a.some((z) => z.startsWith('[eidg] bvger'))).toBe(false);
  });
  it('liest den BS-Delta-Plan', () => {
    expect(leseBsDelta(log)).toEqual({
      aktualisiert: ['bs_appellationsgericht_ZB.2025.1 (key 7): datum 2025-01-02→2025-01-03'],
      takedown: ['bs_zivilgericht_P.2024.9'],
    });
  });
});

describe('waehleStichprobe', () => {
  const bge = Array.from({ length: 30 }, (_, i) => e(`bge_152_I_${100 + i}`, 'bge', '2026-03-01'));
  const bs = Array.from({ length: 20 }, (_, i) => e(`bs_a_${100 + i}`, 'bs_appellationsgericht', '2026-03-01', { quelle: 'gerichte-bs' }));
  const ueb = [e('bvger_1', 'bvger', '2026-03-01'), e('zh_1', 'zh_obergericht', '2026-03-01')];
  it('mischt die Gruppen reihum, deterministisch, n Stück', () => {
    const s = waehleStichprobe([...ueb, ...bs, ...bge], 12);
    expect(s).toHaveLength(12);
    expect(s.filter((x) => x.gericht === 'bge')).toHaveLength(5);
    expect(s.filter((x) => x.quelle === 'gerichte-bs')).toHaveLength(5);
    expect(s.filter((x) => x.gericht !== 'bge' && x.quelle !== 'gerichte-bs')).toHaveLength(2);
    expect(waehleStichprobe([...bge, ...ueb, ...bs], 12)).toEqual(s);
  });
  it('übrige (meist PDF) höchstens 2, solange BGE/BS die Plätze füllen; sonst füllen sie auf', () => {
    const viele = Array.from({ length: 20 }, (_, i) => e(`bvger_${10 + i}`, 'bvger', '2026-03-01'));
    const s = waehleStichprobe([...viele, ...bge], 12);
    expect(s.filter((x) => x.gericht === 'bvger')).toHaveLength(2);
    expect(s.filter((x) => x.gericht === 'bge')).toHaveLength(10);
    expect(waehleStichprobe(viele, 12)).toHaveLength(12);
  });
  it('nimmt alle, wenn weniger als n neu sind', () => {
    expect(waehleStichprobe(ueb, 12)).toHaveLength(2);
    expect(waehleStichprobe([], 12)).toEqual([]);
  });
});

describe('Identität gegen die amtliche Seite (Wortgrenze, nie Substring — §0 Ziff. 2)', () => {
  // Nachbau der clir-Seite 152 V 122 (Struktur wie www/search.bger.ch am 25.9.2026)
  const clir = '<div class="content"><b>Urteilskopf</b><br><br><div class="paraatf">152 V 122</div>'
    + '<div>14. Auszug aus dem Urteil der IV. öffentlich-rechtlichen Abteilung i.S. A. gegen IV-Stelle '
    + '8C_484/2025 vom 11. Mai 2026</div><div id="regeste">Regeste …</div></div>';
  const bgeE = e('bge_152_V_122', 'bge', '2026-05-11', { bgeReferenz: '152 V 122' });
  it('BGE: Treffer bei eigener Fundstelle + Datum', () => {
    expect(pruefeBge(clir, bgeE).treffer).toBe(true);
  });
  it('BGE: Präfix-Falle 152 V 12 ≠ 152 V 122', () => {
    expect(pruefeBge(clir, { ...bgeE, bgeReferenz: '152 V 12' }).treffer).toBe(false);
  });
  it('BGE: Datum weicht ab → Fehltreffer; Bandjahr-Platzhalter prüft nur die Fundstelle', () => {
    expect(pruefeBge(clir, { ...bgeE, datum: '2026-05-12' }).treffer).toBe(false);
    expect(pruefeBge(clir, { ...bgeE, datum: '2026-01-01' }).treffer).toBe(true);
  });
  const bsSeite = '<td>Gesch&auml;ftsnummer:</td><td>AUS.2026.54 (AG.2026.426)</td><td>Entscheiddatum:</td><td>08.07.2026</td>';
  const bsE = e('bs_appellationsgericht_AUS.2026.54', 'bs_appellationsgericht', '2026-07-08', { nummer: 'AUS.2026.54', quelle: 'gerichte-bs' });
  it('BS: Geschäftsnummer + Entscheiddatum', () => {
    expect(pruefeBs(bsSeite, bsE).treffer).toBe(true);
    expect(pruefeBs(bsSeite, { ...bsE, nummer: 'AUS.2026.5' }).treffer).toBe(false);
    expect(pruefeBs(bsSeite, { ...bsE, datum: '2026-07-07' }).treffer).toBe(false);
  });
  it('übrige: nur der positive Beleg zählt (Wortgrenze); PDF/fehlend = nicht prüfbar', () => {
    const s = '<p>Urteil F-4218/2026 vom 19. Juni 2026; vgl. UE240310 und B 2024/58</p>';
    expect(pruefeGenerisch(s, e('k', 'bvger', '2026-06-19', { nummer: 'F-4218/2026' })).treffer).toBe(true);
    expect(pruefeGenerisch(s, e('k', 'sg_gerichte', '2026-06-19', { nummer: 'B 2024/58, B 2024/59' })).treffer).toBe(true);
    expect(pruefeGenerisch(s, e('k', 'bvger', '2026-06-19', { nummer: 'F-421/2026' })).treffer).toBeNull();
    expect(pruefeGenerisch(s, e('k', 'zh_obergericht', '2026-06-19', { nummer: 'UE24031' })).treffer).toBeNull();
    expect(pruefeGenerisch('%PDF-1.7 … F-4218/2026', e('k', 'bstger', '2026-06-19', { nummer: 'F-4218/2026' })).treffer).toBeNull();
  });
});

describe('entscheide — kein Diff / Entwurf / PR', () => {
  const gruen: Lage = {
    inhaltsDiff: true, toreRot: [], nachbauRot: [], mergeSchutzSperrt: true,
    stichprobe: [{ key: 'a', url: null, ergebnis: 'treffer', detail: '' }],
  };
  it('kein Diff → kein PR, auch wenn etwas rot wäre', () => {
    expect(entscheide({ ...gruen, inhaltsDiff: false, toreRot: ['check:x'] }).entscheid).toBe('kein-diff');
  });
  it('alles grün → PR', () => expect(entscheide(gruen)).toEqual({ entscheid: 'pr', gruende: [] }));
  it('jede rote Bedingung allein → Entwurf mit Grund', () => {
    expect(entscheide({ ...gruen, toreRot: ['check:normkeys'] }).gruende).toEqual(['Tor rot: check:normkeys']);
    expect(entscheide({ ...gruen, nachbauRot: ['Projektionen'] }).entscheid).toBe('entwurf');
    expect(entscheide({ ...gruen, stichprobe: [...gruen.stichprobe, { key: 'b', url: null, ergebnis: 'fehltreffer', detail: '' }] }).entscheid).toBe('entwurf');
    expect(entscheide({ ...gruen, stichprobe: [{ key: 'b', url: null, ergebnis: 'nicht-pruefbar', detail: '' }] }).entscheid).toBe('entwurf');
    expect(entscheide({ ...gruen, mergeSchutzSperrt: false }).entscheid).toBe('entwurf');
  });
});

describe('Merge-Schutz: «ausstehend» sperrt die Landung bis zum Verdikt', () => {
  const daten: BerichtDaten = {
    datum: '2026-09-28', baender: { vor: 151, lauf: 152 },
    quellen: [{ name: 'Basel-Stadt (Delta)', befehl: 'npm run entscheide:bs', code: 1, ausfaelle: ['[bs-import] 3 Fetch-Fehler'] }],
    nachbau: [],
    vergleich: { neu: [e('c', 'bge', '2026-05-11')], entfernt: [], jeGericht: [{ gericht: 'bge', vorher: 1, nachher: 2, neuestes: '2026-05-11' }] },
    bs: { aktualisiert: [], takedown: [] },
    tore: [{ name: 'check:normkeys', code: 1, auszug: 'ROT | Schwelle 20' }],
    stichprobe: [{ key: 'c', url: 'https://search.bger.ch/x', ergebnis: 'treffer', detail: '152 V 122' }],
    entscheid: { entscheid: 'entwurf', gruende: ['Tor rot: check:normkeys'] },
    mergeSchutzSperrt: true, laufUrl: null,
  };
  const body = baueBericht(daten);
  it('Risiko-Pfad: Korpus-Dateien allein sperren NICHT, Manifest/Daten schon', () => {
    expect(mergeSchutzSperrt(['public/rechtsprechung/register.json'])).toBe(false);
    expect(mergeSchutzSperrt(['public/rechtsprechung/register.json', 'daten-manifest.json'])).toBe(true);
    expect(mergeSchutzSperrt(['daten/bs-fiw/inventar.json'])).toBe(true);
  });
  it('der Queue-Squash aus Titel+Body trägt «ausstehend» — formal untauglich ⇒ rot', () => {
    expect(leseGegenpruefungAusSquash(`${TITEL(daten.datum)}\n\n${body}`)).toEqual(['ausstehend — Wochenlauf, Prüfung vor Landung']);
    expect(pruefePrKoerper(TITEL(daten.datum), body).art).toBe('mangel');
  });
  it('setzt die Session ein taugliches Verdikt ein, ist der Body gültig', () => {
    const mitVerdikt = body.replace(/^Gegenpruefung: .*$/m,
      'Gegenpruefung: bestanden (Opus 5.5, Identitaet/normKeys) — 12/12 Stichproben blind gegen die Amtsquelle');
    expect(pruefePrKoerper(TITEL(daten.datum), mitVerdikt).art).toBe('gueltig');
  });
  it('Schlussabsatz: Zeilen < 72 Zeichen, letzter Absatz, Ausfall und rotes Tor sichtbar', () => {
    for (const z of SCHLUSS.split('\n').slice(2)) expect(z.length).toBeLessThan(72);
    expect(body.trimEnd().endsWith(SCHLUSS)).toBe(true);
    expect(body).toContain('**ENTWURF — rot:** Tor rot: check:normkeys');
    expect(body).toContain('Basel-Stadt (Delta)** (Exit 1, Änderungen dieses Schritts verworfen)');
    expect(body).toContain('1/1 Treffer');
    expect(baueCommit(daten).trimEnd().split('\n').slice(-2)).toEqual(['Roadmap: QS-KORPUS', 'Gegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung']);
  });
});
