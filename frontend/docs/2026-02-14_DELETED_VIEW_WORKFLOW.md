# Deleted View Workflow (2026-02-14)

## Summary
Delete flow was redesigned to support temporary delete, deleted view, undo restore, and permanent delete.

## Files Updated
- `frontend/src/pages/DashboardPage.jsx`
- `frontend/src/components/BillsTable.jsx`

## Behavior
1. In active dashboard:
- Delete action is **temporary**.
- Item is removed from active list and moved to Deleted view.

2. In deleted view:
- `Undo` restores item back to active dashboard.
- Delete action is **permanent** (backend delete for server-backed rows).

## Technical Notes
- Deleted items are tracked in local storage using key:
  - `dashboard_deleted_bills`
- Identifier handling supports:
  - `bill_id`
  - `upload_id`
  - `temp_id`

## Impact
- Safer delete experience with recoverability.
- Permanent deletion requires explicit action from Deleted view.
