# Dashboard Filters and Table Columns (2026-02-14)

## Summary
Multiple dashboard filtering improvements were added, and hospital name was added as a table column.

## Files Updated
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/components/BillsTable.jsx`

## Changes
- Added `Hospital Name` column right after `Employee ID` in bills table.
- Added dashboard filters:
  - Bill scope filter: `Active Bills`, `Deleted Bills`
  - Status filter: `Pending`, `Processing`, `Completed`
  - Hospital filter: dynamic options from available bills
  - Date filter: `Today`, `Yesterday`, `This Month`, `Last Month`

## Impact
- Faster slicing of dashboard data by operational needs.
- Improved visibility for hospital-wise bill tracking.
