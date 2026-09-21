// scripts/aufraeumen-git.ts — `npm run aufraeumen:git`.
//
// Werkstatt-Werkzeug (Klasse bau, keine Rechtslogik): klassiert liegengebliebene
// Git-Flächen (lokale Branches + Worktrees) und räumt sie auf Geheiss ab.
// Anlass, Regeln und Fail-closed-Politik stehen im Kopf von
// scripts/plan/gitFlaechen.ts — hier steht nur die Bedienung.
//
//   npm run aufraeumen:git                 Trockenlauf (Default, ändert nichts)
//   npm run aufraeumen:git -- --ausfuehren  räumt ab
//
// Der Trockenlauf ist der Default und bleibt es: ein Werkzeug, das beim
// blossen Aufruf löscht, wird einmal aus Versehen aufgerufen.

import { berichtZeilen } from './plan/gitFlaechen';
import { erhebe, raeumeAb } from './plan/gitFlaechenSammeln';

const ausfuehren = process.argv.includes('--ausfuehren');
const bef = erhebe({ mitGh: true });
const z = (s: string) => console.log(s);

z('── Git-Flächen ──────────────────────────────────────────────');
if (!bef.ghVerfuegbar) {
  z('⚠️  `gh` nicht abfragbar — nur LEERE Branches gelten als abräumbar (fail-closed).');
  z('    Gelandete Branches bleiben stehen, bis die PR-Lage geprüft werden kann.');
}
for (const zeile of berichtZeilen(bef, Math.floor(Date.now() / 1000))) z(zeile);
z('');

if (!ausfuehren) {
  z('ℹ️  Trockenlauf — nichts geändert. Abräumen: npm run aufraeumen:git -- --ausfuehren');
  process.exit(0);
}

z('── Abräumen ─────────────────────────────────────────────────');
const { zeilen, fehler } = raeumeAb(bef);
for (const zeile of zeilen) z(zeile);
z('');
z('ℹ️  Gelöschtes bleibt über den oben gedruckten SHA erreichbar, solange das Reflog reicht.');
if (fehler > 0) {
  z(`❌ ${fehler} Objekt(e) konnten nicht abgeräumt werden (s. oben) — nichts erzwungen.`);
  process.exit(1);
}
