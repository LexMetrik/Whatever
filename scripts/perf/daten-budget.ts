// scripts/perf/daten-budget.ts — Daten-Nutzlast-Budgets für check:perf-budget.
//
// STEUERDECKEL-WURZELFIX (QS-PERF, 15.9.2026): ausgelagert aus
// scripts/check-perf-budget.ts, weil dessen Erweiterung um `public/normtext/
// register.json` + die Struktur-Sidecar-Glob-Prüfung die Steuerungs-Fläche
// `scripts/check-*.ts` über den Deckel (204 KB, struktur-rotieren.py
// FLAECHEN_BUDGET) trieb — Deckel-Anhebung wäre Symptombehandlung gewesen
// (§17), die eigentliche Ursache ist Prüf-LOGIK, die in der Steuerungs-Fläche
// liegt, obwohl sie dort nicht liegen muss. Dieses Modul ist Nachbar von
// `lighthouse-budget.ts` (`scripts/perf/`, GLOB matcht nur `scripts/check-*.ts`,
// nicht `scripts/perf/**`) und wird von `check-perf-budget.ts` importiert.
//
// VERHALTEN BYTE-GLEICH zum vorherigen Inline-Code: gleiche Konsolenzeilen,
// gleiche Fehlermeldungen, gleiche Exit-Bedingungen (geprüft per Rot-Probe,
// s. Commit-Message). `gz`/`kb` sind hier die EINE Quelle (§5) — check-perf-
// budget.ts importiert sie für die Bundle-Topologie-Prüfung mit.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

export const gz = (p: string): number => gzipSync(readFileSync(p)).length;
export const kb = (n: number): string => `${(n / 1024).toFixed(1)} KB`;

// gzip-Budgets. (Gegenprüfung 20.7.2026: Tor prüfte nur dist/assets/*.js,
// register.json-Wachstum +118 KB gzip blieb unentdeckt — public/**/*.json
// seither im Budget; register.json lädt jede Leserseite.)
//
//    W2·5 (25.7.2026): Artikel-Suchindex dazu — lazy, aber gedeckelt, weil der
//    kantonale Korpus weiterwächst und der clientseitige Indexaufbau mit der
//    Artikelzahl skaliert (bei 54 444 Artikeln ~6.1 s node / 5.3 s Browser, riss
//    auf dem ~3.9× langsameren CI-Runner die Smoke-Suite). Wer die Schranke
//    anhebt, hebt auch die Wartezeit bis zum ersten Treffer — Staffelung
//    (artikelVolltext.ts `baue()`) mitdenken.
//
//    K3-SCHARFSCHALTUNG (1.9.2026): Deckel GESENKT, nicht gelockert — Generator
//    schreibt seit Korpusstand `123ffe495` per Default nur noch Bund-Ebene
//    (such-index-generieren.ts `EBENEN_DEFAULT`), kantonaler Volltext kommt aus
//    der Edge-Suche: 9 974.0 → 5 311.0 KB gzip (−46.8 %), neuer Deckel 5 850 KB.
//
//    W2·6-NKEY (28.7.2026): `norm-index.json` → `norm-index-erlasse.json` — der
//    normKeys-Backfill trieb den Monolithen auf 724 KB gzip (Erlass-Ebene allein
//    93 KB), der Nutzerpfad (kontextEntscheide → Verweis-Popover) braucht aber
//    nur die Erlass-Ebene. Monolith bleibt Build-/Prüf-Artefakt (eigenes Budget:
//    `NORM_INDEX_BUDGET_MB` in scripts/normtext/check-entscheide.ts). Schranke =
//    Ist 93 KB + ~30 % Reserve. §15: kein Logikverlust, nur weniger Bytes. Wer
//    `ladeNormIndex()` wieder in eine Komponente holt, muss hier neu eintragen.
//
//    Linse 4 (28.7.2026): derselbe Backfill hob register.json auf 756.9 KB gegen
//    das 780-KB-Budget (97 % Ausnutzung, normKeys-Vollständigkeit) — bewusst
//    nicht hier gelöst (§8); Verschlankung in eigene Projektion ist Folgearbeit.
//    QS-PERF (15.9.2026, Tor-Diagnose LCP-Element + Budget-Deckel Register/
//    Sidecars): `public/normtext/register.json` (der Normtext-Katalog, nicht
//    zu verwechseln mit dem Rechtsprechungs-Register oben) hatte BISHER GAR
//    KEIN Budget — Anlass war derselbe wie bei Linse 4: die Datei wuchs mit
//    W2·5n weiter (1518 KB roh, gemessen `wc -c public/normtext/register.json`,
//    15.9.2026) und lädt wie das Rechtsprechungs-Register jede Leserseite.
//    Deckel erzwingt bewusst den Register-Schnitt, nicht umgekehrt (§17: ein
//    Wachstum, das kein Tor sieht, kommt wieder). Ist NACH DER CODE-MESSUNG
//    (`gz()` = `zlib.gzipSync`, nicht CLI-`gzip`): 158.5 KB / 162335 Bytes,
//    15.9.2026 — Budget = Ist + ~10 % Kopffreiheit, absichtlich eng: die
//    Datei soll NICHT unbemerkt weiterwachsen, ein Rückschritt soll sofort
//    rot sein. (Bug-Check PR #874: die zuvor hier genannten 163 KB stammten
//    aus CLI-`gzip -c … | wc -c` = 163323 Bytes — Node-`zlib.gzipSync` misst
//    wegen anderer Default-Kompression/Header ~0.6 % tiefer; das Tor prüft
//    ausschliesslich den `gz()`-Wert, der Deckel 175 KB bleibt unverändert.)
//
//    Freigabe David 25.9.2026 (Chat, §15-Budgetentscheid): register.json 780 →
//    900 KB. Anlass: BS-Delta #1112 (+185 Urteile) hob das Register auf 795.0 KB
//    gzip (merge_group-Lauf 36141636309 rot); die Wochen-Automatik (#1113) lässt
//    es weiter wachsen. Reserve ≈ 3–4 Monate Zuwachs. Kein Logikverlust (§15):
//    nur die Schranke, keine Projektion geändert. Wurzel-Fix als Posten
//    QS-PERF «Rechtsprechungs-Register aufteilen» — die Anhebung ersetzt ihn nicht.
export const DATEN_BUDGET: readonly (readonly [string, number])[] = [
  ['public/rechtsprechung/register.json', 900 * 1024],
  ['public/rechtsprechung/richter.json', 24 * 1024],
  ['public/rechtsprechung/norm-index-erlasse.json', 120 * 1024],
  ['public/such-index/artikel.json', 5_850 * 1024], // K3, 1.9.2026: Ist 5 311 KB gzip (Bund-only)
  ['public/normtext/register.json', 175 * 1024], // QS-PERF 15.9.2026: Ist 163 KB gzip, s. Begründung oben
  // ── W2·7-BEZUG: die drei grössten Bezugs-Shards ───────────────────────────
  // Ein Nutzer lädt genau EINEN Shard (seinen Erlass), nie die Summe — Schranke
  // ist der Grösste, nicht das Verzeichnis. DREI Einträge (Gegenprüfung Runde
  // 1/I3, 29.7.2026): BV mit 123.3 KB gzip ist grösser als StPO (102.0 KB) —
  // BGG als Ausreisser, BV/StPO als das, was ein grosser Erlass normal kostet.
  //
  // B7 (David-Auftrag 28.7.2026): Auslieferungs-Deckel «8 je Status» aufgehoben,
  // jede Kante eines Artikels wird ausgeliefert (24'173 → 75'365 Kanten) —
  // Budgets deshalb angehoben, nicht weil man an sie stiess (§8).
  //
  // Gemessen 29.7.2026 (`gzip -6 -c`, `serialisiereShard`; Gegenprüfung Runde
  // 1/I2 — Vorher-Werte aus `git show origin/main`, nicht erinnert):
  //   BGG   300.2 KB (vorher 44.1 KB, Faktor 6.8) — Art. 42 BGG trägt 4'140 Kanten
  //   BV    123.3 KB (vorher 46.8 KB, Faktor 2.6)
  //   StPO  102.0 KB (vorher 63.6 KB, Faktor 1.6)
  //   StGB   77.8 KB (vorher 56.3 KB)
  //
  // §15 Logikverlust: keiner — Shard liegt nicht auf dem kritischen Pfad, lädt
  // nur bei aktiver Instanz-Facette (`bezuegeLaden.ts`). Budgets = Ist + ~28 %.
  ['public/rechtsprechung/bezuege/BGG.json', 384 * 1024],
  ['public/rechtsprechung/bezuege/BV.json', 160 * 1024],
  ['public/rechtsprechung/bezuege/STPO.json', 132 * 1024],
];

// Gemessen wird dist/ (Ausgelieferte Kopie), public/ nur als Rückfall —
// CI-Befund 25.7.2026: public/such-index/artikel.json ist gitignored, entsteht
// erst im Build; ohne dist/-Fallback lief das Tor rot mit «fehlt», obwohl die
// Datei existierte. vite build kopiert public/ nach dist/.
export const daten = (rel: string): string | null => {
  const inDist = join(process.cwd(), 'dist', rel.replace(/^public\//, ''));
  if (existsSync(inDist)) return inDist;
  const inPublic = join(process.cwd(), rel);
  return existsSync(inPublic) ? inPublic : null;
};

// STRUKTUR-SIDECARS (Glob-Deckel, QS-PERF 15.9.2026): `public/normtext/
// struktur/**/*.json` — je Erlass ein Ganzarchiv-Baum, Bund + Kanton,
// 1535 Dateien (gezählt 15.9.2026) — hatte wie das Register oben BISHER
// KEIN Budget. Anders als bei DATEN_BUDGET gibt es hier keine feste
// Dateiliste (die Bezügs-Shards oben SIND schon eine feste Dreier-Liste,
// kein Glob): der kantonale Korpus wächst laufend (W2·13-KANTONE), ein
// einzelner neuer Erlass darf das Tor nicht an drei Stellen zugleich
// ändern müssen. Ein Nutzer lädt nie die Summe, sondern höchstens EINEN
// Erlass — die Schranke ist deshalb wie bei den Bezügs-Shards die
// GRÖSSTE Einzeldatei, nicht das Verzeichnis.
//
// Ist NACH DER CODE-MESSUNG (`gz()` = `zlib.gzipSync`, nicht CLI-`gzip`;
// 15.9.2026): OR.json 85.2 KB / 87246 Bytes gzip (grösster Bund-Erlass),
// ZGB 70.4 KB, STGB 43.0 KB. Budget = Ist(OR) + ~11 % Kopffreiheit — bewusst
// eng aus demselben Grund wie beim Register: der Schnitt ist Ziel, nicht
// Ausnahme. (Bug-Check PR #874: die zuvor hier genannten 87.6/70.7/43.2 KB
// stammten aus CLI-`gzip -c … | wc -c` — Node-`zlib.gzipSync` misst wegen
// anderer Default-Kompression/Header minimal tiefer; das Tor prüft
// ausschliesslich den `gz()`-Wert, der Deckel 95 KB bleibt unverändert.)
export const STRUKTUR_GLOB = { basis: 'public/normtext/struktur', max: 95 * 1024 };

/** Alle Dateien unter `dir`, die auf `endung` enden — rekursiv (Bund-/Kanton-
 *  Unterordner). Reihenfolge ist irrelevant, es wird nur das Maximum gesucht. */
export function alleDateien(dir: string, endung: string): string[] {
  const out: string[] = [];
  for (const eintrag of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, eintrag.name);
    if (eintrag.isDirectory()) out.push(...alleDateien(p, endung));
    else if (eintrag.name.endsWith(endung)) out.push(p);
  }
  return out;
}

/**
 * Prüft DATEN_BUDGET (feste Liste) + STRUKTUR_GLOB (Glob, grösste Einzeldatei),
 * druckt dieselben Konsolenzeilen wie vorher inline in check-perf-budget.ts und
 * gibt die Fehlermeldungen zurück (Aufrufer sammelt sie in sein eigenes `fehler[]`).
 */
export function pruefeDatenBudgets(): string[] {
  const fehler: string[] = [];

  console.log('check:perf-budget — Daten-Nutzlast (gzip):');
  for (const [rel, max] of DATEN_BUDGET) {
    const p = daten(rel);
    if (!p) { fehler.push(`${rel} fehlt (weder in dist/ noch in public/) — Budget nicht prüfbar.`); continue; }
    const g = gz(p);
    console.log(`  ${rel.replace('public/', '')}  gzip ${kb(g)}  (Budget ${kb(max)})`);
    if (g > max) {
      fehler.push(`${rel} ${kb(g)} > Budget ${kb(max)} — Daten-Nutzlast auf dem kritischen Pfad. `
        + 'Entweder die Projektion verschlanken (Felder/Rollen auslagern) oder das Budget bewusst anheben.');
    }
  }

  console.log('check:perf-budget — Struktur-Sidecars (gzip, grösste Einzeldatei):');
  const strukturBasis = daten(STRUKTUR_GLOB.basis);
  if (!strukturBasis) {
    fehler.push(`${STRUKTUR_GLOB.basis}/ fehlt (weder in dist/ noch in public/) — Budget nicht prüfbar.`);
  } else {
    const dateien = alleDateien(strukturBasis, '.json');
    if (dateien.length === 0) {
      fehler.push(`${STRUKTUR_GLOB.basis}/ enthält keine *.json — Budget nicht prüfbar.`);
    } else {
      let groesste = { pfad: dateien[0], g: gz(dateien[0]) };
      for (const p of dateien.slice(1)) {
        const g = gz(p);
        if (g > groesste.g) groesste = { pfad: p, g };
      }
      const name = groesste.pfad.slice(strukturBasis.length + 1);
      console.log(`  ${name}  gzip ${kb(groesste.g)}  (Budget ${kb(STRUKTUR_GLOB.max)}, grösste von ${dateien.length} Dateien)`);
      if (groesste.g > STRUKTUR_GLOB.max) {
        fehler.push(`${STRUKTUR_GLOB.basis}/${name} ${kb(groesste.g)} > Budget ${kb(STRUKTUR_GLOB.max)} — grösste Struktur-Sidecar-Datei. `
          + 'Entweder den Erlass-Baum verschlanken oder das Budget bewusst anheben.');
      }
    }
  }

  return fehler;
}
