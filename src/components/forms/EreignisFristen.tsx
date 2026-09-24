import { useMemo, useState } from 'react';
import { Checkbox, ErgebnisPlatzhalter, Field, inputCls, NormLink } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { AbschnittKopf } from '../layout/AbschnittKopf';
import { DatumsFeld } from '../DatumsFeld';
import { AktenzeichenFeld } from '../AktenzeichenFeld';
import { BetragsFeld } from '../BetragsFeld';
import { IcsExportButton } from '../IcsExportButton';
import { ladeIcs } from '../icsDownload';
import { LinkTeilenButton } from '../LinkTeilenButton';
import { KANTONE } from '../../lib/kantone';
import { icsSammel } from '../../lib/icsExport';
import { permalinkKodieren, istISO } from '../../lib/permalink';
import { usePermalinkFelder } from '../../hooks/usePermalinkFelder';
import { FSP_LINK_SPEC } from '../../lib/rechnerPermalinks';
import {
  berechneVermieterkuendigungsSpiegel, VK_KUENDIGUNGSARTEN,
  type VermieterkuendigungSpiegelInput,
} from '../../lib/fristenspiegel/vermieterkuendigung';
import { berechneZivilentscheidsSpiegel } from '../../lib/fristenspiegel/zivilentscheid';
import { berechneZahlungsbefehlsSpiegel } from '../../lib/fristenspiegel/zahlungsbefehl';
import { berechneKlagebewilligungsSpiegel } from '../../lib/fristenspiegel/klagebewilligung';
import { berechneErbgangsSpiegel } from '../../lib/fristenspiegel/erbgang';
import { berechneAgKuendigungsSpiegel } from '../../lib/fristenspiegel/agKuendigung';
import type { Fristnatur, FristenspiegelErgebnis, SpiegelZeile } from '../../lib/fristenspiegel/typen';
import type { Kanton } from '../../types/legal';
import { getStandardKanton } from '../../lib/einstellungen';

// ─── Ereignis-Fristen (S-5c FAHRPLAN-STRUKTUR-UMBAU) ────────────────────────
// EIN Ereignis → ALLE parallelen Fristen als Tabelle. Reine Darstellung (§3):
// jede Zeile kommt aus lib/fristenspiegel/* (Orchestrierer über bestehende
// Engines); hier wird nichts gerechnet.
// Vorgeschichte: Bis 10.6.2026 war dies die Form des eigenständigen
// «Fristenspiegel»-Einstiegs (/rechner/fristenspiegel). Auftrag David
// 10.6.2026 abends: «Der Fristenspiegel soll aufgelöst werden und sofern
// ein Ereignis zu mehreren Fristen führt, das im jeweilig spezifischen
// Fristenrechner abgebildet werden.» — Der Block lebt jetzt EINGEBETTET in
// den Fach-Rechnern (ZPO: Zivilentscheid/Klagebewilligung · SchKG:
// Zahlungsbefehl · Erbrecht: Erbgang · Kündigung: 336b); die `ereignisse`-
// Prop filtert je Seite. Alte /rechner/fristenspiegel-Links (Teilen/.ics)
// leitet FristenspiegelRedirect mit derselben FSP-Query auf die Fach-Seite
// um (§8 — geteilte Links laufen nicht ins Leere).

export type Ereignis = 'vermieterkuendigung' | 'zivilentscheid' | 'zahlungsbefehl' | 'klagebewilligung' | 'erbgang' | 'agkuendigung';

const EREIGNISSE: { code: Ereignis; label: string }[] = [
  { code: 'zivilentscheid', label: 'Zustellung eines erstinstanzlichen Zivilentscheids' },
  { code: 'zahlungsbefehl', label: 'Zustellung des Zahlungsbefehls' },
  { code: 'klagebewilligung', label: 'Zustellung der Klagebewilligung' },
  { code: 'vermieterkuendigung', label: 'Zugang einer Vermieter-Kündigung (Wohn-/Geschäftsräume)' },
  { code: 'agkuendigung', label: 'Arbeitgeber-Kündigung: Ende der Kündigungsfrist (Art. 336b OR)' },
  { code: 'erbgang', label: 'Kenntnis des Erbgangs / Todesfall' },
];
const EREIGNIS_CODES = EREIGNISSE.map((e) => e.code);

function spiegelBeschreibung(z: SpiegelZeile): string {
  return [
    `${z.normRef} (${NATUR_LABEL[z.fristnatur]})`,
    z.bedingung ? `Bedingung: ${z.bedingung}` : undefined,
  ].filter((t): t is string => Boolean(t)).join('\n');
}

const NATUR_LABEL: Record<Fristnatur, string> = {
  gesetzlich: 'gesetzliche Frist', gerichtlich: 'gerichtliche Frist',
  verwirkung: 'Verwirkung', verjaehrung: 'Verjährung',
  wartefrist: 'Wartefrist', klagefrist: 'Klagefrist', ordnungsfrist: 'Ordnungsfrist',
};

// Norm-Chips über den GETEILTEN NormLink (Code-Review #6, 7.6.2026: die
// frühere lokale NormPill-Kopie war der einzige Chip ohne Locale-Logik).
function ZeileAnzeige({ z, aktenzeichen, query }: { z: SpiegelZeile; aktenzeichen: string; query: () => string }) {
  return (
    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-6 gap-y-2 sm:items-center">
      <div className="min-w-0 space-y-1">
        <p className="text-body-s font-medium text-ink-900">{z.label}</p>
        <p className="flex flex-wrap items-center gap-1.5">
          <NormLink artikel={z.normRef} title={`${z.normRef} auf Fedlex öffnen`} />
          <span className="lc-badge lc-badge-soft">{NATUR_LABEL[z.fristnatur]}</span>
        </p>
        {z.bedingung && <p className="text-xs text-ink-500">{z.bedingung}</p>}
      </div>
      <div className="flex items-center gap-3 sm:justify-end">
        {z.status === 'berechnet' || (z.status === 'bedingt' && z.endeText) ? (
          <>
            <span className="num text-body-l font-semibold text-ink-900 whitespace-nowrap">{z.endePraefix ?? 'bis'} {z.endeText}</span>
            {/* Wartefrist («frühestens ab»): keine 3-Tage-VORfrist-Erinnerung —
                Mahnung vor dem frühestmöglichen Termin wäre richtungsverkehrt
                (Deploy-Bug-Check 7.6.2026, NIEDRIG). */}
            <IcsExportButton endISO={z.endeISO} titel={z.label} className="lc-btn-outline lc-btn-sm"
              vorfristTage={z.fristnatur === 'wartefrist' ? 0 : 3}
              aktenzeichen={aktenzeichen} query={query}
              dateiName={`${z.key}.ics`}
              beschreibung={spiegelBeschreibung(z)} />
          </>
        ) : (
          <span className="lc-badge lc-badge-warn">
            {z.status === 'ausgeschlossen' ? 'ausgeschlossen' : 'Hinweis'}
          </span>
        )}
      </div>
    </div>
  );
}

/** Karten-Sektion für die Fach-Rechner-Seiten: Überschrift + Ereignis-Block.
 *  `id` dient als Sprungziel (z. B. #ereignis-336b aus dem Sperrfristen-
 *  Rechner); `zustellungVorgabe` füllt das Ereignisdatum live vom Rechner
 *  derselben Seite vor (ersetzt die alte Permalink-Brücke verlustfrei —
 *  die Sperrfristen-VERSCHIEBUNG bleibt im Datum enthalten). */
export function EreignisFristenSektion({ ereignisse, id, zustellungVorgabe }: {
  ereignisse: Ereignis[]; id?: string; zustellungVorgabe?: string | null;
}) {
  return (
    <section id={id} aria-label="Ereignis-Fristen"
      className="lc-werkzeug-karte p-6 sm:p-8 space-y-4 scroll-mt-28">
      {/* R5b: Abschnitt mit Registerstrich wie die Rechner-Karte (`Card`), nicht
          mehr der erhöhte Kasten — Kopf aus `AbschnittKopf`. */}
      <AbschnittKopf titel="Ereignis-Fristen – ein Anlass, mehrere Fristen">
        Ein Ereignis löst mehrere Fristen parallel aus – die Tabelle zeigt sie
        mit Norm und Fristnatur, einzeln oder gesammelt als Kalender-Export
        (gerechnet von denselben Engines wie der Rechner oben).
      </AbschnittKopf>
      <EreignisFristen ereignisse={ereignisse} zustellungVorgabe={zustellungVorgabe} />
    </section>
  );
}

function EreignisFristen({ ereignisse, zustellungVorgabe }: {
  ereignisse: Ereignis[]; zustellungVorgabe?: string | null;
}) {
  const erlaubt = EREIGNISSE.filter((e) => ereignisse.includes(e.code));
  // Vorbefüllung aus dem Permalink (Brücken-/Redirect-Ziel; SSR-sicher).
  const start = usePermalinkFelder(FSP_LINK_SPEC);

  const [ereignis, setEreignis] = useState<Ereignis>(
    EREIGNIS_CODES.includes(start.ereignis as Ereignis) && ereignisse.includes(start.ereignis as Ereignis)
      ? (start.ereignis as Ereignis) : erlaubt[0].code);
  const [kanton, setKanton] = useState<Kanton>((start.kanton as Kanton) ?? getStandardKanton());

  // ── A.4 Vermieter-Kündigung ──
  const [zugang, setZugang] = useState<string>(start.zugang ?? '');
  const [objekt, setObjekt] = useState<VermieterkuendigungSpiegelInput['objekt']>(start.objekt ?? 'wohnung');
  const [kuendigungsart, setKuendigungsart] = useState<VermieterkuendigungSpiegelInput['kuendigungsart']>(start.kuendigungsart ?? 'ordentlich');

  // ── A.1 Zivilentscheid ──
  const [zustellung, setZustellung] = useState<string>(start.zustellung ?? '');
  // Live-Vorgabe vom Rechner derselben Seite (S-5c, z. B. 336b-Beendigung):
  // Sync während des Renderns («adjusting state»); manuelle Edits bleiben
  // erhalten, bis sich die Vorgabe erneut ändert.
  const [letzteVorgabe, setLetzteVorgabe] = useState(zustellungVorgabe ?? null);
  if ((zustellungVorgabe ?? null) !== letzteVorgabe) {
    setLetzteVorgabe(zustellungVorgabe ?? null);
    if (zustellungVorgabe && istISO(zustellungVorgabe)) setZustellung(zustellungVorgabe);
  }
  const [vermoegensrechtlich, setVermoegensrechtlich] = useState<boolean>(start.vermoegensrechtlich ?? true);
  const [streitwertRoh, setStreitwertRoh] = useState<string>(start.streitwertCHF != null ? String(start.streitwertCHF) : '');
  const [verfahren, setVerfahren] = useState<'ordentlich_vereinfacht' | 'summarisch'>(start.verfahren ?? 'ordentlich_vereinfacht');
  const [familienSummarsache, setFamilienSummarsache] = useState<boolean>(start.familienSummarsache ?? false);
  const [mietOderArbeit, setMietOderArbeit] = useState<boolean>(start.mietOderArbeit ?? false);
  const [nurDispositiv, setNurDispositiv] = useState<boolean>(start.nurDispositiv ?? false);
  const streitwert = streitwertRoh.trim() === '' ? null : Number(streitwertRoh);

  // ── A.7 Klagebewilligung · A.6 Erbgang ──
  const [mietOderPacht, setMietOderPacht] = useState<boolean>(start.mietOderPacht ?? false);
  const [erbenstellung, setErbenstellung] = useState<'gesetzlich' | 'eingesetzt'>(start.erbenstellung ?? 'gesetzlich');

  // Mandats-Referenz für die Kalender-Einträge (Beschriftung 7.6.2026);
  // bewusst NICHT im Permalink (bleibt im Browser, wie überall).
  const [aktenzeichen, setAktenzeichen] = useState('');

  const ergebnis: FristenspiegelErgebnis | null = useMemo(() => {
    try {
      if (ereignis === 'vermieterkuendigung') {
        if (!istISO(zugang)) return null;
        return berechneVermieterkuendigungsSpiegel({ zugang, objekt, kanton, kuendigungsart });
      }
      if (!istISO(zustellung)) return null;
      if (ereignis === 'zahlungsbefehl') return berechneZahlungsbefehlsSpiegel({ zustellung, kanton });
      if (ereignis === 'klagebewilligung') return berechneKlagebewilligungsSpiegel({ zustellung, kanton, mietOderPacht });
      if (ereignis === 'erbgang') return berechneErbgangsSpiegel({ datum: zustellung, kanton, erbenstellung });
      if (ereignis === 'agkuendigung') return berechneAgKuendigungsSpiegel({ beendigung: zustellung });
      // Streitwert 0 ist bei einer VERMÖGENSrechtlichen Streitigkeit
      // widersprüchlich (nicht vermögensrechtlich = eigene Checkbox) —
      // wie eine fehlende Eingabe behandeln (Code-Review #4, 7.6.2026).
      if (vermoegensrechtlich && (streitwert === null || !Number.isFinite(streitwert) || streitwert <= 0)) return null;
      return berechneZivilentscheidsSpiegel({
        zustellung, kanton, vermoegensrechtlich,
        streitwertCHF: vermoegensrechtlich ? streitwert : null,
        verfahren, familienSummarsache: verfahren === 'summarisch' ? familienSummarsache : false,
        mietOderArbeit, nurDispositiv,
      });
    } catch { return null; }
  }, [ereignis, zugang, objekt, kanton, kuendigungsart, zustellung, vermoegensrechtlich, streitwert, verfahren, familienSummarsache, mietOderArbeit, nurDispositiv, mietOderPacht, erbenstellung]);

  // Download über den geteilten Helfer (Code-Review #8); Wartefristen ohne
  // Vorfrist-Alarm — wie beim Einzel-Export (richtungsverkehrte Mahnung).
  const spiegelQuery = () => permalinkKodieren(FSP_LINK_SPEC, linkWerte());
  const sammelIcs = () => {
    if (!ergebnis) return;
    const url = `${location.origin}${location.pathname}${spiegelQuery()}`;
    const eintraege = ergebnis.zeilen
      .filter((z) => z.endeISO)
      .map((z) => ({
        titel: z.label, endISO: z.endeISO!, beschreibung: spiegelBeschreibung(z),
        aktenzeichen: aktenzeichen.trim() || undefined, url,
        vorfristTage: z.fristnatur === 'wartefrist' ? 0 : 3,
      }));
    ladeIcs('Fristenspiegel.ics', icsSammel(eintraege));
  };

  const linkWerte = () => {
    switch (ereignis) {
      case 'vermieterkuendigung': return { ereignis, kanton, zugang, objekt, kuendigungsart };
      case 'zahlungsbefehl': return { ereignis, kanton, zustellung };
      case 'klagebewilligung': return { ereignis, kanton, zustellung, mietOderPacht };
      case 'erbgang': return { ereignis, kanton, zustellung, erbenstellung };
      case 'agkuendigung': return { ereignis, zustellung };
      default: return { ereignis, kanton, zustellung, vermoegensrechtlich, streitwertCHF: vermoegensrechtlich ? streitwert ?? undefined : undefined, verfahren, familienSummarsache, mietOderArbeit, nurDispositiv };
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {erlaubt.length > 1 ? (
          <Field label="Ereignis" hint="Was wurde zugestellt / ist eingetreten?">
            <select value={ereignis} onChange={(e) => setEreignis(e.target.value as Ereignis)} className={inputCls} aria-label="Ereignis">
              {erlaubt.map((e) => <option key={e.code} value={e.code}>{e.label}</option>)}
            </select>
          </Field>
        ) : (
          <Field label="Ereignis">
            <p className="text-body-s text-ink-700 mt-2">{erlaubt[0].label}</p>
          </Field>
        )}

        {ereignis === 'vermieterkuendigung' ? (
          <>
            <Field label="Ereignisdatum" hint="Empfang der Kündigung (absolute Empfangstheorie)">
              <DatumsFeld value={zugang} onChange={setZugang} aria-label="Empfang der Kündigung" />
            </Field>
            <Field label="Mietobjekt">
              <select value={objekt} onChange={(e) => setObjekt(e.target.value as VermieterkuendigungSpiegelInput['objekt'])} className={inputCls}>
                <option value="wohnung">Wohnräume</option>
                <option value="geschaeftsraum">Geschäftsräume</option>
              </select>
            </Field>
            <Field label="Kündigungsart" hint="Art. 257d/257f schliessen die Erstreckung aus (Art. 272a OR)">
              <select value={kuendigungsart} onChange={(e) => setKuendigungsart(e.target.value as VermieterkuendigungSpiegelInput['kuendigungsart'])} className={inputCls}>
                {VK_KUENDIGUNGSARTEN.map((a) => <option key={a.code} value={a.code}>{a.label}</option>)}
              </select>
            </Field>
            <Field label="Kanton" hint="Feiertage für Art. 78 OR (Werktagsverschiebung)">
              <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className={inputCls}>
                {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
          </>
        ) : ereignis === 'zivilentscheid' ? (
          <>
            <Field label="Ereignisdatum" hint={nurDispositiv ? 'Eröffnung des Dispositivs' : 'Zustellung des begründeten Entscheids'}>
              <DatumsFeld value={zustellung} onChange={setZustellung} aria-label="Zustellung des Entscheids" />
            </Field>
            <Field label="Verfahren" hint="summarisch: 10 Tage, kein Stillstand (Art. 145 Abs. 2 lit. b ZPO)">
              <select value={verfahren} onChange={(e) => setVerfahren(e.target.value as 'ordentlich_vereinfacht' | 'summarisch')} className={inputCls}>
                <option value="ordentlich_vereinfacht">ordentlich / vereinfacht</option>
                <option value="summarisch">summarisch</option>
              </select>
            </Field>
            <Field label="Streitwert (CHF)" hint="massgeblich: zuletzt aufrechterhaltene Rechtsbegehren (Art. 308 Abs. 2 ZPO)">
              <div className="space-y-2">
                <BetragsFeld value={streitwertRoh} onChange={setStreitwertRoh} className={inputCls}
                  placeholder="z. B. 12'000" aria-label="Streitwert in Franken" />
                <Checkbox checked={!vermoegensrechtlich} onChange={(v) => setVermoegensrechtlich(!v)} label="nicht vermögensrechtliche Streitigkeit" />
              </div>
            </Field>
            <Field label="Kanton" hint="Gerichtsort — Feiertage für die Endnormalisierung (Art. 142 Abs. 3 ZPO)">
              <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className={inputCls}>
                {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Weichen">
              <div className="space-y-2">
                {verfahren === 'summarisch' && (
                  <Checkbox checked={familienSummarsache} onChange={setFamilienSummarsache} label="familienrechtliche Summarsache (Art. 271/276/302/305 ZPO — 30 Tage, Art. 314 Abs. 2)" />
                )}
                <Checkbox checked={mietOderArbeit} onChange={setMietOderArbeit} label="arbeits- oder mietrechtlicher Fall (BGer-Grenze CHF 15'000, Art. 74 Abs. 1 lit. a BGG)" />
                <Checkbox checked={nurDispositiv} onChange={setNurDispositiv} label="nur das Dispositiv wurde eröffnet (Art. 239 ZPO — zuerst Begründung verlangen)" />
              </div>
            </Field>
          </>
        ) : (
          <>
            <Field label={ereignis === 'agkuendigung' ? 'Ende der Kündigungsfrist' : 'Ereignisdatum'}
              hint={ereignis === 'zahlungsbefehl' ? 'Löst Fristen für Rechtsvorschlag (Art. 74 SchKG) und Fortsetzungsbegehren (Art. 88 SchKG) aus'
                : ereignis === 'klagebewilligung' ? 'Eröffnung/Zustellung der Klagebewilligung'
                : ereignis === 'agkuendigung' ? 'Beendigung des Arbeitsverhältnisses — im Sperrfristen-Rechner berechnen'
                : erbenstellung === 'gesetzlich' ? 'Kenntnis vom Tod des Erblassers (Art. 567 Abs. 2 ZGB)'
                : 'Zugang der amtlichen Mitteilung von der Verfügung (Art. 567 Abs. 2 ZGB)'}>
              <DatumsFeld value={zustellung} onChange={setZustellung} aria-label="Ereignisdatum" />
            </Field>
            {ereignis === 'klagebewilligung' && (
              <Field label="Streitsache">
                <Checkbox checked={mietOderPacht} onChange={setMietOderPacht} label="Miete/Pacht von Wohn- und Geschäftsräumen bzw. landw. Pacht (30 Tage, Art. 209 Abs. 4 ZPO)" className="mt-2" />
              </Field>
            )}
            {ereignis === 'erbgang' && (
              <Field label="Erbenstellung" hint="bestimmt den Fristbeginn (Art. 567 Abs. 2 ZGB)">
                <select value={erbenstellung} onChange={(e) => setErbenstellung(e.target.value as 'gesetzlich' | 'eingesetzt')} className={inputCls}>
                  <option value="gesetzlich">gesetzliche Erbin / gesetzlicher Erbe</option>
                  <option value="eingesetzt">eingesetzte Erbin / eingesetzter Erbe</option>
                </select>
              </Field>
            )}
            {ereignis !== 'agkuendigung' && (
              <Field label="Kanton"
                hint={ereignis === 'zahlungsbefehl' ? 'Staatlich anerkannte Feiertage (Endregel)' : 'Feiertage für die Werktags-/Endregel'}>
                <select value={kanton} onChange={(e) => setKanton(e.target.value as Kanton)} className={inputCls}>
                  {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
            )}
          </>
        )}
      </div>

      {/* LM-169 (B6/K-15): ohne Ereignisdatum blieb eine leere Fläche vor dem
          Footer stehen — der Block kündigt eine Tabelle an, ohne zu sagen, dass
          sie noch fehlt (§8). Geteilter Baustein (§5/§10), wie am Streitwert-
          Rechner. Betrifft alle vier Fach-Rechner, die diese Sektion einbetten
          (ZPO-/SchKG-/Erb-Fristen, Kündigung — s. o., EIN Fundort). */}
      {!ergebnis && (
        <ErgebnisPlatzhalter was="Ereignisdatum eingeben — hier erscheinen alle daraus ausgelösten Fristen als Tabelle." />
      )}

      {ergebnis && (
        <div className="space-y-4">
          {/* Fristen-Tabelle: jede Zeile = ein Engine-Resultat */}
          <div className="border border-line overflow-hidden">
            <div className="px-4 py-3 bg-surface border-b border-line flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-body-s font-medium text-ink-700">
                Fristen ab {ergebnis.ereignisDatumISO.split('-').reverse().join('.')}
              </p>
              <p className="lc-overline"><span className="num">{ergebnis.zeilen.length}</span> Zeilen</p>
            </div>
            <div className="divide-y divide-line">
              {ergebnis.zeilen.map((z) => <ZeileAnzeige key={z.key} z={z} aktenzeichen={aktenzeichen} query={spiegelQuery} />)}
            </div>
          </div>

          <AktenzeichenFeld value={aktenzeichen} onChange={setAktenzeichen} />
          <div className="flex flex-wrap gap-3">
            <button type="button" className="lc-btn-primary" onClick={sammelIcs}
              disabled={!ergebnis.zeilen.some((z) => z.endeISO)}>
              Alle Fristen als Kalender (.ics)
            </button>
            <LinkTeilenButton query={spiegelQuery} />
          </div>

          {ergebnis.warnungen.length > 0 && (
            <div className="lc-notice-warn">
              <p className="lc-overline mb-1">Hinweise &amp; Weichen</p>
              {ergebnis.warnungen.map((w, i) => <p key={i} className="text-body-s text-warn-700"><NormText text={w} /></p>)}
            </div>
          )}
          <div className="lc-notice">
            <p className="lc-overline mb-1">Annahmen</p>
            {ergebnis.annahmen.map((a, i) => <p key={i} className="text-body-s text-ink-600">• {a}</p>)}
          </div>
        </div>
      )}
    </div>
  );
}
