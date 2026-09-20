// scripts/plan/notizen.ts — Session-Notizen-Datei sichtbar machen (§17,
// Weisung David 15.9.2026, Spec docs/token-oekonomie/session-notizen-vorlage.md).
//
// Zweck: Nebenfunde und Lehren-Kandidaten leben zwischen Agentenbericht und
// Session-Ende sonst nur im Chat-Verlauf — Kompaktierung (autoCompactWindow
// 400k) oder eine Übergabe an eine neue Session verliert sie. Die Notizen-
// Datei liegt im Haupt-Checkout (`.claude/notizen/`, gitignored) und überlebt
// damit Worktree-Löschung und Übergabe; `notizenBefund` zählt nur offene und
// erledigte `- [ ]`/`- [x]`-Zeilen — reine, deterministische Logik (§2), kein
// FS-Zugriff. `leseNotizen` ist die dünne FS-Hülle (Trennung wie
// scripts/normtext/check-confidence.ts + confidence-logik.ts).
//
// KEIN Gate-Tor (§17-Gegengewicht): eine Pflicht-Schranke würde parallele
// Sessions mit eigenen, noch offenen Notizen gegenseitig blockieren. Die
// Ausgabe ist ein Hinweis in `plan:next`, kein Fehlschlag.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** Befund für eine Notizen-Datei: Name plus Anzahl offener/erledigter Posten. */
export interface NotizenBefund {
  name: string;
  offen: number;
  erledigt: number;
}

/** Eine gelesene Notizen-Datei (Dateiname + Rohinhalt), Eingabe für notizenBefund. */
export interface NotizenDatei {
  name: string;
  inhalt: string;
}

/**
 * Reine Zähl-Logik: pro Datei die Anzahl `- [ ]`- und `- [x]`-Zeilen (auch
 * eingerückt, wie in der Vorlage — drei Abschnitte mit `- [ ]`-Listen).
 * Gross-/Kleinschreibung des Markers ist amtlich `x` (Vorlage), `X` wird
 * defensiv mitgezählt.
 */
export function notizenBefund(dateien: NotizenDatei[]): NotizenBefund[] {
  const OFFEN = /^\s*-\s\[ \]/;
  const ERLEDIGT = /^\s*-\s\[[xX]\]/;
  return dateien.map(({ name, inhalt }) => {
    const zeilen = inhalt.split('\n');
    let offen = 0;
    let erledigt = 0;
    for (const z of zeilen) {
      if (OFFEN.test(z)) offen++;
      else if (ERLEDIGT.test(z)) erledigt++;
    }
    return { name, offen, erledigt };
  });
}

/**
 * FS-Hülle: liest alle `*.md`-Dateien aus `dir` (Standard: Notizen-Verzeichnis
 * im Haupt-Checkout). Kein Verzeichnis ⇒ leere Liste, **nie werfen** — der
 * Pflicht-Einstieg `plan:next` darf an einer fehlenden/kaputten Ablage nicht
 * scheitern (Muster wie `lage.ts`/`leseZeitreihe`).
 *
 * Nicht-`.md`-Dateien (z.B. eine `.patch`-Beilage) filtert `endsWith('.md')`
 * bereits vollständig heraus — bewusst beibehalten (Befund 20.9.2026): sie
 * sind weder Übergabe-Prosa noch Checkbox-Liste, `notizenBefund`/`notizenZeilen`
 * kennen kein Format dafür. Sie bleiben in `plan:next` unsichtbar (Beilage,
 * ignoriert), statt sie roh als Text zu zählen.
 */
export function leseNotizen(dir: string): NotizenDatei[] {
  try {
    if (!existsSync(dir)) return [];
    return readdirSync(dir)
      .filter((n) => n.endsWith('.md'))
      .sort()
      .map((name) => ({ name, inhalt: readFileSync(join(dir, name), 'utf8') }));
  } catch {
    return [];
  }
}

/**
 * Pfad des Notizen-Verzeichnisses aus dem aktuellen Arbeitsverzeichnis
 * (funktioniert gleich aus jedem Worktree — `git rev-parse --git-common-dir`
 * zeigt immer auf das `.git` des Haupt-Checkouts, dessen Elternverzeichnis der
 * Haupt-Checkout selbst ist).
 *
 * Pfad-Bug (Befund 20.9.2026, F17): im HAUPT-Checkout selbst liefert
 * `git rev-parse --git-common-dir` einen RELATIVEN Wert (z.B. `.git` an der
 * Repo-Wurzel, `../.git` aus einem Unterordner) — nur in Worktrees ist der
 * Wert absolut. Die alte Regex strippte nur den absoluten Fall; beim
 * relativen `.git` (kein Pfadtrenner davor) griff sie nicht, `hauptCheckout`
 * blieb `.git`, und `.git/.claude/notizen` existiert nie ⇒ Befund still `[]`
 * im Haupt-Checkout (gemessen: 0 Notizen-Zeilen dort vs. 7 im Worktree bei
 * identischem `.claude/notizen`-Inhalt). Fix: `gitCommonDir` erst gegen
 * `cwd` absolut auflösen (deckt relativ/absolut/Worktree-Form gleich ab —
 * `--git-common-dir` zeigt aus einem Worktree ohnehin bereits auf das
 * Haupt-`.git`, nie auf `.git/worktrees/<name>`, das liefert nur
 * `--git-dir`).
 */
export function notizenVerzeichnis(gitCommonDir: string, cwd: string): string {
  const gitCommonDirAbs = resolve(cwd, gitCommonDir);
  // gitCommonDirAbs ist z.B. "/Users/david/Developer/LexMetrik/.git" — das
  // Elternverzeichnis davon ist der Haupt-Checkout.
  const hauptCheckout = gitCommonDirAbs.replace(/[/\\]\.git[/\\]?$/, '');
  return join(hauptCheckout, '.claude', 'notizen');
}

/**
 * Formatiert die Befunde als `plan:next`-Zeilen (leere Liste ⇒ keine Zeile,
 * still).
 *
 * Fehlmeldung-Fix (Befund 20.9.2026, F17): eine Datei OHNE jede Checkbox
 * (`offen === 0 && erledigt === 0` — reine Übergabe-Prosa, z.B. ein
 * Prüfauftrag im Fliesstext) galt zuvor als «abgearbeitet, löschen», weil
 * die Zeile nur `offen > 0` prüfte. Real betroffen war u.a. ein neu zu
 * dispatchender Prüfauftrag ohne Checkboxen-Liste. Eine Datei gilt jetzt nur
 * dann als abgearbeitet, wenn sie MINDESTENS eine Checkbox trägt und alle
 * erledigt sind (`erledigt > 0 && offen === 0`); ohne jede Checkbox ist sie
 * unklassifiziert und wird zum Lesen markiert statt zum Löschen.
 */
export function notizenZeilen(befunde: NotizenBefund[]): string[] {
  return befunde.map((b) => {
    if (b.offen > 0) {
      return `📝 Session-Notizen: ${b.name} — ${b.offen} offen · übernehmen oder abarbeiten (Skill bauschritt Station A/E)`;
    }
    if (b.erledigt > 0) {
      return `📝 Session-Notizen: ${b.name} — abgearbeitet, löschen`;
    }
    return `📝 Session-Notizen: ${b.name} — Übergabe/Notiz ohne Checkboxen — lesen`;
  });
}
