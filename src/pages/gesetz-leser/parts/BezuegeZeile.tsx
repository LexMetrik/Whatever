// ─── B4/B7: «Bezüge» am Artikel — je Instanz EINE scrollbare Linie ───────────
//
// W2·7-BEZUG/B4 (FAHRPLAN-VERZAHNUNG-UI §9), B7 (David-Auftrag 28.7./29.7.2026). Der
// ERWEITERTE Zustand der Kanten-Zeile: sobald der Nutzer im Dropdown
// «Rechtsprechung ▾» eine Klasse zuschaltet, rendert der Artikel-Fuss diese
// Zeile statt der bestehenden `LeitfallZeile` — aus dem Bezugs-Shard (Obermenge)
// statt aus dem schlanken Leitfall-Shard.
//
// ── WAS B7 GEÄNDERT HAT (David-Wortlaut) ───────────────────────────────────
// «or 41 dort sind nur ein teil der entscheide verlinkt … mach es so dass man
// durchscrollen kann und dann je eine linie für jede instanz und alle sichtbar.
// chronologisch vom neusten zum ältesten»
// Bis B6 zeigte jede Gruppe sechs Chips und dahinter «+n weitere»; die
// Datenschicht lieferte ohnehin nur acht je Klasse, der Rest war unerreichbar.
// Beides ist weg: der Shard liefert ALLE Kanten (facetten.ts), und jede Gruppe
// ist eine waagrecht scrollbare Linie über die volle Menge, chronologisch
// neu → alt.
//
// PRÄZISIERUNG DAVID 29.7.2026: «es soll einfach 5 entscheide pro linie sein und
// mit klick lädt es die nächsten 5.» Die Linie beginnt bei den fünf NEUSTEN und
// wächst nur auf Klick — Begründung und die abgelöste Scroll-Automatik bei
// `PRO_SCHRITT`.
//
// ── WARUM GRUPPIERT UND NICHT EINE REIHE (§8, der tragende Entwurf) ─────────
// `facetten.ts` hält fest: «Wer die drei in EINE Liste kippt und nur nach Datum
// sortiert, behauptet stillschweigend Gleichrang.» Genau das würde eine flache
// Chip-Reihe tun — ein BGE und ein kantonaler Entscheid sähen identisch aus,
// sobald der ★ das einzige Unterscheidungsmerkmal ist (und ein kantonaler
// Entscheid trägt keinen). Darum trägt JEDE Status-Klasse ihre eigene Linie mit
// ausgeschriebenem Label: die Rangordnung wird STRUKTURELL sichtbar und
// überlebt jede Sortierung, jedes Nachladen und jeden Filter. Dass die Ordnung
// INNERHALB der Linie chronologisch ist, widerspricht dem nicht — sie ordnet
// Gleichrangiges, nie über Klassen hinweg.
//
// ── EHRLICHE ZAHL AM GRUPPENKOPF (§8) ──────────────────────────────────────
// Der Kopf sagt jederzeit, WIE VIEL VON WIE VIEL gerade in der Linie steht:
// «5 von 4'140», nach zwei Klicks «15 von 4'140», und wenn alles geladen ist
// schlicht «4'140» (ein «4'140 von 4'140» wäre Lärm). Ein aktiver Zeitraum
// macht die Bezugsgrösse zur gefilterten Menge und sagt das dazu: «5 von 12 im
// Zeitraum». Die dritte Zahl — wie viele es OHNE Filter insgesamt gibt — steht
// im `title` des Kopfes, damit die Zeile bei zwei Zahlen bleibt und die
// Grundgesamtheit trotzdem nicht verschwiegen wird.
//
// ── `gewicht: null` WIRD NIE ZU 0 (§8) ─────────────────────────────────────
// Der Zitier-Graph erkennt nur BGE-Fundstellen und Bundesgerichts-Aktenzeichen;
// kantonale und eidgenössische Geschäftsnummern treffen keine dieser Formen
// (siehe `BezugsEintrag` in bezuege.ts). Diese Zeile rendert `gewicht` DARUM
// GAR NICHT als Zahl — weder 0 noch «–». Seit B7 nutzt sie es nicht einmal mehr
// als Reihenfolge: die Linie ist chronologisch geordnet, und das ist die
// einzige Achse, die in allen vier Klassen wirklich messbar ist.

import { memo, useRef, useState } from 'react';
import { KanteMitVorschau } from '../../../components/verzahnung/KanteMitVorschau';
import type { Bezug } from '../../../lib/rechtsprechung/bezuege';
import type { BezugStatus } from '../../../lib/verzahnung/facetten';
import { STATUS_LABEL, STATUS_RANG } from '../../../lib/verzahnung/facetten';
import { KLASSE_KURZ } from '../bezugAuswahl';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
// Die rechnende Hälfte der Linie (Portionsgrösse, Schritt, Zähler-Text) lebt in
// `bezugPortion.ts` — reine Arithmetik, dort ohne Komponente prüfbar (§3/§6;
// Begründung im Kopf jener Datei).
import {
  PRO_SCHRITT, URSACHE_LANG, istLetzterSchritt, naechsteSichtbar, verkuerzungAus, zahl, zahlText,
  type Verkuerzung,
} from '../bezugPortion';
import {
  klassifiziereFassungsBezug, entscheidDatum, type ArtikelRevision,
} from '../../../lib/verzahnung/artikel-revisionen';

/**
 * Eine Status-Gruppe: Label + ehrliche Zahl + EINE waagrecht scrollbare Linie.
 *
 * ── FESTE HÖHE = CLS 0 ─────────────────────────────────────────────────────
 * Die Linie ist `h-7` hoch, egal wie viele Chips nachgeladen werden: sie wächst
 * nach RECHTS in den Scroll-Bereich, nie nach unten. Der Artikeltext darunter
 * bewegt sich damit nie — weder beim ersten Erscheinen der Zeile noch beim
 * Nachladen. Die Chips selbst sind `min-height: 24px` (WCAG 2.5.8), die 28 px
 * der Linie tragen sie ohne Umbruch.
 *
 * ── TASTATUR (WCAG 2.1.1) ──────────────────────────────────────────────────
 * Die Linie ist selbst fokussierbar (`tabIndex={0}` + `role="group"` +
 * `aria-label`): ein scrollbarer Bereich muss ohne Maus erreichbar und mit den
 * Pfeiltasten bedienbar sein. Zusätzlich sind die Chips Links und damit
 * ohnehin in der Tab-Folge — der Browser scrollt die Linie beim Tabben mit.
 * Beides zusammen, nicht eines statt des anderen: wer nur tabbt, käme sonst nur
 * an die bereits gerenderten Chips.
 */
const StatusGruppe = memo(function StatusGruppe({ status, kanten, gesamtRoh, filter, normZitat, revision, form = 'zeile' }: {
  status: BezugStatus;
  kanten: readonly Bezug[];
  gesamtRoh: number | undefined;
  /** Welche einschränkenden Schalter sind AKTIV (nicht: haben gewirkt)? */
  filter: Verkuerzung | null;
  normZitat: string;
  revision?: ArtikelRevision | null;
  /** Gestalt der Gruppe — s. `BezuegeZeile`. */
  form?: BezuegeForm;
}) {
  const [sichtbar, setSichtbar] = useState(PRO_SCHRITT);
  const linieRef = useRef<HTMLDivElement>(null);
  const anzahl = kanten.length;

  /**
   * Ein Schritt weiter. WCAG 2.4.3 (Gegenprüfung Runde 2/J4): beim LETZTEN
   * Klick verschwindet der Knopf, und ein Fokus auf einem entfernten Element
   * fällt auf `document.body` — eine Tastatur-Bedienung müsste danach von vorn
   * durch die ganze Seite tabben. Der Fokus wandert darum VOR dem Entfernen auf
   * die Linie, die ihn ohnehin trägt (`tabIndex=0`): dort steht der Nutzer
   * genau an den Chips, die er gerade geladen hat.
   * `preventScroll`, weil der Browser sonst zur Linie springt — sie ist bereits
   * sichtbar, der Sprung wäre reine Unruhe.
   */
  function weitere(): void {
    if (istLetzterSchritt(sichtbar, anzahl)) linieRef.current?.focus({ preventScroll: true });
    setSichtbar(naechsteSichtbar(sichtbar, anzahl));
  }

  if (anzahl === 0) return null;

  const gezeigt = Math.min(sichtbar, anzahl);
  const liste = gezeigt >= anzahl ? kanten : kanten.slice(0, gezeigt);
  const rest = anzahl - gezeigt;
  // Grundgesamtheit OHNE UI-Filter — nur für den `title`, damit die sichtbare
  // Zeile bei zwei Zahlen bleibt und die dritte trotzdem nicht verschwiegen wird.
  const gesamt = Math.max(gesamtRoh ?? anzahl, anzahl);
  // ── ABWEICHUNG von der Fix-Richtung J1, deklariert (§14.7) ────────────────
  // Vorgegeben war «zahlText bekommt filterAktiv (Zeit ODER Kanton)». Wörtlich
  // umgesetzt trüge AUCH eine Gruppe den Zusatz, die der Filter gar nicht
  // angefasst hat: der Kantons-Schnitt wirkt ausschliesslich in der kantonalen
  // Klasse (`bauePraedikate` führt 'CH' im Schnitt mit), die bge-Gruppe bliebe
  // vollständig und stünde trotzdem als «5 von 16 im Kanton» da — eine zweite
  // falsche Aussage anstelle der ersten. Darum entscheidet über das OB die
  // gemessene Verkürzung dieser Gruppe (`anzahl < gesamt`), über das WARUM der
  // hereingereichte Schalterstand. Strikt stärker als die Vorgabe: jede
  // wirkliche Verkürzung wird benannt, keine erfundene.
  const verkuerzt = anzahl < gesamt ? filter : null;
  const zahlZeile = zahlText(gezeigt, anzahl, verkuerzt);
  const kopfTitel = verkuerzt
    ? `${STATUS_LABEL[status]} — ${zahl(gezeigt)} gezeigt, ${zahl(anzahl)} ${URSACHE_LANG[verkuerzt]}, `
      + `${zahl(gesamt)} insgesamt an diesem Artikel`
    : `${STATUS_LABEL[status]} — ${zahl(gezeigt)} von ${zahl(anzahl)} gezeigt`;

  return (
    <div data-bezug-gruppe={status}
      // R4-Randform: Kopf IMMER über der Liste (die 210-px-Spalte trägt kein
      // Nebeneinander) — dieselbe Anordnung, die die Zeile unter `sm` ohnehin
      // fährt; nur der `sm:`-Umbruch entfällt.
      className={form === 'rand'
        ? 'flex flex-col gap-1'
        : 'flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2'}>
      {/* Der Kopf steht FEST und scrollt nicht mit: er sagt, WAS in der Linie
          steht, und diese Auskunft darf nicht wegscrollen (§8).
          MOBIL ÜBER der Linie, ab sm daneben — gemessen 29.7.2026 bei 375 px:
          nebeneinander schnitt «KANTONAL 13» in den Scrollbereich, und der
          Zähler verschwand hinter dem ersten Chip. Ein abgeschnittener Zähler
          ist schlimmer als eine Zeile mehr Höhe.
          `min-w` statt fester Breite: die vier Labels sind verschieden lang
          («Kantonal» gegen «Bundesgericht, übrige»); eine feste Breite müsste
          sich am längsten orientieren und liesse beim kürzesten ein Loch, eine
          zu knappe schnitte wieder ab. So fluchten die kurzen und die langen
          nehmen, was sie brauchen. `whitespace-nowrap`, weil ein umbrechender
          Gruppenkopf die feste Zeilenhöhe (CLS 0) sprengte. */}
      {/* R4-B (5.9.2026): bis hierher die achte handgezeichnete Kopie des
          dichten Gruppenkopfs — Wortlaut und Utilities zeichengleich mit den
          sieben, die R3-β eingesammelt hatte; nur der App-weite Sweep fehlte,
          um sie zu sehen. Die Zeile bringt weiter ihr eigenes LAYOUT mit
          (`shrink-0`, `whitespace-nowrap`, `sm:min-w-[11rem]` — Herleitung
          oben), Typo und Zähler-Anatomie kommen jetzt aus dem Baustein.
          `als="span"`: der Kopf ist eine Zelle dieser Flex-Zeile. */}
      <GruppenKopf dicht als="span" titel={KLASSE_KURZ[status]} zahl={zahlZeile}
        title={kopfTitel}
        className={form === 'rand'
          ? 'shrink-0'
          : 'shrink-0 whitespace-nowrap sm:min-w-[11rem]'} />
      <div
        data-bezug-linie={status}
        ref={linieRef}
        // W2·24-R4 · ZWEI GESTALTEN, EINE DATENQUELLE. In der Randnotiz-Spalte
        // (210 px) kann die waagrecht scrollbare Linie nicht stehen — zwei Chips
        // passen nebeneinander, der Rest läge hinter einer Scrollachse, die in
        // einer Randspalte niemand sucht. Sie stapelt dort senkrecht. Alles
        // andere ist zeichengleich: dieselben Kanten, dieselbe Ordnung, dieselbe
        // Portionierung, derselbe Zähler (§6 (e): keine neue Logik).
        // Das `aria-label` folgt der Gestalt mit — es beschreibt die Bedienung,
        // und «waagrecht scrollbar» wäre in der Randform schlicht unwahr (§8).
        className={form === 'rand'
          ? 'lc-bezug-linie flex min-w-0 flex-1 flex-col items-start gap-1.5'
          : 'lc-bezug-linie flex h-7 min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overflow-y-hidden'}
        tabIndex={0}
        role="group"
        aria-label={`${zahlZeile} — ${STATUS_LABEL[status]}, ${
          form === 'rand' ? 'Liste' : 'waagrecht scrollbare Liste'
        }, chronologisch vom neusten zum ältesten`}
      >
        {liste.map((b) => {
          // ?norm= trägt die Fundstellen-Absicht (wie in der LeitfallZeile): das
          // Ziel springt zur ersten Erwägung, die diese Norm zitiert (§5).
          const ziel = `/rechtsprechung/${encodeURIComponent(b.key)}?norm=${encodeURIComponent(normZitat)}`;
          // §V1c: hat sich die Norm SEIT diesem Entscheid revidiert? Q1-sicher über
          // die Entscheid-Präzision (BGE-Bandjahr-Platzhalter ⇒ Jahresvergleich).
          const revidiert = klassifiziereFassungsBezug(entscheidDatum(b.datum, b.facetten.gericht), revision) === 'revidiert'
            ? (revision ?? null) : null;
          const kante = (
            <KanteMitVorschau key={b.key} ziel={ziel} zitierung={b.zitierung}
              kurztext={b.regesteKurz}
              leitentscheid={b.facetten.status === 'bge'}
              revidiert={revidiert}
              statusLabel={STATUS_LABEL[b.facetten.status]}
              titel={b.regesteKurz ?? `${b.zitierung} — ${STATUS_LABEL[b.facetten.status]}`}
              className="shrink-0" />
          );
          // ── D30 (David 6.9.2026) · «ZITIERUNG + REGESTE-ZEILE» ────────────
          // In der ZEILEN-Form bleibt es beim blossen Chip: dort stehen die
          // Kanten in einer 28 px hohen waagrechten Linie, ein zweizeiliger
          // Eintrag sprengte sie (und mit ihr die CLS-0-Zusage oben).
          // In der RAND-Form — seit R6b nur noch die aufgeklappte Bezüge-Zeile
          // am Artikelkopf — ist die Lage umgekehrt: der Leser hat sie
          // aufgeklappt, um zu ERKENNEN, welcher Entscheid welcher ist, und ein
          // Zitat allein sagt das nicht. Die Regeste stand bis hierher nur im
          // `title` und im Hover-Kasten, war also für Tastatur und Touch
          // unsichtbar. Sie ist die amtliche Kurzregeste aus dem Shard, wörtlich
          // übernommen (§7) — hier nur angezeigt, nicht gekürzt oder gebildet;
          // die optische Begrenzung auf zwei Zeilen macht `line-clamp-2`: eine
          // Liste, in der ein Eintrag acht Zeilen hoch ist, ist keine Liste
          // mehr (Kurzregesten laufen über 300 Zeichen). Das Grid mit
          // `justify-items-start` hängt die Regeste UNTER den Chip, statt dass
          // eine Flex-Zeile den Chip auf ihre Höhe zöge. `.lr7-bez-eintrag`/
          // `-regeste` sind Sonden-Anker (`leser-bezuege-inhalt-d30`).
          if (form !== 'rand') return kante;
          return (
            <span key={b.key} className="lr7-bez-eintrag grid min-w-0 justify-items-start gap-0.5">
              {kante}
              {b.regesteKurz && <span className="lr7-bez-regeste line-clamp-2 font-serif text-leser-rand leading-snug text-ink-600">{b.regesteKurz}</span>}
            </span>
          );
        })}
        {/* ── «weitere 5» — das eine Klick-Element am Linienende ──────────────
            Vorgabe David: «mit klick lädt es die nächsten 5». Es steht IN der
            Linie, am Ende der bereits geladenen Chips: dort, wo der Blick beim
            Durchscrollen ankommt, und nicht an einem Rand, den man erst suchen
            muss. Bei ≤ 5 Kanten gibt es kein Element — ein Steuerelement ohne
            Wirkung wäre Lärm (§13 F4).

            DEZENT, ein Wort und eine Zahl, kein Knopf-Rahmen: die Linie soll
            ruhig bleiben (Minimalismus-Vorgabe David 28.7.2026). Der letzte
            Schritt nennt den echten Rest («weitere 3»), nicht stur 5 — sonst
            versprächen die letzten Klicks mehr, als noch da ist (§8).

            Tastatur: ein echter `button` in der Tab-Folge; der Browser scrollt
            ihn beim Tabben in die Linie. Nach dem Klick bleibt er an derselben
            Stelle in der Reihenfolge stehen, wandert also mit dem Fokus mit. */}
        {rest > 0 && (
          <button
            type="button"
            data-bezug-weitere={status}
            onClick={weitere}
            title={`${zahl(rest)} weitere ${STATUS_LABEL[status]} laden`}
            aria-label={`${zahl(Math.min(PRO_SCHRITT, rest))} weitere laden — ${zahlZeile} gezeigt, ${STATUS_LABEL[status]}`}
            className="lc-overline shrink-0 whitespace-nowrap rounded px-1.5 py-0.5 transition-colors hover:bg-brass-100/40 hover:text-ink-900"
          >
            weitere <span className="num">{Math.min(PRO_SCHRITT, rest)}</span>
          </button>
        )}
      </div>
    </div>
  );
});

/**
 * Die «Bezüge»-Zeile: alle gewählten Facetten-Klassen dieses Artikels,
 * je Klasse EINE Linie, geordnet nach Status-Rang (§2 — deklarierte Ordnung aus
 * `STATUS_RANG`, nie aus Zählern abgeleitet).
 *
 * REINER RENDERER, wie die `LeitfallZeile`: der Reader lädt den Bezugs-Shard
 * GENAU EINMAL je Erlass (inhalt.tsx) und reicht die aufgelösten, bereits
 * gefilterten Kanten als Prop durch. Kein Fetch je Zeile — bei ~1000 Artikeln
 * grosser Erlasse wäre das die belegte Idle-Herde aus W2·7-VZUI (§15.4).
 *
 * `data-leitfall-zeile` bleibt gesetzt: der bestehende «Entscheide»-Schalter
 * (V2·B-1, rein CSS über `data-leitfaelle` am <html>) blendet die Kanten-Zeile
 * aus — er muss die erweiterte Form genauso treffen wie die schlanke, sonst
 * hätte das Zuschalten einer Facette einen Schalter still ausgehebelt (§13 F4).
 */
export type BezuegeForm =
  /** Ist-Form am Artikelfuss: je Klasse eine waagrecht scrollbare Linie. */
  | 'zeile'
  /** W2·24-R4: dieselben Gruppen senkrecht gestapelt, für die Randnotiz-Spalte. */
  | 'rand';

export const BezuegeZeile = memo(function BezuegeZeile({ kanten, gesamt, zeitAktiv = false, kantonAktiv = false, normZitat, revision, form = 'zeile' }: {
  /** Kanten dieses Artikels NACH Facetten-Filter, in Shard-Ordnung. */
  kanten?: readonly Bezug[];
  /** Kanten je Status an diesem Artikel, OHNE UI-Filter — die Bezugsgrösse (§8). */
  gesamt?: Partial<Record<BezugStatus, number>>;
  /** Ist ein Zeitraum-Filter aktiv? Entscheidet nur über den WORTLAUT der Zahl
   *  — eine Verkürzung ohne Grund zu zeigen, wäre die halbe Auskunft (§8). */
  zeitAktiv?: boolean;
  /** Ist ein Kantons-Filter aktiv? Er verkürzt die kantonale Linie genauso wie
   *  der Zeitraum die übrigen; ihn nicht mitzuführen hat die Zahl an StPO/428
   *  auf «1» kollabieren lassen (Gegenprüfung Runde 2/J1). */
  kantonAktiv?: boolean;
  /** Voll zitierfähige Norm («Art. 429 StPO») für den Fundstellen-Sprung. */
  normZitat: string;
  revision?: ArtikelRevision | null;
  /** Gestalt: Zeile am Artikelfuss (Vorgabe) oder Stapel in der Randnotiz (R4). */
  form?: BezuegeForm;
}) {
  // Keine Kanten ⇒ NICHTS. Kein Platzhalter, kein Hinweis, keine Overline —
  // null Pixel Verzahnungs-UI im Lesetext-Bereich (Vorgabe David 28.7.2026:
  // «bezüge kann weg. nur auflistung wenn aktiviert.»). Das gilt auch, wenn der
  // Nutzer alle Facetten abgewählt hat: er hat die Auflistung abgeschaltet, und
  // ein Rest-Hinweis wäre genau die Zeile, die weg soll. Der Weg zurück steht im
  // Dropdown «Rechtsprechung ▾», wo er abgeschaltet wurde — dort trägt der
  // Zähler auch die ehrliche Grundgesamtheit (§8), nicht mehr der Artikelfuss.
  if (!kanten || kanten.length === 0) return null;

  // Nach Status-Klasse gruppieren, Reihenfolge INNERHALB der Klasse = Shard-
  // Ordnung (seit B7 chronologisch neu→alt) — die Datenschicht hat sie gesetzt,
  // hier wird sie nur erhalten (§5: keine zweite Sortier-Wahrheit). Klassen ohne
  // Treffer erscheinen gar nicht.
  const gruppen = new Map<BezugStatus, Bezug[]>();
  for (const b of kanten) {
    const liste = gruppen.get(b.facetten.status);
    if (liste) liste.push(b);
    else gruppen.set(b.facetten.status, [b]);
  }
  const geordnet = [...gruppen.entries()].sort((a, b) => STATUS_RANG[a[0]] - STATUS_RANG[b[0]]);
  const filter = verkuerzungAus(zeitAktiv, kantonAktiv);

  return (
    <div data-leitfall-zeile data-bezuege-zeile data-bezuege-form={form}
      className={form === 'rand' ? 'flex flex-col gap-2.5' : 'mt-4 flex flex-col gap-1.5'}>
      {geordnet.map(([status, liste]) => (
        <StatusGruppe key={status} status={status} kanten={liste} gesamtRoh={gesamt?.[status]}
          filter={filter} normZitat={normZitat} revision={revision} form={form} />
      ))}
    </div>
  );
});
