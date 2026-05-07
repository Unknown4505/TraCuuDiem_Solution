namespace TraCuuDiem_Solution.Models
{
    // FIX #2: Chuyển ThongKeNode từ Repositories → Models (đúng vị trí theo kiến trúc)
    // Class này chứa dữ liệu thống kê tổng hợp từ mỗi Node phân tán (Bắc/Nam)
    public class ThongKeNode
    {
        public double DiemTB_Toan { get; set; }
        public double DiemTB_Van { get; set; }
        public double DiemTB_Anh { get; set; }
        public double DiemTB_Ly { get; set; }
        public double DiemTB_Hoa { get; set; }
        public int SoLuong_KHTN { get; set; }
        public int SoLuong_KHXH { get; set; }
    }
}
