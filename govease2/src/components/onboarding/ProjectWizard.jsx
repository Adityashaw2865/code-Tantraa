import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
const SECTOR_QUESTIONS = {
    'Food Processing': [
        { key: 'boiler', label: 'Will you use a steam boiler / cooking kettles?', field: 'boilerInstallationRequired' },
        { key: 'effluent', label: 'Will washing/processing generate wastewater?', field: 'effluentGenerationExpected' },
        { key: 'export', label: 'Do you plan to export food products?' }
    ],
    'Textiles & Apparel': [
        { key: 'dyeing', label: 'Dyeing / washing / printing unit?', field: 'effluentGenerationExpected' },
        { key: 'boiler', label: 'Steam boiler required?', field: 'boilerInstallationRequired' },
        { key: 'chemicals', label: 'Will you store dyes / hazardous chemicals?', field: 'hazardousMaterialsPresent' }
    ],
    'Chemicals & Pharmaceuticals': [
        { key: 'hazardous', label: 'Will you handle hazardous / flammable chemicals?', field: 'hazardousMaterialsPresent' },
        { key: 'effluent', label: 'Will process effluent be generated?', field: 'effluentGenerationExpected' },
        { key: 'boiler', label: 'Steam boiler required?', field: 'boilerInstallationRequired' }
    ],
    'Engineering & Machinery': [
        { key: 'plating', label: 'Electroplating / heat treatment / painting?', field: 'effluentGenerationExpected' },
        { key: 'solvents', label: 'Will you store paints / solvents / gases?', field: 'hazardousMaterialsPresent' },
        { key: 'boiler', label: 'Boiler / pressure vessel required?', field: 'boilerInstallationRequired' }
    ],
    'Electronics & Hardware': [
        { key: 'pcb', label: 'PCB etching / chemical processes?', field: 'effluentGenerationExpected' },
        { key: 'ewaste', label: 'Will you handle e-waste / hazardous solder?', field: 'hazardousMaterialsPresent' },
        { key: 'export', label: 'Do you plan to export?' }
    ],
    'Agro-processing & Cold Storage': [
        { key: 'ammonia', label: 'Ammonia-based refrigeration?', field: 'hazardousMaterialsPresent' },
        { key: 'boiler', label: 'Steam boiler / dryer required?', field: 'boilerInstallationRequired' },
        { key: 'effluent', label: 'Wastewater from processing?', field: 'effluentGenerationExpected' }
    ],
    'Information Technology & ITES': [
        { key: 'dg', label: 'Will you install a DG set / UPS backup?' },
        { key: 'stpi', label: 'Planning STPI / SEZ registration?' },
        { key: 'datacentre', label: 'Will you run a data centre?' }
    ],
    'Renewable Energy': [
        { key: 'battery', label: 'Battery storage (BESS) included?', field: 'hazardousMaterialsPresent' },
        { key: 'grid', label: 'Grid-connected (open access / net metering)?' },
        { key: 'forest', label: 'Is the site near forest / eco-sensitive land?' }
    ]
};
export const ProjectWizard = ({ onComplete, onCancel, mode = 'edit', initialSector, initialEmployees }) => {
    const { business, updateBusinessProfile, currentUser } = useApp();
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 11;
    const isCreateMode = mode === 'create';
    const [formData, setFormData] = useState(() => isCreateMode
        ? {
            state: 'Maharashtra',
            ...(initialSector ? { industrySector: initialSector } : {}),
            ...(initialEmployees ? { numberOfEmployees: initialEmployees } : {})
        }
        : { ...business });
    const validateRequiredFields = () => {
        if (!formData.businessName.trim()) { alert('Please enter the Company / Entity Legal Name.'); setCurrentStep(1); return false; }
        if (!formData.panNumber.trim()) { alert('Please enter the PAN Number.'); setCurrentStep(1); return false; }
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.panNumber.trim().toUpperCase())) { alert('Please enter a valid PAN Number, e.g. ABCDE1234F.'); setCurrentStep(1); return false; }
        if (!formData.contactEmail.trim()) { alert('Please enter the Contact Email.'); setCurrentStep(1); return false; }
        if (!/^\S+@\S+\.\S+$/.test(formData.contactEmail.trim())) { alert('Please enter a valid Contact Email.'); setCurrentStep(1); return false; }
        if (!formData.contactPhone.trim()) { alert('Please enter the Contact Phone.'); setCurrentStep(1); return false; }
        if (!/^[0-9]{10}$/.test(formData.contactPhone.trim())) { alert('Please enter a valid 10-digit Contact Phone.'); setCurrentStep(1); return false; }
        if (!formData.businessType) { alert('Please select the Business Type.'); setCurrentStep(1); return false; }
        if (!formData.industrySector) { alert('Please select the Industry Sector.'); setCurrentStep(2); return false; }
        if (!formData.district) { alert('Please select the District.'); setCurrentStep(3); return false; }
        if (!/^[0-9]{6}$/.test(formData.pincode.trim())) { alert('Please enter a valid 6-digit Pincode.'); setCurrentStep(3); return false; }
        if (!formData.address.trim()) { alert('Please enter the full business address.'); setCurrentStep(3); return false; }
        if (!formData.projectSize) { alert('Please select the Project Size.'); setCurrentStep(4); return false; }
        if (!formData.landType) { alert('Please select the Land Type.'); setCurrentStep(6); return false; }
        if (!formData.environmentalCategory) { alert('Please select the Environmental Category.'); setCurrentStep(8); return false; }
        if (!formData.currentStage) { alert('Please select the Current Stage.'); setCurrentStep(10); return false; }
        return true;
    };
    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
            return;
        }
        if (!validateRequiredFields())
            return;
        updateBusinessProfile(formData, isCreateMode);
        onComplete();
    };
    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };
    const handleSaveDraft = () => {
        if (!validateRequiredFields())
            return;
        updateBusinessProfile(formData, isCreateMode);
        alert('Project onboarding draft saved successfully.');
        onCancel();
    };
    const progressPercent = Math.round((currentStep / totalSteps) * 100);
    const stepTitles = [
        'Business Legal Entity',
        'Industry Classification',
        'Location & Jurisdiction',
        'Project Scale Category',
        'Capital Investment',
        'Land & Factory Building',
        'Production & Utility Loads',
        'Environmental Impact',
        'Workforce & Employment',
        'Current Lifecycle Stage',
        'Sector-Specific Details'
    ];
    return (<div className="max-w-3xl mx-auto p-4 sm:p-6 my-6 bg-white rounded-xl border border-slate-200 shadow-md">
      
      {/* Top Header */}
      <div className="border-b border-slate-200 pb-4 mb-6">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase tracking-wider text-blue-900">
              Project Onboarding Wizard
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-500 font-mono">Step {currentStep} of {totalSteps}</span>
          </div>
          <button onClick={handleSaveDraft} className="text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium cursor-pointer">
            <Save className="w-3.5 h-3.5"/>
            <span>Save Draft</span>
          </button>
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          {stepTitles[currentStep - 1]}
        </h2>

        <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
          <div className="bg-blue-700 h-2 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}/>
        </div>
      </div>

      <div className="min-h-[280px] py-2">
        
        {currentStep === 1 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Select the registered constitution of your business enterprise under Ministry of Corporate Affairs or Partnership Act:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Private Limited',
                'Public Limited',
                'Limited Liability Partnership (LLP)',
                'Partnership Firm',
                'Sole Proprietorship',
                'One Person Company'
            ].map(type => (<button key={type} type="button" onClick={() => setFormData({ ...formData, businessType: type })} className={`p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer transition-all ${formData.businessType === type
                    ? 'border-blue-900 bg-blue-50/70 text-blue-950 shadow-2xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span>{type}</span>
                    {formData.businessType === type && <Check className="w-4 h-4 text-blue-900"/>}
                  </div>
                </button>))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Entity Legal Name</label>
              <input type="text" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs" placeholder="Registered business name"/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                <input type="text" maxLength={10} value={formData.panNumber} onChange={e => setFormData({
                ...formData,
                panNumber: e.target.value.toUpperCase().replace(/\s/g, '')
            })} className="w-full p-2 border border-slate-300 rounded-md text-xs uppercase" placeholder="ABCDE1234F"/>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                <input type="email" value={formData.contactEmail} onChange={e => setFormData({ ...formData, contactEmail: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs" placeholder="business@example.com"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input type="tel" maxLength={10} value={formData.contactPhone} onChange={e => setFormData({
                ...formData,
                contactPhone: e.target.value.replace(/\D/g, '').slice(0, 10)
            })} className="w-full p-2 border border-slate-300 rounded-md text-xs" placeholder="10-digit mobile number"/>
            </div>
          </div>)}

        {currentStep === 2 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Choose your primary manufacturing or service domain. This directly governs pollution categorization and statutory inspection boards:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                'Food Processing',
                'Textiles & Apparel',
                'Chemicals & Pharmaceuticals',
                'Engineering & Machinery',
                'Electronics & Hardware',
                'Agro-processing & Cold Storage',
                'Information Technology & ITES',
                'Renewable Energy'
            ].map(sector => (<button key={sector} type="button" onClick={() => setFormData({ ...formData, industrySector: sector })} className={`p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer transition-all ${formData.industrySector === sector
                    ? 'border-blue-900 bg-blue-50/70 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <span>{sector}</span>
                    {formData.industrySector === sector && <Check className="w-4 h-4 text-blue-900"/>}
                  </div>
                </button>))}
            </div>
          </div>)}

        {currentStep === 3 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Enter the site address where manufacturing, warehousing, or operations will occur:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                <input type="text" value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-slate-50" readOnly/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">District</label>
                <select value={formData.district} onChange={e => setFormData({ ...formData, district: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white">
                  <option value="">Select District</option>
                  <option value="Pune">Pune (Chakan / Bhosari / Ranjangaon MIDC)</option>
                  <option value="Thane">Thane (Navi Mumbai / Ambernath / Dombivli)</option>
                  <option value="Raigad">Raigad (Taloja / Roha / Patalganga MIDC)</option>
                  <option value="Nashik">Nashik (Ambad / Satpur / Sinnar MIDC)</option>
                  <option value="Chhatrapati Sambhajinagar">Chhatrapati Sambhajinagar (Waluj / Shendra DMIC)</option>
                  <option value="Nagpur">Nagpur (Butibori / Hingna / MIHAN SEZ)</option>
                  <option value="Kolhapur">Kolhapur (Shiroli / Gokul Shirgaon MIDC)</option>
                  <option value="Palghar">Palghar (Tarapur Industrial Area)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pincode</label>
                <input type="text" inputMode="numeric" maxLength={6} value={formData.pincode} onChange={e => setFormData({
                ...formData,
                pincode: e.target.value.replace(/\D/g, '').slice(0, 6)
            })} className="w-full p-2 border border-slate-300 rounded-md text-xs" placeholder="6-digit pincode"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Industrial Plot / Survey Address</label>
              <textarea rows={2} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs" placeholder="Enter complete industrial/site address"/>
            </div>
          </div>)}

        {currentStep === 4 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Project classification under MSMED Act 2020:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { size: 'Micro', desc: 'Investment < ₹1 Cr & Turnover < ₹5 Cr' },
                { size: 'Small', desc: 'Investment < ₹10 Cr & Turnover < ₹50 Cr' },
                { size: 'Medium', desc: 'Investment < ₹50 Cr & Turnover < ₹250 Cr' },
                { size: 'Large / Mega Project', desc: 'Investment > ₹50 Cr (State High-Level Clearance Committee)' }
            ].map(item => (<button key={item.size} type="button" onClick={() => setFormData({ ...formData, projectSize: item.size })} className={`p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer transition-all ${formData.projectSize === item.size
                    ? 'border-blue-900 bg-blue-50/70 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}>
                  <div className="font-bold">{item.size}</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-1">{item.desc}</div>
                </button>))}
            </div>
          </div>)}

        {currentStep === 5 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Total Proposed Capital Investment in Plant, Machinery, Building & Pollution Control (₹ Crores):
            </p>
            <div className="flex items-center gap-3">
              <input type="number" step="0.25" min="0.1" value={formData.investmentAmountCr} onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                setFormData({
                    ...formData,
                    investmentAmountCr: val,
                    investmentAmountText: `₹${val.toFixed(2)} Crore`
                });
            }} className="w-48 p-2.5 border border-slate-300 rounded-md text-sm font-mono font-bold"/>
              <span className="text-sm font-semibold text-slate-700">Crore INR</span>
            </div>
            <p className="text-[11px] text-slate-500">
              * Units investing between ₹1 Crore and ₹10 Crores qualify for the 30% Banglashree State MSME Capital Investment Subsidy.
            </p>
          </div>)}

        {currentStep === 6 && (<div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Land Allotment / Title Type</label>
              <select value={formData.landType} onChange={e => setFormData({ ...formData, landType: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white">
                <option value="Maharashtra Industrial Development Corp (MIDC) Allotment">
                  Maharashtra Industrial Development Corporation (MIDC) Estate
                </option>
                <option value="Owned Industrial Plot">Freehold Privately Owned Industrial Plot</option>
                <option value="Leased Factory Shed">Long-term Leased Industrial Shed</option>
                <option value="Agricultural Converted Non-Agri Land">Converted Agricultural Land (Under MLRC Section 44)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Total Built-Up Covered Area (sq. ft.)</label>
              <input type="number" value={formData.builtUpAreaSqFt} onChange={e => setFormData({ ...formData, builtUpAreaSqFt: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono"/>
              <span className="text-[11px] text-slate-500">
                * Note: Covered area &gt; 5,380 sq. ft. (500 sq. m) legally mandates Fire Safety NOC.
              </span>
            </div>
          </div>)}

        {currentStep === 7 && (<div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Connected Electrical Load (kVA)</label>
                <input type="number" value={formData.connectedPowerLoadKVA} onChange={e => setFormData({ ...formData, connectedPowerLoadKVA: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono"/>
                <span className="text-[10px] text-slate-500">&gt;= 50 kVA requires HT Substation Sanction</span>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Water Requirement (KLD)</label>
                <input type="number" value={formData.waterRequirementKLD} onChange={e => setFormData({ ...formData, waterRequirementKLD: parseInt(e.target.value) || 0 })} className="w-full p-2 border border-slate-300 rounded-md text-xs font-mono"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Annual Production Capacity & Product Scope</label>
              <input type="text" value={formData.productionCapacityAnnual} onChange={e => setFormData({ ...formData, productionCapacityAnnual: e.target.value })} className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
            </div>
          </div>)}

        {currentStep === 8 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              CPCB / State Pollution Control Board Pollution Classification:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { cat: 'White', desc: 'Practically Non-polluting (Exempt from CTE)' },
                { cat: 'Green', desc: 'Low pollution index (Fast-track clearance)' },
                { cat: 'Orange', desc: 'Medium pollution (Mandatory ETP & CTE)' },
                { cat: 'Red', desc: 'Heavily polluting (Public hearing & EIA)' }
            ].map(item => (<button key={item.cat} type="button" onClick={() => setFormData({ ...formData, environmentalCategory: item.cat })} className={`p-3 text-center rounded-lg border text-xs font-bold cursor-pointer transition-all ${formData.environmentalCategory === item.cat
                    ? 'border-blue-900 bg-blue-50 text-blue-900'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}>
                  <div>{item.cat} Category</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-1 line-clamp-2">{item.desc}</div>
                </button>))}
            </div>

            <div className="pt-2 space-y-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input type="checkbox" checked={formData.boilerInstallationRequired} onChange={e => setFormData({ ...formData, boilerInstallationRequired: e.target.checked })} className="rounded-md border-slate-300 text-blue-900"/>
                <span>Includes Pressurized Steam Boiler or Baby Boiler installation</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                <input type="checkbox" checked={formData.effluentGenerationExpected} onChange={e => setFormData({ ...formData, effluentGenerationExpected: e.target.checked })} className="rounded-md border-slate-300 text-blue-900"/>
                <span>Generates industrial wash wastewater requiring Effluent Treatment Plant (ETP)</span>
              </label>
            </div>
          </div>)}

        {currentStep === 9 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              Total Anticipated Workers & Contractual Labor Force:
            </p>
            <div className="flex items-center gap-3">
              <input type="number" min="1" value={formData.numberOfEmployees} onChange={e => setFormData({ ...formData, numberOfEmployees: parseInt(e.target.value) || 1 })} className="w-36 p-2.5 border border-slate-300 rounded-md text-sm font-mono font-bold"/>
              <span className="text-xs font-medium text-slate-700">Personnel / Workers</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
              <p>• <strong>10 or more workers with power:</strong> Mandates Factory Operating Licence under Sec 6 of Factories Act 1948.</p>
              <p>• <strong>20 or more contractual workers:</strong> Mandates Registration under Contract Labour Act 1970.</p>
            </div>
          </div>)}

        {currentStep === 10 && (<div className="space-y-4">
            <p className="text-xs text-slate-600">
              What is the current execution status of this industrial project?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { stage: 'Idea', desc: 'Pre-investment feasibility study' },
                { stage: 'Land acquisition', desc: 'Industrial plot allotment in progress' },
                { stage: 'Construction', desc: 'Civil foundation and factory shed erection' },
                { stage: 'Setup', desc: 'Plant machinery placement & electrical cabling' },
                { stage: 'Pre-operation', desc: 'Trial batches, awaiting final NOCs & CTO' },
                { stage: 'Operational', desc: 'Commercial dispatch ongoing' },
                { stage: 'Expansion', desc: 'Brownfield expansion of existing capacity' }
            ].map(item => (<button key={item.stage} type="button" onClick={() => setFormData({ ...formData, currentStage: item.stage })} className={`p-3 text-left rounded-lg border text-xs font-semibold cursor-pointer transition-all ${formData.currentStage === item.stage
                    ? 'border-blue-900 bg-blue-50/70 text-blue-950'
                    : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}>
                  <div className="font-bold">{item.stage}</div>
                  <div className="text-[11px] font-normal text-slate-500 mt-0.5">{item.desc}</div>
                </button>))}
            </div>
          </div>)}

        {currentStep === 11 && (<div className="space-y-3">
            <p className="text-xs text-slate-600">
              Extra questions for <b>{formData.industrySector}</b> — these decide which approvals &amp; documents apply:
            </p>
            {(SECTOR_QUESTIONS[formData.industrySector] || []).map(q => {
                const val = !!formData.sectorAnswers?.[q.key];
                return (<div key={q.key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                  <span className="text-xs font-medium text-slate-800">{q.label}</span>
                  <div className="flex gap-1.5">
                    {[true, false].map(v => (<button key={String(v)} type="button" onClick={() => setFormData({
                            ...formData,
                            ...(q.field ? { [q.field]: v } : {}),
                            sectorAnswers: { ...(formData.sectorAnswers || {}), [q.key]: v }
                        })} className={`px-3 py-1 rounded-md border text-xs font-semibold cursor-pointer ${val === v && (formData.sectorAnswers?.[q.key] !== undefined) ? 'border-blue-900 bg-blue-50 text-blue-950' : 'border-slate-200 text-slate-600'}`}>
                        {v ? 'Yes' : 'No'}
                      </button>))}
                  </div>
                </div>);
            })}
          </div>)}

      </div>

      <div className="border-t border-slate-200 pt-4 mt-6 flex items-center justify-between">
        <button type="button" onClick={handleBack} disabled={currentStep === 1} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer">
          <ArrowLeft className="w-3.5 h-3.5"/>
          <span>Previous</span>
        </button>

        <div className="flex items-center gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer">
            Cancel
          </button>
          
          <button type="button" onClick={handleNext} className="px-5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
            <span>{currentStep === totalSteps ? 'Compute Regulatory Approvals' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

    </div>);
};
