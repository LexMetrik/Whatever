// ─── Änderungsliste der BS-Datumsberichtigung (Variante A) — generiert, nie von Hand ─
//
// Schreibt bibliothek/rechtsprechung/bs-datum-kopf-<datum>.md aus dem Bericht von
// `berichtigeBsDatum` (bs-parse.ts). Jede Änderung trägt ihre Kopf-Fundstelle
// (Titelzeile + Datumszeile des Deckblatts, Einheit im Dokument-Body) und den
// Portal-Link (§7: Norm/Entscheid + Link + Stand). Deterministisch (§2): Sortierung
// nach id, Datum nur über das übergebene Laufdatum.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BsDatumBericht } from './bs-datum-berichtigung';
import { KOPF_PORTAL_FENSTER_TAGE } from './bs-datum';

const de = (iso: string): string => iso.split('-').reverse().join('.');
const ze = (s: string): string => s.replace(/\|/g, '\\|');

export function formatiereDatumBericht(b: BsDatumBericht, datum: string, inventarStand: string): string {
  const L: string[] = [];
  const bis = b.aenderungen.map((a) => a.tage);
  const fs = (f: { titel: string; text: string; einheit: number } | null) => (f ? `«${ze(f.titel)}» / «${ze(f.text)}» (E ${f.einheit})` : '— (kein Kopf-Datum gelesen)');
  L.push(`# BS-Entscheiddatum aus dem Urteilskopf — Änderungsliste (${datum})`);
  L.push('');
  L.push('<!-- GENERIERT von `npm run entscheide:bs -- --datum-kopf-berichtigung` — nicht von Hand editieren. -->');
  L.push('');
  L.push('**Anlass/Entscheid:** Gegenprüfung PR #1295 (4.10.2026); Entscheid David 4.10.2026 (Chat): Regel «Variante A» (Kopf vor Plattform, wie für die OCL-Kantone am 25.9.2026) auch für Basel-Stadt, Bestand berichtigen, «jeweils hinweis wenn es abweicht». Roadmap: QS-KORPUS.');
  L.push('');
  L.push(`**Quelle und Stand:** amtliches Rechtsprechungsportal der Gerichte BS, https://rechtsprechung.gerichte.bs.ch (Dokumente abgerufen ${datum}; Portal-Inventar vom ${inventarStand}). Massgeblich ist die amtliche Fassung, nie dieses Artefakt (§7). «alt» = Portal-Metadatum «Entscheiddatum» (Stand vor Variante A), «neu» = Datum im Urteilskopf.`);
  L.push('');
  L.push('## Zahlen (per Skript gezählt)');
  L.push('');
  L.push(`- Geprüfte Basler Entscheide (Rohdokument neu gelesen): **${b.geprueft}**`);
  L.push(`- **Datum gegenüber dem Portal geändert: ${b.aenderungen.length}**${b.geprueft ? ` (${((b.aenderungen.length / b.geprueft) * 100).toFixed(1)} %)` : ''} — Kopf-Datum weicht ab, wird angezeigt; das Portal-Datum steht als Hinweis daneben (\`datumPortal\`)`);
  L.push(`- **Verdacht: ${b.verdacht.length}** — Kopf-Datum nicht übernommen (> ${KOPF_PORTAL_FENSTER_TAGE} Tage / vor GN-Jahr / nach Erstpublikation / Zukunft; Setzwert Orchestrator, nicht von David). Angezeigt bleibt das Portal-Datum, daneben der Hinweis «Der Urteilskopf nennt den …; welches Datum zutrifft, ist ungeklärt» (\`datumKopfAbweichend\`)`);
  L.push(`- Kopf = Portal: ${b.kopfGleich} · kein Kopf-Datum lesbar (Portal bleibt): ${b.ohneKopf} · Portal ohne Datum, Kopf füllt die Lücke (B-1): ${b.portalOhneDatum}`);
  L.push(`- Nicht angefasst (Vorbedingung verletzt): ${b.uebersprungen.length}`);
  if (bis.length) L.push(`- Abstand Kopf − Portal in Tagen (übernommene): kleinster ${Math.min(...bis)}, grösster ${Math.max(...bis)}`);
  L.push('');
  L.push('Regel: `scripts/rechtsprechung/bs-datum.ts` (`waehleBsDatum`, Titel-Erkennung `KOPF_TITEL_RE`/`KOPF_TITEL_KOMPOSITUM_RE`). Nicht erkannt (Rückfall Portal): Titel «… (Rektifikat)» und «REKTIFIKAT» — dort nennt das Datum den Berichtigungsakt.');
  L.push('');
  L.push(`## Verdacht (${b.verdacht.length}) — Portal-Datum bleibt, Hinweis auf das Kopf-Datum`);
  L.push('');
  if (!b.verdacht.length) L.push('Keiner.');
  else {
    L.push('| Aktenzeichen | Portal (angezeigt) | Kopf (Hinweis) | Grund | Kopf-Fundstelle | Portal |');
    L.push('|---|---|---|---|---|---|');
    for (const v of b.verdacht) L.push(`| ${v.gn} | ${v.portal ? de(v.portal) : '–'} | ${v.kopf ? de(v.kopf) : '–'} | ${ze(v.grund)} | ${fs(v.fund)} | [Dokument](${v.url}) |`);
  }
  L.push('');
  L.push(`## Nicht angefasst (${b.uebersprungen.length})`);
  L.push('');
  if (!b.uebersprungen.length) L.push('Keine.');
  else for (const u of b.uebersprungen) L.push(`- ${u.id}: ${u.grund}`);
  L.push('');
  L.push(`## Alle Änderungen (${b.aenderungen.length}) — Az · alt (Portal) · neu (Kopf) · Kopf-Fundstelle`);
  L.push('');
  L.push('| Aktenzeichen | alt (Portal) | neu (Kopf) | Tage | Kopf-Fundstelle (Titelzeile / Datumszeile, Einheit n) | Portal |');
  L.push('|---|---|---|---:|---|---|');
  for (const a of b.aenderungen) {
    L.push(`| ${a.gn} | ${de(a.alt)} | ${de(a.neu)} | ${a.tage > 0 ? '+' : ''}${a.tage} | ${fs(a.fund)} | [Dokument](${a.url}) |`);
  }
  L.push('');
  return L.join('\n');
}

export function schreibeDatumBericht(b: BsDatumBericht, datum: string, inventarStand: string, root = process.cwd()): string {
  const pfad = join(root, 'bibliothek', 'rechtsprechung', `bs-datum-kopf-${datum}.md`);
  writeFileSync(pfad, formatiereDatumBericht(b, datum, inventarStand), 'utf8');
  return pfad;
}
