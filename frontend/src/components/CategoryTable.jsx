import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Box,
    Tooltip,
} from '@mui/material';
import { formatCurrency, getDecisionColor, getDecisionText } from '../utils/verificationParser';

/**
 * Category Table Component
 * Displays items in a scrollable table for a specific category
 */
const CategoryTable = ({ category, filters }) => {
    // Apply filters
    const filteredItems = category.items.filter(item => {
        // Filter by decision
        if (filters.decisions.length > 0) {
            const itemDecision = (item.decision || '').toUpperCase();
            const matchesDecision = filters.decisions.some(d => {
                if (d === 'ALLOWED') return itemDecision.includes('ALLOWED');
                if (d === 'OVERCHARGED') return itemDecision.includes('OVERCHARGED');
                if (d === 'NEEDS_REVIEW') return itemDecision.includes('REVIEW');
                return false;
            });
            if (!matchesDecision) return false;
        }

        // Filter by search term
        if (filters.searchTerm.trim() !== '') {
            const searchLower = filters.searchTerm.toLowerCase();
            const billItemMatch = (item.billItem || '').toLowerCase().includes(searchLower);
            const bestMatchMatch = (item.bestMatch || '').toLowerCase().includes(searchLower);
            if (!billItemMatch && !bestMatchMatch) return false;
        }

        return true;
    });

    // Don't render if no items after filtering
    if (filteredItems.length === 0) {
        return null;
    }

    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {category.name}
                    </Typography>
                    <Chip
                        label={`${filteredItems.length} item${filteredItems.length !== 1 ? 's' : ''}`}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>

                <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{
                        maxHeight: 600,
                        overflow: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                            height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'grey.100',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'grey.400',
                            borderRadius: '4px',
                            '&:hover': {
                                backgroundColor: 'grey.500',
                            },
                        },
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Bill Item</TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 150 }}>Best Match</TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 100 }} align="right">
                                    Similarity
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 120 }} align="right">
                                    Allowed
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 120 }} align="right">
                                    Billed
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 120 }} align="right">
                                    Extra
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 140 }} align="center">
                                    Decision
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Reason</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredItems.map((item, index) => (
                                <TableRow
                                    key={index}
                                    sx={{
                                        '&:hover': {
                                            backgroundColor: 'action.hover',
                                        },
                                    }}
                                >
                                    <TableCell>
                                        <Tooltip title={item.billItem} arrow>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {item.billItem || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={item.bestMatch} arrow>
                                            <Typography
                                                variant="body2"
                                                sx={{
                                                    maxWidth: 200,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {item.bestMatch || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                            {item.similarity ? `${item.similarity.toFixed(2)}%` : '-'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            sx={{ fontFamily: 'monospace', fontWeight: 600, color: 'success.main' }}
                                        >
                                            {formatCurrency(item.allowedAmount)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                            {formatCurrency(item.billedAmount)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            sx={{
                                                fontFamily: 'monospace',
                                                fontWeight: 600,
                                                color: item.extraAmount > 0 ? 'error.main' : 'text.secondary',
                                            }}
                                        >
                                            {formatCurrency(item.extraAmount)}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={getDecisionText(item.decision)}
                                            color={getDecisionColor(item.decision)}
                                            size="small"
                                            sx={{ fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={item.reason} arrow>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                    maxWidth: 250,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {item.reason || '-'}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </CardContent>
        </Card>
    );
};

export default CategoryTable;
