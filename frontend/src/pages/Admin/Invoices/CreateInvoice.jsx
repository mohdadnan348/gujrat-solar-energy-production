import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi';
import Input from "../../../components/Common/Input";
import Select from '../../../components/Common/Select';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import InlineCustomerModal from '../../../components/Common/InlineCustomerModal';
import customerService from '../../../services/customerService';
import quotationService from '../../../services/quotationService';
import invoiceService from '../../../services/invoiceService';
import './CreateInvoice.css';

const today = new Date().toISOString().slice(0, 10);
const blankItem = () => ({ description: '', rate: 0, qty: 1, gstRate: 18 });
const money = (n) => Number((Number(n) || 0).toFixed(2));

const CreateInvoice = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ customerId: '', quotationId: '', invoiceDate: today, dueDate: today, placeOfSupply: '09- UTTAR PRADESH' });
  const [items, setItems] = useState([blankItem()]);

  useEffect(() => {
    let active = true;
    Promise.all([customerService.getAll(), quotationService.getAll()])
      .then(([customerData, quotationData]) => {
        if (!active) return;
        setCustomers(Array.isArray(customerData) ? customerData : []);
        setQuotations(Array.isArray(quotationData) ? quotationData : []);
      })
      .catch((err) => setError(err.response?.data?.message || 'Unable to load customers and quotations. Check API connection/permissions.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const selectedQuotation = useMemo(() => quotations.find(q => q._id === form.quotationId), [quotations, form.quotationId]);
  const calculations = useMemo(() => {
    const result = { taxableAmount: 0, totalTax: 0, grandTotal: 0, cgst_2_5: 0, sgst_2_5: 0, cgst_6: 0, sgst_6: 0, cgst_9: 0, sgst_9: 0, cgst_14: 0, sgst_14: 0 };
    items.forEach(item => {
      const base = (Number(item.rate) || 0) * (Number(item.qty) || 0);
      const gst = base * ((Number(item.gstRate) || 0) / 100);
      result.taxableAmount += base;
      result.totalTax += gst;
      const half = gst / 2;
      const rate = Number(item.gstRate) || 0;
      if (rate === 5) { result.cgst_2_5 += half; result.sgst_2_5 += half; }
      if (rate === 12) { result.cgst_6 += half; result.sgst_6 += half; }
      if (rate === 18) { result.cgst_9 += half; result.sgst_9 += half; }
      if (rate === 28) { result.cgst_14 += half; result.sgst_14 += half; }
    });
    Object.keys(result).forEach(k => { result[k] = money(result[k]); });
    result.grandTotal = money(result.taxableAmount + result.totalTax);
    return result;
  }, [items]);

  const onCustomerCreated = (customer) => {
    setCustomers(prev => [customer, ...prev.filter(c => c._id !== customer._id)]);
    setForm(prev => ({ ...prev, customerId: customer._id, quotationId: '' }));
    setCustomerModalOpen(false);
  };

  const updateItem = (index, field, value) => setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  const onQuotationChange = (e) => {
    const quotationId = e.target.value;
    const quotation = quotations.find(q => q._id === quotationId);
    if (!quotation) {
      setForm(prev => ({ ...prev, quotationId: '' }));
      return;
    }
    const customerId = quotation.customer?._id || quotation.customer;
    const quoteItems = (quotation.bom || []).map(item => ({
      description: item.itemDescription,
      rate: Number(item.rate) || 0,
      qty: Number(item.qty) || 0,
      gstRate: Number(item.gstRate) || 0,
    })).filter(item => item.description);
    const fallback = quotation.mainItem ? [{
      description: quotation.mainItem.description || 'Solar Plant',
      rate: Number(quotation.mainItem.rate) || Number(quotation.subTotal) || 0,
      qty: 1,
      gstRate: 0,
    }] : [];
    setForm(prev => ({ ...prev, quotationId, customerId: customerId || prev.customerId }));
    setItems(quoteItems.length ? quoteItems : (fallback.length ? fallback : [blankItem()]));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customerId) return setError('Please select or create a customer.');
    if (!items.length || items.some(i => !i.description.trim() || Number(i.qty) <= 0 || Number(i.rate) < 0)) return setError('Enter a description, valid quantity and rate for every item.');
    setSaving(true);
    try {
      const payload = {
        customerId: form.customerId,
        ...(form.quotationId ? { quotationId: form.quotationId } : {}),
        invoiceDate: form.invoiceDate,
        dueDate: form.dueDate,
        placeOfSupply: form.placeOfSupply,
        items: items.map(item => {
          const rate = Number(item.rate) || 0;
          const qty = Number(item.qty) || 0;
          const taxableValue = money(rate * qty);
          const taxAmount = money(taxableValue * ((Number(item.gstRate) || 0) / 100));
          return { description: item.description.trim(), rate, qty, gstRate: Number(item.gstRate) || 0, taxableValue, taxAmount, amount: money(taxableValue + taxAmount) };
        }),
        ...calculations,
      };
      await invoiceService.create(payload);
      navigate('/admin/invoices');
    } catch (err) {
      setError(err.response?.data?.message || 'Invoice could not be created.');
    } finally { setSaving(false); }
  };

  if (loading) return <Loader text="Loading customers and quotations..." />;
  const customerOptions = [{ label: 'Select Customer', value: '' }, ...customers.map(c => ({ label: `${c.name || 'Unnamed'} (${c.mobile || c.phone || 'No phone'})`, value: c._id }))];
  const quotationOptions = [{ label: 'No Quotation — Create Standalone Invoice', value: '' }, ...quotations.filter(q => !form.customerId || (q.customer?._id || q.customer) === form.customerId).map(q => ({ label: `${q.estimateNo || 'Quotation'} — ${q.customer?.name || customers.find(c => c._id === (q.customer?._id || q.customer))?.name || 'Customer'}${q.status ? ` [${q.status}]` : ''}`, value: q._id }))];

  return <>
    <div className="create-invoice-page">
      <div className="page-top-bar">
        <button className="back-btn" type="button" onClick={() => navigate('/admin/invoices')}><FiArrowLeft /> Back to Invoices</button>
        <Button variant="primary" icon={<FiSave />} type="submit" form="invoice-form" isLoading={saving}>Save Invoice</Button>
      </div>
      <form id="invoice-form" className="invoice-form" onSubmit={handleSubmit}>
        {error && <div role="alert" style={{ color: '#c53030', background: '#fff5f5', padding: 12, borderRadius: 8 }}>{error}</div>}
        <section className="form-card">
          <h3 className="section-title">1. Customer & Invoice Details</h3>
          <div className="form-grid">
            <div>
              <Select label="Select Customer" name="customerId" value={form.customerId} onChange={e => setForm(prev => ({ ...prev, customerId: e.target.value, quotationId: '' }))} options={customerOptions} required />
              <button type="button" className="create-customer-btn" style={{ marginTop: 8 }} onClick={() => setCustomerModalOpen(true)}>+ New Customer</button>
            </div>
            <Select label="Link Quotation (Optional)" name="quotationId" value={form.quotationId} onChange={onQuotationChange} options={quotationOptions} />
            <Input label="Invoice Date" name="invoiceDate" type="date" value={form.invoiceDate} onChange={e => setForm(prev => ({ ...prev, invoiceDate: e.target.value }))} required />
            <Input label="Due Date" name="dueDate" type="date" value={form.dueDate} onChange={e => setForm(prev => ({ ...prev, dueDate: e.target.value }))} required />
            <Input label="Place of Supply" name="placeOfSupply" value={form.placeOfSupply} onChange={e => setForm(prev => ({ ...prev, placeOfSupply: e.target.value }))} />
          </div>
          {selectedQuotation && <p style={{ color: '#276749', marginTop: 12 }}>Linked to {selectedQuotation.estimateNo}. Items have been loaded from this quotation. You can still edit them before saving.</p>}
        </section>
        <section className="form-card">
          <div className="section-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="section-title">2. Items & Pricing</h3>
            <Button type="button" variant="secondary" size="sm" icon={<FiPlus />} onClick={() => setItems(prev => [...prev, blankItem()])}>Add Item</Button>
          </div>
          {items.map((item, index) => <div className="form-grid" key={index} style={{ alignItems: 'end', borderBottom: '1px solid #edf2f7', paddingBottom: 14, marginBottom: 14 }}>
            <Input label="Item Description" value={item.description} onChange={e => updateItem(index, 'description', e.target.value)} required />
            <Input label="Rate (₹)" type="number" min="0" value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} required />
            <Input label="Quantity" type="number" min="0.01" step="any" value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} required />
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: '#2d3748' }}>GST Rate<select value={item.gstRate} onChange={e => updateItem(index, 'gstRate', e.target.value)} style={{ minHeight: 44, border: '1px solid #ddd', borderRadius: 8, padding: '0 12px' }}>{[0, 5, 12, 18, 28].map(v => <option key={v} value={v}>{v}%</option>)}</select></label>
            <div style={{ alignSelf: 'center', fontSize: 13, color: '#4a5568' }}>Line total: ₹{money((Number(item.rate) || 0) * (Number(item.qty) || 0) * (1 + (Number(item.gstRate) || 0) / 100)).toLocaleString('en-IN')}</div>
            <button type="button" className="remove-btn" title="Remove item" disabled={items.length === 1} onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}><FiTrash2 /></button>
          </div>)}
          <div className="summary-box">
            <div className="summary-row"><span>Taxable Amount:</span><span>₹ {calculations.taxableAmount.toLocaleString('en-IN')}</span></div>
            <div className="summary-row"><span>Total GST:</span><span>₹ {calculations.totalTax.toLocaleString('en-IN')}</span></div>
            <div className="summary-row total"><span>Grand Total:</span><span>₹ {calculations.grandTotal.toLocaleString('en-IN')}</span></div>
          </div>
        </section>
      </form>
    </div>
    <InlineCustomerModal isOpen={customerModalOpen} onClose={() => setCustomerModalOpen(false)} onCustomerCreated={onCustomerCreated} />
  </>;
};
export default CreateInvoice;
