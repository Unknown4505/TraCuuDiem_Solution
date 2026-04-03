document.addEventListener("DOMContentLoaded", () => {
    const toggleMB = document.getElementById('toggle-mb');
    const toggleMN = document.getElementById('toggle-mn');
    const btnSearch = document.getElementById('btnSearch');
    const sbdInput = document.getElementById('sbdInput');
    const msg = document.getElementById('validation-msg');
    const resultContainer = document.getElementById('resultContainer');
    const statusAlert = document.getElementById('statusAlert');

    // ==========================================
    // 1. TRA CỨU ĐIỂM
    // ==========================================
    btnSearch.addEventListener('click', () => {
        const sbd = sbdInput.value.trim();
        msg.innerText = "";
        resultContainer.style.display = 'none';
        statusAlert.style.display = 'none';

        if (!/^\d{6}$/.test(sbd)) {
            msg.innerText = "⚠ Vui lòng nhập Số báo danh gồm 6 chữ số.";
            return;
        }

        const sbdNum = parseInt(sbd);
        let targetRegion = "";
        let isServerOnline = false;

        if (sbdNum >= 0 && sbdNum <= 500999) { targetRegion = "MB"; isServerOnline = toggleMB.checked; }
        else if (sbdNum >= 501000 && sbdNum <= 999999) { targetRegion = "MN"; isServerOnline = toggleMN.checked; }
        else { msg.innerText = "⚠ SBD không hợp lệ."; return; }

        showStatus(true, "Đang kết nối đến Node dữ liệu...");

        setTimeout(() => {
            if (!isServerOnline) {
                showStatus(false, `Lỗi: Server ${targetRegion === 'MB' ? 'Miền Bắc' : 'Miền Nam'} đang OFFLINE.`, "error");
                return;
            }

            fetch(`/api/TraCuu/${sbd}`)
                .then(response => {
                    if (response.ok) return response.json();
                    else if (response.status === 404) throw new Error("Không tìm thấy thí sinh này.");
                    else throw new Error("Lỗi hệ thống.");
                })
                .then(data => {
                    statusAlert.style.display = 'none';
                    renderDashboard(data);
                    resultContainer.style.display = 'grid';
                    saveToHistory(sbd); // Lưu lịch sử
                })
                .catch(error => showStatus(false, error.message, "error"));
        }, 800);
    });

    function showStatus(isLoading, text, type = "loading") {
        statusAlert.style.display = 'flex';
        statusAlert.innerHTML = isLoading ? `<i class="fa-solid fa-spinner fa-spin"></i> ${text}` : `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`;
        if (type === "error") {
            statusAlert.style.background = "#ffe2e5"; statusAlert.style.color = "#f64e60"; statusAlert.style.borderColor = "#f64e60";
        } else {
            statusAlert.style.background = "#fff4de"; statusAlert.style.color = "#ffa800"; statusAlert.style.borderColor = "#ffa800";
        }
    }

    function renderDashboard(data) {
        const heThong = data.thongTinTraCuu;
        const hs = data.thongTinThiSinh;
        const diem = data.diemThi;

        const serverCard = document.getElementById('serverStatusCard');
        const outSource = document.getElementById('outServerSource');

        serverCard.classList.remove('sv-bac', 'sv-nam');
        if (hs.serverSource.includes("Bắc")) { serverCard.classList.add('sv-bac'); outSource.innerText = "NODE: MIỀN BẮC (HN)"; }
        else { serverCard.classList.add('sv-nam'); outSource.innerText = "NODE: MIỀN NAM (HCM)"; }

        document.getElementById('outName').innerText = hs.hoTen;
        document.getElementById('outSBD').innerText = hs.sbd;
        document.getElementById('outToHop').innerText = hs.tenToHop;
        document.getElementById('outMaVung').innerText = heThong.viTriGPS;

        const tbody = document.getElementById('scoreBody');
        tbody.innerHTML = '';
        let danhSachMon = hs.tenToHop.includes("KHTN")
            ? [{ name: 'Toán', val: diem.toan }, { name: 'Ngữ Văn', val: diem.van }, { name: 'Tiếng Anh', val: diem.anh }, { name: 'Vật Lý', val: diem.ly }, { name: 'Hóa Học', val: diem.hoa }, { name: 'Sinh Học', val: diem.sinh }]
            : [{ name: 'Toán', val: diem.toan }, { name: 'Ngữ Văn', val: diem.van }, { name: 'Tiếng Anh', val: diem.anh }, { name: 'Lịch Sử', val: diem.su }, { name: 'Địa Lý', val: diem.dia }, { name: 'GDCD', val: diem.gdcd }];

        danhSachMon.forEach(sub => {
            let scoreDisplay = sub.val !== undefined && sub.val !== null ? sub.val : '<span style="color: #b5b5c3; font-style: italic; font-weight: 400; font-size: 13px;">Không thi</span>';
            let scoreClass = sub.val >= 8 ? 'score-high' : (sub.val < 5 ? 'score-low' : '');
            tbody.innerHTML += `<tr><td>${sub.name}</td><td class="text-right ${scoreClass}" style="font-weight:bold;">${scoreDisplay}</td></tr>`;
        });
    }

    // ==========================================
    // 2. CHUYỂN TAB (SPA)
    // ==========================================
    const navTracuu = document.getElementById('nav-tracuu');
    const navBaocao = document.getElementById('nav-baocao');
    const viewTracuu = document.getElementById('view-tracuu');
    const viewBaocao = document.getElementById('view-baocao');

    function switchTab(tabName) {
        navTracuu.classList.remove('active');
        navBaocao.classList.remove('active');
        viewTracuu.style.display = 'none';
        viewBaocao.style.display = 'none';

        if (tabName === 'tracuu') { navTracuu.classList.add('active'); viewTracuu.style.display = 'block'; }
        else if (tabName === 'baocao') { navBaocao.classList.add('active'); viewBaocao.style.display = 'block'; }
    }

    navTracuu.addEventListener('click', (e) => { e.preventDefault(); switchTab('tracuu'); });
    navBaocao.addEventListener('click', (e) => { e.preventDefault(); switchTab('baocao'); });

    // ==========================================
    // 3. TẢI PDF
    // ==========================================
    document.getElementById('btnExportPDF').addEventListener('click', () => {
        const element = document.querySelector('.score-card');
        const sbd = document.getElementById('outSBD').innerText;
        if (sbd === "--") { alert("Vui lòng tra cứu điểm trước khi tải PDF!"); return; }

        html2pdf().set({
            margin: 10, filename: `PhieuDiem_${sbd}.pdf`, image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(element).save();
    });

    // ==========================================
    // 4. LỊCH SỬ TRA CỨU
    // ==========================================
    function loadHistory() {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        const listObj = document.getElementById('history-list');
        if (history.length === 0) listObj.innerText = "Chưa có";
        else listObj.innerHTML = history.map(sbd => `<a href="#" onclick="document.getElementById('sbdInput').value='${sbd}'; document.getElementById('btnSearch').click(); return false;" style="color: var(--primary); font-weight: 600; margin-right: 15px; text-decoration: underline;">${sbd}</a>`).join('');
    }

    function saveToHistory(sbd) {
        let history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        history = history.filter(item => item !== sbd);
        history.unshift(sbd);
        if (history.length > 5) history.pop();
        localStorage.setItem('searchHistory', JSON.stringify(history));
        loadHistory();
    }
    loadHistory();

    // ==========================================
    // 5. VẼ BIỂU ĐỒ & NẠP KPI (TỪ DATABASE THẬT)
    // ==========================================
    fetch('/api/TraCuu/thong-ke')
        .then(res => res.json())
        .then(data => {
            // Nạp số liệu vào thẻ KPI
            let totalKHTN = data.toHopData[0];
            let totalKHXH = data.toHopData[1];
            document.getElementById('kpiTong').innerText = (totalKHTN + totalKHXH).toLocaleString();
            document.getElementById('kpiKHTN').innerText = totalKHTN.toLocaleString();
            document.getElementById('kpiKHXH').innerText = totalKHXH.toLocaleString();

            // Vẽ biểu đồ Cột
            new Chart(document.getElementById('scoreChart').getContext('2d'), {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [
                        { label: 'Miền Bắc', data: data.diemTB_MienBac, backgroundColor: 'rgba(214, 51, 132, 0.8)', borderRadius: 6 },
                        { label: 'Miền Nam', data: data.diemTB_MienNam, backgroundColor: 'rgba(13, 110, 253, 0.8)', borderRadius: 6 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true, max: 10 } } }
            });

            // Vẽ biểu đồ Tròn
            new Chart(document.getElementById('ratioChart').getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: data.toHopLabels,
                    datasets: [{ data: data.toHopData, backgroundColor: ['rgba(86, 100, 210, 0.8)', 'rgba(255, 168, 0, 0.8)'], hoverOffset: 6, borderWidth: 0 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }
            });
        })
        .catch(err => console.error("Lỗi vẽ biểu đồ:", err));
    // ==========================================
    // 6. TÍNH NĂNG NGẮT SERVER ĐỘT NGỘT (REAL-TIME KILL)
    // ==========================================

    // Bắt sự kiện khi nút gạt Miền Bắc thay đổi
    // Bắt sự kiện khi nút gạt Miền Bắc thay đổi
    toggleMB.addEventListener('change', () => {
        handleServerToggle('MB', toggleMB.checked);
    });

    // Bắt sự kiện khi nút gạt Miền Nam thay đổi
    toggleMN.addEventListener('change', () => {
        handleServerToggle('MN', toggleMN.checked);
    });

    function handleServerToggle(region, isOnline) {
        const currentSbd = sbdInput.value.trim();
        let targetRegion = "";

        // Xác định xem cái SBD đang nằm trên ô tìm kiếm là của miền nào
        if (currentSbd.length === 6) {
            const sbdNum = parseInt(currentSbd);
            if (sbdNum >= 0 && sbdNum <= 500999) targetRegion = "MB";
            else if (sbdNum >= 501000 && sbdNum <= 999999) targetRegion = "MN";
        }

        // 🟢 TRƯỜNG HỢP 1: BẬT SERVER LÊN (Auto-Recovery)
        if (isOnline) {
            // Nếu SBD hiện tại đúng là của Server vừa bật + đang có cảnh báo lỗi OFFLINE -> Tự động khôi phục!
            if (targetRegion === region && statusAlert.style.display !== 'none') {
                btnSearch.click(); // Lệnh này giả lập con chuột tự động click vào nút "Tra Cứu"
            }
            return;
        }

        // 🔴 TRƯỜNG HỢP 2: TẮT SERVER ĐI (Ngắt điện)
        if (resultContainer.style.display === 'grid') {
            const currentServer = document.getElementById('outServerSource').innerText;
            const isShowingMB = currentServer.includes('MIỀN BẮC');
            const isShowingMN = currentServer.includes('MIỀN NAM');

            if (region === 'MB' && isShowingMB) {
                killConnection('Miền Bắc');
            } else if (region === 'MN' && isShowingMN) {
                killConnection('Miền Nam');
            }
        }
    }

    // Hàm "cắt điện" giao diện
    function killConnection(serverName) {
        resultContainer.style.display = 'none';
        showStatus(false, `MẤT KẾT NỐI: Node ${serverName} vừa bị sập! Hệ thống đang chờ tín hiệu khôi phục...`, "error");
    }
});