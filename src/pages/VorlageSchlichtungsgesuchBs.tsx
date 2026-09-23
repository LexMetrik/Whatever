import { NormText } from '../components/NormText';
import {
  SG_DEFAULTS, SG_PERSON_NATUERLICH, SG_SCHWELLEN, SG_OFFENE_VERIFIKATIONEN, SG_KANTONALE_ERLASSE,
  sgZusammenstellen, sgMaengel, sgHinweise, sgRouting, sgStreitwert, sgPrefillLesen, sgPrefillOrt, fmtCHF,
  sgEingabeArt, type SgAnswers, type SgMangel, type SgPartei, type SgRouting, type SgTyp,
} from '../lib/vorlagen/schlichtungsgesuchBs';
import type { PdfBanner } from '../lib/vorlagen/banner';
import { BetragsFeld } from '../components/BetragsFeld';
import { behoerdeFuer, behoerdeAlsBlock } from '../lib/vorlagen/behoerden';
import { KANTONE } from '../lib/kantone';
import { DatumsFeld } from '../components/DatumsFeld';
import { Checkbox, Field, GruppenTitel, ListenEditor, NICHT_GESPEICHERT_HINWEIS, NormLink, inputCls } from '../components/vorlagen/ui';
import { SelectionGrid } from '../components/ui/SelectionGrid';
import { SgAdressatKachel, SgBehoerdenWahl } from '../components/vorlagen/SgBehoerdenWahl';
import { VorlagenSeite, type SeiteCtx, type VorlagenSeitenConfig } from '../components/vorlagen/VorlagenSeite';
import { ZefixSuche } from '../components/vorlagen/ZefixSuche';
import { uidGueltig, uidNormalisieren } from '../lib/uid';
import { GerichtsGrundlageZeile } from '../components/vorlagen/GerichtsWahlBlock';

// ─── Vorlagen-Wizard: Schlichtungsgesuch (Art. 202 ZPO) · Basel-Stadt ───────
// Routing: Miete/GlG adressieren die paritätische Stelle des Kantons
// (Art. 200 ZPO, Umbau 10.6.2026); Stopp nur noch bei Art.-198-Ausnahmen
// (direkt ans Gericht). Mängelliste mit Sprung zum
// Schritt, Form-Gate (Papierform, Exemplare, Erscheinen, Kosten, Fristen).
// Gemäss Anweisung: KEINE Browser-Storage-APIs – State nur im Speicher.
// W2·29-WERKBANK-VORLAGEN V2e: Orchestrierung (Zustand, Prüfen-Schritt,
// Export, Vorschau) über den geteilten Rahmen `VorlagenSeite` — verhaltens-
// neutral; Eingabe-JSX, Stopp-Fall und Form-Gate unverändert aus dieser Datei.

const SCHRITTE = [
  { id: 'vorpruefung', label: 'Streitgegenstand & Vorprüfung' },
  { id: 'klaeger', label: 'Klagende Partei' },
  { id: 'beklagte', label: 'Beklagte Partei' },
  { id: 'rechtsbegehren', label: 'Rechtsbegehren' },
  { id: 'streitgegenstand', label: 'Streitgegenstand' },
  { id: 'abschluss', label: 'Anträge & Beilagen' },
  { id: 'pruefen', label: 'Prüfen & Download' },
] as const;

const TYPEN: { code: SgTyp; label: string; sub: string }[] = [
  { code: 'geldforderung', label: 'Geldforderung', sub: 'bezifferte Forderung (Art. 84 ZPO)' },
  { code: 'arbeitsrecht', label: 'Arbeitsrecht', sub: 'Forderung aus Arbeitsverhältnis – bis CHF 30\'000 kostenlos' },
  { code: 'uebrige_zivilsache', label: 'Übrige Zivilsache', sub: 'frei formulierte Rechtsbegehren' },
  { code: 'miete_pacht', label: 'Miete / Pacht', sub: 'Wohn-/Geschäftsräume – eigene Stelle' },
  { code: 'gleichstellung_glg', label: 'Gleichstellung (GlG)', sub: 'eigene Stelle, kostenlos' },
];

const BANNER_SG: PdfBanner = {
  titel: 'NACH DEM AUSDRUCK EIGENHÄNDIG UNTERZEICHNEN',
  text: 'Einreichung in Papierform mit Unterschrift (Art. 130 ZPO); elektronisch nur mit anerkannter qualifizierter Signatur. Je ein Exemplar für die Behörde und jede Gegenpartei (Art. 131 ZPO).',
};

/** Rechenwerte der Seite — EIN Engine-Lauf je Antwortstand (useMemo im Rahmen). */
type SgZ = {
  ergebnis: ReturnType<typeof sgZusammenstellen>;
  routing: SgRouting | null;
  maengel: SgMangel[];
  hinweise: string[];
  sw: number | null;
};
type Ctx = SeiteCtx<SgAnswers, SgZ>;

const stoppVon = (routing: SgRouting | null) => routing !== null && !routing.dokument;

// ── Stopp-Karte (hilfreich statt sackgassig) ──
const stoppKarte = (routing: SgRouting | null) => {
  if (!routing || routing.dokument) return null;
  if (routing.stopp === 'art198') return (
    <div className="lc-notice-warn p-5 space-y-2">
      <p className="lc-overline text-warn-700">Kein Schlichtungsverfahren</p>
      <p className="text-body-s text-ink-700">
        In diesem Fall findet kein Schlichtungsverfahren statt; die Klage ist direkt beim
        zuständigen Gericht einzureichen (Art. 198 ZPO).
      </p>
      <p><NormLink artikel="Art. 198 ZPO" /></p>
    </div>
  );
  return null;
};

// Eingabe-Schritte als Komponente (Muster Klagen): `prefillOrt` wird wie
// bisher je Render aus der Adresse gelesen.
function EingabeSchritt({ ctx, schritt }: { ctx: Ctx; schritt: number }) {
  const { a, set } = ctx;
  const { routing, sw } = ctx.z;
  // S-4: Orts-Vorgabe aus dem Zuständigkeitsrechner → die Behörden-Wahl
  // löst daraus die konkrete Stelle samt Adresse auf (voll editierbar).
  const prefillOrt = (() => {
    try { return sgPrefillOrt(window.location.search); } catch { return { plz: '', gemeinde: '' }; }
  })();
  const verm = a.streitgegenstandTyp === 'geldforderung' || a.streitgegenstandTyp === 'arbeitsrecht';
  const stopp = stoppVon(routing);

  // ── Partei-Editor (klagend/beklagt identisch) ──
  const parteiEditor = (liste: SgPartei[], setListe: (p: SgPartei[]) => void, rolle: string) => (
    /* R2-F/F1-9: Repeater auf den geteilten ListenEditor. Die Typ-Wahl
       (natürliche/juristische Person) rutscht dabei aus der Kopfzeile in den
       Eintrag — die Kopfzeile trägt im Kanon nur Titel und Entfernen-Link.
       `mindestens={1}`: eine klagende bzw. beklagte Partei muss stehen
       bleiben (bisher als `liste.length > 1`-Bedingung am Knopf). */
    <ListenEditor
      element={rolle}
      eintraege={liste}
      mindestens={1}
      onHinzufuegen={() => setListe([...liste, { ...SG_PERSON_NATUERLICH }])}
      onEntfernen={(i) => setListe(liste.filter((_, j) => j !== i))}
      kopf={(_p, i) => `${rolle} ${liste.length > 1 ? i + 1 : ''}`.trim()}
      kinder={(p, i) => (
        <div className="space-y-3">
          <select className={inputCls + ' !w-auto text-body-s'} value={p.typ}
            aria-label={`Art der Partei (${rolle} ${i + 1})`}
            onChange={(e) => {
              const typ = e.target.value as SgPartei['typ'];
              setListe(liste.map((x, j) => j === i ? (typ === 'natuerlich'
                ? { ...SG_PERSON_NATUERLICH }
                : { typ: 'juristisch', firma: '', sitzStrasse: '', sitzPlz: '', sitzOrt: '' }) : x));
            }}>
            <option value="natuerlich">natürliche Person</option>
            <option value="juristisch">juristische Person</option>
          </select>
          {p.typ === 'natuerlich' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Vorname"><input className={inputCls} value={p.vorname} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, vorname: e.target.value } : x))} /></Field>
              <Field label="Name"><input className={inputCls} value={p.name} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, name: e.target.value } : x))} /></Field>
              <Field label="Strasse / Nr."><input className={inputCls} value={p.strasse} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, strasse: e.target.value } : x))} /></Field>
              <div className="grid grid-cols-[6rem_1fr] gap-3">
                <Field label="PLZ"><input className={inputCls} inputMode="numeric" maxLength={4} placeholder="4051" value={p.plz} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, plz: e.target.value } : x))} /></Field>
                <Field label="Ort"><input className={inputCls} value={p.ort} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, ort: e.target.value } : x))} /></Field>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Firma"><input className={inputCls} value={p.firma} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, firma: e.target.value } : x))} /></Field>
              <Field label="Rechtsform" optional><input className={inputCls} placeholder="z. B. AG, GmbH" value={p.rechtsform ?? ''} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, rechtsform: e.target.value } : x))} /></Field>
              <Field label="UID" optional hint={p.uid?.trim() && !uidGueltig(p.uid) ? 'Prüfziffer stimmt nicht — Format CHE-xxx.xxx.xxx' : undefined}>
                <input className={inputCls} placeholder="CHE-xxx.xxx.xxx" value={p.uid ?? ''}
                  onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, uid: e.target.value } : x))}
                  onBlur={() => { const n = p.uid ? uidNormalisieren(p.uid) : null; if (n && n !== p.uid) setListe(liste.map((x, j) => j === i ? { ...p, uid: n } : x)); }} />
              </Field>
              <div className="sm:col-span-2">
                <ZefixSuche firma={p.firma} uid={p.uid} onUebernehmen={(t) =>
                  setListe(liste.map((x, j) => j === i ? {
                    ...p, firma: t.firma, uid: t.uid,
                    sitzStrasse: t.strasse || p.sitzStrasse,
                    sitzPlz: t.plz || p.sitzPlz,
                    sitzOrt: t.ort || p.sitzOrt,
                  } : x))} />
              </div>
              <Field label="Sitz: Strasse / Nr."><input className={inputCls} value={p.sitzStrasse} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, sitzStrasse: e.target.value } : x))} /></Field>
              <div className="grid grid-cols-[6rem_1fr] gap-3">
                <Field label="PLZ"><input className={inputCls} inputMode="numeric" maxLength={4} value={p.sitzPlz} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, sitzPlz: e.target.value } : x))} /></Field>
                <Field label="Ort"><input className={inputCls} value={p.sitzOrt} onChange={(e) => setListe(liste.map((x, j) => j === i ? { ...p, sitzOrt: e.target.value } : x))} /></Field>
              </div>
              <Field label="Zeichnungsberechtigte Person" optional hint="unterzeichnet bei unvertretener juristischer Person">
                <input className={inputCls} placeholder="Name, Funktion" value={p.zeichnungsberechtigt ? `${p.zeichnungsberechtigt.name}, ${p.zeichnungsberechtigt.funktion}` : ''}
                  onChange={(e) => {
                    const [name = '', funktion = ''] = e.target.value.split(',').map((x) => x.trim());
                    setListe(liste.map((x, j) => j === i ? { ...p, zeichnungsberechtigt: name ? { name, funktion } : undefined } : x));
                  }} />
              </Field>
            </div>
          )}
        </div>
      )}
    />
  );

  const inhalt = () => {
    switch (SCHRITTE[schritt].id) {
      case 'vorpruefung': return (
        <div className="space-y-5">
          {/* Behörden-Grundgerüst (5.6.2026): Kanton zuerst – Registry löst
              die VOLLSTÄNDIGE Adresse auf (Pilot BS); Handeingabe als Override */}
          <div className="space-y-3">
            <GruppenTitel>Zuständige Schlichtungsbehörde</GruppenTitel>
            {/* Original-Basel-Darstellung für ALLE Kantone (Auftrag David
                10.6.2026): Kantonswahl links, lc-tile-Adresskachel daneben —
                gespiesen aus der Registry (BS) bzw. der Auflösung darunter. */}
            <div className="grid grid-cols-[8rem_1fr] gap-3 items-start">
              <Field label="Kanton">
                <select className={inputCls} value={a.gerichtsKanton}
                  onChange={(e) => set('gerichtsKanton', e.target.value as SgAnswers['gerichtsKanton'])}>
                  {KANTONE.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              {!a.behoerdeManuellAktiv && (() => {
                const reg = behoerdeFuer(sgEingabeArt(routing?.dokument ? routing.behoerdeTyp : 'ordentlich'), a.gerichtsKanton);
                if (reg) return <SgAdressatKachel zeilen={behoerdeAlsBlock(reg).split('\n')} url={reg.url} />;
                if (a.behoerdeAufgeloest) return <SgAdressatKachel zeilen={a.behoerdeAufgeloest.zeilen} url={a.behoerdeAufgeloest.url} />;
                return (
                  <div className="lc-notice text-body-s">
                    Behörde wird unten über die Recherche-Daten des Kantons {a.gerichtsKanton} bestimmt
                    — oder von Hand erfassen.
                  </div>
                );
              })()}
            </div>
            <GerichtsGrundlageZeile kanton={a.gerichtsKanton} />
            {a.gerichtsKanton !== 'BS' && !a.behoerdeManuellAktiv && (
              <SgBehoerdenWahl kanton={a.gerichtsKanton}
                typ={routing?.dokument ? routing.behoerdeTyp : 'ordentlich'}
                startPlz={prefillOrt.plz} startGemeinde={prefillOrt.gemeinde}
                streitwertCHF={sw} arbeitsrechtlich={a.streitgegenstandTyp === 'arbeitsrecht'}
                onAufgeloest={(z) => set('behoerdeAufgeloest', z ?? undefined)} />
            )}
            {routing?.dokument && routing.behoerdeTyp !== 'ordentlich' && (
              <p className="lc-notice text-body-s">
                Für {routing.behoerdeTyp === 'paritaetisch_miete' ? 'Miete und Pacht von Wohn- und Geschäftsräumen' : 'Streitigkeiten nach Gleichstellungsgesetz'} ist
                die paritätische Schlichtungsstelle zuständig ({routing.behoerdeTyp === 'paritaetisch_miete' ? 'Art. 200 Abs. 1 ZPO' : 'Art. 200 Abs. 2 ZPO'}) —
                sie wird als Adressat des Gesuchs eingesetzt.
                {routing.behoerdeTyp === 'paritaetisch_miete' && (
                  <> Hinweis: Die Klagebewilligung gilt hier nur {SG_SCHWELLEN.KLAGEBEWILLIGUNG_MIETE_TAGE} Tage (Art. 209 Abs. 4 ZPO).</>
                )}
              </p>
            )}
            <Checkbox
              checked={a.behoerdeManuellAktiv ?? false}
              onChange={(v) => set('behoerdeManuellAktiv', v || undefined)}
              label={<><span>Adresse der Behörde/des Gerichts von Hand erfassen <span className="text-ink-500">(übersteuert die hinterlegte Anschrift)</span></span></>} />
            {a.behoerdeManuellAktiv && (
              // Layout-Anpassung 11.6.2026 (Auftrag David «zu kleine Kacheln»):
              // Behördenname volle Breite (lange amtliche Bezeichnungen),
              // Strasse + PLZ/Ort zweispaltig — statt drei gequetschter Felder.
              (<div className="space-y-3 pl-6">
                <Field label="Behörde/Gericht">
                  <input className={inputCls} value={a.behoerdeManuell?.name ?? ''}
                    onChange={(e) => set('behoerdeManuell', { name: e.target.value, strasse: a.behoerdeManuell?.strasse ?? '', plzOrt: a.behoerdeManuell?.plzOrt ?? '' })}
                    placeholder="z. B. Friedensrichteramt X" />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Strasse und Hausnummer">
                    <input className={inputCls} value={a.behoerdeManuell?.strasse ?? ''}
                      onChange={(e) => set('behoerdeManuell', { name: a.behoerdeManuell?.name ?? '', strasse: e.target.value, plzOrt: a.behoerdeManuell?.plzOrt ?? '' })}
                      placeholder="z. B. Gerichtsgasse 1" />
                  </Field>
                  <Field label="PLZ und Ort">
                    <input className={inputCls} value={a.behoerdeManuell?.plzOrt ?? ''}
                      onChange={(e) => set('behoerdeManuell', { name: a.behoerdeManuell?.name ?? '', strasse: a.behoerdeManuell?.strasse ?? '', plzOrt: e.target.value })}
                      placeholder="z. B. 4001 Basel" />
                  </Field>
                </div>
              </div>)
            )}
            {a.gerichtsKanton !== 'BS' && a.behoerdeManuellAktiv && (
              <p className="lc-notice-warn text-body-s">
                Hinweis: Das sachliche Routing dieses Wizards (Spezialbehörden, Schwellen) ist auf
                Basel-Stadt zugeschnitten – die Zuständigkeit im Kanton {a.gerichtsKanton} ist
                selbständig zu prüfen.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <GruppenTitel>Art des Streitgegenstands</GruppenTitel>
            <SelectionGrid
              className="grid grid-cols-1 sm:grid-cols-2 gap-2"
              items={TYPEN.map((t) => ({ code: t.code, label: t.label, sub: t.sub }))}
              value={a.streitgegenstandTyp}
              onSelect={(code) => set('streitgegenstandTyp', code)}
            />
          </div>
          {stopp ? stoppKarte(routing) : (
            <>
              <Checkbox
                checked={a.ausnahmeArt198}
                onChange={(v) => set('ausnahmeArt198', v)}
                label={<><span><NormText text={`Es liegt eine Ausnahme nach Art. 198 ZPO vor `} /><span className="text-ink-500">(z. B. summarisches Verfahren, Scheidung, bestimmte SchKG-Klagen, Widerklage, einzige kantonale Instanz)</span></span></>} />
              <p className="text-xs text-ink-500">
                Dieses Werkzeug stellt das Gesuch zusammen; die örtliche und sachliche Zuständigkeit
                prüfen Sie selbst (massgebliche Gerichtsstände u. a. Art. 10, 31, 33, 34, 35 ZPO;
                BGE 146 III 265 – zu verifizieren).
              </p>
              {a.streitgegenstandTyp === 'uebrige_zivilsache' && (
                <Field label="Streitwert (CHF)" optional hint="für die Schwellen-Logik (Art. 210/212 ZPO); bei Geldforderungen automatisch">
                  <BetragsFeld className={inputCls + ' w-40'} value={a.streitwert ?? ''} onChange={(v) => set('streitwert', v)} />
                </Field>
              )}
            </>
          )}
        </div>
      );

      case 'klaeger': return (
        <div className="space-y-5">
          {parteiEditor(a.klaeger, (p) => set('klaeger', p), 'Klagende Partei')}
          {/* R2-F-Nachzug: der frühere Knopf hiess «+ Weitere Partei
              (Streitgenossenschaft)» — der Fachbegriff darf mit der
              Vereinheitlichung nicht verschwinden (§8, Wiederherstellung). */}
          <p className="text-body-s text-ink-600">Mehrere klagende oder beklagte
            Parteien bilden eine Streitgenossenschaft.</p>
          <div className="space-y-3">
            <Checkbox
              checked={!!a.vertretung}
              onChange={(v) => set('vertretung', v ? { bezeichnung: '', strasse: '', plz: '', ort: '' } : undefined)}
              label={<>Die klagende Partei ist vertreten (Anwältin/Anwalt, Rechtsdienst)
                            </>} />
            {a.vertretung && (
              <div className="lc-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Bezeichnung der Vertretung"><input className={inputCls} placeholder="z. B. Adv. Dr. iur. X" value={a.vertretung.bezeichnung} onChange={(e) => set('vertretung', { ...a.vertretung!, bezeichnung: e.target.value })} /></Field>
                <Field label="Kanzlei / Zusatz" optional><input className={inputCls} value={a.vertretung.zusatz ?? ''} onChange={(e) => set('vertretung', { ...a.vertretung!, zusatz: e.target.value })} /></Field>
                <Field label="Strasse / Nr."><input className={inputCls} value={a.vertretung.strasse} onChange={(e) => set('vertretung', { ...a.vertretung!, strasse: e.target.value })} /></Field>
                <div className="grid grid-cols-[6rem_1fr] gap-3">
                  <Field label="PLZ"><input className={inputCls} maxLength={4} value={a.vertretung.plz} onChange={(e) => set('vertretung', { ...a.vertretung!, plz: e.target.value })} /></Field>
                  <Field label="Ort"><input className={inputCls} value={a.vertretung.ort} onChange={(e) => set('vertretung', { ...a.vertretung!, ort: e.target.value })} /></Field>
                </div>
                <Field label="Vollmacht vom" optional hint="wird automatisch ins Beilagenverzeichnis aufgenommen">
                  <DatumsFeld value={a.vertretung.vollmachtDatum ?? ''} onChange={(v) => set('vertretung', { ...a.vertretung!, vollmachtDatum: v })} className={inputCls} />
                </Field>
                <Checkbox
                  checked={a.vertretung.mwstPflichtig ?? false}
                  onChange={(v) => set('vertretung', { ...a.vertretung!, mwstPflichtig: v })}
                  label={<>mehrwertsteuerpflichtig (Kostenfolge «zzgl. MwSt.»)
                                    </>}
                  className='self-end pb-2' />
              </div>
            )}
          </div>
        </div>
      );

      case 'beklagte': return (
        <div className="space-y-5">
          {parteiEditor(a.beklagte, (p) => set('beklagte', p), 'Beklagte Partei')}
          {verm && (
            <div className="space-y-3">
              <Checkbox
                checked={!!a.betreibung}
                onChange={(v) => set('betreibung', v ? { nummer: '', betreibungsamt: 'Basel-Stadt', rechtsvorschlagErhoben: false } : undefined)}
                label={<>Es läuft bereits eine Betreibung
                                </>} />
              {a.betreibung && (
                <div className="lc-card p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Betreibungs-Nr."><input className={inputCls} value={a.betreibung.nummer} onChange={(e) => set('betreibung', { ...a.betreibung!, nummer: e.target.value })} /></Field>
                  <Field label="Betreibungsamt"><input className={inputCls} value={a.betreibung.betreibungsamt} onChange={(e) => set('betreibung', { ...a.betreibung!, betreibungsamt: e.target.value })} /></Field>
                  <Checkbox
                    checked={a.betreibung.rechtsvorschlagErhoben}
                    onChange={(v) => set('betreibung', { ...a.betreibung!, rechtsvorschlagErhoben: v })}
                    label={<>Die beklagte Partei hat Rechtsvorschlag erhoben
                                        </>}
                    className='sm:col-span-2' />
                </div>
              )}
            </div>
          )}
        </div>
      );

      case 'rechtsbegehren': return (
        <div className="space-y-5">
          {verm ? (
            <>
              {/* D-3 (31.8.2026): Pillen-Reihe über den geteilten Baustein
                  (`ui/SelectionGrid`, variant «pille»). Der aktive Pfad ist eine
                  ABLEITUNG aus `a.unbeziffert` — der Baustein vergleicht `value`
                  mit dem Code; die Umschalt-Logik bleibt unverändert hier. */}
              <SelectionGrid
                variant="pille"
                gruppenLabel="Pfad"
                className="flex flex-wrap gap-1.5"
                items={[
                  { code: 'beziffert', label: 'Bezifferte Forderung' },
                  { code: 'unbeziffert', label: 'Unbeziffert (Art. 85 ZPO)' },
                ] as const}
                value={a.unbeziffert ? 'unbeziffert' : 'beziffert'}
                onSelect={(code) => {
                  if (code === 'unbeziffert') { set('unbeziffert', a.unbeziffert ?? { mindestbetrag: '', grund: '' }); set('geld', undefined); }
                  else { set('unbeziffert', undefined); set('geld', a.geld ?? { betrag: '' }); }
                }}
              />
              {!a.unbeziffert ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Forderungsbetrag (CHF)" hint="zu beziffern (Art. 84 Abs. 2 ZPO) – z. B. 3000">
                    <input className={inputCls} inputMode="decimal" placeholder="z. B. 3'000.00" value={a.geld?.betrag ?? ''} onChange={(e) => set('geld', { ...(a.geld ?? { betrag: '' }), betrag: e.target.value })} />
                  </Field>
                  <div className="space-y-2">
                    <Checkbox
                      checked={!!a.geld?.zins}
                      onChange={(v) => set('geld', { ...(a.geld ?? { betrag: '' }), zins: v ? { satz: '5', abDatum: '' } : undefined })}
                      label={<><span>nebst Zins <span className="text-ink-500"><NormText text={`(Verzugszins 5 %, Art. 104 OR)`} /></span></span></>} />
                    {a.geld?.zins && (
                      <div className="grid grid-cols-[6rem_1fr] gap-3">
                        <Field label="Satz (%)"><input className={inputCls} inputMode="decimal" value={a.geld.zins.satz} onChange={(e) => set('geld', { ...a.geld!, zins: { ...a.geld!.zins!, satz: e.target.value } })} /></Field>
                        <Field label="seit"><DatumsFeld value={a.geld.zins.abDatum} onChange={(v) => set('geld', { ...a.geld!, zins: { ...a.geld!.zins!, abDatum: v } })} className={inputCls} /></Field>
                      </div>
                    )}
                  </div>
                  <label className={`flex items-start gap-2 text-body-s sm:col-span-2 ${a.betreibung?.rechtsvorschlagErhoben ? 'cursor-pointer text-ink-700' : 'text-ink-500 cursor-not-allowed'}`}>
                    <input type="checkbox" disabled={!a.betreibung?.rechtsvorschlagErhoben} checked={!!a.geld?.rechtsoeffnung}
                      onChange={(e) => set('geld', { ...(a.geld ?? { betrag: '' }), rechtsoeffnung: e.target.checked })} />
                    <span>Beseitigung des Rechtsvorschlags beantragen {!a.betreibung?.rechtsvorschlagErhoben && <span>(setzt erhobenen Rechtsvorschlag voraus – Schritt «Beklagte Partei»)</span>}</span>
                  </label>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Mindestbetrag (CHF)" hint="gilt als vorläufiger Streitwert (Art. 85 ZPO)">
                    <BetragsFeld className={inputCls} value={a.unbeziffert.mindestbetrag} onChange={(v) => set('unbeziffert', { ...a.unbeziffert!, mindestbetrag: v } )} />
                  </Field>
                  <Field label="Warum ist die Bezifferung nicht möglich/zumutbar?">
                    <input className={inputCls} placeholder="z. B. Höhe vom Beweisverfahren abhängig" value={a.unbeziffert.grund} onChange={(e) => set('unbeziffert', { ...a.unbeziffert!, grund: e.target.value })} />
                  </Field>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-body-s text-ink-600">
                Rechtsbegehren präzise und vollstreckbar formulieren (bestimmtes Tun, Unterlassen
                oder Dulden; Geld beziffern). Die Einträge werden 1:1 übernommen.
              </p>
              {/* Die Nummer stand als eigene `<span>1.</span>`-Spalte davor;
                  im ListenEditor trägt sie die Kopfzeile des Eintrags. */}
              <ListenEditor
                element="Rechtsbegehren"
                eintraege={a.freieRechtsbegehren}
                className="space-y-2"
                onHinzufuegen={() => set('freieRechtsbegehren', [...a.freieRechtsbegehren, ''])}
                onEntfernen={(i) => set('freieRechtsbegehren', a.freieRechtsbegehren.filter((_, j) => j !== i))}
                kinder={(r, i) => (
                  <textarea className={inputCls} rows={2} value={r} aria-label={`Rechtsbegehren ${i + 1}`}
                    onChange={(e) => set('freieRechtsbegehren', a.freieRechtsbegehren.map((x, j) => j === i ? e.target.value : x))} />
                )}
              />
            </div>
          )}
          <div className="space-y-2">
            <GruppenTitel>Weitere Rechtsbegehren <span className="normal-case text-ink-500">· optional</span></GruppenTitel>
            <ListenEditor
              element="Zusatzbegehren"
              eintraege={a.weitereRechtsbegehren}
              className="space-y-2"
              onHinzufuegen={() => set('weitereRechtsbegehren', [...a.weitereRechtsbegehren, ''])}
              onEntfernen={(i) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.filter((_, j) => j !== i))}
              kinder={(r, i) => (
                <textarea className={inputCls} rows={2} value={r} aria-label={`Zusatzbegehren ${i + 1}`}
                  onChange={(e) => set('weitereRechtsbegehren', a.weitereRechtsbegehren.map((x, j) => j === i ? e.target.value : x))} />
              )}
            />
            <p className="text-xs text-ink-500">Die Kostenfolge wird automatisch als letztes Begehren ergänzt.</p>
          </div>
        </div>
      );

      case 'streitgegenstand': return (
        <div className="space-y-4">
          <Field label="Streitgegenstand" hint="kurze Umschreibung in wenigen Sätzen oder Stichworten (Pflicht, Art. 202 Abs. 2 ZPO)">
            <textarea className={inputCls} rows={3} value={a.streitgegenstand}
              placeholder="z. B. Forderung aus Werkvertrag vom 01.02.2025 (Rechnung Nr. 1234)"
              onChange={(e) => set('streitgegenstand', e.target.value)} />
          </Field>
          {/* Auftrag David 11.6.2026: wahlweise Platzhalter im Dokument. */}
          <Checkbox
            checked={a.begruendungPlatzhalter ?? false}
            onChange={(v) => set('begruendungPlatzhalter', v || undefined)}
            label={<><span>Begründung später ausfüllen <span className="text-ink-500"><NormText text={`(das Gesuch erhält einen Platzhalter-Block; eine Begründung ist nicht erforderlich, Art. 202 ZPO)`} /></span></span></>} />
          {a.begruendungPlatzhalter ? (
            <p className="lc-notice-warn text-body-s">
              Das Gesuch enthält unter «Begründung» Platzhalter-Linien («________») zum Handausfüllen.
            </p>
          ) : (
            <Field label="Begründung" optional hint="nicht erforderlich – eine kurze Begründung ist möglich">
              <textarea className={inputCls} rows={4} value={a.begruendung ?? ''} onChange={(e) => set('begruendung', e.target.value)} />
            </Field>
          )}
        </div>
      );

      case 'abschluss': return (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className={`flex items-start gap-2 text-body-s ${verm && sw !== null && sw <= SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG ? 'cursor-pointer text-ink-700' : 'text-ink-500 cursor-not-allowed'}`}>
              <input type="checkbox" className="mt-0.5"
                disabled={!(verm && sw !== null && sw <= SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG)}
                checked={a.antragEntscheid} onChange={(e) => set('antragEntscheid', e.target.checked)} />
              <span>Antrag auf Entscheid der Schlichtungsbehörde (Art. 212 ZPO)
                {!(verm && sw !== null && sw <= SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG) &&
                  <span> – nur bei vermögensrechtlichen Streitigkeiten bis CHF {fmtCHF(String(SG_SCHWELLEN.ENTSCHEID_AUF_ANTRAG))}</span>}
              </span>
            </label>
            <Checkbox
              checked={a.antragMediation}
              onChange={(v) => set('antragMediation', v)}
              label={<><span><NormText text={`Antrag auf Mediation (Art. 213 ZPO) `} /><span className="text-ink-500">— setzt Zustimmung der Gegenpartei voraus; kann auch erst an der Verhandlung gestellt werden</span></span></>} />
          </div>
          <div className="space-y-2">
            <GruppenTitel>Beilagen</GruppenTitel>
            {a.vertretung?.bezeichnung && <p className="text-xs text-ink-500">«Vollmacht» wird automatisch aufgenommen.</p>}
            <ListenEditor
              element="Beilage"
              eintraege={a.beilagen}
              className="space-y-2"
              onHinzufuegen={() => set('beilagen', [...a.beilagen, { bezeichnung: '' }])}
              onEntfernen={(i) => set('beilagen', a.beilagen.filter((_, j) => j !== i))}
              kinder={(b, i) => (
                <input className={inputCls} value={b.bezeichnung} placeholder="z. B. Vertrag vom 01.02.2025"
                  aria-label={`Beilage ${i + 1}`}
                  onChange={(e) => set('beilagen', a.beilagen.map((x, j) => j === i ? { bezeichnung: e.target.value } : x))} />
              )}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Ort"><input className={inputCls} value={a.ort} onChange={(e) => set('ort', e.target.value)} /></Field>
            <Field label="Datum"><DatumsFeld value={a.datum} onChange={(v) => set('datum', v)} className={inputCls} /></Field>
          </div>
        </div>
      );

      // «pruefen» rendert der Rahmen (pruefenZusatz/pruefenFuss unten).
      case 'pruefen': return null;
    }
  };
  return inhalt();
}

const CONFIG: VorlagenSeitenConfig<SgAnswers, SgZ> = {
  cardId: 'schlichtungsgesuch',
  defaults: SG_DEFAULTS,
  // KEIN speicherKey: Anweisung «keine Browser-Storage-APIs» – Zustand nur im
  // Speicher; zuruecksetzen leert entsprechend nur den Speicher-Zustand.
  // Darum auch kein Profil-Prefill (läse den Browser-Speicher).
  profilPrefill: false,
  // Prefill (Phase 4 Zuständigkeitsengine): Query-Vorbelegung beim ersten
  // Render, voll editierbar; SSR-sicher via try/catch (kein window im Smoke).
  defaultsZusatz: () => { try { return sgPrefillLesen(window.location.search) ?? {}; } catch { return {}; } },
  zusammenstellen: (a) => ({
    ergebnis: sgZusammenstellen(a),
    routing: sgRouting(a),
    maengel: sgMaengel(a),
    hinweise: sgHinweise(a),
    sw: sgStreitwert(a),
  }),
  // Mängel sperren den Export (Leiste); der Direkt-Export der Vorschau war nie
  // gesperrt (direktExportBlocker: false).
  pruefeGates: (_a, z) => ({ blocker: z.maengel.map((m) => m.text), warnungen: [], hinweise: [] }),
  schritte: SCHRITTE,
  overlineFallback: 'Zivilprozess (ZPO)',
  overlineZusatz: () => 'Basel-Stadt',
  titel: 'Schlichtungsgesuch (Basel-Stadt)',
  intro: 'Stellt ein Schlichtungsgesuch nach Art. 202 ZPO für die Basler Schlichtungsbehörde zusammen – Parteien, Rechtsbegehren, Streitgegenstand, Anträge und Beilagen, aus festen Bausteinen ohne Sprachmodell.',
  badge: 'Papierform · eigenhändig unterzeichnen',
  fussnote: NICHT_GESPEICHERT_HINWEIS,
  eingabeInhalt: (ctx, schritt) => <EingabeSchritt ctx={ctx} schritt={schritt} />,
  fehlerEingabe: (a, i) => sgMaengel(a).filter((m) => m.schritt === i).map((m) => m.text),
  fehlerEingabeImLetztenSchritt: true,
  // Bewusst OHNE `fehler`: `weiterDeaktiviert` (Stopp) ist die
  // Navigations-Regel dieser Fläche (Art. 198 ZPO), und sie bleibt.
  // `fehlerJeSchritt` ändert die Navigation nicht — es sagt nur, was im
  // Prüfen-Schritt offen ist. Im Stopp-Fall entsteht kein Dokument, dann
  // ist auch der Befund gegenstandslos.
  fehlerBox: false,
  pruefBefund: ({ z }) => !stoppVon(z.routing),
  weiterDeaktiviert: ({ z }) => stoppVon(z.routing),
  pruefenZusatz: ({ a, z }) => {
    const { routing, ergebnis, hinweise, sw } = z;
    const stopp = stoppVon(routing);
    return (
      <>
        {stopp && stoppKarte(routing)}

        {/* D5 (W2·24, §17-Gegengewicht): Hier stand eine eigene «Mängelliste»
            — role=alert, Aufzählung, «zum Schritt →» je Zeile. Genau das
            leistet seit D5 der geteilte `PruefBefund` im Wizard-Rahmen, aus
            derselben Quelle (`sgMaengel` über `fehlerJeSchritt`). Der
            Zweitbau ist darum gestrichen, nicht bewacht (§5/§10): die Liste
            erscheint unverändert, jetzt gruppiert nach Schritt und mit dem
            Fokus-Sprung des Rahmens. Der Stopp-Fall (Art. 198 ZPO) rendert
            gar keinen Wizard-Inhalt und bleibt unberührt. */}
        {!stopp && hinweise.map((h, i) => (
          <div key={i} className="lc-notice text-body-s">{h}</div>
        ))}

        {/* Form-Gate (Art. 130/131/204/206/209 ZPO; Kosten GGR BS) */}
        {!stopp && (
          <section className="lc-highlight space-y-3">
            <p className="lc-overline text-brass-700">Form-Gate – Einreichung & Verfahren</p>
            <ul className="lc-list space-y-2 text-body-s text-ink-700">
              <li><strong>Form:</strong><NormText text={` schriftlich in Papierform, eigenhändig unterzeichnet (Art. 130 ZPO) – von der klagenden Partei, der Vertretung bzw. der zeichnungsberechtigten Person. Elektronisch nur mit anerkannter qualifizierter Signatur; gewöhnliche E-Mail genügt nicht.`} /></li>
              <li><strong>Exemplare:</strong><NormText text={` Gesuch, Beilagenverzeichnis und Beilagen in je einem Exemplar für die Behörde und jede Gegenpartei (Art. 131 ZPO) – hier: `} /><span className="num font-semibold">{ergebnis.exemplare}</span> Exemplare.</li>
              {a.vertretung?.bezeichnung && <li><strong>Vollmacht</strong> beilegen.</li>}
              <li><strong>Persönliches Erscheinen</strong> an der Verhandlung (Art. 204 ZPO); Dispens u. a. bei ausserkantonalem/ausländischem Wohnsitz oder Streitwert bis CHF {fmtCHF(String(SG_SCHWELLEN.ARBEITSRECHT_KOSTENLOS))} (Abs. 3). Säumnis der klagenden Partei: Gesuch gilt als zurückgezogen; Ordnungsbusse bis CHF {fmtCHF(String(SG_SCHWELLEN.ORDNUNGSBUSSE_MAX))} möglich (Art. 206 Abs. 4 ZPO).</li>
              <li><strong>Klagebewilligung:</strong> bei Nichteinigung {routing?.dokument && routing.behoerdeTyp === 'paritaetisch_miete'
                ? <>nur {SG_SCHWELLEN.KLAGEBEWILLIGUNG_MIETE_TAGE} Tage gültig (Art. 209 Abs. 4 ZPO)</>
                : <>{SG_SCHWELLEN.KLAGEBEWILLIGUNG_MONATE} Monate gültig (Art. 209 Abs. 3 ZPO)</>}.</li>
              {routing?.dokument && routing.behoerdeTyp !== 'ordentlich' ? (
                <li><strong>Kosten:</strong> Das Schlichtungsverfahren ist hier gerichtskostenfrei ({routing.behoerdeTyp === 'paritaetisch_glg' ? 'Art. 113 Abs. 2 lit. a ZPO' : 'Art. 113 Abs. 2 lit. c ZPO'}); grundsätzlich keine Parteientschädigung (Art. 113 Abs. 1 ZPO).</li>
              ) : (
                <li><strong>Kosten:</strong> Gebühr ab CHF 100 bis max. 30 % der Gerichtsgebühr (GGR BS, SG 154.810 – §-Nummer zu verifizieren); grundsätzlich keine Parteientschädigung.{a.streitgegenstandTyp === 'arbeitsrecht' && sw !== null && sw <= SG_SCHWELLEN.ARBEITSRECHT_KOSTENLOS && <> <strong>Hier: kostenlos</strong> (arbeitsrechtlich bis CHF {fmtCHF(String(SG_SCHWELLEN.ARBEITSRECHT_KOSTENLOS))}, Art. 113 f. ZPO).</>}</li>
              )}
              <li><strong>Fristen:</strong><NormText text={` Im Schlichtungsverfahren gelten keine Gerichtsferien (Art. 145 Abs. 2 lit. a ZPO); die anschliessende Klagefrist gehört zum Entscheidverfahren – dort gelten sie (BGE 138 III 615 – zu verifizieren).`} /></li>
            </ul>
          </section>
        )}
      </>
    );
  },
  ortDatumImPruefen: false,
  // Keine Bestätigungs-Checkbox auf dieser Fläche: der Export sperrt allein an
  // den Mängeln; im Stopp-Fall gibt es keine Export-Leiste.
  ohneBestaetigung: true,
  bestaetigung: null,
  bestaetigungLabel: null,
  exportLeiste: ({ z }) => !stoppVon(z.routing),
  // Offene Verifikationen (transparent, dezent)
  pruefenFuss: (
    <details className="lc-card p-4">
      <summary className="cursor-pointer text-body-s font-medium text-ink-700">Offene Verifikationen ({SG_OFFENE_VERIFIKATIONEN.length})</summary>
      <ul className="mt-2 space-y-1.5">
        {SG_OFFENE_VERIFIKATIONEN.map((v, i) => <li key={i} className="text-xs text-ink-600">– {v}</li>)}
      </ul>
      <p className="text-xs text-ink-500 mt-2">
        Kantonale Erlasse (nur Erlass-Seiten, keine §-Anker):{' '}
        {SG_KANTONALE_ERLASSE.map((e, i) => (
          <span key={e.label}>{i > 0 && ' · '}<a className="text-brass-700 hover:underline" href={e.url} target="_blank" rel="noopener noreferrer">{e.label}</a></span>
        ))}
      </p>
    </details>
  ),
  vorschauKompakt: true,
  vorschauErsatz: ({ z }) => (stoppVon(z.routing)
    ? <div className="lc-card p-5 text-body-s text-ink-600"><NormText text={`Kein Dokument – siehe Stopp-Hinweis: In diesem Fall findet kein Schlichtungsverfahren statt — die Klage geht direkt ans Gericht (Art. 198 ZPO).`} /></div>
    : undefined),
  vorschauNichtAufgenommen: ({ z }) => z.ergebnis.nichtAufgenommen,
  direktExportBlocker: false,
  banner: BANNER_SG,
  // `ergebnis.dokument` ist nach AssembleErgebnis stets gesetzt — die frühere
  // Weiche `(ergebnis.dokument ? a.klaeger[0] : null)` wählte immer die erste
  // klagende Partei; der Name bleibt damit byte-gleich.
  dateiBasis: (a) => `Schlichtungsgesuch_${a.klaeger[0]?.typ === 'juristisch' ? (a.klaeger[0] as { firma: string }).firma : `${(a.klaeger[0] as { name?: string })?.name ?? 'Partei'}`}_${a.datum || 'Entwurf'}`.replace(/[^\w.-]+/g, '_'),
  pdfLabel: 'Gesuch als PDF',
  docxLabel: 'Gesuch als Word (DOCX)',
};

export function VorlageSchlichtungsgesuchBs() {
  return <VorlagenSeite config={CONFIG} />;
}
