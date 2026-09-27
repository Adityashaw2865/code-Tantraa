import React, { useState } from 'react';
import { CreditCard, CheckCircle2, Printer, ShieldCheck, QrCode, Receipt, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateRequiredApprovals } from '../../services/rulesEngine';
import { getSession } from '../../services/authService';
import { createPaymentAPI, downloadPaymentReceipt } from '../../services/dataService';
export const MahaGrasPaymentModal = ({ isOpen, onClose, business }) => {
    const [selectedMethod, setSelectedMethod] = useState('upi');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [error, setError] = useState('');
    const [grnNumber, setGrnNumber] = useState('');
    const [paymentId, setPaymentId] = useState('');
    const [bankRef, setBankRef] = useState('SBIN26092284920');
    const session = getSession();
    const isRealBusiness = /^[a-f0-9]{24}$/i.test(String(business.id));
    const { approvalTypes, documents, departments } = useApp();
    if (!isOpen)
        return null;
    const feeItems = evaluateRequiredApprovals(business, approvalTypes, documents)
        .filter(e => e.confidence !== 'Not Applicable')
        .map(e => ({
        dept: departments.find(d => d.id === e.approval.departmentId)?.name || 'Government of Maharashtra',
        head: `${e.approval.shortCode} · ${e.approval.legalActReference}`,
        clearance: e.approval.approvalName,
        amount: e.approval.statutoryFeeINR || 0
    }));
    const totalAmount = feeItems.reduce((acc, item) => acc + item.amount, 0);
    const handlePay = async () => {
        setIsProcessing(true);
        setError('');
        // Real, persisted payment for accounts with a real business profile; demo personas
        // (which have no backend record) fall back to the old instant client-side simulation.
        if (session && isRealBusiness) {
            try {
                const approvalTypeIds = evaluateRequiredApprovals(business, approvalTypes, documents)
                    .filter(e => e.confidence !== 'Not Applicable')
                    .map(e => e.approval.id);
                const payment = await createPaymentAPI(session.token, business.id, approvalTypeIds, selectedMethod);
                setGrnNumber(payment.grnNumber);
                setPaymentId(payment.id);
                setBankRef(payment.bankReferenceCIN);
                setIsPaid(true);
            }
            catch (e) {
                setError(e.message || 'Payment could not be completed');
            }
            finally {
                setIsProcessing(false);
            }
            return;
        }
        setTimeout(() => {
            setGrnNumber(`MH-2026-GRAS-00${Math.floor(1000 + Math.random() * 9000)}`);
            setIsProcessing(false);
            setIsPaid(true);
        }, 1400);
    };
    const handlePrint = async () => {
        if (session && paymentId) {
            try {
                await downloadPaymentReceipt(session.token, paymentId, grnNumber);
                return;
            }
            catch (e) {
                setError(e.message);
                return;
            }
        }
        window.print();
    };
    return (<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4"/>
            </div>
            <div>
              <h3 className="font-bold text-sm flex items-center gap-2">
                <span>MahaGRAS Consolidated Fee Gateway</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-400/30">
                  Treasury Integration
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Government Receipt Accounting System · Finance Department, Govt. of Maharashtra
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold cursor-pointer text-lg p-1">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-800">
          
          {!isPaid ? (<>
              {/* Info Notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 mt-0.5 shrink-0"/>
                <p className="text-[11px] leading-relaxed">
                  <strong>Single-Window Unified Settlement:</strong> Instead of making 4 separate payments across different departmental banks, pay the consolidated statutory fee in one single step. MahaGRAS automatically disburses funds to respective departmental treasury budget heads.
                </p>
              </div>

              {/* Fee Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 p-3 font-bold text-slate-700 uppercase tracking-wider text-[10px] flex justify-between">
                  <span>Department & Clearance Service</span>
                  <span>Statutory Fee</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {feeItems.map((item, idx) => (<div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-50/70">
                      <div>
                        <span className="font-bold text-slate-900 block text-xs">{item.clearance}</span>
                        <span className="text-[11px] text-slate-600">{item.dept}</span>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{item.head}</span>
                      </div>
                      <div className="font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        ₹{item.amount.toLocaleString()}
                      </div>
                    </div>))}
                </div>
                <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between font-bold">
                  <span className="text-xs uppercase tracking-wider">Total Consolidated Treasury Amount</span>
                  <span className="text-base font-mono text-emerald-400">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="font-bold text-slate-900 block text-xs">Select Treasury Payment Gateway Mode:</label>
                <div className="grid grid-cols-3 gap-3">
                  <button type="button" onClick={() => setSelectedMethod('upi')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedMethod === 'upi' ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-xs' : 'border-slate-200 text-slate-600'}`}>
                    <span className="block text-xs">Instant UPI</span>
                    <span className="text-[10px] text-slate-400">BHIM / GPay / PhonePe</span>
                  </button>

                  <button type="button" onClick={() => setSelectedMethod('netbanking')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedMethod === 'netbanking' ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-xs' : 'border-slate-200 text-slate-600'}`}>
                    <span className="block text-xs">Net Banking</span>
                    <span className="text-[10px] text-slate-400">SBI, HDFC, ICICI, BoM</span>
                  </button>

                  <button type="button" onClick={() => setSelectedMethod('sbiepay')} className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${selectedMethod === 'sbiepay' ? 'border-blue-600 bg-blue-50/70 font-bold text-blue-900 shadow-xs' : 'border-slate-200 text-slate-600'}`}>
                    <span className="block text-xs">SBI e-Pay / NEFT</span>
                    <span className="text-[10px] text-slate-400">Govt. Preferred Gateway</span>
                  </button>
                </div>
              </div>

              {error && <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-md p-2">{error}</p>}

              {/* Pay Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer font-medium">
                  Cancel
                </button>

                <button disabled={isProcessing} type="button" onClick={handlePay} className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 cursor-pointer shadow-sm transition-colors">
                  {isProcessing ? (<>
                      <Sparkles className="w-4 h-4 animate-spin"/>
                      <span>Transacting via MahaGRAS...</span>
                    </>) : (<>
                      <CreditCard className="w-4 h-4"/>
                      <span>Authorize Payment of ₹{totalAmount.toLocaleString()}</span>
                    </>)}
                </button>
              </div>
            </>) : (
        /* Official e-Challan Receipt View */
        <div className="space-y-5 animate-in fade-in">
              <div className="border-2 border-emerald-600 rounded-xl p-5 bg-emerald-50/30 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6"/>
                    </div>
                    <div>
                      <span className="font-bold text-sm text-emerald-950 block">MahaGRAS e-Challan Payment Receipt</span>
                      <span className="text-[11px] text-emerald-800">Payment Status: <strong>SUCCESS (Treasury Realized)</strong></span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase block font-mono">Challan GRN Number</span>
                    <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900 inline-block">
                      {grnNumber}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Depositor</span>
                    <span className="font-bold text-slate-900">{business.businessName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Transaction Date</span>
                    <span className="font-mono font-bold text-slate-900">{new Date().toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Amount Paid</span>
                    <span className="font-mono font-bold text-emerald-800 text-sm">₹{totalAmount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Bank Reference (CIN)</span>
                    <span className="font-mono text-slate-700">{bankRef}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Payment Channel</span>
                    <span className="font-medium text-slate-800 uppercase">{selectedMethod} (Integrated Gateway)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Clearance Status</span>
                    <span className="font-bold text-blue-800">Department Feeds Updated</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white rounded-md border border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>This receipt is valid statutory proof of fee deposit under Maharashtra Treasury Rules.</span>
                  <QrCode className="w-8 h-8 text-slate-800 shrink-0 ml-2"/>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={handlePrint} className="px-4 py-2 rounded-lg bg-blue-900 hover:bg-blue-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer text-xs transition-colors">
                  <Printer className="w-4 h-4"/>
                  <span>Print Official e-Challan</span>
                </button>

                <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer text-xs transition-colors">
                  Done & Return to Portal
                </button>
              </div>
            </div>)}

        </div>

      </div>
    </div>);
};
