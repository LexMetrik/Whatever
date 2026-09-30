import { describe, expect, it } from 'vitest'
import { E2E_FENSTER, MESS_FENSTER, portAusPfad } from './worktree-port'

const PFADE = Array.from({ length: 40 }, (_, i) => `/w/LexMetrik/.claude/worktrees/agent-${i}`)

describe('portAusPfad', () => {
  it('derselbe Pfad ergibt denselben Port', () => {
    for (const p of PFADE) expect(portAusPfad(p, MESS_FENSTER)).toBe(portAusPfad(p, MESS_FENSTER))
  })

  it('bleibt im Fenster', () => {
    for (const f of [E2E_FENSTER, MESS_FENSTER]) {
      for (const p of PFADE) {
        const port = portAusPfad(p, f)
        expect(port).toBeGreaterThanOrEqual(f.basis)
        expect(port).toBeLessThan(f.basis + f.spanne)
      }
    }
  })

  it('verschiedene Pfade ergeben überwiegend verschiedene Ports', () => {
    const ports = new Set(PFADE.map((p) => portAusPfad(p, MESS_FENSTER)))
    expect(ports.size).toBeGreaterThanOrEqual(PFADE.length - 5)
  })

  it('e2e- und Mess-Fenster überlappen nicht (gleicher Worktree, zwei Server)', () => {
    expect(E2E_FENSTER.basis + E2E_FENSTER.spanne).toBeLessThanOrEqual(MESS_FENSTER.basis)
    for (const p of PFADE) expect(portAusPfad(p, E2E_FENSTER)).not.toBe(portAusPfad(p, MESS_FENSTER))
  })

  it('meidet die festen Ports von CI und Mess-Skripten', () => {
    const fest = [4317, 4319, 4331, 4333, 4366]
    for (const f of [E2E_FENSTER, MESS_FENSTER]) {
      for (const port of fest) {
        expect(port >= f.basis && port < f.basis + f.spanne).toBe(false)
      }
    }
  })
})
