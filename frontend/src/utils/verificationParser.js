/**
 * Verification Result Parser
 * Parses raw formatted text from backend into structured JSON
 */

/**
 * Parse the raw verification result text into structured data
 * @param {string} rawText - Raw formatted text from backend
 * @returns {Object} Structured verification data
 */
export const parseVerificationResult = (rawText) => {
    try {
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Invalid input: rawText must be a non-empty string');
        }

        const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

        const result = {
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
            },
            categories: [],
            rawText: rawText, // Keep original for debugging
        };

        let currentCategory = null;
        let currentItem = null;
        let parsingMode = 'summary'; // 'summary', 'financial', 'category', 'item'

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Parse summary section
            if (line.includes('SUMMARY') || line.includes('Summary')) {
                parsingMode = 'summary';
                continue;
            }

            // Parse financial summary
            if (line.includes('FINANCIAL') || line.includes('Financial')) {
                parsingMode = 'financial';
                continue;
            }

            // Detect category headers (usually in CAPS or with specific markers)
            if (isCategoryHeader(line)) {
                // Save previous category if exists
                if (currentCategory && currentItem) {
                    currentCategory.items.push(currentItem);
                    currentItem = null;
                }
                if (currentCategory) {
                    result.categories.push(currentCategory);
                }

                // Start new category
                currentCategory = {
                    name: extractCategoryName(line),
                    items: [],
                };
                parsingMode = 'category';
                continue;
            }

            // Parse summary counts
            if (parsingMode === 'summary') {
                if (line.match(/total.*items?/i)) {
                    result.summary.totalItems = extractNumber(line);
                } else if (line.match(/allowed/i) && !line.match(/overcharged/i)) {
                    result.summary.allowedCount = extractNumber(line);
                } else if (line.match(/overcharged/i)) {
                    result.summary.overchargedCount = extractNumber(line);
                } else if (line.match(/needs?\s*review/i)) {
                    result.summary.needsReviewCount = extractNumber(line);
                }
            }

            // Parse financial summary
            if (parsingMode === 'financial') {
                if (line.match(/total\s*billed/i)) {
                    result.financial.totalBilled = extractAmount(line);
                } else if (line.match(/total\s*allowed/i)) {
                    result.financial.totalAllowed = extractAmount(line);
                } else if (line.match(/total\s*extra/i)) {
                    result.financial.totalExtra = extractAmount(line);
                }
            }

            // Parse items within category
            if (parsingMode === 'category' && currentCategory) {
                const item = parseItemLine(line, lines, i);
                if (item) {
                    currentCategory.items.push(item);
                }
            }
        }

        // Push last category
        if (currentCategory && currentItem) {
            currentCategory.items.push(currentItem);
        }
        if (currentCategory) {
            result.categories.push(currentCategory);
        }

        // Validate and calculate totals if not parsed
        validateAndCalculateTotals(result);

        return result;
    } catch (error) {
        console.error('Error parsing verification result:', error);
        throw new Error(`Failed to parse verification result: ${error.message}`);
    }
};

/**
 * Alternative parser for structured text format
 * Handles line-by-line item parsing
 */
export const parseVerificationResultV2 = (rawText) => {
    try {
        if (!rawText || typeof rawText !== 'string') {
            throw new Error('Invalid input: rawText must be a non-empty string');
        }

        const result = {
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
            },
            categories: [],
            rawText: rawText,
        };

        const lines = rawText.split('\n');
        let currentCategory = null;
        let i = 0;

        while (i < lines.length) {
            const line = lines[i].trim();

            // Skip empty lines
            if (!line) {
                i++;
                continue;
            }

            // Parse summary section
            if (line.match(/^(SUMMARY|Summary|OVERALL)/i)) {
                i = parseSummarySection(lines, i + 1, result.summary);
                continue;
            }

            // Parse financial section
            if (line.match(/^(FINANCIAL|Financial)/i)) {
                i = parseFinancialSection(lines, i + 1, result.financial);
                continue;
            }

            // Parse category
            if (line.match(/^(CATEGORY|Category):/i) || line.match(/^[A-Z\s]+:$/)) {
                if (currentCategory) {
                    result.categories.push(currentCategory);
                }
                currentCategory = {
                    name: line.replace(/^(CATEGORY|Category):\s*/i, '').replace(/:$/, '').trim(),
                    items: [],
                };
                i++;
                continue;
            }

            // Parse item (multi-line format)
            if (currentCategory && (line.match(/^Bill Item:/i) || line.match(/^-\s/))) {
                const item = parseMultiLineItem(lines, i);
                if (item) {
                    currentCategory.items.push(item);
                    i = item.endIndex;
                } else {
                    i++;
                }
                continue;
            }

            i++;
        }

        // Push last category
        if (currentCategory) {
            result.categories.push(currentCategory);
        }

        validateAndCalculateTotals(result);
        return result;
    } catch (error) {
        console.error('Error parsing verification result (V2):', error);
        throw new Error(`Failed to parse verification result: ${error.message}`);
    }
};

// Helper functions

function isCategoryHeader(line) {
    // Category headers are typically all caps or have specific patterns
    return (
        line.match(/^[A-Z\s]+:?$/) ||
        line.match(/^CATEGORY:/i) ||
        line.match(/^---\s*[A-Z]/i) ||
        (line === line.toUpperCase() && line.length > 3 && line.length < 50)
    );
}

function extractCategoryName(line) {
    return line
        .replace(/^(CATEGORY|Category):\s*/i, '')
        .replace(/^---\s*/i, '')
        .replace(/:$/, '')
        .trim();
}

function extractNumber(line) {
    const match = line.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

function extractAmount(line) {
    // Match currency amounts: ₹1,234.56 or 1234.56 or 1,234
    const match = line.match(/₹?\s*([\d,]+\.?\d*)/);
    if (match) {
        return parseFloat(match[1].replace(/,/g, ''));
    }
    return 0;
}

function parseItemLine(line, allLines, currentIndex) {
    // This is a simplified parser - adjust based on actual format
    // Expected format variations:
    // - "Bill Item: X | Best Match: Y | Similarity: Z | ..."
    // - Multi-line format with each field on separate line

    const item = {
        billItem: '',
        bestMatch: '',
        similarity: 0,
        allowedAmount: 0,
        billedAmount: 0,
        extraAmount: 0,
        decision: '',
        reason: '',
    };

    // Try pipe-separated format
    if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        parts.forEach(part => {
            if (part.match(/bill\s*item/i)) {
                item.billItem = part.replace(/bill\s*item:?\s*/i, '').trim();
            } else if (part.match(/best\s*match/i)) {
                item.bestMatch = part.replace(/best\s*match:?\s*/i, '').trim();
            } else if (part.match(/similarity/i)) {
                item.similarity = extractAmount(part);
            } else if (part.match(/allowed\s*amount/i)) {
                item.allowedAmount = extractAmount(part);
            } else if (part.match(/billed\s*amount/i)) {
                item.billedAmount = extractAmount(part);
            } else if (part.match(/extra\s*amount/i)) {
                item.extraAmount = extractAmount(part);
            } else if (part.match(/decision/i)) {
                item.decision = part.replace(/decision:?\s*/i, '').trim().toUpperCase();
            } else if (part.match(/reason/i)) {
                item.reason = part.replace(/reason:?\s*/i, '').trim();
            }
        });
        return item.billItem ? item : null;
    }

    return null;
}

function parseSummarySection(lines, startIndex, summary) {
    let i = startIndex;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || isCategoryHeader(line) || line.match(/^(FINANCIAL|Category)/i)) {
            break;
        }

        if (line.match(/total.*items?/i)) {
            summary.totalItems = extractNumber(line);
        } else if (line.match(/allowed/i) && !line.match(/overcharged/i)) {
            summary.allowedCount = extractNumber(line);
        } else if (line.match(/overcharged/i)) {
            summary.overchargedCount = extractNumber(line);
        } else if (line.match(/needs?\s*review/i)) {
            summary.needsReviewCount = extractNumber(line);
        }

        i++;
    }
    return i;
}

function parseFinancialSection(lines, startIndex, financial) {
    let i = startIndex;
    while (i < lines.length) {
        const line = lines[i].trim();
        if (!line || isCategoryHeader(line) || line.match(/^Category/i)) {
            break;
        }

        if (line.match(/total\s*billed/i)) {
            financial.totalBilled = extractAmount(line);
        } else if (line.match(/total\s*allowed/i)) {
            financial.totalAllowed = extractAmount(line);
        } else if (line.match(/total\s*extra/i)) {
            financial.totalExtra = extractAmount(line);
        }

        i++;
    }
    return i;
}

function parseMultiLineItem(lines, startIndex) {
    const item = {
        billItem: '',
        bestMatch: '',
        similarity: 0,
        allowedAmount: 0,
        billedAmount: 0,
        extraAmount: 0,
        decision: '',
        reason: '',
    };

    let i = startIndex;
    let foundItem = false;

    while (i < lines.length) {
        const line = lines[i].trim();

        // Stop at next item or category
        if (i > startIndex && (line.match(/^Bill Item:/i) || line.match(/^-\s/) || isCategoryHeader(line))) {
            break;
        }

        if (!line) {
            i++;
            continue;
        }

        // Parse fields
        if (line.match(/bill\s*item:/i)) {
            item.billItem = line.replace(/bill\s*item:?\s*/i, '').trim();
            foundItem = true;
        } else if (line.match(/best\s*match:/i)) {
            item.bestMatch = line.replace(/best\s*match:?\s*/i, '').trim();
        } else if (line.match(/similarity:/i)) {
            item.similarity = extractAmount(line);
        } else if (line.match(/allowed\s*amount:/i)) {
            item.allowedAmount = extractAmount(line);
        } else if (line.match(/billed\s*amount:/i)) {
            item.billedAmount = extractAmount(line);
        } else if (line.match(/extra\s*amount:/i)) {
            item.extraAmount = extractAmount(line);
        } else if (line.match(/decision:/i)) {
            item.decision = line.replace(/decision:?\s*/i, '').trim().toUpperCase();
        } else if (line.match(/reason:/i)) {
            item.reason = line.replace(/reason:?\s*/i, '').trim();
        }

        i++;
    }

    if (foundItem) {
        item.endIndex = i;
        return item;
    }

    return null;
}

function validateAndCalculateTotals(result) {
    // Calculate totals from items if not already set
    let totalItems = 0;
    let allowedCount = 0;
    let overchargedCount = 0;
    let needsReviewCount = 0;
    let totalBilled = 0;
    let totalAllowed = 0;
    let totalExtra = 0;

    result.categories.forEach(category => {
        category.items.forEach(item => {
            totalItems++;
            totalBilled += item.billedAmount || 0;
            totalAllowed += item.allowedAmount || 0;
            totalExtra += item.extraAmount || 0;

            const decision = (item.decision || '').toUpperCase();
            if (decision.includes('ALLOWED')) {
                allowedCount++;
            } else if (decision.includes('OVERCHARGED')) {
                overchargedCount++;
            } else if (decision.includes('REVIEW')) {
                needsReviewCount++;
            }
        });
    });

    // Use calculated values if parsed values are zero
    if (result.summary.totalItems === 0) result.summary.totalItems = totalItems;
    if (result.summary.allowedCount === 0) result.summary.allowedCount = allowedCount;
    if (result.summary.overchargedCount === 0) result.summary.overchargedCount = overchargedCount;
    if (result.summary.needsReviewCount === 0) result.summary.needsReviewCount = needsReviewCount;

    if (result.financial.totalBilled === 0) result.financial.totalBilled = totalBilled;
    if (result.financial.totalAllowed === 0) result.financial.totalAllowed = totalAllowed;
    if (result.financial.totalExtra === 0) result.financial.totalExtra = totalExtra;
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '₹0.00';
    return `₹${parseFloat(amount).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Get decision color
 */
export const getDecisionColor = (decision) => {
    const d = (decision || '').toUpperCase();
    if (d.includes('ALLOWED')) return 'success';
    if (d.includes('OVERCHARGED')) return 'error';
    if (d.includes('REVIEW')) return 'warning';
    return 'default';
};

/**
 * Get decision badge text
 */
export const getDecisionText = (decision) => {
    const d = (decision || '').toUpperCase();
    if (d.includes('ALLOWED')) return 'ALLOWED';
    if (d.includes('OVERCHARGED')) return 'OVERCHARGED';
    if (d.includes('REVIEW')) return 'NEEDS REVIEW';
    return decision || 'UNKNOWN';
};
