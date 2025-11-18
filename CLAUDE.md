# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HN Custom Skin is a Chrome Extension (Manifest V3) that customizes Hacker News appearance. Built with Vite + TypeScript, it uses a multi-entry build system to compile separate content scripts, background service workers, and options pages.

## Build System Architecture

### Vite Multi-Entry Configuration

The project uses a custom Vite setup (`vite.config.ts`) with three distinct entry points:

1. **Content Script** (`src/content/main.ts` → `dist/content.js`)
2. **Background Service Worker** (`src/background/main.ts` → `dist/background.js`)
3. **Options Page** (`src/options/index.html` → `dist/options.html` + `dist/options.js`)

**Critical Build Behavior:**
- The `copy-manifest-and-fix-paths` plugin runs after bundling to:
  - Copy `manifest.json` from root to `dist/`
  - Move nested `dist/src/options/index.html` to `dist/options.html` (flat structure required by Chrome)
  - Clean up the temporary `dist/src/` directory

**Why this matters:** The manifest references flat paths (`content.js`, `background.js`, `options.html`). Vite's default HTML handling creates nested paths, so the custom plugin post-processes the output.

### Development Commands

```bash
# Install dependencies
npm install

# Production build (required before loading in Chrome)
npm run build

# Watch mode for development (rebuilds on file changes)
npm run dev

# After changes, reload extension in chrome://extensions/
```

## Chrome Extension Structure

### Manifest V3 Entry Points

The `manifest.json` defines three execution contexts:

1. **Content Scripts** - Run in the context of https://news.ycombinator.com pages
   - Files: `content.js`
   - Timing: `document_idle` (after DOM ready)
   - Access: Can manipulate page DOM, limited Chrome APIs

2. **Background Service Worker** - Persistent event handler
   - Files: `background.js` (ES module)
   - Access: Full Chrome extension APIs, no DOM access
   - Use cases: API calls, storage sync, message handling

3. **Options Page** - Settings UI accessible via `chrome://extensions`
   - Files: `options.html`, `options.js`
   - Access: Standard web page + Chrome storage APIs

### Communication Patterns (Future Implementation)

When implementing profile service integration:
- Content script requests data via `chrome.runtime.sendMessage()`
- Background worker handles API calls and responds
- Use `chrome.storage.sync` for settings persistence across devices

## Code Organization

### Content Script (`src/content/main.ts`)

The content script follows this initialization pattern:

```typescript
// 1. Define CSS injection utilities
function injectCss(cssText: string): void { ... }

// 2. Prepare demo/default CSS
const demoCss = `...`;

// 3. Define UI injection functions
function injectMenu(): void { ... }

// 4. Initialize with DOM-ready check
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
```

**Key architectural points:**
- CSS is injected via `<style>` tags appended to `document.head`
- Menu elements target HN's `.pagetop` selector
- TODO comments mark future integration points for profile service

### Background Worker (`src/background/main.ts`)

Currently minimal - logs installation events. Future expansion points:
- `chrome.runtime.onMessage` - Handle content script requests
- `chrome.alarms` - Periodic sync tasks
- Fetch API - Retrieve user CSS from profile service

## Development Workflow

### Making Changes

1. Edit source files in `src/`
2. Run `npm run dev` (watch mode) or `npm run build`
3. Go to `chrome://extensions/` and click reload on "HN Custom Skin"
4. Visit https://news.ycombinator.com to test changes
5. Check browser console and extension service worker console for logs

### Testing in Chrome

**Load unpacked extension:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode" toggle (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

**Debug content scripts:** Open DevTools on HN page
**Debug background worker:** Click "service worker" link in extension card
**Debug options page:** Right-click extension → Options → Open DevTools

## Git Workflow

- Always run `npm run build` before committing to verify compilation
- Commit completed features (not work-in-progress partial changes)
- The `dist/` folder is gitignored - never commit build artifacts

## Future Architecture Notes

### Planned Profile Service Integration

When implementing user CSS sync:

1. **Content script** sends message to background worker requesting user's CSS
2. **Background worker** fetches CSS from API endpoint
3. **Background worker** caches result in `chrome.storage.sync`
4. **Content script** receives CSS and injects via existing `injectCss()` function

### Storage Strategy

Use `chrome.storage.sync` for:
- User preferences (theme selections, custom CSS)
- Syncs across user's Chrome instances automatically (100KB limit)

Use `chrome.storage.local` for:
- Cached API responses
- Large data (no sync, unlimited storage)

## TypeScript Configuration

`tsconfig.json` is configured with:
- `types: ["chrome", "vite/client"]` - Chrome extension APIs + Vite HMR types
- `moduleResolution: "bundler"` - Optimized for Vite bundling
- `noEmit: true` - Vite handles compilation, TypeScript only for checking

The build process uses Vite's esbuild-based TypeScript compilation (faster than tsc).
