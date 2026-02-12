import { useState, useEffect, useRef, useCallback } from 'react';
import { getBillStatus } from '../services/api';
import { isTerminalStage } from '../utils/helpers';
import { POLLING_INTERVAL, MAX_POLLING_ATTEMPTS } from '../constants/stages';

/**
 * Custom hook for polling bill status
 * @param {string} billId - Bill ID to poll
 * @param {boolean} enabled - Whether polling is enabled
 * @returns {Object} { status, loading, error, stopPolling }
 */
export const useBillPolling = (billId, enabled = true) => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [attempts, setAttempts] = useState(0);

    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Function to fetch status
    const fetchStatus = useCallback(async () => {
        if (!billId || !enabled) return;

        try {
            setLoading(true);
            setError(null);

            const data = await getBillStatus(billId);

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setStatus(data);
                setAttempts((prev) => prev + 1);

                // Stop polling if terminal stage reached
                if (isTerminalStage(data.stage)) {
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
    }, [billId, enabled]);

    // Function to stop polling
    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('[Polling] Stopped');
        }
    }, []);

    // Start polling when enabled and billId is available
    useEffect(() => {
        if (!billId || !enabled) {
            stopPolling();
            return;
        }

        // Initial fetch
        fetchStatus();

        // Set up polling interval
        console.log(`[Polling] Started for billId: ${billId}`);
        intervalRef.current = setInterval(() => {
            fetchStatus();
        }, POLLING_INTERVAL);

        // Cleanup function
        return () => {
            stopPolling();
        };
    }, [billId, enabled, fetchStatus, stopPolling]);

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
