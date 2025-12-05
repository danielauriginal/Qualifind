import React, { useState, useRef, useEffect } from 'react';
import { Script } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { Edit, Trash2, Plus, Sparkles, Save, X, FileText, Copy, Check, Eye, EyeOff, Bold, Italic, Highlighter, Eraser } from 'lucide-react';
import { Button } from './Button';
import { generateColdCallScript } from '../services/geminiService';

interface ScriptsProps {
  scripts: Script[];
  onAddScript: (script: Script) => void;
  onUpdateScript: (script: Script) => void;
  onDeleteScript: (id: string) => void;
}

// Dummy data for live preview
const PREVIEW_DATA: Record<string, string> = {
  leadName: "John Smith",
  company: "Nebula Innovations",
  companyName: "Nebula Innovations",
  category: "Software Startup",
  ceo: "Sarah Miller",
  ceoName: "Sarah Miller",
  myName: "Alex",
  myCompany: "LeadScout AI"
};

const THEMES = {
  slate: 'bg-slate-50 border-slate-200',
  blue: 'bg-blue-50 border-blue-200',
  green: 'bg-green-50 border-green-200',
  purple: 'bg-purple-50 border-purple-200',
  amber: 'bg-amber-50 border-amber-200',
};

const HEADER_THEMES = {
  slate: 'bg-white border-b border-slate-100',
  blue: 'bg-blue-100 border-b border-blue-200 text-blue-900',
  green: 'bg-green-100 border-b border-green-200 text-green-900',
  purple: 'bg-purple-100 border-b border-purple-200 text-purple-900',
  amber: 'bg-amber-100 border-b border-amber-200 text-amber-900',
};

const PILL_CLASS = "inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold mx-0.5 select-none align-middle";

export const Scripts: React.FC<ScriptsProps> = ({ scripts, onAddScript, onUpdateScript, onDeleteScript }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Script>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState({ goal: '', tone: '' });
  const [showAiModal, setShowAiModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<Record<string, boolean>>({});

  const editorRef = useRef<HTMLDivElement>(null);

  // Focus editor when entering edit mode
  useEffect(() => {
    if (editingId && editorRef.current) {
        editorRef.current.focus();
    }
  }, [editingId]);

  const handleEdit = (script: Script) => {
    setEditingId(script.id);
    setEditForm({ ...script });
  };

  const handleCreateNew = () => {
    const newId = uuidv4();
    const newScript: Script = {
      id: newId,
      name: 'Untitled Script',
      // Initial HTML content with a pill
      content: `Hi <span contenteditable="false" class="${PILL_CLASS}">{{leadName}}</span>, this is <span contenteditable="false" class="${PILL_CLASS}">{{myName}}</span> from...`,
      category: 'Cold Call',
      themeColor: 'slate',
    };
    onAddScript(newScript);
    handleEdit(newScript);
  };

  const handleSave = () => {
    if (editingId && editForm.name) {
      // Get content from ref to ensure latest HTML
      const content = editorRef.current ? editorRef.current.innerHTML : editForm.content || '';
      onUpdateScript({ ...editForm, content } as Script);
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Editor Commands
  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
        editorRef.current.focus();
        setEditForm(prev => ({ ...prev, content: editorRef.current?.innerHTML || '' }));
    }
  };

  const insertVariable = (variable: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    
    editor.focus();
    
    // Create the pill HTML
    const pillHtml = `<span contenteditable="false" class="${PILL_CLASS}">{{${variable}}}</span>\u00A0`;
    
    // Insert at cursor
    const success = document.execCommand('insertHTML', false, pillHtml);
    
    if (!success) {
        // Fallback append
        editor.innerHTML += pillHtml;
    }
    
    setEditForm(prev => ({ ...prev, content: editor.innerHTML }));
  };

  const formatVariablesInHtml = (text: string) => {
      // Helper to convert plain {{var}} to pills in AI text
      return text.replace(/{{(.*?)}}/g, (match, p1) => {
          const variable = p1.trim();
          return `<span contenteditable="false" class="${PILL_CLASS}">{{${variable}}}</span>`;
      });
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const generatedText = await generateColdCallScript(aiPrompt.goal, aiPrompt.tone);
      const formattedHtml = formatVariablesInHtml(generatedText).replace(/\n/g, '<br/>');
      
      const newScript: Script = {
        id: uuidv4(),
        name: aiPrompt.goal.substring(0, 30) || 'AI Generated Script',
        content: formattedHtml,
        category: 'AI Generated',
        themeColor: 'purple'
      };
      onAddScript(newScript);
      setShowAiModal(false);
      setAiPrompt({ goal: '', tone: '' });
    } catch (e) {
      alert("Failed to generate script");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (htmlContent: string, id: string) => {
      // Strip HTML tags for clipboard copy, but keep variable names
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      const text = tempDiv.textContent || tempDiv.innerText || '';
      
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
  };

  const togglePreview = (id: string) => {
      setPreviewMode(prev => ({ ...prev, [id]: !prev[id] }));
  };

  /**
   * Interpolates the HTML string with preview data.
   * Since variables are in spans: <span ...>{{leadName}}</span>
   * We need to replace the inner text of these spans or the whole span.
   * To keep the "pill" look in preview, we just replace the inner text {{leadName}} with the value.
   */
  const renderPreview = (htmlContent: string) => {
      let previewHtml = htmlContent;
      Object.entries(PREVIEW_DATA).forEach(([key, value]) => {
          // Replace {{key}} with value globally
          // This works even inside the span
          const regex = new RegExp(`{{${key}}}`, 'g');
          previewHtml = previewHtml.replace(regex, value);
      });
      return previewHtml;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Sales Scripts</h2>
           <p className="text-slate-500">Manage rich-text templates. Use smart variables for dynamic calls.</p>
        </div>
        <div className="flex space-x-3">
            <Button variant="secondary" onClick={() => setShowAiModal(true)} className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100">
                <Sparkles size={16} className="mr-2" /> AI Assistant
            </Button>
            <Button onClick={handleCreateNew}>
                <Plus size={16} className="mr-2" /> New Script
            </Button>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
         <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Sparkles size={18} className="mr-2 text-purple-600"/> Generate Script with AI</h3>
                    <button onClick={() => setShowAiModal(false)}><X size={20} className="text-slate-400"/></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">What is the goal of this call?</label>
                        <textarea 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                            rows={3}
                            placeholder="e.g. Sell SEO services to dentists, get a 15 min demo meeting."
                            value={aiPrompt.goal}
                            onChange={e => setAiPrompt({...aiPrompt, goal: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Desired Tone</label>
                        <select 
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white text-slate-900"
                            value={aiPrompt.tone}
                            onChange={e => setAiPrompt({...aiPrompt, tone: e.target.value})}
                        >
                            <option value="Professional">Professional</option>
                            <option value="Friendly & Casual">Friendly & Casual</option>
                            <option value="High Energy">High Energy</option>
                        </select>
                    </div>
                    <Button onClick={handleGenerateAI} isLoading={isGenerating} className="w-full">
                        Generate Script
                    </Button>
                </div>
            </div>
         </div>
      )}

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scripts.map(script => {
          const theme = script.themeColor || 'slate';
          return (
            <div key={script.id} className={`rounded-xl border shadow-sm transition-all overflow-hidden flex flex-col ${editingId === script.id ? 'border-blue-500 ring-1 ring-blue-500 bg-white col-span-1 lg:col-span-2' : THEMES[theme]}`}>
              {editingId === script.id ? (
                  // EDIT MODE
                  <div className="p-4 sm:p-6 space-y-4 flex-1 flex flex-col h-full">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={e => setEditForm({...editForm, name: e.target.value})}
                              className="text-xl font-bold text-slate-900 border-none focus:ring-0 p-0 w-full bg-transparent placeholder-slate-400"
                              placeholder="Script Name"
                          />
                          <div className="flex items-center space-x-2">
                            <select 
                                value={editForm.category}
                                onChange={e => setEditForm({...editForm, category: e.target.value})}
                                className="text-xs border-slate-300 rounded-md py-1 px-2 bg-white text-slate-900"
                            >
                                <option value="Cold Call">Cold Call</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Gatekeeper">Gatekeeper</option>
                            </select>
                            <div className="flex space-x-1 border-l pl-2 border-slate-200">
                                {(['slate', 'blue', 'green', 'purple', 'amber'] as const).map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => setEditForm({...editForm, themeColor: c})}
                                        className={`w-5 h-5 rounded-full border border-slate-200 ${c === 'slate' ? 'bg-slate-100' : `bg-${c}-200`} ${editForm.themeColor === c ? 'ring-2 ring-offset-1 ring-slate-400' : ''}`}
                                    />
                                ))}
                            </div>
                          </div>
                      </div>
                      
                      {/* Formatting Toolbar */}
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                          <button onClick={() => executeCommand('bold')} className="p-1.5 hover:bg-white rounded text-slate-600" title="Bold"><Bold size={16}/></button>
                          <button onClick={() => executeCommand('italic')} className="p-1.5 hover:bg-white rounded text-slate-600" title="Italic"><Italic size={16}/></button>
                          <div className="w-px h-4 bg-slate-300 mx-1"></div>
                          <button onClick={() => executeCommand('backColor', '#fef3c7')} className="p-1.5 hover:bg-white rounded text-amber-600" title="Highlight Yellow"><Highlighter size={16}/></button>
                          <button onClick={() => executeCommand('backColor', '#dcfce7')} className="p-1.5 hover:bg-white rounded text-green-600" title="Highlight Green"><Highlighter size={16}/></button>
                          <button onClick={() => executeCommand('removeFormat')} className="p-1.5 hover:bg-white rounded text-slate-400" title="Clear Formatting"><Eraser size={16}/></button>
                          
                          <div className="w-px h-4 bg-slate-300 mx-1"></div>
                          
                          <div className="flex items-center space-x-1 ml-1 overflow-x-auto no-scrollbar">
                              <span className="text-xs font-bold text-slate-400 uppercase mr-1">Vars:</span>
                              {['leadName', 'company', 'category', 'ceo', 'myName'].map(v => (
                                  <button 
                                    key={v} 
                                    onClick={() => insertVariable(v)} 
                                    className="px-2 py-0.5 bg-white border border-slate-300 rounded hover:bg-blue-50 hover:border-blue-300 text-slate-700 text-xs font-medium shadow-sm transition-colors whitespace-nowrap"
                                  >
                                      {v}
                                  </button>
                              ))}
                          </div>
                      </div>
  
                      {/* Rich Text Editor */}
                      <div 
                        ref={editorRef}
                        contentEditable
                        className="flex-1 w-full p-4 border border-slate-300 rounded-lg text-sm bg-white text-slate-900 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[300px]"
                        onInput={(e) => setEditForm({...editForm, content: e.currentTarget.innerHTML})}
                        dangerouslySetInnerHTML={{ __html: editForm.content || '' }}
                        style={{ lineHeight: '1.6' }}
                      />
  
                      <div className="flex justify-end space-x-3 pt-2">
                          <Button variant="secondary" size="sm" onClick={handleCancel}>Cancel</Button>
                          <Button size="sm" onClick={handleSave}><Save size={16} className="mr-2"/> Save Script</Button>
                      </div>
                  </div>
              ) : (
                  // VIEW MODE
                  <>
                    <div className={`px-6 py-4 flex justify-between items-center ${HEADER_THEMES[theme]}`}>
                        <div>
                            <h3 className="font-bold text-lg flex items-center">{script.name}</h3>
                            <span className="text-xs font-medium opacity-70 uppercase tracking-wide">{script.category}</span>
                        </div>
                        <div className="flex space-x-1">
                            <button 
                                onClick={() => togglePreview(script.id)} 
                                className={`p-2 rounded transition-colors ${previewMode[script.id] ? 'bg-white/50 text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-white/30'}`}
                                title={previewMode[script.id] ? "Show Template" : "Simulate Preview"}
                            >
                                {previewMode[script.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button onClick={() => handleEdit(script)} className="p-2 text-slate-500 hover:text-blue-700 rounded hover:bg-white/30">
                                <Edit size={16} />
                            </button>
                            <button onClick={() => onDeleteScript(script.id)} className="p-2 text-slate-500 hover:text-red-700 rounded hover:bg-white/30">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col relative group">
                         <div 
                            className="flex-1 text-sm text-slate-700 leading-relaxed font-sans bg-white/50 p-4 rounded-lg border border-white/50 shadow-sm overflow-auto max-h-[300px]"
                            dangerouslySetInnerHTML={{ 
                                __html: previewMode[script.id] ? renderPreview(script.content) : script.content 
                            }}
                         />
                         
                         <button 
                            onClick={() => copyToClipboard(script.content, script.id)}
                            className="absolute top-8 right-8 p-1.5 bg-white border border-slate-200 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:text-blue-600 z-10"
                            title="Copy text"
                        >
                            {copiedId === script.id ? <Check size={14} className="text-green-600"/> : <Copy size={14}/>}
                        </button>
                    </div>
                  </>
              )}
            </div>
          );
        })}
        
        {scripts.length === 0 && (
             <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                 <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <FileText size={32} className="text-slate-300" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900">No scripts created yet</h3>
                 <p className="text-slate-500 mb-6">Create templates to standardize your team's outreach.</p>
                 <Button onClick={handleCreateNew}>Create First Script</Button>
             </div>
        )}
      </div>
    </div>
  );
};