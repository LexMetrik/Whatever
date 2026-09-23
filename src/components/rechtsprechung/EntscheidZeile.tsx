import { Link } from 'react-router-dom';
import type { BrowseEntscheid } from '../../lib/rechtsprechung/register';
import { themaText, istSynth, istBetreff, istBge, hauptIdentitaet } from '../../lib/rechtsprechung/browse';
import { GEBIET_LABEL } from '../../lib/normtext/register';
import { NormChip } from './NormChip';
import { datumAnzeige, DATUM_UNBEKANNT_TITEL, spracheBadgeTitel } from './format';
import { StatusBadge } from '../verzahnung/StatusBadge';

// Kompakte Listen-Zeile (Default-Dichte). Bezeichnung führt mit dem THEMA/Leitsatz
// (Auftrag David: man soll schon sehen, worum es geht) — die BGE-Nummer steht als
// Identitäts-Anker rechts, das Datum ganz links. Darunter Rechtsgebiet + die in der
// Regeste genannten Normen als klickbare Chips. Fehlt die amtliche Regeste, zeigt die
// Bezeichnung die deterministische Synth-Zeile, ehrlich markiert (§8). Reine
// Darstellung (§3). Stretched-Link: ein absoluter Overlay-<Link> deckt die ganze
// Zeile ab (Navigation), Inhalt liegt als Geschwister darunter; die klickbaren
// Norm-Chips (NormChip = span role=button) stehen mit relative/z über dem Overlay
// — so ist KEIN fokussierbares Element ein Nachkomme des <a> (valides Markup).
// Werkbank K3 (23.9.2026): Zeile trägt ihre Haarlinie selbst (die Liste ist
// kein `lc-panel` mehr), Identität und Sachgebiet im Registerton «r», Hover
// = Fläche `--well` + unterstrichene Bezeichnung statt Messing.
export function EntscheidZeile({ e, onNorm }: {
  e: BrowseEntscheid;
  onNorm: (k: string) => void;
}) {
  const synth = istSynth(e);
  const verweis = e.verweis ?? null;
  const ziel = verweis
    ? `/rechtsprechung/${encodeURIComponent(verweis.zielKey)}?ansicht=voll`
    : `/rechtsprechung/${encodeURIComponent(e.key)}`;
  const bezeichnung = verweis ? `Vollständiges Urteil zu BGE ${verweis.bgeReferenz}` : themaText(e);
  return (
    <div className="group relative flex items-stretch gap-3 border-b border-rule-soft px-2 py-2.5 lc-hover-flaeche">
      {/* Overlay-Link über der ganzen Zeile (Navigation); Name = Bezeichnung.
          `data-quarantaene` sitzt HIER (nicht nur am Chip weiter unten) — dieser
          Link ist LEER (Stretched-Link-Muster), der Chip ist ein GESCHWISTER,
          kein Nachfahre; ein `:has([data-quarantaene])` auf dem <a> träfe sonst
          nie zu (Befund CI-Rot, PR #816, Browser-Smoke Shard 4/4). */}
      <Link to={ziel} aria-label={bezeichnung} className="absolute inset-0 no-underline" data-quarantaene={e.quarantaene} />

      {/* Ganz links — Entscheiddatum (feste Spalte, scanbare Kante). Platzhalter
          datumsloser Entscheide NIE als echtes Datum (§8/BS §7.2): «JJJJ, o. D.». */}
      <span className="num w-[5.25rem] shrink-0 pt-0.5 text-xs text-ink-500"
        title={e.datumUnbekannt ? DATUM_UNBEKANNT_TITEL : undefined}>
        {datumAnzeige(e.datum, e.datumUnbekannt)}
      </span>

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Bezeichnung — Thema/Leitsatz führt; BGE-Nummer als Identität rechtsbündig. */}
        <div className="flex items-baseline gap-3">
          {/* U3 (Prüfbefund W2·24-R5, 6.9.2026): `truncate` OHNE `title` — gemessen
              63 gekappte Bezeichnungen @1440 (scrollWidth 1006 gegen clientWidth
              596) und 325 @390 (bis 360/132, also ~37 % sichtbar). Der volle
              Wortlaut war weder per Hover noch im A11y-Baum erreichbar. Das
              Muster steht eine Zeile darüber am `datumUnbekannt`-Titel; hier
              fehlte es. Reine Ergänzung, kein Layout-Eingriff. */}
          <span title={bezeichnung}
            className={`min-w-0 flex-1 truncate text-body-s ${synth ? 'text-ink-700' : 'font-medium text-ink-900'} underline-offset-2 group-hover:underline`}>
            {bezeichnung}
          </span>
          {/* R8 (7.9.2026) · EINE IDENTITAET, DIE NICHT MEHR IN DIE ZEILE PASST.
              `shrink-0` haelt die Kennung vollstaendig — richtig, solange sie
              EINE Geschaeftsnummer ist. Traegt ein Entscheid deren mehrere
              («S2024_005, S2024_006, S2024_007 …»), wuchs der Kasten auf 197 px
              und wurde vom `overflow-hidden` des `lc-panel` glatt abgeschnitten:
              gemessen /rechtsprechung @320, Panel 280 px, Inhalt 321 px — die
              letzten 41 px waren weder sichtbar noch erreichbar (§8).
              `max-w`-Anteil + `truncate` + `title` loest beides: kurze Kennungen
              stehen unveraendert voll da (sie bleiben unter dem Anteil), lange
              kuerzen sichtbar per Ellipse und geben den vollen Wortlaut per
              Hover und im A11y-Baum her. Ein Anteil statt einer Pixelzahl,
              damit die Regel ueber alle Viewports gilt. */}
          <span title={hauptIdentitaet(e)}
            className={`num shrink-0 max-w-[60%] truncate text-xs ${istBge(e) ? 'font-medium text-reg-r' : 'text-ink-500'}`}>
            {hauptIdentitaet(e)}
          </span>
        </div>

        {/* Metazeile — Rechtsgebiet, Status, angewandte Normen (klickbar). Chips
            mit relative/z über dem Overlay-Link, damit sie klickbar bleiben. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
          <span className="text-reg-r" title={e.kuratierung === 'maschinell' ? 'Sachgebiet maschinell zugeordnet' : undefined}>{GEBIET_LABEL[e.sachgebiet]}</span>
          {/* D3 (Gegenprüfungs-Auflage 12.9.2026, PR #816): siehe EntscheidKarte.tsx. */}
          {e.quarantaene && (
            <span className="text-micro italic text-ink-500" data-quarantaene={e.quarantaene}
              title="Der amtliche Volltext ist in der Quelle mit einem anderen Entscheid vermischt">Volltext nicht verfügbar</span>
          )}
          {synth && <span className="text-micro italic text-ink-500">ohne amtl. Regeste</span>}
          {/* §8-Ehrlichkeit (Block-B-Kontrakt): die Bezeichnung ist der amtliche
              Betreff der Trefferliste, KEINE Regeste — offen etikettieren. */}
          {istBetreff(e) && (
            <span className="text-micro italic text-ink-500"
              title="Betreff/Titel aus dem amtlichen Portal — keine Regeste">amtl. Betreff</span>
          )}
          {e.kuratierung === 'maschinell' && <StatusBadge praedikat="maschinell" />}
          {e.sprache !== 'de' && <span className="lc-badge lc-badge-soft" title={spracheBadgeTitel(e.sprache)}>{e.sprache}</span>}
          {/* lc-chip-zeile (LM-044/N1): Aktions-Form an der ROLLE (span[role=button]),
              gleiche Grammatik wie in der Karten-Ansicht und der Filterleiste (§23).
              C3 (5.9.2026, R6-C): `z-10` → `z-sticky` (Schichtungs-Skala,
              index.css), Wert unverändert (10), nur benannt. */}
          {/* ── GB-12/13 (W2·24, Befunde G12/G13, 7.9.2026) · KLARTEXT STATT KASTEN
              GEMESSEN: 12 gerahmte Chips im ersten Bild von /rechtsprechung, im
              DOM 847 `span.lc-chip` + 392 `span.lc-badge` (davon 53 versale
              Sprach-Etiketten «fr»/«it»). Den Rahmen setzt die Chip-Grammatik
              der KOPF-Metazeilen (`.lc-chip-zeile`, index.css): dort stehen drei
              Element-Arten nebeneinander und die Form muss sie trennen (LM-044)
              — in der Trefferliste steht nur EINE Art, 847-fach; dort trennt die
              Form nichts, sie rahmt nur (F0.6 «Linien statt Flächen»).
              `lc-normzeile` steht NEBEN `lc-chip-zeile`, nicht statt ihr: die
              Link-/Knopf-Grammatik bleibt gültig, GB-12 nimmt ihr nur den
              Kasten (Rezept + Kontrastnachweis: index.css §GB-12).
              Das `uppercase` am Sprach-Badge ist ersatzlos weg (F0.7); die
              Regel steht seit GB-13 EINMAL an `.lc-badge`, der volle Sprachname
              bleibt im `title` (§8). */}
          {e.normKeys.length > 0 && (
            <span className="lc-chip-zeile lc-normzeile relative z-sticky flex flex-wrap items-center gap-x-2 gap-y-1">
              {e.normKeys.slice(0, 5).map((k) => <NormChip key={k} normKey={k} onWaehle={onNorm} />)}
              {/* LM-049 (gleiche Formensprache wie die Karte): Zähler, nicht
                  Bedienelement — «+3 weitere» statt nackter «+3». */}
              {e.normKeys.length > 5 && (
                <span className="text-micro text-ink-500">
                  <span className="num">+{e.normKeys.length - 5}</span> weitere
                </span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
