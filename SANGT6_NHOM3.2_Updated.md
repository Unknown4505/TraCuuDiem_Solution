# BỘ GIÁO DỤC VÀ ĐÀO TẠO
# TRƯỜNG ĐẠI HỌC SÀI GÒN

**Môn học:** Cơ sở dữ liệu phân tán  
**Đề tài:** Tra cứu Điểm thi Quốc gia

**Thành viên nhóm:**  
- Lê Minh Chí (3123411040)
- Phạm Ngọc Thiện (3123411277)
- Lê Hữu Khang (3123411141)
- Ngô Đức Huy (3123411117)

*Ngày 24 tháng 4 năm 2026, TPHCM*

---

## Chương 1: Tổng quan đề tài

### 1.1. Lý do chọn đề tài
Một hệ thống tra cứu điểm thi được triển khai trên quy mô quốc gia (ví dụ: phục vụ đồng thời các khu vực Miền Bắc và Miền Nam) sẽ phải đối mặt với hai thách thức lớn:
- **Tải trọng truy cập cao:** Lượng yêu cầu tra cứu điểm tăng đột biến trong cùng một thời điểm, dễ gây quá tải và nghẽn mạng cho một máy chủ trung tâm duy nhất.
- **Độ trễ truy cập (Latency):** Khoảng cách địa lý giữa người dùng ở hai miền và máy chủ trung tâm có thể làm tăng độ trễ khi tra cứu, ảnh hưởng đến trải nghiệm người dùng cục bộ.

Để giải quyết triệt để những thách thức này, đề tài "Xây dựng hệ thống tra cứu điểm thi sử dụng Cơ sở dữ liệu Phân tán Miền Bắc – Miền Nam" được chọn. Việc áp dụng mô hình CSDL phân tán cho phép lưu trữ dữ liệu điểm thi cục bộ tại khu vực Bắc và Nam, qua đó tối ưu hóa tốc độ tra cứu cho người dùng tại từng miền, nâng cao khả năng chịu lỗi và đảm bảo tính sẵn sàng của hệ thống trên phạm vi rộng.

### 1.2. Mục tiêu và nhiệm vụ của đề tài
**Mục tiêu:** Xây dựng thành công một hệ thống tra cứu điểm thi trực tuyến, hiệu suất cao, có khả năng mở rộng, đáp ứng yêu cầu tra cứu nhanh chóng, chính xác và bảo mật cho gần 1 triệu thí sinh tại hai khu vực Miền Bắc và Miền Nam.

**Nhiệm vụ:**
- **Nghiên cứu cơ sở lý thuyết:** Nghiên cứu về các công nghệ lập trình web hiện đại và chuyên sâu về lý thuyết, kiến trúc Cơ sở dữ liệu Phân tán, bao gồm các chiến lược phân mảnh ngang.
- **Phân tích và Thiết kế:** Phân tích chi tiết các yêu cầu chức năng và phi chức năng. Thiết kế CSDL Phân tán với chiến lược phân mảnh ngang cho dữ liệu điểm thi theo khu vực Bắc – Nam.
- **Cài đặt và Kiểm thử:** Phát triển hệ thống theo thiết kế và thực hiện các trường hợp kiểm thử (Test Case) chi tiết để xác minh tính chính xác, tính ổn định và khả năng hoạt động của cơ chế phân tán, bao gồm cả khi hệ thống chịu lỗi ngắt kết nối.

### 1.3. Đối tượng và phạm vi nghiên cứu
- **Đối tượng nghiên cứu:** Quy trình truy xuất dữ liệu điểm thi trên kiến trúc phân tán.
- **Phạm vi nghiên cứu:** 
  - Về chức năng: Hệ thống bao gồm chức năng chính cho người dùng (Tra cứu điểm theo Số báo danh - SBD).
  - Về dữ liệu và địa lý: Dữ liệu được quản lý thuộc phạm vi hai khu vực địa lý: Miền Bắc và Miền Nam. Dữ liệu của thí sinh và điểm thi sẽ được phân mảnh và lưu trữ tương ứng tại Site Cục bộ Miền Bắc và Site Cục bộ Miền Nam.

---

## Chương 2: Cơ sở lý thuyết

### 2.1. Tổng quan về các hệ thống quản lý điểm thi
Cơ sở dữ liệu Phân tán (Distributed Database - DDB) là một hệ thống CSDL bao gồm nhiều cơ sở dữ liệu vật lý được lưu trữ tại nhiều địa điểm khác nhau (sites) trên mạng máy tính, nhưng được quản lý như một CSDL logic duy nhất. Mục tiêu chính của mô hình này là mang dữ liệu đến gần người dùng hơn hoặc chia nhỏ khối lượng công việc, từ đó cải thiện hiệu suất, tính sẵn sàng và khả năng mở rộng của hệ thống.

### 2.2. Các công nghệ nền tảng sử dụng trong đồ án

#### 2.2.1. Ngôn ngữ lập trình: C# (C-Sharp)
C# được chọn làm ngôn ngữ phát triển chính nhờ sự hỗ trợ mạnh mẽ từ thư viện `Microsoft.Data.SqlClient`, cho phép tương tác trực tiếp với các hệ quản trị CSDL của Microsoft.
- **Vai trò Query Router:** C# đóng vai trò là "bộ định tuyến". Dựa vào số báo danh thí sinh nhập vào (Range ID), mã nguồn C# sẽ tính toán để quyết định mở kết nối tới trạm Miền Bắc hay Miền Nam.
- **Cơ chế xử lý ngoại lệ (Exception Handling):** Sử dụng khối lệnh `try...catch` để bắt các lỗi `SqlException`. Đây là kỹ thuật cốt lõi để thực hiện yêu cầu "hệ thống không được Crash khi một Node bị Offline".
- **Quản lý Connection String:** Lưu trữ cấu hình kết nối riêng biệt cho từng phân mảnh địa lý trong tệp `appsettings.json` thông qua `IConfiguration`.

#### 2.2.2. Hệ quản trị Cơ sở dữ liệu: Microsoft SQL Server
Đồ án sử dụng SQL Server để triển khai mô hình phân tán thực tế thông qua việc cài đặt các Database độc lập:
- **Node_MienBac:** Lưu trữ bản ghi thí sinh có SBD từ `000001` đến `500999`.
- **Node_MienNam:** Lưu trữ bản ghi thí sinh có SBD từ `501000` đến `999999`.

#### 2.2.3. Thư viện kết nối: .NET
- **SqlConnection:** Thiết lập kênh giao tiếp giữa ứng dụng ASP.NET Core và các Node SQL Server.
- **Connection Timeout:** Cấu hình tham số thời gian chờ (`Connect Timeout=5`). Nếu sau 5 giây không kết nối được tới Node (do sự cố mạng), .NET sẽ ném ra ngoại lệ để C# xử lý, tránh việc ứng dụng bị treo UI.

---

## Chương 3: Phân tích và thiết kế hệ thống

### 3.1. Phân tích yêu cầu hệ thống
#### 3.1.1. Yêu cầu chức năng
- **Tra cứu điểm thi:** Cho phép thí sinh tra cứu kết quả thi bằng cách nhập SBD gồm 6 chữ số. Hệ thống tự động xác định khu vực từ SBD để điều hướng truy vấn đến Site cục bộ tương ứng.
- **Thống kê:** Tính toán điểm trung bình và số lượng thí sinh theo khối (KHTN/KHXH) trên toàn quốc bằng cách tổng hợp từ cả hai trạm.

#### 3.1.2. Yêu cầu phi chức năng
- **Tính sẵn sàng (Availability):** Hệ thống phải hoạt động ngay cả khi một Node gặp sự cố. Trả về thông báo "Khu vực này đang bảo trì" thân thiện.
- **Hiệu năng (Performance):** Tốc độ phản hồi truy vấn tại địa phương phải đạt mức tối ưu.
- **Tính trong suốt (Transparency):** Người dùng không cần quan tâm dữ liệu nằm ở đâu, hệ thống tự điều phối.

### 3.2 Xác định hình thức phân tán: Phân mảnh ngang
Trong bài toán này, chúng ta áp dụng Phân mảnh ngang vì:
- **Về cấu trúc:** Cả hai Database đều có cấu trúc bảng giống hệt nhau (`ThiSinh` và `DiemThi`).
- **Về dữ liệu:** Tập hợp các bản ghi được chia thành các tập con rời rạc dựa trên giá trị của SBD:
  - Mảnh Miền Bắc: `000001 <= SBD <= 500999`.
  - Mảnh Miền Nam: `501000 <= SBD <= 999999`.

### 3.3. Cơ chế Địa phương hóa Truy vấn và Query Router
Hệ thống sử dụng thuộc tính SBD làm Khóa phân mảnh (Fragmentation Key).
1. **Phân tích Input:** Người dùng gửi SBD, Bộ điều phối (Web API) trích xuất giá trị.
2. **Định tuyến:** Nếu SBD <= `500999` -> MienBac. Nếu SBD >= `501000` -> MienNam.
3. **Lựa chọn chuỗi kết nối:** Truy xuất chuỗi kết nối tương ứng từ `appsettings.json` thông qua `SqlHelper`.
4. **Khởi tạo kết nối:** Đối tượng `SqlConnection` được tạo với chuỗi kết nối đã chọn.

### 3.4. Cơ chế Tính toán và Tổng hợp Phân tán (Distributed Aggregation)
Hệ thống áp dụng mô hình Scatter-Gather cho tính năng thống kê:
- **Giai đoạn Scatter:** Bộ điều phối gọi phương thức `GetThongKeTuDatabase` tới cả hai Node để tính toán điểm trung bình cục bộ.
- **Giai đoạn Gather:** Các giá trị thu về được cộng gộp/trung bình tại API Controller để gửi về giao diện hiển thị biểu đồ.

### 3.5. Cơ chế chịu lỗi từng phần (Partial Fault Tolerance)
Hệ thống áp dụng `try...catch` trong `ExamRepository` và `Connect Timeout=5`. Khi Node Miền Nam bị Offline:
1. `SqlException` được ném ra với các mã lỗi mạng (-2, 53, 4060, 18456).
2. API bắt lỗi, chuyển thành HTTP 500 kèm thông báo "Khu vực này đang bảo trì, vui lòng thử lại sau".
3. Frontend hiển thị thông báo UI, trong khi các yêu cầu tra cứu tới Node Miền Bắc vẫn hoạt động bình thường.

### 3.6. Thiết kế cơ sở dữ liệu
Hệ thống loại bỏ bảng `MONHOC` để tối ưu truy vấn (Denormalization), kết hợp dữ liệu vào hai bảng chính:

**Bảng: THISINH (Thông tin Thí sinh)**
| Tên cột | Kiểu dữ liệu | Đặc điểm | Mô tả chức năng |
|---------|--------------|----------|-----------------|
| SBD | VARCHAR(6) | Primary Key | Số báo danh 6 chữ số (MB: 000001-500999, MN: 501000-999999) |
| HoTen | NVARCHAR(100)| Not Null | Họ và tên đầy đủ của thí sinh |
| MaVung | VARCHAR(5) | Not Null | Mã vùng phân mảnh ('MB' hoặc 'MN') |

**Bảng: DIEMTHI (Kết quả Điểm thi)**
| Tên cột | Kiểu dữ liệu | Đặc điểm | Mô tả chức năng |
|---------|--------------|----------|-----------------|
| SBD | VARCHAR(6) | Foreign Key | Liên kết với bảng THISINH |
| Toan, Van, Anh | DECIMAL(4,2)| Nullable | Điểm 3 môn bắt buộc (NULL = Không thi) |
| LoaiToHop | TINYINT | IN (1, 2) | 1 = KHTN, 2 = KHXH |
| Ly, Hoa, Sinh | DECIMAL(4,2)| Nullable | Điểm tổ hợp KHTN |
| Su, Dia, GDCD | DECIMAL(4,2)| Nullable | Điểm tổ hợp KHXH |

---

## Chương 4: Kết quả và kiểm thử

### 4.1. Môi trường phát triển
- **Ngôn ngữ:** C# 10.0+
- **Framework:** ASP.NET Core
- **CSDL:** Microsoft SQL Server
- **IDE:** Visual Studio 2022

### 4.2. Các trường hợp kiểm thử (Test Case)
1. **Trường hợp lý tưởng:** Nhập SBD `000001` (Miền Bắc) và `501000` (Miền Nam) khi cả 2 server online -> Trả về kết quả tức thì.
2. **Nhập sai cú pháp:** Nhập chuỗi văn bản hoặc SBD quá 6 số -> Báo lỗi "Vui lòng nhập Số báo danh gồm 6 chữ số".
3. **Kiểm thử Null điểm:** Nhập SBD không dự thi môn Toán (`000990`) -> Hiển thị "Không thi" trên giao diện thay vì điểm `0`.
4. **Kiểm thử ngắt Node Miền Bắc:** Nhập SBD `000001` khi Server MB tắt -> Báo lỗi UI "Khu vực này đang bảo trì". Nhập `501000` vẫn hoạt động.
5. **Kiểm thử ngắt Node Miền Nam:** Nhập SBD `501000` khi Server MN tắt -> Báo lỗi "Khu vực này đang bảo trì".

### 4.3. Đánh giá kết quả
- **Tính chính xác:** Thuật toán Query Router hoạt động đúng với định dạng SBD 6 chữ số. Database hỗ trợ gần 1.000.000 bản ghi dữ liệu mẫu.
- **Chịu lỗi:** Hệ thống không bị crash, bắt lỗi và hiển thị thân thiện trong đúng 5 giây timeout.

### 4.4. Hạn chế và hướng phát triển
- **Hạn chế:** Khi một Node offline, dữ liệu của Node đó tạm thời không thể truy cập (không có tính năng phục hồi/replication). Cấu hình connection string hiện lưu trữ trong `appsettings.json` chưa được mã hóa.
- **Hướng phát triển:** Triển khai Replication (nhân bản dữ liệu chéo giữa MB và MN) để dự phòng. Áp dụng Redis Cache để tăng tốc truy vấn thống kê.
