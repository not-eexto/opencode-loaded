/**
 * The permission semantics OpenCode uses when it builds the skill guidance of
 * a request. Kept dependency-free so it can be reused by both plugin parts.
 *
 * Core references (@opencode/core 2.3.2):
 * - `src/util/wildcard.ts` — `match(input, pattern)`
 * - `src/permission.ts` — `evaluate(action, resource, ...rulesets)` picks the
 *   last matching rule, falling back to `ask`
 * - `src/skill.ts` — `available(skills, permissions)` drops skills whose
 *   evaluation is `deny`
 * - `src/permission.ts` — the ruleset is `agent.permissions ++ session.permissions`
 */

export type Effect = "allow" | "deny" | "ask"

export interface Rule {
  readonly action: string
  readonly resource: string
  readonly effect: Effect
}

/** Exact port of OpenCode's wildcard matcher, including its optional-space quirk. */
export function matches(input: string, pattern: string): boolean {
  const normalized = input.replaceAll("\\", "/")
  let escaped = pattern
    .replaceAll("\\", "/")
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".")
  if (escaped.endsWith(" .*")) escaped = escaped.slice(0, -3) + "( .*)?"
  const flags = process.platform === "win32" ? "si" : "s"
  return new RegExp(`^${escaped}$`, flags).test(normalized)
}

/** Last matching rule wins; no match means `ask`, which is not a deny. */
export function evaluate(action: string, resource: string, rules: readonly Rule[]): Effect {
  for (let index = rules.length - 1; index >= 0; index--) {
    const rule = rules[index]
    if (matches(action, rule.action) && matches(resource, rule.resource)) return rule.effect
  }
  return "ask"
}

/** Skills absent from the guidance also include ones without a usable summary. */
export function availableIds(
  skills: ReadonlyArray<{ readonly id: string; readonly description?: string; readonly autoinvoke?: boolean }>,
  rules: readonly Rule[] | undefined,
): Set<string> {
  return new Set(
    skills
      .filter((skill) => skill.description !== undefined && skill.autoinvoke !== false)
      .filter((skill) => !rules || evaluate("skill", skill.id, rules) !== "deny")
      .map((skill) => skill.id),
  )
}
