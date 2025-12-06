import React, { useState } from 'react';
import { X, Phone, Globe, ArrowLeftRight, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { PhoneNumber } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface AddPhoneNumberModalProps {
  onClose: () => void;
  onAdd: (phone: PhoneNumber) => void;
}

export const AddPhoneNumberModal: React.FC<AddPhoneNumberModalProps> = ({ onClose, onAdd }) => {
  const [step, setStep] = useState<'SELECT' | 'FORM'>('SELECT');
  const [selectedType, setSelectedType] = useState<'Virtual' | 'External' | 'Ported' | null>(null);
  
  // Form State
  const [country, setCountry] = useState('Germany (+49)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSelect = (type: 'Virtual' | 'External' | 'Ported') => {
    setSelectedType(type);
    setStep('FORM');
  };

  const handleVerify = async () => {
    if (!phoneNumber) return;
    
    setIsVerifying(true);
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newNumber: PhoneNumber = {
      id: uuidv4(),
      number: phoneNumber,
      type: selectedType!,
      countryCode: country,
      status: 'Verified'
    };
    
    onAdd(newNumber);
    setIsVerifying(false);
    onClose();
  };

  const SelectionCard = ({ 
    type, 
    title, 
    description 
  }: { 
    type: 'Virtual' | 'External' | 'Ported', 
    title: string, 
    description: string 
  }) => (
    <div 
      onClick={() => handleSelect(type)}
      className="bg-slate-800 border border-slate-700 hover:border-blue-500 hover:bg-slate-700/50 p-6 rounded-lg cursor-pointer transition-all flex flex-col items-center text-center h-full group"
    >
      <h4 className="text-white font-semibold mb-2 group-hover:text-blue-400">{title}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#1e293b] rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-700 animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700 flex justify-between items-center bg-[#1e293b]">
          <h3 className="text-lg font-bold text-white">Add Personal Number</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {step === 'SELECT' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <SelectionCard 
                type="Virtual" 
                title="New Number" 
                description="We register a new number for you." 
              />
              <SelectionCard 
                type="External" 
                title="External Number" 
                description="Add any phone number for outgoing calls." 
              />
              <SelectionCard 
                type="Ported" 
                title="Porting & BYOC" 
                description="Number porting or advanced VoIP setup." 
              />
            </div>
          </div>
        )}

        {step === 'FORM' && (
          <div className="p-6 space-y-6">
            
            {/* Context Info */}
            {selectedType === 'External' && (
              <>
                 <div className="bg-[#0f2e4a] border border-[#1e4e75] rounded-lg p-4 text-blue-200 text-sm">
                    <strong>Note:</strong> You cannot receive calls or send/receive SMS with external numbers.
                 </div>
                 
                 <div className="bg-[#3a2c14] border border-[#5c451b] rounded-lg p-4 text-amber-200 text-sm">
                    You will be charged for the verification call. The cost varies depending on the country of the phone number. 
                    <a href="#" className="text-blue-400 hover:underline ml-1">Learn more about call rates</a>.
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-slate-200">Country</label>
                      <select 
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full bg-[#334155] border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      >
                         <option>Germany (+49)</option>
                         <option>United States (+1)</option>
                         <option>United Kingdom (+44)</option>
                         <option>France (+33)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                       <label className="block text-sm font-bold text-slate-200">Phone Number to add</label>
                       <input 
                         type="text" 
                         value={phoneNumber}
                         onChange={(e) => setPhoneNumber(e.target.value)}
                         placeholder="e.g. 151-123-4567"
                         className="w-full bg-[#334155] border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                       />
                    </div>
                 </div>
              </>
            )}

             {selectedType === 'Virtual' && (
               <div className="text-center py-8 text-slate-300">
                  <Globe size={48} className="mx-auto mb-4 text-blue-500" />
                  <p>Virtual number provisioning is simulated in this demo.</p>
                  <p className="text-sm text-slate-500 mt-2">Proceeding will create a test virtual number.</p>
                  <div className="mt-6 max-w-xs mx-auto">
                    <label className="block text-sm font-bold text-slate-200 text-left mb-1">Select Area Code</label>
                     <input 
                         type="text" 
                         value={phoneNumber}
                         onChange={(e) => setPhoneNumber(e.target.value)}
                         placeholder="e.g. 212"
                         className="w-full bg-[#334155] border border-slate-600 rounded-lg p-2.5 text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                       />
                  </div>
               </div>
             )}

             {selectedType === 'Ported' && (
               <div className="text-center py-8 text-slate-300">
                  <ArrowLeftRight size={48} className="mx-auto mb-4 text-purple-500" />
                  <p>Porting requests usually take 2-4 weeks.</p>
                  <p className="text-sm text-slate-500 mt-2">Please contact support to start a porting request.</p>
               </div>
             )}
          </div>
        )}

        {/* Footer */}
        {step === 'FORM' && (
          <div className="px-6 py-4 bg-[#0f172a] border-t border-slate-700 flex justify-between items-center">
             <a href="#" className="text-sm text-blue-400 hover:underline flex items-center">
               Learn about calling <ExternalLinkIcon className="ml-1 w-3 h-3" />
             </a>
             <div className="flex space-x-3">
               <button 
                 onClick={() => setStep('SELECT')} 
                 className="text-slate-300 hover:text-white font-medium text-sm px-4 py-2"
               >
                 Cancel
               </button>
               {selectedType !== 'Ported' && (
                 <Button onClick={handleVerify} isLoading={isVerifying} className="bg-blue-600 hover:bg-blue-700 text-white border-none">
                   {selectedType === 'External' ? 'Verify Number' : 'Provision Number'}
                 </Button>
               )}
               {selectedType === 'Ported' && (
                  <Button onClick={onClose} variant="secondary">Done</Button>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);