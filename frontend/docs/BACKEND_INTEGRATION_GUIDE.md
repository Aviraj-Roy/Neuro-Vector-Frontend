# Backend Integration Guide - Bill Verification Results

## 🎯 Quick Summary

**Good News**: Your current backend is already compatible! No changes required.

The frontend can parse **raw text** from `verification_result` field automatically.

---

## ✅ Current Backend (Already Works)

### Endpoint
```
GET /bill/:uploadId
```

### Response Format
```javascript
{
  "upload_id": "67890abcdef12345",
  "status": "COMPLETED",
  "verification_result": "RAW TEXT HERE",  // ← Frontend parses this
  "created_at": "2026-02-12T10:30:00Z",
  "updated_at": "2026-02-12T10:35:00Z"
}
```

### What the Frontend Expects in `verification_result`

The text should contain:
1. **Summary section** - Total items, allowed count, overcharged count, needs review count
2. **Financial section** - Total billed, total allowed, total extra
3. **Category sections** - Grouped items with details

---

## 📝 Text Format Options

### Option 1: Pipe-Separated (Recommended)

```
SUMMARY
Total Items: 25
Allowed: 18
Overcharged: 5
Needs Review: 2

FINANCIAL SUMMARY
Total Billed: ₹15,000
Total Allowed: ₹12,500
Total Extra: ₹2,500

CATEGORY: CONSULTATIONS
Bill Item: General Consultation | Best Match: OPD Consultation | Similarity: 95.5 | Allowed: ₹500 | Billed: ₹500 | Extra: ₹0 | Decision: ALLOWED | Reason: Exact match found
Bill Item: Specialist Visit | Best Match: Specialist OPD | Similarity: 92.0 | Allowed: ₹1000 | Billed: ₹1500 | Extra: ₹500 | Decision: OVERCHARGED | Reason: Price exceeds allowed amount

CATEGORY: DIAGNOSTICS
Bill Item: Blood Test | Best Match: Complete Blood Count | Similarity: 88.2 | Allowed: ₹800 | Billed: ₹1200 | Extra: ₹400 | Decision: OVERCHARGED | Reason: Price exceeds limit
```

### Option 2: Multi-Line Format

```
SUMMARY
Total Items: 25
Allowed: 18
Overcharged: 5
Needs Review: 2

FINANCIAL SUMMARY
Total Billed: ₹15,000
Total Allowed: ₹12,500
Total Extra: ₹2,500

CATEGORY: CONSULTATIONS

Bill Item: General Consultation
Best Match: OPD Consultation
Similarity: 95.5
Allowed Amount: ₹500
Billed Amount: ₹500
Extra Amount: ₹0
Decision: ALLOWED
Reason: Exact match found

Bill Item: Specialist Visit
Best Match: Specialist OPD
Similarity: 92.0
Allowed Amount: ₹1000
Billed Amount: ₹1500
Extra Amount: ₹500
Decision: OVERCHARGED
Reason: Price exceeds allowed amount
```

---

## 🎯 Field Requirements

### Summary Section
- `Total Items: <number>`
- `Allowed: <number>`
- `Overcharged: <number>`
- `Needs Review: <number>`

### Financial Section
- `Total Billed: ₹<amount>` or `Total Billed: <amount>`
- `Total Allowed: ₹<amount>` or `Total Allowed: <amount>`
- `Total Extra: ₹<amount>` or `Total Extra: <amount>`

### Category Section
Each category should have:
- Category name (e.g., "CATEGORY: CONSULTATIONS")
- Items with these fields:
  - **Bill Item**: Name from the bill
  - **Best Match**: Matched item from tie-up
  - **Similarity**: Score (0-100)
  - **Allowed Amount**: Amount allowed by tie-up
  - **Billed Amount**: Amount in the bill
  - **Extra Amount**: Difference (billed - allowed)
  - **Decision**: ALLOWED | OVERCHARGED | NEEDS_REVIEW
  - **Reason**: Explanation text

---

## 🚀 Python Backend Example

### Example 1: Generate Pipe-Separated Text

```python
def format_verification_result(verification_data):
    """
    Format verification data as pipe-separated text
    """
    lines = []
    
    # Summary
    lines.append("SUMMARY")
    lines.append(f"Total Items: {verification_data['total_items']}")
    lines.append(f"Allowed: {verification_data['allowed_count']}")
    lines.append(f"Overcharged: {verification_data['overcharged_count']}")
    lines.append(f"Needs Review: {verification_data['needs_review_count']}")
    lines.append("")
    
    # Financial
    lines.append("FINANCIAL SUMMARY")
    lines.append(f"Total Billed: ₹{verification_data['total_billed']:,.2f}")
    lines.append(f"Total Allowed: ₹{verification_data['total_allowed']:,.2f}")
    lines.append(f"Total Extra: ₹{verification_data['total_extra']:,.2f}")
    lines.append("")
    
    # Categories
    for category in verification_data['categories']:
        lines.append(f"CATEGORY: {category['name']}")
        
        for item in category['items']:
            item_line = (
                f"Bill Item: {item['bill_item']} | "
                f"Best Match: {item['best_match']} | "
                f"Similarity: {item['similarity']:.1f} | "
                f"Allowed: ₹{item['allowed_amount']:,.2f} | "
                f"Billed: ₹{item['billed_amount']:,.2f} | "
                f"Extra: ₹{item['extra_amount']:,.2f} | "
                f"Decision: {item['decision']} | "
                f"Reason: {item['reason']}"
            )
            lines.append(item_line)
        
        lines.append("")
    
    return "\n".join(lines)

# Usage in your API endpoint
@app.get("/bill/{upload_id}")
async def get_bill(upload_id: str):
    # ... fetch bill data ...
    
    verification_result_text = format_verification_result(verification_data)
    
    return {
        "upload_id": upload_id,
        "status": "COMPLETED",
        "verification_result": verification_result_text,
        "created_at": bill.created_at,
        "updated_at": bill.updated_at
    }
```

### Example 2: Generate Multi-Line Text

```python
def format_verification_result_multiline(verification_data):
    """
    Format verification data as multi-line text
    """
    lines = []
    
    # Summary
    lines.append("SUMMARY")
    lines.append(f"Total Items: {verification_data['total_items']}")
    lines.append(f"Allowed: {verification_data['allowed_count']}")
    lines.append(f"Overcharged: {verification_data['overcharged_count']}")
    lines.append(f"Needs Review: {verification_data['needs_review_count']}")
    lines.append("")
    
    # Financial
    lines.append("FINANCIAL SUMMARY")
    lines.append(f"Total Billed: ₹{verification_data['total_billed']:,.2f}")
    lines.append(f"Total Allowed: ₹{verification_data['total_allowed']:,.2f}")
    lines.append(f"Total Extra: ₹{verification_data['total_extra']:,.2f}")
    lines.append("")
    
    # Categories
    for category in verification_data['categories']:
        lines.append(f"CATEGORY: {category['name']}")
        lines.append("")
        
        for item in category['items']:
            lines.append(f"Bill Item: {item['bill_item']}")
            lines.append(f"Best Match: {item['best_match']}")
            lines.append(f"Similarity: {item['similarity']:.1f}")
            lines.append(f"Allowed Amount: ₹{item['allowed_amount']:,.2f}")
            lines.append(f"Billed Amount: ₹{item['billed_amount']:,.2f}")
            lines.append(f"Extra Amount: ₹{item['extra_amount']:,.2f}")
            lines.append(f"Decision: {item['decision']}")
            lines.append(f"Reason: {item['reason']}")
            lines.append("")
    
    return "\n".join(lines)
```

---

## 🎯 Better Option: Return Structured JSON

If you want to avoid text parsing altogether, return structured JSON:

```python
@app.get("/bill/{upload_id}")
async def get_bill(upload_id: str):
    # ... fetch bill data ...
    
    return {
        "upload_id": upload_id,
        "status": "COMPLETED",
        "verification_result": {
            "summary": {
                "totalItems": 25,
                "allowedCount": 18,
                "overchargedCount": 5,
                "needsReviewCount": 2
            },
            "financial": {
                "totalBilled": 15000,
                "totalAllowed": 12500,
                "totalExtra": 2500
            },
            "categories": [
                {
                    "name": "CONSULTATIONS",
                    "items": [
                        {
                            "billItem": "General Consultation",
                            "bestMatch": "OPD Consultation",
                            "similarity": 95.5,
                            "allowedAmount": 500,
                            "billedAmount": 500,
                            "extraAmount": 0,
                            "decision": "ALLOWED",
                            "reason": "Exact match found"
                        },
                        {
                            "billItem": "Specialist Visit",
                            "bestMatch": "Specialist OPD",
                            "similarity": 92.0,
                            "allowedAmount": 1000,
                            "billedAmount": 1500,
                            "extraAmount": 500,
                            "decision": "OVERCHARGED",
                            "reason": "Price exceeds allowed amount"
                        }
                    ]
                },
                {
                    "name": "DIAGNOSTICS",
                    "items": [...]
                }
            ]
        },
        "created_at": "2026-02-12T10:30:00Z",
        "updated_at": "2026-02-12T10:35:00Z"
    }
```

**The frontend will automatically detect and use this format!**

---

## 🔍 Decision Values

Use these exact values for the `decision` field:

- `"ALLOWED"` → Green badge
- `"OVERCHARGED"` → Red badge
- `"NEEDS_REVIEW"` → Yellow badge

Variations that work:
- `"allowed"`, `"Allowed"` → Normalized to ALLOWED
- `"overcharged"`, `"Overcharged"` → Normalized to OVERCHARGED
- `"needs_review"`, `"Needs Review"`, `"NEEDS REVIEW"` → Normalized to NEEDS_REVIEW

---

## 🧪 Testing Your Backend

### Test Case 1: Minimal Response
```json
{
  "upload_id": "test123",
  "status": "COMPLETED",
  "verification_result": "SUMMARY\nTotal Items: 1\nAllowed: 1\n\nFINANCIAL SUMMARY\nTotal Billed: ₹500\nTotal Allowed: ₹500\nTotal Extra: ₹0\n\nCATEGORY: TEST\nBill Item: Test | Best Match: Test | Similarity: 100 | Allowed: ₹500 | Billed: ₹500 | Extra: ₹0 | Decision: ALLOWED | Reason: Test"
}
```

### Test Case 2: Multiple Categories
```json
{
  "upload_id": "test456",
  "status": "COMPLETED",
  "verification_result": "SUMMARY\nTotal Items: 3\nAllowed: 2\nOvercharged: 1\n\nFINANCIAL SUMMARY\nTotal Billed: ₹2000\nTotal Allowed: ₹1500\nTotal Extra: ₹500\n\nCATEGORY: CONSULTATIONS\nBill Item: General | Best Match: OPD | Similarity: 95 | Allowed: ₹500 | Billed: ₹500 | Extra: ₹0 | Decision: ALLOWED | Reason: OK\n\nCATEGORY: DIAGNOSTICS\nBill Item: Blood Test | Best Match: CBC | Similarity: 88 | Allowed: ₹1000 | Billed: ₹1500 | Extra: ₹500 | Decision: OVERCHARGED | Reason: Exceeds limit"
}
```

---

## 📊 Data Flow

```
Backend Verification Engine
    ↓
Generate verification_result
    ↓
Store in MongoDB as string or object
    ↓
GET /bill/:uploadId returns data
    ↓
Frontend receives response
    ↓
Frontend parses verification_result
    ↓
Display structured UI
```

---

## ✅ Checklist for Backend Team

- [ ] Ensure `GET /bill/:uploadId` endpoint exists
- [ ] Return `verification_result` field
- [ ] Include summary counts (total, allowed, overcharged, needs review)
- [ ] Include financial totals (billed, allowed, extra)
- [ ] Group items by category
- [ ] Include all item fields (bill item, best match, similarity, amounts, decision, reason)
- [ ] Use correct decision values (ALLOWED, OVERCHARGED, NEEDS_REVIEW)
- [ ] Test with frontend

---

## 🐛 Common Issues

### Issue: Frontend shows "No verification results"
**Cause**: `verification_result` field is missing or null
**Fix**: Ensure field is included in response

### Issue: Parsing fails
**Cause**: Text format doesn't match expected pattern
**Fix**: Use one of the recommended formats above

### Issue: Numbers show as "₹0.00"
**Cause**: Amounts are strings instead of numbers
**Fix**: Ensure amounts are numeric in text (e.g., "₹500" or "500")

### Issue: Categories not showing
**Cause**: Category headers not detected
**Fix**: Use "CATEGORY: NAME" format

---

## 📞 Quick Help

### Need to Change Format?
Contact frontend team - parser can be adjusted to match your format

### Want to Use JSON Instead?
Return structured JSON object - frontend will auto-detect it

### Have Questions?
Check `RESULT_PAGE_IMPLEMENTATION.md` for full documentation

---

**Status**: ✅ Backend is already compatible
**Action Required**: ❌ None (optional improvements available)
**Frontend Ready**: ✅ Yes
