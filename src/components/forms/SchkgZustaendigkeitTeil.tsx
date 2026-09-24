import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, EckdatenKachel, Field, GruppenTitel, inputCls, NormLink } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { SelectionGrid } from '../ui/SelectionGrid';
import { usePaneKlasse } from '../layout/PaneKontext';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { permalinkKodieren, permalinkLesen } from '../../lib/permalink';
import { SCHKG_LINK_SPEC, type SchkgLinkZustand } from './zustaendigkeitLinkSpecs';
import { bgerRechtswegLink } from '../../lib/rechnerPermalinks';
import {
  bestimmeSchkgZustaendigkeit, schkgZustaendigkeitBericht, BETREIBUNGSAEMTER_VERZEICHNIS,
  type SchkgAnliegen, type SchkgInput, type SchkgPfand, type SchkgSchuldnerTyp,
  type WiderspruchKonstellation,
} from '../../lib/schkgZustaendigkeit';
import { GEBV_SCHKG_URL } from '../../data/erlassLinks';
import { BETREIBUNGSAEMTER, type BetreibungsamtAdresse } from '../../data/betreibungsaemter';
import { BETREIBUNGSAMT_KANTONE, betreibungsamtFuer, type BetreibungsamtTreffer } from '../../data/betreibung/amtAufloesung';
import { hauptTreffer, plzAufloesen, type PlzTreffer } from '../../data/plz/plzAufloesung';
import { PlzGemeindeWahl } from '../ui/PlzGemeindeWahl';
import { KANTONE } from '../../lib/kantone';
import { VorlagenSprung } from './VorlagenSprung';
import type { Kanton } from '../../types/legal';

// S-4 (Auftrag David 10.6.2026): Anliegen → passende Eingabe-Vorlage
// (reines Mapping §3; nur wo eine Karte existiert — kein Raten).
const VORLAGE_JE_ANLIEGEN: Partial<Record<SchkgAnliegen, string>> = {
  rechtsoeffnung: 'rechtsoeffnungsbegehren',
  aberkennungsklage: 'aberkennungsklage',
  arrest: 'arrestgesuch',
  beschwerde_amt: 'schkg-beschwerde',
};

// ─── Rechtsweg «Betreibung (SchKG)» — UI-Teil des Zuständigkeitsrechners ────
// Anordnung David 5.6.2026 («schkg analog zivilrecht»). Reine Darstellung
// (§3): alle Regeln in lib/schkgZustaendigkeit.ts. Gleiche Bausteine wie der
// Zivil-Teil (LiveHeader/EckdatenKachel/lc-card/lc-chip) — einheitliches
// Design auf allen Seiten (Anordnung David).

const ANLIEGEN: { code: SchkgAnliegen; label: string; sub: string }[] = [
  { code: 'betreibung_einleiten', label: 'Betreibung einleiten', sub: 'Betreibungsbegehren → Zahlungsbefehl (Art. 67 SchKG)' },
  { code: 'rechtsoeffnung', label: 'Rechtsöffnung', sub: 'Nach Rechtsvorschlag — mit Urteil oder Schuldanerkennung (Art. 80/82)' },
  { code: 'aberkennungsklage', label: 'Aberkennungsklage', sub: 'Schuldnerseite nach provisorischer Rechtsöffnung (Art. 83 Abs. 2)' },
  { code: 'anerkennungsklage', label: 'Anerkennungsklage', sub: 'Forderungsprozess nach Rechtsvorschlag (Art. 79)' },
  { code: 'feststellung', label: 'Tilgung/Nichtbestand geltend machen', sub: 'Art. 85 (Urkunden) / Art. 85a' },
  { code: 'rueckforderung', label: 'Rückforderung (Nichtschuld bezahlt)', sub: 'Art. 86 — 1 Jahr' },
  { code: 'widerspruch', label: 'Drittansprache (Widerspruch)', sub: 'Eigentum Dritter an gepfändeten Sachen (Art. 106–109)' },
  { code: 'kollokation', label: 'Kollokation anfechten', sub: 'Pfändung (Art. 148) / Konkurs (Art. 250)' },
  { code: 'arrest', label: 'Arrest', sub: 'Sicherung vor/neben der Betreibung (Art. 271 ff.)' },
  { code: 'konkursbegehren', label: 'Konkursbegehren', sub: 'Nach Konkursandrohung (Art. 166)' },
  { code: 'beschwerde_amt', label: 'Beschwerde gegen das Amt', sub: 'Verfügungen des Betreibungs-/Konkursamts (Art. 17)' },
];

const SCHULDNER: { code: SchkgSchuldnerTyp; label: string }[] = [
  { code: 'natuerlich_wohnsitz', label: 'Natürliche Person mit Wohnsitz in der Schweiz' },
  { code: 'jur_person_hr', label: 'Juristische Person/Gesellschaft im Handelsregister' },
  { code: 'jur_person_nicht_hr', label: 'Juristische Person ohne HR-Eintrag' },
  { code: 'natuerlich_ohne_wohnsitz', label: 'Ohne festen Wohnsitz (Aufenthaltsort)' },
  { code: 'erbschaft', label: 'Unverteilte Erbschaft' },
  { code: 'stockwerkeigentuemer', label: 'Stockwerkeigentümergemeinschaft (Ort der Sache, Art. 46 Abs. 4)' },
  { code: 'ausland_niederlassung', label: 'Auslandschuldner mit CH-Geschäftsniederlassung' },
];

const WIDERSPRUCH: { code: WiderspruchKonstellation; label: string }[] = [
  { code: 'gewahrsam_schuldner', label: 'Sache im Gewahrsam der Schuldnerin/des Schuldners' },
  { code: 'gewahrsam_dritter_ch', label: 'Gewahrsam beim Dritten — Beklagte:r mit Wohnsitz in der Schweiz' },
  { code: 'gewahrsam_dritter_ausland', label: 'Gewahrsam beim Dritten — Beklagte:r im Ausland' },
  { code: 'grundstueck', label: 'Anspruch betrifft ein Grundstück' },
];

// ─── Anzeige eines konkreten Betreibungsamts (Adresse aus der Datenschicht) ─
function AmtAdresse({ amt }: { amt: BetreibungsamtAdresse }) {
  return (
    <div className="lc-tile">
      <p className="text-body-s font-medium text-ink-900">{amt.name}</p>
      <p className="text-body-s text-ink-700">{amt.strasse}, {amt.plzOrt}</p>
      {amt.zustaendigFuer && <p className="text-xs text-ink-500 mt-0.5">zuständig für: {amt.zustaendigFuer}</p>}
      {amt.hinweis && <p className="text-xs text-ink-500 mt-0.5"><NormText text={amt.hinweis} /></p>}
      {amt.url && (
        <a href={amt.url} target="_blank" rel="noreferrer" className="text-brass-700 underline text-xs mt-1 inline-block">
          Amtliche Seite ↗
        </a>
      )}
    </div>
  );
}


const SCHKG_DISCLAIMER =
  'Automatisierte Orientierung zur Zuständigkeit nach SchKG (Wortlaut-Stand 1.1.2025) – keine Rechtsberatung. ' +
  'Internationale Sachverhalte (IPRG/LugÜ) sind nicht abgebildet; offene Weichen werden ausgewiesen und der ' +
  'konkrete Fall ist fachlich zu prüfen. Behörden-/Amtsangaben: zweifach geprüfte Recherche, fachliche Abnahme ausstehend.';

export function SchkgZustaendigkeitTeil() {
  const [ausLink] = useState<Partial<SchkgLinkZustand>>(() => {
    try {
      const l = permalinkLesen(SCHKG_LINK_SPEC, window.location.search) as Partial<SchkgLinkZustand>;
      // M-7-Guard (Bug-Check 10.6.2026): Sub-Felder nur übernehmen, wenn das
      // zugehörige Anliegen im SELBEN Link steht — sonst bleibt ein fremder
      // Unterfall im State vorbelegt.
      if (l.anliegen !== 'widerspruch') delete l.widerspruchK;
      if (l.anliegen !== 'kollokation') delete l.kollokationIn;
      if (l.anliegen !== 'rechtsoeffnung') delete l.roArt;
      return l;
    } catch { return {}; }
  });
  const [anliegen, setAnliegen] = useState<SchkgAnliegen>(ausLink.anliegen ?? 'betreibung_einleiten');
  const [schuldnerTyp, setSchuldnerTyp] = useState<SchkgSchuldnerTyp>(ausLink.schuldnerTyp ?? 'natuerlich_wohnsitz');
  const [pfand, setPfand] = useState<SchkgPfand>(ausLink.pfand ?? 'kein');
  const [arrestGelegt, setArrestGelegt] = useState(ausLink.arrestGelegt ?? false);
  const [forderungRoh, setForderungRoh] = useState(ausLink.forderungRoh ?? '');
  const [widerspruchK, setWiderspruchK] = useState<WiderspruchKonstellation>(ausLink.widerspruchK ?? 'gewahrsam_schuldner');
  const [kollokationIn, setKollokationIn] = useState<'pfaendung' | 'konkurs'>(ausLink.kollokationIn ?? 'pfaendung');
  const [roArt, setRoArt] = useState<'provisorisch' | 'definitiv'>(ausLink.roArt ?? 'provisorisch');
  const [aktenzeichen, setAktenzeichen] = useState('');

  // ── Betreibungsort lokalisieren (optional): PLZ → Kanton (amtliches
  // Ortschaftenverzeichnis, lazy; Muster ZustaendigkeitForm). Auflösung des
  // konkreten Amts über die Datenschicht data/betreibungsaemter.ts (§3/§5).
  const [ortPlz, setOrtPlz] = useState(ausLink.ortPlz ?? '');
  const [ortKanton, setOrtKanton] = useState<Kanton | ''>(ausLink.ortKanton ?? '');
  const [ortGemeinde, setOrtGemeinde] = useState(ausLink.ortGemeinde ?? '');
  // Render-Abgleich statt synchronem setState im Effect (Haus-Lint-Regel):
  // gemerkt wird die PLZ, die im Verzeichnis fehlte; die Warnung gilt nur,
  // solange das Feld genau diese PLZ trägt.
  const [plzUnbekanntFuer, setPlzUnbekanntFuer] = useState<string | null>(null);
  // Treffer für die Mehrdeutigkeits-Auswahl merken (TODO 5 betreibungskreise-
  // kantone.md) — gleicher Render-Abgleich: die Kacheln gelten nur, solange
  // das PLZ-Feld genau die aufgelöste PLZ trägt.
  const [plzWahl, setPlzWahl] = useState<{ plz: string; treffer: PlzTreffer[] } | null>(null);
  useEffect(() => {
    let aktiv = true;
    if (!/^\d{4}$/.test(ortPlz)) return;
    plzAufloesen(ortPlz)
      .then((treffer) => {
        if (!aktiv) return;
        setPlzUnbekanntFuer(treffer === null || treffer.length === 0 ? ortPlz : null);
        setPlzWahl(treffer && treffer.length > 0 ? { plz: ortPlz, treffer } : null);
        if (!treffer || treffer.length === 0) return;
        const kantone = [...new Set(treffer.map((t) => t.kanton))];
        const gemeinden = [...new Set(treffer.map((t) => t.gemeinde))];
        const haupt = hauptTreffer(treffer);
        // Bug-Check 10.6.2026 (MITTEL): Leer-Guards wie im Zivil-Teil — der
        // Haupt-Treffer füllt nur LEERE Felder; vorher überschrieb er nach
        // der Link-Hydration den im Link kodierten Randgebiets-Kanton/-Ort
        // (Empfänger sah ein anderes Betreibungsamt als der Absender).
        if (kantone.length === 1) setOrtKanton(kantone[0]);
        else if (haupt) setOrtKanton((alt) => (alt === '' ? haupt.kanton : alt));
        if (gemeinden.length === 1) setOrtGemeinde((alt) => (alt.trim() === '' ? gemeinden[0] : alt));
        else if (haupt) setOrtGemeinde((alt) => (alt.trim() === '' ? haupt.gemeinde : alt));
      })
      .catch(() => { if (aktiv) setPlzUnbekanntFuer(null); });
    return () => { aktiv = false; };
  }, [ortPlz]);
  const plzUnbekannt = plzUnbekanntFuer !== null && plzUnbekanntFuer === ortPlz;
  const kantonsAemter = ortKanton === '' ? null : BETREIBUNGSAEMTER[ortKanton];

  // Konkretes Amt über die Gemeinde (lazy, deterministisch — §2/§3).
  // Render-Abgleich: gespeichert wird der Treffer MIT seinem Schlüssel; die
  // Anzeige gilt nur, solange Kanton+Gemeinde noch dem Schlüssel entsprechen
  // (kein synchrones Zurücksetzen im Effect, keine stale Adresse).
  const [amtErgebnis, setAmtErgebnis] = useState<{ schluessel: string; treffer: BetreibungsamtTreffer | null } | null>(null);
  const amtSchluessel = `${ortKanton}|${ortGemeinde.trim().toLowerCase()}`;
  useEffect(() => {
    let aktiv = true;
    if (ortKanton === '' || ortGemeinde.trim() === '') return;
    const schluessel = `${ortKanton}|${ortGemeinde.trim().toLowerCase()}`;
    betreibungsamtFuer(ortKanton, ortGemeinde)
      .then((t) => { if (aktiv) setAmtErgebnis({ schluessel, treffer: t }); })
      .catch(() => { if (aktiv) setAmtErgebnis({ schluessel, treffer: null }); });
    return () => { aktiv = false; };
  }, [ortKanton, ortGemeinde]);
  const amtTreffer = amtErgebnis !== null && amtErgebnis.schluessel === amtSchluessel ? amtErgebnis.treffer : null;

  const forderung = forderungRoh.trim() === '' ? null : Number(forderungRoh.replace(/['’\s]/g, '').replace(',', '.'));
  const forderungUngueltig = forderung !== null && (!Number.isFinite(forderung) || forderung < 0);

  const input: SchkgInput = {
    anliegen, schuldnerTyp, pfand, arrestGelegt,
    forderungCHF: forderungUngueltig ? null : forderung,
    widerspruchKonstellation: widerspruchK, kollokationIn, rechtsoeffnungArt: roArt,
  };
  let r: ReturnType<typeof bestimmeSchkgZustaendigkeit> | null;
  try { r = bestimmeSchkgZustaendigkeit(input); } catch { r = null; }

  const pk = usePaneKlasse();

  return (
    <div className="space-y-6">
      {/* 2 · Anliegen */}
      <div className="space-y-2">
        <GruppenTitel>2 · Worum geht es?</GruppenTitel>
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 @3xl/pane:grid-cols-3 gap-2')}
          items={ANLIEGEN.map((a) => ({ code: a.code, label: a.label, sub: a.sub }))}
          value={anliegen}
          onSelect={setAnliegen}
        />
      </div>

      {/* 3 · Schuldner + Konstellation */}
      <div className="space-y-2">
        <GruppenTitel>3 · Schuldnerin/Schuldner und Konstellation</GruppenTitel>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Schuldner-Typ" hint="bestimmt den Betreibungsort (Art. 46–50 SchKG)">
            <select value={schuldnerTyp} onChange={(e) => setSchuldnerTyp(e.target.value as SchkgSchuldnerTyp)} className={inputCls}>
              {SCHULDNER.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Pfandsicherung" hint="Grundpfand erzwingt den Ort des Grundstücks (Art. 51 Abs. 2)">
            <select value={pfand} onChange={(e) => setPfand(e.target.value as SchkgPfand)} className={inputCls}>
              <option value="kein">keine</option>
              <option value="faustpfand">Faustpfand</option>
              <option value="grundpfand">Grundpfand</option>
            </select>
          </Field>
          <Field label="Forderung (CHF)" hint="für die Gebühr des Zahlungsbefehls (Art. 16 GebV SchKG)">
            <BetragsFeld className={inputCls + ' num w-44'} value={forderungRoh} onChange={setForderungRoh} aria-invalid={forderungUngueltig} />
          </Field>
          <Checkbox
            checked={arrestGelegt}
            onChange={setArrestGelegt}
            label="Für die Forderung ist bereits Arrest gelegt (Art. 52 SchKG)"
            className="sm:mt-7"
          />
        </div>
        {anliegen === 'widerspruch' && (
          <Field label="Widerspruchs-Konstellation" hint="bestimmt Forum UND Parteirollen (Art. 107–109)">
            <select value={widerspruchK} onChange={(e) => setWiderspruchK(e.target.value as WiderspruchKonstellation)} className={inputCls}>
              {WIDERSPRUCH.map((w) => <option key={w.code} value={w.code}>{w.label}</option>)}
            </select>
          </Field>
        )}
        {anliegen === 'kollokation' && (
          <Field label="Verfahren">
            <select value={kollokationIn} onChange={(e) => setKollokationIn(e.target.value as 'pfaendung' | 'konkurs')} className={inputCls}>
              <option value="pfaendung">in der Pfändung (Art. 148)</option>
              <option value="konkurs">im Konkurs (Art. 250)</option>
            </select>
          </Field>
        )}
        {anliegen === 'rechtsoeffnung' && (
          <Field label="Titel">
            <select value={roArt} onChange={(e) => setRoArt(e.target.value as 'provisorisch' | 'definitiv')} className={inputCls}>
              <option value="provisorisch">Schuldanerkennung → provisorische Rechtsöffnung (Art. 82)</option>
              <option value="definitiv">Vollstreckbares Urteil → definitive Rechtsöffnung (Art. 80)</option>
            </select>
          </Field>
        )}
        {forderungUngueltig && (
          <p role="alert" className="lc-notice-warn text-body-s">Forderung: bitte einen Betrag ≥ 0 eingeben.</p>
        )}
      </div>

      {/* 3b · Betreibungsort lokalisieren (optional) — konkretes Amt.
          Bug-Check §9 (HOCH, 7.6.2026): Der Orts-Hinweis folgt DERSELBEN
          Weiche wie die Engine (Art. 46/51/52 SchKG) — ein statisches
          «Wohnsitz/Sitz» wäre bei Grundpfand/Arrest irreführend. */}
      <div className="space-y-2">
        <GruppenTitel>3b · Betreibungsort lokalisieren (optional)</GruppenTitel>
        <p className="text-body-s text-ink-600">
          PLZ, Gemeinde oder Kanton des Betreibungsortes —{' '}
          {pfand === 'grundpfand'
            ? 'zwingend der Ort des verpfändeten Grundstücks, NICHT der Wohnsitz (Art. 51 Abs. 2 SchKG)'
            : pfand === 'faustpfand'
              ? 'Wohnsitz/Sitz der Schuldnerseite oder wahlweise der Ort des Pfandes (Art. 51 Abs. 1 SchKG)'
              : arrestGelegt
                ? 'Wohnsitz/Sitz der Schuldnerseite oder wahlweise der Ort des Arrestgegenstands (Art. 52 SchKG; gilt nicht für das Konkursbegehren)'
                : 'massgeblich ist die Herleitung oben (z. B. Wohnsitz/Sitz der Schuldnerseite)'}
          {' '}— zeigt das zuständige Betreibungsamt bzw. das amtliche kantonale Verzeichnis.
        </p>
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label="PLZ" hint="amtliches Ortschaftenverzeichnis — setzt Kanton und Gemeinde">
            <input
              type="text" inputMode="numeric" maxLength={4} value={ortPlz}
              onChange={(e) => setOrtPlz(e.target.value.replace(/\D/g, ''))}
              className={inputCls + ' num w-28'} placeholder="PLZ" aria-label="Postleitzahl des Betreibungsortes"
            />
          </Field>
          <Field label="Politische Gemeinde" hint="für die Kreis-Auflösung (ZH/FR/SO/AR/GR/TG/TI/VD)">
            <input
              type="text" value={ortGemeinde} onChange={(e) => setOrtGemeinde(e.target.value)}
              className={inputCls} placeholder="Gemeinde" aria-label="Politische Gemeinde des Betreibungsortes"
            />
          </Field>
          <Field label="Kanton">
            <select value={ortKanton} onChange={(e) => setOrtKanton(e.target.value as Kanton | '')} className={inputCls}>
              <option value="">– wählen –</option>
              {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>
        {plzUnbekannt && (
          <p className="text-xs text-warn-700">PLZ {ortPlz}: im amtlichen Ortschaftenverzeichnis nicht gefunden — bitte prüfen.</p>
        )}
        {plzWahl && plzWahl.plz === ortPlz && (
          <PlzGemeindeWahl
            plz={ortPlz} treffer={plzWahl.treffer} gemeinde={ortGemeinde} kanton={ortKanton}
            onWahl={({ gemeinde, kanton }) => { setOrtGemeinde(gemeinde); setOrtKanton(kanton); }}
          />
        )}
      </div>

      {/* 4 · Ergebnis */}
      {r && (
        <ErgebnisBlock>

          {/* Betreibungsort + Forum */}
          <div className="lc-card p-5 space-y-3">
            <GruppenTitel>Betreibungsort (Wurzelgrösse)</GruppenTitel>
            <p className="text-body-s text-ink-900">{r.betreibungsort.text}.</p>
            <div className="border-t border-line pt-3">
              <p className="lc-overline mb-1.5">Forum für dieses Anliegen</p>
              <p className="text-body-s text-ink-900 font-medium">{r.forum.stelle}</p>
              <p className="text-body-s text-ink-700 mt-1">{r.forum.text}</p>
              <p className="text-body-s text-ink-700 mt-1">{r.eingabe.verfahren}.</p>
            </div>

            {/* Konkretes Betreibungsamt am gewählten Betreibungsort (3b) */}
            <div className="border-t border-line pt-3 space-y-2">
              <p className="lc-overline mb-1.5">Betreibungsamt am Betreibungsort{ortKanton !== '' ? ` (${ortKanton})` : ''}</p>
              {kantonsAemter === null ? (
                <p className="text-body-s text-ink-600">PLZ oder Kanton unter 3b wählen, um das zuständige Betreibungsamt zu sehen.</p>
              ) : kantonsAemter.aufloesung.modus === 'einheitsamt' ? (
                <AmtAdresse amt={kantonsAemter.aufloesung.amt} />
              ) : kantonsAemter.aufloesung.modus === 'kreise' ? (
                <div className="space-y-2">
                  {kantonsAemter.aufloesung.hinweis && <p className="text-body-s text-ink-600"><NormText text={kantonsAemter.aufloesung.hinweis} /></p>}
                  {amtTreffer?.art === 'amt' ? (
                    <AmtAdresse amt={amtTreffer.amt} />
                  ) : amtTreffer?.art === 'stadtkreise' ? (
                    <>
                      <p className="text-body-s text-ink-700">{amtTreffer.stadt}: je Stadtkreis ein Amt — massgeblich ist der Kreis der Adresse.</p>
                      {amtTreffer.aemter.map((a) => <AmtAdresse key={a.name} amt={a} />)}
                    </>
                  ) : kantonsAemter.aufloesung.aemter.length <= 8 ? (
                    <>
                      {ortGemeinde.trim() !== '' && BETREIBUNGSAMT_KANTONE.includes(ortKanton as Kanton) && (
                        <p className="text-body-s text-warn-700">
                          Gemeinde «{ortGemeinde.trim()}» nicht in der Zuordnungskarte gefunden — alle Ämter des Kantons:
                        </p>
                      )}
                      {kantonsAemter.aufloesung.aemter.map((a) => <AmtAdresse key={a.name} amt={a} />)}
                    </>
                  ) : (
                    <p className="text-body-s text-ink-700">
                      {kantonsAemter.aufloesung.aemter.length} Ämter — politische Gemeinde unter 3b eingeben
                      {ortGemeinde.trim() !== '' ? ` («${ortGemeinde.trim()}» wurde nicht gefunden — Schreibweise prüfen)` : ''}
                      {kantonsAemter.url ? <> oder <a href={kantonsAemter.url} target="_blank" rel="noreferrer" className="text-brass-700 underline">amtliche Suche ({ortKanton}) ↗</a></> : null}.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-body-s text-ink-700">
                  {kantonsAemter.aufloesung.beschreibung} —{' '}
                  <a href={kantonsAemter.aufloesung.url} target="_blank" rel="noreferrer" className="text-brass-700 underline">
                    amtliches Verzeichnis ({ortKanton}) ↗
                  </a>
                </p>
              )}
              {kantonsAemter !== null && (
                <p className="text-xs text-ink-500">
                  Stand {kantonsAemter.stand} · Quelle: {kantonsAemter.quelle} — zweifach geprüfte Recherche, fachliche Abnahme ausstehend.
                </p>
              )}
              {anliegen !== 'betreibung_einleiten' && (
                <p className="text-xs text-ink-500">
                  Hinweis: Für dieses Anliegen ist das Forum oben massgeblich (Gericht/Aufsichtsbehörde) — das
                  Betreibungsamt dient der Orientierung am Betreibungsort.
                </p>
              )}
              {/* Doppellink-Dedup (Bug-Check NIEDRIG): SG verlinkt als
                  «Verzeichnis» bereits EasyGov — Zweitweg dann weglassen. */}
              {!(kantonsAemter?.aufloesung.modus === 'verzeichnis' && kantonsAemter.aufloesung.url.startsWith('https://www.easygov.swiss/')) && (
                <a href={BETREIBUNGSAEMTER_VERZEICHNIS} target="_blank" rel="noreferrer" className="text-brass-700 underline text-body-s inline-block">
                  Amtliche Suche nach Adresse (EasyGov, SECO) ↗
                </a>
              )}
            </div>
          </div>

          {/* Fristen */}
          {r.fristen.length > 0 && (
            <div className="lc-card p-5 space-y-2.5">
              <GruppenTitel>Fristen</GruppenTitel>
              {r.fristen.map((f) => (
                <p key={f.label + f.norm} className="text-body-s text-ink-800">
                  {f.kritisch && <span className="lc-badge lc-badge-danger mr-1.5">Verwirkung</span>}
                  <span className="font-medium text-ink-900">{f.label}:</span> {f.frist} <span className="text-ink-500">({f.norm})</span>
                </p>
              ))}
              {/* Prefill-Brücke BGer (Auftrag David 11.6.2026): der Weiterzug
                  des Aufsichts-Entscheids — 10 T. (Wechsel 5 T.), streitwert-
                  unabhängig, II. zivilrechtliche Abteilung (Art. 34 BGerR). */}
              {anliegen === 'beschwerde_amt' && (
                <p className="text-xs text-ink-500 border-t border-line pt-2.5">
                  Weiterzug des Aufsichts-Entscheids ans Bundesgericht — konkretes Fristende und Details:{' '}
                  <Link to={bgerRechtswegLink({ weg: 'schkg_aufsicht' })} className="text-brass-700 underline">
                    BGer-Rechner (vorbefüllt)
                  </Link>
                  {' '}— nur noch die Eröffnung des Aufsichts-Entscheids eintragen.
                </p>
              )}
              {anliegen === 'rechtsoeffnung' && (
                <p className="text-xs text-ink-500 border-t border-line pt-2.5">
                  Weiterzug des Rechtsöffnungs-ENTSCHEIDS: kantonal Beschwerde (Art. 319 ff. ZPO), danach ans Bundesgericht — dort zur{' '}
                  <span className="font-medium text-ink-700">I. zivilrechtlichen Abteilung</span> (Art. 33 lit. i BGerR; nicht zur II. wie übriges SchKG).{' '}
                  <Link to={bgerRechtswegLink({ weg: 'zivil', zivilGebiet: 'rechtsoeffnung', ...(forderung !== null ? { streitwert: forderung } : {}) })} className="text-brass-700 underline">
                    BGer-Rechner (vorbefüllt)
                  </Link>
                </p>
              )}
            </div>
          )}

          {/* Fahrplan (analog Zivil) */}
          {r.fahrplan.length > 0 && (
            <div className="lc-card p-5 space-y-3">
              <GruppenTitel>Ihr Fahrplan</GruppenTitel>
              <ol className="space-y-2.5">
                {r.fahrplan.map((s, i) => (
                  <li key={s.titel} className="flex gap-3">
                    <span aria-hidden className="shrink-0 w-6 h-6 bg-brass-100 text-brass-700 inline-flex items-center justify-center text-xs font-semibold num">{i + 1}</span>
                    <span>
                      <span className="block text-body-s font-medium text-ink-900">{s.titel}</span>
                      <span className="block text-body-s text-ink-600">{s.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* S-4: direkter Sprung zur passenden Eingabe-Vorlage (die
              ermittelte Stelle samt Adresse steht oben in der Forum-Karte;
              gebaute Vorlagen verlinken, geplante ehrlich «in Vorbereitung»). */}
          {VORLAGE_JE_ANLIEGEN[anliegen] && (
            <VorlagenSprung karteId={VORLAGE_JE_ANLIEGEN[anliegen]!}
              zusatz={`Einzureichen bei: ${r.forum.stelle}.`} />
          )}

          {/* Kosten */}
          {r.kostenZahlungsbefehl && (
            <div className="lc-card p-5 space-y-2">
              <GruppenTitel>Voraussichtliche Kosten</GruppenTitel>
              <p className="text-body-s text-ink-800">
                <span className="font-medium text-ink-900">Gebühr Zahlungsbefehl: CHF {r.kostenZahlungsbefehl.gebuehrCHF.toFixed(2).replace('.00', '.–')}</span>{' '}
                (Forderung {r.kostenZahlungsbefehl.band} Franken; <a href={GEBV_SCHKG_URL} target="_blank" rel="noreferrer" className="underline hover:text-brass-700">Art. 16 Abs. 1 GebV SchKG ↗</a>).
              </p>
              <p className="text-xs text-ink-500">
                Tarifstand: Konsolidierung 1.1.2026 — die Art.-16-Staffel ist seit 1.1.2022 unverändert (AS 2025 630
                betrifft nur Art. 15a/15b eSchKG; Wert für Wert am Filestore-HTML verifiziert, Dossier
                gebv-schkg-kostenrechner 7.6.2026). Hinzu kommen Zustellkosten (CHF 7.– je Versuch, Abs. 3);
                die Kosten sind von der Gläubigerseite vorzuschiessen und der Forderung zuschlagbar (Art. 68 SchKG).
              </p>
            </div>
          )}

          <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
            <EckdatenKachel label="Zuständige Stelle" wert={r.forum.stelle.split(' (')[0].split(' ODER')[0]} sub={r.forum.stelle.includes('ODER') ? 'Wahlgerichtsstand — Details unten' : undefined} />
            <EckdatenKachel label="Eingabe" wert={r.eingabe.art.split(' (')[0]} />
            <EckdatenKachel label="Kritische Fristen" wert={String(r.fristen.filter((f) => f.kritisch).length)} sub={r.fristen.find((f) => f.kritisch)?.frist} />
          </div>

          {r.weichen.map((w) => <div key={w} className="lc-notice text-body-s"><NormText text={w} /></div>)}
          {r.warnungen.map((w) => <div key={w} className="lc-notice-warn text-body-s"><NormText text={w} /></div>)}

          <div className="flex flex-wrap gap-1.5">
            {r.normverweise.map((n, i) => <NormLink key={i} artikel={n.artikel} bemerkung={n.bemerkung} />)}
          </div>

          {/* Mandatstauglicher Output (G3.1 / M-8, 10.6.2026): Aktenzeichen +
              PDF + Teilen — gleicher geteilter Rahmen wie der Zivil-Teil (§10). */}
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen}
            query={() => permalinkKodieren(SCHKG_LINK_SPEC, {
              anliegen, schuldnerTyp, pfand, arrestGelegt, forderungRoh,
              widerspruchK, kollokationIn, roArt, ortPlz, ortKanton, ortGemeinde,
            })}
            pdf={{
              aktenzeichen: aktenzeichen.trim() || undefined,
              title: 'Zuständigkeit (SchKG)',
              rechtsgrundlage: 'Bestimmung nach Art. 17, 46–55, 67 ff. SchKG (Stand 1.1.2025)',
              domain: 'zustaendigkeit',
              fileBase: 'SchKG-Zustaendigkeit',
              inputs: {
                'Rechtsweg': 'Betreibung (SchKG)',
                'Anliegen': ANLIEGEN.find((a) => a.code === anliegen)?.label ?? anliegen,
                'Schuldner-Typ': SCHULDNER.find((s) => s.code === schuldnerTyp)?.label ?? schuldnerTyp,
                ...(pfand !== 'kein' ? { 'Pfandsicherung': pfand === 'grundpfand' ? 'Grundpfand' : 'Faustpfand' } : {}),
                ...(arrestGelegt ? { 'Arrest gelegt': 'ja (Art. 52 SchKG)' } : {}),
                ...(r.kostenZahlungsbefehl && forderung !== null ? { 'Forderung': `CHF ${forderung.toLocaleString('de-CH')}` } : {}),
                ...(anliegen === 'widerspruch' ? { 'Konstellation': WIDERSPRUCH.find((w) => w.code === widerspruchK)?.label ?? '' } : {}),
                ...(ortKanton !== '' || ortGemeinde.trim() || ortPlz ? { 'Betreibungsort': [ortPlz, ortGemeinde.trim(), ortKanton].filter(Boolean).join(' ') } : {}),
              },
              hero: {
                hauptlabel: 'Forum für dieses Anliegen',
                hauptwert: r.forum.stelle,
                nebenwerte: [
                  { label: 'Eingabe', wert: r.eingabe.art },
                  ...(r.fristen.some((x) => x.kritisch) ? [{ label: 'Kritische Frist', wert: r.fristen.find((x) => x.kritisch)!.frist }] : []),
                ],
                kontext: r.betreibungsort.text,
              },
              sections: [{ titel: 'Zuständigkeit nach SchKG', ergebnis: schkgZustaendigkeitBericht(r) }],
              disclaimer: SCHKG_DISCLAIMER,
            }} />

          <p className="text-xs text-ink-500 pt-2 border-t border-line">
            Regelwerk verbatim am SchKG-Wortlaut verifiziert (Stand 1.1.2025) — fachliche Abnahme ausstehend.
          </p>
        </ErgebnisBlock>
      )}
    </div>
  );
}
