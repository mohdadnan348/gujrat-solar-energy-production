
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

const DEFAULT_TERMS_AND_CONDITIONS = {
  "generalTerms": "Material dispatch and Installation shall be started upon DISCOM approval only.\nFor better performance, solar panels should be cleaned by customer two times in a week.\nConcealed wiring shall be done by company, if possible only. Otherwise, customer should do concealed wiring with their wiremen where material shall be provided by Company.\nAfter successful installation, Customer shall take care of solar plant by doing timely cleaning. If we found less generation at the time of attending complaint due to non-cleaning, we may charge you additional service charge.\nThere is manufacturing warranty for all electronics equipment. Company will help to claim this warranty if require.",
  "governmentSubsidy": "Subsidy Credit: If applicable, any subsidy will be directly credited to the customer's account. Our company will handle all necessary documentation with the government.\nDelay Disclaimer: Please note that subsidy amounts may experience delays from the government's side. Our company is not liable to compensate for any delays or non-receipt of subsidies if not provided by the government.",
  "panelWarranty": "90% of rated capacity for the first 15 years.\n80% of rated capacity for the next 15 years.\nTotal Panel Life: 30 years.\nRefer Solar Panel Datasheet for detailed warranty terms.",
  "inverterWarranty": "12 years, extendable.\nRefer Inverter Datasheet for detailed warranty terms.",
  "batteryWarranty": "8 years, Extendable.\nRefer Battery Datasheet for detailed warranty terms.",
  "bosWarranty": "Equipment/products supplied by us which are warranted against defects due to poor material, design, or workmanship.\nThis warranty is valid for 12 months from the date of commissioning or when put into service, whichever is earlier.",
  "maintenanceWarranty": "We offer 5 years of O&M support, including fault finding, remote monitoring, site visits, and assistance with warranty claims for components.\nO&M does not include solar panel cleaning and washing.",
  "warrantyNotes": "All warranties provided by the manufacturer/supplier are in favor of the buyer and cover the equipment for the specified period.\nWarranties ensure safe working of individual components and vary in validity period.\nWarranties do not cover damages caused by external hazardous conditions.",
  "siteCompletionSchedule": "Dispatch within 6 weeks after order confirmation with payment.\nThe entire power plant will be installed and commissioned within 60-70 days (approx.) after project accreditation, contract agreement, and possession of the site.",
  "paymentTerms": "50% advance payment upon contract signing.\n40% upon delivery of structure material.\n10% before meter installation is complete.",
  "warrantyExclusions": "Damage or defect caused by transportation, accident, misuse, lack of maintenance, improper usage, or negligence by the owner.\nWilful damage, normal wear and tear, abuse, or misuse of equipment/product.\nDamage or defect caused by Force Majeure events, including fire, earthquake, flood, or other natural disasters.\nDamage or defect caused by unauthorized alterations, modifications, or conversions.\nRepairs carried out by personnel not authorized by the contractor.\nDefects or damages due to external causes.\nParts and components repaired or replaced during the warranty period are warranted only for the original warranty period. The contractor will take back replaced or defective material.",
  "scopeOfWork": "Providing access/approach to rooftop.\nIf any electrical modification is required from DISCOM (i.e. ELCB, changeover switch etc.) Customer shall provide necessary support.\nProvide necessary documents for project approvals from State/Central Government.\nSite clearance, ladders, water, and electricity supply for smooth installation and commissioning of the project.\nCustomer shall provide Safe Place for Material unloading and storage during the work execution.\nNet meter / Smart meter charge in your scope."
};

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
    termsAndConditions: { ...DEFAULT_TERMS_AND_CONDITIONS, warrantyDetails: DEFAULT_TERMS_AND_CONDITIONS.panelWarranty }
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
          termsAndConditions: { ...DEFAULT_TERMS_AND_CONDITIONS, warrantyDetails: DEFAULT_TERMS_AND_CONDITIONS.panelWarranty, ...(data.termsAndConditions || {}) }
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

    // Changing plant capacity suggests ₹60,000 per kW; the total amount
    // can still be manually overridden in the pricing section.
    if (name === 'plantCapacity') {
      const capacity = Number.parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
      setFormData(prev => ({
        ...prev,
        plantCapacity: value,
        materialTotalAmount: capacity > 0 ? Math.round(capacity * 60000) : 0
      }));
    }
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
        navigate(`/admin/quotations/view/${id}`);
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
        <button onClick={() => navigate('/admin/quotations')}>
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
          onClick={() => navigate('/admin/quotations')}
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
            <Input label="Total Material Amount (₹) — ₹60,000 per kW default, editable" type="number" value={formData.materialTotalAmount} disabled={!isEditable} onChange={e => setFormData(prev => ({ ...prev, materialTotalAmount: e.target.value }))} />
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


        {/* SECTION 4: EDITABLE TERMS & CONDITIONS */}
        <div className="form-card terms-edit-card">
          <h3 className="section-title">4. Terms &amp; Conditions</h3>
          <p style={{ color: "#64748b", fontSize: 13, marginTop: -6, marginBottom: 16 }}>
            Edit the terms below. These saved values are used when the quotation PDF is generated.
          </p>
          <div className="form-grid">
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>General Terms</label>
              <textarea
                name="generalTerms"
                value={formData.termsAndConditions?.generalTerms || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, generalTerms: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter general terms..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Government Subsidy</label>
              <textarea
                name="governmentSubsidy"
                value={formData.termsAndConditions?.governmentSubsidy || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, governmentSubsidy: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter government subsidy..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Warranty Details</label>
              <textarea
                name="warrantyDetails"
                value={formData.termsAndConditions?.warrantyDetails || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, warrantyDetails: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter warranty details..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Solar Panel Warranty</label>
              <textarea
                name="panelWarranty"
                value={formData.termsAndConditions?.panelWarranty || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, panelWarranty: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter solar panel warranty..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Inverter Warranty</label>
              <textarea
                name="inverterWarranty"
                value={formData.termsAndConditions?.inverterWarranty || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, inverterWarranty: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter inverter warranty..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Battery Warranty</label>
              <textarea
                name="batteryWarranty"
                value={formData.termsAndConditions?.batteryWarranty || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, batteryWarranty: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter battery warranty..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>BOS Warranty</label>
              <textarea
                name="bosWarranty"
                value={formData.termsAndConditions?.bosWarranty || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, bosWarranty: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter bos warranty..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Maintenance / Service Warranty</label>
              <textarea
                name="maintenanceWarranty"
                value={formData.termsAndConditions?.maintenanceWarranty || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, maintenanceWarranty: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter maintenance / service warranty..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Additional Warranty Notes</label>
              <textarea
                name="warrantyNotes"
                value={formData.termsAndConditions?.warrantyNotes || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, warrantyNotes: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter additional warranty notes..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Site Completion Schedule</label>
              <textarea
                name="siteCompletionSchedule"
                value={formData.termsAndConditions?.siteCompletionSchedule || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, siteCompletionSchedule: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter site completion schedule..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Payment Terms</label>
              <textarea
                name="paymentTerms"
                value={formData.termsAndConditions?.paymentTerms || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, paymentTerms: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter payment terms..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Warranty Exclusions</label>
              <textarea
                name="warrantyExclusions"
                value={formData.termsAndConditions?.warrantyExclusions || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, warrantyExclusions: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter warranty exclusions..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 7 }}>Scope of Work</label>
              <textarea
                name="scopeOfWork"
                value={formData.termsAndConditions?.scopeOfWork || ""}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  termsAndConditions: { ...prev.termsAndConditions, scopeOfWork: e.target.value }
                }))}
                disabled={!isEditable}
                rows={3}
                placeholder="Enter scope of work..."
                style={{ width: "100%", minHeight: 86, padding: 12, border: "1px solid #d1d5db", borderRadius: 8, resize: "vertical", font: "inherit", background: isEditable ? "#fff" : "#f8fafc", color: "#1f2937" }}
              />
            </div>
          </div>
        </div>

      </form>

    </div>
  );
};

export default EditQuotation;
