import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    TextField,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Collapse,
    IconButton,
    Chip,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess, Clear } from '@mui/icons-material';

/**
 * Verification Filters Component
 * Client-side filtering by decision type and item name search
 */
const VerificationFilters = ({ filters, onFiltersChange }) => {
    const [expanded, setExpanded] = useState(false);

    const handleDecisionToggle = (decision) => {
        const newDecisions = filters.decisions.includes(decision)
            ? filters.decisions.filter(d => d !== decision)
            : [...filters.decisions, decision];

        onFiltersChange({ ...filters, decisions: newDecisions });
    };

    const handleSearchChange = (event) => {
        onFiltersChange({ ...filters, searchTerm: event.target.value });
    };

    const handleClearFilters = () => {
        onFiltersChange({ decisions: [], searchTerm: '' });
    };

    const hasActiveFilters = filters.decisions.length > 0 || filters.searchTerm.trim() !== '';

    return (
        <Card elevation={2} sx={{ mb: 3 }}>
            <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FilterList color="primary" />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Filters
                        </Typography>
                        {hasActiveFilters && (
                            <Chip
                                label={`${filters.decisions.length + (filters.searchTerm ? 1 : 0)} active`}
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                            />
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {hasActiveFilters && (
                            <IconButton
                                size="small"
                                onClick={handleClearFilters}
                                title="Clear all filters"
                            >
                                <Clear />
                            </IconButton>
                        )}
                        <IconButton
                            size="small"
                            onClick={() => setExpanded(!expanded)}
                            title={expanded ? 'Collapse filters' : 'Expand filters'}
                        >
                            {expanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <Box sx={{ mt: 3 }}>
                        {/* Search by item name */}
                        <TextField
                            fullWidth
                            label="Search by item name"
                            placeholder="Enter bill item or best match name..."
                            value={filters.searchTerm}
                            onChange={handleSearchChange}
                            variant="outlined"
                            size="small"
                            sx={{ mb: 3 }}
                        />

                        {/* Decision type filters */}
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                            Filter by Decision
                        </Typography>
                        <FormGroup row>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filters.decisions.includes('ALLOWED')}
                                        onChange={() => handleDecisionToggle('ALLOWED')}
                                        sx={{
                                            color: 'success.main',
                                            '&.Mui-checked': {
                                                color: 'success.main',
                                            },
                                        }}
                                    />
                                }
                                label="Allowed"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filters.decisions.includes('OVERCHARGED')}
                                        onChange={() => handleDecisionToggle('OVERCHARGED')}
                                        sx={{
                                            color: 'error.main',
                                            '&.Mui-checked': {
                                                color: 'error.main',
                                            },
                                        }}
                                    />
                                }
                                label="Overcharged"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={filters.decisions.includes('NEEDS_REVIEW')}
                                        onChange={() => handleDecisionToggle('NEEDS_REVIEW')}
                                        sx={{
                                            color: 'warning.main',
                                            '&.Mui-checked': {
                                                color: 'warning.main',
                                            },
                                        }}
                                    />
                                }
                                label="Needs Review"
                            />
                        </FormGroup>
                    </Box>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default VerificationFilters;
