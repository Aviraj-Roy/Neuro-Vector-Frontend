const DECISIONS = {
    ALLOWED: 'ALLOWED',
    OVERCHARGED: 'OVERCHARGED',
    NEEDS_REVIEW: 'NEEDS_REVIEW',
};

const ITEM_KEY_ALIASES = {
    'bill item': 'billItem',
    'bill item name': 'billItem',
    'best match': 'bestMatch',
    'similarity': 'similarity',
    'similarity score': 'similarity',
    'allowed': 'allowedAmount',
    'allowed amount': 'allowedAmount',
    'tieup rate': 'tieupRate',
    'tie-up rate': 'tieupRate',
    'tieup rates': 'tieupRate',
    'edit tieup rate': 'tieupRate',
    'edit tieup rates': 'tieupRate',
    'qty': 'qty',
    'quantity': 'qty',
    'rate': 'rate',
    'unit rate': 'rate',
    'item rate': 'rate',
    'amount to be paid': 'amountToBePaid',
    'payable amount': 'amountToBePaid',
    'amount payable': 'amountToBePaid',
    'discrepancy': 'discrepancy',
    'billed': 'billedAmount',
    'billed amount': 'billedAmount',
    'extra': 'extraAmount',
    'extra amount': 'extraAmount',
    'decision': 'decision',
    'reason': 'reason',
};

const defaultParsedResult = () => ({
    summary: {
        totalItems: 0,
        allowedCount: 0,
        overchargedCount: 0,
        needsReviewCount: 0,
    },
    financial: {
        totalBilled: 0,
        totalAllowed: 0,
        totalExtra: 0,
        totalUnclassified: 0,
    },
    categories: [],
    warnings: [],
});

const STATUS_ICON_TO_DECISION = {
    '✅': DECISIONS.ALLOWED,
    '❌': DECISIONS.OVERCHARGED,
    '⚠️': DECISIONS.NEEDS_REVIEW,
    '⚠': DECISIONS.NEEDS_REVIEW,
    '🟦': DECISIONS.NEEDS_REVIEW,
};

const parseAmount = (value) => {
    if (value === null || value === undefined) return null;
    const cleaned = String(value).replace(/[, ]/g, '').replace(/[^\d.-]/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseInteger = (value) => {
    if (value === null || value === undefined) return null;
    const match = String(value).match(/-?\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseSimilarity = (value) => {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    if (!text) return null;

    if (text.includes('%')) {
        const pct = parseAmount(text);
        return pct === null ? null : pct / 100;
    }

    const num = parseAmount(text);
    if (num === null) return null;
    return num > 1 ? num / 100 : num;
};
const parseBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    const text = String(value || '').trim().toLowerCase();
    if (['true', '1', 'yes', 'y'].includes(text)) return true;
    if (['false', '0', 'no', 'n'].includes(text)) return false;
    return null;
};

const normalizeDecision = (value) => {
    const normalized = String(value || '')
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '_');

    if (normalized === 'GREEN') return DECISIONS.ALLOWED;
    if (normalized === 'RED') return DECISIONS.OVERCHARGED;
    if (normalized === 'MISMATCH') return DECISIONS.NEEDS_REVIEW;
    if (normalized === 'UNCLASSIFIED') return DECISIONS.NEEDS_REVIEW;
    if (normalized === 'ALLOWED_NOT_COMPARABLE') return DECISIONS.NEEDS_REVIEW;
    if (normalized.includes('OVER')) return DECISIONS.OVERCHARGED;
    if (normalized.includes('ALLOW')) return DECISIONS.ALLOWED;
    if (normalized.includes('GREEN')) return DECISIONS.ALLOWED;
    if (normalized.includes('RED')) return DECISIONS.OVERCHARGED;
    if (normalized.includes('REVIEW')) return DECISIONS.NEEDS_REVIEW;
    if (normalized.includes('MISMATCH')) return DECISIONS.NEEDS_REVIEW;
    if (normalized.includes('UNCLASSIFIED')) return DECISIONS.NEEDS_REVIEW;
    return DECISIONS.NEEDS_REVIEW;
};

const formatKey = (key) => String(key || '').trim().toLowerCase();

const addItemToCategory = (categoryMap, categoryName, rawItem) => {
    if (!rawItem || !rawItem.billItem) return;

    const safeCategory = categoryName || 'Uncategorized';
    if (!categoryMap.has(safeCategory)) {
        categoryMap.set(safeCategory, []);
    }

    const item = {
        billItem: String(rawItem.billItem || '').trim(),
        bestMatch: String(rawItem.bestMatch || '').trim(),
        similarity: parseSimilarity(rawItem.similarity),
        allowedAmount: parseAmount(rawItem.allowedAmount),
        tieupRate: parseAmount(rawItem.tieupRate ?? rawItem.allowedAmount),
        qty: parseAmount(rawItem.qty),
        rate: parseAmount(rawItem.rate),
        amountToBePaid: parseAmount(rawItem.amountToBePaid ?? rawItem.allowedAmount),
        billedAmount: parseAmount(rawItem.billedAmount),
        extraAmount: parseAmount(rawItem.extraAmount),
        discrepancy: parseBoolean(rawItem.discrepancy),
        decision: normalizeDecision(rawItem.decision),
        reason: String(rawItem.reason || '').trim(),
    };

    categoryMap.get(safeCategory).push(item);
};

const extractNumericByLabel = (text, labels) => {
    for (const label of labels) {
        const regex = new RegExp(`${label}\\s*[:=-]\\s*([^\\n]+)`, 'i');
        const match = text.match(regex);
        if (match && match[1]) return parseAmount(match[1]);
    }
    return null;
};

const extractSummaryCounts = (text) => {
    const totalItems = parseInteger(extractNumericByLabel(text, ['total items?', 'items? total'])) || 0;

    const greenCountMatch = text.match(/^\s*(?:✅\s*)?GREEN(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);
    const redCountMatch = text.match(/^\s*(?:❌\s*)?RED(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);
    const needsReviewMatch = text.match(/^\s*(?:⚠️?\s*)?NEEDS[_ ]?REVIEW(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);
    const mismatchMatch = text.match(/^\s*(?:🔶\s*)?MISMATCH(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);
    const unclassifiedMatch = text.match(/^\s*(?:⚠️?\s*)?UNCLASSIFIED(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);
    const allowedNotComparableMatch = text.match(/^\s*(?:🟦\s*)?ALLOWED[_ ]?NOT[_ ]?COMPARABLE(?:\s*\(.*?\))?\s*[:=-]\s*(\d+)/im);

    const allowedCount = greenCountMatch ? Number(greenCountMatch[1]) : 0;
    const overchargedCount = redCountMatch ? Number(redCountMatch[1]) : 0;
    const explicitNeedsReview = needsReviewMatch ? Number(needsReviewMatch[1]) : 0;
    const mismatchCount = mismatchMatch ? Number(mismatchMatch[1]) : 0;
    const unclassifiedCount = unclassifiedMatch ? Number(unclassifiedMatch[1]) : 0;
    const allowedNotComparableCount = allowedNotComparableMatch ? Number(allowedNotComparableMatch[1]) : 0;
    const needsReviewCount = explicitNeedsReview || (mismatchCount + unclassifiedCount + allowedNotComparableCount);

    return { totalItems, allowedCount, overchargedCount, needsReviewCount };
};

const extractFinancialTotals = (text) => ({
    totalBilled: extractNumericByLabel(text, ['total billed', 'billed total', 'total bill amount']) || 0,
    totalAllowed: extractNumericByLabel(text, ['total allowed', 'allowed total']) || 0,
    totalExtra: extractNumericByLabel(text, ['total extra', 'extra total', 'total overcharged']) || 0,
    totalUnclassified: extractNumericByLabel(text, ['total unclassified', 'unclassified total', 'total unclassified amount']) || 0,
});

const isCategoryLine = (line) => /^[^\w]*category\s*[:\-]/i.test(line);
const getCategoryName = (line) => {
    const name = line.replace(/^[^\w]*category\s*[:\-]\s*/i, '').replace(/\(\d+\s*items?\)/i, '').trim();
    return name || 'Uncategorized';
};

const isTableDivider = (line) => /^\|?[-:\s|]+\|?$/.test(line);

const parsePipeCells = (line) =>
    String(line)
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim());

const buildTableIndexMap = (headerCells) => {
    const map = {};
    headerCells.forEach((header, idx) => {
        const normalized = formatKey(header);
        if (normalized.includes('bill item')) map.billItem = idx;
        if (normalized.includes('best match')) map.bestMatch = idx;
        if (normalized.includes('similarity')) map.similarity = idx;
        if (normalized === 'allowed' || normalized.includes('allowed amount')) map.allowedAmount = idx;
        if ((normalized.includes('tieup') || normalized.includes('tie-up')) && normalized.includes('rate')) {
            map.tieupRate = idx;
        }
        if (normalized === 'qty' || normalized.includes('quantity')) map.qty = idx;
        if ((normalized === 'rate' || normalized.includes('unit rate') || normalized.includes('item rate'))
            && !normalized.includes('tieup')
            && !normalized.includes('tie-up')) {
            map.rate = idx;
        }
        if (normalized.includes('amount to be paid') || normalized.includes('payable amount')) {
            map.amountToBePaid = idx;
        }
        if (normalized === 'billed' || normalized.includes('billed amount')) map.billedAmount = idx;
        if (normalized.includes('discrepancy')) map.discrepancy = idx;
        if (normalized === 'extra' || normalized.includes('extra amount')) map.extraAmount = idx;
        if (normalized.includes('decision')) map.decision = idx;
        if (normalized.includes('reason')) map.reason = idx;
    });

    return map.billItem !== undefined && map.decision !== undefined ? map : null;
};

const detectDecisionFromIcon = (line) => {
    const icon = Object.keys(STATUS_ICON_TO_DECISION).find((symbol) => line.includes(symbol));
    return icon ? STATUS_ICON_TO_DECISION[icon] : null;
};

const parseArrowBillLine = (line) => {
    const billMatch = line.match(/Bill\s*[:=-]\s*([^,]+)/i);
    const allowedMatch = line.match(/Allowed\s*[:=-]\s*([^,]+)/i);
    const extraMatch = line.match(/Extra\s*[:=-]\s*([^,]+)/i);
    return {
        billedAmount: billMatch ? billMatch[1] : '',
        allowedAmount: allowedMatch ? allowedMatch[1] : '',
        extraAmount: extraMatch ? extraMatch[1] : '',
    };
};

export const parseVerificationResult = (rawText) => {
    const parsed = defaultParsedResult();

    if (typeof rawText !== 'string' || !rawText.trim()) {
        parsed.warnings.push('Verification result is empty or not a string.');
        return parsed;
    }

    const text = rawText.replace(/\r/g, '');
    const lines = text.split('\n');
    const categoryMap = new Map();

    let currentCategory = 'Uncategorized';
    let currentItem = null;
    let tableIndexMap = null;

    const flushCurrentItem = () => {
        if (!currentItem) return;
        addItemToCategory(categoryMap, currentCategory, currentItem);
        currentItem = null;
    };

    for (const rawLine of lines) {
        const line = String(rawLine || '').trim();
        if (!line) {
            flushCurrentItem();
            tableIndexMap = null;
            continue;
        }

        if (isCategoryLine(line)) {
            flushCurrentItem();
            currentCategory = getCategoryName(line);
            tableIndexMap = null;
            continue;
        }

        if (line.startsWith('|')) {
            const cells = parsePipeCells(line);
            if (!tableIndexMap) {
                const maybeIndexMap = buildTableIndexMap(cells);
                if (maybeIndexMap) {
                    tableIndexMap = maybeIndexMap;
                }
                continue;
            }

            if (isTableDivider(line)) {
                continue;
            }

            const tableItem = {
                billItem: cells[tableIndexMap.billItem] || '',
                bestMatch: cells[tableIndexMap.bestMatch] || '',
                similarity: cells[tableIndexMap.similarity] || '',
                allowedAmount: cells[tableIndexMap.allowedAmount] || '',
                tieupRate: cells[tableIndexMap.tieupRate] || '',
                qty: cells[tableIndexMap.qty] || '',
                rate: cells[tableIndexMap.rate] || '',
                amountToBePaid: cells[tableIndexMap.amountToBePaid] || '',
                billedAmount: cells[tableIndexMap.billedAmount] || '',
                discrepancy: cells[tableIndexMap.discrepancy] || '',
                extraAmount: cells[tableIndexMap.extraAmount] || '',
                decision: cells[tableIndexMap.decision] || '',
                reason: cells[tableIndexMap.reason] || '',
            };
            addItemToCategory(categoryMap, currentCategory, tableItem);
            continue;
        }

        tableIndexMap = null;

        // Raw renderer style item header, e.g.:
        // ❌ 1. CONSULTATION ... (normalized: ...)
        const rawItemHeader = line.match(/^[^\w]*(?:✅|❌|⚠️?|🟦)\s+(.+)$/);
        if (rawItemHeader) {
            flushCurrentItem();
            const cleaned = rawItemHeader[1].replace(/\s*\(normalized:.*$/i, '').trim();
            currentItem = {
                billItem: cleaned,
                decision: detectDecisionFromIcon(line) || DECISIONS.NEEDS_REVIEW,
            };
            continue;
        }

        const keyValue = line.match(/^([A-Za-z ]+)\s*[:\-]\s*(.*)$/);
        if (keyValue) {
            const rawKey = formatKey(keyValue[1]);
            const value = keyValue[2] || '';

            const mappedKey = ITEM_KEY_ALIASES[rawKey];
            if (mappedKey) {
                // New item starts when Bill Item appears again.
                if (mappedKey === 'billItem' && currentItem && currentItem.billItem) {
                    flushCurrentItem();
                }
                if (!currentItem) currentItem = {};
                currentItem[mappedKey] = value;
                continue;
            }
        }

        // Raw renderer arrow lines
        if (currentItem) {
            const matchedLine = line.match(/^[^\w]*Matched\s*[:\-]\s*(.+)$/i)
                || line.match(/^[^\w]*Best Candidate\s*[:\-]\s*(.+)$/i);
            if (matchedLine) {
                if (!currentItem.bestMatch || /best candidate/i.test(line)) {
                    currentItem.bestMatch = matchedLine[1].trim();
                }
                continue;
            }

            const similarityLine = line.match(/^[^\w]*Similarity\s*[:\-]\s*(.+)$/i);
            if (similarityLine) {
                currentItem.similarity = similarityLine[1].trim();
                continue;
            }

            const billLine = line.match(/^[^\w]*Bill\s*[:\-]\s*(.+)$/i);
            if (billLine) {
                const parsedAmounts = parseArrowBillLine(line);
                currentItem.billedAmount = parsedAmounts.billedAmount;
                currentItem.allowedAmount = parsedAmounts.allowedAmount;
                currentItem.extraAmount = parsedAmounts.extraAmount;
                continue;
            }

            const reasonLine = line.match(/^[^\w]*Reason\s*[:\-]\s*(.+)$/i);
            if (reasonLine) {
                currentItem.reason = reasonLine[1].trim();
                continue;
            }
        }

        const numberedItem = line.match(/^\d+[\).\-\s]+(.+)$/);
        if (numberedItem) {
            flushCurrentItem();
            currentItem = { billItem: numberedItem[1] };
            continue;
        }

        if (currentItem && currentItem.reason) {
            currentItem.reason = `${currentItem.reason} ${line}`.trim();
        }
    }

    flushCurrentItem();

    parsed.categories = Array.from(categoryMap.entries()).map(([name, items]) => ({
        name,
        items,
    }));

    const allItems = parsed.categories.flatMap((category) => category.items);
    const summaryFromText = extractSummaryCounts(text);
    const financialFromText = extractFinancialTotals(text);

    const allowedFromItems = allItems.filter((item) => item.decision === DECISIONS.ALLOWED).length;
    const overchargedFromItems = allItems.filter((item) => item.decision === DECISIONS.OVERCHARGED).length;
    const needsReviewFromItems = allItems.filter((item) => item.decision === DECISIONS.NEEDS_REVIEW).length;

    parsed.summary = {
        totalItems: summaryFromText.totalItems || allItems.length,
        allowedCount: summaryFromText.allowedCount || allowedFromItems,
        overchargedCount: summaryFromText.overchargedCount || overchargedFromItems,
        needsReviewCount: summaryFromText.needsReviewCount || needsReviewFromItems,
    };

    const billedFromItems = allItems.reduce((sum, item) => sum + (item.billedAmount || 0), 0);
    const allowedFromItemsAmount = allItems.reduce((sum, item) => sum + (item.allowedAmount || 0), 0);
    const extraFromItemsAmount = allItems.reduce((sum, item) => sum + (item.extraAmount || 0), 0);

    parsed.financial = {
        totalBilled: financialFromText.totalBilled || billedFromItems,
        totalAllowed: financialFromText.totalAllowed || allowedFromItemsAmount,
        totalExtra: financialFromText.totalExtra || extraFromItemsAmount,
        totalUnclassified: financialFromText.totalUnclassified || 0,
    };

    if (allItems.length === 0) {
        parsed.warnings.push('No line items could be parsed from verification text.');
    }

    return parsed;
};

export { DECISIONS };
