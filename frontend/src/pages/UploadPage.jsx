import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Typography,
} from '@mui/material';
import { CloudUpload, Description } from '@mui/icons-material';
import { uploadBill } from '../services/api';
import { ACCEPTED_FILE_TYPES, MAX_FILE_SIZE } from '../constants/stages';
import { formatFileSize, isValidFileType } from '../utils/helpers';

const HOSPITALS = [
    { id: 'apollo', name: 'Apollo Hospital' },
    { id: 'fortis', name: 'Fortis Hospital' },
    { id: 'manipal', name: 'Manipal Hospital' },
    { id: 'max', name: 'Max Healthcare' },
    { id: 'medanta', name: 'Medanta Hospital' },
    { id: 'narayana', name: 'Narayana Hospital' },
];

const generateClientRequestId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const UploadPage = () => {
    const navigate = useNavigate();
    const uploadInFlightRef = useRef(false);
    const uploadSessionRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [selectedHospital, setSelectedHospital] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fileError, setFileError] = useState(null);

    const resetUploadSession = () => {
        uploadSessionRef.current = null;
    };

    const handleHospitalChange = (event) => {
        setSelectedHospital(event.target.value);
        resetUploadSession();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setFileError(null);

        if (!file) {
            setSelectedFile(null);
            resetUploadSession();
            return;
        }

        if (!isValidFileType(file, ACCEPTED_FILE_TYPES)) {
            setFileError('Invalid file type. Please upload a PDF file.');
            setSelectedFile(null);
            resetUploadSession();
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            setFileError(`File size exceeds ${formatFileSize(MAX_FILE_SIZE)}. Please upload a smaller file.`);
            setSelectedFile(null);
            resetUploadSession();
            return;
        }

        setSelectedFile(file);
        resetUploadSession();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        if (uploadInFlightRef.current) {
            return;
        }

        if (!selectedFile) {
            setError('Please select a PDF file to upload.');
            return;
        }

        if (!selectedHospital) {
            setError('Please select a hospital.');
            return;
        }

        const uploadFingerprint = `${selectedFile.name}:${selectedFile.size}:${selectedFile.lastModified}:${selectedHospital}`;
        const currentSession = uploadSessionRef.current;
        const clientRequestId = currentSession?.fingerprint === uploadFingerprint
            ? currentSession.clientRequestId
            : generateClientRequestId();

        if (!currentSession || currentSession.fingerprint !== uploadFingerprint) {
            uploadSessionRef.current = {
                fingerprint: uploadFingerprint,
                clientRequestId,
            };
        }

        try {
            uploadInFlightRef.current = true;
            setLoading(true);

            const response = await uploadBill(selectedFile, selectedHospital, clientRequestId);
            const uploadId = response?.upload_id;

            if (uploadId) {
                navigate('/dashboard');
                return;
            }

            setError('Upload succeeded but no upload_id was returned.');
        } catch (err) {
            const backendData = err.response?.data;
            const duplicateUploadId = backendData?.upload_id;

            if (duplicateUploadId) {
                navigate('/dashboard');
                return;
            }

            setError(
                backendData?.message
                || backendData?.detail
                || err.message
                || 'Failed to upload bill. Please try again.'
            );
        } finally {
            uploadInFlightRef.current = false;
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
                        Upload Medical Bill
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Upload your medical bill PDF for AI-powered verification
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel id="hospital-select-label">Select Hospital</InputLabel>
                        <Select
                            labelId="hospital-select-label"
                            id="hospital-select"
                            value={selectedHospital}
                            label="Select Hospital"
                            onChange={handleHospitalChange}
                            disabled={loading}
                        >
                            {HOSPITALS.map((hospital) => (
                                <MenuItem key={hospital.id} value={hospital.name}>
                                    {hospital.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

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
                                    Click to upload
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    PDF only (max {formatFileSize(MAX_FILE_SIZE)})
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {fileError && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                            {fileError}
                        </Alert>
                    )}

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
            </Paper>
        </Container>
    );
};

export default UploadPage;
