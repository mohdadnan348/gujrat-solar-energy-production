const Quotation = require('../models/Quotation');
const Customer = require('../models/Customer');
const ApiResponse = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');
const { getPanelImagePath } = require('../services/panelImageService');
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
    customerId, leadName, plantCapacity, customerCategory, systemType, batteryIncluded, branch, date, expiryDate, 
    mainItem, materialTotalAmount, materialGstRate, gstType, gstMode, perKwAmount, testimonials, subTotal, gstAmount, grandTotal, subsidyAmount, 
    bom, bomOptions, selectedBomOption, termsAndConditions, panelCount, createdByName, panelBrand, panelWattage, panelTechnology, subsidyDescription, notes, inverterBrand, inverterCapacity, inverterQuantity, batteryBrand, batteryType, batteryCapacity, batteryVoltage, batteryQuantity
  } = req.body;

  const customer = await Customer.findById(customerId);
  if (!customer) {
    return res.status(404).json(new ApiResponse(404, null, 'Customer not found'));
  }

  const estimateNo = await generateEstimateNo();
  const capacityKw = Number.parseFloat(String(plantCapacity || '').replace(/[^0-9.]/g, '')) || 0;
  if (capacityKw <= 0) return res.status(400).json(new ApiResponse(400, null, 'Plant capacity must be greater than 0 KW'));
  if (materialTotalAmount === undefined || materialTotalAmount === null || materialTotalAmount === '' || Number(materialTotalAmount) <= 0) return res.status(400).json(new ApiResponse(400, null, 'Quotation amount must be entered manually'));
  const resolvedPerKwAmount = Math.max(0, Number(perKwAmount) || 0);
  const resolvedMaterialAmount = Number(materialTotalAmount);
  const resolvedGstRate = Math.max(0, Number(materialGstRate) || 0);
  const resolvedGstType = ['CGST_SGST', 'IGST', 'NONE'].includes(gstType) ? gstType : 'CGST_SGST';
  const resolvedGstMode = gstMode === 'INCLUDED' ? 'INCLUDED' : 'EXTRA';
  const enteredAmount = Number.isFinite(resolvedMaterialAmount) ? Math.max(0, resolvedMaterialAmount) : 0;
  const resolvedGstAmount = resolvedGstType === 'NONE' ? 0 : Number((resolvedGstMode === 'INCLUDED' ? enteredAmount - enteredAmount / (1 + resolvedGstRate / 100) : enteredAmount * resolvedGstRate / 100).toFixed(2));
  const resolvedSubTotal = resolvedGstMode === 'INCLUDED' ? Number((enteredAmount - resolvedGstAmount).toFixed(2)) : enteredAmount;
  const resolvedCgstAmount = resolvedGstType === 'CGST_SGST' ? Number((resolvedGstAmount / 2).toFixed(2)) : 0;
  const resolvedSgstAmount = resolvedGstType === 'CGST_SGST' ? Number((resolvedGstAmount / 2).toFixed(2)) : 0;
  const resolvedIgstAmount = resolvedGstType === 'IGST' ? resolvedGstAmount : 0;
  const resolvedGrandTotal = Number((resolvedGstMode === 'INCLUDED' ? enteredAmount : resolvedSubTotal + resolvedGstAmount).toFixed(2));
  const calculatedAmountInWords = amountInWords(resolvedGrandTotal); 

  // Use the pre-downloaded image for the exact panel count. Never generate an image.
  const roofImageUrl = getPanelImagePath(panelCount);
  if (!roofImageUrl) {
    console.warn(`No pre-downloaded roof image available for ${panelCount} panels.`);
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
    customerCategory: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL'].includes(customerCategory) ? customerCategory : 'RESIDENTIAL',
    systemType: ['ON_GRID', 'OFF_GRID', 'HYBRID'].includes(systemType) ? systemType : 'ON_GRID',
    batteryIncluded: systemType === 'ON_GRID' ? Boolean(batteryIncluded) : true,
    inverterBrand: inverterBrand || mainItem?.inverterDetails || '',
    inverterCapacity: inverterCapacity || '',
    inverterQuantity: Number(inverterQuantity) || 0,
    batteryBrand: systemType === 'ON_GRID' ? '' : (batteryBrand || ''),
    batteryType: systemType === 'ON_GRID' ? '' : (batteryType || ''),
    batteryCapacity: systemType === 'ON_GRID' ? '' : (batteryCapacity || ''),
    batteryVoltage: systemType === 'ON_GRID' ? '' : (batteryVoltage || ''),
    batteryQuantity: systemType === 'ON_GRID' ? 0 : (Number(batteryQuantity) || 0),
    branch: branch || 'HEAD_OFFICE',
    date: date || Date.now(),
    expiryDate,
    createdBy: req.user._id,
    createdByName: String(createdByName || req.user.name || '').trim(),
    panelBrand: panelBrand || mainItem?.panelDetails || '',
    panelWattage: Number(panelWattage) || 0,
    panelTechnology: panelTechnology || (Number(panelWattage) > 600 ? 'Bifacial + TOPCon' : Number(panelWattage) > 0 && Number(panelWattage) < 600 ? 'Bifacial' : ''),
    subsidyDescription: subsidyDescription || 'Subsidy will be credited to your bank account directly.',
    notes: notes || '',
    ownerHR: req.user.role === 'HR' ? req.user._id : null,
    mainItem,
    materialTotalAmount: enteredAmount,
    perKwAmount: resolvedPerKwAmount,
    materialGstRate: resolvedGstRate,
    gstType: resolvedGstType,
    gstMode: resolvedGstMode,
    testimonials: Array.isArray(testimonials) ? testimonials : [],
    cgstAmount: resolvedCgstAmount,
    sgstAmount: resolvedSgstAmount,
    igstAmount: resolvedIgstAmount,
    subTotal: resolvedSubTotal,
    gstAmount: resolvedGstAmount,
    grandTotal: resolvedGrandTotal,
    subsidyAmount: customerCategory === 'RESIDENTIAL' && systemType !== 'OFF_GRID' ? subsidyAmount : '',
    amountInWords: calculatedAmountInWords,
    panelCount,
    roofImageUrl,
    bom: formattedBom,
    bomOptions: Array.isArray(bomOptions) ? bomOptions : [],
    selectedBomOption: selectedBomOption || '',
    termsAndConditions,
    status: 'Draft'
  });

  res.status(201).json(new ApiResponse(201, quotation, 'Quotation created successfully'));
});

// @desc    Get all quotations
// @route   GET /api/quotations
// @access  Private
const getQuotations = catchAsync(async (req, res) => {
  const filter = req.user.role === 'Employee'
    ? { createdBy: req.user._id }
    : req.user.role === 'HR'
      ? { $or: [{ ownerHR: req.user._id }, { createdBy: req.user._id }] }
      : {};

  const quotations = await Quotation.find(filter)
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
  if (req.user.role === 'Employee' && String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, 'You can only access quotations created by you'));
  }
  if (req.user.role === 'HR' &&
      String(quotation.ownerHR || '') !== String(req.user._id) &&
      String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, 'You can only access your HR quotations'));
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
  if (req.user.role === 'Employee' && String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, 'You can only edit quotations created by you'));
  }
  if (req.user.role === 'HR' &&
      String(quotation.ownerHR || '') !== String(req.user._id) &&
      String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
    return res.status(403).json(new ApiResponse(403, null, 'You can only edit your HR quotations'));
  }

  if (quotation.status !== 'Draft') {
    return res.status(400).json(new ApiResponse(400, null, `Cannot edit a quotation with status: ${quotation.status}`));
  }

  if (req.body.plantCapacity !== undefined) { const kw = Number.parseFloat(String(req.body.plantCapacity).replace(/[^0-9.]/g, '')) || 0; if (kw <= 0) return res.status(400).json(new ApiResponse(400, null, 'Plant capacity must be greater than 0 KW')); }
  if (req.body.materialTotalAmount !== undefined && Number(req.body.materialTotalAmount) <= 0) return res.status(400).json(new ApiResponse(400, null, 'Quotation amount must be entered manually'));
  if (req.body.customerCategory !== undefined) quotation.customerCategory = req.body.customerCategory;
  if (req.body.systemType !== undefined) quotation.systemType = req.body.systemType;
  if (req.body.systemType !== undefined) {
    quotation.batteryIncluded = req.body.systemType !== 'ON_GRID';
    if (req.body.systemType === 'ON_GRID') {
      ['batteryBrand', 'batteryType', 'batteryCapacity', 'batteryVoltage'].forEach(key => { req.body[key] = ''; });
      req.body.batteryQuantity = 0;
    }
  }
  if ((req.body.customerCategory ?? quotation.customerCategory) !== 'RESIDENTIAL' || (req.body.systemType ?? quotation.systemType) === 'OFF_GRID') req.body.subsidyAmount = '';

  const amountChanged = req.body.materialTotalAmount !== undefined || req.body.materialGstRate !== undefined || req.body.gstType !== undefined || req.body.gstMode !== undefined;
  if (amountChanged) {
    const amount = Math.max(0, Number(req.body.materialTotalAmount ?? quotation.materialTotalAmount ?? quotation.subTotal ?? 0));
    const gstRate = Math.max(0, Number(req.body.materialGstRate ?? quotation.materialGstRate ?? 0));
    const gstType = req.body.gstType ?? quotation.gstType ?? 'CGST_SGST';
    const gstMode = req.body.gstMode ?? quotation.gstMode ?? 'EXTRA';
    const gst = gstType === 'NONE' ? 0 : Number((gstMode === 'INCLUDED' ? amount - amount / (1 + gstRate / 100) : amount * gstRate / 100).toFixed(2));
    req.body.materialTotalAmount = amount;
    req.body.materialGstRate = gstRate;
    req.body.gstType = gstType;
    req.body.gstMode = gstMode;
    req.body.subTotal = gstMode === 'INCLUDED' ? Number((amount - gst).toFixed(2)) : amount;
    req.body.gstAmount = gst;
    req.body.cgstAmount = gstType === 'CGST_SGST' ? Number((gst / 2).toFixed(2)) : 0;
    req.body.sgstAmount = gstType === 'CGST_SGST' ? Number((gst / 2).toFixed(2)) : 0;
    req.body.igstAmount = gstType === 'IGST' ? gst : 0;
    req.body.grandTotal = Number((gstMode === 'INCLUDED' ? amount : amount + gst).toFixed(2));
  }

  if (req.body.panelWattage !== undefined && req.body.panelTechnology === undefined) {
    const watts = Number(req.body.panelWattage) || 0;
    req.body.panelTechnology = watts > 600 ? 'Bifacial + TOPCon' : watts > 0 && watts < 600 ? 'Bifacial' : '';
  }

  if (req.body.panelCount !== undefined) {
    // Refresh the selected static artwork when the panel count changes.
    req.body.roofImageUrl = getPanelImagePath(req.body.panelCount);
    if (!req.body.roofImageUrl) {
      console.warn(`No pre-downloaded roof image available for ${req.body.panelCount} panels.`);
    }
  }

  if (req.body.grandTotal) {
    req.body.amountInWords = amountInWords(req.body.grandTotal);
  }

  const normalizeBom = items => (Array.isArray(items) ? items : []).map(item => ({
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
  if (req.body.bom) req.body.bom = normalizeBom(req.body.bom);
  if (req.body.bomOptions) req.body.bomOptions = req.body.bomOptions.map(option => ({ optionId: option.optionId || option.name, name: option.name || 'BOM Option', items: normalizeBom(option.items) }));

  const allowedUpdates = [
    'leadName', 'createdByName', 'panelBrand', 'panelWattage', 'panelTechnology', 'inverterBrand', 'inverterCapacity', 'inverterQuantity', 'batteryBrand', 'batteryType', 'batteryCapacity', 'batteryVoltage', 'batteryQuantity', 'subsidyDescription', 'notes', 'bomOptions', 'selectedBomOption', 'plantCapacity', 'customerCategory', 'systemType', 'batteryIncluded', 'branch', 'expiryDate', 'mainItem', 
    'materialTotalAmount', 'perKwAmount', 'materialGstRate', 'gstType', 'gstMode', 'testimonials', 'cgstAmount', 'sgstAmount', 'igstAmount', 'subTotal', 'gstAmount', 'grandTotal', 'subsidyAmount', 
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
    if (req.user.role === 'Employee' && String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
      return res.status(403).json(new ApiResponse(403, null, 'You can only download quotations created by you'));
    }
    if (req.user.role === 'HR' &&
        String(quotation.ownerHR || '') !== String(req.user._id) &&
        String(quotation.createdBy?._id || quotation.createdBy) !== String(req.user._id)) {
      return res.status(403).json(new ApiResponse(403, null, 'You can only download your HR quotations'));
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