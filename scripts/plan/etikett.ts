// scripts/plan/etikett.ts
export type Status = 'ready' | 'wip' | 'blocked' | 'done' | 'parked';
export const STATUS_WERTE: readonly Status[] = ['ready', 'wip', 'blocked', 'done', 'parked'];

/**
 * **Baufeld** — die eine Achse, nach der der Plan geschnitten ist (Auftrag David
 * 29.8.2026, «radikal, Kontrolle abbauen wo nicht nötig»).
 *
 * Ein Schritt gehört zu genau EINER Code-Fläche; das Feld benennt sie. Es ersetzt
 * zugleich `kollision:` (Pfad-Globs) als Parallelitäts-Kriterium: zwei Schritte
 * desselben Felds laufen nie parallel, zwei verschiedener Felder immer. Die alte
 * Glob-Liste war je Schritt zu pflegen, driftete gegen den echten Baum und wurde
 * ausschliesslich für genau diese Ja/Nein-Frage ausgewertet — ein Feld mit sieben
 * Werten beantwortet sie ohne Buchführung.
 *
 * Zuordnung (Haupt-Codefläche, nicht Berührungsfläche):
 * - `leser`          — `src/pages/gesetz-leser`, `src/components/normtext`, Erlass-Anzeige
 * - `korpus`         — `scripts/normtext`, `scripts/fedlex-*`, `scripts/materialien`, `public/normtext`
 * - `rechtsprechung` — `scripts/rechtsprechung`, `src/lib/rechtsprechung`, Verzahnung Norm↔Entscheid
 * - `suche`          — `api/suche.ts`, `src/lib/suche`, `src/components/suche`, `scripts/datenhaltung`
 * - `design`         — `src/index.css`, `tailwind.config.js`, `DESIGN-REGLEMENT.md`, `src/components` app-weit
 * - `werkzeuge`      — Rechen-Engines, `src/lib/vorlagen`, Rechner-Seiten
 * - `betrieb`        — `.github/workflows`, `scripts/plan`, `scripts/check-*`, `.claude`, Tore/CI/Prozess
 * - `rechtslogik`    — Prüfung Rechtslogik 23.9.2026 (UMSETZUNGSPLAN, RL-01…RL-58): Rechen-Engines
 *   und Vorlagen-Inhalte der Befund-Wellen — eigenes Feld statt `werkzeuge`, weil diese
 *   Bau-Einheiten seriell und mit eigener Gegenprüfungs-Kadenz laufen (Go David 23.9.2026)
 */
export type Feld = 'leser' | 'korpus' | 'rechtsprechung' | 'suche' | 'design' | 'werkzeuge' | 'betrieb' | 'rechtslogik';
export const FELD_WERTE: readonly Feld[] = ['leser', 'korpus', 'rechtsprechung', 'suche', 'design', 'werkzeuge', 'betrieb', 'rechtslogik'];
export function istFeld(v: string | null): v is Feld {
  return v !== null && (FELD_WERTE as readonly string[]).includes(v);
}

// QS-PLAN-EINFACH (14.8.2026): `of`, `seq-hart`, `seq-weich` und `statusAgent`
// sind gestrichen — gemessen unterschieden sie nie etwas (of: 20 686× «ja», 0×
// «nein»; seq-*: 3 Vermerke, 0 auswertende Stellen; statusAgent: 0 Vorkommen).
//
// Steuerungs-Diät (29.8.2026, Auftrag David): dazu kommen `kollision`, `26x`,
// `slot`, `groesse` und `worktree`. Begründung je Streichung:
//   kollision → ersetzt durch `feld` (s. oben); die Globs wurden nur für die
//     Parallelitäts-Frage gelesen, kosteten aber je Schritt eine Pfadliste.
//   26x/slot  → die Slot-Mechanik («nie zwei 26×-Datenassets offen») steuerte
//     zuletzt genau zwei offene Schritte und ist als dep/blocker ausdrückbar;
//     drei check.ts-Regeln (5/5b/5c) und zwei resolve()-Buckets hingen daran.
//   groesse   → reine Lese-Hilfe; die Vokabelprüfung war am 14.8.2026 schon
//     gestrichen, kein Tor leitete je etwas daraus ab.
//   worktree  → §12 gilt ohnehin für jede Parallel-Session; das Feld steuerte
//     nichts Maschinelles mehr.
// Der Parser TOLERIERT alle diese Felder im Bestand (Archiv-/Chronik-Dateien),
// wertet sie aber nicht mehr aus; der Serializer schreibt sie nie — plan:set
// räumt sie damit beim nächsten Schreiben mechanisch ab.
export interface Etikett {
  id: string;
  status: Status;
  blocker: string | null;
  dep: string[];
  /**
   * Baufeld, **roh** wie in der ROADMAP notiert; `null` = Feld fehlt.
   *
   * Bewusst `string | null` statt `Feld | null`: `parseEtikett` wirft hier NICHT
   * bei unbekanntem Vokabular. Pflicht und Vokabular prüft `check.ts` (Regel 14)
   * mit einer Meldung, die die sieben zulässigen Werte nennt — ein Tippfehler
   * (`feld: lesser`) darf nicht die ganze Plan-Werkzeugkette lahmlegen
   * (`plan:next`, `plan:set`, `plan:bild` parsen alle dieselbe Zeile) und wäre
   * als geworfene Ausnahme auch nicht als §6.7-Rot-Beweis vorführbar.
   */
  feld: string | null;
  fahrplan: string | null;
}

function liste(v: string): string[] {
  const innen = v.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  return innen === '' ? [] : innen.split(',').map((s) => s.trim()).filter(Boolean);
}
function nullbar(v: string): string | null {
  return v === 'null' ? null : v;
}

export function parseEtikett(line: string): Etikett {
  const m = line.match(/<!--\s*@meta\s+(.*?)\s*-->/);
  if (!m) throw new Error(`Keine @meta-Zeile: ${line}`);
  const feld: Record<string, string> = {};
  for (const teil of m[1].split(' · ')) {
    const i = teil.indexOf(': ');
    if (i < 0) throw new Error(`@meta: Feld ohne ': ' → "${teil}"`);
    feld[teil.slice(0, i).trim()] = teil.slice(i + 2).trim();
  }
  const sm = (feld.status ?? '').match(/^(\w+)(?:\((.*)\))?$/);
  if (!sm) throw new Error(`@meta: Status unlesbar "${feld.status}"`);
  const status = sm[1] as Status;
  if (!STATUS_WERTE.includes(status)) throw new Error(`@meta: ungültiger Status "${status}"`);
  const noetig = ['id', 'status', 'blocker', 'dep'];
  for (const k of noetig) if (!(k in feld)) throw new Error(`@meta: Feld "${k}" fehlt`);
  return {
    id: feld.id,
    status,
    blocker: nullbar(feld.blocker),
    dep: liste(feld.dep),
    feld: 'feld' in feld ? nullbar(feld.feld) : null,
    fahrplan: 'fahrplan' in feld ? nullbar(feld.fahrplan) : null,
  };
}

export function serializeEtikett(e: Etikett, indent: string): string {
  const teile = [
    `id: ${e.id}`,
    `status: ${e.status}`,
    `blocker: ${e.blocker ?? 'null'}`,
    `dep: [${e.dep.join(', ')}]`,
  ];
  // Kanonische Position wie im Bestand der ROADMAP: `feld` nach `dep`, `fahrplan`
  // zuletzt — falsche Position heisst nicht-byte-gleicher Round-Trip und damit
  // Diff-Rauschen bei jedem `plan:set`-Aufruf.
  if (e.feld) teile.push(`feld: ${e.feld}`);
  if (e.fahrplan) teile.push(`fahrplan: ${e.fahrplan}`);
  return `${indent}<!-- @meta ${teile.join(' · ')} -->`;
}
