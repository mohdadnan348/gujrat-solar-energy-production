
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import InlineCustomerModal from '../../../components/Common/InlineCustomerModal';
import customerService from '../../../services/customerService';
import quotationService from '../../../services/quotationService';
import './CreateQuotation.css';

const UNIT_OPTIONS = [
  { label: 'Set', value: 'Set' },
  { label: 'Nos', value: 'Nos' },
  { label: 'Mtr', value: 'Mtr' },
  { label: 'Sq.Ft', value: 'Sq.Ft' },
  { label: 'kW', value: 'kW' },
  { label: 'kWh', value: 'kWh' },
  { label: 'Ltr', value: 'Ltr' },
  { label: 'Job', value: 'Job' },
  { label: 'Lot', value: 'Lot' },
  { label: 'Pkt', value: 'Pkt' }
];

const BRAND_OPTIONS = [
  'Adani', 'Waaree', 'TATA', 'Sanora', 'Satvik', 'ORB', 'Loom',
  'Vikram Solar', 'Polycab', 'Qbits', 'Havells', 'Envergy',
  'Sungrow', 'Growatt', 'Luminous', 'Appolo', 'JSW', 'Schneider',
  'L&T', 'ELMEX', 'Sibass', 'Finolex', 'Apar', 'Jenflex',
  'HPI', 'RR Kabel', 'Standard', 'SS304', 'PVC', 'Copper',
  'Aluminium', 'MCB', 'SPD', 'DCBB', 'ACDB'
];

const CreateQuotation = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    customerCategory: 'RESIDENTIAL',
    systemType: 'ON_GRID',
    batteryIncluded: false,
    leadName: '',
    plantCapacity: '',
    panelCount: 5,
    subsidyAmount: '',
    createdByName: user?.name || '',
    panelBrand: '',
    panelWattage: '',
    panelTechnology: '',
    subsidyDescription: 'Subsidy will be credited to your bank account directly.',
    mainItem: {
      description: 'Residential Solar Rooftop On-Grid Plant',
      panelDetails: '',
      inverterDetails: '',
      qty: 'Custom',
      rate: 0,
      discount: 0
    }
  });

  const [bomItems, setBomItems] = useState([
    { srNo: '1', itemDescription: 'Solar Panels (PV Modules)', qty: 1, unit: 'Set', rate: 0, gstRate: 5, gstAmount: 0, total: 0, brand: 'Adani/Waaree/TATA/Sanora/Satvik/ORB/Loom' },
    { srNo: '2', itemDescription: 'Solar String Inverter', qty: 1, unit: 'Nos', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Qbits/Waaree/TATA/Sanora/Havells/Polycab/Envergy' },
    { srNo: '3', itemDescription: 'Solar 80 micron HDGI Structure* - 80 x 40 mm x 3 mm For Leg, Rafters; 40 x 40 mm x 3 mm For purlins', qty: 1, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Appolo/TATA/JSW' },
    { srNo: '4.1', itemDescription: 'ACDB (IP65) - With SPD, Fuse & MCB; DCDB (IP65) - With SPD, Fuse & MCB', qty: 1, unit: 'Nos', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/Schneider/Sibass/L&T/ELMEX' },
    { srNo: '5.1', itemDescription: '4 SQ MM DC Solar Copper Cable, XLS-R, UV RESISTANT, 1100V Grade, Double Insulated', qty: 30, unit: 'Mtr', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/RR/Finolex/Apar/Jenflex/HPL' },
    { srNo: '5.2', itemDescription: '4 SQ MM or 6 SQ MM AC Wire, XLS-R', qty: 30, unit: 'Mtr', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/RR/Finolex/Apar/HPL' },
    { srNo: '5.3', itemDescription: '4 SQ MM Copper Earthing wire for AC & DC', qty: 30, unit: 'Mtr', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/RR/Finolex/Apar/HPL' },
    { srNo: '5.4', itemDescription: '16 SQ MM Aluminium Wire For LA', qty: 30, unit: 'Mtr', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/RR/Finolex/Apar/HPL' },
    { srNo: '5.5', itemDescription: 'UPVC Conduit Pipe for wiring', qty: 1, unit: 'Mtr', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Polycab/RR/Finolex/Apar/HPL' },
    { srNo: '6.1', itemDescription: '200 Micron Copper Coated 1 Meter Earthing Rod for AC / DC & LA', qty: 3, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Standard' },
    { srNo: '6.2', itemDescription: '1 Meter copper LA with 3 spike & insulator', qty: 1, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Standard' },
    { srNo: '7.1', itemDescription: 'Wifi Stick : Data Loger for Online Monitoring', qty: 1, unit: 'Nos', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'As per inverter' },
    { srNo: '8.1', itemDescription: 'Cable tie, SS304 300mm (100Pcs/Pkt)', qty: 1, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'SS304/PVC' },
    { srNo: '8.2', itemDescription: 'Ferules & Cable Tags', qty: 1, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Standard' },
    { srNo: '8.3', itemDescription: 'Lugs Ring Type As per wiring requirements', qty: 1, unit: 'Set', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: 'Copper/Aluminium' }
  ]);

  const [bomOptions, setBomOptions] = useState([]);
  const [selectedBomOption, setSelectedBomOption] = useState('standard-bom');
  const [bomOptionName, setBomOptionName] = useState('Standard BOM');

  const [materialTotalAmount, setMaterialTotalAmount] = useState('');
  const [materialGstRate, setMaterialGstRate] = useState('');
  const [gstType, setGstType] = useState('CGST_SGST');
  const [gstMode, setGstMode] = useState('EXTRA');

  // Multiline terms use template literals to avoid unterminated string errors.
  const [termsAndConditions, setTermsAndConditions] = useState({
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
  });

  const [testimonials, setTestimonials] = useState([
    {
      name: 'Rahulbhai Patel',
      text: 'Extremely satisfied with our rooftop solar power plant and professional installation.',
      rating: 5
    },
    {
      name: 'Payalben Hirpara',
      text: 'The product quality and complete experience were excellent.',
      rating: 5
    },
    {
      name: 'Happy Customer',
      text: 'The team guided us at every step and made the process simple.',
      rating: 5
    }
  ]);

  const [summary, setSummary] = useState({
    subTotal: 0,
    totalGst: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    igstAmount: 0,
    grandTotal: 0
  });

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // GST calculation
  useEffect(() => {
    const enteredAmount = Number(materialTotalAmount) || 0;
    const rate = Math.max(0, Number(materialGstRate) || 0);

    const gst =
      gstType === 'NONE'
        ? 0
        : gstMode === 'INCLUDED'
          ? enteredAmount - enteredAmount / (1 + rate / 100)
          : enteredAmount * rate / 100;

    const taxable =
      gstMode === 'INCLUDED' ? enteredAmount - gst : enteredAmount;

    const totalGst = Number(gst.toFixed(2));
    const cgstAmount = gstType === 'CGST_SGST' ? totalGst / 2 : 0;
    const sgstAmount = gstType === 'CGST_SGST' ? totalGst / 2 : 0;
    const igstAmount = gstType === 'IGST' ? totalGst : 0;

    setSummary({
      subTotal: taxable.toFixed(2),
      enteredAmount: enteredAmount.toFixed(2),
      totalGst: totalGst.toFixed(2),
      cgstAmount: cgstAmount.toFixed(2),
      sgstAmount: sgstAmount.toFixed(2),
      igstAmount: igstAmount.toFixed(2),
      grandTotal: (
        gstMode === 'INCLUDED'
          ? enteredAmount
          : enteredAmount + totalGst
      ).toFixed(2)
    });
  }, [materialTotalAmount, materialGstRate, gstType, gstMode]);

  useEffect(() => { if (!formData.createdByName && user?.name) setFormData(prev => ({ ...prev, createdByName: user.name })); }, [user?.name]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBomChange = (index, field, value) => {
    setBomItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  };

  const addBomItem = () => {
    setBomItems(prev => [
      ...prev,
      {
        srNo: (prev.length + 1).toString(),
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
    setBomItems(prev => prev.filter((_, i) => i !== index));
  };

  const saveCurrentBomOption = () => {
    const name = (bomOptionName || '').trim();
    if (!name) { alert('Please enter a BOM option name.'); return; }
    const optionId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    setBomOptions(prev => [...prev.filter(option => option.optionId !== optionId), { optionId, name, items: bomItems.map(item => ({ ...item })) }]);
    setSelectedBomOption(optionId);
  };

  const loadBomOption = (optionId) => {
    const option = bomOptions.find(item => item.optionId === optionId);
    if (option) setBomItems(option.items.map(item => ({ ...item })));
    setSelectedBomOption(optionId);
    setBomOptionName(option?.name || '');
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [newCustomer, ...prev]);
    setFormData(prev => ({
      ...prev,
      customerId: newCustomer._id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }

    if (
      !formData.plantCapacity ||
      Number(formData.plantCapacity) <= 0
    ) {
      alert('Plant capacity must be greater than 0 KW.');
      return;
    }

    if (!materialTotalAmount || Number(materialTotalAmount) <= 0) {
      alert('Please enter quotation amount manually.');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        customerId: formData.customerId,
        leadName: formData.leadName,
        createdByName: formData.createdByName || user?.name || '',
        panelBrand: formData.panelBrand,
        panelWattage: Number(formData.panelWattage) || 0,
        panelTechnology: formData.panelTechnology || (Number(formData.panelWattage) > 600 ? 'Bifacial + TOPCon' : Number(formData.panelWattage) > 0 && Number(formData.panelWattage) < 600 ? 'Bifacial' : ''),
        subsidyDescription: formData.subsidyDescription,
        plantCapacity: `${formData.plantCapacity} KW`,
        customerCategory: formData.customerCategory,
        systemType: formData.systemType,
        batteryIncluded: formData.systemType !== 'ON_GRID',
        panelCount: parseInt(formData.panelCount, 10),
        subsidyAmount:
          formData.customerCategory === 'RESIDENTIAL' &&
          formData.systemType !== 'OFF_GRID'
            ? formData.subsidyAmount
            : '',
        materialTotalAmount: Number(materialTotalAmount) || 0,
        materialGstRate: Number(materialGstRate) || 0,
        gstType,
        gstMode,
        termsAndConditions,
        testimonials,
        cgstAmount: Number(summary.cgstAmount),
        sgstAmount: Number(summary.sgstAmount),
        igstAmount: Number(summary.igstAmount),

        selectedBomOption,
        bomOptions: [...bomOptions.filter(option => option.optionId !== selectedBomOption), { optionId: selectedBomOption || 'standard-bom', name: bomOptionName || 'Standard BOM', items: bomItems.map(item => ({ ...item })) }],
        bom: bomItems.map(({ srNo, itemDescription, qty, unit, brand }) => ({
          srNo,
          itemDescription,
          qty: Number(qty) || 0,
          unit,
          brand
        })),

        subTotal: parseFloat(summary.subTotal),
        gstAmount: parseFloat(summary.totalGst),
        grandTotal: parseFloat(summary.grandTotal),

        mainItem: {
          description: formData.mainItem.description,
          panelDetails: formData.mainItem.panelDetails,
          inverterDetails: formData.mainItem.inverterDetails,
          qty: formData.mainItem.qty,
          rate: Number(formData.mainItem.rate) || parseFloat(summary.subTotal),
          discount: Number(formData.mainItem.discount) || 0,
          totalAmountWithTax: parseFloat(summary.grandTotal)
        },

        date: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };

      await quotationService.create(payload);

      alert('Quotation created successfully!');
      navigate('/admin/quotations');
    } catch (err) {
      console.error('Create quotation error:', err);
      alert(
        err.response?.data?.message ||
        'Failed to create quotation'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <Loader text="Loading customers..." />;
  }

  return (
    <>
      <div className="create-quotation-page">
        <div className="page-top-bar">
          <button
            className="back-btn"
            onClick={() => navigate('/admin/quotations')}
          >
            <FiArrowLeft /> Back to Quotations
          </button>

          <Button
            variant="primary"
            icon={<FiSave />}
            type="submit"
            form="quotation-form"
            isLoading={isSaving}
          >
            Save Quotation
          </Button>
        </div>

        <form
          id="quotation-form"
          onSubmit={handleSubmit}
          className="quotation-form"
        >
          {/* CUSTOMER AND SYSTEM DETAILS */}
          <div className="form-card">
            <h3 className="section-title">
              1. Customer & System Details
            </h3>

            <div className="form-grid">
              <div className="customer-select-wrapper">
                <Select
                  label="Select Customer"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleInputChange}
                  options={[
                    { label: 'Select Customer', value: '' },
                    ...customers.map(c => ({
                      label: `${c.name} (${c.mobile})`,
                      value: c._id
                    }))
                  ]}
                  required
                />

                <button
                  type="button"
                  className="create-customer-btn"
                  onClick={() => setIsCustomerModalOpen(true)}
                  title="Create New Customer"
                >
                  + New
                </button>
              </div>

              <Input
                label="Lead Name (Cover Page)"
                name="leadName"
                value={formData.leadName}
                onChange={handleInputChange}
                placeholder="e.g. Mr. Sharma"
              />

              <Input
                label="Plant Capacity (KW) — Enter manually"
                name="plantCapacity"
                type="number"
                min="0.1"
                step="any"
                value={formData.plantCapacity}
                onChange={handleInputChange}
                placeholder="Enter capacity, e.g. 3"
                required
              />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>
                Customer Category
                <select
                  name="customerCategory"
                  value={formData.customerCategory}
                  onChange={handleInputChange}
                  style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}
                >
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>
                Solar System Type
                <select
                  name="systemType"
                  value={formData.systemType}
                  onChange={handleInputChange}
                  style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}
                >
                  <option value="ON_GRID">On-Grid (No Battery)</option>
                  <option value="OFF_GRID">Off-Grid (Battery)</option>
                  <option value="HYBRID">Hybrid (Grid + Battery)</option>
                </select>
              </label>

              <Input
                label="Number of Panels"
                name="panelCount"
                type="number"
                value={formData.panelCount}
                onChange={handleInputChange}
                placeholder="e.g. 5"
                required
              />
              <Input label="Quotation Heading / Item Description" value={formData.mainItem.description} onChange={e => setFormData(prev => ({ ...prev, mainItem: { ...prev.mainItem, description: e.target.value } }))} placeholder="Residential Solar Rooftop On-Grid Plant" />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>Solar Panel Brand<textarea rows={2} name="panelBrand" value={formData.panelBrand} onChange={handleInputChange} placeholder="Waaree / Premier / Adani" style={{ minHeight: 64, border: '1px solid #ddd', borderRadius: 8, padding: 10, font: 'inherit', resize: 'vertical' }} /></label>
              <Input label="Panel Wattage (W)" name="panelWattage" type="number" min="1" value={formData.panelWattage} onChange={(e) => { const watts = Number(e.target.value); setFormData(prev => ({ ...prev, panelWattage: e.target.value, panelTechnology: watts > 600 ? 'Bifacial + TOPCon' : watts > 0 && watts < 600 ? 'Bifacial' : '' })); }} placeholder="e.g. 620" />
              <Input label="Panel Technology (Auto)" name="panelTechnology" value={formData.panelTechnology} onChange={handleInputChange} placeholder="Auto based on wattage" />
              <Input label="Solar Inverter Brand" value={formData.mainItem.inverterDetails} onChange={e => setFormData(prev => ({ ...prev, mainItem: { ...prev.mainItem, inverterDetails: e.target.value } }))} placeholder="Enter inverter brand / model" />
            </div>

            <div className="form-grid" style={{ marginTop: 15 }}>
              <Input label="Created By (Editable)" name="createdByName" value={formData.createdByName} onChange={handleInputChange} placeholder={user?.name || 'Enter creator name'} />
              <Input
                label="Subsidy Amount"
                name="subsidyAmount"
                value={formData.subsidyAmount}
                onChange={handleInputChange}
                disabled={
                  formData.customerCategory !== 'RESIDENTIAL' ||
                  formData.systemType === 'OFF_GRID'
                }
                placeholder="Enter subsidy amount (e.g. ₹1,08,000)"
              />
              <Input label="Subsidy Description" name="subsidyDescription" value={formData.subsidyDescription} onChange={handleInputChange} placeholder="Subsidy will be credited to your bank account directly." />
            </div>
          </div>

          {/* BILL OF MATERIAL */}
          <div className="form-card">
            <div className="section-header-row">
              <h3 className="section-title">
                2. Bill of Material (BOM)
              </h3>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<FiPlus />}
                onClick={addBomItem}
              >
                Add Item
              </Button>
            </div>

            <div className="form-grid" style={{ marginBottom: 14 }}>
              <Input label="BOM Option Name" value={bomOptionName} onChange={e => setBomOptionName(e.target.value)} placeholder="e.g. Waaree 620W BOM" />
              <Button type="button" variant="secondary" size="sm" onClick={saveCurrentBomOption}>Save as BOM Option</Button>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                Load Saved BOM Option
                <select value={selectedBomOption} onChange={e => loadBomOption(e.target.value)} style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}>
                  <option value="standard-bom">Current BOM</option>
                  {bomOptions.map(option => <option key={option.optionId} value={option.optionId}>{option.name}</option>)}
                </select>
              </label>
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
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {bomItems.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          value={item.srNo}
                          onChange={e =>
                            handleBomChange(index, 'srNo', e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <textarea rows={2}
                          value={item.itemDescription}
                          onChange={e => handleBomChange(index, 'itemDescription', e.target.value)}
                          placeholder="Item name"
                          style={{ minWidth: 180, width: '100%', resize: 'vertical' }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.qty}
                          onChange={e =>
                            handleBomChange(index, 'qty', e.target.value)
                          }
                        />
                      </td>

                      <td>
                        <select
                          value={item.unit}
                          onChange={e =>
                            handleBomChange(index, 'unit', e.target.value)
                          }
                        >
                          {UNIT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <textarea rows={2}
                          value={item.brand}
                          onChange={e => handleBomChange(index, 'brand', e.target.value)}
                          placeholder="Brand (use Enter for next line)"
                          style={{ minWidth: 160, width: '100%', resize: 'vertical' }}
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          className="remove-btn"
                          onClick={() => removeBomItem(index)}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <datalist id="brand-list">
              {BRAND_OPTIONS.map(brand => (
                <option key={brand} value={brand} />
              ))}
            </datalist>

            <div className="form-grid" style={{ marginTop: 20, alignItems: 'end' }}>
              <Input
                label="Quotation Amount (₹)"
                name="materialTotalAmount"
                type="number"
                value={materialTotalAmount}
                onChange={e => setMaterialTotalAmount(e.target.value)}
                placeholder="Enter total amount"
                required
              />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>
                GST Type
                <select
                  value={gstType}
                  onChange={e => setGstType(e.target.value)}
                  style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}
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
                value={materialGstRate}
                onChange={e => setMaterialGstRate(e.target.value)}
                placeholder="Enter GST %, e.g. 8.5"
              />

              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>
                GST Calculation
                <select
                  value={gstMode}
                  onChange={e => setGstMode(e.target.value)}
                  style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}
                >
                  <option value="EXTRA">GST Extra</option>
                  <option value="INCLUDED">GST Included in Amount</option>
                </select>
              </label>
            </div>

            <div className="summary-wrapper">
              <div className="summary-box">
                <div className="summary-row">
                  <span>
                    {gstMode === 'INCLUDED' ? 'Taxable Amount:' : 'Amount:'}
                  </span>
                  <span>₹ {summary.subTotal}</span>
                </div>

                <div className="summary-row">
                  <span>GST ({materialGstRate || 0}%):</span>
                  <span>₹ {summary.totalGst}</span>
                </div>

                <div className="summary-row total">
                  <span>Grand Total:</span>
                  <span>₹ {summary.grandTotal}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WARRANTY TERMS */}
          <div className="form-card">
            <h3 className="section-title">3. Warranty Terms</h3>

            {[
              'panelWarranty',
              'inverterWarranty',
              ...(formData.systemType !== 'ON_GRID' ? ['batteryWarranty'] : []),
              'bosWarranty',
              'maintenanceWarranty',
              'warrantyNotes'
            ].map(key => (
              <label key={key} className="quotation-edit-field">
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                <textarea
                  rows="3"
                  value={termsAndConditions[key] || ''}
                  onChange={e =>
                    setTermsAndConditions(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                />
              </label>
            ))}
          </div>

          {/* TERMS AND CONDITIONS */}
          <div className="form-card">
            <h3 className="section-title">4. Terms & Conditions</h3>

            {[
              'generalTerms',
              'governmentSubsidy',
              'siteCompletionSchedule',
              'paymentTerms',
              'warrantyExclusions',
              'scopeOfWork'
            ].map(key => (
              <label key={key} className="quotation-edit-field">
                <span>{key.replace(/([A-Z])/g, ' $1')}</span>
                <textarea
                  rows="4"
                  value={termsAndConditions[key] || ''}
                  onChange={e =>
                    setTermsAndConditions(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))
                  }
                />
              </label>
            ))}
          </div>

          {/* TESTIMONIALS */}
          <div className="form-card">
            <h3 className="section-title">5. Testimonials</h3>

            {testimonials.map((item, index) => (
              <div key={index} className="testimonial-editor">
                <Input
                  label={`Customer ${index + 1}`}
                  value={item.name}
                  onChange={e =>
                    setTestimonials(prev =>
                      prev.map((t, i) =>
                        i === index ? { ...t, name: e.target.value } : t
                      )
                    )
                  }
                />

                <label>
                  Testimonial
                  <textarea
                    rows="3"
                    value={item.text}
                    onChange={e =>
                      setTestimonials(prev =>
                        prev.map((t, i) =>
                          i === index ? { ...t, text: e.target.value } : t
                        )
                      )
                    }
                  />
                </label>

                <button
                  type="button"
                  className="remove-btn"
                  onClick={() =>
                    setTestimonials(prev =>
                      prev.filter((_, i) => i !== index)
                    )
                  }
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}

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
          </div>

          {/* LIVE PREVIEW */}
          <div className="form-card quotation-live-preview">
            <h3 className="section-title">6. Live Quotation Preview</h3>

            <h4>Customer & System Details</h4>
            <p>
              Capacity: {formData.plantCapacity || '—'} KW |
              Category: {formData.customerCategory} |
              System: {formData.systemType.replace('_', '-')} |
              Panels: {formData.panelCount || '—'} |
              Lead: {formData.leadName || '—'}
            </p>

            <h4>Bill of Material</h4>
            <table className="bom-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Brand</th>
                </tr>
              </thead>
              <tbody>
                {bomItems.map((item, index) => (
                  <tr key={index}>
                    <td>{item.itemDescription}</td>
                    <td>{item.qty}</td>
                    <td>{item.unit}</td>
                    <td>{item.brand}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>Pricing</h4>
            <p>
              Amount: ₹{summary.enteredAmount || '0.00'} |
              GST: ₹{summary.totalGst} |
              Total: ₹{summary.grandTotal}
            </p>

            <h4>Warranty Terms</h4>
            {[
              'panelWarranty',
              'inverterWarranty',
              ...(formData.systemType !== 'ON_GRID' ? ['batteryWarranty'] : []),
              'bosWarranty',
              'maintenanceWarranty',
              'warrantyNotes'
            ].map(key => (
              <p key={key}>
                <strong>{key}:</strong> {termsAndConditions[key]}
              </p>
            ))}

            <h4>Terms & Conditions</h4>
            {[
              'generalTerms',
              'governmentSubsidy',
              'siteCompletionSchedule',
              'paymentTerms',
              'warrantyExclusions',
              'scopeOfWork'
            ].map(key => (
              <p key={key}>
                <strong>{key}:</strong> {termsAndConditions[key]}
              </p>
            ))}

            <h4>Contact / Closing Page</h4>
            <p>
              Company contact and thank-you page will be included in the downloaded quotation.
            </p>

            <h4>Testimonials</h4>
            {testimonials.map((item, index) => (
              <p key={index}>
                <strong>{item.name || 'Customer'}:</strong> {item.text}
              </p>
            ))}
          </div>
        </form>
      </div>

      <InlineCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </>
  );
};

export default CreateQuotation;
