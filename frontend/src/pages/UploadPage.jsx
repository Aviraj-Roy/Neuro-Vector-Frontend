import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
    Chip,
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { uploadBill, getHospitals } from '../services/api';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../constants/stages';
import { formatFileSize, isValidFileType } from '../utils/helpers';

/**
 * Upload Page Component
 * Handles file upload and hospital selection
 */
const UploadPage = () => {
    const navigate = useNavigate();

    // State management
    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState('');
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(true);
    const [error, setError] = useState(null);
    const [fileError, setFileError] = useState(null);

    // Fetch hospitals on component mount
    useEffect(() => {
        const fetchHospitals = async () => {
            try {
                setLoadingHospitals(true);
                const data = await getHospitals();
                setHospitals(data);
            } catch (err) {
                console.error('Error fetching hospitals:', err);
                setError('Failed to load hospitals. Please refresh the page.');
            } finally {
                setLoadingHospitals(false);
            }
        };

        fetchHospitals();
    }, []);

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setFileError(null);

        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Validate file type
        if (!isValidFileType(file, ACCEPTED_FILE_TYPES)) {
            setFileError('Invalid file type. Please upload a PDF or image file (JPG, PNG, WEBP).');
            setSelectedFile(null);
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setFileError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)}. Please upload a smaller file.`);
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    // Handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        // Validation
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }

        if (!selectedHospital) {
            setError('Please select a hospital.');
            return;
        }

        try {
            setLoading(true);

            // Upload bill
            const response = await uploadBill(selectedFile, selectedHospital);
            console.log('Upload response:', response);

            // Navigate to status page with billId
            if (response.billId) {
                navigate(`/status/${response.billId}`);
            } else {
                setError('Upload succeeded but no billId was returned.');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.message || err.message || 'Failed to upload bill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Upload Medical Bill
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Upload your medical bill for AI-powered verification
                    </Typography>
                </Box>

                {/* Error Alert */}
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {/* Hospital Selection */}
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="hospital-select-label">Select Hospital</InputLabel>
                        <Select
                            labelId="hospital-select-label"
                            id="hospital-select"
                            value={selectedHospital}
                            label="Select Hospital"
                            onChange={(e) => setSelectedHospital(e.target.value)}
                            disabled={loadingHospitals || loading}
                        >
                            {loadingHospitals ? (
                                <MenuItem disabled>
                                    <CircularProgress size={20} sx={{ mr: 1 }} />
                                    Loading hospitals...
                                </MenuItem>
                            ) : hospitals.length === 0 ? (
                                <MenuItem disabled>No hospitals available</MenuItem>
                            ) : (
                                hospitals.map((hospital) => (
                                    <MenuItem key={hospital.id} value={hospital.name}>
                                        {hospital.name}
                                    </MenuItem>
                                ))
                            )}
                        </Select>
                    </FormControl>

                    {/* File Upload */}
                    <Box
                        sx={{
                            border: '2px dashed',
                            borderColor: fileError ? 'error.main' : selectedFile ? 'success.main' : 'grey.400',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            backgroundColor: fileError ? 'error.lighter' : selectedFile ? 'success.lighter' : 'grey.50',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            '&:hover': {
                                borderColor: fileError ? 'error.dark' : selectedFile ? 'success.dark' : 'primary.main',
                                backgroundColor: fileError ? 'error.light' : selectedFile ? 'success.light' : 'grey.100',
                            },
                        }}
                        onClick={() => document.getElementById('file-input').click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept={Object.keys(ACCEPTED_FILE_TYPES).join(',')}
                            onChange={handleFileChange}
                            style={{ display: 'none' }}
                            disabled={loading}
                        />

                        {selectedFile ? (
                            <Box>
                                <Description sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    {selectedFile.name}
                                </Typography>
                                <Chip label={formatFileSize(selectedFile.size)} color="success" size="small" />
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                    Click to change file
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                <CloudUpload sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                                <Typography variant="h6" gutterBottom>
                                    Click to upload or drag and drop
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    PDF, JPG, PNG, or WEBP (max {formatFileSize(MAX_FILE_SIZE)})
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* File Error */}
                    {fileError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {fileError}
                        </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        fullWidth
                        disabled={!selectedFile || !selectedHospital || loading}
                        sx={{
                            mt: 3,
                            py: 1.5,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                        }}
                    >
                        {loading ? (
                            <>
                                <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                                Uploading...
                            </>
                        ) : (
                            'Upload and Verify'
                        )}
                    </Button>
                </form>

                {/* Info Box */}
                <Box sx={{ mt: 4, p: 2, backgroundColor: 'info.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>Note:</strong> After uploading, you'll be redirected to the status page where you can track
                        the verification progress in real-time.
                    </Typography>
                </Box>
            </Paper>
        </Container>
    );
};

export default UploadPage;
