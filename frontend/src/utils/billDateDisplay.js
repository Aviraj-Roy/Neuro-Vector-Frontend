export const formatInvoiceDate = (value) => {
    if (!value) return '-';

    const datePart = String(value).trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return '-';

    const [year, month, day] = datePart.split('-');
    return `${day}-${month}-${year}`;
};

export const formatUploadDateTime = (value) => {
    if (!value) return '-';

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleString();
};
