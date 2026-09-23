import type { BrowseErlass } from '../../../lib/normtext/browse-typen';
import type { CurrencyEintrag, ErlassKopf } from '../../../lib/normtext/browse';
import type { ErlassTyp } from '../../../lib/normtext/register';
import { erfassungsgrad, type Erfassungsgrad } from '../../../lib/normtext/erfassungsgrad';
import { nichtKonsolidiertSatz, naechsteFassungSatz, zaehlWort } from '../../../lib/normtext/erlassKopfText';
import type { KantonSystematik } from '../../../lib/normtext/systematik';
import type { GliederungsKennzahlen } from '../gliederungsModell';
import { AMTLICHE_FASSUNG, AMTLICHE_FASSUNG_AUFGEHOBEN } from '../../../lib/benennung';
import { formatiereDatum, kennungText, verifiziertesSachgebiet } from '../helpers';
import { teilerfassung, erlassOrgan } from '../erlassUebersichtDaten';
import { erlassArt, type BestimmungsWort } from './erlassAnsicht';
import { datumsAngabe } from './datumsForm';

// ═══ Übersichtsbox → Angaben (Auftrag David 17.8.2026, «orientiere dich an
//     fedlex») — die REINE Hälfte: WELCHE Angaben die Box trägt, als typisierte
// Zeilen; `./UebersichtBox` rendert nur (§3). Rein und deterministisch (§2),
// je Erlassart ohne Browser geprüft (`leser-v3-uebersicht.test.ts`).
//
// Von Fedlex übernommen: Label/Wert-Rhythmus, eine Zeile je Angabe, Sans für
// alles Meta, keine Doppelpunkte. Nicht übernommen: Karte und Rahmen
// (Design-Grundlage Kap. 8 Nr. 1).
//
// ARBEITSTEILUNG mit dem Titelblatt (`../parts/ErlassLeserKopf`), gemessen
// 17./18.8.2026 (Ä81/Ä97): die Box scrollt selbst weg, sie hält nichts fest.
//   Titelblatt = WELCHER Erlass, WIE AKTUELL, WO die amtliche Fassung.
//   Box        = WOHER er kommt und WIE er gebaut ist — der Steckbrief.
// Darum trägt die Box weder den Grundhinweis «massgeblich …», noch den
// Standausweis, noch die Fassungs-Kennung (Drift-Schlüssel, keine Auskunft).
// Die Datums-Kette Erlass vom → In Kraft seit → Stand bleibt bewusst doppelt:
// im Titelblatt «·»-Kette, hier Chronologie (Fedlex «Beschluss/Inkrafttreten»).
//
// W2·29-WERKBANK-LESER S2 (23.9.2026): Herleitungen und Messreihen dieser Datei
// gekürzt (420er-Deckel, §17-Rückbau). Wortlaut samt Belegen unverändert in der
// Git-Geschichte: `git show c9fc15513:src/pages/gesetz-leser/v3/uebersichtAngaben.ts`.

/** Eine Zeile der Label/Wert-Liste. `label` ist die Sprache, `id` der Anker. */
interface UebersichtZeile {
  /** Stabile Kennung für React-Key und Sonde — nie der Label-Text. */
  id: string;
  label: string;
  /** NIE leer: eine Zeile ohne Wert entsteht gar nicht (§8). */
  wert: string;
  /** Ziffern-Wert ⇒ `tabular-nums` (Design-Grundlage Kap. 2.3). */
  ziffern?: boolean;
}

/** Ein amtliches Ziel — getrennt von den Zeilen, weil ein Link kein Wert ist. */
interface UebersichtLink {
  id: string;
  label: string;
  href: string;
  /** «↗» verlässt die Seite, «⬇» liefert eine Datei; WO es steht, entscheidet
   *  die Darstellung (Ä110-Rest, `./UebersichtBox`). */
  zeichen: '↗' | '⬇';
}

export interface UebersichtsAngaben {
  /** Die EINE Zeile im Ruhezustand — «SR 312.0 · 480 Artikel». */
  ruhe: string;
  zeilen: UebersichtZeile[];
  links: UebersichtLink[];
  /** «nicht konsolidiert» im Wortlaut des Titelblatts (`nichtKonsolidiertSatz`,
   *  §5); das «⚠» setzt das UI `aria-hidden` davor (B3). Die Box zeigt es seit
   *  Ä81 nicht mehr — das Feld bleibt als Aussage über den Erlass. */
  warnung: string | null;
  /** Angekündigte, noch nicht geltende Fassung — andere Aussage als `warnung`,
   *  beide können zugleich zutreffen. Seit Ä97 ebenfalls nur Titelblatt-Sache. */
  vorbehalt: string | null;
  /** §8-Sätze über die Grenzen der eigenen Erfassung. Leer ⇒ kein Block, statt
   *  «keine Einschränkungen» zu behaupten. */
  hinweise: string[];
}

export interface UebersichtsEingabe {
  erlass: BrowseErlass;
  /** Erlass-Kopf aus dem Struktur-Sidecar; `null` = noch nicht geladen (§8). */
  kopf: ErlassKopf | null;
  currency: CurrencyEintrag | undefined;
  erlassTyp: ErlassTyp | undefined;
  /** `null` = KEIN Snapshot (nur-live-link/pdf-embed) — keine Zahl statt Null. */
  anzahl: number | null;
  bestimmungsWort: BestimmungsWort;
  bestimmungsEtikettStatus: 'entwurf' | undefined;
  gliederungsTiefe: number;
  kennzahlen: GliederungsKennzahlen | null;
  kantonSys: Record<string, KantonSystematik>;
  kantonErlassAnzahl: number | null;
  nichtKonsolidiert: boolean;
  nichtKonsolidiertSeit: string | null;
}

/**
 * Die Ruhezeile «SR 312.0 · 480 Artikel». Der Stand fällt hier bewusst weg (er
 * sprengte die Zeile, 17.8.2026); fehlende Angaben entfallen ersatzlos. «SR»
 * nur, wo es zutrifft (`kennungText`, Ä75). `kennzahlen` optional: sie wählen
 * das Zähl-Substantiv bei Anhang-Dominanz (Fehlerbuch 29.8.2026, Rot-Beweis
 * `anhang-dominanz-ausspielungen.test.ts`); ohne sie bleibt das Basis-Wort.
 */
export function ruheZeile(
  erlass: Pick<BrowseErlass, 'ebene' | 'sr'>,
  anzahl: number | null,
  bestimmungsWort: BestimmungsWort,
  kennzahlen?: { artikelAnzahl: number; anhangArtikel: number } | null,
): string {
  return [
    kennungText(erlass),
    anzahl != null ? `${anzahl} ${zaehlWort(bestimmungsWort, kennzahlen)}` : null,
  ].filter(Boolean).join(' · ');
}

/**
 * §8 · der Erfassungsgrad der kantonalen Sammlung als Satz. Eigene Funktion,
 * damit die Lage `vollstaendig` prüfbar ist (P3-1, 18.8.2026: ein Satz, der die
 * Stufe ignoriert, würde beim ersten Enumerations-Beleg still falsch). Klartext
 * statt interner Stufen-Wörter (Ä122).
 */
export function erfassungsgradSatz(grad: Erfassungsgrad): string {
  // `vollstaendig` entsteht NUR mit hinterlegtem Enumerations-Beleg.
  if (grad.stufe === 'vollstaendig') {
    return `Aus dem Kanton ${grad.kanton} sind alle ${grad.n} Erlasse der amtlichen Sammlung erfasst.`;
  }
  return `Aus dem Kanton ${grad.kanton} sind bisher ${grad.n} Erlasse erfasst — der Bestand ist nicht vollständig.`;
}

/**
 * Erlass → Angaben der Übersichtsbox. Erlass-neutral: jede Zeile entsteht aus
 * dem Datenmodell und entfällt, wo der Erlass die Angabe nicht trägt — kein
 * `if (bund)`, keine leere Wertspalte (Fundament-Auflage 2, 16.8.2026).
 */
export function uebersichtsAngaben(e: UebersichtsEingabe): UebersichtsAngaben {
  const { erlass, kopf } = e;
  // §8: am GANZ aufgehobenen Erlass IST die Aufhebung die Aussage — keine
  // Konsolidierungs-Warnung, kein Vorbehalt, kein «geltende Fassung»-Name (B3/B5).
  const lebt = !erlass.aufgehoben;
  const zeilen: UebersichtZeile[] = [];

  // Erlassart (Ä108, `./erlassAnsicht.erlassArt`) — «Erlassart», weil «Art»
  // zugleich die Abkürzung für den Artikel ist.
  const art = erlassArt(erlass, e.erlassTyp);
  if (art) zeilen.push({ id: 'art', label: 'Erlassart', wert: art });
  // Erlassgeber aus der amtlichen Präambel; darf umbrechen (kein title-Ersatz, §8).
  const organ = erlassOrgan(kopf);
  if (organ) zeilen.push({ id: 'organ', label: 'Erlassgeber', wert: organ });

  // DIE DATUMS-KETTE (Ä80): beschlossen → in Kraft → Stand → (aufgehoben), die
  // Präposition im Etikett, nicht im Wert (`./datumsForm`, Ä74/P1-2).
  const datum = kopf?.erlassdatum ? datumsAngabe(kopf.erlassdatum) : null;
  if (datum) zeilen.push({ id: 'datum', ...datum });
  if (erlass.inkraftSeit) {
    zeilen.push({
      id: 'inkraft', label: 'In Kraft seit',
      wert: formatiereDatum(erlass.inkraftSeit), ziffern: true,
    });
  }
  // B8 (9.8.2026): zwei VD-Erlasse tragen `stand: ""` — dann keine Zeile.
  if (erlass.stand) {
    zeilen.push({ id: 'stand', label: 'Stand', wert: formatiereDatum(erlass.stand), ziffern: true });
  }
  if (erlass.aufgehoben) {
    zeilen.push({
      id: 'aufgehoben', label: 'Aufgehoben per',
      wert: formatiereDatum(erlass.aufgehoben.seit), ziffern: true,
    });
  }

  // Aufbau — «Aufbau», nicht «Gliederung» (Ä10-Wächter: der Zonen-Name steht im
  // Blatt schon einmal); «N im Anhang» aus denselben Kennzahlen wie die Ruhezeile.
  const anhang = e.kennzahlen?.anhangArtikel ?? 0;
  const glied = [
    e.gliederungsTiefe > 0
      ? `${e.gliederungsTiefe} ${e.gliederungsTiefe === 1 ? 'Ebene' : 'Ebenen'}`
      : null,
    anhang > 0 ? `${anhang} im Anhang` : null,
  ].filter(Boolean).join(' · ');
  if (glied) zeilen.push({ id: 'aufbau', label: 'Aufbau', wert: glied, ziffern: true });

  // Sachgebiet — nur die KANTONALE, verifizierte Systematik (Platzhalter wie
  // «Bereich SAR» fallen weg, B9); Bundeserlasse tragen ihr Gebiet in der Overline.
  const gebiet = verifiziertesSachgebiet(erlass, e.kantonSys);
  const pfad = gebiet ? [gebiet.top, gebiet.sub].filter(Boolean).join(' › ') : '';
  if (pfad) zeilen.push({ id: 'gebiet', label: 'Sachgebiet', wert: pfad });

  // Amtliche Ziele — EIN Ziel, EIN Name (Ä110, `lib/benennung`).
  const links: UebersichtLink[] = [];
  if (erlass.quelleUrl) {
    links.push({
      id: 'quelle', zeichen: '↗',
      label: lebt ? AMTLICHE_FASSUNG : AMTLICHE_FASSUNG_AUFGEHOBEN,
      href: erlass.quelleUrl,
    });
  }
  if (erlass.pdfUrl) {
    links.push({ id: 'pdf', zeichen: '⬇', label: 'Amtliches PDF', href: erlass.pdfUrl });
  }

  // §8 · was die Anzeige über ihre eigenen Grenzen weiss. Dass der Weg zur
  // amtlichen Fassung FEHLT, wird gesagt, nicht verschwiegen.
  const hinweise: string[] = [];
  if (links.length === 0) hinweise.push('Keine amtliche Quelle hinterlegt.');
  const beleg = teilerfassung(erlass.key);
  if (beleg) hinweise.push(`${beleg.befund} (geprüft ${formatiereDatum(beleg.geprueftAm)})`);
  const grad = erlass.kanton && e.kantonErlassAnzahl != null
    ? erfassungsgrad(erlass.kanton, e.kantonErlassAnzahl) : null;
  if (grad) hinweise.push(erfassungsgradSatz(grad));
  if (e.bestimmungsEtikettStatus === 'entwurf') {
    hinweise.push(
      `Die Bestimmungen dieses Erlasses sind hier als «${e.bestimmungsWort}» gezählt — ob das die amtliche Bezeichnung ist, ist noch nicht geprüft.`,
    );
  }
  if (e.kennzahlen && !e.kennzahlen.hatSidecar) {
    hinweise.push('Für diesen Erlass ist keine amtliche Gliederung erfasst — die Leiste listet die Bestimmungen.');
  }

  return {
    ruhe: ruheZeile(erlass, e.anzahl, e.bestimmungsWort, e.kennzahlen),
    zeilen,
    links,
    warnung: lebt && e.nichtKonsolidiert ? nichtKonsolidiertSatz(e.nichtKonsolidiertSeit) : null,
    vorbehalt: lebt && e.currency?.naechsteFassungAb
      ? naechsteFassungSatz(e.currency.naechsteFassungAb) : null,
    hinweise,
  };
}
