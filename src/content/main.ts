/**
 * HN Custom Skin - Content Script
 * Injects custom CSS and UI elements into Hacker News
 */

/** Current theme state */
let currentTheme: 'light' | 'dark' = 'light';

/** Reference to the injected theme style element */
let themeStyleElement: HTMLStyleElement | null = null;

/**
 * Light theme CSS - slightly enhanced HN appearance
 */
const lightThemeCss = `
  /* Light theme: Enhanced HN appearance */
  body {
    background-color: #f6f6ef !important;
    font-size: 11pt !important;
    color: #000 !important;
  }

  /* Larger, more prominent titles */
  .titleline > a {
    font-size: 13pt !important;
    font-weight: 500 !important;
    color: #000 !important;
  }

  /* Subtle background change */
  #hnmain {
    background-color: #fafaf5 !important;
  }

  /* Style for our custom menu */
  .hn-skin-menu {
    display: inline-block;
    margin-left: 10px;
    padding: 2px 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    font-size: 9pt;
    border-radius: 10px;
    font-weight: 500;
  }

  .hn-skin-menu a {
    color: white !important;
    text-decoration: none !important;
    margin: 0 4px;
  }

  .hn-skin-menu a:hover {
    text-decoration: underline !important;
  }

  .hn-skin-menu .separator {
    margin: 0 4px;
    opacity: 0.7;
  }

  .hn-skin-menu .toggle-btn {
    cursor: pointer;
    padding: 0 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .hn-skin-menu .toggle-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

/**
 * Dark theme CSS - dark mode for HN
 */
const darkThemeCss = `
  /* Dark theme: Dark mode for Hacker News */
  body {
    background-color: #0f172a !important;
    font-size: 11pt !important;
    color: #e5e7eb !important;
  }

  /* Main container */
  #hnmain {
    background-color: #1e293b !important;
  }

  /* Tables and containers */
  table {
    background-color: #1e293b !important;
  }

  td {
    background-color: transparent !important;
  }

  /* Story titles */
  .titleline > a {
    font-size: 13pt !important;
    font-weight: 500 !important;
    color: #f1f5f9 !important;
  }

  /* Links */
  a {
    color: #93c5fd !important;
  }

  a:visited {
    color: #c4b5fd !important;
  }

  /* Top bar */
  .pagetop {
    background-color: #ff6600 !important;
  }

  .pagetop a {
    color: #000 !important;
  }

  /* Comment text */
  .comment {
    color: #e5e7eb !important;
  }

  .comment a {
    color: #93c5fd !important;
  }

  /* Subtext (metadata) */
  .subtext {
    color: #94a3b8 !important;
  }

  .subtext a {
    color: #94a3b8 !important;
  }

  /* Reply links and controls */
  .reply a, .togg {
    color: #94a3b8 !important;
  }

  /* Input fields */
  input[type="text"], input[type="password"], textarea {
    background-color: #334155 !important;
    color: #e5e7eb !important;
    border: 1px solid #475569 !important;
  }

  /* Code blocks */
  pre {
    background-color: #334155 !important;
    color: #e5e7eb !important;
  }

  /* Style for our custom menu */
  .hn-skin-menu {
    display: inline-block;
    margin-left: 10px;
    padding: 2px 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white !important;
    font-size: 9pt;
    border-radius: 10px;
    font-weight: 500;
  }

  .hn-skin-menu a {
    color: white !important;
    text-decoration: none !important;
    margin: 0 4px;
  }

  .hn-skin-menu a:hover {
    text-decoration: underline !important;
  }

  .hn-skin-menu .separator {
    margin: 0 4px;
    opacity: 0.7;
  }

  .hn-skin-menu .toggle-btn {
    cursor: pointer;
    padding: 0 4px;
    border-radius: 4px;
    transition: background-color 0.2s;
  }

  .hn-skin-menu .toggle-btn:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

/**
 * Applies the selected theme to the page
 * @param theme - 'light' or 'dark'
 */
function applyTheme(theme: 'light' | 'dark'): void {
  // Remove existing theme style if present
  if (themeStyleElement) {
    themeStyleElement.remove();
  }

  // Create new style element
  themeStyleElement = document.createElement('style');
  themeStyleElement.textContent = theme === 'dark' ? darkThemeCss : lightThemeCss;
  themeStyleElement.setAttribute('data-hn-skin-theme', theme);
  document.head.appendChild(themeStyleElement);

  // Update current theme
  currentTheme = theme;

  // Update toggle button label if menu exists
  updateToggleLabel();

  // Persist theme preference to storage
  chrome.storage.sync.set({ hnSkinTheme: theme }, () => {
    console.log(`HN Skin: Theme set to ${theme}`);
  });
}

/**
 * Updates the toggle button label to reflect current theme
 */
function updateToggleLabel(): void {
  const toggleBtn = document.querySelector('.hn-skin-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = currentTheme === 'light' ? 'Theme: Light ↻' : 'Theme: Dark ↻';
  }
}

/**
 * Toggles between light and dark themes
 */
function toggleTheme(): void {
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(nextTheme);
}

/**
 * Injects a custom menu element into the HN header with /active link and theme toggle
 */
function injectMenu(): void {
  // Find the HN top bar (usually in .pagetop)
  const pagetop = document.querySelector('.pagetop');

  if (!pagetop) {
    console.warn('HN Skin: Could not find .pagetop element');
    return;
  }

  // Create our custom menu element
  const menu = document.createElement('span');
  menu.className = 'hn-skin-menu';

  // Build menu content: [HN Skin] | [Active] | [Theme toggle]
  menu.innerHTML = `
    <span>HN Skin</span>
    <span class="separator">|</span>
    <a href="/active">Active</a>
    <span class="separator">|</span>
    <span class="toggle-btn hn-skin-toggle">${currentTheme === 'light' ? 'Theme: Light ↻' : 'Theme: Dark ↻'}</span>
  `;

  // Add click handler for theme toggle
  const toggleBtn = menu.querySelector('.toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleTheme();
    });
  }

  // Append to the page top
  pagetop.appendChild(menu);

  console.log('HN Skin: Menu injected successfully');
}

/**
 * Initialize the extension when DOM is ready
 */
function initialize(): void {
  console.log('HN Skin: Content script loaded');

  // Load saved theme from storage (default to 'light')
  chrome.storage.sync.get(['hnSkinTheme'], (result) => {
    const savedTheme = (result.hnSkinTheme as 'light' | 'dark') || 'light';
    currentTheme = savedTheme;

    // Apply the saved/default theme
    applyTheme(currentTheme);
    console.log(`HN Skin: Applied ${currentTheme} theme`);

    // Inject custom menu (after theme is set so toggle shows correct state)
    injectMenu();
  });
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM is already ready
  initialize();
}
