
import { useEffect, useRef, type SetStateAction } from 'react';
import { NormText } from '../NormText';
import { BeruehrtRahmen, Checkbox, FehlerBox, Field, GruppenTitel, inputCls, Stepper } from '../vorlagen/ui';
import { SelectionGrid } from '../ui/SelectionGrid';
import { BetragsFeld } from '../BetragsFeld';
import { type Instanz } from './zustaendigkeitLinkSpecs';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { KANTONE } from '../../lib/kantone';
import type { Kanton } from '../../types/legal';

import { type MieteUnterfall, type Rechtsweg, type DeliktUnterfall, type PersoenlichkeitUnterfall, type IpUnterfall, type RmObjekt, type RmVerfahren, type RmVorinstanz } from '../../lib/zustaendigkeit';

import { PlzGemeindeWahl } from '../ui/PlzGemeindeWahl';
import { AdresseBundSuche } from '../ui/AdresseBundSuche';
import { usePaneKlasse } from '../layout/PaneKontext';

import { SchkgZustaendigkeitTeil } from './SchkgZustaendigkeitTeil';
import { StrafZustaendigkeitTeil } from './StrafZustaendigkeitTeil';
import { ZustErgebnisRechtsmittel } from './ZustErgebnisRechtsmittel';
import { ZustErgebnisEinleitung } from './ZustErgebnisEinleitung';

// ─── Zuständigkeitsrechner – UI (Umbau 5.6.2026, Entscheid David) ───────────
// Vier-Stufen-Führung: 1) RECHTSWEG (Zivil aktiv; SchKG/Straf/Verwaltung als
// ehrliche «in Vorbereitung»-Kacheln — eigene künftige Engines, §4) →
// 2) STREITSACHE (daraus folgt die Zuständigkeitslogik) → 3) ORT/STREITWERT/
// INSTANZ → 4) konkrete Behörde MIT Adresse + ART der Eingabe + Vorlagen-Sprung.
// Reine Darstellung (§3): Bundesrecht in lib/zustaendigkeit.ts, Kantonsdaten
// in data/zustaendigkeitKantone.ts.

import { DISCLAIMER, RECHTSWEGE, STREITSACHEN, DELIKT_UNTERFAELLE, PERSOENLICHKEIT_UNTERFAELLE, MIETE_UNTERFAELLE, ORT_LABEL } from './zustaendigkeitFormDaten';
import { useZustaendigkeitForm } from './useZustaendigkeitForm';
export function ZustaendigkeitForm({ onRechtswegChange, rechtswegVorwahl, minimal = false }: {
  onRechtswegChange?: (w: Rechtsweg) => void;
  /** Vorauswahl aus dem URL-Hash der Katalog-Split-Karten (#schkg/#straf). */
  rechtswegVorwahl?: Rechtsweg;
  /** Startseite-Schnellrechner: ohne per-Tab-Disclaimer (globaler Hinweis dort, §8). */
  minimal?: boolean;
} = {}) {
  // §6.6-Fassaden-Split H-13 (B25): das gebündelte Modell `z` reist als EIN Prop
  // in die ausgelagerten Ergebnis-Teile (ZustErgebnisRechtsmittel/-Einleitung);
  // hier destrukturiert nur, was die Eingabe-Schritte + Navigation brauchen.
  const z = useZustaendigkeitForm({ onRechtswegChange, rechtswegVorwahl });
  const { f, setF, set, rechtsweg, setRechtsweg, setSchritt, plzTreffer, istMiete, istArbeit, istGeld, istScheidung, setZhStrasse, setZhNummer, fehler, kantonDaten, gemeindeFremd, schritte, maxIndex, aktiverSchritt, zeige, weiterAus } = z;
  const pk = usePaneKlasse();

  // Fokus beim Schrittwechsel (W2·19, 1.10.2026; Muster `vorlagen/wizard.tsx`):
  // gemessen auf /rechner/zustaendigkeit fiel der Fokus nach «← Zurück» in den
  // ersten Schritt (Knopf danach ausgegraut) und nach dem letzten «Weiter →»
  // (Knopf verschwindet) auf BODY. Der Rechner hat keine sichtbare
  // Schritt-Überschrift (der Stepper nennt sie) — das Fokus-Ziel ist darum eine
  // nur vorlesbare (`sr-only`, 1×1) Überschrift. Nachzug P16b (1.10.2026,
  // Prüfer-Auflage): in einem MITTLEREN Schritt bleibt der auslösende Knopf
  // sichtbar und aktiv — dort bliebe die Fokusanzeige für Sehende auf der
  // unsichtbaren Überschrift verloren; der Fokus bleibt auf dem Knopf. Die
  // Überschrift fängt ihn nur, wenn das Element danach verschwunden, ausgegraut
  // oder nicht mehr im Dokument ist. Marke nur durch die Nutzeraktion, nie beim
  // ersten Rendern; Darstellung, keine Rechenlogik (§3).
  const titelRef = useRef<HTMLHeadingElement>(null);
  const fokusMarke = useRef(false);
  const wechsleSchritt = (n: SetStateAction<number>) => { fokusMarke.current = true; setSchritt(n); };
  useEffect(() => {
    if (!fokusMarke.current) return;
    fokusMarke.current = false;
    const a = document.activeElement;
    const verloren = !a || a === document.body || !a.isConnected || a.matches(':disabled');
    if (verloren) titelRef.current?.focus();
  }, [aktiverSchritt]);

  return (
    <BeruehrtRahmen>
      <div className="space-y-6">
        {/* minimal = Startseite-Schnellrechner: globaler Pflicht-Hinweis dort (§8). */}
        {!minimal && <PflichtDisclaimer text={
          rechtsweg === 'schkg'
            ? 'Automatisierte Orientierung zu Betreibungsort und SchKG-Foren (SchKG, Stand 1.1.2025; GebV SchKG Stand 1.1.2022) – keine Rechtsberatung. Internationale Sachverhalte und die materielle Begründetheit sind nicht abgebildet; Fristen sind Verwirkungsfristen und im Einzelfall zu prüfen.'
            : rechtsweg === 'straf'
              ? 'Automatisierte Orientierung zum Gerichtsstand im Strafverfahren (StPO, Stand 1.1.2024) – keine Rechtsberatung. Die Katalog-Subsumtion der Bundesgerichtsbarkeit (Art. 23/24 StPO) und jugendstrafrechtliche Sonderwege (JStPO) sind nicht abgebildet.'
              : DISCLAIMER
        } />}

        {/* Geführter Schritt-Dialog (Auftrag David 6.6.2026): klickbarer Stepper
            wie bei den Vorlagen-Wizards; je nach Rechtsweg/Instanz andere Strecke. */}
        <Stepper schritte={schritte} aktiv={aktiverSchritt} onWechsel={(i) => { if (i !== aktiverSchritt) wechsleSchritt(i); }} />
        <h2 ref={titelRef} tabIndex={-1} className="sr-only lc-sprungziel">{schritte[aktiverSchritt].label}</h2>

        {/* SCHRITT «Was möchten Sie tun?» – Rechtsweg + (Zivil) Einleitung/
            Rechtsmittel-Gabelung. SchKG/Straf binden hier ihre eigene Engine ein. */}
        {zeige('was') && (
        <div className="space-y-6">
        {/* Rechtsweg */}
        <div className="space-y-2">
          <GruppenTitel>Rechtsweg</GruppenTitel>
          {/* B3-4 (R3-α, 31.8.2026): diese Reihe war die 13. Kachel-Kopie —
              und die einzige mit einem echten Grund: sie kennt einen DRITTEN
              Zustand (Rechtsweg sichtbar, aber ohne Engine → nicht wählbar,
              §8). Der Grund ist jetzt ein Feld des Bausteins (`disabled` +
              `titel`); die Kopie ist gelöscht (§5/§10). Die «In
              Vorbereitung»-Marke bleibt im Label — sie ist die
              Ehrlichkeits-Aussage, nicht Zierde. */}
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-4 gap-2', 'grid grid-cols-1 @3xl/pane:grid-cols-4 gap-2')}
            gruppenLabel="Rechtsweg"
            items={RECHTSWEGE.map((w) => ({
              code: w.code,
              label: <>{w.label}{!w.aktiv && <span className="lc-badge-geplant ml-2">In Vorbereitung</span>}</>,
              sub: w.sub,
              disabled: !w.aktiv,
              titel: w.aktiv ? undefined : 'In Vorbereitung — eigene Engine folgt',
            }))}
            value={rechtsweg} onSelect={setRechtsweg} />
        </div>
        {rechtsweg === 'schkg' ? <SchkgZustaendigkeitTeil /> : rechtsweg === 'straf' ? <StrafZustaendigkeitTeil /> : null}
        </div>
        )}

        {rechtsweg === 'schkg' || rechtsweg === 'straf' ? null : <>

        {/* «Was möchten Sie tun?», Forts. (Zivil): Eingangs-Gabelung Einleitung
            vs. Rechtsmittel – bestimmt, welche Fragen überhaupt nötig sind. */}
        {zeige('was') && (
        <div className="space-y-2">
          <GruppenTitel>Was suchen Sie?</GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
            items={[
              { code: 'einleitung' as Instanz, label: 'Verfahren einleiten', sub: 'Zuständige Schlichtungsbehörde bzw. erstes Gericht finden' },
              { code: 'rechtsmittel' as Instanz, label: 'Rechtsmittel ergreifen', sub: 'Berufung/Beschwerde — zuständige obere Instanz' },
            ]}
            value={f.instanz}
            onSelect={(code) => set('instanz', code)}
          />
        </div>
        )}

        {/* Angefochtener Entscheid (Rechtsmittel-Umbau 6.6.2026): die rechtlich
            entscheidenden Weichen – Objekt (Art. 308/319 ZPO), Verfahrensart der
            Vorinstanz (Fristlänge + Stillstand!) und Vorinstanz-Typ (Art. 75
            Abs. 2 BGG). Bleibt INHALTLICH unverändert, nur im «Was»-Schritt. */}
        {zeige('was') && f.instanz === 'rechtsmittel' && (
          <div className="space-y-3">
            <GruppenTitel>Was wird angefochten?</GruppenTitel>
            <SelectionGrid
              className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}
              items={[
                { code: 'endentscheid' as RmObjekt, label: 'Endentscheid', sub: 'Das Verfahren wird ganz oder teilweise abgeschlossen' },
                { code: 'zwischenentscheid' as RmObjekt, label: 'Zwischenentscheid', sub: 'z. B. über Zuständigkeit oder Ausstand (selbständig eröffnet)' },
                { code: 'vorsorgliche_massnahme' as RmObjekt, label: 'Vorsorgliche Massnahme', sub: 'Auch Eheschutz nach der BGer-Praxis (Art. 98 BGG)' },
                { code: 'prozessleitende_verfuegung' as RmObjekt, label: 'Prozessleitende Verfügung', sub: 'Nicht berufungsfähig — nur Art. 319 lit. b ZPO' },
              ]}
              value={f.rmObjekt}
              onSelect={(code) => set('rmObjekt', code)}
            />
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
              <Field label="Verfahrensart der Vorinstanz" hint="entscheidet über Fristlänge (30/10 Tage) und Gerichtsferien-Stillstand">
                <select className={inputCls} value={f.rmVerfahren} onChange={(e) => set('rmVerfahren', e.target.value as RmVerfahren)}>
                  <option value="ordentlich_vereinfacht">Ordentliches oder vereinfachtes Verfahren</option>
                  <option value="summarisch">Summarisches Verfahren (z. B. Rechtsschutz in klaren Fällen, Eheschutz)</option>
                </select>
              </Field>
              <Field label="Wer hat entschieden?" hint="Handelsgericht/Direktklage: kein kantonales Rechtsmittel (Art. 75 Abs. 2 BGG)">
                <select className={inputCls} value={f.rmVorinstanz} onChange={(e) => set('rmVorinstanz', e.target.value as RmVorinstanz)}>
                  <option value="erstinstanz">Erstinstanzliches Gericht (Bezirks-/Regional-/Zivilgericht)</option>
                  <option value="handelsgericht">Handelsgericht (ZH/BE/AG/SG, Art. 6 ZPO)</option>
                  <option value="direktklage_oberes_gericht">Oberes Gericht nach Direktklage (Art. 8 ZPO)</option>
                </select>
              </Field>
            </div>
            {f.rmVerfahren === 'summarisch' && (
              <Checkbox
                checked={f.rmFamilienSummarsache}
                onChange={(v) => set('rmFamilienSummarsache', v)}
                label={<><span>
                    Familienrechtliche Streitigkeit nach Art. 271/276/302/305 ZPO (Eheschutz, vorsorgliche
                    Massnahmen im Scheidungsverfahren, Unterhalts-/Vaterschaftsmassnahmen) —
                    Berufungsfrist dann 30 statt 10 Tage (Art. 314 Abs. 2 ZPO, seit 1.1.2025)
                  </span></>} />
            )}
          </div>
        )}

        {/* SCHRITT «Worum geht es?» – Streitsache + bedingte Unterfälle */}
        {zeige('sache') && (
        <div className="space-y-2">
          <GruppenTitel>Art des Streits</GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 @3xl/pane:grid-cols-3 gap-2')}
            items={STREITSACHEN.map((s) => ({ code: s.code, label: s.label, sub: s.sub }))}
            value={f.streitsache}
            onSelect={(code) => set('streitsache', code)}
          />
          {istMiete && (
            <Field label="Miet-Unterfall" hint="Schutzmaterien sind streitwertunabhängig vereinfacht (Art. 243 Abs. 2 lit. c ZPO)">
              <select className={inputCls} value={f.mieteUnterfall} onChange={(e) => set('mieteUnterfall', e.target.value as MieteUnterfall)}>
                {MIETE_UNTERFAELLE.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </Field>
          )}
          {f.streitsache === 'delikt' && (
            <Field label="Delikts-Unterfall" hint="Spezialforen (Art. 37/38) gehen dem allgemeinen Deliktsforum vor">
              <select className={inputCls} value={f.deliktUnterfall} onChange={(e) => set('deliktUnterfall', e.target.value as DeliktUnterfall)}>
                {DELIKT_UNTERFAELLE.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </Field>
          )}
          {f.streitsache === 'persoenlichkeit' && (
            <Field label="Unterfall" hint="Gewaltschutz: Schlichtung entfällt (Art. 198 lit. abis), vereinfacht streitwertunabhängig, gerichtskostenfrei (Art. 114 lit. f)">
              <select className={inputCls} value={f.persoenlichkeitUnterfall} onChange={(e) => set('persoenlichkeitUnterfall', e.target.value as PersoenlichkeitUnterfall)}>
                {PERSOENLICHKEIT_UNTERFAELLE.map((m) => <option key={m.code} value={m.code}>{m.label}</option>)}
              </select>
            </Field>
          )}

        {f.streitsache === 'ip_wettbewerb' && (
          <Field label="Art.-5-Materie" hint="UWG/Bund-Klagen sind nur über CHF 30 000 einzige Instanz (lit. d/f)">
            <select className={inputCls} value={f.ipUnterfall} onChange={(e) => set('ipUnterfall', e.target.value as IpUnterfall)}>
              <option value="ip_kartell_firma">IP / Kartell / Firma / übrige unbedingte Katalog-Materien (lit. a–c, e, g–i)</option>
              <option value="uwg">UWG (lit. d — über 30'000 oder Bund klagt)</option>
              <option value="klage_gegen_bund">Klage gegen den Bund (lit. f — nur über 30'000)</option>
            </select>
            {f.ipUnterfall === 'uwg' && (
              <Checkbox
                checked={f.bundKlagerecht}
                onChange={(v) => set('bundKlagerecht', v)}
                label="Der Bund übt sein Klagerecht aus (dann einzige Instanz unabhängig vom Streitwert)"
                className="mt-2"
              />
            )}
          </Field>
        )}
        </div>
        )}

        {/* SCHRITT «Örtliche Anknüpfung» – nur die für die Streitsache relevante
            Frage (Einleitung: Ort + Kanton; Rechtsmittel: nur Kanton für die
            obere Instanz). Reine Beschriftung aus ORT_LABEL; die Engine-Regel
            bleibt unberührt (Art. 10/23/32–34 ZPO). */}
        {zeige('ort') && (
        <div className="space-y-3">
          <GruppenTitel>
            {f.instanz === 'einleitung' ? 'Wo ist die Sache örtlich anzuknüpfen?' : 'In welchem Kanton wurde entschieden?'}
          </GruppenTitel>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            {f.instanz === 'einleitung' && (
            <Field label={`Massgeblicher Ort: ${ORT_LABEL[f.streitsache]}`} optional hint="Gemeinde (für die Auflösung der konkreten Stelle)">
              <div className="space-y-1.5">
                <div className="grid grid-cols-[6.5rem_1fr] gap-2">
                  <input className={inputCls + ' num'} value={f.plz} inputMode="numeric" maxLength={4}
                    onChange={(e) => set('plz', e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="PLZ" aria-label="Postleitzahl" />
                  <input className={inputCls} value={f.gemeinde} onChange={(e) => set('gemeinde', e.target.value)} placeholder="z. B. Basel" aria-label="Gemeinde" />
                </div>
                {f.plz.length === 4 && plzTreffer === null && (
                  <p className="text-xs text-warn-700">PLZ {f.plz}: im amtlichen Ortschaftenverzeichnis nicht gefunden — bitte prüfen.</p>
                )}
                {plzTreffer && plzTreffer.length > 0 && (() => {
                  const kantone = [...new Set(plzTreffer.map((t) => t.kanton))];
                  const gemeinden = [...new Set(plzTreffer.map((t) => t.gemeinde))];
                  // Mehrdeutige PLZ (Randgebiets-Fall 4052 wie echte Mehrdeutig-
                  // keit 1041): klickbare Auswahl statt Hand-Tippen (TODO 5
                  // betreibungskreise-kantone.md); der Klick setzt Gemeinde UND
                  // Kanton, der Auto-Fill oben (nur leere Felder) bleibt unberührt.
                  if (gemeinden.length > 1) {
                    return (
                      <PlzGemeindeWahl
                        plz={f.plz} treffer={plzTreffer} gemeinde={f.gemeinde} kanton={f.kanton}
                        onWahl={({ gemeinde, kanton }) => setF((alt) => ({ ...alt, gemeinde, kanton }))}
                      />
                    );
                  }
                  return (
                    <p className="text-xs text-ink-500">
                      PLZ {f.plz}: {gemeinden[0]} ({kantone.join('/')})
                    </p>
                  );
                })()}
                {/* Adress-Ausbau Stufe 3 (Entscheid David 12.6.2026): Adresse
                    der beklagten Partei über die Bundes-API auflösen — nur auf
                    Klick, Hinweis permanent; Offline-Wege bleiben Alternative. */}
                <AdresseBundSuche
                  onUebernehmen={({ gemeinde, kanton, plz }) => {
                    setF((alt) => ({ ...alt, gemeinde, kanton, plz }));
                    // Bug-Check 12.6.2026 (MITTEL): die übernommene Adresse ist
                    // die neue Wahrheit — eine stehengebliebene ZH-Strasse hätte
                    // sonst Vorrang vor der frischen PLZ (Stufe-1-Vorrang).
                    setZhStrasse(''); setZhNummer('');
                  }} />
              </div>
            </Field>
            )}
            <Field label="Kanton (Forum)" hint="alle Kantone hinterlegt (zentrale Stelle, Stellen-Liste oder amtliches Verzeichnis)">
              <select className={inputCls + ' sm:max-w-[9rem]'} value={f.kanton} onChange={(e) => set('kanton', e.target.value as Kanton | '')}>
                <option value="">– wählen –</option>
                {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
          </div>
          {gemeindeFremd && (
            <p className="lc-notice-warn text-body-s">
              «{f.gemeinde.trim()}» ist keine Gemeinde des Kantons {f.kanton} (erfasst: {kantonDaten?.gemeinden.join(', ')}) —
              Kanton oder Ort prüfen.
            </p>
          )}
        </div>
        )}

        {/* SCHRITT «Streitwert» – nur vermögensrechtlich relevant; bei Scheidung
            entfällt der Schritt ganz (nicht vermögensrechtlich). */}
        {zeige('streitwert') && (
        <div className="space-y-3">
          <GruppenTitel>Um wie viel geht es?</GruppenTitel>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Streitwert (CHF)" hint="massgeblich ist das Rechtsbegehren; die Engine berechnet den Streitwert nicht">
              <div className="space-y-1.5">
                <BetragsFeld value={f.streitwertRoh} onChange={(v) => set('streitwertRoh', v)} className={inputCls}
                  placeholder="z. B. 12'000" aria-label="Streitwert in Franken" />
                <Checkbox
                  checked={!f.vermoegensrechtlich}
                  onChange={(v) => set('vermoegensrechtlich', !v)}
                  label="nicht vermögensrechtliche Streitigkeit"
                />
              </div>
            </Field>
          </div>
          <FehlerBox fehler={fehler} />
        </div>
        )}

        {/* SCHRITT «Sonderfälle» – die bisher eingeklappte Sektion als optionaler
            eigener Schritt; Inhalt unverändert (Rechtsmittel-Strecke kennt ihn
            nicht). */}
        {zeige('sonderfaelle') && !istScheidung && f.instanz === 'einleitung' && (
          <div className="lc-card p-4">
            <p className="lc-overline mb-1">Weitere Angaben – Sonderfälle</p>
            <p className="text-body-s text-ink-600 mb-3">
              Optional. Vereinbarungen, Handelsregister-Eintrag, Auslandbezug u. a. – nur ausfüllen, wenn einschlägig.
            </p>
            <div className="space-y-3 mt-3">

            {istGeld && (
              <Checkbox
                checked={f.konsumentenvertrag}
                onChange={(v) => set('konsumentenvertrag', v)}
                label={<><span>Konsumentenvertrag <span className="text-ink-500"><NormText text={`(Leistung des üblichen Verbrauchs für persönliche/familiäre Bedürfnisse, Art. 32 ZPO)`} /></span></span></>} />
            )}
            {istGeld && !f.konsumentenvertrag && (
              <Checkbox
                checked={f.ausVertrag}
                onChange={(v) => set('ausVertrag', v)}
                label={<><span>Forderung aus Vertrag <span className="text-ink-500"><NormText text={`(zusätzliches Forum am Ort der charakteristischen Leistung — der vertragstypprägenden, i. d. R. nicht der Geldleistung, Art. 31 ZPO)`} /></span></span></>} />
            )}
            {istArbeit && (
              <Checkbox
                checked={f.avgVerleih}
                onChange={(v) => set('avgVerleih', v)}
                label={<><span>Personalverleih/-vermittlung (AVG) <span className="text-ink-500"><NormText text={`(zusätzliches Forum am Ort der Geschäftsniederlassung der verleihenden Person, Art. 34 Abs. 2 ZPO)`} /></span></span></>} />
            )}
            <Checkbox
              checked={f.gerichtsstandsvereinbarung}
              onChange={(v) => set('gerichtsstandsvereinbarung', v)}
              label={<><span>Gerichtsstandsvereinbarung vorhanden <span className="text-ink-500">(Wirksamkeit hängt vom Bindungsgrad ab, Art. 9/17/35 ZPO)</span></span></>} />
            {istGeld && f.konsumentenvertrag && (
              <Checkbox
                checked={f.klaegeristGeschuetzt}
                onChange={(v) => set('klaegeristGeschuetzt', v)}
                label={<>Die Konsumentin / der Konsument klagt
                              </>}
                className='pl-6' />
            )}
            {istArbeit && (
              <Checkbox
                checked={f.glgBetroffen}
                onChange={(v) => set('glgBetroffen', v)}
                label={<><span>Streit nach Gleichstellungsgesetz <span className="text-ink-500">(paritätische Behörde, vereinfacht streitwertunabhängig)</span></span></>} />
            )}
            <Checkbox
              checked={f.beklagteAuslandOderUnbekannt}
              onChange={(v) => set('beklagteAuslandOderUnbekannt', v)}
              label={<><span>Beklagte Partei mit Sitz/Wohnsitz im Ausland oder Aufenthalt unbekannt <span className="text-ink-500"><NormText text={`(einseitiger Schlichtungsverzicht, Art. 199 Abs. 2 ZPO)`} /></span></span></>} />
            <Checkbox
              checked={f.widerklageOderGerichtlicheFrist}
              onChange={(v) => set('widerklageOderGerichtlicheFrist', v)}
              label={<><span>Widerklage/Hauptintervention oder gerichtlich angesetzte Klagefrist <span className="text-ink-500">(Schlichtung entfällt, Art. 198 lit. g/h ZPO)</span></span></>} />
            {istGeld && (
              <details className="lc-card p-4">
                <summary className="cursor-pointer text-body-s font-medium text-ink-700">
                  Handelsgerichts-Konstellation <span className="text-ink-500 font-normal"><NormText text={`(nur Kantone mit Handelsgericht: ZH/BE/AG/SG; Art. 6 ZPO)`} /></span>
                </summary>
                <div className="mt-3 space-y-2">
                  <Checkbox
                    checked={f.geschaeftlicheTaetigkeit}
                    onChange={(v) => set('geschaeftlicheTaetigkeit', v)}
                    label={<>Geschäftliche Tätigkeit mindestens einer Partei betroffen
                                      </>} />
                  <Checkbox
                    checked={f.beklagteImHR}
                    onChange={(v) => set('beklagteImHR', v)}
                    label={<>Beklagte Partei im Handelsregister eingetragen
                                      </>} />
                  <Checkbox
                    checked={f.klaegerImHR}
                    onChange={(v) => set('klaegerImHR', v)}
                    label={<>Klagende Partei im Handelsregister eingetragen
                                      </>} />
                </div>
              </details>
            )}
            </div>
          </div>
        )}

        <ZustErgebnisRechtsmittel z={z} />

        <ZustErgebnisEinleitung z={z} />

        {/* Schritt-Navigation (Muster wie VorlagenWizardRahmen): Zurück immer,
            Weiter bis zum Fahrplan; «Weiter» bei ungültigem Streitwert gesperrt. */}
        <div className="flex items-center justify-between pt-2 border-t border-line">
          {/* LM-094 (W2·17-UI-BEFUNDE B17, 4.9.2026): dasselbe Paar wie im
              Vorlagen-Wizard — der Befund nennt beide Fundstellen
              ausdrücklich. Outline statt Ghost, damit die zwei Knöpfe eines
              Assistenten sichtbar zusammengehören; Begründung im Wortlaut bei
              `vorlagen/wizard.tsx`. */}
          <button type="button" onClick={() => wechsleSchritt((s) => Math.max(0, s - 1))}
            disabled={aktiverSchritt === 0} className="lc-btn-outline">← Zurück</button>
          {aktiverSchritt < maxIndex && (
            <button type="button" onClick={() => wechsleSchritt((s) => Math.min(maxIndex, s + 1))}
              disabled={weiterAus} className="lc-btn-primary">Weiter →</button>
          )}
        </div>
        </>}
      </div>
    </BeruehrtRahmen>
  );
}
