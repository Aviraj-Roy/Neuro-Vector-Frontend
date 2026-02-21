# Upload Flow Diagram

## Complete Data Flow: Frontend → Backend

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTION                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    1. Select Hospital (Dropdown)
                       Example: "Apollo Hospital"
                                │
                                ▼
                    2. Upload PDF File
                       Example: "medical_bill.pdf"
                                │
                                ▼
                    3. Click "Upload and Verify"
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                          │
│                    http://localhost:3000                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    UploadPage.jsx
                    ├─ selectedFile: File object
                    ├─ selectedHospital: "Apollo Hospital"
                    └─ Calls: uploadBill(file, hospitalName)
                                │
                                ▼
                    api.js - uploadBill()
                    ├─ Creates FormData
                    ├─ Appends: file → PDF file
                    ├─ Appends: hospital → "Apollo Hospital"
                    └─ POST /api/upload
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    VITE DEV PROXY                                   │
│                    (vite.config.js)                                 │
└─────────────────────────────────────────────────────────────────────┘
                                │
                    Rewrites: /api/upload → /upload
                    Proxies to: http://localhost:8001
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND API (FastAPI)                            │
│                    http://localhost:8001                            │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    POST /upload
                    Receives:
                    ├─ file: [PDF binary data]
                    └─ hospital: "Apollo Hospital"
                                │
                                ▼
                    Backend Processing
                    ├─ Save file
                    ├─ Extract text (OCR)
                    ├─ Store in database
                    └─ Generate billId
                                │
                                ▼
                    Response:
                    {
                      "billId": "abc123xyz",
                      "status": "UPLOADED"
                    }
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FRONTEND RESPONSE HANDLING                       │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    UploadPage.jsx
                    ├─ Receives: { billId: "abc123xyz" }
                    └─ Navigates to: /status/abc123xyz
                                │
                                ▼
                    StatusPage.jsx
                    ├─ Starts polling: GET /status/abc123xyz
                    ├─ Updates every 3 seconds
                    └─ Shows progress tracker
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         USER SEES PROGRESS                          │
│                    Real-time status updates                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Request Details

### HTTP Request to Backend

```http
POST http://localhost:8001/upload HTTP/1.1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="file"; filename="medical_bill.pdf"
Content-Type: application/pdf

[Binary PDF data here]
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="hospital"

Apollo Hospital
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

### Expected Backend Response

```json
{
  "billId": "unique-identifier-123",
  "status": "UPLOADED"
}
```

---

## Code Flow

### 1. UploadPage.jsx (Line 103)
```javascript
const response = await uploadBill(selectedFile, selectedHospital);
//                                 ↑                ↑
//                                 File object      "Apollo Hospital"
```

### 2. api.js (Lines 43-46)
```javascript
export const uploadBill = async (file, hospitalName) => {
    const formData = new FormData();
    formData.append('file', file);              // PDF file
    formData.append('hospital', hospitalName);   // "Apollo Hospital"
    // ...
};
```

### 3. Backend Receives
```python
# Your backend should receive:
file: UploadFile        # The PDF file
hospital: str           # "Apollo Hospital"
```

---

## Key Points

✅ **Field name:** `hospital` (not `hospital_id` or `hospital_name`)  
✅ **Value type:** Hospital name as string (e.g., "Apollo Hospital")  
✅ **File field:** `file` containing the PDF binary data  
✅ **Endpoint:** `http://localhost:8001/upload`  
✅ **Method:** POST with multipart/form-data  

---

## Testing Checklist

- [ ] Backend running on port 8001
- [ ] Frontend running on port 3000
- [ ] Can select hospital from dropdown
- [ ] Can upload PDF file
- [ ] Submit button enabled when both selected
- [ ] Network request shows in browser DevTools
- [ ] Backend receives file and hospital name
- [ ] Backend returns billId
- [ ] Frontend navigates to /status/{billId}
- [ ] Status page starts polling

---

Ready to test! 🚀
