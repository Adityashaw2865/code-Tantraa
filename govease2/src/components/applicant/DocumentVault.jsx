import React, { useState } from 'react';
import { FolderLock, Upload, FileText, Trash2, Eye, Sparkles, Search, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { analyzeDocumentWithOCR } from '../../services/aiService';
import { DigiLockerPullModal } from '../modals/DigiLockerPullModal';
import { Badge, documentStatusTone } from '../common/Badge';
import { RequiredDocsPanel } from './RequiredDocsPanel';
export const DocumentVault = () => {
    const { documents, uploadDocument, deleteDocument, business } = useApp();
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [isDigiLockerOpen, setIsDigiLockerOpen] = useState(false);
    const [selectedDocForPreview, setSelectedDocForPreview] = useState(null);
    // Upload Form State
    const [uploadName, setUploadName] = useState('');
    const [uploadCategory, setUploadCategory] = useState('Technical & Utilities');
    const [uploadFileName, setUploadFileName] = useState('');
    const [uploadFileSize, setUploadFileSize] = useState('2.4 MB');
    const [uploadDocKey, setUploadDocKey] = useState('doc_custom');
    const [uploadFile, setUploadFile] = useState(null);
    const [ocrAnalyzing, setOcrAnalyzing] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const categories = [
        { id: 'all', label: 'All Documents' },
        { id: 'Identity & Proof', label: 'Identity & Legal' },
        { id: 'Land & Building', label: 'Land & Civil' },
        { id: 'Technical & Utilities', label: 'Technical & Utilities' },
        { id: 'Environmental & Pollution', label: 'Environmental / PCB' },
        { id: 'Safety & Fire', label: 'Fire & Safety' },
        { id: 'Labour & Workforce', label: 'Labour & Workforce' }
    ];
    const filteredDocs = documents.filter(doc => {
        const matchesCat = activeCategory === 'all' || doc.category === activeCategory;
        const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });
    const handleSimulateFileSelect = (name, cat, key) => {
        setUploadName(name);
        setUploadCategory(cat);
        setUploadDocKey(key);
        setUploadFileName(name.replace(/\s+/g, '_') + '_v1.pdf');
        setOcrAnalyzing(true);
        setTimeout(() => {
            const ocr = analyzeDocumentWithOCR(name, cat, business.businessName);
            setOcrResult(ocr);
            setOcrAnalyzing(false);
        }, 600);
    };
    const handleSaveUpload = () => {
        if (!uploadName.trim()) {
            alert('Please specify document title');
            return;
        }
        uploadDocument({
            name: uploadName,
            category: uploadCategory,
            documentKey: uploadDocKey,
            fileName: uploadFileName || `${uploadName.replace(/\s+/g, '_')}.pdf`,
            fileSize: uploadFileSize,
            file: uploadFile || undefined,
            ocrAnalysis: ocrResult || undefined
        });
        setIsUploadModalOpen(false);
        setUploadName('');
        setUploadFile(null);
        setOcrResult(null);
    };
    return (<div className="space-y-6">
      <RequiredDocsPanel />
      {/* Vault Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-blue-900"/>
            <h3 className="font-bold text-base text-slate-900">
              Enterprise Compliance Document Vault
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Encrypted repository for {business.businessName}. Documents uploaded here are automatically referenced across all statutory applications.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button onClick={() => setIsDigiLockerOpen(true)} className="px-3.5 py-2 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors" title="Import authentic documents directly from DigiLocker and Mahabhulekh">
            <Database className="w-3.5 h-3.5 text-amber-300"/>
            <span>Fetch from DigiLocker / 7/12</span>
          </button>

          <button onClick={() => setIsUploadModalOpen(true)} className="px-3.5 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
            <Upload className="w-3.5 h-3.5"/>
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map(cat => (<button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-3 py-1.5 rounded-md font-semibold text-xs whitespace-nowrap cursor-pointer transition-colors ${activeCategory === cat.id
                ? 'bg-blue-900 text-white shadow-2xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
              {cat.label}
            </button>))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5"/>
          <input type="text" placeholder="Search vault documents..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white"/>
        </div>

      </div>

      {/* Documents Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredDocs.length === 0 ? (<div className="p-8 text-center text-slate-500 text-xs">
              No compliance records found matching selected filter.
            </div>) : (filteredDocs.map(doc => {
            return (<div key={doc.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* File Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-md bg-blue-50 text-blue-900 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4"/>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{doc.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          v{doc.version}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                        <span className="font-mono text-slate-600">{doc.fileName}</span>
                        <span>•</span>
                        <span>{doc.fileSize}</span>
                        <span>•</span>
                        <span>Uploaded: {doc.uploadDate}</span>
                        {doc.expiryDate && (<>
                            <span>•</span>
                            <span className="text-amber-700 font-semibold font-mono">
                              Expires: {doc.expiryDate}
                            </span>
                          </>)}
                      </div>

                      {/* OCR / Pre-Validation Flag */}
                      {doc.ocrAnalysis && (<div className="flex items-center gap-1 text-[10px] text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 mt-1.5 max-w-xl">
                          <Sparkles className="w-3 h-3 text-blue-600 shrink-0"/>
                          <span className="truncate">
                            <strong>Simulated OCR ({doc.ocrAnalysis.confidenceScore}% confidence):</strong> {doc.ocrAnalysis.matchDiscrepancyNotes}
                          </span>
                        </div>)}
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    
                    <Badge tone={documentStatusTone(doc.verificationStatus)}>
                      {doc.verificationStatus.toUpperCase().replace('_', ' ')}
                    </Badge>

                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setSelectedDocForPreview(doc)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer" title="View Metadata">
                        <Eye className="w-3.5 h-3.5"/>
                      </button>

                      <button onClick={() => deleteDocument(doc.id)} className="p-1.5 rounded-md hover:bg-red-50 text-slate-500 hover:text-red-700 cursor-pointer" title="Delete Document">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>

                  </div>
                </div>);
        }))}
        </div>
      </div>

      {/* Document Upload Modal with Simulated OCR Pre-Validation */}
      {isUploadModalOpen && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-900"/>
                <h3 className="font-bold text-sm text-slate-900">
                  Upload Compliance Record to Secure Vault
                </h3>
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer text-lg font-bold">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select File (PDF, JPG, PNG, WEBP · max 10 MB)</label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => {
                const f = e.target.files?.[0] || null;
                setUploadFile(f);
                if (f) {
                    setUploadFileName(f.name);
                    setUploadFileSize((f.size / 1024).toFixed(1) + ' KB');
                    if (!uploadName)
                        setUploadName(f.name.replace(/\.[^.]+$/, ''));
                }
            }} className="w-full text-xs"/>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Title</label>
                <input type="text" value={uploadName} onChange={e => setUploadName(e.target.value)} placeholder="e.g. Revised Structural Stability Certificate" className="w-full p-2 border border-slate-300 rounded-md text-xs"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compliance Category</label>
                  <select value={uploadCategory} onChange={e => setUploadCategory(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-white">
                    <option value="Identity & Proof">Identity & Legal</option>
                    <option value="Land & Building">Land & Civil</option>
                    <option value="Technical & Utilities">Technical & Utilities</option>
                    <option value="Environmental & Pollution">Environmental / PCB</option>
                    <option value="Safety & Fire">Fire & Safety</option>
                    <option value="Labour & Workforce">Labour & Workforce</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">File Size</label>
                  <input type="text" value={uploadFileSize} onChange={e => setUploadFileSize(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md text-xs bg-slate-50 font-mono"/>
                </div>
              </div>

              {/* OCR Pre-validation Banner */}
              {ocrAnalyzing ? (<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin text-blue-600"/>
                  <span>Simulated OCR pre-validation analyzing file metadata...</span>
                </div>) : ocrResult ? (<div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-blue-900 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600"/>
                      <span>Simulated OCR Extraction & Match Verification</span>
                    </span>
                    <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                      {ocrResult.confidenceScore}% Match
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>Entity: <strong>{ocrResult.extractedEntityName}</strong></div>
                    <div>Doc Code: <span className="font-mono">{ocrResult.extractedRegNumber || 'N/A'}</span></div>
                  </div>
                  <p className="text-[11px] text-slate-700 italic border-t border-slate-200 pt-1">
                    {ocrResult.matchDiscrepancyNotes}
                  </p>
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-1">
                    ⚠ Demo Mode: this is a simulated OCR result based on the file name, not real document text extraction. Treat as a suggestion requiring officer confirmation.
                  </p>
                </div>) : null}
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end gap-2">
              <button type="button" onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleSaveUpload} disabled={!uploadName.trim()} className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-xs font-semibold text-white cursor-pointer shadow-xs disabled:opacity-40">
                Store in Vault
              </button>
            </div>

          </div>
        </div>)}

      {/* Preview Modal */}
      {selectedDocForPreview && (<div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-blue-900 uppercase">Compliance Vault Record</span>
                <h3 className="font-bold text-sm text-slate-900 mt-0.5">{selectedDocForPreview.name}</h3>
              </div>
              <button onClick={() => setSelectedDocForPreview(null)} className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer text-lg">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2 bg-slate-50 rounded-md border border-slate-100 font-mono text-[11px]">
                <p>File Name: {selectedDocForPreview.fileName}</p>
                <p>File Size: {selectedDocForPreview.fileSize}</p>
                <p>MIME Type: {selectedDocForPreview.mimeType}</p>
                <p>Upload Date: {selectedDocForPreview.uploadDate}</p>
                <p>Verification: {selectedDocForPreview.verificationStatus.toUpperCase()}</p>
                {selectedDocForPreview.verifiedBy && (<p>Verified By: {selectedDocForPreview.verifiedBy} ({selectedDocForPreview.verificationDate})</p>)}
                {selectedDocForPreview.rejectionReason && (<p className="text-red-700 font-bold">Deficiency Note: {selectedDocForPreview.rejectionReason}</p>)}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-end">
              <button onClick={() => setSelectedDocForPreview(null)} className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-md text-xs font-semibold cursor-pointer">
                Close Record
              </button>
            </div>
          </div>
        </div>)}

      {/* DigiLocker Pull Modal */}
      <DigiLockerPullModal isOpen={isDigiLockerOpen} onClose={() => setIsDigiLockerOpen(false)}/>

    </div>);
};
