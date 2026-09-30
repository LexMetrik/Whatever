/**
 * Reine Prüf-Logik für den Drift-Check (§7 Zitat-Ausnahme d).
 * Exportiert für Tests (normtext-drift.test.ts) und für check-drift.ts.
 * §2: kein Date.now/Math.random — rein deterministisch.
 */

export interface NormSnapshot {
  id: string;
  quelle: string;
  fassungsToken: string;
  [key: string]: unknown;
}

export interface BundFassungsMismatch {
  id: string;
  snapshotToken: string;
  cacheToken: string;
}

/**
 * Prüft für jeden Snapshot-Eintrag, ob fassungsToken === cacheMap[gesetz].
 *
 * @param snapshots - alle NormSnapshot-Einträge aus allen Bund-Snapshot-Dateien
 * @param cacheMap  - Map von Gesetz-Name (lowercase, z.B. 'or') → Konsolidierung ('20260101')
 * @returns Liste aller Mismatches
 */
export function pruefeBundFassung(
  snapshots: NormSnapshot[],
  cacheMap: Map<string, string>,
): BundFassungsMismatch[] {
  const mismatches: BundFassungsMismatch[] = [];

  for (const snap of snapshots) {
    // id-Format: "bund/<GESETZ>/art_xxx" → Gesetz-Name aus Teil 2
    const teile = snap.id.split('/');
    if (teile.length < 3 || teile[0] !== 'bund') continue;

    const gesetzName = teile[1].toLowerCase(); // z.B. "OR" → "or"
    const erwartet = cacheMap.get(gesetzName);
    if (erwartet === undefined) continue; // kein Cache-Eintrag → nicht prüfbar

    if (snap.fassungsToken !== erwartet) {
      mismatches.push({
        id: snap.id,
        snapshotToken: snap.fassungsToken,
        cacheToken: erwartet,
      });
    }
  }

  return mismatches;
}

/**
 * Prüft, welche Pflicht-Anker aus dem Cache in den Snapshots fehlen.
 *
 * @param snapshotIds - Set aller vorhandenen Snapshot-IDs (z.B. "bund/OR/art_11")
 * @param ankerMap    - Map von Gesetz-Name (lowercase) → Array der Pflicht-Anker
 * @returns Liste der fehlenden IDs
 */
export function pruefeBundVollstaendigkeit(
  snapshotIds: Set<string>,
  ankerMap: Map<string, string[]>,
): string[] {
  const fehlend: string[] = [];

  for (const [name, anker] of ankerMap) {
    const gesetz = name.toUpperCase();
    for (const a of anker) {
      const erwartetId = `bund/${gesetz}/${a}`;
      if (!snapshotIds.has(erwartetId)) {
        fehlend.push(erwartetId);
      }
    }
  }

  return fehlend;
}

// ─── P1-b Coverage-Assertion (QS-CURRENCY) ────────────────────────────────────
// Der dauerhafte Wächter (nicht der Einmal-Lauf): kein gehosteter Bund-Volltext
// darf ohne Currency-Überwachung existieren. Jeder Register-Eintrag
//   · ebene='bund' && status='snapshot' mit Fedlex-ELI-quelleUrl → braucht einen
//     cache.sh-Pin (sonst sieht check:fedlex-versionen ihn nie),
//   · status='pdf-embed' → braucht einen PDF_EMBED_QUELLEN-Eintrag.
// Nicht-Fedlex/EU-VO, nur-live-link und Kanton sind ausgenommen.

export interface RegisterEintragLite {
  key: string;
  ebene: string;
  status: string;
  quelleUrl: string | null;
}

export interface CoverageLuecke {
  key: string;
  grund: string;
}

/** ELI (ohne Domain, Sprach-Suffix und Anker) aus einer Fedlex-quelleUrl; sonst null. */
export function fedlexEliAusUrl(url: string | null | undefined): string | null {
  if (!url || !url.includes('fedlex.admin.ch')) return null;
  const i = url.indexOf('/eli/');
  if (i < 0) return null;
  const rest = url
    .slice(i + '/eli/'.length)
    .split('#')[0]
    .replace(/\/(?:de|fr|it|rm)\/?$/i, '');
  return rest || null;
}

export function pruefeCoverage(
  erlasse: RegisterEintragLite[],
  pinEliSet: Set<string>,
  pdfEmbedKeys: Set<string>,
): CoverageLuecke[] {
  const luecken: CoverageLuecke[] = [];
  for (const e of erlasse) {
    if (e.ebene === 'bund' && e.status === 'snapshot') {
      const eli = fedlexEliAusUrl(e.quelleUrl);
      if (!eli) continue; // Nicht-Fedlex (EU-VO o.ä.) → ausgenommen
      if (!pinEliSet.has(eli)) {
        luecken.push({ key: e.key, grund: `Fedlex-Volltext ohne cache.sh-Pin (ELI ${eli})` });
      }
    } else if (e.status === 'pdf-embed') {
      if (!pdfEmbedKeys.has(e.key)) {
        luecken.push({ key: e.key, grund: 'pdf-embed ohne PDF_EMBED_QUELLE' });
      }
    }
  }
  return luecken;
}

// ─── Label-/Anker-Riegel (W2·27-BUND-FERTIG, Posten 20.9./30.9.2026) ───────────
// `artikelLabel` und `quelleUrl` fliessen NICHT in den Block-sha (golden-neutral,
// scripts/normtext/sha-bloecke.ts): ein stiller Rückfall (PR #890: zwei Artikel
// desselben Erlasses mit gleichem Label «Art. 126z», Anker auf das falsche
// Vorkommen) fiele im Golden nie auf, und check:datenhaltung bewacht nur die
// Byte-Identität des Committeten, nicht die Richtigkeit. Dieser Riegel prüft die
// Kopplung an die amtliche id-Form OFFLINE (Bund; Kanton trägt keinen #Anker):
//   B1  id `art_<N>[_<suffix>]*` → Label == «Art. » + N + suffix (ohne «_»),
//       Anker == id-Token. Empirisch 24 603/24 603 (Bund, 30.9.2026).
//       ERGÄNZUNG 30.9.2026 (Gegenprüfung #1171, Posten «B1 deckt 997/25 601
//       nicht»): die 24 603 sind NUR die einfachen `art_`-ids — 24 603 + 1 (`__n`,
//       B2) + 997 = 25 601. Die 997 übrigen (382 annex, 294 art-Bereiche, 276
//       disp, 28 scope, 17 decl) deckt B1 jetzt je Klasse mit (klassifiziere()):
//         annex_<n>[_<m|x>]*  Label «Anhang n.m|nx» (römisch: «Anhang II»)
//         art_<T1>_<T2>       Label «Art. T1–T2» (Bereich, T = Zahl + Suffixe)
//         disp_u<k>_<art…>    Label = Art-/Bereichs-Label des Rests,
//                             Anker «disp_u<k>/<art…>» (amtliches «/»)
//         scope_u<k>          Label «Geltungsbereich [des|der X] am T. Monat J»
//         annex_u<k>/decl_u<k> Label NICHT ableitbar (freier Fedlex-Titel) →
//                             nur Anker + Label nichtleer; in der Tor-Ausgabe
//                             als «Label nur auf nichtleer geprüft» AUSGEWIESEN
//       Für ALLE Klassen gilt: Anker == id-Token, wobei «/» → «_» (Regel gilt
//       heute 997/997). Kanton-Labels bleiben ungeprüft (kein #Anker, Label
//       nicht aus der id ableitbar) und werden in check-drift.ts ausgewiesen.
//   B2  id mit Synthese-Suffix `__<n>` (doppelte Fedlex-id) → Anker OHNE `__<n>`
//       (amtlich nicht existent); Label = Basis-Label + lateinisches
//       Wiederholungs-Adverb (bis|ter|quater|…decies, z. B. «Art. 126ztredecies»)
//       und im selben Erlass eindeutig. «Label strikt länger» (Stand #1171)
//       liess «Art. 126zX» durch.
//   B3  quelleUrl je Erlass eindeutig (zwei Artikel, dieselbe Stelle = Fehlsprung).
//   B4  quelleUrl trägt einen #Anker; die Basis-URL ist je Erlass identisch —
//       Referenz = die MEHRHEITS-Basis des Erlasses (nicht mehr der zuerst
//       gelesene Eintrag: ein falscher erster Eintrag hätte alle anderen als
//       Abweichler gemeldet); bei Gleichstand bleibt der erste Eintrag Referenz.

export interface LabelUrlBefund {
  id: string;
  regel:
    | 'B1-label'
    | 'B1-anker'
    | 'B2-anker-synthese'
    | 'B2-label'
    | 'B3-url-doppelt'
    | 'B4-ohne-anker'
    | 'B4-basis-url';
  text: string;
  /** Klasse der id (nur B1-Befunde der erweiterten Deckung; siehe klassifiziere()). */
  klasse?: LabelKlasse;
}

export type LabelKlasse =
  | 'art'
  | 'art-bereich'
  | 'annex'
  | 'annex-frei'
  | 'disp'
  | 'scope'
  | 'decl'
  | 'sonstig';

const ART_ID = /^art_(\d+)((?:_[a-z]+)*)(?:__(\d+))?$/;
// Ein Artikel-Token: Zahl + Buchstaben-Suffixe (`126_z_bis`); ein Bereich sind zwei davon.
const ART_TOKEN = '\\d+(?:_[a-z]+)*';
const ART_BEREICH = new RegExp(`^art_(${ART_TOKEN})_(${ART_TOKEN})$`);
const ANNEX_FREI = /^annex_u\d+$/;
const ANNEX_ID = /^annex_((?:\d+|[IVXLC]+)(?:_(?:\d+|[a-z]+))*)$/;
const DISP_ID = /^disp_(u\d+)_(art_.+)$/;
const SCOPE_ID = /^scope_u\d+$/;
const DECL_ID = /^decl_u\d+$/;
const SCOPE_LABEL = /^Geltungsbereich(?: d\S+ \S+)? am \d{1,2}\.\s\p{L}+\s\d{4}$/u;
// Lateinische Wiederholungs-Adverbien der Fedlex-Nummerierung (2–19): bis, ter, quater,
// quinquies … novies, decies, undecies, duodecies, terdecies/tredecies, … novemdecies.
const ORDINAL_SUFFIX =
  /^(?:bis|ter|quater|quinquies|sexies|septies|octies|novies|(?:un|duo|ter|tre|quater|quin|sex|septen|sept|octo|oct|novem|nov)?decies)$/;

/**
 * Bekannte, exakt festgenagelte Abweichungen des Fedlex-Labels von der id-Ableitung
 * (id → Ist-Label). Stand 30.9.2026 gemessen: VRV-Anhang II trägt im Snapshot das
 * Label «+Anhang II» (Fedlex-Quelltext-Artefakt, Daten-Fund; Korrektur gehört in die
 * Daten-Session, nicht in diesen Riegel). Ändert sich das Label, wird der Eintrag
 * wieder rot; ist die Ausnahme überholt (Label stimmt), meldet der Riegel das auch.
 */
export const LABEL_AUSNAHMEN: Readonly<Record<string, string>> = {
  'bund/VRV/annex_II': '+Anhang II',
};

const artLabel = (tok: string): string => tok.replace(/_/g, '');

/** Erwartetes Label einer `art_…`-Teil-id (einfach oder Bereich); sonst null. */
function artTeilLabel(art: string): string | null {
  const e = art.match(ART_ID);
  if (e && e[3] === undefined) return `Art. ${e[1]}${e[2].replace(/_/g, '')}`;
  const b = art.match(ART_BEREICH);
  if (b) return `Art. ${artLabel(b[1])}–${artLabel(b[2])}`;
  return null;
}

export interface LabelRegel {
  klasse: LabelKlasse;
  /** Erwartetes Label exakt; null = nicht ableitbar. */
  label: string | null;
  /** Format-Prüfung, wenn das Label nicht exakt ableitbar ist (scope). */
  labelFormat?: RegExp;
  /** Erwarteter Anker (id-Token; bei disp mit amtlichem «/»). */
  anker: string;
}

/**
 * Klassifiziert ein id-Token (Teil nach `bund/<ERLASS>/`) und leitet daraus
 * Label- und Anker-Erwartung ab. Reine Funktion, deterministisch (§2). Das
 * Synthese-Token `art_N__n` klassifiziert NICHT (B2-Pfad).
 */
export function klassifiziere(token: string): LabelRegel | null {
  const e = token.match(ART_ID);
  if (e) {
    if (e[3] !== undefined) return null;
    return { klasse: 'art', label: `Art. ${e[1]}${e[2].replace(/_/g, '')}`, anker: token };
  }
  const bereich = artTeilLabel(token);
  if (bereich !== null) return { klasse: 'art-bereich', label: bereich, anker: token };
  if (ANNEX_FREI.test(token)) return { klasse: 'annex-frei', label: null, anker: token };
  const a = token.match(ANNEX_ID);
  if (a) {
    const [erster, ...rest] = a[1].split('_');
    const nr = rest.reduce((acc, p) => (/^\d+$/.test(p) ? `${acc}.${p}` : `${acc}${p}`), erster);
    return { klasse: 'annex', label: `Anhang ${nr}`, anker: token };
  }
  const d = token.match(DISP_ID);
  if (d) {
    const l = artTeilLabel(d[2]);
    if (l !== null) return { klasse: 'disp', label: l, anker: `disp_${d[1]}/${d[2]}` };
  }
  if (SCOPE_ID.test(token)) return { klasse: 'scope', label: null, labelFormat: SCOPE_LABEL, anker: token };
  if (DECL_ID.test(token)) return { klasse: 'decl', label: null, anker: token };
  return null;
}

/** Zähl-Ausweis der Deckung (für die Tor-Ausgabe; §8 nichts still weglassen). */
export interface LabelDeckung {
  /** Label exakt aus der id abgeleitet und geprüft. */
  labelAbgeleitet: number;
  /** Label nur auf Format (scope) bzw. Nichtleere (annex_u, decl) geprüft. */
  labelNurFormat: number;
  /** Klasse → Anzahl Einträge, deren Label nicht aus der id ableitbar ist. */
  labelNurFormatJeKlasse: Record<string, number>;
  /** Einträge ohne erkannte Klasse (nur Anker-Regel «/ → _ == id-Token», B3, B4). */
  sonstig: number;
  /** Ids mit festgenageltem Ausnahme-Label (LABEL_AUSNAHMEN), nicht als Befund gezählt. */
  ausnahmen: string[];
}

export function pruefeLabelUrl(snapshots: NormSnapshot[]): LabelUrlBefund[] {
  return pruefeLabelUrlMitDeckung(snapshots).befunde;
}

export function pruefeLabelUrlMitDeckung(snapshots: NormSnapshot[]): {
  befunde: LabelUrlBefund[];
  deckung: LabelDeckung;
} {
  const befunde: LabelUrlBefund[] = [];
  const deckung: LabelDeckung = { labelAbgeleitet: 0, labelNurFormat: 0, labelNurFormatJeKlasse: {}, sonstig: 0, ausnahmen: [] };
  const urlIds = new Map<string, string[]>(); // "<erlass>|<quelleUrl>" → ids
  const basenJeErlass = new Map<string, Map<string, { n: number; erste: string }>>();
  const labelsJeErlass = new Map<string, Map<string, string[]>>(); // erlass → label → ids
  const synthese: { id: string; erlass: string; label: string; basisLabel: string }[] = [];
  const basisDerEintraege: { id: string; erlass: string; basis: string }[] = [];

  for (const s of snapshots) {
    const teile = s.id.split('/');
    if (teile.length < 3 || teile[0] !== 'bund') continue;
    const erlass = teile[1];
    const token = teile.slice(2).join('/');
    const label = typeof s.artikelLabel === 'string' ? s.artikelLabel : '';
    const url = typeof s.quelleUrl === 'string' ? s.quelleUrl : '';
    const hash = url.indexOf('#');
    const anker = hash === -1 ? null : url.slice(hash + 1);
    const basis = hash === -1 ? url : url.slice(0, hash);

    if (anker === null || anker === '') {
      befunde.push({ id: s.id, regel: 'B4-ohne-anker', text: `quelleUrl "${url}" trägt keinen #Anker` });
    }
    basisDerEintraege.push({ id: s.id, erlass, basis });
    const basen = basenJeErlass.get(erlass) ?? new Map<string, { n: number; erste: string }>();
    const b = basen.get(basis);
    if (b) b.n += 1;
    else basen.set(basis, { n: 1, erste: s.id });
    basenJeErlass.set(erlass, basen);
    const key = `${erlass}|${url}`;
    urlIds.set(key, [...(urlIds.get(key) ?? []), s.id]);
    const lbl = labelsJeErlass.get(erlass) ?? new Map<string, string[]>();
    lbl.set(label, [...(lbl.get(label) ?? []), s.id]);
    labelsJeErlass.set(erlass, lbl);

    const m = token.match(ART_ID);
    if (m && m[3] !== undefined) {
      // B2: Synthese-`__n`; Label-Prüfung erst nach dem Sammeln (Eindeutigkeit je Erlass).
      const basisLabel = `Art. ${m[1]}${m[2].replace(/_/g, '')}`;
      if (anker !== null && /__\d+$/.test(anker)) {
        befunde.push({
          id: s.id,
          regel: 'B2-anker-synthese',
          text: `Anker "#${anker}" trägt den Synthese-Suffix (amtlich nicht existent)`,
        });
      }
      synthese.push({ id: s.id, erlass, label, basisLabel });
      continue;
    }

    const regel = klassifiziere(token);
    if (regel === null) {
      // Unbekannte id-Form: nur die schwache Kopplung «/ → _ == id-Token» (heute 0 Fälle).
      deckung.sonstig += 1;
      if (anker !== null && anker !== '' && anker.replace(/\//g, '_') !== token) {
        befunde.push({
          id: s.id,
          regel: 'B1-anker',
          klasse: 'sonstig',
          text: `Anker "#${anker}" ≠ id-Token "#${token}" (Klasse unbekannt, nur «/»→«_»-Regel)`,
        });
      }
      continue;
    }
    if (regel.label !== null) {
      deckung.labelAbgeleitet += 1;
      const ausnahme = LABEL_AUSNAHMEN[s.id];
      if (ausnahme !== undefined && label === ausnahme) {
        deckung.ausnahmen.push(s.id);
      } else if (ausnahme !== undefined && label === regel.label) {
        befunde.push({
          id: s.id,
          regel: 'B1-label',
          klasse: regel.klasse,
          text: `LABEL_AUSNAHMEN-Eintrag überholt: Label "${label}" stimmt mit der id-Ableitung überein — Ausnahme entfernen`,
        });
      } else if (label !== regel.label) {
        befunde.push({
          id: s.id,
          regel: 'B1-label',
          klasse: regel.klasse,
          text: `artikelLabel "${label}" ≠ "${regel.label}" (aus id, Klasse ${regel.klasse})`,
        });
      }
    } else {
      deckung.labelNurFormat += 1;
      deckung.labelNurFormatJeKlasse[regel.klasse] = (deckung.labelNurFormatJeKlasse[regel.klasse] ?? 0) + 1;
      const formatOk = regel.labelFormat ? regel.labelFormat.test(label) : label.trim() !== '';
      if (!formatOk) {
        befunde.push({
          id: s.id,
          regel: 'B1-label',
          klasse: regel.klasse,
          text: regel.labelFormat
            ? `artikelLabel "${label}" passt nicht zum Format ${regel.labelFormat} (Klasse ${regel.klasse}, nicht aus id ableitbar)`
            : `artikelLabel leer (Klasse ${regel.klasse}, Inhalt nicht aus id ableitbar)`,
        });
      }
    }
    if (anker !== null && anker !== regel.anker) {
      befunde.push({
        id: s.id,
        regel: 'B1-anker',
        klasse: regel.klasse,
        text: `Anker "#${anker}" ≠ erwartet "#${regel.anker}" (aus id, Klasse ${regel.klasse})`,
      });
    }
  }

  for (const sy of synthese) {
    const suffix = sy.label.startsWith(sy.basisLabel) ? sy.label.slice(sy.basisLabel.length) : null;
    if (suffix === null || !ORDINAL_SUFFIX.test(suffix)) {
      befunde.push({
        id: sy.id,
        regel: 'B2-label',
        text: `artikelLabel "${sy.label}" ist nicht «${sy.basisLabel}» + Wiederholungs-Adverb (bis|ter|quater|…decies)`,
      });
      continue;
    }
    const gleich = (labelsJeErlass.get(sy.erlass)?.get(sy.label) ?? []).filter((x) => x !== sy.id);
    if (gleich.length > 0) {
      befunde.push({
        id: sy.id,
        regel: 'B2-label',
        text: `artikelLabel "${sy.label}" kommt im Erlass schon vor: ${gleich.join(', ')}`,
      });
    }
  }

  // B4 Basis-URL: Referenz = Mehrheits-Basis je Erlass (Gleichstand: zuerst gelesene).
  for (const [erlass, basen] of basenJeErlass) {
    if (basen.size < 2) continue;
    let ref: string | null = null;
    let refN = 0;
    for (const [basis, v] of basen) {
      if (v.n > refN) {
        ref = basis;
        refN = v.n;
      }
    }
    for (const e of basisDerEintraege) {
      if (e.erlass !== erlass || e.basis === ref) continue;
      befunde.push({ id: e.id, regel: 'B4-basis-url', text: `Basis-URL "${e.basis}" ≠ "${ref}" im selben Erlass` });
    }
  }

  for (const [key, ids] of urlIds) {
    if (ids.length > 1) {
      befunde.push({ id: ids[0], regel: 'B3-url-doppelt', text: `quelleUrl ${key.split('|')[1]} doppelt: ${ids.join(', ')}` });
    }
  }
  return { befunde, deckung };
}

/**
 * Ausweis für die Tor-Ausgabe (§8): was der Riegel NICHT inhaltlich prüft.
 * Kanton: kein #Anker, Label nicht aus der id ableitbar → ungeprüft.
 */
export function labelDeckungText(d: LabelDeckung, kantonEintraege: number): string {
  const frei = Object.entries(d.labelNurFormatJeKlasse)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
  return (
    `Label aus id geprüft: ${d.labelAbgeleitet}; Label nur Format/nichtleer (nicht ableitbar): ${d.labelNurFormat}` +
    `${frei ? ` (${frei})` : ''}; Klasse unbekannt: ${d.sonstig}; ` +
    `festgenagelte Ausnahmen: ${d.ausnahmen.length}${d.ausnahmen.length ? ` (${d.ausnahmen.join(', ')})` : ''}; ` +
    `Kanton-Labels UNGEPRÜFT: ${kantonEintraege} Einträge`
  );
}
