using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Data;

namespace TraCuuDiemThi_PhanTan.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TraCuuController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public TraCuuController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpGet("{sbd}")]
        public IActionResult GetDiemThi(string sbd)
        {
            // Debug: In ra console để xem
            Console.WriteLine($"--- Đang tra cứu SBD: {sbd} ---");

            if (string.IsNullOrEmpty(sbd) || sbd.Length != 6 || !int.TryParse(sbd, out int sbdNum))
                return BadRequest("Số báo danh không hợp lệ.");

            string connectionString = "";
            string serverName = "";

            // Routing: Phân chia Bắc/Nam dựa trên đầu số SBD
            if (sbdNum >= 0 && sbdNum <= 500999)
            {
                connectionString = _configuration.GetConnectionString("MienBacConnection");
                serverName = "Miền Bắc";
            }
            else if (sbdNum >= 501000 && sbdNum <= 999999)
            {
                connectionString = _configuration.GetConnectionString("MienNamConnection");
                serverName = "Miền Nam";
            }
            else
            {
                return NotFound("SBD ngoài vùng quản lý.");
            }

            Console.WriteLine($"-> Đang kết nối tới: {serverName}");

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open(); // Nếu lỗi tại đây -> Sai Connection String
                    Console.WriteLine("-> Kết nối SQL thành công!");

                    using (SqlCommand cmd = new SqlCommand("sp_TraCuuDiem", conn))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@SBD", sbd);

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                Console.WriteLine("-> Đã tìm thấy dữ liệu!");
                                // Map dữ liệu từ SQL ra JSON
                                var result = new
                                {
                                    sbd = reader["SBD"].ToString(),
                                    hoTen = reader["HoTen"].ToString(),
                                    maVung = reader["MaVung"].ToString(),
                                    toan = reader["Toan"] != DBNull.Value ? reader["Toan"] : 0,
                                    van = reader["Van"] != DBNull.Value ? reader["Van"] : 0,
                                    anh = reader["Anh"] != DBNull.Value ? reader["Anh"] : 0,
                                    tenToHop = reader["TenToHop"].ToString(),
                                    ly = reader["Ly"] != DBNull.Value ? reader["Ly"] : 0,
                                    hoa = reader["Hoa"] != DBNull.Value ? reader["Hoa"] : 0,
                                    sinh = reader["Sinh"] != DBNull.Value ? reader["Sinh"] : 0,
                                    su = reader["Su"] != DBNull.Value ? reader["Su"] : 0,
                                    dia = reader["Dia"] != DBNull.Value ? reader["Dia"] : 0,
                                    gdcd = reader["GDCD"] != DBNull.Value ? reader["GDCD"] : 0,
                                    serverSource = serverName
                                };
                                return Ok(result);
                            }
                            else
                            {
                                Console.WriteLine("-> Reader không đọc được dòng nào (SBD không tồn tại trong DB).");
                                return NotFound($"Không tìm thấy thí sinh {sbd}.");
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // In lỗi đỏ ra màn hình console đen
                Console.Error.WriteLine($"!!! LỖI NGHIÊM TRỌNG: {ex.Message}");
                return StatusCode(500, $"Lỗi hệ thống: {ex.Message}");
            }
        }
    }
}