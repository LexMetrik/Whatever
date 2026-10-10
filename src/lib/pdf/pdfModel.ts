import { format } from 'date-fns';
import type { Berechnungsergebnis, BerechnungsStatus, Normverweis } from '../../types/legal';
import { pdfText } from './winansi';
import { normLink } from './normLinks';
import { BEGRUENDUNG_VORBEHALT } from '../begruendung';

// ─── Zentrale PDF-Schicht: Konfiguration & Dokumentmodell ─────────────────
//
// Jeder Rechner liefert eine PdfDocConfig; das Modell wird hier REIN aus der
// Konfiguration gebaut (testbar, ohne jsPDF). Die gemeinsame Schicht enthält
// KEINERLEI hartcodierte Titel, Disclaimer, Normen oder Textbausteine eines
// Rechtsgebiets – gerendert wird ausschliesslich, was übergeben wird. Damit
// ist Cross-Domain-Bleed strukturell ausgeschlossen.

type PdfSectionConfig = {
  titel: string;
  ergebnis: Berechnungsergebnis;
};

// Ergebnis-Hero: prominente Hauptkennzahl zuoberst (ersetzt das nackte «OK»).
// Die Werte stammen aus bereits berechneten Engine-Resultaten – kein neuer Inhalt.
export type PdfHero = {
  hauptlabel: string;                       // «Verzugszins»
  hauptwert: string;                        // «CHF 501.37»
  nebenwerte?: { label: string; wert: string }[];
  kontext?: string;                         // «5 % auf CHF 10'000.00 für 366 Tage …»
};

export type PdfDocConfig = {
  title: string;                      // rechnerspezifischer Dokumenttitel
  rechtsgrundlage?: string;           // Untertitel im Kopf, z. B. «Berechnung nach Art. 104 OR»
  domain: string;                     // Rechtsgebiet, z. B. 'zpo-fristen'
  fileBase: string;                   // Dateiname-Basis, z. B. 'ZPO-Fristen'
  /** Optionales Mandats-/Aktenzeichen des Nutzers — erscheint im PDF-Kopf
   *  (FAHRPLAN-PRAXIS 1.2; NICHT das BGE-aktenzeichen der Rechtsprechung). */
  aktenzeichen?: string;
  inputs: Record<string, string>;     // angezeigte Eingaben
  hero?: PdfHero;                     // optionale Ergebnis-Hauptkennzahl
  sections: PdfSectionConfig[];       // Ergebnis(se) inkl. Status & Rechenweg
  citations?: Normverweis[];          // NUR die tatsächlich einschlägigen Normen;
                                      // fehlt das Feld: Union der Section-Normverweise
  notes?: string[];                   // zusätzliche rechnerspezifische Hinweise
  /** Optionaler kopierfertiger «Für die Rechtsschrift»-Absatz (EINE Quelle wie
   *  die UI: lib/begruendung.ts via BegruendungSlot). Fehlt das Feld, ist das
   *  Modell byte-identisch zum bisherigen PDF (FAHRPLAN-BEGRUENDUNGS-ABSATZ B3-1). */
  begruendung?: string;
  disclaimer: string;                 // domänenspezifischer Disclaimer-Text
  /** WARNHINWEIS: «Bekannter Fehler – Ergebnis nicht verwenden» direkt unter dem
   *  Kopf (Inhalt aus lib/bekannteFehler via ErgebnisExport, §5). Fehlt das Feld,
   *  ist das Modell byte-identisch zum bisherigen PDF. */
  bekannteFehler?: { titel: string; eintraege: string[] };
};

type PdfBlock =
  | { art: 'kopf'; titel: string; rechtsgrundlage?: string; erstellt: string; aktenzeichen?: string }
  | { art: 'h2'; text: string }
  | { art: 'h3'; text: string }
  | { art: 'hero'; hero: PdfHero; status: BerechnungsStatus }
  | { art: 'tabelle'; zeilen: { label: string; wert: string; rechts: boolean }[] }
  | { art: 'ergebnisbox'; text: string; status: BerechnungsStatus }
  | { art: 'absatz'; text: string; ton: 'normal' | 'warn' | 'dezent' }
  | { art: 'hinweisbox'; titel: string; eintraege: string[]; ton: 'warn' | 'normal' }
  | { art: 'schritt'; nr: number; titel: string; text: string; normen: { label: string; url?: string }[]; rechtsprechung?: string }
  | { art: 'norm'; text: string; url?: string }
  | { art: 'disclaimer'; text: string }
  | { art: 'trenner' };

export type PdfModel = {
  blocks: PdfBlock[];
  dateiname: string;
  erstellt: string; // dd.MM.yyyy HH:mm
};

const STATUS_LABEL: Record<BerechnungsStatus, string> = {
  // «Berechnung vollständig» statt nacktem «OK»; abweichende Status bleiben
  // inhaltstragend (NICHTIG etc.) und unverändert.
  ok: 'Berechnung vollständig',
  nichtig: 'NICHTIG',
  kein_anspruch: 'KEIN ANSPRUCH',
  unzulaessig: 'UNZULÄSSIG',
  ktg_regime: 'KTG-REGIME',
};

export function statusLabel(s: BerechnungsStatus): string {
  return STATUS_LABEL[s];
}

// Heuristik für die Eingaben-Tabelle: Beträge/Zahlen rechtsbündig.
function istZahlWert(wert: string): boolean {
  return /^(CHF\s)?-?[\d'’.,\s]+(\s?(%|Tage|CHF))?$/.test(wert.trim());
}

/** Baut das vollständige Dokumentmodell aus der Rechner-Konfiguration. */
export function buildPdfModel(cfg: PdfDocConfig, jetzt: Date = new Date()): PdfModel {
  const t = pdfText; // Datums-, Typografie- und CP1252-Aufbereitung
  const blocks: PdfBlock[] = [];

  // 1. Kopf: Wortmarke, Titel, Rechtsgrundlage, Meta, Goldlinie (Renderer)
  blocks.push({
    art: 'kopf',
    titel: t(cfg.title),
    rechtsgrundlage: cfg.rechtsgrundlage ? t(cfg.rechtsgrundlage) : undefined,
    erstellt: format(jetzt, 'dd.MM.yyyy, HH:mm') + ' Uhr',
    aktenzeichen: cfg.aktenzeichen?.trim() ? t(cfg.aktenzeichen.trim()) : undefined,
  });

  // 1b. Bekannter Fehler (WARNHINWEIS) — vor jedem Ergebniswert.
  if (cfg.bekannteFehler && cfg.bekannteFehler.eintraege.length > 0) {
    blocks.push({ art: 'hinweisbox', titel: t(cfg.bekannteFehler.titel), eintraege: cfg.bekannteFehler.eintraege.map(t), ton: 'warn' });
    blocks.push({ art: 'trenner' });
  }

  // 2. Ergebnis-Hero (falls der Rechner eine Hauptkennzahl liefert)
  if (cfg.hero && cfg.sections.length > 0) {
    blocks.push({
      art: 'hero',
      hero: {
        hauptlabel: t(cfg.hero.hauptlabel),
        hauptwert: t(cfg.hero.hauptwert),
        nebenwerte: cfg.hero.nebenwerte?.map((n) => ({ label: t(n.label), wert: t(n.wert) })),
        kontext: cfg.hero.kontext ? t(cfg.hero.kontext) : undefined,
      },
      status: cfg.sections[0].ergebnis.status,
    });
  }

  // 3. Eingaben als scanbare Tabelle (Label | Wert, Beträge rechtsbündig)
  const inputEintraege = Object.entries(cfg.inputs).filter(([, v]) => v);
  if (inputEintraege.length > 0) {
    blocks.push({ art: 'h2', text: 'Eingaben' });
    blocks.push({
      art: 'tabelle',
      zeilen: inputEintraege.map(([k, v]) => ({ label: t(k), wert: t(v), rechts: istZahlWert(v) })),
    });
  }

  // 4. Ergebnisse je Abschnitt
  cfg.sections.forEach((s) => {
    blocks.push({ art: 'h2', text: t(s.titel) });
    blocks.push({ art: 'ergebnisbox', text: t(s.ergebnis.ergebnis), status: s.ergebnis.status });

    if (s.ergebnis.warnungen.length > 0) {
      blocks.push({ art: 'hinweisbox', titel: 'Hinweise / Vorbehalte', eintraege: s.ergebnis.warnungen.map(t), ton: 'warn' });
    }

    if (s.ergebnis.rechenweg.length > 0) {
      blocks.push({ art: 'h3', text: 'Rechenweg' });
      s.ergebnis.rechenweg.forEach((schritt, i) => {
        const rsp = schritt.rechtsprechung?.length
          ? schritt.rechtsprechung
              .map((r) => `${r.aktenzeichen}${r.verifiziert ? '' : ' [zu verifizieren]'}`)
              .join(', ')
          : undefined;
        blocks.push({
          art: 'schritt',
          nr: i + 1,
          titel: t(schritt.beschreibung),
          text: t(schritt.zwischenergebnis),
          // Norm-Pills je Schritt – klickbar. Direkter kantonaler Link (n.url)
          // hat Vorrang; sonst Bundeserlass via normLink (Fedlex).
          normen: schritt.normen.map((n) => ({ label: t(n.artikel), url: n.url ?? normLink(n.artikel)?.url })),
          rechtsprechung: rsp ? t(rsp) : undefined,
        });
      });
    }

    if (s.ergebnis.annahmen.length > 0) {
      blocks.push({ art: 'hinweisbox', titel: 'Annahmen', eintraege: s.ergebnis.annahmen.map(t), ton: 'normal' });
    }
    blocks.push({ art: 'trenner' });
  });

  // Normverweise – ausschliesslich die vom Rechner gelieferten (cfg.citations),
  // sonst Union der Section-Normverweise. Links/SR aus dem zentralen Register.
  const citations =
    cfg.citations ??
    dedupeNormen(cfg.sections.flatMap((s) => s.ergebnis.normverweise));
  if (citations.length > 0) {
    blocks.push({ art: 'h2', text: 'Normverweise' });
    citations.forEach((n) => {
      const link = normLink(n.artikel);
      // Kantonaler Direktlink (n.url) hat Vorrang; SR-Zusatz nur für Bundeserlasse.
      const label = link ? `${n.artikel} (SR ${link.sr})` : n.artikel;
      const bem = n.bemerkung ? ` – ${n.bemerkung}` : '';
      blocks.push({ art: 'norm', text: t(label + bem), url: n.url ?? link?.url });
    });
    blocks.push({ art: 'trenner' });
  }

  // Zusätzliche Hinweise des Rechners
  if (cfg.notes && cfg.notes.length > 0) {
    blocks.push({ art: 'hinweisbox', titel: 'Hinweise', eintraege: cfg.notes.map(t), ton: 'normal' });
    blocks.push({ art: 'trenner' });
  }

  // «Für die Rechtsschrift»-Absatz (B3-1) — VOR dem Disclaimer, mit eigenem,
  // sichtbarem Vorbehalt aus der geteilten lib-Konstante (§5/§8). Dieselbe
  // Quelle wie die UI (BegruendungSlot); fehlt das Feld, bleibt das Modell
  // byte-identisch.
  if (cfg.begruendung?.trim()) {
    blocks.push({ art: 'h2', text: 'Für die Rechtsschrift' });
    blocks.push({ art: 'absatz', text: t(cfg.begruendung.trim()), ton: 'normal' });
    blocks.push({ art: 'absatz', text: t(BEGRUENDUNG_VORBEHALT), ton: 'dezent' });
    blocks.push({ art: 'trenner' });
  }

  // Disclaimer (gemeinsamer Rahmen, domänenspezifischer Text)
  blocks.push({ art: 'disclaimer', text: t(cfg.disclaimer) });

  return {
    blocks,
    dateiname: `${cfg.fileBase}_${format(jetzt, 'yyyy-MM-dd')}.pdf`,
    erstellt: format(jetzt, 'dd.MM.yyyy HH:mm'),
  };
}

function dedupeNormen(normen: Normverweis[]): Normverweis[] {
  const seen = new Set<string>();
  return normen.filter((n) => {
    if (seen.has(n.artikel)) return false;
    seen.add(n.artikel);
    return true;
  });
}

/** Gesamter sichtbarer Text des Modells (für Regressionstests). */
export function modelText(model: PdfModel): string {
  return model.blocks
    .map((b) => {
      switch (b.art) {
        case 'kopf': return `${b.titel} ${b.rechtsgrundlage ?? ''} ${b.erstellt} ${b.aktenzeichen ?? ''}`;
        case 'hero': return [
          b.hero.hauptlabel, b.hero.hauptwert,
          ...(b.hero.nebenwerte ?? []).map((n) => `${n.label}: ${n.wert}`),
          b.hero.kontext ?? '',
        ].join(' ');
        case 'tabelle': return b.zeilen.map((z) => `${z.label}: ${z.wert}`).join('\n');
        case 'hinweisbox': return [b.titel, ...b.eintraege].join('\n');
        case 'schritt': return `${b.nr}. ${b.titel} ${b.text} ${b.normen.map((n) => n.label).join(', ')} ${b.rechtsprechung ?? ''}`;
        case 'trenner': return '';
        default: return 'text' in b ? b.text : '';
      }
    })
    .join('\n');
}
