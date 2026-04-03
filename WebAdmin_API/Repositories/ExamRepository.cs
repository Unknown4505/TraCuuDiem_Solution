using System;
using Microsoft.Data.SqlClient;
using TraCuuDiem_Solution.Models;
using TraCuuDiem_Solution.Utilities;

namespace TraCuuDiem_Solution.Repositories
{
    // ========================================================
    // 1. CLASS KHAY CHỨA DỮ LIỆU THỐNG KÊ
    // (Đáng lẽ nằm ở thư mục Models, nhưng để chung vào đây cho gọn)
    // ========================================================
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

    // ========================================================
    // 2. CLASS CHÍNH: KẾT NỐI VÀ XỬ LÝ DATABASE
    // ========================================================
    public class ExamRepository
    {
        // ----------------------------------------------------
        // HÀM 1: TÌM KIẾM ĐIỂM CỦA 1 THÍ SINH
        // ----------------------------------------------------
        public ThiSinh TimKiem(string sbdInput)
        {
            // 1. Chuẩn hóa SBD
            string sbd = sbdInput.Trim().PadLeft(6, '0');

            // 2. Lấy Connection String
            string connectionString = SqlHelper.GetConnectionString(sbd);

            ThiSinh ketQua = null;

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    conn.Open();
                    using (SqlCommand cmd = new SqlCommand("sp_TraCuuDiem", conn))
                    {
                        cmd.CommandType = System.Data.CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@SBD", sbd);

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                ketQua = new ThiSinh();

                                // --- ĐỌC DỮ LIỆU AN TOÀN ---
                                ketQua.SBD = GetStringSafe(reader, "SBD");
                                ketQua.HoTen = GetStringSafe(reader, "HoTen");
                                ketQua.MaVung = HasColumn(reader, "MaVung") ? GetStringSafe(reader, "MaVung") : "";

                                // Xử lý Tổ hợp
                                if (HasColumn(reader, "TenToHop"))
                                {
                                    string tenToHop = GetStringSafe(reader, "TenToHop");
                                    ketQua.LoaiToHop = (tenToHop == "Tự nhiên") ? 1 : 2;
                                }
                                else if (HasColumn(reader, "LoaiToHop"))
                                {
                                    ketQua.LoaiToHop = GetIntSafe(reader, "LoaiToHop");
                                }
                                else
                                {
                                    ketQua.LoaiToHop = 2; // Mặc định Xã hội
                                }

                                // Điểm bắt buộc
                                ketQua.Toan = GetDoubleSafe(reader, "Toan");
                                ketQua.Van = GetDoubleSafe(reader, "Van");
                                ketQua.Anh = GetDoubleSafe(reader, "Anh");

                                // Điểm tự chọn (Cho phép NULL)
                                ketQua.Ly = GetDoubleNullable(reader, "Ly");
                                ketQua.Hoa = GetDoubleNullable(reader, "Hoa");
                                ketQua.Sinh = GetDoubleNullable(reader, "Sinh");
                                ketQua.Su = GetDoubleNullable(reader, "Su");
                                ketQua.Dia = GetDoubleNullable(reader, "Dia");
                                ketQua.GDCD = GetDoubleNullable(reader, "GDCD");
                            }
                        }
                    }
                }
            }
            catch (SqlException ex)
            {
                if (ex.Number == 53 || ex.Number == -2 || ex.Number == 4060 || ex.Number == 18456)
                {
                    string serverName = connectionString.Split(';')[0];
                    throw new Exception($"Không thể kết nối đến SQL Server ({serverName}). Vui lòng kiểm tra lại file appsettings.json!");
                }
                throw new Exception($"Lỗi SQL ({ex.Number}): {ex.Message}");
            }
            catch (Exception ex)
            {
                throw new Exception("Lỗi hệ thống: " + ex.Message);
            }

            return ketQua;
        }

        // ----------------------------------------------------
        // HÀM 2: LẤY SỐ LIỆU THỐNG KÊ (BIỂU ĐỒ) TỪ DATABASE
        // ----------------------------------------------------
        public ThongKeNode GetThongKeTuDatabase(string connectionString)
        {
            ThongKeNode result = new ThongKeNode();

            // Câu lệnh SQL gom 7 phép tính để tối ưu tốc độ
            string query = @"
                SELECT 
                    ISNULL(ROUND(AVG(CAST(Toan AS FLOAT)), 2), 0) as TB_Toan,
                    ISNULL(ROUND(AVG(CAST(Van AS FLOAT)), 2), 0) as TB_Van,
                    ISNULL(ROUND(AVG(CAST(Anh AS FLOAT)), 2), 0) as TB_Anh,
                    ISNULL(ROUND(AVG(CAST(Ly AS FLOAT)), 2), 0) as TB_Ly,
                    ISNULL(ROUND(AVG(CAST(Hoa AS FLOAT)), 2), 0) as TB_Hoa,
                    SUM(CASE WHEN LoaiToHop = 1 THEN 1 ELSE 0 END) as SoLuongKHTN,
                    SUM(CASE WHEN LoaiToHop = 2 THEN 1 ELSE 0 END) as SoLuongKHXH
                FROM DiemThi;";

            try
            {
                using (SqlConnection conn = new SqlConnection(connectionString))
                {
                    using (SqlCommand cmd = new SqlCommand(query, conn))
                    {
                        conn.Open();
                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                result.DiemTB_Toan = reader["TB_Toan"] != DBNull.Value ? Convert.ToDouble(reader["TB_Toan"]) : 0;
                                result.DiemTB_Van = reader["TB_Van"] != DBNull.Value ? Convert.ToDouble(reader["TB_Van"]) : 0;
                                result.DiemTB_Anh = reader["TB_Anh"] != DBNull.Value ? Convert.ToDouble(reader["TB_Anh"]) : 0;
                                result.DiemTB_Ly = reader["TB_Ly"] != DBNull.Value ? Convert.ToDouble(reader["TB_Ly"]) : 0;
                                result.DiemTB_Hoa = reader["TB_Hoa"] != DBNull.Value ? Convert.ToDouble(reader["TB_Hoa"]) : 0;

                                result.SoLuong_KHTN = reader["SoLuongKHTN"] != DBNull.Value ? Convert.ToInt32(reader["SoLuongKHTN"]) : 0;
                                result.SoLuong_KHXH = reader["SoLuongKHXH"] != DBNull.Value ? Convert.ToInt32(reader["SoLuongKHXH"]) : 0;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                // Nếu kết nối đến Node đó bị lỗi, trả về ThongKeNode toàn số 0 thay vì làm sập cả web
                Console.WriteLine("Lỗi thống kê: " + ex.Message);
            }

            return result;
        }

        // ----------------------------------------------------
        // CÁC HÀM PHỤ TRỢ (HELPER METHODS) ĐỂ ĐỌC DỮ LIỆU SQL
        // ----------------------------------------------------
        private bool HasColumn(SqlDataReader dr, string columnName)
        {
            for (int i = 0; i < dr.FieldCount; i++)
            {
                if (dr.GetName(i).Equals(columnName, StringComparison.InvariantCultureIgnoreCase))
                    return true;
            }
            return false;
        }

        private string GetStringSafe(SqlDataReader reader, string colName)
        {
            return (HasColumn(reader, colName) && reader[colName] != DBNull.Value)
                   ? reader[colName].ToString() : "";
        }

        private int GetIntSafe(SqlDataReader reader, string colName)
        {
            return (HasColumn(reader, colName) && reader[colName] != DBNull.Value)
                   ? Convert.ToInt32(reader[colName]) : 0;
        }

        private double GetDoubleSafe(SqlDataReader reader, string colName)
        {
            return (HasColumn(reader, colName) && reader[colName] != DBNull.Value)
                   ? Convert.ToDouble(reader[colName]) : 0.0;
        }

        private double? GetDoubleNullable(SqlDataReader reader, string colName)
        {
            if (HasColumn(reader, colName) && reader[colName] != DBNull.Value)
                return Convert.ToDouble(reader[colName]);
            return null;
        }
    }
}