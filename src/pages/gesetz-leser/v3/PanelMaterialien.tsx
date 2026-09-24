import type { ReactNode } from 'react';
import { AbrufFehler } from '../../../components/ui/AbrufFehler';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { fedlexLokalisiert, type Locale } from '../../../components/locale';
import { VERNEHMLASSUNG_STATUS_LABEL, vernehmlassungInArbeit, type VernehmlassungBezug } from '../../../lib/materialien/vernehmlassungen';
import type { BotschaftBezug } from '../../../lib/materialien/botschaften';
import type { Geladen, MaterialStand } from './panelKontextLaden';

// ─── Reiter «Materialien» (H3) ───────────────────────────────────────────────
//
// Zwei Abschnitte, beide amtlich und beide verlinkt:
//   Entstehung   — Botschaften des Bundesrates (Fedlex), neu → alt
//   In Arbeit    — Vernehmlassungen mit Verfahrens-Zustand
//
// ZWEI ABSCHNITTE, NICHT EINE LISTE: eine Botschaft ist ein abgeschlossenes
// Dokument zur Entstehung, eine Vernehmlassung ein laufendes Verfahren. In eine
// Liste gemischt läse man beides als denselben Rang — derselbe Grund, aus dem die
// Entscheide nach Instanz gruppiert bleiben (§8).
//
// SOFT LAW BLEIBT DRAUSSEN: das Ist-Kontext-Panel führt zusätzlich
// Behörden-Ressourcen («kontextSoftLaw») und «passende Werkzeuge». Beides ist
// kein MATERIAL zur Entstehung des Erlasses, sondern eine dritte und vierte
// Sache — sie in diesen Reiter zu kippen wäre die Rückkehr zu den sechs
// bedingten Sektionen, die Kap. 4d gerade auflöst. Offener Punkt im
// Vollzugsvermerk, nicht stillschweigend weggelassen.
//
// ── DER OFFENE PUNKT IST GESCHLOSSEN (W2·7-VZUI, 31.8.2026) ─────────────────
// Der Absatz oben bleibt wörtlich stehen — er war und ist richtig: hier gehören
// die beiden nicht hin. Was fehlte, war ihr eigener Ort, und den gibt es jetzt:
// Reiter «Anwendung» (`PanelAnwendung.tsx`, vierter Eintrag in `PANEL_REITER`).
// Wer erwägt, hier eine dritte Sektion aufzumachen, liest zuerst den Kopf dort.
// ERGÄNZT S6 (23.9.2026): «Anwendung» ist in «Erläuterungen»
// (`PanelErlaeuterungen.tsx`) und «Werkzeuge» (`PanelWerkzeuge.tsx`) geteilt
// (Entscheid David); dieser Reiter ist ausdrücklich NUR Gesetzgebung.
//
// ── S6 · SCHÄRFUNG (Befunde vom 23.9.2026) ─────────────────────────────────
// M-1  «In Arbeit» zählte an OR 33 Verfahren — 31 abgeschlossene und 2
//      zurückgezogene, kein laufendes. Seither nur laufende/geplante/in
//      Vorbereitung (`vernehmlassungInArbeit`), der Rest unter «Vernehmlassungen
//      (abgeschlossen)».
// M-2  Status-Etiketten wörtlich amtlich (`VERNEHMLASSUNG_STATUS_LABEL`).
// M-3  Kantonale Ratschläge/Berichte (BS) werden gezeigt — der Satz «die
//      Sammlung erfasst bisher nur Bundeserlasse» war seit dem BS-Import falsch.
// M-6  §8-Zeile: maschinell zugeordnet, nicht geprüft, Abdeckung, Datenstand.
//      «Führte zur Änderung» nur, wo ein Änderungserlass diese Botschaft
//      BELEGT nennt (`RevisionBezug.botschaftKey`); Ursprungs-Botschaften
//      werden nicht behauptet — das gibt der Datensatz nicht her (Welle 2).
// M-8  Ladefehler mit «Erneut laden»; der Ausweg-Link heisst, wohin er führt.
// M-11 Titel in der gewählten Sprache (fr/it), Fedlex-Links lokalisiert.

// GEMESSEN 23.9.2026: die Gesetzgebungs-Sammlung kennt ausser dem Bund nur die
// Grossratsgeschäfte Basel-Stadt (`register.json`, behoerde «BS-GR»).
const KANTON_ABDECKUNG = 'Kantonale Gesetzgebungsmaterialien sind bisher nur für Basel-Stadt (Grossratsgeschäfte) erfasst.';

/** Fundstelle erstes/letztes Botschaftsdatum (gemessen 23.9.2026: kleinstes
 *  `stand` einer Botschaft in `register.json` = 1999-03-31). */
const ABDECKUNG_BUND = 'Botschaften ab 31.03.1999, Vernehmlassungen ab rund 2006';

const LINK = 'whitespace-nowrap text-brass-700';

function Titel({ titel, titelFr, titelIt, rueckfall, locale }: {
  titel: string; titelFr?: string; titelIt?: string; rueckfall?: string; locale: Locale;
}) {
  const t = (locale === 'fr' && titelFr) || (locale === 'it' && titelIt) || titel;
  return <span {...(rueckfall ? { lang: 'de' } : {})}>{t}</span>;
}

function Abschnitt({ id, titel, zahl, children }: { id: string; titel: string; zahl: number; children: ReactNode }) {
  return (
    <section data-v3-panel-material={id} className="pt-2">
      <GruppenKopf als="p" dicht titel={titel} zahl={zahl} />
      <ul className="mt-0.5">{children}</ul>
    </section>
  );
}

function VernehmlassungZeile({ v, locale }: { v: VernehmlassungBezug; locale: Locale }) {
  return (
    <li className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-body-s font-medium text-ink-800">{VERNEHMLASSUNG_STATUS_LABEL[v.status]}</span>
        {/* Frist nur, wenn sie das Sidecar trägt — bei «in Vorbereitung»
            und «geplant» fehlt sie, und ein Platzhalter wäre eine
            erfundene Angabe (§8). */}
        {v.fristEnde && <span className="num text-micro text-ink-500">Frist bis {datumAnzeige(v.fristEnde)}</span>}
      </span>
      <span className="mt-0.5 block text-micro leading-snug text-ink-600">
        <Titel titel={v.titel} titelFr={v.titelFr} titelIt={v.titelIt} rueckfall={v.titelRueckfall} locale={locale} />{' '}
        {/* Ä121: dasselbe Ziel, derselbe Name (Herleitung bei den Botschaften). */}
        <a href={fedlexLokalisiert(v.quelleUrl, locale)} rel="nofollow noopener noreferrer" target="_blank" className={LINK}>Fedlex ↗</a>
      </span>
    </li>
  );
}

export function BotschaftZeile({ b, aenderung, locale }: { b: BotschaftBezug; aenderung?: string; locale: Locale }) {
  return (
    <li className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="num text-body-s font-medium text-ink-800">{b.nummer ?? 'Botschaft'}</span>
        <span className="num text-micro text-ink-500">vom {datumAnzeige(b.stand)}</span>
      </span>
      <span className="mt-0.5 block text-micro leading-snug text-ink-600">
        <Titel titel={b.titel} titelFr={b.titelFr} titelIt={b.titelIt} rueckfall={b.titelRueckfall} locale={locale} />{' '}
        {/* Ä121 (18.8.2026): der Link nannte kein Ziel und stand in
            derselben Zeile neben «Curia Vista ↗», das seines nennt.
            Ein Adjektiv ist keine Ortsangabe (§8) — der Link führt in
            die amtliche Sammlung, also heisst er «Fedlex ↗».
            BELEGT (gezählt 18.8.2026 in `public/materialien/register.json`):
            alle 405 Botschaften und alle 824 Vernehmlassungen liegen auf
            fedlex.admin.ch. */}
        <a href={fedlexLokalisiert(b.quelleUrl, locale)} rel="nofollow noopener noreferrer" target="_blank" className={LINK}>Fedlex ↗</a>
        {b.parlamentUrl && (
          <>{' · '}<a href={b.parlamentUrl} rel="nofollow noopener noreferrer" target="_blank" className={LINK}>Curia Vista ↗</a></>
        )}
      </span>
      {aenderung && (
        <span data-v3-botschaft-aenderung className="num mt-0.5 block text-micro text-ink-500">führte zur Änderung {aenderung}</span>
      )}
    </li>
  );
}

export function PanelMaterialien({ stand, ebene, locale = 'de', aenderungNachBotschaft }: {
  stand: Geladen<MaterialStand>;
  /** Ebene des Erlasses — durchgereicht aus dem Modell (§5, s. `PanelEntscheide`).
   *  Steuert den Leerzustands-Zusatz und den Fehler-Ausweg; `undefined` = Bund. */
  ebene?: 'bund' | 'kanton';
  locale?: Locale;
  /** botschaftKey → AS-Fundstelle des Änderungserlasses, der sie BELEGT nennt
   *  (aus dem ohnehin geladenen Revisions-Sidecar, §15: kein zweiter Fetch). */
  aenderungNachBotschaft?: ReadonlyMap<string, string>;
}) {
  if (!stand.fertig) {
    return <p data-v3-panel-reiter-inhalt="materialien" className="px-3 py-3 text-body-s text-ink-600">Materialien werden geladen …</p>;
  }
  const { botschaften, vernehmlassungen, kanton, erzeugt } = stand.wert
    ?? { botschaften: null, vernehmlassungen: null, kanton: null, erzeugt: null };
  // ALLE null = Manifest unerreichbar (Fetch-Fehler), nicht «nichts erfasst» (§8).
  // F2-4 (31.8.2026): die Zeile läuft über den EINEN Abruf-Fehler-Baustein
  // (`ui/AbrufFehler`); `warn-700` statt des ruhigen `ink-500` des Leerzustands.
  // S6 · M-8: der Ausweg heisst, wohin er führt — Fedlex (Botschaften und
  // Vernehmlassungen liegen dort), nicht «Amtliche Fassung» des Gesetzes. Am
  // Kanton gibt es kein EIN Portal der Materialien: dort kein Link statt
  // eines falschen Ziels (bis S6 die Fassung des Erlasses, `quelleUrl`).
  if (botschaften === null && vernehmlassungen === null && kanton === null) {
    return (
      <AbrufFehler gegenstand="Materialien" mehrzahl onErneut={stand.erneut}
        href={ebene === 'kanton' ? undefined : 'https://www.fedlex.admin.ch/de/home'}
        linkName={ebene === 'kanton' ? undefined : 'Fedlex'}
        className="px-3 py-3" daten={{ 'data-v3-panel-reiter-inhalt': 'materialien', 'data-v3-panel-fehler': '' }} />
    );
  }
  const alleV = vernehmlassungen ?? [];
  const inArbeit = alleV.filter((v) => vernehmlassungInArbeit(v.status));
  const erledigt = alleV.filter((v) => !vernehmlassungInArbeit(v.status));
  const b = botschaften ?? [];
  const k = kanton ?? [];
  if (b.length === 0 && alleV.length === 0 && k.length === 0) {
    return (
      <p data-v3-panel-reiter-inhalt="materialien" className="px-3 py-3 text-body-s text-ink-600">
        Zu diesem Erlass ist kein Gesetzgebungsmaterial erfasst.
        {ebene === 'kanton' && (
          <span data-v3-panel-abdeckung="kanton" className="block text-ink-600">{KANTON_ABDECKUNG}</span>
        )}
      </p>
    );
  }
  const mitZurueckgezogen = erledigt.some((v) => v.status === 'zurueckgezogen');
  return (
    <div data-v3-panel-reiter-inhalt="materialien" className="px-3 py-1">
      {/* M-6 · §8 EINMAL über den Abschnitten, nicht je Zeile (Ä121). */}
      <p data-v3-materialien-hinweis className="pb-0.5 pt-1.5 text-micro leading-snug text-ink-500">
        Maschinell über die amtlichen Geschäftsdaten zugeordnet, fachlich nicht geprüft; bei Mantelvorlagen kann die Zuordnung unvollständig sein.
        {ebene !== 'kanton' && <> Erfasst: {ABDECKUNG_BUND}.</>}
        {erzeugt && <> <span className="num">Datenstand {datumAnzeige(erzeugt)}</span>.</>}
      </p>
      {b.length > 0 && (
        <Abschnitt id="botschaften" titel="Botschaften des Bundesrates" zahl={b.length}>
          {b.map((x) => <BotschaftZeile key={x.key} b={x} aenderung={aenderungNachBotschaft?.get(x.key)} locale={locale} />)}
        </Abschnitt>
      )}
      {k.length > 0 && (
        <Abschnitt id="kanton" titel="Ratschläge und Berichte an den Grossen Rat" zahl={k.length}>
          {k.map((g) => (
            <li key={g.key} className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
              <span className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-body-s font-medium text-ink-800">{g.doktypLabel}{g.nummer ? <span className="num"> {g.nummer}</span> : null}</span>
                <span className="num text-micro text-ink-500">vom {datumAnzeige(g.stand)}</span>
              </span>
              <span className="mt-0.5 block text-micro leading-snug text-ink-600">
                {g.titel}{' '}
                <a href={g.quelleUrl} rel="nofollow noopener noreferrer" target="_blank" className={LINK}>Grosser Rat ↗</a>
              </span>
            </li>
          ))}
        </Abschnitt>
      )}
      {inArbeit.length > 0 && (
        <Abschnitt id="vernehmlassungen" titel="In Arbeit" zahl={inArbeit.length}>
          {inArbeit.map((v) => <VernehmlassungZeile key={v.key} v={v} locale={locale} />)}
        </Abschnitt>
      )}
      {erledigt.length > 0 && (
        <Abschnitt id="vernehmlassungen-erledigt"
          titel={mitZurueckgezogen ? 'Vernehmlassungen (abgeschlossen oder zurückgezogen)' : 'Vernehmlassungen (abgeschlossen)'}
          zahl={erledigt.length}>
          {erledigt.map((v) => <VernehmlassungZeile key={v.key} v={v} locale={locale} />)}
        </Abschnitt>
      )}
    </div>
  );
}
