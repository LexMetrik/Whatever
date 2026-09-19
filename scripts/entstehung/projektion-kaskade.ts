// scripts/entstehung/projektion-kaskade.ts — die Projektions-Teilkaskade NACH einer
// Materialien-/Entstehungs-Bewegung (§17-Wurzelfix QS-MONITOR-ROT, 19.9.2026).
//
// WARUM EIN EIGENES SKRIPT UND NICHT NUR EIN GLIED VON `materialien:kaskade`: dieselben
// vier Schritte müssen auch die Monats-Workflow-Jobs fahren, die selbst KEIN
// `materialien:kaskade` aufrufen — der Curia-Job bewegt nur Curia-Shards +
// Entstehungs-Ableitungen, nie die Soft-Law-Projektion/Revisionen/Churn-Reset, die
// `materialien:kaskade` sonst antreibt. Zwei Glieder-Listen an zwei Stellen wären eine
// §5-Zweitwahrheit; hier ist EINE Datei mit zwei Aufrufern: `materialien:kaskade` ruft
// sie am Ende, die Workflow-Jobs rufen sie direkt (Skill `auftrag` Ziff. 6 (g)).
//
// REIHENFOLGE — aus den Lese-Abhängigkeiten der Generatoren, nicht alphabetisch:
//   1. gen:entstehung-projektion — baut public/materialien/entstehung/<KEY>.json aus
//      Botschaften/Historie/Revisionen. Muss vor 2. laufen: die Deckungs-Sicht liest
//      genau dieses Verzeichnis (ENTSTEHUNG_DIR, deckung-projektion-quellen.ts).
//   2. gen:entstehung-deckung — baut public/materialien/deckungs-sicht.json aus 1. +
//      Curia-Shards + register-provenienz.json + Normregister. Muss NACH jeder
//      Bewegung laufen, die irgendeine dieser Quellen anfasst — sonst rot in
//      `check:entstehung` Ziff. 7 (Rot-Beleg: Lauf 35373415150, 18.9.2026 — nach
//      `materialien:curia` ohne diesen Schritt meldete das Tor «1 Abweichung zur
//      Neuberechnung», weil die neuen Curia-Shards nie zurück in die Sicht liefen).
//   3. gen:zaehler — liest register.json/startseiteConfig, unabhängig von 1./2.; hier
//      statt vorher, damit eine Bewegung, die neue Erlasse/Materialien einreiht, sich
//      in denselben Zahlen zeigt, die diese Kaskade zuletzt hinterlässt.
//   4. datenhaltung:manifest — immer zuletzt (Skill `auftrag` Ziff. 6 (g)): jedes der
//      drei vorigen Glieder kann eine ausgelieferte Datei ändern, deren sha/Grösse im
//      Manifest steht.
//
// Kein `--datum` nötig: alle vier Glieder sind netz- UND uhrfrei (§2) — reine
// Ableitungen aus bereits committeten Artefakten. Bricht beim ersten roten Glied ab
// (Exit-Code des Glieds), damit kein Folge-Artefakt aus einem kaputten Vorgänger
// entsteht (Muster `materialien/kaskade-run.ts`).
//
// Aufruf: npm run entstehung:projektion-kaskade

import { spawnSync } from 'node:child_process';

const GLIEDER: string[] = [
  'gen:entstehung-projektion',
  'gen:entstehung-deckung',
  'gen:zaehler',
  'datenhaltung:manifest',
];

for (const name of GLIEDER) {
  console.log(`\n══ entstehung:projektion-kaskade → npm run ${name} ══`);
  const r = spawnSync('npm', ['run', name], { stdio: 'inherit', env: process.env });
  if ((r.status ?? 1) !== 0) {
    console.error(`\nentstehung:projektion-kaskade ROT bei «${name}» (exit ${r.status ?? 1}) — Folge-Glieder NICHT gefahren.`);
    process.exit(r.status ?? 1);
  }
}
console.log(`\nentstehung:projektion-kaskade fertig — ${GLIEDER.length} Glieder grün.`);
