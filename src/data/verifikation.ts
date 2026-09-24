import type { Rechtsprechungshinweis } from '../types/legal';

// ─── Zentrales Verifikations-Register (§5.3) ──────────────────────────────
//
// Einzige Quelle für alle Rechtsprechungs-Aktenzeichen. Kein Aktenzeichen darf
// im Code auftauchen, das hier nicht registriert ist. Standard: verifiziert=false,
// bis der Verweis gegen die amtliche Sammlung (BGE) bzw. das BGer-Urteil geprüft
// wurde. Keine neuen Aktenzeichen erfinden.

export type VerifikationsEintrag = {
  aktenzeichen: string;
  aussage: string;
  /**
   * FACHLICHE ABNAHME durch David (§7). Wird NIE automatisch gesetzt — auch
   * dann nicht, wenn eine Session den Entscheidtext gelesen und die Aussage
   * am Wortlaut bestätigt hat. Dafür gibt es `quelleGeprueft`.
   */
  verifiziert: boolean;
  /**
   * EMPIRISCHE QUELLENPRÜFUNG (§7 «Normen verifizieren, nicht vertrauen»):
   * eine Session hat den amtlichen Entscheidtext abgerufen und geprüft, dass er
   * die hier registrierte `aussage` trägt. Wert = Fundstelle + Datum, z. B.
   * «Session 3.8.2026, E. 3.5.5 und E. 3.6, Urteil vom 17.1.2025». KEINE
   * Geschäftsnummern in dieses Feld (oder in Kommentare dieser Datei): der
   * Register-Generator inventarisiert jedes Aktenzeichen unter src/ und meldete
   * sie sonst als unregistrierte Lücke. Geschäftsnummern gehören ins Dossier.
   *
   * Das ist AUSDRÜCKLICH NICHT die fachliche Abnahme: geprüft ist, DASS der
   * Entscheid das sagt — nicht, ob die Aussage für die Werkzeuge richtig
   * eingeordnet und formuliert ist. Beide Stufen stehen getrennt im
   * Rechtsprechungs-Register (§8: den echten Prüfungsstand zeigen).
   */
  quelleGeprueft?: string;
};

export const VERIFIKATION: Record<string, VerifikationsEintrag> = {
  // Lohnfortzahlung (Art. 324a OR)
  BGE_131_III_623: {
    aktenzeichen: 'BGE 131 III 623',
    aussage:
      'Karenzfrist/Anspruch: Bei Kündigungsfrist ≤ 3 Monaten entsteht der Anspruch erst ab dem ersten Tag des vierten Monats.',
    verifiziert: false,
  },
  BGer_4A_215_2011: {
    aktenzeichen: 'BGer 4A_215/2011',
    aussage: 'Lohnfortzahlungsanspruch erneuert sich pro Dienstjahr.',
    verifiziert: false,
  },
  BGE_135_III_640: {
    aktenzeichen: 'BGE 135 III 640',
    aussage: 'Gleichwertigkeitsmassstab bei Krankentaggeldversicherung (Art. 324a Abs. 4 OR).',
    verifiziert: false,
  },
  // Nachregistrierung 10.6.2026 (SHK-Abgleich B4, normen/arbeitsrecht-shk-abgleich.md):
  BGE_127_III_318: {
    aktenzeichen: 'BGE 127 III 318',
    aussage: 'Die Lohnfortzahlungspflicht nach Art. 324a OR endet mit der Beendigung des Arbeitsverhältnisses.',
    verifiziert: false,
  },

  // Kündigungsfrist (Art. 335c OR)
  BGE_131_III_467: {
    aktenzeichen: 'BGE 131 III 467',
    aussage:
      'Massgeblich ist der Zugang der Kündigung; Gegenmeinung zum Fristbeginn (Frist läuft ab Zustellung).',
    verifiziert: false,
  },
  BGE_134_III_354: {
    aktenzeichen: 'BGE 134 III 354',
    aussage:
      'Zugangs-/Empfangsprinzip; Rückrechnung der Kündigungsfrist vom Endtermin.',
    verifiziert: false,
  },
  BGE_115_V_437: {
    aktenzeichen: 'BGE 115 V 437',
    aussage:
      'Rückrechnung vom Endtermin; Abgrenzung Kündigungsfrist-Verlängerung (Hemmung) von der Lohnfortzahlung.',
    verifiziert: false,
  },

  // Sperrfristen (Art. 336c OR)
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_133_III_517: {
    aktenzeichen: 'BGE 133 III 517',
    aussage:
      'Dienstjahreswechsel während laufender Sperrfrist: längere Sperrfrist ab erstem AUF-Tag, alte Tage angerechnet.',
    verifiziert: false,
  },
  BGE_124_III_474: {
    aktenzeichen: 'BGE 124 III 474',
    aussage:
      'Neue Arbeitsunfähigkeit in der Erstreckungsphase (Abs. 3) löst keine neue Sperrfrist aus.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_120_II_124: {
    aktenzeichen: 'BGE 120 II 124',
    aussage:
      'Gleichartiger Grund derselben Ursache (Rückfall) löst nur eine Sperrfrist aus («aucun lien»).',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_143_III_21: {
    aktenzeichen: 'BGE 143 III 21',
    aussage: 'Schwangerschaftsbeginn (Befruchtung) als Anfangstag der Sperrfrist.',
    verifiziert: false,
  },

  // Verzugszins (Art. 104 OR) – Präjudizienbuch OR, Art. 104
  BGE_130_III_591: {
    aktenzeichen: 'BGE 130 III 591',
    aussage: 'Verzugszinspflicht setzt Fälligkeit und Inverzugsetzung voraus; kein Schaden-/Verschuldensnachweis nötig.',
    verifiziert: false,
  },
  BGer_4A_514_2007: {
    aktenzeichen: 'BGer 4A_514/2007',
    aussage: 'Zinsen wachsen linear auf dem Kapital; keine Zinseszinsen, auch nicht im Prozess.',
    verifiziert: false,
  },
  BGer_4A_282_2017: {
    aktenzeichen: 'BGer 4A_282/2017',
    aussage: 'Bei Klageeinleitung läuft der Verzugszins ab Zustellung der Klage/Widerklage.',
    verifiziert: false,
  },
  BGer_4A_58_2019: {
    aktenzeichen: 'BGer 4A_58/2019',
    aussage: 'Tritt Verzug ohne Mahnung ein (bestimmter Verfalltag, Art. 102 Abs. 2 OR), läuft der Zins umgehend.',
    verifiziert: false,
  },
  // Referenziert in verzugszins.ts (Validierungs-Warnung; Hygiene-Bereinigung
  // 10.6.2026 nach Präjudizien-Abgleich — Kommentar «RESERVE» war überholt).
  BGer_4A_117_2014: {
    aktenzeichen: 'BGer 4A_117/2014',
    aussage: 'Verzugszins nur auf geschuldeten Beträgen, nicht auf zu Unrecht verlangten.',
    verifiziert: false,
  },
  // Nachregistrierung 10.6.2026 (Präjudizien-Abgleich Art. 104,
  // bibliothek/normen/verzugszins-praejudizien-abgleich.md):
  BGE_122_III_53: {
    aktenzeichen: 'BGE 122 III 53',
    aussage:
      'Art. 104 Abs. 3 OR gilt nur im objektiv kaufmännischen Verkehr; Schadenszins und Verzugszins sind nicht kumulierbar.',
    verifiziert: false,
  },
  BGE_131_III_12: {
    aktenzeichen: 'BGE 131 III 12',
    aussage:
      'Auf dem Schadenszinsbetrag läuft kein Verzugszins, auch nicht ab Urteilstag (E. 9.3/9.4).',
    verifiziert: false,
  },
  BGE_117_V_349: {
    aktenzeichen: 'BGE 117 V 349',
    aussage: 'Art. 104 Abs. 1 ist dispositiv; höherer oder tieferer Verzugszins vereinbar.',
    verifiziert: false,
  },
  BGE_137_III_453: {
    aktenzeichen: 'BGE 137 III 453',
    aussage: 'War die Schuld vor Verzug höher als 5% verzinst, gilt der vertragliche Satz auch für die Verzugszinsen.',
    verifiziert: false,
  },
  BGE_116_II_140: {
    aktenzeichen: 'BGE 116 II 140',
    aussage: 'Üblicher Bankdiskonto (Abs. 3) = Privatdiskontsatz, nicht Kontokorrent-Zinssatz.',
    verifiziert: false,
  },

  // ZPO-Fristen (Art. 142–149 ZPO)
  BGE_139_III_78: {
    aktenzeichen: 'BGE 139 III 78',
    aussage:
      'Art. 145 Abs. 3 ZPO (Hinweis auf Nichtgeltung des Stillstands) ist Gültigkeitsvorschrift; fehlt der Hinweis, stehen die Fristen still. Die Ausnahme «summarisch» gilt auch für die Berufungsfrist gegen einen Summarentscheid.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_144_III_404: {
    aktenzeichen: 'BGE 144 III 404',
    aussage: 'Bei der Frist zur Ablehnung des Urteilsvorschlags ist der Fristenstillstand zu berücksichtigen (Art. 145 Abs. 2 lit. a findet keine Anwendung).',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_141_III_554: {
    aktenzeichen: 'BGE 141 III 554',
    aussage: 'Gesetzliche Fristen sind nicht erstreckbar (Art. 144 Abs. 1); auch keine «Fristabnahme» (Berufungsantwortfrist).',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_141_II_429: {
    aktenzeichen: 'BGE 141 II 429',
    aussage: 'Zustellfiktion (7. Tag) gilt unabhängig von einer mit der Post vereinbarten längeren Abholfrist.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGer_4A_20_2024: {
    aktenzeichen: 'BGer 4A_20/2024',
    aussage: 'Der Fristenstillstand (Art. 145 Abs. 1) gilt nicht für die gerichtlich angesetzte Prosekutionsfrist (umstritten).',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_140_III_561: {
    aktenzeichen: 'BGE 140 III 561',
    aussage: 'Der frühere Vorbehalt in Art. 209 Abs. 4 betrifft nur prozessuale Prosequierungsfristen, nicht materielle Verwirkungsfristen.',
    verifiziert: false,
  },

  // SchKG-Fristen (Art. 17 ff., 56, 63 SchKG)
  BGE_143_III_149: {
    aktenzeichen: 'BGE 143 III 149',
    aussage:
      'Betreibungsferien hemmen – im Gegensatz zu Gerichtsferien – den Fristenlauf nicht (E. 2.1 i.V.m. BGE 114 III 60 E. 2b).',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_114_III_60: {
    aktenzeichen: 'BGE 114 III 60',
    aussage: 'Betreibungsferien hemmen den Fristenlauf nicht; nur Verlängerung bei Fristende in geschlossener Zeit (Art. 63 SchKG).',
    verifiziert: false,
  },
  BGE_108_III_49: {
    aktenzeichen: 'BGE 108 III 49',
    aussage: 'Bei der 3-Tage-Frist nach Art. 63 SchKG zählen Samstag, Sonntag und staatlich anerkannte Feiertage nicht mit.',
    verifiziert: false,
  },
  BGE_119_III_26: {
    aktenzeichen: 'BGE 119 III 26',
    aussage: 'Bei verschobener Steigerung gilt die Mindestfrist (Art. 138 Abs. 1 SchKG) nicht erneut.',
    verifiziert: false,
  },
  BGE_149_III_179: {
    aktenzeichen: 'BGE 149 III 179',
    aussage:
      'Die Auflage des Kollokationsplans ist keine Betreibungshandlung → für die Kollokationsklage gelten die ZPO-Gerichtsferien (Art. 145 ZPO), nicht Art. 63 SchKG.',
    verifiziert: false,
  },
  BGE_143_III_38: {
    aktenzeichen: 'BGE 143 III 38',
    aussage: 'Altrechtlich (vor 2025): für die Aberkennungsklage galten die Betreibungsferien; Auslöser ist eine Betreibungshandlung.',
    verifiziert: false,
  },
  BGE_141_III_170: {
    aktenzeichen: 'BGE 141 III 170',
    aussage: 'Für die Aufsichtsbeschwerde (Art. 17 SchKG) gilt der ZPO-Stillstand nicht (Art. 145 Abs. 4 Satz 2 ZPO).',
    verifiziert: false,
  },
  BGer_5A_190_2023: {
    aktenzeichen: 'BGer 5A_190/2023',
    aussage:
      'In Monaten bemessene Fristen (Art. 166 Abs. 2 SchKG) beginnen am Tag nach der Zustellung; Stillstand während rechtsvorschlagsbedingtem Gerichtsverfahren.',
    verifiziert: false,
  },
  BGer_5A_730_2023: {
    aktenzeichen: 'BGer 5A_730/2023',
    aussage: 'Entscheide der Aufsichtsbehörde sind i.d.R. keine Betreibungshandlung → keine Verlängerung nach Art. 63 SchKG.',
    verifiziert: false,
  },
  BGer_5A_611_2023: {
    aktenzeichen: 'BGer 5A_611/2023',
    aussage: 'Die Minimalfrist beim Verwertungsbegehren für Grundstücke (Art. 116 SchKG) liegt im Schuldnerinteresse.',
    verifiziert: false,
  },
  BGer_5A_545_2017: {
    aktenzeichen: 'BGer 5A_545/2017',
    aussage: 'Arresteinsprache (Art. 278 SchKG): Nur die Einsprache ist fristgebunden; die Begründung kann auf Fristansetzung nachgereicht werden.',
    verifiziert: false,
  },
  BGer_5A_288_2012: {
    aktenzeichen: 'BGer 5A_288/2012',
    aussage: 'Arrestprosekution (Art. 279 SchKG): «Einleitung» bedeutet Stellung des Betreibungsbegehrens.',
    verifiziert: false,
  },
  BGer_5A_852_2014: {
    aktenzeichen: 'BGer 5A_852/2014',
    aussage: 'Lastenbereinigung (Art. 140 SchKG): Die Bestreitung muss nicht substantiiert werden.',
    verifiziert: false,
  },

  // Mietrecht (Art. 253 ff. OR)
  BGE_137_III_208: {
    aktenzeichen: 'BGE 137 III 208',
    aussage:
      'Absolute Empfangstheorie für den Zugang der Kündigung; Schutz der Familienwohnung auch bei Geschäftsräumen, die zugleich Familienwohnung sind.',
    verifiziert: false,
  },
  BGE_140_III_244: {
    aktenzeichen: 'BGE 140 III 244',
    aussage: 'Zugang nach absoluter Empfangstheorie; die zivilprozessuale 7-Tage-Zustellfiktion gilt im materiellen Recht nicht.',
    verifiziert: false,
  },
  BGE_119_II_147: {
    aktenzeichen: 'BGE 119 II 147',
    aussage: 'Die Zahlungsfrist nach Art. 257d OR beginnt nach der relativen Empfangstheorie.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_107_II_189: {
    aktenzeichen: 'BGE 107 II 189',
    aussage: 'Relative Empfangstheorie bei der Mietzinserhöhung (Art. 269d OR).',
    verifiziert: false,
  },
  BGer_4C_375_2000: {
    aktenzeichen: 'BGer 4C.375/2000',
    aussage:
      'Wichtiger Grund (Art. 266g OR) bejaht bei panikartigen Angstzuständen nach Einbruch (ernsthafte Krankheit); Ende unter Wahrung der gesetzlichen Frist.',
    verifiziert: false,
  },
  BGer_5A_691_2023: {
    aktenzeichen: 'BGer 5A_691/2023',
    aussage:
      'Monatsfristen knüpfen am Tag des fristauslösenden Ereignisses an (nicht am Folgetag) – einheitliche Methode für materielles Recht und Prozessrecht.',
    verifiziert: false,
  },

  // Verjährung (Art. 60, 67, 127 ff. OR)
  BGE_131_III_61: {
    aktenzeichen: 'BGE 131 III 61',
    aussage:
      'Kenntnis vom Schaden (Art. 60 OR): Umstände zu Existenz, Natur und Elementen des Schadens, die eine Klage zu veranlassen und zu begründen vermögen; genaue Bezifferung nicht vorausgesetzt.',
    verifiziert: false,
  },
  BGE_111_II_55: {
    aktenzeichen: 'BGE 111 II 55',
    aussage:
      'Kenntnis der Person des Ersatzpflichtigen: Identität muss mit Sicherheit bekannt sein; blosser Verdacht genügt nicht.',
    verifiziert: false,
  },
  BGE_135_III_289: {
    aktenzeichen: 'BGE 135 III 289',
    aussage:
      'Kenntnis des Bereicherungsanspruchs (Art. 67 OR): genügend Informationen, sodass eine gerichtliche Geltendmachung vernünftigerweise zumutbar ist.',
    verifiziert: false,
  },
  BGE_137_III_16: {
    aktenzeichen: 'BGE 137 III 16',
    aussage:
      'Vertragliche Schadenersatzforderungen werden mit der Verletzung der Vertragspflicht fällig (nicht erst mit Schadenseintritt) – Beginn der ordentlichen Verjährung.',
    verifiziert: false,
  },
  BGE_146_III_25: {
    aktenzeichen: 'BGE 146 III 25',
    aussage:
      'Absolute Frist läuft ab dem schädigenden Verhalten und kann vor Erkennbarkeit des Schadens ablaufen (Asbest-Spätschäden).',
    verifiziert: false,
  },
  BGE_147_III_419: {
    aktenzeichen: 'BGE 147 III 419',
    aussage:
      'Art. 138 Abs. 1 OR: Neubeginn der Verjährung erst mit Abschluss des Rechtsstreits vor der befassten Instanz (Ausschöpfung des Instanzenzugs).',
    verifiziert: false,
  },
  // RL-14 (24.9.2026): Aussage berichtigt — der Entscheid legt KEINEN
  // Laufbeginn fest (E. 3.3.8: Dauer nach Parteiwillen, Art. 19 OR; höchstens
  // die ordentliche 10-Jahres-Frist von Art. 127 OR; E. 3.3.7: Verzicht auch
  // nach Ablauf möglich). Altes Recht (aArt. 141 Abs. 1 OR). Text gelesen
  // 24.9.2026 über entscheidsuche.ch (CH_BGE_005_BGE-132-III-226_2006; bger.ch
  // HTTP 503); vgl. Prüfung Rechtslogik Q1 (BBl 2014 235 S. 262).
  BGE_132_III_226: {
    aktenzeichen: 'BGE 132 III 226',
    aussage:
      'Verzicht auf die Verjährungseinrede (altes Recht): Dauer nach dem Parteiwillen, höchstens 10 Jahre (Art. 127 OR); einen Laufbeginn legt der Entscheid nicht fest.',
    verifiziert: false,
  },
  BGE_114_II_335: {
    aktenzeichen: 'BGE 114 II 335',
    aussage:
      'Unterbrechung durch Gläubigerhandlung: Postaufgabe genügt; Kenntnis des Schuldners nicht erforderlich.',
    verifiziert: false,
  },

  // Gewährleistung & Mängelrüge (Art. 197 ff., 367 ff. OR)
  BGer_4A_252_2010: {
    aktenzeichen: 'BGer 4A_252/2010',
    aussage:
      '«Sofortige» Mängelrüge: rechtzeitig, wenn innert längstens sieben Tagen seit Kenntnisnahme erklärt und abgesendet.',
    verifiziert: false,
  },
  BGer_4A_399_2018: {
    aktenzeichen: 'BGer 4A_399/2018',
    aussage:
      'Mängelrüge ausnahmsweise noch rechtzeitig nach elf Kalendertagen seit Kenntnis (Einzelfall).',
    verifiziert: false,
  },
  BGer_4D_25_2010: {
    aktenzeichen: 'BGer 4D_25/2010',
    aussage:
      'Rüge 2–3 Kalendertage nach sicherer Kenntnis des Mangels ist sicher rechtzeitig.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_98_II_191: {
    aktenzeichen: 'BGE 98 II 191',
    aussage:
      'Massstab der sofortigen Mängelrüge; wenige Kalendertage nach Kenntnis genügen stets.',
    verifiziert: false,
  },
  BGE_81_II_56: {
    aktenzeichen: 'BGE 81 II 56',
    aussage:
      'Prüf- und Rügeobliegenheit (Art. 201 OR) gilt analog beim Grundstückkauf und für zugesicherte Eigenschaften.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_118_II_142: {
    aktenzeichen: 'BGE 118 II 142',
    aussage:
      'Bei sich fortentwickelnden Mängeln ist die Rügefrist kürzer zu bemessen.',
    verifiziert: false,
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGE_108_II_194: {
    aktenzeichen: 'BGE 108 II 194',
    aussage:
      'Vertragliche Verkürzung der Verjährung darf die Rechtsverfolgung nicht in unbilliger Weise erschweren.',
    verifiziert: false,
  },

  // Vorsorgeauftrag (Art. 360 ff. ZGB)
  // QUELLENPRÜFUNG 3.8.2026 (§7, W2·8/V9.2): amtlicher Entscheidtext über den
  // bger.ch-CLIR-Permalink abgerufen (73 kB, ISO-8859-1). BGE 151 III 81 ist das
  // Urteil der II. zivilrechtlichen Abteilung vom 17. Januar 2025 (Geschäfts-
  // nummer im Dossier — hier bewusst NICHT ausgeschrieben: der Register-
  // Generator inventarisiert jedes Aktenzeichen in src/ und meldete sie sonst
  // als «im Code zitiert, aber nicht registriert», obwohl es derselbe Entscheid
  // ist). Der Entscheid trägt BEIDE Teilaussagen dieses Eintrags:
  //  (a) E. 3.5.5 in fine: «Im Ergebnis bleibt damit festzuhalten, dass sich die
  //      öffentliche Beurkundung des Vorsorgeauftrags nach kantonalem Recht
  //      richtet.» — hergeleitet aus dem Grundsatz von Art. 55 SchlT ZGB
  //      (E. 3.3.1, E. 3.5.2), weil Art. 361 Abs. 1 ZGB nicht auf Art. 499 ff.
  //      ZGB verweist. Regeste nennt Art. 361 Abs. 1, Art. 499 ff. ZGB,
  //      Art. 55 SchlT ZGB.
  //  (b) Keine Zeugen: E. 3.6 schützt die vorinstanzliche Erwägung, wonach der
  //      «Beizug von zwei Zeugen bei der Beurkundung von Bundesrechts wegen
  //      nicht erforderlich» ist (E. 3.1) — «Damit hat sie … kein Bundesrecht
  //      verletzt.» Der Entscheid beendet einen Lehrstreit («Das Bundesgericht
  //      hat die Frage bisher nicht entschieden», E. 3.4).
  // PRÄZISION (§8, nicht wegglätten): Das Zeugen-Erfordernis entfällt VON
  // BUNDESRECHTS WEGEN. Da das Verfahren dem kantonalen Recht folgt, könnte ein
  // kantonales Beurkundungsrecht Zeugen vorschreiben — im beurteilten Fall tat
  // das st. gallische Recht es nicht (E. 3.6). Die Zeugen-Vorschriften des
  // öffentlichen Testaments sind Art. 499 und Art. 501 ZGB (nicht 501/502).
  // Beleg + wörtliche Erwägungen: bibliothek/rechtsprechung/
  // bge-151-iii-81-verifikation-2026-08-03.md.
  // `verifiziert` bleibt false: die fachliche Abnahme ist Davids (§7).
  BGE_151_III_81: {
    aktenzeichen: 'BGE 151 III 81',
    aussage:
      'Die öffentliche Beurkundung des Vorsorgeauftrags richtet sich nach kantonalem Recht (Art. 55 SchlT ZGB); kein Beizug zweier Zeugen wie beim öffentlichen Testament erforderlich.',
    verifiziert: false,
    quelleGeprueft: 'Session 3.8.2026, E. 3.5.5 und E. 3.6, Urteil vom 17.1.2025',
  },
  // RESERVE (Audit 5.6.2026): noch unreferenziert.
  BGer_5A_624_2024: {
    aktenzeichen: 'BGer 5A_624/2024',
    aussage:
      'Das Selbstbestimmungsrecht der auftraggebenden Person ist möglichst weitgehend zu respektieren; die Eignung der beauftragten Person ist nur zurückhaltend zu verneinen.',
    verifiziert: false,
  },

  // ── Nachregistrierung 6.6.2026 (Auftrag David «BGE verlinken + Bibliothek») ──
  // Lückenbefund des Register-Generators (scripts/bge-register-generieren.ts):
  // 30 im Code zitierte Entscheide ohne Register-Eintrag. Aussagen WORTGETREU
  // aus dem Code-Kontext übernommen (nichts neu behauptet); verifiziert: false
  // bis zur fachlichen Abnahme (§7/§8).

  // Teuerung / Unterhalt / Indexmiete
  BGE_100_II_245: {
    aktenzeichen: 'BGE 100 II 245',
    aussage:
      'Nachehelicher Unterhalt: Ohne Indexklausel im Urteil besteht grundsätzlich kein Anpassungsanspruch (Art. 128 ZGB fakultativ).',
    verifiziert: false,
  },
  BGer_4A_252_2023: {
    aktenzeichen: 'BGer 4A_252/2023',
    aussage:
      'Wird ein indexierter Mietvertrag stillschweigend unbefristet fortgesetzt, kann sich der Vermieter nicht mehr auf die Indexklausel berufen.',
    verifiziert: false,
  },

  // Vollmacht
  BGE_112_II_330: {
    aktenzeichen: 'BGE 112 II 330',
    aussage:
      'Formbedürftigkeit der Vollmacht zu beurkundungspflichtigen Grundstücksgeschäften: ältere Linie bejahend; Formfrage nicht eindeutig konsolidiert (vs. Formfreiheits-Praxis).',
    verifiziert: false,
  },
  BGE_140_III_555: {
    aktenzeichen: 'BGE 140 III 555',
    aussage:
      'Die berufsmässige Vertretung im Zivilprozess ist Anwältinnen und Anwälten vorbehalten (Art. 68 Abs. 2 ZPO).',
    verifiziert: false,
  },

  // Arbeitsvertrag
  BGE_116_II_153: {
    aktenzeichen: 'BGE 116 II 153',
    aussage: 'Günstigkeitsvergleich gegenüber GAV-Mindeststandards als Gruppenvergleich (Art. 357 Abs. 2 OR).',
    verifiziert: false,
  },
  BGE_129_III_276: {
    aktenzeichen: 'BGE 129 III 276',
    aussage:
      'Gratifikation: Eine während mindestens dreier Jahre vorbehaltlos ausgerichtete Gratifikation kann trotz Freiwilligkeitsvorbehalt zum Anspruch erstarken (Art. 322d OR).',
    verifiziert: false,
  },
  BGE_139_III_155: {
    aktenzeichen: 'BGE 139 III 155',
    aussage: 'Gratifikation: Bei sehr hohen Einkommen entfällt das Akzessorietätskriterium.',
    verifiziert: false,
  },
  BGE_129_III_618: {
    aktenzeichen: 'BGE 129 III 618',
    aussage:
      'Kettenverträge ohne sachlichen Grund werden in ein unbefristetes Arbeitsverhältnis umgedeutet (Art. 334 OR).',
    verifiziert: false,
  },
  BGE_131_III_439: {
    aktenzeichen: 'BGE 131 III 439',
    aussage:
      'Eine Auslagenpauschale, die die notwendigen Auslagen nicht deckt, ist insoweit nichtig (Art. 327a Abs. 3 OR).',
    verifiziert: false,
  },
  BGE_148_III_126: {
    aktenzeichen: 'BGE 148 III 126',
    aussage: 'Verlängerte Probezeit: Nachzuholen sind die effektiv versäumten Arbeitstage (Art. 335b OR).',
    verifiziert: false,
  },
  BGE_149_III_202: {
    aktenzeichen: 'BGE 149 III 202',
    aussage:
      'Laufende Ferienlohn-Abgeltung im Stundenlohn ist bei Vollzeitbeschäftigung unzulässig – auch bei schwankenden Löhnen (Art. 329d Abs. 2 OR).',
    verifiziert: false,
  },
  BGE_145_III_365: {
    aktenzeichen: 'BGE 145 III 365',
    aussage: 'Konkurrenzverbot: Schriftformerfordernis (Art. 340 Abs. 1 OR).',
    verifiziert: false,
  },
  BGE_78_II_230: {
    aktenzeichen: 'BGE 78 II 230',
    aussage:
      'Entgeltliches Konkurrenzverbot ohne vorbehaltenes Verzichtsrecht: Der Arbeitgeber kann sich nicht einseitig durch Verzicht von der Karenzentschädigung befreien.',
    verifiziert: false,
  },
  BGer_4A_5_2025: {
    aktenzeichen: 'BGer 4A_5/2025',
    aussage:
      'Festhalten an BGE 78 II 230: kein einseitiger Verzicht des Arbeitgebers zur Befreiung von der Karenzentschädigung (Urteil vom 26.6.2025).',
    verifiziert: false,
  },

  // Mietvertrag / Untermiete
  BGE_119_II_353: {
    aktenzeichen: 'BGE 119 II 353',
    aussage:
      'Untermiete: Gewinnverbot – ein Aufschlag ist nur zulässig, soweit ihn Mehrleistungen rechtfertigen (Art. 262 Abs. 2 lit. b OR).',
    verifiziert: false,
  },
  BGE_134_III_446: {
    aktenzeichen: 'BGE 134 III 446',
    aussage:
      'Untermiete ohne Zustimmung des Hauptvermieters: nach schriftlicher Abmahnung ausserordentliche Kündigung des Hauptmietvertrags möglich (Art. 257f Abs. 3 OR).',
    verifiziert: false,
  },
  BGE_121_III_397: {
    aktenzeichen: 'BGE 121 III 397',
    aussage: 'Staffelmiete: Während der Staffelung sind andere Mietzinsanpassungen ausgeschlossen.',
    verifiziert: false,
  },
  BGE_121_III_460: {
    aktenzeichen: 'BGE 121 III 460',
    aussage:
      'Nebenkosten: Werden nicht anfallende Positionen aufgeführt, riskiert die ganze Nebenkostenabrede die Nichtigkeit.',
    verifiziert: false,
  },
  BGE_124_III_57: {
    aktenzeichen: 'BGE 124 III 57',
    aussage: 'Indexmiete: Mischklauseln (Kombination Index/Staffel) sind unzulässig.',
    verifiziert: false,
  },
  BGE_125_III_358: {
    aktenzeichen: 'BGE 125 III 358',
    aussage:
      'Anfangsmietzins: Ein vertraglicher Ausschluss der Herabsetzung (Art. 270 OR) wäre nichtig.',
    verifiziert: false,
  },
  BGer_4C_250_2006: {
    aktenzeichen: 'BGer 4C.250/2006',
    aussage:
      'Nebenkosten müssen im Mietvertrag selbst besonders aufgeführt sein (Art. 257a Abs. 2 OR); eine Auflistung nur in AGB genügt nicht.',
    verifiziert: false,
  },

  // Erbrecht / Vorsorge
  BGE_135_III_206: {
    aktenzeichen: 'BGE 135 III 206',
    aussage: 'Eigenhändige letztwillige Verfügung: Die Unterschrift steht am Schluss der Urkunde (Art. 505 ZGB).',
    verifiziert: false,
  },

  // ZPO / Fristen / Schlichtung
  BGE_138_III_225: {
    aktenzeichen: 'BGE 138 III 225',
    aussage:
      'Zustellfiktion: Voraussetzung ist, dass mit der Zustellung gerechnet werden musste (Prozessrechtsverhältnis).',
    verifiziert: false,
  },
  BGE_138_III_615: {
    aktenzeichen: 'BGE 138 III 615',
    aussage:
      'Die Klagefrist nach Klagebewilligung untersteht den Gerichtsferien (Art. 145 Abs. 1 ZPO; E. 2.4).',
    verifiziert: false,
  },
  BGE_140_III_227: {
    aktenzeichen: 'BGE 140 III 227',
    aussage: 'Massgeblich für die Klagefrist ist die Eröffnung/Zustellung der Klagebewilligung.',
    verifiziert: false,
  },
  BGE_146_III_265: {
    aktenzeichen: 'BGE 146 III 265',
    aussage: 'Örtliche Zuständigkeit der Schlichtungsbehörde (Gerichtsstände, u. a. Art. 10 ff. ZPO).',
    verifiziert: false,
  },
  BGer_4A_413_2012: {
    aktenzeichen: 'BGer 4A_413/2012',
    aussage:
      'Rechtsbegehren und Streitgegenstand des Schlichtungsgesuchs fixieren den Streitgegenstand und rahmen die spätere Klage.',
    verifiziert: false,
  },
  BGE_133_III_393: {
    aktenzeichen: 'BGE 133 III 393',
    aussage:
      'Eheschutzentscheide gelten als vorsorgliche Massnahmen i. S. v. Art. 98 BGG (Beschränkung auf Verfassungsrügen).',
    verifiziert: false,
  },
  BGE_150_III_367: {
    aktenzeichen: 'BGE 150 III 367',
    aussage:
      'Monatsfrist nach Art. 77 Abs. 1 Ziff. 3 OR endet am gleichbezeichneten Tag des Zielmonats.',
    verifiziert: false,
  },

  // Zitier-Konvention (kein materieller Verweis)
  BGE_140_III_409: {
    aktenzeichen: 'BGE 140 III 409',
    aussage:
      'NUR Beispiel-Zitat der Zitier-Konvention (lib/konventionen.ts) – kein materieller Rechtsprechungsverweis.',
    verifiziert: false,
  },
};

/** Liefert einen Rechtsprechungshinweis aus dem zentralen Register. */
export function rechtsprechung(id: keyof typeof VERIFIKATION): Rechtsprechungshinweis {
  const e = VERIFIKATION[id];
  return { aktenzeichen: e.aktenzeichen, aussage: e.aussage, verifiziert: e.verifiziert };
}
