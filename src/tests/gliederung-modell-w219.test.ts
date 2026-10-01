/**
 * W2·19-GLIEDERUNG · S3 — Unit-Tests des Gliederungs-Modells.
 *
 * Bau-Spec: fahrplaene/FAHRPLAN-W2-19-SEITENLEISTE.md §3 (Modus-Kette,
 * Sonderknoten, Verdichtung), §8 (Erlass-Typen-Matrix T1–T11), §9-S3.
 *
 * WAS HIER GEPRÜFT WIRD und warum gegen die ECHTEN Daten: Das Modell entscheidet,
 * ob ein Jurist die Gliederung eines Erlasses überhaupt zu sehen bekommt. Ein
 * Test gegen erfundene Bäume prüft nur die eigene Fantasie — die Modus-Kette
 * lebt von Verhältnissen (Randtitel-Dichte, amtliche Knoten, Zeilenzahl), die
 * ausschliesslich der committete Korpus kennt. Darum lädt jeder Fall den echten
 * Snapshot und das echte Sidecar (Muster: gesetz-leser-toc-kuration.test.ts).
 *
 * Die neun Referenz-Erlasse decken die Typen-Matrix ab:
 *   OR (T1) · AIG (T2) · VwVG (T3) · NHG (T4) · RBUE (T9) · BS-211.100 (T8) ·
 *   BS-730.110 (T7) · SG-2935 (T6/T10, seit 2.9.2026 anstelle von ZH-243) ·
 *   SG-3849 (T6/T10) · ZH-243 (T6, seit R1 mit Sidecar)
 * Ergänzt um ZGB (T1, Verdichtung feuert), VMWG (T4 ohne Sektionen) und
 * AR-145.312 (T5 Mini) — die drei belegen Kanten, die sonst ungeprüft blieben.
 */
import { describe, it, expect } from 'vitest';
import { baueGliederungsbaum, type StrukturMap, type Sektion } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import type { NormSnapshot } from '../lib/normtext/typen';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import {
  baueGliederungsModell, flacheZeilen, hatRandtitel, istAnhangEintrag, waehleModus,
  ID_ANHANG, ID_VORSPANN,
  MINI_MAX_ARTIKEL, OFFEN_MAX_ZEILEN, INDEX_MAX_AMTLICHE_KNOTEN, INDEX_MIN_DICHTE,
  type GliederungsModell, type GliederungsKnoten,
} from '../pages/gesetz-leser/gliederungsModell';

function lade(ebene: 'bund' | 'kanton', key: string, go = false): GliederungsModell & {
  eintraege: NormSnapshot[]; struktur: StrukturMap | null; sektionen: Sektion[];
} {
  const { eintraege, struktur } = ladeNormFixture(ebene, key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  // Der Reader füttert das Modell mit dem KURATIERTEN Baum (A36) — hier genauso,
  // sonst prüften die Zeilenzahlen einen Baum, den niemand rendert.
  const sektionen = kuratiereTocSektionen(roh.sektionen);
  const modell = baueGliederungsModell({
    sektionen, ohneGliederung: roh.ohneGliederung, eintraege, struktur, startSichtbarGo: go,
  });
  return { ...modell, eintraege, struktur, sektionen };
}

const zaehleRoh = (s: Sektion[], f: (x: Sektion) => boolean): number =>
  s.reduce((n, x) => n + (f(x) ? 1 : 0) + zaehleRoh(x.kinder, f), 0);

// ═══ 1 · Modus-Kette gegen die neun Referenz-Erlasse (§3.2 / §8) ═════════════
describe('S3 — Modus-Kette an den Referenz-Erlassen', () => {
  it('T1 OR: grosse Kodifikation → B1 kompakt (2181 Zeilen, 171 amtliche Knoten)', () => {
    const m = lade('bund', 'OR');
    expect(m.modus).toBe('b1-kompakt');
    expect(m.kennzahlen.zeilenVoll).toBeGreaterThan(OFFEN_MAX_ZEILEN);
    expect(m.kennzahlen.amtlicheKnoten).toBe(171);
    // Zahl ABGELEITET statt Literal (W2·27-BUND-FERTIG, 1.10.2026): Fedlex hat OR Art. 697l/697m zu EINEM
    // Artikel-Element zusammengefasst (20260101: 1686, 20261001: 1685) — ein Literal reisst bei jeder OR-Revision.
    expect(m.kennzahlen.artikelAnzahl).toBe(m.eintraege.length);
    // Die Spec verankert «OR/ZGB 134–171 amtliche Knoten» — hier belegt.
    expect(m.startOffeneTiefe).toBe(0);
  });

  it('T1 ZGB: B1 kompakt — 134 amtliche Knoten roh, 127 nach der A36-Kuration', () => {
    // §7-Präzisierung zur Spec: deren Anker «ZGB 134 Knoten» gilt für den ROHEN
    // Baum. Der Reader zeigt den kuratierten (A36 nimmt den Schlusstitel-Anhang
    // «Wortlaut der früheren Bestimmungen …» mit seinen 7 amtlichen Knoten aus
    // der Gliederung). Das Modell muss die Zahl des GEZEIGTEN Baums führen,
    // sonst zählte die Leiste Knoten mit, die niemand sieht (§8).
    const { eintraege, struktur } = ladeNormFixture('bund', 'ZGB');
    const roh = baueGliederungsbaum(eintraege, struktur);
    expect(zaehleRoh(roh.sektionen, (s) => s.randtitel !== true)).toBe(134);

    const m = lade('bund', 'ZGB');
    expect(m.modus).toBe('b1-kompakt');
    expect(m.kennzahlen.amtlicheKnoten).toBe(127);
  });

  it('T2 AIG: 52 Zeilen bei nur zwei Ebenen → B1 kompakt (Entscheid an der ZEILENZAHL)', () => {
    const m = lade('bund', 'AIG');
    // Der Spec-Anker: «AIG (Tiefe 2, 52 Zeilen) fällt korrekt in B1 kompakt».
    expect(m.kennzahlen.zeilenVoll).toBe(52);
    expect(m.modus).toBe('b1-kompakt');
    // Wäre die Kette an der TIEFE entschieden worden, läge AIG bei «offen» —
    // genau diese Verwechslung schliesst der Test aus.
    const maxTiefe = Math.max(...flacheZeilen(m.knoten).map((k) => k.tiefe));
    expect(maxTiefe).toBeLessThanOrEqual(2);
  });

  it('T3 VwVG: 5 amtliche Knoten bei 93 Artikeln, 100 % Randtitel → B2 Artikel-Index', () => {
    const m = lade('bund', 'VWVG');
    expect(m.kennzahlen.amtlicheKnoten).toBe(5);
    expect(m.kennzahlen.amtlicheKnoten).toBeLessThan(INDEX_MAX_AMTLICHE_KNOTEN);
    expect(m.kennzahlen.marginalienDichte).toBe(1);
    expect(m.modus).toBe('b2-index');
    // Behebt Davids A8-Rüge: der Index startet sichtbar, nicht zugeklappt.
    expect(m.startOffeneTiefe).toBe(Number.POSITIVE_INFINITY);
  });

  it('T4 NHG: keine amtlichen Knoten, 70/70 Randtitel → B2', () => {
    const m = lade('bund', 'NHG');
    expect(m.kennzahlen.amtlicheKnoten).toBe(0);
    expect(m.kennzahlen.marginalienDichte).toBe(1);
    expect(m.modus).toBe('b2-index');
  });

  it('T4 VMWG: Sidecar vorhanden, aber gar keine Sektionen → B2 (nicht B3)', () => {
    const m = lade('bund', 'VMWG');
    expect(m.sektionen.length).toBe(0);
    expect(m.kennzahlen.hatSidecar).toBe(true);
    expect(m.kennzahlen.marginalienDichte).toBe(1);
    // B3 verlangt zusätzlich eine Dichte < 20 % — VMWG trägt 100 % Randtitel,
    // also ist ein Artikel-Index tragfähig und die Leere wäre eine Falschaussage.
    expect(m.modus).toBe('b2-index');
  });

  it('T5 AR-145.312: 1 Artikel → B4 Mini, Leiste startet zu', () => {
    const m = lade('kanton', 'AR-145.312');
    expect(m.kennzahlen.artikelAnzahl).toBeLessThanOrEqual(MINI_MAX_ARTIKEL);
    expect(m.modus).toBe('b4-mini');
    expect(m.leisteStartetZu).toBe(true);
  });

  it('T9 RBUE: 47 von 49 Artikeln ohne Abschnitt → B1 offen mit Vorspann-Knoten', () => {
    const m = lade('bund', 'RBUE');
    expect(m.modus).toBe('b1-offen');
    // Der einzige Sidecar-Knoten des RBUE ist ein reiner ANHANG-Knoten (er trägt
    // annex_u1 + scope_u1). Der Stamm ist also leer — und trotzdem muss der
    // Vorspann-Knoten stehen, sonst wären 47 von 49 Artikeln (96 % des Texts)
    // über die Leiste unerreichbar. Genau das ist der T9-Fall.
    expect(m.kennzahlen.vorspannArtikel).toBe(47);
    const vor = m.knoten[0];
    expect(vor.id).toBe(ID_VORSPANN);
    expect(vor.art).toBe('vorspann');
    expect(vor.artikelAnzahl).toBe(47);
    expect(vor.bereich).toBe('Art. 1–38');
    // Die zwei Anhang-Einträge landen NICHT im Vorspann, sondern in ihrem
    // eigenen Ast — sonst zählte «Art. 1–38» den Anhang stillschweigend mit.
    expect(m.knoten.at(-1)?.id).toBe(ID_ANHANG);
    expect(m.knoten.at(-1)?.artikelAnzahl).toBe(2);
    expect(m.knoten.length).toBe(2);
  });

  it('T8 BS-211.100: gemischte Knoten (Ordner UND Sprungziel) → B1 kompakt', () => {
    const m = lade('kanton', 'BS-211.100');
    expect(m.modus).toBe('b1-kompakt');
    const gemischt = flacheZeilen(m.knoten).filter((k) => k.gemischt);
    expect(gemischt.length).toBeGreaterThan(0);
    // T8-Invariante: die direkt am Knoten hängenden Artikel zählen in seinen
    // Zählwert. Bräche das, verschwänden sie beim Zuklappen stumm.
    // W2·18-FEHLERBUCH (Artikel-Ebene, David 13.8.2026): seit die direkten
    // Artikel eigene Kind-Zeilen tragen, stecken sie in `kinderSumme` — ein
    // zweites Addieren von `eigeneArtikel` zählte sie doppelt. Geprüft wird
    // unverändert dasselbe: kein Artikel geht stumm verloren.
    for (const k of gemischt) {
      expect(k.artikelAnzahl).toBeGreaterThanOrEqual(k.eigeneArtikel);
      const kinderSumme = k.kinder.reduce((n, kk) => n + kk.artikelAnzahl, 0);
      const eigenOhneZeile = k.kinder.some((kk) => kk.art === 'artikel') ? 0 : k.eigeneArtikel;
      expect(k.artikelAnzahl).toBe(eigenOhneZeile + kinderSumme);
    }
  });

  it('T7 BS-730.110: kantonale Feingliederung, 151 Knoten → B1 kompakt', () => {
    const m = lade('kanton', 'BS-730.110');
    expect(m.kennzahlen.knotenGesamt).toBe(151);
    expect(m.kennzahlen.artikelAnzahl).toBe(129);
    expect(m.modus).toBe('b1-kompakt');
  });

  // W2·18-FEHLERBUCH (Auftrag David 13.8.2026): die beiden T10-Referenzen
  // standen bis hierher auf B3 «keine Gliederung erfasst» — eine leere Leiste
  // für 150 bzw. 607 Artikel. Ohne Sidecar gibt es keinen BAUM, aber sehr wohl
  // eine Artikel-FOLGE; sie steht im Snapshot. Die Erwartung wechselt darum
  // deklariert auf B2 (flacher Index). Was unverändert bleibt: es wird keine
  // Gliederung konstruiert, die es nicht gibt (`amtlicheKnoten` 0), und der
  // §8-Hinweis auf das fehlende Sidecar (`hatSidecar`) trägt weiter.
  // FIXTURE-WECHSEL, deklariert (§6.3, 2.9.2026): der T10-Fall stand auf
  // ZH-243. Der Erlass ist kein T10 mehr — seit den ZH-Gliederungs-/
  // Randtitel-Sidecars (R1) trägt er eines. Die Messung von damals bleibt
  // richtig und wird nicht nachgeführt (§0-2b); T10 misst hier ab sofort
  // SG-2935 (gemessen 2.9.2026: kein Sidecar, 112 Artikel, 78 % Anhang) neben
  // dem unveränderten SG-3849. ZH-243 selbst behält direkt darunter einen
  // eigenen Fall — mit der neuen, ehrlich benannten Erwartung.
  it('T10 SG-2935: kein Sidecar → B2 Index statt leerer Leiste, kein konstruierter Baum', () => {
    const m = lade('kanton', 'SG-2935');
    expect(m.kennzahlen.hatSidecar).toBe(false);
    expect(m.modus).toBe('b2-index');
    expect(m.kennzahlen.amtlicheKnoten).toBe(0);
    // Der Anhang-Anteil bleibt trotzdem messbar (SG-2935 87/112 = 78 %).
    expect(Math.round(m.kennzahlen.anhangAnteil * 100)).toBe(78);
  });

  it('T6 ZH-243: Sidecar seit R1 — Modus, Anhang-Anteil und «kein Baum» unverändert', () => {
    // Der Wächter zur ZH-Randtitel-Slice: ein neu hinzugekommenes Sidecar darf
    // die Modus-Kette NICHT verschieben (kein Sprung nach B1/B3), es liefert nur
    // Randtitel in die Index-Zeilen. `amtlicheKnoten` bleibt 0, weil das
    // ZH-Sidecar für diesen Erlass keine amtliche Gliederung trägt — es wird
    // also weiterhin kein Baum konstruiert, den es nicht gibt (§8).
    const m = lade('kanton', 'ZH-243');
    expect(m.kennzahlen.hatSidecar).toBe(true);
    expect(m.modus).toBe('b2-index');
    expect(m.kennzahlen.amtlicheKnoten).toBe(0);
    expect(Math.round(m.kennzahlen.anhangAnteil * 100)).toBe(88);
  });

  it('T10 SG-3849: kein Sidecar, 97 % Anhang → B2 Index', () => {
    const m = lade('kanton', 'SG-3849');
    expect(m.kennzahlen.hatSidecar).toBe(false);
    expect(m.modus).toBe('b2-index');
    expect(m.kennzahlen.amtlicheKnoten).toBe(0);
    expect(Math.round(m.kennzahlen.anhangAnteil * 100)).toBe(97);
  });
});

// ═══ 2 · Die Kette selbst (reine Funktion, ohne Korpus) ══════════════════════
describe('S3 — waehleModus: die Reihenfolge ist die Regel', () => {
  const basis = {
    artikelAnzahl: 100, hatSidecar: true, zeilenVoll: 10, zeilenGesamt: 10,
    amtlicheKnoten: 10, knotenGesamt: 10, marginalienDichte: 0.5, artikelBlattDeckung: 0, anhangAnteil: 0,
    vorspannArtikel: 0, nachspannArtikel: 0, anhangArtikel: 0,
  };

  it('B4 Mini gilt auch ohne Sidecar — darüber übernimmt der Index', () => {
    expect(waehleModus({ ...basis, artikelAnzahl: 9, hatSidecar: false }, false)).toBe('b4-mini');
    // W2·18 (David 13.8.2026): früher b3-leer. Ohne Sidecar fehlt der BAUM,
    // nicht die Artikel-Folge — 10 Artikel sind 10 Index-Zeilen.
    expect(waehleModus({ ...basis, artikelAnzahl: 10, hatSidecar: false }, false)).toBe('b2-index');
  });

  it('B3 trifft nur noch den Erlass ohne jeden Artikel — und steht darum zuerst', () => {
    expect(waehleModus({ ...basis, artikelAnzahl: 0 }, false)).toBe('b3-leer');
    expect(waehleModus({ ...basis, artikelAnzahl: 0, hatSidecar: false }, true)).toBe('b3-leer');
    // Ein Artikel genügt, damit die Leiste etwas anzubieten hat.
    expect(waehleModus({ ...basis, artikelAnzahl: 1 }, false)).toBe('b4-mini');
  });

  it('ohne Sektionen entscheidet die Randtitel-Dichte NICHT mehr über den Zugang', () => {
    // Die frühere LEER_MAX_DICHTE-Schwelle sperrte genau die Erlasse aus, die
    // den Index am nötigsten haben: die ohne Randtitel (Dichte 0).
    for (const dichte of [0, 0.19, 0.2, 1]) {
      expect(waehleModus({ ...basis, marginalienDichte: dichte }, false)).toBe('b2-index');
    }
  });

  it('B2 braucht ALLE drei Bedingungen, sobald Sektionen existieren', () => {
    const knapp = { ...basis, amtlicheKnoten: 5, artikelAnzahl: 30, marginalienDichte: INDEX_MIN_DICHTE };
    expect(waehleModus(knapp, true)).toBe('b2-index');
    expect(waehleModus({ ...knapp, amtlicheKnoten: 6 }, true)).toBe('b1-offen');
    expect(waehleModus({ ...knapp, artikelAnzahl: 29 }, true)).toBe('b1-offen');
    expect(waehleModus({ ...knapp, marginalienDichte: 0.59 }, true)).toBe('b1-offen');
  });

  it('B1 entscheidet an der Zeilenzahl, exakt an der 40er-Kante', () => {
    expect(waehleModus({ ...basis, zeilenVoll: OFFEN_MAX_ZEILEN }, true)).toBe('b1-offen');
    expect(waehleModus({ ...basis, zeilenVoll: OFFEN_MAX_ZEILEN + 1 }, true)).toBe('b1-kompakt');
  });
});

// ═══ 3 · Der 5.8.-Schalter (§11 Frage 1) ═════════════════════════════════════
describe('S3 — Start-Sichtbarkeit moduliert Davids 5.8.-Entscheid nur mit Go', () => {
  it('ohne Go verhält sich B1 offen wie B1 kompakt — der Modus bleibt trotzdem b1-offen', () => {
    const ohne = lade('bund', 'RBUE', false);
    expect(ohne.modus).toBe('b1-offen');
    expect(ohne.startOffeneTiefe).toBe(0);
  });

  it('mit Go startet B1 offen sichtbar', () => {
    const mit = lade('bund', 'RBUE', true);
    expect(mit.modus).toBe('b1-offen');
    expect(mit.startOffeneTiefe).toBe(Number.POSITIVE_INFINITY);
  });

  it('der Schalter rührt B1 kompakt nicht an (OR bleibt zu)', () => {
    expect(lade('bund', 'OR', true).startOffeneTiefe).toBe(0);
  });
});

// ═══ 4 · Knoten-Identität und Verdichtung (§3.1 / §3.3) ══════════════════════
describe('S3 — sek-N bleibt der einzige Schlüssel', () => {
  it('OR: jede Zeile trägt nur Ids, die es im Rohbaum gibt; keine Id doppelt', () => {
    const m = lade('bund', 'OR');
    const rohIds = new Set<string>();
    const sammle = (s: Sektion[]): void => s.forEach((x) => { rohIds.add(x.id); sammle(x.kinder); });
    sammle(m.sektionen);
    const gesehen = new Set<string>();
    for (const z of flacheZeilen(m.knoten)) {
      if (z.art !== 'sektion') continue;
      expect(z.ids.length).toBeGreaterThan(0);
      expect(z.id).toBe(z.ids[0]);
      for (const id of z.ids) {
        expect(rohIds.has(id)).toBe(true);
        expect(gesehen.has(id)).toBe(false);
        gesehen.add(id);
      }
    }
    // Kein Rohknoten geht verloren: verdichtete Stufen leben in `ids` weiter.
    expect(gesehen.size).toBe(rohIds.size);
  });

  it('ZGB: die Einzelkind-Verdichtung feuert und fasst genau die leeren Durchgangsstufen', () => {
    const m = lade('bund', 'ZGB');
    const verdichtet = flacheZeilen(m.knoten).filter((k) => k.ids.length > 1);
    expect(verdichtet.length).toBeGreaterThan(0);
    for (const z of verdichtet) {
      expect(z.labelKette.length).toBe(z.ids.length);
      expect(z.label).toBe(z.labelKette.join(' › '));
    }
  });

  it('BS-730.110: belegter NULLFALL der Verdichtung (§7-Korrektur zur Spec)', () => {
    // Die Spec führt BS-730.110 als Referenz der Einzelkind-Verdichtung. Am
    // committeten Snapshot gemessen hat der Erlass KEINE einzige Einzelkind-
    // Stufe — jeder seiner 151 Knoten hat ≥ 2 Kinder oder eigene Artikel. Der
    // Test hält die Tatsache fest, statt sie zu überspielen (§7/§8).
    const m = lade('kanton', 'BS-730.110');
    const einzelkind = zaehleRoh(m.sektionen, (s) => s.kinder.length === 1 && s.artikel.length === 0);
    expect(einzelkind).toBe(0);
    expect(flacheZeilen(m.knoten).every((k) => k.ids.length === 1)).toBe(true);
  });

  it('Verdichtung nimmt NIE einen Knoten mit eigenen Artikeln mit (T8-Schutz)', () => {
    for (const [ebene, key] of [['bund', 'ZGB'], ['kanton', 'BS-211.100'], ['kanton', 'BS-640.100']] as const) {
      const m = lade(ebene, key);
      const summe = flacheZeilen(m.knoten)
        .filter((k) => k.art === 'sektion')
        .reduce((n, k) => n + k.eigeneArtikel, 0);
      const rohSumme = ((): number => {
        let s = 0;
        const gehe = (x: Sektion[]): void => x.forEach((y) => { s += y.artikel.length; gehe(y.kinder); });
        gehe(m.sektionen);
        return s;
      })();
      expect(summe, `${key}: kein Artikel geht bei der Verdichtung verloren`).toBe(rohSumme);
    }
  });
});

// ═══ 5 · Zählwerte, Bereiche, Aufgehoben-Signal (§3.3) ═══════════════════════
describe('S3 — Zählwerte sind Summen, keine Schätzungen', () => {
  const faelle = [['bund', 'OR'], ['bund', 'AIG'], ['kanton', 'BS-211.100'], ['kanton', 'BS-640.100']] as const;
  for (const [ebene, key] of faelle) {
    it(`${key}: artikelAnzahl je Knoten = eigene + Kinder, rekursiv`, () => {
      const m = lade(ebene, key);
      const pruefe = (k: GliederungsKnoten): void => {
        const kinder = k.kinder.reduce((n, kk) => n + kk.artikelAnzahl, 0);
        // W2·18-FEHLERBUCH: s. T8-Fall oben — wo Artikel-Zeilen hängen, sind
        // die eigenen Artikel bereits in `kinder` enthalten.
        const eigenOhneZeile = k.kinder.some((kk) => kk.art === 'artikel') ? 0 : k.eigeneArtikel;
        expect(k.artikelAnzahl).toBe(eigenOhneZeile + kinder);
        k.kinder.forEach(pruefe);
      };
      m.knoten.forEach(pruefe);
    });
  }

  it('OR: Bereichs-Label kommt aus den amtlichen Etiketten, nie aus einer Zählung', () => {
    const m = lade('bund', 'OR');
    const mitBereich = flacheZeilen(m.knoten).filter((k) => k.bereich);
    expect(mitBereich.length).toBeGreaterThan(0);
    // «Art. 1–40» bzw. Einzelwert «Art. 12» — beide Formen stammen aus artikelLabel.
    for (const k of mitBereich.slice(0, 200)) {
      expect(k.bereich).toMatch(/^(Art\.|§)\s/);
    }
  });

  it('BS-211.100: aufgehobene Teilbäume sind als solche markiert', () => {
    const m = lade('kanton', 'BS-211.100');
    // 159 der 315 Artikel sind aufgehoben — mindestens ein Knoten muss das tragen.
    const aufgehoben = flacheZeilen(m.knoten).filter((k) => k.aufgehoben);
    expect(aufgehoben.length).toBeGreaterThan(0);
    // Gegenprobe: ein als aufgehoben markierter Knoten enthält wirklich nur
    // aufgehobene Artikel (sonst wäre die Markierung eine Falschaussage, §8).
    const tokenAufgehoben = new Map(m.eintraege.map((e) => [e.artikel, e.aufgehoben === true]));
    const rohArtikel = (ids: string[]): string[] => {
      const treffer: string[] = [];
      const gehe = (s: Sektion): void => {
        if (ids.includes(s.id)) {
          const alle = (x: Sektion): void => { x.artikel.forEach((a) => treffer.push(a.artikel)); x.kinder.forEach(alle); };
          alle(s);
        } else s.kinder.forEach(gehe);
      };
      m.sektionen.forEach(gehe);
      return treffer;
    };
    for (const k of aufgehoben.filter((x) => x.art === 'sektion').slice(0, 20)) {
      const tokens = rohArtikel(k.ids);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.every((t) => tokenAufgehoben.get(t) === true)).toBe(true);
    }
  });
});

// ═══ 6 · Anhang-Ast (§3.4, T6) ═══════════════════════════════════════════════
describe('S3 — Anhänge bekommen einen eigenen Ast am Baumende', () => {
  it('AIG: die zwei Anhänge hängen unter «Anhänge», nicht im Stamm', () => {
    const m = lade('bund', 'AIG');
    const wurzel = m.knoten.at(-1);
    expect(wurzel?.id).toBe(ID_ANHANG);
    expect(wurzel?.label).toBe('Anhänge');
    expect(wurzel?.artikelAnzahl).toBe(2);
    // Und im Stamm taucht kein Anhang-Knoten mehr auf.
    const stamm = m.knoten.filter((k) => k.id !== ID_ANHANG);
    expect(stamm.some((k) => k.anhang)).toBe(false);
  });

  it('ChemRRV: 58 % Anhang-Anteil → der Ast startet aufgeklappt (Dominanz-Regel)', () => {
    const m = lade('bund', 'CHEMRRV');
    expect(m.kennzahlen.anhangAnteil).toBeGreaterThan(0.5);
    expect(m.knoten.at(-1)?.id).toBe(ID_ANHANG);
    expect(m.knoten.at(-1)?.startOffen).toBe(true);
  });

  it('RBUE: ein reiner Anhang-Knoten aus dem Sidecar wandert unter die Wurzel', () => {
    const m = lade('bund', 'RBUE');
    const wurzel = m.knoten.at(-1)!;
    // Hier kommt der Anhang nicht aus freien Tokens, sondern als fertiger
    // Sidecar-Knoten — er wird umgehängt, nicht neu gebaut (§5: eine Quelle).
    expect(wurzel.kinder.length).toBe(1);
    expect(wurzel.kinder[0].art).toBe('sektion');
    expect(wurzel.kinder[0].anhang).toBe(true);
    expect(wurzel.kinder[0].tiefe).toBe(1);
    expect(wurzel.kinder[0].artikelAnzahl).toBe(2);
    expect(wurzel.kinder[0].label.length).toBeGreaterThan(0);
  });

  it('Anhang-Erkennung: Wortgrenze, kein Substring (§7)', () => {
    const bau = (artikel: string, artikelLabel: string): NormSnapshot => ({
      id: `kanton/ZH/243/${artikel}`, ebene: 'kanton', quelle: 'ZH', erlass: 'X',
      artikel, artikelLabel, bloecke: [],
      stand: '2026-01-01', quelleUrl: 'https://example.invalid/', abgerufen: '2026-01-01',
      fassungsToken: '20260101', sha: '0'.repeat(64),
    });
    expect(istAnhangEintrag(bau('annex_1', 'Anhang 1'))).toBe(true);
    expect(istAnhangEintrag(bau('anhang_7', 'Anhang Ziff. 7'))).toBe(true);
    expect(istAnhangEintrag(bau('1.1.2.1', 'Anhang Ziff. 1.1.2.1'))).toBe(true);
    // Kein Treffer: «Anhangsverzeichnis» ist ein anderes Wort, «12.5» ein Artikel.
    expect(istAnhangEintrag(bau('12', 'Art. 12'))).toBe(false);
    expect(istAnhangEintrag(bau('3', '§ 3'))).toBe(false);
  });
});

// ═══ 7 · Randtitel-Dichte aus beiden Korpus-Quellen ══════════════════════════
describe('S3 — Randtitel-Dichte liest Sidecar UND Snapshot', () => {
  it('Bund: die Dichte kommt aus der Sidecar-Marginalie (titel ist dort leer)', () => {
    const m = lade('bund', 'VWVG');
    expect(m.eintraege.every((e) => (e.titel ?? '') === '')).toBe(true);
    expect(m.kennzahlen.marginalienDichte).toBe(1);
    expect(m.eintraege.every((e) => hatRandtitel(e, m.struktur))).toBe(true);
  });

  it('Kanton: die Dichte kommt aus dem Snapshot-titel', () => {
    const m = lade('kanton', 'BS-211.100');
    const mitTitel = m.eintraege.filter((e) => (e.titel ?? '').trim().length > 0).length;
    expect(mitTitel).toBeGreaterThan(0);
    expect(m.kennzahlen.marginalienDichte).toBeCloseTo(mitTitel / m.eintraege.length, 10);
  });

  it('ohne Sidecar und ohne titel ist die Dichte 0 (kein fabrizierter Wert)', () => {
    expect(lade('kanton', 'SG-3849').kennzahlen.marginalienDichte).toBe(0);
  });
});

// ═══ 8 · Determinismus (§2) ══════════════════════════════════════════════════
describe('S3 — gleiche Eingabe, gleiche Ausgabe', () => {
  it('zwei Läufe über OR liefern strukturgleiche Modelle', () => {
    const a = lade('bund', 'OR');
    const b = lade('bund', 'OR');
    expect(JSON.stringify(a.knoten)).toBe(JSON.stringify(b.knoten));
    expect(a.kennzahlen).toEqual(b.kennzahlen);
  });

  it('leere Eingabe ergibt B3 Leer und keinen Knoten (kein Absturz, kein NaN)', () => {
    // W2·18 (David 13.8.2026): der Erlass ohne jeden Artikel ist der EINE Fall,
    // für den die Leer-Zeile stimmt — vorher fiel er in B4 Mini und die Leiste
    // bot ein leeres Verzeichnis hinter dem ☰ an.
    const m = baueGliederungsModell({ sektionen: [], ohneGliederung: [], eintraege: [], struktur: null });
    expect(m.modus).toBe('b3-leer');
    expect(m.knoten).toEqual([]);
    expect(m.kennzahlen.marginalienDichte).toBe(0);
    expect(m.kennzahlen.anhangAnteil).toBe(0);
  });
});
