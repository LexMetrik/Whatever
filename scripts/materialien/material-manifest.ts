/**
 * Browse-Manifest-Generator (Rubrik «Materialien»): baut aus dem
 * MATERIAL_REGISTER das deterministisch sortierte public/materialien/register.json.
 *
 * §5 SSoT: Identität/Taxonomie kommt aus dem Register; die Anzeige-Labels
 * (Behörde/Doktyp) werden hier aufgelöst, ein sha über die Identitätsfelder als
 * Provenienz-/Drift-Token gesetzt (§7). §2: kein Date.now() in der Logik (das
 * erzeugt-Datum kommt via Argument). §6/§7: schreibt NUR register.json, nie in
 * den Gesetzes-/Rechtsprechungs-Baum — Golden unberührt. Eigener Namespace,
 * berührt scripts/normtext/* nicht.
 *
 * Aufruf: npm run materialien -- --datum=$(date +%F)
 */
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  MATERIAL_REGISTER, behoerdeVon, DOKTYP_LABEL, BEHOERDE_RANG,
} from '../../src/lib/materialien/register.ts';
import type {
  MaterialVoll, MaterialVollManifest, MaterialRegistereintrag,
  MaterialManifest, MaterialI18nManifest, MaterialProvenienzManifest,
  MaterialProvenienz, MaterialTitelI18n, BrowseMaterial,
} from '../../src/lib/materialien/typen.ts';
// Botschaften (Paket 2, W2·6): NICHT im in-Bundle MATERIAL_REGISTER (§15 Bundle-Kosten:
// ~400 Einträge × 3 Titel), sondern nur als Build-Zeit-Quelle hier gemerged → sie fliessen
// in die lazy register.json-Projektion (Browse + Kontext-Panel), ohne den App-Bundle zu
// belasten. Diese Datei ist ein scripts/-Modul (kein src-Import → kein Bundling).
import { BOTSCHAFTEN } from '../../src/lib/materialien/botschaften.generated.ts';
// Vernehmlassungen (Paket 3, W3·11): analog zu den Botschaften nur hier gemerged (Build-Zeit),
// nie im App-Bundle (§15). Fliessen in die lazy register.json-Projektion.
import { VERNEHMLASSUNGEN } from '../../src/lib/materialien/vernehmlassungen.generated.ts';
// Materialien des Grossen Rates Basel-Stadt (K-16, W2·13): wie Botschaften und
// Vernehmlassungen NUR hier gemerged (Build-Zeit), nie im App-Bundle (§15).
import { BS_MATERIALIEN } from '../../src/lib/materialien/bs-grossrat.generated.ts';

/** Alle kuratierten + generierten Materialien-Register-Einträge (Build-Zeit-SSoT der
 *  Projektion). Botschaften + Vernehmlassungen nur hier, nie im App-Bundle (§15). */
export const ALLE_MATERIALIEN: ReadonlyArray<MaterialRegistereintrag> = [
  ...MATERIAL_REGISTER, ...BOTSCHAFTEN, ...VERNEHMLASSUNGEN, ...BS_MATERIALIEN,
];

export const REGISTER_PFAD = join('public', 'materialien', 'register.json');
/** FR/IT-Titel — eigene Projektion, weil der deutsche Lesefluss sie nie anfasst
 *  (gemessen 12.9.2026: 70,6 KB gzip = 21 % des alten Monolithen). */
export const REGISTER_I18N_PFAD = join('public', 'materialien', 'register-i18n.json');
/** sha + Verfahrens-/Join-Felder — KEIN Browser-Kanal (kein fetch() im gesamten
 *  src/-Baum, Identitäts-Grep 12.9.2026); Tore und Datenhaltung lesen von Platte. */
export const REGISTER_PROVENIENZ_PFAD = join('public', 'materialien', 'register-provenienz.json');

/** Felder der Kern-Projektion, in der Reihenfolge, in der sie geschrieben werden.
 *  Als Liste geführt, damit `teileRegister` nicht per Löschen arbeitet: ein neues
 *  Feld in MaterialVoll landet so NIE versehentlich im Browser-Kanal (§15). */
const KERN_FELDER = [
  'key', 'behoerde', 'behoerdeName', 'behoerdeKuerzel', 'doktyp', 'doktypLabel',
  'titel', 'nummer', 'rechtsgebiet', 'sprache', 'status', 'quelleUrl', 'stand',
  'rang', 'normKeys', 'hinweis', 'vernehmlassung', 'fundstelle',
] as const satisfies ReadonlyArray<keyof BrowseMaterial>;

/**
 * Teilt das volle Manifest in die drei ausgelieferten Projektionen (§5: jedes Feld
 * genau einmal). Rein und deterministisch — die Reihenfolge der Einträge ist die
 * des vollen Manifests, die Schlüssel-Reihenfolge der Objekte damit ebenso.
 */
export function teileRegister(voll: MaterialVollManifest): {
  kern: MaterialManifest;
  i18n: MaterialI18nManifest;
  provenienz: MaterialProvenienzManifest;
} {
  const materialien: BrowseMaterial[] = [];
  const titel: Record<string, MaterialTitelI18n> = {};
  const eintraege: Record<string, MaterialProvenienz> = {};
  for (const m of voll.materialien) {
    const kernEintrag: Partial<BrowseMaterial> = {};
    for (const f of KERN_FELDER) {
      if (m[f] !== undefined) (kernEintrag as Record<string, unknown>)[f] = m[f];
    }
    materialien.push(kernEintrag as BrowseMaterial);

    const t: MaterialTitelI18n = {};
    if (m.titelFr) t.fr = m.titelFr;
    if (m.titelIt) t.it = m.titelIt;
    if (t.fr || t.it) titel[m.key] = t;

    const p: MaterialProvenienz = { sha: m.sha };
    if (m.projEli) p.projEli = m.projEli;
    if (m.ocUris) p.ocUris = m.ocUris;
    if (m.botschaftDate) p.botschaftDate = m.botschaftDate;
    if (m.artAnker) p.artAnker = m.artAnker;
    if (m.ereignisse) p.ereignisse = m.ereignisse;
    if (m.bsKanten) p.bsKanten = m.bsKanten;
    eintraege[m.key] = p;
  }
  return {
    kern: { erzeugt: voll.erzeugt, materialien },
    i18n: { erzeugt: voll.erzeugt, titel },
    provenienz: { erzeugt: voll.erzeugt, eintraege },
  };
}

// Behörden, bei denen `stand` nachweislich ein Erhebungs-/Abfragedatum ist (rotiert bei
// jedem Lauf, keine inhaltliche Eigenschaft) — NUR BUND (Vernehmlassungen, Paket 3):
// `vernehmlassungen-generieren.ts` setzt `stand: datum`, den CLI-Lauf-Parameter, Kommentar
// dort «Abfragedatum (Status ist mutabel)». ABWEICHUNG von der Gegenprüfungs-Auflage PR
// #814 (die auch BR/BS-GR in dieses Set aufnehmen wollte, §7-Offenlegung): für beide ist
// `stand` nachweislich ein amtliches Dokumentdatum, kein Erhebungsdatum — BR
// (`botschaften-generieren.ts`: `stand: iso` = `r.date`, Feld-Kommentar «Botschafts-Datum
// ISO», wertgleich zu `botschaftDate`) und BS-GR (`bs-materialien.ts`, Funktion `standVon`,
// Kommentar dort wörtlich: «Amtliche Daten, in dieser festen Reihenfolge — nie das
// Abrufdatum»). Beide zusätzlich auszuschliessen würde eine echte Dokumentdatum-Korrektur
// (z. B. eine berichtigte Botschafts-/Vorlage-Datierung) drift-unsichtbar machen — genau
// der Fehler, den dieser Fund beheben soll. Bei Widerspruch zur Auflage gewinnt der Beleg
// im Quellcode (§1/§7).
const STAND_IST_ERHEBUNGSDATUM = new Set(['BUND']);

// Feld-Trenner für den sha-Normstring: das ASCII-Steuerzeichen «Unit Separator»
// (0x1F) — kommt in keinem Feld vor (Titel/Hinweis/URL sind lesbarer Text ohne
// Steuerzeichen), anders als ein blosses Leerzeichen. Delta-Prüfung PR #814,
// Rot-Beweis des Prüfers: mit `.join(' ')` ergaben `titel:'A B', nummer:'N'` und
// `titel:'A', nummer:'B N'` dasselbe sha, weil ' ' selbst Feldinhalt sein kann —
// die Feldgrenze war nicht eindeutig. 0x1F ist dafür das amtliche ASCII-Steuerzeichen
// (genau dieser Zweck: Feld-/Datensatz-Trennung in Textdaten).
const FELD_TRENNER = '';

/** sha256 über die Identitätsfelder (stabile, sortierte Repräsentation, Felder durch
 *  `FELD_TRENNER` getrennt — eindeutige Feldgrenze, s. o.; kein kryptografischer
 *  Kollisionsschutz nötig, da nur Drift-Vergleich gegen die committete Fassung). Ändert
 *  sich, sobald sich Titel/Nummer/Quelle/Status/Verzahnung ändern → Drift-Token, das ein
 *  check gegen die committete Fassung prüft. `stand` ist NUR bei
 *  `STAND_IST_ERHEBUNGSDATUM`-Behörden ausgeschlossen (s. o.) — sonst bewusst Teil des
 *  Identitäts-sha, weil es dort das amtliche Dokumentdatum trägt (Fund
 *  FAHRPLAN-OFFENE-BEFUNDE «Register-sha rotiert mit stand», Beleg Lauf #789→#803:
 *  831/831 Vernehmlassungs-sha bei nur 1 tatsächlichem Statusübergang). `stand` bleibt in
 *  jedem Fall als eigenes Kern-/Provenienz-Feld erhalten (§7, unverändert ausgeliefert). */
export function shaEintrag(r: MaterialRegistereintrag): string {
  const norm = [
    r.key, r.behoerde, r.doktyp, r.titel, r.nummer ?? '', r.rechtsgebiet,
    r.sprache, r.status, r.quelleUrl, String(r.rang),
    (r.normKeys ?? []).join(','), r.hinweis ?? '',
    ...(STAND_IST_ERHEBUNGSDATUM.has(r.behoerde) ? [] : [r.stand]),
    // Botschaften-Zusatzfelder NUR für BR anhängen → bestehende Einträge byte-identisch.
    // `botschaftDate`/`artAnker` bewusst NICHT zusätzlich im Drift-Token: `botschaftDate`
    // ist wertgleich zu `stand` (das oben bereits einfliesst — kein zweites Feld für
    // denselben Wert), `artAnker` ist heute in jedem Eintrag `undefined` (Moat-Hebel 2,
    // noch ohne Daten) und trägt darum aktuell keine Drift-Information.
    ...(r.behoerde === 'BR'
      ? [r.titelFr ?? '', r.titelIt ?? '', r.projEli ?? '', (r.ocUris ?? []).join(','), r.fundstelle ?? '',
         // E1: Verfahrenskette im Drift-Token — ein neuer Verfahrensschritt ändert
         // das sha und wird so vom Register-Tor gesehen.
         (r.ereignisse ?? []).map((v) => `${v.code}:${v.datum ?? ''}:${v.res ?? ''}`).join(';')]
      : []),
    // Vernehmlassungen (Paket 3, BUND): Titel FR/IT + Verfahrens-Zustand (Status/Frist/projEli)
    // im Drift-Token — Currency-Token für den mutablen Status. NUR für BUND anhängen →
    // bestehende Einträge (kuratiert/BR) byte-identisch.
    ...(r.behoerde === 'BUND'
      ? [r.titelFr ?? '', r.titelIt ?? '', r.vernehmlassung?.status ?? '',
         r.vernehmlassung?.fristStart ?? '', r.vernehmlassung?.fristEnde ?? '', r.vernehmlassung?.projEli ?? '']
      : []),
    // BS (K-16): Verfahrenskette + Herkunft jeder Erlass-Verknüpfung gehören zur
    // Identität — sonst bliebe ein Wechsel von 'amtlich' auf 'maschinell' (oder ein
    // neuer Kommissionsbericht) drift-unsichtbar. NUR für BS-GR anhängen → alle
    // bestehenden Einträge byte-identisch.
    ...(r.behoerde === 'BS-GR'
      ? [(r.ereignisse ?? []).map((v) => `${v.code}:${v.datum ?? ''}:${v.res ?? ''}:${v.bez ?? ''}`).join(';'),
         (r.bsKanten ?? []).map((k) => `${k.erlass}:${k.quelle}:${k.regel}:${k.beleg}`).join(';')]
      : []),
  ].join(FELD_TRENNER);
  return createHash('sha256').update(norm, 'utf8').digest('hex');
}

function vollEintrag(r: MaterialRegistereintrag): MaterialVoll {
  const b = behoerdeVon(r.behoerde);
  // Botschaften-Zusatzfelder NUR für BR emittieren → bestehende Einträge byte-identisch
  // (keine neuen null-Keys in den kuratierten register.json-Zeilen).
  const botschaftsFelder = r.behoerde === 'BR'
    ? {
        ...(r.titelFr ? { titelFr: r.titelFr } : {}),
        ...(r.titelIt ? { titelIt: r.titelIt } : {}),
        // M-7: BBl-Fundstelle (Kern-Feld: die UI zeigt sie neben der Curia-Nummer).
        ...(r.fundstelle ? { fundstelle: r.fundstelle } : {}),
        ...(r.projEli ? { projEli: r.projEli } : {}),
        ...(r.ocUris ? { ocUris: r.ocUris } : {}),
        ...(r.botschaftDate ? { botschaftDate: r.botschaftDate } : {}),
        ...(r.artAnker ? { artAnker: r.artAnker } : {}),
        ...(r.ereignisse?.length ? { ereignisse: r.ereignisse } : {}),
      }
    : {};
  // Vernehmlassungs-Zusatzfelder NUR für BUND emittieren (Paket 3) → bestehende Einträge
  // byte-identisch (keine neuen Keys in kuratierten/BR-register.json-Zeilen).
  const vernehmlassungsFelder = r.behoerde === 'BUND'
    ? {
        ...(r.titelFr ? { titelFr: r.titelFr } : {}),
        ...(r.titelIt ? { titelIt: r.titelIt } : {}),
        ...(r.vernehmlassung ? { vernehmlassung: r.vernehmlassung } : {}),
      }
    : {};
  // BS-Zusatzfelder NUR für BS-GR emittieren (K-16) → bestehende Einträge byte-identisch.
  const bsFelder = r.behoerde === 'BS-GR'
    ? {
        ...(r.ereignisse?.length ? { ereignisse: r.ereignisse } : {}),
        ...(r.bsKanten?.length ? { bsKanten: r.bsKanten } : {}),
      }
    : {};
  return {
    key: r.key,
    behoerde: r.behoerde,
    behoerdeName: b.name,
    behoerdeKuerzel: b.kuerzel,
    doktyp: r.doktyp,
    doktypLabel: DOKTYP_LABEL[r.doktyp],
    titel: r.titel,
    nummer: r.nummer ?? null,
    rechtsgebiet: r.rechtsgebiet,
    sprache: r.sprache,
    status: r.status,
    quelleUrl: r.quelleUrl,
    stand: r.stand,
    rang: r.rang,
    normKeys: r.normKeys ?? [],
    hinweis: r.hinweis ?? null,
    ...botschaftsFelder,
    ...vernehmlassungsFelder,
    ...bsFelder,
    sha: shaEintrag(r),
  };
}

/** Deterministische Sortierung: Behörde-rang → eigener rang → key. */
function vergleiche(a: MaterialVoll, b: MaterialVoll): number {
  return (BEHOERDE_RANG[a.behoerde] - BEHOERDE_RANG[b.behoerde])
    || a.rang - b.rang
    || a.key.localeCompare(b.key);
}

/** Baut das VOLLE Manifest aus dem Register (rein, testbar) — die In-Memory-SSoT,
 *  aus der `teileRegister` die drei ausgelieferten Dateien projiziert (§5). */
export function baueMaterialManifest(erzeugt: string): MaterialVollManifest {
  const materialien = ALLE_MATERIALIEN.map(vollEintrag).sort(vergleiche);
  return { erzeugt, materialien };
}
