// scripts/normtext/sprache-aus-body.ts — Leaf-Modul (§6.6), wortgleich aus
// adapter-entscheide.ts ausgelagert (QS-KORPUS 25.9.2026), damit auch
// entscheide-mapping.ts die Body-Sprache bestimmen kann, ohne einen Import-Zyklus
// über den Adapter zu bilden. adapter-entscheide.ts reicht `spracheAusBody` weiter.
import type { EntscheidAbschnitt, EntscheidSprache } from '../../src/lib/rechtsprechung/typen';

// A2: Sprach-Label aus dem BODY bestimmen (nicht aus dem OCL-Record kopieren —
// das war die Quelle des Mislabels: ein fr/it-BGE trägt im 'bge'-Record
// language='de', der FR/IT-Body stammt aber aus dem unterliegenden aza-Urteil).
// Deterministisch (§2): distinkte Funktionswörter je Sprache zählen, klarer
// Sieger (≥5 Treffer und ≥1.25× Zweitplatzierter) gewinnt, sonst null →
// der Aufrufer fällt auf det.language zurück. Empirisch über den ganzen Korpus
// (327 Bodies) verifiziert: 323 de / 4 fr / 0 it, kein DE-Fehlklassifikat.
const SPRACH_SIGNAL: { code: EntscheidSprache; re: RegExp }[] = [
  { code: 'de', re: /\b(?:der|die|das|und|nicht|dass|eine|auch|über|dem|den|des|ist|gegen|durch|bei|vom|wird|werden|sich|Urteil|Beschwerde|zur|zum|nach)\b/giu },
  { code: 'fr', re: /\b(?:recours|contre|cette|selon|dans|pour|qui|que|est|les|une|aux|ainsi|droit|arr[êe]t|fait|elle|leur|ont|avec|sans|sous|été)\b/giu },
  { code: 'it', re: /\b(?:che|della|nella|sono|essere|questo|ricorso|delle|dalla|alla|dei|degli|sentenza|dell|viene|stato|secondo|nonché)\b/giu },
];

/** Sprache eines Entscheids aus seinem gerenderten Body-Text ableiten (§2). */
export function spracheAusBody(abschnitte: EntscheidAbschnitt[]): EntscheidSprache | null {
  const text = abschnitte.flatMap((a) => a.bloecke.map((b) => b.text)).join(' ').slice(0, 6000);
  if (text.replace(/\s/g, '').length < 80) return null; // zu wenig Text → kein Override
  const score = SPRACH_SIGNAL
    .map(({ code, re }) => ({ code, n: (text.match(re) ?? []).length }))
    .sort((a, b) => b.n - a.n);
  const [top, zweit] = score;
  if (top.n < 5 || top.n < (zweit?.n ?? 0) * 1.25) return null;
  return top.code;
}
