import { useMemo, useState } from 'react';
import {
  gmbhGruendungsunterlagen,
  type EinlageArt,
  type GmbhStatutKlausel,
  type Phase,
} from '../lib/gruendungsunterlagen';
import { Checkbox, Field, inputCls, NormLink } from '../components/vorlagen/ui';
import { BetragsFeld } from '../components/BetragsFeld';
import { NormText } from '../components/NormText';
import { GmbhDokumentmappe } from '../components/vorlagen/GmbhDokumentmappe';
import { KostenBundZeilen, MappenAbschnitt, MappenCheckliste, MappenSeite } from '../components/vorlagen/Dokumentmappe';
import { karte } from '../lib/startseiteConfig';
import { usePaneKlasse } from '../components/layout/PaneKontext';

// ─── Maske: GmbH-Gründung — Checkliste + Dokumentmappe (Plan 9b, 7.6.2026) ───
// Checkliste: deterministische Unterlagenliste (lib/gruendungsunterlagen.ts).
// Dokumentmappe (Ausbaustufe 9b, Auftrag David): Volldokumente aus denselben
// Weichen — Statuten/Errichtungsakt als ENTWURF (Beurkundungszwang Art. 777
// OR bleibt, §8-Gate), Erklärungen/Beschlüsse/HR-Anmeldung druckfertig.
// Wortlaut-Grundlage: bibliothek/recherche/gruendungsdokumente-wortlaute.md.
// Keine Rechtslogik hier (§3) — alles in lib/vorlagen/gruendungGmbhDokumente.ts.

const PHASEN: { id: Phase; titel: string; lead: string }[] = [
  { id: 'vorbereitung', titel: '1 · Vor dem Notariatstermin', lead: 'Beschaffen bzw. erstellen — die Urkundsperson muss diese Belege beim Termin vorliegen haben (Art. 777b OR).' },
  { id: 'beurkundung', titel: '2 · Beurkundung', lead: 'Entsteht beim Notariat; Wahlannahmen können direkt in der Urkunde erklärt werden.' },
  { id: 'anmeldung', titel: '3 · Handelsregister-Anmeldung', lead: 'Einreichung aller Belege nach Art. 71 HRegV.' },
  { id: 'nachEintrag', titel: '4 · Nach dem Eintrag', lead: 'Pflichten ab Rechtspersönlichkeit (Art. 779 OR).' },
];

const KLAUSELN: { id: GmbhStatutKlausel; label: string }[] = [
  { id: 'nachschuss', label: 'Nachschusspflicht' },
  { id: 'nebenleistung', label: 'Nebenleistungspflichten' },
  { id: 'konkurrenzverbot', label: 'Konkurrenzverbot' },
  { id: 'vorkaufsrecht', label: 'Vorhand-/Vorkaufs-/Kaufsrechte' },
  { id: 'stimmrechtNachAnteilen', label: 'Stimmrecht nach Anteilszahl' },
  { id: 'vetorecht', label: 'Vetorecht' },
];

export function VorlageGmbhGruendung() {
  const card = karte('gmbh-gruendung');
  const pk = usePaneKlasse();

  const [einlageArt, setEinlageArt] = useState<EinlageArt>('bar');
  const [besondereVorteile, setBesondereVorteile] = useState(false);
  const [gfGewaehlt, setGfGewaehlt] = useState(true);
  const [mehrereGf, setMehrereGf] = useState(false);
  const [weitereVertretung, setWeitereVertretung] = useState(false);
  const [optingOut, setOptingOut] = useState(true);
  const [eigeneBueros, setEigeneBueros] = useState(true);
  const [immobilienHauptzweck, setImmobilienHauptzweck] = useState(false);
  const [auslJurPerson, setAuslJurPerson] = useState(false);
  const [fremdwaehrung, setFremdwaehrung] = useState(false);
  const [bankInUrkunde, setBankInUrkunde] = useState(true);
  const [chVertretung, setChVertretung] = useState(true);
  const [klauseln, setKlauseln] = useState<GmbhStatutKlausel[]>([]);
  const [leistungen, setLeistungen] = useState('');

  const eingaben = useMemo(() => {
    const betrag = Number(leistungen.replace(/['’\s]/g, ''));
    return {
      einlageArt,
      besondereVorteile,
      gfGewaehlt,
      mehrereGeschaeftsfuehrer: mehrereGf,
      weitereVertretungsberechtigte: weitereVertretung,
      optingOut,
      eigeneBueros,
      immobilienHauptzweck,
      auslJurPersonGesellschafter: auslJurPerson,
      fremdwaehrung,
      bankInUrkundeGenannt: bankInUrkunde,
      chWohnsitzVertretung: chVertretung,
      statutKlauseln: klauseln,
      leistungenChf: leistungen.trim() === '' || Number.isNaN(betrag) ? undefined : betrag,
    };
  }, [einlageArt, besondereVorteile, gfGewaehlt, mehrereGf, weitereVertretung, optingOut, eigeneBueros, immobilienHauptzweck, auslJurPerson, fremdwaehrung, bankInUrkunde, chVertretung, klauseln, leistungen]);

  const ergebnis = useMemo(() => gmbhGruendungsunterlagen(eingaben), [eingaben]);

  const toggleKlausel = (k: GmbhStatutKlausel) =>
    setKlauseln((alt) => (alt.includes(k) ? alt.filter((x) => x !== k) : [...alt, k]));

  return (
    <MappenSeite karte={card} titel="GmbH-Gründungsunterlagen"
        badge="Checkliste + Dokumentmappe (Urkunde als Entwurf)"
        intro={<>
          Checkliste UND Dokumentmappe: Die Checkliste leitet die registerrechtlich verlangten
          Belege (abschliessend in Art. 71/72 HRegV, Art. 776–777c OR) aus Ihrer
          Gründungs-Konstellation ab. Die Dokumentmappe erzeugt daraus bei der Bargründung die
          Dokumente direkt — Statuten und Errichtungsakt als ENTWURF für die Urkundsperson
          (die öffentliche Beurkundung bleibt zwingend), Wahlannahme-/Domizilerklärungen,
          Beschlüsse und die Handelsregister-Anmeldung druckfertig.
        </>}>
      <MappenAbschnitt titel="Gründungs-Konstellation" className="space-y-4">
        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-4', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-4')}>
          <Field label="Liberierung">
            <select className={inputCls} value={einlageArt} onChange={(e) => setEinlageArt(e.target.value as EinlageArt)}>
              <option value="bar">Bareinlage</option>
              <option value="sacheinlage">Sacheinlage</option>
              <option value="verrechnung">Verrechnung</option>
              <option value="gemischt">Gemischt (bar + Sache/Verrechnung)</option>
            </select>
          </Field>
          <Field label="Revision">
            <select className={inputCls} value={optingOut ? 'opting' : 'rs'} onChange={(e) => setOptingOut(e.target.value === 'opting')}>
              <option value="opting">Verzicht (Opting-out, ≤ 10 Vollzeitstellen)</option>
              <option value="rs">Revisionsstelle bestellt</option>
            </select>
          </Field>
          {/* R2-F (Rest aus R2-E): «optional» gehört in die Prop (rendert
              « · optional»), und CHF-Beträge tragen das Haus-BetragsFeld mit
              Tausender-Apostroph. Der Wert-Vertrag bleibt: das Feld gibt den
              bereinigten Rohwert zurück, und die Auswertung oben streift
              Apostrophe ohnehin ab. */}
          <Field label="Leistungen der Gesellschafter (CHF)" optional>
            <BetragsFeld className={inputCls} placeholder="z. B. 20'000" value={leistungen} onChange={setLeistungen} />
          </Field>
        </div>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-x-6', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-x-6')}>
          <Checkbox checked={besondereVorteile} onChange={setBesondereVorteile} label="Besondere Vorteile für Gründer/Dritte" />
          <Checkbox checked={gfGewaehlt} onChange={setGfGewaehlt} label="Geschäftsführung beruht auf Wahl" />
          <Checkbox checked={mehrereGf} onChange={setMehrereGf} label={<>Mehrere Geschäftsführer:innen <span className="text-xs text-ink-500">(Dokumentmappe: aus der erfassten GF-Liste abgeleitet)</span></>} />
          <Checkbox checked={weitereVertretung} onChange={setWeitereVertretung} label="Weitere Vertretungsberechtigte (Direktor:innen/Prokura)" />
          <Checkbox checked={!eigeneBueros} onChange={(v) => setEigeneBueros(!v)} label="c/o-Adresse (kein eigenes Büro)" />
          <Checkbox checked={immobilienHauptzweck} onChange={setImmobilienHauptzweck} label="Immobilien-Haupttätigkeit" />
          <Checkbox checked={auslJurPerson} onChange={setAuslJurPerson} label="Ausländische juristische Person als Gesellschafterin" />
          <Checkbox checked={fremdwaehrung} onChange={setFremdwaehrung} label="Stammkapital in Fremdwährung" />
          <Checkbox checked={!bankInUrkunde} onChange={(v) => setBankInUrkunde(!v)} label="Bank wird in der Urkunde NICHT genannt" />
          <Checkbox checked={chVertretung} onChange={setChVertretung} label="Vertretungsberechtigte Person mit CH-Wohnsitz vorhanden" />
        </div>
        <div>
          <p className="text-body-s font-medium text-ink-900 mb-1.5">Statutarische Gestaltungen (nur mit Statutenklausel wirksam)</p>
          <div className="flex flex-wrap gap-x-6">
            {KLAUSELN.map((k) => (
              <Checkbox key={k.id} checked={klauseln.includes(k.id)} onChange={() => toggleKlausel(k.id)} label={k.label} />
            ))}
          </div>
        </div>
      </MappenAbschnitt>

      {ergebnis.blocker.map((b) => (
        <div key={b} className="lc-notice-warn">
          <p className="text-body-s font-medium">Eintragungshindernis</p>
          <p className="text-body-s"><NormText text={b} /></p>
        </div>
      ))}

      <MappenCheckliste phasen={PHASEN} unterlagen={ergebnis.unterlagen} />

      {ergebnis.statutenKlauseln.length > 0 && (
        <MappenAbschnitt titel="Pflichtklauseln in den Statuten">
          <ul className="space-y-2">
            {ergebnis.statutenKlauseln.map((k) => (
              <li key={k.norm} className="text-body-s text-ink-700">
                <span className="font-medium text-ink-900">{k.klausel}</span> <NormLink artikel={k.norm} /> — {k.kern}
              </li>
            ))}
          </ul>
        </MappenAbschnitt>
      )}

      <MappenAbschnitt titel="Kosten (Bund) und Hinweise">
        <ul className="lc-list space-y-2 text-body-s text-ink-700">
          <KostenBundZeilen emissionsabgabeChf={ergebnis.emissionsabgabeChf} />
          <li>
            Notariatsgebühren sind kantonal geregelt (z. B. BE: Gebührenverordnung BSG 169.81) und hier bewusst nicht beziffert; Bank-Sperrkonto je nach Institut (Praxisbeispiel ZKB: 0,5 ‰, mind. CHF 250).
          </li>
          {ergebnis.hinweise.map((h) => (
            <li key={h.slice(0, 40)}>{h}</li>
          ))}
        </ul>
        <p className="text-xs text-ink-500 max-w-reading">
          Amtliche Vorlagen: Musterstatuten und Muster-Erklärungen beim Handelsregisteramt des Kantons Zürich
          (zh.ch, notariate-zh.ch), Lex-Koller-Formular beim jeweiligen kantonalen Handelsregisteramt;
          elektronischer Weg über EasyGov (die Beurkundung bleibt beim Notariat).
        </p>
      </MappenAbschnitt>

      {/* Ausbaustufe 9b (7.6.2026): Volldokumente aus denselben Weichen */}
      <GmbhDokumentmappe weichen={eingaben}
        docxErlaubt={card?.modus === 'vorlage' && (card.output?.includes('docx') ?? false)} />
    </MappenSeite>
  );
}
