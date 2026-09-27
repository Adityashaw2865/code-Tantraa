import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/landing/HomePage';
import { HowItWorksPage } from './components/landing/HowItWorksPage';
import { FeaturesPage } from './components/landing/FeaturesPage';
import { ApprovalsDirectoryPage } from './components/landing/ApprovalsDirectoryPage';
import { AboutPage } from './components/landing/AboutPage';
import { SurveyInsightsPage } from './components/landing/SurveyInsightsPage';
import { ProjectWizard } from './components/onboarding/ProjectWizard';
import { AuthModal } from './components/auth/AuthModal';
// Role dashboards and less-frequently-opened modals are code-split: a
// visitor on the landing page should not have to download the Officer,
// Inspector and Admin dashboards (or these modals) up front. Each chunk
// loads only when that role/dashboard/modal is actually opened.
const ApplicantDashboard = lazy(() => import('./components/applicant/ApplicantDashboard').then(m => ({ default: m.ApplicantDashboard })));
const OfficerDashboard = lazy(() => import('./components/officer/OfficerDashboard').then(m => ({ default: m.OfficerDashboard })));
const InspectorDashboard = lazy(() => import('./components/inspector/InspectorDashboard').then(m => ({ default: m.InspectorDashboard })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const GovEaseAssistantModal = lazy(() => import('./components/ai/GovEaseAssistantModal').then(m => ({ default: m.GovEaseAssistantModal })));
const TrackApplicationModal = lazy(() => import('./components/common/TrackApplicationModal').then(m => ({ default: m.TrackApplicationModal })));
const PublicVerificationModal = lazy(() => import('./components/common/PublicVerificationModal').then(m => ({ default: m.PublicVerificationModal })));
const MasterDossierModal = lazy(() => import('./components/common/MasterDossierModal').then(m => ({ default: m.MasterDossierModal })));
const RTSAAppellateModal = lazy(() => import('./components/common/RTSAAppellateModal').then(m => ({ default: m.RTSAAppellateModal })));
/** Minimal, unobtrusive fallback while a lazy chunk loads. */
const SectionLoader = () => (<div className="flex items-center justify-center py-24 text-sm text-slate-400">
    Loading…
  </div>);
const MainAppContent = () => {
    const { currentRole, setCurrentRole } = useApp();
    const [activeNavTab, setActiveNavTab] = useState('landing');
    const [isAssistantOpen, setIsAssistantOpen] = useState(false);
    const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [wizardMode, setWizardMode] = useState('edit');
    const [wizardPrefill, setWizardPrefill] = useState({ sector: undefined, employees: undefined });
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [isPublicVerifyOpen, setIsPublicVerifyOpen] = useState(false);
    const [isMasterDossierOpen, setIsMasterDossierOpen] = useState(false);
    const [isRTSAAppellateOpen, setIsRTSAAppellateOpen] = useState(false);
    const [directorySearch, setDirectorySearch] = useState('');
    const goToDirectory = (term = '') => { setDirectorySearch(term); setActiveNavTab('directory'); };
    return (<div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Main Institutional Navbar */}
      <Navbar onOpenAssistant={() => setIsAssistantOpen(true)} onOpenTrackModal={() => setIsTrackModalOpen(true)} onStartOnboarding={() => { setWizardMode('edit'); setWizardPrefill({}); setIsOnboardingOpen(true); }} activeNavTab={activeNavTab} setActiveNavTab={setActiveNavTab} onOpenPublicVerification={() => setIsPublicVerifyOpen(true)} onOpenMasterDossier={() => setIsMasterDossierOpen(true)} onOpenRTSAAppeal={() => setIsRTSAAppellateOpen(true)} onOpenAuth={(mode) => { setAuthMode(mode); setIsAuthModalOpen(true); }}/>

      {/* Main Body Content */}
      <main className="flex-1">
        {activeNavTab === 'landing' && (<HomePage onStartOnboarding={() => {
                setCurrentRole('applicant');
                setWizardMode('create');
                setWizardPrefill({});
                setIsOnboardingOpen(true);
            }} onOpenTrackModal={() => setIsTrackModalOpen(true)} setActiveNavTab={setActiveNavTab} onSearchDirectory={goToDirectory}/>)}

        {activeNavTab === 'how-it-works' && <HowItWorksPage />}

        {activeNavTab === 'directory' && (<ApprovalsDirectoryPage initialSearch={directorySearch} onStartOnboarding={() => {
                setCurrentRole('applicant');
                setWizardMode('create');
                setWizardPrefill({});
                setIsOnboardingOpen(true);
            }}/>)}

        {activeNavTab === 'features' && (<FeaturesPage onStartOnboarding={(sector, employees) => {
                setCurrentRole('applicant');
                setWizardMode('create');
                setWizardPrefill({ sector, employees });
                setIsOnboardingOpen(true);
            }} onOpenAssistant={() => setIsAssistantOpen(true)}/>)}

        {activeNavTab === 'insights' && <SurveyInsightsPage />}

        {activeNavTab === 'about' && (<AboutPage onOpenAssistant={() => setIsAssistantOpen(true)}/>)}

        {activeNavTab === 'dashboard' && (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<SectionLoader />}>
              {currentRole === 'applicant' && (<ApplicantDashboard onStartOnboarding={() => { setWizardMode('edit'); setWizardPrefill({}); setIsOnboardingOpen(true); }} onAddBusiness={() => { setWizardMode('create'); setWizardPrefill({}); setIsOnboardingOpen(true); }} onOpenAssistant={() => setIsAssistantOpen(true)}/>)}

              {currentRole === 'officer' && (<OfficerDashboard />)}

              {currentRole === 'inspector' && (<InspectorDashboard />)}

              {currentRole === 'admin' && (<AdminDashboard />)}
            </Suspense>
          </div>)}

        {activeNavTab === 'schemes' && (<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Suspense fallback={<SectionLoader />}>
              <ApplicantDashboard onStartOnboarding={() => { setWizardMode('edit'); setWizardPrefill({}); setIsOnboardingOpen(true); }} onAddBusiness={() => { setWizardMode('create'); setWizardPrefill({}); setIsOnboardingOpen(true); }} onOpenAssistant={() => setIsAssistantOpen(true)} initialTab="schemes"/>
            </Suspense>
          </div>)}
      </main>

      {/* Institutional Footer */}
      <Footer />

      {/* Onboarding Wizard Modal */}
      {isOnboardingOpen && (<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <ProjectWizard mode={wizardMode} initialSector={wizardPrefill.sector} initialEmployees={wizardPrefill.employees} onComplete={() => {
                setIsOnboardingOpen(false);
                setActiveNavTab('dashboard');
            }} onCancel={() => setIsOnboardingOpen(false)}/>
          </div>
        </div>)}

      {/* GovEase Regulatory Intelligence Assistant Modal */}
      {isAssistantOpen && (<Suspense fallback={null}>
          <GovEaseAssistantModal isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} onNavigateToChecklist={() => {
                setIsAssistantOpen(false);
                setActiveNavTab('dashboard');
            }}/>
        </Suspense>)}

      {/* Floating VyaparSetu AI Assistant Launcher — fixed, visible on every page */}
      {!isAssistantOpen && (<button onClick={() => setIsAssistantOpen(true)} title="Open VyaparSetu Regulatory Intelligence Assistant" className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-blue-900 text-white shadow-lg hover:bg-blue-800 hover:shadow-xl transition-all cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          <span className="text-sm font-semibold">Ask VyaparSetu AI</span>
        </button>)}

      {/* Track Application Modal */}
      {isTrackModalOpen && (<Suspense fallback={null}>
          <TrackApplicationModal isOpen={isTrackModalOpen} onClose={() => setIsTrackModalOpen(false)} onNavigateToApp={(appId) => {
                setActiveNavTab('dashboard');
            }}/>
        </Suspense>)}

      {/* Auth / Fast Persona Switcher Modal */}
      <AuthModal isOpen={isAuthModalOpen} initialMode={authMode} onClose={() => setIsAuthModalOpen(false)} onSuccess={() => setActiveNavTab('dashboard')}/>

      {/* Public Document & QR Verification Modal */}
      {isPublicVerifyOpen && (<Suspense fallback={null}>
          <PublicVerificationModal isOpen={isPublicVerifyOpen} onClose={() => setIsPublicVerifyOpen(false)}/>
        </Suspense>)}

      {/* Master Industrial Regulatory Dossier Modal */}
      {isMasterDossierOpen && (<Suspense fallback={null}>
          <MasterDossierModal isOpen={isMasterDossierOpen} onClose={() => setIsMasterDossierOpen(false)}/>
        </Suspense>)}

      {/* Maharashtra RTSA Appellate Tribunal Modal */}
      {isRTSAAppellateOpen && (<Suspense fallback={null}>
          <RTSAAppellateModal isOpen={isRTSAAppellateOpen} onClose={() => setIsRTSAAppellateOpen(false)}/>
        </Suspense>)}

    </div>);
};
export function App() {
    return (<AppProvider>
      <MainAppContent />
    </AppProvider>);
}
export default App;