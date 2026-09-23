// scripts/fahrplan-slice.ts — CLI-Hülle des FAHRPLAN-§-Slicers.
// QS-TOK / FAHRPLAN-TOKEN-OEKONOMIE.md §3 T3 «FAHRPLAN-§-Slice statt Ganzdatei».
//
// Die gesamte Logik liegt seit 4.8.2026 in `./fahrplanSlicerKern.ts` (kein
// Seiteneffekt beim Import); diese Datei ist nur noch Argument-Auswertung und
// Ausgabe. Der Re-Export hält die bestehenden Importpfade gültig
// (`src/tests/fahrplanSlice.test.ts`) — Fassaden-Muster, §6.6.
//
//   npm run fahrplan -- <FAHRPLAN-Datei> <§...>
//   npm run fahrplan -- fahrplaene/FAHRPLAN-GESETZES-UX.md 10          → Kopf + §0 + §10 + ToC
//   npm run fahrplan -- fahrplaene/FAHRPLAN-TOKEN-OEKONOMIE.md §3 §8   → Kopf + §0/Stand + §3 + §8
//   npm run fahrplan -- fahrplaene/FAHRPLAN-GESETZES-UX.md 10.7        → Unter-§ (### 10.7)
//   npm run fahrplan -- fahrplaene/FAHRPLAN-X.md                       → nur Kopf + §0 + ToC
//   npm run fahrplan -- archiv/fahrplaene/FAHRPLAN-SPLIT-VIEW.md "§STRANG B"  → mehrwortiger Zeiger
//   npm run fahrplan -- FAHRPLAN-PERFORMANCE.md 1                      → barer Name wird aufgelöst
import { readFileSync } from 'node:fs';
import { SUCHORTE, aufloesenDatei, slice } from './fahrplanSlicerKern';

export * from './fahrplanSlicerKern';

// CLI
if (!process.env.VITEST) {
  const [arg, ...keys] = process.argv.slice(2).filter((a) => a !== '--');
  if (!arg) {
    console.error(
      'Aufruf: npm run fahrplan -- <FAHRPLAN-Datei> [<§...>]\n' +
        '  z. B. npm run fahrplan -- fahrplaene/FAHRPLAN-GESETZES-UX.md 10\n' +
        '  Mehrwortige §-Zeiger in Anführungszeichen: -- <Datei> "§STRANG B"',
    );
    process.exit(2);
  }
  const datei = aufloesenDatei(arg);
  if (!datei) {
    console.error(
      `Datei nicht lesbar: ${arg} — weder im Arbeitsverzeichnis noch unter ${SUCHORTE.map((o) => `${o}/`).join(' oder ')}.\n` +
        '  Hinweis: seit AP-8 (31.7.2026) liegen die aktiven Fahrpläne in `fahrplaene/`, die archivierten in `archiv/`.',
    );
    process.exit(2);
  }
  let md: string;
  try {
    md = readFileSync(datei, 'utf8');
  } catch (e) {
    console.error(`Datei nicht lesbar: ${datei} — ${(e as Error).message}`);
    process.exit(2);
  }
  const res = slice(md, keys, datei);
  // BAUPLAN-UMBAU (David 15.8.2026): Fahrpläne sind lebendige Specs — der
  // Banner läuft mit jedem Slice aus, damit die Regel am Werkzeug klebt,
  // nicht in einer Doku, die niemand lädt.
  process.stdout.write(
    '⚠ LEBENDIGE SPEC (David 15.8.2026): Weicht dieser §-Text vom Ist-Code ab, ' +
      'wird die Spec SOFORT in der Fahrplan-Datei korrigiert (datiert, mit Anlass) ' +
      'und weitergebaut — nie gegen die veraltete Spec bauen.\n\n',
  );
  process.stdout.write(res.text);
  if (res.fehlend.length) process.exitCode = 1;
}
