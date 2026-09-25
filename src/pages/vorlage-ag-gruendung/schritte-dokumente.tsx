import { Link } from 'react-router-dom';
import { KostenBundZeilen, MappenAbschnitt, MappenAnsicht, MappenCheckliste, MappenGates } from '../../components/vorlagen/Dokumentmappe';
import { notariatsGebuehrGruendung } from '../../lib/notariatsgebuehrenGruendung';
import { PHASEN, CHF, BANNER_ENTWURF } from '../vorlagenAgGruendungDaten';
import type { AgSchrittCtx } from './ctx';

// Verhaltensneutral ausgelagerter Dokumente-Schritt (§6 Ziff. 6): JSX-Body
// unverändert; die benötigten Werte/Helfer kommen aus dem Ctx. Reine
// Darstellung (§3).
export function SchrittDokumente({ ctx }: { ctx: AgSchrittCtx }) {
  const {
    blockerKlickbar, mappe, batchLaeuft, alleHerunterladen, batchMeldung,
    card, checkliste, ak, fremdwaehrung, kanton,
  } = ctx;
  return (
    <div className="space-y-5">
      {blockerKlickbar('Damit die Dokumente erzeugt werden können, fehlt noch — Klick führt zum Eingabefeld:')}
      <MappenGates gates={{ blocker: [], warnungen: mappe.gates.warnungen }} />

      {mappe.dokumente.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="lc-btn-primary" disabled={batchLaeuft} onClick={alleHerunterladen}>
              {batchLaeuft ? 'Erzeuge ZIP …' : `Alle ${mappe.dokumente.length} Dokumente herunterladen (ZIP)`}
            </button>
            <p className="text-xs text-ink-500 max-w-reading">
              Lädt alle notwendigen Dokumente Ihrer Konstellation als eine ZIP-Datei herunter, je als PDF
              und Word (DOCX) — Statuten und Errichtungsakt (sowie Sacheinlageverträge mit Grundstück) als
              ENTWURF mit Wasserzeichen, die übrigen druckfertig.
            </p>
          </div>
          {batchMeldung && <p className="text-body-s text-ink-700">{batchMeldung}</p>}
          <MappenAnsicht
            dokumente={mappe.dokumente}
            bannerEntwurf={BANNER_ENTWURF}
            docxErlaubt={card?.modus === 'vorlage' && (card.output?.includes('docx') ?? false)}
            startDokId="statuten"
          />
        </div>
      )}

      {/* Checkliste (Art. 43/44 HRegV) */}
      <MappenCheckliste phasen={PHASEN} unterlagen={checkliste.unterlagen} />

      {/* Kosten (Bund) */}
      <MappenAbschnitt titel="Kosten (Bund) und Hinweise">
        <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
          <KostenBundZeilen emissionsabgabeChf={checkliste.emissionsabgabeChf} />
          {/* P11 (Perfektion): Notariatsgebühr kantonsabhängig aus der
              Tarif-Datenschicht (lib/notariatsgebuehrenGruendung.ts, §5);
              ehrliche Lücken für nicht erhobene Kantone (§8). */}
          {(() => {
            const kapital = Number(ak.replace(/['’\s]/g, ''));
            const tarif = !fremdwaehrung && Number.isFinite(kapital) && kapital > 0
              ? notariatsGebuehrGruendung(kanton, kapital) : null;
            if (!tarif) {
              return (
                <li>
                  Notariatsgebühren sind kantonal geregelt und für {fremdwaehrung ? 'Fremdwährungs-Kapital' : `den Kanton ${kanton}`} hier
                  noch nicht amtlich erhoben — Auskunft beim Notariat; Bank-Sperrkonto je nach Institut
                  (Praxisbeispiel ZKB: 0,5 ‰, mind. CHF 250).
                </li>
              );
            }
            const e = tarif.ergebnis;
            return (
              <li>
                <span className="font-medium text-ink-900">
                  Notariatsgebühr ({tarif.kanton}):{' '}
                  {e.typ === 'betrag' && `${CHF.format(e.chf)}`}
                  {e.typ === 'rahmen' && `${CHF.format(e.vonChf)} bis ${CHF.format(e.bisChf)}${e.mittelChf ? ` (Mittel ${CHF.format(e.mittelChf)})` : ''}`}
                  {e.typ === 'aufwand' && 'nach Aufwand — amtlich nicht beziffert'}
                  {e.typ === 'offen' && 'nicht amtlich erhebbar'}
                </span>{' '}
                — <a href={tarif.erlassUrl} target="_blank" rel="noopener noreferrer" className="text-brass-700 underline">{tarif.erlassLabel}</a> (Stand {tarif.stand}); Tarifwert ohne MWST (8,1 %) und Auslagen.
                {tarif.hinweise.map((h) => ` ${h}`).join('')} — fachliche Abnahme ausstehend.
                {' '}Bank-Sperrkonto je nach Institut (Praxisbeispiel ZKB: 0,5 ‰, mind. CHF 250).
              </li>
            );
          })()}
          <li>
            Fremdsprachige Belege: wichtige Belege (Statuten, Urkunden, Sacheinlageverträge, Berichte) nur
            mit beglaubigter deutscher Übersetzung einreichen (Merkblatt «Formelle Anforderungen», HRegA ZH, 7.1.2025).
          </li>
          {checkliste.hinweise.map((h) => (
            <li key={h.slice(0, 40)}>{h}</li>
          ))}
        </ul>
      </MappenAbschnitt>

      {/* Etappe 5/D20+D21: Nach dem Eintrag — Pflichten und Warnung */}
      <MappenAbschnitt titel="Nach dem Eintrag: Pflichten des Verwaltungsrates">
        <ul className="lc-list space-y-2 text-body-s text-ink-700 max-w-reading-s">
          <li>
            <span className="font-medium text-ink-900">Buchführung ist persönliche Pflicht</span> jedes
            VR-Mitglieds: Die Buchführungspflicht folgt aus Art. 957 ff. OR, die Ausgestaltung des
            Rechnungswesens ist unübertragbare VR-Aufgabe (Art. 716a Abs. 1 Ziff. 3 OR) — sie gilt auch
            bei einer Firmenübernahme ohne erhaltene Buchhaltung; Unterlassung kann strafbar sein
            (Art. 166 StGB).
          </li>
          <li>
            <span className="font-medium text-ink-900">Kapitalverlust und Überschuldung:</span> Sind die
            Schulden nur noch zur Hälfte durch Aktiven gedeckt, sind Sanierungsmassnahmen zu ergreifen und
            ein geprüfter Zwischenabschluss zu erstellen (auch ohne Revisionsstelle); bei Überschuldung ist
            das Gericht zu benachrichtigen (Art. 725, 725b Abs. 3 OR) — sonst drohen persönliche Haftung
            und Strafbarkeit (Art. 165 StGB). Quelle: Merkblatt «Gesetzliche Pflichten als Mitglied des
            Verwaltungsrats», HRegA ZH, 3.12.2025.
          </li>
          <li>
            <span className="font-medium text-ink-900">Vorsicht vor privaten Registern:</span> Nach dem
            Eintrag verschicken private Firmen («Handelsregisteramt Schweiz», «ZEFIREG» u. ä.)
            rechnungsähnliche Offerten — nur die Rechnung des kantonalen Handelsregisteramts ist zu
            bezahlen (Merkblatt HRegA ZH, 17.2.2026; zh.ch/falsche-rechnungen).
          </li>
        </ul>
      </MappenAbschnitt>

      <p className="text-xs text-ink-500">
        Amtliche Vorlagen-Suite des HRegA Zürich: Musterstatuten (kurz/lang), VR-Protokoll, Wahlannahme-,
        Domizilannahmeerklärung und Unterschriftenblatt (zh.ch, notariate-zh.ch); elektronischer Weg über
        EasyGov (die Beurkundung bleibt beim Notariat). Vergleich der Unterlagen mit der GmbH:{' '}
        <Link to="/vorlagen/gmbh-gruendung" className="text-brass-700 underline">GmbH-Gründungsunterlagen</Link>.
      </p>
    </div>
  );
}
