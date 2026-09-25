import { Field, inputCls, ListenEditor } from '../../components/vorlagen/ui';
import { BetragsFeld } from '../../components/BetragsFeld';
import { DatumsFeld } from '../../components/DatumsFeld';
import { usePaneKlasse } from '../../components/layout/PaneKontext';
import { NormText } from '../../components/NormText';
import { AG_FREMDWAEHRUNGEN } from '../../lib/vorlagen/gruendungAgDokumente';
import type { AgWaehrung, AgSacheinlageZeile } from '../../lib/vorlagen/gruendungAgDokumente';
import type { AgSchrittCtx } from './ctx';

export function SchrittKapital({ ctx }: { ctx: AgSchrittCtx }) {
  const {
    fremdwaehrung, waehrung, setWaehrung, ak, setAk, anzahl, setAnzahl,
    nennwert, setNennwert, liberierung, setLiberierung, ausgabebetrag, setAusgabebetrag,
    kursChf, setKursChf, kursQuelle, setKursQuelle, bankInUrkunde, einlageArt,
    bankName, setBankName, bankOrt, setBankOrt, sacheinlagen, setSacheinlagen,
    wc, neuerKey, verrechnungen, setVerrechnungen, besondereVorteile, vorteile, setVorteile,
    revisorName, setRevisorName,
  } = ctx;
  const pk = usePaneKlasse();
  return (
    <div className="space-y-4">
      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
        <Field label={fremdwaehrung ? `Aktienkapital (${waehrung}; Gegenwert mind. CHF 100'000)` : "Aktienkapital (CHF, mind. 100'000)"}>
          <BetragsFeld className={inputCls} placeholder="z. B. 100'000" value={ak} onChange={setAk} />
        </Field>
        <Field label="Anzahl Namenaktien">
          <input className={inputCls} inputMode="numeric" value={anzahl} onChange={(e) => setAnzahl(e.target.value)} />
        </Field>
        <Field label="Nennwert je Aktie">
          <BetragsFeld className={inputCls} value={nennwert} onChange={setNennwert} />
        </Field>
        <Field label="Liberierung (%, 20–100; einbezahlt mind. CHF 50'000)">
          <input className={inputCls} inputMode="numeric" value={liberierung} onChange={(e) => setLiberierung(e.target.value)} />
        </Field>
        <Field label="Ausgabebetrag je Aktie (leer = Nennwert; ein Agio ist stets voll zu leisten)">
          <BetragsFeld className={inputCls} value={ausgabebetrag} onChange={setAusgabebetrag} placeholder="z. B. 1'200" />
        </Field>
      </div>

      {fremdwaehrung && (
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label="Währung des Aktienkapitals (Anhang 3 HRegV)">
            <select className={inputCls} value={waehrung} onChange={(e) => setWaehrung(e.target.value as AgWaehrung)}>
              {AG_FREMDWAEHRUNGEN.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="Umrechnungskurs (1 Einheit = X CHF; Art. 629 Abs. 3 OR)">
            <input className={inputCls} inputMode="decimal" value={kursChf} onChange={(e) => setKursChf(e.target.value)} placeholder="z. B. 0.93" />
          </Field>
          <Field label="Quelle des Devisenmittelkurses (Bank)">
            <input className={inputCls} value={kursQuelle} onChange={(e) => setKursQuelle(e.target.value)} placeholder="z. B. Zürcher Kantonalbank" />
          </Field>
        </div>
      )}

      {bankInUrkunde && (einlageArt === 'bar' || einlageArt === 'gemischt') && (
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Bank (in der Urkunde genannt)">
            <input className={inputCls} value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </Field>
          <Field label="Bank-Ort">
            <input className={inputCls} value={bankOrt} onChange={(e) => setBankOrt(e.target.value)} />
          </Field>
        </div>
      )}

      {/* Etappe 2: Sacheinlagen (Art. 634 OR) */}
      {(einlageArt === 'sacheinlage' || einlageArt === 'gemischt') && (
        <div className="space-y-3">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Sacheinlagen (Art. 634 OR)`} /></p>
          <p className="text-body-s text-ink-500 max-w-reading-s">
            Deckungs-Voraussetzungen (Art. 634 Abs. 1 OR): als Aktiven bilanzierbar, übertragbar,
            nach dem Eintrag sofort frei verfügbar (bei Grundstücken: bedingungsloser
            Grundbuch-Anspruch) und durch Übertragung auf Dritte verwertbar.
          </p>
          {/* R2-F/F1-9: die drei Repeater dieses Schritts trugen einen
              handgebauten `rounded-md border border-line p-3` als Behälter,
              «✕» im `lc-btn-ghost lc-btn-sm` als Entfernen und
              «+ … hinzufügen» als Knopf. Alle drei Formen kommen neu aus dem
              geteilten ListenEditor (lc-panel · «entfernen» · «+ <Element>»). */}
          <ListenEditor
            element="Sacheinlage"
            eintraege={sacheinlagen}
            className="space-y-2"
            schluessel={(s) => s.key}
            onHinzufuegen={() => setSacheinlagen((alt) => [...alt, {
              key: neuerKey(), typ: 'sachgesamtheit', bezeichnung: '', belegDatum: '', wertChf: '',
              grundstueck: false, einlegerName: '', aktienAnzahl: '', gutschriftChf: '', zustand: '',
              imHrEingetragen: false, cheNr: '', aktivenChf: '', passivenChf: '', rueckwirkungDatum: '',
            }])}
            onEntfernen={(i) => setSacheinlagen((alt) => alt.filter((_, j) => j !== i))}
            kinder={(s) => (
            <div className="space-y-2">
              <div className={pk('grid grid-cols-1 sm:grid-cols-[1fr_2fr_2fr] gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-[1fr_2fr_2fr] gap-2 items-end')}>
                <Field label="Art der Einlage">
                  <select className={inputCls} value={s.typ}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, typ: e.target.value as AgSacheinlageZeile['typ'] } : x))}>
                    <option value="sachgesamtheit">Sachgesamtheit (Inventarliste)</option>
                    <option value="geschaeft">Einzelunternehmen (Übernahmebilanz)</option>
                  </select>
                </Field>
                <Field label={s.typ === 'geschaeft' ? 'Firma des Einzelunternehmens' : 'Gegenstand (Umfang der Sacheinlage)'}>
                  <input className={inputCls} value={s.bezeichnung}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, bezeichnung: e.target.value } : x))} />
                </Field>
                <Field label="Einleger:in (Name)">
                  <input className={inputCls} value={s.einlegerName}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, einlegerName: e.target.value } : x))} />
                </Field>
              </div>
              <div className={pk('grid grid-cols-1 sm:grid-cols-4 gap-2 items-end', 'grid grid-cols-1 @3xl/pane:grid-cols-4 gap-2 items-end')}>
                <Field label={`Bewertung (${wc})`}>
                  <BetragsFeld className={inputCls} value={s.wertChf}
                    onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, wertChf: v } : x))} />
                </Field>
                <Field label="Dafür ausgegebene Aktien">
                  <input className={inputCls} inputMode="numeric" value={s.aktienAnzahl}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, aktienAnzahl: e.target.value } : x))} />
                </Field>
                <Field label={`Gutschrift (${wc})`} optional>
                  <BetragsFeld className={inputCls} value={s.gutschriftChf}
                    onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, gutschriftChf: v } : x))} />
                </Field>
                <Field label={s.typ === 'geschaeft' ? 'Übernahmebilanz per' : 'Inventarliste vom'}>
                  <DatumsFeld value={s.belegDatum} className={inputCls}
                    onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, belegDatum: v } : x))} />
                </Field>
              </div>
              {s.typ === 'geschaeft' && (
                <div className={pk('grid grid-cols-1 sm:grid-cols-5 gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-5 gap-2 items-end')}>
                  <label className="flex items-center gap-2 text-body-s text-ink-700 pb-2">
                    <input type="checkbox" checked={s.imHrEingetragen}
                      onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, imHrEingetragen: e.target.checked } : x))} />
                    im HR eingetragen
                  </label>
                  <Field label="UID (CHE-…)" optional>
                    <input className={inputCls} value={s.cheNr}
                      onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, cheNr: e.target.value } : x))} />
                  </Field>
                  <Field label={`Aktiven (${wc})`}>
                    <BetragsFeld className={inputCls} value={s.aktivenChf}
                      onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, aktivenChf: v } : x))} />
                  </Field>
                  <Field label={`Passiven (${wc})`}>
                    <BetragsFeld className={inputCls} value={s.passivenChf}
                      onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, passivenChf: v } : x))} />
                  </Field>
                  <Field label="Rechtsgeschäfte gelten ab (Rückwirkung)">
                    <DatumsFeld value={s.rueckwirkungDatum} className={inputCls}
                      onChange={(v) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, rueckwirkungDatum: v } : x))} />
                  </Field>
                </div>
              )}
              <div className={pk('grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-2 items-start', 'grid grid-cols-1 @lg/pane:grid-cols-[auto_1fr] gap-2 items-start')}>
                <label className="flex items-center gap-2 text-body-s text-ink-700 pt-2">
                  <input type="checkbox" checked={s.grundstueck}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, grundstueck: e.target.checked } : x))} />
                  Grundstück enthalten (Vertrag wird öffentlich beurkundet, Art. 657 ZGB — Export nur als Entwurf)
                </label>
                <Field label="Zustand der Sacheinlage (für den Gründungsbericht; bei Geschäft: Würdigung je Bilanzposten)">
                  <textarea className={inputCls} rows={2} value={s.zustand}
                    onChange={(e) => setSacheinlagen((alt) => alt.map((x) => x.key === s.key ? { ...x, zustand: e.target.value } : x))} />
                </Field>
              </div>
            </div>
            )}
          />
        </div>
      )}

      {/* Etappe 2: Verrechnungsliberierung (Art. 634a OR) */}
      {(einlageArt === 'verrechnung' || einlageArt === 'gemischt') && (
        <div className="space-y-2">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Verrechnungsliberierung (Art. 634a OR)`} /></p>
          <ListenEditor
            element="Verrechnung"
            eintraege={verrechnungen}
            className="space-y-2"
            schluessel={(v) => v.key}
            onHinzufuegen={() => setVerrechnungen((alt) => [...alt, { key: neuerKey(), glaeubigerName: '', forderungChf: '', aktienAnzahl: '', begruendungTxt: '' }])}
            onEntfernen={(i) => setVerrechnungen((alt) => alt.filter((_, j) => j !== i))}
            kinder={(v) => (
              <div className="space-y-2">
                <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-[2fr_1fr_1fr] gap-2 items-end')}>
                  <Field label="Gläubiger:in (Name)">
                    <input className={inputCls} value={v.glaeubigerName}
                      onChange={(e) => setVerrechnungen((alt) => alt.map((x) => x.key === v.key ? { ...x, glaeubigerName: e.target.value } : x))} />
                  </Field>
                  <Field label={`Forderung (${wc})`}>
                    <BetragsFeld className={inputCls} value={v.forderungChf}
                      onChange={(w) => setVerrechnungen((alt) => alt.map((x) => x.key === v.key ? { ...x, forderungChf: w } : x))} />
                  </Field>
                  <Field label="Aktien">
                    <input className={inputCls} inputMode="numeric" value={v.aktienAnzahl}
                      onChange={(e) => setVerrechnungen((alt) => alt.map((x) => x.key === v.key ? { ...x, aktienAnzahl: e.target.value } : x))} />
                  </Field>
                </div>
                <Field label="Bestand und Verrechenbarkeit der Forderung (für den Gründungsbericht, Art. 635 Ziff. 2 OR)">
                  <textarea className={inputCls} rows={2} value={v.begruendungTxt}
                    onChange={(e) => setVerrechnungen((alt) => alt.map((x) => x.key === v.key ? { ...x, begruendungTxt: e.target.value } : x))} />
                </Field>
              </div>
            )}
          />
        </div>
      )}

      {/* Etappe 2: Besondere Vorteile (Art. 636 OR) */}
      {besondereVorteile && (
        <div className="space-y-2">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Besondere Vorteile (Art. 636 OR)`} /></p>
          <ListenEditor
            element="Vorteil"
            eintraege={vorteile}
            className="space-y-2"
            schluessel={(v) => v.key}
            onHinzufuegen={() => setVorteile((alt) => [...alt, { key: neuerKey(), beguenstigter: '', inhalt: '', wertChf: '', begruendungTxt: '' }])}
            onEntfernen={(i) => setVorteile((alt) => alt.filter((_, j) => j !== i))}
            kinder={(v) => (
              <div className="space-y-2">
                <div className={pk('grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-2 items-end', 'grid grid-cols-1 @4xl/pane:grid-cols-[2fr_1fr] gap-2 items-end')}>
                  <Field label="Begünstigte:r (Name)">
                    <input className={inputCls} value={v.beguenstigter}
                      onChange={(e) => setVorteile((alt) => alt.map((x) => x.key === v.key ? { ...x, beguenstigter: e.target.value } : x))} />
                  </Field>
                  <Field label={`Wert (${wc})`}>
                    <BetragsFeld className={inputCls} value={v.wertChf}
                      onChange={(w) => setVorteile((alt) => alt.map((x) => x.key === v.key ? { ...x, wertChf: w } : x))} />
                  </Field>
                </div>
                <Field label="Inhalt des Vorteils (Statuten-Pflichtinhalt, Art. 636 OR)">
                  <textarea className={inputCls} rows={2} value={v.inhalt}
                    onChange={(e) => setVorteile((alt) => alt.map((x) => x.key === v.key ? { ...x, inhalt: e.target.value } : x))} />
                </Field>
                <Field label="Begründung und Angemessenheit (für den Gründungsbericht, Art. 635 Ziff. 3 OR)">
                  <textarea className={inputCls} rows={2} value={v.begruendungTxt}
                    onChange={(e) => setVorteile((alt) => alt.map((x) => x.key === v.key ? { ...x, begruendungTxt: e.target.value } : x))} />
                </Field>
              </div>
            )}
          />
        </div>
      )}

      {(einlageArt !== 'bar' || besondereVorteile) && (
        <Field label="Zugelassene:r Revisor:in der Prüfungsbestätigung (Art. 635a OR; leer = Blanko)">
          <input className={inputCls} value={revisorName} onChange={(e) => setRevisorName(e.target.value)} />
        </Field>
      )}
    </div>
  );
}
