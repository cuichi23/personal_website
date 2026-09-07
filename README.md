# lucaswetzel.de

The static site for lucaswetzel.de. Posts are Markdown, maths is LaTeX, the build is one
Python script, and the output is plain HTML that GitHub Pages can serve as it is.

```
build.py            the whole generator, ~350 lines
content/            everything you edit
  site.yaml           title, hero copy, footer links, domain
  home/               the sections of the home page, in `order:` order
  research/           one file per published paper -> /research/
  posts/              the blog, one file per post
  pages/              contact, links, impressum, oscillatory-computing
static/             images and interactive tools, copied to the site root as-is
tools/pack_panel.py   encrypts the gated panel into static/tools/
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

## Add a paper to /research/

Create `content/research/NN-some-slug.md`. `NN` only orders files on disk; the page
itself sorts by date, newest first, inside each group.

```markdown
---
title: "Network synchronization revisited: time delays in mutually coupled oscillators"
slug: "network-synchronization-revisited"
date: 2022-07-01
kind: "journal"          # journal | conference | thesis
venue: "IEEE Access 10, 80027-80045 (2022)"
venue_url: "https://ieeexplore.ieee.org/document/9837916"
arxiv: "1906.02643"    # optional; omit when there is no preprint
authors: "L. Wetzel, D. A. Prousalis, ..."
---

Three to five sentences: what the paper asks, what came out, what the main result is.
```

Quote every value. Two of the titles contain a colon, which YAML would otherwise read as a
mapping. Only the **year** of `date` is displayed; the rest of it is the sort key. Leave
`venue_url` empty for work with no landing page and the venue is rendered as plain text
rather than as a dead link. `kind` picks the group heading, and the groups themselves are
`RESEARCH_GROUPS` in `build.py`.

`arxiv` takes the bare identifier and renders `arXiv:<id>` after the venue, linking to
`https://arxiv.org/abs/<id>`. The version of record stays first; the preprint is the copy
most readers can actually open. Four of these papers have one, checked against the arXiv
API: 1908.11085, 2107.06136, 1906.02643, and 1206.2288, which is itself a preprint entry
and so carries the identifier as its venue instead. Nothing else in the list is on arXiv.

Each entry gets an anchor at `/research/#<slug>`, so a single entry can be linked to
without giving it a page of its own.

## The gated panel on /oscillatory-computing/

**This repository is public.** A tool dropped into `static/` as plain HTML is readable by
anyone who guesses the URL, whatever the page in front of it does. So the panel is shipped
as AES-256-GCM ciphertext and decrypted in the reader's browser, from a key derived with
PBKDF2 from the password they type. Nothing is sent anywhere, and a wrong password fails on
the authentication tag rather than on a comparison in JavaScript.

**Two things are encrypted, not one.** The simulator is the obvious one. The prose that
describes the model is the one that is easy to forget, because it looks like ordinary page
content: an equation and three paragraphs on a public page give away as much as the panel
does. Both go into the same ciphertext, and the public page above the glass says only what
kind of thing is behind it.

The prose source lives in `content/gated/`, which `.gitignore` excludes for the same reason
`content/drafts/` is excluded. **Only the ciphertext under `static/tools/` may be committed,
never the plaintext it was made from.**

Both plaintext sources live in `content/gated/`, so the packer needs no arguments:

| file | what it is |
|---|---|
| `content/gated/panel.html` | the simulator, copied from wherever the research lives |
| `content/gated/oscillatory-computing.md` | the prose shown above it, once unlocked |

**To set or change the password:**

```bash
python3 tools/pack_panel.py     # asks twice, echoes nothing
python3 build.py                # NOT optional, see below
python3 tools/check_panel.py    # does the new password open the built copy?
```

**The build step is not optional and its absence is silent.** The packer writes
`static/tools/`; only `build.py` copies that into `docs/`, and `docs/` is what GitHub Pages
serves. Re-key without rebuilding and the site keeps serving the previous ciphertext, so the
page reports your correct new password as wrong. It cannot tell the two cases apart: a stale
payload and a wrong password both fail on the same authentication tag.

Two things now catch that. `tools/check_panel.py` answers the question directly, on the
built copy by default or on `--live` for what the domain is actually serving. And the
pre-push hook compares `static/` against `docs/` and refuses the push when they differ.

Do not pass `--password` on the command line unless a script needs it. An argument is
written to your shell history and is visible in the process list while the packer runs,
which is not acceptable for the one secret protecting the whole payload. The prompt exists
so that never has to happen. Twelve characters is the floor, and several unrelated words
beat one clever one; see the cost note below for why.

`--applet` and `--intro` override the defaults if a source sits elsewhere. `--out` writes
the payload somewhere other than `static/tools/`, which is useful for testing without
disturbing the live one.

That writes `static/tools/oscillatory-computing/payload.json`. The password is not stored
anywhere in this repository; the only way to change it is to re-run the packer. Refresh
`content/gated/panel.html` from the master copy whenever the simulator changes, then repack:
the payload is a build artefact, not a source.

The packer also strips the applet's Google Fonts tags and points it at this domain's own copies of the
same faces, because the no-third-party-requests rule below applies inside the iframe too.
The intro is rendered through `build.render_markdown`, so it is typeset exactly as a page
body would be and `renderMathIn` in `site.js` typesets its equations once it arrives.

The blurred preview is `static/tools/oscillatory-computing/poster.jpg`. It is blurred **in the
file**, not only in CSS, so turning the stylesheet off reveals nothing, and it is cropped
above and below so that no text appears in it at all. The frosted glass on top of it is
`.gate__glass` in `site.css`.

### Checking that nothing leaked

```bash
bash tools/leakcheck.sh
```

It greps every file git would actually publish, tracked and untracked minus ignored, for
phrases that appear only in the gated work, and reports the public page separately from
everything else. The phrases live in `content/gated/leak-terms.txt`, one per line, because a
list of them is itself a description of the model. Keep words that are already public
elsewhere on this site out of that file: `Kuramoto` and `order parameter` both appear in the
Ising-machines post and would drown the signal in matches you do not care about.

Run it before every push that touches the gated area.

### What publishing the ciphertext actually costs

Encryption makes the payload unreadable. It does not make it temporary. Once pushed, it is
in the history, in forks and in third-party mirrors, and no later deletion reaches those.
So the password is the only thing standing between an archived copy and the content, for as
long as the archive exists, and an attacker gets to guess offline and at leisure. At 310,000
PBKDF2 iterations a guess costs a fraction of a second, which stops a wordlist and does not
stop a targeted guess at a memorable phrase. **Use a passphrase with real entropy, several
unrelated words, used nowhere else.** If the work must not be readable even years later,
do not commit the ciphertext at all; see the deployment note below.

Web Crypto needs a secure context. The page works on `https://lucaswetzel.de` and on
`http://localhost`, and says so rather than throwing if it is opened anywhere else.

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

### Where the ciphertext should live

Three options, in increasing order of how well they hold up over time.

**A. Commit the ciphertext to this public repository.** What is set up now. Simplest, and
the payload is unreadable without the password. The cost is permanence: the blob is in the
history and in every fork and mirror from the moment it is pushed, and the password is the
only thing protecting it for as long as those copies exist.

**B. Keep the source private and inject the payload at deploy time.** The work, the applet
and the gated prose live in a separate private repository. This repository holds no
ciphertext at all; the GitHub Actions workflow checks the private repo out with a deploy key
and runs `tools/pack_panel.py` before `build.py`. Nothing unreadable-but-permanent is ever
published. Two things have to change for it to work: `docs/` must stop being committed and
be added to `.gitignore`, because a committed build directory would carry the payload
straight back into the public history, and *Settings -> Pages* must be set to **Source:
GitHub Actions**, since the deploy-from-a-branch fallback described below cannot run the
packer.

**C. Do not publish it yet.** Put the payload in `static-drafts/` and the page in
`content/drafts/`, both of which are git-ignored and guarded by the pre-push hook, and serve
it with `python3 build.py --drafts --serve` when someone needs to see it. Nothing leaves
this machine. This is the right answer while a manuscript is under review and there is no
particular reason for the panel to be reachable from the open internet.

The choice is about time, not about strength. B and C are the ones that stay safe if the
password is ever guessed, reused, or written down somewhere it should not be.

### The pre-push guard

`.githooks/pre-push` refuses a push if anything unpublished would go with it. Enable it once
per clone:

```bash
git config core.hooksPath .githooks
```

It blocks on four conditions: a draft file is tracked by git; `docs/` was built with
`--drafts`; a draft's slug appears anywhere in `docs/`; or a payload in `docs/` differs from
the one in `static/`, which means a re-key never reached the built site. The last two are the
ones that actually matter, because they test the built output rather than trusting the
process.

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
