# HN Custom Skin

A minimal Chrome Extension (Manifest V3) that customizes Hacker News appearance using Vite and TypeScript.

## Features

- Custom CSS injection for HN styling
- Demo theme with enhanced typography and colors
- Custom menu in HN header
- MV3 compatible with modern Chrome
- Built with Vite + TypeScript

## Tech Stack

- **Vite** - Fast build system
- **TypeScript** - Type-safe development
- **Chrome Extension Manifest V3** - Modern extension platform

## Project Structure

```
hn-skin-extension/
├── manifest.json           # Extension manifest (MV3)
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── src/
    ├── content/
    │   └── main.ts         # Content script (runs on HN)
    ├── background/
    │   └── main.ts         # Background service worker
    └── options/
        ├── index.html      # Options page
        └── index.ts        # Options page logic
```

## Getting Started

### Prerequisites

- Node.js (v18 or later recommended)
- npm, yarn, or pnpm
- Chrome browser

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Build the extension:**

   ```bash
   npm run build
   ```

   This creates a `dist/` folder with the compiled extension.

3. **Load the extension in Chrome:**

   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top-right corner)
   - Click **Load unpacked**
   - Select the `dist/` folder from this project

4. **Visit Hacker News:**

   - Go to [https://news.ycombinator.com](https://news.ycombinator.com)
   - You should see:
     - Modified CSS styling (slightly different background, larger titles)
     - Custom menu in the header: "HN Skin: Demo theme active"

## Development

### Watch Mode

For iterative development with automatic rebuilds:

```bash
npm run dev
```

After making changes, reload the extension in Chrome:
- Go to `chrome://extensions/`
- Click the refresh icon on the HN Custom Skin extension

### Scripts

- `npm run build` - Build the extension for production
- `npm run dev` - Build in watch mode for development

## Current Implementation

This is a **minimal setup** focusing on project structure and basic functionality:

### Content Script (`src/content/main.ts`)
- ✅ CSS injection via `<style>` tag
- ✅ Demo CSS with visible HN modifications
- ✅ Custom menu injection in HN header
- 🚧 TODO: Fetch CSS from user profile service
- 🚧 TODO: Theme selection UI

### Background Script (`src/background/main.ts`)
- ✅ Basic service worker setup
- ✅ Installation lifecycle handler
- 🚧 TODO: API calls for user CSS
- 🚧 TODO: Settings synchronization

### Options Page (`src/options/`)
- ✅ Basic HTML placeholder
- 🚧 TODO: Settings UI
- 🚧 TODO: CSS editor
- 🚧 TODO: Profile integration

## Future Enhancements

- [ ] User-customizable CSS editor
- [ ] Theme presets library
- [ ] Profile service integration for syncing themes
- [ ] Import/export theme configurations
- [ ] Live preview in options page
- [ ] Multiple theme slots
- [ ] Community theme sharing

## License

ISC
