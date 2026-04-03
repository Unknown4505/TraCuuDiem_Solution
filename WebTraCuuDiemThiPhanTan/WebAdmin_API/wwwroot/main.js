document.addEventListener("DOMContentLoaded", () => {
    // 1. DOM Elements
    const toggleMB = document.getElementById('toggle-mb');
    const toggleMN = document.getElementById('toggle-mn');
    const btnSearch = document.getElementById('btnSearch');
    const sbdInput = document.getElementById('sbdInput');
    const msg = document.getElementById('validation-msg');

    const resultContainer = document.getElementById('resultContainer');
    const statusAlert = document.getElementById('statusAlert');

    // 2. Sự kiện Tra Cứu
    btnSearch.addEventListener('click', () => {
        const sbd = sbdInput.value.trim();
        msg.innerText = "";

        // Reset Giao diện
        resultContainer.style.display = 'none';
        statusAlert.style.display = 'none';

        // Validate SBD (Phải là 6 số)
        if (!/^\d{6}$/.test(sbd)) {
            msg.innerText = "⚠ Vui lòng nhập Số báo danh gồm 6 chữ số.";
            return;
        }

        // 3. Logic Định Tuyến (Routing)
        const sbdNum = parseInt(sbd);
        let targetRegion = "";
        let isServerOnline = false;

        // Quy tắc phân mảnh: 0-500k -> Bắc, >500k -> Nam
        if (sbdNum >= 0 && sbdNum <= 500999) {
            targetRegion = "MB";
            isServerOnline = toggleMB.checked;
        } else if (sbdNum >= 501000 && sbdNum <= 999999) {
            targetRegion = "MN";
            isServerOnline = toggleMN.checked;
        } else {
            msg.innerText = "⚠ SBD không hợp lệ (Không thuộc vùng dữ liệu nào).";
            return;
        }

        // Hiệu ứng Loading
        showStatus(true, "Đang kết nối đến Node dữ liệu phân tán...");

        setTimeout(() => {
            // Kiểm tra trạng thái Server giả lập (Nút gạt)
            if (!isServerOnline) {
                showStatus(false, `Lỗi kết nối: Server ${targetRegion === 'MB' ? 'Miền Bắc' : 'Miền Nam'} đang OFFLINE (Mã lỗi: 503).`, "error");
                return;
            }

            // 4. Gọi API Backend
            fetch(`/api/TraCuu/${sbd}`)
                .then(response => {
                    if (response.ok) return response.json();
                    else if (response.status === 404) throw new Error("Không tìm thấy thí sinh này trong CSDL.");
                    else throw new Error("Lỗi hệ thống: " + response.statusText);
                })
                .then(data => {
                    // Thành công -> Ẩn loading, hiện dashboard
                    statusAlert.style.display = 'none';
                    renderDashboard(data);
                    resultContainer.style.display = 'grid'; // Grid layout
                })
                .catch(error => {
                    showStatus(false, error.message, "error");
                });

        }, 800); // Giả lập độ trễ mạng 0.8s cho thật
    });

    // --- HÀM HỖ TRỢ ---

    // Hiển thị trạng thái Loading/Error
    function showStatus(isLoading, text, type = "loading") {
        statusAlert.style.display = 'flex';
        statusAlert.innerHTML = isLoading
            ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`
            : `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`;

        if (type === "error") {
            statusAlert.style.background = "#ffe2e5";
            statusAlert.style.color = "#f64e60";
            statusAlert.style.borderColor = "#f64e60";
        } else {
            statusAlert.style.background = "#fff4de";
            statusAlert.style.color = "#ffa800";
            statusAlert.style.borderColor = "#ffa800";
        }
    }

    // Render dữ liệu lên Dashboard
    function renderDashboard(data) {
        // 1. Xử lý Server Card
        const serverCard = document.getElementById('serverStatusCard');
        const outSource = document.getElementById('outServerSource');

        // Reset class màu cũ
        serverCard.classList.remove('sv-bac', 'sv-nam');

        if (data.serverSource && data.serverSource.toLowerCase().includes("bắc")) {
            serverCard.classList.add('sv-bac'); // Màu hồng
            outSource.innerText = "NODE: MIỀN BẮC (HN)";
        } else {
            serverCard.classList.add('sv-nam'); // Màu xanh
            outSource.innerText = "NODE: MIỀN NAM (HCM)";
        }

        // 2. Điền thông tin thí sinh
        document.getElementById('outName').innerText = data.hoTen;
        document.getElementById('outSBD').innerText = data.sbd;
        document.getElementById('outMaVung').innerText = (data.maVung === 'MB' ? 'Miền Bắc' : 'Miền Nam');
        document.getElementById('outToHop').innerText = data.tenToHop;

        // 3. Render Bảng Điểm
        const tbody = document.getElementById('scoreBody');
        tbody.innerHTML = '';

        const subjects = [
            { name: 'Toán', val: data.toan },
            { name: 'Ngữ Văn', val: data.van },
            { name: 'Tiếng Anh', val: data.anh },
            { name: 'Vật Lý', val: data.ly },
            { name: 'Hóa Học', val: data.hoa },
            { name: 'Sinh Học', val: data.sinh },
            { name: 'Lịch Sử', val: data.su },
            { name: 'Địa Lý', val: data.dia },
            { name: 'GDCD', val: data.gdcd },
        ];

        subjects.forEach(sub => {
            if (sub.val !== null && sub.val > 0) {
                // Logic Xếp loại & Màu sắc
                let xepLoai = '<span class="badge badge-tb">Trung Bình</span>';
                let scoreClass = '';

                if (sub.val >= 8) {
                    xepLoai = '<span class="badge badge-gioi">Giỏi</span>';
                    scoreClass = 'score-high'; // Xanh
                } else if (sub.val >= 6.5) {
                    xepLoai = '<span class="badge badge-kha">Khá</span>';
                    scoreClass = 'score-high';
                } else if (sub.val < 5) {
                    xepLoai = '<span class="badge badge-yeu">Yếu</span>';
                    scoreClass = 'score-low'; // Đỏ
                }

                const row = `<tr>
                    <td>${sub.name}</td>
                    <td class="text-right ${scoreClass}" style="font-weight:bold;">${sub.val}</td>
                    <td class="text-center">${xepLoai}</td>
                </tr>`;
                tbody.innerHTML += row;
            }
        });
    }
});