// scripts/materialien/kanten-erlasse-run.ts
// Dünner CLI-Runner: schreibt die Existenzliste der Kanten-Shards aus dem committeten
// Verzeichnis (siehe kanten-erlasse.ts). Läuft auch automatisch am Ende von
// `npm run materialien` (soft-law-projektion-run.ts), nachdem die Shards geschrieben sind.
// Aufruf: npm run materialien:kanten-erlasse
import { schreibeKantenErlasse, KANTEN_ERLASSE_PFAD } from './kanten-erlasse.ts';

const n = schreibeKantenErlasse();
console.log(`kanten-erlasse: ${n} Erlass(e) mit Kanten-Shard → ${KANTEN_ERLASSE_PFAD}`);
