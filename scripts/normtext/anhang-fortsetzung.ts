// W2·27-BUND-FERTIG (Nachzug Gegenprüfung #1204, «Beilage» 30.9.2026).
//
// Anhang-<dl>: ein LEERES <dt> + Text-<dd> NACH einem Item ist dessen Fortsetzungszeile
// (VZV-Beilage Kategorie B «… Plätzen ausser dem Führersitz;» + «Fahrzeugkombinationen …»).
// parseDefinitionsListe hängt sie an das Item (wie im Haupttext, VZV art_3) und meldet den
// Text; markeloseNotizen() erfasst dieselbe Zeile als Prosa-Notiz. Damit sie genau EINMAL
// erscheint, wird sie hier aus den Notizen abgezogen (Multimenge je Text). Findet sich ein
// gemeldeter Text nicht unter den Notizen, ist die Disjunktheit gerissen → laut abbrechen
// statt stumm zu doppeln oder zu verlieren (§1).
import type { ArtikelText } from './fedlex/typen.ts';
import type { ListenItem } from './fedlex/listen.ts';

export function ohneFortsetzungen(notizen: string[], absorbiert: string[]): string[] {
  const rest = [...notizen];
  for (const text of absorbiert) {
    const i = rest.indexOf(text);
    if (i < 0) throw new Error(`Anhang-Fortsetzungszeile nicht unter den Notizen: «${text.slice(0, 80)}»`);
    rest.splice(i, 1);
  }
  return rest;
}

// ── P4 (W2·27-BUND-FERTIG, 2.10.2026): Zwischen-Notizen stehen AN IHRER STELLE ──────────────
//
// Fedlex setzt eine Item-Beschreibung als <dl> aus <dt>/<dd>-Paaren: auf das markierte Item
// folgen marke-lose <dd> (leeres <dt>) als weitere Zeilen DESSELBEN Eintrags, eine Zeile kann
// selbst eine Unterliste tragen («<dt>B8</dt><dd>Feuer und Elementarschäden</dd><dt></dt>
// <dd>Sämtliche Sachschäden …, die verursacht werden durch:<dl>– Feuer … </dl></dd><dt>B9 …»,
// AVO SR 961.011 Anh. 1, ELI cc/2005/735, Konsolidierung 20260226, Filestore-HTML, abgerufen 2.10.2026). Bis P4 sammelte
// markeloseNotizen() solche Zeilen als Prosa VOR der ganzen Liste, die Items hingen als EINE
// Liste an der letzten Notiz: der Einleitungssatz «… durch:» stand über B1 statt über seinen
// Aufzählungspunkten (48 Zeilen; 21 davon die einzige Einleitung einer Liste, §8). Gemessen über alle 231
// Bund-Caches (2.10.2026): 48 Zeilen mit eigener Unterliste + 4 Schlusszeilen hinter einer Unterliste + 3 marke-lose
// Zeilen in der Unterliste einer solchen Zeile (VTS Anh. 7) = 55 Zwischen-Notizen in 16 Anhängen von 9 Erlassen.
//
// Regel (Wahl «eigener Block zwischen Item-Gruppen», nicht «Eltern-Item-Erweiterung»): eine
// marke-lose Zeile, die NICHT an ihr Item angehängt werden kann, ist ein eigener Block an ihrer
// Stelle; die Item-Liste wird dort geteilt. Begründung: (1) Die Quellordnung «Item · Zeile ·
// Unterliste · nächstes Item» lässt sich als Item-Text nicht abbilden, sobald zwei Zeilen mit je
// eigener Unterliste aufeinander folgen (VTS Anh. 7 Ziff. 232: «Vorderradbremse»- und
// «Hinterradbremse»-Zeile) oder eine Schlusszeile NACH der Unterliste steht (AVO Anh. 7 Ziff.
// 9.2 «Schaltjahre …» hinter a)–c)) — Anhängen an den Eltern-Text zöge sie VOR die Unterliste.
// (2) Es entsteht keine Zuordnung, die die Quelle nicht trägt: der Block behauptet nur
// «steht an dieser Stelle» (Bezug mehrdeutig, FIDLEV Anh. 2 «Nicht zum Handel zugelassene
// Basiswerte:» ≠ lit. e). (3) Blocktypen existieren (Text, Text+items, nur items) — kein
// Renderer-Umbau.
//
// Mechanik: parseDefinitionsListe markiert solche Zeilen als Item mit `notiz: true` (Ebene =
// `tiefe`); die Unterliste der Zeile folgt ihr mit tiefe+1. bloeckeAusItems() schneidet die
// Item-Liste an jeder Notiz: die Notiz besitzt alle folgenden Items mit tiefe > ihrer Ebene
// (= ihre Unterliste), Lead + Unterliste = ein Block; die Items danach bilden einen neuen
// Items-Block. Innerhalb der Unterliste einer Notiz bleibt jede marke-lose Zeile an ihrer
// Stelle (VTS: «Klassen 1 und 2: 2,7 m/s²» unter der Hinterradbremse-Zeile).
//
// Nicht betroffen: marke-lose Zeile OHNE Vorgänger-Item der Ebene (erste Zeile einer <dl> —
// steht schon an ihrer Stelle, Lead der Liste), Haupttext (anhang=false; dort byte-gleich).
type Block = ArtikelText['bloecke'][number];
type BlockItem = NonNullable<Block['items']>[number];

function ohneNotizFlag(it: ListenItem): BlockItem {
  const { notiz: _notiz, ...rest } = it;
  return rest;
}

export function bloeckeAusItems(items: ListenItem[]): Block[] {
  const out: Block[] = [];
  let lauf: BlockItem[] = [];
  const leere = () => {
    if (lauf.length > 0) out.push({ absatz: null, text: '', items: lauf });
    lauf = [];
  };
  for (let i = 0; i < items.length; ) {
    const it = items[i];
    if (!it.notiz) {
      lauf.push(ohneNotizFlag(it));
      i++;
      continue;
    }
    leere();
    const ebene = it.tiefe ?? 0;
    let j = i + 1;
    while (j < items.length && (items[j].tiefe ?? 0) > ebene) j++;
    const folge = bloeckeAusItems(items.slice(i + 1, j));
    const erster = folge[0];
    if (erster && erster.text === '' && erster.items && erster.titel === undefined) {
      folge[0] = { absatz: null, text: it.text, items: erster.items }; // Lead + Unterliste = ein Block
    } else {
      out.push({ absatz: null, text: it.text });
    }
    out.push(...folge);
    i = j;
  }
  leere();
  return out;
}
