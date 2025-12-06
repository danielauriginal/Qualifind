
import React, { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { NewSearch } from './components/NewSearch';
import { ProjectView } from './components/ProjectView';
import { ContactLists } from './components/ContactLists';
import { Controlling } from './components/Controlling';
import { Scripts } from './components/Scripts';
import { Project, SearchParams, Lead, ContactList, Script, PipelineStage, CallLog, PhoneNumber } from './types';
import { searchBusinesses, enrichLeadData } from './services/geminiService';
import { Play } from 'lucide-react';
import { CallWizard } from './components/CallWizard';
import { SettingsModal } from './components/SettingsModal';
import { AuthPage } from './components/AuthPage';

// Context to know where the lead came from for updating purposes
type CallContext = {
    type: 'project' | 'list';
    parentId: string; // projectId or listId
};

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('leadscout-auth') === 'true';
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'search' | 'projects' | 'contacts' | 'controlling' | 'scripts'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false); // Developer Mode State
  
  // Settings & Phone State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([
     // Default example number
     { id: '1', number: '+49 30 123456', type: 'Virtual', countryCode: 'Germany (+49)', status: 'Verified' }
  ]);
  
  // Dark Mode State with persistence
  const [isDarkMode, setIsDarkMode] = useState(() => {
     try {
        const stored = localStorage.getItem('leadscout-theme');
        if (stored) return stored === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
     } catch (e) {
        return false;
     }
  });

  // GLOBAL CALL STATE
  const [activeCallLead, setActiveCallLead] = useState<Lead | null>(null);
  const [activeCallContext, setActiveCallContext] = useState<CallContext | null>(null);

  // Load API Key check
  const hasApiKey = !!process.env.API_KEY;

  // Dark Mode Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('leadscout-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('leadscout-theme', 'light');
    }
  }, [isDarkMode]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('leadscout-auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('leadscout-auth');
    setActiveTab('dashboard'); // Reset tab on logout
  };

  const updateProjectState = (updatedProject: Project) => {
    setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
    if (currentProject?.id === updatedProject.id) {
      setCurrentProject(updatedProject);
    }
  };

  const calculateLeadScore = (lead: Partial<Lead>): number => {
      let score = 0;
      if (lead.email) score += 25;
      if (lead.website) score += 25;
      if (lead.ceo) score += 15;
      if (lead.phone) score += 15;
      
      // Bonus for source credibility
      if (lead.sourceUrl && lead.sourceUrl !== 'Manual') score += 10;
      
      // Bonus for good rating
      if (lead.rating && lead.rating >= 4.0) score += 10;
      
      return Math.min(100, score);
  };

  /**
   * Reusable batch enrichment logic.
   * Updates state incrementally for UI feedback.
   */
  const processEnrichment = async (project: Project, leadsToEnrich: Lead[]) => {
    // If in demo mode without API key, simulate enrichment
    if (isDemoMode && !hasApiKey) {
      alert("Enrichment requires a valid API Key. In Demo Mode, this checks the UI flow only.");
      // Simulate delay then finish
      const currentLeads = [...project.leads];
      const idsToEnrich = new Set(leadsToEnrich.map(l => l.id));
      
      const enrichingLeads = currentLeads.map(l => idsToEnrich.has(l.id) ? { ...l, isEnriching: true } : l);
      updateProjectState({ ...project, leads: enrichingLeads, status: 'Enriching' });

      setTimeout(() => {
         const finishedLeads = enrichingLeads.map(l => idsToEnrich.has(l.id) ? { ...l, isEnriching: false, leadScore: Math.floor(Math.random() * 50) + 50 } : l);
         updateProjectState({ ...project, leads: finishedLeads, status: 'Completed' });
      }, 2000);
      return;
    }

    const BATCH_SIZE = 5;
    let currentLeads = [...project.leads];

    // Mark these leads as enriching in the state first
    const idsToEnrich = new Set(leadsToEnrich.map(l => l.id));
    currentLeads = currentLeads.map(l => idsToEnrich.has(l.id) ? { ...l, isEnriching: true } : l);
    
    updateProjectState({ ...project, leads: currentLeads, status: 'Enriching' });

    // Process in batches
    for (let i = 0; i < leadsToEnrich.length; i += BATCH_SIZE) {
        const batch = leadsToEnrich.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (lead) => {
            const enriched = await enrichLeadData(lead);
            let confidence: 'High' | 'Medium' | 'Low' = 'Low';
            if (enriched.email || enriched.ceo) confidence = 'Medium';
            if (enriched.email && enriched.ceo && enriched.website) confidence = 'High';
            
            // Recalculate Score
            const leadScore = calculateLeadScore(enriched);

            return { ...lead, ...enriched, confidence, leadScore, isEnriching: false } as Lead;
          })
        );
        
        // Merge results back into the main list
        batchResults.forEach(enrichedLead => {
            const idx = currentLeads.findIndex(l => l.id === enrichedLead.id);
            if (idx !== -1) {
                currentLeads[idx] = enrichedLead;
            }
        });

        // Update UI state after each batch
        updateProjectState({ ...project, leads: [...currentLeads] });
    }

    // Final update to clear status if all done
    const isStillEnriching = currentLeads.some(l => l.isEnriching);
    updateProjectState({ ...project, leads: currentLeads, status: isStillEnriching ? 'Enriching' : 'Completed' });
  };

  const startDemoMode = () => {
    const demoProject: Project = {
      id: uuidv4(),
      name: "Demo: Tech Startups in Berlin",
      industry: "Software Startup",
      location: "Berlin, Germany",
      radius: 10,
      filters: {
        minRating: 4.0,
        minReviews: 10,
        mustHaveWebsite: true
      },
      status: 'Completed',
      createdAt: new Date().toISOString(),
      limit: 10,
      leads: [
        {
          id: uuidv4(),
          name: "Nebula Innovations GmbH",
          category: "Software Company",
          address: "Torstraße 1, 10119 Berlin",
          website: "https://example.com/nebula",
          phone: "+49 30 12345678",
          email: "hello@nebulainnovations.demo",
          emailStatus: 'Validated',
          ceo: "Sarah Miller",
          companyDescription: "AI-driven analytics platform for enterprise logistics.",
          status: 'New',
          confidence: 'High',
          leadScore: 95,
          sourceUrl: "https://google.com/maps",
          notes: "Looks like a perfect fit for the enterprise tier.",
          rating: 4.8,
          reviewCount: 42,
          isEnriching: false,
        },
        {
          id: uuidv4(),
          name: "Quantum Dynamics",
          category: "IT Consultant",
          address: "Friedrichstraße 200, 10117 Berlin",
          website: "https://example.com/quantum",
          phone: "+49 30 98765432",
          email: "contact@quantum-dyn.demo",
          emailStatus: 'Guessed',
          ceo: null,
          companyDescription: "Boutique IT consulting firm specializing in cloud migration.",
          status: 'Reviewed',
          confidence: 'Medium',
          leadScore: 75,
          sourceUrl: null,
          notes: "",
          rating: 4.2,
          reviewCount: 15,
          isEnriching: false,
        },
        {
          id: uuidv4(),
          name: "Blue Ocean Digital",
          category: "Marketing Agency",
          address: "Kreuzberg Str. 12, 10969 Berlin",
          website: null,
          phone: "+49 170 5555555",
          email: null,
          ceo: "Markus Klein",
          companyDescription: null,
          status: 'Contacted',
          confidence: 'Low',
          leadScore: 40,
          sourceUrl: "https://linkedin.com",
          notes: "Spoke to Markus, he is interested in Q3.",
          rating: 3.9,
          reviewCount: 8,
          isEnriching: false,
          callLogs: [
            { id: uuidv4(), timestamp: new Date(Date.now() - 86400000).toISOString(), outcome: 'Appointment Set', appointmentDate: new Date(Date.now() + 86400000).toISOString(), analysis: { callScore: 92, scriptAdherence: 95, confidence: 'High', sentiment: 'Positive' } }
          ],
          lastCallResult: 'Appointment Set',
          appointmentDate: new Date(Date.now() + 86400000).toISOString()
        },
      ]
    };
    
    setScripts([
        {
            id: uuidv4(),
            name: "Initial Outreach - Casual",
            content: "Hi <span contenteditable='false' class='inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold mx-0.5'>{{leadName}}</span>, this is <span contenteditable='false' class='inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold mx-0.5'>{{myName}}</span>. I noticed <span contenteditable='false' class='inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold mx-0.5'>{{company}}</span> is doing great work in <span contenteditable='false' class='inline-block bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200 text-xs font-bold mx-0.5'>{{category}}</span>.",
            category: "Cold Call",
            themeColor: 'blue'
        }
    ]);

    setContactLists([
        { id: uuidv4(), name: 'Hot Leads Q1', createdAt: new Date().toISOString(), leads: [demoProject.leads[0]], stage: 'Qualified' }
    ]);

    setIsDemoMode(true);
    setProjects([demoProject]);
    setCurrentProject(demoProject);
    setActiveTab('projects');
  };

  const handleStartSearch = async (params: SearchParams) => {
    if (!hasApiKey && !isDemoMode) {
      alert("Please configure your Gemini API Key in the environment.");
      return;
    }

    if (isDemoMode && !hasApiKey) {
      alert("Search is disabled in Demo Mode without an API Key. Please use the pre-loaded demo project to explore features.");
      return;
    }

    setIsProcessing(true);
    
    // Create new project shell
    const newProject: Project = {
      id: uuidv4(),
      name: `${params.industry} in ${params.location}`,
      industry: params.industry,
      location: params.location,
      radius: params.radius,
      filters: {
        minRating: params.minRating,
        minReviews: params.minReviews,
        mustHaveWebsite: params.mustHaveWebsite,
      },
      leads: [],
      status: 'Fetching',
      createdAt: new Date().toISOString(),
      limit: params.limit,
    };

    setProjects(prev => [newProject, ...prev]);
    setActiveTab('projects');
    setCurrentProject(newProject);

    try {
      const rawLeads = await searchBusinesses(params.industry, params.location, params.limit);
      
      let leads: Lead[] = rawLeads.map(raw => {
        const partialLead: Partial<Lead> = {
            id: uuidv4(),
            name: raw.name || 'Unknown',
            category: params.industry,
            address: raw.address || '',
            website: raw.website || null,
            phone: raw.phone || null,
            email: null,
            ceo: null,
            status: 'New',
            confidence: 'Low',
            sourceUrl: raw.sourceUrl || null,
            notes: '',
            rating: raw.rating,
            reviewCount: raw.reviewCount,
            isEnriching: false,
        };
        partialLead.leadScore = calculateLeadScore(partialLead);
        return partialLead as Lead;
      });

      if (params.mustHaveWebsite) leads = leads.filter(l => !!l.website);
      if (params.minRating > 0) leads = leads.filter(l => (l.rating || 0) >= params.minRating);

      const projectWithRawLeads = { ...newProject, leads, status: 'Enriching' as const };
      updateProjectState(projectWithRawLeads);
      setCurrentProject(projectWithRawLeads);

      await processEnrichment(projectWithRawLeads, leads);

    } catch (error) {
      console.error("Search failed", error);
      alert("An error occurred during the search process.");
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadMoreLeads = async (project: Project) => {
    if ((!hasApiKey && !isDemoMode) || isLoadingMore) return;
    
    if (isDemoMode && !hasApiKey) {
       alert("Live search is disabled in Demo Mode. Add an API key to find real leads.");
       return;
    }
    
    setIsLoadingMore(true);
    try {
      const existingNames = project.leads.map(l => l.name);
      const rawLeads = await searchBusinesses(project.industry, project.location, 10, existingNames);
      
      let newLeads: Lead[] = rawLeads.map(raw => {
        const partialLead: Partial<Lead> = {
            id: uuidv4(),
            name: raw.name || 'Unknown',
            category: project.industry,
            address: raw.address || '',
            website: raw.website || null,
            phone: raw.phone || null,
            email: null,
            ceo: null,
            status: 'New',
            confidence: 'Low',
            sourceUrl: raw.sourceUrl || null,
            notes: '',
            rating: raw.rating,
            reviewCount: raw.reviewCount,
            isEnriching: false,
        };
        partialLead.leadScore = calculateLeadScore(partialLead);
        return partialLead as Lead;
      });

      if (project.filters.mustHaveWebsite) newLeads = newLeads.filter(l => !!l.website);
      if (project.filters.minRating > 0) newLeads = newLeads.filter(l => (l.rating || 0) >= project.filters.minRating);

      const existingIds = new Set(project.leads.map(l => l.name.toLowerCase()));
      newLeads = newLeads.filter(l => !existingIds.has(l.name.toLowerCase()));

      if (newLeads.length > 0) {
        const updatedProject = {
          ...project,
          leads: [...project.leads, ...newLeads]
        };
        updateProjectState(updatedProject);
      } 

    } catch (error) {
      console.error("Failed to load more leads", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleBulkEnrich = useCallback((leadIds: string[]) => {
    if (!currentProject) return;
    const leadsToEnrich = currentProject.leads.filter(l => leadIds.includes(l.id));
    if (leadsToEnrich.length === 0) return;
    processEnrichment(currentProject, leadsToEnrich);
  }, [currentProject, isDemoMode]);

  const handleEnrichListLead = async (lead: Lead, listId: string) => {
      // Optimistically update status to enriching
      setContactLists(prev => prev.map(list => {
          if (list.id === listId) {
              return {
                  ...list,
                  leads: list.leads.map(l => l.id === lead.id ? { ...l, isEnriching: true } : l)
              };
          }
          return list;
      }));

      try {
          const enriched = await enrichLeadData(lead);
          let confidence: 'High' | 'Medium' | 'Low' = 'Low';
          if (enriched.email || enriched.ceo) confidence = 'Medium';
          if (enriched.email && enriched.ceo && enriched.website) confidence = 'High';
          
          const leadScore = calculateLeadScore(enriched);

          const finalLead = { ...lead, ...enriched, confidence, leadScore, isEnriching: false } as Lead;

          setContactLists(prev => prev.map(list => {
              if (list.id === listId) {
                  return {
                      ...list,
                      leads: list.leads.map(l => l.id === lead.id ? finalLead : l)
                  };
              }
              return list;
          }));
      } catch (e) {
          console.error("Manual enrichment failed", e);
           // Revert enriching state
          setContactLists(prev => prev.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    leads: list.leads.map(l => l.id === lead.id ? { ...l, isEnriching: false } : l)
                };
            }
            return list;
        }));
      }
  };

  const handleSaveToContactList = (leads: Lead[], listId?: string, newListName?: string) => {
    if (newListName) {
      const newList: ContactList = {
        id: uuidv4(),
        name: newListName,
        createdAt: new Date().toISOString(),
        leads: leads,
        stage: 'Cold'
      };
      setContactLists(prev => [...prev, newList]);
    } else if (listId) {
      setContactLists(prev => prev.map(list => {
        if (list.id === listId) {
          const existingIds = new Set(list.leads.map(l => l.id));
          const uniqueNewLeads = leads.filter(l => !existingIds.has(l.id));
          return { ...list, leads: [...list.leads, ...uniqueNewLeads] };
        }
        return list;
      }));
    }
  };

  const handleCreateList = (name: string, stage: PipelineStage = 'Cold') => {
      const newList: ContactList = {
        id: uuidv4(),
        name,
        createdAt: new Date().toISOString(),
        leads: [],
        stage
      };
      setContactLists(prev => [...prev, newList]);
  };

  const handleAddContact = (listId: string, contact: Lead) => {
    setContactLists(prev => prev.map(list => {
        if (list.id === listId) {
            return { ...list, leads: [contact, ...list.leads] };
        }
        return list;
    }));
  };

  // Persist changes from detail panel (like Handelsregister updates) to the CRM
  const handleUpdateContact = (listId: string, updatedContact: Lead) => {
    setContactLists(prev => prev.map(list => {
        if (list.id === listId) {
            return { 
              ...list, 
              leads: list.leads.map(l => l.id === updatedContact.id ? updatedContact : l) 
            };
        }
        return list;
    }));
  };

  const handleDeleteList = (id: string) => {
    setContactLists(prev => prev.filter(l => l.id !== id));
  };

  const handleRemoveLeadFromList = (listId: string, leadId: string) => {
    setContactLists(prev => prev.map(list => {
      if (list.id === listId) {
        return { ...list, leads: list.leads.filter(l => l.id !== leadId) };
      }
      return list;
    }));
  };

  const handleOpenProject = (project: Project) => {
    setCurrentProject(project);
    setActiveTab('projects');
  };

  // GLOBAL CALL HANDLERS
  const handleStartCall = (lead: Lead, context: CallContext) => {
    setActiveCallLead(lead);
    setActiveCallContext(context);
  };

  const handleLogCall = (log: CallLog, updatedLeadStatus?: string, appointmentDate?: string) => {
      if (!activeCallLead || !activeCallContext) return;

      const updatedLead: Lead = {
          ...activeCallLead,
          callLogs: [log, ...(activeCallLead.callLogs || [])],
          lastCallResult: log.outcome,
          status: (updatedLeadStatus as any) || activeCallLead.status,
          appointmentDate: appointmentDate || activeCallLead.appointmentDate
      };

      // Update state based on where the call originated
      if (activeCallContext.type === 'project') {
          setProjects(prev => prev.map(p => {
              if (p.id === activeCallContext.parentId) {
                  return {
                      ...p,
                      leads: p.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
                  };
              }
              return p;
          }));
          // Also update current project if it's open
          if (currentProject && currentProject.id === activeCallContext.parentId) {
              setCurrentProject(prev => prev ? ({
                  ...prev,
                  leads: prev.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
              }) : null);
          }
      } else if (activeCallContext.type === 'list') {
          setContactLists(prev => prev.map(list => {
              if (list.id === activeCallContext.parentId) {
                  return {
                      ...list,
                      leads: list.leads.map(l => l.id === updatedLead.id ? updatedLead : l)
                  };
              }
              return list;
          }));
      }

      // Close wizard
      setActiveCallLead(null);
      setActiveCallContext(null);
  };

  const handleFindSimilar = (lead: Lead) => {
      alert(`Tip: To find companies similar to "${lead.name}", create a New Search for industry "${lead.category}" in the same location.`);
      setActiveTab('search');
  };

  // Script Handlers
  const handleAddScript = (script: Script) => setScripts(prev => [...prev, script]);
  const handleUpdateScript = (script: Script) => setScripts(prev => prev.map(s => s.id === script.id ? script : s));
  const handleDeleteScript = (id: string) => setScripts(prev => prev.filter(s => s.id !== id));

  // Phone Number Handlers
  const handleAddPhoneNumber = (phone: PhoneNumber) => setPhoneNumbers(prev => [...prev, phone]);
  const handleRemovePhoneNumber = (id: string) => setPhoneNumbers(prev => prev.filter(p => p.id !== id));

  const renderContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <Dashboard 
          projects={projects} 
          onNewSearch={() => setActiveTab('search')} 
          onOpenProject={handleOpenProject}
        />
      );
    }
    
    if (activeTab === 'search') {
      return (
        <NewSearch 
          onStartSearch={handleStartSearch} 
          isProcessing={isProcessing} 
        />
      );
    }

    if (activeTab === 'projects') {
      if (currentProject) {
        return (
          <ProjectView 
            project={currentProject} 
            contactLists={contactLists}
            onUpdateProject={updateProjectState}
            onBack={() => setCurrentProject(null)}
            onBulkEnrich={handleBulkEnrich}
            onSaveToList={handleSaveToContactList}
            onLoadMore={handleLoadMoreLeads}
            isLoadingMore={isLoadingMore}
            scripts={scripts}
            onStartCall={(lead) => handleStartCall(lead, { type: 'project', parentId: currentProject.id })}
          />
        );
      }
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">My Projects</h2>
              <button 
                onClick={startDemoMode}
                className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center"
              >
                <Play size={14} className="mr-1" /> Load Demo Data
              </button>
            </div>
             {projects.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-500 dark:text-slate-400 mb-4">You haven't created any projects yet.</p>
                    <button onClick={() => setActiveTab('search')} className="text-blue-600 dark:text-blue-400 font-medium mr-4">Create one now</button>
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <button onClick={startDemoMode} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium ml-4">Load Demo Data</button>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => (
                        <div key={p.id} onClick={() => setCurrentProject(p)} className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg truncate">{p.name}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${p.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'}`}>{p.status}</span>
                            </div>
                            <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
                                <p>Leads: <span className="text-slate-900 dark:text-white font-medium">{p.leads.length}</span></p>
                                <p>Industry: {p.industry}</p>
                                <p>Location: {p.location}</p>
                                <p>Date: {new Date(p.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
             )}
        </div>
      );
    }

    if (activeTab === 'contacts') {
      return (
        <ContactLists 
          lists={contactLists} 
          onCreateList={handleCreateList}
          onDeleteList={handleDeleteList}
          onRemoveLeadFromList={handleRemoveLeadFromList}
          onAddContact={handleAddContact}
          onUpdateContact={handleUpdateContact}
          onStartCall={(lead, listId) => handleStartCall(lead, { type: 'list', parentId: listId })}
          onEnrich={handleEnrichListLead}
          onFindSimilar={handleFindSimilar}
          isDevMode={isDevMode}
        />
      );
    }

    if (activeTab === 'scripts') {
        return (
            <Scripts 
                scripts={scripts}
                onAddScript={handleAddScript}
                onUpdateScript={handleUpdateScript}
                onDeleteScript={handleDeleteScript}
            />
        );
    }

    if (activeTab === 'controlling') {
       return <Controlling projects={projects} contactLists={contactLists} />;
    }

    return null;
  };

  // ----------------------------------------------------------------------
  // RENDER: Auth Page vs Main App
  // ----------------------------------------------------------------------

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} />;
  }

  // ----------------------------------------------------------------------

  if (!hasApiKey && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg max-w-md w-full text-center relative">
           {/* Add Logout to Missing Key screen in case user gets stuck */}
           <button 
             onClick={handleLogout} 
             className="absolute top-4 right-4 text-xs text-slate-400 hover:text-slate-600 underline"
           >
             Sign Out
           </button>

           <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl">⚠️</span>
           </div>
           <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Missing API Key</h1>
           <p className="text-slate-600 dark:text-slate-300 mb-6">
             To use LeadScout AI's live features, you must provide a valid Gemini API Key.
           </p>
           <div className="bg-slate-100 dark:bg-slate-700 p-4 rounded text-sm text-left text-slate-700 dark:text-slate-200 mb-6">
             <p className="font-semibold mb-1">How to fix:</p>
             <ol className="list-decimal pl-4 space-y-1">
               <li>Get a key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">Google AI Studio</a>.</li>
               <li>Set it as the <code className="bg-slate-200 dark:bg-slate-600 px-1 rounded">API_KEY</code> environment variable.</li>
             </ol>
           </div>
           <div className="space-y-3">
             <button onClick={() => window.location.reload()} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium transition-colors">
               I've added the key, reload
             </button>
             <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase">or</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-600"></div>
             </div>
             <button onClick={startDemoMode} className="w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-colors flex items-center justify-center">
               <Play size={16} className="mr-2 text-blue-600 dark:text-blue-400" /> Try Demo Mode
             </button>
           </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onNavigate={setActiveTab}
      isDevMode={isDevMode}
      onToggleDevMode={() => setIsDevMode(!isDevMode)}
      isDarkMode={isDarkMode}
      onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      onOpenSettings={() => setIsSettingsOpen(true)}
      onLogout={handleLogout}
    >
      {renderContent()}
      
      {/* GLOBAL CALL WIZARD MODAL */}
      {activeCallLead && (
          <CallWizard 
            lead={activeCallLead}
            scripts={scripts}
            onClose={() => {
                setActiveCallLead(null);
                setActiveCallContext(null);
            }}
            onLogCall={handleLogCall}
          />
      )}

      {/* SETTINGS MODAL */}
      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         phoneNumbers={phoneNumbers}
         onAddNumber={handleAddPhoneNumber}
         onRemoveNumber={handleRemovePhoneNumber}
      />
    </Layout>
  );
};

export default App;
