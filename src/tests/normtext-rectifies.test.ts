// Rectifies-Wächter: Extraktion, Klassifikation und Stale-Sicherung der
// rectifies-Berichtigungs-Verknüpfung (scripts/normtext/rectifies-berichtigung.ts) —
// abgespalten aus normtext-revisionen.test.ts, §6.6, 19.9.2026.
import { describe, it, expect } from 'vitest';
import type { SparqlBinding } from '../../scripts/fedlex-sparql';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  ausnahmeGueltig, extrahiereHeadlineZitate, findeNichtKonsumierteAusnahmen, findeTreffendenBlock,
  formatiereBefundDetail, formatiereStaleDetail, kanonischeTextFundstelle, klassifiziereBerichtigung,
  loeseBerichtigungsHtmlUrl, NICHT_ABRUFBAR_OBERGRENZE, nichtAbrufbarUeberObergrenze,
  type RectifiesAusnahme,
} from '../../scripts/normtext/rectifies-berichtigung';

function bind(o: Record<string, string | undefined>): SparqlBinding {
  const b: SparqlBinding = {};
  for (const [k, v] of Object.entries(o)) if (v !== undefined) b[k] = { value: v };
  return b;
}

// ── rectifies-Wächter (ROADMAP W2·18-FEHLERBUCH): Extraktion aus zwei gespeicherten
// Filestore-HTML-Fixtures (additiv, kein Netz). Rot-Beweis für `check:revisionen-rectifies`
// liegt in dessen eigenem Docstring (Live-Mass 12.9.2026: 14 uebereinstimmend/2 abweichend/
// 2 sammelberichtigung/7 nicht-abrufbar von 25 Kanten) — hier nur die reine Klassifikation.
// Stand 18.9.2026: 31 Kanten, 19 uebereinstimmend/2 abweichend/2 sammelberichtigung/
// 8 nicht-abrufbar (Modus auto UND netz, identisch; Gegenprüfung Opus Auflagen B1/B2 —
// Klassifikation nach Headline-Blöcken statt roher AS-Anzahl, s. `check-revisionen-rectifies.ts`).
function ladeFixture(datei: string): string {
  return readFileSync(join(__dirname, 'fixtures', datei), 'utf8');
}

describe('extrahiereHeadlineZitate + klassifiziereBerichtigung (rectifies-Wächter)', () => {
  it('SKV/oc-2025-686: Berichtigungstext nennt AS 2025 644 — rectifies-Ziel zeigt aber auf AS 2025 648 (belegter Fedlex-Datenfehler, Ausnahmeliste)', () => {
    const html = ladeFixture('rectifies-skv-oc-2025-686-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2025 644']);
    expect(zitate.sr).toEqual(['741.013']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.413', zielFundstelle: 'AS 2025 648' }))
      .toBe('abweichend');
  });

  it('ChemRRV/oc-2022-560: Berichtigungstext nennt AS 2022 162 — deckt sich mit dem rectifies-Ziel', () => {
    const html = ladeFixture('rectifies-chemrrv-oc-2022-560-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2022 162']);
    expect(zitate.sr).toEqual(['814.81']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '814.81', zielFundstelle: 'AS 2022 162' }))
      .toBe('uebereinstimmend');
  });

  // ── Angepasst 18.9.2026, Gegenprüfung Opus (Auflage B1, TEST-REGEL §6.3/§6.7):
  // die Erst-Fassung dieses Tests behauptete «sammelberichtigung, unabhängig vom Ziel» —
  // seit Auflage B2 (Klassifikation nach Headline-BLÖCKEN statt roher AS-Anzahl) ist das nur
  // noch richtig, WENN das Ziel in der Vereinigung der Blöcke liegt; liegt es NICHT darin,
  // ist das Ergebnis `abweichend` (Gegenstück-Test direkt darunter). Dies ist die deklarierte
  // fachliche Tor-Verschärfung aus B1, keine Refaktorierung (§6.7: «ein Tor, das nicht
  // scheitern kann, ist gefährlicher als keines»).
  it('zwei UNABHÄNGIGE Headline-Blöcke (VVEA-/SSV-Muster), Ziel in der Vereinigung ⇒ sammelberichtigung', () => {
    const zitate = { bloecke: [{ as: ['AS 1979 1961'], sr: '741.21' }, { as: ['AS 2007 5957'] }] };
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.21', zielFundstelle: 'AS 1979 1961' }))
      .toBe('sammelberichtigung');
  });

  it('zwei UNABHÄNGIGE Headline-Blöcke, Ziel NICHT in der Vereinigung ⇒ abweichend (Auflage B1, 18.9.2026)', () => {
    const zitate = { bloecke: [{ as: ['AS 1979 1961'], sr: '741.21' }, { as: ['AS 2007 5957'] }] };
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.21', zielFundstelle: 'AS 1999 1' }))
      .toBe('abweichend');
  });

  // ── Auflage B4 (Gegenprüfung Runde 2, 19.9.2026, TEST-REGEL §6.3/§6.7): die Erst-Fassung
  // dieses Tests fabrizierte einen Zustand, den der Parser NIE liefert (`as: []` bei
  // gesetztem `sr` — Gruppe 2 der Regex ist NICHT optional, ein Regex-Treffer trägt daher
  // IMMER mindestens eine AS-Fundstelle). Ersetzt durch eine echte Extraktion, die den
  // SR-Fallback auf dieselbe Weise auslöst wie im Betrieb (rectifies-Ziel ohne ableitbare
  // zielFundstelle, z. B. weil es auf ein `cc`-Abstract zeigt — Live-Fall VZAE/oc-2026-170).
  it('fällt ohne ableitbare zielFundstelle auf den SR-Abgleich zurück', () => {
    const zitate = extrahiereHeadlineZitate('<p>Änderung vom 1. Januar 2020 (AS 2020 1; SR 220)</p>');
    expect(zitate.bloecke).toEqual([{ as: ['AS 2020 1'], sr: '220' }]);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '220' })).toBe('uebereinstimmend');
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '221' })).toBe('abweichend');
  });

  // ── Dritte Falle, live belegt VTS/oc-2025-691 (Normen-Monitor-Lauf 35353185468,
  // 18.9.2026): DIESELBE Klammer nennt mehrere komma-getrennte AS-Nummern desselben
  // Jahrgangs («AS 2025 646, 665») — die Original-Änderung (646) UND eine vorangehende
  // Berichtigung derselben Änderung (665, selbst Genre 900, dateDocument 2025-10-30,
  // Filestore-Beleg https://fedlex.data.admin.ch/filestore/fedlex.data.admin.ch/eli/oc/
  // 2025/665/de/html/fedlex-data-admin-ch-eli-oc-2025-665-de-html.html). Ohne Fix: 0
  // Treffer (die Regex liess nach der ersten Nummer nur `;SR…` oder `)` zu). Amtlicher
  // Filestore-Beleg des Fixture-Texts: https://fedlex.data.admin.ch/filestore/fedlex.data.
  // admin.ch/eli/oc/2025/691/de/html/fedlex-data-admin-ch-eli-oc-2025-691-de-html.html
  // (Abruf 18.9.2026).
  it('VTS/oc-2025-691: eine Klammer mit ZWEI komma-getrennten AS-Nummern desselben Jahrgangs liefert beide Fundstellen', () => {
    const html = ladeFixture('rectifies-vts-oc-2025-691-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2025 646', 'AS 2025 665']);
    expect(zitate.sr).toEqual(['741.41']);
    expect(zitate.bloecke).toEqual([{ as: ['AS 2025 646', 'AS 2025 665'], sr: '741.41' }]);
    // Korrigiert 18.9.2026, Gegenprüfung Opus (Auflage B2 — der Präzedenz-Satz der
    // Erst-Fassung «exakt wie bei VVEA/oc-2023-543 und SSV/oc-2024-144» war FALSCH): VTS ist
    // EIN Headline-BLOCK mit zweiteiliger Fundstelle (eine Änderung, zweimal berichtigt),
    // nicht zwei unabhängige Änderungen wie VVEA/SSV (die je ZWEI separate Blöcke tragen).
    // Genau ein Block, Ziel (646) liegt darin ⇒ uebereinstimmend.
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.41', zielFundstelle: 'AS 2025 646' }))
      .toBe('uebereinstimmend');
  });

  it('Schlupfloch geschlossen (Auflage B1, Gegenprüfung Opus 18.9.2026, §6.7): VTS/oc-2025-691 mit einem NICHT genannten Ziel ⇒ abweichend statt fälschlich sammelberichtigung', () => {
    const html = ladeFixture('rectifies-vts-oc-2025-691-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    // Repro der Gegenprüfung: das rectifies-Ziel zeigt auf ein Dokument, dessen Fundstelle
    // der Text gar nicht nennt. Vor B1 lieferte `zitate.as.length > 1` unconditioniert
    // `sammelberichtigung` (still grün trotz echter Abweichung) — nach B1/B2 zählt, ob das
    // Ziel im (einzigen) Block liegt.
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '741.41', zielFundstelle: 'AS 2025 999' }))
      .toBe('abweichend');
  });

  it('Negativ-Fall: eine Klammer mit nur EINER Nummer liefert weiterhin genau eine Fundstelle (SKV/ChemRRV unverändert)', () => {
    const zitate = extrahiereHeadlineZitate(
      '<p>Änderung vom 15. Oktober 2025 (AS 2025 644; SR 741.013)</p>',
    );
    expect(zitate.as).toEqual(['AS 2025 644']);
    expect(zitate.sr).toEqual(['741.013']);
  });

  // ── Runde 2 (ROADMAP QS-MONITOR-ROT, 19.9.2026): drei weitere Parser-Lücken, live auf dem
  // #909-Datenstand reproduziert (RECTIFIES_CACHE=netz, Rot-Beweis im Bau-Bericht), KEINE davon
  // ein Fedlex-Datenfehler. Fixtures sind die vollständigen, ungekürzten Filestore-HTML
  // (Abruf 19.9.2026).
  it('KRK/oc-2026-314 (Staatsvertrags-Headline): «vom <Datum>» steht im Erlasstitel, die AS-Klammer folgt erst in einem separaten <p> ohne eigenes «vom …» — vorher 0 Treffer', () => {
    const html = ladeFixture('rectifies-krk-oc-2026-314-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2026 214']);
    expect(zitate.sr).toEqual(['0.107']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '0.107', zielFundstelle: 'AS 2026 214' }))
      .toBe('uebereinstimmend');
  });

  it('OR/oc-2023-62 (Fussnotenzeichen-Marker): «(AS 2020 4005<sup><a href="#fn-…">1</a></sup>; SR 220)» — die Fussnoten-Ziffer reisst ohne Fix die Zahl auseinander (vorher 0 Treffer)', () => {
    const html = ladeFixture('rectifies-or-oc-2023-62-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2020 4005']);
    expect(zitate.sr).toEqual(['220']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '220', zielFundstelle: 'AS 2020 4005' }))
      .toBe('uebereinstimmend');
  });

  it('VZAE/oc-2026-170 (Leerzeichen vor dem Semikolon): «(AS 2018 3173 ; SR 142.201 )» — Tag-Fragmentierung erzeugt ein Leerzeichen vor «;» (vorher 0 Treffer); Ziel ist ein cc-Abstract ohne Fundstelle ⇒ SR-Fallback', () => {
    const html = ladeFixture('rectifies-vzae-oc-2026-170-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2018 3173']);
    expect(zitate.sr).toEqual(['142.201']);
    expect(klassifiziereBerichtigung(zitate, { fremdeSr: '142.201' })).toBe('uebereinstimmend');
  });

  it('Footnote-leak-Nebenfalle (BPV/oc-2026-324): der Fussnoten-KÖRPER nennt beiläufig eine ANDERE «vom … (AS …)»-Stelle — ohne Abschneiden ab der ersten Fussnoten-<div> würde die geweitete Klammer-Distanz (Falle KRK) daraus einen erfundenen zweiten Block machen', () => {
    const html = ladeFixture('rectifies-bpv-oc-2026-324-de.html');
    const zitate = extrahiereHeadlineZitate(html);
    expect(zitate.as).toEqual(['AS 2026 309']);
    expect(zitate.bloecke).toEqual([{ as: ['AS 2026 309'], sr: '172.220.111.3' }]);
  });

  // ── Nachzug R2b, 19.9.2026 (unabhängige Opus-Gegenprüfung, Falsch-Grün-Risiko F1): das
  // bisherige `[^()]{0,120}?`-Fenster liess zwei konstruierte Gegenbeispiele durch. Beide sind
  // jetzt durch Struktur-Anker (`baueHeadlineSuchtext`) UND Fenster+Satzgrenzen-Sperre
  // ausgeschlossen — Rot-Beweis am Ende der Datei zeigt beide Regler live rot ohne den Fix.
  describe('Nachzug R2b — Falsch-Grün-Risiko F1 (Klammer-Fenster zu weit)', () => {
    it('GB1: Fliesstext im <main> OHNE Headline-Klasse mit einer beiläufigen «vom … (AS …)»-Nennung ⇒ KEIN zweiter Block (nur der echte Preamble-Block)', () => {
      const html = '<div id="preamble"><p class="erlassdatum">vom 1. Januar 2020 (AS 2020 1; SR 100.1)</p></div>'
        + '<main id="maintext"><p class="verweisartkursiv">Der Bundesrat erliess ausserdem eine '
        + 'Änderung vom 3. März 2001 (AS 2001 2206; SR 172.220.111.3), die hier nur beiläufig als '
        + 'Fliesstext erwähnt wird.</p></main>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.as).toEqual(['AS 2020 1']);
      expect(zitate.bloecke).toHaveLength(1);
    });

    it('GB2: eine Satzgrenze im Klammer-Fenster («vom … 2020. Der Bundesrat … (AS …)») ⇒ 0 Blöcke, auch innerhalb eines klassierten Elements', () => {
      const html = '<div id="preamble"><p class="erlassdatum">vom 1. Januar 2020. Der Bundesrat hat die '
        + 'Verordnung angepasst und verweist (AS 2024 999; SR 999.9).</p></div>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.bloecke).toEqual([]);
      expect(zitate.as).toEqual([]);
    });

    // Regressionsanker: die drei amtlich belegten <main>-Zweit-Headlines (SSV/oc-2024-144,
    // LRV/oc-2025-537, KLV/oc-2026-209) dürfen durch die Struktur-Eingrenzung NICHT verloren
    // gehen — sie tragen dieselben Headline-Klassen wie der Preamble-Block, nur eben innerhalb
    // <main> (reale Fedlex-Struktur, s. Docstring R2b-1). Nachgebaut nach dem live beobachteten
    // SSV-Muster (Filestore-HTML oc/2024/144, Abruf 19.9.2026): erster Block in `#preamble`
    // (`erlassdatum`), zweiter Block als eigener `erlassdatum`-Absatz eines ANHANGS innerhalb
    // `<main>`.
    it('SSV-Muster: zweiter Headline-Block INNERHALB <main> (Klasse erlassdatum) bleibt erkannt', () => {
      const html = '<div id="preamble"><h2 class="erlasskurztitel">(SSV)</h2>'
        + '<p class="erlassdatum">vom 5. September 1979 (AS 1979 1961; SR 741.21)</p></div>'
        + '<main id="maintext"><h1>Anhang</h1>'
        + '<p class="erlasstitel10pt">Nationalstrassenverordnung</p><h2 class="erlasskurztitel">(NSV)</h2>'
        + '<p class="erlassdatum">vom 7. November 2007 (AS 2007 5957)</p></main>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.as).toEqual(['AS 1979 1961', 'AS 2007 5957']);
      expect(zitate.bloecke).toEqual([
        { as: ['AS 1979 1961'], sr: '741.21' },
        { as: ['AS 2007 5957'], sr: undefined },
      ]);
    });

    // Regressionsanker für den 7/62-Befund (Nachzug R2b): ältere Fedlex-Vorlagen tragen den
    // Erlassdatum-Absatz OHNE jede der drei Klassen (nacktes `<p>vom … (AS …)</p>`) — reine
    // Klassen-Filterung würde diese 7 Dokumente verlieren; der Vor-`<main>`-Teil geht darum
    // IMMER vollständig ein, unabhängig von der Klasse.
    it('unklassierter Erlassdatum-Absatz VOR <main> (älteres Vorlagenformat) bleibt erkannt', () => {
      const html = '<div id="preamble"><p>Verordnung über den Schutz vor gefährlichen Stoffen</p>'
        + '<h2 class="erlasskurztitel">(ChemV)</h2>'
        + '<p>vom 5. Juni 2015 (AS 2015 1903; SR 813.11)</p></div>'
        + '<main id="maintext"><p>Art. 10 Abs. 1 Bst. a</p></main>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.as).toEqual(['AS 2015 1903']);
    });
  });

  // ── Nachzug R2c, 19.9.2026 (unabhängige Opus-Nach-Prüfung, Auflage C1, Falsch-Grün-Risiko):
  // der Fugentrenner ' § ' zwischen `vorMain` und den `klassenTeile`-Elementen in
  // `baueHeadlineSuchtext` lag selbst in `[^()]` und war damit für das Klammer-Fenster von
  // HEADLINE_ZITAT durchlässig — ein «vom <Datum>» am ENDE eines Elements band über die Fuge
  // hinweg an die AS-Klammer des NÄCHSTEN Elements (Phantom-Block). Rot-Beweis (Bau-Bericht):
  // beide Tests unten liefern GEGEN DEN ALTEN CODE (Fuge ' § ') je 1 Phantom-Block, gegen den
  // gefixten Code (Fuge ' () ', eine leere Klammer ist für `[^()]` unüberwindbar) 0 Blöcke.
  describe('Nachzug R2c — Falsch-Grün-Risiko C1 (Fugentrenner § ist für das Klammer-Fenster durchlässig)', () => {
    it('A5: Preamble endet auf «vom 4. Juni 2025» OHNE eigene AS-Klammer, das folgende <main>-Klassenelement trägt nur eine FREMDE AS-Klammer ⇒ 0 Blöcke (vorher 1 Phantom-Block)', () => {
      const html = '<div id="preamble"><p class="erlassdatum">vom 4. Juni 2025</p></div>'
        + '<main id="maintext"><p class="erlassdatum">(AS 2025 419; SR 832.112.31)</p></main>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.bloecke).toEqual([]);
      expect(zitate.as).toEqual([]);
    });

    it('A5b: zwei <main>-Klassenelemente («vom 4. Juni 2025» / fremde AS-Klammer), dazwischen unklassierter Fliesstext mit einer DRITTEN, irrelevanten AS-Nennung ⇒ 0 Blöcke (vorher 1 Phantom-Block [AS 2025 419], der unklassierte Fliesstext selbst geht gar nicht erst in den Suchtext ein)', () => {
      const html = '<main id="maintext">'
        + '<p class="erlassdatum">vom 4. Juni 2025</p>'
        + '<p class="verweisartkursiv">Randbemerkung ausserhalb jeder Headline-Klasse (AS 9999 1)</p>'
        + '<p class="erlassdatum">(AS 2025 419; SR 832.112.31)</p>'
        + '</main>';
      const zitate = extrahiereHeadlineZitate(html);
      expect(zitate.bloecke).toEqual([]);
      expect(zitate.as).toEqual([]);
    });
  });
});

// ── formatiereBefundDetail / findeTreffendenBlock / findeNichtKonsumierteAusnahmen
// (Gegenprüfung Runde 2, 19.9.2026, Auflagen B2/B3/B5 aus Gegenprüfung #908) ──
describe('formatiereBefundDetail — B2 (0-Treffer-Meldung) + B5 (treffender Block statt Vereinigung)', () => {
  it('0-Treffer (keine Headline erkannt): eigene Meldung «zuerst den Parser prüfen», NICHT die alte «Text nennt ∅» (Auflage B2 — genau diese Verwechslung legte am 18.9.2026 die falsche Fedlex-Fehler-Spur)', () => {
    const zitate = { as: [], sr: [], bloecke: [] };
    const detail = formatiereBefundDetail(zitate, { fremdeSr: '220', zielFundstelle: 'AS 2020 1', zielOc: 'x' }, 'abweichend');
    expect(detail).toContain('KEINE Headline erkannt (0 Treffer)');
    expect(detail).toContain('zuerst den Parser prüfen');
    expect(detail).not.toContain('Text nennt ∅');
  });

  it('sammelberichtigung: zeigt den TREFFENDEN Block statt der Vereinigungs-SR (Auflage B5) — zwei unabhängige Blöcke, nur einer trägt das Ziel', () => {
    const zitate = extrahiereHeadlineZitate(
      '<p>Änderung vom 4. Dezember 2015 (AS 2015 5699; SR 814.600)</p>'
      + '<p>Änderung vom 23. Februar 2022 (AS 2022 161; SR 814.600)</p>',
    );
    const ziel = { fremdeSr: '814.600', zielFundstelle: 'AS 2022 161' };
    const klasse = klassifiziereBerichtigung(zitate, ziel);
    expect(klasse).toBe('sammelberichtigung');
    const detail = formatiereBefundDetail(zitate, { ...ziel, zielOc: 'x' }, klasse);
    expect(detail).toContain('Treffender Block: AS 2022 161 (SR 814.600)');
    // Die andere, NICHT treffende Fundstelle bleibt als Kontext sichtbar, aber nicht als
    // „Treffer“ ausgewiesen.
    expect(detail).toContain('AS 2015 5699');
  });

  it('findeTreffendenBlock liefert undefined, wenn kein Block trifft (abweichend)', () => {
    const zitate = extrahiereHeadlineZitate('<p>Änderung vom 1. Januar 2020 (AS 2020 1; SR 220)</p>');
    expect(findeTreffendenBlock(zitate.bloecke, { fremdeSr: '221', zielFundstelle: 'AS 2020 999' })).toBeUndefined();
  });
});

// ── Nachzug R2b, F2: dreistufig statt pauschal rot (TEST-REGEL §6.3/§6.7 — die Erst-Fassung
// dieser Tests behauptete ein flaches `RectifiesAusnahme[]`; das ist die deklarierte fachliche
// Verschärfung, keine Refaktorierung: ein oc ganz ohne Kante kann nichts verdecken (WARNUNG),
// eine `nicht-abrufbar`-Kante ist zurzeit nicht prüfbar (HINWEIS), nur eine tatsächlich grüne
// Kante ist ein veralteter, scheiternder Freibrief (ROT)).
describe('findeNichtKonsumierteAusnahmen — Auflage B3, dreistufig (Nachzug R2b F2, §6.7: eine Ausnahme, die nie mehr trifft, ist ein stiller Freibrief)', () => {
  const ausnahme: RectifiesAusnahme = {
    oc: 'https://fedlex.data.admin.ch/eli/oc/2025/999',
    seit: '2026-09-19',
    belegUrl: 'https://example.test/beleg',
    begruendung: 'Test',
    erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2000/1',
  };
  const ausnahmen = new Map([[ausnahme.oc, ausnahme]]);

  it('meldet KEINE nicht konsumierte Ausnahme, solange ihr oc noch als abweichend auftritt', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'abweichend' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([]);
  });

  it('zählt `stale` ebenfalls als konsumiert (die stale-Kante bekommt ihre eigene, spezifischere Rot-Meldung)', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'stale' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([]);
  });

  it('Stufe WARNUNG: das oc kommt im geprüften Bestand gar nicht vor (Daten noch nicht geladen oder Kante entfallen) — kein Rot, es kann nichts verdecken', () => {
    const befunde = [{ oc: 'https://fedlex.data.admin.ch/eli/oc/2026/1', klasse: 'uebereinstimmend' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([{ ausnahme, stufe: 'warnung' }]);
  });

  it('Stufe HINWEIS: die Kante existiert, ist aber (ausschliesslich) nicht-abrufbar — zurzeit nicht prüfbar, kein Rot', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'nicht-abrufbar' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([{ ausnahme, stufe: 'hinweis' }]);
  });

  it('Stufe ROT (Rot-Beweis, §6.7: die Ausnahme wäre sonst ein stiller Freibrief): die Kante existiert und ist jetzt uebereinstimmend/sammelberichtigung', () => {
    const befunde = [{ oc: ausnahme.oc, klasse: 'sammelberichtigung' }];
    expect(findeNichtKonsumierteAusnahmen(ausnahmen, befunde)).toEqual([{ ausnahme, stufe: 'rot' }]);
  });
});

// ── Stale-Schutz der Ausnahmeliste (Gegenprüfung PR #834, Auflage 3, §6.7) ──
describe('ausnahmeGueltig — eine Ausnahme gilt nur für das PAAR, das sie ursprünglich belegt hat', () => {
  const skv = {
    erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2025/648',
    erwarteteZielFundstelle: 'AS 2025 648',
    erwarteteTextFundstelle: 'AS 2025 644',
  };

  it('bleibt gültig, solange Ziel-oc, Ziel-Fundstelle UND Text-Fundstelle wie belegt sind', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(true);
  });

  it('wird stale, wenn Fedlex das rectifies-Tripel auf ein DRITTES Ziel umhängt (Rot-Beweis, §6.7)', () => {
    // Verfälschter Erwartungswert simuliert genau das: das frische Ziel-oc weicht vom
    // dokumentierten ab, obwohl Fundstelle/Text unverändert blieben.
    expect(ausnahmeGueltig(skv, {
      zielOc: 'https://fedlex.data.admin.ch/eli/oc/2099/999', zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(false);
  });

  it('wird stale, wenn der amtliche Berichtigungstext eine ANDERE Fundstelle nennt als dokumentiert', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: 'AS 2030 1',
    })).toBe(false);
  });

  it('wird stale, wenn Fedlex die abgeleitete Ziel-Fundstelle selbst korrigiert', () => {
    expect(ausnahmeGueltig(skv, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: 'AS 2025 649', textFundstelle: skv.erwarteteTextFundstelle,
    })).toBe(false);
  });

  // ── Nachzug R2b, F3 (Rot-Beweis, §6.7): ein Eintrag OHNE erwarteteTextFundstelle darf NIE
  // gültig sein — auch nicht, wenn die aktuell gemessene Text-Fundstelle ebenfalls fehlt
  // (0-Treffer-Fall). Die vorherige Fassung verglich `?? ''` auf beiden Seiten und liess
  // «leer == leer» als Treffer durch (Stale-Sicherung still ausgeschaltet).
  it('ein Ausnahmeliste-Eintrag OHNE erwarteteTextFundstelle ist NIE gültig — auch nicht bei ebenfalls leerer aktueller Text-Fundstelle (F3-Sicherung)', () => {
    const ohneText = { erwartetesZielOc: skv.erwartetesZielOc, erwarteteZielFundstelle: skv.erwarteteZielFundstelle };
    expect(ausnahmeGueltig(ohneText, {
      zielOc: skv.erwartetesZielOc, zielFundstelle: skv.erwarteteZielFundstelle, textFundstelle: undefined,
    })).toBe(false);
  });
});

// ── Nachzug R2c, C5 (Rot-Beweis, §6.7): die Stale-Meldung in check-revisionen-rectifies.ts
// zeigte bisher `ausnahme.erwarteteTextFundstelle ?? '∅'` — ein FEHLENDES Feld (Eintrag nie mit
// einer Text-Fundstelle belegt) und eine leer GEMESSENE aktuelle Text-Fundstelle (0-Treffer-
// Fall) erschienen damit BEIDE identisch als «Text ∅», ununterscheidbar in der Meldung selbst.
describe('formatiereStaleDetail — eigene Formulierung für ein FEHLENDES erwarteteTextFundstelle-Feld (Nachzug R2c, C5)', () => {
  const basis = { seit: '2026-09-19', erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2025/648', erwarteteZielFundstelle: 'AS 2025 648' };

  it('Rot-Beweis der Altlücke: die alte Formel `?? \'∅\'` liefert für ein FEHLENDES Feld dieselbe Anzeige wie für eine leer gemessene aktuelle Fundstelle — ununterscheidbar', () => {
    const fehlendesFeld: string | undefined = (basis as { erwarteteTextFundstelle?: string }).erwarteteTextFundstelle;
    const leereMessung: string | undefined = undefined;
    const alteFormelFehlendesFeld = `Text ${fehlendesFeld ?? '∅'}`;
    const alteFormelLeereMessung = `Text ${leereMessung ?? '∅'}`;
    expect(alteFormelFehlendesFeld).toBe(alteFormelLeereMessung);
    expect(alteFormelFehlendesFeld).toBe('Text ∅');
  });

  it('FEHLENDES Feld ⇒ eigene Formulierung statt «Text ∅» (aktuelle Text-Fundstelle hier bewusst GEMESSEN, nicht leer, damit die Assertion nicht mit dem AKTUELL-Teil der Meldung kollidiert)', () => {
    const detail = formatiereStaleDetail(basis, { zielOc: 'https://fedlex.data.admin.ch/eli/oc/2099/999', zielFundstelle: undefined, textFundstelle: 'AS 2030 1' });
    expect(detail).toContain('Feld erwarteteTextFundstelle fehlt im Ausnahme-Eintrag');
    expect(detail).not.toContain('Text ∅');
  });

  it('GESETZTES Feld bleibt in der bisherigen Form («Text <Wert>») — kein Verhaltensbruch für die drei bestehenden Einträge', () => {
    const mitText = { ...basis, erwarteteTextFundstelle: 'AS 2025 644' };
    const detail = formatiereStaleDetail(mitText, { zielOc: 'https://fedlex.data.admin.ch/eli/oc/2099/999', zielFundstelle: undefined, textFundstelle: 'AS 2030 1' });
    expect(detail).toContain('Text AS 2025 644');
    expect(detail).not.toContain('fehlt im Ausnahme-Eintrag');
  });
});

// ── Nachzug R2b, F3: Text-Stale-Sicherung bei MEHREREN AS-Fundstellen. Die vorherige Fassung
// setzte `textFundstelle` in check-revisionen-rectifies.ts NUR bei `zitate.as.length === 1` —
// bei Mehrfach-AS blieb sie `undefined`, wodurch die Stale-Prüfung `'' === ''` verglich (§6.7).
describe('kanonischeTextFundstelle — Grundlage der Text-Stale-Sicherung bei Mehrfach-AS (Nachzug R2b, F3)', () => {
  it('genau EINE Fundstelle bleibt byte-gleich zur bisherigen Form (kein Trenner) — die drei bestehenden Ausnahmeliste-Einträge bleiben unverändert gültig', () => {
    expect(kanonischeTextFundstelle(['AS 2025 644'])).toBe('AS 2025 644');
  });

  it('MEHRERE Fundstellen werden sortiert mit " + " verbunden (kanonische Form)', () => {
    expect(kanonischeTextFundstelle(['AS 2025 851', 'AS 2025 419'])).toBe('AS 2025 419 + AS 2025 851');
  });

  it('0 Fundstellen ⇒ undefined (0-Treffer-Fall, keine „leere“ Text-Fundstelle im Sinne der Stale-Sicherung)', () => {
    expect(kanonischeTextFundstelle([])).toBeUndefined();
  });

  it('Rot-Beweis (§6.7): eine Ausnahme, deren dokumentierte Text-Fundstelle NUR EINE von ZWEI amtlich genannten Fundstellen nennt, ist stale — die kanonische Form deckt beide auf', () => {
    // Repro der Lücke: vor F3 hätte `check-revisionen-rectifies.ts` bei zwei AS-Fundstellen
    // `textFundstelle: undefined` geliefert; eine Ausnahme mit `erwarteteTextFundstelle: undefined`
    // wäre am `'' === ''`-Vergleich vorbeigekommen. Mit der kanonischen Form wird der volle Text
    // verglichen — ein Eintrag, der nur die halbe Wahrheit dokumentiert, fällt jetzt auf.
    const ausnahmeMitHalberWahrheit = {
      erwartetesZielOc: 'https://fedlex.data.admin.ch/eli/oc/2014/269',
      erwarteteZielFundstelle: 'AS 2014 1251',
      erwarteteTextFundstelle: 'AS 2025 419',
    };
    const aktuelleKanonischeForm = kanonischeTextFundstelle(['AS 2025 419', 'AS 2025 851']);
    expect(ausnahmeGueltig(ausnahmeMitHalberWahrheit, {
      zielOc: ausnahmeMitHalberWahrheit.erwartetesZielOc,
      zielFundstelle: ausnahmeMitHalberWahrheit.erwarteteZielFundstelle,
      textFundstelle: aktuelleKanonischeForm,
    })).toBe(false);
  });
});

// ── Nachzug R2b, F4: Obergrenze der nicht-abrufbar-Klasse — heute (Messung 19.9.2026) 20/82
// (#909-Stand) bzw. 8/31 (main), durchweg Alt-Berichtigungen 2021/22 ohne HTML-Manifestation.
// Ein STEIGENDER Wert soll das Tor rot machen, nicht stillschweigend weiter grün bleiben.
describe('nichtAbrufbarUeberObergrenze — Obergrenze der nicht-abrufbar-Klasse (Nachzug R2b, F4)', () => {
  it('bleibt grün, solange die Anzahl die Obergrenze nicht überschreitet', () => {
    expect(nichtAbrufbarUeberObergrenze(20, 20)).toBe(false);
    expect(nichtAbrufbarUeberObergrenze(0, 20)).toBe(false);
  });

  it('Rot-Beweis (§6.7): eine neue Berichtigung ohne HTML treibt die Zahl über die Obergrenze', () => {
    expect(nichtAbrufbarUeberObergrenze(21, 20)).toBe(true);
  });

  it('nutzt NICHT_ABRUFBAR_OBERGRENZE (20) als Default, wenn keine explizite Obergrenze übergeben wird', () => {
    expect(NICHT_ABRUFBAR_OBERGRENZE).toBe(20);
    expect(nichtAbrufbarUeberObergrenze(20)).toBe(false);
    expect(nichtAbrufbarUeberObergrenze(21)).toBe(true);
  });
});

// ── Nachzug R2b, F5: `loeseBerichtigungsHtmlUrl` wählte `bindings[0]` ohne `ORDER BY` —
// bei mehr als einer ?file-Bindung wäre das nicht deterministisch (§2) gewesen. Empirisch
// geprüft (19.9.2026, live SPARQL gegen alle 62 gecachten Kanten aus Bau- und Probe-Worktree):
// KEIN oc liefert heute mehr als eine Bindung, die Änderung ist für den Ist-Stand
// verhaltensneutral. Dieser Test verankert nur, dass die Query-Form die Ordnung trägt UND
// dass eine einzelne Bindung weiterhin exakt wie zuvor durchgereicht wird.
describe('loeseBerichtigungsHtmlUrl — deterministische Bindungsreihenfolge (Nachzug R2b, F5)', () => {
  it('sendet eine Query mit ORDER BY ?file', async () => {
    let gesendeteQuery = '';
    const fakeFetch = (async (_url: unknown, init?: RequestInit) => {
      gesendeteQuery = decodeURIComponent(String(init?.body).replace(/^query=/, ''));
      return {
        ok: true,
        headers: new Headers({ 'content-type': 'application/sparql-results+json' }),
        json: async () => ({ results: { bindings: [bind({ file: 'https://example.org/x.html' })] } }),
      };
    }) as unknown as typeof fetch;
    await loeseBerichtigungsHtmlUrl('https://fedlex.data.admin.ch/eli/oc/2025/1', fakeFetch);
    expect(gesendeteQuery).toMatch(/ORDER BY \?file/);
  });

  it('Regressions-Beweis: bei genau einer Bindung (heutiger Ist-Stand aller 62 Kanten) bleibt das Ergebnis unverändert', async () => {
    const fakeFetch = (async () => ({
      ok: true,
      headers: new Headers({ 'content-type': 'application/sparql-results+json' }),
      json: async () => ({ results: { bindings: [bind({ file: 'https://example.org/nur-eine.html' })] } }),
    })) as unknown as typeof fetch;
    await expect(loeseBerichtigungsHtmlUrl('https://fedlex.data.admin.ch/eli/oc/2025/1', fakeFetch))
      .resolves.toBe('https://example.org/nur-eine.html');
  });
});
