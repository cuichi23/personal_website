---
title: Spice simulations of digital phase-locked loop systems
slug: spice-simulations-of-dpll-systems
date: 2018-07-10
summary: Testing DPLL architectures down to the transistor level before soldering anything.
tags:
  - "synchronization"
  - "phase-locked loops"
  - "PLL"
  - "LTSpice"
  - "Spice"
  - "electronic clocks"
  - "networks"
  - "noise"
---

We use [LTSpice](http://www.analog.com/en/design-center/design-tools-and-calculators/ltspice-simulator.html), an open source analog circuit simulator to simulate systems of coupled DPLL on the level of the voltage and current time-series. Using this industry-standard approach to test the circuit architectures down to the transistor level before setting up the prototype systems for experimentation allows to identify potential problems such as parasitic resistances and capacitances. We also use it to gain a better intuition on the dynamics within the circuitry as components become heterogeneous and are subject to noise.

Here we present our current ongoing work on a system of two mutually delay-coupled digital phase-locked loops (DPLLs), each consisting of a phase detector (XOR or flip-flop), a loop filter (first order low pass filter) and an voltage-controlled oscillator (VCO). The VCO is a ring oscillator which is set up from a closed chain of inverter elements, designed by [Jacob Baker](http://cmosedu.com/jbaker/jbaker.htm) and available from [YOUSPICE](http://www.youspice.com/spiceprojects/spice-simulation-projects/general-electronics-spice-simulation-projects/digital-basic-components-spice-simulation-projects/voltage-controlled-oscillator-vco-for-digital-applications/#tab-description).

![Fig.1: Two digital phase-locked loops with first order loop filter, delayed feedback and transmission lines for mutual coupling. The DPLLs are separated into two part, the VCO and delay-lines (left), and the phase-detector and loop filter components (right). No reference clock involved.](/media/spice-simulations-of-dpll-systems/two-coupled-dplls.png)

Before going into the details of this circuit, we show the response curve of the VCO plotted against the input voltage at ***Vinvco.*** The VCO is supplied by a 2V power source and we changed the parasitic capacitor in the inverter subcircuits of the VCO to $C\_p=300$fF.

![Fig. 2: VCO with rectangular output signals designed by R. Jacob Baker. The measurements are included as a table.](/media/spice-simulations-of-dpll-systems/free-running-vco.png)

![Fig. 3: Response curve of VCO (ring oscillator) for supply voltage 2V and parasitic capacitance $C\_p$.](/media/spice-simulations-of-dpll-systems/vco-response-curve.png)
