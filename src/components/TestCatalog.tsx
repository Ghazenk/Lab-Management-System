import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ChevronRight, 
  Activity, 
  Droplets, 
  Microscope, 
  Dna,
  Clock,
  DollarSign,
  Plus,
  X
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface TestCatalogProps {
  searchQuery: string;
}

export default function TestCatalog({ searchQuery: globalSearch }: TestCatalogProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [tests, setTests] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTest, setNewTest] = useState({
    name: '',
    category: 'Hematology',
    time: '',
    price: '',
    description: ''
  });

  const fetchTests = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('tests')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching tests:', error);
    } else {
      setTests(data || []);
    }
  };

  useEffect(() => {
    fetchTests();

    const channel = supabase
      .channel('tests-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tests' },
        () => fetchTests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddTest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('tests').insert([newTest]);
      if (error) throw error;
      setIsAdding(false);
      setNewTest({ name: '', category: 'Hematology', time: '', price: '', description: '' });
    } catch (error) {
      console.error('Error adding test:', error);
    }
  };

  const filteredTests = tests.filter(t => 
    t.name?.toLowerCase().includes((localSearch || globalSearch).toLowerCase()) ||
    t.category?.toLowerCase().includes((localSearch || globalSearch).toLowerCase()) ||
    t.id?.toString().toLowerCase().includes((localSearch || globalSearch).toLowerCase())
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Hematology': return Activity;
      case 'Biochemistry': return Droplets;
      case 'Microbiology': return Microscope;
      case 'Genetics': return Dna;
      default: return Activity;
    }
  };

  const testCategories = [
    { name: 'Hematology', icon: Activity, count: tests.filter(t => t.category === 'Hematology').length },
    { name: 'Biochemistry', icon: Droplets, count: tests.filter(t => t.category === 'Biochemistry').length },
    { name: 'Microbiology', icon: Microscope, count: tests.filter(t => t.category === 'Microbiology').length },
    { name: 'Genetics', icon: Dna, count: tests.filter(t => t.category === 'Genetics').length },
  ];

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-normal text-on-surface tracking-tight">Diagnostic Inventory</h1>
          <p className="text-on-surface-dim text-[10px] sm:text-[12px] uppercase tracking-widest mt-1">Available Analytical Protocols</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-dim" />
            <input 
              type="text" 
              placeholder="Search protocols..." 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-11 pr-6 py-2 bg-transparent border border-border rounded-full text-[12px] uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-2 border border-primary text-primary rounded-full font-medium text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all whitespace-nowrap"
          >
            <Plus className="w-3 h-3" /> Add Protocol
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
            <form onSubmit={handleAddTest} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Protocol Name</label>
                <input 
                  required
                  type="text" 
                  value={newTest.name}
                  onChange={e => setNewTest({...newTest, name: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Category</label>
                <select 
                  value={newTest.category}
                  onChange={e => setNewTest({...newTest, category: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Genetics">Genetics</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Turnaround Time</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. 4-6 Hours"
                  value={newTest.time}
                  onChange={e => setNewTest({...newTest, time: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Price</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. $45.00"
                  value={newTest.price}
                  onChange={e => setNewTest({...newTest, price: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Description</label>
                <input 
                  required
                  type="text" 
                  value={newTest.description}
                  onChange={e => setNewTest({...newTest, description: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="px-12 py-2 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all">
                  Register Protocol
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {testCategories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setLocalSearch(cat.name)}
            className={`border p-4 sm:p-6 group cursor-pointer transition-all duration-500 ${
              localSearch === cat.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
            }`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <cat.icon className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${localSearch === cat.name ? 'text-primary' : 'text-on-surface-dim group-hover:text-primary'}`} />
              <span className="text-[8px] sm:text-[10px] font-medium text-on-surface-dim uppercase tracking-widest">{cat.count} Protocols</span>
            </div>
            <h3 className={`font-serif italic text-base sm:text-lg transition-colors ${localSearch === cat.name ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>{cat.name}</h3>
          </motion.div>
        ))}
      </div>

      {/* Test Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {filteredTests.length > 0 ? filteredTests.map((test, i) => (
          <motion.div
            key={test.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="border border-border p-6 sm:p-8 flex flex-col justify-between group hover:border-primary/40 transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start mb-3 sm:mb-4">
                <span className="text-[9px] sm:text-[10px] font-medium uppercase tracking-widest text-primary">
                  {test.category}
                </span>
                <span className="font-mono text-[10px] sm:text-[11px] text-on-surface-dim">{test.id}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-normal text-on-surface mb-2 sm:mb-3 group-hover:text-primary transition-colors">
                {test.name}
              </h3>
              <p className="text-[12px] sm:text-[13px] text-on-surface-dim leading-relaxed mb-6">
                {test.description}
              </p>
            </div>
            
            <div className="pt-6 border-t border-border flex items-center justify-between">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-on-surface-dim" />
                  <span className="text-[10px] sm:text-[11px] font-medium text-on-surface-dim uppercase tracking-widest">{test.time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-on-surface-dim" />
                  <span className="text-[10px] sm:text-[11px] font-medium text-on-surface-dim uppercase tracking-widest">{test.price}</span>
                </div>
              </div>
              <button className="w-8 h-8 border border-border rounded-full flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-all">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full py-24 text-center border border-dashed border-border">
            <p className="text-on-surface-dim text-[12px] uppercase tracking-widest">No protocols found matching current criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
