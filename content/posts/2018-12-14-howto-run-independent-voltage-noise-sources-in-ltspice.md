---
title: Howto run independent voltage noise sources (IID and GWN) in LTSpice using Bv-sources
slug: howto-run-independent-voltage-noise-sources-in-ltspice
date: 2018-12-14
summary: LTSpice has no built-in noise source for transient runs. Bv-sources with white() get you independent, band-limited Gaussian noise.
tags:
  - "LTSpice"
  - "noise"
  - "noisy voltage sources"
  - "GWN"
  - "iid"
---

In order to have two independent noise sources with a different random seed the rand(), or random(), or white() [LTSpice](https://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html?gclid=EAIaIQobChMIyZHP38mm3wIVReJ3Ch1ggwL8EAAYASAAEgK3uPD_BwE)-functions have to be called with a different argument, e.g.:

B1: $V=0.01*\text{white}( f_{\text{sample}}*\text{time} )$

B2: $V=0.01*\text{white}( f_{\text{sample}}*(\text{time}+<\text{nonzero\_number}> )$

Note however, the pseudo random numbers output of the function white is NOT Gaussian white noise as the name might suggest, see also this post: [https://www.linkedin.com/pulse/ltspice-rand-white-jean-francois-debroux/](https://www.linkedin.com/pulse/ltspice-rand-white-jean-francois-debroux/)

Generate Gaussian white noise ([GWN](https://en.wikipedia.org/wiki/White_noise)) distributed pseudo random numbers $n_{gwn}$ from independent identically distributed ([IID](https://en.wikipedia.org/wiki/Independent_and_identically_distributed_random_variables)) random numbers using the [Box-Muller transform](https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform):

$n_{gwn}= \mu + (\sigma  \sqrt{(-2\,log( \text{rand}(f_{\text{sample}}\,\text{time}) ))\cos(2 \pi \, \text{rand}(f_{\text{sample}}\,\text{time}+\text{seed\_offset}) ) )}$,

with mean $\mu$ and standard deviation $\sigma$. Note, that the two iid pseudo random numbers generated using the LTSpice rand()-function have to have different seed.

As soon as I find the time I will check how well that works in LTSpice and provide plots and statistics. Any feedback is very welcome.
