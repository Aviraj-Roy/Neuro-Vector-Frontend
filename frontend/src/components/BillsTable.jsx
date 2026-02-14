import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    CircularProgress,
    IconButton,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { DeleteOutline, RestoreFromTrash, Visibility } from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import { STAGES } from '../constants/stages';
import { formatInvoiceDate, formatUploadDateTime } from '../utils/billDateDisplay';

const formatDuration = (seconds) => {
    const totalSeconds = Number(seconds);
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-';

    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
};

const getProcessingTimeText = (bill) => {
    if (!bill || typeof bill !== 'object') return '-';

    const directValue = bill.processing_time ?? bill.processing_time_seconds ?? bill.processing_duration_seconds;
    if (typeof directValue === 'number') {
        return formatDuration(directValue);
    }
    if (typeof directValue === 'string' && directValue.trim()) {
        return directValue.trim();
    }

    const startMs = new Date(bill.upload_date || bill.created_at || 0).getTime();
    const endMs = new Date(bill.completed_at || bill.updated_at || 0).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || startMs <= 0 || endMs <= 0 || endMs < startMs) {
        return '-';
    }
    return formatDuration((endMs - startMs) / 1000);
};

const getBillIdentifier = (bill) => bill?.bill_id || bill?.upload_id || bill?.temp_id || null;
const getViewIdentifier = (bill) => bill?.bill_id || bill?.upload_id || null;

const BillsTable = ({
    bills,
    loading,
    onDeleteBill,
    deletingUploadId = null,
    deletedView = false,
    onRestoreBill = null,
    restoringUploadId = null,
}) => {
    const navigate = useNavigate();

    const handleViewResult = (uploadId) => {
        navigate(`/bill/${uploadId}`);
    };

    if (loading && (!bills || bills.length === 0)) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!bills || bills.length === 0) {
        return (
            <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                    No completed bills available
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload a medical bill to start verification.
                </Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 1050 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Employee ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Hospital Name</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Invoice Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Upload Date</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Processing Time</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bills.map((bill) => {
                        const billId = getBillIdentifier(bill);
                        const viewId = getViewIdentifier(bill);
                        const rowKey = billId || `${bill.employee_id}-${bill.original_filename}-${bill.upload_date || ''}`;
                        return (
                        <TableRow
                            key={rowKey}
                            sx={{
                                '&:hover': {
                                    backgroundColor: 'grey.50',
                                },
                                transition: 'background-color 0.2s',
                            }}
                        >
                            <TableCell>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        color: 'primary.main',
                                        fontWeight: 600,
                                    }}
                                    title={bill.employee_id}
                                >
                                    {bill.employee_id || 'N/A'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography
                                    variant="body2"
                                    sx={{ fontSize: '0.875rem' }}
                                    title={bill.hospital_name || 'N/A'}
                                >
                                    {bill.hospital_name || 'N/A'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatInvoiceDate(bill.invoice_date)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatUploadDateTime(bill.upload_date)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {getProcessingTimeText(bill)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <StatusBadge stage={bill.status} size="small" />
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                    {bill.status === STAGES.COMPLETED ? (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => handleViewResult(viewId)}
                                            disabled={!viewId}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            View Details
                                        </Button>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                            -
                                        </Typography>
                                    )}
                                    {deletedView && (
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<RestoreFromTrash />}
                                            onClick={() => onRestoreBill?.(billId)}
                                            disabled={!onRestoreBill || !billId || restoringUploadId === billId}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            {restoringUploadId === billId ? 'Undoing...' : 'Undo'}
                                        </Button>
                                    )}
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => onDeleteBill?.(billId)}
                                        disabled={!onDeleteBill || !billId || deletingUploadId === billId}
                                        title="Delete Bill"
                                    >
                                        {deletingUploadId === billId ? (
                                            <CircularProgress size={18} color="error" />
                                        ) : (
                                            <DeleteOutline fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BillsTable;
