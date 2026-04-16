import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Cpu, 
  Thermometer, 
  Zap,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Trash2,
  Download,
  BarChart2,
  Filter,
  Edit2,
  Save,
  Undo2
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';

interface EquipmentProps {
  searchQuery: string;
}

export default function Equipment({ searchQuery: globalSearch }: EquipmentProps) {
  const [search, setSearch] = useState('');
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    status: 'Online',
    health: 100,
    last_service: new Date().toISOString().split('T')[0],
    temperature: '22°C'
  });

  const fetchEquipment = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching equipment:', error);
    } else {
      setEquipmentList(data || []);
    }
  };

  useEffect(() => {
    fetchEquipment();

    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'equipment' },
        (payload: any) => {
          fetchEquipment();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      const id = selectedNode?.id;
      if (!id || !isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('equipment_history')
        .select('*')
        .eq('equipment_id', id)
        .order('recorded_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching history:', error);
      } else {
        setHistoryData(data || []);
      }
    };

    fetchHistory();
  }, [selectedNode]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('equipment').insert([newEquipment]).select();
      if (error) throw error;

      if (data && data.length > 0) {
        await supabase.from('equipment_history').insert([{
          equipment_id: data[0].id,
          health: newEquipment.health,
          recorded_at: new Date().toISOString()
        }]);
      }

      setIsAdding(false);
      setNewEquipment({
        name: '',
        status: 'Online',
        health: 100,
        last_service: new Date().toISOString().split('T')[0],
        temperature: '22°C'
      });
    } catch (error) {
      console.error('Error adding equipment:', error);
    }
  };

  const handleMaintenance = async (id: string) => {
    try {
      const { error } = await supabase
        .from('equipment')
        .update({ 
          status: 'Maintenance', 
          health: 100,
          last_service: new Date().toISOString().split('T')[0]
        })
        .eq('id', id);
      
      if (error) throw error;

      // Record health history
      await supabase.from('equipment_history').insert([{
        equipment_id: id,
        health: 100,
        recorded_at: new Date().toISOString()
      }]);

      setTimeout(async () => {
        await supabase
          .from('equipment')
          .update({ status: 'Online' })
          .eq('id', id);
      }, 3000);
    } catch (error) {
      console.error('Maintenance error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to decommission this hardware node?')) return;
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting equipment:', error);
    }
  };

  const handleExportCSV = () => {
    const dataToExport = statusFilter === 'All' 
      ? equipmentList 
      : equipmentList.filter(e => e.status === statusFilter);
    
    if (dataToExport.length === 0) return;

    const headers = ['Name', 'Status', 'Health', 'Last Service', 'Temperature'];
    const rows = dataToExport.map(item => [
      item.name,
      item.status,
      `${item.health}%`,
      item.last_service,
      item.temperature
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `equipment_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const handleSaveEdit = async () => {
    if (!editForm || !isSupabaseConfigured) return;
    try {
      const { error } = await supabase
        .from('equipment')
        .update({
          name: editForm.name,
          status: editForm.status,
          health: editForm.health,
          last_service: editForm.last_service,
          temperature: editForm.temperature
        })
        .eq('id', editForm.id);
      
      if (error) throw error;

      // Also record history if health changed
      const original = equipmentList.find(e => e.id === editForm.id);
      if (original && original.health !== editForm.health) {
        await supabase.from('equipment_history').insert([{
          equipment_id: editForm.id,
          health: editForm.health,
          recorded_at: new Date().toISOString()
        }]);
      }

      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating equipment:', error);
    }
  };

  const filteredEquipment = equipmentList.filter(e => {
    const matchesSearch = e.name?.toLowerCase().includes((search || globalSearch).toLowerCase()) ||
                         e.id?.toString().toLowerCase().includes((search || globalSearch).toLowerCase());
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-serif font-normal text-on-surface tracking-tight">Equipment Inventory</h1>
          <p className="text-on-surface-dim text-[12px] uppercase tracking-widest mt-1">Hardware Monitoring & Maintenance Logs</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Activity className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-dim" />
            <input 
              type="text"
              placeholder="Search hardware..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-transparent border border-border rounded-full text-[11px] uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-on-surface-dim" />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border border-border px-4 py-2 rounded-full text-[11px] uppercase tracking-widest text-on-surface outline-none focus:border-primary transition-all"
            >
              <option value="All" className="bg-surface">All Status</option>
              <option value="Online" className="bg-surface">Online</option>
              <option value="Warning" className="bg-surface">Warning</option>
              <option value="Maintenance" className="bg-surface">Maintenance</option>
              <option value="Offline" className="bg-surface">Offline</option>
            </select>
          </div>
          <button 
            onClick={handleExportCSV}
            className="px-6 py-2 border border-border text-on-surface-dim rounded-full font-medium text-[11px] uppercase tracking-widest hover:text-on-surface transition-colors flex items-center gap-2"
          >
            <Download className="w-3 h-3" /> Export CSV
          </button>
          <button className="px-6 py-2 border border-border text-on-surface-dim rounded-full font-medium text-[11px] uppercase tracking-widest hover:text-on-surface transition-colors">
            Maintenance Logs
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-2 border border-primary text-primary rounded-full font-medium text-[11px] uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
          >
            Add Equipment
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
            <form onSubmit={handleAddEquipment} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Equipment Name</label>
                <input 
                  required
                  type="text" 
                  value={newEquipment.name}
                  onChange={e => setNewEquipment({...newEquipment, name: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Temperature</label>
                <input 
                  required
                  type="text" 
                  placeholder="e.g. 22°C"
                  value={newEquipment.temperature}
                  onChange={e => setNewEquipment({...newEquipment, temperature: e.target.value})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-on-surface-dim">Initial Health</label>
                <input 
                  required
                  type="number" 
                  min="0"
                  max="100"
                  value={newEquipment.health}
                  onChange={e => setNewEquipment({...newEquipment, health: parseInt(e.target.value)})}
                  className="w-full bg-transparent border-b border-border py-1 text-[13px] focus:outline-none focus:border-primary"
                />
              </div>
              <div className="md:col-span-3 flex justify-end">
                <button type="submit" className="px-12 py-2 bg-primary text-on-primary text-[11px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all">
                  Register Hardware Node
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Health Visualization Chart */}
      {equipmentList.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border border-border p-8 bg-surface-low"
        >
          <div className="flex items-center gap-3 mb-8">
            <BarChart2 className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-on-surface">Current Health Distribution</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={equipmentList} margin={{ top: 20, right: 30, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 10, fontWeight: 500 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#888', fontSize: 10 }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(var(--primary), 0.05)' }}
                  contentStyle={{ 
                    backgroundColor: '#111', 
                    border: '1px solid #333',
                    borderRadius: '0px',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="health" radius={[2, 2, 0, 0]}>
                  {equipmentList.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.health > 80 ? '#10b981' : entry.health > 50 ? '#f59e0b' : '#ef4444'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredEquipment.length > 0 ? filteredEquipment.map((item, i) => {
          const isEditing = editingId === item.id;
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => !isEditing && setSelectedNode(item)}
              className={`border p-8 flex flex-col justify-between group transition-all duration-300 ${isEditing ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 cursor-pointer'}`}
            >
              {isEditing ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="p-3 border border-primary text-primary">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <label className="text-[9px] uppercase tracking-widest text-on-surface-dim">Status</label>
                      <select 
                        value={editForm.status}
                        onChange={e => setEditForm({...editForm, status: e.target.value})}
                        className="bg-transparent border-b border-border text-[11px] font-bold uppercase tracking-widest text-on-surface outline-none focus:border-primary"
                      >
                        <option value="Online" className="bg-surface text-emerald-500">Online</option>
                        <option value="Warning" className="bg-surface text-amber-500">Warning</option>
                        <option value="Maintenance" className="bg-surface text-rose-500">Maintenance</option>
                        <option value="Offline" className="bg-surface text-on-surface-dim">Offline</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest text-on-surface-dim">Node Name</label>
                      <input 
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-transparent border-b border-border py-1 text-lg font-serif outline-none focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-on-surface-dim">Temperature</label>
                        <input 
                          type="text"
                          value={editForm.temperature}
                          onChange={e => setEditForm({...editForm, temperature: e.target.value})}
                          className="w-full bg-transparent border-b border-border py-1 text-[11px] outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase tracking-widest text-on-surface-dim">Last Service</label>
                        <input 
                          type="date"
                          value={editForm.last_service}
                          onChange={e => setEditForm({...editForm, last_service: e.target.value})}
                          className="w-full bg-transparent border-b border-border py-1 text-[11px] outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[9px] uppercase tracking-widest text-on-surface-dim">Health Status</label>
                        <input 
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.health}
                          onChange={e => setEditForm({...editForm, health: parseInt(e.target.value)})}
                          className="w-12 bg-transparent border-b border-border text-right text-[11px] font-bold outline-none focus:border-primary"
                        />
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        value={editForm.health}
                        onChange={e => setEditForm({...editForm, health: parseInt(e.target.value)})}
                        className="w-full h-1 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex items-center gap-3">
                    <button 
                      onClick={handleSaveEdit}
                      className="flex-1 py-2 bg-primary text-on-primary text-[10px] uppercase tracking-widest font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                    >
                      <Save className="w-3 h-3" /> Save Changes
                    </button>
                    <button 
                      onClick={() => {setEditingId(null); setEditForm(null);}}
                      className="px-4 py-2 border border-border text-on-surface-dim text-[10px] uppercase tracking-widest font-bold hover:text-on-surface transition-all flex items-center justify-center gap-2"
                    >
                      <Undo2 className="w-3 h-3" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 border border-border text-on-surface-dim group-hover:text-primary group-hover:border-primary transition-colors`}>
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          item.status === 'Online' ? 'text-emerald-500' :
                          item.status === 'Warning' ? 'text-amber-500' : 
                          item.status === 'Maintenance' ? 'text-rose-500' : 'text-on-surface-dim'
                        }`}>
                          {item.status}
                        </span>
                        {item.status === 'Online' ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-serif font-normal text-on-surface mb-2 group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-[11px] uppercase tracking-widest text-on-surface-dim mb-2">{item.id}</p>
                    <p className="text-[9px] uppercase tracking-widest text-on-surface-dim mb-8">Last Service: {item.last_service}</p>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] uppercase tracking-widest text-on-surface-dim">Health Status</span>
                        <span className="text-[11px] font-bold text-on-surface">{item.health}%</span>
                      </div>
                      <div className="w-full h-1 bg-border overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${item.health}%` }}
                          className={`h-full ${item.health > 80 ? 'bg-emerald-500' : item.health > 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-3 h-3 text-on-surface-dim" />
                        <span className="text-[11px] font-medium text-on-surface-dim uppercase tracking-widest">{item.temperature}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 text-on-surface-dim hover:text-primary transition-colors"
                        title="Edit Node"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleMaintenance(item.id)}
                        className="p-2 text-on-surface-dim hover:text-primary transition-colors"
                        title="Recalibrate Node"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-on-surface-dim hover:text-rose-500 transition-colors"
                        title="Decommission Node"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          );
        }) : (
          <div className="col-span-full py-24 text-center border border-dashed border-border">
            <p className="text-on-surface-dim text-[12px] uppercase tracking-widest">No hardware nodes found</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNode(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-2xl bg-surface border-l border-border z-[110] shadow-2xl overflow-y-auto"
            >
              <div className="p-8 border-b border-border flex items-center justify-between sticky top-0 bg-surface z-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 border border-primary text-primary">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-serif text-on-surface">{selectedNode.name}</h2>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-dim">Node ID: {selectedNode.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="p-2 text-on-surface-dim hover:text-on-surface transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-12">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="border border-border p-6">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Status</span>
                    <span className={`text-sm font-bold uppercase tracking-widest ${
                      selectedNode.status === 'Online' ? 'text-emerald-500' :
                      selectedNode.status === 'Warning' ? 'text-amber-500' : 'text-rose-500'
                    }`}>{selectedNode.status}</span>
                  </div>
                  <div className="border border-border p-6">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Health</span>
                    <span className="text-sm font-bold text-on-surface">{selectedNode.health}%</span>
                  </div>
                  <div className="border border-border p-6">
                    <span className="text-[10px] uppercase tracking-widest text-on-surface-dim block mb-2">Temp</span>
                    <span className="text-sm font-bold text-on-surface">{selectedNode.temperature}</span>
                  </div>
                </div>

                {/* Historical Trend */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Historical Health Trend</h3>
                  </div>
                  <div className="h-[300px] w-full border border-border p-6 bg-surface-low">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis 
                          dataKey="recorded_at" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#888', fontSize: 10 }}
                          tickFormatter={(val) => new Date(val).toLocaleDateString()}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#888', fontSize: 10 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#111', 
                            border: '1px solid #333',
                            borderRadius: '0px',
                            fontSize: '11px',
                            textTransform: 'uppercase'
                          }}
                          itemStyle={{ color: '#fff' }}
                          labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="health" 
                          stroke="var(--primary)" 
                          strokeWidth={2}
                          dot={{ fill: 'var(--primary)', r: 4 }}
                          activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Maintenance Logs */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Zap className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold uppercase tracking-widest text-on-surface">Maintenance Logs</h3>
                  </div>
                  <div className="space-y-4">
                    {historyData.slice().reverse().map((log, idx) => (
                      <div key={idx} className="p-4 border border-border flex items-center justify-between group hover:border-primary/40 transition-all">
                        <div className="flex items-center gap-4">
                          <div className={`w-1.5 h-1.5 rounded-full ${log.health > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <div>
                            <p className="text-[12px] text-on-surface">Health Check: {log.health}%</p>
                            <p className="text-[10px] text-on-surface-dim uppercase tracking-widest">{new Date(log.recorded_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-dim opacity-0 group-hover:opacity-100 transition-opacity">Verified</span>
                      </div>
                    ))}
                    {historyData.length === 0 && (
                      <div className="py-8 text-center border border-dashed border-border">
                        <p className="text-[11px] uppercase tracking-widest text-on-surface-dim">No historical logs found</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
