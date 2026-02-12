import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import StatusBadge from './StatusBadge';
import { STAGES } from '../constants/stages';
import { formatFileSize } from '../utils/helpers';

/**
 * Format timestamp to readable date
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date
 */
const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';

    try {
        const date = new Date(timestamp);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch (error) {
        return 'Invalid Date';
    }
};

/**
 * Truncate Bill ID for display
 * @param {string} billId - Full bill ID
 * @returns {string} Truncated ID
 */
const truncateBillId = (billId) => {
    if (!billId) return 'N/A';
    if (billId.length <= 10) return billId;
    return `${billId.substring(0, 7)}...`;
};

/**
 * Bills Table Component
 * Displays all uploaded bills in a table format
 * 
 * @param {Object} props
 * @param {Array} props.bills - Array of bill objects
 * @param {boolean} props.loading - Loading state
 */
const BillsTable = ({ bills, loading }) => {
    const navigate = useNavigate();

    const handleViewResult = (billId) => {
        navigate(`/bill/${billId}`);
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
                    No bills uploaded yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload your first medical bill to get started
                </Typography>
            </Paper>
        );
    }

    return (
        <TableContainer component={Paper} elevation={3}>
            <Table sx={{ minWidth: 650 }}>
                <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Bill ID
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            File Name
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Uploaded At
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            File Size
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Current Stage
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.875rem' }}>
                            Action
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bills.map((bill) => (
                        <TableRow
                            key={bill.billId}
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
                                    title={bill.billId}
                                >
                                    {truncateBillId(bill.billId)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {bill.fileName || 'Unknown'}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatDate(bill.uploadedAt)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {formatFileSize(bill.size)}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <StatusBadge stage={bill.stage} size="small" />
                            </TableCell>
                            <TableCell align="center">
                                {bill.stage === STAGES.COMPLETED ? (
                                    <Button
                                        variant="contained"
                                        size="small"
                                        startIcon={<Visibility />}
                                        onClick={() => handleViewResult(bill.billId)}
                                        sx={{
                                            textTransform: 'none',
                                            fontWeight: 600,
                                        }}
                                    >
                                        View Result
                                    </Button>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                                        —
                                    </Typography>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default BillsTable;
