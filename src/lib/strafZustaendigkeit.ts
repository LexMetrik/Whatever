// Dossier: bibliothek/normen/stpo-zustaendigkeit-regelwerk.md
// ─── StPO-Zuständigkeits-Engine (Rechtsweg «Straf») ─────────────────────────
//
// Eigene Engine analog Zivil/SchKG (§4: keine Fusion). Quelle:
// bibliothek/normen/stpo-zustaendigkeit-regelwerk.md (Wortlaute verbatim am
// Cache /tmp/stpo.html, Stand 1.1.2024) — Decision Tree Stufen 0–8 +
// 22-Zeilen-Konstellationstabelle. Anzeige-Fahrplan: Art. 301 StPO und
// Art. 31 StGB (3-Monats-Antragsfrist) am 6.6.2026 verbatim verifiziert.
// Rein und deterministisch (§2). Die konkrete Behörde liefert die
// Datenschicht (src/data/staatsanwaltschaften.ts), hier nur Bundesrecht.
// Vertieft am 6.6.2026 nach Oberholzer, Grundzüge des Strafprozessrechts,
// 5. Aufl. 2026, N 239–330 (Auftrag David; Regeln paraphrasiert, norm-
// gestützte Punkte am Cache verifiziert; Praxis-Aussagen als «(Praxis)»
// markiert — Belege in bibliothek/normen/stpo-zustaendigkeit-regelwerk.md).

import type { Berechnungsergebnis } from '../types/legal';

export type StrafSpezialforum = 'kein' | 'medien' | 'schkg_delikt' | 'unternehmen' | 'einziehung';
export type StrafTatortLage = 'bekannt' | 'nur_erfolgsort' | 'mehrere_orte' | 'ausland_oder_ungewiss';
export type StrafKaskade32 = 'wohnsitz' | 'aufenthalt' | 'heimatort' | 'ergreifungsort' | 'auslieferung';
export type StrafBeteiligung = 'allein' | 'teilnehmer' | 'mittaeter';

export interface StrafInput {
  anliegen: 'anzeige' | 'gerichtsstand';
  /** Weiche, keine Subsumtion: Katalog-Delikte Art. 23/24 StPO (z. B.
   *  Sprengstoff, organisiertes Verbrechen, qualifizierte Wirtschaftsfälle). */
  moeglichesBundesdelikt?: boolean;
  spezialforum?: StrafSpezialforum;
  tatort: StrafTatortLage;
  kaskade32?: StrafKaskade32;
  beteiligung?: StrafBeteiligung;
  mehrereTatenVerschOrte?: boolean;
  antragsdelikt?: boolean;
  uebertretung?: boolean;
  beschuldigteMinderjaehrig?: boolean;
}

export interface StrafNorm { artikel: string; bemerkung?: string }
interface StrafSchritt { titel: string; text: string }
export interface StrafFrist { label: string; frist: string; norm: string; kritisch: boolean }

export interface StrafErgebnis {
  forum: { text: string; normen: StrafNorm[] };
  behoerdeTyp: string;
  fahrplan: StrafSchritt[];
  fristen: StrafFrist[];
  warnungen: string[];
  weichen: string[];
  normverweise: StrafNorm[];
}

// Kaskade exakt nach Art. 32: Abs. 1 = Wohnsitz ODER gewöhnlicher Aufenthalt
// (gleichrangig!), Abs. 2 = Heimatort → Ergreifungsort, Abs. 3 = Auslieferungs-
// kanton. (Abschluss-Review 6.6.2026: der gewöhnliche Aufenthalt fehlte.)
const KASKADE_TEXT: Record<StrafKaskade32, { text: string; stufe: string }> = {
  wohnsitz: { text: 'am WOHNSITZ der beschuldigten Person', stufe: 'Abs. 1' },
  aufenthalt: { text: 'am Ort des GEWÖHNLICHEN AUFENTHALTS der beschuldigten Person (gleichrangig zum Wohnsitz)', stufe: 'Abs. 1' },
  heimatort: { text: 'am HEIMATORT der beschuldigten Person (weder Wohnsitz noch gewöhnlicher Aufenthalt in der Schweiz)', stufe: 'Abs. 2' },
  ergreifungsort: { text: 'am ORT DER ERGREIFUNG (auch kein Heimatort in der Schweiz)', stufe: 'Abs. 2' },
  auslieferung: { text: 'im AUSLIEFERUNGSKANTON (Ergreifung im Ausland)', stufe: 'Abs. 3' },
};

export function bestimmeStrafZustaendigkeit(input: StrafInput): StrafErgebnis {
  const warnungen: string[] = [];
  const weichen: string[] = [];
  const normverweise: StrafNorm[] = [];
  const fristen: StrafFrist[] = [];
  const fahrplan: StrafSchritt[] = [];
  const spezial = input.spezialforum ?? 'kein';

  // RL-42 (Z1-01/Z1-02, Prüfung Rechtslogik 23.9.2026): Jugendstrafverfahren.
  // JStPO SR 312.1, Fassung 1.7.2025 (Fedlex-Filestore eli/cc/2010/226/
  // 20250701, de-xml-3, abgerufen 25.9.2026), Wortlaute:
  // Art. 10 Abs. 1: «Für die Strafverfolgung ist die Behörde des Ortes
  //   zuständig, an dem die oder der beschuldigte Jugendliche bei Eröffnung
  //   des Verfahrens den gewöhnlichen Aufenthalt hat. Für die Strafverfolgung
  //   im Bereich des Ordnungsbussenverfahrens ist die Behörde des Ortes
  //   zuständig, an dem die Straftat begangen worden ist.»
  // Art. 3 Abs. 2: «Nicht anwendbar sind die Bestimmungen der StPO über:
  //   a. die Übertretungsstrafbehörden und das Übertretungsstrafverfahren
  //   (Art. 17 und 357); b. die Bundesgerichtsbarkeit (Art. 23–28); c. den
  //   Gerichtsstand (Art. 31 und 32) und die besonderen Gerichtsstände im
  //   Falle mehrerer Beteiligter (Art. 33) und bei mehreren an verschiedenen
  //   Orten verübten Straftaten (Art. 34); …»
  // Vorher: Hauptergebnis Tatort (Art. 31 StPO) + Staatsanwaltschaft, die
  // richtige Regel nur in einer Warnung (mit falschem «Übertretungen:
  // Begehungsort» statt Ordnungsbussenverfahren).
  const jugend = input.beschuldigteMinderjaehrig === true;

  // ── Stufe 0 · Bundesgerichtsbarkeit (Weiche, keine Subsumtion) ─────────────
  if (input.moeglichesBundesdelikt && jugend) {
    warnungen.push('Im JUGENDSTRAFVERFAHREN gelten die Bestimmungen über die Bundesgerichtsbarkeit (Art. 23–28 StPO) NICHT (Art. 3 Abs. 2 lit. b JStPO) — zuständig bleibt die kantonale Jugendstrafbehörde nach Art. 10 JStPO.');
    normverweise.push({ artikel: 'Art. 3 JStPO' });
  } else if (input.moeglichesBundesdelikt) {
    warnungen.push('Möglicher Fall von BUNDESGERICHTSBARKEIT: Art. 23 StPO (u. a. Sprengstoff, Völkerstrafrecht, Delikte gegen den Bund) gilt ZWINGEND; Art. 24 Abs. 1 (kriminelle Organisation, Terrorismusfinanzierung, Geldwäscherei, Bestechung u. a.) setzt zusätzlich voraus, dass die Taten zu einem WESENTLICHEN Teil im Ausland oder in MEHREREN Kantonen ohne eindeutigen Schwerpunkt begangen wurden. Bei Vermögens-/Urkundenverbrechen kann die Bundesanwaltschaft fakultativ übernehmen, wenn keine kantonale Behörde befasst ist oder diese um Übernahme ersucht (Abs. 2; die Eröffnung begründet die Zuständigkeit, Abs. 3). Delegation an die Kantone bleibt möglich (Art. 25 — ausser Völkerstrafrecht); Konflikte entscheidet das Bundesstrafgericht (Art. 28), und die Einrede der fehlenden sachlichen Zuständigkeit ist nach der Beurteilung VERWIRKT (Praxis). Im Zweifel nimmt jede Strafverfolgungsbehörde die Anzeige entgegen und leitet weiter (Art. 39 StPO).');
    normverweise.push({ artikel: 'Art. 23 StPO' }, { artikel: 'Art. 24 StPO' });
  }

  // ── Stufen 1–4 · Forum ─────────────────────────────────────────────────────
  let forumText: string;
  const forumNormen: StrafNorm[] = [];
  if (spezial === 'medien') {
    forumText = 'Bei Medienstraftaten (Art. 28 StGB): Behörden am SITZ DES MEDIENUNTERNEHMENS; ist die Autorin/der Autor bekannt mit Wohnsitz oder gewöhnlichem Aufenthalt in der Schweiz, KONKURRIEREND auch dort; fehlen beide Anknüpfungen: am Verbreitungsort (bei mehreren: forum praeventionis)';
    forumNormen.push({ artikel: 'Art. 35 StPO' });
  } else if (spezial === 'schkg_delikt') {
    forumText = 'Bei Konkurs- und Betreibungsdelikten (Art. 163–171 StGB): Behörden am WOHNSITZ, am gewöhnlichen AUFENTHALTSORT oder am SITZ der Schuldnerin/des Schuldners; bei bloss fiktivem Geschäftssitz zählt der tatsächliche Geschäfts- bzw. Wohnsitz (Praxis)';
    forumNormen.push({ artikel: 'Art. 36 Abs. 1 StPO' });
  } else if (spezial === 'unternehmen') {
    forumText = 'Bei Unternehmensstrafbarkeit (Art. 102 StGB): Behörden am SITZ DES UNTERNEHMENS — das Forum gilt auch, wenn sich das Verfahren wegen desselben Sachverhalts zugleich gegen natürliche Personen richtet (die Verfahren KÖNNEN vereinigt werden — Kann-Vorschrift, Art. 112 Abs. 4 StPO). Vorfrage der Praxis: Art. 102 greift nur, wenn die Tat wegen mangelhafter Organisation keiner natürlichen Person zugerechnet werden kann';
    forumNormen.push({ artikel: 'Art. 36 Abs. 2 StPO' });
  } else if (spezial === 'einziehung') {
    forumText = 'Bei selbstständiger Einziehung: Behörden am ORT, WO SICH DIE EINZUZIEHENDEN GEGENSTÄNDE/VERMÖGENSWERTE BEFINDEN; bei mehreren Kantonen entscheidet die zuerst eröffnete Untersuchung';
    forumNormen.push({ artikel: 'Art. 37 StPO' });
  } else if (jugend) {
    forumText = 'JUGENDSTRAFVERFAHREN: zuständig ist die Behörde des Ortes, an dem die beschuldigte jugendliche Person bei ERÖFFNUNG des Verfahrens ihren GEWÖHNLICHEN AUFENTHALT hat — nicht der Tatort; die Gerichtsstände der Art. 31–34 StPO gelten nicht (Art. 3 Abs. 2 lit. c JStPO). Ausnahme: im ORDNUNGSBUSSENVERFAHREN die Behörde des Tatorts (Art. 10 Abs. 1 Satz 2 JStPO). Fehlt ein gewöhnlicher Aufenthalt in der Schweiz: bei Taten im Inland die Behörde des Tatorts, bei Taten im Ausland die Behörde des Heimatortes bzw. bei ausländischen Jugendlichen die Behörde des Ortes der ersten Anhaltung (Art. 10 Abs. 2 JStPO). Die Behörde des Tatorts nimmt die dringend notwendigen Ermittlungshandlungen vor (Art. 10 Abs. 3 JStPO)';
    forumNormen.push({ artikel: 'Art. 10 Abs. 1 JStPO' });
  } else if (input.tatort === 'bekannt') {
    forumText = 'GRUNDSATZ TATORT: zuständig sind die Behörden des Ortes, an dem die Tat VERÜBT worden ist (Begehungsort)';
    forumNormen.push({ artikel: 'Art. 31 Abs. 1 StPO' });
  } else if (input.tatort === 'nur_erfolgsort') {
    forumText = 'Liegt nur der ERFOLG der Tat in der Schweiz (oder ist der Handlungsort nicht ermittelbar), sind die Behörden des ERFOLGSORTES zuständig — vorausgesetzt, es handelt sich um ein Erfolgs- oder konkretes Gefährdungsdelikt und der Erfolgsort ist bekannt (Praxis)';
    forumNormen.push({ artikel: 'Art. 31 Abs. 1 StPO', bemerkung: 'Satz 2' });
  } else if (input.tatort === 'mehrere_orte') {
    forumText = 'Tat an MEHREREN Orten verübt (oder Erfolg an mehreren Orten eingetreten): zuständig sind die Behörden des Ortes, an dem die ERSTEN VERFOLGUNGSHANDLUNGEN vorgenommen wurden (Prioritätsprinzip / forum praeventionis). Als Verfolgungshandlung zählt jede Ermittlungsmassnahme gegen bekannte oder unbekannte Täterschaft — schon die polizeiliche Befragung oder der Eingang einer nicht offensichtlich haltlosen Anzeige; blosse Personenkontrollen genügen nicht (Praxis)';
    forumNormen.push({ artikel: 'Art. 31 Abs. 2 StPO' });
  } else {
    const k = KASKADE_TEXT[input.kaskade32 ?? 'wohnsitz'];
    forumText = `Tat im AUSLAND oder Tatort NICHT feststellbar — Kaskade des Art. 32 StPO (${k.stufe}): ${k.text}`;
    forumNormen.push({ artikel: 'Art. 32 StPO' });
  }

  // ── Stufe 3 · Beteiligung ──────────────────────────────────────────────────
  // Jugend: Art. 33/34 StPO gelten nicht (Art. 3 Abs. 2 lit. c JStPO) — die
  // Anknüpfung bleibt je Jugendlichem Art. 10 JStPO; Art. 11 JStPO trennt
  // die Verfahren gegen Erwachsene und Jugendliche.
  if (jugend) {
    if ((input.beteiligung ?? 'allein') !== 'allein' || input.mehrereTatenVerschOrte) {
      weichen.push('Die besonderen Gerichtsstände bei mehreren Beteiligten (Art. 33 StPO) und bei mehreren an verschiedenen Orten verübten Taten (Art. 34 StPO) gelten im JUGENDSTRAFVERFAHREN NICHT (Art. 3 Abs. 2 lit. c JStPO) — massgeblich bleibt der gewöhnliche Aufenthalt der jugendlichen Person (Art. 10 JStPO).');
    }
  } else if ((input.beteiligung ?? 'allein') === 'teilnehmer') {
    weichen.push('Teilnehmende (Anstiftung/Gehilfenschaft) werden von DENSELBEN Behörden verfolgt wie die Täterschaft — das Forum der Haupttat zieht (Art. 33 Abs. 1 StPO).');
    normverweise.push({ artikel: 'Art. 33 StPO' });
  } else if (input.beteiligung === 'mittaeter') {
    if (input.mehrereTatenVerschOrte) {
      weichen.push('Mittäterschaft UND mehrere Taten an verschiedenen Orten: Art. 33 Abs. 2 und Art. 34 Abs. 1 StPO werden kombiniert — alle Beteiligten werden dort verfolgt, wo ein Mittäter die mit der SCHWERSTEN Strafe bedrohte Tat verübt hat; bei gleicher Strafdrohung gilt das Prioritätsprinzip; hat noch kein Kanton Verfolgungshandlungen vorgenommen und fehlt ein Schwergewicht, zählt der Ort des ERSTEN Delikts (Praxis).');
    } else {
      weichen.push('Bei Mittäterschaft: zuständig sind die Behörden des Ortes, an dem die ERSTEN Verfolgungshandlungen vorgenommen wurden (Art. 33 Abs. 2 StPO).');
    }
    normverweise.push({ artikel: 'Art. 33 StPO' });
  }

  // ── Stufe 4 · Mehrere Taten ────────────────────────────────────────────────
  if (input.mehrereTatenVerschOrte && !jugend) {
    weichen.push('Mehrere Taten an verschiedenen Orten: zuständig sind die Behörden des Ortes der mit der SCHWERSTEN STRAFE bedrohten Tat — massgeblich ist die abstrakte HÖCHSTSTRAFE (qualifizierte/privilegierte Tatbestände zählen, nicht Strafzumessungsgründe; bei gleicher Höchststrafe die Mindeststrafe; das vollendete Delikt geht dem Versuch vor); bei gleicher Strafdrohung gilt das Prioritätsprinzip (Art. 34 Abs. 1 StPO). Ist in einem Kanton bereits Anklage erhoben oder liegt eine rechtskräftige Erledigung vor, werden die Verfahren GETRENNT geführt (Abs. 2; blosse Sistierung oder Einsprache gegen einen Strafbefehl beendet das Vorverfahren NICHT — Praxis).');
    weichen.push('ABGRENZUNG: Bilden die Einzelhandlungen eine natürliche Handlungseinheit (ein einheitlicher Deliktserfolg), liegt KEINE Tatmehrheit vor — dann gilt die Grundregel des Art. 31 StPO (Praxis). Wer entgegen der Vereinigungsregel von verschiedenen Gerichten zu mehreren gleichartigen Strafen verurteilt wurde, kann beim Gericht der schwersten Strafe die nachträgliche GESAMTSTRAFE verlangen (Art. 34 Abs. 3 StPO).');
    normverweise.push({ artikel: 'Art. 34 StPO' });
  }

  // ── Verfahrenseinheit (Art. 29/30) — bei Beteiligung/Tatmehrheit ──────────
  if ((input.beteiligung ?? 'allein') !== 'allein' || input.mehrereTatenVerschOrte) {
    weichen.push('GRUNDSATZ DER VERFAHRENSEINHEIT: Straftaten werden gemeinsam verfolgt und beurteilt (Art. 29 Abs. 1 StPO). Eine Trennung ist nur ausnahmsweise aus objektiven sachlichen Gründen zulässig (Art. 30 StPO) — es gilt ein strenger Massstab; organisatorische Gründe, Ausstand oder das blosse Vorhaben eines abgekürzten Verfahrens genügen NICHT, und die Trennung beschneidet die Teilnahmerechte erheblich (Praxis).');
    normverweise.push({ artikel: 'Art. 29 StPO' }, { artikel: 'Art. 30 StPO' });
  }

  // ── Jugendliche (Art. 10 JStPO) — eigener Anknüpfungspunkt ────────────────
  // Art. 11 JStPO: «1 Verfahren gegen Erwachsene und Jugendliche werden
  // getrennt geführt. 2 Auf die Trennung kann ausnahmsweise verzichtet werden,
  // wenn die Untersuchung durch die Trennung erheblich erschwert würde.»
  if (jugend) {
    weichen.push('Verfahren gegen Erwachsene und Jugendliche werden GETRENNT geführt; auf die Trennung kann nur ausnahmsweise verzichtet werden, wenn die Untersuchung sonst erheblich erschwert würde (Art. 11 JStPO).');
    if (spezial !== 'kein') {
      warnungen.push('Spezialforum bei einer minderjährigen beschuldigten Person: Art. 3 Abs. 2 lit. c JStPO schliesst nur die Gerichtsstände der Art. 31–34 StPO aus; ob die Spezialgerichtsstände der Art. 35–37 StPO dem Art. 10 JStPO (gewöhnlicher Aufenthalt) vorgehen, regelt das Gesetz nicht ausdrücklich — im Einzelfall prüfen.');
    }
    normverweise.push({ artikel: 'Art. 10 JStPO' }, { artikel: 'Art. 3 JStPO' }, { artikel: 'Art. 11 JStPO' });
  }

  // ── Stufen 5–8 · Verfahrens-Weichen (immer offenlegen) ─────────────────────
  weichen.push('Die Staatsanwaltschaften können einvernehmlich ein ABWEICHENDES Forum vereinbaren, wenn der Schwerpunkt der Tat, die persönlichen Verhältnisse oder andere triftige Gründe es nahelegen (Art. 38 Abs. 1 StPO).');
  weichen.push('Parteien können die Verletzung der Gerichtsstandsregeln rügen: zuerst Antrag auf Überweisung, dann BESCHWERDE innert 10 Tagen an die Behörde nach Art. 40 StPO (Art. 41 StPO). Interkantonale Konflikte entscheidet die Beschwerdekammer des Bundesstrafgerichts (Art. 40 Abs. 2 StPO).');
  weichen.push('Ist der Gerichtsstand nach Art. 38–41 festgelegt, wird daran festgehalten (perpetuatio fori); eine Änderung braucht NEUE wichtige Gründe und ist nur VOR der Anklageerhebung möglich (Art. 42 Abs. 3 StPO).');
  normverweise.push(...forumNormen, { artikel: 'Art. 38 StPO' }, { artikel: 'Art. 41 StPO' }, { artikel: 'Art. 42 StPO' });

  // ── Behördentyp ────────────────────────────────────────────────────────────
  // Art. 6 Abs. 2 JStPO: «Die Kantone bezeichnen als Untersuchungsbehörde:
  // a. eine oder mehrere Jugendrichterinnen oder einen oder mehrere
  // Jugendrichter; oder b. eine oder mehrere Jugendanwältinnen oder einen
  // oder mehrere Jugendanwälte.» Art. 17/357 StPO gelten nicht (Art. 3 Abs. 2
  // lit. a JStPO) — darum im Jugendfall keine Übertretungsstrafbehörde.
  const behoerdeTyp = jugend
    ? 'UNTERSUCHUNGSBEHÖRDE der Jugendstrafrechtspflege des Forum-Kantons — je nach kantonaler Organisation Jugendrichterin/Jugendrichter oder Jugendanwältin/Jugendanwalt (Art. 6 Abs. 2 JStPO); die Übertretungsstrafbehörden der StPO sind nicht anwendbar (Art. 3 Abs. 2 lit. a JStPO)'
    : input.uebertretung
    ? 'Staatsanwaltschaft bzw. ÜBERTRETUNGSSTRAFBEHÖRDE (in Kantonen mit Verwaltungsbehörden nach Art. 17 StPO — diese haben die Befugnisse der Staatsanwaltschaft, Art. 357 StPO)'
    : 'Staatsanwaltschaft des Forum-Kantons (Untersuchung und Anklage, Art. 16 StPO)';
  if (jugend) normverweise.push({ artikel: 'Art. 6 JStPO' });
  else if (input.uebertretung) normverweise.push({ artikel: 'Art. 17 StPO' }, { artikel: 'Art. 357 StPO' });

  // ── Fahrplan + Fristen ─────────────────────────────────────────────────────
  if (spezial === 'medien' && input.antragsdelikt) {
    weichen.push('Medien-Antragsdelikt: Die antragstellende Person hat die WAHL zwischen den konkurrierenden Gerichtsständen (Sitz des Medienunternehmens / Wohnsitz bzw. gewöhnlicher Aufenthalt der Autorin/des Autors) — Art. 35 Abs. 2 StPO.');
  }

  if (input.anliegen === 'anzeige') {
    fahrplan.push(
      { titel: 'Strafanzeige erstatten — formfrei', text: 'Jede Person kann Straftaten bei einer STRAFVERFOLGUNGSBEHÖRDE schriftlich oder mündlich anzeigen (Art. 301 Abs. 1 StPO) — bei der Polizei oder direkt bei der Staatsanwaltschaft; für die mündliche Anzeige kann eine Protokoll-Bestätigung verlangt werden (Abs. 1bis).' },
      { titel: 'Örtlich: an die Behörden des Forums', text: 'Massgeblich ist das oben bestimmte Forum — die Anzeige kann aber bei JEDER Strafverfolgungsbehörde eingereicht werden; sie leitet an die zuständige Stelle weiter (Art. 39 StPO).' },
      { titel: 'Bei Antragsdelikten: Strafantrag stellen', text: 'Der Strafantrag ist ausdrücklich zu stellen (Art. 304 StPO); ohne gültigen Antrag wird bei Antragsdelikten nicht verfolgt (Art. 30 StGB).' },
    );
    if (input.antragsdelikt) {
      fristen.push({ label: 'Strafantragsfrist', frist: '3 Monate ab dem Tag, an dem die antragsberechtigte Person den Täter kennt', norm: 'Art. 31 StGB', kritisch: true });
    }
    fahrplan.push({ titel: 'Parteistellung prüfen', text: `Wer durch die Tat unmittelbar verletzt ist, kann sich bis zum Abschluss des Vorverfahrens als PRIVATKLÄGERSCHAFT konstituieren (Straf- und/oder Zivilklage, Art. 118 f. StPO) — sonst nur Anzeigeperson ohne Verfahrensrechte (Art. 301 Abs. 3 StPO).${jugend ? ' Im Jugendstrafverfahren nimmt die Privatklägerschaft an der Untersuchung nur teil, wenn dies den Interessen der beschuldigten jugendlichen Person nicht zuwiderläuft, und an der Hauptverhandlung nur bei besonderen Umständen (Art. 20 JStPO).' : ''}` });
  } else {
    // M-6-Fix Bug-Check 6.6.2026: Die verwirkende 10-Tage-Beschwerdefrist
    // stand nur als Prosa in der Weiche — anders als die Strafantragsfrist
    // (Art. 31 StGB) fehlte sie im fristen[]-Array und damit in der UI-
    // Fristenliste. Wortlaut am Fedlex-Cache verifiziert: «…können sich die
    // Parteien innert 10 Tagen bei der nach Artikel 40 zum Entscheid über
    // den Gerichtsstand zuständigen Behörde beschweren» (Art. 41 Abs. 2 StPO).
    // Verortet im Gerichtsstands-Strang: die Frist läuft erst ab einer
    // Gerichtsstands-Entscheidung der Staatsanwaltschaften (Art. 39 Abs. 2).
    fristen.push({ label: 'Beschwerde gegen die Gerichtsstands-Entscheidung der Staatsanwaltschaften (Art. 39 Abs. 2)', frist: '10 Tage an die Behörde nach Art. 40 StPO', norm: 'Art. 41 Abs. 2 StPO', kritisch: true });
    fahrplan.push(
      jugend
        ? { titel: 'Forum im Jugendstrafverfahren bestimmen', text: 'Massgeblich ist der gewöhnliche Aufenthalt der jugendlichen Person bei Eröffnung des Verfahrens (Art. 10 Abs. 1 JStPO) — nicht der Tatort; Art. 31–34 StPO gelten nicht (Art. 3 Abs. 2 lit. c JStPO). Kompetenzkonflikte zwischen den Kantonen entscheidet das Bundesstrafgericht (Art. 10 Abs. 7 JStPO).' }
        : { titel: 'Forum nach der Kaskade bestimmen', text: 'Spezialforen (Art. 35–37) vor Grundsatz Tatort (Art. 31), dann Kaskade (Art. 32) — Beteiligung (Art. 33) und Tatmehrheit (Art. 34) verschieben das Forum. Massgeblich ist die VERDACHTSLAGE im Entscheidzeitpunkt (nicht das später Beweisbare); im Zweifel zählt das schwerere Delikt («in dubio pro duriore», Praxis).' },
      { titel: 'Bei Streit: Einigung → Entscheid', text: 'Die beteiligten Staatsanwaltschaften prüfen die Zuständigkeit von Amtes wegen und klären sie im (informellen) Meinungsaustausch (Art. 39); scheitert die Einigung, entscheidet innerkantonal die Ober-/Generalstaatsanwaltschaft — ihr Entscheid ist seit der Revision 2022 nicht mehr als endgültig bezeichnet — nach der Lehre damit beschwerdefähig (Art. 40 Abs. 1; Praxis) —, interkantonal die Beschwerdekammer des Bundesstrafgerichts: Gesuch des zuerst befassten Kantons unverzüglich, jedenfalls VOR der Anklage; Praxis-Frist 10 Tage nach gescheitertem Austausch, hohe Begründungsanforderungen; der BStGer-Entscheid ist ABSCHLIESSEND (keine Beschwerde ans Bundesgericht).' },
      { titel: 'Festhalten und Grenzen', text: 'Wer trotz Klärungsanlass lange weiterermittelt oder untätig bleibt, anerkennt den Gerichtsstand KONKLUDENT (Praxis). Verhaftete werden anderen Kantonen erst nach verbindlicher Bestimmung zugeführt (Art. 42 Abs. 2); der einmal festgelegte Gerichtsstand kann nur vor der Anklage und nur bei erheblichen NEUEN Tatsachen oder triftigen Gründen geändert werden (Art. 42 Abs. 3).' },
    );
  }

  return { forum: { text: forumText, normen: forumNormen }, behoerdeTyp, fahrplan, fristen, warnungen, weichen, normverweise };
}

// ── Abbildung in das einheitliche Berichts-Format (G3.1 / M-8, 10.6.2026):
// reine Darstellungs-Abbildung für PDF/Anzeige — alle Texte stammen
// unverändert aus dem StrafErgebnis (§3/§5).
export function strafZustaendigkeitBericht(r: StrafErgebnis): Berechnungsergebnis {
  return {
    ergebnis: r.forum.text,
    status: 'ok',
    rechenweg: [
      { beschreibung: 'Zuständiges Forum', zwischenergebnis: `${r.forum.text} (${r.behoerdeTyp})`, normen: r.forum.normen },
      ...r.fristen.map((f) => ({
        beschreibung: `Frist: ${f.label}${f.kritisch ? ' (Verwirkung)' : ''}`,
        zwischenergebnis: `${f.frist} (${f.norm})`,
        normen: [],
      })),
      ...r.fahrplan.map((s) => ({ beschreibung: s.titel, zwischenergebnis: s.text, normen: [] })),
    ],
    annahmen: [],
    warnungen: [...r.weichen, ...r.warnungen],
    normverweise: r.normverweise,
  };
}
