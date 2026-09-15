# DOTANI Frontend

Frontend React cho website DOTANI - hệ thống quản lý đoàn viên Đoàn TNCS Hồ Chí Minh Phường Thượng Cát.

Backend repository: https://github.com/nvtquang/dotani-be.git

## Mô tả

DOTANI cung cấp giao diện quản lý hồ sơ đoàn viên, tổ dân phố, sự kiện, bài viết/báo cáo hoạt động, chat realtime, thông báo, QR Banking cá nhân và dashboard dòng thời gian.

Frontend chỉ xử lý trải nghiệm người dùng và ẩn/hiện giao diện theo role. Bảo mật thật sự vẫn do backend enforce bằng JWT, RBAC và organization scope.

## Stack

- React 19
- Vite 7
- TypeScript
- React Router
- Axios
- TanStack Query
- STOMP WebSocket
- Lucide React
- CSS thuần trong `src/styles.css`

## Scope Frontend

Các màn hình chính:

| Route | Mục đích |
| --- | --- |
| `/login` | Đăng nhập tài khoản hệ thống hoặc Google |
| `/register` | Đăng ký đoàn viên |
| `/dashboard` | Dòng thời gian sự kiện và bài viết |
| `/profile` | Hồ sơ cá nhân, avatar, QR Banking |
| `/members` | Quản lý đoàn viên theo quyền |
| `/members/:id` | Chi tiết đoàn viên, phân quyền nếu được phép |
| `/organizations` | Quản lý tổ dân phố |
| `/events`, `/events/:id` | Danh sách/chi tiết sự kiện, phản hồi tham gia |
| `/posts`, `/posts/:id` | Bài viết và báo cáo hoạt động |
| `/chat` | Chat 1-1 và group chat realtime |
| `/notifications` | Thông báo |
| `/audit-logs` | Audit/phân quyền cho role được phép |

Role đang dùng:

- `WARD_SECRETARY`
- `WARD_DEPUTY_SECRETARY`
- `TDP_SECRETARY`
- `TDP_DEPUTY_SECRETARY`
- `MEMBER`

## Cài đặt

Yêu cầu:

- Node.js 20+
- npm
- Backend gateway chạy tại `http://localhost:8080`

Clone frontend:

```powershell
cd D:\Java
git clone https://github.com/nvtquang/dotani-fe.git
```

Cài package:

```powershell
npm install
```

Tạo file môi trường:

```powershell
Copy-Item .env.example .env
notepad .env
```

Nội dung tối thiểu:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_CHAT_WS_URL=ws://localhost:8080/ws/chat
```

Nếu dùng đăng nhập Google:

```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Trong Google Cloud Console, OAuth Client cần có Authorized JavaScript origin:

```text
http://localhost:5173
```

Chạy development:

```powershell
npm run dev
```

Mở trình duyệt:

```text
http://localhost:5173
```

Build production:

```powershell
npm run build
```

Preview bản build:

```powershell
npm run preview
```

## Chạy cùng Docker Compose

Docker Compose nằm ở backend root:

```powershell
cd D:\Java\HCMCYU
Copy-Item .env.example .env
docker compose up --build
```

Compose sẽ build frontend từ folder:

```text
D:\Java\HCMCYU-frontend
```

Frontend được serve tại:

```text
http://localhost:5173
```

Nếu đổi `VITE_*` trong `.env`, cần build lại frontend:

```powershell
docker compose up --build -d frontend
```

## Tài khoản mẫu

Seed development nằm ở backend và chỉ chạy với profile `dev`.

Mật khẩu mặc định:

```text
Demo@12345
```

Một số tài khoản hay dùng:

| Username | Email | Role |
| --- | --- | --- |
| `admin` | `admin@hcmcyu.local` | `WARD_SECRETARY` |
| `ward.secretary` | `ward.secretary@hcmcyu.local` | `WARD_SECRETARY` |
| `ward.deputy` | `ward.deputy@hcmcyu.local` | `WARD_DEPUTY_SECRETARY` |
| `tdp1.secretary` | `tdp1.secretary@hcmcyu.local` | `TDP_SECRETARY` |
| `tdp1.deputy` | `tdp1.deputy@hcmcyu.local` | `TDP_DEPUTY_SECRETARY` |
| `tdp1.member1` | `tdp1.member1@hcmcyu.local` | `MEMBER` |

Các tài khoản TDP khác theo quy ước:

```text
tdp2.secretary
tdp2.deputy
tdp2.member1
...
tdp5.secretary
tdp5.deputy
tdp5.member5
```

## Cấu trúc thư mục

```text
src/
  api/          # Axios, config, query client, token storage
  assets/       # Static assets
  components/   # Layout, UI dùng chung
  features/     # Form/logic theo nghiệp vụ
  hooks/        # React Query hooks, auth/chat hooks
  layouts/      # App layout
  pages/        # Route pages
  routes/       # Router, protected routes, navigation
  services/     # API service layer
  stores/       # Auth context/state
  types/        # TypeScript types
  utils/        # Helper functions
```

## Lưu ý

- Không commit file `.env`.
- Không hard-code token, Google Client ID hoặc URL môi trường vào code.
- Luôn gọi API qua gateway `VITE_API_BASE_URL=http://localhost:8080`.
- WebSocket chat dùng `VITE_CHAT_WS_URL=ws://localhost:8080/ws/chat`.
- Nếu login báo `Network Error`, kiểm tra backend gateway trước: `http://localhost:8080/api/health`.
- Nếu đổi `.env`, cần restart `npm run dev`; riêng Docker cần build lại frontend.
- Không mock dữ liệu thay API thật khi backend đang chạy.
