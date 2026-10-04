import { describe, expect, it } from 'vitest';
import {
  erfassungsgradSatz, ruheZeile, uebersichtsAngaben, type UebersichtsEingabe,
} from '../pages/gesetz-leser/v3/uebersichtAngaben';
import type { BrowseErlass } from '../lib/normtext/browse-typen';

// ─── Ä70 · Erlass-Neutralität der Übersichtsbox (David 17.8.2026) ────────────
//
// «Der Rahmen funktioniert für Bund, Kanton und Staatsvertrag identisch —
//  Erlass-spezifisches kommt aus dem Datenmodell, nie aus `if (bund)`.»
//  (Fundament-Auflage 2, Auftrag David 16.8.2026)
//
// Diese Datei prüft die AUSWAHL der Angaben, nicht ihr Aussehen. Sie ist der
// Grund, warum die Auswahl überhaupt aus der Komponente herausgezogen wurde:
// vier von fünf Ist-Befunden waren Gestaltung, aber der fünfte war eine
// LEERE ZUSAGE («Stand:» ohne Wert, «SR —» am Kantonserlass) — und die lässt
// sich nur an den Daten prüfen, nicht am Bild.
//
// Die fünf Fälle sind die Probe aus Fahrplan Kap. 7: ein Bundesgesetz (mit
// Warnung), eine Verordnung, ein Staatsvertrag und zwei Kantonserlasse mit
// §-Etikett. Unterschiede dürfen NUR aus dem Datenmodell stammen.

function erlassBauen(p: Partial<BrowseErlass>): BrowseErlass {
  return {
    key: 'PROBE', ebene: 'bund', kanton: null, kuerzel: 'PROBE', titel: 'Probe-Erlass',
    sr: '999.9', rechtsgebiet: 'privat', sprache: 'de', rang: 1, status: 'snapshot',
    datei: 'bund/PROBE.json', artikelAnzahl: 10, stand: '2026-01-01',
    quelleUrl: 'https://www.fedlex.admin.ch/eli/cc/probe/de',
    fassungsToken: '20260101', pdfPfad: null, pdfUrl: null, pdfStand: null,
    inkraftSeit: null,
    ...p,
  } as BrowseErlass;
}

function eingabe(p: Partial<UebersichtsEingabe> & { erlass: BrowseErlass }): UebersichtsEingabe {
  return {
    kopf: null, currency: undefined, erlassTyp: undefined, anzahl: 10,
    bestimmungsWort: 'Artikel', bestimmungsEtikettStatus: undefined,
    gliederungsTiefe: 0, kennzahlen: null, kantonSys: {}, kantonErlassAnzahl: null,
    nichtKonsolidiert: false, nichtKonsolidiertSeit: null,
    ...p,
  };
}

const labels = (a: ReturnType<typeof uebersichtsAngaben>) => a.zeilen.map((z) => z.label);

// ── «Aufbau»-Zeile: «N im Anhang» (Fehlerbuch 29.8.2026; Bug-Check #566 B4) ──
// Die dritte Ausspielung derselben Anhang-Kennzahl (§5). ROT ZU BEKOMMEN: in
// uebersichtAngaben.ts das `anhang > 0 ? … 'im Anhang'`-Glied entfernen oder
// die Kennzahl-Quelle wechseln.
describe('Aufbau-Zeile trägt die Anhang-Kennzahl sichtbar', () => {
  it('SG-3849-Muster: 590 im Anhang erscheint in der Aufbau-Zeile', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ ebene: 'kanton', sr: null, artikelAnzahl: 607 }),
      anzahl: 607, gliederungsTiefe: 2,
      kennzahlen: { anhangArtikel: 590 } as never,
    }));
    const aufbau = a.zeilen.find((z) => z.id === 'aufbau');
    expect(aufbau?.wert).toBe('2 Ebenen · 590 im Anhang');
  });
  it('ohne Anhang keine Anhang-Angabe', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({}), gliederungsTiefe: 1,
      kennzahlen: { anhangArtikel: 0 } as never,
    }));
    expect(a.zeilen.find((z) => z.id === 'aufbau')?.wert).toBe('1 Ebene');
  });
});

describe('ruheZeile — die eine Zeile im Ruhezustand', () => {
  it('Bund mit SR: «SR 312.0 · 480 Artikel»', () => {
    expect(ruheZeile({ ebene: 'bund', sr: '312.0' }, 480, 'Artikel')).toBe('SR 312.0 · 480 Artikel');
  });

  it('§-Erlass zählt Paragraphen, nicht Artikel (Ä23)', () => {
    expect(ruheZeile({ ebene: 'kanton', sr: '211.11' }, 23, 'Paragraphen'))
      .toBe('211.11 · 23 Paragraphen');
  });

  // ── Ä75 (Orchestrator-Entscheid 18.8.2026, David hat Stopp-Recht) ──────────
  // «SR» heisst Systematische Rechtssammlung DES BUNDES. Über ZH-211.11 und
  // BS-640.100 stand es trotzdem — eine falsche Fundstellenangabe, keine
  // Beschriftungs-Ungenauigkeit. Kein Ersatz-Kürzel: die kantonalen Sammlungen
  // führen eigene Siglen (BS «SG», ZH «LS», AG «SAR»), die weder im Datenmodell
  // stehen noch aus `erlass.kanton` ableitbar sind; sie zu erfinden wäre §7.
  // ROT ZU BEKOMMEN: in `helpers.tsx` `kennungEtikett` fest auf `'SR'` ⇒ beide
  // Kantons-Fälle rot; auf `null` ⇒ der Bundes-Fall rot.
  it('Ä75: der Kantonserlass trägt kein «SR» — der Bundeserlass schon', () => {
    expect(ruheZeile({ ebene: 'kanton', sr: '640.100' }, 292, 'Paragraphen'))
      .not.toContain('SR');
    expect(ruheZeile({ ebene: 'kanton', sr: '640.100' }, 292, 'Paragraphen'))
      .toBe('640.100 · 292 Paragraphen');
    expect(ruheZeile({ ebene: 'bund', sr: '312.0' }, 480, 'Artikel'))
      .toBe('SR 312.0 · 480 Artikel');
  });

  it('ohne SR-Nummer entfällt das Glied ERSATZLOS — kein «SR —» (§8)', () => {
    // 12 von 1469 Erlassen tragen keine SR-Nummer (gezählt 17.8.2026).
    const z = ruheZeile({ ebene: 'bund', sr: '' }, 42, 'Artikel');
    expect(z).toBe('42 Artikel');
    expect(z).not.toContain('SR');
  });

  it('ohne Snapshot (nur-live-link/pdf-embed) keine erfundene Null', () => {
    const z = ruheZeile({ ebene: 'bund', sr: '101' }, null, 'Artikel');
    expect(z).toBe('SR 101');
    expect(z).not.toContain('0 Artikel');
  });

  it('der Stand steht NICHT mehr in der Ruhezeile (Ä70)', () => {
    // Ist-Befund: mit «Stand …» lief die Zeile an allen fünf Probe-Erlassen
    // über DREI Zeilen. Der Stand steht weiterhin in der Liste und im
    // Erlass-Kopf — er verschwindet nicht, er sprengt nur die Ruhezeile nicht.
    expect(ruheZeile({ ebene: 'bund', sr: '312.0' }, 480, 'Artikel')).not.toMatch(/Stand/);
  });
});

describe('uebersichtsAngaben — je Erlassart dieselben Regeln, andere Werte', () => {
  it('(a) Bund/Bundesgesetz mit Warnung: Art, Erlass vom, In Kraft seit, Stand, Quelle', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({
        key: 'STPO', kuerzel: 'StPO', sr: '312.0', stand: '2025-04-01',
        inkraftSeit: '2011-01-01', rechtsgebiet: 'straf',
        pdfUrl: 'https://fedlex.data.admin.ch/probe.pdf',
      }),
      kopf: { erlassdatum: 'vom 5. Oktober 2007 (Stand am 1. April 2025)', praeambel: [
        { rolle: 'autor', text: 'Die Bundesversammlung der Schweizerischen Eidgenossenschaft,' },
      ] } as UebersichtsEingabe['kopf'],
      erlassTyp: 'gesetz', anzahl: 480, gliederungsTiefe: 3,
      nichtKonsolidiert: true, nichtKonsolidiertSeit: '2025-07-01',
    }));

    expect(a.ruhe).toBe('SR 312.0 · 480 Artikel');
    // Ä80 (H4-Vorbereitung II, deklarierte fachliche Änderung — §6.3): die Kette
    // lief bis hierher «Erlassdatum · Stand · In Kraft seit» und trug die
    // Präposition im Wert. Beides ist umgestellt; die Herleitung samt Messwerten
    // steht im Ä80-Block unten und in `uebersichtAngaben.ts`.
    // Ä108 (18.8.2026, deklarierte fachliche Änderung §6.3): das Etikett heisst
    // «Erlassart» — «Art» ist im Recht zugleich die Abkürzung des Artikels, und
    // die Ruhezeile daneben zählt «480 Artikel».
    expect(labels(a)).toEqual(['Erlassart', 'Erlassgeber', 'Erlass vom', 'In Kraft seit', 'Stand', 'Aufbau']);
    // «Aufbau», nicht «Gliederung»: im Handy-Blatt trägt der Blatt-Kopf bereits
    // die Zone «Gliederung», und Ä10 hat genau diese Doppelnennung abgeräumt.
    // Der bestehende Wächter `leser-v3-auskunft` hat den Rückfall gefangen
    // (gemessen 2× statt 1×) — dieser Fall hält die Bezeichnung fest.
    expect(labels(a)).not.toContain('Gliederung');
    // Die formelhafte Stand-Klammer ist weg — der Stand steht eine Zeile
    // tiefer mit seinem maschinellen Wert (§5, sonst zweimal dasselbe Datum).
    // Ä107 (18.8.2026): EIN Datumsformat — die Wortform des Sidecars wird zur
    // Schweizer Ziffernform, wie sie «In Kraft seit»/«Stand» darunter tragen.
    expect(a.zeilen.find((z) => z.id === 'datum')?.wert).toBe('05.10.2007');
    expect(a.zeilen.find((z) => z.id === 'organ')?.wert)
      .toBe('Die Bundesversammlung der Schweizerischen Eidgenossenschaft');
    expect(a.zeilen.find((z) => z.id === 'stand')?.wert).toBe('01.04.2025');
    // Der Wortlaut ist der des Erlass-Kopfs (S3/F5), nicht ein zweiter eigener.
    expect(a.warnung).toBe('Fedlex hat eine seit 01.07.2025 geltende Änderung noch nicht'
      + ' in den Text eingearbeitet — massgeblich ist die amtliche Fassung.');
    // «⚠» steckt NICHT im String (DESIGN-REGLEMENT B3).
    expect(a.warnung).not.toContain('⚠');
    expect(a.links.map((l) => l.id)).toEqual(['quelle', 'pdf']);
    // Ä110 (18.8.2026): EIN Name für EIN Ziel — «Amtliche Fassung», dieselbe
    // Schreibung wie im Erlass-Kopf, am Artikel und am Sektionskopf.
    expect(a.links[0].label).toBe('Amtliche Fassung');
  });

  it('(b) Verordnung: dieselben Zeilen, anderer Art-Wert — kein `if (verordnung)`', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ key: 'VMWG', kuerzel: 'VMWG', sr: '221.213.11', stand: '2025-10-01' }),
      kopf: { erlassdatum: 'vom 9. Mai 1990', praeambel: [
        { rolle: 'autor', text: 'Der Schweizerische Bundesrat,' },
      ] } as UebersichtsEingabe['kopf'],
      erlassTyp: 'verordnung', anzahl: 49, gliederungsTiefe: 2,
    }));
    expect(a.zeilen.find((z) => z.id === 'art')?.wert).toBe('Verordnung');
    expect(a.zeilen.find((z) => z.id === 'organ')?.wert).toBe('Der Schweizerische Bundesrat');
    expect(a.warnung).toBeNull();
  });

  it('(c) Staatsvertrag: Art «Staatsvertrag», keine leere Zeile trotz fehlendem Inkrafttreten', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({
        key: 'LUGUE', kuerzel: 'LugÜ', sr: '0.275.12', stand: '2016-04-08',
        rechtsgebiet: 'international', inkraftSeit: undefined,
      }),
      erlassTyp: 'staatsvertrag', anzahl: 91,
    }));
    expect(a.zeilen.find((z) => z.id === 'art')?.wert).toBe('Staatsvertrag');
    expect(labels(a)).not.toContain('In Kraft seit');
    // Ohne Sidecar-Kopf gibt es weder Erlassgeber noch Erlassdatum — und dann
    // auch KEINE leere Zeile (§8).
    expect(labels(a)).not.toContain('Erlassgeber');
    expect(labels(a)).not.toContain('Erlass vom');
  });

  it('(d) Kanton mit §-Etikett: «Kanton BS · Gesetz», Erfassungsgrad als §8-Hinweis', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({
        key: 'BS-640.100', kuerzel: 'BS-640.100', sr: '640.100', ebene: 'kanton',
        kanton: 'BS', stand: '2026-01-01', rechtsgebiet: 'oeffentlich',
      }),
      erlassTyp: 'gesetz', anzahl: 292, bestimmungsWort: 'Paragraphen',
      kantonErlassAnzahl: 859, gliederungsTiefe: 5,
    }));
    // Ä75: kein «SR» über einer kantonalen Nummer (Herleitung im Fall oben).
    expect(a.ruhe).toBe('640.100 · 292 Paragraphen');
    // Ä108: die Zeile trägt die ERLASSART, nicht die Ebene. «Kanton BS» steht
    // im selben Bild schon in der Kopf-Overline und in der Krume; hier war es
    // ein Wert, der die Frage des Etiketts nicht beantwortet.
    expect(a.zeilen.find((z) => z.id === 'art')?.wert).toBe('Gesetz');
    // Ä122 (18.8.2026): derselbe §8-Hinweis, ohne die interne Stufen-Vokabel
    // «dünn/Auswahl/vollständig» (die gehört an die Kantonsliste, wo sie
    // SORTIERT). Geprüft bleibt, dass Kanton und Zahl darin vorkommen.
    expect(a.hinweise.some((h) => h.includes('Kanton BS') && h.includes('859'))).toBe(true);
  });

  it('(e) Kanton mit Etikett-Entwurf: der §8-Satz nennt das eigene Zähl-Wort (K6/Ä23)', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({
        key: 'ZH-211.11', kuerzel: 'GebV OG', sr: '211.11', ebene: 'kanton',
        kanton: 'ZH', stand: '2026-01-01',
      }),
      erlassTyp: 'verordnung', anzahl: 23, bestimmungsWort: 'Paragraphen',
      bestimmungsEtikettStatus: 'entwurf',
    }));
    expect(a.zeilen.find((z) => z.id === 'art')?.wert).toBe('Verordnung');
    // Ä122: derselbe Satz in Klartext — er nennt weiter das eigene Zähl-Wort.
    expect(a.hinweise.some((h) => h.includes('«Paragraphen»'))).toBe(true);
    expect(a.hinweise.some((h) => h.includes('«Artikel»'))).toBe(false);
  });
});

// ─── Ä80 · Fedlex-Chronologie und die Präposition im ETIKETT (H4-Vorb. II) ───
//
// BEFUND (Ästhetik-Prüfer 17.8.2026 abends, hier vor dem Fix reproduziert):
// die Liste stand «Erlassdatum · vom 5. Oktober 2007» / «Stand · 01.04.2025» /
// «In Kraft seit · 01.01.2011» — zwei Fehler in einem Block.
//
//  (1) REIHENFOLGE. Der Stand stand ZWISCHEN Erlassdatum und Inkrafttreten und
//      zerschnitt damit die Chronologie, für die man eine Steckbrief-Liste
//      überhaupt aufklappt. Fedlex ordnet «Beschluss → Inkrafttreten» und setzt
//      den Stand ans Ende der Kette (docs/ux-audit-2026-07/fedlex/or-top.png);
//      der Erlass-Kopf führt dieselbe Kette in derselben Folge. Die Box war die
//      einzige Stelle im Haus, die sie anders sortierte (§5).
//  (2) PRÄPOSITION. «vom» stand im WERT. Damit war die Wertspalte keine
//      Wertspalte mehr: zwei der drei Datumszeilen begannen mit einer Ziffer,
//      die dritte mit einem Wort — `tabular-nums` richtet nichts aus, was nicht
//      an derselben Kante beginnt, und das Etikett («Erlassdatum») sagte weniger
//      als der Wert. Fedlex hält es umgekehrt: das Label trägt die Sprache
//      («Beschluss», «Inkrafttreten»), der Wert nur das Datum.
//
// ROT ZU BEKOMMEN (§6.7): in `uebersichtAngaben.ts` die `zeilen.push`-Reihenfolge
// wieder auf datum → stand → inkraft stellen ⇒ Fall (a) rot; in `datumsAngabe`
// das Etikett fest auf «Erlassdatum» setzen bzw. `PRAEPOSITION` leeren ⇒ (b) rot.
describe('Ä80 — Chronologie Erlass → In Kraft → Stand, Präposition im Etikett', () => {
  const dreiDaten = () => uebersichtsAngaben(eingabe({
    erlass: erlassBauen({
      key: 'STPO', kuerzel: 'StPO', sr: '312.0', stand: '2025-04-01',
      inkraftSeit: '2011-01-01',
    }),
    kopf: { erlassdatum: 'vom 5. Oktober 2007 (Stand am 1. April 2025)' } as UebersichtsEingabe['kopf'],
    erlassTyp: 'gesetz', anzahl: 480,
  }));

  it('(a) die Datums-Kette läuft chronologisch: Erlass vom → In Kraft seit → Stand', () => {
    const ids = dreiDaten().zeilen.map((z) => z.id).filter((id) => ['datum', 'inkraft', 'stand'].includes(id));
    expect(ids).toEqual(['datum', 'inkraft', 'stand']);
  });

  it('(b) die Präposition steht im ETIKETT, der Wert ist ein reines Datum', () => {
    const a = dreiDaten();
    const datum = a.zeilen.find((z) => z.id === 'datum');
    expect(datum?.label).toBe('Erlass vom');
    // Ä107 (18.8.2026, deklarierte fachliche Änderung §6.3): EIN Datumsformat
    // im Steckbrief. Die Wortform stand zwischen zwei numerischen Zeilen und
    // liess `tabular-nums` ins Leere laufen; Herleitung und Zählung (1062 von
    // 1420 Sidecars in Wortform) in `v3/datumsForm.ts`.
    expect(datum?.wert).toBe('05.10.2007');
    // Kein Wert der drei Datumszeilen beginnt mit einem Wort — sonst richtet
    // `tabular-nums` an einer Kante aus, an der nichts steht.
    for (const id of ['datum', 'inkraft', 'stand']) {
      const z = a.zeilen.find((x) => x.id === id);
      expect(z?.wert, `Zeile «${id}» beginnt nicht mit einer Ziffer: «${z?.wert}»`).toMatch(/^\d/);
      expect(z?.ziffern, `Zeile «${id}» ohne tabular-nums`).toBe(true);
    }
  });

  it('(c) die Aufhebung schliesst die Kette ab, sie zerschneidet sie nicht', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ stand: '2025-04-01', inkraftSeit: '2011-01-01', aufgehoben: { seit: '2026-01-01' } }),
      kopf: { erlassdatum: 'vom 5. Oktober 2007' } as UebersichtsEingabe['kopf'],
    }));
    const ids = a.zeilen.map((z) => z.id).filter((id) => ['datum', 'inkraft', 'stand', 'aufgehoben'].includes(id));
    expect(ids).toEqual(['datum', 'inkraft', 'stand', 'aufgehoben']);
  });

  it('(d) ohne «vom» im Sidecar geht kein Zeichen verloren (Kantons-Schreibweisen)', () => {
    // Nicht alle Sidecars schreiben «vom …». Ein Fix, der stumpf die ersten vier
    // Zeichen abschneidet, verstümmelte diese Erlasse — darum eine Identitäts-
    // Prüfung mit Wortgrenze statt eines `slice` (§7).
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ key: 'BS-640.100', ebene: 'kanton', kanton: 'BS', stand: '2026-01-01' }),
      kopf: { erlassdatum: '12. April 2000' } as UebersichtsEingabe['kopf'],
    }));
    // Ä107: die Präpositions-Regel bleibt geprüft — der Wert geht nicht
    // verloren, er steht nur numerisch («12.04.2000» statt «April 2000»).
    expect(a.zeilen.find((z) => z.id === 'datum')?.wert).toBe('12.04.2000');
  });

  it('(e) BS-640.100 ohne Sidecar-Kopf: Ä80 erzeugt keine leere Datums-Zeile', () => {
    // Der Kantons-Erlass der Probe trägt @1440 gemessen NUR «Art» und «Stand»
    // (kein Erlassdatum, kein Inkrafttreten im Sidecar). Ä80 darf daran nichts
    // verschlechtern — insbesondere keine Zeile «Erlass vom» ohne Wert (§8).
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ key: 'BS-640.100', ebene: 'kanton', kanton: 'BS', sr: '640.100', stand: '2026-01-01' }),
      erlassTyp: 'gesetz', bestimmungsWort: 'Paragraphen', anzahl: 292,
    }));
    expect(labels(a)).toEqual(['Erlassart', 'Stand']);
    expect(a.zeilen.every((z) => z.wert.trim().length > 0)).toBe(true);
  });
});

// ─── P1-2 · Ä80 hielt nur auf Deutsch (Bug-Check 18.8.2026) ─────────────────
//
// BEFUND (Repro `p1/r4-erlassdatum-fr.cjs`, D 1440, Steckbrief aufgeklappt): am
// FR-Erlass 635.1.1 stand die Zeile
//     «Erlass vom  du 01.05.1996 (version entrée en vigueur le 01.03.2024)»
// — Ä80 hebt die Präposition nur, wenn sie «vom» heisst, und Ä74 schneidet nur
// die Klammer, die «(Stand …)» heisst. Beide Muster sind deutsch, die Sidecars
// sind es nicht. Ergebnis: Etikett und Wert sagten die Präposition doppelt, der
// Wert begann mit einem Wort statt einer Ziffer (`tabular-nums` richtet dann an
// einer Kante aus, an der nichts steht), und die Fassungs-Angabe stand ein
// zweites Mal untereinander — genau der Ä74-Befund, nur auf Französisch.
//
// GEMESSEN über alle 1420 Struktur-Sidecars des Repos (Stand 32c2865d2, kein
// Netz, `scratchpad/mess-erlassdatum.mjs`):
//   erstes Wort      «Vom» 890 · «vom» 493 · ohne Präposition 27 · «du» 10
//   Schluss-Klammer  «(Stand …)» 1409 · «(version …)» 5 · «(état …)» 5
//                    · «(Fassung in Kraft getreten am …)» 1
// Vorher trugen 10 von 1420 Erlassen einen Wert, der nicht mit einer Ziffer
// beginnt (alle FR/VS); 11 Werte ändern sich durch den Fix, nachher sind es 0.
//
// ERLASS-NEUTRALITÄT (Fundament-Auflage 2): kein `if (kanton === 'FR')` und kein
// Sprach-Zweig — es gibt genau EINE Präpositions-Liste und EINE Klammer-Liste,
// beide belegt durch die Zählung oben, und darunter ein Rückfall, der jede
// nicht gelistete Schreibweise auffängt, statt sie zu verstümmeln (§7).
//
// ROT ZU BEKOMMEN (§6.7): in `uebersichtAngaben.ts` das «du» aus `PRAEPOSITION`
// entfernen ⇒ (a)/(b) rot; `FASSUNGS_KLAMMER` auf `/(?!x)x/` setzen ⇒ (a)/(b)/(c)
// rot; das Etikett fest auf «Erlass vom» verdrahten ⇒ (d) rot.
describe('P1-2 — fremdsprachige Erlassdaten (FR/VS-Sidecars)', () => {
  const datumsZeile = (erlassdatum: string) => uebersichtsAngaben(eingabe({
    erlass: erlassBauen({ key: 'FR-635.1.1', ebene: 'kanton', kanton: 'FR', sr: '635.1.1' }),
    kopf: { erlassdatum } as UebersichtsEingabe['kopf'],
  })).zeilen.find((z) => z.id === 'datum');

  it('(a) FR-635.1.1 «du 01.05.1996 (version entrée en vigueur le 01.03.2024)»', () => {
    const z = datumsZeile('du 01.05.1996 (version entrée en vigueur le 01.03.2024)');
    expect(z?.wert).toBe('01.05.1996');
    expect(z?.label).toBe('Erlass vom');
    expect(z?.ziffern).toBe(true);
  });

  it('(b) VS-178.104 «du 26.11.2008 (état 01.01.2011)»', () => {
    const z = datumsZeile('du 26.11.2008 (état 01.01.2011)');
    expect(z?.wert).toBe('26.11.2008');
    expect(z?.label).toBe('Erlass vom');
  });

  it('(c) FR-130.11-de: deutsche Klammer, die nicht «Stand» heisst (Ä74-Rest)', () => {
    // Der Fall beweist, dass die Lücke keine Sprach-Lücke ist, sondern eine
    // Muster-Lücke: derselbe Erlass trägt auf Deutsch «(Fassung in Kraft
    // getreten am …)» und lief bis hierher ebenfalls ungeschnitten durch.
    expect(datumsZeile('vom 30.11.2010 (Fassung in Kraft getreten am 01.12.2025)')?.wert)
      .toBe('30.11.2010');
  });

  it('(d) unbekannte Schreibweise: Rückfall-Etikett statt falscher Zusage', () => {
    // Beginnt der Wert nach beiden Schnitten nicht mit einer Ziffer, ist die
    // Präposition unbekannt. Dann wird NICHTS geraten: der Wortlaut bleibt
    // Zeichen für Zeichen stehen, das Etikett fällt auf das neutrale
    // «Erlassdatum» zurück (so heisst es in V1), und `tabular-nums` entfällt.
    const z = datumsZeile('dal 12 aprile 2000');
    expect(z?.wert).toBe('dal 12 aprile 2000');
    expect(z?.label).toBe('Erlassdatum');
    expect(z?.ziffern).toBeFalsy();
  });

  it('(e) reine Klammer ohne Datum erzeugt gar keine Zeile (§8)', () => {
    // 27 Sidecars tragen ein Erlassdatum, das NUR aus der Stand-Klammer besteht
    // (z. B. APOSTILLE.json «(Stand am 4. September 2024)»). Nach dem Schnitt
    // bleibt nichts — dann entfällt die Zeile, statt leer dazustehen.
    expect(datumsZeile('(Stand am 4. September 2024)')).toBeUndefined();
  });
});

describe('uebersichtsAngaben — die Grenzen, die §8 verlangt', () => {
  it('kein Wert, keine Zeile: `stand: ""` erzeugt kein leeres «Stand» (B8)', () => {
    // Zwei VD-Erlasse tragen `stand: ""` (gezählt 17.8.2026, register.json).
    const a = uebersichtsAngaben(eingabe({ erlass: erlassBauen({ stand: '' }) }));
    expect(labels(a)).not.toContain('Stand');
    // Und keine Zeile trägt je einen leeren Wert.
    expect(a.zeilen.every((z) => z.wert.trim().length > 0)).toBe(true);
  });

  it('aufgehobener Erlass: keine Konsolidierungs-Warnung, ehrlich beschrifteter Link (B3/B5)', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ aufgehoben: { seit: '2020-01-01' } }),
      nichtKonsolidiert: true, nichtKonsolidiertSeit: '2019-01-01',
      currency: { naechsteFassungAb: '2027-01-01' } as UebersichtsEingabe['currency'],
    }));
    // Bei einem aufgehobenen Erlass IST die Aufhebung die Aussage — eine offene
    // Konsolidierung daneben wäre irreführend.
    expect(a.warnung).toBeNull();
    expect(a.vorbehalt).toBeNull();
    expect(a.zeilen.find((z) => z.id === 'aufgehoben')?.wert).toBe('01.01.2020');
    // Ä110: EIN Name, EINE Schreibung für den Fedlex-Link (Benennungs-Glossar).
    expect(a.links[0].label).toBe('Amtliche (aufgehobene) Fassung');
  });

  it('angekündigte Fassung: eigener Satz, nicht in die Warnung gemischt', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({}),
      currency: { naechsteFassungAb: '2027-01-01' } as UebersichtsEingabe['currency'],
    }));
    expect(a.vorbehalt).toBe('nächste Fassung ab 01.01.2027');
    expect(a.warnung).toBeNull();
  });

  it('ohne amtliche Quelle: gar kein Link statt eines toten (§8/F4)', () => {
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ quelleUrl: '', pdfUrl: undefined }),
    }));
    expect(a.links).toEqual([]);
  });

  it('die Fassungs-Kennung steht nirgends mehr (Ä71)', () => {
    // Datumsform = derselbe Wert wie der Stand in anderer Notation («Stand
    // 01.04.2025 · Fassung 20250401», §5); Hash-Form trifft 1231 von 1469
    // Erlassen und ist Maschinen-Provenienz. §7 Bst. d ist durch die
    // Drift-ERKENNUNG erfüllt, nicht durch das Abdrucken des Hashes.
    const a = uebersichtsAngaben(eingabe({
      erlass: erlassBauen({ fassungsToken: 'a3f9c0deadbeef' }),
    }));
    expect(a.zeilen.some((z) => z.wert.includes('a3f9c0'))).toBe(false);
    expect(labels(a)).not.toContain('Fassungs-Kennung');
  });

  it('der Grundhinweis «Massgeblich ist stets …» steht nicht mehr in der Box (Ä70)', () => {
    // Er stand an der StPO drei Zeilen unter einer Warnung, die denselben
    // Halbsatz trägt (gemessen: 2 Vorkommen). Im Erlass-Kopf steht er weiter.
    const a = uebersichtsAngaben(eingabe({ erlass: erlassBauen({}) }));
    const alles = [...a.zeilen.map((z) => z.wert), ...a.hinweise, a.warnung ?? ''].join(' ');
    expect(alles).not.toMatch(/Massgeblich ist stets/i);
  });
});

// ═══ P3-1 (Architektur-Gegenprüfung 18.8.2026) · DER §8-SATZ FOLGT DER STUFE ═
//
// BEFUND: der Erfassungs-Hinweis der Box («… der Bestand ist nicht
// vollständig») stand fest, unabhängig von `grad.stufe`. Heute erreicht kein
// Kanton die Stufe `vollstaendig` (`ENUMERATIONS_BELEGE` ist leer, K-2c) — die
// Unwahrheit ist also LATENT und wird beim ersten hinterlegten
// Enumerations-Beleg still scharf. Genau darum wird sie hier gegen einen
// STUB geprüft und nicht gegen die heutigen Daten: eine Sonde, die erst rot
// wird, wenn der Fehler schon ausgeliefert ist, bewacht nichts (§6.7).
//
// Rot gefahren 18.8.2026 mit dem Vorzustand: bei Stufe `vollstaendig` sagte der
// Satz «… sind bisher 859 Erlasse erfasst — der Bestand ist nicht vollständig.»
describe('P3-1 · Erfassungs-Hinweis: je Stufe die Aussage, die die Daten decken', () => {
  it('unvollständige Sammlung (Auswahl/dünn): der Vorbehalt steht da', () => {
    for (const stufe of ['auswahl', 'duenn'] as const) {
      const satz = erfassungsgradSatz({ kanton: 'BS', n: 859, stufe });
      expect(satz).toContain('bisher');
      expect(satz).toContain('nicht vollständig');
    }
  });

  it('belegt vollständige Sammlung: KEIN Vorbehalt, und das Total ist belegt', () => {
    const satz = erfassungsgradSatz({
      kanton: 'BS', n: 859, stufe: 'vollstaendig',
      belegtN: 859, belegStand: '2026-08-18', belegQuelle: 'https://www.gesetzessammlung.bs.ch/',
    });
    expect(satz, 'die Box behauptet eine Lücke, die der Enumerations-Beleg verneint (§8)')
      .not.toContain('nicht vollständig');
    expect(satz).toContain('859');
    // Kein Hausjargon — «vollständig»/«Auswahl»/«dünn» sind interne Stufenworte
    // und bleiben der Kantonsliste (Ä122/§5).
    expect(satz).not.toMatch(/\bAuswahl\b|\bdünn\b/);
  });
});

// ═══ P3-4 (Architektur-Gegenprüfung 18.8.2026) · DIE DREI UNGEDECKTEN ═══════
//     ZWEIGE VON `datumsForm`
//
// Die Gegenprüfung hat an `v3/datumsForm.ts` keine Fehlfunktion gefunden,
// sondern eine LÜCKE IN DER DECKUNG: die drei Zweige, die den amtlichen
// Wortlaut vor einer Umschreibung schützen, waren von keiner Sonde berührt —
// der Rückfall auf «Erlassdatum», die französische Monatstabelle und die
// Plausibilitätsschranke. Genau diese drei entscheiden, ob ein Datum
// UMGESCHRIEBEN oder unangetastet gelassen wird; ein stiller Fehler dort
// erzeugt eine falsche amtliche Angabe (§1/§7), keinen Schönheitsfehler.
//
// Diese Sonden sind ab dem ersten Lauf grün — sie beweisen keinen Fix, sie
// halten Verhalten fest, das heute nur der Code behauptet. Rot zu bekommen
// (§6.7, je einzeln nachgefahren 18.8.2026): in `datumsAngabe` den Rückfall
// entfernen und immer «Erlass vom» setzen ⇒ (a); in `MONATE` die
// französischen Einträge streichen ⇒ (b); in `baueDatum` die Schranke
// `tag > 31` entfernen ⇒ (c).
describe('P3-4 · datumsForm: wann ein Datum NICHT umgeschrieben wird', () => {
  const datumsZeile = (erlassdatum: string) => uebersichtsAngaben(eingabe({
    erlass: erlassBauen({}), kopf: { erlassdatum } as UebersichtsEingabe['kopf'],
  })).zeilen.find((z) => z.id === 'datum');

  it('(a) Rückfall: unlesbarer Wortlaut behält Etikett «Erlassdatum» und bleibt roh', () => {
    const z = datumsZeile('vom Anfang des Jahres 1907');
    expect(z?.label).toBe('Erlassdatum');
    expect(z?.wert).toBe('Anfang des Jahres 1907');
    // Kein `tabular-nums` an einem Wort — die Zahlen-Kante hätte nichts,
    // woran sie ausrichten könnte (Ä80 in umgekehrter Richtung).
    expect(z?.ziffern).toBeFalsy();
  });

  it('(b) französische Monatsnamen werden numerisch, fremde nie geraten', () => {
    expect(datumsZeile('du 5. octobre 2007')).toMatchObject({
      label: 'Erlass vom', wert: '05.10.2007', ziffern: true,
    });
    expect(datumsZeile('du 5. décembre 1996')?.wert).toBe('05.12.1996');
    // Ein Monatsname AUSSERHALB der Tabelle wird nie geraten (§7).
    expect(datumsZeile('du 5. Wintermonat 1907')?.label).toBe('Erlassdatum');
  });

  it('(c) unplausible Tages-/Monatszahl: lieber der amtliche Wortlaut als ein gebogenes Datum', () => {
    for (const roh of ['vom 32. Oktober 2007', 'vom 32.10.2007', 'vom 5.13.2007', 'vom 0. Oktober 2007']) {
      const z = datumsZeile(roh);
      expect(z?.label, `«${roh}» wurde umgeschrieben`).toBe('Erlassdatum');
      expect(z?.ziffern).toBeFalsy();
    }
  });
});

// ── BG-04-Nachzug (Gegenprüfung PR #1282, §8) ────────────────────────────────
// Fällt das Struktur-Sidecar AUS (Netz/5xx), steht der Satz «keine amtliche
// Gliederung erfasst» neben der Ausfallzeile des Titelblatts — und ist dann
// falsch: es gibt eine, sie wurde nur nicht geladen.
// ROT ZU BEKOMMEN: in uebersichtAngaben.ts `&& !e.strukturAusgefallen` entfernen.
describe('Übersicht — Struktur-Ausfall ≠ «keine amtliche Gliederung erfasst»', () => {
  const ohneSidecar = { artikelAnzahl: 10, anhangArtikel: 0, hatSidecar: false } as unknown as UebersichtsEingabe['kennzahlen'];
  const satz = (a: ReturnType<typeof uebersichtsAngaben>) => a.hinweise.some((h) => h.includes('keine amtliche Gliederung erfasst'));

  it('echtes «kein Sidecar» (404): der Satz steht', () => {
    expect(satz(uebersichtsAngaben(eingabe({ erlass: erlassBauen({}), kennzahlen: ohneSidecar })))).toBe(true);
  });
  it('Ausfall des Sidecars: der Satz entfällt (die Ausfallzeile trägt die Auskunft)', () => {
    expect(satz(uebersichtsAngaben(eingabe({ erlass: erlassBauen({}), kennzahlen: ohneSidecar, strukturAusgefallen: true })))).toBe(false);
  });
});
