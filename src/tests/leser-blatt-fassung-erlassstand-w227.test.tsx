import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToString } from 'react-dom/server';
import {
  erlassStandErlaubt, erlassStandFuerArtikel, ErlassStandZeile, type ErlassStandEingang,
} from '../pages/gesetz-leser/v3/PanelTafeln';
import type { ArtikelHistorie } from '../lib/normtext/historie-parse';
import type { HistorieShard } from '../lib/normtext/historie-laden';
import type { ArtikelRevision } from '../lib/verzahnung/artikel-revisionen';
import type { NormSnapshot } from '../lib/normtext/typen';

// W2·27-BUND-FERTIG P5 (1.10.2026) · «Erlass in Kraft seit …» im Reiter Änderungen
// für Artikel OHNE Historie-Ereignis. Geprüft wird die AUSSAGE (§1/§8), nicht das
// Markup: das Datum gehört dem ERLASS (Fedlex `dateEntryInForce` am Abstract,
// `inkrafttreten.json`), nie dem Artikel; und es steht nur, wo kein Beleg dagegen
// spricht (Ereignis, Revision, Leerstelle, ungeparste Fussnote).
//
// UMFANG (Orchestrator, bis David anders entscheidet): ENG — nur SR `0.*`
// (Staatsverträge). Die datengesteuerte Ausweitung auf alle Bund-Artikel ohne
// Ereignis ist EIN Schalter: `erlassStandErlaubt` (Test «Schalter» unten).

const WURZEL = resolve(__dirname, '../..');
const lies = <T,>(pfad: string): T => JSON.parse(readFileSync(resolve(WURZEL, 'public/normtext', pfad), 'utf8')) as T;

interface RegEintrag { key: string; ebene: 'bund' | 'kanton'; sr: string | null; datei?: string; inkraftSeit?: string }
const REGISTER = lies<{ erlasse: RegEintrag[] }>('register.json').erlasse;
const INKRAFT = lies<Record<string, { datum: string; quelle: string }>>('inkrafttreten.json');
const reg = (key: string) => REGISTER.find((e) => e.key === key)!;
const snap = (key: string) => lies<{ eintraege: NormSnapshot[] }>(reg(key).datei!).eintraege;
const shardVon = (key: string): HistorieShard | null => (existsSync(resolve(WURZEL, `public/normtext/historie/${key}.json`))
  ? lies<HistorieShard>(`historie/${key}.json`) : null);

const eintrag = (artikel: string, extra: Partial<NormSnapshot> = {}): NormSnapshot => ({
  id: `bund/X/art_${artikel}`, ebene: 'bund', quelle: 'X', erlass: 'X', artikel, artikelLabel: `Art. ${artikel}`,
  bloecke: [{ absatz: null, text: 'Lebender Wortlaut.' }], stand: '2026-05-22', quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/x/de',
  abgerufen: '2026-10-01', fassungsToken: '20260522', sha: 'x', ...extra,
});
const historieMit = (...datums: string[]): ArtikelHistorie => ({
  giltSeit: datums.at(-1) ?? null,
  ereignisse: datums.map((datum) => ({ typ: 'fassung', datum, wirkung: false, quellen: [], absatz: null, item: null })),
} as unknown as ArtikelHistorie);
const shard = (residuumTokens: string[] = []): HistorieShard => ({
  erlass: 'X', abdeckung: { fussnoten: 0, ereignis: 0, referenz: 0, unparsed: 0 }, artikel: {},
  residuum: residuumTokens.map((token) => ({ token, nr: '1', roh: 'Fussnote ohne Ereignis-Grammatik.' })),
});

/** Der Glücksfall der Spec §3: alle Bedingungen erfüllt. Jeder Test kippt GENAU eine. */
function basis(über: Partial<ErlassStandEingang> = {}): ErlassStandEingang {
  return {
    erlassSr: '0.221.211.1', inkraftSeit: '1991-03-01', blatt: { eintrag: eintrag('7') }, artRev: null,
    revisionenFertig: true, historieFertig: true, historieShard: null, ...über,
  };
}

describe('erlassStandErlaubt — der EINE Umfangs-Schalter (ENG: nur SR 0.*)', () => {
  it('Staatsverträge (SR 0.*) ja', () => {
    for (const sr of ['0.101', '0.221.211.1', '0.748.0', '0.172.030.4']) expect(erlassStandErlaubt(sr)).toBe(true);
  });
  it('alles andere nein — auch SR-Nummern, die nur eine 0 enthalten, und VBB/VG (kein Staatsvertrag)', () => {
    for (const sr of ['220', '170.32', '281.31', '10.1', '101', '0', '', null, undefined]) expect(erlassStandErlaubt(sr)).toBe(false);
  });
});

describe('erlassStandFuerArtikel — Spec §3 a–d, Test 1 a–g', () => {
  it('(a) kein Ereignis + Revisionen geladen + kein artRev + inkraftSeit ⇒ das Datum des ERLASSES', () => {
    expect(erlassStandFuerArtikel(basis())).toBe('1991-03-01');
  });
  it('(a) Historie-Eintrag OHNE Ereignisse zählt wie keiner', () => {
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: eintrag('7'), historie: { giltSeit: null, ereignisse: [] } } }))).toBe('1991-03-01');
  });
  it('(b) Ereignisse vorhanden ⇒ nichts (die Fassung spricht selbst)', () => {
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: eintrag('7'), historie: historieMit('2021-01-01') } }))).toBeUndefined();
  });
  it('(c) Revisions-Beleg vorhanden ⇒ nichts (artRevOhneHistorie zeigt «zuletzt geändert»)', () => {
    const rev: ArtikelRevision = { iso: '2020-01-01', as: 'AS 2020 1' };
    expect(erlassStandFuerArtikel(basis({ artRev: rev }))).toBeUndefined();
  });
  it('(d) inkraftSeit fehlt (Kanton, DSGVO …) ⇒ ehrlich nichts', () => {
    expect(erlassStandFuerArtikel(basis({ inkraftSeit: undefined }))).toBeUndefined();
    expect(erlassStandFuerArtikel(basis({ inkraftSeit: null }))).toBeUndefined();
    expect(erlassStandFuerArtikel(basis({ inkraftSeit: '' }))).toBeUndefined();
  });
  it('(d) kein ISO-Datum ⇒ nichts (nie eine Zeichenkette als Datum ausgeben)', () => {
    expect(erlassStandFuerArtikel(basis({ inkraftSeit: 'März 1991' }))).toBeUndefined();
  });
  it('(e) amtlich aufgehobener Artikel ⇒ nichts (kein «in Kraft» über eine Leerstelle)', () => {
    const e = eintrag('7', { aufgehoben: true, bloecke: [{ absatz: null, text: '…' }] });
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: e } }))).toBeUndefined();
  });
  it('(e) gegenstandsloser Artikel ⇒ nichts', () => {
    const e = eintrag('7', { gegenstandslos: true, bloecke: [{ absatz: null, text: '…' }] });
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: e } }))).toBeUndefined();
  });
  it('(e) leer-ungeklärt (Text-Heuristik: «…»-Body ohne Beleg) ⇒ nichts', () => {
    const e = eintrag('7', { bloecke: [{ absatz: null, text: '…' }] });
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: e } }))).toBeUndefined();
  });
  it('(e) Historie führt aufgehobenSeit/gegenstandslos ⇒ nichts', () => {
    const h = (extra: Partial<ArtikelHistorie>): ArtikelHistorie => ({ giltSeit: null, ereignisse: [], ...extra });
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: eintrag('7'), historie: h({ aufgehobenSeit: '2020-01-01' }) } }))).toBeUndefined();
    expect(erlassStandFuerArtikel(basis({ blatt: { eintrag: eintrag('7'), historie: h({ gegenstandslos: { seit: null } }) } }))).toBeUndefined();
  });
  it('(f) Token im Residuum (Fussnote vorhanden, nicht als Ereignis geparst) ⇒ nichts — der Artikel könnte geändert sein', () => {
    expect(erlassStandFuerArtikel(basis({ historieShard: shard(['7']) }))).toBeUndefined();
  });
  it('(f) Residuum eines ANDEREN Artikels stört nicht', () => {
    expect(erlassStandFuerArtikel(basis({ historieShard: shard(['8', '70']) }))).toBe('1991-03-01');
  });
  it('(g) Revisionen noch nicht geladen ⇒ nichts (nie «keine Belege» vor «geladen»)', () => {
    expect(erlassStandFuerArtikel(basis({ revisionenFertig: false }))).toBeUndefined();
  });
  it('(g) Historie-Shard noch nicht geladen ⇒ nichts (sonst blitzt die Zeile an Artikeln MIT Ereignis auf)', () => {
    expect(erlassStandFuerArtikel(basis({ historieFertig: false }))).toBeUndefined();
  });
  it('kein aktiver Artikel ⇒ nichts', () => {
    expect(erlassStandFuerArtikel(basis({ blatt: null }))).toBeUndefined();
  });
  it('Schalter: Erlass ausserhalb des Umfangs (SR ≠ 0.*) ⇒ nichts, obwohl alles andere stimmt', () => {
    expect(erlassStandFuerArtikel(basis({ erlassSr: '220' }))).toBeUndefined();
    expect(erlassStandFuerArtikel(basis({ erlassSr: undefined }))).toBeUndefined();
  });
});

describe('ErlassStandZeile — Wortlaut', () => {
  const html = renderToString(<ErlassStandZeile iso="1991-03-01" token="1" />).replace(/<!-- -->/g, '');
  it('«Erlass in Kraft seit <Datum>» — Datum wie die Nachbarzeile (datumAnzeige), Anker mit Token', () => {
    expect(html).toContain('Erlass in Kraft seit 01.03.1991');
    expect(html).toContain('data-v3-blatt-fassung-erlass="1"');
  });
  it('nie «Artikel gilt seit», nie «keine Änderung», nie «für die Schweiz» (§8: unbelegt)', () => {
    for (const verboten of [/Artikel gilt/i, /gilt seit/i, /keine Änderung/i, /unverändert/i, /für die Schweiz/i]) {
      expect(html).not.toMatch(verboten);
    }
  });
});

// ─── Gegen den echten Korpus (nur LESEN) ─────────────────────────────────────
const SR0 = REGISTER.filter((e) => e.ebene === 'bund' && /^0\./.test(e.sr ?? '') && e.datei);

function eingangFuer(key: string, artikel: string): ErlassStandEingang {
  const e = reg(key);
  const s = shardVon(key);
  const eint = snap(key).find((x) => x.artikel === artikel)!;
  return {
    erlassSr: e.sr, inkraftSeit: e.inkraftSeit, blatt: { eintrag: eint, historie: s?.artikel[artikel] },
    artRev: null, revisionenFertig: true, historieFertig: true, historieShard: s,
  };
}

describe('Render-Test am echten Korpus (Test 2)', () => {
  it('CISG Art. 1 (Vertrag ohne Historie-Shard) ⇒ «Erlass in Kraft seit 01.03.1991»', () => {
    const iso = erlassStandFuerArtikel(eingangFuer('CISG', '1'));
    expect(iso).toBe('1991-03-01');
    expect(renderToString(<ErlassStandZeile iso={iso!} token="1" />).replace(/<!-- -->/g, '')).toContain('Erlass in Kraft seit 01.03.1991');
  });
  it('EMRK Art. 19 (hat ein Ereignis) ⇒ keine Zeile', () => {
    const s = shardVon('EMRK')!;
    expect(s.artikel['19']?.ereignisse.length).toBeGreaterThan(0);
    expect(erlassStandFuerArtikel(eingangFuer('EMRK', '19'))).toBeUndefined();
  });
  it('ein Erlass ausserhalb des Umfangs (OR, SR 220) ⇒ keine Zeile, auch ohne Ereignis', () => {
    const e = reg('OR');
    const eint = snap('OR').find((x) => !shardVon('OR')?.artikel[x.artikel]?.ereignisse.length && x.bloecke.some((b) => b.text.trim().length > 20))!;
    expect(eint).toBeDefined();
    expect(erlassStandFuerArtikel({
      erlassSr: e.sr, inkraftSeit: e.inkraftSeit, blatt: { eintrag: eint }, artRev: null,
      revisionenFertig: true, historieFertig: true, historieShard: shardVon('OR'),
    })).toBeUndefined();
  });
  it('ein Kanton-Erlass ⇒ keine Zeile (kein inkraftSeit, kein SR 0.*)', () => {
    const k = REGISTER.find((e) => e.ebene === 'kanton' && e.datei)!;
    expect(k.inkraftSeit).toBeUndefined();
    expect(erlassStandFuerArtikel(basis({ erlassSr: k.sr, inkraftSeit: k.inkraftSeit }))).toBeUndefined();
  });
});

describe('Daten-Invariante (Test 3) — inkrafttreten.json deckt jeden Staatsvertrag', () => {
  it('jeder Bund-Registereintrag mit Normtext und SR 0.* trägt inkraftSeit — identisch zu inkrafttreten.json', () => {
    expect(SR0.length).toBeGreaterThanOrEqual(28);
    const luecken = SR0.filter((e) => !e.inkraftSeit || INKRAFT[e.key]?.datum !== e.inkraftSeit).map((e) => e.key);
    expect(luecken).toEqual([]);
  });
  it('Quelle jedes dieser Daten ist Fedlex (Ur-Inkrafttreten, §7)', () => {
    expect(SR0.filter((e) => INKRAFT[e.key]?.quelle !== 'fedlex').map((e) => e.key)).toEqual([]);
  });
  it('Residuum-Gate am Korpus: kein Artikel mit ungeparster Fussnote bekommt die Zeile; keiner mit Ereignis', () => {
    let gezeigt = 0, unterdrueckt = 0;
    for (const e of SR0) {
      const s = shardVon(e.key);
      const residuum = new Set((s?.residuum ?? []).map((r) => r.token));
      for (const eint of snap(e.key)) {
        const iso = erlassStandFuerArtikel(eingangFuer(e.key, eint.artikel));
        if (iso) {
          gezeigt++;
          expect(residuum.has(eint.artikel), `${e.key} Art. ${eint.artikel} im Residuum`).toBe(false);
          expect(s?.artikel[eint.artikel]?.ereignisse.length ?? 0, `${e.key} Art. ${eint.artikel} hat Ereignis`).toBe(0);
          expect(iso).toBe(e.inkraftSeit);
        } else unterdrueckt++;
      }
    }
    // Es gibt beides: Staatsverträge ohne jedes Ereignis zeigen die Zeile, die übrigen nicht.
    expect(gezeigt).toBeGreaterThan(500);
    expect(unterdrueckt).toBeGreaterThan(0);
  });
});
