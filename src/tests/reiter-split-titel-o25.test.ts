import { describe, it, expect } from 'vitest';
import { reiterKurzformText } from '../lib/tabs';
import { labelAusMeta, verlaufLabel } from '../lib/verlaufLabel';

// ═══ O-25 · DER REITER FOLGT DER WEICHE (#schkg / #straf) ════════════════════
//
// GEMESSEN 15.10.2026 (Dev-Server, headless Chromium 1280×900,
// visibilityState visible): `/rechner/zustaendigkeit#schkg` zeigte in der H1
// «Zuständigkeit Vollstreckung (SchKG)», der Reiter hiess weiter «Zuständigkeit
// Zivilprozess» — dasselbe bei `#straf`. Ursache: der Reiter-Titel kam aus dem
// hash-losen Pfad, die drei Katalog-Karten teilen sich aber eine Rechner-Seite
// und unterscheiden sich nur durch den Hash (§8: Titel darf der Seite nicht
// widersprechen).
//
// ROT ZU BEKOMMEN (§6.7): in `lib/verlaufLabel.karteMitHash` `return null`
// vorneweg ⇒ die beiden Split-Fälle messen «Zuständigkeit Zivilprozess».

describe('O-25 — Reiter-Titel bei Split-Karten', () => {
  const titel = (path: string) => reiterKurzformText({ path }, {});

  it('#schkg und #straf tragen den Titel ihrer eigenen Karte', () => {
    expect(titel('/rechner/zustaendigkeit#schkg')).toBe('Zuständigkeit Vollstreckung');
    expect(titel('/rechner/zustaendigkeit#straf')).toBe('Zuständigkeit Strafverfahren');
  });

  it('die Abfrage zwischen Pfad und Hash stört nicht', () => {
    expect(titel('/rechner/zustaendigkeit?sa=betreibung_einleiten&sro=provisorisch#schkg'))
      .toBe('Zuständigkeit Vollstreckung');
  });

  it('ohne Hash bleibt die Zivil-Karte; ein unbekannter Hash ändert nichts', () => {
    expect(titel('/rechner/zustaendigkeit')).toBe('Zuständigkeit Zivilprozess');
    expect(titel('/rechner/zustaendigkeit#irgendwas')).toBe('Zuständigkeit Zivilprozess');
  });

  it('der volle Titel bleibt für den Verlauf erhalten (nichts geht verloren, §8)', () => {
    expect(verlaufLabel('/rechner/zustaendigkeit#schkg')).toBe('Zuständigkeit Vollstreckung (SchKG)');
    expect(labelAusMeta('/rechner/zustaendigkeit#straf')).toBe('Zuständigkeit Strafverfahren');
  });

  it('ein Artikel-Anker eines Erlasses trifft keine Split-Karte', () => {
    expect(labelAusMeta('/gesetze/bund/OR#art-336_c')).toBeNull();
  });
});
