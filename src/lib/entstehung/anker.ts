// ─── Botschafts-Anker («Sprung zur Erläuterung») ─────────────────────────────
//
// E2 von «Entstehung am Artikel» (FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.4/§11.6).
// Manche Botschaften im Bundesblatt tragen im amtlichen HTML `<article id="art_N">`
// — damit lässt sich vom Artikel im Gesetz direkt an die Erläuterung in der Botschaft
// springen. Der Sidecar hält NUR diese Anker samt Überschrift; das HTML selbst wird
// NIE gespeichert (§7-Zitat-Regel: massgeblich bleibt die amtliche Fassung, der
// Live-Link steht im Sidecar).
//
// EHRLICHKEIT (§8): die Anker-Vergabe beginnt erst am 16.4.2025 und bleibt seither
// lückenhaft (amts-/werkzeugabhängig, Recherche R3 6.9.2026). Der Sidecar existiert
// deshalb nur für einen kleinen Teil der Botschaften — «kein Sidecar» heisst
// «diese Botschaft trägt keine Artikel-Anker», nie «kein Zusammenhang».
//
// §3 Schichtentrennung: Typen + Lazy-Loader, keine UI, keine Rechtslogik.

import { ladeJson, pruefeFelder } from '../ladeJson';

const PRUEFER = pruefeFelder('materialien/anker/<Botschaft>.json', { anker: 'array' });

/** Ein Artikel-Anker im amtlichen Botschafts-HTML. */
export interface BotschaftAnker {
  /** Amtliche eId im BBl-HTML, z. B. «art_16_c». */
  eId: string;
  /** Kanonischer Artikel-Token (Sidecar-/Korpus-Schreibweise), z. B. «16c». */
  token: string;
  /** Überschrift des Abschnitts, amtlich zitiert (§1, nie umformuliert). */
  ueberschrift: string;
  /** `amtlich` = eId stammt aus dem amtlichen HTML. */
  quelle: 'amtlich';
}

/** Sidecar je Botschaft: `public/materialien/anker/<BOTSCHAFT-KEY>.json`. */
export interface AnkerSidecar {
  /** Botschafts-Key (= Dateiname ohne .json). */
  botschaft: string;
  /** ELI-Kurzform der Botschaft, z. B. «fga/2025/1528». */
  fga: string;
  /** Fedlex-Live-Link zur Botschaft (§7c). */
  quelleUrl: string;
  /** Filestore-URL des ausgewerteten HTML — aus `isExemplifiedBy`, NIE konstruiert. */
  htmlUrl: string;
  /** sha256 über das abgerufene HTML (Drift-/Currency-Token, §7d). */
  sha: string;
  /** HTTP `Last-Modified` des Filestore-Objekts (HEAD-Alarm ohne Re-Parse). */
  lastModified: string | null;
  /** HTTP `Content-Length` in Bytes. */
  contentLength: number | null;
  /** Abrufdatum ISO (§7a). */
  abgerufen: string;
  /** Erlass-Keys der Botschaft (amtlich aus dem SR-Join der Botschaften-Query). */
  erlassKeys: string[];
  /** true = Mantelvorlage (mehrere Erlasse): die Anker gelten auf Erlass-Ebene,
   *  eine artikelscharfe Zuordnung je Erlass wird NICHT behauptet (§8). */
  mantel: boolean;
  /** eIds, die im HTML MEHRFACH vorkommen (Mantel-Anteil): die Zuordnung Artikel →
   *  Erläuterung ist nicht eindeutig, deshalb stehen sie NICHT in `anker` (§1 — ein
   *  falscher Sprung ist schlimmer als kein Sprung). Der Befund bleibt hier sichtbar (§8). */
  mehrdeutig: string[];
  anker: BotschaftAnker[];
}

/** Verzeichnis der Sidecars (öffentliche Auslieferung). */
export const ANKER_DIR = 'public/materialien/anker';

const cache = new Map<string, Promise<AnkerSidecar | null>>();

/**
 * Lädt den Anker-Sidecar einer Botschaft — LAZY, erst wenn die Entstehungs-Karte
 * aufgeklappt ist (§15: im Lesefluss null Byte). Fehlt der Sidecar, ist das ein
 * gültiger Zustand (keine Anker), kein Fehler.
 */
export function ladeAnkerSidecar(botschaftKey: string): Promise<AnkerSidecar | null> {
  const vorhanden = cache.get(botschaftKey);
  if (vorhanden) return vorhanden;
  const p = ladeJson<AnkerSidecar>(`/materialien/anker/${encodeURIComponent(botschaftKey)}.json`, PRUEFER)
    .catch(() => null);
  cache.set(botschaftKey, p);
  return p;
}

/** Anker zu einem Artikel-Token («16c») — null, wenn die Botschaft ihn nicht erläutert. */
export function ankerFuerToken(s: AnkerSidecar, token: string): BotschaftAnker | null {
  return s.anker.find((a) => a.token === token) ?? null;
}

/** Tiefer Link in die amtliche Botschaft (Live-Link + Fragment, §7c). */
export function ankerUrl(s: AnkerSidecar, a: BotschaftAnker): string {
  return `${s.quelleUrl}#${a.eId}`;
}
