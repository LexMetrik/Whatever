// ─── REST S5c · Rang-Etikett je Gattung auch in SEO und Crawler-HTML ──────
// Gegenprüfung 25.9.2026: `lib/seo-detail` sagte für JEDES Material
// «Amtliche Ressource (Soft-Law, kein Gesetzesrang)», auch für Botschaften —
// während die Seite (GattungsHinweis) schon je Gattung unterschied. Beide lesen
// jetzt `GATTUNG_RANG` (§5). Rot-Probe: den alten Satz in seo-detail.ts
// zurückholen ⇒ die Botschaft-Fälle hier rot.
import { describe, it, expect } from 'vitest';
import { metaFuerMaterial, materialDetailHtml } from '../lib/seo-detail';
import type { BrowseMaterial } from '../lib/materialien/typen';

const basis = {
  key: 'X-1', titel: 'Titel', nummer: '1', behoerdeKuerzel: 'BR', behoerdeName: 'Bundesrat',
  doktypLabel: 'Botschaft', stand: '2026-01-01', sprache: 'de', quelleUrl: 'https://www.fedlex.admin.ch/',
} as unknown as BrowseMaterial;
const als = (doktyp: string) => ({ ...basis, doktyp }) as BrowseMaterial;

describe('Rang-Etikett je Gattung (SEO, Crawler-HTML)', () => {
  it.each(['botschaft', 'vernehmlassung', 'ratschlag'])('%s: Gesetzgebungsmaterial, kein «Soft-Law»', (d) => {
    const m = als(d);
    expect(metaFuerMaterial(m).beschreibung).toContain('Gesetzgebungsmaterial, kein Gesetzesrang');
    expect(metaFuerMaterial(m).beschreibung).not.toContain('Soft-Law');
    expect(materialDetailHtml(m)).toContain('Gesetzgebungsmaterial, kein Gesetzesrang.');
  });
  it('kreisschreiben: Behördenpublikation', () => {
    const m = als('kreisschreiben');
    expect(metaFuerMaterial(m).beschreibung).toContain('Behördenpublikation, kein Gesetzesrang');
    expect(materialDetailHtml(m)).toContain('Behördenpublikation, kein Gesetzesrang.');
  });
});
