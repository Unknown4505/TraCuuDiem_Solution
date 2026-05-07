-- ============================================================
-- SCRIPT SETUP: DATABASE MIỀN BẮC
-- Phạm vi SBD: 000001 → 500999 (~501K thí sinh)
-- Chạy script này trong SSMS với quyền sysadmin / dbcreator
-- KHÔNG cần tạo database thủ công trước
-- ============================================================

-- ==========================================
-- BƯỚC 0: TỰ ĐỘNG TẠO DATABASE NẾU CHƯA CÓ
-- ==========================================
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'MienBac')
BEGIN
    CREATE DATABASE MienBac;
    PRINT N'✔ Đã tạo database MienBac thành công.';
END
ELSE
    PRINT N'ℹ Database MienBac đã tồn tại, tiếp tục cài đặt...';
GO

USE MienBac;
GO

-- ==========================================
-- PHẦN 1: DỌN DẸP VÀ TẠO BẢNG
-- ==========================================
IF OBJECT_ID('DiemThi', 'U') IS NOT NULL DROP TABLE DiemThi;
IF OBJECT_ID('ThiSinh', 'U') IS NOT NULL DROP TABLE ThiSinh;
GO

CREATE TABLE ThiSinh (
    SBD     VARCHAR(6)      NOT NULL,
    HoTen   NVARCHAR(100)   NOT NULL,
    MaVung  VARCHAR(5),
    CONSTRAINT PK_ThiSinh_North  PRIMARY KEY (SBD),
    CONSTRAINT CHK_SBD_MienBac   CHECK (SBD >= '000001' AND SBD <= '500999')
);

CREATE TABLE DiemThi (
    SBD         VARCHAR(6)   NOT NULL,
    Toan        DECIMAL(4,2),
    Van         DECIMAL(4,2),
    Anh         DECIMAL(4,2),
    LoaiToHop   TINYINT,
    Ly          DECIMAL(4,2),
    Hoa         DECIMAL(4,2),
    Sinh        DECIMAL(4,2),
    Su          DECIMAL(4,2),
    Dia         DECIMAL(4,2),
    GDCD        DECIMAL(4,2),
    CONSTRAINT PK_DiemThi_North             PRIMARY KEY (SBD),
    CONSTRAINT FK_DiemThi_ThiSinh_North     FOREIGN KEY (SBD) REFERENCES ThiSinh(SBD),
    CONSTRAINT CHK_Diem_Toan_North          CHECK (Toan BETWEEN 0 AND 10),
    CONSTRAINT CHK_Diem_Van_North           CHECK (Van  BETWEEN 0 AND 10),
    CONSTRAINT CHK_Diem_Anh_North           CHECK (Anh  BETWEEN 0 AND 10),
    CONSTRAINT CHK_LoaiToHop_North          CHECK (LoaiToHop IN (1, 2))
);
GO

PRINT N'✔ Đã tạo bảng ThiSinh và DiemThi.';
GO

-- ==========================================
-- PHẦN 2: TẠO STORED PROCEDURE TRA CỨU
-- ==========================================
IF OBJECT_ID('sp_TraCuuDiem', 'P') IS NOT NULL DROP PROCEDURE sp_TraCuuDiem;
GO

CREATE PROCEDURE sp_TraCuuDiem
    @SBD VARCHAR(6)
AS
BEGIN
    SET NOCOUNT ON;

    -- Không dùng RAISERROR → Khi SBD không tồn tại, trả empty result set
    -- C# kiểm tra reader.Read() = false → ts = null → Controller trả HTTP 404 đúng chuẩn

    SELECT
        T.SBD,
        T.HoTen,
        T.MaVung,
        D.Toan, D.Van, D.Anh,
        CASE WHEN D.LoaiToHop = 1 THEN N'Tự nhiên' ELSE N'Xã hội' END AS TenToHop,
        -- Không dùng ISNULL → Trả NULL thật để C# GetDoubleNullable() phân biệt được
        -- "môn không thi" (NULL) với "môn thi điểm 0" (0.00)
        D.Ly, D.Hoa, D.Sinh,
        D.Su, D.Dia, D.GDCD
    FROM ThiSinh T
    LEFT JOIN DiemThi D ON T.SBD = D.SBD
    WHERE T.SBD = @SBD;
END
GO

PRINT N'✔ Đã tạo stored procedure sp_TraCuuDiem.';
GO

-- ==========================================
-- PHẦN 3: BƠM ~501.000 DỮ LIỆU THÍ SINH MIỀN BẮC
-- SBD: 000001 → 500999
-- ==========================================
SET NOCOUNT ON;

PRINT N'⏳ Đang insert ThiSinh (~501K dòng), vui lòng chờ...';

WITH N1(C) AS (
    SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1
    UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1 UNION ALL SELECT 1
),
N2(C) AS (SELECT 1 FROM N1 A, N1 B, N1 C),   -- 10^3 = 1.000 dòng
N3(C) AS (SELECT 1 FROM N2 A, N2 B),           -- 10^6 = 1.000.000 dòng
Tally(N) AS (SELECT ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) FROM N3)

INSERT INTO ThiSinh (SBD, HoTen, MaVung)
SELECT
    RIGHT('000000' + CAST(N AS VARCHAR(6)), 6),
    -- Họ, tên đệm, tên: xen kẽ theo số thứ tự → đa dạng nhưng có thể đoán (test data)
    CHOOSE((N % 5) + 1,  N'Nguyễn', N'Trần', N'Lê', N'Phạm', N'Hoàng') + ' ' +
    CHOOSE(((N/2) % 5) + 1, N'Văn', N'Thị', N'Đức', N'Minh', N'Quốc') + ' ' +
    CHOOSE(((N/3) % 5) + 1, N'Hùng', N'Anh', N'Tuấn', N'Dũng', N'Bình'),
    'MB'
FROM Tally
WHERE N BETWEEN 1 AND 500999;

PRINT N'✔ Đã insert ThiSinh xong.';
PRINT N'⏳ Đang insert DiemThi (3 môn bắt buộc)...';

INSERT INTO DiemThi (SBD, Toan, Van, Anh, LoaiToHop)
SELECT
    SBD,
    ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),  -- 0.00 → 10.00
    ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    (X.N % 2) + 1   -- 1 = KHTN, 2 = KHXH, xen kẽ đều
FROM ThiSinh
CROSS APPLY (SELECT CAST(SBD AS INT) AS N) AS X;

PRINT N'✔ Đã insert DiemThi xong.';
PRINT N'⏳ Đang update điểm môn tự chọn KHTN (Lý, Hóa, Sinh)...';

UPDATE DiemThi SET
    Ly   = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    Hoa  = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    Sinh = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2)
WHERE LoaiToHop = 1;

PRINT N'⏳ Đang update điểm môn tự chọn KHXH (Sử, Địa, GDCD)...';

UPDATE DiemThi SET
    Su   = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    Dia  = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2),
    GDCD = ROUND(ABS(CHECKSUM(NEWID())) % 1001 / 100.0, 2)
WHERE LoaiToHop = 2;

PRINT N'';
PRINT N'✅ HOÀN TẤT! Database MienBac đã sẵn sàng.';
PRINT N'   - Bảng ThiSinh : SBD 000001 → 500999 (~501K bản ghi)';
PRINT N'   - Bảng DiemThi : Điểm ngẫu nhiên, đã phân loại KHTN/KHXH';
PRINT N'   - SP sp_TraCuuDiem : Sẵn sàng phục vụ truy vấn';
GO
