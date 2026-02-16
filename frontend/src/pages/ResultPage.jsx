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
import { getBillData, verifyBill } from '../services/api';
import { STAGES } from '../constants/stages';
import { parseVerificationResult } from '../utils/verificationResultParser';
import { applyBillEdits, saveBillEdits } from '../utils/billEditsStorage';
import VerificationSummaryCard from '../components/results/VerificationSummaryCard';
import FinancialSummaryCard from '../components/results/FinancialSummaryCard';
import ResultFilters from '../components/results/ResultFilters';
import CategoryResultTable from '../components/results/CategoryResultTable';

const normalizeText = (value) => String(value || '').toLowerCase();

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

    const parseAndSetResult = (rawVerificationResult, financialTotals = null) => {
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
        setParsedResult(applyBillEdits(urlUploadId, parsed));
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
            let data = await getBillData(requestedId);

            let rawVerificationText = typeof data.verification_result === 'string'
                ? data.verification_result
                : '';

            if (data.status === STAGES.COMPLETED && !rawVerificationText.trim()) {
                setLoadingMessage('Generating verification result...');
                await verifyBill(data.upload_id || requestedId, data.hospital_name || null);
                data = await getBillData(requestedId);
                rawVerificationText = typeof data.verification_result === 'string'
                    ? data.verification_result
                    : '';
            }

            setBillData(data);
            parseAndSetResult(rawVerificationText, data.financial_totals);
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

    const hasData = Boolean(parsedResult && billData);
    const handleEnterEditMode = () => setIsEditMode(true);
    const handleSaveEdits = () => {
        if (!urlUploadId || !parsedResult) return;
        try {
            setSaving(true);
            setSaveError(null);
            saveBillEdits(urlUploadId, parsedResult);
            setIsEditMode(false);
        } catch (err) {
            setSaveError(err?.message || 'Failed to save edits.');
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

            {billData && billData.status !== STAGES.COMPLETED && !loading && (
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
                    <FinancialSummaryCard financial={parsedResult.financial} />

                    <ResultFilters
                        expanded={filterExpanded}
                        onToggleExpanded={() => setFilterExpanded((prev) => !prev)}
                        searchText={searchText}
                        onSearchTextChange={setSearchText}
                        selectedDecisions={selectedDecisions}
                        onDecisionToggle={handleDecisionToggle}
                        onClearFilters={handleClearFilters}
                    />
                    {isEditMode && (
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
                    )}
                    {!isEditMode && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                            <Button variant="contained" onClick={handleEnterEditMode} sx={{ textTransform: 'none' }}>
                                Edit All Items
                            </Button>
                        </Box>
                    )}

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
                                isEditMode={isEditMode}
                            />
                        ))
                    )}
                </Stack>
            )}
        </Container>
    );
};

export default ResultPage;
