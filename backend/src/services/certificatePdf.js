const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

function verifyUrl(code) {
  const base = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5050}`;
  return `${base.replace(/\/$/, '')}/api/licences/verify/${code}`;
}

/**
 * Streams an A4 digital licence certificate (with QR that opens the public verify endpoint) into `out`.
 * Resolves when the PDF has been fully written.
 */
async function streamCertificate(licence, business, out) {
  const url = verifyUrl(licence.qrVerificationCode);
  const qr = await QRCode.toBuffer(url, { margin: 1, width: 240 });

  const doc = new PDFDocument({
    size: 'A4', margin: 50,
    info: { Title: `Licence ${licence.licenceNumber}`, Author: 'VyaparSetu', Subject: licence.approvalName }
  });
  const done = new Promise((resolve, reject) => { out.on('finish', resolve); out.on('error', reject); doc.on('error', reject); });
  doc.pipe(out);

  const navy = '#1e3a8a', grey = '#64748b', ink = '#0f172a';
  doc.rect(25, 25, 545, 792).lineWidth(2).stroke(navy);
  doc.rect(32, 32, 531, 778).lineWidth(0.5).stroke('#94a3b8');

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(11).text('VYAPARSETU  |  SINGLE WINDOW BUSINESS APPROVALS', 50, 60, { align: 'center', characterSpacing: 1 });
  doc.moveTo(150, 82).lineTo(445, 82).lineWidth(1).stroke('#f59e0b');
  doc.fillColor(ink).fontSize(24).text('Digital Licence Certificate', 50, 100, { align: 'center' });
  doc.fillColor(grey).font('Helvetica').fontSize(10).text('This is to certify that the approval below has been granted', 50, 134, { align: 'center' });

  doc.fillColor(grey).fontSize(9).text('GRANTED TO', 50, 175, { align: 'center', characterSpacing: 1 });
  doc.fillColor(ink).font('Helvetica-Bold').fontSize(20).text(licence.businessName, 60, 192, { align: 'center', width: 475 });
  const loc = business ? [business.district, business.state].filter(Boolean).join(', ') : '';
  if (loc) doc.fillColor(grey).font('Helvetica').fontSize(10).text(loc, 50, doc.y + 2, { align: 'center' });

  doc.fillColor(navy).font('Helvetica-Bold').fontSize(15).text(licence.approvalName, 60, doc.y + 22, { align: 'center', width: 475 });
  doc.fillColor(grey).font('Helvetica').fontSize(10).text(licence.departmentName || '', 50, doc.y + 4, { align: 'center' });

  const rows = [
    ['Licence Number', licence.licenceNumber],
    ['Issue Date', fmt(licence.issueDate)],
    ['Valid Until', fmt(licence.expiryDate)],
    ['Validity', licence.validityText || '-'],
    ['Status', licence.status],
    ['PAN', (business && business.panNumber) || '-'],
    ['GSTIN', (business && business.gstin) || '-']
  ];
  let y = doc.y + 30;
  rows.forEach(([k, v], i) => {
    if (i % 2 === 0) doc.rect(70, y - 5, 455, 24).fill('#f1f5f9');
    doc.fillColor(grey).font('Helvetica').fontSize(10).text(k, 82, y, { width: 150 });
    doc.fillColor(ink).font('Helvetica-Bold').fontSize(11).text(String(v), 240, y - 1, { width: 280 });
    y += 24;
  });

  const qy = y + 25;
  doc.image(qr, 70, qy, { width: 120 });
  doc.fillColor(ink).font('Helvetica-Bold').fontSize(11).text('Scan to verify authenticity', 210, qy + 12);
  doc.fillColor(grey).font('Helvetica').fontSize(9)
    .text('Anyone (banks, auditors, inspectors) can confirm this licence is genuine using the QR code or the verification code below.', 210, qy + 30, { width: 315 });
  doc.fillColor(navy).font('Courier-Bold').fontSize(13).text(`Verification Code: ${licence.qrVerificationCode}`, 210, qy + 78);

  doc.fillColor(grey).font('Helvetica').fontSize(8)
    .text(`System-generated digital certificate. No physical signature required. Generated on ${fmt(new Date())}.`, 50, 770, { align: 'center', width: 495 })
    .text(url, 50, 782, { align: 'center', width: 495 });

  doc.end();
  return done;
}

module.exports = { streamCertificate, verifyUrl };
