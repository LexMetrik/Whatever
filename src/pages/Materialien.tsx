import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { usePaneKlasse } from '../components/layout/PaneKontext';
import { useSucheAusUrl } from '../components/suche/useSucheAusUrl';
import { MaterialKarte } from '../components/materialien/MaterialKarte';
import { Leerzustand } from '../components/ui/Leerzustand';
import { GruppenKopf } from '../components/ui/GruppenKopf';
import { Ladeanzeige } from '../components/ui/Ladeanzeige';
import { AMTLICHE_FASSUNG_NOMEN } from '../lib/benennung';
import {
  ladeMaterialManifest, gruppiereNachBehoerde, filtere, vorhandeneDoktypen,
  type MaterialFilterWerte,
} from '../lib/materialien/browse';
import type { BrowseMaterial, BehoerdeId, DoktypId } from '../lib/materialien/typen';
import { STARTSEITE_ZAEHLER } from '../data/startseiteZaehler.generated';

/** Zahl der Ausgabe-Zeile in Schweizer Schreibweise (1'338). */
const nf = (n: number) => n.toLocaleString('de-CH');


// ─── Rubrik «Amtliche Ressourcen / Materialien» (Auftrag David, Auftrag 5) ──
//
// Übersicht der praxisleitenden Behörden-Publikationen (ESTV-Kreisschreiben,
// EDÖB-Leitfäden, SECO-Wegleitungen, BSV-Wegleitungen, EHRA-Praxismitteilungen,
// FINMA-Rundschreiben, IGE-Richtlinien). Das sind KEINE Gesetze und keine
// Gerichtsentscheide, sondern faktisch praxisleitendes «Soft-Law». Jede Karte
// führt auf eine In-App-Detailseite mit Metadaten + Live-Link; massgeblich bleibt
// stets die amtliche Fassung (§7/§8, B-6-Nachzug R2-A 31.8.2026). Reine
// Darstellung (§3); maschinell kuratiert,
// fachlich noch nicht durch David geprüft (Abnahme-Zeitsperre).

export function Materialien() {
  const [materialien, setMaterialien] = useState<BrowseMaterial[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const [behoerde, setBehoerde] = useState<BehoerdeId | ''>('');
  const [doktyp, setDoktyp] = useState<DoktypId | ''>('');
  // ?q= aus dem «alle N →»-Sprung der Universal-Suche (UI-NAV S1) füllt das
  // Filterfeld vor — sonst landete man auf der ungefilterten Rubrik (§8).
  const [suche, setSuche] = useSucheAusUrl();
  const pk = usePaneKlasse();

  useEffect(() => {
    let lebt = true;
    ladeMaterialManifest().then((m) => {
      if (!lebt) return;
      if (!m) { setFehler(true); return; }
      setMaterialien(m.materialien);
    });
    return () => { lebt = false; };
  }, []);

  const doktypOptionen = useMemo(() => vorhandeneDoktypen(materialien ?? []), [materialien]);
  const gefiltert = useMemo(() => {
    if (!materialien) return [];
    const f: MaterialFilterWerte = {
      behoerde: behoerde || undefined,
      doktyp: doktyp || undefined,
      suche: suche || undefined,
    };
    return filtere(materialien, f);
  }, [materialien, behoerde, doktyp, suche]);
  const gruppen = useMemo(() => gruppiereNachBehoerde(gefiltert), [gefiltert]);

  return (
    <div className="space-y-6">
      {/* D22 Ziff. 4 · DIE ABSTÄNDE DER ÜBERSICHT SIND GEDECKELT.
          Gemessen (Playwright, Preview, 6.9.2026, @1440/@1160/@1024/@390):
          die grösste senkrechte Leerfläche zwischen zwei Inhaltsblöcken lag
          auf den fünf Übersichten bei 64/49/57/74/56 px. Das Budget ist
          48 px — der Seitenrhythmus geht darum von `space-y-8` (32) auf
          `space-y-6` (24). Nur Abstand, kein Inhalt, keine Reihenfolge. */}
      {/* D11/D22 (David 6.9.2026) — Kopf-Regel für ALLE fünf Übersichten,
          Herleitung in `components/layout/SeitenKopf.tsx`: H1 = Bereichsname
          wie im Reiter, DARUNTER die Ausgabe-Zeile aus dem Register — keine
          Overline, keine halbe Haarlinie, kein Erklär-Absatz. */}
      <SeitenKopf
        titel="Materialien"
        /* REST S2 (Posten «Materialien-Kopf», 25.9.2026): «Publikationen der
           Bundesbehörden» war falsch — der Bestand enthält kantonale
           Parlamentsgeschäfte (GR BS) und die Materialien der Gesetzgebung.
           Jetzt die Hausbegriffe mit den Teilzählern aus derselben Quelle
           (U12/#1068), Wortlaut gleich wie die Startseite: Materialien =
           Gesetzgebung, Erläuterungen = Verwaltungspraxis. */
        ausgabe={`${nf(STARTSEITE_ZAEHLER.materialienGesetzgebung)} Materialien (Gesetzgebung) · ${nf(STARTSEITE_ZAEHLER.materialienErlaeuterungen)} Erläuterungen (Verwaltungspraxis), bibliografisch mit Live-Link`}
      />

      {fehler && (
        <div className="lc-notice lc-notice-warn">
          Die Übersicht konnte nicht geladen werden. Bitte die Seite neu laden.
        </div>
      )}

      {/* W3-7 (Posten, REST S2): der eine Lade-Baustein statt der eigenen
          Kopie — trägt zusätzlich `role="status"` (Ankündigung für Vorlesehilfen). */}
      {!materialien && !fehler && <Ladeanzeige text="Die Übersicht wird abgerufen …" className="py-12" />}

      {materialien && (
        <>
          {/* ── D22 Ziff. 2 · EIN FILTERFELD, VOLLE BREITE, MIT LABEL ────────
              Die drei Achsen standen in EINER Zeile nebeneinander (zwei Selects
              plus Suchfeld), das Feld bekam den Rest der Breite. Neu trägt das
              Suchfeld die volle Inhaltsbreite mit sichtbarem Label «Filtern»
              (gleiche Anatomie wie /gesetze und /rechner), die beiden Facetten
              stehen als eigene Zeile darunter. Sie bleiben <select>: Behörde und
              Dokumenttyp sind Listen mit zweistelliger Optionszahl, keine drei
              Schalter — ein Text-Schalter je Behörde wäre die Lücke, die D22
              gerade schliesst. */}
          <div className="ub-filter" role="group" aria-label="Materialien filtern">
            <label htmlFor="materialien-filter" className="lc-overline">Filtern</label>
            <input
              id="materialien-filter"
              type="search"
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Titel, Nummer oder Behörde …"
              aria-describedby="materialien-filter-scope"
              className="lc-input lc-input-sm w-full"
            />
            {/* O5 (W2·10-UI-NAV-O): das lokale Feld erklärt seinen Umfang —
                ohne diese Zeile weckt es die Erwartung, es fände Gesetzesartikel.
                Der Wortlaut nennt genau, worüber `filtere` in
                lib/materialien/browse.ts sucht. Von Anfang an im Layout
                (§15.2, kein CLS) und per aria-describedby verknüpft. */}
            <p id="materialien-filter-scope" className="ub-filter-fuss min-h-5">
              Titel, Nummer, Behörde und Dokumenttyp dieser Rubrik · Gesetzes- und Entscheidtext über die Suche oben
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
              <label className="flex flex-wrap items-center gap-2 text-body-s text-ink-600">
                <span>Behörde</span>
                <select
                  value={behoerde}
                  onChange={(e) => setBehoerde(e.target.value as BehoerdeId | '')}
                  className="lc-select lc-input-sm w-full min-w-0 sm:w-auto sm:min-w-[12rem] sm:max-w-[16rem]"
                >
                  <option value="">Alle</option>
                  {gruppiereNachBehoerde(materialien).map((g) => (
                    <option key={g.behoerde} value={g.behoerde}>{g.kuerzel} — {g.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-wrap items-center gap-2 text-body-s text-ink-600">
                <span>Dokumenttyp</span>
                <select
                  value={doktyp}
                  onChange={(e) => setDoktyp(e.target.value as DoktypId | '')}
                  className="lc-select lc-input-sm w-full min-w-0 sm:w-auto sm:min-w-[11rem]"
                >
                  <option value="">Alle</option>
                  {doktypOptionen.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </label>
            </div>
          </div>

          {gruppen.length === 0 ? (
            /* W2·19-DESIGN-KONSISTENZ · D-7: hier stand «Kein Material gefunden.
               Filter zurücksetzen?» — eine FRAGE an den Nutzer, die keine Antwort
               entgegennahm. Der Leerzustand berichtet einen Zustand (Aussagesatz);
               die Handlungsmöglichkeit steht als Bedienelement daneben, nicht als
               rhetorische Frage im Satz (§8). Der Weiterweg räumt alle drei
               Achsen dieser Rubrik ab — Behörde, Dokumenttyp, lokales Suchfeld —
               weil jede von ihnen allein den Leerlauf verursacht haben kann. */
            <Leerzustand art="filter" text="Kein Material gefunden."
              weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => { setBehoerde(''); setDoktyp(''); setSuche(''); } }} />
          ) : (
            <div className="space-y-6">
              {gruppen.map((g) => (
                <section key={g.behoerde} id={`b-${g.behoerde}`} className="space-y-3 scroll-mt-24">
                  <div className="space-y-1.5">
                    {/* C-6 (31.8.2026): der Behörden-Gruppenkopf war einer von
                        zwei Sans-H3-Ausreissern unter sonst durchgehend
                        Overline-gesetzten Gruppenköpfen. Overline ist Kanon
                        (DESIGN-REGLEMENT §G-e i. d. F. 29.8.2026: kleine
                        Struktur-Etiketten beschriften eine Region). Die
                        Angleichung ist sichtbar und gewollt — der ausgeschriebene
                        Behördenname bleibt als Lede darunter stehen. */}
                    <GruppenKopf stufe={2} titel={g.kuerzel} zahl={g.materialien.length} />
                    <p className="text-body-s text-ink-500 max-w-reading">{g.name}</p>
                  </div>
                  <div className={pk('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3', 'grid grid-cols-1 @lg/pane:grid-cols-2 @3xl/pane:grid-cols-3 gap-3')}>
                    {g.materialien.map((m) => <MaterialKarte key={m.key} m={m} />)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
      {/* D11: der §8-Vorbehalt steht im Fuss, nicht im Einstieg. Die Rubrik
          führt bewusst keine eigenen Volltexte — das ist eine Aussage über die
          Sammlung und gehört zu ihrem Fuss, nicht über ihren Titel. */}
      {/* REST S5c (Entscheid David 25.9.2026, «je Gattung»): «Soft-Law» nur
          für die Erläuterungen (Verwaltungspraxis) — Botschaften,
          Vernehmlassungen und Parlamentsvorlagen sind Gesetzgebungsmaterial.
          Vorher: «Faktisches «Soft-Law», kein Gesetzesrang.» für die ganze Rubrik. */}
      <p className="border-t border-rule-soft pt-3 text-micro text-ink-500 max-w-reading">
        Kein Gesetzesrang; die Erläuterungen der Verwaltung sind faktisches «Soft-Law». Diese Rubrik führt keine eigenen Volltexte; jeder Eintrag verlinkt die Publikation, massgeblich ist stets {AMTLICHE_FASSUNG_NOMEN}.
      </p>
      {/* W2·6c-DECKUNGS-SEITE (§8): unaufdringlich im Fuss, nicht im Einstieg —
          wer die Rubrik benutzt, sucht ein Dokument; wer wissen will, wie weit
          der Bestand reicht, sucht diesen Satz. Reiner Link, kein Ladevorgang:
          die Deckungs-Sicht wird erst auf der Zielseite geholt. */}
      <p className="text-micro text-ink-500 max-w-reading">
        Wie weit die Entstehungsgeschichte der Erlasse hinterlegt ist — und wo nicht:{' '}
        <Link to="/materialien/deckung" className="lc-link">
          Was wir nicht haben
        </Link>
      </p>
    </div>
  );
}
