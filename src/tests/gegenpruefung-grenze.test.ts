// src/tests/gegenpruefung-grenze.test.ts
//
// Risiko-Grenze RL-02 (W2·30-RL-W0): explizite Rechtslogik-Liste, Katalogtexte,
// Materialien-Artefakte und Tor-Pfad. Aus src/tests/gegenpruefung.test.ts
// ausgelagert (24.9.2026, §6.6-Schwelle 800 Z.) — Tests unverändert verschoben.
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  behalten,
  istPruefLogik,
  istRisikoPfad,
  istTorPfad,
  RECHTSLOGIK_DATEIEN,
  TOR_DATEIEN,
} from '../../scripts/gegenpruefung/kern';

describe('Risiko-Grenze RL-02', () => {
  // ANLASS: Prüfung Rechtslogik 23.9.2026, Befund S1-01 (RL-02, W2·30-RL-W0).
  // Gemessen vor RL-02: behalten()=false für die Engines, an denen die schweren
  // Rechtsfehler sitzen (mietrecht F4-01, gewaehrleistung F5-05, erbteilung
  // B3-01, verzugszins S3-a …) — ihre Fixes wären ohne Zweitblick gelandet.
  it('RL-02 A: Rechtslogik-Engines ausserhalb RECHNEN_RE sind Risiko (explizite Liste)', () => {
    for (const p of [
      'src/lib/verzugszins.ts',
      'src/lib/lohnfortzahlung.ts',
      'src/lib/erbteilung.ts',
      'src/lib/mietrecht.ts',
      'src/lib/gewaehrleistung.ts',
      'src/lib/teuerung.ts',
      'src/lib/datumsUtils.ts',
      'src/lib/emissionsabgabe.ts',
      'src/lib/notariatGrundbuch.ts',
      'src/lib/notariate.ts',
      'src/lib/vdSchlichtung.ts',
      'src/lib/zpoPresets.ts',
      'src/lib/famStatusPresets.ts',
      'src/lib/presetIndex.ts',
      'src/lib/gerichtszitat.ts',
    ]) {
      expect(behalten(p), p).toBe(true);
    }
  });

  it('RL-02 A: Rechen-Stammdaten und Zuständigkeitsregeln in src/data sind Risiko', () => {
    for (const p of [
      'src/data/zpoFeiertage.ts',
      'src/data/schkgFeiertage.ts',
      'src/data/lohnfortzahlungSkalen.ts',
      'src/data/likReihe.ts',
      'src/data/mietTermine.ts',
      'src/data/zustaendigkeitKosten.ts',
      'src/data/zustaendigkeitKantone.ts',
      'src/data/zustaendigkeit/beSprengel.json',
    ]) {
      expect(behalten(p), p).toBe(true);
    }
  });

  it('RL-02 A: Rechtsprechungs-Bezüge, Katalogtexte mit Statusaussagen, Rechtshinweis-Seite', () => {
    expect(behalten('src/lib/rechtsprechung/bezuege.ts')).toBe(true);
    expect(behalten('public/rechtsprechung/bezuege/OR.json')).toBe(true);
    expect(behalten('src/lib/startseiteKarten.ts')).toBe(true);
    expect(behalten('src/lib/startseiteKartenAusbau.ts')).toBe(true);
    expect(behalten('src/lib/startseiteKartenBetraegeWerkzeuge.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagen.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenAusbau.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenEingabenGesellschaft.ts')).toBe(true);
    expect(behalten('src/lib/startseiteVorlagenVorsorgeVertraege.ts')).toBe(true);
    expect(behalten('src/pages/VorlageVerjaehrungsverzicht.tsx')).toBe(true);
  });

  it('Entscheid David 25.9.2026: ALLE Urteilsdaten public/rechtsprechung/** sind Risikopfad', () => {
    // Vorher (bis 25.9.2026) nur bezuege/*.json — Register, Snapshots, Richter
    // und Norm-Index lagen ausserhalb (Messung Teil A §2: false).
    for (const p of [
      'public/rechtsprechung/register.json',
      'public/rechtsprechung/bund/bge/146_III_1.json',
      'public/rechtsprechung/kanton/BS/bs_appellationsgericht/AK.2022.32.json',
      'public/rechtsprechung/richter.json',
      'public/rechtsprechung/bezuege-bilanz.json',
      'public/rechtsprechung/norm-index.json',
      'public/rechtsprechung/norm-index-erlasse.json',
      'public/rechtsprechung/norm-index/OR.json',
      'public/rechtsprechung/normkeys-kanton.json',
      'public/rechtsprechung/kuenftig/unterordner/x.json',
    ]) {
      expect(istRisikoPfad(p), p).toBe(true);
      expect(behalten(p), p).toBe(true);
    }
    // Nachbarn bleiben draussen (Präfix mit Schrägstrich, kein Substring).
    expect(behalten('public/rechtsprechung-alt/register.json')).toBe(false);
    expect(behalten('src/lib/rechtsprechung/register.ts')).toBe(false);
  });

  // ANLASS: Gegenprüfung RL-02 24.9.2026 — die committeten Generator-Artefakte in
  // src/lib/materialien/*.generated.ts (Amtsdaten stand/quelleUrl/normKeys aus
  // scripts/materialien/**) lagen ausserhalb der Grenze, obwohl Generator und
  // Projektion (public/materialien/**) Risiko sind. Gemessen vor dem Fix: false.
  it('RL-02 A: Materialien-Generator-Artefakte in src/lib/materialien sind Risiko', () => {
    expect(behalten('src/lib/materialien/botschaften.generated.ts')).toBe(true);
    expect(behalten('src/lib/materialien/bs-grossrat.generated.ts')).toBe(true);
    expect(behalten('src/lib/materialien/vernehmlassungen.generated.ts')).toBe(true);
  });

  it('RL-02 A Gegenprobe: Materialien-Ladeschichten bleiben frei (keine Rechtslogik)', () => {
    expect(behalten('src/lib/materialien/browse.ts')).toBe(false);
    expect(behalten('src/lib/materialien/ratschlaege.ts')).toBe(false);
    expect(behalten('src/lib/materialien/kanten-shard.ts')).toBe(false);
  });

  it('RL-02 A Gegenprobe: Nicht-Engines, PDF-Render, Adressdaten, andere Seiten, Tests bleiben frei', () => {
    expect(behalten('src/lib/kantone.ts')).toBe(false);
    expect(behalten('src/lib/bruch.ts')).toBe(false);
    expect(behalten('src/lib/pdf/pdfRender.ts')).toBe(false); // rendert nur das Assemble-Ergebnis (§5)
    expect(behalten('src/data/zivilgerichteErstinstanz.ts')).toBe(false); // Adressen, W-03 offen
    expect(behalten('src/data/betreibungsaemter.ts')).toBe(false);
    expect(behalten('src/data/handelsregisteraemter.ts')).toBe(false);
    expect(behalten('src/data/obereInstanzen.ts')).toBe(false);
    expect(behalten('src/data/schlichtungsstellen.ts')).toBe(false);
    expect(behalten('src/pages/VorlageMietvertrag.tsx')).toBe(false); // kein Glob über src/pages/**
    expect(behalten('src/tests/mietrecht.test.ts')).toBe(false);
    expect(behalten('src/lib/startseiteModule.tsx')).toBe(false); // nur Karten-/Vorlagen-Katalogtexte
  });

  // ANLASS: Prüfung Rechtslogik 23.9.2026, Entscheid David W-02 (b) «Ja, in
  // Welle 0 mitbauen»: eine Aufweichung eines Tors fiel bisher durch kein Tor,
  // weil istPruefLogik() die Tore selbst ausnahm.
  it('RL-02 B: Tor-Pfade sind gegenprüfungspflichtig, obwohl Prüflogik', () => {
    for (const p of [
      'scripts/gegenpruefung/kern.ts',
      'scripts/gegenpruefung/squash-trailer.ts',
      'scripts/gegenpruefung-ok.ts',
      'scripts/check-gegenpruefung.ts',
      'scripts/check-merge-schutz.ts',
      '.github/workflows/ci.yml',
      'scripts/gate.sh',
      'scripts/golden-outputs.ts',
      'golden/lexmetrik-golden.json',
      'scripts/analyse/test-assertion-diff.ts',
      'scripts/analyse/assertion-mengen.ts',
      'scripts/check-fachaenderung.ts',
      'scripts/analyse/fachaenderung-kern.ts',
    ]) {
      expect(istTorPfad(p), p).toBe(true);
      expect(behalten(p), p).toBe(true);
    }
    // Prüflogik-Eigenschaft bleibt unverändert — nur behalten() kombiniert neu.
    expect(istPruefLogik('scripts/gegenpruefung/kern.ts')).toBe(true);
  });

  it('RL-02 B Gegenprobe: Tests und übrige check-Skripte sind kein Tor-Pfad', () => {
    expect(istTorPfad('src/tests/gegenpruefung.test.ts')).toBe(false);
    expect(istTorPfad('scripts/gegenpruefung/kern.test.ts')).toBe(false);
    expect(behalten('scripts/gegenpruefung/kern.test.ts')).toBe(false);
    expect(behalten('scripts/normtext/check-drift.ts')).toBe(false);
    expect(behalten('.github/workflows/fedlex-frische.yml')).toBe(false);
    expect(behalten('golden/anderes.json')).toBe(false);
  });

  // §6.7: eine explizite Liste verliert still ihre Wirkung, wenn eine Datei
  // umbenannt wird — das Prädikat träfe dann ins Leere. Dieser Test macht das rot.
  it('RL-02: jede Datei der expliziten Listen existiert im Baum', () => {
    const wurzel = join(__dirname, '..', '..');
    const fehlend = [...RECHTSLOGIK_DATEIEN, ...TOR_DATEIEN].filter((p) => !existsSync(join(wurzel, p)));
    expect(fehlend).toEqual([]);
    expect(RECHTSLOGIK_DATEIEN.length).toBeGreaterThan(20);
    expect(TOR_DATEIEN.length).toBeGreaterThan(5);
    // Katalogtext-Familie (Muster statt Liste): der Baum trägt sie wirklich.
    const katalog = readdirSync(join(wurzel, 'src/lib'))
      .map((b) => `src/lib/${b}`)
      .filter((p) => /^src\/lib\/startseite(Karten|Vorlagen)[A-Za-z]*\.ts$/.test(p));
    expect(katalog.length).toBeGreaterThanOrEqual(8);
    for (const p of katalog) expect(behalten(p), p).toBe(true);
    // Bezüge-Shards: mindestens einer existiert und ist erfasst.
    const shards = readdirSync(join(wurzel, 'public/rechtsprechung/bezuege')).filter((b) => b.endsWith('.json'));
    expect(shards.length).toBeGreaterThan(0);
    expect(behalten(`public/rechtsprechung/bezuege/${shards[0]}`)).toBe(true);
  });
});
