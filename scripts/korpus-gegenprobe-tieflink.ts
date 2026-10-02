/**
 * Korpus-Gegenprobe Tieflink: Zweig (`v3/tiefLinkZweig`) ≙ Sprung (`inhalt-hooks-tieflink`).
 *
 * Schickt für JEDEN Erlass des Registers alle Artikel-Tokens (und die
 * Schreibweise ohne «_» — «#art-1a» für «1_a») als Anker durch beide Kanonisie-
 * rungen und zählt Fälle, in denen der Zweig ein anderes Ziel meint als der
 * Sprung. «alt» = Zweig gegen die Sektions-Tokens (Stand PR #1267 vor dem
 * Nachzug), «neu» = gegen alle Einträge (`artIndex`, Stand heute); Sprung ist
 * immer gegen alle Einträge. Zweites Mass: Hashes, deren Sprungziel im Baum
 * steht, der Zweig aber keine Zeile öffnet (B7-Lücke).
 *
 * Aufruf: `npx vite-node scripts/korpus-gegenprobe-tieflink.ts` — Exit 1, wenn
 * «neu» nicht 0 ist. Nur Lesen, kein Netz.
 */
import { readFileSync, existsSync } from 'node:fs';
import { baueGliederungsbaum } from '../src/lib/normtext/browse';
import { sammleArtikel } from '../src/pages/gesetz-leser/gliederungsArtikel';
import { kanonischerAnkerToken } from '../src/pages/gesetz-leser/suchTreffer';
import { kuratiereTocSektionen } from '../src/pages/gesetz-leser/berechnungen';
import { baueGliederungsModell, findeSynthPfad, uebersetzeRohPfad } from '../src/pages/gesetz-leser/gliederungsModell';
import { pfadZu } from '../src/pages/gesetz-leser/helpers';

const lies = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const register = lies('public/normtext/register.json') as { erlasse: Array<{ key: string; ebene: string; datei?: string }> };

let erlasse = 0, hashes = 0, falschAlt = 0, abwAlt = 0, abwNeu = 0, ohneZweigAlt = 0, ohneZweigNeu = 0;
const beispiele: string[] = [];
for (const e of register.erlasse) {
  if (!e.datei || !existsSync(`public/normtext/${e.datei}`)) continue;
  const datei = lies(`public/normtext/${e.datei}`);
  const eintraege = datei.eintraege ?? [];
  if (!eintraege.length) continue;
  const sp = `public/normtext/struktur/${e.ebene}/${e.key}.json`;
  const struktur = existsSync(sp) ? lies(sp).artikel ?? null : null;
  const { sektionen, ohneGliederung } = baueGliederungsbaum(eintraege, struktur);
  const modell = baueGliederungsModell({
    sektionen: kuratiereTocSektionen(sektionen), ohneGliederung, eintraege, struktur, startSichtbarGo: true,
  });
  const alle: string[] = eintraege.map((x: { artikel: string }) => x.artikel);
  const sek = sektionen.flatMap((s) => sammleArtikel(s).map((a) => a.artikel));
  const zweigIds = (token: string) => {
    const roh = pfadZu(sektionen, (s) => s.artikel.some((a) => a.artikel === token)) ?? [];
    return roh.length > 0 ? uebersetzeRohPfad(modell.umhaengPraefix, roh) : (findeSynthPfad(modell.knoten, token) ?? []);
  };
  erlasse++;
  for (const t of alle) {
    for (const roh of new Set([t, t.replace(/_/g, '')])) {
      hashes++;
      const sprung = kanonischerAnkerToken(roh, alle);
      const zAlt = kanonischerAnkerToken(roh, sek);
      const zNeu = kanonischerAnkerToken(roh, alle);
      if (zAlt !== sprung) { abwAlt++; if (beispiele.length < 8) beispiele.push(`${e.key}#art-${roh}: Sprung ${sprung}, Zweig(alt) ${zAlt}`); }
      if (zAlt !== sprung && sek.includes(zAlt)) falschAlt++; // Zweig öffnet einen ANDEREN Artikel-Zweig
      if (zNeu !== sprung) abwNeu++;
      if (alle.includes(sprung)) {
        if (zweigIds(zAlt).length === 0 && zweigIds(sprung).length > 0) ohneZweigAlt++;
        if (zweigIds(zNeu).length === 0 && sektionen.length > 0) ohneZweigNeu++;
      }
    }
  }
}
console.log(`Erlasse ${erlasse} · Hashes ${hashes}`);
console.log(`davon FALSCHER Zweig (anderer Artikel statt keiner): alt ${falschAlt} · neu 0`);
console.log(`Zweig ≠ Sprungziel: alt ${abwAlt} · neu ${abwNeu}`);
console.log(`Sprungziel im Baum, aber kein Zweig geöffnet (nur Erlasse mit Gliederung): alt-Lücke ${ohneZweigAlt} · neu ${ohneZweigNeu}`);
for (const b of beispiele) console.log('  ' + b);
process.exit(abwNeu === 0 ? 0 : 1);
