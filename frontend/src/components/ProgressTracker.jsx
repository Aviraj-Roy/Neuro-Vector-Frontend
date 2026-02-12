import React from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Typography,
    LinearProgress,
    Paper,
    Alert,
} from '@mui/material';
import {
    CloudUpload,
    FindInPage,
    CheckCircle,
    Error,
} from '@mui/icons-material';
import { STAGE_ORDER, STAGES, STAGE_CONFIG } from '../constants/stages';
import { calculateProgress, getStageIndex } from '../utils/helpers';

// Icon mapping
const ICON_MAP = {
    CloudUpload,
    FindInPage,
    CheckCircle,
    Error,
};

/**
 * Progress Tracker Component
 * Displays visual stepper/timeline of processing stages
 */
const ProgressTracker = ({ currentStage, statusData, error }) => {
    const currentStageIndex = getStageIndex(currentStage);
    const progress = calculateProgress(currentStage);

    // Get icon component for a stage
    const getStageIcon = (stage) => {
        const iconName = STAGE_CONFIG[stage]?.icon;
        const IconComponent = ICON_MAP[iconName];
        return IconComponent ? <IconComponent /> : null;
    };

    // Determine if a stage is completed
    const isStageCompleted = (stage) => {
        const stageIndex = getStageIndex(stage);
        return stageIndex < currentStageIndex || currentStage === STAGES.COMPLETED;
    };

    // Determine if a stage is active
    const isStageActive = (stage) => {
        return stage === currentStage;
    };

    return (
        <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                Processing Status
            </Typography>

            {/* Overall Progress Bar */}
            <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Overall Progress
                    </Typography>
                    <Typography variant="body2" color="text.secondary" fontWeight={600}>
                        {progress}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                            backgroundColor:
                                currentStage === STAGES.FAILED
                                    ? 'error.main'
                                    : currentStage === STAGES.COMPLETED
                                        ? 'success.main'
                                        : 'primary.main',
                        },
                    }}
                />
            </Box>

            {/* Error Alert */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Status Message */}
            {statusData?.message && (
                <Alert severity="info" sx={{ mb: 3 }}>
                    {statusData.message}
                </Alert>
            )}

            {/* Stepper */}
            <Stepper
                activeStep={currentStageIndex}
                orientation="vertical"
                sx={{
                    '& .MuiStepLabel-root': {
                        cursor: 'default',
                    },
                }}
            >
                {STAGE_ORDER.map((stage, index) => {
                    const config = STAGE_CONFIG[stage];
                    const isCompleted = isStageCompleted(stage);
                    const isActive = isStageActive(stage);
                    const isFailed = currentStage === STAGES.FAILED && isActive;

                    return (
                        <Step key={stage} completed={isCompleted} active={isActive}>
                            <StepLabel
                                StepIconComponent={() => (
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: isFailed
                                                ? 'error.main'
                                                : isCompleted
                                                    ? 'success.main'
                                                    : isActive
                                                        ? 'primary.main'
                                                        : 'grey.300',
                                            color: 'white',
                                            transition: 'all 0.3s ease',
                                        }}
                                    >
                                        {getStageIcon(stage)}
                                    </Box>
                                )}
                                sx={{
                                    '& .MuiStepLabel-label': {
                                        fontSize: '1rem',
                                        fontWeight: isActive ? 600 : 400,
                                        color: isFailed
                                            ? 'error.main'
                                            : isActive
                                                ? 'primary.main'
                                                : 'text.secondary',
                                    },
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={isActive ? 600 : 400}>
                                    {config.label}
                                </Typography>
                            </StepLabel>
                            <StepContent>
                                <Typography variant="body2" color="text.secondary">
                                    {config.description}
                                </Typography>
                                {isActive && statusData?.progress !== undefined && (
                                    <Box sx={{ mt: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={statusData.progress}
                                            sx={{ height: 4, borderRadius: 2 }}
                                        />
                                    </Box>
                                )}
                            </StepContent>
                        </Step>
                    );
                })}
            </Stepper>

            {/* Completion Message */}
            {currentStage === STAGES.COMPLETED && (
                <Alert severity="success" sx={{ mt: 3 }}>
                    <Typography variant="body1" fontWeight={600}>
                        Verification completed successfully!
                    </Typography>
                    <Typography variant="body2">
                        You can now view the detailed verification results.
                    </Typography>
                </Alert>
            )}

            {/* Failure Message */}
            {currentStage === STAGES.FAILED && (
                <Alert severity="error" sx={{ mt: 3 }}>
                    <Typography variant="body1" fontWeight={600}>
                        Processing failed
                    </Typography>
                    <Typography variant="body2">
                        {statusData?.message || 'An error occurred during processing. Please try again.'}
                    </Typography>
                </Alert>
            )}
        </Paper>
    );
};

export default ProgressTracker;
