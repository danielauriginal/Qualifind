import React from 'react';
import { Search, MapPin, Target, List } from 'lucide-react';
import { Button } from './Button';
import { SearchParams } from '../types';

interface NewSearchProps {
  onStartSearch: (params: SearchParams) => void;
  isProcessing: boolean;
}

export const NewSearch: React.FC<NewSearchProps> = ({ onStartSearch, isProcessing }) => {
  const [params, setParams] = React.useState<SearchParams>({
    industry: '',
    location: '',
    radius: 10,
    minRating: 0,
    minReviews: 0,
    mustHaveWebsite: false,
    limit: 10,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartSearch(params);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Target className="w-5 h-5 mr-2 text-blue-600" />
            Start New Research Project
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Define your target audience and let LeadScout find the best prospects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Industry / Keyword
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={params.industry}
                  onChange={(e) => setParams({ ...params, industry: e.target.value })}
                  placeholder="e.g. Dental Clinic, SaaS, Restaurant"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={params.location}
                  onChange={(e) => setParams({ ...params, location: e.target.value })}
                  placeholder="e.g. Berlin, New York, 90210"
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow bg-white text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Max Results
              </label>
              <div className="relative">
                <List className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  value={params.limit}
                  onChange={(e) => setParams({ ...params, limit: Number(e.target.value) })}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
                >
                  <option value={5}>5 Leads</option>
                  <option value={10}>10 Leads</option>
                  <option value={25}>25 Leads</option>
                  <option value={50}>50 Leads</option>
                  <option value={100}>100 Leads</option>
                  <option value={250}>250 Leads</option>
                  <option value={500}>500 Leads</option>
                  <option value={1000}>1000 Leads</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Search Radius
              </label>
              <select
                value={params.radius}
                onChange={(e) => setParams({ ...params, radius: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
              >
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={20}>20 km</option>
                <option value={50}>50 km</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Min. Rating (0-5)
              </label>
              <input
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={params.minRating}
                onChange={(e) => setParams({ ...params, minRating: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
              />
            </div>
             <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">
                Min. Reviews
              </label>
              <input
                type="number"
                min="0"
                value={params.minReviews}
                onChange={(e) => setParams({ ...params, minReviews: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900"
              />
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={params.mustHaveWebsite}
                onChange={(e) => setParams({ ...params, mustHaveWebsite: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
              />
              <span className="text-sm text-slate-700">Only fetch businesses with a website</span>
            </label>

            <Button type="submit" size="lg" isLoading={isProcessing}>
              Start Lead Extraction
            </Button>
          </div>
        </form>
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Search Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="font-medium text-slate-800 mb-1">Be Specific</div>
            <p className="text-sm text-slate-500">Instead of "Food", try "Italian Restaurant" or "Organic Bakery" for better results.</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="font-medium text-slate-800 mb-1">Location Matters</div>
            <p className="text-sm text-slate-500">Postal codes often yield more precise density than broad city names.</p>
          </div>
        </div>
      </div>
    </div>
  );
};