import React, { useMemo, useState } from 'react';
import { Project, CallLog, ContactList } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Phone, Calendar, Clock, Search, TrendingUp, UserCheck, CalendarCheck, FileText } from 'lucide-react';

interface ControllingProps {
  projects: Project[];
  contactLists: ContactList[];
}

interface EnrichedLog extends CallLog {
  leadName: string;
  leadId: string;
  projectName: string;
  projectId: string;
  companyCategory: string;
  sourceType: 'Project' | 'CRM';
}

export const Controlling: React.FC<ControllingProps> = ({ projects, contactLists }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('All');

  // Aggregate all logs from Projects AND CRM Lists
  const allLogs = useMemo(() => {
    const logs: EnrichedLog[] = [];
    
    // 1. Gather from Projects
    projects.forEach(project => {
      project.leads.forEach(lead => {
        if (lead.callLogs) {
          lead.callLogs.forEach(log => {
            logs.push({
              ...log,
              leadName: lead.name,
              leadId: lead.id,
              projectName: project.name,
              projectId: project.id,
              companyCategory: lead.category,
              sourceType: 'Project'
            });
          });
        }
      });
    });

    // 2. Gather from Contact Lists (CRM)
    contactLists.forEach(list => {
      list.leads.forEach(lead => {
        if (lead.callLogs) {
          lead.callLogs.forEach(log => {
             logs.push({
               ...log,
               leadName: lead.name,
               leadId: lead.id,
               projectName: list.name,
               projectId: list.id,
               companyCategory: lead.category,
               sourceType: 'CRM'
             });
          });
        }
      });
    });

    // Sort by timestamp descending (newest first)
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [projects, contactLists]);

  // Filter logs for table
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      const matchesSearch = log.leadName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            log.projectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = outcomeFilter === 'All' || log.outcome === outcomeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allLogs, searchTerm, outcomeFilter]);

  // KPI Calculations
  const stats = useMemo(() => {
    const totalCalls = allLogs.length;
    const uniqueLeadsCalled = new Set(allLogs.map(l => l.leadId)).size;
    const appointments = allLogs.filter(l => l.outcome.includes('Appointment')).length;
    const interested = allLogs.filter(l => l.outcome.includes('Interested')).length; // Includes appointments
    const noAnswers = allLogs.filter(l => l.outcome.includes('No Answer')).length;
    
    // Conversion Rate: Appointments / Total Calls
    const conversionRate = totalCalls > 0 ? ((appointments / totalCalls) * 100).toFixed(1) : '0.0';
    
    // Connection Rate: (Total - No Answer) / Total
    const connectedCount = totalCalls - noAnswers;
    const connectionRate = totalCalls > 0 ? ((connectedCount / totalCalls) * 100).toFixed(1) : '0.0';

    return { totalCalls, uniqueLeadsCalled, appointments, conversionRate, connectionRate, interested };
  }, [allLogs]);

  // Chart Data: Outcomes Grouped
  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    allLogs.forEach(log => {
      // Group simplified outcomes
      let key = log.outcome;
      if (key.includes('Appointment')) key = 'Appointment';
      else if (key.includes('Interested')) key = 'Interested';
      else if (key.includes('No Answer')) key = 'No Answer';
      else if (key.includes('Gatekeeper')) key = 'Gatekeeper';
      
      counts[key] = (counts[key] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allLogs]);

  const COLORS = {
    'Appointment': '#22c55e', // green-500
    'Interested': '#3b82f6', // blue-500
    'No Answer': '#ef4444', // red-500
    'Gatekeeper': '#f97316', // orange-500
    'Not Interested': '#64748b' // slate-500
  };

  const getColor = (outcome: string) => {
    if (outcome.includes('Appointment')) return COLORS['Appointment'];
    if (outcome.includes('Interested')) return COLORS['Interested'];
    if (outcome.includes('No Answer')) return COLORS['No Answer'];
    if (outcome.includes('Gatekeeper')) return COLORS['Gatekeeper'];
    return COLORS['Not Interested'];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Sales Controlling</h2>
           <p className="text-slate-500">Unified overview of activities across Scraped Projects and CRM Lists.</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
           <Clock size={14} />
           <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Total Calls</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.totalCalls}</h3>
              <p className="text-sm text-slate-400 mt-1">{stats.uniqueLeadsCalled} unique leads</p>
           </div>
           <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <Phone size={24} />
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Connection Rate</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.connectionRate}%</h3>
              <p className="text-sm text-slate-400 mt-1">Answered calls</p>
           </div>
           <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
              <UserCheck size={24} />
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Appointments</p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">{stats.appointments}</h3>
              <p className="text-sm text-slate-400 mt-1">Booked meetings</p>
           </div>
           <div className="p-3 bg-green-50 rounded-lg text-green-600">
              <CalendarCheck size={24} />
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
           <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Success Rate</p>
              <h3 className="text-3xl font-bold text-slate-900 mt-2">{stats.conversionRate}%</h3>
              <p className="text-sm text-slate-400 mt-1">Calls to Appt.</p>
           </div>
           <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
              <TrendingUp size={24} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Outcome Chart */}
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6">Outcome Distribution</h3>
            <div className="flex-1 min-h-[250px]">
               {chartData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12, fill: '#64748b'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{fill: '#f8fafc'}}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                        ))}
                      </Bar>
                    </BarChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="h-full flex items-center justify-center text-slate-400 italic">No data available</div>
               )}
            </div>
         </div>

         {/* Call Log Table */}
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
               <h3 className="font-bold text-slate-800">Global Call Log</h3>
               <div className="flex space-x-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search lead or project..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    />
                  </div>
                  <select 
                    value={outcomeFilter} 
                    onChange={(e) => setOutcomeFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg text-sm px-3 py-2 outline-none bg-white text-slate-900"
                  >
                     <option value="All">All Outcomes</option>
                     <option value="Appointment Set">Appointment</option>
                     <option value="No Answer">No Answer</option>
                     <option value="Interested">Interested</option>
                     <option value="Gatekeeper Blocked">Blocked</option>
                  </select>
               </div>
            </div>
            
            <div className="flex-1 overflow-auto max-h-[500px]">
               <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                     <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Lead</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Source</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Outcome</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                     {filteredLogs.length === 0 ? (
                        <tr>
                           <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                              No calls found matching your filters.
                           </td>
                        </tr>
                     ) : (
                        filteredLogs.map(log => (
                           <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                 <div className="flex items-center">
                                    <Calendar size={14} className="mr-1.5 text-slate-400" />
                                    {new Date(log.timestamp).toLocaleDateString()}
                                    <span className="mx-1 text-slate-300">|</span>
                                    {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="text-sm font-medium text-slate-900">{log.leadName}</div>
                                 <div className="text-xs text-slate-500">{log.companyCategory}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                 <div className="flex flex-col">
                                     <span className="font-medium text-slate-700 truncate max-w-[120px]" title={log.projectName}>{log.projectName}</span>
                                     <span className="text-[10px] uppercase tracking-wide text-slate-400">{log.sourceType}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                 <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                    ${log.outcome.includes('Appointment') ? 'bg-green-100 text-green-800' :
                                      log.outcome.includes('No Answer') ? 'bg-red-50 text-red-700' :
                                      log.outcome.includes('Interested') ? 'bg-blue-100 text-blue-800' :
                                      'bg-slate-100 text-slate-700'
                                    }`}>
                                    {log.outcome}
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
};