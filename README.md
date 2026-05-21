# Core Arcade

This repo is a static GitHub Pages experiment for phone-controlled core/ab workout games.

The site is currently a single-page app in `index.html`. It presents a menu with multiple game modes and runs entirely in the browser with no build step.

## Current Games

### Tilt Core

A simple balance game where the player tilts the phone to steer a ball toward a target. This uses `DeviceOrientationEvent` on mobile and keyboard controls on desktop.

### Sword Roller

An ab-roller concept game. The phone is intended to be mounted flat on an ab roller, screen facing up. The player pretends the phone/roller is a sword and “stabs” monsters approaching a protected gate.

Important design constraint: Sword Roller should ignore phone tilt/orientation. It should use horizontal-plane motion from `DeviceMotionEvent`, especially forward/back rolling and side-to-side sweep.

## High-Level Goals

The goal is to prototype workout games that make core exercises feel like arcade games.

Priorities:

1. Keep the project easy to deploy on GitHub Pages.
2. Keep it mobile-first, especially iPhone browser testing.
3. Avoid dependencies unless clearly useful.
4. Prefer simple, readable JavaScript over framework complexity.
5. Support desktop fallback controls for testing.
6. Improve sensor calibration and game feel over time.

## Deployment

The site is deployed through GitHub Pages from the `main` branch, using `/` root as the Pages source.

Expected URL format:

```text
https://mjeng.github.io/tilt-core-game/
