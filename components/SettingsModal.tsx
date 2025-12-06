import React, { useState } from 'react';
import { X, Phone, Plus, Trash2, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import { Button } from './Button';
import { PhoneNumber } from '../types';
import { AddPhoneNumberModal } from './AddPhoneNumberModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumbers: PhoneNumber[];
  onAddNumber: (phone: PhoneNumber) => void;
  onRemoveNumber: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  phoneNumbers, 
  onAddNumber, 
  onRemoveNumber 
}) => {
  const [activeTab, setActiveTab] = useState('phone-numbers');
  const [showAddNumber, setShowAddNumber] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
       {/* Main Settings Window */}
       <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-200">
          
          {/* Sidebar */}
          <div className="w-64 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-4">
             <div className="flex items-center space-x-2 mb-8 px-2">
                <SettingsIcon className="text-slate-500 dark:text-slate-400" />
                <h2 className="font-bold text-slate-800 dark:text-white">Settings</h2>
             </div>
             
             <nav className="space-y-1">
                <button 
                  onClick={() => setActiveTab('phone-numbers')}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'phone-numbers' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                >
                   <Phone size={16} />
                   <span>Phone Numbers</span>
                </button>
                <button 
                  disabled
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed opacity-60"
                >
                   <span>Billing (Coming Soon)</span>
                </button>
             </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-800">
             <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white">Phone Numbers</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                   <X size={24} />
                </button>
             </div>
             
             <div className="flex-1 overflow-y-auto p-8">
                <div className="flex justify-between items-center mb-6">
                   <p className="text-slate-500 dark:text-slate-400 text-sm">
                      Manage your virtual and external numbers for outbound calling.
                   </p>
                   <Button onClick={() => setShowAddNumber(true)}>
                      <Plus size={16} className="mr-2" /> Add Number
                   </Button>
                </div>

                <div className="space-y-4">
                   {phoneNumbers.length === 0 ? (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 border-dashed">
                         <Phone size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                         <p className="text-slate-500 dark:text-slate-400">No phone numbers configured.</p>
                      </div>
                   ) : (
                      phoneNumbers.map(phone => (
                         <div key={phone.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 rounded-lg group hover:border-blue-300 dark:hover:border-blue-500 transition-colors shadow-sm">
                            <div className="flex items-center space-x-4">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${phone.type === 'External' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                  <Phone size={20} />
                               </div>
                               <div>
                                  <div className="flex items-center space-x-2">
                                     <span className="font-bold text-slate-800 dark:text-white text-lg">{phone.number}</span>
                                     {phone.status === 'Verified' && (
                                        <span className="text-green-500" title="Verified">
                                           <CheckCircle2 size={16} />
                                        </span>
                                     )}
                                  </div>
                                  <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                                     <span className="uppercase font-semibold tracking-wider">{phone.type}</span>
                                     <span>•</span>
                                     <span>{phone.countryCode}</span>
                                  </div>
                               </div>
                            </div>
                            <button 
                               onClick={() => onRemoveNumber(phone.id)}
                               className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            >
                               <Trash2 size={18} />
                            </button>
                         </div>
                      ))
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* Add Phone Number Modal */}
       {showAddNumber && (
          <AddPhoneNumberModal 
             onClose={() => setShowAddNumber(false)}
             onAdd={onAddNumber}
          />
       )}
    </div>
  );
};