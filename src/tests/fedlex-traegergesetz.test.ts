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
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  TRAEGER_EINTRAEGE, artikelToken, fremdRoutingFormB, artikelnPluralVerweise,
  traegergesetzFuerErlass, SUFFIX_ALT, type FedlexGesetz,
} from '../lib/fedlex';
import { ERLASSDATUM } from '../lib/fedlex/positivliste';

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

/** Alle Klammern des Ingresses, die die Kurzform «Gesetz» definieren. */
const GESETZ_KLAMMERN = /\(([^()]*)\)/g;
const definiertGesetz = (inhalt: string): boolean =>
  inhalt.split(/[,/;]/).map((s) => s.trim()).includes('Gesetz');

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
