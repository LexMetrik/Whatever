import { useEffect, useMemo, useRef, useState } from 'react';
import { sucheAlles, sprungGruppe, bgeSprungGruppe, type SuchGruppe } from '../../lib/universalSuche';
import { holeOnlineTreffer, passeOnlineGruppeAn, MIN_ZEICHEN } from '../../lib/suche/onlineVolltext';
import { baueNormIndex, parseNormQuery } from '../../lib/suche/normQuery';
import { baueBgeIndex, parseBgeSprung, parseBgeZitat } from '../../lib/suche/bgeQuery';
import { meinenSie } from '../../lib/suche/vorschlag';
import { vokabularBegriffe } from '../../lib/suche/vokabular';
import { KATALOG_KARTEN } from '../../lib/startseiteConfig';
import type { PresetIndexEintrag } from '../../lib/presetIndex';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import type { BrowseEntscheid } from '../../lib/rechtsprechung/register';
import type { BrowseMaterial } from '../../lib/materialien/typen';

// ─── Gemeinsamer Such-Hook (Header-Dropdown UND Startseiten-Hero, §5) ────────
//
// Kapselt das LAZY-Laden der Such-Daten (Preset-Index, Gesetzes-/Material-Manifest)
// und die Gruppen-Berechnung über den reinen Aggregator lib/universalSuche (§3 —
// keine Rechtslogik hier). Erst der erste nicht-leere Query stösst die dynamischen
// Importe an, danach gecacht — der Start-Chunk bleibt schlank (§6.4: nur
// Ladezeitpunkt, nie Inhalt/Reihenfolge).
//
// ZUSCHNITT (Entscheid David 7.10.2026, A1-FUNDAMENT: «suche zurückfahren. nur noch
// nach gesetzen und werkzeugen suchen lassen. separat für entscheide»; Wortsuche
// «nur über Server»): lokal suchen Gesetze (Titel, Kürzel, SR, Norm-Sprung) und
// Werkzeuge; die Wortsuche im Gesetzestext fragt die Server-Suche (api/suche); der
// Browser lädt WEDER einen Artikel-Volltextindex NOCH das Entscheid-Register
// (10 MB roh) für eine gewöhnliche Suche. Entscheide haben ihre eigene Suche
// (/rechtsprechung). Einzige Ausnahme: ein BGE-ZITAT («BGE 152 I 65») ist eine
// Navigation, keine Suche — nur dafür lädt der Hook das Register nach.
//
// Vormals lag diese Logik allein in der Hero-Komponente (UniversalSuche.tsx);
// herausgezogen, damit Header und Hero EINEN Suchweg teilen (Auftrag David:
// «Resultate überall im Dropdown»).

/** §8-Korpus-Offenlegung (UI-NAV S3/E1): was die Suche wirklich abdeckt. Aus dem
 *  ohnehin geladenen Gesetzes-Manifest abgeleitet (kein Zweit-Index, K10). */
export interface Abdeckung {
  /** Bund-Erlasse (inkl. International), deren Gesetzestext die Server-Suche
   *  im Wortlaut durchsucht. */
  volltext: number;
  /** Kantonale Erlasse im Manifest: nach Titel überall, im Wortlaut ebenfalls nur
   *  über die Server-Suche. Der Feldname bleibt (er benennt die Menge, nicht den Weg). */
  kantonTitel: number;
}

export interface UniversalSucheErgebnis {
  gruppen: SuchGruppe[];
  /** true, sobald alle Datenquellen geladen UND die Server-Antwort da ist (für
   *  ehrlichen Leerzustand: «Keine Treffer» erst, wenn auch der Volltext gefragt wurde). */
  allesGeladen: boolean;
  /** «Meinten Sie …?»-Vorschlag bei mutmasslichem Tippfehler (oder null). */
  vorschlag: string | null;
  /** §8-Korpus-Offenlegung für die Fusszeile (oder null, solange das Manifest lädt). */
  abdeckung: Abdeckung | null;
}

/** Optionen für die /suche-Vollseite (S5): mehr Volltext-Treffer + ungekappte
 *  Gruppen. Ohne Optionen bleibt das Dropdown-Verhalten (Kappung 6, 10 Treffer
 *  vom Server). */
export interface UniversalSucheOpt {
  /** Anzahl Volltext-Treffer, die vom Server geholt werden (Default 10 = Dropdown;
   *  der Server klemmt auf höchstens 50). */
  volltextLimit?: number;
  /** Kappung je Gruppe (Default 6 = Dropdown; die /suche-Seite gibt grosszügig). */
  kappung?: number;
}

export function useUniversalSuche(q: string, opt: UniversalSucheOpt = {}): UniversalSucheErgebnis {
  const volltextLimit = opt.volltextLimit ?? 10;
  const kappung = opt.kappung ?? 6;
  const [presetSucheFn, setPresetSucheFn] = useState<((s: string, limit?: number) => PresetIndexEintrag[]) | null>(null);
  const [gesetze, setGesetze] = useState<BrowseErlass[] | null>(null);
  const [entscheide, setEntscheide] = useState<BrowseEntscheid[] | null>(null);
  const [materialien, setMaterialien] = useState<BrowseMaterial[] | null>(null);
  // Server-Volltext: `fuer` = der Begriff, zu dem `gruppe` gehört (null-Gruppe = der
  // Server hat geantwortet und nichts gefunden). So lässt sich «Antwort steht noch
  // aus» (fuer ≠ aktueller Begriff) von «keine Treffer» unterscheiden (§8).
  const [online, setOnline] = useState<{ fuer: string; gruppe: SuchGruppe | null }>({ fuer: '', gruppe: null });
  const gestartet = useRef(false);
  const bgeGestartet = useRef(false);
  const begriff = q.trim();
  const volltextGefragt = begriff.length >= MIN_ZEICHEN;

  useEffect(() => {
    if (q === '' || gestartet.current) return;
    gestartet.current = true;
    import('../../lib/presetIndex').then((m) => setPresetSucheFn(() => m.presetSuche)).catch(() => setPresetSucheFn(() => () => []));
    import('../../lib/normtext/browse').then((m) => m.ladeBrowseManifest()).then((m) => setGesetze(m?.erlasse ?? [])).catch(() => setGesetze([]));
    import('../../lib/materialien/browse').then((m) => m.ladeMaterialManifest()).then((m) => setMaterialien(m?.materialien ?? [])).catch(() => setMaterialien([]));
  }, [q]);

  // Entscheid-Register (10 MB roh, ~815 KB gzip) NUR für den BGE-Zitat-Sprung: ein
  // Zitat wie «BGE 152 I 65» ist eine Navigation auf einen einzelnen Entscheid, keine
  // Entscheid-SUCHE (die liegt auf /rechtsprechung). Jede andere Query lädt es nicht.
  const bgeZitat = parseBgeZitat(q) !== null;
  useEffect(() => {
    if (!bgeZitat || bgeGestartet.current) return;
    bgeGestartet.current = true;
    import('../../lib/rechtsprechung/browse').then((m) => m.ladeEntscheidManifest()).then((m) => setEntscheide(m?.entscheide ?? [])).catch(() => setEntscheide([]));
  }, [bgeZitat]);

  // Volltextsuche über den Server (A1-FUNDAMENT, Entscheid David 7.10.2026:
  // «nur über Server»): die EINZIGE Wortsuche im Gesetzestext. Eigener kleiner
  // Debounce ZUSÄTZLICH zum 120-ms-Debounce der Wrapper (Netz ist teurer als ein
  // lazy Import); erst ab MIN_ZEICHEN. Die lokalen Gruppen warten NICHT darauf —
  // sie rendern sofort, die Server-Gruppe wächst unten an (CLS-sicher, §15.2).
  // Ausfall (503/Netz/Timeout) liefert eine Gruppe MIT Hinweis «Volltextsuche
  // derzeit nicht verfügbar» statt stiller Leere (§8). Kein Zustand hält je einen
  // Volltext — die Edge liefert by design nur Snippets (§15.4).
  useEffect(() => {
    let abgebrochen = false;
    // Wall-Clock als Eingabe (§2 — Date.now lebt in der Komponentenschicht, nicht in src/lib).
    const id = setTimeout(() => {
      if (!volltextGefragt) { if (!abgebrochen) setOnline((alt) => (alt.fuer === '' && alt.gruppe === null ? alt : { fuer: '', gruppe: null })); return; }
      holeOnlineTreffer(begriff, { jetzt: () => Date.now(), limit: volltextLimit })
        .then((g) => { if (!abgebrochen) setOnline({ fuer: begriff, gruppe: g }); });
    }, volltextGefragt ? 200 : 0);
    return () => { abgebrochen = true; clearTimeout(id); };
  }, [begriff, volltextGefragt, volltextLimit]);

  // Antwort des Servers steht noch aus: Begriff ist lang genug, aber `online`
  // gehört zu einem anderen Begriff. Dann zeigt die Liste — falls vorhanden — die
  // bisherige Server-Gruppe weiter (wie vor dem Umbau), sonst einen Platzhalter,
  // damit «Keine Treffer» nicht behauptet wird, bevor der Server gefragt wurde (§8).
  const onlineLaedt = volltextGefragt && online.fuer !== begriff;
  const onlineGruppe: SuchGruppe | null = useMemo(() => {
    if (!volltextGefragt) return null;
    if (online.gruppe) return passeOnlineGruppeAn(online.gruppe, kappung, begriff);
    if (onlineLaedt) return { id: 'online', titel: 'Volltext-Suche (online)', treffer: [], gesamt: 0, laedt: true };
    return null;
  }, [volltextGefragt, online, onlineLaedt, kappung, begriff]);

  // Norm-Sprung-Parser (A5, W2·5d): baut den Auflösungs-Index EINMAL pro geladenem
  // Gesetzes-Manifest (KEIN Zweit-Index, K10 — der Parser sitzt auf denselben
  // `gesetze`, die die Gruppen-Suche ohnehin lädt). Deterministisch (§2): erkennt
  // die Eingabe eine eindeutige Norm («OR 257d», «Art. 5 AIG»), liefert er den
  // Deep-Link; Freitext → null → nur die normale Suche.
  const normIndex = useMemo(() => (gesetze ? baueNormIndex(gesetze) : null), [gesetze]);
  const direkt = useMemo(() => (normIndex ? parseNormQuery(q, normIndex) : null), [normIndex, q]);

  // BGE-Zitat-Direktsprung (UI-NAV S2): analoger, deterministischer Parser auf
  // dem Entscheid-Register (KEIN Zweit-Index, K10 — `bgeReferenz` trägt die
  // Bestands-Info). Solange `entscheide` lädt, ist der Index null → der Parser
  // meldet `laedt` statt voreilig «nicht im Bestand» (§8). Norm- und BGE-Sprung
  // sind exklusiv (eine Query ist Norm ODER BGE), darum EIN Sprung-Slot: der
  // Norm-Sprung hat Vorrang, sonst der BGE-Sprung.
  const bgeIndex = useMemo(() => (entscheide ? baueBgeIndex(entscheide) : null), [entscheide]);
  const bge = useMemo(() => parseBgeSprung(q, bgeIndex), [q, bgeIndex]);

  const gruppen = useMemo(
    // Reihenfolge (A6): Norm-Sprung (A5) ZUOBERST → lokale Gruppen → Server-Volltext
    // UNTEN. Die Server-Gruppe hängt IMMER hinter den lokalen Gruppen — CLS-sicher,
    // weil sie nur unten anwächst und nichts darüber verschiebt (§15.2). Der Sprung
    // oben ist ein einzelner deterministischer Treffer, der ebenfalls nichts
    // verdrängt (er ersetzt keine Freitext-Gruppe).
    () => {
      const lokal = sucheAlles(q, {
        presets: presetSucheFn ? presetSucheFn(q, 999) : null,
        gesetze,
        materialien,
      }, kappung);
      const sprung = sprungGruppe(direkt) ?? bgeSprungGruppe(bge);
      return [
        ...(sprung ? [sprung] : []),
        ...lokal,
        ...(onlineGruppe ? [onlineGruppe] : []),
      ];
    },
    [q, direkt, bge, presetSucheFn, gesetze, materialien, onlineGruppe, kappung],
  );
  const allesGeladen = presetSucheFn !== null && gesetze !== null && materialien !== null && !onlineLaedt;

  // §8-Korpus-Offenlegung (S3/E1): rein aus dem geladenen Gesetzes-Manifest (K10).
  // Gesetzestext im Wortlaut durchsucht ausschliesslich die Server-Suche (api/suche,
  // Bund UND Kantone) — genau so wird es in der Abdeckungszeile gesagt, samt der
  // Folge, dass es ohne Verbindung fehlt.
  const abdeckung = useMemo<Abdeckung | null>(() => {
    if (!gesetze) return null;
    return {
      volltext: gesetze.filter((e) => e.ebene === 'bund' && e.status === 'snapshot').length,
      kantonTitel: gesetze.filter((e) => e.ebene === 'kanton').length,
    };
  }, [gesetze]);

  // «Meinten Sie …?» (S3): deterministischer Tippfehler-Vorschlag (§2, kein LLM)
  // gegen Katalog-Titel + Erlass-Kürzel + Such-Vokabular. Kandidaten in
  // Anzeige-Priorität (Katalog-Titel/Kürzel vor lowercase-Vokabular), dedupt.
  const kandidaten = useMemo(() => {
    const s: string[] = [];
    const gesehen = new Set<string>();
    const add = (w: string) => {
      const n = w.trim().toLowerCase();
      if (w && !gesehen.has(n)) { gesehen.add(n); s.push(w); }
    };
    for (const k of KATALOG_KARTEN) add(k.title);
    for (const e of gesetze ?? []) if (e.kuerzel) add(e.kuerzel);
    for (const b of vokabularBegriffe()) add(b);
    return s;
  }, [gesetze]);

  // Nur bei spärlichem Ergebnis und stabilem (fertig geladenem) Zustand vorschlagen —
  // kein Vorschlag, wenn ein Direkt-Sprung oder genügend Treffer da sind (kein Lärm).
  const vorschlag = useMemo(() => {
    if (!allesGeladen) return null;
    if (gruppen.some((g) => g.id === 'sprung')) return null;
    const total = gruppen.reduce((n, g) => n + g.treffer.length, 0);
    if (total > 2) return null;
    return meinenSie(q, kandidaten);
  }, [allesGeladen, gruppen, q, kandidaten]);

  return { gruppen, allesGeladen, vorschlag, abdeckung };
}
