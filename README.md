# Delivery Tracker

Lightweight delivery-tracking web app with role-based dashboards for drivers and overseers. Built to solve a small real operation's status-tracking problem without heavyweight infrastructure.

## What it does

- **Role-based routing.** Drivers and overseers hit the same login but see different dashboards.
- **Real-time status updates.** Driver status changes propagate to overseer views instantly via Firebase Realtime Database listeners.
- **Firebase Auth.** Role enforcement at the auth layer so overseers and drivers can't cross-view each other's UI.

## Stack

HTML, CSS, vanilla JavaScript on the frontend. Firebase Authentication and Firebase Realtime Database on the backend. Deployed via GitHub Pages.

## Context

Early product-focused project to practice role-based auth, real-time state sync, and shipping a working app end-to-end without a custom backend. Prioritizes simplicity over feature count: user login, role separation, status tracking.
