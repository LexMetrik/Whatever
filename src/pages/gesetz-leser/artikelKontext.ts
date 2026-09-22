import type { LeitfallShard } from '../../lib/rechtsprechung/norm-index';
import type { KantenShard } from '../../lib/materialien/kanten-shard';
import { normArtikelToken } from '../../lib/rechtsprechung/bezuege';
import type { StrukturMap } from '../../lib/normtext/browse';
import type { NormSnapshot } from '../../lib/normtext/typen';
import type { KontextVerweis } from '../../lib/kontext';
import { internerErlassFuerSr } from './helpers';
import { erlassPfadVonKey } from '../../lib/normtext/erlassAdresse';

// ═══ ABSCHNITT · Artikel-Kontext (W2·19-GLIEDERUNG/S7, Bau-Spec §5.2) ════════
//
// Der WEGWEISER zum aktiven Artikel: «Wieviel Praxis gibt es dazu, wann wurde er
// zuletzt geändert, wohin verweist er, welches Werkzeug gehört dazu?» Das DETAIL
// bleibt am Artikelfuss und in den bestehenden Panel-Gruppen (§5 SSoT) — diese
// Ansicht zeigt Zahlen und Sprünge, nie eine zweite Liste derselben Sachen.
//
// KEIN NEUER DATENWEG ÜBER DIE LEITUNG (§15.3): beide Shards, die hier geladen
// werden, holt das KontextPanel für seine eigenen Gruppen ohnehin — und beide
// Loader haben einen modulweiten Promise-Cache (norm-index.ts, kanten-shard.ts).
// Es entsteht also KEIN zweiter Fetch, nur eine zweite Projektion derselben
// Bytes. Geladen wird im Leerlauf (`beiLeerlauf`, dasselbe Muster wie Leitfall-/
// Revisions-/Historie-Shard des Readers), nie im kritischen Pfad.
//
// WARUM NICHT `gesamtProArtikel` AUS DEM BEZUGS-SHARD (Bau-Spec §5.2 nennt ihn):
// Der Bezugs-Shard wiegt bis 300 KB gzip (BGG) und wird nach Davids Vorgabe vom
// 28.7.2026 NUR geladen, wenn eine Instanz-Facette aktiv ist (bezuegeLaden.ts).
// Ihn für eine Zahl in der Seitenleiste eager zu holen, kehrte genau diesen
// Entscheid um. Der Leitfall-Shard ist die schlanke Projektion derselben Quelle,
// liegt für das Panel ohnehin im Cache — und die Zahl wird entsprechend ehrlich
// beschriftet («erfasste Leitentscheide»), nicht als Gesamtpraxis ausgegeben (§8).
//
// §15.2/CLS: die Ansicht hat IMMER dieselbe Zeilenzahl (vier Rollen, jede mit
// ihrem ehrlichen Leer-Satz). Ein Artikelwechsel tauscht nur Text in Zeilen, die
// schon stehen — er kann nichts verschieben. Die Höhe nagelt zusätzlich
// `.lc-artikelkontext` fest (index.css).

// Die TYPEN liegen in `src/lib/kontext.ts` — das KontextPanel (Komponenten-
// Schicht) muss die Form kennen dürfen, ohne in die Seiten-Schicht hinauf zu
// importieren (check:zyklen). Gebaut wird die Ansicht hier.
export type { KontextVerweis } from '../../lib/kontext';

/**
 * Ausgehende Verweise EINES Artikels, rein abgeleitet aus dem, was der Reader
 * ohnehin hält: der Delegationsnorm-Verweis `grundlage` (Verordnung →
 * Trägergesetz, G23/M8) und die Erlass-Verweise der amtlichen Fussnoten
 * (`links[].intern` beim Kanton, `links[].rs` beim Bund). Dedupliziert über das
 * Label; Reihenfolge = Grundlage zuerst, dann Dokumentreihenfolge der Fussnoten.
 *
 * §7/§8: Es wird NICHTS aufgelöst, was nicht belegt ist — ein SR-Verweis auf
 * einen Erlass, den wir nicht im Volltext halten, behält den amtlichen Link
 * statt eines toten internen Pfads.
 */
export function ausgehendeVerweise(
  eintrag: NormSnapshot | undefined,
  struktur: StrukturMap | null,
  token: string,
): KontextVerweis[] {
  const out: KontextVerweis[] = [];
  const gesehen = new Set<string>();
  const nimm = (v: KontextVerweis) => {
    if (!v.label || gesehen.has(v.label)) return;
    gesehen.add(v.label);
    out.push(v);
  };
  if (eintrag?.grundlage) nimm({ label: eintrag.grundlage });
  for (const fn of struktur?.[token]?.fussnoten ?? []) {
    for (const l of fn.links) {
      if (l.intern) {
        nimm({ label: l.label, pfad: erlassPfadVonKey(l.intern.key, l.intern.ebene), url: l.url });
        continue;
      }
      if (!l.rs) continue;
      const intern = internerErlassFuerSr(l.rs);
      nimm({
        label: l.label,
        pfad: intern ? erlassPfadVonKey(intern.key, intern.ebene) : undefined,
        url: l.url,
      });
    }
  }
  return out;
}

/** Artikelscharfe Material-Dokumente aus dem Kanten-Shard (je Dokument eines). */
export function materialienAmArtikel(shard: KantenShard | null, token: string): number {
  if (!shard) return 0;
  const kanon = normArtikelToken(token);
  const dok = new Set<string>();
  for (const k of shard.kanten) if (k.artikel && normArtikelToken(k.artikel) === kanon) dok.add(k.dok);
  return dok.size;
}

/**
 * Erfasste Entscheide am Artikel aus dem Schaufenster-Shard.
 *
 * B7 (Bug-Check 9.8.2026): Der Shard heisst «Leitfall-Shard», führt aber je
 * Artikel ALLE erfassten Entscheide — Leitentscheide UND Routine-Entscheide
 * (`LeitfallRef.leitcharakter` unterscheidet sie). Die Zahl als
 * «N Leitentscheide» zu beschriften war für 49 Artikel falsch, 12 davon ohne
 * einen einzigen echten Leitentscheid. Gefiltert wird NICHT — die Gesamtzahl
 * ist die nützlichere Auskunft, und ein Filter hätte 12 Artikel fälschlich als
 * praxisfrei gezeigt. Stattdessen sagt die Beschriftung, was gezählt wird
 * («erfasste Entscheide», dieselbe Formel wie das Panel, §5/§8).
 */
export function leitentscheideAmArtikel(shard: LeitfallShard | null, token: string): number {
  return shard?.proArtikel[normArtikelToken(token)]?.length ?? 0;
}
