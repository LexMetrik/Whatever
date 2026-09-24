// Dossier: bibliothek/recherche/arbeitsrecht-rechner.md
import { parseISO, addDays, addMonths, addYears, isBefore, isAfter } from 'date-fns';
import type { LohnfortzahlungInput, Berechnungsergebnis, Normverweis, SkalaDauer, KtgKriterien } from '../types/legal';
import {
  berechneDienstjahr,
  formatDatum,
  formatISO,
  formatSkalaDauer,
  letzterTagLohnfortzahlung,
  skaliereSkalaDauer,
  dauerUeberDreiMonate,
} from './datumsUtils';
import { skaleFuerKanton, dauerAusSkala, skalaHinweise } from '../data/lohnfortzahlungSkalen';
import { rechtsprechung } from '../data/verifikation';

// ─── Feste Normverweise (Art. 324a OR) ────────────────────────────────────

const N_324a_1: Normverweis = { artikel: 'Art. 324a Abs. 1 OR', bemerkung: 'Anspruchsvoraussetzung' };
const N_324a_2: Normverweis = { artikel: 'Art. 324a Abs. 2 OR', bemerkung: 'Dauer «mindestens 3 Wochen / angemessen länger»' };
const N_324a_3: Normverweis = { artikel: 'Art. 324a Abs. 3 OR', bemerkung: 'Schwangerschaft gleicher Umfang' };
const N_324a_4: Normverweis = { artikel: 'Art. 324a Abs. 4 OR', bemerkung: 'Abweichende (gleichwertige) Regelung' };
const N_324b:   Normverweis = { artikel: 'Art. 324b OR', bemerkung: 'Koordination mit Sozialversicherung (KTG/UVG)' };
const N_324b_1: Normverweis = { artikel: 'Art. 324b Abs. 1 OR', bemerkung: 'Befreiung, wenn Versicherung ≥ 80 % deckt' };
const N_324b_2: Normverweis = { artikel: 'Art. 324b Abs. 2 OR', bemerkung: 'Differenz zu 80 % bei geringeren Leistungen' };
const N_324b_3: Normverweis = { artikel: 'Art. 324b Abs. 3 OR', bemerkung: 'mind. 80 % während Wartezeit/Karenztagen' };
const N_362:    Normverweis = { artikel: 'Art. 362 OR', bemerkung: 'Relativ zwingendes Recht' };

// Kantone, deren Skala-Zuordnung aus der vorliegenden SECO-/SHK-Tabelle belegt ist (§2.5).
const KANTONE_ZUORDNUNG_BELEGT = new Set([
  'BS', 'BL',                                  // Basler Skala
  'ZH', 'GR',                                  // Zürcher Skala
  'BE', 'AG', 'OW', 'SG', 'GE', 'VD', 'VS', 'NE', 'JU', 'FR', // Berner Skala (inkl. West-CH)
]);

// SkalaDauer grob in Kalendertage (für das CHF-Geldminimum, §2.3): Monat = 30, Woche = 7.
function skalaDauerTage(d: SkalaDauer): number {
  switch (d.typ) {
    case 'wochen': return d.anzahl * 7;
    case 'monate': return d.anzahl * 30;
    case 'tage':   return d.anzahl;
  }
}

// Gleichwertigkeits-Mindestschwellen einer KTG-Lösung (Art. 324a Abs. 4 OR /
// BGE 135 III 640): geteilte SSoT für die Logik-Vergleiche in lohnfortzahlung
// UND vorlagen/arbeitsvertrag (§5; Bug-Audit 19.6.2026 — vorher in beiden als
// Literale dupliziert). Die beschreibenden Zahlen in den Meldungstexten bleiben.
export const KTG_GLEICHWERTIGKEIT = {
  taggeldMinProzent: 80, leistungMinTage: 720, karenzMaxTage: 3, praemieGrenzeProzent: 50,
} as const;

// §2.6: Gleichwertigkeits-Indikation aus der KTG-Checkliste (Orientierung, nicht verbindlich).
function ktgIndikation(k: KtgKriterien): { ok: boolean; befunde: string[] } {
  const befunde: string[] = [];
  let ok = true;
  if (k.taggeldProzent != null && k.taggeldProzent < KTG_GLEICHWERTIGKEIT.taggeldMinProzent) { ok = false; befunde.push(`Taggeld ${k.taggeldProzent} % < 80 %.`); }
  if (k.leistungsdauerTage != null && k.leistungsdauerTage < KTG_GLEICHWERTIGKEIT.leistungMinTage) { ok = false; befunde.push(`Leistungsdauer ${k.leistungsdauerTage} < 720 Tage.`); }
  if (k.karenzTage != null && k.karenzTage > KTG_GLEICHWERTIGKEIT.karenzMaxTage) { ok = false; befunde.push(`Karenzfrist ${k.karenzTage} Tage > 3 Tage – in keinem Fall zulässig (SHK N 62).`); }
  if (k.praemienAnteilArbeitgeberProzent != null && k.praemienAnteilArbeitgeberProzent < KTG_GLEICHWERTIGKEIT.praemieGrenzeProzent) { ok = false; befunde.push(`Arbeitgeber-Prämienanteil ${k.praemienAnteilArbeitgeberProzent} % < 50 %.`); }
  if (k.alleRisikenAbgedeckt === false) { ok = false; befunde.push('Nicht alle relevanten Risiken abgedeckt.'); }
  if (k.schriftlichVereinbart === false) { ok = false; befunde.push('Keine schriftliche Abrede – Gültigkeitsvoraussetzung (Art. 324a Abs. 4 OR).'); }
  return { ok, befunde };
}

export function berechneLohnfortzahlung(input: LohnfortzahlungInput): Berechnungsergebnis & { zeitraumVonISO?: string; letzterTagISO?: string } {
  const {
    vertragsbeginn,
    verhinderungBeginn,
    verhinderungEnde,
    arbeitsunfaehigkeitProzent,
    pensumProzent,
    kanton,
    ktgGleichwertigVorhanden,
    ktgKriterien,
    monatslohnBrutto,
  } = input;

  // Engine-Guard (analog verzugszins/zpoFristen): AUF ausserhalb 1–100 %
  // würde in skaliereSkalaDauer zu Infinity/Invalid Date führen. Das Formular
  // validiert zwar, aber die öffentliche Funktion muss selbst sauber abbrechen.
  if (!(arbeitsunfaehigkeitProzent > 0 && arbeitsunfaehigkeitProzent <= 100)) {
    return {
      ergebnis: 'Ungültige Eingabe: Die Arbeitsunfähigkeit muss zwischen 1 und 100 % liegen.',
      status: 'unzulaessig',
      rechenweg: [], annahmen: [],
      warnungen: ['Bitte den Grad der Arbeitsunfähigkeit prüfen.'],
      normverweise: [],
    };
  }

  const vb  = parseISO(vertragsbeginn);
  const vhb = parseISO(verhinderungBeginn);
  const pensum = pensumProzent ?? 100;
  const grund = input.verhinderungsgrund ?? 'krankheit';

  const rechenweg: Berechnungsergebnis['rechenweg'] = [];
  const annahmen: string[] = [
    'Unverschuldete Verhinderung (Krankheit, Unfall, Schwangerschaft o.ä.).',
    'Vertragsbeginn = tatsächliche Arbeitsaufnahme (Karenzfrist ab Arbeitsaufnahme, SHK Art. 324a N 40).',
    'Stichtag für Dienstjahr-Bestimmung: Beginn der Arbeitsverhinderung.',
    'Kein GAV mit abweichender Regelung unterstellt.',
  ];
  const warnungen: string[] = [
    'Die Lohnfortzahlungsskalen sind Gerichtspraxis zur Konkretisierung von Art. 324a Abs. 2 OR – keine Gesetzesnormen und für die Gerichte nicht verbindlich (SHK Art. 324a N 50). Vor Produktiveinsatz gegen aktuelle kantonale Praxis abzugleichen.',
  ];

  // ─── Schritt 0: KTG-Gleichwertigkeitsprüfung (§2.6) ──────────────────

  // RL-25b (rechtslogik-rest-03, nur «schriftlich»): Art. 324a Abs. 4 OR lässt
  // eine abweichende Regelung nur «durch schriftliche Abrede, Normalarbeits-
  // vertrag oder Gesamtarbeitsvertrag» zu — Gültigkeitsvoraussetzung, kein
  // Gesamtvergleich. Ist sie ausdrücklich verneint, verdrängt die KTG-Abrede die
  // Skala nicht; die übrigen Checklisten-Kriterien bleiben Indikation (§8).
  const ktgFormungueltig = ktgGleichwertigVorhanden && ktgKriterien?.schriftlichVereinbart === false;

  if (ktgGleichwertigVorhanden && !ktgFormungueltig) {
    let indikationsText =
      'Faustregel der Rechtsprechung: Taggeld ≥ 80 % des Lohnes während max. 720 Tagen, Karenzfrist max. 3 Tage, ' +
      'Prämien mindestens hälftig durch Arbeitgeber. Gleichwertigkeit ist ein abstrakter Gesamtvergleich im Einzelfall.';
    if (ktgKriterien) {
      const { ok, befunde } = ktgIndikation(ktgKriterien);
      indikationsText += ok
        ? ' Checkliste-Indikation: Kriterien erfüllt (Orientierung, keine verbindliche Beurteilung).'
        : ` Checkliste-Indikation: Gleichwertigkeit fraglich – ${befunde.join(' ')}`;
    }
    rechenweg.push({
      beschreibung: 'Schritt 0 – KTG-Gleichwertigkeitsprüfung (Art. 324a Abs. 4 / Art. 324b OR)',
      zwischenergebnis:
        'Eine mindestens gleichwertige Krankentaggeldversicherung wird angenommen. ' +
        'Das KTG-Regime tritt an die Stelle der gesetzlichen Skala. ' + indikationsText,
      normen: [N_324a_4, N_324b, N_362],
      rechtsprechung: [rechtsprechung('BGE_135_III_640')],
    });
    return {
      ergebnis: 'KTG-Regime: Mindestens gleichwertige Krankentaggeldversicherung angenommen. Die gesetzliche Skala (Art. 324a OR) findet keine Anwendung. Der konkrete Leistungsanspruch ergibt sich aus der Versicherungspolice.',
      status: 'ktg_regime',
      rechenweg,
      annahmen,
      warnungen: [
        ...warnungen,
        'Gleichwertigkeit im Einzelfall prüfen (abgedeckte Risiken, Leistungshöhe/-dauer, Karenzfristen, Prämienteilung). Karenzfristen > 3 Tage sind in keinem Fall zulässig (SHK N 62).',
        'Formelle Anforderungen: KTG-Abrede nur wirksam, wenn schriftlich bzw. in GAV/NAV und mit allen wesentlichen Punkten (Prozentsatz, Risiken, Dauer, Prämienfinanzierung, Karenzfrist) (Art. 324a Abs. 4 OR, SHK N 57–59).',
      ],
      normverweise: [N_324a_4, N_324b, N_362],
    };
  }

  if (ktgFormungueltig) {
    rechenweg.push({
      beschreibung: 'Schritt 0 – KTG-Abrede: Formerfordernis (Art. 324a Abs. 4 OR)',
      zwischenergebnis:
        'Eine Krankentaggeldversicherung ist angegeben, aber weder schriftlich noch in einem Normal- oder Gesamtarbeitsvertrag vereinbart. ' +
        'Art. 324a Abs. 4 OR lässt eine abweichende Regelung nur «durch schriftliche Abrede, Normalarbeitsvertrag oder Gesamtarbeitsvertrag» zu; ' +
        'die Form ist Gültigkeitsvoraussetzung. Die Abrede verdrängt die gesetzliche Regelung darum nicht: Es gilt die Skala nach Art. 324a Abs. 1–3 OR als Mindestanspruch.',
      normen: [N_324a_4, N_324a_1, N_362],
    });
    warnungen.push(
      'KTG-Abrede nicht schriftlich (auch nicht in GAV/NAV) vereinbart: nach Art. 324a Abs. 4 OR keine gültige abweichende Regelung; berechnet ist der gesetzliche Mindestanspruch nach Skala. Ob und wieweit ausbezahlte Taggelder an diesen Lohnanspruch anzurechnen sind, ist im Einzelfall zu prüfen.',
    );
  }

  // ─── Schritt 1: Anspruchsvoraussetzung (§2.2 differenziert) ──────────

  const vordienst = Math.max(0, input.anrechenbareVordienstzeitMonate ?? 0);
  const karenzBeginn = vordienst > 0 ? addMonths(vb, -vordienst) : vb; // SHK N 44: Vordienstzeit anrechnen
  const dreiMonate = addMonths(karenzBeginn, 3);
  const befristetFest = input.befristetFest ?? false;
  const kfMonate = input.vereinbarteKuendigungsfristMonate;

  let hatAnspruch: boolean;
  let anspruchBegruendung: string;
  if (befristetFest) {
    hatAnspruch = true;
    anspruchBegruendung = 'Befristeter Vertrag fester Dauer (> 3 Monate) → Anspruch ab dem ersten Tag (Art. 324a Abs. 1 OR, SHK N 41).';
  } else if (kfMonate != null && kfMonate > 3) {
    hatAnspruch = true;
    anspruchBegruendung = `Unbefristet mit vereinbarter Kündigungsfrist ${kfMonate} Monate (> 3) → Anspruch ab dem ersten Tag (SHK N 42).`;
  } else {
    hatAnspruch = dauerUeberDreiMonate(karenzBeginn, vhb);
    anspruchBegruendung = hatAnspruch
      ? `Arbeitsverhältnis dauert seit ${formatDatum(karenzBeginn)} bis ${formatDatum(vhb)}, also mehr als 3 Monate. Anspruch besteht.`
      : `Arbeitsverhältnis dauert seit ${formatDatum(karenzBeginn)} bis ${formatDatum(vhb)} – noch keine 3 Monate. ` +
        `Bei Kündigungsfrist ≤ 3 Monaten entsteht der Anspruch erst ab dem ersten Tag des vierten Monats (Grenzwert: ${formatDatum(dreiMonate)}); ` +
        `beginnt die Verhinderung vorher, ist bis dahin kein Lohn geschuldet.`;
  }

  rechenweg.push({
    beschreibung: 'Schritt 1 – Anspruchsvoraussetzung (Art. 324a Abs. 1 OR)',
    zwischenergebnis: anspruchBegruendung + (vordienst > 0 ? ` (Anrechenbare Vordienstzeit: ${vordienst} Monate, SHK N 44.)` : ''),
    normen: [N_324a_1],
    rechtsprechung: [rechtsprechung('BGE_131_III_623')],
  });

  // RL-25b (rechtslogik-rest-01): Die Karenzfrist schiebt den Anspruch nur
  // hinaus, sie verneint ihn nicht. BGE 131 III 623 E. 2.4 (Regeste): bei
  // unbefristetem Vertrag mit Kündigungsfrist ≤ 3 Monaten «keinen Lohnanspruch
  // vor dem ersten Tag des vierten Monats». Dauert die Verhinderung darüber
  // hinaus, läuft der Skala-Kredit ab diesem Tag. Vorher: absolut «Kein Anspruch».
  let anspruchsBeginn = vhb;
  const nachKarenz = !hatAnspruch;
  if (nachKarenz) {
    const veK = verhinderungEnde ? parseISO(verhinderungEnde) : null;
    if (veK && isBefore(veK, dreiMonate)) {
      return {
        ergebnis:
          `Kein Anspruch auf Lohnfortzahlung: Die Verhinderung (${formatDatum(vhb)} bis ${formatDatum(veK)}) endet vor dem ersten Tag des vierten Monats ` +
          `des Arbeitsverhältnisses (${formatDatum(dreiMonate)}); bis dahin trägt der Arbeitnehmer den Lohnausfall selbst ` +
          `(Karenzfrist; Art. 324a Abs. 1 OR; BGE 131 III 623 E. 2.4).`,
        status: 'kein_anspruch',
        rechenweg,
        annahmen,
        warnungen,
        normverweise: [N_324a_1],
      };
    }
    anspruchsBeginn = dreiMonate;
    rechenweg.push({
      beschreibung: 'Schritt 1a – Anspruchsbeginn nach Ablauf der Karenzfrist (Art. 324a Abs. 1 OR)',
      zwischenergebnis:
        (veK
          ? `Die Verhinderung dauert bis ${formatDatum(veK)} und reicht über den ${formatDatum(dreiMonate)} hinaus. `
          : `Ende der Verhinderung nicht angegeben – angenommen wird, dass sie über den ${formatDatum(dreiMonate)} hinaus andauert. `) +
        `Vom ${formatDatum(vhb)} bis ${formatDatum(addDays(dreiMonate, -1))} ist kein Lohn geschuldet (Karenzfrist); ` +
        `ab dem ${formatDatum(dreiMonate)} (erster Tag des vierten Monats) besteht der Anspruch nach Skala.`,
      normen: [N_324a_1],
      rechtsprechung: [rechtsprechung('BGE_131_III_623')],
    });
    if (!veK) {
      warnungen.push(
        `Ende der Verhinderung nicht angegeben: Berechnet ist der Anspruch ab ${formatDatum(dreiMonate)} unter der Annahme, dass die Verhinderung so lange andauert. ` +
        `Endet sie vor dem ${formatDatum(dreiMonate)}, besteht kein Anspruch (Karenzfrist, BGE 131 III 623 E. 2.4).`,
      );
    }
  }

  // ─── Schritt 2: Skala bestimmen (§2.5 Zuordnungs-Vorbehalt) ──────────

  const { skala, warnung: skalaWarnung } = skaleFuerKanton(kanton);
  if (skalaWarnung) warnungen.push(skalaWarnung);
  if (!KANTONE_ZUORDNUNG_BELEGT.has(kanton)) {
    warnungen.push(
      `Kantonszuordnung für ${kanton} ist über die in der SECO-/SHK-Tabelle genannten Kantone hinaus eine Annahme des Tools (nicht aus der vorliegenden Quelle belegt). Kantonale Gerichtspraxis im Einzelfall prüfen.`,
    );
  }

  rechenweg.push({
    beschreibung: 'Schritt 2 – Skala bestimmen',
    zwischenergebnis: `Kanton ${kanton} → ${skala.name}. ${skala.quellenhinweis}`,
    normen: [N_324a_2],
  });

  // ─── Schritt 3: Dienstjahr ermitteln ─────────────────────────────────

  const dienstjahr = berechneDienstjahr(vb, vhb);

  rechenweg.push({
    beschreibung: 'Schritt 3 – Dienstjahr (Stichtag = Beginn der Verhinderung)',
    zwischenergebnis:
      `Vertragsbeginn ${formatDatum(vb)}, Stichtag ${formatDatum(vhb)}: ` +
      `${dienstjahr - 1} vollendete Jahre + 1 = ${dienstjahr}. Dienstjahr.`,
    normen: [N_324a_2],
  });

  // ─── Schritt 4: Skala ablesen (§2.4 «mindestens», §2.5 Beleggrenze) ──

  const skalaEintrag = dauerAusSkala(skala, dienstjahr);
  if (!skalaEintrag) {
    return {
      ergebnis: `Kein Skalaeintrag für ${dienstjahr}. Dienstjahr gefunden. Bitte Skala manuell prüfen.`,
      status: 'kein_anspruch',
      rechenweg,
      annahmen,
      warnungen,
      normverweise: [N_324a_2],
    };
  }

  const basisdauer = skalaEintrag.dauer;
  // RL-25 (F4-05, W-13): Beleggrenze je Skala (Basel/Zürich SHK bis 11. DJ,
  // Bern Obergericht BE bis 19. DJ), Fortschreibungen und NW-Widerspruch offenlegen.
  const hinweise = skalaHinweise(kanton, skala, dienstjahr);
  warnungen.push(...hinweise.warnungen);

  rechenweg.push({
    beschreibung: `Schritt 4 – Skala-Dauer ablesen (${skala.name}, ${dienstjahr}. DJ)`,
    zwischenergebnis:
      (dienstjahr === 1
        ? `1. Dienstjahr: mindestens ${formatSkalaDauer(basisdauer)} (Art. 324a Abs. 2 OR – «mindestens drei Wochen»). `
        : `Regelmass laut Gerichtspraxis: ${formatSkalaDauer(basisdauer)}. `) +
      `Orientierungswert, nicht gerichtsverbindlich (SHK Art. 324a N 50)` +
      hinweise.rechenwegZusatz + '.',
    normen: [N_324a_2],
  });

  // ─── Schritt 5: Teilarbeitsunfähigkeit – Geldminimum (§2.3) ──────────

  let effektiveDauer = basisdauer;
  if (arbeitsunfaehigkeitProzent < 100) {
    effektiveDauer = skaliereSkalaDauer(basisdauer, arbeitsunfaehigkeitProzent);
    rechenweg.push({
      beschreibung: `Schritt 5 – Teilarbeitsunfähigkeit ${arbeitsunfaehigkeitProzent} % (Geld- statt Zeitminimum)`,
      zwischenergebnis:
        `Art. 324a OR gewährt ein GELD-, nicht ein Zeitminimum (SHK N 54): Bei Teil-AUF verlängert sich die ` +
        `Lohnfortzahlungspflicht entsprechend. Skala-Dauer ${formatSkalaDauer(basisdauer)} ÷ ${arbeitsunfaehigkeitProzent / 100} = ${formatSkalaDauer(effektiveDauer)}. ` +
        `Das Lohn-Budget (voller Lohn über die Skala-Dauer) wird über die gestreckte Periode aufgebraucht.` +
        (pensum < 100
          ? ` Beschäftigungsgrad ${pensum} % und AUF-Grad ${arbeitsunfaehigkeitProzent} % sind getrennte Grössen; die AUF ist auf die geschuldete Arbeitsleistung bezogen (nicht auf arbeitsfreie Zeit), SHK N 54.`
          : ''),
      normen: [N_324a_2],
    });
    warnungen.push(
      `Die kalendarische Streckung der Lohnfortzahlungsdauer bei Teil-AUF (${arbeitsunfaehigkeitProzent} %) ist eine vertretbare Praxis-Auslegung des Geldminimums; im Einzelfall zu prüfen. Primär geschuldet ist der CHF-Betrag, die Kalenderdauer ist abgeleitet.`,
    );
  }

  // ─── Schritt 6: Enddatum 1. Kredit ───────────────────────────────────

  let erstesEnde = letzterTagLohnfortzahlung(anspruchsBeginn, effektiveDauer);
  let ersterKreditErschoepft = false;

  rechenweg.push({
    beschreibung: 'Schritt 6 – Letzter bezahlter Tag, 1. Kredit (Lohn ab erstem Tag inkl.)',
    zwischenergebnis:
      (nachKarenz
        ? `Beginn des Anspruchs nach Karenzfrist ${formatDatum(anspruchsBeginn)}`
        : `Beginn der Verhinderung ${formatDatum(vhb)}`) +
      ` + ${formatSkalaDauer(effektiveDauer)} − 1 Tag = ${formatDatum(erstesEnde)}.`,
    normen: [N_324a_2],
  });

  // B3-Fix 10.6.2026 (SHK 324a N 52, deklarierte fachliche Erweiterung —
  // normen/arbeitsrecht-shk-abgleich.md): Das Kontingent gilt PRO Dienstjahr;
  // frühere Absenzen im selben DJ sind zu addieren. Vorher rechnete die Engine
  // jede Verhinderung mit vollem Kredit und wies bei Vorabsenzen zu viel aus.
  const bereitsBezogen = Math.max(0, input.bereitsBezogeneTageImDienstjahr ?? 0);
  if (bereitsBezogen > 0) {
    const kreditTage = skalaDauerTage(effektiveDauer);
    const restTage = Math.max(0, kreditTage - bereitsBezogen);
    ersterKreditErschoepft = restTage === 0;
    erstesEnde = restTage > 0
      ? letzterTagLohnfortzahlung(anspruchsBeginn, { typ: 'tage', anzahl: restTage })
      : addDays(anspruchsBeginn, -1); // kein bezahlter Tag im 1. Kredit
    rechenweg.push({
      beschreibung: 'Schritt 6a – Verrechnung früherer Absenzen im selben Dienstjahr (Art. 324a Abs. 2 OR)',
      zwischenergebnis:
        `Das Kontingent gilt pro Dienstjahr; mehrere Absenzen werden addiert (SHK N 52). ` +
        `Bereits bezogen: ${bereitsBezogen} Tage von ${kreditTage} Tagen (${formatSkalaDauer(effektiveDauer)}) → Rest ${restTage} Tage. ` +
        (ersterKreditErschoepft
          ? `Der Anspruch des laufenden Dienstjahrs ist AUFGEBRAUCHT — im 1. Kredit kein bezahlter Tag mehr.`
          : `Letzter bezahlter Tag des 1. Kredits neu: ${formatDatum(erstesEnde)}.`),
      normen: [N_324a_2],
    });
    annahmen.push(
      'Frühere Absenzen: Die eingegebenen, bereits bezogenen Tage werden 1:1 von der (bei Teil-AUF gestreckten) Kalenderdauer abgezogen; bei unterschiedlichen AUF-Graden der Vorabsenzen ist die Anrechnung im Einzelfall zu prüfen.',
    );
  }

  // ─── Schritt 6b: Dienstjahr-übergreifend – zweiter Kredit (§2.1) ─────

  let letzterTag = erstesEnde;
  let zweiKredite = false;
  let zweitesEnde: Date | null = null;
  let jahrestag: Date | null = null;
  let ersterKreditAnzeigeEnde = erstesEnde;

  if (verhinderungEnde) {
    const ve = parseISO(verhinderungEnde);
    // addYears statt Date-Konstruktor: bei Vertragsbeginn 29.2. fällt der Jahrestag
    // auf den 28.2. (wie differenceInYears in berechneDienstjahr) – kein Monatsüberlauf zum 1.3.
    jahrestag = addYears(vb, dienstjahr);

    if (!isBefore(ve, jahrestag)) {
      // Verhinderung reicht über den Dienstjahres-Stichtag → zweiter (frischer) Kredit.
      const skalaEintrag2 = dauerAusSkala(skala, dienstjahr + 1);
      if (skalaEintrag2) {
        const basisdauer2 = skalaEintrag2.dauer;
        const effektiveDauer2 = arbeitsunfaehigkeitProzent < 100
          ? skaliereSkalaDauer(basisdauer2, arbeitsunfaehigkeitProzent)
          : basisdauer2;
        zweitesEnde = letzterTagLohnfortzahlung(jahrestag, effektiveDauer2);
        zweiKredite = true;
        // Der spätere Endtermin bestimmt das Ende der Lohnfortzahlung (der neue Kredit
        // lebt am Jahrestag frisch auf, auch wenn der alte aufgebraucht war).
        letzterTag = isAfter(zweitesEnde, erstesEnde) ? zweitesEnde : erstesEnde;
        // S3f-10 (RL-25): Anzeige sequenziell wie die Annahme unten — der 1. Kredit
        // deckt höchstens bis zum Vortag des Jahrestags; vorher stand hier das
        // rechnerische Ende des 1. Kredits, das den 2. Kredit überlappte (Enddatum
        // letzterTag war und bleibt unverändert).
        const ersterKreditGekappt = !isBefore(erstesEnde, jahrestag);
        ersterKreditAnzeigeEnde = ersterKreditGekappt ? addDays(jahrestag, -1) : erstesEnde;

        rechenweg.push({
          beschreibung: 'Schritt 6b – Dienstjahr-übergreifende Verhinderung: zweiter Kredit (Art. 324a Abs. 2 OR)',
          zwischenergebnis:
            `Verhinderung reicht über den Jahrestag ${formatDatum(jahrestag)} ins ${dienstjahr + 1}. Dienstjahr. ` +
            `Der Anspruch erneuert sich pro Dienstjahr (SHK N 53): 1. Kredit (${dienstjahr}. DJ) bis ${formatDatum(ersterKreditAnzeigeEnde)}` +
            (ersterKreditGekappt ? ` (Vortag des Jahrestags; der am Jahrestag nicht aufgebrauchte Rest wird nicht zum neuen Kredit addiert)` : '') +
            `, ` +
            `2. Kredit (${dienstjahr + 1}. DJ, ${formatSkalaDauer(effektiveDauer2)}) ab ${formatDatum(jahrestag)} bis ${formatDatum(zweitesEnde)}.`,
          normen: [N_324a_2],
          rechtsprechung: [rechtsprechung('BGer_4A_215_2011')],
        });
        annahmen.push('Beide Dienstjahres-Kredite werden sequenziell entlang des Kalenders zugeteilt (erst alter Kredit bis Jahrestag, dann neuer Kredit) – nicht zu einem Topf summiert (SHK N 53).');
      }
    }

    // Lohnfortzahlung endet spätestens mit dem Ende der Verhinderung (Lohnausfallprinzip).
    if (isBefore(ve, letzterTag)) {
      letzterTag = ve;
      annahmen.push(`Lohnfortzahlung gekappt auf das Ende der Verhinderung (${formatDatum(ve)}); danach kein Lohnausfall.`);
    }
  }

  // B4-Fix 10.6.2026 (SHK 324a N 55, BGE 127 III 318 — deklarierte fachliche
  // Erweiterung): Die Lohnfortzahlungspflicht endet mit der Beendigung des
  // Arbeitsverhältnisses. Vorher gab es keine Kappung aufs AV-Ende.
  let avEndeVorAnspruch: Date | null = null;
  if (input.arbeitsverhaeltnisEnde) {
    const avEnde = parseISO(input.arbeitsverhaeltnisEnde);
    // RL-25b: endet das AV vor dem ersten bezahlten Tag (z. B. noch in der
    // Karenzfrist), entsteht kein Zeitraum — nicht «bis und mit» vor dem Beginn.
    if (isBefore(avEnde, anspruchsBeginn)) avEndeVorAnspruch = avEnde;
    if (isBefore(avEnde, letzterTag)) {
      letzterTag = avEnde;
      rechenweg.push({
        beschreibung: 'Schritt 6c – Kappung auf das Ende des Arbeitsverhältnisses (Art. 324a OR)',
        zwischenergebnis:
          `Die Lohnfortzahlungspflicht endet mit der Beendigung des Arbeitsverhältnisses am ${formatDatum(avEnde)}; ` +
          `der Skala-Anspruch reicht darüber hinaus, wird aber nicht mehr geschuldet.`,
        normen: [N_324a_1],
        rechtsprechung: [rechtsprechung('BGE_127_III_318')],
      });
      warnungen.push(
        'Nach dem Ende des Arbeitsverhältnisses besteht keine Lohnfortzahlung mehr; eine allfällige Krankentaggeld-Versicherung kann abweichend nachdecken (Übertritts-/Nachdeckungsrechte prüfen).',
      );
    }
  }

  // ─── Schritt 7 (optional): Lohnbasis / Geldminimum CHF (§2.3, §2.7) ──

  if (monatslohnBrutto != null && monatslohnBrutto > 0) {
    // RL-25b (rechtslogik-rest-04): Der 13. Monatslohn ist Lohnbestandteil
    // (Art. 324a Abs. 1 OR «den darauf entfallenden Lohn», Lohnausfallprinzip);
    // vorher wirkte die Option nur im Annahmetext, nicht auf den Betrag.
    const mitDreizehntem = input.dreizehnterMonatslohn === true;
    const monatsbasis = mitDreizehntem ? (monatslohnBrutto * 13) / 12 : monatslohnBrutto;
    const tagesansatz = monatsbasis / 30;
    const lohnkreditTage = skalaDauerTage(basisdauer);
    const lohnkreditCHF = lohnkreditTage * tagesansatz;
    rechenweg.push({
      beschreibung: 'Schritt 7 – Lohnbasis und Geldminimum (orientierend, Lohnausfallprinzip)',
      zwischenergebnis:
        `Monatslohn brutto CHF ${monatslohnBrutto.toFixed(2)}` +
        (mitDreizehntem ? ` inkl. 13. Monatslohn anteilig (× 13/12 = CHF ${monatsbasis.toFixed(2)})` : '') +
        ` → Tagesansatz ~CHF ${tagesansatz.toFixed(2)} (Monat = 30 Tage). ` +
        `Geldminimum (primär geschuldet): Skala-Dauer ${formatSkalaDauer(basisdauer)} ≈ ${lohnkreditTage} Tage × CHF ${tagesansatz.toFixed(2)} = ~CHF ${lohnkreditCHF.toFixed(2)} voller Lohn. ` +
        `Die Kalenderdauer ist die abgeleitete Hilfsgrösse. Massgebend ist der Lohn, den der Arbeitnehmer erhalten hätte ` +
        `(Grundlohn, 13. Monatslohn anteilig, regelmässige Zulagen; variable Bestandteile = Durchschnitt; echte Spesen nicht). Bei schwankendem Lohn 12-Monats-Durchschnitt.`,
      normen: [N_324a_1],
    });
    annahmen.push('Lohnbasis: 100 % des vertraglichen Bruttolohns nach Lohnausfallprinzip (SHK Art. 324a N 47–49)' + (mitDreizehntem ? ', inkl. 13. Monatslohn (anteilig, × 13/12).' : '.'));
  }

  annahmen.push(
    'Mehrere Absenzen im gleichen Dienstjahr werden kumuliert; das Skala-Kontingent gilt pro Dienstjahr.',
    nachKarenz
      ? `Karenzfrist: Lohnfortzahlung beginnt am ${formatDatum(anspruchsBeginn)} (erster Tag des vierten Monats), nicht am ersten Tag der Verhinderung; keine weiteren Karenztage.`
      : 'Keine Karenztage: Lohnfortzahlung beginnt ab dem ersten Tag der Verhinderung.',
    'Verschulden: Bei Vorsatz oder grobem Selbstverschulden entfällt der Anspruch ganz (Art. 324a Abs. 1 OR); bei Schwangerschaft, Dienst und öffentlichem Amt ist fehlendes Verschulden keine Voraussetzung.',
  );

  // ─── Schritt 8: Koordination mit obligatorischen Versicherungen (Art. 324b OR) ──
  let koordHinweis = '';
  if (grund === 'unfall') {
    koordHinweis = ' Unfall: UVG-Taggeld 80 % ab dem 3. Tag; Arbeitgeber trägt 80 % des Lohns für die 2 Karenztage (Art. 324b Abs. 3), darüber hinaus von der Lohnfortzahlung befreit, soweit die UVG-Leistungen ≥ 80 % decken (Art. 324b Abs. 1).';
    rechenweg.push({
      beschreibung: 'Schritt 8 – Koordination Unfall (Art. 324b OR / UVG)',
      zwischenergebnis:
        'Bei Unfall ist der Arbeitnehmer obligatorisch UVG-versichert (Taggeld 80 % des versicherten Verdienstes ab dem 3. Tag nach dem Unfall, Höchstlohn beachten). ' +
        'Der Arbeitgeber schuldet 80 % des Lohns für die 2 Karenztage (Art. 324b Abs. 3); im Übrigen ist er von der Lohnfortzahlung befreit, soweit die UVG-Leistungen mindestens 80 % des Lohns decken (Art. 324b Abs. 1). ' +
        'Die nach der Skala bestimmte Dauer bildet das Geld-/Zeitminimum (Art. 324a Abs. 2).',
      normen: [N_324b_1, N_324b_3, N_324a_2],
    });
    warnungen.push('Unfall ohne UVG-Deckung (z.B. < 8 Wochenstunden bei Nichtberufsunfall) oder Lohn über dem UVG-Höchstbetrag: Arbeitgeber zahlt die Differenz zu 80 % bzw. den Lohn nach Skala (Art. 324b Abs. 2).');
    annahmen.push('Unfalltag = eingegebener Beginn der Verhinderung (massgebend für den Taggeldbeginn nach Art. 16 Abs. 2 UVG).');
  } else if (grund === 'dienst') {
    koordHinweis = ' Dienst: Die Erwerbsersatzordnung (EO) entschädigt; deckt sie ≥ 80 %, ist der Arbeitgeber befreit, sonst schuldet er die Differenz zu 80 % (Art. 324b Abs. 1/2).';
    rechenweg.push({
      beschreibung: 'Schritt 8 – Koordination Dienst (Art. 324b OR / EO)',
      zwischenergebnis:
        'Bei obligatorischem Militär-/Zivil-/Schutzdienst entschädigt die EO den Erwerbsausfall. Decken die EO-Leistungen mindestens 80 % des Lohns, ist der Arbeitgeber von der Lohnfortzahlung befreit (Art. 324b Abs. 1); andernfalls schuldet er die Differenz zu 80 % (Art. 324b Abs. 2) für die beschränkte Zeit nach der Skala.',
      normen: [N_324b_1, N_324b_2, N_324a_2],
    });
  } else if (grund === 'schwangerschaft') {
    koordHinweis = ' Schwangerschaft: Lohnfortzahlung im gleichen Umfang (Art. 324a Abs. 3 OR); nach der Niederkunft richtet sich die Entschädigung nach dem EOG (Mutterschaftsentschädigung 80 %, max. 14 Wochen).';
    rechenweg.push({
      beschreibung: 'Schritt 8 – Schwangerschaft (Art. 324a Abs. 3 OR)',
      zwischenergebnis:
        'Bei schwangerschaftsbedingter Arbeitsverhinderung gilt die Lohnfortzahlung im gleichen Umfang wie bei Krankheit (Art. 324a Abs. 3 OR). Nach der Niederkunft greift grundsätzlich das EOG (Mutterschaftsentschädigung, 80 %, längstens 14 Wochen), nicht mehr Art. 324a OR.',
      normen: [N_324a_3],
    });
  } else if (grund === 'amt') {
    rechenweg.push({
      beschreibung: 'Schritt 8 – Öffentliches Amt (Art. 324a Abs. 1 OR)',
      zwischenergebnis: 'Eine für die Amtsausübung bezogene Entschädigung ist an den Lohnfortzahlungsanspruch anzurechnen.',
      normen: [N_324a_1],
    });
  }

  // ─── Ergebnis-Text ───────────────────────────────────────────────────

  const teilAufZusatz = arbeitsunfaehigkeitProzent < 100 ? `, bei ${arbeitsunfaehigkeitProzent} % AUF nach Geldminimum (gestreckt)` : '';
  const kontingentAufgebraucht = (ersterKreditErschoepft && !zweiKredite) || avEndeVorAnspruch != null;
  const karenzZusatz = nachKarenz
    ? `Karenzfrist: kein Lohn vor dem ${formatDatum(anspruchsBeginn)} (erster Tag des vierten Monats; Art. 324a Abs. 1 OR, BGE 131 III 623 E. 2.4). `
    : '';
  // Zeitraum der Skala-Dauer («beschränkte Zeit» i.S.v. Art. 324a Abs. 1/2 und 324b Abs. 1/2 OR).
  const zeitraumSatz = zweiKredite && zweitesEnde && jahrestag
    ? `über Dienstjahreswechsel: 1. Kredit (${dienstjahr}. DJ)${ersterKreditErschoepft ? ' aufgebraucht' : ` bis ${formatDatum(ersterKreditAnzeigeEnde)}`}, ` +
      `2. Kredit (${dienstjahr + 1}. DJ) ab ${formatDatum(jahrestag)} bis und mit ${formatDatum(letzterTag)}${teilAufZusatz}`
    : `${nachKarenz ? `ab ${formatDatum(anspruchsBeginn)} ` : ''}bis und mit ${formatDatum(letzterTag)} (${formatSkalaDauer(effektiveDauer)}${teilAufZusatz})`;

  // RL-25b (rechtslogik-rest-05): Bei Unfall/Dienst deckt eine obligatorische
  // Versicherung; der Arbeitgeber ist befreit, wenn sie ≥ 80 % deckt (Art. 324b
  // Abs. 1 OR), schuldet für eine Wartezeit mindestens 80 % (Abs. 3) und sonst
  // die Differenz zu 80 % für die beschränkte Zeit (Abs. 2). Vorher behauptete
  // die Kopfzeile die volle Skala-Dauer als «Lohnfortzahlung».
  let kopf: string;
  if (avEndeVorAnspruch) {
    kopf = `Kein Anspruch auf Lohnfortzahlung: Das Arbeitsverhältnis endet am ${formatDatum(avEndeVorAnspruch)}, ` +
      (nachKarenz
        ? `vor dem Beginn des Anspruchs am ${formatDatum(anspruchsBeginn)} (Karenzfrist; Art. 324a Abs. 1 OR, BGE 131 III 623 E. 2.4).`
        : `vor dem Beginn der Verhinderung am ${formatDatum(anspruchsBeginn)}.`) + koordHinweis;
  } else if (ersterKreditErschoepft && !zweiKredite) {
    kopf = `Kein Lohnfortzahlungsanspruch mehr: Das Kontingent des ${dienstjahr}. Dienstjahrs (${formatSkalaDauer(effektiveDauer)}) ist durch die bereits bezogenen ${bereitsBezogen} Tage aufgebraucht.` + koordHinweis;
  } else if (grund === 'unfall') {
    const taggeldAb = addDays(vhb, 3); // Art. 16 Abs. 2 UVG: «am dritten Tag nach dem Unfalltag»
    kopf = karenzZusatz +
      (nachKarenz
        ? `Unfall: Die Wartezeit bis zum UVG-Taggeld (ab ${formatDatum(taggeldAb)}, dritter Tag nach dem Unfalltag, Art. 16 Abs. 2 UVG) fällt in die Karenzfrist; ob Art. 324b Abs. 3 OR (mindestens 80 % für die Karenztage) schon vor Entstehen des Anspruchs nach Art. 324a Abs. 1 OR greift, ist im Einzelfall zu prüfen. `
        : `Unfall: Der Arbeitgeber schuldet in der Regel nur mindestens 80 % des Lohns für die Wartezeit (Karenztage) bis zum Beginn des UVG-Taggelds am ${formatDatum(taggeldAb)} (dritter Tag nach dem Unfalltag, Art. 16 Abs. 2 UVG; Art. 324b Abs. 3 OR). `) +
      `Decken die UVG-Leistungen mindestens 80 % des Lohns, ist der Arbeitgeber im Übrigen befreit (Art. 324b Abs. 1 OR); decken sie weniger (z. B. Lohn über dem versicherten Höchstverdienst), ` +
      `schuldet er die Differenz zu 80 % während der beschränkten Zeit nach Skala ${zeitraumSatz} (Art. 324b Abs. 2 OR).`;
  } else if (grund === 'dienst') {
    kopf = karenzZusatz +
      `Dienst: Die Erwerbsersatzordnung (EO) entschädigt den Erwerbsausfall. Deckt sie mindestens 80 % des Lohns, schuldet der Arbeitgeber keinen Lohn (Art. 324b Abs. 1 OR); ` +
      `sonst schuldet er die Differenz zu 80 % während der beschränkten Zeit nach Skala ${zeitraumSatz} (Art. 324b Abs. 2 OR).`;
  } else {
    kopf = karenzZusatz + `Lohnfortzahlung ${zeitraumSatz}.` + koordHinweis;
  }

  const normverweise = [N_324a_1, N_324a_2, N_324a_3, N_324a_4, N_362];
  if (grund === 'unfall' || grund === 'dienst') normverweise.push(N_324b, N_324b_1, N_324b_2, N_324b_3);

  return {
    ergebnis: kopf,
    status: kontingentAufgebraucht ? 'kein_anspruch' : 'ok',
    rechenweg,
    annahmen,
    warnungen,
    normverweise,
    zeitraumVonISO: kontingentAufgebraucht ? undefined : formatISO(anspruchsBeginn),
    letzterTagISO: kontingentAufgebraucht ? undefined : formatISO(letzterTag),
  };
}
