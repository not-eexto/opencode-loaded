import os from "node:os"
import { Plugin } from "@opencode/plugin"
import { Loaded } from "./rpc.js"
import {
  discoverAmbient,
  discoveryOptions,
  expandConfigured,
  verify,
  type AmbientInstruction,
} from "./instructions.js"

/** Only the text matters: instruction files are confirmed by content. */
interface SystemPart {
  readonly text: string
}

interface StoredSources {
  readonly files: AmbientInstruction[]
}

/**
 * The request hook and the RPC surface are separate plugin instances, so the
 * verified list has to travel through the plugin's storage.
 */
const key = (sessionID: string) => `loaded/session/${sessionID}`

function merge(primary: AmbientInstruction[], extra: AmbientInstruction[]): AmbientInstruction[] {
  const seen = new Set(primary.map((entry) => entry.path))
  return [...primary, ...extra.filter((entry) => !seen.has(entry.path))]
}

export default Plugin.define({
  id: "loaded",
  async setup(ctx) {
    const location = () => ({
      directory: ctx.location.directory,
      project: ctx.location.project.canonical ?? ctx.location.project.directory,
      home: os.homedir(),
    })

    const ambient = () => discoverAmbient(discoveryOptions(location()))

    const configured = (entries: ReadonlyArray<string>) => expandConfigured(entries, location().directory)

    const hook = await ctx.session.hook("context", async (event) => {
      // Never let inspection break the request it is inspecting.
      try {
        const system = event.system.map((part: SystemPart) => ({ text: part.text }))
        const value: StoredSources = { files: verify(ambient(), system) }
        // The domain stores JSON; StoredSources is exactly that shape at runtime.
        await ctx.storage.set(key(String(event.sessionID)), value as unknown as Parameters<typeof ctx.storage.set>[1])
      } catch {
        // An unreadable file or a failed write only costs accuracy, not the turn.
      }
    })

    const registration = await ctx.rpc.register(Loaded, {
      instructions: async (input) => {
        const query = (input ?? {}) as { sessionID?: string; configured?: string[] }
        const extra = configured(query.configured ?? [])
        const stored = query.sessionID
          ? ((await ctx.storage.get(key(query.sessionID))) as unknown as StoredSources | undefined)
          : undefined

        if (!stored) return { known: false, sources: merge(ambient(), extra) }
        return { known: true, sources: merge(stored.files, extra) }
      },
    })

    return async () => {
      await hook.dispose()
      await registration.dispose()
    }
  },
})
