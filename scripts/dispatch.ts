// scripts/dispatch.ts — druckt den §0-Pflichtblock für Sub-Agenten-Aufträge.
//
// WARUM: Das Dispatch-Template hatte 6 Verweise im Repo, alle rein
// dokumentarisch — null Aufrufe in Code, Skripten, Hooks oder package.json.
// Ein Template, das man abtippen muss, wird nicht abgetippt. Dieser Generator
// macht es zu einem Kommando.
//
// Der Block wird AUS dem Template gelesen, nicht hier dupliziert (§5): so kann
// er nicht auseinanderlaufen. `check:dispatch-klausel` beweist, dass er da ist.
import { readFileSync } from 'node:fs';

export const TEMPLATE = 'docs/token-oekonomie/dispatch-template.md';

/**
 * Die zwei Fassungen der §0-Klausel.
 *   voll     — alle sechs Punkte; für Klassen, die schreiben.
 *   pruefung — nur die Punkte 1–3, wörtlich identisch; für read-only-Klassen.
 * WARUM zwei: Die Punkte 4 (Recovery-COMMIT), 5 (Kollisionssonden vor
 * BAUBEGINN) und 6 (kein MERGE im BAU-Auftrag) setzen alle voraus, dass der
 * Agent schreiben darf. `pruefung`/`recherche` dürfen es nicht — ihr eigenes
 * TABU lautet «nichts ändern». Punkt 4 widersprach dem TABU im selben Prompt
 * sogar offen (Befund Ent-Regulierung 7.8.2026, Freigabe David 7.8.2026).
 * Die Punkte 1–3 tragen die Fehlerklassen F4/F2d/F3 und sind für eine Prüfung
 * die tragenden — sie bleiben wörtlich; Ebene (A) des Tors vergleicht sie
 * byte-gleich gegen den Voll-Block (§5: eine Quelle, zwei Projektionen).
 */
export type Klauselvariante = 'voll' | 'pruefung';

/** Anker der beiden Fences im Template + erwartete Kopfzeile je Variante. */
const FENCE: Record<Klauselvariante, { ueberschrift: string; kopf: RegExp }> = {
  voll: { ueberschrift: '## 0 · Pflicht-Klausel', kopf: /^§0 PFLICHT-KLAUSEL \(wörtlich/ },
  pruefung: { ueberschrift: '### 0a · Pflicht-Klausel', kopf: /^§0 PFLICHT-KLAUSEL \(PRÜFUNG/ },
};

/**
 * Liest den §0-Block aus dem ```text-Fence unterhalb der Überschrift der
 * gewünschten Variante. Default `voll` — rückwärtskompatibel für Aufrufer,
 * die die Variante nicht kennen (der Voll-Block ist nie zu wenig, nur zu viel).
 */
export function pflichtKlausel(md: string, variante: Klauselvariante = 'voll'): string {
  const { ueberschrift, kopf } = FENCE[variante];
  if (!kopf) throw new Error(`Unbekannte Klausel-Variante '${variante}'`);
  const ab = md.indexOf(ueberschrift);
  if (ab < 0) throw new Error(`§0-Abschnitt '${ueberschrift}' (Variante ${variante}) fehlt in ${TEMPLATE}`);
  const start = md.indexOf('```text', ab);
  if (start < 0) throw new Error(`§0-Codeblock (\`\`\`text) der Variante ${variante} fehlt in ${TEMPLATE}`);
  const von = md.indexOf('\n', start) + 1;
  const bis = md.indexOf('```', von);
  if (bis < 0) throw new Error(`§0-Codeblock der Variante ${variante} nicht geschlossen in ${TEMPLATE}`);
  const block = md.slice(von, bis).trimEnd();
  if (!kopf.test(block)) {
    throw new Error(
      `§0-Codeblock der Variante ${variante} trägt nicht die erwartete Kopfzeile ${kopf}.\n` +
      `  Erste Zeile ist: ${block.split('\n')[0] || '(leer)'}\n` +
      `  Verwechselte Fences liefern still die falsche Fassung — darum die Prüfung hier.`);
  }
  return block;
}

/**
 * Modell-PALETTE — die EINZIGE Stelle im Repo, an der konkrete Modellnamen
 * für das Dispatch-Routing stehen (§5). Doku und Agent-Typen sprechen in
 * semantischen STUFEN; ändert sich die Modellfamilie, wird nur diese Tabelle
 * angepasst und `npm run dispatch:agents` neu gefahren (Tor: check:dispatch-
 * klausel Ebene C). Stufen-Semantik:
 *   spitze — stärkstes verfügbares Modell (Gegenprüfung Risikopfad, härtester Bau)
 *   stark  — Standard-Bau und Risikopfad-Bau (Minimum für beide)
 *   mittel — Recherche, Synthese, eng umrissener nicht-riskanter Bau
 *   klein  — deterministische Mechanik
 * Belegung Stand 4.8.2026 (Claude-5-Familie; Entscheid David 4.8.2026:
 * Gegenprüfung darf auf fable, nicht-riskanter Bau darf auf sonnet).
 */
export const PALETTE_STAND = '2026-08-04';
export const PALETTE: Record<'spitze' | 'stark' | 'mittel' | 'klein', string> = {
  spitze: 'opus', // Weisung David 1.9.2026: «baue ab sofort nicht mehr mit fable» — Obergrenze Opus, Fable orchestriert nur
  stark: 'opus',
  mittel: 'sonnet',
  klein: 'haiku',
};

/** Auftragsklassen-Zusatz: was diese Klasse ÜBER die Pflicht-Klausel hinaus braucht. */
export const KLASSEN: Record<string, string> = {
  bau: 'TABU: kein Merge, kein Deploy, keine Änderung an .claude/ oder CLAUDE.md.\nQUITTUNG: Ein Bauer quittiert NIE seine eigene Arbeit — kein gegenpruefung:ok, keine Zeile im Gegenprüfungs-Register, kein Gegenpruefung:-Trailer (F10, PR #616 2.9.2026); Verdikt kommt vom Prüf-Agenten, Quittung setzt der Orchestrator.\nTESTS: Randdaten abseits des Glücksfalls (Datum ≠ Monatserster); ein neues Eingabefeld in ALLE Konsumenten (Rechner + Vorlagen) verdrahten und je testen — beides maskierten die Tests in RL-16b (25.9.2026), erst die Gegenprüfung fand es.\nRÜCKGABE: geänderte Dateien (absolute Pfade) · Tor-Ergebnisse mit Exit-Code · offene Punkte.',
  pruefung: 'TABU: nichts ändern — nur lesen, messen, berichten.\nRÜCKGABE: Befund je Fundstelle (Datei:Zeile) · Beleg · Schweregrad · was du NICHT prüfen konntest.',
  recherche: 'TABU: kein Code, keine Repo-Änderung.\nRÜCKGABE: je Fakt Quelle + Stand + Link; ungedeckte Fragen ausdrücklich als offen markieren.',
  daten: 'QUITTUNG: Ein Bauer quittiert NIE seine eigene Arbeit — kein gegenpruefung:ok, keine Register-Zeile, kein Gegenpruefung:-Trailer (F10, PR #616 2.9.2026).\nRISIKOPFAD: Gegenprüfung ist Pflicht — sie beauftragt der ORCHESTRATOR nach deiner Rückgabe, NICHT du (F5-Wartetod 15.8.2026: ein Daten-Agent spawnte selbst eine Gegenprüfung und wartete 5 h auf ein Verdikt, das ein Sub-Agent nie empfangen kann). Du lieferst committete Arbeit + Bericht ab und ENDEST. Merge ist gesperrt (check:merge-schutz).\nMANIFEST: Nach jedem Generator-Lauf `npm run datenhaltung:manifest` mitregenerieren — F2b-Vorfall 4.8.2026: #425 landete mit Manifest-Drift, #430 musste heilen.\nRÜCKGABE: Stichprobe n≥10 mit Identitätsbeleg gegen die Amtsquelle + Trefferquote + Commit-SHA der eigenen Arbeit («Commit <sha>», §14.7).',
  mechanisch: 'NUR deterministische, per Byte-Diff oder Test maschinell prüfbare Transformation. Verschachtelte Steuer-Strukturen (@meta-Blöcke, Checkbox-Hierarchien) sind KEINE Mechanik — abbrechen und melden statt raten (Vorfall 4.8.2026). Verschiebe-Aufträge nur mit isolation: worktree; Cut und Paste im SELBEN Commit.\nRÜCKGABE: Pfade + Zeilen-/Byte-Delta + Prüfweg (Diff/Test) + Commit-SHA der eigenen Arbeit («Commit <sha>», §14.7), nichts Weiteres.',
  synthese: 'Steuer-Doku: dieser Text lenkt Folge-Sessions. Ehrlich, mit Provenienz (Datum, Anlass, Beleg); Pointer auf den Platte-Zustand statt Detailspeicher; keine Erfolgs-Prosa ohne prüfbares Artefakt.\nRÜCKGABE: der Text selbst + betroffene Pfade + Commit-SHA der eigenen Arbeit («Commit <sha>», §14.7; uncommittiert ⇒ ausdrücklich sagen).',
};

/**
 * Welche Klausel-Variante eine Auftragsklasse trägt (§5: die eine Zuordnung).
 * read-only-Klassen bekommen die Prüf-Fassung, alle schreibenden den Voll-Block.
 * Eine neue Klasse OHNE Eintrag hier fällt fail-safe auf `voll` zurück (zu viel
 * Klausel ist nie falsch, nur teuer) — und wird trotzdem rot: Vitest
 * (dispatch-klausel.test.ts) und `check:dispatch-klausel` Ebene (B) verlangen
 * beide, dass jede KLASSEN-Klasse hier steht.
 */
export const VARIANTE: Record<string, Klauselvariante> = {
  bau: 'voll',
  daten: 'voll',
  mechanisch: 'voll',
  synthese: 'voll',
  pruefung: 'pruefung',
  recherche: 'pruefung',
};

/** Variante einer Klasse, fail-safe auf `voll`. */
export function varianteVon(klasse: string): Klauselvariante {
  return VARIANTE[klasse] ?? 'voll';
}

/**
 * Reine Text-Erzeugung (testbar, ohne Prozess-Seiteneffekte).
 * @throws wenn die Klasse unbekannt ist — der Aufrufer entscheidet über den Exit.
 */
export function dispatchText(klasse: string, md: string): string {
  if (!(klasse in KLASSEN)) {
    throw new Error(`Unbekannte Auftragsklasse '${klasse}'. Bekannt: ${Object.keys(KLASSEN).join(' | ')}`);
  }
  const kern = `${pflichtKlausel(md, varianteVon(klasse))}\n\n${KLASSEN[klasse]}`;
  return klasse === 'bau' ? `${kern}\n\n${WEICHE_BAU}` : kern;
}

/** Grüne-Spur-Weiche vor jedem Bau-Dispatch (Skill auftrag Ziff. 6). Lehre 5.9.2026:
 *  als Prosa im Skill feuerte sie in einer Nacht mit 12 Bau-Dispatches kein einziges Mal —
 *  darum hier im Generator-Output, wo der Orchestrator sie beim Dispatch liest. */
export const WEICHE_BAU = [
  'GRÜNE-SPUR-WEICHE (vor dem Dispatch beantworten, Skill auftrag Ziff. 6):',
  '  (a) nur src/**, kein Risikopfad?  (b) Fertig-Kriterium maschinell, kein Sichtentscheid?',
  '  (c) ein Ziel, ≤ ~5 Dateien, Whitelist benennbar?  (d) keine offene David-Frage?',
  '  4× ja ⇒ Jules-Ticket (docs/token-oekonomie/jules-ticket-vorlage.md, Kontingent messen),',
  '  ein Nein ⇒ Claude-Agent, das Nein als Begründung in den Auftrag.',
].join('\n');

export function templateLesen(): string {
  return readFileSync(TEMPLATE, 'utf8');
}
