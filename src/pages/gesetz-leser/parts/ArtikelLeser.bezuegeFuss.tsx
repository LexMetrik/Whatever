import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { NormChip } from '../../../components/vorlagen/NormChip';
import { SUCH_META } from '../suchHighlight';
import { Funktionszeile, type BezugsMarke } from './Funktionszeile';
import { ArtikelDossier } from './ArtikelDossier';
import { fassungsMarkeEtikett } from '../fassungsEtikett';
import { entscheidZahl } from '../entscheidZahl';
import { BezuegeZeile } from './BezuegeZeile';
import { LeitfallZeile } from './ArtikelLeser.leitfaelle';
import { EntstehungsBlock } from '../../../components/entstehung/EntstehungsBlock';
import type { ArtikelBezuege } from '../bezuegeLaden';
import type { LeitfallRef } from '../../../lib/rechtsprechung/norm-index';
import type { MaterialBezug, Werkzeug } from '../../../lib/normtext/werkzeuge';
import type { ArtikelRevision } from '../../../lib/verzahnung/artikel-revisionen';
import type { ArtikelHistorie } from '../../../lib/normtext/historie-laden';
import type { NormSnapshot } from '../../../lib/normtext/typen';

// ═══ Der BEZÜGE-FUSS des Artikels — EIN Baustein für BEIDE Formen ═══════════
//
// Diese Datei RECHNET die Rubriken (Fassung · Entscheide · Materialien ·
// Verweise · Rechnen) und liefert je Rubrik den Inhalt, den ihr Griff
// aufklappt; die Zeile selbst (Griffe, Zustand, Aktions-Slot) steht in
// `./Funktionszeile.tsx`, im Einzelmodus das Dossier (`./ArtikelDossier.tsx`).
// Entscheide dazu (Wortlaut und Herleitung in der Versionsgeschichte der
// Datei): D34 (David 7.9.2026) — die Zeile steht am ARTIKELENDE, nicht unter
// der Artikelnummer, und ist in beiden Satzspiegel-Formen DIESER eine Baustein
// (§5); D35-F1 — jede Rubrik klappt einzeln und nur auf Klick auf, eine
// zugeklappte Rubrik rendert ihren Inhalt gar nicht; D40 — die Fassung ist die
// erste Rubrik (`historie`, Buchstabe `f`).
//
// W2·29-WERKBANK-LESER S1 (23.9.2026): die Listenform der Rubriken
// «Materialien» und «Rechnen» steht als Token-Utility hier (`LISTE`, `ART`),
// nicht mehr als `.lr6-notiz-*` in `src/index.css`.
//
// S6 (Entscheid David 23.9.2026, AN-10/AN-11): die Rubriken heissen wie die
// Reiter des Erlass-Blatts, in die ihr «im Erlass-Blatt öffnen ›» führt. «Materialien»
// zeigte hier Kreisschreiben und Wegleitungen, im Blatt hiess derselbe Bestand
// «Anwendung → Behörden-Praxis» und der Blatt-Reiter «Materialien» hielt die
// Botschaften — drei Namen für eine Sache, ein Name für zwei. Seither:
// «Erläuterungen» (Behördenpublikationen, Register `m`) und «Werkzeuge»
// (Rechner/Vorlagen, Register `w`), je mit dem Griff in ihren Reiter.

/** Reiter des Erlass-Blatts, in die eine Rubrik «im Erlass-Blatt öffnen ›» führt —
 *  eine Teilmenge von `../v3/panelModell.PanelReiter` (hier als Literal, weil
 *  `parts/` nicht in `v3/` hinaufimportiert). */
export type ImBlattReiter = 'entscheide' | 'erlaeuterungen' | 'werkzeuge';

/** «im Erlass-Blatt öffnen ›» — EIN Griff für alle Rubriken, die einen Reiter haben. */
function ImBlattGriff({ reiter, name, onImBlatt }: {
  reiter: ImBlattReiter; name: string; onImBlatt: (r: ImBlattReiter) => void;
}) {
  return (
    <button type="button" onClick={() => onImBlatt(reiter)}
      className="lc-btn-mini mt-2 text-micro text-ink-500 hover:text-ink-900"
      /* WCAG 4.1.2 · derselbe Massstab wie an den Rubrik-Griffen: auf
         einer Seite mit 1686 Artikeln ist «im Blatt öffnen» allein in der
         Knopfliste eines Screenreaders nicht auffindbar. */
      aria-label={name}
      data-v3-bez-imblatt={reiter === 'entscheide' ? '' : reiter}>
      {/* D-5 (S6-W1a): EIN Name der Fläche — bis 23.9.2026 «im Blatt öffnen». */}
      im Erlass-Blatt öffnen<span aria-hidden className="lr7-bez-pfeil">&nbsp;›</span></button>
  );
}

/** Eine Rubrik-Liste: ein Titel je Zeile, darunter leise seine Art (D30 —
 *  «Erläuterungen» und «Werkzeuge», bis S6 «Materialien» und «Rechnen», sind
 *  EINE Anatomie, §5). */
const LISTE = 'm-0 grid list-none gap-1 pl-2.5 font-sans text-leser-rand [&>li]:grid';
const ART = 'text-micro text-ink-500';

export function ArtikelBezuegeFuss({
  bezuege, bezuegeImFuss, historie, leitfaelle, materialien, verweise, werkzeuge, zaehler,
  zitat, revision, onOeffnen, laedt, aktionen, onImBlatt, erlassKey, artikel, snapshot,
  form = 'zeile',
}: {
  bezuege?: ArtikelBezuege;
  bezuegeImFuss?: ArtikelBezuege;
  /**
   * D40 · die Fassungshistorie dieses Artikels aus dem erlass-lokalen
   * Historie-Shard (`lib/normtext/historie-laden`, idle geladen). `undefined` =
   * kein Eintrag ⇒ die Rubrik «Fassung» steht gar nicht (§8, wie jede andere
   * Rubrik ohne echte Zahl).
   */
  historie?: ArtikelHistorie;
  leitfaelle?: LeitfallRef[];
  materialien?: MaterialBezug[];
  /** Die im Artikel genannten, auflösbaren Normverweise (`sammleVerweise`). */
  verweise: string[];
  /** Rechner/Vorlagen an genau diesem Artikel (`randNotizWerkzeuge`). */
  werkzeuge: readonly Werkzeug[];
  zaehler?: { entscheide: number; materialien: number };
  /** KURZ-Zitat («Art. 957 OR») — Fundstellen-Signal für den Entscheid-Sprung. */
  zitat: string;
  revision?: ArtikelRevision | null;
  onOeffnen?: () => void;
  laedt?: boolean;
  /** D35-F1 · die Artikel-Aktionen rechts in derselben Zeile. */
  aktionen?: ReactNode;
  /**
   * D35-F2 · «im Blatt öffnen ›» am Fuss der aufgeklappten Rubrik «Entscheide».
   *
   * Der Entscheid war «beides»: die Rubrik klappt auf UND armiert wie bisher
   * (`onOeffnen`), und dieser Griff öffnet dieselbe Liste zusätzlich im
   * Erlass-Blatt auf dem Reiter «Entscheide» (`../v3/panelModell`,
   * `oeffneEntscheide`). KEIN zweiter Ladepfad und keine zweite Auswahl: das
   * Blatt liest dieselbe Hook-Instanz, die das Aufklappen schon geweckt hat
   * (§5, D30).
   *
   * NUR AN DER RUBRIK «ENTSCHEIDE»: sie ist die einzige, die im Blatt eine
   * eigene, artikelscharfe Fläche hat. «Materialien», «Verweise» und «Rechnen»
   * hätten dort nur ihre ERLASS-weiten Nachbarn — ein Griff, der woandershin
   * führt als er verspricht, wäre die Scope-Verwechslung D-3/D-4, die dieser
   * Schritt gerade abräumt (§8).
   *
   * ERGÄNZT S6 (23.9.2026, AN-10): «Erläuterungen» und «Werkzeuge» tragen den
   * Griff seither ebenfalls — Auftrag «im Blatt öffnen öffnet den passenden
   * Reiter». Die Scope-Sorge oben bleibt richtig und wird im NAMEN eingelöst,
   * nicht verschwiegen: der Accessible-Name sagt «… zum Erlass», der Reiter-Kopf
   * zeigt das Erlass-Kürzel (Befund 34). Wer den Griff nimmt, erfährt also,
   * dass er vom Artikel zum ganzen Erlass wechselt.
   */
  onImBlatt?: (reiter: ImBlattReiter) => void;
  /**
   * W2·6c-E3 · Kanonischer Erlass-Key — die Adresse der Entstehungs-Projektion
   * (`/materialien/entstehung/<KEY>.json`). Fehlt er, zeigt die Rubrik «Fassung»
   * die Zeitleiste wie bisher und die Karte sagt «keine Entstehung erfasst» (§8).
   */
  erlassKey?: string;
  /** W2·6c-E3 · Roher Artikel-Token («16_c») für den Anker-Sprung in die Botschaft. */
  artikel: string;
  /**
   * W2·6c-SYNOPSE-LESER · der Artikel selbst — die RECHTE Spalte des
   * Fassungsvergleichs («was gilt heute?») samt ihrem Zitat-Nachweis (§7:
   * Stand, Live-Link, Abrufdatum). Er wird DURCHGEREICHT, nicht neu geladen:
   * der Leser hält den Eintrag ohnehin, und eine zweite Quelle für denselben
   * Wortlaut wäre die zweite Wahrheit, die §5 verbietet.
   */
  snapshot?: NormSnapshot;
  /**
   * W2·5m (Kap. 15.5) · die GESTALT der Rubriken — `'zeile'` ist die
   * Funktionszeile am Artikelende (Gesamtansicht, unverändert), `'dossier'` die
   * gestapelten Blöcke unter dem Einzelartikel.
   *
   * EINE Prop und kein zweites Modul: die Marken darüber werden in beiden
   * Fällen aus derselben Rechnung gebaut (§5). Wer hier eine zweite
   * Marken-Liste anlegt, hat den Schritt verfehlt — Wächter
   * `src/tests/leser-einzel-dossier-quelle.test.ts`.
   */
  form?: 'zeile' | 'dossier';
}) {
  /** Die Zahlen der Funktionszeile — ausschliesslich aus Daten, die der Artikel
   *  ohnehin führt (§8: keine Rubrik ohne echte Zahl, keine neue Ladelogik). */
  // W2·24-R6c: die Zähl-Datei schlägt beide bisherigen Quellen — sie ist
  // GEZÄHLT, nicht gefiltert, und deshalb dieselbe Zahl vor und nach dem Laden
  // des Shards (die Zeile springt nicht mehr um, sobald der Apparat eintrifft).
  // Ohne Datei bleibt die frühere Reihenfolge unverändert bestehen: gefilterte
  // Kanten, sonst Leitfälle.
  // ── D30 (David 6.9.2026) · «ZÄHLER = LISTENLÄNGE NACH DEM LADEN» ──────────
  // Die Reihenfolge unten bleibt die von R6c (Zähl-Datei zuerst) — sie ist der
  // Grund, aus dem die Zahl beim Eintreffen des Shards nicht umspringt.
  //
  // DAVIDS REGEL IST DAMIT NICHT UMGANGEN, SONDERN AN DER WURZEL ERFÜLLT: die
  // Zähl-Datei zählt `gesamtProArtikel` des Shards, also OHNE UI-Filter
  // (`scripts/gen-bezuege-zaehler.ts`), und die Liste bezieht ihre Kanten seit
  // D30 aus `alleFuer` — ebenfalls ohne UI-Filter. Beide Wege zählen dasselbe;
  // die Zahl kann also gar nicht mehr springen, egal welcher zuerst da ist.
  // (Bis D30 tat sie es: gemessen OR 336c «11 Entscheide» im Kopf gegen 3
  // gezeigte, weil `bezuegeFuer` die Panel-Facetten anwandte — Herleitung in
  // `../bezuegeLaden`.) Dass die beiden Wege übereinstimmen, ist eine ZUSAGE
  // und keine Hoffnung: `e2e/leser-bezuege-inhalt-d30.e2e.ts` (b) misst
  // Zeilenzahl gegen die Zahl der gerenderten Zeilen.
  //
  // Der Fallback nimmt `bezuegeImFuss` VOR `bezuege`: das ist die Quelle, die
  // auch die Liste darunter zeigt — die Zahl beschriebe sonst eine andere
  // Menge als das, was daneben steht. (Bis D34 hiess die Prop
  // `bezuegeImKopf`; der Ort hat gewechselt, die Rangfolge nicht.)
  const b = bezuegeImFuss ?? bezuege;
  // ── W2·26/Z3 · EINE ZAHL, NICHT ZWEI (Mandat David 11.9.2026) ────────────
  // Die Regel steht als reine Funktion in `../entscheidZahl` — dort auch der
  // Befund, der sie ausgelöst hat, und die Herleitung der Rangfolge. Hier wird
  // sie nur gerufen (§3: diese Datei rechnet die Marken, sie formuliert keine
  // Regel zweimal), und genau darum ist sie direkt prüfbar
  // (`src/tests/entscheid-zahl.test.ts`, Zweitblick-Auflage zu PR #788).
  const entscheide = entscheidZahl(
    b ? { kanten: b.kanten.length, zeitAktiv: b.zeitAktiv, kantonAktiv: b.kantonAktiv } : null,
    zaehler ? zaehler.entscheide : null,
    leitfaelle?.length ?? 0,
    zitat,
  );
  const bezugsMarken: BezugsMarke[] = [
    // ── D40 (David 7.9.2026) · «wieso ist fassung nicht auch unten am artikel?»
    {
      reg: 'f',
      /* DIE ZAHL IST GEZÄHLT, NICHT GESCHÄTZT (§8/§2): sie ist die Länge der
         Ereignis-Liste, die der Generator aus den amtlichen Änderungs-Fussnoten
         dieses Artikels gebaut hat (`scripts/normtext/historie-generieren.ts`
         → `baueArtikelHistorie`) — also genau die Zahl der Änderungsstände, die
         die Zeitleiste darunter auch auflistet. Zähler und Liste können darum
         nicht auseinanderlaufen; es ist dieselbe Länge, einmal gezählt und
         einmal gerendert.

         0 ⇒ KEINE RUBRIK. `Funktionszeile` filtert `anzahl > 0` heraus, und das
         ist hier keine Notlösung, sondern deckungsgleich mit dem Datenmodell:
         korpusweit gemessen (7.9.2026, alle 209 Shards, 13 093 Artikel mit
         Eintrag) trägt JEDER Eintrag mindestens ein Ereignis — 0 heisst also
         «dieser Artikel hat keinen Historie-Eintrag», nie «Eintrag ohne
         Ereignis». Die Verteilung: 7532 Artikel mit 1, 2786 mit 2, 1115 mit 3,
         der Rest darüber.

         DIE RUBRIK ERSCHEINT ERST MIT DEM SHARD, wie «Entscheide» und
         «Materialien» erst mit der Zähl-Datei erscheinen — beide treffen in
         derselben Leerlauf-Runde ein (`../inhalt-zustand.tsx`,
         `../bezuegeZaehler.ts`). Ein reservierter Platz dafür wäre eine
         Phantom-Lücke an jedem der 11 418 Artikel OHNE Eintrag (§15.2/Ä26,
         Herleitung am gefallenen Kopf-Slot in `./ArtikelLeser.tsx`). */
      anzahl: historie?.ereignisse?.length ?? 0,
      wort: ['Fassung', 'Fassungen'],
      /* W2·26/Z2 (David 11.9.2026): «Fassung soll nur ‹gilt seit XXX› zeigen,
         erst beim Aufklappen erscheinen die Angaben». ZUGEKLAPPT liest die
         Marke darum den STAND dieses Artikels, nicht die Zahl seiner
         Änderungsstände — das ist die Auskunft, die man am Artikel sucht.
         Aufgeklappt steht die Zahl wieder da (`parts/Funktionszeile.tsx`), denn
         dann ist die Zeitleiste der Gegenstand. Die Zeichenkette kommt aus
         `../fassungsEtikett` — DIESELBE, die das Schild im Block darunter
         trägt (§5), und ohne datierten Stand schlicht «Fassung» (§8: nie ein
         Datum erfinden). */
      etikett: fassungsMarkeEtikett(historie),
      /* GLEICHE KOMPONENTE, KEIN DUPLIKAT (§5): das ist dieselbe
         `ArtikelHistorieZeile`, die bis D40 im Kopf-Slot stand — «Fassung ·
         Gilt seit …» und darunter die Zeitleiste. Neu ist nur, dass sie ihre
         Leiste OFFEN zeigt: der Rubrik-Griff hat sie gerade aufgeklappt, ein
         zweiter Knopf darin täte dasselbe noch einmal (Herleitung an der Prop
         `zeitleiste`).

         W2·6c-E3 (11.9.2026): dieselbe Zeile steht jetzt IM `EntstehungsBlock` —
         er rendert sie unverändert und hängt die Entstehungs-Auskunft in ihre
         Punkte (Herleitung dort im Kopf). Kein zweiter Slot in der Textspalte
         und kein zweiter Griff: der Rubrik-Griff, der diesen Block aufklappt,
         ist zugleich der Auslöser des EINEN Abrufs (Auflage David 6.9.2026,
         «nur auf Wunsch sichtbar»). */
      inhalt: <EntstehungsBlock historie={historie} erlassKey={erlassKey} artikel={artikel} snapshot={snapshot} />,
    },
    {
      reg: 'r',
      anzahl: entscheide.anzahl,
      wort: ['Entscheid', 'Entscheide'],
      /* Z3 · die Grundgesamtheit, wenn die sichtbare Zahl gefiltert ist —
         nie verschwiegen, nur nicht in der Zeile (`../entscheidZahl`). */
      titel: entscheide.titel,
      brauchtDaten: true,
      /* ── D30 · DIE ENTSCHEIDE, DIE DER ZÄHLER VERSPRICHT ─────────
         `form="rand"`: senkrecht gestapelte Zeilen mit Zitierung und
         Regeste, Leitentscheide zuerst (die Gruppen laufen nach
         `STATUS_RANG`, BGE vor allem anderen). Das ist DIESELBE
         Komponente und dieselbe Portionierung wie überall sonst — nur
         die Gestalt, die R4 für die schmale Randspalte gebaut hat und
         die hier aus demselben Grund richtig ist: in einer aufgeklappten
         Liste unter dem Artikel sucht niemand eine waagrechte
         Scrollachse. Der Klick öffnet daneben (Split-Regel M3) — das
         bringt `KanteMitVorschau` mit, nicht diese Stelle. */
      inhalt: b
        ? <BezuegeZeile kanten={b.kanten} gesamt={b.gesamt}
            zeitAktiv={b.zeitAktiv} kantonAktiv={b.kantonAktiv}
            normZitat={zitat} revision={revision} form="rand" />
        : (leitfaelle && leitfaelle.length > 0
            ? <LeitfallZeile refs={leitfaelle} normZitat={zitat} revision={revision} />
            : null),
      nebenGriff: onImBlatt
        ? <ImBlattGriff reiter="entscheide" name={`Entscheide zu ${zitat} im Erlass-Blatt öffnen`} onImBlatt={onImBlatt} />
        : undefined,
    },
    // Die Rubrik erscheint NUR mit echter Zahl (`anzahl > 0` filtert sie sonst
    // in `Funktionszeile` heraus) — ohne Zähl-Datei steht sie also gar nicht da,
    // statt eine Null zu behaupten (§8). Dieselbe Deckungsgleichheit wie oben:
    // die Zähl-Datei entdoppelt die Material-Kanten nach Dokument, und genau so
    // baut `projiziereMaterialien` die Liste (ein Eintrag je Dokument).
    // ── D30 · MATERIALIEN, dieselbe Anatomie wie «Rechnen» ───────
    // Ein Titel je Dokument, daneben die Art (Behörde + Doktyp) —
    // dieselbe Zeilenform wie der Rechnen-Block (§5), damit die Rubriken
    // EINE Liste sind und nicht drei Gestalten. `sublabel` ist die
    // amtliche Fundstelle-Ziffer im Dokument; sie steht nur, wenn der
    // Kanten-Shard sie führt.
    // S6: seit dem Entscheid 23.9.2026 «Erläuterungen» (Herleitung im Kopf).
    // Die Zahl und die Liste sind unverändert dieselben Kreisschreiben,
    // Wegleitungen und Leitfäden — nur der Name folgt dem Reiter.
    {
      reg: 'm',
      anzahl: zaehler?.materialien ?? (materialien?.length ?? 0),
      wort: ['Erläuterung', 'Erläuterungen'],
      brauchtDaten: true,
      nebenGriff: onImBlatt
        ? <ImBlattGriff reiter="erlaeuterungen" name={`Behördliche Erläuterungen zum Erlass im Erlass-Blatt öffnen`} onImBlatt={onImBlatt} />
        : undefined,
      inhalt: materialien && materialien.length > 0
        ? (
          <>
            <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />Erläuterungen</span>
            <ul className={LISTE}>
              {materialien.map((mat) => (
                <li key={mat.key} data-bez-material>
                  <Link to={mat.pfad}>{mat.titel}</Link>
                  <span className={ART}>
                    {mat.behoerdeKuerzel} {mat.doktypLabel}{mat.sublabel ? ` · ${mat.sublabel}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )
        : null,
    },
    {
      reg: 'g',
      anzahl: verweise.length,
      wort: ['Verweis', 'Verweise'],
      /* W2·5m · Die Null ist hier GESICHERT: die Verweise stehen aus dem
         Artikel selbst (`sammleVerweise`), es wartet kein Shard. Der Satz sagt
         darum, was gilt — und er sagt «verweist auf», nicht «hat keine
         Verweise»: die Rückrichtung «zitiert von» gibt es im Korpus noch nicht
         (W2·22-VERWEIS-FEDLEX Z4), und ein Leser soll sie nicht für leer
         halten statt für fehlend (§8, Kap. 15.5). */
      leer: 'Dieser Artikel verweist auf keine andere Bestimmung. Wer auf ihn verweist, führen wir noch nicht.',
      inhalt: (
        <>
          <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />Verweise</span>
          <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
            {verweise.map((v) => <NormChip key={v} artikel={v} />)}
          </span>
        </>
      ),
    },
    // S6: «Werkzeuge» wie der Reiter (bis hierher «Rechner» am Griff und
    // «Rechnen» über der Liste — zwei Namen in einer Rubrik).
    {
      reg: 'w',
      anzahl: werkzeuge.length,
      wort: ['Werkzeug', 'Werkzeuge'],
      nebenGriff: onImBlatt
        ? <ImBlattGriff reiter="werkzeuge" name={`Werkzeuge zum Erlass im Erlass-Blatt öffnen`} onImBlatt={onImBlatt} />
        : undefined,
      /* W2·5m · Ebenfalls gesichert: die Norm-Werkzeug-Kanten stehen fest im
         Code (`lib/normtext/werkzeuge.ts`), jede mit fachlichem Beleg (§7),
         Zweifelsfälle bewusst ausgelassen (§8). «Bisher» ist kein Füllwort: es
         sagt, dass die Liste wächst, statt den Eindruck zu erwecken, hier sei
         nichts zu rechnen. */
      leer: 'Zu dieser Bestimmung führen wir bisher keinen Rechner und keine Vorlage.',
      inhalt: (
        <>
          <span className="lc-overline mr-1"><span className="lc-punkt" aria-hidden />Werkzeuge</span>
          <ul className={LISTE}>
            {werkzeuge.map((w) => (
              <li key={w.id}>
                <Link to={w.href}>{w.titel}</Link>
                {/* Art des Werkzeugs: ein Rechner rechnet, eine Vorlage
                    füllt ein Dokument — für die Auswahl der Unterschied. */}
                <span className={ART}>{w.modus === 'vorlage' ? 'Vorlage' : 'Rechner'}</span>
              </li>
            ))}
          </ul>
        </>
      ),
    },
  ];
  // W2·5m · ZWEI GESTALTEN, EINE RECHNUNG (§5). Oberhalb dieser Zeile steht
  // kein einziges `if (form …)`: die Marken sind in beiden Fällen dieselben,
  // nur ihr Bild ist ein anderes.
  if (form === 'dossier') {
    return (
      <div {...{ [SUCH_META]: '' }}>
        {/* Die Fusszeile der Artikel-Karte (Kap. 15.3): die Aktionen stehen im
            Einzelmodus DAUERHAFT, nicht erst bei Hover — der Artikel ist hier
            der Gegenstand der Seite, nicht einer von 1686 (Z6 gilt für die
            Zeile, wo 1686 × 3 Knöpfe im DOM stünden; hier sind es drei). */}
        <div className="mt-3 flex flex-wrap justify-end gap-3">{aktionen}</div>
        <ArtikelDossier marken={bezugsMarken} zitat={zitat}
          onOeffnen={onOeffnen} laedt={laedt} />
      </div>
    );
  }
  return (
    <div {...{ [SUCH_META]: '' }}>
      <Funktionszeile marken={bezugsMarken} zitat={zitat} aktionen={aktionen}
        onOeffnen={onOeffnen} laedt={laedt} />
    </div>
  );
}
