import { describe, expect, it } from 'vitest';
import { artRevFassungFallback } from '../pages/gesetz-leser/v3/PanelTafeln';
import type { ArtikelHistorie } from '../lib/normtext/historie-parse';
import type { ArtikelRevision } from '../lib/verzahnung/artikel-revisionen';

// Bug-Check #1045 (24.9.2026) · Posten «Reiter Änderungen: Artikel mit
// Revisions-Eintrag, aber ohne Historie-Ereignisse zeigt weder Fassung noch
// ‹Zu Art. N nichts erfasst›».
//
// EMPIRISCHE SUCHE (vor diesem Test durchgeführt, KEIN Treffer): für jedes
// Erlass/Token-Paar aus `public/verzahnung/artikel-revisionen/*.json`
// (`proArtikel`) existiert im zugehörigen `public/normtext/historie/*.json`
// (`artikel`) ein Eintrag MIT `ereignisse.length > 0` — kanonisiert wie
// `revisionFuerToken`/`historieFuer` es tun (`kanonArtikelToken`: lowercase,
// `_`/Leerzeichen entfernt). Kommando (Node, aus dem Worktree heraus):
//
//   node -e "
//     const {readFileSync,readdirSync,existsSync}=require('node:fs');
//     const revDir='public/verzahnung/artikel-revisionen', histDir='public/normtext/historie';
//     const kanon=s=>String(s).toLowerCase().replace(/[\s_]+/g,'');
//     let n=0;
//     for (const f of readdirSync(revDir)) {
//       if (!f.endsWith('.json')) continue;
//       const rev = JSON.parse(readFileSync(revDir+'/'+f,'utf8'));
//       const histPath = histDir+'/'+f;
//       if (!existsSync(histPath)) continue;
//       const hist = JSON.parse(readFileSync(histPath,'utf8'));
//       const histTokens = new Set(Object.keys(hist.artikel??{}).map(kanon));
//       for (const t of Object.keys(rev.proArtikel??{})) if (!histTokens.has(kanon(t))) n++;
//     }
//     console.log('Treffer:', n);
//   "
//   → Treffer: 0 (Stand 24.9.2026, 205 Revisions-Shards, alle mit Historie-Shard
//     gedeckt). Die Invariante «artRev ⇒ Historie-Ereignis» hält aktuell im
//     ganzen Bund-Korpus (kantonal: `artikelRevisionen` deckt nur `bund`, also
//     dort ohnehin nie `artRev`). Der Defekt ist darum eine LATENTE Lücke im
//     Vertrag zwischen den zwei Generatoren, kein aktuell sichtbarer — dieser
//     Test deckt ihn über KONSTRUIERTE Eingabe ab (Auflage im Posten).

const revision = (over: Partial<ArtikelRevision> = {}): ArtikelRevision => ({
  iso: '2020-01-01', as: 'AS 2020 1', ...over,
});
const historieMit = (...datums: string[]): ArtikelHistorie => ({
  giltSeit: datums.at(-1) ?? null,
  ereignisse: datums.map((datum) => ({ typ: 'fassung', datum, wirkung: false, quellen: [], absatz: null, item: null })),
});

describe('Bug-Check #1045 · artRevFassungFallback (stille Leerstelle «Fassung»)', () => {
  it('KONSTRUIERT: kein Historie-Ereignis, aber ein Revisions-Beleg ⇒ Fallback greift (das ist der Bug-Fall)', () => {
    const historie: ArtikelHistorie = { giltSeit: null, ereignisse: [] };
    const rev = revision();
    expect(artRevFassungFallback(historie, rev)).toBe(rev);
  });
  it('keine Historie überhaupt (undefined), aber ein Revisions-Beleg ⇒ Fallback greift ebenso', () => {
    const rev = revision({ iso: '2019-06-01', as: '' });
    expect(artRevFassungFallback(undefined, rev)).toBe(rev);
  });
  it('Historie TRÄGT Ereignisse ⇒ kein Fallback (BlattFassung zeigt die echte Historie)', () => {
    expect(artRevFassungFallback(historieMit('2021-01-01'), revision())).toBeUndefined();
  });
  it('weder Historie-Ereignis noch Revisions-Beleg ⇒ kein Fallback (das ist der «nichts erfasst»-Fall)', () => {
    expect(artRevFassungFallback({ giltSeit: null, ereignisse: [] }, null)).toBeUndefined();
    expect(artRevFassungFallback(undefined, undefined)).toBeUndefined();
  });
});
