import React from 'react';
import { Card, CardContent, Grid, Typography, Chip, Box } from '@mui/material';
import { CheckCircle, Error, WarningAmber, ListAlt } from '@mui/icons-material';

const metricBoxStyle = {
    p: 2,
    borderRadius: 2,
    backgroundColor: 'grey.100',
    height: '100%',
};

const VerificationSummaryCard = ({ summary }) => (
    <Card elevation={2}>
        <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Summary
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={metricBoxStyle}>
                        <Chip icon={<ListAlt />} label="Total Items" variant="outlined" sx={{ mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            {summary.totalItems}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={metricBoxStyle}>
                        <Chip color="success" icon={<CheckCircle />} label="Allowed" sx={{ mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {summary.allowedCount}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={metricBoxStyle}>
                        <Chip color="error" icon={<Error />} label="Overcharged" sx={{ mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                            {summary.overchargedCount}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Box sx={metricBoxStyle}>
                        <Chip color="warning" icon={<WarningAmber />} label="Needs Review" sx={{ mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                            {summary.needsReviewCount}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default React.memo(VerificationSummaryCard);
