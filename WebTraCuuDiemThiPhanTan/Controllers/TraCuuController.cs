using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using System;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using TraCuuDiem_Solution.Models;
using TraCuuDiem_Solution.Repositories;

namespace WebTraCuuDiemThiPhanTan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TraCuuController : ControllerBase
    {
        private readonly ExamRepository _repo;
        private readonly IConfiguration _configuration; // FIX #5: Inject config thay vì hard-code

        public TraCuuController(IConfiguration configuration)
        {
            _configuration = configuration;
            _repo = new ExamRepository();
        }

        // ========================================================
        // API 1: TRA CỨU ĐIỂM THÍ SINH (KÈM ĐỊNH VỊ GPS)
        // ========================================================
        [HttpGet("{sbd}")]
        public async Task<IActionResult> GetScore(string sbd)
        {
            try
            {
                // Gọi hàm tìm kiếm có sẵn của nhóm
                ThiSinh ts = _repo.TimKiem(sbd);

                if (ts == null) return NotFound(new { message = "Không tìm thấy SBD này" });

                // --- 1. LẤY "GPS" NGƯỜI TRA CỨU ---
                string viTriNguoiTra = "Đang xác định...";
                try
                {
                    using (HttpClient client = new HttpClient())
                    {
                        var response = await client.GetStringAsync("http://ip-api.com/json/");
                        using (JsonDocument doc = JsonDocument.Parse(response))
                        {
                            string city = doc.RootElement.GetProperty("city").GetString();

                            string[] mienBac = { "Hanoi", "Haiphong", "Da Nang", "Bac Ninh", "Quang Ninh", "Thai Nguyen", "Nam Dinh" };
                            bool isMienBac = false;

                            foreach (var mb in mienBac)
                            {
                                if (city.Contains(mb)) isMienBac = true;
                            }

                            viTriNguoiTra = isMienBac ? $"Miền Bắc (Thành phố: {city})" : $"Miền Nam (Thành phố: {city})";
                        }
                    }
                }
                catch
                {
                    viTriNguoiTra = "Không thể lấy định vị (Do lỗi mạng hoặc chặn API)";
                }

                // --- 2. TỰ ĐỘNG ẨN MÔN KHÔNG THI ---
                object ketQuaDiem;

                if (ts.LoaiToHop == 1) // Nếu là KHTN
                {
                    ketQuaDiem = new
                    {
                        toan = ts.Toan,
                        van = ts.Van,
                        anh = ts.Anh,
                        ly = ts.Ly,
                        hoa = ts.Hoa,
                        sinh = ts.Sinh
                    };
                }
                else // Nếu là KHXH
                {
                    ketQuaDiem = new
                    {
                        toan = ts.Toan,
                        van = ts.Van,
                        anh = ts.Anh,
                        su = ts.Su,
                        dia = ts.Dia,
                        gdcd = ts.GDCD
                    };
                }

                // --- 3. TRẢ VỀ KẾT QUẢ GỘP ---
                return Ok(new
                {
                    thongTinTraCuu = new
                    {
                        thoiGian = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"),
                        viTriGPS = viTriNguoiTra
                    },
                    thongTinThiSinh = new
                    {
                        sbd = ts.SBD,
                        hoTen = ts.HoTen,
                        serverSource = (ts.MaVung == "MB") ? "Server Miền Bắc" : "Server Miền Nam",
                        tenToHop = (ts.LoaiToHop == 1) ? "Khoa học Tự nhiên (KHTN)" : "Khoa học Xã hội (KHXH)"
                    },
                    diemThi = ketQuaDiem
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // ========================================================
        // API 2: LẤY SỐ LIỆU THỐNG KÊ (DỮ LIỆU THẬT TỪ DATABASE)
        // ========================================================
        [HttpGet("thong-ke")]
        public IActionResult GetThongKe()
        {
            try
            {
                // FIX #6: Lấy connection string từ appsettings.json qua IConfiguration
                // Không hard-code → đảm bảo một nguồn cấu hình duy nhất (docx Section 2.2.1)
                string chuoiKetNoi_MB = _configuration.GetConnectionString("ServerMienBac");
                string chuoiKetNoi_MN = _configuration.GetConnectionString("ServerMienNam");

                // Chọc thẳng vào 2 Database Bắc/Nam lấy số liệu
                ThongKeNode thongKeMB = _repo.GetThongKeTuDatabase(chuoiKetNoi_MB);
                ThongKeNode thongKeMN = _repo.GetThongKeTuDatabase(chuoiKetNoi_MN);

                var data = new
                {
                    // 1. Dữ liệu cho biểu đồ Cột (Điểm TB lấy từ DB)
                    labels = new[] { "Toán", "Ngữ Văn", "Tiếng Anh", "Vật Lý", "Hóa Học" },
                    diemTB_MienBac = new[] {
                        thongKeMB.DiemTB_Toan, thongKeMB.DiemTB_Van,
                        thongKeMB.DiemTB_Anh, thongKeMB.DiemTB_Ly, thongKeMB.DiemTB_Hoa
                    },
                    diemTB_MienNam = new[] {
                        thongKeMN.DiemTB_Toan, thongKeMN.DiemTB_Van,
                        thongKeMN.DiemTB_Anh, thongKeMN.DiemTB_Ly, thongKeMN.DiemTB_Hoa
                    },

                    // 2. Dữ liệu cho biểu đồ Tròn (Cộng dồn KHTN và KHXH 2 miền)
                    toHopLabels = new[] { "KHTN (Lý, Hóa, Sinh)", "KHXH (Sử, Địa, GDCD)" },
                    toHopData = new[] {
                        (thongKeMB.SoLuong_KHTN + thongKeMN.SoLuong_KHTN),
                        (thongKeMB.SoLuong_KHXH + thongKeMN.SoLuong_KHXH)
                    }
                };

                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}