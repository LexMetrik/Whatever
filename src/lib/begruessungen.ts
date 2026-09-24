// ─── Begrüssungs-Pools der Startseite (W2·23-STARTSEITE-V4 §4) ──────────────
//
// Auftrag David 5.9.2026: «es hatte früher mal verschiedene begrüssungen. das
// hat mir noch gefallen und es etwas persönlicher gemacht.» Die Pools sind der
// KURATIERTE Nachlass der früheren `components/start/Begruessung.tsx`
// (Fassung vor f2643c53e): Tageszeit-Fenster plus ein tageszeit-unabhängiger
// «immer»-Pool, Hochdeutsch und Schweizerdeutsch gemischt, dezent
// kanzlei-gefärbt.
//
// AUSBAU 8.9.2026 (Sidequest David: «passend zur tageszeit noch viel mehr
// verschiedene begrüssungen»): aus fünf Fenstern (5–10 · 10–14 · 14–18 ·
// 18–22 · 22–5) sind ACHT geworden — fruehmorgen 5–7 · morgen 7–10 ·
// vormittag 10–12 · mittag 12–14 · nachmittag 14–17 · feierabend 17–19 ·
// abend 19–22 · nacht 22–5. Je Fenster stehen 30–45 Grüsse, im «immer»-Pool
// 30–40; jedes Fenster trägt seinen eigenen Anlass (erstes Licht · Termine ·
// laufende Fristen · Pause · zweite Tageshälfte · Dossier zu · Ausklang ·
// spät am Werk). Alle Alt-Einträge sind erhalten, nur ins passende feinere
// Fenster einsortiert. Die Regeln unten gelten unverändert weiter und werden
// von src/tests/begruessungen.test.ts erzwungen.
//
// SCHWEIZER BEZUG 8.9.2026 (Auftrag David: «auch simple begrüssungen ok»,
// «gerne schweizer bezug»): Jedes Fenster trägt neben Hochdeutsch und regional
// gestreuter Mundart (Zürich · Bern · Basel · Ostschweiz · Innerschweiz ·
// Wallis) auch die vier Landessprachen — Französisch, Italienisch und, wo eine
// gängige Form existiert, Rätoromanisch (Bun di · Buna saira · Buna notg ·
// Allegra · Bainvegni) — dazu den Schweizer Tagesrhythmus zur passenden Stunde
// (Zmorge · Znüni · Zmittag · Zvieri · Znacht). Juristischer Witz bleibt
// draussen (Entscheid David 8.9.2026 zum Vorschlag eines Fachbegriff-Scherzes:
// «nein gefällt mi nicht»), und die Kaffee-Häufung ist auf höchstens zwei
// Einträge im ganzen Bestand ausgedünnt — beides erzwingt je ein Wächter in
// src/tests/begruessungen.test.ts.
//
// NUR ANKOMMEN 8.9.2026 (Entscheid David: «keine abschied. nur begrüssung»):
// Ein Pool-Eintrag ist zulässig, wenn man ihn sagt, wenn jemand ANKOMMT oder
// man ihm begegnet — Gruss, Willkommen, Wunsch für die JETZT laufende
// Tageszeit, freundliche Ansprache; gestrichen ist alles, was man beim Gehen
// oder zum Schlafengehen sagt oder was dem Nutzer den Abschied nahelegt (Adie ·
// Gute Nacht · Bonne nuit · Buona serata · «Schönen Tag noch.» · Heimweg ·
// Ausklang · «Akten dürfen ruhen»). Die romanischen Wunsch-Formen sind darum
// durch echte Begrüssungen ersetzt (Bonjour · Bonsoir · Buongiorno · Buonasera ·
// Salve), und das Nacht-Fenster grüsst Spätaufsteher, statt sie ins Bett zu
// schicken; ein Wächter in src/tests/begruessungen.test.ts erzwingt das.
//
// SPRACHREGIONEN 16.9.2026 (Auftrag David: «mach noch mehr grüsse aus allen
// sprachregionen der schweiz»): je Pool ein datierter Block mit Mundart
// (Basel · Bern · Zürich · Innerschweiz · Ostschweiz · Wallis · Graubünden),
// Westschweizer Französisch (z. B. «ça joue?»), Tessiner Italienisch samt
// Dialekt (Bondì · Bonasera) und Rätoromanisch in RG und Idiomen — jede
// rätoromanische Form belegt im Pledari Grond (RG, Sursilvan, Sutsilvan,
// Surmiran; api.pledarigrond.ch) bzw. in den Dicziunaris ladins (Puter,
// Vallader), Abruf 17.9.2026. Die Pool-Grössen-Zusagen wachsen mit (Test).
//
// KURATIERT, nicht 1:1 übernommen (§4-Auflage): Sprichwort-Fragmente («Der
// frühe Vogel …», «Morgenstund hat Gold im Mund», «Schaffe, schaffe …») und
// alles, was nach Werbung oder Kalauer klingt («Willkommen im Paragraphen-
// dickicht», «Die Eule unter den Juristen?», «Hallöchen», «Servus»), sind
// gestrichen. Jeder Eintrag ist ein ganzer Satz oder ein Gruss MIT Punkt — die
// Zeile im Hero setzt keine Interpunktion nach.
//
// LÄNGE ist eine Layout-Zusage, keine Stilfrage: die Grussliste hält jeden
// Eintrag kurz genug, dass die Begrüssungszeile auch auf 390 px einzeilig
// bleibt (Höhen-Reservierung im Hero, CLS). Der Wächter dazu steht in
// src/tests/begruessungen.test.ts.
//
// NUR HÖFLICH 24.9.2026 (Auftrag David: «bei den begrüssungen die profanen
// raus», «es soll höflich bleiben»): Du-/Kumpel-Formen und saloppe Grüsse
// (Hoi · Salü · Sali · Ciao · Salut in allen Varianten, das Romansh «chau
// ensemen» sowie die bare Mundart-Fragen «Scho uf?» / «Scho am Werk?» /
// «No uf?») sowie flapsige/banale Kanzlei-Sprüche («Die Akten warten.»,
// «Frisch ans Dossier.»/«Frisch an den Schriftsatz.», «Der Stapel wartet.»,
// «Zurück an die Arbeit?», «Früh dran heute.», «Frühschicht im Recht.»,
// «Ein Käfeli zum Start?»/«Ein Käfeli gefällig?», jede «Ihr <X>, Ihre
// Akten»-Formel, «Scho Fyrabig?», «Bald gits Znacht.», «En Guete zum
// Znacht.», «Salü, no wach?») sind repo-weit aus allen Pools gestrichen.
// Formelle Sie-Form-Grüsse, höfliche Mundart, ruhige Tageszeit-Wünsche und
// die Landessprachen-Formen bleiben unverändert stehen (Kriterienliste s.
// Bau-Auftrag W2·29-WERKBANK-START-UEBERARBEITUNG §5d-bis). Jeder betroffene
// Pool-Wächter in src/tests/begruessungen.test.ts ist im selben Schritt
// nachgeführt.
//
// §2 (Determinismus): diese Datei bleibt REIN. Sie liefert Sprachmaterial und
// eine Auswahlfunktion, deren Zufallsquelle der AUFRUFER mitbringt — der
// eslint-Riegel gegen `Math.random()` in `src/lib/**` greift hier also nicht
// durch eine Ausnahme, sondern weil es hier gar keinen Zufall gibt.

/** Obergrenze für die Zeichenlänge eines Grusses (Einzeiligkeit @390 px). */
export const GRUSS_MAX_ZEICHEN = 30;

/** Tageszeit-unabhängige Grüsse — kommen zu JEDEM Tageszeit-Pool dazu. */
export const IMMER: readonly string[] = [
  // Hochdeutsch, höflich
  'Herzlich willkommen.',
  'Willkommen zurück.',
  'Willkommen bei LexMetrik.',
  'Schön, dass Sie da sind.',
  'Schön, dass Sie reinschauen.',
  'Schön, Sie wieder zu sehen.',
  'Schön, Sie hier zu haben.',
  'Freut mich, Sie zu sehen.',
  'Seien Sie gegrüsst.',
  // Schweizerdeutsch, regional gestreut
  'Grüezi.',
  'Grüezi wohl.',
  'Grüezi mitenand.',
  'Grüezi zäme.',
  'Grüezi allerseits.',
  'Grüezi und willkommen.',
  'Grüessech.',
  'Grüessech mitenand.',
  // Dezent kanzlei-gefärbt
  'Ihre Akten sind bereit.',
  'Das Dossier liegt bereit.',
  'Womit fangen wir an?',
  'Was steht heute an?',
  'Recht griffbereit.',
  'Die Suche steht bereit.',
  'Ihr Nachschlagewerk.',
  // Landessprachen der Schweiz (Französisch · Italienisch · Rätoromanisch)
  'Bienvenue.',
  'Benvenuti.',
  'Bainvegni.',
  'Allegra.',
  // Sprachregionen (Ausbau 16.9.2026, Auftrag David «mach noch mehr grüsse
  // aus allen sprachregionen der schweiz») — Mundart: «Griäzi» Innerschweiz,
  // «Grüessech» Bern.
  'Griäzi mitänand.',
  'Grüessech zäme.',
  // Romandie.
  'Bienvenue à tous.',
  'Bienvenue parmi nous.',
  'Soyez les bienvenus.',
  // Italienische Schweiz.
  'Salve, benvenuti.',
  'Benvenuti a tutti.',
  'Ben arrivati.',
  // Rätoromanisch (Pledari Grond / Dicziunaris ladins, Abruf 17.9.2026):
  // RG «Cordial bainvegni!» · Sursilvan «beinvegni» · Sutsilvan
  // «bagnvagnieu!» · Surmiran «bavagnez!» (Sie-Form), «cordial bavegna» ·
  // Puter/Vallader «allegramaing!» (grüezi).
  'Cordial bainvegni.',
  'Beinvegni.',
  'Bagnvagnieu.',
  'Bavagnez.',
  'Cordial bavegna.',
  'Allegramaing.',
];

export interface Tageszeit {
  /** Stabile Kennung (Tests, Debug). */
  id:
    | 'fruehmorgen'
    | 'morgen'
    | 'vormittag'
    | 'mittag'
    | 'nachmittag'
    | 'feierabend'
    | 'abend'
    | 'nacht';
  /** Fenster [ab, bis) in Stunden; das Nacht-Fenster überspannt Mitternacht. */
  ab: number;
  bis: number;
  pool: readonly string[];
}

export const TAGESZEITEN: readonly Tageszeit[] = [
  {
    // 5–7 · erster Blick, Zmorge, Stille vor dem Tag.
    id: 'fruehmorgen', ab: 5, bis: 7, pool: [
      'Guten Morgen.',
      'Schönen guten Morgen.',
      'Einen guten Morgen Ihnen.',
      'Einen ruhigen Morgen.',
      'Einen stillen Morgen.',
      'Ein klarer Morgen.',
      'Ein ruhiger Start.',
      'Früh am Werk.',
      'Die Stille vor dem Tag.',
      'Noch ist es ruhig.',
      'Der Tag beginnt leise.',
      'Der Tag ist noch leer.',
      'Der erste Blick ins Dossier.',
      'Zeit für den ersten Blick.',
      'Noch läuft keine Frist.',
      'Vor dem ersten Termin.',
      'Die Kanzlei erwacht.',
      'Morgenlicht und Akten.',
      'Ein früher Start ins Recht.',
      'Guete Morge.',
      'Guete Morge zäme.',
      'Guete früeche Morge.',
      'En früeche Morge.',
      'En ruhige Morge.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026).
      'Bonjour.',
      'Buongiorno.',
      'Bun di.',
      'Zeit für ein Zmorge.',
      'En guete Zmorge.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Wallis · Graubünden
      // · Innerschweiz · Romandie · Tessin (Dialekt «Bondì») · Sutsilvan
      // «bùn gi!» (Pledari Grond: guten Morgen).
      'Guata Morga.',
      'Guätä Morgä.',
      'Bonjour de bon matin.',
      'Bonjour, déjà debout?',
      'Buondì.',
      'Bondì.',
      'Bùn gi.',
    ],
  },
  {
    // 7–10 · der Betrieb kommt in Gang, erste Termine, erster Schriftsatz.
    id: 'morgen', ab: 7, bis: 10, pool: [
      'Einen klaren Morgen.',
      'Einen produktiven Morgen.',
      'Einen guten Arbeitsmorgen.',
      'Einen guten Start in den Tag.',
      'Auf einen guten Morgen.',
      'Auf einen klaren Kopf.',
      'Auf eine gute Aktenlage.',
      'Bereit für den Tag?',
      'Der Tag nimmt Fahrt auf.',
      'Der Tag liegt vor Ihnen.',
      'Der erste Termin naht.',
      'Die Post ist da.',
      'Die Fristen sind notiert?',
      'Das Dossier ist offen.',
      'Ein neuer Tag, neue Fälle.',
      'Ein Morgen für Präzision.',
      'Ein Morgen voller Fälle.',
      'Zeit für den Schriftsatz.',
      'Guten Morgen in die Kanzlei.',
      'Ihr Vormittag beginnt.',
      'Guete Morge mitenand.',
      'Guete Morge, alles klar?',
      'En schöne Morge.',
      'En produktive Morge.',
      'Schöne Morge zäme.',
      'En guete Start id Tag.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026; die
      // Wunsch-Formen «Bonne journée.»/«Buona giornata.» sind Abschiedsformeln
      // und darum am 8.9.2026 durch Begrüssungen ersetzt).
      'Bonjour à tous.',
      'Buongiorno a voi.',
      'Grüezi und guete Morge.',
      'Zeit für ein Znüni.',
      'Bald ist Znüni.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Mundart · Romandie
      // («ça joue?») · Tessin · Sursilvan «bien di!» (Pledari Grond).
      'Morge zäme.',
      'Morge mitenand.',
      'Bonjour, ça joue?',
      'Bonjour tout le monde.',
      'Buongiorno, come va?',
      'Buondì a tutti.',
      'Bien di.',
    ],
  },
  {
    // 10–12 · Termine, Recherche, laufende Fristen.
    id: 'vormittag', ab: 10, bis: 12, pool: [
      'Guten Tag.',
      'Schönen guten Tag.',
      'Einen guten Vormittag.',
      'Schönen Vormittag.',
      'Einen ruhigen Vormittag.',
      'Einen produktiven Vormittag.',
      'Mitten im Vormittag.',
      'Der Vormittag läuft rund?',
      'Ein Vormittag voller Termine.',
      'Ein Vormittag für Klärung.',
      'Die Fristen laufen.',
      'Eine Frist im Blick?',
      'Der Terminkalender ruft.',
      'Die Fälle laufen.',
      'Die Verhandlung naht.',
      'Einen guten Verhandlungstag.',
      'Auf eine klare Rechtslage.',
      'Das Mandat ist in Arbeit.',
      'Das Dossier nimmt Form an.',
      'Der Schriftsatz wächst.',
      'Die Akten sind aufgeschlagen.',
      'Die Notizen ordnen sich.',
      'Die Post ist gesichtet.',
      'Zwischen zwei Terminen?',
      'Zeit für die Recherche.',
      'Noch vor dem Mittag.',
      'Guete Tag.',
      'En guete Tag zäme.',
      'Guete Vormittag.',
      'En schöne Vormittag.',
      'Schöne Vormittag zäme.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026).
      'Bonjour à vous.',
      'Buongiorno a tutti.',
      'Guete Daag.',
      'Guete Tag mitenand.',
      'Nach dem Znüni weiter.',
      'Tagwohl.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Graubünden ·
      // Innerschweiz · Mundart · Romandie · Tessin · Surmiran «bun de!»
      // (Pledari Grond: guten Tag).
      'Guata Tag.',
      'Guätä Tag.',
      'Tag zäme.',
      'Bien le bonjour.',
      'Bonjour, bienvenue.',
      'Buongiorno, benvenuti.',
      'Buongiorno, come sta?',
      'Bun de.',
    ],
  },
  {
    // 12–14 · Pause, en Guete, Halbzeit.
    id: 'mittag', ab: 12, bis: 14, pool: [
      'Guten Mittag.',
      'Einen guten Mittag.',
      'Einen schönen Mittag.',
      'Schöne Mittagszeit.',
      'Eine ruhige Mittagsstunde.',
      'Etwas Ruhe zur Mittagszeit.',
      'Zeit für die Pause.',
      'Zeit zum Durchschnaufen.',
      'Kurz durchatmen.',
      'Gönnen Sie sich die Pause.',
      'Lassen Sie es sich schmecken.',
      'Erst essen, dann Fristen.',
      'Die Akten dürfen warten.',
      'Ein Moment ohne Akten.',
      'Die Kanzlei macht Pause.',
      'Mittagspause im Dossier.',
      'Der Nachmittag kann warten.',
      'Die halbe Strecke ist da.',
      'Halbzeit im Tagwerk.',
      'Mitten im Tagwerk.',
      'Mitten in den Akten.',
      'Einen schönen Tag.',
      'Einen angenehmen Tag.',
      'En Guete.',
      'En Guete zäme.',
      'En Guete mitenand.',
      'En Guete zum Mittag.',
      'Guete Mittag.',
      'En schöne Mittag.',
      'Schöne Mittag mitenand.',
      'En schöne Tag.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026).
      'Bon appétit.',
      'Buon appetito.',
      // Reine Begrüssungsformen (8.9.2026) — «Bon appétit.»/«Buon appetito.»
      // sind Tischwünsche, keine Grüsse, und zählen im Test nicht mit.
      'Bonjour et bienvenue.',
      'Salve.',
      'Zeit fürs Zmittag.',
      'Es Zmittag tuet guet.',
      'Nach em Zmittag witer.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Basel «e Guete» ·
      // Romandie · Tessin · Rätoromanisch «Mahlzeit!» im Pledari Grond —
      // RG «bun appetit!», Sursilvan «bien appetit!», Surmiran «bun appatet!».
      'E Guete.',
      'Bonjour, ça va?',
      'Bonjour à toutes et à tous.',
      'Buongiorno e ben arrivati.',
      'Bun appetit.',
      'Bien appetit.',
      'Bun appatet.',
    ],
  },
  {
    // 14–17 · zweite Tageshälfte, Zvieri, Endspurt.
    id: 'nachmittag', ab: 14, bis: 17, pool: [
      'Einen schönen Nachmittag.',
      'Schönen Nachmittag.',
      'Einen angenehmen Nachmittag.',
      'Einen ruhigen Nachmittag.',
      'Einen produktiven Nachmittag.',
      'Ein klarer Nachmittag.',
      'Der Nachmittag läuft.',
      'Der Nachmittag gehört Ihnen.',
      'Auf die zweite Tageshälfte.',
      'Die zweite Hälfte läuft.',
      'Endspurt am Nachmittag.',
      'Weiterhin gute Aktenlage.',
      'Die Dossiers im Griff?',
      'Das Dossier geht voran.',
      'Der Stapel schrumpft.',
      'Noch ein Schriftsatz heute?',
      'Noch etwas Recherche?',
      'Die Frist ist gewahrt?',
      'Die Verhandlung ist durch?',
      'Weiter im Text.',
      'Guete Namittag.',
      'Guete Namittag zäme.',
      'En schöne Namittag.',
      'En ruhige Namittag.',
      'Schöne Namittag mitenand.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026;
      // «Bon après-midi.»/«Buon pomeriggio.» sind Wunsch-Formen zum Abschied
      // und am 8.9.2026 durch Begrüssungen ersetzt; «Rebonjour.» ist
      // nachgeschärft 8.9.2026 wieder raus — wirkte bemüht — und durch
      // «Bienvenue à vous.» ersetzt, damit der Französisch-Wächter (Test)
      // weiter grün bleibt).
      'Bienvenue à vous.',
      'Salve a tutti.',
      'Zeit für ein Zvieri.',
      'Schöni Zvieri-Zyt.',
      'Bald ist Zvieri.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Graubünden ·
      // Romandie · Tessin · Rätoromanisch «guten Tag» NACH dem Mittagessen —
      // Sutsilvan «bùna sera!», Sursilvan «bunasera!» (Pledari Grond).
      'Bonjour, comment allez-vous?',
      'Salve, come va?',
      'Ciao, tutto bene?',
      'Bùna sera.',
      'Bunasera.',
    ],
  },
  {
    // 17–19 · Feierabend-Stunde — gegrüsst wird, wer JETZT kommt; das
    // Abschieds-Motiv (Dossier zu, Heimweg, Adie) ist am 8.9.2026 raus.
    id: 'feierabend', ab: 17, bis: 19, pool: [
      'Schönen Feierabend.',
      'Einen schönen Feierabend.',
      'Einen ruhigen Feierabend.',
      'Einen erholsamen Feierabend.',
      'Feierabend, wohlverdient.',
      'Feierabend naht.',
      'Bald ist Feierabend.',
      'Willkommen zum Feierabend.',
      'Schon Feierabend?',
      'Noch schnell etwas nachsehen?',
      'Noch eine letzte Notiz?',
      'Noch am Werk um diese Zeit?',
      'Was steht noch an heute?',
      'Noch eine Frage offen?',
      'Zeit für eine Recherche?',
      'Die letzte Frist von heute.',
      'Der Schriftsatz ist raus?',
      'Ein guter Tag fürs Recht.',
      'Die Kanzlei leert sich.',
      'Einen guten Übergang.',
      'Auf einen ruhigen Abend.',
      'Guete Fyrabig.',
      'Schöne Fyrabig.',
      'En schöne Fyrabig.',
      'Schöne Fyrabig mitenand.',
      'Fyrabig zäme.',
      'Grüezi zum Fyrabig.',
      'Grüessech am Aabig.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026;
      // «Bonne fin de journée.»/«Buona serata.» sind Abschiedsformeln und am
      // 8.9.2026 durch Abend-Begrüssungen ersetzt).
      'Bonsoir à tous.',
      'Buonasera a tutti.',
      'Schöne Fyrabe.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Basel «Fyroobe» ·
      // Mundart · Romandie · Tessin (Dialekt «Bonasera») · Sursilvan
      // «buna sera!» (Pledari Grond: guten Abend).
      'Bonsoir tout le monde.',
      'Bonsoir, ça joue?',
      'Buonasera, come va?',
      'Bonasera.',
      'Buna sera.',
    ],
  },
  {
    // 19–22 · Abendgruss für den, der jetzt kommt (kein Gute-Nacht-Motiv).
    id: 'abend', ab: 19, bis: 22, pool: [
      'Guten Abend.',
      'Einen schönen Abend.',
      'Einen angenehmen Abend.',
      'Einen ruhigen Abend.',
      'Einen stillen Abend.',
      'Einen geruhsamen Abend.',
      'Einen gemütlichen Abend.',
      'Ein Abend ohne Fristen.',
      'Schönen Abendgruss.',
      'Willkommen am Abend.',
      'Grüezi zum Abend.',
      'Der Abend gehört Ihnen.',
      'Der Abend ist noch jung.',
      'Noch eine Frist zu prüfen?',
      'Noch am Dossier?',
      'Abends noch am Werk?',
      'Guete Aabig.',
      'Guete Aabig mitenand.',
      'Guete Aabig zäme.',
      'En schöne Aabig.',
      'En schöne Aabig zäme.',
      'En ruhige Aabig.',
      'En gmüetliche Aabig.',
      'Schöne Aabig zäme.',
      'Schönen Abend mitenand.',
      // Landessprachen und Schweizer Tagesrhythmus (Ausbau 8.9.2026;
      // «Bonne soirée.» ist eine Abschiedsformel und am 8.9.2026 gestrichen).
      'Bonsoir.',
      'Buonasera.',
      'Buna saira.',
      'Schöne Obig.',
      // Nachgeschärft 8.9.2026 (Haupt-Session): «Was suchen Sie heute Abend?»
      // gestrichen, dafür nach.
      'Guete Aabig, willkomme.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Basel «Obe» ·
      // Ostschweiz «Obig» · Bern «Abe» · Graubünden · Innerschweiz · Romandie ·
      // Tessin · Sutsilvan «bùna sera a tuts!» (Pledari Grond: guten Abend
      // allerseits).
      'Guete Obe.',
      'Guete Obig.',
      'Guete n Abe.',
      'Guata Obig.',
      'Guätä Aabig.',
      'Bonsoir et bienvenue.',
      'Bonsoir, comment ça va?',
      'Bonsoir à toutes et à tous.',
      'Buonasera e benvenuti.',
      'Buonasera, come sta?',
      'Bùna sera a tuts.',
    ],
  },
  {
    // 22–5 · spät am Werk, überspannt Mitternacht. Das Fenster GRÜSST den
    // Spätaufsteher (Entscheid David 8.9.2026) — es schickt ihn nicht ins Bett:
    // Gute-Nacht-, Schlaf- und Ruhe-Formeln sind hier ersatzlos gestrichen.
    id: 'nacht', ab: 22, bis: 5, pool: [
      'Schönen späten Abend.',
      'Eine stille Stunde.',
      'Willkommen zu später Stunde.',
      'Willkommen in der Nacht.',
      'Grüezi zu später Stunde.',
      'Grüezi um diese Zeit.',
      'Noch wach? Willkommen.',
      'Spät, aber willkommen.',
      'Nachtschicht? Willkommen.',
      'Noch spät am Werk?',
      'Noch wach über den Akten?',
      'Spät im Dossier?',
      'Nachtschicht?',
      'Später Blick ins Dossier?',
      'Noch eine Frage um diese Zeit?',
      'Noch ein Paragraph?',
      'Die Suche ist auch nachts da.',
      'Die Kanzlei ist dunkel.',
      'Nachts sind die Akten still.',
      'No spaat dra?',
      'No wach?',
      'No am Dossier?',
      'No am Läse?',
      'Guete spaate Aabig.',
      'Schöne spaate Aabig.',
      'Salü zu spaater Stund.',
      // Landessprachen (Ausbau 8.9.2026; «Bonne nuit.», «Buonanotte.»,
      // «Buon riposo.» und «Buna notg.» sind Abschiedsformeln und am 8.9.2026
      // durch späte Begrüssungen ersetzt).
      'Bonsoir à vous.',
      'Buonasera a voi.',
      // Nachgeschärft 8.9.2026 (Haupt-Session, «wirken bemüht»): drei Formeln
      // gestrichen, drei Grüsse nach.
      'Bonsoir, bienvenue.',
      'Buonasera, benvenuti.',
      // Sprachregionen (Ausbau 16.9.2026, Auftrag David): Mundart · Romandie ·
      // Tessin · Surmiran «tgau!» (Pledari Grond: hallo, als Begrüssung).
      'Grüessech, no wach?',
      'Bonsoir, encore debout?',
      'Encore là? Bienvenue.',
      'Buonasera, ancora svegli?',
      'Ciao, ancora al lavoro?',
      'Tgau.',
    ],
  },
];

/** Tageszeit zu einer Stunde 0–23. Das Nacht-Fenster (22–5) überspannt
 *  Mitternacht und wird darum gesondert geprüft. */
export function tageszeitFuer(stunde: number): Tageszeit {
  const nacht = TAGESZEITEN[TAGESZEITEN.length - 1];
  if (stunde >= nacht.ab || stunde < nacht.bis) return nacht;
  return TAGESZEITEN.find((t) => stunde >= t.ab && stunde < t.bis) ?? nacht;
}

/** Auswahlmenge einer Stunde: Tageszeit-Pool + «immer»-Pool. */
export function begruessungsPool(stunde: number): readonly string[] {
  return [...tageszeitFuer(stunde).pool, ...IMMER];
}

/**
 * Ein Gruss für die angegebene Stunde. `zufall` ist PFLICHT-Parameter, ohne
 * Default: `src/lib/**` ist die Logikschicht, in der §2 mechanisch gesperrt ist
 * (eslint no-restricted-properties — kein `Math.random()` hier). Die Zufalls-
 * QUELLE liegt darum beim Aufrufer in der Darstellungsschicht
 * (`components/start/Begruessung.tsx`), diese Funktion bleibt rein und im Test
 * deterministisch prüfbar. Davids Wunsch «verschiedene» betrifft die ANZEIGE,
 * nicht die Prüfbarkeit.
 */
export function waehleBegruessung(stunde: number, zufall: () => number): string {
  const pool = begruessungsPool(stunde);
  const i = Math.min(pool.length - 1, Math.max(0, Math.floor(zufall() * pool.length)));
  return pool[i];
}

// ─── Build-Seed statt Live-Zufall (QS-PERF, 15.9.2026) ──────────────────────
//
// BEFUND (CI-Lighthouse main, Lauf 40f634b3d, Mobil 4×CPU/4G): Startseite-
// Score 66, LCP 9.38 s bei TBT 0 — und das LCP-Element (die grösste Zeile der
// Seite, der Gruss-h1 in `SuchBlock.tsx`) war je Lauf ein ANDERER Text. Ursache:
// `waehleBegruessung(stunde, Math.random)` wurde ZWEIMAL unabhängig gezogen —
// einmal beim Prerender (Node-Prozess, `scripts/prerender.ts`), einmal beim
// Client-Mount (Browser, `useHeute` in `Begruessung.tsx`). Das prerenderte
// `dist/index.html` zeigt Zug 1 sofort (schneller erster Paint), der Client
// ersetzt sie nach dem JS-Download durch Zug 2 — Lighthouse misst diesen
// Tausch als LCP, nicht den echten ersten Paint (Bauregel 2 «Client-
// Initialstate auf den Server-Zustand pinnen»).
//
// FIX: eine deterministische Auswahl aus einem BUILD-Seed statt aus einem
// Live-Zufall. Prerender (`vite-node scripts/prerender.ts`) UND Client-Bundle
// (`vite build`) lesen denselben `import.meta.env.VITE_BUILD_ID` (vite.config.ts
// `define`, bereits Single Source für die Fehlerkanal-Zuordnung in
// `components/fehlermeldung.ts` — hier wiederverwendet, §5) — beide Prozesse
// laufen innerhalb DESSELBEN `npm run build`-Aufrufs und sehen darum denselben
// Commit-SHA (bzw. 'dev' lokal), NIE eine Uhrzeit, die zwischen den zwei
// Prozessschritten leicht auseinanderliefe. Der Aufrufer (`Begruessung.tsx`)
// bringt den Seed mit — diese Datei bleibt rein (§2-Kommentar oben gilt
// unverändert: kein `Math.random()`/`Date.now()` HIER).
//
// NACHBESSERUNG (15.9.2026, noch selber Tag): die erste Fassung hashte auch
// eine «Stunde» aus dem Seed und zog damit aus dem TAGESZEIT-Pool dieser
// Stunde — ein Inhaltsfehler, kein Layout-Problem: der Build-Zeitpunkt hat
// NICHTS mit der Uhrzeit des Besuchs zu tun, ein um 09:00 gebauter Stand
// konnte darum um 09:00 real einen Abend-Gruss zeigen. Der Build-Pfad wählt
// jetzt ausschliesslich aus `IMMER` — dem bereits bestehenden, explizit
// TAGESZEIT-UNABHÄNGIGEN Pool (s. Definition oben: «kommen zu JEDEM
// Tageszeit-Pool dazu») —, keine neuen oder umformulierten Texte, kein
// Stunden-Hash mehr. Die live tageszeit-abhängige Auswahl (`waehleBegruessung`
// mit echter Stunde) bleibt unverändert für jeden anderen Aufrufer bestehen.
//
// PRODUKT-NUANCE (ehrlich benannt): Davids Wunsch «verschiedene Begrüssungen
// … etwas persönlicher» (5.9.2026) bleibt erfüllt — der Gruss wechselt weiter
// zufällig, aber ohne Tageszeit-Bezug —, die Kadenz ändert sich von PRO
// BESUCH auf PRO DEPLOY. Kein Logikverlust (Skill `perf`): keine Rechtslogik
// betroffen, reine Darstellung.
//
// NACHTRAG 16.9.2026 (Entscheid David «a»: wieder PRO BESUCH und wieder
// TAGESZEIT-abhängig, ohne den LCP-Tausch zurückzubringen): die Produkt-Nuance
// oben ist damit für den Browser mit JavaScript ABGELÖST. Den sichtbaren Gruss
// wählt jetzt ein kleines, blockierendes Inline-Skript DIREKT NACH der h1 im
// prerenderten HTML — echte lokale Stunde des Besuchers, `Math.random` —, noch
// bevor der Browser die Zeile zum ersten Mal malt; der React-Client übernimmt
// genau diesen Text, statt neu zu ziehen (`components/start/Begruessung.tsx`,
// `GRUSS_SKRIPT`). `waehleBegruessungFuerBuild` bleibt als FALLBACK stehen: es
// ist der Text im Server-HTML, den sieht, wer kein JavaScript ausführt (und
// jeder Test ohne DOM) — darum weiterhin nur aus dem tageszeit-neutralen
// `IMMER`. Die Pools reist dem Skript als JSON-Datenblock mit
// (`grussSkriptDaten` unten), NICHT als Kopie im Skript-Code (§5).

/**
 * Einfacher, deterministischer 32-Bit-Hash (FNV-1a-Variante). Dient nur der
 * Ableitung einer Zahl aus einem Build-Seed (Text → Streuwert) — kein
 * Sicherheits- oder Kryptografie-Zweck.
 */
function hashText(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Gruss deterministisch aus einem Build-Seed (z. B. `VITE_BUILD_ID`) statt aus
 * einem Live-Zufall — s. Abschnitt oben. Zieht NUR aus `IMMER` (tageszeit-
 * unabhängig): der Build-Zeitpunkt ist kein verlässlicher Bezug zur Uhrzeit
 * des Besuchs, darum keine Tageszeit-Pools hier. Reine Funktion: gleicher
 * Seed ⇒ IMMER derselbe (und immer ein tageszeit-neutraler) Gruss
 * (Rot-Beweis in `src/tests/begruessungen.test.ts`).
 */
export function waehleBegruessungFuerBuild(seed: string): string {
  const streuwert = hashText(`${seed}:immer`) / 0xffffffff;
  const i = Math.min(IMMER.length - 1, Math.max(0, Math.floor(streuwert * IMMER.length)));
  return IMMER[i];
}

/** Datenform für das Inline-Skript der Startseite (`GRUSS_SKRIPT` in
 *  `components/start/Begruessung.tsx`). Kurze Schlüssel, weil der Block in
 *  jedem Startseiten-HTML mitreist:
 *  - `t` — die Pools der Tageszeit-Fenster in `TAGESZEITEN`-Reihenfolge,
 *  - `s` — für jede Stunde 0–23 der Index ihres Fensters in `t`, abgeleitet
 *    aus `tageszeitFuer` (die Mitternachts-Regel wird damit NICHT im Skript
 *    nachgebaut, sondern hier einmal ausgewertet — §5),
 *  - `i` — der `IMMER`-Pool.
 *  Das Skript bildet daraus `t[s[stunde]] ++ i` — genau `begruessungsPool`
 *  (Äquivalenz-Wächter in `src/tests/begruessungen.test.ts`). */
export interface GrussSkriptDaten {
  t: readonly (readonly string[])[];
  s: readonly number[];
  i: readonly string[];
}

/** Reine Projektion der Pools für das Inline-Skript — kein Zufall, keine Uhr. */
export function grussSkriptDaten(): GrussSkriptDaten {
  return {
    t: TAGESZEITEN.map((t) => t.pool),
    s: Array.from({ length: 24 }, (_, h) => TAGESZEITEN.indexOf(tageszeitFuer(h))),
    i: IMMER,
  };
}
