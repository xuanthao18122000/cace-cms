# CACE CMS

Trang quản trị của CACE — nền tảng luyện giải case kinh doanh, cuộc thi và ghép đội.
Giai đoạn 1: đăng nhập, dashboard, quản lý người dùng, vai trò, hồ sơ cá nhân.
Giai đoạn 2: thư viện case (soạn đề, xuất bản) và danh mục case (lĩnh vực, ngành, level).
Giai đoạn 3: cấu hình làm bài, tiêu chí chấm, dẫn giải mẫu của case; xem bài nộp của người học (chưa chấm).

Hợp đồng API: [`../API-CONTRACT.md`](../API-CONTRACT.md) (nguồn sự thật).

## Công nghệ

- Vite + React 19 + TypeScript (strict), react-router-dom v7 (data router, cần cho `useBlocker`)
- @tanstack/react-query: dữ liệu máy chủ, tự làm mới cache sau mỗi thay đổi
- react-hook-form + zod: form và kiểm tra dữ liệu
- lucide-react (icon), date-fns (định dạng ngày, tiếng Việt), clsx
- Tiptap v3: trình soạn nội dung case (`src/components/editor/`), nằm trong gói tải lười của trang sửa case
- CSS thuần theo design token (`src/styles/tokens.css`), font Be Vietnam Pro, màu chính `#1238D6`

## Chạy local

Yêu cầu Node 20+ và pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:5180
```

Vite proxy (xem `vite.config.ts`):

| Đường dẫn | Đích mặc định | Biến đổi đích |
|---|---|---|
| `/api/uploads/*`, `/uploads/*` | `http://localhost:4002` | `VITE_UPLOAD_PROXY` |
| `/api/*` | `http://localhost:4000` | `VITE_API_PROXY` |

Nút "Xem trên web" của case mở `${VITE_WEB_URL}/ren-luyen/<slug>` (mặc định `http://localhost:3100`).

FE luôn gọi cùng origin nên cookie refresh `cace_refresh` (path `/api/auth`) đi kèm tự nhiên.

Tài khoản dev (seed của cace-api): `admin@cace.local` / `Admin@123`, `mentor@cace.local` / `Mentor@123`.
Khi chạy dev, trang đăng nhập có nút đăng nhập nhanh bằng các tài khoản này.

## Lệnh

| Lệnh | Việc |
|---|---|
| `pnpm dev` | Chạy dev server cổng 5180 |
| `pnpm build` | Kiểm tra kiểu (`tsc -b`) rồi build ra `dist/` |
| `pnpm lint` | ESLint |
| `pnpm preview` | Xem bản build |

## Cấu trúc

```
src/
  api/            fetch client (bóc envelope, ApiError + lỗi theo trường, refresh 401 một lần), token, các API
  components/
    ui/           bộ component tự dựng: Button, Form, Table, Pagination, Drawer/Dialog, Select, Menu…
    layout/       AppLayout (sidebar thu gọn được, off-canvas trên điện thoại), RouteGuards, nav
    editor/       RichTextEditor (Tiptap): thanh công cụ, chèn ảnh / liên kết / bảng
  contexts/       AuthProvider (khôi phục phiên bằng cookie refresh), ToastProvider
  hooks/          useDebounce, useIsAdmin, truy vấn dùng chung
  lib/            QueryClient + khoá cache, tiện ích form (schema mật khẩu, gắn lỗi máy chủ vào trường)
  pages/          auth/, users/, roles/, cases/, case-taxonomies/, submissions/, Dashboard, Profile, 404
  styles/         tokens, base, components, layout, auth, pages
```

## Phân quyền

- Đăng nhập qua `POST /api/auth/cms/login`; vai `user` (người học) bị chặn với thông báo
  "Tài khoản không có quyền vào trang quản trị".
- Chưa có RBAC: chỉ vai `admin` thấy và vào được Người dùng, Vai trò.
- Nhóm Nội dung (Thư viện case, Danh mục case, Bài nộp) dành cho vai `admin` và `mentor`.
- Vai khác chỉ có Dashboard và Hồ sơ.
- Không tự khoá, tự xoá, tự đổi vai của chính mình (nút bị khoá trên dòng của bạn).

## Docker

Build tĩnh rồi phục vụ bằng nginx; nginx proxy `/api`, `/api/uploads`, `/uploads` và fallback SPA.

```bash
docker build -t cace-cms .
docker run -p 8080:80 \
  -e API_UPSTREAM=http://cace-api:4000 \
  -e UPLOAD_UPSTREAM=http://cace-upload:4002 \
  cace-cms
```

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `API_UPSTREAM` | `http://cace-api:4000` | Đích của `/api/*` |
| `UPLOAD_UPSTREAM` | `http://cace-upload:4002` | Đích của `/api/uploads/*` và `/uploads/*` |
| `NGINX_RESOLVER` | `127.0.0.11` | DNS phân giải tên upstream (DNS nội bộ của Docker) |

Đặt `CMS_URL` của cace-api trỏ về địa chỉ CMS để link đặt lại mật khẩu trong email mở đúng `/reset-password?token=...`.
