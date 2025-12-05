import React from 'react';
import { Project } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { Briefcase, Users, CheckCircle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  projects: Project[];
  onNewSearch: () => void;
  onOpenProject: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onNewSearch, onOpenProject }) => {
  const totalLeads = projects.reduce((acc, p) => acc + p.leads.length, 0);
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  
  const statusData = [
    { name: 'New', value: projects.reduce((acc, p) => acc + p.leads.filter(l => l.status === 'New').length, 0) },
    { name: 'Reviewed', value: projects.reduce((acc, p) => acc + p.leads.filter(l => l.status === 'Reviewed').length, 0) },
    { name: 'Contacted', value: projects.reduce((acc, p) => acc + p.leads.filter(l => l.status === 'Contacted').length, 0) },
  ];

  // Ensure data exists for chart
  const hasData = statusData.some(d => d.value > 0);
  
  const COLORS = ['#3b82f6', '#6366f1', '#a855f7'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Leads</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalLeads}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
            <Briefcase size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Projects</p>
            <h3 className="text-2xl font-bold text-slate-800">{projects.length}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-lg text-green-600">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Completed</p>
            <h3 className="text-2xl font-bold text-slate-800">{completedProjects}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-100 rounded-lg text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Enrichment Rate</p>
            <h3 className="text-2xl font-bold text-slate-800">84%</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects List */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Projects</h3>
            <button onClick={onNewSearch} className="text-sm text-blue-600 hover:underline">
              + New Search
            </button>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
              <p>No projects yet.</p>
              <button onClick={onNewSearch} className="mt-2 text-blue-600 font-medium">Start your first search</button>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.slice(0, 5).map(project => (
                <div key={project.id} onClick={() => onOpenProject(project)} className="group flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <div>
                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{project.name}</h4>
                    <p className="text-sm text-slate-500">{project.leads.length} leads • {new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${project.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {project.status}
                    </span>
                    <div className="text-slate-400 group-hover:text-slate-600">
                       &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lead Status Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Lead Pipeline</h3>
          {/* Explicit height wrapper to fix Recharts width/height warnings */}
          <div style={{ width: '100%', height: 300 }}>
             {hasData ? (
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
               </ResponsiveContainer>
             ) : (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-100 rounded-lg">
                 No data to display
               </div>
             )}
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {statusData.map((entry, index) => (
              <div key={entry.name} className="flex items-center text-sm text-slate-600">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index] }}></div>
                {entry.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};