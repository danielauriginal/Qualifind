
import React, { useState } from 'react';
import { Database, Mail, Lock, ArrowRight, Github, Chrome, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface AuthPageProps {
  onLogin: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    if (isLogin) {
      if (username === 'admin' && password === 'prozess17') {
        onLogin();
      } else {
        setError('Invalid credentials. Please try again.');
        setIsLoading(false);
      }
    } else {
      // Registration simulation
      if (username.length < 3 || password.length < 6) {
         setError('Password must be at least 6 characters.');
         setIsLoading(false);
      } else {
         // Auto-login for demo registration
         onLogin();
      }
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/50">
              <Database size={24} className="text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight">LeadScout AI</span>
          </div>
          
          <h1 className="text-5xl font-extrabold leading-tight mb-6">
            Automate your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">B2B Outreach</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-md">
            Discover, enrich, and contact leads 10x faster with AI-powered scraping and analysis.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
           <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                 <CheckCircle2 size={20} />
              </div>
              <div>
                 <p className="font-bold text-sm">Real-time Scraping</p>
                 <p className="text-xs text-slate-400">Live Google Maps & Web extraction</p>
              </div>
           </div>
           <div className="flex items-center space-x-4 bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
              <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                 <CheckCircle2 size={20} />
              </div>
              <div>
                 <p className="font-bold text-sm">AI Enrichment</p>
                 <p className="text-xs text-slate-400">Find CEOs, Emails & Financial data</p>
              </div>
           </div>
        </div>

        <div className="relative z-10 text-sm text-slate-500">
           © 2024 LeadScout AI Inc.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
         <div className="max-w-md w-full space-y-8">
            <div className="text-center">
               <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                 {isLogin ? 'Welcome back' : 'Create an account'}
               </h2>
               <p className="mt-2 text-slate-600 dark:text-slate-400">
                 {isLogin ? 'Enter your details to access your workspace.' : 'Start your 14-day free trial today.'}
               </p>
            </div>

            {/* Demo Credentials Hint */}
            {isLogin && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-300">
                 <p className="font-bold mb-1 flex items-center"><AlertCircle size={14} className="mr-2"/> Demo Credentials:</p>
                 <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                    <div>User: <span className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-700 select-all">admin</span></div>
                    <div>Pass: <span className="bg-white dark:bg-slate-800 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-700 select-all">prozess17</span></div>
                 </div>
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
               <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username / Email</label>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={18} className="text-slate-400" />
                       </div>
                       <input 
                         type="text" 
                         required
                         value={username}
                         onChange={(e) => setUsername(e.target.value)}
                         className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                         placeholder={isLogin ? "admin" : "name@company.com"}
                       />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center mb-1">
                       <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                       {isLogin && <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">Forgot password?</a>}
                    </div>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock size={18} className="text-slate-400" />
                       </div>
                       <input 
                         type="password" 
                         required
                         value={password}
                         onChange={(e) => setPassword(e.target.value)}
                         className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                         placeholder="••••••••"
                       />
                    </div>
                  </div>
               </div>

               {error && (
                 <div className="text-red-500 text-sm flex items-center justify-center bg-red-50 dark:bg-red-900/20 p-2 rounded">
                    <AlertCircle size={16} className="mr-2" /> {error}
                 </div>
               )}

               <Button 
                  type="submit" 
                  className="w-full py-3 text-base flex justify-center items-center" 
                  isLoading={isLoading}
                >
                  {isLogin ? 'Sign in' : 'Create account'} 
                  {!isLoading && <ArrowRight size={18} className="ml-2" />}
               </Button>
            </form>

            <div className="relative">
               <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
               </div>
               <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-50 dark:bg-slate-900 text-slate-500">Or continue with</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <button className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Chrome size={18} className="mr-2 text-slate-900 dark:text-white" /> Google
               </button>
               <button className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  <Github size={18} className="mr-2 text-slate-900 dark:text-white" /> GitHub
               </button>
            </div>

            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
               {isLogin ? "Don't have an account? " : "Already have an account? "}
               <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-bold text-blue-600 hover:text-blue-500 dark:text-blue-400 transition-colors">
                  {isLogin ? 'Sign up' : 'Sign in'}
               </button>
            </p>
         </div>
      </div>
    </div>
  );
};
