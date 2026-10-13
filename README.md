# DOTANI Frontend

**DOTANI** là hệ thống quản lý đoàn viên cho Đoàn TNCS Hồ Chí Minh Phường Thượng Cát. Hệ thống số hóa công việc hằng ngày của tổ chức Đoàn cấp phường: từ hồ sơ đoàn viên ở từng tổ dân phố, sự kiện, đại hội, bảng tin, chat nội bộ đến đoàn phí, thi đua và biểu quyết.

Repository này là giao diện web. API và nghiệp vụ nằm ở [dotani-be](https://github.com/nvtquang/dotani-be).

## Dành cho ai

- **Đoàn viên**: xem bảng tin, đăng ký sự kiện, nhắn tin, nhận thông báo, xem và đóng đoàn phí qua QR, tham gia biểu quyết, đề nghị chuyển sinh hoạt, xem hồ sơ thi đua của mình.
- **Cán bộ chi đoàn tổ dân phố**: quản lý đoàn viên, sự kiện, đoàn phí, biểu quyết và xếp loại trong TDP mình phụ trách, xem báo cáo của TDP.
- **Cán bộ Đoàn phường**: quản lý toàn phường, đăng bài, phân quyền, duyệt chuyển sinh hoạt, xem báo cáo toàn phường và nhật ký hệ thống.

Mỗi người chỉ thấy các mục và thao tác đúng với chức vụ, phạm vi của mình.

## Các màn hình

| Màn hình | Nội dung |
| --- | --- |
| **Bảng tin** | Dòng thời gian trộn sự kiện và bài viết, cuộn vô hạn, cảm xúc và số bình luận ngay trên thẻ bài |
| **Sự kiện** | Danh sách, lịch, đăng ký tham gia, tệp đính kèm, biểu quyết gắn với đại hội |
| **Bài viết** | Tin tức, thông báo, báo cáo hoạt động; bình luận và bày tỏ cảm xúc |
| **Chat** | Chat 1-1 và nhóm thời gian thực, gửi ảnh/tệp, đã xem, đang gõ |
| **Thông báo** | Số thông báo chưa đọc tự cập nhật, bấm để mở đúng nội dung liên quan |
| **Biểu quyết** | Khảo sát và bỏ phiếu (kể cả bỏ phiếu kín), xem kết quả theo cấu hình |
| **Đoàn phí** | Kỳ thu, trạng thái đã/chưa đóng, thông tin chuyển khoản và mã QR của người thu; cán bộ ghi nhận và nhắc nợ |
| **Đoàn viên** | Danh sách, hồ sơ chi tiết, phân quyền, hồ sơ thi đua, lịch sử chuyển sinh hoạt |
| **Tổ dân phố** | Cây tổ chức phường và các chi đoàn |
| **Báo cáo thống kê** | Biểu đồ đoàn viên theo TDP, độ tuổi, giới tính; tỷ lệ tham gia sự kiện theo tháng/quý; xuất CSV |
| **Thi đua – khen thưởng** | Bảng xếp loại đoàn viên theo năm |
| **Chuyển sinh hoạt** | Gửi, duyệt, theo dõi đề nghị chuyển giữa các TDP |
| **Hồ sơ** | Thông tin cá nhân, ảnh đại diện, tài khoản ngân hàng và QR, đổi mật khẩu |
| **Nhật ký hệ thống** | Lịch sử thao tác quản trị |

## Trải nghiệm

- **Dùng tốt trên điện thoại**: thanh điều hướng dưới màn hình, hộp thoại dạng bottom sheet.
- **Tìm nhanh bằng Ctrl+K**: tìm đoàn viên, sự kiện, bài viết và nhảy tới bất kỳ trang nào.
- **Tiếp cận được**: điều hướng bằng bàn phím, nhãn cho trình đọc màn hình, màu chữ đạt chuẩn tương phản WCAG AA, biểu đồ luôn kèm dạng bảng.
- **Thời gian thực**: tin nhắn, trạng thái đã xem và đang gõ cập nhật tức thì qua WebSocket.
- **Tải nhanh**: mỗi trang là một gói riêng, dữ liệu được cache và làm mới thông minh.
- **Thông báo lỗi dễ hiểu**: lỗi từ máy chủ hiển thị bằng tiếng Việt, gắn đúng vào ô nhập liệu sai.

## Công nghệ

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · React Router 7 · TanStack Query · React Hook Form + Zod · Axios · STOMP over WebSocket · Lucide Icons
