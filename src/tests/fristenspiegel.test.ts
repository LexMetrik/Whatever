import { describe, it, expect } from 'vitest';
import { berechneMietkuendigung } from '../lib/mietrecht';
import {
  berechneVermieterkuendigungsSpiegel, ddMMyyyyZuISO, VK_KUENDIGUNGSARTEN,
  type VermieterkuendigungSpiegelInput,
} from '../lib/fristenspiegel/vermieterkuendigung';
import { icsFuerFrist, icsSammel } from '../lib/icsExport';
import { KANTONE } from '../lib/kantone';

// ─── Fristenspiegel-Rahmen + Pilot A.4 (FAHRPLAN-PRAXIS 3.1b) ───────────────
// Konzept: bibliothek/recherche/fristenspiegel-konzept.md. Der zentrale
// Beweis: Der Spiegel rechnet NICHTS selbst — jedes Zeilen-Datum ist exakt
// das Resultat der bestehenden Engine (§5; «Golden-Test» des Konzepts §D.3).

const FAELLE: VermieterkuendigungSpiegelInput[] = [
  { zugang: '2026-06-06', objekt: 'wohnung', kanton: 'ZH', kuendigungsart: 'ordentlich' },
  { zugang: '2026-06-06', objekt: 'geschaeftsraum', kanton: 'BS', kuendigungsart: 'ordentlich' },
  { zugang: '2026-12-15', objekt: 'wohnung', kanton: 'VS', kuendigungsart: 'wichtige_gruende' },
  // Fristende 30 Tage später auf einem Wochenende/Feiertag → Art. 78 OR
  { zugang: '2026-03-02', objekt: 'wohnung', kanton: 'TI', kuendigungsart: 'ordentlich' },
  { zugang: '2026-06-06', objekt: 'wohnung', kanton: 'ZH', kuendigungsart: 'zahlungsverzug' },
  { zugang: '2026-06-06', objekt: 'geschaeftsraum', kanton: 'GE', kuendigungsart: 'pflichtverletzung' },
];

describe('Fristenspiegel A.4: Spiegel-Datum == direktes Engine-Resultat (keine zweite Rechnung)', () => {
  it.each(FAELLE)('Fall %#: $kuendigungsart $objekt $kanton', (fall) => {
    const direkt = berechneMietkuendigung({
      kuendigungsart: fall.kuendigungsart, objekt: fall.objekt, zugang: fall.zugang,
      kanton: fall.kanton, partei: 'vermieter', terminQuelle: 'jedes_monatsende',
    });
    const spiegel = berechneVermieterkuendigungsSpiegel(fall);
    const anfechtung = spiegel.zeilen.find((z) => z.key === 'anfechtung')!;
    const erstreckung = spiegel.zeilen.find((z) => z.key === 'erstreckung')!;

    // Anfechtung: identischer Anzeigetext UND konsistentes ISO
    expect(anfechtung.endeText).toBe(direkt.anfechtungBis);
    expect(anfechtung.endeISO).toBe(ddMMyyyyZuISO(direkt.anfechtungBis!));

    if (direkt.erstreckungBis) {
      expect(erstreckung.status).toBe('berechnet');
      expect(erstreckung.endeText).toBe(direkt.erstreckungBis);
    } else {
      // Art. 257d/257f → Art. 272a: Engine unterdrückt, Spiegel legt offen
      expect(erstreckung.status).toBe('ausgeschlossen');
      expect(erstreckung.normRef).toBe('Art. 272a OR');
      expect(erstreckung.endeISO).toBeUndefined();
    }
  });

  it('257d/257f schliessen die Erstreckung aus; ordentliche Kündigung nicht', () => {
    const aus = (art: VermieterkuendigungSpiegelInput['kuendigungsart']) =>
      berechneVermieterkuendigungsSpiegel({ zugang: '2026-06-06', objekt: 'wohnung', kanton: 'ZH', kuendigungsart: art })
        .zeilen.find((z) => z.key === 'erstreckung')!.status;
    expect(aus('zahlungsverzug')).toBe('ausgeschlossen');
    expect(aus('pflichtverletzung')).toBe('ausgeschlossen');
    expect(aus('ordentlich')).toBe('berechnet');
    expect(aus('wichtige_gruende')).toBe('berechnet');
  });

  it('Anfechtung/Erstreckung hängen NUR am Zugang — nicht an der Termin-Quelle (Pilot-Annahme)', () => {
    // Beweis der Pilot-Annahme: terminQuelle variiert, die Art.-273-Daten nicht.
    const a = berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt: 'wohnung', zugang: '2026-06-06', kanton: 'ZH', partei: 'vermieter', terminQuelle: 'jedes_monatsende' });
    const b = berechneMietkuendigung({ kuendigungsart: 'ordentlich', objekt: 'wohnung', zugang: '2026-06-06', kanton: 'ZH', partei: 'vermieter', terminQuelle: 'vertraglich_monate', vertragsTermineMonate: [3, 9] });
    expect(a.anfechtungBis).toBe(b.anfechtungBis);
    expect(a.erstreckungBis).toBe(b.erstreckungBis);
  });

  it('alle Pilot-Kündigungsarten laufen für alle 26 Kantone deterministisch durch', () => {
    for (const kanton of KANTONE) {
      for (const { code } of VK_KUENDIGUNGSARTEN) {
        const e = berechneVermieterkuendigungsSpiegel({ zugang: '2026-06-06', objekt: 'wohnung', kanton, kuendigungsart: code });
        expect(e.zeilen.find((z) => z.key === 'anfechtung')!.endeISO).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        // zweiter Lauf identisch (§2)
        expect(berechneVermieterkuendigungsSpiegel({ zugang: '2026-06-06', objekt: 'wohnung', kanton, kuendigungsart: code })).toEqual(e);
      }
    }
  });

  it('Spiegel legt Annahmen/Weichen offen (§8): Formgültigkeit, befristetes Verhältnis', () => {
    const e = berechneVermieterkuendigungsSpiegel({ zugang: '2026-06-06', objekt: 'wohnung', kanton: 'ZH', kuendigungsart: 'ordentlich' });
    expect(e.annahmen.some((a) => a.includes('Formgültige Kündigung vorausgesetzt'))).toBe(true);
    expect(e.warnungen.some((w) => w.includes('60 Tage vor Ablauf'))).toBe(true);
  });
});

describe('Fristenspiegel A.1: Zivilentscheid — Weiche aus bestimmeRechtsmittel, Datum aus berechneFrist (§5)', async () => {
  const { berechneZivilentscheidsSpiegel } = await import('../lib/fristenspiegel/zivilentscheid');
  const { bestimmeRechtsmittel } = await import('../lib/zustaendigkeit');
  const { berechneFrist } = await import('../lib/zpoFristen');
  const { PRESETS } = await import('../lib/zpoPresets');

  const rmZeile = (e: ReturnType<typeof berechneZivilentscheidsSpiegel>) =>
    e.zeilen.find((z) => z.key === 'rechtsmittel')!;

  it('Berufung ordentlich (SW ≥ 10k): 30 Tage MIT Stillstand — Datum == direkte Engine', () => {
    const spiegel = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 50_000, verfahren: 'ordentlich_vereinfacht',
    });
    const direkt = berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 30, verfahren: 'ordentlich', kanton: 'ZH', fristnatur: 'gesetzlich', gerichtshinweisStillstand: true });
    const z = rmZeile(spiegel);
    expect(z.normRef).toBe('Art. 311 Abs. 1 ZPO');
    expect(z.endeText).toBe(direkt.diesAdQuem);
    expect(direkt.stillstandAktiv).toBe(true); // Zustellung 1.7. → Stillstand 15.7.–15.8. greift
  });

  it('Beschwerde (SW < 10k) und summarisch (10 T OHNE Stillstand): konsistent mit der Weiche', () => {
    const beschwerde = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 5_000, verfahren: 'ordentlich_vereinfacht',
    });
    expect(rmZeile(beschwerde).normRef).toBe('Art. 321 Abs. 1 ZPO');
    expect(rmZeile(beschwerde).label).toContain('Beschwerde');

    const summar = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 50_000, verfahren: 'summarisch',
    });
    const direkt10 = berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich', gerichtshinweisStillstand: true });
    expect(rmZeile(summar).normRef).toBe('Art. 314 Abs. 1 ZPO');
    expect(rmZeile(summar).endeText).toBe(direkt10.diesAdQuem);
    expect(direkt10.stillstandAktiv).toBe(false); // Art. 145 Abs. 2 lit. b
    // Anschlussberufung im Summarverfahren unzulässig (Art. 314 Abs. 1)
    expect(summar.zeilen.find((z) => z.key === 'anschlussberufung')!.status).toBe('ausgeschlossen');
  });

  it('familienrechtliche Summarsache (Art. 314 Abs. 2): 30 Tage, trotzdem KEIN Stillstand; Anschluss zulässig (Hinweis)', () => {
    const e = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: false,
      streitwertCHF: null, verfahren: 'summarisch', familienSummarsache: true,
    });
    const rm = bestimmeRechtsmittel({ streitsache: 'geldforderung', vermoegensrechtlich: false, streitwertCHF: null, rmVerfahren: 'summarisch', rmFamilienSummarsache: true });
    expect(rm.kantonalFrist!.tage).toBe(30);
    expect(rm.kantonalFrist!.stillstand).toBe(false);
    const direkt = berechneFrist({ ereignis: '2026-07-01', einheit: 'tage', laenge: 30, verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich', gerichtshinweisStillstand: true });
    expect(rmZeile(e).normRef).toBe('Art. 314 Abs. 2 ZPO');
    expect(rmZeile(e).endeText).toBe(direkt.diesAdQuem);
    expect(e.zeilen.find((z) => z.key === 'anschlussberufung')!.status).toBe('hinweis');
  });

  it('widersprüchliche Flags familienSummarsache + mietOderArbeit (Härtung 10.6.2026): miet-/arbeitsrechtlich ist keine 271/276/302/305-Sache → 10 Tage + erklärende Warnung', () => {
    const e = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 20_000, verfahren: 'summarisch',
      familienSummarsache: true, mietOderArbeit: true,
    });
    expect(rmZeile(e).normRef).toBe('Art. 314 Abs. 1 ZPO');
    expect(e.warnungen.some((w) => w.includes('Art. 314 Abs. 2') && w.includes('271'))).toBe(true);
  });

  it('Spiegel-Norm steht im Weiche-Text (Schutz gegen Divergenz der Norm-Pille)', () => {
    const faelle = [
      { vr: true, sw: 50_000, vf: 'ordentlich_vereinfacht' as const, fam: false },
      { vr: true, sw: 5_000, vf: 'ordentlich_vereinfacht' as const, fam: false },
      { vr: true, sw: 50_000, vf: 'summarisch' as const, fam: false },
      { vr: false, sw: null, vf: 'summarisch' as const, fam: true },
    ];
    for (const f of faelle) {
      const e = berechneZivilentscheidsSpiegel({ zustellung: '2026-03-02', kanton: 'BE', vermoegensrechtlich: f.vr, streitwertCHF: f.sw, verfahren: f.vf, familienSummarsache: f.fam });
      const rm = bestimmeRechtsmittel({ streitsache: 'geldforderung', vermoegensrechtlich: f.vr, streitwertCHF: f.sw, rmVerfahren: f.vf, rmFamilienSummarsache: f.fam });
      const artNummer = rmZeile(e).normRef.replace(' ZPO', '').replace('Art. ', '');
      expect(rm.kantonalFrist!.text, JSON.stringify(f)).toContain(artNummer);
    }
  });

  it('nur Dispositiv (Art. 239 ZPO): Begründungs-Frist == zpoPresets-Parameter; KEIN Rechtsmittel-Datum (§1)', () => {
    const e = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-01', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 50_000, verfahren: 'ordentlich_vereinfacht', nurDispositiv: true,
    });
    const beg = e.zeilen.find((z) => z.key === 'begruendung')!;
    // Parameter-Identität mit dem bestehenden Preset (§5)
    const preset = PRESETS.find((p) => p.key === 'begruendung')!;
    expect(preset).toMatchObject({ einheit: 'tage', laenge: 10, verfahren: 'ordentlich', fristnatur: 'gesetzlich', norm: 'Art. 239 Abs. 2 ZPO' });
    const direkt = berechneFrist({ ereignis: '2026-07-01', einheit: preset.einheit, laenge: preset.laenge!, verfahren: preset.verfahren, kanton: 'ZH', fristnatur: preset.fristnatur });
    expect(beg.endeText).toBe(direkt.diesAdQuem);
    // Rechtsmittel: Hinweis ohne Datum — die Frist läuft erst ab Begründung
    const rm = rmZeile(e);
    expect(rm.status).toBe('hinweis');
    expect(rm.endeISO).toBeUndefined();
  });

  it('BGer immer als abgesetzte Folgestufe ohne Datum; Determinismus (zweiter Lauf identisch)', () => {
    const input = { zustellung: '2026-07-01', kanton: 'ZH' as const, vermoegensrechtlich: true, streitwertCHF: 20_000, verfahren: 'ordentlich_vereinfacht' as const, mietOderArbeit: true };
    const e = berechneZivilentscheidsSpiegel(input);
    const bger = e.zeilen.find((z) => z.key === 'bger')!;
    expect(bger.status).toBe('hinweis');
    expect(bger.endeISO).toBeUndefined();
    // BGer-Schwelle 15k (Art. 74 I lit. a) via mietOderArbeit in den Warnungen
    expect(e.warnungen.join(' ')).toContain('15');
    expect(berechneZivilentscheidsSpiegel(input)).toEqual(e);
  });
});

describe('Fristenspiegel A.2/A.7/A.6: Preset-Parameter-Identität (§5) + Multi-Trigger-Ehrlichkeit (§1)', async () => {
  const { berechneZahlungsbefehlsSpiegel } = await import('../lib/fristenspiegel/zahlungsbefehl');
  const { berechneKlagebewilligungsSpiegel } = await import('../lib/fristenspiegel/klagebewilligung');
  const { berechneErbgangsSpiegel } = await import('../lib/fristenspiegel/erbgang');
  const { berechneSchkgFrist } = await import('../lib/schkgFristen');
  const { PRESETS_SCHKG } = await import('../lib/schkgPresets');
  const { berechneFrist } = await import('../lib/zpoFristen');
  const { PRESETS } = await import('../lib/zpoPresets');
  const { berechneErbFrist } = await import('../lib/erbFristen');

  it('A.2 Zahlungsbefehl: RV + Art.-88-Dual == direkte Engine mit den Preset-Parametern', () => {
    // Zustellung 5.7. → Betreibungsferien (15.7.–31.7.) greifen in die Fristen
    const e = berechneZahlungsbefehlsSpiegel({ zustellung: '2026-07-05', kanton: 'ZH' });
    const rv = PRESETS_SCHKG.find((p) => p.key === 'rechtsvorschlag')!;
    const fb = PRESETS_SCHKG.find((p) => p.key === 'fortsetzungsbegehren')!;
    expect(rv).toMatchObject({ einheit: 'tage', laenge: 10, modus: 'schkg_betreibungsferien' });
    expect(fb.wartefrist).toEqual({ einheit: 'tage', laenge: 20 });
    expect(fb.verwirkung).toEqual({ einheit: 'jahre', laenge: 1 });

    const rvDirekt = berechneSchkgFrist({ ereignis: '2026-07-05', einheit: rv.einheit!, laenge: rv.laenge!, modus: rv.modus, fristnatur: rv.fristnatur, kanton: 'ZH', ausloeser: rv.ausloeser });
    const warteDirekt = berechneSchkgFrist({ ereignis: '2026-07-05', einheit: 'tage', laenge: 20, modus: fb.modus, fristnatur: 'wartefrist', kanton: 'ZH', ausloeser: fb.ausloeser });
    const verwDirekt = berechneSchkgFrist({ ereignis: '2026-07-05', einheit: 'jahre', laenge: 1, modus: fb.modus, fristnatur: 'verwirkung', kanton: 'ZH', ausloeser: fb.ausloeser });

    expect(e.zeilen.find((z) => z.key === 'rechtsvorschlag')!.endeText).toBe(rvDirekt.diesAdQuem);
    const warte = e.zeilen.find((z) => z.key === 'fortsetzung_warte')!;
    expect(warte.endeText).toBe(warteDirekt.diesAdQuem);
    expect(warte.endePraefix).toBe('frühestens ab');   // Wartefrist ≠ «bis»
    expect(warte.status).toBe('bedingt');               // nur ohne RV
    const verw = e.zeilen.find((z) => z.key === 'fortsetzung_verwirkung')!;
    expect(verw.endeText).toBe(verwDirekt.diesAdQuem);
    expect(verw.bedingung).toContain('Art. 88 Abs. 2'); // Hemmung offengelegt
    // Rechtsöffnung/Aberkennung nur als Folgestufe ohne Datum
    expect(e.zeilen.find((z) => z.key === 'rechtsoeffnung')!.endeISO).toBeUndefined();
    // Wechselbetreibung als Annahme offengelegt (Art. 56 Ziff. 2)
    expect(e.annahmen.join(' ')).toContain('WECHSELbetreibung');
    expect(berechneZahlungsbefehlsSpiegel({ zustellung: '2026-07-05', kanton: 'ZH' })).toEqual(e);
  });

  it('A.7 Klagebewilligung: Miete/Pacht-Weiche wählt das Preset (3 Monate vs. 30 Tage)', () => {
    const normal = berechneKlagebewilligungsSpiegel({ zustellung: '2026-07-01', kanton: 'BE', mietOderPacht: false });
    const miete = berechneKlagebewilligungsSpiegel({ zustellung: '2026-07-01', kanton: 'BE', mietOderPacht: true });
    const p3m = PRESETS.find((p) => p.key === 'klagebewilligung')!;
    const p30 = PRESETS.find((p) => p.key === 'klagefrist_miete')!;
    const direkt3m = berechneFrist({ ereignis: '2026-07-01', einheit: p3m.einheit, laenge: p3m.laenge!, verfahren: p3m.verfahren, kanton: 'BE', fristnatur: p3m.fristnatur });
    const direkt30 = berechneFrist({ ereignis: '2026-07-01', einheit: p30.einheit, laenge: p30.laenge!, verfahren: p30.verfahren, kanton: 'BE', fristnatur: p30.fristnatur });
    expect(normal.zeilen[0].endeText).toBe(direkt3m.diesAdQuem);
    expect(normal.zeilen[0].normRef).toBe('Art. 209 Abs. 3 ZPO');
    expect(miete.zeilen[0].endeText).toBe(direkt30.diesAdQuem);
    expect(miete.zeilen[0].normRef).toBe('Art. 209 Abs. 4 ZPO');
    // Preset-Hinweis wird durchgereicht (§8). RL-20/R5-05 (Prüfung Rechtslogik
    // 23.9.2026): vorher «nicht abschliessend geklärt» — BGE 138 III 615 (E. 2)
    // entscheidet: Klagefrist nach Art. 209 Abs. 3 und 4 ZPO steht still.
    expect(normal.warnungen.join(' ')).toMatch(/\bBGE 138 III 615\b/);
    expect(normal.warnungen.join(' ')).not.toContain('nicht abschliessend geklärt');
  });

  it('A.6 Erbgang: Ausschlagung+Inventar parallel (gleicher Trigger); Klagen NUR als Hinweis (anderer Trigger, §1)', () => {
    const e = berechneErbgangsSpiegel({ datum: '2026-06-06', kanton: 'ZH', erbenstellung: 'gesetzlich' });
    const ausDirekt = berechneErbFrist({ key: 'ausschlagung_gesetzlich', trigger: '2026-06-06', werktagsVerschiebung: true, kanton: 'ZH' });
    const invDirekt = berechneErbFrist({ key: 'oeff_inventar_begehren', trigger: '2026-06-06', werktagsVerschiebung: true, kanton: 'ZH' });
    expect(e.zeilen.find((z) => z.key === 'ausschlagung')!.endeText).toBe(ausDirekt.resultat.endDatum);
    expect(e.zeilen.find((z) => z.key === 'inventar')!.endeText).toBe(invDirekt.resultat.endDatum);
    // Multi-Trigger-Ehrlichkeit: Ungültigkeit/Herabsetzung OHNE gerechnetes Datum
    for (const key of ['ungueltigkeit', 'herabsetzung']) {
      const z = e.zeilen.find((x) => x.key === key)!;
      expect(z.status).toBe('hinweis');
      expect(z.endeISO).toBeUndefined();
      expect(z.bedingung).toContain('Anderer Auslöser');
    }
    // eingesetzte Erbin: anderes Preset (amtliche Mitteilung)
    const eing = berechneErbgangsSpiegel({ datum: '2026-06-06', kanton: 'ZH', erbenstellung: 'eingesetzt' });
    expect(eing.zeilen.find((z) => z.key === 'ausschlagung')!.label).toContain('eingesetzte');
    expect(eing.annahmen.join(' ')).toContain('amtlichen Mitteilung');
  });
});

describe('Fristenspiegel A.3: AG-Kündigung (Art. 336b OR) — Anker-Datum + 180 Tage, §2-Gate', async () => {
  const { berechneAgKuendigungsSpiegel } = await import('../lib/fristenspiegel/agKuendigung');
  const { berechneAllgemeineFrist } = await import('../lib/allgemeineFrist');

  it('Einsprache = Anker-Datum selbst (keine Arithmetik); Klage = 180 Tage via allgemeineFrist (roh)', () => {
    const e = berechneAgKuendigungsSpiegel({ beendigung: '2026-08-31' });
    const einsprache = e.zeilen.find((z) => z.key === 'einsprache')!;
    expect(einsprache.endeISO).toBe('2026-08-31');
    expect(einsprache.endeText).toBe('31.08.2026');
    const direkt = berechneAllgemeineFrist({ start: '2026-08-31', laenge: 180, einheit: 'tage', wochenendeVerschieben: false, feiertageVerschieben: false });
    const klage = e.zeilen.find((z) => z.key === 'klage')!;
    expect(klage.endeText).toBe(direkt.endDatum);
    expect(klage.endeISO).toBe(direkt.endDatumISO);
  });

  it('§2-Gate: Klagefrist nur BEDINGT (gültige Einsprache); Verschiebungs-Vorbehalt offengelegt', () => {
    const e = berechneAgKuendigungsSpiegel({ beendigung: '2026-08-31' });
    const klage = e.zeilen.find((z) => z.key === 'klage')!;
    expect(klage.status).toBe('bedingt');
    expect(klage.bedingung).toContain('Einsprache');
    expect(e.warnungen.join(' ')).toContain('VORHER');
    expect(e.annahmen.join(' ')).toContain('Sperrfristen');
    expect(berechneAgKuendigungsSpiegel({ beendigung: '2026-08-31' })).toEqual(e);
  });
});

describe('icsExport: Byte-Anker + Sammel-Export (3.1b, §6)', () => {
  // DEKLARIERTE Darstellungs-Änderung 7.6.2026 (Auftrag David, bessere
  // Kalender-Beschriftung): zentrale Fusszeile in DESCRIPTION, Vorfrist-Alarm
  // nennt die Vorlaufzeit. DEKLARIERTE Änderung 10.6.2026 (Bug-Check MITTEL):
  // UIDs tragen IMMER den Kurz-Hash über das ROHE Summary — verschiedene
  // Aktenzeichen, die sich nur in Nicht-Wort-Zeichen unterscheiden, ergaben
  // sonst identische UIDs (RFC 5545 §3.8.4.7; Kalender dedupliziert stumm).
  // Bestands-Kalendereinträge erhalten beim Re-Import damit EINMALIG neue
  // UIDs (Duplikat statt Update) — bewusst in Kauf genommen.
  it('icsFuerFrist: Byte-Anker der Kalender-Beschriftung (Stand 7.6.2026)', () => {
    const out = icsFuerFrist({
      titel: 'Berufung; Frist, läuft\nab',
      endISO: '2026-07-07',
      beschreibung: 'Ein länger Text mit Umlauten äöü und Sonderzeichen ;,\\ der sicher über fünfundsiebzig Oktette hinausläuft, damit die Faltung greift.',
      vorfristTage: 3,
    });
    expect(out).toBe(
      'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LexMetrik//Fristenrechner//DE\r\nCALSCALE:GREGORIAN\r\nBEGIN:VEVENT\r\nUID:frist-20260707-BerufungFristluftab-1gy4ff8@lexmetrik\r\nDTSTAMP:20260707T000000Z\r\nDTSTART;VALUE=DATE:20260707\r\nDTEND;VALUE=DATE:20260708\r\nSUMMARY:Berufung\\; Frist\\, läuft\\nab\r\nDESCRIPTION:Ein länger Text mit Umlauten äöü und Sonderzeichen \\;\\,\\\\ d\r\n er sicher über fünfundsiebzig Oktette hinausläuft\\, damit die Faltung g\r\n reift.\\nBerechnet mit LexMetrik – automatisierte Orientierung\\, keine Re\r\n chtsberatung.\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:Vorfrist (3 Tage): Berufung\\; Frist\\, läuft\\nab\r\nTRIGGER:-P3D\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n',
    );
  });

  it('Beschriftung: Aktenzeichen wandert in SUMMARY, DESCRIPTION und UID (kollisionsfrei je Mandat)', () => {
    const basis = { titel: 'Fristende – Berufung', endISO: '2026-07-07', vorfristTage: 1 };
    const a = icsFuerFrist({ ...basis, aktenzeichen: '2026-014 MUS' });
    const b = icsFuerFrist({ ...basis, aktenzeichen: '2026-099 XYZ' });
    expect(a).toContain('SUMMARY:Fristende – Berufung – 2026-014 MUS');
    expect(a).toContain('Aktenzeichen: 2026-014 MUS');
    expect(a).toContain('DESCRIPTION:Vorfrist (1 Tag): Fristende – Berufung – 2026-014 MUS');
    // Zwei gleichnamige Fristen am selben Tag, verschiedene Mandate →
    // VERSCHIEDENE UIDs (vorher: Kollision, Kalender dedupliziert stumm).
    const uid = (ics: string) => ics.match(/UID:[^\r]+/)![0];
    expect(uid(a)).not.toBe(uid(b));
    // Hash deterministisch auch ohne Aktenzeichen (deklariert 10.6.2026).
    expect(uid(icsFuerFrist({ titel: 'Fristende – Berufung', endISO: '2026-07-07' })))
      .toBe('UID:frist-20260707-FristendeBerufung-11h14ws@lexmetrik');
  });

  it('UID hinter der 24-Zeichen-Kappung: Az-Suffix bleibt unterscheidend (Bug-Check 7.6.2026 M-1)', () => {
    // Mandate, deren Token erst NACH Zeichen 24 divergiert: die blosse
    // Kappung ergab byte-identische UIDs, der Kalender deduplizierte stumm
    // (empirisches Repro des Bug-Checks) — der Kurz-Hash unterscheidet sie.
    const basis = { titel: 'Berufungsfrist', endISO: '2026-09-15' };
    const uid = (ics: string) => ics.match(/UID:[^\r]+/)![0];
    const a = uid(icsFuerFrist({ ...basis, aktenzeichen: 'HG2026-000123-A' }));
    const b = uid(icsFuerFrist({ ...basis, aktenzeichen: 'HG2026-000123-B' }));
    expect(a).not.toBe(b);
    // Auch Kurz-Tokens tragen den Hash (deklariert 10.6.2026) — nur so
    // unterscheiden sich Summaries, die sich allein in \W-Zeichen
    // unterscheiden ('HG-2026.14' vs. 'HG.2026-14').
    expect(uid(icsFuerFrist({ titel: 'Kurz', endISO: '2026-09-15', aktenzeichen: 'AB-1' })))
      .toBe('UID:frist-20260915-KurzAB1-f5auov@lexmetrik');
    const nurInterpunktion1 = uid(icsFuerFrist({ titel: 'Berufungsfrist', endISO: '2026-09-15', aktenzeichen: 'HG-2026.14' }));
    const nurInterpunktion2 = uid(icsFuerFrist({ titel: 'Berufungsfrist', endISO: '2026-09-15', aktenzeichen: 'HG.2026-14' }));
    expect(nurInterpunktion1).not.toBe(nurInterpunktion2);
  });

  it('Beschriftung: Permalink als URL-Property (URI, unescaped) + Zeile in der Beschreibung; Fusszeile immer', () => {
    const url = 'https://lexmetrik.vercel.app/rechner/zpo-fristen?e=2026-06-05&l=30';
    const out = icsFuerFrist({ titel: 'Fristende', endISO: '2026-07-07', url });
    expect(out).toContain('URL:https://lexmetrik.verce');
    // URI-Property wird NICHT TEXT-escaped (kein \\, vor Kommas) — nur gefaltet.
    const entfaltet = out.replace(/\r\n[ ]/g, '');
    expect(entfaltet).toContain(`URL:${url}`);
    expect(entfaltet).toContain(`Berechnung: ${url}`);
    expect(entfaltet).toContain('Berechnet mit LexMetrik – automatisierte Orientierung\\, keine Rechtsberatung.');
    // Ohne URL keine URL-Property
    expect(icsFuerFrist({ titel: 'Fristende', endISO: '2026-07-07' })).not.toContain('URL:');
  });

  it('icsSammel: EIN VCALENDAR, n VEVENTs, deterministische UIDs, RFC-Faltung', () => {
    const out = icsSammel([
      { titel: 'Anfechtung der Kündigung', endISO: '2026-07-06', vorfristTage: 3 },
      { titel: 'Erstreckungsbegehren', endISO: '2026-07-06' },
      { titel: 'ohne gültiges Datum', endISO: 'kein-iso' }, // wird übersprungen
    ]);
    expect(out.match(/BEGIN:VCALENDAR/g)).toHaveLength(1);
    expect(out.match(/END:VCALENDAR/g)).toHaveLength(1);
    expect(out.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(out).toContain('UID:frist-20260706-AnfechtungderKndigung-dapzfa@lexmetrik');
    expect(out).toContain('UID:frist-20260706-Erstreckungsbegehren-39onpt@lexmetrik');
    expect(out).not.toContain('kein-iso');
    // Faltung: keine Zeile über 75 Oktette
    const enc = new TextEncoder();
    for (const zeile of out.split('\r\n')) {
      expect(enc.encode(zeile).length, zeile).toBeLessThanOrEqual(75);
    }
    // Determinismus: zweiter Lauf byte-identisch
    expect(icsSammel([{ titel: 'Anfechtung der Kündigung', endISO: '2026-07-06', vorfristTage: 3 }, { titel: 'Erstreckungsbegehren', endISO: '2026-07-06' }, { titel: 'ohne gültiges Datum', endISO: 'kein-iso' }])).toBe(out);
  });
});

describe('Bug-Check-Fix 10.6.2026: Begründungsfrist folgt dem Verfahren (Art. 145 Abs. 2 lit. b ZPO)', () => {
  it('Summarentscheid nur im Dispositiv: 10-Tage-Frist OHNE Stillstand (vorher bis ~4 Wochen zu spät)', async () => {
    const { berechneZivilentscheidsSpiegel } = await import('../lib/fristenspiegel/zivilentscheid');
    const { berechneFrist } = await import('../lib/zpoFristen');
    const e = berechneZivilentscheidsSpiegel({
      zustellung: '2026-07-20', kanton: 'ZH', vermoegensrechtlich: true,
      streitwertCHF: 20_000, verfahren: 'summarisch', nurDispositiv: true,
    });
    const beg = e.zeilen.find((z) => z.key === 'begruendung')!;
    const direkt = berechneFrist({ ereignis: '2026-07-20', einheit: 'tage', laenge: 10, verfahren: 'summarisch', kanton: 'ZH', fristnatur: 'gesetzlich' });
    expect(beg.endeISO).toBe(direkt.diesAdQuemISO);
    expect(direkt.diesAdQuemISO).toBe('2026-07-30');
  });
});
