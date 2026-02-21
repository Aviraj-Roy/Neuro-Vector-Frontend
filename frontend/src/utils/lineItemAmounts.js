const toFiniteNumber = (value) => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const roundToTwo = (value) => {
    const numeric = toFiniteNumber(value);
    if (numeric === null) return null;
    return Math.round((numeric + Number.EPSILON) * 100) / 100;
};

const areNumbersEqual = (a, b) => {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    return Math.abs(a - b) < 1e-9;
};

export const deriveLineItemAmounts = (item) => {
    const qty = toFiniteNumber(item?.qty ?? item?.quantity);
    const rate = toFiniteNumber(item?.rate ?? item?.unit_rate);
    const originalFinalAmount = toFiniteNumber(item?.final_amount ?? item?.finalAmount ?? item?.billed_amount);
    const computedAmount = toFiniteNumber(item?.computed_amount)
        ?? ((qty !== null && rate !== null) ? roundToTwo(qty * rate) : null);

    return {
        qty,
        rate,
        originalFinalAmount,
        computedAmount,
    };
};

export const hasQtyRateOverride = (item) => {
    const currentQty = toFiniteNumber(item?.qty);
    const currentRate = toFiniteNumber(item?.rate);
    const originalQty = toFiniteNumber(item?.originalQty ?? item?.qty);
    const originalRate = toFiniteNumber(item?.originalRate ?? item?.rate);
    return !areNumbersEqual(currentQty, originalQty) || !areNumbersEqual(currentRate, originalRate);
};

export const getDisplayedBilledAmount = (item) => {
    const qty = toFiniteNumber(item?.qty);
    const rate = toFiniteNumber(item?.rate);
    if (hasQtyRateOverride(item) && qty !== null && rate !== null) {
        return roundToTwo(qty * rate);
    }
    return toFiniteNumber(item?.originalFinalAmount ?? item?.originalBilledAmount ?? item?.billedAmount);
};

export { toFiniteNumber, roundToTwo };
