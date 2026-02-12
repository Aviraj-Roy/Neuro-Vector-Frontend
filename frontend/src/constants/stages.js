// Backend lifecycle statuses
export const STAGES = {
    UPLOADED: 'UPLOADED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
};

// Stage display configuration
export const STAGE_CONFIG = {
    [STAGES.UPLOADED]: {
        label: 'Uploaded',
        description: 'Bill uploaded successfully',
        color: 'primary',
        icon: 'CloudUpload',
    },
    [STAGES.PROCESSING]: {
        label: 'Processing',
        description: 'Bill is being processed',
        color: 'info',
        icon: 'FindInPage',
    },
    [STAGES.COMPLETED]: {
        label: 'Completed',
        description: 'Verification completed successfully',
        color: 'success',
        icon: 'CheckCircle',
    },
    [STAGES.FAILED]: {
        label: 'Failed',
        description: 'Processing failed',
        color: 'error',
        icon: 'Error',
    },
};

// Ordered list of stages for progress tracking
export const STAGE_ORDER = [
    STAGES.UPLOADED,
    STAGES.PROCESSING,
    STAGES.COMPLETED,
];

// Terminal stages (stop polling when reached)
export const TERMINAL_STAGES = [STAGES.COMPLETED, STAGES.FAILED];

// Polling configuration
export const POLLING_INTERVAL = 3000; // 3 seconds
export const MAX_POLLING_ATTEMPTS = 200; // 10 minutes max (200 * 3s)

// File upload configuration
export const ACCEPTED_FILE_TYPES = {
    'application/pdf': ['.pdf'],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
