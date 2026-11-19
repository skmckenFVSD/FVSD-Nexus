#!/usr/bin/env node
// Validate the documentation layer: front matter, heading icons, relative
// links and the generated outputs. Exits non-zero on any error.

import fs from 'node:fs'
import path from 'node:path'
import { DOCS, ROOT, headingLeadEmoji, conceptForEmoji, readDoc, walk } from './lib/common.mjs'
import { buildGuide } from './build-guide.mjs'
import { buildDeck } from './build-deck.mjs'

const REQUIRED = ['title', 'description', 'type', 'status', 'icon', 'area', 'audience', 'owner', 'tags', 'updated']
const TYPES = new Set(['hub', 'overview', 'capability', 'architecture', 'adr', 'decision-register', 'delivery', 'design-system', 'governance', 'philosophy', 'reference', 'standard', 'template', 'guide', 'guide-chapter', 'guide-review', 'deck', 'presentation', 'contributing'])
const STATUSES = new Set(['current', 'confirmed', 'proposed', 'open', 'accepted', 'superseded', 'draft'])
const AREAS = new Set(['docs', 'architecture', 'capabilities', 'decisions', 'delivery', 'design-system', 'governance', 'philosophy', 'presentation', 'reference', 'standards', 'user-guide'])

// GitHub heading anchors: lowercase, drop punctuation and emoji, spaces → hyphens.
const githubSlug = (t) => t.trim().toLowerCase().replace(/<[^>]+>/g, '').replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-')
const anchorCache = new Map()
function anchorsOf(file) {
  if (!anchorCache.has(file)) {
    const seen = new Map()
    const out = new Set()
    let fence = false
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      if (/^```/.test(line)) { fence = !fence; continue }
      const h = !fence && line.match(/^#{1,6} (.*)$/)
      if (!h) continue
      const base = githubSlug(h[1].replace(/[`*_]/g, ''))
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      out.add(n ? `${base}-${n}` : base)
    }
    anchorCache.set(file, out)
  }
  return anchorCache.get(file)
}

const errors = []
const warnings = []
const err = (file, msg) => errors.push(`${path.relative(ROOT, file)}: ${msg}`)

const isTemplate = (f) => f.includes(`${path.sep}standards${path.sep}templates${path.sep}`) && !f.endsWith('README.md')

for (const file of walk(DOCS)) {
  const { data, body, raw } = (() => {
    if (isTemplate(file)) return { data: {}, body: fs.readFileSync(file, 'utf8').replace(/^---[\s\S]*?\n---\n/, ''), raw: '' }
    try { return readDoc(file) } catch (e) { err(file, `front matter is not valid YAML (${e.message.split('\n')[0]})`); return { data: null, body: '', raw: '' } }
  })()
  if (!data) continue

  // ── Front matter ────────────────────────────────────────────────────
  if (!isTemplate(file)) {
    if (!raw.startsWith('---')) err(file, 'missing YAML front matter')
    for (const key of REQUIRED) if (data[key] === undefined || data[key] === '') err(file, `front matter is missing "${key}"`)
    if (data.type && !TYPES.has(data.type)) err(file, `unknown type "${data.type}"`)
    if (data.status && !STATUSES.has(data.status)) err(file, `unknown status "${data.status}"`)
    if (data.area && !AREAS.has(data.area)) err(file, `unknown area "${data.area}"`)
    if (data.tags && !data.tags.includes('nexus')) err(file, 'tags must include "nexus"')
    if (data.icon && !conceptForEmoji(String(data.icon))) err(file, `icon ${data.icon} is not in the registry`)
    for (const r of data.related ?? []) {
      const m = String(r).match(/^\[\[([^\]|#]+)/)
      if (!m) { err(file, `related entry is not a wikilink: ${r}`); continue }
      if (!fs.existsSync(path.join(DOCS, `${m[1]}.md`))) err(file, `related wikilink not found: ${r}`)
    }
  }

  // ── Heading icons (outside code fences) ────────────────────────────
  let inFence = false
  let inSlides = false // slide headlines in decks are content, not page headings
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    if (/<!--\s*slide:/.test(line)) inSlides = true
    const h = line.match(/^(#{1,2}) (.*)$/)
    if (!h || inSlides) continue
    const lead = headingLeadEmoji(h[2])
    if (!lead) err(file, `heading has no registered icon: "${h[0]}"`)
    else if (!conceptForEmoji(lead)) err(file, `heading icon ${lead} is not in the registry: "${h[0]}"`)
  }

  // ── Relative links and images ──────────────────────────────────────
  inFence = false
  for (const line of body.split('\n')) {
    if (/^```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    for (const m of line.replace(/`[^`]*`/g, '').matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = m[1]
      if (/^(https?:|mailto:)/.test(href)) continue
      if (href.startsWith('#')) {
        if (!anchorsOf(file).has(decodeURIComponent(href.slice(1)))) err(file, `broken anchor: ${href}`)
        continue
      }
      const [pathPart, hash] = href.split('#')
      const target = path.resolve(path.dirname(file), decodeURI(pathPart))
      if (fs.existsSync(target)) {
        if (hash && target.endsWith('.md') && !anchorsOf(target).has(decodeURIComponent(hash))) err(file, `broken anchor: ${href}`)
        continue
      }
      if (m[0].startsWith('!') && file.includes(`${path.sep}user-guide${path.sep}`)) continue // reported as missing screenshots
      if (isTemplate(file)) continue
      err(file, `broken link: ${href}`)
    }
  }
}

// ── Builds ─────────────────────────────────────────────────────────────
try {
  const g = buildGuide()
  if (g.missing.length) warnings.push(`staff guide: ${g.missing.length} screenshots still to add:\n  - ${g.missing.join('\n  - ')}`)
} catch (e) { errors.push(`guide build failed: ${e.message}`) }
const decks = path.join(DOCS, 'presentation', 'decks')
for (const f of fs.readdirSync(decks).filter((x) => x.endsWith('.md'))) {
  try { buildDeck(path.join(decks, f)) } catch (e) { errors.push(`deck ${f} failed: ${e.message}`) }
}

for (const w of warnings) console.log(`note  ${w}`)
if (errors.length) {
  console.error(`\n${errors.length} documentation error(s):\n- ${errors.join('\n- ')}`)
  process.exit(1)
}
console.log(`docs check passed: ${walk(DOCS).length} pages`)
