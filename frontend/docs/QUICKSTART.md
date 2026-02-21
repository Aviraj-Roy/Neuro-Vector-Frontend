# Quick Start Guide

## Prerequisites Check

Before starting, ensure you have:
- [ ] Node.js v16+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Backend running on port 8001

## Installation Steps

### 1. Install Node.js (if not installed)

**Windows:**
Download from: https://nodejs.org/

**Verify installation:**
```bash
node --version
npm --version
```

### 2. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- React 18
- React Router v6
- Material-UI (MUI)
- Axios
- Vite
- All dev dependencies

### 3. Start Development Server

```bash
npm run dev
```

The app will start at: `http://localhost:3000`

### 4. Start Backend (in separate terminal)

```bash
cd ../backend
uvicorn app.verifier.api:app --reload --port 8001
```

Backend will run at: `http://localhost:8001`

## Verification

1. Open browser to `http://localhost:3000`
2. You should see the Upload page
3. Try selecting a hospital from dropdown
4. If hospitals load, backend connection is working!

## Common Issues

### Issue: `npx: command not found`
**Solution:** Install Node.js from https://nodejs.org/

### Issue: `npm install` fails
**Solution:** 
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

### Issue: Backend connection error
**Solution:**
- Ensure backend is running on port 8001
- Check `vite.config.js` proxy settings
- Verify CORS is enabled on backend

### Issue: Port 3000 already in use
**Solution:**
```bash
# Use different port
npm run dev -- --port 3001
```

## Next Steps

1. **Upload a Bill**: Click "Upload" and select a file
2. **Track Progress**: Watch real-time status updates
3. **View Results**: See verification results when complete
4. **Lookup Bills**: Search by Bill ID

## Development Tips

### Hot Reload
- Changes to `.jsx` files reload automatically
- Changes to `.css` files update instantly
- No need to restart server

### Browser DevTools
- Open DevTools (F12)
- Check Console for logs
- Check Network tab for API calls

### API Proxy
- All `/api/*` requests proxy to backend
- See `vite.config.js` for configuration
- No CORS issues in development

## Build for Production

```bash
npm run build
```

Output will be in `dist/` folder.

Preview production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── services/       # API layer
│   ├── hooks/          # Custom hooks
│   ├── constants/      # Config
│   └── utils/          # Helpers
├── public/             # Static files
└── package.json        # Dependencies
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Environment Variables

Create `.env` file (optional):
```env
VITE_API_BASE_URL=/api
```

## Support

- Check `README.md` for detailed documentation
- Check `ARCHITECTURE.md` for technical details
- Check browser console for errors
- Check backend logs for API issues

## Success Checklist

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)
- [ ] Backend running (port 8001)
- [ ] Browser shows upload page
- [ ] Hospitals dropdown loads
- [ ] Can upload a file
- [ ] Status page shows progress
- [ ] Results page displays data

## You're Ready! 🎉

Start building and testing your medical bill verification system!
