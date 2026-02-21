import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Container,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { getBillData, patchBillLineItems } from '../services/api';
import { STAGES } from '../constants/stages';
import { DECISIONS, parseVerificationResult } from '../utils/verificationResultParser';
import { applyBillEdits, saveBillEdits } from '../utils/billEditsStorage';
import VerificationSummaryCard from '../components/results/VerificationSummaryCard';
import FinancialSummaryCard from '../components/results/FinancialSummaryCard';
import ResultFilters from '../components/results/ResultFilters';
import CategoryResultTable from '../components/results/CategoryResultTable';

const normalizeText = (value) => String(value || '').toLowerCase();
const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const toBooleanOrNull = (value) => {
    if (typeof value === 'boolean') return value;
    if (value === 1 || value === '1') return true;
    if (value === 0 || value === '0') return false;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', 'yes', 'y'].includes(normalized)) return true;
        if (['false', 'no', 'n'].includes(normalized)) return false;
    }
    return null;
};
const pickFirstDefined = (...values) => values.find((value) => value !== null && value !== undefined);
const areNumbersEqual = (a, b) => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return Math.abs(a - b) < 1e-9;
};
const normalizeDecision = (value) => {
    const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
    if (normalized === DECISIONS.ALLOWED || normalized.includes('ALLOW') || normalized.includes('GREEN')) {
        return DECISIONS.ALLOWED;
    }
    if (normalized === DECISIONS.OVERCHARGED || normalized.includes('OVER') || normalized.includes('RED')) {
        return DECISIONS.OVERCHARGED;
    }
    return DECISIONS.NEEDS_REVIEW;
};
const normalizeLineItem = (item) => {
    const qty = toFiniteNumber(pickFirstDefined(item?.qty, item?.quantity, item?.Qty, item?.Quantity));
    const rate = toFiniteNumber(pickFirstDefined(item?.rate, item?.Rate, item?.unit_rate, item?.unitRate));
    const billedAmount = toFiniteNumber(
        pickFirstDefined(item?.final_amount, item?.billed_amount, item?.billedAmount, item?.bill_amount)
    );

    return {
        billItem: String(
            pickFirstDefined(item?.bill_item, item?.item_name, item?.billItem, item?.itemName, item?.name, item?.item) || ''
        ).trim(),
        bestMatch: String(pickFirstDefined(item?.best_match, item?.matched_item, item?.bestMatch, item?.matchedItem) || '').trim(),
        tieupRate: toFiniteNumber(pickFirstDefined(item?.tieup_rate, item?.tieupRate, item?.allowed_rate)),
        allowedAmount: toFiniteNumber(pickFirstDefined(item?.allowed_amount, item?.allowedAmount)),
        qty,
        rate,
        originalTieupRate: toFiniteNumber(pickFirstDefined(item?.tieup_rate, item?.tieupRate, item?.allowed_rate)),
        originalQty: qty,
        originalRate: rate,
        billedAmount,
        originalBilledAmount: billedAmount,
        amountToBePaid: toFiniteNumber(pickFirstDefined(item?.amount_to_be_paid, item?.amountToBePaid, item?.payable_amount)),
        discrepancy: toBooleanOrNull(pickFirstDefined(item?.discrepancy, item?.is_discrepancy)),
        extraAmount: toFiniteNumber(pickFirstDefined(item?.extra_amount, item?.extraAmount)),
        decision: normalizeDecision(item?.decision),
        reason: String(pickFirstDefined(item?.reason, item?.remarks) || '').trim(),
    };
};
const buildParsedFromLineItems = (lineItems, financialTotals = null) => {
    if (!Array.isArray(lineItems) || lineItems.length === 0) return null;

    const categoryMap = new Map();
    lineItems.forEach((rawItem) => {
        if (!rawItem || typeof rawItem !== 'object') return;
        const normalized = normalizeLineItem(rawItem);
        if (!normalized.billItem) return;
        const categoryName = String(
            pickFirstDefined(rawItem?.category_name, rawItem?.categoryName, rawItem?.category, 'Uncategorized')
        ).trim() || 'Uncategorized';
        if (!categoryMap.has(categoryName)) categoryMap.set(categoryName, []);
        categoryMap.get(categoryName).push(normalized);
    });

    const categories = Array.from(categoryMap.entries()).map(([name, items]) => ({ name, items }));
    if (categories.length === 0) return null;

    const allItems = categories.flatMap((category) => category.items);
    const summary = {
        totalItems: allItems.length,
        allowedCount: allItems.filter((item) => item.decision === DECISIONS.ALLOWED).length,
        overchargedCount: allItems.filter((item) => item.decision === DECISIONS.OVERCHARGED).length,
        needsReviewCount: allItems.filter((item) => item.decision === DECISIONS.NEEDS_REVIEW).length,
    };
    const computedFinancial = {
        totalBilled: allItems.reduce((sum, item) => sum + (item.billedAmount ?? 0), 0),
        totalAllowed: allItems.reduce((sum, item) => sum + (item.allowedAmount ?? 0), 0),
        totalExtra: allItems.reduce((sum, item) => sum + (item.extraAmount ?? 0), 0),
        totalUnclassified: 0,
    };

    return {
        summary,
        financial: {
            totalBilled: Number(financialTotals?.total_billed ?? computedFinancial.totalBilled),
            totalAllowed: Number(financialTotals?.total_allowed ?? computedFinancial.totalAllowed),
            totalExtra: Number(financialTotals?.total_extra ?? computedFinancial.totalExtra),
            totalUnclassified: Number(financialTotals?.total_unclassified ?? computedFinancial.totalUnclassified),
        },
        categories,
        warnings: [],
    };
};
const withOriginalLineValues = (parsed) => {
    if (!parsed?.categories) return parsed;
    return {
        ...parsed,
        categories: parsed.categories.map((category) => ({
            ...category,
            items: (category.items || []).map((item) => {
                const qty = toFiniteNumber(item?.qty);
                const rate = toFiniteNumber(item?.rate);
                const tieupRate = toFiniteNumber(item?.tieupRate);
                const billedAmount = toFiniteNumber(item?.billedAmount ?? item?.originalBilledAmount);
                return {
                    ...item,
                    originalTieupRate: item?.originalTieupRate ?? tieupRate,
                    originalQty: item?.originalQty ?? qty,
                    originalRate: item?.originalRate ?? rate,
                    originalBilledAmount: item?.originalBilledAmount ?? billedAmount,
                };
            }),
        })),
    };
};
const buildLineItemEditPayload = (parsed) => {
    if (!parsed?.categories) return [];
    const edits = [];

    parsed.categories.forEach((category) => {
        (category.items || []).forEach((item, itemIndex) => {
            const currentQty = toFiniteNumber(item?.qty);
            const currentRate = toFiniteNumber(item?.rate);
            const currentTieupRate = toFiniteNumber(item?.tieupRate);
            const originalQty = toFiniteNumber(item?.originalQty ?? item?.qty);
            const originalRate = toFiniteNumber(item?.originalRate ?? item?.rate);
            const originalTieupRate = toFiniteNumber(item?.originalTieupRate ?? item?.tieupRate);
            const qtyChanged = !areNumbersEqual(currentQty, originalQty);
            const rateChanged = !areNumbersEqual(currentRate, originalRate);
            const tieupRateChanged = !areNumbersEqual(currentTieupRate, originalTieupRate);
            if (!qtyChanged && !rateChanged && !tieupRateChanged) return;

            const edit = {
                category_name: category.name,
                item_index: itemIndex,
            };
            if (qtyChanged) edit.qty = currentQty;
            if (rateChanged) edit.rate = currentRate;
            if (tieupRateChanged) edit.tieup_rate = currentTieupRate;
            if (edit.qty === null && edit.rate === null && edit.tieup_rate === null) return;
            edits.push(edit);
        });
    });

    return edits;
};

const ResultPage = () => {
    const { uploadId: urlUploadId } = useParams();
    const navigate = useNavigate();
    const [isEditMode, setIsEditMode] = useState(false);

    const [billData, setBillData] = useState(null);
    const [parsedResult, setParsedResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('Loading billing details...');
    const [error, setError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [filterExpanded, setFilterExpanded] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedDecisions, setSelectedDecisions] = useState([]);
    const handleDecisionToggle = (decision) => {
        setSelectedDecisions((prev) => (
            prev.includes(decision) ? prev.filter((item) => item !== decision) : [...prev, decision]
        ));
    };

    const handleClearFilters = () => {
        setSearchText('');
        setSelectedDecisions([]);
    };

    const handleUpdateCategoryItem = React.useCallback((categoryName, itemIndex, updates) => {
        setParsedResult((prev) => {
            if (!prev?.categories) return prev;
            return {
                ...prev,
                categories: prev.categories.map((category) => {
                    if (category.name !== categoryName) return category;
                    return {
                        ...category,
                        items: category.items.map((item, index) => (
                            index === itemIndex ? { ...item, ...updates } : item
                        )),
                    };
                }),
            };
        });
    }, []);

    const parseAndSetResult = (rawVerificationResult, financialTotals = null, lineItems = []) => {
        const parsedFromLineItems = buildParsedFromLineItems(lineItems, financialTotals);
        if (parsedFromLineItems) {
            setParsedResult(applyBillEdits(urlUploadId, withOriginalLineValues(parsedFromLineItems)));
            return;
        }

        const parsed = parseVerificationResult(rawVerificationResult);
        if (financialTotals && typeof financialTotals === 'object') {
            parsed.financial = {
                ...parsed.financial,
                totalBilled: Number(financialTotals.total_billed || 0),
                totalAllowed: Number(financialTotals.total_allowed || 0),
                totalExtra: Number(financialTotals.total_extra || 0),
                totalUnclassified: Number(financialTotals.total_unclassified || 0),
            };
        }
        setParsedResult(applyBillEdits(urlUploadId, withOriginalLineValues(parsed)));
    };

    const fetchBill = async (targetUploadId) => {
        if (!String(targetUploadId || '').trim()) {
            setError('Bill ID is missing in the URL.');
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage('Loading verification result...');
            setError(null);
            setBillData(null);
            setParsedResult(null);
            const requestedId = targetUploadId.trim();
            const data = await getBillData(requestedId);
            const rawVerificationText = typeof data.verification_result === 'string'
                ? data.verification_result
                : '';
            const detailsReady = data?.details_ready === true;
            const hasVerificationPayload = Boolean(
                (typeof rawVerificationText === 'string' && rawVerificationText.trim())
                || (Array.isArray(data?.line_items) && data.line_items.length > 0)
            );

            setBillData(data);
            if (data.status === STAGES.COMPLETED && detailsReady && hasVerificationPayload) {
                parseAndSetResult(rawVerificationText, data.financial_totals, data.line_items);
            }
        } catch (err) {
            setError(
                err.response?.data?.message
                || err.response?.data?.detail
                || err.message
                || 'Failed to load bill result.'
            );
        } finally {
            setLoading(false);
            setLoadingMessage('Loading billing details...');
        }
    };

    useEffect(() => {
        if (urlUploadId) {
            fetchBill(urlUploadId);
        }
    }, [urlUploadId]);

    const filteredCategories = useMemo(() => {
        if (!parsedResult?.categories) return [];
        const hasDecisionFilter = selectedDecisions.length > 0;
        const hasSearchFilter = Boolean(searchText.trim());
        const normalizedSearch = normalizeText(searchText.trim());

        return parsedResult.categories
            .map((category) => {
                const filteredItems = category.items.filter((item) => {
                    const decisionPass = !hasDecisionFilter || selectedDecisions.includes(item.decision);
                    if (!decisionPass) return false;

                    if (!hasSearchFilter) return true;
                    const haystack = normalizeText(`${item.billItem} ${item.bestMatch} ${item.reason}`);
                    return haystack.includes(normalizedSearch);
                });

                return {
                    ...category,
                    items: filteredItems,
                };
            })
            .filter((category) => category.items.length > 0);
    }, [parsedResult, searchText, selectedDecisions]);

    const hasData = Boolean(parsedResult && billData?.status === STAGES.COMPLETED && billData?.details_ready === true);
    const financialSummary = useMemo(() => {
        if (!parsedResult?.financial) return null;
        const totalAmountToBePaid = (parsedResult?.categories || [])
            .flatMap((category) => category.items || [])
            .reduce((sum, item) => {
                const payable = toFiniteNumber(item?.amountToBePaid ?? item?.allowedAmount);
                return sum + (payable ?? 0);
            }, 0);
        return {
            ...parsedResult.financial,
            totalAmountToBePaid,
        };
    }, [parsedResult]);

    const handleSaveEdits = async () => {
        if (!urlUploadId || !parsedResult) return;
        try {
            setSaving(true);
            setSaveError(null);
            const edits = buildLineItemEditPayload(parsedResult);
            if (edits.length > 0) {
                await patchBillLineItems(urlUploadId, edits);
            }
            saveBillEdits(urlUploadId, parsedResult);
            await fetchBill(urlUploadId);
            setIsEditMode(false);
        } catch (err) {
            setSaveError(
                err?.response?.data?.detail?.message
                || err?.response?.data?.detail
                || err?.response?.data?.message
                || err?.message
                || 'Failed to save edits.'
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <Container maxWidth={false} sx={{ py: 4, px: { xs: 1.5, md: 3 } }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Billing Details
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => (isEditMode ? setIsEditMode(false) : navigate('/dashboard'))}
                        sx={{ textTransform: 'none' }}
                    >
                        {isEditMode ? 'Exit Edit Mode' : 'Back to Dashboard'}
                    </Button>
                </Box>

            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {saveError && (
                <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
                    {saveError}
                </Alert>
            )}

            {loading && (
                <Paper elevation={2} sx={{ p: 4, textAlign: 'center', mb: 3 }}>
                    <CircularProgress />
                    <Typography variant="body1" sx={{ mt: 1 }}>
                        {loadingMessage}
                    </Typography>
                </Paper>
            )}

            {billData && (billData.status !== STAGES.COMPLETED || billData?.details_ready !== true) && !loading && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Bill is currently in <strong>{billData.status}</strong> state. Structured verification table is shown
                    only after completion.
                </Alert>
            )}
            {isEditMode && hasData && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    Edit mode is active. Update values directly in the table rows, then click Save Changes.
                </Alert>
            )}

            {hasData && (
                <Stack spacing={3}>
                    {parsedResult.warnings.length > 0 && (
                        <Alert severity="warning">
                            Parser warnings: {parsedResult.warnings.join(' ')}
                        </Alert>
                    )}

                    <VerificationSummaryCard summary={parsedResult.summary} />
                    <FinancialSummaryCard financial={financialSummary || parsedResult.financial} />

                    <ResultFilters
                        expanded={filterExpanded}
                        onToggleExpanded={() => setFilterExpanded((prev) => !prev)}
                        searchText={searchText}
                        onSearchTextChange={setSearchText}
                        selectedDecisions={selectedDecisions}
                        onDecisionToggle={handleDecisionToggle}
                        onClearFilters={handleClearFilters}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <Button
                            variant="contained"
                            onClick={handleSaveEdits}
                            disabled={saving}
                            sx={{ textTransform: 'none' }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </Box>
                    {filteredCategories.length === 0 ? (
                        <Alert severity="info">
                            No items match current filters.
                        </Alert>
                    ) : (
                        filteredCategories.map((category) => (
                            <CategoryResultTable
                                key={category.name}
                                category={category}
                                onUpdateItem={handleUpdateCategoryItem}
                            />
                        ))
                    )}
                </Stack>
            )}
        </Container>
    );
};

export default ResultPage;
