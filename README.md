# Personal Portfolio Website

A full-stack personal portfolio website showcasing projects, skills, and a downloadable CV.

## What is used in it and for what
- **Vite:** A fast frontend build tool used to bundle the web assets (`vite.config.js`).
- **Node.js & Express:** Used in `server.js` and `/api` to handle backend requests and server-side logic.
- **HTML/CSS/JS:** Core web technologies used for the UI (`index.html`, `/src`, `/public`).
- **Vercel:** Configuration (`vercel.json`) is present for seamless deployment to the Vercel platform.

## Architecture
- `/src` & `/public`: Frontend assets, components, and static files.
- `server.js` & `/api`: Backend logic and API endpoints.
- `CV.pdf` / `resume.pdf`: Downloadable resume files served to visitors.
- `set-password.js`: A utility script likely used for admin authentication or protected routes.

## How to run it
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file based on `.env.example`.
3. Start the development server (Frontend + Backend):
   ```bash
   npm run dev
   ```
   *(Alternatively, run `node server.js` to start the backend).*
