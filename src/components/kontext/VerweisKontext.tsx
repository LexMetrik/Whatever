import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { kontextFuerArtikel, type ArtikelKontext } from '../../lib/kontext';
import { KontextGruppe } from './KontextPanel';
import { StatusBadge } from '../verzahnung/StatusBadge';
import { Datum } from '../ui/Datum';

// ─── VerweisKontext — artikelscharfe Verzahnung im Verweis-Popover ───────────
//
// W2·5d U-VERWEIS/A7 (David 5.7.2026): «die verweise wenn angeklickt sollen
// übersichtlicher dargestellt sein. also unter den relevanten artikel jeweils
// die massgeblichen entscheide sowie übersichtlich abgetrennt die relevanten
// materialien.» — Dieses Panel hängt im NormPopover UNTER dem Artikel-Wortlaut
// (+ Provenienz-Fuss) und zeigt kompakt (Top-n + Zähler):
//   (1) massgebliche Entscheide (Leitfall-Shard, DIESELBE Quelle wie der
//       Artikel-Fuss des Readers — kein neuer Datenpfad, §5),
//   (2) klar abgetrennt die artikelscharfen amtlichen Materialien (Kanten-Shard,
//       dieselbe Quelle wie das Kontext-Panel), mit Behörden-Kürzel,
//       Fundstellen-Ziffer und Dokument-Stand (A13).
// Bestehende Verzahnungs-Grammatik WIEDERVERWENDET (KontextGruppe-Hülle,
// StatusBadge-Vokabular, Richtungs-Labels als Text) — kein Neubau.
//
// Lazy + CLS 0 by construction (§15.2/3): das Panel wird ans ENDE des Popovers
// angehängt (nach dem Fuss) — sein Einwachsen verschiebt keinen sichtbaren
// Inhalt darüber; die Shard-Promise-Caches werden mit dem Reader geteilt
// (kein Doppel-Fetch). Leerzustand: nichts rendern (ruhig, §13/F4).

const MAX_ZEILEN = 3;

// B-3/B3-7 (R3-α, 31.8.2026): hier stand `kurzDatum` — der letzte Zwilling von
// `datumCh` (byte-gleiche Regex, byte-gleiche Rückgabe) und dazu das `num` an
// der Zeile unten, das das Datum in die Mono-Stimme setzte. Die Mono-Stimme ist
// seit S2/Ä-(b) auf SR-Nr./Aktenzeichen begrenzt — DATEN gehören nicht dazu.
// Beides erledigt jetzt der EINE Baustein `ui/Datum` (Format + Auszeichnung
// gehören zusammen, sonst laufen sie wieder auseinander).

export function VerweisKontext({ erlassKey, artikel, artikelZitat }: {
  /** Register-key des Erlasses ('MWSTG', 'AR-621.12') — Shard-Namensraum. */
  erlassKey: string;
  /** Korpus-Artikel-Token ('5', '20_a'). */
  artikel: string;
  /** Voll zitierfähige Norm («Art. 5 MWSTG») für den Fundstellen-Sprung (?norm=). */
  artikelZitat: string;
}) {
  // Ergebnis trägt seinen eigenen Key → Zustand abgeleitet, kein synchrones
  // setState im Effekt-Body (Repo-Muster wie KontextPanel, §6.4).
  const key = `${erlassKey}/${artikel}`;
  const [geladen, setGeladen] = useState<{ key: string; ctx: ArtikelKontext } | null>(null);
  useEffect(() => {
    let lebt = true;
    kontextFuerArtikel(erlassKey, artikel).then((ctx) => { if (lebt) setGeladen({ key, ctx }); });
    return () => { lebt = false; };
  }, [erlassKey, artikel, key]);
  const ctx = geladen && geladen.key === key ? geladen.ctx : null;
  if (!ctx || (ctx.entscheide.length === 0 && ctx.materialien.length === 0)) return null;

  const entscheide = ctx.entscheide.slice(0, MAX_ZEILEN);
  const restE = ctx.entscheide.length - entscheide.length;
  const materialien = ctx.materialien.slice(0, MAX_ZEILEN);
  const restM = ctx.materialien.length - materialien.length;

  return (
    <div className="border-t border-rule-struktur px-5 py-3 space-y-4">
      {ctx.entscheide.length > 0 && (
        <KontextGruppe titel="Massgebliche Entscheide" richtung="Wird zitiert von" punkt="entscheid" anzahl={ctx.entscheide.length}>
          <ul className="flex flex-col gap-1">
            {entscheide.map((r) => (
              <li key={r.key} className="text-body-s">
                <Link
                  to={`/rechtsprechung/${encodeURIComponent(r.key)}?norm=${encodeURIComponent(artikelZitat)}`}
                  className="no-underline hover:text-brass-700"
                >
                  <span className="font-medium">{r.zitierung}</span>
                  {r.leitcharakter === 'leitentscheid' && (
                    <StatusBadge praedikat="leitentscheid" variant="glyph" className="ml-1.5" />
                  )}
                  {r.regesteKurz && <span className="text-ink-500"> — {r.regesteKurz}</span>}
                </Link>
              </li>
            ))}
          </ul>
          {restE > 0 && (
            <Link to={`/rechtsprechung?norm=${encodeURIComponent(erlassKey)}`} className="text-body-s lc-link text-brass-700 hover:text-brass-800">
              Alle <span className="num">{ctx.entscheide.length}</span> erfassten Entscheide ansehen →
            </Link>
          )}
        </KontextGruppe>
      )}
      {ctx.materialien.length > 0 && (
        <KontextGruppe titel="Amtliche Materialien" richtung="Legt aus" punkt="material" anzahl={ctx.materialien.length}>
          <ul className="flex flex-col gap-1">
            {materialien.map((m) => (
              <li key={m.key} className="text-body-s">
                <Link to={m.pfad} className="no-underline hover:text-brass-700">
                  <span className="text-ink-500">{m.behoerdeKuerzel} · {m.doktypLabel}{m.nummer ? ` ${m.nummer}` : ''}</span>
                  {' — '}<span className="font-medium">{m.titel}</span>
                  {m.sublabel && <span className="num text-micro font-normal text-ink-500"> · {m.sublabel}</span>}
                  <span className="text-micro text-ink-500"> · Stand <Datum iso={m.stand} /></span>
                  {m.herkunft === 'maschinell' && (
                    <StatusBadge praedikat="maschinell" className="ml-1.5 align-middle" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {restM > 0 && (
            <Link to="/materialien" className="text-body-s lc-link text-brass-700 hover:text-brass-800">
              Noch <span className="num">{restM}</span> weitere · alle Materialien ansehen →
            </Link>
          )}
        </KontextGruppe>
      )}
    </div>
  );
}
