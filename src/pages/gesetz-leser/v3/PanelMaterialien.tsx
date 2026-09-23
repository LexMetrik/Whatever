import { AbrufFehler } from '../../../components/ui/AbrufFehler';
import { GruppenKopf } from '../../../components/ui/GruppenKopf';
import { datumAnzeige } from '../../../components/rechtsprechung/format';
import { VERNEHMLASSUNG_STATUS_LABEL } from '../../../lib/materialien/vernehmlassungen';
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

// ── K-2b/F37 (W2·13-KANTONE, 31.8.2026) · WARUM DER KANTON HIER LEER IST ─────
// GEMESSEN am 31.8.2026: `public/materialien/register.json` führt 1559 Einträge
// von neun Behörden — ESTV, EDÖB, SECO, BSV, EHRA, FINMA, IGE, BR, Bund —, also
// ausnahmslos eidgenössische; `public/materialien/kanten/` hat 10 Dateien,
// davon 0 zu einem kantonalen Erlass-Key. «Zu diesem Erlass ist kein amtliches
// Material erfasst» war damit am Kantonserlass eine Aussage über den Erlass, wo
// eine über den KORPUS hingehört (§8) — der Zusatz sagt sie.
const KANTON_ABDECKUNG = 'Die Materialien-Sammlung erfasst bisher nur Bundeserlasse.';

export function PanelMaterialien({ stand, quelleUrl, ebene }: {
  stand: Geladen<MaterialStand>;
  quelleUrl: string;
  /** Ebene des Erlasses — durchgereicht aus dem Modell (§5, s. `PanelEntscheide`).
   *  Steuert allein den Leerzustands-Zusatz; `undefined` = keine Aussage. */
  ebene?: 'bund' | 'kanton';
}) {
  if (!stand.fertig) {
    return <p data-v3-panel-reiter-inhalt="materialien" className="px-3 py-3 text-body-s text-ink-600">Materialien werden geladen …</p>;
  }
  const { botschaften, vernehmlassungen } = stand.wert ?? { botschaften: null, vernehmlassungen: null };
  // BEIDE null = Manifest unerreichbar (Fetch-Fehler), nicht «nichts erfasst» (§8).
  // F2-4 (31.8.2026): die Zeile läuft über den EINEN Abruf-Fehler-Baustein
  // (`ui/AbrufFehler`) — dieselbe Auskunft stand im Haus viermal in zwei
  // Optiken. Der Ton wechselt dabei von `ink-500` auf `warn-700`: `ink-500` ist
  // der Ton des ruhigen Leerzustands (die nächste Verzweigung unten), und genau
  // diesen Unterschied betont der Kommentar über dieser Zeile selbst (§8).
  // Das `rel="nofollow"` entfällt mit dem Baustein — es stand an genau dieser
  // einen von vier Fundstellen und an keinem anderen Quell-Link des Hauses.
  if (botschaften === null && vernehmlassungen === null) {
    return (
      <AbrufFehler gegenstand="Materialien" mehrzahl href={quelleUrl}
        className="px-3 py-3" daten={{ 'data-v3-panel-reiter-inhalt': 'materialien' }} />
    );
  }
  const hatBotschaften = (botschaften?.length ?? 0) > 0;
  const hatVernehmlassungen = (vernehmlassungen?.length ?? 0) > 0;
  if (!hatBotschaften && !hatVernehmlassungen) {
    return (
      <p data-v3-panel-reiter-inhalt="materialien" className="px-3 py-3 text-body-s text-ink-600">
        Zu diesem Erlass ist kein amtliches Material erfasst.
        {ebene === 'kanton' && (
          <span data-v3-panel-abdeckung="kanton" className="block text-ink-600">{KANTON_ABDECKUNG}</span>
        )}
      </p>
    );
  }
  return (
    <div data-v3-panel-reiter-inhalt="materialien" className="px-3 py-1">
      {hatBotschaften && (
        <section data-v3-panel-material="botschaften" className="pt-1">
          {/* B3-1 (R3-β): dichte Gestalt des EINEN Gruppenkopfs (`ui/GruppenKopf`)
              — bis hierher sechsmal in den Panels handgezeichnet. */}
          <GruppenKopf als="p" dicht titel="Entstehung" zahl={botschaften?.length} />
          <ul className="mt-0.5">
            {botschaften?.map((b) => (
              <li key={b.key} className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
                <span className="flex items-baseline gap-2">
                  <span className="num shrink-0 text-body-s font-medium text-ink-800">{b.nummer ?? 'Botschaft'}</span>
                  <span className="num shrink-0 text-micro text-ink-500">{datumAnzeige(b.stand)}</span>
                </span>
                <span className="mt-0.5 block text-micro leading-snug text-ink-600">
                  {b.titel}{' '}
                  {/* Ä121 (18.8.2026): der Link nannte kein Ziel und stand in
                      derselben Zeile neben «Curia Vista ↗», das seines nennt.
                      Ein Adjektiv ist keine Ortsangabe (§8) — der Link führt in
                      die amtliche Sammlung, also heisst er «Fedlex ↗».
                      BELEGT (gezählt 18.8.2026 in `public/materialien/register.json`):
                      alle 405 Botschaften und alle 824 Vernehmlassungen liegen auf
                      fedlex.admin.ch; die Behörden-Ressourcen mit anderen Hosts
                      (SECO, ESTV, EDÖB) stehen ausdrücklich NICHT in diesem Reiter
                      («Soft Law bleibt draussen», Dateikopf). Der Name ist damit
                      keine Annahme, sondern der gezählte Bestand. */}
                  <a href={b.quelleUrl} rel="nofollow noopener noreferrer" target="_blank" className="whitespace-nowrap text-brass-700">Fedlex ↗</a>
                  {b.parlamentUrl && (
                    <>{' · '}<a href={b.parlamentUrl} rel="nofollow noopener noreferrer" target="_blank" className="whitespace-nowrap text-brass-700">Curia Vista ↗</a></>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {hatVernehmlassungen && (
        <section data-v3-panel-material="vernehmlassungen" className="pt-2">
          <GruppenKopf als="p" dicht titel="In Arbeit" zahl={vernehmlassungen?.length} />
          <ul className="mt-0.5">
            {vernehmlassungen?.map((v) => (
              <li key={v.key} className="border-l-2 border-t border-line border-l-reg-m py-2 pl-2.5">
                <span className="flex items-baseline gap-2">
                  <span className="shrink-0 text-body-s font-medium text-ink-800">{VERNEHMLASSUNG_STATUS_LABEL[v.status]}</span>
                  {/* Frist nur, wenn sie das Sidecar trägt — bei «in Vorbereitung»
                      und «geplant» fehlt sie, und ein Platzhalter wäre eine
                      erfundene Angabe (§8). */}
                  {v.fristEnde && <span className="num shrink-0 text-micro text-ink-500">bis {datumAnzeige(v.fristEnde)}</span>}
                </span>
                <span className="mt-0.5 block text-micro leading-snug text-ink-600">
                  {v.titel}{' '}
                  {/* Ä121: dasselbe Ziel, derselbe Name (Herleitung oben). */}
                  <a href={v.quelleUrl} rel="nofollow noopener noreferrer" target="_blank" className="whitespace-nowrap text-brass-700">Fedlex ↗</a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
