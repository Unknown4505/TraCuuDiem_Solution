using System;

namespace TraCuuDiem_Solution.Models
{
    public class ThiSinh
    {
        public string SBD { get; set; }
        public string HoTen { get; set; }

        // ✅ BỔ SUNG: Cần thêm cái này để khớp với SQL và Code Test
        public string MaVung { get; set; }

        // SQL trả về int (1 hoặc 2)
        public int LoaiToHop { get; set; }

        // 3 Môn bắt buộc
        public double Toan { get; set; }
        public double Van { get; set; }
        public double Anh { get; set; }

        // Tổ hợp KHTN (Nullable)
        public double? Ly { get; set; }
        public double? Hoa { get; set; }
        public double? Sinh { get; set; }

        // Tổ hợp KHXH (Nullable)
        public double? Su { get; set; }
        public double? Dia { get; set; }
        public double? GDCD { get; set; }
    }
}