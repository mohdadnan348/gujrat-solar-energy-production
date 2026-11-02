import { useState, useEffect } from 'react';
import { FiSave, FiImage, FiBriefcase, FiFileText } from 'react-icons/fi';
import Input from '../../../components/Common/Input';
import Button from '../../../components/Common/Button';
import Loader from '../../../components/Common/Loader';
import settingsService from '../../../services/settingsService';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('company');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [companyData, setCompanyData] = useState({
    companyName: '',
    ownerName: '', // <-- NAYA FIELD
    gstin: '',
    address: '',
    mobile: '',
    email: '',
    website: '',
  });

  const [bankData, setBankData] = useState({
    bankName: '',
    accountName: '',
    accountNo: '',
    ifsc: '',
    branch: '',
  });

  const [termsData, setTermsData] = useState({
    generalTerms: '',
    governmentSubsidy: '',
    warrantyDetails: '',
    siteCompletionSchedule: '',
    paymentTerms: '',
    warrantyExclusions: '',
    scopeOfWork: '',
  });

  // Fetch settings on load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setCompanyData({
          companyName: data.companyName || '',
          ownerName: data.ownerName || '', // <-- Load karo
          gstin: data.gstin || '',
          address: data.address || '',
          mobile: data.mobile || '',
          email: data.email || '',
          website: data.website || '',
        });
        setBankData({
          bankName: data.bankDetails?.bankName || '',
          accountName: data.bankDetails?.accountName || '',
          accountNo: data.bankDetails?.accountNo || '',
          ifsc: data.bankDetails?.ifsc || '',
          branch: data.bankDetails?.branch || '',
        });
        setTermsData({
          generalTerms: data.terms?.generalTerms || '',
          governmentSubsidy: data.terms?.governmentSubsidy || '',
          warrantyDetails: data.terms?.warrantyDetails || '',
          siteCompletionSchedule: data.terms?.siteCompletionSchedule || '',
          paymentTerms: data.terms?.paymentTerms || '',
          warrantyExclusions: data.terms?.warrantyExclusions || '',
          scopeOfWork: data.terms?.scopeOfWork || '',
        });
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      const payload = {
        ...companyData,
        bankDetails: bankData,
        terms: termsData,
      };
      const saved = await settingsService.updateSettings(payload);
      // Re-hydrate the form from the API response so the UI reflects persisted values.
      const data = saved || await settingsService.getSettings();
      setCompanyData({
        companyName: data.companyName || '',
        ownerName: data.ownerName || '',
        gstin: data.gstin || '',
        address: data.address || '',
        mobile: data.mobile || '',
        email: data.email || '',
        website: data.website || '',
      });
      setBankData({
        bankName: data.bankDetails?.bankName || '',
        accountName: data.bankDetails?.accountName || '',
        accountNo: data.bankDetails?.accountNo || '',
        ifsc: data.bankDetails?.ifsc || '',
        branch: data.bankDetails?.branch || '',
      });
      setTermsData({
        generalTerms: data.terms?.generalTerms || '',
        governmentSubsidy: data.terms?.governmentSubsidy || '',
        warrantyDetails: data.terms?.warrantyDetails || '',
        siteCompletionSchedule: data.terms?.siteCompletionSchedule || '',
        paymentTerms: data.terms?.paymentTerms || '',
        warrantyExclusions: data.terms?.warrantyExclusions || '',
        scopeOfWork: data.terms?.scopeOfWork || '',
      });
      alert('Settings saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <Loader text="Loading settings..." />;

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure your company details and PDF preferences</p>
        </div>
        <Button variant="primary" icon={<FiSave />} onClick={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="settings-container">
        {/* Sidebar Tabs */}
        <div className="settings-sidebar">
          <button className={`tab-btn ${activeTab === 'company' ? 'active' : ''}`} onClick={() => setActiveTab('company')}>
            <FiBriefcase /> Company Profile
          </button>
          <button className={`tab-btn ${activeTab === 'bank' ? 'active' : ''}`} onClick={() => setActiveTab('bank')}>
            <FiFileText /> Bank Details
          </button>
          <button className={`tab-btn ${activeTab === 'terms' ? 'active' : ''}`} onClick={() => setActiveTab('terms')}>
            <FiImage /> PDF Terms
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content">
          {activeTab === 'company' && (
            <div className="settings-section">
              <h3>Company Profile</h3>
              <div className="form-grid">
                <Input label="Company Name" value={companyData.companyName} onChange={(e) => setCompanyData({...companyData, companyName: e.target.value})} />
                <Input label="Owner Name (Authorized Signatory)" value={companyData.ownerName} onChange={(e) => setCompanyData({...companyData, ownerName: e.target.value})} />
              </div>
              <div className="form-grid">
                <Input label="GSTIN" value={companyData.gstin} onChange={(e) => setCompanyData({...companyData, gstin: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-textarea" value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-grid">
                <Input label="Mobile" value={companyData.mobile} onChange={(e) => setCompanyData({...companyData, mobile: e.target.value})} />
                <Input label="Email" value={companyData.email} onChange={(e) => setCompanyData({...companyData, email: e.target.value})} />
              </div>
              <Input label="Website" value={companyData.website} onChange={(e) => setCompanyData({...companyData, website: e.target.value})} />
            </div>
          )}

          {activeTab === 'bank' && (
            <div className="settings-section">
              <h3>Bank Details (For Invoice)</h3>
              <div className="form-grid">
                <Input label="Bank Name" value={bankData.bankName} onChange={(e) => setBankData({...bankData, bankName: e.target.value})} />
                <Input label="Account Name" value={bankData.accountName} onChange={(e) => setBankData({...bankData, accountName: e.target.value})} />
              </div>
              <div className="form-grid">
                <Input label="Account Number" value={bankData.accountNo} onChange={(e) => setBankData({...bankData, accountNo: e.target.value})} />
                <Input label="IFSC Code" value={bankData.ifsc} onChange={(e) => setBankData({...bankData, ifsc: e.target.value})} />
              </div>
              <Input label="Branch" value={bankData.branch} onChange={(e) => setBankData({...bankData, branch: e.target.value})} />
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="settings-section">
              <h3>PDF Terms & Conditions</h3>
              <div className="form-group">
                <label className="form-label">General Terms</label>
                <textarea className="form-textarea" value={termsData.generalTerms} onChange={(e) => setTermsData({...termsData, generalTerms: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Government Subsidy</label>
                <textarea className="form-textarea" value={termsData.governmentSubsidy} onChange={(e) => setTermsData({...termsData, governmentSubsidy: e.target.value})} rows="2"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Warranty Details</label>
                <textarea className="form-textarea" value={termsData.warrantyDetails} onChange={(e) => setTermsData({...termsData, warrantyDetails: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Site Completion Schedule</label>
                <textarea className="form-textarea" value={termsData.siteCompletionSchedule} onChange={(e) => setTermsData({...termsData, siteCompletionSchedule: e.target.value})} rows="2"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Payment Terms</label>
                <textarea className="form-textarea" value={termsData.paymentTerms} onChange={(e) => setTermsData({...termsData, paymentTerms: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Warranty Exclusions</label>
                <textarea className="form-textarea" value={termsData.warrantyExclusions} onChange={(e) => setTermsData({...termsData, warrantyExclusions: e.target.value})} rows="3"></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Scope of Work</label>
                <textarea className="form-textarea" value={termsData.scopeOfWork} onChange={(e) => setTermsData({...termsData, scopeOfWork: e.target.value})} rows="3"></textarea>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;