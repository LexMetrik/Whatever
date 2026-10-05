// ─── LIK-Nachzug: Bot-Tor «nur Anfügung» + Gegenlesung (MONITOR, 5.10.2026) ──
//
// Reiner Kern (keine I/O) für scripts/lik/vergleich.ts. Vergleicht drei Stände
// der LIK-Monatsreihen:
//   alt   — LIK_REIHEN aus dem committeten src/data/likReihe.ts (HEAD)
//   neu   — LIK_REIHEN aus dem frisch generierten src/data/likReihe.ts
//   xlsx  — unabhängige Neu-Einlesung der BFS-XLSX (scripts/lik/neu-einlesen.py)
//
// Warum ein eigenes Tor: Indexmieten und indexierte Renten rechnen mit
// BESTEHENDEN Monatswerten. Ändert das BFS einen publizierten Wert (Revision,
// Rebasierung) oder verrutscht eine Spalte im Generator, wäre ein still
// gemergter Nachzug eine Rechtsänderung am Ergebnis alter Fälle. Darum gilt:
// nur reine Anfügung neuer Monate am Reihenende ergibt einen normalen PR;
// alles andere einen ENTWURF mit Begründung (Status «pruefen»).

export type Reihen = Record<string, Record<string, number>>;

/** Basen, die der Generator bewusst NICHT übernimmt (vor der Originalbasis Sep. 1966). */
export const BEWUSST_NICHT_UEBERNOMMEN: readonly string[] = ['1914-06', '1939-08'];

// ─── Plausibilität NEUER Werte (Gegenprüfung 5.10.2026, Befund 1) ──────────────
// Das Tor «nur Anfügung» schützt Bestandswerte; ein angefügter Wert selbst war
// ungeprüft (Probe: 10.15 statt ~101.5 oder alle Basen +50 % ⇒ normaler PR).
// Die Schwellen stammen aus einer Messung über die ganze Reihe (src/data/likReihe.ts,
// Stand bis 2026-09, Messung 5.10.2026) und liegen bewusst rund doppelt so hoch wie
// das Maximum — sie fangen Tipp-, Spalten- und Skalenfehler, keine echte Teuerung.

/** Grösster zulässiger Monatssprung (|Wert/Vormonat − 1|) derselben Basis. Gemessen max. 2.10 % (Basis 1966-09, 1973-11). */
export const MAX_MONATSSPRUNG = 0.03;

/**
 * Grösste zulässige Abweichung (Indexpunkte, Einheit der ÄLTEREN Basis) des neuen Monats
 * zwischen Nachbarbasen nach Umrechnung. Umrechnungsfaktor = Mittel der Quotienten
 * ältere/jüngere Basis über alle gemeinsamen Monate des BISHERIGEN Stands (robust gegen die
 * Rundung eines einzelnen Basismonats). Gemessen max. 0.135 Pkt (1966-09/1977-09) bzw.
 * 0.13 Pkt (Prüfer, alle übrigen Paare ≤ 0.114).
 */
export const MAX_BASISABWEICHUNG = 0.3;

export interface Wert {
  basis: string;
  monat: string;
  wert: number;
}
export interface Aenderung {
  basis: string;
  monat: string;
  alt: number;
  neu: number;
}
export interface Abweichung {
  basis: string;
  monat: string;
  generator: number | null;
  xlsx: number | null;
}

export interface Sprung {
  basis: string;
  monat: string;
  vormonat: string;
  vorwert: number;
  wert: number;
}
export interface Basisabweichung {
  /** Ältere der beiden Nachbarbasen (Einheit der Abweichung). */
  basisAlt: string;
  basisNeu: string;
  monat: string;
  /** Wert der älteren Basis laut Generator. */
  wert: number;
  /** Aus der jüngeren Basis umgerechneter Wert. */
  umgerechnet: number;
  abweichung: number;
}

export interface LikVergleich {
  status: 'keine' | 'anfuegung' | 'pruefen';
  angefuegt: Wert[];
  geaendert: Aenderung[];
  entfernt: Wert[];
  /** Neue Monate, die NICHT nach dem bisherigen Reihenende liegen. */
  eingefuegt: Wert[];
  /** Neue Monate mit Lücke zum bisherigen Reihenende (Basis, erwarteter Monat). */
  luecken: Array<{ basis: string; erwartet: string; gefunden: string }>;
  neueBasen: string[];
  entfernteBasen: string[];
  gegenlesung: { geprueft: number; abweichungen: Abweichung[]; unbekannteBasen: string[] };
  /** Plausibilität (a): angefügte Werte mit Monatssprung > MAX_MONATSSPRUNG. */
  spruenge: Sprung[];
  /** Plausibilität (b): angefügte Monate, die zwischen Nachbarbasen > MAX_BASISABWEICHUNG abweichen. */
  basisabweichungen: Basisabweichung[];
  /** Plausibilität (c): Basis führt den Vormonat eines neuen Monats, liefert diesen aber nicht. */
  teillieferung: Array<{ basis: string; monat: string }>;
  gruende: string[];
}

const zahl = (v: number | null): string => (v === null ? '—' : v.toFixed(1));

function folgemonat(m: string): string {
  const [j, mo] = m.split('-').map(Number);
  return mo === 12 ? `${j + 1}-01` : `${j}-${String(mo + 1).padStart(2, '0')}`;
}
function vormonat(m: string): string {
  const [j, mo] = m.split('-').map(Number);
  return mo === 1 ? `${j - 1}-12` : `${j}-${String(mo - 1).padStart(2, '0')}`;
}

/** Plausibilität der angefügten Werte (a) Monatssprung, (b) Basisinvarianz, (c) Teil-Lieferung. */
function plausibilitaet(
  alt: Reihen,
  neu: Reihen,
  angefuegt: Wert[],
): Pick<LikVergleich, 'spruenge' | 'basisabweichungen' | 'teillieferung'> {
  const spruenge: Sprung[] = [];
  for (const w of angefuegt) {
    const vor = Object.keys(neu[w.basis]).filter((m) => m < w.monat).sort().at(-1);
    if (vor === undefined) continue;
    const vorwert = neu[w.basis][vor];
    if (Math.abs(w.wert / vorwert - 1) > MAX_MONATSSPRUNG)
      spruenge.push({ basis: w.basis, monat: w.monat, vormonat: vor, vorwert, wert: w.wert });
  }

  const neueMonate = [...new Set(angefuegt.map((w) => w.monat))].sort();
  // Nachbarbasen: beide im bisherigen UND neuen Stand (neue/entfallene Basen sind schon eigener Grund).
  const basen = Object.keys(alt).filter((b) => b in neu).sort();
  const basisabweichungen: Basisabweichung[] = [];
  for (let i = 0; i + 1 < basen.length; i++) {
    const [ba, bn] = [basen[i], basen[i + 1]];
    const gemeinsam = Object.keys(alt[bn]).filter((m) => m in alt[ba]);
    if (!gemeinsam.length) continue;
    const faktor = gemeinsam.reduce((s, m) => s + alt[ba][m] / alt[bn][m], 0) / gemeinsam.length;
    for (const monat of neueMonate) {
      if (monat in alt[ba] && monat in alt[bn]) continue; // nur neu angefügte Monate
      if (!(monat in neu[ba]) || !(monat in neu[bn])) continue; // Teil-Lieferung: Grund (c)
      const umgerechnet = neu[bn][monat] * faktor;
      const abweichung = Math.abs(umgerechnet - neu[ba][monat]);
      if (abweichung > MAX_BASISABWEICHUNG)
        basisabweichungen.push({ basisAlt: ba, basisNeu: bn, monat, wert: neu[ba][monat], umgerechnet, abweichung });
    }
  }

  const teillieferung: LikVergleich['teillieferung'] = [];
  for (const monat of neueMonate)
    for (const basis of Object.keys(neu).sort())
      if (vormonat(monat) in neu[basis] && !(monat in neu[basis])) teillieferung.push({ basis, monat });

  return { spruenge, basisabweichungen, teillieferung };
}

export function vergleicheLik(alt: Reihen, neu: Reihen, xlsx: Reihen): LikVergleich {
  const angefuegt: Wert[] = [];
  const geaendert: Aenderung[] = [];
  const entfernt: Wert[] = [];
  const eingefuegt: Wert[] = [];
  const luecken: LikVergleich['luecken'] = [];
  const neueBasen = Object.keys(neu).filter((b) => !(b in alt)).sort();
  const entfernteBasen = Object.keys(alt).filter((b) => !(b in neu)).sort();

  for (const basis of Object.keys(alt).sort()) {
    const a = alt[basis];
    const n = neu[basis] ?? {};
    for (const monat of Object.keys(a).sort()) {
      if (!(monat in n)) entfernt.push({ basis, monat, wert: a[monat] });
      else if (n[monat] !== a[monat]) geaendert.push({ basis, monat, alt: a[monat], neu: n[monat] });
    }
    const altMonate = Object.keys(a).sort();
    const ende = altMonate[altMonate.length - 1] ?? '';
    let erwartet = ende ? folgemonat(ende) : '';
    for (const monat of Object.keys(n).sort()) {
      if (monat in a) continue;
      const w = { basis, monat, wert: n[monat] };
      if (ende && monat <= ende) {
        eingefuegt.push(w);
        continue;
      }
      if (erwartet && monat !== erwartet) luecken.push({ basis, erwartet, gefunden: monat });
      erwartet = folgemonat(monat);
      angefuegt.push(w);
    }
  }

  // Gegenlesung: jeder Generator-Wert gegen die XLSX und umgekehrt (je übernommene Basis).
  const abweichungen: Abweichung[] = [];
  let geprueft = 0;
  for (const basis of Object.keys(neu).sort()) {
    const g = neu[basis];
    const x = xlsx[basis] ?? {};
    const monate = [...new Set([...Object.keys(g), ...Object.keys(x)])].sort();
    for (const monat of monate) {
      geprueft++;
      const gw = monat in g ? g[monat] : null;
      const xw = monat in x ? x[monat] : null;
      if (gw !== xw) abweichungen.push({ basis, monat, generator: gw, xlsx: xw });
    }
  }
  const unbekannteBasen = Object.keys(xlsx)
    .filter((b) => !(b in neu) && !BEWUSST_NICHT_UEBERNOMMEN.includes(b))
    .sort();

  const { spruenge, basisabweichungen, teillieferung } = plausibilitaet(alt, neu, angefuegt);

  const gruende: string[] = [];
  if (geaendert.length) gruende.push(`${geaendert.length} Bestandswert(e) geändert`);
  if (entfernt.length) gruende.push(`${entfernt.length} Bestandswert(e) entfernt`);
  if (eingefuegt.length) gruende.push(`${eingefuegt.length} Wert(e) vor dem bisherigen Reihenende eingefügt`);
  if (luecken.length) gruende.push(`${luecken.length} Lücke(n) zwischen Reihenende und neuen Monaten`);
  if (neueBasen.length) gruende.push(`neue Basis/Basen: ${neueBasen.join(', ')}`);
  if (entfernteBasen.length) gruende.push(`entfernte Basis/Basen: ${entfernteBasen.join(', ')}`);
  if (abweichungen.length)
    gruende.push(`${abweichungen.length} Abweichung(en) Generator ↔ unabhängige Neu-Einlesung`);
  if (unbekannteBasen.length)
    gruende.push(`XLSX trägt Basis/Basen, die der Generator nicht kennt: ${unbekannteBasen.join(', ')}`);

  if (spruenge.length) {
    const s = spruenge[0];
    gruende.push(
      `${spruenge.length} neue(r) Wert(e) mit Monatssprung > ${MAX_MONATSSPRUNG * 100} % ` +
        `(z. B. Basis ${s.basis}: ${s.vormonat} ${zahl(s.vorwert)} → ${s.monat} ${zahl(s.wert)})`,
    );
  }
  if (basisabweichungen.length) {
    const b = basisabweichungen[0];
    gruende.push(
      `${basisabweichungen.length} Verletzung(en) der Basisinvarianz > ${MAX_BASISABWEICHUNG} Punkte ` +
        `(z. B. ${b.monat}: Basis ${b.basisAlt} ${zahl(b.wert)}, aus Basis ${b.basisNeu} umgerechnet ${b.umgerechnet.toFixed(2)})`,
    );
  }
  if (teillieferung.length) {
    const monate = [...new Set(teillieferung.map((t) => t.monat))].join(', ');
    gruende.push(
      `neuer Monat ${monate} nicht in allen Basen geliefert, die den Vormonat führen ` +
        `(fehlt in: ${teillieferung.map((t) => t.basis).join(', ')})`,
    );
  }

  const status = gruende.length ? 'pruefen' : angefuegt.length ? 'anfuegung' : 'keine';
  return {
    status,
    angefuegt,
    geaendert,
    entfernt,
    eingefuegt,
    luecken,
    neueBasen,
    entfernteBasen,
    gegenlesung: { geprueft, abweichungen, unbekannteBasen },
    spruenge,
    basisabweichungen,
    teillieferung,
    gruende,
  };
}

const KAPPE = 60;

/** Beleg-Abschnitt für den PR-Body (Markdown). */
export function belegMarkdown(v: LikVergleich, xlsx: Reihen): string {
  const z: string[] = [];
  z.push(`**Bot-Tor «nur Anfügung»:** ${v.status === 'pruefen' ? 'NICHT erfüllt' : 'erfüllt'}`);
  if (v.gruende.length) {
    z.push('', '> **Achtung — Bestandswert geändert = rechtsrelevant für Indexmieten und indexierte Beträge.**');
    z.push('> Dieser PR bleibt Entwurf, bis eine Session die Ursache gegen die BFS-Publikation geklärt hat.');
    for (const g of v.gruende) z.push(`> - ${g}`);
  }
  z.push(
    '',
    `**Gegenlesung:** ${v.gegenlesung.geprueft} Werte der generierten Reihe gegen eine unabhängige Neu-Einlesung ` +
      `der BFS-XLSX (zipfile/XML, Spalten aus der Kopfzeile, Rundung HALF_UP) verglichen — ` +
      `${v.gegenlesung.abweichungen.length} Abweichung(en).`,
  );
  if (v.angefuegt.length) {
    z.push('', '| Basis | Monat | Generator | Neu-Einlesung |', '|---|---|---|---|');
    for (const w of v.angefuegt.slice(0, KAPPE))
      z.push(`| ${w.basis} | ${w.monat} | ${zahl(w.wert)} | ${zahl(xlsx[w.basis]?.[w.monat] ?? null)} |`);
    if (v.angefuegt.length > KAPPE) z.push(`| … | ${v.angefuegt.length - KAPPE} weitere | | |`);
  }
  if (v.geaendert.length) {
    z.push('', '**Geänderte Bestandswerte**', '', '| Basis | Monat | bisher | neu |', '|---|---|---|---|');
    for (const a of v.geaendert.slice(0, KAPPE)) z.push(`| ${a.basis} | ${a.monat} | ${zahl(a.alt)} | ${zahl(a.neu)} |`);
    if (v.geaendert.length > KAPPE) z.push(`| … | ${v.geaendert.length - KAPPE} weitere | | |`);
  }
  if (v.entfernt.length) {
    z.push('', '**Entfernte Bestandswerte**', '', '| Basis | Monat | bisher |', '|---|---|---|');
    for (const w of v.entfernt.slice(0, KAPPE)) z.push(`| ${w.basis} | ${w.monat} | ${zahl(w.wert)} |`);
  }
  if (v.gegenlesung.abweichungen.length) {
    z.push('', '**Abweichungen Generator ↔ Neu-Einlesung**', '', '| Basis | Monat | Generator | Neu-Einlesung |', '|---|---|---|---|');
    for (const a of v.gegenlesung.abweichungen.slice(0, KAPPE))
      z.push(`| ${a.basis} | ${a.monat} | ${zahl(a.generator)} | ${zahl(a.xlsx)} |`);
  }
  return z.join('\n');
}
