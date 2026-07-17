import type { PlatformCapability, PlatformErrorCode } from './client'

export type PlatformDiagnosticEvent = Readonly<{
  kind: 'platform-operation-failure'
  capability: PlatformCapability
  code: PlatformErrorCode
  source: 'platform-result' | 'contract-rejection'
  context: 'conversation-load' | 'conversation-write'
}>

export type PlatformDiagnosticListener = (event: PlatformDiagnosticEvent) => void

const listeners = new Set<PlatformDiagnosticListener>()

export function subscribePlatformDiagnostics(listener: PlatformDiagnosticListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function reportPlatformDiagnostic(event: PlatformDiagnosticEvent): void {
  const safeEvent = Object.freeze({ ...event })
  for (const listener of listeners) {
    try {
      listener(safeEvent)
    } catch {
      // Diagnostics must never interrupt the user operation they describe.
    }
  }
}
