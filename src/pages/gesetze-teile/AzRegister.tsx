// IA-3 · A–Z-/Kürzel-Register (FAHRPLAN-GESETZES-UX §11.5, Muster M6
// gesetze-im-internet): Browse-Zwilling zum Norm-Sprung auf dem neutralen
// G4-Landeplatz /gesetze — zweiter, alphabetischer Zugang NACH der dichten
// Rechtsgebiets-Übersicht (J3). Buchstaben-Leiste, title-only, auf dem BEREITS
// client-geladenen register.json-Manifest — KEIN zweiter Suchindex (K10),
// KEIN dritter Suchpfad (A5/§Z1: die Sprung-Karte bleibt CTA auf die
// HeaderSuche).
//
// J3-Säuberung (Cowork-Befund 18, 18.8.2026): das frühere eigene Titel/
// Kürzel-Filterfeld dieses Registers ist ENTFERNT — es duplizierte den
// Gesetze.tsx-eigenen Browse-Filter («Suchen — Kürzel, Titel, SR-Nr.», bereits
// sichtbar direkt über dem Landeplatz, gleicher Scope «alle Ebenen», gleiche
// Kürzel/Titel-Basis) ohne eigenen Mehrwert — vier gleichzeitig sichtbare
// Suchfelder ohne abgegrenzte Geltungsbereiche waren der gemeldete Befund.
// Nichttrage-Nachweis: Freitext-Suche bleibt über das Gesetze.tsx-Feld
// erreichbar (führt zur volleren, nach Bund/Kanton/International gruppierten
// Trefferliste — strikt überlegen zur früheren In-Register-Teilliste); dieses
// Register bedient nur noch den eigenständigen Anwendungsfall «ich kenne den
// Anfangsbuchstaben, nicht das Kürzel» (§11.3 H1-Budget, weiterhin 2 Klicks).
//
// Perf (§15/R-PERF-5): Lazy-je-Buchstabe — es rendert IMMER nur die gewählte
// Buchstaben-Klasse (grösste: V mit ~589 Titeln), nie alle 1469.
//
// ── CLS-ENTSCHEID, LM-162 (B6-N1, 30.8.2026): `h-96` → `max-h-96` ──────────
// Der frühere Entscheid war «KONSTANTE Höhe in JEDEM Zustand» (§15.2, CI-Befund
// PR #347). Er ist mit LM-162 (Sichtprüfung 29.7.2026) ausdrücklich GEÄNDERT,
// nicht still gekippt: bei acht Titeln unter «M» standen 138 px leerer Rahmen,
// und der Kasten behauptete damit eine Menge, die er nicht hat (§8).
//
// DER ENTSCHEID TRÄGT WEITER, WO ER TRUG, und fällt, wo er nur noch Weissraum
// kostete. Was PR #347 wirklich rot machte, waren INPUT-FREIE Shifts: (a) die
// asynchron korrigierten content-visibility-Platzhalter der Zeilen und (b)
// LI-Knoten, die React über den Klassen-Wechsel hinweg wiederverwendete und die
// dann IM Scroll-Container wanderten. Beide Gegenmittel bleiben unverändert
// bestehen (kein content-visibility; `key` am <ul> erzwingt frische Knoten).
// Die AUSSENhöhe des Kastens ändert sich dagegen ausschliesslich auf einen
// Buchstaben-Klick — dieselbe Kategorie, die dieser Kopf für die erste Montage
// der Box schon seit Befund 19 (18.8.2026) als unschädlich führt. Zwei Klicks
// derselben Leiste dürfen nicht verschieden bewertet werden.
//
// GEMESSEN, nicht behauptet (§6.7): `e2e/gesetze-az-register.e2e.ts` fährt unter
// CPU-Drossel 6× V (589 Titel) → G und danach einen Innen-Scroll und verlangt
// CLS === 0 auf input-freie Shifts; `e2e/gesetze-footer-cls.e2e.ts` deckt den
// Footer derselben Seite. Beide bleiben grün. Zusätzlich prüft die Spec jetzt
// die Aussage des Befundes selbst: kleine Klasse ⇒ Kasten < 384 px und ohne
// Leerrand, grosse Klasse ⇒ bei 384 px gedeckelt und scrollbar.
//
// BEWUSST kein content-visibility auf den Zeilen: dessen Platzhalter-Schätzung
// (contain-intrinsic-size) wurde asynchron auf die echte Zeilenhöhe korrigiert —
// genau die input-freien LI-Shifts, die das CLS-Tor in CI rot machten (Quellen-
// Attribution 25.7.2026: prev 44px → cur 29/50px). Ein einziger synchroner
// Layout-Pass je Commit ist hier billiger und shift-frei. Die Scroll-Box wird
// ERST montiert, sobald ein Buchstabe gewählt ist (Befund 19, 18.8.2026: leerer
// Startzustand belegte einen halben Bildschirm) — dieser Wechsel ist IMMER
// klick-/input-getrieben (nie async) und verletzt die CLS-Invariante darum
// nicht; seit LM-162 gilt dieselbe Begründung für den Wechsel ZWISCHEN Klassen.
//
// Mobil kollabiert (§3.1 «keine Wucherung», §11.5-DoD): auf schmalen Viewports
// startet die Sektion zugeklappt (Disclosure-Button, aria-expanded).
// Reine Darstellung (§3) — die Einsortierungs-Regeln leben testbar in
// az-register.ts.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { istLesbar, type BrowseErlass } from '../../lib/normtext/browse-typen';
import { AZ_KLASSEN, gruppiereAZ, ebeneLabel } from './az-register';
import { erlassPfad } from '../../lib/normtext/erlassAdresse';
import { zahlGruppiert } from '../../components/typografie';

function AzZeile({ e }: { e: BrowseErlass }) {
  const basePath = erlassPfad(e);
  // Kürzel dezent daneben, wenn es echten Mehrwert trägt (nicht schon im Titel —
  // kantonale «kuerzel» sind oft der ganze Titel, vgl. SysZeile).
  // B13/LM-118: IN KLAMMERN wie in den Bundes-Titeln («Medizinprodukteverordnung
  // (MepV)»); freistehend las es sich als Teil des Titels («… Basel-Stadt,
  // Mietreglement MR»). Eine Kürzel-Schreibweise auf der ganzen Liste.
  const zeigeKuerzel = e.kuerzel && e.kuerzel !== e.titel && !e.titel.includes(e.kuerzel);
  const inhalt = (
    <>
      <span className="min-w-0 break-words text-ink-700 group-hover/az:text-ink-900 group-hover/az:underline underline-offset-2">
        {e.titel}
        {zeigeKuerzel && <span className="ml-2 text-xs text-ink-500">({e.kuerzel})</span>}
      </span>
      <span className="shrink-0 flex items-baseline gap-2 text-xs text-ink-500">
        <span>{ebeneLabel(e)}</span>
        {/* 'nur-live-link' führt ehrlich nach aussen (§8) — wie ErlassZeile. */}
        {!istLesbar(e) && <span aria-hidden className="text-reg-g">↗</span>}
      </span>
    </>
  );
  const cls = 'group/az grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 px-2 py-1 text-body-s no-underline lc-hover-flaeche';
  return istLesbar(e)
    ? <Link to={basePath} className={cls}>{inhalt}</Link>
    : <a href={e.quelleUrl} target="_blank" rel="noopener noreferrer" className={cls}>{inhalt}</a>;
}

export function AzRegister({ erlasse }: { erlasse: BrowseErlass[] }) {
  // Mobil kollabiert: Erstzustand folgt dem Viewport (sm-Grenze wie das übrige
  // Layout) und FOLGT dem Breakpoint weiter (Rotation/Fenster-Resize), bis der
  // Nutzer selbst togglet — dann gewinnt seine Wahl. Nur clientseitig gerendert
  // (erlasse-gated) — kein SSR-Mismatch; render-then-replace bleibt (§15.5).
  const [offen, setOffen] = useState<boolean>(() =>
    typeof window === 'undefined' ? true : window.matchMedia('(min-width: 640px)').matches);
  const manuell = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const auf = () => { if (!manuell.current) setOffen(mq.matches); };
    mq.addEventListener('change', auf);
    return () => mq.removeEventListener('change', auf);
  }, []);
  const [buchstabe, setBuchstabe] = useState<string | null>(null);

  const gruppen = useMemo(() => gruppiereAZ(erlasse), [erlasse]);
  // Sichtbare Liste: die gewählte Buchstaben-Klasse (Lazy-je-Buchstabe — nie
  // alle 1469 auf einmal); null = noch nichts gewählt.
  //
  // R5-C (5.9.2026) · WARUM HIER KEIN LEERZUSTAND STEHT: eine gewählte Klasse
  // ist nie leer. `gruppiereAZ` legt einen Map-Eintrag ausschliesslich beim
  // ERSTEN Erlass einer Klasse an (leere Gruppen entstehen gar nicht), und die
  // Buchstaben-Leiste unten setzt `disabled` bei `n === 0` — ein Buchstabe ohne
  // Titel ist also nicht wählbar. Bis Runde 4 hing unter dieser Zeile ein
  // `liste.length > 0 ? <ul> : <Leerzustand …>`; GEMESSEN am Preview
  // (`/gesetze`, 5.9.2026): 27 Knöpfe, 4 davon disabled, alle 23 übrigen
  // durchgeklickt — der Leerzustand erschien null Mal. Ein Zweig, der nicht
  // scheitern kann, ist gefährlicher als keiner (§6.7): er sieht nach
  // geprüftem Verhalten aus und ist keines. Darum `?? null` statt `?? []` —
  // die eine Bedingung unten trägt jetzt beide unerreichbaren Fälle.
  const liste = buchstabe ? gruppen.get(buchstabe) ?? null : null;

  return (
    <section aria-labelledby="az-register-kopf" className="lc-card p-5 space-y-4">
      <h2 id="az-register-kopf" className="m-0">
        <button
          type="button"
          aria-expanded={offen}
          aria-controls="az-register-panel"
          onClick={() => { manuell.current = true; setOffen((o) => !o); }}
          className="group flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 text-left"
        >
          <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight group-hover:underline underline-offset-4">
            A–Z-Register
          </span>
          {/* Kein «Bund/Kantone/International» im Button-Namen: die Wörter
              kollidierten (strict mode) mit den Accessible Names der drei
              Einstiegskacheln — die Ebenen-Erklärung steht unten im Panel. */}
          <span className="text-body-s text-ink-500">
            <span className="num">{zahlGruppiert(erlasse.length)}</span> Erlasse nach Titel
          </span>
          {/* R8 (7.9.2026): der Pfeil dreht per `rotate-90`. Ein Transform
              aendert die LAYOUT-Breite nicht, wohl aber den gezeichneten
              Kasten — das hohe, schmale Glyphen-Feld wurde gedreht zum
              breiten und ragte 10 px ueber die Karte hinaus (gemessen
              /gesetze @768–1440, h2 690/680 px). Ein QUADRATISCHES Feld ist
              drehneutral: gedreht misst es dieselben Kanten wie ungedreht. */}
          <span aria-hidden className={`ml-auto inline-flex size-5 shrink-0 items-center justify-center leading-none text-ink-500 transition-transform ${offen ? 'rotate-90' : ''}`}>›</span>
        </button>
      </h2>

      {offen && (
        <div id="az-register-panel" className="space-y-4">
          {/* Buchstaben-Leiste: Navigation, tastatur-bedienbar (native Buttons,
              Fokus über globales :focus-visible); leere Klassen deaktiviert,
              aria-label trägt die Anzahl (nie nur Farbe/Zustand, §11.6.8). */}
          <nav aria-label="Erlasse nach Anfangsbuchstaben">
            <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
              {AZ_KLASSEN.map((k) => {
                const n = gruppen.get(k)?.length ?? 0;
                const aktiv = buchstabe === k;
                return (
                  <li key={k}>
                    <button
                      type="button"
                      disabled={n === 0}
                      aria-pressed={aktiv}
                      aria-label={`${k} — ${n === 0 ? 'keine Erlasse' : `${n} ${n === 1 ? 'Erlass' : 'Erlasse'}`}`}
                      onClick={() => setBuchstabe((b) => (b === k ? null : k))}
                      className={`num min-w-9 px-1.5 py-1 text-body-s font-medium border-b-2 transition-colors ${
                        aktiv
                          ? 'border-reg-g text-ink-900'
                          : n === 0
                            ? 'border-transparent cursor-default text-ink-300'
                            : 'border-transparent text-ink-700 lc-hover-flaeche hover:text-ink-900'
                      }`}
                    >
                      {k}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Befund 19 (18.8.2026): solange nichts gewählt ist, nur ein
              schlanker Hinweis — keine reservierte h-96-Fläche mehr für einen
              leeren Zustand. Die Rechtsgebiets-Übersicht (J3) trägt jetzt den
              gehaltvollen Default-Inhalt des Landeplatzes. */}
          {!liste ? (
            <p className="text-body-s text-ink-500">
              Einen Anfangsbuchstaben wählen — jeder Titel führt in den Volltext.
            </p>
          ) : (
            /* §15.2 (CI-Befund PR #347): Status-Zeile mit FESTER Höhe + Liste in
               einem Scroll-Container mit KONSTANTER Höhe — ein KLASSEN-Wechsel
               ändert nur den Inhalt, nie die Aussengeometrie. So gibt es
               strukturell keinen input-freien Shift, auch wenn ein Commit auf
               langsamer Hardware erst nach der 500-ms-Input-Gnade landet. Die
               erste Montage dieser Box ist selbst IMMER klick-getrieben (der
               Zweig oben rendert sonst den Hinweis) — kein input-freier Shift. */
            <div className="space-y-2">
              {/* Der innere span ist je Status-Text ein FRISCHER Knoten (key):
                  Chrome zählt das Umschreiben eines bestehenden Text-Knotens als
                  layout-shift (Quellen-Attribution 25.7.: «#text …»», 0.0013,
                  auf langsamer Hardware input-frei) — ein neu eingefügter Knoten
                  in einer fix hohen Zeile (h-5) shiftet dagegen strukturell nie. */}
              <p aria-live="polite" className="h-5 truncate text-xs text-ink-500">
                <span key={`b:${buchstabe}:${liste.length}`}>
                  <span className="num">{liste.length}</span> Titel unter «{buchstabe}»
                </span>
              </p>
              {/* Scrollbare Region: tastatur-erreichbar (tabIndex, axe
                  scrollable-region-focusable) und benannt.
                  LM-162 (B6-N1, 30.8.2026): `h-96` → `max-h-96` — der Kasten
                  wächst mit seinem Inhalt und DECKELT erst bei 384 px (dann
                  scrollt er). Herleitung im Datei-Kopf. */}
              <div
                role="region"
                aria-label="Register-Liste"
                tabIndex={0}
                className="max-h-96 overflow-y-auto overscroll-contain border-y border-rule-soft py-1"
              >
                <ul
                  /* Remount je Klasse (CI-Befund PR #347, Rest-Shift): OHNE den
                     key reusen React-Keys (e.key) LI-Knoten über den Klassen-
                     Wechsel hinweg — überlebende Knoten WANDERN dann im
                     Scroll-Container (layout-shift), und auf langsamer
                     Hardware landet der Commit nach der 500-ms-Input-Gnade.
                     Frische Knoten je Klasse shiften nie. */
                  key={`b:${buchstabe}`}
                  className="m-0 list-none space-y-0.5 p-0"
                >
                  {liste.map((e) => <li key={e.key}><AzZeile e={e} /></li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
