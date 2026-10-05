// scripts/normtext/normtext-netz.ts — `check:normtext-netz`: Netz-Drift (check-drift.ts --netz)
// UND ZH-Quellen (zh-quellen-aufloesen.ts), beide IMMER.
//
// 5.10.2026 (Gegenprüfung MONITOR-Rückbau, Nebenbefund): vorher `check-drift && zh-quellen` —
// lieferte der erste Teil Exit 2 (Quelle nicht erreichbar) oder 1, lief ZH gar nicht und blieb
// ungeprüft. Exit = verbindeExits: Rot (1) vor «keine Aussage» (2) vor Grün (0).

import { spawnSync } from 'node:child_process';
import { verbindeExits } from './drift-logik.ts';

const teile: string[][] = [
  ['scripts/normtext/check-drift.ts', '--', '--netz'],
  ['scripts/normtext/zh-quellen-aufloesen.ts'],
];
const exits = teile.map(
  (args) => spawnSync('npx', ['vite-node', ...args], { stdio: 'inherit', env: process.env }).status ?? 1,
);
const gesamt = verbindeExits(exits);
console.log(`\ncheck:normtext-netz — Drift exit ${exits[0]} · ZH exit ${exits[1]} ⇒ exit ${gesamt}`);
process.exit(gesamt);
