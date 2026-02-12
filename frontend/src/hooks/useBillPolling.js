import { useState, useEffect, useRef, useCallback } from 'react';
import { getUploadStatus } from '../services/api';
import { isTerminalStage } from '../utils/helpers';
import { POLLING_INTERVAL, MAX_POLLING_ATTEMPTS } from '../constants/stages';

/**
 * Custom hook for polling bill status
 * @param {string} uploadId - Upload ID to poll
 * @param {boolean} enabled - Whether polling is enabled
 * @param {Object|null} initialStatus - Initial status from /upload response
 * @returns {Object} { status, loading, error, stopPolling }
 */
export const useBillPolling = (uploadId, enabled = true, initialStatus = null) => {
    const [status, setStatus] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);

    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        setStatus(initialStatus);
        setAttempts(0);
    }, [uploadId, initialStatus]);

    // Function to fetch status
    const fetchStatus = useCallback(async () => {
        if (!uploadId || !enabled) return;

        try {
            setLoading(true);
            setError(null);

            const data = await getUploadStatus(uploadId);

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setStatus(data);
                setAttempts((prev) => prev + 1);

                // Stop polling if terminal stage reached
                if (isTerminalStage(data.status)) {
                    stopPolling();
                }
            }
        } catch (err) {
            if (isMountedRef.current) {
                console.error('Error fetching bill status:', err);
                setError(
                    err.response?.data?.message
                    || err.response?.data?.detail
                    || err.message
                    || 'Failed to fetch status'
                );
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, [uploadId, enabled]);

    // Function to stop polling
    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('[Polling] Stopped');
        }
    }, []);

    // Start polling when enabled and uploadId is available
    useEffect(() => {
        if (!uploadId || !enabled) {
            stopPolling();
            return;
        }

        // Initial fetch
        fetchStatus();

        // Set up polling interval
        console.log(`[Polling] Started for upload_id: ${uploadId}`);
        intervalRef.current = setInterval(() => {
            fetchStatus();
        }, POLLING_INTERVAL);

        // Cleanup function
        return () => {
            stopPolling();
        };
    }, [uploadId, enabled, fetchStatus, stopPolling]);

    // Stop polling after max attempts
    useEffect(() => {
        if (attempts >= MAX_POLLING_ATTEMPTS) {
            console.warn('[Polling] Max attempts reached');
            stopPolling();
            setError('Polling timeout: Maximum attempts reached');
        }
    }, [attempts, stopPolling]);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        status,
        loading,
        error,
        attempts,
        stopPolling,
    };
};

export default useBillPolling;
