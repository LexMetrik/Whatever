// ─── Universal-Suche: reiner Aggregator über alle Inhaltsarten ──────────────
//
// Bündelt die BESTEHENDEN, je eigenen Such-/Filter-Funktionen zu EINER
// gruppierten Trefferliste (§5: kein neues Ranking, keine eigene Rechtslogik
// §3). Die Funktion ist rein und synchron — die schweren Daten (Gesetzes-/
// Entscheid-Manifest, Preset-Index) werden von der Komponente lazy geladen und
// hier nur als Argument übergeben (so bleibt der Start-Chunk schlank).
//
//   Katalog       ← sucheRang (katalogSuche) über KATALOG_KARTEN
//   Fristen-Preset← presetSuche (presetIndex), als Eintrag übergeben
//   Gesetze       ← filtern (normtext/browse) über das Browse-Manifest
//   Materialien   ← filtere (materialien/browse) über das Manifest
//
// NICHT hier (Entscheid David 7.10.2026, A1-FUNDAMENT): Gesetzestext-Volltext und
// Rechtsprechung. Der Volltext läuft ausschliesslich über die Server-Suche
// (lib/suche/onlineVolltext.ts, Gruppe 'online'); Entscheide haben ihre eigene
// Suche auf /rechtsprechung (die globale Suche verlinkt dorthin).

import { KATALOG_KARTEN, istVerfuegbar } from './startseiteConfig';
import { sucheRang } from './katalogSuche';
import type { BrowseErlass } from './normtext/browse-typen';
import { filtern } from './normtext/browse';
import type { PresetIndexEintrag } from './presetIndex';
import type { BrowseMaterial } from './materialien/typen';
import { filtere as filtereMaterialien, vergleicheGlobal } from './materialien/browse';
import type { NormQueryTreffer } from './suche/normQuery';
import type { BgeSprung } from './suche/bgeQuery';
import { erlassPfad } from './normtext/erlassAdresse';

// 'sprung' = deterministischer Norm-Direktsprung (A5), von der Komponente VOR die
// statischen Gruppen gehängt; er entsteht aus dem Parser normQuery.ts, nicht im
// synchronen Aggregator unten (deshalb kein sucheAlles-Zweig dafür).
// 'online' = Gesetzestext-Volltext über die Server-Suche (QS-DATA E2; seit
// A1-FUNDAMENT 7.10.2026 der EINZIGE Volltext-Weg). Sie entsteht asynchron in
// lib/suche/onlineVolltext.ts und wird dem Aggregator unten fertig übergeben
// (`SuchDaten.online`); er setzt sie an ihren Platz in der Relevanz-Reihenfolge.
export type GruppenId = 'sprung' | 'katalog' | 'preset' | 'gesetz' | 'material' | 'online';

export interface SuchTreffer {
  id: string;
  label: string;
  untertitel?: string;
  /** Status-/Zuordnungs-Marke (z. B. «ZPO»). `ton: 'leitentscheid'` rendert das
   *  geteilte StatusBadge-Vokabular (W2·7-VZUI, EIN aria-label an allen Fundorten). */
  marke?: { text: string; ton: 'ok' | 'entwurf' | 'soft' | 'leitentscheid'; redundant?: boolean };
  href: string;
}

export interface SuchGruppe {
  id: GruppenId;
  titel: string;
  treffer: SuchTreffer[];
  /** Gesamtzahl vor der Kappung (für «alle N zeigen»). */
  gesamt: number;
  /** Ziel des «alle zeigen»-Links (oder undefined). */
  mehrHref?: string;
  /** true, solange die zugrundeliegenden Daten noch nicht geladen sind. */
  laedt?: boolean;
  /** true, wenn die Gruppe ihren Gegenstand gerade GAR NICHT liefern kann (Server-
   *  Suche nicht erreichbar: 503/502/offline/Timeout, A1-FUNDAMENT 7.10.2026). Hält
   *  die Gruppe sichtbar, auch ohne Treffer — sonst verschwände mit ihr die Auskunft,
   *  und eine Wortsuche läse sich als «nichts gefunden» statt als «konnte nicht
   *  suchen» (§8). Der Gruppenkopf zeigt dann keinen Zähler («0» wäre falsch). */
  nichtVerfuegbar?: boolean;
  /** Einmalige, dezente §8-Offenlegung unter dem Gruppentitel (z. B. Online-Suche). */
  hinweis?: string;
  /** Externer Amtslink (öffnet in neuem Reiter) — z. B. BGE «nicht im Bestand»
   *  → search.bger.ch. Nicht Teil der Listbox-Optionen (echter `<a target>`). */
  externLink?: { href: string; label: string };
}

const KAPPUNG = 6;

// ── Norm-Sprung (A5) ─────────────────────────────────────────────────────────

/** Baut die eine Sprung-Gruppe aus dem Parser-Treffer (oder null, wenn die
 *  Eingabe keine eindeutige Norm ist → nur Freitext-Suche). Reine Abbildung
 *  (§3): der Parser normQuery.ts hat die Norm bereits deterministisch aufgelöst;
 *  hier wird sie nur als oberster, gruppierter Treffer angezeigt. Der Direkt-
 *  Sprung ist die Primäraktion (Enter springt), Marke «Sprung» + amtlicher
 *  Titel (A5-Wortlaut David). */
export function sprungGruppe(direkt: NormQueryTreffer | null): SuchGruppe | null {
  if (!direkt) return null;
  const artikel = direkt.artikelAnzeige ? ` · Art. ${direkt.artikelAnzeige}` : '';
  return {
    id: 'sprung',
    titel: 'Norm-Sprung',
    gesamt: 1,
    treffer: [{
      id: `${direkt.erlass.key}${direkt.artikelToken ? `-${direkt.artikelToken}` : ''}`,
      label: `${direkt.erlass.kuerzel}${artikel}`,
      untertitel: direkt.erlass.titel,
      marke: { text: 'Sprung', ton: 'ok' as const },
      href: direkt.href,
    }],
  };
}

// ── BGE-Zitat-Sprung (UI-NAV S2) ─────────────────────────────────────────────

/** Baut die eine BGE-Sprung-Gruppe aus dem Parser-Ergebnis (oder null → normale
 *  Suche). Drei Zustände (§8): (a) `laedt` — Manifest noch nicht da, kein
 *  voreiliges «nicht im Bestand»; (b) im Bestand — interner Direkt-Sprung als
 *  oberster Treffer «Direkt öffnen»; (c) NICHT im Bestand — kein Treffer, sondern
 *  eine ehrliche Zeile + amtlicher Bundesgerichts-Link (externLink), statt das
 *  Zitat still unter Freitext-Treffern verschwinden zu lassen. Reine Abbildung
 *  (§3): der Parser bgeQuery.ts hat bereits aufgelöst. Teilt die id 'sprung' mit
 *  dem Norm-Sprung (beide sind exklusiv — eine Query ist Norm ODER BGE). */
export function bgeSprungGruppe(bge: BgeSprung | null): SuchGruppe | null {
  if (!bge) return null;
  if (bge.laedt) return { id: 'sprung', titel: 'Entscheid-Sprung', treffer: [], gesamt: 0, laedt: true };
  if (bge.imBestand && bge.key) {
    return {
      id: 'sprung',
      titel: 'Entscheid-Sprung',
      gesamt: 1,
      treffer: [{
        id: bge.key,
        label: bge.zitat,
        untertitel: 'Leitentscheid im Bestand — direkt öffnen',
        marke: { text: 'Direkt öffnen', ton: 'ok' as const },
        href: `/rechtsprechung/${encodeURIComponent(bge.key)}`,
      }],
    };
  }
  // Nicht im Bestand: ehrliche Auskunft + amtlicher Link (kein interner Treffer).
  return {
    id: 'sprung',
    titel: 'Entscheid-Sprung',
    gesamt: 0,
    treffer: [],
    hinweis: `${bge.zitat} ist nicht im Bestand von LexMetrik.`,
    // A40: «suchen» statt «öffnen» — der Link ist ein ehrlicher amtlicher SUCH-Link
    // (bgerSuchLink), kein konstruierter Direkt-Permalink (der landete beim falschen
    // Entscheid). bger.ch zeigt die Trefferliste zum Zitat, der Nutzer wählt selbst.
    externLink: { href: bge.amtlichHref, label: `${bge.zitat} beim Bundesgericht suchen` },
  };
}

// ── Einzelgruppen (rein) ─────────────────────────────────────────────────────

export function katalogGruppe(q: string, kappung = KAPPUNG): SuchGruppe {
  const getroffen = KATALOG_KARTEN
    .map((k) => ({ k, rang: sucheRang(k, q) }))
    .filter((x): x is { k: typeof KATALOG_KARTEN[number]; rang: number } =>
      x.rang !== null && !!x.k.href && istVerfuegbar(x.k))
    .sort((a, b) => a.rang - b.rang);

  const treffer: SuchTreffer[] = getroffen.slice(0, kappung).map(({ k }) => ({
    id: k.id,
    label: k.title,
    untertitel: k.rechtsgebiet,
    marke: { text: k.modus === 'vorlage' ? 'Vorlage' : 'Rechner', ton: 'soft' as const, redundant: true },
    href: k.href!,
  }));

  // Kein «alle N»-Link mehr: /recherche ist aufgelöst, Rechner und Vorlagen
  // liegen in getrennten Übersichten (/rechner, /vorlagen) — eine kombinierte
  // Katalog-Trefferseite gibt es nicht. Bei >Kappung verfeinert man die Suche.
  return { id: 'katalog', titel: 'Rechner & Vorlagen', treffer, gesamt: getroffen.length };
}

export function presetGruppe(eintraege: PresetIndexEintrag[] | null, kappung = KAPPUNG): SuchGruppe {
  if (eintraege === null) return { id: 'preset', titel: 'Fristen-Vorlagen', treffer: [], gesamt: 0, laedt: true };
  const treffer: SuchTreffer[] = eintraege.slice(0, kappung).map((e) => ({
    id: e.key,
    label: e.label,
    untertitel: e.norm || e.regimeLabel,
    marke: { text: e.regimeLabel, ton: 'soft' as const },
    href: `/rechner/tagerechner${e.query}${e.hash}`,
  }));
  // Kein «alle N zeigen»-Link: der Tagerechner kennt keine ?q=-Listenansicht,
  // ein Link dorthin verlöre die Suche (§8). Die Zählung muss EHRLICH sein —
  // darum übergibt die Komponente die Presets ungekappt (kein 12er-Limit), so
  // dass `gesamt` die echte Trefferzahl ist. Bei >Kappung verfeinert man die Suche.
  return { id: 'preset', titel: 'Fristen-Vorlagen', treffer, gesamt: eintraege.length };
}

// ── Treffer-Dedup (IA-1, §11.5) ──────────────────────────────────────────────

/** Kollabiert inhaltsgleiche Erlass-Doppel, die NUR in der Sammlungs-Nummer
 *  differieren (kantonale Gemeinde-Sammlungen doppeln denselben Erlass unter
 *  einem Präfix — «RiE/BeE/BaB 890.800» = Riehen/Bettingen-Kopien des kantonalen
 *  «890.800», dazu vereinzelte exakte SR-Dubletten). Gruppen-Schlüssel = Ebene +
 *  Kanton + amtlicher Titel (byte-gleicher Titel im selben Kanton ⇒ derselbe
 *  Erlass; verschiedene Titel/Kürzel bleiben getrennt). Kanonische Wahl
 *  DETERMINISTISCH (§2/§8): reine Zahl-Nummer (ohne Sammlungs-Präfix) vor
 *  präfigierter, sonst lexikografisch kleinster Key. Die Ergebnis-REIHENFOLGE
 *  bleibt erhalten (nur spätere Dubletten fallen weg) — reine Projektion, keine
 *  Rechtslogik (§3). Wirkt nur in der SUCHE (gesetzGruppe), nicht im /gesetze-
 *  Browse (dort ist die volle Sammlungs-Liste gewollt). */
export function dedupErlasse(treffer: BrowseErlass[]): BrowseErlass[] {
  const schluessel = (e: BrowseErlass) => `${e.ebene}|${e.kanton ?? ''}|${e.titel.trim()}`;
  // Präfix-Rang: sr beginnt mit Ziffer (reine Zahl-Nummer) → 0, sonst (Präfix wie
  // «RiE », «GS », leer) → 1. So gewinnt die kantonale Kern-Nummer vor der Kopie.
  const rang = (sr: string | null) => (sr && /^\d/.test(sr) ? 0 : 1);
  const gruppen = new Map<string, BrowseErlass[]>();
  for (const e of treffer) {
    const k = schluessel(e);
    const arr = gruppen.get(k);
    if (arr) arr.push(e); else gruppen.set(k, [e]);
  }
  const kanon = new Map<string, string>();
  for (const [k, arr] of gruppen) {
    if (arr.length === 1) { kanon.set(k, arr[0].key); continue; }
    const gewaehlt = [...arr].sort((a, b) =>
      rang(a.sr) - rang(b.sr) || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))[0];
    kanon.set(k, gewaehlt.key);
  }
  const gesehen = new Set<string>();
  const out: BrowseErlass[] = [];
  for (const e of treffer) {
    const k = schluessel(e);
    if (kanon.get(k) !== e.key || gesehen.has(k)) continue;
    gesehen.add(k);
    out.push(e);
  }
  return out;
}

/** Ziel des «alle N →»-Sprungs: die Browse-Seite MIT dem Suchbegriff (UI-NAV S1).
 *  Ohne die Query landete man auf der ungefilterten Übersicht und müsste den
 *  Begriff neu tippen — der Sprung verspräche «alle N», lieferte aber die ganze
 *  Rubrik (§8). Die Zielseiten lesen `?q=` über useSucheAusUrl. Leerer Begriff ⇒
 *  blanker Pfad (kein `?q=`-Rauschen in der Adresse). */
function mehrZiel(pfad: string, q: string): string {
  const t = q.trim();
  return t === '' ? pfad : `${pfad}?q=${encodeURIComponent(t)}`;
}

export function gesetzGruppe(erlasse: BrowseErlass[] | null, q: string, kappung = KAPPUNG): SuchGruppe {
  if (erlasse === null) return { id: 'gesetz', titel: 'Gesetze', treffer: [], gesamt: 0, laedt: true };
  const getroffen = dedupErlasse(filtern(erlasse, q));
  const treffer: SuchTreffer[] = getroffen.slice(0, kappung).map((e) => ({
    id: e.key,
    label: e.kuerzel ? `${e.kuerzel} · ${e.titel}` : e.titel,
    untertitel: [e.ebene === 'kanton' ? e.kanton : 'Bund', e.sr ? `SR ${e.sr}` : null].filter(Boolean).join(' · '),
    marke: e.ebene === 'kanton' && e.kanton ? { text: e.kanton, ton: 'soft' as const } : undefined,
    href: erlassPfad(e),
  }));
  return {
    id: 'gesetz', titel: 'Gesetze', treffer, gesamt: getroffen.length,
    mehrHref: getroffen.length > kappung ? mehrZiel('/gesetze', q) : undefined,
  };
}

function materialGruppe(liste: BrowseMaterial[] | null, q: string, kappung = KAPPUNG): SuchGruppe {
  if (liste === null) return { id: 'material', titel: 'Materialien', treffer: [], gesamt: 0, laedt: true };
  const getroffen = filtereMaterialien(liste, { suche: q }).sort(vergleicheGlobal);
  const treffer: SuchTreffer[] = getroffen.slice(0, kappung).map((m) => ({
    id: m.key,
    label: m.nummer ? `${m.behoerdeKuerzel} ${m.nummer} · ${m.titel}` : `${m.behoerdeKuerzel} · ${m.titel}`,
    untertitel: [m.behoerdeName, m.doktypLabel].filter(Boolean).join(' — '),
    marke: { text: 'Material', ton: 'soft' as const, redundant: true },
    href: `/materialien/${encodeURIComponent(m.key)}`,
  }));
  return {
    id: 'material', titel: 'Materialien', treffer, gesamt: getroffen.length,
    mehrHref: getroffen.length > kappung ? mehrZiel('/materialien', q) : undefined,
  };
}

// ── Aggregation ──────────────────────────────────────────────────────────────

export interface SuchDaten {
  presets: PresetIndexEintrag[] | null;
  gesetze: BrowseErlass[] | null;
  materialien: BrowseMaterial[] | null;
  /** Fertige Server-Volltextgruppe (Treffer, Platzhalter `laedt` oder Ausfall
   *  `nichtVerfuegbar`) — oder null/undefiniert, wenn nichts zu zeigen ist (Begriff
   *  zu kurz, Server hat nichts gefunden). */
  online?: SuchGruppe | null;
}

/** Alle Gruppen in fester Reihenfolge nach RELEVANZ (A6, David 5.7.2026): erst die
 *  Rechtsinhalte (Gesetze → Gesetzestext-Volltext vom Server → Materialien), dann die
 *  Werkzeuge (Rechner & Vorlagen → Fristen-Vorlagen). Der Gesetzestext steht damit
 *  weiter an seinem Platz hinter den Gesetzen (so stand die frühere Artikel-Gruppe);
 *  CLS-sicher, weil die Gruppe schon als Platzhalter (`laedt`) dort steht, bevor die
 *  Serverantwort sie füllt (§15.2). Der Norm-Sprung (A5) wird von der Komponente noch
 *  DAVOR gehängt (sprungGruppe). Leere (aber geladene) Gruppen entfallen, noch ladende
 *  Gruppen bleiben als Platzhalter sichtbar, ein Server-Ausfall bleibt als Hinweis stehen. */
export function sucheAlles(q: string, daten: SuchDaten, kappung = KAPPUNG): SuchGruppe[] {
  if (q.trim() === '') return [];
  const gruppen = [
    gesetzGruppe(daten.gesetze, q, kappung),
    ...(daten.online ? [daten.online] : []),
    materialGruppe(daten.materialien, q, kappung),
    katalogGruppe(q, kappung),
    presetGruppe(daten.presets, kappung),
  ];
  return gruppen.filter((g) => g.laedt || g.nichtVerfuegbar || g.treffer.length > 0);
}
