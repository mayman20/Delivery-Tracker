# Delivery Tracker

Small delivery operations app with role-based login for drivers and overseers.

## What This Project Shows

- Early product-building work with a simple operational workflow
- Firebase authentication and database integration
- Multi-page frontend with separate views for different user roles
- Practical, lightweight delivery-status tracking

## Core Features

- User login with Firebase Auth
- Role-based routing for driver and overseer views
- Delivery status tracking through Firebase Realtime Database
- Responsive UI for desktop and mobile use

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend services: Firebase Auth, Firebase Realtime Database
- Deployment: GitHub Pages

## Project Structure

```txt
index.html        Login page
signup.html       Account creation flow
driver.html       Driver dashboard
overseer.html     Overseer dashboard
app.js            Main auth and app logic
signup.js         Signup logic
firebase-config.js Firebase setup
styles.css        Shared styling
assets/           Static images
```

## How It Works

1. A user signs in through Firebase Auth.
2. The app loads that user's role from Firebase Realtime Database.
3. Drivers and overseers are routed to different dashboard views.
4. Delivery state is managed client-side against Firebase.

## Run Locally

This project is static, so you can open the HTML files directly or serve the repo with a simple local server.

If you use a local server:

```bash
npx serve .
```

## Firebase Setup

Update the Firebase config values in `firebase-config.js` for your own project before deploying your own copy.

## Notes

- This is an earlier project, but it is useful as a straightforward example of shipping a small workflow app.
- The main value here is simplicity: auth, roles, and status tracking without heavy infrastructure.
