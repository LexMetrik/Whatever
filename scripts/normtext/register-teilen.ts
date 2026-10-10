// ─── Register-Aufteilung: Kern ⊕ Provenienz (E0-REGISTER, 10.10.2026) ────────
//
// `public/rechtsprechung/register.json` (Browse-Manifest, lazy im Browser geladen)
// trug je Eintrag `fassungsToken` (Inhalts-Hash der Quelle, 6815 × unkomprimierbar),
// den kein Browser-Pfad liest (belegt: `grep -rn fassungsToken src` ohne Tests →
// nur Typ; tsc -b nach Entfernen des Felds: nur Prüftor/Prerender-Typen betroffen).
// Er machte ~14 % der gzip-Grösse aus. Darum zwei Projektionen EINER Quelle
// (§5, Namensvorbild `public/materialien/register-provenienz.json`):
//
//   register.json              Kern  — alle übrigen Felder, unveränderte Reihenfolge
//   register-provenienz.json   { erzeugt, eintraege: { <key>: { fassungsToken } } }
//
// `quelleUrl` bleibt im Kern: EntscheidKarte.tsx:165 liest sie für den «↗ amtlich»-
// Link (der Auftrag nahm an, kein Browser-Pfad lese sie — falsifiziert 10.10.2026).//
// Beide Funktionen sind rein und deterministisch (§2). `vereinigeRegister` ist die
// Umkehrung von `teileRegister`: Roundtrip byte-gleich unter `serialisiere()` — das
// ist der Verhaltensneutralitäts-Beweis (§6) und wird im Test geführt.

import type {
  BrowseEntscheid, BrowseEntscheidVoll, EntscheidManifest, EntscheidManifestVoll,
  EntscheidProvenienz, EntscheidProvenienzRegister,
} from '../../src/lib/rechtsprechung/register';

/** Feld, hinter dem `fassungsToken` im vereinigten Eintrag steht (Schreibreihenfolge in entscheide-schreiben.ts). */
const ANKER_FELD = 'quelleUrl';

/** Vollregister → Kern + Provenienz. Reihenfolge der Einträge und der übrigen Felder bleibt. */
export function teileRegister(voll: EntscheidManifestVoll): { kern: EntscheidManifest; provenienz: EntscheidProvenienzRegister } {
  const eintraege: Record<string, EntscheidProvenienz> = {};
  const entscheide: BrowseEntscheid[] = voll.entscheide.map((e) => {
    const { fassungsToken, ...kernEintrag } = e;
    if (Object.prototype.hasOwnProperty.call(eintraege, e.key)) {
      throw new Error(`[register-teilen] doppelter key «${e.key}» — Provenienz nicht eindeutig`);
    }
    eintraege[e.key] = { fassungsToken };
    return kernEintrag;
  });
  return {
    kern: { erzeugt: voll.erzeugt, entscheide },
    provenienz: { erzeugt: voll.erzeugt, eintraege },
  };
}

/** Kern + Provenienz → Vollregister (Umkehrung von `teileRegister`; wirft bei Waisen und Lücken). */
export function vereinigeRegister(kern: EntscheidManifest, provenienz: EntscheidProvenienzRegister): EntscheidManifestVoll {
  if (kern.erzeugt !== provenienz.erzeugt) {
    throw new Error(`[register-teilen] erzeugt weicht ab: Kern ${kern.erzeugt} ≠ Provenienz ${provenienz.erzeugt}`);
  }
  const gesehen = new Set<string>();
  const entscheide: BrowseEntscheidVoll[] = kern.entscheide.map((e) => {
    const p = Object.prototype.hasOwnProperty.call(provenienz.eintraege, e.key) ? provenienz.eintraege[e.key] : undefined;
    if (!p) throw new Error(`[register-teilen] «${e.key}» ohne Provenienz-Eintrag`);
    gesehen.add(e.key);
    if (!Object.prototype.hasOwnProperty.call(e, ANKER_FELD)) {
      throw new Error(`[register-teilen] «${e.key}» ohne Feld «${ANKER_FELD}» — Einfügeposition unbestimmt`);
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(e)) {
      out[k] = v;
      if (k === ANKER_FELD) out.fassungsToken = p.fassungsToken;
    }
    return out as unknown as BrowseEntscheidVoll;
  });
  const waisen = Object.keys(provenienz.eintraege).filter((k) => !gesehen.has(k));
  if (waisen.length) {
    throw new Error(`[register-teilen] ${waisen.length} Provenienz-Eintrag/-einträge ohne Kern-Eintrag: ${waisen.slice(0, 5).join(', ')}`);
  }
  return { erzeugt: kern.erzeugt, entscheide };
}
