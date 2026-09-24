import { useMemo, useState } from 'react';
import type { Kanton } from '../../types/legal';
import { KANTONE } from '../../lib/kantone';
import { Checkbox, EckdatenKachel, Field, inputCls } from '../vorlagen/ui';
import { zahlNichtNegativOderNull as zahl } from './eingabe';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { BetragsFeld } from '../BetragsFeld';
import { DatumsFeld } from '../DatumsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { BGER_LINK_SPEC } from '../../lib/rechnerPermalinks';
import { SelectionGrid } from '../ui/SelectionGrid';
import { usePaneKlasse } from '../layout/PaneKontext';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { getStandardKanton } from '../../lib/einstellungen';
import {
  berechneBgerRechtsweg,
  type BgerInput, type BgerWeg, type BgerZivilgebiet, type BgerObjekt, type BgerVerwaltungSonderfall,
} from '../../lib/bgerRechtsweg';

// ─── BGer-Rechtsweg-Form (BGG) — FAHRPLAN-BGER-RECHTSWEG R-2 ────────────────
// Reine Darstellung (§3): Weg-Weiche + Eingaben; gerechnet wird in
// lib/bgerRechtsweg.ts. Aufbau nach DESIGN-REGLEMENT §R-4.

const WEGE: { code: BgerWeg; label: string; sub: string }[] = [
  { code: 'zivil', label: 'Zivilsache', sub: 'Beschwerde in Zivilsachen (Art. 72 ff. BGG) – inkl. SchKG-Entscheide der Gerichte' },
  { code: 'schkg_aufsicht', label: 'SchKG-Aufsichtsentscheid', sub: 'Aufsichtsbehörde in Betreibungs-/Konkurssachen (Art. 19 SchKG) – 10 Tage' },
  { code: 'straf', label: 'Strafsache', sub: 'Beschwerde in Strafsachen (Art. 78 ff. BGG)' },
  { code: 'verwaltung', label: 'Öffentlich-rechtliche Sache', sub: 'Beschwerde nach Art. 82 ff. BGG – Ausnahmekatalog Art. 83 beachten' },
];

const GEBIETE: { code: BgerZivilgebiet; label: string }[] = [
  { code: 'schuldrecht', label: 'Schuldrecht / Vertrag (OR)' },
  { code: 'arbeit', label: 'Arbeitsrecht (privat)' },
  { code: 'miete', label: 'Miete / Pacht' },
  { code: 'versicherungsvertrag', label: 'Versicherungsvertrag (VVG)' },
  { code: 'haftpflicht', label: 'Haftpflicht (ausservertraglich)' },
  { code: 'uwg', label: 'Wettbewerbsrecht (UWG)' },
  { code: 'immaterialgueter', label: 'Immaterialgüterrecht' },
  { code: 'rechtsoeffnung', label: 'Rechtsöffnung (Art. 80–84 SchKG)' },
  { code: 'schkg_uebrig', label: 'Übriges SchKG (Arrest, Kollokation, Konkurs …)' },
  { code: 'personenrecht', label: 'Personenrecht (ZGB)' },
  { code: 'familienrecht', label: 'Familienrecht / Kindes- & Erwachsenenschutz' },
  { code: 'erbrecht', label: 'Erbrecht' },
  { code: 'sachenrecht', label: 'Sachenrecht / Grundbuch' },
  { code: 'baeuerliches_bodenrecht', label: 'Bäuerliches Bodenrecht (BGBB)' },
];

const OBJEKTE: { code: BgerObjekt; label: string }[] = [
  { code: 'endentscheid', label: 'Endentscheid (Art. 90)' },
  { code: 'teilentscheid', label: 'Teilentscheid (Art. 91)' },
  { code: 'zwischen_zustaendigkeit_ausstand', label: 'Zwischenentscheid über Zuständigkeit/Ausstand (Art. 92)' },
  { code: 'zwischen_anderer', label: 'anderer Vor-/Zwischenentscheid (Art. 93)' },
];

const SONDERFAELLE: { code: BgerVerwaltungSonderfall; label: string }[] = [
  { code: 'keiner', label: 'kein Sonderfall (30 Tage)' },
  { code: 'rechtshilfe_amtshilfe', label: 'internat. Rechtshilfe Straf / Amtshilfe Steuern (10 Tage)' },
  { code: 'beschaffung', label: 'öffentliche Beschaffung (30 Tage, kein Stillstand)' },
  // Bug-Check 11.6.2026: Art. 46 Abs. 2 lit. c erfasst ALLE Stimmrechtssachen
  // (Art. 82 lit. c) — kantonale liefen vorher fälschlich MIT Stillstand.
  { code: 'stimmrechtssache', label: 'Stimmrechtssache kantonal (30 Tage, kein Stillstand)' },
  { code: 'abstimmung', label: 'eidg. Abstimmung (5 Tage)' },
  { code: 'nationalratswahl', label: 'Nationalratswahl (3 Tage)' },
];

const BGER_DISCLAIMER =
  'Der Rechner bestimmt Beschwerdetyp, Zulässigkeit, Frist und zuständige Abteilung für den Weiterzug ans Bundesgericht '
  + 'nach BGG und BGerR. Rechtsfragen (grundsätzliche Bedeutung, nicht wieder gutzumachender Nachteil, Ermessens-Streitwerte) '
  + 'werden offengelegt, nie entschieden. Klage nach Art. 120 BGG und Revision (Art. 121 ff. BGG) sind nicht abgebildet. '
  + 'Den kantonalen Rechtsmittelweg zeigt der Zuständigkeits-Rechner.';

// Spec zentral in lib/rechnerPermalinks.ts (Brücken aus den Fahrplänen, §5).

export function BgerRechtswegForm() {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(BGER_LINK_SPEC);

  const [weg, setWeg] = useState<BgerWeg>((ausLink.weg as BgerWeg) ?? 'zivil');
  const [gebiet, setGebiet] = useState<BgerZivilgebiet>((ausLink.zivilGebiet as BgerZivilgebiet) ?? 'schuldrecht');
  const [objekt, setObjekt] = useState<BgerObjekt>((ausLink.objekt as BgerObjekt) ?? 'endentscheid');
  const [vermoegensrechtlich, setVermoegensrechtlich] = useState<boolean>((ausLink.vermoegensrechtlich as boolean) ?? true);
  const [streitwertRoh, setStreitwertRoh] = useState<string>(ausLink.streitwert != null ? String(ausLink.streitwert) : '');
  const [vorsorglich, setVorsorglich] = useState<boolean>((ausLink.vorsorglich as boolean) ?? false);
  const [eheschutz, setEheschutz] = useState<boolean>((ausLink.eheschutz as boolean) ?? false);
  const [einzigeInstanz, setEinzigeInstanz] = useState<boolean>((ausLink.einzigeInstanz as boolean) ?? false);
  const [konkursrichter, setKonkursrichter] = useState<boolean>((ausLink.konkursrichter as boolean) ?? false);
  const [schiedsgericht, setSchiedsgericht] = useState<boolean>((ausLink.schiedsgericht as boolean) ?? false);
  const [markenwiderspruch, setMarkenwiderspruch] = useState<boolean>((ausLink.markenwiderspruch as boolean) ?? false);
  const [hkue, setHkue] = useState<boolean>((ausLink.hkue as boolean) ?? false);
  const [wechsel, setWechsel] = useState<boolean>((ausLink.wechsel as boolean) ?? false);
  const [sonderfall, setSonderfall] = useState<BgerVerwaltungSonderfall>((ausLink.sonderfall as BgerVerwaltungSonderfall) ?? 'keiner');
  const [eroeffnung, setEroeffnung] = useState<string>((ausLink.eroeffnung as string) ?? '');
  const [kanton, setKanton] = useState<Kanton>((ausLink.kanton as Kanton) ?? getStandardKanton());
  const [aktenzeichen, setAktenzeichen] = useState('');

  const input: BgerInput = useMemo(() => ({
    weg,
    objekt,
    vorsorglicheMassnahme: vorsorglich,
    eheschutz: weg === 'zivil' && gebiet === 'familienrecht' ? eheschutz : false,
    zivilGebiet: gebiet,
    vermoegensrechtlich,
    streitwertCHF: vermoegensrechtlich ? zahl(streitwertRoh) : null,
    markenwiderspruch: weg === 'zivil' && gebiet === 'immaterialgueter' ? markenwiderspruch : false,
    schiedsgericht: weg === 'zivil' ? schiedsgericht : false,
    einzigeKantonaleInstanz: weg === 'zivil' ? einzigeInstanz : false,
    konkursNachlassrichter: weg === 'zivil' ? konkursrichter : false,
    hkueKindesrueckgabe: weg === 'zivil' && gebiet === 'familienrecht' ? hkue : false,
    wechselbetreibung: weg === 'schkg_aufsicht' ? wechsel : false,
    verwaltungSonderfall: weg === 'verwaltung' ? sonderfall : 'keiner',
    eroeffnung: /^\d{4}-\d{2}-\d{2}$/.test(eroeffnung) ? eroeffnung : null,
    kanton,
  }), [weg, gebiet, objekt, vermoegensrechtlich, streitwertRoh, vorsorglich, eheschutz, markenwiderspruch,
    einzigeInstanz, konkursrichter, schiedsgericht, hkue, wechsel, sonderfall, eroeffnung, kanton]);

  const ergebnis = useMemo(() => {
    try { return berechneBgerRechtsweg(input); } catch { return null; }
  }, [input]);

  const query = () => permalinkKodieren(BGER_LINK_SPEC, {
    weg, zivilGebiet: weg === 'zivil' ? gebiet : undefined, objekt,
    vermoegensrechtlich, streitwert: zahl(streitwertRoh) ?? undefined,
    vorsorglich, eheschutz, einzigeInstanz, konkursrichter, schiedsgericht, hkue, markenwiderspruch,
    wechsel, sonderfall: weg === 'verwaltung' ? sonderfall : undefined,
    eroeffnung: input.eroeffnung ?? undefined, kanton,
  });

  const pdfConfig: PdfDocConfig | null = ergebnis ? {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Weiterzug ans Bundesgericht (BGG)',
    domain: 'bger-rechtsweg',
    fileBase: 'BGer-Rechtsweg',
    inputs: {
      'Rechtsweg': WEGE.find((w) => w.code === weg)?.label ?? weg,
      ...(weg === 'zivil' ? { 'Rechtsgebiet': GEBIETE.find((g) => g.code === gebiet)?.label ?? gebiet } : {}),
      'Anfechtungsobjekt': OBJEKTE.find((o) => o.code === objekt)?.label ?? objekt,
      ...(weg === 'zivil' && vermoegensrechtlich ? { 'Streitwert': streitwertRoh ? `CHF ${streitwertRoh}` : 'nicht beziffert' } : {}),
      ...(weg === 'zivil' && schiedsgericht ? { 'Schiedsentscheid (Art. 77 BGG)': 'ja' } : {}),
      ...(weg === 'zivil' && einzigeInstanz ? { 'Einzige kantonale Instanz': 'ja' } : {}),
      ...(weg === 'zivil' && konkursrichter ? { 'Konkurs-/Nachlassrichter': 'ja' } : {}),
      ...(vorsorglich || eheschutz ? { 'Vorsorgliche Massnahme / Eheschutz': eheschutz ? 'Eheschutz' : 'ja' } : {}),
      ...(weg === 'schkg_aufsicht' ? { 'Wechselbetreibung': wechsel ? 'ja' : 'nein' } : {}),
      ...(weg === 'verwaltung' ? { 'Sonderfall': SONDERFAELLE.find((x) => x.code === sonderfall)?.label ?? sonderfall } : {}),
      ...(input.eroeffnung ? { 'Eröffnung': input.eroeffnung.split('-').reverse().join('.'), 'Kanton (Art. 45 Abs. 2 BGG)': kanton } : {}),
    },
    sections: [{ titel: 'Weiterzug ans Bundesgericht (BGG)', ergebnis }],
    disclaimer: BGER_DISCLAIMER,
  } : null;

  return (
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="Beschwerdetyp, Frist und Abteilung nach BGG/BGerR; Rechtsfragen werden offengelegt, nie entschieden."
        text={BGER_DISCLAIMER} />

      <SelectionGrid
        className={`grid grid-cols-1 ${pk('sm:grid-cols-2', '@lg/pane:grid-cols-2')} gap-2`}
        items={WEGE.map((w) => ({ code: w.code, label: w.label, sub: w.sub }))}
        value={weg}
        onSelect={(code) => setWeg(code)}
      />

      <div className={`grid grid-cols-1 ${pk('sm:grid-cols-2', '@lg/pane:grid-cols-2')} gap-4`}>
        {weg === 'zivil' && (
          <Field label="Rechtsgebiet" hint="steuert Streitwert-Schwelle (Art. 74 BGG) und Abteilung (Art. 33/34 BGerR)">
            <select value={gebiet} onChange={(e) => setGebiet(e.target.value as BgerZivilgebiet)} className={inputCls}>
              {GEBIETE.map((g) => <option key={g.code} value={g.code}>{g.label}</option>)}
            </select>
          </Field>
        )}
        {weg === 'verwaltung' && (
          <Field label="Sonderfall" hint="eigene Fristen/Stillstands-Folgen (Art. 100/46 BGG)">
            <select value={sonderfall} onChange={(e) => setSonderfall(e.target.value as BgerVerwaltungSonderfall)} className={inputCls}>
              {SONDERFAELLE.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </Field>
        )}
        {!(weg === 'zivil' && schiedsgericht) && (
          <Field label="Anfechtungsobjekt">
            <select value={objekt} onChange={(e) => setObjekt(e.target.value as BgerObjekt)} className={inputCls}>
              {OBJEKTE.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </Field>
        )}
      </div>

      {weg === 'zivil' && (
        <div className="space-y-3">
          <Checkbox checked={vermoegensrechtlich} onChange={setVermoegensrechtlich} label="vermögensrechtliche Angelegenheit (Streitwertgrenze Art. 74 Abs. 1 BGG)" />
          {vermoegensrechtlich && !schiedsgericht && (
            <Field label="Streitwert (CHF)" hint="vor der Vorinstanz streitig GEBLIEBENE Begehren (Art. 51 Abs. 1 lit. a BGG) — ohne Zinsen und Kosten">
              <BetragsFeld value={streitwertRoh} onChange={setStreitwertRoh} className={inputCls}
                placeholder="z. B. 25'000" aria-label="Streitwert vor Bundesgericht" />
            </Field>
          )}
          <div className={`grid grid-cols-1 ${pk('sm:grid-cols-2', '@lg/pane:grid-cols-2')} gap-2`}>
            <Checkbox checked={einzigeInstanz} onChange={setEinzigeInstanz} label="einzige kantonale Instanz hat entschieden (Art. 5/6/8 ZPO)" />
            <Checkbox checked={konkursrichter} onChange={setKonkursrichter} label="Entscheid des Konkurs-/Nachlassrichters" />
            <Checkbox checked={schiedsgericht} onChange={setSchiedsgericht} label="Schiedsentscheid (Art. 77 BGG)" />
            <Checkbox checked={vorsorglich} onChange={setVorsorglich} label="vorsorgliche Massnahme / aufschiebende Wirkung" />
            {gebiet === 'immaterialgueter' && (
              <Checkbox checked={markenwiderspruch} onChange={setMarkenwiderspruch} label="Entscheid im Markenwiderspruchsverfahren (Art. 73 BGG)" />
            )}
            {gebiet === 'familienrecht' && (
              <>
                <Checkbox checked={eheschutz} onChange={setEheschutz} label="Eheschutzentscheid" />
                <Checkbox checked={hkue} onChange={setHkue} label="Kindesrückgabe (HKÜ/ESÜ)" />
              </>
            )}
          </div>
        </div>
      )}

      {weg === 'schkg_aufsicht' && (
        <Checkbox checked={wechsel} onChange={setWechsel} label="Wechselbetreibung (5 Tage, kein Stillstand — Art. 100 Abs. 3 lit. a / Art. 46 Abs. 2 lit. b BGG)" />
      )}

      {(weg === 'straf' || weg === 'verwaltung' || weg === 'schkg_aufsicht') && (
        <Checkbox checked={vorsorglich} onChange={setVorsorglich} label="Verfahren betreffend aufschiebende Wirkung / vorsorgliche Massnahmen (inkl. Haftsachen)" />
      )}

      <div className={`grid grid-cols-1 ${pk('sm:grid-cols-2', '@lg/pane:grid-cols-2')} gap-4`}>
        <Field label="Eröffnung der vollständigen Ausfertigung" optional hint="für das konkrete Fristende">
          <DatumsFeld value={eroeffnung} onChange={setEroeffnung} className={inputCls} />
        </Field>
        <Field label="Kanton" hint="Feiertage am Fristende (Art. 45 Abs. 2 BGG: Wohnsitz-/Sitzkanton der Partei oder Vertretung)">
          <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className={inputCls}>
            {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </Field>
      </div>

      {ergebnis && (
        <ErgebnisBlock>
          <div className={`grid grid-cols-1 ${pk('sm:grid-cols-3', '@xl/pane:grid-cols-3')} gap-3`}>
            <EckdatenKachel label="Beschwerde" wert={ergebnis.beschwerdeTyp.replace('Beschwerde in ', '')} sub={ergebnis.fristNorm} />
            {/* LM-034: «jederzeit» ist ein Wort, keine Frist-Zahl — Mono nur für
                die Tages-Angabe (DESIGN-REGLEMENT §4b(e)). */}
            <EckdatenKachel label="Frist" akzent={!ergebnis.fristende}
              wert={ergebnis.fristTage === null ? 'jederzeit' : `${ergebnis.fristTage} Tage`}
              sub={ergebnis.fristTage === null ? 'Art. 100 Abs. 7 BGG' : ergebnis.stillstand ? 'mit Stillstand (Art. 46 BGG)' : 'OHNE Stillstand'}
              num={ergebnis.fristTage !== null} />
            {ergebnis.fristende
              ? <EckdatenKachel label="Letzter Tag" akzent wert={ergebnis.fristende.endeText} sub={ergebnis.fristende.verschoben ? 'verschoben (Art. 45 BGG)' : undefined} num />
              : <EckdatenKachel label="Abteilung" wert={ergebnis.abteilung ? ergebnis.abteilung.split(' (')[0] : 'nach Geschäftsverteilung'} />}
          </div>
          <ErgebnisAnzeige titel="Weiterzug ans Bundesgericht (BGG)" ergebnis={ergebnis} />
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig} query={query}
            ics={ergebnis.fristende ? [{ endISO: ergebnis.fristende.endeISO, titel: 'Beschwerdefrist Bundesgericht (BGG)',
              beschreibung: ergebnis.ergebnis, dateiName: 'BGer-Frist.ics' }] : []} />
        </ErgebnisBlock>
      )}
    </div>
  );
}
