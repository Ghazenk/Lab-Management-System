import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Plus, 
  MoreVertical,
  Calendar,
  User,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface SampleListProps {
  searchQuery: string;
}

export default function SampleList({ searchQuery: globalSearch }: SampleListProps) {
  const [samples, setSamples] = useState<any[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [technicianFilter, setTechnicianFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [newSample, setNewSample] = useState({
    patient_name: '',
    test_type: '',
    priority: 'Medium',
    status: 'Pending'
  });

  const fetchSamples = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('samples')
      .select('*')
      .order('collected_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching samples:', error);
    } else {
      setSamples(data || []);
    }
  };

  useEffect(() => {
    fetchSamples();

    const channel = supabase
      .channel('samples-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'samples' },
        () => fetchSamples()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddSample = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('samples').insert([newSample]);
      if (error) throw error;
      setIsAdding(false);
      setNewSample({ patient_name: '', test_type: '', priority: 'Medium', status: 'Pending' });
    } catch (error) {
      console.error('Error adding sample:', error);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('samples')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      // Real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const technicians = Array.from(new Set(samples.map(s => s.created_by).filter(Boolean)));

  const filteredSamples = samples.filter(s => {
    const matchesSearch = s.patient_name?.toLowerCase().includes((localSearch || globalSearch).toLowerCase()) ||
                         s.test_type?.toLowerCase().includes((localSearch || globalSearch).toLowerCase()) ||
                         s.id?.toLowerCase().includes((localSearch || globalSearch).toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchesTechnician = technicianFilter === 'All' || s.created_by === technicianFilter;
    
    let matchesDate = true;
    if (dateRange.start || dateRange.end) {
      const sampleDate = new Date(s.collected_at).getTime();
      if (dateRange.start) {
        matchesDate = matchesDate && sampleDate >= new Date(dateRange.start).getTime();
      }
      if (dateRange.end) {
        matchesDate = matchesDate && sampleDate <= new Date(dateRange.end).getTime() + 86400000; // Include full end day
      }
    }

    return matchesSearch && matchesStatus && matchesTechnician && matchesDate;
  });

  const statusColors: Record<string, string> = {
    'Pending': 'border-amber-500/50 text-amber-500 bg-amber-500/5',
    'Processing': 'border-primary/50 text-primary bg-primary/5',
    'Completed': 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5',
    'Cancelled': 'border-rose-500/50 text-rose-500 bg-rose-500/5'
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-on-surface tracking-tight">Sample Registry</h1>
          <p className="text-on-surface-dim text-[10px] sm:text-[12px] uppercase tracking-widest mt-1">Analytical Specimen Queue</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-2 border border-primary text-primary rounded-full font-medium text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            <Plus className="w-3 h-3" /> New Specimen
          </button>
        </div>
      </header>

      {/* Enhanced Filtering Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border border-border bg-surface-low rounded-lg">
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-on-surface-dim ml-2">Status</label>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-dim" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="All" className="bg-surface">All Statuses</option>
              <option value="Pending" className="bg-surface">Pending</option>
              <option value="Processing" className="bg-surface">Processing</option>
              <option value="Completed" className="bg-surface">Completed</option>
              <option value="Cancelled" className="bg-surface">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-on-surface-dim ml-2">Technician</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-dim" />
            <select 
              value={technicianFilter}
              onChange={(e) => setTechnicianFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary appearance-none cursor-pointer"
            >
              <option value="All" className="bg-surface">All Technicians</option>
              {technicians.map(tech => (
                <option key={tech} value={tech} className="bg-surface">{tech}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-on-surface-dim ml-2">Date Range</label>
          <div className="flex gap-2">
            <input 
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
              className="w-full px-3 py-2 bg-transparent border border-border rounded-full text-[11px] focus:outline-none focus:border-primary"
            />
            <input 
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
              className="w-full px-3 py-2 bg-transparent border border-border rounded-full text-[11px] focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase tracking-widest text-on-surface-dim ml-2">Search</label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-dim" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-transparent border border-border rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="border border-primary/30 p-6 bg-primary/5 relative"
          >
            <button 
              onClick={() => setIsAdding(false)}
              className="absolute top-4 right-4 text-on-surface-dim hover:text-primary"
            >
              <X className="w-4 h-4" />
            </button>
            <form onSubmit={handleAddSample} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Subject Name</label>
                <input 
                  required
                  type="text" 
                  value={newSample.patient_name}
                  onChange={e => setNewSample({...newSample, patient_name: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Test Type</label>
                <input 
                  required
                  type="text" 
                  value={newSample.test_type}
                  onChange={e => setNewSample({...newSample, test_type: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Priority</label>
                <select 
                  value={newSample.priority}
                  onChange={e => setNewSample({...newSample, priority: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all">
                  Register Specimen
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {filteredSamples.length > 0 ? filteredSamples.map((sample, i) => (
          <motion.div
            key={sample.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setSelectedSample(sample)}
            className="border border-border p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4 sm:gap-8 flex-1">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Reference ID</span>
                  <span className="font-mono text-primary text-[12px] sm:text-[14px]">{sample.id.slice(0, 8)}...</span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Subject</span>
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-on-surface-dim" />
                    <span className="text-[12px] sm:text-[13px] text-on-surface truncate">{sample.patient_name}</span>
                  </div>
                </div>
                <div className="hidden lg:block">
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Collection</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-on-surface-dim" />
                    <span className="text-[12px] sm:text-[13px] text-on-surface-dim">{new Date(sample.collected_at).toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Priority</span>
                  <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-on-surface">
                    <div className={`w-1.5 h-1.5 rounded-full ${sample.priority === 'High' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                    {sample.priority}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8">
              <select 
                value={sample.status}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => handleStatusUpdate(sample.id, e.target.value)}
                className={`px-3 sm:px-4 py-1 border text-[10px] sm:text-[11px] uppercase tracking-widest bg-transparent focus:outline-none cursor-pointer transition-all ${statusColors[sample.status] || 'border-border text-on-surface-dim'}`}
              >
                <option value="Pending" className="bg-surface">Pending</option>
                <option value="Processing" className="bg-surface">Processing</option>
                <option value="Completed" className="bg-surface">Completed</option>
                <option value="Cancelled" className="bg-surface">Cancelled</option>
              </select>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSample(sample);
                }}
                className="p-2 hover:text-primary transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-on-surface-dim" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="py-24 text-center border border-dashed border-border">
            <p className="text-on-surface-dim text-[12px] uppercase tracking-widest">No specimens found matching current criteria</p>
          </div>
        )}
      </div>

      {/* Specimen Detail Modal */}
      <AnimatePresence>
        {selectedSample && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSample(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-surface border border-border p-8 sm:p-12 shadow-2xl"
            >
              <button 
                onClick={() => setSelectedSample(null)}
                className="absolute top-6 right-6 text-on-surface-dim hover:text-primary transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="space-y-10">
                <header>
                  <span className="text-[11px] uppercase tracking-[3px] text-primary font-bold mb-2 block">Specimen Dossier</span>
                  <h2 className="text-3xl font-serif italic text-on-surface">{selectedSample.patient_name}</h2>
                  <p className="text-[12px] text-on-surface-dim uppercase tracking-widest mt-1">Ref: {selectedSample.id}</p>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Diagnostic Protocol</label>
                      <p className="text-[15px] font-medium text-on-surface">{selectedSample.test_type}</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Priority Level</label>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${selectedSample.priority === 'High' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <p className="text-[15px] font-medium text-on-surface">{selectedSample.priority}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Current Status</label>
                      <span className={`inline-block px-3 py-1 border text-[11px] uppercase tracking-widest ${statusColors[selectedSample.status]}`}>
                        {selectedSample.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Collection Timestamp</label>
                      <div className="flex items-center gap-2 text-on-surface">
                        <Calendar className="w-4 h-4 text-primary" />
                        <p className="text-[14px]">{new Date(selectedSample.collected_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Originating Technician</label>
                      <div className="flex items-center gap-2 text-on-surface">
                        <User className="w-4 h-4 text-primary" />
                        <p className="text-[14px]">{selectedSample.created_by || 'System Automated'}</p>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">System Entry</label>
                      <p className="text-[14px] text-on-surface-dim">{new Date(selectedSample.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-border flex justify-end gap-4">
                  <button 
                    onClick={() => setSelectedSample(null)}
                    className="px-8 py-2 border border-border text-[11px] uppercase tracking-widest hover:bg-surface-low transition-all"
                  >
                    Close Dossier
                  </button>
                  <button 
                    className="px-8 py-2 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all"
                  >
                    Print Label
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
