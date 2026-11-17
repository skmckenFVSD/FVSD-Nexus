---
title: Contributing to the documentation
description: How to change FVSD Nexus documentation, rebuild the staff guide and presentation, run the checks and use the Obsidian vault.
type: contributing
status: current
icon: 📝
area: docs
audience: [maintainers, developers]
owner: Scott McKenzie
tags: [nexus, nexus/standards]
aliases: [Contributing, Docs workflow]
updated: 2026-11-17
related: ["[[standards/README]]", "[[standards/front-matter]]", "[[user-guide/README]]", "[[presentation/README]]"]
---

# 📝 Contributing to the documentation

[🏠 Home](README.md) › Contributing

**Status:** 🟢 Current workflow for the `documentation` branch.

## 🎯 The rule

> Update the documentation in the same change that alters the behaviour, label, rule or premise it describes.

A pull request that changes a screen updates the matching [staff guide](user-guide/README.md) chapter. A pull request that changes an architectural premise updates the canonical page and, if material, adds an [ADR](decisions/adr/README.md).

## 🗺️ Branch model

| Branch | Holds | Flows to |
|---|---|---|
| `main` | The application, infrastructure and the documentation as released | GitHub Pages, Azure deployments |
| `documentation` | The documentation layer: `docs/`, `tools/docs/`, `publish/`, and later scripts, skills and agents that maintain it | Merged into `main` by pull request |

Work on documentation in short-lived branches from `documentation` (for example `docs/assessments-guide`) and open pull requests into `documentation`. Merge `main` into `documentation` regularly so the docs can be checked against current code.

## 🔄 Workflow

1. **Edit the markdown** in `docs/`. Keep the front matter current, especially `status` and `updated` (see [front matter](standards/front-matter.md)).
2. **Use the standards**: [brand and voice](standards/brand-and-voice.md), [iconography](standards/iconography.md), [diagrams](standards/diagrams.md), and the [templates](standards/templates/) for new pages.
3. **Rebuild** what you touched:

   ```text
   cd tools/docs
   npm ci                  # first time only
   npm run docs:build      # staff guide + every deck + icon table
   npm run docs:check      # front matter, icons, links, screenshots
   ```

4. **Review the output** in `publish/`: open `publish/user-guide/index.html` and each deck in a browser.
5. **Commit source and output together.** `publish/` is committed so the SharePoint package and the repository site always match the source in the same commit.

## 🧪 What `docs:check` enforces

| Check | Fails when |
|---|---|
| Front matter | A page has no front matter, a required property is missing, or `type`, `status` or `area` has an unknown value |
| Icons | An H1 or H2 starts with an emoji that is not in the [icon registry](standards/icon-registry.yml), or an H1/H2 has no icon |
| Links | A relative link or image points to a file that does not exist |
| Builds | The guide or a deck fails to build |
| Screenshots | Reported (not failed): staff-guide screenshots that are still placeholders |

## 🗃️ Obsidian

Open the `docs/` folder as a vault. Shared settings in `docs/.obsidian/` keep links as relative markdown paths and put new attachments beside the note; personal workspace state is git-ignored. Front matter appears as Properties; `related` wikilinks feed the graph view. Templates for new pages are in [`standards/templates/`](standards/templates/) and are set as the Obsidian templates folder.

## 🔐 Never commit

- Student names, ASNs, birth dates, emails, or screenshots that show them. Use obfuscated display mode.
- Credentials, tokens, certificates, connection strings or tenant secrets.
- Generated files edited by hand. Edit the source and rebuild.

---

*🏫 FVSD Nexus · Fort Vermilion School Division · Documentation*
