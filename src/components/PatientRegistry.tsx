import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Search, 
  Plus, 
  MoreVertical, 
  Mail, 
  Phone,
  Calendar,
  FileText,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface PatientRegistryProps {
  searchQuery: string;
}

export default function PatientRegistry({ searchQuery: globalSearch }: PatientRegistryProps) {
  const [patients, setPatients] = useState<any[]>([]);
  const [localSearch, setLocalSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Male'
  });

  const fetchPatients = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching subjects:', error);
    } else {
      setPatients(data || []);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('subjects').insert([{
        ...newPatient,
        age: parseInt(newPatient.age),
        last_visit: new Date().toISOString()
      }]);
      if (error) throw error;
      setIsAdding(false);
      setNewPatient({ name: '', age: '', gender: 'Male' });
    } catch (error) {
      console.error('Error adding subject:', error);
    }
  };

  useEffect(() => {
    fetchPatients();

    const channel = supabase
      .channel('subjects-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'subjects' },
        () => fetchPatients()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes((localSearch || globalSearch).toLowerCase()) ||
    p.id?.toLowerCase().includes((localSearch || globalSearch).toLowerCase())
  );

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-on-surface tracking-tight">Subject Registry</h1>
          <p className="text-on-surface-dim text-[10px] sm:text-[12px] uppercase tracking-widest mt-1">Patient Database & Medical History</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-dim" />
            <input 
              type="text" 
              placeholder="Search subjects..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-11 pr-6 py-2 bg-transparent border border-border rounded-full text-[12px] uppercase tracking-widest focus:outline-none focus:border-primary sm:w-64 transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-2 border border-primary text-primary rounded-full font-medium text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            <Plus className="w-3 h-3" /> Add Subject
          </button>
        </div>
      </header>

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
            <form onSubmit={handleAddPatient} className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Full Name</label>
                <input 
                  required
                  type="text" 
                  value={newPatient.name}
                  onChange={e => setNewPatient({...newPatient, name: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Age</label>
                <input 
                  required
                  type="number" 
                  value={newPatient.age}
                  onChange={e => setNewPatient({...newPatient, age: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Gender</label>
                <select 
                  value={newPatient.gender}
                  onChange={e => setNewPatient({...newPatient, gender: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all">
                  Register Subject
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4">
        {filteredPatients.length > 0 ? filteredPatients.map((patient, i) => (
          <motion.div
            key={patient.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="border border-border p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:border-primary/40 transition-all"
          >
            <div className="flex items-center gap-4 sm:gap-8 flex-1">
              <div className="w-12 h-12 border border-border flex items-center justify-center text-on-surface-dim group-hover:text-primary group-hover:border-primary transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-12 flex-1">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Subject Name</span>
                  <span className="font-serif italic text-[14px] sm:text-[16px] text-on-surface">{patient.name}</span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Reference ID</span>
                  <span className="font-mono text-primary text-[12px] sm:text-[13px]">{patient.id.slice(0, 8)}...</span>
                </div>
                <div className="hidden lg:block">
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Demographics</span>
                  <span className="text-[12px] sm:text-[13px] text-on-surface-dim">{patient.age}y / {patient.gender}</span>
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-on-surface-dim block mb-1">Last Activity</span>
                  <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-on-surface-dim">
                    <Calendar className="w-3 h-3" />
                    {patient.last_visit ? new Date(patient.last_visit).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-8">
              <div className="flex items-center gap-2">
                <button className="p-2 border border-border text-on-surface-dim hover:text-primary hover:border-primary transition-all">
                  <Mail className="w-4 h-4" />
                </button>
                <button className="p-2 border border-border text-on-surface-dim hover:text-primary hover:border-primary transition-all">
                  <Phone className="w-4 h-4" />
                </button>
                <button className="p-2 border border-border text-on-surface-dim hover:text-primary hover:border-primary transition-all">
                  <FileText className="w-4 h-4" />
                </button>
              </div>
              <button className="p-2 hover:text-primary transition-colors">
                <MoreVertical className="w-4 h-4 text-on-surface-dim" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="py-24 text-center border border-dashed border-border">
            <p className="text-on-surface-dim text-[12px] uppercase tracking-widest">No subjects found in registry</p>
          </div>
        )}
      </div>
    </div>
  );
}
