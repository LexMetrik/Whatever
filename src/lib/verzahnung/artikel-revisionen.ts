// ─── Normrevisions-Ehrlichkeit: Laden + Klassifikation (V1c) ────────────────
//
// FAHRPLAN-VERZAHNUNG-UI §V1c. Der Build-Extrakt (scripts/verzahnung/
// extrahiere-artikel-revisionen.ts) legt je Erlass einen Shard
// `public/verzahnung/artikel-revisionen/<KEY>.json` ab: Artikel-Token → Datum der
// letzten Textänderung + AS-Fundstelle. Diese Ladeschicht (§3) holt den Shard
// lazy (Promise-Cache je Erlass, Muster wie `ladeLeitfallShard`) und klassifiziert
// je Kante deterministisch (§2), ob sich die zitierte Norm SEIT dem Entscheid
// revidiert hat.
//
// Klassifikations-Modell (§V1c): Entscheid-Datum d, Artikel a, r(a) = max
// Revisionsdatum. d < r(a) ⇒ 'revidiert' (beweisbar); d ≥ r(a) ⇒ 'gleich'
// (UI-STILL — KEIN positives «noch aktuell»-Siegel, R16/Scheinautorität);
// Bandjahr-Präzision (Q1) ⇒ nur 'revidiert', wenn Revisions-JAHR strikt >
// Bandjahr, sonst 'unbekannt'; kein Sidecar/kantonal ⇒ 'unbekannt'.

import type { Datumspraezision } from './typen';
import { kanonArtikelToken, type ArtikelRevision } from './revisionen-extrakt';
import { kodiereSchluessel } from '../normtext/dateiUrl';

export type { ArtikelRevision } from './revisionen-extrakt';

/** Erlass-lokaler Revisions-Shard (Projektion aus den Struktur-Sidecar-Fussnoten). */
export interface RevisionShard {
  /** Register-key des Erlasses (= Dateiname ohne .json). */
  erlass: string;
  /** Kanonischer Artikel-Token → Revision (nur Artikel MIT datiertem Beleg). */
  proArtikel: Record<string, ArtikelRevision>;
}

/** Ergebnis der Kanten-Klassifikation. 'gleich' bleibt bewusst UI-still. */
export type FassungsBezug = 'gleich' | 'revidiert' | 'unbekannt';

/**
 * Präzision eines Entscheid-Datums. BGE-Auszüge tragen teils nur das Bandjahr als
 * Platzhalter (YYYY-01-01) statt eines echten Urteilsdatums (ein Urteil datiert
 * nie auf den 1.1.) — diese ehrlich als 'bandjahr' behandeln (Q1). Reguläre
 * ISO-Tagesdaten ⇒ 'tag'; alles andere ⇒ 'unbekannt'.
 */
export function entscheidPraezision(datum: string, gericht: string): Datumspraezision {
  if (gericht === 'bge' && /-01-01$/.test(datum)) return 'bandjahr';
  // Kantonaler Platzhalter (B-1, W2·29-WERKBANK-LESER D2, 23.9.2026): ein BS-
  // Entscheid ohne Entscheiddatum in der Quelle trägt <GN-Jahr>-01-01 +
  // `datumUnbekannt`. Das GN-Jahr ist das EINGANGS-, nicht das Entscheidjahr
  // (BES.2024.88: GN 2024, entschieden 15.9.2025) — anders als beim BGE-Bandjahr
  // ist also nicht einmal das Jahr belastbar ⇒ 'unbekannt', nie 'revidiert'.
  // Erkannt am kantonalen Gerichts-Code ('bs_…') bzw. an der Status-Klasse
  // 'kantonal' (so übergibt es die Bezugs-Linie); Bundesgerichts-Daten bleiben
  // unberührt. Gemessen am Korpus 23.9.2026: jedes kantonale YYYY-01-01 war ein
  // solcher Platzhalter (42/42); nach dem Kopf-Datum-Nachtrag sind es 0.
  if ((gericht === 'kantonal' || /^[a-z]{2}_/.test(gericht)) && /-01-01$/.test(datum)) return 'unbekannt';
  if (/^\d{4}-\d{2}-\d{2}$/.test(datum)) return 'tag';
  return 'unbekannt';
}

/** Bequeme Bündelung: Entscheid-Datum + abgeleitete Präzision (Q1-sicher). */
export function entscheidDatum(datum: string, gericht: string): { iso: string; praezision: Datumspraezision } {
  return { iso: datum, praezision: entscheidPraezision(datum, gericht) };
}

/**
 * Klassifikation EINER Kante (§V1c, deterministisch, rein).
 * @param entscheid  Datum + Präzision des Entscheids (d). undefined/unbekannt ⇒ 'unbekannt'.
 * @param revision   r(a): `undefined` = Erlass nicht abgedeckt (kein Sidecar/kantonal)
 *                   ⇒ 'unbekannt'; `null` = Artikel nie revidiert (Urfassung) ⇒ 'gleich';
 *                   Objekt = letzte Textänderung.
 */
export function klassifiziereFassungsBezug(
  entscheid: { iso: string; praezision: Datumspraezision } | undefined,
  revision: ArtikelRevision | null | undefined,
): FassungsBezug {
  if (!entscheid || entscheid.praezision === 'unbekannt') return 'unbekannt';
  if (revision === undefined) return 'unbekannt';   // kein Sidecar / kantonal / aufgehoben
  if (revision === null) return 'gleich';           // Urfassung: Text nie geändert (UI-still)
  if (entscheid.praezision === 'bandjahr') {
    // Q1 strikt: innerhalb desselben Jahres ist die Reihenfolge unbekannt.
    const revJahr = Number(revision.iso.slice(0, 4));
    const bandJahr = Number(entscheid.iso.slice(0, 4));
    if (!Number.isFinite(revJahr) || !Number.isFinite(bandJahr)) return 'unbekannt';
    return revJahr > bandJahr ? 'revidiert' : 'unbekannt';
  }
  return entscheid.iso < revision.iso ? 'revidiert' : 'gleich';
}

/**
 * Instanz-Tooltip/-aria-Zusatz für ein `revidiert`-Badge (§7-Provenienz):
 * «in Kraft seit 01.01.2025 · AS 2023 628». Rein/deterministisch (§2), kein
 * `new Date`.
 */
export function revisionDetailText(rev: ArtikelRevision): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rev.iso);
  const datum = m ? `${m[3]}.${m[2]}.${m[1]}` : rev.iso;
  return rev.as ? `in Kraft seit ${datum} · ${rev.as}` : `in Kraft seit ${datum}`;
}

/**
 * Revision eines Artikels aus einem (evtl. noch nicht geladenen) Shard.
 * `undefined` = Shard fehlt/lädt/Erlass nicht abgedeckt (⇒ 'unbekannt'); `null` =
 * Erlass abgedeckt, Artikel aber ohne Revisions-Beleg (Urfassung ⇒ 'gleich').
 */
export function revisionFuerToken(
  shard: RevisionShard | null | undefined,
  artikel: string,
): ArtikelRevision | null | undefined {
  if (!shard) return undefined;
  return shard.proArtikel[kanonArtikelToken(artikel)] ?? null;
}

// ─── Lazy-Loader (Promise-Cache je Erlass, Muster wie norm-index) ────────────

const shardPromises = new Map<string, Promise<RevisionShard | null>>();

export async function ladeRevisionShard(erlassKey: string): Promise<RevisionShard | null> {
  let p = shardPromises.get(erlassKey);
  if (!p) {
    p = (async () => {
      try {
        const res = await fetch(`/verzahnung/artikel-revisionen/${kodiereSchluessel(erlassKey)}.json`);
        if (res.status === 404) return null; // kein Shard = Erlass ohne Revisions-Beleg (kein Fehler)
        if (!res.ok) { shardPromises.delete(erlassKey); return null; }
        return (await res.json()) as RevisionShard;
      } catch {
        // Transienter Netz-/Parse-Fehler: NICHT dauerhaft als null cachen (§8) —
        // ein späterer Aufrufer darf es erneut versuchen.
        shardPromises.delete(erlassKey);
        return null;
      }
    })();
    shardPromises.set(erlassKey, p);
  }
  return p;
}

/**
 * Shards für mehrere Erlasse laden (EntscheidLeser: zitierte Normen streuen über
 * mehrere Erlasse). Dedupliziert; jeder Shard teilt den Promise-Cache oben.
 */
export async function ladeRevisionShards(
  erlassKeys: readonly string[],
): Promise<Map<string, RevisionShard | null>> {
  const eindeutig = [...new Set(erlassKeys)];
  const paare = await Promise.all(
    eindeutig.map(async (k) => [k, await ladeRevisionShard(k)] as const),
  );
  return new Map(paare);
}
