# Odorik

## Project Summary
Odorik is a Progressive Web Application (PWA) built specifically for Odorik.cz clients. It allows users to quickly manage speed dials (fast contacts), initialize callbacks, view call/SMS history, active calls, statistics, lines, and SIM cards. It can be run locally or accessed directly via GitHub Pages (heptau.github.io/odorik).

## Architecture & Features
- **Progressive Web App:** Designed to work offline and natively on mobile devices (`app.webmanifest`, `service-worker.js`, `offline.html`).
- **Odorik API Integration:** Heavily relies on Odorik.cz REST APIs (documented via `openapi.yaml` and `swagger/` directory).
- **Authentication:** Supports logging in using SIP name/password (for line-specific access) or API credentials (for full account access).
- **Configuration (`odorik.js`):** Contains customizable settings (e.g., `lockedNumbers`, `hideLockedNumbers`, `allowedLines`, `defaultCallbackNumber`).
- **Data Management:** Uses `localStorage` to store sessions and UI preferences (e.g., login state, selected tab, order).

## Technology Stack
- **Languages:** HTML, JavaScript (Vanilla/jQuery), CSS
- **APIs:** Odorik.cz REST API

## AI_CONTEXT Maintenance Rule
- This file should be updated automatically after meaningful architectural, security, release, routing, configuration, or documentation workflow changes.
- Do not wait for a special request when the update is clearly relevant.
