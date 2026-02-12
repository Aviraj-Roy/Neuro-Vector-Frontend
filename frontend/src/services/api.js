import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Add request interceptor for logging (optional)
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

// Add response interceptor for error handling
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

/**
 * Extract a bill/upload identifier from various backend response shapes.
 * @param {Object} data - Raw response payload
 * @returns {string|undefined}
 */
const extractBillId = (data) => {
    if (!data || typeof data !== 'object') return undefined;
    return data.billId || data.bill_id || data.upload_id || data.uploadId || data.id;
};

/**
 * Normalize upload response so UI can read a stable billId field.
 * @param {Object} data - Raw response payload
 * @returns {Object}
 */
const normalizeUploadResponse = (data) => {
    const billId = extractBillId(data);
    return {
        ...data,
        billId,
    };
};

/**
 * Normalize status response across possible backend variants.
 * @param {Object} data - Raw response payload
 * @param {string} billId - Requested bill ID
 * @returns {Object}
 */
const normalizeStatusResponse = (data, billId) => {
    const rawStage = data?.stage || data?.status || data?.verification_status || 'UNKNOWN';
    const stage = String(rawStage).toUpperCase();

    return {
        ...data,
        billId: extractBillId(data) || billId,
        stage,
    };
};

/**
 * Normalize bill lookup response across possible backend variants.
 * @param {Object} data - Raw response payload
 * @param {string} billId - Requested bill ID
 * @returns {Object}
 */
const normalizeBillDataResponse = (data, billId) => {
    const rawStatus = data?.status || data?.stage || data?.verification_status || 'UNKNOWN';
    const status = String(rawStatus).toUpperCase();

    return {
        ...data,
        billId: extractBillId(data) || billId,
        status,
        verification_result: data?.verification_result || data?.verificationResult || data?.result || null,
    };
};

/**
 * Normalize hospitals response across backend variants.
 * @param {Object|Array} data - Raw response payload
 * @returns {Array<{id: string, name: string}>}
 */
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

/**
 * Upload a medical bill file
 * @param {File} file - The bill file (PDF/Image)
 * @param {string} hospitalName - Selected hospital name
 * @returns {Promise<{billId: string, status: string}>}
 */
export const uploadBill = async (file, hospitalName) => {
    const formData = new FormData();
    formData.append('file', file);
    // Current backend expects `hospital_name`. Keep `hospital` for compatibility.
    formData.append('hospital_name', hospitalName);
    formData.append('hospital', hospitalName);

    const response = await apiClient.post('/upload', formData);

    return normalizeUploadResponse(response.data);
};

/**
 * Get bill status by billId
 * @param {string} billId - The unique bill identifier
 * @returns {Promise<{billId: string, stage: string, progress?: number, message?: string}>}
 */
export const getBillStatus = async (billId) => {
    const response = await apiClient.get(`/status/${billId}`);
    return normalizeStatusResponse(response.data, billId);
};

/**
 * Get complete bill data and verification results
 * @param {string} billId - The unique bill identifier
 * @returns {Promise<Object>} Complete bill data with verification results
 */
export const getBillData = async (billId) => {
    const response = await apiClient.get(`/bill/${billId}`);
    return normalizeBillDataResponse(response.data, billId);
};

/**
 * Get list of available hospitals
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export const getHospitals = async () => {
    const response = await apiClient.get('/tieups');
    return normalizeHospitalsResponse(response.data);
};

/**
 * Reload hospital tie-up data (admin function)
 * @returns {Promise<{message: string}>}
 */
export const reloadTieups = async () => {
    const response = await apiClient.post('/tieups/reload');
    return response.data;
};

/**
 * Health check endpoint
 * @returns {Promise<{status: string}>}
 */
export const healthCheck = async () => {
    const response = await apiClient.get('/health');
    return response.data;
};

export default {
    uploadBill,
    getBillStatus,
    getBillData,
    getHospitals,
    reloadTieups,
    healthCheck,
};
