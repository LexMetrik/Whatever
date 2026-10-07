// ─── Zentraler JSON-Lader mit Formprüfung (ARCH-REVIEW, 7.10.2026) ───────────
//
// Anlass: ~25 Lade-Stellen castete `(await res.json()) as Ziel` ungeprüft. JSON
// unter public/ wird laut vercel.json 1 h gecacht (must-revalidate), JS unter
// /assets ist immutable — ein über einen Deploy offener Tab kann also ALTES JS
// mit NEUEM JSON mischen (oder umgekehrt). Driftet die Form, schwieg der
// Compiler, und die Fläche zeigte still «keine Treffer»/«keine Anker» statt
// einer Störung (§8-Verstoss: Lücke ohne Ausweis).
//
// Hier: EINE Stelle für fetch + Status-Prüfung + Formprüfung. Ein Formfehler
// WIRFT (benannte Quelle, `jsonSchutz`-Meldung) — und läuft damit durch den
// BESTEHENDEN Fehlerpfad jedes Aufrufers (catch → null / «fehler»-Zustand /
// kein Cache-Eintrag), genau wie ein Netz- oder 5xx-Fehler. Keine neue UI.
//
// GRENZE: «kein Cache-Eintrag» gilt NUR für die strengen Pfade (Aufrufer, die
// den Cache bei Wurf verwerfen). Bei anker.ts, synopse.ts, synopse-entwurf.ts,
// revisionen.ts und rechtsprechung/browse.ts (Register, Richter, Entscheid) bleibt bei
// Formfehler die Fläche leer und `null` wird gecacht (bisheriges Verhalten,
// hier bewusst nicht geändert): der Formfehler wird dort wie «keine Daten»
// behandelt, nicht als Ausfall gezeigt.
//
// Prüfer bleiben schlank (Wurzelform + Pflichtfelder, die die Konsumenten
// wirklich dereferenzieren) — das Muster von `src/data/jsonSchutz.ts`, keine
// Schema-Bibliothek im Bundle. Reine Ladeschicht, keine Fachlogik (§3).
//
// VERSIONS-PARAMETER (`?v=<Build-ID>`) bewusst NICHT umgesetzt — Begründung im
// PR-Body: die Build-ID ist der Deploy-SHA, nicht ein Daten-Hash; jeder Deploy
// (mehrfach täglich) entwertete damit alle unveränderten MB-Snapshots im
// Browser-Cache (§15), und der Fall «altes JS + neues JSON» bliebe offen, weil
// der Server den Query-String ignoriert. Dafür gibt es die Formprüfung.

import { istRecord, pruefeJson, type JsonPruefer } from '../data/jsonSchutz';

export type FeldTyp = 'string' | 'array' | 'objekt';

const TYP_NAME: Record<FeldTyp, string> = { string: 'String', array: 'Array', objekt: 'Objekt' };

function hatTyp(wert: unknown, typ: FeldTyp): boolean {
  if (typ === 'string') return typeof wert === 'string';
  if (typ === 'array') return Array.isArray(wert);
  return istRecord(wert);
}

/** Schlanker Prüfer: Wurzel ist ein Objekt, dessen Pflichtfelder die genannte
 *  Form haben (`{}` = nur «ist ein Objekt»). `eintrag` prüft optional die
 *  Werte einer Record-Wurzel (Stichprobe, siehe `pruefeJson`). */
export function pruefeFelder(
  quelle: string,
  felder: Record<string, FeldTyp>,
  eintrag?: JsonPruefer['eintrag'],
): JsonPruefer {
  return {
    quelle,
    wurzel(w) {
      if (!istRecord(w)) return 'Wurzel ist kein Objekt';
      for (const [feld, typ] of Object.entries(felder)) {
        if (!hatTyp(w[feld], typ)) return `Pflichtfeld «${feld}» fehlt oder ist kein ${TYP_NAME[typ]}`;
      }
      return null;
    },
    eintrag,
  };
}

export interface LadeOptionen {
  /** Antwort, die wie «Datei fehlt» (null) behandelt wird, z. B. der SPA-Rückfall
   *  (200 text/html) von `vite dev`/`vite preview` statt eines echten 404. */
  alsFehlend?: (res: Response) => boolean;
}

/** `null` NUR bei echter 404 (oder `alsFehlend`); jeder andere Fehlschlag WIRFT
 *  — Status, Netz, Parse und Formfehler. Der Aufrufer entscheidet, ob er den
 *  Cache-Eintrag verwirft und wie der Ausfall gezeigt wird. */
export async function ladeJson<T>(url: string, pruefer: JsonPruefer, opt: LadeOptionen = {}): Promise<T | null> {
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`HTTP ${res.status} für ${url}`);
  if (opt.alsFehlend?.(res)) return null;
  return pruefeJson<T>(await res.json(), pruefer);
}

/** Wie `ladeJson`, aber auch die 404 WIRFT (Datei muss da sein, z. B. Register). */
export async function ladeJsonStreng<T>(url: string, pruefer: JsonPruefer): Promise<T> {
  const r = await ladeJson<T>(url, pruefer);
  if (r === null) throw new Error(`HTTP 404 für ${url}`);
  return r;
}
