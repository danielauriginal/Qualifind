import React, { useState, useRef, useEffect } from 'react';
import { Lead, Script, CallLog } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Phone, Mic, StopCircle, Cloud, Loader2, Check, UserX, ShieldCheck, UserCheck, ThumbsUp, ThumbsDown, Calendar, HelpCircle, FileText, ArrowRight, Mail } from 'lucide-react';
import { generateCallAnalysis } from '../services/geminiService';

type CallStep = 'CONNECT' | 'REACHED_WHOM' | 'GATEKEEPER_PATH' | 'DM_PATH' | 'INTEREST_SUBPATH' | 'APPOINTMENT' | 'PROCESSING';

interface CallWizardProps {
  lead: Lead;
  scripts: Script[];
  onClose: () => void;
  onLogCall: (log: CallLog, updatedLeadStatus?: string, appointmentDate?: string) => void;
}

export const CallWizard: React.FC<CallWizardProps> = ({ lead, scripts, onClose, onLogCall }) => {
  const [callStep, setCallStep] = useState<CallStep>('CONNECT');
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initiate tel link on mount
    if (lead.phone) {
      window.location.href = `tel:${lead.phone}`;
    }
  }, [lead.phone]);

  const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];
        
        mediaRecorderRef.current.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        
        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            setRecordingBlob(blob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Microphone access denied", err);
        alert("Microphone permission is required to record calls.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    }
  };

  const handleProcessLog = async (outcome: string) => {
    setCallStep('PROCESSING');
    if (isRecording) stopRecording();

    try {
      // Simulate Cloud Upload & Analysis
      const analysis = await generateCallAnalysis(outcome, lead.name);
      
      let finalApptDate = undefined;
      if (outcome === 'Appointment Set' && appointmentDate) {
          finalApptDate = `${appointmentDate}T${appointmentTime || '12:00'}:00`;
      }

      const newLog: CallLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        outcome: outcome,
        appointmentDate: finalApptDate,
        recordingUrl: recordingBlob ? URL.createObjectURL(recordingBlob) : undefined,
        recordingStatus: recordingBlob ? 'Uploaded' : undefined,
        analysis: analysis
      };

      // Determine new lead status based on outcome
      let newStatus = undefined;
      if (outcome === 'Appointment Set' || outcome === 'Interested') newStatus = 'Contacted';
      else if (lead.status === 'New') newStatus = 'Contacted';

      onLogCall(newLog, newStatus, finalApptDate);
      
    } catch (error) {
      console.error("Analysis failed", error);
      onClose(); // Force close on error
    }
  };

  const getInterpolatedScript = () => {
    if (!selectedScriptId) return null;
    const script = scripts.find(s => s.id === selectedScriptId);
    if (!script) return null;

    let content = script.content;
    const replacements: Record<string, string> = {
      leadName: lead.name,
      company: lead.name,
      companyName: lead.name,
      category: lead.category,
      ceo: lead.ceo || 'Decision Maker',
      ceoName: lead.ceo || 'the owner',
      myName: 'Me', 
      myCompany: 'LeadScout'
    };

    Object.entries(replacements).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });
    
    return content;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/70 flex items-center justify-center p-4 backdrop-blur-sm">
       <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full h-[600px] flex overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200">
          
          {/* Left Side: Script & Lead Info */}
          <div className="w-1/2 border-r border-slate-200 bg-slate-50 flex flex-col">
              <div className="p-4 border-b border-slate-200">
                  <h3 className="font-bold text-slate-800">{lead.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{lead.category} • {lead.ceo || 'No CEO'}</p>
              </div>
              
              <div className="p-4 border-b border-slate-200">
                 <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Select Script</label>
                 <select 
                    className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900"
                    value={selectedScriptId}
                    onChange={(e) => setSelectedScriptId(e.target.value)}
                 >
                     <option value="">-- No Script --</option>
                     {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white">
                  {selectedScriptId ? (
                      <div 
                        className="text-sm text-slate-700 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: getInterpolatedScript() || '' }}
                      />
                  ) : (
                      <div className="text-center text-slate-400 mt-10">
                          <FileText size={48} className="mx-auto mb-2 opacity-50"/>
                          <p>Select a script to view call talking points.</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Right Side: Wizard Flow & Controls */}
          <div className="w-1/2 flex flex-col">
              <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-green-100 rounded-full text-green-600 animate-pulse">
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Call in progress</h3>
                    <p className="text-xs text-slate-500">Rec: {isRecording ? <span className="text-red-500 font-bold animate-pulse">ON</span> : 'OFF'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        title={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-white">
                {callStep === 'PROCESSING' && (
                   <div className="flex flex-col items-center justify-center h-full text-center">
                      <Cloud size={48} className="text-blue-500 animate-bounce mb-4" />
                      <h4 className="text-lg font-bold text-slate-800 mb-2">Analyzing Call Data...</h4>
                      <p className="text-sm text-slate-500 mb-6">Uploading recording and generating coaching insights.</p>
                      <Loader2 size={24} className="animate-spin text-blue-600" />
                   </div>
                )}

                {callStep === 'CONNECT' && (
                    <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Did you reach someone?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('REACHED_WHOM')} className="p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center group-hover:bg-green-200">
                              <Check size={20} />
                            </div>
                            <span className="font-medium text-slate-700">Yes, Connected</span>
                          </button>
                          <button onClick={() => handleProcessLog('No Answer')} className="p-4 rounded-xl border border-slate-200 hover:border-red-500 hover:bg-red-50 transition-all flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:bg-red-200">
                              <UserX size={20} />
                            </div>
                            <span className="font-medium text-slate-700">No Answer</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'REACHED_WHOM' && (
                    <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Who are you speaking with?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('GATEKEEPER_PATH')} className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                            <ShieldCheck size={24} className="text-blue-500" />
                            <span className="font-medium text-slate-700">Gatekeeper</span>
                            <span className="text-xs text-slate-400">Receptionist, Assistant</span>
                          </button>
                          <button onClick={() => setCallStep('DM_PATH')} className="p-4 rounded-xl border border-slate-200 hover:border-purple-500 hover:bg-purple-50 transition-all flex flex-col items-center gap-2">
                            <UserCheck size={24} className="text-purple-500" />
                            <span className="font-medium text-slate-700">Decision Maker</span>
                            <span className="text-xs text-slate-400">CEO, Owner, Manager</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'GATEKEEPER_PATH' && (
                    <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Did they put you through?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('DM_PATH')} className="p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                            <Check size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700">Yes, transferred</span>
                          </button>
                          <button onClick={() => handleProcessLog('Gatekeeper Blocked')} className="p-4 rounded-xl border border-slate-200 hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-2">
                            <X size={24} className="text-orange-500" />
                            <span className="font-medium text-slate-700">No, blocked</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'DM_PATH' && (
                    <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Was there interest?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('INTEREST_SUBPATH')} className="p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center gap-2">
                            <ThumbsUp size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700">Yes, Interested</span>
                          </button>
                          <button onClick={() => handleProcessLog('Not Interested')} className="p-4 rounded-xl border border-slate-200 hover:border-slate-500 hover:bg-slate-50 transition-all flex flex-col items-center gap-2">
                            <ThumbsDown size={24} className="text-slate-500" />
                            <span className="font-medium text-slate-700">No Interest</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'INTEREST_SUBPATH' && (
                   <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Great! What's next?</h4>
                      <div className="grid grid-cols-1 gap-4">
                          <button onClick={() => setCallStep('APPOINTMENT')} className="p-4 rounded-xl border border-slate-200 hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-between group">
                             <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 rounded-lg text-green-600"><Calendar size={20}/></div>
                                <div className="text-left">
                                  <span className="block font-bold text-slate-700">Book Meeting</span>
                                  <span className="text-xs text-slate-500">Schedule a specific time</span>
                                </div>
                             </div>
                             <ArrowRight size={18} className="text-slate-300 group-hover:text-green-500"/>
                          </button>
                          <button onClick={() => handleProcessLog('Interested')} className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group">
                             <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Mail size={20}/></div>
                                <div className="text-left">
                                  <span className="block font-bold text-slate-700">Send Info / Follow Up</span>
                                  <span className="text-xs text-slate-500">Lead wants material first</span>
                                </div>
                             </div>
                             <ArrowRight size={18} className="text-slate-300 group-hover:text-blue-500"/>
                          </button>
                      </div>
                   </div>
                )}

                {callStep === 'APPOINTMENT' && (
                    <div className="space-y-6 text-center">
                      <h4 className="text-lg font-medium text-slate-800">Set Appointment Date</h4>
                      
                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Date</label>
                            <input 
                                type="date" 
                                value={appointmentDate} 
                                onChange={e => setAppointmentDate(e.target.value)}
                                className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900" 
                            />
                          </div>
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 mb-1">Time</label>
                            <input 
                                type="time" 
                                value={appointmentTime} 
                                onChange={e => setAppointmentTime(e.target.value)}
                                className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900" 
                            />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleProcessLog('Appointment Set')} 
                            disabled={!appointmentDate}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!appointmentDate ? 'border-slate-200 opacity-50 cursor-not-allowed' : 'border-slate-200 hover:border-green-500 hover:bg-green-50'}`}
                          >
                            <Calendar size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700">Confirm Booking</span>
                          </button>
                          <button onClick={() => handleProcessLog('Interested')} className="p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center gap-2">
                            <HelpCircle size={24} className="text-blue-500" />
                            <span className="font-medium text-slate-700">Cancel Date</span>
                          </button>
                      </div>
                    </div>
                )}
              </div>
          </div>
       </div>
    </div>
  );
};