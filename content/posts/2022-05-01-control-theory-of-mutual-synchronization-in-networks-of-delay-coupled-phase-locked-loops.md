---
title: Control theory of mutual synchronization in networks of delay-coupled phase-locked loops
slug: control-theory-of-mutual-synchronization-in-networks-of-delay-coupled-phase-locked-loops
date: 2022-05-01
date_approx: true
summary: Gain and phase margins assume an entraining reference. Mutual coupling changes the transfer function itself.
tags:
  - "synchronization"
  - "phase-locked loops"
  - "PLL"
  - "control theory"
  - "transfer function"
  - "stability"
  - "dynamical systems theory"
  - "feedback system"
---

This post is related to a manuscript that we have submitted for publication to IEEE Access and I will extend this summary here step by step.

**Introduction**

In classical phase-locked loop (PLL) theory concepts like the [gain](https://en.wikipedia.org/wiki/Bode_plot#Gain_margin_and_phase_margin) and [phase margin](https://en.wikipedia.org/wiki/Phase_margin) and application of the [Nyquist criterion](https://en.wikipedia.org/wiki/Nyquist_stability_criterion) help to analyze the stability of a system. These are accessed from the PLLs [transfer function](https://en.wikipedia.org/wiki/Transfer_function) in [Laplace space](https://en.wikipedia.org/wiki/Laplace_transform) and analysis at the critical point for zero real part of the Laplace variable. Hence, the stability of the system is studied where it changes from stable to unstable, in [dynamical systems theory](https://en.wikipedia.org/wiki/Dynamical_systems_theory) we call this the [marginal stable](https://en.wikipedia.org/wiki/Marginal_stability) case. At this point, the above mentioned concepts rely on the variation of the complex part of the Laplace variable, the frequency. From this, [Bode](https://en.wikipedia.org/wiki/Bode_plot#Gain_margin_and_phase_margin) and [Nyquist plots](https://www.electrical4u.com/nyquist-plot/) are constructed and gain and phase margins defined.  
 This is straightforward for the case of the entrainment of a PLL by a periodic reference signal. However, in the literature on classical PLL theory one aspect is often missing — the effect of the synchronized or entrained state itself. Here, I will discuss this topic and show how the transfer functions of PLLs and networks of PLLs change because of it.
