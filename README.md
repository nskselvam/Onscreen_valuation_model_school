# Onscreen Model School valuation

This project keeps the Model School valuation screens, linked administration paths,
Excel/text upload, navbar data source, and API configuration at their original URLs.
The `frontend/` and `backend/` directories retain the source project's layout.

Run the backend from `backend/` with `npm start` and the frontend from `frontend/`
with `npm run dev`. The copied environment files and API URL retain their original
settings: the frontend uses port 5173 and the API uses the port set in `backend/.env`
(currently accessed by the frontend at localhost:8000). Stop the original app on
those ports before starting this copy. The same database and remote integrations
are used; keep the copied `.env` files private.

The original Model_school project is left in place so its current deployment and
navbar links are not broken before switching traffic to this project. Once this
project is deployed at the original origin, remove or redirect the old valuation
routes as part of the deployment cutover.