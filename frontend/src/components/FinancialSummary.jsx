import React from 'react';
import { Card, CardContent, Typography, Grid, Box, Divider } from '@mui/material';
import { AccountBalance, TrendingUp, TrendingDown } from '@mui/icons-material';
import { formatCurrency } from '../utils/verificationParser';

/**
 * Financial Summary Component
 * Displays total billed, allowed, and extra amounts
 */
const FinancialSummary = ({ financial }) => {
    const { totalBilled, totalAllowed, totalExtra } = financial;

    const financialItems = [
        {
            label: 'Total Billed',
            value: totalBilled,
            icon: <AccountBalance />,
            color: 'info',
            bgColor: 'info.lighter',
        },
        {
            label: 'Total Allowed',
            value: totalAllowed,
            icon: <TrendingUp />,
            color: 'success',
            bgColor: 'success.lighter',
        },
        {
            label: 'Total Extra',
            value: totalExtra,
            icon: <TrendingDown />,
            color: 'error',
            bgColor: 'error.lighter',
        },
    ];

    return (
        <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                    Financial Summary
                </Typography>

                <Grid container spacing={3}>
                    {financialItems.map((item, index) => (
                        <Grid item xs={12} md={4} key={index}>
                            <Box
                                sx={{
                                    p: 3,
                                    borderRadius: 2,
                                    backgroundColor: item.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                    },
                                }}
                            >
                                <Box
                                    sx={{
                                        color: `${item.color}.main`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '2rem',
                                    }}
                                >
                                    {item.icon}
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                        {item.label}
                                    </Typography>
                                    <Typography
                                        variant="h5"
                                        sx={{
                                            fontWeight: 700,
                                            color: `${item.color}.main`,
                                        }}
                                    >
                                        {formatCurrency(item.value)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Savings Indicator */}
                {totalExtra > 0 && (
                    <>
                        <Divider sx={{ my: 3 }} />
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: 'error.lighter',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body1" color="error.main" sx={{ fontWeight: 600 }}>
                                ⚠️ Potential Overcharge Detected: {formatCurrency(totalExtra)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                Review the overcharged items below for details
                            </Typography>
                        </Box>
                    </>
                )}
            </CardContent>
        </Card>
    );
};

export default FinancialSummary;
