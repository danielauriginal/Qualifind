
import React, { useState, useRef, useEffect } from 'react';
import { Lead, Script, CallLog, CallAnalysis } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { X, Phone, Mic, StopCircle, Cloud, Loader2, Check, UserX, ShieldCheck, UserCheck, ThumbsUp, ThumbsDown, Calendar, HelpCircle, FileText, ArrowRight, Mail, PenTool, Sparkles, Lock } from 'lucide-react';
import { generateCallAnalysis } from '../services/geminiService';
import { Button } from './Button';

type CallStep = 'CONNECT' | 'REACHED_WHOM' | 'GATEKEEPER_PATH' | 'DM_PATH' | 'INTEREST_SUBPATH' | 'APPOINTMENT' | 'SUMMARY';

interface CallWizardProps {
  lead: Lead;
  scripts: Script[];
  onClose: () => void;
  onLogCall: (log: CallLog, updatedLeadStatus?: string, appointmentDate?: string) => void;
  isPremium?: boolean; // For future paywall integration
}

export const CallWizard: React.FC<CallWizardProps> = ({ lead, scripts, onClose, onLogCall, isPremium = true }) => {
  const [callStep, setCallStep] = useState<CallStep>('CONNECT');
  const [selectedScriptId, setSelectedScriptId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  
  // Data Collection State
  const [notes, setNotes] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [manualSentiment, setManualSentiment] = useState<'Positive' | 'Neutral' | 'Negative' | null>(null);
  const [generatedAnalysis, setGeneratedAnalysis] = useState<CallAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
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

  const handleOutcomeSelection = async (outcome: string) => {
      setSelectedOutcome(outcome);
      if (isRecording) stopRecording();
      setCallStep('SUMMARY');
      
      // Trigger Analysis
      setIsAnalyzing(true);
      try {
          const analysis = await generateCallAnalysis(outcome, lead.name);
          setGeneratedAnalysis(analysis);
          // Set initial sentiment based on AI if not manually set
          if (!manualSentiment) setManualSentiment(analysis.sentiment);
      } catch (e) {
          console.error("Analysis failed", e);
      } finally {
          setIsAnalyzing(false);
      }
  };

  const handleFinalSave = () => {
      let finalApptDate = undefined;
      if (selectedOutcome === 'Appointment Set' && appointmentDate) {
          finalApptDate = `${appointmentDate}T${appointmentTime || '12:00'}:00`;
      }

      // Merge manual input with AI analysis
      const finalAnalysis: CallAnalysis = {
          callScore: generatedAnalysis?.callScore || 50,
          scriptAdherence: generatedAnalysis?.scriptAdherence || 0,
          confidence: generatedAnalysis?.confidence || 'Medium',
          sentiment: manualSentiment || generatedAnalysis?.sentiment || 'Neutral',
          keyTakeaways: notes ? notes.split('\n').filter(n => n.trim().length > 0) : generatedAnalysis?.keyTakeaways || [],
          userNotes: notes
      };

      const newLog: CallLog = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        outcome: selectedOutcome,
        appointmentDate: finalApptDate,
        recordingUrl: recordingBlob ? URL.createObjectURL(recordingBlob) : undefined,
        recordingStatus: recordingBlob ? 'Uploaded' : undefined,
        analysis: finalAnalysis,
        notes: notes // Redundant but good for backward compat
      };

      // Determine new lead status based on outcome
      let newStatus = undefined;
      if (selectedOutcome === 'Appointment Set' || selectedOutcome === 'Interested') newStatus = 'Contacted';
      else if (lead.status === 'New') newStatus = 'Contacted';

      onLogCall(newLog, newStatus, finalApptDate);
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
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-5xl w-full h-[700px] flex overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
          
          {/* Left Side: Script & Notes */}
          <div className="w-5/12 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 className="font-bold text-slate-800 dark:text-white">{lead.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lead.category} • {lead.ceo || 'No CEO'}</p>
              </div>
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                 <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase block mb-2">Select Script</label>
                 <select 
                    className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    value={selectedScriptId}
                    onChange={(e) => setSelectedScriptId(e.target.value)}
                 >
                     <option value="">-- No Script --</option>
                     {scripts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 bg-white dark:bg-slate-800">
                  {selectedScriptId ? (
                      <div 
                        className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans"
                        dangerouslySetInnerHTML={{ __html: getInterpolatedScript() || '' }}
                      />
                  ) : (
                      <div className="text-center text-slate-400 mt-10">
                          <FileText size={48} className="mx-auto mb-2 opacity-50"/>
                          <p>Select a script to view call talking points.</p>
                      </div>
                  )}
              </div>
              
              {/* Key Takeaways Area */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <label className="flex items-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">
                      <PenTool size={12} className="mr-1" /> Key Takeaways
                  </label>
                  <textarea
                      className="w-full h-24 border border-slate-300 dark:border-slate-600 rounded p-2 text-sm bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                      placeholder="Jot down notes, objections, or important info..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                  />
              </div>
          </div>

          {/* Right Side: Wizard Flow & Controls */}
          <div className="w-7/12 flex flex-col">
              <div className="bg-white dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-10">
                <div className="flex items-center space-x-2">
                  <div className={`p-2 rounded-full ${isRecording ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{callStep === 'SUMMARY' ? 'Call Summary' : 'Call in progress'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {callStep === 'SUMMARY' ? 'Review & Save' : isRecording ? 'Recording Audio...' : 'Audio Off'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                    {callStep !== 'SUMMARY' && (
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`p-2 rounded-full transition-colors ${isRecording ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'}`}
                            title={isRecording ? "Stop Recording" : "Start Recording"}
                        >
                            {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                        </button>
                    )}
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-800 relative">
                
                {/* SUMMARY STEP */}
                {callStep === 'SUMMARY' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium mb-2">
                                Outcome: {selectedOutcome}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Call Review</h2>
                        </div>

                        {/* AI Analysis Card (Premium Feature) */}
                        <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-slate-700 dark:to-slate-800 rounded-xl border border-purple-100 dark:border-slate-600 p-5 relative overflow-hidden">
                            {!isPremium && (
                                <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                                    <Lock size={24} className="text-slate-400 mb-2"/>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">AI Insights are Premium</p>
                                    <Button size="sm" className="mt-2">Upgrade to Unlock</Button>
                                </div>
                            )}
                            
                            <h4 className="flex items-center text-sm font-bold text-purple-700 dark:text-purple-300 mb-4">
                                <Sparkles size={16} className="mr-2" /> AI Call Analysis
                            </h4>
                            
                            {isAnalyzing ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 size={24} className="animate-spin text-purple-600 mr-2" />
                                    <span className="text-sm text-purple-600">Analyzing conversation...</span>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-slate-800 dark:text-white">{generatedAnalysis?.callScore}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Call Score</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-slate-800 dark:text-white">{generatedAnalysis?.scriptAdherence}%</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Adherence</div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900/50 p-3 rounded-lg text-center">
                                        <div className="text-lg font-bold text-slate-800 dark:text-white">{generatedAnalysis?.confidence}</div>
                                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">Confidence</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sentiment Selector */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Call Sentiment</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['Positive', 'Neutral', 'Negative'] as const).map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setManualSentiment(s)}
                                        className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                                            manualSentiment === s 
                                            ? s === 'Positive' ? 'bg-green-50 border-green-500 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                                            : s === 'Negative' ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                            : 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600'
                                        }`}
                                    >
                                        {s === 'Positive' && <ThumbsUp size={20} className="mb-1"/>}
                                        {s === 'Neutral' && <HelpCircle size={20} className="mb-1"/>}
                                        {s === 'Negative' && <ThumbsDown size={20} className="mb-1"/>}
                                        <span className="text-xs font-medium">{s}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="pt-4 flex items-center space-x-4 border-t border-slate-100 dark:border-slate-700 mt-8">
                            <button onClick={() => setCallStep('CONNECT')} className="text-slate-500 dark:text-slate-400 text-sm hover:underline">
                                Back to Flow
                            </button>
                            <Button onClick={handleFinalSave} className="flex-1 w-full" disabled={isAnalyzing}>
                                <Check size={18} className="mr-2" /> Save Call Log
                            </Button>
                        </div>
                    </div>
                )}

                {callStep === 'CONNECT' && (
                    <div className="space-y-6 text-center animate-in fade-in zoom-in duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Did you reach someone?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('REACHED_WHOM')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center group-hover:bg-green-200 dark:group-hover:bg-green-900/50">
                              <Check size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">Yes, Connected</span>
                          </button>
                          <button onClick={() => handleOutcomeSelection('No Answer')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex flex-col items-center gap-2 group">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center group-hover:bg-red-200 dark:group-hover:bg-red-900/50">
                              <UserX size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">No Answer</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'REACHED_WHOM' && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Who are you speaking with?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('GATEKEEPER_PATH')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center gap-2">
                            <ShieldCheck size={24} className="text-blue-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Gatekeeper</span>
                            <span className="text-xs text-slate-400">Receptionist, Assistant</span>
                          </button>
                          <button onClick={() => setCallStep('DM_PATH')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all flex flex-col items-center gap-2">
                            <UserCheck size={24} className="text-purple-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Decision Maker</span>
                            <span className="text-xs text-slate-400">CEO, Owner, Manager</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'GATEKEEPER_PATH' && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Did they put you through?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('DM_PATH')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex flex-col items-center gap-2">
                            <Check size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Yes, transferred</span>
                          </button>
                          <button onClick={() => handleOutcomeSelection('Gatekeeper Blocked')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all flex flex-col items-center gap-2">
                            <X size={24} className="text-orange-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">No, blocked</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'DM_PATH' && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Was there interest?</h4>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCallStep('INTEREST_SUBPATH')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex flex-col items-center gap-2">
                            <ThumbsUp size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Yes, Interested</span>
                          </button>
                          <button onClick={() => handleOutcomeSelection('Not Interested')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all flex flex-col items-center gap-2">
                            <ThumbsDown size={24} className="text-slate-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">No Interest</span>
                          </button>
                      </div>
                    </div>
                )}

                {callStep === 'INTEREST_SUBPATH' && (
                   <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Great! What's next?</h4>
                      <div className="grid grid-cols-1 gap-4">
                          <button onClick={() => setCallStep('APPOINTMENT')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all flex items-center justify-between group">
                             <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400"><Calendar size={20}/></div>
                                <div className="text-left">
                                  <span className="block font-bold text-slate-700 dark:text-slate-300">Book Meeting</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Schedule a specific time</span>
                                </div>
                             </div>
                             <ArrowRight size={18} className="text-slate-300 dark:text-slate-500 group-hover:text-green-500"/>
                          </button>
                          <button onClick={() => handleOutcomeSelection('Interested')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-between group">
                             <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400"><Mail size={20}/></div>
                                <div className="text-left">
                                  <span className="block font-bold text-slate-700 dark:text-slate-300">Send Info / Follow Up</span>
                                  <span className="text-xs text-slate-500 dark:text-slate-400">Lead wants material first</span>
                                </div>
                             </div>
                             <ArrowRight size={18} className="text-slate-300 dark:text-slate-500 group-hover:text-blue-500"/>
                          </button>
                      </div>
                   </div>
                )}

                {callStep === 'APPOINTMENT' && (
                    <div className="space-y-6 text-center animate-in fade-in slide-in-from-right-4 duration-200">
                      <h4 className="text-lg font-medium text-slate-800 dark:text-white">Set Appointment Date</h4>
                      
                      <div className="space-y-3 bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg">
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Date</label>
                            <input 
                                type="date" 
                                value={appointmentDate} 
                                onChange={e => setAppointmentDate(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                            />
                          </div>
                          <div className="text-left">
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Time</label>
                            <input 
                                type="time" 
                                value={appointmentTime} 
                                onChange={e => setAppointmentTime(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" 
                            />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <button 
                            onClick={() => handleOutcomeSelection('Appointment Set')} 
                            disabled={!appointmentDate}
                            className={`p-4 rounded-xl border transition-all flex flex-col items-center gap-2 ${!appointmentDate ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed' : 'border-slate-200 dark:border-slate-700 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                          >
                            <Calendar size={24} className="text-green-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Confirm Booking</span>
                          </button>
                          <button onClick={() => handleOutcomeSelection('Interested')} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex flex-col items-center gap-2">
                            <HelpCircle size={24} className="text-blue-500" />
                            <span className="font-medium text-slate-700 dark:text-slate-300">Cancel Date</span>
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
