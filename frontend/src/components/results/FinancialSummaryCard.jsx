import React from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';

const formatCurrency = (value) => {
    const amount = Number(value || 0);
    return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const cardCellStyle = {
    p: 2,
    borderRadius: 2,
    backgroundColor: 'grey.100',
    height: '100%',
};

const FinancialSummaryCard = ({ financial }) => (
    <Card elevation={2}>
        <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Financial Summary
            </Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Box sx={cardCellStyle}>
                        <Typography variant="body2" color="text.secondary">
                            Total Billed
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {formatCurrency(financial.totalBilled)}
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={cardCellStyle}>
                        <Typography variant="body2" color="text.secondary">
                            Total Amount to be Paid
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>
                            {formatCurrency(financial.totalAmountToBePaid ?? financial.totalAllowed)}
                        </Typography>
                    </Box>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default React.memo(FinancialSummaryCard);
