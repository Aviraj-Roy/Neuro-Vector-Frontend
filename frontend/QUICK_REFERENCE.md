# Quick Reference - What Changed

## 🎯 Summary
Updated frontend to send **hospital name** (instead of ID) to backend API at `http://localhost:8001/upload`

---

## 📝 Files Modified

### 1. `src/services/api.js`
**Line 46:** Changed FormData field from `hospital_id` to `hospital`
```javascript
// BEFORE
formData.append('hospital_id', hospitalId);

// AFTER
formData.append('hospital', hospitalName);
```

### 2. `src/pages/UploadPage.jsx`
**Line 162:** Changed MenuItem value from `hospital.id` to `hospital.name`
```jsx
// BEFORE
<MenuItem key={hospital.id} value={hospital.id}>

// AFTER
<MenuItem key={hospital.id} value={hospital.name}>
```

---

## 🔌 Backend API Expectations

**Endpoint:** `POST http://localhost:8001/upload`

**Request Body (multipart/form-data):**
- `file`: PDF file (binary)
- `hospital`: Hospital name (string, e.g., "Apollo Hospital")

**Response:**
```json
{
  "billId": "unique-id",
  "status": "UPLOADED"
}
```

---

## ✅ What Works Now

1. User selects hospital → Stores **hospital name** (e.g., "Apollo Hospital")
2. User uploads PDF → Stores file object
3. User clicks submit → Sends to backend:
   - `file`: PDF binary data
   - `hospital`: "Apollo Hospital"
4. Backend returns billId → Frontend navigates to `/status/{billId}`

---

## 🚀 How to Run

### Terminal 1: Backend
```bash
# Run your backend on port 8001
python -m uvicorn main:app --reload --port 8001
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

### Browser
Open: `http://localhost:3000`

---

## 🧪 Test It

1. ✅ Select a hospital from dropdown
2. ✅ Upload a PDF file
3. ✅ Click "Upload and Verify"
4. ✅ Check browser Network tab → Should see POST to `/api/upload`
5. ✅ Backend should receive file + hospital name
6. ✅ Should redirect to status page

---

## 📚 Documentation Created

1. **API_INTEGRATION_SUMMARY.md** - Detailed changes and setup
2. **UPLOAD_FLOW_DIAGRAM.md** - Visual flow diagram
3. **QUICK_REFERENCE.md** - This file (quick lookup)

---

**Ready to test!** The code is waiting for you to run it. 🎉
