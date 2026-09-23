import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { InternRefs } from '../../components/NormText';
import type { BrowseErlass, BrowseManifest } from '../../lib/normtext/browse-typen';
import type { CurrencyMap, ErlassKopf } from '../../lib/normtext/browse';
import { KontextPanel } from '../../components/kontext/KontextPanel';
import { QuellLink } from '../../components/ui/QuellLink';
import { Datum } from '../../components/ui/Datum';
import { ErlassKopfBlock, ErlassLeserKopf } from './parts';
import { AmtlichesPdf } from './parts/AmtlichesPdf';
import { ErlassUebersicht } from './parts/ErlassUebersicht';
import { GesetzFehlSeite } from './FehlSeite';
import { ebeneAngabe } from './v3/erlassAnsicht';
import { routenEbene } from '../../lib/normtext/erlassAdresse';

// ═══ ABSCHNITT · Nicht-Volltext-Leseansichten (§6.6-Split, W2·12-HYGIENE/B24) ═══
// Reine Präsentationskomponenten (Props rein, §3) — aus GesetzLeserInhalt
// ausgelagert, damit die Reader-Datei unter der §6.6-Schlankheitsschwelle bleibt.
// VERHALTENSNEUTRAL: identisches Markup wie die früheren Inline-Zweige (golden/
// Snapshot byte-gleich); keine Rechtsregel, kein Normtext, keine Reihenfolge berührt.

// §15.2 CLS-Lade-Reservierung: solange Snapshot/Struktur/Currency async laden,
// reserviert min-h-screen (Token, §13) die volle Lesehöhe. Kein Inhalt wird
// versteckt/gekürzt (§15/2) — es ist derselbe Spinner-Platzhalter für alle
// Lade-Pfade (Fehler ausgenommen), damit der einwachsende React-Baum keinen
// grossen Sprung erzeugt.
export function LadeAnzeige() {
  return (
    <div className="min-h-screen py-12 text-center space-y-3">
      <div className="scale-rule max-w-[200px] mx-auto" aria-hidden />
      <p className="text-body-s text-ink-500">Der Erlass wird abgerufen …</p>
    </div>
  );
}

// ── pdf-embed: amtliches PDF in-app (kein extrahierbarer Volltext-HTML) ──────
// Auftrag David 25.6.2026: statt nacktem Live-Link das amtliche Fedlex-PDF in
// den vollen Reader-Rahmen einbetten (Breadcrumb, Kopf, Provenienz, Download,
// native PDF-Suche). Fedlex setzt X-Frame-Options: DENY → Hotlink unmöglich,
// darum SELBST gehostet (same-origin). Wichtig: die globale DENY-Header-Politik
// (vercel.json) ist für /normtext/ auf SAMEORIGIN + frame-ancestors 'self'
// gelockert, sonst blockiert der Browser auch den eigenen PDF-iframe (Prod-only).
// Massgeblich bleibt die amtliche Fassung (sichtbarer Live-Link, §7/§8 — Nomen
// aus `lib/benennung`, B-6-Nachzug R2-A 31.8.2026); Drift-
// Tor: check:pdf (offline Integrität + netz Drift & geltende Konsolidierung).
function PdfEmbedAnsicht({ erlass, currency, kopf, internRefs }: {
  erlass: BrowseErlass;
  currency: CurrencyMap | null;
  kopf: ErlassKopf | null;
  internRefs: InternRefs | undefined;
}) {
  // LM-159 (B6/K-15, Blocker): der iframe zeigte bis zum ersten Zeichnen des
  // Browser-PDF-Viewers eine unbeschriftete, grosse schwarze Fläche (kein Hinweis,
  // keine Ersatzdarstellung). `pdfBereit` schaltet einen Ladezustand ab — derselbe
  // Spinner-Platzhalter wie `LadeAnzeige` oben (EIN Lade-Motiv für alle Lade-Pfade,
  // §15.2-Kommentar). Der iframe bleibt dabei die ganze Zeit gemountet (kein
  // Remount, kein doppeltes Laden), der Platzhalter liegt nur optisch darüber und
  // verschwindet mit `onLoad`. Rahmen und Fallback-Link (LM-159-Dedup-Notiz: schon
  // gebaut) bleiben unverändert.
  const [pdfBereit, setPdfBereit] = useState(false);
  return (
    <div className="space-y-5">
      {/* Breadcrumb trägt der Kopf (Inhalts-Kopf bzw. PaneKopf) — kein Inline-Dup.
          G2b: EINE Kopf-Komponente (ErlassLeserKopf) — hier ohne Options-Leiste,
          da am eingebetteten PDF Fussnoten/Verweise wirkungslos wären
          (keine toten Steuerelemente, §13 F4). */}
      <ErlassLeserKopf erlass={erlass} artikelAnzahl={null} currency={currency?.[erlass.key]}
        // «Staatsvertrag» hing hier an `ebene === 'bund'` — heute folgenlos, weil
        // beide pdf-embed-Erlasse (EMRK, NYUE) Staatsverträge SIND, aber die
        // Auskunft kam aus der falschen Frage: ein bundesrechtliches PDF ohne
        // Staatsvertrags-Charakter hätte sich hier zu einem gemacht (§8). Jetzt
        // aus derselben Ableitung wie Brotkrume und Adresse (Befund 45).
        overline={`${routenEbene(erlass) === 'international' ? 'Staatsvertrag' : ebeneAngabe(erlass).label} · amtliches PDF`}
        hinweis="Amtliches PDF — massgeblich ist die amtliche Fassung"
        aktionen={
          <AmtlichesPdf href={`/normtext/${erlass.pdfPfad}`} stand={erlass.stand} extern={false} dateiname={`${erlass.kuerzel}.pdf`} />
        } />
      {/* M5: Erlass-Kopf-Slot auch im pdf-embed-Pfad (für PDF-Erlasse ohne
          Struktur-Sidecar bleibt kopf=null → nichts gerendert). */}
      {kopf && <ErlassKopfBlock kopf={kopf} intern={internRefs} />}
      {/* LM-167 (B6/K-15, Hoch): am eingebetteten PDF fehlen «Im Gesetz suchen»,
          «§ Rechtsprechung» und «Ansicht» aus der Volltext-Werkzeugleiste ganz —
          bewusst (G2b: keine toten Steuerelemente, §13 F4, s. o.). Ohne einen Hinweis
          sah die Leiste aber schlicht vergessen aus (§8: fehlende Werkzeuge werden
          benannt, nicht kommentarlos weggelassen — Ergänzung des G2b-Entscheids,
          kein Bugfix, Dedup-Referenz FAHRPLAN-GESETZES-UX.md G2b-Ausführungsvermerk). */}
      {/* T2 (Design-Qualitäts-Pass 29.8.2026): dieser Hinweis lief auf der
          11-px-Stufe ungedeckelt über die volle Kopfbreite — gemessen @1440 auf
          `/gesetze/bund/EMRK` 829 px in EINER Zeile = 163 ch (WCAG 2.2 SC 1.4.8
          erlaubt 80). Zwei Änderungen, beide token-rein: die Feinschrift-
          Lesespalte `max-w-kleintext` (Herleitung am Token in
          `tailwind.config.js`) und eine Stufe hoch auf `text-xs` — 11 px trägt
          eine Zeile mit drei Anführungspaaren und einem Gedankenstrich nicht,
          und die xs-Stufe bringt zugleich die Zeilenhöhe von 1.2 auf 1.4. */}
      <p className="max-w-kleintext text-xs text-ink-500">
        «Im Gesetz suchen», «§ Rechtsprechung» und «Ansicht» stehen hier nicht zur Verfügung — der Text liegt nur als amtliches PDF vor, nicht als durchsuchbarer Volltext.
      </p>
      {/* Eingebettetes amtliches PDF (same-origin → Browser-Viewer mit nativer
          Suche/Zoom/Druck). iframe ist für Inline-PDF am zuverlässigsten; darunter
          ein sichtbarer Fallback-Link für Browser ohne PDF-Viewer. */}
      <div className="space-y-1.5">
        {/* Sichtbare Rahmenbeschriftung (LM-159): das `title`-Attribut am iframe
            bleibt für Screenreader, ist aber visuell unsichtbar — dieselbe Auskunft
            steht hier zusätzlich als Text, dauerhaft, nicht nur während des Ladens. */}
        <p className="lc-overline">Amtliches PDF — {erlass.kuerzel}</p>
        {/* ⑦ PDF-Rahmen (W2·5d G3a): der iframe-Rahmen nutzt die benannte Struktur-
            Linie (border-rule-struktur) statt der Ad-hoc border-line — konsistent mit
            dem Linien-Kanon (§2.2⑦). Das PDF IST die amtliche Fassung (§7/§8). */}
        <div className="relative">
          {!pdfBereit && (
            <div aria-hidden className="absolute inset-0 z-sticky flex flex-col items-center justify-center gap-3 rounded-lg border border-rule-struktur bg-paper-sunken py-12 text-center">
              <div className="scale-rule max-w-[200px]" />
              <p className="text-body-s text-ink-500">Amtliches PDF wird geladen …</p>
            </div>
          )}
          <iframe src={`/normtext/${erlass.pdfPfad}#view=FitH`} title={`${erlass.kuerzel} — amtliches PDF`}
            onLoad={() => setPdfBereit(true)}
            className="w-full rounded-lg border border-rule-struktur bg-paper-sunken"
            style={{ height: 'min(82vh, 1100px)' }} />
        </div>
      </div>
      {/* W2·19-GLIEDERUNG/S9 (Bau-Spec §8 T11 «EINE Fläche: Erlass-Übersicht +
          amtlicher Link/PDF-Viewer; keine leeren Gerüste»): dieselbe Übersicht
          wie im Volltext-Reader (S6), OBERHALB des Panels (§5-Reihenfolge).
          `artikelAnzahl={null}` — pdf-embed hat keinen Snapshot, «Umfang»
          entfällt ehrlich statt eine erfundene Zahl zu zeigen. */}
      <ErlassUebersicht erlass={erlass} kopf={kopf} currency={currency?.[erlass.key]} artikelAnzahl={null} />
      {/* Einheitliches Kontext-Panel (B3): Entscheide/Materialien/Werkzeuge zu
          diesem Erlass am Leseende (Single Source mit dem Volltext-Reader). */}
      <KontextPanel typ="norm" normKeys={[erlass.key]} />
      <nav className="mt-4 border-t border-line pt-5 flex flex-wrap justify-between gap-3 text-body-s" aria-label="Weitere Erlasse">
        <Link to="/gesetze" className="text-ink-500 hover:text-brass-700">← Übersicht</Link>
        <a href={`/normtext/${erlass.pdfPfad}`} target="_blank" rel="noopener noreferrer" className="text-brass-700 hover:underline">Amtliches PDF in neuem Tab öffnen ↗</a>
      </nav>
    </div>
  );
}

// ── ⑧ LIVE_VERWEIS: kein In-App-Volltext — ehrliche Verweiskarte (§8) ────────
// Statt der «nicht verfügbar»-Fehlerseite: prominenter amtlicher Live-Link +
// Stand + ehrlicher Hinweis «nicht als In-App-Volltext gehostet» (FAHRPLAN
// §2.2⑧, Referenz DSGVO). Massgeblich bleibt die amtliche Fassung (§7/§8,
// B-6-Nachzug R2-A). Reine
// Darstellung; eintraege bleibt null (darum VOR dem Lade-Guard unten).
function LiveVerweisAnsicht({ erlass, currency }: {
  erlass: BrowseErlass;
  currency: CurrencyMap | null;
}) {
  // Dieselbe Ebene-Beschriftung wie Brotkrume und Reiter-Herkunft — bis Befund
  // 45 stand hier eine dritte Kopie der Vorrang-Regel (§5).
  const verweisOverline = `${ebeneAngabe(erlass).label} · amtlicher Verweis`;
  return (
    <div className="space-y-5">
      <ErlassLeserKopf erlass={erlass} artikelAnzahl={null} currency={currency?.[erlass.key]}
        overline={verweisOverline}
        hinweis="Verweis — massgeblich ist die amtliche Fassung" />
      <section data-verweiskarte className="max-w-reading space-y-4 rounded-lg border border-rule-struktur bg-paper-sunken/20 p-5">
        <p className="font-serif text-body-l leading-[1.65] text-ink-700">
          Dieser Erlass wird in LexMetrik <strong className="font-semibold">nicht als In-App-Volltext gehostet</strong>.
          Massgeblich und vollständig ist die amtliche Fassung bei der Quelle.
        </p>
        {/* B-1-NACHZUG (R2-A, 31.8.2026): hier stand «↗ Amtliche Fassung
            öffnen» mit dem Pfeil VORNE — die fünfte Handform des einen Links.
            Wortlaut und Pfeilstellung kommen jetzt aus `ui/QuellLink` (Ä110);
            die Container-Grammatik (Umriss-Knopf) bleibt der Fläche, weil sie
            hier den prominenten Weiterweg der Verweiskarte trägt. */}
        {erlass.quelleUrl && (
          <QuellLink href={erlass.quelleUrl}
            className="inline-flex items-center gap-1.5 rounded-md border border-brass-400 px-3 py-2 text-body-s font-medium text-brass-700 no-underline hover:border-brass-500 hover:bg-brass-100/40 transition-colors" />
        )}
        {erlass.stand && (
          <p className="text-micro text-ink-500">Stand der zuletzt erfassten Referenz: <Datum iso={erlass.stand} /></p>
        )}
      </section>
      {/* W2·19-GLIEDERUNG/S9: dieselbe Übersicht wie im pdf-embed-Pfad (s. o.),
          OBERHALB des Panels — kein Kopf-Sidecar in diesem Pfad, `kopf={null}`
          ist der ehrliche, bereits vom Typ getragene Fall. */}
      <ErlassUebersicht erlass={erlass} kopf={null} currency={currency?.[erlass.key]} artikelAnzahl={null} />
      {/* Einheitliches Kontext-Panel (B3) auch hier: Entscheide/Materialien/
          Werkzeuge zu diesem Erlass (Single Source, §5). */}
      <KontextPanel typ="norm" normKeys={[erlass.key]} />
      <nav className="mt-4 border-t border-line pt-5 flex flex-wrap justify-between gap-3 text-body-s" aria-label="Weitere Erlasse">
        <Link to="/gesetze" className="text-ink-500 hover:text-brass-700">← Übersicht</Link>
        {erlass.quelleUrl && <QuellLink href={erlass.quelleUrl} className="text-brass-700 hover:underline" />}
      </nav>
    </div>
  );
}

// ── Ansichts-Weiche VOR dem Volltext-Zweig (§6.6-Split, QS-TOK/T14) ──────────
// Die vier frühen Rückgaben aus GesetzLeserInhalt in DERSELBEN Reihenfolge und
// mit denselben Bedingungen; `null` heisst «keine Weiche greift, weiter zum
// Volltext». Kein Hook, keine Rechtsregel — reine Präsentationswahl (§3).
// Der Lade-Guard `!erlass || !eintraege` bleibt bewusst im Aufrufer: er ist dort
// zugleich die TypeScript-Verengung, von der der ganze Volltext-Zweig lebt.
export function FruehAnsicht({ fehler, schluessel, manifest, erlass, currency, kopf, internRefs }: {
  fehler: boolean;
  schluessel: string;
  manifest: BrowseManifest | null;
  erlass: BrowseErlass | null;
  currency: CurrencyMap | null;
  kopf: ErlassKopf | null;
  internRefs: InternRefs | undefined;
}): ReactNode | null {
  if (fehler) {
    // W2·10-UI-NAV/N0b: hilfreiche Fehlseite (angefragter Key + Fuzzy-Vorschläge +
    // eingebettetes Erlass-Suchfeld) statt der nackten «nicht verfügbar»-Notiz.
    return <GesetzFehlSeite schluessel={schluessel} manifest={manifest} />;
  }
  // ── A9 §15.2-Pin: Currency-Chips NICHT nachträglich einwachsen lassen ────────
  // Die Kopf-Chips «geltend geprüft am … / nächste Fassung ab …» (ErlassLeserKopf)
  // stehen im Prerender (erlassVolltextHtml projiziert currency.json build-time).
  // Der Client lädt currency aber async (ladeCurrency, eigener Fetch). Rendert ein
  // Kopf-Pfad die Kopfzeile schon VOR dem Currency-Fetch, wachsen die zwei
  // whitespace-nowrap-Chips nachträglich in die flex-wrap-Meta-Zeile ein und
  // schieben Ingress + 2-Spalten-Grid ~30 px nach unten (Lade-Shift, auf dem
  // 2-vCPU-Runner voll gezählt: CLS ~0.10, lokal repro unter 6× Drossel + langsamem
  // Netz = 0.086). Darum ALLE Kopf-tragenden Render-Pfade (pdf-embed / nur-live-link
  // / Volltext) auf den AUFGELÖSTEN Currency-Stand pinnen (§15.2 «Client-Initialstate
  // auf den Server-Zustand pinnen»): solange `currency === null`, bleibt der
  // reservierte Lade-Platzhalter stehen — kein Inhalt versteckt (§15/2). `ladeCurrency`
  // löst IMMER auf (Fetch-Fehler ⇒ {}), i. d. R. lange vor dem grossen eintraege-Fetch
  // ⇒ kein LCP-Verlust, und die Kopfzeile kann den Reader nicht aufhängen.
  if (erlass && currency === null) {
    return <LadeAnzeige />;
  }
  // ── pdf-embed: amtliches PDF in-app (kein extrahierbarer Volltext-HTML) ──────
  if (erlass && erlass.status === 'pdf-embed' && erlass.pdfPfad) {
    return <PdfEmbedAnsicht erlass={erlass} currency={currency} kopf={kopf} internRefs={internRefs} />;
  }
  // ── ⑧ LIVE_VERWEIS: kein In-App-Volltext — ehrliche Verweiskarte (§8) ────────
  if (erlass && erlass.status === 'nur-live-link') {
    return <LiveVerweisAnsicht erlass={erlass} currency={currency} />;
  }
  return null;
}
