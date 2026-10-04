// ─── BS: Entscheiddatum aus dem Urteilskopf, nicht aus dem Portal-Metadatum ───
//
// ANLASS (Gegenprüfung Opus von PR #1295, 4.10.2026; Entscheid David 4.10.2026,
// «Variante A», Regel wie für die OCL-Kantone am 25.9.2026): Der Import führte
// das Portal-Feld «Entscheiddatum» als `datum`, obwohl das Datum im Urteilskopf
// («ENTSCHEID/URTEIL vom …») amtlich massgeblich ist. Belegt an acht echten
// Portal-Dokumenten (Abruf 4.10.2026, Fixtures bs-kopfdatum-*.html, rohbytes).
// Kopf-Datum gewinnt; Portal-Datum bleibt als `datumPortal` erhalten (§8-Hinweis).

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBsDokument, baueSnapshot } from '../../scripts/rechtsprechung/bs-parse';
import type { InventarZeile } from '../../scripts/rechtsprechung/bs-inventar';

const FIX = join(process.cwd(), 'scripts', 'rechtsprechung', 'fixtures');
const fix = (gn: string): Buffer => readFileSync(join(FIX, `bs-kopfdatum-${gn.toLowerCase().replace(/\./g, '-')}.html`));

/** [Geschäftsnummer, Portal-Metadatum, Kopf-Datum] — Messung 4.10.2026 am Portal. */
const BELEGE: Array<[string, string, string]> = [
  ['AUS.2026.85', '2026-09-30', '2026-10-01'],
  ['BES.2025.105', '2026-03-04', '2026-04-01'],
  ['BES.2025.117', '2026-04-08', '2026-05-06'],
  ['VD.2025.146', '2026-05-06', '2026-04-06'],
  ['AUS.2022.46', '2022-09-16', '2022-09-21'],
  ['AUS.2022.57', '2022-12-19', '2022-12-21'],
  ['BES.2023.14', '2023-09-05', '2023-10-05'],
  ['BEZ.2025.33', '2025-06-10', '2025-06-12'],
];

const zeileVon = (p: ReturnType<typeof parseBsDokument>): InventarZeile => ({
  key: 1, gn: p.gn, gnSekundaer: p.gnSekundaer, datum: p.datum, titel: p.titel,
  erstpublikation: p.erstpublikation, aktualisiert: p.aktualisiert,
});

describe('BS-Entscheiddatum: Kopf vor Portal-Metadatum (Variante A)', () => {
  for (const [gn, meta, kopf] of BELEGE) {
    it(`${gn}: Portal ${meta}, Kopf ${kopf} → datum = Kopf, Portal-Datum bleibt erhalten`, () => {
      const p = parseBsDokument(fix(gn));
      expect(p.datum).toBe(meta);          // Portal-Metadatum unverändert gelesen
      expect(p.datumKopf).toBe(kopf);      // Kopf wird seit B-1 gelesen
      const s = baueSnapshot(p, zeileVon(p), p.gn, '2026-10-04');
      expect(s.datum).toBe(kopf);
      const [y, m, d] = kopf.split('-');
      expect(s.zitierung.endsWith(` vom ${d}.${m}.${y}`)).toBe(true);
      expect(s.datumPortal).toBe(meta);
      expect(s.datumUnbekannt).toBeUndefined();
    });
  }
});
