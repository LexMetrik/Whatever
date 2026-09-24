// ─── Client-Schicht der Rubrik «Materialien» ────────────────────────────────
//
// Lädt das Browse-Manifest (public/materialien/register.json) lazy und stellt
// reine Gruppier-/Filter-Helfer bereit. Reine Ladeschicht (§3) — kein Inhalt
// erzeugt. Klon des Musters aus src/lib/normtext/browse.ts (eigener Namespace,
// das Original bleibt unberührt, §12).

import type {
  BrowseMaterial, MaterialManifest, MaterialI18nManifest, MaterialTitelI18n,
  BehoerdeId, DoktypId,
} from './typen';
import { BEHOERDEN, BEHOERDE_RANG, DOKTYP_LABEL } from './register';
import type { Rechtsgebiet } from '../normtext/register';

// ── Manifest (einmal, gecacht als laufende Promise) ──────────────────────────
let manifestPromise: Promise<MaterialManifest | null> | null = null;

export async function ladeMaterialManifest(): Promise<MaterialManifest | null> {
  if (!manifestPromise) {
    const versuch = (async () => {
      try {
        const res = await fetch('/materialien/register.json');
        if (!res.ok) return null;
        const m = (await res.json()) as MaterialManifest;
        return Array.isArray(m.materialien) ? m : null;
      } catch {
        return null;
      }
    })();
    manifestPromise = versuch;
    // S6 · Befund M-8 (23.9.2026): ein EINMALIGER Fehlschlag klebte bis zum
    // Neuladen der Seite — der Cache hielt die `null`-Promise, jeder spätere
    // Aufrufer bekam denselben Fehler, auch nach Rückkehr des Netzes. Ein
    // Fehlschlag wird darum NICHT gecacht (dasselbe Muster wie
    // `lib/verzahnung/artikel-revisionen.ladeRevisionShard`): der nächste
    // Aufruf versucht es erneut. Nur der Erfolg bleibt für die Sitzung stehen.
    void versuch.then((m) => { if (m === null && manifestPromise === versuch) manifestPromise = null; });
  }
  return manifestPromise;
}

// ── FR/IT-Titel (eigene Projektion, eigener Abruf) ───────────────────────────
//
// Getrennt vom Kern, weil der deutsche Lesefluss sie nie anfasst: 70,6 KB gzip,
// die 2026 jede Leserseite mitzog (Messung 12.9.2026). Die Datei wird NUR geholt,
// wenn die Oberfläche wirklich auf FR oder IT steht (§15: null Byte für den Normalfall).
//
// DREI Zustände, nicht zwei (Gegenprüfungs-Auflage #802, §8): «nicht nötig» (die
// Oberfläche steht auf Deutsch), «geladen» und «nicht geladen». Ein gemeinsames
// `null` für den ersten und den letzten Fall wäre genau die stille Stelle, die die
// Auflage rügt — der Leser sähe deutsche Titel und erführe nie, dass ein Abruf
// fehlgeschlagen ist. Der Unterschied zwischen «nichts erfasst» und «nicht
// erreichbar» ist derselbe, den `ui/AbrufFehler` im Ton führt.
export type TitelI18nStand =
  | { art: 'nicht-noetig' }
  | { art: 'geladen'; karte: Map<string, MaterialTitelI18n> }
  | { art: 'nicht-geladen' };

let i18nPromise: Promise<TitelI18nStand> | null = null;

export async function ladeMaterialTitelI18n(locale: string): Promise<TitelI18nStand> {
  if (locale !== 'fr' && locale !== 'it') return { art: 'nicht-noetig' };
  if (!i18nPromise) {
    i18nPromise = (async (): Promise<TitelI18nStand> => {
      try {
        const res = await fetch('/materialien/register-i18n.json');
        if (!res.ok) return { art: 'nicht-geladen' };
        const m = (await res.json()) as MaterialI18nManifest;
        if (!m || typeof m.titel !== 'object' || m.titel === null) return { art: 'nicht-geladen' };
        return { art: 'geladen', karte: new Map(Object.entries(m.titel)) };
      } catch {
        return { art: 'nicht-geladen' };
      }
    })();
  }
  return i18nPromise;
}

/** Warum ein Eintrag den deutschen Titel zeigt, obwohl die Oberfläche auf fr/it steht.
 *  `undefined` = kein Rückfall (deutsche Oberfläche oder Übersetzung vorhanden). */
export type TitelRueckfall = 'nicht-erfasst' | 'nicht-geladen';

/** Die Übersetzung eines Eintrags in der gewählten Sprache — plus, wenn sie fehlt,
 *  der GRUND (§8: der Leser soll unterscheiden können, ob nichts erfasst ist oder
 *  ob ein Abruf scheiterte). Rein, ohne Netz. */
export function titelUebersetzung(
  key: string, locale: string, stand: TitelI18nStand,
): { titelFr?: string; titelIt?: string; titelRueckfall?: TitelRueckfall } {
  if (stand.art === 'nicht-noetig') return {};
  if (stand.art === 'nicht-geladen') return { titelRueckfall: 'nicht-geladen' };
  const t = stand.karte.get(key);
  const uebersetzt = locale === 'fr' ? t?.fr : locale === 'it' ? t?.it : undefined;
  if (!uebersetzt) return { titelRueckfall: 'nicht-erfasst' };
  return { titelFr: t?.fr, titelIt: t?.it };
}

/** Findet den Material-Eintrag eines Schlüssels (key) im Manifest. */
export async function ladeMaterial(key: string): Promise<BrowseMaterial | null> {
  const m = await ladeMaterialManifest();
  return m?.materialien.find((x) => x.key === key) ?? null;
}

// ── Gruppieren / Filtern (rein, testbar) ─────────────────────────────────────

export interface BehoerdeGruppe {
  behoerde: BehoerdeId;
  name: string;
  kuerzel: string;
  materialien: BrowseMaterial[];
}

/** Materialien nach Behörde (Anzeige-Reihenfolge BEHOERDEN-rang), leere weg. */
export function gruppiereNachBehoerde(materialien: BrowseMaterial[]): BehoerdeGruppe[] {
  return BEHOERDEN
    .map((b): BehoerdeGruppe => ({
      behoerde: b.id,
      name: b.name,
      kuerzel: b.kuerzel,
      materialien: materialien
        .filter((m) => m.behoerde === b.id)
        .sort(vergleiche),
    }))
    .filter((g) => g.materialien.length > 0);
}

/** Filterwerte für die Materialien-Übersicht (alle optional → UND-verknüpft). */
export interface MaterialFilterWerte {
  behoerde?: BehoerdeId;
  doktyp?: DoktypId;
  rechtsgebiet?: Rechtsgebiet;
  /** Volltext-Suche über Titel/Nummer/Behörde (case-insensitive Teilstring). */
  suche?: string;
}

/** Wendet die gesetzten Filter an (rein). Leere/undefined Felder ignorieren. */
export function filtere(materialien: BrowseMaterial[], f: MaterialFilterWerte): BrowseMaterial[] {
  const such = f.suche?.trim().toLowerCase() ?? '';
  return materialien.filter((m) => {
    if (f.behoerde && m.behoerde !== f.behoerde) return false;
    if (f.doktyp && m.doktyp !== f.doktyp) return false;
    if (f.rechtsgebiet && m.rechtsgebiet !== f.rechtsgebiet) return false;
    if (such) {
      const heu = `${m.titel} ${m.nummer ?? ''} ${m.behoerdeKuerzel} ${m.behoerdeName} ${m.doktypLabel}`.toLowerCase();
      if (!heu.includes(such)) return false;
    }
    return true;
  });
}

/** Deterministische Sortierung innerhalb einer Behörde: rang → key. */
export function vergleiche(a: BrowseMaterial, b: BrowseMaterial): number {
  return a.rang - b.rang || a.key.localeCompare(b.key);
}

/** Globale Sortierung (Behörde-rang → eigener rang → key) — für Suche/Listen. */
export function vergleicheGlobal(a: BrowseMaterial, b: BrowseMaterial): number {
  return (BEHOERDE_RANG[a.behoerde] - BEHOERDE_RANG[b.behoerde]) || vergleiche(a, b);
}

/** Die im Manifest tatsächlich vorkommenden Dokumenttypen (für Filter-Optionen),
 *  in der kanonischen DOKTYP-Reihenfolge. */
export function vorhandeneDoktypen(materialien: BrowseMaterial[]): Array<{ id: DoktypId; label: string }> {
  const ids = new Set(materialien.map((m) => m.doktyp));
  return (Object.keys(DOKTYP_LABEL) as DoktypId[])
    .filter((id) => ids.has(id))
    .map((id) => ({ id, label: DOKTYP_LABEL[id] }));
}
