---
title: "Stumme Karte: a blind map of Europe"
slug: europe-blind-map
date: 2026-11-23
summary: >-
  An interactive blind map of Europe. The outlines, rivers, mountain ridges,
  capital dots and landmark squares are all there; the names are not. Five of
  them arrive at a time as chips you drag to where they belong, and a name
  that lands correctly stays on the map. 170 names in German, English, Spanish
  and French, built from public-domain Natural Earth data on an equal-area
  projection.
tags:
  - "geography"
  - "teaching"
  - "maps"
  - "interactive"
---

## Why this exists {: #why }

My children are learning the geography of Europe, and the exercise their
school uses is the old one: a *stumme Karte*, a blind map. The map keeps
everything that is drawn — coastlines, borders, rivers, mountain ridges, a dot
for every capital — and loses everything that is written. You get the names on
a separate list and put them back where they belong.

It is a good exercise because it separates two things that a labelled map
mixes up. Recognizing a shape is not the same as knowing where it is, and a
map with the names on it lets you do neither: your eye reads the word and
stops. Take the word away and the shape has to carry the work.

The paper version has two problems. It is single-use, and it needs someone to
check it. This one has neither. It picks five names, it knows where each of
them belongs, it says so immediately, and it remembers which ones you have
already placed so the next five are more likely to be new ground. Nothing
leaves the page: the progress lives in your own browser and the map is one
file served from this site.

<div class="ebm" data-map="/media/europe-blind-map/map.json"><noscript>The map
needs JavaScript. / Die Karte braucht JavaScript.</noscript></div>

<script defer src="/media/europe-blind-map/applet.js"></script>

## So geht es {: #anleitung }

*Für die Kinder, auf Deutsch.* Unten liegen fünf Namen. Zieh jeden Namen an
die Stelle, an die er gehört, und lass ihn dort los. Auf einem Handy oder
Tablet geht es auch so: erst den Namen antippen, dann die Karte. Wer lieber
die Tastatur nimmt, wählt den Namen mit Tab und Enter, schiebt das rote Kreuz
mit den Pfeiltasten (mit Shift geht es schneller) und legt den Namen mit Enter
ab.

Richtig abgelegte Namen bleiben auf der Karte stehen. Die Karte füllt sich
also, während du spielst — das ist der eigentliche Zweck. Oben wählst du das
Thema (Länder, Hauptstädte, Meere, Flüsse, Gebirge, Inseln und Halbinseln,
Sehenswürdigkeiten) und die Stufe: **Leicht** fragt nur die großen und
bekannten Dinge, **Mittel** nimmt einiges dazu, **Alles** auch Montenegro,
Rügen und den Guadalquivir. Mit **DE · EN · ES · FR** wechselst du die
Sprache — der Karte und der Namen —, mit **Zeig es mir** gibst du bei einem
Namen auf, und ganz rechts steht, wie viele der 170 Namen du schon einmal
richtig hattest.

**Zoomen und Vollbild.** Oben rechts in der Karte sitzen vier Knöpfe:
Vollbild, größer, kleiner, und — sobald die Karte vergrößert ist — zurück zur
ganzen Karte. Am Rechner zoomst du auch mit **Strg und dem Mausrad**, auf dem
Handy **mit zwei Fingern**. Ist die Karte vergrößert, schiebst du sie mit einem
Finger (oder mit gedrückter Maustaste) herum; mit der Tastatur geht es mit
`+`, `-`, `0` und, solange kein Name gewählt ist, mit den Pfeiltasten. Das
Vollbild lohnt sich auf einem kleinen Bildschirm, und für Luxemburg oder
Montenegro lohnt sich das Zoomen immer.

Zwei Regeln, die die Karte streng nimmt, weil sie genau das sind, was man
lernen soll: **ein Meer liegt im Wasser**, also zählt ein Treffer auf Sizilien
nicht als Mittelmeer, und **eine Insel liegt an Land**, also zählt ein Treffer
neben Kreta nicht als Kreta.

## What is on the map {: #contents }

Nothing on the map is labelled, so every symbol has to be readable on its own.

| Symbol | What it is |
|---|---|
| cream outline | a country the quiz asks for |
| grey outline | a country outside Europe, drawn for context only |
| orange dot | a capital city |
| dark blue square | a landmark |
| thin blue line | a river |
| brown line | a mountain ridge |

The 170 names behind those symbols are 42 countries, 42 capitals, 26 rivers,
18 seas and other waters, 16 islands and peninsulas, 16 landmarks and 10
mountain ranges. Each one carries a level from one to three, which is a guess
at how early a child meets it rather than a measure of anything. A country and
its capital are linked both ways, so placing *Oslo* tells you it is the
capital of Norway and placing *Norway* tells you its capital is Oslo.

**Every name exists four times**: German, English, Spanish and French. The two
added later are not a machine translation of the first two. They are a table
in the generator, keyed by the item's id and kept out of the geometry tuples,
because widening 170 positional tuples by two columns is the kind of edit that
silently shifts a latitude. The country-and-capital note is assembled rather
than listed, which turned out to need a little grammar: *capital of the United
Kingdom* is **capital del Reino Unido** and **capitale du Royaume-Uni**, while
Spain takes a bare *de* in both. So the generator carries a second, small table
of the genitive form of each country name in those two languages, and the note
is built from it.

The names can be refreshed without the map. `tools/build_europe_map.py
--relabel` applies the name tables to an existing `map.json` and refuses to
write if a single coordinate changed. That matters because the geometry needs
three public-domain input files that are not in this repository, and correcting
one spelling should not mean downloading 50 MB of coastlines first.

## How it is built {: #build }

The geometry comes from [Natural Earth](https://www.naturalearthdata.com/),
which is in the public domain, by way of the 1:50 m countries, rivers and
lakes files. `tools/build_europe_map.py` in this site's repository projects
them and writes the one file the applet loads.

**The projection is Albers equal-area conic**, with standard parallels at
43° N and 62° N. Equal-area is the point: a child comparing Sweden with Spain
should be comparing the real thing, and the Mercator projection every web map
defaults to would make Scandinavia roughly twice the size it has any right to
be. The price is that shapes are slightly sheared at the edges of the window,
which is the trade every map makes in one direction or the other.

A few decisions worth naming, because they are visible:

- **The window runs from about 26° W to 46° E.** That reaches the Volga and
  the Caucasus but stops short of the Urals, so the Urals are not among the
  mountain ranges the quiz asks for. Putting them in would have meant
  shrinking everything west of Berlin.
- **Rings are cut in latitude and longitude before they are projected.**
  Russia's outline runs all the way to the dateline; projected first and cut
  afterwards, it folds back across the map as one polygon covering most of
  Europe. Cutting first, after unwrapping the longitudes across the
  antimeridian, leaves the European end of it.
- **Hit testing differs by what is being asked for.** A country is hit by
  landing inside its own outline, which the browser answers exactly through
  `isPointInFill`. A river or a mountain ridge is hit by landing within a
  tolerance of its line. A sea, an island or a landmark is a point with a
  radius, and for seas and islands the drop also has to be on the right side
  of the coastline. Countries smaller than a certain area get a small
  tolerance around their label point as well, because Luxembourg is about
  three pixels wide on a phone.
- **The zoom is the `viewBox` and nothing else.** Dragging, tapping and the
  arrow-key crosshair all turn a screen position into a map position through
  `getScreenCTM()`, which already carries the `viewBox`, the element's CSS
  size and any page scaling. Moving the `viewBox` therefore moves the hit
  test with it, and no part of the game had to learn that a zoom exists. To
  hold a point still while zooming about it, the applet projects the same
  screen point before and after the change and shifts the view by the
  difference, which needs no assumption about how the map is laid out — and
  so keeps working in full screen, where the map is letterboxed.
- **Marks are measured in screen pixels, geography in map units.** A capital
  dot drawn at three map units would be two pixels across on a laptop, four
  on a phone and sixteen once you zoom in. So the applet writes the current
  map-units-per-pixel into a CSS variable and every dot, label and line
  thickness is a multiple of it. They come out the same size on screen at any
  width and any zoom, while the coastlines underneath stay geography. This
  replaced a width-based media query that had guessed at the same thing.
- **The mountain ridges are drawn by hand**, as a handful of points each along
  the spine of the range. Natural Earth has no usable range geometry at this
  scale. They are right to within a map's width of line and no better, which
  is enough to point at a range and not enough to trace one.
- **Capitals, landmarks, seas and peninsulas are hand-entered coordinates.**
  That is the part a dataset cannot supply and the part most likely to carry a
  mistake. If something sits in the wrong place, it is mine and I would like
  to hear about it.

At 1:50 m several rivers a German child is expected to know simply are not in
the data — Weser, Main, Meuse, Tiber, Shannon, Guadalquivir, Neman — so the
map does not ask for them. The 1:10 m files would carry them at roughly ten
times the size. That is the next thing I would change.

## What it does not do {: #limits }

It does not teach anything by itself. It asks and it checks, which is a
smaller job, and it is honest about the difference. There is no account, no
timer, no streak and no badge: the only number it keeps is how many of the 170
names you have placed correctly at least once, and a button to throw that away
again.

Full screen comes in two flavours because one of them is not always available.
Where the Fullscreen API works, the browser supplies the backdrop; where it
refuses — an iPhone, mostly, which grants full screen to video and to little
else — the applet pins itself over the page instead. The two end up looking
the same, which is the point, but only the first one hides the browser's own
chrome.
