import { useState } from 'react';
import { usePaneKlasse } from '../layout/PaneKontext';
import { Checkbox, EckdatenKachel, Field, GruppenTitel, inputCls, NormLink } from '../vorlagen/ui';
import { NormText } from '../NormText';
import { Link } from 'react-router-dom';
import { bgerRechtswegLink } from '../../lib/rechnerPermalinks';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { SelectionGrid } from '../ui/SelectionGrid';
import { ErgebnisExport } from '../ErgebnisExport';
import { permalinkKodieren, permalinkLesen } from '../../lib/permalink';
import {
  STRAF_LINK_SPEC, STRAF_RM_LINK_SPEC,
  type StrafLinkZustand, type StrafRmLinkZustand, type StrafTeilAnliegen,
} from './zustaendigkeitLinkSpecs';
import { KANTONE } from '../../lib/kantone';
import type { Kanton } from '../../types/legal';
import {
  bestimmeStrafZustaendigkeit, strafZustaendigkeitBericht,
  type StrafKaskade32, type StrafSpezialforum, type StrafTatortLage, type StrafBeteiligung,
} from '../../lib/strafZustaendigkeit';
import {
  bestimmeStrafRechtsmittel, strafRechtsmittelBericht,
  type StrafEntscheidTyp, type StrafAnfechtende, type StrafAnfechtungsziel, type RevisionsGrund,
} from '../../lib/strafRechtsmittel';
import { staatsanwaltschaftFuer, BUNDESANWALTSCHAFT } from '../../data/staatsanwaltschaften';
import { strafgerichteFuer, type StrafGerichtAdresse } from '../../data/strafgerichte';
import { VorlagenSprung } from './VorlagenSprung';

// ─── Rechtsweg «Straf» — UI-Teil des Zuständigkeitsrechners ─────────────────
// Task 7b (6.6.2026). Reine Darstellung (§3): Bundesrecht in
// lib/strafZustaendigkeit.ts, Behörden in data/staatsanwaltschaften.ts.
// Gleiche Bausteine wie Zivil/SchKG (einheitliches Design).

// Eingangs-Gabelung analog Zivil (Einleitung/Rechtsmittel) — Ausbau 6.6.2026.
type TeilAnliegen = StrafTeilAnliegen;
const ANLIEGEN = [
  { code: 'anzeige' as TeilAnliegen, label: 'Strafanzeige erstatten', sub: 'Wo und wie anzeigen? (Art. 301 StPO)' },
  { code: 'gerichtsstand' as TeilAnliegen, label: 'Gerichtsstand prüfen', sub: 'Welcher Kanton verfolgt? (Art. 31–42 StPO)' },
  { code: 'rechtsmittel' as TeilAnliegen, label: 'Rechtsmittel ergreifen', sub: 'Berufung/Beschwerde/Einsprache/Revision (Art. 379 ff. StPO)' },
];

const TATORT: { code: StrafTatortLage; label: string }[] = [
  { code: 'bekannt', label: 'Tatort in der Schweiz bekannt (Begehungsort)' },
  { code: 'nur_erfolgsort', label: 'Nur der Erfolg trat in der Schweiz ein' },
  { code: 'mehrere_orte', label: 'Tat/Erfolg an mehreren Orten' },
  { code: 'ausland_oder_ungewiss', label: 'Tat im Ausland oder Tatort ungewiss' },
];

const KASKADE: { code: StrafKaskade32; label: string }[] = [
  { code: 'wohnsitz', label: 'Beschuldigte Person hat Wohnsitz in der Schweiz' },
  { code: 'aufenthalt', label: 'Kein Wohnsitz, aber gewöhnlicher Aufenthalt in der Schweiz' },
  { code: 'heimatort', label: 'Weder Wohnsitz noch gewöhnlicher Aufenthalt — Heimatort in der Schweiz' },
  { code: 'ergreifungsort', label: 'Weder Wohnsitz noch Heimatort — Ort der Ergreifung' },
  { code: 'auslieferung', label: 'Ergreifung im Ausland — Auslieferungskanton' },
];

const SPEZIAL: { code: StrafSpezialforum; label: string }[] = [
  { code: 'kein', label: 'Kein Spezialforum' },
  { code: 'medien', label: 'Medienstraftat (Art. 35 StPO)' },
  { code: 'schkg_delikt', label: 'Konkurs-/Betreibungsdelikt (Art. 36 Abs. 1)' },
  { code: 'unternehmen', label: 'Unternehmensstrafbarkeit (Art. 36 Abs. 2)' },
  { code: 'einziehung', label: 'Selbstständige Einziehung (Art. 37)' },
];

const BETEILIGUNG: { code: StrafBeteiligung; label: string }[] = [
  { code: 'allein', label: 'Einzeltäterschaft' },
  { code: 'teilnehmer', label: 'Anstiftung/Gehilfenschaft (Teilnahme)' },
  { code: 'mittaeter', label: 'Mehrere Mittäter' },
];


const STRAF_DISCLAIMER =
  'Automatisierte Orientierung zur Zuständigkeit im Strafverfahren (StPO-Wortlaut-Stand 1.1.2024) – keine ' +
  'Rechtsberatung. Die Qualifikation der Tat und streitige Gerichtsstandsfragen (Art. 40 ff. StPO) sind ' +
  'Rechtsfragen; offene Weichen werden ausgewiesen. Behördenangaben: geprüfte Recherche, fachliche Abnahme ausstehend.';

export function StrafZustaendigkeitTeil() {
  const pk = usePaneKlasse();
  const [ausLink] = useState<Partial<StrafLinkZustand>>(() => {
    try {
      const l = permalinkLesen(STRAF_LINK_SPEC, window.location.search) as Partial<StrafLinkZustand>;
      // M-7-Guard (Bug-Check 10.6.2026): Kaskade nur bei passender Tatort-Lage.
      if (l.tatort !== 'ausland_oder_ungewiss') delete l.kaskade;
      return l;
    } catch { return {}; }
  });
  const [anliegen, setAnliegen] = useState<TeilAnliegen>(ausLink.anliegen ?? 'anzeige');
  const [tatort, setTatort] = useState<StrafTatortLage>(ausLink.tatort ?? 'bekannt');
  const [kaskade, setKaskade] = useState<StrafKaskade32>(ausLink.kaskade ?? 'wohnsitz');
  const [spezial, setSpezial] = useState<StrafSpezialforum>(ausLink.spezial ?? 'kein');
  const [beteiligung, setBeteiligung] = useState<StrafBeteiligung>(ausLink.beteiligung ?? 'allein');
  const [mehrereTaten, setMehrereTaten] = useState(ausLink.mehrereTaten ?? false);
  const [antragsdelikt, setAntragsdelikt] = useState(ausLink.antragsdelikt ?? false);
  const [uebertretung, setUebertretung] = useState(ausLink.uebertretung ?? false);
  const [bund, setBund] = useState(ausLink.bund ?? false);
  const [minderjaehrig, setMinderjaehrig] = useState(ausLink.minderjaehrig ?? false); // B3-Fix 6.6.2026: Art. 10 JStPO war im UI nicht erreichbar
  const [kanton, setKanton] = useState<Kanton | ''>(ausLink.kanton ?? '');
  const [aktenzeichen, setAktenzeichen] = useState('');

  const r = bestimmeStrafZustaendigkeit({
    anliegen: anliegen === 'rechtsmittel' ? 'gerichtsstand' : anliegen,
    tatort, kaskade32: kaskade, spezialforum: spezial,
    beteiligung, mehrereTatenVerschOrte: mehrereTaten,
    antragsdelikt, uebertretung, moeglichesBundesdelikt: bund,
    beschuldigteMinderjaehrig: minderjaehrig,
  });
  // RL-42 (Z1-01): im Jugendstrafverfahren ist weder die (Erwachsenen-)
  // Staatsanwaltschaft noch das ordentliche Strafgericht zuständig, sondern
  // die Jugend-Untersuchungsbehörde (Art. 6 Abs. 2 JStPO) bzw. das
  // Jugendgericht (Art. 7, 34 JStPO) — deren Adressen führt LexMetrik nicht;
  // Erwachsenen-Adressen werden dann nicht als zuständig ausgegeben (§8).
  const sta = kanton !== '' && !minderjaehrig ? staatsanwaltschaftFuer(kanton) : null;
  // Sachlich zuständige Gerichte (Ausbau 6.6.2026, Auftrag David):
  // Erstrecherche-Datenschicht data/strafgerichte.ts — 1. Instanz + ZMG.
  const gerichte = kanton !== '' && !minderjaehrig ? strafgerichteFuer(kanton) : null;
  const behoerdeKurz = minderjaehrig ? 'Jugend-Untersuchungsbehörde' : uebertretung ? 'StA / Übertretungsbehörde' : 'Staatsanwaltschaft';

  if (anliegen === 'rechtsmittel') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <GruppenTitel>2 · Worum geht es?</GruppenTitel>
          <SelectionGrid
            className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
            items={ANLIEGEN}
            value={anliegen}
            onSelect={setAnliegen}
          />
        </div>
        <StrafRechtsmittelTeil />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GruppenTitel>2 · Worum geht es?</GruppenTitel>
        <SelectionGrid
          className={pk('grid grid-cols-1 sm:grid-cols-3 gap-2', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-2')}
          items={ANLIEGEN}
          value={anliegen}
          onSelect={setAnliegen}
        />
      </div>

      <div className="space-y-2">
        <GruppenTitel>3 · Konstellation</GruppenTitel>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Tatort-Lage" hint="Grundsatz: Behörden des Begehungsortes (Art. 31 StPO)">
            <select className={inputCls} value={tatort} onChange={(e) => setTatort(e.target.value as StrafTatortLage)}>
              {TATORT.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </Field>
          {tatort === 'ausland_oder_ungewiss' && (
            <Field label="Kaskade (Art. 32 StPO)">
              <select className={inputCls} value={kaskade} onChange={(e) => setKaskade(e.target.value as StrafKaskade32)}>
                {KASKADE.map((k) => <option key={k.code} value={k.code}>{k.label}</option>)}
              </select>
            </Field>
          )}
          <Field label="Spezialforum" hint="geht dem Tatort-Grundsatz vor">
            <select className={inputCls} value={spezial} onChange={(e) => setSpezial(e.target.value as StrafSpezialforum)}>
              {SPEZIAL.map((s) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Beteiligung">
            <select className={inputCls} value={beteiligung} onChange={(e) => setBeteiligung(e.target.value as StrafBeteiligung)}>
              {BETEILIGUNG.map((b) => <option key={b.code} value={b.code}>{b.label}</option>)}
            </select>
          </Field>
          <Field label="Kanton des Forums (für die konkrete Behörde)" hint={minderjaehrig ? 'bei Minderjährigen: Kanton des gewöhnlichen Aufenthalts (Art. 10 JStPO)' : 'ergibt sich aus dem bestimmten Forum'}>
            <select className={inputCls} value={kanton} onChange={(e) => setKanton(e.target.value as Kanton | '')}>
              <option value="">– wählen –</option>
              {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox checked={mehrereTaten} onChange={setMehrereTaten} label="Mehrere Taten an verschiedenen Orten (Art. 34)" />
          <Checkbox checked={antragsdelikt} onChange={setAntragsdelikt} label="Antragsdelikt (z. B. einfache Körperverletzung, Hausfriedensbruch)" />
          <Checkbox checked={uebertretung} onChange={setUebertretung} label="Übertretung (Busse)" />
          <Checkbox checked={bund} onChange={setBund} label="Möglicher Bund-Katalogfall (Art. 23/24)" />
          <Checkbox checked={minderjaehrig} onChange={setMinderjaehrig} label="Beschuldigte Person ist minderjährig (Art. 10 JStPO)" />
        </div>
      </div>

      <ErgebnisBlock>

        <div className="lc-card p-5 space-y-3">
          <GruppenTitel>Örtliches Forum</GruppenTitel>
          <p className="text-body-s text-ink-900">{r.forum.text}.</p>
          <p className="text-body-s text-ink-700">{r.behoerdeTyp}.</p>
          {minderjaehrig ? (
            <p className="text-body-s text-ink-500 border-t border-line pt-3">Jugendstrafverfahren: Die Adressen der kantonalen Jugendstrafbehörden (Jugendanwaltschaft bzw. Jugendrichter, Jugendgericht) sind in LexMetrik noch nicht erfasst. Eine Anzeige nimmt auch jede andere Strafverfolgungsbehörde entgegen und leitet sie weiter (Art. 39 StPO).</p>
          ) : bund ? (
            <div className="border-t border-line pt-3">
              <p className="lc-overline mb-1.5">Bundesanwaltschaft (bei Bundesgerichtsbarkeit)</p>
              <p className="text-body-s text-ink-900 whitespace-pre-line">{BUNDESANWALTSCHAFT.name}{'\n'}{BUNDESANWALTSCHAFT.strasse}{'\n'}{BUNDESANWALTSCHAFT.plzOrt}</p>
              <p className="text-xs text-ink-500 mt-1"><NormText text={BUNDESANWALTSCHAFT.hinweis ?? ''} />.</p>
            </div>
          ) : sta ? (
            <div className="border-t border-line pt-3">
              <p className="lc-overline mb-1.5">Zentrale Staatsanwaltschaft ({kanton})</p>
              <p className="text-body-s text-ink-900 whitespace-pre-line">{sta.name}{'\n'}{sta.strasse}{'\n'}{sta.plzOrt}</p>
              {sta.hinweis && <p className="text-xs text-ink-500 mt-1"><NormText text={sta.hinweis} />.</p>}
              <p className="text-xs text-ink-500 mt-1.5">Quelle: zweifach geprüftes Strafbehörden-Dossier (Stand 5.6.2026) — fachliche Abnahme ausstehend; Adresse vor Einreichung kurz gegenprüfen.</p>
            </div>
          ) : (
            <p className="text-body-s text-ink-500">Forum-Kanton wählen, um die zentrale Staatsanwaltschaft mit Adresse anzuzeigen.</p>
          )}
        </div>

        {/* Sachlich zuständige Gerichte (Ausbau 6.6.2026): 1. Instanz + ZMG */}
        {gerichte && !bund && (
          <div className="lc-card p-5 space-y-3">
            <GruppenTitel>Sachlich zuständige Gerichte ({kanton})</GruppenTitel>
            <GerichtBlock titel="Erstinstanzliches Strafgericht (Hauptverfahren nach Anklage)" g={gerichte.ersteInstanz} system={gerichte.ersteInstanz.system} />
            {gerichte.zmg && (
              <div className="border-t border-line pt-3">
                <GerichtBlock titel="Zwangsmassnahmengericht (Haft & Zwangsmassnahmen, Art. 18 StPO)" g={gerichte.zmg} />
              </div>
            )}
            <p className="text-xs text-ink-500 pt-2 border-t border-line">
              Quelle: Strafgerichts-Dossier (Stand {gerichte.stand}) — Doppelcheck und fachliche Abnahme ausstehend; Adresse vor Einreichung kurz gegenprüfen.
            </p>
          </div>
        )}

        {r.fristen.length > 0 && (
          <div className="lc-card p-5 space-y-2.5">
            <GruppenTitel>Fristen</GruppenTitel>
            {r.fristen.map((f) => (
              <p key={f.label} className="text-body-s text-ink-800">
                {f.kritisch && <span className="lc-badge lc-badge-danger mr-1.5">Verwirkung</span>}
                <span className="font-medium text-ink-900">{f.label}:</span> {f.frist} <span className="text-ink-500">({f.norm})</span>
              </p>
            ))}
          </div>
        )}

        <div className="lc-card p-5 space-y-3">
          <GruppenTitel>Ihr Fahrplan</GruppenTitel>
          <ol className="space-y-2.5">
            {r.fahrplan.map((s, i) => (
              <li key={s.titel} className="flex gap-3">
                <span aria-hidden className="shrink-0 w-6 h-6 bg-brass-100 text-brass-700 inline-flex items-center justify-center text-xs font-semibold num">{i + 1}</span>
                <span>
                  <span className="block text-body-s font-medium text-ink-900">{s.titel}</span>
                  <span className="block text-body-s text-ink-600">{s.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* S-4 (Auftrag David 10.6.2026): direkter Sprung zur passenden
            Eingabe-Vorlage; die zuständige Behörde samt Adresse steht oben.
            Beide Karten sind geplant → ehrlich «in Vorbereitung» (§8). */}
        {anliegen === 'anzeige' && (
          <VorlagenSprung karteId="strafanzeige"
            zusatz="Für antragsabhängige Delikte zusätzlich: Vorlage «Strafantrag» (Art. 30 ff. StGB, Frist 3 Monate)." />
        )}

        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
          <EckdatenKachel label="Forum" wert={r.forum.normen[0]?.artikel ?? '—'} sub="örtliche Anknüpfung" />
          <EckdatenKachel label="Behörde" wert={behoerdeKurz} />
          <EckdatenKachel label="Kritische Fristen" wert={String(r.fristen.filter((f) => f.kritisch).length)} sub={r.fristen.find((f) => f.kritisch)?.frist} />
        </div>

        {r.weichen.map((w) => <div key={w} className="lc-notice text-body-s"><NormText text={w} /></div>)}
        {r.warnungen.map((w) => <div key={w} className="lc-notice-warn text-body-s"><NormText text={w} /></div>)}

        <div className="flex flex-wrap gap-1.5">
          {r.normverweise.map((n, i) => <NormLink key={i} artikel={n.artikel} bemerkung={n.bemerkung} />)}
        </div>

        {/* Mandatstauglicher Output (G3.1 / M-8, 10.6.2026): Aktenzeichen +
            PDF + Teilen — gleicher geteilter Rahmen wie Zivil/SchKG (§10). */}
        <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen}
          query={() => permalinkKodieren(STRAF_LINK_SPEC, {
            anliegen, tatort, kaskade, spezial, beteiligung, mehrereTaten,
            antragsdelikt, uebertretung, bund, minderjaehrig, kanton,
          })}
          pdf={{
            aktenzeichen: aktenzeichen.trim() || undefined,
            title: 'Zuständigkeit (Strafverfahren)',
            rechtsgrundlage: minderjaehrig ? 'Bestimmung nach Art. 10 JStPO (Stand 1.7.2025) und Art. 38–42, 301 StPO' : 'Bestimmung nach Art. 31–42, 301 StPO (Stand 1.1.2024)',
            domain: 'zustaendigkeit',
            fileBase: 'Straf-Zustaendigkeit',
            inputs: {
              'Rechtsweg': 'Straf (StPO)',
              'Anliegen': anliegen === 'anzeige' ? 'Strafanzeige erstatten' : 'Gerichtsstand prüfen',
              'Tatort-Lage': TATORT.find((t) => t.code === tatort)?.label ?? tatort,
              ...(tatort === 'ausland_oder_ungewiss' ? { 'Kaskade (Art. 32)': KASKADE.find((k) => k.code === kaskade)?.label ?? '' } : {}),
              ...(spezial !== 'kein' ? { 'Spezialforum': SPEZIAL.find((s) => s.code === spezial)?.label ?? '' } : {}),
              'Beteiligung': BETEILIGUNG.find((b) => b.code === beteiligung)?.label ?? beteiligung,
              ...(antragsdelikt ? { 'Antragsdelikt': 'ja' } : {}),
              ...(uebertretung ? { 'Übertretung': 'ja' } : {}),
              ...(bund ? { 'Bund-Katalogfall': 'möglich (Art. 23/24 StPO)' } : {}),
              ...(minderjaehrig ? { 'Minderjährig': 'ja (Art. 10 JStPO)' } : {}),
              ...(kanton ? { [minderjaehrig ? 'Kanton (gewöhnlicher Aufenthalt)' : 'Kanton (Forum)']: kanton } : {}),
            },
            hero: {
              hauptlabel: 'Örtliches Forum',
              hauptwert: r.forum.normen[0]?.artikel ?? '—',
              nebenwerte: [
                { label: 'Behörde', wert: behoerdeKurz },
                ...(r.fristen.some((x) => x.kritisch) ? [{ label: 'Kritische Frist', wert: r.fristen.find((x) => x.kritisch)!.frist }] : []),
              ],
              kontext: r.forum.text,
            },
            sections: [{ titel: 'Zuständigkeit im Strafverfahren', ergebnis: strafZustaendigkeitBericht(r) }],
            disclaimer: STRAF_DISCLAIMER,
          }} />

        <p className="text-xs text-ink-500 pt-2 border-t border-line">
          Regelwerk verbatim am StPO-Wortlaut verifiziert (Stand 1.1.2024; Art. 301 StPO/Art. 31 StGB am 6.6.2026) — fachliche Abnahme ausstehend.
        </p>
      </ErgebnisBlock>
    </div>
  );
}

// Adress-Block für eine Strafgerichts-Adresse (Erstrecherche-Schicht):
// volle Adresse wo belegt; offene Hausnummern erscheinen NUR als Hinweis (§8).
function GerichtBlock({ titel, g, system }: { titel: string; g: StrafGerichtAdresse; system?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-ink-600 mb-1">{titel}</p>
      {system && <p className="text-xs text-ink-500 mb-1">{system}</p>}
      <p className="text-body-s text-ink-900 whitespace-pre-line">
        {g.name}{g.strasse ? `\n${g.strasse}` : ''}{g.plzOrt ? `\n${g.plzOrt}` : ''}
      </p>
      {g.hinweis && <p className="text-xs text-warn-700 mt-1">⚠ <NormText text={g.hinweis} /></p>}
    </div>
  );
}

// ─── Stufe Rechtsmittel (Eingangs-Gabelung, Ausbau 6.6.2026) ────────────────
// Reine Darstellung über lib/strafRechtsmittel.ts (§3/§4) — Decision Tree aus
// bibliothek/recherche/stpo-rechtsmittel.md, Wortlaute am Cache verifiziert.

const ENTSCHEIDTYPEN: { code: StrafEntscheidTyp; label: string }[] = [
  { code: 'urteil_erstinstanz', label: 'Urteil eines erstinstanzlichen Gerichts (inkl. nachträgliche/Einziehungs-Entscheide)' },
  { code: 'strafbefehl', label: 'Strafbefehl der Staatsanwaltschaft / Übertretungsstrafbehörde' },
  { code: 'verfuegung_sta_polizei', label: 'Verfügung/Verfahrenshandlung von StA oder Polizei (inkl. Einstellung, Nichtanhandnahme)' },
  { code: 'anderer_entscheid_gericht', label: 'Beschluss/Verfügung des erstinstanzlichen Gerichts (nicht verfahrensleitend)' },
  { code: 'verfahrensleitend_gericht', label: 'Verfahrensleitende Anordnung des Gerichts' },
  { code: 'zmg_haftentscheid', label: 'Haftentscheid des Zwangsmassnahmengerichts (U-/Sicherheitshaft)' },
  { code: 'zmg_andere_zwangsmassnahme', label: 'Anderer Entscheid des Zwangsmassnahmengerichts' },
  { code: 'haftentscheid_berufungsverfahren', label: 'Haftentscheid der Verfahrensleitung im Berufungsverfahren (Art. 233)' },
  { code: 'rechtskraeftiges_urteil', label: 'Rechtskräftiges Urteil / rechtskräftiger Strafbefehl (Revision)' },
  { code: 'rechtsverweigerung', label: 'Rechtsverweigerung oder Rechtsverzögerung' },
];

const ANFECHTENDE: { code: StrafAnfechtende; label: string }[] = [
  { code: 'beschuldigte_person', label: 'Beschuldigte / verurteilte Person' },
  { code: 'privatklaegerschaft', label: 'Privatklägerschaft' },
  { code: 'staatsanwaltschaft', label: 'Staatsanwaltschaft' },
  { code: 'weitere_partei', label: 'Weitere Verfahrensbeteiligte (z. B. Dritteinziehung)' },
  { code: 'angehoerige', label: 'Angehörige (nach dem Tod der Partei, Art. 382 Abs. 3)' },
];

const ZIELE: { code: StrafAnfechtungsziel; label: string }[] = [
  { code: 'umfassend', label: 'Entscheid umfassend (Schuld- und Strafpunkt)' },
  { code: 'nur_sanktion', label: 'Nur die ausgesprochene Sanktion' },
  { code: 'nur_zivilpunkt', label: 'Nur der Zivilpunkt' },
  { code: 'nur_kosten', label: 'Nur Kosten-/Entschädigungsfolgen' },
];

const REV_GRUENDE: { code: RevisionsGrund; label: string }[] = [
  { code: 'noven', label: 'Neue Tatsachen oder Beweismittel (Art. 410 Abs. 1 lit. a)' },
  { code: 'widerspruch', label: 'Unverträglicher Widerspruch zu späterem Strafentscheid (lit. b)' },
  { code: 'straftat', label: 'Einwirkung einer Straftat auf den Entscheid (lit. c)' },
  { code: 'emrk', label: 'EGMR-Urteil (Verletzung der EMRK, Art. 410 Abs. 2)' },
];

const RM_LABEL: Record<string, string> = {
  berufung: 'Berufung', beschwerde: 'Beschwerde', einsprache: 'Einsprache',
  revision: 'Revision', keines: 'Kein Rechtsmittel',
};


function StrafRechtsmittelTeil() {
  const pk = usePaneKlasse();
  const [ausLink] = useState<Partial<StrafRmLinkZustand>>(() => {
    try {
      const l = permalinkLesen(STRAF_RM_LINK_SPEC, window.location.search) as Partial<StrafRmLinkZustand>;
      // M-7-Guard (Bug-Check 10.6.2026): Sub-Felder nur beim passenden
      // Entscheidtyp übernehmen.
      if (l.entscheidTyp !== 'urteil_erstinstanz') delete l.uebertretung;
      if (l.entscheidTyp !== 'rechtskraeftiges_urteil') delete l.revGrund;
      return l;
    } catch { return {}; }
  });
  const [entscheidTyp, setEntscheidTyp] = useState<StrafEntscheidTyp>(ausLink.entscheidTyp ?? 'urteil_erstinstanz');
  const [werFichtAn, setWerFichtAn] = useState<StrafAnfechtende>(ausLink.werFichtAn ?? 'beschuldigte_person');
  const [ziel, setZiel] = useState<StrafAnfechtungsziel>(ausLink.ziel ?? 'umfassend');
  const [uebertretung, setUebertretung] = useState(ausLink.uebertretung ?? false);
  const [nurZugunsten, setNurZugunsten] = useState(ausLink.nurZugunsten ?? false);
  const [revGrund, setRevGrund] = useState<RevisionsGrund>(ausLink.revGrund ?? 'noven');
  const [bund, setBund] = useState(ausLink.bund ?? false);
  const [kanton, setKanton] = useState<Kanton | ''>(ausLink.kanton ?? '');
  const [aktenzeichen, setAktenzeichen] = useState('');

  const r = bestimmeStrafRechtsmittel({
    entscheidTyp, werFichtAn, anfechtungsziel: ziel,
    uebertretung: entscheidTyp === 'urteil_erstinstanz' ? uebertretung : undefined,
    nurZugunstenBeschuldigte: nurZugunsten,
    revisionsgrund: entscheidTyp === 'rechtskraeftiges_urteil' ? revGrund : undefined,
    bundesgerichtsbarkeit: bund,
  });

  // Konkrete Instanz-Adresse (Auftrag David 6.6.2026): Berufung/Revision →
  // Berufungsgericht; Beschwerde → Beschwerdeinstanz (organisatorisch i. d. R.
  // dieselbe obere Instanz, Kammer je kantonaler Organisation — Hinweis);
  // Einsprache → Staatsanwaltschaft. Erstrecherche-Schicht, kein Raten (§8).
  const gerichte = kanton !== '' && !bund ? strafgerichteFuer(kanton) : null;
  const sta = kanton !== '' && !bund ? staatsanwaltschaftFuer(kanton) : null;
  const adresse: { titel: string; g: StrafGerichtAdresse; hinweis?: string } | null =
    !gerichte || r.statthaft === 'keines' ? null
      : r.statthaft === 'berufung' || r.statthaft === 'revision'
        ? { titel: `Berufungsgericht (${kanton})`, g: gerichte.berufung }
        : r.statthaft === 'beschwerde'
          ? {
              titel: `Beschwerdeinstanz (${kanton})`, g: gerichte.berufung,
              hinweis: 'Die Beschwerdeinstanz ist organisatorisch in der Regel beim selben oberen Gericht angesiedelt (Beschwerdekammer/-abteilung) — massgebliche Kammer gemäss kantonaler Gerichtsorganisation.',
            }
          : sta
            ? { titel: `Staatsanwaltschaft (${kanton}) — Adressatin der Einsprache`, g: sta }
            : null;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GruppenTitel>3 · Angefochtener Entscheid</GruppenTitel>
        <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
          <Field label="Entscheidtyp" hint="bestimmt das statthafte Rechtsmittel (Art. 393/398/410 StPO)">
            <select className={inputCls} value={entscheidTyp} onChange={(e) => setEntscheidTyp(e.target.value as StrafEntscheidTyp)}>
              {ENTSCHEIDTYPEN.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Wer ficht an?" hint="Legitimation (Art. 381/382 StPO)">
            <select className={inputCls} value={werFichtAn} onChange={(e) => setWerFichtAn(e.target.value as StrafAnfechtende)}>
              {ANFECHTENDE.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Anfechtungsziel" hint="Privatklägerschaft: Sanktion nicht anfechtbar (Art. 382 Abs. 2)">
            <select className={inputCls} value={ziel} onChange={(e) => setZiel(e.target.value as StrafAnfechtungsziel)}>
              {ZIELE.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
            </select>
          </Field>
          {entscheidTyp === 'rechtskraeftiges_urteil' && (
            <Field label="Revisionsgrund" hint="bestimmt die Frist (90 Tage oder unbefristet, Art. 411 Abs. 2)">
              <select className={inputCls} value={revGrund} onChange={(e) => setRevGrund(e.target.value as RevisionsGrund)}>
                {REV_GRUENDE.map((t) => <option key={t.code} value={t.code}>{t.label}</option>)}
              </select>
            </Field>
          )}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {entscheidTyp === 'urteil_erstinstanz' && (
            <Checkbox checked={uebertretung} onChange={setUebertretung} label="Gegenstand waren ausschliesslich Übertretungen (Art. 398 Abs. 4)" />
          )}
          <Checkbox checked={nurZugunsten} onChange={setNurZugunsten} label="Rechtsmittel nur ZUGUNSTEN der beschuldigten Person (Art. 391 Abs. 2)" />
          <Checkbox checked={bund} onChange={setBund} label="Bundesgerichtsbarkeit (Verfahren der Bundesanwaltschaft)" />
        </div>
        {!bund && (
          <div className={pk('grid grid-cols-1 sm:grid-cols-2 gap-4', 'grid grid-cols-1 @lg/pane:grid-cols-2 gap-4')}>
            <Field label="Kanton (für die konkrete Instanz-Adresse)" optional>
              <select className={inputCls} value={kanton} onChange={(e) => setKanton(e.target.value as Kanton | '')}>
                <option value="">– wählen –</option>
                {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </Field>
          </div>
        )}
      </div>

      <ErgebnisBlock>

        <div className={`lc-card p-5 space-y-3 ${r.statthaft === 'keines' ? 'lc-akzent-danger' : ''}`}>
          <GruppenTitel>Statthaftes Rechtsmittel</GruppenTitel>
          <p className="text-body-s text-ink-900">{r.text}</p>
          {r.statthaft !== 'keines' && (
            <>
              <p className="text-body-s text-ink-700"><span className="font-medium text-ink-900">Instanz:</span> {r.instanz}</p>
              <p className="text-body-s text-ink-700"><span className="font-medium text-ink-900">Form:</span> {r.form}</p>
              {r.kognition && <p className="text-body-s text-ink-700"><span className="font-medium text-ink-900">Kognition:</span> {r.kognition}</p>}
            </>
          )}
        </div>

        {adresse && (
          <div className="lc-card p-5 space-y-2">
            <GruppenTitel>Konkrete Instanz</GruppenTitel>
            <GerichtBlock titel={adresse.titel} g={adresse.g} />
            {adresse.hinweis && <p className="text-xs text-ink-500"><NormText text={adresse.hinweis} /></p>}
            <p className="text-xs text-ink-500 pt-2 border-t border-line">
              Quelle: Strafgerichts-Dossier bzw. Strafbehörden-Dossier — fachliche Abnahme ausstehend; Adresse vor Einreichung kurz gegenprüfen.
            </p>
          </div>
        )}

        {r.fristen.length > 0 && (
          <div className="lc-card p-5 space-y-2.5">
            <GruppenTitel><NormText text={`Fristen — kein Stillstand (Art. 89 Abs. 2 StPO)`} /></GruppenTitel>
            {r.fristen.map((f) => (
              <p key={f.label} className="text-body-s text-ink-800">
                {f.kritisch && <span className="lc-badge lc-badge-danger mr-1.5">Verwirkung</span>}
                <span className="font-medium text-ink-900">{f.label}:</span> {f.frist} <span className="text-ink-500">({f.norm})</span>
              </p>
            ))}
          </div>
        )}

        <div className={pk('grid grid-cols-1 sm:grid-cols-3 gap-3', 'grid grid-cols-1 @xl/pane:grid-cols-3 gap-3')}>
          <EckdatenKachel label="Rechtsmittel" wert={RM_LABEL[r.statthaft]} sub={r.statthaft !== 'keines' ? r.normverweise[r.normverweise.length - 1]?.artikel : undefined} />
          <EckdatenKachel label="Instanz" wert={r.statthaft === 'keines' ? '—' : r.instanz.split(' (')[0]} />
          <EckdatenKachel label="Kritische Fristen" wert={String(r.fristen.filter((f) => f.kritisch).length)} sub={r.fristen.find((f) => f.kritisch)?.frist.split(' — ')[0]} />
        </div>

        {r.weichen.map((w) => <div key={w} className="lc-notice text-body-s"><NormText text={w} /></div>)}
        {r.warnungen.map((w) => <div key={w} className="lc-notice-warn text-body-s"><NormText text={w} /></div>)}

        <div className="lc-card p-5 space-y-2">
          <GruppenTitel>Weiterzug ans Bundesgericht</GruppenTitel>
          <p className="text-body-s text-ink-700">{r.bger.text}</p>
          <p className="text-xs text-ink-500">
            {/* Prefill-Brücke BGer (Auftrag David 11.6.2026). */}
            Konkretes Fristende und Details (Haftsachen, Zwischenentscheide):{' '}
            <Link to={bgerRechtswegLink({ weg: 'straf' })} className="text-brass-700 underline">
              BGer-Rechner (vorbefüllt)
            </Link>
            {' '}— nur noch die Eröffnung des Entscheids eintragen.
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {r.normverweise.map((n, i) => <NormLink key={i} artikel={n.artikel} bemerkung={n.bemerkung} />)}
        </div>

        {/* Mandatstauglicher Output (G3.1 / M-8, 10.6.2026). */}
        <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen}
          query={() => permalinkKodieren(STRAF_RM_LINK_SPEC, {
            anliegen: 'rechtsmittel', entscheidTyp, werFichtAn, ziel,
            uebertretung, nurZugunsten, revGrund, bund, kanton,
          })}
          pdf={{
            aktenzeichen: aktenzeichen.trim() || undefined,
            title: 'Rechtsmittel im Strafverfahren',
            rechtsgrundlage: 'Bestimmung nach Art. 379 ff. StPO (Stand 1.1.2024)',
            domain: 'zustaendigkeit',
            fileBase: 'Straf-Rechtsmittel',
            inputs: {
              'Rechtsweg': 'Straf — Rechtsmittel',
              'Angefochtener Entscheid': ENTSCHEIDTYPEN.find((t) => t.code === entscheidTyp)?.label ?? entscheidTyp,
              'Wer ficht an': ANFECHTENDE.find((t) => t.code === werFichtAn)?.label ?? werFichtAn,
              'Anfechtungsziel': ZIELE.find((t) => t.code === ziel)?.label ?? ziel,
              ...(entscheidTyp === 'rechtskraeftiges_urteil' ? { 'Revisionsgrund': REV_GRUENDE.find((t) => t.code === revGrund)?.label ?? '' } : {}),
              ...(entscheidTyp === 'urteil_erstinstanz' && uebertretung ? { 'Nur Übertretungen': 'ja (Art. 398 Abs. 4 StPO)' } : {}),
              ...(nurZugunsten ? { 'Nur zugunsten Beschuldigter': 'ja (Art. 391 Abs. 2 StPO)' } : {}),
              ...(bund ? { 'Bundesgerichtsbarkeit': 'ja' } : {}),
              ...(kanton ? { 'Kanton': kanton } : {}),
            },
            hero: {
              hauptlabel: 'Statthaftes Rechtsmittel',
              hauptwert: RM_LABEL[r.statthaft],
              nebenwerte: [
                ...(r.statthaft !== 'keines' ? [{ label: 'Instanz', wert: r.instanz.split(' (')[0] }] : []),
                ...(r.fristen.some((x) => x.kritisch) ? [{ label: 'Kritische Frist', wert: r.fristen.find((x) => x.kritisch)!.frist.split(' — ')[0] }] : []),
              ],
            },
            sections: [{ titel: 'Rechtsmittel im Strafverfahren', ergebnis: strafRechtsmittelBericht(r) }],
            disclaimer: STRAF_DISCLAIMER,
          }} />

        <p className="text-xs text-ink-500 pt-2 border-t border-line">
          Decision Tree aus dem StPO-Rechtsmittel-Dossier (6.6.2026), Wortlaute am StPO-Cache (Stand 1.1.2024) verifiziert — fachliche Abnahme ausstehend. Die Qualifikation des Entscheidtyps und das rechtlich geschützte Interesse (Art. 382 Abs. 1) sind Rechtsfragen.
        </p>
      </ErgebnisBlock>
    </div>
  );
}
