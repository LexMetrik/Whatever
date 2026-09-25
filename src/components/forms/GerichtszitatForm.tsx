import { useState } from 'react';
import {
  formatiereGerichtszitat, BGE_TEILE,
  type GerichtszitatInput, type BgeTeil,
} from '../../lib/gerichtszitat';
import { PflichtDisclaimer } from '../PflichtDisclaimer';
import { ErgebnisPlatzhalter, Field, inputCls, FehlerBox, KopierButton } from '../vorlagen/ui';
import { SelectionGrid } from '../ui/SelectionGrid';
import { DatumsFeld } from '../DatumsFeld';
import { NormText } from '../NormText';

// ─── Amtlicher Gerichts-Zitierer (BGE / BGer) ───────────────────────────────
// Gerichts-Baustein-Set (ROADMAP W2·7). Reiner Struktur-Formatierer (§2/§8):
// er prüft die FORM der Fundstelle und setzt sie nach der Plattform-Zitier-
// konvention (src/lib/konventionen.ts) zusammen. Bewusst KEIN Berechnungs-
// ergebnis (Ausnahme DESIGN-REGLEMENT §R-12): das Werkzeug liefert
// eine Zitat-Zeichenkette, keinen Rechtswert — darum kein ErgebnisAnzeige/PDF.

type Typ = 'bge' | 'bger';

const TYPEN: { code: Typ; label: string; sub: string }[] = [
  { code: 'bge', label: 'BGE (amtliche Sammlung)', sub: 'Leitentscheid: Band · Teil · Seite' },
  { code: 'bger', label: 'BGer (Geschäftsnummer)', sub: 'Nicht publiziert: Nummer · Datum' },
];

// R3-α/B3-9 (31.8.2026): hier stand ein lokaler `KopierKnopf` — dieselbe
// Handlung wie der geteilte `KopierButton`, aber mit eigener Mechanik
// (1500 ms statt des Kanons), ohne das Kanon-Häkchen («Kopiert» statt
// «Kopiert ✓») und ohne den Gegenstand im Namen («Kopieren» liess offen, WAS
// in der Zwischenablage landet). Die Kopie ist gelöscht, nicht angeglichen
// (§5/§10); die Optik `lc-btn-outline lc-btn-sm` ist der Default des Bausteins
// und damit unverändert.

export function GerichtszitatForm() {
  const [typ, setTyp] = useState<Typ>('bge');
  // BGE-Felder
  const [band, setBand] = useState('');
  const [teil, setTeil] = useState<BgeTeil>('III');
  const [seite, setSeite] = useState('');
  // BGer-Felder
  const [aktenzeichen, setAktenzeichen] = useState('');
  const [datum, setDatum] = useState('');
  // gemeinsam
  const [erwaegung, setErwaegung] = useState('');

  const input: GerichtszitatInput = typ === 'bge'
    ? { typ: 'bge', band, teil, seite, erwaegung }
    : { typ: 'bger', aktenzeichen, datum, erwaegung };
  const beruehrt = typ === 'bge' ? !!(band || seite) : !!(aktenzeichen || datum);
  const ergebnis = formatiereGerichtszitat(input);

  return (
    <div className="space-y-6 lc-rechner-spalten">
      <PflichtDisclaimer
        kurz="Formatiert die eingegebene Fundstelle nach der Zitierkonvention – ohne zu prüfen, ob der Entscheid existiert oder was er sagt."
        text="Der Zitierer setzt nur die eingegebenen Angaben zu einer Fundstelle zusammen (BGE bzw. BGer). Er ist keine Rechtsprechungs-Recherche: Fundstelle und Aussage sind an der amtlichen Quelle zu prüfen." />

      <SelectionGrid
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        items={TYPEN.map((t) => ({ code: t.code, label: t.label, sub: t.sub }))}
        value={typ}
        onSelect={(code) => setTyp(code as Typ)}
      />

      {typ === 'bge' ? (
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Band" hint="z. B. 140">
            <input className={inputCls} inputMode="numeric" value={band} onChange={(e) => setBand(e.target.value)} placeholder="140" />
          </Field>
          {/* LM-081 (B19): Hilfetext ergänzt — «Teil» war das einzige Feld der
              Zeile ohne Hilfetext, dadurch unterschiedlich hohe Blöcke neben
              Band/Seite. Wortlaut aus dem Datei-Kopfkommentar von
              lib/gerichtszitat.ts (BGE_TEILE). Die Breite von «Erwägung»
              bleibt unverändert — `sm:max-w-[10rem]` ist dasselbe Muster wie
              die Kanton-Selects in AllgemeineFristForm/ZustaendigkeitForm für
              kurze Werte, kein Bug. */}
          <Field label="Teil" hint="z. B. III (Zivilrecht)">
            <select className={inputCls} value={teil} onChange={(e) => setTeil(e.target.value as BgeTeil)}>
              {BGE_TEILE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Seite" hint="z. B. 409">
            <input className={inputCls} inputMode="numeric" value={seite} onChange={(e) => setSeite(e.target.value)} placeholder="409" />
          </Field>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Geschäftsnummer" hint="z. B. 5A_691/2023">
            <input className={inputCls} value={aktenzeichen} onChange={(e) => setAktenzeichen(e.target.value)} placeholder="5A_691/2023" />
          </Field>
          <Field label="Urteilsdatum">
            <DatumsFeld value={datum} onChange={setDatum} className={inputCls} />
          </Field>
        </div>
      )}

      <Field label="Erwägung" optional hint="z. B. 4.3 – erscheint als «E. 4.3»">
        <input className={inputCls + ' sm:max-w-[10rem]'} value={erwaegung} onChange={(e) => setErwaegung(e.target.value)} placeholder="4.3" />
      </Field>

      {beruehrt && ergebnis.status === 'unzulaessig' && <FehlerBox fehler={ergebnis.fehler} />}

      {/* LM-161 (B6/K-15): der Ausgangszustand endete bisher direkt hier — kein
          Ergebnisblock, kein Platzhalter, kein Hinweis (anders als z. B. der
          Streitwert-Rechner, W2·10-UI-NAV/N0d·W1). Geteilter Baustein (§5/§10),
          gezeigt genau dann, wenn weder die FehlerBox noch die Fundstelle
          darunter greift — nie gleichzeitig mit einer der beiden. */}
      {!(beruehrt && ergebnis.status === 'unzulaessig') && !(ergebnis.status === 'ok' && ergebnis.zitat) && (
        <ErgebnisPlatzhalter was="Band und Seite (bzw. Geschäftsnummer und Datum) eingeben — hier erscheint die formatierte Fundstelle." />
      )}

      {ergebnis.status === 'ok' && ergebnis.zitat && (
        <div className="lc-panel p-4 space-y-3" data-ergebnisplatz="">
          <p className="lc-overline text-brass-700">Fundstelle</p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-body font-medium text-ink-900 num">{ergebnis.zitat}</p>
            <KopierButton text={ergebnis.zitat} gegenstand="Fundstelle" />
          </div>
          {ergebnis.langform && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-line">
              <div>
                <p className="lc-overline">Langform</p>
                <p className="text-body-s text-ink-700 num">{ergebnis.langform}</p>
              </div>
              <KopierButton text={ergebnis.langform} gegenstand="Langform" />
            </div>
          )}
          {ergebnis.hinweise.map((h, i) => (
            <p key={i} className="text-body-s text-ink-600"><NormText text={h} /></p>
          ))}
        </div>
      )}
    </div>
  );
}
