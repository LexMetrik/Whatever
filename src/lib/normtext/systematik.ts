// ─── Systematik des Bundesrechts (Auftrag David 20.6.2026) ──────────────────
//
// Eine FUNKTIONALE Gliederung statt der reinen SR-Nummernfolge: vom Fundament
// (Verfassung) über das Verhältnis Bürger↔Bürger (Privatrecht + dessen
// Durchsetzung) und Bürger↔Staat (Verwaltungsrecht) bis zum internationalen
// Rahmen. Vorbild: Davids «Systematik des Rechts».
//
// Reine ANZEIGE-Ordnung (kein Norminhalt, §7 unberührt): jede Untergruppe
// referenziert bestehende Register-Erlasse über ihren `key`. Erlasse, die hier
// (noch) nicht zugeordnet sind, fallen in der Gesetze-Seite in «Weitere
// Erlasse» — so geht nie ein Eintrag verloren. Praktikabilität: die geläufigen
// Leitgesetze stehen in den oberen Kategorien/Gruppen; selteneres weiter unten.

interface SystematikGruppe {
  id: string;
  titel: string;
  /** Register-Keys (UPPERCASE wie in register.ts) in Anzeige-Reihenfolge. */
  keys: string[];
}

interface SystematikKategorie {
  nr: string;        // '01' …
  id: string;
  titel: string;
  lede: string;
  /** Praktikabilität: die geläufigsten Kategorien sind anfangs offen. */
  standardOffen?: boolean;
  gruppen: SystematikGruppe[];
}

export const SYSTEMATIK: SystematikKategorie[] = [
  {
    nr: '01', id: 'staat', titel: 'Staats- und Verfassungsrecht',
    lede: 'Das Fundament der Rechtsordnung — alles Übrige fusst auf der Bundesverfassung.',
    gruppen: [
      { id: 'verfassung', titel: 'Verfassung & Bundesorgane', keys: ['BV', 'PARLG', 'RVOG', 'RVOV', 'BPR', 'PUBLG', 'BGG', 'BGERR', 'STBOG'] },
    ],
  },
  {
    nr: '02', id: 'privatrecht', titel: 'Privatrecht',
    lede: 'Das Verhältnis Bürger ↔ Bürger — Zivilgesetzbuch, Obligationenrecht und die privatrechtlichen Nebenerlasse.',
    standardOffen: true,
    gruppen: [
      { id: 'zgb', titel: 'Zivilgesetzbuch (ZGB) & Grundbuch', keys: ['ZGB', 'ZSTV', 'GBV', 'TGBV', 'ADOV', 'PAVO', 'EOEBV'] },
      { id: 'or', titel: 'Obligationenrecht (OR) & Handelsregister', keys: ['OR', 'VMWG', 'HREGV', 'GEBV_HREG', 'FUSG'] },
      { id: 'ip', titel: 'Immaterialgüter & Wettbewerb', keys: ['URG', 'URV', 'PATG', 'PATV', 'MSCHG', 'MSCHV', 'DESG', 'DESV', 'SORTG', 'UWG', 'KG'] },
      { id: 'neben', titel: 'Internationales Privatrecht & weitere Erlasse', keys: ['IPRG', 'VVG', 'DSG', 'DSV', 'KKG', 'VKKG', 'PRHG', 'PRG', 'BEG', 'PARTG', 'BGBB'] },
    ],
  },
  {
    nr: '03', id: 'zivilverfahren', titel: 'Zivilprozess- und Zwangsvollstreckungsrecht',
    lede: 'Die Durchsetzung des Privatrechts — Zivilprozess und Schuldbetreibung/Konkurs.',
    standardOffen: true,
    gruppen: [
      { id: 'zpo', titel: 'Zivilprozess (ZPO)', keys: ['ZPO'] },
      { id: 'schkg', titel: 'Schuldbetreibung & Konkurs (SchKG)', keys: ['SCHKG', 'GEBV_SCHKG', 'KOV', 'VBB', 'VZG'] },
    ],
  },
  {
    nr: '04', id: 'straf', titel: 'Strafrecht und Strafverfahren',
    lede: 'Der staatliche Sanktionsanspruch — materielles Strafrecht, Strafprozess und das Nebenstrafrecht.',
    standardOffen: true,
    gruppen: [
      { id: 'stgb', titel: 'Strafrecht (StGB)', keys: ['STGB'] },
      { id: 'stpo', titel: 'Strafverfahren', keys: ['STPO', 'JSTPO', 'JSTG'] },
      { id: 'neben', titel: 'Neben- & Militärstrafrecht, Polizei, Opferhilfe, Rechtshilfe', keys: ['BETMG', 'BETMKV', 'VSTRR', 'OHG', 'IRSG', 'MSTG', 'MSTP', 'MG', 'ZENTV', 'ZAVV'] },
    ],
  },
  {
    nr: '05', id: 'verwaltung', titel: 'Verwaltungsrecht',
    lede: 'Das Verhältnis Bürger ↔ Staat — der praktisch umfangreichste Ast: Verfahren, Steuern, Sozialversicherung, Migration, Bau/Umwelt, Finanzmarkt.',
    gruppen: [
      { id: 'verfahren', titel: 'Verwaltungsverfahren & Rechtspflege', keys: ['VWVG', 'VGG', 'VGKE', 'VGR', 'VG', 'BGOE', 'BPG', 'BPV'] },
      { id: 'steuern', titel: 'Steuern & Abgaben', keys: ['DBG', 'STHG', 'MWSTG', 'MWSTV', 'VSTG', 'VSTV', 'QSTV', 'BKV', 'STG'] },
      { id: 'sozial', titel: 'Sozialversicherung', keys: ['ATSG', 'ATSV', 'AHVG', 'AHVV', 'VFV', 'IVG', 'IVV', 'ELG', 'ELV', 'BVG', 'FZG', 'BVV_2', 'BVV3', 'UVG', 'UVV', 'MVG', 'MVV', 'FAMZG', 'FAMZV', 'KVG', 'KVV', 'KLV', 'VVK', 'VKL', 'EOG', 'EOV', 'AVIG', 'AVIV', 'FZV'] },
      { id: 'migration', titel: 'Migration & Gleichstellung', keys: ['AIG', 'VZAE', 'ASYLG', 'ASYLV1', 'ASYLV2', 'ASYLV3', 'VEV', 'VINTA', 'ZEMIS_V', 'RDV', 'BUEG', 'BUEV', 'GLG'] },
      { id: 'umwelt', titel: 'Raumplanung, Bau & Umwelt', keys: ['RPG', 'RPV', 'USG', 'UVPV', 'GSCHG', 'GSCHV', 'NHG', 'NHV', 'WAG', 'WAV', 'LRV', 'LSV', 'VVEA', 'VEVA', 'VGVP', 'CHEMV', 'CHEMRRV', 'ENG', 'CO2_GESETZ', 'ENTG'] },
      { id: 'wirtschaft', titel: 'Wirtschaft & Finanzmarkt', keys: ['BANKG', 'BANKV', 'NBV', 'ERV', 'KAG', 'KKV', 'KKV_FINMA', 'FINMAG', 'FINMA_GEBV', 'FINIG', 'FINIV', 'FINFRAG', 'FINFRAV', 'FINFRAV_FINMA', 'VAG', 'AVO', 'FIDLEG', 'FIDLEV', 'PUEG', 'GWG', 'GWV_FINMA', 'BEWG', 'BEWV', 'THG', 'BGBM', 'AKKBV'] },
      { id: 'gesundheit', titel: 'Gesundheit & Lebensmittel', keys: ['HMG', 'VAM', 'AMBV', 'MEPV', 'EPG', 'EPV', 'TXG', 'LMG'] },
      { id: 'sektoren', titel: 'Beschaffung, Verkehr & Kommunikation', keys: ['BOEB', 'VOEB', 'SVG', 'VRV', 'VZV', 'VTS', 'SSV', 'SKV', 'VVV', 'LFG', 'EBG', 'FMG', 'VIL', 'FDV', 'FAV'] },
      { id: 'arbeit', titel: 'Arbeit, Bildung & Anwaltsrecht', keys: ['ARG', 'ARGV1', 'ARGV2', 'ARGV3', 'ARGV4', 'ARGV5', 'AVG', 'ENTSG', 'BBG', 'BBV', 'BMV_2025', 'BMV', 'BGFA'] },
    ],
  },
  // Völker- & Europarecht (EMRK/LugÜ/VRK u. a.) liegt seit 24.6.2026 in der
  // eigenständigen Rubrik «International» (rechtsgebiet 'international',
  // /international) — darum hier NICHT mehr als Bund-Systematik-Kategorie
  // (sonst doppelt). Die Erlasse werden in der regulären Gesetze-Übersicht
  // ausgeblendet (Gesetze.tsx filtert rechtsgebiet 'international').
];

// ─── Kantonale Systematik (Sachgebiets-Gliederung nach systematischer Nummer) ──
//
// Ein kantonaler Vollkorpus (z.B. BS 859 Erlasse) wird nach der OFFIZIELLEN
// systematischen Nummer gegliedert — so, wie die amtliche Systematische
// Rechtssammlung des Kantons aufgebaut ist. Top-Level = führende Ziffer der
// Nummer («640.100»→'6', «BSG 154.21»→'1'). Das ist deterministisch (§2; aus der
// Nummer abgeleitet, KEINE Titel-Heuristik) und vollständig (jeder Erlass trägt
// eine Nummer). Reine Anzeige-Ordnung (§3), kein Norminhalt.
//
// Die Sachgebiets-TITEL je Kanton stammen aus der amtlichen Systematik und sind
// verifiziert (bibliothek/recherche/kantons-systematik-labels.md, §1/§7). Fehlt
// ein Titel, zeigt die UI ehrlich «Bereich N» statt eines geratenen Sachgebiets
// (§8). Kantone ohne Dezimalschema (z.B. GL: römisch «III B/7/1») bekommen bei
// Bedarf eine eigene Extraktionsregel; ohne Regel greift der neutrale Fallback.

/** Ein Sachgebiet (Knoten des amtlichen Systematik-Baums). */
export interface Sachgebiet { nummer: string; name: string; }

/** Amtliche Systematik eines Kantons (aus /normtext/kanton-systematik.json,
 *  erzeugt von scripts/normtext/kanton-systematik-run.ts): Top-Sachgebiete mit
 *  ihren Untergruppen (2. Ebene) + Index jedes Baum-Knotens (präfix-bewahrender
 *  Schlüssel via systematikSchluessel: «640100» bzw. «BaB#152110») →
 *  [Top-Nummer, Untergruppe-Nummer] seiner Vorfahren. */
export interface KantonSystematik {
  roots: Array<Sachgebiet & { kinder: Sachgebiet[] }>;
  index: Record<string, [string, string]>;
}

const nurZiffern = (s: string): string => s.replace(/\D/g, '');

/**
 * Präfix-bewahrender Namespace-Schlüssel einer systematischen Nummer
 * (Determinismus §2, Single Source of Truth §5: Generator UND Lookup nutzen
 * exakt diese Funktion). Behebt die Fehleinsortierung des Gemeinderechts:
 *
 *  - Rein numerische Nummern («640.100»)  → reine Ziffern «640100» (wie bisher,
 *    inhaltlich unverändert).
 *  - Buchstaben-Präfix («BeE 117.220», «BaB 152.110») → «<PRÄFIX>#<Ziffern>»,
 *    z. B. «BeE#117220». Das «#» trennt Namespaces hart: ein «BeE …»-Knoten
 *    teilt nie ein Präfix mit einem rein numerischen Knoten, und ein «BaB»-Knoten
 *    nie mit einem «BeB»-Knoten.
 *  - Reiner Buchstaben-Präfix ohne Ziffern (Wurzel «BaB») → «BaB#» (leerer
 *    Ziffern-Teil) — so liegt die Wurzel als kürzester Präfix im selben Namespace.
 *
 * Der Buchstaben-Präfix ist der führende [A-Za-z]+-Block der Nummer; alles
 * danach wird auf Ziffern reduziert. Liefert '' für Nummern ganz ohne Ziffern
 * und ohne Buchstaben-Präfix (neutraler Fallback im Aufrufer).
 */
export function systematikSchluessel(nummer: string | null | undefined): string {
  const s = (nummer ?? '').trim();
  const m = /^([A-Za-z]+)/.exec(s);
  const d = nurZiffern(s);
  if (m) return `${m[1]}#${d}`;
  return d;
}

/**
 * Ordnet einen Erlass über Längster-Präfix-Match im amtlichen Systematik-Baum
 * seinem Top-Sachgebiet UND seiner Untergruppe (2. Ebene) zu. Deterministisch
 * (§2). Korrekt auch bei abweichenden Schemata (AI Hunderter, UR 10/20/…, ZG
 * +10), weil der Baum die echte Hierarchie liefert. Der Präfix-Match läuft NUR
 * innerhalb desselben Namespaces (Gemeinderecht «BeE …» matcht nie eine
 * numerische Wurzel und umgekehrt). Neutraler Fallback (§8) auf die führende
 * Ziffer bzw. den Buchstaben-Präfix, wenn keine Daten vorliegen oder die Nummer
 * nicht greift.
 */
export function sachgruppe(
  sys: KantonSystematik | undefined,
  sr: string | null | undefined,
): { top: string; sub: string } {
  const k = systematikSchluessel(sr);
  if (sys && k) {
    const hash = k.indexOf('#');
    // Innerhalb des Namespaces wird nur der Ziffern-Teil schrittweise gekürzt;
    // der Präfix («BeE#») bleibt erhalten, der leere Wurzel-Schlüssel («BeE#»)
    // ist der kürzeste Kandidat.
    if (hash >= 0) {
      const ns = k.slice(0, hash + 1); // inkl. «#»
      const digits = k.slice(hash + 1);
      for (let l = digits.length; l >= 0; l--) {
        const treffer = sys.index[ns + digits.slice(0, l)];
        if (treffer !== undefined) return { top: treffer[0], sub: treffer[1] };
      }
    } else {
      for (let l = k.length; l >= 1; l--) {
        const treffer = sys.index[k.slice(0, l)];
        if (treffer !== undefined) return { top: treffer[0], sub: treffer[1] };
      }
    }
  }
  // Fallback (§8): Bei Buchstaben-Präfix MIT Ziffern den Namespace als Top
  // behalten (Gemeinderecht «BeE 117.220» ohne BeE-Daten → «BeE», nie eine
  // numerische Wurzel). Reiner Buchstaben-Block ohne Ziffern («ABC») bleibt
  // «Ohne Systematik-Nummer» (~), wie bisher.
  const hash = k.indexOf('#');
  if (hash > 0 && k.length > hash + 1) return { top: k.slice(0, hash), sub: '' };
  if (hash >= 0) return { top: '~', sub: '' };
  return { top: k ? k[0] : '~', sub: '' };
}

/**
 * Vergleicht zwei systematische Nummern für die Anzeige-Sortierung innerhalb
 * einer Gruppe (S7), ohne Namespaces oder Mehrpunkt-Nummern zu zerstören
 * (Determinismus §2). Reihenfolge:
 *   1. Buchstaben-Präfix alphabetisch (rein numerische Nummern vor präfixierten),
 *   2. dann der Ziffern-Teil als Punkt-getrennte Tupel stufenweise numerisch
 *      («152.110» < «152.1100», «7.10» nach «7.9»).
 * Stabil und transitiv; kein parseFloat (das «152.110» und «152.1100» oder
 * «117.220» vs. «1172.20» verwechseln würde).
 */
export function srVergleich(a: string | null | undefined, b: string | null | undefined): number {
  const zerlege = (s: string | null | undefined): { praefix: string; teile: number[] } => {
    const t = (s ?? '').trim();
    const m = /^([A-Za-z]+)/.exec(t);
    const praefix = m ? m[1] : '';
    const rest = t.slice(praefix.length);
    const teile = (rest.match(/\d+/g) ?? []).map((x) => Number(x));
    return { praefix, teile };
  };
  const A = zerlege(a);
  const B = zerlege(b);
  if (A.praefix !== B.praefix) return A.praefix < B.praefix ? -1 : 1;
  const n = Math.max(A.teile.length, B.teile.length);
  for (let i = 0; i < n; i++) {
    const x = A.teile[i] ?? -1; // kürzere Nummer (weniger Stufen) zuerst
    const y = B.teile[i] ?? -1;
    if (x !== y) return x - y;
  }
  return 0;
}

/** Anzeige-Titel eines Top-Sachgebiets (amtlich, sonst ehrlicher Fallback, §8). */
export function topTitel(sys: KantonSystematik | undefined, top: string): string {
  const r = sys?.roots.find((x) => x.nummer === top);
  if (r) return r.name;
  return top === '~' ? 'Ohne Systematik-Nummer' : `Bereich ${top}`;
}

/** Anzeige-Titel einer Untergruppe (innerhalb eines Top-Sachgebiets). */
export function subTitel(sys: KantonSystematik | undefined, top: string, sub: string): string {
  const k = sys?.roots.find((x) => x.nummer === top)?.kinder.find((c) => c.nummer === sub);
  return k ? k.name : '';
}

/** Vergleichsfunktion für die Anzeige-Reihenfolge der Top-Sachgebiete (amtliche
 *  Baum-Reihenfolge; unbekannte/neutrale Schlüssel hinten). */
export function sachgebietRang(sys: KantonSystematik | undefined): (top: string) => number {
  const order = new Map((sys?.roots ?? []).map((r, i) => [r.nummer, i]));
  return (s) => order.get(s) ?? 999;
}

/** Vergleichsfunktion für die Reihenfolge der Untergruppen eines Top-Sachgebiets. */
export function untergruppeRang(sys: KantonSystematik | undefined, top: string): (sub: string) => number {
  const kinder = sys?.roots.find((x) => x.nummer === top)?.kinder ?? [];
  const order = new Map(kinder.map((k, i) => [k.nummer, i]));
  return (s) => (s === '' ? -1 : order.get(s) ?? 998);
}

/** Key → [Kategorie-id, Gruppen-id] für schnelle Zuordnung; mehrfach genannte
 *  Keys nehmen die ERSTE Nennung (Primär-Einordnung). */
export const SYSTEMATIK_VON_KEY: ReadonlyMap<string, { kat: string; gruppe: string }> = (() => {
  const m = new Map<string, { kat: string; gruppe: string }>();
  for (const k of SYSTEMATIK) for (const g of k.gruppen) for (const key of g.keys) {
    if (!m.has(key)) m.set(key, { kat: k.id, gruppe: g.id });
  }
  return m;
})();
