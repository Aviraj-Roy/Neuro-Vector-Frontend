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
import { DeleteOutline, Visibility } from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import { STAGES } from '../constants/stages';
import { formatFileSize } from '../utils/helpers';

const truncateUploadId = (uploadId) => {
    if (!uploadId) return 'N/A';
    if (uploadId.length <= 12) return uploadId;
    return `${uploadId.substring(0, 8)}...`;
};

const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return String(value);
    return `Rs. ${numeric.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const BillsTable = ({ bills, loading, onDeleteBill, deletingUploadId = null }) => {
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
            <Table sx={{ minWidth: 900 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Upload ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Filename</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Size</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Pages</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Grand Total</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>Action</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bills.map((bill) => (
                        <TableRow
                            key={bill.upload_id}
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
                                    title={bill.upload_id}
                                >
                                    {truncateUploadId(bill.upload_id)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {bill.original_filename || 'Unknown'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatFileSize(Number(bill.file_size_bytes || 0))}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {bill.page_count ?? 0}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <StatusBadge stage={bill.status} size="small" />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatCurrency(bill.grand_total)}
                                </Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                                    {bill.status === STAGES.COMPLETED ? (
                                        <Button
                                            variant="contained"
                                            size="small"
                                            startIcon={<Visibility />}
                                            onClick={() => handleViewResult(bill.upload_id)}
                                            sx={{ textTransform: 'none', fontWeight: 600 }}
                                        >
                                            View Result
                                        </Button>
                                    ) : (
                                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                            -
                                        </Typography>
                                    )}
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => onDeleteBill?.(bill.upload_id)}
                                        disabled={!onDeleteBill || deletingUploadId === bill.upload_id}
                                        title="Delete Bill"
                                    >
                                        {deletingUploadId === bill.upload_id ? (
                                            <CircularProgress size={18} color="error" />
                                        ) : (
                                            <DeleteOutline fontSize="small" />
                                        )}
                                    </IconButton>
                                </Box>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BillsTable;
