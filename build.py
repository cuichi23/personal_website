#!/usr/bin/env python3
"""Build the static site into docs/.

    python3 build.py            build once
    python3 build.py --serve    build, then serve docs/ on http://localhost:8000

Content lives in content/ as Markdown with YAML front matter. Math is written as
$…$ (inline) and $$…$$ (display) and is rendered in the browser by KaTeX, so the
LaTeX in a post stays LaTeX in the source file.
"""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import html
import os
import re
import shutil
import sys
import xml.sax.saxutils as sax

import markdown
import yaml
from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(ROOT, "content")
THEME = os.path.join(ROOT, "theme")
STATIC = os.path.join(ROOT, "static")
STATIC_DRAFTS = os.path.join(ROOT, "static-drafts")
OUTPUT = os.path.join(ROOT, "docs")
DRAFT_MARKER = os.path.join(OUTPUT, ".contains-drafts")

warnings: list[str] = []


def warn(message: str) -> None:
    warnings.append(message)


# --------------------------------------------------------------------- sources

class Doc:
    """A Markdown source file: front matter plus rendered body."""

    def __init__(self, path: str):
        self.path = path
        raw = open(path, encoding="utf-8").read()
        self.meta, body = split_front_matter(raw, path)
        self.slug = self.meta.get("slug") or slugify(os.path.basename(path))
        self.title = self.meta.get("title", self.slug)
        self.summary = self.meta.get("summary", "")
        self.tags = self.meta.get("tags", [])
        self.date = parse_date(self.meta.get("date"))
        self.date_approx = bool(self.meta.get("date_approx"))
        self.kind = self.meta.get("kind", "")
        self.venue = self.meta.get("venue", "")
        self.venue_url = self.meta.get("venue_url", "")
        self.arxiv = self.meta.get("arxiv", "")
        self.authors = self.meta.get("authors", "")
        self.draft = bool(self.meta.get("draft"))
        self.body = render_markdown(body, source=path)
        self.text = strip_tags(self.body)

    @property
    def url(self) -> str:
        return self.meta["url"]


def split_front_matter(raw: str, path: str) -> tuple[dict, str]:
    if not raw.startswith("---"):
        warn(f"{rel(path)}: no front matter")
        return {}, raw
    _, block, body = raw.split("---", 2)
    return yaml.safe_load(block) or {}, body


def parse_date(value) -> dt.date | None:
    if isinstance(value, dt.datetime):
        return value.date()
    if isinstance(value, dt.date):
        return value
    if isinstance(value, str) and value.strip():
        return dt.date.fromisoformat(value.strip()[:10])
    return None


def slugify(text: str) -> str:
    text = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", os.path.splitext(text)[0])
    text = re.sub(r"^\d+-", "", text)
    return re.sub(r"[^a-z0-9-]+", "-", text.lower()).strip("-")


def rel(path: str) -> str:
    return os.path.relpath(path, ROOT)


# ------------------------------------------------------------------- Markdown

# python-markdown uses \x02…\x03 for its own placeholders and strips control
# characters out of attribute values, so the sentinel has to be plain text.
MATH_TOKEN = "qqmathqq{}qq"
MATH_INLINE = re.compile(r"(?<![\\$])\$(?!\s)((?:[^$\\\n]|\\.)+?)(?<!\s)\$(?!\d)")
MATH_DISPLAY = re.compile(r"\$\$(.+?)\$\$", re.S)
FENCE = re.compile(r"```.*?```", re.S)


def protect_math(text: str) -> tuple[str, list[tuple[str, str]]]:
    """Hide math from the Markdown parser: `_`, `*` and `\\` mean other things there.

    Each stashed fragment is kept twice: as the markup that goes into the page, and
    as plain text for places that cannot hold markup, such as an image alt.
    """
    kept: list[tuple[str, str]] = []

    def stash(markup: str, plain: str) -> str:
        kept.append((markup, plain))
        return MATH_TOKEN.format(len(kept) - 1)

    text = FENCE.sub(lambda m: stash(m.group(0), m.group(0)), text)
    text = MATH_DISPLAY.sub(
        lambda m: stash(math_markup(m.group(1).strip(), display=True), m.group(1).strip()), text)
    text = MATH_INLINE.sub(
        lambda m: stash(math_markup(m.group(1), display=False), m.group(1)), text)
    return text, kept


def math_markup(tex: str, display: bool) -> str:
    """Keep the LaTeX source in the document; KaTeX renders it in the browser.

    Without JavaScript the delimited source stays visible, which is the honest
    fallback for a maths-heavy site.
    """
    kind = "display" if display else "inline"
    fence = "$$" if display else "$"
    return (f'<span class="math math--{kind}" data-tex="{html.escape(tex, quote=True)}">'
            f"{fence}{html.escape(tex)}{fence}</span>")


def restore_math(html_text: str, kept: list[tuple[str, str]], plain: bool = False) -> str:
    for i, (markup, source) in enumerate(kept):
        html_text = html_text.replace(MATH_TOKEN.format(i),
                                      html.escape(source) if plain else markup)
    return html_text


MD = markdown.Markdown(
    extensions=["extra", "sane_lists", "admonition", "toc"],
    extension_configs={"toc": {"permalink": False}},
)

IMG_PARAGRAPH = re.compile(r"<p>\s*(<img [^>]*>)\s*</p>")
DISPLAY_PARAGRAPH = re.compile(
    r"<p>\s*(<span class=\"math math--display\".*?</span>)\s*</p>", re.S)
IMG_ATTRS = re.compile(r'(\w[\w-]*)="([^"]*)"')


def figure_markup(img_tag: str, source: str, kept: list[tuple[str, str]]) -> str:
    attrs = dict(IMG_ATTRS.findall(img_tag))
    src = attrs.get("src", "")
    caption = attrs.get("alt", "").strip()
    caption_html = (f"<figcaption>{restore_math(caption, kept)}</figcaption>"
                    if caption else "")
    alt = html.escape(strip_tags(restore_math(caption, kept, plain=True)), quote=True)
    if src.startswith("/") and not any(
            os.path.exists(os.path.join(base, src.lstrip("/")))
            for base in (STATIC, STATIC_DRAFTS)):
        warn(f"{rel(source)}: missing image {src}")
        return (f'<figure class="figure figure--missing">'
                f'<div class="figure__placeholder"><span class="figure__label">'
                f"figure not recovered</span><code>{html.escape(os.path.basename(src))}"
                f"</code></div>{caption_html}</figure>")
    return (f'<figure class="figure"><img src="{src}" alt="{alt}" loading="lazy">'
            f"{caption_html}</figure>")


def render_markdown(text: str, source: str) -> str:
    protected, kept = protect_math(text)
    MD.reset()
    out = MD.convert(protected)
    out = IMG_PARAGRAPH.sub(lambda m: figure_markup(m.group(1), source, kept), out)
    out = restore_math(out, kept)
    out = DISPLAY_PARAGRAPH.sub(
        lambda m: m.group(1).replace("<span", "<div", 1)[:-len("</span>")] + "</div>", out)
    return out


TAG_RE = re.compile(r"<[^>]+>")


def strip_tags(text: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(TAG_RE.sub(" ", text))).strip()


def excerpt(doc: Doc, limit: int = 220) -> str:
    if doc.summary:
        return doc.summary
    words, out = doc.text.split(), ""
    for word in words:
        if len(out) + len(word) + 1 > limit:
            return out + "…"
        out = f"{out} {word}".strip()
    return out


# ------------------------------------------------------------------- rendering

def load_all(include_drafts: bool = False) -> dict:
    site = yaml.safe_load(open(os.path.join(CONTENT, "site.yaml"), encoding="utf-8"))

    sections = [Doc(p) for p in sorted(glob_md(os.path.join(CONTENT, "home")))]
    sections.sort(key=lambda d: d.meta.get("order", 999))
    for section in sections:
        section.meta["url"] = f"/#{section.slug}"

    posts = [Doc(p) for p in glob_md(os.path.join(CONTENT, "posts"))]
    # content/drafts/ is git-ignored: nothing in it may reach the public repository
    drafts = [Doc(p) for p in glob_md(os.path.join(CONTENT, "drafts"))]
    for draft in drafts:
        draft.draft = True
    posts += drafts

    held_back = [p for p in posts if p.draft]
    if not include_drafts:
        posts = [p for p in posts if not p.draft]
    for held in held_back:
        print(f"  draft (not published): {held.title}")
    posts.sort(key=lambda d: (d.date or dt.date.min), reverse=True)
    for post in posts:
        post.meta["url"] = f"/projects/{post.slug}/"

    # One entry per published paper. Newest first, and the year alone is enough
    # of a date for a paper, so no day is required in the front matter.
    research = [Doc(p) for p in glob_md(os.path.join(CONTENT, "research"))]
    research.sort(key=lambda d: (d.date or dt.date.min), reverse=True)
    for entry in research:
        entry.meta["url"] = f"/research/#{entry.slug}"

    pages = [Doc(p) for p in glob_md(os.path.join(CONTENT, "pages"))]
    pages.sort(key=lambda d: d.meta.get("nav_order", 999))
    for page in pages:
        page.meta["url"] = f"/{page.slug}/"

    tags: dict[str, list[Doc]] = {}
    for post in posts:
        for tag in post.tags:
            tags.setdefault(tag, []).append(post)

    return {"site": site, "sections": sections, "posts": posts, "pages": pages,
            "research": research,
            "tags": dict(sorted(tags.items(), key=lambda kv: (-len(kv[1]), kv[0].lower())))}


# The order the paper entries appear in, and the heading each group gets.
RESEARCH_GROUPS = [
    ("journal", "Journal articles"),
    ("conference", "Conference papers"),
    ("thesis", "Theses and preprints"),
]


def glob_md(directory: str) -> list[str]:
    if not os.path.isdir(directory):
        return []
    return [os.path.join(directory, n) for n in sorted(os.listdir(directory))
            if n.endswith(".md")]


def tag_slug(tag: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", tag.lower()).strip("-")


def format_date(doc: Doc) -> str:
    if not doc.date:
        return ""
    return doc.date.strftime("%B %Y") if doc.date_approx else doc.date.strftime("%-d %B %Y")


def asset_version(*relative: str) -> str:
    """Short digest of the theme assets, appended to their URLs.

    Without it a browser keeps serving yesterday's stylesheet after a deploy.
    """
    digest = hashlib.sha256()
    for name in relative:
        path = os.path.join(THEME, "static", name)
        if os.path.exists(path):
            digest.update(open(path, "rb").read())
    return digest.hexdigest()[:8]


def make_env() -> Environment:
    env = Environment(loader=FileSystemLoader(os.path.join(THEME, "templates")),
                      undefined=StrictUndefined, trim_blocks=True, lstrip_blocks=True)
    env.filters["tag_slug"] = tag_slug
    env.filters["excerpt"] = excerpt
    env.filters["nice_date"] = format_date
    return env


def write(path: str, text: str) -> None:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def emit(env: Environment, template: str, out_path: str, **context) -> None:
    write(os.path.join(OUTPUT, out_path), env.get_template(template).render(**context))


def copy_tree(src: str, dst: str) -> None:
    if os.path.isdir(src):
        shutil.copytree(src, dst, dirs_exist_ok=True)


# ------------------------------------------------------------------ feed & maps

def rfc822(date: dt.date) -> str:
    return dt.datetime.combine(date, dt.time(12, 0)).strftime("%a, %d %b %Y %H:%M:%S +0000")


def build_feed(data: dict) -> str:
    site = data["site"]
    base = site["url"].rstrip("/")
    items = []
    for post in data["posts"][:20]:
        items.append(f"""  <item>
    <title>{sax.escape(post.title)}</title>
    <link>{base}{post.url}</link>
    <guid isPermaLink="true">{base}{post.url}</guid>
    <pubDate>{rfc822(post.date)}</pubDate>
    <description>{sax.escape(excerpt(post))}</description>
  </item>""")
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>{sax.escape(site["title"])}</title>
  <link>{base}/</link>
  <atom:link href="{base}/feed.xml" rel="self" type="application/rss+xml"/>
  <description>{sax.escape(site["description"])}</description>
  <language>en</language>
{chr(10).join(items)}
</channel>
</rss>
"""


def build_sitemap(data: dict, urls: list[str]) -> str:
    base = data["site"]["url"].rstrip("/")
    entries = "\n".join(f"  <url><loc>{base}{u}</loc></url>" for u in urls)
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            f"{entries}\n</urlset>\n")


# ------------------------------------------------------------------------ build

def build(include_drafts: bool = False) -> None:
    data = load_all(include_drafts)
    env = make_env()
    site = data["site"]

    if os.path.isdir(OUTPUT):
        shutil.rmtree(OUTPUT)
    os.makedirs(OUTPUT)

    common = {"site": site, "posts": data["posts"], "pages": data["pages"],
              "tags": data["tags"], "sections": data["sections"],
              "research": data["research"], "groups": RESEARCH_GROUPS,
              "now": dt.date.today(),
              "asset_v": asset_version("css/site.css", "css/fonts.css", "js/site.js", "js/gate.js")}

    emit(env, "home.html", "index.html", page_id="home", **common)
    emit(env, "projects.html", "projects/index.html", page_id="projects", **common)
    emit(env, "research.html", "research/index.html", page_id="research", **common)
    for post in data["posts"]:
        emit(env, "post.html", f"projects/{post.slug}/index.html",
             page_id="projects", post=post, **common)
    for page in data["pages"]:
        emit(env, page.meta.get("template", "page.html"), f"{page.slug}/index.html",
             page_id=page.slug, page=page, **common)
    emit(env, "tags.html", "tags/index.html", page_id="projects", **common)
    for tag, tagged in data["tags"].items():
        emit(env, "tag.html", f"tags/{tag_slug(tag)}/index.html",
             page_id="projects", tag=tag, tagged=tagged, **common)
    emit(env, "404.html", "404.html", page_id="404", **common)

    copy_tree(os.path.join(THEME, "static"), os.path.join(OUTPUT, "assets"))
    copy_tree(STATIC, OUTPUT)
    if include_drafts:
        # assets that belong to held-back posts, e.g. an interactive panel
        copy_tree(STATIC_DRAFTS, OUTPUT)

    urls = ["/", "/research/", "/projects/", "/tags/"]
    urls += [p.url for p in data["posts"]] + [p.url for p in data["pages"]]
    urls += [f"/tags/{tag_slug(t)}/" for t in data["tags"]]
    write(os.path.join(OUTPUT, "feed.xml"), build_feed(data))
    write(os.path.join(OUTPUT, "sitemap.xml"), build_sitemap(data, urls))
    write(os.path.join(OUTPUT, "robots.txt"),
          f"User-agent: *\nAllow: /\nSitemap: {site['url'].rstrip('/')}/sitemap.xml\n")
    write(os.path.join(OUTPUT, ".nojekyll"), "")
    if include_drafts:
        # a tripwire the pre-push hook looks for: this docs/ must never be deployed
        write(DRAFT_MARKER, "This build includes drafts. Do not commit or deploy it.\n")
    if site.get("custom_domain"):
        write(os.path.join(OUTPUT, "CNAME"), site["custom_domain"] + "\n")

    pages_built = sum(len(files) for _, _, files in os.walk(OUTPUT))
    print(f"built {len(data['posts'])} posts, {len(data['research'])} paper entries, "
          f"{len(data['pages'])} pages, {len(data['tags'])} tags "
          f"-> {rel(OUTPUT)}/ ({pages_built} files)")
    for message in warnings:
        print(f"  warning: {message}")


def serve(port: int = 8000) -> None:
    import http.server
    import socketserver

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **kw):
            super().__init__(*a, directory=OUTPUT, **kw)

        def log_message(self, *a):
            pass

    class Server(socketserver.TCPServer):
        allow_reuse_address = True  # so a restart does not trip over TIME_WAIT

    try:
        httpd = Server(("", port), Handler)
    except OSError as err:
        print(f"cannot serve on port {port}: {err}\n"
              f"something else is already listening there — try --port {port + 1}")
        sys.exit(1)
    with httpd:
        print(f"serving {rel(OUTPUT)}/ on http://localhost:{port}  (ctrl-c to stop)")
        httpd.serve_forever()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--serve", action="store_true", help="serve docs/ after building")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--drafts", action="store_true",
                        help="also build posts marked draft: true (never do this for a deploy)")
    args = parser.parse_args()
    build(args.drafts)
    if args.serve:
        try:
            serve(args.port)
        except KeyboardInterrupt:
            sys.exit(0)
