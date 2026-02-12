import React from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Checkbox,
    Collapse,
    FormControlLabel,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { FilterAlt } from '@mui/icons-material';
import { DECISIONS } from '../../utils/verificationResultParser';

const ResultFilters = ({
    expanded,
    onToggleExpanded,
    searchText,
    onSearchTextChange,
    selectedDecisions,
    onDecisionToggle,
    onClearFilters,
}) => (
    <Card elevation={1}>
        <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Button startIcon={<FilterAlt />} variant="outlined" onClick={onToggleExpanded}>
                    {expanded ? 'Hide Filters' : 'Show Filters'}
                </Button>
                <Button variant="text" color="secondary" onClick={onClearFilters}>
                    Clear
                </Button>
            </Box>

            <Collapse in={expanded}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Search by item name"
                        placeholder="Type bill item, best match or reason"
                        value={searchText}
                        onChange={(event) => onSearchTextChange(event.target.value)}
                        fullWidth
                    />

                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Decision Filter
                        </Typography>
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedDecisions.includes(DECISIONS.ALLOWED)}
                                        onChange={() => onDecisionToggle(DECISIONS.ALLOWED)}
                                    />
                                }
                                label="Allowed"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedDecisions.includes(DECISIONS.OVERCHARGED)}
                                        onChange={() => onDecisionToggle(DECISIONS.OVERCHARGED)}
                                    />
                                }
                                label="Overcharged"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={selectedDecisions.includes(DECISIONS.NEEDS_REVIEW)}
                                        onChange={() => onDecisionToggle(DECISIONS.NEEDS_REVIEW)}
                                    />
                                }
                                label="Needs Review"
                            />
                        </Stack>
                    </Box>
                </Stack>
            </Collapse>
        </CardContent>
    </Card>
);

export default React.memo(ResultFilters);
