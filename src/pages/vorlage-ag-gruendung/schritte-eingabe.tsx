import { Checkbox, Field, inputCls } from '../../components/vorlagen/ui';
import { BetragsFeld } from '../../components/BetragsFeld';
import { DatumsFeld } from '../../components/DatumsFeld';
import { usePaneKlasse } from '../../components/layout/PaneKontext';
import { NormText } from '../../components/NormText';
import { NotariatsHinweis, HrAmtHinweis } from '../../components/vorlagen/Dokumentmappe';
import { PflichtDisclaimer } from '../../components/PflichtDisclaimer';
import { KANTONE } from '../../lib/kantone';
import type { EinlageArt } from '../../lib/gruendungsunterlagen';
import type { AgDokAntworten } from '../../lib/vorlagen/gruendungAgDokumente';
import type { AgSchrittCtx } from './ctx';

export { SchrittKapital } from './schritte-eingabe.kapital';
export { SchrittPersonen } from './schritte-eingabe.personen';

// Verhaltensneutral ausgelagerte Eingabe-Schritte (§6 Ziff. 6). Jede Funktion
// destrukturiert oben die benötigten Werte/Setter aus dem Ctx; die JSX-Bodies
// sind unverändert gegenüber der vormaligen Inline-Definition in
// VorlageAgGruendung.tsx. Reine Darstellung (§3).

export function SchrittKonstellation({ ctx }: { ctx: AgSchrittCtx }) {
  const {
    einlageArt, setEinlageArt, optingOut, setOptingOut,
    leistungen, setLeistungen, besondereVorteile, setBesondereVorteile,
    inhaberaktien, setInhaberaktien, eigeneBueros, setEigeneBueros,
    immobilienHauptzweck, setImmobilienHauptzweck, fremdwaehrung, setFremdwaehrung,
    bankInUrkunde, setBankInUrkunde, chVertretung, setChVertretung, checkliste,
  } = ctx;
  const pk = usePaneKlasse();
  return (
    <div className="space-y-4">
      <PflichtDisclaimer />
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Liberierung">
          <select className={inputCls} value={einlageArt} onChange={(e) => setEinlageArt(e.target.value as EinlageArt)}>
            <option value="bar">Bareinlage</option>
            <option value="sacheinlage">Sacheinlage</option>
            <option value="verrechnung">Verrechnung</option>
            <option value="gemischt">Gemischt (bar + Sache/Verrechnung)</option>
          </select>
        </Field>
        <Field label="Revision">
          <select className={inputCls} value={optingOut ? 'opting' : 'rs'} onChange={(e) => setOptingOut(e.target.value === 'opting')}>
            <option value="opting">Verzicht (Opting-out, ≤ 10 Vollzeitstellen)</option>
            <option value="rs">Revisionsstelle bestellt</option>
          </select>
        </Field>
        <Field label="Leistungen der Aktionäre (CHF — für die Emissionsabgabe)" optional>
          <BetragsFeld className={inputCls} placeholder="z. B. 100'000" value={leistungen} onChange={setLeistungen} />
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-y-2 text-body-s text-ink-700">
        <Checkbox checked={besondereVorteile} onChange={setBesondereVorteile} label="Besondere Vorteile für Gründer/Dritte" />
        <Checkbox checked={inhaberaktien} onChange={setInhaberaktien} label="Inhaberaktien vorgesehen" />
        <Checkbox checked={!eigeneBueros} onChange={(v) => setEigeneBueros(!v)} label="c/o-Adresse (kein eigenes Büro)" />
        <Checkbox checked={immobilienHauptzweck} onChange={setImmobilienHauptzweck} label="Immobilien-Haupttätigkeit" />
        <Checkbox checked={fremdwaehrung} onChange={setFremdwaehrung} label="Aktienkapital in Fremdwährung" />
        <Checkbox checked={!bankInUrkunde} onChange={(v) => setBankInUrkunde(!v)} label="Bank wird in der Urkunde NICHT genannt" />
        <Checkbox checked={chVertretung} onChange={setChVertretung} label="Vertretungsberechtigte Person mit CH-Wohnsitz vorhanden" />
      </div>
      {checkliste.blocker.map((b) => (
        <div key={b} className="lc-notice-warn">
          <p className="text-body-s font-medium">Eintragungshindernis</p>
          <p className="text-body-s"><NormText text={b} /></p>
        </div>
      ))}
    </div>
  );
}

export function SchrittGesellschaft({ ctx }: { ctx: AgSchrittCtx }) {
  const {
    firma, setFirma, sitz, setSitz, kanton, setKanton, zweck, setZweck, finmaTreffer,
    zweckErweiterung, setZweckErweiterung, vinkulierung, setVinkulierung,
    virtuelleGv, setVirtuelleGv, statutenUmfang, setStatutenUmfang,
    inhaberaktien, inhaberKotiert, setInhaberKotiert, verwahrungsstelle, setVerwahrungsstelle,
    schiedsklausel, setSchiedsklausel, schiedsOrt, setSchiedsOrt,
    kapitalband, setKapitalband, kbRichtung, setKbRichtung, kbEndeDatum, setKbEndeDatum,
    wc, kbUntergrenze, setKbUntergrenze, kbObergrenze, setKbObergrenze,
    bedingtesKapital, setBedingtesKapital, bkBetrag, setBkBetrag, bkKreis, setBkKreis,
    stichentscheidGv, setStichentscheidGv, gjBeginn, setGjBeginn, gjEnde, setGjEnde,
    gjErstesEnde, setGjErstesEnde,
  } = ctx;
  const pk = usePaneKlasse();
  return (
    <div className="space-y-4">
      <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
        <Field label="Firma (mit Zusatz «AG», Art. 950 OR)">
          <input className={inputCls} value={firma} onChange={(e) => setFirma(e.target.value)} placeholder="z. B. Muster Immobilien AG" />
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
      <HrAmtHinweis kanton={kanton} />
      <Field label="Zweck">
        <textarea className={inputCls} rows={3} value={zweck} onChange={(e) => setZweck(e.target.value)}
          placeholder="z. B. den Erwerb, das Halten und die Verwaltung von Beteiligungen" />
      </Field>
      {finmaTreffer.length > 0 && (
        <div className="lc-notice-warn">
          <p className="text-body-s">
            Firma/Zweck enthält «{finmaTreffer.join('», «')}»: Solche Bezeichnungen dürfen nur mit
            entsprechender FINMA-Bewilligung ins Handelsregister eingetragen werden; eine Bank darf vor
            der Bewilligung gar nicht eingetragen werden (Merkblatt HRegA ZH, 11.12.2024).
          </p>
        </div>
      )}
      <Checkbox checked={zweckErweiterung} onChange={setZweckErweiterung} label="Übliche Zweck-Erweiterungsklausel" />
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-s text-ink-700">
        <Checkbox checked={vinkulierung} onChange={setVinkulierung} label="Vinkulierung der Namenaktien (Art. 685a f. OR)" />
        <Checkbox checked={virtuelleGv} onChange={setVirtuelleGv} label="Virtuelle/hybride Generalversammlung (Art. 701d OR)" />
        <label className="flex items-center gap-2">
          Statuten-Umfang:
          <select className={inputCls} value={statutenUmfang}
            onChange={(e) => setStatutenUmfang(e.target.value as AgDokAntworten['statutenUmfang'])}>
            <option value="kurz">Kurzfassung (amtliche ZH-Kurzvorlage)</option>
            <option value="lang">Langfassung (mit Organisations-Artikeln)</option>
          </select>
        </label>
      </div>
      {/* Stufe 2 P2: Inhaberaktien-Voraussetzung (Art. 622 Abs. 1bis OR) */}
      {inhaberaktien && (
        <div className="rounded-md border border-line p-3 space-y-3">
          <p className="text-body-s font-medium text-ink-900"><NormText text={`Inhaberaktien — Zulässigkeits-Voraussetzung (Art. 622 Abs. 1bis OR)`} /></p>
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Voraussetzung">
              <select className={inputCls} value={inhaberKotiert ? 'kotiert' : 'bucheffekten'}
                onChange={(e) => setInhaberKotiert(e.target.value === 'kotiert')}>
                <option value="bucheffekten">Bucheffekten (BEG) + Verwahrungsstelle in der Schweiz</option>
                <option value="kotiert">Beteiligungspapiere an einer Börse kotiert</option>
              </select>
            </Field>
            {!inhaberKotiert && (
              <Field label="Verwahrungsstelle (Name und Ort)">
                <input className={inputCls} value={verwahrungsstelle}
                  onChange={(e) => setVerwahrungsstelle(e.target.value)} placeholder="z. B. SIX SIS AG, Olten" />
              </Field>
            )}
          </div>
          <p className="text-xs text-ink-500 max-w-kleintext">
            Inhaberaktien setzen Volliberierung voraus (Art. 683 OR) und schliessen Vinkulierung und die
            Statuten-Langfassung aus; der Nachweis ist der Anmeldung beizulegen (Art. 43 Abs. 1 lit. i HRegV).
          </p>
        </div>
      )}
      {/* Stufe 2 P3: Statuten-Zusatzklauseln */}
      <div className="rounded-md border border-line p-3 space-y-3">
        <p className="text-body-s font-medium text-ink-900">Statuten-Zusatzklauseln (optional)</p>
        <Checkbox checked={schiedsklausel} onChange={setSchiedsklausel} label="Schiedsklausel (Art. 697n OR)" />
        {schiedsklausel && (
          <Field label="Sitz des Schiedsgerichts (Ort in der Schweiz)">
            <input className={inputCls} value={schiedsOrt} onChange={(e) => setSchiedsOrt(e.target.value)} placeholder="z. B. Zürich" />
          </Field>
        )}
        <Checkbox checked={kapitalband} onChange={setKapitalband} label="Kapitalband (Art. 653s ff. OR — VR-Ermächtigung, max. 5 Jahre, ±½ des Kapitals)" />
        {kapitalband && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}>
            <Field label="Richtung der Ermächtigung">
              <select className={inputCls} value={kbRichtung}
                onChange={(e) => setKbRichtung(e.target.value as AgDokAntworten['kbRichtung'])}>
                <option value="erhoehen">Nur Erhöhung (bei Opting-out zwingend)</option>
                <option value="beide">Erhöhung und Herabsetzung (nur mit Revisionsstelle)</option>
              </select>
            </Field>
            <Field label="Ende der Ermächtigung (max. 5 Jahre)">
              {/* R2-E/F1-1: DatumsFeld statt nativem type="date" — Letzteres
                  rendert in der BROWSER-Locale (US: MM/DD/YYYY) und trägt hier
                  eine Frist. Wert bleibt ISO, das Schema sieht dasselbe. */}
              <DatumsFeld value={kbEndeDatum} onChange={setKbEndeDatum} className={inputCls} />
            </Field>
            <Field label={`Untere Grenze (${wc}${kbRichtung === 'erhoehen' ? ' — bei «nur Erhöhung» = Aktienkapital' : ''})`}>
              <BetragsFeld className={inputCls} value={kbUntergrenze} onChange={setKbUntergrenze} />
            </Field>
            <Field label={`Obere Grenze (${wc}, höchstens das Anderthalbfache des Kapitals)`}>
              <BetragsFeld className={inputCls} value={kbObergrenze} onChange={setKbObergrenze} />
            </Field>
          </div>
        )}
        <Checkbox checked={bedingtesKapital} onChange={setBedingtesKapital} label="Bedingtes Kapital (Art. 653 ff. OR — Wandel-/Optionsrechte, max. ½ des Kapitals)" />
        {bedingtesKapital && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}>
            <Field label={`Nennbetrag des bedingten Kapitals (${wc})`}>
              <BetragsFeld className={inputCls} value={bkBetrag} onChange={setBkBetrag} placeholder="z. B. 50'000" />
            </Field>
            <Field label="Kreis der Berechtigten (Art. 653b Abs. 1 Ziff. 3 OR)">
              <input className={inputCls} value={bkKreis} onChange={(e) => setBkKreis(e.target.value)}
                placeholder="z. B. den Arbeitnehmerinnen und Arbeitnehmern der Gesellschaft" />
            </Field>
          </div>
        )}
        {statutenUmfang === 'lang' && (
          <div title="ZH-Langvorlage: «Bei Stimmengleichheit hat der Vorsitzende den Stichentscheid.» — abwählbar; ohne Klausel gilt: Stimmengleichheit = Antrag abgelehnt (SG-Default, Kantonsvergleich B8).">
            <Checkbox checked={stichentscheidGv} onChange={setStichentscheidGv} label="Stichentscheid des Vorsitzenden in der Generalversammlung (Langfassung)" />
          </div>
        )}
      </div>
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        <Field label="Geschäftsjahr-Beginn (Statuten)">
          <input className={inputCls} value={gjBeginn} onChange={(e) => setGjBeginn(e.target.value)} placeholder="z. B. 1. Januar" />
        </Field>
        <Field label="Geschäftsjahr-Ende (Statuten)">
          <input className={inputCls} value={gjEnde} onChange={(e) => setGjEnde(e.target.value)} placeholder="z. B. 31. Dezember" />
        </Field>
        <Field label="Erstes Geschäftsjahr endet am (bei unterjähriger Gründung)" optional>
          <input className={inputCls} value={gjErstesEnde} onChange={(e) => setGjErstesEnde(e.target.value)} placeholder="z. B. 31. Dezember 2026" />
        </Field>
      </div>
    </div>
  );
}

export function SchrittWeiteres({ ctx }: { ctx: AgSchrittCtx }) {
  const {
    eigeneBueros, rechtsdomizil, setRechtsdomizil, domizilhalterName, setDomizilhalterName,
    domizilhalterAdresse, setDomizilhalterAdresse, ort, setOrt, datum, setDatum,
    nachtragsbevollmaechtigter, setNachtragsbevollmaechtigter,
    konstituierungInUrkunde, setKonstituierungInUrkunde, domizilNurAnmeldung, setDomizilNurAnmeldung,
    immobilienHauptzweck, lkAusland, setLkAusland, lkNeuerwerb, setLkNeuerwerb,
    lkGrundstueck, setLkGrundstueck, nachtragAktiv, setNachtragAktiv,
    ntGruendungsdatum, setNtGruendungsdatum, ntUrkundeZiffer, setNtUrkundeZiffer,
    ntUrkundeText, setNtUrkundeText, ntStatutenArtikel, setNtStatutenArtikel,
    ntStatutenAbsatz, setNtStatutenAbsatz, ntStatutenText, setNtStatutenText,
  } = ctx;
  const pk = usePaneKlasse();
  return (
    <div className="space-y-4">
      <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
        {eigeneBueros ? (
          <Field label="Rechtsdomizil (Adresse am Sitz)">
            <input className={inputCls} value={rechtsdomizil} onChange={(e) => setRechtsdomizil(e.target.value)} />
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
        <Field label="Ort (Unterschriften)">
          <input className={inputCls} value={ort} onChange={(e) => setOrt(e.target.value)} />
        </Field>
        <Field label="Datum">
          <DatumsFeld value={datum} onChange={setDatum} className={inputCls} />
        </Field>
        <Field label="Nachtrags-Bevollmächtigte:r (volle Personalien)" optional>
          <input className={inputCls} value={nachtragsbevollmaechtigter} onChange={(e) => setNachtragsbevollmaechtigter(e.target.value)}
            placeholder="Vorname Name, Geburtsdatum, Bürgerort, Wohnadresse" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-body-s text-ink-700">
        <div title="Konstituierung, Zeichnungsberechtigung und Domizil werden in der Gründungsurkunde erklärt (ZH Ziff. VII, Bedingung: VR vollzählig anwesend) – das separate VR-Protokoll entfällt.">
          <Checkbox checked={konstituierungInUrkunde} onChange={setKonstituierungInUrkunde} label="Konstituierung in der Urkunde" />
        </div>
        <div title="Das Domizil wird in der Urkunde weggelassen und steht nur in der HR-Anmeldung (ZH-Erläuterung zu Ziff. VII).">
          <Checkbox checked={domizilNurAnmeldung} onChange={setDomizilNurAnmeldung} label="Domizil nur in der Anmeldung" />
        </div>
      </div>

      {/* Etappe 4.3: Lex-Koller-Erklärung (Art. 18 BewG; ZH-Formular) */}
      {immobilienHauptzweck && (
        <div className="space-y-2">
          <p className="text-body-s font-medium text-ink-900">Lex-Koller-Erklärung (Erwerb von Grundstücken durch Personen im Ausland)</p>
          <div className="flex flex-col gap-1.5 text-body-s text-ink-700">
            <Checkbox checked={lkAusland} onChange={setLkAusland} label="Personen im Ausland (Art. 5 BewG) sind an der Gesellschaft beteiligt" />
            <Checkbox checked={lkNeuerwerb} onChange={setLkNeuerwerb} label="Personen im Ausland erwerben mit der Gründung neu eine Beteiligung" />
            <Checkbox checked={lkGrundstueck} onChange={setLkGrundstueck} label="Bei Sacheinlage: Die Gesellschaft erwirbt Nicht-Betriebsstätte-Grundstücke in der Schweiz" />
          </div>
        </div>
      )}

      {/* Etappe 4.4: Gründungs-Nachtrag (ZH-Vorlage 3.4; ENTWURF) */}
      <div className="space-y-2">
        <Checkbox checked={nachtragAktiv} onChange={setNachtragAktiv} label="Nachtrag zur Gründungsurkunde vorbereiten (nach Beanstandung durch die Handelsregisterbehörde)" />
        {nachtragAktiv && (
          <div className="rounded-md border border-line p-3 space-y-2">
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}>
              <Field label="Datum der Gründungsurkunde">
                <DatumsFeld value={ntGruendungsdatum} onChange={setNtGruendungsdatum} className={inputCls} />
              </Field>
              <Field label="Geänderte Urkunden-Ziffer (z. B. III)">
                <input className={inputCls} value={ntUrkundeZiffer} onChange={(e) => setNtUrkundeZiffer(e.target.value)} />
              </Field>
            </div>
            <Field label="Neuer Wortlaut der Urkunden-Ziffer">
              <textarea className={inputCls} rows={3} value={ntUrkundeText} onChange={(e) => setNtUrkundeText(e.target.value)} />
            </Field>
            <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-2', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-2')}>
              <Field label="Geänderter Statuten-Artikel (Nr.)">
                <input className={inputCls} inputMode="numeric" value={ntStatutenArtikel} onChange={(e) => setNtStatutenArtikel(e.target.value)} />
              </Field>
              <Field label="Absatz" optional>
                <input className={inputCls} inputMode="numeric" value={ntStatutenAbsatz} onChange={(e) => setNtStatutenAbsatz(e.target.value)} />
              </Field>
            </div>
            <Field label="Neuer Wortlaut des Statuten-Artikels">
              <textarea className={inputCls} rows={3} value={ntStatutenText} onChange={(e) => setNtStatutenText(e.target.value)} />
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
