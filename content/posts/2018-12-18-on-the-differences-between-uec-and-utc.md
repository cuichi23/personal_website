---
title: On the differences between universal emergent time (UEC) and universal coordinated time (UTC)
slug: on-the-differences-between-uec-and-utc
date: 2018-12-18
summary: Today's time standards feed a reference forward. What would a standard look like if the reference emerged from the network instead?
tags:
  - "synchronization"
  - "time-reference"
  - "time-distribution"
  - "UEC"
  - "UTC"
  - "TAI"
---

WORK IN PROGRESS

This is supposed to be more a basis for discussion and thought than a source of *factual* information.

## State-of-the-art time-standards based on reference periodic processes

A time standard is a specification on how to measure time which historically were often bound to Earth’s rotational period. Time standards provide either a way to specify how fast time passes, and/or provides fixed points in time.

The current [time-standards](https://en.wikipedia.org/wiki/Time_standard) important for most of our everyday life are the coordinated universal time (UTC) and the international atomic time (TAI). For those who wonder about the order of letters in the abbreviations have their origin in french, i.e., [*temps atomique international*](https://en.wikipedia.org/wiki/International_Atomic_Time) and *temps [universel coordonné](https://en.wikipedia.org/wiki/Coordinated_Universal_Time).* While UTC is organized to stay close to mean solar time, it is related to the TAI time standard which is tied to the definition of the SI second.

So far most of the existing time-standards are related to a reference, such as the periodicity of the Earths rotation or frequencies related to physical processes. Subsequently other clocks can be synchronized to the time defined by these standards in a hierarchical way. This of course relies on the transmission of signals for the correction of time within the network of spatially distributed clocks. At large distances and/or high frequencies this become a challenging part, even if the signal transmission times can in general be measured and compensated for. The quality of synchronization then depends on the accuracy with which the signalling times can be measured.

In summary that means, that synchronization via hierarchical solutions relies on very frequency stable reference clocks that feed-forward their signal to individual distributed clocks in order to correct the time-deviations arising due to the inevitable (there are no identical clocks) drift.

I would like to note there, that the TAI is not a hierarchically synchronized systems but instead a plesiosynchronous system. There is no coupling between these clocks. However, their difference towards their weighted average is used to correct the time-stamps that they provide to third parties. The plesiosynchronous approach is usually chosen for networks that consist of very frequency stable clocks/oscillators.

## A time-standard based on a spatially distributed clock arising over a network of mutually delay-coupled clocks
