// Regression NT-01 (HN-05 aus der Herz-und-Nieren-Prüfung 24.9.2026, W2·27-BUND-FERTIG):
// Fedlex zeichnet einzelne Absätze mit Varianten der Absatz-Klasse aus — «absatz09pt» (Kleindruck-Absatz,
// meist Fortsetzungs-/Strafdrohungs-Zeilen einer Aufzählung) und «absatzkurs» (kursiv, dazu die
// Absatznummer in einem <span>-Wrapper). Die wortgebundene Alt-1-Regex (\babsatz\b) traf beides NICHT:
// die Absätze fielen stumm aus dem Snapshot (StHG 56 Abs. 1: unrechtmässige Rückerstattung + die ganze
// Strafdrohung; VZV 143 Ziff. 3; VZG 119 Ziff. 1; OHG 49 Einleitungssatz; UVPV 13 Abs. 3 und 4;
// ParlG 3 Abs. 4/5 Eid-/Gelübde-Wortlaut; VBB 10). Fixtures = Original-Markup der gepinnten Fedlex-HTMLs
// (Erzeugung: siehe .helfer.ts), Erwartung = amtlicher Wortlaut. Rot-Beweis gegen den alten Code: PR-Text.
import { describe, expect, it } from 'vitest';
import { extrahiereArtikel } from '../../scripts/normtext/extrahiere-fedlex';
import { NT01_ARTIKEL } from './normtext-absatz-klassen-nt01.helfer';

const bloecke = (erlass: string) => {
  const { token, html } = NT01_ARTIKEL[erlass];
  return extrahiereArtikel(html, token)!.bloecke;
};
const texte = (erlass: string): string[] => bloecke(erlass).map((b) => b.text);

describe('NT-01 · Absatz-Klassen-Varianten (absatz09pt / absatzkurs) gehen nicht mehr verloren', () => {
  it('StHG Art. 56 Abs. 1: Bst. «unrechtmässige Rückerstattung» und die Strafdrohung stehen im Text', () => {
    const t = texte('STHG');
    expect(t.slice(0, 4)).toEqual([
      'Wer als Steuerpflichtiger vorsätzlich oder fahrlässig bewirkt, dass eine Veranlagung zu Unrecht unterbleibt oder dass eine rechtskräftige Veranlagung unvollständig ist,',
      'wer als zum Steuerabzug an der Quelle Verpflichteter vorsätzlich oder fahrlässig einen Steuerabzug nicht oder nicht vollständig vornimmt,',
      'wer vorsätzlich oder fahrlässig eine unrechtmässige Rückerstattung oder einen ungerechtfertigten Erlass erwirkt,',
      // Fussnoten-Marker «207» leakt nicht in den Satz
      'wird mit einer Busse entsprechend seinem Verschulden bestraft, die einen Drittel bis das Dreifache, in der Regel das Einfache der hinterzogenen Steuer beträgt.',
    ]);
    expect(bloecke('STHG').slice(0, 4).map((b) => b.absatz)).toEqual(['1', null, null, null]);
  });

  it('VZV Art. 143 Ziff. 3: alle drei Tatbestände vor der Strafdrohung, unter Ziffer 3', () => {
    const b = bloecke('VZV');
    const z3 = b.filter((x) => x.ziffer === '3').map((x) => x.text);
    expect(z3).toHaveLength(5);
    expect(z3[1]).toBe('wer Duplikate von Ausweisen beim Wiederauffinden des Originals der Behörde nicht fristgemäss zurückgibt,');
    expect(z3[2]).toMatch(/^wer als Inhaber des Führerausweises der Kategorie A, beschränkt auf 25 kW, ein Motorrad .* nicht hat im Führerausweis eintragen lassen,$/);
    expect(z3[4]).toBe('wird mit Busse bis 100 Franken bestraft.');
  });

  it('VZG Art. 119: Grundsatz 1 («Diejenigen Grundpfandforderungen …») steht zwischen Einleitung und Grundsatz 2', () => {
    const t = texte('VZG');
    expect(t).toHaveLength(4);
    expect(t[1]).toMatch(/^Diejenigen Grundpfandforderungen, denen keine nur auf einzelnen Grundstücken haftende Pfandforderungen im Range vorgehen,/);
    expect(t[2]).toMatch(/^Gehen dagegen der Gesamtpfandforderung/);
  });

  it('OHG Art. 49: der kursive Einleitungssatz steht vor dem «…»-Absatz (Fussnoten-Marker leakt nicht)', () => {
    expect(texte('OHG')).toEqual([
      'Unabhängig davon, ob das neue ELG oder das neue OHG zuerst in Kraft tritt, lauten die nachstehenden Bestimmungen des neuen OHG mit Inkrafttreten des später in Kraft tretenden Gesetzes sowie bei gleichzeitigem Inkrafttreten wie folgt:',
      '…',
    ]);
  });

  it('UVPV Art. 13 Abs. 3 und 4: Absatznummer im <span>-Wrapper wird zur Nummer, nicht zum Text', () => {
    const b = bloecke('UVPV');
    expect(b.map((x) => x.absatz)).toEqual(['1', '2', '3', '4']);
    expect(b[2].text).toBe(
      'Sie beurteilt, ob die geplante Anlage den Vorschriften über den Schutz der Umwelt (Art. 3) entspricht. Bei Projekten, zu denen nach dem Anhang das BAFU anzuhören ist, nimmt dieses eine summarische Beurteilung vor.',
    );
    expect(b[3].text).toBe(
      'Die Umweltschutzfachstelle teilt das Ergebnis ihrer Beurteilung der zuständigen Behörde mit; wenn nötig beantragt sie Auflagen und Bedingungen.',
    );
  });

  it('ParlG Art. 3 Abs. 4/5: Eid- und Gelübde-Wortlaut stehen nach «lautet:»', () => {
    const t = texte('PARLG');
    expect(t).toHaveLength(7);
    expect(t[3]).toBe('Der Eid lautet:');
    expect(t[4]).toBe('«Ich schwöre vor Gott dem Allmächtigen, die Verfassung und die Gesetze zu beachten und die Pflichten meines Amtes gewissenhaft zu erfüllen.»');
    expect(t[5]).toBe('Das Gelübde lautet:');
    expect(t[6]).toBe('«Ich gelobe, die Verfassung und die Gesetze zu beachten und die Pflichten meines Amtes gewissenhaft zu erfüllen.»');
  });

  it('VBB Art. 10: die vier 09pt-Zeilen (Daten der Kolonnen, Erledigungs-Buchstabe) stehen in Dokumentreihenfolge', () => {
    const t = texte('VBB');
    const idx = (s: string) => t.findIndex((x) => x.startsWith(s));
    const reihe = [
      'Datum des Eingangs des Betreibungsbegehrens.',
      'Datum der Absendung und Zustellung des Zahlungsbefehls;',
      'Datum des Rechtsvorschlags,',
      'Datum der Übersendung des Zahlungsbefehls an den Gläubiger.',
      'Datum der provisorischen Rechtsöffnung.',
      'Datum der definitiven Rechtsöffnung.',
      'Datum des Eingangs des Begehrens um Fortsetzung der Betreibung.',
    ].map(idx);
    expect(reihe.every((i) => i >= 0)).toBe(true);
    expect([...reihe].sort((a, b) => a - b)).toEqual(reihe);
    const erledigung = idx('Angabe der Art der Erledigung der Betreibung, durch einen Anfangsbuchstaben:');
    expect(erledigung).toBeGreaterThan(idx('Datum der Übersendung der Konkursandrohung.'));
    expect(t[erledigung + 1]).toBe('Es bedeuten:');
  });
});

describe('NT-01 · Grenzen (bewusst NICHT mitgenommen)', () => {
  const rumpf = (p: string): string =>
    `<html><body><article id="art_5"><a name="a5"></a><h6 class="heading"><a href="#art_5"><b>Art. 5</b> Test</a></h6><div class="collapseable">` +
    `<p class="absatz man-space-before-4"><sup>1</sup>&nbsp;Erster Absatz.</p>${p}</div></article></body></html>`;
  const t = (p: string): string[] => extrahiereArtikel(rumpf(p), '5')!.bloecke.map((b) => b.text);

  it('absatz8pt OHNE Sternchen (Inkrafttreten-Kleindruck, NT-10) bleibt unverändert nicht übernommen', () => {
    expect(t('<p class="absatz8pt man-space-before-3">Art. 5 Abs. 2: 1. Januar 2027</p>')).toEqual(['Erster Absatz.']);
  });

  it('eine Klasse, die nur mit «absatz» BEGINNT (z. B. absatzfoo), ist keine Absatz-Variante', () => {
    expect(t('<p class="absatzfoo">Fremder Text.</p>')).toEqual(['Erster Absatz.']);
  });

  it('absatz09pt und absatzkurs ohne Nummer werden als nummernloser Fortsetzungs-Block übernommen', () => {
    expect(t('<p class="absatz09pt man-space-before-0">Kleindruck-Zeile.</p><p class="absatzkurs man-font-style-italic">Kursive Zeile.</p>')).toEqual([
      'Erster Absatz.',
      'Kleindruck-Zeile.',
      'Kursive Zeile.',
    ]);
  });
});
