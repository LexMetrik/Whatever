import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { SUCH_META } from '../suchHighlight';
import { nachbarBezeichnung, type ArtikelNachbarn, type NachbarZiel } from '../v3/nachbarArtikel';
import { NachbarStrukturKontext } from '../v3/nachbarStruktur';
import { leerstellenWort } from '../../../lib/normtext/darstellung';

// ═══ W2·5m · DIE NACHBAR-PFEILE IM ARTIKELKOPF ══════════════════════════════
//
// «‹ Art. 89» links, «Art. 90a ›» rechts, beide in der Kopfzeile des Artikels,
// rechtsbündig als eine Einheit. Reine Darstellung (§3): WELCHE Artikel die
// Nachbarn sind, entscheidet `../v3/nachbarArtikel.ts`; diese Datei entscheidet
// nur, wie sie aussehen.
//
// ─── ECHTE `<a href>`, KEIN KNOPF ───────────────────────────────────────────
// Der Leser soll den Nachbarn in einem neuen Reiter öffnen, seine Adresse
// kopieren und ihn im zweiten Fenster aufschlagen können (`onClickCapture` der
// Lesespalte greift nur in `.lr-notiz`/`.lr7-bez-block[data-reg="r"]`, hier also
// nicht — der Klick blättert im selben Dokument, wie der Anker an der
// Artikelnummer daneben). Ein `<button>` mit `scrollIntoView` könnte nichts
// davon und bräuchte dafür eigenen Zustand.
//
// ─── DER LEERE NACHBAR IST EIN LEERES ELEMENT, KEIN GRAUER PFEIL ────────────
// Am ersten und am letzten Eintrag des Erlasses steht auf der betroffenen Seite
// NICHTS — kein ausgegrautes «‹», kein `href="#"`, kein `aria-disabled`. Ein
// Bedienelement, das nicht bedient werden kann, ist eine Einladung ins Leere
// (Design-Grundlage Kap. 6). Gleiche Auflösung wie die Erlass-Navigation am
// Fuss der Lesespalte, die dort seit jeher `<span />` statt eines toten Links
// setzt (`../v3/LeserLesespalte.tsx`, `<nav aria-label="Weitere Erlasse">`) —
// und derselbe Grund, warum ein Erlass mit genau EINEM Eintrag gar keine
// Nachbarzeile bekommt.
//
// ─── `data-such-meta` IST PFLICHT, NICHT ZIERDE ─────────────────────────────
// B1 (Bug-Check 4.8.2026): der Such-Walker malt Treffer über JEDEN Textknoten
// der Lesespalte, den er nicht ausdrücklich überspringt. «Art. 89» in dieser
// Zeile ist aber keine Fundstelle im Wortlaut, sondern Bedienung — eine Suche
// nach «89» zählte sonst an jedem Nachbarn eine Stelle mehr, als der Zähler
// nennt, und «gemalte ≤ gezählte» wäre nicht mehr haltbar. Das Attribut lässt
// den Walker den ganzen Teilbaum verwerfen (`../suchHighlight.ts`, Z. 225) —
// dieselbe Kennung, die «· aufgehoben» eine Zeile weiter oben schon trägt.
// Genau darum ist die Zeile auch KEINE Wiederholung der 2026 gelöschten
// Aktionen-Kopfzeile (D35-F1): sie trägt keine Bedienwörter, sondern zwei
// Artikelnamen, und sie steht dauerhaft da statt unter `opacity-0`.

// ─── W2·5m (Kap. 15.3) · DIESELBE ZEILE, ZWEI ADRESS-FORMEN ─────────────────
// Im EINZELMODUS ist der Nachbar keine Stelle im selben Dokument, sondern die
// nächste Seite: die Adresse trägt `?ansicht=artikel`, und der Sprung muss
// durch den Router laufen. Ein blosser `#art-…`-Anker täte es dort NICHT — ein
// Klick auf einen In-Page-Anker feuert kein `popstate`, react-router bemerkt
// ihn also nicht, und die Karte bliebe stehen.
//
// DIE KOMPONENTE WIRD WIEDERVERWENDET, NICHT KOPIERT (Kap. 15.3 wörtlich):
// `adresse` ist die einzige neue Prop. Ohne sie ist alles unverändert —
// derselbe `<a href="#art-…">`, dieselben Klassen, dieselben Selektoren,
// dasselbe Markup (Golden/§6, `check:golden-normtext`). Mit ihr wird daraus ein
// `<Link to>`; beides sind ECHTE Links, beide lassen sich im neuen Reiter
// öffnen und kopieren — der Grund, aus dem hier von Anfang an kein `<button>`
// steht (Block oben).
//
// ─── W2·17-UI-BEFUNDE (B11-D01…D04) · LANGE BESCHRIFTUNG, TREFFERFLÄCHE, GRUPPE ──
// B11-D01 · `whitespace-nowrap` am Pfeil liess eine lange Beschriftung die Spalte
// sprengen: HAÜ trägt als Nachbarn von Art. 48 den Anhang «Verzeichnis der
// zentralen und der zuständigen Behörden, …» (244 Zeichen) — der Pfeil war
// 1261 px breit, die Seite @1440 1870 px (waagrechter Bildlauf), @375 1337 px.
// Jetzt kürzt die BESCHRIFTUNG, nicht der Pfeil: im Kopf läuft sie ab 20 Zeichen
// (`max-w-[20ch]`, feste Obergrenze) einzeilig mit Auslassungszeichen aus, im Fuss
// steht sie bis zu zwei Zeilen und der Pfeil höchstens die halbe Zeile
// (`LeserEinzelAnsicht`, dort ist die Breite definiert). Kurze Beschriftungen («Art. 335d»)
// werden NIE gekürzt. ERSTE FASSUNG (Gegenprüfung #1278): `max-w-[50%]` am Pfeil im
// schrumpfenden Kopf-Paar bezog sich auf den Pfeil selbst und schnitt 9 von 15 kurzen
// Kopf-Pfeilen ab — eine Prozentbreite braucht eine Fläche mit definierter Breite.
// Der VOLLE Wortlaut steht im `title` und im zugänglichen Namen — verkürzt wird nur
// die Darstellung, nie die Auskunft (§8).
// B11-D02 · der Pfeil im Kopf war 13 px hoch (11 px Schrift): unter dem
// 24-px-Mindestmass der Trefferfläche (`--tap-ziel`, DESIGN-REGLEMENT F9). Die
// Hitbox wächst per `::after` um 6 px nach oben und unten — OHNE Optik-Änderung.
// B11-D03 · allein stehend (erster/letzter Artikel) rutschte «Art. 2 ›» im
// Fuss-Paar nach LINKS (`justify-between` mit einem Kind): `ml-auto` am Nachfolger
// hält ihn rechts, wo er mit Nachbar steht.
// B11-D04 · die Gruppe als zweite Zeile, s. `nachbarBezeichnung`.
const PFEIL_KLASSEN = 'num relative inline-flex min-w-0 items-baseline gap-1 text-micro text-ink-500 no-underline hover:text-ink-900 after:absolute after:inset-x-0 after:-inset-y-1.5';

function Pfeil({ ziel, richtung, adresse }: {
  ziel: NachbarZiel;
  richtung: 'vor' | 'nach';
  /** W2·5m · Adress-Bauer des Einzelmodus (`../v3/einzelModus.einzelAdresse`).
   *  Fehlt er, bleibt es beim Anker im selben Dokument (Gesamtansicht). */
  adresse?: (token: string) => string;
}) {
  const wort = richtung === 'vor' ? 'Voriger Artikel' : 'Nächster Artikel';
  const { voll, gruppe } = nachbarBezeichnung(ziel, useContext(NachbarStrukturKontext));
  // W2·27: «aufgehoben» nur, wo es amtlich belegt ist — sonst «kein Text im
  // Snapshot» oder gar nichts. EIN Wort für alle Flächen (§5, darstellung.ts).
  const zustandsWort = leerstellenWort(ziel.zustand);
  // EIN Satz Attribute für beide Hüllen (§5): der zugängliche Name, die
  // Selektor-Marke und die Optik dürfen zwischen den zwei Modi nicht
  // auseinanderlaufen — sie sind dieselbe Bedienung an derselben Zeile.
  const attrs = {
    'data-nachbar': richtung,
    // WCAG 4.1.2 · der zugängliche Name benennt Richtung UND Ziel, nicht das
    // Zeichen. Der Aufhebungs-Zustand steht darin, weil er vor dem Sprung
    // bekannt sein muss (§8) — im Bild sagt ihn der Artikel selbst an.
    'aria-label': `${wort}: ${voll}${zustandsWort ? ` (${zustandsWort})` : ''}`,
    // Der volle Wortlaut für die Maus, wo die Darstellung kürzt (Gruppe oder lange Beschriftung).
    title: gruppe !== null || ziel.label.length > 28 ? voll : undefined,
    // ── KEIN `text-ink-400` FÜR DEN AUFGEHOBENEN NACHBARN ──────────────────
    // Der erste Wurf dämpfte ihn auf `ink-400`. Die a11y-Sonde hat das am
    // 14.9.2026 gefangen (`e2e/a11y.e2e.ts`, Reader BS-640.100, hell UND
    // dunkel): «color-contrast (serious) … 3.29 (#8d887e auf #faf7f2, 11 px)»
    // an `[href$="#art-241_bis"][data-nachbar="nach"]`. Dieselbe Lehre steht
    // wörtlich eine Datei weiter an der Zeile «· aufgehoben»
    // (`./ArtikelLeser.tsx`): ink-500 statt ink-400, weil das ESSENTIELLER
    // Link-Text ist und kein beiläufiger — ink-400 misst 3.2–3.6:1 und reisst
    // die 4.5:1 der WCAG 1.4.3. Ich habe den Fehler eine Datei daneben neu
    // gemacht; die bestehende Sonde hat ihn gehalten.
    //
    // DER ZUSTAND GEHT DAMIT NICHT VERLOREN — er war nie an der Farbe: er
    // steht im zugänglichen Namen («… (aufgehoben)»), und am Ziel selbst
    // sagt ihn der Artikel im Klartext. Farbe allein hätte ihn ohnehin nicht
    // tragen dürfen (DESIGN-REGLEMENT B3: Zeichen UND Wort, nie Farbe allein).
    className: richtung === 'nach' ? `${PFEIL_KLASSEN} ml-auto` : PFEIL_KLASSEN,
  };
  const inhalt = (
    <>
      {richtung === 'vor' && <span aria-hidden>‹</span>}
      <span aria-hidden className={richtung === 'nach' ? 'min-w-0 text-right' : 'min-w-0'}>
        <span data-nachbar-label className="block max-w-[20ch] truncate">{ziel.label}</span>
        {gruppe !== null && <span data-nachbar-gruppe className="block max-w-[20ch] truncate">{gruppe}</span>}
      </span>
      {richtung === 'nach' && <span aria-hidden>›</span>}
    </>
  );
  return adresse
    ? <Link to={adresse(ziel.token)} {...attrs}>{inhalt}</Link>
    : <a href={`#art-${ziel.token}`} {...attrs}>{inhalt}</a>;
}

/** Die Zeile selbst. Ohne beide Nachbarn (Erlass mit einem Eintrag) fällt sie weg. */
export function ArtikelNachbarn({ nachbarn, adresse, klassen }: {
  nachbarn: ArtikelNachbarn;
  /** W2·5m · s. `Pfeil` — ohne sie bleibt die Zeile Wort für Wort die von #854. */
  adresse?: (token: string) => string;
  /** W2·5m · zusätzliche Klassen für das Fuss-Paar der Artikel-Karte (B1: es
   *  steht dort MITTIG und nicht rechts, weil es auf dem Handy die Hauptbedienung
   *  ist — B9). Ohne Wert bleibt die Kopf-Anatomie unverändert. */
  klassen?: string;
}) {
  if (!nachbarn.vor && !nachbarn.nach) return null;
  return (
    <span
      {...{ [SUCH_META]: '' }}
      data-artikel-nachbarn
      // `ml-auto` schiebt die Einheit an das rechte Ende der Kopfzeile, die als
      // `flex flex-wrap` gesetzt ist: auf schmalen Fenstern rutscht sie auf eine
      // eigene Zeile unter die Artikelnummer statt sie zu quetschen.
      className={klassen ?? 'ml-auto inline-flex min-w-0 max-w-full items-baseline gap-3'}>
      {nachbarn.vor && <Pfeil ziel={nachbarn.vor} richtung="vor" adresse={adresse} />}
      {nachbarn.nach && <Pfeil ziel={nachbarn.nach} richtung="nach" adresse={adresse} />}
    </span>
  );
}
