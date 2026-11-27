---
title: MRITogether 2026 Placenta
image: https://zenodo.org/records/24591782/files/placenta_preview.png?download=1
zenodo: https://zenodo.org/records/24591782
paper: https://doi.org/10.1002/mrm.30379
size_bytes: 1122937811
tested_on:
  KomaMRI: 0.15.0
  KomaMRIBase: 0.15.2
  KomaMRICore: 0.14.0
  KomaMRIFiles: 0.12.0
  KomaMRIPlots: 0.14.1
tags:
  - motion
  - 2d
  - flow
  - placenta
submitted_by: pvillacorta
---

Dynamic 2D simplified placenta at 3 T. 50,000 flowing spins in the intervillous space (IVS) (arterial blood, T1 = 1.65 s, T2 = 0.150 s) and 15,295-spin myometrium compartment (T1 = 1.51 s, T2 = 0.079 s). Motion combines periodic 1s CFD-derived blood flow, rigid maternal breathing, and three localized non-rigid fetal kicks. The archive includes the base tissue, multi-motion, and simulation-ready compiled .phantom files, Julia utilities to customize motions and compute ground-truth deformation vector fields (DVFs) for motion-correction studies, and the Python meshing, CFD, and particle-tracking pipeline (Gmsh-DOLFINx-MRSimTracks) to regenerate the flow from CAD geometry.
