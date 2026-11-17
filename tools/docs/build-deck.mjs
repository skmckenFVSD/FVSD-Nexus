#!/usr/bin/env node
// Build presentation decks from docs/presentation/decks/*.md
//
// A deck is ordinary markdown: slides are separated by horizontal rules and an
// HTML comment carries the layout, e.g.
//   <!-- slide: layout=statement group="Opening" nav="Who owns this number?" lead -->
// Component comments (cards, truth, stats, flow, timeline, list, catalog, byline)
// sit directly above the block they style. See docs/presentation/README.md.

import fs from 'node:fs'
import path from 'node:path'
import {
  DOCS, PUBLISH, ROOT, brandCss, copyFile, escapeHtml, inline, marked,
  readDoc, conceptForEmoji, writeFile,
} from './lib/common.mjs'

const TEMPLATE = fs.readFileSync(new URL('./templates/deck.html', import.meta.url), 'utf8')
const DECKS = path.join(DOCS, 'presentation', 'decks')

// ── Directive parsing ───────────────────────────────────────────────────
function parseDirective(html) {
  const m = html.trim().match(/^<!--\s*([a-z]+)(?::)?\s*([\s\S]*?)\s*-->$/i)
  if (!m) return null
  const attrs = {}
  for (const a of m[2].matchAll(/([a-z_]+)(?:=(?:"([^"]*)"|([^\s"]+)))?/gi)) {
    attrs[a[1]] = a[2] ?? a[3] ?? true
  }
  return { name: m[1].toLowerCase(), attrs }
}

// ── Item grammar helpers ────────────────────────────────────────────────
const STATUS_EMOJI = /^(🟢|🔵|🟠|⚪)\s*\*\*([^*]+)\*\*\s*/u
function takePills(text) {
  const pills = []
  let rest = text
  let m
  while ((m = rest.match(STATUS_EMOJI))) {
    pills.push(inline(m[0].trim()))
    rest = rest.slice(m[0].length)
  }
  return { pills: pills.join(''), rest }
}
function takeStrong(text) {
  const m = text.match(/^\*\*(.+?)\*\*\s*/)
  return m ? { strong: m[1], rest: text.slice(m[0].length) } : { strong: null, rest: text }
}
function splitDash(text) {
  const i = text.indexOf(' — ')
  return i === -1 ? [text.trim(), ''] : [text.slice(0, i).trim(), text.slice(i + 3).trim()]
}
const itemText = (item) => item.text.replace(/^\[[ xX]\]\s+/, '').trim()

// ── Component renderers ─────────────────────────────────────────────────
const components = {
  cards(list, a) {
    const edge = a.edge ? ` ${a.edge}-edge` : ''
    const cards = list.items.map((item, i) => {
      const { pills, rest } = takePills(itemText(item))
      const { strong, rest: after } = takeStrong(rest)
      const body = after.replace(/^—\s*/, '')
      let head
      if (a.title === 'h3') {
        const num = a.number ? `<div class="k">${String(i + 1).padStart(2, '0')}</div>` : ''
        head = `${num}${pills ? `\n        ${pills}` : ''}\n        <h3>${inline(strong ?? '')}</h3>`
      } else {
        head = `${pills}<div class="k">${inline(strong ?? '')}</div>`
      }
      return `      <div class="card${edge}">${head}<p>${inline(body)}</p></div>`
    })
    return `    <div class="cols${a.cols === 'two' ? ' two' : ''}">\n${cards.join('\n')}\n    </div>`
  },

  truth(list) {
    const badgeKind = { record: 'b-record', calculation: 'b-calc', profiles: 'b-id' }
    const cards = list.items.map((item) => {
      let text = itemText(item)
      const emoji = text.match(/^(\p{Extended_Pictographic}️?)\s*/u)
      const concept = emoji ? conceptForEmoji(emoji[1]) : null
      if (emoji) text = text.slice(emoji[0].length)
      const { strong: badge, rest } = takeStrong(text)
      const q = rest.replace(/^—\s*/, '').match(/^\*(.+?)\*\s*/)
      const afterQ = q ? rest.replace(/^—\s*/, '').slice(q[0].length) : rest
      const { strong: answer, rest: desc } = takeStrong(afterQ)
      return [
        '      <div class="card">',
        `        <span class="badge ${badgeKind[concept?.key] ?? 'b-record'}">${inline(badge)}</span>`,
        `        <div class="q">${inline(q?.[1] ?? '')}</div>`,
        `        <div class="a">${inline(answer ?? '')}</div>`,
        `        <p class="d">${inline(desc)}</p>`,
        '      </div>',
      ].join('\n')
    })
    return `    <div class="truth">\n${cards.join('\n')}\n    </div>`
  },

  stats(list) {
    const stats = list.items.map((item) => {
      const { strong, rest } = takeStrong(itemText(item))
      return `      <div class="stat"><div class="v">${inline(strong)}</div><div class="l">${inline(rest)}</div></div>`
    })
    return `    <div class="stats">\n${stats.join('\n')}\n    </div>`
  },

  flow(list) {
    const steps = list.items.map((item) => {
      const { strong, rest } = takeStrong(itemText(item))
      const [n, h] = strong.split(' · ')
      return `      <div class="step"><div class="n">${escapeHtml(n.toUpperCase())}</div><h3>${inline(h ?? '')}</h3><p>${inline(rest.replace(/^—\s*/, ''))}</p></div>`
    })
    return `    <div class="flow">\n${steps.join('\n')}\n    </div>`
  },

  timeline(list) {
    const evs = list.items.map((item) => {
      const { strong, rest } = takeStrong(itemText(item))
      return `      <div class="ev${item.checked ? ' done' : ''}"><div class="when">${inline(strong)}</div><div class="what">${inline(rest.replace(/^—\s*/, ''))}</div></div>`
    })
    return `    <div class="tl">\n${evs.join('\n')}\n    </div>`
  },

  list(list, a) {
    const cls = a.mint ? 'clean mint' : 'clean'
    return `    <ul class="${cls}">\n${list.items.map((i) => `      <li>${inline(itemText(i))}</li>`).join('\n')}\n    </ul>`
  },
}

function renderTable(t) {
  const cell = (c) => inline(c.text)
  const head = t.header.map((h) => `<th>${cell(h)}</th>`).join('')
  const rows = t.rows.map((r) => `        <tr>${r.map((c) => `<td>${cell(c)}</td>`).join('')}</tr>`).join('\n')
  return `    <table class="captable">\n      <thead><tr>${head}</tr></thead>\n      <tbody>\n${rows}\n      </tbody>\n    </table>`
}

// ── Slide rendering ─────────────────────────────────────────────────────
function renderSlide(source, index) {
  const tokens = marked.lexer(source)
  let slide = null
  let pending = null
  let leadUsed = false
  let afterHeading = false
  const out = []

  for (const tok of tokens) {
    if (tok.type === 'space') continue
    if (tok.type === 'html') {
      const d = parseDirective(tok.text)
      if (!d) { out.push(tok.text.trim()); continue }
      if (d.name === 'slide') slide = d.attrs
      else pending = d
      continue
    }
    if (!slide) throw new Error(`Slide ${index + 1} has content before its <!-- slide: --> comment`)
    const layout = slide.layout ?? 'content'

    if (tok.type === 'heading') {
      const text = inline(tok.text)
      if (tok.depth === 1) out.push(`${layout === 'title' ? '    <div class="rule"></div>\n' : ''}    <h1>${text}</h1>`)
      else if (tok.depth === 2) out.push(`    <h2>${text}</h2>`)
      else if (tok.depth === 3) out.push(`    <h3>${text}</h3>`)
      else out.push(`    <p class="eyebrow">${text}</p>`)
      afterHeading = tok.depth <= 2
      continue
    }

    if (tok.type === 'blockquote') {
      const text = tok.tokens.map((t) => inline(t.text ?? '')).join(' ')
      out.push(`    <p class="pull">${text}</p>`)
      continue
    }

    if (tok.type === 'paragraph') {
      if (pending?.name === 'byline') {
        const lines = tok.text.split(/\\\n|\n/).map((l) => l.trim()).filter(Boolean)
        const [first, ...rest] = lines
        const name = first.replace(/^\*\*(.+)\*\*$/, '$1')
        const tail = rest.map((l) => inline(l)
          .replace(/<em>(.*?)<\/em>/g, '<span class="accent">$1</span>')
          .replace(/ · (?=<span class="accent">)/g, ' &nbsp;·&nbsp; ')).join('<br>\n      ')
        out.push(`    <div class="byline">\n      <b>${escapeHtml(name)}</b>\n      ${tail}\n    </div>`)
      } else if (pending?.name === 'catalog') {
        const html = inline(tok.text).replace(/<(\/?)strong>/g, '<$1b>')
        out.push(`    <div class="catalog">\n      <span class="ctag">${escapeHtml(pending.attrs.tag ?? 'Catalogue')}</span>\n      <p>${html}</p>\n    </div>`)
      } else if (layout === 'statement') {
        out.push(`    <div class="attrib">${inline(tok.text.replace(/^\*(.*)\*$/, '$1'))}</div>`)
      } else {
        const lead = (layout === 'title' || (slide.lead && !leadUsed)) && afterHeading
        if (lead) leadUsed = true
        out.push(`    <p${lead ? ' class="lead"' : ''}>${inline(tok.text)}</p>`)
      }
      pending = null
      afterHeading = false
      continue
    }

    if (tok.type === 'list') {
      const name = pending?.name ?? 'list'
      const render = components[name]
      if (!render) throw new Error(`Slide ${index + 1}: unknown component "${name}"`)
      out.push(render(tok, pending?.attrs ?? {}))
      pending = null
      afterHeading = false
      continue
    }

    if (tok.type === 'table') { out.push(renderTable(tok)); afterHeading = false; continue }
    throw new Error(`Slide ${index + 1}: unsupported markdown block "${tok.type}"`)
  }

  const layout = slide.layout && slide.layout !== 'content' ? ` ${slide.layout}` : ''
  const title = escapeHtml(slide.nav ?? `Slide ${index + 1}`)
  const group = slide.group ? ` data-group="${escapeHtml(slide.group)}"` : ''
  return `  <section class="slide${layout}" data-title="${title}"${group}>\n${out.join('\n')}\n  </section>`
}

function buildHead(data) {
  const d = data.deck ?? {}
  const title = escapeHtml(data.title)
  const site = d.site_url ?? ''
  const lines = [
    `<title>${title}</title>`,
    `<meta name="description" content="${escapeHtml(d.meta_description ?? data.description ?? '')}">`,
    `<meta name="author" content="${escapeHtml(d.presenter ?? data.owner ?? '')}">`,
    `<meta name="generator" content="FVSD Nexus documentation build — source: docs/presentation/decks">`,
    `<link rel="icon" type="image/png" sizes="48x48" href="favicon.png">`,
  ]
  if (site) {
    const image = d.social_image ? new URL(d.social_image, site).href : ''
    const desc = escapeHtml(d.meta_description ?? data.description ?? '')
    lines.push(
      '',
      '<!-- Social preview -->',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="Fort Vermilion School Division">',
      `<meta property="og:title" content="${title}">`,
      `<meta property="og:description" content="${desc}">`,
      `<meta property="og:url" content="${escapeHtml(site)}">`,
    )
    if (image) {
      lines.push(
        `<meta property="og:image" content="${escapeHtml(image)}">`,
        '<meta property="og:image:width" content="1200">',
        '<meta property="og:image:height" content="630">',
        `<meta property="og:image:alt" content="${escapeHtml(d.social_image_alt ?? data.title)}">`,
      )
    }
    lines.push(
      '<meta name="twitter:card" content="summary_large_image">',
      `<meta name="twitter:title" content="${title}">`,
      `<meta name="twitter:description" content="${escapeHtml(d.social_description ?? data.description ?? '')}">`,
    )
    if (image) lines.push(`<meta name="twitter:image" content="${escapeHtml(image)}">`)
  }
  return lines.join('\n')
}

export function buildDeck(file) {
  const { data, body } = readDoc(file)
  const segments = body.split(/^---[ \t]*$/m)
  const slides = segments.filter((s) => /<!--\s*slide:/.test(s))
  const html = TEMPLATE
    .replace('{{HEAD}}', buildHead(data))
    .replace('{{TOKENS}}', brandCss)
    .replace('{{SLIDES}}', slides.map(renderSlide).join('\n\n'))
    .replace('{{COUNT}}', String(slides.length))
    .replace('{{BRAND_NAME}}', 'FVSD Nexus')
    .replace('{{BRAND_SUB}}', escapeHtml(data.deck?.brand_sub ?? 'FVSD Nexus'))
    .replace('{{LOGO}}', 'favicon.png')

  const outDir = path.join(PUBLISH, 'presentation', data.deck?.output ?? path.basename(file, '.md'))
  writeFile(path.join(outDir, 'index.html'), html)
  for (const asset of ['favicon.png', 'social-card.png']) {
    const src = path.join(ROOT, asset)
    if (fs.existsSync(src)) copyFile(src, path.join(outDir, asset))
  }
  return { outDir, count: slides.length }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const site = process.argv.includes('--site')
  for (const file of fs.readdirSync(DECKS).filter((f) => f.endsWith('.md'))) {
    const { outDir, count } = buildDeck(path.join(DECKS, file))
    console.log(`deck  ${file} → ${path.relative(ROOT, outDir)}/index.html (${count} slides)`)
    // --site: the deck with a site_url becomes the repository site (GitHub Pages root)
    if (site && readDoc(path.join(DECKS, file)).data.deck?.site_url) {
      fs.copyFileSync(path.join(outDir, 'index.html'), path.join(ROOT, 'index.html'))
      console.log(`site  ${file} → index.html (repository root)`)
    }
  }
}
