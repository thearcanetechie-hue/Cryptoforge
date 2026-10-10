# CryptoForge Design Sync (Figma plugin)

A local development plugin that builds the CryptoForge UI in Figma from the values in `frontend/src`, and exports your edited design back as JSON so the code can be updated to match.

## Install (once)

1. Open the **Figma desktop app**. Development plugins don't run in the browser.
2. Open the file **CryptoForge — UI**.
3. Go to **Menu → Plugins → Development → Import plugin from manifest…** and choose `design/figma-plugin/manifest.json`.

## Commands

**Plugins → Development → CryptoForge Design Sync**

- **Build / complete the design.** Creates the pages, variables, text styles, icons, components and screens. Anything that already exists (matched by name) is left alone, so you can run it again safely. To regenerate a screen or component, delete it and run this again.
- **Export design for Claude.** Collects every page's structure, the variables, the text styles, the text on 📝 Change Notes, and a PNG of each screen. Save the file as `design/cryptoforge-design.json`.

## Screens built

| Row | Screens |
|---|---|
| Desktop — Light | Home · Encode (result) · Encode (file mode) · Decode (result) · Decode (wrong key) |
| Lessons | Learn to Encode · Learn to Decode (first lesson expanded) |
| Desktop — Dark | Home · Encode (result) |
| Mobile (375) | Home · Encode |
