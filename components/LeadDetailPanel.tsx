import React from 'react';
import { X, Globe, Phone, Mail, User, CheckCircle, AlertCircle, HelpCircle, FileText, ShieldCheck, Check, History, CalendarClock, Trophy, PlayCircle } from 'lucide-react';
import { Lead, EmailStatus } from '../types';
import { Button } from './Button';

interface LeadDetailPanelProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: (updatedLead: Lead) => void;
  onStartCall?: (lead: Lead) => void;
}

export const LeadDetailPanel: React.FC<LeadDetailPanelProps> = ({ lead, onClose, onUpdate, onStartCall }) => {
  const [formData, setFormData] = React.useState<Lead | null>(null);

  React.useEffect(() => {
    setFormData(lead);
  }, [lead]);

  if (!lead || !formData) return null;

  const handleChange = (field: keyof Lead, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  const ConfidenceBadge = ({ level }: { level: string }) => {
    const colors = {
      High: 'bg-green-100 text-green-800',
      Medium: 'bg-yellow-100 text-yellow-800',
      Low: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[level as keyof typeof colors]}`}>
        {level} Confidence
      </span>
    );
  };

  const EmailStatusBadge = ({ status }: { status?: EmailStatus }) => {
    if (!status) return null;
    const config = {
      Validated: { color: 'text-green-600 bg-green-50 border-green-200', icon: ShieldCheck, label: 'Validated' },
      Guessed: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: HelpCircle, label: 'Guessed Pattern' },
      Tested: { color: 'text-blue-600 bg-blue-50 border-blue-200', icon: Check, label: 'Manually Tested' },
    };
    const c = config[status];
    const Icon = c.icon;
    
    return (
        <span className={`flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${c.color} ml-2`}>
            <Icon size={10} className="mr-1" /> {c.label}
        </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/50 transition-opacity" onClick={onClose} />
        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              <div className="bg-slate-50 px-4 py-6 sm:px-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{formData.name}</h2>
                    <p className="text-sm text-slate-500 mt-1">{formData.category} • {formData.address}</p>
                  </div>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="rounded-md bg-transparent text-slate-400 hover:text-slate-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                     <select 
                       value={formData.status} 
                       onChange={(e) => handleChange('status', e.target.value)}
                       className="text-sm border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white text-slate-900"
                     >
                       <option value="New">New</option>
                       <option value="Reviewed">Reviewed</option>
                       <option value="Contacted">Contacted</option>
                       <option value="Invalid">Invalid</option>
                     </select>
                     <ConfidenceBadge level={formData.confidence} />
                   </div>
                   
                   {/* Lead Score Indicator */}
                   <div className="flex items-center space-x-2 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
                      <Trophy size={14} className={formData.leadScore && formData.leadScore > 75 ? "text-yellow-500" : "text-slate-400"} />
                      <span className="text-sm font-bold text-slate-700">{formData.leadScore || 0}</span>
                      <span className="text-[10px] text-slate-400 uppercase">Score</span>
                   </div>
                </div>
              </div>

              <div className="relative flex-1 py-6 px-4 sm:px-6 space-y-6">
                
                {/* Company Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Company Details</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center">
                      <FileText size={14} className="mr-1" /> Description
                    </label>
                    <textarea
                        rows={2}
                        value={formData.companyDescription || ''}
                        onChange={(e) => handleChange('companyDescription', e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                        placeholder="Short description of the company..."
                    />
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Contact Information</h3>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center">
                      <Globe size={14} className="mr-1" /> Website
                    </label>
                    <div className="flex space-x-2">
                       <input 
                        type="text" 
                        value={formData.website || ''} 
                        onChange={(e) => handleChange('website', e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                      />
                      {formData.website && (
                         <a href={formData.website} target="_blank" rel="noreferrer" className="flex items-center justify-center px-3 border border-slate-300 rounded hover:bg-slate-50">
                           <Globe size={16} className="text-slate-600" />
                         </a>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-medium text-slate-500 uppercase flex items-center">
                        <Mail size={14} className="mr-1" /> Email Address
                        </label>
                        <EmailStatusBadge status={formData.emailStatus} />
                    </div>
                    <div className="flex space-x-2">
                        <input 
                        type="email" 
                        value={formData.email || ''} 
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                        placeholder="No email found"
                        />
                         {formData.email && (
                            <a href={`mailto:${formData.email}`} className="flex items-center justify-center px-3 border border-slate-300 rounded hover:bg-slate-50 text-blue-600">
                                <Mail size={16} />
                            </a>
                        )}
                        <select
                            value={formData.emailStatus || ''}
                            onChange={(e) => handleChange('emailStatus', e.target.value || undefined)}
                            className="text-xs border-slate-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 w-24 bg-white text-slate-900"
                        >
                            <option value="">Status...</option>
                            <option value="Validated">Validated</option>
                            <option value="Guessed">Guessed</option>
                            <option value="Tested">Tested</option>
                        </select>
                    </div>
                  </div>

                   <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center">
                      <Phone size={14} className="mr-1" /> Phone Number
                    </label>
                    <div className="flex space-x-2">
                      <input 
                        type="text" 
                        value={formData.phone || ''} 
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                      />
                      {formData.phone && onStartCall && (
                        <Button 
                          onClick={() => onStartCall(formData)}
                          size="sm"
                          className="px-3"
                          title="Start Call"
                        >
                          <Phone size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Decision Maker */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Decision Maker</h3>
                   <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-500 uppercase flex items-center">
                      <User size={14} className="mr-1" /> CEO / Owner
                    </label>
                    <input 
                      type="text" 
                      value={formData.ceo || ''} 
                      onChange={(e) => handleChange('ceo', e.target.value)}
                      className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                      placeholder="Name not found"
                    />
                  </div>
                </div>

                 {/* Call History */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 border-b pb-2 flex items-center">
                    <History size={16} className="mr-2" />
                    Call History
                  </h3>
                  {(!formData.callLogs || formData.callLogs.length === 0) ? (
                    <div className="text-center py-4 bg-slate-50 rounded-lg border border-slate-200 border-dashed">
                       <p className="text-xs text-slate-400 italic">No calls recorded yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.callLogs.slice().reverse().map((log) => (
                        <div key={log.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                           <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center space-x-2">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                    log.outcome.includes('Appointment') ? 'bg-green-100 text-green-700' :
                                    log.outcome.includes('No Answer') ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {log.outcome}
                                </span>
                                {log.recordingStatus === 'Uploaded' && (
                                    <span title="Recording saved to cloud" className="text-blue-500">
                                        <PlayCircle size={14} />
                                    </span>
                                )}
                             </div>
                             <span className="text-[10px] text-slate-400 flex items-center">
                               <CalendarClock size={10} className="mr-1" />
                               {new Date(log.timestamp).toLocaleString()}
                             </span>
                           </div>
                           
                           {/* AI Analysis Snapshot */}
                           {log.analysis && (
                               <div className="mb-2 p-2 bg-slate-50 rounded border border-slate-100 flex justify-between items-center text-xs">
                                   <div>
                                       <span className="text-slate-400 mr-1">Score:</span>
                                       <span className="font-bold text-slate-700">{log.analysis.callScore}/100</span>
                                   </div>
                                   <div>
                                       <span className="text-slate-400 mr-1">Adherence:</span>
                                       <span className="font-bold text-slate-700">{log.analysis.scriptAdherence}%</span>
                                   </div>
                                   <div>
                                       <span className="text-slate-400 mr-1">Sentiment:</span>
                                       <span className={`font-bold ${
                                           log.analysis.sentiment === 'Positive' ? 'text-green-600' : 
                                           log.analysis.sentiment === 'Negative' ? 'text-red-600' : 'text-slate-600'
                                       }`}>
                                           {log.analysis.sentiment}
                                       </span>
                                   </div>
                               </div>
                           )}

                           {log.notes && <p className="text-xs text-slate-600 mt-1">{log.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                 {/* Notes */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-slate-900 border-b pb-2">Notes & Tags</h3>
                  <textarea
                    rows={4}
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2 bg-white text-slate-900"
                    placeholder="Add custom notes here..."
                  />
                </div>

                {/* Source Metadata */}
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 mb-2">Metadata</h4>
                    <p className="text-xs text-slate-400 truncate">Source: {formData.sourceUrl || 'Google Maps'}</p>
                    <p className="text-xs text-slate-400">Rating: {formData.rating} stars ({formData.reviewCount} reviews)</p>
                 </div>

              </div>

              <div className="flex shrink-0 justify-end px-4 py-4 bg-slate-50 border-t border-slate-200">
                <Button variant="secondary" onClick={onClose} className="mr-3">Cancel</Button>
                <Button variant="primary" onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};