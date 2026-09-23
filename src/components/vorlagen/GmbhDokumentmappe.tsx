import { useMemo, useRef, useState } from 'react';
import { NormText } from '../NormText';
import { BetragsFeld } from '../BetragsFeld';
import { DatumsFeld } from '../DatumsFeld';
import { Checkbox, Field, inputCls, ListenEditor } from './ui';
import { MappenAbschnitt, MappenAnsicht, MappenGates, NotariatsHinweis } from './Dokumentmappe';
import type { PdfBanner } from '../../lib/vorlagen/banner';
import type { GmbhGruendungEingaben } from '../../lib/gruendungsunterlagen';
import {
  gmbhDokumentmappe,
  GMBH_DOK_DEFAULTS,
  type GmbhDokAntworten,
  type GmbhGruenderZeile,
  type GmbhGfZeile,
  type GmbhVertretungsZeile,
  type GmbhZeichnungsArt,
} from '../../lib/vorlagen/gruendungGmbhDokumente';
import { KANTONE } from '../../lib/kantone';
import { getStandardKanton } from '../../lib/einstellungen';
import { usePaneKlasse } from '../layout/PaneKontext';

// ─── Dokumentmappe der GmbH-Gründung (Plan 9b Ausbaustufe, 7.6.2026) ─────────
// Darstellung + Eingabesammlung; sämtliche Rechtslogik (Gates, Schemas,
// Dokument-Auswahl) lebt in lib/vorlagen/gruendungGmbhDokumente.ts (§3).
// Die Weichen (Opting-out, c/o, Bank …) kommen vom Checklisten-Teil der
// Seite – EINE Quelle für Checkliste und Dokumente (§5).

const BANNER_ENTWURF: PdfBanner = {
  titel: 'ENTWURF – KEIN GÜLTIGES DOKUMENT',
  text: 'Vorbereitung für die Urkundsperson: Die Statuten werden notariell beglaubigt (Art. 22 Abs. 4 HRegV), der Errichtungsakt öffentlich beurkundet (Art. 777 Abs. 1 OR).',
};
const ZEICHNUNGS_OPTIONEN: { id: GmbhZeichnungsArt; label: string }[] = [
  { id: 'einzelunterschrift', label: 'Einzelunterschrift' },
  { id: 'kollektivzuzweien', label: 'Kollektivunterschrift zu zweien' },
];

export function GmbhDokumentmappe({ weichen, docxErlaubt, start }: {
  weichen: GmbhGruendungEingaben;
  docxErlaubt: boolean;
  /** V5 (W2·29-WERKBANK-VORLAGEN): Anfangswerte (Musterdaten). Die Seite
   *  remountet die Mappe per `key`, damit der neue Stand greift. */
  start?: GmbhDokAntworten;
}) {
  // Stabile Listen-Keys (Voll-Audit 5.6.: keine Index-Keys in Editoren).
  // Start-Zeilen tragen je Liste 1…n; der Zähler beginnt oberhalb der
  // längsten Start-Liste (Muster wie der AG-Wizard) — kollisionsfrei.
  const naechsterKey = useRef(1 + Math.max(0,
    ...[start?.gruender, start?.geschaeftsfuehrer, start?.weitereVertretungen].map((l) => l?.length ?? 0)));
  const neuerKey = () => naechsterKey.current++;
  const mitKeys = <Z,>(l: Z[] | undefined) => (l ?? []).map((z, i) => ({ ...z, key: i + 1 }));
  // Identität & Parameter (Weichen kommen als Props von der Checkliste)
  const [firma, setFirma] = useState(start?.firma ?? '');
  const [sitz, setSitz] = useState(start?.sitz ?? '');
  const [kanton, setKanton] = useState<string>(start?.kanton ?? getStandardKanton);
  const [zweck, setZweck] = useState(start?.zweck ?? '');
  const [zweckErweiterung, setZweckErweiterung] = useState(start?.zweckErweiterung ?? true);
  const [stammkapital, setStammkapital] = useState(start?.stammkapitalChf ?? GMBH_DOK_DEFAULTS.stammkapitalChf);
  const [anzahl, setAnzahl] = useState(start?.anzahlAnteile ?? GMBH_DOK_DEFAULTS.anzahlAnteile);
  const [nennwert, setNennwert] = useState(start?.nennwertChf ?? GMBH_DOK_DEFAULTS.nennwertChf);
  const [gruender, setGruender] = useState<(GmbhGruenderZeile & { key: number })[]>(() => mitKeys(start?.gruender));
  const [gfs, setGfs] = useState<(GmbhGfZeile & { key: number })[]>(() => mitKeys(start?.geschaeftsfuehrer));
  const [vertretungen, setVertretungen] = useState<(GmbhVertretungsZeile & { key: number })[]>(() => mitKeys(start?.weitereVertretungen));
  const [bankName, setBankName] = useState(start?.bankName ?? '');
  const [bankOrt, setBankOrt] = useState(start?.bankOrt ?? '');
  const [rechtsdomizil, setRechtsdomizil] = useState(start?.rechtsdomizilAdresse ?? '');
  const [domizilhalterName, setDomizilhalterName] = useState(start?.domizilhalterName ?? '');
  const [domizilhalterAdresse, setDomizilhalterAdresse] = useState(start?.domizilhalterAdresse ?? '');
  const [rsName, setRsName] = useState(start?.revisionsstelleName ?? '');
  const [rsSitz, setRsSitz] = useState(start?.revisionsstelleSitz ?? '');
  const [nachschussBetrag, setNachschussBetrag] = useState(start?.nachschussBetragChf ?? '');
  const [nebenleistung, setNebenleistung] = useState(start?.nebenleistungText ?? '');
  const [konkurrenzBefreiung, setKonkurrenzBefreiung] = useState<'alleGesellschafter' | 'gv'>(start?.konkurrenzBefreiung ?? 'alleGesellschafter');
  const [vetoBeschluesse, setVetoBeschluesse] = useState(start?.vetoBeschluesse ?? '');
  const [virtuelleGv, setVirtuelleGv] = useState(start?.virtuelleGv ?? false);
  const [ort, setOrt] = useState(start?.ort ?? '');
  const [datum, setDatum] = useState(start?.datum ?? '');

  const pk = usePaneKlasse();

  const antworten: GmbhDokAntworten = useMemo(() => ({
    ...weichen,
    ...GMBH_DOK_DEFAULTS,
    firma, sitz, kanton, zweck, zweckErweiterung,
    stammkapitalChf: stammkapital, anzahlAnteile: anzahl, nennwertChf: nennwert,
    gruender, geschaeftsfuehrer: gfs, weitereVertretungen: vertretungen,
    bankName, bankOrt, rechtsdomizilAdresse: rechtsdomizil,
    domizilhalterName, domizilhalterAdresse,
    revisionsstelleName: rsName, revisionsstelleSitz: rsSitz,
    nachschussBetragChf: nachschussBetrag, nebenleistungText: nebenleistung,
    konkurrenzBefreiung, vetoBeschluesse, virtuelleGv, ort, datum,
    // Konsistenz zur Checkliste: «mehrere GF» folgt aus der Liste
    mehrereGeschaeftsfuehrer: gfs.filter((g) => g.name.trim()).length > 1,
    weitereVertretungsberechtigte: weichen.weitereVertretungsberechtigte,
  }), [weichen, firma, sitz, kanton, zweck, zweckErweiterung, stammkapital, anzahl, nennwert,
    gruender, gfs, vertretungen, bankName, bankOrt, rechtsdomizil, domizilhalterName,
    domizilhalterAdresse, rsName, rsSitz, nachschussBetrag, nebenleistung,
    konkurrenzBefreiung, vetoBeschluesse, virtuelleGv, ort, datum]);

  const mappe = useMemo(() => gmbhDokumentmappe(antworten), [antworten]);

  const k = antworten.statutKlauseln;

  return (
    <MappenAbschnitt className="space-y-5">
      <div>
        <p className="lc-overline">Dokumentmappe – Volldokumente (Bargründung)</p>
        <p className="text-body-s text-ink-500 max-w-reading">
          Erzeugt aus denselben Weichen wie die Checkliste: Statuten und Errichtungsakt als
          ENTWURF für die Urkundsperson (öffentliche Beurkundung bleibt zwingend, Art. 777 OR),
          die beurkundungsfreien Erklärungen und die Handelsregister-Anmeldung druckfertig.
          Eingaben verlassen den Browser nicht; keine Speicherung.
        </p>
      </div>

      {/* Gesellschaft */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
        <Field label="Firma (mit Zusatz «GmbH», Art. 950 OR)">
          <input className={inputCls} value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="z. B. Muster Treuhand GmbH" />
        </Field>
        <Field label="Sitz (politische Gemeinde)">
          <input className={inputCls} value={sitz} onChange={(e) => setSitz(e.target.value)} placeholder="z. B. Zürich" />
        </Field>
        <Field label="Kanton (Handelsregisteramt)">
          <select className={inputCls} value={kanton} onChange={(e) => setKanton(e.target.value)}>
            {KANTONE.map((kt) => <option key={kt} value={kt}>{kt}</option>)}
          </select>
        </Field>
      </div>
      <NotariatsHinweis kanton={kanton} />

      <Field label="Zweck">
        <textarea className={inputCls} rows={2} value={zweck} onChange={(e) => setZweck(e.target.value)}
          placeholder="z. B. die Erbringung von Treuhand- und Beratungsdienstleistungen" />
      </Field>
      <Checkbox
        checked={zweckErweiterung}
        onChange={setZweckErweiterung}
        label="Übliche Zweck-Erweiterungsklausel (Zweigniederlassungen, Beteiligungen, Grundstücke, Finanzierungen)"
      />
      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
        <Field label="Stammkapital (CHF, mind. 20'000)">
          {/* R2-E/F1-7: CHF-Beträge tragen das Haus-BetragsFeld (Tausender-
              Apostroph beim Tippen). Nach aussen fliesst der bereinigte Rohwert
              — `zahl()`/`fmtCHF()` normalisieren ohnehin, der Vertrag zum
              Schema bleibt also unverändert. Der Apostroph-Hinweis im
              Platzhalter entfällt, weil das Feld ihn selbst setzt. */}
          <BetragsFeld className={inputCls} placeholder="z. B. 20'000" value={stammkapital} onChange={setStammkapital} />
        </Field>
        <Field label="Anzahl Stammanteile">
          <input className={inputCls} inputMode="numeric" value={anzahl} onChange={(e) => setAnzahl(e.target.value)} />
        </Field>
        <Field label="Nennwert je Anteil (CHF, über null)">
          <BetragsFeld className={inputCls} placeholder="z. B. 1'000" value={nennwert} onChange={setNennwert} />
        </Field>
      </div>

      {/* Gründer */}
      <div className="space-y-2">
        <p className="text-body-s font-medium text-ink-900"><NormText text={`Gründer:innen und Zeichnung (Art. 777a OR)`} /></p>
        {/* R2-F/F1-9: die drei Repeater dieser Mappe trugen ein «✕» im
            `lc-btn-ghost lc-btn-sm` als Entfernen (vierte Grid-Spalte) und
            «+ … hinzufügen» als Beschriftung. Kanon ist der ListenEditor:
            lc-panel je Zeile, «entfernen» als Text-Link mit Nummer im
            aria-label, «+ <Element>». Die stabilen `key` bleiben — sie sind
            der React-Schlüssel UND die Identität beim Entfernen. */}
        <ListenEditor
          element="Gründer:in"
          eintraege={gruender}
          className="space-y-2"
          schluessel={(g) => g.key}
          onHinzufuegen={() => setGruender((alt) => [...alt, { key: neuerKey(), name: '', angaben: '', anzahl: '' }])}
          onEntfernen={(i) => setGruender((alt) => alt.filter((_, j) => j !== i))}
          kinder={(g) => (
            <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_3fr_1fr] gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-[2fr_3fr_1fr] gap-2 items-end')}>
              <Field label="Name">
                <input className={inputCls} value={g.name}
                  onChange={(e) => setGruender((alt) => alt.map((x) => x.key === g.key ? { ...x, name: e.target.value } : x))} />
              </Field>
              <Field label="Angaben (z. B. «von Basel, in Zürich, Musterweg 1»)">
                <input className={inputCls} value={g.angaben}
                  onChange={(e) => setGruender((alt) => alt.map((x) => x.key === g.key ? { ...x, angaben: e.target.value } : x))} />
              </Field>
              <Field label="Anteile">
                <input className={inputCls} inputMode="numeric" value={g.anzahl}
                  onChange={(e) => setGruender((alt) => alt.map((x) => x.key === g.key ? { ...x, anzahl: e.target.value } : x))} />
              </Field>
            </div>
          )}
        />
      </div>

      {/* Geschäftsführung */}
      <div className="space-y-2">
        <p className="text-body-s font-medium text-ink-900"><NormText text={`Geschäftsführung (Art. 809 OR; nur natürliche Personen)`} /></p>
        <ListenEditor
          element="Geschäftsführer:in"
          eintraege={gfs}
          className="space-y-2"
          schluessel={(g) => g.key}
          onHinzufuegen={() => setGfs((alt) => [...alt, { key: neuerKey(), name: '', herkunft: '', wohnort: '', adresse: '', vorsitz: alt.length === 0, zeichnungsArt: 'einzelunterschrift' }])}
          onEntfernen={(i) => setGfs((alt) => alt.filter((_, j) => j !== i))}
          kinder={(g) => (
            <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-2 items-end', 'grid grid-cols-1 @5xl/pane:grid-cols-[2fr_1fr_1fr_2fr_1fr_auto] gap-2 items-end')}>
              <Field label="Name">
                <input className={inputCls} value={g.name}
                  onChange={(e) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, name: e.target.value } : x))} />
              </Field>
              <Field label="Heimatort / Staat">
                <input className={inputCls} value={g.herkunft}
                  onChange={(e) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, herkunft: e.target.value } : x))} />
              </Field>
              <Field label="Wohnort">
                <input className={inputCls} value={g.wohnort}
                  onChange={(e) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, wohnort: e.target.value } : x))} />
              </Field>
              <Field label="Adresse (für die Wahlannahme)">
                <input className={inputCls} value={g.adresse}
                  onChange={(e) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, adresse: e.target.value } : x))} />
              </Field>
              <Field label="Zeichnung">
                <select className={inputCls} value={g.zeichnungsArt}
                  onChange={(e) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, zeichnungsArt: e.target.value as GmbhZeichnungsArt } : x))}>
                  {ZEICHNUNGS_OPTIONEN.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Checkbox
                checked={g.vorsitz}
                onChange={(v) => setGfs((alt) => alt.map((x) => x.key === g.key ? { ...x, vorsitz: v } : x))}
                label="Vorsitz"
                className="pb-2"
              />
            </div>
          )}
        />
      </div>

      {/* Weitere Vertretungsberechtigte (nur bei lit.-f-Weiche) */}
      {weichen.weitereVertretungsberechtigte && (
        <div className="space-y-2">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Weitere Vertretungsberechtigte (Art. 71 Abs. 1 lit. f HRegV)`} /></p>
          <ListenEditor
            element="Person"
            eintraege={vertretungen}
            className="space-y-2"
            schluessel={(v) => v.key}
            onHinzufuegen={() => setVertretungen((alt) => [...alt, { key: neuerKey(), name: '', funktion: '', zeichnungsArt: 'einzelunterschrift' }])}
            onEntfernen={(i) => setVertretungen((alt) => alt.filter((_, j) => j !== i))}
            kinder={(v) => (
              <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_2fr_2fr] gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-[2fr_2fr_2fr] gap-2 items-end')}>
                <Field label="Name">
                  <input className={inputCls} value={v.name}
                    onChange={(e) => setVertretungen((alt) => alt.map((x) => x.key === v.key ? { ...x, name: e.target.value } : x))} />
                </Field>
                <Field label="Funktion (z. B. Direktorin, Prokurist)">
                  <input className={inputCls} value={v.funktion}
                    onChange={(e) => setVertretungen((alt) => alt.map((x) => x.key === v.key ? { ...x, funktion: e.target.value } : x))} />
                </Field>
                <Field label="Zeichnung">
                  <select className={inputCls} value={v.zeichnungsArt}
                    onChange={(e) => setVertretungen((alt) => alt.map((x) => x.key === v.key ? { ...x, zeichnungsArt: e.target.value as GmbhZeichnungsArt } : x))}>
                    {ZEICHNUNGS_OPTIONEN.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </Field>
              </div>
            )}
          />
        </div>
      )}

      {/* Kontext-Angaben aus den Weichen */}
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        {weichen.bankInUrkundeGenannt && weichen.einlageArt === 'bar' && (
          <>
            <Field label="Bank (in der Urkunde genannt)">
              <input className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="z. B. Zürcher Kantonalbank" />
            </Field>
            <Field label="Bank-Ort">
              <input className={inputCls} value={bankOrt} onChange={(e) => setBankOrt(e.target.value)} placeholder="z. B. Zürich" />
            </Field>
          </>
        )}
        {weichen.eigeneBueros ? (
          <Field label="Rechtsdomizil (Adresse am Sitz)">
            <input className={inputCls} value={rechtsdomizil} onChange={(e) => setRechtsdomizil(e.target.value)} placeholder="Strasse, PLZ Ort" />
          </Field>
        ) : (
          <>
            <Field label="Domizilhalter:in (c/o)">
              <input className={inputCls} value={domizilhalterName} onChange={(e) => setDomizilhalterName(e.target.value)} />
            </Field>
            <Field label="Adresse Domizilhalter:in">
              <input className={inputCls} value={domizilhalterAdresse} onChange={(e) => setDomizilhalterAdresse(e.target.value)} />
            </Field>
          </>
        )}
        {!weichen.optingOut && (
          <>
            <Field label="Revisionsstelle (Name)">
              <input className={inputCls} value={rsName} onChange={(e) => setRsName(e.target.value)} />
            </Field>
            <Field label="Revisionsstelle (Sitz)">
              <input className={inputCls} value={rsSitz} onChange={(e) => setRsSitz(e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Ort (Unterschriften)">
          <input className={inputCls} value={ort} onChange={(e) => setOrt(e.target.value)} />
        </Field>
        <Field label="Datum">
          {/* R2-E/F1-1: DatumsFeld statt nativem type="date" (TT.MM.JJJJ statt
              Browser-Locale); Wert bleibt ISO, das Schema sieht dasselbe. */}
          <DatumsFeld value={datum} onChange={setDatum} className={inputCls} />
        </Field>
      </div>

      {/* Parameter der gewählten Statutenklauseln */}
      {(k.includes('nachschuss') || k.includes('nebenleistung') || k.includes('konkurrenzverbot') || k.includes('vetorecht')) && (
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          {k.includes('nachschuss') && (
            <Field label="Nachschuss je Stammanteil (CHF, max. 2 × Nennwert)">
              <BetragsFeld className={inputCls} value={nachschussBetrag} onChange={setNachschussBetrag} />
            </Field>
          )}
          {k.includes('konkurrenzverbot') && (
            <Field label="Befreiung vom Konkurrenzverbot durch">
              <select className={inputCls} value={konkurrenzBefreiung} onChange={(e) => setKonkurrenzBefreiung(e.target.value as 'alleGesellschafter' | 'gv')}>
                <option value="alleGesellschafter">schriftliche Zustimmung aller übrigen Gesellschafter</option>
                <option value="gv">Zustimmung der Gesellschafterversammlung</option>
              </select>
            </Field>
          )}
          {k.includes('nebenleistung') && (
            <Field label="Nebenleistungspflicht (Gegenstand und Umfang, Art. 796 Abs. 3 OR)">
              <textarea className={inputCls} rows={2} value={nebenleistung} onChange={(e) => setNebenleistung(e.target.value)} />
            </Field>
          )}
          {k.includes('vetorecht') && (
            <Field label="Vetorecht: erfasste Beschlüsse (Art. 807 Abs. 1 OR)">
              <textarea className={inputCls} rows={2} value={vetoBeschluesse} onChange={(e) => setVetoBeschluesse(e.target.value)} />
            </Field>
          )}
        </div>
      )}
      <Checkbox
        checked={virtuelleGv}
        onChange={setVirtuelleGv}
        label="Statutarische Grundlage für virtuelle/hybride Gesellschafterversammlungen (Art. 805 Abs. 5 Ziff. 2bis OR)"
      />

      <MappenGates gates={mappe.gates} />

      <MappenAnsicht dokumente={mappe.dokumente} docxErlaubt={docxErlaubt}
        startDokId="statuten" bannerEntwurf={BANNER_ENTWURF} />
    </MappenAbschnitt>
  );
}
