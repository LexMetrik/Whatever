import { describe, expect, it } from 'vitest';
import { fahrplanVollzogen, pruefeEtappenBuchung } from '../../scripts/plan/etappenBuchung';

// ─── Regel 14 — ETAPPEN-BUCHUNG (Anlass 15.9.2026, W2·5m-LESER-V3) ────────────
//
// Herleitung, Richtungs-Grenze und Geburtsbeweis stehen im Kopf von
// scripts/plan/etappenBuchung.ts. Hier wird die Mechanik festgenagelt, damit sie
// auch dann noch rot werden KANN, wenn die reale ROADMAP längst bereinigt ist
// (F2e: ein Tor, das man nur einmal rot gesehen hat, ist nur einmal geprüft).

const META = (fp: string) => `  <!-- @meta id: W9·TEST · status: ready · blocker: null · dep: [] · feld: test · fahrplan: ${fp} -->`;

const roadmap = (zeilen: string[]) => ['- [ ] **Dach-Schritt**', META('fahrplaene/FP-TEST.md'), ...zeilen].join('\n');
const leser = (inhalt: string) => (p: string) => (p === 'fahrplaene/FP-TEST.md' ? inhalt : null);

describe('Regel 14 · Etappen-Buchung', () => {
  it('ROT: Fahrplan sagt vollzogen, ROADMAP-Checkbox ist offen', () => {
    const p = pruefeEtappenBuchung(
      roadmap(['  - [ ] **S2 · Typografie** — offen.']),
      leser('| **S2** OK **gebaut 17.8.2026** | Artikel-Raster |'.replace('OK', '✅')),
    );
    expect(p).toHaveLength(1);
    expect(p[0].id).toBe('W9·TEST');
    expect(p[0].meldung).toContain('"S2"');
  });

  it('GRUEN: beide sagen vollzogen', () => {
    expect(
      pruefeEtappenBuchung(
        roadmap(['  - [x] **S2 · Typografie** — ✅ erledigt, PR #550.']),
        leser('| **S2** ✅ **gebaut 17.8.2026** |'),
      ),
    ).toHaveLength(0);
  });

  it('GRUEN: beide sagen offen', () => {
    expect(
      pruefeEtappenBuchung(roadmap(['  - [ ] **S2 · Typografie** — offen.']), leser('| **S2** | Artikel-Raster |')),
    ).toHaveLength(0);
  });

  it('GRUEN (Richtungs-Grenze, deklariert): ROADMAP abgehakt ohne Fahrplan-Haken', () => {
    expect(
      pruefeEtappenBuchung(roadmap(['  - [x] **S9 · Nur im Plan gefuehrt** — erledigt.']), leser('kein S9 hier')),
    ).toHaveLength(0);
  });

  it('greift nur unter Dach-Schritten MIT fahrplan:-Feld', () => {
    const ohne = ['- [ ] **Dach ohne Fahrplan**', '  <!-- @meta id: W9·OHNE · status: ready -->', '  - [ ] **S2 · Typografie** — offen.'].join('\n');
    expect(pruefeEtappenBuchung(ohne, leser('| **S2** ✅ |'))).toHaveLength(0);
  });

  it('ein neuer Dach-Schritt beendet den Geltungsbereich des vorigen Fahrplans', () => {
    const md = [
      roadmap(['  - [x] **S2 · Typografie** — erledigt.']),
      '- [ ] **Anderes Dach ohne Fahrplan**',
      '  - [ ] **S2 · Gleichnamige Etappe anderswo** — offen.',
    ].join('\n');
    expect(pruefeEtappenBuchung(md, leser('| **S2** ✅ |'))).toHaveLength(0);
  });

  it('Haken in einer anderen Tabellenzelle zaehlt nicht als Vollzug', () => {
    // Die Nachweis-Spalte einer S4-Zeile traegt oft fremde Haken («Ä75 ✅»).
    expect(fahrplanVollzogen('| **S4** | Sortierung | keine | Ä24 ✅ erledigt |', 'S4')).toBeNull();
    expect(fahrplanVollzogen('| **S4** ✅ | Sortierung |', 'S4')).toContain('✅');
  });

  it('erkennt «VOLLZOGEN» als Prosa-Form des Hakens', () => {
    expect(fahrplanVollzogen('| **H4** **VOLLZOGEN 18.8.2026** |', 'H4')).toContain('VOLLZOGEN');
  });

  it('Prosa-Titel ohne Etappen-Kennung wird nicht als Etappe gelesen', () => {
    expect(
      pruefeEtappenBuchung(
        roadmap(['  - [ ] **Fassungs-Diff-Tab · UI-Anteil** — offen.']),
        leser('**Fassungs-Diff-Tab** ✅'),
      ),
    ).toHaveLength(0);
  });
});
