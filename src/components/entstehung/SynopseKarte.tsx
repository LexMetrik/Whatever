import { datumCh } from '../../lib/normtext/erlassKopfText';
import { LEERSTELLE_ERLAEUTERUNG, type LeerstellenStatus } from '../../lib/normtext/darstellung';
import { AMTLICHE_FASSUNG_NOMEN } from '../../lib/benennung';
import { standVon, type SynopseShard } from '../../lib/entstehung/synopse';
import { entwurfUrl, type EntwurfArtikel, type EntwurfShard } from '../../lib/entstehung/synopse-entwurf';
import {
  hatUnterschied, nurTitelGeaendert, synopseZeilen,
  type DiffStueck, type QuellLueckeTreffer, type SynopseLage, type SynopseTreffer, type SynopseZeile,
} from '../../lib/entstehung/synopse-diff';

// ═══ DER FASSUNGSVERGLEICH AM ARTIKEL (W2·6c · E5/E6 im Leser) ══════════════
//
// FAHRPLAN-MATERIALIEN-VERZAHNUNG §11.5 (3): «Synopse vorher/nachher nur für
// Änderungen mit Konsolidierungs-HTML ab 2021, sonst Zeile ‹Fassungsvergleich
// erst für Stände ab 2021 verfügbar›». Die Daten liegen seit PR #794; hier ist
// die Sicht darauf.
//
// ── WAS DIESE KARTE ZEIGT ─────────────────────────────────────────────────────
// Zu EINEM Punkt der Fassungsleiste den WORTLAUT VORHER neben dem Wortlaut
// NACHHER, Absatz für Absatz, Buchstabe für Buchstabe, mit den geänderten
// Wörtern hervorgehoben. Das ist die Frage, die ein Praktiker am Artikel
// wirklich stellt — «was stand da vorher?» — und die bis heute nur beantworten
// konnte, wer zwei Fedlex-Fassungen nebeneinanderlegte.
//
// ── SIE LÄDT ERST AUF KLICK (Auflage David 6.9.2026) ──────────────────────────
// Die Komponente existiert erst, wenn der Griff «Alt/Neu» gedrückt wurde; der
// Shard (ø 37 KB, OR 0,5 MB) kommt dann EINMAL je Erlass. Im Lesefluss und im
// bloss aufgeklappten Fassungs-Block kostet sie null Byte (Sonde
// `e2e/entstehung-synopse-leser` (a)).
//
// ── SIE BEHAUPTET NICHTS (§7/§8) ──────────────────────────────────────────────
// Gespeicherter Gesetzestext ist nur mit allen vier Merkmalen zulässig (§7):
// Stand BEIDER Fassungen, amtliche Quelle (die ausgewertete Manifestation),
// Live-Link auf die geltende Fassung dieses Stands, Abrufdatum — dazu die
// Profil-ID der Normalisierung, unter der die Prüfsummen gebildet wurden. Der
// ganze Apparat steht im Fuss JEDER Karte, weil jede Karte einen Wortlaut
// zitiert. Und wo nichts vorliegt, sagt die Karte, was fehlt, statt zu schweigen.

/** Ein Stück Wortlaut in seiner Rolle: gestrichen, neu, unverändert. */
function Stuecke({ stuecke }: { stuecke: readonly DiffStueck[] }) {
  return (
    <>
      {stuecke.map((s, i) => (
        s.marke === 'weg' ? <del key={i}>{s.text}</del>
          : s.marke === 'neu' ? <ins key={i}>{s.text}</ins>
            : <span key={i}>{s.text}</span>
      ))}
    </>
  );
}

/** Das amtliche Etikett einer Zeile («Abs. 1 lit. a») — nie zusammengesetzt, nur beschriftet. */
function marke(z: SynopseZeile): string {
  if (z.ganzerArtikel) return 'ganzer Artikel';
  const teile: string[] = [];
  if (z.absatz) teile.push(`Abs. ${z.absatz}`);
  if (z.num) teile.push(z.num.replace(/[.)]+$/, ''));
  return teile.join(' · ');
}

const ZEILEN_WORT: Record<SynopseZeile['art'], string> = {
  gleich: 'unverändert',
  geaendert: 'geändert',
  entfernt: 'aufgehoben',
  eingefuegt: 'eingefügt',
};

/**
 * Die Gegenüberstellung selbst.
 *
 * Zwei Spalten ab Tablet, untereinander bei 320 px (`src/index.css`). Die
 * Seiten-Etiketten «Alt»/«Neu» stehen in JEDER Zelle und nicht nur in einer
 * Kopfzeile: gestapelt wäre eine Kopfzeile drei Bildschirmhöhen entfernt, und
 * bei einem Gesetzestext darf keine Sekunde Zweifel bestehen, welche Spalte
 * gilt (§8).
 */
function Gegenueberstellung({ zeilen, altWort, neuWort }: {
  zeilen: readonly SynopseZeile[];
  altWort: string;
  neuWort: string;
}) {
  return (
    <ol className="lr8-syn-zeilen" data-synopse-zeilen>
      {zeilen.map((z, i) => (
        <li key={i} className="lr8-syn-zeile" data-synopse-zeile={z.art}>
          <p className="lr8-syn-marke">
            {marke(z)}
            {marke(z) && ' · '}
            <span className="text-ink-400">{ZEILEN_WORT[z.art]}</span>
          </p>
          {z.art === 'gleich' ? (
            // Unverändertes steht EINMAL über beide Spalten. Weglassen wäre
            // falsch — der Absatz gehört zum Artikel und der Leser braucht den
            // Zusammenhang —, aber ihn zweimal wortgleich nebeneinanderzustellen
            // verdoppelte nur die Höhe der Karte, ohne eine Frage zu beantworten.
            <div className="lr8-syn-spalte lr8-syn-beide">
              <p className="lr8-syn-text">{(z.neu ?? z.alt ?? []).map((s) => s.text).join('')}</p>
            </div>
          ) : (
            <>
              <div className="lr8-syn-spalte">
                <span className="lr8-syn-seite">{altWort}</span>
                {z.alt ? <p className="lr8-syn-text"><Stuecke stuecke={z.alt} /></p>
                  : <p className="lr8-syn-leer">— in dieser Fassung nicht vorhanden</p>}
              </div>
              <div className="lr8-syn-spalte">
                <span className="lr8-syn-seite">{neuWort}</span>
                {z.neu ? <p className="lr8-syn-text"><Stuecke stuecke={z.neu} /></p>
                  : <p className="lr8-syn-leer">— aufgehoben</p>}
              </div>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}

/** Ein Zitat-Nachweis (§7 a–d) für EINE der beiden Fassungen. */
function Nachweis({ wort, stand, liveUrl, quelleUrl, abgerufen }: {
  wort: string; stand: string; liveUrl?: string; quelleUrl?: string; abgerufen?: string;
}) {
  return (
    <li>
      <span className="lr8-syn-feld">{wort}</span>{' '}
      <span className="num">{datumCh(stand)}</span>
      {liveUrl && <> · <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brass-700">amtliche Fassung&nbsp;↗</a></>}
      {quelleUrl && <> · <a href={quelleUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brass-700">ausgewertete Quelle&nbsp;↗</a></>}
      {abgerufen && <> · Abruf <span className="num">{datumCh(abgerufen)}</span></>}
    </li>
  );
}

/** Provenienz des geltenden Wortlauts (aus dem Korpus-Snapshot, nicht aus dem Shard). */
export interface GeltendQuelle { stand?: string; quelleUrl?: string; abgerufen?: string }

/** Der Entwurfs-Fund zu diesem Artikel (E6) — `null` = keiner. */
export interface EntwurfFund { shard: EntwurfShard; artikel: EntwurfArtikel }

export function SynopseKarte({ lage, shard, geltend, entwurf, zustand, id }: {
  lage: SynopseLage;
  shard: SynopseShard | null | undefined;
  geltend: GeltendQuelle;
  entwurf?: EntwurfFund | null;
  /** Belegstufe des geltenden Artikels (W2·27, §5 — dieselbe Quelle wie der
   *  Leser). 'leer-ungeklaert' darf NICHT «aufgehoben» sagen: der Korpus weiss
   *  nur, dass kein Wortlaut da ist, nicht warum (§8). */
  zustand?: LeerstellenStatus;
  id: string;
}) {
  return (
    <div className="lr8-syn" data-synopse-karte id={id}>
      {lage.art === 'vergleich'
        ? <Vergleich treffer={lage.treffer} shard={shard!} geltend={geltend} entwurf={entwurf} zustand={zustand} />
        : lage.art === 'quelle_unvollstaendig'
          ? <QuellLuecke treffer={lage.treffer} />
          : <p className="lr8-syn-lage" data-synopse-lage={lage.art}>{lageSatz(lage)}</p>}
    </div>
  );
}

/**
 * Was die Karte sagt, wenn es keine Gegenüberstellung gibt.
 *
 * Jeder Satz benennt UNSEREN Bestand, nie die Rechtswirklichkeit (§8) — «nicht
 * erfasst» heisst nie «gibt es nicht». Leer bleibt die Karte in keinem Fall.
 */
function lageSatz(lage: SynopseLage): string {
  switch (lage.art) {
    case 'vor_fenster':
      // R2 §1: maschinenlesbaren Volltext alter Stände gibt es erst ab 2021;
      // davor liegt bei Fedlex nur `doc`/`pdf-a`.
      return `Fassungsvergleich erst für Stände ab ${datumCh(lage.ab)} — für ältere Fassungen hält die amtliche Sammlung keinen maschinenlesbaren Wortlaut bereit.`;
    case 'ohne_datum':
      return 'Dieser Eintrag trägt kein Datum im amtlichen Fussnoten-Apparat — ohne Stand gibt es keine zwei Fassungen zu vergleichen.';
    case 'ohne_unterschied':
      return lage.konflikt
        ? `Die amtliche Fussnote nennt eine Änderung auf den ${datumCh(lage.stand)}; im Wortlaut der Konsolidierung dieses Stands ist an diesem Artikel keine Änderung zu sehen. Der Widerspruch wird hier gezeigt, nicht aufgelöst.`
        : `Zum Stand ${datumCh(lage.stand)} ist an diesem Artikel kein Wortlaut-Unterschied erfasst.`;
    case 'kein_stand':
      // Regelfall: künftige Stände (korpusweit 57 belegt) — sie werden bewusst
      // nicht verglichen, weil ihr «Alt» der geltende Text ist (§5).
      return `Zum ${datumCh(lage.stand)} ist keine Konsolidierung ausgewertet — bei künftigen Ständen ist die «alte» Fassung die heute geltende.`;
    case 'kein_shard':
    default:
      return 'Für diesen Erlass ist kein Fassungsvergleich erfasst.';
  }
}

/**
 * DIE LÜCKE DER QUELLE — der ehrliche Ersatz für ein falsches «entfallen».
 *
 * Eine amtliche Konsolidierung kann einen Artikel verlieren, ohne dass ihn jemand
 * aufgehoben hätte: bei CHEMRRV (`cc/2005/478`) stehen die Artikel 4–24 in den Ständen
 * vom 1.5.2022 und 1.10.2022 nicht als `<article>`, sondern als Änderungs-Anhang
 * (`<mod>`/`<quotedStructure>`) derselben Datei — ab dem 6.10.2022 wieder normal, Wort
 * für Wort gleich. Der paarweise Diff sah darin 22 Aufhebungen und 22 Neueinfügungen;
 * beides hat es nie gegeben (Gegenprüfungs-Befund A6 zu PR #798).
 *
 * WAS HIER STEHT, IST ALSO EINE AUSSAGE ÜBER DAS ARTEFAKT, NICHT ÜBER DAS RECHT (§8) —
 * und darum steht der Live-Link auf die amtliche Fassung jedes betroffenen Stands
 * daneben: massgeblich ist sie, nie unsere Auswertung (§7c).
 *
 * KEIN WORTLAUT: über die Lücke hinweg ist er derselbe — das ist die Erkennungsregel
 * selbst. Zwei identische Spalten wären keine Synopse, sondern eine erfundene Änderung.
 */
function QuellLuecke({ treffer }: { treffer: QuellLueckeTreffer }) {
  const { artikel, staende, belege } = treffer;
  const daten = staende.map(datumCh);
  const standWort = daten.length === 1
    ? `der amtliche Stand vom ${daten[0]}`
    : `die amtlichen Stände vom ${daten.slice(0, -1).join(', ')} und ${daten[daten.length - 1]}`;
  const fuehrt = daten.length === 1 ? 'führt' : 'führen';
  return (
    <div data-synopse-lage="quelle_unvollstaendig">
      <p className="lr8-syn-kopf">
        <span className="lc-overline"><span className="lc-punkt" aria-hidden />Quelle unvollständig</span>{' '}
        <span className="text-ink-500">
          {artikel.label}
          {artikel.ueberschrift && <> · {artikel.ueberschrift}</>}
        </span>
      </p>
      <p className="lr8-syn-hinweis" data-synopse-quellluecke>
        <span className="lc-chip lr8-syn-warn">Quelle unvollständig</span>{' '}
        {/* «nur in einem Änderungsanhang» ist keine Vermutung, sondern Bedingung der
            Buchung: ohne diesen Beleg wird gar keine Quelllücke gebucht (Auflage
            Gegenprüfung PR #801, `findeQuellLuecken` (4), Tor-Ast in
            `check:entstehung`). Darum steht hier ein Satz und keine Fallunterscheidung. */}
        Quelle unvollständig: {standWort} {fuehrt} diesen Artikel nur in einem
        Änderungsanhang; massgeblich bleibt {AMTLICHE_FASSUNG_NOMEN}.
        {artikel.zurueckAb && <>
          {' '}Ab dem <span className="num">{datumCh(artikel.zurueckAb)}</span> steht er dort
          wieder — mit demselben Wortlaut wie davor. Aufgehoben war er nie; hier fehlt das
          Artefakt, nicht die Bestimmung.
        </>}
      </p>
      <ul className="lr8-syn-fuss" data-synopse-fuss>
        {belege.map((b) => (
          <Nachweis key={b.datum} wort="Betroffener Stand" stand={b.datum} liveUrl={b.liveUrl}
            quelleUrl={b.xmlUrl} abgerufen={b.abgerufen} />
        ))}
        <li className="text-ink-400">
          Erkannt über die ganze Stände-Kette: dieselbe eId fehlt in diesem einen Abschnitt
          und kehrt Zeichen für Zeichen unverändert zurück.
        </li>
      </ul>
    </div>
  );
}

function Vergleich({ treffer, shard, geltend, entwurf, zustand }: {
  treffer: SynopseTreffer;
  shard: SynopseShard;
  geltend: GeltendQuelle;
  entwurf?: EntwurfFund | null;
  zustand?: LeerstellenStatus;
}) {
  const { schritt, artikel, neu, neuHerkunft, mehrdeutig } = treffer;
  const altStand = standVon(shard, schritt.von);
  const neuStand = standVon(shard, schritt.bis);
  const zeilen = synopseZeilen(artikel.alt, neu ?? []);
  const altWort = `Alt · bis ${datumCh(schritt.bis)}`;
  const neuWort = neuHerkunft === 'geltend' ? 'Neu · geltend' : `Neu · ab ${datumCh(schritt.bis)}`;
  return (
    <>
      <p className="lr8-syn-kopf">
        <span className="lc-overline"><span className="lc-punkt" aria-hidden />Fassungsvergleich</span>{' '}
        <span className="text-ink-500">
          {artikel.label}
          {artikel.ueberschrift && <> · {artikel.ueberschrift}</>}
          {artikel.ueberschriftNeu && <> → {artikel.ueberschriftNeu}</>}
          {' · '}Stand <span className="num">{datumCh(schritt.von)}</span> gegenüber{' '}
          <span className="num">{datumCh(schritt.bis)}</span>
        </span>
      </p>
      {neu === null && (
        <p className="lr8-syn-hinweis">Der Artikel ist mit diesem Stand entfallen; rechts steht darum nichts.</p>
      )}
      {zustand === 'aufgehoben' && neuHerkunft === 'geltend' && (
        <p className="lr8-syn-hinweis">Der Artikel ist heute aufgehoben — die rechte Spalte zeigt den Korpus-Stand dieser Aufhebung.</p>
      )}
      {/* W2·27 (15.9.2026): ohne amtlichen Vermerk sagt die Karte, WAS sie weiss
          — dass kein Wortlaut da ist —, und nicht, was sie vermutet (§8). */}
      {zustand === 'leer-ungeklaert' && neuHerkunft === 'geltend' && (
        <p className="lr8-syn-hinweis">{LEERSTELLE_ERLAEUTERUNG} Die rechte Spalte zeigt den Korpus-Stand.</p>
      )}
      {artikel.zustand === 'ohne_ereignis' && (
        <p className="lr8-syn-hinweis" data-synopse-ohne-ereignis>
          <span className="lc-chip lr8-syn-warn">ohne Fussnoten-Ereignis</span>{' '}
          Dieser Wortlaut-Unterschied steht in den amtlichen Konsolidierungen, aber der amtliche
          Fussnoten-Apparat führt dazu kein Änderungs-Ereignis. Gezeigt wird beides, aufgelöst nichts.
        </p>
      )}
      {mehrdeutig && (
        <p className="lr8-syn-hinweis">
          Auf diesen Stand wirkten mehrere Änderungserlasse — der Unterschied gehört dem Stand,
          nicht sicher einem einzelnen Erlass.
        </p>
      )}
      {hatUnterschied(zeilen) && <Gegenueberstellung zeilen={zeilen} altWort={altWort} neuWort={neuWort} />}
      {!hatUnterschied(zeilen) && (nurTitelGeaendert(artikel, zeilen)
        ? <p className="lr8-syn-lage" data-synopse-lage="nur-titel">
            Am Wortlaut dieses Artikels ist zwischen den beiden Ständen kein Unterschied erkennbar —
            geändert wurde nur die amtliche Sachüberschrift: {artikel.ueberschrift
              ? <>«{artikel.ueberschrift}» wurde zu «{artikel.ueberschriftNeu}»</>
              : <>der Artikel trägt neu die Sachüberschrift «{artikel.ueberschriftNeu}»</>}.
          </p>
        : <p className="lr8-syn-lage" data-synopse-lage="gleich">
            Zwischen den beiden Ständen ist am Wortlaut dieses Artikels kein Unterschied erkennbar.
          </p>)}
      {entwurf && <EntwurfBlock fund={entwurf} />}
      <ul className="lr8-syn-fuss" data-synopse-fuss>
        <Nachweis wort="Alt" stand={schritt.von} liveUrl={altStand?.liveUrl}
          quelleUrl={altStand?.xmlUrl} abgerufen={altStand?.abgerufen} />
        {neuHerkunft === 'geltend'
          ? <Nachweis wort="Neu (geltend)" stand={geltend.stand ?? schritt.bis}
              liveUrl={geltend.quelleUrl} abgerufen={geltend.abgerufen} />
          : <Nachweis wort="Neu" stand={schritt.bis} liveUrl={neuStand?.liveUrl}
              quelleUrl={neuStand?.xmlUrl} abgerufen={neuStand?.abgerufen} />}
        <li>
          <span className="lr8-syn-feld">Normalisierung</span>{' '}
          <span className="num">{shard.normProfil}</span>
          <span className="text-ink-400"> · Prüfsumme des Alt-Blocks <span className="num">{artikel.shaNorm.slice(0, 12)}…</span></span>
        </li>
        <li className="text-ink-400">
          Wortlaut amtlich zitiert · massgeblich bleibt {AMTLICHE_FASSUNG_NOMEN}.
        </li>
      </ul>
    </>
  );
}

/**
 * «Stand das im Entwurf auch schon so?» (E6).
 *
 * GEZEIGT WIRD DER ENTWURFS-WORTLAUT, NICHT EIN DIFF — und zwar nach einem
 * Fehlversuch, den die Sichtprüfung am 11.9.2026 aufgedeckt hat: ein Wort-Diff
 * gegen die konsolidierte Fassung markierte bei DBG 5 die Buchstaben b–e und
 * Absatz 2 als «eingefügt». Sie sind nichts dergleichen — der Entwurf im
 * Bundesblatt druckt nur die GEÄNDERTEN Teile eines Artikels ab, der Korpus
 * führt den ganzen. Die beiden Texte haben also verschiedene Reichweiten, und
 * ein Diff über verschieden weite Texte behauptet Änderungen, die es nicht gibt
 * (§1). Die Reichweite maschinell zu bestimmen hiesse, das Etikett «Art. 5
 * Abs. 1 Bst. a, abis und f» zu parsen — genau die offene Grammatik, die
 * `lib/entstehung/synopse-entwurf.ts` aus §2-Gründen ablehnt.
 *
 * Also steht hier, was belegt ist: der Wortlaut des Entwurfs, die Einordnung des
 * Label-Joins (`art`), beide Dokumente als Live-Link. Der beschlossene Wortlaut
 * steht eine Handbreit darüber, in der Spalte «Neu» derselben Karte — der Leser
 * vergleicht zwei Absätze weit auseinander, statt einer falschen Markierung zu
 * glauben.
 */
function EntwurfBlock({ fund }: { fund: EntwurfFund }) {
  const { shard, artikel } = fund;
  return (
    <div className="lr8-syn-entwurf" data-synopse-entwurf>
      <p className="lr8-syn-kopf">
        <span className="lc-overline"><span className="lc-punkt" aria-hidden />Entwurf des Bundesrats</span>{' '}
        <span className="text-ink-500">{artikel.label}</span>
      </p>
      <p className="lr8-syn-hinweis">
        {artikel.art === 'nur_entwurf'
          // §8 · «nur im Entwurf» heisst NICHT «gestrichen»: der Join läuft über
          // das vollständige Etikett, und das Parlament ändert oft nur den
          // Sachtitel (bei DBG 5 den Zusatz «Betrifft nur den französischen
          // Text»). Beides steht da, entschieden wird nichts.
          ? 'Unter diesem Etikett führt der Schlussabstimmungstext keinen Eintrag — der Artikel wurde im Parlament gestrichen oder anders betitelt.'
          : 'Unter demselben Etikett weicht der Schlussabstimmungstext vom Entwurf ab.'}
        {' '}Der Entwurf druckt nur die geänderten Teile des Artikels ab; was daraus wurde, steht oben in der Spalte «Neu».
      </p>
      <div className="lr8-syn-spalte">
        <span className="lr8-syn-seite">Wortlaut im Entwurf</span>
        <p className="lr8-syn-text">{artikel.entwurf}</p>
      </div>
      <ul className="lr8-syn-fuss">
        <li>
          <span className="lr8-syn-feld">Entwurf</span>{' '}
          {shard.entwurfDok.datum && <><span className="num">{datumCh(shard.entwurfDok.datum)}</span> · </>}
          <a href={entwurfUrl(shard, artikel)} target="_blank" rel="noopener noreferrer" className="hover:text-brass-700">
            <span className="num">{shard.entwurfDok.fga}</span>&nbsp;↗
          </a>
        </li>
        <li>
          <span className="lr8-syn-feld">Beschluss</span>{' '}
          {shard.beschlussDok.datum && <><span className="num">{datumCh(shard.beschlussDok.datum)}</span> · </>}
          <a href={shard.beschlussDok.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-brass-700">
            <span className="num">{shard.beschlussDok.fga}</span>&nbsp;↗
          </a>
          <span className="text-ink-400"> · Abruf <span className="num">{datumCh(shard.abgerufen)}</span></span>
        </li>
        <li className="text-ink-400">
          Zuordnung über das Artikel-Label, nie über die Dokument-id — ein id-Abgleich ordnete
          gemessen 7 von 41 Artikeln falsch zu.
        </li>
      </ul>
    </div>
  );
}
