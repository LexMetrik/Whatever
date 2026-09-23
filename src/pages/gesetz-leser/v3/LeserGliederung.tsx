import { SektionBaumTOC } from '../parts';
import { ArtikelIndex } from '../parts/ArtikelIndex';
import type { LeserV3Modell } from './leserV3Modell';

// ─── Zone B der Seitenleiste: der Gliederungsbaum (Kap. 4b) ─────────────────
//
// ── D38 (David 7.9.2026) · DIE GLIEDERUNG BLEIBT DIE GLIEDERUNG ─────────────
// Hier stand bis zum 7.9.2026 eine Weiche: «solange gesucht wird, tritt der Baum
// zurück und die Trefferliste steht an seinem Platz». Sie ist gefallen —
// wörtlich: «die suchresultate … sollen nicht in der gliederung erscheinen
// sondern den gesetzestext ersetzen». Die Liste liegt seither über der
// Lesespalte (`./LeserTrefferSpalte`), und diese Datei hat mit der Suche nichts
// mehr zu tun: kein `sucheAktiv`, kein `bestimmungsWort`, keine Trefferliste im
// Import-Kopf.
//
// WAS DAS ZURÜCKGIBT, ist mehr als ein Ortswechsel: der Baum steht während der
// Suche DA. Wer einen Treffer in «3. Titel: Parteien» sucht, sieht denselben
// Titel daneben im Baum stehen und kann ihn aufklappen — bis hierher musste er
// dafür die Suche verlassen. Zwei Nachzüge von damals fallen mit der Weiche
// ersatzlos weg (§17 «gestrichen statt bewacht»): Ä32 schaltete «alles auf/zu»
// während der Suche ab, weil der Knopf auf einen Baum zeigte, der nicht mehr
// dastand — er zeigt jetzt immer auf den Baum; und Ä10 tauschte die Überschrift
// der Leiste zwischen «Gliederung» und «Treffer» — sie heisst wieder immer
// «Gliederung», weil sie immer eine ist.
//
// Welcher Baum gezeigt wird, entscheidet das Gliederungs-MODELL, nicht diese
// Datei: `b1` Sektionsbaum · `b2/b4` flacher Artikel-Index · `b3` die ehrliche
// Leerzeile. Das ist der Unterschied zwischen «Darstellung» und «Entscheidung»
// (§3) — und der Grund, warum ein Erlass ohne amtliche Gliederung hier keine
// Sonderbehandlung braucht.

export function LeserGliederung({ m }: { m: LeserV3Modell }) {
  const { gliederung } = m;
  if (gliederung.modus === 'b3-leer') {
    return (
      <p className="text-micro leading-snug text-ink-500 [overflow-wrap:anywhere]">
        Für diesen Erlass ist keine Gliederung erfasst.
      </p>
    );
  }

  const anhangAst = gliederung.knoten.filter((k) => k.art === 'anhang');
  const anhangEl = anhangAst.length > 0
    ? (
      <SektionBaumTOC knoten={anhangAst} aktivPfad={m.aktivIds} aktivToken={m.aktivToken} offen={m.tocBaum}
        startOffeneTiefe={gliederung.startOffeneTiefe}
        onToggle={m.tocToggleGruppe} onSprung={m.springeZuSektion} onSprungArtikel={m.springeZuArtikel} />
    )
    : undefined;

  if (gliederung.modus === 'b2-index' || gliederung.modus === 'b4-mini') {
    return (
      <ArtikelIndex gruppen={gliederung.artikelIndex} aktivToken={m.aktivToken}
        onSprung={m.springeZuArtikel} anhang={anhangEl} />
    );
  }

  // A36: das Modell ist auf dem KURATIERTEN Baum gebaut; Sprung- und
  // Toggle-Handler arbeiten weiter über die Ids des vollen Baums (Teilmenge).
  // `onSprungArtikel` bedient die synthetischen Zeilen (Vorspann/Anhänge), die
  // keine `sek-N`-Identität haben und über ihren ersten Artikel-Token springen.
  return (
    <SektionBaumTOC knoten={gliederung.knoten} aktivPfad={m.aktivIds} aktivToken={m.aktivToken} offen={m.tocBaum}
      startOffeneTiefe={gliederung.startOffeneTiefe}
      onToggle={m.tocToggleGruppe} onSprung={m.springeZuSektion} onSprungArtikel={m.springeZuArtikel} />
  );
}
