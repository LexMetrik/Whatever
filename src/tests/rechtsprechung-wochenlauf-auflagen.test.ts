// Auflagen der Gegenprüfung #1113 (Spec W2, 25.9.2026) — je Punkt mindestens
// ein Test; jeder Block nennt die Mutation, die ihn rot macht (Rot-Beweis in
// der Bau-Rückgabe).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  kantonalAusfall, uebrigeAufruf, entscheide, waehleStichprobe, type Lage, type RegEintrag, type StichprobenZeile,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { baueBericht, type BerichtDaten } from '../../scripts/rechtsprechung/wochenlauf-bericht';
import {
  befundBlock, leseBefundBlock, pruefeVorwoche, offeneBefunde, stichprobenPlan, UNBEKANNT, type Vorwoche,
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
  const { args, kantone } = uebrigeAufruf('2026-09-28');
  const kopf = `\n> lexmetrik@0.0.0 entscheide\n> vite-node scripts/normtext-entscheide.ts ${args.slice(3).join(' ')}\n\n`;
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
