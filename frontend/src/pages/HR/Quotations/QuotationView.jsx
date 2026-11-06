import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiEdit, FiRefreshCw } from 'react-icons/fi';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import quotationService from '../../../services/quotationService';
import './QuotationView.css';

const QuotationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');

  useEffect(() => {
    let active = true;
    let objectUrl = '';

    const load = async () => {
      try {
        const data = await quotationService.getById(id);
        if (active) setQuotation(data);

        // Show the actual complete multi-page quotation PDF in this page.
        const response = await quotationService.downloadPDF(id);
        const blob = new Blob([response.data], { type: 'application/pdf' });
        objectUrl = window.URL.createObjectURL(blob);
        if (active) setPdfUrl(objectUrl);
      } catch (err) {
        console.error('Quotation preview error:', err);
        if (active) setError(err.response?.data?.message || 'Quotation preview could not be loaded.');
      } finally {
        if (active) {
          setIsLoading(false);
          setIsPdfLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!quotation) return;
    setIsDownloading(true);
    try {
      const response = await quotationService.downloadPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${quotation.estimateNo || 'Quotation'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      alert('PDF download failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const refreshPreview = async () => {
    setIsPdfLoading(true);
    try {
      const response = await quotationService.downloadPDF(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const nextUrl = window.URL.createObjectURL(blob);
      setPdfUrl((oldUrl) => {
        if (oldUrl) window.URL.revokeObjectURL(oldUrl);
        return nextUrl;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not refresh PDF preview.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  if (isLoading) return <Loader fullScreen text="Loading complete quotation..." />;
  if (error && !quotation) return <div className="error-message">{error}</div>;
  if (!quotation) return null;

  const canEdit = quotation.status === 'Draft';

  return (
    <div className="quotation-view-page quotation-full-preview-page">
      <div className="page-top-bar">
        <button className="back-btn" onClick={() => navigate('/hr/quotations')}>
          <FiArrowLeft /> Back to Quotations
        </button>
        <div className="actions">
          <Button variant="secondary" icon={<FiRefreshCw />} onClick={refreshPreview} isLoading={isPdfLoading}>
            Refresh Preview
          </Button>
          {canEdit && (
            <Button variant="secondary" icon={<FiEdit />} onClick={() => navigate(`/hr/quotations/edit/${id}`)}>
              Edit Quotation
            </Button>
          )}
          <Button variant="primary" icon={<FiDownload />} onClick={handleDownloadPDF} isLoading={isDownloading}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="full-preview-heading">
        <div>
          <h1>{quotation.estimateNo}</h1>
          <p>Complete quotation preview · All PDF pages</p>
        </div>
        <span className={`status-badge status-${String(quotation.status || '').toLowerCase()}`}>
          {quotation.status}
        </span>
      </div>

      {canEdit ? (
        <div className="edit-hint">
          <strong>Need to change anything?</strong> Select <b>Edit Quotation</b> to edit plant capacity, pricing, BOM quantities, brands, expiry date and Terms &amp; Conditions. Save your changes, then return here and refresh the PDF preview.
        </div>
      ) : (
        <div className="edit-hint read-only-hint">
          This quotation is {quotation.status} and is currently read-only. Only Draft quotations can be edited.
        </div>
      )}

      <section className="quotation-pdf-viewer" aria-label="Complete quotation PDF preview">
        {isPdfLoading && <div className="pdf-loading">Preparing complete PDF preview...</div>}
        {pdfUrl ? (
          <iframe
            key={pdfUrl}
            title={`Complete quotation ${quotation.estimateNo}`}
            src={pdfUrl}
            className="quotation-pdf-iframe"
          />
        ) : !isPdfLoading ? (
          <div className="pdf-loading">PDF preview is not available. Use Download PDF to open the document.</div>
        ) : null}
      </section>
    </div>
  );
};

export default QuotationView;
