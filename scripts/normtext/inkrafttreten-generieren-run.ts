// ─── Runner: Netz-Lauf von «in Kraft seit» + «gestaffelt» (npm run gen:inkrafttreten) ──
//
// Getrennt vom reinen Modul inkrafttreten-generieren.ts (Muster browse-manifest-run.ts /
// revisionen-generieren-run.ts): das Modul bleibt ohne Seiteneffekt importierbar. Der
// frühere Einstieg im Modul selbst (Schutz nur `!process.env.VITEST`) startete den
// Netzlauf bei JEDEM Import ausserhalb von Vitest und überschrieb inkrafttreten.json
// (reproduziert 2.10.2026: Import aus einem vite-node-Scratch-Skript). Unter vite-node
// lässt sich der Einstieg nicht am argv erkennen (das Skript wird aus argv entfernt),
// darum die Trennung in zwei Dateien statt eines Guards.
//
//   npm run gen:inkrafttreten
import { readFileSync, writeFileSync } from 'node:fs';
import {
  bundInkrafttreten, bundStaffelung, inkraftEintraege, inkrafttretenJson,
  INKRAFT_JSON, REGISTER_JSON, type ErlassBasis,
} from './inkrafttreten-generieren.ts';

function heute(): string {
  const j = new Date();
  return `${j.getFullYear()}-${String(j.getMonth() + 1).padStart(2, '0')}-${String(j.getDate()).padStart(2, '0')}`;
}

async function main() {
  const erlasse = (JSON.parse(readFileSync(REGISTER_JSON, 'utf8')) as { erlasse: ErlassBasis[] }).erlasse;
  const bund = erlasse.filter((e) => e.status === 'snapshot' && e.quelleUrl && e.ebene === 'bund' && e.sr);

  const { map, ohne } = await bundInkrafttreten(bund, fetch);
  const staffel = await bundStaffelung(bund, map, fetch);
  const eintraege = inkraftEintraege(bund, map, staffel);
  writeFileSync(INKRAFT_JSON, inkrafttretenJson(eintraege), 'utf8');
  console.log(`Bund: ${Object.keys(map).length}/${bund.length} Ur-Inkrafttreten; ${ohne.length} ohne/mehrdeutig: ${ohne.join(', ') || '—'}`);
  const gest = Object.entries(staffel).filter(([, v]) => v.gestaffelt);
  console.log(`Gestaffelt: ${gest.length}/${bund.length}`);
  for (const [k, v] of gest) console.log(`  ${k}: ${v.gestaffeltGrund.join(', ')}${v.teilDaten ? ` [${v.teilDaten.join(' ')}]` : ''}`);
  console.log(`Kanton: bewusst 0 (LexWork trägt kein strukturelles Ur-Inkrafttreten, §8).`);
  console.log(`\n${Object.keys(eintraege).length} Einträge → public/normtext/inkrafttreten.json (Lauf ${heute()}).`);
  console.log('Nachlauf: `npm run normtext:register` (Projektion → register.json), `npm run datenhaltung:manifest`.');
}

void main();
