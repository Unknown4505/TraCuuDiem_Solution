-- ============================================================
-- SCRIPT KIỂM TRA & TẠO DỮ LIỆU TEST
-- Chạy lần lượt từng PHẦN trong SSMS
-- ============================================================

-- ==========================================
-- PHẦN 1: KIỂM TRA - TÌM THÍ SINH CÓ ĐIỂM NULL
-- Chạy trên cả 2 database để biết có trường hợp thực tế không
-- ==========================================

-- 1A. Tìm thí sinh KHXH có Toán/Văn/Anh = NULL (vắng môn bắt buộc)
USE MienBac;
SELECT TOP 10
    T.SBD, T.HoTen,
    CASE WHEN D.LoaiToHop = 1 THEN 'KHTN' ELSE 'KHXH' END AS ToHop,
    D.Toan, D.Van, D.Anh,
    D.Su, D.Dia, D.GDCD
FROM ThiSinh T
JOIN DiemThi D ON T.SBD = D.SBD
WHERE D.Toan IS NULL OR D.Van IS NULL OR D.Anh IS NULL;

-- 1B. Tìm thí sinh KHTN có Lý/Hóa/Sinh = NULL (vắng môn tổ hợp)
SELECT TOP 10
    T.SBD, T.HoTen, 'KHTN' AS ToHop,
    D.Toan, D.Van, D.Anh,
    D.Ly, D.Hoa, D.Sinh
FROM ThiSinh T
JOIN DiemThi D ON T.SBD = D.SBD
WHERE D.LoaiToHop = 1
  AND (D.Ly IS NULL OR D.Hoa IS NULL OR D.Sinh IS NULL);

-- 1C. Tìm thí sinh KHXH có Sử/Địa/GDCD = NULL (vắng môn tổ hợp)
SELECT TOP 10
    T.SBD, T.HoTen, 'KHXH' AS ToHop,
    D.Toan, D.Van, D.Anh,
    D.Su, D.Dia, D.GDCD
FROM ThiSinh T
JOIN DiemThi D ON T.SBD = D.SBD
WHERE D.LoaiToHop = 2
  AND (D.Su IS NULL OR D.Dia IS NULL OR D.GDCD IS NULL);

-- ==========================================
-- PHẦN 2: NẾU KHÔNG TÌM THẤY → TẠO DỮ LIỆU TEST THỦ CÔNG
-- Tạo 4 SBD đặc biệt để test đủ các trường hợp
-- ==========================================

USE MienBac;

-- Xóa test cũ nếu có (để chạy lại nhiều lần)
DELETE FROM DiemThi  WHERE SBD IN ('000990', '000991', '000992', '000993');
DELETE FROM ThiSinh  WHERE SBD IN ('000990', '000991', '000992', '000993');

-- TEST CASE 1: KHXH – Vắng môn Toán (Toán = NULL)
INSERT INTO ThiSinh VALUES ('000990', N'Nguyễn Test Vắng Toán', 'MB');
INSERT INTO DiemThi (SBD, Toan, Van, Anh, LoaiToHop, Su, Dia, GDCD)
VALUES ('000990', NULL, 7.50, 8.00, 2, 6.50, 7.00, 8.50);

-- TEST CASE 2: KHXH – Thi đầy đủ, Toán bị điểm 0 (phân biệt với NULL)
INSERT INTO ThiSinh VALUES ('000991', N'Trần Test Điểm Không', 'MB');
INSERT INTO DiemThi (SBD, Toan, Van, Anh, LoaiToHop, Su, Dia, GDCD)
VALUES ('000991', 0.00, 7.50, 8.00, 2, 6.50, 7.00, 8.50);

-- TEST CASE 3: KHTN – Vắng cả 3 môn tổ hợp (Lý/Hóa/Sinh = NULL)
INSERT INTO ThiSinh VALUES ('000992', N'Lê Test Vắng Tổ Hợp KHTN', 'MB');
INSERT INTO DiemThi (SBD, Toan, Van, Anh, LoaiToHop, Ly, Hoa, Sinh)
VALUES ('000992', 8.00, 7.00, 9.00, 1, NULL, NULL, NULL);

-- TEST CASE 4: KHXH – Vắng Sử (1 môn tổ hợp = NULL, 2 môn còn lại có điểm)
INSERT INTO ThiSinh VALUES ('000993', N'Phạm Test Vắng Một Môn KHXH', 'MB');
INSERT INTO DiemThi (SBD, Toan, Van, Anh, LoaiToHop, Su, Dia, GDCD)
VALUES ('000993', 6.50, 7.00, 8.50, 2, NULL, 7.50, 8.00);

-- ==========================================
-- PHẦN 3: XÁC NHẬN DỮ LIỆU TEST ĐÃ ĐƯỢC TẠO
-- ==========================================
SELECT
    T.SBD,
    T.HoTen,
    CASE WHEN D.LoaiToHop = 1 THEN 'KHTN' ELSE 'KHXH' END AS ToHop,
    D.Toan, D.Van, D.Anh,
    D.Ly, D.Hoa, D.Sinh,
    D.Su, D.Dia, D.GDCD
FROM ThiSinh T
JOIN DiemThi D ON T.SBD = D.SBD
WHERE T.SBD IN ('000990', '000991', '000992', '000993')
ORDER BY T.SBD;
