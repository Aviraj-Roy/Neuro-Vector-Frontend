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
    TextField,
    MenuItem,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import BillsTable from '../components/BillsTable';
import { useAllBillsPolling } from '../hooks/useAllBillsPolling';
import { deleteBill } from '../services/api';
import { STAGES } from '../constants/stages';
import {
    loadPendingUploads,
    pruneSyncedPendingUploads,
    subscribePendingUploads,
} from '../utils/pendingUploads';

const DELETED_BILLS_STORAGE_KEY = 'dashboard_deleted_bills';

const loadDeletedBills = () => {
    try {
        const raw = localStorage.getItem(DELETED_BILLS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to load deleted bills from storage:', error);
        return [];
    }
};

const saveDeletedBills = (items) => {
    try {
        localStorage.setItem(DELETED_BILLS_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
        console.error('Failed to save deleted bills to storage:', error);
    }
};

const getBillIdentifier = (bill) => bill?.bill_id || bill?.upload_id || bill?.temp_id || null;
const getBackendBillId = (bill) => bill?.upload_id || bill?.bill_id || null;

/**
 * Dashboard Page Component
 * Displays backend bill records from /bills
 * Polls /bills endpoint every 5 seconds
 */
const DashboardPage = () => {
    const navigate = useNavigate();
    const { bills, loading, error, refetch } = useAllBillsPolling();
    const [deleteError, setDeleteError] = React.useState(null);
    const [deletingUploadId, setDeletingUploadId] = React.useState(null);
    const [employeeIdSearch, setEmployeeIdSearch] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('ALL');
    const [hospitalFilter, setHospitalFilter] = React.useState('ALL');
    const [dateFilter, setDateFilter] = React.useState('ALL');
    const [billScope, setBillScope] = React.useState('ACTIVE');
    const [pendingUploads, setPendingUploads] = React.useState(() => loadPendingUploads());
    const [deletedBills, setDeletedBills] = React.useState(() => loadDeletedBills());
    const [restoringUploadId, setRestoringUploadId] = React.useState(null);
    const showDeleted = billScope === 'DELETED';

    const handleUploadNew = () => {
        navigate('/upload');
    };

    const handleDeleteBill = async (uploadId) => {
        if (!uploadId) return;

        const confirmed = showDeleted
            ? window.confirm(`Permanently delete bill ${uploadId}? This action cannot be undone.`)
            : window.confirm(`Temporarily delete bill ${uploadId}? You can find it in Deleted view.`);
        if (!confirmed) return;

        try {
            setDeleteError(null);
            setDeletingUploadId(uploadId);
            const currentBills = [...(pendingUploads || []), ...(bills || [])];
            const billToDelete = (showDeleted ? deletedBills : currentBills).find((bill) => {
                return getBillIdentifier(bill) === uploadId;
            });

            if (showDeleted) {
                // Permanent delete: call backend delete and remove from Deleted view
                const backendBillId = getBackendBillId(billToDelete);
                if (backendBillId) {
                    await deleteBill(backendBillId);
                }
                setDeletedBills((prev) => {
                    const next = prev.filter((item) => getBillIdentifier(item) !== uploadId);
                    saveDeletedBills(next);
                    return next;
                });
                await refetch();
            } else if (billToDelete) {
                // Temporary delete: hide from dashboard and move to Deleted view locally
                setDeletedBills((prev) => {
                    const next = [
                        { ...billToDelete, deleted_at: new Date().toISOString(), is_temporary_deleted: true },
                        ...prev.filter((item) => getBillIdentifier(item) !== uploadId),
                    ];
                    saveDeletedBills(next);
                    return next;
                });
            }
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

    const handleRestoreBill = (uploadId) => {
        if (!uploadId) return;
        setRestoringUploadId(uploadId);
        setDeletedBills((prev) => {
            const next = prev.filter((item) => getBillIdentifier(item) !== uploadId);
            saveDeletedBills(next);
            return next;
        });
        setRestoringUploadId(null);
    };

    React.useEffect(() => {
        const unsubscribe = subscribePendingUploads((uploads) => {
            setPendingUploads(uploads);
        });
        return unsubscribe;
    }, []);

    React.useEffect(() => {
        pruneSyncedPendingUploads(bills);
    }, [bills]);

    const mergedBills = React.useMemo(() => {
        const serverBills = bills || [];
        const existingServerIds = new Set(
            serverBills
                .map((row) => row?.bill_id || row?.upload_id)
                .filter(Boolean)
        );
        const pendingRows = (pendingUploads || []).filter((row) => {
            const rowId = row?.bill_id || row?.upload_id;
            return !(rowId && existingServerIds.has(rowId));
        });
        return [...pendingRows, ...serverBills];
    }, [bills, pendingUploads]);

    const sourceBills = showDeleted ? deletedBills : mergedBills;
    const deletedIds = React.useMemo(
        () => new Set(deletedBills.map((item) => getBillIdentifier(item)).filter(Boolean)),
        [deletedBills]
    );

    const hospitalOptions = React.useMemo(() => {
        return [...new Set(
            sourceBills
                .map((bill) => String(bill?.hospital_name || '').trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));
    }, [sourceBills]);

    const filteredBills = React.useMemo(() => {
        const query = employeeIdSearch.trim();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const matchedBills = sourceBills.filter((bill) => {
            const billId = getBillIdentifier(bill);
            if (!showDeleted && billId && deletedIds.has(billId)) return false;

            const matchesEmployeeId = !query || String(bill?.employee_id || '').includes(query);
            const normalizedStatus = String(bill?.status || '').toUpperCase();
            const matchesStatus = statusFilter === 'ALL' || normalizedStatus === statusFilter;
            const hospitalName = String(bill?.hospital_name || '').trim();
            const matchesHospital = hospitalFilter === 'ALL' || hospitalName === hospitalFilter;
            const billDateMs = new Date(bill?.upload_date || bill?.created_at || bill?.updated_at || 0).getTime();
            const hasValidDate = Number.isFinite(billDateMs) && billDateMs > 0;

            let matchesDate = true;
            if (dateFilter === 'TODAY') {
                matchesDate = hasValidDate
                    && billDateMs >= todayStart.getTime()
                    && billDateMs < tomorrowStart.getTime();
            } else if (dateFilter === 'YESTERDAY') {
                matchesDate = hasValidDate
                    && billDateMs >= yesterdayStart.getTime()
                    && billDateMs < todayStart.getTime();
            } else if (dateFilter === 'THIS_MONTH') {
                matchesDate = hasValidDate
                    && billDateMs >= currentMonthStart.getTime()
                    && billDateMs < nextMonthStart.getTime();
            } else if (dateFilter === 'LAST_MONTH') {
                matchesDate = hasValidDate
                    && billDateMs >= lastMonthStart.getTime()
                    && billDateMs < currentMonthStart.getTime();
            }

            return matchesEmployeeId && matchesStatus && matchesHospital && matchesDate;
        });

        return [...matchedBills].sort((a, b) => {
            const aTime = new Date(a?.upload_date || a?.created_at || a?.updated_at || 0).getTime();
            const bTime = new Date(b?.upload_date || b?.created_at || b?.updated_at || 0).getTime();
            return bTime - aTime;
        });
    }, [sourceBills, employeeIdSearch, statusFilter, hospitalFilter, dateFilter, showDeleted, deletedIds]);

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Bill Verification Dashboard
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Uploads with live processing status
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
                        variant={showDeleted ? 'contained' : 'outlined'}
                        onClick={() => setBillScope(showDeleted ? 'ACTIVE' : 'DELETED')}
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                        }}
                    >
                        {showDeleted ? 'Back to Dashboard' : `Deleted (${deletedBills.length})`}
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

            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                    label="Search by Employee ID"
                    placeholder="Enter Employee ID"
                    value={employeeIdSearch}
                    onChange={(event) => setEmployeeIdSearch(event.target.value)}
                    sx={{ flex: '1 1 320px' }}
                />
                <TextField
                    select
                    label="Filter by Bills"
                    value={billScope}
                    onChange={(event) => setBillScope(event.target.value)}
                    sx={{ minWidth: 220, flex: '0 0 220px' }}
                >
                    <MenuItem value="ACTIVE">Active Bills</MenuItem>
                    <MenuItem value="DELETED">Deleted Bills</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Filter by Status"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    sx={{ minWidth: 220, flex: '0 0 220px' }}
                >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value={STAGES.PENDING}>Pending</MenuItem>
                    <MenuItem value={STAGES.PROCESSING}>Processing</MenuItem>
                    <MenuItem value={STAGES.COMPLETED}>Completed</MenuItem>
                </TextField>
                <TextField
                    select
                    label="Filter by Hospital"
                    value={hospitalFilter}
                    onChange={(event) => setHospitalFilter(event.target.value)}
                    sx={{ minWidth: 260, flex: '0 0 260px' }}
                >
                    <MenuItem value="ALL">All Hospitals</MenuItem>
                    {hospitalOptions.map((hospitalName) => (
                        <MenuItem key={hospitalName} value={hospitalName}>
                            {hospitalName}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    select
                    label="Filter by Date"
                    value={dateFilter}
                    onChange={(event) => setDateFilter(event.target.value)}
                    sx={{ minWidth: 220, flex: '0 0 220px' }}
                >
                    <MenuItem value="ALL">All Dates</MenuItem>
                    <MenuItem value="TODAY">Today</MenuItem>
                    <MenuItem value="YESTERDAY">Yesterday</MenuItem>
                    <MenuItem value="THIS_MONTH">This Month</MenuItem>
                    <MenuItem value="LAST_MONTH">Last Month</MenuItem>
                </TextField>
            </Box>

            {/* Bills Table */}
            <BillsTable
                bills={filteredBills}
                loading={!showDeleted && loading}
                onDeleteBill={handleDeleteBill}
                deletingUploadId={deletingUploadId}
                deletedView={showDeleted}
                onRestoreBill={showDeleted ? handleRestoreBill : null}
                restoringUploadId={restoringUploadId}
            />

            {/* Polling Indicator */}
            {!showDeleted && filteredBills && filteredBills.length > 0 && (
                <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    {loading && <CircularProgress size={16} />}
                    <Typography variant="body2" color="text.secondary">
                        {loading ? 'Updating...' : 'Auto-refreshing every 5 seconds'}
                    </Typography>
                </Box>
            )}

            {/* Info Box */}
            <Paper elevation={1} sx={{ mt: 4, p: 3, backgroundColor: 'info.lighter' }}>
                <Typography variant="body2" color="text.secondary">
                    {showDeleted ? (
                        <>
                            <strong>Note:</strong> This view shows temporarily deleted items. Use
                            <strong> Undo</strong> to restore, or delete here to permanently remove.
                        </>
                    ) : (
                        <>
                            <strong>Note:</strong> Delete on dashboard is temporary and moves the bill to
                            <strong> Deleted</strong>. Dashboard reads from <strong>/bills</strong> and refreshes every
                            5 seconds.
                        </>
                    )}
                </Typography>
            </Paper>
        </Container>
    );
};

export default DashboardPage;
