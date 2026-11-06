import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft, FiPlus, FiTrash2 } from 'react-icons/fi';
import Input from '../../../components/Common/Input';
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import InlineCustomerModal from '../../../components/Common/InlineCustomerModal';
import customerService from '../../../services/customerService';
import quotationService from '../../../services/quotationService';
import './CreateQuotation.css';

// --- MASTER LISTS ---
const UNIT_OPTIONS = [
  { label: 'Set', value: 'Set' }, { label: 'Nos', value: 'Nos' }, { label: 'Mtr', value: 'Mtr' },
  { label: 'Sq.Ft', value: 'Sq.Ft' }, { label: 'kW', value: 'kW' }, { label: 'kWh', value: 'kWh' },
  { label: 'Ltr', value: 'Ltr' }, { label: 'Job', value: 'Job' }, { label: 'Lot', value: 'Lot' }, { label: 'Pkt', value: 'Pkt' }
];

const BRAND_OPTIONS = [
  'Adani', 'Waaree', 'TATA', 'Sanora', 'Satvik', 'ORB', 'Loom', 'Vikram Solar',
  'Polycab', 'Qbits', 'Havells', 'Envergy', 'Sungrow', 'Growatt', 'Luminous',
  'Appolo', 'JSW', 'Schneider', 'L&T', 'ELMEX', 'Sibass', 'Finolex', 'Apar',
  'Jenflex', 'HPI', 'RR Kabel', 'Standard', 'SS304', 'PVC', 'Copper',
  'Aluminium', 'MCB', 'SPD', 'DCBB', 'ACDB'
];

const GST_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '12%', value: 12 },
  { label: '18%', value: 18 },
  { label: '28%', value: 28 },
];

const CreateQuotation = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    leadName: '',
    plantCapacity: '',
    panelCount: 5,
    subsidyAmount: '',
    mainItem: {
      description: 'Custom BOM Based Quotation',
      panelDetails: '',
      inverterDetails: '',
      qty: 'Custom',
      rate: 0,
      discount: 0,
    },
  });

  // BOM contains material details only; quotation pricing is entered once below.
  // Default solar BOM from the supplied material sheet. Item description and brand are editable.
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

  // Summary
  const [materialTotalAmount, setMaterialTotalAmount] = useState('');
  const [materialGstRate, setMaterialGstRate] = useState(5);
  const [gstType, setGstType] = useState('CGST_SGST');
  const [summary, setSummary] = useState({ subTotal: 0, totalGst: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, grandTotal: 0 });

  // Fetch Customers
  const fetchCustomers = async () => {
    try {
      const data = await customerService.getAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // One combined material amount and one GST rate for the whole quotation.
  useEffect(() => {
    const subTotal = Number(materialTotalAmount) || 0;
    const totalGst = gstType === 'NONE' ? 0 : subTotal * (Number(materialGstRate) || 0) / 100;
    const cgstAmount = gstType === 'CGST_SGST' ? totalGst / 2 : 0;
    const sgstAmount = gstType === 'CGST_SGST' ? totalGst / 2 : 0;
    const igstAmount = gstType === 'IGST' ? totalGst : 0;
    setSummary({ subTotal: subTotal.toFixed(2), totalGst: totalGst.toFixed(2), cgstAmount: cgstAmount.toFixed(2), sgstAmount: sgstAmount.toFixed(2), igstAmount: igstAmount.toFixed(2), grandTotal: (subTotal + totalGst).toFixed(2) });
  }, [materialTotalAmount, materialGstRate, gstType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Default quotation amount: ₹60,000 per kW. The amount field remains editable,
    // so the user can override this suggested total whenever required.
    if (name === 'plantCapacity') {
      const capacity = Number.parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
      setMaterialTotalAmount(capacity > 0 ? String(Math.round(capacity * 60000)) : '');
    }
  };

  const handleMainItemChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      mainItem: {
        ...prev.mainItem,
        [name]: value,
      },
    }));
  };

  const handleBomChange = (index, field, value) => {
    setBomItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      { srNo: (bomItems.length + 1).toString(), itemDescription: '', qty: 1, unit: 'Nos', brand: '' }
    ]);
  };

  const removeBomItem = (index) => {
    setBomItems(bomItems.filter((_, i) => i !== index));
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers([newCustomer, ...customers]);
    setFormData({ ...formData, customerId: newCustomer._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerId) {
      alert('Please select a customer');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        customerId: formData.customerId,
        leadName: formData.leadName,
        plantCapacity: formData.plantCapacity,
        panelCount: parseInt(formData.panelCount),
        subsidyAmount: formData.subsidyAmount,
        materialTotalAmount: Number(materialTotalAmount) || 0,
        materialGstRate: Number(materialGstRate),
        gstType,
        cgstAmount: Number(summary.cgstAmount),
        sgstAmount: Number(summary.sgstAmount),
        igstAmount: Number(summary.igstAmount),
        bom: bomItems.map(({ srNo, itemDescription, qty, unit, brand }) => ({ srNo, itemDescription, qty: Number(qty) || 0, unit, brand })),
        subTotal: parseFloat(summary.subTotal),
        gstAmount: parseFloat(summary.totalGst),
        grandTotal: parseFloat(summary.grandTotal),
        mainItem: {
          description: formData.mainItem.description,
          panelDetails: formData.mainItem.panelDetails,
          inverterDetails: formData.mainItem.inverterDetails,
          qty: formData.mainItem.qty,
          // Keep the existing BOM subtotal as the fallback when Rate is left blank/zero.
          rate: Number(formData.mainItem.rate) || parseFloat(summary.subTotal),
          discount: Number(formData.mainItem.discount) || 0,
          // BOM summary remains the source of truth for the quotation total.
          totalAmountWithTax: parseFloat(summary.grandTotal),
        },
        date: new Date(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      await quotationService.create(payload);
      alert('Quotation created successfully!');
      navigate('/admin/quotations');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create quotation');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader text="Loading customers..." />;

  return (
    <>
      <div className="create-quotation-page">
        <div className="page-top-bar">
          <button className="back-btn" onClick={() => navigate('/admin/quotations')}>
            <FiArrowLeft /> Back to Quotations
          </button>
          <Button variant="primary" icon={<FiSave />} type="submit" form="quotation-form" isLoading={isSaving}>
            Save Quotation
          </Button>
        </div>

        <form id="quotation-form" onSubmit={handleSubmit} className="quotation-form">
          
          {/* Section 1: Customer & System Details */}
          <div className="form-card">
            <h3 className="section-title">1. Customer & System Details</h3>
            <div className="form-grid">
              <div className="customer-select-wrapper">
                <Select 
                  label="Select Customer" 
                  name="customerId" 
                  value={formData.customerId} 
                  onChange={handleInputChange}
                  options={[
                    { label: 'Select Customer', value: '' },
                    ...customers.map(c => ({ label: `${c.name} (${c.mobile})`, value: c._id }))
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
              
              <Input label="Lead Name (Cover Page)" name="leadName" value={formData.leadName} onChange={handleInputChange} placeholder="e.g. Mr. Sharma" />
              
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>Plant Capacity<select name="plantCapacity" value={formData.plantCapacity} onChange={handleInputChange} required style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}><option value="">Select Solar Capacity</option>{Array.from({ length: 20 }, (_, index) => index + 1).map(kw => <option key={kw} value={`${kw} KW`}>{kw} KW — ₹{(kw * 60000).toLocaleString('en-IN')}</option>)}</select></label>
              <Input label="Number of Panels" name="panelCount" type="number" value={formData.panelCount} onChange={handleInputChange} placeholder="e.g. 5" required />
            </div>
            <div className="form-grid" style={{ marginTop: '15px' }}>
              <Input label="Subsidy Note" name="subsidyAmount" value={formData.subsidyAmount} onChange={handleInputChange} placeholder="e.g. 108,000 Subsidy will be credited..." />
            </div>
          </div>

          {/* Section 3: BOM material list and one combined amount */}
          <div className="form-card">
            <div className="section-header-row">
              <h3 className="section-title">2. Bill of Material (BOM)</h3>
              <Button type="button" variant="secondary" size="sm" icon={<FiPlus />} onClick={addBomItem}>Add Item</Button>
            </div>
            <div className="bom-table-container">
              <table className="bom-table">
                <thead><tr><th>Sr No.</th><th>Item Description</th><th>Qty</th><th>Unit</th><th>Brand</th><th></th></tr></thead>
                <tbody>{bomItems.map((item, index) => <tr key={index}>
                  <td><input value={item.srNo} onChange={e => handleBomChange(index, 'srNo', e.target.value)} /></td>
                  <td><input value={item.itemDescription} onChange={e => handleBomChange(index, 'itemDescription', e.target.value)} placeholder="Item name" /></td>
                  <td><input type="number" min="0" step="any" value={item.qty} onChange={e => handleBomChange(index, 'qty', e.target.value)} /></td>
                  <td><select value={item.unit} onChange={e => handleBomChange(index, 'unit', e.target.value)}>{UNIT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></td>
                  <td><input type="text" list="brand-list" value={item.brand} onChange={e => handleBomChange(index, 'brand', e.target.value)} placeholder="Brand" /></td>
                  <td><button type="button" className="remove-btn" onClick={() => removeBomItem(index)}><FiTrash2 /></button></td>
                </tr>)}</tbody>
              </table>
            </div>
            <datalist id="brand-list">{BRAND_OPTIONS.map(brand => <option key={brand} value={brand} />)}</datalist>
            <div className="form-grid" style={{ marginTop: 20, alignItems: 'end' }}>
              <Input label="Total Material Amount (₹) — All Materials Combined" name="materialTotalAmount" type="number" value={materialTotalAmount} onChange={e => setMaterialTotalAmount(e.target.value)} placeholder="Auto-calculated at ₹60,000 per kW; you can edit this amount" required />
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>GST Type<select value={gstType} onChange={e => setGstType(e.target.value)} style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}><option value="CGST_SGST">CGST + SGST</option><option value="IGST">IGST</option><option value="NONE">No GST</option></select></label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>GST Rate<select value={materialGstRate} onChange={e => setMaterialGstRate(Number(e.target.value))} disabled={gstType === 'NONE'} style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}>{GST_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}</select></label>
            </div>
            <div className="summary-wrapper"><div className="summary-box">
              <div className="summary-row"><span>Total Material Amount:</span><span>₹ {summary.subTotal}</span></div>
              {gstType === 'CGST_SGST' ? <><div className="summary-row"><span>CGST ({materialGstRate / 2}%):</span><span>₹ {summary.cgstAmount}</span></div><div className="summary-row"><span>SGST ({materialGstRate / 2}%):</span><span>₹ {summary.sgstAmount}</span></div></> : gstType === 'IGST' ? <div className="summary-row"><span>IGST ({materialGstRate}%):</span><span>₹ {summary.igstAmount}</span></div> : <div className="summary-row"><span>GST:</span><span>₹ 0.00</span></div>}
              <div className="summary-row total"><span>Grand Total:</span><span>₹ {summary.grandTotal}</span></div>
            </div></div>
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