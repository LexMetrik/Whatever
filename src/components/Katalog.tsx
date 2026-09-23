import { Link, useSearchParams } from 'react-router-dom';
import { RECHTSGEBIETE, VORLAGE_SEKTIONEN, istVerfuegbar, istAktiv, type CalculatorCard, type VorlageCard } from '../lib/startseiteConfig';
import { EINGABE_RUBRIKEN, VERTRAG_RUBRIKEN, istVorlage } from '../lib/vorlagenKategorie';
import { GEBUEHREN_RUBRIKEN, gebuehrenRubrik, type GebuehrenRubrik } from '../lib/gebuehrenKategorie';
import { type Oberkategorie } from '../lib/oberkategorien';
import { praxisRang } from '../lib/praxisRang';
import { FRISTEN_HAUPTEINSTIEGE, FRISTEN_PROZESSUAL, FRISTEN_MATERIELL, fristenEinstiegArt, type FristenRegimeZeile as FristenRegimeZeileDef } from '../lib/fristenKategorie';
import { ZUSTAENDIGKEIT_FELDER, ZUSTAENDIGKEIT_FELD_IDS } from '../lib/zustaendigkeitKategorie';
import { kartePasst, LEERER_FILTER } from '../lib/katalogSuche';
import { sansAmp } from './typografie';
import { GruppenKopf } from './ui/GruppenKopf';
import { TrefferZeile, TREFFER_ZEILE_RAHMEN } from './ui/TrefferZeile';
import { Leerzustand } from './ui/Leerzustand';

// Register-Bausteine der Rubrik-Übersichten /rechner + /vorlagen (Auftrag
// David 10.6.2026): eine Oberkategorie = eine vollständige Sektion
// (`KategorieSektion`). Leitsätze: Klicktiefe 1 (verfügbare Werkzeuge direkt
// als Link-Zeile), Praxis-Rang vor Gebiet (lib/praxisRang.ts, Rechtsgebiet als
// Sub-Label), ehrlich ohne Ballast (§8: Geplantes hinter «In Vorbereitung (N)»,
// Entwurf-Marke an jeder Zeile). Zuordnung: lib/katalogKategorie.ts (§3/§5).
//
// W2·29-WERKBANK-KATALOGE K4 (23.9.2026, Boards «Unter-Rechner-Katalog»/
// «Unter-Vorlagen»): ZEILEN STATT KARTEN. Die Zeile ist ein Streifen mit
// Haarlinie oben (`.kt-zeile`, index.css) im Raster `.kt-raster`; die
// verlinkte trägt vor dem Titel den 3-px-Strich im Register der Route — die
// geplante nicht (sie ist kein Werkzeug, §8). Der Sektionskopf trägt den
// 2-px-Registerstrich des Titelblatt-Bands (`.kt-kopf`). Messing entfällt.

/** Raster der Zeilen — EINE Stelle statt sieben gleicher Klassenketten. */
const RASTER = 'kt-raster';

// ─── Werkzeug-Zeile: Direktlink (Klicktiefe 1); Status ehrlich als Badge ────
//  zeigeGeplant – «In Vorbereitung»-Marke mitzeigen (sonst nur Entwurf).
// Die Anatomie (Titel/Untertitel/Marke/Pfeil) kommt aus `ui/TrefferZeile`
// (C-4); hier stehen nur der Behälter und die Statuslogik.
function ListenZeile({ k, subLabel, zeigeGeplant }: { k: CalculatorCard; subLabel?: string; zeigeGeplant?: boolean }) {
  const aktiv = istAktiv(k.status) && !!k.href;
  const inhalt = (
    <TrefferZeile
      titel={sansAmp(k.title)}
      untertitel={subLabel ? sansAmp(subLabel) : undefined}
      pfeil={aktiv ? '→' : null}
      marke={(k.status === 'entwurf' || (zeigeGeplant && k.status === 'geplant')) ? (
        <>
          {k.status === 'entwurf' && (
            <span className="lc-badge-entwurf" title="erstellt, fachlich noch nicht geprüft">Entwurf</span>
          )}
          {zeigeGeplant && k.status === 'geplant' && (
            <span className="lc-badge-geplant">In Vorbereitung</span>
          )}
        </>
      ) : undefined}
    />
  );
  // Hover: die EINE neutrale Zeilen-Fläche (R5-D, `.lc-hover-flaeche`) — nur
  // an der verlinkten Zeile; die geplante bleibt still (kein Ziel, §8).
  const klasse = `kt-zeile ${TREFFER_ZEILE_RAHMEN}`;
  return aktiv ? (
    <Link to={k.href!} className={`${klasse} lc-hover-flaeche`}>{inhalt}</Link>
  ) : (
    <div className={klasse}>{inhalt}</div>
  );
}

// ─── Fristen-Register (S-5b FAHRPLAN-STRUKTUR-UMBAU) ────────────────────────
//
// Haupteinstieg Tagerechner (simpler Fristenrechner zuoberst, S-5a),
// darunter ZWEI Rubriken nach Davids Wortlaut (10.6.2026 abends):
// «Prozessuale Fristen» (eigenes Stillstands-Regime: ZPO · SchKG) und
// «Materielle Fristen» (Verjährung, 336c, Kündigungstermine, Rüge,
// Erbrecht), je mit Ein-Satz-WARUM. Daten/Texte: lib/fristenKategorie.ts
// (fachliche Aussagen, Abnahme David offen).

// K4: der Haupteinstieg ist eine breite Zeile (`.kt-haupt`, Registerstrich
// links), keine Kachel — der Untertitel läuft ungekappt (§8, anders als die
// TrefferZeile mit ihrer Zwei-Zeilen-Kappung).
function FristenHauptKarte({ k, untertitel }: { k: CalculatorCard; untertitel: string }) {
  return (
    <Link to={k.href!} className="kt-haupt lc-hover-flaeche group flex min-w-0 flex-col gap-1 no-underline">
      <span className="flex items-baseline gap-3">
        <span className="font-sans font-semibold text-ink-900 text-h3 leading-snug underline-offset-4 group-hover:underline">{sansAmp(k.title)}</span>
        {k.status === 'entwurf' && (
          <span className="lc-badge-entwurf" title="erstellt, fachlich noch nicht geprüft">Entwurf</span>
        )}
        <span aria-hidden className="ml-auto text-ink-500 leading-none">→</span>
      </span>
      <span className="text-body-s text-ink-600 leading-relaxed">{untertitel}</span>
    </Link>
  );
}

function FristenRegister({ karten }: { karten: CalculatorCard[] }) {
  const byId = new Map(karten.map((k) => [k.id, k]));
  const haupt = FRISTEN_HAUPTEINSTIEGE
    .map((h) => ({ ...h, k: byId.get(h.id) }))
    .filter((h): h is typeof h & { k: CalculatorCard } => !!h.k && istVerfuegbar(h.k) && !!h.k.href);
  const zeilenFuer = (defs: FristenRegimeZeileDef[]) => defs
    .map((r) => ({ ...r, k: byId.get(r.id) }))
    .filter((r): r is typeof r & { k: CalculatorCard } => !!r.k && istVerfuegbar(r.k));
  const prozessual = zeilenFuer(FRISTEN_PROZESSUAL);
  const materiell = zeilenFuer(FRISTEN_MATERIELL);
  // Ehrlicher Fallback: verfügbare Fristen-Karten ohne Zuordnung erscheinen
  // als Zeile ohne WARUM-Satz unter «Materiell» (der Test bricht zusätzlich).
  const unzugeordnet = karten.filter((k) => istVerfuegbar(k) && fristenEinstiegArt(k.id) === null);

  const rubrik = (titel: string, lede: string, zeilen: ReturnType<typeof zeilenFuer>, extra: CalculatorCard[] = []) => (
    (zeilen.length > 0 || extra.length > 0) && (
      <div className="space-y-2">
        <GruppenKopf titel={titel} />
        <p className="text-body-s text-ink-500 max-w-reading">{lede}</p>
        <div className={RASTER}>
          {zeilen.map((r) => <ListenZeile key={r.id} k={r.k} subLabel={r.warum ?? r.k.rechtsgebiet} />)}
          {extra.map((k) => <ListenZeile key={k.id} k={k} subLabel={k.rechtsgebiet} />)}
        </div>
      </div>
    )
  );

  return (
    <div className="space-y-5">
      {/* W2·10-UI-NAV/N0d·W4: Kopf «Fristen berechnen» nur, wenn Haupteinstiege
          vorhanden sind — bei aktivem Übersichts-Filter sonst leerer Kopf. */}
      {haupt.length > 0 && (
        <div className="space-y-2">
          <GruppenKopf titel="Fristen berechnen" />
          {haupt.map((h) => <FristenHauptKarte key={h.id} k={h.k} untertitel={h.untertitel} />)}
        </div>
      )}
      {rubrik('Prozessuale Fristen',
        'Fristen im Verfahren mit eigenem Stillstands-Regime – Gerichtsferien (ZPO) bzw. Betreibungsferien (SchKG).',
        prozessual)}
      {rubrik('Materielle Fristen',
        'Fristen des materiellen Rechts – eigene Regimes ohne Gerichtsferien; der Grund steht an jeder Zeile.',
        materiell, unzugeordnet)}
    </div>
  );
}

// ─── Zuständigkeits-Register (S-3 FAHRPLAN-STRUKTUR-UMBAU) ──────────────────
//
// Vier feste Rechtsweg-Felder (Zivilprozess · Vollstreckung · Strafverfahren
// · Verwaltungsverfahren, Auftrag David 10.6.2026 abends) zuoberst — auch
// das geplante Verwaltungs-Feld ist SICHTBAR (ehrlich «In Vorbereitung»,
// §8) statt in der Aufklappzeile versteckt. Weitere zuordnung-Karten
// erscheinen darunter wie gehabt.

function ZustaendigkeitRegister({ karten }: { karten: CalculatorCard[] }) {
  const byId = new Map(karten.map((k) => [k.id, k]));
  const felder = ZUSTAENDIGKEIT_FELDER
    .map((f) => ({ ...f, k: byId.get(f.id) }))
    .filter((f): f is typeof f & { k: CalculatorCard } => !!f.k);
  const weitere = karten.filter((k) => istVerfuegbar(k) && !ZUSTAENDIGKEIT_FELD_IDS.has(k.id));

  return (
    <div className="space-y-5">
      {/* W2·10-UI-NAV/N0d·W4: Kopf «Rechtswege» nur bei vorhandenen Feldern
          (bei aktivem Übersichts-Filter sonst leerer Kopf). */}
      {felder.length > 0 && (
        <div className="space-y-2">
          <GruppenKopf titel="Rechtswege" />
          <div className={RASTER}>
            {felder.map((f) => <ListenZeile key={f.id} k={f.k} subLabel={f.untertitel} zeigeGeplant />)}
          </div>
        </div>
      )}
      {weitere.length > 0 && (
        <div className="space-y-2">
          {/* C-7 (31.8.2026): «(n)» → nackte Zahl (Kanon 12:6:4:2). */}
          <GruppenKopf titel="Weitere Werkzeuge" zahl={weitere.length} />
          <div className={RASTER}>
            {weitere.map((k) => <ListenZeile key={k.id} k={k} subLabel={k.rechtsgebiet} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Gebühren-Register (S-6 FAHRPLAN-STRUKTUR-UMBAU) ────────────────────────
//
// Zwei Rubriken (prozessual/materiell, Auftrag David 10.6.2026 abends) +
// Hilfsrechner; innerhalb der Rubrik Alltag (Praxis-Rang 1) zuerst, dann
// feste Gebiets-Reihenfolge.

function GebuehrenRegister({ karten, sortiert }: {
  karten: CalculatorCard[]; sortiert: (xs: CalculatorCard[]) => CalculatorCard[];
}) {
  const verfuegbarAlle = karten.filter(istVerfuegbar);
  const inRubrik = (r: GebuehrenRubrik) => {
    const xs = verfuegbarAlle.filter((k) => gebuehrenRubrik(k.id) === r);
    return [...sortiert(xs.filter((k) => praxisRang(k.id) === 1)),
      ...sortiert(xs.filter((k) => praxisRang(k.id) !== 1))];
  };
  return (
    <div className="space-y-6">
      {GEBUEHREN_RUBRIKEN.map((r) => {
        const xs = inRubrik(r.id);
        if (xs.length === 0) return null;
        return (
          <div key={r.id} className="space-y-2">
            <GruppenKopf titel={r.titel} zahl={xs.length} />
            <p className="text-body-s text-ink-500 max-w-reading">{r.lede}</p>
            <div className={RASTER}>
              {xs.map((k) => <ListenZeile key={k.id} k={k} subLabel={k.rechtsgebiet} />)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Vorlagen-Register (S-2 FAHRPLAN-STRUKTUR-UMBAU) ────────────────────────
//
// Fünf Dokument-Gruppen nach Davids Wortlaut (10.6.2026 abends):
// Behördeneingaben (dreigliedrig: Klagen allgemein · Klagen besondere
// Verfahren [nach Klage-Gebiet] · Gesuche & sonstige Eingaben) · Verträge ·
// Einseitige Willenserklärungen · Gesellschaftsrecht · Vorsorge & Nachlass.
// Geplante Vorlagen stehen je Gruppe als gedämpfte Ein-Zeilen-Liste (ehrliche
// Struktur-Sicht §8, ohne die Ansicht zu fluten).

// Vorlagen-Register (Redesign 24.6.2026, Auftrag David «Übersicht entschlacken»):
// Nur EINSATZBEREITE Vorlagen im Hauptbereich; alle geplanten wandern in den
// gemeinsamen «In Vorbereitung»-Block unten (KategorieSektion). Flache
// Unterrubriken (ohne Einrück-Borte), keine Form-Gate-Sub-Labels mehr (die
// Form-Grenzen stehen auf der Vorlage selbst, §8) — ruhigere, scanbarere Wand.
function VorlagenRegister({ karten }: { karten: CalculatorCard[] }) {
  const vorlagen = karten.filter(istVorlage).filter(istVerfuegbar);
  const proGruppe = VORLAGE_SEKTIONEN
    .map((s) => ({ s, verf: vorlagen.filter((v) => v.art === s.art) }))
    .filter((g) => g.verf.length > 0);

  const zeilen = (xs: VorlageCard[], subLabel?: (v: VorlageCard) => string | undefined) => (
    <div className={RASTER}>
      {xs.map((v) => <ListenZeile key={v.id} k={v} subLabel={subLabel?.(v) ?? v.rechtsgebiet} />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {proGruppe.map(({ s, verf }) => (
        /* id-Anker «vorlage-<id>»: Sprungziel der Seitenleisten-Vorlagen-
           Untergruppen (navigation.ts → ScrollZuHash). */
        <div key={s.id} id={`vorlage-${s.id}`} className="space-y-2 scroll-mt-24">
          <GruppenKopf titel={s.title} zahl={verf.length} />
          <p className="text-body-s text-ink-500 max-w-reading">{s.lede}</p>
          {s.art === 'eingabe' ? (
            /* Behördeneingaben: drei Unterrubriken, flach (ohne Einrück-Borte). */
            <div className="space-y-3">
              {EINGABE_RUBRIKEN.map((r) => {
                const rVerf = verf.filter((v) => v.eingabeRubrik === r.id);
                if (rVerf.length === 0) return null;
                return (
                  <div key={r.id} className="space-y-2">
                    <h4 className="lc-overline">{r.titel}</h4>
                    {zeilen(rVerf, (v) => v.klageGebiet ?? v.rechtsgebiet)}
                  </div>
                );
              })}
            </div>
          ) : s.art === 'vertrag' ? (
            /* Verträge-Rubriken, flach; ab >6 Karten klappt die Rubrik ein. */
            <div className="space-y-3">
              {VERTRAG_RUBRIKEN.map((r) => {
                const rVerf = verf.filter((v) => v.vertragRubrik === r.id);
                if (rVerf.length === 0) return null;
                return (
                  <div key={r.id} className="space-y-2">
                    {rVerf.length > 6 ? (
                      /* LM-060-Klasse (B15, 4.9.2026): hier standen ZWEI
                          Klappmarken — dieses vorangestellte ▸ UND das «▸» der
                          App-weiten `details > summary::after`-Regel, das
                          `list-none` nicht abschaltet (gemessen auf `/vorlagen`
                          an der Schwester-Stelle «In Vorbereitung (44)»). Das
                          eigene Zeichen fällt weg; das EINE Zeichen kommt aus
                          der geteilten Regel, dort rechtsbündig und drehend.
                          `group` trug nur noch dessen Drehung und geht mit. */
                      <details className="space-y-2">
                        <summary className="cursor-pointer select-none">
                          <h4 className="lc-overline inline">
                            {r.titel} <span className="num text-ink-500">{rVerf.length}</span>
                          </h4>
                        </summary>
                        {zeilen(rVerf)}
                      </details>
                    ) : (
                      <>
                        <h4 className="lc-overline">{r.titel}</h4>
                        {zeilen(rVerf)}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            zeilen(verf)
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Registerteil: eine Oberkategorie mit Gebiets-Gruppen + Geplant-Zeile ───

export function KategorieSektion({ kat, karten, ohneKopf, alleOffen }: { kat: Oberkategorie; karten: CalculatorCard[]; ohneKopf?: boolean; alleOffen?: boolean }) {
  const [params, setParams] = useSearchParams();
  // Übersichtlichkeits-Politur (Auftrag David 10.6.2026): ZWEI ruhige
  // Gebrauchs-Ebenen statt einer Mischliste — «Alltag» (Praxis-Rang 1)
  // zuoberst, «Weitere Werkzeuge» darunter; innerhalb der Ebene die feste
  // Gebiets-Reihenfolge, Rechtsgebiet als Sub-Label in der Zeile.
  const gebietsRang = (g: string) => { const i = RECHTSGEBIETE.indexOf(g); return i === -1 ? RECHTSGEBIETE.length : i; };
  const sortiert = (xs: CalculatorCard[]) => [...xs].sort((a, b) =>
    gebietsRang(a.rechtsgebiet) - gebietsRang(b.rechtsgebiet) ||
    a.title.localeCompare(b.title, 'de'));

  // Rechtsgebiet-Filter + Status-Schnitt (Redesign E4) — verdrahtet die bereits
  // vorhandene, getestete kartePasst-Logik (vorher mit leeren Sets aufgerufen,
  // also faktisch tot). NUR in der Vorlagen-Kategorie, der einzigen «Wand»;
  // teilbar über die URL (?rg=, ?status=). Reines Filtern, keine Logik berührt.
  const filterAktiv = kat.id === 'vorlagen';
  const rgRoh = params.get('rg') ?? '';
  const aktiveGebiete = new Set(rgRoh ? rgRoh.split(',').filter(Boolean) : []);
  const nurVerfuegbar = params.get('status') === 'verfuegbar';
  const gefiltert = filterAktiv
    ? karten.filter((k) => kartePasst(k, { ...LEERER_FILTER, gebiete: aktiveGebiete, nurVerfuegbar }))
    : karten;
  const vorhandeneGebiete = filterAktiv
    ? [...new Set(karten.filter(istVorlage).map((k) => k.rechtsgebiet))]
        .sort((a, b) => gebietsRang(a) - gebietsRang(b) || a.localeCompare(b, 'de'))
    : [];
  const setzeFilter = (rg: Set<string>, nv: boolean) => {
    const p = new URLSearchParams(params);
    if (rg.size > 0) p.set('rg', [...rg].join(',')); else p.delete('rg');
    if (nv) p.set('status', 'verfuegbar'); else p.delete('status');
    setParams(p, { replace: true });
  };
  const verfuegbarAlle = gefiltert.filter(istVerfuegbar);
  const alltag = sortiert(verfuegbarAlle.filter((k) => praxisRang(k.id) === 1));
  const weitere = sortiert(verfuegbarAlle.filter((k) => praxisRang(k.id) !== 1));
  const verfuegbar = [...alltag, ...weitere];
  // Geplante Karten, die bereits im Register sichtbar sind (S-3:
  // Verwaltungs-Zuständigkeit; S-2: Vorlagen je Gruppe), erscheinen nicht
  // zusätzlich in der «In Vorbereitung»-Aufklappzeile. Bug-Check §9
  // 10.6.2026 (Code-Lupe, MITTEL): in der Vorlagen-Kategorie nur ECHTE
  // Vorlagen ausnehmen — geplante Werkzeug-Karten (checklisten,
  // mandatsaufnahme) zeigt das VorlagenRegister nicht, sie müssen hier
  // sichtbar bleiben (Kachel-Zähler = Ansicht, §8).
  // Redesign 24.6.2026: in der Vorlagen-Kategorie wandern ALLE geplanten Vorlagen
  // (nicht mehr je Gruppe gestreut) in DIESEN gemeinsamen «In Vorbereitung»-Block.
  const geplant = gefiltert.filter((k) => !istVerfuegbar(k)
    && !(kat.id === 'zustaendigkeiten' && ZUSTAENDIGKEIT_FELD_IDS.has(k.id)));

  return (
    <section id={`register-${kat.id}`}
      aria-label={ohneKopf ? kat.titel : undefined}
      aria-labelledby={ohneKopf ? undefined : `register-titel-${kat.id}`}
      className="space-y-4 scroll-mt-28">
      {/* Eigener Kopf nur, wenn die Seite nicht schon einen trägt (ohneKopf=true
          auf /vorlagen: der SeitenKopf führt bereits Titel + Intro → kein Doppelkopf). */}
      {!ohneKopf && (
        <div className="kt-kopf space-y-1.5">
          {/* C-7-AUSNAHME, bewusst NICHT auf `GruppenKopf`/nackte Zahl gezogen
              (31.8.2026): Dies ist der SEKTIONS-Kopf einer Kategorie, kein
              Gruppenkopf — die Sektion darunter enthält neben den `verfuegbar`-
              Zeilen zusätzlich den «In Vorbereitung»-Block. Eine nackte Zahl
              würde hier also nicht die Einträge der Sektion zählen, sondern
              eine falsche Aussage über deren Umfang machen. «verfügbar» ist an
              dieser Stelle ein Ehrlichkeitswort (§8), keine Schreibvariante des
              Zählers — es bleibt. Ebenso die Sans-Stimme: ein Kategorie-Kopf
              ist die Seiten-Überschrift, kein Struktur-Etikett (§G-e).
              K4: die Zahl in Tinte statt Messing; die Registerkante trägt
              `.kt-kopf` (2-px-Strich oben). */}
          <div className="flex items-baseline gap-4">
            <h2 id={`register-titel-${kat.id}`} className="whitespace-nowrap">
              <span className="font-sans font-semibold text-ink-900 text-h3 tracking-tight">{kat.titel}</span>
            </h2>
            <span aria-hidden className="flex-1 h-px bg-line" />
            <span className="lc-overline num whitespace-nowrap">
              <span className="text-ink-900">{verfuegbar.length}</span> verfügbar
            </span>
          </div>
          <p className="text-body-s text-ink-500 max-w-reading">{kat.lede}</p>
        </div>
      )}

      {/* Rechtsgebiet-Filter (Redesign 24.6.2026): EIN Dropdown statt ~14 Pillen —
          macht die Vorlagen-«Wand» scanbar; die Auswahl engt alle Gruppen live ein.
          Die «Nur verfügbare»-Pille entfällt: der Hauptbereich zeigt ohnehin nur
          Einsatzbereite, Geplantes liegt im Sammelblock unten.
          ── D22 Ziff. 2 (Nachzug D24, 6.9.2026) · DIE HÜLLE DER FILTERZEILE ───
          R12A §4 hatte /vorlagen ausdrücklich offengelassen. Die Zeile trägt
          jetzt dieselbe Anatomie wie /gesetze, /materialien und /rechner:
          sichtbares Label «Filtern» über dem Feld (`.ub-filter`), Feld über die
          Inhaltsbreite, Umfang und Zähler in der Fuss-Zeile (`.ub-filter-fuss`,
          per `aria-describedby` verknüpft) — statt einer halbleeren Flex-Zeile
          mit inline-Etikett.
          BEWUSST KEIN Text-Schalter je Facette: die Achse führt ~14
          Rechtsgebiete. Dieselbe Begründung wie bei den Materialien-Facetten in
          R12A — ein Schalter je Wert wäre genau die Wand, die D22 abräumt.
          Das <select> bleibt, es bekommt nur die Hülle. */}
      {filterAktiv && vorhandeneGebiete.length > 1 && (
        <div className="ub-filter" role="group" aria-label="Vorlagen nach Rechtsgebiet filtern">
          <label htmlFor={`vorlagen-filter-${kat.id}`} className="lc-overline">Filtern</label>
          <select id={`vorlagen-filter-${kat.id}`}
            value={[...aktiveGebiete][0] ?? ''}
            onChange={(e) => setzeFilter(e.target.value ? new Set([e.target.value]) : new Set(), false)}
            aria-describedby={`vorlagen-filter-scope-${kat.id}`}
            className="lc-select h-11 py-0 text-body-s w-full">
            <option value="">Alle Rechtsgebiete</option>
            {vorhandeneGebiete.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <p id={`vorlagen-filter-scope-${kat.id}`} className="ub-filter-fuss min-h-5">
            <span>Rechtsgebiet dieser Vorlagen · Gesetzes- und Entscheidtext über die Suche oben</span>
            {/* K5 (23.9.2026): zählt, was das VorlagenRegister zeigt — nur echte
                Vorlagen; vorher 27 inkl. `gerichtszitat` gegen «26 Vorlagen» im Kopf. */}
            <span className="num"><span className="text-ink-900">{verfuegbar.filter(istVorlage).length}</span> verfügbar</span>
          </p>
        </div>
      )}

      {filterAktiv && gefiltert.filter(istVorlage).length === 0 && geplant.length === 0 ? (
        <div className="py-6">
          {/* D-7 (R3-α, 31.8.2026): war ein handgezeichneter Absatz mit
              eigenem Knopf — Form und Wortlaut sind unverändert, die
              Anatomie kommt jetzt aus dem EINEN Baustein (§5/§10). */}
          <Leerzustand art="filter" text="Keine Vorlage in dieser Auswahl."
            weiterweg={{ text: 'Filter zurücksetzen', onKlick: () => setzeFilter(new Set(), false) }} />
        </div>
      ) : kat.id === 'fristen' ? (
        /* FE-1 (FAHRPLAN-FRISTEN-EINHEIT): EIN Einstieg + Regime-Abzweigungen
           statt der Alltag/Weitere-Mischliste. */
        <FristenRegister karten={karten} />
      ) : kat.id === 'zustaendigkeiten' ? (
        /* S-3 (FAHRPLAN-STRUKTUR-UMBAU): vier feste Rechtsweg-Felder. */
        <ZustaendigkeitRegister karten={karten} />
      ) : kat.id === 'vorlagen' ? (
        /* S-2 (FAHRPLAN-STRUKTUR-UMBAU): fünf Dokument-Gruppen. */
        <VorlagenRegister karten={gefiltert} />
      ) : kat.id === 'gebuehren' ? (
        /* S-6 (FAHRPLAN-STRUKTUR-UMBAU): prozessual/materiell + Hilfsrechner. */
        <GebuehrenRegister karten={karten} sortiert={sortiert} />
      ) : (
        <>
          {alltag.length > 0 && (
            <div className="space-y-2">
              <GruppenKopf titel="Alltag" />
              <div className={RASTER}>
                {alltag.map((k) => <ListenZeile key={k.id} k={k} subLabel={k.rechtsgebiet} />)}
              </div>
            </div>
          )}
          {weitere.length > 0 && (
            <div className="space-y-2">
              <GruppenKopf titel={alltag.length > 0 ? 'Weitere Werkzeuge' : 'Werkzeuge'} zahl={weitere.length} />
              <div className={RASTER}>
                {weitere.map((k) => <ListenZeile key={k.id} k={k} subLabel={k.rechtsgebiet} />)}
              </div>
            </div>
          )}
        </>
      )}

      {geplant.length > 0 && (
        // W2·10-UI-NAV/N0d·W4: bei aktivem Übersichts-Filter aufgeklappt, damit
        // passende «In Vorbereitung»-Karten nicht hinter dem Accordion verborgen bleiben.
        /* LM-060-Klasse (B15, 4.9.2026): zweite Fundstelle derselben Doppelmarke
            — GEMESSEN auf `/vorlagen` @1440 trug diese Summary das eigene ▸ UND
            das «▸» der App-weiten Regel. Nur noch das geteilte Zeichen. */
        <details open={alleOffen || undefined}>
          <summary className="cursor-pointer text-body-s text-ink-500 hover:text-ink-900 transition-colors select-none">
            In Vorbereitung <span className="num">({geplant.length})</span>
          </summary>
          <p className="text-body-s text-ink-500 leading-relaxed pt-2 pl-4">
            {geplant.map((k, i) => (
              <span key={k.id}>
                {i > 0 && <span aria-hidden> · </span>}
                {sansAmp(k.title)}
              </span>
            ))}
          </p>
        </details>
      )}
    </section>
  );
}

