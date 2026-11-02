const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const amountInWords = require("./numberToWords");
const Settings = require("../models/Settings");

// Helper: Image ko resize + compress karke Base64 me convert karo
const getBase64Image = async (filePath) => {
  try {
    if (!filePath) return "";
    if (filePath.startsWith("http")) return filePath;

    const absolutePath = path.join(__dirname, "../public", filePath);
    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ Image not found: ${absolutePath}`);
      return "";
    }

    // Preserve clear detail in quotation photos while keeping PDF size reasonable.
    const buffer = await sharp(absolutePath)
      .resize(1600, null, { withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("❌ Image Base64 Error:", error.message);
    return "";
  }
};

// Helper: Browser launch with retry

const launchBrowser = async () => {
  console.log("🚀 Launching Puppeteer browser...");

  const browser = await puppeteer.launch({
    headless: true,

    // Windows par default Chromium process configuration use karo.
    // --single-process aur --no-zygote intentionally removed hain.
    args: ["--disable-dev-shm-usage", "--disable-gpu"],

    timeout: 60000,
    protocolTimeout: 120000,
    dumpio: true,
  });

  console.log("✅ Puppeteer browser launched successfully");

  return browser;
};
const generateQuotationPDF = async (quotationData, customerData) => {
  let browser = null;

  try {
    console.log("📄 PDF Gen started for:", quotationData.estimateNo);

    let settings = await Settings.findOne();
    if (!settings) settings = {};

    // Existing project image assets
    console.log("🖼️ Loading quotation images...");
    const coverImage = await getBase64Image("/images/cover-worker.jpg");
    const productRoofImage = await getBase64Image("/images/roof-product-composite.jpg");
    const logoImage = await getBase64Image("/images/logo.png");
    const roofImage = quotationData.roofImageUrl
      ? await getBase64Image(quotationData.roofImageUrl)
      : "";
    const installationImage = await getBase64Image(
      "/images/installation-team.jpg",
    );
    const testimonial1 = await getBase64Image("/images/testimonial-1.jpg");
    const testimonial2 = await getBase64Image("/images/testimonial-2.jpg");
    const testimonial3 = await getBase64Image("/images/testimonial-3.jpg");
    const thankYouImage = await getBase64Image("/images/thank-you.jpg");

    const companyName = settings.companyName || "Gujrat Solar Energy";
    const companyAddress = settings.address || "";
    const companyMobile = settings.mobile || "";
    const companyEmail = settings.email || "";
    const gstin = settings.gstin || "";
    const ownerName = settings.ownerName || "Siddiqui Wasim";
    const bank = settings.bankDetails || {};
    // Client-approved Terms & Conditions copied from reference quotation EST-00215.
    // Keep this wording consistent across quotations unless Admin updates the approved terms.
    const terms = {
      generalTerms: [
        "Material dispatch and Installation shall be started upon DISCOM approval only.",
        "For better performance, solar panels should be cleaned by customer two times in a week.",
        "Concealed wiring shall be done by company, if possible only. Otherwise, customer should do concealed wiring with their wiremen where material shall be provided by Company.",
        "After successful installation, Customer shall take care of solar plant by doing timely cleaning. If we found less generation at the time of attending complaint due to non-cleaning, we may charge you additional service charge.",
        "There is manufacturing warranty for all electronics equipment. Company will help to claim this warranty if require.",
      ],
      governmentSubsidy: [
        "Subsidy Credit: If applicable, any subsidy will be directly credited to the customer's account. Our company will handle all necessary documentation with the government.",
        "Delay Disclaimer: Please note that subsidy amounts may experience delays from the government's side. Our company is not liable to compensate for any delays or non-receipt of subsidies if not provided by the government.",
      ],
      panelWarranty: [
        "90% of rated capacity for the first 15 years.",
        "80% of rated capacity for the next 15 years.",
        "Total Panel Life: 30 years.",
        "Refer Solar Panel Datasheet for detailed warranty terms.",
      ],
      inverterWarranty: [
        "12 years, extendable.",
        "Refer Inverter Datasheet for detailed warranty terms.",
      ],
      batteryWarranty: [
        "8 years, Extendable.",
        "Refer Battery Datasheet for detailed warranty terms.",
      ],
      bosWarranty: [
        "Equipment/products supplied by us which are warranted against defects due to poor material, design, or workmanship.",
        "This warranty is valid for 12 months from the date of commissioning or when put into service, whichever is earlier.",
      ],
      maintenanceWarranty: [
        "We offer 5 years of O&M support, including fault finding, remote monitoring, site visits, and assistance with warranty claims for components.",
        "O&M does not include solar panel cleaning and washing.",
      ],
      warrantyNotes: [
        "All warranties provided by the manufacturer/supplier are in favor of the buyer and cover the equipment for the specified period.",
        "Warranties ensure safe working of individual components and vary in validity period.",
        "Warranties do not cover damages caused by external hazardous conditions.",
      ],
      siteCompletion: [
        "Dispatch within 6 weeks after order confirmation with payment.",
        "The entire power plant will be installed and commissioned within 60-70 days (approx.) after project accreditation, contract agreement, and possession of the site.",
      ],
      paymentTerms: [
        "50% advance payment upon contract signing.",
        "40% upon delivery of structure material.",
        "10% before meter installation is complete.",
      ],
      quotationValidity: "1 week from the date of issue.",
      warrantyExclusions: [
        "Damage or defect caused by transportation, accident, misuse, lack of maintenance, improper usage, or negligence by the owner.",
        "Wilful damage, normal wear and tear, abuse, or misuse of equipment/product.",
        "Damage or defect caused by Force Majeure events, including fire, earthquake, flood, or other natural disasters.",
        "Damage or defect caused by unauthorized alterations, modifications, or conversions.",
        "Repairs carried out by personnel not authorized by the contractor.",
        "Defects or damages due to external causes.",
        "Parts and components repaired or replaced during the warranty period are warranted only for the original warranty period. The contractor will take back replaced or defective material.",
      ],
      scopeOfWork: [
        "Providing access/approach to rooftop.",
        "If any electrical modification is required from DISCOM (i.e. ELCB, changeover switch etc.) Customer shall provide necessary support.",
        "Provide necessary documents for project approvals from State/Central Government.",
        "Site clearance, ladders, water, and electricity supply for smooth installation and commissioning of the project.",
        "Customer shall provide Safe Place for Material unloading and storage during the work execution.",
        "Net meter / Smart meter charge in your scope.",
      ],
    };

    const renderTermLines = (items) =>
      items.map((item) => `<p>${escapeHtml(item)}</p>`).join("");

    // Keep the existing quotation totals as the source of truth.
    // This change only aligns the displayed information with the reference quotation.
    const subTotal = Number(quotationData.subTotal || 0);
    const gstAmount = Number(quotationData.gstAmount || 0);
    const grandTotal = Number(quotationData.grandTotal || 0);
    const bom = Array.isArray(quotationData.bom) ? quotationData.bom : [];

    // Consolidated quotation line on Page 4.
    const mainItem = quotationData.mainItem || {};
    const mainItemDescription = mainItem.description || "Residential Solar Rooftop On-grid Plant";

    // If the Pricing Details brand fields are blank, use the matching BOM brand.
    const panelBomItem = bom.find((item) =>
      /(solar\s*panel|pv\s*module|photovoltaic)/i.test(String(item.itemDescription || ""))
    );
    const inverterBomItem = bom.find((item) =>
      /inverter/i.test(String(item.itemDescription || ""))
    );
    const mainItemPanelDetails = mainItem.panelDetails || panelBomItem?.brand || "";
    const mainItemInverterDetails = mainItem.inverterDetails || inverterBomItem?.brand || "";

    const enteredQty = String(mainItem.qty || "").trim();
    const mainItemQty = !enteredQty || /^custom$/i.test(enteredQty)
      ? String(quotationData.plantCapacity || "Custom")
      : enteredQty;
    const mainItemQtyNumber = Number.parseFloat(mainItemQty);
    const mainItemDiscount = Math.max(0, Number(mainItem.discount || 0));

    // Page 4 row must reconcile with the saved quotation summary:
    // Qty x Rate - Discount = Sub Total; Amount with Tax = Grand Total.
    // Prefer the entered rate only when it agrees with the saved subtotal.
    const derivedRate = Number.isFinite(mainItemQtyNumber) && mainItemQtyNumber > 0
      ? (subTotal + mainItemDiscount) / mainItemQtyNumber
      : subTotal + mainItemDiscount;
    const enteredRate = Number(mainItem.rate || 0);
    const enteredLineTotal = Number.isFinite(mainItemQtyNumber) && mainItemQtyNumber > 0
      ? (mainItemQtyNumber * enteredRate) - mainItemDiscount
      : enteredRate - mainItemDiscount;
    const enteredRateMatchesSummary = enteredRate > 0 &&
      Math.abs(enteredLineTotal - subTotal) < 0.01;
    const mainItemRate = enteredRateMatchesSummary ? enteredRate : derivedRate;
    const mainItemTotal = subTotal;
    const mainItemAmountWithTax = grandTotal;

    const panelQty = Number(quotationData.panelCount || panelBomItem?.qty || 0);
    const subsidyText = quotationData.subsidyAmount || "";
    const mainItemDescriptionHtml = [
      `<strong>${escapeHtml(mainItemDescription)}</strong>`,
      mainItemPanelDetails
        ? `<div class="main-item-detail">1. Solar Panels Brand: ${escapeHtml(mainItemPanelDetails)}${panelQty > 0 ? ` (${panelQty} Qty)` : ""}</div>`
        : "",
      mainItemInverterDetails
        ? `<div class="main-item-detail">2. Solar Inverter Brand: ${escapeHtml(mainItemInverterDetails)}</div>`
        : "",
      `<div class="main-item-next-page">Please find detailed BOM &amp; Scope on next page.</div>`,
      subsidyText
        ? `<div class="main-item-subsidy">${escapeHtml(subsidyText)}</div>`
        : "",
    ].filter(Boolean).join("");
    const panelCount = (() => {
      const explicitCount = Number(quotationData.panelCount || quotationData.numberOfPanels || 0);
      if (Number.isFinite(explicitCount) && explicitCount > 0) return Math.floor(explicitCount);
      return bom.reduce((total, item) => {
        const description = String(item.itemDescription || item.description || "").toLowerCase();
        const isSolarPanel = /(solar\\s*panel|pv\\s*module|photovoltaic|\\bpanel\\b)/i.test(description);
        const qty = Number(item.qty || 0);
        return total + (isSolarPanel && Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0);
      }, 0);
    })();

    // Perspective-aware solar module preview for the three supplied roof photographs.
    // Each photo has its own roof-plane corners, calibrated to avoid parapets and rooftop equipment.
    const roofPanelImageTag = (src, view, alt) => {
      if (!src) return imageTag("", "", alt);

      const roofAreas = {
        // Front-facing view: broad central roof plane, below the skyline and behind the front parapet.
        front: [[105, 205], [865, 205], [970, 315], [35, 315]],
        // Side perspective: keep the array on the visible roof surface, clear of the tank and stair block.
        side: [[185, 215], [985, 245], [985, 420], [305, 345]],
        // Aerial view: central roof field, clear of tank/utility block and perimeter parapets.
        aerial: [[285, 90], [875, 90], [875, 445], [285, 445]],
      };

      const corners = roofAreas[view];
      const count = Math.max(0, Math.min(500, Math.floor(panelCount)));
      const point = (u, v) => {
        const [tl, tr, br, bl] = corners;
        return [
          (1-u)*(1-v)*tl[0] + u*(1-v)*tr[0] + u*v*br[0] + (1-u)*v*bl[0],
          (1-u)*(1-v)*tl[1] + u*(1-v)*tr[1] + u*v*br[1] + (1-u)*v*bl[1],
        ];
      };

      let tiles = "";
      if (count > 0) {
        // Use a compact, near-square array. Every module is drawn separately,
        // and the final row is shortened so the displayed module count is exact.
        const cols = Math.max(1, Math.ceil(Math.sqrt(count * 1.45)));
        const rows = Math.ceil(count / cols);
        const gapU = 0.009;
        const gapV = 0.012;

        for (let i = 0; i < count; i++) {
          const row = Math.floor(i / cols);
          const col = i % cols;
          const u0 = col / cols + gapU / 2;
          const u1 = (col + 1) / cols - gapU / 2;
          const v0 = row / rows + gapV / 2;
          const v1 = (row + 1) / rows - gapV / 2;

          const cornersPx = [
            point(u0, v0), point(u1, v0),
            point(u1, v1), point(u0, v1),
          ];
          const pts = cornersPx.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
          const clipId = `moduleClip-${view}-${i}`;

          tiles += `<defs><clipPath id="${clipId}"><polygon points="${pts}"/></clipPath></defs>`;
          // Dark photovoltaic glass, slim silver frame and restrained reflection.
          tiles += `<polygon points="${pts}" fill="#123653" fill-opacity="0.91"
            stroke="#d5e0e8" stroke-width="1.8" stroke-linejoin="round"/>`;

          // Fine cell matrix (6 columns x 10 rows), clipped to each module.
          // This avoids the oversized cross-lines that made the previous panels look like tiles.
          tiles += `<g clip-path="url(#${clipId})" opacity="0.48">`;
          for (let c = 1; c < 6; c++) {
            const u = u0 + (u1-u0) * c / 6;
            const a = point(u, v0), b = point(u, v1);
            tiles += `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}"
              x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}"
              stroke="#a9c5d8" stroke-width="0.65"/>`;
          }
          for (let r = 1; r < 10; r++) {
            const v = v0 + (v1-v0) * r / 10;
            const a = point(u0, v), b = point(u1, v);
            tiles += `<line x1="${a[0].toFixed(2)}" y1="${a[1].toFixed(2)}"
              x2="${b[0].toFixed(2)}" y2="${b[1].toFixed(2)}"
              stroke="#a9c5d8" stroke-width="0.55"/>`;
          }
          tiles += `</g>`;
          // A subtle highlight on the upper edge gives the glass a realistic finish.
          tiles += `<polyline points="${cornersPx[0][0].toFixed(2)},${cornersPx[0][1].toFixed(2)} ${cornersPx[1][0].toFixed(2)},${cornersPx[1][1].toFixed(2)}"
            fill="none" stroke="#f0f7fb" stroke-opacity="0.45" stroke-width="0.9"/>`;
        }
      }

      return `<div class="roof-photo">
        <img src="${src}" alt="${escapeHtml(alt)}">
        <svg class="roof-panel-overlay" viewBox="0 0 1000 563" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <filter id="panelShadow-${view}" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" flood-color="#10283b" flood-opacity="0.22"/>
            </filter>
          </defs>
          <g filter="url(#panelShadow-${view})">${tiles}</g>
        </svg>
      </div>`;
    };

    const formatMoney = (value) =>
      `₹ ${Number(value || 0).toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

    const formatDate = (value) => {
      if (!value) return "-";
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
    };

    function escapeHtml(value) {
      return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    }

    const formatContactAddress = (value) =>
      escapeHtml(value).replace(/,\\s*/g, ",<br>").replace(/\\r?\\n/g, "<br>");

    const imageTag = (src, className = "", alt = "") =>
      src
        ? `<img class="${className}" src="${src}" alt="${escapeHtml(alt)}">`
        : `<div class="image-placeholder">Image not available</div>`;

    const bomRows = bom
      .map((item, index) => {
        const qty = Number(item.qty || 0);
        const rate = Number(item.rate || 0);
        const gstRate = Number(item.gstRate || 0);
        const taxable = qty * rate;
        const tax = (taxable * gstRate) / 100;
        const total = taxable + tax;

        return `
        <tr>
          <td>${escapeHtml(item.srNo || index + 1)}</td>
          <td>
            <strong>${escapeHtml(item.itemDescription || "-")}</strong>
            ${item.brand ? `<div class="muted small">Brand: ${escapeHtml(item.brand)}</div>` : ""}
          </td>
          <td class="center">${escapeHtml(qty)}</td>
          <td class="center">${escapeHtml(item.unit || "-")}</td>
          <td class="right">${formatMoney(rate)}</td>
          <td class="center">${escapeHtml(gstRate)}%</td>
          <td class="right">${formatMoney(total)}</td>
        </tr>
      `;
      })
      .join("");

    // Page 5 BOM follows the reference information structure only:
    // Sr No., Item, Qty, Unit and Brand. Keep the existing table styling.
    const detailedBomRows = bom
      .map((item, index) => {
        const qty = Number(item.qty || 0);

        return `
        <tr>
          <td>${escapeHtml(item.srNo || index + 1)}</td>
          <td>${escapeHtml(item.itemDescription || "-")}</td>
          <td class="center">${escapeHtml(qty)}</td>
          <td class="center">${escapeHtml(item.unit || "-")}</td>
          <td>${escapeHtml(item.brand || "-")}</td>
        </tr>
      `;
      })
      .join("");

    const vision =
      settings.vision ||
      "Empowering a Sustainable Future with Clean Solar Energy";
    const mission =
      settings.mission ||
      "Our mission is to lead the transition to a sustainable and renewable energy future through the widespread adoption of solar power. We are committed to delivering innovative, reliable, and affordable solar solutions that provide economic and environmental benefits to our customers and communities.";

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #222; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { background: #fff; }
  .page { width: 210mm; height: 297mm; position: relative; overflow: hidden; padding: 15mm 14mm 19mm; page-break-after: always; background: #fff; }
  .page:last-child { page-break-after: auto; }
  .red { color: #df2029; }
  .navy { color: #222a58; }
  .muted { color: #666; }
  .small { font-size: 9px; }
  .center { text-align: center; }
  .right { text-align: right; }
  h1, h2, h3, p { margin-top: 0; }
  .brand-logo { max-width: 95px; max-height: 70px; object-fit: contain; }
  .page-head { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #222a58; padding-bottom: 8px; margin-bottom: 18px; min-height: 62px; }
  .page-head .company-meta { text-align: right; font-size: 9px; line-height: 1.5; color: #555; max-width: 65%; }
  .page-title { text-align: center; color: #df2029; font-size: 25px; margin: 8px 0 20px; font-weight: 700; }
  .footer { position: absolute; left: 0; right: 0; bottom: 0; height: 11mm; background: #df2029; color: white; display: flex; align-items: center; justify-content: space-between; padding: 0 12mm; font-size: 10px; }
   .footer .social-icons { display: flex; align-items: center; gap: 2.2mm; }
  .footer .social-icon {
    width: 7mm; height: 7mm; border-radius: 50%;
    display: inline-flex; align-items: center; justify-content: center;
    color: #fff; font-family: Arial, Helvetica, sans-serif;
    font-size: 10px; font-weight: 700; line-height: 1;
    letter-spacing: 0; border: 0.25mm solid rgba(255,255,255,.75);
    box-shadow: 0 .4mm 1mm rgba(0,0,0,.16);
  }
  .footer .facebook { background: #1877F2; }
  .footer .instagram { background: radial-gradient(circle at 30% 105%, #feda75 0%, #fa7e1e 28%, #d62976 58%, #962fbf 78%, #4f5bd5 100%); font-size: 15px; }
  .footer .linkedin { background: #0A66C2; font-size: 8px; }
  .footer .phone { background: #269b45; font-size: 13px; }
  .footer .email { background: #EA4335; font-size: 13px; }
  .footer .whatsapp { background: #25D366; font-size: 12px; }
  .cover { padding: 0; display: flex; background: #fff; }
  .cover-left { width: 50%; height: 100%; position: relative; background: #f3f3f3; }
  .cover-left img { width: 100%; height: 100%; object-fit: cover; }
  .cover-left .cover-logo { position: absolute; top: 0; left: 0; width: 100%; height: 32mm; background: white; display: flex; align-items: center; justify-content: center; }
  .cover-left .cover-logo img { width: auto; height: 27mm; max-width: 75%; object-fit: contain; }
  .cover-right { width: 50%; height: 100%; display: flex; flex-direction: column; }
  .cover-title { height: 30%; background: #222a58; color: white; padding: 20mm 12mm 10mm; text-align: right; font-size: 29px; line-height: 1.15; font-weight: bold; }
  .cover-customer { height: 23%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 8mm; text-align: center; background: #fff; }
  .cover-customer h1 { font-size: 25px; margin: 0 0 8px; color: #111; text-transform: uppercase; }
  .cover-customer p { font-size: 13px; margin: 0; }
  .cover-company { flex: 1; background: #222a58; color: #fff; padding: 12mm 10mm; display: flex; flex-direction: column; justify-content: flex-end; text-align: right; font-size: 10px; line-height: 1.55; }
  .cover-company h2 { font-size: 17px; margin-bottom: 14px; }
  .cover-company p { margin: 4px 0; }
  .cover-company .cover-rule { border-top: 2px solid #fff; width: 45%; margin: 10px 0 14px auto; }
  .about-hero { height: 105mm; position: relative; margin: 0 0 18mm; }
  .about-hero img { width: 100%; height: 100%; object-fit: cover; }
  .about-ribbon { position: absolute; right: 0; bottom: 0; background: #222a58; color: white; padding: 8px 18px; font-size: 17px; font-weight: bold; }
  .content-heading { font-size: 20px; margin: 0 0 14px; color: #111; }
  .vision-mission { font-size: 14px; line-height: 1.65; }
  .vision-mission h3 { font-size: 15px; margin: 14px 0 4px; }
  .product-composite {
    position: relative;
    width: 100%;
    height: 224mm;
    margin: 2mm auto 0;
    overflow: hidden;
    border-radius: 3mm;
    background: #fff;
  }
  .product-composite > img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  /* Keep the square three-angle product artwork aligned with its overlay positions. */
  .product-composite {
    height: 182mm;
    aspect-ratio: 1 / 1;
  }
  .product-composite > img {
    width: 100%;
    height: 100%;
    object-fit: fill;
  }
  .panel-count-badge {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 1.2mm;
    padding: 1.2mm 2mm;
    color: #fff;
    background: rgba(20, 43, 70, 0.96);
    border: 0.35mm solid rgba(255,255,255,0.95);
    border-left: 1mm solid #f4b400;
    border-radius: 1.5mm;
    box-shadow: 0 1mm 2.5mm rgba(0,0,0,0.24);
    font-size: 7.5px;
    font-weight: 700;
    letter-spacing: 0.15px;
    white-space: nowrap;
    z-index: 2;
  }
  .panel-count-badge strong {
    color: #ffc21a;
    font-size: 12px;
    line-height: 1;
  }
  /* One badge per photo: all stay inside the photographed roof, not in the white gutter. */
  .panel-count-badge--main {
    top: 48.5%;
    right: 4%;
  }
  .panel-count-badge--left {
    left: 28%;
    bottom: 5.5%;
  }
  .panel-count-badge--right {
    right: 4%;
    bottom: 5.5%;
  }
  .image-placeholder { width: 100%; height: 100%; min-height: 35mm; background: #f2f2f2; color: #888; display: flex; align-items: center; justify-content: center; font-size: 11px; border: 1px solid #ddd; }
  .quote-top { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 15px; font-size: 10px; line-height: 1.5; }
  .quote-top > div { padding: 0 9px; border-right: 1px solid #ddd; overflow-wrap: anywhere; }
  .quote-top > div:first-child { padding-left: 0; }
  .quote-top > div:last-child { border: 0; }
  .quote-label { color: #df2029; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  th { background: #df2029; color: #fff; padding: 8px 5px; text-align: left; }
  td { border: 1px solid #ddd; padding: 7px 5px; vertical-align: top; }
  .main-quotation-table { table-layout: fixed; font-size: 10px; }
  .main-quotation-table th { padding: 8px 5px; }
  .main-quotation-table td { padding: 7px 5px; vertical-align: top; }
  .main-quotation-row { min-height: 42mm; }
  .main-quotation-description { line-height: 1.45; overflow-wrap: anywhere; }
  .main-item-detail { margin-top: 2px; }
  .main-item-next-page { margin-top: 18px; }
  .main-item-subsidy { margin-top: 3px; }
  .quote-summary { margin-top: 0; display: grid; grid-template-columns: 1fr 29%; gap: 0; align-items: stretch; font-size: 10px; border: 1px solid #ddd; }
  .amount-words { padding: 12px 10px; font-style: italic; display: flex; align-items: center; }
  .totals { width: 100%; border-left: 1px solid #ddd; }
  .totals td { padding: 6px; }
  .quote-bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0; margin-top: 18px; font-size: 9px; line-height: 1.5; }
  .quote-bottom > div { padding: 0 9px; border-right: 1px solid #ddd; overflow-wrap: anywhere; }
  .quote-bottom > div:first-child { padding-left: 0; }
  .quote-bottom > div:last-child { border-right: 0; }
  .quote-bottom h3 { color: #df2029; font-size: 14px; margin-bottom: 8px; }
  .signature { text-align: center; padding-top: 30px; }
  .signature-line { border-top: 1px solid #333; margin: 35px auto 5px; width: 85%; padding-top: 5px; }
  .bom-table { font-size: 8px; }
  .bom-table th { background: #e7e7e7; color: #222; border: 1px solid #bbb; text-align: center; }
  .bom-table td { border: 1px solid #ccc; padding: 6px 4px; }
  /* Terms pages: larger, consistent typography with controlled A4 spacing. */
  .terms-reference {
    font-size: 11.5px;
    line-height: 1.38;
    padding: 13mm 14mm 19mm;
  }
  .terms-reference h2 {
    text-align: center;
    color: #222a58;
    font-size: 20px;
    line-height: 1.2;
    font-weight: 700;
    margin: 3mm 0 4mm;
  }
  .terms-reference h3 {
    color: #222;
    font-size: 12.5px;
    line-height: 1.2;
    font-weight: 700;
    margin: 2.5mm 0 1mm;
    break-after: avoid;
    page-break-after: avoid;
  }
  .terms-reference h4 {
    font-size: 11.5px;
    line-height: 1.2;
    font-weight: 700;
    margin: 2mm 0 1mm;
  }
  .terms-reference p {
    font-size: 11.5px;
    line-height: 1.38;
    margin: 0 0 1.2mm;
    white-space: pre-line;
    text-align: left;
  }
  .terms-reference .term-points {
    padding-left: 4mm;
    margin: 0 0 0.5mm;
  }
  .terms-reference .term-points p {
    font-size: 11.5px;
    line-height: 1.38;
    margin: 0 0 1mm;
    padding-left: 0;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .terms-reference .term-points p::before {
    content: "• ";
    display: inline-block;
    width: 3mm;
    margin-left: -3.5mm;
  }
  .terms-reference .term-continuation {
    margin: 0 0 1.5mm;
    padding-left: 4mm;
    font-size: 11.5px;
    line-height: 1.38;
  }
  .terms-reference .page-head {
    margin-bottom: 3mm;
    min-height: 14mm;
    padding-bottom: 2mm;
  }
  .terms-reference .footer {
    height: 11mm;
  }
  .testimonial { display: flex; align-items: center; gap: 18px; min-height: 66mm; border-bottom: 1px solid #ddd; padding: 11px 0; }
  .testimonial:nth-child(odd) { flex-direction: row-reverse; }
  .testimonial img { width: 54mm; height: 46mm; object-fit: cover; border-radius: 3mm; }
  .testimonial .review { flex: 1; font-size: 12.5px; line-height: 1.55; color: #333; }
  .stars { color: #e8b323; font-size: 17px; letter-spacing: 2px; margin-top: 4px; }
  .contact-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px; margin-top: 7mm; }
  .contact-grid > div { min-height: 38mm; text-align: center; padding: 8px; border-right: 1px solid #ddd; font-size: 11px; line-height: 1.55; overflow-wrap: anywhere; }
  .contact-grid > div:last-child { border: 0; }
  .contact-grid h3 { font-size: 14px; margin-bottom: 8px; color: #222a58; }
  .thankyou { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; height: 178mm; padding: 5mm 0 0; }
  .thankyou img { max-width: 88%; max-height: 122mm; object-fit: contain; margin-bottom: 8mm; }
  .thankyou h2 { color: #222a58; font-size: 30px; line-height: 1.2; margin: 0 0 3mm; }
  /* Unified quotation body typography: 14px across all nine pages.
     Titles/headings remain larger for readable visual hierarchy. */
  .page { font-size: 14px; }
  .page .small { font-size: 9px; }
  .page .page-head .company-meta { font-size: 14px; }
  .page .vision-mission { font-size: 14px; }
  .page .cover-company { font-size: 14px; }
  .page .cover-customer p { font-size: 14px; }
  .page .quote-top, .page .quote-summary, .page .quote-bottom { font-size: 14px; }
  .page table, .page th, .page td { font-size: 14px; }
  .page .bom-table, .page .bom-table th, .page .bom-table td { font-size: 14px; }
  .page .testimonial .review { font-size: 14px; }
  .page .contact-grid > div { font-size: 14px; }
  .page .footer { font-size: 14px; }
  .terms-reference { font-size: 14px; line-height: 1.48; }
  .terms-reference h3 { font-size: 13px; }
  .terms-reference h4 { font-size: 14px; }
  .terms-reference p,
  .terms-reference .term-points p,
  .terms-reference .term-continuation { font-size: 14px; line-height: 1.48; }
  .thankyou .thankyou-message { max-width: 145mm; color: #555; font-size: 14px; line-height: 1.55; margin: 0; }
  /* Last-page contact details: readable spacing and a dedicated address area. */
  .page:last-of-type .thankyou { height: 164mm; padding-top: 3mm; }
  .page:last-of-type .contact-grid {
    grid-template-columns: 1.45fr .75fr 1fr;
    gap: 3mm;
    margin-top: 5mm;
    align-items: stretch;
  }
  .page:last-of-type .contact-grid > div {
    min-width: 0;
    min-height: 43mm;
    padding: 4mm 3mm;
    font-size: 11.5px;
    line-height: 1.65;
    overflow-wrap: anywhere;
    white-space: normal;
    border: 1px solid #e2e5eb;
    border-radius: 2mm;
    background: #fbfcfe;
  }
  .page:last-of-type .contact-grid h3 {
    font-size: 12px;
    line-height: 1.25;
    margin: 0 0 2.5mm;
    color: #222a58;
  }
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<section class="page cover">
  <div class="cover-left">
    ${imageTag(coverImage, "", "Solar installation")}
    <div class="cover-logo">${imageTag(logoImage, "", "Gujrat Solar Energy logo")}</div>
  </div>
  <div class="cover-right">
    <div class="cover-title">Roof Top Solar<br>Proposal</div>
    <div class="cover-customer">
      <h1>${escapeHtml(customerData.name || "Customer")}</h1>
      <p>${escapeHtml(customerData.state || customerData.city || "India")}</p>
    </div>
    <div class="cover-company">
      <h2>${escapeHtml(companyName)}</h2>
      <p>${escapeHtml(companyAddress)}</p>
      <div class="cover-rule"></div>
      <p><strong>Lead:</strong> ${escapeHtml(quotationData.leadName || "-")}</p>
      <p><strong>ID:</strong> ${escapeHtml(quotationData.estimateNo || "-")}</p>
      <p><strong>Date:</strong> ${formatDate(quotationData.date)}</p>
      <p><strong>By:</strong> ${escapeHtml(ownerName)}</p>
      <p><strong>Plant Capacity:</strong> ${escapeHtml(quotationData.plantCapacity || "-")}</p>
    </div>
  </div>
</section>

<!-- PAGE 2: ABOUT COMPANY -->
<section class="page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">${escapeHtml(companyName)}<br>${escapeHtml(gstin)}</div>
  </div>
  <div class="about-hero">
    ${imageTag(installationImage || coverImage, "", "Solar installation team")}
    <div class="about-ribbon">Award Winning Company</div>
  </div>
  <h2 class="content-heading">About ${escapeHtml(companyName)}</h2>
  <div class="vision-mission">
    <h3>Vision</h3>
    <p>${escapeHtml(vision)}</p>
    <h3>Mission</h3>
    <p>${escapeHtml(mission)}</p>
  </div>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>2/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 3: PRODUCT PHOTOS -->
<section class="page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">${escapeHtml(companyName)}<br>${escapeHtml(gstin)}</div>
  </div>
  <div class="product-composite">
    ${imageTag(productRoofImage, "", "Three-angle rooftop solar installation preview")}
    <div class="panel-count-badge panel-count-badge--main">
      <strong>${panelCount}</strong>
      <span>${panelCount === 1 ? "SOLAR PANEL" : "SOLAR PANELS"}</span>
    </div>
    <div class="panel-count-badge panel-count-badge--left">
      <strong>${panelCount}</strong>
      <span>${panelCount === 1 ? "SOLAR PANEL" : "SOLAR PANELS"}</span>
    </div>
    <div class="panel-count-badge panel-count-badge--right">
      <strong>${panelCount}</strong>
      <span>${panelCount === 1 ? "SOLAR PANEL" : "SOLAR PANELS"}</span>
    </div>
  </div>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>3/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 4: QUOTATION -->
<section class="page quotation-page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">${escapeHtml(companyName)}<br>GSTIN: ${escapeHtml(gstin)}</div>
  </div>
  <h1 class="page-title">Quotation</h1>
  <div class="quote-top">
    <div>
      <div class="quote-label">From</div>
      <strong>${escapeHtml(companyName)}</strong><br>
      ${escapeHtml(companyAddress)}<br>
      GSTIN: ${escapeHtml(gstin)}
    </div>
    <div>
      <div class="quote-label">Bill To</div>
      <strong>${escapeHtml(customerData.name || "-")}</strong><br>
      ${escapeHtml(customerData.address || "")}<br>
      ${escapeHtml(customerData.state || "")}<br>
      Mobile: ${escapeHtml(customerData.mobile || "-")}
    </div>
    <div>
      <div><span class="quote-label">Date:</span> ${formatDate(quotationData.date)}</div>
      <div><span class="quote-label">Expiry Date:</span> ${formatDate(quotationData.expiryDate)}</div>
      <div><span class="quote-label">Estimate#:</span> ${escapeHtml(quotationData.estimateNo || "-")}</div>
      <div><span class="quote-label">Created by:</span> ${escapeHtml(ownerName)}</div>
      <div><span class="quote-label">Contact:</span> ${escapeHtml(companyMobile)}</div>
    </div>
  </div>

  <table class="main-quotation-table">
    <thead>
      <tr>
        <th style="width:5%">#</th>
        <th style="width:46%">Item &amp; Description</th>
        <th style="width:7%">Qty</th>
        <th style="width:12%">Rate</th>
        <th style="width:12%">Discount</th>
        <th style="width:9%">Total</th>
        <th style="width:13%">Amount with Tax</th>
      </tr>
    </thead>
    <tbody>
      <tr class="main-quotation-row">
        <td>1</td>
        <td class="main-quotation-description">${mainItemDescriptionHtml}</td>
        <td class="center">${escapeHtml(mainItemQty)}</td>
        <td class="right">${formatMoney(mainItemRate || subTotal)}</td>
        <td class="right">${formatMoney(mainItemDiscount)}</td>
        <td class="right">${formatMoney(mainItemTotal)}</td>
        <td class="right">${formatMoney(mainItemAmountWithTax)}</td>
      </tr>
    </tbody>
  </table>

  <div class="quote-summary">
    <div class="amount-words"><strong>${escapeHtml(amountInWords(grandTotal))}</strong></div>
    <table class="totals">
      <tr><td>Sub Total:</td><td class="right">${formatMoney(subTotal)}</td></tr>
      <tr><td>Tax (GST):</td><td class="right">${formatMoney(gstAmount)}</td></tr>
      <tr><td><strong>Total:</strong></td><td class="right"><strong>${formatMoney(grandTotal)}</strong></td></tr>
    </table>
  </div>

  <div class="quote-bottom">
    <div>
      <h3>Notes:</h3>
      <p>${escapeHtml(quotationData.notes || "Please refer detailed Terms & Conditions for payment and warranty.")}</p>
    </div>
    <div>
      <h3>Bank Detail:</h3>
      Bank Name: ${escapeHtml(bank.bankName || "")}<br>
      Account Name: ${escapeHtml(bank.accountName || "")}<br>
      Account No.: ${escapeHtml(bank.accountNo || "")}<br>
      IFSC: ${escapeHtml(bank.ifsc || "")}<br>
      Branch: ${escapeHtml(bank.branch || "")}
    </div>
    <div class="signature">
      For ${escapeHtml(companyName)}
      <div class="signature-line">Authorized Signature</div>
    </div>
  </div>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>4/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 5: DETAILED BILL OF MATERIAL -->
<section class="page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">${escapeHtml(companyName)}<br>GSTIN: ${escapeHtml(gstin)}</div>
  </div>
  <h1 class="page-title">Bill of Material</h1>
  <table class="bom-table">
    <thead>
      <tr>
        <th style="width:7%">Sr No.</th>
        <th style="width:48%">Item</th>
        <th style="width:10%">Qty</th>
        <th style="width:12%">Unit</th>
        <th style="width:23%">Brand</th>
      </tr>
    </thead>
    <tbody>
      ${detailedBomRows || `<tr><td colspan="5" class="center">No BOM items available</td></tr>`}
    </tbody>
  </table>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>5/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 6: WARRANTY TERMS - detailed wording from reference EST-00215 -->
<section class="page terms-reference">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">GSTIN: ${escapeHtml(gstin)}</div>
  </div>
  <h2>WARRANTY TERMS</h2>

  <h3>General Terms:</h3>
  <div class="term-points">${renderTermLines(terms.generalTerms)}</div>

  <h3>Goverment Subsidy:</h3>
  <div class="term-points">${renderTermLines(terms.governmentSubsidy)}</div>

  <h3>1. Solar Panel (PV Modules) Performance Warranty:</h3>
  <div class="term-points">${renderTermLines(terms.panelWarranty)}</div>

  <h3>2. Inverter Manufacturing Defect Warranty:</h3>
  <div class="term-points">${renderTermLines(terms.inverterWarranty)}</div>

  <h3>3. Battery Manufacturing Defect Warranty for Hybrid &amp; Off Grid Plant:</h3>
  <div class="term-points">${renderTermLines(terms.batteryWarranty)}</div>

  <h3>4. Balance of System (BOS):</h3>
  <div class="term-points">${renderTermLines(terms.bosWarranty)}</div>

  <h3>5. Operation &amp; Maintenance:</h3>
  <div class="term-points">
    <p>We offer 5 years of O&amp;M support, including fault finding, remote monitoring, site visits, and assistance with warranty claims for components.</p>
  </div>

  <div class="footer"><span>${escapeHtml(companyName)}</span><span>6/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 7: TERMS & CONDITIONS - detailed wording from reference EST-00215 -->
<section class="page terms-reference">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">GSTIN: ${escapeHtml(gstin)}</div>
  </div>
  <h2>TERMS &amp; CONDITIONS</h2>

  <p class="term-continuation">with warranty claims for components. O&amp;M does not include solar panel cleaning and washing.</p>

  <h3>Warranty Notes:</h3>
  <div class="term-points">${renderTermLines(terms.warrantyNotes)}</div>

  <h3>Schedule for Site Completion:</h3>
  <div class="term-points">${renderTermLines(terms.siteCompletion)}</div>

  <h3>Payment Terms:</h3>
  <div class="term-points">${renderTermLines(terms.paymentTerms)}</div>

  <h3>Quotation Validity:</h3>
  <p>${escapeHtml(terms.quotationValidity)}</p>

  <h3>Warranty Exclusions:</h3>
  <p>The warranty will not cover failures due to:</p>
  <div class="term-points">${renderTermLines(terms.warrantyExclusions)}</div>

  <h3>Scope of Work For Customer:</h3>
  <div class="term-points">${renderTermLines(terms.scopeOfWork)}</div>

  <div class="footer"><span>${escapeHtml(companyName)}</span><span>7/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 8: TESTIMONIALS -->
<section class="page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">GSTIN: ${escapeHtml(gstin)}</div>
  </div>
  <h1 class="page-title" style="color:#222">Testimonials</h1>
  <div class="testimonial">
    ${imageTag(testimonial1, "", "Customer testimonial")}
    <div class="review">
      “Extremely satisfied with our rooftop solar power plant! The team explained the complete process clearly, installation was smooth and professional, and the work was completed on time. We are happy with the quality of the system and the support provided by Gujarat Solar Energy.”
      <br><strong>- Rahulbhai Patel</strong><div class="stars">★★★★★</div>
    </div>
  </div>
  <div class="testimonial">
    ${imageTag(testimonial2, "", "Customer testimonial")}
    <div class="review">
      “Switching to solar has been one of the best decisions for our home. We really appreciate the product quality, neat workmanship, and the team's attention to detail. The entire experience was well organised, and all our questions were answered patiently.”
      <br><strong>- Payalben Hirpara</strong><div class="stars">★★★★★</div>
    </div>
  </div>
  <div class="testimonial">
    ${imageTag(testimonial3, "", "Customer testimonial")}
    <div class="review">
      “Why leave your rooftop unused when it can help you save on electricity? Thank you, Gujarat Solar Energy, for the end-to-end guidance and smooth installation. The team supported us at every step and made the process simple and convenient.”
      <br><strong>- Happy Customer</strong><div class="stars">★★★★★</div>
    </div>
  </div>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>8/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

<!-- PAGE 9: CONTACT -->
<section class="page">
  <div class="page-head">
    ${imageTag(logoImage, "brand-logo", "Company logo")}
    <div class="company-meta">${escapeHtml(companyName)}</div>
  </div>
  <div class="thankyou">
    ${imageTag(thankYouImage, "", "Thank you")}
    <h2>${escapeHtml(companyName)}</h2>
    <p class="thankyou-message">Thank you for trusting us with your solar journey. We truly appreciate your support and look forward to powering a brighter, cleaner future together.</p>
  </div>
  <div class="contact-grid">
    <div>
      <h3>${escapeHtml(companyName)}</h3>
      ${formatContactAddress(companyAddress)}
    </div>
    <div>
      <h3>MOBILE</h3>
      ${escapeHtml(companyMobile)}
    </div>
    <div>
      <h3>EMAIL</h3>
      ${escapeHtml(companyEmail)}
    </div>
  </div>
  <div class="footer"><span>${escapeHtml(companyName)}</span><span>9/9</span><span class="social-icons" aria-label="Social and contact links">
        <span class="social-icon facebook" title="Facebook">f</span>
        <span class="social-icon instagram" title="Instagram">◎</span>
        <span class="social-icon linkedin" title="LinkedIn">in</span>
        <span class="social-icon phone" title="Phone">☎</span>
        <span class="social-icon email" title="Email">✉</span>
        <span class="social-icon whatsapp" title="WhatsApp">◉</span>
      </span></div>
</section>

</body>
</html>`;

    console.log("🚀 Launching browser...");
    browser = await launchBrowser();

    console.log("📄 Setting HTML content...");
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // Wait for all embedded images to finish decoding before printing.
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }),
      );
    });

    console.log("📑 Generating 9-page quotation PDF...");
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: false,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      timeout: 120000,
      scale: 1,
    });

    console.log("✅ PDF generated! Size:", pdfBuffer.length, "bytes");

    await browser.close();
    browser = null;
    console.log("🔒 Browser closed");

    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error("❌ PDF Generation Error:", error.message);
    console.error("Stack:", error.stack);

    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Browser close error:", closeError.message);
      }
    }

    throw error;
  }
};

const generateInvoicePDF = async (invoiceData, customerData) => {
  let browser = null;
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = {};

    const logoBase64 = await getBase64Image("/images/logo.png");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 15mm; font-size: 14px; color: #333; -webkit-print-color-adjust: exact; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e2a5e; padding-bottom: 15px; margin-bottom: 20px; }
        .company-info { display: flex; gap: 15px; align-items: center; }
        .company-logo { height: 60px; object-fit: contain; }
        .company-name { font-size: 20px; font-weight: bold; color: #1e2a5e; text-transform: uppercase; }
        .invoice-title { text-align: right; }
        .invoice-title h1 { font-size: 32px; margin: 0; color: #1e2a5e; letter-spacing: 2px; }
        
        .details { margin: 20px 0; display: flex; justify-content: space-between; align-items: flex-start; }
        .customer-details { border: 1px solid #ddd; padding: 15px; width: 50%; border-radius: 5px; background: #fafafa; }
        
        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #1e2a5e; color: white; }
        .text-right { text-align: right; }
        
        .totals-wrapper { display: flex; justify-content: flex-end; margin-top: 20px; }
        .totals { width: 40%; }
        .totals td { border: none; padding: 5px 10px; }
        .totals .border-top { border-top: 1px solid #333; }
        .grand-total { font-weight: bold; font-size: 14px; color: #1e2a5e; }
        
        .footer { margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; }
        .signature { text-align: right; }
        .signature-line { border-top: 1px solid #333; width: 200px; margin-top: 50px; padding-top: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          ${logoBase64 ? `<img src="${logoBase64}" class="company-logo" />` : ""}
          <div>
            <div class="company-name">${settings.companyName || "GUJARAT SOLAR ENERGY"}</div>
            <p style="font-size: 10px; margin: 5px 0;">GSTIN: ${settings.gstin || ""}<br>${settings.address || ""}<br>Mobile: ${settings.mobile || ""}</p>
          </div>
        </div>
        <div class="invoice-title">
          <h1>INVOICE</h1>
          <p style="font-size: 11px;">Invoice #: <strong>${invoiceData.invoiceNo}</strong><br>Date: ${new Date(invoiceData.invoiceDate).toLocaleDateString("en-GB")}<br>Due Date: ${new Date(invoiceData.dueDate).toLocaleDateString("en-GB")}</p>
        </div>
      </div>

      <div class="details">
        <div class="customer-details">
          <strong style="color: #1e2a5e;">Customer Details:</strong><br><br>
          <strong>${customerData.name}</strong><br>
          Ph: ${customerData.mobile}<br>
          ${customerData.address || ""}<br>
          Place of Supply: ${invoiceData.placeOfSupply}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 40%;">Item</th>
            <th style="width: 10%;">Rate</th>
            <th style="width: 5%;">Qty</th>
            <th style="width: 13%;">Taxable Value</th>
            <th style="width: 13%;">Tax Amount</th>
            <th style="width: 14%;" class="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${invoiceData.items
            .map(
              (item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.description}</td>
              <td>₹${item.rate?.toLocaleString("en-IN")}</td>
              <td>${item.qty}</td>
              <td>₹${item.taxableValue?.toLocaleString("en-IN")}</td>
              <td>₹${item.taxAmount?.toLocaleString("en-IN")}</td>
              <td class="text-right">₹${item.amount?.toLocaleString("en-IN")}</td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>

      <div class="totals-wrapper">
        <table class="totals">
          <tr><td>Taxable Amount</td><td class="text-right">₹${invoiceData.taxableAmount?.toLocaleString("en-IN")}</td></tr>
          <tr><td>CGST 2.5%</td><td class="text-right">₹${invoiceData.cgst_2_5?.toLocaleString("en-IN")}</td></tr>
          <tr><td>SGST 2.5%</td><td class="text-right">₹${invoiceData.sgst_2_5?.toLocaleString("en-IN")}</td></tr>
          <tr><td>CGST 9.0%</td><td class="text-right">₹${invoiceData.cgst_9?.toLocaleString("en-IN")}</td></tr>
          <tr><td>SGST 9.0%</td><td class="text-right">₹${invoiceData.sgst_9?.toLocaleString("en-IN")}</td></tr>
          <tr class="border-top grand-total"><td>Total</td><td class="text-right">₹${invoiceData.grandTotal?.toLocaleString("en-IN")}</td></tr>
        </table>
      </div>

      <p style="margin-top: 20px; font-style: italic; font-size: 11px;"><strong>Amount in words:</strong> ${amountInWords(invoiceData.grandTotal)}</p>
      <p style="font-weight: bold; font-size: 14px;">Amount Payable: ₹${invoiceData.grandTotal?.toLocaleString("en-IN")}</p>

      <div class="footer">
        <div>
          <p style="font-size: 10px; color: #777;">This is a computer-generated invoice.</p>
        </div>
        <div class="signature">
          <p>For ${settings.companyName || "GUJARAT SOLAR ENERGY"}</p>
          <div class="signature-line">Authorized Signatory</div>
        </div>
      </div>
    </body>
    </html>
    `;

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
      },
      timeout: 120000,
      scale: 0.8,
    });
    await browser.close();
    return pdfBuffer;
  } catch (error) {
    console.error("Invoice PDF Error:", error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    throw error;
  }
};

module.exports = {
  generateQuotationPDF,
  generateInvoicePDF,
};
