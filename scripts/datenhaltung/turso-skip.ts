// scripts/datenhaltung/turso-skip.ts
// STUB — absichtlich unfertig, damit `turso-skip.test.ts` einmal ROT läuft (§6.7).
// Wird im Folge-Commit durch die echte Logik ersetzt.
import type { Wert } from './turso-transport';

export const EXIT_SPERRE = 0;
export const SPERR_TEXT = '';

export interface Signatur { signatur: string; sollZeilen: number }
export interface SkipBefund { skip: boolean; grund: string }
export interface SchattenLadungLese { suffix: string; spalten: string[]; werte: Wert[][] }

export function istSchreibsperre(_fehler: unknown): boolean {
  return false;
}

export function sperrMeldung(_stand: string | null): string {
  return '';
}

export function signaturBasis(_ddl: string, _datenSha: string): string {
  return 'stub';
}

export function signaturFts(_ddl: string, _ladungen: Iterable<SchattenLadungLese>): string {
  return 'stub';
}

export function skipEntscheid(_a: {
  lokal: Signatur;
  remoteSignatur?: string | null;
  remoteZeilen: number | null;
}): SkipBefund {
  return { skip: true, grund: 'stub' };
}

export async function planeSkip(
  lokal: ReadonlyMap<string, Signatur>,
  _leseSignaturen: () => Promise<Map<string, string>>,
  _zaehleRemote: (tabelle: string) => Promise<number | null>,
): Promise<Map<string, SkipBefund>> {
  return new Map([...lokal.keys()].map((t) => [t, { skip: true, grund: 'stub' }]));
}
