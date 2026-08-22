---
title: Synchronization of rhythm in human human, human machine and machine machine interactions
slug: synchronization-of-rhythm-in-human-and-human-machine-interactions
date: 2022-05-01
date_approx: true
summary: What a room full of people clapping and a network of clocks have in common, and where the analogy stops.
tags:
  - "synchronization"
  - "networks"
  - "state dependence"
---

Note, this is a work in progress, like a diary to formulate our thoughts and collect ideas, questions, hypothesis and results as we work towards gaining insight to the topic.

\[collaborators: Johannes Fritzsche, Dimitris Prousalis, Lucas Wetzel\]

We want to thank [Chris Chafe](https://chrischafe.net/) and [Nolan Lem](https://www.nolanlem.com/) for the inspiration to start this project, their shared interest and the discussions. Also note that the work discussed is based on the ideas presented in these publications:

1. [Chafe et al., Effect of temporal separation on synchronization in rhythmic performance](https://journals.sagepub.com/doi/10.1068/p6465) (2010)
2. [Roman et al., Delayed feedback embedded in perception – A dynamical systems approach](https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1007371) (2019)
3. [Shahal et al., Synchronization of complex human networks](https://www.nature.com/articles/s41467-020-17540-7) (2020)

The first two publications by Chafe and Roman study synchronization of rhythms in human interactions. Chafe et al. ask at which interaction time delay two performers achieve the best synchronization. Their results indicate that for natural time delays their synchronization works best, i.e., they are in phase and keep the frequency stable. This regime is associated to the traveling times of sound waves over distances at the scale of groups of humans.  
 Roman et al. tested whether a dynamical system (Stuart Landau oscillators) can reproduce the patterns observed in human synchronization. That includes phenomena like the anticipation tendency.  
 Shahal et al. study the synchronization between violin players while controlling the network topology, the coupling strength and the time delays (latencies) with which the players hear each other. They show that players tune their frequencies and can ignore inputs to be able to find a stable synchronized solution with others. The measurements are carried out while the time delay between the players is increased. They discuss how the observed dynamics compare to the results of a first order delayed Kuramoto model with an additional complex term that represents a bandwidth factor.

## Introduction

In this project we plan to build an experimental setup inspired by the setup in Chafe et al. 2010. In our case we will use buttons instead of clapping and focus on transmission time delays (latencies) much larger than the $\tau_\textrm{max}=78\,$ms presented in Chafe et al. 2010. We aim at studying human human and human machine synchronization at delays that are of the order of the period of the phrase or rhythm, i.e., $\tau\approx 1\,$s at $60$ bpm. Moreover, we can also use the setup to study machine to machine synchronization. This can be used to implement experimental setups with digital oscillators that only change their frequency at discrete instances in time, more specifically when there is an edge event at their output when the signal changes from high to low or vice versa.

The main scenarios that we will focus on first are:  
 I) the human to human synchronization dynamics in the presence of time delays of the order of the period of the rhythms involved, along with the question whether these can be understood and predicted by a Kuramoto model that includes signal filtering/processing and time-delayed coupling and  
 II) the machine to machine synchronization experiments to validate the predictions made from the analysis of an event-based dynamical model.

## Experimental setup & measurements

The experimental setup is designed and build by [Johannes Fritzsche](http://25mmhg.net) – [hands-on guy](https://kazoosh.com/mitglieder/johannes_fritzsche.html) par excellence. He came up with the PCB design that houses two electronic drums, the microcontroller that manages delaying the trigger signals from the buttons (equivalent to the clapping buttons are tapped) by a defined time delay and sending the data to a monitoring device that stores the measurements, as well as the audio connectors and the interface to the other PCB for the exchange of the trigger signals.

![First sketch of the envisioned experimental setup by Johannes Fritzsche after the initial discussions.](/media/synchronization-of-rhythm-in-human-and-human-machine-interactions/rhythm-experiment.jpg)

As can be seen in the sketch the sources of the sound are electronic drums that can be triggered by pressing a button. This trigger signal can then also be delayed artificially by a user defined value with resolution in the milliseconds regime. There are two drums on each participants side, one to play the sound triggered locally and one to play the sound of the other participant triggered with the chosen latency. The sound played by either of the drums is then mixed and played via a headphone. Depending on the type of experiment carried out the headphones are used by a human experimenter to hear is own rhythm mixed with that of the other entity, either machine or human. In the case that one or both participants of the experiment are implemented by the microcontroller, the coupling is in the simplest case realized by the exchange of the trigger signals.

### Human human interaction

The rhythm to be synchronized is made by tapping a button that triggers a signal. This signal then triggers the local drum that is played to the experimenter. …to be continued…
