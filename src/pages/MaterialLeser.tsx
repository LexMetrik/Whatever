import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KopfOverline, LeserKopfGeruest } from '../components/layout/LeserKopfGeruest';
import { SeitenTitel } from '../components/ui/SeitenTitel';
import { ladeMaterial } from '../lib/materialien/browse';
import { KontextPanel } from '../components/kontext/KontextPanel';
import { MaterialEntstehung } from '../components/entstehung/MaterialEntstehung';
import { StatusBadge } from '../components/verzahnung/StatusBadge';
import { GEBIET_LABEL } from '../lib/normtext/register';
import { MASSGEBLICH_SATZ } from '../lib/benennung';
import { Datum } from '../components/ui/Datum';
import { QuellLink } from '../components/ui/QuellLink';
import { FehlSeite } from '../components/ui/FehlSeite';
import { Ladeanzeige } from '../components/ui/Ladeanzeige';
import { useMeldeInhaltsKopf } from '../components/layout/InhaltsKopfKontext';
import type { BrowseMaterial } from '../lib/materialien/typen';

// ─── Reader EINES Materials (/materialien/:key) ─────────────────────────────
//
// Amtliche Ressource (Soft-Law). Zeigt NUR bibliografische Metadaten + einen
// prominenten Live-Link zur amtlichen Fassung — KEIN gespeicherter Dokument-
// inhalt (§7/§8: kein Normtext, kein Extraktionsrisiko, massgeblich bleibt die
// amtliche Quelle). Dazu die Verzahnung zu Gesetzen + Werkzeugen über normKeys
// (Burggraben-Keim, später B3-Kontext-Panel). Reine Darstellung (§3); maschinell
// kuratiert, fachlich noch nicht durch David geprüft (Abnahme-Zeitsperre, §8).

const SPRACH_LABEL: Record<string, string> = { de: 'Deutsch', fr: 'Französisch', it: 'Italienisch' };

export function MaterialLeser() {
  const { key = '' } = useParams();
  const meldeKopf = useMeldeInhaltsKopf();
  // Ein Zustand pro geladenem key — `laden` wird abgeleitet (kein synchrones
  // setState im Effect; vermeidet kaskadierende Renders, react-hooks-Regel).
  const [data, setData] = useState<{ key: string; material: BrowseMaterial | null } | null>(null);

  useEffect(() => {
    let lebt = true;
    ladeMaterial(decodeURIComponent(key)).then((m) => {
      if (!lebt) return;
      setData({ key, material: m });
      if (m) document.title = `${m.titel} — LexMetrik`;
    });
    return () => { lebt = false; };
  }, [key]);

  // Kopf melden (sonst zeigte der Pfad-Fallback «Zuletzt geöffnet», weil
  // verlaufLabel keine Materialien-Keys auflöst). Kurz-Label = Klammer-Inhalt
  // des Titels (z. B. «WML»), sonst der Titel.
  //
  // ── A-3 (Design-Konsistenz 31.8.2026) · DER GUARD WAR EINER ZU VIEL ────────
  // Hier stand `if (imPane) return;` — die Meldung unterblieb im Split-View.
  // GEMESSEN: das Pane hiess dann «Material öffnen» (der Verlauf-Fallback),
  // während dieselbe Seite in der Einzelansicht «Materialien › WML» trug: zwei
  // Namen für dasselbe Dokument, und der eine benennt eine HANDLUNG statt des
  // Inhalts (§8 — der Kopf sagt, was offen ist, nicht was man tun könnte).
  // Der Guard war aus der Sorge geboren, die Meldung könnte den Kopf der
  // Hauptfläche überschreiben. Sie kann es nicht: die Melde-Kette ist
  // PANE-LOKAL — `Pane.tsx:125` legt einen eigenen `InhaltsKopfMeldeProvider`
  // um seinen `RouteSwitch`, die Meldung aus dem Pane erreicht darum nur den
  // `PaneKopf` desselben Panes. Damit trägt die Prop `imPane` hier keine
  // Aussage mehr und ist mit dem Guard weggefallen (§17 Rückbau).
  useEffect(() => {
    const mat = data && data.key === key ? data.material : null;
    if (!mat) return;
    const kurz = mat.titel.match(/\(([^)]+)\)\s*$/)?.[1] ?? mat.titel;
    meldeKopf({ breadcrumb: [{ label: 'Materialien', to: '/materialien' }, { label: kurz }] });
  }, [data, key, meldeKopf]);
  // KEIN Unmount-Cleanup `meldeKopf(null)` — gleiche Wurzel wie im
  // EntscheidLeser (Befund David 21.8.2026, Herleitung dort): die Shell setzt
  // bei jedem Pfadwechsel zurück, das passive Cleanup wischte sonst die
  // Kopf-Reservierung der Folgeseite weg.

  const laden = !data || data.key !== key;
  const material = laden ? null : data.material;

  // W3-7 (Posten, REST S2): der eine Lade-Baustein (`ui/Ladeanzeige`, mit
  // `role="status"`) statt der eigenen Kopie.
  if (laden) return <Ladeanzeige text="Das Material wird abgerufen …" className="py-12" />;

  // ── D-6 (Design-Konsistenz, 31.8.2026) · EINE FEHLSEITE ──────────────────
  // Der Fehl-Zweig baute Kopf und Rückweg selbst: `SeitenKopf` + ein
  // `lc-btn-outline`-Knopf. Beides kommt jetzt aus `components/ui/FehlSeite`
  // (Herleitung dort). Sichtbar ändert sich EINES: der Rückweg ist ein ruhiger
  // Textlink statt eines Knopfes — die Mehrheitsform (4:2), und ein Knopf ist
  // die Form für die eine ERLEDIGUNG einer Seite, nicht für den Rückweg aus
  // einer Auskunft (dieselbe Herleitung, die B-1 hier drüber schon für den
  // `QuellLink` gezogen hat). Der Wortlaut «Alle Materialien» bleibt; der
  // zweite Halbsatz des Leads («Zurück zur Übersicht der Materialien.») fällt,
  // weil er nur den Link darunter mit Worten wiederholte.
  // Der Knopf am DOKUMENTFUSS (unten, geladenes Material) bleibt unberührt: er
  // schliesst eine gelesene Seite ab und steht in keiner Fehl-Situation.
  if (!material) {
    return (
      // `key` roh aus der Adresse, NICHT `decodeURIComponent(key)`: der Router
      // liefert den Parameter bereits dekodiert, ein zweiter Durchgang wirft bei
      // einem literalen «%» im Schlüssel — und ein Wurf im Render-Pfad machte aus
      // einer Fehlseite eine Fehlerseite. Gezeigt wird ohnehin genau das, was in
      // der Adresse stand (§8).
      <FehlSeite bereich="Materialien" objekt="Material" name={key}
        erklaerung="Dieser Eintrag existiert nicht (mehr)."
        wege={[{ to: '/materialien', label: 'Alle Materialien' }]} />
    );
  }

  const m = material;

  return (
    <article className="space-y-8">
      {/* ── B-4 (Design-Konsistenz Runde 2, 31.8.2026) · DERSELBE LESER-KOPF ───
          Dieser Leser lieh sich bis hierher den Kopf der STATISCHEN Seiten
          (`layout/SeitenKopf`) — samt Ablesekante (`scale-rule`), dem Marken-
          Signet der Sekundärseiten, und mit einer einzigen Meta-Zeile, in der
          Herkunft, Datum, Sprache, Rechtsgebiet und ein §8-Badge nebeneinander
          standen. Ein Material IST aber ein Dokument-Leser wie Erlass und
          Entscheid; es bekommt darum deren Bänder-Ordnung aus dem geteilten
          `layout/LeserKopfGeruest` (§5/§10).
          SICHTBAR ändert sich dreierlei, alles in Richtung der beiden anderen
          Leser: die Ablesekante entfällt (kein Leser-Kopf trägt sie), der Kopf
          bekommt die Haarlinie unter sich, und das Rechtsgebiet wandert aus der
          Meta-Zeile in die Overline — dorthin, wo Erlass- und Entscheid-Leser
          ihr Sachgebiet seit je zeigen (B-7). Kein Wort geht verloren. */}
      {/* W2·29-WERKBANK-REST S2 (25.9.2026) · DAS TITELBLATT DER WERKBANK.
          Die Identität (Overline · Titel · Fakten) steht auf der Registerfläche
          der Route (`form="titelblatt"`, dieselbe Prop wie der Erlass-Kopf, LESER
          S2) — Board «Unter-Materialien»: ein Band im Materialien-Register über
          dem Kopf. Das geteilte Gerüst bleibt unverändert; die Fläche «m» setzt
          die Route (`.lc-route[data-reg="m"] .lc-titelblatt-band`, index.css,
          Block «REST S2»). Ehrlichkeits-Zeile, Aktionen und URL-Abdruck bleiben
          auf dem Papier, wie am Erlass. Kein Wort, kein Band entfällt. */}
      <LeserKopfGeruest
        form="titelblatt"
        overline={<KopfOverline glieder={[
          { text: m.behoerdeKuerzel, rolle: 'herkunft' },
          { text: m.nummer ? `${m.doktypLabel} ${m.nummer}` : m.doktypLabel, rolle: 'art' },
          { text: GEBIET_LABEL[m.rechtsgebiet] ?? m.rechtsgebiet, rolle: 'sachgebiet' },
        ]} />}
        /* G3 (Gesamtprüfung 6.9.2026): dieselbe Serif-Stimme wie Erlass-,
           Entscheid- und Vorlagen-Leser. Ein Material ist gelesener Quelltext,
           kein Bedienelement — die Stimmen-Wahl ist die einzige, die dieser
           Kopf noch von den drei anderen Lesern unterschied. */
        titel={<SeitenTitel stimme="serif">{m.titel}</SeitenTitel>}
        fakten={[
          m.behoerdeName,
          // B-3: das Datum lief hier in der Mono-Stimme (`.num`) — die ist nach
          // der Design-Grundlage Kap. 2.1 «auf SR-Nr./Aktenzeichen begrenzt».
          // Jetzt der geteilte `Datum`-Baustein (proportional + tabular-nums),
          // wie im Erlass-Kopf.
          <>Stand <Datum iso={m.stand} /></>,
          SPRACH_LABEL[m.sprache] ?? m.sprache,
        ]}
        // §8-Band: V3-Vorzug (E6a·M5) — kein gehosteter Volltext, nur Verweis +
        // Live-Link. Das Badge ist eine Aussage über die BELASTBARKEIT dessen,
        // was hier steht, und gehört damit in dieselbe Zelle wie der Standausweis
        // des Erlass-Kopfs, nicht in die Fakten-Kette.
        ehrlichkeit={<p className="text-xs leading-snug text-ink-500"><StatusBadge praedikat="nur-verweis" /></p>}
        // Sichtbarer Live-Link zur amtlichen Fassung (§7c) — im Aktionen-Band,
        // wie der Quell-Link des Erlass-Kopfs. Herleitung des Wortlauts und der
        // ruhigen Form: `ui/QuellLink` (B-1; hier stand die lauteste von vier
        // Formen, ein schwarzer Primärknopf «Zur amtlichen Fassung ↗»).
        aktionen={<QuellLink href={m.quelleUrl} className="lc-chip" />}
      >
        {/* Der ROHE URL-ABDRUCK BLEIBT: er ist keine blosse Dopplung des `href`,
            sondern eine datierte Transparenz-Zusage (§7c/§8) — dass man VOR dem
            Klick sieht, auf welche Behörden-Domain man geschickt wird. Sie ist
            als solche zugesichert (`e2e/materialien-m1…m4`: «Die URL steht
            zusätzlich als sichtbarer Text»). Ihn im Zug einer Design-Angleichung
            zu entfernen, wäre ein Abbau von Ehrlichkeit, nicht von Dopplung. */}
        <p className="text-xs text-ink-500 break-all max-w-reading">{m.quelleUrl}</p>
      </LeserKopfGeruest>

      {/* §8: ehrlicher Status — Soft-Law, kein Gesetzesrang, fachlich ungeprüft. */}
      <div className="lc-notice max-w-reading">
        <p>
          <strong>Behördenpublikation, kein Gesetzesrang.</strong> Verwaltungsverordnungen
          (Kreisschreiben, Wegleitungen, Leitfäden u.&nbsp;a.) binden die Verwaltung intern und
          sind faktisch praxisleitend, aber für Gerichte und Private nicht direkt verbindlich.
          {' '}{MASSGEBLICH_SATZ} Maschinell erfasst, fachlich noch nicht
          geprüft.
        </p>
        {m.hinweis && <p className="mt-2 text-ink-500">{m.hinweis}</p>}
      </div>

      {/* Einheitliches Kontext-Panel (B3): Norm ↔ Entscheid ↔ Werkzeug über die
          normKeys des Materials (Burggraben — Behördenpraxis an die Norm/den
          Entscheid gebunden). */}
      <KontextPanel typ="material" normKeys={m.normKeys} />

      {/* W2·6c-E3 · DIE RÜCKRICHTUNG. Am Artikel führt die Entstehungs-Karte zu
          dieser Botschaft; hier geht derselbe Weg zurück. Der Block rendert NUR
          mit Anker-Sidecar (§11.5 «Am Material»; ohne ihn steht schon oben der
          Live-Link) und holt ihn nur bei einer Botschaft — Herleitung in
          `components/entstehung/MaterialEntstehung.tsx`. */}
      <MaterialEntstehung materialKey={m.key} doktyp={m.doktyp} />

      {/* ── LM-137 (W2·17-UI-BEFUNDE/B16) · TRENNLINIEN DERSELBEN EBENE FLUCHTEN ─
          Diese Linie lief ungedeckelt über die volle Spalte. Gemessen 4.9.2026
          @1440 auf /materialien/ESTV-KS-DBG-5A (Preview von origin/main): die Linie
          über «Alle Materialien» endete bei 1384, die Linie unter «KONTEXT»
          unmittelbar darüber bei 952 — zwei Abschluss-Linien derselben Ebene in
          zwei Breiten. Die 952 sind kein Defekt, sondern die Lesespalte, auf der
          der ganze Seitenkörper steht (`lc-notice max-w-reading`, `KontextPanel`
          `… max-w-reading`); es fehlte allein hier. Deckel angeglichen — der
          Inhalt steht damit in EINER Spaltenbreite.

          NICHT geändert, weil Kanon und kein Defekt: dass der Leser-KOPF breiter
          läuft als der Körper. Das ist die Bänder-Ordnung des geteilten
          `LeserKopfGeruest` (B-4), die Erlass-, Entscheid- und Material-Leser
          gemeinsam tragen — dieselbe Trennung, die E6/A37 im Gesetz-Leser gebaut
          hat (breiter Kopf, Lesespalte für den Text). Ebenso Kanon ist der im
          selben Befund genannte Entscheid-Aufbau «Titel/Meta breit, Entscheidtext
          in der Lesespalte» (Reglement R1, 60–75 Zeichen). */}
      <div className="border-t border-rule-soft pt-6 max-w-reading">
        <Link to="/materialien" className="lc-btn lc-btn-outline lc-btn-sm">← Alle Materialien</Link>
      </div>
    </article>
  );
}
