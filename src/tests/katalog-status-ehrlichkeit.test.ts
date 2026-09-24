// ─── Status-Ehrlichkeit Katalog (§8, §7) — RL-12, W2·30-RL-W1 ─────────────────
// Befunde R3-04/R3-05/R3-07 (Prüfung Rechtslogik 23.9.2026): Karten mit
// status 'entwurf' behaupteten «amtlich verifiziert» (betreibungskosten,
// prozesskosten) bzw. «amtlich abgenommen» (schlichtungsgesuch,
// klage-vereinfacht); die Vorlagen-Seite der Klage im vereinfachten
// Verfahren wiederholte das. Das Status-Modell zeigt den echten
// Prüfungsstand (§8); «geprüft»/Abnahme setzt Davids fachliche Abnahme voraus
// (§7) — kein Katalog-Eintrag trägt heute status 'geprüft'.
//
// Regel für jeden Eintrag mit status ≠ 'geprüft' (Anzeigetexte: title, kurz,
// description, note, formvorschrift, szenarien[].label):
//   (a) «amtlich verifiziert/abgenommen/geprüft» (jede Flexion) — nie;
//   (b) «abgenommen…» — nie (die Abnahme ist Davids Akt, §7);
//   (c) «verifiziert…»/«geprüft…» — nur, wenn derselbe Text die Offenlegung
//       mitträgt («nicht abgenommen», «Abnahme ausstehend/offen», «fachlich
//       nicht geprüft»). Vorbild: notariat-grundbuch «Doppelt verifiziert,
//       nicht abgenommen» (UMSETZUNGSPLAN RL-12, «Vorbild-Formel»).
// Negiert gebrauchte Wörter («nicht geprüft», «noch nicht abgenommen») und
// Zusammensetzungen («ungeprüft», «Kostenfreiheits-Prüfung») sind KEIN
// Anspruch: Wortgrenze per Unicode-Lookbehind (JS-\b kennt «ü» nicht).
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { ALLE_KARTEN } from '../lib/startseiteConfig';

const VOR = '(?<![\\p{L}\\p{N}])';
const ANSPRUCH = new RegExp(`${VOR}(?:amtlich\\p{L}*\\s+)?(verifizier|abgenommen|geprüft|geprueft)\\p{L}*`, 'giu');
const NEGATION_DAVOR = new RegExp(`${VOR}(?:nicht|nie|kein\\p{L}*)\\s+(?:(?:fachlich|abschliessend|amtlich|noch)\\s+)*$`, 'iu');
const OFFENLEGUNG = new RegExp(
  `${VOR}(?:nicht|noch nicht)\\s+(?:fachlich\\s+)?(?:abgenommen|geprüft)|${VOR}Abnahme\\s+(?:ausstehend|offen)`,
  'iu',
);

/** Liefert die Anspruchs-Treffer eines Anzeigetexts, die die Regel verletzen. */
function statusAnsprueche(text: string): string[] {
  const verstoesse: string[] = [];
  for (const m of text.matchAll(ANSPRUCH)) {
    const davor = text.slice(Math.max(0, (m.index ?? 0) - 40), m.index);
    if (NEGATION_DAVOR.test(davor)) continue;
    const amtlich = /^amtlich/iu.test(m[0]);
    const abnahme = m[1].toLowerCase() === 'abgenommen';
    if (amtlich || abnahme || !OFFENLEGUNG.test(text)) verstoesse.push(m[0]);
  }
  return verstoesse;
}

describe('statusAnsprueche — Regel selbst (keine Fehlalarme, keine Lücke)', () => {
  it.each([
    ['Tarif Wert für Wert amtlich verifiziert', ['amtlich verifiziert']],
    ['amtlich verifizierte Tarife aller 26 Kantone', ['amtlich verifizierte']],
    ['Spezial-Routing amtlich abgenommen für Basel-Stadt', ['amtlich abgenommen']],
    ['BS: abgenommenes Zivil-/Arbeitsgericht-Routing', ['abgenommenes']],
    ['Normen geprüft', ['geprüft']],
    ['Doppelt verifiziert, amtlich abgenommen', ['verifiziert', 'amtlich abgenommen']],
    ['nicht abgenommen, aber amtlich abgenommen für BS', ['amtlich abgenommen']],
  ])('rot: %s', (text, soll) => expect(statusAnsprueche(text)).toEqual(soll));
  it.each([
    'Doppelt verifiziert, nicht abgenommen.',
    'erstellt, fachlich noch nicht geprüft',
    'zweifach geprüfte Recherche (fachliche Abnahme ausstehend)',
    'ungeprüft · Kostenfreiheits-Prüfung · prüft nicht, ob der Entscheid existiert',
    'amtliches Formular · Amtliche Gebühren · amtlicher Quelle',
    'Tarif an der amtlichen Fassung verifiziert, fachlich nicht abgenommen',
  ])('grün: %s', (text) => expect(statusAnsprueche(text)).toEqual([]));
});

describe('Katalog: status ≠ geprüft ⇒ kein unbelegter Prüf-/Abnahme-Anspruch (§8)', () => {
  it('alle Karten und Vorlagen (ALLE_KARTEN)', () => {
    const funde: string[] = [];
    for (const k of ALLE_KARTEN) {
      if (k.status === 'geprüft') continue;
      const felder: [string, string | undefined][] = [
        ['title', k.title], ['kurz', k.kurz], ['description', k.description], ['note', k.note],
        ['formvorschrift', k.modus === 'vorlage' ? k.formvorschrift : undefined],
        ...(k.modus === 'rechner' ? (k.szenarien ?? []) : []).map(
          (s, i): [string, string] => [`szenarien[${i}]`, s.label],
        ),
      ];
      for (const [feld, text] of felder) {
        if (!text) continue;
        for (const v of statusAnsprueche(text)) funde.push(`${k.id} [${k.status}] ${feld}: «${v}»`);
      }
    }
    expect(funde).toEqual([]);
  });
});

// Vorlagen-Seiten mit eigenen Anzeigetexten (intro, Fusszeilen) zur Karte.
// Nur String-/Template-/JSX-Text-Knoten der TS-AST — Code-Kommentare zählen
// nicht als Anzeigetext.
const SEITEN: { datei: string; karte: string }[] = [
  { datei: 'src/pages/VorlageKlageVereinfacht.tsx', karte: 'klage-vereinfacht' },
];

function anzeigeLiterale(datei: string): string[] {
  const sf = ts.createSourceFile(datei, readFileSync(datei, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const besuch = (n: ts.Node) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) out.push(n.text);
    else if (ts.isTemplateExpression(n)) out.push([n.head.text, ...n.templateSpans.map((s) => s.literal.text)].join('…'));
    else if (ts.isJsxText(n) && n.text.trim()) out.push(n.text);
    ts.forEachChild(n, besuch);
  };
  besuch(sf);
  return out;
}

describe('Vorlagen-Seiten: dieselbe Regel für Seitentexte', () => {
  it.each(SEITEN)('$datei', ({ datei, karte }) => {
    const k = ALLE_KARTEN.find((x) => x.id === karte);
    expect(k, karte).toBeDefined();
    if (k!.status === 'geprüft') return;
    const funde = anzeigeLiterale(datei).flatMap((t) => statusAnsprueche(t).map((v) => `«${v}» in «${t.slice(0, 80)}…»`));
    expect(funde).toEqual([]);
  });
});
