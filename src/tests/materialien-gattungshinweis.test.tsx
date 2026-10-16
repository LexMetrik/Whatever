// @vitest-environment node
// ═══ W2·29-WERKBANK-REST S5c · §8-Hinweis je Gattung (Entscheid David 25.9.2026)
//
// Der Material-Leser sagte für JEDE Gattung «Behördenpublikation … Verwaltungs-
// verordnungen …» — auch bei Botschaften. Je Gattung ein Fall: Botschaft
// (Bund), Ratschlag (kantonales Geschäft), Kreisschreiben (Verwaltungspraxis),
// dazu Vernehmlassung. Die Gattung kommt aus `gattungVon` (§5).
//
// ROT ZU BEKOMMEN (§6.7, gefahren 25.9.2026): in `GattungsHinweis` die
// Bedingung auf `false` setzen (jede Gattung erhält den Verwaltungs-Text) ⇒
// die Fälle Botschaft, Ratschlag, Vernehmlassung werden rot; die Zweige
// tauschen ⇒ zusätzlich der Fall Kreisschreiben.
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GattungsHinweis } from '../components/materialien/GattungsHinweis';
import { gattungVon } from '../lib/materialien/gattung';
import type { DoktypId } from '../lib/materialien/typen';

const text = (d: DoktypId) => renderToStaticMarkup(<GattungsHinweis doktyp={d} />)
  .replace(/<[^>]+>/g, '').replace(/&nbsp;|\u00a0/g, ' ');

describe('S5c · GattungsHinweis — §8-Satz je Gattung', () => {
  for (const d of ['botschaft', 'ratschlag', 'gr-bericht', 'vernehmlassung'] as DoktypId[]) {
    it(`${d}: Gesetzgebungsmaterial, kein Verwaltungsverordnungs-Satz`, () => {
      expect(gattungVon(d)).toBe('materialien');
      const t = text(d);
      expect(t).toContain('Gesetzgebungsmaterial, kein Gesetzesrang.');
      expect(t).toContain('Massgeblich ist stets');
      expect(t).not.toContain('Verwaltungsverordnungen');
      expect(t).not.toContain('Behördenpublikation');
    });
  }

  for (const d of ['kreisschreiben', 'wegleitung', 'weisung', 'rundschreiben', 'ks-anhang'] as DoktypId[]) {
    it(`${d}: Verwaltungsverordnung — der bisherige Text, unverändert`, () => {
      expect(gattungVon(d)).toBe('erlaeuterungen');
      const t = text(d);
      expect(t).toContain('Behördenpublikation, kein Gesetzesrang. Verwaltungsverordnungen (Kreisschreiben, Wegleitungen, Leitfäden u. a.) binden die Verwaltung intern und sind faktisch praxisleitend, aber für Gerichte und Private nicht direkt verbindlich.');
      expect(t).toContain('Massgeblich ist stets');
      expect(t).not.toContain('Gesetzgebungsmaterial');
    });
  }

  // LESER-NAV O-05: kein Verwaltungsverordnungs-Satz, wo der Doktyp keine ist
  // (Bericht, Mitteilung) oder die Einordnung im Zweifel steht (Merkblatt …).
  // Rot-Probe: `istVerwaltungsverordnung` immer `true` ⇒ alle fünf Fälle rot.
  for (const d of ['taetigkeitsbericht', 'mitteilung', 'merkblatt', 'leitfaden', 'mwst-info'] as DoktypId[]) {
    it(`${d}: neutrale Aussage, kein «Verwaltungsverordnungen», kein «binden die Verwaltung»`, () => {
      expect(gattungVon(d)).toBe('erlaeuterungen');
      const t = text(d);
      expect(t).toContain('Behördenpublikation, kein Gesetzesrang. Für Gerichte und Private nicht direkt verbindlich.');
      expect(t).toContain('Massgeblich ist stets');
      expect(t).not.toContain('Verwaltungsverordnungen');
      expect(t).not.toContain('binden die Verwaltung');
      expect(t).not.toContain('Gesetzgebungsmaterial');
    });
  }
});
