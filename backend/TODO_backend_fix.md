# Backend crash fix plan

## Goal
Stop Express backend from crashing after adding a route, and provide a corrected working `server.js`.

## Steps
1. Identify exact crash error (missing module / route import failure).
2. Fix `backend/server.js` so dotenv loads first and imports that depend on env/modules fail gracefully.
3. Ensure middleware order is correct: CORS + body parsers -> routes -> error handler -> 404.
4. Ensure all route modules exist and are required from correct paths.
5. Restart with nodemon and verify `/health` and key API routes.

## Progress
- [x] Located current `backend/server.js`.
- [x] Confirmed route/controller files referenced by routes.
- [ ] Run backend and capture stack trace.
- [ ] Apply corrected `server.js`.
- [ ] Verify with nodemon.

