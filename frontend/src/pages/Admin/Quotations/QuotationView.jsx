import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import quotationService from '../../../services/quotationService';
import './QuotationView.css';

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchQuotation = async () => {
      try {
        const data = await quotationService.getById(id);
        setQuotation(data);
      } catch (err) {
        setError('Failed to load quotation details.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuotation();
  }, [id]);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await quotationService.downloadPDF(id);
      
      // Blob ko sahi tarike se handle karo
      const pdfBlob = response.data;
      
      // Debug: Blob type check karo
      console.log("Blob type:", pdfBlob.type);
      console.log("Blob size:", pdfBlob.size);
      
      // Blob type explicitly set karo
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${quotation.estimateNo}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error("Download Error:", err);
      alert('Failed to download PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) return <Loader fullScreen text="Loading quotation..." />;
  if (error) return <div className="error-message">{error}</div>;
  if (!quotation) return null;

  const calculateItemTotals = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const gstPercent = parseFloat(item.gstRate) || 0;
    const baseTotal = qty * rate;
    const gstAmount = baseTotal * (gstPercent / 100);
    return {
      baseTotal: baseTotal.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      total: (baseTotal + gstAmount).toFixed(2),
    };
  };

  // Derive summary from BOM so older quotations with saved gstAmount = 0
  // still display the correct GST and grand total.
  const quotationTotals = (quotation.bom || []).reduce(
    (totals, item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      const gstRate = Number(item.gstRate) || 0;
      const baseAmount = qty * rate;
      const itemGst = Number((baseAmount * gstRate / 100).toFixed(2));

      totals.subTotal += baseAmount;
      totals.gstAmount += itemGst;
      return totals;
    },
    { subTotal: 0, gstAmount: 0 }
  );

  const hasBom = Array.isArray(quotation.bom) && quotation.bom.length > 0;
  const displayedSubTotal = hasBom
    ? Number(quotationTotals.subTotal.toFixed(2))
    : Number(quotation.subTotal) || 0;
  const displayedGstAmount = hasBom
    ? Number(quotationTotals.gstAmount.toFixed(2))
    : Number(quotation.gstAmount) || 0;
  const displayedGrandTotal = hasBom
    ? Number((displayedSubTotal + displayedGstAmount).toFixed(2))
    : Number(quotation.grandTotal) || 0;

  return (
    <div className="quotation-view-page">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/admin/quotations')}>
          <FiArrowLeft /> Back to Quotations
        </button>
        <div className="actions">
          <Button variant="secondary" icon={<FiEdit />} onClick={() => navigate(`/admin/quotations/edit/${id}`)}>
            Edit
          </Button>
          <Button variant="primary" icon={<FiDownload />} onClick={handleDownloadPDF} isLoading={isDownloading}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="quotation-preview-card">
        <div className="preview-header">
          <div>
            <h1>{quotation.estimateNo}</h1>
            <p>Created on: {new Date(quotation.date).toLocaleDateString('en-GB')}</p>
          </div>
          <span className={`status-badge status-${quotation.status.toLowerCase()}`}>
            {quotation.status}
          </span>
        </div>

        <div className="preview-body">
          <div className="preview-section">
            <h3>Customer Details</h3>
            <p><strong>{quotation.customer?.name}</strong></p>
            <p>{quotation.customer?.mobile}</p>
            <p>{quotation.customer?.city}, {quotation.customer?.state}</p>
          </div>

          <div className="preview-section">
            <h3>System Configuration</h3>
            <p><strong>Plant Capacity:</strong> {quotation.plantCapacity || 'N/A'}</p>
            <p><strong>Panel Count:</strong> {quotation.panelCount} panels</p>
            {quotation.leadName && <p><strong>Lead:</strong> {quotation.leadName}</p>}
          </div>
        </div>

        <div className="bom-preview-section">
          <h3>Bill of Material (BOM)</h3>
          <div className="bom-table-wrapper">
            <table className="bom-preview-table">
              <thead>
                <tr>
                  <th>Sr No.</th>
                  <th>Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th>GST %</th>
                  <th>GST Amt</th>
                  <th>Total</th>
                  <th>Brand</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.bom || []).map((item, index) => {
                  const totals = calculateItemTotals(item);
                  return (
                    <tr key={index}>
                      <td>{item.srNo}</td>
                      <td>{item.itemDescription}</td>
                      <td>{item.qty}</td>
                      <td>{item.unit}</td>
                      <td>₹{parseFloat(item.rate).toLocaleString('en-IN')}</td>
                      <td>{item.gstRate}%</td>
                      <td>₹{parseFloat(totals.gstAmount).toLocaleString('en-IN')}</td>
                      <td className="font-bold">₹{parseFloat(totals.total).toLocaleString('en-IN')}</td>
                      <td>{item.brand}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="preview-summary">
          <div className="summary-row">
            <span>Sub Total:</span>
            <span>₹{displayedSubTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row">
            <span>Total GST:</span>
            <span>₹{displayedGstAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="summary-row grand-total">
            <span>Grand Total:</span>
            <span>₹{displayedGrandTotal.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuotationView;