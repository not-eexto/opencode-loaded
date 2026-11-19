export const GROUP_KEYS = [
  "instructions",
  "skills",
  "agents",
  "commands",
  "references",
  "mcp",
  "plugins",
] as const

export type GroupKey = (typeof GROUP_KEYS)[number]

export const DEFAULT_BADGE: GroupKey[] = ["instructions", "skills", "agents", "plugins"]

export const LABELS: Record<GroupKey, { short: string; one: string; many: string }> = {
  instructions: { short: "instr", one: "instruction", many: "instructions" },
  skills: { short: "skills", one: "skill", many: "skills" },
  agents: { short: "agents", one: "agent", many: "agents" },
  commands: { short: "cmds", one: "command", many: "commands" },
  references: { short: "refs", one: "reference", many: "references" },
  mcp: { short: "mcp", one: "MCP", many: "MCP" },
  plugins: { short: "plugins", one: "plugin", many: "plugins" },
}

export type Labels = Partial<Record<GroupKey, string>>

export interface LabelStyle {
  readonly labels: Labels
  readonly full: boolean
  readonly compact: boolean
}

/**
 * A configured label is either a template (`{count}i` -> `1i`) or a literal
 * suffix appended after the count (`i` -> `1 i`). Defaults keep the historical
 * short/full words of the badge.
 */
export function formatLabel(key: GroupKey, value: number, style: LabelStyle): string {
  const override = style.labels[key]
  if (override !== undefined) {
    return override.includes("{count}") ? override.replaceAll("{count}", String(value)) : `${value} ${override}`
  }
  const names = LABELS[key]
  const name = style.compact || !style.full ? names.short : value === 1 ? names.one : names.many
  return `${value} ${name}`
}
