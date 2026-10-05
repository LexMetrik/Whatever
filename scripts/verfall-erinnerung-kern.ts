// ─── Verfall-Erinnerung: reine Auswahl + Zettel-Text (kein IO, kein Date.now) ──
//
// Baut auf dem geteilten Register-Parser (verfall-parse.ts, §5). Der STICHTAG ist
// ein Parameter — die Funktionen sind deterministisch (§2); den Tagesbezug liefert
// nur das CLI (verfall-erinnerung.ts).
//
// Zweck: Erinnerungs-Zettel für Ablauftermine (Entscheid David 6.10.2026). Er
// ERINNERT, er entscheidet nicht: den neuen Wert prüft eine Session (§7), und
// er färbt nie rot — Rot bleibt dem Bundes-Gesetzestext vorbehalten (David 5.10.2026).
import { VORLAUF_TAGE, type Termin } from './verfall-parse.ts';

export type Faelligkeit = {
  termin: Termin;
  /** Tage bis zum Termin: 0 = heute, negativ = überschritten. */
  tage: number;
};

export type Auswahl = {
  stichtag: string;
  vorlaufTage: number;
  /** Termin liegt VOR dem Stichtag (gleiche Schwelle wie check:verfall «VERFALLEN»). */
  ueberschritten: Faelligkeit[];
  /** Termin liegt im Fenster [Stichtag, Stichtag + Vorlauf] (wie check:verfall «FÄLLIG»). */
  bald: Faelligkeit[];
};

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Ganze Tage von `von` bis `bis` (beide ISO «YYYY-MM-DD»), kalendarisch, ohne Zeitzone/DST. */
export function tageZwischen(von: string, bis: string): number {
  const tag = (s: string) => {
    const m = ISO.exec(s);
    if (!m) throw new Error(`Kein ISO-Datum: «${s}»`);
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000;
  };
  return Math.round(tag(bis) - tag(von));
}

/** Wählt aus den Registertermine diejenigen, die der Zettel nennen muss. Später → nicht enthalten. */
export function waehleErinnerungen(termine: Termin[], stichtag: string, vorlaufTage: number = VORLAUF_TAGE): Auswahl {
  const rang = (a: Faelligkeit, b: Faelligkeit) => a.termin.datum.localeCompare(b.termin.datum) || a.termin.label.localeCompare(b.termin.label);
  const alle: Faelligkeit[] = termine.map((termin) => ({ termin, tage: tageZwischen(stichtag, termin.datum) }));
  return {
    stichtag,
    vorlaufTage,
    ueberschritten: alle.filter((f) => f.tage < 0).sort(rang),
    bald: alle.filter((f) => f.tage >= 0 && f.tage <= vorlaufTage).sort(rang),
  };
}

/** 1-basierte Zeile des Termins im Register-Markdown (oder null) — der «Register-Anker». */
export function findeZeile(md: string, t: Termin): number | null {
  const zeilen = md.split('\n');
  const sauber = (s: string) => s.replace(/\*\*/g, '');
  const i = zeilen.findIndex((z) =>
    t.quelle === 'Tabelle' ? z.startsWith('|') && sauber(z).includes(t.label) : sauber(z).includes(t.label),
  );
  return i < 0 ? null : i + 1;
}

export type ZettelOptionen = {
  /** Register-Pfad relativ zum Repo-Wurzel. */
  registerPfad: string;
  /** «https://github.com/OWNER/REPO» für klickbare Zeilen-Anker; ohne → nur Pfad. */
  repoUrl?: string;
  /** Register-Markdown für die Zeilen-Anker; ohne → Anker nur über den Parameter-Namen. */
  registerMd?: string;
};

export function zettelTitel(a: Auswahl): string {
  return `Verfall-Erinnerung (${a.stichtag}): ${a.bald.length} Termine in ≤ ${a.vorlaufTage} Tagen, ${a.ueberschritten.length} überschritten`;
}

const kuerze = (s: string, n: number) => (s.length > n ? `${s.slice(0, n).trimEnd()} …` : s);

function zeile(f: Faelligkeit, o: ZettelOptionen): string {
  const t = f.termin;
  const n = o.registerMd ? findeZeile(o.registerMd, t) : null;
  const anker = n
    ? o.repoUrl
      ? `[${o.registerPfad}#L${n}](${o.repoUrl}/blob/main/${o.registerPfad}?plain=1#L${n})`
      : `${o.registerPfad}, Zeile ${n}`
    : `${o.registerPfad}, Eintrag «${t.label.slice(0, 60)}»`;
  const tage = (n: number) => `${n} ${n === 1 ? 'Tag' : 'Tagen'}`;
  const wann = f.tage < 0 ? `seit ${tage(-f.tage)} überschritten` : f.tage === 0 ? 'heute' : `in ${tage(f.tage)}`;
  // «Künftige Fassung …»-Termine (Fundstelle fedlex-cache.sh): fedlex-frische re-pinnt sie
  // automatisch — hier nur eine Zeile, damit ein Jahreswechsel den Zettel nicht aufbläht.
  if (t.fundstelle?.includes('fedlex-cache.sh')) {
    return `- \`${t.datum}\` (${wann}) — ${kuerze(t.label, 80)} · Re-Pin-Termin (Fedlex-Frische), Register: ${anker}`;
  }
  const kopf = t.quelle === 'Tabelle' ? `**${t.label}**` : `**Frist laut Register-Freitext:** ${kuerze(t.label, 160)}`;
  const was = t.quelle === 'Tabelle'
    ? 'Wert fachlich prüfen (§7, amtliche Quelle), dann Register nachführen (Spalte «Nächste Prüfung» + Stand-Zeile).'
    : 'Frist läuft aus: Folgefassung/Anschluss fachlich prüfen (§7), dann Register-Zeile nachführen.';
  const stelle = t.fundstelle ? ` · Fundstelle: ${t.fundstelle}` : '';
  return `- \`${t.datum}\` (${wann}) — ${kopf}${stelle}\n  - Register: ${anker}\n  - Zu tun: ${was}`;
}

/** Zettel-Text (Markdown). Überschrittene stehen zuoberst und deutlich markiert; nie ein Rot-Symbol. */
export function zettelText(a: Auswahl, o: ZettelOptionen): string {
  const teile: string[] = [];
  teile.push(
    `Erinnerung, kein Alarm: Stand ${a.stichtag}. Der neue Wert wird weiterhin von einer Session fachlich geprüft (§7) — dieser Zettel schliesst sich selbst, sobald das Register nachgeführt ist und kein Termin mehr im Fenster liegt.`,
  );
  if (a.ueberschritten.length > 0) {
    teile.push(
      `## ⚠ ÜBERSCHRITTEN (${a.ueberschritten.length})\n\nDiese Termine sind verstrichen, das Register ist nicht nachgeführt (Register-Konvention Ziff. 3: verfallene Prüfung = Deploy-Hindernis für die betroffene Vorlage/den Rechner). Zuerst abarbeiten.\n\n${a.ueberschritten.map((f) => zeile(f, o)).join('\n')}`,
    );
  }
  if (a.bald.length > 0) {
    teile.push(`## Fällig in den nächsten ${a.vorlaufTage} Tagen (${a.bald.length})\n\n${a.bald.map((f) => zeile(f, o)).join('\n')}`);
  }
  return teile.join('\n\n') + '\n';
}
