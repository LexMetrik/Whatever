// ─── Lese-Brücke «Änderungen / Revisionen» (Amtliche Sammlung, Paket 5, W2·6-REV) ──
//
// Projiziert die generierte Revisions-Timeline eines Erlasses aus dem lazy geladenen
// Sidecar public/normtext/revisionen/<KEY>.json auf die Norm. Reine Ladeschicht (§3) —
// kein Inhalt erzeugt, keine Rechtslogik. Schwester zur Entstehungsgeschichte
// (materialien/botschaften.ts): Botschaft = Genese-Absicht, AS-Erlass = tatsächliche
// Änderung. Der Botschafts-Verweis wird NICHT hier aufgelöst (kein zweiter Fetch),
// sondern im KontextPanel gegen die ohnehin geladenen Botschaften gemappt (botschaftKey).
//
// §15: der Sidecar wird erst bei Bedarf (Reader offen) geladen; nie im App-Bundle.
// Übergangslösung bis E1 (dann Projektion aus erlass_fassungen) — siehe Generator.

import { kodiereSchluessel } from './dateiUrl';

/** Ein Timeline-Eintrag in Anzeige-Form (Feld-Teilmenge des Sidecars). */
export interface RevisionBezug {
  /** 'aenderung' = realer AS/oc-Änderungserlass · 'sammelerlass-marker' = Änderung über
   *  einen Sammelerlass anderer SR (nur als Datum bekannt, §8). */
  art: 'aenderung' | 'sammelerlass-marker';
  dateEntryInForce: string;
  ocUri?: string;
  roFundstelle?: string;
  titelDe?: string;
  titelFr?: string;
  titelIt?: string;
  /** Paket-2-Botschafts-Key (nur bei belegtem Match) → im UI zum «Botschaft ansehen»-Link. */
  botschaftKey?: string;
  /** In Kraft, aber noch nicht in den geltenden (gepinnten) Normtext konsolidiert (§8). */
  nichtKonsolidiert?: boolean;
  /** FALSIFIZIERT 12.9.2026, ZWEIMAL (Gegenprüfung PR #827): (1) ursprünglich als
   *  «Fedlex-interner Widerspruch» beschrieben — live widerlegt. (2) die Korrektur behauptete
   *  ihrerseits «Erstpublikation»/«Anhangs-Änderung» als Tatsache — auch das trägt das Tripel
   *  nicht (Gegenbeleg AS 2025 686/SKV: `jolux:rectifies` zeigt dort fälschlich auf einen
   *  anderen Erlass, belegter Fedlex-Datenfehler). Dritte, konservative Fassung + Herleitung:
   *  `scripts/normtext/revisionen-generieren.ts` (`RevisionEintrag.plausibilitaet`). Einziger
   *  bekannter Wert; bewusst kein generischer Switch im UI (Whitelist, kein Ausbau ohne neuen
   *  Befund). */
  plausibilitaet?: 'berichtigung-fremdes-as-dokument';
  /** Begründungstext zum Marker (nur gesetzt, wenn `plausibilitaet` gesetzt ist). */
  plausibilitaetsGrund?: string;
  /** Finding 4b, zweite Stufe (W2·18-FEHLERBUCH): amtlich belegtes «in Kraft für die
   *  Schweiz seit»-Datum, wenn es früher als `dateEntryInForce` («angewendet ab») liegt —
   *  Whitelist auf den einen live verifizierten Fall (FZA/AS 2021 12), s.
   *  `scripts/normtext/revisionen-generieren.ts` (`IN_KRAFT_FUER_CH_WHITELIST`). */
  dateInKraftFuerCh?: string;
  /** Pfad (c), S6-D1 23.9.2026: amtliche Auswirkungs-Typen an diesem Datum (Fedlex
   *  `impact-type`; fehlt bei Einträgen nur aus der SR-Klassierung). Werte und Reihenfolge:
   *  `WIRKUNGEN` in `scripts/normtext/revisionen-generieren.ts`. */
  wirkungen?: string[];
  /** Pfad (c): alle Inkrafttretensdaten desselben Änderungserlasses für diesen Erlass
   *  (aufsteigend), nur bei gestaffeltem Inkrafttreten — jede Etappe ist ein eigener
   *  Eintrag mit demselben `ocUri` (Schlüssel darum `revisionSchluessel`, nie `ocUri`). */
  etappen?: string[];
  /** Pfad (c), §8: das Datum ist das Inkrafttreten des ÄNDERNDEN Erlasses, nicht einer
   *  eigenen Auswirkung auf diesen Erlass (Fedlex gibt dafür kein brauchbares Datum) — es
   *  kann für diesen Erlass abweichen. Herleitung: `RevisionEintrag.datumAusErlass`. */
  datumAusErlass?: boolean;
  /** Fedlex-Live-Link auf den AS-Text bzw. — beim Marker — auf die Fassung dieses Datums (§7c). */
  quelleUrl: string;
}

/**
 * Eindeutiger Schlüssel eines Timeline-Eintrags (Dedupe, React-`key`). Seit Pfad (c)
 * (S6-D1, 23.9.2026) trägt ein gestaffelt in Kraft gesetzter Erlass je Etappe einen eigenen
 * Eintrag mit DEMSELBEN `ocUri` (OR ← AS 2020 4005: 2021-01-01 und 2023-01-01) — ein
 * Schlüssel nur aus `ocUri` verschluckte die zweite Etappe still.
 */
export function revisionSchluessel(r: Pick<RevisionBezug, 'art' | 'ocUri' | 'dateEntryInForce'>): string {
  return `${r.ocUri ?? r.art}@${r.dateEntryInForce}`;
}

interface RevisionSidecar {
  erlassKey: string;
  sr: string;
  abgerufen: string;
  reichweite: string;
  revisionen: RevisionBezug[];
}

// Sidecar-Cache je Erlass-Key: laufende Promise (ein Fetch je Key/Session).
// DREI Ergebnisse, nicht zwei (§8):
//   · `RevisionSidecar`  die Datei ist da und gültig.
//   · `FEHLT`            es GIBT keine Datei für diesen Erlass (404, oder der SPA-Rückfall
//                        von `vite dev`/`preview`: 200 text/html) — eine Auskunft über den
//                        Erlass, kein Fehler (PA-13-B03: für die 10 Sonderansicht-Erlasse
//                        und alle Kantone gibt es keine; die Fläche meldete «konnte nicht
//                        geladen werden»). Bleibt gecacht.
//   · `null`             der Abruf ist GESCHEITERT (Netz, HTTP-Fehler, kaputte Nutzlast).
//                        Wird NICHT gecacht (PE-F4-B01, Muster M-8 `lib/materialien/browse`
//                        und `ladeRevisionShard`): vorher klebte ein einmaliger Netzausfall
//                        bis zum Neuladen der Seite, der Reiter «Änderungen» hatte keinen
//                        Weg zurück.
const FEHLT = Symbol('revisionen-sidecar-fehlt');
type SidecarErgebnis = RevisionSidecar | typeof FEHLT | null;
const cache = new Map<string, Promise<SidecarErgebnis>>();

function ladeSidecar(key: string): Promise<SidecarErgebnis> {
  let p = cache.get(key);
  if (!p) {
    const versuch: Promise<SidecarErgebnis> = (async () => {
      try {
        const res = await fetch(`/normtext/revisionen/${kodiereSchluessel(key)}.json`);
        if (res.status === 404) return FEHLT;
        if (!res.ok) return null;
        // SPA-Rückfall = 404: ein Server ohne die Datei, der stattdessen die App
        // ausliefert (`vite dev`/`vite preview`), antwortet 200 mit HTML — dieselbe
        // Auskunft «keine Datei», kein Leitungsfehler (Muster `ladeBezugsShard`,
        // `lib/rechtsprechung/bezuege`). Fehlt der Header (Test-Doppel), gilt der
        // Parse-Versuch: scheitert er, ist es ein Fehler, kein «fehlt».
        if ((res.headers?.get?.('content-type') ?? '').includes('html')) return FEHLT;
        const s = (await res.json()) as RevisionSidecar;
        return Array.isArray(s?.revisionen) ? s : null;
      } catch {
        return null;
      }
    })();
    p = versuch;
    cache.set(key, versuch);
    // Fehlschlag NICHT festhalten: der nächste Aufruf versucht es erneut. Dieser
    // Handler hängt vor jedem Verbraucher-`then` (er wird hier, vor der Rückgabe,
    // registriert); Erfolg und «fehlt» bleiben für die Sitzung stehen.
    void versuch.then((r) => { if (r === null && cache.get(key) === versuch) cache.delete(key); });
  }
  return p;
}

/** Nur für Tests: den Sidecar-Cache leeren (Test-Isolation, Muster `_leereMaterialManifestCache`). */
export function _leereRevisionenCache(): void {
  cache.clear();
}

/** Zusammengeführte Timeline (Datum absteigend), Reichweiten-Hinweis. */
export interface RevisionAnsicht {
  revisionen: RevisionBezug[];
  reichweite: string | null;
  /** Abrufdatum (ISO) des Sidecars — datengetragener Bezugstag, wo der Erlass keinen
   *  `currency.geprueftAm` hat (PA-7-B02: PATV/VGVP). Fehlt bei `nichtErfasst`. */
  abgerufen?: string | null;
  /** PA-13-B03: für diesen Erlass gibt es KEINE Revisions-Datei (alle angefragten Keys:
   *  404/SPA-Rückfall) — «nicht erfasst», ausdrücklich KEIN Ladefehler. `revisionen` ist
   *  dann leer. Fehlt bei jeder echten Datei, auch mit leerer Liste («keine Änderung»). */
  nichtErfasst?: true;
}

/**
 * Revisions-Timeline zu EINER oder mehreren Normen (lazy). Mehrere normKeys werden über
 * `revisionSchluessel` (ocUri bzw. art + Inkrafttretensdatum) dedupliziert und nach Datum absteigend gemischt.
 * `null` = kein Sidecar lieferte Daten UND mindestens ein Abruf ist gescheitert
 * (Fetch-Fehler, §8) → ehrlicher Fehlerzustand; `nichtErfasst` = für ALLE Keys gibt es
 * keine Datei (PA-13-B03, kein Fehler); leeres `revisionen` = keine erfasste Änderung
 * (Verordnung o. Ä.).
 */
export async function revisionenFuerNorm(normKeys: readonly string[]): Promise<RevisionAnsicht | null> {
  const sidecars = await Promise.all(normKeys.map(ladeSidecar));
  if (sidecars.every((s) => s === null || s === FEHLT)) {
    return sidecars.includes(null) ? null : { revisionen: [], reichweite: null, nichtErfasst: true };
  }

  const seen = new Set<string>();
  const out: RevisionBezug[] = [];
  let reichweite: string | null = null;
  let abgerufen: string | null = null;
  for (const s of sidecars) {
    if (!s || s === FEHLT) continue;
    reichweite ??= s.reichweite;
    abgerufen ??= s.abgerufen ?? null;
    for (const r of s.revisionen) {
      const id = revisionSchluessel(r);
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(r);
    }
  }
  out.sort((a, b) =>
    a.dateEntryInForce < b.dateEntryInForce ? 1
    : a.dateEntryInForce > b.dateEntryInForce ? -1
    : a.art < b.art ? -1 : a.art > b.art ? 1
    : (a.ocUri ?? '') < (b.ocUri ?? '') ? -1 : (a.ocUri ?? '') > (b.ocUri ?? '') ? 1 : 0);
  return { revisionen: out, reichweite, abgerufen };
}

/**
 * W2·5m-LESER-V3/S3 (F5), Schritt 1 von 2: die Inkrafttretens-Daten aller als
 * NICHT KONSOLIDIERT markierten Revisionen, aufsteigend sortiert.
 *
 * Rein und deterministisch (§2): ISO-Daten sortieren lexikografisch =
 * chronologisch, kein `Date.now()`. Hier wird NICHT abgeleitet, ob etwas
 * konsolidiert ist — das entscheidet allein der Generator
 * (`scripts/normtext/revisionen-generieren.ts`, `dateEntryInForce > korpusStand`);
 * sein Marker wird nur ausgewertet. Einträge ohne brauchbares ISO-Datum fallen
 * heraus: sie können keinen Zeitbezug tragen (§8, nichts erfinden).
 */
export function nichtKonsolidierteInkrafttreten(
  revisionen: readonly RevisionBezug[] | undefined,
): string[] {
  return (revisionen ?? [])
    .filter((r) => r.nichtKonsolidiert && /^\d{4}-\d{2}-\d{2}$/.test(r.dateEntryInForce))
    .map((r) => r.dateEntryInForce)
    .sort();
}

/**
 * W2·5m-LESER-V3/S3 (F5), Schritt 2 von 2: das früheste dieser Daten, das am
 * `stichtag` BEREITS IN KRAFT war — oder `null`.
 *
 * ─── Warum dieser Filter unverzichtbar ist (Befund beim Bau, 16.8.2026) ──────
 * Der Marker `nichtKonsolidiert` bedeutet «tritt später in Kraft als der
 * Korpus-Stand» — er umfasst damit AUCH Änderungen, die erst in Zukunft gelten.
 * Gemessen an den 227 Sidecars trugen 66 Erlasse den Marker, aber nur 4 eine
 * Änderung, die tatsächlich schon galt; der späteste Marker lag auf 2034-01-01.
 * Der Satz «Fedlex hat eine seit 01.01.2034 geltende Änderung noch nicht
 * eingearbeitet» wäre schlicht falsch (§1/§8) — die Änderung gilt nicht, sie ist
 * angekündigt. Für Angekündigtes gibt es bereits das eigene, korrekte Wortfeld
 * «nächste Fassung ab …» (P1-d, warn-Rolle). Der Fahrplan verlangt den Filter
 * ausdrücklich («nur bei `nichtKonsolidiert` mit `dateEntryInForce ≤ heute`»,
 * FAHRPLAN-LESER-V3 Kap. 7, Pos. 11/18); mit ihm ergibt sich exakt die dort
 * genannte Erlass-Menge (FZA, STPO, TXG, BGG — plus BMV, dessen Warnung schon
 * die Aufhebungs-Regel unterdrückt).
 *
 * ─── Warum `stichtag` und nicht «heute» (§2) ────────────────────────────────
 * Kein `Date.now()`: der Kopf wird prerendert, eine Bauzeit-Gegenwart veraltete
 * still, und eine Client-Uhr machte dieselbe Seite je nach Gerät verschieden.
 * Massgeblich ist stattdessen ein DATENGETRAGENER Stichtag — `currency.geprueftAm`,
 * der Tag des letzten maschinellen Abgleichs gegen den Fedlex-Konsolidierungs-
 * graphen. Was an diesem Tag belegt in Kraft und unkonsolidiert war, ist es
 * heute erst recht. Die Aussage ist damit konservativ: sie kann höchstens eine
 * Änderung verschweigen, die seit dem letzten Abgleich in Kraft getreten ist,
 * nie eine behaupten, die es nicht ist (§8 — im Zweifel schweigen).
 *
 * Fehlt der Stichtag (kein `geprueftAm` — z. B. bei einem Erlass, dessen Pin
 * nicht der geltenden Fassung entspricht, §8-Härtung P1-d), liefert die Funktion
 * `null`: ohne verifizierten Bezugstag lässt sich «gilt bereits» nicht belegen.
 * Solche Erlasse bleiben über `check:fedlex-versionen` sichtbar.
 */
export function fruehestesInKraft(
  inkrafttreten: readonly string[],
  stichtag: string | null | undefined,
): string | null {
  if (!stichtag) return null;
  return inkrafttreten.find((d) => d <= stichtag) ?? null;
}

/** Locale-Titel eines Eintrags (DE Fallback). Rein. */
export function revisionTitel(r: RevisionBezug, locale: 'de' | 'fr' | 'it'): string | undefined {
  return (locale === 'fr' && r.titelFr) || (locale === 'it' && r.titelIt) || r.titelDe;
}
