import type { Kanton } from '../types/legal';
import { KANTONE } from '../lib/kantone';
import { auswertenTarif, type TarifRegel } from '../lib/tarif/staffel';
import { SCHLICHTUNG } from './tarif/schlichtung';
import { GERICHTSKOSTEN } from './tarif/gerichtskosten';
import { GERICHTSKOSTEN_NV } from './tarif/nicht-vermoegensrechtlich';
import type { KantonalerTarif } from './tarif/typen';

// ─── Kantonale Kosten-Rahmen für den Zuständigkeits-Fahrplan ────────────────
//
// RL-36 Teil 2 (RV-27 / VS1-01, §5 Single Source of Truth): Die Zahlenrahmen
// sind KEINE Handkopie mehr. Sie werden zur Ladezeit aus den führenden
// Tarifquellen abgeleitet, aus denselben Daten, die der Prozesskostenrechner
// auswertet:
//   Schlichtung               ← SCHLICHTUNG            (tarif/schlichtung.ts)
//   Gericht 1. Instanz        ← GERICHTSKOSTEN         (tarif/gerichtskosten.ts)
//   nicht vermögensrechtlich  ← GERICHTSKOSTEN_NV      (tarif/nicht-vermoegensrechtlich.ts)
// Erlass-Angabe (Kurzname, Artikel, Erlassnummer) kommt ebenfalls aus dem Tarif.
// Staffel-/Formel-Tarife werden über `auswertenTarif` an den Stützwerten
// 30'001 und 100'000 CHF (Gericht) bzw. an den Bandgrenzen (Schlichtung)
// ausgewertet; es steht keine Zahl mehr an zwei Stellen. Vor RL-36 war dieses
// Modul eine Handkopie (Stand 5.6.2026) und zeigte falsche Rahmen (AI, VS, TG, TI).
//
// Es sind RAHMEN (keine Berechnung!): die konkrete Festsetzung liegt bei der
// Behörde. Bundesrechtliche Kostenfreiheit (Art. 113 Abs. 2 ZPO) entscheidet
// die Engine — diese Schicht liefert nur die kantonalen Zahlen.
//
// Handtext bleibt nur dort, wo KEINE Tarifquelle existiert («ohne Tarifquelle»):
// Familien-/Scheidungsrahmen, Nebenrahmen anderer Instanzen/Verfahrensarten,
// Auffang-/Bemessungsklauseln und Currency-Hinweise. Jeder davon trägt in
// `HAND` den Erlass und den Stand der Erfassung (5.6.2026 bzw. angegeben).
// Pflege: Verfalls-Punkte stehen im Parameter-Verfallsregister (z. B. SG GKV
// sGS 941.12: Nachfolgefassung v3863 seit 1.7.2026 in Vollzug, Beträge
// wortgleich — Currency aufgelöst, QS-GP 2.7.2026).

interface KostenRahmen {
  /** Kurzrahmen in CHF, z. B. «CHF 100–1'000» oder beschreibend. */
  text: string;
  erlass: string;
  hinweis?: string;
}

export interface KantonKosten {
  /** Schlichtungsgebühr (nicht-kostenlose Streitigkeiten, ordentliche Stelle). */
  schlichtung: KostenRahmen;
  /** Entscheidgebühr 1. Instanz (Zivil) — Rahmen/Verweis. */
  gericht: KostenRahmen;
  /**
   * Entscheidgebühr bei NICHT VERMÖGENSRECHTLICHEN Streitigkeiten
   * (Persönlichkeit, Kindesbelange, Statusfragen u. a.). Separater
   * kantonaler Rahmen ODER — bei den 7 Auffang-Kantonen (SZ, FR, SH, AR,
   * AI, SG, GR) — Klausel-/Bemessungstext statt eines erfundenen Zahlen-
   * rahmens. Bundesrechtliche Kostenfreiheit (Art. 114 ZPO bei
   * Gewaltschutz/GlG/BehiG) prüft die Engine VOR dieser Schicht.
   */
  nichtVermoegensrechtlich?: KostenRahmen;
  /**
   * Eigener Familien-/Scheidungsrahmen, nur wo der Erlass ihn ausdrücklich
   * ausweist (sonst läuft Familie über `nichtVermoegensrechtlich`). Bei NE
   * eine einkommens-/vermögensabhängige FORMEL (kein Rahmen — nicht als
   * rechenbar darstellen).
   */
  familie?: KostenRahmen;
}

// ─── Ableitung ──────────────────────────────────────────────────────────────

/** Gericht: ausgewiesener Streitwertbereich (Stützwerte). 30'001 = erster Franken über der Grenze. */
const SW_VON = 30_000;
const SW_BIS = 100_000;

/** Zahl mit ASCII-Apostroph als Tausendertrenner (Format wie bisher). */
const fmt = (n: number): string => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
const chf = (n: number): string => `CHF ${fmt(n)}`;
const spanne = (von: number, bis: number): string =>
  Math.round(von) === Math.round(bis) ? chf(von) : `CHF ${fmt(von)}–${fmt(bis)}`;
const pct = (p: number): string => String(p).replace('.', ',');

interface Wert { von: number; bis: number; deterministisch: boolean }

/** Wertet die Tarifregel aus (einzige Rechenstelle; `auswertenTarif`). */
function wert(regel: TarifRegel, basisChf: number): Wert {
  const e = auswertenTarif(regel, basisChf);
  if (e.deterministisch) return { von: e.betragChf, bis: e.betragChf, deterministisch: true };
  if (e.vonChf === undefined || e.bisChf === undefined) {
    throw new Error(`Kostenanzeige: Tarifregel ohne beide Rahmengrenzen bei Streitwert ${basisChf} (${e.hinweis}).`);
  }
  return { von: e.vonChf, bis: e.bisChf, deterministisch: false };
}

const hullen = (ws: Wert[]): { von: number; bis: number } => ({
  von: Math.min(...ws.map((w) => w.von)),
  bis: Math.max(...ws.map((w) => w.bis)),
});

/** Offenes oberstes Band mit Prozent-Grenze → Klartext-Klausel (z. B. TI Schlichtung). */
function offenesBand(b: { minChf?: number | null; maxChf?: number | null; minProzent?: number; maxProzent?: number }, ab: number): string {
  const unten = b.minChf != null ? chf(b.minChf) : b.minProzent != null ? `${pct(b.minProzent)} %` : '';
  const oben = b.maxChf != null ? chf(b.maxChf) : b.maxProzent != null ? `${pct(b.maxProzent)} %` : '';
  const einheit = b.maxChf == null && b.maxProzent != null ? ' des Streitwerts' : '';
  const verbinder = b.minChf == null && b.minProzent != null ? '–' : ' bis ';
  return `über ${chf(ab)} Streitwert: ${unten}${verbinder}${oben}${einheit}`;
}

/** Schlichtung: Gesamtrahmen über alle Streitwertstufen (Bandgrenzen als Stützwerte). */
function schlichtungText(regel: TarifRegel): string {
  switch (regel.typ) {
    case 'rahmen':
      return spanne(regel.vonChf, regel.bisChf);
    case 'staffel_rahmen': {
      const endlich = regel.baender.filter((b) => Number.isFinite(b.grenzeChf));
      const offen = regel.baender.find((b) => !Number.isFinite(b.grenzeChf));
      const ws = endlich.map((b) => wert(regel, b.grenzeChf));
      const letzte = endlich[endlich.length - 1]?.grenzeChf ?? 0;
      let klausel = '';
      if (offen) {
        if (offen.minChf != null && offen.maxChf != null) ws.push(wert(regel, letzte + 1));
        else klausel = `; ${offenesBand(offen, letzte)}`;
      }
      const h = hullen(ws);
      return `${spanne(h.von, h.bis)} (streitwertgestuft${klausel})`;
    }
    case 'staffel_inklusiv': {
      const ws = regel.baender.map((b) => wert(regel, Number.isFinite(b.bisChf) ? b.bisChf : 1e9));
      const h = hullen(ws);
      return `${spanne(h.von, h.bis)} (Pauschale je Streitwertstufe)`;
    }
    case 'staffel_sockel_prozent': {
      const ws: Wert[] = [];
      let klausel = '';
      for (const b of regel.baender) {
        if (Number.isFinite(b.bisChf)) ws.push(wert(regel, b.bisChf));
        else {
          ws.push(wert(regel, b.abChf));
          if (b.prozent > 0) {
            klausel = `; über ${chf(b.abChf)}: ${pct(b.prozent)} % des Überschusses${b.maxChf != null ? `, max. ${chf(b.maxChf)}` : ''}`;
          }
        }
      }
      const h = hullen(ws);
      return `${spanne(h.von, h.bis)} (Pauschale je Streitwertstufe${klausel})`;
    }
    default:
      throw new Error(`Kostenanzeige Schlichtung: Regeltyp ${regel.typ} nicht abgebildet.`);
  }
}

/** Gericht 1. Instanz: Rahmen für den Streitwertbereich SW_VON–SW_BIS, je Streitwertstufe. */
function gerichtText(regel: TarifRegel): string {
  if (regel.typ === 'rahmen') {
    const w = wert(regel, SW_BIS);
    // Kein Zusatz zur Streitwertabhängigkeit: in den Tarifdaten nicht maschinell erkennbar
    // (AI/AR/SG erhöhen den Rahmen nach Streitwert, nur im Tarif-Hinweis beschrieben).
    return spanne(w.von, w.bis);
  }
  const kopf = `Streitwert ${fmt(SW_VON)}–${fmt(SW_BIS)}: `;
  if (regel.typ === 'staffel_rahmen') {
    const segs: { von: number; bis: number; w: Wert }[] = [];
    let vorher = 0;
    for (const b of regel.baender) {
      if (b.grenzeChf > SW_VON && vorher < SW_BIS) {
        const von = Math.max(vorher, SW_VON);
        const bis = Math.min(b.grenzeChf, SW_BIS);
        const w = wert(regel, bis);
        const letzte = segs[segs.length - 1];
        if (letzte && letzte.w.von === w.von && letzte.w.bis === w.bis) letzte.bis = bis;
        else segs.push({ von, bis, w });
      }
      vorher = b.grenzeChf;
    }
    if (segs.length === 1) return `${kopf}${spanne(segs[0].w.von, segs[0].w.bis)}`;
    return `Streitwert ${segs.map((s) => `${fmt(s.von)}–${fmt(s.bis)}: ${spanne(s.w.von, s.w.bis)}`).join(' · ')}`;
  }
  // deterministische Formel-/Pauschal-Tarife (ZH, AG, VD, NE): an den Stützwerten ausgewertet
  const h = hullen([wert(regel, SW_VON + 1), wert(regel, SW_BIS)]);
  const art = Math.round(h.von) === Math.round(h.bis) ? 'Pauschale' : 'Formel-Tarif, steigt mit dem Streitwert';
  return `${kopf}${spanne(h.von, h.bis)} (${art})`;
}

/** Nicht vermögensrechtlich: Rahmen der Tarifquelle (ein Rahmen ohne Streitwertbezug). */
function nvRahmen(t: KantonalerTarif): string | null {
  if (t.regel.typ !== 'rahmen') return null;
  return t.regel.vonChf === 0 ? `höchstens ${chf(t.regel.bisChf)} (keine Untergrenze im Tarif)` : spanne(t.regel.vonChf, t.regel.bisChf);
}

// Kurzname des Erlasses = Abkürzung in der letzten Klammer des Erlassnamens.
// Anzeige-Kurzform nur dort, wo der Tarif keine Abkürzung trägt oder die
// Tarifdateien denselben Erlass verschieden benennen (reine Beschriftung, keine Zahl).
const KURZNAME: Partial<Record<Kanton, string>> = { GL: 'Kosten-VO', JU: 'Décret', AR: 'GebO', SH: 'JG', FR: 'JR', VS: 'LTar' };
function erlass(t: KantonalerTarif): string {
  const klammern = [...t.erlassName.matchAll(/\(([^)]+)\)/g)];
  const kurz = KURZNAME[t.kanton] ?? (klammern.length > 0 ? klammern[klammern.length - 1][1] : t.erlassName);
  const artikel = t.artikel.replace(/\s*\([^)]*\)/g, '').trim();
  return `${kurz} ${artikel}, ${t.erlassNr}`;
}

const verbinde = (...teile: (string | undefined)[]): string | undefined => {
  const t = teile.filter((x): x is string => !!x && x.length > 0);
  return t.length > 0 ? t.join(' ') : undefined;
};

// ─── Handtext ohne Tarifquelle ──────────────────────────────────────────────
// Alles hier hat KEINE Quelle in tarif/*.ts: Erfassungsstand 5.6.2026
// (bibliothek/kosten/schlichtungsgebuehren-kantone.md, bibliothek/behoerden/
// gog-gerichtsorganisation-kantone.md, bibliothek/recherche/
// gebuehren-nichtvermoegensrechtlich.md), Erlass je Eintrag. Zahlen, die in
// einer Tarifquelle stehen, gehören NICHT hierher.

interface Hand {
  /** Einheitenzusatz an allen drei Rahmen (z. B. BE Taxpunkte). */
  einheit?: string;
  /** true = Hinweis aus der Tarifquelle (SCHLICHTUNG[k].hinweis) anzeigen: Teilrahmen je Verfahrensabschnitt. */
  schlichtungHinweisAusTarif?: true;
  schlichtungHinweis?: string;
  gerichtHinweisAusTarif?: true;
  gerichtHinweis?: string;
  nv?: {
    /** Auffang-Kanton: kein eigener Rahmen; `instanz` benennt die Instanz des Tarif-Rahmens. */
    auffang?: { instanz: string };
    /** Beschriftung des Tarif-Rahmens (Instanz/Verfahren), in Klammern dahinter. */
    label?: string;
    /** Fester Text statt Tarifrahmen (SH: Tarif ist formel_extern). */
    festtext?: string;
    /** Weitere Rahmen anderer Verfahren/Instanzen, ohne Tarifquelle, hinter dem Tarif-Rahmen. */
    zusatz?: string;
    hinweis?: string;
    erlassHand?: string;
  };
  /** Familien-/Scheidungsrahmen ohne Tarifquelle; `text` darf den abgeleiteten NV-Text einsetzen. */
  familie?: { text: string | ((nv: string) => string); erlass: string; hinweis?: string };
}

const HAND: Record<Kanton, Hand> = {
  ZH: {
    nv: { hinweis: 'nach tatsächlichem Streitinteresse / Zeitaufwand / Schwierigkeit' },
    familie: { text: 'Scheidung auf gemeinsames Begehren / Eheschutz: Reduktion bis zur Hälfte des Grundtarifs', erlass: 'GebV OG § 6, LS 211.11' },
  },
  BE: {
    einheit: 'Taxpunkte à CHF 1',
    nv: { hinweis: "vereinfacht (Art. 39) 200–7'500 TP; Berufung nicht vermögensr. (Art. 45) 200–12'000 TP" },
    familie: { text: "600–12'000 Taxpunkte (à CHF 1)", erlass: 'VKD Art. 41, BSG 161.12', hinweis: "summarisches Verfahren (Art. 40) 100–20'000 TP" },
  },
  LU: {
    nv: { hinweis: "vereinfacht (§ 6) CHF 500–5'000; summarisch (§ 7) CHF 300–4'000" },
    familie: { text: 'eigener Familienrecht-Abschnitt (§ 8); Detailbeträge am Volltext nachzuziehen', erlass: 'JusKV § 8, SRL 265', hinweis: 'Familien-Detailbeträge § 8 noch nicht erfasst (offener Punkt Dossier)' },
  },
  UR: {
    nv: { hinweis: "vereinfacht (Art. 6) CHF 200–5'000" },
    familie: { text: "CHF 500–10'000 (familienrechtliche Verfahren inkl. Summarverfahren)", erlass: 'GGebR Art. 8, RB 2.3232' },
  },
  SZ: {
    gerichtHinweis: "Gebührenrahmen Einzelrichter CHF 100–50'000, Bezirksgericht CHF 100–100'000 (§ 33 Ziff. 4/6 GebO)",
    gerichtHinweisAusTarif: true,
    nv: {
      auffang: { instanz: 'Bezirksgericht' },
      zusatz: "Einzelrichter 100–50'000",
      hinweis: 'rein bemessungsabhängig (§ 3, max. CHF 180/Std.); kein tariflicher Sonderrahmen',
    },
  },
  OW: {
    nv: {
      label: 'Kantonsgericht Kollegial',
      zusatz: "Einzelrichter CHF 100–5'000",
      hinweis: "Obergericht Beschwerde (Art. 14) 200–5'000; Güterrecht > 50'000 → Streitwert-Ansätze hinzu",
    },
    familie: {
      text: (nv) => `= nicht-vermögensrechtliche Zeile «ohne Vermögensinteressen / familienrechtlich»: ${nv}`,
      erlass: 'GebOR Art. 9/12, GDB 134.15',
    },
  },
  NW: {
    nv: { hinweis: 'ohne bestimmbaren Streitwert' },
    familie: { text: "Scheidung CHF 800–4'000 u. a. (eigener familienrechtlicher Abschnitt)", erlass: 'PKoG Art. 7 Abs. 3, NG 261.2' },
  },
  GL: {
    nv: { hinweis: 'Untergrenze nur via Bemessung Art. 1; summarisch höchstens die Hälfte' },
  },
  ZG: {
    nv: { hinweis: 'periodische Leistungen bis auf die Hälfte ermässigbar' },
    familie: { text: "CHF 1'600–12'000", erlass: 'KoV OG § 13, BGS 161.7', hinweis: 'summarisch bis halbiert' },
  },
  FR: {
    nv: {
      auffang: { instanz: 'Zivilgericht' },
      zusatz: "Kantonsgericht 100–200'000 (Zivilgericht verdoppelbar)",
      hinweis: 'Streitwert-Abstufung erstellt das Kantonsgericht intern (Art. 21 JR) — nicht als BDLF-Erlass publiziert',
    },
  },
  SO: {
    nv: { hinweis: 'eine § 145-Staffel gilt für alle Instanzen' },
    schlichtungHinweisAusTarif: true,
  },
  BS: {
    schlichtungHinweisAusTarif: true,
    nv: { hinweis: 'weitester kantonaler Rahmen' },
    familie: { text: "Eheschutz CHF 300–2'000 (aufwendig bis 10'000)", erlass: 'GGR § 10, SG 154.810' },
  },
  BL: {
    schlichtungHinweisAusTarif: true,
    familie: { text: "Eheschutz/Partnerschaftsschutz (lit. h) CHF 200–3'000 · Ehescheidung/-ungültigkeit/-trennung/Partnerschaftsauflösung (lit. i) CHF 200–15'000", erlass: 'GebT § 8 Abs. 1 lit. h/i, SGS 170.31' },
  },
  SH: {
    schlichtungHinweis: 'Korrektur 16.6.2026: bisher zitierte ZPO SH 273.100 (1951) am 1.1.2011 mit eidg. ZPO aufgehoben; geltend ist Art. 82 Justizgesetz (Fassung 1.5.2026)',
    gerichtHinweis: 'Tiefenerfassung 6.6.2026: Gebühren stehen im Justizgesetz (Fassung 1.5.2026) — die früher zitierte «Kostenverordnung 2003» war eine Fehlzuordnung (Luzern)',
    nv: {
      festtext: "kein eigener Bandrahmen — es wird vom tatsächlichen Streitinteresse ausgegangen, nach Ermessen bestimmt; die Vorschriften über den Streitwert gelten sinngemäss (Tarif Art. 83 sinngemäss)",
      hinweis: 'Fassung ab 1.5.2026; kein tariflicher Sonderrahmen',
    },
  },
  AR: {
    schlichtungHinweisAusTarif: true,
    gerichtHinweisAusTarif: true,
    nv: {
      auffang: { instanz: 'Kantonsgericht Kollegial, Art. 17' },
      zusatz: "Einzelrichter KG Art. 14: 30–1'500",
      hinweis: 'kein tariflicher Sonderrahmen für nicht-vermögensrechtliche Streitigkeiten',
    },
    familie: { text: "Scheidung CHF 500–6'000 (Einzelrichter KG Art. 14; Obergericht Art. 16 ebenfalls 500–6'000)", erlass: 'GebO Art. 14/16, bGS 233.3' },
  },
  AI: {
    schlichtungHinweisAusTarif: true,
    gerichtHinweisAusTarif: true,
    nv: {
      auffang: { instanz: 'Bezirksgericht Kollegial, Art. 11' },
      zusatz: "Einzelrichter Art. 10: 300–5'000; Rechtsmittel Art. 13: 800–8'000",
      hinweis: 'Fassung ab 1.1.2024; kein tariflicher Sonderrahmen',
    },
  },
  SG: {
    schlichtungHinweisAusTarif: true,
    schlichtungHinweis: 'GKV sGS 941.12: Nachfolgefassung v3863 seit 1.7.2026 in Vollzug (sGS-Nr. unverändert, Beträge wortgleich).',
    gerichtHinweisAusTarif: true,
    gerichtHinweis: 'GKV sGS 941.12: Fassung v3863 seit 1.7.2026 in Vollzug (Beträge wortgleich)',
    nv: {
      auffang: { instanz: 'Kreisgericht Kollegial, Art. 10' },
      zusatz: "Einzelrichter 500–5'000; Kantonsgericht Kammer Art. 10 Ziff. 2: 800–8'000",
      hinweis: 'GKV sGS 941.12: Nachfolgefassung v3863 seit 1.7.2026 in Vollzug (sGS-Nr. unverändert, Beträge wortgleich).',
    },
  },
  GR: {
    schlichtungHinweisAusTarif: true,
    nv: {
      auffang: { instanz: 'ordentliches Verfahren, Art. 3' },
      zusatz: "vereinfacht Art. 4: 1'000–8'000",
      hinweis: 'VO vom 2.1.2025; kein tariflicher Sonderrahmen für nicht-vermögensrechtliche Streitigkeiten',
    },
    familie: { text: "ehe-/kindesrechtliche Verfahren: Einzelrichter CHF 1'000–5'000 · Kollegialgericht CHF 3'000–8'000", erlass: 'VGZ Art. 6, BR 320.210' },
  },
  AG: {
    schlichtungHinweisAusTarif: true,
    nv: { hinweis: 'Stand 1.7.2024 (GebührD, nicht das aufgehobene VKD)' },
  },
  TG: {
    nv: { hinweis: 'soweit nicht Ziff. 1 nach vermögensrechtlichen Ansprüchen anwendbar' },
  },
  TI: {
    schlichtungHinweisAusTarif: true,
    nv: { hinweis: 'summarisch (Art. 9) bzw. vereinfacht (Art. 8) je die Hälfte' },
    familie: { text: (nv) => `Scheidung ist ausdrücklich in Art. 7 cpv. 2 erfasst (${nv})`, erlass: 'LTG Art. 7 cpv. 2, RL 178.200' },
  },
  VD: {
    nv: { label: 'ordentlich', zusatz: "vereinfacht (Art. 26) CHF 360–200'000", hinweis: "Berufung nicht vermögensr. (Art. 64) 800–6'000 (bis SW 30'000)" },
  },
  VS: {
    schlichtungHinweisAusTarif: true,
    nv: { hinweis: 'spätere Teilrevisionen nicht abgeglichen' },
    familie: {
      text: (nv) => `Abänderung Scheidung/Trennung/Unterhalt: ${nv} (bei Scheidung mit Güterrecht zusätzlich Streitwert-Tarif Art. 16)`,
      erlass: 'LTar Art. 17, RS 173.8',
    },
  },
  NE: {
    schlichtungHinweis: 'auch bei Einigung geschuldet',
    nv: { hinweis: 'état 1.4.2023' },
    familie: {
      text: "Scheidung: Formel 2,5–4 % des Einkommens + 2,5–4 ‰ des Vermögens, min. 600; gemeinsames Begehren mit vollständiger Einigung (Art. 18) 1,3 % / 1,3 ‰, min. 400 / max. 2'000",
      erlass: 'LTFrais Art. 16/17, RSN 164.1',
      hinweis: 'einkommens-/vermögensabhängige Formel — KEIN fixer Rahmen, nicht als rechenbar darstellen; %/‰-Sätze sind datierte Parameter (état 1.4.2023)',
    },
  },
  GE: {
    nv: { hinweis: 'Stand 1.7.2025' },
  },
  JU: {
    einheit: 'Punktwert CHF 1.05 eingerechnet',
    schlichtungHinweis: 'Punktwert jährlich indexiert',
    nv: {
      zusatz: "Tribunal des baux/prud'hommes 120–2'200 Punkte; Cour civile 1'500–36'000 Punkte",
      hinweis: 'Punktwert 1.05 ab 1.1.2025 zwingend einrechnen',
    },
  },
};

function baueKosten(k: Kanton): KantonKosten {
  const h = HAND[k];
  const s = SCHLICHTUNG[k];
  const g = GERICHTSKOSTEN[k];
  const n = GERICHTSKOSTEN_NV[k];
  const mitEinheit = (text: string): string => (h.einheit ? `${text} (${h.einheit})` : text);

  const schlichtung: KostenRahmen = {
    text: mitEinheit(schlichtungText(s.regel)),
    erlass: erlass(s),
    hinweis: verbinde(h.schlichtungHinweisAusTarif ? s.hinweis : undefined, h.schlichtungHinweis),
  };
  const gericht: KostenRahmen = {
    text: mitEinheit(gerichtText(g.regel)),
    erlass: erlass(g),
    hinweis: verbinde(h.gerichtHinweisAusTarif ? g.hinweis : undefined, h.gerichtHinweis),
  };

  const rahmenNv = nvRahmen(n);
  let nvText: string;
  if (h.nv?.festtext) nvText = h.nv.festtext;
  else if (rahmenNv === null) throw new Error(`Kostenanzeige ${k}: nicht vermögensrechtlich ohne Rahmen und ohne Festtext.`);
  else if (h.nv?.auffang) {
    nvText = `kein eigener Rahmen — Bemessung nach Bedeutung/Zeitaufwand innerhalb des Instanz-Rahmens (${h.nv.auffang.instanz}: ${rahmenNv})`;
  } else nvText = mitEinheit(h.nv?.label ? `${rahmenNv} (${h.nv.label})` : rahmenNv);
  if (h.nv?.zusatz) nvText = `${nvText}${h.nv.auffang ? '; weitere Rahmen: ' : ' · '}${h.nv.zusatz}`;
  const nichtVermoegensrechtlich: KostenRahmen = { text: nvText, erlass: erlass(n), hinweis: h.nv?.hinweis };

  const out: KantonKosten = { schlichtung, gericht, nichtVermoegensrechtlich };
  if (h.familie) {
    out.familie = {
      text: typeof h.familie.text === 'function' ? h.familie.text(nvText) : h.familie.text,
      erlass: h.familie.erlass,
      ...(h.familie.hinweis ? { hinweis: h.familie.hinweis } : {}),
    };
  }
  return out;
}

export const ZUSTAENDIGKEIT_KOSTEN: Record<Kanton, KantonKosten> = Object.fromEntries(
  KANTONE.map((k) => [k, baueKosten(k)]),
) as Record<Kanton, KantonKosten>;

export function kostenFuer(kanton: Kanton): KantonKosten | null {
  return ZUSTAENDIGKEIT_KOSTEN[kanton] ?? null;
}
