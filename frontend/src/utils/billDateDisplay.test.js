import test from 'node:test';
import assert from 'node:assert/strict';
import { formatInvoiceDate, formatUploadDateTime } from './billDateDisplay.js';

test('formatInvoiceDate renders date-only output', () => {
    assert.equal(formatInvoiceDate('2026-02-14'), '14-02-2026');
    assert.equal(formatInvoiceDate('2026-02-14T08:00:00Z'), '14-02-2026');
});

test('formatUploadDateTime renders local datetime for valid ISO and fallback for missing', () => {
    const formatted = formatUploadDateTime('2026-02-14T08:00:00Z');
    assert.notEqual(formatted, '-');

    assert.equal(formatUploadDateTime(null), '-');
    assert.equal(formatUploadDateTime(''), '-');
    assert.equal(formatUploadDateTime('not-a-date'), '-');
});

test('dashboard fallback rendering for missing invoice_date is dash', () => {
    assert.equal(formatInvoiceDate(null), '-');
    assert.equal(formatInvoiceDate(''), '-');
    assert.equal(formatInvoiceDate('bad'), '-');
});
