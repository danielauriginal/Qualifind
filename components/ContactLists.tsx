import React, { useState } from 'react';
import { ContactList, Lead, PipelineStage } from '../types';
import { Users, Trash2, Calendar, ChevronRight, Mail, Phone, ExternalLink, Globe, Plus, UserPlus, X, Briefcase, FileText, CheckCircle2, Sparkles, Search, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { v4 as uuidv4 } from 'uuid';
import { LeadDetailPanel } from './LeadDetailPanel';

interface ContactListsProps {
  lists: ContactList[];
  onCreateList: (name: string, stage?: PipelineStage) => void;
  onDeleteList: (id: string) => void;
  onRemoveLeadFromList: (listId: string, leadId: string) => void;
  onAddContact: (listId: string, contact: Lead) => void;
  onUpdateContact?: (listId: string, contact: Lead) => void; // New prop to persist updates
  onStartCall: (lead: Lead, listId: string) => void;
  onEnrich?: (lead: Lead, listId: string) => void; 
  onFindSimilar?: (lead: Lead) => void; 
  isDevMode?: boolean;
}

const STAGE_COLORS: Record<PipelineStage, string> = {
  'Cold': 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  'Qualified': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  'Proposal': 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
  'Closing': 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  'Closed': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
};

const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined) return <span className="text-slate-300 text-xs">-</span>;
    
    let colorClass = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    if (score >= 80) colorClass = 'bg-green-100 text-green-700 font-bold dark:bg-green-900/30 dark:text-green-300';
    else if (score >= 50) colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    else if (score < 50) colorClass = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${colorClass} border border-white dark:border-slate-600 shadow-sm`}>
        {score}
      </div>
    );
};

export const ContactLists: React.FC<ContactListsProps> = ({ 
  lists, 
  onCreateList, 
  onDeleteList, 
  onRemoveLeadFromList, 
  onAddContact, 
  onUpdateContact,
  onStartCall, 
  onEnrich, 
  onFindSimilar,
  isDevMode 
}) => {
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // Create List Modal State
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListStage, setNewListStage] = useState<PipelineStage>('Cold');

  // Add Contact Modal State
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContact, setNewContact] = useState<Partial<Lead>>({
    name: '',
    category: '',
    phone: '',
    email: '',
    ceo: ''
  });

  const activeList = lists.find(l => l.id === activeListId);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (newListName.trim()) {
      onCreateList(newListName, newListStage);
      setNewListName('');
      setIsCreatingList(false);
    }
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeListId && newContact.name) {
      const lead: Lead = {
        id: uuidv4(),
        name: newContact.name,
        category: newContact.category || 'Manual Entry',
        address: '',
        website: null,
        phone: newContact.phone || null,
        email: newContact.email || null,
        ceo: newContact.ceo || null,
        status: 'New',
        confidence: 'Low',
        leadScore: 10, // Start low for manual entry
        sourceUrl: 'Manual',
        notes: 'Manually added to list.',
        isEnriching: false,
        ...newContact
      } as Lead;
      
      onAddContact(activeListId, lead);
      setIsAddingContact(false);
      setNewContact({ name: '', category: '', phone: '', email: '', ceo: '' });
    }
  };
  
  const handleLeadUpdate = (updatedLead: Lead) => {
      // 1. Update local selected lead to reflect changes immediately in the panel
      setSelectedLead(updatedLead);
      
      // 2. Persist to parent state
      if (activeListId && onUpdateContact) {
          onUpdateContact(activeListId, updatedLead);
      }
      
      // CRITICAL FIX: Do NOT close the panel here. 
      // The previous code had setSelectedLead(null), which caused the "window closing" bug.
  };

  // Render Pipeline View
  const renderListCard = (list: ContactList) => (
    <div 
      key={list.id} 
      onClick={() => setActiveListId(list.id)}
      className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-all group relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Users size={20} />
        </div>
        {list.stage && (
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded border ${STAGE_COLORS[list.stage]}`}>
            {list.stage}
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{list.name}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{list.leads.length} contacts</p>
      
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center text-xs text-slate-400">
         <Calendar size={12} className="mr-1" />
         Created {new Date(list.createdAt).toLocaleDateString()}
      </div>
    </div>
  );

  // Active List View
  if (activeList) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 flex flex-col h-full relative">
        
        {/* Add Contact Modal */}
        {isAddingContact && (
          <div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
               <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 dark:text-white">Add New Contact</h3>
                  <button onClick={() => setIsAddingContact(false)}><X size={20} className="text-slate-400 hover:text-slate-200"/></button>
               </div>
               <form onSubmit={handleAddContactSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Company Name</label>
                    <input required type="text" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Industry / Category</label>
                    <input type="text" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newContact.category} onChange={e => setNewContact({...newContact, category: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">CEO / Decision Maker</label>
                      <input type="text" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newContact.ceo || ''} onChange={e => setNewContact({...newContact, ceo: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                      <input type="text" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newContact.phone || ''} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                    <input type="email" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newContact.email || ''} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                  </div>
                  <Button type="submit" className="w-full">Save Contact</Button>
               </form>
            </div>
          </div>
        )}

        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center space-x-2">
            <button onClick={() => setActiveListId(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm flex items-center">
               <span className="mr-1">&larr;</span> Back
            </button>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{activeList.name}</h2>
            {activeList.stage && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${STAGE_COLORS[activeList.stage]} ml-2`}>
                {activeList.stage}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="secondary" size="sm" onClick={() => setIsAddingContact(true)} className="dark:bg-slate-700 dark:text-white dark:border-slate-600 dark:hover:bg-slate-600">
               <UserPlus size={16} className="mr-2" /> Add Contact
            </Button>
            <Button variant="danger" size="sm" onClick={() => {
                onDeleteList(activeList.id);
                setActiveListId(null);
            }}>
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-800">
          {activeList.leads.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
              <Users size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
              <p>This list is empty.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setIsAddingContact(true)}>Add your first contact manually</Button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {activeList.leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer group" onClick={() => setSelectedLead(lead)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <ScoreBadge score={lead.leadScore} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{lead.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{lead.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {lead.website ? (
                        <a href={lead.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline group">
                          <Globe size={14} className="mr-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                          {new URL(lead.website).hostname.replace('www.', '')}
                          <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900 dark:text-white">{lead.ceo || '—'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        {lead.email && (
                          <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                            <Mail size={12} className="mr-2" /> {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <button 
                             onClick={(e) => { e.stopPropagation(); onStartCall(lead, activeList.id); }}
                             className="flex items-center text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors w-fit"
                          >
                            <Phone size={12} className="mr-2 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                            {lead.phone}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                            {/* Enrich Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); if(onEnrich) onEnrich(lead, activeList.id); }}
                                className={`p-1.5 rounded transition-colors ${lead.isEnriching ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-400'}`}
                                title="Enrich Data with AI"
                                disabled={lead.isEnriching}
                            >
                                {lead.isEnriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            </button>

                             {/* Find Similar Button */}
                             <button
                                onClick={(e) => { e.stopPropagation(); if(onFindSimilar) onFindSimilar(lead); }}
                                className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                                title="Find Similar Companies"
                            >
                                <Search size={16} />
                            </button>

                            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                            {/* Remove Button */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); onRemoveLeadFromList(activeList.id, lead.id); }}
                                className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                title="Remove Contact"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        <LeadDetailPanel 
            lead={selectedLead} 
            onClose={() => setSelectedLead(null)} 
            onUpdate={handleLeadUpdate} 
            onStartCall={(lead) => onStartCall(lead, activeList.id)}
            isDevMode={isDevMode}
        />
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="space-y-6 relative h-full">
      {isCreatingList && (
         <div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm animate-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">Create New List</h3>
                    <button onClick={() => setIsCreatingList(false)}><X size={20} className="text-slate-400 hover:text-slate-200"/></button>
                </div>
                <form onSubmit={handleCreateList} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">List Name</label>
                        <input autoFocus required type="text" className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" placeholder="e.g. Q4 Outreach" value={newListName} onChange={e => setNewListName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pipeline Stage</label>
                        <select className="w-full border dark:border-slate-600 rounded p-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white" value={newListStage} onChange={e => setNewListStage(e.target.value as PipelineStage)}>
                            <option value="Cold">Cold</option>
                            <option value="Qualified">Qualified</option>
                            <option value="Proposal">Proposal</option>
                            <option value="Closing">Closing</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                    <Button type="submit" className="w-full">Create List</Button>
                </form>
             </div>
         </div>
      )}

      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Saved Contact Lists</h2>
         <Button onClick={() => setIsCreatingList(true)}>
             <Plus size={16} className="mr-2" /> Create List
         </Button>
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
               <Users size={32} className="text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No contact lists yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Create lists to organize your contacts by stage (Cold, Qualified, etc.) or campaign.
            </p>
            <Button className="mt-6" onClick={() => setIsCreatingList(true)}>Create First List</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map(renderListCard)}
        </div>
      )}
    </div>
  );
};