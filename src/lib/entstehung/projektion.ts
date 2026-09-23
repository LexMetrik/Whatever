// ─── Entstehungs-Projektion je Erlass («warum wurde dieser Artikel geändert?») ─
//
// E3 von «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.5/§11.6).
//
// ── WARUM ES DIESE DATEI ÜBERHAUPT GIBT ───────────────────────────────────────
// Die Entstehungs-Karte am Artikel braucht zu einem Änderungs-Ereignis der
// Historie drei Auskünfte: WIE der Änderungserlass heisst, WELCHE Botschaft ihn
// begründet und WIE deren Verfahren lief. Alle drei liegen bereits vor — aber an
// Orten, die für einen Klick am Artikel zu schwer sind:
//
//   `public/materialien/register.json`        2 116 KB (1 564 Materialien)
//   `public/normtext/revisionen/<KEY>.json`   bis 132 KB je Erlass
//
// Das Register ist der Ladekanal der Materialien-ÜBERSICHT; als Ladekanal EINER
// Karte an EINEM Artikel wäre es zwei Grössenordnungen zu teuer (§15). Diese
// Projektion ist darum die schlanke Sicht je Erlass: nur die Änderungen, die in
// der Fassungshistorie dieses Erlasses wirklich vorkommen, und nur die
// Botschaften, die diese Änderungen begründen.
//
// ── SIE IST KEINE ZWEITE WAHRHEIT (§5) ────────────────────────────────────────
// Nichts hier wird gepflegt. Der Generator (`scripts/entstehung/
// entstehung-projektion.ts`) leitet jedes Feld deterministisch aus den
// bestehenden Artefakten ab — Historie-Shard (welche oc kommen vor),
// Revisions-Sidecar (Titel + `botschaftKey` je oc), Botschaften-Quelle (Titel,
// Nummer, Live-Link, Stand, Verfahrenskette) — und das Tor `check:entstehung`
// rechnet sie nach. Gepflegt wird weiterhin nur die Quelle; ändert sie sich,
// ändert sich die Projektion beim nächsten Lauf mit.
//
// ── WAS SIE NICHT TUT ─────────────────────────────────────────────────────────
// Sie nimmt NUR den oc-Weg (Kritik C8, gemessen 6.9.2026: oc 33,6 % erfasste
// Botschaften, fga 34,2 %, Vereinigung 35,1 %). Die fga-Fussnote am Ereignis
// bleibt IMMER Live-Link — sie steht schon im Historie-Shard und wird hier nicht
// kopiert. Und sie behauptet nie eine Botschaft, die das Revisions-Sidecar nicht
// führt: «keine erfasste Botschaft» ist ein Zustand der Karte (§8), kein Anlass
// zu raten (§2).
//
// §3 Schichtentrennung: Typen, reine Helfer, Lazy-Loader — keine UI.

import type { VerfahrensEreignis } from '../materialien/verfahren';
import { kodiereSchluessel } from '../normtext/dateiUrl';

/**
 * Versionierte Bauart der Projektion.
 *
 * Muster der Synopse-Spec (§11.6, «Normalisierungsprofil versioniert und nie
 * editiert»): ändert sich die Ableitungsregel, entsteht `/2` DANEBEN — sonst
 * entwertete jede Generator-Korrektur rückwirkend alle ausgelieferten Dateien,
 * ohne dass es jemandem auffiele.
 */
export const PROJEKTION_PROFIL = 'entstehung-leser/1';

/** Eine Änderung dieses Erlasses, adressiert über ihre amtliche oc-Kurzform. */
export interface EntstehungAenderung {
  /** Titel des Änderungserlasses (`titelDe` im Revisions-Sidecar); fehlt er
   *  dort, steht hier nichts — die Karte zeigt dann die AS-Fundstelle (§8). */
  titel?: string;
  /** Amtlicher Live-Link zum Änderungserlass (§7c). */
  url: string;
  /** AS-Fundstelle («AS 2018 5343»), sofern das Sidecar sie führt. */
  as?: string;
  /** Inkrafttreten laut Revisions-Sidecar (ISO) — die Gegenprobe zum Datum der
   *  Fussnote; weicht sie ab, zeigt die Karte beide (§8, nie still glätten). */
  inkraft?: string;
  /** Schlüssel der erfassten Botschaft, sofern das Sidecar ihn führt. */
  botschaft?: string;
}

/** Eine erfasste Botschaft mit ihrer Verfahrenskette. */
export interface EntstehungBotschaft {
  /** Amtlicher Titel (Zitat, nie umformuliert §1). */
  titel: string;
  /** Geschäftsnummer der Bundesversammlung («14.023»). */
  nummer?: string;
  /** Fedlex-Live-Link zur Botschaft (§7c). */
  url: string;
  /** Publikationsdatum der Botschaft (ISO). */
  stand: string;
  /** Trägt diese Botschaft einen Anker-Sidecar? (Nur dann lohnt der Lade-Versuch
   *  für den Chip «Sprung zur Erläuterung» — `./anker.ts`.) */
  anker?: true;
  /** Verfahrenskette der Vorlage (amtliche `type-projet`-Codes, E1). */
  ereignisse?: VerfahrensEreignis[];
}

/** Die ausgelieferte Datei `public/materialien/entstehung/<KEY>.json`. */
export interface EntstehungProjektion {
  erlass: string;
  profil: typeof PROJEKTION_PROFIL;
  /** Abrufdatum der Revisions-Erhebung, aus der Titel und Botschafts-Bindung
   *  stammen (§7a — die Karte zeigt es sichtbar an). */
  abgerufen: string;
  /** oc-Kurzform («oc/2018/807») → Änderung. */
  aenderungen: Record<string, EntstehungAenderung>;
  /** Botschafts-Schlüssel → Botschaft. */
  botschaften: Record<string, EntstehungBotschaft>;
}

/**
 * oc-Kurzform aus einer Fedlex-URI («…/eli/oc/2018/807» → «oc/2018/807»).
 *
 * DIESELBE Regel für beide Seiten des Joins: die Historie-Fussnote führt die
 * Datenhost-Form (`fedlex.data.admin.ch/eli/oc/…`), das Revisions-Sidecar
 * dieselbe — aber die Karte darf sich darauf nicht verlassen, und ein
 * Host-Unterschied darf keinen Treffer verhindern (§7: nie URL konstruieren,
 * immer normalisieren). `null` = keine oc-URI.
 */
export function ocKurzform(uri: string | null | undefined): string | null {
  if (!uri) return null;
  const t = uri.match(/\/eli\/(oc\/[^?#]+?)\/?(?:\/(?:de|fr|it|rm|en))?$/);
  return t ? t[1] : null;
}

/** Änderung zu einem Historie-Ereignis (über die erste oc-Quelle), sonst null. */
export function aenderungFuer(
  p: EntstehungProjektion | null | undefined,
  quellen: ReadonlyArray<{ url?: string | null }>,
): { oc: string; a: EntstehungAenderung } | null {
  if (!p) return null;
  for (const q of quellen) {
    const oc = ocKurzform(q.url);
    if (oc && p.aenderungen[oc]) return { oc, a: p.aenderungen[oc] };
  }
  return null;
}

// ── Lazy-Loader (ein Fetch je Erlass, gecacht als laufende Promise) ──────────
// Bauart byte-gleich zu `historie-laden.ts`/`anker.ts` (§5): 404 = kein Eintrag
// (kein Fehler, still), transienter Fehler wird NICHT dauerhaft als null
// gecacht. Aufgerufen wird er ERST, wenn die Rubrik «Fassung» offen steht —
// im Lesefluss kostet die Karte null Byte (Auflage David 6.9.2026, Sonde
// `e2e/entstehung-karte-e3`).

const cache = new Map<string, Promise<EntstehungProjektion | null>>();

export function ladeEntstehungProjektion(erlassKey: string): Promise<EntstehungProjektion | null> {
  const vorhanden = cache.get(erlassKey);
  if (vorhanden) return vorhanden;
  const p = (async () => {
    try {
      const res = await fetch(`/materialien/entstehung/${kodiereSchluessel(erlassKey)}.json`);
      if (res.status === 404) return null;
      if (!res.ok) { cache.delete(erlassKey); return null; }
      return (await res.json()) as EntstehungProjektion;
    } catch {
      cache.delete(erlassKey);
      return null;
    }
  })();
  cache.set(erlassKey, p);
  return p;
}
