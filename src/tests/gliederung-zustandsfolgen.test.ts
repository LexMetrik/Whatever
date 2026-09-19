/**
 * W2·5m-LESER-V3 — Wächter «wer eine Zeile schliesst, schliesst ihre
 * Artikel-Ebene mit» — in ZUSTANDSFOLGEN, nicht in Einzelzuständen.
 *
 * BEFUND (Code-Zweitblick PR #924, 19.9.2026, reproduziert an ADOV sek-0):
 *   1. Tieflink `/gesetze/…#art-N` (`tiefLinkZweig.ts`) öffnet den Ast über
 *      `oeffneSprungZiel` — Sektions-Id UND `art@<id>` — und trägt die Ids ins
 *      Auto-Set (bewusst, W2·24-R6c).
 *   2. Weiterlesen → Auto-Zuklappen (`mitlaufenKarte`, Liste aus
 *      `planeZuklappen`) setzte nur `<id>=false`; `art@<id>` blieb liegen.
 *   3. Zurückscrollen → Mitlaufen setzt `<id>=true` → `artikelKinderOffen`
 *      liest das alte `art@` → eine REINE Artikel-Liste öffnet sich durch
 *      blosses Mitlaufen. Das verletzt die CLS-Regel 13.8.2026 (Artikel-Ebene
 *      nur durch ausdrücklichen Schritt; Vorfall a33, bis 49 Zeilen je Ast).
 *
 * Der Bestandswächter `gliederung-sichtbarkeit.test.ts` baut «nach Mitlaufen»
 * jedes Mal frisch aus `{}` und sieht solche Rückstände darum nicht. Hier laufen
 * die ECHTEN Karten-Funktionen (`klappKarte.ts`) nacheinander auf den ECHTEN
 * Snapshots aller Bundeserlasse — ohne Zeit- oder Warte-Logik.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { baueGliederungsbaum, type Sektion } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { pfadZu } from '../pages/gesetz-leser/helpers';
import {
  oeffneSprungZiel, setzeAlle, alleKlappIds, klappZeile, mitlaufenKarte, artikelSchluessel,
} from '../pages/gesetz-leser/klappKarte';
import {
  baueGliederungsModell, flacheZeilen, zeilenAnsicht, uebersetzeRohPfad,
  type GliederungsModell, type GliederungsKnoten,
} from '../pages/gesetz-leser/gliederungsModell';

type Karte = Record<string, boolean>;
const LEER: ReadonlySet<string> = new Set();

function lade(key: string): GliederungsModell & { sektionen: Sektion[] } {
  const { eintraege, struktur } = ladeNormFixture('bund', key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  const sektionen = kuratiereTocSektionen(roh.sektionen);
  const modell = baueGliederungsModell({
    sektionen, ohneGliederung: roh.ohneGliederung, eintraege, struktur, startSichtbarGo: true,
  });
  return { ...modell, sektionen };
}

const BUND = readdirSync('public/normtext/bund').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
const PFLICHT = ['ADOV', 'SVG', 'OR', 'ZGB', 'STPO'];

const flacheSektionen = (s: readonly Sektion[]): Sektion[] => s.flatMap((x) => [x, ...flacheSektionen(x.kinder)]);
const reineArtikelZeile = (k: GliederungsKnoten) => k.kinder.length > 0 && k.kinder.every((kk) => kk.art === 'artikel');

/** Mitlaufen des Spys über einen Pfad (Scroll-Ruhe erreicht, nichts zu schliessen). */
const mitlaufen = (o: Karte, pfad: readonly string[], manuellZu: ReadonlySet<string> = LEER) =>
  mitlaufenKarte(o, { aktivIds: pfad, aufklappen: true, manuellZu, schliessen: [] });
/** Auto-Zuklappen: der Spy hat den Pfad hinter sich gelassen, `planeZuklappen` gibt ihn frei. */
const autoZu = (o: Karte, pfad: readonly string[]) =>
  mitlaufenKarte(o, { aktivIds: [], aufklappen: true, manuellZu: LEER, schliessen: pfad });

interface Fall { key: string; m: ReturnType<typeof lade>; pfad: string[]; zeile: GliederungsKnoten }

/** Je Sektion mit eigenen Artikeln, deren Träger-Zeile NUR Artikel trägt, ein Fall. */
function faelle(): Fall[] {
  const out: Fall[] = [];
  for (const key of BUND) {
    const m = lade(key);
    const zeilen = flacheZeilen(m.knoten);
    for (const s of flacheSektionen(m.sektionen)) {
      if (s.artikel.length === 0) continue;
      const pfad = uebersetzeRohPfad(m.umhaengPraefix, pfadZu(m.sektionen, (x) => x.id === s.id) ?? []);
      const ziel = pfad[pfad.length - 1];
      const zeile = zeilen.find((k) => k.ids.includes(ziel));
      if (ziel && zeile && reineArtikelZeile(zeile)) out.push({ key, m, pfad, zeile });
    }
  }
  return out;
}
const FAELLE = faelle();

/** Reine Artikel-Zeilen, die nach der Folge ihre Artikel ZEIGEN. */
function offeneArtikelListen(m: GliederungsModell, o: Karte): GliederungsKnoten[] {
  return flacheZeilen(m.knoten).filter((k) => reineArtikelZeile(k) && zeilenAnsicht(k, o, m.startOffeneTiefe).sichtbareKinder.length > 0);
}

const kurz = (f: Fall) => `${f.key}: «${f.zeile.labelKette[f.zeile.labelKette.length - 1]}»`;

describe('W2·5m-LESER-V3 — Zustandsfolgen der Klapp-Karte (alle Bundeserlasse)', () => {
  it('Stichprobe trägt: jeder Pflicht-Erlass (ADOV, SVG, OR, ZGB, StPO) liefert Fälle', () => {
    for (const k of PFLICHT) expect(FAELLE.some((f) => f.key === k), k).toBe(true);
    expect(FAELLE.length).toBeGreaterThan(1000);
  });

  const folgen: Array<[string, (f: Fall) => Karte]> = [
    ['Tieflink-Landung → Auto-Zu → erneutes Mitlaufen', (f) =>
      mitlaufen(autoZu(oeffneSprungZiel({}, f.pfad, f.pfad.slice(-1)), f.pfad), f.pfad)],
    ['Mitlaufen → Klick-Öffnen → «alles zu» → Mitlaufen', (f) => {
      const o0 = mitlaufen({}, f.pfad);
      const o1 = klappZeile(o0, f.zeile.ids, zeilenAnsicht(f.zeile, o0, f.m.startOffeneTiefe).auf);
      return mitlaufen(setzeAlle(o1, alleKlappIds(f.m.knoten), false), f.pfad);
    }],
    // Härtester Fall: der Spy kennt die Klick-Schliessung NICHT (leeres manuellZu).
    ['Mitlaufen → Klick-Öffnen → Klick-Zu → Mitlaufen', (f) => {
      const o0 = mitlaufen({}, f.pfad);
      const o1 = klappZeile(o0, f.zeile.ids, zeilenAnsicht(f.zeile, o0, f.m.startOffeneTiefe).auf);
      const o2 = klappZeile(o1, f.zeile.ids, zeilenAnsicht(f.zeile, o1, f.m.startOffeneTiefe).auf);
      return mitlaufen(o2, f.pfad);
    }],
  ];
  for (const [name, folge] of folgen) {
    it(`${name}: keine reine Artikel-Liste offen`, () => {
      const funde: string[] = [];
      for (const f of FAELLE) if (offeneArtikelListen(f.m, folge(f)).length > 0) funde.push(kurz(f));
      expect(funde.length, `${funde.length}/${FAELLE.length} Fälle, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
    });
  }

  it('Invariante: jeder Schliesser setzt mit der Zeile auch ihre Artikel-Ebene zu', () => {
    const funde: string[] = [];
    for (const key of PFLICHT) {
      const m = lade(key);
      const ids = alleKlappIds(m.knoten);
      const alles = setzeAlle({}, ids, true);
      const schliesser: Array<[string, Karte]> = [
        ['Auto-Zu', autoZu(alles, ids)],
        ['alles zu', setzeAlle(alles, ids, false)],
        ['Klick-Zu', flacheZeilen(m.knoten).reduce<Karte>((o, k) => (k.kinder.length ? klappZeile(o, k.ids, true) : o), alles)],
      ];
      for (const [name, o] of schliesser) {
        const rest = ids.filter((id) => o[id] === false && o[artikelSchluessel(id)] === true);
        if (rest.length) funde.push(`${key}/${name}: ${rest.length}`);
      }
    }
    expect(funde, funde.join(' | ')).toEqual([]);
  });
});
