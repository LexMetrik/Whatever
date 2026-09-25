// ─── Wochenlauf: Stichproben-Plan, Vorwochen-Befunde, Lauf-Frist (rein, §2) ──
//
// Auflagen der Gegenprüfung #1113 (Spec W2, 25.9.2026), aus wochenlauf-kern.ts
// herausgelöst (Schlankheit). Netz- und git-frei; die Uhr kommt als Funktion
// von der CLI (wochenlauf.ts), damit die Frist mit einer Fake-Uhr testbar ist.
//
//  A2 · Befunde der Vorwoche gehen nicht verloren: offene Fehltreffer stehen
//       maschinenlesbar im PR-Body (HTML-Kommentar, befundBlock); der nächste
//       Lauf liest sie (wochenlauf-basis.ts → basis.json), prüft jeden ZWINGEND
//       erneut (zusätzlich zu n) und hebt den Entwurf nur auf, wenn jeder davon
//       ausdrücklich erneut grün ist.
//  N1 · Gerichte mit bekannter Datums-Unzuverlässigkeit (DATUM_VOLLPRUEFUNG,
//       wochenlauf-kern.ts): JEDER neue/geänderte Eintrag wird geprüft.
//  N3 · Aktualisierte BS-Einträge (Delta und Vollabgleich) gehen in den Pool.
//  N2 · Nach Ablauf der Frist werden Stichproben- und Frische-Abrufe
//       übersprungen und als «nicht geprüft» gemeldet (⇒ Entwurf).
import { waehleStichprobe, DATUM_VOLLPRUEFUNG, type RegEintrag, type StichprobenZeile } from './wochenlauf-kern';

// ── Befund-Block im PR-Body (A2) ────────────────────────────────────────────
export interface VorBefund { key: string; grund: string }
/** Lage der Vorwoche aus dem offenen Auto-PR (basis.json); null = kein offener Auto-PR. */
export interface Vorwoche { entwurf: boolean; befunde: VorBefund[] | null; kaputt?: boolean }
/** Platzhalter-Key für einen Befund, dessen Eintrag unbekannt ist (Block fehlte/unlesbar) — nie automatisch grün. */
export const UNBEKANNT = '(Befund-Block der Vorwoche fehlte oder war unlesbar)';

export const MARKE = 'wochenlauf-befunde v1';
/** HTML-Kommentar mit den offenen Befunden; «<»/«>» als \u-Escape, damit kein «-->» im JSON den Block schliesst. */
export function befundBlock(b: VorBefund[]): string {
  return `<!-- ${MARKE}\n${JSON.stringify(b).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')}\n-->`;
}
/**
 * Liest den Block aus einem PR-Body (auch mit CRLF, wie GitHub nach einer Web-Bearbeitung speichert).
 * Mehr als eine Marke ⇒ unlesbar (R1, Nachprüfung #1113): ein zitierter oder leerer Block weiter
 * oben darf den echten nicht verdecken — welcher gilt, entscheidet ein Mensch.
 */
export function leseBefundBlock(body: string): { befunde: VorBefund[] | null; kaputt: boolean } {
  if (body.split(MARKE).length > 2) return { befunde: null, kaputt: true };
  const m = new RegExp(`<!-- ${MARKE}\\r?\\n([\\s\\S]*?)\\r?\\n-->`).exec(body);
  if (!m) return { befunde: null, kaputt: body.includes(MARKE) };
  try {
    const x = JSON.parse(m[1]) as unknown;
    const ok = Array.isArray(x) && x.every((b) => b && typeof b.key === 'string' && typeof b.grund === 'string');
    return ok ? { befunde: x as VorBefund[], kaputt: false } : { befunde: null, kaputt: true };
  } catch {
    return { befunde: null, kaputt: true };
  }
}

/**
 * Prüft die Vorwochen-Befunde gegen die Stichprobe dieses Laufs. `gruende` ⇒
 * Entwurf; `offen` wandert in den Block des neuen Bodys. Nur ein erneutes
 * «treffer» löst einen Befund; «nicht-pruefbar», «nicht geprüft (Frist)» und ein
 * nicht mehr auffindbarer Key bleiben offen (sichere Richtung — ein Mensch löst
 * sie, indem er den Eintrag aus dem Block im PR-Body streicht). Ein Entwurf der
 * Vorwoche ohne lesbaren Block wird nie automatisch aufgehoben.
 */
export function pruefeVorwoche(v: Vorwoche | null, stichprobe: StichprobenZeile[]): { gruende: string[]; offen: VorBefund[] } {
  if (!v) return { gruende: [], offen: [] };
  const offen: VorBefund[] = [];
  if (v.kaputt || (v.entwurf && v.befunde === null)) offen.push({ key: UNBEKANNT, grund: v.kaputt ? 'Block unlesbar' : 'Entwurf ohne Befund-Block' });
  for (const b of v.befunde ?? []) {
    const z = stichprobe.find((s) => s.key === b.key);
    if (z?.ergebnis === 'treffer') continue;
    offen.push({ key: b.key, grund: z ? `erneut ${z.ergebnis}: ${z.detail}` : `nicht erneut geprüft (nicht im Register) — Vorwoche: ${b.grund}` });
  }
  return { gruende: offen.length ? [`Vorwochen-Befund nicht erneut grün: ${offen.map((b) => b.key).join(', ')}`] : [], offen };
}

/** Block-Inhalt für den neuen Body: Fehltreffer dieses Laufs plus offene Vorwochen-Befunde (je Key einmal). */
export function offeneBefunde(stichprobe: StichprobenZeile[], vorOffen: VorBefund[]): VorBefund[] {
  const out: VorBefund[] = stichprobe.filter((s) => s.ergebnis === 'fehltreffer').map((s) => ({ key: s.key, grund: s.detail }));
  for (const b of vorOffen) if (!out.some((o) => o.key === b.key)) out.push(b);
  return out;
}

/**
 * R2 (Nachprüfung #1113): ein Eintrag eines DATUM_VOLLPRUEFUNG-Gerichts, der «nicht prüfbar» blieb
 * (Datum nicht lesbar, Quelle weg, Frist), ist ein eigener Entwurf-Grund — nicht nur eine Handprüfungs-Zeile.
 */
export function vollpruefungOffen(plan: RegEintrag[], stichprobe: StichprobenZeile[]): string[] {
  const voll = new Map(plan.filter((e) => DATUM_VOLLPRUEFUNG.has(e.gericht)).map((e) => [e.key, e.gericht]));
  return stichprobe.filter((s) => s.ergebnis === 'nicht-pruefbar' && voll.has(s.key))
    .map((s) => `${voll.get(s.key)!.split('_')[0].toUpperCase()}: Datum nicht belegbar — ${s.key}`);
}

// ── Stichproben-Pool und Plan (A2, N1, N3) ──────────────────────────────────
const IDENTITAET = ['gericht', 'datum', 'nummer', 'bgeReferenz', 'quelleUrl'] as const;
/** Einträge, die in beiden Registern stehen, deren Identitätsfelder aber abweichen (Datum, Aktenzeichen, Fundstelle, Quelle). */
export function identitaetGeaendert(vorher: RegEintrag[], nachher: RegEintrag[]): RegEintrag[] {
  const alt = new Map(vorher.filter((e) => !e.verweis).map((e) => [e.key, e]));
  return nachher.filter((e) => {
    const a = alt.get(e.key);
    return !e.verweis && a && IDENTITAET.some((f) => (a[f] ?? null) !== (e[f] ?? null));
  });
}

/**
 * Register-Einträge zu den BS-Aktualisierungen des Logs (leseBsDelta:
 * «<snapshot-id> (key <nr>): <gründe>»). Die Snapshot-id ist der Registerpfad
 * `datei` ohne «.json» (entscheide-schreiben.ts; Beleg AUS.2026.77, 25.9.2026).
 */
export function bsAktualisiertEintraege(zeilen: string[], register: RegEintrag[]): RegEintrag[] {
  const ids = new Set(zeilen.map((z) => z.trim().split(/\s/)[0]));
  return register.filter((e) => !e.verweis && e.datei && ids.has(e.datei.replace(/\.json$/, '')));
}

/**
 * Stichprobe = n aus dem Pool (waehleStichprobe, ohne Pflicht-Einträge) PLUS
 * Pflicht: jeder Pool-Eintrag eines DATUM_VOLLPRUEFUNG-Gerichts (N1) und jeder
 * Vorwochen-Befund (A2), dessen Key im Register steht. Pool = neu ∪ geändert ∪
 * BS-aktualisiert, je Key einmal.
 */
export function stichprobenPlan(pool: RegEintrag[], n: number, register: RegEintrag[], vorKeys: string[]): RegEintrag[] {
  const uniq = (xs: RegEintrag[]) => [...new Map(xs.map((e) => [e.key, e])).values()];
  const p = uniq(pool);
  const reg = new Map(register.filter((e) => !e.verweis).map((e) => [e.key, e]));
  const pflicht = uniq([...p.filter((e) => DATUM_VOLLPRUEFUNG.has(e.gericht)), ...vorKeys.flatMap((k) => reg.get(k) ?? [])]);
  const pk = new Set(pflicht.map((e) => e.key));
  return [...waehleStichprobe(p.filter((e) => !pk.has(e.key)), n), ...pflicht];
}

// ── Lauf-Frist (N2) ─────────────────────────────────────────────────────────
export const NICHT_GEPRUEFT = 'nicht geprüft — Lauf-Frist erreicht';
/**
 * Arbeitet `xs` der Reihe nach ab, solange `weiter()` (Frist nicht erreicht);
 * danach liefert `ersatz` die Zeile ohne Abruf. Ein bereits gestarteter Abruf
 * läuft zu Ende (Überhang ≤ ein Abruf, s. Budget im Workflow-Kopf).
 */
export async function mitFrist<T, R>(xs: T[], weiter: () => boolean, f: (x: T) => Promise<R>, ersatz: (x: T) => R): Promise<{ out: R[]; uebersprungen: number }> {
  const out: R[] = [];
  let uebersprungen = 0;
  for (const x of xs) {
    if (weiter()) out.push(await f(x));
    else { out.push(ersatz(x)); uebersprungen++; }
  }
  return { out, uebersprungen };
}

/** Stichproben-Zeile für einen wegen der Frist nicht geprüften Eintrag. */
export const ungeprueft = (e: RegEintrag): StichprobenZeile => ({ key: e.key, url: e.quelleUrl ?? null, ergebnis: 'nicht-pruefbar', detail: NICHT_GEPRUEFT });
