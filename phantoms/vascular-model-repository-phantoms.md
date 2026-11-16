---
title: Vascular Model Repository Phantoms
image: https://zenodo.org/records/24288115/files/VMR_0050_preview.png
zenodo: https://zenodo.org/records/24288115
paper: https://www.vascularmodel.com/
size_bytes: 24727651951
tested_on:
  KomaMRI: 0.15.0
  KomaMRIBase: 0.15.2
  KomaMRICore: 0.14.0
  KomaMRIFiles: 0.12.0
  KomaMRIPlots: 0.14.0
tags:
  - flow
  - motion
  - 3d
submitted_by: mcgrathcm
---

Periodic blood-flow phantoms for KomaMRI, derived from the Vascular Model Repository dataset 0050_H_CERE_H_3D_RIGID, provided with 100,000 and 5,000,000 particles. Motion spans a one-second cardiac cycle, with tissue properties representing oxygenated arterial blood at 3 T.

The archive includes the final .phantom files and a Julia build script. The script downloads the required CFD data, tracks particles using MRSimTracks through PyCall, and builds the phantom. Users can apply it to other compatible VMR rigid-volume datasets and choose particle counts, tissue properties, and tracking settings.
