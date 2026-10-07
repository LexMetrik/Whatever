import type { SuchGruppe, SuchTreffer } from '../universalSuche';
import { erlassPfadVonKey } from '../normtext/erlassAdresse';

// ─── Online-Volltextsuche (QS-DATA E2, W2·6-DATA) ────────────────────────────
//
// Bindet die Turso-Edge-Suche (`api/suche`) als ZUSÄTZLICHE Treffergruppe in den
// EINEN Suchweg (universalSuche) ein — kein zweites Such-Silo (§11.3 b). Der
// statische Client-Index (artikelVolltext + Browse-Manifeste) bleibt der Offline-
// Fallback; diese Gruppe wächst NUR zusätzlich unten an, wenn die Edge antwortet.
//
// EHRLICHES DEGRADIEREN (§8): bei 503 (Turso noch nicht provisioniert), 502,
// Netzwerkfehler oder Timeout (~4 s) erscheint die Gruppe GAR NICHT — kein
// Fehler-Lärm, nichts wirkt kaputt. Nach EINEM Ausfall wird für ~5 min nicht
// erneut gehämmert (Feature-Detection-Cache); danach probiert eine neue Query
// wieder. Reine Darstellungs-/Netz-Schicht (§3): KEINE Rechtslogik, nur
// URL-Bildung aus der Fundstelle + Antwort→Treffer-Abbildung.

// Wire-DTO der Edge-Antwort (Netzgrenze). Serverseitige SSoT der Form:
// scripts/datenhaltung/suche-kern.ts (ArtikelTreffer/EntscheidTreffer/SucheAntwort).
// Hier bewusst client-lokal gespiegelt — die App-tsconfig kompiliert nur `src`
// (kein Import aus scripts/), und ein Wire-DTO ist keine Rechtsregel (§3/§5).
interface Fundstelle {
  erlass?: string;
  artikel?: string;
  quelleUrl: string;
  /** Daten-Ebene des Erlasses ('bund' | 'kanton'), seit F35 im Edge-DTO.
   *  OPTIONAL: eine gecachte Alt-Antwort trägt sie nicht — dann gilt das
   *  bisherige Verhalten (Bund-Fallback), nie ein Raten. */
  ebene?: string;
  /** Kantonskürzel («AG») bei ebene === 'kanton'; bei Bund nicht gesetzt. */
  kanton?: string;
}
interface ApiArtikelTreffer {
  id: string;
  titel: string;
  snippet: string;
  fundstelle: Fundstelle;
}
interface ApiEntscheidTreffer {
  id: string;
  titel: string;
  snippet: string;
  fundstelle: Fundstelle;
}
interface ApiAntwort<T> {
  treffer: T[];
  gesamt: number;
  naechsteSeite: number | null;
}
interface SucheApiAntwort {
  artikel?: ApiAntwort<ApiArtikelTreffer>;
  entscheide?: ApiAntwort<ApiEntscheidTreffer>;
  /** ISO-Zeitstempel des letzten erfolgreichen Sync-Laufs der Server-Replika
   *  (`sync_meta.stand`, E0-BRANDSCHUTZ). OPTIONAL: fehlt die Marke (oder eine
   *  gecachte Alt-Antwort), fehlt das Feld — dann KEINE Anzeige, nie ein Raten (§8). */
  stand?: string;
}

/** Untergrenze: erst ab 3 Zeichen fetchen (§15.3 — kein Netz je Tastendruck). */
export const MIN_ZEICHEN = 3;
/** Abbruch-Fenster in ms (§15/§8: lieber keine Gruppe als hängendes UI). */
const TIMEOUT_MS = 4000;
/** Sperr-Fenster nach einem Ausfall in ms — dann probiert eine neue Query wieder. */
export const SPERRE_MS = 5 * 60 * 1000;
/** Deckel je Query — die Edge liefert by design nur Snippets, keine Volltexte. */
const LIMIT = 10;

export interface OnlineOptions {
  /** Für Tests injizierbar; sonst globales fetch. */
  fetchImpl?: typeof fetch;
  /**
   * Wall-Clock als EINGABE (§2: kein Date.now() in src/lib — der Produktions-Caller,
   * der Hook in src/components, führt `() => Date.now()`). Steuert nur das
   * Feature-Detection-Fenster, nie Rechenlogik. Ohne Clock (zeitlose Aufrufer/Tests)
   * gilt 0 — mit modul-lokalem Reset ungefährlich.
   */
  jetzt?: () => number;
  /** Für Tests injizierbar; sonst import.meta.env.BASE_URL. */
  basisUrl?: string;
  /** Für Tests injizierbar; sonst TIMEOUT_MS. */
  timeoutMs?: number;
}

// Feature-Detection-Cache (modul-lokal = sessionweit): Zeitpunkt, bis zu dem nach
// einem Ausfall NICHT erneut abgefragt wird. 0 = frei.
let gesperrtBis = 0;

/** Test-Helfer: setzt den Feature-Detection-Cache zurück (kein Produktionspfad). */
export function zuruecksetzenOnlineSperre(): void {
  gesperrtBis = 0;
}

/**
 * Interne Artikel-Route — mirror des statischen Client-Helfers
 * (artikelVolltext.ts): `/gesetze/<ebene>/<key>#art-<artikel>`. Der Anker
 * `art-<artikel>` ist die im Reader gesetzte Artikel-ID (parts.tsx:
 * `<article id={art-${e.artikel}}>`); die Anzeige-Nummer (`330_a`) wird NICHT
 * URL-kodiert (identisch zum bestehenden Helfer), der Routen-Key schon.
 *
 * SCOPE-KORREKTUR (W2·13-KANTONE K-3, 31.8.2026, §8-Doku): hier stand «E2-hot-
 * Scope = NUR Bund-Gesetze, §11.5». Das war nie zutreffend — `ingestNormtextZiel`
 * (scripts/datenhaltung/ingest.ts) schreibt Bund UND Kanton in `artikel`, und
 * `baueFtsArtikel` (fts.ts) indexiert `SELECT … FROM artikel` ohne Ebenen-Filter.
 * Die hot-FTS trägt damit auch das kantonale Recht (gezählt am 31.8.2026:
 * 1231 kantonale Snapshot-Dateien mit 30 709 Artikel-Einträgen unter
 * public/normtext/kanton). Folge des falschen Scopes war ein falscher Link: der
 * Href entstand ohne Ebene, und `erlassPfadVonKey` fällt ohne Ebene auf 'bund'
 * zurück — jeder kantonale Online-Treffer landete auf `/gesetze/bund/<kanton-key>`.
 *
 * DIE DTO-EBENE IST NUR DER FALLBACK, nicht die Entscheidung: über einen Schlüssel,
 * den das Erlass-Register kennt, entscheidet das Register (so bleibt ein
 * Staatsvertrag unter `/gesetze/international/…`, Befund 45). Erst für Schlüssel
 * ausserhalb des Registers — genau die kantonalen — trägt die Ebene aus dem DTO.
 * Fehlt sie (Alt-Antwort aus dem Cache), gilt unverändert das bisherige Verhalten.
 */
export function artikelTrefferHref(f: Fundstelle): string {
  return `${erlassPfadVonKey(f.erlass ?? '', f.ebene || 'bund')}#art-${f.artikel ?? ''}`;
}

/** Interne Entscheid-Route — mirror von universalSuche.entscheidGruppe: `/rechtsprechung/<key>`.
 *  Die Edge-`id` IST der kanonische Register-Key (entscheide.id = bestehender Key). */
export function entscheidTrefferHref(id: string): string {
  return `/rechtsprechung/${encodeURIComponent(id)}`;
}

// Cowork-Befund 30 (18.8.2026): der Entscheid-Snippet der Edge-Suche kommt aus
// SQLite FTS5' `snippet()` (scripts/datenhaltung/suche-kern.ts,
// SQL_ENTSCHEIDE_TREFFER) — die markiert Treffer-Terme serverseitig mit
// `[`/`]` (highlight_start/highlight_end). Der Client hebt Treffer aber ZUSÄTZLICH
// selbst mit <mark> hervor (SuchResultate.markiere, matched gegen `q`) — ohne
// diesen Schritt standen die Klammern als Textzeichen NEBEN der eigenen
// Hervorhebung im Auszug («…[257d] [OR] möglich…»). Nur EIN-Wort-Klammern
// (genau die Treffer-Term-Form aus `baueFtsMatch`) werden entfernt, damit ein
// zufälliges «[…]» im Originaltext (käme es je vor) nicht verstümmelt wird.
function entferneSnippetKlammern(snippet: string): string {
  return snippet.replace(/\[([\p{L}\p{N}][\p{L}\p{N}-]*)\]/gu, '$1');
}

/** Antwort → geteilte SuchTreffer. Artikel zuerst, dann Entscheide (feste Ordnung). */
function baueTreffer(antwort: SucheApiAntwort): { treffer: SuchTreffer[]; gesamt: number } {
  const artikel: SuchTreffer[] = (antwort.artikel?.treffer ?? []).map((t) => {
    // HERKUNFT EHRLICH (§8, F35) — exakt das Doppel-Idiom des statischen Index
    // (artikelVolltext.treffer), damit derselbe Erlass in beiden Trefferwegen
    // gleich aussieht: Label-Suffix « · AG» (steht auch dort, wo keine Marke
    // gerendert wird) PLUS Marke «AG» OHNE `redundant` — die Bund-Marke ist auf
    // Mobile ausgeblendet (redundant zum Gruppentitel), das Kantonskürzel trägt
    // dagegen Information und muss auf JEDER Breite sichtbar bleiben.
    const kantonal = t.fundstelle.ebene === 'kanton' && !!t.fundstelle.kanton;
    const kt = t.fundstelle.kanton ?? '';
    return {
      id: t.id,
      label: kantonal ? `${t.titel} · ${kt}` : t.titel,
      untertitel: entferneSnippetKlammern(t.snippet),
      marke: kantonal
        ? { text: kt, ton: 'soft' as const }
        : { text: 'Gesetz', ton: 'soft' as const, redundant: true },
      href: artikelTrefferHref(t.fundstelle),
    };
  });
  const entscheide: SuchTreffer[] = (antwort.entscheide?.treffer ?? []).map((t) => ({
    id: t.id,
    label: t.titel,
    untertitel: entferneSnippetKlammern(t.snippet),
    marke: { text: 'Entscheid', ton: 'soft' as const, redundant: true },
    href: entscheidTrefferHref(t.id),
  }));
  return {
    treffer: [...artikel, ...entscheide],
    gesamt: (antwort.artikel?.gesamt ?? 0) + (antwort.entscheide?.gesamt ?? 0),
  };
}

// F36 (W2·13-KANTONE K-3): Der Hinweis sagte «über Gesetze + Leitentscheide» —
// das liess offen, WELCHE Gesetze und verschwieg, dass diese Gruppe als einzige
// gar nicht erscheint, wenn man offline ist. Beides steht jetzt da (§8): der
// Umfang (Bund UND Kanton — die hot-FTS trägt beide Ebenen, s. artikelTrefferHref)
// und die Bedingung («läuft nur online»). Der Datenschutz-Halbsatz bleibt
// wörtlich erhalten; er ist der Grund, warum es diesen Hinweis überhaupt gibt.
const HINWEIS =
  'Online-Volltextsuche über Erlasse von Bund und Kantonen + Leitentscheide — läuft nur online, ' +
  'Suchbegriffe verlassen dafür den Browser.';

const DATUM_CH = new Intl.DateTimeFormat('de-CH', {
  timeZone: 'Europe/Zurich',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** ISO-Zeitstempel → «TT.MM.JJJJ» (Kalendertag in Zürich) oder null, wenn kein lesbares
 *  Datum vorliegt. Reine Darstellung (§3); die Zeitzone ist FEST, damit dieselbe
 *  Antwort überall dasselbe Datum zeigt (§2-Geist). */
export function formatiereIndexStand(iso: string | undefined): string | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : DATUM_CH.format(new Date(ms));
}

/** Baut die fertige §8-markierte Online-Gruppe (oder null, wenn leer). Der Hinweis
 *  nennt zusätzlich, wie frisch die Server-Replika ist («Suchindex Stand TT.MM.JJJJ»)
 *  — nur wenn der Server einen lesbaren Stand mitgeliefert hat (§8). */
function baueGruppe(antwort: SucheApiAntwort): SuchGruppe | null {
  const { treffer, gesamt } = baueTreffer(antwort);
  if (treffer.length === 0) return null;
  const stand = formatiereIndexStand(antwort.stand);
  const hinweis = stand ? `${HINWEIS} Suchindex Stand ${stand}.` : HINWEIS;
  return { id: 'online', titel: 'Volltext-Suche (online)', hinweis, treffer, gesamt };
}

/**
 * Fragt die Edge-Suche ab und liefert die fertige Treffergruppe — oder `null`,
 * wenn nicht gefetcht/degradiert wird (zu kurz, gesperrt, 5xx, Netz, Timeout,
 * leere Antwort). `null` bedeutet immer «Gruppe nicht zeigen» (§8). Rein bis auf
 * das (injizierbare) fetch/now — deterministisch testbar (§2-Geist).
 */
export async function holeOnlineTreffer(q: string, opt: OnlineOptions = {}): Promise<SuchGruppe | null> {
  const begriff = q.trim();
  if (begriff.length < MIN_ZEICHEN) return null;

  const jetzt = (opt.jetzt ?? (() => 0))();
  if (jetzt < gesperrtBis) return null; // im Sperr-Fenster: nicht erneut hämmern

  const fetchImpl = opt.fetchImpl ?? fetch;
  const basis = opt.basisUrl ?? importBase();
  const url = `${basis}api/suche?q=${encodeURIComponent(begriff)}&limit=${LIMIT}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opt.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await fetchImpl(url, { signal: controller.signal });
    if (!res.ok) {
      gesperrtBis = jetzt + SPERRE_MS; // 503 (kein Turso) / 502 → für ~5 min ruhen
      return null;
    }
    const antwort = (await res.json()) as SucheApiAntwort;
    gesperrtBis = 0; // Erfolg → Sperre lösen
    return baueGruppe(antwort);
  } catch {
    gesperrtBis = jetzt + SPERRE_MS; // Netzfehler / Abbruch (Timeout) → ruhen
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** import.meta.env.BASE_URL, defensiv (Node-Testumgebung ohne Vite-Env). */
function importBase(): string {
  try {
    return (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/';
  } catch {
    return '/';
  }
}
