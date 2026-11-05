const Invoice = require("../models/Invoice");
const Quotation = require("../models/Quotation");
const Customer = require("../models/Customer");
const ApiResponse = require("../utils/apiResponse");
const catchAsync = require("../utils/catchAsync");
const { generateInvoicePdf } = require("../services/invoicePdfService");

const round2 = (value) =>
  Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const generateInvoiceNo = async () => {
  const lastInvoice = await Invoice.findOne({ invoiceNo: /^INV-\d+$/ }).sort({
    createdAt: -1,
  });
  const lastNumber = lastInvoice
    ? Number(lastInvoice.invoiceNo.split("-")[1])
    : 0;
  return `INV-${lastNumber + 1}`;
};

const normalizeItemsAndTotals = (items = []) => {
  if (!Array.isArray(items) || !items.length)
    throw new Error("At least one invoice item is required");

  const totals = {
    taxableAmount: 0,
    totalTax: 0,
    cgst_2_5: 0,
    sgst_2_5: 0,
    cgst_6: 0,
    sgst_6: 0,
    cgst_9: 0,
    sgst_9: 0,
    cgst_14: 0,
    sgst_14: 0,
  };

  const normalized = items.map((item, index) => {
    const description = String(item.description || "").trim();
    const rate = Number(item.rate);
    const qty = Number(item.qty);
    const gstRate = Number(item.gstRate) || 0;

    if (
      !description ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      !Number.isFinite(qty) ||
      qty <= 0
    ) {
      throw new Error(
        `Invalid description, rate or quantity in item ${index + 1}`,
      );
    }

    if (![0, 5, 12, 18, 28].includes(gstRate))
      throw new Error(`Unsupported GST rate in item ${index + 1}`);

    const taxableValue = round2(rate * qty);
    const taxAmount = round2((taxableValue * gstRate) / 100);
    totals.taxableAmount += taxableValue;
    totals.totalTax += taxAmount;

    const halfTax = round2(taxAmount / 2);
    if (gstRate === 5) {
      totals.cgst_2_5 += halfTax;
      totals.sgst_2_5 += halfTax;
    }
    if (gstRate === 12) {
      totals.cgst_6 += halfTax;
      totals.sgst_6 += halfTax;
    }
    if (gstRate === 18) {
      totals.cgst_9 += halfTax;
      totals.sgst_9 += halfTax;
    }
    if (gstRate === 28) {
      totals.cgst_14 += halfTax;
      totals.sgst_14 += halfTax;
    }

    return {
      description,
      rate,
      qty,
      gstRate,
      taxableValue,
      taxAmount,
      amount: round2(taxableValue + taxAmount),
    };
  });

  Object.keys(totals).forEach((key) => {
    totals[key] = round2(totals[key]);
  });
  totals.grandTotal = round2(totals.taxableAmount + totals.totalTax);

  return { items: normalized, totals };
};

// HR ownership is derived from Customer.ownerHR. No duplicate owner field
// is required on Invoice.
const isInvoiceOwnedByHR = async (invoice, hrId) => {
  if (!invoice?.customer) return false;
  const customerId = invoice.customer?._id || invoice.customer;
  const customer = await Customer.findById(customerId).select("ownerHR");
  return Boolean(customer?.ownerHR && customer.ownerHR.toString() === hrId.toString());
};

const createInvoice = catchAsync(async (req, res) => {
  const {
    customerId,
    quotationId,
    invoiceDate,
    dueDate,
    placeOfSupply,
    items,
    amountInWords,
  } = req.body;

  if (!customerId)
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Customer is required"));

  if (!invoiceDate || !dueDate)
    return res
      .status(400)
      .json(
        new ApiResponse(400, null, "Invoice date and due date are required"),
      );

  const customer = await Customer.findById(customerId);
  if (!customer)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Customer not found"));

  let quotation = null;
  if (quotationId) {
    quotation = await Quotation.findById(quotationId);
    if (!quotation)
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Quotation not found"));

    const quotationCustomerId = quotation.customer?._id
      ? quotation.customer._id.toString()
      : quotation.customer.toString();

    if (quotationCustomerId !== customerId.toString())
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Quotation does not belong to the selected customer",
          ),
        );
  }

  let calculated;
  try {
    calculated = normalizeItemsAndTotals(items);
  } catch (error) {
    return res.status(400).json(new ApiResponse(400, null, error.message));
  }

  const invoice = await Invoice.create({
    invoiceNo: await generateInvoiceNo(),
    customer: customerId,
    quotation: quotationId || undefined,
    invoiceDate,
    dueDate,
    placeOfSupply,
    items: calculated.items,
    ...calculated.totals,
    amountInWords,
    paidAmount: 0,
    status: "Draft",
    createdBy: req.user?._id,
  });

  res
    .status(201)
    .json(new ApiResponse(201, invoice, "Invoice created successfully"));
});

const getInvoices = catchAsync(async (req, res) => {
  let filter = {};

  if (req.user.role === "HR") {
    const customers = await Customer.find({ ownerHR: req.user._id }).select("_id");
    const customerIds = customers.map((customer) => customer._id);
    filter = { customer: { $in: customerIds } };
  }

  const invoices = await Invoice.find(filter)
    .populate("customer", "name mobile phone ownerHR")
    .populate("quotation", "estimateNo")
    .sort({ createdAt: -1 });

  res
    .status(200)
    .json(new ApiResponse(200, invoices, "Invoices fetched successfully"));
});

const getInvoiceById = catchAsync(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customer")
    .populate("quotation", "estimateNo grandTotal");

  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (
    req.user.role === "HR" &&
    !(await isInvoiceOwnedByHR(invoice, req.user._id))
  ) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You can access only your team's invoices"));
  }

  res
    .status(200)
    .json(new ApiResponse(200, invoice, "Invoice fetched successfully"));
});

const updateInvoice = catchAsync(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (invoice.status !== "Draft")
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          "Cannot edit an issued invoice. Cancel and create a new one.",
        ),
      );

  const allowed = ["invoiceDate", "dueDate", "placeOfSupply", "amountInWords"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) invoice[field] = req.body[field];
  });

  if (req.body.items) {
    try {
      const calculated = normalizeItemsAndTotals(req.body.items);
      invoice.items = calculated.items;
      Object.assign(invoice, calculated.totals);
    } catch (error) {
      return res.status(400).json(new ApiResponse(400, null, error.message));
    }
  }

  await invoice.save();
  res
    .status(200)
    .json(new ApiResponse(200, invoice, "Invoice updated successfully"));
});

const updateInvoiceStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const allowedStatuses =
    req.user.role === "Admin" ? ["Sent", "Cancelled"] : ["Sent"];

  if (!allowedStatuses.includes(status)) {
    return res
      .status(400)
      .json(
        new ApiResponse(
          400,
          null,
          req.user.role === "HR"
            ? "HR can only change an invoice status to Sent."
            : "Invalid status. Admin can set Sent or Cancelled.",
        ),
      );
  }

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (
    req.user.role === "HR" &&
    !(await isInvoiceOwnedByHR(invoice, req.user._id))
  ) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You can update only your team's invoices"));
  }

  if (invoice.status === "Cancelled") {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "A cancelled invoice cannot be changed"));
  }

  if (invoice.status === status) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, `Invoice is already marked as ${status}`));
  }

  invoice.status = status;
  await invoice.save();

  res
    .status(200)
    .json(new ApiResponse(200, invoice, `Invoice marked as ${status}`));
});

// Kept for backward compatibility with the existing controller. It is not
// exposed to HR and no payment UI is added as part of this status-only change.
const recordPayment = catchAsync(async (req, res) => {
  const amount = Number(req.body.amount);
  const { mode, note } = req.body;

  if (!Number.isFinite(amount) || amount <= 0)
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Enter a valid payment amount"));

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (invoice.status === "Cancelled")
    return res
      .status(400)
      .json(
        new ApiResponse(400, null, "Cannot record payment for a cancelled invoice"),
      );

  const newPaidAmount = round2(invoice.paidAmount + amount);
  if (newPaidAmount > invoice.grandTotal)
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Payment amount exceeds the invoice total"));

  invoice.paidAmount = newPaidAmount;
  invoice.paymentHistory.push({ amount, mode, note, date: Date.now() });
  if (invoice.paidAmount >= invoice.grandTotal) invoice.status = "Paid";
  else if (invoice.paidAmount > 0) invoice.status = "Partially Paid";
  await invoice.save();

  res
    .status(200)
    .json(new ApiResponse(200, invoice, "Payment recorded successfully"));
});

const downloadInvoicePDF = catchAsync(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customer")
    .populate("quotation", "estimateNo");

  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (
    req.user.role === "HR" &&
    !(await isInvoiceOwnedByHR(invoice, req.user._id))
  ) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You can access only your team's invoices"));
  }

  const generatedPdf = await generateInvoicePdf(invoice.toObject());
  const pdfBuffer = Buffer.isBuffer(generatedPdf)
    ? generatedPdf
    : Buffer.from(generatedPdf);

  if (
    pdfBuffer.length < 5 ||
    pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error(
      "PDF generation did not return a valid PDF binary. Check invoicePdfService.",
    );
  }

  const safeInvoiceNo = String(invoice.invoiceNo || "invoice").replace(
    /[^a-zA-Z0-9-_]/g,
    "_",
  );

  res.status(200);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeInvoiceNo}.pdf"`,
    "Content-Length": String(pdfBuffer.length),
    "Cache-Control": "private, no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  return res.end(pdfBuffer);
});


const downloadInvoiceMaterialListPDF = catchAsync(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate("customer")
    .populate("quotation", "estimateNo");

  if (!invoice)
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Invoice not found"));

  if (
    req.user.role === "HR" &&
    !(await isInvoiceOwnedByHR(invoice, req.user._id))
  ) {
    return res
      .status(403)
      .json(new ApiResponse(403, null, "You can access only your team's invoices"));
  }

  const generatedPdf = await generateInvoicePdf(invoice.toObject(), { fullMaterialList: true });
  const pdfBuffer = Buffer.isBuffer(generatedPdf)
    ? generatedPdf
    : Buffer.from(generatedPdf);

  if (
    pdfBuffer.length < 5 ||
    pdfBuffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new Error(
      "PDF generation did not return a valid PDF binary. Check invoicePdfService.",
    );
  }

  const safeInvoiceNo = String(invoice.invoiceNo || "invoice").replace(
    /[^a-zA-Z0-9-_]/g,
    "_",
  );

  res.status(200);
  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${safeInvoiceNo}.pdf"`,
    "Content-Length": String(pdfBuffer.length),
    "Cache-Control": "private, no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    "X-Content-Type-Options": "nosniff",
  });

  return res.end(pdfBuffer);
});

module.exports = {
  createInvoice,
  getInvoices,
  getInvoiceById,
  downloadInvoicePDF,
  downloadInvoiceMaterialListPDF,
  updateInvoice,
  updateInvoiceStatus,
  recordPayment,
};
