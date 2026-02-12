# Backend API Integration - Changes Summary

## Overview
Updated the frontend to integrate with the backend API at `http://localhost:8001/upload`.

## Changes Made

### 1. Updated API Service (`src/services/api.js`)
**Changed:** The `uploadBill` function now sends the **hospital name** instead of hospital ID.

**Before:**
```javascript
export const uploadBill = async (file, hospitalId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital_id', hospitalId);
    // ...
};
```

**After:**
```javascript
export const uploadBill = async (file, hospitalName) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('hospital', hospitalName);
    // ...
};
```

**Key Changes:**
- Parameter renamed: `hospitalId` → `hospitalName`
- FormData field renamed: `hospital_id` → `hospital`
- Now sends the hospital name as expected by the backend

---

### 2. Updated Upload Page (`src/pages/UploadPage.jsx`)
**Changed:** The hospital dropdown now stores and passes the **hospital name** instead of ID.

**Before:**
```jsx
<MenuItem key={hospital.id} value={hospital.id}>
    {hospital.name}
</MenuItem>
```

**After:**
```jsx
<MenuItem key={hospital.id} value={hospital.name}>
    {hospital.name}
</MenuItem>
```

**Key Changes:**
- MenuItem value changed from `hospital.id` to `hospital.name`
- The `selectedHospital` state now contains the hospital name
- When submitting, the hospital name is passed to `uploadBill()`

---

## Backend API Requirements

The frontend now sends data to `http://localhost:8001/upload` with:

**Request Format:**
- **Method:** POST
- **Content-Type:** multipart/form-data
- **Fields:**
  - `file`: The uploaded PDF file
  - `hospital`: The name of the selected hospital (string)

**Example Request:**
```
POST http://localhost:8001/upload
Content-Type: multipart/form-data

file: [binary PDF data]
hospital: "Apollo Hospital"
```

---

## Proxy Configuration

The Vite dev server is already configured to proxy API requests:

**File:** `vite.config.js`
```javascript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8001',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

**How it works:**
- Frontend makes request to: `api/upload`
- Vite proxies to: `http://localhost:8001/upload`
- This avoids CORS issues during development

---

## Testing the Integration

### 1. Start the Backend
Ensure your backend is running on port 8001:
```bash
# Example command (adjust based on your backend setup)
python -m uvicorn main:app --reload --port 8001
```

### 2. Start the Frontend
```bash
cd frontend
npm run dev
```

### 3. Test the Upload Flow
1. Open `http://localhost:3000`
2. Select a hospital from the dropdown
3. Upload a PDF file
4. Click "Upload and Verify"
5. The frontend will send:
   - The PDF file
   - The hospital name (e.g., "Apollo Hospital")
6. Backend should receive both and return a `billId`

---

## Expected Backend Response

The backend should return:
```json
{
  "billId": "unique-bill-id-123",
  "status": "UPLOADED"
}
```

The frontend will then:
1. Extract the `billId` from the response
2. Navigate to `/status/{billId}`
3. Start polling for status updates

---

## Files Modified

1. ✅ `src/services/api.js` - Updated `uploadBill()` function
2. ✅ `src/pages/UploadPage.jsx` - Updated hospital selection logic

---

## No Changes Required

The following files already work correctly and need no changes:
- ✅ `vite.config.js` - Proxy already configured for port 8001
- ✅ `.env` - API base URL already set to `/api`
- ✅ Other API functions (getBillStatus, getBillData, getHospitals)

---

## Ready to Test! 🚀

The frontend is now configured to work with your backend API. When you run the code:

1. **Frontend:** `npm run dev` (runs on port 3000)
2. **Backend:** Your backend on port 8001
3. **Upload:** Select hospital + upload PDF → sends to `http://localhost:8001/upload`
4. **Data sent:** 
   - `file`: PDF file
   - `hospital`: Hospital name (e.g., "Apollo Hospital")

---

## Troubleshooting

### If upload fails:
1. **Check backend is running:** `http://localhost:8001` should be accessible
2. **Check browser console:** Look for network errors
3. **Check backend logs:** Verify it's receiving the request
4. **Verify field names:** Backend expects `file` and `hospital` fields

### Common issues:
- **CORS errors:** Make sure backend allows requests from `http://localhost:3000`
- **Field name mismatch:** Backend must expect `hospital` (not `hospital_id` or `hospital_name`)
- **File size limits:** Default frontend limit is 10MB

---

## Next Steps

Once you run the code and test the upload:
1. Verify the backend receives the file and hospital name
2. Check that a billId is returned
3. Confirm the status page polls correctly
4. Test the complete verification flow

Let me know if you encounter any issues! 🎉
