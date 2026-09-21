// ─── check:plan Regel 15 · Kopf-Buchung: erledigter Kopf ↔ offene Unterposten ──
//
// ANLASS (20.9.2026, ROADMAP-Deckel-Aufräumen). Zwei Schritte standen auf
// `status: done` und trugen darunter zusammen **15 offene `- [ ]`-Posten**:
// `W2·24-DESIGN-IDENTITAET` (6) und `W3-TARIF-STAND` (8), dazu ein 15., der
// hinter den Feldtrenner `---` gerutscht war. Darunter eine Fachfrage, die seit
// dem 5.9.2026 auf David wartete («WARTET AUF DAVID (fachlich, §7): Verjährungs-
// revision 2020 … `verjaehrung.ts:547`»). Weil der KOPF `done` war, hat
// `plan:next` diese Arbeit **keiner Session je angezeigt** — `resolve()` liest
// den Status des Kopfes, nie die Checkboxen darunter. `check:plan` war die ganze
// Zeit grün: Regel 2 prüft Checkbox ↔ Status **desselben** Kopfes, Regel 4c die
// deps eines done-Schritts — beide sehen nach oben und zur Seite, keine nach
// unten. Schaden: Arbeit, die im Plan steht und im Plan unsichtbar ist — genau
// der §17-Massstab («dieselbe Störung darf einer künftigen Session nicht noch
// einmal Arbeitszeit kosten»), hier verschärft, weil ein Wartestand Davids
// darin verschwand.
//
// F17-ERWEITERUNG, KEINE NEUE KLASSE. Das ist die Gegenrichtung von Regel 14
// («Fahrplan sagt fertig, Plan sagt offen»), innerhalb des Plans: «Kopf sagt
// fertig, Unterposten sagen offen». Regel 14 hat ihre Richtungs-Grenze
// ausdrücklich deklariert; dieser Vorfall ist der Beleg, dass die Grenze real
// konsumiert wird. Nach der Ablage-Anleitung des Skills `lehren` (Ziff. 1/5)
// wird darum die bestehende Klasse eskaliert, nicht eine F18 danebengelegt.
//
// REGEL. Ein Kopf-Schritt (Checkbox auf Spalte 0) gilt als ERLEDIGT, wenn seine
// Checkbox `[x]` ist oder das an ihn gebundene `@meta` `status: done` trägt.
// Trägt sein Block dann eine eingerückte offene Checkbox (`- [ ]`), ist das ein
// Widerspruch ⇒ rot. Auflösung: abhaken (mit PR/SHA), in einen eigenen offenen
// Schritt herauslösen, oder den Kopf zurück auf offen setzen.
//
// ZUSCHNITT — empirisch am Dokument erhoben (ROADMAP.md, Stand 20.9.2026,
// 66 Kopf-Bullets, 65 `@meta`), nicht vermutet:
//
//   (a) «unter sich» = vom Kopf bis zum ersten Block-Ende. Block-Ende ist
//       CommonMark-treu: eine Bullet auf Spalte 0, eine ATX-Überschrift
//       (`#`…`######`) oder ein thematischer Trenner (`---`/`___`/`***`) am
//       Zeilenanfang. Eine Leerzeile beendet eine Liste in CommonMark NICHT
//       (loose list) und beendet hier darum auch den Block nicht — im Bestand
//       stehen zwischen Kopf-Prosa und Unterposten regelmässig Leerzeilen.
//   (b) EINRÜCKTIEFE egal, solange > 0: der Bestand mischt unter einem Kopf
//       keine Ebenen, und eine Tiefenschranke wäre eine Zahl ohne Beleg.
//   (c) Nur `[ ]` zählt als offen. `[~]` (wip), `[d]` (geparkt) und `[x]`
//       nicht — `[~]`/`[d]` unter einem erledigten Kopf wären ein eigener,
//       hier nicht erhobener Fall; CHECKBOX_STATUS in parse.ts bleibt die eine
//       Quelle der Zuordnung Checkbox → Status (§5).
//
// DEKLARIERTE GRENZEN (§6.7: ein Tor, dessen Grenze man nicht kennt, wiegt in
// Sicherheit) — jede davon ist am Bestand gemessen, nicht geschätzt:
//
//   1. HINTER DEM TRENNER wird nicht gesucht. Der 15. Posten des Anlassfalls
//      («Zurückgeholt aus der Chronik», Altstand Z. 734) stand hinter einem
//      `---` und wird von dieser Regel NICHT gefunden: nach CommonMark beginnt
//      dort eine neue Liste, der Posten hängt an gar keinem Schritt mehr. Das
//      ist eine eigene Fehlerklasse (verwaister Posten ohne Kopf) und bekommt,
//      wenn sie sich wiederholt, ein eigenes Tor — keine Ausnahme in diesem
//      hier. Erwartung und Messung stimmen darum auf 14, nicht 15.
//   2. NUR KOPF-SCHRITTE (Spalte 0). Ein eingerückter `- [x]`-Unterposten mit
//      noch tieferen offenen Posten wird nicht geprüft.
//   3. KEINE VERSCHACHTELUNG. Alle 65 `@meta` des Bestands stehen auf Einzug 2,
//      verschachtelte Unter-Schritte mit eigenem `@meta` gibt es nicht. Träte
//      einer auf, rechnete die Regel seine offenen Posten dem Dach-Kopf zu —
//      ein Fehlalarm, der laut ist und in einem Blick aufzulösen (Kopf-ID und
//      Zeilennummer stehen in der Meldung). Bewusst nicht vorab bewacht:
//      was nicht scheitern kann, wird nicht gebaut (§17-Gegengewicht).
//
// KEINE ALLOWLIST. Der Zuschnitt trägt den Bestand ohne eine einzige Ausnahme
// (Messung: HEAD `8f6fe6971` = 0 Treffer). Eine Allowlist wäre hier der Weg,
// genau die Posten unsichtbar zu machen, die die Regel sichtbar machen soll.
//
// GEBURTSBEWEIS (§6.7). Rot auf `0e4999b48` (ROADMAP-Fassung vor der
// Herauslösung) mit exakt den 14 vorhergesagten Treffern: 6 unter
// `W2·24-DESIGN-IDENTITAET` (Z. 585/587/590/591/592/594) und 8 unter
// `W3-TARIF-STAND` (Z. 723–730, darunter «WARTET AUF DAVID»). Grün auf
// `8f6fe6971` mit 0 Treffern. Der Rot-Fall ist zusätzlich in
// src/tests/plan-check.kopf-buchung.test.ts nachgebaut, damit die Regel
// prüfbar bleibt, wenn die reale ROADMAP längst sauber ist (F2e).
//
// KEIN `leseDatei`. Anders als Regel 11/13/14 liest diese Regel keine zweite
// Datei — Kopf und Unterposten stehen in derselben Zeilenmenge. Der Zweck der
// Injektion (dateisystemfreie, reine Prüffunktion) ist damit erfüllt, ohne
// einen Parameter zu führen, den niemand aufruft.

import { CHECKBOX_RE, checkboxAus, bulletEinzug } from './parse';

export type KopfProblem = { id: string | null; meldung: string };

/** `<!-- @meta id: … · status: … -->` — nur die zwei Felder, die Regel 15 braucht. */
const META_ID = /@meta\s+id:\s*(\S+)/;
const META_STATUS = /·\s*status:\s*(\w+)/;

/** Block-Ende nach (a): Überschrift oder thematischer Trenner am Zeilenanfang. */
const UEBERSCHRIFT = /^#{1,6}[ \t]/;
const TRENNER = /^(?:-{3,}|_{3,}|\*{3,})[ \t]*$/;

/** Beendet diese Zeile den Block eines Kopf-Schritts? (Bullet auf Spalte 0 prüft der Aufrufer.) */
function blockEnde(z: string): boolean {
  return UEBERSCHRIFT.test(z) || TRENNER.test(z);
}

export function pruefeKopfBuchung(md: string): KopfProblem[] {
  const probleme: KopfProblem[] = [];
  const zeilen = md.split(/\r?\n/);

  for (let k = 0; k < zeilen.length; k++) {
    if (!CHECKBOX_RE.test(zeilen[k]) || bulletEinzug(zeilen[k]) !== 0) continue;

    // Block einsammeln (Zuschnitt (a)) und dabei Status/ID des Kopfes aufnehmen.
    let id: string | null = null;
    let status: string | null = null;
    const offene: number[] = [];
    for (let j = k + 1; j < zeilen.length; j++) {
      const z = zeilen[j];
      if (blockEnde(z)) break;
      if (CHECKBOX_RE.test(z) && bulletEinzug(z) === 0) break;
      if (id === null && z.includes('<!-- @meta')) {
        id = META_ID.exec(z)?.[1] ?? null;
        status = META_STATUS.exec(z)?.[1] ?? null;
        continue;
      }
      if (CHECKBOX_RE.test(z) && checkboxAus(z) === '[ ]') offene.push(j);
    }

    // Erledigt = abgehakte Kopf-Checkbox ODER `status: done` im gebundenen @meta.
    // Beide Wege, weil beide im Bestand vorkommen: 65 Köpfe tragen ein @meta,
    // einer (`QS-BEWAEHRUNG`) ist nur abgehakt. Regel 2 hält die zwei Quellen
    // deckungsgleich; hier wird bewusst die VEREINIGUNG genommen, damit ein
    // @meta-loser Kopf nicht durchs Netz fällt.
    const erledigt = checkboxAus(zeilen[k]) === '[x]' || status === 'done';
    if (!erledigt) continue;

    for (const j of offene) {
      probleme.push({
        id,
        meldung:
          `Kopf "${id ?? zeilen[k].trim().slice(0, 40)}" (Z.${k + 1}) ist erledigt, trägt aber auf ` +
          `ROADMAP.md:${j + 1} einen offenen Posten «${zeilen[j].trim().slice(0, 70)}» — ` +
          `plan:next zeigt ihn keiner Session (der Status des Kopfes entscheidet). Entweder abhaken ` +
          `(mit PR/SHA), in einen eigenen offenen Schritt herauslösen, oder den Kopf zurück auf offen setzen.`,
      });
    }
  }
  return probleme;
}
