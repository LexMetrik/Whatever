import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { SeitenKopf } from '../components/layout/SeitenKopf';
import { ladeBrowseManifest } from '../lib/normtext/browse';
import { ladeEntscheidManifest } from '../lib/rechtsprechung/browse';
import { ladeMaterialManifest } from '../lib/materialien/browse';

// ─── Seite «Was ist durchsuchbar» — Korpus-Abdeckung (UI-NAV S3/E1) ─────────
//
// §8-Offenlegung, was die LexMetrik-Suche wirklich durchsucht — aus den ohnehin
// vorhandenen Registern abgeleitet (kein Zweit-Index, K10; reine Ableitung §3,
// keine Rechtslogik). Deckt gezielt den in der Praxis-Linse benannten Kantons-/
// Rechtsprechungs-Blindflug: kantonale Erlasse liegen im Reader im Volltext,
// sind aber (Suchindex Bund-only, §11.5) nur nach Titel durchsuchbar; die
// Fusszeile der Suche verlinkt hierher.
//
// W2·29-WERKBANK-KATALOGE K5 (23.9.2026, Board «Unter-Abdeckung», Richtung):
// je Bestand EINE Zeile mit Haarlinie — links Registerstrich, Titel und Zahl,
// rechts die Prosa; die Grenzen der Suche als abgesetzte Zeile auf `--well`
// statt Hinweis-Kasten. Links in Tinte mit Registerkante statt Messing (F0.2).

interface Zahlen {
  bundVolltext: number;
  kantonTitel: number;
  bge: number;
  entscheideGesamt: number;
  materialien: number;
}

/** Eine Bestandszeile: Registerstrich · Titel · Zahl | Prosa. */
function Bestand({ reg, titel, zahl, einheit, children }: {
  reg: 'g' | 'r' | 'm'; titel: string; zahl: ReactNode; einheit: string; children: ReactNode;
}) {
  return (
    <section className="ab-bestand" data-reg={reg}>
      <div>
        <span aria-hidden className="ab-strich" />
        <h2 className="text-ink-900">{titel}</h2>
        <p className="num mt-2 font-serif text-h1 font-normal leading-none text-ink-900">{zahl}</p>
        <p className="mt-1 text-xs text-ink-500">{einheit}</p>
      </div>
      <div className="max-w-reading space-y-3 font-serif leading-relaxed text-ink-800">{children}</div>
    </section>
  );
}

export function Abdeckung() {
  const [z, setZ] = useState<Zahlen | null>(null);

  useEffect(() => {
    let abgebrochen = false;
    Promise.all([ladeBrowseManifest(), ladeEntscheidManifest(), ladeMaterialManifest()]).then(([g, e, m]) => {
      if (abgebrochen) return;
      const erlasse = g?.erlasse ?? [];
      const entscheide = e?.entscheide ?? [];
      setZ({
        bundVolltext: erlasse.filter((x) => x.ebene === 'bund' && x.status === 'snapshot').length,
        kantonTitel: erlasse.filter((x) => x.ebene === 'kanton').length,
        bge: entscheide.filter((x) => x.bgeReferenz).length,
        entscheideGesamt: entscheide.length,
        materialien: m?.materialien?.length ?? 0,
      });
    });
    return () => { abgebrochen = true; };
  }, []);

  return (
    <div className="space-y-6">
      <SeitenKopf overline="Suche" titel="Was ist durchsuchbar" />

      <p className="max-w-reading font-serif text-body-l leading-relaxed text-ink-800">
        Die Suche oben durchsucht den unten aufgeführten Bestand. Massgeblich bleibt immer die
        amtliche Fassung — jeder Erlass und jeder Entscheid trägt Stand und Live-Link zur Quelle.
        Was noch fehlt, wird hier ehrlich benannt statt weggeglättet.
      </p>

      <div className="space-y-6">
        <Bestand reg="g" titel="Gesetze" zahl={z ? `${z.bundVolltext} / ${z.kantonTitel}` : '…'}
          einheit="Bundeserlasse im Volltext / kantonale Erlasse">
          <p>
            <strong className="font-semibold text-ink-900">{z ? z.bundVolltext : '…'} Bundeserlasse</strong> sind im
            Volltext durchsuchbar — die Suche findet einzelne Artikel nach Wortlaut. Die{' '}
            <strong className="font-semibold text-ink-900">{z ? z.kantonTitel : '…'} kantonalen Erlasse</strong> liegen im
            Reader ebenfalls im Volltext vor. In der Suche sind sie <em>nach Titel</em> immer auffindbar,
            im <em>Wortlaut</em> nur über die Online-Suche: der ausgelieferte Artikel-Volltextindex ist
            seit dem 1.9.2026 wieder Bund-only, kantonale Artikel kommen von unserem Suchdienst. Ohne
            Verbindung fehlen kantonale Volltext-Treffer darum ganz. Über{' '}
            <Link to="/gesetze" className="ab-link">Gesetze</Link>{' '}
            sind alle browse- und lesbar.
          </p>
        </Bestand>

        <Bestand reg="r" titel="Rechtsprechung" zahl={z ? z.entscheideGesamt : '…'}
          einheit={`Entscheide, davon ${z ? z.bge : '…'} BGE`}>
          <p>
            Im Bestand sind <strong className="font-semibold text-ink-900">{z ? z.entscheideGesamt : '…'} Entscheide</strong>,
            davon <strong className="font-semibold text-ink-900">{z ? z.bge : '…'} amtliche Leitentscheide (BGE)</strong> mit
            Regeste. Ein BGE-Zitat («BGE 152 I 65») springt aus der Suche direkt in den Entscheid; ist es
            nicht im Bestand, verweist die Suche ehrlich auf die amtliche Fassung beim Bundesgericht.
            Daten: OpenCaseLaw — massgeblich bleibt die amtliche Fassung. Keine Rechtsberatung.
          </p>
          <p className="font-sans text-body-s">
            <Link to="/rechtsprechung" className="ab-link">Zur Rechtsprechung →</Link>
          </p>
        </Bestand>

        <Bestand reg="m" titel="Materialien" zahl={z ? z.materialien : '…'} einheit="amtliche Ressourcen">
          <p>
            <strong className="font-semibold text-ink-900">{z ? z.materialien : '…'} amtliche Ressourcen</strong>{' '}
            (Kreisschreiben, Leitfäden, Wegleitungen, Rundschreiben) — faktisches Soft-Law ohne
            Gesetzesrang, je mit Live-Link zur amtlichen Fassung.
          </p>
        </Bestand>

        <section className="ab-bestand ab-grenzen">
          <div>
            <span aria-hidden className="ab-strich" />
            <p className="lc-overline">Grenzen der Suche</p>
          </div>
          <p className="max-w-reading font-serif leading-relaxed text-ink-800">
            Der Volltext-Artikelindex deckt heute die Bundeserlasse ab; kantonale Erlasse und
            nicht-amtliche Entscheide sind über Titel bzw. Metadaten auffindbar, nicht über jeden
            Wortlaut. Diese Abdeckung wächst — bis dahin wird die Grenze offengelegt, nicht kaschiert.
          </p>
        </section>
      </div>
    </div>
  );
}
