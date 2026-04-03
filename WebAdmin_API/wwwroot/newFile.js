// --- TÍNH NĂNG VẼ BIỂU ĐỒ THỐNG KÊ ---
document.addEventListener("DOMContentLoaded", () => {
    // --- LOGIC CHUYỂN TAB (SPA) ---
    const navTracuu = document.getElementById('nav-tracuu');
    const navBaocao = document.getElementById('nav-baocao');
    const navCauhinh = document.getElementById('nav-cauhinh');

    const viewTracuu = document.getElementById('view-tracuu');
    const viewBaocao = document.getElementById('view-baocao');

    // Hàm thực hiện việc tắt/bật phòng
    function switchTab(tabName) {
        // 1. Tắt đèn (Xóa class active) ở tất cả menu
        navTracuu.classList.remove('active');
        navBaocao.classList.remove('active');
        navCauhinh.classList.remove('active');

        // 2. Tàng hình tất cả các phòng
        viewTracuu.style.display = 'none';
        viewBaocao.style.display = 'none';

        // 3. Ai được gọi tên thì hiện lên
        if (tabName === 'tracuu') {
            navTracuu.classList.add('active');
            viewTracuu.style.display = 'block';
        } else if (tabName === 'baocao') {
            navBaocao.classList.add('active');
            viewBaocao.style.display = 'block';
        }
    }

    // Gắn sự kiện Click cho các nút menu
    navTracuu.addEventListener('click', (e) => {
        e.preventDefault(); // Ngăn trình duyệt tự tải lại trang
        switchTab('tracuu');
    });

    navBaocao.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('baocao');
    });

    navCauhinh.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Tính năng cấu hình Node đang được phát triển!");
    });
    // Gọi API lấy số liệu
    // --- TÍNH NĂNG VẼ BIỂU ĐỒ THỐNG KÊ KÉP ---
    document.addEventListener("DOMContentLoaded", () => {
        fetch('/api/TraCuu/thong-ke')
            .then(res => res.json())
            .then(data => {
                // 1. VẼ BIỂU ĐỒ CỘT (scoreChart)
                const ctxBar = document.getElementById('scoreChart').getContext('2d');
                new Chart(ctxBar, {
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

                // 2. VẼ BIỂU ĐỒ TRÒN (ratioChart)
                const ctxPie = document.getElementById('ratioChart').getContext('2d');
                new Chart(ctxPie, {
                    type: 'doughnut', // doughnut là dạng tròn có lỗ ở giữa nhìn rất hiện đại
                    data: {
                        labels: data.toHopLabels,
                        datasets: [{
                            data: data.toHopData,
                            backgroundColor: [
                                'rgba(86, 100, 210, 0.8)', // Màu Xanh Tím cho KHTN
                                'rgba(255, 168, 0, 0.8)' // Màu Vàng Cam cho KHXH
                            ],
                            hoverOffset: 6,
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom' } },
                        cutout: '70%' // Làm cái lỗ ở giữa to ra cho đẹp, giống nhẫn kim cương
                    }
                });
            })
            .catch(err => console.error("Lỗi vẽ biểu đồ:", err));
    });
});
