import { useMemo, useState } from 'react';
import { BeruehrtRahmen, Checkbox, ErgebnisPlatzhalter, FehlerBox, Field, inputCls } from '../vorlagen/ui';
import { zahlBeliebig as zahl } from './eingabe';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { berechneBetreibungskosten, type GebvErgebnis } from '../../lib/gebvKosten';

// ─── Betreibungskosten-Form (GebV SchKG) — Quick-Win B.9 ────────────────────
// Reine Darstellung (§3): Tatbestand-Schalter + Beträge; gerechnet wird in
// lib/gebvKosten.ts (Tarif-Register amtlich verifiziert, Dossier
// gebv-schkg-kostenrechner.md).

const GK_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  forderung: { p: 'f', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  zb: { p: 'zb', typ: 'bool' },
  zbAusf: { p: 'za', typ: 'num', gueltig: (n) => Number.isInteger(n) && n >= 0 && n <= 20 },
  zbVersuche: { p: 'zv', typ: 'num', gueltig: (n) => Number.isInteger(n) && n >= 0 && n <= 20 },
  pf: { p: 'pf', typ: 'str', gueltig: einerVon('vollzogen', 'fruchtlos', 'erfolglos') },
  vw: { p: 'vw', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  vwKein: { p: 'vk', typ: 'bool' },
  ez: { p: 'ez', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  sw: { p: 'sw', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
};

const GK_DISCLAIMER =
  'Amtliche Gebühren nach der GebV SchKG (Stand 1.1.2026): fixe Staffeln als Beträge, Rahmengebühren (z. B. Rechtsöffnung, Art. 48) nur als Bandbreite. ' +
  'Auslagen (Art. 13: Porti, Sachverständige) kommen effektiv hinzu und werden nicht beziffert. Der Schuldner trägt die Kosten; der Gläubiger schiesst sie vor (Art. 68 SchKG).';

export function GebvKostenForm({ minimal = false }: { minimal?: boolean } = {}) {
  const ausLink = usePermalinkFelder(GK_LINK_SPEC);

  const [forderung, setForderung] = useState<string>(ausLink.forderung != null ? String(ausLink.forderung) : '');
  const [zb, setZb] = useState<boolean>((ausLink.zb as boolean) ?? true);
  const [zbAusf, setZbAusf] = useState<string>(ausLink.zbAusf != null ? String(ausLink.zbAusf) : '0');
  const [zbVersuche, setZbVersuche] = useState<string>(ausLink.zbVersuche != null ? String(ausLink.zbVersuche) : '0');
  const [pf, setPf] = useState<'' | 'vollzogen' | 'fruchtlos' | 'erfolglos'>((ausLink.pf as 'vollzogen') ?? '');
  const [vw, setVw] = useState<string>(ausLink.vw != null ? String(ausLink.vw) : '');
  const [vwKein, setVwKein] = useState<boolean>((ausLink.vwKein as boolean) ?? false);
  const [ez, setEz] = useState<string>(ausLink.ez != null ? String(ausLink.ez) : '');
  const [sw, setSw] = useState<string>(ausLink.sw != null ? String(ausLink.sw) : '');
  const [aktenzeichen, setAktenzeichen] = useState('');

  const { ergebnis, fehler } = useMemo((): { ergebnis: GebvErgebnis | null; fehler: string | null } => {
    const f = zahl(forderung);
    if (f === undefined) return { ergebnis: null, fehler: null };
    try {
      return {
        ergebnis: berechneBetreibungskosten({
          forderungCHF: f,
          zahlungsbefehl: zb ? { weitereAusfertigungen: zahl(zbAusf) ?? 0, zustellversuche: zahl(zbVersuche) ?? 0 } : undefined,
          pfaendung: pf ? { ausgang: pf } : undefined,
          verwertung: zahl(vw) !== undefined ? { betragCHF: zahl(vw)!, keinErwerber: vwKein } : undefined,
          einzahlung: zahl(ez) !== undefined ? { summeCHF: zahl(ez)! } : undefined,
          entscheidSummarsache: zahl(sw) !== undefined ? { streitwertCHF: zahl(sw)! } : undefined,
        }),
        fehler: null,
      };
    } catch (e) {
      return { ergebnis: null, fehler: e instanceof Error ? e.message : String(e) };
    }
  }, [forderung, zb, zbAusf, zbVersuche, pf, vw, vwKein, ez, sw]);

  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Betreibungskosten (GebV SchKG)',
    domain: 'gebv-kosten',
    fileBase: 'Betreibungskosten',
    inputs: {
      'Forderung': forderung ? `CHF ${forderung}` : '–',
      'Zahlungsbefehl': zb ? `ja (${zbAusf} weitere Ausf., ${zbVersuche} Zustellversuche)` : 'nein',
      'Pfändung': pf || 'keine',
      'Verwertung': vw ? `CHF ${vw}${vwKein ? ' (Schätzwert, kein Erwerber)' : ' (Erlös)'}` : 'keine',
      'Einzahlung/Überweisung': ez ? `CHF ${ez}` : 'keine',
      'Entscheid Summarsache (Streitwert)': sw ? `CHF ${sw}` : 'keiner',
    },
    sections: ergebnis ? [{ titel: 'Betreibungskosten (GebV SchKG, Stand 1.1.2026)', ergebnis }] : [],
    disclaimer: GK_DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6 lc-rechner-spalten">
      {/* minimal = Startseite-Schnellrechner: globaler Pflicht-Hinweis dort (§8). */}
      {!minimal && <PflichtDisclaimer kurz="Amtliche Gebühren je Betreibungsschritt (GebV SchKG); Rahmengebühren nur als Bandbreite, Auslagen effektiv." text={GK_DISCLAIMER} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
        <Field label="Forderung in Betreibung (CHF)" hint="bezifferte Forderung — nicht bezifferte Zinsen ausser Betracht (Art. 6 GebV SchKG)">
          <BetragsFeld value={forderung} onChange={setForderung} className={inputCls}
            placeholder="z. B. 5'000" aria-label="Forderung in Franken" />
        </Field>
        {/* LM-079 (B19): Hilfetext ergänzt — fehlte hier als eines von zwei
            Feldern im Formular, obwohl Forderung/Verwertung/Einzahlung/
            Gerichtsentscheid je einen tragen. Wortlaut aus der Engine
            (gebvKosten.ts: «Zahlungsbefehl (Art. 16 Abs. 1 GebV SchKG)» /
            «Weitere … Ausfertigungen (Art. 16 Abs. 2)» / «Zustellungsversuche
            (Art. 16 Abs. 3)»). */}
        <Field label="Zahlungsbefehl (Art. 16)" hint="Grundgebühr nach Forderungshöhe (Abs. 1); weitere Ausfertigungen (Abs. 2) und Zustellversuche (Abs. 3) zusätzlich">
          <div className="space-y-2">
            <Checkbox checked={zb} onChange={setZb} label="Zahlungsbefehl erlassen/zugestellt" />
            {zb && (
              <div className="grid grid-cols-2 gap-3">
                <label className="text-body-s text-ink-700">weitere Ausfertigungen
                  <input type="number" min={0} max={20} value={zbAusf} onChange={(e) => setZbAusf(e.target.value)} className={inputCls} aria-label="Weitere Ausfertigungen" />
                </label>
                <label className="text-body-s text-ink-700">Zustellversuche (Abs. 3)
                  <input type="number" min={0} max={20} value={zbVersuche} onChange={(e) => setZbVersuche(e.target.value)} className={inputCls} aria-label="Zustellversuche" />
                </label>
              </div>
            )}
          </div>
        </Field>
        {/* LM-079 (B19): Hilfetext ergänzt, Wortlaut aus der Engine
            (gebvKosten.ts: «Pfändung (Art. 20 GebV SchKG)»). */}
        <Field label="Pfändung (Art. 20)" hint="Gebühr für den Pfändungsvollzug nach Forderungshöhe">
          <select value={pf} onChange={(e) => setPf(e.target.value as typeof pf)} className={inputCls} aria-label="Pfändung">
            <option value="">keine</option>
            <option value="vollzogen">vollzogen (inkl. Pfändungsurkunde)</option>
            <option value="fruchtlos">fruchtlos (halbe Gebühr, min. CHF 10)</option>
            <option value="erfolglos">erfolgloser Versuch (CHF 10)</option>
          </select>
        </Field>
        <Field label="Verwertung (Art. 30)" hint="Erlös; ohne Erwerber: Schätzwert">
          <div className="space-y-2">
            <BetragsFeld value={vw} onChange={setVw} className={inputCls}
              placeholder="Erlös/Schätzwert (leer = keine)" aria-label="Verwertungserlös" />
            {vw.trim() !== '' && (
              <Checkbox checked={vwKein} onChange={setVwKein} label="kein Erwerber gefunden (½, max. CHF 1'000 — Abs. 4)" />
            )}
          </div>
        </Field>
        <Field label="Einzahlung/Überweisung (Art. 19)" hint="Entgegennahme einer Zahlung + Weiterleitung">
          <BetragsFeld value={ez} onChange={setEz} className={inputCls}
            placeholder="Summe (leer = keine)" aria-label="Einzahlungssumme" />
        </Field>
        <Field label="Gerichtsentscheid Summarsache (Art. 48)" hint="z. B. Rechtsöffnung — Ausgabe als RAHMEN, nie als Punktwert">
          <BetragsFeld value={sw} onChange={setSw} className={inputCls}
            placeholder="Streitwert (leer = keiner)" aria-label="Streitwert Entscheidgebühr" />
        </Field>
      </div>

      {fehler && <FehlerBox fehler={[fehler]} />}

      {/* QS-UI 8b: Ergebnisplatz auch im Leerzustand angesagt (W2·10-UI-NAV/N0d·W1). */}
      {!ergebnis && !fehler && (
        <ErgebnisPlatzhalter was="Forderungsbetrag eingeben — hier erscheinen die Betreibungskosten und ihre Herleitung." />
      )}

      {ergebnis && (
        <ErgebnisBlock>
          <ErgebnisAnzeige titel="Betreibungskosten (GebV SchKG)" ergebnis={ergebnis} />
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(GK_LINK_SPEC, {
              forderung: zahl(forderung), zb, zbAusf: zahl(zbAusf), zbVersuche: zahl(zbVersuche),
              pf: pf || undefined, vw: zahl(vw), vwKein, ez: zahl(ez), sw: zahl(sw),
            })} />
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
