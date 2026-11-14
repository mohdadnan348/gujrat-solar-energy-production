
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';

import Input from '../../../components/Common/Input';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import quotationService from '../../../services/quotationService';

import './EditQuotation.css';

const DEFAULT_TERMS_AND_CONDITIONS = {
  generalTerms: `Material dispatch and Installation shall be started upon DISCOM approval only.
For better performance, solar panels should be cleaned by customer two times in a week.
Concealed wiring shall be done by company, if possible only. Otherwise, customer should do concealed wiring with their wiremen where material shall be provided by Company.
After successful installation, Customer shall take care of solar plant by doing timely cleaning. If we found less generation at the time of attending complaint due to non-cleaning, we may charge you additional service charge.
There is manufacturing warranty for all electronics equipment. Company will help to claim this warranty if require.`,

  governmentSubsidy: `Subsidy Credit: If applicable, any subsidy will be directly credited to the customer's account. Our company will handle all necessary documentation with the government.
Delay Disclaimer: Please note that subsidy amounts may experience delays from the government's side. Our company is not liable to compensate for any delays or non-receipt of subsidies if not provided by the government.`,

  panelWarranty: `90% of rated capacity for the first 15 years.
80% of rated capacity for the next 15 years.
Total Panel Life: 30 years.
Refer Solar Panel Datasheet for detailed warranty terms.`,

  inverterWarranty: `12 years, extendable.
Refer Inverter Datasheet for detailed warranty terms.`,

  batteryWarranty: `8 years, Extendable.
Refer Battery Datasheet for detailed warranty terms.`,

  bosWarranty: `Equipment/products supplied by us which are warranted against defects due to poor material, design, or workmanship.
This warranty is valid for 12 months from the date of commissioning or when put into service, whichever is earlier.`,

  maintenanceWarranty: `We offer 5 years of O&M support, including fault finding, remote monitoring, site visits, and assistance with warranty claims for components.
O&M does not include solar panel cleaning and washing.`,

  warrantyNotes: `All warranties provided by the manufacturer/supplier are in favor of the buyer and cover the equipment for the specified period.
Warranties ensure safe working of individual components and vary in validity period.
Warranties do not cover damages caused by external hazardous conditions.`,

  siteCompletionSchedule: `Dispatch within 6 weeks after order confirmation with payment.
The entire power plant will be installed and commissioned within 60-70 days (approx.) after project accreditation, contract agreement, and possession of the site.`,

  paymentTerms: `50% advance payment upon contract signing.
40% upon delivery of structure material.
10% before meter installation is complete.`,

  warrantyExclusions: `Damage or defect caused by transportation, accident, misuse, lack of maintenance, improper usage, or negligence by the owner.
Wilful damage, normal wear and tear, abuse, or misuse of equipment/product.
Damage or defect caused by Force Majeure events, including fire, earthquake, flood, or other natural disasters.
Damage or defect caused by unauthorized alterations, modifications, or conversions.
Repairs carried out by personnel not authorized by the contractor.
Defects or damages due to external causes.
Parts and components repaired or replaced during the warranty period are warranted only for the original warranty period. The contractor will take back replaced or defective material.`,

  scopeOfWork: `Providing access/approach to rooftop.
If any electrical modification is required from DISCOM (i.e. ELCB, changeover switch etc.) Customer shall provide necessary support.
Provide necessary documents for project approvals from State/Central Government.
Site clearance, ladders, water, and electricity supply for smooth installation and commissioning of the project.
Customer shall provide Safe Place for Material unloading and storage during the work execution.
Net meter / Smart meter charge in your scope.`
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

const TERM_FIELDS = [
  { key: 'generalTerms', label: 'General Terms' },
  { key: 'governmentSubsidy', label: 'Government Subsidy' },
  { key: 'panelWarranty', label: 'Solar Panel Warranty' },
  { key: 'inverterWarranty', label: 'Inverter Warranty' },
  { key: 'batteryWarranty', label: 'Battery Warranty' },
  { key: 'bosWarranty', label: 'BOS Warranty' },
  { key: 'maintenanceWarranty', label: 'Maintenance / Service Warranty' },
  { key: 'warrantyNotes', label: 'Additional Warranty Notes' },
  { key: 'siteCompletionSchedule', label: 'Site Completion Schedule' },
  { key: 'paymentTerms', label: 'Payment Terms' },
  { key: 'warrantyExclusions', label: 'Warranty Exclusions' },
  { key: 'scopeOfWork', label: 'Scope of Work' }
];

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
    customerCategory: 'RESIDENTIAL',
    systemType: 'ON_GRID',
    batteryIncluded: false,
    panelCount: 0,
    expiryDate: '',
    mainItem: { ...initialMainItem },
    materialTotalAmount: 0,
    materialGstRate: 0,
    gstType: 'CGST_SGST',
    gstMode: 'EXTRA',
    perKwAmount: 0,
    subTotal: 0,
    gstAmount: 0,
    grandTotal: 0,
    subsidyAmount: '',
    termsAndConditions: {
      ...DEFAULT_TERMS_AND_CONDITIONS,
      warrantyDetails: DEFAULT_TERMS_AND_CONDITIONS.panelWarranty
    }
  });

  const [bomItems, setBomItems] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  // FETCH QUOTATION
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

        setTestimonials(
          Array.isArray(data.testimonials) ? data.testimonials : []
        );

        setFormData({
          leadName: data.leadName || '',
          plantCapacity: String(data.plantCapacity || '').replace(/\s*KW\s*$/i, ''),
          customerCategory: data.customerCategory || 'RESIDENTIAL',
          systemType: data.systemType || 'ON_GRID',
          batteryIncluded: Boolean(data.batteryIncluded),
          panelCount: data.panelCount || 0,

          expiryDate: data.expiryDate
            ? new Date(data.expiryDate).toISOString().slice(0, 10)
            : '',

          mainItem: {
            ...initialMainItem,
            ...(data.mainItem || {})
          },

          materialTotalAmount: Number(
            data.materialTotalAmount ?? data.subTotal
          ) || 0,

          materialGstRate: Number(data.materialGstRate ?? 0),
          gstType: data.gstType || 'CGST_SGST',
          gstMode: data.gstMode || 'EXTRA',
          perKwAmount: Number(data.perKwAmount) || 0,
          subTotal: Number(data.subTotal) || 0,
          gstAmount: Number(data.gstAmount) || 0,
          grandTotal: Number(data.grandTotal) || 0,
          subsidyAmount: data.subsidyAmount || '',

          termsAndConditions: {
            ...DEFAULT_TERMS_AND_CONDITIONS,
            warrantyDetails: DEFAULT_TERMS_AND_CONDITIONS.panelWarranty,
            ...(data.termsAndConditions || {})
          }
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
              (
                (Number(item.qty) || 0) *
                (Number(item.rate) || 0) *
                (Number(item.gstRate) || 0) / 100
              ).toFixed(2)
            ),
            total: Number(
              (
                (Number(item.qty) || 0) *
                (Number(item.rate) || 0) *
                (1 + (Number(item.gstRate) || 0) / 100)
              ).toFixed(2)
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
        if (isMounted) setIsLoading(false);
      }
    };

    fetchQuotation();

    return () => {
      isMounted = false;
    };
  }, [id]);

  // INPUT HANDLERS
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (
      name === 'plantCapacity' &&
      value !== '' &&
      Number(value) <= 0
    ) {
      setError('Plant capacity must be greater than 0 KW.');
    } else if (name === 'plantCapacity') {
      setError('');
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

  // TERMS HANDLER
  const handleTermChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: {
        ...prev.termsAndConditions,
        [key]: value
      }
    }));
  };

  // BOM HANDLERS
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

  // GST CALCULATION
  const totals = useMemo(() => {
    const amount = Number(formData.materialTotalAmount) || 0;
    const rate = Math.max(0, Number(formData.materialGstRate) || 0);

    const gstAmount =
      formData.gstType === 'NONE'
        ? 0
        : Number(
            (
              formData.gstMode === 'INCLUDED'
                ? amount - amount / (1 + rate / 100)
                : amount * rate / 100
            ).toFixed(2)
          );

    const subTotal =
      formData.gstMode === 'INCLUDED'
        ? Number((amount - gstAmount).toFixed(2))
        : amount;

    const cgstAmount =
      formData.gstType === 'CGST_SGST'
        ? Number((gstAmount / 2).toFixed(2))
        : 0;

    const sgstAmount =
      formData.gstType === 'CGST_SGST'
        ? Number((gstAmount / 2).toFixed(2))
        : 0;

    const igstAmount =
      formData.gstType === 'IGST' ? gstAmount : 0;

    const grandTotal = Number(
      (
        formData.gstMode === 'INCLUDED'
          ? amount
          : amount + gstAmount
      ).toFixed(2)
    );

    return {
      subTotal,
      gstAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      grandTotal
    };
  }, [
    formData.materialTotalAmount,
    formData.materialGstRate,
    formData.gstType,
    formData.gstMode
  ]);

  // UPDATE QUOTATION
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (status !== 'Draft') {
      setError('Only Draft quotations can be edited.');
      return;
    }

    if (
      !formData.plantCapacity ||
      Number(formData.plantCapacity) <= 0
    ) {
      setError('Plant capacity must be greater than 0 KW.');
      return;
    }

    if (
      !formData.materialTotalAmount ||
      Number(formData.materialTotalAmount) <= 0
    ) {
      setError('Please enter quotation amount manually.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      const payload = {
        leadName: formData.leadName,
        plantCapacity: `${formData.plantCapacity} KW`,
        customerCategory: formData.customerCategory,
        systemType: formData.systemType,
        batteryIncluded: formData.systemType !== 'ON_GRID',
        panelCount: Number(formData.panelCount),

        expiryDate: formData.expiryDate || undefined,

        mainItem: {
          ...formData.mainItem,
          rate: Number(formData.mainItem.rate) || 0,
          discount: Number(formData.mainItem.discount) || 0,
          totalAmountWithTax:
            Number(formData.mainItem.totalAmountWithTax) || 0
        },

        materialTotalAmount: Number(formData.materialTotalAmount) || 0,
        perKwAmount: Number(formData.perKwAmount) || 0,

        gstMode: formData.gstMode,
        materialGstRate: Number(formData.materialGstRate) || 0,
        gstType: formData.gstType,

        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        subTotal: totals.subTotal,
        gstAmount: totals.gstAmount,
        grandTotal: totals.grandTotal,

        testimonials,

        subsidyAmount:
          formData.customerCategory === 'RESIDENTIAL' &&
          formData.systemType !== 'OFF_GRID'
            ? formData.subsidyAmount
            : '',

        termsAndConditions: formData.termsAndConditions,

        bom: bomItems.map((item, index) => ({
          srNo: item.srNo || String(index + 1),
          itemDescription: item.itemDescription,
          qty: Number(item.qty) || 0,
          unit: item.unit,
          brand: item.brand,
          rate: Number(item.rate) || 0,
          gstRate: Number(item.gstRate) || 0,
          gstAmount: Number(item.gstAmount) || 0,
          total: Number(item.total) || 0
        }))
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
              <label>Plant Capacity (KW)</label>
              <Input
                name="plantCapacity"
                type="number"
                min="0.1"
                step="any"
                value={formData.plantCapacity}
                onChange={handleInputChange}
                disabled={!isEditable}
                placeholder="Enter capacity in KW"
              />
            </div>

            <div>
              <label>Customer Category</label>
              <select
                value={formData.customerCategory}
                disabled={!isEditable}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    customerCategory: e.target.value,
                    subsidyAmount:
                      e.target.value === 'RESIDENTIAL' &&
                      prev.systemType !== 'OFF_GRID'
                        ? prev.subsidyAmount
                        : ''
                  }))
                }
                style={{
                  minHeight: 44,
                  width: '100%',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '0 12px'
                }}
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
              </select>
            </div>

            <div>
              <label>Solar System Type</label>
              <select
                value={formData.systemType}
                disabled={!isEditable}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    systemType: e.target.value,
                    batteryIncluded: e.target.value !== 'ON_GRID',
                    subsidyAmount:
                      prev.customerCategory === 'RESIDENTIAL' &&
                      e.target.value !== 'OFF_GRID'
                        ? prev.subsidyAmount
                        : ''
                  }))
                }
                style={{
                  minHeight: 44,
                  width: '100%',
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '0 12px'
                }}
              >
                <option value="ON_GRID">On-Grid (No Battery)</option>
                <option value="OFF_GRID">Off-Grid (Battery)</option>
                <option value="HYBRID">Hybrid (Grid + Battery)</option>
              </select>
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

        {/* SECTION 2: PRICING */}
        <div className="form-card">
          <h3 className="section-title">
            2. Combined Material Pricing
          </h3>

          <div className="form-grid" style={{ alignItems: 'end' }}>
            <Input
              label="Amount per KW (₹)"
              type="number"
              value={formData.perKwAmount}
              disabled={!isEditable}
              onChange={e =>
                handleInputChange({
                  target: {
                    name: 'perKwAmount',
                    value: e.target.value
                  }
                })
              }
            />

            <Input
              label="Total Quotation Amount (₹)"
              type="number"
              value={formData.materialTotalAmount}
              disabled={!isEditable}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  materialTotalAmount: e.target.value
                }))
              }
            />

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              GST Type
              <select
                value={formData.gstType}
                disabled={!isEditable}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    gstType: e.target.value
                  }))
                }
                style={{
                  minHeight: 44,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '0 12px'
                }}
              >
                <option value="CGST_SGST">CGST + SGST</option>
                <option value="IGST">IGST</option>
                <option value="NONE">No GST</option>
              </select>
            </label>

            <Input
              label="GST Percentage (any value)"
              type="number"
              min="0"
              step="any"
              value={formData.materialGstRate}
              disabled={!isEditable}
              onChange={e =>
                setFormData(prev => ({
                  ...prev,
                  materialGstRate: e.target.value
                }))
              }
            />

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              GST Calculation
              <select
                value={formData.gstMode}
                disabled={!isEditable}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    gstMode: e.target.value
                  }))
                }
                style={{
                  minHeight: 44,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  padding: '0 12px'
                }}
              >
                <option value="EXTRA">GST Extra</option>
                <option value="INCLUDED">GST Included in Amount</option>
              </select>
            </label>
          </div>

          <div className="summary-box">
            <div className="summary-row">
              <span>
                {formData.gstMode === 'INCLUDED'
                  ? 'Taxable Amount:'
                  : 'Package Amount:'}
              </span>
              <strong>
                ₹ {totals.subTotal.toLocaleString('en-IN')}
              </strong>
            </div>

            {formData.gstType === 'CGST_SGST' ? (
              <>
                <div className="summary-row">
                  <span>
                    CGST ({Number(formData.materialGstRate) / 2}%):
                  </span>
                  <strong>
                    ₹ {totals.cgstAmount.toLocaleString('en-IN')}
                  </strong>
                </div>

                <div className="summary-row">
                  <span>
                    SGST ({Number(formData.materialGstRate) / 2}%):
                  </span>
                  <strong>
                    ₹ {totals.sgstAmount.toLocaleString('en-IN')}
                  </strong>
                </div>
              </>
            ) : formData.gstType === 'IGST' ? (
              <div className="summary-row">
                <span>IGST ({formData.materialGstRate}%):</span>
                <strong>
                  ₹ {totals.igstAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            ) : (
              <div className="summary-row">
                <span>GST:</span>
                <strong>₹ 0</strong>
              </div>
            )}

            <div className="summary-row total">
              <span>Grand Total:</span>
              <strong>
                ₹ {totals.grandTotal.toLocaleString('en-IN')}
              </strong>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <Input
              label="Subsidy Note"
              name="subsidyAmount"
              value={formData.subsidyAmount}
              onChange={handleInputChange}
              disabled={
                !isEditable ||
                formData.customerCategory !== 'RESIDENTIAL' ||
                formData.systemType === 'OFF_GRID'
              }
              placeholder="Enter eligible subsidy details"
            />
          </div>
        </div>

        {/* SECTION 3: TESTIMONIALS */}
        <div className="form-card">
          <h3 className="section-title">3. Testimonials</h3>

          {testimonials.map((item, index) => (
            <div className="testimonial-editor" key={index}>
              <Input
                label={`Customer ${index + 1}`}
                value={item.name || ''}
                disabled={!isEditable}
                onChange={e =>
                  setTestimonials(prev =>
                    prev.map((t, i) =>
                      i === index
                        ? { ...t, name: e.target.value }
                        : t
                    )
                  )
                }
              />

              <label>
                Testimonial
                <textarea
                  rows="3"
                  disabled={!isEditable}
                  value={item.text || ''}
                  onChange={e =>
                    setTestimonials(prev =>
                      prev.map((t, i) =>
                        i === index
                          ? { ...t, text: e.target.value }
                          : t
                      )
                    )
                  }
                />
              </label>

              {isEditable && (
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() =>
                    setTestimonials(prev =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          {isEditable && (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setTestimonials(prev => [
                  ...prev,
                  { name: '', text: '', rating: 5 }
                ])
              }
            >
              Add Testimonial
            </Button>
          )}
        </div>

        {/* SECTION 4: BOM */}
        <div className="form-card">
          <div className="section-header-row">
            <h3 className="section-title">
              4. Bill of Material (BOM)
            </h3>

            {isEditable && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<FiPlus />}
                onClick={addBomItem}
              >
                Add Item
              </Button>
            )}
          </div>

          <div className="bom-table-container">
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Sr No.</th>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Brand</th>
                  {isEditable && <th>Action</th>}
                </tr>
              </thead>

              <tbody>
                {bomItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        value={item.srNo}
                        disabled={!isEditable}
                        onChange={e =>
                          handleBomChange(index, 'srNo', e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        value={item.itemDescription}
                        disabled={!isEditable}
                        onChange={e =>
                          handleBomChange(
                            index,
                            'itemDescription',
                            e.target.value
                          )
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.qty}
                        disabled={!isEditable}
                        onChange={e =>
                          handleBomChange(index, 'qty', e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        value={item.unit}
                        disabled={!isEditable}
                        onChange={e =>
                          handleBomChange(index, 'unit', e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        value={item.brand}
                        disabled={!isEditable}
                        onChange={e =>
                          handleBomChange(index, 'brand', e.target.value)
                        }
                      />
                    </td>

                    {isEditable && (
                      <td>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeBomItem(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {bomItems.length === 0 && (
                  <tr>
                    <td colSpan={isEditable ? 6 : 5}>
                      No BOM items available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 5: TERMS AND CONDITIONS */}
        <div className="form-card terms-edit-card">
          <h3 className="section-title">
            5. Terms &amp; Conditions
          </h3>

          <p
            style={{
              color: '#64748b',
              fontSize: 13,
              marginTop: -6,
              marginBottom: 16
            }}
          >
            Edit the terms below. These saved values are used when the
            quotation PDF is generated.
          </p>

          <div className="form-grid">
            {TERM_FIELDS.map(field => (
              <div
                key={field.key}
                style={{ gridColumn: '1 / -1' }}
              >
                <label
                  style={{
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: 7
                  }}
                >
                  {field.label}
                </label>

                <textarea
                  name={field.key}
                  value={
                    formData.termsAndConditions?.[field.key] || ''
                  }
                  onChange={e =>
                    handleTermChange(field.key, e.target.value)
                  }
                  disabled={!isEditable}
                  rows={4}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  style={{
                    width: '100%',
                    minHeight: 86,
                    padding: 12,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    resize: 'vertical',
                    font: 'inherit',
                    background: isEditable ? '#fff' : '#f8fafc',
                    color: '#1f2937'
                  }}
                />
              </div>
            ))}

            <div style={{ gridColumn: '1 / -1' }}>
              <label
                style={{
                  display: 'block',
                  fontWeight: 600,
                  marginBottom: 7
                }}
              >
                Warranty Details
              </label>

              <textarea
                name="warrantyDetails"
                value={
                  formData.termsAndConditions?.warrantyDetails || ''
                }
                onChange={e =>
                  handleTermChange('warrantyDetails', e.target.value)
                }
                disabled={!isEditable}
                rows={3}
                placeholder="Enter warranty details..."
                style={{
                  width: '100%',
                  minHeight: 86,
                  padding: 12,
                  border: '1px solid #d1d5db',
                  borderRadius: 8,
                  resize: 'vertical',
                  font: 'inherit',
                  background: isEditable ? '#fff' : '#f8fafc',
                  color: '#1f2937'
                }}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditQuotation;
