---
title: Brain Web Subject 04
image: https://zenodo.org/records/24293445/files/BrainWeb_subject04_preview.png
zenodo: https://zenodo.org/records/24293445
paper: https://ieeexplore.ieee.org/abstract/document/1717639
size_bytes: 3364102949
tested_on:
  KomaMRI: 0.15.0
  KomaMRIBase: 0.15.2
  KomaMRICore: 0.14.0
  KomaMRIFiles: 0.12.0
  KomaMRIPlots: 0.14.0
tags:
  - brain
  - static
  - 3d
submitted_by: mcgrathcm
---

Static brain phantoms for KomaMRI, derived from the BrainWeb subject-04 anatomical model, provided at 1 mm, 0.5 mm, 0.25mm and 0.167mm isotropic resolution. Tissue-specific proton density, T1, and T2 values represent a 3 T model, with multiple tissue components accounting for partial-volume contributions.

The archive includes the final .phantom files and a Julia build script. The script downloads the required reference data and allows users to generate phantoms from other BrainWeb subjects, choose different isotropic resolutions, and supply alternative tissue properties.
