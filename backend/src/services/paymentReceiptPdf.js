const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const fmt = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const rupee = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

function verifyUrl(grn) {
  const base = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5050}`;
  return `${base.replace(/\/$/, '')}/api/payments/verify/${grn}`;
}

/** Streams an A4 e-Challan / treasury receipt (with QR) for `payment` into `out`. */
async function streamReceipt(payment, business, out) {
  const url = verifyUrl(payment.grnNumber);
  const qr = await QRCode.toBuffer(url, { margin: 1, width: 220 });

  const doc = new PDFDocument({
    size: 'A4', margin: 50,
    info: { Title: `Receipt ${payment.grnNumber}`, Author: 'VyaparSetu / MahaGRAS', Subject: 'Consolidated Treasury Fee Receipt' }
  });
  const done = new Promise((resolve, reject) => { out.on('finish', resolve); out.on('error', reject); doc.on('error', reject); });
  doc.pipe(out);

  const navy = '#1e3a8a', grey = '#64748b', ink = '#0f172a', green = '#065f46';
  doc.rect(25, 25, 545, 792).lineWidth(2).stroke('#059669');
  doc.rect(32, 32, 531, 778).lineWidth(0.5).stroke('#94a3b8');

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(10).text('MAHAGRAS  |  GOVERNMENT RECEIPT ACCOUNTING SYSTEM', 50, 55, { align: 'center', characterSpacing: 1 });
  doc.fillColor(grey).font('Helvetica').fontSize(8).text('Finance Department, Government of Maharashtra', 50, 68, { align: 'center' });
  doc.moveTo(150, 84).lineTo(445, 84).lineWidth(1).stroke('#059669');
  doc.fillColor(ink).fontSize(20).text('Consolidated Treasury Fee Receipt', 50, 98, { align: 'center' });
  doc.fillColor(green).font('Helvetica-Bold').fontSize(11).text('PAYMENT STATUS: SUCCESS (Treasury Realized)', 50, 128, { align: 'center' });

  const rows = [
    ['Challan GRN Number', payment.grnNumber],
    ['Depositor', payment.businessName || (business && business.businessName) || '-'],
    ['Transaction Date', fmt(payment.paidAt)],
    ['Payment Channel', String(payment.method).toUpperCase()],
    ['Bank Reference (CIN)', payment.bankReferenceCIN || '-']
  ];
  let y = 160;
  rows.forEach(([k, v], i) => {
    if (i % 2 === 0) doc.rect(70, y - 5, 455, 22).fill('#f0fdf4');
    doc.fillColor(grey).font('Helvetica').fontSize(9.5).text(k, 82, y, { width: 180 });
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(10.5).text(String(v), 260, y - 1, { width: 260 });
    y += 22;
  });

  y += 15;
  doc.fillColor(ink).font('Helvetica-Bold').fontSize(11).text('Fee Breakdown', 70, y);
  y += 18;
  doc.rect(70, y, 455, 20).fill('#111827');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5).text('CLEARANCE / DEPARTMENT', 78, y + 6).text('AMOUNT', 460, y + 6);
  y += 20;
  (payment.breakdown || []).forEach((item, i) => {
    if (i % 2 === 0) doc.rect(70, y, 455, 22).fill('#f8fafc');
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(9).text(item.approvalName, 78, y + 6, { width: 300 });
    doc.fillColor(grey).font('Helvetica').fontSize(7.5).text(item.departmentName || '', 78, y + 16, { width: 300 });
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(9.5).text(rupee(item.amount), 460, y + 7, { width: 60, align: 'right' });
    y += 24;
  });
  doc.rect(70, y, 455, 26).fill('#059669');
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10).text('TOTAL CONSOLIDATED AMOUNT', 82, y + 8)
    .text(rupee(payment.totalAmount), 440, y + 8, { width: 75, align: 'right' });

  const qy = y + 50;
  doc.image(qr, 70, qy, { width: 110 });
  doc.fillColor(ink).font('Helvetica-Bold').fontSize(10).text('Scan to verify this receipt', 195, qy + 10);
  doc.fillColor(grey).font('Helvetica').fontSize(8.5).text('This receipt is valid statutory proof of fee deposit under Maharashtra Treasury Rules and can be independently verified online.', 195, qy + 26, { width: 330 });

  doc.fillColor(grey).font('Helvetica').fontSize(8)
    .text(`System-generated receipt. Generated on ${fmt(new Date())}.`, 50, 770, { align: 'center', width: 495 })
    .text(url, 50, 782, { align: 'center', width: 495 });

  doc.end();
  return done;
}

module.exports = { streamReceipt, verifyUrl };
