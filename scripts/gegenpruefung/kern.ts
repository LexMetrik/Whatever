// scripts/gegenpruefung/kern.ts
//
// Geteilte Diff-Hash-Kernfunktion des Gegenprüfungs-Gate (QS-GP).
// EINE Quelle der Wahrheit: das Tor (check-gegenpruefung.ts) und der
// Quittier-Helfer (gegenpruefung-ok.ts) rufen `risikoDiffHash()` identisch auf
// und rechnen darum bitgleich (Design-Spec Z. 112).
//
// Kanonik (gehärtet per Panel-Linse 1):
//  - EIN deterministischer git-Aufruf:
//      git -C <toplevel> status --porcelain=v1 -z -uall --no-renames
//    * -uall  → neue Verzeichnisse werden zu EINZELdateien expandiert (sonst
//               kollabiert ein neu generierter Extraktions-Teilbaum zu «?? public/»
//               und entkäme dem Tor — Blocker Linse 1).
//    * --no-renames → keine Zwei-Feld-Sätze; jede Änderung zerfällt in
//               Einzel-Pfad add/modify/delete (stabiler, parsierbarer Hash).
//  - Risiko-Menge = Pfad matcht ≥1 Risiko-Prädikat UND kein Prüflogik-Prädikat
//    — ODER Tor-Pfad (seit RL-02, 23.9.2026: die Tore selbst, W-02 (b))
//    (hand-gerollte String-Prädikate wie scripts/plan/check.ts — KEINE Glob-Lib,
//     Linse 2: die Glob-Form der Spec über-/unter-matchte).
//  - Pro Pfad die Working-Tree-Bytes von PLATTE binden (nicht Index): so bindet
//    der Nachweis genau das, was der Prüf-Agent gesehen hat (MM: Platte ≠ Index).
//  - Kollisionsfreier Inkrementhash: pfad·NUL·art·NUL·wert·NUL (Pfade enthalten
//    nie 0x00). `art` trennt leere Datei (sha256('')) sicher von Löschung.
//  - Bewusst NICHT im Hash: die X/Y-Statuscodes / der Staging-Zustand → nach der
//    Quittung bloss `git add` lässt den Hash unverändert (Pending bleibt gültig);
//    erst eine echte Byte-Änderung kippt ihn (Selbstauflösung, Spec Z. 52-54).
//
// ─── ZWEITER EINGANG: der committete Bereich (QS-GP-BEREICH, 8.8.2026) ──────
// `risikoBereichHash()` füttert DASSELBE Hash-Schema aus einem Commit-Bereich
// statt aus dem Working Tree. Anlass: `git status` ist nach dem Commit sauber —
// wer auf einem Branch committet arbeitet, konnte den Risiko-Diff nur per
// HAND-Hash quittieren (viermal binnen fünf Tagen: 3× 3.8.2026, 1× 7.8.2026,
// Register-Zeilen). Schlimmer: das Tor konnte in genau diesem Regelfall nicht
// mehr scheitern (§6.7) — Vorher-Beweis 8.8.2026 im selben Repo: committete
// Änderung an `src/lib/tarif/…` bei sauberem Baum ⇒ «check:gegenpruefung grün —
// keine Risiko-Datei … im Working-Tree geändert», `gegenpruefung:ok` ⇒ «nichts
// zu quittieren» (Exit 1).
//
// Das Schema bleibt WÖRTLICH das der Hand-Hash-Präzedenz (Register 2026-07-28
// ff., zuletzt 2026-08-03/2026-08-07): `behalten()`-Filter über
// `git diff --name-only <basis>..<spitze>`, byte-sortierte Pfade, je Pfad
// `pfad NUL art NUL sha256(Blob@<spitze>) NUL`. Damit bleiben die bestehenden
// Hand-Hash-Zeilen rückwirkend nachrechenbar — und ein Diff, der einmal als
// Working Tree und einmal als Commit vorliegt, ergibt denselben Hash.
//
// ─── WAS DER BEREICHS-HASH BINDET — UND WAS NICHT (Auflage B1, 8.8.2026) ────
// Der Hash ist `f(Datei-MENGE, Endinhalt an der Spitze)`. Die angegebene
// Spanne fliesst NICHT in den Hash ein; sie WÄHLT nur AUS, welche Dateien in
// die Menge kommen. Live belegt in der Gegenprüfung vom 8.8.2026: zwei
// Risiko-Commits A und B, die DIESELBE Datei anfassen, ergeben für
// `HEAD~1..HEAD` und für `origin/main..HEAD` dieselbe Menge und damit denselben
// Hash — eine Quittung über die enge Spanne macht das Tor auch für die weite
// grün. Das ist KEIN Loch im Nachweis (der geprüfte Endzustand der Datei ist
// derselbe, und genau er ist der Prüfgegenstand), aber es ist eine FALLE FÜR
// DIE LESART: Wer «HEAD~1..HEAD» im Register liest, denkt an EINEN Commit;
// gedeckt ist der Endinhalt der genannten Dateien im ganzen Branch. Darum
// benennen Werkzeug, Tor und Register-Zeile die gedeckten DATEIEN und den
// effektiv gedeckten Voll-Bereich, nicht bloss die Nutzer-Eingabe.
//
// BEWUSST NICHT GEBAUT: die Basis in den Hash einbinden. Das brächte
// Falsch-Rots ohne Erkenntnisgewinn — jedes `git fetch`, jedes update-branch
// und jeder Merge-Nachzug verschiebt die merge-base und würde eine sachlich
// unveränderte Quittung entwerten, obwohl weder Datei-Menge noch Inhalt sich
// bewegt haben. Der Nachweis soll sich an INHALT auflösen (Selbstauflösung),
// nicht an Topologie.
//
// ARBEITS-TEILUNG MIT `check:merge-schutz` (KEINE Doppelung der Beweisform):
//  - Beide Tore benutzen denselben KLASSIFIZIERER `behalten()` und dieselbe
//    merge-base-Referenz — es gibt nur einen Arbiter der Risiko-FRAGE (§5).
//    Die resultierenden Mengen sind aber nicht byte-identisch:
//    `check-merge-schutz.ts` diffft ohne `-z`/`--no-renames`, seine Pfade
//    kommen also gequotet (core.quotepath) und Renames als Zwei-Feld-Sätze.
//    An Nicht-ASCII- und Rename-Kanten divergieren die Mengen darum — dieses
//    Tor ist dort STRENGER als CI (es sieht die Pfade roh). Die Härtung von
//    check-merge-schutz.ts ist ein eigener Plan-Schritt und wird hier bewusst
//    NICHT mitgemacht (fremde Fläche). Nur der BEWEIS unterscheidet sich:
//  - `check:merge-schutz` (läuft in CI, ci.yml): verlangt COMMITTETE, für
//    Dritte sichtbare Artefakte — `Gegenpruefung:`-Trailer in prüfbarer Form
//    PLUS Wachstum des committeten Registers. Das ist der Merge-Arbiter.
//  - `check:gegenpruefung --bereich` (läuft nur LOKAL, CI-Selbstschutz unten):
//    verlangt die inhaltsgebundene Quittung `bibliothek/.gegenpruefung-pending`
//    mit genau diesem Hash. Das ist die schnelle Rückmeldung VOR Commit/Push
//    und die Selbstauflösung bei jeder Byte-Änderung.
//  - Kein Widerspruch möglich: der lokale Weg prüft nie Trailer/Register, der
//    CI-Weg nie das Pending — verschiedene Fragen an dieselbe Fläche.

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync, readlinkSync } from 'node:fs';
import { join } from 'node:path';

const NUL = Buffer.from([0]);

function sha256(daten: Buffer | string): string {
  return createHash('sha256')
    .update(typeof daten === 'string' ? Buffer.from(daten, 'utf8') : daten)
    .digest('hex');
}

export interface DiffErgebnis {
  /** false = CI-Selbstschutz ODER kein Git/kein HEAD → Aufrufer protokolliert SKIP. */
  kontext: boolean;
  /**
   * WARUM der Kontext fehlt — nur gesetzt, wenn `kontext === false`.
   * Die frühere Fassung warf beide Fälle in einen Text («no-op (CI oder kein
   * Git/HEAD)») und meldete sie als «grün». Das verletzt §6 Ziff. 7 lit. b
   * (bei fehlender Voraussetzung rot ODER explizit SKIP — nie still grün) und
   * vermischte zwei völlig verschiedene Ursachen: der CI-Selbstschutz ist ein
   * bewusster Entscheid, ein kaputtes Git-Verzeichnis ist ein Defekt.
   */
  grund?: 'ci-selbstschutz' | 'kein-git' | 'keine-basis';
  /** nur im Bereichs-Modus: die aufgelöste merge-base..spitze-Referenz (für Meldungen). */
  bereich?: string;
  /** null = Git vorhanden, aber keine Risiko-Datei geändert (grün, «nichts zu beweisen»). */
  hash: string | null;
  /** die behaltenen ((Risiko ∖ Prüflogik) ∪ Tor-Pfad) Pfade, byte-sortiert. */
  dateien: string[];
}

type Eintrag = { pfad: string; art: 'datei' | 'geloescht' | 'symlink'; wert: string };

// ─── Pfad-Prädikate (hand-gerollt, git-relativer POSIX-Pfad) ────────────────

const basename = (p: string): string => p.split('/').pop() ?? p;

// Rechnen-Engines: top-level src/lib/<name>.ts, dessen Basename eines der
// Rechen-Stichwörter enthält (Linse 2: exakt die gewollten Engine-Dateien,
// nicht alle 75 top-level src/lib/*.ts). Die ^src/lib/[^/]+\.ts$-Klammer
// verhindert Rekursion in Unterordner (die separat als Präfix erfasst sind).
const RECHNEN_RE =
  /(tarif|kosten|gebuehr|zustaendigkeit|frist|verjaehr|streitwert|beurkund|gruendung|schkg|straf|bger|zustellfiktion|zustellung)/i;

// ─── RL-02: explizite Rechtslogik-Liste (Risiko-Grenze) ─────────────────────
// ANLASS: Prüfung Rechtslogik 23.9.2026, Befund S1-01 (Bündel D1, RL-02,
// W2·30-RL-W0). Gemessen: behalten()=false für genau die Engines, an denen die
// schweren Rechtsfehler sitzen (mietrecht F4-01, gewaehrleistung F5-05,
// erbteilung B3-01, verzugszins S3-a …) und für die Stammdaten, aus denen sie
// rechnen (Feiertage, Berner Skala, LIK-Reihe, Mietkündigungstermine,
// Zuständigkeitskosten). Ihre Fixes wären per Auto-Merge ohne Zweitblick
// gelandet — und S2b zeigt die schwächsten Mutationswerte genau dort.
//
// WARUM eine Liste statt einer breiteren RECHNEN_RE: Stichwörter wie «erb»,
// «miet», «datum» fingen künftige Nicht-Engines (Über-Triggerung, Linse 2).
// Die Liste ist dafür an den Baum gebunden: der Existenz-Test in
// src/tests/gegenpruefung.test.ts wird rot, wenn eine Datei umbenannt wird und
// die Grenze sonst still ins Leere zeigte (§6.7).
//
// BEWUSST NICHT aufgenommen:
//  - src/lib/pdf/** — rendert nur das Assemble-Ergebnis der Vorlagen (§5);
//    der Fachinhalt ist über src/lib/vorlagen/ bereits gebunden.
//  - Adress-/Behörden-Stammdaten (zivilgerichteErstinstanz, betreibungsaemter,
//    handelsregisteraemter, obereInstanzen, strafgerichte, staatsanwaltschaften,
//    schlichtungsstellen, handelsgerichte, schlichtung/**, betreibung/**,
//    plz/**): Entscheid W-03 offen, gebaut ist Variante (c) = nur Dateien mit
//    Zuständigkeits-REGELN. handelsgerichte.ts trägt zwar die Kantonsliste der
//    Handelsgerichte, die Engine (vorlagen/klageOrdentlich.ts, bereits Risiko)
//    führt aber ihre eigene HG-Liste; die Datei speist nur das Formular mit
//    Adressen. schlichtungsstellen.ts enthält mit VD_JDP_ZU_TA eine
//    Zuordnung Justice de paix → Tribunal; sie wird von vdSchlichtung.ts
//    (unten, Risiko) verarbeitet — die Datei selbst bleibt als Adressbestand
//    bei W-03.
//  - src/data/verfallTermine.generated.ts — Anzeige-Projektion aus
//    bibliothek/register/parameter-verfall.md für die «Aktualität & Pflege»-
//    Fläche; keine Rechen-Engine liest sie (einziger Leser
//    src/components/VerfallUebersicht.tsx, gemessen 24.9.2026), eigener
//    Drift-Wächter check:verfall-ui.
export const RECHTSLOGIK_DATEIEN: readonly string[] = [
  // Engines (top-level src/lib, von RECHNEN_RE nicht getroffen)
  'src/lib/verzugszins.ts',
  'src/lib/lohnfortzahlung.ts',
  'src/lib/erbteilung.ts',
  'src/lib/mietrecht.ts',
  'src/lib/gewaehrleistung.ts',
  'src/lib/teuerung.ts',
  'src/lib/datumsUtils.ts', // Fristen-Arithmetik, von allen Fristrechnern geteilt
  'src/lib/emissionsabgabe.ts',
  'src/lib/notariatGrundbuch.ts',
  'src/lib/notariate.ts', // VS1-04: MWST / freie Notariate
  'src/lib/vdSchlichtung.ts',
  'src/lib/zpoPresets.ts', // R5: Frist-Presets
  'src/lib/famStatusPresets.ts', // A-N6: Presets mit Frist-/Rechtsfolge-Vorgaben
  'src/lib/presetIndex.ts', // Preset-Auswahl der Fristrechner
  'src/lib/gerichtszitat.ts', // C-N2: formt die Zitierweise amtlicher Entscheide
  // Rechen-Stammdaten
  'src/data/zpoFeiertage.ts',
  'src/data/schkgFeiertage.ts',
  'src/data/lohnfortzahlungSkalen.ts', // S3b-b/Q6: Berner Skala
  'src/data/likReihe.ts',
  'src/data/mietTermine.ts',
  // Zuständigkeits-REGELN (W-03 Variante c)
  'src/data/zustaendigkeitKosten.ts', // VS1-01
  'src/data/zustaendigkeitKantone.ts',
  // Gemeinde → Regionalgericht/regionale Staatsanwaltschaft nach Art. 80/81/92
  // GSOG (BSG 161.1): eine normative Sprengel-Zuordnung, keine Adressliste;
  // die Engine src/lib/zustaendigkeit/beSprengel.ts (bereits Risiko) liest nur nach.
  'src/data/zustaendigkeit/beSprengel.json',
  // Zusatz LESER-Session 23.9.2026: entscheidet «kein Entscheid» vs.
  // «Ladefehler» und die Artikel-Zuordnung der Rechtsprechungs-Bezüge.
  'src/lib/rechtsprechung/bezuege.ts',
  // C-N4: trägt Rechtshinweis-Text im Seitencode. KEIN Glob über src/pages/**.
  'src/pages/VorlageVerjaehrungsverzicht.tsx',
];
const RECHTSLOGIK_MENGE = new Set(RECHTSLOGIK_DATEIEN);

// Katalogtexte mit Status-/Prüfaussagen (§8, Befund R3-04/05, C-N1): bis RL-02
// war nur startseiteKartenFristen.ts erfasst — zufällig über «frist». Die
// Familie ist ein Muster statt einer Liste, weil sie per Split wächst
// (Ausbau/BetraegeWerkzeuge/…); ein neuer Split darf nicht aus der Grenze fallen.
const KATALOGTEXT_RE = /^src\/lib\/startseite(Karten|Vorlagen)[A-Za-z]*\.ts$/;

// ─── RL-02: Tor-Pfad ────────────────────────────────────────────────────────
// ANLASS: Prüfung Rechtslogik 23.9.2026, Entscheid David W-02 (b) «Ja, in
// Welle 0 mitbauen». istPruefLogik() nimmt die Tore selbst aus — gemessen:
// kern.ts, gate.sh, ci.yml, golden-outputs.ts, die Golden-Datei und der
// Assertion-Diff waren alle behalten()=false. Eine Aufweichung eines Tors fiel
// damit durch kein Tor. Tor-Pfade sind darum gegenprüfungspflichtig, OBWOHL
// sie Prüflogik sind (behalten() unten kombiniert; istPruefLogik bleibt
// unverändert, damit ihre übrigen Aufgaben — Tests/check-Skripte der
// Risiko-Ordner auszunehmen — nicht kippen).
//
// Test-Dateien sind nie Tor-Pfad (sonst triggerte jede Test-Änderung); die
// Test-Seite deckt RL-03 (Fachänderungs-Riegel) ab.
//
// SELBSTBEZUG (gewollt): der Commit, der diese Zeilen einführt, fällt selbst
// unter die Regel und braucht ein Verdikt — die Orchestrierung ordnet es an.
export const TOR_DATEIEN: readonly string[] = [
  'scripts/gegenpruefung-ok.ts',
  'scripts/check-gegenpruefung.ts',
  'scripts/check-merge-schutz.ts',
  '.github/workflows/ci.yml',
  'scripts/gate.sh',
  'scripts/golden-outputs.ts',
  'golden/lexmetrik-golden.json',
  'scripts/analyse/test-assertion-diff.ts',
  // Fachänderungs-Riegel (RL-03). Bis 24.9.2026 getrennt als
  // TOR_DATEIEN_VORAUSSCHAUEND geführt, weil RL-03 parallel baute und der
  // Existenz-Test sie noch nicht fand; seit RL-03 im selben Zweig auf RL-02
  // aufsetzt, existieren sie und stehen hier (Existenz-Test deckt sie mit).
  'scripts/check-fachaenderung.ts',
  'scripts/analyse/fachaenderung-kern.ts',
];
const TOR_MENGE = new Set(TOR_DATEIEN);

/** Risiko-Pfade: Extraktion · Rechnen · Norm/Tarif (real gegen den Baum verifiziert). */
export function istRisikoPfad(p: string): boolean {
  // Extraktion
  if (p.startsWith('scripts/normtext/')) return true;
  if (p === 'scripts/normtext-snapshot.ts' || p === 'scripts/normtext-entscheide.ts') return true;
  if (p.startsWith('src/lib/normtext/')) return true;
  // Fedlex-Portfolio (FAHRPLAN-FEDLEX-PORTFOLIO Paket 1): die Wurzel-Skripte
  // scripts/fedlex-*.{sh,ts} (cache.sh-Pins, versionen-pruefen, wiedervorlage-
  // generieren, sparql-Helfer) steuern Currency/Extraktion = Risiko-Pfad. Ohne
  // diesen Glob triggern reine cache.sh/pins-Edits das Gegenprüfungs-Tor NICHT.
  if (p.startsWith('scripts/fedlex-')) return true;
  // QS-DATA (FAHRPLAN-DATENHALTUNG §4/§5 E1): Datenhaltungs-Schicht = Extraktion/Projektion
  // = Risiko-Pfad. Das Dump-Manifest bindet den DB-Zustand mit (Drift-Anker).
  if (p.startsWith('scripts/datenhaltung/')) return true;
  // BS-Rechtsprechung (Bauplan §8.4): Crawl-/Parse-Pipeline des amtlichen
  // BS-Portals = Extraktions-Risiko (check-*-Basenames via istPruefLogik ausgenommen).
  if (p.startsWith('scripts/rechtsprechung/')) return true;
  // Richter-Fundament (FAHRPLAN-RECHTSPRECHUNG §R-RICHTER): der Besetzungs-Parser
  // entscheidet über PERSONEN-IDENTITÄT (welcher Rohname wird zu welchem Kanon-Slug)
  // und trägt den Anonymisierungs-Guard, der anonymisierte Parteien/Gutachter von
  // amtlich genannten Richter:innen scheidet. Ein Fehler hier verschmilzt zwei reale
  // Amtsträger zu einer Filter-Person oder de-anonymisiert eine Partei — beides
  // Risiko-Klasse, obwohl die Datei unter src/lib/ liegt.
  //
  // Seit QS-CODE-SPLITS ist `besetzung.ts` eine reine Fassade; die tragende Logik
  // (Parser + Anonymisierungs-Guard in besetzung/parser.ts, Kanon-Pass in
  // besetzung/kanon.ts) liegt im gleichnamigen Ordner. OHNE den Ordner-Zweig hätte
  // der Split die Risiko-Klassifikation der eigentlichen Logik still verloren: die
  // Fassade träfe weiter, ihr Inhalt nie — ein Tor, das genau dort nicht mehr
  // scheitern kann, wo der teuerste Fehler sitzt (§6.7/§17).
  if (p === 'src/lib/rechtsprechung/besetzung.ts') return true;
  if (p.startsWith('src/lib/rechtsprechung/besetzung/')) return true;
  // Fedlex-Verweis-Erkennung (W2·22, 2.9.2026): entscheidet, auf welche Norm ein
  // Zitat zeigt — jeder Span ist eine Rechtsaussage (§1). Analog zum besetzung/-
  // Zweig ist `fedlex.ts` reine Fassade, die tragende Logik liegt im Ordner
  // (tabelle/url/erkennung/parser/spannen); ohne beide Zeilen lief W2·22 (+1 097
  // neue Links) ungeprüft durch das Tor — Befund der Z1-Gegenprüfung 2.9.2026.
  if (p === 'src/lib/fedlex.ts') return true;
  if (p.startsWith('src/lib/fedlex/')) return true;
  if (p.startsWith('daten/')) return true;
  if (p === 'daten-manifest.json') return true;
  // rekursiv (nicht nur die 4 Top-Level-Index-JSONs) — Blocker Linse 2:
  if (p.startsWith('public/normtext/') && p.endsWith('.json')) return true;
  // Materialien (E6a Stufe 1, FAHRPLAN-MATERIALIEN-VERZAHNUNG §4): Adapter/Projektion +
  // die committeten Projektionen (register.json eine Ebene + Kanten-Shards rekursiv) =
  // Extraktions-/Projektions-Risiko. check-*-Basenames sind über istPruefLogik ausgenommen.
  if (p.startsWith('scripts/materialien/')) return true;
  if (/^public\/materialien\/[^/]+\.json$/.test(p)) return true;
  if (p.startsWith('public/materialien/kanten/')) return true;
  // ANLASS: Gegenprüfung RL-02 24.9.2026 — die committeten Generator-Artefakte
  // src/lib/materialien/*.generated.ts tragen Amtsdaten (stand/quelleUrl/normKeys)
  // aus scripts/materialien/** und speisen die register.json-Projektion; analog den
  // public/materialien-Shards sind sie Extraktions-Risiko. Ein Muster statt einer
  // Liste, weil neue Generatoren dort hinzukommen. BEWUSST NICHT die übrigen
  // Dateien des Ordners: browse, botschaften, vernehmlassungen, ratschlaege,
  // kanten-shard sind reine Ladeschichten (§3, «keine Rechtslogik» laut
  // Kopfkommentar), typen/deckung reine Typ-Formen. register.ts (handkuratierte
  // Live-Link-Metadaten) und verfahren.ts (amtliche Vokabular-Tabelle) tragen
  // zwar Amtsdaten, sind aber keine Generator-Artefakte — ihre Aufnahme ist am
  // 24.9.2026 als offene Frage an die Orchestrierung gemeldet, nicht entschieden.
  if (/^src\/lib\/materialien\/[^/]+\.generated\.ts$/.test(p)) return true;
  // Entstehung am Artikel (W2·6c, §11.6, Kritik A8/C1-C4): die Anker-Sidecars behaupten
  // «diese Stelle der Botschaft erläutert Art. N» und die Curia-Shards geben amtliche
  // Parlaments-Beschlüsse wieder — beides Extraktion aus amtlichen Quellen, beides
  // artikelscharf. Ohne diese zwei Zeilen fielen sie durch die Risiko-Klassifikation
  // (Rot-Beweis im PR zu W2·6c-ENTSTEHUNG-DATEN: vorher false, nachher true).
  if (p.startsWith('public/materialien/anker/')) return true;
  if (p.startsWith('public/materialien/curia/')) return true;
  // Synopse-Shards (E5, §11.6): sie halten GESPEICHERTEN Gesetzestext einer historischen
  // Konsolidierung — der schwerste Fall des Zitat-Regimes (§7 a–d). Ein Fehler hier zeigt
  // dem Leser einen Wortlaut, der nie galt. Rot-Beweis im PR zu W2·6c-ENTSTEHUNG-SYNOPSE
  // (vorher false, nachher true).
  if (p.startsWith('public/materialien/synopse/')) return true;
  if (p.startsWith('public/materialien/synopse-entwurf/')) return true;
  // E3 (W2·6c-ENTSTEHUNG-LESER): die Entstehungs-Projektion sagt am Artikel «diese
  // Änderung geht auf jene Botschaft zurück» — eine artikelnahe Rechtsaussage aus
  // amtlichen Quellen, auch wenn sie nur eine SICHT auf bereits geprüfte Artefakte
  // ist. Ohne diese Zeile fiele der ganze Ordner durch die Klassifikation
  // (Rot-Beweis im PR: vorher false, nachher true).
  if (p.startsWith('public/materialien/entstehung/')) return true;
  // Die Generatoren + das Tor dieser Etappe liegen in scripts/entstehung/ (check-*-
  // Basenames nimmt istPruefLogik wie üblich aus).
  if (p.startsWith('scripts/entstehung/')) return true;
  if (p.startsWith('src/lib/entstehung/')) return true;
  // Verzahnung V1c (FAHRPLAN-VERZAHNUNG-UI §V1c): der Normrevisions-Extrakt liest die
  // amtlichen Struktur-Fussnoten und leitet je Artikel das Revisionsdatum + AS ab =
  // Extraktions-Risiko. Der Generator, die reine Parser-Logik und die committete
  // Projektion (Shards) sind gebunden; die UI-Ladeschicht (artikel-revisionen.ts) ist
  // Darstellung und bleibt aussen vor. check-Basenames sind über istPruefLogik ausgenommen.
  if (p.startsWith('scripts/verzahnung/')) return true;
  if (p === 'src/lib/verzahnung/revisionen-extrakt.ts') return true;
  if (p.startsWith('public/verzahnung/artikel-revisionen/')) return true;
  // Rechnen
  if (/^src\/lib\/[^/]+\.ts$/.test(p) && RECHNEN_RE.test(basename(p))) return true;
  // RL-02 (S1-01): explizite Rechtslogik-Liste + Katalogtexte + Bezüge-Shards
  // (Begründung je Datei oben bei RECHTSLOGIK_DATEIEN).
  if (RECHTSLOGIK_MENGE.has(p)) return true;
  if (KATALOGTEXT_RE.test(p)) return true;
  // rekursiv wie public/normtext (Blocker Linse 2): ein späterer Unterordner
  // darf nicht aus der Grenze fallen.
  if (p.startsWith('public/rechtsprechung/bezuege/') && p.endsWith('.json')) return true;
  // Seit QS-CODE-SPLITS ist `zustaendigkeit.ts` eine reine Fassade; die tragende
  // Rechenlogik (erstinstanz/rechtsmittel/gemeinsam) liegt im gleichnamigen Ordner.
  // OHNE den Ordner-Zweig hätte der Split die Risiko-Klassifikation der eigentlichen
  // Logik still verloren: die Fassade träfe weiter, ihr Inhalt nie — ein Tor, das
  // genau dort nicht mehr scheitern kann, wo der teuerste Fehler sitzt (§6.7/§17;
  // Gegenprüfungs-Befund 4.8.2026, Rot-Beweis: erstinstanz.ts=false vor diesem Zweig).
  if (p.startsWith('src/lib/zustaendigkeit/')) return true;
  if (p.startsWith('src/lib/tarif/')) return true;
  if (p.startsWith('src/lib/fristenspiegel/')) return true;
  // Norm/Tarif
  if (p.startsWith('src/data/tarif/')) return true;
  if (p.startsWith('src/lib/vorlagen/')) return true;
  return false;
}

/** Auto-Ausnahme: reine Prüflogik (Tor/Test/Check) — löst die Über-Triggerung. */
export function istPruefLogik(p: string): boolean {
  const b = basename(p);
  if (b.endsWith('.test.ts') || b.endsWith('.spec.ts')) return true;
  // scripts/**/*check* (Basename enthält «check»)
  if (p.startsWith('scripts/') && b.includes('check')) return true;
  // die geteilte Kernfunktion + ihr Verzeichnis
  if (p.startsWith('scripts/gegenpruefung/')) return true;
  if (p === 'scripts/gate.sh') return true;
  if (p === 'scripts/check-gegenpruefung.ts') return true;
  if (p === 'scripts/gegenpruefung-ok.ts') return true;
  return false;
}

/**
 * Tor-Pfad (RL-02, W-02 (b)): die Prüf-Tore selbst. Test-Dateien sind nie
 * Tor-Pfad — auch nicht unter scripts/gegenpruefung/.
 */
export function istTorPfad(p: string): boolean {
  const b = basename(p);
  if (b.endsWith('.test.ts') || b.endsWith('.spec.ts')) return false;
  if (p.startsWith('scripts/gegenpruefung/')) return true;
  return TOR_MENGE.has(p);
}

/**
 * Behalten = (Risiko UND keine Prüflogik) ODER Tor-Pfad.
 * Bis RL-02 (23.9.2026) nur der erste Teil: die Set-Subtraktion nahm die Tore
 * selbst aus. Der Tor-Pfad sticht die Prüflogik-Ausnahme (W-02 (b)).
 */
export function behalten(p: string): boolean {
  return (istRisikoPfad(p) && !istPruefLogik(p)) || istTorPfad(p);
}

// ─── git-Kanonik ────────────────────────────────────────────────────────────

function toplevel(cwd: string): string | null {
  try {
    return execFileSync('git', ['-C', cwd, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function hatHead(root: string): boolean {
  try {
    execFileSync('git', ['-C', root, 'rev-parse', '--verify', 'HEAD'], {
      stdio: ['ignore', 'ignore', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

function splitNul(buf: Buffer): Buffer[] {
  const out: Buffer[] = [];
  let start = 0;
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) {
      if (i > start) out.push(buf.subarray(start, i));
      start = i + 1;
    }
  }
  if (start < buf.length) out.push(buf.subarray(start));
  return out;
}

/**
 * Diff-gebundener sha256 über die aktuell geänderten Risiko-Inhalte.
 * @param opts.cwd       Arbeitsverzeichnis (Default process.cwd()) — nur für Tests variiert.
 * @param opts.behalten  Klassifizierer (Default `behalten`) — nur für Tests injizierbar.
 */
export function risikoDiffHash(
  opts: { cwd?: string; behalten?: (p: string) => boolean } = {},
): DiffErgebnis {
  const cwd = opts.cwd ?? process.cwd();
  const behaltenFn = opts.behalten ?? behalten;

  // CI-Selbstschutz (GH Actions/Vercel setzen CI; GITHUB_ACTIONS als Gürtel+Hosenträger).
  // Der Arbiter für den committeten Bereich ist in CI `check:merge-schutz`
  // (seit 20.7.2026 in ci.yml verdrahtet) — dieses Tor liest den Working Tree,
  // der in CI per Definition sauber ist.
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    return { kontext: false, grund: 'ci-selbstschutz', hash: null, dateien: [] };
  }

  const root = toplevel(cwd);
  if (!root || !hatHead(root)) {
    return { kontext: false, grund: 'kein-git', hash: null, dateien: [] };
  }

  let out: Buffer;
  try {
    out = execFileSync(
      'git',
      ['-C', root, 'status', '--porcelain=v1', '-z', '-uall', '--no-renames'],
      { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 },
    );
  } catch {
    return { kontext: false, hash: null, dateien: [] };
  }

  const kandidaten: string[] = [];
  for (const satz of splitNul(out)) {
    if (satz.length < 4) continue; // XY<space><≥1 Zeichen Pfad>
    const x = String.fromCharCode(satz[0]);
    if (x === 'R' || x === 'C') {
      // Kann mit --no-renames nicht auftreten — defensiv hart scheitern.
      throw new Error(`Rename/Copy-Satz trotz --no-renames: ${satz.toString('utf8')}`);
    }
    // Bytes[0..1]=XY, Byte[2]=Space, Rest=roher UTF-8-Pfad (repo-root-relativ,
    // forward-slash, unquotet — auch bei core.quotepath=true).
    kandidaten.push(satz.subarray(3).toString('utf8'));
  }

  const dateien = kandidaten.filter(behaltenFn);
  if (dateien.length === 0) return { kontext: true, hash: null, dateien: [] };

  const eintraege: Eintrag[] = dateien.map((pfad) => {
    const abs = join(root, pfad);
    let st;
    try {
      st = lstatSync(abs);
    } catch (e) {
      if (e && (e as NodeJS.ErrnoException).code === 'ENOENT') {
        return { pfad, art: 'geloescht', wert: '' };
      }
      throw e;
    }
    if (st.isSymbolicLink()) return { pfad, art: 'symlink', wert: sha256(readlinkSync(abs)) };
    if (st.isFile()) return { pfad, art: 'datei', wert: sha256(readFileSync(abs)) };
    if (st.isDirectory()) throw new Error(`Verzeichnis in Risiko-Menge trotz -uall: ${pfad}`);
    throw new Error(`Unerwarteter Dateityp in Risiko-Menge: ${pfad}`);
  });

  return { kontext: true, ...hashEintraege(eintraege) };
}

/**
 * Das EINE Hash-Schema (Working Tree wie Commit-Bereich rechnen hierüber):
 * byte-sortierte Pfade, je Eintrag `pfad NUL art NUL wert NUL`.
 * Bis 8.8.2026 stand dieser Block inline in `risikoDiffHash()`; herausgezogen,
 * damit der zweite Eingang nicht dieselbe Kanonik ein zweites Mal formuliert
 * (§5 — sonst driften die beiden Wege irgendwann auseinander und die
 * Hand-Hash-Präzedenz wäre nicht mehr rückwirkend nachrechenbar).
 */
function hashEintraege(eintraege: Eintrag[]): { hash: string; dateien: string[] } {
  // Byte-Sortierung der UTF-8-Pfade (maschinen-/locale-unabhängig).
  eintraege.sort((a, b) => Buffer.compare(Buffer.from(a.pfad, 'utf8'), Buffer.from(b.pfad, 'utf8')));

  const h = createHash('sha256');
  for (const e of eintraege) {
    h.update(Buffer.from(e.pfad, 'utf8'));
    h.update(NUL);
    h.update(e.art);
    h.update(NUL);
    h.update(e.wert);
    h.update(NUL);
  }
  return { hash: h.digest('hex'), dateien: eintraege.map((e) => e.pfad) };
}

// ─── Zweiter Eingang: Commit-Bereich ────────────────────────────────────────

/** `A..B` → {basisRef:'A', spitze:'B'}; `A..` / `..B` / '' füllen mit den Defaults. */
export function parseBereich(
  spec: string | undefined,
  standard = { basisRef: 'origin/main', spitze: 'HEAD' },
): { basisRef: string; spitze: string } {
  if (!spec || !spec.trim()) return { ...standard };
  const roh = spec.trim();
  if (roh.includes('...')) {
    // Drei-Punkt-Form ist git-seitig etwas anderes (symmetrische Differenz).
    // Nicht still umdeuten — der Aufrufer soll die Form sehen, die er meint.
    throw new Error(`Bereich «${roh}»: Drei-Punkt-Form nicht unterstützt, bitte <basis>..<spitze>.`);
  }
  const i = roh.indexOf('..');
  if (i < 0) {
    // Nur eine Referenz = Basis; Spitze bleibt HEAD (häufigster Tippfehler-Fall).
    return { basisRef: roh, spitze: standard.spitze };
  }
  const basisRef = roh.slice(0, i).trim() || standard.basisRef;
  const spitze = roh.slice(i + 2).trim() || standard.spitze;
  return { basisRef, spitze };
}

/** ls-tree-Info je Pfad an der Spitze (fehlender Pfad = an der Spitze gelöscht). */
function baumEintraege(root: string, spitze: string, dateien: string[]): Eintrag[] {
  const info = new Map<string, { modus: string; blob: string }>();
  // In Blöcken, damit sehr breite Diffs die Argumentliste nicht sprengen.
  for (let i = 0; i < dateien.length; i += 200) {
    const block = dateien.slice(i, i + 200);
    const out = execFileSync('git', ['-C', root, 'ls-tree', '-z', spitze, '--', ...block], {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    });
    for (const satz of splitNul(out)) {
      // «<modus> <typ> <blob>\t<pfad>» — Pfad roh (bei -z nie gequotet).
      const text = satz.toString('utf8');
      const tab = text.indexOf('\t');
      if (tab < 0) continue;
      const kopf = text.slice(0, tab).split(/\s+/);
      const pfad = text.slice(tab + 1);
      // B5 (Auflage 8.8.2026): Nicht-Blob (Gitlink/Submodul, Baum) HART
      // scheitern statt überspringen. Vorher stand hier `continue` mit dem
      // Kommentar «unten hart» — der Satz war falsch: ein übersprungener Pfad
      // landet unten im `!e`-Zweig und bekäme den Hash einer GELÖSCHTEN Datei.
      // Ein Submodul-Zeiger auf einen Risiko-Pfad wäre damit still als «weg»
      // quittiert worden. Lieber laut scheitern: der Fall existiert im Repo
      // heute nicht, und wenn er je entsteht, muss ein Mensch entscheiden,
      // was er bedeutet.
      if (kopf.length < 3 || kopf[1] !== 'blob') {
        throw new Error(
          `Risiko-Pfad ist kein Blob (${kopf[1] ?? '?'}) im Bereich: ${pfad} — ` +
            `Submodul/Gitlink wird nicht still als gelöscht gehasht.`,
        );
      }
      info.set(pfad, { modus: kopf[0], blob: kopf[2] });
    }
  }

  return dateien.map((pfad) => {
    const e = info.get(pfad);
    if (!e) return { pfad, art: 'geloescht', wert: '' };
    const inhalt = execFileSync('git', ['-C', root, 'cat-file', 'blob', e.blob], {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 512 * 1024 * 1024,
    });
    // Symlink-Blob = der Zielpfad als Inhalt → gleiche Byte-Bindung wie lstat/readlink
    // im Working-Tree-Weg, nur `art` trennt die Fälle (wie dort).
    return { pfad, art: e.modus === '120000' ? 'symlink' : 'datei', wert: sha256(inhalt) };
  });
}

/**
 * Diff-gebundener sha256 über die im COMMIT-BEREICH geänderten Risiko-Inhalte.
 * Gleiches Schema wie `risikoDiffHash()` — nur der Diff-Bereich ist ein anderer.
 *
 * @param opts.cwd       Arbeitsverzeichnis (Default process.cwd()).
 * @param opts.bereich   `<basis>..<spitze>`; Default `origin/main..HEAD`.
 * @param opts.behalten  Klassifizierer (Default `behalten`) — nur für Tests injizierbar.
 *
 * Kanten, die KEIN Falsch-Rot erzeugen dürfen:
 *  - frisch geforkter Branch ohne eigene Commits ⇒ leerer Diff ⇒ hash null (grün);
 *  - Branch, dessen Basis HINTER origin/main liegt ⇒ `git merge-base` statt
 *    stumpfem `origin/main..HEAD`, sonst zählten fremde main-Commits mit;
 *  - Referenz nicht auflösbar (kein Remote, frischer Clone ohne fetch) ⇒
 *    kontext:false/`keine-basis` ⇒ der Aufrufer meldet SKIP statt still grün
 *    (§6 Ziff. 7 lit. b). Der harte Arbiter bleibt dort `check:merge-schutz`,
 *    das in diesem Fall ROT wird.
 */
export function risikoBereichHash(
  opts: { cwd?: string; bereich?: string; behalten?: (p: string) => boolean } = {},
): DiffErgebnis {
  const cwd = opts.cwd ?? process.cwd();
  const behaltenFn = opts.behalten ?? behalten;

  // CI-Selbstschutz identisch zum Working-Tree-Weg: in CI ist `check:merge-schutz`
  // der Arbiter des committeten Bereichs. Liefe dieses Tor dort mit, verlangte es
  // ein Pending, das in CI keinen Nachweis führen kann — ein strukturelles
  // Falsch-Rot und ein Widerspruch zu merge-schutz.
  //
  // KORREKTUR 8.8.2026 (Auflage B2): Hier stand «(gitignored/lokal)». Das war
  // faktisch falsch — `bibliothek/.gegenpruefung-pending` war seit d47234add
  // (28.7.2026) GETRACKT; .gitignore Z. 56 wirkt auf bereits Getracktes nicht.
  // Folge: eine FREMDE Alt-Quittung reiste in jeden Klon und jeden Worktree und
  // machte aus «kein Nachweis» ein irreführendes «Hash-Mismatch» (genau die
  // Fehl-Diagnose, die B3 unten abstellt). Im selben Zug per `git rm --cached`
  // behoben; die Datei ist ab jetzt wirklich lokal.
  if (process.env.CI || process.env.GITHUB_ACTIONS) {
    return { kontext: false, grund: 'ci-selbstschutz', hash: null, dateien: [] };
  }

  const root = toplevel(cwd);
  if (!root || !hatHead(root)) {
    return { kontext: false, grund: 'kein-git', hash: null, dateien: [] };
  }

  const { basisRef, spitze } = parseBereich(opts.bereich);
  let basis: string;
  try {
    basis = execFileSync('git', ['-C', root, 'merge-base', basisRef, spitze], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return { kontext: false, grund: 'keine-basis', hash: null, dateien: [], bereich: `${basisRef}..${spitze}` };
  }

  const bereich = `${basis.slice(0, 8)}..${spitze}`;
  let out: Buffer;
  try {
    out = execFileSync(
      'git',
      // -z: rohe Pfade (kein core.quotepath-Quoting) — dieselbe Byte-Treue wie
      // beim status-Weg. --no-renames: jede Änderung als Einzel-Pfad.
      ['-C', root, 'diff', '--name-only', '-z', '--no-renames', `${basis}..${spitze}`],
      { stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 },
    );
  } catch {
    return { kontext: false, grund: 'keine-basis', hash: null, dateien: [], bereich };
  }

  const dateien = splitNul(out)
    .map((b) => b.toString('utf8'))
    .filter((p) => p.length > 0)
    .filter(behaltenFn);
  if (dateien.length === 0) return { kontext: true, hash: null, dateien: [], bereich };

  return { kontext: true, ...hashEintraege(baumEintraege(root, spitze, dateien)), bereich };
}
