/**
 * HN Custom Skin - Content Script
 * Injects custom CSS and UI elements into Hacker News
 */

/**
 * Injects CSS into the page by creating a <style> element
 * @param cssText - The CSS rules to inject
 */
function injectCss(cssText: string): void {
  const style = document.createElement('style');
  style.textContent = cssText;
  document.head.appendChild(style);
}

/**
 * Demo CSS that visibly modifies Hacker News appearance
 * TODO: Replace with user-customizable CSS from profile service
 */
const demoCss = `
  /* Demo theme: Slightly modified HN appearance */
  body {
    background-color: #f6f6ef !important;
    font-size: 11pt !important;
  }

  /* Larger, more prominent titles */
  .titleline > a {
    font-size: 13pt !important;
    font-weight: 500 !important;
    color: #000 !important;
  }

  /* Subtle background change to verify CSS injection */
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
`;

/**
 * Injects a custom menu element into the HN header
 * TODO: Expand menu with theme selection and settings
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
  menu.textContent = 'HN Skin: Demo theme active';

  // TODO: Add click handler to open theme selector
  menu.style.cursor = 'pointer';
  menu.title = 'Click to customize theme (coming soon)';

  // Append to the page top
  pagetop.appendChild(menu);

  console.log('HN Skin: Menu injected successfully');
}

/**
 * Initialize the extension when DOM is ready
 */
function initialize(): void {
  console.log('HN Skin: Content script loaded');

  // Inject demo CSS
  injectCss(demoCss);
  console.log('HN Skin: Demo CSS injected');

  // Inject custom menu
  injectMenu();
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  // DOM is already ready
  initialize();
}
