// ─── check:verweis-inventar — Verweis-Inventar des Normtext-Korpus (V-1) ─────
//
// Anlass: Auftrag David 31.8.2026 (Verweis-Schärfe), Fahrplan
// `fahrplaene/FAHRPLAN-VERWEIS-SCHAERFE.md` §1 · V-1. Bis hierher existierte
// KEINE Messung, wie viele Verweis-Stellen der Korpus trägt und wie sie
// aufgelöst werden — die einzigen Zahlen standen als Kommentar in
// `NormText.tsx` (F41: «199 Self-Links») und in einem datierten Messbericht
// (`bibliothek/normtext/verweis-inventar-messung-2026-08-31.md`). Kommentar-
// Zahlen altern still; dieses Tor ersetzt sie durch ein reproduzierbares,
// committetes Artefakt (`messwerte/verweis-inventar.json`).
//
// WAS GEMESSEN WIRD. Je Formklasse (= eine Stelle im Entscheidbaum, an der
// über Link/kein-Link entschieden wird): Zahl der Stellen, Zahl der Erlasse,
// der Entscheid (SELF / FREMD / TEXT) und die Zahl der Stellen mit explizitem
// SELBSTMARKER («dieses Gesetzes», «des vorliegenden Gesetzes» …). Dazu DREI
// Sonderlisten: tote Selbstziele (Selbstmarker-Verweis auf eine Bestimmung,
// die es im Erlass nicht gibt), tote FREMD-Anker (Z6c, W2·22 — Verweis in
// einen ANDEREN Erlass, dessen Snapshot die zitierte Bestimmung nicht kennt)
// und Zeit-Kanten-Stellen (Selbstmarker in Übergangs-/Altrecht-Kontext; nur
// Zählung, siehe V-5).
//
// Wie der Z6c-Nachschlag arbeitet (Resolver, die vier Lagen) und wie zwei
// Messungen verglichen werden, steht in `verweis-inventar-messung.ts` §3b/§3c.
//
// ─── TRANSKRIPTION (§8-Offenlegung, bindend lesen) ──────────────────────────
//
// Die produktive Entscheidkette lebt in `restMitIntern` / `selbstSpanSprung`
// (`src/components/NormText.tsx`) und in `etabliertFremdgesetz`
// (`src/components/normtext/ArtikelBody.tsx`). Alle drei sind React-interne,
// NICHT exportierte Funktionen. Das Tor arbeitet darum mit einer
// TRANSKRIPTION der Guards, nicht mit dem Original — sie steht in
// `scripts/verweis-inventar-transkription.ts` (§6.6-Trennung: dort WAS die
// Produktion tut, hier WIE gemessen und verglichen wird):
//
//   · Die ERKENNER sind die echten Produktions-Funktionen (importiert):
//     normVerweiseImText, fremdgesetzNachArtikel, fremdRoutingFormB,
//     artikelnPluralVerweise, chapeauZielFremdgesetz, erkenneFedlexGesetz —
//     keine zweite Regex-Wahrheit über das, was ein Verweis IST (§5).
//   · Die GUARDS (ART_INTERN, PARAGRAF_INTERN, PARAGRAF_ANHANG,
//     PARAGRAF_FREMD_GROSS/-NAME, des/der-Guard, M12, SELBST_MARKER,
//     nenntEigenesKuerzel, normRef, kuerzelKanon, etabliertFremdgesetz) sind
//     als Zeichenketten transkribiert.
//   · Diese Zeichenketten sind zugleich (a) der Vergleichs-Massstab des
//     Wächters gegen den Quelltext UND (b) die Quelle der compilierten
//     RegExp (`re()`). Eine Transkription, die vom Original abweicht,
//     kann darum nicht still danebenliegen — sie reisst den Wächter.
//   · Zusätzlich hält das Artefakt den SHA-256 von `NormText.tsx`. Ändert
//     jemand die Datei (auch die Entscheid-REIHENFOLGE, die kein Literal-
//     Vergleich sieht), wird das Tor rot und verlangt eine bewusste
//     Regeneration der Basislinie.
//
// Die GRENZEN der Messung (§8: Text-Umfang, Leser-Kontext, was die Spalte
// `selbstmarker` zählt, Zeit-Kante als Indiz) stehen bei der Mess-Maschine,
// `verweis-inventar-messung.ts` §0 — dort, wo sie entstehen.
//
// BASISLINIEN-MODELL (Vorbild `check:ui-normzitate`): das Artefakt ist
// committet; das Tor rechnet neu und vergleicht. Jede Abweichung ist ROT.
// Bewusste Änderungen (Korpus-Nachzug, Erkenner-Umbau, V-2/V-3) regenerieren
// das Artefakt IM SELBEN Commit:
//
//   npm run check:verweis-inventar -- --schreiben
//
// Determinismus (§2): keine Zeitstempel im Artefakt, stabile Sortierung
// (Klassen alphabetisch, Sonderlisten nach Fundstelle).
//
// Scheiterns-Fähigkeit (§6.7): ein Selbsttest jagt bei JEDEM Lauf ein Dutzend
// synthetischer Texte durch dieselbe Pipeline — je einen pro Weiche, die drei
// V-2-Ziele eingeschlossen — und prüft die erwartete Klassenzuordnung; stimmt
// eine nicht, bricht das Tor sich selbst ab.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { relative } from 'node:path';
import { waechterGuards } from './verweis-inventar-transkription';
// Die Mess-Maschine (Korpus-Lauf, Aggregation, Sonderlisten, Selbsttest) steht
// in `verweis-inventar-messung.ts` — hier lebt nur das Tor: CLI, Wächter,
// Basislinien-Vergleich, Bericht (§6.6-Trennung, 31.8.2026).
import {
  ARTEFAKT_PFAD, WURZEL, berechne, selbsttest, vergleicheListe, vergleicheZahlen,
  type Artefakt, type TotesZiel, type TotesFremdziel,
} from './verweis-inventar-messung';

// ─── 7 · Lauf ───────────────────────────────────────────────────────────────

const schreiben = process.argv.includes('--schreiben');

const guardFehler = waechterGuards();
if (guardFehler.length > 0) {
  console.error(
    'check:verweis-inventar ROT — die transkribierten Guards weichen vom Quelltext ab.\n'
    + 'Das Tor misst dann etwas anderes als die Produktion tut. Transkription in\n'
    + 'scripts/verweis-inventar-transkription.ts nachziehen UND Basislinie neu schreiben:',
  );
  for (const f of guardFehler) console.error(`  · ${f}`);
  process.exit(1);
}

selbsttest();

const ist = berechne();
const alsText = `${JSON.stringify(ist, null, 2)}\n`;

if (schreiben) {
  writeFileSync(ARTEFAKT_PFAD, alsText);
  console.log(
    `Basislinie geschrieben: ${ist.gesamt.stellen} Stellen · ${ist.klassen.length} Klassen · `
    + `${ist.toteSelbstziele.length} tote Selbstziele → ${relative(WURZEL, ARTEFAKT_PFAD)}`,
  );
  process.exit(0);
}

if (!existsSync(ARTEFAKT_PFAD)) {
  console.error(
    `check:verweis-inventar ROT — Basislinie fehlt (${relative(WURZEL, ARTEFAKT_PFAD)}).\n`
    + '  Erzeugen: npm run check:verweis-inventar -- --schreiben',
  );
  process.exit(1);
}

const soll = JSON.parse(readFileSync(ARTEFAKT_PFAD, 'utf8')) as Artefakt;

console.log(
  `check:verweis-inventar — ${ist.korpus.erlasse} Erlasse · ${ist.korpus.eintraege} Bestimmungen · `
  + `${ist.gesamt.stellen} Verweis-Stellen (SELF ${ist.gesamt.self} · FREMD ${ist.gesamt.fremd} · `
  + `TEXT ${ist.gesamt.text}) · Selbstmarker ${ist.gesamt.selbstmarker} · `
  + `tote Selbstziele ${ist.toteSelbstziele.length} · Zeit-Kanten ${ist.zeitKanten.stellen}`,
);
console.log(
  `  Z6c Fremd-Anker: ${ist.fremdZiele.geprueft} prüfbar (Ziel im Korpus) · `
  + `${ist.fremdZiele.tot} tot, davon ${ist.fremdZiele.sammelblock} in einem Sammelblock · `
  + `${ist.fremdZiele.ohneSnapshot} ohne Snapshot (nicht prüfbar).`,
);

const abweichungen: string[] = [];
if (soll._quellen?.normTextSha256 !== ist._quellen.normTextSha256) {
  abweichungen.push(
    `NormText.tsx hat sich geändert (SHA-256 ${String(soll._quellen?.normTextSha256).slice(0, 12)} → `
    + `${ist._quellen.normTextSha256.slice(0, 12)}). ZUERST die Transkription `
    + '(scripts/verweis-inventar-transkription.ts) gegen die NEUE Entscheidkette prüfen — ein '
    + 'zugefügter oder umgestellter Guard ändert '
    + 'die Auflösung, ohne ein Literal zu entfernen, und wäre für den Literal-Wächter unsichtbar. '
    + 'ERST danach die Basislinie neu schreiben; ein blosses Regenerieren macht das Tor grün über '
    + 'eine Messung, die die Produktion nicht mehr abbildet.',
  );
}
const zeileSoll = new Map((soll.klassen ?? []).map((z) => [z.klasse, z]));
for (const z of ist.klassen) {
  const s = zeileSoll.get(z.klasse);
  if (!s) { abweichungen.push(`Klasse «${z.klasse}» ist NEU (${z.stellen} Stellen).`); continue; }
  if (s.stellen !== z.stellen || s.erlasse !== z.erlasse || s.selbstmarker !== z.selbstmarker) {
    abweichungen.push(
      `${z.klasse}: Stellen ${s.stellen} → ${z.stellen} · Erlasse ${s.erlasse} → ${z.erlasse} · `
      + `Selbstmarker ${s.selbstmarker} → ${z.selbstmarker}`,
    );
  }
}
for (const z of soll.klassen ?? []) {
  if (!ist.klassen.some((k) => k.klasse === z.klasse)) abweichungen.push(`Klasse «${z.klasse}» ist WEGGEFALLEN.`);
}
abweichungen.push(...vergleicheZahlen('korpus', soll.korpus, ist.korpus, ['erlasse', 'eintraege', 'texte']));
abweichungen.push(...vergleicheListe<TotesZiel>(
  'Totes Selbstziel', soll.toteSelbstziele, ist.toteSelbstziele,
  (t) => `${t.fundstelle}|${t.bestimmung}`,
));
// Z6c (W2·22): dieselbe Mechanik eine Ebene weiter — das Ziel ist ein ANDERER
// Erlass. Ein neuer Erkenner-Pfad, der mehr Stellen verlinkt, darf keine neue
// Anker-Leiche erzeugen (§1); darum ist jeder Zuwachs rot.
abweichungen.push(...vergleicheListe<TotesFremdziel>(
  'Toter Fremd-Anker', soll.toteFremdanker, ist.toteFremdanker,
  (t) => `${t.fundstelle}|${t.quelle}/${t.token}`,
  (s2, i2) => ((s2.sammelblock ?? null) === (i2.sammelblock ?? null) ? null
    : `Sammelblock ${s2.sammelblock ?? '—'} → ${i2.sammelblock ?? '—'}`),
));
abweichungen.push(...vergleicheZahlen('fremdZiele', soll.fremdZiele, ist.fremdZiele,
  ['geprueft', 'tot', 'sammelblock', 'ohneSnapshot']));
abweichungen.push(...vergleicheZahlen('zeitKanten', soll.zeitKanten, ist.zeitKanten,
  ['stellen', 'erlasse', 'uebergangsTitel', 'altrechtBlock']));

if (abweichungen.length > 0) {
  console.error(`check:verweis-inventar ROT — ${abweichungen.length} Abweichung(en) gegen die Basislinie:`);
  for (const a of abweichungen) console.error(`  · ${a}`);
  console.error(
    '\n  Bewusste Änderung? Basislinie IM SELBEN Commit regenerieren:\n'
    + '    npm run check:verweis-inventar -- --schreiben',
  );
  process.exit(1);
}

console.log('check:verweis-inventar GRÜN — Inventar deckungsgleich mit der Basislinie.');

