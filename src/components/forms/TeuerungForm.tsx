import { useState } from 'react';
import { BeruehrtRahmen, EckdatenKachel, FehlerBox, Field, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { SelectionGrid } from '../ui/SelectionGrid';
import { BetragsFeld } from '../BetragsFeld';
import {
  berechneTeuerung, monatLabel, basisAuto,
  TEUERUNG_ERSTER_MONAT, LIK_LETZTER_MONAT, LIK_QUELLE, LIK_STAND,
  type TeuerungModus, type TeuerungRundung, type TeuerungErgebnis,
} from '../../lib/teuerung';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, einerVon, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── LIK-Teuerungsrechner – UI ──────────────────────────────────────────────
// Reine Darstellung; Formel, Basis-AUTO-Wahl und alle Rechtsregeln liegen in
// lib/teuerung.ts (Daten: amtliche BFS-Reihe, data/likReihe.ts). Der Nutzer
// wählt MONAT/JAHR – den Indexstand schlägt der Rechner selbst nach
// (Kern-UX-Entscheid des Konzept-Berichts 5.6.2026).

const DISCLAIMER =
  'Automatisierte Orientierungsberechnung – keine Rechtsberatung. Gerechnet wird mit den ' +
  'publizierten, gerundeten BFS-Indexreihen; massgeblich sind Vertrag bzw. Urteil ' +
  '(Indexklausel, Basis, Rundung) und die amtlichen BFS-Werte.';

const MODI: { code: TeuerungModus; label: string; sub: string }[] = [
  { code: 'generisch', label: 'Wertsicherung (generisch)', sub: 'Renten, Pacht, Lizenzen – BFS-Dreisatz' },
  { code: 'indexmiete', label: 'Indexmiete', sub: '100 %-Weitergabe (Art. 269b OR / Art. 17 VMWG)' },
  { code: 'unterhalt', label: 'Unterhaltsbeitrag', sub: 'Art. 286 / 128 ZGB – Index gemäss Urteil' },
];

const JAHRE: number[] = [];
for (let j = Number(LIK_LETZTER_MONAT.slice(0, 4)); j >= Number(TEUERUNG_ERSTER_MONAT.slice(0, 4)); j--) JAHRE.push(j);
const MONATE = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function MonatJahr({ wert, onChange, label, hint }: { wert: string; onChange: (v: string) => void; label: string; hint?: string }) {
  const [j, m] = wert.split('-');
  return (
    <Field label={label} hint={hint}>
      <div className="flex gap-2">
        <select className={inputCls} value={m} onChange={(e) => onChange(`${j}-${e.target.value}`)} aria-label={`${label} – Monat`}>
          {MONATE.map((mm) => <option key={mm} value={mm}>{monatLabel(`2000-${mm}`).split(' ')[0]}</option>)}
        </select>
        <select className={inputCls + ' w-28'} value={j} onChange={(e) => onChange(`${e.target.value}-${m}`)} aria-label={`${label} – Jahr`}>
          {JAHRE.map((jj) => <option key={jj} value={jj}>{jj}</option>)}
        </select>
      </div>
    </Field>
  );
}

// Permalink (FAHRPLAN-PRAXIS 1.3)
const MONAT_RX = /^\d{4}-\d{2}$/;
type TeuLink = { modus: string; betrag?: string; von?: string; bis?: string; rundung?: string };
const TEU_LINK_SPEC: PermalinkSpec<TeuLink & Record<string, unknown>> = {
  modus: { p: 'm', typ: 'str', gueltig: einerVon('generisch', 'indexmiete', 'unterhalt') },
  betrag: { p: 'b', typ: 'str', gueltig: (v) => v.length <= 16 },
  von: { p: 'v', typ: 'str', gueltig: (v) => MONAT_RX.test(v) },
  bis: { p: 'bi', typ: 'str', gueltig: (v) => MONAT_RX.test(v) },
  rundung: { p: 'r', typ: 'str', gueltig: einerVon('0.01', '0.05', '1') },
};

export function TeuerungForm() {
  const pk = usePaneKlasse();
  const ausLink = usePermalinkFelder(TEU_LINK_SPEC);
  const [modus, setModus] = useState<TeuerungModus>((ausLink.modus as TeuerungModus | undefined) ?? 'generisch');
  const [betrag, setBetrag] = useState(ausLink.betrag ?? '1000');
  const [von, setVon] = useState(ausLink.von ?? '2022-12');
  const [bis, setBis] = useState(ausLink.bis ?? LIK_LETZTER_MONAT); // Default: letzter publizierter Monat
  const [rundung, setRundung] = useState<TeuerungRundung | ''>((ausLink.rundung as TeuerungRundung | undefined) ?? '');

  let ergebnis: TeuerungErgebnis | null = null;
  let fehler: string | null = null;
  try {
    ergebnis = berechneTeuerung({
      modus, betrag: Number(betrag.replace(/['’\s]/g, '').replace(',', '.')),
      vonMonat: von, bisMonat: bis,
      ...(rundung ? { rundung } : {}),
    });
  } catch (e) {
    fehler = e instanceof Error ? e.message : String(e);
  }

  // FAHRPLAN-PRAXIS 1.2: Mandats-Referenz für den PDF-Kopf (optional).
  const [aktenzeichen, setAktenzeichen] = useState('');
  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'LIK-Teuerung',
    rechtsgrundlage: modus === 'indexmiete' ? 'Art. 269b OR · Art. 17 VMWG' : modus === 'unterhalt' ? 'Art. 286 / Art. 128 ZGB' : 'BFS-Indexierung (LIK)',
    domain: 'teuerung',
    fileBase: 'Teuerungsrechner',
    inputs: {
      'Anwendungsfall': MODI.find((x) => x.code === modus)?.label ?? modus,
      'Betrag alt': `CHF ${betrag}`,
      'Indexstand alt': monatLabel(von),
      'Indexstand neu': monatLabel(bis),
      ...(ergebnis ? { 'Indexbasis (AUTO)': `${monatLabel(ergebnis.basis)} = 100` } : {}),
    },
    hero: ergebnis ? {
      hauptlabel: 'Betrag neu',
      hauptwert: `CHF ${ergebnis.betragNeu.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`,
      nebenwerte: [
        { label: 'Veränderung', wert: `${ergebnis.prozent > 0 ? '+' : ''}${ergebnis.prozent.toFixed(1)} %` },
        { label: 'Index', wert: `${ergebnis.indexAlt.toFixed(1)} → ${ergebnis.indexNeu.toFixed(1)}` },
      ],
      kontext: `${monatLabel(von)} → ${monatLabel(bis)} · Basis ${monatLabel(ergebnis.basis)} = 100`,
    } : undefined,
    sections: ergebnis ? [{ titel: 'LIK-Indexierung', ergebnis }] : [],
    disclaimer: DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6">
      <PflichtDisclaimer
        kurz="LIK-Indexierung nach den publizierten BFS-Reihen; massgeblich sind Vertrag bzw. Urteil (Indexklausel, Basis, Rundung)."
        text={DISCLAIMER} />

      {/* Anwendungsfall (Progressive Disclosure) */}
      <SelectionGrid
        className={`grid grid-cols-1 ${pk('sm:grid-cols-3', '@xl/pane:grid-cols-3')} gap-2`}
        items={MODI.map((m) => ({ code: m.code, label: m.label, sub: m.sub }))}
        value={modus}
        onSelect={setModus}
      />

      <div className={`grid grid-cols-1 ${pk('sm:grid-cols-2', '@lg/pane:grid-cols-2')} gap-4`}>
        <Field label={modus === 'indexmiete' ? 'Nettomietzins alt (CHF/Monat)' : modus === 'unterhalt' ? 'Unterhaltsbeitrag gemäss Urteil (CHF)' : 'Betrag alt (CHF)'}>
          {/* LM-072 (B12, 4.9.2026): die feste Feldbreite ist weg — das Feld folgt jetzt
                seiner Rasterzelle wie jedes andere `Field` derselben Reihe. GEMESSEN
                @1440 stand es als 176 px neben Feldern von 495 px, ohne dass die
                schmalere Breite etwas aussagte (§8: eine Breite ist eine Zusage über
                die erwartete Eingabelänge). Die schmalen Felder der INLINE-Reihen
                (Zahl + Einheit nebeneinander, `w-24`) bleiben, dort trägt die Breite
                die Zusammengehörigkeit. */}
          <BetragsFeld className={inputCls + ' num'} value={betrag}
            aria-invalid={!!fehler && /Betrag/.test(fehler)}
            onChange={setBetrag} />
        </Field>
        <Field label="Rundung" hint="vertrags-/urteilsabhängig">
          <select className={inputCls} value={rundung} onChange={(e) => setRundung(e.target.value as TeuerungRundung | '')}>
            <option value="">{modus === 'generisch' ? 'auf den Rappen (Standard)' : 'auf 5 Rappen (Standard)'}</option>
            <option value="0.01">auf den Rappen</option>
            <option value="0.05">auf 5 Rappen</option>
            <option value="1">auf ganze Franken</option>
          </select>
        </Field>
        <MonatJahr label={modus === 'unterhalt' ? 'Indexstand bei Urteil/Vereinbarung' : modus === 'indexmiete' ? 'Indexstand bei Vertrag/letzter Anpassung' : 'Ausgangsmonat (Index alt)'}
          wert={von} onChange={setVon} />
        <MonatJahr label="Zielmonat (Index neu)" wert={bis} onChange={setBis}
          hint={`letzter publizierter Monat: ${monatLabel(LIK_LETZTER_MONAT)} – der LIK erscheint erst im Folgemonat${modus === 'unterhalt' ? '; Praxis: November des Vorjahres' : ''}`} />
      </div>

      {fehler && <FehlerBox fehler={[fehler]} />}

      {ergebnis && (
        <ErgebnisBlock>
          {/* Eckdaten (UX B17): Wichtigstes zuerst, wie bei den übrigen Rechnern */}
          <div className={`grid grid-cols-1 ${pk('sm:grid-cols-3', '@xl/pane:grid-cols-3')} gap-3`}>
            {[
              { label: 'Indexierter Betrag', val: `CHF ${ergebnis.betragNeu.toLocaleString('de-CH', { minimumFractionDigits: 2 })}`, akzent: true },
              { label: 'Veränderung', val: `${ergebnis.prozent > 0 ? '+' : ''}${ergebnis.prozent.toFixed(1)} %` },
              { label: 'Index (Basis ' + monatLabel(ergebnis.basis) + ' = 100)', val: `${ergebnis.indexAlt.toFixed(1)} → ${ergebnis.indexNeu.toFixed(1)}` },
            ].map((c) => (
              <EckdatenKachel key={c.label} label={c.label} wert={c.val} num akzent={c.akzent} />
            ))}
          </div>
          <ErgebnisAnzeige titel={`LIK-Indexierung (Basis ${monatLabel(ergebnis.basis)} = 100)`} ergebnis={ergebnis} />
          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(TEU_LINK_SPEC, { modus, betrag, von, bis, rundung: rundung || undefined })} />
          {/* QS-UI 8b (B2): Die Quellen-Mikrozeile (R4 Ziff. 7) lief über die volle
              Kartenbreite — gemessen 910 px und 104 Zeichen je Zeile gegen die
              640-px-Lesespalte. Nur Breite; Quellenangabe unverändert (§5/§7). */}
          <p className="text-micro text-ink-500 max-w-kleintext">
            Quelle: {LIK_QUELLE} · {LIK_STAND} · freie Nutzung, Quellenangabe Pflicht (OPEN-BY)
            {basisAuto(von, bis) && ` · Basis automatisch gewählt`}
          </p>
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
