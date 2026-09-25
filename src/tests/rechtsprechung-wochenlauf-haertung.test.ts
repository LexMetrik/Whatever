// Härtung des Rechtsprechungs-Wochenlaufs (Spec W, 25.9.2026) — je Muss-Punkt
// mindestens ein Test. Rot-Beweise: jeder Block nennt die Mutation, die ihn rot
// macht (Beleg in der Bau-Rückgabe).
import { describe, it, expect, beforeAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  erkenneAusfaelle, erkenneGuardBefunde, kantonalAusfall, entscheide, leseBsDelta, leseBsVoll, waehleStichprobe,
  pruefeText, aktenzeichenVarianten, amtlichesDatum, oclIdFuerPdf, budgetZeilen, budgetBefund, bewerteFrische,
  teilePfade, leseStatusZ, inPruefung, zerlegeRunParallel, e2eAuswahl, restMinuten, vergleicheRegister, BOT,
  type Lage, type RegEintrag,
} from '../../scripts/rechtsprechung/wochenlauf-kern';
import { baueBericht, baueSummary, kopfsatz, type BerichtDaten } from '../../scripts/rechtsprechung/wochenlauf-bericht';
import { fuegeStuecke, pdfText } from '../../scripts/rechtsprechung/wochenlauf-pdf';
import { baueAufVorwoche, type Git } from '../../scripts/rechtsprechung/wochenlauf-basis';
import { ergaenzeInhaltsAbweichungen, VOLLABGLEICH_DECKEL, type BsDeltaPlan } from '../../scripts/rechtsprechung/bs-delta';
import { DATEN_BUDGET } from '../../scripts/perf/daten-budget';
import { RECHTSSCHUTZ, istFlaeche } from '../../scripts/analyse/steuerflaecheKern';
import type { EntscheidSnapshot } from '../../src/lib/rechtsprechung/typen';

const e = (key: string, gericht: string, datum: string, x: Partial<RegEintrag> = {}): RegEintrag => ({ key, gericht, datum, ...x });
const gruen: Lage = {
  inhaltsDiff: true, quellenAus: [], toreRot: [], nachbauRot: [], mergeSchutzSperrt: true,
  stichprobe: [{ key: 'a', url: null, ergebnis: 'treffer', detail: '' }], unerwartet: [], budgetUeber: [], vorwocheVerworfen: null,
};

describe('1 · Quellen-Ausfall ⇒ Entwurf (Bug B1)', () => {
  it('Teilausfall EINER Quelle bei Diff einer anderen ⇒ Entwurf mit Grund', () => {
    // Mutation: Zeile «if (l.quellenAus.length) …» in entscheide() entfernen ⇒ 'pr'.
    const r = entscheide({ ...gruen, quellenAus: ['Übrige Gerichte (additiv)'] });
    expect(r).toEqual({ entscheid: 'entwurf', gruende: ['Quelle ausgefallen: Übrige Gerichte (additiv)'] });
  });
  it('Kopfsatz «alles grün» nennt die erreichten Quellen, der Entwurf den Grund', () => {
    const d = { entscheid: { entscheid: 'pr', gruende: [] } } as unknown as BerichtDaten;
    expect(kopfsatz(d)).toContain('Alle Quellen erreicht');
    expect(kopfsatz({ ...d, entscheid: { entscheid: 'entwurf', gruende: ['Quelle ausgefallen: X'] } })).toBe('> **ENTWURF — rot:** Quelle ausgefallen: X');
  });
});

describe('2 · ruhige Woche ist kein Ausfall (A8)', () => {
  it('«[bs-delta] nichts zu tun — Korpus unberührt.» und bs-fetch mit 0 Fehlern melden keinen Ausfall', () => {
    // Mutation: RUHIG_MUSTER leeren ⇒ beide Zeilen als Ausfall (Stand vor dem Fix, reproduziert 25.9.2026).
    expect(erkenneAusfaelle([
      '[bs-delta] Plan: +0 neu · 0 aktualisiert · 3950 unverändert (byte-treu) · −0 Takedown',
      '[bs-delta] nichts zu tun — Korpus unberührt.',
      '[bs-fetch] FERTIG: 0 geholt, 0 übersprungen, 0 Fehler.',
      '[bs-fetch] 25 geholt / 3 übersprungen / 0 Fehler (28/40)',
    ].join('\n'))).toEqual([]);
  });
  it('echte Ausfälle bleiben Ausfälle — auch mit «Korpus unberührt» oder Fehlern im Fortschritt', () => {
    expect(erkenneAusfaelle('[bge-baender] 0 IDs enumeriert (OCL nicht erreichbar?) — Korpus unberührt.')).toHaveLength(1);
    expect(erkenneAusfaelle('[bs-parse] 0 Snapshots — Korpus unberührt.')).toHaveLength(1);
    expect(erkenneAusfaelle('[bs-fetch] FERTIG: 3 geholt, 0 übersprungen, 2 Fehler.')).toHaveLength(1);
    expect(erkenneAusfaelle('[clir] AUSFALL: www.bger.ch und search.bger.ch nicht erreichbar')).toHaveLength(1);
  });
  it('ganze Woche ohne Diff und ohne Ausfall ⇒ kein PR (Exit 0 im CLI)', () => {
    expect(entscheide({ ...gruen, inhaltsDiff: false }).entscheid).toBe('kein-diff');
  });
});

describe('3 · Guard-Befunde sichtbar (A7)', () => {
  const log = [
    '[bge-baender] §8-Quarantäne: 1 BGE ausgeschlossen (bger.ch-DE-Regeste unvollständig): bge_152_V_2',
    '[bge-baender] §8-Konflations-Guard: 1 neue BGE NICHT aufgenommen (OCL-Basis-Record vermischt): bge_152_I_2',
    '[bge-baender] Kollisions-Quarantäne: 2 neue BGE auf Auszug zurückgestuft.',
    '[b1] aufgelöst: 3 · Kollisions-Quarantäne: 0 · weiterhin Auszug: 1',
    '[remap] alt-verworfen (Literatur-Phantome, NICHT bewahrt): 3 Keys über 1 Snapshots.',
    '  · bund/bge/152_I_2: OR:41, ZGB:8, STPO:5',
    '[remap] alt-verworfen (gesperrtes Alias-Kürzel, ABK_AUSSCHLUSS, NICHT bewahrt): 0 Keys über 0 Snapshots.',
    '[eidg] bvger: 40 geholt (davon 5 schon im Bestand) → 5 gewählt',
  ].join('\n');
  it('erkennt jede Guard-Zeile mit Zähler > 0, samt Folgezeilen; Null-Bilanzen nicht', () => {
    // Mutation: GUARD_MUSTER leeren ⇒ []. Vor dem Fix standen diese Zeilen nirgends im Bericht.
    const g = erkenneGuardBefunde(log);
    expect(g.map((x) => x.zeile.slice(0, 30))).toEqual([
      '[bge-baender] §8-Quarantäne: 1',
      '[bge-baender] §8-Konflations-G',
      '[bge-baender] Kollisions-Quara',
      '[remap] alt-verworfen (Literat',
    ]);
    expect(g[3].details).toEqual(['bund/bge/152_I_2: OR:41, ZGB:8, STPO:5']);
  });
  it('Guard-Befunde sind kein Ausfall, stehen aber im Bericht', () => {
    expect(erkenneAusfaelle(log)).toEqual([]);
    const body = baueBericht(bericht({ guards: erkenneGuardBefunde(log) }));
    expect(body).toContain('## Befunde der Guards');
    expect(body).toContain('§8-Konflations-Guard: 1 neue BGE NICHT aufgenommen');
  });
});

describe('4 · Prüfstrasse: run-parallel zerlegen, Korpus-e2e per Regel', () => {
  it('jeder rote Sub-Check wird ein Tor mit Name + letzten Zeilen', () => {
    const log = [
      'run-parallel: 57 Sub-Checks, Concurrency 3 (CPU 4) …',
      `\n${'═'.repeat(72)}\nFEHLER in check:bezuege (Exit 1) — volle Ausgabe:\n${'═'.repeat(72)}`,
      'a\nb\nROT: Bilanz ≠ Shards',
      `\n${'═'.repeat(72)}\nFEHLER in check:normkeys (Exit 2) — volle Ausgabe:\n${'═'.repeat(72)}`,
      'Abdeckung 79 % < 80 %',
      '\nrun-parallel: 2/57 Sub-Check(s) ROT (61s): check:bezuege, check:normkeys',
    ].join('\n');
    const t = zerlegeRunParallel(log, 1);
    expect(t.map((x) => [x.name, x.code])).toEqual([['check:bezuege', 1], ['check:normkeys', 2]]);
    expect(t[0].auszug).toContain('ROT: Bilanz ≠ Shards');
    expect(t[1].auszug).toBe('Abdeckung 79 % < 80 %');
    expect(zerlegeRunParallel('Killed', 137)).toEqual([{ name: 'npm run check', code: 137, auszug: 'Killed' }]);
  });
  it('ein rotes Tor ⇒ Entwurf', () => {
    expect(entscheide({ ...gruen, toreRot: ['npm test'] }).gruende).toEqual(['Tor rot: npm test']);
  });
  it('Korpus-e2e: die im Auftrag genannten Specs sind in der Regel-Auswahl (am echten e2e/-Ordner)', () => {
    const alle = execFileSync('git', ['ls-files', 'e2e'], { encoding: 'utf8' }).split('\n').filter(Boolean);
    const s = e2eAuswahl(alle);
    for (const soll of ['leser-v3-panel-entscheide-s6', 'leser-v3-panel-bezuege-wirkung', 'startseite-blatt', 'rechtsprechung-besetzung-links']) {
      expect(s, soll).toContain(`e2e/${soll}.e2e.ts`);
    }
    expect(s.every((x) => x.endsWith('.e2e.ts'))).toBe(true);
    expect(s.length).toBeLessThan(alle.length / 4); // gezielt, nicht die ganze Suite
  });
});

describe('5 · Budget-Bericht', () => {
  it('liest DATEN_BUDGET (eine Quelle) und rechnet Ausnutzung + Reichweite', () => {
    const reg = 'public/rechtsprechung/register.json';
    const b = DATEN_BUDGET.find(([p]) => p === reg)![1];
    const z = budgetZeilen(DATEN_BUDGET, { [reg]: b - 20_000 }, { [reg]: b - 10_000 }, [reg]);
    const r = z.find((x) => x.pfad === reg)!;
    expect(r.wochen).toBe(1); // Luft 10 000 / Zuwachs 10 000
    expect(z.every((x) => x.pfad.startsWith('public/rechtsprechung/'))).toBe(true);
    expect(budgetZeilen(DATEN_BUDGET, {}, {}, ['public/normtext/register.json']).some((x) => x.pfad === 'public/normtext/register.json')).toBe(true);
  });
  it('≥ 90 % ⇒ Warnung; > 100 % ⇒ Entwurf', () => {
    const z = (anteil: number) => [{ pfad: 'x', vorher: 1, nachher: 1, budget: 1, anteil, wochen: null }];
    expect(budgetBefund(z(0.95))).toEqual({ warnung: ['x 95.0 %'], ueber: [] });
    expect(budgetBefund(z(0.89)).warnung).toEqual([]);
    expect(budgetBefund(z(1.01)).ueber).toEqual(['x 101.0 %']);
    expect(entscheide({ ...gruen, budgetUeber: ['x 101.0 %'] }).entscheid).toBe('entwurf');
  });
});

describe('6 · Frische je Gericht', () => {
  it('unterscheidet «Quelle hinkt» von «Auswahl/Filter» (Messung ua-mess-B §10)', () => {
    expect(bewerteFrische('2026-09-25', 'gr_gerichte', '2026-09-21', '2026-06-26').hinweis).toMatch(/^Auswahl\/Filter: OCL frisch, Register 87 Tage älter/);
    expect(bewerteFrische('2026-09-25', 'sg_gerichte', '2026-01-14', '2026-01-14').hinweis).toMatch(/^Quelle hinkt: jüngstes OCL-Datum 254 Tage/);
    expect(bewerteFrische('2026-09-25', 'bvger', '2026-09-20', '2026-09-01')).toEqual({ gericht: 'bvger', quelle: '2026-09-20', register: '2026-09-01', luecke: 19, hinweis: null });
    expect(bewerteFrische('2026-09-25', 'x', null, '2026-09-01').hinweis).toMatch(/nicht abrufbar/);
  });
  it('Hinweis ist KEIN Entwurf, steht aber im Bericht', () => {
    const f = [bewerteFrische('2026-09-25', 'gr_gerichte', '2026-09-21', '2026-06-26')];
    const body = baueBericht(bericht({ frische: f }));
    expect(body).toContain('| gr_gerichte | 2026-09-21 | 2026-06-26 | 87 |');
    expect(body).toContain('Hinweis (kein Entwurf): gr_gerichte');
  });
});

describe('7 · Stichprobe prüfbar: PDF-Text, Wortgrenze, Datum', () => {
  it('Fragmente fügen: anliegend ohne Leerzeichen, Lücke mit, Zeilenwechsel als Umbruch', () => {
    const s = (str: string, x: number, y = 700, w = str.length * 6) => ({ str, x, y, w, h: 12, eol: false });
    expect(fuegeStuecke([s('F-4218/', 72), s('2026', 72 + 7 * 6), s('vom', 72 + 11 * 6 + 4), s('Urteil', 72, 680)])).toBe('F-4218/2026 vom\nUrteil');
  });
  it('pdfText liest eine echte PDF-Datei (pdfjs, kein neues Paket) — Aktenzeichen bleibt ganz', async () => {
    const t = await pdfText(minimalPdf([['Bundesverwaltungsgericht'], ['Urteil vom 19. Juni 2026'], ['F-4218/', '2026']]));
    expect(t).toContain('Urteil vom 19. Juni 2026');
    expect(t).toContain('F-4218/2026');
  });
  it('PDF mit Textebene: Aktenzeichen UND Datum getrennt; Präfix-Falle ist Fehltreffer, Scan nicht prüfbar', () => {
    const t = `Abteilung III\nC-706/2026\nAbschreibungsentscheid vom 17. September 2026 ${'Sachverhalt '.repeat(60)}`;
    const bv = e('bvger_C_706_2026', 'bvger', '2026-09-17', { nummer: 'C-706/2026' });
    expect(pruefeText(t, bv, 'pdf')).toEqual({ treffer: true, akz: true, datum: true, detail: 'C-706/2026 · PDF · 2026-09-17' });
    // Mutation: in pruefeText den PDF-Zweig auf «treffer: null» zurückdrehen ⇒ nicht mehr false.
    expect(pruefeText(t, { ...bv, nummer: 'C-70/2026' }, 'pdf')).toMatchObject({ treffer: false, akz: false });
    expect(pruefeText(t, { ...bv, nummer: 'C-706/202' }, 'pdf').treffer).toBe(false);
    expect(pruefeText('C-706/2026', bv, 'pdf').treffer).toBeNull();
    expect(pruefeText(t, bv, 'html').treffer).toBe(true);
    expect(pruefeText('<div id="root"></div>', bv, 'html').treffer).toBeNull();
  });
  it('Datum ist Pflicht-Kriterium (Befund #1117): falsches Korpus-Datum ⇒ Fehltreffer, nicht ermittelbar ⇒ nicht prüfbar', () => {
    const t = `HOR.2024.19 / ve / lw\nEntscheid vom 2. Dezember 2025\nBesetzung ${'Erwägung '.repeat(80)}`;
    const ag = e('ag_gerichte_HOR_2024_19', 'ag_gerichte', '2025-12-12', { nummer: 'HOR.2024.19' });
    // Mutation: Datumszweig in pruefeText entfernen ⇒ treffer true trotz falschem Datum (Stand vor der Schärfung).
    expect(pruefeText(t, ag, 'pdf')).toEqual({ treffer: false, akz: true, datum: false, detail: 'HOR.2024.19 · PDF · Datum amtlich 2025-12-02 ≠ Korpus 2025-12-12' });
    expect(pruefeText(t, { ...ag, datum: '2025-12-02' }, 'pdf')).toMatchObject({ treffer: true, akz: true, datum: true });
    expect(pruefeText(`HOR.2024.19 ${'Erwägung '.repeat(80)}`, ag, 'pdf')).toMatchObject({ treffer: null, akz: true, datum: null });
    expect(entscheide({ ...gruen, stichprobe: [...gruen.stichprobe, { key: 'ag', url: null, ...pruefeText(t, ag, 'pdf'), ergebnis: 'fehltreffer' }] }).entscheid).toBe('entwurf');
  });
  it('GR schreibt das Jahr zweistellig — eng: nur gr_gerichte, Wortgrenze bleibt, kein Substring', () => {
    expect(aktenzeichenVarianten('ZR1 2024 196', 'gr_gerichte')).toEqual(['ZR1 2024 196', 'ZR1 24 196']);
    expect(aktenzeichenVarianten('SBK 2026 88', 'gr_gerichte')).toEqual(['SBK 2026 88', 'SBK 26 88']);
    expect(aktenzeichenVarianten('200 2026 230', 'be_verwaltungsgericht')).toEqual(['200 2026 230']);
    expect(aktenzeichenVarianten('HOR.2024.19', 'gr_gerichte')).toEqual(['HOR.2024.19']);
    const t = `Urteil vom 25. April 2026\nmitgeteilt am 5. Mai 2026\nReferenz ZR1 24 196\nInstanz ${'Erwägung '.repeat(80)}`;
    expect(pruefeText(t, e('k', 'gr_gerichte', '2026-04-25', { nummer: 'ZR1 2024 196' }), 'pdf').detail).toBe('ZR1 2024 196 (als «ZR1 24 196») · PDF · 2026-04-25');
    expect(pruefeText(t, e('k', 'gr_gerichte', '2026-04-25', { nummer: 'ZR1 2024 19' }), 'pdf').treffer).toBe(false);
    expect(pruefeText(t, e('k', 'gr_gerichte', '2026-04-25', { nummer: 'R1 2024 196' }), 'pdf').treffer).toBe(false);
  });
  it('amtliches Datum aus dem Urteilskopf — Formen realer Quell-PDFs vom 25.9.2026', () => {
    // BStGer, BE (Zwischenwörter), GR (danach «mitgeteilt am»), AG (fehlendes Leerzeichen), SG (Etikett vor BGer-Datum)
    expect(amtlichesDatum('Beschluss vom 11. Juni 2026\nBerufungskammer … Verfügung … vom 13. Dezember 2024')).toBe('2026-06-11');
    expect(amtlichesDatum('KV 200 2026 230\nVerwaltungsgericht des Kantons Bern\nUrteil der Einzelrichterin vom 20. Mai 2026\n… betreffend Einspracheentscheid vom 5. März 2026')).toBe('2026-05-20');
    expect(amtlichesDatum('Urteil vom 25. April 2026\nmitgeteilt am 5. Mai 2026')).toBe('2026-04-25');
    expect(amtlichesDatum('VBE.2024.584 / nb / nl\nArt. 111\nUrteil vom11. September 2025')).toBe('2025-09-11');
    expect(amtlichesDatum('Fall-Nr.: B 2024/58\nPublikationsdatum: 25.02.2025\nEntscheiddatum: 03.02.2025\n… mit Urteil vom 14. Januar 2026 abgewiesen')).toBe('2025-02-03');
    // BVGer Sperrschrift (de/it), fr mit «1er»
    expect(amtlichesDatum('F-4158/2026\nU r t e i l v o m 1 7 . J u n i 2 0 2 6\nBesetzung')).toBe('2026-06-17');
    expect(amtlichesDatum('F-4218/2026\nS e n t e n z a d e l 1 9 g i u g n o 2 0 2 6\nComposizione')).toBe('2026-06-19');
    expect(amtlichesDatum('Arrêt du 1er mars 2026\nComposition')).toBe('2026-03-01');
    expect(amtlichesDatum('Urteil vom 3.2.2026')).toBe('2026-02-03');
    expect(amtlichesDatum('Urteil 8C_484/2025 vom 11. Mai 2026')).toBe('2026-05-11');
    expect(amtlichesDatum('Nichtanhandnahme 12.05.2026 | UE240310 | Obergericht … Beschluss 12.05.2026 UE240310')).toBe('2026-05-12');
    expect(amtlichesDatum('Referenz ZR1 24 196, keine Datumsfügung')).toBeNull();
  });
  it('BVGer: OCL-id für pdf_url (Form am 25.9.2026 gemessen), sonst keine', () => {
    expect(oclIdFuerPdf(e('bvger_F_4218_2026', 'bvger', '2026-06-19', { nummer: 'F-4218/2026' }))).toBe('bvger_F-4218_2026');
    expect(oclIdFuerPdf(e('bstger_CR_2026_5', 'bstger', '2026-06-11', { nummer: 'CR.2026.5' }))).toBeNull();
  });
  it('n ≥ 12 mit übrigen reihum über die Gerichte', () => {
    const ueb = ['bvger', 'bstger', 'be_verwaltungsgericht', 'sg_gerichte', 'gr_gerichte', 'ag_gerichte']
      .flatMap((g) => [1, 2, 3].map((i) => e(`${g}_${i}`, g, '2026-03-01')));
    const s = waehleStichprobe(ueb, 12);
    expect(s).toHaveLength(12);
    expect(new Set(s.map((x) => x.gericht)).size).toBe(6);
  });
  it('ein Fehltreffer ⇒ Entwurf', () => {
    expect(entscheide({ ...gruen, stichprobe: [...gruen.stichprobe, { key: 'b', url: null, ergebnis: 'fehltreffer', detail: '' }] }).gruende).toEqual(['Stichprobe: 1 Fehltreffer']);
  });
});

describe('8 · kein Verlust bei offenem Vorwochen-PR (A6) — Simulation mit echtem git', () => {
  let wurzel = '';
  const inRepo = (dir: string): Git => (...a) => execFileSync('git', ['-c', `user.name=${BOT}`, '-c', `user.email=bot@example.invalid`, '-c', 'commit.gpgsign=false', ...a], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const reg = (keys: string[]) => JSON.stringify({ entscheide: keys.map((k) => ({ key: k, gericht: 'bvger', datum: '2026-09-01' })) }, null, 1) + '\n';
  const BR = 'auto/rechtsprechung-2026-09-21';
  const aufsetzen = (mainAendertRegister: boolean) => {
    const d = mkdtempSync(join(tmpdir(), 'wochenlauf-'));
    execFileSync('git', ['init', '-q', '--bare', '-b', 'main', join(d, 'origin.git')]);
    const w = join(d, 'w');
    execFileSync('git', ['clone', '-q', join(d, 'origin.git'), w], { stdio: 'ignore' });
    const g = inRepo(w);
    g('checkout', '-q', '-b', 'main');
    writeFileSync(join(w, 'register.json'), reg(['a']));
    writeFileSync(join(w, 'code.txt'), 'v1\n');
    g('add', '-A'); g('commit', '-q', '-m', 'main 1'); g('push', '-q', 'origin', 'main');
    g('checkout', '-q', '-b', BR);
    writeFileSync(join(w, 'register.json'), reg(['a', 'vorwoche']));
    g('commit', '-q', '-am', 'Wochen-Nachzug 21.9.'); g('push', '-q', 'origin', BR);
    g('checkout', '-q', 'main');
    writeFileSync(join(w, 'code.txt'), 'v2\n');
    if (mainAendertRegister) writeFileSync(join(w, 'register.json'), reg(['a', 'hand']));
    g('commit', '-q', '-am', 'main 2'); g('push', '-q', 'origin', 'main');
    const lauf = join(d, 'lauf'); // der Runner: frischer Checkout von main
    execFileSync('git', ['clone', '-q', join(d, 'origin.git'), lauf], { stdio: 'ignore' });
    inRepo(lauf)('fetch', '-q', 'origin', BR);
    return lauf;
  };
  beforeAll(() => { wurzel = process.cwd(); });
  it('unberührter Vorwochen-PR: Lauf baut auf SEINEM Kopf, main eingemergt, Vorwochen-Eintrag bleibt', () => {
    const lauf = aufsetzen(false);
    const g = inRepo(lauf);
    const vorMain = JSON.parse(g('show', 'origin/main:register.json')).entscheide;
    expect(baueAufVorwoche(g, BR)).toEqual({ ok: true });
    expect(g('rev-parse', '--abbrev-ref', 'HEAD').trim()).toBe(BR);
    expect(readFileSync(join(lauf, 'code.txt'), 'utf8')).toBe('v2\n'); // main drin
    const jetzt = JSON.parse(readFileSync(join(lauf, 'register.json'), 'utf8')).entscheide;
    // Mutation: baueAufVorwoche durch «auf main bleiben» ersetzen ⇒ 'vorwoche' fehlt im PR.
    expect(vergleicheRegister(vorMain, jetzt).neu.map((x) => x.key)).toEqual(['vorwoche']);
    expect(process.cwd()).toBe(wurzel);
  });
  it('Konflikt mit main: Merge abgebrochen, Aufbau auf main, Grund nennt die Datei', () => {
    const lauf = aufsetzen(true);
    const g = inRepo(lauf);
    const mainKopf = g('rev-parse', 'origin/main').trim();
    const r = baueAufVorwoche(g, BR);
    expect(r).toEqual({ ok: false, grund: 'Merge-Konflikt mit main in register.json' });
    expect(g('rev-parse', 'HEAD').trim()).toBe(mainKopf);
    expect(g('status', '--porcelain').trim()).toBe(''); // kein halber Merge
    expect(entscheide({ ...gruen, vorwocheVerworfen: r.ok ? null : r.grund }).gruende).toEqual(['Vorwoche verworfen: Merge-Konflikt mit main in register.json']);
  });
  it('yml: kein Überschreiben per blindem Force-Push mehr, Kommentar korrigiert', () => {
    const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
    expect(yml).not.toMatch(/trägt also den Stand der Vorwoche mit/);
    expect(yml).toMatch(/--force-with-lease="\$\{BRANCH\}:\$\{LEASE\}"/);
    expect(yml).toContain('wochenlauf-basis.ts');
  });
});

describe('9 · «in Prüfung» (A9)', () => {
  const unberuehrt = { commits: [{ autor: BOT, committer: BOT }], body: 'x\nGegenpruefung: ausstehend — Wochenlauf, Prüfung vor Landung', labels: [], menschen: [] };
  it('unberührt ⇒ null; jede Spur einer Prüfung ⇒ Grund', () => {
    expect(inPruefung(unberuehrt)).toBeNull();
    // Mutation: nur den jüngsten Commit prüfen (alter Stand `git log -1`; git log listet
    // den jüngsten zuerst) ⇒ ein älterer fremder Commit unter einem Bot-Commit bliebe unerkannt.
    expect(inPruefung({ ...unberuehrt, commits: [{ autor: BOT, committer: BOT }, { autor: 'David Graf', committer: 'David Graf' }] })).toMatch(/fremder Commit/);
    expect(inPruefung({ ...unberuehrt, commits: [{ autor: BOT, committer: 'David Graf' }] })).toMatch(/Committer David Graf/); // amend
    expect(inPruefung({ ...unberuehrt, body: 'Gegenpruefung: bestanden (Opus) — 12/12' })).toMatch(/Verdikt im Body/);
    expect(inPruefung({ ...unberuehrt, labels: ['in-pruefung'] })).toBe('Label in-pruefung');
    expect(inPruefung({ ...unberuehrt, menschen: ['davidgraf'] })).toBe('Kommentar/Review von davidgraf');
  });
});

describe('10/11/14/15 · CI-Auslösung, Fristen, Steuerfläche, Rot-Signal', () => {
  const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
  it('10: CI wird nach JEDEM Push dispatcht (nicht nur ohne PAT)', () => {
    expect(yml).toMatch(/^\s+gh workflow run ci\.yml --ref "\$BRANCH"/m);
    expect(yml).not.toMatch(/HAT_PAT/);
  });
  it('11: Skript-Frist < Job-Timeout, Quellen-Frist < Skript-Frist', () => {
    const job = Number(/timeout-minutes: (\d+)/.exec(yml)![1]);
    const frist = Number(/--frist-min=(\d+)/.exec(yml)![1]);
    const quellen = Number(/--quellen-frist-min=(\d+)/.exec(yml)![1]);
    expect(quellen).toBeLessThan(frist);
    expect(frist + 15).toBeLessThanOrEqual(job); // Setup + PR-Schritt
    expect(restMinuten(0, 30 * 60_000, 110)).toBe(80);
    expect(restMinuten(0, 200 * 60_000, 110)).toBe(0);
  });
  it('14: Workflow ist Rechtsschutz, zählt nicht zur Steuerfläche', () => {
    expect(RECHTSSCHUTZ['.github/workflows/rechtsprechung-wochenlauf.yml']).toBeTruthy();
    expect(istFlaeche('.github/workflows/rechtsprechung-wochenlauf.yml')).toBe(false);
  });
  it('15: Entwurf trägt das Rot-Signal im Summary-Kopf', () => {
    const d = bericht({ entscheid: { entscheid: 'entwurf', gruende: ['Tor rot: npm test'] } });
    expect(baueSummary(d, baueBericht(d)).split('\n')[0]).toBe('## Rechtsprechungs-Wochenlauf 2026-09-28: **ENTWURF — ROT**');
  });
});

describe('12 · Positivliste statt git add -A (A11)', () => {
  it('Status -z: Leerzeichen-Pfade ungequotet, Umbenennung zählt den neuen Pfad', () => {
    expect(leseStatusZ(' M public/rechtsprechung/bezuege/BS-RiE 640.100.json\0?? daten/bs-fiw/raw/1.html\0R  e2e/neu.json\0e2e/alt.json\0 D public/rechtsprechung/x.json\0'))
      .toEqual(['public/rechtsprechung/bezuege/BS-RiE 640.100.json', 'daten/bs-fiw/raw/1.html', 'e2e/neu.json', 'public/rechtsprechung/x.json']);
  });
  it('erwartete Generator-Pfade gestagt, Fremdes nicht ⇒ Entwurf', () => {
    const { erwartet, unerwartet } = teilePfade([
      'public/rechtsprechung/register.json', 'public/rechtsprechung/kanton/BS/bs_zivilgericht/P_2024_9.json',
      'public/normtext/struktur/kanton/BS-RiE 730.130.json', 'daten-manifest.json', 'daten/bs-fiw/inventar.json',
      'src/lib/rechtsprechung/erfasste-keys.generated.ts', 'e2e/shard-gruppen.json', 'bibliothek/rechtsprechung/bge-register.md',
      'src/lib/tarif/x.ts', 'daten/bs-fiw/raw/1.html', '.selbstopt-ereignisse.jsonl',
    ]);
    expect(unerwartet).toEqual(['src/lib/tarif/x.ts', 'daten/bs-fiw/raw/1.html', '.selbstopt-ereignisse.jsonl']);
    expect(erwartet).toHaveLength(8);
    expect(entscheide({ ...gruen, unerwartet }).gruende).toEqual(['unerwartete Dateien (nicht gestagt): 3']);
  });
});

describe('13 · BS-Vollabgleich', () => {
  const snap = (key: number, sha: string, besetzung = 'X'): EntscheidSnapshot =>
    ({ id: `kanton/BS/bs_appellationsgericht/K${key}`, quelle: 'gerichte-bs', quelleUrl: `https://x?nF30_KEY=${key}`, sha, rubrum: { besetzung }, dispositivOrders: [] }) as unknown as EntscheidSnapshot;
  const zeile = (key: number) => ({ key, gn: `K${key}` }) as never;
  const plan: BsDeltaPlan = { neu: [zeile(9)], aktualisiert: [], unveraendert: 3, takedown: [] };
  const frisch = (key: number, sha: string, besetzung = 'X') => ({ p: { abschnitte: sha as never, besetzung, dispositivOrders: [] }, z: zeile(key) });
  it('Inhalts-Hash, Spruchkörper, Dispositiv: Abweichung ⇒ aktualisiert (Grund inhalt), gleich ⇒ unverändert', () => {
    const r = ergaenzeInhaltsAbweichungen(plan, [frisch(1, 's1', 'A. Zalad , B'), frisch(2, 's2-neu'), frisch(3, 's3', 'Y'), frisch(9, 'n')],
      [snap(1, 's1', 'A. Zalad, B'), snap(2, 's2'), snap(3, 's3')], (p) => p.abschnitte as unknown as string);
    // Leerraum allein ist keine Inhaltsänderung (Probe IV.2023.46, 25.9.2026). Mutation: ohneLeerraum weg ⇒ inhalt 3.
    expect(r.inhalt).toBe(2);
    expect(r.plan.unveraendert).toBe(1);
    expect(r.plan.aktualisiert.map((a) => [a.z.key, a.gruende])).toEqual([[2, ['inhalt: sha']], [3, ['inhalt: besetzung']]]);
    expect(r.plan.neu).toEqual(plan.neu);
  });
  it(`mehr als ${VOLLABGLEICH_DECKEL} Abweichungen ⇒ Abbruch (Parser-Drift, fail-closed)`, () => {
    const n = VOLLABGLEICH_DECKEL + 1;
    const ks = Array.from({ length: n }, (_, i) => i + 1);
    expect(() => ergaenzeInhaltsAbweichungen({ ...plan, neu: [], unveraendert: n }, ks.map((k) => frisch(k, 'neu')), ks.map((k) => snap(k, 'alt')), (p) => p.abschnitte as unknown as string)).toThrow(/Deckel/);
  });
  it('Bilanz- und Plan-Zeilen: geprüft/geändert, jede Aktualisierung einmal (bs-import druckt den Plan zweimal)', () => {
    const log = '[bs-delta]   aktualisiert: a (key 1): inhalt: sha\n[bs-voll] geprüft: 3765 · Inhalt geändert: 2 · Listenfelder geändert: 5 · neu: 1 · Takedown: 0\n[bs-delta]   aktualisiert: a (key 1): inhalt: sha';
    expect(leseBsVoll(log)).toEqual({ geprueft: 3765, inhalt: 2, liste: 5, neu: 1, takedown: 0 });
    expect(leseBsDelta(log).aktualisiert).toEqual(['a (key 1): inhalt: sha']);
    expect(baueBericht(bericht({ modus: 'bs-vollabgleich', bsVoll: leseBsVoll(log) }))).toContain('**3765 geprüft · 7 geändert**');
  });
  it('yml: zweiter Cron + workflow_dispatch-Input schalten den Modus', () => {
    const yml = readFileSync('.github/workflows/rechtsprechung-wochenlauf.yml', 'utf8');
    const cron = /- cron: '([^']+)' # am 3\./.exec(yml)![1];
    expect(yml).toContain(`github.event.schedule == '${cron}' && 'bs-vollabgleich'`);
    expect(yml).toMatch(/options: \[woche, bs-vollabgleich\]/);
  });
});

describe('16 · kantonaler Zweig nie still (A4)', () => {
  const K = ['zh_obergericht', 'gr_gerichte'];
  it('ohne additiven Kantonszweig ⇒ Ausfall-Zeile (⇒ Entwurf über quellenAus)', () => {
    // Mutation: kantonalAusfall immer [] ⇒ kantonale Gerichte fielen still weg (Stand main).
    expect(kantonalAusfall(false, K, '')).toEqual(['kantonal: übersprungen — Generator ohne additiven Kantonszweig (scripts/normtext/entscheide-additiv.ts fehlt; zh_obergericht, gr_gerichte)']);
    expect(erkenneAusfaelle(kantonalAusfall(false, K, '')[0])).toHaveLength(1);
  });
  it('mit Zweig: jedes Gericht muss im Log vorkommen (Wortgrenze)', () => {
    expect(kantonalAusfall(true, K, '[kanton] zh_obergericht: 24 de → 6 gewählt\n[kanton] gr_gerichte: 24 de → 6 gewählt')).toEqual([]);
    expect(kantonalAusfall(true, K, '[kanton] zh_obergericht: 24 de → 6 gewählt\n[kanton] gr_gerichte_x: 1')).toEqual(['kantonal: keine Rückmeldung im Generator-Log für gr_gerichte — AUSFALL']);
  });
});

// ── Hilfen ──────────────────────────────────────────────────────────────────
function bericht(x: Partial<BerichtDaten>): BerichtDaten {
  return {
    datum: '2026-09-28', modus: 'woche', baender: { vor: 151, lauf: 152 }, basis: { branch: null, nr: null, vorwocheVerworfen: null },
    quellen: [], nachbau: [], vergleich: { neu: [], entfernt: [], jeGericht: [] }, dieseWoche: { neu: 0, entfernt: 0 },
    bs: { aktualisiert: [], takedown: [] }, bsVoll: null, guards: [], tore: [], stichprobe: [], budget: [], frische: [], unerwartet: [],
    entscheid: { entscheid: 'pr', gruende: [] }, mergeSchutzSperrt: true, laufUrl: null, ...x,
  };
}

/** Minimales PDF (Helvetica, ASCII) — je Zeile Fragmente als eigene Tj-Operatoren. */
function minimalPdf(zeilen: string[][]): Uint8Array {
  const esc = (t: string) => t.replace(/[()\\]/g, '\\$&');
  const inhalt = `BT /F1 12 Tf 72 720 Td ${zeilen.map((fr, i) => `${i ? '0 -16 Td ' : ''}${fr.map((f) => `(${esc(f)}) Tj`).join(' ')}`).join(' ')} ET`;
  const objs = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let s = '%PDF-1.4\n';
  const off: number[] = [];
  objs.forEach((o, i) => { off.push(s.length); s += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const x = s.length;
  s += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${off.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF\n`;
  return new TextEncoder().encode(s);
}
