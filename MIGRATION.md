# Where the content came from

The old site ran WordPress at `lucas-wetzel.de` from 2016 until it went down some time after
March 2025. This repository was seeded from two sources.

## Sources

**1. The local backup** — `.../Miete&Privat/Website/lucaswetzel.wordpress.2018-09-26.xml`.
A WordPress WXR export: 12 published posts, 2 pages, 8 unfinished drafts. Its blog posts still
carry maths as `$…$` source, because the site used the `[latexpage]` shortcode at the time.

**2. The Internet Archive** — captures of `lucas-wetzel.de` from 2022 to 2024. The site kept
running for six years after that backup, and six posts plus most of the CV exist only here:

| Recovered from the archive | Note |
|---|---|
| Ising Machines | ~100 equations; the largest post on the site |
| Synchronization of rhythm in human, human–machine and machine–machine interactions | |
| Control theory of mutual synchronization in networks of delay-coupled PLLs | |
| On the differences between universal emergent time (UEC) and UTC | |
| Howto run independent voltage noise sources (IID and GWN) in LTSpice using Bv-sources | |
| Links | now folded into Contact as well |
| Publications, Talks & posters, Patents, Education & work, Contact | all substantially longer than in the 2018 backup |

By 2022 the site rendered maths with the WP-QuickLaTeX plugin, which turns each formula into a
PNG — but keeps the LaTeX source in the image's `alt` attribute. Every equation on this site was
recovered from there as **source**, not as a picture, including the `\tag{n}` numbering.

## Decisions worth knowing about

**Which version won.** Where a page exists in both sources, the archived 2024 version was used,
because it is later and longer. The exceptions are three maths-heavy blog posts
(*Self-organized synchronization in electronic systems*, *Spice simulations of DPLL systems*,
*Science Slam @Elbhangfest*) where the 2018 XML is identical in substance but carries the maths
as LaTeX rather than as images, so the XML was used instead.

**Dates.** Exact publication dates come from the archived RSS feed. Four posts from 2022 have no
recoverable date: the feed captures predate them and the theme printed no date. All four existed
by 24 May 2022, and their figures were uploaded in April–July 2022, so they carry
`date: 2022-05-01` with `date_approx: true`, which makes the site print "May 2022" rather than a
made-up day. **If you remember the real dates, correct them in the front matter.**

**Structure.** The old nav was Home / Current projects / Contact / Impressum, where Home was the
`main` category archive and Current projects was the `blog` category archive. That is preserved:
the eight `main` posts are now sections of the home page (in a deliberate CV order set by
`order:` in their front matter, not the old reverse-date order), and the blog lives at
`/projects/`.

**Drafts.** The eight WordPress drafts are not included. Six were empty — titles only. The
seventh, *Talks*, duplicated part of *Talks & Poster*. The eighth, *Validating self-organized
synchronization against industrial standards*, was later rewritten and published as the UEC/UTC
post, which is here. The empty titles were:

- Basin stability analysis for large networks of mutually delay-coupled oscillators using Lp-Adaptation
- The effects of heterogeneity on synchronization in networks of electronic clocks
- A Fokker-Planck Equation approach to noisy delay-coupled electronic clocks
- Noise in networks of mutually delay-coupled phase-locked loop networks
- Pitch @cfaed summer festival 2017

**Cookie Policy (EU).** Dropped. It existed because the WordPress install set cookies. This site
sets none.

**Impressum.** The design credit now reads "Design & implementation of the previous version of
this site: Deborah Schmidt", which is what it is. Two things to check yourself: §5 TMG asks for a
postal address, and the old Impressum had none; and the contact address is an MPI-PKS one, which
may want updating.

## Figures that could not be recovered

The Internet Archive captured the pages but not most of the uploads folder, and 16 figures are
not in the local backup either. Each one renders as a labelled placeholder that keeps its
original caption, so the posts still read correctly and the gaps are visible rather than silent.
Drop a file into the path below and it appears on the next build.

| Missing file | Post |
|---|---|
| `static/media/self-organized-synchronization-in-electronic-systems/pll-phase-model-schematic.png` | Self-organized synchronization (was `web1.png`, the PLL schematic and phase model) |
| `static/media/synchronization-of-rhythm-.../rhythm-experiment.jpg` | Synchronization of rhythm (was `photo_2022-03-02_09-36-02.jpg`) |
| `static/media/ising-machines/order-parameter-success.svg` | Ising Machines |
| `static/media/ising-machines/order-parameter-failed.svg` | Ising Machines |
| `static/media/ising-machines/order-parameter.svg` | Ising Machines |
| `static/media/ising-machines/signals.svg` | Ising Machines |
| `static/media/ising-machines/network-topology.png` | Ising Machines |
| `static/media/ising-machines/network-topology-solution.png` | Ising Machines |
| `static/media/ising-machines/coupling-ramp.png` | Ising Machines |
| `static/media/ising-machines/phase-relations-no-inertia.png` | Ising Machines |
| `static/media/ising-machines/order-parameter-no-inertia.png` | Ising Machines |
| `static/media/ising-machines/all-order-parameters-no-inertia.png` | Ising Machines |
| `static/media/ising-machines/kuramoto-oscillators-shil.png` | Ising Machines |
| `static/media/ising-machines/pll-architecture-shil.png` | Ising Machines |
| `static/media/ising-machines/pll-architecture-shil-delay.png` | Ising Machines |
| `static/media/ising-machines/pll-architecture-shil-nolf-delay.png` | Ising Machines |

Most of the Ising figures were generated by the runs under
`anabrid_LW/Kuramoto_MAX-CUT/`; two of them (`all-order-parameters.svg`, `phase-relations.svg`)
were found there and are already in place, so the rest may be reproducible from the same scripts.

## Fixed along the way

- `$\omeg_k$` in *Spice simulation … LTC6900* was a typo for `\omega_k` and would have failed to
  render. Corrected.
- The bibliography under Publications had been pasted into WordPress with hard-wrapped lines,
  which split entries mid-author-list. The wraps were joined.
- *Spice simulation … LTC6900* ended with a second, uncaptioned copy of Fig. 1, left over from
  a WordPress gallery block. Dropped. Say the word and it goes back.
- Old permalinks (`/2016/…`, `/2017/…`, `/2018/…`, `/2022/…`) are gone. Internal links between
  posts were rewritten; `docs/404.html` explains the move to anyone arriving on a stale link.
