import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox, Field, inputCls, KopierButton } from '../components/vorlagen/ui';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { KONTAKT_EMPFAENGER, kontaktMailto, type KontaktEingaben } from '../lib/kontakt';

// Seite «Kontakt»: schlichtes Formular im Stil der Wizards. Kein Backend –
// der Versandweg ist zentral in lib/kontakt.ts konfiguriert (derzeit offen →
// ehrlicher Hinweis + deaktivierter Versand statt stillem Ins-Leere-Senden).
// Die Einwilligung verweist auf die Datenschutzerklärung (/datenschutz).

const DEFAULTS: KontaktEingaben = { name: '', email: '', betreff: '', nachricht: '' };

export function Kontakt() {
  const [e, setE] = useState<KontaktEingaben>(DEFAULTS);
  const [einwilligung, setEinwilligung] = useState(false);
  // §13/4 (C2): Ein leeres, noch nie berührtes Formular zeigt keine Fehler.
  // Erst nach der ersten Eingabe (oder Einwilligungs-Klick) blendet die Fehlerbox ein.
  const [beruehrt, setBeruehrt] = useState(false);
  const set = <K extends keyof KontaktEingaben>(k: K, v: string) => {
    setBeruehrt(true);
    setE((alt) => ({ ...alt, [k]: v }));
  };

  const emailOk = e.email.trim() === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.email.trim());
  const fehler: string[] = [];
  if (!e.nachricht.trim()) fehler.push('Nachricht eingeben.');
  if (!emailOk) fehler.push('E-Mail-Adresse prüfen (für die Antwort).');
  if (!einwilligung) fehler.push('Einwilligung zur Datenbearbeitung bestätigen.');

  const bereit = fehler.length === 0;
  const versandKonfiguriert = KONTAKT_EMPFAENGER !== null;

  // R3-α/B3-9 (31.8.2026): hier stand die letzte eigene Kopier-Mechanik der
  // App — eigener Zustand, eigene Verweildauer (2000 ms statt des Kanons 1600)
  // und die Erfolgs-Beschriftung «Kopiert ✓» ein zweites Mal ausgeschrieben.
  // Die frühere Test-Ausnahme (`NOCH_EIGEN` in eingabe-bausteine-r2e) ist damit
  // EINGEZOGEN statt bewacht (§17-Gegengewicht). Nur der ZUSAMMENGESETZTE Text
  // bleibt hier — er ist der Inhalt, nicht die Mechanik.
  const kopierText = `Betreff: ${e.betreff || '–'}\n\n${e.nachricht}\n\nName: ${e.name || '–'}\nAntwort an: ${e.email || '–'}`;

  return (
    <div className="space-y-10">
      {/* W2·31-BILDSCHIRMBREITE B12 (25.9.2026): kein Deckel mehr am Seiten-
          Container. Er trug `max-w-reading` samt Titelband — die Seite stand als
          640-px-Spalte links im 1120-px-Rahmen (Rand @1920 424 links / 856
          rechts). Jetzt spannt das Band den Rahmen wie auf /methodik,
          /abdeckung, /einstellungen und der Fehlerseite; das Intro trägt
          seinen Deckel selbst (`SeitenKopf`: reading), das Formular unten. */}
      <SeitenKopf overline="Kontakt" titel="Kontakt aufnehmen"
        intro="Fragen, Korrekturen zu einer Berechnung oder einem Baustein, Vorschläge für neue Rechner und Vorlagen – Hinweise auf Fehler sind besonders willkommen." />

      {/* W2·29-WERKBANK-REST S3 (25.9.2026): hier stand die letzte
          Kasten-Karte der App (`bg-surface-raised rounded-2xl border`, 16 px —
          ausserhalb der Radien 4·8·10·14, F0.5; Trennung über Kasten statt
          Linie, F0.6). Das Formular steht jetzt in der Gruppen-Anatomie der
          Einstellungen: Tinten-Linie oben (`.meta-abschnitt`), kein Rahmen.
          Felder, Einwilligung, Fehlerbox, Hinweis und Knöpfe unverändert. */}
      {/* B12: das Formular behält das Lesemass (Felder sind keine Wand). */}
      <div className="meta-abschnitt space-y-5 max-w-reading">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" optional>
            <input className={inputCls} value={e.name} onChange={(ev) => set('name', ev.target.value)} autoComplete="name" />
          </Field>
          <Field label="E-Mail (für die Antwort)">
            <input type="email" className={inputCls} value={e.email} onChange={(ev) => set('email', ev.target.value)} autoComplete="email" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Betreff" optional>
              <input className={inputCls} value={e.betreff} onChange={(ev) => set('betreff', ev.target.value)} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Nachricht">
              <textarea className={inputCls} rows={6} value={e.nachricht} onChange={(ev) => set('nachricht', ev.target.value)} />
            </Field>
          </div>
        </div>

        <Checkbox
          checked={einwilligung}
          onChange={(v) => { setBeruehrt(true); setEinwilligung(v); }}
          label={
            <span>
              Ich willige ein, dass meine Angaben zur Bearbeitung der Anfrage verwendet werden.
              Details in der <Link to="/datenschutz" className="text-brass-700 underline hover:text-brass-600">Datenschutzerklärung</Link>.
            </span>
          }
        />

        {beruehrt && fehler.length > 0 && (
          <div role="alert" className="lc-notice lc-notice-danger space-y-0.5">
            {fehler.map((f, i) => <p key={i} className="text-body-s text-danger-700">• {f}</p>)}
          </div>
        )}

        {!versandKonfiguriert && (
          <p className="lc-notice-warn text-body-s">
            Der Versandweg dieses Formulars wird derzeit eingerichtet. Bis dahin können Sie Ihre
            Nachricht kopieren und auf anderem Weg übermitteln.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-line">
          {versandKonfiguriert ? (
            <a
              href={bereit ? kontaktMailto(KONTAKT_EMPFAENGER!, e) : undefined}
              aria-disabled={!bereit}
              className={`lc-btn-primary no-underline ${bereit ? '' : 'pointer-events-none opacity-50'}`}>
              Nachricht senden
            </a>
          ) : (
            <button type="button" disabled className="lc-btn-primary" title="Versandweg noch nicht eingerichtet">
              Nachricht senden
            </button>
          )}
          {/* `className` bleibt `lc-btn-outline` (ohne `lc-btn-sm`): der Knopf
              steht in der Fuss-Zeile neben dem Primärknopf «Nachricht senden»
              und trägt dessen Höhe — Beschriftung und Erfolgs-Quittung kommen
              aus dem Baustein. */}
          <KopierButton text={kopierText} gegenstand="Nachricht"
            className="lc-btn-outline" disabled={!e.nachricht.trim()} />
        </div>

        <p className="text-xs text-ink-500">
          Es gibt kein Konto und keine serverseitige Speicherung der Formulareingaben durch
          LexMetrik; der Versand erfolgt über Ihr E-Mail-Programm.
        </p>
      </div>
    </div>
  );
}
