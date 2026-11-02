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

  // BOM State (Ab har item ka apna GST hai)
  const [bomItems, setBomItems] = useState([
    { srNo: '1', itemDescription: 'Solar Panels (PV Modules)', qty: 1, unit: 'Set', rate: 0, gstRate: 5, gstAmount: 0, total: 0, brand: '' },
    { srNo: '2', itemDescription: 'Solar String Inverter', qty: 1, unit: 'Nos', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: '' },
  ]);

  // Summary
  const [summary, setSummary] = useState({ subTotal: 0, totalGst: 0, grandTotal: 0 });

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

  // Auto-Calculate (Har item ka GST alag + Grand Total)
  useEffect(() => {
    let subTotal = 0;
    let totalGst = 0;

    bomItems.forEach(item => {
      const qty = parseFloat(item.qty) || 0;
      const rate = parseFloat(item.rate) || 0;
      const gstPercent = parseFloat(item.gstRate) || 0;
      
      const itemTotal = qty * rate; // Bina GST ka total
      const itemGst = itemTotal * (gstPercent / 100);
      
      subTotal += itemTotal;
      totalGst += itemGst;
    });

    setSummary({
      subTotal: subTotal.toFixed(2),
      totalGst: totalGst.toFixed(2),
      grandTotal: (subTotal + totalGst).toFixed(2),
    });
  }, [bomItems]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
    const updatedBom = [...bomItems];
    updatedBom[index][field] = value;

    // Agar Qty, Rate, ya GST change hua, toh us item ka total recalculate karo
    if (['qty', 'rate', 'gstRate'].includes(field)) {
      const qty = parseFloat(updatedBom[index].qty) || 0;
      const rate = parseFloat(updatedBom[index].rate) || 0;
      const gstPercent = parseFloat(updatedBom[index].gstRate) || 0;
      
      const baseTotal = qty * rate;
      const gstAmount = baseTotal * (gstPercent / 100);
      
      updatedBom[index].total = (baseTotal + gstAmount).toFixed(2);
    }

    setBomItems(updatedBom);
  };

  const addBomItem = () => {
    setBomItems([
      ...bomItems,
      { srNo: (bomItems.length + 1).toString(), itemDescription: '', qty: 1, unit: 'Nos', rate: 0, gstRate: 18, gstAmount: 0, total: 0, brand: '' }
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
        bom: bomItems,
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
              
              <Input label="Plant Capacity" name="plantCapacity" value={formData.plantCapacity} onChange={handleInputChange} placeholder="e.g. 3 KW" required />
              <Input label="Number of Panels" name="panelCount" type="number" value={formData.panelCount} onChange={handleInputChange} placeholder="e.g. 5" required />
            </div>
            <div className="form-grid" style={{ marginTop: '15px' }}>
              <Input label="Subsidy Note" name="subsidyAmount" value={formData.subsidyAmount} onChange={handleInputChange} placeholder="e.g. 108,000 Subsidy will be credited..." />
            </div>
          </div>

          {/* Section 2: Pricing Details */}
          <div className="form-card">
            <h3 className="section-title">2. Pricing Details</h3>

            <div className="form-grid">
              <Input
                label="Description"
                name="description"
                value={formData.mainItem.description}
                onChange={handleMainItemChange}
                placeholder="e.g. Custom BOM Based Quotation"
              />

              <Input
                label="Panel Brand"
                name="panelDetails"
                value={formData.mainItem.panelDetails}
                onChange={handleMainItemChange}
                placeholder="Enter panel brand"
              />

              <Input
                label="Inverter Brand"
                name="inverterDetails"
                value={formData.mainItem.inverterDetails}
                onChange={handleMainItemChange}
                placeholder="Enter inverter brand"
              />

              <Input
                label="Quantity"
                name="qty"
                value={formData.mainItem.qty}
                onChange={handleMainItemChange}
                placeholder="e.g. Custom"
              />

              <Input
                label="Rate (₹)"
                name="rate"
                type="number"
                value={formData.mainItem.rate}
                onChange={handleMainItemChange}
                placeholder={summary.subTotal}
              />

              <Input
                label="Discount (₹)"
                name="discount"
                type="number"
                value={formData.mainItem.discount}
                onChange={handleMainItemChange}
                placeholder="0"
              />
            </div>
          </div>

          {/* Section 3: BOM Table with per-item GST */}
          <div className="form-card">
            <div className="section-header-row">
              <h3 className="section-title">2. Bill of Material (BOM) & Pricing</h3>
              <Button type="button" variant="secondary" size="sm" icon={<FiPlus />} onClick={addBomItem}>
                Add Item
              </Button>
            </div>
            
            <div className="bom-table-container">
              <table className="bom-table">
                <thead>
                  <tr>
                    <th width="5%">Sr No.</th>
                    <th width="22%">Item Description</th>
                    <th width="6%">Qty</th>
                    <th width="10%">Unit</th>
                    <th width="10%">Rate (₹)</th>
                    <th width="8%">GST %</th>
                    <th width="10%">GST (₹)</th>
                    <th width="12%">Total (₹)</th>
                    <th width="12%">Brand</th>
                    <th width="5%"></th>
                  </tr>
                </thead>
                <tbody>
                  {bomItems.map((item, index) => {
                    // Har row ke liye GST aur Total alag calculate hoga
                    const qty = parseFloat(item.qty) || 0;
                    const rate = parseFloat(item.rate) || 0;
                    const gstPercent = parseFloat(item.gstRate) || 0;
                    const itemBase = qty * rate;
                    const itemGst = itemBase * (gstPercent / 100);
                    const itemTotal = itemBase + itemGst;

                    return (
                      <tr key={index}>
                        <td><input type="text" value={item.srNo} onChange={(e) => handleBomChange(index, 'srNo', e.target.value)} /></td>
                        <td><input type="text" value={item.itemDescription} onChange={(e) => handleBomChange(index, 'itemDescription', e.target.value)} placeholder="Item name" /></td>
                        <td><input type="number" value={item.qty} onChange={(e) => handleBomChange(index, 'qty', e.target.value)} /></td>
                        <td>
                          <div className="custom-select-wrapper">
                            <select value={item.unit} onChange={(e) => handleBomChange(index, 'unit', e.target.value)}>
                              {UNIT_OPTIONS.map(opt => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                            </select>
                          </div>
                        </td>
                        <td><input type="number" value={item.rate} onChange={(e) => handleBomChange(index, 'rate', e.target.value)} placeholder="0" /></td>
                        
                        {/* GST Per Item Dropdown */}
                        <td>
                          <div className="custom-select-wrapper">
                            <select 
                              value={item.gstRate} 
                              onChange={(e) => handleBomChange(index, 'gstRate', e.target.value)}
                              className="gst-select"
                            >
                              {GST_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        
                        {/* GST Amount (Readonly) */}
                        <td><input type="text" value={itemGst.toFixed(2)} readOnly className="readonly-input" /></td>
                        
                        {/* Total with GST (Readonly) */}
                        <td><input type="text" value={itemTotal.toFixed(2)} readOnly className="readonly-input total-input" /></td>
                        
                        <td>
                          <input 
                            type="text" 
                            list="brand-list" 
                            value={item.brand} 
                            onChange={(e) => handleBomChange(index, 'brand', e.target.value)} 
                            placeholder="Type to search..."
                            className="brand-input"
                          />
                        </td>
                        <td>
                          <button type="button" className="remove-btn" onClick={() => removeBomItem(index)}>
                            <FiTrash2 />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <datalist id="brand-list">
              {BRAND_OPTIONS.map(brand => (<option key={brand} value={brand} />))}
            </datalist>

            {/* Summary Section (Only SubTotal + Total GST + Grand Total) */}
            <div className="summary-wrapper">
              <div className="summary-box">
                <div className="summary-row">
                  <span>Sub Total:</span>
                  <span>₹ {summary.subTotal}</span>
                </div>
                <div className="summary-row">
                  <span>Total GST:</span>
                  <span>₹ {summary.totalGst}</span>
                </div>
                <div className="summary-row total">
                  <span>Grand Total:</span>
                  <span>₹ {summary.grandTotal}</span>
                </div>
              </div>
            </div>
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