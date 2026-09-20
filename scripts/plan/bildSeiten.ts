// scripts/plan/bildSeiten.ts — die vier Seiten-Inhalte des Lagebild-Generators
// (Schritt QS-PLAN-BILD, Mehrseiten-Ausbau Go David 4.8.2026).
//
//   1. `lagebildSeite`    → plan-bild.html            (Einstieg, Plan-Stand)
//   2. `projektSeite`     → plan-bild-projekt.html    (Projekt & Produkt)
//   3. `geschichteSeite`  → plan-bild-geschichte.html (Geschichte & Bau-Statistik)
//   4. `methodeSeite`     → plan-bild-methode.html    (Arbeitsweise & Glossar)
//
// Zielpublikum ist ein juristischer Laie und Projekteigner: Klartext, keine
// unerklärten Kürzel, jede Zahl mechanisch belegt. Statische Passagen
// (Selbstbeschreibung, Arbeitsweise, Glossar) sind bewusst Text und keine
// Ableitung — sie beschreiben Absicht und Verfahren, nicht Messwerte.

import { readFileSync } from 'node:fs';
import { parseRoadmap, type Einheit, ladeChronikDone } from './parse';
import { resolve, type Buckets } from './aufloesen';
import {
  KANTONE,
  baustellenInfo,
  blockerSeitTagen,
  branchNamen,
  davidFragen,
  davidFragenVerworfen,
  katalogGruppen,
  katalogZaehlung,
  mainAmpel,
  normKantonZaehlung,
  normRegister,
  normStatusZaehlung,
  offenePrs,
  rechtsprechungRegister,
  repoWebUrl,
  schrittInfoAusRoadmap,
  worktreesUndBranches,
  zaehleNach,
  zielSatz,
  zuletztGelandet,
  type NormErlass,
  type PrInfo,
  type SchrittInfo,
} from './bildDaten';
import { postenTitelJeDach } from './postenKern';
import {
  bereichsBadges,
  esc,
  fussnote,
  gateFeld,
  istDavidGate,
  istZurueckgestellt,
  kacheln,
  klartextLabel,
  lageSaetze,
  type LageZahlen,
  rahmen,

  seitenDatei,
  seitenKopf,
  tabelle,
  type SeitenOpts,
} from './bildHtml';

// ---------------------------------------------------------------------------
// Statische Passagen
// ---------------------------------------------------------------------------
// Phasen-Zeitleiste (statisch nachgeführt genügt — Spec; Quelle FAHRPLAN-GESAMTAUFBAU.md).
const PHASEN: { name: string; kurz: string; stand: 'done' | 'now' | 'offen' }[] = [
  { name: 'Phase 0 — Ordnung & Deploy-Fenster', kurz: 'Plan-System, Batch-Deploy, Freigabe-Rahmen', stand: 'done' },
  { name: 'Phase 1 — Fundament: Daten-Aktualität & Datenbank', kurz: 'Wächter laufen; Datenbank-Etappen warten teils auf den Server (VPS). Die Parallel-Bahnen (Darstellung, Werkzeuge) laufen derweil weit voraus.', stand: 'now' },
  { name: 'Phase 2 — Senke füllen', kurz: 'Schnelle Suche über alles, Masse an Entscheiden, Materialien', stand: 'offen' },
  { name: 'Phase 3 — Darstellung & Verzahnung Bund', kurz: 'Zitat-Graph, Fassungs-Versionierung', stand: 'offen' },
  { name: 'Phase 4 — Kantone in der Breite', kurz: 'Breitenimport mit Treue-Prüfungen', stand: 'offen' },
  { name: 'Phase 5 — Tarife & Abnahme-Pakete', kurz: 'Kantonale Tarife; Abnahme-Pflichtiges wird gebündelt', stand: 'offen' },
  { name: 'Phase 6 — Abnahme-Welle 1 (Davids Fachzeit)', kurz: 'Status «Entwurf» → «geprüft»; frühestens ab Dez 2026', stand: 'offen' },
  { name: 'Phase 7 — Nordstern-Vollzug', kurz: 'Selbst-Hosting, volle Historie, Long-Tail', stand: 'offen' },
];

// Offene David-Posten, die KEIN @meta-blocker sind (kuratiert; Fundstelle Pflicht).
// Mechanische blocker:-Einträge kommen zusätzlich automatisch aus dem Plan.
// §14.7-Vertrauensklausel — wörtlich (CLAUDE.md §14.7), gehört in jeden Bau-Prompt.
// VERTRAUENSGRENZE-Konstante entfernt 15.8.2026: die §14.7-Klausel erreicht
// den Orchestrator über CLAUDE.md (lädt immer) und Sub-Agenten über die
// generierten lex-Definitionen (erzwungen von dispatch-schutz.py) — die
// Prompt-Kopie war dritter Träger (§5); Regelverlust-Tor im Test.

/** Selbstbeschreibung des Projekts — Wortlaut Auftrag David 4.8.2026. */
const WAS_IST_LEXMETRIK = `LexMetrik ist eine Schweizer Rechtsplattform im Aufbau — das Ziel: die eine Anlaufstelle
für alle, die mit Recht arbeiten, von Gerichten über Verwaltungen bis zu Anwältinnen und Studierenden. Drei Säulen:
<b>Gesetze lesen</b> (Bundes- und kantonales Recht als treue, belegte Volltexte mit Quelle und Stand),
<b>Gerichtsentscheide</b> (durchsuchbar, mit Normen verknüpft) und <b>Werkzeuge</b> (deterministische Rechner und
Vorlagen — feste Rechenregeln, keine Schätzungen, keine KI im Ergebnis). Alles nur aus amtlichen und
urheberrechtsfreien Quellen; jede Rechtsangabe trägt Norm, Link und Stand.`;

const STATUS_SATZ = `«Entwurf» heisst: gebaut, getestet, nutzbar — die fachliche Einzelabnahme durch den
Projekteigner folgt planmässig ab Dezember 2026.`;

// ---------------------------------------------------------------------------
// Bau-Prompt (Steuerpult-Auflage 1 — sechs Pflicht-Bestandteile, Spec)
// ---------------------------------------------------------------------------
export function bauPrompt(e: Einheit, info: SchrittInfo | undefined, erledigt?: ReadonlySet<string>): string {
  const fp = e.etikett.fahrplan ?? null;
  const titel = info?.titel ?? e.id;
  // dep-Sichtbarkeit: ein Prompt, der die Vorbedingung verschweigt, lässt eine
  // Session in die falsche Reihenfolge laufen. Der Stand wird aus der
  // done-Menge des GEPARSTEN Plans abgeleitet (nicht geraten) und als
  // Momentaufnahme gekennzeichnet — er kann bis zum Bau veraltet sein.
  const deps = e.etikett.dep ?? [];
  const depZeile = deps.length
    ? (() => {
        const offen = erledigt ? deps.filter((d) => !erledigt.has(d)) : deps;
        const stand = !erledigt
          ? 'Stand bei Erzeugung: unbekannt — vor dem Bau selbst prüfen'
          : offen.length === 0
            ? 'Stand bei Erzeugung: erfüllt'
            : `Stand bei Erzeugung: OFFEN (${offen.join(', ')})`;
        return [
          `   Abhängigkeit: setzt ${deps.join(', ')} voraus (${stand} — bei offen NICHT bauen, sondern melden).`,
        ];
      })()
    : [];
  const pflichtZeilen = (info?.pflicht ?? []).map((p) => `   Pflichtlektüre: ${p}`);
  const istDach = (info?.checkliste?.offen ?? 0) > 0;
  // Checkliste UND Grösse gehörten bis 14.8.2026 zwei getrennten, sich
  // überschneidenden Sätzen an («Dach-Schritt mit Checkliste: NICHT alles auf
  // einmal…» hier, dieselbe Aussage nochmals mit Zahlen unten im Hauptteil) —
  // eine Zeile, die in jeder kopierten Session mitkostet. Zusammengeführt zu
  // EINER Aussage (Auftrag David 14.8.2026, «Bau-Prompt knapper formulieren»);
  // die offenen Positionstexte stehen direkt im Prompt (bei klaren Punkten
  // braucht es dafür kein zweites Lesen von ROADMAP.md; der frühere «leichte
  // Pfad» ist seit der Ritual-Diät 29.8.2026 der Normalfall).
  const dachZeilen = istDach
    ? [
        `Dach-Schritt mit Checkliste: ${info!.checkliste!.offen} von ${info!.checkliste!.gesamt} Positionen offen — sessionfüllende Auswahl SORTENREIN abarbeiten (Risiko- und Nicht-Risiko-Positionen nie im selben Paket), je Position ein eigener Commit, danach in ROADMAP.md abhaken.`,
        `Offene Positionen (bei klaren Punkten reicht dieser Text als Spec, ROADMAP.md nur bei Unklarheit zusätzlich lesen):`,
        ...info!.checkliste!.offenTexte.map((x) => `  - ${x}`),
        ``,
      ]
    : [];
  // Grössen-Zeile ENTFERNT 15.8.2026 (Entscheid David, Chat «das mit der
  // grösse soll weg»). Mit der Steuerungs-Diät vom 29.8.2026 ist auch das
  // @meta-Feld `groesse:` selbst weg — es hatte nach dem Prompt-Ausbau keinen
  // Auswerter mehr ausser dem Lagebild-Badge.
  const zeilen = [
    // Erste Zeile = Skill-Auslöser: der Zyklus (Einstieg, Prüfung, Landung,
    // Aufräumen) steht im Skill `bauschritt`, nicht im Prompt. So bleibt der
    // Prompt kurz und der Ablauf an EINER Stelle pflegbar (§5).
    `Nutze den Skill \`bauschritt\` für den ganzen Session-Zyklus. Schritt: ${e.id}.`,
    // Token-Zeile auf Davids ausdrücklichen Wunsch IM Prompt (15.8.2026,
    // «verankere im bauprompt dass man tokensparend arbeiten soll») —
    // bewusste Ausnahme vom Nur-Schritt-Spezifisches-Prinzip; Detail-Regeln
    // bleiben im Skill (Token-Regeln) und in den lex-Definitionen.
    `Arbeite token-sparsam: delegieren statt selbst lesen, Slices statt Volltexte, kompakte Rückgaben (Token-Regeln: Skill \`bauschritt\`).`,
    ``,
    `Baue den LexMetrik-ROADMAP-Schritt ${e.id} — «${titel}».`,
    ``,
    ...(info?.prosa ? [`Auftrags-Wortlaut (aus ROADMAP.md, dort massgeblich und vollständig): ${info.prosa}`, ``] : []),
    ...dachZeilen,
    // Verschlankt 15.8.2026 (Auftrag David «Bau-Prompt simpler», Minimalismus-
    // Regel vom selben Tag): der Prompt trägt nur noch, was SCHRITT-SPEZIFISCH
    // ist. Gestrichen, weil wortgleich an der ladenden Stelle vorhanden —
    // Regelverlust-Tore in plan-bild-lage.test.ts frieren je Streichung ein:
    //  - Arbeitsweise/Delegation + DoD → Skill `auftrag` Ziff. 4/6 (Schritt-
    //    Aufnahme läuft ohnehin über ihn; wip-Push = bauschritt Station A 5).
    //  - Vertrauensgrenze §14.7 → für den Orchestrator CLAUDE.md (lädt immer);
    //    für Sub-Agenten seit 4.8. eingebaut in jede lex-Definition und vom
    //    Hook dispatch-schutz.py ERZWUNGEN — die Prompt-Kopie war dritter
    //    Träger derselben Klausel (§5).
    `Baufeld: ${e.etikett.feld ?? '— (keines deklariert; gilt als GESAMTE Fläche)'} · Worktree bei Parallel-Session (§12), sonst Haupt-Checkout mit explizitem Pathspec.`,
    ...depZeile,
    fp
      ? info?.par
        ? `Detail-Spec: npm run fahrplan -- ${fp} ${info.par}`
        : info?.ankerDefekt
          ? `Detail-Spec: npm run fahrplan -- ${fp} <§> — ACHTUNG: der in ROADMAP.md genannte Anker «§${info.ankerDefekt}» existiert in dieser Datei NICHT (verprobt bei Erzeugung). Richtigen § aus dem Inventar wählen (npm run fahrplan -- ${fp}) und den ROADMAP-Verweis im selben Zug korrigieren.`
          : `Detail-Spec: npm run fahrplan -- ${fp} <§> (den §-Verweis nennt der Schritt in ROADMAP.md).`
      : `Detail steht direkt im Schritt-Wortlaut in ROADMAP.md (kein eigener Fahrplan) — den Block dort VOLLSTÄNDIG lesen.`,
    ...pflichtZeilen,
    `Commit-Trailer: Roadmap: ${e.id} im PR-Body (letzter Absatz). Status fährt im eigenen PR mit: plan:set -- ${e.id} status=${istDach ? 'done NUR wenn keine Checklisten-Position mehr offen, sonst ready (bzw. parked(<token>))' : 'done|ready|parked(<token>)'} + check:plan — keine Auto-Buchung (plan-buchung.yml am 20.9.2026 abgebaut).`,
  ];
  return zeilen.join('\n');
}

// ---------------------------------------------------------------------------
// Gemeinsame Bausteine der Seiten
// ---------------------------------------------------------------------------
/** Status-Punkt-Klasse + Klartext-Etikett einer Katalog-Karte. */
function kartenStatus(status: string): { punkt: string; text: string } {
  if (status === 'entwurf') return { punkt: 'done', text: 'nutzbar (Entwurf)' };
  if (status === 'geprüft') return { punkt: 'wip', text: 'geprüft' };
  return { punkt: 'ready', text: 'in Vorbereitung' };
}

/** «2026-07-08» → «08.07.2026»; unbrauchbare Werte bleiben unverändert. */
function datumCh(iso: string | null): string {
  const m = (iso ?? '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : (iso ?? '—');
}

const SPRACHE_NAME: Record<string, string> = { de: 'Deutsch', fr: 'Französisch', it: 'Italienisch', rm: 'Rätoromanisch' };
const GERICHTSTYP_NAME: Record<string, string> = {
  bundesgericht: 'Bundesgericht',
  kantonal: 'kantonale Gerichte',
  bundesverwaltungsgericht: 'Bundesverwaltungsgericht',
  bundesstrafgericht: 'Bundesstrafgericht',
  bundespatentgericht: 'Bundespatentgericht',
};

// ===========================================================================
// 1. Lagebild (Index) — plan-bild.html
//
// FÜNF KLARTEXT-BLÖCKE (Umbau 8.9.2026, Auftrag David «mach es schlanker und
// übersichtlicher für mich»). Die Seite beantwortet genau vier Fragen:
//
//   1 «Wo stehen wir»              — drei Sätze und eine Ampel (im Kopf)
//   2 «Wartet auf dich»            — jeder offene Entscheid als Frage
//   3 «Läuft gerade»               — höchstens fünf Zeilen
//   4 «Als Nächstes»               — die ersten fünf der @queue
//   5 «Seit deinem letzten Blick»  — fünf Einzeiler
//
// Vier Bauregeln tragen den Umbau:
//
//  * **Erheben und Formulieren sind getrennt.** `lagebildSicht()` fragt Plan,
//    git und gh; `lagebildInhalt()` formuliert daraus und rührt NICHTS an der
//    Aussenwelt an. Nur so ist das Wortbudget prüfbar, ohne dass der Test die
//    Maschine misst, auf der er läuft (§6.7).
//  * **Kein Kürzel im Fliesstext.** Titel im Klartext, die ID nur als
//    `title`-Attribut (`klartextLabel`). Vorher stand alle 29 sichtbaren Wörter
//    ein Kürzel. Wer sie BRAUCHT — Bau-Sessions — findet sie vollständig auf
//    «Bau-Details» (`bildBau.ts`).
//  * **Die Gate-Prosa wird gezeigt, nicht weggeworfen.** `parseRoadmap` liefert
//    `blockers` mit dem VOLLEN Text jedes Gates; bis 8.9.2026 nahm diese Datei
//    nur `{ einheiten, queue }` und zeigte David den blossen Registernamen
//    («wartet auf: david-go-entstehung»), obwohl die ausformulierte Frage
//    danebenlag. Gruppiert wird nach GATE, nicht nach Schritt — drei Pakete an
//    einem Gate sind EINE Entscheidung, nicht drei.
//  * **Was nicht gelesen werden kann, wird gemeldet.** Eine `@david-fragen`-
//    Zeile ohne `· quelle:` fiel bisher stumm aus der Anzeige (verifiziert
//    8.9.2026: die einzige eingetragene Frage war David nie sichtbar). Die
//    Seite weist die Zahl der unlesbaren Zeilen jetzt aus (§8); der Regex-Fix
//    selbst ist ein eigener, deklarierter Schritt.
// ===========================================================================

/** Ein Arbeitspaket, so wie die Hauptseite es nennt: Klartext-Titel, ID nur als Tooltip. */
export interface PaketSicht {
  titel: string;
  id: string;
  feld: string | null;
}

/** Ein Entscheid, der bei David liegt — gruppiert nach Gate, nicht nach Paket. */
export interface GateSicht {
  /** Register-Name aus `@blockers` (technischer Schlüssel, klein ausgewiesen). */
  name: string;
  /** Der VOLLE Wortlaut des Gates aus ROADMAP.md. */
  text: string;
  pakete: PaketSicht[];
  /** Sagt das Gate selbst, dass es bewusst liegen bleibt? */
  zurueck: boolean;
  /** Wartezeit in Tagen; `null` = nicht erhoben oder bewusst zurückgestellt. */
  tage: number | null;
  /** Repo-relativer Fahrplan-Pfad des ersten Pakets, für den Detail-Verweis. */
  fahrplanPfad: string | null;
  fahrplanName: string | null;
  par: string | null;
}

/** Eine Zeile in «Läuft gerade». `statuswort` ist bereits Klartext (§Kommunikation). */
export interface LaufSicht {
  titel: string;
  /** Kürzel des Arbeitspakets; `null` bei einem PR ohne Schritt-Bezug. */
  id: string | null;
  feld: string | null;
  statuswort: string;
  /** Ampel-Punkt: läuft (wip), Problem (block), neutral (ready). */
  punkt: 'wip' | 'block' | 'ready';
  prNummer: number | null;
  prUrl: string | null;
}

/** Eine Zeile in «Als Nächstes». */
export interface NaechstSicht extends PaketSicht {
  /** Ein-Satz-Ziel aus dem Auftrags-Wortlaut; `null`, wenn der Schritt keinen trägt. */
  ziel: string | null;
  status: 'baubar' | 'laeuft' | 'wartet';
}

/** Eine Zeile in «Seit deinem letzten Blick erledigt». */
export interface ErledigtSicht {
  titel: string;
  wann: string;
  nummer: number | null;
  url: string | null;
}

/** Alles, was die Hauptseite anzeigt — bereits erhoben, nichts mehr zu holen. */
export interface LagebildSicht {
  zahlen: LageZahlen;
  gates: GateSicht[];
  fragen: { frage: string; quelle: string }[];
  /** `@david-fragen`-Zeilen, die der Parser NICHT lesen konnte (§8: nicht verschweigen). */
  fragenVerworfen: number;
  laeuft: LaufSicht[];
  /** Zeilen jenseits der fünf sichtbaren — sie stehen vollständig auf «Bau-Details». */
  laeuftRest: number;
  worktrees: string[];
  altBranches: number;
  /** Bau-Plätze, deren Schritt NICHT auf «wip» steht — Verdacht auf unangemeldeten Bau. */
  unangemeldet: string[];
  /** `true` = GitHub-Kommandozeile nicht verfügbar (Antrags-Status fehlt). */
  ghFehlt: boolean;
  naechste: NaechstSicht[];
  queueRest: number;
  /** `null` = nicht abfragbar (nicht: «nichts gelandet»). */
  erledigt: ErledigtSicht[] | null;
  bauLink: string;
  methodeLink: string;
  /** Erzeugungs-Zeitstempel und Selbst-Nachladen — nur für die Kopfzeile. */
  stand: string;
  watch: number | null;
}

/**
 * Die fünf Blöcke als HTML — REIN: gleiche Sicht ergibt gleiches Dokument (§2),
 * kein git, kein gh, keine Uhr. Das macht das Wortbudget prüfbar.
 */
export function lagebildInhalt(d: LagebildSicht): string {
  const zeile = (punkt: string, inhalt: string) => `<li><span class="s ${punkt}"></span><div>${inhalt}</div></li>`;

  // --- Block 2: Entscheide ---------------------------------------------------
  const gateKarte = (g: GateSicht): string => {
    const frage = gateFeld(g.text, 'frage');
    const optionen = gateFeld(g.text, 'optionen');
    const empfehlung = gateFeld(g.text, 'empfehlung');
    const titel =
      frage ??
      (g.pakete.length
        ? `Entscheid zu «${g.pakete[0].titel}»${g.pakete.length > 1 ? ` und ${g.pakete.length - 1} weiteren Paketen` : ''}`
        : `Entscheid «${g.name}»`);
    // Bei EINEM Paket wiederholte diese Zeile wörtlich die Überschrift — sie
    // trägt erst ab zwei Paketen Information (Wortbudget).
    const haengt = g.pakete.length > 1
      ? `<p class="haengt">Daran hängen ${g.pakete.length} Arbeitspakete: ${g.pakete.map((p) => klartextLabel(p.titel, p.id, false)).join(' · ')}</p>`
      : '';
    // Detail-Verweis relativ zur Ausgabedatei in `tmp/` — funktioniert unter file://.
    const detail = g.fahrplanPfad
      ? `<a href="../${esc(g.fahrplanPfad)}">Detail: ${esc(g.fahrplanName ?? g.fahrplanPfad)}${g.par ? ` §${esc(g.par)}` : ''}</a> · `
      : '';
    const seit = g.tage !== null && g.tage > 0 ? `wartet seit ${g.tage} Tag${g.tage === 1 ? '' : 'en'} · ` : '';
    return `<div class="gate">
    <h3>${esc(titel)}</h3>
    <p>${esc(g.text)}</p>
    ${haengt}
    ${optionen ? `<p><b>Optionen:</b> ${esc(optionen)}</p>` : ''}
    ${empfehlung ? `<p><b>Empfehlung:</b> ${esc(empfehlung)}</p>` : ''}
    <p class="quelle">${seit}${detail}Register-Name <span class="id">${esc(g.name)}</span></p>
  </div>`;
  };
  const offeneGates = d.gates.filter((g) => !g.zurueck);
  const ruhendeGates = d.gates.filter((g) => g.zurueck);
  const nichtsOffen = offeneGates.length === 0 && d.fragen.length === 0 && d.fragenVerworfen === 0;

  const block2 = `<section id="david">
  <p class="eyebrow">Deine Entscheidungen</p>
  <h2>Wartet auf dich</h2>
  ${nichtsOffen ? '<p class="lede">Nichts — im Moment hält kein Arbeitspaket auf deine Entscheidung.</p>' : ''}
  ${offeneGates.map(gateKarte).join('\n')}
  ${d.fragen.map((f) => `<div class="gate"><h3>${esc(f.frage)}</h3><p class="quelle">Fundstelle: ${esc(f.quelle)}</p></div>`).join('\n')}
  ${
    d.fragenVerworfen > 0
      ? `<p class="hinweis" style="color:var(--danger)">⚠ ${d.fragenVerworfen === 1 ? '1 Frage konnte nicht gelesen werden' : `${d.fragenVerworfen} Fragen konnten nicht gelesen werden`} (Formfehler im Block <span class="id">@david-fragen</span> in ROADMAP.md: es fehlt <span class="id">· quelle:</span>).</p>`
      : ''
  }
  ${
    ruhendeGates.length
      ? `<details style="margin-top:1rem"><summary>${ruhendeGates.length === 1 ? '1 Entscheid ist bewusst zurückgestellt' : `${ruhendeGates.length} Entscheide sind bewusst zurückgestellt`} — anzeigen</summary>
  ${ruhendeGates.map(gateKarte).join('\n')}</details>`
      : ''
  }
</section>`;

  // --- Block 3: was läuft ----------------------------------------------------
  const prVerweis = (l: LaufSicht) =>
    l.prNummer === null ? '' : l.prUrl ? ` · <a href="${esc(l.prUrl)}/pull/${l.prNummer}">Antrag #${l.prNummer}</a>` : ` · Antrag #${l.prNummer}`;
  const laufZeilen = d.laeuft.map((l) =>
    zeile(l.punkt, `${l.id ? klartextLabel(l.titel, l.id) : `<b>${esc(l.titel)}</b>`}${bereichsBadges(l.feld)}<br><span class="sub">${esc(l.statuswort)}${prVerweis(l)}</span>`),
  );

  const block3 = `<section id="laeuft">
  <p class="eyebrow">Im Bau</p>
  <h2>Läuft gerade</h2>
  <ul class="zeilen">${laufZeilen.join('\n') || zeile('ready', 'Nichts — kein Arbeitspaket im Bau, kein offener Antrag.')}</ul>
  ${d.laeuftRest > 0 ? `<p class="hinweis">… und ${d.laeuftRest} weitere unter <a href="${esc(d.bauLink)}">Bau-Details</a>.</p>` : ''}
  ${d.worktrees.length ? `<p class="hinweis">Parallele Arbeitskopien: ${esc(d.worktrees.join(' · '))}${d.altBranches ? ` · dazu ${d.altBranches} ältere Zweige ohne Arbeitskopie` : ''}.</p>` : ''}
  ${d.unangemeldet.length ? `<p class="hinweis" style="color:var(--warn)">⚠ Möglicherweise unangemeldeter Bau: ${esc(d.unangemeldet.join(' · '))}.</p>` : ''}
  ${d.ghFehlt ? '<p class="hinweis">⚠ GitHub-Kommandozeile nicht verfügbar — der Antrags-Status fehlt in dieser Ansicht.</p>' : ''}
</section>`;

  // --- Block 4: als Nächstes -------------------------------------------------
  const STATUSWORT: Record<NaechstSicht['status'], string> = { baubar: '', laeuft: ' <span class="chip wip">läuft</span>', wartet: ' <span class="chip block">wartet</span>' };
  const naechste = d.naechste
    .map((n) => `<li>${klartextLabel(n.titel, n.id)}${bereichsBadges(n.feld)}${STATUSWORT[n.status]}${n.ziel ? `<br><span class="sub">${esc(n.ziel)}</span>` : ''}</li>`)
    .join('\n');

  const block4 = `<section id="queue">
  <p class="eyebrow">Reihenfolge</p>
  <h2>Als Nächstes</h2>
  <ol class="queue">${naechste || '<li>Die Warteschlange ist leer.</li>'}</ol>
  <p class="hinweis">${d.queueRest > 0 ? `${d.queueRest} weitere warten · ` : ''}Alles Übrige: <a href="${esc(d.bauLink)}">Bau-Details</a>.</p>
</section>`;

  // --- Block 5: erledigt -----------------------------------------------------
  const erledigtZeilen =
    d.erledigt === null
      ? [zeile('ready', 'Die Projekt-Geschichte lässt sich auf diesem Rechner gerade nicht abfragen (GitHub-Kommandozeile fehlt).')]
      : d.erledigt.length === 0
        ? [zeile('ready', 'Noch nichts fertig geworden.')]
        : d.erledigt.map((e) =>
            zeile('done', `${esc(e.titel)} <span class="quelle">${esc(e.wann)}${e.nummer !== null ? ` · ${e.url ? `<a href="${esc(e.url)}/pull/${e.nummer}">#${e.nummer}</a>` : `#${e.nummer}`}` : ''}</span>`),
          );

  const block5 = `<section id="erledigt">
  <p class="eyebrow">Fertig</p>
  <h2>Seit deinem letzten Blick erledigt</h2>
  <ul class="zeilen">${erledigtZeilen.join('\n')}</ul>
</section>`;

  // --- Block 1: wo stehen wir (Kopf) ----------------------------------------
  const a = d.zahlen.ampel;
  const kopf = seitenKopf({
    stand: d.stand,
    watch: d.watch,
    marke: 'Lagebild',
    h1: 'LexMetrik — wo der Aufbau steht',
    lede: '',
    extra: `<p>${a ? (a.gruen ? '<span class="chip done">✓ Hauptstand gesund</span>' : '<span class="chip block">✗ Hauptstand ROT</span>') : '<span class="chip ready">Hauptstand unbekannt</span>'}</p>
  <p class="lage">${esc(lageSaetze(d.zahlen).join(' '))}</p>
  <nav class="springen">Springen zu: <a href="#david">Wartet auf dich</a> · <a href="#laeuft">Läuft gerade</a> · <a href="#queue">Als Nächstes</a> · <a href="#erledigt">Erledigt</a> · <a href="${esc(d.bauLink)}">Bau-Details</a> · <a href="${esc(d.methodeLink)}">Begriffe</a></nav>`,
  });

  return `${kopf}

${block2}

${block3}

${block4}

${block5}

${fussnote(`Das Kürzel jedes Arbeitspakets steht als Tooltip an seinem Titel. Fachbegriffe: <a href="${esc(d.methodeLink)}">Arbeitsweise &amp; Glossar</a>.`)}`;
}

/** Erhebung für die Hauptseite — der einzige Ort mit Plan-, git- und gh-Zugriff. */
export function lagebildSicht(o: SeitenOpts): LagebildSicht {
  const md = readFileSync('ROADMAP.md', 'utf8');
  const { einheiten, blockers, queue } = parseRoadmap(md);
  // Chronik-Wissen mitgeben, sonst zeigt das Lagebild andere Buckets als plan:next.
  const b: Buckets = resolve(einheiten, queue, ladeChronikDone());
  const schritte = schrittInfoAusRoadmap(md, postenTitelJeDach());
  const t = (id: string) => schritte.get(id)?.titel ?? id;
  const byId = new Map(einheiten.map((e) => [e.id, e]));
  const feldVon = (id: string) => byId.get(id)?.etikett.feld ?? null;
  const paket = (id: string): PaketSicht => ({ titel: t(id), id, feld: feldVon(id) });

  const offen = einheiten.filter((e) => e.etikett.status !== 'done');
  const baubar = new Set(b.readyNow);
  const prs = offenePrs();
  const { worktrees, altBranches } = worktreesUndBranches();
  const web = repoWebUrl();
  const gelandet = zuletztGelandet();

  // --- Entscheide, gruppiert nach GATE --------------------------------------
  const haengtAn = new Map<string, string[]>();
  for (const x of b.blockiert) {
    if (!haengtAn.has(x.blocker)) haengtAn.set(x.blocker, []);
    haengtAn.get(x.blocker)!.push(x.id);
  }
  const gates: GateSicht[] = Object.entries(blockers)
    .filter(([, text]) => istDavidGate(text))
    .map(([name, text]) => {
      const ids = haengtAn.get(name) ?? [];
      const zurueck = istZurueckgestellt(text);
      const fpPfad = ids.length ? (byId.get(ids[0])?.etikett.fahrplan ?? null) : null;
      return {
        name,
        text,
        pakete: ids.map(paket),
        zurueck,
        // Die Tages-Zählung kostet je Gate ein `git log -S` und erzeugt bei
        // einem ausdrücklich zurückgestellten Gate falschen Druck — darum nur
        // für die offenen Fragen erheben (Befund 8.9.2026).
        tage: zurueck ? null : blockerSeitTagen(name),
        fahrplanPfad: fpPfad,
        fahrplanName: fpPfad ? baustellenInfo(fpPfad).name : null,
        par: ids.length ? (schritte.get(ids[0])?.par ?? null) : null,
      };
    });

  // --- Was läuft -------------------------------------------------------------
  const laeuft: LaufSicht[] = b.inArbeit.map((id) => {
    const pr = (prs ?? []).find((p) => p.roadmapId === id);
    return {
      titel: t(id),
      id,
      feld: feldVon(id),
      statuswort: pr ? `läuft · ${pr.checks}` : 'läuft — noch kein offener Antrag',
      punkt: pr?.checks === 'Checks ROT' ? 'block' : 'wip',
      prNummer: pr?.number ?? null,
      prUrl: web,
    };
  });
  // Bibliotheks-Updates (Dependabot) sind keine Bauarbeit und werden zu EINER
  // Zeile gebündelt — sonst stehen sie gleichrangig neben den Arbeitspaketen
  // (Befund der Ist-Analyse 8.9.2026).
  const fremde = (prs ?? []).filter((p) => !b.inArbeit.includes(p.roadmapId ?? ''));
  const istBot = (p: PrInfo) => p.headRefName.startsWith('dependabot/') || /^(?:Bump|build\(deps)/i.test(p.title);
  for (const p of fremde.filter((x) => !istBot(x))) {
    laeuft.push({
      titel: p.title,
      id: p.roadmapId,
      feld: p.roadmapId ? feldVon(p.roadmapId) : null,
      statuswort: p.checks === 'Checks ROT' ? 'Problem: Prüfungen rot' : `läuft · ${p.checks}`,
      punkt: p.checks === 'Checks ROT' ? 'block' : 'wip',
      prNummer: p.number,
      prUrl: web,
    });
  }
  const bots = fremde.filter(istBot);
  if (bots.length) {
    laeuft.push({
      titel: bots.length === 1 ? '1 Bibliotheks-Update wartet' : `${bots.length} Bibliotheks-Updates warten`,
      id: null,
      feld: null,
      statuswort: `automatische Fremdpakete-Aktualisierung (${bots.map((p) => `#${p.number}`).join(' · ')}) — keine Bauarbeit`,
      punkt: 'ready',
      prNummer: null,
      prUrl: null,
    });
  }

  // wip-Verstoss-Sonde: ein Bau-Platz, dessen Name zu einem Schritt passt, der
  // NICHT auf wip steht, deutet auf unangemeldeten Bau — genau die Lücke, die
  // diese Anzeige sonst still falsch aussehen lässt.
  const slug = (id: string) => id.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const alleNamen = [...worktrees, ...branchNamen()];
  const unangemeldet: string[] = [];
  for (const e of einheiten) {
    if (e.etikett.status === 'wip' || e.etikett.status === 'done') continue;
    const treffer = alleNamen.find((n) => n.toLowerCase().includes(slug(e.id)));
    if (treffer) unangemeldet.push(`${t(e.id)} (Bau-Platz «${treffer}»)`);
  }

  // --- Als Nächstes und Erledigtes ------------------------------------------
  const naechste: NaechstSicht[] = queue.slice(0, 5).map((id) => {
    return {
      ...paket(id),
      ziel: zielSatz(schritte.get(id)?.prosa ?? '', id),
      status: byId.get(id)?.etikett.status === 'wip' ? 'laeuft' : baubar.has(id) ? 'baubar' : 'wartet',
    };
  });

  const kurzTitel = (s: string) => s.split(' — ')[0].replace(/\s*\(#\d+\)\s*$/, '').trim();
  const tag = (iso: string) => new Date(iso).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const erledigt = gelandet === null ? null : gelandet.map((p) => ({ titel: kurzTitel(p.title), wann: tag(p.mergedAt), nummer: p.number, url: web }));

  const fragen = davidFragen(md);
  const erstes = gelandet?.[0] ?? null;

  return {
    zahlen: {
      offen: offen.length,
      baubar: baubar.size,
      imBau: b.inArbeit.length,
      entscheide: gates.filter((g) => !g.zurueck).length + fragen.length,
      ampel: mainAmpel(),
      zuletzt: erstes ? { titel: kurzTitel(erstes.title), wann: tag(erstes.mergedAt) } : null,
    },
    gates,
    fragen,
    fragenVerworfen: davidFragenVerworfen(md),
    laeuft: laeuft.slice(0, 5),
    laeuftRest: Math.max(0, laeuft.length - 5),
    worktrees,
    altBranches,
    unangemeldet,
    ghFehlt: prs === null,
    naechste,
    queueRest: Math.max(0, queue.length - naechste.length),
    erledigt,
    bauLink: seitenDatei(o.indexPfad, 'bau'),
    methodeLink: seitenDatei(o.indexPfad, 'methode'),
    stand: o.stand,
    watch: o.watch,
  };
}

export function lagebildSeite(o: SeitenOpts): string {
  return rahmen({
    indexPfad: o.indexPfad,
    aktiv: 'lagebild',
    titel: `LexMetrik — Lagebild ${o.stand}`,
    watch: o.watch,
    inhalt: lagebildInhalt(lagebildSicht(o)),
  });
}

// ===========================================================================
// 2. Projekt & Produkt — plan-bild-projekt.html
// ===========================================================================
function werkzeugGruppenHtml(modus: 'rechner' | 'vorlage'): string {
  return katalogGruppen(modus)
    .map((g) => {
      const nutzbar = g.karten.filter((k) => k.status !== 'geplant').length;
      const eintraege = g.karten
        .map((k) => {
          const s = kartenStatus(k.status);
          return `<li><span class="s ${s.punkt}" title="${esc(s.text)}"></span><span>${esc(k.titel)} <span class="sub">${esc(s.text)}</span></span></li>`;
        })
        .join('\n');
      return `<div class="gruppe">
  <h3><span>${esc(g.titel)}</span> <span class="fortschritt">${nutzbar} nutzbar · ${g.karten.length - nutzbar} in Vorbereitung · ${g.karten.length} insgesamt</span></h3>
  <ul class="eintraege">${eintraege}</ul>
</div>`;
    })
    .join('\n');
}

function bundTabelleHtml(erlasse: NormErlass[]): string {
  const bund = erlasse
    .filter((e) => e.ebene === 'bund')
    .sort((a, b) => (a.rang ?? 9999) - (b.rang ?? 9999) || (a.sr ?? '').localeCompare(b.sr ?? '', 'de-CH'));
  const zeilen = bund.map((e) => [e.kuerzel, e.titel, e.sr ?? '—', String(e.artikelAnzahl ?? 0), e.stand ?? '—']);
  return tabelle(['Kürzel', 'Titel', 'SR-Nummer', 'Artikel', 'Stand'], zeilen, ['', 'titel', '', 'num', '']);
}

function kantonRasterHtml(zaehlung: Record<string, number>): string {
  const felder = KANTONE.map((k) => {
    const n = zaehlung[k];
    return `<div${n ? '' : ' class="leer"'}><b>${n ?? '—'}</b><span>${k}</span></div>`;
  }).join('\n    ');
  return `<div class="kantone">\n    ${felder}\n  </div>`;
}

export function projektSeite(o: SeitenOpts): string {
  const norm = normRegister();
  const rspr = rechtsprechungRegister();
  const kat = katalogZaehlung();
  const werkzeugeLive = kat.entwurf + kat['geprüft'];

  const kopf = seitenKopf({
    stand: o.stand,
    watch: o.watch,
    marke: 'Projekt & Produkt',
    h1: 'Was LexMetrik ist — und was heute darin steckt',
    lede: 'Alle Zahlen dieser Seite sind ausgezählt: aus dem Werkzeug-Katalog, dem Norm-Register und dem Rechtsprechungs-Register. Nichts ist geschätzt, nichts gerundet.',
  });

  // --- Werkzeuge ---------------------------------------------------------
  const werkzeugeAbschnitt = `<section id="werkzeuge">
  <p class="eyebrow">Werkzeuge</p>
  <h2>Rechner und Vorlagen</h2>
  <p class="lede">Jedes Werkzeug rechnet nach festen Regeln: gleiche Eingabe, gleiches Ergebnis, jederzeit nachvollziehbar.
  Keine Schätzung, keine KI im Ergebnis.</p>
  ${kacheln([
    { wert: werkzeugeLive || null, label: 'Werkzeuge nutzbar (Status «Entwurf»)' },
    { wert: kat.geplant || null, label: 'in Vorbereitung (geplant)' },
    { wert: kat.entwurf + kat['geprüft'] + kat.geplant, label: 'Einträge im Katalog insgesamt' },
    { wert: kat['geprüft'], label: 'fachlich abgenommen («geprüft»)' },
  ])}
  <p class="hinweis">Zählweise: jede Karte des Katalogs <span class="id">ALLE_KARTEN</span> genau einmal.
  «Geprüft» steht heute bei <b>${kat['geprüft']}</b> Einträgen — diese Stufe wird nie automatisch vergeben (§7).</p>

  <h3 style="margin-top:2rem">Rechner</h3>
  ${werkzeugGruppenHtml('rechner')}

  <h3 style="margin-top:2rem">Vorlagen</h3>
  ${werkzeugGruppenHtml('vorlage')}
</section>`;

  // --- Gesetzes-Korpus ---------------------------------------------------
  let korpusAbschnitt: string;
  if (!norm) {
    korpusAbschnitt = `<section id="korpus">
  <p class="eyebrow">Gesetze lesen</p>
  <h2>Gesetzes-Korpus</h2>
  <p class="hinweis">⚠ <span class="id">public/normtext/register.json</span> nicht lesbar — dieser Abschnitt entfällt.</p>
</section>`;
  } else {
    const bund = norm.erlasse.filter((e) => e.ebene === 'bund');
    const kanton = norm.erlasse.filter((e) => e.ebene === 'kanton');
    const artikelGesamt = norm.erlasse.reduce((a, e) => a + (e.artikelAnzahl ?? 0), 0);
    const bundStatus = normStatusZaehlung(norm.erlasse, 'bund');
    const kantonStatus = normStatusZaehlung(norm.erlasse, 'kanton');
    const kantonZaehlung = normKantonZaehlung(norm.erlasse);
    const besetzt = KANTONE.filter((k) => kantonZaehlung[k]).length;
    const abweichend = (st: Record<string, number>) =>
      Object.entries(st).filter(([k]) => k !== 'snapshot').map(([k, n]) => `${n}× «${k}»`).join(' · ');
    const bundAbw = abweichend(bundStatus);
    const kantonAbw = abweichend(kantonStatus);

    korpusAbschnitt = `<section id="korpus">
  <p class="eyebrow">Gesetze lesen</p>
  <h2>Gesetzes-Korpus</h2>
  <p class="lede">Bundesrecht und kantonales Recht als treue Volltexte — jeder Erlass mit amtlicher Quelle, Stand und
  Live-Link auf die geltende Fassung. Massgeblich ist immer die amtliche Fassung, nie unsere Kopie.</p>
  ${kacheln([
    { wert: bund.length, label: 'Bundeserlasse' },
    { wert: kanton.length, label: 'kantonale Erlasse' },
    { wert: `${besetzt} / 26`, label: 'Kantone mit mindestens einem Erlass' },
    { wert: artikelGesamt.toLocaleString('de-CH'), label: 'Artikel insgesamt' },
  ])}
  <p class="hinweis">Zählweise: ein Eintrag im Register <span class="id">public/normtext/register.json</span> = ein Erlass;
  «Artikel insgesamt» ist die Summe des Feldes <span class="id">artikelAnzahl</span> über alle Erlasse.
  Register-Stand: ${esc(norm.erzeugt)}.</p>
  <p class="hinweis">Ehrliche Aufschlüsselung des Speicher-Zustands (Feld <span class="id">status</span>):
  Bund — ${bundStatus['snapshot'] ?? 0} als gespeicherter Volltext${bundAbw ? `, daneben ${esc(bundAbw)} (kein durchsuchbarer Volltext, nur Verweis bzw. PDF)` : ''}.
  Kantone — ${kantonStatus['snapshot'] ?? 0} als gespeicherter Volltext${kantonAbw ? `, daneben ${esc(kantonAbw)}` : ''}.
  Die abweichenden Einträge werden hier <b>ausgewiesen, nicht als Volltext mitgezählt</b>.</p>

  <details style="margin-top:1.4rem">
    <summary>Alle ${bund.length} Bundeserlasse im Einzelnen (Kürzel · Titel · SR-Nummer · Artikel · Stand)</summary>
    ${bundTabelleHtml(norm.erlasse)}
  </details>

  <h3 style="margin-top:1.8rem">Kantone im Überblick</h3>
  <p class="sub">Anzahl erfasster Erlasse je Kanton; «—» heisst: noch kein Erlass im Korpus.</p>
  ${kantonRasterHtml(kantonZaehlung)}
</section>`;
  }

  // --- Rechtsprechung ----------------------------------------------------
  let rsprAbschnitt: string;
  if (!rspr) {
    rsprAbschnitt = `<section id="rechtsprechung">
  <p class="eyebrow">Gerichtsentscheide</p>
  <h2>Rechtsprechung</h2>
  <p class="hinweis">⚠ <span class="id">public/rechtsprechung/register.json</span> nicht lesbar — dieser Abschnitt entfällt.</p>
</section>`;
  } else {
    const e = rspr.entscheide;
    const daten = e.map((x) => x.datum).filter((d): d is string => !!d).sort();
    const typen = zaehleNach(e, (x) => x.gerichtstyp);
    const sprachen = zaehleNach(e, (x) => x.sprache);
    const gerichte = zaehleNach(e, (x) => x.gerichtName);
    // ACHTUNG: `leitcharakter` ist KEIN Wahrheitswert, sondern eine Einstufung
    // («leitentscheid» oder «routine»). Eine Truthy-Prüfung zählte alle 6341
    // Entscheide als Leitentscheide — hier wird auf den Wert geprüft.
    const leit = e.filter((x) => x.leitcharakter === 'leitentscheid').length;
    const bundGerichte = Object.entries(typen).filter(([k]) => k !== 'kantonal').reduce((a, [, n]) => a + n, 0);
    const sprachText = Object.entries(sprachen)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${SPRACHE_NAME[k] ?? k}: ${n}`)
      .join(' · ');
    const typText = Object.entries(typen)
      .sort((a, b) => b[1] - a[1])
      .map(([k, n]) => `${GERICHTSTYP_NAME[k] ?? k}: ${n}`)
      .join(' · ');
    const gerichteZeilen = Object.entries(gerichte)
      .sort((a, b) => b[1] - a[1])
      .map(([name, n]) => [name, String(n)]);

    rsprAbschnitt = `<section id="rechtsprechung">
  <p class="eyebrow">Gerichtsentscheide</p>
  <h2>Rechtsprechung</h2>
  <p class="lede">Entscheide des Bundesgerichts, der eidgenössischen Vorinstanzen und kantonaler Gerichte — durchsuchbar
  und mit den zitierten Normen verknüpft.</p>
  ${kacheln([
    { wert: e.length, label: 'Entscheide insgesamt' },
    { wert: daten.length ? `${datumCh(daten[0]).slice(6)}–${datumCh(daten[daten.length - 1]).slice(6)}` : null, label: 'erfasster Zeitraum (Jahre)' },
    { wert: typen['bundesgericht'] ?? 0, label: 'vom Bundesgericht' },
    { wert: typen['kantonal'] ?? 0, label: 'von kantonalen Gerichten' },
    { wert: leit, label: 'als Leitentscheid eingestuft' },
  ])}
  <p class="hinweis">Zählweise: ein Eintrag im Register <span class="id">public/rechtsprechung/register.json</span> = ein Entscheid.
  Zeitraum genau: ${esc(daten.length ? `${datumCh(daten[0])} bis ${datumCh(daten[daten.length - 1])}` : '—')}.
  Gerichtstypen: ${esc(typText)} (${bundGerichte} eidgenössisch, ${typen['kantonal'] ?? 0} kantonal).
  Sprachen: ${esc(sprachText)}. Register-Stand: ${esc(rspr.erzeugt)}.</p>

  <details style="margin-top:1.4rem">
    <summary>Entscheide je Gericht (${gerichteZeilen.length} Gerichte)</summary>
    ${tabelle(['Gericht', 'Entscheide'], gerichteZeilen, ['titel', 'num'])}
  </details>
</section>`;
  }

  const inhalt = `${kopf}

<section id="was">
  <p class="eyebrow">Selbstbeschreibung</p>
  <h2>Was ist LexMetrik?</h2>
  <p class="lede">${WAS_IST_LEXMETRIK}</p>
  <p class="lede">${esc(STATUS_SATZ)}</p>
  <p class="hinweis">Wie dabei gearbeitet wird — Bahnen, Prüfungen, Begriffe — steht auf
  <a href="${esc(seitenDatei(o.indexPfad, 'methode'))}">Arbeitsweise &amp; Glossar</a>.</p>
</section>

<section id="karte">
  <p class="eyebrow">Gesamtkarte</p>
  <h2>Wo wir auf dem Weg zum Nordstern stehen</h2>
  <p class="lede">Die Monatsangaben des Gesamtaufbau-Plans sind Reihenfolge, keine Termine.
  <span class="sub">(Hierher gezogen vom Lagebild — dort stehen seit 8.8.2026 nur noch bautechnische Angaben.)</span></p>
  <div class="phasen">${PHASEN.map(
    (p) => `<div class="phase ${p.stand}"><span class="dot"></span><span class="t"><b>${esc(p.name)}</b>${p.stand === 'now' ? ' <span class="chip gold">hier stehen wir</span>' : p.stand === 'done' ? ' <span class="chip done">erledigt</span>' : ''}<span class="sub">${esc(p.kurz)}</span></span></div>`,
  ).join('\n')}</div>
</section>

${werkzeugeAbschnitt}

${korpusAbschnitt}

${rsprAbschnitt}

${fussnote('Werkzeug-Zahlen aus dem Katalog, Korpus-Zahlen aus den beiden Registern — dieselben Quellen wie die Kacheln des Lagebilds.')}`;

  return rahmen({ indexPfad: o.indexPfad, aktiv: 'projekt', titel: `LexMetrik — Projekt & Produkt ${o.stand}`, watch: o.watch, inhalt });
}

// ===========================================================================
// 3. Geschichte & Bau-Statistik — plan-bild-geschichte.html
// ===========================================================================
// Liegt seit dem §6.6-Split vom 7.8.2026 in `bildGeschichte.ts` (liest nur
// rückwärts: Chronik, git-Historie, Zähler). Hier nur die Fassade, damit der
// bestehende Import in `bild.ts` unverändert gültig bleibt — dasselbe Muster
// wie bei `methodeSeite` darunter.
export { geschichteSeite } from './bildGeschichte';

// ===========================================================================
// 4. Arbeitsweise & Glossar — plan-bild-methode.html
// ===========================================================================
// Liegt seit dem §6.6-Split vom 5.8.2026 in `bildMethode.ts` (rein statische
// Seite, keine Datenquelle). Hier nur die Fassade, damit der bestehende Import
// in `bild.ts` unverändert gültig bleibt.
export { methodeSeite } from './bildMethode';
export type { SeitenOpts } from './bildHtml';
