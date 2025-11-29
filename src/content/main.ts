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
    '--background-color': '#2e3440',
    '--table-background-color': '#3b4252',
    '--text-color': '#eceff4',
    '--link-color': '#81a1c1',
    '--pagetop-background-color': '#3b4252',
    '--pagetop-text-color': '#81a1c1',
    '--pagetop-user-info-color': '#e5e9f0',
    '--pagetop-karma-color': '#eceff4',
    '--hnname-color': '#b48ead',
    '--title-link-color': '#eceff4',
    '--title-link-visited-color': '#8fbcbb',
    '--subtext-link-color': '#88c0d0',
    '--itemlist-even-bg-color': '#2e3440',
    '--itemlist-odd-bg-color': '#3b4252',
    '--c00-color': '#eceff4',
    '--active-link-color': '#d08770',
    '--selection-bg-color': 'rgba(191, 97, 106, 0.5)',
    '--selection-text-color': '#eceff4',
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
    '--selection-bg-color': 'rgba(255, 102, 0, 0.4)',
    '--selection-text-color': '#ffffff',
  },
} as const;

type ThemeName = keyof typeof themes;

/** Current theme state */
let currentTheme: ThemeName = 'darkNavy';

/** Reference to the injected theme style element */
let themeStyleElement: HTMLStyleElement | null = null;

// ============================================================================
// USER POPUP TYPES
// ============================================================================

/** Parsed user profile data from HN profile page */
interface UserProfileData {
  username: string;
  createdDate: string;
  karma: number;
  about: string;
  submissionsUrl: string;
  commentsUrl: string;
}

/** Cache entry with expiration tracking */
interface CacheEntry {
  data: UserProfileData;
  timestamp: number;
}

/** Popup state tracking */
interface PopupState {
  isVisible: boolean;
  currentUsername: string | null;
  hoverTimeout: number | null;
  hideTimeout: number | null;
  element: HTMLDivElement | null;
}

// ============================================================================
// USER POPUP STATE
// ============================================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const HOVER_DELAY_MS = 300;
const profileCache = new Map<string, CacheEntry>();

const HIDE_DELAY_MS = 150; // Delay before hiding to allow moving to popup

let popupState: PopupState = {
  isVisible: false,
  currentUsername: null,
  hoverTimeout: null,
  hideTimeout: null,
  element: null,
};

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

    /* Poll options - override inline font color attribute */
    td.comment font[color],
    td.comment font {
      color: var(--text-color) !important;
    }

    /* Poll option scores */
    td.default .comhead,
    td.default .score {
      color: var(--subtext-link-color) !important;
    }

    /* Text selection */
    ::selection {
      background-color: var(--selection-bg-color) !important;
      color: var(--selection-text-color) !important;
    }

    ::-moz-selection {
      background-color: var(--selection-bg-color) !important;
      color: var(--selection-text-color) !important;
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

    /* ========================================================================
       USER PROFILE POPUP
       ======================================================================== */

    .hn-user-popup {
      position: absolute;
      z-index: 10000;
      width: 320px;
      max-width: 90vw;
      padding: 16px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      opacity: 0;
      transform: translateY(-4px);
      transition: opacity 0.15s ease, transform 0.15s ease;
      pointer-events: none;
      background-color: var(--table-background-color);
      color: var(--text-color);
      border: 1px solid var(--link-color);
    }

    .hn-user-popup.visible {
      opacity: 1;
      transform: translateY(0);
      pointer-events: auto;
    }

    .hn-user-popup-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(128, 128, 128, 0.3);
    }

    .hn-user-popup-username {
      font-size: 18px;
      font-weight: 600;
      color: var(--hnname-color);
      margin: 0;
    }

    .hn-user-popup-username a {
      color: inherit !important;
      text-decoration: none !important;
    }

    .hn-user-popup-username a:hover {
      text-decoration: underline !important;
    }

    .hn-user-popup-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
      font-size: 13px;
    }

    .hn-user-popup-meta-item {
      display: flex;
      flex-direction: column;
    }

    .hn-user-popup-meta-label {
      color: var(--link-color);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .hn-user-popup-meta-value {
      color: var(--text-color);
      font-weight: 500;
    }

    .hn-user-popup-about {
      margin-bottom: 12px;
      max-height: 100px;
      overflow-y: auto;
      font-size: 13px;
      color: var(--c00-color);
    }

    .hn-user-popup-about a {
      color: var(--subtext-link-color) !important;
    }

    .hn-user-popup-about::-webkit-scrollbar {
      width: 6px;
    }

    .hn-user-popup-about::-webkit-scrollbar-thumb {
      background-color: var(--link-color);
      border-radius: 3px;
    }

    .hn-user-popup-actions {
      display: flex;
      gap: 8px;
    }

    .hn-user-popup-btn {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--link-color);
      border-radius: 4px;
      background-color: transparent;
      color: var(--link-color) !important;
      text-decoration: none !important;
      text-align: center;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.15s ease, color 0.15s ease;
    }

    .hn-user-popup-btn:hover {
      background-color: var(--link-color);
      color: var(--background-color) !important;
    }

    .hn-user-popup-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .hn-user-popup-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid var(--link-color);
      border-top-color: transparent;
      border-radius: 50%;
      animation: hn-spin 0.8s linear infinite;
    }

    @keyframes hn-spin {
      to { transform: rotate(360deg); }
    }

    .hn-user-popup-error {
      text-align: center;
      padding: 16px;
      color: var(--active-link-color);
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
  chrome.storage.sync.set({ hnTheme: themeName });
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
        resolve(result.hnTheme as ThemeName);
        return;
      }

      // Fallback to localStorage (old userscript key)
      try {
        const oldTheme = localStorage.getItem('hn-theme');
        if (oldTheme && themes[oldTheme as ThemeName]) {
          // Migrate to chrome.storage
          chrome.storage.sync.set({ hnTheme: oldTheme });
          resolve(oldTheme as ThemeName);
          return;
        }
      } catch {
        // Ignore localStorage errors
      }

      // Default to darkNavy
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
}

// ============================================================================
// USER POPUP - CACHING
// ============================================================================

/**
 * Gets cached profile data if it exists and hasn't expired
 */
function getCachedProfile(username: string): UserProfileData | null {
  const entry = profileCache.get(username);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    profileCache.delete(username);
    return null;
  }

  return entry.data;
}

/**
 * Stores profile data in cache with timestamp
 */
function setCachedProfile(username: string, data: UserProfileData): void {
  profileCache.set(username, {
    data,
    timestamp: Date.now(),
  });

  // Limit cache size to prevent memory issues
  if (profileCache.size > 100) {
    const firstKey = profileCache.keys().next().value;
    if (firstKey) profileCache.delete(firstKey);
  }
}

// ============================================================================
// USER POPUP - FETCHING & PARSING
// ============================================================================

/**
 * Parses profile HTML to extract user data
 */
function parseProfileHTML(html: string, username: string): UserProfileData | null {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Find the profile table rows
    const rows = doc.querySelectorAll('table tr');

    let createdDate = '';
    let karma = 0;
    let about = '';

    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 2) {
        const label = cells[0].textContent?.trim().toLowerCase() || '';
        const valueCell = cells[1];

        if (label === 'created:') {
          const dateLink = valueCell.querySelector('a');
          createdDate = dateLink?.textContent?.trim() || valueCell.textContent?.trim() || '';
        } else if (label === 'karma:') {
          karma = parseInt(valueCell.textContent?.trim() || '0', 10);
        } else if (label === 'about:') {
          about = valueCell.innerHTML.trim();
        }
      }
    });

    // Check if we got any valid data
    if (!createdDate && !karma) {
      return null;
    }

    return {
      username,
      createdDate,
      karma,
      about,
      submissionsUrl: `/submitted?id=${username}`,
      commentsUrl: `/threads?id=${username}`,
    };
  } catch {
    return null;
  }
}

/**
 * Fetches user profile from HN
 */
async function fetchUserProfile(username: string): Promise<UserProfileData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`https://news.ycombinator.com/user?id=${username}`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return parseProfileHTML(html, username);
  } catch {
    return null;
  }
}

// ============================================================================
// USER POPUP - POSITIONING
// ============================================================================

interface PopupPosition {
  top: number;
  left: number;
}

/**
 * Calculates popup position with edge detection
 */
function calculatePopupPosition(
  triggerRect: DOMRect,
  popupWidth: number,
  popupHeight: number
): PopupPosition {
  const MARGIN = 8;
  const VIEWPORT_PADDING = 10;

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  // Default: Position below and aligned left with trigger
  let top = triggerRect.bottom + scrollY + MARGIN;
  let left = triggerRect.left + scrollX;

  // Check right edge overflow
  if (left + popupWidth > viewportWidth + scrollX - VIEWPORT_PADDING) {
    left = triggerRect.right + scrollX - popupWidth;
  }

  // Check left edge overflow
  if (left < scrollX + VIEWPORT_PADDING) {
    left = scrollX + VIEWPORT_PADDING;
  }

  // Check bottom edge overflow - position above if needed
  if (top + popupHeight > viewportHeight + scrollY - VIEWPORT_PADDING) {
    top = triggerRect.top + scrollY - popupHeight - MARGIN;
  }

  // Check top edge overflow
  if (top < scrollY + VIEWPORT_PADDING) {
    top = scrollY + VIEWPORT_PADDING;
  }

  return { top, left };
}

// ============================================================================
// USER POPUP - RENDERING
// ============================================================================

/**
 * Escapes HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Creates the popup element
 */
function createPopupElement(): HTMLDivElement {
  const popup = document.createElement('div');
  popup.className = 'hn-user-popup';
  popup.setAttribute('role', 'tooltip');
  popup.setAttribute('aria-live', 'polite');
  document.body.appendChild(popup);
  return popup;
}

/**
 * Gets or creates the popup element
 */
function getOrCreatePopup(): HTMLDivElement {
  if (!popupState.element) {
    popupState.element = createPopupElement();
  }
  return popupState.element;
}

/**
 * Renders the loading state
 */
function renderLoadingState(): string {
  return `
    <div class="hn-user-popup-loading">
      <div class="hn-user-popup-spinner"></div>
    </div>
  `;
}

/**
 * Renders the error state
 */
function renderErrorState(username: string): string {
  return `
    <div class="hn-user-popup-error">
      <p>Could not load profile for "${escapeHtml(username)}"</p>
    </div>
  `;
}

/**
 * Renders the full profile content
 */
function renderPopupContent(data: UserProfileData): string {
  const aboutHtml = data.about
    ? `<div class="hn-user-popup-about">${data.about}</div>`
    : '';

  return `
    <div class="hn-user-popup-header">
      <h3 class="hn-user-popup-username">
        <a href="/user?id=${encodeURIComponent(data.username)}">${escapeHtml(data.username)}</a>
      </h3>
    </div>
    <div class="hn-user-popup-meta">
      <div class="hn-user-popup-meta-item">
        <span class="hn-user-popup-meta-label">Karma</span>
        <span class="hn-user-popup-meta-value">${data.karma.toLocaleString()}</span>
      </div>
      <div class="hn-user-popup-meta-item">
        <span class="hn-user-popup-meta-label">Member since</span>
        <span class="hn-user-popup-meta-value">${escapeHtml(data.createdDate)}</span>
      </div>
    </div>
    ${aboutHtml}
    <div class="hn-user-popup-actions">
      <a href="${data.commentsUrl}" class="hn-user-popup-btn">Comments</a>
      <a href="${data.submissionsUrl}" class="hn-user-popup-btn">Submissions</a>
    </div>
  `;
}

// ============================================================================
// USER POPUP - EVENT HANDLING
// ============================================================================

/**
 * Extracts username from href
 */
function extractUsername(href: string): string | null {
  try {
    const url = new URL(href, window.location.origin);
    return url.searchParams.get('id');
  } catch {
    const match = href.match(/user\?id=([^&]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Shows the popup for a username
 */
async function showPopup(username: string, triggerElement: HTMLElement): Promise<void> {
  const popup = getOrCreatePopup();

  popupState.currentUsername = username;

  const triggerRect = triggerElement.getBoundingClientRect();

  // Show loading state immediately
  popup.innerHTML = renderLoadingState();
  popup.classList.add('visible');
  popupState.isVisible = true;

  // Position with estimated height
  const estimatedHeight = 80;
  const position = calculatePopupPosition(triggerRect, 320, estimatedHeight);
  popup.style.top = `${position.top}px`;
  popup.style.left = `${position.left}px`;

  // Check cache first
  let profileData = getCachedProfile(username);

  if (!profileData) {
    profileData = await fetchUserProfile(username);

    if (profileData) {
      setCachedProfile(username, profileData);
    }
  }

  // Verify popup should still show (user might have moved away)
  if (popupState.currentUsername !== username) {
    return;
  }

  if (profileData) {
    popup.innerHTML = renderPopupContent(profileData);
  } else {
    popup.innerHTML = renderErrorState(username);
  }

  // Reposition after content loads
  const actualHeight = popup.offsetHeight;
  const finalPosition = calculatePopupPosition(triggerRect, 320, actualHeight);
  popup.style.top = `${finalPosition.top}px`;
  popup.style.left = `${finalPosition.left}px`;
}

/**
 * Cancels any pending hide timeout
 */
function cancelHideTimeout(): void {
  if (popupState.hideTimeout) {
    clearTimeout(popupState.hideTimeout);
    popupState.hideTimeout = null;
  }
}

/**
 * Immediately hides the popup (no delay)
 */
function hidePopupImmediately(): void {
  cancelHideTimeout();

  if (popupState.hoverTimeout) {
    clearTimeout(popupState.hoverTimeout);
    popupState.hoverTimeout = null;
  }

  if (popupState.element) {
    popupState.element.classList.remove('visible');
  }

  popupState.isVisible = false;
  popupState.currentUsername = null;
}

/**
 * Hides the popup with a small delay (allows moving to popup)
 */
function hidePopup(): void {
  if (popupState.hoverTimeout) {
    clearTimeout(popupState.hoverTimeout);
    popupState.hoverTimeout = null;
  }

  // Cancel any existing hide timeout
  cancelHideTimeout();

  // Set a delayed hide to give user time to move to popup
  popupState.hideTimeout = window.setTimeout(() => {
    if (popupState.element) {
      popupState.element.classList.remove('visible');
    }
    popupState.isVisible = false;
    popupState.currentUsername = null;
    popupState.hideTimeout = null;
  }, HIDE_DELAY_MS);
}

/**
 * Handles mouseenter on username links
 */
function handleMouseEnter(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  if (!target.matches('a[href^="user?id="]')) {
    return;
  }

  const link = target as HTMLAnchorElement;
  const username = extractUsername(link.href);
  if (!username) return;

  // Cancel any pending hide timeout
  cancelHideTimeout();

  if (popupState.hoverTimeout) {
    clearTimeout(popupState.hoverTimeout);
  }

  popupState.hoverTimeout = window.setTimeout(() => {
    showPopup(username, link);
  }, HOVER_DELAY_MS);
}

/**
 * Handles mouseleave on username links
 */
function handleMouseLeave(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  if (!target.matches('a[href^="user?id="]')) {
    return;
  }

  const relatedTarget = event.relatedTarget as HTMLElement | null;
  if (relatedTarget && popupState.element?.contains(relatedTarget)) {
    return;
  }

  hidePopup();
}

/**
 * Handles mouseenter on popup
 */
function handlePopupMouseEnter(): void {
  // Cancel any pending hide - user made it to the popup
  cancelHideTimeout();

  if (popupState.hoverTimeout) {
    clearTimeout(popupState.hoverTimeout);
    popupState.hoverTimeout = null;
  }
}

/**
 * Handles mouseleave on popup
 */
function handlePopupMouseLeave(event: MouseEvent): void {
  const relatedTarget = event.relatedTarget as HTMLElement | null;
  if (relatedTarget?.matches('a[href^="user?id="]')) {
    return;
  }

  // Hide immediately when leaving popup (not going to a username)
  hidePopupImmediately();
}

/**
 * Initializes user popup feature
 */
function initUserPopup(): void {
  document.body.addEventListener('mouseenter', handleMouseEnter, true);
  document.body.addEventListener('mouseleave', handleMouseLeave, true);

  const popup = getOrCreatePopup();
  popup.addEventListener('mouseenter', handlePopupMouseEnter);
  popup.addEventListener('mouseleave', handlePopupMouseLeave);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the extension when DOM is ready
 */
async function initialize(): Promise<void> {
  try {
    // 1. Load initial theme from storage/localStorage
    const initialTheme = await loadInitialTheme();

    // 2. Apply the theme
    applyTheme(initialTheme);

    // 3. Modify navigation menu
    modifyNav();

    // 4. Add theme switcher at bottom
    addThemeSwitcher();

    // 5. Initialize user profile popup
    initUserPopup();
  } catch {
    // Initialization failed silently
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM is already ready
  initialize();
}
