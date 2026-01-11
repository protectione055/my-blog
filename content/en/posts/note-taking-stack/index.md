---
title: "Revisiting My Note-Taking Stack"
date: 2025-12-28T09:30:00+08:00
summary: "How I combine Obsidian, Hugo, and pen-and-paper routines to keep a calm flow of ideas."
description: "Obsidian vaults, synced Zettelkasten ideas, and a small publishing checklist that keeps my bilingual blog tidy."
tags: ["productivity", "knowledge", "tools"]
categories: ["Workflow"]
featured: true
featureImage: "/images/placeholders/featured-note-stack.jpg"
slug: "note-taking-stack"
draft: false
math: false
---

I have cycled through many knowledge systems over the past decade. The current stack keeps things lightweight and portable:

1. **Obsidian vaults** for evergreen notes. Every page starts with structured front matter so Hugo can mirror the metadata when I publish a piece.
2. **Paper notebooks** for sketches, camera settings, and trip logs. I digitize them weekly using a Fujitsu scanner and drop the PDFs into Obsidian.
3. **Hugo + Blowfish** for publishing. I export a note via a template snippet, drop it into `content/en/posts`, and run `npm run dev` for preview.

### Flow for bilingual posts

- Draft in Chinese first. I capture idioms and cultural references before translating.
- Translate into English while editing for brevity.
- Run `npm run build` to ensure both `/zh/` and `/en/` versions compile without lint warnings.

This system only works when the friction is low. Automations such as `spec:validate` (OpenSpec) and `prettier` keep files consistent so I can spend energy on the story instead of tooling.


