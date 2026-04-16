import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  Download, 
  Filter, 
  Calendar,
  ChevronRight,
  BarChart3,
  Activity,
  Plus
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface ReportsProps {
  searchQuery: string;
}

export default function Reports({ searchQuery: globalSearch }: ReportsProps) {
  const [search, setSearch] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    accuracy: '99.9%',
    avgGen: '1.2s'
  });

  const fetchReports = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching reports:', error);
    } else {
      setReports(data || []);
      setStats(prev => ({ ...prev, total: data?.length || 0 }));
    }
  };

  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => fetchReports()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleGenerate = async () => {
    if (!isSupabaseConfigured) return;
    setIsGenerating(true);
    
    try {
      const newReport = {
        name: `Analytical Summary ${new Date().toLocaleDateString()}`,
        type: 'Analytical',
        date: new Date().toISOString().split('T')[0],
        status: 'Finalized'
      };

      const { error } = await supabase.from('reports').insert([newReport]);
      if (error) throw error;
      
      alert("Analytical Report Compiled Successfully.");
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const filteredReports = reports.filter(r => 
    r.name?.toLowerCase().includes((search || globalSearch).toLowerCase()) ||
    r.id?.toString().toLowerCase().includes((search || globalSearch).toLowerCase())
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-normal text-on-surface tracking-tight">Analytical Reports</h1>
          <p className="text-on-surface-dim text-[12px] uppercase tracking-widest mt-1">Laboratory Performance & Data Exports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-dim" />
            <input 
              type="text"
              placeholder="Filter reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-transparent border border-border rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-6 py-2 border border-primary text-primary rounded-full font-medium text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
          >
            <Plus className="w-3 h-3" /> {isGenerating ? 'Compiling...' : 'Generate Report'}
          </button>
        </div>
      </header>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Reports', value: stats.total.toString(), icon: FileText },
          { label: 'Data Accuracy', value: stats.accuracy, icon: Activity },
          { label: 'Avg. Generation', value: stats.avgGen, icon: BarChart3 },
        ].map((stat, i) => (
          <div key={stat.label} className="border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="text-[10px] font-medium text-on-surface-dim uppercase tracking-widest">Live Metric</span>
            </div>
            <h3 className="text-2xl font-serif text-on-surface">{stat.value}</h3>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-dim mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Report List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-serif italic text-on-surface">Recent Documentation</h2>
          <div className="flex items-center gap-4">
            <button className="text-on-surface-dim hover:text-primary transition-colors">
              <Calendar className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {filteredReports.length > 0 ? filteredReports.map((report, i) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="border border-border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group hover:border-primary/40 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 border border-border flex items-center justify-center text-primary group-hover:border-primary transition-colors">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif italic text-on-surface group-hover:text-primary transition-colors">{report.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-dim">{report.id}</span>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">{report.type}</span>
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-dim">{new Date(report.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-8">
                <div className="text-right hidden md:block">
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-dim mb-1">Status</p>
                  <span className={`text-[11px] font-medium uppercase tracking-widest ${report.status === 'Finalized' ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {report.status}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-3 border border-border hover:border-primary hover:text-primary transition-all">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-3 border border-border hover:border-primary hover:text-primary transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-24 text-center border border-dashed border-border">
              <p className="text-on-surface-dim text-[12px] uppercase tracking-widest">No reports found matching current criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
