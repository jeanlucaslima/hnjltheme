/**
 * HN Custom Skin - Content Script
 * Injects custom CSS and UI elements into Hacker News
 * Ported from userscript
 */

// ============================================================================
// THEME DEFINITIONS (Ported from userscript)
// ============================================================================

const themes = {
  darkNavy: {
    dark: true,
    '--background-color': '#1a202c',
    '--table-background-color': '#2d3848',
    '--text-color': '#dddddd',
    '--link-color': '#9facbe',
    '--pagetop-background-color': '#2d3848',
    '--pagetop-text-color': '#9facbe',
    '--pagetop-user-info-color': '#c8d2dc',
    '--pagetop-karma-color': '#ededed',
    '--hnname-color': '#bb86fc',
    '--title-link-color': '#ededed',
    '--title-link-visited-color': '#7fe0d4',
    '--subtext-link-color': '#c8d2dc',
    '--itemlist-even-bg-color': '#1c1c1c',
    '--itemlist-odd-bg-color': '#121212',
    '--c00-color': '#c8d2dc',
    '--active-link-color': '#ff4500',
  },
  blackTheme: {
    dark: true,
    '--background-color': '#1f1f1f',
    '--table-background-color': '#1f1f1f',
    '--text-color': '#e0e0e0',
    '--link-color': '#828282',
    '--pagetop-background-color': '#1f1f1f',
    '--pagetop-text-color': '#828282',
    '--pagetop-user-info-color': '#e0e0e0',
    '--pagetop-karma-color': '#ffffff',
    '--hnname-color': '#bb86fc',
    '--title-link-color': '#ededed',
    '--title-link-visited-color': '#868686',
    '--subtext-link-color': '#03dac6',
    '--itemlist-even-bg-color': '#1c1c1c',
    '--itemlist-odd-bg-color': '#121212',
    '--c00-color': '#ededed',
    '--active-link-color': '#ff6600',
  },
} as const;

type ThemeName = keyof typeof themes;

/** Current theme state */
let currentTheme: ThemeName = 'darkNavy';

/** Reference to the injected theme style element */
let themeStyleElement: HTMLStyleElement | null = null;

// ============================================================================
// CSS GENERATION (Ported from userscript)
// ============================================================================

/**
 * Generates CSS from theme object using CSS variables
 * @param themeName - The theme to generate CSS for
 * @returns Complete CSS string with all rules
 */
function generateCSS(themeName: ThemeName): string {
  const theme = themes[themeName];

  // Set color scheme for dark themes
  const colorScheme = theme.dark ? 'color-scheme: dark;' : '';

  return `
    /* Theme: ${themeName} - Generated CSS with variables */

    :root {
      ${colorScheme}
      ${Object.entries(theme).filter(([key]) => key.startsWith('--')).map(([key, value]) => `${key}: ${value};`).join('\n      ')}
    }

    body, tbody {
      background-color: var(--background-color) !important;
      color: var(--text-color) !important;
    }

    a {
      color: var(--link-color) !important;
    }

    .pagetop {
      background-color: var(--pagetop-background-color) !important;
      color: var(--pagetop-text-color) !important;
    }

    .pagetop a {
      color: var(--pagetop-text-color) !important;
    }

    .pagetop * {
      color: var(--pagetop-text-color) !important;
    }

    .hnname a {
      color: var(--hnname-color) !important;
    }

    td.title .titleline > a {
      color: var(--title-link-color) !important;
    }

    td.title .titleline > a:visited {
      color: var(--title-link-visited-color) !important;
    }

    .subtext, .subtext a {
      color: var(--subtext-link-color) !important;
    }

    table {
      background-color: var(--table-background-color) !important;
    }

    /* Override: main HN table should match page background to prevent stripes */
    #hnmain,
    table#hnmain {
      background-color: var(--background-color) !important;
    }

    /* Override all inline bgcolor attributes within hnmain */
    #hnmain td[bgcolor],
    #hnmain tr[bgcolor],
    #hnmain table[bgcolor] {
      background-color: var(--background-color) !important;
    }

    /* Header table should use pagetop background */
    #hnmain > tbody > tr:nth-child(2) > td,
    #hnmain > tbody > tr:nth-child(2) td[bgcolor],
    #hnmain > tbody > tr:nth-child(2) table,
    #hnmain > tbody > tr:nth-child(2) table tr,
    #hnmain > tbody > tr:nth-child(2) table td {
      background-color: var(--pagetop-background-color) !important;
    }

    /* Remove all backgrounds from story list rows and cells */
    .athing,
    .athing td,
    tr.spacer,
    tr.spacer td {
      background-color: transparent !important;
    }

    /* Target ALL rows in the story list area (including subtext rows) */
    #bigbox table tr,
    #bigbox table tr td,
    #bigbox table tbody,
    #bigbox table {
      background-color: transparent !important;
    }

    .c00, .c00 a {
      color: var(--c00-color) !important;
    }

    /* Remove unwanted borders and outlines from all tables */
    table, tr, td, th {
      border: none !important;
      outline: none !important;
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }

    /* Comment block styling - remove all visual cruft */
    .comtr,
    .athing.comtr,
    tr[id^="tr_"] {
      border: none !important;
      outline: none !important;
      background-color: transparent !important;
    }

    .comment {
      border: none !important;
      outline: none !important;
      box-shadow: none !important;
      background-color: transparent !important;
    }

    /* Comment table cells */
    .comment td {
      border: none !important;
      padding: 0 !important;
    }

    /* Indentation spacers */
    .ind img {
      border: none !important;
      outline: none !important;
    }

    /* Comment text */
    .commtext {
      color: var(--text-color) !important;
      background: transparent !important;
    }

    /* Code blocks in comments */
    .commtext pre {
      background-color: rgba(0, 0, 0, 0.3) !important;
      border: 1px solid rgba(255, 255, 255, 0.1) !important;
      padding: 8px !important;
      border-radius: 4px !important;
    }

    /* Active link highlighting in menu */
    .menu a.active {
      color: var(--active-link-color) !important;
      font-weight: bold !important;
    }

    /* User info in top-right corner */
    .pagetop .user-info {
      float: right;
      margin-left: 15px;
      color: var(--pagetop-user-info-color) !important;
    }

    .pagetop .user-info a {
      color: var(--pagetop-user-info-color) !important;
    }

    /* Karma score with high contrast */
    .pagetop .karma-score {
      color: var(--pagetop-karma-color) !important;
      font-weight: 500;
      padding: 0 3px;
    }

    /* Theme switcher styling */
    .theme_switcher {
      display: block;
      margin-top: 10px;
      color: var(--text-color) !important;
    }

    .theme_switcher select {
      margin-left: 5px;
      background-color: var(--table-background-color) !important;
      color: var(--text-color) !important;
      border: 1px solid var(--link-color) !important;
      padding: 2px 4px;
    }
  `;
}

// ============================================================================
// THEME APPLICATION & STORAGE
// ============================================================================

/**
 * Applies the selected theme to the page
 * @param themeName - Theme name to apply
 */
function applyTheme(themeName: ThemeName): void {
  // Validate theme name
  if (!themes[themeName]) {
    console.warn(`HN Skin: Invalid theme "${themeName}", defaulting to darkNavy`);
    themeName = 'darkNavy';
  }

  // Remove existing theme style if present
  if (themeStyleElement) {
    themeStyleElement.remove();
  }

  // Create new style element with generated CSS
  themeStyleElement = document.createElement('style');
  themeStyleElement.textContent = generateCSS(themeName);
  themeStyleElement.setAttribute('data-hn-skin-theme', themeName);
  document.head.appendChild(themeStyleElement);

  // Update current theme
  currentTheme = themeName;

  // Update theme switcher if it exists
  const themeSwitcher = document.querySelector<HTMLSelectElement>('.theme_switcher select');
  if (themeSwitcher) {
    themeSwitcher.value = themeName;
  }

  // Persist theme preference to storage
  chrome.storage.sync.set({ hnTheme: themeName }, () => {
    console.log(`HN Skin: Theme set to ${themeName}`);
  });
}

/**
 * Loads the initial theme from storage with fallback to localStorage
 * @returns Promise resolving to the theme name
 */
async function loadInitialTheme(): Promise<ThemeName> {
  return new Promise((resolve) => {
    // First try chrome.storage.sync
    chrome.storage.sync.get(['hnTheme'], (result) => {
      if (result.hnTheme && themes[result.hnTheme as ThemeName]) {
        console.log(`HN Skin: Loaded theme from chrome.storage: ${result.hnTheme}`);
        resolve(result.hnTheme as ThemeName);
        return;
      }

      // Fallback to localStorage (old userscript key)
      try {
        const oldTheme = localStorage.getItem('hn-theme');
        if (oldTheme && themes[oldTheme as ThemeName]) {
          console.log(`HN Skin: Migrating theme from localStorage: ${oldTheme}`);
          // Migrate to chrome.storage
          chrome.storage.sync.set({ hnTheme: oldTheme });
          resolve(oldTheme as ThemeName);
          return;
        }
      } catch (e) {
        console.warn('HN Skin: Could not access localStorage', e);
      }

      // Default to darkNavy
      console.log('HN Skin: No saved theme, defaulting to darkNavy');
      resolve('darkNavy');
    });
  });
}

// ============================================================================
// NAVIGATION MENU (Ported from userscript)
// ============================================================================

/**
 * Creates a link element with active state detection
 * @param container - Parent element to append link to
 * @param text - Link text
 * @param href - Link URL
 */
function createLink(container: HTMLElement, text: string, href: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = text;

  // Active link detection: compare pathname only
  try {
    const linkUrl = new URL(link.href, window.location.origin);
    if (linkUrl.pathname === window.location.pathname) {
      link.classList.add('active');
    }
  } catch (e) {
    // Ignore URL parse errors
  }

  // Add separator before link (except for first link)
  if (container.childNodes.length === 1) {
    container.appendChild(document.createTextNode(' '));
  }
  if (container.childNodes.length > 2) {
    container.appendChild(document.createTextNode(' | '));
  }

  container.appendChild(link);
}

/**
 * Builds the navigation menu with all links
 * @param container - Parent element to build menu in
 * @param userId - HN user ID for threads link
 */
function buildMenu(container: HTMLElement, userId: string): void {
  createLink(container, 'Hacker News', '/');
  createLink(container, 'active', '/active');
  createLink(container, 'best', '/best');

  // Only add threads link if we have a user ID
  if (userId) {
    createLink(container, 'threads', `/threads?id=${userId}`);
  }

  createLink(container, 'ask', '/ask');
  createLink(container, 'show', '/show');
  createLink(container, 'past', '/front');
  createLink(container, 'submit', '/submit');
}

/**
 * Modifies the top navigation bar (ported from userscript)
 */
function modifyNav(): void {
  const pagetop = document.querySelector('.pagetop');

  if (!pagetop) {
    console.warn('HN Skin: Could not find .pagetop element');
    return;
  }

  // Extract user info before clearing
  const userLink = pagetop.querySelector<HTMLAnchorElement>('a[href^="user?id="]');
  const logoutLink = pagetop.querySelector<HTMLAnchorElement>('a[href^="logout"]');
  const threadsLink = pagetop.querySelector<HTMLAnchorElement>('a[href^="threads?id="]');

  const username = userLink?.textContent || '';
  const userId = threadsLink?.href.split('=')[1] ?? '';

  // Extract karma score (text node between user and logout links)
  let karmaText = '';
  if (userLink && logoutLink) {
    let node = userLink.nextSibling;
    while (node && node !== logoutLink) {
      if (node.nodeType === Node.TEXT_NODE) {
        karmaText += node.textContent;
      }
      node = node.nextSibling;
    }
  }

  // Clear existing content
  pagetop.innerHTML = '';

  // Add menu class
  pagetop.classList.add('menu');

  // Build navigation menu
  buildMenu(pagetop, userId);

  // Re-add user info on the right
  if (username) {
    const userInfo = document.createElement('span');
    userInfo.className = 'user-info';

    const userLinkNew = document.createElement('a');
    userLinkNew.href = `/user?id=${username}`;
    userLinkNew.textContent = username;
    userInfo.appendChild(userLinkNew);

    if (karmaText.trim()) {
      const karma = document.createElement('span');
      karma.className = 'karma-score';
      karma.textContent = karmaText.trim();
      userInfo.appendChild(karma);
    }

    userInfo.appendChild(document.createTextNode(' | '));

    const logoutLinkNew = document.createElement('a');
    logoutLinkNew.href = '/logout';
    logoutLinkNew.textContent = 'logout';
    userInfo.appendChild(logoutLinkNew);

    pagetop.appendChild(userInfo);
  }

  console.log('HN Skin: Navigation menu modified');
}

// ============================================================================
// THEME SWITCHER (Ported from userscript)
// ============================================================================

/**
 * Adds theme switcher dropdown at the bottom of the page
 */
function addThemeSwitcher(): void {
  const bottomContainer = document.querySelector('.yclinks');

  if (!bottomContainer) {
    // Silently skip - not all HN pages have footer (.yclinks)
    // Reply pages, some utility pages don't have this element
    return;
  }

  // Create switcher container
  const switcherSpan = document.createElement('span');
  switcherSpan.className = 'theme_switcher';
  switcherSpan.style.display = 'block';
  switcherSpan.style.marginTop = '10px';

  // Create select element
  const select = document.createElement('select');
  select.innerHTML = `
    <option value="darkNavy">Deep Navy</option>
    <option value="blackTheme">Black</option>
  `;

  // Set current theme as selected
  select.value = currentTheme;

  // Add change listener
  select.addEventListener('change', () => {
    const selectedTheme = select.value as ThemeName;
    applyTheme(selectedTheme);
  });

  // Build switcher UI
  switcherSpan.appendChild(document.createTextNode('Theme: '));
  switcherSpan.appendChild(select);

  // Append to bottom
  bottomContainer.appendChild(switcherSpan);

  console.log('HN Skin: Theme switcher added');
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the extension when DOM is ready
 */
async function initialize(): Promise<void> {
  console.log('HN Skin: Content script loaded');

  try {
    // 1. Load initial theme from storage/localStorage
    const initialTheme = await loadInitialTheme();

    // 2. Apply the theme
    applyTheme(initialTheme);
    console.log(`HN Skin: Applied ${initialTheme} theme`);

    // 3. Modify navigation menu
    modifyNav();

    // 4. Add theme switcher at bottom
    addThemeSwitcher();

    console.log('HN Skin: Initialization complete');
  } catch (error) {
    console.error('HN Skin: Initialization error', error);
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM is already ready
  initialize();
}
