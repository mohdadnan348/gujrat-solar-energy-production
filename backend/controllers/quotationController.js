const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { generateRoofImage } = require('../services/imageService');
const { generateQuotationPDF } = require('../services/pdfService');
const amountInWords = require('../services/numberToWords');

// Auto-generate Estimate Number (Safe Version)
const generateEstimateNo = async () => {
  try {
    const lastQuotation = await Quotation.findOne().sort({ createdAt: -1 });
    
    if (!lastQuotation || !lastQuotation.estimateNo) {
      return 'EST-00001';
    }
    
    const parts = lastQuotation.estimateNo.split('-');
    if (parts.length < 2) {
      return 'EST-00001';
    }
    
    const lastNumber = parseInt(parts[1]);
    if (isNaN(lastNumber)) {
      return 'EST-00001';
    }
    
    const newNumber = lastNumber + 1;
    return `EST-${newNumber.toString().padStart(5, '0')}`;
  } catch (error) {
    console.error("Error in generateEstimateNo:", error);
    return `EST-${Date.now().toString().slice(-5)}`;
  }
};

// @desc    Create new quotation
// @route   POST /api/quotations
// @access  Private (Admin only)
const createQuotation = catchAsync(async (req, res) => {
  const { 
    customerId, leadName, plantCapacity, date, expiryDate, 
    mainItem, subTotal, gstAmount, grandTotal, subsidyAmount, 
    bom, termsAndConditions, panelCount 
  } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  }

  const estimateNo = await generateEstimateNo();
  const calculatedAmountInWords = amountInWords(grandTotal); 

  let roofImageUrl = '';
  if (panelCount && panelCount > 0) {
    console.log("🎨 Generating roof image for", panelCount, "panels...");
    roofImageUrl = await generateRoofImage('roof-top-base.jpg', panelCount);
    console.log("✅ Roof image generated:", roofImageUrl);
  }

  const formattedBom = (bom || []).map(item => ({
    srNo: item.srNo,
    itemDescription: item.itemDescription,
    qty: Number(item.qty),
    unit: item.unit,
    brand: item.brand,
    rate: Number(item.rate) || 0,
    gstRate: Number(item.gstRate) || 0,
    gstAmount: Number(item.gstAmount) || 0,
    total: Number(item.total) || 0,
  }));

  const quotation = await Quotation.create({
    estimateNo,
    customer: customerId,
    leadName,
    plantCapacity,
    date: date || Date.now(),
    expiryDate,
    createdBy: req.user._id,
    mainItem,
    subTotal,
    gstAmount,
    grandTotal,
    subsidyAmount,
    amountInWords: calculatedAmountInWords,
    panelCount,
    roofImageUrl,
    bom: formattedBom,
    termsAndConditions,
    status: 'Draft'
  });

  res.status(201).json(new ApiResponse(201, quotation, 'Quotation created successfully'));
});

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = catchAsync(async (req, res) => {
  if (req.user.role === 'Employee') {
    return res.status(403).json(new ApiResponse(403, null, 'Not authorized to view quotations'));
  }

  const quotations = await Quotation.find()
    .populate('customer', 'name mobile')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });

  res.status(200).json(new ApiResponse(200, quotations, 'Quotations fetched successfully'));
});

// @desc    Get single quotation by ID
// @route   GET /api/quotations/:id
// @access  Private (Admin only)
const getQuotationById = catchAsync(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id)
    .populate('customer')
    .populate('createdBy', 'name');

  if (!quotation) {
    return res.status(404).json(new ApiResponse(404, null, 'Quotation not found'));
  }

  res.status(200).json(new ApiResponse(200, quotation, 'Quotation fetched successfully'));
});

// @desc    Update quotation (Only if Draft)
// @route   PUT /api/quotations/:id
// @access  Private (Admin only)
const updateQuotation = catchAsync(async (req, res) => {
  const quotation = await Quotation.findById(req.params.id);

  if (!quotation) {
    return res.status(404).json(new ApiResponse(404, null, 'Quotation not found'));
  }

  if (quotation.status !== 'Draft') {
    return res.status(400).json(new ApiResponse(400, null, `Cannot edit a quotation with status: ${quotation.status}`));
  }

  if (req.body.panelCount && req.body.panelCount !== quotation.panelCount) {
    req.body.roofImageUrl = await generateRoofImage('roof-top-base.jpg', req.body.panelCount);
  }

  if (req.body.grandTotal) {
    req.body.amountInWords = amountInWords(req.body.grandTotal);
  }

  if (req.body.bom) {
    req.body.bom = req.body.bom.map(item => ({
      srNo: item.srNo,
      itemDescription: item.itemDescription,
      qty: Number(item.qty),
      unit: item.unit,
      brand: item.brand,
      rate: Number(item.rate) || 0,
      gstRate: Number(item.gstRate) || 0,
      gstAmount: Number(item.gstAmount) || 0,
      total: Number(item.total) || 0,
    }));
  }

  const allowedUpdates = [
    'leadName', 'plantCapacity', 'expiryDate', 'mainItem', 
    'subTotal', 'gstAmount', 'grandTotal', 'subsidyAmount', 
    'panelCount', 'roofImageUrl', 'bom', 'termsAndConditions', 'amountInWords'
  ];
  
  allowedUpdates.forEach(field => {
    if (req.body[field] !== undefined) {
      quotation[field] = req.body[field];
    }
  });

  const updatedQuotation = await quotation.save();
  res.status(200).json(new ApiResponse(200, updatedQuotation, 'Quotation updated successfully'));
});

// @desc    Update quotation status
// @route   PUT /api/quotations/:id/status
// @access  Private (Admin only)
const updateQuotationStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['Sent', 'Accepted', 'Rejected', 'Expired'];

  if (!validStatuses.includes(status)) {
    return res.status(400).json(new ApiResponse(400, null, 'Invalid status'));
  }

  const quotation = await Quotation.findById(req.params.id);
  if (!quotation) {
    return res.status(404).json(new ApiResponse(404, null, 'Quotation not found'));
  }

  quotation.status = status;
  await quotation.save();

  res.status(200).json(new ApiResponse(200, quotation, `Quotation marked as ${status}`));
});

// @desc    Download Quotation PDF
// @route   GET /api/quotations/:id/pdf
// @access  Private (Admin only)

// @desc    Download Quotation PDF
// @route   GET /api/quotations/:id/pdf
// @access  Private (Admin only)

const downloadQuotationPDF = catchAsync(async (req, res) => {
  try {
    console.log("\n========== QUOTATION PDF DOWNLOAD ==========");
    console.log("Quotation ID:", req.params.id);

    const quotation = await Quotation.findById(req.params.id)
      .populate('customer')
      .populate('createdBy', 'name');

    if (!quotation) {
      return res.status(404).json(
        new ApiResponse(404, null, 'Quotation not found')
      );
    }

    if (!quotation.customer) {
      return res.status(400).json(
        new ApiResponse(400, null, 'Customer details not found')
      );
    }

    console.log("Estimate No:", quotation.estimateNo);
    console.log("Customer:", quotation.customer.name);
    console.log("BOM Items:", quotation.bom?.length || 0);
    console.log("Roof Image:", quotation.roofImageUrl || "Not available");

    console.log("Starting PDF generation...");


let pdfBuffer = await generateQuotationPDF(
  quotation,
  quotation.customer
);

if (
  !pdfBuffer ||
  !(Buffer.isBuffer(pdfBuffer) || pdfBuffer instanceof Uint8Array)
) {
  throw new Error("PDF service did not return valid PDF data");
}

// Convert Uint8Array into Node.js Buffer
pdfBuffer = Buffer.from(pdfBuffer);

console.log("✅ Valid PDF Buffer:", pdfBuffer.length, "bytes");


    if (pdfBuffer.length === 0) {
      throw new Error("Generated PDF is empty");
    }

    const pdfHeader = pdfBuffer.slice(0, 5).toString();

    console.log("PDF Header:", pdfHeader);
    console.log("PDF Size:", pdfBuffer.length, "bytes");

    if (pdfHeader !== '%PDF-') {
      throw new Error("Invalid PDF file generated");
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${quotation.estimateNo}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

    console.log("PDF successfully generated and sending to frontend.");

    return res.status(200).send(pdfBuffer);

  } catch (error) {
    console.error("\n========== PDF GENERATION ERROR ==========");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    console.error("==========================================\n");

    if (res.headersSent) {
      return;
    }

    return res.status(500).json(
      new ApiResponse(
        500,
        null,
        'PDF Generation Failed: ' + error.message
      )
    );
  }
});


module.exports = {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  updateQuotationStatus,
  downloadQuotationPDF
};