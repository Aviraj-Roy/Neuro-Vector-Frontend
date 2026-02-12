import { useState, useEffect, useRef, useCallback } from 'react';
import { getAllBills } from '../services/api';
import { TERMINAL_STAGES, POLLING_INTERVAL } from '../constants/stages';

/**
 * Check if a stage is terminal (no more processing)
 * @param {string} stage - Stage to check
 * @returns {boolean}
 */
const isTerminalStage = (stage) => {
    return TERMINAL_STAGES.includes(String(stage).toUpperCase());
};

/**
 * Check if any bill in the list is in an active (non-terminal) state
 * @param {Array} bills - Array of bill objects
 * @returns {boolean}
 */
const hasActiveBills = (bills) => {
    if (!Array.isArray(bills) || bills.length === 0) return false;
    return bills.some(bill => !isTerminalStage(bill.stage));
};

/**
 * Custom hook for polling all bills
 * Automatically polls /bills endpoint every 3 seconds
 * Stops polling when all bills are in terminal states
 * 
 * @returns {Object} { bills, loading, error, refetch }
 */
export const useAllBillsPolling = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const intervalRef = useRef(null);
    const isMountedRef = useRef(true);

    // Function to fetch all bills
    const fetchBills = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getAllBills();

            // Only update state if component is still mounted
            if (isMountedRef.current) {
                setBills(data);

                // Stop polling if no active bills
                if (!hasActiveBills(data)) {
                    stopPolling();
                }
            }
        } catch (err) {
            if (isMountedRef.current) {
                console.error('Error fetching bills:', err);
                setError(
                    err.response?.data?.message
                    || err.response?.data?.detail
                    || err.message
                    || 'Failed to fetch bills'
                );
            }
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
            }
        }
    }, []);

    // Function to stop polling
    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            console.log('[Bills Polling] Stopped - all bills in terminal state');
        }
    }, []);

    // Start polling on mount
    useEffect(() => {
        // Initial fetch
        fetchBills();

        // Set up polling interval
        console.log('[Bills Polling] Started');
        intervalRef.current = setInterval(() => {
            fetchBills();
        }, POLLING_INTERVAL);

        // Cleanup function
        return () => {
            stopPolling();
        };
    }, [fetchBills, stopPolling]);

    // Track component mount status
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return {
        bills,
        loading,
        error,
        refetch: fetchBills,
    };
};

export default useAllBillsPolling;
