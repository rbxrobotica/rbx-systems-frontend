/**
 * Site theme: the theme of the visitor's system, until they choose one with the
 * toggle. From then on their choice wins.
 *
 * The choice lives in localStorage under THEME_KEY, on this device only: no cookie,
 * nothing sent to the server. src/app.html applies the choice, or the system theme
 * when there is none, before first paint, and keeps following the system while
 * there is no choice. The same key and values are written there by hand, because
 * that script runs before any module loads.
 */
export type Theme = 'dark' | 'light';

export const THEME_KEY = 'theme';

/** Page colour each theme reports to the browser chrome (--bg-0). */
const themeColor = (theme: Theme) => (theme === 'light' ? '#F2EFE6' : '#07080A');

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

/** Applies the theme the visitor chose with the toggle, and stores the choice. */
export function applyTheme(theme: Theme): void {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(theme));
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked (private mode, policy): the choice holds for this page only.
  }
}
