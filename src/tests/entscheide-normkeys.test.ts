import { describe, it, expect } from 'vitest';
import {
  normalisiereAbk, normKeyFuerAbk, statutesZuNormKeys, fliesstextVon,
  normKeysVonSnapshot, artikelSchluesselVonSnapshot, artikelSchluesselMitBefund,
  ohneLiteraturApparat, LITERATUR_MARKER, literaturEntfernteNormKeys,
  remapNormKeys, undeklarierteAltKeys,
  ABK_KOLLISIONEN, ABK_AUSSCHLUSS, AUSGESCHLOSSENE_KEYS,
  ABK_ALIAS_NOTIZEN, ABK_ALIAS_AUSGESCHLOSSEN,
  ERLASS_FASSUNGS_REIHEN, fassungsReihen, fassungsDatumVon,
} from '../../scripts/normtext/entscheide-mapping';
import { extrahiereStatutRefs } from '../lib/rechtsprechung/zitat-extraktion';
import { ABK_ALIASE } from '../lib/normtext/abk-aliase.generated';
import { ERLASS_REGISTER } from '../lib/normtext/register';
import type { EntscheidSnapshot } from '../lib/rechtsprechung/typen';

// ─── W2·6-NKEY Baustein a+d — normKeys aus dem Register + Fliesstext ─────────
//
// FACHLICHE ÄNDERUNG, bewusst deklariert (§6.3): die Abkürzungs-Tabelle war eine
// Hand-Whitelist mit 26 Einträgen und kannte z.B. das IPRG nicht, obwohl der
// Erlass im ERLASS_REGISTER geführt wird. Sie wird jetzt aus dem Register
// ABGELEITET (§5) und die Zitat-Erkennung greift zusätzlich in den FLIESSTEXT
// (Anlassfall BGE 152 III 137: nennt das IPRG 68-mal im Text, hatte aber keinen
// IPRG-normKey). Diese Datei ist der Beweis, dass die Ableitung tut, was sie
// soll — und dass sie an den fachlich heiklen Stellen NICHT rät.

// ── Snapshot-Fabrik: nur die für normKeys relevanten Felder variabel ─────────
function snap(o: Partial<EntscheidSnapshot> = {}): EntscheidSnapshot {
  return {
    id: 'bund/bge/152_III_137', gericht: 'bge', gerichtName: 'Bundesgericht',
    gerichtstyp: 'bundesgericht', kanton: 'CH', abteilung: null, nummer: '152 III 137',
    bgeReferenz: '152 III 137', zitierung: 'BGE 152 III 137', datum: '2026-01-01',
    sprache: 'de', leitcharakter: 'leitentscheid', sachgebiet: 'privat', legalArea: null,
    rubrum: null, regeste: null, regesteAmtlich: true,
    abschnitte: [], dispositivOrders: [], zitierteNormen: [], normKeys: [],
    zitierteEntscheide: [], bestand: 'snapshot', kuratierung: 'maschinell',
    quelle: 'opencaselaw', quelleUrl: 'https://www.bger.ch', abgerufen: '2026-01-01',
    fassungsToken: 'h', sha: 's',
    ...o,
  };
}

describe('normalisiereAbk — Vergleichsform der Abkürzung', () => {
  it('gross + Sonderzeichen weg, Umlaut bleibt', () => {
    expect(normalisiereAbk('SchKG')).toBe('SCHKG');
    expect(normalisiereAbk('BüG')).toBe('BÜG');
    expect(normalisiereAbk('GebV-HReg')).toBe('GEBVHREG');
  });
  it('bewahrt Ziffern — sonst kollabierten «BVV 2» und «BVV 3» auf ein Token (§1)', () => {
    expect(normalisiereAbk('BVV 2')).toBe('BVV2');
    expect(normalisiereAbk('BVV 3')).toBe('BVV3');
    expect(normalisiereAbk('BVV 2')).not.toBe(normalisiereAbk('BVV 3'));
  });
});

describe('normKeyFuerAbk — Ableitung aus dem ERLASS_REGISTER', () => {
  it('kennt Erlasse, die die alte Hand-Whitelist NICHT kannte (Anlassfall IPRG)', () => {
    expect(normKeyFuerAbk('IPRG')).toBe('IPRG');
  });
  it('mappt die Anzeige-Abkürzung auf den dateisicheren Register-key', () => {
    // Register: bund('VBB', 'VFRR', …) → Anzeige «VFRR», key 'VBB'.
    expect(normKeyFuerAbk('VFRR')).toBe('VBB');
    // Umlaut-Kürzel: «BüG» → 'BÜG' → Register-key 'BUEG'.
    expect(normKeyFuerAbk('BüG')).toBe('BUEG');
    // Ziffern-Kürzel bleiben getrennt (siehe normalisiereAbk).
    expect(normKeyFuerAbk('BVV 2')).toBe('BVV_2');
    expect(normKeyFuerAbk('BVV 3')).toBe('BVV3');
  });
  it('gibt föderal/kantonal mehrdeutige Kürzel NICHT aus (StG), Unbekanntes ebenso wenig', () => {
    // Lieber eine Lücke als eine falsche Bundesrechts-Zuordnung (§1/§8) —
    // Begründung: ABK_AUSSCHLUSS-Eintrag, Gegenprüfung W3 (Opus, 2.7.2026).
    expect(normKeyFuerAbk('StG')).toBeNull();
    expect(normKeyFuerAbk('KV/SH')).toBeNull();   // kantonal, nicht registriert
    expect(normKeyFuerAbk('GIBTSNICHT')).toBeNull();
  });
});

// ── Baustein b: amtliche DE/FR/IT-Kürzel aus Fedlex (Alias-Ebene) ────────────
//
// FACHLICHE ÄNDERUNG, bewusst deklariert (§6.3): ein Entscheid in französischer
// oder italienischer Amtssprache zitiert dasselbe Bundesrecht unter einem
// anderen amtlichen Kürzel («art. 42 LTF» statt «Art. 42 BGG»). Bis Baustein b
// verschwand jedes solche Zitat lautlos. Das generierte Artefakt
// abk-aliase.generated.ts (Fedlex jolux:titleShort, Currency-Fenster, Stand
// 28.7.2026) bindet die Kürzel über die SR-Nummer an den Register-key.
describe('Alias-Ebene — amtliche FR/IT-Kürzel zeigen auf den Register-key', () => {
  it('löst die grossen Kodifikationen und Verfahrensgesetze auf', () => {
    expect(normKeyFuerAbk('LTF')).toBe('BGG');       // Loi sur le Tribunal fédéral
    expect(normKeyFuerAbk('CO')).toBe('OR');         // Code des obligations
    expect(normKeyFuerAbk('CC')).toBe('ZGB');        // Code civil
    expect(normKeyFuerAbk('CPC')).toBe('ZPO');
    expect(normKeyFuerAbk('CP')).toBe('STGB');
    expect(normKeyFuerAbk('CPP')).toBe('STPO');
  });
  it('löst Verfassung, SchKG, IPRG, DBG und die EMRK auf', () => {
    expect(normKeyFuerAbk('CST')).toBe('BV');        // «Cst.» (fr)
    expect(normKeyFuerAbk('Cost.')).toBe('BV');      // «Cost.» (it)
    expect(normKeyFuerAbk('LP')).toBe('SCHKG');      // Loi sur la poursuite
    expect(normKeyFuerAbk('LEF')).toBe('SCHKG');     // it «LEF»
    expect(normKeyFuerAbk('LDIP')).toBe('IPRG');
    expect(normKeyFuerAbk('LIFD')).toBe('DBG');
    expect(normKeyFuerAbk('CEDH')).toBe('EMRK');     // SR 0.101 (bis 14.9.2026 pdf-embed, seit PR #860 Volltext-Snapshot)
    expect(normKeyFuerAbk('CEDU')).toBe('EMRK');
  });
  it('greift im FLIESSTEXT eines französischsprachigen Entscheids (End-to-End)', () => {
    const s = snap({
      abschnitte: [{ typ: 'erwaegung', bloecke: [{
        marke: '2', text: 'Le recours est recevable au regard de l\'art. 42 al. 2 LTF; '
          + 'la partie recourante invoque en outre l\'art. 29 al. 2 Cst.',
      }] }],
    });
    expect(normKeysVonSnapshot(s)).toEqual(['BGG', 'BV']);
    // Beide Ebenen sagen hier DASSELBE — eine einzelne Nennung im Erwägungstext
    // genügt auf beiden. Die zwischenzeitliche Häufigkeits-Schwelle (Commit
    // 5e8b49c0) hätte hier [] geliefert; sie ist zurückgebaut (Gegenprüfung R3).
    expect([...artikelSchluesselVonSnapshot(s)].sort()).toEqual(['BGG/42', 'BV/29']);
  });
  it('jedes Alias-Kürzel des Artefakts löst sich auf oder ist benannt ausgeschlossen', () => {
    // Bindeglied Artefakt ↔ Register ist die SR-Nummer. Fällt ein Erlass aus dem
    // Register oder wird eine SR-Nummer doppelt belegt, werden seine Aliase
    // wirkungslos — und ein wirkungsloses Alias verhält sich exakt wie ein nie
    // erzeugtes, also unsichtbar (§6.7). Heute: nichts fällt durch.
    expect([...ABK_ALIAS_NOTIZEN]).toEqual([]);
    expect(ABK_ALIASE.length).toBeGreaterThan(500);
  });
  it('holt einen AUSGESCHLOSSENEN Erlass nicht über die fremdsprachige Hintertür herein', () => {
    // SR 641.10: das deutsche «StG» ist föderal/kantonal mehrdeutig und darum
    // ausgeschlossen. «LT» (fr) / «LTB» (it) sind es nicht — sie trügen denselben
    // key 'STG' trotzdem in den Korpus, und der Schreibpfad (AUSGESCHLOSSENE_KEYS)
    // verwürfe ihn beim Norm-Index wieder: ein halber Zustand. Die Freigabe ist
    // eine FACHLICHE Entscheidung (§7), kein Nebeneffekt der Alias-Ernte.
    expect(normKeyFuerAbk('LT')).toBeNull();
    expect(normKeyFuerAbk('LTB')).toBeNull();
    expect(normKeyFuerAbk('StG')).toBeNull();
    // §6.3-DEKLARATION (QS-KORPUS 25.9.2026, Nach-Verdikt zu e3f874779): vier
    // Zeilen dazu — die sprachübergreifend mehrdeutigen AIMP/OCP/OS (Beleg in
    // ABK_AUSSCHLUSS und src/tests/abk-sprachuebergreifend.test.ts). Bis dahin
    // standen hier nur LC/LT/LTB/StG.
    // §6.3-DEKLARATION (QS-KORPUS 25.9.2026, Wurzel-Fix): AIMP/OCP sind nicht mehr
    // total gesperrt, sondern sprachgebunden (SPRACH_HOMONYME) — zwei Zeilen weg.
    expect([...ABK_ALIAS_AUSGESCHLOSSEN]).toEqual([
      'LC (SR 823.11, it) → AVG',
      'LT (SR 641.10, fr) → STG',
      'LTB (SR 641.10, it) → STG',
      'OS (SR 961.011, fr) → AVO',
      'OS (SR 961.011, it) → AVO',
      'StG (SR 641.10, de) → STG',
    ]);
  });
  it('sperrt das it-Alias «LC» (SR 823.11, AVG) — kantonales Homonym Waadt (Nachzug QS-MONITOR-ROT)', () => {
    // Gegenprüfung (Opus, 18.9.2026) auf Commit 4eec6ea1f: das amtliche it-Alias
    // 'LC' (Legge sul collocamento, SR 823.11) kollidiert normalisiert mit der
    // Waadtländer «la loi vaudoise du 28 février 1956 sur les communes (LC;
    // BLV 175.11)».
    // Repro-Fund BGE 149 I 343 (fr, 19.9.2023): «art. 40e LC», «art. 40g al. 1
    // LC» — KEIN 'AVG'-Token im Text, committete normKeys [BGG, BV, EMRK]. Ohne
    // Sperre lieferte normKeysVonSnapshot fälschlich zusätzlich 'AVG'.
    expect(normKeyFuerAbk('LC')).toBeNull();
    const vaudLC = snap({
      id: 'bund/bge/149_I_343', sprache: 'fr',
      abschnitte: [{ typ: 'erwaegung', bloecke: [{
        marke: '2', text: 'L\'art. 40e LC prévoit que le syndic est élu par le corps électoral; '
          + 'les mêmes règles prévues par l\'art. 40g al. 1 LC s\'appliquent.',
      }] }],
    });
    expect(normKeysVonSnapshot(vaudLC)).toEqual([]);   // insb. KEIN 'AVG'
    // Gegenprobe: die Sperre trifft NUR 'LC' — die echten AVG-Fundstellen (de
    // «AVG», fr «LSE») bleiben wirksam. Präzisiert (gemessen 18.9.2026, Nach-
    // Verdikt Opus): SECHS Entscheide tragen das Token 'LC' im AVG-Sinn — fünf
    // mit Artikel-Zitat «art. … LC», alle it-Regesten (BGE 151 II 178,
    // 151 III 143, 148 II 426, 148 II 203, 147 II 397), die dadurch auf 'AVG'
    // auflösen; dazu BGE 151 I 113 («legge federale sul collocamento e il
    // personale a prestito (LC)», consid. 7.1) nur als Definitionsklammer OHNE
    // Artikel-Zitat — löst NICHT auf 'AVG' auf. Der Waadtländer BGE 149 I 343
    // zählt nicht mit: anderes 'LC' (Loi sur les communes). Korpusweit lösen
    // 11 Snapshots auf 'AVG' auf — die fünf genannten BGE plus 6 BS
    // (BEZ.2023.59, VD.2025.49, ZB.2023.64, ZB.2023.66, ZB.2024.11, AH.2023.9),
    // die AVG bzw. LSE zusätzlich zu — oder statt — LC im Text tragen.
    expect(normKeyFuerAbk('AVG')).toBe('AVG');
    expect(normKeyFuerAbk('LSE')).toBe('AVG');
    const echtDe = snap({
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '4', text: 'Nach Art. 12 AVG ist eine Bewilligung nötig.' }] }],
    });
    expect(normKeysVonSnapshot(echtDe)).toEqual(['AVG']);
    const echtFr = snap({
      sprache: 'fr',
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '4', text: 'En vertu de l\'art. 12 LSE, une autorisation est nécessaire.' }] }],
    });
    expect(normKeysVonSnapshot(echtFr)).toEqual(['AVG']);
  });
});

describe('Sicherungen der Ableitung — sichtbar statt still (§6.7)', () => {
  it('ABK_KOLLISIONEN ist heute exakt leer — Register UND Aliase sind eindeutig', () => {
    // EXAKTE Liste, nicht «≤ n»: ein neuer Register-Eintrag, der eine Abkürzung
    // doppelt belegt, macht dieses Tor ROT, statt den Treffer still zu verlieren.
    // Sabotage-Probe 27.7.2026: ein zusätzlicher Register-Eintrag mit kuerzel
    // 'IPRG' unter anderem key liefert ABK_KOLLISIONEN = ['IPRG'] → rot.
    //
    // Seit Baustein b (28.7.2026) speisen ZWEI Quellen dieselbe Tabelle und
    // dieselbe Kollisionsregel: Register-Kandidaten und die amtlichen Fedlex-
    // Kürzel. Die Liste bleibt leer — 597 Aliase kollidieren mit keinem
    // Register-Kürzel. Kollidierte je eines, verlören BEIDE Erlasse ihre Zitate;
    // genau darum steht die Liste hier exakt und nicht als Obergrenze.
    expect([...ABK_KOLLISIONEN]).toEqual([]);
  });
  it('ABK_AUSSCHLUSS trägt «STG», «LC» und «OS», mit begründendem Text', () => {
    // 'LC' seit Nachzug QS-MONITOR-ROT (18.9.2026): Gegenprüfung Opus auf Commit
    // 4eec6ea1f — das it-Alias 'LC' (SR 823.11, AVG) kollidiert mit dem
    // Waadtländer Gemeindegesetz (BLV 175.11), Beleg BGE 149 I 343.
    // AIMP/OCP/OS seit 25.9.2026 (QS-KORPUS, Nach-Verdikt zu e3f874779): Fedlex
    // vergibt das Kürzel sprachabhängig an verschiedene Erlasse; vorher ['STG', 'LC'].
    // §6.3-DEKLARATION (QS-KORPUS 25.9.2026, Wurzel-Fix): AIMP/OCP wandern in die
    // sprachgebundene Tabelle SPRACH_HOMONYME (src/tests/abk-sprachuebergreifend.test.ts);
    // OS bleibt total gesperrt (Homonym INNERHALB derselben Sprache).
    expect([...ABK_AUSSCHLUSS.keys()]).toEqual(['STG', 'LC', 'OS']);
    expect(ABK_AUSSCHLUSS.get('OS')).toMatch(/Fedlex-SPARQL 25\.9\.2026/);
    expect(ABK_AUSSCHLUSS.get('STG')).toMatch(/kantonal/);
    expect(ABK_AUSSCHLUSS.get('LC')).toMatch(/Waadt|Vaud/);
  });
  it('AUSGESCHLOSSENE_KEYS spiegelt den Ausschluss auf Register-key-Ebene (Alt-Bestand)', () => {
    expect([...AUSGESCHLOSSENE_KEYS]).toEqual(['STG']);
  });
  it('AUSGESCHLOSSENE_KEYS überlebt eine künftige Kollision auf «StG» (Härtung B6a)', () => {
    // Befund 28.7.2026: die Menge wurde über ABK_TABELLE.get() abgeleitet. Die
    // Tabelle VERWIRFT kollidierte Abkürzungen beidseitig — ein zweiter
    // Register-Eintrag mit normalisiert 'STG' hätte den Eintrag gelöscht, die
    // Menge geleert und den Bestand-Schutzfilter STILL entwaffnet. Hier beide
    // Ableitungen an genau diesem Fall gegeneinander, damit die Härtung nicht
    // versehentlich zurückgedreht wird (§6.7).
    const REG = [...ERLASS_REGISTER, { key: 'STG_KANTONAL_DEMO', kuerzel: 'StG' } as never];
    // (1) ALTE Ableitung, nachgebaut: Tabelle bauen, Kollisionen verwerfen, get().
    const tabelle = new Map<string, string>();
    const kollidiert = new Set<string>();
    for (const e of REG as Array<{ key: string; kuerzel: string }>) {
      for (const kand of [normalisiereAbk(e.kuerzel), normalisiereAbk(e.key)]) {
        if (!kand) continue;
        const bisher = tabelle.get(kand);
        if (bisher === undefined) { tabelle.set(kand, e.key); continue; }
        if (bisher !== e.key) kollidiert.add(kand);
      }
    }
    for (const k of kollidiert) tabelle.delete(k);
    const altAbleitung = [...ABK_AUSSCHLUSS.keys()].map((a) => tabelle.get(a)).filter(Boolean);
    expect(altAbleitung).toEqual([]);        // ← genau das war die Lücke: Schutz weg
    // (2) NEUE Ableitung, dieselbe Regel wie im Produktivpfad: direkt übers Register.
    const neuAbleitung = (REG as Array<{ key: string; kuerzel: string }>)
      .filter((e) => ABK_AUSSCHLUSS.has(normalisiereAbk(e.kuerzel))
                  || ABK_AUSSCHLUSS.has(normalisiereAbk(e.key)))
      .map((e) => e.key).sort();
    expect(neuAbleitung).toEqual(['STG', 'STG_KANTONAL_DEMO']);
  });
});

describe('statutesZuNormKeys — Trailing-Token mit Ziffern-Block', () => {
  it('«Art. 27 BVV 2» → BVV_2 (ohne Ziffer fiele es auf «BVV» zurück)', () => {
    expect(statutesZuNormKeys(['Art. 27 BVV 2'])).toEqual(['BVV_2']);
  });
  it('einfaches Kürzel + Dedup unverändert', () => {
    expect(statutesZuNormKeys(['Art. 32 Abs. 2 BGG', 'Art. 42 BGG'])).toEqual(['BGG']);
  });
  it('INVALID_LAW_CODES sperrt AUCH den statutes-Pfad (Linse 2, §5)', () => {
    // 'la' ist im Fliesstext-Pfad seit jeher gesperrt (Artikel/Präposition) —
    // im statutes-Pfad war es das nicht. Seit der Alias-Ernte ist 'LA' das
    // amtliche fr-Kürzel des Luftfahrtgesetzes (SR 748.0): die Zeile lieferte
    // ['LFG']. Eine Sperre, die nur einer von zwei Pfaden kennt, ist keine.
    expect(normKeyFuerAbk('LA')).toBe('LFG');       // das Kürzel selbst bleibt gültig …
    expect(statutesZuNormKeys(['Art. 5 de la'])).toEqual([]);   // … als Satzwort nicht
    expect(statutesZuNormKeys(['Art. 127 BGE'])).toEqual([]);
    expect(statutesZuNormKeys(['Art. 141 Abs. 2 KV/FR'])).toEqual([]);
    // Der PREIS, ehrlich benannt (§8): eine echte fr-Nennung «art. 5 LA» fällt
    // damit auch im statutes-Pfad weg. Das ist keine neue Lücke, sondern die
    // Angleichung an den Fliesstext-Pfad, der sie seit jeher hat — und im
    // committeten Korpus kommt kein einziges 'LA'-Trailing-Token vor (Messung
    // 28.7.2026: BGE 51, NR 4, SI 3, FR 3, NE 1, ART 1 — sonst nichts).
    expect(statutesZuNormKeys(['art. 5 LA'])).toEqual([]);
    // Echte Kürzel ausserhalb der Sperrliste bleiben unberührt:
    expect(statutesZuNormKeys(['Art. 5 LFG'])).toEqual(['LFG']);
    expect(statutesZuNormKeys(['art. 42 LTF'])).toEqual(['BGG']);
  });
  it('hält die BEKANNTE Lücke im Fliesstext-Pfad fest: «BVV 2» getrennt geschrieben (B7)', () => {
    // extrahiereStatutRefs matcht GESETZ_CODE ohne Leerzeichen → 'Art. 27 BVV 2'
    // liefert gesetz 'BVV' und damit keinen key; nur die zusammengeschriebene
    // Form trifft. Der Extraktor bleibt bewusst unverändert (kampferprobte
    // Falsch-Positiv-Abstimmung); die Lücke ist benannt statt kaschiert (§8) und
    // vom statutes-Pfad gedeckt. Bricht dieser Test, hat sich die Reichweite des
    // Extraktors geändert — dann gehört der Kommentar in normalisiereAbk nachgeführt.
    expect(normKeyFuerAbk('BVV')).toBeNull();
    const getrennt = snap({ abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '3', text: 'Nach Art. 27 BVV 2 gilt …' }] }] });
    expect(normKeysVonSnapshot(getrennt)).toEqual([]);          // Lücke im Fliesstext-Pfad
    const zusammen = snap({ abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '3', text: 'Nach Art. 27 BVV2 gilt …' }] }] });
    expect(normKeysVonSnapshot(zusammen)).toEqual(['BVV_2']);   // zusammengeschrieben trifft
    // Der statutes-Pfad deckt genau diese Schreibweise ab:
    expect(normKeysVonSnapshot(snap({ zitierteNormen: ['Art. 27 BVV 2'] }))).toEqual(['BVV_2']);
  });
});

// ── Baustein d: Zitate im FLIESSTEXT, nicht nur in den Roh-statutes ──────────
const IPRG_TEXT = 'Nach Art. 126 IPRG untersteht die Stellvertretung dem Recht des Staates, '
  + 'in dem der Vertreter seine Niederlassung hat.';

describe('fliesstextVon — deterministische Text-Assemblage', () => {
  it('nimmt Regeste (flach + Sprachfassungen inkl. weitererRegesten) und alle Abschnitts-Blöcke', () => {
    const s = snap({
      regeste: {
        text: 'Regeste-Fliesstext.', quelle: 'opencaselaw',
        sprachfassungen: [{
          sprache: 'de', kopf: 'Kopf DE.', absaetze: ['Absatz DE.'],
          weitereRegesten: [{ label: 'b', kopf: 'Kopf b.', absaetze: ['Absatz b.'] }],
          quelleUrl: 'https://www.bger.ch/x',
        }],
      },
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '1', text: 'Erwägung.' }] }],
      auszugAbschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '2', text: 'Auszug.' }] }],
    });
    expect(fliesstextVon(s)).toBe(
      'Regeste-Fliesstext.\nKopf DE.\nAbsatz DE.\nKopf b.\nAbsatz b.\nErwägung.\nAuszug.',
    );
  });
  it('nimmt Rubrum und Dispositiv-Orders NICHT auf (dort stehen Parteien/Verfahren)', () => {
    const s = snap({
      rubrum: { gegenstand: 'Art. 41 OR', parteien: null, vorinstanz: null, besetzung: null },
      dispositivOrders: ['Die Beschwerde wird nach Art. 66 BGG abgewiesen.'],
    });
    expect(fliesstextVon(s)).toBe('');
  });
});

describe('normKeysVonSnapshot — Roh-statutes ∪ Fliesstext ∪ hint', () => {
  it('findet den Erlass, der NUR im Fliesstext steht (Anlassfall IPRG)', () => {
    const s = snap({ abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '3', text: IPRG_TEXT }] }] });
    expect(normKeysVonSnapshot(s)).toEqual(['IPRG']);
  });
  it('vereinigt Roh-statutes, Fliesstext und hint — alphabetisch sortiert (§2)', () => {
    const s = snap({
      zitierteNormen: ['Art. 32 Abs. 2 BGG'],
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '3', text: IPRG_TEXT }] }],
    });
    expect(normKeysVonSnapshot(s, 'ZPO')).toEqual(['BGG', 'IPRG', 'ZPO']);
  });
  it('nimmt das mehrdeutige «StG» auch aus dem Fliesstext NICHT auf', () => {
    const s = snap({
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '3', text: 'Gestützt auf Art. 12 StG.' }] }],
    });
    expect(normKeysVonSnapshot(s)).toEqual([]);
  });
  it('filtert auch den HINT durch den Ausschluss — der Ausschluss ist total (B6b)', () => {
    // Befund 28.7.2026: der hint ging ungefiltert durch. Über den Quellzweig mit
    // deklarierter Erlass-Bindung wäre 'STG' also doch in den Korpus gelangt und
    // die föderal/kantonale Mehrdeutigkeit stünde wieder in den normKeys (§1/§8).
    expect(normKeysVonSnapshot(snap(), 'STG')).toEqual([]);
    expect(normKeysVonSnapshot(snap({ zitierteNormen: ['Art. 41 OR'] }), 'STG')).toEqual(['OR']);
    expect(normKeysVonSnapshot(snap(), 'ZPO')).toEqual(['ZPO']);   // gültiger hint unberührt
  });
});

describe('remapNormKeys — Re-Map bewahrt nicht rekonstruierbare Alt-Keys (B1)', () => {
  it('behält Alt-Keys, die die Neuberechnung nicht reproduziert', () => {
    // Anlassfall bge_152_I_61: committed ['BGG','BV','ZPO'], neu berechnet
    // ['BGERR','BGG','BV','IPRG'] — 'ZPO' steht WEDER in zitierteNormen NOCH im
    // Fliesstext (0 Treffer \bZPO\b/\bCPC\b) und stammt aus den nie persistierten
    // aza-statutes. Ohne Bewahrung löschte der Re-Map diesen Key still.
    const r = remapNormKeys(['BGG', 'BV', 'ZPO'], ['BGERR', 'BGG', 'BV', 'IPRG']);
    expect(r.keys).toEqual(['BGERR', 'BGG', 'BV', 'IPRG', 'ZPO']);
    expect(r.nurAlt).toEqual(['ZPO']);       // gezählt und ausgewiesen, nicht still (§6.7)
  });
  it('entfernt ausgeschlossene Keys aus dem Altbestand — dafür ist der Ausschluss da', () => {
    const r = remapNormKeys(['OR', 'STG'], ['OR']);
    expect(r.keys).toEqual(['OR']);
    expect(r.nurAlt).toEqual([]);
  });
  it('ist idempotent: das Ergebnis des ersten Laufs ist Fixpunkt des zweiten (§2)', () => {
    const eins = remapNormKeys(['BGG', 'BV', 'ZPO'], ['BGERR', 'BGG', 'BV', 'IPRG']);
    const zwei = remapNormKeys(eins.keys, ['BGERR', 'BGG', 'BV', 'IPRG']);
    expect(zwei.keys).toEqual(eins.keys);
  });
  it('sortiert alphabetisch und dedupliziert (build-pfad-unabhängig, §2)', () => {
    expect(remapNormKeys(['ZPO', 'OR'], ['OR', 'BGG']).keys).toEqual(['BGG', 'OR', 'ZPO']);
  });
  it('leerer Altbestand → reine Neuberechnung', () => {
    expect(remapNormKeys([], ['OR', 'BGG']).keys).toEqual(['BGG', 'OR']);
  });
  // ── Gegenrichtung: die Sperre darf einen Fix nicht rückgängig machen (R3) ──
  it('bewahrt NICHT, was als Literatur-Phantom belegt ist — und weist es aus', () => {
    // bge_150_IV_10 trug 'MSTG' aus dem früheren Backfill; der Erlass kommt dort
    // NUR im Buchtitel eines Kommentars vor. Ohne diesen Zweig schriebe der
    // Re-Map das Phantom zurück und der Fix wäre am Artefakt wirkungslos.
    const r = remapNormKeys(['STGB', 'MSTG'], ['STGB'], new Set(['MSTG']));
    expect(r.keys).toEqual(['STGB']);
    expect(r.nurAlt).toEqual([]);          // NICHT bewahrt …
    expect(r.verworfen).toEqual(['MSTG']); // … sondern gezählt verworfen (§6.7)
  });
  it('ein NICHT belegter Alt-Key bleibt bewahrt — die Sperre wirkt nur gezielt', () => {
    const r = remapNormKeys(['STGB', 'ZPO'], ['STGB'], new Set(['MSTG']));
    expect(r.nurAlt).toEqual(['ZPO']);
    expect(r.verworfen).toEqual([]);
  });
  it('bleibt idempotent, auch mit Verwurf (§2)', () => {
    const eins = remapNormKeys(['STGB', 'MSTG'], ['STGB'], new Set(['MSTG']));
    const zwei = remapNormKeys(eins.keys, ['STGB'], new Set(['MSTG']));
    expect(zwei.keys).toEqual(eins.keys);
    expect(zwei.verworfen).toEqual([]);
  });

  it('nurAlt ist dedupliziert und sortiert — die Zahl misst, was wirklich bewahrt wird', () => {
    // Linse 2: ein Bestands-Snapshot mit doppeltem Alt-Key meldete «2 bewahrte
    // Keys», obwohl `keys` nur EINEN bewahrt (Set). Die Kennzahl des Backfill-
    // Laufs war damit zu hoch (§8).
    const r = remapNormKeys(['ZPO', 'ZPO', 'BGG', 'OR'], ['OR']);
    expect(r.nurAlt).toEqual(['BGG', 'ZPO']);
    expect(r.keys).toEqual(['BGG', 'OR', 'ZPO']);
  });
});

describe('undeklarierteAltKeys — die Bewahrung ist deklariert, nicht pauschal (Linse 3)', () => {
  const DEKLARIERT = new Map<string, readonly string[]>([['bund/bge/152_I_61', ['ZPO']]]);

  it('lässt den deklarierten Alt-Key durch', () => {
    const bewahrt = new Map<string, readonly string[]>([['bund/bge/152_I_61', ['ZPO']]]);
    expect(undeklarierteAltKeys(bewahrt, DEKLARIERT)).toEqual([]);
  });

  it('meldet den Beinahe-Fall: eine korrigierte Fehlzuordnung darf NICHT zurück', () => {
    // Wäre der Backfill vor dem Trunkierungs-Fix gelaufen (LPMéd → 'LPM' → MSCHG),
    // hätte die pauschale Bewahrung die fünf falschen MSCHG-Keys konserviert.
    const bewahrt = new Map<string, readonly string[]>([
      ['bund/bge/151_I_19', ['MSCHG']],
      ['bund/bge/148_I_1', ['MSCHG']],
    ]);
    expect(undeklarierteAltKeys(bewahrt, DEKLARIERT)).toEqual([
      'bund/bge/148_I_1: MSCHG',
      'bund/bge/151_I_19: MSCHG',        // sortiert (§2), vollständige Liste
    ]);
  });

  it('meldet auch einen ZUSÄTZLICHEN Key an einem deklarierten Snapshot', () => {
    // Die Deklaration gilt je Snapshot UND je Key — nicht «dieser Snapshot ist frei».
    const bewahrt = new Map<string, readonly string[]>([['bund/bge/152_I_61', ['MSCHG', 'ZPO']]]);
    expect(undeklarierteAltKeys(bewahrt, DEKLARIERT)).toEqual(['bund/bge/152_I_61: MSCHG']);
  });

  it('leere Deklaration ⇒ jede Bewahrung ist ein Befund (fail-closed, §6.7)', () => {
    const bewahrt = new Map<string, readonly string[]>([['bund/bge/152_I_61', ['ZPO']]]);
    expect(undeklarierteAltKeys(bewahrt, new Map())).toEqual(['bund/bge/152_I_61: ZPO']);
  });

  it('nichts bewahrt ⇒ nichts zu melden', () => {
    expect(undeklarierteAltKeys(new Map(), DEKLARIERT)).toEqual([]);
  });
});

// ── Gegenprüfung R3 — Literatur-Kontext-Regel auf BEIDEN Ebenen ─────────────
//
// FACHLICHE ÄNDERUNG, deklariert (§6.3) — und zwar eine RICHTUNGSKORREKTUR: die
// hier zuvor festgeschriebene Korroborations-Regel (statutes ODER Regeste ODER
// ≥2 Nennungen, Commit 5e8b49c0) ist ZURÜCKGEBAUT. Sie ist an der eigenen
// Messung gescheitert — in der gleichverteilten Stichprobe ihrer Verwerfungen
// war rund die Hälfte ECHTE Rechtsanwendung (ATSG/17, ZPO/138, OR/30, STPO/428,
// EMRK/6). Häufigkeit ist kein Signal für Tragfähigkeit.
//
// An ihrer Stelle steht eine gezielte KONTEXT-Regel: Nennungen innerhalb einer
// deklarierten Zitier-Apparat-Spanne zählen nicht, alle anderen wieder ohne
// Schwelle. Diese Tests wurden deshalb umgeschrieben statt angepasst — das ist
// keine Verhaltensneutralität und wird auch nicht als solche ausgegeben.
const ERW = (text: string) => [{ typ: 'erwaegung' as const, bloecke: [{ marke: '3', text }] }];

describe('Literatur-Kontext-Regel — Spannen-Definition (R3)', () => {
  it('jeder Marker trägt Beleg und Korpus-Zahl (§7 — kein Marker ohne Fundstelle)', () => {
    expect(LITERATUR_MARKER.length).toBe(3);
    for (const m of LITERATUR_MARKER) {
      expect(m.beleg.length).toBeGreaterThan(40);
      expect(m.korpus).toMatch(/\d/);
    }
  });

  it('die Spanne endet am nächsten Segment-Ende (; ) » oder Zeilenende)', () => {
    expect(ohneLiteraturApparat('X (KÜNZLE, N. 508/509 zu Art. 517-518 ZGB; PILLER) Y'))
      .toBe('X (KÜNZLE,  ; PILLER) Y');
    expect(ohneLiteraturApparat('a (NIGGLI, Ein Kommentar zu Art. 171c MStG, 2007) b'))
      .toBe('a (NIGGLI, Ein  ) b');
    expect(ohneLiteraturApparat('u (DENYS, n° 10 ad art. 123c Cst.) v'))
      .toBe('u (DENYS, n° 10  ) v');
    // Zeilenende schliesst die Spanne, die nächste Zeile bleibt unberührt.
    expect(ohneLiteraturApparat('N. 3 zu Art. 5 OR\nGestützt auf Art. 41 OR ist …'))
      .toBe(' \nGestützt auf Art. 41 OR ist …');
  });

  it('MONOTONIE: die Regel nimmt nur weg, sie erzeugt nie ein Zitat', () => {
    // Die gefährliche Form: der Marker steht ZWISCHEN einer Artikelzahl und einem
    // Erlass-Code. Klebte der Rest zusammen, entstünde ART.5.OR aus dem Nichts —
    // eine Fehlzuordnung, wo vorher nur eine fehlende war (§1).
    const heikel = 'Art. 5 N. 1 zu Art. 9 CC; OR';
    expect(ohneLiteraturApparat(heikel)).not.toMatch(/Art\. 5\s*OR/);
    const roh = new Set(extrahiereStatutRefs(heikel).map((r) => r.normalisiert));
    for (const r of extrahiereStatutRefs(ohneLiteraturApparat(heikel))) {
      expect(roh.has(r.normalisiert)).toBe(true);
    }
    // Am committeten Korpus gemessen (5'093 Snapshots, 28.7.2026): 0 gewonnene
    // Refs, 0 gewonnene Register-keys — die Teilmengen-Beziehung hält überall.
  });

  it('rein und idempotent (§2)', () => {
    const t = 'A (X, N. 3 zu Art. 5 OR; Y) B';
    expect(ohneLiteraturApparat(ohneLiteraturApparat(t))).toBe(ohneLiteraturApparat(t));
    expect(ohneLiteraturApparat(t)).toBe(ohneLiteraturApparat(t));
  });
});

describe('Literatur-Kontext-Regel — Wirkung auf beiden Ebenen (R3)', () => {
  // Die drei ERWARTETEN Verwerfungen, je am Korpus-Beleg nachgestellt.
  it('BGE 150 IV 10: MSTG/171c verschwindet — Artikel NUR im Kommentar-Buchtitel', () => {
    const t = 'NIGGLI, Rassendiskriminierung, Ein Kommentar zu Art. 261bis StGB und '
      + 'Art. 171c MStG, 2a ed. 2007, n. 405 e 407).';
    const s = snap({ abschnitte: ERW(t) });
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual([]);
    expect(normKeysVonSnapshot(s)).toEqual([]);   // auch die ERLASS-Ebene
  });

  it('BGE 146 III 106: ZGB/517 verschwindet — nur «N. 508/509 zu Art. 517-518 ZGB»', () => {
    const t = 'Der Betreibungsort der unverteilten Erbschaft (Art. 49 SchKG) gilt auch bei '
      + 'einer Betreibung gegen den Willensvollstrecker (KÜNZLE, Berner Kommentar, 2011, '
      + 'N. 508/509 zu Art. 517-518 ZGB; PILLER, in: Commentaire romand, 2016, '
      + 'N. 131 zu Art. 518 ZGB).';
    const s = snap({ abschnitte: ERW(t) });
    // SchKG/49 steht im Erwägungstext und BLEIBT; beide ZGB-Fundstellen fallen weg.
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual(['SCHKG/49']);
  });

  it('die Marker greifen auch punktlos («N 51 zu Art.») und als Randziffer («Rz 46 zu Art.»)', () => {
    // Belege: bs_sozialversicherungsgericht/BV.2026.5 bzw. .../KV.2025.2.
    expect([...artikelSchluesselVonSnapshot(snap({
      abschnitte: ERW('(STAUFFER, 2. Aufl., Bern 2019, N 51 zu Art. 26 BVG).'),
    }))]).toEqual([]);
    expect([...artikelSchluesselVonSnapshot(snap({
      abschnitte: ERW('(EUGSTER, Basel 2020, Rz 46 zu Art. 64a KVG).'),
    }))]).toEqual([]);
  });

  // ── GEGENPROBE (Pflicht): ein ECHTES Zitat in der NÄHE eines Markers bleibt ──
  it('Gegenprobe 1: die Nennung VOR der Klammer bleibt, die darin fällt weg', () => {
    const s = snap({
      abschnitte: ERW('Gestützt auf Art. 41 OR (vgl. NIGGLI, Kommentar zu Art. 41 OR) '
        + 'haftet die Beklagte.'),
    });
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual(['OR/41']);
    expect(normKeysVonSnapshot(s)).toEqual(['OR']);
  });

  it('Gegenprobe 2: nach dem Semikolon endet die Spanne — das Folgezitat bleibt', () => {
    const s = snap({
      abschnitte: ERW('(KÜNZLE, N. 12 zu Art. 517 ZGB; im Ergebnis ist Art. 138 ZPO '
        + 'massgebend).'),
    });
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual(['ZPO/138']);
  });

  it('Gegenprobe 3: die nächste ZEILE ist nie Teil der Spanne', () => {
    const s = snap({
      abschnitte: ERW('Dazu MARKWALDER, n° 2 ad art. 123c Cst.\n'
        + 'Nach Art. 17 ATSG sind die revisionsrechtlichen Grundsätze anwendbar.'),
    });
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual(['ATSG/17']);
  });

  it('KEINE Schwelle mehr: eine EINZELNE Nennung im Erwägungstext trägt wieder', () => {
    // Genau die Klasse, die die zurückgebaute Häufigkeits-Regel gelöscht hat.
    const faelle: Array<[string, string]> = [
      ['Es sind die in Art. 17 ATSG verankerten Grundsätze sinngemäss anwendbar.', 'ATSG/17'],
      ['Die Zustellfiktion nach Art. 138 Abs. 3 lit. a ZPO greift.', 'ZPO/138'],
      ['Eine Furchterregung im Sinne von Art. 30 OR liegt nicht vor.', 'OR/30'],
      ['Die Kostenfolge richtet sich nach Art. 428 StPO.', 'STPO/428'],
      ['Art. 6 Ziff. 1 EMRK ist auf Steuerverfahren nicht anwendbar.', 'EMRK/6'],
      ['Vgl. Art. 50 f. DBG zur interkantonalen Zuteilung.', 'DBG/50'],
      ['Der Tatbestand von Art. 179 septies StGB ist erfüllt.', 'STGB/179septies'],
    ];
    for (const [text, key] of faelle) {
      expect([...artikelSchluesselVonSnapshot(snap({ abschnitte: ERW(text) }))]).toEqual([key]);
    }
  });

  it('der statutes-Zweig bleibt roh und ungefiltert (dort steht kein Apparat)', () => {
    const s = snap({ zitierteNormen: ['Art. 41 OR', 'Art. 12 StG'], abschnitte: ERW(IPRG_TEXT) });
    // 'StG' bleibt ausgeschlossen (föderal/kantonal mehrdeutig) — Regel unberührt.
    expect([...artikelSchluesselVonSnapshot(s)].sort()).toEqual(['IPRG/126', 'OR/41']);
  });

  it('der Verwurf wird GEZÄHLT zurückgegeben (§6.7, kein stiller Filter)', () => {
    const s = snap({
      abschnitte: ERW('Haftung nach Art. 41 OR (KÜNZLE, N. 508/509 zu Art. 517-518 ZGB).'),
    });
    const b = artikelSchluesselMitBefund(s);
    expect([...b.schluessel]).toEqual(['OR/41']);
    expect(b.literaturVerworfen).toEqual(['ZGB/517']);
    expect(b.literaturSpannenZahl).toBe(1);
    expect(b.literaturNennungen).toBe(1);
    // Die Schlüssel-Menge ist bitgleich die der Produktions-Funktion (§5).
    expect([...b.schluessel]).toEqual([...artikelSchluesselVonSnapshot(s)]);
  });

  it('literaturEntfernteNormKeys belegt die Ursache mechanisch (Beleg statt Annahme)', () => {
    const t = 'NIGGLI, Rassendiskriminierung, Ein Kommentar zu Art. 261bis StGB und '
      + 'Art. 171c MStG, 2a ed. 2007). Der Tatbestand von Art. 261bis StGB ist erfüllt.';
    const s = snap({ abschnitte: ERW(t) });
    // 'MSTG' verschwindet durch die Regel; 'STGB' steht auch im Erwägungstext.
    expect(literaturEntfernteNormKeys(s)).toEqual(['MSTG']);
    expect(normKeysVonSnapshot(s)).toEqual(['STGB']);
    // Was der statutes-Zweig trägt, gilt nie als literatur-entfernt.
    const mitStatutes = snap({ ...s, zitierteNormen: ['Art. 171c MStG'] });
    expect(literaturEntfernteNormKeys(mitStatutes)).toEqual([]);
  });

  it('BEIDE Ebenen lesen denselben bereinigten Text — keine Divergenz mehr', () => {
    const s = snap({ abschnitte: ERW(IPRG_TEXT) });
    expect(normKeysVonSnapshot(s)).toEqual(['IPRG']);
    expect([...artikelSchluesselVonSnapshot(s)]).toEqual(['IPRG/126']);
  });
});

// ─── FASSUNGS-REIHEN: ein SR-Slot, zwei Fassungen (Totalrevision) ────────────
//
// FACHLICHE ÄNDERUNG, deklariert (§6.3 — neue Fälle, keine gelockerte
// Erwartung): SR 412.103.1 trägt seit dem 1.3.2026 zwei Register-Einträge mit
// demselben amtlichen Kürzel «BMV» — die geltende Verordnung vom 13.6.2025
// (`BMV_2025`) und ihre aufgehobene Vorgängerin von 2009 (`BMV`). Die
// Kollisionsregel hätte das Kürzel beidseitig verworfen und mit ihm die
// fremdsprachigen Aliase «OMPr» (fr/it); ein Entscheid zur Berufsmaturität
// hätte GAR KEINEN Norm-Key mehr bekommen. Statt zu verwerfen wird am
// deklarierten Aufhebungsdatum entschieden. Die beiden Tore oben
// (`ABK_KOLLISIONEN` exakt leer, `ABK_ALIAS_NOTIZEN` exakt leer) bleiben
// deshalb unverändert grün — sie sind der Beweis, dass hier keine Ausnahme
// eingetragen, sondern die Zuordnung fachlich richtig gestellt wurde.
describe('Fassungs-Reihen — zeitliche Geltung statt Kollision (§1)', () => {
  it('erkennt genau die deklarierte Abfolge, mit Nachfolger und Datum', () => {
    // EXAKTE Liste: eine Reihe entschärft die Kollisionsregel für ein Kürzel.
    // Wächst sie unbemerkt, wächst unbemerkt die Menge der Kürzel, die nicht
    // mehr beidseitig verworfen werden (§6.7).
    expect([...ERLASS_FASSUNGS_REIHEN]).toEqual([
      'SR 412.103.1: BMV_2025 (geltend) ← BMV bis 2026-03-01',
    ]);
  });
  it('löst «BMV» am ENTSCHEIDDATUM auf — alt vor, neu ab dem 1.3.2026', () => {
    expect(normKeyFuerAbk('BMV', '2020-05-04')).toBe('BMV');
    expect(normKeyFuerAbk('BMV', '2026-02-28')).toBe('BMV');
    expect(normKeyFuerAbk('BMV', '2026-03-01')).toBe('BMV_2025');  // Inkrafttreten
    expect(normKeyFuerAbk('BMV', '2026-07-01')).toBe('BMV_2025');
  });
  it('ohne Datum: die heute geltende Fassung (Existenz-Fragen der Tore)', () => {
    expect(normKeyFuerAbk('BMV')).toBe('BMV_2025');
    expect(normKeyFuerAbk('BMV_2025')).toBe('BMV_2025');
  });
  it('die fremdsprachigen Aliase «OMPr» erben dieselbe Abfolge', () => {
    // Ohne die Reihe war die SR-Nummer mehrdeutig und BEIDE Aliase verworfen —
    // ein französischsprachiger Berufsmaturitäts-Entscheid verlor seinen Key.
    expect(normKeyFuerAbk('OMPr')).toBe('BMV_2025');
    expect(normKeyFuerAbk('OMPr', '2019-01-01')).toBe('BMV');
    expect(normKeyFuerAbk('OMPr', '2026-03-01')).toBe('BMV_2025');
  });
  it('greift End-to-End über Fliesstext UND Roh-statutes (beide Ebenen)', () => {
    const alt = snap({
      datum: '2020-05-04',
      zitierteNormen: ['Art. 20 BMV'],
      abschnitte: [{ typ: 'erwaegung', bloecke: [{ marke: '2', text: 'Nach Art. 20 BMV gilt …' }] }],
    });
    expect(normKeysVonSnapshot(alt)).toEqual(['BMV']);
    expect([...artikelSchluesselVonSnapshot(alt)]).toEqual(['BMV/20']);

    const neu = snap({ ...alt, datum: '2026-06-30' });
    expect(normKeysVonSnapshot(neu)).toEqual(['BMV_2025']);
    expect([...artikelSchluesselVonSnapshot(neu)]).toEqual(['BMV_2025/20']);
  });
  it('das Fassungs-Datum ist das Entscheiddatum, nie «heute» (§2)', () => {
    expect(fassungsDatumVon(snap({ datum: '2020-05-04' }))).toBe('2020-05-04');
  });
  it('SABOTAGE: doppelte SR OHNE deklarierte Aufhebung bleibt Kollision (§6.7)', () => {
    // Der Riegel muss scheitern KÖNNEN. Zwei Einträge auf derselben SR-Nummer,
    // beide geltend → keine Reihe → die strenge Kollisionsregel bleibt.
    const ohneAufhebung = [
      { key: 'A_ALT', kuerzel: 'A', titel: 'a', sr: '999.9', ebene: 'bund' },
      { key: 'A_NEU', kuerzel: 'A', titel: 'b', sr: '999.9', ebene: 'bund' },
    ] as never;
    expect([...fassungsReihen(ohneAufhebung, () => null).keys()]).toEqual([]);

    // Und: eine Aufhebung OHNE auflösbaren Nachfolger reicht auch nicht — die
    // Abfolge muss beidseitig belegt sein, nicht aus der SR-Nummer erschlossen.
    const ohneNachfolger = [
      { key: 'B_ALT', kuerzel: 'B', titel: 'a', sr: '999.8', ebene: 'bund', aufgehoben: { seit: '2026-03-01' } },
      { key: 'B_NEU', kuerzel: 'B', titel: 'b', sr: '999.8', ebene: 'bund' },
    ] as never;
    expect([...fassungsReihen(ohneNachfolger, () => null).keys()]).toEqual([]);

    // Mit Nachfolger-ELI, die in dieselbe Gruppe auflöst, entsteht sie dagegen.
    const vollstaendig = [
      { key: 'C_ALT', kuerzel: 'C', titel: 'a', sr: '999.7', ebene: 'bund', aufgehoben: { seit: '2026-03-01', nachfolger: { sr: '999.7', titel: 'b', eli: 'cc/2025/1' } } },
      { key: 'C_NEU', kuerzel: 'C', titel: 'b', sr: '999.7', ebene: 'bund' },
    ] as never;
    expect([...fassungsReihen(vollstaendig, () => 'C_NEU').keys()]).toEqual(['999.7']);
  });
});
