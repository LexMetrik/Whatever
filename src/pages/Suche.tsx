import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useUniversalSuche } from '../components/suche/useUniversalSuche';
import { SuchResultate } from '../components/suche/SuchResultate';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { FacettenGruppe } from '../components/ui/FacettenGruppe';
import type { GruppenId } from '../lib/universalSuche';

// ─── /suche — Volltext-Ergebnisseite (UI-NAV S5) ────────────────────────────
//
// Macht die im Header-Dropdown UNERREICHBAREN Treffer zugänglich: das Dropdown
// ist Schnellzugriff (auf wenige je Gruppe gekappt), diese Seite zeigt ALLE
// Gruppen ungekappt (bes. die Gesetzestext-Gruppe, deren 34/40 Treffer bislang
// strukturell nicht erreichbar waren — §8). Additive Zielseite zum fixierten
// A5/A6-Dropdown-Modell (kein Palette-Revival): dieselbe Trefferlogik (Hook
// useUniversalSuche, §5), nur ohne Kappung und mit einem Inhaltstyp-Filter.
//
// Prerender: die SHELL (H1 + Intro + Feld) wird statisch ausgeliefert (seo.ts);
// die query-abhängigen Treffer füllt der Client (useUniversalSuche lädt lazy).
// Deep-Link `?q=` ist stabil und teilbar. CLS: der Kopf/das Feld stehen fest,
// die Treffer wachsen nur darunter (§15.2).

// Anzeige: alle Gruppen ungekappt zeigen, Artikel-Volltext grosszügig suchen.
const KAPPUNG_SEITE = 500;
const ARTIKEL_LIMIT = 200;

export function Suche() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [wert, setWert] = useState(initialQ);
  const [q, setQ] = useState(initialQ.trim());
  const [typ, setTyp] = useState<GruppenId | 'alle'>('alle');

  // Externe ?q=-Änderungen (Zurück-Taste, geteilter Link) ins Feld spiegeln —
  // Render-Phasen-Abgleich (kein setState-im-Effekt), Muster aus der Hero-Suche.
  const qParam = params.get('q') ?? '';
  const [letztesParam, setLetztesParam] = useState(qParam);
  if (qParam !== letztesParam) {
    setLetztesParam(qParam);
    if (qParam !== wert.trim()) setWert(qParam);
  }

  // Eingabe: Feldwert setzen UND ?q= sofort schreiben (teilbar; replace, damit
  // Tippen keine History füllt).
  const setze = (v: string) => {
    setWert(v);
    const t = v.trim();
    const p = new URLSearchParams(params);
    if (t) p.set('q', t); else p.delete('q');
    setParams(p, { replace: true });
  };

  // Debounce: Eingabe → Such-Query (~150 ms) für die Trefferberechnung.
  useEffect(() => {
    const id = setTimeout(() => setQ(wert.trim()), 150);
    return () => clearTimeout(id);
  }, [wert]);

  const { gruppen, allesGeladen, vorschlag, abdeckung } = useUniversalSuche(q, {
    artikelLimit: ARTIKEL_LIMIT,
    kappung: KAPPUNG_SEITE,
  });

  // Inhaltstyp-Facette (Etappe 2, ehrlich + lokal): Chips je vorhandener Gruppe
  // mit echtem Zähler (gesamt). Der Norm-/Entscheid-Sprung (A5/S2) bleibt IMMER
  // sichtbar (die direkte Antwort), unabhängig vom Filter. Masse-Counts über den
  // kantonalen Volltext / die 195k-Entscheide folgen erst mit dem E3-Serving (§8).
  const facetten = useMemo(
    () => gruppen.filter((g) => g.id !== 'sprung' && !g.laedt && g.gesamt > 0)
      .map((g) => ({ id: g.id, titel: g.titel, n: g.gesamt })),
    [gruppen],
  );
  // Wird der aktive Filter leer (neue Query), auf «alle» zurückfallen.
  const typVorhanden = typ === 'alle' || facetten.some((f) => f.id === typ);
  const aktiverTyp = typVorhanden ? typ : 'alle';
  const sichtbar = aktiverTyp === 'alle'
    ? gruppen
    : gruppen.filter((g) => g.id === 'sprung' || g.id === aktiverTyp);

  return (
    <div className="space-y-8">
      {/* ── G9/G17/G18 (Gesamtprüfung 6.9.2026) · EINE KOPF-ANATOMIE ────────
          Diese Seite trug als einzige Übersicht die Bauform der STATISCHEN
          Seiten: Overline + Ablesekante + H1 + drei Zeilen Lead. Gemessen
          @1440 stand die H1 dadurch auf y = 213 statt auf den 177, die
          `/gesetze` und `/rechtsprechung` zeigen — 36 px Versatz und zwei
          Bauformen für dieselbe Sache (G17). Die Overline sagte zudem
          wortgleich, was die H1 darunter sagt («Suche»/«Suche», G18), und der
          Lead erklärte eine Seite, die aus einem Suchfeld und ihren Treffern
          besteht (D11 «Übersichts-Köpfe ohne Erklärtext», G9).
          Was der Lead an FUNKTION trug, trägt der Platzhalter des Feldes
          darunter — er nennt beide Wege («Suchen oder Norm springen») mit
          Beispielen und steht dort, wo man ihn braucht (§8: nichts geht
          verloren, es steht nur nicht mehr im Kopf). */}
      <SeitenKopf titel="Suche" />

      <div role="search" className="space-y-4">
        <div className="relative max-w-reading">
          <input
            type="search"
            value={wert}
            onChange={(e) => setze(e.target.value)}
            placeholder="Suchen oder Norm springen (z. B. «OR 257d», «Miete», «BGE 152 I 65») …"
            aria-label="LexMetrik durchsuchen"
            className="lc-input h-12 w-full pr-11 text-body-l"
            enterKeyHint="search"
            autoComplete="off"
          />
          {wert && (
            <button type="button" onClick={() => setze('')} aria-label="Suche leeren"
              className="absolute right-0 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center text-ink-600 transition-colors hover:text-ink-900">
              <span aria-hidden className="lc-griff-glyph">✕</span>
            </button>
          )}
        </div>

        {/* Inhaltstyp-Facette — nur wenn es etwas zu filtern gibt.

            W2·19-DESIGN-KONSISTENZ · D-1 (Welle B1): dieselbe Facetten-Bedienung
            trug hier eine EIGENE Optik (Pillen `rounded-full border`, Sans,
            Farbnuance als einziges Auswahl-Signal), während /rechtsprechung
            dieselbe Sache mit der Chip-Familie `.lc-chip` zeigt. Diese Reihe ist
            auf den Kanon gezogen — die lokale `FacetChip`-Kopie ist gelöscht,
            nicht angeglichen (§5/§10). Damit erbt sie zwei Dinge, die die Kopie
            nicht hatte: das ✓-Präfix des `.lc-chip-selected` (LM-040 · F4
            «selected»: die Auswahl ist ohne Farbvergleich erkennbar, F2 «Farbe
            nie allein») und die Chip-Grammatik der `.lc-chip-zeile` (LM-044/N1).

            Runde 2: auch die ANATOMIE der Achse (Gruppen-Rolle · Etikett · Chip
            mit Zahl · a11y-Name «<Achse>: <Wert> (<n>)») liegt jetzt in EINEM
            Baustein, `ui/FacettenGruppe`, den /rechtsprechung mitträgt. Die
            zugänglichen Namen bleiben identisch; sichtbar dazu kommt das
            Achsen-Etikett «INHALTSTYP» vor den Chips. */}
        {q !== '' && facetten.length > 1 && (
          <FacettenGruppe label="Inhaltstyp" gruppenLabel="Nach Inhaltstyp filtern"
            optionen={[
              { id: 'alle' as const, titel: 'Alle', n: facetten.reduce((s, f) => s + f.n, 0) },
              ...facetten,
            ].map((o) => ({
              id: o.id, text: o.titel, n: o.n,
              aktiv: aktiverTyp === o.id,
              waehle: () => setTyp(o.id),
            }))} />
        )}
      </div>

      {q === ''
        ? (
          <div className="max-w-reading border-t border-rule-soft pt-3">
            <p className="lc-overline mb-1">Tipp</p>
            <p className="text-body-s leading-relaxed text-ink-600">
              Geben Sie einen Begriff, ein Stichwort oder eine Norm ein. Ein Norm-Kürzel
              («OR 257d») oder ein BGE-Zitat («BGE 152 I 65») springt direkt zur Fundstelle;
              ein Alltagsbegriff («Miete», «Verjährung») findet die einschlägigen Artikel.{' '}
              <Link to="/abdeckung" className="text-ink-700 underline hover:text-ink-900">Was ist durchsuchbar? →</Link>
            </p>
          </div>
        )
        : (
          <SuchResultate
            gruppen={sichtbar}
            allesGeladen={allesGeladen}
            q={q}
            vorschlag={vorschlag}
            abdeckung={abdeckung}
            onVorschlag={(b) => setze(b)}
            onLeeren={() => setze('')}
            onNavigate={(href) => navigate(href)}
            sektionsRollen
          />
        )}
    </div>
  );
}
