# Huawei Subscriber & Usage Management API

Backend RESTful API modular berbasis **Node.js** dan **Express.js** yang terhubung ke database **PostgreSQL**. Sistem ini dirancang untuk mengelola data pelanggan telekomunikasi (*subscribers*), memonitor dan menganalisis metrik penggunaan jaringan (*call minutes, SMS, data MB*), serta mengotomatisasi ekspor laporan ke file CSV secara berkala (*cron job*).

---

## 📌 Daftar Isi
- [Teknologi & Dependensi](#-teknologi--dependensi)
- [Arsitektur Proyek](#-arsitektur-proyek)
- [Struktur Folder](#-struktur-folder)
- [Prasyarat & Instalasi](#-prasyarat--instalasi)
- [Konfigurasi Lingkungan (.env)](#-konfigurasi-lingkungan-env)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Dokumentasi API Endpoint](#-dokumentasi-api-endpoint)
  - [Health Check](#1-health-check)
  - [Subscriber Management](#2-subscriber-management-apisubscribers)
  - [Usage Subscriber & Analitik](#3-usage-subscriber--analitik-apiusage-subscribers)
  - [Manajemen Ekspor CSV](#4-manajemen-ekspor-csv)
- [Fitur Otomatisasi Cron Job](#-fitur-otomatisasi-cron-job)
- [Skema Basis Data](#-skema-basis-data)

---

## 🚀 Teknologi & Dependensi

| Kategori | Teknologi / Package | Versi | Deskripsi |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `>= 18.x` | JavaScript runtime environment (mendukung native `--watch`) |
| **Framework** | `express` | `^4.21.2` | Framework routing HTTP, middleware, dan API handling |
| **Database Client** | `pg` (node-postgres) | `^8.13.3` | Driver client PostgreSQL dengan connection pooling |
| **Task Scheduler** | `node-cron` | `^3.0.3` | Eksekutor cron job terjadwal di latar belakang |
| **Config Loader** | `dotenv` | `^16.4.7` | Manajemen environment variables dari file `.env` |
| **Database Engine**| PostgreSQL | `>= 14.x` | Relational database untuk penyimpanan data transaksi dan log |

---

## 🏛️ Arsitektur Proyek

Proyek ini menerapkan **Layered Architecture (Separation of Concerns)** agar kode mudah diuji, dirawat, dan dikembangkan:

```
[ HTTP Request ]
       │
       ▼
 ┌───────────┐
 │  Router   │   Mendefinisikan endpoint URL dan method HTTP
 └─────┬─────┘
       ▼
 ┌───────────┐
 │Controller │   Menangani parsing request, validasi format, dan response HTTP
 └─────┬─────┘
       ▼
 ┌───────────┐
 │  Service  │   Menjalankan business logic, aturan validasi data, dan logika domain
 └─────┬─────┘
       ▼
 ┌───────────┐
 │Repository │   Layer abstraksi akses data ke database (Pool queries)
 └─────┬─────┘
       ▼
 ┌───────────┐
 │   Query   │   Kumpulan raw SQL query terisolasi dan parameterized (Anti-SQL Injection)
 └─────┬─────┘
       ▼
[ PostgreSQL ]
```

---

## 📂 Struktur Folder

```text
subscriber-usage-management-api/
├── .env.example                     # Contoh template konfigurasi environment
├── db/
│   └── huawei.backup                # File cadangan/dump PostgreSQL
├── package.json                     # Konfigurasi dependensi dan script npm
├── pnpm-lock.yaml                   # Lockfile dependensi pnpm
├── src/
│   ├── app.js                       # Entry point aplikasi Express & middleware global
│   ├── config/
│   │   └── db.js                    # Konfigurasi PostgreSQL Connection Pool
│   ├── cron/
│   │   └── usageCron.js             # Scheduler cron job & fungsi ekspor CSV
│   ├── csv-exports/                 # Direktori output penyimpanan file CSV
│   ├── src-api-subscriber/          # Modul Pelanggan (Subscriber)
│   │   ├── subController.js
│   │   ├── subQuery.js
│   │   ├── subRepository.js
│   │   ├── subRouter.js
│   │   └── subServices.js
│   └── src-api-usage-subscriber/    # Modul Pemakaian & Analitik (Usage)
│       ├── usageController.js
│       ├── usageQuery.js
│       ├── usageRepository.js
│       ├── usageRouter.js
│       └── usageServices.js
└── README.md
```

---

## ⚙️ Prasyarat & Instalasi

### 1. Prasyarat
- **Node.js** versi 18.11.0 atau lebih tinggi
- **pnpm** (atau npm / yarn)
- **PostgreSQL** sudah terpasang dan berjalan

### 2. Kloning & Pasang Dependensi
```bash
# Masuk ke direktori proyek
cd subscriber-usage-management-api

# Install dependensi menggunakan pnpm (atau npm install)
pnpm install
```

### 3. Restore Database PostgreSQL
Buat database baru di PostgreSQL (misal `dbdev_huwawei`), lalu restore dari file backup di folder `db/`:
```bash
# Menggunakan pg_restore (sesuaikan user, port, dan nama database)
pg_restore -U postgres -h localhost -p 5432 -d dbdev_huwawei -v db/huawei.backup
```

---

## 🔐 Konfigurasi Lingkungan (.env)

Salin file `.env.example` menjadi `.env` lalu sesuaikan kredensial database Anda:

```bash
cp .env.example .env
```

Isi file `.env`:
```env
PORT=8085
DB_HOST=localhost
DB_NAME=dbdev_huwawei
DB_USER=postgres
DB_PASSWORD=password_postgres_anda
DB_PORT=5432
```

---

## 🏃 Menjalankan Aplikasi

```bash
# Menjalankan mode development (auto-reload via Node.js native --watch)
pnpm dev
# atau: npm run dev

# Menjalankan mode production
pnpm start
# atau: npm start
```

Jika server berhasil berjalan, Anda akan melihat log:
```text
Server is running on http://localhost:8085
[CRON] Usage Subscriber CSV export cron job initialized for 08:00, 12:00, 15:00 WIB (Retention: 30 days).
```

---

## 📖 Dokumentasi API Endpoint

Base URL default: `http://localhost:8085`

### Master data plan 

#### `GET /api/subscribers/plan`
Mengambil semua data plan subscriber.
- **Response `200 OK`**:

```json
{
    "success": true,
    "message": "Subscriber Plan retrieved successfully",
    "data": [
        {
            "pk_huawei_subscriber_plan_id": "1",
            "plan": "Basic"
        },
        {
            "pk_huawei_subscriber_plan_id": "2",
            "plan": "Premium"
        },
        {
            "pk_huawei_subscriber_plan_id": "3",
            "plan": "Family"
        }
    ]
}
```

### 1. Health Check

#### `GET /health`
Mengecek status ketersediaan API.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Huawei Subscriber Management API is healthy",
  "timestamp": "2026-10-14T05:15:00.000Z"
}
```

---

### 2. Subscriber Management (`/api/subscribers`)

#### `GET /api/subscribers`
Mengambil semua data subscriber beserta nama paket langganannya.
- **Response `200 OK`**:
```json
{
    "success": true,
    "message": "Subscribers retrieved successfully",
    "data": [
        {
            "pk_huawei_subscriber_id": "1",
            "id": "SUB01",
            "name": "Amir",
            "fk_huawei_subscriber_plan_id": 1,
            "plan": "Basic",
            "activation_date": "2023-01-11T17:00:00.000Z",
            "created_date": "2026-10-13T03:53:40.667Z",
            "lastupdate_date": "2026-10-13T03:53:40.667Z"
        },
        {
            "pk_huawei_subscriber_id": "2",
            "id": "SUB02",
            "name": "Sari",
            "fk_huawei_subscriber_plan_id": 2,
            "plan": "Premium",
            "activation_date": "2022-05-21T17:00:00.000Z",
            "created_date": "2026-10-13T03:54:26.498Z",
            "lastupdate_date": "2026-10-13T03:54:26.498Z"
        }
  ]
}
```

#### `GET /api/subscribers/plan`
Mengambil daftar seluruh paket langganan yang tersedia.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Subscriber Plan retrieved successfully",
  "data": [
    {
      "pk_huawei_subscriber_plan_id": 1,
      "plan": "Basic"
    },
    {
      "pk_huawei_subscriber_plan_id": 2,
      "plan": "Premium"
    }
  ]
}
```

#### `GET /api/subscribers/:id`
Mengambil detail subscriber berdasarkan Primary Key (`pk_huawei_subscriber_id`).
- **Parameter URL**: `id` (integer)
- **Response `200 OK`** | **`404 Not Found`**

#### `POST /api/subscribers`
Menambahkan data subscriber baru.
- **Request Body (JSON)**:
```json

#### Example POST
{
    "id": "SUB07",
    "name": "Fajar",
    "plan": "1",
    "activation_date": "2024-01-23"
}

#### Example Success Response
{
    "success": true,
    "message": "Subscriber created successfully",
    "data": {
        "pk_huawei_subscriber_id": "7",
        "id": "SUB07",
        "name": "Fajar",
        "fk_huawei_subscriber_plan_id": 1,
        "activation_date": "2024-01-23T17:00:00.000Z",
        "created_date": "2026-10-13T07:50:20.810Z",
        "lastupdate_date": "2026-10-13T07:50:20.810Z"
    }
}


```
> **Aturan Validasi**:
> - `id`: Wajib diisi, string, maksimal 50 karakter.
> - `name`: Wajib diisi, string, maksimal 50 karakter.
> - `plan`: Wajib diisi (misal: "Premium", "Basic"), harus sesuai data paket.
> - `activation_date`: Opsional, format harus `YYYY-MM-DD`.

#### `PUT /api/subscribers/:id`
Memperbarui data subscriber yang sudah ada.
- **Parameter URL**: `id` (integer)
- **Request Body (JSON)**: Minimal menyertakan salah satu field yang ingin diubah (`id`, `name`, `plan`, `activation_date`).

#### Example POST
```json
{
    "id": "SUB07",
    "name": "Fajar",
    "plan": "2",
    "activation_date": "2024-01-22"
}
```

#### Example Success Response
```json
{
    "success": true,
    "message": "Subscriber updated successfully",
    "data": {
        "pk_huawei_subscriber_id": "7",
        "id": "SUB07",
        "name": "Fajar",
        "fk_huawei_subscriber_plan_id": 2,
        "activation_date": "2024-01-22T17:00:00.000Z",
        "created_date": "2026-10-13T07:50:20.810Z",
        "lastupdate_date": "2026-10-13T07:51:03.592Z"
    }
}

#### `DELETE /api/subscribers/:id`
Menghapus data subscriber berdasarkan Primary Key (`pk_huawei_subscriber_id`).
- **Parameter URL**: `id` (integer)
- **Response `200 OK`**:
```json

### Example Response

{
  "success": true,
  "message": "Subscriber deleted successfully",
  "data": {
    "pk_huawei_subscriber_id": "8",
    "id": "SUB08",
    "name": "Aceng",
    "fk_huawei_subscriber_plan_id": 2,
    "activation_date": "2026-10-04T17:00:00.000Z",
    "created_date": "2026-10-14T02:45:46.814Z",
    "lastupdate_date": "2026-10-14T02:56:16.549Z"
  }
}
```

---

### 3. Usage Subscriber & Analitik (`/api/usage-subscribers`)

#### `POST /api/usage-subscribers`
Mencatat snapshot penggunaan jaringan (telepon, SMS, kuota internet).
- **Request Body (JSON)**:
```json

### Example POST

{
  "subscriberId": 8,
  "callMinutes": 28,
  "smsCount": 30,
  "dataUsageMB": 3200,
  "timestamp": "2026-10-05 08:00:00"
}

### Example Response
{
  "success": true,
  "message": "Usage subscriber record created successfully",
  "data": {
    "pk_huawei_usage_subscriber_id": "11",
    "fk_huawei_subscriber_id": 8,
    "call_minutes": 28,
    "sms_count": 30,
    "data_usage_mb": 3200,
    "timestamp": "2026-10-05T01:00:00.000Z",
    "subscriber_name": "Aceng",
    "subscriber_plan": "Premium"
  }
}

```
> **⚠️ Aturan Khusus Jam Snapshot**:
> - Jam pencatatan snapshot divalidasi ketat pada waktu **Asia/Jakarta (WIB)**.
> - Snapshot hanya diperbolehkan pada jam snapshot resmi: **`08:00:00`**, **`12:00:00`**, atau **`15:00:00` WIB**.

#### `GET /api/usage-subscribers`
Mengambil daftar 50 snapshot riwayat penggunaan terbaru beserta informasi subscriber dan paketnya.

#### Example GET
{
    "success": true,
    "message": "Recent usage records retrieved successfully",
    "data": [
        {
            "pk_huawei_usage_subscriber_id": "2",
            "fk_huawei_subscriber_id": 1,
            "subscriber_code": "SUB01",
            "subscriber_name": "Amir",
            "subscriber_plan": 1,
            "plan": "Basic",
            "call_minutes": 35,
            "sms_count": 8,
            "data_usage_mb": 1200,
            "timestamp": "2026-10-12T01:00:00.000Z"
        },
        {
            "pk_huawei_usage_subscriber_id": "8",
            "fk_huawei_subscriber_id": 6,
            "subscriber_code": "SUB06",
            "subscriber_name": "Nia",
            "subscriber_plan": 1,
            "plan": "Basic",
            "call_minutes": 25,
            "sms_count": 6,
            "data_usage_mb": 700,
            "timestamp": "2026-10-12T01:00:00.000Z"
        }
    ]
}

#### `GET /api/usage-subscribers/premium-data`
Menampilkan **Top 3** pengguna paket **Premium** dengan total konsumsi data (`data_usage_mb`) tertinggi.
- **Response `200 OK`**:
```json

### Example Response
{
    "success": true,
    "message": "Top 3 premium data usage records retrieved successfully",
    "data": [
        {
            "rank": "1",
            "subscriber": "Sari",
            "total_mb": "11800"
        },
        {
            "rank": "2",
            "subscriber": "Rian",
            "total_mb": "5000"
        },
        {
            "rank": "3",
            "subscriber": "Fajar",
            "total_mb": "5000"
        }
    ]
}

```

#### `GET /api/usage-subscribers/data-usage-premium`
Menghitung total akumulasi seluruh konsumsi data (MB) dari pelanggan yang berada pada paket **Premium**.
- **Response `200 OK`**:
```json

### Example Response

{
    "success": true,
    "message": "Data usage premium calculated successfully",
    "totalDataUsageMB": {
        "total_data_usage_mb": "21800"
    }
}
```

#### `GET /api/usage-subscribers/call-minutes-low-usage`
Mengambil daftar pelanggan dengan rata-rata durasi panggilan suara per snapshot yang tergolong rendah (**$\le 30$ menit**).
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Subscribers with average call duration ≤ 30 minutes retrieved successfully.",
  "data": [
    {
      "pk_huawei_subscriber_id": 5,
      "subscriber_id": "SUB-005",
      "subscriber": "Dewi Sartika",
      "average_call_minutes": "14",
      "total_snapshots": "8"
    }
  ]
}
```

---

### 4. Manajemen Ekspor CSV

#### `POST /api/usage-subscribers/export-csv`
Memicu (*trigger*) ekspor data penggunaan ke file CSV secara manual. File disimpan di direktori `src/csv-exports/`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "CSV export completed successfully (150 records)",
  "data": {
    "filename": "usage_subscriber_2026-10-14_12-00-00.csv",
    "rowCount": 150,
    "fileSizeBytes": 14230
  }
}
```

#### `GET /api/usage-subscribers/csv-files`
Melihat daftar seluruh file CSV yang tersedia di server beserta ukuran dan waktu pembuatannya.

#### `GET /api/usage-subscribers/download-csv/:filename`
Mengunduh file CSV tertentu berdasarkan nama file.
- **Parameter URL**: `filename` (contoh: `usage_subscriber_2026-10-14_12-00-00.csv`)
- **Headers**: `Content-Type: text/csv`, `Content-Disposition: attachment`

---

## ⏰ Fitur Otomatisasi Cron Job

Aplikasi dilengkapi dengan penjadwal tugas latar belakang menggunakan `node-cron` yang diinisialisasi secara otomatis saat server dijalankan ([`usageCron.js`](file:///c:/Users/Next%20Master/Documents/express/huawei/subscriber-usage-management-api/src/cron/usageCron.js)):

1. **Jadwal Ekspor Otomatis**:
   - Dijalankan setiap hari pada pukul **08:00 WIB**, **12:00 WIB**, dan **15:00 WIB** (`Asia/Jakarta`).
   - Hasil ekspor disimpan dengan format nama: `usage_subscriber_YYYY-MM-DD_HH-mm-ss.csv`.
2. **Auto-Purge & Retensi Data (30 Hari)**:
   - Setiap kali cron berjalan atau saat startup server, sistem memindai folder `src/csv-exports/`.
   - File CSV yang berusia lebih dari **30 hari** akan dihapus secara otomatis untuk mencegah kehabisan kapasitas media penyimpanan.

---

## 🗄️ Skema Basis Data

```mermaid
CREATE TABLE IF NOT EXISTS public.huawei_subscriber
(
    pk_huawei_subscriber_id bigserial PRIMARY KEY,
    id character varying(50) COLLATE pg_catalog."default" NOT NULL,
	name character varying(50) COLLATE pg_catalog."default" NOT NULL,
	fk_huawei_subscriber_plan_id integer,
	activation_date date,
    created_date timestamp with time zone,
    lastupdate_date timestamp with time zone
)

CREATE TABLE IF NOT EXISTS public.huawei_subscriber_plan
(
    pk_huawei_subscriber_plan_id bigserial PRIMARY KEY,
    plan character varying(50) COLLATE pg_catalog."default" NOT NULL
)

CREATE TABLE IF NOT EXISTS public.huawei_usage_subscriber
(
    pk_huawei_usage_subscriber_id bigserial PRIMARY KEY,
	fk_huawei_subscriber_id integer,
    call_minutes integer,
	sms_count integer,
	data_usage_mb integer,
	timestamp timestamp with time zone
)

```
