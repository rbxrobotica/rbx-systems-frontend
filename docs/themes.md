# Themes

The site has two themes. Dark is the default. Light is chosen by the visitor with
the toggle in the header (in the mobile menu on phones).

## How it works

| Piece                                          | Role                                                                                                  |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/lib/design/tokens.css`                    | Dark values in `:root`, light values under `[data-theme='light']`                                     |
| `src/app.html`                                 | Inline script that sets `data-theme` on `<html>` from `localStorage` before first paint               |
| `src/lib/design/theme.ts`                      | Reads and applies the theme, stores the choice, updates `theme-color`                                 |
| `src/lib/design/components/ThemeToggle.svelte` | The button. Two instances, header and mobile menu, kept in step by observing `data-theme` on `<html>` |

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

- **Dark by default, no automatic switch.** The site does not follow
  `prefers-color-scheme`. A visitor whose system is light still sees dark until
  they use the toggle. This keeps one default for everyone and matches the
  atelier, where light is opt-in.
- **Choice kept in `localStorage`, not in a cookie.** The server never knows the
  theme, so responses stay cacheable and identical for every visitor, and there
  is nothing to add to a consent notice. Cost: the server always renders dark
  and an inline script corrects it before paint. The choice does not follow the
  visitor to another device or browser.
- **Inline script in `app.html`.** It is the only way to avoid a flash of the
  dark page for a visitor who chose light. The site sends no Content Security
  Policy today. If one is added, this script needs a hash or a nonce.

## Failure modes

| Failure                                     | Result                                                                                        |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `localStorage` blocked or throwing          | The page renders dark. The toggle still switches, for the current page only                   |
| JavaScript disabled                         | Dark. The toggle does nothing                                                                 |
| Stored value is neither `light` nor `dark`  | Treated as dark                                                                               |
| A new component uses a literal or the scale | It looks right in dark and wrong in light. The test catches the cyan scale, not every literal |

## Not checked yet

Local development has no content storage credentials, so only `/produtos`,
`/parceria`, `/contato` and the error page were rendered in both themes. Pages
that come from the content gateway (home, journal, articles and the rest of the
company pages) share the same tokens but were not looked at in light. Still to
look at in light: article images and covers, the subscription modal, the chat
widget, the WhatsApp drawer, print, and widths below 375 px.
