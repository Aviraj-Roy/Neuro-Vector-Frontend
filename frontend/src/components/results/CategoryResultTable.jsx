import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { DECISIONS } from '../../utils/verificationResultParser';

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatSimilarity = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return `${(Number(value) * 100).toFixed(1)}%`;
};

const decisionChipProps = (decision) => {
    if (decision === DECISIONS.ALLOWED) return { color: 'success', label: 'ALLOWED' };
    if (decision === DECISIONS.OVERCHARGED) return { color: 'error', label: 'OVERCHARGED' };
    return { color: 'warning', label: 'NEEDS_REVIEW' };
};

const CategoryResultTable = ({ category }) => (
    <Accordion defaultExpanded disableGutters>
        <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {category.name}
                </Typography>
                <Chip size="small" label={`${category.items.length} items`} />
            </Box>
        </AccordionSummary>
        <AccordionDetails>
            <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 1280 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Bill Item</TableCell>
                            <TableCell>Best Match</TableCell>
                            <TableCell>Similarity</TableCell>
                            <TableCell>Allowed</TableCell>
                            <TableCell>Billed</TableCell>
                            <TableCell>Extra</TableCell>
                            <TableCell>Decision</TableCell>
                            <TableCell>Reason</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {category.items.map((item, index) => {
                            const chip = decisionChipProps(item.decision);
                            return (
                                <TableRow key={`${category.name}-${item.billItem}-${index}`} hover>
                                    <TableCell>{item.billItem || 'N/A'}</TableCell>
                                    <TableCell>{item.bestMatch || 'N/A'}</TableCell>
                                    <TableCell>{formatSimilarity(item.similarity)}</TableCell>
                                    <TableCell>{formatCurrency(item.allowedAmount)}</TableCell>
                                    <TableCell>{formatCurrency(item.billedAmount)}</TableCell>
                                    <TableCell>{formatCurrency(item.extraAmount)}</TableCell>
                                    <TableCell>
                                        <Chip size="small" color={chip.color} label={chip.label} />
                                    </TableCell>
                                    <TableCell sx={{ minWidth: 280 }}>{item.reason || '-'}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </AccordionDetails>
    </Accordion>
);

export default React.memo(CategoryResultTable);
