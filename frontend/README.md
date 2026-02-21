# NeuroVector — Medical Bill Verification Frontend

A production-ready React frontend for the **AI-powered Medical Bill Verification System**. This application allows employees to upload hospital bills as PDFs, track their processing in real time, and review detailed AI-driven verification results broken down by category.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack & Versions](#-tech-stack--versions)
- [Project Structure](#-project-structure)
- [Pages & Routing](#-pages--routing)
- [Key Components](#-key-components)
- [Custom Hooks](#-custom-hooks)
- [API Service Layer](#-api-service-layer)
- [Utility Modules](#-utility-modules)
- [Processing Stages & Constants](#-processing-stages--constants)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [Proxy Configuration](#-proxy-configuration)
- [Running With the Backend](#-running-with-the-backend)
- [Build for Production](#-build-for-production)
- [Linting](#-linting)
- [Usage Flow](#-usage-flow)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---|---|
| **PDF Upload** | Upload medical bills as PDF files (max 10 MB) with client-side validation |
| **Hospital Selection** | Dropdown of supported hospitals (Apollo, Fortis, Manipal, Max, Medanta, Narayana) |
| **Employee ID Validation** | Enforces 8-digit numeric Employee ID before submission |
| **Invoice Date** | Optional invoice date field with YYYY-MM-DD format validation |
| **Optimistic Upload UI** | Bill appears instantly in the Dashboard as "Pending" while the upload request is in-flight |
| **Real-time Dashboard** | Polls `/bills` every **5 seconds** to display live processing status for all bills |
| **Sequential Queue Display** | Shows which bill is currently being processed vs. queued as "Pending" |
| **Multi-filter Dashboard** | Filter by Employee ID, Status, Hospital, Date, and Active/Deleted view |
| **Status Page** | Per-bill progress tracker with visual stepper that polls `/status/:uploadId` |
| **Verification Result Page** | Structured display of AI verification with financial summary, per-category tables, and decision badges |
| **Client-side Filtering** | Filter result items by decision type (Allowed / Overcharged / Needs Review) and free-text search |
| **Edit Mode** | Inline editing of Qty, Rate, and Tie-up Rate on the Result page; persisted via `PATCH /bill/:id/line-items` |
| **Local Edit Persistence** | Saved edits are stored in `localStorage` and reapplied on reload |
| **Soft Delete / Restore** | Bills can be soft-deleted from the Dashboard and restored; hard-deleted from the Deleted view |
| **Auto Permanent Delete** | Soft-deleted bills older than 30 days are automatically permanently deleted |
| **Duplicate Upload Safety** | Idempotent upload with `client_request_id` to prevent double-submission |
| **Polling Timeout Guard** | Polling stops automatically after 200 attempts (~16 minutes) |
| **Error Handling** | User-friendly error alerts for upload, delete, fetch, and save failures |

---

## 🛠️ Tech Stack & Versions

All version numbers are taken directly from `package.json`.

### Runtime Dependencies

| Package | Version |
|---|---|
| `react` | `^18.2.0` |
| `react-dom` | `^18.2.0` |
| `react-router-dom` | `^6.21.0` |
| `@mui/material` | `^5.15.0` |
| `@mui/icons-material` | `^5.15.0` |
| `@emotion/react` | `^11.11.3` |
| `@emotion/styled` | `^11.11.0` |
| `axios` | `^1.6.2` |

### Dev Dependencies

| Package | Version |
|---|---|
| `vite` | `^5.0.8` |
| `@vitejs/plugin-react` | `^4.2.1` |
| `eslint` | `^8.55.0` |
| `eslint-plugin-react` | `^7.33.2` |
| `eslint-plugin-react-hooks` | `^4.6.0` |
| `eslint-plugin-react-refresh` | `^0.4.5` |
| `@types/react` | `^18.2.43` |
| `@types/react-dom` | `^18.2.17` |

---

## 📁 Project Structure

```
frontend/
├── index.html                          # HTML entry point
├── vite.config.js                      # Vite dev server & proxy config
├── package.json                        # Project metadata & dependencies
├── .eslintrc.cjs                       # ESLint rules
├── docs/                               # Changelog docs (auto-generated)
│   ├── 2026-02-14_AUTO_REFRESH_UPDATE.md
│   ├── 2026-02-14_DASHBOARD_FILTERS_AND_COLUMNS.md
│   ├── 2026-02-14_DELETED_VIEW_WORKFLOW.md
│   └── BILL_RESULT_PAGE_CHANGES.md
└── src/
    ├── main.jsx                        # React DOM entry point
    ├── App.jsx                         # Root component: theme + router
    ├── index.css                       # Minimal global styles
    ├── constants/
    │   └── stages.js                   # Stage names, config, polling params
    ├── hooks/
    │   ├── useBillPolling.js           # Polls /status/:uploadId for one bill
    │   └── useAllBillsPolling.js       # Polls /bills for the dashboard
    ├── services/
    │   ├── api.js                      # Axios client + all API calls
    │   └── api.test.js                 # API unit tests
    ├── utils/
    │   ├── helpers.js                  # Stage progress, file size, timestamps
    │   ├── billDateDisplay.js          # Date display formatting
    │   ├── billDateDisplay.test.js
    │   ├── billEditsStorage.js         # localStorage persistence for edits
    │   ├── lineItemAmounts.js          # Amount computation helpers
    │   ├── lineItemAmounts.test.js
    │   ├── pendingUploads.js           # In-memory + localStorage pending uploads
    │   ├── verificationParser.js       # Raw-text verification result parser
    │   └── verificationResultParser.js # Structured JSON verification parser
    ├── pages/
    │   ├── UploadPage.jsx              # Bill upload form
    │   ├── DashboardPage.jsx           # All bills table with filters & polling
    │   ├── StatusPage.jsx              # Per-bill status tracker
    │   ├── ResultPage.jsx              # Verification result viewer + edit mode
    │   └── BillLookupPage.jsx          # Lookup a bill by ID directly
    └── components/
        ├── Layout.jsx                  # App shell with navigation bar
        ├── BillsTable.jsx              # Dashboard bills table component
        ├── CategoryTable.jsx           # Category-grouped items table
        ├── FinancialSummary.jsx        # Top-level financial totals card
        ├── ProgressTracker.jsx         # Processing stage stepper
        ├── StatusBadge.jsx             # Coloured status chip
        ├── VerificationFilters.jsx     # Decision + search filter panel
        ├── VerificationSummary.jsx     # Summary counts card
        └── results/
            ├── CategoryResultTable.jsx         # Per-category editable table
            ├── FinancialSummaryCard.jsx        # Financial totals on Result page
            ├── ResultFilters.jsx               # Filters on Result page
            └── VerificationSummaryCard.jsx     # Summary card on Result page
```

---

## 🗺️ Pages & Routing

The application uses **React Router v6** with a shared `Layout` wrapper. All routes are nested under `/`.

| Path | Component | Description |
|---|---|---|
| `/` | Redirect → `/upload` | Default redirect |
| `/upload` | `UploadPage` | Upload a new medical bill PDF |
| `/dashboard` | `DashboardPage` | View all bills; live-polling every 5 s |
| `/status/:uploadId` | `StatusPage` | Track processing progress for one bill |
| `/bill/:uploadId` | `ResultPage` | View and edit AI verification result |
| `*` | Redirect → `/upload` | Catch-all redirect |

---

## 🧩 Key Components

### `Layout.jsx`
Application shell containing a persistent top navigation bar with links to Upload and Dashboard pages. All pages are rendered as `<Outlet />` children.

### `BillsTable.jsx`
Main table on the Dashboard page. Renders bills with columns for status, employee ID, hospital, file info, dates, and action buttons (View, Delete/Restore). Supports:
- Soft-delete (moves to Deleted view)
- Restore from Deleted view
- Multi-select and bulk delete on Deleted view

### `ProgressTracker.jsx`
Visual stepper for the Status page. Shows the bill through stages: **Uploaded → Processing → Completed** (or **Failed**). Displays stage-specific icons and descriptions from `STAGE_CONFIG`.

### `StatusBadge.jsx`
A small coloured MUI `Chip` that maps a bill status string (e.g., `PROCESSING`, `COMPLETED`, `FAILED`) to the appropriate MUI colour.

### `CategoryTable.jsx` / `results/CategoryResultTable.jsx`
Displays line items grouped by category (e.g., Room Charges, Medicines). Supports inline editing of Qty, Rate, and Tie-up Rate fields when Edit Mode is active on the Result page.

### `FinancialSummary.jsx` / `results/FinancialSummaryCard.jsx`
Shows aggregate financial totals: **Total Billed**, **Total Allowed**, **Total Extra**, and **Amount To Be Paid**.

### `VerificationSummary.jsx` / `results/VerificationSummaryCard.jsx`
Shows item count breakdown: total items, allowed, overcharged, and needs-review counts.

### `results/ResultFilters.jsx`
Collapsible filter panel on the Result page. Allows free-text search (matches bill item, best match, reason) and decision toggle buttons (Allowed / Overcharged / Needs Review).

---

## 🪝 Custom Hooks

### `useBillPolling(uploadId, enabled, initialStatus)`
- Polls `GET /status/:uploadId` on a fixed interval
- Interval: **5,000 ms** (from `POLLING_INTERVAL` constant)
- Max attempts: **200** (from `MAX_POLLING_ATTEMPTS`)
- Automatically stops polling when a terminal stage (`COMPLETED` or `FAILED`) is reached
- Handles component unmount cleanup via `isMountedRef`
- Returns: `{ status, loading, error, attempts, stopPolling }`

### `useAllBillsPolling()`
- Polls `GET /bills` for the Dashboard view
- Same interval and cleanup patterns as `useBillPolling`
- Returns: `{ bills, loading, error, refetch }`

---

## 🔌 API Service Layer

`src/services/api.js` is the single source of truth for all backend communication. It uses an **Axios** client with request/response interceptors for logging.

The base URL is resolved from `VITE_API_BASE_URL` environment variable, falling back to `/api` (proxied by Vite to `http://127.0.0.1:8001`).

### Exported Functions

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `uploadBill(file, hospitalName, employeeId, invoiceDate, clientRequestId)` | `POST` | `/upload` | Upload a PDF bill |
| `getUploadStatus(uploadId)` | `GET` | `/status/:uploadId` | Get processing status for one bill |
| `getAllBills()` | `GET` | `/bills` | Fetch all bills for the dashboard |
| `getBillData(uploadId)` | `GET` | `/bill/:uploadId` | Fetch full bill data and verification result |
| `patchBillLineItems(uploadId, lineItems, editedBy)` | `PATCH` | `/bill/:uploadId/line-items` | Save edited line items |
| `verifyBill(uploadId, hospitalName)` | `POST` | `/verify/:uploadId` | Trigger verification manually |
| `deleteBill(uploadId, permanent)` | `DELETE` | `/bills/:uploadId` | Delete a bill (soft or permanent) |
| `getHospitals()` | `GET` | `/tieups` | Fetch available hospital tie-ups |
| `reloadTieups()` | `POST` | `/tieups/reload` | Reload tie-up rates on backend |
| `healthCheck()` | `GET` | `/health` | Backend health check |

### Response Normalisers
All responses are normalised before being returned to the UI:
- `normalizeUploadResponse` — upload confirmation
- `normalizeStatusResponse` — status poll
- `normalizeBillsResponse` — bills list (handles both array and `{ bills: [] }` shapes)
- `normalizeBillDataResponse` — full bill detail with verification text or structured result
- `normalizeHospitalsResponse` — handles string or object hospital list

---

## 🧰 Utility Modules

| File | Purpose |
|---|---|
| `helpers.js` | `calculateProgress`, `isTerminalStage`, `formatFileSize`, `formatTimestamp`, `generateId` |
| `billDateDisplay.js` | Human-readable date formatting for bill upload/invoice dates |
| `billEditsStorage.js` | Read/write line item edits to `localStorage` keyed by `uploadId`; applied transparently on load |
| `pendingUploads.js` | In-memory + `localStorage` store for optimistic upload rows; subscribers notified via callbacks |
| `lineItemAmounts.js` | Compute allowed amount, extra amount, and amount to be paid from raw item fields |
| `verificationParser.js` | Parses raw text (markdown/plain-text) verification result into structured `{ summary, financial, categories }` |
| `verificationResultParser.js` | Parses structured JSON verification result into the same normalized shape |

---

## 🔄 Processing Stages & Constants

Defined in `src/constants/stages.js`.

### Bill Statuses

| Status | Meaning |
|---|---|
| `PENDING` | Upload request accepted, queued |
| `UPLOADED` | File received by the backend |
| `PROCESSING` | OCR and AI verification in progress |
| `COMPLETED` | Verification finished successfully |
| `FAILED` | Processing failed |

### Polling Configuration

| Constant | Value |
|---|---|
| `POLLING_INTERVAL` | `5000` ms (5 seconds) |
| `MAX_POLLING_ATTEMPTS` | `200` |

### File Upload Constraints

| Constraint | Value |
|---|---|
| `ACCEPTED_FILE_TYPES` | `application/pdf` → `.pdf` |
| `MAX_FILE_SIZE` | `10 MB` (10 × 1024 × 1024 bytes) |

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v16 or higher  
- **npm** (bundled with Node.js)
- Backend API running — see [Running With the Backend](#-running-with-the-backend)

### Steps

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install all dependencies
npm install

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:3000**.

---

## 🔐 Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Optional: override the backend API base URL
VITE_API_BASE_URL=http://127.0.0.1:8001
```

If `VITE_API_BASE_URL` is not set, the app defaults to `/api` which is proxied by Vite to `http://127.0.0.1:8001` in development.

---

## 🔧 Proxy Configuration

In development, Vite forwards all `/api/*` requests to the backend, stripping the `/api` prefix:

```javascript
// vite.config.js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

This means a call to `/api/bills` in code becomes `http://127.0.0.1:8001/bills` on the wire.

---

## ▶️ Running With the Backend

1. **Start the backend** (FastAPI, port 8001):
   ```bash
   cd ../backend
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

2. **Start the frontend**:
   ```bash
   cd ../frontend
   npm run dev
   ```

3. Open **http://localhost:3000** in your browser.

---

## 🏗️ Build for Production

```bash
npm run build
```

The optimised, minified output is placed in the `dist/` directory. Serve it with any static file server (e.g., Nginx, Render static site, Vercel).

To preview the production build locally:
```bash
npm run preview
```

---

## 🔍 Linting

```bash
npm run lint
```

The project uses **ESLint 8** with:
- `eslint:recommended`
- `plugin:react/recommended` (JSX runtime mode)
- `plugin:react-hooks/recommended`
- `eslint-plugin-react-refresh`

Prop-types checking is **disabled** in favour of JSDoc comments. Unused variables (except those prefixed with `_`) are reported as warnings.

---

## 🚦 Usage Flow

```
1. Upload Page
   └─ Select hospital, enter Employee ID, optionally enter Invoice Date
   └─ Choose PDF (≤ 10 MB)
   └─ Click "Upload and Verify"
         │
         ▼
2. Dashboard Page  ←── (opens immediately, bill shown as "Pending")
   └─ Polls /bills every 5 s
   └─ Shows queue-aware status (only one bill PROCESSING at a time)
   └─ Filter by Status / Hospital / Employee ID / Date
         │
         ▼
3. Status Page  (click bill row → "Track Status")
   └─ Polls /status/:uploadId every 5 s
   └─ Stepper: Uploaded → Processing → Completed / Failed
         │
         ▼
4. Result Page  (click "View Results" from Status, or bill row on Dashboard)
   └─ Loads /bill/:uploadId
   └─ Displays Verification Summary + Financial Summary
   └─ Per-category tables with decision badges
   └─ Filter by decision / search text
   └─ Edit Mode: update Qty / Rate / Tie-up Rate inline
   └─ Save → PATCH /bill/:uploadId/line-items
```

---

## 🐛 Troubleshooting

### Backend not reachable
- Confirm the backend is running on port **8001**
- Check Vite proxy in `vite.config.js`
- If using `VITE_API_BASE_URL`, ensure it points to the correct host and port
- Check CORS headers on the backend

### Upload succeeds but bill does not appear on Dashboard
- The Dashboard polls every 5 s — wait for the next poll cycle
- Check browser console for API errors (`[API Response Error]`)
- Verify the backend `/bills` endpoint returns the newly uploaded bill

### Polling stops prematurely
- The hook stops after **200 attempts** (~16 min at 5 s intervals); this is intentional
- If the backend is unreachable, polling errors are shown in the Status page

### Verification result not showing on Result page
- The result is only rendered when `status === COMPLETED` **and** `details_ready === true`
- If the backend hasn't set `details_ready`, an info alert is shown instead
- Check `/bill/:uploadId` response in the Network tab

### File upload rejected
- Only **PDF** files are accepted (`.pdf`, MIME `application/pdf`)
- Maximum file size is **10 MB**

---

## 📝 Additional Documentation

Several detailed design documents are available in the `frontend/` root and `docs/` sub-folder:

| Document | Contents |
|---|---|
| `ARCHITECTURE.md` | High-level system architecture |
| `COMPLETE_GUIDE.md` | End-to-end implementation guide |
| `COMPONENT_FLOW.md` | Data flow between components |
| `FLOW_DIAGRAMS.md` | ASCII/Mermaid flow diagrams |
| `BACKEND_INTEGRATION_GUIDE.md` | API contract and integration guide |
| `PRODUCTION_ARCHITECTURE.md` | Production deployment considerations |
| `RESULT_PAGE_IMPLEMENTATION.md` | Result page design details |
| `docs/BILL_RESULT_PAGE_CHANGES.md` | Changelog for Result page |
| `docs/2026-02-14_DASHBOARD_FILTERS_AND_COLUMNS.md` | Dashboard filter changelog |
| `docs/2026-02-14_DELETED_VIEW_WORKFLOW.md` | Deleted bills workflow |

---

## 📄 License

This project is part of the **NeuroVector Medical Bill Verification System**, developed during the Guwahati Refinery Internship programme.
