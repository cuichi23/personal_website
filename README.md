# lucaswetzel.de

The static site for lucaswetzel.de. Posts are Markdown, maths is LaTeX, the build is one
Python script, and the output is plain HTML that GitHub Pages can serve as it is.

```
build.py            the whole generator, ~350 lines
content/            everything you edit
  site.yaml           title, hero copy, footer links, domain
  home/               the sections of the home page, in `order:` order
  posts/              the blog, one file per post
  pages/              contact, links, impressum
static/             images and interactive tools, copied to the site root as-is
static-drafts/      the same, but only copied when building with --drafts
theme/
  templates/          Jinja2 templates
  static/             CSS, JS, self-hosted fonts, vendored KaTeX
docs/               the built site — this is what GitHub Pages serves
```

## Build it

```bash
pip install -r requirements.txt     # markdown, jinja2, pyyaml
python3 build.py                    # writes docs/
python3 build.py --serve            # writes docs/ and serves it on localhost:8000
```

The build prints a warning for every image a post references that is not on disk, and renders
a labelled placeholder in its place rather than a broken image. Drop the file into
`static/media/<post-slug>/` under the name the warning gives and it appears on the next build.

## Write a post

Create `content/posts/YYYY-MM-DD-some-slug.md`:

```markdown
---
title: What the delay does to the basins
slug: what-delay-does-to-basins
date: 2026-09-01
summary: One sentence. It becomes the excerpt in the list and the meta description.
tags:
  - "synchronization"
  - "PLL"
---

Ordinary Markdown. Inline maths like $\omega_k = 2\pi f_k$ and display maths:

$$
\dot{\theta}_k = \omega_k + \frac{K}{n_k}\sum_l \sin\!\left(\theta_l(t-\tau) - \theta_k(t)\right)
$$
```

That is the whole contract. `date_approx: true` prints the month only, for posts whose exact
day is not known.

### Holding a post back

**This repository is public.** A draft pushed once stays in the history, in forks and in
GitHub's caches — deleting it afterwards does not undo that. So unpublished work is kept out
of git entirely rather than merely hidden from the built site.

Put the post in `content/drafts/` instead of `content/posts/`, and any assets it needs in
`static-drafts/` instead of `static/`. Both directories are listed in `.gitignore`, so they
stay on this machine. Everything in `content/drafts/` is treated as a draft regardless of front
matter; `draft: true` in `content/posts/` also still works, but only the directory can be
git-ignored, so prefer the directory.

A draft is excluded from the build completely — no page, no feed entry, no tag, no sitemap
line — and each build prints its title so you do not forget it is waiting:

```
  draft (not published): A lattice with two coupling channels, live in the browser
built 9 posts, 3 pages, 31 tags -> docs/ (112 files)
```

To read one before deciding: `python3 build.py --drafts --serve`. That output is for your eyes
only. It writes `docs/.contains-drafts` as a tripwire, and the pre-push hook refuses to push
while that file exists.

**To publish a draft:** move it from `content/drafts/` to `content/posts/` (and its assets from
`static-drafts/` to `static/`), remove `draft: true` if present, rebuild, commit.

### The pre-push guard

`.githooks/pre-push` refuses a push if anything unpublished would go with it. Enable it once
per clone:

```bash
git config core.hooksPath .githooks
```

It blocks on three conditions: a draft file is tracked by git; `docs/` was built with
`--drafts`; or a draft's slug appears anywhere in `docs/`. The third is the one that actually
matters, because it tests the built output rather than trusting the process.

### Maths

Write LaTeX between `$…$` and `$$…$$`. The build hides it from the Markdown parser (which would
otherwise eat `_` and `*`), puts the source into the page, and [KaTeX](https://katex.org)
renders it in the browser. KaTeX is vendored under `theme/static/vendor/katex/`, so nothing is
fetched from a CDN.

KaTeX covers nearly all of AMS-LaTeX. Two things to know:

- `\begin{equation}` wrappers are unnecessary — `$$…$$` already means display mode. Use
  `\begin{aligned}` for multi-line equations.
- `\label` and `\eqref` do not exist. Number an equation with `\tag{3}` if you want a number.

If an expression fails to parse, KaTeX leaves the source visible and marks the span; it never
takes the page down.

### Images

```markdown
![The caption, which is also the alt text](/media/my-post-slug/figure-name.png)
```

An image alone in a paragraph becomes a `<figure>` with the alt text as the caption. Put the
file in `static/media/my-post-slug/`.

### Interactive panels

A self-contained HTML tool goes in `static/tools/<name>/index.html` and is embedded in a post
with:

```html
<div class="embed" data-embed>
  <iframe class="embed__frame" src="/tools/<name>/" loading="lazy" title="…"></iframe>
</div>
```

The iframe isolates the tool's stylesheet from the site's — a tool's CSS is written against
`body` and bare element selectors, and would otherwise fight the site's. For the height and
theme to follow the page, the tool needs the small bridge script at the bottom of
`static-drafts/tools/lattice-bench/index.html` — copy it into any new tool.

## Publish it

The site is configured for the custom domain **lucaswetzel.de**. `build.py` writes
`docs/CNAME` from `custom_domain:` in `content/site.yaml`.

There are two ways to serve it, and you should pick one:

**A. GitHub Actions (set up here).** `.github/workflows/pages.yml` runs `build.py` on every push
to `main` and deploys the result. You can then edit a Markdown file on github.com and the site
rebuilds itself. In *Settings → Pages*, set **Source: GitHub Actions**.

**B. Straight from the branch.** In *Settings → Pages*, set **Source: Deploy from a branch**,
branch `main`, folder `/docs`. No CI runs; whatever is committed in `docs/` is what is served,
so you must run `python3 build.py` before committing.

`docs/` is committed either way, so B works as a fallback if the workflow ever breaks.

### DNS

For `lucaswetzel.de` at your registrar:

| Record | Name | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `<your-github-username>.github.io.` |

Then tick *Enforce HTTPS* in Settings → Pages once the certificate is issued.

## What this site does not do

No cookies, no analytics, no third-party requests at page load. Fonts (Archivo, Source Serif 4,
IBM Plex Sans / Sans Condensed / Mono) are downloaded from Google Fonts once, at build time, and
served from this domain; KaTeX likewise. That is deliberate — embedding Google Fonts from
Google's servers has been held to violate the GDPR for German site operators (LG München I,
3 O 17493/20). Because nothing is tracked, the site needs no cookie banner, which is why the old
*Cookie Policy (EU)* page is gone.

## Where the content came from

See [MIGRATION.md](MIGRATION.md). Short version: the 2018 WordPress XML export plus the pages
recovered from the Internet Archive, converted to Markdown once by a script that is not part of
this repository. The equations were recovered as LaTeX source, not as images.
