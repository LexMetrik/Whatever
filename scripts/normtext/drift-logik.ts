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

// ─── Label-/Anker-Riegel (W2·27-BUND-FERTIG, Posten 20.9.2026) ─────────────────
// `artikelLabel` und `quelleUrl` fliessen NICHT in den Block-sha (golden-neutral,
// scripts/normtext/sha-bloecke.ts): ein stiller Rückfall (PR #890: zwei Artikel
// desselben Erlasses mit gleichem Label «Art. 126z», Anker auf das falsche
// Vorkommen) fiele im Golden nie auf, und check:datenhaltung bewacht nur die
// Byte-Identität des Committeten, nicht die Richtigkeit. Dieser Riegel prüft die
// Kopplung an die amtliche id-Form OFFLINE (Bund; Kanton trägt keinen #Anker):
//   B1  id `art_<N>[_<suffix>]*` → Label == «Art. » + N + suffix (ohne «_»),
//       Anker == id-Token. Empirisch 24 603/24 603 (Bund, 30.9.2026).
//   B2  id mit Synthese-Suffix `__<n>` (doppelte Fedlex-id) → Anker OHNE `__<n>`
//       (amtlich nicht existent) und Label strikt länger als das Basis-Label
//       (trägt das Ordinal, z. B. «Art. 126ztredecies»).
//   B3  quelleUrl je Erlass eindeutig (zwei Artikel, dieselbe Stelle = Fehlsprung).
//   B4  quelleUrl trägt einen #Anker; die Basis-URL ist je Erlass identisch.
// Nicht-«art_»-ids (disp_/annex_/…) unterliegen nur B3/B4.

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
}

const ART_ID = /^art_(\d+)((?:_[a-z]+)*)(?:__(\d+))?$/;

export function pruefeLabelUrl(snapshots: NormSnapshot[]): LabelUrlBefund[] {
  const befunde: LabelUrlBefund[] = [];
  const urlIds = new Map<string, string[]>(); // "<erlass>|<quelleUrl>" → ids
  const basisJeErlass = new Map<string, string>();

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
    const bisher = basisJeErlass.get(erlass);
    if (bisher === undefined) basisJeErlass.set(erlass, basis);
    else if (bisher !== basis) {
      befunde.push({ id: s.id, regel: 'B4-basis-url', text: `Basis-URL "${basis}" ≠ "${bisher}" im selben Erlass` });
    }
    const key = `${erlass}|${url}`;
    urlIds.set(key, [...(urlIds.get(key) ?? []), s.id]);

    const m = token.match(ART_ID);
    if (!m) continue;
    const basisLabel = `Art. ${m[1]}${m[2].replace(/_/g, '')}`;
    if (m[3] === undefined) {
      if (label !== basisLabel) {
        befunde.push({ id: s.id, regel: 'B1-label', text: `artikelLabel "${label}" ≠ "${basisLabel}" (aus id)` });
      }
      if (anker !== null && anker !== token) {
        befunde.push({ id: s.id, regel: 'B1-anker', text: `Anker "#${anker}" ≠ id-Token "#${token}"` });
      }
    } else {
      if (anker !== null && /__\d+$/.test(anker)) {
        befunde.push({
          id: s.id,
          regel: 'B2-anker-synthese',
          text: `Anker "#${anker}" trägt den Synthese-Suffix (amtlich nicht existent)`,
        });
      }
      if (!(label.startsWith(basisLabel) && label.length > basisLabel.length)) {
        befunde.push({
          id: s.id,
          regel: 'B2-label',
          text: `artikelLabel "${label}" unterscheidet sich nicht vom Basis-Label "${basisLabel}"`,
        });
      }
    }
  }

  for (const [key, ids] of urlIds) {
    if (ids.length > 1) {
      befunde.push({ id: ids[0], regel: 'B3-url-doppelt', text: `quelleUrl ${key.split('|')[1]} doppelt: ${ids.join(', ')}` });
    }
  }
  return befunde;
}
