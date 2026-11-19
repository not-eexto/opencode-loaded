import fs from "node:fs"
import path from "node:path"

/**
 * An instruction file OpenCode injects without being asked, i.e. one of the
 * ambient `AGENTS.md` files (or the `CLAUDE.md` fallback) discovered on disk.
 */
export interface AmbientInstruction {
  path: string
  kind: "agents" | "claude" | "configured"
}

export interface AmbientOptions {
  /** Workspace directory of the location being inspected. */
  directory: string
  /** Project root. Upper boundary when the workspace lives outside the home directory. */
  project: string | undefined
  /** Global OpenCode config directory. */
  config: string
  /** Home directory. Upper boundary when the workspace lives inside it. */
  home: string
  /** Mirrors OPENCODE_DISABLE_PROJECT_CONFIG. */
  projectConfig: boolean
  /** Mirrors OPENCODE_DISABLE_CLAUDE_CODE_PROMPT. */
  claude: boolean
}

const AGENTS = "AGENTS.md"
const CLAUDE = "CLAUDE.md"

function isFile(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isFile()
  } catch {
    return false
  }
}

/**
 * A directory's `AGENTS.md` always wins over its `CLAUDE.md`; they are never
 * both loaded. The caller decides whether the fallback is allowed at all.
 */
function instructionIn(directory: string, claude: boolean): AmbientInstruction | undefined {
  const agents = path.join(directory, AGENTS)
  if (isFile(agents)) return { path: agents, kind: "agents" }
  if (!claude) return undefined
  const fallback = path.join(directory, CLAUDE)
  if (isFile(fallback)) return { path: fallback, kind: "claude" }
  return undefined
}

function contains(parent: string, child: string): boolean {
  const relative = path.relative(parent, child)
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative)
}

/**
 * Reproduces the documented discovery rules: the global file first, then every
 * `AGENTS.md` from the workspace upward, stopping at the project root or before
 * the home directory. Nested files loaded lazily while the agent explores are
 * not discoverable from here; the server part reports those from the request.
 */
export function discoverAmbient(options: AmbientOptions): AmbientInstruction[] {
  const found: AmbientInstruction[] = []
  const seen = new Set<string>()

  const push = (entry: AmbientInstruction | undefined) => {
    if (!entry || seen.has(entry.path)) return
    seen.add(entry.path)
    found.push(entry)
  }

  const global = instructionIn(options.config, options.claude)
  push(global)

  if (!options.projectConfig) return found

  const project = options.project && contains(options.project, options.directory) ? options.project : undefined
  const stops = new Set([options.home, options.config])

  let current = path.resolve(options.directory)
  while (true) {
    if (stops.has(current)) break
    push(instructionIn(current, options.claude))
    if (current === project) break
    const parent = path.dirname(current)
    if (parent === current) break
    current = parent
  }

  return found
}

/** Honors XDG_CONFIG_HOME, matching how the server resolves its global config. */
export function globalConfigDirectory(home: string): string {
  const xdg = process.env.XDG_CONFIG_HOME
  return xdg ? path.join(xdg, "opencode") : path.join(home, ".config", "opencode")
}

export function discoveryOptions(input: {
  directory: string
  project: string | undefined
  home: string
}): AmbientOptions {
  return {
    directory: input.directory,
    project: input.project,
    home: input.home,
    config: globalConfigDirectory(input.home),
    projectConfig: process.env.OPENCODE_DISABLE_PROJECT_CONFIG !== "1",
    claude: process.env.OPENCODE_DISABLE_CLAUDE_CODE_PROMPT !== "1",
  }
}

/**
 * Expands the `instructions` entries of the configuration. Plain paths are
 * checked on disk; patterns are expanded when the runtime exposes a glob.
 */
export function expandConfigured(
  entries: ReadonlyArray<string>,
  directory: string,
): AmbientInstruction[] {
  const found: AmbientInstruction[] = []
  for (const entry of entries) {
    const absolute = path.isAbsolute(entry) ? entry : path.join(directory, entry)
    if (!GLOB.test(entry)) {
      if (isFile(absolute)) found.push({ path: absolute, kind: "configured" })
      continue
    }
    const glob = (fs as { globSync?: (pattern: string) => string[] }).globSync
    if (!glob) continue
    try {
      for (const match of glob(absolute)) {
        if (isFile(match)) found.push({ path: match, kind: "configured" })
      }
    } catch {
      // An invalid pattern is the configuration's problem, not the plugin's.
    }
  }
  return found
}

const GLOB = /[*?[\]{}]/
const cache = new Map<string, { mtimeMs: number; size: number; text: string }>()

function content(file: string): string | undefined {
  let stat: fs.Stats
  try {
    stat = fs.statSync(file)
  } catch {
    return undefined
  }
  const cached = cache.get(file)
  if (cached && cached.mtimeMs === stat.mtimeMs && cached.size === stat.size) return cached.text

  let text: string
  try {
    text = fs.readFileSync(file, "utf8").trim()
  } catch {
    return undefined
  }
  cache.set(file, { mtimeMs: stat.mtimeMs, size: stat.size, text })
  return text
}

/**
 * Instruction files are not listed in the request metadata, so a candidate is
 * confirmed by finding its text in the system parts. The opening window is a
 * second chance for files the server reformats.
 */
export function verify(
  candidates: ReadonlyArray<AmbientInstruction>,
  system: ReadonlyArray<{ text: string }>,
): AmbientInstruction[] {
  const seen = new Set<string>()
  const verified: AmbientInstruction[] = []

  for (const candidate of candidates) {
    if (seen.has(candidate.path)) continue
    seen.add(candidate.path)

    const text = content(candidate.path)
    if (!text) continue

    const window = text.slice(0, 200)
    if (system.some((part) => part.text.includes(text) || part.text.includes(window))) {
      verified.push(candidate)
    }
  }

  return verified
}
