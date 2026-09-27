import React, { useEffect, useState } from 'react';
import { ClipboardList, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { fetchSurveySummary, submitSurveyResponse } from '../../services/dataService';

const DEPARTMENTS = [
  'Fire Department', 'MPCB (Pollution)', 'Municipal Corporation', 'Labour Department',
  'Electricity (MSEDCL)', 'GST / Taxation', 'Land & Revenue', 'Other'
];
const REJECTION_REASONS = ['None', 'Missing document', 'Wrong / outdated format', 'Incomplete application form', 'Site plan discrepancy', 'Fee / payment mismatch', 'Other'];
const CHALLENGES = [
  'Long processing delay', 'Multiple office visits required', 'Document rejection / resubmission',
  'No tracking / status updates', 'Unclear requirements', 'Payment / fee confusion',
  'Poor communication from department', 'Other'
];

/** Simple horizontal bar row - no chart library, just a styled div. */
const Bar = ({ label, value, max, suffix = '', color = 'bg-blue-800' }) => (
  <div className="mb-3">
    <div className="flex justify-between text-xs mb-1">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className="text-slate-500 font-mono">{value}{suffix}</span>
    </div>
    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
    </div>
  </div>
);

const emptyForm = {
  department: DEPARTMENTS[0], serviceType: '', daysTaken: '', documentRejected: false,
  rejectionReason: 'None', difficultyRating: 3, biggestChallenge: CHALLENGES[0],
  respondentType: 'Business owner', comment: '', respondentName: ''
};

export const SurveyInsightsPage = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = () => {
    setLoading(true);
    fetchSurveySummary().then(setSummary).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceType || form.daysTaken === '') return;
    setSubmitting(true);
    setError('');
    try {
      await submitSurveyResponse({ ...form, daysTaken: Number(form.daysTaken), difficultyRating: Number(form.difficultyRating) });
      setSubmitted(true);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const maxDept = summary?.byDepartment?.length ? Math.max(...summary.byDepartment.map((d) => d.avgDays)) : 1;
  const maxReason = summary?.topRejectionReasons?.length ? Math.max(...summary.topRejectionReasons.map((r) => r.count)) : 1;

  return (
    <div className="bg-white">
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Evidence Behind the Platform</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Survey Insights: Where Applicants Actually Struggle</h1>
        <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Combines baseline pre-launch research with real, live responses from people who have applied for these
          approvals — so the pain points below aren't assumed, they're reported.
        </p>
      </section>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading survey data…
        </div>
      )}

      {!loading && summary && (
        <>
          {/* Summary strip */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
            {[
              { label: 'Total Responses', value: summary.totalResponses },
              { label: 'Baseline (pre-launch)', value: summary.baselineCount },
              { label: 'Live (real users)', value: summary.liveCount },
              { label: 'Avg. Days to Approval', value: summary.avgDaysOverall ?? '—' }
            ].map((s) => (
              <div key={s.label} className="border border-slate-100 rounded-xl p-4 text-center bg-slate-50">
                <div className="text-2xl font-extrabold text-blue-900">{s.value}</div>
                <div className="text-[11px] text-slate-500 font-semibold mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-8 mb-14">
            {/* Department-wise delay */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-800" /> Average Delay by Department (days)
              </h2>
              {summary.byDepartment.map((d) => (
                <Bar key={d.department} label={`${d.department} (${d.responses} responses, ${d.rejectionRatePercent}% rejected)`} value={d.avgDays} max={maxDept} suffix=" days" />
              ))}
            </div>

            {/* Top rejection reasons */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Most Common Document Rejection Reasons
              </h2>
              {summary.topRejectionReasons.length === 0 && <p className="text-xs text-slate-400">No rejections reported yet.</p>}
              {summary.topRejectionReasons.map((r) => (
                <Bar key={r.reason} label={r.reason} value={r.count} max={maxReason} color="bg-amber-500" />
              ))}
            </div>
          </section>

          {/* Problem category -> VyaparSetu solution mapping */}
          <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-700" /> Reported Problem Categories &amp; How VyaparSetu Solves Each
            </h2>
            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-3">Problem Category</th>
                    <th className="text-left p-3">Share of Responses</th>
                    <th className="text-left p-3">VyaparSetu Feature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summary.byChallengeCategory.map((c) => (
                    <tr key={c.category}>
                      <td className="p-3 font-semibold text-slate-800">{c.category}</td>
                      <td className="p-3 text-slate-600">{c.count} ({c.percent}%)</td>
                      <td className="p-3 text-slate-600">{c.vyaparSetuSolution}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent live responses, for transparency */}
          {summary.recentLive.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
              <h2 className="text-sm font-bold text-slate-900 mb-4">Recent Live Submissions</h2>
              <div className="space-y-2">
                {summary.recentLive.map((r, i) => (
                  <div key={i} className="border border-slate-100 rounded-lg p-3 text-xs text-slate-600 bg-white">
                    <span className="font-semibold text-slate-800">{r.respondentName}</span> — {r.serviceType} ({r.department}),
                    {' '}{r.daysTaken} days, difficulty {r.difficultyRating}/5. Biggest issue: <span className="italic">{r.biggestChallenge}</span>
                    {r.comment && <p className="mt-1 text-slate-500">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Live survey form */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 border-t border-slate-100 pt-14">
        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-blue-800" /> Share Your Experience
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Applied for a government approval before? Your response adds directly to the live data above.
        </p>

        {submitted && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 font-semibold">
            Thank you! Your response has been added to the insights above.
          </div>
        )}
        {error && <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Department</label>
              <select className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                {DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Service / Approval Applied For *</label>
              <input required className="w-full border border-slate-200 rounded-lg p-2 text-sm" placeholder="e.g. Fire NOC" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Days It Actually Took *</label>
              <input required type="number" min="0" className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={form.daysTaken} onChange={(e) => setForm({ ...form, daysTaken: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Difficulty (1 = easy, 5 = very hard)</label>
              <input type="range" min="1" max="5" className="w-full" value={form.difficultyRating} onChange={(e) => setForm({ ...form, difficultyRating: e.target.value })} />
              <div className="text-center text-xs text-slate-500">{form.difficultyRating} / 5</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input id="rejected" type="checkbox" checked={form.documentRejected} onChange={(e) => setForm({ ...form, documentRejected: e.target.checked })} />
            <label htmlFor="rejected" className="text-xs font-semibold text-slate-700">A document was rejected during this process</label>
          </div>

          {form.documentRejected && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Rejection Reason</label>
              <select className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={form.rejectionReason} onChange={(e) => setForm({ ...form, rejectionReason: e.target.value })}>
                {REJECTION_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Biggest Challenge</label>
            <select className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={form.biggestChallenge} onChange={(e) => setForm({ ...form, biggestChallenge: e.target.value })}>
              {CHALLENGES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Comments (optional)</label>
            <textarea className="w-full border border-slate-200 rounded-lg p-2 text-sm" rows={2} maxLength={500} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Your Name (optional, shown as Anonymous otherwise)</label>
            <input className="w-full border border-slate-200 rounded-lg p-2 text-sm" value={form.respondentName} onChange={(e) => setForm({ ...form, respondentName: e.target.value })} />
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-blue-900 text-white font-semibold text-sm rounded-lg py-2.5 disabled:opacity-60 cursor-pointer hover:bg-blue-800 transition-colors">
            {submitting ? 'Submitting…' : 'Submit My Experience'}
          </button>
        </form>
      </section>
    </div>
  );
};