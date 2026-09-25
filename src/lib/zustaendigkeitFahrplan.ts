// Dossier: bibliothek/normen/zpo-zustaendigkeit-regelwerk.md
import type { ZustaendigkeitErgebnis } from './zustaendigkeit';
import { GRUND_EINZIGE_INSTANZ_199_3 } from './zustaendigkeit/erstinstanz';

// ─── Praxis-Fahrplan aus dem Zuständigkeits-Ergebnis ────────────────────────
// Reiner Komponist (keine eigene Rechtsregel — alles kommt aus der Engine
// bzw. wird als kantonaler Parameter übergeben; §3 Schichtentrennung).
// «Maximal praxistauglich» (Anordnung David 5.6.2026): Der Nutzer sieht
// WAS er verfasst, WO er einreicht, WIE es weitergeht und WAS es kostet.

export interface FahrplanSchritt {
  titel: string;
  text: string;
}

export function fahrplanSchritte(
  r: ZustaendigkeitErgebnis,
  opts: { vorlageVerfuegbar: boolean; stelleBekannt: boolean },
): FahrplanSchritt[] {
  const schritte: FahrplanSchritt[] = [];

  // 1 · Eingabe verfassen
  if (r.eingabeArt === 'schlichtungsgesuch') {
    schritte.push({
      titel: 'Schlichtungsgesuch verfassen',
      text: 'Parteien, Rechtsbegehren und Streitgegenstand bezeichnen (Art. 202 ZPO); Einreichung schriftlich oder mündlich zu Protokoll.'
        + (opts.vorlageVerfuegbar ? '' : ' Eine Vorlage für diesen Fall ist in Vorbereitung.'),
    });
  } else if (r.eingabeArt === 'scheidungsbegehren_oder_klage') {
    schritte.push({
      titel: 'Scheidungsbegehren oder Scheidungsklage verfassen',
      text: 'Bei Einigkeit: gemeinsames Begehren (mit Vereinbarung über die Scheidungsfolgen); sonst Klage (Art. 274 ff. ZPO).',
    });
  } else {
    schritte.push({
      titel: 'Klage verfassen',
      text: 'Die Klage geht direkt an das Gericht — Parteien, Rechtsbegehren, Streitgegenstand und (wo nötig) Streitwert angeben.',
    });
  }

  // 2 · Einreichen
  schritte.push({
    titel: r.eingabeArt === 'schlichtungsgesuch' ? 'Bei der Schlichtungsbehörde einreichen' : 'Beim Gericht einreichen',
    text: opts.stelleBekannt
      ? 'Die zuständige Stelle mit Adresse steht unten — Eingabe unterschrieben und im Doppel einreichen (je ein Exemplar pro Gegenpartei).'
      : 'Kanton (und idealerweise PLZ/Gemeinde) wählen, damit die konkrete Stelle mit Adresse angezeigt wird.',
  });

  // 3 · So geht es weiter
  if (r.eingabeArt === 'schlichtungsgesuch') {
    const kompetenz = r.entscheidkompetenz.entscheidAufAntrag
      ? ' Bei diesem Streitwert kann die Behörde auf Antrag sogar selbst entscheiden (Art. 212 ZPO).'
      : r.entscheidkompetenz.entscheidvorschlag
        ? ' Die Behörde kann einen Urteilsvorschlag unterbreiten (Art. 210 ZPO).'
        : '';
    schritte.push({
      titel: 'Schlichtungsverhandlung — danach Klagebewilligung',
      text: `Kommt keine Einigung zustande, stellt die Behörde die Klagebewilligung aus; sie berechtigt während 3 Monaten zur Klage (Miete/Pacht: 30 Tage; Art. 209 ZPO).${kompetenz}`,
    });
    schritte.push({
      titel: `Bei Scheitern: Klage im ${r.verfahrensart === 'vereinfacht' ? 'vereinfachten' : 'ordentlichen'} Verfahren`,
      text: r.verfahrensart === 'vereinfacht'
        ? 'Vereinfachtes Verfahren (Art. 243 ff. ZPO): vereinfachte Formen, verstärkte richterliche Fragepflicht; eine Begründung der Klage ist freiwillig (Art. 244 Abs. 2 ZPO).'
        : 'Ordentliches Verfahren (Art. 219 ff. ZPO): schriftliche, begründete Klage; in der Regel mit anwaltlicher Vertretung empfehlenswert.',
    });
  } else if (r.eingabeArt === 'scheidungsbegehren_oder_klage') {
    schritte.push({
      titel: 'Gerichtliches Scheidungsverfahren',
      text: 'Anhörung der Parteien; bei gemeinsamem Begehren Genehmigung der Vereinbarung (Art. 274 ff. ZPO). Keine Schlichtung (Art. 198 lit. c ZPO).',
    });
  } else {
    schritte.push({
      titel: `Verfahren: ${r.verfahrensart === 'vereinfacht' ? 'vereinfacht' : 'ordentlich'}`,
      // RL-42 / Z1-03: Art. 199 Abs. 3 ZPO ist ein Wahlrecht, keine Ausnahme.
      text: r.schlichtung.entfaelltGrund === GRUND_EINZIGE_INSTANZ_199_3
        ? `${r.schlichtung.entfaelltGrund}.`
        : r.schlichtung.entfaelltGrund
        ? `Keine Schlichtung — ${r.schlichtung.entfaelltGrund}.`
        : 'Das Gericht führt das Verfahren nach Eingang der Klage durch.',
    });
  }

  return schritte;
}
