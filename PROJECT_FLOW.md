# Project Flow

## End-to-End Execution Flow

```mermaid
flowchart TD
    A[index.html] --> B[frontend/src/main.jsx]
    B --> C[frontend/src/App.jsx]
    C --> D[frontend/src/components/Layout.jsx]

    D --> E[/upload -> frontend/src/pages/UploadPage.jsx/]
    D --> F[/dashboard -> frontend/src/pages/DashboardPage.jsx/]
    D --> G[/status/:uploadId -> frontend/src/pages/StatusPage.jsx/]
    D --> H[/bill/:uploadId -> frontend/src/pages/ResultPage.jsx/]

    E --> E1[frontend/src/services/api.js::uploadBill]
    E1 --> E2[POST /upload]
    E2 --> E3[backend/app/api/routes.py::upload_bill]
    E3 --> E4[backend/app/services/upload_pipeline.py::handle_pdf_upload]
    E4 --> E5[(Mongo enqueue/create via backend/app/db/mongo_client.py)]
    E5 --> E6[Queue worker backend/app/services/upload_pipeline.py]

    E6 --> P1[backend/app/main.py::process_bill]
    P1 --> P2[pdf_to_images -> backend/app/ingestion/pdf_loader.py]
    P2 --> P3[preprocess_image -> backend/app/ocr/image_preprocessor.py]
    P3 --> P4[run_ocr -> backend/app/ocr/paddle_engine.py]
    P4 --> P5[extract_bill_data -> backend/app/extraction/bill_extractor.py]
    P5 --> P6[complete_bill -> backend/app/db/mongo_client.py]

    P6 --> V1[verify_bill_from_mongodb_sync -> backend/app/verifier/api.py]
    V1 --> V2[BillVerifier.verify_bill -> backend/app/verifier/verifier.py]
    V2 --> V3[save_verification_result -> backend/app/db/mongo_client.py]

    F --> F1[useAllBillsPolling -> frontend/src/hooks/useAllBillsPolling.js]
    F1 --> F2[getAllBills -> frontend/src/services/api.js]
    F2 --> F3[GET /bills]
    F3 --> F4[backend/app/api/routes.py::list_bills]

    G --> G1[useBillPolling -> frontend/src/hooks/useBillPolling.js]
    G1 --> G2[getUploadStatus -> frontend/src/services/api.js]
    G2 --> G3[GET /status/:uploadId]
    G3 --> G4[backend/app/api/routes.py::get_upload_status]

    H --> H1[getBillData -> frontend/src/services/api.js]
    H1 --> H2[GET /bill/:id]
    H2 --> H3[backend/app/api/routes.py::get_bill_details]
    H3 --> H4[Result rendering -> frontend/src/components/results/*]

    H --> H5[Save edits -> patchBillLineItems]
    H5 --> H6[PATCH /bill/:id/line-items]
    H6 --> H7[backend/app/api/routes.py::patch_bill_line_items]
    H7 --> H8[save_line_item_edits -> backend/app/db/mongo_client.py]
```

## Frontend Route to API Map

| Frontend Route | Main File | API Calls |
| --- | --- | --- |
| `/upload` | `frontend/src/pages/UploadPage.jsx` | `POST /upload` |
| `/dashboard` | `frontend/src/pages/DashboardPage.jsx` | `GET /bills`, `DELETE /bills/:id` (or fallback `/bill/:id`) |
| `/status/:uploadId` | `frontend/src/pages/StatusPage.jsx` | `GET /status/:uploadId` |
| `/bill/:uploadId` | `frontend/src/pages/ResultPage.jsx` | `GET /bill/:uploadId`, `PATCH /bill/:uploadId/line-items` |

## Backend API Entry Chain

1. `backend/server.py` starts FastAPI app.
2. It loads routes from `backend/app/api/routes.py`.
3. Startup event starts queue worker in `backend/app/services/upload_pipeline.py`.
4. Uploads are processed asynchronously by worker, then verification is auto-run.

## Notes

- Frontend base URL is `/api` in `frontend/src/services/api.js`.
- Vite dev proxy rewrites `/api/*` to backend `http://127.0.0.1:8001/*` via `frontend/vite.config.js`.
- Current UX goes upload -> dashboard immediately after submit, while status page remains available by route.
