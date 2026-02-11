import { STAGE_ORDER, STAGES } from '../constants/stages';

/**
 * Calculate progress percentage based on current stage
 * @param {string} currentStage - Current processing stage
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgress = (currentStage) => {
    if (currentStage === STAGES.FAILED) return 0;
    if (currentStage === STAGES.COMPLETED) return 100;

    const currentIndex = STAGE_ORDER.indexOf(currentStage);
    if (currentIndex === -1) return 0;

    // Calculate percentage based on stage position
    return Math.round(((currentIndex + 1) / STAGE_ORDER.length) * 100);
};

/**
 * Get the index of a stage in the processing order
 * @param {string} stage - Stage name
 * @returns {number} Stage index (-1 if not found)
 */
export const getStageIndex = (stage) => {
    return STAGE_ORDER.indexOf(stage);
};

/**
 * Check if a stage is terminal (processing complete)
 * @param {string} stage - Stage name
 * @returns {boolean} True if stage is terminal
 */
export const isTerminalStage = (stage) => {
    return stage === STAGES.COMPLETED || stage === STAGES.FAILED;
};

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Object} acceptedTypes - Accepted MIME types
 * @returns {boolean} True if file type is valid
 */
export const isValidFileType = (file, acceptedTypes) => {
    return Object.keys(acceptedTypes).includes(file.type);
};

/**
 * Format timestamp to readable date/time
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted date/time
 */
export const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Generate a unique ID for local tracking
 * @returns {string} Unique ID
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
