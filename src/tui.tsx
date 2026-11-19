/** @jsxImportSource @opentui/solid */
import { Plugin, usePlugin } from "@opencode/plugin/tui"
import { Show, createEffect, createSignal } from "solid-js"
import type { Accessor } from "solid-js"
import { Loaded } from "./rpc.js"
import { availableIds, type Rule } from "./permissions.js"

type Context = Plugin.Context
type Location = ReturnType<Context["data"]["location"]["default"]>
type ConfigEntry = Awaited<ReturnType<Context["client"]["config"]["get"]>>[number]
type PluginEntry = Awaited<ReturnType<Context["client"]["plugin"]["list"]>>["data"][number]

type GroupKey = "instructions" | "skills" | "agents" | "commands" | "references" | "mcp" | "plugins"

interface Entry {
  title: string
  description?: string
}

interface Group {
  key: GroupKey
  title: string
  entries: Entry[]
}

interface AmbientSource {
  path: string
  kind: string
}

interface InstructionReport {
  known: boolean
  sources: AmbientSource[]
}

const GROUP_KEYS: GroupKey[] = ["instructions", "skills", "agents", "commands", "references", "mcp", "plugins"]
const DEFAULT_BADGE: GroupKey[] = ["instructions", "skills", "agents", "plugins"]

const LABELS: Record<GroupKey, { short: string; one: string; many: string }> = {
  instructions: { short: "instr", one: "instruction", many: "instructions" },
  skills: { short: "skills", one: "skill", many: "skills" },
  agents: { short: "agents", one: "agent", many: "agents" },
  commands: { short: "cmds", one: "command", many: "commands" },
  references: { short: "refs", one: "reference", many: "references" },
  mcp: { short: "mcp", one: "MCP", many: "MCP" },
  plugins: { short: "plugins", one: "plugin", many: "plugins" },
}

/** Registry changes that invalidate every cached snapshot. */
const INVALIDATE = new Set<string>([
  "config.updated",
  "agent.updated",
  "skill.updated",
  "command.updated",
  "reference.updated",
  "plugin.updated",
  "mcp.status.changed",
  "session.instructions.updated",
])

interface Options {
  badge: GroupKey[]
  separator: string
  full: boolean
  prefix: string | undefined
  suffix: string | undefined
  width: number
}

function readOptions(raw: Readonly<Record<string, unknown>>): Options {
  const badge = Array.isArray(raw.badge)
    ? raw.badge.filter((value): value is GroupKey => GROUP_KEYS.includes(value as GroupKey))
    : DEFAULT_BADGE

  return {
    badge,
    separator: typeof raw.separator === "string" ? raw.separator : ", ",
    full: raw.full !== false,
    prefix: typeof raw.prefix === "string" ? raw.prefix : undefined,
    suffix: typeof raw.suffix === "string" ? raw.suffix : undefined,
    width: typeof raw.width === "number" && raw.width > 0 ? raw.width : 32,
  }
}

function configuredInstructions(entries: ConfigEntry[]): string[] {
  const values: string[] = []
  for (const entry of entries) {
    const document = entry as { type?: string; info?: { instructions?: unknown } }
    if (document.type !== "document") continue
    const list = document.info?.instructions
    if (!Array.isArray(list)) continue
    for (const value of list) if (typeof value === "string") values.push(value)
  }
  return values
}

function statusLabel(status: unknown): string {
  if (status !== null && typeof status === "object") {
    const label = (status as { status?: unknown }).status
    if (typeof label === "string") return label
  }
  return "unknown"
}

function describePlugin(entry: PluginEntry): string {
  const source = entry.source
  const origin =
    source.type === "builtin"
      ? "builtin"
      : source.type === "package"
        ? `${source.target}${source.version ? `@${source.version}` : ""}`
        : source.type === "local"
          ? source.path
          : "sdk"
  const state = entry.state.status === "failed" ? " · failed" : ""
  return `${origin}${state}`
}

function createAssets(context: Context) {
  const options = readOptions(context.options)
  const rpc = context.client.rpc(Loaded)

  const [report, setReport] = createSignal<InstructionReport>({ known: false, sources: [] })
  const [plugins, setPlugins] = createSignal<Entry[]>([])
  const [revision, setRevision] = createSignal(0)
  const [ready, setReady] = createSignal(false)
  /** Last session shown in the prompt, so `/loaded` uses the same agent. */
  const [session, setSession] = createSignal<string | undefined>(undefined)

  const pending = new Map<string, Promise<void>>()
  const location = (): Location => context.location ?? context.data.location.default()

  /**
   * OpenCode builds the ruleset as `agent.permissions ++ session.permissions`
   * and the last matching rule wins. An unknown agent or session means there is
   * no trustworthy answer, so callers report every discovered skill instead.
   */
  function rulesFor(id: string | undefined): Rule[] | undefined {
    if (!id) return undefined
    try {
      const current = context.data.session.get(id)
      if (!current?.agent) return undefined
      const agent = (context.data.location.agent.list(location()) ?? []).find(
        (entry) => entry.id === current.agent,
      )
      if (!agent) return undefined
      return [...(agent.permissions as Rule[]), ...((current.permissions ?? []) as Rule[])]
    } catch {
      return undefined
    }
  }

  async function sync(target: Location) {
    await Promise.allSettled([
      context.data.location.skill.sync(target),
      context.data.location.agent.sync(target),
      context.data.location.command.sync(target),
      context.data.location.reference.sync(target),
      context.data.location.mcp.server.sync(target),
    ])
  }

  async function load(target: Location, sessionID: string | undefined) {
    const input = { location: { directory: target.directory } }
    const [config, registered] = await Promise.allSettled([
      context.client.config.get(input),
      context.client.plugin.list(input),
    ])
    const configured = config.status === "fulfilled" ? configuredInstructions(config.value) : []

    const instructions = await rpc.instructions({ sessionID, configured }, input).catch(() => undefined)
    if (instructions) setReport(instructions as InstructionReport)

    if (registered.status === "fulfilled") {
      setPlugins(
        registered.value.data
          .filter((entry) => entry.source.type !== "builtin")
          .map((entry) => ({
            title: String(entry.id),
            description: describePlugin(entry),
          })),
      )
    }
    setReady(true)
  }

  /** Loads once per location and session; reads `revision` so effects re-run after invalidation. */
  function ensure(sessionID?: string): void {
    const target = location()
    const key = `${target.directory}\u0000${sessionID ?? ""}`
    revision()
    if (pending.has(key)) return
    pending.set(
      key,
      sync(target)
        .then(async () => {
          if (sessionID && context.data.session.get(sessionID)) {
            await context.data.session.sync(sessionID).catch(() => undefined)
          }
          await load(target, sessionID)
        })
        .catch(() => {
          setReady(true)
        }),
    )
  }

  function invalidate(): void {
    pending.clear()
    setRevision((value) => value + 1)
  }

  const stop = context.data.listen(({ details }) => {
    if (INVALIDATE.has(details.type)) invalidate()
  })

  function instructionEntries(): Entry[] {
    const current = report()
    const suffix = current.known ? "" : " · unverified"
    return current.sources.map((source) => ({
      title: context.ui.format.path(source.path),
      description:
        (source.kind === "claude" ? "CLAUDE.md" : source.kind === "agents" ? "AGENTS.md" : "configured") +
        suffix,
    }))
  }

  function entriesOf(key: GroupKey, id?: string): Entry[] {
    switch (key) {
      case "instructions":
        return instructionEntries()
      case "skills": {
        const skills = context.data.location.skill.list(location()) ?? []
        const allowed = availableIds(skills, rulesFor(id))
        return skills
          .filter((skill) => allowed.has(skill.id))
          .map((skill) => ({
            title: skill.name || skill.id,
            description: context.ui.format.path(skill.path),
          }))
      }
      case "agents":
        return (context.data.location.agent.list(location()) ?? []).map((agent) => ({
          title: agent.name || agent.id,
          description: `${agent.mode}${agent.hidden ? " · hidden" : ""}`,
        }))
      case "commands":
        return (context.data.location.command.list(location()) ?? []).map((command) => ({
          title: command.name,
          description: command.description,
        }))
      case "references":
        return (context.data.location.reference.list(location()) ?? []).map((reference) => ({
          title: reference.name,
          description: context.ui.format.path(reference.path),
        }))
      case "mcp":
        return (context.data.location.mcp.server.list(location()) ?? []).map((server) => ({
          title: server.title || server.name,
          description: statusLabel(server.status),
        }))
      case "plugins":
        return plugins()
    }
  }

  function count(key: GroupKey, id?: string): number {
    return entriesOf(key, id).length
  }

  function label(key: GroupKey, value: number): string {
    const names = LABELS[key]
    if (!options.full) return names.short
    return value === 1 ? names.one : names.many
  }

  /**
   * The prompt footer shares its row with the working directory and the key
   * hints, so it gets short labels narrowed to `width` characters; the home
   * footer has room for full words.
   */
  function badge(id: string | undefined, compact = false): string {
    if (!ready()) return ""
    const parts = options.badge.map((key) => {
      const value = count(key, id)
      return `${value} ${compact ? LABELS[key].short : label(key, value)}`
    })
    const separator = compact ? " · " : options.separator
    if (compact) {
      while (parts.length > 1 && parts.join(separator).length > options.width) parts.pop()
    }
    if (parts.length === 0) return ""
    const body = parts.join(separator)
    const withPrefix = options.prefix ? `${options.prefix} ${body}` : body
    return options.suffix ? `${withPrefix} ${options.suffix}` : withPrefix
  }

  function groups(id?: string): Group[] {
    return GROUP_KEYS.map((key) => ({
      key,
      title: LABELS[key].many,
      entries: entriesOf(key, id),
    }))
  }

  async function show(): Promise<void> {
    const available = groups(session())
    const choice = await context.ui.dialog.select<GroupKey>({
      title: "Loaded assets",
      placeholder: "Filter groups",
      options: available.map((group) => ({
        title: group.title,
        value: group.key,
        description: `${group.entries.length} ${group.entries.length === 1 ? "entry" : "entries"}`,
        disabled: group.entries.length === 0,
      })),
    })
    if (choice === undefined) return

    const selected = available.find((group) => group.key === choice)
    if (!selected || selected.entries.length === 0) return

    await context.ui.dialog.select<string>({
      title: `${selected.title} (${selected.entries.length})`,
      placeholder: "Filter",
      options: selected.entries.map((entry) => ({
        title: entry.title,
        value: entry.title,
        description: entry.description,
      })),
    })
  }

  return {
    badge,
    ensure,
    remember: (id: string) => setSession(id),
    show,
    dispose: () => stop(),
  }
}

type Assets = ReturnType<typeof createAssets>

function Badge(props: { assets: Assets; sessionID?: string; compact?: boolean }) {
  const context = usePlugin()
  createEffect(() => {
    if (props.sessionID) props.assets.remember(props.sessionID)
    props.assets.ensure(props.sessionID)
  })
  return (
    <text fg={context.theme.text.muted} wrapMode="none">
      {props.assets.badge(props.sessionID, props.compact === true)}
    </text>
  )
}

export default Plugin.define({
  id: "loaded.tui",
  setup(context) {
    const assets = createAssets(context)

    const status = context.ui.slot({
      append: "prompt.footer.status",
      render: (input) => (
        <Show when={input.mode === "normal" ? input.sessionID : undefined} fallback={<text />}>
          {(sessionID: Accessor<string>) => <Badge assets={assets} sessionID={sessionID()} compact />}
        </Show>
      ),
    })

    const footer = context.ui.slot({
      append: "home.footer.status",
      render: () => <Badge assets={assets} />,
    })

    context.keymap.layer(() => ({
      mode: "global",
      commands: [
        {
          id: "loaded.show",
          title: "Loaded: inspect configuration assets",
          group: "Loaded",
          palette: true,
          slash: { name: "loaded", aliases: ["assets"] },
          run: () => assets.show(),
        },
      ],
    }))

    return () => {
      assets.dispose()
      status()
      footer()
    }
  },
})
