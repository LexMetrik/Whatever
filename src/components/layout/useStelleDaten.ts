import { useEffect, useMemo, useState } from 'react';
import { erlassVonPfad, type VerlaufManifeste } from '../../lib/verlaufLabel';
import { reiterKategorie } from '../../lib/tabGruppen';
import { stelleBrauchtDaten, type StelleDatenMap } from '../../lib/reiterStelle';

// ═══ W2·17-UI-BEFUNDE (DFG-F01) · DIE EINTRÄGE FÜR DIE STELLE IM REITER ══════
//
// Die Stelle im Reiter («§ 4», «Art. 12 SchlT ZGB», «Anhang 1») kommt aus
// demselben Eintrag wie im Leser (`artikelLabel`) und aus derselben Gliederung
// (Struktur-Sidecar) — beide über die Lader des Lesers, mit deren Cache: ein
// Erlass, den der Leser geöffnet hat, kostet hier kein zweites Byte.
//
// §15: GELADEN WIRD NUR, WAS DIE STELLE BRAUCHT. Bund-Nummern («Art. 336c»,
// «Art. 49–50») trägt der Token exakt (`stelleBrauchtDaten`, am ganzen Korpus
// gemessen); ein Hintergrund-Reiter auf OR oder ZGB holt darum keine
// 2-MB-Datei. Kantonale Erlasse (Art. oder §), Anhänge, Geltungsbereiche und
// Schlusstitel laden den Eintrag — bis er da ist, zeigt der Reiter die
// Rückfallform (keine Stelle bzw. die Nummer ohne Rohschlüssel) und
// aktualisiert sich selbst: das Ergebnis hängt als `artikel` am Manifest-
// Objekt, dessen neue Identität die Leiste neu zeichnen lässt.

/** Erlass-Schlüssel, deren Stelle Daten braucht (Gesetzes-Reiter mit Anker). */
function erlasseMitBedarf(tabs: readonly { path: string; wahl?: string }[], m: VerlaufManifeste): string[] {
  const keys = new Set<string>();
  for (const t of tabs) {
    if (reiterKategorie(t.path) !== 'gesetze') continue;
    const e = erlassVonPfad(t.path, m);
    const i = t.path.indexOf('#');
    const anker = i === -1 ? t.wahl : t.path.slice(i);
    if (e?.datei && stelleBrauchtDaten(anker, e.ebene)) keys.add(e.key);
  }
  return [...keys].sort();
}

/** `manifeste` samt den Einträgen, die die Stelle der offenen Reiter braucht. */
export function useStelleDaten(
  tabs: readonly { path: string; wahl?: string }[],
  manifeste: VerlaufManifeste,
): VerlaufManifeste {
  const [artikel, setArtikel] = useState<StelleDatenMap>({});
  // Primitiv als Abhängigkeit: ein wandernder `#art-…` ändert den Bedarf nicht
  // (dieselbe Überlegung wie bei `manifestBedarf`, W2·18 Punkt 2).
  const bedarf = erlasseMitBedarf(tabs, manifeste).join('\n');
  const gesetze = manifeste.gesetze;
  useEffect(() => {
    if (!bedarf || !gesetze) return;
    let lebt = true;
    void import('../../lib/normtext/browse').then(async (b) => {
      for (const key of bedarf.split('\n')) {
        const e = gesetze.erlasse.find((x) => x.key === key);
        if (!e?.datei) continue;
        const datei = await b.ladeErlassDatei(e.datei);
        if (!datei) continue;
        const eintraege = datei.eintraege.map((x) => ({ artikel: x.artikel, artikelLabel: x.artikelLabel }));
        // Die Gliederung nennt die Übergangsgruppe («Schlusstitel: …»); nur dort geladen, wo es welche gibt.
        const struktur = eintraege.some((x) => x.artikel.startsWith('disp_')) ? await b.ladeStruktur(e.ebene, e.key) : null;
        if (lebt) setArtikel((alt) => (alt[key] ? alt : { ...alt, [key]: { eintraege, struktur } }));
      }
    });
    return () => { lebt = false; };
  }, [bedarf, gesetze]);
  return useMemo(() => (Object.keys(artikel).length ? { ...manifeste, artikel } : manifeste), [manifeste, artikel]);
}
