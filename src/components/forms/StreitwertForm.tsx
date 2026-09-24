import { useMemo, useState } from 'react';
import { BeruehrtRahmen, Checkbox, EckdatenKachel, ErgebnisPlatzhalter, FehlerBox, Field, inputCls, ListenEditor } from '../vorlagen/ui';
import { zahlBeliebig as zahl } from './eingabe';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { BetragsFeld } from '../BetragsFeld';
import { ErgebnisExport } from '../ErgebnisExport';
import { BegruendungSlot } from '../BegruendungSlot';
import { permalinkKodieren, type PermalinkSpec } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import type { PdfDocConfig } from '../../lib/pdf/pdfModel';
import { berechneStreitwert, streitwertGrenzwerte, type Begehren, type BegehrenTyp, type WiederkehrDauer, type StreitwertErgebnis, type StreitwertGebiet } from '../../lib/streitwert';
import { chfPraefix } from '../../lib/format';
import { SelectionGrid } from '../ui/SelectionGrid';

// ─── Streitwert-Form (Art. 91–94a ZPO) — Quick-Win B.9 ──────────────────────
// Reine Darstellung (§3): Begehren-Editor + Weichen; gerechnet wird in
// lib/streitwert.ts. Beträge als Roh-Strings (BetragsFeld, CHF-Apostroph).

type BegehrenRoh = {
  typ: BegehrenTyp;
  betrag: string;       // einmalig
  jahresbetrag: string; // wiederkehrend
  dauer: WiederkehrDauer;
  jahre: string;
  barwert: string;      // Leibrente
};

const LEERES_BEGEHREN: BegehrenRoh = { typ: 'einmalig', betrag: '', jahresbetrag: '', dauer: 'unbestimmt', jahre: '', barwert: '' };

const TYP_LABEL: { code: BegehrenTyp; label: string }[] = [
  { code: 'einmalig', label: 'einmalig bezifferte Forderung' },
  { code: 'wiederkehrend', label: 'wiederkehrende Nutzung/Leistung (Art. 92)' },
  { code: 'unbeziffert', label: 'nicht beziffert / Naturalleistung / Verbandsklage' },
];

// Hydration-Guard (Pflicht-Konvention für Array-Felder): unbekannte Werte
// aus dem Permalink werden feldweise auf gültige Defaults normalisiert.
function normalisiereBegehren(roh: unknown): BegehrenRoh[] {
  if (!Array.isArray(roh) || roh.length === 0) return [LEERES_BEGEHREN];
  return roh.slice(0, 10).map((b) => {
    const o = (b ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === 'string' && /^\d*(\.\d+)?$/.test(v) ? v : '');
    return {
      typ: ['einmalig', 'wiederkehrend', 'unbeziffert'].includes(o.typ as string) ? (o.typ as BegehrenTyp) : 'einmalig',
      betrag: str(o.betrag), jahresbetrag: str(o.jahresbetrag),
      dauer: ['unbestimmt', 'bestimmt', 'leibrente'].includes(o.dauer as string) ? (o.dauer as WiederkehrDauer) : 'unbestimmt',
      jahre: str(o.jahre), barwert: str(o.barwert),
    };
  });
}

const SW_LINK_SPEC: PermalinkSpec<Record<string, unknown>> = {
  begehren: {
    p: 'b', typ: 'json',
    gueltig: (v): boolean => Array.isArray(v) && v.length >= 1 && v.length <= 10,
  },
  ausschliessend: { p: 'x', typ: 'bool' },
  widerklage: { p: 'w', typ: 'num', gueltig: (n) => Number.isFinite(n) && n >= 0 },
  wkSchliesstAus: { p: 'wx', typ: 'bool' },
  teilklage: { p: 'tk', typ: 'bool' },
};

const SW_DISCLAIMER =
  'Der Rechner bestimmt den Streitwert nach Art. 91–94a ZPO aus den Rechtsbegehren. ' +
  'Nicht bezifferte Begehren, Leibrenten-Barwerte und Verbandsklagen setzt das Gericht nach Ermessen fest — hier wird nichts geschätzt. ' +
  'Vor Bundesgericht gilt die eigene Streitwertordnung der Art. 51–53 BGG.';

export function StreitwertForm() {
  const ausLink = usePermalinkFelder(SW_LINK_SPEC);

  const [begehren, setBegehren] = useState<BegehrenRoh[]>(() => normalisiereBegehren(ausLink.begehren));
  const [ausschliessend, setAusschliessend] = useState<boolean>((ausLink.ausschliessend as boolean) ?? false);
  const [widerklageRoh, setWiderklageRoh] = useState<string>(ausLink.widerklage != null ? String(ausLink.widerklage) : '');
  const [wkSchliesstAus, setWkSchliesstAus] = useState<boolean>((ausLink.wkSchliesstAus as boolean) ?? false);
  const [teilklage, setTeilklage] = useState<boolean>((ausLink.teilklage as boolean) ?? false);
  const [aktenzeichen, setAktenzeichen] = useState('');
  // Gebiets-Gabelung NUR für die BGG-Streitwertgrenze (Art. 74 I lit. a/b).
  const [gebiet, setGebiet] = useState<StreitwertGebiet>('uebrige');

  const setFeld = (i: number, patch: Partial<BegehrenRoh>) =>
    setBegehren((alt) => alt.map((b, j) => (j === i ? { ...b, ...patch } : b)));

  const { ergebnis, fehler } = useMemo((): { ergebnis: StreitwertErgebnis | null; fehler: string | null } => {
    try {
      const eingabe: Begehren[] = begehren.map((b) => ({
        typ: b.typ,
        betragCHF: zahl(b.betrag),
        jahresbetragCHF: zahl(b.jahresbetrag),
        dauer: b.typ === 'wiederkehrend' ? b.dauer : undefined,
        jahre: zahl(b.jahre),
        barwertCHF: zahl(b.barwert),
      }));
      // erst rechnen, wenn jedes bezifferbare Begehren eine Eingabe hat
      const unvollstaendig = eingabe.some((b, i) =>
        (b.typ === 'einmalig' && b.betragCHF === undefined)
        || (b.typ === 'wiederkehrend' && begehren[i].dauer !== 'leibrente' && b.jahresbetragCHF === undefined)
        || (b.typ === 'wiederkehrend' && begehren[i].dauer === 'bestimmt' && b.jahre === undefined));
      if (unvollstaendig) return { ergebnis: null, fehler: null };
      const wk = zahl(widerklageRoh);
      return {
        ergebnis: berechneStreitwert({
          begehren: eingabe,
          begehrenSchliessenSichAus: ausschliessend,
          widerklage: wk !== undefined ? { betragCHF: wk, schliesstAus: wkSchliesstAus } : undefined,
          hauptklageIstTeilklage: teilklage,
        }),
        fehler: null,
      };
    } catch (e) {
      return { ergebnis: null, fehler: e instanceof Error ? e.message : String(e) };
    }
  }, [begehren, ausschliessend, widerklageRoh, wkSchliesstAus, teilklage]);

  const pdfConfig: PdfDocConfig = {
    aktenzeichen: aktenzeichen.trim() || undefined,
    title: 'Streitwert (Art. 91–94a ZPO)',
    domain: 'streitwert',
    fileBase: 'Streitwert',
    inputs: {
      ...Object.fromEntries(begehren.map((b, i) => [
        `Begehren ${i + 1}`,
        b.typ === 'einmalig' ? `einmalig, CHF ${b.betrag || '–'}`
          : b.typ === 'unbeziffert' ? 'nicht beziffert (Ermessen)'
          : `wiederkehrend (${b.dauer}), CHF ${b.dauer === 'leibrente' ? (b.barwert || '–') + ' Barwert' : (b.jahresbetrag || '–') + '/Jahr'}${b.dauer === 'bestimmt' ? `, ${b.jahre || '–'} Jahre` : ''}`,
      ])),
      ...(begehren.length > 1 ? { 'Begehren schliessen sich aus': ausschliessend ? 'ja' : 'nein' } : {}),
      'Widerklage': widerklageRoh ? `CHF ${widerklageRoh}${wkSchliesstAus ? ' (ausschliessend)' : ''}` : 'keine',
      ...(widerklageRoh ? { 'Hauptklage ist Teilklage': teilklage ? 'ja (Art. 94 Abs. 3 ZPO)' : 'nein' } : {}),
    },
    sections: ergebnis ? [{ titel: 'Streitwert (Art. 91–94a ZPO)', ergebnis }] : [],
    disclaimer: SW_DISCLAIMER,
  };

  return (
    <BeruehrtRahmen>
    <div className="space-y-6">
      <PflichtDisclaimer kurz="Streitwert nach Rechtsbegehren (Art. 91 ff. ZPO); Ermessens-Konstellationen setzt das Gericht fest." text={SW_DISCLAIMER} />

      {/* Begehren-Editor — R2-F/F1-9: der handgebaute Behälter (`border
          border-line rounded-md`), die eigene Entfernen-Optik (`text-ink-500
          hover:text-danger-700`, gross geschrieben) und «+ Begehren
          hinzufügen» sind dem geteilten ListenEditor gewichen. Die Kappung bei
          10 Begehren war bisher ein stiller No-Op des Knopfs — neu blendet sie
          ihn aus (§8: ein Knopf, der nichts bewirkt, ist keine Ehrlichkeit). */}
      <div className="space-y-4">
        <ListenEditor
          element="Begehren"
          eintraege={begehren}
          mindestens={1}
          hoechstens={10}
          className="space-y-4"
          onHinzufuegen={() => setBegehren((alt) => [...alt, LEERES_BEGEHREN])}
          onEntfernen={(i) => setBegehren((alt) => alt.filter((_, j) => j !== i))}
          kinder={(b, i) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Art des Begehrens">
                <select value={b.typ} onChange={(e) => setFeld(i, { typ: e.target.value as BegehrenTyp })} className={inputCls}>
                  {TYP_LABEL.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
                </select>
              </Field>
              {b.typ === 'einmalig' && (
                <Field label="Forderungsbetrag (CHF)" hint="ohne Zinsen und Kosten (Art. 91 Abs. 1 ZPO)">
                  <BetragsFeld value={b.betrag} onChange={(v) => setFeld(i, { betrag: v })} className={inputCls}
                    placeholder="z. B. 50'000" aria-label={`Betrag Begehren ${i + 1}`} />
                </Field>
              )}
              {b.typ === 'wiederkehrend' && (
                <>
                  <Field label="Dauer">
                    <select value={b.dauer} onChange={(e) => setFeld(i, { dauer: e.target.value as WiederkehrDauer })} className={inputCls}>
                      <option value="unbestimmt">ungewiss / unbeschränkt (× 20)</option>
                      <option value="bestimmt">bestimmte Dauer</option>
                      <option value="leibrente">Leibrente (Barwert)</option>
                    </select>
                  </Field>
                  {b.dauer !== 'leibrente' && (
                    <Field label="Jahresbetrag (CHF)" hint="Wert der einjährigen Nutzung/Leistung (Art. 92 Abs. 1 ZPO)">
                      <BetragsFeld value={b.jahresbetrag} onChange={(v) => setFeld(i, { jahresbetrag: v })} className={inputCls}
                        placeholder="z. B. 12'000" aria-label={`Jahresbetrag Begehren ${i + 1}`} />
                    </Field>
                  )}
                  {b.dauer === 'bestimmt' && (
                    <Field label="Dauer (Jahre)">
                      <input type="number" min={1} value={b.jahre} onChange={(e) => setFeld(i, { jahre: e.target.value })}
                        className={inputCls} aria-label={`Dauer Begehren ${i + 1}`} />
                    </Field>
                  )}
                  {b.dauer === 'leibrente' && (
                    <Field label="Barwert (CHF)" hint="Art. 92 Abs. 2 ZPO — ohne Eingabe setzt das Gericht fest">
                      <BetragsFeld value={b.barwert} onChange={(v) => setFeld(i, { barwert: v })} className={inputCls}
                        placeholder="versicherungsmathematischer Barwert" aria-label={`Barwert Begehren ${i + 1}`} />
                    </Field>
                  )}
                </>
              )}
              {b.typ === 'unbeziffert' && (
                <p className="text-body-s text-ink-500 self-center">
                  Forderung unbestimmter Höhe, Gestaltungs-/Naturalleistung oder Verbandsklage (Art. 94a ZPO) — das Gericht setzt den Streitwert fest.
                </p>
              )}
            </div>
          )}
        />
        {begehren.length > 1 && (
          <Checkbox checked={ausschliessend} onChange={setAusschliessend}
            label="die Begehren schliessen sich gegenseitig aus (kein Zusammenrechnen, Art. 93 ZPO)" />
        )}
      </div>

      {/* Widerklage — LM-080 (B19): pl-3 gleicht die linke Feldkante an die
          Begehren-Unterkarte an (ListenEditor → `.lc-panel p-3`, geteilter
          Baustein `vorlagen/ui.tsx` unverändert); ohne die Angleichung stand
          diese Zeile rund 13 px weiter links als die Felder in «Begehren 1». */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-3">
        <Field label="Widerklage (CHF)" hint="leer lassen, wenn keine Widerklage (Art. 94 ZPO)">
          <BetragsFeld value={widerklageRoh} onChange={setWiderklageRoh} className={inputCls}
            placeholder="Streitwert der Widerklage" aria-label="Streitwert der Widerklage" />
        </Field>
        {widerklageRoh.trim() !== '' && (
          <Field label="Weichen zur Widerklage">
            <div className="space-y-2">
              <Checkbox checked={wkSchliesstAus} onChange={setWkSchliesstAus}
                label="Klage und Widerklage schliessen sich gegenseitig aus (Art. 94 Abs. 2 ZPO)" />
              <Checkbox checked={teilklage} onChange={setTeilklage}
                label="die Hauptklage ist eine Teilklage (Kosten nur nach Hauptklage, Art. 94 Abs. 3 ZPO)" />
            </div>
          </Field>
        )}
      </div>

      {fehler && <FehlerBox fehler={[fehler]} />}

      {/* W2·10-UI-NAV/N0d·W1, seit QS-UI 8b als geteilter Baustein (vorlagen/ui). */}
      {!ergebnis && !fehler && (
        <ErgebnisPlatzhalter was={<>
          Forderungsbetrag eingeben — hier erscheinen Streitwert, Verfahrensart
          (Art. 243 ZPO) und der BGG-Abgleich.
        </>} />
      )}

      {ergebnis && (
        <ErgebnisBlock>
          {/* Finder-6 A2 (5.9.2026): einziger ErgebnisAnzeige-Rechner ohne Eckdaten-
              Kachelreihe vor dem Verdikt (R4 Ziff. 1) — an das Muster der anderen
              angeglichen (z. B. VerzugszinsForm). Nur bei berechenbarem Streitwert
              (Ermessensfälle bleiben Fliesstext im Verdikt, kein Kachel-«null»). */}
          {ergebnis.streitwertVerfahrenCHF != null && (
            <div className={ergebnis.kostenBasisCHF != null && ergebnis.kostenBasisCHF !== ergebnis.streitwertVerfahrenCHF
              ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'grid grid-cols-1 gap-3'}>
              <EckdatenKachel label="Streitwert (Verfahren/Rechtsmittel)" wert={chfPraefix(ergebnis.streitwertVerfahrenCHF)} num akzent />
              {ergebnis.kostenBasisCHF != null && ergebnis.kostenBasisCHF !== ergebnis.streitwertVerfahrenCHF && (
                <EckdatenKachel label="Kosten-Bemessungsgrundlage (Art. 94 ZPO)" wert={chfPraefix(ergebnis.kostenBasisCHF)} num />
              )}
            </div>
          )}
          <ErgebnisAnzeige titel="Streitwert (Art. 91–94a ZPO)" ergebnis={ergebnis} />

          {/* Grenzwert-Abgleich (#2): ZPO-Verfahrensart ≠ BGG-Beschwerde-Schwelle,
              strikt getrennt. Die Gebiets-Gabelung betrifft NUR die BGG-Grenze. */}
          <section className="space-y-3 border-t border-line pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="lc-overline">Grenzwert-Abgleich</p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-ink-500">Gebiet (für BGG):</span>
                {/* B3-4/A3-5 (R3-α, 31.8.2026): eigene Pillen-Anatomie
                    (`rounded-sm px-2 py-0.5` = 18 px hoch, unter WCAG 2.5.8)
                    → die Pillen-Variante des EINEN Bausteins, die ihre
                    Trefferfläche über ein unsichtbares `::after` auf
                    `--tap-ziel-komfort` hebt, ohne breiter zu zeichnen. */}
                <SelectionGrid
                  className="flex items-center gap-2" gruppenLabel="Gebiet (für BGG)"
                  variant="pille"
                  items={[
                    { code: 'uebrige', label: 'übrige' },
                    { code: 'miete_arbeit', label: 'Miete/Arbeit' },
                  ] as const}
                  value={gebiet} onSelect={setGebiet} />
              </div>
            </div>
            {streitwertGrenzwerte(ergebnis.streitwertVerfahrenCHF, gebiet).map((g) => (
              <div key={g.regime} className="lc-tile space-y-1">
                <p className="text-body-s font-medium text-ink-900">{g.titel}</p>
                <p className="text-body-s text-ink-700 leading-relaxed">{g.aussage}</p>
                {g.selbstPruefen.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-ink-500 leading-relaxed">
                    {g.selbstPruefen.map((s, i) => (
                      <li key={i}>· selbst prüfen: {s}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>

          <BegruendungSlot ergebnis={ergebnis} />
          <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
            query={() => permalinkKodieren(SW_LINK_SPEC, {
              begehren, ausschliessend, widerklage: zahl(widerklageRoh), wkSchliesstAus, teilklage,
            })} />
        </ErgebnisBlock>
      )}
    </div>
    </BeruehrtRahmen>
  );
}
