// ─── check:plan Regel 16 · Posten-Modell ────────────────────────────────────
//
// ANLASS (Messung 20.9.2026, QS-EFFIZIENZ). Zwei Defekte desselben Musters:
// ROADMAP.md riss ihren 120-KiB-Deckel alle 8–15 Tage, und sie war mit 50 %
// Berührungsquote der Konflikt-Hotspot Nr. 1 der Merge-Queue. Beides kam aus
// den eingerückten Checklisten-Zeilen in offenen Schritt-Blöcken (144 offene
// Unterzeilen = 43,6 KiB). Das Posten-Modell (scripts/plan/posten.ts) gibt
// jedem Nebenfund eine eigene Datei; diese Regel hält das Modell am Leben —
// ohne sie wäre es eine Bitte, keine Konvention, und die nächste Session
// schriebe die erste Zeile wieder in die grosse Datei (F2-Familie: was nur in
// Prosa steht, verfällt).
//
// (a) POSTEN-INTEGRITÄT — die F17-Absicherung. Jede Posten-Datei hat einen
//     lesbaren Kopf, und ihr `dach:` zeigt auf einen Schritt, den ROADMAP.md
//     noch führt und der nicht `done` ist. Wird ein Dach erledigt oder
//     verschwindet es, während Posten offen sind, ist genau das der Moment, in
//     dem Arbeit unsichtbar wird — darum rot, mit Heilweg.
//
// (b) ROADMAP-SAUBERKEIT — keine eingerückte Checklisten-Zeile mehr in einem
//     Schritt-Block.
//
// GRENZEN, ausdrücklich deklariert (§6.7 — ein Tor, dessen Grenze man nicht
// kennt, wiegt in Sicherheit):
//   · ETAPPEN-KENNUNGSZEILEN (`- [ ] **S2 · …**`) bleiben erlaubt: `check:plan`
//     Regel 14 liest sie gegen den Fahrplan, ein Umzug nähme ihr die Grundlage.
//   · Eine eingerückte Zeile mit EIGENEM `@meta` ist ein etikettierter
//     Unterschritt, kein Posten — sie bleibt erlaubt.
//   · Zeilen VOR dem ersten `@meta` eines Blocks (Legenden, Querschnitt-Bänder)
//     hängen an keinem Dach und sind darum kein Posten-Fall.
import { parseRoadmap } from './parse';
import { ETAPPEN_RE, hatEigenesMeta, parsePosten, unterbloecke, type PostenDatei } from './postenKern';

export type PostenProblem = { id: string | null; meldung: string };

export function pruefePosten(md: string, dateien: readonly PostenDatei[]): PostenProblem[] {
  const probleme: PostenProblem[] = [];
  const zeilen = md.split('\n');

  // (a) Kopf-Form und lebendes Dach. Status über `parseRoadmap` — dieselbe
  // Lesung wie Parser und übrige Regeln, kein zweiter @meta-Regex (§5).
  const status = new Map(parseRoadmap(md).einheiten.map((e) => [e.id, e.etikett.status as string]));
  for (const d of dateien) {
    const p = parsePosten(d.pfad, d.inhalt);
    if ('fehler' in p) {
      probleme.push({ id: null, meldung: `${d.pfad}: ${p.fehler}` });
      continue;
    }
    const st = status.get(p.kopf.dach);
    if (st === undefined) {
      probleme.push({
        id: p.kopf.dach,
        meldung:
          `${p.pfad} hängt an Dach "${p.kopf.dach}", das ROADMAP.md nicht (mehr) führt — ` +
          `umhängen (\`dach:\` im Kopf) oder schliessen (\`npm run plan:posten -- zu ${p.pfad} --beleg "…"\`).`,
      });
    } else if (st === 'done') {
      probleme.push({
        id: p.kopf.dach,
        meldung:
          `${p.pfad} ist offen, sein Dach "${p.kopf.dach}" steht auf done — offene Arbeit unter erledigtem Kopf ` +
          `wird unsichtbar (F17). Umhängen oder schliessen (\`npm run plan:posten -- zu ${p.pfad} --beleg "…"\`).`,
      });
    }
  }

  // (b) Keine Posten-Zeilen mehr in ROADMAP.md.
  for (const b of unterbloecke(md)) {
    if (ETAPPEN_RE.test(zeilen[b.start])) continue;
    if (hatEigenesMeta(md, b)) continue;
    probleme.push({
      id: b.dach,
      meldung:
        `ROADMAP.md:${b.start + 1} «${zeilen[b.start].trim().slice(0, 60)}» ist eine eingerückte Checklisten-Zeile ` +
        `unter "${b.dach}" — seit dem Posten-Modell (20.9.2026) gehört jeder Nebenfund in eine eigene Datei: ` +
        `\`npm run plan:posten -- neu --dach ${b.dach} --titel "…"\`.`,
    });
  }

  return probleme;
}
