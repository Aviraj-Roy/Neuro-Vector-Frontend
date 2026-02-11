import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Layout from './components/Layout';
import UploadPage from './pages/UploadPage';
import StatusPage from './pages/StatusPage';
import BillLookupPage from './pages/BillLookupPage';

// Create Material-UI theme
const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
            light: '#42a5f5',
            dark: '#1565c0',
        },
        secondary: {
            main: '#dc004e',
            light: '#f73378',
            dark: '#9a0036',
        },
        success: {
            main: '#2e7d32',
            light: '#4caf50',
            lighter: '#e8f5e9',
        },
        error: {
            main: '#d32f2f',
            light: '#ef5350',
            lighter: '#ffebee',
        },
        warning: {
            main: '#ed6c02',
            light: '#ff9800',
        },
        info: {
            main: '#0288d1',
            light: '#03a9f4',
            lighter: '#e1f5fe',
        },
        grey: {
            50: '#fafafa',
            100: '#f5f5f5',
            200: '#eeeeee',
            300: '#e0e0e0',
            400: '#bdbdbd',
        },
    },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h4: {
            fontWeight: 700,
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
    },
    shape: {
        borderRadius: 8,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none',
                    borderRadius: 8,
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    borderRadius: 12,
                },
            },
        },
    },
});

/**
 * Main App Component
 * Sets up routing and theme
 */
function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        {/* Upload Page - Home */}
                        <Route index element={<UploadPage />} />

                        {/* Status Page - Shows processing progress */}
                        <Route path="status/:billId" element={<StatusPage />} />

                        {/* Bill Lookup Page - Search and view results */}
                        <Route path="lookup" element={<BillLookupPage />} />
                        <Route path="bill/:billId" element={<BillLookupPage />} />

                        {/* Catch-all redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;
