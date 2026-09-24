import { Link } from 'react-router-dom';
import { NormText } from '../NormText';
import { GruppenTitel, NormLink } from '../vorlagen/ui';
import { ErgebnisBlock } from '../ErgebnisBlock';
import { ErgebnisExport } from '../ErgebnisExport';
import { permalinkKodieren } from '../../lib/permalink';
import { ZUST_LINK_SPEC } from './zustaendigkeitLinkSpecs';
import { zpoFristenLink, bgerRechtswegLink } from '../../lib/rechnerPermalinks';
import { rechtsmittelBericht, bgerGebietFuerStreitsache } from '../../lib/zustaendigkeit';
import { DISCLAIMER, STREITSACHEN } from './zustaendigkeitFormDaten';
import type { ZustaendigkeitFormModell } from './useZustaendigkeitForm';

// ─── Zuständigkeitsrechner — Ergebnis-Teil «Rechtsmittel» (Zivil) ───────────
// §6.6-Fassaden-Split H-13 (B25): reine Darstellung, JSX byte-gleich aus
// ZustaendigkeitForm.tsx ausgelagert. KEINE eigenen Hooks (Re-Render-
// Granularität unverändert — React-Compiler-aus-Leitplanke, Memory); alle Werte
// kommen als EIN Modell-Prop `z` aus useZustaendigkeitForm — kein Duplikat (§5).
export function ZustErgebnisRechtsmittel({ z }: { z: ZustaendigkeitFormModell }) {
  const { f, zeige, rechtsmittel, obereInstanz, fehler, schritt, istScheidung, vermoegensrechtlich, streitwert, aktenzeichen, setAktenzeichen } = z;
  return (
    <>
        {/* Rechtsmittel-Fahrplan (Umbau 6.6.2026, Auftrag David): vier Schritte
            statt zweier Textkarten — 1. statthaftes Rechtsmittel · 2. Instanz mit
            Adresse · 3. FRIST konkret aufgelöst (30/10 Tage, Stillstand ja/nein)
            · 4. Weiterzug BGer inkl. eigener Frist, Kognition und Weichen. */}
        {/* Ehrlicher Leerzustand (Befund Logik-Check NIEDRIG + David): fehlen
            Pflichtangaben, sagt der Fahrplan WAS fehlt, statt leer zu bleiben. */}
        {zeige('ergebnis') && f.instanz === 'rechtsmittel' && !rechtsmittel && (
          <div className="lc-card p-5 space-y-2">
            <GruppenTitel>Fahrplan</GruppenTitel>
            <p className="text-body-s text-ink-700">
              Für den Rechtsmittel-Fahrplan fehlen noch Angaben:
            </p>
            {fehler.length > 0
              ? fehler.map((x, i) => <p key={i} className="text-body-s text-warn-700">• {x}</p>)
              : <p className="text-body-s text-warn-700">• Bitte die vorherigen Schritte vervollständigen.</p>}
          </div>
        )}
        {zeige('ergebnis') && f.instanz === 'rechtsmittel' && rechtsmittel && (
          <ErgebnisBlock>

            {/* Schritt 1 · Statthaftes Rechtsmittel */}
            <div className="lc-card p-5 space-y-2">
              <GruppenTitel>1 · Statthaftes Rechtsmittel (kantonal)</GruppenTitel>
              <p className="text-h3 font-medium text-ink-900 leading-none">
                {rechtsmittel.kantonal === 'berufung' ? 'Berufung'
                  : rechtsmittel.kantonal === 'beschwerde' ? 'Beschwerde'
                  : rechtsmittel.kantonal === 'entfaellt_einzige_instanz' ? 'Kein kantonales Rechtsmittel'
                  : 'Berufung oder Beschwerde — vom Streitwert abhängig'}
              </p>
              <p className="text-body-s text-ink-700">{rechtsmittel.kantonalText}</p>
            </div>

            {/* Schritt 2 · Zuständige Instanz */}
            <div className="lc-card p-5 space-y-3">
              <GruppenTitel>2 · Wohin?</GruppenTitel>
              {rechtsmittel.kantonal !== 'entfaellt_einzige_instanz' ? (
                f.kanton !== '' ? (
                  <div>
                    {/* Genauer Spruchkörper (Auftrag David 6.6.2026): nur wo
                        deterministisch + amtlich belegt (Dossier rechtsmittel-
                        spruchkoerper-kantone.md) — Rest ehrlich offen (§8). */}
                    {(() => {
                      const kammer = rechtsmittel.kantonal === 'beschwerde'
                        ? (obereInstanz!.kammerBeschwerde ?? obereInstanz!.kammerBerufung)
                        : rechtsmittel.kantonal === 'berufung'
                          ? obereInstanz!.kammerBerufung
                          : undefined; // 'offen' (streitwertabhängig): keine Kammer-Festlegung
                      return kammer ? (
                        <p className="text-body-s text-ink-900 font-medium">{kammer}</p>
                      ) : null;
                    })()}
                    <p className="text-body-s text-ink-900 whitespace-pre-line">
                      {obereInstanz!.name}{'\n'}{obereInstanz!.strasse}{'\n'}{obereInstanz!.plzOrt}
                    </p>
                    {obereInstanz!.hinweis && <p className="text-xs text-ink-500 mt-1"><NormText text={obereInstanz!.hinweis} />.</p>}
                    {obereInstanz!.quelleSpruchkoerper && (
                      <p className="text-xs text-ink-500 mt-1">Spruchkörper: {obereInstanz!.quelleSpruchkoerper} — fachliche Abnahme ausstehend.</p>
                    )}
                    {!obereInstanz!.kammerBerufung && (
                      <p className="text-xs text-ink-500 mt-1">
                        Der konkrete Spruchkörper (Kammer/Abteilung) richtet sich in diesem Kanton nach der
                        Geschäftsverteilung des Gerichts — die Eingabe an die Gerichtsadresse genügt.
                      </p>
                    )}
                    <p className="text-xs text-ink-500 mt-1.5">
                      Quelle: zweifach geprüftes Gerichts-Dossier (Stand 5.6.2026) — fachliche Abnahme ausstehend; Adresse vor Einreichung kurz gegenprüfen.
                    </p>
                  </div>
                ) : (
                  <p className="text-body-s text-ink-500">Kanton wählen, um die zuständige obere Instanz mit Adresse anzuzeigen.</p>
                )
              ) : (
                <p className="text-body-s text-ink-700">
                  Die kantonale Rechtsmittelinstanz entfällt — nächste (und einzige) Station ist das Bundesgericht, siehe Schritt 4.
                </p>
              )}
            </div>

            {/* Schritt 3 · Frist (kantonal) — konkret aufgelöst */}
            {rechtsmittel.kantonalFrist && (
              <div className="lc-card p-5 space-y-2">
                <GruppenTitel>3 · Frist (kantonal)</GruppenTitel>
                <p className="text-h3 font-medium text-ink-900 leading-none">
                  {rechtsmittel.kantonalFrist.tage !== null ? `${rechtsmittel.kantonalFrist.tage} Tage` : 'Von offener Weiche abhängig'}
                </p>
                <p className="text-body-s text-ink-700">{rechtsmittel.kantonalFrist.text}</p>
                <p className={`text-body-s ${rechtsmittel.kantonalFrist.stillstand ? 'text-ink-700' : 'text-warn-700 font-medium'}`}>
                  {rechtsmittel.kantonalFrist.stillstandText}
                </p>
                <p className="text-xs text-ink-500">
                  {/* Prefill-Brücke 2.1a: Fristlänge/Verfahren/Kanton reisen mit —
                      nur noch das Zustellungsdatum eintragen. */}
                  Konkretes Fristende berechnen:{' '}
                  <Link
                    to={zpoFristenLink({
                      ...(rechtsmittel.kantonalFrist.tage != null ? { laenge: rechtsmittel.kantonalFrist.tage } : {}),
                      einheit: 'tage',
                      verfahren: f.rmVerfahren === 'summarisch' ? 'summarisch' : 'ordentlich',
                      fristnatur: 'gesetzlich',
                      ...(f.kanton !== '' ? { kanton: f.kanton } : {}),
                    })}
                    className="text-brass-700 underline">
                    ZPO-Fristenrechner (vorbefüllt)
                  </Link>
                  {' '}— Frist und Verfahren reisen mit; nur noch die Zustellung eintragen.
                </p>
              </div>
            )}

            {/* Schritt 4 · Weiterzug ans Bundesgericht */}
            <div className="lc-card p-5 space-y-3">
              <GruppenTitel>{rechtsmittel.kantonalFrist ? '4' : '3'} · Weiterzug ans Bundesgericht</GruppenTitel>
              <p className="text-h3 font-medium text-ink-900 leading-none">
                {rechtsmittel.bger === 'zulaessig' ? 'Beschwerde in Zivilsachen: zulässig'
                  : rechtsmittel.bger === 'schwelle_verfehlt' ? 'Streitwertgrenze nicht erreicht'
                  : 'Vom Streitwert abhängig'}
              </p>
              <p className="text-body-s text-ink-700">{rechtsmittel.bgerText}</p>
              <div className="border-t border-line pt-3 space-y-1.5">
                <p className="text-body-s text-ink-900 font-medium">
                  Frist: {rechtsmittel.bgerFrist.tage} Tage
                </p>
                <p className="text-body-s text-ink-700">{rechtsmittel.bgerFrist.text}</p>
                <p className={`text-body-s ${rechtsmittel.bgerFrist.stillstand ? 'text-ink-700' : 'text-warn-700 font-medium'}`}>
                  {rechtsmittel.bgerFrist.stillstandText}
                </p>
              </div>
              {rechtsmittel.kognitionHinweis && (
                <div className="lc-notice-warn text-body-s">{rechtsmittel.kognitionHinweis}</div>
              )}
              {/* Abteilungs-Auskunft (B.5a, 11.6.2026; Art. 33/34 BGerR — Regel
                  in lib/bgerRechtsweg.ts, inkl. Rechtsöffnungs-Falle) */}
              <p className="text-body-s text-ink-700 border-t border-line pt-3">
                Zuständig wäre die <span className="font-medium text-ink-900">{rechtsmittel.bgerAbteilung}</span> — gilt auch für die subsidiäre Verfassungsbeschwerde.
              </p>
              <p className="text-body-s text-ink-900 whitespace-pre-line">
                Schweizerisches Bundesgericht{'\n'}Av. du Tribunal-fédéral 29{'\n'}1005 Lausanne
              </p>
              <p className="text-xs text-ink-500">
                {/* Prefill-Brücke (Auftrag David 11.6.2026): Gebiet/Streitwert/
                    Objekt/Kanton reisen mit — nur noch die Eröffnung eintragen. */}
                Konkretes Fristende und Details (Sonderfristen, Verfassungsbeschwerde):{' '}
                <Link
                  to={bgerRechtswegLink({
                    weg: 'zivil',
                    zivilGebiet: bgerGebietFuerStreitsache(f.streitsache),
                    vermoegensrechtlich,
                    ...(vermoegensrechtlich && streitwert !== null ? { streitwert } : {}),
                    objekt: f.rmObjekt === 'endentscheid' ? 'endentscheid' : 'zwischen_anderer',
                    ...(f.rmObjekt === 'vorsorgliche_massnahme' ? { objekt: 'endentscheid', vorsorglich: true } : {}),
                    ...(rechtsmittel.kantonal === 'entfaellt_einzige_instanz' ? { einzigeInstanz: true } : {}),
                    ...(f.kanton !== '' ? { kanton: f.kanton } : {}),
                  })}
                  className="text-brass-700 underline">
                  BGer-Rechner (vorbefüllt)
                </Link>
                {' '}— Rechtsgebiet, Streitwert und Konstellation reisen mit; nur noch die Eröffnung des Entscheids eintragen.{f.rmObjekt === 'zwischenentscheid' ? ' Betrifft der Zwischenentscheid Zuständigkeit oder Ausstand, im Rechner das Objekt auf Art. 92 umstellen (sofortige Anfechtung zwingend).' : ''}
              </p>
            </div>

            {/* Offene Rechtsfragen-Weichen (§8: ehrlich ausweisen) */}
            {rechtsmittel.weichen.map((w, i) => (
              <div key={i} className="lc-notice-warn text-body-s"><NormText text={w} /></div>
            ))}

            <div className="lc-notice text-body-s">{rechtsmittel.fristHinweis}</div>
            <div className="flex flex-wrap gap-1.5">
              {rechtsmittel.normverweise.map((n, i) => <NormLink key={i} artikel={n.artikel} />)}
            </div>

            {/* Mandatstauglicher Output (G3.1 / M-8, 10.6.2026): Aktenzeichen +
                PDF + Teilen auch im Rechtsmittel-Zweig — gleicher geteilter
                Rahmen wie die Einleitungs-Sicht (§10). */}
            <ErgebnisExport aktenzeichen={aktenzeichen} onAktenzeichen={setAktenzeichen}
              query={() => permalinkKodieren(ZUST_LINK_SPEC, { ...f, schritt })}
              pdf={{
                aktenzeichen: aktenzeichen.trim() || undefined,
                title: 'Rechtsmittel-Fahrplan (ZPO/BGG)',
                rechtsgrundlage: 'Bestimmung nach Art. 308 ff., 319 ff. ZPO · Art. 72 ff. BGG',
                domain: 'zustaendigkeit',
                fileBase: 'Rechtsmittel',
                inputs: {
                  'Rechtsweg': 'Zivil — Rechtsmittel',
                  'Streitsache': STREITSACHEN.find((s) => s.code === f.streitsache)?.label ?? f.streitsache,
                  ...(istScheidung ? {} : { 'Streitwert': vermoegensrechtlich && streitwert !== null ? `CHF ${streitwert.toLocaleString('de-CH')}` : 'nicht vermögensrechtlich' }),
                  'Anfechtungsobjekt': f.rmObjekt === 'endentscheid' ? 'Endentscheid' : f.rmObjekt === 'zwischenentscheid' ? 'Zwischenentscheid' : f.rmObjekt === 'vorsorgliche_massnahme' ? 'Vorsorgliche Massnahme' : 'Prozessleitende Verfügung',
                  'Verfahren der Vorinstanz': f.rmVerfahren === 'summarisch' ? 'summarisch' : 'ordentlich/vereinfacht',
                  ...(f.rmVerfahren === 'summarisch' ? { 'Familienrechtliche Summarsache (Art. 271/276/302/305 ZPO)': f.rmFamilienSummarsache ? 'ja' : 'nein' } : {}),
                  'Vorinstanz': f.rmVorinstanz === 'erstinstanz' ? 'Erstinstanzliches Gericht' : f.rmVorinstanz === 'handelsgericht' ? 'Handelsgericht' : 'Oberes Gericht (Direktklage)',
                  ...(f.kanton ? { 'Kanton': f.kanton } : {}),
                },
                hero: {
                  hauptlabel: 'Kantonales Rechtsmittel',
                  hauptwert: rechtsmittel.kantonal === 'berufung' ? 'Berufung'
                    : rechtsmittel.kantonal === 'beschwerde' ? 'Beschwerde'
                    : rechtsmittel.kantonal === 'offen' ? 'Streitwertabhängig'
                    : 'Entfällt (einzige Instanz)',
                  nebenwerte: [
                    ...(rechtsmittel.kantonalFrist && rechtsmittel.kantonalFrist.tage !== null ? [{ label: 'Frist (kantonal)', wert: `${rechtsmittel.kantonalFrist.tage} Tage` }] : []),
                    { label: 'Bundesgericht', wert: rechtsmittel.bger === 'zulaessig' ? `zulässig · ${rechtsmittel.bgerFrist.tage} Tage` : rechtsmittel.bger === 'schwelle_verfehlt' ? 'Grenze nicht erreicht' : 'streitwertabhängig' },
                  ],
                },
                sections: [{ titel: 'Rechtsmittel-Fahrplan', ergebnis: rechtsmittelBericht(rechtsmittel) }],
                disclaimer: DISCLAIMER,
              }} />
          </ErgebnisBlock>
        )}
    </>
  );
}
