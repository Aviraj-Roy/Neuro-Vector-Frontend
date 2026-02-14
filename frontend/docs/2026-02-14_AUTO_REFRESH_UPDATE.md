# Auto Refresh Update (2026-02-14)

## Summary
The dashboard polling interval was reduced from 5 minutes to 5 seconds.

## Files Updated
- `frontend/src/constants/stages.js`
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/hooks/useAllBillsPolling.js`

## Changes
- `POLLING_INTERVAL` changed from `300000` to `5000`.
- Dashboard UI text updated from "5 minutes" to "5 seconds".
- Hook comment text aligned with the new interval.

## Impact
- Faster status visibility on dashboard updates.
- Higher API polling frequency for `/bills` endpoint.
