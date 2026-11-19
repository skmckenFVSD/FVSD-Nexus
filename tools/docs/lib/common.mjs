// Shared helpers for the FVSD Nexus documentation builds.
// Markdown in docs/ is the single source; these helpers read it, resolve the
// icon registry, and render inline markdown for the HTML outputs.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as yaml from 'js-yaml'
import { marked } from 'marked'

const here = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.resolve(here, '../../..')
export const DOCS = path.join(ROOT, 'docs')
export const PUBLISH = path.join(ROOT, 'publish')
const LUCIDE = path.join(here, '..', 'node_modules', 'lucide-static', 'icons')

// ── Registry ────────────────────────────────────────────────────────────
export const registry = yaml.load(fs.readFileSync(path.join(DOCS, 'standards', 'icon-registry.yml'), 'utf8'))

// Longest emoji first so multi-codepoint emoji (🧑‍🏫, 🗺️) match before their parts.
const conceptsByEmoji = new Map(
  Object.entries(registry.concepts).map(([key, c]) => [c.emoji, { key, ...c }]),
)
const statusByEmoji = new Map(
  Object.entries(registry.status).map(([key, s]) => [s.emoji, { key, ...s }]),
)
const emojiAlternation = [...conceptsByEmoji.keys(), ...statusByEmoji.keys()]
  .sort((a, b) => b.length - a.length)
  .map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|')
export const leadingEmojiRe = new RegExp(`^(?:${emojiAlternation})\\uFE0F?\\s*`)

/** Split "🏗️ Architecture overview" into { concept, text }. */
export function splitIcon(text) {
  const match = text.match(leadingEmojiRe)
  if (!match) return { concept: null, text: text.trim() }
  const emoji = match[0].trim().replace(/️$/, '')
  const concept = conceptsByEmoji.get(emoji) ?? conceptsByEmoji.get(emoji + '️') ?? null
  return { concept, text: text.slice(match[0].length).trim() }
}

export function conceptForEmoji(emoji) {
  return conceptsByEmoji.get(emoji) ?? conceptsByEmoji.get(emoji.replace(/️$/, '')) ?? null
}

/** Any emoji-looking character sequence at the start of a heading. */
export function headingLeadEmoji(text) {
  const m = text.match(/^(\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*️?)/u)
  return m ? m[1] : null
}

const svgCache = new Map()
/** Inline Lucide SVG for a registry concept key or Lucide name. */
export function icon(nameOrConcept, { size = 20, cls = 'ico', label = null } = {}) {
  const lucide = registry.concepts[nameOrConcept]?.lucide ?? nameOrConcept
  if (!svgCache.has(lucide)) {
    const file = path.join(LUCIDE, `${lucide}.svg`)
    if (!fs.existsSync(file)) throw new Error(`Unknown Lucide icon: ${lucide}`)
    const raw = fs.readFileSync(file, 'utf8')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s*\n\s*/g, ' ')
      .replace(/class="[^"]*"\s*/, '')
      .replace(/\s(width|height)="24"/g, '')
      .trim()
    svgCache.set(lucide, raw)
  }
  const a11y = label ? `role="img" aria-label="${escapeHtml(label)}"` : 'aria-hidden="true" focusable="false"'
  return svgCache.get(lucide).replace('<svg', `<svg class="${cls}" width="${size}" height="${size}" ${a11y}`)
}

// ── Status pills ────────────────────────────────────────────────────────
// `🟢 **Live**` → <span class="pill p-live">Live</span>
const pillRe = new RegExp(
  `(${[...statusByEmoji.keys()].join('|')})\\s*(?:\\*\\*([^*]+)\\*\\*|<strong>([^<]+)</strong>)`,
  'gu',
)
export function renderPills(html) {
  return html.replace(pillRe, (_, emoji, md, strong) => {
    const s = statusByEmoji.get(emoji)
    return `<span class="pill p-${s.pill}">${md ?? strong}</span>`
  })
}

/** Replace registered concept emoji inside running text with inline icons. */
export function renderInlineIcons(html, size = 16) {
  const re = new RegExp(`(?:${[...conceptsByEmoji.keys()].sort((a, b) => b.length - a.length).map((e) => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\uFE0F?`, 'gu')
  return html.replace(re, (e) => {
    const c = conceptForEmoji(e)
    return c ? icon(c.key, { size, cls: 'ico ico-inline' }) : e
  })
}

// ── Markdown ────────────────────────────────────────────────────────────
marked.use({ gfm: true, breaks: false })
export { marked }

export function inline(md) {
  return renderPills(marked.parseInline(md ?? ''))
}

export function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function slugify(text) {
  return splitIcon(text).text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[`*_~]/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── Front matter ────────────────────────────────────────────────────────
export function readDoc(file) {
  const raw = fs.readFileSync(file, 'utf8')
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { data: {}, body: raw, raw }
  return { data: yaml.load(m[1]) ?? {}, body: raw.slice(m[0].length), raw }
}

export function walk(dir, filter = (f) => f.endsWith('.md')) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full, filter))
    else if (filter(full)) out.push(full)
  }
  return out.sort()
}

export function writeFile(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

export function copyFile(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
}

/** Brand tokens shared by every HTML output. */
export const brandCss = fs.readFileSync(path.join(here, '..', 'brand', 'tokens.css'), 'utf8')
