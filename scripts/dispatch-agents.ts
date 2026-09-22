// scripts/dispatch-agents.ts — generiert die Agent-Typen `.claude/agents/lex-<klasse>.md`.
//
// WARUM: Die §0-Pflichtklausel ging bisher als Orchestrator-OUTPUT in jeden
// Dispatch (~470 frische Token je Auftrag, Bilanz im Template §0). Der Harness
// kann Sub-Agenten-Typen mit eigenem System-Prompt aus `.claude/agents/*.md`
// laden — dort ist die Klausel EINMAL auf Platte statt N-mal Modell-Output,
// und eine Fehlkonfiguration (Gegenprüfung auf der Klein-Stufe) wird
// strukturell unmöglich statt nur verboten (Entscheid David 4.8.2026,
// freies Prozessmandat).
//
// ZUKUNFTSTAUGLICHKEIT: Konkrete Modellnamen stehen NUR in PALETTE
// (scripts/dispatch.ts). Dieses Skript und die Doku sprechen in Stufen
// (spitze/stark/mittel/klein). Neue Modellfamilie ⇒ PALETTE anpassen,
// `npm run dispatch:agents`, fertig. Fällt `.claude/agents/` in einem
// künftigen Harness weg, bleibt `npm run dispatch -- <klasse>` der
// vollwertige Freitext-Fallback (Hook erzwingt ihn dann wieder).
//
// §5-DISZIPLIN: Die Agent-Dateien werden NIE von Hand gepflegt. Quelle sind
// dispatch.ts (KLASSEN, PALETTE) + das Template (§0-Block); dieses Skript ist
// die deterministische Projektion, `check:dispatch-klausel` Ebene (C) beweist
// Byte-Gleichheit. Drift ⇒ Tor rot ⇒ `npm run dispatch:agents` neu laufen.
import { writeFileSync, mkdirSync } from 'node:fs';
import { pflichtKlausel, templateLesen, KLASSEN, PALETTE, varianteVon } from './dispatch';

export const AGENTS_DIR = '.claude/agents';

type Stufe = keyof typeof PALETTE;

interface AgentSpez {
  /** Semantische Modell-Stufe — Auflösung auf ein konkretes Modell NUR über PALETTE. */
  stufe: Stufe;
  /** Default-Effort; der Orchestrator setzt ihn im Call (Frontmatter kennt kein effort). */
  effort: 'low' | 'medium' | 'high';
  /** Werkzeug-Liste nur, wo eine mechanische Grenze gewollt ist (read-only). */
  tools?: string;
  beschreibung: string;
  rolle: string;
  /** Klassen-spezifischer Zusatz NACH den KLASSEN-Regeln (z. B. Unabhängigkeits-Klausel). */
  zusatz?: string;
}

const LESE_TOOLS = 'Read, Glob, Grep, Bash, WebFetch, WebSearch, ToolSearch';

export const AGENTEN: Record<string, AgentSpez> = {
  bau: {
    stufe: 'stark', effort: 'high',
    beschreibung:
      'LexMetrik-Bau (Klasse bau): nicht-trivialer Feature-/Fix-Bau. §0-Pflichtklausel eingebaut; der Auftrag liefert Rolle/Ziel, §-Slice, Whitelist, TABU. Eng umrissener nicht-riskanter Bau darf per model-Override eine Stufe tiefer laufen (Entscheid David 4.8.2026).',
    rolle:
      'Du baust im LexMetrik-Repo. Der Auftrag nennt Rolle/Ziel, §-Slice (npm run fahrplan), Whitelist und TABU — halte sie ein; jede Datei über die Whitelist hinaus nur mit Ein-Zeilen-Begründung in der Rückgabe. Navigation: ast-grep/LSP vor Grep/Read. Tore, golden und Bug-Checks laufen IN dir und werden nie gekürzt.',
  },
  daten: {
    stufe: 'stark', effort: 'high',
    beschreibung:
      'LexMetrik-Daten (Klasse daten): Risikopfad Extraktion/Korpus/Norm-Tarif. §0 eingebaut, Gegenprüfung Pflicht, Merge gesperrt. Stufe stark/high ist das Minimum — nie senken.',
    rolle:
      'Du arbeitest auf einem RISIKOPFAD (Extraktion/Rechnen/Norm-Tarif) im LexMetrik-Repo. Amtliche Werte nur mit Norm + Link + Stand; generierte Artefakte nie von Hand editieren, sondern per Generator-Lauf erzeugen und golden byte-gleich prüfen.',
  },
  pruefung: {
    stufe: 'spitze', effort: 'high', tools: LESE_TOOLS,
    beschreibung:
      'LexMetrik-Gegenprüfung (Klasse pruefung): adversarialer Zweitblick, read-only. Default Spitzen-Stufe (Entscheid David 4.8.2026), Minimum stark/high — und stets ein ANDERES Modell als das bauende.',
    rolle:
      'Du bist der adversariale Zweitblick im LexMetrik-Repo. Du versuchst zu WIDERLEGEN, nicht zu bestätigen: Re-Derivation aus der amtlichen Norm selbst rechnen, Currency-Check selbst fahren (check:fedlex-versionen / check:caches), nie auf den Bau-Pfad, den Code oder ein Bau-Grün zeigen. Werkzeuge sind read-only — du änderst nichts.',
    zusatz:
      'UNABHÄNGIGKEIT: Lief der Bau selbst auf der Spitzen-Stufe, weicht die Prüfung per model-Override auf die Stark-Stufe aus — Bau- und Prüf-Modell sind NIE identisch. Eine Prüfung ist ein frischer Agent, nie die Fortsetzung des Bau-Agenten (Common-Mode).',
  },
  recherche: {
    stufe: 'mittel', effort: 'medium', tools: LESE_TOOLS,
    beschreibung:
      'LexMetrik-Recherche (Klasse recherche): Suchen, Sweeps, Faktenklärung — read-only, kompakte Fundstellen-Rückgabe statt Datei-Dumps.',
    rolle:
      'Du recherchierst im LexMetrik-Repo oder in amtlichen Quellen. Werkzeuge sind read-only. Rückgabe sind Pfade, Fundstellen und Fakten mit Quelle + Stand — keine Datei-Dumps, keine Prosa-Berichte.',
  },
  mechanisch: {
    stufe: 'klein', effort: 'low',
    beschreibung:
      'LexMetrik-Mechanik (Klasse mechanisch): deterministische, maschinell prüfbare Transformationen (Verschieben, Formatieren, Umbenennen). Bei Urteil/Auswahl/Formulierung: zurückgeben, nicht raten.',
    rolle:
      'Du führst eine deterministische Transformation im LexMetrik-Repo aus — das Ergebnis muss per Byte-Diff oder Test maschinell prüfbar sein. Sobald Urteil, Auswahl oder Formulierung nötig wird (auch bei verschachtelten Steuer-Strukturen wie @meta-Blöcken oder Checkbox-Hierarchien), brichst du ab und meldest es: das ist Synthese, nicht Mechanik (Vorfall 4.8.2026: stille Prosa-Vernichtung).',
  },
  synthese: {
    stufe: 'mittel', effort: 'medium',
    beschreibung:
      'LexMetrik-Synthese (Klasse synthese): Session-Karten, Handoffs, Register- und Chronik-Einträge — Texte, die Folge-Sessions steuern. Nie unter die Mittel-Stufe routen.',
    rolle:
      'Du schreibst Steuer-Doku im LexMetrik-Repo — Texte, die künftige Sessions lenken. Ehrlich und mit Provenienz (Datum, Anlass, Beleg); Pointer auf den Platte-Zustand statt Detailspeicher; keine Erfolgs-Prosa ohne prüfbares Artefakt.',
  },
};

/** Erzeugt den vollständigen Datei-Inhalt eines Agent-Typs (testbar, seiteneffektfrei). */
export function agentDatei(klasse: string, md: string): string {
  const spez = AGENTEN[klasse];
  if (!spez) throw new Error(`Unbekannte Agent-Klasse '${klasse}'. Bekannt: ${Object.keys(AGENTEN).join(' | ')}`);
  if (!(klasse in KLASSEN)) throw new Error(`Agent-Klasse '${klasse}' hat keine KLASSEN-Regeln in dispatch.ts`);
  const kopf = [
    '---',
    `name: lex-${klasse}`,
    `description: ${spez.beschreibung}`,
    `model: ${PALETTE[spez.stufe]}`,
    ...(spez.tools ? [`tools: ${spez.tools}`] : []),
    '---',
  ].join('\n');
  const teile = [
    kopf,
    '<!-- GENERIERT von scripts/dispatch-agents.ts — NICHT von Hand editieren.',
    '     Quelle: dispatch.ts (KLASSEN, PALETTE) + docs/token-oekonomie/dispatch-template.md (§0).',
    '     Neu erzeugen: npm run dispatch:agents · Beweis: check:dispatch-klausel (C). -->',
    '',
    spez.rolle,
    '',
    // Gemeinsame Token-Disziplin (Auftrag David 14.8.2026, Chat): gilt für
    // JEDE Klasse und steht darum EINMAL hier statt sechsmal in den Rollen.
    'TOKEN-DISZIPLIN (Auftrag David 14.8.2026): arbeite token-sparsam — gezielte Slices (offset/limit, npm run fahrplan, ast-grep) statt Volltext-Reads, nichts doppelt lesen, Rückgabe kompakt nach Schema ohne Datei-Dumps und ohne Nacherzählen von Tool-Ausgaben. Richtgrösse der Rückgabe: ≤ ~300 Wörter Prosa; Messreihen, Belege und Rot-Beweis-Auszüge zählen nicht dagegen und werden NIE gekürzt.',
    '',
    // Zähl-Lehre 22.9.2026 (Funktions-Inventar): Handzählung «15 + 22 + 24 = 61»
    // war falsch (62/39), erst die Gegenprüfung fand es per vite-node. Gilt für
    // jede Klasse, darum EINMAL hier.
    'ZAHLEN NUR PER SKRIPT (Lehre 22.9.2026): Bestandszahlen (Karten, Routen, Einträge, Dateien) nie im Kopf addieren, sondern mit jq/vite-node/wc zählen und das Kommando im Bericht nennen — eine Handzählung ohne Kommando gilt als nicht belegt.',
    '',
    // F5-Eskalation 31.8.2026 (3. Wartetod-Vorfall trotz §0.4: Agent stoppte
    // «wartend» auf seinen eigenen Hintergrund-Crawl — gestoppte Agenten
    // empfangen nichts; der Orchestrator musste ihn wecken). Regel 5 des
    // Skills lehren: Gegenmittel eskalieren statt Regel danebenlegen — von
    // Prosa in die Definition, die JEDER Agent liest.
    'KEIN WARTE-STOPP (F5, 3. Vorfall 31.8.2026): Beende deinen Turn NIE im Zustand «wartet auf …» — ein gestoppter Agent empfängt keine Ereignisse, ein laufender Hintergrund-Prozess ohne dich ist verlorene Arbeit. Entweder du pollst das Ergebnis im selben Turn zu Ende, oder du gibst einen WIP-committeten Zwischenstand mit klarem Wiederaufnahme-Punkt zurück und erklärst den Auftrag insoweit als offen.',
    '',
    // Variante nach Klasse (§0a): read-only-Klassen tragen nur die Punkte 1–3.
    // Die Zuordnung steht EINMAL in dispatch.ts (VARIANTE) und gilt für den
    // Freitext-Weg `npm run dispatch` und die Agent-Typen gleichermassen.
    pflichtKlausel(md, varianteVon(klasse)),
    '',
    KLASSEN[klasse],
    ...(spez.zusatz ? ['', spez.zusatz] : []),
    '',
    `Standard-Routing: Stufe ${spez.stufe} (aktuell model=${PALETTE[spez.stufe]}), effort=${spez.effort} — Abweichungen setzt der Orchestrator im Call.`,
    '',
  ];
  return teile.join('\n');
}

/** Schreibt alle Agent-Dateien. Einstieg: scripts/dispatch-agents-cli.ts —
 *  KEIN argv-Guard hier (unter vite-node ist argv[1] der vite-node-Bin, ein
 *  solcher Guard war am 20.7.2026 schon einmal ein stiller No-op, s. dispatch-cli.ts). */
export function agentenSchreiben(): string[] {
  const md = templateLesen();
  mkdirSync(AGENTS_DIR, { recursive: true });
  return Object.keys(AGENTEN).map((klasse) => {
    const pfad = `${AGENTS_DIR}/lex-${klasse}.md`;
    writeFileSync(pfad, agentDatei(klasse, md));
    return pfad;
  });
}
