import React, { useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Paper,
    Typography,
} from '@mui/material';
import { ArrowBack, Visibility } from '@mui/icons-material';
import ProgressTracker from '../components/ProgressTracker';
import { useBillPolling } from '../hooks/useBillPolling';
import { STAGES } from '../constants/stages';
import { formatFileSize } from '../utils/helpers';

const StatusPage = () => {
    const { uploadId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const initialUploadStatus = location.state?.initialUploadStatus || null;
    const { status, loading, error, attempts } = useBillPolling(uploadId, true, initialUploadStatus);

    useEffect(() => {
        if (!uploadId) {
            navigate('/upload');
        }
    }, [uploadId, navigate]);

    const handleViewResults = () => {
        navigate(`/bill/${uploadId}`);
    };

    const handleBackToUpload = () => {
        navigate('/upload');
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Upload Status
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="body1" color="text.secondary">
                        Upload ID:
                    </Typography>
                    <Chip
                        label={uploadId}
                        color="primary"
                        variant="outlined"
                        sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
                    />
                </Box>

                {status && (
                    <>
                        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                                Status:
                            </Typography>
                            <Chip
                                label={status.status}
                                color={
                                    status.status === STAGES.COMPLETED
                                        ? 'success'
                                        : status.status === STAGES.FAILED
                                            ? 'error'
                                            : 'primary'
                                }
                                size="small"
                            />
                            {status.status !== STAGES.COMPLETED && status.status !== STAGES.FAILED && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <CircularProgress size={16} />
                                    <Typography variant="body2" color="text.secondary">
                                        Polling... (attempt {attempts})
                                    </Typography>
                                </Box>
                            )}
                        </Box>

                        <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr', gap: 0.75 }}>
                            <Typography variant="body2" color="text.secondary">
                                File: <strong>{status.original_filename || 'Unknown'}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Size: <strong>{formatFileSize(Number(status.file_size_bytes || 0))}</strong>
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Pages: <strong>{status.page_count ?? 0}</strong>
                            </Typography>
                        </Box>
                    </>
                )}
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {!status && loading && (
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6">Loading upload status...</Typography>
                </Paper>
            )}

            {status && (
                <>
                    <ProgressTracker
                        currentStage={status.status}
                        statusData={{ message: status.message }}
                        error={status.status === STAGES.FAILED ? status.message : null}
                    />

                    {status.status === STAGES.COMPLETED && (
                        <Paper elevation={3} sx={{ p: 3, mt: 3, textAlign: 'center' }}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Verification Complete
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

                    {status.status === STAGES.FAILED && (
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
        </Container>
    );
};

export default StatusPage;
