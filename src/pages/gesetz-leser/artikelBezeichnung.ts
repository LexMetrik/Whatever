import type { StrukturMap } from '../../lib/normtext/browse';

// ═══ W2·17-UI-BEFUNDE (B7) · EINDEUTIGE BEZEICHNUNG EINES ARTIKELS ═══════════
//
// «Art. 3» allein nennt in OR, ZGB und SchKG zwei Artikel: den Hauptartikel und
// den Artikel der Schlusstitel-/Übergangsgruppe (Token `disp_u<N>_art_3`). Wo ein
// Label OHNE den umgebenden Gliederungs-Pfad steht (der «Weiterlesen»-Chip, das
// Panel-Zitat), muss es auch den Übergangsartikel eindeutig benennen — sonst
// verspricht die Angabe einen anderen Artikel als den gemeinten (§8).
//
// Die Bezeichnung der Gruppe kommt aus derselben amtlichen Gliederung, die der
// Leser sonst zeigt (`struktur[token].gliederung`, Ebene 1; z. B. «Schlusstitel:
// Anwendungs- und Einführungsbestimmungen») — keine zweite Pflegestelle (§5).
// Fehlt das Sidecar (lädt nicht / noch nicht), fällt die Form auf die laufende
// Nummer der Gruppe zurück: nutzertauglich und eindeutig, ohne einen Rohschlüssel
// zu zeigen und ohne der Gruppe einen Namen zu geben, den man nicht kennt (§8).
// Haupttext-Artikel bleiben unverändert (Label = Anzeige-Label des Eintrags).

const UEB_TOKEN = /^disp_u(\d+)_/;

/** Token eines Schlusstitel-/Übergangsartikels (`disp_u<N>_art_…`)? */
function istUebergangsToken(token: string | null): boolean {
  return token !== null && UEB_TOKEN.test(token);
}

/** Amtliche Gruppen-Bezeichnung aus der Gliederung (Ebene 1), oder `null`. */
function gruppenName(token: string, struktur: StrukturMap | null): string | null {
  return struktur?.[token]?.gliederung.find((g) => g.ebene === 1)?.label ?? null;
}

/** Rückfall ohne Sidecar: «Gruppe 2» — die laufende Nummer, kein Rohschlüssel. */
function gruppenRueckfall(nr: string): string {
  return `nachgestellte Bestimmungen, Gruppe ${nr}`;
}

export function eindeutigeBezeichnung(
  token: string,
  label: string,
  struktur: StrukturMap | null,
): string {
  const m = UEB_TOKEN.exec(token);
  if (!m) return label;
  return `${label} (${gruppenName(token, struktur) ?? gruppenRueckfall(m[1])})`;
}

// ─── W2·17-UI-BEFUNDE · AMTLICHES ZITAT IM PANEL ─────────────────────────────
//
// «Art. 3 ZGB» nennt den Hauptartikel — für den Schlusstitel-Artikel
// `disp_u1_art_3` falsch (§8). Das Panel setzt das Zitat aus Label + Kürzel
// zusammen (`normZitat`); die Übergangs-Variante geht darum über das KÜRZEL:
//
//  · ZGB-Schlusstitel (`disp_u1`): «Art. 3 SchlT ZGB». BELEG der amtlichen
//    Zitierweise (§7): die Fedlex-Texte selbst führen sie — GBV «Art. 33b SchlT
//    ZGB», VZG «Art. 20bis SchlT/ZGB» (`public/normtext/bund/{GBV,VZG}.json`);
//    das Bundesgericht zitiert «Art. N SchlT ZGB» (rund 190 Nennungen in
//    `public/rechtsprechung` und `public/normtext/bund`, gemessen 2.10.2026).
//  · jede andere Gruppe: KEINE amtliche Kurzform. Das OR kennt keine; das
//    Bundesgericht behilft sich je Entscheid selbst («ÜBest OR» nur für die
//    Änderung vom 21.6.2019, dort im Urteil definiert; sonst ausgeschrieben:
//    «Art. 3 der Übergangsbestimmungen der Änderung vom 12. Dezember 2014 OR»).
//    Darum hier die ausgeschriebene Gruppe: «Art. 1 OR (Übergangsbestimmungen
//    zur Änderung vom 16. Dezember 2005)» — nie «Art. 1 OR» allein.
//
// WANN QUALIFIZIERT WIRD — nicht an der Mehrdeutigkeit des Labels (Nachzug nach
// Gegenprüfung 2.10.2026: 47 der 104 ZGB-Schlusstitel-Artikel, etwa `disp_u1_art_6_a`,
// kollidieren mit keiner Hauptteil-Nummer und hiessen «Art. 6a ZGB» — einen
// solchen Artikel gibt es nicht; OR `disp_u12_art_2_4` hiess «Art. 2–4 OR»), sondern
// daran, ob die Gruppe EIGENE Nummern führt. Aus den Daten abgeleitet: eine Gruppe
// SETZT die Folge des Hauptteils FORT, wenn alle ihre Nummern hinter dem LETZTEN
// Hauptteil-Artikel liegen (PatG disp_u1 Art. 141–149, VZG Art. 135–136: «Art. 141
// PatG» ist dort die richtige Zitierweise). Bewusst der letzte Artikel in
// Dokumentreihenfolge, nicht die grösste Zahl: im PatG-Snapshot tragen drei
// Bereichs-Token die Ziffern ohne Bindestrich («Art. 104106» für Art. 104–106) —
// ein Datenfehler (Nebenfund), der ein Maximum verfälschte. Sonst beginnt sie neu bzw. wiederholt
// Nummern (OR, SchKG, ZGB disp_u1 Art. 1–61, ZGB disp_u2 Art. 178–251) und das
// Zitat trägt die Gruppe. «Nummer» = die erste Zahl des Labels («Art. 2–4» → 2).

const ZGB_SCHLUSSTITEL = 'disp_u1';

const ersteNummer = (label: string): number => Number(/\d+/.exec(label)?.[0] ?? NaN);

type Eintrag = { artikel: string; artikelLabel: string };

/** Setzt die Gruppe des Tokens die Nummernfolge des Hauptteils fort? */
function setztFolgeFort(token: string, ns: string, eintraege: readonly Eintrag[]): boolean {
  let hauptLetzte = NaN;
  let gruppeMin = Infinity;
  for (const e of eintraege) {
    const n = ersteNummer(e.artikelLabel);
    if (Number.isNaN(n)) continue;
    if (/^\d/.test(e.artikel)) hauptLetzte = n;
    else if (e.artikel.startsWith(`${ns}_`)) gruppeMin = Math.min(gruppeMin, n);
  }
  return token.startsWith(`${ns}_`) && Number.isFinite(gruppeMin) && gruppeMin > hauptLetzte;
}

export function zitatKuerzel(
  token: string | null,
  label: string | null,
  kuerzel: string,
  struktur: StrukturMap | null,
  eintraege: readonly Eintrag[],
): string {
  const m = token ? UEB_TOKEN.exec(token) : null;
  if (!token || !label || !m) return kuerzel;
  const ns = `disp_u${m[1]}`;
  if (setztFolgeFort(token, ns, eintraege)) return kuerzel;
  if (kuerzel === 'ZGB' && ns === ZGB_SCHLUSSTITEL) return `SchlT ${kuerzel}`;
  return `${kuerzel} (${gruppenName(token, struktur) ?? gruppenRueckfall(m[1])})`;
}

// ─── W2·17-UI-BEFUNDE · DER LEERSATZ DES REITERS «ENTSCHEIDE» ────────────────
//
// Die Zuordnung der Entscheide kennt nur Artikel des Hauptteils: die Bezugs-
// Shards tragen keinen einzigen `disp_`-Schlüssel (gemessen 2.10.2026, alle 322
// Shards), obwohl das Bundesgericht Schlusstitel-Artikel zitiert («Art. 13a SchlT
// ZGB», BGE 150 III 160). «Kein Entscheid erfasst» wäre dort falsch (§8) — der
// Satz sagt, was wahr ist: nicht zugeordnet.

export function leereEntscheideSatz(token: string | null, label: string | null, zitat: string): string {
  if (istUebergangsToken(token)) {
    return `Zu ${zitat} sind keine Entscheide zugeordnet: die Zuordnung deckt den Hauptteil des Erlasses ab, nicht die Schluss- und Übergangsbestimmungen.`;
  }
  return label
    ? `Zu ${label} ist kein Entscheid der eingeschalteten Instanzen erfasst.`
    : 'Zu diesem Erlass ist kein Entscheid der eingeschalteten Instanzen erfasst.';
}
