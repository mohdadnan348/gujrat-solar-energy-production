const mongoose = require('mongoose');
const env = require('../config/env');
const Settings = require('../models/Settings');

mongoose.connect(env.MONGO_URI).then(async () => {
  try {
    // Check if settings already exist
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = new Settings();
    }

    // Company Profile
    settings.companyName = 'GUJRAT SOLAR ENERGY';
    settings.ownerName = 'Siddiqui Wasim'; // <-- NAYA FIELD
    settings.gstin = '09GBQPS0127B1ZL';
    settings.address = 'HEAD OFFICE ADD., 83/161-3, PARAMPURWA, JUHI, Juhi Colony Sub Post Office, Juhi Depo kanpur nagar 208014 MAIN BRANCH, 131/370 A2 begam purwa near baba market kanpur nagar 208023 AZAMGAGH BRANCH, gaordeeh aaima near petrol pump chhatwara sidhari road, Kanpur Uttar Pradesh, 208014 India';
    settings.mobile = '+918401187313';
    settings.email = 'Wasimdanish0311@gmail.com';
    settings.website = 'www.gujratsolarenergy.com';

    // Bank Details
    settings.bankDetails = {
      bankName: 'PUNJAB AND SIND BANK',
      accountName: 'GUJRAT SOLAR ENERGY',
      accountNo: '06241100006312',
      ifsc: 'PSIB0000624',
      branch: 'HARJINDER NAGAR KANPUR'
    };

    // Terms & Conditions (From your PDF EST-00215)
    settings.terms = {
      generalTerms: 'Material dispatch and Installation shall be started upon DISCOM approval only. For better performance, solar panels should be cleaned by customer two times in a week. Concealed wiring shall be done by company, if possible only. Otherwise, customer should do concealed wiring with their wiremen where material shall be provided by Company. After successful installation, Customer shall take care of solar plant by doing timely cleaning. If we found less generation at the time of attending complaint due to non-cleaning, we may charge you additional service charge. There is manufacturing warranty for all electronics equipment. Company will help to claim this warranty if require.',

      governmentSubsidy: 'Subsidy Credit: If applicable, any subsidy will be directly credited to the customer\'s account. Our company will handle all necessary documentation with the government. Delay Disclaimer: Please note that subsidy amounts may experience delays from the government\'s side. Our company is not liable to compensate for any delays or non-receipt of subsidies if not provided by the government.',

      warrantyDetails: '1. Solar Panel (PV Modules) Performance Warranty: 90% of rated capacity for the first 15 years. 80% of rated capacity for the next 15 years. Total Panel Life: 30 years. 2. Inverter Manufacturing Defect Warranty: 12 years, extendable. 3. Battery Manufacturing Defect Warranty for Hybrid & Off Grid Plant: 8 years, Extendable. 4. Balance of System (BOS): Equipment/products supplied by us which are warranted against defects due to poor material, design, or workmanship. This warranty is valid for 12 months from the date of commissioning. 5. Operation & Maintenance: We offer 5 years of O&M support, including fault finding, remote monitoring, site visits, and assistance with warranty claims.',

      siteCompletionSchedule: 'Dispatch within 6 weeks after order confirmation with payment. The entire power plant will be installed and commissioned within 60-70 days (approx.) after project accreditation, contract agreement, and possession of the site.',

      paymentTerms: '50% advance payment upon contract signing. 40% upon delivery of structure material. 10% before meter installation is complete.',

      warrantyExclusions: 'The warranty will not cover failures due to: Damage or defect caused by transportation, accident, misuse, lack of maintenance, improper usage, or negligence by the owner. Wilful damage, normal wear and tear, abuse, or misuse of equipment/product. Damage or defect caused by Force Majeure events, including fire, earthquake, flood, or other natural disasters. Damage or defect caused by unauthorized alterations, modifications, or conversions.',

      scopeOfWork: 'Providing access/approach to rooftop. If any electrical modification is required from DISCOM (i.e. ELCB, changeover switch etc.) Customer shall provide necessary support. Provide necessary documents for project approvals from State/Central Government. Site clearance, ladders, water, and electricity supply for smooth installation and commissioning of the project. Customer shall provide Safe Place for Material unloading and storage during the work execution. Net meter / Smart meter charge in your scope.'
    };

    await settings.save();
    console.log('✅ Settings seeded with PDF Terms successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
});