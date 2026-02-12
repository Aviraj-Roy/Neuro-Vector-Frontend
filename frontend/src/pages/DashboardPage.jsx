import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    Alert,
    CircularProgress,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import BillsTable from '../components/BillsTable';
import { useAllBillsPolling } from '../hooks/useAllBillsPolling';
import { deleteBill } from '../services/api';

/**
 * Dashboard Page Component
 * Displays backend bill records from /bills
 * Polls /bills endpoint every 3 seconds
 */
const DashboardPage = () => {
    const navigate = useNavigate();
    const { bills, loading, error, refetch } = useAllBillsPolling();
    const [deleteError, setDeleteError] = React.useState(null);
    const [deletingUploadId, setDeletingUploadId] = React.useState(null);

    const handleUploadNew = () => {
        navigate('/upload');
    };

    const handleDeleteBill = async (uploadId) => {
        if (!uploadId) return;

        const confirmed = window.confirm(`Delete bill ${uploadId}? This action cannot be undone.`);
        if (!confirmed) return;

        try {
            setDeleteError(null);
            setDeletingUploadId(uploadId);
            await deleteBill(uploadId);
            await refetch();
        } catch (err) {
            setDeleteError(
                err.response?.data?.message
                || err.response?.data?.detail
                || err.message
                || 'Failed to delete bill.'
            );
        } finally {
            setDeletingUploadId(null);
        }
    };

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Bill Verification Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Completed bill records from backend
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={refetch}
                        disabled={loading}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleUploadNew}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                        }}
                    >
                        Upload New Bill
                    </Button>
                </Box>
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => window.location.reload()}>
                    {error}
                </Alert>
            )}
            {deleteError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setDeleteError(null)}>
                    {deleteError}
                </Alert>
            )}

            {/* Bills Table */}
            <BillsTable
                bills={bills}
                loading={loading}
                onDeleteBill={handleDeleteBill}
                deletingUploadId={deletingUploadId}
            />

            {/* Polling Indicator */}
            {bills && bills.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {loading && <CircularProgress size={16} />}
                    <Typography variant="body2" color="text.secondary">
                        {loading ? 'Updating...' : 'Auto-refreshing every 3 seconds'}
                    </Typography>
                </Box>
            )}

            {/* Info Box */}
            <Paper elevation={1} sx={{ mt: 4, p: 3, backgroundColor: 'info.lighter' }}>
                <Typography variant="body2" color="text.secondary">
                    <strong>Note:</strong> The dashboard reads directly from <strong>/bills</strong> and refreshes every
                    3 seconds.
                </Typography>
            </Paper>
        </Container>
    );
};

export default DashboardPage;
