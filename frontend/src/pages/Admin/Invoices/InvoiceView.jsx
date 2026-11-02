import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import invoiceService from '../../../services/invoiceService';
import './InvoiceView.css';

const currency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const fmtDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN') : '—';

const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;

    invoiceService
      .getById(id)
      .then((data) => {
        if (active) setInvoice(data);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message || 'Unable to load invoice.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const handleDownloadPdf = async () => {
    if (downloading) return;

    setError('');
    setDownloading(true);

    try {
      const binaryData = await invoiceService.downloadPdf(id);

      // Axios arraybuffer response should be binary. Reject JSON/error payloads
      // instead of saving a JSON object with a .pdf extension.
      const pdfBlob =
        binaryData instanceof Blob
          ? binaryData
          : new Blob([binaryData], { type: 'application/pdf' });

      if (pdfBlob.size < 5 || pdfBlob.type === 'application/json') {
        throw new Error('Server did not return a valid PDF file.');
      }

      const header = new Uint8Array(await pdfBlob.slice(0, 5).arrayBuffer());
      const signature = String.fromCharCode(...header);

      if (signature !== '%PDF-') {
        const message = await pdfBlob.slice(0, 500).text();
        throw new Error(
          message.includes('{')
            ? 'Server returned JSON instead of PDF. Please check the backend PDF download controller.'
            : 'Downloaded file is not a valid PDF.'
        );
      }

      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const safeInvoiceNo = String(invoice?.invoiceNo || 'invoice').replace(
        /[^a-z0-9_-]/gi,
        '-'
      );

      link.href = url;
      link.download = `${safeInvoiceNo}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Revoke after the browser has started the download.
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Invoice PDF download failed:', err);
      setError(err.message || 'Unable to download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (error && !invoice) {
    return (
      <div className="invoice-view-page">
        <p className="text-danger">{error}</p>
        <button
          className="back-btn"
          type="button"
          onClick={() => navigate('/admin/invoices')}
        >
          <FiArrowLeft /> Back
        </button>
      </div>
    );
  }

  if (!invoice) return <Loader text="Loading invoice..." />;

  const customer = invoice.customer || {};
  const balance =
    (Number(invoice.grandTotal) || 0) - (Number(invoice.paidAmount) || 0);

  return (
    <div className="invoice-view-page">
      <div className="page-top-bar">
        <button
          className="back-btn"
          type="button"
          onClick={() => navigate('/admin/invoices')}
        >
          <FiArrowLeft /> Back to Invoices
        </button>

        <div className="actions">
          <Button
            variant="primary"
            icon={<FiDownload />}
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {error && <p className="text-danger" role="alert">{error}</p>}

      <div className="invoice-paper">
        <div className="invoice-header">
          <div>
            <h1>INVOICE</h1>
            <p><strong>Invoice #:</strong> {invoice.invoiceNo}</p>
            <p><strong>Date:</strong> {fmtDate(invoice.invoiceDate)}</p>
            <p><strong>Due Date:</strong> {fmtDate(invoice.dueDate)}</p>
            {invoice.quotation?.estimateNo && (
              <p><strong>Quotation:</strong> {invoice.quotation.estimateNo}</p>
            )}
          </div>
          <div className="status-stamp">
            <span>{invoice.status?.toUpperCase()}</span>
          </div>
        </div>

        <div className="invoice-bill-to">
          <h4>BILL TO:</h4>
          <p>{customer.name || '—'}</p>
          <p>{customer.mobile || customer.phone || ''}</p>
          <p>{customer.address || ''}</p>
          <p>Place of Supply: {invoice.placeOfSupply || '—'}</p>
        </div>

        <table className="invoice-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Rate</th>
              <th>Qty</th>
              <th>GST</th>
              <th>Taxable Value</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, index) => (
              <tr key={item._id || index}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{currency(item.rate)}</td>
                <td>{item.qty}</td>
                <td>{Number(item.gstRate) || 0}%</td>
                <td>{currency(item.taxableValue)}</td>
                <td className="text-right">{currency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-totals">
          <div className="totals-row">
            <span>Taxable Amount:</span>
            <span>{currency(invoice.taxableAmount)}</span>
          </div>

          {[
            ['CGST 2.5%', invoice.cgst_2_5],
            ['SGST 2.5%', invoice.sgst_2_5],
            ['CGST 6%', invoice.cgst_6],
            ['SGST 6%', invoice.sgst_6],
            ['CGST 9%', invoice.cgst_9],
            ['SGST 9%', invoice.sgst_9],
            ['CGST 14%', invoice.cgst_14],
            ['SGST 14%', invoice.sgst_14],
          ]
            .filter(([, value]) => Number(value) > 0)
            .map(([label, value]) => (
              <div className="totals-row" key={label}>
                <span>{label}:</span>
                <span>{currency(value)}</span>
              </div>
            ))}

          <div className="totals-row grand-total">
            <span>Total:</span>
            <span>{currency(invoice.grandTotal)}</span>
          </div>
          <div className="totals-row paid-amount">
            <span>Amount Paid:</span>
            <span>{currency(invoice.paidAmount)}</span>
          </div>
          <div className="totals-row balance-amount">
            <span>Balance Due:</span>
            <span>{currency(balance)}</span>
          </div>
        </div>

        {invoice.amountInWords && (
          <p style={{ marginTop: 24, fontWeight: 600 }}>
            {invoice.amountInWords}
          </p>
        )}
      </div>
    </div>
  );
};

export default InvoiceView;
