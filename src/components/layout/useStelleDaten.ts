import { useEffect, useMemo, useRef, useState } from 'react';
import { erlassVonPfad, type VerlaufManifeste } from '../../lib/verlaufLabel';
import { reiterKategorie } from '../../lib/tabGruppen';
import { brauchtStruktur, stelleBrauchtDaten, type StelleDatenMap } from '../../lib/reiterStelle';

// ═══ W2·17-UI-BEFUNDE (DFG-F01) · DIE EINTRÄGE FÜR DIE STELLE IM REITER ══════
//
// Die Stelle im Reiter («§ 4», «Art. 12 SchlT ZGB», «Anhang 1») kommt aus
// demselben Eintrag wie im Leser (`artikelLabel`) und aus derselben Gliederung
// (Struktur-Sidecar) — beide über die Lader des Lesers, mit deren Cache: ein
// Erlass, den der Leser geöffnet hat, kostet hier kein zweites Byte.
//
// §15: GELADEN WIRD NUR, WAS DIE STELLE ÄNDERN KANN. Wo der Token die Stelle
// schon vollständig sagt (Bund-Nummern, Anhang N, Geltungsbereich, ZGB-
// Schlusstitel — `stelleBrauchtDaten`, am ganzen Korpus gleich dem Eintrag
// gemessen), holt ein Hintergrund-Reiter keine Datei. Kantonale Erlasse (Art.
// oder §) und die übrigen Schlusstitel laden den Eintrag — bis er da ist, zeigt
// der Reiter die Rückfallform (im Zweifel keine Stelle) und aktualisiert sich
// selbst: das Ergebnis hängt als `artikel` am Manifest-Objekt, dessen neue
// Identität die Leiste neu zeichnen lässt.

/** Erlass-Schlüssel, deren Stelle Daten braucht (Gesetzes-Reiter mit Anker); `\t1`
 *  dahinter = zusätzlich die Gliederung (Schlusstitel-Token). */
function erlasseMitBedarf(tabs: readonly { path: string; wahl?: string }[], m: VerlaufManifeste): string[] {
  const bedarf = new Map<string, boolean>();
  for (const t of tabs) {
    if (reiterKategorie(t.path) !== 'gesetze') continue;
    const e = erlassVonPfad(t.path, m);
    const i = t.path.indexOf('#');
    const anker = i === -1 ? t.wahl : t.path.slice(i);
    if (e?.datei && stelleBrauchtDaten(anker, e.ebene, e.kuerzel)) {
      bedarf.set(e.key, (bedarf.get(e.key) ?? false) || brauchtStruktur(anker));
    }
  }
  return [...bedarf].map(([k, st]) => (st ? `${k}\t1` : k)).sort();
}

/** `manifeste` samt den Einträgen, die die Stelle der offenen Reiter braucht. */
export function useStelleDaten(
  tabs: readonly { path: string; wahl?: string }[],
  manifeste: VerlaufManifeste,
): VerlaufManifeste {
  const [artikel, setArtikel] = useState<StelleDatenMap>({});
  // Was je Erlass schon geladen ist (`true` = samt Gliederung): kein zweiter Abruf.
  const geladen = useRef(new Map<string, boolean>());
  // Hängt noch am Baum? (Nicht an der Effekt-Instanz: ein Abruf überlebt einen Bedarfswechsel.)
  const eingehaengt = useRef(true);
  useEffect(() => { eingehaengt.current = true; return () => { eingehaengt.current = false; }; }, []);
  // Primitiv als Abhängigkeit: ein wandernder `#art-…` ändert den Bedarf nicht
  // (dieselbe Überlegung wie bei `manifestBedarf`, W2·18 Punkt 2).
  const bedarf = erlasseMitBedarf(tabs, manifeste).join('\n');
  const gesetze = manifeste.gesetze;
  useEffect(() => {
    if (!bedarf || !gesetze) return;
    void import('../../lib/normtext/browse').then((b) => {
      // PARALLEL, je Erlass einmal (die Lader cachen): ein Reiter an Position 7
      // wartete sonst auf die sechs davor (gemessen, 10 s Verzögerung je Datei).
      for (const eintrag of bedarf.split('\n')) {
        const [key, st] = eintrag.split('\t');
        const mitStruktur = st === '1';
        const e = gesetze.erlasse.find((x) => x.key === key);
        const bisher = geladen.current.get(key);
        if (!e?.datei || bisher === true || (bisher === false && !mitStruktur)) continue;
        geladen.current.set(key, mitStruktur);
        void Promise.all([b.ladeErlassDatei(e.datei), mitStruktur ? b.ladeStruktur(e.ebene, e.key) : Promise.resolve(null)])
          .then(([datei, struktur]) => {
            if (!datei) { geladen.current.delete(key); return; }
            const eintraege = datei.eintraege.map((x) => ({ artikel: x.artikel, artikelLabel: x.artikelLabel }));
            if (eingehaengt.current) setArtikel((alt) => ({ ...alt, [key]: { eintraege, struktur: struktur ?? alt[key]?.struktur ?? null } }));
          });
      }
    });
  }, [bedarf, gesetze]);
  return useMemo(() => (Object.keys(artikel).length ? { ...manifeste, artikel } : manifeste), [manifeste, artikel]);
}
