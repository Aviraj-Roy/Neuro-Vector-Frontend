import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

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

const normalizeUploadResponse = (data) => ({
    upload_id: data?.upload_id || '',
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

const normalizeBillsResponse = (data) => {
    const rawBills = Array.isArray(data)
        ? data
        : Array.isArray(data?.bills)
            ? data.bills
            : [];

    return rawBills.map((bill) => ({
        upload_id: bill?.upload_id || '',
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

const normalizeBillDataResponse = (data, uploadId) => ({
    ...data,
    upload_id: data?.upload_id || uploadId,
    status: normalizeStatus(data?.status),
    verification_result: data?.verification_result || data?.verificationResult || data?.result || null,
});

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

export const uploadBill = async (file, hospitalName, clientRequestId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital_name', hospitalName);
    if (clientRequestId) {
        formData.append('client_request_id', clientRequestId);
    }

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
    getHospitals,
    reloadTieups,
    healthCheck,
};
