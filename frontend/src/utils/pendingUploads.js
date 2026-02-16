const STORAGE_KEY = 'pending_bill_uploads';
const EVENT_NAME = 'pending-uploads-updated';

const safeParse = (value, fallback) => {
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const emitPendingUploadsChanged = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(EVENT_NAME));
    }
};

const savePendingUploads = (uploads) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(uploads));
    emitPendingUploadsChanged();
};

export const loadPendingUploads = () => {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = safeParse(raw || '[]', []);
    return Array.isArray(parsed) ? parsed : [];
};

export const addPendingUpload = (payload) => {
    const current = loadPendingUploads();
    const next = [
        ...current,
        {
            ...payload,
            temp_id: payload.temp_id || `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            status: String(payload.status || 'PENDING').toUpperCase(),
            upload_date: payload.upload_date || new Date().toISOString(),
        },
    ];
    savePendingUploads(next);
    return next[next.length - 1];
};

export const updatePendingUpload = (tempId, patch) => {
    const current = loadPendingUploads();
    const next = current.map((item) => (
        item.temp_id === tempId ? { ...item, ...patch } : item
    ));
    savePendingUploads(next);
};

export const completePendingUpload = (tempId, result) => {
    const rawStatus = String(result?.status || '').toUpperCase();
    const finalStatus = rawStatus === 'COMPLETED' ? 'COMPLETED' : 'PROCESSING';

    updatePendingUpload(tempId, {
        bill_id: result?.bill_id || result?.upload_id || '',
        upload_id: result?.upload_id || result?.bill_id || '',
        page_count: result?.page_count ?? null,
        status: finalStatus,
        updated_at: new Date().toISOString(),
    });
};

export const failPendingUpload = (tempId, message) => {
    updatePendingUpload(tempId, {
        status: 'FAILED',
        error_message: message || 'Upload failed',
        updated_at: new Date().toISOString(),
    });
};

export const pruneSyncedPendingUploads = (serverBills) => {
    const syncedIds = new Set(
        (serverBills || [])
            .map((row) => row?.bill_id || row?.upload_id)
            .filter(Boolean),
    );

    const current = loadPendingUploads();
    const next = current.filter((item) => {
        const billId = item?.bill_id || item?.upload_id;
        return !(billId && syncedIds.has(billId));
    });

    if (next.length !== current.length) {
        savePendingUploads(next);
    }
};

export const subscribePendingUploads = (listener) => {
    if (typeof window === 'undefined') return () => {};
    const handler = () => listener(loadPendingUploads());
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
};

export const removePendingUploadById = (uploadId) => {
    const target = String(uploadId || '');
    if (!target) return;

    const current = loadPendingUploads();
    const next = current.filter((item) => {
        const idCandidates = [item?.upload_id, item?.bill_id, item?.temp_id]
            .map((value) => String(value || ''))
            .filter(Boolean);
        return !idCandidates.includes(target);
    });

    if (next.length !== current.length) {
        savePendingUploads(next);
    }
};
