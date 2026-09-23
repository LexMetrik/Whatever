// Barrel (QS-TOK/P5, T14 Stufe 1): der frühere ~690-Zeilen-Monolith ist in
// verhaltensneutrale Geschwister-Dateien unter `./parts/` gesplittet (§6 Ziff. 6,
// golden byte-gleich). JEDE Komponente ist ein eigenständiger Reiner-Renderer;
// dieser Barrel hält den bisherigen Import-Pfad `./parts` stabil (Reader + Tests
// unverändert, §6 Ziff. 3). Das Tor `check:linien-kanon` liest die Marker jetzt
// aus den Geschwister-Dateien (READER-Liste dort nachgezogen).
export { ArtikelLeser } from './parts/ArtikelLeser';
export { ErlassLeserKopf } from './parts/ErlassLeserKopf';
export { SektionKopf } from './parts/SektionKopf';
export { SektionBaumTOC } from './parts/SektionBaumTOC';
