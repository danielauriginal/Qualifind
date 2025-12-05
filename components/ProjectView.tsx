import React, { useState, useMemo } from 'react';
import { Project, Lead, ContactList, Script } from '../types';
import { Download, Filter, Search, Edit, Loader2, Sparkles, FolderPlus, X, ExternalLink, Globe, Radar, CheckCircle2, Plus, Check, HelpCircle, ShieldCheck, Phone, Mail, Calendar, BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from './Button';
import { LeadDetailPanel } from './LeadDetailPanel';

interface ProjectViewProps {
  project: Project;
  contactLists: ContactList[];
  onUpdateProject: (project: Project) => void;
  onBack: () => void;
  onBulkEnrich: (leadIds: string[]) => void;
  onSaveToList: (leads: Lead[], listId?: string, newListName?: string) => void;
  onLoadMore: (project: Project) => void;
  isLoadingMore?: boolean;
  scripts?: Script[];
  onStartCall: (lead: Lead) => void; // New Prop for Global Call Wizard
}

export const ProjectView: React.FC<ProjectViewProps> = ({ 
  project, 
  contactLists, 
  onUpdateProject, 
  onBack, 
  onBulkEnrich,
  onSaveToList,
  onLoadMore,
  isLoadingMore,
  scripts = [],
  onStartCall
}) => {
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('All');
  const [selectedLeadIds, setSelectedLeadIds] = React.useState<Set<string>>(new Set());
  const [showSaveListModal, setShowSaveListModal] = React.useState(false);
  const [showCallStats, setShowCallStats] = React.useState(false);
  const [sortField, setSortField] = React.useState<'leadScore' | 'name'>('name');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');
  
  // Visual feedback state
  const [justContactedIds, setJustContactedIds] = React.useState<Set<string>>(new Set());
  
  // Save List Modal State
  const [selectedListId, setSelectedListId] = React.useState<string>('new');
  const [newListName, setNewListName] = React.useState('');

  const handleLeadUpdate = (updatedLead: Lead) => {
    const updatedLeads = project.leads.map(l => l.id === updatedLead.id ? updatedLead : l);
    onUpdateProject({ ...project, leads: updatedLeads });
  };

  const filteredLeads = useMemo(() => {
    let leads = project.leads.filter(lead => {
      const matchesSearch = lead.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            lead.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    return leads.sort((a, b) => {
      let valA: any = sortField === 'name' ? a.name : (a.leadScore || 0);
      let valB: any = sortField === 'name' ? b.name : (b.leadScore || 0);
      
      if (sortField === 'name') {
         valA = valA.toLowerCase();
         valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [project.leads, searchTerm, statusFilter, sortField, sortDirection]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeadIds(newSet);
  };

  const handleSort = (field: 'leadScore' | 'name') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Calculate Call Stats
  const callStats = React.useMemo(() => {
    let totalCalls = 0;
    let leadsCalled = 0;
    const outcomes: Record<string, number> = {};
    
    project.leads.forEach(lead => {
        if (lead.callLogs && lead.callLogs.length > 0) {
            leadsCalled++;
            totalCalls += lead.callLogs.length;
            lead.callLogs.forEach(log => {
                outcomes[log.outcome] = (outcomes[log.outcome] || 0) + 1;
            });
        }
    });

    const outcomeEntries = Object.entries(outcomes).sort((a, b) => b[1] - a[1]);

    return { totalCalls, leadsCalled, outcomes, outcomeEntries };
  }, [project.leads]);

  const handleExport = () => {
    const headers = ['Company Name', 'Lead Score', 'Category', 'Address', 'Website', 'Phone', 'Email', 'Email Status', 'CEO', 'Description', 'Status', 'Last Call', 'Setting Date', 'Source URL'];
    const csvContent = [
      headers.join(','),
      ...filteredLeads.map(lead => [
        `"${lead.name}"`,
        lead.leadScore || 0,
        `"${lead.category}"`,
        `"${lead.address}"`,
        lead.website,
        lead.phone,
        lead.email,
        lead.emailStatus,
        lead.ceo,
        `"${lead.companyDescription || ''}"`,
        lead.status,
        `"${lead.lastCallResult || ''}"`,
        `"${lead.appointmentDate || ''}"`,
        lead.sourceUrl
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name.replace(/\s+/g, '_')}_leads.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkEnrichClick = () => {
    onBulkEnrich(Array.from(selectedLeadIds));
    setSelectedLeadIds(new Set()); 
  };

  const handleSaveListSubmit = () => {
    const leadsToSave = project.leads.filter(l => selectedLeadIds.has(l.id));
    if (selectedListId === 'new') {
      if (newListName.trim()) {
        onSaveToList(leadsToSave, undefined, newListName);
      }
    } else {
      onSaveToList(leadsToSave, selectedListId);
    }
    setShowSaveListModal(false);
    setSelectedLeadIds(new Set());
    setNewListName('');
    setSelectedListId('new');
  };

  const StatusBadge = ({ status, leadId }: { status: string, leadId: string }) => {
    const isJustContacted = justContactedIds.has(leadId);
    
    if (isJustContacted) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 animate-pulse transition-all">
          <CheckCircle2 size={12} className="mr-1" /> Contacted!
        </span>
      );
    }

    const colors: Record<string, string> = {
      New: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      Reviewed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100',
      Contacted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      Invalid: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status] || colors.New} transition-colors duration-500`}>
        {status}
      </span>
    );
  };

  const ScoreBadge = ({ score }: { score?: number }) => {
    if (score === undefined) return <span className="text-slate-300 text-xs">-</span>;
    
    let colorClass = 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    if (score >= 80) colorClass = 'bg-green-100 text-green-700 font-bold dark:bg-green-900 dark:text-green-300';
    else if (score >= 50) colorClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    else if (score < 50) colorClass = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300';

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${colorClass} border border-white dark:border-slate-600 shadow-sm`}>
        {score}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 overflow-hidden relative">
      {/* Save List Modal */}
      {showSaveListModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
             <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
               <h3 className="font-bold text-slate-800 dark:text-white">Save to Contact List</h3>
               <button onClick={() => setShowSaveListModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
             </div>
             <div className="p-6 space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">Saving {selectedLeadIds.size} leads to a list.</p>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Select List</label>
                  <select 
                    value={selectedListId}
                    onChange={(e) => setSelectedListId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="new">+ Create New List</option>
                    {contactLists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                </div>
                {selectedListId === 'new' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">List Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Q1 Outreach"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="w-full border border-slate-300 dark:border-slate-600 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                )}
             </div>
             <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/50 flex justify-end space-x-3">
               <Button variant="secondary" onClick={() => setShowSaveListModal(false)}>Cancel</Button>
               <Button onClick={handleSaveListSubmit} disabled={selectedListId === 'new' && !newListName.trim()}>Save Leads</Button>
             </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 bg-slate-50 dark:bg-slate-900/50">
        <div>
          <div className="flex items-center space-x-2">
            <button onClick={onBack} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm">
              &larr; Projects
            </button>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{project.name}</h2>
            <span className={`px-2 py-0.5 text-xs rounded-full border ${project.status === 'Completed' ? 'border-green-200 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800' : 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
              {project.status}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 pl-6">
            {project.leads.length} leads found • {project.location} ({project.radius}km)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" onClick={() => setShowCallStats(!showCallStats)} className={showCallStats ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' : ''}>
            <BarChart3 size={16} className="mr-2" />
            {showCallStats ? 'Hide Stats' : 'Call Reporting'}
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => onLoadMore(project)} isLoading={isLoadingMore}>
            <Plus size={16} className="mr-2" /> Find More
          </Button>
        </div>
      </div>

      {/* Call Stats Dashboard */}
      {showCallStats && (
        <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             {/* Key Metrics */}
             <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex flex-col justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Total Calls</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{callStats.totalCalls}</span>
                  <span className="ml-2 text-xs text-slate-400">log entries</span>
                </div>
             </div>
             
             <div className="bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 flex flex-col justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Unique Leads Called</span>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{callStats.leadsCalled}</span>
                  <span className="ml-2 text-xs text-slate-400">of {project.leads.length} leads</span>
                </div>
                 <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-1.5 mt-2">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full" 
                      style={{ width: `${project.leads.length > 0 ? (callStats.leadsCalled / project.leads.length) * 100 : 0}%` }}
                    ></div>
                 </div>
             </div>

             {/* Outcome Breakdown */}
             <div className="md:col-span-2 bg-white dark:bg-slate-700 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600">
                <span className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-2 block">Outcome Distribution</span>
                <div className="space-y-2">
                   {callStats.outcomeEntries.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No call data available yet.</p>
                   ) : (
                     callStats.outcomeEntries.slice(0, 3).map(([outcome, count]) => (
                       <div key={outcome} className="flex items-center text-sm">
                          <span className="w-32 truncate text-slate-600 dark:text-slate-300">{outcome}</span>
                          <div className="flex-1 mx-2">
                             <div className="w-full bg-slate-100 dark:bg-slate-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    outcome.includes('Appointment') ? 'bg-green-500' : 
                                    outcome.includes('No Answer') ? 'bg-red-400' : 'bg-blue-400'
                                  }`} 
                                  style={{ width: `${(count / callStats.totalCalls) * 100}%` }}
                                ></div>
                             </div>
                          </div>
                          <span className="font-bold text-slate-800 dark:text-white">{count}</span>
                       </div>
                     ))
                   )}
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-800 z-20">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="text-slate-400 w-4 h-4" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 dark:border-slate-600 rounded-lg text-sm py-2 px-3 outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Reviewed">Reviewed</option>
            <option value="Contacted">Contacted</option>
            <option value="Invalid">Invalid</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedLeadIds.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-100 dark:border-blue-800 p-3 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
           <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-800 dark:text-blue-300">{selectedLeadIds.size} selected</span>
              <div className="h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
              <button 
                onClick={() => setSelectedLeadIds(new Set())}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear selection
              </button>
           </div>
           <div className="flex space-x-3">
              <Button size="sm" variant="secondary" onClick={() => setShowSaveListModal(true)} className="bg-white dark:bg-slate-700 border-blue-200 dark:border-slate-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-600">
                 <FolderPlus size={16} className="mr-2" /> Save to List
              </Button>
              <Button size="sm" onClick={handleBulkEnrichClick}>
                 <Sparkles size={16} className="mr-2" /> Enrich Selected
              </Button>
           </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white dark:bg-slate-800">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider w-10">
                 <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                  onChange={(e) => {
                    if(e.target.checked) setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
                    else setSelectedLeadIds(new Set());
                  }}
                  checked={filteredLeads.length > 0 && selectedLeadIds.size === filteredLeads.length}
                />
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('leadScore')}>
                 <div className="flex items-center">
                    Score
                    {sortField === 'leadScore' && (sortDirection === 'asc' ? <ChevronUp size={12} className="ml-1"/> : <ChevronDown size={12} className="ml-1"/>)}
                 </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleSort('name')}>
                 <div className="flex items-center">
                    Company
                    {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp size={12} className="ml-1"/> : <ChevronDown size={12} className="ml-1"/>)}
                 </div>
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Website</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Phone</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Decision Maker</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Call</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setting Date</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Edit</span></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {filteredLeads.map((lead) => (
              <tr key={lead.id} className={`transition-colors duration-300 ${lead.isEnriching ? 'bg-blue-50/30 dark:bg-blue-900/10' : selectedLeadIds.has(lead.id) ? 'bg-blue-50/50 dark:bg-blue-900/20' : justContactedIds.has(lead.id) ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox" 
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:bg-slate-700 dark:border-slate-600"
                    checked={selectedLeadIds.has(lead.id)}
                    onChange={() => toggleSelection(lead.id)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   <ScoreBadge score={lead.leadScore} />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400" onClick={() => setSelectedLead(lead)}>
                        {lead.name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{lead.category}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                   {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noreferrer" className="flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline group">
                      <Globe size={14} className="mr-1 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      {new URL(lead.website).hostname.replace('www.', '')}
                      <ExternalLink size={12} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {lead.phone ? (
                    <button 
                      onClick={() => onStartCall(lead)}
                      className="flex items-center text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 group px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                      title="Call this number"
                    >
                      <Phone size={14} className="mr-2 text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                      {lead.phone}
                    </button>
                  ) : (
                     <span className="text-slate-400 text-sm pl-2">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                    {lead.isEnriching ? (
                      <div className="flex items-center text-xs text-blue-500">
                        <Loader2 size={12} className="animate-spin mr-1" />
                        Checking email...
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-slate-500 dark:text-slate-400">
                         {lead.email ? (
                           <>
                             <Mail size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                             <a href={`mailto:${lead.email}`} className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">{lead.email}</a>
                             {lead.emailStatus === 'Validated' && (
                              <span title="Validated Email">
                                <ShieldCheck size={14} className="ml-1 text-green-500" />
                              </span>
                            )}
                            {lead.emailStatus === 'Guessed' && (
                              <span title="Guessed Pattern">
                                <HelpCircle size={14} className="ml-1 text-amber-500" />
                              </span>
                            )}
                            {lead.emailStatus === 'Tested' && (
                              <span title="Tested">
                                <Check size={14} className="ml-1 text-blue-500" />
                              </span>
                            )}
                           </>
                         ) : (
                           <span className="text-slate-400">-</span>
                         )}
                      </div>
                    )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                  {lead.isEnriching ? (
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <Loader2 size={14} className="animate-spin mr-2" />
                      <span className="text-xs font-medium">Finding CEO...</span>
                    </div>
                  ) : lead.ceo ? (
                    <div className="flex items-center">
                      <span className="font-medium">{lead.ceo}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Not found</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={lead.status} leadId={lead.id} />
                </td>
                 <td className="px-6 py-4 whitespace-nowrap text-sm">
                   {lead.lastCallResult ? (
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                       lead.lastCallResult === 'Appointment Set' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                       lead.lastCallResult === 'No Answer' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                       'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                     }`}>
                       {lead.lastCallResult}
                     </span>
                   ) : (
                     <span className="text-slate-400 text-xs">-</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                   {lead.appointmentDate ? (
                     <span className="font-medium text-green-700 dark:text-green-400 flex items-center">
                       <Calendar size={12} className="mr-1"/>
                       {new Date(lead.appointmentDate).toLocaleDateString()}
                     </span>
                   ) : (
                     <span className="text-slate-300 dark:text-slate-600">-</span>
                   )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => setSelectedLead(lead)} className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400">
                    <Edit size={18} />
                  </button>
                </td>
              </tr>
            ))}
            
            {filteredLeads.length === 0 && (
              <tr>
                <td colSpan={11} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                   {(project.status === 'Fetching') ? (
                      <div className="flex flex-col items-center justify-center py-10">
                        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
                           <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900 rounded-full animate-ping opacity-75"></div>
                           <div className="relative z-10 bg-white dark:bg-slate-800 p-4 rounded-full shadow-md border border-blue-100 dark:border-blue-900">
                             <Radar className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin-slow" />
                           </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white animate-pulse">Lead scouting in progress...</h3>
                        <p className="text-slate-500 mt-2 text-sm max-w-xs text-center">AI is scanning maps and public records to find the best businesses for you.</p>
                      </div>
                   ) : (
                      <span>No leads found matching your filters.</span>
                   )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Load More Button at bottom of table */}
        {filteredLeads.length > 0 && !isLoadingMore && project.status !== 'Fetching' && (
          <div className="p-4 flex justify-center bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            <Button variant="secondary" onClick={() => onLoadMore(project)} size="sm">
               <Plus size={16} className="mr-2" /> Find More Leads
            </Button>
          </div>
        )}
        {isLoadingMore && (
           <div className="p-4 flex justify-center bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
              <span className="flex items-center text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin mr-2" /> Searching for more...
              </span>
           </div>
        )}
      </div>

      <LeadDetailPanel 
        lead={selectedLead} 
        onClose={() => setSelectedLead(null)} 
        onUpdate={handleLeadUpdate}
        onStartCall={onStartCall} 
      />
    </div>
  );
};