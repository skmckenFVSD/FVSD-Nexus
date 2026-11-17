#!/usr/bin/env node
// Build the SharePoint-ready staff guide from docs/user-guide/*.md
//
//   README.md front matter `guide:`  → title, launch URL, chapter order
//   each chapter                      → one navigation group
//   each `##` heading                 → one topic (its first paragraph is the intro)
//   `> [!NOTE]` style callouts, ordered-list steps, tables and screenshots
//
// Output: publish/user-guide/index.html + publish/user-guide/assets/
// Upload both together. No external fonts, scripts or libraries.

import fs from 'node:fs'
import path from 'node:path'
import * as yaml from 'js-yaml'
import { Marked } from 'marked'
import {
  DOCS, PUBLISH, ROOT, brandCss, copyFile, escapeHtml, icon, readDoc,
  renderPills, slugify, splitIcon, writeFile,
} from './lib/common.mjs'

const GUIDE = path.join(DOCS, 'user-guide')
const OUT = path.join(PUBLISH, 'user-guide')
const css = fs.readFileSync(new URL('./templates/guide.css', import.meta.url), 'utf8')

const md = new Marked({ gfm: true, breaks: false })

const CALLOUTS = {
  NOTE: { cls: 'note', label: 'Note', icon: 'info' },
  TIP: { cls: 'tip', label: 'Tip', icon: 'lightbulb' },
  IMPORTANT: { cls: 'important', label: 'Important', icon: 'message-square-warning' },
  WARNING: { cls: 'warning', label: 'Warning', icon: 'triangle-alert' },
  CAUTION: { cls: 'caution', label: 'Caution', icon: 'octagon-alert' },
}

export function buildGuide() {
  const { data: readme } = readDoc(path.join(GUIDE, 'README.md'))
  const cfg = readme.guide
  const shotMap = yaml.load(fs.readFileSync(path.join(GUIDE, 'assets', 'screenshots.yml'), 'utf8'))?.screenshots ?? []
  const shots = new Map(shotMap.map((s) => [s.file, s]))
  const missing = []
  const usedIds = new Set()

  fs.rmSync(OUT, { recursive: true, force: true })

  // ── Read chapters and split into topics ─────────────────────────────
  const chapters = cfg.chapters.map((file) => {
    const { data, body } = readDoc(path.join(GUIDE, file))
    const tokens = md.lexer(body)
    const topics = []
    let current = null
    for (const tok of tokens) {
      if (tok.type === 'heading' && tok.depth === 2) {
        const { concept, text } = splitIcon(tok.text)
        let id = slugify(text)
        while (usedIds.has(id)) id += '-2'
        usedIds.add(id)
        current = { id, title: text, concept, tokens: [], file }
        topics.push(current)
        continue
      }
      if (!current) continue // H1, breadcrumb and anything before the first topic
      current.tokens.push(tok)
    }
    // Drop the trailing rule and footer line from the last topic.
    const last = topics.at(-1)
    while (last && last.tokens.length) {
      const t = last.tokens.at(-1)
      if (t.type === 'space' || t.type === 'hr' || (t.type === 'paragraph' && /^\*.*FVSD Nexus.*\*$/.test(t.text.trim()))) last.tokens.pop()
      else break
    }
    const chapterIcon = splitIcon(data.icon ?? '').concept
    return { file, label: data.chapter ?? data.title, concept: chapterIcon, topics, updated: String(data.updated instanceof Date ? data.updated.toISOString().slice(0, 10) : data.updated ?? '') }
  })

  // Map cross-chapter markdown links to in-page anchors.
  const firstTopic = new Map(chapters.map((c) => [c.file, c.topics[0]?.id]))
  const topicIds = new Set(chapters.flatMap((c) => c.topics.map((t) => t.id)))
  function fixLinks(html) {
    return html.replace(/href="([^"]+)"/g, (all, href) => {
      if (/^(https?:|mailto:|#)/.test(href)) return all
      const [file, hash] = href.split('#')
      const base = path.basename(file)
      if (hash !== undefined) {
        const id = hash.replace(/^-+/, '')
        if (topicIds.has(id)) return `href="#${id}"`
      }
      if (firstTopic.has(base)) return `href="#${firstTopic.get(base)}"`
      throw new Error(`Guide link points outside the guide: ${href}`)
    })
  }

  // ── Block rendering ─────────────────────────────────────────────────
  function figure(img) {
    const file = img.href
    const caption = img.title || img.text
    const src = path.join(GUIDE, file)
    if (!fs.existsSync(src)) {
      missing.push(file)
      return `<figure class="placeholder"><div class="shot-missing">${icon('image', { size: 30 })}<div><strong>Screenshot to add</strong>${escapeHtml(img.text)}<br><code>${escapeHtml(file)}</code></div></div><figcaption>${md.parseInline(caption)}</figcaption></figure>`
    }
    copyFile(src, path.join(OUT, file))
    const markers = shots.get(file)?.markers ?? []
    const dots = markers.map(([n, x, y]) => `<span class="image-marker" style="--x:${x}%;--y:${y}%" aria-hidden="true">${n}</span>`).join('')
    const key = markers.length
      ? `<ol class="marker-key">${markers.map(([n, , , text]) => `<li><span>${n}</span>${md.parseInline(text)}</li>`).join('')}</ol>`
      : ''
    const label = escapeHtml(`Enlarge screenshot: ${caption}`)
    return `<figure><a class="screenshot" href="${escapeHtml(file)}" target="_blank" rel="noopener" data-enlarge aria-label="${label}"><span class="screenshot-stage"><img src="${escapeHtml(file)}" alt="${escapeHtml(img.text)}" loading="lazy" decoding="async">${dots}</span><span class="zoom-label">Enlarge screenshot <span aria-hidden="true">↗</span></span></a><figcaption>${md.parseInline(caption)}</figcaption>${key}</figure>`
  }

  function block(tok) {
    if (tok.type === 'space' || tok.type === 'hr') return ''
    if (tok.type === 'heading') {
      const { concept, text } = splitIcon(tok.text)
      const ico = concept ? icon(concept.key, { size: 19 }) : ''
      return `<h${tok.depth}>${ico}${md.parseInline(text)}</h${tok.depth}>`
    }
    if (tok.type === 'paragraph' && tok.tokens.length === 1 && tok.tokens[0].type === 'image') return figure(tok.tokens[0])
    if (tok.type === 'blockquote') {
      const m = tok.text.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/)
      if (m) {
        const c = CALLOUTS[m[1]]
        const inner = md.parse(tok.text.slice(m[0].length))
        return `<div class="callout ${c.cls}" role="note">${icon(c.icon, { size: 20 })}<div><span class="label">${c.label}</span>${inner}</div></div>`
      }
    }
    if (tok.type === 'list' && tok.ordered) {
      const items = tok.items.map((item) => `<li>${item.tokens.map((t) => (t.type === 'text' ? md.parseInline(t.text) : block(t))).join('')}</li>`)
      const start = tok.start && tok.start !== 1 ? ` start="${tok.start}" style="counter-reset:step ${tok.start - 1}"` : ''
      return `<ol class="steps"${start}>${items.join('')}</ol>`
    }
    if (tok.type === 'table') {
      const tokens = [tok]; tokens.links = {}
      return `<div class="table-scroll">${md.parser(tokens).replace('<table>', '<table>')}</div>`
    }
    const tokens = [tok]; tokens.links = {}
    return md.parser(tokens)
  }

  function topicHtml(chapter, topic) {
    const body = topic.tokens.filter((t) => t.type !== 'space')
    const introTok = body[0]?.type === 'paragraph' && !(introTokIsImage(body[0])) ? body.shift() : null
    const intro = introTok ? `<p class="intro">${md.parseInline(introTok.text)}</p>` : ''
    const kickerIcon = chapter.concept ? icon(chapter.concept.key, { size: 14 }) : ''
    const titleIcon = topic.concept ? icon(topic.concept.key, { size: 26 }) : ''
    const content = fixLinks(renderPills(body.map(block).join('\n')))
    return `
<!-- TOPIC ${escapeHtml(topic.id)} · source docs/user-guide/${chapter.file} -->
<article class="topic" id="${topic.id}" data-title="${escapeHtml(topic.title)}"><header class="topic-head"><p class="chapter-kicker">${kickerIcon}${escapeHtml(chapter.label)}</p><h2>${titleIcon}${md.parseInline(topic.title)}</h2>${fixLinks(intro)}</header><div class="topic-body">
${content}
</div></article>`
  }
  const introTokIsImage = (t) => t.tokens?.length === 1 && t.tokens[0].type === 'image'

  const nav = chapters.map((c) => `<div class="nav-group"><p>${c.concept ? icon(c.concept.key, { size: 15 }) : ''}${escapeHtml(c.label)}</p>${c.topics.map((t) => `<a href="#${t.id}" data-topic="${t.id}">${escapeHtml(t.title)}</a>`).join('')}</div>`).join('')
  const search = `<form class="search" role="search" hidden><label>Find a topic in this guide</label><div class="search-line"><input type="search" placeholder="${escapeHtml(cfg.search_placeholder ?? 'Search')}" aria-label="Find a topic in this guide" autocomplete="off"><button type="button" data-clear>Clear</button></div><p class="search-output" aria-live="polite"></p></form>`
  const launch = (cls, label) => `<a class="${cls}" href="${escapeHtml(cfg.launch_url)}" target="_blank" rel="noopener">${label} <span aria-hidden="true">↗</span><span class="visually-hidden"> (opens in a new tab)</span></a>`
  const topics = chapters.map((c) => c.topics.map((t) => topicHtml(c, t)).join('\n')).join('\n')

  // Brand assets travel with the guide.
  const brand = path.join(ROOT, 'assets', 'brand', 'fvsd-nexus')
  copyFile(path.join(brand, 'FVSDNexus-512.png'), path.join(OUT, 'assets', 'fvsd-nexus-logo.png'))
  copyFile(path.join(brand, 'FVSDNexus-48.png'), path.join(OUT, 'assets', 'favicon.png'))

  const built = chapters.map((c) => c.updated).sort().at(-1)
  const html = `<!doctype html>
<html lang="en-CA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(cfg.title)} · Staff user guide</title>
<meta name="description" content="${escapeHtml(readme.description)}">
<meta name="generator" content="FVSD Nexus documentation build — source: docs/user-guide">
<link rel="icon" type="image/png" href="assets/favicon.png">
<style>
${brandCss}
${css}</style></head>
<body>
<a class="skip" href="#guide-content">Skip to guide content</a>
<header class="topbar"><div class="topbar-inner"><a class="wordmark" href="#${chapters[0].topics[0].id}"><img src="assets/fvsd-nexus-logo.png" alt="" width="34" height="34"><span>${escapeHtml(cfg.title)}<small>${escapeHtml(cfg.wordmark_sub)}</small></span></a><div class="top-actions">${cfg.draft ? '<span class="draft">WORKING DRAFT</span>' : ''}${launch('launch', escapeHtml(cfg.launch_label ?? 'Open app'))}</div></div></header>
<div class="layout"><aside class="sidebar" aria-label="Guide navigation"><h2>In this guide</h2>${search}<nav aria-label="Topics">${nav}</nav></aside>
<main id="guide-content"><div class="hero"><div><p class="eyebrow">${escapeHtml(cfg.eyebrow)}</p><h1>${escapeHtml(cfg.title)}</h1><p class="subtitle">${escapeHtml(cfg.subtitle)}</p>${launch('launch', escapeHtml(cfg.launch_label ?? 'Open app'))}</div><img src="assets/fvsd-nexus-logo.png" alt="FVSD Nexus" width="512" height="512"></div>
${cfg.status_note ? `<p class="review-note">${icon('pin', { size: 16 })}${escapeHtml(cfg.status_note)}</p>` : ''}
<details class="mobile-nav"><summary>In this guide and topic search</summary>${search}<nav aria-label="Topics on smaller screens">${nav}</nav></details>
<p class="empty" hidden>No topics match your search. Try a shorter word, or select Clear.</p>
${topics}
<footer class="guide-foot"><span>Fort Vermilion School Division · FVSD Nexus staff user guide</span><span>Content updated ${built} · generated from docs/user-guide</span></footer>
</main></div>
<dialog class="image-dialog" aria-labelledby="image-title"><div class="dialog-bar"><h2 id="image-title">Screenshot</h2><button type="button" data-close-image>Close</button></div><div class="dialog-canvas"></div></dialog>
<script>
(()=>{'use strict';
 const topics=[...document.querySelectorAll('.topic')],forms=[...document.querySelectorAll('.search')];
 const searchData=topics.map(t=>({el:t,text:(t.dataset.title+' '+t.textContent).toLocaleLowerCase()}));
 function filter(value){const q=value.trim().toLocaleLowerCase();let count=0;searchData.forEach(t=>{const show=!q||t.text.includes(q);t.el.hidden=!show;if(show)count++});
  document.querySelectorAll('[data-topic]').forEach(a=>{a.hidden=document.getElementById(a.dataset.topic).hidden});
  document.querySelectorAll('.nav-group').forEach(g=>{g.hidden=![...g.querySelectorAll('a')].some(a=>!a.hidden)});
  forms.forEach(f=>{f.querySelector('input').value=value;f.querySelector('.search-output').textContent=q?count+' matching topic'+(count===1?'':'s'):''});
  document.querySelector('.empty').hidden=count!==0}
 forms.forEach(f=>{f.hidden=false;f.addEventListener('submit',e=>e.preventDefault());f.querySelector('input').addEventListener('input',e=>filter(e.target.value));f.querySelector('[data-clear]').addEventListener('click',()=>{filter('');f.querySelector('input').focus()})});
 document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',()=>{const target=document.getElementById(a.getAttribute('href').slice(1));if(target&&target.hidden)filter('');if(a.closest('.mobile-nav nav'))document.querySelector('.mobile-nav').open=false}));
 function exposeHash(){const target=document.getElementById(location.hash.slice(1));const article=target&&target.closest('.topic');if(article&&article.hidden)filter('')}addEventListener('hashchange',exposeHash);exposeHash();
 const dialog=document.querySelector('.image-dialog');let returnFocus=null;
 if(typeof dialog.showModal==='function'){document.querySelectorAll('[data-enlarge]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();returnFocus=link;const stage=link.querySelector('.screenshot-stage').cloneNode(true);stage.classList.add('dialog-image');stage.querySelector('img').loading='eager';dialog.querySelector('.dialog-canvas').replaceChildren(stage);dialog.querySelector('#image-title').textContent=link.closest('figure').querySelector('figcaption').textContent;dialog.showModal()}));
  dialog.querySelector('[data-close-image]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});dialog.addEventListener('close',()=>{if(returnFocus)returnFocus.focus()})}
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{const found=entries.filter(x=>x.isIntersecting&&!x.target.hidden).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!found)return;document.querySelectorAll('[data-topic]').forEach(a=>{if(a.dataset.topic===found.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})},{rootMargin:'-90px 0px -55% 0px',threshold:0});topics.forEach(t=>observer.observe(t))}
})();
</script></body></html>
`
  writeFile(path.join(OUT, 'index.html'), html)
  writeFile(path.join(OUT, 'README.md'), uploadReadme(missing))
  return { topics: chapters.reduce((n, c) => n + c.topics.length, 0), chapters: chapters.length, missing }
}

function uploadReadme(missing) {
  return `# FVSD Nexus staff guide — SharePoint package

Generated from \`docs/user-guide/\`. Do not edit these files by hand; edit the markdown and rebuild with \`npm run docs:guide\` in \`tools/docs/\`.

## Upload

1. Keep \`index.html\` and its \`assets\` folder together.
2. Upload \`index.html\` to the confirmed SharePoint HTML hosting location.
3. Upload the \`assets\` folder into the same location, keeping its name and file names.
4. Open the hosted guide and check a screenshot, its enlargement view, navigation, search and the **Open FVSD Nexus** button.

The guide is static HTML with no external fonts, scripts or libraries. If the host blocks JavaScript, the content, chapter links and screenshot links still work; only search and the enlargement view are lost.

Only publish \`index.html\` and \`assets/\`. This README stays with the source.
${missing.length ? `\n## Screenshots still to add\n\n${missing.map((m) => `- \`${m}\``).join('\n')}\n` : ''}`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const r = buildGuide()
  console.log(`guide ${r.chapters} chapters, ${r.topics} topics → publish/user-guide/index.html`)
  if (r.missing.length) console.log(`      ${r.missing.length} screenshots still to add (placeholders shown)`)
}
