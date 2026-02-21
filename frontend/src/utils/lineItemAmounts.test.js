import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveLineItemAmounts, getDisplayedBilledAmount } from './lineItemAmounts.js';

test('Billed Amount prefers final_amount initially and recalculates after qty/rate edits', () => {
    const rawItem = {
        qty: 100.18,
        rate: 100.18,
        computed_amount: 10036.03,
        final_amount: 200.36,
    };

    const normalized = deriveLineItemAmounts(rawItem);
    assert.equal(normalized.originalFinalAmount, 200.36);
    assert.equal(normalized.computedAmount, 10036.03);

    const rowItem = {
        qty: normalized.qty,
        rate: normalized.rate,
        originalQty: normalized.qty,
        originalRate: normalized.rate,
        originalFinalAmount: normalized.originalFinalAmount,
        billedAmount: normalized.originalFinalAmount,
    };

    assert.equal(getDisplayedBilledAmount(rowItem), 200.36);

    const editedRowItem = {
        ...rowItem,
        qty: 50,
    };

    assert.equal(getDisplayedBilledAmount(editedRowItem), 5009);
});
