const BILL_EDITS_STORAGE_KEY = 'bill_details_edits_v1';

const safeParse = (value, fallback) => {
    try {
        const parsed = JSON.parse(value);
        return parsed ?? fallback;
    } catch (error) {
        console.error('Failed to parse bill edits from storage:', error);
        return fallback;
    }
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const getTieupRateValue = (item) => {
    const tieup = toFiniteNumber(item?.tieupRate);
    if (tieup !== null) return tieup;
    return toFiniteNumber(item?.allowedAmount);
};

const withDerivedAmounts = (parsedResult) => {
    if (!parsedResult?.categories) return parsedResult;
    return {
        ...parsedResult,
        categories: parsedResult.categories.map((category) => ({
            ...category,
            items: (category.items || []).map((item) => {
                const qty = toFiniteNumber(item?.qty);
                const rate = toFiniteNumber(item?.rate);
                const tieupRate = getTieupRateValue(item);
                return {
                    ...item,
                    billedAmount: qty !== null && rate !== null ? qty * rate : item?.billedAmount ?? null,
                    amountToBePaid: qty !== null && tieupRate !== null ? qty * tieupRate : item?.amountToBePaid ?? null,
                };
            }),
        })),
    };
};

export const loadBillEdits = (uploadId) => {
    if (!uploadId) return null;
    const raw = localStorage.getItem(BILL_EDITS_STORAGE_KEY);
    const allEdits = safeParse(raw, {});
    return allEdits?.[uploadId] || null;
};

export const saveBillEdits = (uploadId, parsedResult) => {
    if (!uploadId || !parsedResult) return;
    const raw = localStorage.getItem(BILL_EDITS_STORAGE_KEY);
    const allEdits = safeParse(raw, {});
    allEdits[uploadId] = withDerivedAmounts(parsedResult);
    localStorage.setItem(BILL_EDITS_STORAGE_KEY, JSON.stringify(allEdits));
};

export const applyBillEdits = (uploadId, parsedResult) => {
    const saved = loadBillEdits(uploadId);
    if (!saved?.categories?.length || !parsedResult?.categories) return withDerivedAmounts(parsedResult);

    const savedByCategory = new Map(saved.categories.map((category) => [category.name, category.items || []]));
    return withDerivedAmounts({
        ...parsedResult,
        categories: parsedResult.categories.map((category) => {
            const savedItems = savedByCategory.get(category.name);
            if (!savedItems) return category;
            return {
                ...category,
                items: category.items.map((item, index) => ({
                    ...item,
                    qty: savedItems[index]?.qty ?? item.qty,
                    rate: savedItems[index]?.rate ?? item.rate,
                    billedAmount: savedItems[index]?.billedAmount ?? item.billedAmount,
                    amountToBePaid: savedItems[index]?.amountToBePaid ?? item.amountToBePaid,
                })),
            };
        }),
    });
};
