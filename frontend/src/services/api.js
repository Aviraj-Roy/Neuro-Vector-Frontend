import axios from 'axios';

const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
    (config) => {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('[API Request Error]', error);
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => {
        console.log(`[API Response] ${response.config.url}`, response.status);
        return response;
    },
    (error) => {
        console.error('[API Response Error]', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

const normalizeStatus = (value) => String(value || 'uploaded').toUpperCase();
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
const normalizeNullableDate = (value) => {
    if (value === null || value === undefined) return null;
    const trimmed = String(value).trim();
    return trimmed || null;
};

const normalizeUploadResponse = (data) => ({
    upload_id: data?.upload_id || '',
    employee_id: data?.employee_id || '',
    hospital_name: data?.hospital_name || '',
    message: data?.message || '',
    status: normalizeStatus(data?.status),
    page_count: Number(data?.page_count || 0),
    original_filename: data?.original_filename || 'Unknown',
    file_size_bytes: Number(data?.file_size_bytes || 0),
});

const normalizeStatusResponse = (data, uploadId) => ({
    upload_id: data?.upload_id || uploadId,
    status: normalizeStatus(data?.status),
    exists: Boolean(data?.exists),
    message: data?.message || '',
    hospital_name: data?.hospital_name || '',
    page_count: Number(data?.page_count || 0),
    original_filename: data?.original_filename || 'Unknown',
    file_size_bytes: Number(data?.file_size_bytes || 0),
    details_ready: parseBooleanLike(data?.details_ready) ?? false,
});

export const normalizeBillsResponse = (data) => {
    const rawBills = Array.isArray(data)
        ? data
        : Array.isArray(data?.bills)
            ? data.bills
            : [];

    return rawBills.map((bill) => {
        const rawVerification = bill?.verification_result ?? bill?.verificationResult ?? bill?.result;
        const explicitReady = bill?.details_ready ?? bill?.result_ready ?? bill?.is_result_ready ?? bill?.has_verification_result;
        const hasExplicitReady = explicitReady !== null && explicitReady !== undefined;
        const parsedExplicitReady = parseBooleanLike(explicitReady);
        const hasRawVerification = rawVerification !== null && rawVerification !== undefined;
        return ({
        bill_id: bill?.bill_id || bill?.upload_id || '',
        upload_id: bill?.upload_id || bill?.bill_id || '',
        employee_id: bill?.employee_id || '',
        invoice_date: normalizeNullableDate(bill?.invoice_date),
        upload_date: normalizeNullableDate(bill?.upload_date || bill?.created_at),
        completed_at: normalizeNullableDate(bill?.completed_at),
        processing_started_at: normalizeNullableDate(
            bill?.processing_started_at ?? bill?.processingStartedAt ?? bill?.processing_start_time
        ),
        processing_time: bill?.processing_time ?? bill?.processingTime ?? null,
        processing_time_seconds: bill?.processing_time_seconds ?? bill?.processing_duration_seconds ?? bill?.processingTimeSeconds ?? bill?.processingDurationSeconds ?? null,
        hospital_name: bill?.hospital_name || '',
        status: normalizeStatus(bill?.status),
        details_ready: hasExplicitReady
            ? (parsedExplicitReady ?? hasNonEmptyValue(explicitReady))
            : (hasRawVerification ? hasNonEmptyValue(rawVerification) : null),
        verification_result: rawVerification ?? null,
        grand_total: bill?.grand_total ?? null,
        page_count: Number(bill?.page_count || 0),
        original_filename: bill?.original_filename || 'Unknown',
        file_size_bytes: Number(bill?.file_size_bytes || 0),
        created_at: bill?.created_at || null,
        updated_at: bill?.updated_at || null,
        });
    });
};

export const buildUploadFormData = (file, hospitalName, employeeId, invoiceDate, clientRequestId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital_name', hospitalName);
    formData.append('employee_id', employeeId);
    if (invoiceDate) {
        formData.append('invoice_date', invoiceDate);
    }
    if (clientRequestId) {
        formData.append('client_request_id', clientRequestId);
    }
    return formData;
};

const normalizeBillDataResponse = (data, uploadId) => {
    const rawVerification = data?.verificationResult ?? data?.verification_result ?? data?.result ?? '';
    const verificationRaw = (rawVerification && typeof rawVerification === 'object') ? rawVerification : null;
    const verificationAsText = typeof rawVerification === 'string'
        ? rawVerification
        : rawVerification
            ? JSON.stringify(rawVerification, null, 2)
            : '';

    return {
        ...data,
        bill_id: data?.billId || data?.bill_id || data?.upload_id || uploadId,
        upload_id: data?.upload_id || data?.billId || uploadId,
        status: normalizeStatus(data?.status),
        details_ready: parseBooleanLike(
            data?.details_ready ?? data?.result_ready ?? data?.has_verification_result
        ) ?? false,
        verification_result_raw: verificationRaw,
        verification_result: verificationAsText,
        line_items: Array.isArray(data?.line_items) ? data.line_items : [],
        financial_totals: {
            total_billed: Number(data?.financial_totals?.total_billed || 0),
            total_allowed: Number(data?.financial_totals?.total_allowed || 0),
            total_extra: Number(data?.financial_totals?.total_extra || 0),
            total_unclassified: Number(data?.financial_totals?.total_unclassified || 0),
        },
    };
};

const normalizeHospitalsResponse = (data) => {
    const rawHospitals = Array.isArray(data)
        ? data
        : Array.isArray(data?.hospitals)
            ? data.hospitals
            : [];

    return rawHospitals
        .map((item) => {
            if (typeof item === 'string') {
                return {
                    id: item.toLowerCase().replace(/\s+/g, '_'),
                    name: item,
                };
            }

            if (item && typeof item === 'object') {
                const name = item.name || item.hospital_name || item.id;
                if (!name) return null;
                return {
                    id: item.id || String(name).toLowerCase().replace(/\s+/g, '_'),
                    name: String(name),
                };
            }

            return null;
        })
        .filter(Boolean);
};

export const uploadBill = async (file, hospitalName, employeeId, invoiceDate, clientRequestId) => {
    const formData = buildUploadFormData(file, hospitalName, employeeId, invoiceDate, clientRequestId);

    const response = await apiClient.post('/upload', formData);
    return normalizeUploadResponse(response.data);
};

export const getUploadStatus = async (uploadId) => {
    const response = await apiClient.get(`/status/${uploadId}`);
    return normalizeStatusResponse(response.data, uploadId);
};

export const getAllBills = async () => {
    const response = await apiClient.get('/bills');
    return normalizeBillsResponse(response.data);
};

export const deleteBill = async (uploadId, permanent = true) => {
    const params = permanent ? { permanent: true } : undefined;
    try {
        const response = await apiClient.delete(`/bills/${uploadId}`, { params });
        return response.data;
    } catch (error) {
        const status = error?.response?.status;
        // Some backend versions expose DELETE /bill/{id} instead of /bills/{id}.
        if (status === 404 || status === 405) {
            const fallbackResponse = await apiClient.delete(`/bill/${uploadId}`, { params });
            return fallbackResponse.data;
        }
        throw error;
    }
};

export const getBillData = async (uploadId) => {
    const response = await apiClient.get(`/bill/${uploadId}`);
    return normalizeBillDataResponse(response.data, uploadId);
};

export const patchBillLineItems = async (uploadId, lineItems, editedBy = null) => {
    const payload = {
        line_items: Array.isArray(lineItems) ? lineItems : [],
    };
    if (editedBy) payload.edited_by = editedBy;
    const response = await apiClient.patch(`/bill/${uploadId}/line-items`, payload);
    return response.data;
};

export const verifyBill = async (uploadId, hospitalName = null) => {
    const formData = new FormData();
    if (hospitalName) {
        formData.append('hospital_name', hospitalName);
    }
    const response = await apiClient.post(`/verify/${uploadId}`, formData);
    return response.data;
};

export const getHospitals = async () => {
    const response = await apiClient.get('/tieups');
    return normalizeHospitalsResponse(response.data);
};

export const reloadTieups = async () => {
    const response = await apiClient.post('/tieups/reload');
    return response.data;
};

export const healthCheck = async () => {
    const response = await apiClient.get('/health');
    return response.data;
};

export default {
    uploadBill,
    getUploadStatus,
    getAllBills,
    deleteBill,
    getBillData,
    patchBillLineItems,
    verifyBill,
    getHospitals,
    reloadTieups,
    healthCheck,
};
