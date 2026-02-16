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
    TextField,
    Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { DECISIONS } from '../../utils/verificationResultParser';

const WRAP_CELL_SX = {
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: 1.3,
};

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatCurrencyOrNA = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return formatCurrency(value);
};

const formatQuantity = (value) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
    return Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getTieupRateValue = (item) => {
    const tieup = toFiniteNumber(item?.tieupRate);
    if (tieup !== null) return tieup;
    return toFiniteNumber(item?.allowedAmount);
};

const getCalculatedBilledAmount = (item, isEditMode) => {
    const qty = toFiniteNumber(item?.qty);
    const rate = toFiniteNumber(item?.rate);
    if (isEditMode && qty !== null && rate !== null) {
        return qty * rate;
    }
    return toFiniteNumber(item?.billedAmount);
};

const getCalculatedAmountToBePaid = (item, isEditMode) => {
    const qty = toFiniteNumber(item?.qty);
    const tieupRate = getTieupRateValue(item);
    if (isEditMode && qty !== null && tieupRate !== null) {
        return qty * tieupRate;
    }
    if (item?.amountToBePaid !== null && item?.amountToBePaid !== undefined) return item.amountToBePaid;
    if (item?.allowedAmount !== null && item?.allowedAmount !== undefined) return item.allowedAmount;
    return null;
};

const toNullableNumber = (value) => {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
};

const decisionChipProps = (decision) => {
    if (decision === DECISIONS.ALLOWED) return { color: 'success', label: 'ALLOWED' };
    if (decision === DECISIONS.OVERCHARGED) return { color: 'error', label: 'OVERCHARGED' };
    return { color: 'warning', label: 'NEEDS_REVIEW' };
};

const CategoryResultTable = ({ category, onUpdateItem, isEditMode = false }) => {
    const handleFieldChange = (itemIndex, field) => (event) => {
        if (!onUpdateItem) return;
        onUpdateItem(category.name, itemIndex, {
            [field]: toNullableNumber(event.target.value),
        });
    };
    const totals = (category.items || []).reduce((acc, item) => {
        const billed = getCalculatedBilledAmount(item, isEditMode);
        const payable = getCalculatedAmountToBePaid(item, isEditMode);
        return {
            billedAmount: acc.billedAmount + (toFiniteNumber(billed) ?? 0),
            amountToBePaid: acc.amountToBePaid + (toFiniteNumber(payable) ?? 0),
        };
    }, { billedAmount: 0, amountToBePaid: 0 });

    return (
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
                <TableContainer component={Paper} variant="outlined" sx={{ width: '100%', overflowX: 'hidden' }}>
                    <Table
                        size="small"
                        stickyHeader
                        sx={{ width: '100%', tableLayout: 'fixed', '& th, & td': { px: 1, py: 0.75 } }}
                    >
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: '21%' }}>Item Name</TableCell>
                                <TableCell sx={{ width: '21%' }}>Best Match</TableCell>
                                <TableCell sx={{ width: '8%' }}>Tieup Rate</TableCell>
                                <TableCell sx={{ width: '5%' }}>Qty</TableCell>
                                <TableCell sx={{ width: '8%' }}>Rate</TableCell>
                                <TableCell sx={{ width: '10%' }}>Billed Amount</TableCell>
                                <TableCell sx={{ width: '11%' }}>Amount to be Paid</TableCell>
                                <TableCell sx={{ width: '7%' }}>Extra</TableCell>
                                <TableCell sx={{ width: '9%' }}>Decision</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {category.items.map((item, index) => {
                                const chip = decisionChipProps(item.decision);
                                return (
                                    <TableRow key={`${category.name}-${item.billItem}-${index}`} hover>
                                        <TableCell sx={WRAP_CELL_SX}>{item.billItem || 'N/A'}</TableCell>
                                        <TableCell sx={WRAP_CELL_SX}>{item.bestMatch || 'N/A'}</TableCell>
                                        <TableCell>
                                            {formatCurrency(item.tieupRate ?? item.allowedAmount)}
                                        </TableCell>
                                        <TableCell>
                                            {isEditMode ? (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={item.qty ?? ''}
                                                    onChange={handleFieldChange(index, 'qty')}
                                                />
                                            ) : (
                                                formatQuantity(item.qty)
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {isEditMode ? (
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    fullWidth
                                                    value={item.rate ?? ''}
                                                    onChange={handleFieldChange(index, 'rate')}
                                                />
                                            ) : (
                                                formatCurrencyOrNA(item.rate)
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrencyOrNA(getCalculatedBilledAmount(item, isEditMode))}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrencyOrNA(getCalculatedAmountToBePaid(item, isEditMode))}
                                        </TableCell>
                                        <TableCell>{formatCurrency(item.extraAmount)}</TableCell>
                                        <TableCell>
                                            <Chip size="small" color={chip.color} label={chip.label} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                                <TableCell colSpan={5} sx={{ fontWeight: 700 }}>
                                    Category Total
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {formatCurrency(totals.billedAmount)}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700 }}>
                                    {formatCurrency(totals.amountToBePaid)}
                                </TableCell>
                                <TableCell />
                                <TableCell />
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </AccordionDetails>
        </Accordion>
    );
};

export default React.memo(CategoryResultTable);
