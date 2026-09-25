import { describe, it, expect } from 'vitest';
import {
  istVerfuegbar,
  ALLE_KARTEN, KATALOG_KARTEN, RECHTSGEBIETE, RECHTSGEBIET_SEKTIONEN, RECHTSBEREICH_SEKTIONEN,
  SEKTIONEN, VORLAGE_SEKTIONEN, karte,
} from '../lib/startseiteConfig';
import { CALCULATORS } from '../lib/calculators';

// Annahmekriterien «Fedlex-Direktlinks für die Norm-Pills»:
// artikelgenaue Anker, kein ?version=, geplante Kacheln ohne Pills.

// Ehrliches Status-Modell: «aktiv» = entwurf|geprüft; aktuell ist NICHTS geprüft.
const aktiv = ALLE_KARTEN.filter((k) => k.status !== 'geplant');
const geplant = ALLE_KARTEN.filter((k) => k.status === 'geplant');

describe('Norm-Pills (Fedlex-Direktlinks)', () => {
  it('jede aktive Kachel (Entwurf) trägt mindestens ein Norm-Pill', () => {
    aktiv.forEach((k) => expect(k.norms.length, k.id).toBeGreaterThan(0));
  });

  it('jede URL ist ein Fedlex-Direktlink: artikelgenauer Anker ODER Gesetzes-Seite (Normentreue-Fallback)', () => {
    // Anker-los nur erlaubt, wenn die Pill ein GANZES Gesetz referenziert
    // (Label ohne «Art.») – z. B. das Fristengesetz SR 173.110.3 beim
    // Tagerechner (Auftrag 5.6.2026: Link auf die Gesetzes-Seite, bis ein
    // Anker artikelgenau verifiziert und fachlich abgenommen ist).
    aktiv.flatMap((k) => k.norms).forEach((n) => {
      if (/^Art\./.test(n.label)) {
        expect(n.url, n.label).toMatch(/^https:\/\/www\.fedlex\.admin\.ch\/eli\/cc\/[\w/]+\/de#art_\d+(_[a-z])?$/);
      } else {
        expect(n.url, n.label).toMatch(/^https:\/\/www\.fedlex\.admin\.ch\/eli\/cc\/[\w/]+\/de$/);
      }
    });
  });

  it('keine URL enthält einen ?version=-Parameter', () => {
    aktiv.flatMap((k) => k.norms).forEach((n) => expect(n.url, n.label).not.toContain('?version='));
  });

  it('kein Eintrag ist «geprüft»; alle Pills tragen verified:false bis zur fachlichen Prüfung', () => {
    expect(ALLE_KARTEN.some((k) => k.status === 'geprüft')).toBe(false);
    aktiv.flatMap((k) => k.norms).forEach((n) => expect(n.verified, n.label).toBe(false));
  });

  it('Aufzählungs-Labels (/, ·, «und») sind in Einzel-Pills aufgetrennt', () => {
    aktiv.flatMap((k) => k.norms).forEach((n) => {
      expect(n.label, n.label).not.toMatch(/[/·]| und /);
    });
  });

  it('geplante Kacheln («In Vorbereitung») tragen keine Norm-Pills', () => {
    expect(geplant.length).toBeGreaterThan(0);
    geplant.forEach((k) => expect(k.norms, k.id).toEqual([]));
  });
});

// Implementierte Vorlagen-Routen (manuell gepflegt, vgl. src/App.tsx)
const VORLAGEN_ROUTEN = new Set(['/vorlagen/testament', '/vorlagen/patientenverfuegung', '/vorlagen/vorsorgeauftrag', '/vorlagen/schlichtungsgesuch-bs', '/vorlagen/arbeitsvertrag', '/vorlagen/mietvertrag', '/vorlagen/vollmacht', '/vorlagen/klage-vereinfacht', '/vorlagen/klage-ordentlich', '/vorlagen/kuendigung-arbeitnehmer', '/vorlagen/kuendigung-arbeitgeber', '/vorlagen/kuendigung-mieter', '/vorlagen/kuendigung-vertrag', '/vorlagen/kuendigung-vermieter', '/vorlagen/mietvertrag#untermiete', '/vorlagen/gmbh-gruendung', '/vorlagen/ag-gruendung', '/vorlagen/kapitalerhoehung', '/vorlagen/auftrag', '/vorlagen/werkvertrag', '/vorlagen/nda', '/vorlagen/konkubinat', '/vorlagen/mahnung', '/vorlagen/verjaehrungsverzicht', '/vorlagen/forderungsabtretung', '/vorlagen/fristerstreckung', '/vorlagen/nichtbekanntgabe-betreibung', '/vorlagen/scheidungsklage', '/vorlagen/scheidungsbegehren-gemeinsam', '/vorlagen/eheschutzgesuch', '/vorlagen/rubrum']);

describe('Routen-Integrität', () => {
  it('jede aktive Karte verlinkt auf eine registrierte Route', () => {
    const slugs = new Set(CALCULATORS.map((c) => c.slug));
    aktiv.forEach((k) => {
      if (k.modus === 'vorlage') {
        expect(VORLAGEN_ROUTEN.has(k.href!), `${k.id} → ${k.href}`).toBe(true);
        // Deklarierte Verfeinerung 6.6.2026 (Maske 2b): schemaId nur für
        // EXPORTIERENDE Vorlagen Pflicht — reine Checklisten (§8-Grenze,
        // kein output) haben bewusst kein Schema.
        if (k.output && k.output.length > 0) expect(k.schemaId, k.id).toBeTruthy();
      } else {
        expect(k.href, k.id).toMatch(/^\/rechner\//);
        const slug = k.href!.replace('/rechner/', '').split('#')[0];
        expect(slugs.has(slug), `${k.id} → ${slug}`).toBe(true);
      }
    });
  });

  it('jeder registrierte Rechner hat eine aktive Katalog-Karte', () => {
    const hrefs = new Set(aktiv.map((k) => k.href!.split('#')[0]));
    CALCULATORS.filter((c) => c.status === 'entwurf').forEach((c) => {
      expect(hrefs.has(`/rechner/${c.slug}`), c.slug).toBe(true);
    });
  });
});

describe('Modus «Vorlagen» (Katalog-Regeln)', () => {
  const vorlagen = ALLE_KARTEN.filter((k) => k.modus === 'vorlage');

  // S-2 STRUKTUR-UMBAU 10.6.2026 (deklariert): 'korrespondenz' →
  // 'erklaerung' (Einseitige Willenserklärungen), Reihenfolge nach Davids
  // Wortlaut; Detail-Invarianten in vorlagenKategorie.test.ts.
  it('alle fünf Dokument-Gruppen sind belegt (inkl. erklaerung)', () => {
    (['eingabe', 'vertrag', 'erklaerung', 'gesellschaft', 'vorsorge'] as const).forEach((art) => {
      expect(vorlagen.some((v) => v.art === art), art).toBe(true);
    });
  });

  it('geplante Vorlagen: keine Norm-Pills, kein href, keine schemaId', () => {
    vorlagen.filter((v) => v.status === 'geplant').forEach((v) => {
      expect(v.norms, v.id).toEqual([]);
      expect(v.href, v.id).toBeUndefined();
      expect('schemaId' in v && v.schemaId, v.id).toBeFalsy();
    });
  });

  it('jede Karte trägt einen gültigen Modus; related-IDs lösen modusübergreifend auf', () => {
    const ids = new Set(ALLE_KARTEN.map((k) => k.id));
    ALLE_KARTEN.forEach((k) => {
      expect(['rechner', 'vorlage'], k.id).toContain(k.modus);
      (k.related ?? []).forEach((r) => expect(ids.has(r), `${k.id} → ${r}`).toBe(true));
    });
  });
});

// ── Katalog-Integrität nach dem Ausbau auf 111 Einträge (Review-Befunde) ────

describe('Katalog-Integrität (Rechtsgebiet-Gliederung)', () => {
  it('jede Karte hat ein rechtsgebiet aus RECHTSGEBIETE (sonst keine Sektion → unsichtbar)', () => {
    const set = new Set(RECHTSGEBIETE);
    ALLE_KARTEN.forEach((k) => expect(set.has(k.rechtsgebiet), `${k.id}: ${k.rechtsgebiet}`).toBe(true));
  });

  it('jeder rechtsbereich ist einer der vier definierten Codes', () => {
    const set = new Set(RECHTSBEREICH_SEKTIONEN.map((b) => b.code));
    ALLE_KARTEN.forEach((k) => expect(set.has(k.rechtsbereich), k.id).toBe(true));
  });

  it('jede Karten-id ist eindeutig', () => {
    const ids = ALLE_KARTEN.map((k) => k.id);
    expect(new Set(ids).size, JSON.stringify(ids.filter((x, i) => ids.indexOf(x) !== i))).toBe(ids.length);
  });

  it('Rechner-art ∈ Output-Typen, Vorlage-art ∈ Dokument-Typen (sonst leere Filter-Pill)', () => {
    const rechnerArt = new Set(SEKTIONEN.map((s) => s.art));
    const vorlageArt = new Set(VORLAGE_SEKTIONEN.map((s) => s.art));
    ALLE_KARTEN.forEach((k) =>
      expect((k.modus === 'rechner' ? rechnerArt : vorlageArt).has(k.art), `${k.id}/${k.art}`).toBe(true));
  });

  it('geplante Rechner: keine Norm-Pills, kein href (Invariante wie bei Vorlagen)', () => {
    ALLE_KARTEN.filter((k) => k.modus === 'rechner' && k.status === 'geplant').forEach((k) => {
      expect(k.norms, k.id).toEqual([]);
      expect(k.href, k.id).toBeUndefined();
    });
  });

  it('related verweist nie auf sich selbst und löst auf (modusübergreifend)', () => {
    const ids = new Set(ALLE_KARTEN.map((k) => k.id));
    ALLE_KARTEN.forEach((k) => (k.related ?? []).forEach((r) => {
      expect(r, `${k.id} self-ref`).not.toBe(k.id);
      expect(ids.has(r), `${k.id} → ${r}`).toBe(true);
    }));
  });

  it('Sektions-ids sind innerhalb jeder Gliederung eindeutig', () => {
    for (const arr of [RECHTSGEBIET_SEKTIONEN, RECHTSBEREICH_SEKTIONEN, SEKTIONEN, VORLAGE_SEKTIONEN]) {
      const ids = arr.map((s: { id: string }) => s.id);
      expect(new Set(ids).size, ids.join(',')).toBe(ids.length);
    }
    // bewusst NICHT arrayübergreifend: gerendert wird nur die
    // Rechtsgebiet-Gliederung; die übrigen Listen speisen Filter-Pills.
  });

  it('die von den Wizard-Seiten referenzierten karte()-ids existieren', () => {
    ['schlichtungsgesuch', 'patientenverfuegung', 'eigenhaendiges-testament', 'vorsorgeauftrag', 'arbeitsvertrag', 'mietvertrag-wohnen']
      .forEach((id) => expect(karte(id), id).toBeDefined());
  });
});

// GESTRICHEN (S5a W2·29-WERKBANK-REST, 25.9.2026, deklariert §6.3/§6.7): der
// Test «Detailseiten-Titel = Katalog-Kartentitel (Vereinheitlichung 7.6.2026)».
// Seit W2·29-WERKBANK-TOR (22.9.2026) leitet `calculators.ts` den Titel aus
// derselben Karte ab (`titel: karte.title`) — der Vergleich prüfte die Quelle
// gegen sich selbst. Einzige verbliebene Rot-Möglichkeit war eine Test-Kopie
// der Kanon-Abbildung (`MANUELL` ≙ `KANON_KARTE_JE_SLUG`), also eine zweite
// Wahrheit (§5). Wirksame Wache: `check:sediment` (c2), keine Metadaten-
// Literale in der Registry.

describe('istVerfuegbar (Pro-Katalog-Auftrag, Phase 1)', () => {
  // Deklarierte Erweiterung 6.6.2026: + Erb-Fristen-Rechner (Quick-Win 1) → 21.
  // Deklarierte Erweiterung Katalog-Split 6.6.2026 (Auftrag David): die längst
  // gebauten Rechtswege SchKG/Straf des Zuständigkeitsrechners erhalten eigene
  // Gebiets-Einstiegskarten (schkg-/straf-zustaendigkeit, entwurf) → 23.
  // Deklarierte Erweiterung Kündigungs-Masken 6.6.2026: Vorlagen 9–13
  // (1a AN free · 1b AG · 2a Mieter · 3 Vertrag/Presets · 2b Vermieter-
  // Checkliste [§8-Grenze, ohne Export]) → 28. Familie KOMPLETT.
  // + Untermietvertrag-Einstieg (Plan B.6: Deep-Link in die Mietvertrags-
  // Weiche, gleiches Schema) → 29; + Fristenspiegel (FAHRPLAN-PRAXIS 3.1b,
  // Pilot A.4 Vermieter-Kündigung) → 30; + Streitwert (Quick-Win B.9) → 31;
  // + Gründungs-Checklisten GmbH/AG (Auftrag David 6.6.2026, Spez.
  // recherche/gmbh-gruendung.md Teil 5 + ag-gruendung.md; §8 ohne Export) → 33.
  // + Kapitalerhöhung AG/GmbH als Dokumentmappe (Plan 9c, Auftrag David
  // 7.6.2026, Spez. recherche/kapitalerhoehung-wortlaute.md) → 35.
  // Deklarierte Anpassung Konsolidierung 7.6.2026 (FAHRPLAN-KATALOG-
  // KONSOLIDIERUNG): −3 Deep-Link-Karten GELÖSCHT (untermietvertrag,
  // schkg-/straf-zustaendigkeit — reine Hash-Einstiege derselben Seiten),
  // 4 Masken-Karten via imKatalog:false VERSTECKT (bleiben SSoT ihrer
  // Seiten; Auffindbarkeit tragen die Themen-Einstiege) → 32 gebaut,
  // davon 28 im sichtbaren Katalog.
  // Deklarierte Anpassung S-3 STRUKTUR-UMBAU 10.6.2026 abends (Auftrag
  // David, übersteuert E2 für die Zuständigkeit): die Rechtsweg-Karten
  // schkg-/straf-zustaendigkeit kehren als eigene Felder ZURÜCK (+2
  // entwurf) → 34 gebaut / 30 sichtbar; dazu verwaltung-zustaendigkeit
  // als geplantes viertes Feld.
  // Deklarierte Anpassung S-5c (gleicher Auftrag): Karte «Fristenspiegel»
  // AUFGELÖST (−1; Ereignis-Blöcke leben in den Fach-Rechnern) →
  // 34 gebaut / 30 sichtbar (10.6.2026 abends: + klage-ordentlich,
  // Auftrag David — dritte Klage-Vorlage, alle Kantone).
  // Deklarierte Anpassung 11.6.2026 (Auftrag David «mache mahnungsengine»):
  // + Vorlage «Mahnung & Inverzugsetzung» (B.9, geplant → entwurf) →
  // 35 gebaut / 31 sichtbar.
  // Deklarierte Anpassung 11.6.2026 (Auftrag David, FAHRPLAN-BGER-RECHTSWEG):
  // + Rechner «Beschwerde ans Bundesgericht (BGG)» (bgg-fristen,
  // geplant → entwurf) → 36 gebaut / 32 sichtbar.
  // Deklarierte Anpassung 12.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2, GO David):
  // + Vorlage «Verjährungsverzichtserklärung» (P1 Wettbewerbsanalyse,
  // neu als entwurf) → 37 gebaut / 33 sichtbar.
  // Deklarierte Anpassung 12.6.2026 (Musterklagen-Auftrag David):
  // + Vorlagen «Scheidungsklage» (Art. 290 ZPO), «Gemeinsames
  // Scheidungsbegehren» (Art. 285/286 ZPO) und «Eheschutzgesuch»
  // (Art. 175 ff. ZGB) → 40 gebaut / 36 sichtbar.
  // Deklarierte Anpassung 13.6.2026 (FAHRPLAN-VORLAGEN-AUSBAU V2-Rest,
  // GO David «alles abgenommen»): + Vorlagen «Abtretungserklärung (Zession)»,
  // «Fristerstreckungsgesuch» und «Nichtbekanntgabe einer Betreibung»
  // (P1 Wettbewerbsanalyse, neu als entwurf) → 43 gebaut / 39 sichtbar.
  // 13.6.2026 (V3 komplett): +«Auftrag» +«Werkvertrag» +«NDA» +«Konkubinat»
  // → 47 gebaut / 43 sichtbar.
  // 14.6.2026 (P1 Hauptmoat): +«Prozesskosten (Gerichts- & Parteikosten)»
  // (geplant→entwurf, Rechner /rechner/prozesskosten) → 48 gebaut / 44 sichtbar.
  // 15.6.2026: +«Notariats- & Grundbuchkosten (Grundstückkauf)»
  // (Rechner /rechner/notariat-grundbuch, Rechtsgebiet Immobilien) → 49 gebaut / 45 sichtbar.
  // Deklarierte Anpassung 5.7.2026 (ROADMAP W2·7 «Verzahnungs-Klingen»):
  // Gerichts-Baustein-Set +«Rubrum (Entscheidkopf)» (Vorlage /vorlagen/rubrum,
  // Art. 238 ZPO / Art. 112 BGG) +«Amtlicher Zitierer (BGE/BGer)» (Rechner
  // /rechner/gerichtszitat); +«Verjährungs- & Gewährleistungs-Board» (Rechner
  // /rechner/verjaehrung-board) +«Forderungs- & Inkasso-Strecke» (Rechner
  // /rechner/inkasso-strecke) → 53 gebaut / 49 sichtbar.
  it('verfügbar = status !== geplant; Regressionszählung 53 gebaut / 49 sichtbar (Stand 5.7.2026)', () => {
    const verf = ALLE_KARTEN.filter(istVerfuegbar);
    expect(verf.length).toBe(53);
    expect(KATALOG_KARTEN.filter(istVerfuegbar).length).toBe(49);
    // Versteckte Karten sind gebaut + verlinkt (sonst wären sie tot):
    ALLE_KARTEN.filter((k) => k.imKatalog === false).forEach((k) => {
      expect(istVerfuegbar(k), k.id).toBe(true);
      expect(k.href, k.id).toBeTruthy();
    });
    expect(verf.every((k) => k.status !== 'geplant')).toBe(true);
    expect(ALLE_KARTEN.filter((k) => !istVerfuegbar(k)).every((k) => k.status === 'geplant')).toBe(true);
  });
});

describe('RECHTSBEREICH_GRUPPEN (Pro-Katalog, Phase 2) – Vollständigkeit beider Modelle', () => {
  it('jedes Config-Rechtsgebiet liegt in genau EINER Gruppe; keine Gruppe nennt Unbekanntes', async () => {
    const { ALLE_GRUPPEN_MODELLE } = await import('../lib/rechtsbereichGruppen');
    for (const [modell, gruppen] of Object.entries(ALLE_GRUPPEN_MODELLE)) {
      const genannt = gruppen.flatMap((g) => g.gebiete);
      // keine Doppelnennung
      expect(new Set(genannt).size, `${modell}: Doppelnennung`).toBe(genannt.length);
      // vollständig: jedes RECHTSGEBIET genau einmal
      for (const gebiet of RECHTSGEBIETE) {
        expect(genannt.filter((x) => x === gebiet).length, `${modell}: ${gebiet}`).toBe(1);
      }
      // nichts Unbekanntes
      for (const g of genannt) {
        expect(RECHTSGEBIETE.includes(g as (typeof RECHTSGEBIETE)[number]), `${modell}: unbekannt ${g}`).toBe(true);
      }
    }
  });
});
