import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { VorschauPanel, ExportLeiste } from './wizard';
import { musterdatenAnwenden } from './musterdaten';
import { ErgebnisPlatzhalter, ErgebnisSprung, GruppenTitel, NormLink } from './ui';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { WerkzeugKopf } from '../layout/WerkzeugKopf';
import { useLocale, fedlexLokalisiert } from '../locale';
import { useKopieren } from '../useKopieren';
import { NormText } from '../NormText';
import type { karte } from '../../lib/startseiteConfig';
import type { gmbhGruendungsunterlagen, Phase } from '../../lib/gruendungsunterlagen';
import { BANNER_MAPPE_FERTIG, type PdfBanner } from '../../lib/vorlagen/banner';
import type { AssembleErgebnis } from '../../lib/vorlagen/engine';
import { NOTARIATE, NOTARIAT_SYSTEM_LABEL, NOTARIAT_FREIZUEGIGKEIT } from '../../lib/notariate';
import { HR_AEMTER, HR_AEMTER_STAND } from '../../data/handelsregisteraemter';
import type { Kanton } from '../../types/legal';

// ─── Geteilter Rahmen der Dokumentmappen (/simplify B1, 7.6.2026) ────────────
// Tabs + ExportLeiste + VorschauPanel, Notariats-Hinweis-Box und Gates-Anzeige
// standen zuvor 3× zeichengleich (GmbH-/AG-Mappe, Kapitalerhöhung). Hier lebt
// NUR Darstellung (§3) und fachneutrale Struktur (§4) — die juristisch
// verschiedenen Banner-TEXTE und sämtliche Formularfelder bleiben bei den
// jeweiligen Konsumenten.
//
// W2·29-WERKBANK-VORLAGEN V3: Rahmen der V1 auch für die Mappen — Kopf als
// `layout/WerkzeugKopf`, Abschnitte als Linien statt Karten (F0.6), Reiter auf
// `--reg-w-flaeche`. Checkliste und Kosten-Zeilen standen in GmbH- und AG-Mappe
// zeichengleich doppelt. Amts-Links unterstrichen (F0.8; axe
// `link-in-text-block` serious auf GmbH/Kapitalerhöhung, hell+dunkel, V3 23.9.2026).

/** «Kein Eingabefehler vor der ersten Eingabe» (Grundsatz David 14.6.2026).
 *  Default `true`: ausserhalb von `MappenSeite` (AG-Wizard) wie bisher. */
const BeruehrtKontext = createContext(true);

/** Gerüst der Mappen ohne Wizard (GmbH, Kapitalerhöhung): Kopf mit Rückweg,
 *  Band (Overline «{Rechtsgebiet} · Vorlage», Formvorschrift als Etikett mit
 *  Tor-Griff `data-formgate`), Einleitung, Norm-Chips; Disclaimer; am Fuss die
 *  Sprungmarke zu den Dokumenten. Die Marke (QS-UI 8b Teil 2) kompensiert die
 *  konstruktionsbedingte Tiefe: gemessen 4'537 px Desktop / 7'894 px mobil
 *  (GmbH, die höchste Fläche der Rubrik, als einzige Dokument-Fläche ohne Marke)
 *  und 2'501 / 4'511 px (Kapitalerhöhung, über KEINE Marke erreichbar) —
 *  dieselbe `ErgebnisSprung`-Marke wie auf den Rechnern (§10). */
export function MappenSeite({ karte: card, titel, badge, intro, musterdaten, children }: {
  karte: ReturnType<typeof karte> | undefined;
  titel: string;
  badge: string;
  intro: ReactNode;
  /** V5 (W2·29-WERKBANK-VORLAGEN): «Mit Musterdaten füllen» im Kopf, wie im
   *  Wizard-Rahmen. Nachfrage, wenn schon eingegeben wurde (`beruehrt`). */
  musterdaten?: () => void;
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const [beruehrt, setBeruehrt] = useState(false);
  const merke = () => { if (!beruehrt) setBeruehrt(true); };
  return (
    <BeruehrtKontext.Provider value={beruehrt}>
      <div className="space-y-6" onInput={merke} onChange={merke}>
        <WerkzeugKopf overline={`${card?.rechtsgebiet ?? 'Gesellschaftsrecht'} · Vorlage`} titel={titel}
          status={card?.status}
          etikett={<span data-formgate className="lc-badge lc-badge-warn">{badge}</span>}
          vorspann={(
            <Link to="/" className="inline-flex items-center gap-2 no-underline text-body-s font-medium text-brass-700 hover:text-brass-600">
              <span aria-hidden className="inline-flex items-center justify-center w-7 h-7 border border-line bg-surface">←</span>
              Zurück zum Katalog
            </Link>
          )}
          intro={intro}
          normen={(card?.norms ?? []).map((n) => ({ artikel: n.label, href: fedlexLokalisiert(n.url, locale) }))}>
          {musterdaten && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
              <button type="button" onClick={() => musterdatenAnwenden(beruehrt, musterdaten)} className="lc-btn-outline lc-btn-sm">
                Mit Musterdaten füllen
              </button>
            </div>
          )}
        </WerkzeugKopf>
        <PflichtDisclaimer />
        {children}
        <ErgebnisSprung zielId="vorlagen-dokumente" label="↓ Dokumente" />
      </div>
    </BeruehrtKontext.Provider>
  );
}

/** Ein Abschnitt der Mappe: Linien statt Karte — 2 px Tinte oben, Haarlinie
 *  unten (F0.6), wie `data-formular-karte` im Wizard-Rahmen. */
export function MappenAbschnitt({ titel, lead, className = 'space-y-3', children }: {
  titel?: ReactNode;
  lead?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`border-t-2 border-b border-t-rule border-b-rule-soft pt-5 pb-6 ${className}`}>
      {titel && (
        <div>
          <GruppenTitel>{titel}</GruppenTitel>
          {lead && <p className="text-body-s text-ink-500 max-w-reading-s">{lead}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

const ERSTELLER_LABEL = { gruender: 'Gründer:innen', notariat: 'Notariat', bank: 'Bank', revisor: 'Revisor:in' } as const;
type Unterlage = ReturnType<typeof gmbhGruendungsunterlagen>['unterlagen'][number];

/** Unterlagenliste nach Phase (Inventar 5.5); Phasen-Texte von der Seite. */
export function MappenCheckliste({ phasen, unterlagen }: {
  phasen: readonly { id: Phase; titel: string; lead: string }[];
  unterlagen: readonly Unterlage[];
}) {
  return (
    <>
      {phasen.map((ph) => {
        const zeilen = unterlagen.filter((x) => x.phase === ph.id);
        if (zeilen.length === 0) return null;
        return (
          <MappenAbschnitt key={ph.id} titel={ph.titel} lead={ph.lead}>
            <ul className="space-y-3">
              {zeilen.map((z) => (
                <li key={z.id} className="border-b border-line last:border-b-0 pb-3 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-body-s font-medium text-ink-900">{z.titel}</span>
                    <NormLink artikel={z.norm} />
                    <span className="lc-chip">{ERSTELLER_LABEL[z.ersteller]}</span>
                    {z.ausgeloestDurch && <span className="lc-chip">wegen: {z.ausgeloestDurch}</span>}
                  </div>
                  {z.hinweis && <p className="text-xs text-ink-500 mt-1 max-w-kleintext">{z.hinweis}</p>}
                </li>
              ))}
            </ul>
          </MappenAbschnitt>
        );
      })}
    </>
  );
}

const CHF = new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', maximumFractionDigits: 0 });

/** Bundes-Kostenzeilen der Kapitalgesellschaften (GmbH und AG gleich). */
export function KostenBundZeilen({ emissionsabgabeChf }: { emissionsabgabeChf: number | null }) {
  return (
    <>
      <li>
        <span className="font-medium text-ink-900">Handelsregister-Gebühr: CHF 420</span> (GebV-HReg, SR 221.411.1, Anhang Ziff. 1.3 «Kapitalgesellschaften», Stand 1.1.2021) — zuzüglich allfälliger Zuschläge bis 50 % und Auslagen (Art. 3/4 GebV-HReg).
      </li>
      {emissionsabgabeChf !== null && (
        <li>
          <span className="font-medium text-ink-900">Emissionsabgabe: {CHF.format(emissionsabgabeChf)}</span> — 1 % des CHF 1 Mio. übersteigenden Teils der Leistungen (Art. 8 Abs. 1 und Art. 6 Abs. 1 lit. h StG); Bemessung mindestens zum Nennwert, Sachen zum Verkehrswert.
        </li>
      )}
    </>
  );
}

/** «Wo beurkunden?» — Stammdaten lib/notariate.ts (Dossier behoerden/notariate-kantone.md). */
export function NotariatsHinweis({ kanton }: { kanton: string }) {
  const n = NOTARIATE[kanton as Kanton];
  if (!n) return null;
  return (
    <div className="lc-notice space-y-1">
      <p className="text-body-s text-ink-700 max-w-reading-s">
        <span className="font-medium text-ink-900">Beurkundung im Kanton {kanton}:</span>{' '}
        {NOTARIAT_SYSTEM_LABEL[n.system]} —{' '}
        <a href={n.url} target="_blank" rel="noopener noreferrer" className="text-brass-700 underline underline-offset-2 hover:text-brass-600">{n.stelle}</a>
        {!n.urlBelegt && <span className="text-warn-700"> (Angabe ohne Gewähr)</span>}
      </p>
      {n.hinweis && <p className="text-xs text-warn-700 max-w-kleintext"><NormText text={n.hinweis} /></p>}
      <p className="text-xs text-ink-500 max-w-kleintext">{NOTARIAT_FREIZUEGIGKEIT}</p>
    </div>
  );
}

/** «Wo anmelden?» — Stammdaten data/handelsregisteraemter.ts (Dossier
 *  behoerden/handelsregisteraemter-kantone.md; G3.4 verdrahtet 10.6.2026). */
export function HrAmtHinweis({ kanton }: { kanton: string }) {
  const a = HR_AEMTER[kanton as Kanton];
  if (!a) return null;
  return (
    <div className="lc-notice space-y-1">
      <p className="text-body-s text-ink-700 max-w-reading-s">
        <span className="font-medium text-ink-900">Anmeldung beim Handelsregisteramt ({kanton}):</span>{' '}
        <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-brass-700 underline underline-offset-2 hover:text-brass-600">{a.name}</a>
        {`, ${a.strasse}, ${a.plzOrt} · ${a.telefon}`}
      </p>
      {a.hinweis && <p className="text-xs text-ink-500 max-w-kleintext"><NormText text={a.hinweis} /></p>}
      <p className="text-xs text-ink-500 max-w-kleintext">
        {`Massgeblich ist der SITZ-Kanton der Gesellschaft (Art. 927 OR). Stand ${HR_AEMTER_STAND} (amtliche Kantonsseiten; zefix-Abgleich offen) – vor Einreichung kurz gegenprüfen.`}
      </p>
    </div>
  );
}

/** Blocker-Box + Warnungs-Hinweise einer Mappe.
 *  B2/D-1.5 (QS-UI 8b Teil 2): Blocker- und Warnungs-Prosa lief mit ~900 px über die
 *  Lesespalte (gemessen auf `/vorlagen/gmbh-gruendung` und `/vorlagen/kapitalerhoehung`,
 *  1280×800). `data-vorbehalte` ist derselbe Tor-Griff wie auf den Rechner-Flächen.
 *
 *  V3 (Werkbank-Stil wie `PruefBefund`): eine Box je Art, Zeilen mit Haarlinien
 *  (F0.6). Unberührte Seite: Blocker neutral, ohne Danger-Ton und `role`. */
export function MappenGates({ gates }: { gates: { blocker: string[]; warnungen: string[] } }) {
  const beruehrt = useContext(BeruehrtKontext);
  const zeilen = (texte: string[], linie: string) => (
    <ul>
      {texte.map((t, i) => (
        <li key={i} className={`border-t ${linie} py-1.5 first:border-t-0 first:pt-0 last:pb-0 text-body-s max-w-reading-s`}>• <NormText text={t} /></li>
      ))}
    </ul>
  );
  const kopf = 'lc-overline mb-1';
  return (
    <>
      {gates.blocker.length > 0 && (beruehrt ? (
        <div role="alert" className="lc-notice lc-notice-danger">
          <p className={`${kopf} text-danger-700`}>Für die Dokumente noch offen</p>
          {zeilen(gates.blocker, 'border-danger-line')}
        </div>
      ) : (
        <div className="lc-notice text-ink-700">
          <p className={kopf}>Für die Dokumente noch offen</p>
          {zeilen(gates.blocker, 'border-line')}
        </div>
      ))}
      {gates.warnungen.length > 0 && (
        <div data-vorbehalte className="lc-notice-warn">{zeilen(gates.warnungen, 'border-warn-line')}</div>
      )}
    </>
  );
}

export type MappenDokument = { id: string; titel: string; dateiName: string; ergebnis: AssembleErgebnis };

/** Dokument-Tabs + Export + Live-Vorschau (Entwurf-/Fertig-Banner je ausgabeArt). */
export function MappenAnsicht({ dokumente, bannerEntwurf, bannerFertig = BANNER_MAPPE_FERTIG, docxErlaubt, startDokId, zielId = 'vorlagen-dokumente' }: {
  dokumente: MappenDokument[];
  bannerEntwurf: PdfBanner;
  bannerFertig?: PdfBanner;
  docxErlaubt: boolean;
  startDokId?: string;
  /** Sprungziel-`id` des Dokumentblocks — Ziel der `ErgebnisSprung`-Marke. */
  zielId?: string;
}) {
  const [aktivesDok, setAktivesDok] = useState<string>(startDokId ?? dokumente[0]?.id ?? '');
  const { kopiert, kopieren } = useKopieren();
  const basisId = useId();
  const dok = dokumente.find((d) => d.id === aktivesDok) ?? dokumente[0];

  // QS-UI 8b Teil 2 (§8 · R13-Analogie): Bisher `return null`. Auf
  // `/vorlagen/gmbh-gruendung` und `/vorlagen/kapitalerhoehung` entsteht im
  // Ausgangszustand noch kein Dokument (fehlende Angaben/Blocker) — die Stelle des
  // künftigen Verdikts blieb damit vollständig LEER, und zwar auf einer 4'500 bzw.
  // 7'900 px hohen Seite. Genau derselbe Befund wie bei den eingabe-gegateten
  // Rechner-Flächen in Teil 1, dort über `ErgebnisPlatzhalter` behoben (R13). Hier
  // greift dasselbe Muster statt einer zweiten Lösung (§10).
  // Reine Navigation (§3): kein Rechtsinhalt, keine Frist, kein Schwellenwert —
  // WELCHE Angabe fehlt, sagen weiterhin die Blocker aus `MappenGates` darüber.
  if (!dok) {
    return (
      <div id={zielId} data-dokument-platz className="scroll-mt-24">
        <ErgebnisPlatzhalter titel="Dokumente"
          was="Sobald die Angaben oben vollständig sind, entstehen hier die Dokumente der Mappe — mit Live-Vorschau und Export." />
      </div>
    );
  }

  const tabId = (id: string) => `${basisId}-tab-${id}`;
  const panelId = `${basisId}-panel`;

  // R4-D (5.9.2026): Optional-Chaining, `then(ok, fail)`, Timer-Handle und
  // Unmount-Aufräumen standen hier zeichengleich zum geteilten Hook — und der
  // Kommentar sagte es selbst («wie useWizardState»). Der Hook nimmt den Text
  // jetzt beim KLICK entgegen (das gewählte Dokument steht erst dann fest);
  // genau daran scheiterte die Migration bisher (§5/§10).

  // APG-Tabs: roving tabindex + Pfeiltasten/Home/End (vgl. ui/Tabs.tsx). Vorher
  // versprach role=tab das Tastaturmodell, ohne es zu liefern.
  const aufTabTaste = (e: React.KeyboardEvent<HTMLButtonElement>, i: number) => {
    let ziel: number;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') ziel = (i + 1) % dokumente.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ziel = (i - 1 + dokumente.length) % dokumente.length;
    else if (e.key === 'Home') ziel = 0;
    else if (e.key === 'End') ziel = dokumente.length - 1;
    else return;
    e.preventDefault();
    setAktivesDok(dokumente[ziel].id);
    (e.currentTarget.parentElement?.children[ziel] as HTMLElement | undefined)?.focus();
  };

  const entwurf = dok.ergebnis.dokument.ausgabeArt === 'entwurf';
  const banner = entwurf ? bannerEntwurf : bannerFertig;

  return (
    <>
      {/* `id`/`data-dokument-platz` an DERSELBEN Stelle wie im Leerzustand: das
          Sprungziel darf sich nicht verschieben, sobald die Dokumente entstehen. */}
      {/* V3: Registerfläche (F0.2), Haus-Reiter `.lc-tab` mit `data-reg="w"`
          (Kante im Register); Umbruch statt Querscroll — alle Dokumente sichtbar. */}
      <div id={zielId} data-dokument-platz className="flex flex-wrap gap-x-4 bg-reg-w-flaeche px-3 scroll-mt-24" role="tablist" aria-label="Dokumente der Mappe">
        {dokumente.map((d, i) => {
          const aktiv = d.id === dok.id;
          return (
            <button key={d.id} type="button" role="tab" id={tabId(d.id)} aria-selected={aktiv}
              aria-controls={panelId} tabIndex={aktiv ? 0 : -1} data-reg="w"
              onClick={() => setAktivesDok(d.id)} onKeyDown={(e) => aufTabTaste(e, i)}
              className="lc-tab min-h-11 sm:min-h-9 px-1 text-left text-body-s">
              {d.titel}
            </button>
          );
        })}
      </div>
      <ExportLeiste
        ergebnis={dok.ergebnis}
        deaktiviert={false}
        kopiert={kopiert}
        onKopieren={kopieren}
        pdf={{ label: entwurf ? 'Entwurf als PDF' : 'Als PDF', banner, dateiName: `${dok.dateiName}.pdf` }}
        docx={docxErlaubt
          ? { label: entwurf ? 'Entwurf als Word (DOCX)' : 'Als Word (DOCX)', banner, dateiName: `${dok.dateiName}.docx` }
          : undefined}
      />
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(dok.id)} tabIndex={0}>
        <VorschauPanel ergebnis={dok.ergebnis} />
      </div>
    </>
  );
}
