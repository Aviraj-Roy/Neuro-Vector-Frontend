// Processing stages in order
export const STAGES = {
    UPLOADED: 'UPLOADED',
    EXTRACTING: 'EXTRACTING',
    EXTRACTED: 'EXTRACTED',
    STORED: 'STORED',
    VERIFYING: 'VERIFYING',
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
    [STAGES.EXTRACTING]: {
        label: 'Extracting',
        description: 'Extracting text from document',
        color: 'info',
        icon: 'FindInPage',
    },
    [STAGES.EXTRACTED]: {
        label: 'Extracted',
        description: 'Text extraction completed',
        color: 'info',
        icon: 'Description',
    },
    [STAGES.STORED]: {
        label: 'Stored',
        description: 'Data stored in database',
        color: 'info',
        icon: 'Storage',
    },
    [STAGES.VERIFYING]: {
        label: 'Verifying',
        description: 'Verifying against hospital rates',
        color: 'warning',
        icon: 'FactCheck',
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
    STAGES.EXTRACTING,
    STAGES.EXTRACTED,
    STAGES.STORED,
    STAGES.VERIFYING,
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
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
