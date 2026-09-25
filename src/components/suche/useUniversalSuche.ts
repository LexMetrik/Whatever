import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { sucheAlles, sprungGruppe, bgeSprungGruppe, type SuchGruppe } from '../../lib/universalSuche';
import { holeOnlineTreffer, MIN_ZEICHEN } from '../../lib/suche/onlineVolltext';
import { baueNormIndex, parseNormQuery } from '../../lib/suche/normQuery';
import { baueBgeIndex, parseBgeSprung } from '../../lib/suche/bgeQuery';
import { meinenSie } from '../../lib/suche/vorschlag';
import { vokabularBegriffe } from '../../lib/suche/vokabular';
import { KATALOG_KARTEN } from '../../lib/startseiteConfig';
import { SUCHE_OHNE_INDEX, type ArtikelSuche } from '../../lib/suche/artikelVolltext';
import type { PresetIndexEintrag } from '../../lib/presetIndex';
import type { BrowseErlass } from '../../lib/normtext/browse-typen';
import type { BrowseEntscheid } from '../../lib/rechtsprechung/register';
import type { BrowseMaterial } from '../../lib/materialien/typen';

// ─── Gemeinsamer Such-Hook (Header-Dropdown UND Startseiten-Hero, §5) ────────
//
// Kapselt das LAZY-Laden der schweren Such-Daten (Preset-Index, Gesetzes-/
// Entscheid-Manifest) und die Gruppen-Berechnung über den reinen Aggregator
// lib/universalSuche (§3 — keine Rechtslogik hier). Erst der erste nicht-leere
// Query stösst die dynamischen Importe an, danach gecacht — der Start-Chunk
// bleibt schlank (§6.4: nur Ladezeitpunkt, nie Inhalt/Reihenfolge).
//
// Vormals lag diese Logik allein in der Hero-Komponente (UniversalSuche.tsx);
// herausgezogen, damit Header und Hero EINEN Suchweg teilen (Auftrag David:
// «Resultate überall im Dropdown»).

/** §8-Korpus-Offenlegung (UI-NAV S3/E1): was die Suche wirklich abdeckt. Aus den
 *  ohnehin geladenen Manifesten abgeleitet (kein Zweit-Index, K10). */
export interface Abdeckung {
  /** Bund-Erlasse im Volltext-Suchindex. */
  volltext: number;
  /** BGE/Leitentscheide im Bestand. */
  bge: number;
  /** Kantonale Erlasse. Seit der K3-Scharfschaltung (1.9.2026) NICHT im
   *  statischen Volltext-Index: nach Titel überall, im Volltext nur über die
   *  Online-Suche. Der Feldname bleibt (er benennt die Menge, nicht den Weg);
   *  was der Nutzer davon hat, sagt die Abdeckungszeile in SuchResultate.tsx. */
  kantonTitel: number;
}

export interface UniversalSucheErgebnis {
  gruppen: SuchGruppe[];
  /** true, sobald alle drei Datenquellen geladen sind (für ehrlichen Leerzustand). */
  allesGeladen: boolean;
  /** «Meinten Sie …?»-Vorschlag bei mutmasslichem Tippfehler (oder null). */
  vorschlag: string | null;
  /** §8-Korpus-Offenlegung für die Fusszeile (oder null, solange Manifeste laden). */
  abdeckung: Abdeckung | null;
}

/** Optionen für die /suche-Vollseite (S5): grösseres Artikel-Limit + ungekappte
 *  Gruppen. Ohne Optionen bleibt das Dropdown-Verhalten unverändert (Kappung 6,
 *  40 Artikel-Treffer). */
export interface UniversalSucheOpt {
  /** Anzahl gesuchter Artikel-Volltext-Treffer (Default 40 = Dropdown). */
  artikelLimit?: number;
  /** Kappung je Gruppe (Default 6 = Dropdown; die /suche-Seite gibt grosszügig). */
  kappung?: number;
}

export function useUniversalSuche(q: string, opt: UniversalSucheOpt = {}): UniversalSucheErgebnis {
  const artikelLimit = opt.artikelLimit ?? 40;
  const kappung = opt.kappung ?? 6;
  const [presetSucheFn, setPresetSucheFn] = useState<((s: string, limit?: number) => PresetIndexEintrag[]) | null>(null);
  const [artikelSuche, setArtikelSuche] = useState<ArtikelSuche | null>(null);
  const [gesetze, setGesetze] = useState<BrowseErlass[] | null>(null);
  const [entscheide, setEntscheide] = useState<BrowseEntscheid[] | null>(null);
  const [materialien, setMaterialien] = useState<BrowseMaterial[] | null>(null);
  const [onlineGruppe, setOnlineGruppe] = useState<SuchGruppe | null>(null);
  const gestartet = useRef(false);

  useEffect(() => {
    if (q === '' || gestartet.current) return;
    gestartet.current = true;
    import('../../lib/presetIndex').then((m) => setPresetSucheFn(() => m.presetSuche)).catch(() => setPresetSucheFn(() => () => []));
    // Artikel-Volltext: Lib + Index lazy in EIGENEM Chunk — er lädt erst HIER,
    // beim ersten Tastendruck in der Suche (q !== ''), nie beim Seitenaufbau.
    // Grösse gemessen 25.7.2026 (W2·5, Kanton dazu): 48.0 MB roh / 9.9 MB gzip,
    // vorher (nur Bund) 26.0 MB / 5.4 MB. Der Zuwachs trifft ausschliesslich den
    // ersten Suchvorgang, nicht den First Paint — darum bleibt er tragbar (§15).
    //
    // GESTAFFELT (W2·5): das erste `then` kommt, sobald der BUND durchsuchbar ist;
    // der Callback feuert, wenn die kantonale Ebene nachgerückt ist. Beide setzen
    // denselben State — die neue Objekt-Identität lässt die `artikelTreffer`-Memo
    // unten neu rechnen, die laufende Suche wertet sich also VON SELBST neu aus.
    // Niemand muss dieselbe Query ein zweites Mal tippen (Auflage David 25.7.2026).
    // Bei Fehlschlag bleibt die Gruppe leer statt die ganze Suche zu blockieren (§8).
    import('../../lib/suche/artikelVolltext')
      .then((m) => m.ladeArtikelSuche((nachgeladen) => setArtikelSuche(nachgeladen)))
      .then((erste) => setArtikelSuche(erste))
      // Totaler Fehlschlag: der Ersatz meldet BEIDE Ebenen als «nur online»
      // (SUCHE_OHNE_INDEX) — sonst fiele die Gesetzestext-Gruppe ohne Treffer
      // aus der Liste und die Suche verschwiege, dass sie gar nichts geladen hat (§8).
      .catch(() => setArtikelSuche(SUCHE_OHNE_INDEX));
    import('../../lib/normtext/browse').then((m) => m.ladeBrowseManifest()).then((m) => setGesetze(m?.erlasse ?? [])).catch(() => setGesetze([]));
    import('../../lib/rechtsprechung/browse').then((m) => m.ladeEntscheidManifest()).then((m) => setEntscheide(m?.entscheide ?? [])).catch(() => setEntscheide([]));
    import('../../lib/materialien/browse').then((m) => m.ladeMaterialManifest()).then((m) => setMaterialien(m?.materialien ?? [])).catch(() => setMaterialien([]));
  }, [q]);

  // Online-Volltextsuche (QS-DATA E2): zusätzliche Edge-Gruppe, die UNTEN
  // anwächst. Eigener kleiner Debounce ZUSÄTZLICH zum 120-ms-Debounce der
  // Wrapper (Netz ist teurer als ein lazy Import); erst ab MIN_ZEICHEN. Bei
  // Degradation (503/Netz/Timeout) liefert holeOnlineTreffer null → Gruppe
  // verschwindet, der statische Index trägt weiter (§8). Kein Zustand hält
  // je einen Volltext — die Edge liefert by design nur Snippets (§15.4).
  useEffect(() => {
    let abgebrochen = false;
    const kurz = q.trim().length < MIN_ZEICHEN;
    // Wall-Clock als Eingabe (§2 — Date.now lebt in der Komponentenschicht, nicht in src/lib).
    const id = setTimeout(() => {
      if (kurz) { if (!abgebrochen) setOnlineGruppe(null); return; }
      holeOnlineTreffer(q, { jetzt: () => Date.now() }).then((g) => { if (!abgebrochen) setOnlineGruppe(g); });
    }, kurz ? 0 : 200);
    return () => { abgebrochen = true; clearTimeout(id); };
  }, [q]);

  // Norm-Sprung-Parser (A5, W2·5d): baut den Auflösungs-Index EINMAL pro geladenem
  // Gesetzes-Manifest (KEIN Zweit-Index, K10 — der Parser sitzt auf denselben
  // `gesetze`, die die Gruppen-Suche ohnehin lädt). Deterministisch (§2): erkennt
  // die Eingabe eine eindeutige Norm («OR 257d», «Art. 5 AIG»), liefert er den
  // Deep-Link; Freitext → null → nur die normale Suche.
  const normIndex = useMemo(() => (gesetze ? baueNormIndex(gesetze) : null), [gesetze]);
  const direkt = useMemo(() => (normIndex ? parseNormQuery(q, normIndex) : null), [normIndex, q]);

  // BGE-Zitat-Direktsprung (UI-NAV S2): analoger, deterministischer Parser auf
  // demselben Entscheid-Manifest (KEIN Zweit-Index, K10 — `bgeReferenz` trägt die
  // Bestands-Info). Solange `entscheide` lädt, ist der Index null → der Parser
  // meldet `laedt` statt voreilig «nicht im Bestand» (§8). Norm- und BGE-Sprung
  // sind exklusiv (eine Query ist Norm ODER BGE), darum EIN Sprung-Slot: der
  // Norm-Sprung hat Vorrang, sonst der BGE-Sprung.
  const bgeIndex = useMemo(() => (entscheide ? baueBgeIndex(entscheide) : null), [entscheide]);
  const bge = useMemo(() => parseBgeSprung(q, bgeIndex), [q, bgeIndex]);

  // §15.3/A9: die TEURE Artikel-Volltextsuche (~4 MB-Index, 40 Treffer) vom
  // reaktiven Pfad ENTKOPPELN. Sie lief bislang synchron IN der `gruppen`-Memo
  // und blockierte damit den GESAMTEN Trefferaufbau — inkl. des billigen,
  // deterministischen Norm-Sprungs (A5) — bis der 4-MB-Scan durch war. Unter
  // CPU-Drossel überschritt das das A9-Budget (norm-sprung «Sprung» >12 s). Mit
  // `useDeferredValue` rechnet React die Artikelgruppe mit NIEDRIGER Priorität
  // auf einem nachlaufenden Query: der Sprung + die günstigen Gruppen rendern
  // sofort am Live-Query, die Artikelgruppe holt einen Tick später auf.
  // `artikelGruppe` nimmt die Treffer nur ENTGEGEN (kein Re-Ranking über q,
  // universalSuche.ts) → das Entkoppeln ändert nur das WANN, nicht das WAS (§6.4).
  const qArtikel = useDeferredValue(q);
  const artikelTreffer = useMemo(
    () => (artikelSuche ? artikelSuche.suche(qArtikel, artikelLimit) : null),
    [artikelSuche, qArtikel, artikelLimit],
  );

  // Die Ebenen-Felder der Artikel-Suche als EIGENE Abhängigkeiten (Lint
  // react-hooks/exhaustive-deps, REST S5b 25.9.2026). Verhaltensneutral:
  // `ladeArtikelSuche` baut beide Arrays je Stufe neu, sie wechseln also genau
  // dann, wenn auch `artikelTreffer` wechselt — Beweis
  // `src/tests/universal-suche-memo-deps.test.tsx` (eine Neurechnung je Stufe).
  const artikelFehlendeEbenen = artikelSuche?.fehlendeEbenen;
  const artikelNurOnlineEbenen = artikelSuche?.nurOnlineEbenen;
  const gruppen = useMemo(
    // Presets ungekappt holen (limit 999) — `gesamt` soll die ECHTE Trefferzahl
    // sein, nicht das Default-Suchlimit (§8). Die Anzeige kappt in der Gruppe.
    // Reihenfolge (A6): Norm-Sprung (A5) ZUOBERST → statische Relevanz-Gruppen →
    // Online-Edge-Gruppe (E2) UNTEN. Die Online-Gruppe hängt IMMER hinter den
    // statischen Gruppen (§11.3 b: Edge als Ergänzung, statischer Index bleibt
    // Fallback/oben) — CLS-sicher, weil sie nur unten anwächst und nichts darüber
    // verschiebt (§15.2). Der Sprung oben ist ein einzelner deterministischer
    // Treffer, der ebenfalls nichts verdrängt (er ersetzt keine Freitext-Gruppe).
    () => {
      const statisch = sucheAlles(q, {
        presets: presetSucheFn ? presetSucheFn(q, 999) : null,
        gesetze,
        artikel: artikelTreffer,
        artikelFehlendeEbenen,
        artikelNurOnlineEbenen,
        entscheide,
        materialien,
      }, kappung);
      const sprung = sprungGruppe(direkt) ?? bgeSprungGruppe(bge);
      return [
        ...(sprung ? [sprung] : []),
        ...statisch,
        ...(onlineGruppe ? [onlineGruppe] : []),
      ];
    },
    [q, direkt, bge, presetSucheFn, artikelTreffer, artikelFehlendeEbenen, artikelNurOnlineEbenen, gesetze, entscheide, materialien, onlineGruppe, kappung],
  );
  const allesGeladen = presetSucheFn !== null && artikelSuche !== null && gesetze !== null && entscheide !== null && materialien !== null;

  // §8-Korpus-Offenlegung (S3/E1): rein aus den geladenen Manifesten (K10). Der
  // STATISCHE Volltext-Suchindex ist seit der K3-Scharfschaltung (1.9.2026) wieder
  // Bund-only; kantonaler Volltext kommt ausschliesslich aus der Online-Suche
  // (api/suche, Edge) — genau so wird es in der Abdeckungszeile gesagt, samt der
  // Folge, dass er ohne Verbindung fehlt. (Zwischen W2·5 und K3 trug der statische
  // Index den Kanton mit; der Satz «nur nach Titel» stand in dieser Zeit zu
  // pessimistisch da — Befund bei der Scharfschaltung, hier mitkorrigiert.)
  const abdeckung = useMemo<Abdeckung | null>(() => {
    if (!gesetze || !entscheide) return null;
    return {
      volltext: gesetze.filter((e) => e.ebene === 'bund' && e.status === 'snapshot').length,
      bge: entscheide.filter((e) => e.bgeReferenz).length,
      kantonTitel: gesetze.filter((e) => e.ebene === 'kanton').length,
    };
  }, [gesetze, entscheide]);

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
