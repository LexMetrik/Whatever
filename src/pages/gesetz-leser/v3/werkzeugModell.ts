import { ARTIKEL_WERKZEUGE, ERLASS_WERKZEUGE, bereichLabel, vergleicheArtikel, type ArtikelWerkzeugKante } from '../../../lib/normtext/werkzeuge';
import { ALLE_KARTEN, istVerfuegbar } from '../../../lib/startseiteConfig';
import type { Status } from '../../../lib/startseiteConfigTypen';

// ─── Modell des Reiters «Werkzeuge» (S6, Entscheid David 23.9.2026) ─────────
//
// Rein, ohne JSX (§3): aus den beiden Zuordnungs-Tabellen von
// `lib/normtext/werkzeuge.ts` (artikelscharf `ARTIKEL_WERKZEUGE`, erlass-weit
// `ERLASS_WERKZEUGE`) und dem Katalog (`startseiteConfig`, Titel/Status/href —
// §5, die Karte ist die eine Quelle) wird EINE Zeile JE WERKZEUG.
//
// ── WARUM JE WERKZEUG, NICHT JE ARTIKELBEREICH (AN-7/B-10) ──────────────────
// Der Vorgänger-Reiter «Anwendung» gruppierte nach Artikelbereich: am OR stand
// der Verjährungsrechner dreimal (Art. 60, Art. 127–142, …), und die Zahl im
// Gruppenkopf zählte die BEREICHE, nicht die Werkzeuge. Wer «welche Rechner
// gibt es zu diesem Erlass?» fragt, will jedes Werkzeug einmal — mit den
// Artikeln, zu denen es passt, IN seiner Zeile. Die Zahl ist darum die Zahl
// der verfügbaren Werkzeuge.
//
// ── GEPLANTE WERKZEUGE (AN-12, §8) ──────────────────────────────────────────
// `werkzeuge.ts` blendet geplante Karten aus («nie ein toter Link»). Der
// Katalog zeigt sie dagegen — als «In Vorbereitung», hinter einer eigenen
// Aufklappzeile, ohne Link (`components/Katalog.tsx`, Leitsatz 3 «ehrlich ohne
// Ballast»). Dieser Reiter folgt dem Katalog, nicht dem Ausblenden: eine
// Zuordnung, die wir kennen, wird genannt; dass das Werkzeug noch nicht
// benutzbar ist, sagt ihr Etikett, und ein Link entsteht nicht. So bleibt die
// Zusage «kein toter Link» wahr, ohne den Bestand kleiner zu zeigen, als er ist.
//
// DIE ZUORDNUNG SELBST ÄNDERT HIER NICHTS: welche Karte zu welchem Artikel
// passt, steht in `werkzeuge.ts` (Risikopfad, §7-Belege je Kante); die
// Hauptnummer-Regel dort (335c ⊂ 335) gilt unverändert — Befund AN-5/AN-6
// (Art. 324 statt 324a, ArG → Lohnfortzahlung) ist Welle 2 (Daten).
// [Ergänzt 24.9.2026, Nachzug #1016 (S6-D6): die Kanten tragen seither exakte
// Suffix-Grenzen (`vonArtikel`/`bisArtikel`). Etikett und Reihenfolge kommen
// darum aus `bereichLabel`/`vergleicheArtikel` derselben Datei — «Art. 324a–324b»
// statt «Art. 324», 8a nach 8. Dieses Modell filtert nicht nach Artikel; die
// Abgleich-Regel `trifftArtikel` braucht es hier nicht.]

/** Ein Artikelbereich, zu dem ein Werkzeug passt — mit seinem fachlichen Beleg. */
interface WerkzeugArtikel {
  /** «Art. 60», «Art. 324a–324b» bzw. «Art. 127–142» (`bereichLabel`). */
  label: string;
  /** Hauptnummern; exakte Grenzen mit Suffix in `vonArtikel`/`bisArtikel`. */
  von: number;
  bis: number;
  vonArtikel?: string;
  bisArtikel?: string;
  /** Beleg der Kante (§7) — sichtbar per Aufklappen, nicht nur im `title`. */
  beleg: string;
}

export interface WerkzeugZeile {
  id: string;
  titel: string;
  modus: 'rechner' | 'vorlage';
  status: Status;
  /** `null` bei geplanten Karten — dort entsteht kein Link. */
  href: string | null;
  /** Leer = erlass-weit zugeordnet (keine artikelscharfe Kante). */
  artikel: WerkzeugArtikel[];
}

export interface WerkzeugAnsicht {
  verfuegbar: WerkzeugZeile[];
  geplant: WerkzeugZeile[];
  /** `true` = Zuordnung auf Erlass-Ebene (`ERLASS_WERKZEUGE`), nicht je Artikel. */
  erlassWeit: boolean;
}

/** Exakte Grenzen einer Kante als Kennung («324a»; ohne Suffix die Hauptnummer). */
function untergrenze(k: ArtikelWerkzeugKante): string { return k.vonArtikel ?? String(k.von); }
function obergrenze(k: ArtikelWerkzeugKante): string { return k.bisArtikel ?? String(k.bis); }

/** Karte → Zeile, oder `null`, wenn die Karte fehlt oder weder benutzbar noch
 *  geplant ist (eine verfügbare Karte ohne `href` hätte einen toten Link). */
function zeileFuer(id: string): WerkzeugZeile | null {
  const k = ALLE_KARTEN.find((c) => c.id === id);
  if (!k) return null;
  const benutzbar = istVerfuegbar(k) && !!k.href;
  if (!benutzbar && k.status !== 'geplant') return null;
  return { id, titel: k.title, modus: k.modus, status: k.status, href: benutzbar ? k.href ?? null : null, artikel: [] };
}

function teile(zeilen: readonly WerkzeugZeile[], erlassWeit: boolean): WerkzeugAnsicht {
  return {
    verfuegbar: zeilen.filter((z) => z.href !== null),
    geplant: zeilen.filter((z) => z.href === null),
    erlassWeit,
  };
}

/**
 * Die Werkzeuge eines Erlasses, je Werkzeug eine Zeile.
 *
 * Artikelscharf, sobald der Erlass mindestens EINE Kante mit einem benutzbaren
 * Werkzeug trägt — dieselbe Weiche wie bisher (`artikelWerkzeugGruppen` leer ⇒
 * grobe Erlass-Zuordnung), damit die gröbere Antwort nie NEBEN der feineren
 * steht (§5, Rausch-Filter #28). Reihenfolge: nach dem ersten Artikel, an dem
 * das Werkzeug passt; erlass-weit in der deklarierten Reihenfolge.
 */
export function werkzeugAnsicht(erlassKey: string): WerkzeugAnsicht {
  const kanten = ARTIKEL_WERKZEUGE
    .filter((k) => k.erlass === erlassKey)
    .slice()
    .sort((a, b) => vergleicheArtikel(untergrenze(a), untergrenze(b))
      || vergleicheArtikel(obergrenze(a), obergrenze(b)));
  const proId = new Map<string, WerkzeugZeile>();
  for (const k of kanten) {
    for (const id of k.werkzeuge) {
      let z = proId.get(id);
      if (!z) {
        const neu = zeileFuer(id);
        if (!neu) continue;
        z = neu;
        proId.set(id, z);
      }
      const label = bereichLabel(k);
      if (!z.artikel.some((a) => a.label === label)) {
        z.artikel.push({
          label, von: k.von, bis: k.bis,
          ...(k.vonArtikel !== undefined ? { vonArtikel: k.vonArtikel } : {}),
          ...(k.bisArtikel !== undefined ? { bisArtikel: k.bisArtikel } : {}),
          beleg: k.beleg,
        });
      }
    }
  }
  const scharf = [...proId.values()];
  if (scharf.some((z) => z.href !== null)) return teile(scharf, false);

  const grob: WerkzeugZeile[] = [];
  for (const id of new Set(ERLASS_WERKZEUGE[erlassKey] ?? [])) {
    const z = zeileFuer(id);
    if (z) grob.push(z);
  }
  // Geplante artikelscharfe Kanten gehen nicht verloren, wenn der Erlass nur
  // erlass-weit Benutzbares trägt: sie stehen bei den geplanten (§8).
  const geplantScharf = scharf.filter((z) => !grob.some((g) => g.id === z.id));
  return teile([...grob, ...geplantScharf], true);
}
