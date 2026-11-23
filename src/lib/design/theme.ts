/**
 * Site theme: dark by default, light when the visitor chooses it.
 *
 * The choice lives in localStorage under THEME_KEY, on this device only: no cookie,
 * nothing sent to the server. src/app.html applies it before first paint, so the
 * page never flashes the other theme. The same key and values are written there by
 * hand, because that script runs before any module loads.
 */
export type Theme = 'dark' | 'light';

export const THEME_KEY = 'theme';

/** Page colour each theme reports to the browser chrome (--bg-0). */
const themeColor = (theme: Theme) => (theme === 'light' ? '#F2EFE6' : '#07080A');

export function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

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
