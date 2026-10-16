// O-14 (FEHLERBESTAND): kaputte %-Escapes in Reiter-Pfaden und Hash-Ankern duerfen
// nirgends werfen (sicherDekodiert, PA-1-B01). Gegenprobe 15.10.2026: mit werfendem
// sicherDekodiert 117 Wuerfe, ohne 0.
import { describe, it, expect } from 'vitest';
import * as tg from '../lib/tabGruppen';
import * as tb from '../lib/tabs';
import * as vl from '../lib/verlaufLabel';

const bad = ['%E0%A4%A', '%', '%zz'];
const pfade: string[] = [];
for (const b of bad) {
  pfade.push(`/gesetze/bund/${b}`, `/gesetze/bund/OR#art-${b}`, `/gesetze/bund/OR#art-336c${b}`, `/gesetze/${b}/OR`, `/rechtsprechung/${b}`, `/materialien/${b}`, `/materialien/x/${b}`, `/gesetze/bund/OR#${b}`, `/${b}`);
}
describe('O-14 · kaputtes %-Escape in Reiter-Pfaden wirft nirgends', () => {
  it('wirft nirgends', () => {
    const fails: string[] = [];
    for (const p of pfade) {
      const fns: Record<string, () => unknown> = {
        reiterKategorie: () => tg.reiterKategorie(p), herkunftVon: () => tg.herkunftVon(p), gleiche: () => tg.gleicheReiterGruppe(p, p),
        kanton: () => tg.kantonVonPfad(p), stelle: () => tg.stelleVonReiter({ path: p }), stelleWahl: () => tg.stelleVonReiter({ path: '/gesetze/bund/OR', wahl: p.slice(p.indexOf('#')) }),
        bedarf: () => tg.manifestBedarf([{ path: p }]), kurzform: () => tb.reiterKurzform(p), kt: () => tb.reiterKurzformText({ path: p } as never, {}), kk: () => tb.reiterKarteTeile({ path: p } as never, {}),
        titel: () => tb.reiterTitel({ path: p } as never, {}), schl: () => tb.tabSchluessel(p), oeffnet: () => tb.oeffnetReiter(p), label: () => vl.verlaufLabel(p, {}), erlass: () => vl.erlassVonPfad(p, {}),
        mat: () => vl.materialPfad(p), ent: () => vl.entscheidPfad(p), kat: () => vl.katalogKurzform(p), meta: () => vl.labelAusMeta(p),
      };
      for (const [n, f] of Object.entries(fns)) { try { f(); } catch (e) { fails.push(`${n} ${p}: ${(e as Error).message}`); } }
    }
    
    expect(fails).toEqual([]);
  });
});
