import { Link } from 'react-router-dom';
import { NormText } from '../NormText';
import { KantonNormText } from '../KantonNormText';
import { EckdatenKachel, GruppenTitel, inputCls } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { ErgebnisAnzeige } from '../ErgebnisAnzeige';
import { BegruendungSlot } from '../BegruendungSlot';
import { ErgebnisExport } from '../ErgebnisExport';
import { permalinkKodieren } from '../../lib/permalink';
import { ZUST_LINK_SPEC } from './zustaendigkeitLinkSpecs';
import { ZPO_SCHWELLEN } from '../../lib/zustaendigkeit';
// RL-42 / Z1-03: derselbe Satz wie in der Engine (§5).
import { SCHLICHTUNG_FREIWILLIG_199_3 } from '../../lib/zustaendigkeit/erstinstanz';
import { ERLASS_LINKS } from '../../data/erlassLinks';
import { AMT_KANTONE, MIETE_AMT_KANTONE } from '../../data/schlichtung/amtAufloesung';
import { behoerdeAlsBlock } from '../../lib/vorlagen/behoerden';
import { kvPrefillKodieren, type KvMaterie } from '../../lib/vorlagen/klageVereinfacht';
import { koPrefillKodieren } from '../../lib/vorlagen/klageOrdentlich';
import { karte } from '../../lib/startseiteConfig';
import { usePaneKlasse } from '../layout/PaneKontext';
import { ORT_LABEL } from './zustaendigkeitFormDaten';
import type { ZustaendigkeitFormModell } from './useZustaendigkeitForm';

// ─── Zuständigkeitsrechner — Ergebnis-Teil «Einleitung» (Zivil) ─────────────
// §6.6-Fassaden-Split H-13 (B25): reine Darstellung, JSX byte-gleich aus
// ZustaendigkeitForm.tsx ausgelagert. Einziger Hook `usePaneKlasse` (Kontext-
// Konsument, unbedingt an oberster Stelle → Hook-Reihenfolge stabil, React-
// Compiler-aus-Leitplanke); alle übrigen Werte als EIN Modell-Prop `z`.
export function ZustErgebnisEinleitung({ z }: { z: ZustaendigkeitFormModell }) {
  const pk = usePaneKlasse();
  const { f, zeige, fehler, ergebnis, r, hgWeicheAktiv, handelsgericht, stelle, recherche, kantonOffen, kantonDaten, sgPrefill, fahrplan, kosten, eingabeText, aktenzeichen, setAktenzeichen, schritt, istMiete, istArbeit, vermoegensrechtlich, streitwert, amt, mieteAmt, mieteKandidaten, zhKreise, zhStrasse, setZhStrasse, zhNummer, setZhNummer, zhStrassenInfo, vdStufe, soGleicheGemeinde, setSoGleicheGemeinde, pdfConfig } = z;
  return (
    <>
        {/* 4 · Ergebnis — EINLEITUNGS-Sicht (Bug-Check 5.6.2026: im
            Rechtsmittel-Modus tragen die Rechtsmittel-Karten oben die volle
            Auskunft; die Einleitungs-Blöcke [Verfahrensart/Schlichtung/Stellen-
            Notices/Weichen] würden dort sachfremd leaken) */}
        {zeige('ergebnis') && f.instanz === 'einleitung' && !(ergebnis && r) && (
          <div className="lc-card p-5 space-y-2">
            <GruppenTitel>Fahrplan</GruppenTitel>
            <p className="text-body-s text-ink-700">Für den Fahrplan fehlen noch Angaben:</p>
            {fehler.length > 0
              ? fehler.map((x, i) => <p key={i} className="text-body-s text-warn-700">• {x}</p>)
              : <p className="text-body-s text-warn-700">• Bitte die vorherigen Schritte vervollständigen.</p>}
          </div>
        )}
        {zeige('ergebnis') && ergebnis && r && f.instanz === 'einleitung' && (
          <ErgebnisBlock>

            {/* UX-Fix 5.6.2026 (Frage David «wieso bei Arbeitsrecht keine
                Schlichtungsbehörde?»): Ohne Kantonswahl gab es WEDER Stelle noch
                Hinweis — die Behörde ist hinterlegt, nur die Ortsangabe fehlte. */}
            {r.schlichtung.obligatorisch && f.kanton === '' && (
              <div className="lc-card p-4">
                <p className="lc-overline mb-1.5">Zuständige Schlichtungsbehörde</p>
                <p className="text-body-s text-ink-700">
                  Die Schlichtungsbehörde ist für alle 26 Kantone hinterlegt — bitte oben
                  <span className="font-medium text-ink-900"> PLZ eingeben oder Kanton wählen</span>, damit die
                  konkrete Stelle mit Adresse angezeigt werden kann (örtlich massgeblich: {ORT_LABEL[f.streitsache]}).
                </p>
              </div>
            )}
            {/* Handelsgericht-Auflösung (Art. 6 ZPO; 4 Kantone) */}
            {hgWeicheAktiv && f.kanton !== '' && (
              <div className="lc-card p-4 space-y-2">
                <GruppenTitel>Handelsgericht ({f.kanton})</GruppenTitel>
                {handelsgericht ? (
                  <>
                    <p className="text-body-s text-ink-900 whitespace-pre-line">
                      {handelsgericht.name}{'\n'}{handelsgericht.strasse}{'\n'}{handelsgericht.plzOrt}
                    </p>
                    <p className="text-xs text-ink-500">{handelsgericht.organisation}. Bei handelsgerichtlicher Zuständigkeit: {SCHLICHTUNG_FREIWILLIG_199_3}; Rechtsmittel direkt ans Bundesgericht (Art. 75 Abs. 2 lit. b BGG).</p>
                  </>
                ) : (
                  <p className="text-body-s text-ink-700">
                    Der Kanton {f.kanton} führt KEIN Handelsgericht (Art. 6 Abs. 1 ZPO ist eine Kann-Vorschrift; Handelsgerichte
                    bestehen nur in ZH, BE, AG und SG) — die Klage geht an das ordentliche Gericht, die Handelsgericht-Weiche entfällt.
                  </p>
                )}
              </div>
            )}
            {/* Konkrete Stelle (Kantonsschicht) + Vorlagen-Sprung */}
            {stelle && (
              <div className="lc-card p-4 space-y-3">
                <div>
                  <p className="lc-overline mb-2">Zuständige Schlichtungsstelle ({f.kanton})</p>
                  <p className="text-body-s text-ink-900 whitespace-pre-line">{behoerdeAlsBlock(stelle)}</p>
                  {stelle.url && (
                    <p className="text-xs mt-1.5">
                      <a href={stelle.url} target="_blank" rel="noopener noreferrer" className="text-brass-700 underline">
                        Amtliche Behördenseite öffnen ↗
                      </a>
                    </p>
                  )}
                  <p className="text-xs text-ink-500 mt-2">Quelle: {stelle.quelle} (Stand {stelle.stand}).</p>
                </div>
                {/* Der Vorlagen-Sprung lebt seit 6.6.2026 im einheitlichen Block
                    «Passende Vorlage für Ihre Eingabe» am Fahrplan-Ende (Auftrag
                    David) — hier keine Doppelung mehr. */}
              </div>
            )}
            {/* Passende Eingabe-Vorlage (Auftrag David 6.6.2026): IMMER verweisen —
                gebaut → Link (mit Prefill, wo die Brücke existiert), noch nicht
                gebaut → ehrlich «in Vorbereitung» (§8). Reines Mapping, keine
                Rechtslogik (§3): die EingabeArt kommt aus der Engine. */}
            {f.instanz === 'einleitung' && (() => {
              const ziel = r.eingabeArt === 'schlichtungsgesuch'
                ? { karte: karte('schlichtungsgesuch'), zusatz: null as string | null }
                : r.eingabeArt === 'klage_direkt'
                  ? (r.verfahrensart === 'vereinfacht'
                      ? { karte: karte('klage-vereinfacht'),
                          zusatz: kantonDaten?.erstinstanzName ? `Die Klage geht direkt an das erstinstanzliche Gericht (${f.kanton}: ${kantonDaten.erstinstanzName}).` : 'Die Klage geht direkt an das erstinstanzliche Gericht.' }
                      // S-4: seit dem Struktur-Umbau existiert die Karte
                      // klage-ordentlich (geplant) — Titel aus der SSoT (§5).
                      : { karte: karte('klage-ordentlich'),
                          zusatz: kantonDaten?.erstinstanzName ? `Die Klage geht direkt an das erstinstanzliche Gericht (${f.kanton}: ${kantonDaten.erstinstanzName}).` : 'Die Klage geht direkt an das erstinstanzliche Gericht.' })
                  : { karte: undefined,
                      titel: 'Scheidungsbegehren / Scheidungsklage',
                      zusatz: 'Örtlich zuständig ist das Gericht am Wohnsitz einer der Parteien (zwingend, Art. 23 ZPO); das konkrete Gericht richtet sich nach kantonalem Recht (Art. 4 ZPO).' };
              const k = 'karte' in ziel ? ziel.karte : undefined;
              // K-2-Fix Bug-Check 6.6.2026: Die klage-vereinfacht-Vorlage ist
              // BS-spezifisch (Schema klage-vereinfacht-bs, BS-Gerichtsrouting) —
              // für andere Kantone wäre Titel + Prefill-Link irreführend (§8).
              // Bug-Check 10.6.2026 (MITTEL): K-2-Guard entfernt — die
              // KV-Vorlage adressiert seit dem Kantonsausbau alle 26 Kantone;
              // der frühere `kantonsfremd`-Zweig ist damit toter Code (entfernt).
              const gebaut = k && k.status !== 'geplant' && k.href;
              // Prefill-Brücken: BS-Schlichtungsgesuch (bestehend) und
              // klage-vereinfacht (2.1b — Materie + Streitwert reisen mit).
              const kvMaterie: KvMaterie | null = k?.id === 'klage-vereinfacht'
                ? (istArbeit && f.glgBetroffen ? 'glg' // GlG VOR arbeit (streitwertunabhängig, lit. a)
                  : istArbeit ? 'arbeit'
                  : istMiete && ['kuendigungsschutz', 'erstreckung', 'mietzins_anfechtung', 'hinterlegung'].includes(f.mieteUnterfall)
                    ? 'miete_kernbereich' // Schutzmaterien lit. c — streitwertunabhängig
                  : f.streitsache === 'persoenlichkeit' && f.persoenlichkeitUnterfall === 'gewaltschutz' ? 'gewaltschutz'
                  : vermoegensrechtlich ? 'vermoegensrechtlich' : null)
                : null;
              const linkZiel = gebaut
                ? (k.id === 'schlichtungsgesuch' && sgPrefill
                    ? { pathname: '/vorlagen/schlichtungsgesuch-bs', search: sgPrefill }
                    : k.id === 'klage-vereinfacht' && kvMaterie
                      ? { pathname: k.href!, search: kvPrefillKodieren({ materie: kvMaterie, streitwertCHF: vermoegensrechtlich ? streitwert : null, kanton: f.kanton === '' ? undefined : f.kanton }) }
                      : k.id === 'klage-ordentlich'
                        // Bug-Check B9 (10.6.2026): klage_direkt = ohne Schlichtung
                        // → Klagebewilligung-Default aus; Kanton/Streitwert reisen mit.
                        ? { pathname: k.href!, search: koPrefillKodieren({ streitwertCHF: vermoegensrechtlich ? streitwert : null, kanton: f.kanton === '' ? undefined : f.kanton, ohneKlagebewilligung: true }) }
                        : { pathname: k.href! })
                : null;
              return (
                <div className="lc-card p-4 space-y-2">
                  <GruppenTitel>Passende Vorlage für Ihre Eingabe</GruppenTitel>
                  <p className="text-body-s text-ink-900 font-medium">
                    {k ? k.title : (ziel as { titel: string }).titel}
                    {!gebaut && <span className="lc-badge-geplant ml-2 align-middle">In Vorbereitung</span>}
                  </p>
                  {ziel.zusatz && <p className="text-body-s text-ink-700">{ziel.zusatz}</p>}
                  {linkZiel ? (
                    <div className="pt-1">
                      <Link to={linkZiel} className="lc-btn-primary no-underline">
                        Weiter zur Vorlage →
                      </Link>
                      {((k!.id === 'schlichtungsgesuch' && sgPrefill) || (k!.id === 'klage-vereinfacht' && kvMaterie)) && (
                        <p className="text-xs text-ink-500 mt-2">
                          {/* Bug-Check §9 10.6.2026 (fachliche Lupe, NIEDRIG):
                              Adress-Versprechen nur, wenn ein Ort erfasst ist —
                              ohne PLZ/Gemeinde kann die Vorlage in Verzeichnis-
                              Kantonen nichts auflösen (§8). */}
                          {k!.id === 'schlichtungsgesuch'
                            ? (f.plz !== '' || f.gemeinde.trim() !== ''
                              ? 'Streitsache, Streitwert, Kanton und Ort werden vorbefüllt — die Vorlage setzt die Adresse der zuständigen Stelle als Adressat ein; alles bleibt editierbar.'
                              : 'Streitsache, Streitwert und Kanton werden vorbefüllt — die Adresse der zuständigen Stelle bestimmt die Vorlage, sofern dort der Ort erfasst wird; alles bleibt editierbar.')
                            : 'Streitsache und Streitwert werden vorbefüllt — alles bleibt editierbar.'}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500">
                      Diese Vorlage ist noch nicht verfügbar — die hier eruierten Angaben (Zuständigkeit, Verfahrensart, Streitwert) gelten unabhängig davon.
                    </p>
                  )}
                </div>
              );
            })()}
            {recherche && (
              <div className="lc-card p-4 space-y-3">
                <GruppenTitel>Zuständige Schlichtungsstelle ({f.kanton})</GruppenTitel>
                {recherche.glgFallback && (
                  <p className="text-xs text-ink-500"><NormText text={`Keine eigene paritätische Stelle hinterlegt — angezeigt wird die ordentliche Schlichtungsbehörde; die paritätische Besetzung (Art. 200 ZPO) stellt der Kanton sicher.`} /></p>
                )}
                {recherche.aufloesung.modus === 'zentral' && (
                  <div>
                    <p className="text-body-s text-ink-900 whitespace-pre-line">
                      {/* Direktlink (Auftrag David 6.6.2026): Stellen-Name verlinkt
                          auf die amtliche Detailseite, sofern in den Dossiers belegt. */}
                      {recherche.aufloesung.stelle.url ? (
                        <a href={recherche.aufloesung.stelle.url} target="_blank" rel="noopener noreferrer"
                          className="font-medium text-brass-700 underline" title="Amtliche Behördenseite öffnen">
                          {recherche.aufloesung.stelle.name} ↗
                        </a>
                      ) : recherche.aufloesung.stelle.name}
                      {'\n'}{recherche.aufloesung.stelle.strasse}{'\n'}{recherche.aufloesung.stelle.plzOrt}
                    </p>
                    {recherche.aufloesung.stelle.hinweis && (
                      <p className="text-xs text-warn-700 mt-1">⚠ <NormText text={recherche.aufloesung.stelle.hinweis} /></p>
                    )}
                  </div>
                )}
                {recherche.aufloesung.modus === 'liste' && (
                  <div className="space-y-2">
                    {/* Miete-Register (11.6.2026): konkrete Stelle auch in
                        Listen-Kantonen (ZH/SO/JU) aus PLZ/Gemeinde. */}
                    {r.schlichtung.behoerdeTyp === 'paritaetisch_miete' && f.kanton !== '' && MIETE_AMT_KANTONE.includes(f.kanton) && mieteAmt && (
                      <div className="border-b border-line pb-2">
                        <p className="text-body-s text-ink-900 whitespace-pre-line">
                          {[mieteAmt.name, mieteAmt.strasse, mieteAmt.plzOrt].filter(Boolean).join('\n')}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">aufgelöst über {f.plz ? `PLZ ${f.plz} → ` : ''}Gemeinde {f.gemeinde.trim()} (Miete-Register, Vollerhebung 11.6.2026).</p>
                      </div>
                    )}
                    {/* TI-Miete (12.6.2026): Lugano/Bellinzona/Val Mara liegen
                        in mehreren Uffici — Ortsteil/Quartier des Mietobjekts
                        entscheidet (Dossier §51). */}
                    {r.schlichtung.behoerdeTyp === 'paritaetisch_miete' && f.kanton === 'TI' && !mieteAmt && mieteKandidaten && (
                      <div className="space-y-1.5 border-b border-line pb-2">
                        <p className="text-xs text-ink-500">Die Gemeinde {f.gemeinde.trim()} erstreckt sich über mehrere Uffici di conciliazione — massgeblich ist der ORTSTEIL/das Quartier des Mietobjekts:</p>
                        <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {mieteKandidaten.map((a) => (
                            <li key={a.kreise} className="text-body-s text-ink-800">
                              <span className="font-medium text-ink-900">{a.name}</span> — {a.kreise}<br />{[a.strasse, a.plzOrt].filter(Boolean).join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {recherche.aufloesung.hinweis && <p className="text-xs text-ink-500"><NormText text={recherche.aufloesung.hinweis} /> — massgeblich: {ORT_LABEL[f.streitsache]}.</p>}
                    {/* VD (11.6.2026): konkrete Instanz aus PLZ/Gemeinde + Streit-
                        wert-Stufe (Art. 41 CDPJ-VD) — die Liste darunter bleibt
                        als Übersicht aller Stellen der Stufe stehen. */}
                    {f.kanton === 'VD' && amt && (
                      <div className="border-b border-line pb-2">
                        <p className="text-body-s text-ink-900 whitespace-pre-line">
                          {amt.url ? (
                            <a href={amt.url} target="_blank" rel="noopener noreferrer"
                              className="font-medium text-brass-700 underline" title="Amtliche Behördenseite öffnen">{amt.name} ↗</a>
                          ) : <span className="font-medium">{amt.name}</span>}
                          {'\n'}{amt.strasse}{'\n'}{amt.plzOrt}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">aufgelöst über {f.plz ? `PLZ ${f.plz} → ` : ''}Gemeinde {f.gemeinde.trim()} und den Streitwert (amtl. Ortschaftenverzeichnis + Art. 41 CDPJ-VD).</p>
                      </div>
                    )}
                    <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {recherche.aufloesung.stellen.map((s) => (
                        <li key={s.name + s.plzOrt} className="text-body-s text-ink-800">
                          {s.url ? (
                            <a href={s.url} target="_blank" rel="noopener noreferrer"
                              className="font-medium text-brass-700 underline" title="Amtliche Behördenseite öffnen">{s.name} ↗</a>
                          ) : (
                            <span className="font-medium text-ink-900">{s.name}</span>
                          )}
                          {s.zustaendigFuer && <span className="text-ink-500"> — {s.zustaendigFuer}</span>}
                          <br />{s.strasse}, {s.plzOrt}
                          {s.hinweis && <span className="block text-xs text-warn-700">⚠ <NormText text={s.hinweis} /></span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {recherche.aufloesung.modus === 'verzeichnis' && (() => {
                  const amtAufloesbar = f.kanton !== '' && AMT_KANTONE.includes(f.kanton) && r.schlichtung.behoerdeTyp === 'ordentlich';
                  const mieteAufloesbar = f.kanton !== '' && MIETE_AMT_KANTONE.includes(f.kanton) && r.schlichtung.behoerdeTyp === 'paritaetisch_miete';
                  const zhStadt = amtAufloesbar && f.kanton === 'ZH' && f.gemeinde.trim().toLowerCase() === 'zürich';
                  return <>
                    {/* Strassen-Index Stadt Zürich (Adress-Ausbau Stufe 1,
                        12.6.2026): Strasse + Nr. lösen den Stadtkreis offline
                        aus den amtlichen Gebäudeadressen — kein externer
                        Request. */}
                    {zhStadt && (
                      <div className="space-y-1">
                        <div className="flex gap-2 items-end">
                          <label className="block flex-1">
                            <span className="text-xs text-ink-600">Strasse (beklagte Partei) — löst den Stadtkreis auf</span>
                            <input className={inputCls} value={zhStrasse} onChange={(e) => setZhStrasse(e.target.value)}
                              placeholder="z. B. Weinbergstrasse" aria-label="Strasse der beklagten Partei in der Stadt Zürich" />
                          </label>
                          <label className="block w-24">
                            <span className="text-xs text-ink-600">Nr.</span>
                            <input className={inputCls} value={zhNummer} onChange={(e) => setZhNummer(e.target.value)}
                              aria-label="Hausnummer" />
                          </label>
                        </div>
                        {zhStrassenInfo === 'nummer_noetig' && (
                          <p className="text-xs text-warn-700">{zhNummer.trim() !== ''
                            ? 'Diese Hausnummer ist im amtlichen Adressbestand der Strasse nicht erfasst — Nummer prüfen oder unten das Kreis-Amt wählen.'
                            : 'Diese Strasse verläuft über mehrere Stadtkreise — Hausnummer angeben (oder unten das Kreis-Amt wählen).'}</p>
                        )}
                        {zhStrassenInfo === 'unbekannt' && (
                          <p className="text-xs text-warn-700">Strasse im amtlichen Adressbestand der Stadt Zürich nicht gefunden — Schreibweise prüfen (z. B. «…strasse» ausgeschrieben) oder unten das Kreis-Amt wählen.</p>
                        )}
                      </div>
                    )}
                    {/* Miete-Register (11.6.2026): konkrete paritätische Stelle
                        aus PLZ/Gemeinde (Art. 200 Abs. 1 ZPO). */}
                    {mieteAufloesbar && mieteAmt && (
                      <div>
                        <p className="text-body-s text-ink-900 whitespace-pre-line">
                          {[mieteAmt.name, mieteAmt.strasse, mieteAmt.plzOrt].filter(Boolean).join('\n')}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">aufgelöst über {f.plz ? `PLZ ${f.plz} → ` : ''}Gemeinde {f.gemeinde.trim()} (amtl. Ortschaftenverzeichnis + Miete-Register, Vollerhebung 11.6.2026).</p>
                      </div>
                    )}
                    {/* SO-Weiche (§ 5 Abs. 1 GO SO, 11.6.2026) */}
                    {f.kanton === 'SO' && r.schlichtung.behoerdeTyp === 'ordentlich' && (
                      <div className="space-y-1.5">
                        <p className="text-body-s text-ink-800">Wohnen oder sitzen beide Parteien in derselben Gemeinde? <span className="text-ink-500">(§ 5 Abs. 1 GO SO — bestimmt die Schlichtungsbehörde)</span></p>
                        <div className="flex gap-4 text-body-s">
                          {[{ v: true, l: 'Ja — gleiche Gemeinde' }, { v: false, l: 'Nein — verschiedene Gemeinden' }].map(({ v, l }) => (
                            <label key={l} className="flex items-center gap-1.5 cursor-pointer text-ink-700">
                              <input type="radio" name="so-gleiche-gemeinde" checked={soGleicheGemeinde === v}
                                onChange={() => setSoGleicheGemeinde(v)} />
                              {l}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* PLZ→Gemeinde→Amt-Auflösung (ZH/AG/SG/TG/FR/ZG/AI, ordentliche Behörde) */}
                    {amtAufloesbar && amt && (
                      <div>
                        <p className="text-body-s text-ink-900 whitespace-pre-line">
                          {/* strassenlose Ämter (TI: Breno/Onsernone) ohne Leerzeile */}
                          {[amt.name, amt.strasse, amt.plzOrt].filter(Boolean).join('\n')}
                        </p>
                        <p className="text-xs text-ink-500 mt-1">{f.kanton === 'ZH' && f.gemeinde.trim().toLowerCase() === 'zürich'
                          ? zhStrassenInfo === 'strasse'
                            ? `aufgelöst über Strasse${zhNummer.trim() ? ' + Hausnummer' : ''} → Stadtkreis (amtliche Gebäudeadressen der Stadt Zürich + Ämterverzeichnis).`
                            : `aufgelöst über PLZ ${f.plz} → Stadtkreis (amtliche Gebäudeadressen der Stadt Zürich + Ämterverzeichnis).`
                          : `aufgelöst über ${f.plz ? `PLZ ${f.plz} → ` : ''}Gemeinde ${f.gemeinde.trim()} (amtl. Ortschaftenverzeichnis + amtliches Ämterverzeichnis).`}</p>
                      </div>
                    )}
                    {amtAufloesbar && zhKreise && (
                      <div className="space-y-1.5">
                        <p className="text-xs text-ink-500">{f.kanton === 'TI'
                          ? `Die Gemeinde ${f.gemeinde.trim()} erstreckt sich über mehrere Circoli — massgeblich ist der ORTSTEIL/das Quartier der beklagten Partei:`
                          : zhKreise.some((a) => a.anteilProzent !== undefined)
                            // Kreis-Automatik (12.6.2026): PLZ liegt in Kreisen
                            // verschiedener Ämter — eingegrenzte Wahl mit
                            // amtlichem Adressenanteil (Gebäudeadressen Stadt ZH).
                            ? `Stadt Zürich: PLZ ${f.plz} liegt in mehreren Stadtkreisen — massgeblich ist der STADTKREIS der beklagten Partei (Anteil der Gebäudeadressen in Klammern):`
                            : 'Stadt Zürich: massgeblich ist der STADTKREIS der beklagten Partei — sechs Kreis-Ämter:'}</p>
                        <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                          {zhKreise.map((a) => (
                            <li key={a.kreise} className="text-body-s text-ink-800">
                              <span className="font-medium text-ink-900">{a.name}</span> — {a.kreise}
                              {a.anteilProzent !== undefined && <span className="text-ink-500 num"> ({a.anteilProzent < 0.1 ? '< 0.1' : a.anteilProzent} % der Adressen)</span>}
                              <br />{[a.strasse, a.plzOrt].filter(Boolean).join(', ')}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {!(amtAufloesbar && (amt || zhKreise)) && !(mieteAufloesbar && mieteAmt) && (
                      <p className="text-body-s text-ink-800">
                        {recherche.aufloesung.beschreibung}.{' '}
                        {/* VD ohne Streitwert-Stufe: die PLZ-Auflösung ist hier
                            bewusst inaktiv — Hinweis unterdrücken (Bug-Check
                            11.6.2026). SO: Instruktion steht bereits in der
                            Weiche-beschreibung (Bug-Check B3). */}
                        {amtAufloesbar && !(f.kanton === 'VD' && !vdStufe) && f.kanton !== 'SO' && (
                          <span className="text-ink-500">PLZ oder Gemeinde eingeben für die konkrete Amts-Adresse. </span>
                        )}
                        <a href={recherche.aufloesung.url} target="_blank" rel="noreferrer" className="text-brass-700 underline">
                          Amtliches Verzeichnis öffnen ↗
                        </a>
                      </p>
                    )}
                  </>;
                })()}
                <p className="text-xs text-ink-500 pt-2 border-t border-line">
                  Quelle: {recherche.quelle} (Stand {recherche.stand}). Recherche zweifach geprüft — fachliche Abnahme ausstehend; Adresse vor Einreichung kurz gegenprüfen.
                </p>
              </div>
            )}
            {kantonOffen && (
              <p className="lc-notice text-body-s">
                Kanton {f.kanton}: Die konkreten Stellen sind noch nicht hinterlegt — die bundesrechtliche
                Einordnung oben gilt; Behörde und Adresse bitte über das kantonale Justizportal ermitteln.
              </p>
            )}
            {kantonDaten && r.schlichtung.obligatorisch && f.instanz === 'einleitung' && !stelle && !kantonOffen && (
              <p className="lc-notice text-body-s">
                Für diese Behörden-Art ist im Kanton {f.kanton} noch keine Adresse hinterlegt.
              </p>
            )}

            {/* Praxis-Fahrplan (Umbau «maximal praxistauglich», 5.6.2026) */}
            {fahrplan && f.instanz === 'einleitung' && (
              <div className="lc-card p-5 space-y-3">
                <GruppenTitel>Ihr Fahrplan</GruppenTitel>
                <ol className="space-y-2.5">
                  {fahrplan.map((s, i) => (
                    <li key={s.titel} className="flex gap-3">
                      <span aria-hidden className="shrink-0 w-6 h-6 bg-brass-100 text-brass-700 inline-flex items-center justify-center text-xs font-semibold num">{i + 1}</span>
                      <span>
                        <span className="block text-body-s font-medium text-ink-900">{s.titel}</span>
                        <span className="block text-body-s text-ink-600">{s.text}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Kosten (kantonale Rahmen, zweifach geprüfte Erlass-Daten) */}
            {f.instanz === 'einleitung' && (r.schlichtung.obligatorisch || r.eingabeArt === 'klage_direkt') && (
              <div className="lc-card p-5 space-y-2.5">
                <GruppenTitel>Voraussichtliche Kosten{f.kanton ? ` (${f.kanton})` : ''}</GruppenTitel>
                {r.schlichtung.obligatorisch && (
                  r.schlichtung.kostenlos ? (
                    <p className="text-body-s text-ink-800">
                      <span className="font-medium text-ink-900">Schlichtungsverfahren: kostenlos.</span>{' '}
                      {r.schlichtung.kostenlosGrund}. Keine Parteientschädigung im Schlichtungsverfahren (Art. 113 Abs. 1 ZPO).
                    </p>
                  ) : kosten ? (
                    <p className="text-body-s text-ink-800">
                      <span className="font-medium text-ink-900">Schlichtungsgebühr: CHF {kosten.schlichtung.text}.</span>{' '}
                      <span className="text-ink-500">(
                        {f.kanton !== '' ? (
                          <a href={ERLASS_LINKS[f.kanton].schlichtung} target="_blank" rel="noreferrer" className="underline hover:text-brass-700">{kosten.schlichtung.erlass} ↗</a>
                        ) : kosten.schlichtung.erlass})</span>
                      {kosten.schlichtung.hinweis && <span className="block text-xs text-warn-700">⚠ <KantonNormText text={kosten.schlichtung.hinweis} quelle={{ quelleUrl: f.kanton !== "" ? ERLASS_LINKS[f.kanton].schlichtung : undefined, artikel: kosten.schlichtung.erlass, erlassName: kosten.schlichtung.erlass }} /></span>}
                    </p>
                  ) : (
                    <p className="text-body-s text-ink-600">Schlichtungsgebühr: kantonaler Rahmen — Kanton wählen.</p>
                  )
                )}
                {/* Nicht vermögensrechtlich (Auftrag David 6.6.2026): eigener
                    kantonaler Rahmen statt der Streitwert-Staffel; bei Scheidung
                    zusätzlich der Familien-Sonderrahmen, wo der Erlass einen kennt. */}
                {kosten && !f.vermoegensrechtlich && kosten.nichtVermoegensrechtlich ? (
                  <p className="text-body-s text-ink-800">
                    <span className="font-medium text-ink-900">Gerichtskosten 1. Instanz (nicht vermögensrechtlich): {/^[A-Za-zÜü(]/.test(kosten.nichtVermoegensrechtlich.text) ? '' : 'CHF '}{kosten.nichtVermoegensrechtlich.text}.</span>{' '}
                    <span className="text-ink-500">(
                      {f.kanton !== '' && ERLASS_LINKS[f.kanton].gericht ? (
                        <a href={ERLASS_LINKS[f.kanton].gericht!} target="_blank" rel="noreferrer" className="underline hover:text-brass-700">{kosten.nichtVermoegensrechtlich.erlass} ↗</a>
                      ) : kosten.nichtVermoegensrechtlich.erlass})</span>
                    {kosten.nichtVermoegensrechtlich.hinweis && <span className="block text-xs text-ink-500"><KantonNormText text={kosten.nichtVermoegensrechtlich.hinweis} quelle={{ quelleUrl: f.kanton !== "" ? ERLASS_LINKS[f.kanton].gericht : undefined, artikel: kosten.nichtVermoegensrechtlich.erlass, erlassName: kosten.nichtVermoegensrechtlich.erlass }} /></span>}
                  </p>
                ) : kosten && (
                  <p className="text-body-s text-ink-800">
                    <span className="font-medium text-ink-900">Gerichtskosten 1. Instanz: {/^[A-Za-zÜü]/.test(kosten.gericht.text) ? '' : 'CHF '}{kosten.gericht.text}.</span>{' '}
                    <span className="text-ink-500">(
                      {f.kanton !== '' && ERLASS_LINKS[f.kanton].gericht ? (
                        <a href={ERLASS_LINKS[f.kanton].gericht!} target="_blank" rel="noreferrer" className="underline hover:text-brass-700">{kosten.gericht.erlass} ↗</a>
                      ) : kosten.gericht.erlass})</span>
                    {kosten.gericht.hinweis && <span className="block text-xs text-ink-500"><KantonNormText text={kosten.gericht.hinweis} quelle={{ quelleUrl: f.kanton !== "" ? ERLASS_LINKS[f.kanton].gericht : undefined, artikel: kosten.gericht.erlass, erlassName: kosten.gericht.erlass }} /></span>}
                  </p>
                )}
                {kosten && f.streitsache === 'scheidung' && kosten.familie && (
                  <p className="text-body-s text-ink-800">
                    <span className="font-medium text-ink-900">Familien-/Scheidungsrahmen: {/^[A-Za-zÜü(0-9]/.test(kosten.familie.text) && !/^\d/.test(kosten.familie.text) ? '' : 'CHF '}{kosten.familie.text}.</span>{' '}
                    <span className="text-ink-500">({kosten.familie.erlass})</span>
                    {kosten.familie.hinweis && <span className="block text-xs text-ink-500"><NormText text={kosten.familie.hinweis} /></span>}
                  </p>
                )}
                <p className="text-xs text-ink-500">
                  Rahmen aus den geltenden kantonalen Erlassen (Stand 5.6.2026) — die konkrete Festsetzung liegt bei der Behörde.
                  Hinzu kommen ggf. eigene Anwaltskosten; die unterliegende Partei trägt im Gerichtsverfahren in der Regel die
                  Kosten und eine Parteientschädigung (Art. 106 ZPO).
                </p>
              </div>
            )}

            {/* Verfahrens-Eckdaten — bewusst NACH Stelle/Fahrplan/Kosten (Endkonsumenten-Dramaturgie 6.6.2026) */}
            <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
              {[
                { label: 'Örtlich (Grundsatz)', val: r.oertlich.gerichtsstand },
                { label: 'Verfahrensart', val: r.verfahrensart === 'vereinfacht' ? 'Vereinfacht' : r.verfahrensart === 'scheidungsverfahren' ? 'Scheidungsverfahren' : 'Ordentlich' },
                { label: 'Einleitende Eingabe', val: eingabeText },
              ].map((c) => (
                <EckdatenKachel key={c.label} label={c.label} wert={c.val} />
              ))}
            </div>

            {r.weichen.length > 0 && (
              <div className="space-y-1.5">
                {r.weichen.map((w, i) => <p key={i} className="lc-notice text-body-s"><NormText text={w} /></p>)}
              </div>
            )}

            <ErgebnisAnzeige titel="Zuständigkeit nach ZPO" ergebnis={ergebnis} />
            {ergebnis && <BegruendungSlot ergebnis={ergebnis} />}
            <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen} pdf={pdfConfig}
              query={() => permalinkKodieren(ZUST_LINK_SPEC, { ...f, schritt })}>
              <p className="text-body-s text-ink-500">
                Schwellen: vereinfacht ≤ CHF {ZPO_SCHWELLEN.VEREINFACHT.toLocaleString('de-CH')} ·
                Entscheidvorschlag ≤ {ZPO_SCHWELLEN.ENTSCHEIDVORSCHLAG.toLocaleString('de-CH')} ·
                Entscheid ≤ {ZPO_SCHWELLEN.ENTSCHEID_AUF_ANTRAG.toLocaleString('de-CH')} (ZPO-Fassung 1.1.2025).
              </p>
            </ErgebnisExport>
          </ErgebnisBlock>
        )}
    </>
  );
}
