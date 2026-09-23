import { useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { agGruendungsunterlagen, finmaBegriffsTreffer } from '../lib/gruendungsunterlagen';
import { Field, inputCls } from '../components/vorlagen/ui';
import { NormText } from '../components/NormText';
import { VorlagenWizardRahmen, VorschauPanel, musterdatenAnwenden } from '../components/vorlagen/wizard';
import { agMusterdaten } from '../components/vorlagen/musterdaten';
import { useWizardState } from '../components/vorlagen/useWizardState';
import { karte } from '../lib/startseiteConfig';
import { BANNER_MAPPE_FERTIG } from '../lib/vorlagen/banner';
import { getAusgabeStil } from '../components/vorlagen/ausgabeStil';
import {
  agDokumentmappe,
  AG_DOK_DEFAULTS,
  AG_FREMDWAEHRUNGEN,
  type AgDokAntworten,
} from '../lib/vorlagen/gruendungAgDokumente';

// ─── Maske: AG-Gründung als WIZARD (Auftrag David 7.6.2026) ──────────────────
// Durchklickbar analog der anderen Vorlagen-Masken (VorlagenWizardRahmen):
// Konstellation → Gesellschaft → Kapital & Einlagen → Personen → Weiteres →
// Dokumente (Checkliste + Mappe + Sammel-Download). Rechtslogik vollständig
// in lib/vorlagen/gruendungAgDokumente.ts und lib/gruendungsunterlagen.ts
// (§3/§5); hier nur Darstellung und Eingabesammlung.
//
// D6 (QS-CODE-ENTDOPPLUNG, 4.8.2026): der Eingabe-Zustand liegt in EINEM
// AgStand-Objekt hinter useWizardState (geteilter Rahmen, Punkt-7-Speicherung
// inklusive) statt in ~70 Einzel-useState mit handgepflegter Serialisierung.
// Hydration/Migration des alten {v:1, stand}-Formats: migriereAgStand
// (vorlagenAgGruendungDaten.ts). Die ctx-Schnittstelle der Schritt-Renderer
// bleibt UNVERÄNDERT (Einzelwerte + Dispatch-Setter) — die Geschwister-
// Dateien unter vorlage-ag-gruendung/ sind byte-identisch geblieben.

import { SCHRITTE, BEREICH_SCHRITT, BANNER_ENTWURF, STORAGE_KEY, agStandDefaults, migriereAgStand, type AgStand } from './vorlagenAgGruendungDaten';
import type { AgSchrittCtx } from './vorlage-ag-gruendung/ctx';
import { SchrittKonstellation, SchrittGesellschaft, SchrittKapital, SchrittPersonen, SchrittWeiteres } from './vorlage-ag-gruendung/schritte-eingabe';
import { SchrittDokumente } from './vorlage-ag-gruendung/schritte-dokumente';

export function VorlageAgGruendung() {
  const card = karte('ag-gruendung');

  // Punkt 7: gespeicherter Stand wird GENAU EINMAL gelesen (Lazy-Init im
  // Hook); migriereAgStand hydratisiert mit Typ-Guards je Feld.
  const { a, setA, schritt, setSchritt } = useWizardState<AgStand>({
    defaults: agStandDefaults(),
    speicherKey: STORAGE_KEY,
    normalisieren: migriereAgStand,
  });

  // Feld-Setter in der Signatur der früheren useState-Setter — damit bleibt
  // die AgSchrittCtx-Schnittstelle (Dispatch<SetStateAction<…>>) unverändert.
  const setzer = <K extends keyof AgStand>(k: K): Dispatch<SetStateAction<AgStand[K]>> => (v) =>
    setA((alt) => ({ ...alt, [k]: typeof v === 'function' ? (v as (vorher: AgStand[K]) => AgStand[K])(alt[k]) : v }));

  // Zeilen-Keys: die Hydration vergibt je Liste 1…n neu, der Zähler startet
  // strikt oberhalb der längsten Liste. Der früher persistierte Zählerstand
  // entfällt BEWUSST (D6): Keys sind reine React-Identitäten; nach jedem
  // Reload sind alle Listen-Keys ≤ maxLen, der Seed 1+maxLen liegt darüber
  // und wächst in der Session monoton — kollisionsfrei (Gegenprüfung M1).
  const naechsterKey = useRef(1 + Math.max(0,
    ...[a.gruender, a.vr, a.vertretungen, a.sacheinlagen, a.verrechnungen, a.vorteile].map((l) => l.length)));
  const neuerKey = () => naechsterKey.current++;

  const weichen = useMemo(() => {
    const betrag = Number(a.leistungen.replace(/['’\s]/g, ''));
    return {
      einlageArt: a.einlageArt,
      besondereVorteile: a.besondereVorteile,
      optingOut: a.optingOut,
      eigeneBueros: a.eigeneBueros,
      immobilienHauptzweck: a.immobilienHauptzweck,
      inhaberaktien: a.inhaberaktien,
      fremdwaehrung: a.fremdwaehrung,
      bankInUrkundeGenannt: a.bankInUrkunde,
      chWohnsitzVertretung: a.chVertretung,
      leistungenChf: a.leistungen.trim() === '' || Number.isNaN(betrag) ? undefined : betrag,
    };
  }, [a.einlageArt, a.besondereVorteile, a.optingOut, a.eigeneBueros, a.immobilienHauptzweck, a.inhaberaktien, a.fremdwaehrung, a.bankInUrkunde, a.chVertretung, a.leistungen]);

  const checkliste = useMemo(() => agGruendungsunterlagen(weichen), [weichen]);

  const antworten: AgDokAntworten = useMemo(() => ({
    ...weichen,
    ...AG_DOK_DEFAULTS,
    firma: a.firma, sitz: a.sitz, kanton: a.kanton, zweck: a.zweck, zweckErweiterung: a.zweckErweiterung,
    aktienkapitalChf: a.ak, anzahlAktien: a.anzahl, nennwertChf: a.nennwert,
    liberierungProzent: a.liberierung, ausgabebetragChf: a.ausgabebetrag,
    gruender: a.gruender, verwaltungsraete: a.vr, weitereVertretungen: a.vertretungen,
    protokollfuehrerName: a.protokollfuehrer,
    bankName: a.bankName, bankOrt: a.bankOrt, rechtsdomizilAdresse: a.rechtsdomizil,
    domizilhalterName: a.domizilhalterName, domizilhalterAdresse: a.domizilhalterAdresse,
    revisionsstelleName: a.rsName, revisionsstelleSitz: a.rsSitz,
    vinkulierung: a.vinkulierung, virtuelleGv: a.virtuelleGv, statutenUmfang: a.statutenUmfang,
    gjBeginn: a.gjBeginn, gjEnde: a.gjEnde,
    inhaberKotiert: a.inhaberKotiert, verwahrungsstelle: a.verwahrungsstelle,
    schiedsklausel: a.schiedsklausel, schiedsOrt: a.schiedsOrt, kapitalband: a.kapitalband,
    kbUntergrenze: a.kbUntergrenze, kbObergrenze: a.kbObergrenze,
    kbEndeDatum: a.kbEndeDatum, kbRichtung: a.kbRichtung,
    bedingtesKapital: a.bedingtesKapital, bkBetrag: a.bkBetrag, bkKreis: a.bkKreis,
    stichentscheidGv: a.stichentscheidGv, gjErstesEnde: a.gjErstesEnde,
    sitzungBeginn: a.sitzungBeginn, sitzungEnde: a.sitzungEnde,
    nachtragsbevollmaechtigter: a.nachtragsbevollmaechtigter,
    waehrung: a.waehrung, kursChf: a.kursChf, kursQuelle: a.kursQuelle,
    lexKollerAuslandBeteiligt: a.lkAusland, lexKollerNeuerwerb: a.lkNeuerwerb, lexKollerGrundstueckErwerb: a.lkGrundstueck,
    konstituierungInUrkunde: a.konstituierungInUrkunde, domizilNurAnmeldung: a.domizilNurAnmeldung,
    nachtragAktiv: a.nachtragAktiv, nachtragGruendungsdatum: a.ntGruendungsdatum,
    nachtragUrkundeZiffer: a.ntUrkundeZiffer, nachtragUrkundeText: a.ntUrkundeText,
    nachtragStatutenArtikel: a.ntStatutenArtikel, nachtragStatutenAbsatz: a.ntStatutenAbsatz, nachtragStatutenText: a.ntStatutenText,
    sacheinlagen: a.sacheinlagen, verrechnungen: a.verrechnungen, vorteile: a.vorteile,
    revisorName: a.revisorName, ort: a.ort, datum: a.datum,
  }), [weichen, a]);

  const mappe = useMemo(() => agDokumentmappe(antworten), [antworten]);

  // Stufe 2 P1a: Beträge der qualifizierten Gründung sind Beträge in der
  // KAPITALWÄHRUNG — die Feld-Labels führen den wirksamen Währungscode.
  const wc = a.fremdwaehrung && (AG_FREMDWAEHRUNGEN as readonly string[]).includes(a.waehrung) ? a.waehrung : 'CHF';

  // Etappe 5/D23: FINMA-Wortprüfung über Firma + Zweck — Regel lebt in der
  // Engine-Schicht (gruendungsunterlagen.finmaBegriffsTreffer, §3).
  const finmaTreffer = useMemo(() => finmaBegriffsTreffer(a.firma, a.zweck), [a.firma, a.zweck]);

  // Praxis-Runde (Auftrag David): Blocker klickbar — Klick springt zum
  // Schritt, in dem die Eingabe liegt (Bereichs-Tag aus den Engine-Gates).
  const blockerKlickbar = (titel: string) => mappe.gates.blockerDetails.length === 0 ? null : (
    <div className="lc-notice lc-notice-danger space-y-1.5" role="alert">
      <p className="text-body-s font-medium text-danger-700">{titel}</p>
      {mappe.gates.blockerDetails.map((b) => (
        <button key={b.text} type="button"
          onClick={() => setSchritt(BEREICH_SCHRITT[b.bereich])}
          className="block w-full text-left text-body-s text-danger-700 hover:underline">
          • {b.text} <span aria-hidden>→ {SCHRITTE[BEREICH_SCHRITT[b.bereich]].label}</span>
        </button>
      ))}
    </div>
  );

  // Punkt 6 (Perfektion): Sammel-Download als EIN ZIP — alle Dokumente der
  // Mappe via vorlagenPdfDokument (jsPDF-Doc, NICHT …Erzeugen) zu
  // ArrayBuffers, mit fflate gepackt; Banner je ausgabeArt wie beim
  // Einzel-Export. Einzel-Downloads (MappenAnsicht) bleiben bestehen.
  // Auftrag David 7.6.2026: neben PDF auch Word — je Dokument liegt
  // zusätzlich ein DOCX im ZIP (Form-Gate §8 prüft vorlagenDocxDokument).
  const docxErlaubt = card?.modus === 'vorlage' && (card.output?.includes('docx') ?? false);
  const [batchLaeuft, setBatchLaeuft] = useState(false);
  const [batchMeldung, setBatchMeldung] = useState<string | null>(null);
  const alleHerunterladen = async () => {
    setBatchLaeuft(true);
    setBatchMeldung(null);
    try {
      const [{ vorlagenPdfDokument }, { vorlagenDocxDokument }, { zipSync }] = await Promise.all([
        import('../lib/vorlagen/vorlagenPdf'),
        import('../lib/vorlagen/vorlagenDocx'),
        import('fflate'),
      ]);
      const eintraege: Record<string, Uint8Array> = {};
      // Mehrere gleichnamige Dokumente (z. B. zwei Sacheinlageverträge)
      // dürfen sich im ZIP nicht überschreiben → Suffix -2, -3, …
      const frei = (basis: string, endung: string) => {
        let name = `${basis}.${endung}`;
        for (let n = 2; name in eintraege; n++) name = `${basis}-${n}.${endung}`;
        return name;
      };
      const docxUebersprungen: string[] = [];
      // Gewählten Ausgabe-Stil (nüchtern⇄modern) auch im Sammel-ZIP
      // respektieren — sonst ignoriert der Bulk-Export die Wizard-Wahl.
      const stil = getAusgabeStil();
      for (const d of mappe.dokumente) {
        const entwurf = d.ergebnis.dokument.ausgabeArt === 'entwurf';
        const banner = entwurf ? BANNER_ENTWURF : BANNER_MAPPE_FERTIG;
        const doc = vorlagenPdfDokument(d.ergebnis, { banner, stil });
        eintraege[frei(d.dateiName, 'pdf')] = new Uint8Array(doc.output('arraybuffer'));
        if (docxErlaubt) {
          // Per-Dokument-Guard (Bug-Check 7.6.2026 N-1): ein einzelnes
          // Word-gesperrtes Dokument (z. B. künftige abschrift-Ausgabe-
          // art, §8-Gate in vorlagenDocx) darf nicht den GESAMTEN ZIP
          // abbrechen — das PDF ist dann schon drin, Word wird ehrlich
          // als übersprungen gemeldet.
          try {
            const blob = await vorlagenDocxDokument(d.ergebnis, { banner, stil });
            eintraege[frei(d.dateiName, 'docx')] = new Uint8Array(await blob.arrayBuffer());
          } catch {
            docxUebersprungen.push(d.dateiName);
          }
        }
      }
      const slug = (a.firma.trim().toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) || 'ag';
      const blob = new Blob([zipSync(eintraege)], { type: 'application/zip' });
      const url = URL.createObjectURL(blob);
      const anker = document.createElement('a');
      anker.href = url;
      anker.download = `gruendung-${slug}.zip`;
      anker.click();
      URL.revokeObjectURL(url);
      const docxHinweis = docxUebersprungen.length > 0
        ? `, Word übersprungen für: ${docxUebersprungen.join(', ')}`
        : (docxErlaubt ? ', je als PDF und Word' : '');
      setBatchMeldung(`${mappe.dokumente.length} Dokumente als ZIP heruntergeladen (gruendung-${slug}.zip${docxHinweis}).`);
    } catch (e) {
      setBatchMeldung(e instanceof Error ? e.message : 'Der Sammel-Download ist fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setBatchLaeuft(false);
    }
  };

  // Punkt 7: Zurücksetzen löscht auch die lokale Zwischenspeicherung —
  // sonst hydratisiert der Reload den alten Stand sofort wieder.
  const zuruecksetzen = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Speicher blockiert — Reload setzt dann nur die Sitzung zurück.
    }
    window.location.reload();
  };

  // P9 (Perfektion) → V5 (W2·29-WERKBANK-VORLAGEN): «Mit Musterdaten füllen»
  // sitzt jetzt im Rahmen-Kopf wie bei allen Vorlagen; der Datensatz (Golden-
  // Fall ag:gemischt-qualifiziert) liegt in components/vorlagen/musterdaten.ts
  // (eine Quelle, §5). Vollständiger Ersatz des Stands (Defaults + Muster),
  // Nachfrage, wenn schon etwas eingegeben ist. Zeilen-Keys aus dem Zähler
  // der Seite (Updater bleiben pur).
  const musterdatenFuellen = () => musterdatenAnwenden(
    JSON.stringify(a) !== JSON.stringify(agStandDefaults()),
    () => { const muster = agMusterdaten(neuerKey); setA({ ...agStandDefaults(), ...muster }); },
  );

  // ── Schritt-Inhalte ──
  // §6-Datei-Split (Ziff. 6): die Schritt-Renderer liegen in Geschwister-
  // Dateien (src/pages/vorlage-ag-gruendung/). Alle Werte/Setter/Helfer aus dem
  // Komponenten-Scope werden in EINEM Ctx-Objekt gebündelt und unverändert an
  // die Render-Funktionen durchgereicht — reine Darstellung (§3), die JSX-
  // Bodies bleiben byte-identisch.
  const ctx: AgSchrittCtx = {
    einlageArt: a.einlageArt, setEinlageArt: setzer('einlageArt'),
    besondereVorteile: a.besondereVorteile, setBesondereVorteile: setzer('besondereVorteile'),
    optingOut: a.optingOut, setOptingOut: setzer('optingOut'),
    eigeneBueros: a.eigeneBueros, setEigeneBueros: setzer('eigeneBueros'),
    immobilienHauptzweck: a.immobilienHauptzweck, setImmobilienHauptzweck: setzer('immobilienHauptzweck'),
    inhaberaktien: a.inhaberaktien, setInhaberaktien: setzer('inhaberaktien'),
    fremdwaehrung: a.fremdwaehrung, setFremdwaehrung: setzer('fremdwaehrung'),
    bankInUrkunde: a.bankInUrkunde, setBankInUrkunde: setzer('bankInUrkunde'),
    chVertretung: a.chVertretung, setChVertretung: setzer('chVertretung'),
    leistungen: a.leistungen, setLeistungen: setzer('leistungen'),
    firma: a.firma, setFirma: setzer('firma'),
    sitz: a.sitz, setSitz: setzer('sitz'),
    kanton: a.kanton, setKanton: setzer('kanton'),
    zweck: a.zweck, setZweck: setzer('zweck'),
    zweckErweiterung: a.zweckErweiterung, setZweckErweiterung: setzer('zweckErweiterung'),
    statutenUmfang: a.statutenUmfang, setStatutenUmfang: setzer('statutenUmfang'),
    vinkulierung: a.vinkulierung, setVinkulierung: setzer('vinkulierung'),
    virtuelleGv: a.virtuelleGv, setVirtuelleGv: setzer('virtuelleGv'),
    inhaberKotiert: a.inhaberKotiert, setInhaberKotiert: setzer('inhaberKotiert'),
    verwahrungsstelle: a.verwahrungsstelle, setVerwahrungsstelle: setzer('verwahrungsstelle'),
    schiedsklausel: a.schiedsklausel, setSchiedsklausel: setzer('schiedsklausel'),
    schiedsOrt: a.schiedsOrt, setSchiedsOrt: setzer('schiedsOrt'),
    kapitalband: a.kapitalband, setKapitalband: setzer('kapitalband'),
    kbUntergrenze: a.kbUntergrenze, setKbUntergrenze: setzer('kbUntergrenze'),
    kbObergrenze: a.kbObergrenze, setKbObergrenze: setzer('kbObergrenze'),
    kbEndeDatum: a.kbEndeDatum, setKbEndeDatum: setzer('kbEndeDatum'),
    kbRichtung: a.kbRichtung, setKbRichtung: setzer('kbRichtung'),
    bedingtesKapital: a.bedingtesKapital, setBedingtesKapital: setzer('bedingtesKapital'),
    bkBetrag: a.bkBetrag, setBkBetrag: setzer('bkBetrag'),
    bkKreis: a.bkKreis, setBkKreis: setzer('bkKreis'),
    stichentscheidGv: a.stichentscheidGv, setStichentscheidGv: setzer('stichentscheidGv'),
    gjErstesEnde: a.gjErstesEnde, setGjErstesEnde: setzer('gjErstesEnde'),
    gjBeginn: a.gjBeginn, setGjBeginn: setzer('gjBeginn'),
    gjEnde: a.gjEnde, setGjEnde: setzer('gjEnde'),
    ak: a.ak, setAk: setzer('ak'),
    anzahl: a.anzahl, setAnzahl: setzer('anzahl'),
    nennwert: a.nennwert, setNennwert: setzer('nennwert'),
    liberierung: a.liberierung, setLiberierung: setzer('liberierung'),
    ausgabebetrag: a.ausgabebetrag, setAusgabebetrag: setzer('ausgabebetrag'),
    waehrung: a.waehrung, setWaehrung: setzer('waehrung'),
    kursChf: a.kursChf, setKursChf: setzer('kursChf'),
    kursQuelle: a.kursQuelle, setKursQuelle: setzer('kursQuelle'),
    bankName: a.bankName, setBankName: setzer('bankName'),
    bankOrt: a.bankOrt, setBankOrt: setzer('bankOrt'),
    sacheinlagen: a.sacheinlagen, setSacheinlagen: setzer('sacheinlagen'),
    verrechnungen: a.verrechnungen, setVerrechnungen: setzer('verrechnungen'),
    vorteile: a.vorteile, setVorteile: setzer('vorteile'),
    revisorName: a.revisorName, setRevisorName: setzer('revisorName'),
    gruender: a.gruender, setGruender: setzer('gruender'),
    vr: a.vr, setVr: setzer('vr'),
    vertretungen: a.vertretungen, setVertretungen: setzer('vertretungen'),
    protokollfuehrer: a.protokollfuehrer, setProtokollfuehrer: setzer('protokollfuehrer'),
    sitzungBeginn: a.sitzungBeginn, setSitzungBeginn: setzer('sitzungBeginn'),
    sitzungEnde: a.sitzungEnde, setSitzungEnde: setzer('sitzungEnde'),
    rsName: a.rsName, setRsName: setzer('rsName'),
    rsSitz: a.rsSitz, setRsSitz: setzer('rsSitz'),
    rechtsdomizil: a.rechtsdomizil, setRechtsdomizil: setzer('rechtsdomizil'),
    domizilhalterName: a.domizilhalterName, setDomizilhalterName: setzer('domizilhalterName'),
    domizilhalterAdresse: a.domizilhalterAdresse, setDomizilhalterAdresse: setzer('domizilhalterAdresse'),
    konstituierungInUrkunde: a.konstituierungInUrkunde, setKonstituierungInUrkunde: setzer('konstituierungInUrkunde'),
    domizilNurAnmeldung: a.domizilNurAnmeldung, setDomizilNurAnmeldung: setzer('domizilNurAnmeldung'),
    nachtragsbevollmaechtigter: a.nachtragsbevollmaechtigter, setNachtragsbevollmaechtigter: setzer('nachtragsbevollmaechtigter'),
    lkAusland: a.lkAusland, setLkAusland: setzer('lkAusland'),
    lkNeuerwerb: a.lkNeuerwerb, setLkNeuerwerb: setzer('lkNeuerwerb'),
    lkGrundstueck: a.lkGrundstueck, setLkGrundstueck: setzer('lkGrundstueck'),
    nachtragAktiv: a.nachtragAktiv, setNachtragAktiv: setzer('nachtragAktiv'),
    ntGruendungsdatum: a.ntGruendungsdatum, setNtGruendungsdatum: setzer('ntGruendungsdatum'),
    ntUrkundeZiffer: a.ntUrkundeZiffer, setNtUrkundeZiffer: setzer('ntUrkundeZiffer'),
    ntUrkundeText: a.ntUrkundeText, setNtUrkundeText: setzer('ntUrkundeText'),
    ntStatutenArtikel: a.ntStatutenArtikel, setNtStatutenArtikel: setzer('ntStatutenArtikel'),
    ntStatutenAbsatz: a.ntStatutenAbsatz, setNtStatutenAbsatz: setzer('ntStatutenAbsatz'),
    ntStatutenText: a.ntStatutenText, setNtStatutenText: setzer('ntStatutenText'),
    ort: a.ort, setOrt: setzer('ort'),
    datum: a.datum, setDatum: setzer('datum'),
    wc, finmaTreffer, checkliste, mappe, card, neuerKey,
    blockerKlickbar, alleHerunterladen, batchLaeuft, batchMeldung,
  };
  const inhalteRoh = [
    <SchrittKonstellation ctx={ctx} />,
    <SchrittGesellschaft ctx={ctx} />,
    <SchrittKapital ctx={ctx} />,
    <SchrittPersonen ctx={ctx} />,
    <SchrittWeiteres ctx={ctx} />,
    <SchrittDokumente ctx={ctx} />,
  ];
  // In den Eingabe-Schritten unten eine kompakte, klickbare Offen-Liste
  // (Engine-Reihenfolge; Praxis-Check NIEDRIG-2: Kommentar präzisiert).
  const inhalte = inhalteRoh.map((inhalt, i) => i === inhalteRoh.length - 1 ? inhalt : (
    <div className="space-y-4">
      {/* P10 (Perfektion): Feldmarkierung — der Schritt, in dem Eingaben
          fehlen, trägt oben eine rote Sektion mit SEINEN Blockern
          (Zuordnung aus den Engine-Bereichs-Tags, §3). */}
      {mappe.gates.blockerDetails.some((b) => BEREICH_SCHRITT[b.bereich] === i) && (
        <div className="lc-notice lc-notice-danger space-y-1" role="alert">
          <p className="text-body-s font-medium text-danger-700">In diesem Schritt noch offen:</p>
          {mappe.gates.blockerDetails.filter((b) => BEREICH_SCHRITT[b.bereich] === i).map((b) => (
            <p key={b.text} className="text-body-s text-danger-700">• {b.text}</p>
          ))}
        </div>
      )}
      {inhalt}
      {mappe.gates.blockerDetails.length > 0 && (
        <details className="border border-line bg-surface p-3">
          <summary className="cursor-pointer select-none text-body-s text-ink-700">
            Für die Dokumente noch offen: {mappe.gates.blockerDetails.length} Punkt{mappe.gates.blockerDetails.length === 1 ? '' : 'e'}
          </summary>
          <div className="pt-2 space-y-1">
            {mappe.gates.blockerDetails.map((b) => (
              <button key={b.text} type="button"
                onClick={() => setSchritt(BEREICH_SCHRITT[b.bereich])}
                className="block w-full text-left text-body-s text-ink-700 hover:text-brass-700 hover:underline">
                • {b.text} <span aria-hidden className="text-ink-500">→ {SCHRITTE[BEREICH_SCHRITT[b.bereich]].label}</span>
              </button>
            ))}
          </div>
        </details>
      )}
    </div>
  ));

  // P8 (Perfektion): Vorschau-Wahl — Dropdown über die Mappen-Dokumente
  // (Default Statuten); fällt auf das erste Dokument zurück, wenn die
  // gewählte Weiche wegfällt. Navigations-State, bewusst NICHT persistiert.
  const [aktivesVorschauDok, setAktivesVorschauDok] = useState('statuten');
  const vorschauDok = mappe.dokumente.find((d) => d.id === aktivesVorschauDok) ?? mappe.dokumente[0];
  const vorschau = mappe.dokumente.length > 0
    ? (
      <div className="space-y-3">
        <div className="px-4 pt-4">
          <Field label="Dokument der Vorschau">
            <select className={inputCls} value={vorschauDok.id} onChange={(e) => setAktivesVorschauDok(e.target.value)}>
              {mappe.dokumente.map((d) => <option key={d.id} value={d.id}>{d.titel}</option>)}
            </select>
          </Field>
        </div>
        <VorschauPanel ergebnis={vorschauDok.ergebnis} />
      </div>
    )
    : (
      // `data-dokument-platz` (QS-UI 8b Teil 2): Diese Fläche trug als EINZIGE der
      // drei Dokumentmappen-Flächen bereits einen echten Leerzustand — sie behält
      // ihn (er nennt zusätzlich die offenen Blocker und ist damit reicher als der
      // geteilte `ErgebnisPlatzhalter`); sie bekommt nur den Griff, damit das Tor
      // alle drei gleich prüft. Die anderen beiden zeigten an dieser Stelle nichts.
      <div data-dokument-platz className="p-4 space-y-2">
        <p className="text-body-s font-medium text-ink-900">Noch keine Dokumente</p>
        <p className="text-body-s text-ink-600">
          Die Vorschau erscheint, sobald die Pflichtangaben vollständig sind:
        </p>
        <ul className="lc-list space-y-1 text-xs text-ink-600">
          {mappe.gates.blocker.slice(0, 8).map((b) => <li key={b}><NormText text={b} /></li>)}
        </ul>
      </div>
    );

  return (
    <VorlagenWizardRahmen
      zurueckHref="/vorlagen"
      overline="Gesellschaftsrecht · Vorlage"
      titel="AG-Gründungsunterlagen"
      intro={
        <>
          Schritt für Schritt zur vollständigen Dokumentmappe: Statuten und Errichtungsakt als ENTWURF
          für die Urkundsperson (die öffentliche Beurkundung bleibt zwingend, Art. 629 OR), Wahlannahmen,
          VR-Protokoll, Sacheinlageverträge, Gründungsbericht, Lex-Koller-Erklärung und
          Handelsregister-Anmeldung druckfertig — am Schluss mit Checkliste (Art. 43/44 HRegV) und
          Sammel-Download aller notwendigen Dokumente.
        </>
      }
      norms={card?.norms ?? []}
      badge="Dokumentmappe (Urkunde als Entwurf)"
      fussnote="Eingaben verlassen den Browser nicht; lokale Zwischenspeicherung auf diesem Gerät — «Zurücksetzen» löscht sie."
      zuruecksetzen={zuruecksetzen}
      musterdaten={musterdatenFuellen}
      schritte={SCHRITTE}
      schritt={schritt}
      setSchritt={setSchritt}
      weiterDeaktiviert={false}
      inhalt={inhalte[schritt]}
      vorschau={vorschau}
    />
  );
}
