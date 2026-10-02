// ─── Kontext-Auflösung: Norm ↔ Entscheid ↔ Material ↔ Werkzeug ──────────────
//
// EINE zentrale Auflöse-Schicht für das einheitliche «Kontext»-Panel (B3) der
// drei Korpus-Reader (Gesetz, Entscheid, Material). Sie verknüpft NUR über die
// bereits vorhandenen `normKeys` der drei Korpora — keine neue materielle
// Zuordnung, keine Rechtslogik (§3). Jede Zuordnung lebt weiterhin an genau
// einer Stelle (§5): Werkzeuge/Materialien in normtext/werkzeuge.ts, Entscheide
// im build-time Norm→Entscheid-Index. Diese Datei projiziert sie nur zusammen.
//
// «Selbst-Korpus» wird ausgelassen: der Gesetz-Reader IST die Norm (zeigt keine
// Normen-Gruppe), der Material-Reader IST das Material, der Entscheid-Reader IST
// der Entscheid. So entstehen keine Selbstverweise.

import {
  werkzeugeFuerEntscheid, werkzeugeFuerZitate, materialienFuerNorm,
  type Werkzeug, type MaterialBezug,
} from './normtext/werkzeuge';
import { ERLASS_REGISTER } from './normtext/register';
import { rechtsprechungFuerErlass, leitfaelleFuerArtikel, type EntscheidRef, type LeitfallRef } from './rechtsprechung/norm-index';
import { ladeMaterialManifest } from './materialien/browse';
import { ladeKantenShardErgebnis, type KantenShard } from './materialien/kanten-shard';
import type { BrowseMaterial, MaterialManifest } from './materialien/typen';
import type { Herkunft } from './verzahnung/typen';
import { erlassPfad } from './normtext/erlassAdresse';
import { nummerAusToken } from './reiterStelle';

export type { MaterialBezug, EntscheidRef };

/** Quelle-Korpus des Readers, der das Panel zeigt. */
export type KontextTyp = 'norm' | 'entscheid' | 'material';

// Die frühere Ansicht des Artikel-Kontexts (W2·19-GLIEDERUNG/S7: Typen
// `ArtikelKontextAnsicht`/`KontextVerweis`, gebaut in `src/pages/gesetz-leser/
// artikelKontext.ts`, gezeigt als Wegweiser «Zu Art. X» im KontextPanel) ist am
// 1.10.2026 gelöscht (W2·27-BUND-FERTIG, P3): kein Produktionsaufrufer.
// ABGRENZUNG bleibt: `artikelZitate` (`kontextSync` unten) speist AUSSCHLIESSLICH
// `werkzeugeFuerZitate()` und ist die Zitat-Liste eines ENTSCHEIDS.

/** Verweis auf eine Erlass-Detailseite (aufgelöst über das ERLASS_REGISTER). */
export interface NormBezug {
  key: string;
  kuerzel: string;
  titel: string;
  ebene: 'bund' | 'kanton';
  pfad: string;
}

// Schneller Key→Erlass-Zugriff (einmalig, modullokal) statt linearer Suche je
// normKey (§6.4: kein O(n²) pro Render).
const ERLASS_BY_KEY: ReadonlyMap<string, (typeof ERLASS_REGISTER)[number]> =
  new Map(ERLASS_REGISTER.map((e) => [e.key, e]));

/**
 * normKeys → Erlass-Detailverweise. Nur im Register vorhandene Keys werden
 * verlinkt (ein unbekannter Key ergäbe sonst einen toten Link, §8); Reihenfolge
 * = Eingabereihenfolge, dedupliziert.
 */
export function normenFuer(normKeys: readonly string[]): NormBezug[] {
  const seen = new Set<string>();
  const out: NormBezug[] = [];
  for (const k of normKeys) {
    if (seen.has(k)) continue;
    const e = ERLASS_BY_KEY.get(k);
    if (!e) continue;
    seen.add(k);
    out.push({
      key: e.key, kuerzel: e.kuerzel, titel: e.titel, ebene: e.ebene,
      pfad: erlassPfad(e),
    });
  }
  return out;
}

/** Materialien über mehrere normKeys vereinigt + dedupliziert (Behörde→key sortiert). */
export function materialienFuer(normKeys: readonly string[]): MaterialBezug[] {
  const seen = new Set<string>();
  const out: MaterialBezug[] = [];
  for (const k of normKeys) {
    for (const m of materialienFuerNorm(k)) {
      if (!seen.has(m.key)) { seen.add(m.key); out.push(m); }
    }
  }
  return out.sort((a, b) => a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel) || a.key.localeCompare(b.key));
}

/** Synchron (in-Bundle) auflösbare Gruppen — ohne den Selbst-Korpus. */
export interface KontextSync {
  normen: NormBezug[];
  materialien: MaterialBezug[];
  werkzeuge: Werkzeug[];
}

export function kontextSync(
  typ: KontextTyp,
  normKeys: readonly string[],
  /** Artikel-scharfe Zitat-Strings (V1, nur Entscheid-Reader): «Art. 448 ZGB»,
   *  «Art. 321 StGB» … Wenn gesetzt, werden die «Passende Werkzeuge» artikelscharf
   *  aufgelöst (Rausch-Filter #28) statt grob über den Erlass — so zeigt ein
   *  Entscheid nur Werkzeuge zu tatsächlich zitierten Artikeln. */
  artikelZitate?: readonly string[],
): KontextSync {
  return {
    // Norm-Reader IST die Norm → keine Normen-Gruppe (Selbstverweis vermeiden).
    normen: typ === 'norm' ? [] : normenFuer(normKeys),
    // Material-Reader IST das Material → keine Materialien-Gruppe.
    materialien: typ === 'material' ? [] : materialienFuer(normKeys),
    // Werkzeuge sind für alle drei Korpora fremd. Am Entscheid mit Zitat-Liste
    // artikelscharf (kein Erlass-Rauschen); sonst grob über den Erlass.
    werkzeuge: artikelZitate && artikelZitate.length > 0
      ? werkzeugeFuerZitate(artikelZitate)
      : werkzeugeFuerEntscheid([...normKeys]),
  };
}

// ─── Amtliche Materialien (asynchron: Kanten-Shards, E6a·M5) ─────────────────
//
// Die im Bundle liegenden kuratierten Materialien (materialienFuer, sync) decken
// nur die ~26 Alt-Einträge des MATERIAL_REGISTER. Die per Adapter erfassten
// Behördenpublikationen (MWSTG/MWSTV/DBG/VStG/StG/DSG/… — 300+ Dokumente, tausende
// artikelscharfe Kanten) liegen als erlass-lokale Shards (§15, nie im Bundle) und
// werden HIER lazy nachgeladen. herkunft = DB-`quelle` (amtlich/kuratiert/
// maschinell); der Badge markiert die Abweichung ('maschinell', §1.2/§1.3 — der
// kuratierte/amtliche Normalfall bleibt nackt). Rein projizierend (§3).

/** §8-Herkunft je Dokument aggregiert. Doc-uniform in der Praxis; bei
 *  Misch-Provenienz gewinnt die schwächste (maschinell > kuratiert > amtlich),
 *  damit die UI nie eine Heuristik als 'amtlich' ausgibt. */
function aggregiereHerkunft(quellen: ReadonlySet<string>): Herkunft {
  if (quellen.has('maschinell')) return 'maschinell';
  if (quellen.has('kuratiert')) return 'kuratiert';
  return 'amtlich';
}

/** Natürlicher Vergleich zweier Artikel-Token ('2' < '11'; '20' < '20_a'). */
function vergleicheArtikel(a: string, b: string): number {
  const na = parseInt(a, 10), nb = parseInt(b, 10);
  if (Number.isFinite(na) && Number.isFinite(nb) && na !== nb) return na - nb;
  return a < b ? -1 : a > b ? 1 : 0;
}

interface DokSammler {
  quellen: Set<string>;
  artikel: Set<string>;
  ziffern: Set<string>;
}

/**
 * Amtliche Materialien zu den normKeys aus den Kanten-Shards (asynchron, lazy).
 * Je Shard-Dokument EIN Eintrag (aggregiert über alle seine Kanten): repräsentativer
 * Artikel (kleinster Token) + «u. a.» bei mehreren; reine Erlass-Ebene ohne
 * Fundstelle bleibt ohne Sublabel. Dokument-Metadaten (Titel/Behörde/Doktyp/Stand)
 * aus dem Browse-Register (register.json). Der Material-Reader IST das Material →
 * leer (kein Selbstverweis). Dedupliziert über alle normKeys.
 *
 * Die Antwort trägt `fehler`: ein Ladefehler und «nichts erfasst» sind darin
 * unterscheidbar (§8). Die frühere dünne Fassung `kontextSoftLaw` (nur die Liste)
 * hatte seit #1196 keinen Aufrufer und ist am 1.10.2026 entfernt.
 *
 * Soft-Law-Liste + ob sie UNVOLLSTÄNDIG ist (§8, W2·27-BUND-FERTIG 30.9.2026):
 *  `fehler` = das Manifest oder mindestens ein Kanten-Shard war nicht ladbar —
 *  die Liste ist dann keine Auskunft über den Bestand, sondern ein Rest. Ein
 *  Erlass ohne Shard (`leer`/404) ist KEIN Fehler. */
export interface SoftLawErgebnis { liste: MaterialBezug[]; fehler: boolean }

export async function kontextSoftLawErgebnis(typ: KontextTyp, normKeys: readonly string[]): Promise<SoftLawErgebnis> {
  if (typ === 'material') return { liste: [], fehler: false };
  const manifest = await ladeMaterialManifest();
  if (!manifest) return { liste: [], fehler: true };
  const regByKey = new Map<string, BrowseMaterial>(manifest.materialien.map((m) => [m.key, m]));

  const proDok = new Map<string, DokSammler>();
  const reihenfolge: string[] = [];
  let fehler = false;
  for (const k of new Set(normKeys)) {
    const ergebnis = await ladeKantenShardErgebnis(k);
    if (ergebnis.zustand === 'fehler') { fehler = true; continue; }
    if (ergebnis.zustand !== 'ok') continue; // leer = Erlass ohne Material-Kanten (Antwort, kein Fehler)
    const shard = ergebnis.shard;
    for (const kante of shard.kanten) {
      let s = proDok.get(kante.dok);
      if (!s) { s = { quellen: new Set(), artikel: new Set(), ziffern: new Set() }; proDok.set(kante.dok, s); reihenfolge.push(kante.dok); }
      s.quellen.add(kante.quelle);
      if (kante.artikel) s.artikel.add(kante.artikel);
      else for (const f of kante.fundstellen) if (f.z) s.ziffern.add(f.z);
    }
  }

  const out: MaterialBezug[] = [];
  for (const dok of reihenfolge) {
    const reg = regByKey.get(dok);
    if (!reg) continue; // nicht (mehr) gelistet → still auslassen (§8, kein toter Link)
    const s = proDok.get(dok)!;
    const artikelSort = [...s.artikel].sort(vergleicheArtikel);
    const repArtikel = artikelSort[0];
    let artikel: string | undefined;
    let sublabel: string | undefined;
    if (repArtikel) {
      artikel = repArtikel;
      sublabel = artikelSort.length > 1
        ? `via Art. ${nummerAusToken(repArtikel)} u. a.`
        : `via Art. ${nummerAusToken(repArtikel)}`;
    } else if (s.ziffern.size === 1) {
      sublabel = [...s.ziffern][0]; // «Ziff. 6.10» — nur wenn eindeutig (sonst kein arbiträrer Griff)
    }
    out.push({
      key: reg.key, titel: reg.titel, behoerdeKuerzel: reg.behoerdeKuerzel,
      doktypLabel: reg.doktypLabel, nummer: reg.nummer,
      pfad: `/materialien/${encodeURIComponent(reg.key)}`,
      herkunft: aggregiereHerkunft(s.quellen), stand: reg.stand, artikel, sublabel,
    });
  }
  return { liste: out.sort((a, b) => a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel) || a.key.localeCompare(b.key)), fehler };
}

/**
 * Vereinigt die synchronen (in-Bundle kuratierten) Materialien mit den asynchron
 * geladenen Soft-Law-Kanten. Dedupliziert per key (der bestehende kuratierte
 * Eintrag gewinnt, §2.6 «bestehender Key gewinnt»); die Mengen sind in der Praxis
 * disjunkt (kuratierte vs. DB-Dokumente), die Dedupe ist Absicherung. Sortierung
 * = Behörde-Kürzel → key (wie beide Quellen).
 */
export function mischeMaterialien(sync: readonly MaterialBezug[], softLaw: readonly MaterialBezug[]): MaterialBezug[] {
  const seen = new Set(sync.map((m) => m.key));
  const out = [...sync];
  for (const m of softLaw) if (!seen.has(m.key)) { seen.add(m.key); out.push(m); }
  return out.sort((a, b) => a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel) || a.key.localeCompare(b.key));
}

// ─── Artikelscharfer Kontext (W2·5d U-VERWEIS/A7, David 5.7.2026) ────────────
//
// Für das strukturierte Verweis-Popover: zu EINEM (Erlass, Artikel) die
// massgeblichen Entscheide (Leitfall-Shard, dieselbe Quelle wie der Artikel-Fuss)
// + die artikelscharfen Material-Kanten (Kanten-Shard, dieselbe Quelle wie das
// Kontext-Panel). KEINE neue Zuordnung — reine Projektion der bestehenden Shards
// auf einen Artikel (§3/§5); beide Loader teilen ihre Promise-Caches mit dem
// Reader (kein Doppel-Fetch, §15.3).

/** Artikelscharfe Material-Kante fürs Popover (MaterialBezug + Fundstelle). */
export interface ArtikelKontext {
  entscheide: LeitfallRef[];
  materialien: MaterialBezug[];
  /** §8 (W2·27-BUND-FERTIG 30.9.2026): die Material-Quelle ist gescheitert —
   *  `materialien: []` ist dann KEINE Auskunft «nichts erfasst». */
  materialienFehler: boolean;
}

/**
 * Artikelscharfe Materialien zu (erlassKey, artikelToken) aus dem Kanten-Shard,
 * mit der Auskunft, ob eine leere Liste ein Ladefehler ist (§8): Shard
 * gescheitert, oder Shard da und das Manifest (Titel, Behörde) fehlt. Ein Erlass
 * ohne Shard ist eine ANTWORT (`fehler: false`).
 * Je Dokument EIN Eintrag; Sublabel = Fundstellen-Ziffer (eindeutig) bzw.
 * «Ziff. X u. a.» bei mehreren. Dokument-Metadaten aus dem Browse-Register;
 * nicht (mehr) gelistete Dokumente still ausgelassen (§8, kein toter Link).
 * (Die frühere dünne Fassung `materialienFuerArtikel` ohne `fehler` hatte seit
 * #1196 keinen Aufrufer und ist am 1.10.2026 entfernt.)
 */
async function materialienFuerArtikelErgebnis(
  erlassKey: string, artikelToken: string,
): Promise<{ materialien: MaterialBezug[]; fehler: boolean }> {
  const [ergebnis, manifest] = await Promise.all([ladeKantenShardErgebnis(erlassKey), ladeMaterialManifest()]);
  const shard = ergebnis.zustand === 'ok' ? ergebnis.shard : null;
  return {
    materialien: projiziereMaterialien(shard, manifest, artikelToken),
    fehler: ergebnis.zustand === 'fehler' || (shard !== null && manifest === null),
  };
}

/**
 * Die reine Projektion hinter `materialienFuerArtikelErgebnis` — dieselbe Rechnung, nur
 * ohne das Laden davor.
 *
 * HERAUSGEZOGEN IN W2·24-R5-F1K (D30, 6.9.2026), OHNE EINE ZEILE ZU ÄNDERN: die
 * Bezüge-Zeile am Artikelkopf braucht die Materialien VIELER Artikel desselben
 * Erlasses. Über die async-Fassung hiesse das ein `await` je Artikel — und, weil
 * jeder Aufruf beide Loader erneut anfragt, ein Effekt je Artikel-Komponente
 * (im OR 1686 davon, §15). Mit der Projektion lädt der Leser Shard und Manifest
 * EINMAL je Erlass (dasselbe Muster wie die Zähl-Datei) und schlägt danach
 * synchron nach. Zwei Aufrufer, EINE Rechnung (§5) — die async-Fassung ist jetzt
 * ihr Wrapper, ihr Verhalten ist unverändert.
 */
export function projiziereMaterialien(
  shard: KantenShard | null, manifest: MaterialManifest | null, artikelToken: string,
): MaterialBezug[] {
  if (!shard || !manifest) return [];
  const regByKey = new Map<string, BrowseMaterial>(manifest.materialien.map((m) => [m.key, m]));
  const proDok = new Map<string, DokSammler>();
  const reihenfolge: string[] = [];
  for (const kante of shard.kanten) {
    if (kante.artikel !== artikelToken) continue;
    let s = proDok.get(kante.dok);
    if (!s) { s = { quellen: new Set(), artikel: new Set(), ziffern: new Set() }; proDok.set(kante.dok, s); reihenfolge.push(kante.dok); }
    s.quellen.add(kante.quelle);
    for (const f of kante.fundstellen) if (f.z) s.ziffern.add(f.z);
  }
  const out: MaterialBezug[] = [];
  for (const dok of reihenfolge) {
    const reg = regByKey.get(dok);
    if (!reg) continue;
    const s = proDok.get(dok)!;
    const ziffern = [...s.ziffern];
    const sublabel = ziffern.length === 1 ? ziffern[0]
      : ziffern.length > 1 ? `${ziffern[0]} u. a.` : undefined;
    out.push({
      key: reg.key, titel: reg.titel, behoerdeKuerzel: reg.behoerdeKuerzel,
      doktypLabel: reg.doktypLabel, nummer: reg.nummer,
      pfad: `/materialien/${encodeURIComponent(reg.key)}`,
      herkunft: aggregiereHerkunft(s.quellen), stand: reg.stand,
      artikel: artikelToken, sublabel,
    });
  }
  return out.sort((a, b) => a.behoerdeKuerzel.localeCompare(b.behoerdeKuerzel) || a.key.localeCompare(b.key));
}

/**
 * Der ganze artikelscharfe Kontext fürs Verweis-Popover (A7): Entscheide +
 * Materialien parallel geladen. Rein projizierend, deterministisch je Shard-Stand.
 */
export async function kontextFuerArtikel(erlassKey: string, artikelToken: string): Promise<ArtikelKontext> {
  const [entscheide, { materialien, fehler }] = await Promise.all([
    leitfaelleFuerArtikel(erlassKey, artikelToken),
    materialienFuerArtikelErgebnis(erlassKey, artikelToken),
  ]);
  return { entscheide, materialien, materialienFehler: fehler };
}

/**
 * Entscheide zu den normKeys (asynchron: Norm→Entscheid-Index als Lazy-JSON).
 * Der Entscheid-Reader IST der Entscheid → leer (keine Entscheid-Gruppe, kein
 * Selbstverweis). Vereinigt über alle normKeys, dedupliziert, Reihenfolge des
 * Index erhalten (relevanz-/leit-vorsortiert build-time).
 */
export async function kontextEntscheide(typ: KontextTyp, normKeys: readonly string[]): Promise<EntscheidRef[]> {
  if (typ === 'entscheid') return [];
  const seen = new Set<string>();
  const out: EntscheidRef[] = [];
  for (const k of normKeys) {
    for (const r of await rechtsprechungFuerErlass(k)) {
      if (!seen.has(r.key)) { seen.add(r.key); out.push(r); }
    }
  }
  return out;
}
