import { useEffect, useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { createPortal } from 'react-dom';
import type { Register } from '../layout/bereiche';
import { RubrikKachel } from '../ui/RubrikKachel';
import { SchliessKnopf } from '../ui/SchliessKnopf';
import { AUFKLAPPBAR, blattKrumen, gleicherOrt, type BlattOrt, type BlattRubrik } from '../../lib/startBlatt';
import { useBlattOrt } from './useBlattOrt';
import { GesetzeBlatt } from './GesetzeBlatt';
import { WerkzeugeBlatt } from './WerkzeugeBlatt';
import { MaterialienBlatt } from './MaterialienBlatt';
import { RechtsprechungBlatt } from './RechtsprechungBlatt';

// ─── Startseite · das 2×2-Kachelfeld, das vor Ort aufklappt (W2·29-WERKBANK-START S1)
//
// David 23.9.2026 am Prototyp: «kacheln sollen nebeneinander also jeweils 2 oben
// 2 unten sein» · «es soll nur die fläche einnehmen die für die vier kacheln zur
// verfügung stehen» · «es soll wirklich schön animiert sein und sich natürlich
// anfühlen und nicht ruckeln» · Handy: Vollbild-Blatt.
//
// DIE BEWEGUNG (Container-Transform, nur Compositor-Eigenschaften):
//   · Das Blatt liegt in voller Feldgrösse über den Kacheln und wird per
//     `clip-path: inset(… round 14px)` von der Kontur der angeklickten Kachel
//     auf das ganze Feld aufgedeckt. Keine Grössen-/Positions-Animation: die
//     erste Prototyp-Fassung animierte top/left/width/height — Layout je Bild und
//     Text-Umbruch mitten in der Bewegung, darum verworfen.
//   · Eine Farbschicht in der Registerfläche trägt das Kachel-Gesicht (Titel,
//     Zahl, Einheit) an Ort und Stelle und blendet nach rund 30 % der Dauer auf
//     den Inhalt über — das Auge sieht die Kachel wachsen, nicht ein Blatt
//     erscheinen.
//   · Kurve `cubic-bezier(.2,0,0,1)`, auf 450 ms, zu 350 ms (CSS, `.lc-start-*`).
//   · `prefers-reduced-motion` ⇒ sofort (JS überspringt die Startphase, CSS
//     schaltet die Übergänge ab).
//   · Telefon (< 760 px Fensterbreite): Vollbild-Blatt, das von unten einfährt
//     (gleiche Kurve). Gemessen am Fenster, nicht am Pane: im geteilten Fenster
//     bleibt das Blatt im Feld.
//
// Die drei übrigen Kacheln treten während des Aufklappens zurück (Deckkraft,
// Massstab), damit die Bewegung einen Ursprung hat.
//
// A11y: die Kachel ist ein Knopf mit `aria-expanded`/`aria-controls`; das
// offene Blatt ist eine `region` und bekommt den Fokus; Escape und ✕ schliessen
// ganz, der Fokus kehrt auf die Kachel zurück (§8).

export interface KachelDef {
  rubrik: BlattRubrik;
  reg: Register;
  /** Rubrikseite — Link-Ziel, solange die Kachel noch nicht aufklappt (S1). */
  ziel: string;
  titel: string;
  zahl: string;
  einheit: string;
  nutzen: string;
  teile?: string;
}

const BLATT_ID = 'lm-start-blatt';
/** Fläche und Strich je Register — volle Klassennamen, damit Tailwind sie findet. */
const FLAECHE: Record<Register, string> = {
  g: 'bg-reg-g-flaeche border-reg-g', r: 'bg-reg-r-flaeche border-reg-r',
  m: 'bg-reg-m-flaeche border-reg-m', w: 'bg-reg-w-flaeche border-reg-w',
};
const STRICH: Record<Register, string> = { g: 'border-reg-g', r: 'border-reg-r', m: 'border-reg-m', w: 'border-reg-w' };
/** Rubriken ohne Unterstufen — die Suche IST die Stufe (Spec «Fokus drin»,
 *  S3-Nachzug 24.9.2026: Rechtsprechung teilt die Ausnahme mit Materialien). */
const FOKUS_SUCHFELD_RUBRIKEN: ReadonlySet<BlattRubrik> = new Set<BlattRubrik>(['materialien', 'rechtsprechung']);
/** Schliess-Dauer — muss mit der CSS-Transition `[data-phase=schliesst]` übereinstimmen (Öffnen: 450 ms, nur CSS). */
const DAUER_ZU = 350;
const SCHMAL = '(max-width: 759.98px)';

type Phase = 'zu' | 'start' | 'offen' | 'schliesst';
/** Kachel-Kontur relativ zum Feld, in px. */
interface Kontur { oben: number; rechts: number; unten: number; links: number; breite: number; hoehe: number }

const medien = (q: string) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;

/** Zwei Bilder warten, damit der Startzustand gemalt ist, bevor die Transition
 *  greift — mit Zeitgeber als Netz, weil ein verdecktes Fenster keine
 *  Animationsbilder liefert (dort soll das Blatt trotzdem aufgehen). */
function naechstesBild(f: () => void): () => void {
  let fertig = false;
  const los = () => { if (!fertig) { fertig = true; f(); } };
  const a = requestAnimationFrame(() => requestAnimationFrame(los));
  const t = window.setTimeout(los, 60);
  return () => { fertig = true; cancelAnimationFrame(a); window.clearTimeout(t); };
}

export function StartKachelFeld({ kacheln }: { kacheln: readonly KachelDef[] }) {
  const { ort, hydriert, gehe, hoch, zurueck, schliessen } = useBlattOrt();
  const feldRef = useRef<HTMLDivElement>(null);
  const zellen = useRef(new Map<BlattRubrik, HTMLDivElement>());
  const blattRef = useRef<HTMLElement>(null);

  const [phase, setPhase] = useState<Phase>('zu');
  const [sicht, setSicht] = useState<BlattOrt | null>(null);
  const [kontur, setKontur] = useState<Kontur | null>(null);
  const [richtung, setRichtung] = useState<'vor' | 'zurueck'>('vor');
  const [schmal, setSchmal] = useState(false);
  const vorher = useRef<BlattOrt | null>(null);
  const erster = useRef(true);
  // Der laufende Übergang (Öffnen-Bild oder Schliessen-Zeitgeber). NICHT als
  // Effekt-Aufräumen: jeder Stufenwechsel liesse React das Aufräumen der
  // vorigen Runde fahren und bräche das Öffnen ab — die Phase bliebe auf
  // 'start' stehen (Gegenprüfung S1 23.9.2026). Abgebrochen wird nur, wenn
  // ein NEUER Übergang beginnt, und beim Abbau.
  const uebergang = useRef<(() => void) | null>(null);
  const fokusZurueck = useRef<BlattRubrik | null>(null);
  const beginne = (abbruch: (() => void) | null) => { uebergang.current?.(); uebergang.current = abbruch; };
  useEffect(() => () => uebergang.current?.(), []);

  useEffect(() => {
    const mq = window.matchMedia?.(SCHMAL);
    if (!mq) return;
    const neu = () => setSchmal(mq.matches);
    neu();
    mq.addEventListener('change', neu);
    return () => mq.removeEventListener('change', neu);
  }, []);

  const miss = (r: BlattRubrik): Kontur | null => {
    const feld = feldRef.current, zelle = zellen.current.get(r);
    if (!feld || !zelle) return null;
    const f = feld.getBoundingClientRect(), z = zelle.getBoundingClientRect();
    const oben = z.top - f.top, links = z.left - f.left;
    return {
      oben, links, breite: z.width, hoehe: z.height,
      rechts: Math.max(0, f.width - links - z.width), unten: Math.max(0, f.height - oben - z.height),
    };
  };

  // Ort → Phase. Layout-Effekt: die Startkontur muss VOR dem ersten Bild stehen.
  useLayoutEffect(() => {
    if (!hydriert) return;
    const alt = vorher.current;
    if (!erster.current && gleicherOrt(alt, ort)) return;
    vorher.current = ort;
    const tiefLink = erster.current;
    erster.current = false;
    const ruhig = medien('(prefers-reduced-motion: reduce)');

    if (ort && !alt) {
      setSicht(ort);
      setRichtung('vor');
      if (tiefLink || ruhig) { beginne(null); setKontur(null); setPhase('offen'); return; }
      setKontur(medien(SCHMAL) ? null : miss(ort.rubrik));
      setPhase('start');
      beginne(naechstesBild(() => setPhase('offen')));
      return;
    }
    if (!ort && alt) {
      const r = alt.rubrik;
      const fertig = () => {
        fokusZurueck.current = r;
        setPhase('zu'); setSicht(null); setKontur(null);
      };
      if (ruhig) { beginne(null); fertig(); return; }
      setKontur(medien(SCHMAL) ? null : miss(r));
      setPhase('schliesst');
      const t = window.setTimeout(fertig, DAUER_ZU + 30);
      beginne(() => window.clearTimeout(t));
      return;
    }
    if (ort && alt) {
      setRichtung(ort.rubrik === alt.rubrik && ort.pfad.length < alt.pfad.length ? 'zurueck' : 'vor');
      setSicht(ort);
    }
  }, [ort, hydriert]);

  // Telefon: das Vollbild-Blatt hängt am `body` (Portal) und verdeckt die App.
  // Solange es steht, ist die App dahinter `inert` — Tab und Screenreader
  // bleiben im Blatt (Gegenprüfung S1 23.9.2026), die Seite scrollt nicht mit.
  const vollbild = schmal && phase !== 'zu';
  useEffect(() => {
    if (!vollbild) return;
    const app = document.getElementById('root');
    const vorherUeberlauf = document.body.style.overflow;
    app?.setAttribute('inert', '');
    document.body.style.overflow = 'hidden';
    return () => { app?.removeAttribute('inert'); document.body.style.overflow = vorherUeberlauf; };
  }, [vollbild]);

  // Fokus zurück auf die Kachel — NACH dem Schliessen, wenn das `inert` der App
  // (Telefon) schon aufgehoben ist; vorher liefe `focus()` ins Leere.
  useEffect(() => {
    if (phase !== 'zu' || !fokusZurueck.current) return;
    zellen.current.get(fokusZurueck.current)?.querySelector<HTMLElement>('button, a')?.focus({ preventScroll: true });
    fokusZurueck.current = null;
  }, [phase]);

  // Fokus ins Blatt, sobald es offen steht, und bei jeder Stufe neu (§8).
  // Ausnahme S3 (Spec «Fokus drin»): Rubriken ohne Unterstufen — die Suche IST
  // die Stufe — bekommen den Fokus direkt im Suchfeld, nicht auf dem Rahmen.
  // S3-Nachzug (24.9.2026): Rechtsprechung teilt dieselbe Ausnahme wie
  // Materialien (beide reine Sofort-Suche-Kacheln, `FOKUS_SUCHFELD_RUBRIKEN`).
  useEffect(() => {
    if (phase !== 'offen') return;
    if (sicht && FOKUS_SUCHFELD_RUBRIKEN.has(sicht.rubrik)) {
      blattRef.current?.querySelector<HTMLInputElement>('input[type="search"]')?.focus({ preventScroll: true });
      return;
    }
    blattRef.current?.focus({ preventScroll: true });
  }, [phase, sicht]);

  const offen = phase !== 'zu';
  const kachel = sicht ? kacheln.find((k) => k.rubrik === sicht.rubrik) : undefined;
  const bewegt = phase === 'start' || phase === 'schliesst';
  const clip = bewegt && kontur
    ? `inset(${kontur.oben}px ${kontur.rechts}px ${kontur.unten}px ${kontur.links}px round 14px)`
    : 'inset(0px round 14px)';

  return (
    <div ref={feldRef} className="lc-start-feld" data-offen={offen ? '' : undefined}>
      <nav aria-label="Bereiche der Sammlung" className="lc-start-raster">
        {kacheln.map((k) => {
          const klappt = AUFKLAPPBAR.has(k.rubrik);
          const diese = offen && sicht?.rubrik === k.rubrik;
          return (
            <div key={k.rubrik} className="lc-start-zelle"
              ref={(el) => { if (el) zellen.current.set(k.rubrik, el); else zellen.current.delete(k.rubrik); }}
              data-zurueck={offen && !diese ? '' : undefined}>
              <RubrikKachel reg={k.reg} titel={<span className="break-words">{k.titel}</span>}
                zahl={k.zahl} einheit={k.einheit} nutzen={k.nutzen} kompakt={schmal}
                extra={k.teile && <span className="num text-body-s leading-snug text-ink-700">{k.teile}</span>}
                {...(klappt
                  ? { onWahl: () => gehe({ rubrik: k.rubrik, pfad: [] }), aufgeklappt: diese, steuert: BLATT_ID }
                  : { ziel: k.ziel })} />
            </div>
          );
        })}
      </nav>

      {offen && sicht && kachel && inEbene(schmal, (
        <section ref={blattRef} id={BLATT_ID} tabIndex={-1} role="region" aria-label={kachel.titel}
          className="lc-start-blatt" data-phase={phase} data-schmal={schmal ? '' : undefined}
          style={schmal ? undefined : { clipPath: clip, WebkitClipPath: clip }}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); schliessen(); } }}>
          <BlattKopf reg={kachel.reg} titel={kachel.titel} ort={sicht} hoch={hoch}
            zurueck={zurueck} schliessen={schliessen} />
          <div className="lc-start-blatt-inhalt" data-sichtbar={phase === 'offen' ? '' : undefined}>
            <div key={[sicht.rubrik, ...sicht.pfad].join('/')} className="lc-start-stufe" data-richtung={richtung}>
              {sicht.rubrik === 'gesetze' && <GesetzeBlatt ort={sicht} gehe={gehe} />}
              {sicht.rubrik === 'werkzeuge' && <WerkzeugeBlatt ort={sicht} gehe={gehe} />}
              {sicht.rubrik === 'materialien' && <MaterialienBlatt />}
              {sicht.rubrik === 'rechtsprechung' && <RechtsprechungBlatt />}
            </div>
          </div>
          {!schmal && kontur && (
            <div aria-hidden className={`lc-start-schicht ${FLAECHE[kachel.reg]}`} data-an={bewegt ? '' : undefined}>
              <div className={`lc-start-gesicht ${STRICH[kachel.reg]}`}
                style={{ top: kontur.oben, left: kontur.links, width: kontur.breite, height: kontur.hoehe }}>
                <span className="font-sans text-h3 font-semibold tracking-tight text-ink-900">{kachel.titel}</span>
                <span className="flex flex-wrap items-baseline gap-2">
                  <span className="num font-serif text-h1 leading-none text-ink-900">{kachel.zahl}</span>
                  <span className="text-body-s text-ink-700">{kachel.einheit}</span>
                </span>
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

/** Telefon: das Vollbild-Blatt hängt am `body` — im Feld läge es in dessen
 *  Stapelkontext (`isolation`) und würde von den folgenden Abschnitten der
 *  Seite überdeckt (gemessen 23.9.2026 @390: Rechteck 0/0/390/844, aber
 *  unsichtbar). Breit bleibt es im Feld, dort IST das Feld die Bühne. */
function inEbene(schmal: boolean, knoten: ReactElement) {
  return schmal && typeof document !== 'undefined' ? createPortal(knoten, document.body) : knoten;
}

/** Band oben im Blatt: Registerfläche + Strich, Pfad, «← Zurück», ✕. */
function BlattKopf({ reg, titel, ort, hoch, zurueck, schliessen }: {
  reg: Register; titel: string; ort: BlattOrt;
  hoch: (o: BlattOrt) => void; zurueck: () => void; schliessen: () => void;
}) {
  const krumen: { label: string; ort: BlattOrt }[] = [
    { label: titel, ort: { rubrik: ort.rubrik, pfad: [] } },
    ...blattKrumen(ort),
  ];
  return (
    <div className={`lc-start-band ${FLAECHE[reg]}`}>
      <button type="button" onClick={zurueck} className="lc-btn-ghost lc-btn-sm shrink-0 px-2">← Zurück</button>
      <nav aria-label="Pfad im Blatt" className="min-w-0 flex-1">
        <ol className="flex flex-wrap items-baseline gap-x-1.5 font-sans text-body-s text-ink-700">
          {krumen.map((k, i) => {
            const letzte = i === krumen.length - 1;
            return (
              <li key={i} className="flex items-baseline gap-x-1.5">
                {i > 0 && <span aria-hidden className="text-ink-500">›</span>}
                {letzte
                  ? <span aria-current="location" className="font-semibold text-ink-900">{k.label}</span>
                  : <button type="button" onClick={() => hoch(k.ort)} className="lc-btn-ghost lc-btn-sm h-auto px-1 font-normal underline underline-offset-4">{k.label}</button>}
              </li>
            );
          })}
        </ol>
      </nav>
      <SchliessKnopf name={`${titel} schliessen`} onClick={schliessen} />
    </div>
  );
}

