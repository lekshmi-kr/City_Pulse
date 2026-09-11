import React, { useState } from 'react';
import type { ZoneData } from '@/data/scenarios';
import { AlertTriangle, MapPin, X, Send } from 'lucide-react';

export interface CitizenReport {
  id: string;
  zoneId: string;
  zoneName: string;
  issueType: 'waterlogging' | 'traffic' | 'other';
  description: string;
  position: [number, number];
  timestamp: string;
}

interface CitizenReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  zones: ZoneData[];
  onSubmitReport: (report: CitizenReport) => void;
}

export default function CitizenReportModal({
  isOpen,
  onClose,
  zones,
  onSubmitReport,
}: CitizenReportModalProps) {
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0]?.id || 'thampanoor');
  const [issueType, setIssueType] = useState<'waterlogging' | 'traffic' | 'other'>('waterlogging');
  const [description, setDescription] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const zone = zones.find((z) => z.id === selectedZoneId) || zones[0];
    const newReport: CitizenReport = {
      id: `report-${Date.now()}`,
      zoneId: zone.id,
      zoneName: zone.name,
      issueType,
      description: description.trim() || `Reported ${issueType} near ${zone.name}`,
      position: zone.position,
      timestamp: new Date().toISOString(),
    };

    onSubmitReport(newReport);
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 ring-1 ring-amber-500/40">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100">Report a City Incident</h3>
            <p className="text-xs text-slate-400">Citizen crowdsourcing digital twin entry</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Location / Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => setSelectedZoneId(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name} {z.isLowLying ? '(Low-Lying Area)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Incident Category
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setIssueType('waterlogging')}
                className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                  issueType === 'waterlogging'
                    ? 'border-sky-500 bg-sky-500/20 text-sky-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                🌊 Waterlogging
              </button>
              <button
                type="button"
                onClick={() => setIssueType('traffic')}
                className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                  issueType === 'traffic'
                    ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                🚗 Traffic Jam
              </button>
              <button
                type="button"
                onClick={() => setIssueType('other')}
                className={`rounded-xl border p-2.5 text-center text-xs font-semibold transition-all ${
                  issueType === 'other'
                    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                    : 'border-slate-800 bg-slate-800/40 text-slate-400 hover:border-slate-700'
                }`}
              >
                ⚠️ Other Hazard
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Short Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Standing water near underpass, traffic at standstill..."
              className="w-full rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2 text-xs font-bold text-slate-950 hover:bg-sky-400 transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              Submit Incident Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
