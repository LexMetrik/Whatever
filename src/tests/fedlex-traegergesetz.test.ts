// ─── Wächter: Trägergesetz-Kontext «des Gesetzes» (V-7c, W2·20) ──────────────
//
// Jeder Eintrag in `TRAEGER_EINTRAEGE` behauptet, dass eine Vollzugsverordnung
// mit «des Gesetzes» EIN bestimmtes Bundesgesetz meint. Das ist keine Lesart,
// sondern eine LEGALDEFINITION: der Ingress der Verordnung nennt den Erlass und
// setzt die Kurzform in Klammern dahinter — «… des Arbeitsgesetzes vom
// 13. März 1964 (Gesetz, ArG)». Dieser Wächter prüft genau das, gegen die
// amtliche Quelle (Struktur-Sidecar aus der Fedlex-Extraktion), nicht gegen
// eine zweite Tabelle:
//
//   1. Der hinterlegte Beleg steht WÖRTLICH im Ingress.
//   2. Im Ingress gibt es GENAU EINE Klammer, die «Gesetz» definiert — sonst
//      wäre die Kurzform mehrdeutig und dürfte nicht auflösen (§1).
//   3. Das unmittelbar davor zitierte Erlassdatum ist das Erlassdatum des
//      hinterlegten Ziels (dieselbe Quelle wie `ERLASSDATUM`).
//   4. Bestandsprüfung: jede Korpus-Stelle, die über dieses Signal einen Link
//      bekommt, zeigt auf einen Artikel, den der Ziel-Snapshot wirklich führt.
//
// Scheiterns-Fähigkeit (§6.7): die drei Negativ-Fälle unten zeigen, dass ein
// Erlass ohne Eintrag, ein widersprechendes Zitat-Datum und ein «dieses
// Gesetzes» NICHT auflösen — und der Rot-Beweis im PR zeigt, dass ein
// erfundener Eintrag Fall 2/3 reisst.

import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TRAEGER_EINTRAEGE, artikelToken, fremdRoutingFormB, artikelnPluralVerweise,
  traegergesetzFuerErlass, erkenneGenitivGesetz, erkenneTitelGesetz,
  SUFFIX_ALT, type FedlexGesetz,
} from '../lib/fedlex';
import { ERLASSDATUM } from '../lib/fedlex/positivliste';
// §5: keine zweite Nachbildung der Guard-Kette — geprüft wird gegen die
// Transkription, die das V-1-Tor fährt und die der Guard-Wächter
// (`verweis-inventar-guards.test.ts`) zeichengleich an NormText.tsx hält.
import { stellenImText, type Ctx } from '../../scripts/verweis-inventar-transkription';

interface RegisterErlass { key: string; ebene: string; titel?: string; datei?: string; status?: string }
const WURZEL = process.cwd();
const register = JSON.parse(readFileSync(join(WURZEL, 'public', 'normtext', 'register.json'), 'utf8')) as { erlasse: RegisterErlass[] };
const kanon = (s: string): string =>
  s.toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/[^A-Z0-9]/g, '');
const erlassVon = (key: string): RegisterErlass | undefined =>
  register.erlasse.find((e) => e.ebene === 'bund' && kanon(e.key) === kanon(key));

const MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
  'August', 'September', 'Oktober', 'November', 'Dezember'];
const datumIso = (roh: string): string | null => {
  const m = /^(\d{1,2})\.\s*([A-Za-zÄÖÜäöü]+)\s+(\d{4})$/.exec(roh.trim());
  if (!m) return null;
  const mo = MONATE.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
  return mo < 0 ? null : `${m[3]}-${String(mo + 1).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
};

function ingressVon(key: string): string {
  const e = erlassVon(key);
  expect(e?.datei, `${key}: nicht im Bund-Register`).toBeDefined();
  const sidecar = JSON.parse(readFileSync(join(WURZEL, 'public', 'normtext', 'struktur', e!.datei!), 'utf8')) as
    { kopf?: { praeambel?: { rolle?: string; text?: string }[] } };
  const ingress = (sidecar.kopf?.praeambel ?? []).filter((p) => p.rolle === 'ingress').map((p) => p.text ?? '').join(' ');
  expect(ingress, `${key}: Struktur-Sidecar ohne Ingress`).not.toBe('');
  return ingress.replace(/­/g, '');
}

/** Alle Klammern des Ingresses, die die Kurzform «Gesetz» definieren.
 *
 *  Vier belegte Schreibweisen im Bund-Korpus (Sweep 14.9.2026 über alle
 *  Bund-Struktur-Sidecars): «(Gesetz)» · «(Gesetz, ArG)» · «(Gesetz/UVG)» ·
 *  «(nachstehend «Gesetz»)». Die erste Fassung dieses Filters kannte nur die
 *  ersten drei — sie zerlegte an `[,/;]` und verglich auf `=== 'Gesetz'`,
 *  wodurch ARGV3 und ARGV4 unsichtbar blieben (Gegenprüfungs-Befund B1).
 *  Darum wird zusätzlich das Einführungswort («nachstehend», «nachfolgend»,
 *  «im Folgenden», «hiernach») und die Anführung ringsum abgestreift, bevor
 *  auf IDENTITÄT verglichen wird — nie auf Enthaltensein (§7): «(Gesetzes-
 *  sammlung)» oder «(KAG)» dürfen nicht treffen. */
const GESETZ_KLAMMERN = /\(([^()]*)\)/g;
const EINFUEHRUNG = /^(?:nachstehend|nachfolgend|im Folgenden|hiernach|hienach)\s*:?\s*/i;
const ANFUEHRUNG = /^[«»"„“'\u2019]+|[«»"„“'\u2019]+$/g;
const definiertGesetz = (inhalt: string): boolean =>
  inhalt.split(/[,/;]/)
    .map((s) => s.trim().replace(EINFUEHRUNG, '').replace(ANFUEHRUNG, '').trim())
    .includes('Gesetz');

describe('V-7c — Trägergesetz ist im Ingress legaldefiniert', () => {
  it.each(TRAEGER_EINTRAEGE.map((e) => [e.verordnung, e.gesetz, e.beleg] as const))(
    '%s → %s: Beleg steht wörtlich im Ingress, genau eine «Gesetz»-Klammer, Datum passt',
    (verordnung, gesetz, beleg) => {
      const ingress = ingressVon(verordnung);
      // 1. Beleg wörtlich.
      expect(ingress.includes(beleg), `${verordnung}: Beleg «${beleg}» nicht im Ingress «${ingress}»`).toBe(true);
      // 2. Genau eine Klammer definiert «Gesetz».
      const treffer = [...ingress.matchAll(GESETZ_KLAMMERN)].filter((m) => definiertGesetz(m[1]));
      expect(treffer.length, `${verordnung}: ${treffer.length} «Gesetz»-Klammern im Ingress — mehrdeutig`).toBe(1);
      // 3. Das davor zitierte Erlassdatum ist das Erlassdatum des Ziels.
      const davor = ingress.slice(0, treffer[0].index);
      const daten = [...davor.matchAll(/\bvom\s+(\d{1,2}\.\s*[A-Za-zÄÖÜäöü]+\s+\d{4})/g)];
      expect(daten.length, `${verordnung}: kein zitiertes Datum vor der «Gesetz»-Klammer`).toBeGreaterThan(0);
      const zitiert = datumIso(daten[daten.length - 1][1]);
      expect(zitiert, `${verordnung}: Datum «${daten[daten.length - 1][1]}» nicht parsebar`).not.toBeNull();
      expect(zitiert, `${verordnung}: Ingress zitiert ${zitiert}, Ziel ${gesetz} hat Erlassdatum ${ERLASSDATUM[gesetz]}`)
        .toBe(ERLASSDATUM[gesetz]);
    },
  );

  it('jede Verordnung steht genau einmal in der Tabelle', () => {
    const keys = TRAEGER_EINTRAEGE.map((e) => kanon(e.verordnung));
    expect(new Set(keys).size).toBe(keys.length);
  });
});

// ─── Vollständigkeit: der Sweep IST der Massstab, nicht die Tabelle ──────────
//
// Befund B1 der Gegenprüfung zu #864: die Tabelle BEHAUPTETE Vollständigkeit,
// bewiesen war sie nicht. Ein Handsweep hatte 7 Erlasse gefunden; ARGV3 und
// ARGV4 blieben liegen, weil ihre Klammer «(nachstehend «Gesetz»)» lautet.
// Folge: 9 Stellen der ArGV 4 zeigten auf ARGV4 statt aufs ArG.
//
// Konsequenz (§17: Wurzel-Fix, nicht Einzelkorrektur): der Wächter fährt den
// Sweep bei JEDEM Lauf selbst, über ALLE Bund-Struktur-Sidecars, und verlangt
// Mengen-GLEICHHEIT in beide Richtungen. Ein künftiger Erlass mit
// «Gesetz»-Legaldefinition kann darum nicht mehr still danebenliegen — und ein
// Eintrag ohne Ingress-Deckung auch nicht.
function ingressRoh(datei: string | undefined): string {
  if (!datei) return '';
  const pfad = join(WURZEL, 'public', 'normtext', 'struktur', datei);
  if (!existsSync(pfad)) return '';
  const sidecar = JSON.parse(readFileSync(pfad, 'utf8')) as
    { kopf?: { praeambel?: { rolle?: string; text?: string }[] } };
  return (sidecar.kopf?.praeambel ?? []).filter((p) => p.rolle === 'ingress')
    .map((p) => p.text ?? '').join(' ').replace(/\u00ad/g, '');
}

describe('V-7c — Vollständigkeit: Tabelle == Ingress-Sweep über alle Bund-Erlasse', () => {
  const bund = register.erlasse.filter((e) => e.ebene === 'bund' && e.datei);

  it('der Sweep sieht jedes Bund-Sidecar (sonst misst er Ruhe über nichts)', () => {
    // §6.7 lit. b: ein Sweep, dessen Grundmenge schrumpfen kann, ohne dass es
    // auffällt, ist kein Wächter. 228 Bund-Erlasse mit Sidecar (14.9.2026).
    expect(bund.length).toBeGreaterThan(200);
    expect(bund.filter((e) => ingressRoh(e.datei) === '').length,
      'Bund-Erlasse ohne lesbaren Ingress — der Sweep hat blinde Flecken').toBeLessThan(bund.length / 2);
  });

  it('genau die Erlasse mit «Gesetz»-Legaldefinition stehen in der Tabelle', () => {
    const sweep = bund
      .filter((e) => [...ingressRoh(e.datei).matchAll(GESETZ_KLAMMERN)].some((m) => definiertGesetz(m[1])))
      .map((e) => kanon(e.key)).sort();
    const tabelle = TRAEGER_EINTRAEGE.map((e) => kanon(e.verordnung)).sort();
    // Beide Richtungen einzeln, damit die Meldung sagt, WAS fehlt.
    expect(sweep.filter((k) => !tabelle.includes(k)),
      'Ingress definiert «Gesetz», Erlass fehlt aber in TRAEGER_EINTRAEGE').toEqual([]);
    expect(tabelle.filter((k) => !sweep.includes(k)),
      'Eintrag in TRAEGER_EINTRAEGE ohne «Gesetz»-Legaldefinition im Ingress').toEqual([]);
    expect(sweep).toEqual(tabelle);
    expect(sweep.length, 'Sweep leer — der Filter trifft nichts mehr').toBeGreaterThan(0);
  });
});

// ─── B3: Erlass-IDENTITÄT, nicht nur Erlassdatum ────────────────────────────
//
// Befund B3: das Erlassdatum allein trägt die Zuordnung nicht — 15 Datumswerte
// teilen sich mindestens zwei Erlasse (UVG und IRSG sind beide vom 20.3.1981,
// AVIG/BVG vom 25.6.1982, DBG/STHG vom 14.12.1990 …). Ein falsches Kürzel mit
// gleichem Erlassdatum ginge durch die Datumsprüfung.
//
// Zweiter, unabhängiger Pfad: der NAME, den der Ingress vor der Klammer nennt,
// muss über DIESELBE kuratierte Positivliste auf dasselbe Ziel auflösen, die
// auch die Produktion nutzt (§5) — keine zweite Namensliste, keine Heuristik.
const ZITIERTER_ERLASS =
  /\b(?:des|der|das|die|dem|den)\s+((?:[A-ZÄÖÜ][\wäöüß-]*)?[Gg]esetz(?:es)?)\s+vom\s+\d{1,2}\.\s*[A-Za-zÄÖÜäöü]+\s+\d{4}(?:\s+(über\s+[^()]*?))?\s*$/;

/** Kopf + Fragment des zitierten Erlassnamens → Fedlex-Kürzel, über die
 *  bestehenden Erkenner. `Bundesgesetz(es)` ist unspezifisch und braucht das
 *  «über …»-Fragment; jeder andere Kurztitel läuft über den Genitiv-Erkenner
 *  (Nominativ wird dafür in den Genitiv gesetzt: «Arbeitsgesetz» → «…gesetzes»). */
function zielAusIngress(name: string, ueber: string | undefined): FedlexGesetz | null {
  if (/^Bundesgesetz(?:es)?$/.test(name)) {
    return ueber ? erkenneTitelGesetz('Bundesgesetzes', ueber.trim()) : null;
  }
  return erkenneGenitivGesetz(/es$/.test(name) ? name : `${name}es`);
}

describe('V-7c — warum der Name geprüft werden MUSS: Erlassdaten sind mehrdeutig', () => {
  it('mindestens ein Trägergesetz teilt sein Erlassdatum mit einem anderen Erlass', () => {
    // §6.7 lit. a: die Namensprüfung unten wäre ein Tor, das nie greifen kann,
    // WENN Erlassdaten eindeutig wären. Sind sie nicht — und dieser Test hält
    // den Beleg dafür aktuell, statt ihn im Kommentar altern zu lassen.
    // Verschwindet die Kollision eines Tages, wird er rot und sagt, dass die
    // Namensprüfung geprüft werden darf, ob sie noch etwas trägt.
    const jeDatum = new Map<string, string[]>();
    for (const [g, d] of Object.entries(ERLASSDATUM)) {
      if (!d) continue;
      jeDatum.set(d, [...(jeDatum.get(d) ?? []), g]);
    }
    const kollisionen = [...jeDatum.values()].filter((v) => v.length > 1);
    expect(kollisionen.length,
      'kein einziges geteiltes Erlassdatum mehr — die Datumsprüfung allein trüge die Zuordnung wieder')
      .toBeGreaterThan(0);
    // Und konkret: ein ZIEL dieser Tabelle ist betroffen. Das UVG teilt den
    // 20.3.1981 mit dem IRSG; «UVV → IRSG» käme durch die Datumsprüfung
    // glatt durch und scheitert erst am Namen (Rot-Beweis im PR).
    const ziele = [...new Set(TRAEGER_EINTRAEGE.map((e) => String(e.gesetz)))];
    const betroffen = ziele.filter((g) => (jeDatum.get(ERLASSDATUM[g as FedlexGesetz] ?? '') ?? []).length > 1).sort();
    expect(betroffen, 'kein Trägergesetz-Ziel mit geteiltem Erlassdatum').toEqual(['UVG']);
    expect([...(jeDatum.get(ERLASSDATUM.UVG ?? '') ?? [])].sort()).toEqual(['IRSG', 'UVG']);
  });
});

describe('V-7c — der zitierte NAME bestätigt das Ziel (Datums-Kollisionen)', () => {
  it.each(TRAEGER_EINTRAEGE.map((e) => [e.verordnung, e.gesetz] as const))(
    '%s → %s: der Ingress-Name löst auf dasselbe Ziel auf',
    (verordnung, gesetz) => {
      const ingress = ingressVon(verordnung);
      const treffer = [...ingress.matchAll(GESETZ_KLAMMERN)].filter((m) => definiertGesetz(m[1]));
      expect(treffer.length, `${verordnung}: ${treffer.length} «Gesetz»-Klammern`).toBe(1);
      const davor = ingress.slice(0, treffer[0].index);
      const m = ZITIERTER_ERLASS.exec(davor);
      expect(m, `${verordnung}: kein zitierter Erlassname vor der Klammer in «${davor}»`).not.toBeNull();
      expect(zielAusIngress(m![1], m![2]),
        `${verordnung}: Ingress nennt «${m![1]}${m![2] ? ` … ${m![2]}` : ''}», Tabelle sagt ${gesetz}`)
        .toBe(gesetz);
    },
  );
});

// ─── Bestandsprüfung: kein Link auf einen Artikel, den es nicht gibt ─────────
const ART_INTERN = new RegExp(`\\bArt(?:\\.|ikel)\\s+(\\d+(?:[a-z])?${SUFFIX_ALT}?)(?![0-9a-z])`, 'g');
const tokenSatz = (gesetz: FedlexGesetz): Set<string> => {
  const e = erlassVon(gesetz);
  if (!e?.datei) return new Set();
  const snap = JSON.parse(readFileSync(join(WURZEL, 'public', 'normtext', e.datei), 'utf8')) as
    { eintraege?: { artikel: string }[] };
  return new Set((snap.eintraege ?? []).map((x) => artikelToken(String(x.artikel))));
};

describe('V-7c — Bestandsprüfung der neu verlinkten Stellen', () => {
  it('jeder «des Gesetzes»-Link zeigt auf einen Artikel, den der Ziel-Snapshot führt', () => {
    const saetze = new Map<string, Set<string>>();
    const satzVon = (g: FedlexGesetz): Set<string> => {
      if (!saetze.has(g)) saetze.set(g, tokenSatz(g));
      return saetze.get(g)!;
    };
    const fehlt: string[] = [];
    let geprueft = 0;
    for (const eintragTraeger of TRAEGER_EINTRAEGE) {
      const e = erlassVon(eintragTraeger.verordnung)!;
      const snap = JSON.parse(readFileSync(join(WURZEL, 'public', 'normtext', e.datei!), 'utf8')) as
        { eintraege?: { id: string; bloecke?: { text?: string; items?: { text?: string }[] }[] }[] };
      for (const eintrag of snap.eintraege ?? []) {
        const texte: string[] = [];
        for (const b of eintrag.bloecke ?? []) {
          if (b.text) texte.push(b.text);
          for (const it of b.items ?? []) if (it.text) texte.push(it.text);
        }
        for (const t of texte) {
          // Singular-Pfad (Form B).
          let last = 0;
          for (const m of t.matchAll(ART_INTERN)) {
            if ((m.index ?? 0) < last) continue;
            const rest = t.slice((m.index ?? 0) + m[0].length);
            const r = fremdRoutingFormB(rest, m[1], undefined, 'bund', e.key);
            if (!r) continue;
            last = (m.index ?? 0) + m[0].length + r.regionEnd;
            if (r.signal !== 'traeger') continue;
            for (const g of r.glieder) {
              geprueft += 1;
              if (!satzVon(r.gesetz).has(artikelToken(g.roh))) fehlt.push(`${eintrag.id} → ${r.gesetz} Art. ${g.roh}`);
            }
          }
          // Plural-Pfad (A10-Regionen).
          for (const region of artikelnPluralVerweise(t, 'bund', e.key)) {
            if (!region.fremd || region.fremd !== eintragTraeger.gesetz) continue;
            if (!/des Gesetzes/.test(t.slice(region.start, region.end))) continue;
            for (const g of region.glieder) {
              geprueft += 1;
              if (!satzVon(region.fremd).has(artikelToken(g.roh))) fehlt.push(`${eintrag.id} → ${region.fremd} Art. ${g.roh}`);
            }
          }
        }
      }
    }
    expect(geprueft, 'keine einzige «des Gesetzes»-Stelle gefunden — die Messung misst nicht mehr, was sie messen soll').toBeGreaterThan(150);
    expect(fehlt, 'Links auf nicht existierende Ziel-Artikel').toEqual([]);
  });
});

describe('V-7c — was NICHT auflöst (§1)', () => {
  it('ein Erlass ohne Trägergesetz-Eintrag lässt «des Gesetzes» Text bleiben', () => {
    expect(traegergesetzFuerErlass('BANKG')).toBeNull();
    expect(traegergesetzFuerErlass('GSCHG')).toBeNull();
    expect(traegergesetzFuerErlass('LUGUE')).toBeNull();
    expect(fremdRoutingFormB(' 37d des Gesetzes gelten:', '16', undefined, 'bund', 'BANKG')).toBeNull();
  });

  it('ein Zitat-Datum, das dem Trägergesetz widerspricht, sperrt den Link (Zeit-Kante)', () => {
    expect(fremdRoutingFormB(' des Gesetzes vom 1. Januar 1900 ', '15', undefined, 'bund', 'ARGV1')).toBeNull();
    expect(fremdRoutingFormB(' des Gesetzes vom 13. März 1964 ', '15', undefined, 'bund', 'ARGV1')?.gesetz).toBe('ArG');
  });

  it('KKV: «des Gesetzes» ohne Legaldefinition wird Text, nie Self (Restklasse V-7d)', () => {
    // Der KKV-Ingress definiert nur «(KAG)». Gemeint ist in art_128 das KAG —
    // aber ohne Legaldefinition ist der Beleg nicht da, also KEIN Link (§1).
    // Entscheidend: auch kein SELBST-Link. Bis 14.9.2026 sprang der Leser auf
    // KKV Art. 124 bzw. 120, zwei ganz andere Bestimmungen; seither hält der
    // Guard `GESETZES_GENITIV` (NormText.tsx) die Stelle als Text fest.
    expect(traegergesetzFuerErlass('KKV')).toBeNull();
    expect(fremdRoutingFormB(' Absatz 2 des Gesetzes, insbesondere', '124', undefined, 'bund', 'KKV')).toBeNull();
    // Amtlicher Wortlaut beider Stellen, KKV art_128 (SR 951.311, Stand 2025-11-25).
    // Die tokenMap FÜHRT 124 und 120 — ein Self-Link wäre also möglich und war
    // bis 14.9.2026 auch da. Genau das darf nicht mehr passieren.
    const kkv: Ctx = {
      tokenMap: new Map([['124', '124'], ['120', '120']]),
      eigenesKuerzel: 'KKV', registerKuerzel: 'KKV',
      paragrafDesigniert: false, ebene: 'bund', erlassKey: 'KKV',
    };
    for (const [text, nummer] of [
      ['des Vertreters im Sinne von Artikel 124 Absatz 2 des Gesetzes, insbesondere seine Melde-,', '124'],
      ['Informationsaustausch nach Artikel 120 Absatz 2 Buchstabe e des Gesetzes abgeschlossen hat.', '120'],
    ] as const) {
      const treffer = stellenImText(text, kkv, false).filter((st) => st.nummer === nummer);
      expect(treffer.map((st) => st.klasse), `KKV Art. ${nummer}: ${text}`).toEqual(['gesetzes-genitiv']);
    }
  });

  it('«dieses Gesetzes» bleibt ein Selbstverweis, nicht das Trägergesetz', () => {
    expect(fremdRoutingFormB(' dieses Gesetzes beginnt.', '5', undefined, 'bund', 'ARGV1')).toBeNull();
  });

  it('eine Klammer hinter «des Gesetzes» ist das autoritative Signal', () => {
    // Bekanntes Kürzel: die Klammer gewinnt (Form-B-Zweig «klammer»), nicht das
    // Trägergesetz — der Text nennt das Ziel ja ausdrücklich.
    const mitKlammer = fremdRoutingFormB(' des Gesetzes (OR) ', '15', undefined, 'bund', 'ARGV1');
    expect(mitKlammer?.gesetz).toBe('OR');
    expect(mitKlammer?.signal).toBe('klammer');
    // UNBEKANNTES Kürzel: die Klammer widerspricht dem Trägergesetz ⇒ kein Link (§1).
    expect(fremdRoutingFormB(' des Gesetzes (KDSG) ', '15', undefined, 'bund', 'ARGV1')).toBeNull();
  });
});
