# Bill Result Page Changes

## Scope
Implemented a production-ready result rendering flow for `GET /bill/:billId` where backend sends raw formatted text and frontend parses it into structured UI data.

## Frontend Files Added
- `frontend/src/pages/ResultPage.jsx`
- `frontend/src/utils/verificationResultParser.js`
- `frontend/src/components/results/VerificationSummaryCard.jsx`
- `frontend/src/components/results/FinancialSummaryCard.jsx`
- `frontend/src/components/results/ResultFilters.jsx`
- `frontend/src/components/results/CategoryResultTable.jsx`

## Frontend Files Updated
- `frontend/src/App.jsx`
  - Route `bill/:uploadId` now uses `ResultPage`.
- `frontend/src/services/api.js`
  - `normalizeBillDataResponse` now supports:
    - `billId` / `bill_id` / `upload_id`
    - `verificationResult` / `verification_result` / `result`
  - Ensures `verification_result` is always a text string for parser input.
- `frontend/src/pages/ResultPage.jsx`
  - If `/bill/:id` returns completed status but empty verification text, triggers `POST /verify/:id` and refetches.
  - Adds loading message for on-demand verification generation.

## UI Behavior
1. Summary Card
- Total items
- Allowed count (green)
- Overcharged count (red)
- Needs review count (yellow)

2. Financial Summary Card
- Total billed
- Total allowed
- Total extra

3. Category Sections
- Grouped by category
- Expanded by default
- Item count badge in each category header

4. Scrollable Category Tables
- Horizontal scroll via `TableContainer`
- Sticky headers
- Decision chips:
  - `ALLOWED` -> green
  - `OVERCHARGED` -> red
  - `NEEDS_REVIEW` -> orange

5. Client-side Filters
- Decision type multi-select
- Search by item text (`billItem`, `bestMatch`, `reason`)
- Optional collapsible filters panel

## Parsing Logic
Parser utility: `frontend/src/utils/verificationResultParser.js`

What it parses:
- Summary counts
- Financial totals
- Category headers (`Category: <name>`)
- Items in two formats:
  - Key-value lines (`Bill Item:`, `Best Match:`, etc.)
  - Pipe table rows (`| Bill Item | Best Match | ... |`)

Safety:
- If parsing fails partially, page shows warnings and continues rendering.
- If no items are parsed, parser returns empty structured sections with warnings.
- Decision normalization supports both frontend labels and backend statuses:
  - `ALLOWED`, `OVERCHARGED`, `NEEDS_REVIEW`
  - `GREEN`, `RED`, `MISMATCH`, `UNCLASSIFIED`, `ALLOWED_NOT_COMPARABLE`

## Backend Contract Needed
Endpoint expected:
- `GET /bill/:billId`

Response expected:
```json
{
  "billId": "string",
  "status": "COMPLETED",
  "verificationResult": "RAW STRUCTURED TEXT"
}
```

Required:
- `verificationResult` must be a string.
- Keep stable labels for best parse quality:
  - `Category:`
  - `Bill Item`
  - `Best Match`
  - `Similarity` or `Similarity Score`
  - `Allowed` or `Allowed Amount`
  - `Billed` or `Billed Amount`
  - `Extra` or `Extra Amount`
  - `Decision`
  - `Reason`

Recommended backend additions:
- `formatVersion` field (example: `v1`) to support versioned parser behavior safely.

## Backend Backfill Behavior Implemented
Backend route `GET /bill/{bill_id}` now includes on-demand backfill:
- If `verification_result_text` is missing and record is `completed/verified`,
  backend attempts verification using stored hospital metadata.
- On success, backend persists:
  - `verification_result`
  - `verification_result_text`
  - `verification_format_version`
- This allows legacy extracted records (without verification text) to render in the new result page.

## Backend Changes You Should Make
1. Add/confirm `GET /bill/:billId` endpoint in backend API.
2. Return raw verification text under `verificationResult` as string.
3. Ensure decision values map to:
- `ALLOWED`
- `OVERCHARGED`
- `NEEDS_REVIEW`
4. Keep section/field labels stable across releases.
5. Ensure hospital metadata is always present so on-demand verification can run when needed.

## Validation Checklist
1. Open `/bill/<valid_upload_id>`
2. Verify summary/financial cards populate
3. Verify categories render with item counts
4. Test filters:
- Decision checkboxes
- Search text
5. Test with 100+ items and confirm UI remains responsive
6. Test malformed text and confirm warning alert appears without page crash
