// Auflagen der Gegenprüfung #1113 (Spec W2, 25.9.2026) — je Punkt mindestens
// ein Test; jeder Block nennt die Mutation, die ihn rot macht (Rot-Beweis in
// der Bau-Rückgabe).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  kantonalAusfall, entscheide, waehleStichprobe, restMinuten, leseBsDelta, budgetZeilen, budgetBefund, anteilText,
  aktiveGerichte, AUSGENOMMEN, DATUM_VOLLPRUEFUNG, KALENDER_TORE, EIDG_GERICHTE, KANTONS_GERICHTE,
  type Lage, type RegEintrag, type StichprobenZeile,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { frische } from '../../scripts/rechtsprechung/wochenlauf-netz';
import { DATEN_BUDGET } from '../../scripts/perf/daten-budget';
import { baueBericht, type BerichtDaten } from '../../scripts/rechtsprechung/wochenlauf-bericht';
import {
  befundBlock, leseBefundBlock, pruefeVorwoche, offeneBefunde, stichprobenPlan, identitaetGeaendert, bsAktualisiertEintraege,
  mitFrist, ungeprueft, NICHT_GEPRUEFT, UNBEKANNT, type Vorwoche,
} from '../../scripts/rechtsprechung/wochenlauf-vorwoche';

const e = (key: string, gericht: string, datum = '2026-09-10', x: Partial<RegEintrag> = {}): RegEintrag => ({ key, gericht, datum, ...x });
const z = (key: string, ergebnis: StichprobenZeile['ergebnis'], detail = ''): StichprobenZeile => ({ key, url: null, ergebnis, detail });
const gruen: Lage = {
  inhaltsDiff: true, quellenAus: [], toreRot: [], nachbauRot: [], mergeSchutzSperrt: true,
  stichprobe: [z('a', 'treffer')], unerwartet: [], budgetUeber: [], vorwocheVerworfen: null,
};
function bericht(x: Partial<BerichtDaten>): BerichtDaten {
  return {
    datum: '2026-09-28', modus: 'woche', baender: { vor: 151, lauf: 152 }, basis: { branch: null, nr: null, vorwocheVerworfen: null },
    quellen: [], nachbau: [], vergleich: { neu: [], entfernt: [], jeGericht: [] }, dieseWoche: { neu: 0, entfernt: 0 },
    bs: { aktualisiert: [], takedown: [] }, bsVoll: null, guards: [], tore: [], stichprobe: [], budget: [], frische: [], unerwartet: [],
    entscheid: { entscheid: 'pr', gruende: [] }, mergeSchutzSperrt: true, laufUrl: null, ...x,
  };
}

describe('A1 · kantonaler Ausfall trotz npm-Kopfzeile erkannt', () => {
  // Form der Prüfer-Probe gp1113/npmprobe/out.txt: npm druckt den ganzen Aufruf
  // samt «--courts=zh_obergericht,be_verwaltungsgericht» vor jede Ausgabe.
  // Zwei Gerichte FEST (nicht aus uebrigeAufruf): A1 prüft die Anker-Logik, nicht die aktive
  // Auswahl — BE ist seit dem Probelauf 25.9.2026 ausgenommen (AUSGENOMMEN, M8).
  const kantone = ['zh_obergericht', 'be_verwaltungsgericht'];
  const kopf = `\n> lexmetrik@0.0.0 entscheide\n> vite-node scripts/normtext-entscheide.ts --datum=2026-09-28 --additiv --courts=${kantone.join(',')} --eidg=bvger,bstger,bpatger\n\n`;
  it('nur die npm-Kopfzeile im Log ⇒ beide Gerichte stumm (Ausfall)', () => {
    // Mutation: Anker «^\[kanton\] <gericht>:» zurück auf blosse Wortgrenze ⇒ [] (Befund A1).
    expect(kopf).toContain('--courts=zh_obergericht,be_verwaltungsgericht');
    expect(kantonalAusfall(true, kantone, kopf)).toEqual(['kantonal: keine Rückmeldung im Generator-Log für zh_obergericht, be_verwaltungsgericht — AUSFALL']);
  });
  it('Kopfzeile + eine echte [kanton]-Zeile ⇒ nur das fehlende Gericht ist Ausfall', () => {
    const log = `${kopf}[eidg] bvger: 5 gewählt\n[kanton] zh_obergericht: 24 de → 6 gewählt (Regeste: 2; Datum 2026-07-01…2026-08-06)\n[additiv] übersprungen (1): be_verwaltungsgericht (0 IDs)\n`;
    expect(kantonalAusfall(true, kantone, log)).toEqual(['kantonal: keine Rückmeldung im Generator-Log für be_verwaltungsgericht — AUSFALL']);
  });
  it('«übersprungen»-Zeile zählt als Rückmeldung (bleibt über erkenneAusfaelle Ausfall), Einrückung/Präfix nicht', () => {
    const log = `${kopf}[kanton] zh_obergericht: 24 de → 6 gewählt\n[kanton] be_verwaltungsgericht: übersprungen — 0 IDs (Listing nicht erreichbar)\n`;
    expect(kantonalAusfall(true, kantone, log)).toEqual([]);
    expect(kantonalAusfall(true, ['zh_obergericht'], 'x [kanton] zh_obergericht: 6 gewählt')).toHaveLength(1);
  });
});

describe('A2 · Befund der Vorwoche verschwindet nicht', () => {
  // Woche 1: bvger_X ist Fehltreffer. Woche 2 baut auf dem offenen Entwurf auf
  // und bringt so viele neue Einträge, dass die normale Auswahl X nicht zieht.
  const X = e('bvger_X', 'bvger', '2026-09-01', { nummer: 'X-1/2026' });
  const woche1 = [z('bge_1', 'treffer'), z('bvger_X', 'fehltreffer', 'X-1/2026 · PDF · Datum amtlich 2026-09-02 ≠ Korpus/OCL 2026-09-01')];
  const body1 = baueBericht(bericht({ stichprobe: woche1, entscheid: { entscheid: 'entwurf', gruende: ['Stichprobe: 1 Fehltreffer'] }, befunde: offeneBefunde(woche1, []) }));
  const vw: Vorwoche = { entwurf: true, ...leseBefundBlock(body1) };
  const neu2 = [X, ...Array.from({ length: 30 }, (_, i) => e(`bvger_${String(i).padStart(2, '0')}`, 'bvger')), ...Array.from({ length: 30 }, (_, i) => e(`bstger_${i}`, 'bstger'))];

  it('Woche 1 schreibt den Befund maschinenlesbar in den Body (Block vor dem Trailer-Absatz)', () => {
    expect(vw.befunde).toEqual([{ key: 'bvger_X', grund: woche1[1].detail }]);
    expect(body1.indexOf('wochenlauf-befunde v1')).toBeLessThan(body1.indexOf('Roadmap: QS-KORPUS'));
    expect(body1).toContain('`bvger_X`: X-1/2026');
  });
  it('Woche 2 prüft X zwingend erneut, zusätzlich zu n', () => {
    // Mutation: vorKeys in stichprobenPlan ignorieren ⇒ X fehlt (so wie in der normalen Auswahl).
    expect(waehleStichprobe(neu2, 12).map((x) => x.key)).not.toContain('bvger_X');
    const plan = stichprobenPlan(neu2, 12, neu2, vw.befunde!.map((b) => b.key));
    expect(plan.map((x) => x.key)).toContain('bvger_X');
    expect(plan).toHaveLength(13);
  });
  it('X weiter falsch ⇒ Entwurf, Befund bleibt offen; X jetzt grün ⇒ PR (Entwurf darf fallen)', () => {
    // Mutation: g.push(...(l.vorwocheOffen ?? [])) in entscheide() entfernen ⇒ 'pr' trotz offenem X.
    const falsch = [z('bstger_1', 'treffer'), z('bvger_X', 'nicht-pruefbar', 'Quelle nicht erreichbar')];
    const v1 = pruefeVorwoche(vw, falsch);
    expect(v1.offen.map((b) => b.key)).toEqual(['bvger_X']);
    expect(entscheide({ ...gruen, stichprobe: falsch, vorwocheOffen: v1.gruende })).toEqual({ entscheid: 'entwurf', gruende: ['Vorwochen-Befund nicht erneut grün: bvger_X'] });
    expect(offeneBefunde(falsch, v1.offen)).toEqual([{ key: 'bvger_X', grund: 'erneut nicht-pruefbar: Quelle nicht erreichbar' }]);
    const gut = [z('bstger_1', 'treffer'), z('bvger_X', 'treffer')];
    const v2 = pruefeVorwoche(vw, gut);
    expect(v2).toEqual({ gruende: [], offen: [] });
    expect(entscheide({ ...gruen, stichprobe: gut, vorwocheOffen: v2.gruende }).entscheid).toBe('pr');
  });
  it('X nicht mehr im Register ⇒ bleibt offen (kein stilles Verschwinden)', () => {
    expect(stichprobenPlan(neu2.slice(1), 12, neu2.slice(1), ['bvger_X']).map((x) => x.key)).not.toContain('bvger_X');
    expect(pruefeVorwoche(vw, [z('bstger_1', 'treffer')]).gruende).toEqual(['Vorwochen-Befund nicht erneut grün: bvger_X']);
  });
  it('Entwurf der Vorwoche ohne lesbaren Block wird nie automatisch aufgehoben', () => {
    expect(pruefeVorwoche({ entwurf: true, befunde: null }, [z('a', 'treffer')]).offen).toEqual([{ key: UNBEKANNT, grund: 'Entwurf ohne Befund-Block' }]);
    const kaputt = leseBefundBlock('x\n<!-- wochenlauf-befunde v1\n[{"key":1}]\n-->');
    expect(kaputt).toEqual({ befunde: null, kaputt: true });
    expect(pruefeVorwoche({ entwurf: false, ...kaputt }, []).gruende).toHaveLength(1);
    // Kein Entwurf und kein Block (älterer, grüner PR) ⇒ nichts offen.
    expect(pruefeVorwoche({ entwurf: false, befunde: null }, [])).toEqual({ gruende: [], offen: [] });
  });
  it('Block übersteht CRLF und «-->» im Grund', () => {
    const b = [{ key: 'k', grund: 'a --> b <!-- c' }];
    expect(leseBefundBlock(`kopf\r\n${befundBlock(b).replace(/\n/g, '\r\n')}\r\nfuss`)).toEqual({ befunde: b, kaputt: false });
  });
  it('Basis liest Body + Entwurf-Status des offenen PR; yml hebt Entwurf nur bei Entscheid «pr»', () => {
    const basis = readFileSync('scripts/rechtsprechung/wochenlauf-basis.ts', 'utf8');
    expect(basis).toMatch(/'--json', 'body,isDraft'/);
    expect(basis).toMatch(/vorwoche: \{ entwurf: pv\.isDraft, \.\.\.leseBefundBlock\(/);
    const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
    expect(yml).toMatch(/if \[ "\$ENTSCHEID" = "entwurf" \]; then gh pr ready "\$nr" --undo/);
    // CLI: Plan mit Vorwochen-Keys, Entscheid mit vorwocheOffen, Block in den Bericht.
    const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
    expect(cli).toMatch(/stichprobenPlan\([^)]*\(vorwoche\?\.befunde \?\? \[\]\)\.map\(\(x\) => x\.key\)\)/);
    expect(cli).toMatch(/vorwocheOffen: vw\.gruende/);
    expect(cli).toMatch(/befunde: offeneBefunde\(stichprobe, vw\.offen\)/);
  });
});

describe('N1 · Gerichte mit unzuverlässigem Datum: Vollprüfung', () => {
  const be = Array.from({ length: 6 }, (_, i) => e(`be_verwaltungsgericht_${i}`, 'be_verwaltungsgericht', '2026-08-3' + (i % 2)));
  const andere = Array.from({ length: 40 }, (_, i) => e(`bvger_${String(i).padStart(2, '0')}`, 'bvger'));
  it('eine Stelle: BE, seit der Wiederaufnahme 26.9.2026 auch SG/AG/GR; keines mehr ausgenommen', () => {
    expect([...DATUM_VOLLPRUEFUNG].sort()).toEqual(['ag_gerichte', 'be_verwaltungsgericht', 'gr_gerichte', 'sg_gerichte']);
    expect(AUSGENOMMEN).not.toHaveProperty('be_verwaltungsgericht');
  });
  it('JEDER neue BE-Eintrag in der Stichprobe, zusätzlich zu n', () => {
    // Mutation: DATUM_VOLLPRUEFUNG-Filter in stichprobenPlan entfernen ⇒ nur ein Teil der BE-Einträge.
    const plan = stichprobenPlan([...andere, ...be], 12, [...andere, ...be], []);
    expect(plan.filter((x) => x.gericht === 'be_verwaltungsgericht').map((x) => x.key).sort()).toEqual(be.map((x) => x.key));
    expect(plan).toHaveLength(18);
  });
  it('geänderter BE-Eintrag (Datum) geht ebenfalls in die Stichprobe', () => {
    const alt = e('be_verwaltungsgericht_alt', 'be_verwaltungsgericht', '2026-05-20', { nummer: '100.2026.12U' });
    const neu = { ...alt, datum: '2026-05-21' };
    const geaendert = identitaetGeaendert([alt, andere[0]], [neu, andere[0]]);
    expect(geaendert.map((x) => x.key)).toEqual(['be_verwaltungsgericht_alt']);
    expect(identitaetGeaendert([alt], [{ ...alt, titel: 'x' } as RegEintrag])).toEqual([]); // nur Identitätsfelder
    expect(stichprobenPlan([...andere, ...geaendert], 12, [...andere, neu], []).map((x) => x.key)).toContain('be_verwaltungsgericht_alt');
  });
  it('CLI: Pool = neu ∪ Identität geändert ∪ BS aktualisiert', () => {
    const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
    expect(cli).toMatch(/const pool = \[\.\.\.vergleich\.neu, \.\.\.identitaetGeaendert\(vorherMain, jetzt\), \.\.\.bsAktualisiertEintraege\(bs\.aktualisiert, jetzt\)\];/);
    expect(cli).toMatch(/stichprobenPlan\(pool, stichprobeN, jetzt,/);
  });
});

describe('N2 · Lauf-Frist deckt Stichprobe und Frische', () => {
  it('Fake-Uhr: nach der Frist keine Abrufe mehr, Rest «nicht geprüft» ⇒ Entwurf', async () => {
    // Mutation: in mitFrist weiter() ignorieren ⇒ alle 5 abgerufen, uebersprungen 0.
    let uhr = 0;
    const weiter = () => restMinuten(0, uhr, 60) > 0;
    const abgerufen: string[] = [];
    const xs = ['a', 'b', 'c', 'd', 'e'].map((k) => e(k, 'bvger'));
    const r = await mitFrist(xs, weiter, async (x) => { abgerufen.push(x.key); uhr += 30 * 60_000; return z(x.key, 'treffer'); }, ungeprueft);
    expect(abgerufen).toEqual(['a', 'b']);
    expect(r.uebersprungen).toBe(3);
    expect(r.out.slice(2).map((x) => [x.ergebnis, x.detail])).toEqual(Array(3).fill(['nicht-pruefbar', NICHT_GEPRUEFT]));
    expect(entscheide({ ...gruen, stichprobe: r.out, fristAus: [`Stichprobe ${r.uebersprungen} von ${xs.length}`] })).toEqual({ entscheid: 'entwurf', gruende: ['Lauf-Frist erreicht, nicht geprüft: Stichprobe 3 von 5'] });
  });
  it('Frische nach der Frist: kein Netz-Abruf, jede Zeile «nicht geprüft»', async () => {
    const fr = await frische('2026-09-28', [e('bvger_1', 'bvger', '2026-09-01')], () => false);
    expect(fr.uebersprungen).toBe(aktiveGerichte([...EIDG_GERICHTE, ...KANTONS_GERICHTE]).length);
    expect(fr.zeilen.every((f) => f.hinweis === NICHT_GEPRUEFT)).toBe(true);
    expect(fr.zeilen.find((f) => f.gericht === 'bvger')?.register).toBe('2026-09-01');
  });
  it('Budget: Frist + Setup + ein begonnener Abruf + PR-Schritt < Job-Timeout; CLI verdrahtet', () => {
    const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
    const job = Number(/timeout-minutes: (\d+)/.exec(yml)![1]);
    const frist = Number(/--frist-min=(\d+)/.exec(yml)![1]);
    expect(frist + 10 + 5 + 5).toBeLessThan(job);
    const cli = readFileSync('scripts/rechtsprechung/wochenlauf.ts', 'utf8');
    expect(cli).toMatch(/mitFrist\(plan, weiter, stichprobeZeile, ungeprueft\)/);
    expect(cli).toMatch(/await frische\(datum, jetzt, weiter\)/);
    expect(cli).toMatch(/vorwocheOffen: vw\.gruende, fristAus,/);
  });
});

describe('N3 · aktualisierte BS-Einträge in der Stichprobe', () => {
  const reg = ['AUS.2026.77', 'AUS.2026.78', 'BES.2026.1'].map((n) => e(`bs_appellationsgericht_${n}`, 'bs_appellationsgericht', '2026-09-17', { quelle: 'gerichte-bs', nummer: n, datei: `kanton/BS/bs_appellationsgericht/${n}.json` }));
  // Zeilenform: bs-delta.ts berichteBsDelta (Plan wird zweimal gedruckt).
  const log = [
    '[bs-delta] Plan: +0 neu · 2 aktualisiert · 3760 unverändert (byte-treu) · −0 Takedown',
    '[bs-delta]   aktualisiert: kanton/BS/bs_appellationsgericht/AUS.2026.77 (key 80073): inhalt',
    '[bs-delta]   aktualisiert: kanton/BS/bs_appellationsgericht/BES.2026.1 (key 80110): besetzung; dispositiv',
    '[bs-delta]   aktualisiert: kanton/BS/bs_appellationsgericht/AUS.2026.77 (key 80073): inhalt',
  ].join('\n');
  it('Log → Register-Einträge über `datei`; Vollabgleich ohne neue Einträge hat trotzdem eine Stichprobe', () => {
    // Mutation: bsAktualisiertEintraege liefert [] ⇒ Stichprobe leer ⇒ Vollabgleich immer Entwurf.
    const akt = bsAktualisiertEintraege(leseBsDelta(log).aktualisiert, reg);
    expect(akt.map((x) => x.nummer)).toEqual(['AUS.2026.77', 'BES.2026.1']);
    expect(stichprobenPlan(akt, 12, reg, []).map((x) => x.key)).toEqual(['bs_appellationsgericht_AUS.2026.77', 'bs_appellationsgericht_BES.2026.1']);
  });
  it('«kein prüfbarer Treffer» nur, wenn nichts geprüft werden konnte; leere Stichprobe eigener Grund', () => {
    // Mutation: alte Regel «!some(treffer)» ⇒ bei reinem Fehltreffer zusätzlich «kein einziger prüfbarer Treffer».
    expect(entscheide({ ...gruen, stichprobe: [z('a', 'fehltreffer')] }).gruende).toEqual(['Stichprobe: 1 Fehltreffer']);
    expect(entscheide({ ...gruen, stichprobe: [z('a', 'nicht-pruefbar')] }).gruende).toEqual(['Stichprobe: kein einziger prüfbarer Treffer']);
    expect(entscheide({ ...gruen, stichprobe: [] }).gruende).toEqual(['Stichprobe leer: kein neuer oder aktualisierter Eintrag im Diff prüfbar']);
  });
});

describe('N4 · kalendergebundene Tore oben erklärt', () => {
  it('check:verfall rot ⇒ Entwurf bleibt, Erklärung steht vor den Zahlen', () => {
    // Mutation: kalender-Zeile in baueBericht entfernen ⇒ Erklärung fehlt.
    const ent = entscheide({ ...gruen, toreRot: ['check:verfall'] });
    expect(ent.entscheid).toBe('entwurf');
    const body = baueBericht(bericht({ tore: [{ name: 'check:verfall', code: 1, auszug: 'verfallen' }, { name: 'npm test', code: 0, auszug: '' }], entscheid: ent }));
    const i = body.indexOf('Kalendergebunden — trifft auch main, kein Befund dieses Nachzugs:** check:verfall');
    expect(i).toBeGreaterThan(0);
    expect(i).toBeLessThan(body.indexOf('## Zahlen je Gericht'));
    expect(body).toContain('**ROT** (Exit 1) — kalendergebunden: verfallen');
    expect(baueBericht(bericht({ tore: [{ name: 'npm test', code: 1, auszug: 'x' }] }))).not.toContain('Kalendergebunden');
  });
  it('jedes Kalender-Tor läuft in check:seriell und liest die Wanduhr', () => {
    const skripte = JSON.parse(readFileSync('package.json', 'utf8')).scripts as Record<string, string>;
    for (const t of KALENDER_TORE) {
      expect(skripte['check:seriell']).toContain(`npm run ${t} `);
      const datei = /scripts\/\S+\.ts/.exec(skripte[t])![0];
      expect(readFileSync(datei, 'utf8')).toMatch(/new Date\(\)/);
    }
  });
});

describe('N5 · Budget über 100 % nie als «100.0 %»', () => {
  it('900 KB + 1 B ⇒ «> 100 %» in Befund und Tabelle', () => {
    // Mutation: anteilText auf toFixed(1) zurück ⇒ «100.0 %».
    const R = 'public/rechtsprechung/register.json';
    const b = DATEN_BUDGET.find(([p]) => p === R)![1];
    expect(b).toBe(900 * 1024);
    const zeilen = budgetZeilen([[R, b]], { [R]: b - 10 }, { [R]: b + 1 }, []);
    expect(budgetBefund(zeilen).ueber).toEqual([`${R} > 100 %`]);
    expect(baueBericht(bericht({ budget: zeilen }))).toContain('| 900.0 KB | > 100 % |');
    expect(anteilText(0.99951)).toBe('99.9 %');
    expect(anteilText(1)).toBe('100.0 %');
    expect(anteilText(1.0512)).toBe('105.1 %');
  });
});
