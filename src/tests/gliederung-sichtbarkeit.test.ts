/**
 * W2·5m-LESER-V3 — Wächter «offen heisst: man sieht etwas» (Befund David
 * 19.9.2026: «bei svg art. 26 nicht ersichtlich und ausserdem klappt oft
 * unterste ebene nicht auf» + «auch das aufklappen soll optimiert werden»).
 *
 * GEMESSENE URSACHE (Messlauf 19.9.2026 über alle Bundeserlasse, echte Kette
 * baueGliederungsbaum → kuratiereTocSektionen → baueGliederungsModell):
 *   · Die Artikel-Kinder einer Zeile hingen an einem EIGENEN Schlüssel
 *     `art@<id>`, den nur der Chevron schrieb. Mitlaufen, Sprung, Tieflink,
 *     Sheet-Öffnen und «alles auf» setzten nur die Sektions-Ids — die Zeile
 *     meldete `aria-expanded=true` bei NULL sichtbaren Kindern, und der erste
 *     Klick klappte sie ZU (4'586 unterste Zeilen in 222 Erlassen).
 *   · «Art.-26-Muster»: Artikel direkt unter einem Knoten, der auch
 *     Unterabschnitte hat (SVG Art. 26 unter «III. Titel», vor dem
 *     1. Abschnitt), blieben unsichtbar, obwohl der Knoten offen stand.
 *
 * Alles hier läuft auf den ECHTEN Snapshots und ohne Zeit- oder Warte-Logik
 * (Lehre 18.9.2026: ein Wächter misst nie seine eigene Messpause). Geprüft wird
 * genau die Ableitung, aus der der Renderer liest (`zeilenAnsicht`), und genau
 * die Öffner, die die Oberfläche schreibt (`klappKarte`, `klappZeile`).
 *
 * BEWUSSTE AUSNAHME: ZGB-Anhang A36 (74 Alt-Artikel) fehlt absichtlich in der
 * Gliederung (`kuratiereTocSektionen`). Diese Artikel haben weder Pfad noch
 * Zeile und fallen darum aus den Sprung-Fällen heraus — sie werden hier NICHT
 * «repariert»; der Zähler unten hält die Zahl fest, damit eine Verschiebung
 * auffällt.
 */
import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { baueGliederungsbaum, type Sektion } from '../lib/normtext/browse';
import { ladeNormFixture } from './fixtures/normtext-fixture';
import { kuratiereTocSektionen } from '../pages/gesetz-leser/berechnungen';
import { pfadZu } from '../pages/gesetz-leser/helpers';
import { klappZeile } from '../pages/gesetz-leser/tocAutoZuklappen';
import { oeffneSprungZiel, setzeAlle, alleOffen, alleKlappIds } from '../pages/gesetz-leser/klappKarte';
import {
  baueGliederungsModell, flacheZeilen, zeilenAnsicht, findeMarke, findeSynthPfad,
  type GliederungsModell, type GliederungsKnoten,
} from '../pages/gesetz-leser/gliederungsModell';

type Karte = Record<string, boolean>;

function lade(ebene: 'bund' | 'kanton', key: string): GliederungsModell & { sektionen: Sektion[]; roh: Sektion[] } {
  const { eintraege, struktur } = ladeNormFixture(ebene, key);
  const roh = baueGliederungsbaum(eintraege, struktur);
  const sektionen = kuratiereTocSektionen(roh.sektionen);
  // `startSichtbarGo: true` = der Leser (leserV3Modell.ts), nicht der Altpfad.
  const modell = baueGliederungsModell({
    sektionen, ohneGliederung: roh.ohneGliederung, eintraege, struktur, startSichtbarGo: true,
  });
  return { ...modell, sektionen, roh: roh.sektionen };
}

/** Alle Bundeserlasse (ganzer Korpus — die Kette braucht ~1 s dafür). */
const BUND = readdirSync('public/normtext/bund').filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort();
/** Kantonale Stichprobe mit gemischten Knoten (T8-Fälle aus w218). */
const KANTON = ['BS-257.820', 'GR-210.370'];
const FAELLE: Array<['bund' | 'kanton', string]> = [
  ...BUND.map((k) => ['bund', k] as ['bund', string]),
  ...KANTON.map((k) => ['kanton', k] as ['kanton', string]),
];
const MODELLE = new Map<string, ReturnType<typeof lade>>();
const modell = (ebene: 'bund' | 'kanton', key: string) => {
  const s = `${ebene}/${key}`;
  if (!MODELLE.has(s)) MODELLE.set(s, lade(ebene, key));
  return MODELLE.get(s)!;
};

/** Die gerenderten Zeilen (was der Nutzer sieht). */
function gerendert(knoten: readonly GliederungsKnoten[], offen: Karte, tiefe: number): GliederungsKnoten[] {
  return knoten.flatMap((k) => [k, ...gerendert(zeilenAnsicht(k, offen, tiefe).sichtbareKinder, offen, tiefe)]);
}

/** Mitlaufen im härtesten Fall: der Spy hat JEDE Sektions-Id beschrieben. */
function mitlaufenUeberall(m: GliederungsModell): Karte {
  const o: Karte = {};
  for (const k of flacheZeilen(m.knoten)) for (const id of k.ids) o[id] = true;
  return o;
}

/** Verstösse gegen «offen ⇒ alle Kinder sichtbar» unter den Zeilen `zeilen`. */
function offenLeer(zeilen: readonly GliederungsKnoten[], offen: Karte, tiefe: number): GliederungsKnoten[] {
  return zeilen.filter((k) => {
    if (k.kinder.length === 0) return false;
    const a = zeilenAnsicht(k, offen, tiefe);
    return a.auf && a.sichtbareKinder.length !== k.kinder.length;
  });
}

const kurz = (key: string, k: GliederungsKnoten) => `${key}: «${k.labelKette[k.labelKette.length - 1]}»`;

describe('W2·5m-LESER-V3 — eine offene Zeile zeigt alle ihre Kinder', () => {
  const zustaende: Array<[string, (m: GliederungsModell) => Karte]> = [
    ['Start', () => ({})],
    ['nach Mitlaufen', mitlaufenUeberall],
    ['nach «alles auf»', (m) => setzeAlle({}, alleKlappIds(m.knoten), true)],
  ];
  for (const [name, zustand] of zustaende) {
    it(`${name}: keine Zeile meldet «offen» mit fehlenden Kindern (alle Bundeserlasse + Stichprobe Kanton)`, () => {
      const funde: string[] = [];
      for (const [ebene, key] of FAELLE) {
        const m = modell(ebene, key);
        const offen = zustand(m);
        for (const k of offenLeer(flacheZeilen(m.knoten), offen, m.startOffeneTiefe)) funde.push(kurz(key, k));
      }
      expect(funde.length, `${funde.length} Zeilen offen-unvollständig, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
    });
  }

  it('nach einem Sprung auf jeden Artikel: der Pfad ist offen und vollständig', () => {
    const funde: string[] = [];
    for (const [ebene, key] of FAELLE) {
      const m = modell(ebene, key);
      const zeilen = flacheZeilen(m.knoten);
      // Je Sektion mit eigenen Artikeln EIN Sprung — alle ihre Artikel teilen den Pfad.
      for (const s of flacheSektionen(m.sektionen)) {
        if (s.artikel.length === 0) continue;
        const pfad = pfadZu(m.sektionen, (x) => x.id === s.id)!;
        const offen = oeffneSprungZiel({}, pfad, pfad.slice(-1));
        const aufPfad = zeilen.filter((k) => k.ids.some((id) => pfad.includes(id)));
        for (const k of offenLeer(aufPfad, offen, m.startOffeneTiefe)) funde.push(`${kurz(key, k)} (Art. ${s.artikel[0].artikel})`);
      }
    }
    expect(funde.length, `${funde.length} Fälle, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
  });
});

function flacheSektionen(s: readonly Sektion[]): Sektion[] {
  return s.flatMap((x) => [x, ...flacheSektionen(x.kinder)]);
}

describe('W2·5m-LESER-V3 — ein Klick genügt', () => {
  const zustaende: Array<[string, (m: GliederungsModell) => Karte]> = [
    ['Start', () => ({})],
    ['nach Mitlaufen', mitlaufenUeberall],
    ['nach «alles auf»', (m) => setzeAlle({}, alleKlappIds(m.knoten), true)],
  ];
  for (const [name, zustand] of zustaende) {
    it(`${name}: ein Chevron-Klick öffnet jede unvollständige Zeile ganz bzw. schliesst jede ganz offene`, () => {
      const funde: string[] = [];
      for (const [ebene, key] of FAELLE) {
        const m = modell(ebene, key);
        const offen = zustand(m);
        for (const k of flacheZeilen(m.knoten)) {
          if (k.kinder.length === 0) continue;
          const vorher = zeilenAnsicht(k, offen, m.startOffeneTiefe);
          // Der Chevron übergibt den ANGEZEIGTEN Zustand (SektionBaumTOC: onToggle(k.ids, auf)).
          const nach = zeilenAnsicht(k, klappZeile(offen, k.ids, vorher.auf), m.startOffeneTiefe);
          const ganz = vorher.sichtbareKinder.length === k.kinder.length;
          if (ganz && vorher.auf) {
            if (nach.auf || nach.sichtbareKinder.length > 0) funde.push(`${kurz(key, k)}: schliesst nicht`);
          } else if (!nach.auf || nach.sichtbareKinder.length !== k.kinder.length) {
            funde.push(`${kurz(key, k)}: 1. Klick zeigt ${nach.sichtbareKinder.length}/${k.kinder.length}`);
          }
        }
      }
      expect(funde.length, `${funde.length} Zeilen, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
    });
  }

  it('«alles zu» schliesst jede Zeile — auch nach Mitlaufen über verdichtete Ketten', () => {
    const funde: string[] = [];
    for (const [ebene, key] of FAELLE) {
      const m = modell(ebene, key);
      const ids = alleKlappIds(m.knoten);
      const auf = setzeAlle(mitlaufenUeberall(m), ids, true);
      if (ids.length > 0 && !alleOffen(auf, ids)) funde.push(`${key}: «alles auf» meldet nicht offen`);
      const zu = setzeAlle(auf, ids, false);
      for (const k of flacheZeilen(m.knoten)) {
        if (k.kinder.length > 0 && zeilenAnsicht(k, zu, m.startOffeneTiefe).auf) funde.push(`${kurz(key, k)} bleibt offen`);
      }
    }
    expect(funde.length, `${funde.length} Fälle, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
  });
});

describe('W2·5m-LESER-V3 — Artikel-Sprung: der Ast steht bis zur Artikel-Zeile offen, die Marke sitzt dort', () => {
  it('jeder Artikel mit eigener Zeile trägt nach dem Sprung die Marke (alle Bundeserlasse + Stichprobe Kanton)', () => {
    const funde: string[] = [];
    let gezaehlt = 0;
    for (const [ebene, key] of FAELLE) {
      const m = modell(ebene, key);
      const artZeilen = flacheZeilen(m.knoten).filter((k) => k.art === 'artikel' && k.ersterArtikel);
      for (const z of artZeilen) {
        const token = z.ersterArtikel!;
        // Genau der Pfad, den `springeZuArtikel` (leserV3Modell.ts) bildet.
        const pfad = pfadZu(m.sektionen, (s) => s.artikel.some((e) => e.artikel === token))
          ?? findeSynthPfad(m.knoten, token) ?? [];
        if (pfad.length === 0) { funde.push(`${key} Art. ${token}: kein Pfad`); continue; }
        gezaehlt++;
        const offen = oeffneSprungZiel({}, pfad, pfad.slice(-1));
        const marke = findeMarke(m.knoten, pfad, offen, m.startOffeneTiefe, token);
        if (marke !== z.id) funde.push(`${key} Art. ${token}: Marke auf ${String(marke)}`);
        // Die Zeile ist wirklich gerendert (alle Vorfahren zeigen sie).
        else if (!gerendert(m.knoten, offen, m.startOffeneTiefe).some((k) => k.id === z.id)) {
          funde.push(`${key} Art. ${token}: Zeile nicht sichtbar`);
        }
      }
    }
    expect(gezaehlt).toBeGreaterThan(1000);
    expect(funde.length, `${funde.length} von ${gezaehlt}, z. B. ${funde.slice(0, 5).join(' | ')}`).toBe(0);
  }, 60_000);

  it('ZGB-Anhang A36: die 74 Alt-Artikel fehlen bewusst in der Gliederung (Ausnahme, keine Reparatur)', () => {
    const m = modell('bund', 'ZGB');
    const imBaum = new Set(flacheSektionen(m.sektionen).flatMap((s) => s.artikel.map((e) => e.artikel)));
    const imRoh = flacheSektionen(m.roh).flatMap((s) => s.artikel.map((e) => e.artikel));
    expect(imRoh.filter((a) => !imBaum.has(a)).length).toBe(74);
  });
});

describe('W2·5m-LESER-V3 — «Art.-26-Muster»: Artikel vor dem ersten Unterabschnitt', () => {
  it('SVG: Art. 26 ist beim Öffnen sichtbar, zwischen «III. Titel» und «1. Abschnitt»', () => {
    const m = modell('bund', 'SVG');
    const titel = m.knoten.find((k) => /^III\. Titel/.test(k.labelKette[k.labelKette.length - 1]));
    expect(titel, 'SVG: «III. Titel» fehlt').toBeDefined();
    const sicht = gerendert(m.knoten, {}, m.startOffeneTiefe);
    const iTitel = sicht.findIndex((k) => k.id === titel!.id);
    const iArt26 = sicht.findIndex((k) => k.art === 'artikel' && k.ersterArtikel === '26');
    const iAbschnitt = sicht.findIndex((k, i) => i > iTitel && /^1\. Abschnitt/.test(k.labelKette[k.labelKette.length - 1]));
    expect(iTitel).toBeGreaterThanOrEqual(0);
    expect(iArt26, 'SVG Art. 26 ist beim Öffnen nicht sichtbar').toBeGreaterThan(iTitel);
    expect(iAbschnitt).toBeGreaterThan(iArt26);
  });

  it('jeder gemischte Knoten zeigt, sobald er offen ist, seine direkten Artikel in Gesetzesreihenfolge', () => {
    const funde: string[] = [];
    for (const [ebene, key] of FAELLE) {
      const m = modell(ebene, key);
      for (const k of flacheZeilen(m.knoten)) {
        const artikel = k.kinder.filter((kk) => kk.art === 'artikel');
        if (artikel.length === 0 || artikel.length === k.kinder.length) continue;
        // Offen über die Sektions-Ids (Mitlaufen/Sprung) — nicht nur per Chevron.
        const offen = Object.fromEntries(k.ids.map((id) => [id, true]));
        const a = zeilenAnsicht(k, offen, m.startOffeneTiefe);
        if (a.sichtbareKinder.map((x) => x.id).join() !== k.kinder.map((x) => x.id).join()) funde.push(kurz(key, k));
      }
    }
    expect(funde).toEqual([]);
  });
});
