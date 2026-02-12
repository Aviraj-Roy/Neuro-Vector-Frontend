import React from 'react';
import { Chip } from '@mui/material';
import {
    CheckCircle,
    Error,
    CloudUpload,
    FindInPage,
    Description,
    Storage,
    FactCheck,
    HourglassEmpty,
} from '@mui/icons-material';
import { STAGES } from '../constants/stages';

/**
 * Status Badge Component
 * Displays a colored badge with icon for bill processing stages
 * 
 * @param {Object} props
 * @param {string} props.stage - Current processing stage
 * @param {string} props.size - Badge size ('small' | 'medium')
 */
const StatusBadge = ({ stage, size = 'small' }) => {
    const getStageConfig = (stage) => {
        const normalizedStage = String(stage).toUpperCase();

        switch (normalizedStage) {
            case STAGES.COMPLETED:
                return {
                    label: 'Completed',
                    color: 'success',
                    icon: <CheckCircle sx={{ fontSize: 16 }} />,
                };
            case STAGES.FAILED:
                return {
                    label: 'Failed',
                    color: 'error',
                    icon: <Error sx={{ fontSize: 16 }} />,
                };
            case STAGES.UPLOADED:
                return {
                    label: 'Uploaded',
                    color: 'info',
                    icon: <CloudUpload sx={{ fontSize: 16 }} />,
                };
            case STAGES.EXTRACTING:
                return {
                    label: 'Extracting',
                    color: 'info',
                    icon: <FindInPage sx={{ fontSize: 16 }} />,
                };
            case STAGES.EXTRACTED:
                return {
                    label: 'Extracted',
                    color: 'info',
                    icon: <Description sx={{ fontSize: 16 }} />,
                };
            case STAGES.STORED:
                return {
                    label: 'Stored',
                    color: 'info',
                    icon: <Storage sx={{ fontSize: 16 }} />,
                };
            case STAGES.VERIFYING:
                return {
                    label: 'Verifying',
                    color: 'warning',
                    icon: <FactCheck sx={{ fontSize: 16 }} />,
                };
            default:
                return {
                    label: stage || 'Unknown',
                    color: 'default',
                    icon: <HourglassEmpty sx={{ fontSize: 16 }} />,
                };
        }
    };

    const config = getStageConfig(stage);

    return (
        <Chip
            label={config.label}
            color={config.color}
            size={size}
            icon={config.icon}
            sx={{
                fontWeight: 600,
                fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                '& .MuiChip-icon': {
                    marginLeft: '8px',
                },
            }}
        />
    );
};

export default StatusBadge;
