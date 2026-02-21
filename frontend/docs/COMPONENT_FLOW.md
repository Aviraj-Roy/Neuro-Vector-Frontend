# Component Interaction Flow

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (User)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      React Application                          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    App.jsx (Router)                      │  │
│  │  - ThemeProvider                                         │  │
│  │  - BrowserRouter                                         │  │
│  │  - Routes Configuration                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Layout.jsx                              │  │
│  │  - AppBar (Navigation)                                   │  │
│  │  - Outlet (Child Routes)                                 │  │
│  │  - Footer                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│         ┌────────────────────┼────────────────────┐            │
│         ▼                    ▼                    ▼            │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐        │
│  │ UploadPage  │   │ StatusPage   │   │ BillLookup   │        │
│  │             │   │              │   │    Page      │        │
│  │ - File      │   │ - Polling    │   │ - Search     │        │
│  │   Upload    │   │ - Progress   │   │ - Results    │        │
│  │ - Hospital  │   │   Tracker    │   │   Display    │        │
│  │   Select    │   │ - Actions    │   │              │        │
│  └─────────────┘   └──────────────┘   └──────────────┘        │
│         │                    │                    │            │
│         └────────────────────┼────────────────────┘            │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                   Services Layer                         │  │
│  │                                                          │  │
│  │  ┌────────────────────────────────────────────────────┐ │  │
│  │  │              api.js (Axios Client)                 │ │  │
│  │  │                                                    │ │  │
│  │  │  - uploadBill()                                   │ │  │
│  │  │  - getBillStatus()                                │ │  │
│  │  │  - getBillData()                                  │ │  │
│  │  │  - getHospitals()                                 │ │  │
│  │  │                                                    │ │  │
│  │  │  Interceptors:                                    │ │  │
│  │  │  - Request logging                                │ │  │
│  │  │  - Response error handling                        │ │  │
│  │  └────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
                    ┌──────────────────┐
                    │  Vite Dev Proxy  │
                    │   /api → :8001   │
                    └──────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                        │
│                      Port 8001                                  │
│                                                                 │
│  POST   /upload          → Upload bill file                    │
│  GET    /status/:billId  → Get processing status               │
│  GET    /bill/:billId    → Get bill data + results             │
│  GET    /tieups          → Get hospitals list                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Upload Flow

```
User Action                Component               Service              Backend
─────────────────────────────────────────────────────────────────────────────
                                                                        
Select File    ──────────►  UploadPage                                
                            │                                         
                            │ Validate                                
                            │ (type, size)                            
                            │                                         
Select Hospital ─────────►  │                                         
                            │                                         
Click Upload   ─────────►   │                                         
                            │                                         
                            │ ──────────►  uploadBill()               
                            │              (FormData)  ──────────►  POST /upload
                            │                                         │
                            │                          ◄──────────  { billId }
                            │ ◄──────────  { billId }                
                            │                                         
                            │ navigate(`/status/${billId}`)           
                            │                                         
                            ▼                                         
                         StatusPage                                   
```

### 2. Polling Flow

```
Component          Hook                Service              Backend
──────────────────────────────────────────────────────────────────────

StatusPage  ──────►  useBillPolling                        
                     │                                     
                     │ useEffect                           
                     │ (mount)                             
                     │                                     
                     │ setInterval                         
                     │ (3 seconds)                         
                     │                                     
                     │ ──────────►  getBillStatus()        
                     │              (billId)  ──────────►  GET /status/:billId
                     │                                     │
                     │                        ◄──────────  { stage, progress }
                     │ ◄──────────  { stage }              
                     │                                     
                     │ Check if                            
                     │ terminal stage                      
                     │                                     
                     │ If COMPLETED                        
                     │ or FAILED:                          
                     │ clearInterval()                     
                     │                                     
                     │ useEffect                           
                     │ (unmount)                           
                     │ clearInterval()                     
                     │                                     
                     ▼                                     
                  StatusPage                               
                  (re-render)                              
```

### 3. Results Flow

```
User Action         Component            Service              Backend
────────────────────────────────────────────────────────────────────────

Enter Bill ID  ──►  BillLookupPage                          
                    │                                       
Click Search   ──►  │                                       
                    │                                       
                    │ ──────────►  getBillData()            
                    │              (billId)  ──────────►  GET /bill/:billId
                    │                                       │
                    │                        ◄──────────  { bill data,
                    │ ◄──────────  Full data                verification }
                    │                                       
                    │ Display:                              
                    │ - Bill info                           
                    │ - Status                              
                    │ - Results (JSON)                      
                    │                                       
                    ▼                                       
                 Results Display                            
```

---

## Component Hierarchy

```
App
└── Layout
    ├── AppBar (Navigation)
    ├── Outlet (Routes)
    │   ├── UploadPage (/)
    │   │   └── (No child components)
    │   │
    │   ├── StatusPage (/status/:billId)
    │   │   └── ProgressTracker
    │   │       └── Stepper
    │   │           └── Step (x7)
    │   │
    │   └── BillLookupPage (/lookup or /bill/:billId)
    │       └── (No child components)
    │
    └── Footer
```

---

## Hook Dependencies

```
useBillPolling Hook
├── useState (status, loading, error, attempts)
├── useEffect (polling lifecycle)
│   ├── setInterval (every 3 seconds)
│   └── cleanup (clearInterval)
├── useRef (intervalRef, isMountedRef)
└── useCallback (fetchStatus, stopPolling)
    └── getBillStatus (API service)
```

---

## State Management Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      State Types                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Local Component State (useState)                        │
│     - Form inputs (file, hospital)                          │
│     - Loading states                                        │
│     - Error messages                                        │
│     - UI toggles                                            │
│                                                             │
│  2. Custom Hook State (useBillPolling)                      │
│     - Bill status                                           │
│     - Polling state                                         │
│     - Attempt counter                                       │
│                                                             │
│  3. URL State (React Router)                                │
│     - billId parameter                                      │
│     - Current route                                         │
│                                                             │
│  4. Theme State (Material-UI)                               │
│     - Theme configuration                                   │
│     - Responsive breakpoints                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## API Request/Response Flow

```
Component                 Axios Client              Backend
────────────────────────────────────────────────────────────────

Request  ──────────►  Request Interceptor         
                      │                           
                      │ Log request               
                      │ Add headers               
                      │                           
                      ▼                           
                   HTTP Request  ──────────────►  FastAPI
                                                  │
                                                  │ Process
                                                  │
                   HTTP Response ◄──────────────  │
                      │                           
                      ▼                           
                   Response Interceptor           
                      │                           
                      │ Log response              
                      │ Handle errors             
                      │                           
                      ▼                           
Response ◄──────────  Return data                 
```

---

## Error Handling Flow

```
Error Source          Detection              Handling                Display
─────────────────────────────────────────────────────────────────────────────

Network Error    ──►  Axios Interceptor  ──►  Catch in Component  ──►  Alert
                                              setError()               

API Error        ──►  Response Status    ──►  Catch in Component  ──►  Alert
(4xx, 5xx)           (interceptor)           setError(message)        

Validation       ──►  Component Logic    ──►  Set error state     ──►  Inline
Error                (file check)            setFileError()           Message

Polling          ──►  Max attempts       ──►  Set error state     ──►  Alert
Timeout              check in hook           stopPolling()            

Component        ──►  Try-Catch Block    ──►  Set error state     ──►  Alert
Error                                        setError()               
```

---

## Lifecycle Flow

### Component Mount
```
1. Component renders
2. useEffect runs
3. Fetch initial data (if needed)
4. Set up intervals/listeners
5. Component ready
```

### Component Update
```
1. State/props change
2. Component re-renders
3. useEffect dependencies checked
4. Run effects if dependencies changed
5. Cleanup previous effects
6. Set up new effects
```

### Component Unmount
```
1. Cleanup function called
2. Clear intervals
3. Cancel pending requests
4. Remove listeners
5. Component removed
```

---

## Polling Lifecycle

```
Mount
  │
  ├─► Initial fetch
  │
  ├─► Start interval (3s)
  │     │
  │     ├─► Fetch status
  │     │     │
  │     │     ├─► Update state
  │     │     │
  │     │     ├─► Check if terminal
  │     │     │     │
  │     │     │     ├─► If YES: Stop polling
  │     │     │     │
  │     │     │     └─► If NO: Continue
  │     │     │
  │     │     └─► Repeat after 3s
  │     │
  │     └─► Max attempts reached?
  │           │
  │           ├─► If YES: Stop polling
  │           │
  │           └─► If NO: Continue
  │
Unmount
  │
  └─► Cleanup: Clear interval
```

---

## Routing Flow

```
URL Change
  │
  ├─► React Router detects
  │
  ├─► Match route
  │     │
  │     ├─► /              → UploadPage
  │     ├─► /status/:id    → StatusPage
  │     ├─► /lookup        → BillLookupPage
  │     ├─► /bill/:id      → BillLookupPage
  │     └─► /*             → Redirect to /
  │
  ├─► Render Layout
  │     │
  │     └─► Render matched component in Outlet
  │
  └─► Update browser history
```

---

## Summary

This diagram shows:

1. **Component Hierarchy**: How components are nested
2. **Data Flow**: How data moves through the app
3. **State Management**: Different types of state
4. **API Integration**: Request/response flow
5. **Error Handling**: How errors are caught and displayed
6. **Lifecycle**: Component mount/update/unmount
7. **Polling**: Real-time update mechanism
8. **Routing**: Navigation between pages

All flows are designed to be:
- **Unidirectional**: Data flows one way
- **Predictable**: Clear cause and effect
- **Maintainable**: Easy to debug and extend
- **Performant**: Efficient rendering and cleanup
