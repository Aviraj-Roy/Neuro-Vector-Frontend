# Frontend Architecture Documentation

## Overview

This document provides a detailed explanation of the frontend architecture, design decisions, and implementation patterns used in the Medical Bill Verification System.

## Architecture Principles

### 1. Separation of Concerns
- **Pages**: Handle routing and page-level state
- **Components**: Reusable UI elements
- **Services**: API communication layer
- **Hooks**: Reusable stateful logic
- **Utils**: Pure helper functions
- **Constants**: Configuration and static data

### 2. Unidirectional Data Flow
- State flows down via props
- Events flow up via callbacks
- No prop drilling (using composition)

### 3. Single Responsibility
- Each component has one clear purpose
- Functions do one thing well
- Files are focused and cohesive

## Folder Structure Deep Dive

### `/src/components/`
Reusable UI components that can be used across multiple pages.

**Layout.jsx**
- Provides consistent navigation and footer
- Uses React Router's `<Outlet />` for nested routing
- Responsive design with mobile/desktop variants
- Active route highlighting

**ProgressTracker.jsx**
- Displays processing stages as a vertical stepper
- Shows progress percentage
- Dynamic styling based on current stage
- Handles success/error states

### `/src/pages/`
Page-level components that represent routes.

**UploadPage.jsx**
- File upload with drag-and-drop UI
- Hospital selection dropdown
- Client-side validation (file type, size)
- Navigates to StatusPage on success

**StatusPage.jsx**
- Uses `useBillPolling` hook for real-time updates
- Displays ProgressTracker component
- Shows action buttons based on stage
- Handles navigation to results

**BillLookupPage.jsx**
- Search interface for bill ID
- Displays bill information and status
- Shows verification results as formatted JSON
- Supports URL-based billId parameter

### `/src/services/`
API communication layer.

**api.js**
- Centralized axios instance
- Request/response interceptors
- Error handling
- JSDoc type documentation
- All backend endpoints defined here

### `/src/hooks/`
Custom React hooks for reusable logic.

**useBillPolling.js**
- Polls `/status/:billId` every 3 seconds
- Automatic cleanup on unmount
- Stops polling on terminal stages
- Max attempts limit (200 = 10 minutes)
- Memory leak prevention using refs

### `/src/constants/`
Application-wide constants.

**stages.js**
- Processing stage definitions
- Stage configuration (labels, colors, icons)
- Stage ordering for progress calculation
- Terminal stages list
- Polling configuration
- File upload constraints

### `/src/utils/`
Pure utility functions.

**helpers.js**
- Progress calculation
- File validation
- Formatting functions (size, timestamp)
- Stage index lookup
- Terminal stage checking

## Key Design Patterns

### 1. Custom Hooks Pattern

**useBillPolling Hook**
```javascript
const { status, loading, error, stopPolling } = useBillPolling(billId, enabled);
```

**Benefits:**
- Encapsulates complex polling logic
- Reusable across components
- Proper cleanup handling
- Testable in isolation

**Implementation Details:**
- Uses `useRef` to track mounted state (prevents memory leaks)
- Uses `useCallback` for stable function references
- Uses `useEffect` for lifecycle management
- Clears interval on unmount or terminal stage

### 2. Service Layer Pattern

**Centralized API Client**
```javascript
import { uploadBill, getBillStatus } from '../services/api';
```

**Benefits:**
- Single source of truth for API calls
- Easy to mock for testing
- Consistent error handling
- Request/response transformation

**Implementation:**
- Axios instance with base configuration
- Interceptors for logging and error handling
- Typed with JSDoc comments
- Environment-aware base URL

### 3. Component Composition

**Layout with Outlet**
```javascript
<Layout>
  <Outlet /> {/* Renders child routes */}
</Layout>
```

**Benefits:**
- Consistent UI across pages
- No prop drilling
- Easy to add new pages
- Shared navigation state

### 4. Controlled Components

All form inputs are controlled:
```javascript
const [value, setValue] = useState('');
<TextField value={value} onChange={(e) => setValue(e.target.value)} />
```

**Benefits:**
- Single source of truth
- Easy validation
- Predictable state updates

## State Management Strategy

### Local State (useState)
Used for:
- Form inputs
- UI toggles
- Component-specific data

### Custom Hooks (useEffect + useState)
Used for:
- API data fetching
- Polling logic
- Side effects with cleanup

### URL State (React Router)
Used for:
- billId parameter
- Current page/route
- Shareable links

**No Global State Library Needed**
- Application is simple enough
- Props and composition work well
- URL handles shared state

## Polling Implementation

### Why Polling?
- Backend doesn't support WebSockets
- Simple to implement
- Reliable for this use case
- Predictable resource usage

### Polling Strategy

**Interval:** 3 seconds
- Fast enough for good UX
- Not too aggressive on backend

**Cleanup:**
```javascript
useEffect(() => {
  const interval = setInterval(fetchStatus, 3000);
  return () => clearInterval(interval); // Cleanup
}, []);
```

**Terminal Conditions:**
- Stage is COMPLETED
- Stage is FAILED
- Max attempts reached (200)
- Component unmounted

**Memory Leak Prevention:**
```javascript
const isMountedRef = useRef(true);
if (isMountedRef.current) {
  setStatus(data); // Only update if mounted
}
```

## Error Handling

### Levels of Error Handling

**1. API Service Layer**
- Axios interceptors catch all errors
- Log to console
- Return rejected promise

**2. Component Level**
- Try-catch around API calls
- Set error state
- Display user-friendly messages

**3. UI Level**
- Material-UI Alert components
- Inline validation messages
- Disabled states during loading

### Error Types

**Network Errors**
```javascript
catch (err) {
  setError('Failed to connect to server');
}
```

**Validation Errors**
```javascript
if (!isValidFileType(file)) {
  setFileError('Invalid file type');
}
```

**API Errors**
```javascript
setError(err.response?.data?.message || 'Something went wrong');
```

## Routing Strategy

### Route Structure
```
/                    → UploadPage
/status/:billId      → StatusPage
/lookup              → BillLookupPage
/bill/:billId        → BillLookupPage (same component)
/*                   → Redirect to /
```

### Navigation Patterns

**Programmatic Navigation**
```javascript
const navigate = useNavigate();
navigate(`/status/${billId}`);
```

**URL Parameters**
```javascript
const { billId } = useParams();
```

**Active Route Detection**
```javascript
const location = useLocation();
const isActive = location.pathname === '/';
```

## Material-UI Integration

### Theme Configuration

**Custom Theme**
- Primary color: Blue (#1976d2)
- Success color: Green (#2e7d32)
- Error color: Red (#d32f2f)
- Custom border radius: 8px/12px

**Component Overrides**
- Buttons: No text transform
- Papers: Rounded corners
- Consistent spacing

### Responsive Design

**Breakpoints**
```javascript
const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
```

**Mobile Adaptations**
- Icon-only navigation on mobile
- Smaller font sizes
- Adjusted spacing

## Performance Considerations

### 1. Cleanup
- Clear intervals on unmount
- Cancel pending requests
- Remove event listeners

### 2. Memoization
- `useCallback` for stable function references
- Prevents unnecessary re-renders

### 3. Code Splitting
- React Router handles route-based splitting
- Lazy loading can be added if needed

### 4. Optimistic Updates
- Show loading states immediately
- Update UI before API response

## Security Considerations

### 1. Input Validation
- File type checking
- File size limits
- Sanitize user inputs

### 2. API Security
- CORS handled by backend
- No sensitive data in frontend
- Environment variables for config

### 3. XSS Prevention
- React escapes by default
- No `dangerouslySetInnerHTML`
- Sanitize JSON display

## Testing Strategy (Future)

### Unit Tests
- Utility functions
- Custom hooks
- API service

### Integration Tests
- Component interactions
- Form submissions
- Navigation flows

### E2E Tests
- Full user workflows
- Upload → Status → Results
- Error scenarios

## Deployment Considerations

### Build Process
```bash
npm run build
```
- Vite bundles for production
- Minification and optimization
- Output to `dist/`

### Environment Variables
- `VITE_API_BASE_URL` for backend URL
- Set in `.env` or deployment platform

### Static Hosting
- Can deploy to Netlify, Vercel, etc.
- Configure redirects for SPA routing
- Set environment variables in platform

### Backend Integration
- Ensure CORS is configured
- API must be accessible from frontend domain
- Consider API rate limiting

## Future Enhancements

### 1. WebSocket Support
- Replace polling with real-time updates
- More efficient for backend
- Better UX with instant updates

### 2. Advanced Features
- Download verification report as PDF
- Email notifications
- Bill history for users
- Batch upload support

### 3. Improved UI
- Dark mode toggle
- Accessibility improvements
- Animations and transitions
- Better mobile experience

### 4. State Management
- Add Redux/Zustand if app grows
- Centralized state for complex features
- Better dev tools

### 5. Testing
- Add comprehensive test suite
- CI/CD integration
- Automated testing

## Code Quality Guidelines

### 1. Naming Conventions
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: Match component name

### 2. File Organization
- One component per file
- Related files in same folder
- Index files for exports

### 3. Comments
- JSDoc for functions
- Inline comments for complex logic
- No obvious comments

### 4. Formatting
- Consistent indentation
- Meaningful variable names
- Destructure props
- Early returns

## Troubleshooting Guide

### Polling Not Stopping
- Check terminal stage detection
- Verify cleanup in useEffect
- Check isMountedRef logic

### Memory Leaks
- Ensure all intervals are cleared
- Check ref usage
- Verify cleanup functions

### API Errors
- Check backend is running
- Verify proxy configuration
- Check CORS settings
- Inspect network tab

### Build Failures
- Clear node_modules and reinstall
- Check for syntax errors
- Verify all imports exist

## Conclusion

This architecture provides:
- **Scalability**: Easy to add new features
- **Maintainability**: Clear structure and patterns
- **Testability**: Isolated, focused components
- **Performance**: Efficient rendering and cleanup
- **Developer Experience**: Clear conventions and documentation

The codebase follows React best practices and is production-ready for deployment.
