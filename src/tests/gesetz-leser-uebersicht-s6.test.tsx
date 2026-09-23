/**
 * W2·19-GLIEDERUNG/S6 — Erlass-Übersicht (Bau-Spec §5.1, Zone C).
 *
 * GELÖSCHT 21.8.2026 (H5): die drei ersten Blöcke dieser Datei («Platz der
 * Erlass-Übersicht», «§15.2-CLS-Reservierung», «Promotion in den Erlass-
 * Kopf») rendersten `LeserVolltextInhalt` (die Ist-Hülle) direkt und prüften
 * deren STRUKTURELLE Platzierung der Übersicht relativ zu Baum/Kontext-Panel
 * im `[data-toc]`-Fluss — eine Anordnung, die V3 architektonisch nicht teilt.
 * Mit `inhalt-volltext.tsx` fällt der geprüfte Gegenstand ersatzlos.
 *
 * §6.3-DEKLARATION (W2·29-WERKBANK-LESER S2, 23.9.2026): `parts/ErlassUebersicht`
 * ist gelöscht — die Früh-Ansichten (`inhalt-ansichten.tsx`, pdf-embed /
 * nur-live-link) zeigen seither dieselbe Übersicht wie der Volltext-Leser
 * (`v3/UebersichtBox` aus `v3/uebersichtAngaben`, §5). Die Bug-Check-Zusagen
 * B8/B9 und «ohne Klick» ziehen mit auf den überlebenden Baustein, jede in
 * seiner Gestalt: B8 — ohne Stand entfällt die Stand-ZEILE (V3-Regel, statt
 * «Stand: nicht erfasst»; beides ist «kein leeres Versprechen»); B9 und der
 * Teilerfassungs-Beleg unverändert. «Ohne Klick» gilt für die Früh-Ansichten,
 * die die Box offen zeigen (`offen`), wie der gelöschte Baustein es tat.
 * Die reinen Ableitungen (2) und der §8-Beleg (3) bleiben Zeichen für Zeichen.
 */
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import {
  nurErlassdatum, erlassOrgan, istDatumsToken, teilerfassung, TEILERFASSUNG_BELEGE,
} from '../pages/gesetz-leser/erlassUebersichtDaten';
import { UebersichtBox } from '../pages/gesetz-leser/v3/UebersichtBox';
import { ErlassLeserKopf } from '../pages/gesetz-leser/parts/ErlassLeserKopf';
import { readFileSync } from 'node:fs';
import { uebersichtsAngaben } from '../pages/gesetz-leser/v3/uebersichtAngaben';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import type { ErlassKopf } from '../lib/normtext/browse';
import type { KantonSystematik } from '../lib/normtext/systematik';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

const erlass: BrowseErlass = {
  key: 'ZGB', ebene: 'bund', kanton: null, kuerzel: 'ZGB', titel: 'Zivilgesetzbuch', sr: '210',
  rechtsgebiet: 'privat', sprache: 'de', rang: 0, status: 'snapshot',
  datei: 'bund/ZGB.json', artikelAnzahl: 1, stand: '2026-01-01', quelleUrl: 'https://x', fassungsToken: '20260101',
  pdfPfad: null,
};
const kopf: ErlassKopf = {
  srNummer: '210', titel: 'Schweizerisches Zivilgesetzbuch',
  erlassdatum: 'vom 10. Dezember 1907 (Stand am 1. Juli 2026)',
  praeambel: [{ rolle: 'autor', text: 'Die Bundesversammlung der Schweizerischen Eidgenossenschaft,' }],
};

/** Die Übersicht, wie die Früh-Ansichten sie bauen (`inhalt-ansichten.tsx`). */
function uebersicht(e: BrowseErlass, kantonSys: Record<string, KantonSystematik> = {}, offen = false): string {
  return renderToString(
    <MemoryRouter>
      <UebersichtBox offen={offen} angaben={uebersichtsAngaben({
        erlass: e, kopf: null, currency: undefined, erlassTyp: undefined, anzahl: 3,
        bestimmungsWort: 'Artikel', bestimmungsEtikettStatus: undefined, gliederungsTiefe: 0,
        kennzahlen: null, kantonSys, kantonErlassAnzahl: null,
        nichtKonsolidiert: false, nichtKonsolidiertSeit: null,
      })} />
    </MemoryRouter>,
  );
}

// ── Bug-Check 9.8.2026 · B8/B9 ─────────────────────────────────────────────
describe('S6/Bug-Check — B8: kein leeres Stand-Versprechen', () => {
  it('Ohne erfassten Stand entfällt die Stand-Zeile, statt «Stand» ins Leere zu setzen', () => {
    const html = uebersicht({ ...erlass, stand: '' });
    expect(html).not.toContain('data-v3-uebersicht-zeile-id="stand"');
  });

  it('Mit Stand bleibt der Wert unverändert', () => {
    const html = uebersicht(erlass);
    expect(html).toContain('data-v3-uebersicht-zeile-id="stand"');
    expect(html).toContain('01.01.2026');
  });
});

describe('S6/Bug-Check — B9: Systematik-Platzhalter ist keine Aussage (§8)', () => {
  const kantonal = { ...erlass, ebene: 'kanton' as const, kanton: 'AG', sr: 'SAR 152.110' };
  it('«Bereich SAR» erscheint NICHT — die Overline derselben Seite filtert ihn auch', () => {
    // Leere Systematik ⇒ die Auflösung fällt auf den neutralen Platzhalter
    // zurück. Vorher stand er als Sachgebiet im Mehr-Block (~80 Kantonserlasse).
    const html = uebersicht(kantonal, { AG: { roots: [], index: {} } });
    expect(html).not.toContain('Bereich SAR');
    expect(html).not.toContain('data-v3-uebersicht-zeile-id="gebiet"');
  });

  it('Ein VERIFIZIERTES Sachgebiet erscheint weiterhin — der Filter schneidet nicht zu viel', () => {
    const html = uebersicht(
      { ...kantonal, sr: '640.100' },
      { AG: { roots: [{ nummer: '6', name: 'Finanzrecht', kinder: [{ nummer: '64', name: 'Steuern' }] }], index: { '640100': ['6', '64'] } } },
    );
    expect(html).toContain('data-v3-uebersicht-zeile-id="gebiet"');
    expect(html).toContain('Finanzrecht › Steuern');
  });
});

describe('S6 — reine Ableitungen', () => {
  it('nurErlassdatum schneidet ausschliesslich den Stand-Zusatz', () => {
    expect(nurErlassdatum('vom 10. Dezember 1907 (Stand am 1. Juli 2026)')).toBe('vom 10. Dezember 1907');
    expect(nurErlassdatum('vom 30. März 1911')).toBe('vom 30. März 1911');
    // Keine gierige Klammer-Jagd: eine Klammer MITTEN im Datum bleibt stehen.
    expect(nurErlassdatum('vom 1. Januar 2000 (AS 2000 1)')).toBe('vom 1. Januar 2000 (AS 2000 1)');
  });

  // ── Ä74 (17.8.2026) · die kantonale Form OHNE «am» ───────────────────────
  // FACHLICHE ERWEITERUNG, kein nachgezogener Test (§6.3): das Muster verlangte
  // «(Stand am …)» und liess damit 1182 der 1420 Sidecars durch — gemessen an
  // BS-640.100, wo die Übersicht «Vom 12. April 2000 (Stand 1. Januar 2026)»
  // zeigte und eine Zeile tiefer nochmals «Stand 01.01.2026».
  it('nurErlassdatum schneidet auch die kantonale Form «(Stand …)» ohne «am» (Ä74)', () => {
    expect(nurErlassdatum('Vom 12. April 2000 (Stand 1. Januar 2026)')).toBe('Vom 12. April 2000');
    expect(nurErlassdatum('Vom 10.11.1987 (Stand 01.01.2024)')).toBe('Vom 10.11.1987');
    // NEGATIV-SONDE: eine Klammer, die eine EIGENE Aussage trägt, bleibt stehen
    // — die freiburgische Form nennt das Inkrafttreten der Fassung, nicht den
    // Stand (11 Sidecars mit anderer Klammer, gezählt 17.8.2026).
    expect(nurErlassdatum('vom 30.11.2010 (Fassung in Kraft getreten am 01.12.2025)'))
      .toBe('vom 30.11.2010 (Fassung in Kraft getreten am 01.12.2025)');
    // NEGATIV-SONDE: «Stand» mitten im String ist kein Zusatz am Ende.
    expect(nurErlassdatum('vom 1. Januar 2000 (Stand am 1. Juli 2026) Nachtrag'))
      .toBe('vom 1. Januar 2000 (Stand am 1. Juli 2026) Nachtrag');
  });

  // ── P3-4 (Bug-Check-Nachzug 18.8.2026) · ZWEI KLAMMERN SIND AUCH ZWEI ─────
  // GEMESSEN am Bundeserlass GWV_FINMA (`public/normtext/struktur/bund/`): das
  // Sidecar trägt «vom 3. Juni 2015 (Stand am 1. Januar 2023) (Stand am
  // 1. Januar 2023)» — dieselbe Klammer doppelt. `String.replace` mit einem
  // `$`-verankerten Muster schneidet genau EINE; in der Übersichtsbox blieb die
  // erste stehen, direkt über der Zeile «Stand · 01.01.2023». Also genau die
  // Dopplung, gegen die diese Funktion gebaut ist — Ä74 hatte sie nur um eine
  // Ebene verschoben.
  // GEZÄHLT über alle 1420 Sidecars: 1 Fall. Ein Einzelfall rechtfertigt keine
  // Datenkorrektur an der Quelle (der Wortlaut ist amtlich), wohl aber ein
  // Muster, das sich nicht auf die Zahl der Klammern verlässt.
  it('nurErlassdatum schneidet ALLE Stand-Klammern am Ende, nicht nur die letzte (P3-4)', () => {
    expect(nurErlassdatum('vom 3. Juni 2015 (Stand am 1. Januar 2023) (Stand am 1. Januar 2023)'))
      .toBe('vom 3. Juni 2015');
    expect(nurErlassdatum('Vom 12. April 2000 (Stand 1. Januar 2026) (Stand 1. Januar 2026)'))
      .toBe('Vom 12. April 2000');
    // Die Negativ-Sonden von Ä74 bleiben gültig: eine FREMDE Klammer davor
    // stoppt den Schnitt, sie ist eine eigene Aussage.
    expect(nurErlassdatum('vom 1. Januar 2000 (AS 2000 1) (Stand am 1. Juli 2026)'))
      .toBe('vom 1. Januar 2000 (AS 2000 1)');
  });

  it('erlassOrgan liest die autor-Zeile ohne Schluss-Komma', () => {
    expect(erlassOrgan(kopf)).toBe('Die Bundesversammlung der Schweizerischen Eidgenossenschaft');
    expect(erlassOrgan(null)).toBeNull();
    expect(erlassOrgan({ praeambel: [{ rolle: 'ingress', text: 'gestützt auf …' }] })).toBeNull();
  });

  it('istDatumsToken trennt Fedlex-Konsolidierungsdatum vom kantonalen Drift-Hash', () => {
    expect(istDatumsToken('20260101')).toBe(true);
    expect(istDatumsToken('9d33cd9629e68f3f15966a7506601829703209cbaa714bae04cdd7f62bd28e88')).toBe(false);
    expect(istDatumsToken('')).toBe(false);
  });
});

describe('S6 — §8-Teilerfassungs-Beleg (Entscheid David 8.8.2026, Bau-Spec §11 Ziff. 2)', () => {
  // FACHLICHE ÄNDERUNG (W2·19B-KORPUS, 13.8.2026), ausdrücklich kein
  // Refactoring: der alte Wortlaut «Auswahl, nicht vollständig» beruhte auf der
  // Annahme, SG-3849 sei teilerfasst. Die Prüfung gegen die amtliche Quelle hat
  // das widerlegt — der Erlass (GebT, sGS 821.5) hat amtlich gar keine Artikel,
  // die 17 «Art.»-Einträge sind Fehlextraktionen. Herleitung im Kommentar bei
  // TEILERFASSUNG_BELEGE. Die Anker unten sind entsprechend umgestellt.
  it('SG-3849 trägt den Hinweis «Fehlerhaft erfasst»', () => {
    const beleg = teilerfassung('SG-3849');
    expect(beleg).toBeDefined();
    expect(beleg!.befund).toContain('Fehlerhaft erfasst');
    // Die Kernaussage — keine eigenen Artikel — muss im Satz stehen bleiben.
    expect(beleg!.befund).toContain('keine eigenen Artikel');
  });

  it('Der Befund stimmt mit dem committeten Snapshot überein — er kann nicht still veralten', () => {
    // Register-Schlüssel, nie Kürzel (Fixture-Regel, Bau-Spec §8-Kasten).
    const { eintraege } = ladeNormFixture('kanton', 'SG-3849');
    const nummern = eintraege
      .filter((e) => !/^Anhang/i.test(e.artikelLabel))
      .map((e) => Number.parseInt(e.artikel, 10))
      .filter((n) => Number.isFinite(n));
    // (a) EXAKT die 17 gegen die amtliche Quelle geprüften Phantom-Nummern —
    //     nicht mehr, nicht weniger. Sobald der PDF-Pfad die Ziffern-Tarife
    //     richtig liest, wird diese Zeile rot und zwingt dazu, den §8-Hinweis
    //     neu zu bewerten, statt ihn stumm weiterlaufen zu lassen.
    expect(nummern).toEqual([2, 7, 11, 12, 13, 15, 19, 43, 51, 71, 80, 82, 84, 381, 505, 544, 1032]);
    // (b) Art. 1 ist NICHT darunter — der Erlass hat amtlich überhaupt keinen.
    expect(nummern).not.toContain(1);
    // (c) Die Gebühren-Nummern sind der Haupttext, die Phantom-Artikel Beiwerk.
    expect(nummern.length * 10).toBeLessThan(eintraege.length);
  });

  it('Kein anderer Erlass trägt (noch) einen Beleg — die Liste bleibt bewusst kurz', () => {
    expect(Object.keys(TEILERFASSUNG_BELEGE)).toEqual(['SG-3849']);
  });

  it('Der Hinweis steht im Volltext-Leser OHNE Klick im Titelblatt (W2·29 S5)', () => {
    // Bis W2·29 S5 stand er im Volltext-Leser nur in der ZUGEKLAPPTEN
    // Übersichtsbox — sichtbar erst nach Aufklappen, gegen den Entscheid vom
    // 8.8.2026. ROT: in `v3/LeserErlassKopfZone.tsx` die Prop `teilerfassung`
    // weglassen bzw. in `parts/ErlassLeserKopf.tsx` den Notiz-Block entfernen.
    const zone = readFileSync('src/pages/gesetz-leser/v3/LeserErlassKopfZone.tsx', 'utf8');
    expect(zone).toContain('teilerfassung={teilerfassung(erlass.key)?.befund}');
    const html = renderToString(
      <MemoryRouter>
        <ErlassLeserKopf erlass={{ ...erlass, key: 'SG-3849', ebene: 'kanton', kanton: 'SG' }}
          overline="SG" artikelAnzahl={3} hinweis="H" teilerfassung={teilerfassung('SG-3849')?.befund} />
      </MemoryRouter>,
    );
    expect(html).not.toContain('<details');
    expect(html).toMatch(/role="note" data-v3-teilerfassung[^>]*>Fehlerhaft erfasst/);
  });

  it('Der Hinweis steht OHNE Klick da (offene Box der Früh-Ansichten)', () => {
    const html = uebersicht({ ...erlass, key: 'SG-3849', ebene: 'kanton', kanton: 'SG' }, {}, true);
    expect(html).toMatch(/<details[^>]*\sopen=""/);
    expect(html).toContain('Fehlerhaft erfasst');
  });
});
