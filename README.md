<div align="center">
  <img width="1200" height="475" alt="TACTICAL CANVAS banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TACTICAL CANVAS

**A portfolio-grade command-and-control interface study for synthetic mission visualization, operator flow design, and cinematic systems UI.**

TACTICAL CANVAS is a speculative defense-interface prototype built to explore how a mission system can feel both operational and editorial: part command console, part physical dossier, part live analytic instrument. The project combines a multi-module mission workflow, a geospatial intelligence surface, a dimensional radar panel, and a target-tasking interaction model into one cohesive front-end demonstration.

This is not a production system and does not represent real operations. All mission data in the app is synthetic and intentionally simplified.

## Project Thesis

Most tactical UI demos are visually loud but operationally thin. They look “high tech” without clearly showing how an operator moves from detection to correlation to tasking.

TACTICAL CANVAS is an attempt to solve that problem through interface structure rather than styling alone.

The central design question:

> What would a tactical mission interface feel like if its primary job were not to impress, but to make an operator confident about what happens next?

The answer in this prototype is a system built around a visible mission thread:

- observe the environment
- correlate an asset with a target
- issue a task
- assess the active state of the chain

That logic is carried across every module so the user is not dropped into disconnected scenes.

## Designer Intent

This project was designed with five specific intentions:

### 1. Make tactical state progression visible

The interface should communicate not just *what exists*, but *where the operator is in the mission cycle*. The `Mission Thread` bar and shared selection state are the backbone of that decision.

### 2. Blend digital command UI with physical intelligence artifacts

The GEOINT side of the experience is intentionally not a clean SaaS dashboard. It references binders, clipped pages, dossier tabs, and reference cards because intelligence work often involves layered evidence, not just a single flat screen.

### 3. Treat motion as explanation, not decoration

Motion in this project is there to clarify state change:

- module transitions show navigation context
- the radar sweep suggests persistent sensing
- targeting markers intensify when tasking becomes real
- the dossier junction opens to reveal available actions at the point of overlap

### 4. Preserve legibility under strong visual styling

The interface uses aggressive typography, high-contrast accents, and textured panels, but the hierarchy is still intended to answer simple questions quickly:

- What is selected?
- What is correlated?
- What is currently tasked?
- What is the risk/readiness state?

### 5. Build a believable portfolio artifact, not a generic template

This repository is meant to read as a real design/engineering exploration. The README, the module structure, and the interaction details are all part of that presentation.

## What The Experience Includes

### COMMAND

The main command surface acts as the operational overview. It combines:

- an asset list for platform selection
- a dimensional radar panel with a WebGL-rendered radar surface
- a globe view showing asset-target linkage
- mission-aware readiness metrics
- contextual alerting tied to the active task chain

The intent is to make COMMAND feel like a place where an operator can maintain orientation rather than just view decorative widgets.

### GEOINT

The GEOINT module is the research and evidence layer. It includes:

- a GeoJSON point-cloud canvas
- filterable feature layers
- coordinate readout and grid interaction
- dossier-style reference cards
- a now-interactive junction panel where the paper layers intersect

This section deliberately contrasts the radar and targeting modules. It feels more archival, interpretive, and document-heavy.

### RADAR

The radar module is built to feel like a dedicated sensor surface rather than a flat SVG mockup. The latest iteration uses a custom WebGL background shader to create:

- depth in the scope
- animated sweep energy
- atmospheric signal noise
- concentric field structure
- color bias that changes when a task is active

Markers and task rings are then layered over that surface.

### TARGETING

The targeting module treats aimpoints as taskable objects in a stylized 3D field. The user can:

- nominate a target
- correlate it with the selected asset
- activate a task
- clear an active task

This allows the prototype to demonstrate a full loop rather than isolated pages.

## Interaction Model

The prototype is built around shared mission state. Selection in one module influences the others.

### Shared States

- `selectedAssetId`
- `selectedTargetId`
- `currentTask`

These states are owned at the application level and passed into module screens so the user experiences one system instead of four separate demos.

### Current Flow

1. Choose an asset in `COMMAND` or `RADAR`
2. Move to `TARGETING` and select an aimpoint
3. Task the selected asset to the selected target
4. Return to `COMMAND` to review the resulting mission thread, alerts, globe linkage, and readiness metrics

### Dossier Junction

The dossier stack in GEOINT now includes an interactive central intersection:

- cards can be focused individually
- side tabs change the active section
- the central junction control opens a feature panel
- the intersection behaves like a protocol switchboard instead of dead ornament

This was designed to make the overlapping paper layout feel functionally justified.

## Visual Language

TACTICAL CANVAS uses a mixed material system:

- archival whites and kraft browns for dossier/reference surfaces
- acid yellow for active state, lock, and confirmation
- tab blue / tension blue for spatial and protocol infrastructure
- red for threat/tasking emphasis
- dark void blacks for command surfaces and display framing

The typography is intentionally utilitarian:

- mono-oriented labels for instrumentation and machine context
- larger editorial numerals for physical-card identity
- compressed, uppercase metadata to evoke military labeling without imitating a real classified interface

## Technical Demonstration

This project is implemented as a Vite + React + TypeScript single-page application.

### Core Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- `motion` for transitions and animated state presentation
- raw WebGL for the radar surface shader

### Architectural Notes

- `src/App.tsx` orchestrates module switching and owns shared mission state.
- `src/screens/` separates top-level module composition from root-state orchestration.
- `src/components/MissionWorkflowBar.tsx` presents the mission phase model.
- `src/utils/mission.ts` derives mission-aware metrics, alerts, and contextual display data.
- `src/components/RadarSurface.tsx` renders the radar background using custom shaders instead of a prebuilt graphics library.

### Why WebGL For Radar

The earlier radar surface was readable but flat. Rebuilding it with raw WebGL allowed the project to add:

- texture without image assets
- task-sensitive tinting
- sweep motion with better depth
- a stronger sense of “instrument surface” instead of “UI illustration”

That choice matters because radar is one of the primary emotional anchors of the product.

## Portfolio Framing

This project is best understood as a hybrid artifact:

- **product design study** because it defines an operator flow across modules
- **interaction design prototype** because state changes are intentionally staged and visible
- **front-end craft exercise** because the interface is implemented, animated, and rendered rather than mocked in a static tool
- **visual systems exploration** because it tests how cinematic styling can remain operationally legible

If presented in a portfolio, this work is intended to demonstrate:

- high-conviction UI direction
- interaction architecture across multiple surfaces
- comfort with both design intent and implementation detail
- the ability to turn a concept into a functioning prototype

## Suggested Demo Narrative

If you are walking someone through the project, the strongest sequence is:

1. Start in `COMMAND`
   Show the mission thread in its idle state.

2. Select an asset
   Explain how the interface treats asset selection as the first operational commitment.

3. Move to `TARGETING`
   Select an aimpoint and issue a task.

4. Return to `COMMAND`
   Show how metrics, globe linkage, radar emphasis, and alerts now reflect the active task.

5. Move into `GEOINT`
   Use the dossier intersection and GeoJSON tools to frame the system as layered evidence, not only sensor imagery.

That order best demonstrates that the project is driven by workflow logic, not just surface styling.

## Current Limitations

This prototype is intentionally scoped and still has clear limitations:

- all data is synthetic
- there is no backend or persistence layer
- tasking is modeled as a single active assignment, not a full queue
- globe and targeting surfaces are stylized approximations, not geographic truth
- GEOINT cluster generation is still randomized at load time

Those constraints are acceptable for the current goal, which is design and interaction demonstration rather than production readiness.

## Local Development

### Prerequisites

- Node.js 20+ recommended

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

The Vite dev server runs on port `3000`.

### Build

```bash
npm run build
```

### Typecheck

```bash
npm run lint
```

## Repository Notes

The repository may also contain local design-reference folders used during exploration. Those are not required to run the app itself.

## Closing Statement

TACTICAL CANVAS is a study in turning speculative mission software into something with editorial presence, interaction clarity, and technical credibility. It is less interested in imitating an existing defense product than in exploring what a stronger synthesis of operator workflow, visual atmosphere, and front-end craft could look like.
