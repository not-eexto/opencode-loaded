import { Rpc } from "@opencode/plugin/rpc"

const Source = {
  type: "object",
  properties: {
    path: { type: "string" },
    kind: { type: "string" },
  },
  required: ["path", "kind"],
  additionalProperties: false,
}

/**
 * Contract between the server part, which sees every model request, and the
 * TUI part, which only has registry snapshots.
 */
export const Loaded = Rpc.define({
  id: "loaded",
  methods: {
    instructions: {
      input: {
        type: "object",
        properties: {
          sessionID: { type: "string" },
          /** `instructions` entries of the configuration, resolved against the location. */
          configured: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
      output: {
        type: "object",
        properties: {
          /** False when the session has not issued a request yet, so the list is discovery only. */
          known: { type: "boolean" },
          /** Instruction files, verified against the request when `known` is true. */
          sources: { type: "array", items: Source },
        },
        required: ["known", "sources"],
        additionalProperties: false,
      },
    },
  },
  events: {},
})
