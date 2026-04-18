# VDT Live

A full-stack live streaming platform using **Spring Boot + React + MediaMTX**.

---

## 🇻🇳 Tiếng Việt

### Giới thiệu
VDT Live là dự án livestream gồm:
- **Backend**: Spring Boot (REST API, JWT, PostgreSQL)
- **Frontend**: React + Vite + TypeScript
- **Streaming server**: MediaMTX (RTMP + WebRTC/WHIP)

### Tính năng chính
- Đăng ký / đăng nhập tài khoản
- Tạo phiên livestream
- Phát sóng bằng:
  - Phần mềm RTMP (OBS, XSplit, ...)
  - Webcam/chia sẻ màn hình trực tiếp từ trình duyệt (WebRTC/WHIP)
- Xem livestream theo `streamId`
- Quản lý stream của tôi (xem, cập nhật, xoá)
- Danh sách stream có phân trang theo cursor

### Kiến trúc
- `backend/`: API và logic nghiệp vụ
- `frontend/`: Giao diện người dùng
- `mediamtx.yml`: Cấu hình máy chủ MediaMTX

### Yêu cầu
- Java 17
- Maven Wrapper (`./mvnw`)
- Node.js 18+ và `pnpm`
- PostgreSQL
- MediaMTX

### Cấu hình môi trường

#### Backend
File cấu hình: `backend/src/main/resources/application.yml`
- Database mặc định:
  - `jdbc:postgresql://localhost:5432/vdt_live`
  - username: `postgres`
  - password: `admin`
- Port backend: `8080`

#### Frontend
Tạo file `.env` từ `frontend/.env.example`:

```bash
cp /home/runner/work/vdt-live/vdt-live/frontend/.env.example /home/runner/work/vdt-live/vdt-live/frontend/.env
```

Biến môi trường quan trọng:
- `VITE_API_BASE_URL` (mặc định: `http://localhost:8080/api`)
- `VITE_STREAM_SERVER_URL` (mặc định: `http://localhost:8888`)

### Cách chạy dự án (local)

#### 1) Chạy MediaMTX
```bash
mediamtx /home/runner/work/vdt-live/vdt-live/mediamtx.yml
```

#### 2) Chạy backend
```bash
cd /home/runner/work/vdt-live/vdt-live/backend
chmod +x mvnw
./mvnw spring-boot:run
```

#### 3) Chạy frontend
```bash
cd /home/runner/work/vdt-live/vdt-live/frontend
pnpm install
pnpm dev
```

Frontend mặc định chạy ở `http://localhost:5173`.

### Kiểm tra nhanh
- Frontend lint + build:
```bash
cd /home/runner/work/vdt-live/vdt-live/frontend
pnpm lint
pnpm build
```

- Backend test:
```bash
cd /home/runner/work/vdt-live/vdt-live/backend
./mvnw test
```

### Quy trình sử dụng
1. Đăng ký/đăng nhập
2. Tạo stream mới
3. Chọn cách phát:
   - Dùng URL RTMP để phát từ OBS
   - Hoặc phát trực tiếp từ webcam/screen trong trình duyệt
4. Chia sẻ link xem: `/stream/watch/{streamId}`

---

## 🇬🇧 English

### Overview
VDT Live is a live streaming project composed of:
- **Backend**: Spring Boot (REST API, JWT, PostgreSQL)
- **Frontend**: React + Vite + TypeScript
- **Streaming server**: MediaMTX (RTMP + WebRTC/WHIP)

### Main features
- User registration and login
- Stream creation
- Broadcasting via:
  - RTMP software (OBS, XSplit, etc.)
  - Browser webcam/screen sharing (WebRTC/WHIP)
- Watch streams by `streamId`
- Manage your own streams (view, update, delete)
- Cursor-based stream listing

### Architecture
- `backend/`: API and business logic
- `frontend/`: user interface
- `mediamtx.yml`: MediaMTX server configuration

### Requirements
- Java 17
- Maven Wrapper (`./mvnw`)
- Node.js 18+ and `pnpm`
- PostgreSQL
- MediaMTX

### Environment configuration

#### Backend
Configuration file: `backend/src/main/resources/application.yml`
- Default database:
  - `jdbc:postgresql://localhost:5432/vdt_live`
  - username: `postgres`
  - password: `admin`
- Backend port: `8080`

#### Frontend
Create `.env` from `frontend/.env.example`:

```bash
cp /home/runner/work/vdt-live/vdt-live/frontend/.env.example /home/runner/work/vdt-live/vdt-live/frontend/.env
```

Important variables:
- `VITE_API_BASE_URL` (default: `http://localhost:8080/api`)
- `VITE_STREAM_SERVER_URL` (default: `http://localhost:8888`)

### Run locally

#### 1) Start MediaMTX
```bash
mediamtx /home/runner/work/vdt-live/vdt-live/mediamtx.yml
```

#### 2) Start backend
```bash
cd /home/runner/work/vdt-live/vdt-live/backend
chmod +x mvnw
./mvnw spring-boot:run
```

#### 3) Start frontend
```bash
cd /home/runner/work/vdt-live/vdt-live/frontend
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:5173` by default.

### Quick validation
- Frontend lint + build:
```bash
cd /home/runner/work/vdt-live/vdt-live/frontend
pnpm lint
pnpm build
```

- Backend tests:
```bash
cd /home/runner/work/vdt-live/vdt-live/backend
./mvnw test
```

### Typical flow
1. Register/login
2. Create a stream
3. Choose a publishing method:
   - Use the RTMP URL in OBS
   - Or stream directly from browser webcam/screen share
4. Share watch URL: `/stream/watch/{streamId}`
