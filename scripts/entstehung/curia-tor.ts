// scripts/entstehung/curia-tor.ts — Ziffer (3) des Tors `check:entstehung`: Curia-Zustandsträger
// gegen den Bestand. Aus `check-entstehung.ts` herausgezogen (21.9.2026, QS-KORPUS), damit die
// Prüfungen als reine Funktionen gegen TEMP-Daten rot gezeigt werden können (§6.7) — ein
// Hand-Edit der echten JSONL löste zuerst den sha-Fehler aus und bewiese das falsche Tor.
//
// Drei Prüfungen:
//  · pruefeCuriaBestand   — Zustandsträger ↔ Shards (Verlust, Herkunft, Personendaten, sha,
//                           Publikations-Kreuzprobe, Zähler-Gegenprobe, Nutzungsauflage).
//  · pruefeCuriaSchrumpf  — Zustandsträger ↔ VORSTAND aus git (Schrumpf-Schwelle, Posten
//                           2026-09-21-curia-schrumpf-schwelle-unter-abruf).
//  · bestimmeCuriaVorstand — welcher git-Stand der Vorstand ist (imperativer Rand).
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { CURIA_ZUSTAND_PFAD, type CuriaZustand } from './curia-zustand.ts';
import {
  VERBOTENE_FELDER, CURIA_QUELLENANGABE, AUSZAEHLUNG_HINWEIS, DECISION_CODES,
  serialisiereShard, shaShard, leeresAggregat, type CuriaShard,
} from './curia.ts';

export interface TorErgebnis { fehler: string[]; zeilen: string[] }

/** (3) Curia-Zustandsträger ohne Verlust (E4). `zustand === null` = Etappe noch nicht gelaufen. */
export function pruefeCuriaBestand(dir: string, zustand: CuriaZustand[] | null): TorErgebnis {
  const fehler: string[] = [];
  const zeilen: string[] = [];
  const shards = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')) : [];
  if (zustand === null && shards.length) {
    fehler.push(`${dir} ist befüllt, aber ${CURIA_ZUSTAND_PFAD} fehlt — der Zustandsträger ist der einzige Beleg des Laufs.`);
  }
  if (zustand) {
    // ── DUBLETTE (Nachzug PR #963, Auflage 4): die Maps unten nähmen still die LETZTE Zeile einer
    // doppelten Nummer — eine abweichende erste Zeile bliebe ungeprüft. Der Generator schreibt je
    // Geschäft genau eine Zeile; zwei sind ein Hand-Edit oder ein halber Merge ⇒ ROT.
    for (const [nummer, n] of zaehleDubletten(zustand)) {
      fehler.push(`Curia-Geschäft ${nummer} steht ${n}× im Zustandsträger — Nummer mehrfach; die Prüfungen sähen nur die letzte Zeile (§5). Generator neu laufen lassen, nie von Hand angleichen.`);
    }
    for (const z of zustand) {
      if (!shards.includes(`${z.nummer}.json`)) {
        fehler.push(`Curia-Geschäft ${z.nummer} steht im Zustandsträger, sein Shard fehlt in ${dir} — stiller Verlust (§11.6).`);
      }
    }
    const bekannt = new Set(zustand.map((z) => `${z.nummer}.json`));
    for (const f of shards) {
      if (!bekannt.has(f)) fehler.push(`Curia-Shard ${f} steht nicht im Zustandsträger — Herkunft unbelegt (§7).`);
    }
    // ── (6) PERSONENDATEN-TOR (§11.8, Kritik B1, Entscheid David 11.9.2026 Nr. 2) ──
    // Kein Namensfeld, keine PersonNumber, keine Fraktion, kein Kanton — weder als
    // Schlüssel noch als Wert. Das Tor prüft die AUSGELIEFERTEN Artefakte, nicht bloss
    // die Absicht des Generators: eine künftige Erweiterung, die ein Personenfeld
    // durchreicht, wird hier rot, nicht erst in der Gegenprüfung.
    const zustandJe = new Map(zustand.map((z) => [z.nummer, z]));
    let summenProben = 0;
    let publikationenGesamt = 0;
    let rohGesamt = 0;
    let beschluesseGesamt = 0;
    let vorberatungenGesamt = 0;
    for (const f of shards) {
      const roh = readFileSync(join(dir, f), 'utf8');
      for (const verboten of VERBOTENE_FELDER) {
        if (new RegExp(`"${verboten}"\\s*:`).test(roh)) {
          fehler.push(`Curia-Shard ${f} trägt das Personendaten-Feld «${verboten}» — §11.8 verbietet jede Speicherung von Personendaten.`);
        }
      }
      const shard = JSON.parse(roh) as CuriaShard;
      if (roh !== serialisiereShard(shard)) {
        fehler.push(`Curia-Shard ${f} ist nicht kanonisch serialisiert — von Hand editiert? (Generator neu laufen.)`);
      }
      const z = zustandJe.get(shard.nummer);
      if (z && shaShard(shard) !== z.sha) {
        fehler.push(`Curia-Shard ${f}: sha weicht vom Zustandsträger ab — nachträglich verändert (§7).`);
      }
      // ── PUBLIKATIONS-KREUZPROBE (Befund 21.9.2026, Referenz berichtigt in Runde 2) ──
      // Der Dedupe-Schlüssel von `bauePublikationen` liess amtliche Objective-Zeilen still
      // zusammenfallen. Das Tor rechnet offline gegen — gegen die ROHE Zeilenzahl der
      // amtlichen Antwort, die der Lauf im Zustandsträger mitführt.
      //
      // BERICHTIGUNG (F8, der alte Satz bleibt lesbar): Runde 1 verglich hier gegen
      // `distinkteObjective`, eine zweite Auszählung über DIESELBEN sechs Felder und
      // dieselben Normalisierer wie der Schlüssel. Das war kein zweiter Weg, sondern
      // dieselbe Entscheidung zweimal — beide Wege machten denselben Fehler und der
      // Vergleich blieb grün. Die rohe Zeilenzahl teilt keine unserer Entscheidungen.
      //
      // FAIL-LOUD STATT STILL DEDUPEN (§6.7/§8): Über unseren Bestand ist der Lauf
      // verlustfrei — Vollzensus 21.9.2026, 385 Shards, 2055 rohe Zeilen = 2055
      // vollzeilen-distinkte. Weniger zu speichern als der Endpunkt liefert, ist deshalb
      // ROT. Echte Doppellieferungen gibt es korpusweit (22.417, 26.023, 19.464 — vier
      // Zeilen, keines dieser Geschäfte hat heute einen Shard); bekommt eines je einen,
      // wird dieses Tor rot, und der Fall gehört dann als begründete, im Register geführte
      // Ausnahme hinterlegt — NICHT durch ein Aufweichen dieses Vergleichs erledigt.
      if (z) {
        const roh = z as Partial<CuriaZustand>; // Zeilen aus Läufen vor 21.9.2026 führen die Felder nicht.
        if (typeof roh.publikationen !== 'number' || typeof roh.objectiveZeilen !== 'number') {
          fehler.push(
            `Curia-Geschäft ${shard.nummer}: der Zustandsträger führt «publikationen»/«objectiveZeilen» `
            + 'nicht — die Zeile stammt aus einem Lauf vor der Publikations-Kreuzprobe '
            + '(21.9.2026). Ohne die Zahlen ist eine Kollabierung amtlicher Fundstellen nicht prüfbar, und '
            + 'stillschweigend durchwinken hiesse genau den Fehler decken, den die Probe finden soll. '
            + 'Vollabgleich fällig: npm run materialien:curia -- --datum=$(date +%F)',
          );
        } else {
          if (shard.publikationen.length !== roh.publikationen) {
            fehler.push(
              `Curia-Shard ${f}: ${shard.publikationen.length} Publikation(en) im Shard, aber `
              + `${roh.publikationen} im Zustandsträger — Bestand und Register driften auseinander (§5).`,
            );
          }
          if (shard.publikationen.length !== roh.objectiveZeilen) {
            fehler.push(
              `Curia-Shard ${f}: ${shard.publikationen.length} gespeicherte Publikation(en) ≠ `
              + `${roh.objectiveZeilen} rohe amtliche Objective-Zeile(n) — der Lauf hat `
              + `${roh.objectiveZeilen - shard.publikationen.length} amtliche Zeile(n) zusammenfallen `
              + 'lassen (Curia-Auflage «Die Daten dürfen inhaltlich nicht verändert werden»; §5/§8). '
              + 'ZUERST den Dedupe-Schlüssel in bauePublikationen (scripts/entstehung/curia.ts) gegen '
              + `die Roh-Zeilen des Geschäfts ${shard.nummer} halten: fehlt ihm ein unterscheidendes `
              + 'Feld, ist das der Fehler. NUR falls der Endpunkt dieselbe Zeile wirklich doppelt '
              + 'liefert (korpusweit belegt an 22.417, 26.023, 19.464 — Stand 21.9.2026), ist es eine '
              + 'echte Doppellieferung; die wird dann als begründete Ausnahme im Register belegt, nie '
              + 'durch Aufweichen dieser Prüfung erledigt.',
            );
          }
          publikationenGesamt += shard.publikationen.length;
          rohGesamt += roh.objectiveZeilen;
        }
      }
      // ── ZÄHLER-GEGENPROBE (Posten 2026-09-21-curia-nachbarn Ziff. 3, 21.9.2026) ──
      // Der Zustandsträger führt je Geschäft auch `beschluesse`/`vorberatungen`/
      // `schlussabstimmung`; bis hierher rechnete das Tor sie nie gegen den Shard.
      // REICHWEITE (berichtigt im Nachzug zu PR #963, 21.9.2026, §8): anders als `objectiveZeilen`
      // sind diese Zahlen KEINE unabhängige Referenz. Der Schreiber setzt sie als `.length` der
      // bereits DEDUPLIZIERTEN Arrays, die auch in den Shard gehen (curia-run.ts, `zustand.push`) —
      // die Probe vergleicht also dieselbe Zahl zweimal. Sie fängt Register↔Shard-Drift
      // (nachträglicher Edit einer der beiden Dateien, halber Lauf), NICHT einen Dedupe-Verlust:
      // fällt beim Bauen eine amtliche Zeile zusammen, sinken beide Seiten gemeinsam. Den fängt
      // nur die Schrumpf-Schwelle gegen den Vorstand (pruefeCuriaSchrumpf). Die Zuordnung
      // ist am Schreiber abgelesen, nicht geraten (curia-run.ts, `zustand.push`):
      //   beschluesse       = shard.beschluesse.length
      //   vorberatungen     = shard.kommissionen.length   (NICHT ein Feld «vorberatungen»)
      //   schlussabstimmung = shard.schlussabstimmungen.length > 0
      // Fehlt ein Feld (Zeile aus einem älteren Lauf): laut, nie still als 0 — Muster oben.
      if (z) {
        const roh = z as Partial<CuriaZustand>;
        const soll: [keyof CuriaZustand, number | boolean, number | boolean | undefined][] = [
          ['beschluesse', shard.beschluesse.length, roh.beschluesse],
          ['vorberatungen', shard.kommissionen.length, roh.vorberatungen],
          ['schlussabstimmung', (shard.schlussabstimmungen ?? []).length > 0, roh.schlussabstimmung],
        ];
        for (const [feld, imShard, imZustand] of soll) {
          if (imZustand === undefined || typeof imZustand !== typeof imShard) {
            fehler.push(
              `Curia-Geschäft ${shard.nummer}: der Zustandsträger führt «${feld}» nicht (oder falsch typisiert) — `
              + 'ohne die Zahl ist die Gegenprobe gegen den Shard nicht möglich, und still als 0 lesen hiesse '
              + 'einen Verlust decken. Vollabgleich fällig: npm run materialien:curia -- --datum=$(date +%F)',
            );
          } else if (imZustand !== imShard) {
            fehler.push(
              `Curia-Shard ${f}: «${feld}» ${String(imShard)} im Shard, aber ${String(imZustand)} im Zustandsträger `
              + '— Bestand und Register driften auseinander (§5). Den Generator neu laufen lassen, nie eine der '
              + 'beiden Dateien von Hand angleichen.',
            );
          }
        }
        if (typeof roh.beschluesse === 'number') beschluesseGesamt += roh.beschluesse;
        if (typeof roh.vorberatungen === 'number') vorberatungenGesamt += roh.vorberatungen;
      }
      // Nutzungsauflage der Parlamentsdienste: Quellenangabe + Abrufdatum je Datensatz.
      if (shard.quellenangabe !== CURIA_QUELLENANGABE) {
        fehler.push(`Curia-Shard ${f}: Quellenangabe fehlt oder weicht ab — Nutzungsauflage der Parlamentsdienste (§7c).`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(shard.abgerufen)) {
        fehler.push(`Curia-Shard ${f}: Abrufdatum fehlt oder ist nicht ISO — Nutzungsauflage (§7a).`);
      }
      for (const sa of shard.schlussabstimmungen ?? []) {
        // Summenprobe: die Einzelzähler müssen die Gesamtzahl ergeben — sonst hat ein
        // unbekannter Decision-Code Stimmen verschluckt (Kritik A18).
        const felder = Object.keys(leeresAggregat()).filter((k) => k !== 'total') as (keyof typeof sa.aggregat)[];
        const summe = felder.reduce((n, k) => n + (sa.aggregat[k] ?? 0), 0);
        if (summe !== sa.aggregat.total) {
          fehler.push(`Curia-Shard ${f}: Stimm-Summe ${summe} ≠ total ${sa.aggregat.total} — ein Decision-Code fehlt in der Tabelle (§2).`);
        }
        if (!sa.beschriftung.startsWith(AUSZAEHLUNG_HINWEIS)) {
          fehler.push(`Curia-Shard ${f}: Schlussabstimmung ohne die Pflicht-Beschriftung «${AUSZAEHLUNG_HINWEIS}» (§8/Curia-Auflage).`);
        }
        if (sa.rat !== null && sa.rat !== 'Nationalrat') {
          fehler.push(`Curia-Shard ${f}: Rat «${String(sa.rat)}» behauptet — Voting hat kein Council-Feld, nur der Nationalrat ist über die Grösse belegbar (§8).`);
        }
        summenProben += 1;
      }
    }
    zeilen.push(
      // §8: die Zeile nennt, was sie gemessen hat — gespeicherte gegen rohe amtliche Zeilen.
      // Sie behauptet NICHT, der Bestand sei vollständig: ob der Endpunkt seinerseits alle
      // Fundstellen führt, kann dieses Tor nicht wissen (es hat kein Netz).
      `check:entstehung — Curia: ${zustand.length} Geschäft(e) im Zustandsträger, ${shards.length} Shard(s), keiner fehlt; `
      + `${summenProben} Schlussabstimmung(en) summenrein, ${Object.keys(DECISION_CODES).length} geprüfte Decision-Codes, `
      + `0 Personendaten-Felder; Publikationen ${publikationenGesamt} gespeichert = ${rohGesamt} rohe amtliche `
      + 'Objective-Zeile(n) laut Zustandsträger (keine Zeile ist beim Speichern zusammengefallen); '
      + `Zähler-Gegenprobe Beschlüsse ${beschluesseGesamt} · Vorberatungen ${vorberatungenGesamt} · `
      + 'Schlussabstimmungs-Merker je Shard = Zustandsträger (Register↔Shard-Drift; einen Dedupe-Verlust '
      + 'sieht diese Probe nicht, den prüft die Schrumpf-Schwelle).',
    );
  } else {
    zeilen.push('check:entstehung — Curia: kein Zustandsträger (Etappe E4 noch nicht gelaufen).');
  }
  return { fehler, zeilen };
}

// ── SCHRUMPF-SCHWELLE gegen den Vorstand (Posten 2026-09-21, Auflage 5 zu PR #960) ──────────
// Die Kreuzprobe oben vergleicht gespeichert gegen `objectiveZeilen` DERSELBEN Antwort; liefert
// der Endpunkt einmal zu wenig, sinken beide gemeinsam und sie bleibt grün. Diese Prüfung
// vergleicht darum den Ist-Zustandsträger gegen den zuletzt GEBUCHTEN Stand aus git — ohne zweite
// Baseline-Datei (§5: der Vorstand IST die committete JSONL).
//
// SCHWELLE 0, JE GESCHÄFT UND JE FELD. Gemessen 21.9.2026 über alle Stände der JSONL (71db836ca
// #792 → c967009b9 #960, dazu Monatslauf-PR #939 Kopf 91ce52263): 0 von 385/386 Geschäften mit
// gesunkenem Zähler in beschluesse/vorberatungen, 0 weggefallene Geschäfte; publikationen/
// objectiveZeilen führt nur ein Stand, eine Streuung ist dort nicht messbar. Eine Toleranz wäre
// darum geraten, nicht gemessen; und eine Gesamt-Schwelle verdeckte den Einzelverlust hinter dem
// Zuwachs anderer Geschäfte (dieselbe Kritik A7 wie bei der Deckung, Ziffer 4).
//
// AUSNAHME: eine tatsächlich zurücknehmende Amtsquelle wird in einer eigenen, datierten Datei
// belegt (CURIA_SCHRUMPF_AUSNAHMEN_PFAD, erst anlegen, wenn der Fall eintritt) — NIE im
// Zustandsträger, den der Generator bei jedem Lauf komplett neu schreibt (eine Notiz dort ginge
// im nächsten Lauf still verloren, und Mensch-Entscheid und Maschinen-Messung lägen in einer Datei).
// Ein Eintrag nennt den EXAKTEN Übergang (nummer, feld, vorher, nachher); nach der Landung ist der
// Vorstand der neue Wert und der Eintrag wirkungslos (wird als «ohne Wirkung» gezählt).
export const CURIA_SCHRUMPF_AUSNAHMEN_PFAD = 'bibliothek/register/curia-schrumpf-ausnahmen.json';

/** Die geprüften Zahlfelder (Reihenfolge = Ausgabe). */
export const SCHRUMPF_FELDER = ['objectiveZeilen', 'publikationen', 'beschluesse', 'vorberatungen'] as const;
type SchrumpfFeld = typeof SCHRUMPF_FELDER[number] | 'schlussabstimmung' | 'geschaeft';

export interface CuriaSchrumpfAusnahme {
  nummer: string;
  feld: SchrumpfFeld;
  /** Wert im Vorstand bzw. Ist (bei feld 'geschaeft' entfallen beide). */
  vorher?: number | boolean;
  nachher?: number | boolean;
  /** ISO-Datum des Belegs. */
  seit: string;
  /** Beleg an der Amtsquelle (nicht leer). */
  grund: string;
}

export type CuriaVorstand =
  | { art: 'stand'; basis: string; herleitung: string; zustand: CuriaZustand[] | null }
  | { art: 'unveraendert'; herleitung: string }
  | { art: 'unbestimmbar'; grund: string };

/** Nummern, die mehr als einmal vorkommen, mit Anzahl (Reihenfolge des ersten Auftretens). */
function zaehleDubletten(zustand: readonly CuriaZustand[]): [string, number][] {
  const n = new Map<string, number>();
  for (const z of zustand) n.set(z.nummer, (n.get(z.nummer) ?? 0) + 1);
  return [...n].filter(([, k]) => k > 1);
}

function parseJsonl(text: string): CuriaZustand[] {
  return text.split('\n').filter((z) => z.trim()).map((z) => JSON.parse(z) as CuriaZustand);
}

/**
 * Reine Prüfung: sinkt ein Zähler oder fällt ein Geschäft weg ⇒ Fehler, ausser eine gültige Ausnahme
 * nennt den Übergang. `ist === null` = der Ist-Zustandsträger fehlt: führt der Vorstand Geschäfte, ist
 * das ein Totalverlust (ROT); führt auch er keine, ist es der legitime Erstfall (vor E4).
 */
export function pruefeCuriaSchrumpf(
  vorstand: CuriaVorstand,
  ist: readonly CuriaZustand[] | null,
  ausnahmen: readonly CuriaSchrumpfAusnahme[] = [],
): TorErgebnis {
  const fehler: string[] = [];
  if (vorstand.art === 'unbestimmbar') {
    return {
      fehler: [
        `Curia-Schrumpf-Schwelle: Vorstand nicht bestimmbar — ${vorstand.grund} Ohne Vorstand bliebe ein `
        + 'globaler Unter-Abruf unsichtbar; das Tor wird darum NICHT still grün (§6.7). Abhilfe: '
        + '`git fetch origin main` (flacher Klon: `git fetch --unshallow` bzw. `fetch-depth: 0`) oder die Basis '
        + 'ausdrücklich setzen: CURIA_VORSTAND_BASIS=<commit> npm run check:entstehung — <commit> muss der Stand '
        + 'VOR dem geprüften sein (ein echter Vorfahr von HEAD; HEAD selbst nur, solange der Zustandsträger '
        + 'ungebucht geändert ist), sonst vergleicht das Tor den Stand mit sich selbst.',
      ],
      zeilen: [],
    };
  }
  if (vorstand.art === 'unveraendert') {
    return { fehler, zeilen: [`check:entstehung — Curia-Schrumpf-Schwelle: nicht verglichen — ${vorstand.herleitung}`] };
  }
  // ── TOTALVERLUST (Nachzug PR #963, Auflage 2): fehlt der Ist-Zustandsträger (z. B. JSONL und
  // Shards zusammen gelöscht), schwieg das Tor vorher ganz — pruefeCuriaBestand sieht ohne Shards
  // nichts, und die Schrumpf-Schwelle lief nur bei vorhandenem Ist. Der Vorstand entscheidet.
  if (ist === null) {
    const n = vorstand.zustand?.length ?? 0;
    if (n > 0) {
      return {
        fehler: [
          `Curia-Schrumpf-Schwelle: Totalverlust — der Vorstand ${vorstand.basis} (${vorstand.herleitung}) führt `
          + `${n} Geschäft(e), der Ist-Zustandsträger ${CURIA_ZUSTAND_PFAD} fehlt. Ein ausgefallener oder `
          + 'abgebrochener Lauf darf den Bestand nicht still löschen (§11.6). Generator neu laufen lassen '
          + '(npm run materialien:curia) bzw. die Löschung zurücknehmen.',
        ],
        zeilen: [],
      };
    }
    return {
      fehler,
      zeilen: [`check:entstehung — Curia-Schrumpf-Schwelle: Erstfall — weder der Vorstand ${vorstand.basis} noch der Arbeitsbaum führt Curia-Geschäfte (Etappe E4 noch nicht gelaufen).`],
    };
  }
  if (vorstand.zustand === null) {
    return {
      fehler,
      zeilen: [`check:entstehung — Curia-Schrumpf-Schwelle: Vorstand ${vorstand.basis} (${vorstand.herleitung}) führt keinen Zustandsträger — nichts zu vergleichen.`],
    };
  }
  const gueltig = ausnahmen.filter((a) => typeof a.grund === 'string' && a.grund.trim() !== ''
    && typeof a.seit === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.seit));
  const benutzt = new Set<CuriaSchrumpfAusnahme>();
  const ausgenommen = (nummer: string, feld: SchrumpfFeld, vorher?: number | boolean, nachher?: number | boolean): boolean => {
    const a = gueltig.find((x) => x.nummer === nummer && x.feld === feld
      && (feld === 'geschaeft' || (x.vorher === vorher && x.nachher === nachher)));
    if (a) benutzt.add(a);
    return a !== undefined;
  };
  const istJe = new Map(ist.map((z) => [z.nummer, z]));
  let verglichen = 0;
  const nichtVergleichbar: Record<string, number> = {};
  let gesunken = 0;
  for (const v of vorstand.zustand) {
    const i = istJe.get(v.nummer);
    if (!i) {
      if (!ausgenommen(v.nummer, 'geschaeft')) {
        gesunken += 1;
        fehler.push(
          `Curia-Geschäft ${v.nummer} steht im Vorstand (${vorstand.basis}), fehlt aber im Ist-Zustandsträger — `
          + 'ein Geschäft ist weggefallen (Schrumpfen, Posten 2026-09-21). Zuerst den Abruf prüfen (Teil-Ausfall, '
          + `Filter); nimmt die Amtsquelle es belegt zurück, gehört der Fall datiert nach ${CURIA_SCHRUMPF_AUSNAHMEN_PFAD}.`,
        );
      }
      continue;
    }
    verglichen += 1;
    const vr = v as Partial<CuriaZustand>;
    const ir = i as Partial<CuriaZustand>;
    for (const feld of SCHRUMPF_FELDER) {
      const a = vr[feld];
      const b = ir[feld];
      if (typeof a !== 'number') { nichtVergleichbar[feld] = (nichtVergleichbar[feld] ?? 0) + 1; continue; }
      if (typeof b !== 'number') {
        gesunken += 1;
        fehler.push(`Curia-Geschäft ${v.nummer}: «${feld}» steht im Vorstand (${a}), fehlt aber im Ist-Zustandsträger — ein Feld ist verloren gegangen.`);
        continue;
      }
      if (b < a && !ausgenommen(v.nummer, feld, a, b)) {
        gesunken += 1;
        fehler.push(
          `Curia-Geschäft ${v.nummer}: «${feld}» sinkt von ${a} (Vorstand ${vorstand.basis}) auf ${b} — `
          + 'die Kreuzprobe gegen objectiveZeilen kann einen Unter-Abruf nicht sehen, weil beide Zahlen aus derselben '
          + 'Antwort stammen. Zuerst den Lauf wiederholen bzw. den Endpunkt für dieses Geschäft prüfen; nimmt die '
          + `Amtsquelle belegt zurück, den exakten Übergang datiert in ${CURIA_SCHRUMPF_AUSNAHMEN_PFAD} eintragen.`,
        );
      }
    }
    if (v.schlussabstimmung === true && i.schlussabstimmung !== true
      && !ausgenommen(v.nummer, 'schlussabstimmung', true, i.schlussabstimmung)) {
      gesunken += 1;
      fehler.push(`Curia-Geschäft ${v.nummer}: Schlussabstimmung im Vorstand (${vorstand.basis}) vorhanden, im Ist nicht mehr — Schrumpfen.`);
    }
  }
  const nv = Object.entries(nichtVergleichbar).map(([k, n]) => `${k} ${n}×`).join(', ');
  // Dubletten im VORSTAND sind historisch (gebucht) und nicht mehr zu heilen — gemeldet, nicht ROT;
  // jede Zeile wird gegen das Ist verglichen (streng: keine darf sinken). Im Ist ROT (pruefeCuriaBestand).
  const vorstandDubletten = zaehleDubletten(vorstand.zustand).map(([nr]) => nr);
  const ohneWirkung = gueltig.length - benutzt.size;
  return {
    fehler,
    zeilen: [
      `check:entstehung — Curia-Schrumpf-Schwelle (0 je Geschäft und Feld): Vorstand ${vorstand.basis} `
      + `(${vorstand.herleitung}), ${vorstand.zustand.length} Geschäft(e) im Vorstand, ${verglichen} verglichen, `
      + `${gesunken} Absenkung(en)/Wegfall; ${benutzt.size} Ausnahme(n) greifen`
      + (ohneWirkung ? `, ${ohneWirkung} ohne Wirkung (entfernen)` : '')
      + (ausnahmen.length - gueltig.length ? `, ${ausnahmen.length - gueltig.length} ungültig (ohne seit/grund, ignoriert)` : '')
      + (nv ? `; nicht vergleichbar, weil der Vorstand das Feld nicht führt: ${nv}` : '')
      + (vorstandDubletten.length
        ? `; Vorstand führt ${vorstandDubletten.length} Nummer(n) mehrfach: ${vorstandDubletten.join(', ')} (historisch, jede Zeile verglichen)`
        : '') + '.',
    ],
  };
}

type Git = (args: string[]) => string | null;
const echtesGit: Git = (args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
};

/**
 * Bestimmt den Vorstand (imperativer Rand, liest git). Reihenfolge:
 *  1. CURIA_VORSTAND_BASIS gesetzt ⇒ genau dieser Commit (muss existieren, sonst unbestimmbar).
 *     Er muss ein echter Vorfahr von HEAD sein; HEAD selbst nur bei ungebucht geändertem
 *     Zustandsträger (sonst Selbstvergleich) — beides sonst unbestimmbar (ROT).
 *  2. B = merge-base(origin/main, HEAD). B ≠ HEAD ⇒ Vorstand B (Branch lokal, pull_request =
 *     Merge-Commit auf main, merge_group = Queue-Commit auf main). NICHT HEAD: steht die JSONL
 *     im eigenen Commit, wäre HEAD schon der geschrumpfte Stand.
 *  3. B = HEAD (Arbeitsbaum steht auf main): weicht die JSONL im Arbeitsbaum von HEAD ab
 *     (Monatslauf: Generator schreibt, nichts ist committet; lokaler Lauf auf main) ⇒ Vorstand HEAD.
 *  4. B = HEAD und Arbeitsbaum = HEAD (push auf main): Vorstand HEAD^1 — der Stand vor dem
 *     gelandeten Commit. Fehlt HEAD^1 (flacher Klon, z. B. die übrigen Monats-Jobs mit Default-
 *     Checkout), gibt es in diesem Lauf nichts, was geschrumpft sein könnte; das wird als
 *     «nicht verglichen» mit Grund ausgewiesen — der gelandete Commit selbst wurde in PR/Queue
 *     mit fetch-depth 0 geprüft.
 *  Fehlt origin/main oder HEAD ⇒ unbestimmbar (ROT, nie still grün).
 */
export function bestimmeCuriaVorstand(
  env: Record<string, string | undefined> = process.env,
  git: Git = echtesGit,
  pfad: string = CURIA_ZUSTAND_PFAD,
): CuriaVorstand {
  const commit = (ref: string): string | null => git(['rev-parse', '--verify', '--quiet', `${ref}^{commit}`])?.trim() || null;
  const lies = (basis: string, herleitung: string): CuriaVorstand => {
    const text = git(['cat-file', '-e', `${basis}:${pfad}`]) === null ? null : git(['show', `${basis}:${pfad}`]);
    return { art: 'stand', basis: basis.slice(0, 9), herleitung, zustand: text === null ? null : parseJsonl(text) };
  };
  const zustandImArbeitsbaum = (): string | null => (existsSync(pfad) ? readFileSync(pfad, 'utf8') : null);
  const zustandIn = (c: string): string | null => (git(['cat-file', '-e', `${c}:${pfad}`]) === null ? null : git(['show', `${c}:${pfad}`]));
  const explizit = env.CURIA_VORSTAND_BASIS?.trim();
  const head = commit('HEAD');
  if (explizit) {
    const c = commit(explizit);
    if (!c) return { art: 'unbestimmbar', grund: `CURIA_VORSTAND_BASIS=${explizit} ist kein Commit in diesem Klon.` };
    if (!head) return { art: 'unbestimmbar', grund: 'HEAD ist kein Commit (kein git-Arbeitsbaum?).' };
    // Nachzug PR #963, Auflage 3: die Basis muss der Stand VOR dem geprüften sein. Basis = HEAD ist
    // nur legitim, solange der Zustandsträger UNGEBUCHT geändert ist (manueller Monatslauf, wie der
    // automatische Ast 3); bei gebuchtem Stand wäre es ein Selbstvergleich, der jede Schrumpfung
    // übersieht. Jede andere Basis muss ein echter Vorfahr von HEAD sein.
    if (c === head) {
      if (zustandImArbeitsbaum() === zustandIn(head)) {
        return {
          art: 'unbestimmbar',
          grund: `CURIA_VORSTAND_BASIS=${explizit} ist HEAD, und der Zustandsträger ist gebucht (Arbeitsbaum = HEAD) — `
            + 'ein Selbstvergleich, der jede Schrumpfung übersähe.',
        };
      }
      return lies(c, `CURIA_VORSTAND_BASIS=${explizit} (= HEAD, Zustandsträger ungebucht geändert)`);
    }
    if (git(['merge-base', '--is-ancestor', c, head]) === null) {
      return { art: 'unbestimmbar', grund: `CURIA_VORSTAND_BASIS=${explizit} ist kein echter Vorfahr von HEAD.` };
    }
    return lies(c, `CURIA_VORSTAND_BASIS=${explizit}`);
  }
  if (!head) return { art: 'unbestimmbar', grund: 'HEAD ist kein Commit (kein git-Arbeitsbaum?).' };
  if (!commit('origin/main')) {
    return { art: 'unbestimmbar', grund: 'origin/main fehlt in diesem Klon (flacher Checkout eines PR-/Queue-Refs?).' };
  }
  const mb = git(['merge-base', 'origin/main', 'HEAD'])?.trim();
  if (!mb) return { art: 'unbestimmbar', grund: 'merge-base(origin/main, HEAD) nicht bildbar (flacher Klon ohne gemeinsame Geschichte?).' };
  if (mb !== head) return lies(mb, 'merge-base(origin/main, HEAD)');
  const arbeitsbaum = zustandImArbeitsbaum();
  const imHead = zustandIn('HEAD');
  if (arbeitsbaum !== imHead) return lies(head, 'HEAD — Arbeitsbaum steht auf main, Zustandsträger ungebucht geändert (Monatslauf)');
  const vorgaenger = commit('HEAD^1');
  if (vorgaenger) return lies(vorgaenger, 'HEAD^1 — Arbeitsbaum = HEAD auf main (push), Vorstand = Stand vor dem gelandeten Commit');
  return {
    art: 'unveraendert',
    herleitung: 'Arbeitsbaum = HEAD auf main, HEAD^1 fehlt (flacher Klon) — dieser Lauf ändert den Zustandsträger nicht; '
      + 'den gelandeten Commit hat die PR-/Queue-CI (fetch-depth 0) gegen seinen Vorstand geprüft.',
  };
}

/** Liest die Ausnahme-Datei, falls vorhanden (fehlend = keine Ausnahmen). */
export function leseCuriaSchrumpfAusnahmen(pfad = CURIA_SCHRUMPF_AUSNAHMEN_PFAD): CuriaSchrumpfAusnahme[] {
  return existsSync(pfad) ? (JSON.parse(readFileSync(pfad, 'utf8')) as CuriaSchrumpfAusnahme[]) : [];
}
