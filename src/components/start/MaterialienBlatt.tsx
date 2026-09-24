import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ladeMaterialManifest, filtere, vorhandeneDoktypen } from '../../lib/materialien/browse';
import { BEHOERDEN } from '../../lib/materialien/register';
import { GATTUNG_LABEL, gattungVon, type Gattung } from '../../lib/materialien/gattung';
import type { BrowseMaterial, BehoerdeId, DoktypId } from '../../lib/materialien/typen';
import { StandChip } from '../ui/StandChip';
import { Tabs } from '../ui/Tabs';
import { TrefferZeile, TREFFER_ZEILE_RAHMEN } from '../ui/TrefferZeile';
import { BlattSuchFeld, TrefferZahl, WeitereKnopf } from './BlattBausteine';
import { useBlattRuhe } from './blattRuhe';

// ─── Startseite · die Materialien-Kachel: sofort Suche (W2·29-WERKBANK-START S3)
//
// David 23.9.2026: «Materialien … wenn sie aufgeht soll direkt eine suche …
// ermöglichen». Keine Unterstufen — die Suche IST die Stufe (Fahrplan §5d).
// WIEDERVERWENDUNG statt Nachbau (§10): Suchlogik/Filter aus
// `lib/materialien/browse.ts` (dieselbe Quelle wie `pages/Materialien.tsx`),
// Treffer-Zeile aus `ui/TrefferZeile` (dieselbe wie die Live-Suche der
// Rechtsprechung). Ziel jeder Zeile ist die bestehende Detailseite
// `/materialien/:key` — kein eigener Leser hier.
//
// §15: das Register (`public/materialien/register.json`, 1,5 MB — GRÖSSEN-
// ORDNUNG identisch mit `public/normtext/register.json`, das die Gesetze-Kachel
// schon beim Betreten einer Erlassliste lädt) wird erst geladen, wenn dieses
// Modul mountet, also erst beim Öffnen des Blatts — nie auf «/».
//
// Fokus-Ausnahme (Spec «Fokus drin»): NICHT hier behandelt, sondern zentral in
// `StartKachelFeld.tsx` (kleine, klar begrenzte Stelle) — dieses Modul rendert
// nur ein gewöhnliches `<input type="search">`.
//
// ── U12 · GATTUNGS-SCHALTER (David 24.9.2026) ──────────────────────────────
// «materialien soll erläuterungen und materialien enthalten»: das Register
// führt BEIDE Gattungen — Materialien (Gesetzgebung: Botschaften,
// Vernehmlassungen, kantonale Parlamentsgeschäfte) und Erläuterungen
// (Verwaltungspraxis). Der Schalter «Alle · Materialien · Erläuterungen» steht
// VOR Behörde/Art und schränkt deren Optionen auf die gewählte Gattung ein.
// Zuordnung aus `lib/materialien/gattung.ts` — dieselbe wie im Leser (§5),
// Baustein `ui/Tabs` im Modus `pressed` (§10, keine eigene Segment-Leiste).
// Unter «Alle» nennt jede Treffer-Zeile ihre Gattung (Slot `marke` des
// Bausteins); ist eine Gattung gewählt, wäre dieselbe Marke an jeder Zeile
// nur Wiederholung.

const PORTION = 20;

type GattungWahl = Gattung | 'alle';
const GATTUNG_WAHL: readonly { code: GattungWahl; label: string }[] = [
  { code: 'alle', label: 'Alle' },
  { code: 'materialien', label: GATTUNG_LABEL.materialien },
  { code: 'erlaeuterungen', label: GATTUNG_LABEL.erlaeuterungen },
];

function Laedt({ alle, fehler, children }: { alle: BrowseMaterial[] | null; fehler: boolean; children: () => React.ReactNode }) {
  if (fehler) {
    return <p className="font-sans text-body-s text-ink-700" role="alert">Die Materialien-Sammlung konnte nicht geladen werden. Bitte die Seite neu laden.</p>;
  }
  if (alle === null) return <p className="font-sans text-body-s text-ink-500" role="status">Die Sammlung wird abgerufen …</p>;
  return <>{children()}</>;
}

export function MaterialienBlatt() {
  const [alle, setAlle] = useState<BrowseMaterial[] | null>(null);
  const [fehler, setFehler] = useState(false);
  const [suche, setSuche] = useState('');
  const [gattung, setGattung] = useState<GattungWahl>('alle');
  const [behoerde, setBehoerde] = useState<BehoerdeId | ''>('');
  const [doktyp, setDoktyp] = useState<DoktypId | ''>('');
  const [portion, setPortion] = useState(PORTION);
  const ruhe = useBlattRuhe();

  useEffect(() => {
    if (!ruhe) return; // erst nach der Öffnungsbewegung (blattRuhe.ts)
    let lebt = true;
    ladeMaterialManifest().then((m) => {
      if (!lebt) return;
      if (!m) { setFehler(true); return; }
      setAlle(m.materialien);
    });
    return () => { lebt = false; };
  }, [ruhe]);

  const inGattung = useMemo(
    () => (alle ?? []).filter((m) => gattung === 'alle' || gattungVon(m.doktyp) === gattung), [alle, gattung]);
  const doktypOptionen = useMemo(() => vorhandeneDoktypen(inGattung), [inGattung]);
  // Behörden-Optionen: nur, wer in der gewählten Gattung Einträge führt (vor
  // dem Laden alle — dieselbe Liste wie bisher, das Menü steht nie leer).
  const behoerdeOptionen = useMemo(() => {
    if (!alle) return BEHOERDEN;
    const da = new Set(inGattung.map((m) => m.behoerde));
    return BEHOERDEN.filter((b) => da.has(b.id));
  }, [alle, inGattung]);
  const gefiltert = useMemo(() => {
    if (!alle) return [];
    return filtere(inGattung, { suche: suche || undefined, behoerde: behoerde || undefined, doktyp: doktyp || undefined });
  }, [alle, inGattung, suche, behoerde, doktyp]);

  // Gattungswechsel: eine gewählte Behörde/Art, die in der neuen Gattung nicht
  // vorkommt, fällt auf «Alle» zurück — sonst stünde ein Filter aktiv, den das
  // Menü gar nicht mehr anbietet (leere Liste ohne sichtbaren Grund, §8).
  const waehleGattung = (g: GattungWahl) => {
    setGattung(g);
    const passt = (m: BrowseMaterial) => g === 'alle' || gattungVon(m.doktyp) === g;
    if (behoerde && !(alle ?? []).some((m) => m.behoerde === behoerde && passt(m))) setBehoerde('');
    if (doktyp && (g !== 'alle' && gattungVon(doktyp) !== g)) setDoktyp('');
  };

  // Neuer Filter/Suchlauf: die Portion beginnt wieder vorn (kein «mehr»-Stand
  // aus der vorigen Treffermenge, der hier keine Bedeutung mehr hätte). Muster
  // wie `pages/Rechtsprechung.tsx::Liste` (`vorherListe`) — offizielles «adjust
  // state during render» statt `setState` im Effekt (kein Render-Nachlaufen).
  const filterSchluessel = `${suche}|${gattung}|${behoerde}|${doktyp}`;
  const [vorFilterSchluessel, setVorFilterSchluessel] = useState(filterSchluessel);
  if (vorFilterSchluessel !== filterSchluessel) { setVorFilterSchluessel(filterSchluessel); setPortion(PORTION); }

  return (
    <div className="space-y-4">
      <BlattSuchFeld wert={suche} setze={setSuche} label="Materialien durchsuchen"
        platzhalter="Titel, Nummer oder Behörde …" />
      <Tabs items={GATTUNG_WAHL} value={gattung} onChange={waehleGattung} groesse="s" mode="pressed"
        ariaLabel="Gattung" />
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex min-w-0 items-center gap-2 text-body-s text-ink-600">
          <span>Behörde</span>
          <select value={behoerde} onChange={(e) => setBehoerde(e.target.value as BehoerdeId | '')}
            className="lc-select lc-input-sm min-w-0 max-w-[13rem]">
            <option value="">Alle</option>
            {behoerdeOptionen.map((b) => <option key={b.id} value={b.id}>{b.kuerzel} — {b.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 items-center gap-2 text-body-s text-ink-600">
          <span>Art</span>
          <select value={doktyp} onChange={(e) => setDoktyp(e.target.value as DoktypId | '')}
            className="lc-select lc-input-sm min-w-0 max-w-[13rem]">
            <option value="">Alle</option>
            {doktypOptionen.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </label>
      </div>

      <Laedt alle={alle} fehler={fehler}>
        {() => (gefiltert.length === 0 ? (
          <p className="font-sans text-body-s text-ink-700" role="status">Kein Material gefunden.</p>
        ) : (
          <div className="space-y-3">
            <TrefferZahl n={gefiltert.length} einzahl="Dokument" mehrzahl="Dokumente" />
            <div className="divide-y divide-rule-soft border-y border-rule-soft">
              {gefiltert.slice(0, portion).map((m) => (
                <Link key={m.key} to={`/materialien/${encodeURIComponent(m.key)}`}
                  className={`${TREFFER_ZEILE_RAHMEN} px-1 py-2.5 no-underline lc-hover-flaeche`}>
                  <TrefferZeile
                    titel={m.titel}
                    untertitel={m.nummer ? `${m.doktypLabel} · ${m.nummer}` : m.doktypLabel}
                    meta={<StandChip stand={m.stand} />}
                    marke={gattung === 'alle'
                      ? <span data-gattung={gattungVon(m.doktyp)} className="text-micro text-ink-500">{GATTUNG_LABEL[gattungVon(m.doktyp)]}</span>
                      : undefined}
                  />
                </Link>
              ))}
            </div>
            {gefiltert.length > portion && (
              <WeitereKnopf rest={gefiltert.length - portion} mehr={() => setPortion((p) => p + PORTION)} />
            )}
          </div>
        ))}
      </Laedt>
    </div>
  );
}
