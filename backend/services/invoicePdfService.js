const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ASSET_DIR = path.join(__dirname, '../public/invoice-assets');
const COMPANY = {
  name: 'GUJRAT SOLAR ENERGY',
  gstin: '09GBQPS0127B1ZL',
  addressLines: ['83/161-3', 'PARAMPURWA, JUHI, Kanpur', 'Kanpur Nagar, UTTAR PRADESH, 208014'],
  mobile: '+91 8545909039',
  email: 'gujratsolar14@gmail.com',
  website: 'www.gujratsolarenergy.com',
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const money = value => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const numberToIndianWords = input => {
  const n = Math.round(Number(input) || 0);
  if (!n) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const underThousand = value => {
    let result = '';
    if (value >= 100) { result += `${ones[Math.floor(value / 100)]} Hundred`; value %= 100; if (value) result += ' '; }
    if (value >= 20) { result += tens[Math.floor(value / 10)]; value %= 10; if (value) result += ` ${ones[value]}`; }
    else if (value > 0) result += ones[value];
    return result;
  };
  let value = n;
  const parts = [];
  for (const [unit, size] of [['Crore', 10000000], ['Lakh', 100000], ['Thousand', 1000], ['', 1]]) {
    const chunk = Math.floor(value / size); value %= size;
    if (chunk) parts.push(`${underThousand(chunk)}${unit ? ` ${unit}` : ''}`.trim());
  }
  return `INR ${parts.join(' ')} Rupees Only`;
};
const date = value => value ? new Date(value).toLocaleDateString('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric',
}) : '—';
const imageData = file => {
  const fullPath = path.join(ASSET_DIR, file);
  if (!fs.existsSync(fullPath)) return '';
  const mime = path.extname(fullPath).toLowerCase() === '.jpg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${fs.readFileSync(fullPath).toString('base64')}`;
};

// The PDF intentionally shows only two summarized rows, matching the client sample.
// Detailed invoice.items remain unchanged in MongoDB for records and calculations.
const summarizeInvoiceItems = (sourceItems = []) => {
  const items = Array.isArray(sourceItems) ? sourceItems : [];
  if (!items.length) return [];

  const isMainSolarItem = item => {
    const description = String(item.description || '').toLowerCase();
    return /panel|module|inverter|solar\s*pv|ongrid|on-grid/.test(description);
  };

  let mainItems = items.filter(isMainSolarItem);
  let accessoryItems = items.filter(item => !isMainSolarItem(item));

  // If descriptions do not identify panel/inverter rows, keep the first row as
  // the main system and group the remaining rows as accessories.
  if (!mainItems.length) {
    mainItems = [items[0]];
    accessoryItems = items.slice(1);
  }

  const summarize = (group, description) => {
    if (!group.length) return null;
    const taxableValue = group.reduce((sum, item) => sum + Number(item.taxableValue || 0), 0);
    const taxAmount = group.reduce((sum, item) => sum + Number(item.taxAmount || 0), 0);
    const amount = group.reduce((sum, item) => sum + Number(item.amount ?? (Number(item.taxableValue || 0) + Number(item.taxAmount || 0))), 0);
    const qty = group.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const rates = [...new Set(group.map(item => Number(item.gstRate || 0)))];
    const gstLabel = rates.length === 1 ? `${rates[0]}%` : 'Mixed GST';
    return {
      description,
      rate: taxableValue,
      qty: 1,
      taxableValue,
      taxAmount,
      amount,
      gstLabel,
      sourceQty: qty
    };
  };

  const mainDescription = mainItems.length === 1
    ? String(mainItems[0].description || 'Solar Inverter & Panel')
    : 'Solar Inverter & Panel';

  return [
    summarize(mainItems, mainDescription),
    summarize(accessoryItems, 'Structure & Other accessories')
  ].filter(Boolean);
};

const buildInvoiceHtml = invoice => {
  const customer = invoice.customer || {};
  const sourceItems = Array.isArray(invoice.items) ? invoice.items : [];
  const items = summarizeInvoiceItems(sourceItems);
  const cgst = Number(invoice.cgst_2_5 || 0) + Number(invoice.cgst_6 || 0) + Number(invoice.cgst_9 || 0) + Number(invoice.cgst_14 || 0);
  const sgst = Number(invoice.sgst_2_5 || 0) + Number(invoice.sgst_6 || 0) + Number(invoice.sgst_9 || 0) + Number(invoice.sgst_14 || 0);
  const taxRows = [
    ['CGST 2.5%', invoice.cgst_2_5], ['SGST 2.5%', invoice.sgst_2_5],
    ['CGST 6.0%', invoice.cgst_6], ['SGST 6.0%', invoice.sgst_6],
    ['CGST 9.0%', invoice.cgst_9], ['SGST 9.0%', invoice.sgst_9],
    ['CGST 14.0%', invoice.cgst_14], ['SGST 14.0%', invoice.sgst_14],
  ].filter(([, amount]) => Number(amount || 0) > 0);
  const logo = imageData('gujarat-solar-logo.png');
  const signature = imageData('authorized-signature.png');
  const itemRows = items.map((item, index) => `
    <tr>
      <td class="center">${index + 1}</td>
      <td class="item-name">${escapeHtml(item.description)}</td>
      <td class="num">${money(item.rate)}</td>
      <td class="center">${escapeHtml(item.qty)}</td>
      <td class="num">${money(item.taxableValue)}</td>
      <td class="num">${money(item.taxAmount)} (${escapeHtml(item.gstLabel || `${Number(item.gstRate || 0)}%`)})</td>
      <td class="num strong">${money(item.amount)}</td>
    </tr>`).join('');
  const totalQty = sourceItems.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const amountWords = escapeHtml(invoice.amountInWords || numberToIndianWords(invoice.grandTotal));
  const quotationLine = invoice.quotation?.estimateNo
    ? `<div class="quotation-ref">Quotation Reference: ${escapeHtml(invoice.quotation.estimateNo)}</div>` : '';

  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(invoice.invoiceNo || 'Tax Invoice')}</title>
  <style>
    *{box-sizing:border-box} @page{size:A4;margin:12mm 13mm 14mm}
    body{font-family:Arial,Helvetica,sans-serif;color:#171717;font-size:10px;margin:0;background:#fff}
    .topline{display:flex;justify-content:space-between;align-items:center;color:#3f6fc4;font-weight:700;letter-spacing:2.4px;font-size:16px;margin-bottom:12px}
    .original{font-size:8px;letter-spacing:1px;color:#555}
    .company{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:12px}
    .company h2{font-size:16px;margin:0 0 3px;font-weight:800;letter-spacing:.2px}
    .company p{font-size:9px;line-height:1.35;margin:1px 0;color:#222}
    .logo{width:105px;height:105px;object-fit:contain}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;border-top:1px solid #e5e5e5;padding-top:10px;margin-top:8px;font-size:9px}
    .meta strong{font-weight:700}.customer{margin:12px 0 10px;font-size:9px;line-height:1.45}.customer .heading{font-weight:700;margin-bottom:3px}
    .quotation-ref{margin-top:3px;color:#555;font-size:8px}
    table{width:100%;border-collapse:collapse;margin-top:10px;font-size:9px}
    thead th{border-top:1.5px solid #8eaddc;border-bottom:1px solid #8eaddc;text-align:left;padding:6px 5px;font-weight:700;white-space:nowrap}
    tbody td{border-bottom:1px solid #d8d8d8;padding:6px 5px;vertical-align:top}
    .center{text-align:center}.num{text-align:right;white-space:nowrap}.strong{font-weight:700}.item-name{width:29%;font-weight:600}
    .totals{width:43%;margin:8px 0 0 auto;font-size:9px}.total-row{display:flex;justify-content:space-between;padding:2px 5px;gap:15px}.total-row span:last-child{min-width:105px;text-align:right;font-weight:600}
    .total-row.grand{font-size:14px;font-weight:800;border-top:1px solid #aaa;margin-top:2px;padding-top:5px}.total-row.grand span:last-child{font-weight:800}
    .bottom-line{display:flex;justify-content:space-between;align-items:flex-start;border-top:1.5px solid #8eaddc;margin-top:8px;padding-top:5px;font-size:8px;gap:15px}
    .bottom-line .words{flex:1;line-height:1.45}.payable{display:flex;justify-content:flex-end;gap:35px;font-weight:800;font-size:10px;margin-top:5px}
    .signature-block{text-align:right;margin-top:32px;padding-right:3px;font-size:9px;page-break-inside:avoid}.signature-block .for{font-weight:600;margin-bottom:2px}.signature{width:115px;height:52px;object-fit:contain;display:block;margin:0 0 0 auto}.sign-label{margin-top:0;color:#555}
    .footer{position:fixed;bottom:-7mm;left:0;right:0;border-top:1px solid #e5e5e5;padding-top:4px;display:flex;justify-content:space-between;color:#555;font-size:7px}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
    <div class="topline"><span>TAX INVOICE</span><span class="original">ORIGINAL FOR RECIPIENT</span></div>
    <section class="company"><div><h2>${COMPANY.name}</h2><p><strong>GSTIN ${COMPANY.gstin}</strong></p>${COMPANY.addressLines.map(line => `<p>${escapeHtml(line)}</p>`).join('')}<p>Mobile ${COMPANY.mobile} &nbsp; Email ${COMPANY.email}</p><p>Website ${COMPANY.website}</p></div>${logo ? `<img class="logo" src="${logo}" alt="Gujarat Solar Energy logo">` : ''}</section>
    <section class="meta"><div><strong>Invoice #:</strong> ${escapeHtml(invoice.invoiceNo)}</div><div><strong>Invoice Date:</strong> ${date(invoice.invoiceDate)}</div><div><strong>Due Date:</strong> ${date(invoice.dueDate)}</div></section>
    <section class="customer"><div class="heading">Customer Details:</div><div><strong>${escapeHtml(customer.name || '—')}</strong></div><div>Ph: ${escapeHtml(customer.mobile || customer.phone || '—')}</div>${customer.address ? `<div>${escapeHtml(customer.address)}</div>` : ''}<div style="margin-top:4px">Place of Supply:<br><strong>${escapeHtml(invoice.placeOfSupply || '09-UTTAR PRADESH')}</strong></div>${quotationLine}</section>
    <table><thead><tr><th style="width:4%">#</th><th style="width:27%">Item</th><th style="width:14%;text-align:right">Rate / Item</th><th style="width:7%;text-align:center">Qty</th><th style="width:16%;text-align:right">Taxable Value</th><th style="width:16%;text-align:right">Tax Amount</th><th style="width:16%;text-align:right">Amount</th></tr></thead><tbody>${itemRows}</tbody></table>
    <div class="totals"><div class="total-row"><span>Taxable Amount</span><span>₹${money(invoice.taxableAmount)}</span></div>${taxRows.map(([label, amount]) => `<div class="total-row"><span>${label}</span><span>₹${money(amount)}</span></div>`).join('')}<div class="total-row grand"><span>Total</span><span>₹${money(invoice.grandTotal)}</span></div></div>
    <div class="bottom-line"><div>Total Items / Qty : ${sourceItems.length} / ${money(totalQty).replace(/\.00$/, '')}</div><div class="words">${amountWords ? `Total amount (in words): ${amountWords}` : ''}</div></div>
    <div class="payable"><span>Amount Payable:</span><span>₹${money(invoice.grandTotal)}</span></div>
    <div class="signature-block"><div class="for">For ${COMPANY.name}</div>${signature ? `<img class="signature" src="${signature}" alt="Authorized signature">` : '<div style="height:52px"></div>'}<div class="sign-label">Authorized Signatory</div></div>
    <div class="footer"><span>${COMPANY.name} | Tax Invoice</span><span>Page 1 / 1 • Digitally generated document</span></div>
  </body></html>`;
};


const generateInvoicePdf = async (invoice) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  try {
    const page = await browser.newPage();

    // A4 invoice rendering
    await page.setViewport({
      width: 794,
      height: 1123,
      deviceScaleFactor: 1
    });

    // Avoid networkidle0 timeout
    const html = buildInvoiceHtml(invoice);

    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for embedded logo and signature images
    await page.evaluate(async () => {
      const images = Array.from(document.images);

      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();

          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;

            setTimeout(resolve, 5000);
          });
        })
      );
    });

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: {
        top: '10mm',
        right: '13mm',
        bottom: '12mm',
        left: '13mm'
      }
    });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('PDF generation returned an empty buffer');
    }

    return pdfBuffer;

  } finally {
    await browser.close();
  }
};

module.exports = { generateInvoicePdf };



