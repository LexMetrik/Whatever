import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { EinfacheFristForm } from '../components/forms/EinfacheFristForm';
import { FristKalenderKompakt, type FristMarkierung } from '../components/forms/FristKalenderKompakt';
import type { EinfacheFristMeldung, Ferien } from '../components/forms/einfacheFristTexte';
import { AllgemeineFristForm } from '../components/forms/AllgemeineFristForm';
import { ZpoFristenForm } from '../components/forms/ZpoFristenForm';
import { SchkgFristenForm } from '../components/forms/SchkgFristenForm';
import { RechnerKopf } from '../components/layout/RechnerKopf';
import { AbschnittKopf } from '../components/layout/AbschnittKopf';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { Leerzustand } from '../components/ui/Leerzustand';
import { getCalculator } from '../lib/calculators';
import { presetSuche, type PresetIndexEintrag } from '../lib/presetIndex';
import { Link } from 'react-router-dom';
import { KATALOG_KARTEN, istVerfuegbar, type CalculatorCard } from '../lib/startseiteConfig';
import { sucheTrifft } from '../lib/katalogSuche';
import { FRISTEN_MATERIELL } from '../lib/fristenKategorie';
import { sansAmp } from '../components/typografie';
import { getStandardKanton } from '../lib/einstellungen';
import type { Kanton } from '../types/legal';

// ─── Kombinierter Fristenrechner (Free) — Auftrag 5.6.2026 ──────────────────
//
// EIN Gratis-Rechner für die meisten Verfahren: Der Verfahrens-Schnitt
// rendert die BESTEHENDEN, getrennten Forms — die Engines (allgemeineFrist,
// zpoFristen, schkgFristen) bleiben nach §4 strikt getrennt; kombiniert
// wird ausschliesslich die Navigation. Die Pro-Karten zpo-fristen/
// schkg-fristen bleiben als Direkteinstiege bestehen (gleiche Engines).

type Verfahren = 'allgemein' | 'zpo' | 'schkg';

const VERFAHREN: { code: Verfahren; label: string }[] = [
  { code: 'allgemein', label: 'Allgemein (Vertrag/OR)' },
  { code: 'zpo', label: 'Zivilprozess (ZPO)' },
  { code: 'schkg', label: 'Betreibung (SchKG)' },
];

// Hash ↔ Verfahrens-Tab (Vereinheitlichung 7.6.2026, Auftrag David):
// geteilte Links/.ics tragen die Weiche im Fragment (Muster Zuständigkeit/
// Kündigung) — ohne ihn landete der Empfänger eines ZPO-Links auf
// «Allgemein» und sah die Parameter nie.
const HASH_VERFAHREN: Record<string, Verfahren> = { '#zpo': 'zpo', '#schkg': 'schkg', '#allgemein': 'allgemein' };

// Live-Brücke (Auftrag David 1.9.2026 «der Rechenweg aktualisiert sich nicht
// automatisch»): das Ferien-Regime des einfachen Rechners oben bestimmt den
// Voll-Tab unten. VwVG/BGG haben unten kein Formular — dort keine Zuordnung
// (der einfache Rechner bleibt für diese Regimes die einzige Anzeige).
const FERIEN_VERFAHREN: Partial<Record<Ferien, Verfahren>> = {
  keine: 'allgemein', zpo: 'zpo', schkg: 'schkg',
};

// FE-4: Abzweigungs-Treffer — die Preset-Suche prüft deterministisch auch
// die «Eigenes Regime»-Spezialrechner (katalogSuche über die Karten, §5);
// reine Hinweise mit WARUM-Satz, keine Auto-Navigation.
const REGIME_ABZWEIGUNGEN: { warum: string; karte: CalculatorCard }[] = FRISTEN_MATERIELL
  .map((r) => ({ warum: r.warum, karte: KATALOG_KARTEN.find((k) => k.id === r.id) }))
  .filter((x): x is { warum: string; karte: CalculatorCard } =>
    !!x.karte && istVerfuegbar(x.karte) && !!x.karte.href);

export function RechnerTagerechner() {
  const calc = getCalculator('tagerechner')!;
  const { hash } = useLocation();
  const navigate = useNavigate();
  const [verfahren, setVerfahren] = useState<Verfahren>(HASH_VERFAHREN[hash] ?? 'allgemein');
  // Hash-Navigation: Sync während des Renderns (React-Muster «adjusting
  // state», kein setState-im-Effect — Lint).
  const [letzterHash, setLetzterHash] = useState(hash);
  if (hash !== letzterHash) {
    setLetzterHash(hash);
    if (HASH_VERFAHREN[hash]) setVerfahren(HASH_VERFAHREN[hash]);
  }
  // Live-Brücke: gültige ÄNDERUNGEN im einfachen Rechner oben fliessen als
  // EIN stabiles Objekt (Referenz aus dem State) in das aktive Voll-Formular —
  // dessen Rechenweg rechnet damit automatisch mit den oben eingegebenen
  // Werten. Der Voll-Tab wird NUR umgeschaltet, wenn das Ferien-Regime oben
  // wirklich wechselt (GP-Nebenfund 1.9.2026: nicht bei jeder Wertänderung
  // die manuelle Tab-Wahl überstimmen) — und dann MIT navigate, damit Hash
  // und sichtbarer Tab nie auseinanderlaufen (GP-Befund B1: der Live-URL-Sync
  // des LinkTeilenButton schrieb sonst eine ZPO-Query unter #schkg, nach
  // Reload rechnete das falsche Regime mit den Werten — §1). Ein navigate je
  // Tastendruck entsteht so nicht: Werte-Meldungen navigieren nie.
  const [live, setLive] = useState<EinfacheFristMeldung | null>(null);
  // W2·23-STARTSEITE-V4 §3 #3: der kompakte Kalender kommt von «/» hierher. Er
  // ist reine VISUALISIERUNG des Ergebnisses, das der einfache Rechner ohnehin
  // meldet (#7) — keine zweite Eingabe, keine zweite Rechnung (§3/§5).
  const [fristErgebnis, setFristErgebnis] = useState<{ markierung: FristMarkierung; kanton: Kanton } | null>(null);
  const verfahrenRef = useRef(verfahren);
  useEffect(() => { verfahrenRef.current = verfahren; });
  const uebernehmeEingaben = useCallback((m: EinfacheFristMeldung) => {
    const v = FERIEN_VERFAHREN[m.ferien];
    if (!v) { setLive(null); return; } // VwVG/BGG: unten kein Formular (GP-Befund B4 — keine veralteten Syncs stehen lassen)
    setLive(m);
    if (v !== verfahrenRef.current) {
      setVerfahren(v);
      navigate({ search: '', hash: v === 'allgemein' ? '' : `#${v}` }, { replace: true });
    }
  }, [navigate]);
  const wechsle = (v: Verfahren) => {
    // Bug-Check 10.6.2026 (MITTEL): Klick auf den AKTIVEN Tab darf die
    // Query (und damit hydratisierte Eingaben) nicht verwerfen.
    if (v === verfahren) return;
    setVerfahren(v);
    // Manuelle Wahl gewinnt: alte Live-Werte dürfen ein danach (re)gemountetes
    // Formular nicht mehr überschreiben (Stomp-Loch, Bug-Check 1.9.2026).
    setLive(null);
    // Such-Parameter gehören zum bisherigen Tab — beim manuellen Wechsel
    // fallen sie weg (die Forms hydratisieren ohnehin nur beim Mount).
    navigate({ search: '', hash: v === 'allgemein' ? '' : `#${v}` }, { replace: true });
  };
  // FE-2 (FAHRPLAN-FRISTEN-EINHEIT): geführte Regime-Frage. Die Weiche
  // FRAGT, sie rät nicht (§2 — keine Erkennung aus Freitext); die Tabs
  // bleiben als Profi-Schnellzugriff, der URL-Hash unverändert.
  const [weicheOffen, setWeicheOffen] = useState(false);
  const weicheWahl = (v: Verfahren) => {
    setWeicheOffen(false);
    wechsle(v);
  };
  // FE-3: EIN Preset-Katalog über alle Regimes (lib/presetIndex.ts) — die
  // Wahl setzt Regime-Tab UND Parameter (Link-Kodierung der Ziel-Form, §5).
  // Bug-Check 10.6.2026 (HOCH): Remount NICHT am search-String aufhängen —
  // der Teilen-Knopf schreibt die Query ebenfalls (replace) und hätte die
  // Form samt Aktenzeichen/Phase/Hinweis zurückgesetzt; ausserdem blieb die
  // erneute Wahl DESSELBEN Presets wirkungslos (identischer Key). Stattdessen
  // eine explizite Remount-Nonce, die nur die Preset-Wahl erhöht.
  const [presetQuery, setPresetQuery] = useState('');
  const [presetNonce, setPresetNonce] = useState(0);
  const treffer = presetSuche(presetQuery);
  const abzweigungen = presetQuery.trim() === '' ? []
    : REGIME_ABZWEIGUNGEN.filter((a) => sucheTrifft(a.karte, presetQuery));
  const waehlePreset = (e: PresetIndexEintrag) => {
    setPresetQuery('');
    setVerfahren(e.regime);
    // Preset gewinnt: ohne dieses Leeren würde der Render-Sync der frisch
    // aus der Preset-URL hydratisierten Form sofort die ALTEN Live-Werte
    // darüberschreiben (letzterLive startet beim Remount undefined —
    // Stomp-Loch, Bug-Check 1.9.2026; e2e-Fall «Preset-Klick gewinnt»).
    setLive(null);
    setPresetNonce((n) => n + 1);
    navigate({ search: e.query, hash: e.hash }, { replace: true });
  };

  return (
    <div className="space-y-6">
      <RechnerKopf calc={calc} />
      {/* S-5a (FAHRPLAN-STRUKTUR-UMBAU, Auftrag David 10.6.2026 abends):
          GANZ SIMPLER Fristenrechner zuoberst — Datum · Frist · Ferien-Wahl
          (keine/ZPO/SchKG); die Vorauswahl-Rechner (Presets, Voll-Tabs)
          erscheinen DARUNTER. */}
      <Card className="space-y-4">
        <AbschnittKopf titel="Einfacher Fristenrechner">
          Datum, Dauer und Ferien-Behandlung – das Fristende sofort. Für
          Zustellarten, gerichtliche Fristen, Hemmung oder Presets die
          Rechner mit Vorauswahl darunter verwenden.
        </AbschnittKopf>
        <EinfacheFristForm onEingaben={uebernehmeEingaben} onErgebnis={setFristErgebnis} />
        <div className="space-y-2 border-t border-line pt-4">
          <span className="lc-overline">Kalender-Ansicht</span>
          <FristKalenderKompakt markierung={fristErgebnis?.markierung ?? null}
            kanton={fristErgebnis?.kanton ?? getStandardKanton()} />
        </div>
      </Card>
      <Card>
        <AbschnittKopf titel="Mit Vorauswahl (Presets · ZPO · SchKG · Rückwärts)" className="mb-5" />
        {/* FE-3: Preset-Suche über alle Regimes */}
        <div className="space-y-1.5 mb-5">
          <label htmlFor="preset-suche" className="lc-overline block">
            Frist suchen (alle Verfahren)
          </label>
          <input id="preset-suche" type="search" value={presetQuery}
            onChange={(e) => setPresetQuery(e.target.value)}
            placeholder="z. B. «Berufung», «Rechtsvorschlag», «Art. 256c ZGB»"
            autoComplete="off"
            className="lc-input max-w-xl" />
          {presetQuery.trim() !== '' && (
            treffer.length === 0 && abzweigungen.length === 0 ? (
              <div className="max-w-reading">
                {/* D-7 (R3-α, 31.8.2026): Wortlaut UNVERÄNDERT (§8) — er nennt
                    die beiden Auswege selbst; nur die Anatomie kommt jetzt aus
                    dem Baustein.

                    R4-E (5.9.2026): die ART war falsch deklariert. GEMESSEN am
                    Preview: `/rechner/tagerechner` mit Suchtext «zzzzz» rendert
                    `data-leerzustand="bestand"` ohne Weiterweg —
                    `/rechtsprechung?q=zzzzzz` im selben Zustand
                    `data-leerzustand="filter"` MIT Weiterweg. Derselbe Sachverhalt,
                    zwei Darstellungen. Massgeblich ist die Lage, nicht der
                    Wortlaut (Doktrin an den beiden `Gesetze.tsx`-Fundstellen):
                    dieser Zweig läuft NUR bei `presetQuery.trim() !== ''` — es
                    GÄBE also Presets, die Suche verdeckt sie. Das ist
                    `art="filter"`, und dort ist der Weiterweg Pflicht («nie eine
                    Sackgasse»); anders als in `Gesetze.tsx` existiert er hier
                    auch wirklich: das Feld leeren bringt die Liste zurück.
                    Der Satz selbst bleibt Zeichen für Zeichen stehen (§8). */}
                <Leerzustand art="filter"
                  text="Kein Preset gefunden – Frist manuell eingeben oder die Spezialrechner der Fristen-Kategorie prüfen (Verjährung, Arbeits-/Mietkündigung, …)."
                  weiterweg={{ text: 'Suche leeren', onKlick: () => setPresetQuery('') }} />
              </div>
            ) : (
              <div className="space-y-2 max-w-xl">
                {treffer.length > 0 && (
                  <ul className="border border-line divide-y divide-line bg-surface overflow-hidden">
                    {treffer.map((e) => (
                      <li key={e.key}>
                        <button type="button" onClick={() => waehlePreset(e)}
                          className="w-full text-left px-3 py-2 flex items-baseline justify-between gap-3 hover:bg-brass-100/40 transition-colors">
                          <span className="min-w-0">
                            <span className="block text-body-s font-medium text-ink-900 leading-snug">{e.label}</span>
                            {e.norm !== '' && <span className="block text-xs text-ink-500">{e.norm}</span>}
                          </span>
                          <span className="text-xs text-ink-500 whitespace-nowrap shrink-0">{e.regimeLabel}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* FE-4: Abzweigungen zu Spezialrechnern mit eigenem Regime —
                    Hinweis-Links, der WARUM-Satz erklärt die Abzweigung. */}
                {abzweigungen.length > 0 && (
                  <div className="lc-notice space-y-1.5">
                    <p className="lc-overline">Eigenes Regime – Spezialrechner</p>
                    {abzweigungen.map((a) => (
                      <p key={a.karte.id} className="text-body-s text-ink-600 leading-snug">
                        <Link to={a.karte.href!}
                          className="font-medium text-brass-700 hover:text-brass-600 no-underline">
                          {sansAmp(a.karte.title)} →
                        </Link>{' '}
                        <span className="text-ink-500">– {a.warum}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
        <div className="space-y-1.5">
          <p className="lc-overline">In welchem Verfahren läuft die Frist?</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <Tabs items={VERFAHREN} value={verfahren} onChange={wechsle}
              ariaLabel="Verfahrensart wählen" />
            {/* B-K1 (R9-2, 6.9.2026): dieser Aufklapp-Schalter stand als roher
                `<button>` neben den Verfahrens-Reitern — als Bedienelement kenntlich
                allein an Farbe und Fettung, also gar nicht (F0.8: Affordanz nie nur
                aus der Farbe). `.lc-btn-mini` ist der Hauskanon für den kleinen
                Textknopf neben einer Leiste (`EntscheidFilter.tsx:355`,
                `parts/ArtikelLeser.tsx:522/523`): Haarlinie als Anatomie, Höhe aus
                `--tap-ziel`. Beschriftung, `aria-expanded` und Handler unverändert. */}
            <button type="button" onClick={() => setWeicheOffen((o) => !o)}
              aria-expanded={weicheOffen}
              className="lc-btn-mini text-body-s font-medium text-brass-700 hover:text-brass-600">
              Weiss nicht?
            </button>
          </div>
          {weicheOffen && (
            <div className="lc-notice space-y-2 !mt-3">
              <p className="text-body-s text-ink-600 max-w-reading">
                Drei Fragen führen zum Regime – die Wahl bleibt bei Ihnen:
              </p>
              {/* B-K1, Teil 2 (R9-2): die drei Regime-Wahlen stehen MITTEN IM SATZ.
                  `.lc-btn-mini`/`.lc-btn-ghost` sind Block-Anatomien (inline-flex mit
                  eigener Höhe) und würden die Zeilen aufbrechen; einen benannten
                  Baustein für den Textknopf IM FLIESSTEXT gibt es heute nicht (F0.8
                  regelt den `<a>`-Inline-Link, nicht den `<button>`). Sie bekommen
                  darum die Affordanz, die das Reglement für Inline-Verweise verlangt
                  — den Unterstrich, `underline-offset-2` wie die «zum Schritt →»-
                  Sprünge in `VorlageSchlichtungsgesuchBs.tsx:517`. Ein Bedienelement,
                  das nur die Farbe ausweist, ist keines (F0.8/WCAG 1.4.1). Fehlender
                  Baustein im Protokoll vermerkt. */}
              <ol className="space-y-1.5 text-body-s text-ink-600 list-decimal pl-5 max-w-reading">
                <li>
                  Läuft die Frist in einer <span className="font-medium text-ink-900">Betreibungssache</span> (Zahlungsbefehl,
                  Rechtsvorschlag, Fortsetzung, Konkursandrohung – auch gerichtliche Fristen daraus,
                  z. B. Rechtsöffnung)?{' '}
                  <button type="button" onClick={() => weicheWahl('schkg')}
                    className="font-medium text-brass-700 underline underline-offset-2 hover:text-brass-600 whitespace-nowrap">
                    → Betreibung (SchKG)
                  </button>
                </li>
                <li>
                  Hat sonst ein <span className="font-medium text-ink-900">Zivilgericht oder die
                  Schlichtungsbehörde</span> die Frist nach ZPO gesetzt (Klage, Stellungnahme,
                  Berufung, Vorschuss)?{' '}
                  <button type="button" onClick={() => weicheWahl('zpo')}
                    className="font-medium text-brass-700 underline underline-offset-2 hover:text-brass-600 whitespace-nowrap">
                    → Zivilprozess (ZPO)
                  </button>
                </li>
                <li>
                  Sonst – Vertrags- oder Gesetzesfrist ausserhalb eines solchen Verfahrens:{' '}
                  <button type="button" onClick={() => weicheWahl('allgemein')}
                    className="font-medium text-brass-700 underline underline-offset-2 hover:text-brass-600 whitespace-nowrap">
                    → Allgemein (Vertrag/OR)
                  </button>{' '}
                  <span className="text-ink-500">– rechnet ohne Gerichtsferien; die Warnungen im
                  Ergebnis gelten unverändert.</span>
                </li>
              </ol>
              <p className="text-body-s text-ink-500 max-w-reading">
                <span className="font-medium text-ink-700">Nicht abgebildet:</span> Fristen in
                Straf- (StPO), Verwaltungs- (VwVG) und Bundesgerichtsverfahren (BGG) folgen
                eigenen Stillstandsregeln – dieser Rechner deckt sie nicht ab.
              </p>
            </div>
          )}
          <p className="text-micro text-ink-500">
            {verfahren === 'allgemein' && 'Vertrags- und Verwirkungsfristen nach OR/ZGB – ohne Gerichtsferien; inkl. Rückwärtsrechnung, Tage-zwischen, Zustell-Helfer und Kalenderexport.'}
            {verfahren === 'zpo' && 'Gerichtliche und gesetzliche Fristen mit Stillstand (Art. 145 ZPO), kantonalen Feiertagen und Zustellungsregeln.'}
            {verfahren === 'schkg' && 'Betreibungsferien und Rechtsstillstand (Art. 56 ff. SchKG) – getrennt vom ZPO-Stillstand gerechnet.'}
          </p>
        </div>
        {/* Nonce-Key: NUR die Preset-Wahl erzwingt einen Remount (die Form
            hydratisiert dann aus der frisch gesetzten URL — dieselbe Mechanik
            wie die Prefill-Brücken); Teilen-Klicks remounten nicht. */}
        {/* Live-Brücke: `live` erreicht nur die zum Regime passende Form
            (sonst rechnete etwa die ZPO-Form mit «Keine Ferien»-Eingaben —
            §1: zwei rechtlich verschiedene Regimes nie stillschweigend
            gleich behandeln). */}
        {verfahren === 'allgemein' && <AllgemeineFristForm key={presetNonce} live={live?.ferien === 'keine' ? live : undefined} />}
        {verfahren === 'zpo' && <ZpoFristenForm key={presetNonce} live={live?.ferien === 'zpo' ? live : undefined} />}
        {verfahren === 'schkg' && <SchkgFristenForm key={presetNonce} live={live?.ferien === 'schkg' ? live : undefined} />}
      </Card>
    </div>
  );
}
