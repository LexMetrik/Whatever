import { describe, it, expect, beforeEach } from 'vitest';
import { ersetzeTab, ladeTabs, merkeTab, reiterKurzformText } from '../lib/tabs';
import { katalogKurzform, labelAusMeta, verlaufLabel } from '../lib/verlaufLabel';

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

beforeEach(() => {
  const speicher = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (k: string) => speicher.get(k) ?? null,
    setItem: (k: string, v: string) => void speicher.set(k, v),
    removeItem: (k: string) => void speicher.delete(k),
    clear: () => speicher.clear(),
    key: () => null,
    length: 0,
  } as unknown as Storage;
});

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

// ═══ O-25 RÜCKWEG · DIE WEICHE WECHSELT DEN HASH, DER REITER FOLGT ═══════════
//
// GEMESSEN 15.10.2026 (Gegenprüfung #1387, Dev-Server): `/rechner/zustaendigkeit#straf`
// öffnen, Weiche «Zivil» klicken ⇒ H1 «Zuständigkeit Zivilprozess», Adresse ohne
// Hash, Reiter aber weiter «Zuständigkeit Strafverfahren» (ebenso von #schkg):
// `eintragAus` erbte jeden Hash des alten Eintrags. Seit dem Fix erbt nur ein
// Artikel-Anker (`#art-…`, Lesestellung des Gesetz-Lesers).
//
// ROT ZU BEKOMMEN (§6.7): in `lib/tabs.eintragAus` die Zeile `erbe` durch
// `(h) => h` ersetzen ⇒ die drei Folgen unten messen «Strafverfahren» bzw.
// «Vollstreckung» statt «Zivilprozess».
describe('O-25 Rückweg — Reiter-Titel folgt der Weiche in jede Richtung', () => {
  /** Die Weiche navigiert per `replace` auf die neue Adresse; der TabTracker
   *  ersetzt den Reiter an seinem Platz (`ersetzeTab`, Schlüssel ohne Hash). */
  const weiche = (von: string, nach: string) => {
    merkeTab(von);
    ersetzeTab(von, nach, 'Zuständigkeit');
    const t = ladeTabs();
    expect(t.length).toBe(1);
    return t[0];
  };
  const titel = (path: string) => reiterKurzformText({ path }, {});

  it('#straf → Zivil: hash-lose Adresse, Titel «Zivilprozess»', () => {
    const t = weiche('/rechner/zustaendigkeit#straf', '/rechner/zustaendigkeit');
    expect(t.path).toBe('/rechner/zustaendigkeit');
    expect(titel(t.path)).toBe('Zuständigkeit Zivilprozess');
  });

  it('#schkg → Zivil: hash-lose Adresse, Titel «Zivilprozess»', () => {
    const t = weiche('/rechner/zustaendigkeit#schkg', '/rechner/zustaendigkeit');
    expect(t.path).toBe('/rechner/zustaendigkeit');
    expect(titel(t.path)).toBe('Zuständigkeit Zivilprozess');
  });

  it('Zivil → #straf: der Reiter trägt den neuen Hash', () => {
    const t = weiche('/rechner/zustaendigkeit', '/rechner/zustaendigkeit#straf');
    expect(t.path).toBe('/rechner/zustaendigkeit#straf');
    expect(titel(t.path)).toBe('Zuständigkeit Strafverfahren');
  });

  it('ein Update ohne Hash behält weiterhin den Artikel-Anker des Gesetz-Lesers', () => {
    merkeTab('/gesetze/bund/OR#art-336_c', 'OR');
    merkeTab('/gesetze/bund/OR?r=1');
    expect(ladeTabs()[0].path).toBe('/gesetze/bund/OR#art-336_c');
  });
});

// ═══ O-25 NEBENWIRKUNG · /rechner/kuendigung BLEIBT WIE VOR DEM PR ═══════════
//
// GEMESSEN 15.10.2026: `karteMitHash` griff über ALLE Karten auch für
// `/rechner/kuendigung#lohnfortzahlung` ⇒ Reiter «Lohnfortzahlung», H1 weiter
// «Kündigung & Fristen …». Die Titelwahl dieser Doppelkarte ist ein offener
// David-Entscheid (seo.ts); der Reiter verhält sich darum wie vor dem PR.
//
// ROT ZU BEKOMMEN (§6.7): in `lib/verlaufLabel.karteMitHash` die Zeile
// `if (!HASH_FOLGT_H1.has(pfad)) return null;` streichen ⇒ der Reiter heisst
// «Lohnfortzahlung».
describe('O-25 Nebenwirkung — Kündigung folgt dem Hash nicht', () => {
  const titel = (path: string) => reiterKurzformText({ path }, {});

  it('#lohnfortzahlung und #kuendigung tragen denselben Titel wie die hash-lose Route', () => {
    const ohne = titel('/rechner/kuendigung');
    expect(titel('/rechner/kuendigung#lohnfortzahlung')).toBe(ohne);
    expect(titel('/rechner/kuendigung#kuendigung')).toBe(ohne);
  });

  it('keine Split-Karte für /rechner/kuendigung (Label und Kurzform)', () => {
    expect(labelAusMeta('/rechner/kuendigung#lohnfortzahlung')).toBe(labelAusMeta('/rechner/kuendigung'));
    expect(katalogKurzform('/rechner/kuendigung#lohnfortzahlung')).toBe(katalogKurzform('/rechner/kuendigung'));
  });

  it('nach innerem Reiter-Wechsel (Hash weg) bleibt der Reiter bei der Seite', () => {
    merkeTab('/rechner/kuendigung#lohnfortzahlung');
    ersetzeTab('/rechner/kuendigung#lohnfortzahlung', '/rechner/kuendigung', 'Kündigung');
    expect(ladeTabs()[0].path).toBe('/rechner/kuendigung');
  });
});
