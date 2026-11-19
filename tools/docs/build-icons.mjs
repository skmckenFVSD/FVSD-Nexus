#!/usr/bin/env node
// Regenerate the registry table in docs/standards/iconography.md from
// docs/standards/icon-registry.yml (extract, don't retype).

import fs from 'node:fs'
import path from 'node:path'
import { DOCS, registry } from './lib/common.mjs'

const file = path.join(DOCS, 'standards', 'iconography.md')
const rows = Object.entries(registry.concepts).map(([key, c]) =>
  `| ${c.emoji} | \`${key}\` | [\`${c.lucide}\`](https://lucide.dev/icons/${c.lucide}) | ${c.use} |`)
const table = ['| Emoji | Concept | Lucide icon (HTML) | Use for |', '|---|---|---|---|', ...rows].join('\n')

const src = fs.readFileSync(file, 'utf8')
const next = src.replace(/<!-- icon-table:start -->[\s\S]*?<!-- icon-table:end -->/, `<!-- icon-table:start -->\n${table}\n<!-- icon-table:end -->`)
if (next !== src) fs.writeFileSync(file, next)
console.log(`icons ${rows.length} concepts → docs/standards/iconography.md`)
