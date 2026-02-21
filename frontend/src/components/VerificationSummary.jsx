import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Chip } from '@mui/material';
import { CheckCircle, Error, Warning, Assessment } from '@mui/icons-material';

/**
 * Verification Summary Component
 * Displays overall summary with counts of allowed/overcharged/needs review items
 */
const VerificationSummary = ({ summary }) => {
    const { totalItems, allowedCount, overchargedCount, needsReviewCount } = summary;

    const summaryItems = [
        {
            label: 'Total Items',
            value: totalItems,
            icon: <Assessment />,
            color: 'primary',
            bgColor: 'primary.lighter',
        },
        {
            label: 'Allowed',
            value: allowedCount,
            icon: <CheckCircle />,
            color: 'success',
            bgColor: 'success.lighter',
        },
        {
            label: 'Overcharged',
            value: overchargedCount,
            icon: <Error />,
            color: 'error',
            bgColor: 'error.lighter',
        },
        {
            label: 'Needs Review',
            value: needsReviewCount,
            icon: <Warning />,
            color: 'warning',
            bgColor: 'warning.lighter',
        },
    ];

    return (
        <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Verification Summary
                </Typography>

                <Grid container spacing={2}>
                    {summaryItems.map((item, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Box
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    backgroundColor: item.bgColor,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    textAlign: 'center',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        color: `${item.color}.main`,
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {item.icon}
                                </Box>
                                <Typography
                                    variant="h4"
                                    sx={{
                                        fontWeight: 700,
                                        color: `${item.color}.main`,
                                        mb: 0.5,
                                    }}
                                >
                                    {item.value}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {item.label}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>
            </CardContent>
        </Card>
    );
};

export default VerificationSummary;
