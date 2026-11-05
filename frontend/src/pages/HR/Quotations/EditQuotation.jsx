
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiSave,
  FiArrowLeft,
  FiPlus,
  FiTrash2
} from 'react-icons/fi';

import Input from '../../../components/Common/Input';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import quotationService from '../../../services/quotationService';

import './EditQuotation.css';

const initialMainItem = {
  description: '',
  panelDetails: '',
  inverterDetails: '',
  qty: '',
  rate: 0,
  discount: 0,
  totalAmountWithTax: 0
};

const EditQuotation = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [customer, setCustomer] = useState(null);
  const [estimateNo, setEstimateNo] = useState('');
  const [status, setStatus] = useState('');

  const [formData, setFormData] = useState({
    leadName: '',
    plantCapacity: '',
    panelCount: 0,
    expiryDate: '',
    mainItem: { ...initialMainItem },
    materialTotalAmount: 0,
    materialGstRate: 5,
    subTotal: 0,
    gstAmount: 0,
    grandTotal: 0,
    subsidyAmount: '',
    termsAndConditions: { generalTerms: '', governmentSubsidy: '', warrantyDetails: '', panelWarranty: '', inverterWarranty: '', batteryWarranty: '', bosWarranty: '', maintenanceWarranty: '', warrantyNotes: '', siteCompletionSchedule: '', paymentTerms: '', warrantyExclusions: '', scopeOfWork: '' }
  });

  const [bomItems, setBomItems] = useState([]);

  // =====================================
  // 1. FETCH REAL QUOTATION API
  // =====================================

  useEffect(() => {
    let isMounted = true;

    const fetchQuotation = async () => {
      try {
        setIsLoading(true);
        setError('');

        const data = await quotationService.getById(id);

        if (!isMounted) return;

        if (!data) {
          throw new Error('Quotation data not found.');
        }

        setCustomer(data.customer || null);
        setEstimateNo(data.estimateNo || '');
        setStatus(data.status || '');

        setFormData({
          leadName: data.leadName || '',
          plantCapacity: data.plantCapacity || '',
          panelCount: data.panelCount || 0,

          expiryDate: data.expiryDate
            ? new Date(data.expiryDate).toISOString().slice(0, 10)
            : '',

          mainItem: {
            ...initialMainItem,
            ...(data.mainItem || {})
          },

          materialTotalAmount: Number(data.materialTotalAmount ?? data.subTotal) || 0,
          materialGstRate: Number(data.materialGstRate ?? 5),
          subTotal: Number(data.subTotal) || 0,
          gstAmount: Number(data.gstAmount) || 0,
          grandTotal: Number(data.grandTotal) || 0,

          subsidyAmount: data.subsidyAmount || '',
          termsAndConditions: { generalTerms: '', governmentSubsidy: '', warrantyDetails: '', panelWarranty: '', inverterWarranty: '', batteryWarranty: '', bosWarranty: '', maintenanceWarranty: '', warrantyNotes: '', siteCompletionSchedule: '', paymentTerms: '', warrantyExclusions: '', scopeOfWork: '', ...(data.termsAndConditions || {}) }
        });

        setBomItems(
          (data.bom || []).map((item, index) => ({
            srNo: item.srNo || String(index + 1),
            itemDescription: item.itemDescription || '',
            qty: Number(item.qty) || 0,
            unit: item.unit || 'Nos',
            brand: item.brand || '',
            rate: Number(item.rate) || 0,
            gstRate: Number(item.gstRate) || 0,
            gstAmount: Number(
              (((Number(item.qty) || 0) * (Number(item.rate) || 0) *
                (Number(item.gstRate) || 0)) / 100).toFixed(2)
            ),
            total: Number(
              ((Number(item.qty) || 0) * (Number(item.rate) || 0) *
                (1 + (Number(item.gstRate) || 0) / 100)).toFixed(2)
            )
          }))
        );

      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Failed to load quotation.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchQuotation();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // =====================================
  // 2. FORM HANDLERS
  // =====================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleMainItemChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      mainItem: {
        ...prev.mainItem,
        [name]: value
      }
    }));
  };

  // =====================================
  // 3. BOM HANDLERS
  // =====================================

  const handleBomChange = (index, field, value) => {
    setBomItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const updatedItem = {
          ...item,
          [field]: value
        };

        const qty = Number(updatedItem.qty) || 0;
        const rate = Number(updatedItem.rate) || 0;
        const gstRate = Number(updatedItem.gstRate) || 0;

        const baseAmount = qty * rate;
        const gstAmount = baseAmount * gstRate / 100;

        return {
          ...updatedItem,
          gstAmount: Number(gstAmount.toFixed(2)),
          total: Number((baseAmount + gstAmount).toFixed(2))
        };
      })
    );
  };

  const addBomItem = () => {
    setBomItems(prev => [
      ...prev,
      {
        srNo: String(prev.length + 1),
        itemDescription: '',
        qty: 1,
        unit: 'Nos',
        brand: '',
        rate: 0,
        gstRate: 0,
        gstAmount: 0,
        total: 0
      }
    ]);
  };

  const removeBomItem = (index) => {
    setBomItems(prev =>
      prev
        .filter((_, i) => i !== index)
        .map((item, i) => ({
          ...item,
          srNo: String(i + 1)
        }))
    );
  };

  // =====================================
  // 4. AUTOMATIC BOM CALCULATIONS
  // =====================================

  const totals = useMemo(() => {
    const subTotal = Number(formData.materialTotalAmount) || 0;
    const gstAmount = Number((subTotal * (Number(formData.materialGstRate) || 0) / 100).toFixed(2));
    return { subTotal, gstAmount, grandTotal: Number((subTotal + gstAmount).toFixed(2)) };
  }, [formData.materialTotalAmount, formData.materialGstRate]);


  // =====================================
  // 5. UPDATE REAL QUOTATION API
  // =====================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status !== 'Draft') {
      setError('Only Draft quotations can be edited.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        leadName: formData.leadName,
        plantCapacity: formData.plantCapacity,
        panelCount: Number(formData.panelCount),

        expiryDate: formData.expiryDate || undefined,

        mainItem: {
          ...formData.mainItem,
          rate: Number(formData.mainItem.rate) || 0,
          discount: Number(formData.mainItem.discount) || 0,
          totalAmountWithTax:
            Number(formData.mainItem.totalAmountWithTax) || 0
        },

        materialTotalAmount: totals.subTotal,
        materialGstRate: Number(formData.materialGstRate),
        subTotal: totals.subTotal,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,

        subsidyAmount: formData.subsidyAmount,

        termsAndConditions: formData.termsAndConditions,

        bom: bomItems.map((item, index) => ({ srNo: item.srNo || String(index + 1), itemDescription: item.itemDescription, qty: Number(item.qty) || 0, unit: item.unit, brand: item.brand, rate: 0, gstRate: 0, gstAmount: 0, total: 0 }))
      };

      await quotationService.update(id, payload);

      setSuccess('Quotation updated successfully!');

      setTimeout(() => {
        navigate(`/hr/quotations/view/${id}`);
      }, 1000);

    } catch (err) {
      console.error('Quotation Update Error:', err);

      setError(
        err.response?.data?.message ||
        'Failed to update quotation. Please try again.'
      );

    } finally {
      setIsSaving(false);
    }
  };

  // =====================================
  // 6. LOADING & ERROR STATES
  // =====================================

  if (isLoading) {
    return <Loader text="Loading Quotation Data..." />;
  }

  if (error && !estimateNo) {
    return (
      <div className="error-message">
        {error}
        <button onClick={() => navigate('/hr/quotations')}>
          Back to Quotations
        </button>
      </div>
    );
  }

  const isEditable = status === 'Draft';

  // =====================================
  // 7. UI
  // =====================================

  return (
    <div className="edit-quotation-page">

      <div className="page-top-bar">
        <button
          className="back-btn"
          onClick={() => navigate('/hr/quotations')}
        >
          <FiArrowLeft />
          Back to Quotations
        </button>

        {isEditable && (
          <Button
            variant="primary"
            icon={<FiSave />}
            type="submit"
            form="edit-quotation-form"
            isLoading={isSaving}
            disabled={isSaving}
          >
            Update Quotation
          </Button>
        )}
      </div>

      <div className="edit-header">
        <h1>Edit Quotation</h1>
        <p>
          Estimate No: <strong>{estimateNo}</strong>
        </p>
        <p>
          Status: <strong>{status}</strong>
        </p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {!isEditable && (
        <div className="error-message">
          This quotation cannot be edited because its status is {status}.
        </div>
      )}

      <form
        id="edit-quotation-form"
        onSubmit={handleSubmit}
        className="quotation-form"
      >

        {/* SECTION 1: CUSTOMER DETAILS */}

        <div className="form-card">

          <h3 className="section-title">
            1. Customer & System Details
          </h3>
          <div style={{ marginBottom: 14 }}>
          </div>

          <div className="form-grid">

            <div>
              <label>Customer Name</label>
              <p>
                <strong>{customer?.name || 'N/A'}</strong>
              </p>
            </div>

            <div>
              <label>Mobile Number</label>
              <p>{customer?.mobile || 'N/A'}</p>
            </div>

            <div>
              <label>Lead Name</label>
              <Input
                name="leadName"
                value={formData.leadName}
                onChange={handleInputChange}
                disabled={!isEditable}
              />
            </div>

            <div>
              <label>Plant Capacity</label>
              <Input
                name="plantCapacity"
                value={formData.plantCapacity}
                onChange={handleInputChange}
                disabled={!isEditable}
                placeholder="e.g. 3 KW"
              />
            </div>

            <div>
              <label>Number of Panels</label>
              <Input
                name="panelCount"
                type="number"
                value={formData.panelCount}
                onChange={handleInputChange}
                disabled={!isEditable}
              />
            </div>

            <div>
              <label>Expiry Date</label>
              <Input
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleInputChange}
                disabled={!isEditable}
              />
            </div>

          </div>
        </div>

        {/* SECTION 2: COMBINED MATERIAL PRICING */}
        <div className="form-card">
          <h3 className="section-title">2. Combined Material Pricing</h3>
          <div className="form-grid" style={{ alignItems: 'end' }}>
            <Input label="Total Material Amount (₹) — All Materials Combined" type="number" value={formData.materialTotalAmount} disabled={!isEditable} onChange={e => setFormData(prev => ({ ...prev, materialTotalAmount: e.target.value }))} />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>GST Rate<select value={formData.materialGstRate} disabled={!isEditable} onChange={e => setFormData(prev => ({ ...prev, materialGstRate: Number(e.target.value) }))} style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}>{[0,5,12,18,28].map(rate => <option key={rate} value={rate}>{rate}%</option>)}</select></label>
          </div>
          <div className="summary-box"><div className="summary-row"><span>Total Material Amount:</span><strong>₹ {totals.subTotal.toLocaleString('en-IN')}</strong></div><div className="summary-row"><span>GST ({formData.materialGstRate}%):</span><strong>₹ {totals.gstAmount.toLocaleString('en-IN')}</strong></div><div className="summary-row total"><span>Grand Total:</span><strong>₹ {totals.grandTotal.toLocaleString('en-IN')}</strong></div></div>
          <div style={{ marginTop: 20 }}><Input label="Subsidy Note" name="subsidyAmount" value={formData.subsidyAmount} onChange={handleInputChange} disabled={!isEditable} placeholder="Enter subsidy details" /></div>
        </div>

        {/* SECTION 3: BOM MATERIAL DETAILS ONLY */}
        <div className="form-card">
          <div className="section-header-row"><h3 className="section-title">3. Bill of Material (BOM)</h3>{isEditable && <Button type="button" variant="secondary" size="sm" icon={<FiPlus />} onClick={addBomItem}>Add Item</Button>}</div>
          <div className="bom-table-container"><table className="bom-table"><thead><tr><th>Sr No.</th><th>Item Description</th><th>Qty</th><th>Unit</th><th>Brand</th>{isEditable && <th>Action</th>}</tr></thead><tbody>
            {bomItems.map((item,index)=><tr key={index}><td><input value={item.srNo} disabled={!isEditable} onChange={e=>handleBomChange(index,'srNo',e.target.value)} /></td><td><input value={item.itemDescription} disabled={!isEditable} onChange={e=>handleBomChange(index,'itemDescription',e.target.value)} /></td><td><input type="number" min="0" value={item.qty} disabled={!isEditable} onChange={e=>handleBomChange(index,'qty',e.target.value)} /></td><td><input value={item.unit} disabled={!isEditable} onChange={e=>handleBomChange(index,'unit',e.target.value)} /></td><td><input value={item.brand} disabled={!isEditable} onChange={e=>handleBomChange(index,'brand',e.target.value)} /></td>{isEditable && <td><button type="button" className="remove-btn" onClick={()=>removeBomItem(index)}><FiTrash2 /></button></td>}</tr>)}
            {bomItems.length===0 && <tr><td colSpan={isEditable?6:5}>No BOM items available.</td></tr>}
          </tbody></table></div>
        </div>

      </form>

    </div>
  );
};

export default EditQuotation;
