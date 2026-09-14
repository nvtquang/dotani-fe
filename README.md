# HCMCYU Frontend

Frontend React/Vite/TypeScript cho hệ thống HCMCYU.

## Folder

```text
D:\Java\HCMCYU-frontend
```

Backend nằm tại:

```text
D:\Java\HCMCYU
```

## Công nghệ

- React
- Vite
- TypeScript
- React Router
- Axios
- TanStack Query
- STOMP WebSocket cho chat realtime

## Yêu cầu

- Node.js 20+
- npm
- Backend gateway đang chạy ở port `8080`

Kiểm tra:

```powershell
node -v
npm -v
```

## Cấu hình môi trường

Tạo file `.env`:

```powershell
cd D:\Java\HCMCYU-frontend
Copy-Item .env.example .env
```

Nội dung mặc định:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_CHAT_WS_URL=ws://localhost:8080/ws/chat
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Ý nghĩa:

- `VITE_API_BASE_URL`: REST API qua `api-gateway`.
- `VITE_CHAT_WS_URL`: WebSocket/STOMP chat qua `api-gateway`.
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth Web Client ID de hien nut dang nhap Google.

Khi tao Google OAuth Client, them JavaScript origin:

```text
http://localhost:5173
```

## Cài đặt

```powershell
cd D:\Java\HCMCYU-frontend
npm install
```

## Chạy development

Trước khi chạy frontend, cần chạy backend gateway và các service backend cần test.

Sau đó chạy:

```powershell
cd D:\Java\HCMCYU-frontend
npm run dev
```

Mở:

```text
http://localhost:5173
```

## Build

```powershell
cd D:\Java\HCMCYU-frontend
npm run build
```

Output build nằm trong:

```text
dist
```

## Chạy bằng Docker Compose

Docker Compose nằm ở backend root:

```powershell
cd D:\Java\HCMCYU
Copy-Item .env.example .env
docker compose up --build
```

Compose sẽ build frontend từ folder `D:\Java\HCMCYU-frontend` và serve bằng Nginx tại:

```text
http://localhost:5173
```

## Tài khoản demo

Backend seed dev dùng password:

```text
Demo@12345
```

Một số tài khoản hay dùng:

| Role | Username |
| --- | --- |
| WARD_SECRETARY | ward.secretary |
| WARD_DEPUTY_SECRETARY | ward.deputy |
| TDP_SECRETARY | tdp1.secretary |
| TDP_DEPUTY_SECRETARY | tdp1.deputy |
| MEMBER | tdp1.member1 |

## Flow test nhanh

1. Mở `http://localhost:5173/login`.
2. Login bằng `ward.secretary / Demo@12345`.
3. Kiểm tra Dashboard, Members, Events, Posts, Chat, Notifications.
4. Logout.
5. Login bằng `tdp1.member1 / Demo@12345`.
6. Kiểm tra Profile, Events, Posts, Chat, Notifications.

## Ghi chú Chat realtime

Chat dùng STOMP qua:

```text
ws://localhost:8080/ws/chat
```

Frontend gửi message chỉ gồm:

```json
{
  "content": "Nội dung tin nhắn"
}
```

Frontend không gửi `senderId`. Backend lấy sender từ JWT.

Nếu chat REST chạy nhưng realtime không kết nối được, kiểm tra:

- `api-gateway` đang chạy port `8080`.
- `chat-service` đang chạy port `8085`.
- `CHAT_SERVICE_WS_URL=ws://localhost:8085` ở gateway nếu bạn override env.
- `JWT_SECRET` của `chat-service` trùng với `AUTH_JWT_SECRET` của `auth-service`.
# hcmcyu-frontend
