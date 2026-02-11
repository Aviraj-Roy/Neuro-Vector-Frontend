import axios from 'axios';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
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
 * Upload a medical bill file
 * @param {File} file - The bill file (PDF/Image)
 * @param {string} hospitalName - Selected hospital name
 * @returns {Promise<{billId: string, status: string}>}
 */
export const uploadBill = async (file, hospitalName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital', hospitalName);

    const response = await apiClient.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

/**
 * Get bill status by billId
 * @param {string} billId - The unique bill identifier
 * @returns {Promise<{billId: string, stage: string, progress?: number, message?: string}>}
 */
export const getBillStatus = async (billId) => {
    const response = await apiClient.get(`/status/${billId}`);
    return response.data;
};

/**
 * Get complete bill data and verification results
 * @param {string} billId - The unique bill identifier
 * @returns {Promise<Object>} Complete bill data with verification results
 */
export const getBillData = async (billId) => {
    const response = await apiClient.get(`/bill/${billId}`);
    return response.data;
};

/**
 * Get list of available hospitals
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export const getHospitals = async () => {
    const response = await apiClient.get('/tieups');
    return response.data;
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
