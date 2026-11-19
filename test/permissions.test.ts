import assert from "node:assert/strict"
import test from "node:test"
import { availableIds, evaluate, matches, type Rule } from "../src/permissions.ts"

const skill = (id: string, extra: Record<string, unknown> = {}) => ({ id, description: id, ...extra })

test("wildcard matching follows OpenCode's matcher", () => {
  assert.equal(matches("skill", "skill"), true)
  assert.equal(matches("skill", "sk*"), true)
  assert.equal(matches("skill", "s?ill"), true)
  assert.equal(matches("skill", "tool"), false)
  assert.equal(matches("agent-device", "agent-*"), true)
  // `.` and `+` are literal, not regex operators.
  assert.equal(matches("a+b", "a+b"), true)
  assert.equal(matches("axb", "a+b"), false)
})

test("last matching rule wins and an unmatched request asks", () => {
  const rules: Rule[] = [
    { action: "*", resource: "*", effect: "allow" },
    { action: "skill", resource: "shadcn", effect: "deny" },
    { action: "skill", resource: "s*", effect: "allow" },
  ]
  assert.equal(evaluate("skill", "shadcn", rules), "allow")
  assert.equal(evaluate("skill", "other", rules), "allow")
  assert.equal(evaluate("skill", "shadcn", rules.slice(0, 2)), "deny")
  assert.equal(evaluate("skill", "anything", []), "ask")
})

test("available skills exclude deny rules and unusable summaries", () => {
  const rules: Rule[] = [
    { action: "*", resource: "*", effect: "allow" },
    { action: "skill", resource: "shadcn", effect: "deny" },
  ]
  const skills = [
    skill("shadcn"),
    skill("opencode"),
    skill("undocumented", { description: undefined }),
    skill("manual", { autoinvoke: false }),
  ]
  assert.deepEqual([...availableIds(skills, rules)], ["opencode"])
  assert.deepEqual([...availableIds(skills, undefined)].sort(), ["opencode", "shadcn"])
})
