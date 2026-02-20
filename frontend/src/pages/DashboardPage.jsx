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
    removePendingUploadById,
    subscribePendingUploads,
} from '../utils/pendingUploads';

const DELETED_BILLS_STORAGE_KEY = 'dashboard_deleted_bills';
const AUTO_PERMANENT_DELETE_DAYS = 30;
const AUTO_PERMANENT_DELETE_MS = AUTO_PERMANENT_DELETE_DAYS * 24 * 60 * 60 * 1000;

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

const getBillIdentifier = (bill) => bill?.upload_id || bill?.bill_id || bill?.temp_id || null;
const toIdentifierKey = (value) => (value === null || value === undefined ? '' : String(value));
const isTempIdentifier = (value) => toIdentifierKey(value).startsWith('tmp-');
const getDeletedAtMs = (bill) => new Date(
    bill?.deleted_at || bill?.deletedAt || bill?.updated_at || 0
).getTime();
const matchesIdentifier = (bill, uploadId) => {
    const target = toIdentifierKey(uploadId);
    return [
        bill?.upload_id,
        bill?.bill_id,
        bill?.temp_id,
    ].map(toIdentifierKey).some((id) => id && id === target);
};
const getDeleteCandidates = (bill, clickedId) => {
    const ordered = [
        bill?.upload_id,
        bill?.bill_id,
        clickedId,
    ].map(toIdentifierKey).filter(Boolean);
    const deduped = [...new Set(ordered)];
    return deduped.filter((id) => !isTempIdentifier(id));
};
const getIdentifierKeys = (bill, extraId = null) => new Set(
    [
        bill?.upload_id,
        bill?.bill_id,
        bill?.temp_id,
        extraId,
    ].map(toIdentifierKey).filter(Boolean)
);
const isNotFoundDeleteError = (error) => {
    const status = error?.response?.status;
    return status === 404;
};
const isPermanentDeletePreconditionError = (error) => {
    const message = String(
        error?.response?.data?.message
        || error?.response?.data?.detail
        || error?.message
        || ''
    ).toLowerCase();
    return message.includes('permanent delete is allowed only for deleted bills');
};
const resolveDeleteRequest = (billOrId) => {
    if (billOrId && typeof billOrId === 'object') {
        return {
            clickedBill: billOrId,
            clickedId: getBillIdentifier(billOrId),
        };
    }
    return {
        clickedBill: null,
        clickedId: billOrId,
    };
};
const ACTIVE_STATUSES = new Set([STAGES.UPLOADED, STAGES.PENDING, STAGES.PROCESSING]);
const TERMINAL_STATUSES = new Set([STAGES.COMPLETED, STAGES.FAILED]);
const NON_DELETED_VIEW_STATUSES = new Set([
    STAGES.UPLOADED,
    STAGES.PENDING,
    STAGES.PROCESSING,
    STAGES.FAILED,
]);
const getNormalizedStatus = (bill) => String(bill?.status || '').toUpperCase();
const parseBooleanLike = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
        if (['false', '0', 'no', 'n', ''].includes(normalized)) return false;
    }
    return null;
};
const hasNonEmptyValue = (value) => {
    if (value === null || value === undefined) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
};
const isBillDetailsReady = (bill) => {
    const explicit = bill?.details_ready ?? bill?.detailsReady ?? bill?.result_ready ?? bill?.resultReady;
    const parsedExplicit = parseBooleanLike(explicit);
    if (parsedExplicit !== null) return parsedExplicit;
    if (explicit !== null && explicit !== undefined) return hasNonEmptyValue(explicit);
    const rawVerification = bill?.verification_result ?? bill?.verificationResult ?? bill?.result;
    if (rawVerification === null || rawVerification === undefined) {
        return false;
    }
    return hasNonEmptyValue(rawVerification);
};
const getQueueStatus = (bill) => {
    const normalized = getNormalizedStatus(bill);
    if (normalized === STAGES.COMPLETED && !isBillDetailsReady(bill)) {
        return STAGES.PROCESSING;
    }
    return normalized;
};

const getBillTimeMs = (bill) => new Date(
    bill?.upload_date || bill?.created_at || bill?.updated_at || 0
).getTime();

const applySequentialQueueStatus = (rows, startTimeMap) => {
    const next = (rows || []).map((item) => ({ ...item }));
    const activeRows = next
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => ACTIVE_STATUSES.has(getQueueStatus(row)))
        .sort((a, b) => getBillTimeMs(a.row) - getBillTimeMs(b.row));

    const processingCandidate = activeRows[0];
    const keepProcessingIndex = processingCandidate?.index ?? -1;
    const nowIso = new Date().toISOString();

    const mapped = next.map((row, index) => {
        const rowId = getBillIdentifier(row);
        const normalized = getQueueStatus(row);
        const existingStart = row?.processing_started_at || row?.processingStartedAt || startTimeMap.get(rowId);

        if (rowId && existingStart) {
            startTimeMap.set(rowId, existingStart);
        }

        if (index === keepProcessingIndex && ACTIVE_STATUSES.has(normalized)) {
            if (rowId && !existingStart) {
                startTimeMap.set(rowId, nowIso);
            }
            return {
                ...row,
                status: STAGES.PROCESSING,
                processing_started_at: existingStart || nowIso,
            };
        }
        if (ACTIVE_STATUSES.has(normalized)) {
            return { ...row, status: STAGES.PENDING };
        }
        if (TERMINAL_STATUSES.has(normalized) && existingStart && !row?.processing_started_at) {
            return {
                ...row,
                processing_started_at: existingStart,
            };
        }
        return row;
    });

    const visibleIds = new Set(next.map((row) => getBillIdentifier(row)).filter(Boolean));
    Array.from(startTimeMap.keys()).forEach((key) => {
        if (!visibleIds.has(key)) startTimeMap.delete(key);
    });

    return mapped;
};

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
    const [selectedDeletedBillIds, setSelectedDeletedBillIds] = React.useState([]);
    const queueStartTimesRef = React.useRef(new Map());
    const autoDeleteInFlightRef = React.useRef(false);
    const showDeleted = billScope === 'DELETED';

    const handleUploadNew = () => {
        navigate('/upload');
    };

    const performDeleteBill = async (billOrId, options = {}) => {
        const { skipConfirm = false } = options;
        const { clickedBill, clickedId } = resolveDeleteRequest(billOrId);
        if (!clickedId) return false;

        if (!skipConfirm) {
            const confirmed = showDeleted
                ? window.confirm(`Permanently delete bill ${clickedId}? This action cannot be undone.`)
                : window.confirm(`Temporarily delete bill ${clickedId}? You can restore it from Deleted Bills.`);
            if (!confirmed) return false;
        }

        try {
            setDeleteError(null);
            setDeletingUploadId(clickedId);
            const currentBills = [...(pendingUploads || []), ...(bills || [])];
            const billToDelete = (clickedBill && typeof clickedBill === 'object')
                ? clickedBill
                : (showDeleted ? deletedBills : currentBills).find((bill) => {
                    return matchesIdentifier(bill, clickedId);
                });

            const removeBillFromDeleted = () => {
                const removableKeys = getIdentifierKeys(billToDelete, clickedId);
                setDeletedBills((prev) => {
                    const next = prev.filter((item) => {
                        if (item === clickedBill) return false;
                        if (matchesIdentifier(item, clickedId)) return false;
                        const itemKeys = getIdentifierKeys(item);
                        return !Array.from(itemKeys).some((key) => removableKeys.has(key));
                    });
                    saveDeletedBills(next);
                    return next;
                });
            };

            if (!billToDelete && showDeleted) {
                removeBillFromDeleted();
                return true;
            }

            if (!billToDelete && !showDeleted) {
                return false;
            }

            if (showDeleted) {
                const deleteCandidates = getDeleteCandidates(billToDelete, clickedId);
                if (deleteCandidates.length === 0) {
                    removeBillFromDeleted();
                    Array.from(getIdentifierKeys(billToDelete, clickedId)).forEach((key) => removePendingUploadById(key));
                    setPendingUploads((prev) => prev.filter((item) => {
                        const itemKeys = getIdentifierKeys(item);
                        return !Array.from(itemKeys).some((key) => getIdentifierKeys(billToDelete, clickedId).has(key));
                    }));
                    return true;
                }

                let deleted = false;
                let lastError = null;
                let allNotFound = true;
                for (const candidateId of deleteCandidates) {
                    try {
                        await deleteBill(candidateId);
                        deleted = true;
                        allNotFound = false;
                        break;
                    } catch (error) {
                        if (isPermanentDeletePreconditionError(error)) {
                            try {
                                // Some backend versions require a soft-delete before permanent delete.
                                await deleteBill(candidateId, false);
                                await deleteBill(candidateId, true);
                                deleted = true;
                                allNotFound = false;
                                break;
                            } catch (followUpError) {
                                lastError = followUpError;
                                if (!isNotFoundDeleteError(followUpError)) {
                                    allNotFound = false;
                                }
                            }
                        } else {
                            lastError = error;
                            if (!isNotFoundDeleteError(error)) {
                                allNotFound = false;
                            }
                        }
                    }
                }
                // If backend says "not found" for all candidate IDs, treat as already deleted.
                if (deleted || allNotFound) {
                    removeBillFromDeleted();
                    await refetch();
                    return true;
                }
                if (!deleted) {
                    setDeleteError(
                        lastError?.response?.data?.message
                        || lastError?.response?.data?.detail
                        || lastError?.message
                        || 'Failed to permanently delete bill.'
                    );
                    return false;
                }
            } else {
                setDeletedBills((prev) => {
                    const next = [
                        { ...billToDelete, deleted_at: new Date().toISOString(), is_temporary_deleted: true },
                        ...prev.filter((item) => !matchesIdentifier(item, clickedId)),
                    ];
                    saveDeletedBills(next);
                    return next;
                });
                return true;
            }
        } catch (err) {
            setDeleteError(
                err.response?.data?.message
                || err.response?.data?.detail
                || err.message
                || 'Failed to delete bill.'
            );
            return false;
        } finally {
            setDeletingUploadId(null);
        }
    };

    const handleDeleteBill = async (billOrId) => performDeleteBill(billOrId, { skipConfirm: false });

    const handleRestoreBill = (uploadId) => {
        if (!uploadId) return;
        setRestoringUploadId(uploadId);
        setDeletedBills((prev) => {
            const next = prev.filter((item) => !matchesIdentifier(item, uploadId));
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
        // Keep Deleted view focused on terminal rows only.
        setDeletedBills((prev) => {
            const next = prev.filter((item) => !NON_DELETED_VIEW_STATUSES.has(getNormalizedStatus(item)));
            if (next.length !== prev.length) {
                saveDeletedBills(next);
            }
            return next;
        });
    }, []);

    React.useEffect(() => {
        pruneSyncedPendingUploads(bills);
    }, [bills]);

    React.useEffect(() => {
        let isCancelled = false;

        const autoPermanentDeleteOldBills = async () => {
            if (autoDeleteInFlightRef.current) return;

            const nowMs = Date.now();
            const expiredBills = deletedBills.filter((item) => {
                const deletedAtMs = getDeletedAtMs(item);
                return Number.isFinite(deletedAtMs) && deletedAtMs > 0 && (nowMs - deletedAtMs) >= AUTO_PERMANENT_DELETE_MS;
            });
            if (expiredBills.length === 0) return;

            autoDeleteInFlightRef.current = true;
            try {
                const targets = expiredBills.map((item) => ({
                    item,
                    key: toIdentifierKey(getBillIdentifier(item)),
                    backendIds: getDeleteCandidates(item, getBillIdentifier(item)),
                }));

                const removableKeys = new Set();
                let failedCount = 0;
                for (const target of targets) {
                    const key = target?.key;
                    if (!key) continue;

                    if (!target.backendIds.length) {
                        removableKeys.add(key);
                        continue;
                    }

                    let deleted = false;
                    let lastError = null;
                    let allNotFound = true;
                    for (const candidateId of target.backendIds) {
                        try {
                            await deleteBill(candidateId);
                            deleted = true;
                            allNotFound = false;
                            break;
                        } catch (error) {
                            lastError = error;
                            if (!isNotFoundDeleteError(error)) {
                                allNotFound = false;
                            }
                        }
                    }

                    if (deleted || allNotFound) {
                        removableKeys.add(key);
                    } else {
                        failedCount += 1;
                        console.error('Auto permanent delete failed for bill candidates:', target.backendIds, lastError);
                    }
                }

                if (!isCancelled && removableKeys.size > 0) {
                    setDeletedBills((prev) => {
                        const next = prev.filter((item) => !removableKeys.has(toIdentifierKey(getBillIdentifier(item))));
                        if (next.length !== prev.length) {
                            saveDeletedBills(next);
                        }
                        return next;
                    });
                    await refetch();
                }

                if (!isCancelled && failedCount > 0) {
                    setDeleteError(`Auto-delete failed for ${failedCount} expired bill(s).`);
                }
            } finally {
                autoDeleteInFlightRef.current = false;
            }
        };

        autoPermanentDeleteOldBills();
        const intervalId = window.setInterval(autoPermanentDeleteOldBills, 60 * 60 * 1000);
        return () => {
            isCancelled = true;
            window.clearInterval(intervalId);
        };
    }, [deletedBills, refetch]);

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
    const queueAwareSourceBills = React.useMemo(() => {
        if (showDeleted) return sourceBills;
        return applySequentialQueueStatus(sourceBills, queueStartTimesRef.current);
    }, [sourceBills, showDeleted]);
    const deletedIds = React.useMemo(
        () => new Set(deletedBills.map((item) => getBillIdentifier(item)).filter(Boolean)),
        [deletedBills]
    );

    const hospitalOptions = React.useMemo(() => {
        return [...new Set(
            queueAwareSourceBills
                .map((bill) => String(bill?.hospital_name || '').trim())
                .filter(Boolean)
        )].sort((a, b) => a.localeCompare(b));
    }, [queueAwareSourceBills]);

    const filteredBills = React.useMemo(() => {
        const query = employeeIdSearch.trim();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const matchedBills = queueAwareSourceBills.filter((bill) => {
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
    }, [queueAwareSourceBills, employeeIdSearch, statusFilter, hospitalFilter, dateFilter, showDeleted, deletedIds]);

    const handleToggleDeletedBillSelect = (bill, checked) => {
        const billId = getBillIdentifier(bill);
        if (!billId) return;
        setSelectedDeletedBillIds((prev) => {
            if (checked) return [...new Set([...prev, billId])];
            return prev.filter((id) => id !== billId);
        });
    };

    const handleToggleSelectAllDeletedBills = (checked) => {
        if (!showDeleted) return;
        if (!checked) {
            setSelectedDeletedBillIds([]);
            return;
        }
        const visibleIds = filteredBills.map((bill) => getBillIdentifier(bill)).filter(Boolean);
        setSelectedDeletedBillIds([...new Set(visibleIds)]);
    };

    const handleDeleteSelectedBills = async () => {
        if (!showDeleted) return;
        const visibleBills = filteredBills || [];
        const selectedSet = new Set(selectedDeletedBillIds);
        const targetBills = visibleBills.filter((bill) => selectedSet.has(getBillIdentifier(bill)));
        if (targetBills.length === 0) return;

        const confirmed = window.confirm(
            `Permanently delete ${targetBills.length} selected deleted bills? This action cannot be undone.`
        );
        if (!confirmed) return;

        let failed = 0;
        for (const bill of targetBills) {
            const success = await performDeleteBill(bill, { skipConfirm: true });
            if (!success) failed += 1;
        }

        if (failed > 0) {
            setDeleteError(`Failed to permanently delete ${failed} bill(s).`);
        }
    };

    React.useEffect(() => {
        if (!showDeleted) {
            setSelectedDeletedBillIds([]);
            return;
        }
        const visibleIds = new Set(filteredBills.map((bill) => getBillIdentifier(bill)).filter(Boolean));
        setSelectedDeletedBillIds((prev) => prev.filter((id) => visibleIds.has(id)));
    }, [showDeleted, filteredBills]);

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

            {showDeleted && (
                <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleDeleteSelectedBills}
                        disabled={
                            deletingUploadId !== null
                            || selectedDeletedBillIds.length === 0
                            || filteredBills.length === 0
                        }
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                        Delete Bills
                    </Button>
                </Box>
            )}

            {/* Bills Table */}
            <BillsTable
                bills={filteredBills}
                loading={!showDeleted && loading}
                onDeleteBill={handleDeleteBill}
                deletingUploadId={deletingUploadId}
                deletedView={showDeleted}
                onRestoreBill={showDeleted ? handleRestoreBill : null}
                restoringUploadId={restoringUploadId}
                selectedDeletedBillIds={selectedDeletedBillIds}
                onToggleDeletedBillSelect={showDeleted ? handleToggleDeletedBillSelect : null}
                onToggleSelectAllDeletedBills={showDeleted ? handleToggleSelectAllDeletedBills : null}
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
