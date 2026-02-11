import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Button,
    IconButton,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { CloudUpload, Search, LocalHospital } from '@mui/icons-material';

/**
 * Layout Component
 * Provides consistent layout with navigation across all pages
 */
const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Navigation handlers
    const handleNavigate = (path) => {
        navigate(path);
    };

    // Check if current path is active
    const isActive = (path) => {
        return location.pathname === path;
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* App Bar */}
            <AppBar position="static" elevation={2}>
                <Toolbar>
                    {/* Logo/Title */}
                    <IconButton
                        edge="start"
                        color="inherit"
                        onClick={() => handleNavigate('/')}
                        sx={{ mr: 2 }}
                    >
                        <LocalHospital sx={{ fontSize: 32 }} />
                    </IconButton>

                    <Typography
                        variant="h6"
                        component="div"
                        sx={{
                            flexGrow: 1,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontSize: isMobile ? '1rem' : '1.25rem',
                        }}
                        onClick={() => handleNavigate('/')}
                    >
                        Medical Bill Verification
                    </Typography>

                    {/* Navigation Buttons */}
                    {!isMobile && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                                color="inherit"
                                startIcon={<CloudUpload />}
                                onClick={() => handleNavigate('/')}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: isActive('/') ? 700 : 400,
                                    borderBottom: isActive('/') ? '2px solid white' : 'none',
                                    borderRadius: 0,
                                }}
                            >
                                Upload
                            </Button>
                            <Button
                                color="inherit"
                                startIcon={<Search />}
                                onClick={() => handleNavigate('/lookup')}
                                sx={{
                                    textTransform: 'none',
                                    fontWeight: isActive('/lookup') ? 700 : 400,
                                    borderBottom: isActive('/lookup') ? '2px solid white' : 'none',
                                    borderRadius: 0,
                                }}
                            >
                                Lookup
                            </Button>
                        </Box>
                    )}

                    {/* Mobile Navigation */}
                    {isMobile && (
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                                color="inherit"
                                onClick={() => handleNavigate('/')}
                                sx={{
                                    borderBottom: isActive('/') ? '2px solid white' : 'none',
                                    borderRadius: 0,
                                }}
                            >
                                <CloudUpload />
                            </IconButton>
                            <IconButton
                                color="inherit"
                                onClick={() => handleNavigate('/lookup')}
                                sx={{
                                    borderBottom: isActive('/lookup') ? '2px solid white' : 'none',
                                    borderRadius: 0,
                                }}
                            >
                                <Search />
                            </IconButton>
                        </Box>
                    )}
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    backgroundColor: 'grey.50',
                    minHeight: 'calc(100vh - 64px)',
                }}
            >
                <Outlet />
            </Box>

            {/* Footer */}
            <Box
                component="footer"
                sx={{
                    py: 3,
                    px: 2,
                    mt: 'auto',
                    backgroundColor: 'grey.200',
                    textAlign: 'center',
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    © {new Date().getFullYear()} Medical Bill Verification System. All rights reserved.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Powered by AI
                </Typography>
            </Box>
        </Box>
    );
};

export default Layout;
