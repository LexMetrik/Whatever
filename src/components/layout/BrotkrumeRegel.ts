import type { Krume } from './OrtsAngabe';

// ═══ GA-1 (W2·24-DESIGN-IDENTITAET, 7.9.2026) · EINE ORTS-REGEL ══════════════
//
// BEFUND der Gesamtprüfung (Messung 6.9.2026 @1440, Screens `gesamt-a-09/11/12`,
// Befunde G4–G7): dieselbe Frage «wo bin ich?» wurde auf den vier Leser-/
// Werkzeug-Routen VIER Mal verschieden beantwortet — und in den obersten 300 px
// mehrfach mit demselben Wort:
//
//   Route            Reiter   Ortsleiste            H1                Rücksprung
//   ─────────────────────────────────────────────────────────────────────────────
//   Erlass-Leser     Kürzel   — (F0.9)              Kürzel            —
//   Entscheid        Nummer   Sektion › Kanton ›    Gericht + Nummer  —
//                             NUMMER                + Datum
//   Rechner          Titel    Sektion › TITEL       Titel             —
//   Vorlage          Titel    Sektion › TITEL       Titel             «← Zurück
//                                                                      zum Katalog»
//
// Gemessen: Vorlage 4 Nennungen desselben Titels in 260 px, Rechner die
// Brotkrume WORTGLEICH mit der H1 90 px darüber, Entscheid «HOR.2024.19» 3×.
// Der Erlass-Leser trug als einziger keine Brotkrume — genau so, wie es
// DESIGN-REGLEMENT §F0.9 («Keine Brotkrume im Leser») verlangt. Es weicht also
// nicht die Regel, sondern die drei Abweichungen von ihr.
//
// ── DIE REGEL, IN ZWEI SÄTZEN ───────────────────────────────────────────────
//  ①  DIE ORTSLEISTE NENNT DAS BLATT NIE. Das Blatt tragen der Reiter (oben)
//     und die H1 (unten) bereits, beide vollständig und beide lauter. Was
//     bleibt, ist der Weg zurück: die SEKTIONS-Krume, sonst nichts.
//  ②  GENAU EIN RÜCKWEG OBEN. Zeigt die Seite ihren Rückweg selbst, schweigt
//     die Leiste ganz. Heute betrifft das die Vorlagen (`vorlagen/wizard`
//     rendert «← Zurück zum Katalog» im Kopf); die Liste ist datengetrieben und
//     wächst mit, wenn eine weitere Familie einen eigenen Rückweg bekommt.
//
// ── WO SIE GILT (und wo bewusst nicht) ──────────────────────────────────────
// Sie gilt für die EINZELANSICHT (`layout/InhaltsKopf`). Der `PaneKopf` behält
// die volle Kette: im Split-View ist die Kopfzeile die IDENTITÄT des Fensters —
// dort steht keine H1 darüber, die das Blatt schon nennt, und mehrere Panes
// müssen in der Landmark-Liste unterscheidbar bleiben (Herleitung an
// `navLabel` in `./OrtsAngabe`). Die MELDUNG der Seiten (`KopfDaten.breadcrumb`)
// bleibt darum unverändert vollständig; gefiltert wird erst an der Leiste, die
// die Regel betrifft (§3: eine Darstellungsentscheidung, keine Datenfrage).
//
// Rein und deterministisch (§2), reine Darstellung (§3), EINE Stelle (§5).

/**
 * Routen-Familien, deren Seiten ihren Rückweg im eigenen Kopf zeigen. Erkannt
 * am ZIEL der Sektions-Krume, nicht am Pfad: das Ziel steht im Melde-Vertrag
 * (`KopfDaten.breadcrumb`) und ist damit dieselbe Quelle, aus der die Leiste
 * ohnehin liest (§5) — die Regel braucht keine zweite Pfad-Grammatik.
 */
const SEITE_ZEIGT_RUECKWEG_SELBST: readonly string[] = ['/vorlagen'];

/**
 * Die Krumen, die die Ortsleiste der Einzelansicht zeigt: höchstens die
 * Sektions-Krume, nie das Blatt — und gar keine, wo die Seite ihren Rückweg
 * selbst trägt.
 *
 * Eine Krume OHNE `to` kann kein Rückweg sein und fällt darum immer heraus
 * (ein Ort, den man nicht anspringen kann, ist keine Auskunft, sondern Text).
 */
export function ortsLeistenKrumen(krumen: Krume[] | undefined): Krume[] {
  const sektion = krumen?.find((k) => k.to);
  if (!sektion) return [];
  if (SEITE_ZEIGT_RUECKWEG_SELBST.includes(sektion.to!)) return [];
  return [sektion];
}
