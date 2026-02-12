import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    TextField,
    Button,
    Box,
    Alert,
    CircularProgress,
    Chip,
    Divider,
    Card,
    CardContent,
    Grid,
} from '@mui/material';
import { Search, ArrowBack, CheckCircle, Error, Info } from '@mui/icons-material';
import { getBillData } from '../services/api';
import { STAGES } from '../constants/stages';
import { formatTimestamp } from '../utils/helpers';

/**
 * Bill Lookup Page Component
 * Allows users to search for and view bill verification results
 */
const BillLookupPage = () => {
    const { billId: urlBillId } = useParams();
    const navigate = useNavigate();

    // State management
    const [billId, setBillId] = useState(urlBillId || '');
    const [billData, setBillData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch bill data on component mount if billId in URL
    React.useEffect(() => {
        if (urlBillId) {
            handleSearch(urlBillId);
        }
    }, [urlBillId]);

    // Handle search
    const handleSearch = async (searchBillId = billId) => {
        if (!searchBillId.trim()) {
            setError('Please enter a Bill ID');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setBillData(null);

            const data = await getBillData(searchBillId);
            setBillData(data);
        } catch (err) {
            console.error('Error fetching bill data:', err);
            setError(
                err.response?.data?.message
                || err.response?.data?.detail
                || err.message
                || 'Bill not found. Please check the Bill ID.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = (event) => {
        event.preventDefault();
        handleSearch();
    };

    // Render verification results
    const renderVerificationResults = () => {
        if (!billData) return null;

        const { status, verification_result, created_at, updated_at } = billData;

        return (
            <Box sx={{ mt: 3 }}>
                {/* Status Card */}
                <Card elevation={2} sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                            Bill Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Bill ID
                                </Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                    {billData.billId || billId}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                <Typography variant="body2" color="text.secondary">
                                    Status
                                </Typography>
                                <Chip
                                    label={status || 'UNKNOWN'}
                                    color={
                                        status === STAGES.COMPLETED
                                            ? 'success'
                                            : status === STAGES.FAILED
                                                ? 'error'
                                                : 'warning'
                                    }
                                    icon={
                                        status === STAGES.COMPLETED ? (
                                            <CheckCircle />
                                        ) : status === STAGES.FAILED ? (
                                            <Error />
                                        ) : (
                                            <Info />
                                        )
                                    }
                                    sx={{ mt: 0.5 }}
                                />
                            </Grid>

                            {created_at && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Created At
                                    </Typography>
                                    <Typography variant="body1">{formatTimestamp(created_at)}</Typography>
                                </Grid>
                            )}

                            {updated_at && (
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="body2" color="text.secondary">
                                        Last Updated
                                    </Typography>
                                    <Typography variant="body1">{formatTimestamp(updated_at)}</Typography>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>

                {/* Verification Results */}
                {verification_result && (
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Verification Results
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            {/* Display verification result as formatted JSON */}
                            <Box
                                sx={{
                                    backgroundColor: 'grey.100',
                                    borderRadius: 1,
                                    p: 2,
                                    maxHeight: 600,
                                    overflow: 'auto',
                                    fontFamily: 'monospace',
                                    fontSize: '0.875rem',
                                }}
                            >
                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>
                                    {JSON.stringify(verification_result, null, 2)}
                                </pre>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* No Results Message */}
                {status === STAGES.COMPLETED && !verification_result && (
                    <Alert severity="warning">
                        Verification completed but no results are available.
                    </Alert>
                )}

                {/* Processing Message */}
                {status !== STAGES.COMPLETED && status !== STAGES.FAILED && (
                    <Alert severity="info">
                        This bill is still being processed. Current status: <strong>{status}</strong>
                    </Alert>
                )}

                {/* Failed Message */}
                {status === STAGES.FAILED && (
                    <Alert severity="error">
                        Verification failed. {billData.message || 'Please try uploading the bill again.'}
                    </Alert>
                )}
            </Box>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Bill Lookup
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => navigate('/')}
                        sx={{ textTransform: 'none' }}
                    >
                        Back to Upload
                    </Button>
                </Box>

                <Typography variant="body1" color="text.secondary">
                    Enter a Bill ID to view verification status and results
                </Typography>
            </Paper>

            {/* Search Form */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <form onSubmit={handleSubmit}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            label="Bill ID"
                            placeholder="Enter Bill ID"
                            value={billId}
                            onChange={(e) => setBillId(e.target.value)}
                            disabled={loading}
                            variant="outlined"
                            sx={{ fontFamily: 'monospace' }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            size="large"
                            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
                            disabled={loading || !billId.trim()}
                            sx={{
                                px: 4,
                                textTransform: 'none',
                                fontWeight: 600,
                                minWidth: 150,
                            }}
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </Button>
                    </Box>
                </form>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Results */}
                {renderVerificationResults()}
            </Paper>

            {/* Info Box */}
            <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Tip:</strong> You can bookmark the URL with a Bill ID to quickly access verification results
                    later.
                </Typography>
            </Box>
        </Container>
    );
};

export default BillLookupPage;
