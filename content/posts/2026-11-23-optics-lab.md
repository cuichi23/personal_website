---
title: "Strahlenoptik: a small optics lab"
slug: optics-lab
date: 2026-11-23
summary: >-
  Five stations of ray optics to take hold of: light and shadow, the law of
  reflection, refraction and total reflection, the focal point of a lens, and
  an optical bench with a light source, an object, a lens on a rail and a
  projection screen. Every station carries a short explanation and tasks that
  check themselves. German, English, Spanish and French.
tags:
  - "optics"
  - "physics"
  - "teaching"
  - "interactive"
---

## Why this exists {: #why }

Optics is the first piece of physics a child can check by hand. A shadow is
either there or it is not. A ray either hits the target or misses it. The
image on the screen is either sharp or it is blurred, and nobody has to be
told which. That makes it the rare topic where a simulation is not a
substitute for the experiment but a rehearsal for it: everything in here can
be rebuilt on a kitchen table with a torch, a mirror, a glass of water and a
magnifying glass, and it should be.

What a screen adds is the part the kitchen table hides. On a real optical
bench you see the image and not the rays. Here the three rays that construct
the image are drawn while you move the lens, so the rule and its consequence
move together. That is the whole argument for doing it this way, and it is
also the limit: a drawn ray is a claim about geometry, not a photograph.

<div class="olab"><noscript>The lab needs JavaScript. / Das Labor braucht
JavaScript.</noscript></div>

<script defer src="/media/optics-lab/applet.js"></script>

## So geht es {: #anleitung }

*Für die Kinder, auf Deutsch.* Oben wählst du die Station, rechts oben die
Sprache: **DE · EN · ES · FR**. Jede Station erklärt sich in drei, vier
Sätzen, dann darfst du ziehen. Die dicken orangenen Punkte im Bild fasst du
mit der Maus oder mit dem Finger an; die Regler darunter tun genau dasselbe
und gehen auch mit der Tastatur. Unter dem Bild stehen die Aufgaben. Die
prüfen sich selbst: sobald es stimmt, hakt sich die Aufgabe ab und bleibt
abgehakt, auch wenn du die Seite später wieder aufmachst.

Die fünf Stationen bauen aufeinander auf. **Licht & Schatten** zeigt, dass
Licht geradeaus läuft, und mit der zweiten Lampe, woher Kernschatten und
Halbschatten kommen. **Spiegel** ist die eine Regel, die man wirklich braucht:
Einfallswinkel gleich Ausfallswinkel, gemessen zum Lot. **Brechung** zeigt,
warum ein Stab im Wasser geknickt aussieht, und den Grenzwinkel, ab dem gar
kein Licht mehr herauskommt. **Brennpunkt** sammelt paralleles Licht in einem
Punkt. Und im **optischen Labor** steht dann alles zusammen auf der
Linsenschiene: Lampe, Gegenstand, Linse, Projektionswand.

*Para los niños:* elige el idioma arriba a la derecha — **ES**. · *Pour les
enfants :* choisis la langue en haut à droite — **FR**.

## What is in it {: #stations }

| Station | What you move | What it is for |
|---|---|---|
| Licht & Schatten | lamp, object, wall, a second lamp | light travels straight; umbra and penumbra |
| Spiegel | where the ray hits, how the mirror is turned | the law of reflection, and the image behind the glass |
| Brechung | the angle, water or glass, which side the ray comes from | Snell's law, and total reflection |
| Brennpunkt | focal length, tilt of the bundle, lens type | the focal point and the focal plane |
| Optisches Labor | object, lens, screen, focal length, object size | the thin-lens equation and the image it predicts |

Eighteen tasks across the five, and the ticks live in the browser. There is no
account, no timer and no score beyond how many of the eighteen have been
solved once.

## How it is built {: #build }

The lab is one file of JavaScript with no dependencies and no network traffic.
Each station holds its model in centimetres and degrees, and the drawing maps
centimetres to pixels at the last moment. That split is worth naming because
it is what makes the thing checkable: the physics never learns that a screen
exists, so it can be run without one.

That is exactly what `tools/optics_proof.js` does. It loads the applet against
a stub window, pulls the stations out through a test hook and sweeps the whole
control space of every station. It answers two questions that looking at the
screen cannot:

- **Is every task reachable?** A task whose window the sliders cannot enter is
  not a hard task, it is a broken one. Three of the eighteen sit in under a
  tenth of a percent of the swept space, which is the point of them, and none
  sits at zero.
- **Is any task satisfied nearly everywhere?** Then it teaches nothing. One
  was: *push the object inside the focal length* is a single shove of a
  slider. It now asks for a magnification of two as well, which forces the
  object close to the focal point — which is where a magnifier is actually
  held. The check caught a weak task, not a wrong one, and that is the more
  common failure.

The same script checks the physics against values worked out by hand: air into
water at 40° refracts to 28.9°, the critical angle out of water is 48.75° and
out of glass 41.8°, an object at twice the focal length gives an image at
twice the focal length the same size as itself, and a mirror returns a ray at
the angle it arrived at for every tilt of the mirror. It also checks that
every station, control, readout and task carries text in all four languages,
because a missing string is the kind of fault that only shows up in the one
language nobody tested.

A few decisions that are visible in the pictures:

- **The shadow station draws rays, not a shaded cone.** The shadow is defined
  as the part of the wall no ray reaches, so drawing the rays and letting the
  gap appear is the definition rather than an illustration of it.
- **The half-shadow here is made by two lamps, not by one large lamp.** A real
  penumbra is the smooth result of an extended source, and a lamp with a size
  would be the honest model. Two point lamps give two shadows with a region
  where only one of them falls, which is the same idea in two steps instead of
  a continuum. It is easier to see and it is not the same thing.
- **The lens obeys the thin-lens equation and nothing else.** $1/f = 1/g +
  1/b$, with the three principal rays drawn as the construction. That is the
  paraxial approximation: no thickness, no spherical aberration, no colour. A
  real lens of this aperture would not bring the edge rays to the same point.
- **The spot on the screen is blurred in proportion to the defocus.** The
  blur radius is the aperture the bundle uses times the defocus divided by the
  image distance, which is the geometry of a cone cut off the wrong side of
  its tip. It is there so that *sharp* is something you hunt for rather than
  something the applet announces.
- **The zoom-free viewBox is set to the element's pixel size.** Strokes and
  labels are therefore in pixels and keep their size on a phone, while the
  model stays in centimetres. The blind map solved the same problem the other
  way round, with a CSS variable, because that one has to zoom.

## What it does not do {: #limits }

It is ray optics and only ray optics. Light is a straight line that bends at
boundaries and nothing else, which is a model that stops being true as soon as
anything gets small: there is no diffraction here, no interference, no
polarization, no wavelength and therefore no colour. A prism in this lab would
bend white light and not split it.

The mirror is flat. A concave mirror has a focal point too, and it is the
other half of the schoolbook chapter, so its absence is the most obvious gap.
The eye and the camera are named in one task each and are not modelled. There
is no lens combination, which is what a microscope and a telescope are.

And it checks arithmetic, not understanding. A child can solve every task by
sliding until the tick appears. Whether the picture went in is a question only
a person can ask, which is the same honest limit the blind map has.
