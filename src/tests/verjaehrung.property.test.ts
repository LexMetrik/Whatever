// ─── Property-Tests: verjaehrung (Art. 60/67/127–142 OR) — QS-CODE-PROP ──────
//
// Invarianten-Katalog: bibliothek/register/property-invarianten-2026-08-15.md
// KEINE Engine-Änderung; eine real rote Property ist ein BEFUND (§1).
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { parseISO, addDays, addYears, isAfter } from 'date-fns';
import {
  berechneVerjaehrung, REGIME, werktagsEnde,
  type VerjaehrungRegime, type VerjaehrungInput,
} from '../lib/verjaehrung';
import { formatISO } from '../lib/datumsUtils';
import { istArbeitsfreierTag } from '../data/zpoFeiertage';
import { PROPERTY_SEED, isoDatumArb, kantonArb } from './propertyArb';

fc.configureGlobal({ seed: PROPERTY_SEED, numRuns: 500 });

const regimeArb = fc.constantFrom(...(Object.keys(REGIME) as VerjaehrungRegime[]));

/** Gültige Domäne: Zwei-Fristen-Regimes bekommen IMMER einen absoluten Beginn
 *  (ohne ihn ist die Eingabe per Engine-Vertrag unzulässig — das prüft VJ-6). */
const eingabeArb: fc.Arbitrary<VerjaehrungInput> = fc.record({
  regime: regimeArb,
  beginnRelativ: isoDatumArb(2020, 2030),
  absolutVersatz: fc.integer({ min: -2000, max: 2000 }),
  stichtag: isoDatumArb(2020, 2045),
  kanton: kantonArb,
}).map(({ absolutVersatz, ...rest }) => ({
  ...rest,
  beginnAbsolut: REGIME[rest.regime].absolutJahre != null
    ? formatISO(addDays(parseISO(rest.beginnRelativ), absolutVersatz))
    : undefined,
}));

// ─── VJ-1 · Determinismus (§2) ───────────────────────────────────────────────
describe('verjaehrung — Determinismus (§2)', () => {
  it('gleiche Eingabe liefert byte-gleiches Ergebnis (inkl. Rechenweg)', () => {
    fc.assert(fc.property(eingabeArb, (e) => {
      expect(berechneVerjaehrung(e)).toEqual(berechneVerjaehrung(e));
    }));
  });
});

// ─── VJ-2 · Ordnung: Verjährung tritt nie vor Fristbeginn ein ───────────────
// Art. 132 Abs. 1 OR: der Beginntag zählt nicht mit; das Ende liegt echt nach
// dem dies a quo. Zusätzlich Art. 78 i.V.m. Art. 132 Abs. 2 OR: der letzte Tag
// ist stets ein Werktag am Erfüllungsort.
describe('verjaehrung — Ende nie vor Beginn, letzter Tag ist Werktag', () => {
  it('verjaehrungISO > beginnRelativ und liegt auf einem Werktag', () => {
    fc.assert(fc.property(eingabeArb, (e) => {
      const r = berechneVerjaehrung(e);
      if (r.status !== 'ok' || !r.verjaehrungISO) return;
      expect(+parseISO(r.verjaehrungISO) > +parseISO(e.beginnRelativ),
        `Verjährung ${r.verjaehrungISO} liegt nicht nach dem Beginn ${e.beginnRelativ}`).toBe(true);
      expect(istArbeitsfreierTag(parseISO(r.verjaehrungISO), e.kanton),
        `letzter Tag ${r.verjaehrungISO} ist arbeitsfrei in ${e.kanton} (Art. 78 OR)`).toBe(false);
      expect(werktagsEnde(parseISO(r.verjaehrungISO), e.kanton).getTime(),
        'werktagsEnde ist nicht idempotent auf dem ausgewiesenen Datum').toBe(parseISO(r.verjaehrungISO).getTime());
    }));
  });
});

// ─── VJ-3 · Das Verdikt am Stichtag ist mit dem Datum konsistent (§8) ───────
// Art. 142 OR: verjährt ist die Forderung genau dann, wenn der Stichtag NACH
// dem ausgewiesenen letzten Tag liegt. Ein Verdikt, das dem publizierten
// Datum widerspricht, wäre für die Nutzerin unauflösbar.
describe('verjaehrung — Verdikt und ausgewiesenes Datum widersprechen sich nie', () => {
  it('verjaehrtAmStichtag ⟺ stichtag > verjaehrungISO', () => {
    fc.assert(fc.property(eingabeArb, (e) => {
      const r = berechneVerjaehrung(e);
      if (r.status !== 'ok') return;
      if (!r.verjaehrungISO) {
        expect(r.verjaehrtAmStichtag, 'ohne Fristende dennoch «verjährt»').toBeFalsy();
        return;
      }
      expect(!!r.verjaehrtAmStichtag, `Verdikt widerspricht dem Datum (Stichtag ${e.stichtag}, Ende ${r.verjaehrungISO})`)
        .toBe(isAfter(parseISO(e.stichtag), parseISO(r.verjaehrungISO)));
    }));
  });
});

// ─── VJ-4 · Stillstand hängt an, verkürzt nie (Art. 134 OR) ────────────────
// «Gehemmte Tage werden hinten angehängt» — ein Stillstand kann das Ende nur
// nach hinten schieben. Ungültige/invertierte Perioden werden verworfen und
// dürfen die Frist ebenfalls nicht verkürzen.
describe('verjaehrung — Stillstand (Art. 134 OR) verlängert nur', () => {
  it('mit Stillstandsfenster endet die Frist nie vor der ungehemmten Frist', () => {
    fc.assert(fc.property(eingabeArb, fc.integer({ min: 0, max: 3000 }), fc.integer({ min: 0, max: 400 }),
      (e, versatz, dauer) => {
        const ohne = berechneVerjaehrung(e);
        if (ohne.status !== 'ok' || !ohne.verjaehrungISO) return;
        const von = addDays(parseISO(e.beginnRelativ), versatz);
        const mit = berechneVerjaehrung({ ...e, stillstaende: [{ von: formatISO(von), bis: formatISO(addDays(von, dauer)) }] });
        if (!mit.verjaehrungISO) return;
        expect(+parseISO(mit.verjaehrungISO) >= +parseISO(ohne.verjaehrungISO),
          `Stillstand verkürzte die Frist: ${mit.verjaehrungISO} < ${ohne.verjaehrungISO}`).toBe(true);
        expect((mit.gehemmtTage ?? 0) >= 0, `negative Hemmungstage: ${mit.gehemmtTage}`).toBe(true);
      }));
  });
});

// ─── VJ-5 · Zwei-Fristen-Logik: relativ nie über absolut hinaus ────────────
// Ohne Unterbrechung ist das massgebliche Ende das FRÜHERE der beiden Fristen
// (Art. 60/67 OR); «die relative Frist kann nie über die absolute hinauslaufen».
// Die Ausnahmen (Art. 137 Abs. 2 / 138 Abs. 1 OR) setzen eine Unterbrechung
// voraus und sind hier per Konstruktion ausgeschlossen.
describe('verjaehrung — ohne Unterbrechung gilt das frühere der beiden Enden', () => {
  it('verjaehrungISO = min(relativEndeISO, absolutEndeISO) und massgeblicheFrist stimmt', () => {
    fc.assert(fc.property(eingabeArb, (e) => {
      const r = berechneVerjaehrung(e);
      if (r.status !== 'ok' || !r.verjaehrungISO || !r.relativEndeISO) return;
      if (!r.absolutEndeISO) {
        expect(r.massgeblicheFrist, 'Ein-Fristen-Regime als «absolut» ausgewiesen').toBe('relativ');
        return;
      }
      const frueher = r.relativEndeISO <= r.absolutEndeISO ? r.relativEndeISO : r.absolutEndeISO;
      expect(r.verjaehrungISO, `massgebliches Ende ${r.verjaehrungISO} ist nicht das frühere von ${r.relativEndeISO} / ${r.absolutEndeISO}`).toBe(frueher);
      // Die benannte Frist muss auf DAS ausgewiesene Datum zeigen (§8):
      // «absolut» ohne absolutes Enddatum wäre eine irreführende Zuordnung.
      expect(r.massgeblicheFrist === 'absolut' ? r.absolutEndeISO : r.relativEndeISO,
        `benannte Frist «${r.massgeblicheFrist}» zeigt nicht auf das ausgewiesene Ende ${r.verjaehrungISO}`).toBe(r.verjaehrungISO);
    }));
  });
});

// ─── VJ-6 · Regime-Trennung (§4): kein stilles Rechnen ohne absolute Frist ──
// Regimes mit absoluter Frist (Art. 60 / 60 Abs. 1bis / 128a / 67 OR) DÜRFEN
// nicht rechnen, wenn deren Beginn fehlt — sie geben «unzulaessig» zurück.
// Regimes ohne absolute Frist (Art. 127/128 OR) rechnen ohne diese Angabe.
// Ein Kollaps beider Klassen wäre ein stillschweigend falsches Ergebnis.
describe('verjaehrung — Ein- und Zwei-Fristen-Regimes kollabieren nicht (§4)', () => {
  it('fehlender absoluter Beginn ⇒ unzulaessig genau bei den Zwei-Fristen-Regimes', () => {
    fc.assert(fc.property(regimeArb, isoDatumArb(2020, 2030), isoDatumArb(2020, 2045), kantonArb,
      (regime, beginnRelativ, stichtag, kanton) => {
        const r = berechneVerjaehrung({ regime, beginnRelativ, stichtag, kanton });
        const hatAbsolute = REGIME[regime].absolutJahre != null;
        expect(r.status === 'unzulaessig', `${regime}: Status ${r.status} passt nicht zur Regime-Klasse`).toBe(hatAbsolute);
        if (!hatAbsolute) {
          expect(r.absolutEndeISO, `${regime}: absolutes Ende trotz Ein-Fristen-Regime`).toBeUndefined();
          expect(r.verjaehrungISO, `${regime}: kein Fristende berechnet`).toBeDefined();
        }
      }));
  });
});

// ─── VJ-7 · Einredeverzicht (Art. 141 OR): Deckel 10 Jahre, nie rückwärts ───
// Fachänderung RL-14 (W-05 §5 Nr. 12, 24.9.2026): Art. 141 Abs. 1 OR —
// «jeweils für höchstens zehn Jahre»; ab wann, lässt das Gesetz bewusst offen
// (BBl 2014 235 S. 262). Bisher Deckel «nach Verjährungseintritt» als
// Gesetzesregel; nach W-06 a läuft die Dauer ab der Erklärung (offengelegte
// Lesart). Grenze nach Art. 77 Abs. 1 Ziff. 3 OR (date-fns addYears: fehlt
// der zahlengleiche Tag, letzter Tag des Monats).
describe('verjaehrung — Einredeverzicht wirkt nur vorwärts und höchstens 10 Jahre', () => {
  it('verzichtBisISO liegt nach der Erklärung und höchstens 10 Jahre danach', () => {
    fc.assert(fc.property(eingabeArb, fc.integer({ min: 0, max: 3000 }), fc.integer({ min: 1, max: 40 }),
      (e, versatz, jahre) => {
        const datum = formatISO(addDays(parseISO(e.beginnRelativ), versatz));
        const r = berechneVerjaehrung({ ...e, verzicht: { datum, jahre } });
        if (r.status !== 'ok' || !r.verzichtBisISO) return;
        const erklaerung = parseISO(datum);
        const bis = parseISO(r.verzichtBisISO);
        expect(+bis > +erklaerung, `Verzicht bis ${r.verzichtBisISO} liegt nicht nach der Erklärung ${datum}`).toBe(true);
        const maxBis = addYears(erklaerung, 10);
        expect(+bis <= +maxBis, `Verzicht bis ${r.verzichtBisISO} überschreitet die Höchstdauer von 10 Jahren (Art. 141 Abs. 1 OR)`).toBe(true);
      }));
  });
});
