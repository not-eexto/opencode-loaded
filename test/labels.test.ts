import assert from "node:assert/strict"
import test from "node:test"
import { formatLabel } from "../src/labels.ts"

const plain = { labels: {}, full: true, compact: false }

test("default labels keep singular, plural and compact forms", () => {
  assert.equal(formatLabel("instructions", 1, plain), "1 instruction")
  assert.equal(formatLabel("instructions", 3, plain), "3 instructions")
  assert.equal(formatLabel("instructions", 3, { ...plain, compact: true }), "3 instr")
  assert.equal(formatLabel("plugins", 1, { ...plain, compact: true }), "1 plugins")
})

test("custom templates can render 1i, 3s, 19a", () => {
  const labels = { instructions: "{count}i", skills: "{count}s", agents: "{count}a" }
  const style = { ...plain, compact: true, labels }
  assert.equal(formatLabel("instructions", 1, style), "1i")
  assert.equal(formatLabel("skills", 3, style), "3s")
  assert.equal(formatLabel("agents", 19, style), "19a")
})

test("custom literal labels append after the count", () => {
  assert.equal(formatLabel("skills", 3, { ...plain, labels: { skills: "sk" } }), "3 sk")
})
