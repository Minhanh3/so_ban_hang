// @ts-nocheck
import { Product, Order, Debt } from '../types';

const getJsPDF = () => {
    const jspdf = (window as any).jspdf;
    if (!jspdf) {
        alert('Thư viện PDF chưa tải xong.');
        throw new Error('jsPDF not loaded');
    }
    return jspdf;
};

const getHtml2Canvas = () => {
    const html2canvas = (window as any).html2canvas;
    if (!html2canvas) {
        alert('Thư viện html2canvas chưa tải xong.');
        throw new Error('html2canvas not loaded');
    }
    return html2canvas;
};

// Helper: Tạo bảng HTML tạm để capture
const createTempTable = (title: string, headers: string[], rows: string[][]) => {
    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:800px;background:#fff;padding:20px;font-family:Inter,sans-serif';

    const html = `
        <h1 style="font-size:24px;margin-bottom:20px;color:#111">${title}</h1>
        <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead>
                <tr style="background:#10b981;color:#fff">
                    ${headers.map(h => `<th style="padding:10px;border:1px solid #ddd;text-align:left">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => `
                    <tr>
                        ${row.map(cell => `<td style="padding:8px;border:1px solid #ddd">${cell}</td>`).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
};

const downloadPDF = (doc: any, filename: string) => {
    doc.save(filename);
};

export const exportProductsToPDF = async (products: Product[]) => {
    const { jsPDF } = getJsPDF();
    const html2canvas = getHtml2Canvas();

    const headers = ['Tên Sản Phẩm', 'Đơn Vị', 'Giá Bán', 'Tồn Kho', 'Biến Thể'];
    const rows = products.map(p => [
        p.name,
        p.unit || 'món',
        p.basePrice.toLocaleString() + 'đ',
        p.totalStock.toString(),
        p.variants.map(v => `${v.name} (${v.stock})`).join(', ') || 'Mặc định'
    ]);

    const container = createTempTable('Danh Sách Sản Phẩm', headers, rows);

    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    downloadPDF(pdf, 'san_pham.pdf');
};

export const exportOrdersToPDF = async (orders: Order[]) => {
    const { jsPDF } = getJsPDF();
    const html2canvas = getHtml2Canvas();

    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const exportDate = new Date().toLocaleString('vi-VN');
    const distributorName = orders[0]?.distributorName || 'Chưa cấu hình';
    const distributorPhone = orders[0]?.distributorPhone || 'Chưa cấu hình';
    const distributorAddress = orders[0]?.distributorAddress || 'Chưa cấu hình';

    const headers = ['Mã đơn', 'Ngày', 'Sản phẩm', 'Tổng tiền', 'Nhà phân phối', 'SĐT NPP'];
    const rows = orders.map(o => [
        `#${o.id.slice(-6).toUpperCase()}`,
        new Date(o.date).toLocaleDateString('vi-VN'),
        o.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
        o.totalAmount.toLocaleString('vi-VN') + 'đ',
        o.distributorName || distributorName,
        o.distributorPhone || distributorPhone,
    ]);

    const container = document.createElement('div');
    container.style.cssText = 'position:absolute;left:-9999px;top:0;width:980px;background:#fff;padding:30px;font-family:Inter,sans-serif';

    container.innerHTML = `
        <div style="margin-bottom:20px;border-bottom:2px solid #10b981;padding-bottom:15px">
            <h1 style="font-size:28px;margin:0;color:#10b981;font-weight:bold">Danh sách đơn hàng</h1>
            <p style="margin:8px 0 0;font-size:14px;color:#333"><strong>Nhà phân phối:</strong> ${distributorName}</p>
            <p style="margin:5px 0;font-size:14px;color:#666"><strong>Địa chỉ:</strong> ${distributorAddress}</p>
            <p style="margin:5px 0;font-size:14px;color:#666"><strong>SDT:</strong> ${distributorPhone}</p>
        </div>
        <div style="margin-bottom:15px;display:flex;justify-content:space-between;font-size:13px">
            <div><strong>Ngày xuất:</strong> ${exportDate}</div>
            <div><strong>Tổng số đơn:</strong> ${orders.length} đơn</div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:11px">
            <thead>
                <tr style="background:#10b981;color:#fff">
                    ${headers.map(h => `<th style="padding:10px;border:1px solid #ddd;text-align:left">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td style="padding:8px;border:1px solid #ddd">${cell}</td>`).join('')}</tr>`).join('')}
            </tbody>
        </table>
        <div style="margin-top:20px;text-align:right;padding:15px;background:#f0fdf4;border-radius:8px">
            <p style="margin:0;font-size:18px;font-weight:bold;color:#10b981">TỔNG DOANH THU: ${totalAmount.toLocaleString('vi-VN')}đ</p>
        </div>
    `;

    document.body.appendChild(container);
    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', 'a4');
    const imgWidth = 277;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    downloadPDF(pdf, 'don_hang.pdf');
};

export const exportDebtsToPDF = async (debts: Debt[]) => {
    const { jsPDF } = getJsPDF();
    const html2canvas = getHtml2Canvas();

    const headers = ['Ngày', 'Người Liên Hệ', 'Loại', 'Số Tiền', 'Ghi Chú'];
    const rows = debts.map(d => [
        new Date(d.date).toLocaleDateString('vi-VN'),
        d.contactName,
        d.type === 'customer_receivable' ? 'Khách nợ mình' : 'Mình nợ NCC',
        d.amount.toLocaleString() + 'đ',
        d.note || ''
    ]);

    const container = createTempTable('Sổ Nợ', headers, rows);
    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    downloadPDF(pdf, 'so_no.pdf');
};

export const exportFinanceToPDF = async (data: any[]) => {
    const { jsPDF } = getJsPDF();
    const html2canvas = getHtml2Canvas();

    const headers = ['Ngày', 'Doanh Thu', 'Lợi Nhuận'];
    const rows = data.map(d => [
        d.date,
        d.revenue.toLocaleString() + 'đ',
        d.profit.toLocaleString() + 'đ'
    ]);

    const container = createTempTable('Báo Cáo Tài Chính', headers, rows);
    const canvas = await html2canvas(container, { scale: 2 });
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
    downloadPDF(pdf, 'bao_cao_tai_chinh.pdf');
};
