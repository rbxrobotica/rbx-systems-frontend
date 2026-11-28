# Themes

The site has two themes, dark and light. A visitor who has not chosen sees the
theme of their system. The toggle in the header (in the mobile menu on phones)
sets a choice, which is stored and wins over the system from then on (owner,
2026-11-27; until then dark was the default for everyone).

## How it works

| Piece                                          | Role                                                                                                                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/design/tokens.css`                    | Dark values in `:root`, light values under `[data-theme='light']`                                                                                                                               |
| `src/app.html`                                 | Inline script that sets `data-theme` on `<html>` before first paint, from `localStorage` or, with no stored choice, from `prefers-color-scheme`; it follows the system while there is no choice |
| `src/lib/design/theme.ts`                      | Reads and applies the theme, stores the choice, updates `theme-color`                                                                                                                           |
| `src/lib/design/components/ThemeToggle.svelte` | The button. Two instances, header and mobile menu, kept in step by observing `data-theme` on `<html>`                                                                                           |

The light values come from the Voltage definition in the atelier
(`brand-voltage/TEMA-CLARO.md` and `colors_and_type.css` in `rbxrobotica/rbx-atelier`).
The atelier leaves the overlay and the shadows undefined for light. This site
sets them, together with `--accent-halo`, `--accent-glow`, `--accent-wash`,
`--accent-solid`, `--accent-text-on-tint` and `--on-cta-track`, which the atelier
does not have.

## Rule for components

Components never read the cyan scale (`--cyan-brand`, `--cyan-signal`,
`--cyan-muted`, `--cyan-dim`, `--cyan-subtle`) and never write a colour literal.
They read a role token:

| Need                                      | Token                                              |
| ----------------------------------------- | -------------------------------------------------- |
| Cyan text                                 | `--accent-text`, on hover `--accent-text-hover`    |
| Cyan text on a tinted panel over `--bg-1` | `--accent-text-on-tint`                            |
| Drawing: mark, rule, badge border, bullet | `--accent-line`                                    |
| Active underline in the header            | `--accent-active`                                  |
| Focus ring and focused field border       | `--accent-focus`, soft ring `--accent-halo`        |
| Outline button border                     | `--accent-outline`, hover `--accent-outline-hover` |
| Tinted fill                               | `--accent-subtle`, hover `--accent-subtle-hover`   |
| Filled button                             | `--cta`, hover `--cta-hover`, text `--on-cta`      |
| Field background                          | `--field-bg`                                       |
| Scrim behind a drawer or modal            | `--bg-overlay`                                     |

In dark each role resolves to the value the component used before, so the dark
site is unchanged. Two exceptions, both small: the chat field halo goes from 12%
to 15% opacity, and two spinner tracks are now derived from tokens.

`scripts/theme-tokens.test.mjs` fails when a component reads the cyan scale, when
the light block sets a token that `:root` does not declare, or when the storage
key in `app.html` and `theme.ts` differ.

## Trade-offs

- **The system decides until the visitor does.** With no stored choice the site
  follows `prefers-color-scheme`, at load and while the page is open. Using the
  toggle stores a choice of either theme, and the system is ignored from then
  on; there is no control to return to "system" short of clearing site data.
  Cost: visitors no longer share one default, so the light theme is what a
  large share of them see first, and it departs from the atelier, where light
  is opt-in. A crawler or link preview that reports no preference gets dark.
- **Choice kept in `localStorage`, not in a cookie.** The server never knows the
  theme, so responses stay cacheable and identical for every visitor, and there
  is nothing to add to a consent notice. Cost: the server always renders dark
  and an inline script corrects it before paint, for a stored light choice and
  for a light system alike. The choice does not follow the
  visitor to another device or browser.
- **Inline script in `app.html`.** It is the only way to avoid a flash of the
  dark page for a visitor who chose light or whose system is light. The site sends no Content Security
  Policy today. If one is added, this script needs a hash or a nonce.

## Failure modes

| Failure                                     | Result                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `localStorage` blocked or throwing          | The page follows the system. The toggle still switches, for the current page only             |
| JavaScript disabled                         | Dark, whatever the system. The toggle does nothing                                            |
| Stored value is neither `light` nor `dark`  | Treated as no choice: the page follows the system                                             |
| `matchMedia` missing or throwing            | Dark, unless a light choice is stored                                                         |
| A new component uses a literal or the scale | It looks right in dark and wrong in light. The test catches the cyan scale, not every literal |

## Not checked yet

Local development has no content storage credentials, so only `/produtos`,
`/parceria`, `/contato` and the error page were rendered in both themes. Pages
that come from the content gateway (home, journal, articles and the rest of the
company pages) share the same tokens but were not looked at in light. Still to
look at in light: article images and covers, the subscription modal, the chat
widget, the WhatsApp drawer, print, and widths below 375 px.
