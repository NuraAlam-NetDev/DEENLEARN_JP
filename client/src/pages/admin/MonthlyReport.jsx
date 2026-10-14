import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';

// Download the month's report as a PDF: revenue, refunds, enrollments, new students, what is owed, overdue, top courses
export default function MonthlyReport() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-bold text-brand-800">Monthly report</h1>
        <p className="mt-1 text-slate-600">A PDF for your accounts or the bank. Revenue is net of refunds.</p>
      </div>
      <Card className="flex flex-wrap items-end gap-3 p-5">
        <label className="text-sm">
          <span className="mb-1 block font-medium text-slate-700">Month</span>
          <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
            className="h-10 rounded-lg border border-brand-200 bg-white px-3 text-sm" />
        </label>
        <a href={`/api/admin/reports/monthly.pdf?month=${encodeURIComponent(month)}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-10 items-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800">
          Download PDF
        </a>
      </Card>
    </div>
  );
}
