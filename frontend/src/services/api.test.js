import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUploadFormData, normalizeBillsResponse } from './api.js';

test('buildUploadFormData includes invoice_date only when provided', () => {
    const file = new Blob(['dummy'], { type: 'application/pdf' });

    const withInvoiceDate = buildUploadFormData(
        file,
        'Apollo Hospital',
        '12345678',
        '2026-02-14',
        'req-1',
    );
    assert.equal(withInvoiceDate.get('hospital_name'), 'Apollo Hospital');
    assert.equal(withInvoiceDate.get('employee_id'), '12345678');
    assert.equal(withInvoiceDate.get('invoice_date'), '2026-02-14');
    assert.equal(withInvoiceDate.get('client_request_id'), 'req-1');

    const withoutInvoiceDate = buildUploadFormData(
        file,
        'Apollo Hospital',
        '12345678',
        '',
        'req-2',
    );
    assert.equal(withoutInvoiceDate.get('invoice_date'), null);
});

test('normalizeBillsResponse maps invoice_date and upload_date with backward compatibility', () => {
    const rows = normalizeBillsResponse([
        {
            bill_id: 'b1',
            employee_id: '12345678',
            invoice_date: '2026-02-10',
            upload_date: '2026-02-14T10:00:00Z',
            processing_time_seconds: 42,
            status: 'completed',
        },
        {
            bill_id: 'b2',
            employee_id: '87654321',
            created_at: '2026-02-14T11:00:00Z',
            status: 'completed',
        },
    ]);

    assert.equal(rows[0].employee_id, '12345678');
    assert.equal(rows[0].invoice_date, '2026-02-10');
    assert.equal(rows[0].upload_date, '2026-02-14T10:00:00Z');
    assert.equal(rows[0].processing_time_seconds, 42);

    // Older rows should still render with fallback mapping.
    assert.equal(rows[1].invoice_date, null);
    assert.equal(rows[1].upload_date, '2026-02-14T11:00:00Z');
});
