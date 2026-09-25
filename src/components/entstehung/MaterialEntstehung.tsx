import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ladeAnkerSidecar, ankerUrl, type AnkerSidecar } from '../../lib/entstehung/anker';
import { normenFuer } from '../../lib/kontext';
import { datumCh } from '../../lib/normtext/erlassKopfText';
import type { DoktypId } from '../../lib/materialien/typen';

// ═══ DIE RÜCKRICHTUNG: «Erläutert diese Artikel» (W2·6c · E3) ════════════════
//
// §11.5 «Am Material», wörtlich: «‹Erläutert diese Artikel› nur mit
// Anker-Sidecar; sonst nur Live-Link.» Am Artikel führt die Entstehungs-Karte
// zur Botschaft; hier geht derselbe Weg zurück — von der Botschaft zu den
// Artikeln, die sie im amtlichen HTML wirklich erläutert.
//
// DER SATZ «NUR MIT ANKER-SIDECAR» IST DIE GANZE REGEL (§8). Die Anker-Vergabe
// im Bundesblatt beginnt erst am 16.4.2025 und bleibt lückenhaft (R3, 6.9.2026:
// 22 % der Botschaften, 4 Sidecars im Bestand vom 11.9.2026). Ohne Sidecar
// steht hier deshalb NICHTS — nicht «keine Artikel», nicht ein leerer Kasten:
// der Live-Link zur amtlichen Fassung steht ohnehin im Kopf dieser Seite, und
// eine Abwesenheit von Ankern sagt nichts über den Zusammenhang aus.
//
// ZWEI FÄLLE, in denen die Karte den Sprung NICHT artikelscharf behauptet:
//   · `mantel` (eine Vorlage ändert mehrere Erlasse) und mehr als ein
//     `erlassKey` — dann gilt der Anker auf Erlass-Ebene, und welcher «Art. 5»
//     gemeint ist, ist nicht entscheidbar. Ein falscher Sprung wäre schlimmer
//     als kein Sprung (§1).
//   · `mehrdeutig` — eIds, die im HTML mehrfach vorkommen. Sie stehen gar nicht
//     erst in `anker`; ihre ZAHL steht hier, damit die Lücke sichtbar bleibt.
//
// §3: reine Darstellung + Lazy-Loader. Nichts wird gerechnet, nichts geraten.

export function MaterialEntstehung({ materialKey, doktyp }: {
  /** Schlüssel des Materials (= Dateiname des Anker-Sidecars). */
  materialKey: string;
  /** Nur Botschaften tragen Anker — für alles andere wird nichts geholt (§15). */
  doktyp: DoktypId;
}) {
  const [sidecar, setSidecar] = useState<AnkerSidecar | null>(null);

  useEffect(() => {
    if (doktyp !== 'botschaft') return;
    let lebt = true;
    void ladeAnkerSidecar(materialKey).then((s) => { if (lebt) setSidecar(s); });
    return () => { lebt = false; };
  }, [materialKey, doktyp]);

  if (!sidecar || sidecar.anker.length === 0) return null;

  const erlasse = normenFuer(sidecar.erlassKeys);
  // Artikelscharf nur bei genau EINEM Erlass und ohne Mantel-Vorbehalt.
  const ziel = !sidecar.mantel && erlasse.length === 1 ? erlasse[0] : null;

  return (
    <section className="max-w-reading" data-material-entstehung>
      <h2 className="lc-overline mb-2"><span className="lc-punkt" aria-hidden />Erläutert diese Artikel</h2>
      {/* W2·31-BILDSCHIRMBREITE B8 (25.9.2026): beide `xs`-Absätze tragen den
          Kleintext-Deckel (DESIGN-REGLEMENT B2a). Vorher erbten sie nur das
          `max-w-reading` der Sektion und liefen gemessen 623 px / 90 Zeichen je
          Zeile (BOTSCHAFT-2025-1478, einspaltig). */}
      <p className="text-xs leading-snug text-ink-500 mb-2 max-w-kleintext">
        {ziel
          ? <>Stellen im amtlichen Text dieser Botschaft, die einen Artikel des {ziel.kuerzel} erläutern
            — <span className="num">{sidecar.anker.length}</span> Anker, amtlich aus dem
            Bundesblatt-HTML (Abruf <span className="num">{datumCh(sidecar.abgerufen)}</span>).</>
          : <>Diese Vorlage ändert mehrere Erlasse; die <span className="num">{sidecar.anker.length}</span> Anker
            gelten darum auf Erlass-Ebene — welcher Artikel welchen Erlasses gemeint ist, sagt der
            amtliche Text nicht eindeutig (§8).</>}
      </p>
      {/* REST S2 (25.9.2026): Form der gelöschten `.lr8-entst-anker` als Token-
          Utility — Liste mit Kante, wie die Verfahrenskette am Artikel. */}
      <ul className="grid gap-0.5 border-l border-rule-soft pl-2.5 text-xs text-ink-600">
        {sidecar.anker.map((a) => (
          <li key={a.eId}>
            {ziel
              ? <Link to={`${ziel.pfad}#art-${a.token}`} title={a.ueberschrift}>{a.ueberschrift}</Link>
              : <span title={a.ueberschrift}>{a.ueberschrift}</span>}
            {' '}
            <a href={ankerUrl(sidecar, a)} target="_blank" rel="noopener noreferrer"
              className="text-ink-500 hover:text-ink-900"
              aria-label={`${a.ueberschrift} in der amtlichen Botschaft öffnen`}>↗</a>
          </li>
        ))}
      </ul>
      {sidecar.mehrdeutig.length > 0 && (
        <p className="mt-2 text-xs leading-snug text-ink-500 max-w-kleintext">
          <span className="num">{sidecar.mehrdeutig.length}</span> weitere Stellen kommen im Dokument
          mehrfach vor und sind darum keinem Artikel eindeutig zugeordnet — sie stehen hier nicht
          (ein falscher Sprung wäre schlimmer als kein Sprung).
        </p>
      )}
    </section>
  );
}
