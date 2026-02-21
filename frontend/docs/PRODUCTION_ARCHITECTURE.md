# Production-Ready React Frontend Architecture
## AI Medical Bill Verification System

---

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Flow](#architecture-flow)
3. [Folder Structure](#folder-structure)
4. [API Integration](#api-integration)
5. [Polling System](#polling-system)
6. [Component Documentation](#component-documentation)
7. [Routing Setup](#routing-setup)
8. [Technical Stack](#technical-stack)

---

## 🎯 System Overview

### Key Features
- **No Authentication**: Simple, direct access
- **Asynchronous Processing**: Backend processes bills in stages
- **Multi-Bill Support**: Track multiple uploaded bills simultaneously
- **Live Status Tracking**: Real-time polling every 3 seconds
- **Production-Ready**: Clean, scalable, maintainable code

### User Flow
```
1. User uploads bill (PDF/Image) + selects hospital
   ↓
2. POST /upload → Returns billId
   ↓
3. Redirect to /dashboard
   ↓
4. Dashboard polls GET /bills every 3 seconds
   ↓
5. Shows all bills in table with live status
   ↓
6. When stage === "COMPLETED" → View Result button appears
   ↓
7. Click "View Result" → Navigate to /bill/:billId
   ↓
8. GET /bill/:billId → Display verification results
```

---

## 🏗️ Architecture Flow

### 1. Upload Page (`/upload`)

**Purpose**: Upload medical bills with hospital selection

**Features**:
- File upload input (PDF, JPG, PNG, WEBP)
- Hospital dropdown selector
- File validation (type & size)
- Submit button

**API Call**:
```javascript
POST /upload
FormData: {
  file: File,
  hospital_name: string
}

Response: {
  billId: string,
  fileName: string,
  uploadedAt: string,
  size: number,
  stage: string
}
```

**After Upload**:
- Immediately redirect to `/dashboard`
- No status page for individual bills

---

### 2. Dashboard Page (`/dashboard`)

**Purpose**: Display ALL uploaded bills with live status tracking

**Table Columns**:
| Column | Description | Example |
|--------|-------------|---------|
| Bill ID | Truncated identifier | `8e162cf...` |
| File Name | Original filename | `bill1.pdf` |
| Uploaded At | Formatted timestamp | `12 Feb 2026, 10:21 AM` |
| File Size | Human-readable size | `2.4MB` |
| Current Stage | Status badge | `Extracting` (colored) |
| Action | View Result button | Only if `COMPLETED` |

**Example Row**:
```
| 8e162cf... | bill1.pdf | 12 Feb 2026, 10:21 AM | 2.4MB | Extracting | — |
```

**Polling Behavior**:
- Polls `GET /bills` every 3 seconds
- Replaces entire table data on each poll
- Stops polling ONLY when no bills are in active states
- Active states: `UPLOADED`, `EXTRACTING`, `STORED`, `VERIFYING`
- Terminal states: `COMPLETED`, `FAILED`

---

### 3. Bill Details Page (`/bill/:billId`)

**Purpose**: Display verification results for completed bills

**API Call**:
```javascript
GET /bill/:billId

Response: {
  billId: string,
  status: string,
  verification_result: {
    summary: object,
    mismatches: array,
    decision: string
  }
}
```

**Display**:
- Final status
- Verification summary
- Mismatch list
- Final decision

---

## 📁 Folder Structure

```
frontend/
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── Layout.jsx           # Main layout with navigation
│   │   ├── StatusBadge.jsx      # Color-coded status badges
│   │   ├── BillsTable.jsx       # Table component for dashboard
│   │   └── ProgressTracker.jsx  # (Legacy - for individual status)
│   │
│   ├── pages/                   # Page components
│   │   ├── UploadPage.jsx       # File upload + hospital selection
│   │   ├── DashboardPage.jsx    # All bills with polling
│   │   └── BillLookupPage.jsx   # Individual bill details
│   │
│   ├── services/                # API layer
│   │   └── api.js               # Centralized API calls
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useBillPolling.js    # Single bill polling (legacy)
│   │   └── useAllBillsPolling.js # Multi-bill polling
│   │
│   ├── constants/               # Application constants
│   │   └── stages.js            # Processing stages & config
│   │
│   ├── utils/                   # Helper functions
│   │   └── helpers.js           # Utility functions
│   │
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
│
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🔌 API Integration

### API Service Layer (`src/services/api.js`)

**Base Configuration**:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
```

**Available Endpoints**:

#### 1. Upload Bill
```javascript
uploadBill(file, hospitalName)
→ POST /upload
→ Returns: { billId, fileName, uploadedAt, size, stage }
```

#### 2. Get All Bills (NEW - Required for Dashboard)
```javascript
getAllBills()
→ GET /bills
→ Returns: [
    {
      billId: string,
      fileName: string,
      uploadedAt: string,
      size: number,
      stage: string,
      progressPercentage: number
    }
  ]
```

#### 3. Get Bill Status
```javascript
getBillStatus(billId)
→ GET /status/:billId
→ Returns: { billId, stage, progress, message }
```

#### 4. Get Bill Data
```javascript
getBillData(billId)
→ GET /bill/:billId
→ Returns: { billId, status, verification_result }
```

#### 5. Get Hospitals
```javascript
getHospitals()
→ GET /tieups
→ Returns: [{ id, name }]
```

**Response Normalization**:
All API responses are normalized to ensure consistent field names across different backend implementations.

---

## 🔄 Polling System

### Multi-Bill Polling Hook (`useAllBillsPolling.js`)

**Purpose**: Poll all bills every 3 seconds with automatic cleanup

**Implementation**:
```javascript
export const useAllBillsPolling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch all bills
    const fetchBills = useCallback(async () => {
        const data = await getAllBills();
        setBills(data);
        
        // Stop polling if no active bills
        if (!hasActiveBills(data)) {
            stopPolling();
        }
    }, []);

    // Start polling on mount
    useEffect(() => {
        fetchBills(); // Initial fetch
        
        const interval = setInterval(() => {
            fetchBills();
        }, POLLING_INTERVAL); // 3 seconds
        
        return () => clearInterval(interval); // Cleanup
    }, [fetchBills]);

    return { bills, loading, error, refetch: fetchBills };
};
```

**Key Features**:
- ✅ Polls every 3 seconds
- ✅ Automatic cleanup on unmount
- ✅ Stops when all bills are in terminal states
- ✅ Prevents memory leaks with `isMountedRef`
- ✅ Manual refetch capability

**Active States** (continues polling):
- `UPLOADED`
- `EXTRACTING`
- `STORED`
- `VERIFYING`

**Terminal States** (stops polling):
- `COMPLETED`
- `FAILED`

---

## 🧩 Component Documentation

### 1. StatusBadge Component

**Purpose**: Display color-coded status badges

**Props**:
```javascript
{
  stage: string,    // Processing stage
  size: 'small' | 'medium'
}
```

**Color Mapping**:
```javascript
COMPLETED  → Green   (success)
FAILED     → Red     (error)
VERIFYING  → Yellow  (warning)
EXTRACTING → Blue    (info)
UPLOADED   → Blue    (info)
STORED     → Blue    (info)
EXTRACTED  → Blue    (info)
```

**Usage**:
```jsx
<StatusBadge stage="COMPLETED" size="small" />
```

---

### 2. BillsTable Component

**Purpose**: Display all bills in a table format

**Props**:
```javascript
{
  bills: Array<Bill>,
  loading: boolean
}
```

**Features**:
- Truncated Bill IDs with full ID on hover
- Formatted dates (12 Feb 2026, 10:21 AM)
- Human-readable file sizes (2.4MB)
- Status badges
- View Result button (only for COMPLETED bills)
- Empty state handling
- Loading state

**Usage**:
```jsx
<BillsTable bills={bills} loading={loading} />
```

---

### 3. DashboardPage Component

**Purpose**: Main dashboard with polling

**Features**:
- Auto-polling using `useAllBillsPolling` hook
- Refresh button for manual update
- Upload New Bill button
- Error handling
- Polling indicator
- Info box with instructions

**State Management**:
```javascript
const { bills, loading, error, refetch } = useAllBillsPolling();
```

---

### 4. UploadPage Component

**Purpose**: File upload with hospital selection

**Features**:
- File drag & drop zone
- File type validation (PDF, JPG, PNG, WEBP)
- File size validation (max 10MB)
- Hospital dropdown
- Loading states
- Error handling
- Redirects to `/dashboard` after successful upload

---

### 5. Layout Component

**Purpose**: Consistent layout with navigation

**Navigation**:
- **Upload** → `/upload`
- **Dashboard** → `/dashboard`

**Features**:
- Responsive design (mobile & desktop)
- Active route highlighting
- Logo/title navigation
- Footer

---

## 🛣️ Routing Setup

### Route Configuration (`App.jsx`)

```javascript
<Routes>
  <Route path="/" element={<Layout />}>
    {/* Upload Page */}
    <Route path="upload" element={<UploadPage />} />

    {/* Dashboard Page - Shows all bills with polling */}
    <Route path="dashboard" element={<DashboardPage />} />

    {/* Bill Details Page - View individual bill results */}
    <Route path="bill/:billId" element={<BillLookupPage />} />

    {/* Redirect root to upload */}
    <Route index element={<Navigate to="/upload" replace />} />

    {/* Catch-all redirect to upload */}
    <Route path="*" element={<Navigate to="/upload" replace />} />
  </Route>
</Routes>
```

**Route Descriptions**:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/upload` | UploadPage | Upload bills |
| `/dashboard` | DashboardPage | View all bills with polling |
| `/bill/:billId` | BillLookupPage | View individual bill results |
| `/` | Redirect | → `/upload` |
| `*` | Redirect | → `/upload` |

---

## 🛠️ Technical Stack

### Core Technologies
- **React 18** - UI library with hooks
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **Emotion** - CSS-in-JS (MUI dependency)

### Development Tools
- **ESLint** - Code linting
- **Vite Dev Server** - Hot module replacement
- **Proxy** - API proxying to backend

### Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.21.0",
  "@mui/material": "^5.15.0",
  "@mui/icons-material": "^5.15.0",
  "axios": "^1.6.2"
}
```

---

## 🚀 Running the Application

### Development Mode
```bash
npm install
npm run dev
```
Access at: `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables
Create `.env` file:
```env
VITE_API_BASE_URL=/api
```

### Proxy Configuration
In `vite.config.js`:
```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

---

## ✅ Production Checklist

- ✅ Clean folder structure
- ✅ Separation of concerns (components, services, hooks)
- ✅ Proper error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Polling with cleanup
- ✅ Memory leak prevention
- ✅ Type documentation (JSDoc)
- ✅ Status badge component
- ✅ Table component
- ✅ API service layer
- ✅ Custom hooks
- ✅ Routing setup
- ✅ Production-ready code quality

---

## 🎨 Design Patterns

### 1. Custom Hooks Pattern
Encapsulate complex logic in reusable hooks:
- `useAllBillsPolling` - Multi-bill polling
- `useBillPolling` - Single bill polling (legacy)

### 2. Service Layer Pattern
Centralize all API calls in `services/api.js`:
- Single source of truth
- Easy to mock for testing
- Response normalization

### 3. Component Composition
Break down UI into reusable components:
- `StatusBadge` - Reusable status indicator
- `BillsTable` - Reusable table component
- `Layout` - Consistent page structure

### 4. Separation of Concerns
- **Components**: UI rendering
- **Hooks**: Business logic
- **Services**: API communication
- **Utils**: Helper functions
- **Constants**: Configuration

---

## 📊 Data Flow

```
User Action (Upload)
    ↓
UploadPage Component
    ↓
uploadBill() API call
    ↓
Backend Processing
    ↓
Redirect to Dashboard
    ↓
DashboardPage Component
    ↓
useAllBillsPolling Hook
    ↓
getAllBills() API call (every 3s)
    ↓
BillsTable Component
    ↓
StatusBadge Component
    ↓
User clicks "View Result"
    ↓
Navigate to /bill/:billId
    ↓
BillLookupPage Component
    ↓
getBillData() API call
    ↓
Display Results
```

---

## 🔒 Error Handling

### API Level
- Axios interceptors for logging
- Error response normalization
- User-friendly error messages

### Component Level
- Try-catch blocks in async operations
- Error state management
- Error alerts with dismiss functionality

### Polling Level
- Graceful degradation on API failures
- Continues polling on transient errors
- Stops polling on terminal states

---

## 🎯 Key Differences from Previous Implementation

| Aspect | Old | New |
|--------|-----|-----|
| Upload redirect | `/status/:billId` | `/dashboard` |
| Status tracking | Individual page | Dashboard table |
| Polling | Single bill | All bills |
| Navigation | Upload, Lookup | Upload, Dashboard |
| Main view | Individual status | All bills table |

---

## 📝 Notes

1. **No Authentication**: System is open access
2. **Polling Efficiency**: Stops when all bills are terminal
3. **Scalability**: Table handles multiple bills efficiently
4. **UX**: Immediate feedback with live updates
5. **Production-Ready**: Clean, maintainable, documented code

---

**Last Updated**: February 12, 2026
**Version**: 1.0.0
**Status**: Production-Ready ✅
