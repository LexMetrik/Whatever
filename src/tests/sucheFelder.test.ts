// scripts/suche-felder.ts — die EINE Extraktion der Such-Recall-Felder (§5), aus der
// seit A1-FUNDAMENT (7.10.2026) nur noch der Server-Index (scripts/datenhaltung/fts.ts)
// baut. Bis dahin hielt `src/tests/suchIndex.test.ts` diese Ergebnisse über den
// Browser-Index-Generator fest; mit dem Generator entfiel der Test. Die G-SUCH-Fälle
// (Tabellen + Fussnoten + Bild-Alt-Rauschen) leben hier weiter, direkt gegen die Quelle:
// ein Feld, das still leer läuft, macht den Server-Weg ärmer, ohne dass je eine Antwort
// leer wäre.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { artikelText, baueRecallFelder, type Block, type StrukturArtikel } from '../../scripts/suche-felder';

const NORMTEXT = join(process.cwd(), 'public', 'normtext');

interface SnapEintrag { artikel: string; grundlage?: string; bloecke?: Block[] }

function felder(erlassKey: string, artikel: string) {
  const snap = JSON.parse(readFileSync(join(NORMTEXT, 'bund', `${erlassKey}.json`), 'utf8')) as { eintraege: SnapEintrag[] };
  const e = snap.eintraege.find((x) => x.artikel === artikel);
  expect(e, `${erlassKey} Art. ${artikel} im Snapshot`).toBeDefined();
  let struktur: { artikel?: Record<string, StrukturArtikel> } = {};
  try { struktur = JSON.parse(readFileSync(join(NORMTEXT, 'struktur', 'bund', `${erlassKey}.json`), 'utf8')); } catch { /* kein Sidecar → m/n/g/f leer */ }
  const bloecke = e!.bloecke ?? [];
  return { text: artikelText(bloecke), ...baueRecallFelder(bloecke, struktur.artikel?.[artikel], e!.grundlage) };
}

// G-SUCH: Tabellenzellen + Fussnoten-Body müssen in den Recall-Feldern landen — sonst
// findet die Korpus-Suche keinen Text, der NUR in einer Tabelle oder Fussnote steht.
describe('suche-felder — Tabellen + Fussnoten indexiert (G-SUCH)', () => {
  it('Tabellenzellen (mehrspaltig) stehen im Tabellen-Feld tb, nicht im Haupttext', () => {
    // AHVG 34bis führt die AHV-Zuschlagstabelle; «Grundzuschlags» steht NUR dort.
    const f = felder('AHVG', '34_bis');
    expect(f.tb.toLowerCase()).toContain('grundzuschlags');
    expect(f.text.toLowerCase()).not.toContain('grundzuschlags');
  });

  it('Fussnoten-Body steht im Fussnoten-Feld f (ohne <b>/<i>-Tags)', () => {
    // ADOV 5 trägt einen Änderungshinweis auf die «Strafregisterverordnung».
    const f = felder('ADOV', '5');
    expect(f.f.toLowerCase()).toContain('strafregisterverordnung');
    expect(f.f).not.toMatch(/<\/?[a-z]/i);
  });

  it('generischer Bild-Alt «Amtliche Abbildung» wird NICHT indexiert (Suchrauschen) — über alle Bund-Erlasse', () => {
    const rausch: string[] = [];
    for (const datei of readdirSync(join(NORMTEXT, 'bund')).filter((n) => n.endsWith('.json')).sort()) {
      const snap = JSON.parse(readFileSync(join(NORMTEXT, 'bund', datei), 'utf8')) as { eintraege?: SnapEintrag[] };
      for (const e of snap.eintraege ?? []) {
        if (!e.bloecke?.length) continue;
        const { tb } = baueRecallFelder(e.bloecke, undefined, e.grundlage);
        if (/amtliche abbildung/i.test(tb)) rausch.push(`${datei} Art. ${e.artikel}`);
      }
    }
    expect(rausch).toEqual([]);
  });

  it('fehlender Sidecar ist kein Fehler: m/n/g/f bleiben leer (§8: nichts geraten)', () => {
    const f = baueRecallFelder([{ absatz: 'Text' }], undefined, undefined);
    expect({ m: f.m, n: f.n, g: f.g, f: f.f }).toEqual({ m: '', n: '', g: '', f: '' });
  });
});
