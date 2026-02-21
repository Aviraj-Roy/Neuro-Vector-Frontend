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

const SHOW_DECISION_COLUMN = false;
const SHOW_EXTRA_COLUMN = false;

const WRAP_CELL_SX = {
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    lineHeight: 1.3,
};
const EDIT_SECTION_DIVIDER_SX = {
    borderLeft: '2px solid',
    borderLeftColor: 'divider',
    pl: 2,
};
const PRE_EDIT_GAP_SX = {
    pr: 2,
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

const getCalculatedBilledAmount = (item) => {
    return toFiniteNumber(item?.originalBilledAmount ?? item?.billedAmount);
};

const getCalculatedAmountToBePaid = (item) => {
    const qty = toFiniteNumber(item?.qty);
    const tieupRate = getTieupRateValue(item);
    if (qty !== null && tieupRate !== null) {
        return qty * tieupRate;
    }
    if (item?.amountToBePaid !== null && item?.amountToBePaid !== undefined) return item.amountToBePaid;
    if (item?.allowedAmount !== null && item?.allowedAmount !== undefined) return item.allowedAmount;
    return null;
};
const formatDiscrepancyFlag = (value) => {
    if (value === true) return 'True';
    if (value === false) return 'False';
    return 'N/A';
};
const getDiscrepancyTextColor = (value) => {
    if (value === true) return 'error.main';
    if (value === false) return 'success.main';
    return 'text.secondary';
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

const CategoryResultTable = ({ category, onUpdateItem }) => {
    const viewRowRefs = React.useRef([]);
    const editRowRefs = React.useRef([]);
    const viewTotalRowRef = React.useRef(null);
    const editTotalRowRef = React.useRef(null);

    const syncRowHeights = React.useCallback(() => {
        const rowCount = Math.max(viewRowRefs.current.length, editRowRefs.current.length);
        for (let i = 0; i < rowCount; i += 1) {
            const viewRow = viewRowRefs.current[i];
            const editRow = editRowRefs.current[i];
            if (!viewRow || !editRow) continue;

            viewRow.style.height = 'auto';
            editRow.style.height = 'auto';
            const targetHeight = Math.max(viewRow.offsetHeight, editRow.offsetHeight);
            viewRow.style.height = `${targetHeight}px`;
            editRow.style.height = `${targetHeight}px`;
        }

        if (viewTotalRowRef.current && editTotalRowRef.current) {
            viewTotalRowRef.current.style.height = 'auto';
            editTotalRowRef.current.style.height = 'auto';
            const totalHeight = Math.max(viewTotalRowRef.current.offsetHeight, editTotalRowRef.current.offsetHeight);
            viewTotalRowRef.current.style.height = `${totalHeight}px`;
            editTotalRowRef.current.style.height = `${totalHeight}px`;
        }
    }, []);

    const handleFieldChange = (itemIndex, field) => (event) => {
        if (!onUpdateItem) return;
        onUpdateItem(category.name, itemIndex, {
            [field]: toNullableNumber(event.target.value),
        });
    };
    const totals = (category.items || []).reduce((acc, item) => {
        const billed = getCalculatedBilledAmount(item);
        const payable = getCalculatedAmountToBePaid(item);
        return {
            billedAmount: acc.billedAmount + (toFiniteNumber(billed) ?? 0),
            amountToBePaid: acc.amountToBePaid + (toFiniteNumber(payable) ?? 0),
        };
    }, { billedAmount: 0, amountToBePaid: 0 });

    React.useLayoutEffect(() => {
        const rafId = window.requestAnimationFrame(syncRowHeights);
        const handleResize = () => syncRowHeights();
        window.addEventListener('resize', handleResize);
        return () => {
            window.cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handleResize);
        };
    }, [syncRowHeights, category.items]);

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
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: { xs: 'wrap', xl: 'nowrap' } }}>
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ flex: '1 1 72%', minWidth: 760, overflowX: 'hidden' }}
                    >
                        <Table
                            size="small"
                            stickyHeader
                            sx={{ width: '100%', tableLayout: 'fixed', '& th, & td': { px: 1, py: 0.75 } }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '26%' }}>Item Name</TableCell>
                                    <TableCell sx={{ width: '26%' }}>Best Match</TableCell>
                                    <TableCell sx={{ width: '10%' }}>Tieup Rate</TableCell>
                                    <TableCell sx={{ width: '12%' }}>Billed Amount</TableCell>
                                    <TableCell sx={{ width: '8%' }}>Qty</TableCell>
                                    <TableCell sx={{ width: '9%', ...PRE_EDIT_GAP_SX }}>Rate</TableCell>
                                    <TableCell sx={{ width: '9%' }}>Discrepancy</TableCell>
                                    {SHOW_EXTRA_COLUMN && <TableCell sx={{ width: '8%' }}>Extra</TableCell>}
                                    {SHOW_DECISION_COLUMN && <TableCell sx={{ width: '10%' }}>Decision</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {category.items.map((item, index) => {
                                    const chip = decisionChipProps(item.decision);
                                    return (
                                        <TableRow
                                            key={`view-${category.name}-${item.billItem}-${index}`}
                                            hover
                                            ref={(el) => {
                                                viewRowRefs.current[index] = el;
                                            }}
                                        >
                                            <TableCell sx={WRAP_CELL_SX}>{item.billItem || 'N/A'}</TableCell>
                                            <TableCell sx={WRAP_CELL_SX}>{item.bestMatch || 'N/A'}</TableCell>
                                            <TableCell>{formatCurrency(item.tieupRate ?? item.allowedAmount)}</TableCell>
                                            <TableCell>{formatCurrencyOrNA(getCalculatedBilledAmount(item))}</TableCell>
                                            <TableCell>{formatQuantity(item.originalQty ?? item.qty)}</TableCell>
                                            <TableCell sx={PRE_EDIT_GAP_SX}>{formatCurrencyOrNA(item.originalRate ?? item.rate)}</TableCell>
                                            <TableCell>
                                                <Typography
                                                    variant="body2"
                                                    sx={{ color: getDiscrepancyTextColor(item.discrepancy), fontWeight: 600 }}
                                                >
                                                    {formatDiscrepancyFlag(item.discrepancy)}
                                                </Typography>
                                            </TableCell>
                                            {SHOW_EXTRA_COLUMN && <TableCell>{formatCurrency(item.extraAmount)}</TableCell>}
                                            {SHOW_DECISION_COLUMN && (
                                                <TableCell>
                                                    <Chip size="small" color={chip.color} label={chip.label} />
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })}
                                <TableRow
                                    sx={{ backgroundColor: 'grey.100' }}
                                    ref={viewTotalRowRef}
                                >
                                    <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                                        Category Total
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700 }}>{formatCurrency(totals.billedAmount)}</TableCell>
                                    <TableCell />
                                    <TableCell sx={PRE_EDIT_GAP_SX} />
                                    <TableCell />
                                    {SHOW_EXTRA_COLUMN && <TableCell />}
                                    {SHOW_DECISION_COLUMN && <TableCell />}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <TableContainer
                        component={Paper}
                        variant="outlined"
                        sx={{ flex: '1 1 28%', minWidth: 360, overflowX: 'hidden' }}
                    >
                        <Table
                            size="small"
                            stickyHeader
                            sx={{ width: '100%', tableLayout: 'fixed', '& th, & td': { px: 1, py: 0.75 } }}
                        >
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ width: '30%', ...EDIT_SECTION_DIVIDER_SX }}>Edit Qty</TableCell>
                                    <TableCell sx={{ width: '33%' }}>Edit Tieup Rate</TableCell>
                                    <TableCell sx={{ width: '37%' }}>Amount to be Paid</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {category.items.map((item, index) => (
                                    <TableRow
                                        key={`edit-${category.name}-${item.billItem}-${index}`}
                                        hover
                                        ref={(el) => {
                                            editRowRefs.current[index] = el;
                                        }}
                                    >
                                        <TableCell sx={EDIT_SECTION_DIVIDER_SX}>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={item.qty ?? ''}
                                                onChange={handleFieldChange(index, 'qty')}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField
                                                size="small"
                                                type="number"
                                                fullWidth
                                                value={item.tieupRate ?? ''}
                                                onChange={handleFieldChange(index, 'tieupRate')}
                                            />
                                        </TableCell>
                                        <TableCell>{formatCurrencyOrNA(getCalculatedAmountToBePaid(item))}</TableCell>
                                    </TableRow>
                                ))}
                                <TableRow
                                    sx={{ backgroundColor: 'grey.100' }}
                                    ref={editTotalRowRef}
                                >
                                    <TableCell sx={EDIT_SECTION_DIVIDER_SX} />
                                    <TableCell />
                                    <TableCell sx={{ fontWeight: 700 }}>
                                        {formatCurrency(totals.amountToBePaid)}
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            </AccordionDetails>
        </Accordion>
    );
};

export default React.memo(CategoryResultTable);
