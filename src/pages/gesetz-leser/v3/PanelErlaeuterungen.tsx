import { Link } from 'react-router-dom';
import { AbrufFehler } from '../../../components/ui/AbrufFehler';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import { StatusBadge } from '../../../components/verzahnung/StatusBadge';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { klassifiziereFassungsBezug, revisionFuerToken, type RevisionShard } from '../../../lib/verzahnung/artikel-revisionen';
import type { MaterialBezug } from '../../../lib/normtext/werkzeuge';
import { ordneErlaeuterungen, type ErlaeuterungPosten } from './erlaeuterungModell';
import type { ErlaeuterungStand, Geladen } from './panelKontextLaden';

// ─── Reiter «Erläuterungen» (S6, Entscheid David 23.9.2026) ─────────────────
//
// Reitertitel «Behördliche Erläuterungen»: Kreisschreiben, Wegleitungen,
// Leitfäden, Praxismitteilungen — was die Verwaltung zur Anwendung des
// Erlasses veröffentlicht. KEIN Gesetzesrang, und der Hinweis sagt es (§8).
// Hervorgegangen aus der Hälfte «Behörden-Praxis» des Reiters «Anwendung»
// (W2·7-VZUI, 31.8.2026); David 23.9.2026, wörtlich: «es soll werkzeuge und
// behördliche erläuterungen heissen. nicht dass es mit materialien verwechselt
// wird die gesetzgebung darstellen». Die Gesetzgebung (Botschaften, Ratschläge)
// steht darum im Reiter «Materialien», die Verwaltungspraxis hier.
//
// ── WAS SICH GEGENÜBER «ANWENDUNG» ÄNDERT (Befunde S6) ─────────────────────
// AN-3  die kuratierten Register-Einträge sind wieder da (Mischung wie im
//       `KontextPanel`, Herleitung in `panelKontextLaden.useErlaeuterungen`).
// AN-4  Ladefehler ≠ «nichts erfasst»: eigener Zustand mit «Erneut laden».
// AN-8  Anhänge unter ihr Kreisschreiben, artikelweise Wegleitungen als EIN
//       Posten, natürliche Sortierung (`./erlaeuterungModell`).
// AN-9  §8 wie im `KontextPanel` (Z. 608–632): Marke «maschinell», Stand je
//       Dokument, Hinweis «Dokument-Stand vor der letzten Änderung von Art. N».
//       Das Datum heisst «Stand der Veröffentlichung»: das Register führt das
//       Veröffentlichungs-/Abrufdatum, nicht durchgehend das Dokumentdatum
//       (AN-2, Welle 2 Daten) — der Name verspricht nicht mehr, als da ist.

const KANTON_ABDECKUNG = 'Behördliche Erläuterungen sind bisher nur zu Bundeserlassen erfasst.';

function DokumentZeile({ m, revisionShard, eingerueckt = false }: {
  m: MaterialBezug; revisionShard: RevisionShard | null | undefined; eingerueckt?: boolean;
}) {
  // Staleness (§2.4) wie im `KontextPanel`: nur bei artikelscharfem Bezug und
  // geladenem Revisions-Shard — ein Hinweis, nie ein «aktuell»-Siegel (R16).
  const rev = m.artikel ? revisionFuerToken(revisionShard, m.artikel) : undefined;
  const veraltet = !!m.artikel && klassifiziereFassungsBezug({ iso: m.stand, praezision: 'tag' }, rev) === 'revidiert';
  return (
    <li data-v3-erlaeuterung={m.key}
      className={`border-t border-line py-2 ${eingerueckt ? 'pl-2.5' : 'border-l-2 border-l-reg-m pl-2.5'}`}>
      <Link to={m.pfad} className="no-underline hover:text-ink-900">
        <span className="block text-body-s font-medium text-ink-800">
          {m.behoerdeKuerzel} · {m.doktypLabel}{m.nummer ? ` ${m.nummer}` : ''}
        </span>
        <span className="mt-0.5 block text-micro leading-snug text-ink-600">
          {m.titel}
          {m.sublabel && <span className="num text-ink-500"> · {m.sublabel}</span>}
        </span>
      </Link>
      <span className="mt-0.5 block text-micro text-ink-500">
        <span className="num">Stand der Veröffentlichung {datumAnzeige(m.stand)}</span>
        {m.herkunft === 'maschinell' && <StatusBadge praedikat="maschinell" className="ml-1.5 align-middle" />}
      </span>
      {veraltet && m.artikel && (
        <span data-v3-erlaeuterung-veraltet className="mt-0.5 block text-micro text-warn-700">
          Dokument-Stand vor der letzten Änderung von Art. {m.artikel.replace(/_/g, '')}.
        </span>
      )}
    </li>
  );
}

function Posten({ p, revisionShard }: { p: ErlaeuterungPosten; revisionShard: RevisionShard | null | undefined }) {
  if (p.art === 'dokument') {
    if (p.anhaenge.length === 0) return <DokumentZeile m={p.m} revisionShard={revisionShard} />;
    return (
      <>
        <DokumentZeile m={p.m} revisionShard={revisionShard} />
        <li className="pb-1 pl-2.5">
          <details data-v3-erlaeuterung-anhaenge>
            <summary className="cursor-pointer text-micro text-ink-600 hover:text-ink-900">
              <span className="num">{p.anhaenge.length}</span> {p.anhaenge.length === 1 ? 'Anhang' : 'Anhänge'} zu {p.m.nummer}
            </summary>
            <ul>{p.anhaenge.map((a) => <DokumentZeile key={a.key} m={a} revisionShard={revisionShard} eingerueckt />)}</ul>
          </details>
        </li>
      </>
    );
  }
  const erste = p.teile[0]?.nummer ?? '';
  const letzte = p.teile[p.teile.length - 1]?.nummer ?? '';
  return (
    <li data-v3-erlaeuterung-reihe={p.key} className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
      <details>
        <summary className="cursor-pointer">
          <span className="text-body-s font-medium text-ink-800">{p.behoerdeKuerzel} · {p.doktypLabel}, artikelweise</span>
          <span className="mt-0.5 block text-micro text-ink-600">
            Erläuterungen zu <span className="num">{p.teile.length}</span> Artikeln ({erste} bis {letzte})
          </span>
        </summary>
        <ul className="mt-1">{p.teile.map((t) => <DokumentZeile key={t.key} m={t} revisionShard={revisionShard} eingerueckt />)}</ul>
      </details>
    </li>
  );
}

export function PanelErlaeuterungen({ stand, revisionShard, ebene }: {
  stand: Geladen<ErlaeuterungStand>;
  /** Revisions-Shard des Erlasses (derselbe wie im Reiter «Entscheide») —
   *  speist den Staleness-Hinweis; `null`/`undefined` = keine Aussage. */
  revisionShard?: RevisionShard | null;
  ebene?: 'bund' | 'kanton';
}) {
  if (!stand.fertig) {
    return <p data-v3-panel-reiter-inhalt="erlaeuterungen" className="px-3 py-3 text-body-s text-ink-600">Behördliche Erläuterungen werden geladen …</p>;
  }
  if (stand.wert === null) {
    return (
      <AbrufFehler gegenstand="Behördliche Erläuterungen" mehrzahl onErneut={stand.erneut}
        className="px-3 py-3" daten={{ 'data-v3-panel-reiter-inhalt': 'erlaeuterungen', 'data-v3-panel-fehler': '' }} />
    );
  }
  const posten = ordneErlaeuterungen(stand.wert.liste);
  if (posten.length === 0) {
    return (
      <p data-v3-panel-reiter-inhalt="erlaeuterungen" className="px-3 py-3 text-body-s text-ink-600">
        Zu diesem Erlass ist keine behördliche Erläuterung erfasst.
        {ebene === 'kanton' && (
          <span data-v3-panel-abdeckung="kanton" className="block text-ink-600">{KANTON_ABDECKUNG}</span>
        )}
      </p>
    );
  }
  return (
    <div data-v3-panel-reiter-inhalt="erlaeuterungen" className="px-3 py-1">
      <section data-v3-erlaeuterungen className="pt-1">
        <GruppenKopf als="p" dicht titel="Behördliche Erläuterungen" zahl={posten.length} />
        {/* §8: Rang, Erfassungsart und Datenstand werden genannt, nicht
            vorausgesetzt. «Erfasste» statt einer Vollzähligkeits-Behauptung. */}
        <p className="pb-1 pt-0.5 text-micro leading-snug text-ink-500">
          Erfasste Behördenpublikationen (Kreisschreiben, Wegleitungen, Leitfäden) — kein Gesetzesrang.
          {' '}<span className="num">Datenstand {datumAnzeige(stand.wert.erzeugt)}</span>.
        </p>
        <ul className="mt-0.5">
          {posten.map((p) => <Posten key={p.art === 'dokument' ? p.m.key : p.key} p={p} revisionShard={revisionShard} />)}
        </ul>
      </section>
    </div>
  );
}
