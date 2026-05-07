using Microsoft.Extensions.Configuration;
using System;
using System.IO;

namespace TraCuuDiem_Solution.Utilities
{
    public class SqlHelper
    {
        // Biến static để lưu cấu hình, giúp đọc file appsettings.json
        public static IConfiguration Configuration { get; set; }

        public static string GetConnectionString(string sbd)
        {
            // 1. Nếu chưa có cấu hình thì đọc ngay lập tức
            if (Configuration == null)
            {
                var builder = new ConfigurationBuilder()
                    .SetBasePath(Directory.GetCurrentDirectory())
                    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true);
                Configuration = builder.Build();
            }

            // 2. Phân tích SBD để chọn Server (Routing)
            // Quy ước: SBD từ 000000 -> 500999 là Miền Bắc
            // Quy ước: SBD từ 501000 -> 999999 là Miền Nam
            int sbdNumber = 0;
            int.TryParse(sbd, out sbdNumber);

            string keyConfig = "";
            if (sbdNumber < 501000)
            {
                // Gọi đúng tên trong appsettings.json của bạn
                keyConfig = "ServerMienBac";
            }
            else
            {
                // Gọi đúng tên trong appsettings.json của bạn
                keyConfig = "ServerMienNam";
            }

            // 3. Lấy chuỗi kết nối
            string connString = Configuration.GetConnectionString(keyConfig);

            // Kiểm tra xem có lấy được không
            if (string.IsNullOrEmpty(connString))
            {
                throw new Exception($"LỖI CẤU HÌNH: Không tìm thấy chuỗi kết nối tên '{keyConfig}' trong file appsettings.json!");
            }

            return connString;
        }
    }
}