import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import { ArrowBack, Visibility } from '@mui/icons-material';
import ProgressTracker from '../components/ProgressTracker';
import { useBillPolling } from '../hooks/useBillPolling';
import { STAGES } from '../constants/stages';

/**
 * Status Page Component
 * Displays real-time bill processing status with polling
 */
const StatusPage = () => {
    const { billId } = useParams();
    const navigate = useNavigate();

    // Use custom polling hook
    const { status, loading, error, attempts } = useBillPolling(billId, true);

    // Redirect validation
    useEffect(() => {
        if (!billId) {
            navigate('/');
        }
    }, [billId, navigate]);

    // Handle view results
    const handleViewResults = () => {
        navigate(`/bill/${billId}`);
    };

    // Handle back to upload
    const handleBackToUpload = () => {
        navigate('/');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Bill Status
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={handleBackToUpload}
                        sx={{ textTransform: 'none' }}
                    >
                        Back to Upload
                    </Button>
                </Box>

                {/* Bill ID Display */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body1" color="text.secondary">
                        Bill ID:
                    </Typography>
                    <Chip
                        label={billId}
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                </Box>

                {/* Polling Info */}
                {status && (
                    <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Status:
                        </Typography>
                        <Chip
                            label={status.stage}
                            color={
                                status.stage === STAGES.COMPLETED
                                    ? 'success'
                                    : status.stage === STAGES.FAILED
                                        ? 'error'
                                        : 'primary'
                            }
                            size="small"
                        />
                        {status.stage !== STAGES.COMPLETED && status.stage !== STAGES.FAILED && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" color="text.secondary">
                                    Polling... (attempt {attempts})
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Paper>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Loading State */}
            {!status && loading && (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6">Loading bill status...</Typography>
                </Paper>
            )}

            {/* Progress Tracker */}
            {status && (
                <>
                    <ProgressTracker
                        currentStage={status.stage}
                        statusData={status}
                        error={status.stage === STAGES.FAILED ? status.message : null}
                    />

                    {/* Action Buttons */}
                    {status.stage === STAGES.COMPLETED && (
                        <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Verification Complete!
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                Your medical bill has been successfully verified. View the detailed results below.
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<Visibility />}
                                onClick={handleViewResults}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                }}
                            >
                                View Verification Results
                            </Button>
                        </Paper>
                    )}

                    {status.stage === STAGES.FAILED && (
                        <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'error.main' }}>
                                Processing Failed
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                                {status.message || 'An error occurred during processing. Please try uploading again.'}
                            </Typography>
                            <Button
                                variant="contained"
                                size="large"
                                onClick={handleBackToUpload}
                                sx={{
                                    px: 4,
                                    py: 1.5,
                                    fontSize: '1.1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                }}
                            >
                                Upload New Bill
                            </Button>
                        </Paper>
                    )}
                </>
            )}

            {/* Info Box */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> This page automatically updates every 3 seconds. The verification process
                    typically takes 30-60 seconds depending on the bill complexity.
                </Typography>
            </Box>
        </Container>
    );
};

export default StatusPage;
