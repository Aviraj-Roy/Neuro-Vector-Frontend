# Medical Bill Verification System - Frontend

A modern, production-ready React frontend for the AI Medical Bill Verification System.

## 🚀 Features

- **File Upload**: Upload medical bills (PDF/Images) with validation
- **Hospital Selection**: Choose from available hospitals via dropdown
- **Real-time Polling**: Automatic status updates every 3 seconds
- **Progress Tracking**: Visual stepper showing all processing stages
- **Bill Lookup**: Search and view verification results by Bill ID
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Error Handling**: Comprehensive error states and user feedback
- **Clean Architecture**: Scalable folder structure with separation of concerns

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── Layout.jsx     # Main layout with navigation
│   │   └── ProgressTracker.jsx  # Stage progress visualization
│   ├── pages/             # Page components
│   │   ├── UploadPage.jsx       # File upload and hospital selection
│   │   ├── StatusPage.jsx       # Real-time status tracking
│   │   └── BillLookupPage.jsx   # Bill search and results
│   ├── services/          # API integration layer
│   │   └── api.js         # Centralized API calls
│   ├── hooks/             # Custom React hooks
│   │   └── useBillPolling.js    # Polling logic with cleanup
│   ├── constants/         # Application constants
│   │   └── stages.js      # Processing stages configuration
│   ├── utils/             # Helper functions
│   │   └── helpers.js     # Utility functions
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # React entry point
│   └── index.css          # Global styles
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── package.json           # Dependencies
└── README.md              # This file
```

## 🛠️ Tech Stack

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router v6** - Client-side routing
- **Material-UI (MUI)** - Component library
- **Axios** - HTTP client
- **React Hooks** - State management

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on port 8001

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment (optional):**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you need to change the API URL.

3. **Start development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

## 🏗️ Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

## 🔌 API Integration

The frontend communicates with the backend via these endpoints:

### Upload
- **POST** `/upload` - Upload bill file and hospital ID
  - Returns: `{ billId, status }`

### Status Polling
- **GET** `/status/:billId` - Get current processing status
  - Returns: `{ billId, stage, progress?, message? }`

### Bill Data
- **GET** `/bill/:billId` - Get complete bill data and verification results
  - Returns: Full bill object with verification results

### Hospitals
- **GET** `/tieups` - Get list of available hospitals
  - Returns: `[{ id, name }]`

## 🔄 Processing Stages

The system tracks bills through these stages:

1. **UPLOADED** - Bill uploaded successfully
2. **EXTRACTING** - Extracting text from document
3. **EXTRACTED** - Text extraction completed
4. **STORED** - Data stored in database
5. **VERIFYING** - Verifying against hospital rates
6. **COMPLETED** - Verification completed successfully
7. **FAILED** - Processing failed

## 🎯 Key Components

### ProgressTracker
Visual stepper component that displays:
- Current processing stage
- Overall progress percentage
- Stage-specific icons and descriptions
- Success/error states

### useBillPolling Hook
Custom hook that handles:
- Automatic polling every 3 seconds
- Cleanup on component unmount
- Terminal stage detection (COMPLETED/FAILED)
- Max attempts limit (200 attempts = 10 minutes)
- Memory leak prevention

### API Service Layer
Centralized API client with:
- Axios interceptors for logging
- Error handling
- Request/response transformation
- Type documentation via JSDoc

## 🎨 UI/UX Features

- **Material Design**: Clean, modern interface using MUI
- **Responsive Layout**: Mobile-first design
- **Loading States**: Visual feedback during async operations
- **Error Handling**: User-friendly error messages
- **Form Validation**: Client-side validation for uploads
- **File Type Checking**: Accepts PDF, JPG, PNG, WEBP
- **File Size Limit**: 10MB maximum

## 🔐 Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (default: `/api`)

## 🧪 Development

### Proxy Configuration

In development, Vite proxies `/api/*` requests to `http://localhost:8001`:

```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'http://localhost:8001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
```

### Running with Backend

1. Start the backend:
   ```bash
   cd ../backend
   uvicorn app.verifier.api:app --reload --port 8001
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

## 📝 Code Quality

- **Functional Components**: All components use modern React patterns
- **Custom Hooks**: Reusable logic extracted into hooks
- **PropTypes**: Type safety via JSDoc comments
- **Clean Code**: Well-commented and organized
- **Error Boundaries**: Graceful error handling
- **Memory Management**: Proper cleanup in useEffect

## 🚦 Usage Flow

1. **Upload**: User selects hospital and uploads bill file
2. **Redirect**: Automatically redirected to status page
3. **Polling**: Status page polls backend every 3 seconds
4. **Progress**: Visual progress tracker updates in real-time
5. **Completion**: When COMPLETED, user can view results
6. **Lookup**: Users can search bills by ID anytime

## 🐛 Troubleshooting

### Backend Connection Issues
- Ensure backend is running on port 8001
- Check CORS settings on backend
- Verify proxy configuration in `vite.config.js`

### Polling Not Working
- Check browser console for errors
- Verify billId is valid
- Ensure backend `/status/:billId` endpoint is working

### File Upload Fails
- Check file size (max 10MB)
- Verify file type (PDF, JPG, PNG, WEBP only)
- Ensure backend `/upload` endpoint accepts multipart/form-data

## 📄 License

This project is part of the Medical Bill Verification System.

## 🤝 Contributing

1. Follow the existing code structure
2. Use functional components and hooks
3. Add JSDoc comments for functions
4. Test all API integrations
5. Ensure responsive design

## 📞 Support

For issues or questions, please refer to the main project documentation.
