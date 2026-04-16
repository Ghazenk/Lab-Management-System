import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Download
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export default function Dashboard({ setActiveTab }: DashboardProps) {
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [statsData, setStatsData] = useState([
    { label: 'Total Specimens', value: '0', icon: TrendingUp },
    { label: 'Pending Assays', value: '0', icon: Clock },
    { label: 'Equipment Uptime', value: '99.8%', icon: CheckCircle2 },
    { label: 'Critical Alerts', value: '0', icon: AlertCircle },
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const fetchDashboardData = async () => {
    if (!isSupabaseConfigured) return;

    // Fetch recent activities
    const { data: recent, error: recentError } = await supabase
      .from('samples')
      .select('*')
      .order('collected_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('Error fetching recent activities:', recentError);
    } else {
      setRecentActivities(recent || []);
    }

    // Fetch stats
    const { count: totalCount } = await supabase.from('samples').select('*', { count: 'exact', head: true });
    const { count: pendingCount } = await supabase.from('samples').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    const { count: criticalCount } = await supabase.from('samples').select('*', { count: 'exact', head: true }).eq('priority', 'High');

    setStatsData([
      { label: 'Total Specimens', value: (totalCount || 0).toString(), icon: TrendingUp },
      { label: 'Pending Assays', value: (pendingCount || 0).toString(), icon: Clock },
      { label: 'Equipment Uptime', value: '99.8%', icon: CheckCircle2 },
      { label: 'Critical Alerts', value: (criticalCount || 0).toString().padStart(2, '0'), icon: AlertCircle },
    ]);
  };

  useEffect(() => {
    fetchDashboardData();

    // Real-time subscription
    const channel = supabase
      .channel('dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'samples' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const data = JSON.stringify(recentActivities, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `helix_registry_export_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setIsExporting(false);
    }, 1500);
  };

  const handleSeed = async () => {
    if (!isSupabaseConfigured) {
      alert("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
      return;
    }
    setIsSeeding(true);
    try {
      const sampleData = [
        { patient_name: 'Subject 44-B', test_type: 'PCR Sequences', priority: 'High', status: 'Processing' },
        { patient_name: 'Subject 12-Z', test_type: 'Cytology Screen', priority: 'Medium', status: 'Received' },
      ];

      const subjectData = [
        { name: 'Julian Thorne', age: 42, gender: 'Male' },
        { name: 'Elena Vance', age: 29, gender: 'Female' },
      ];

      const reportData = [
        { name: 'Monthly Throughput Analysis', type: 'Performance', date: '2024-04-01', status: 'Finalized' },
        { name: 'Equipment Maintenance Audit', type: 'Maintenance', date: '2024-04-05', status: 'Finalized' },
      ];

      const testData = [
        { name: 'Complete Blood Count (CBC)', category: 'Hematology', time: '4-6 Hours', price: '$45.00', description: 'Comprehensive analysis of red/white blood cells and platelets.' },
        { name: 'Lipid Profile', category: 'Biochemistry', time: '8-12 Hours', price: '$65.00', description: 'Measures cholesterol and triglyceride levels in the blood.' },
      ];

      const equipmentData = [
        { name: 'Hematology Analyzer', status: 'Online', health: 98, last_service: '2024-03-15', temperature: '22°C' },
        { name: 'Centrifuge X-200', status: 'Maintenance', health: 45, last_service: '2024-04-10', temperature: '24°C' },
      ];

      const { data: createdEquipment, error: eqError } = await supabase.from('equipment').insert(equipmentData).select();
      if (eqError) throw eqError;

      if (createdEquipment && createdEquipment.length > 0) {
        const historyData = createdEquipment.flatMap(eq => [
          { equipment_id: eq.id, health: eq.health - 10, recorded_at: new Date(Date.now() - 86400000 * 3).toISOString() },
          { equipment_id: eq.id, health: eq.health - 5, recorded_at: new Date(Date.now() - 86400000 * 2).toISOString() },
          { equipment_id: eq.id, health: eq.health - 2, recorded_at: new Date(Date.now() - 86400000 * 1).toISOString() },
          { equipment_id: eq.id, health: eq.health, recorded_at: new Date().toISOString() },
        ]);
        const { error: histError } = await supabase.from('equipment_history').insert(historyData);
        if (histError) throw histError;
      }

      const { error: sampleError } = await supabase.from('samples').insert(sampleData);
      if (sampleError) throw sampleError;

      const { error: subjectError } = await supabase.from('subjects').insert(subjectData);
      if (subjectError) throw subjectError;

      const { error: reportError } = await supabase.from('reports').insert(reportData);
      if (reportError) throw reportError;

      const { error: testError } = await supabase.from('tests').insert(testData);
      if (testError) throw testError;

      const { error: notifyError } = await supabase.from('notifications').insert([{
        title: 'System Initialized',
        message: 'Laboratory cloud node has been successfully synchronized and seeded.',
        type: 'success',
        read: false
      }]);
      if (notifyError) throw notifyError;

      alert("Laboratory Database Seeded Successfully.");
    } catch (error: any) {
      console.error('Seeding error:', error);
      alert(`Seeding failed: ${error.message || 'Unknown error'}. Ensure tables are created in Supabase SQL Editor.`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8 sm:space-y-12">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <span className="text-[10px] sm:text-[12px] font-medium uppercase tracking-[2px] text-on-surface-dim mb-2 block">
            Analytical Overview
          </span>
          <h1 className="text-3xl sm:text-[42px] font-serif font-normal text-on-surface leading-none">
            Central Lab Node-4
          </h1>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="text-[10px] sm:text-[11px] px-3 py-1 border border-primary text-primary rounded-full uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all disabled:opacity-50"
          >
            {isSeeding ? 'Seeding...' : 'Seed Laboratory Data'}
          </button>
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 sm:px-6 py-2 border border-border text-on-surface-dim rounded-full font-medium text-[10px] sm:text-[11px] uppercase tracking-widest hover:text-on-surface transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Processing...' : <><Download className="w-3 h-3" /> Export Registry</>}
          </button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsData.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="border border-border p-4 sm:p-6 relative group"
          >
            <span className="text-[10px] sm:text-[11px] font-medium text-on-surface-dim uppercase tracking-widest mb-2 sm:mb-3 block">
              {stat.label}
            </span>
            <div className="font-serif text-2xl sm:text-[32px] text-on-surface">
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-base sm:text-lg font-serif italic text-on-surface">Recent Specimen Processing</h2>
          <button 
            onClick={() => setActiveTab('samples')}
            className="text-on-surface-dim font-medium text-[11px] sm:text-[12px] underline hover:text-on-surface transition-colors"
          >
            View Full Registry
          </button>
        </div>
        
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="text-left border-b border-border">
                  <th className="pb-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-on-surface-dim">Reference ID</th>
                  <th className="pb-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-on-surface-dim">Subject</th>
                  <th className="pb-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-on-surface-dim hidden md:table-cell">Test Type</th>
                  <th className="pb-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-on-surface-dim">Priority</th>
                  <th className="pb-4 text-[10px] sm:text-[11px] font-medium uppercase tracking-widest text-on-surface-dim text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivities.length > 0 ? recentActivities.map((activity) => (
                  <tr key={activity.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 sm:py-5 font-mono text-primary text-[12px] sm:text-[13px]">{activity.id.slice(0, 8)}...</td>
                    <td className="py-4 sm:py-5 text-[12px] sm:text-[13px] text-on-surface">{activity.patient_name}</td>
                    <td className="py-4 sm:py-5 text-[12px] sm:text-[13px] text-on-surface-dim hidden md:table-cell">{activity.test_type}</td>
                    <td className="py-4 sm:py-5">
                      <div className="flex items-center gap-2 text-[12px] sm:text-[13px] text-on-surface">
                        <div className={`w-1.5 h-1.5 rounded-full ${activity.priority === 'High' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <span className="hidden sm:inline">{activity.priority}</span>
                      </div>
                    </td>
                    <td className="py-4 sm:py-5 text-[12px] sm:text-[13px] text-on-surface-dim text-right uppercase tracking-widest">{activity.status}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-on-surface-dim text-[12px] uppercase tracking-widest">
                      No recent specimen data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
