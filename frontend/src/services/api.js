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
});

export const normalizeBillsResponse = (data) => {
    const rawBills = Array.isArray(data)
        ? data
        : Array.isArray(data?.bills)
            ? data.bills
            : [];

    return rawBills.map((bill) => ({
        bill_id: bill?.bill_id || bill?.upload_id || '',
        upload_id: bill?.upload_id || bill?.bill_id || '',
        employee_id: bill?.employee_id || '',
        invoice_date: normalizeNullableDate(bill?.invoice_date),
        upload_date: normalizeNullableDate(bill?.upload_date || bill?.created_at),
        completed_at: normalizeNullableDate(bill?.completed_at),
        processing_time: bill?.processing_time ?? null,
        processing_time_seconds: bill?.processing_time_seconds ?? bill?.processing_duration_seconds ?? null,
        hospital_name: bill?.hospital_name || '',
        status: normalizeStatus(bill?.status),
        grand_total: bill?.grand_total ?? null,
        page_count: Number(bill?.page_count || 0),
        original_filename: bill?.original_filename || 'Unknown',
        file_size_bytes: Number(bill?.file_size_bytes || 0),
        created_at: bill?.created_at || null,
        updated_at: bill?.updated_at || null,
    }));
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
        verification_result: verificationAsText,
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

export const deleteBill = async (uploadId) => {
    const response = await apiClient.delete(`/bills/${uploadId}`);
    return response.data;
};

export const getBillData = async (uploadId) => {
    const response = await apiClient.get(`/bill/${uploadId}`);
    return normalizeBillDataResponse(response.data, uploadId);
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
    verifyBill,
    getHospitals,
    reloadTieups,
    healthCheck,
};
