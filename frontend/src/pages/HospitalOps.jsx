import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import TopBar from '../components/TopBar';
import { hospitalAPI, extractData } from '../services/api';
import { Users, BedDouble, Wrench, UserPlus } from 'lucide-react';

const HospitalOps = () => {
  const [staff, setStaff] = useState([]);
  const [beds, setBeds] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [activeTab, setActiveTab] = useState('staff');
  const [loading, setLoading] = useState(true);

  const [showStaffForm, setShowStaffForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: '', role: 'doctor', department: '', specialization: '', shift: 'Morning', phone: '' });

  const fetchData = async () => {
    try {
      const [staffRes, bedsRes, equipRes] = await Promise.all([
        hospitalAPI.getStaff(), hospitalAPI.getBeds(), hospitalAPI.getEquipment()
      ]);
      setStaff(extractData(staffRes, 'staff') || []);
      setBeds(extractData(bedsRes, 'beds') || []);
      setEquipment(extractData(equipRes, 'equipment') || []);
    } catch (err) { 
      console.error(err); 
      setStaff([]);
      setBeds([]);
      setEquipment([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStaffStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await hospitalAPI.updateStaff(id, { status: newStatus });
      setStaff(staff.map(s => s.id === id ? { ...s, status: newStatus } : s));
    } catch (err) { console.error(err); }
  };

  const handleStaffFormSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await hospitalAPI.updateStaff(editingStaff.id, staffForm);
        toast.success("Staff updated successfully");
      } else {
        await hospitalAPI.addStaff(staffForm);
        toast.success("Staff added successfully");
      }
      setShowStaffForm(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save staff");
    }
  };

  const updateStaffDate = async (id, date) => {
    try {
      await hospitalAPI.updateStaff(id, { unavailable_date: date });
      setStaff(staff.map(s => s.id === id ? { ...s, unavailable_date: date } : s));
    } catch (err) { console.error(err); }
  };

  const toggleBedStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      await hospitalAPI.updateBed(id, { status: newStatus });
      setBeds(beds.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) { console.error(err); }
  };

  const toggleEquipmentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'operational' ? 'maintenance' : 'operational';
    try {
      await hospitalAPI.updateEquipment(id, { status: newStatus });
      setEquipment(equipment.map(e => e.id === id ? { ...e, status: newStatus } : e));
    } catch (err) { console.error(err); }
  };

  const tabs = [
    { id: 'staff', label: 'Staff', icon: Users, count: staff.length },
    { id: 'beds', label: 'Beds', icon: BedDouble, count: beds.length },
    { id: 'equipment', label: 'Equipment', icon: Wrench, count: equipment.length },
  ];

  const statusBadge = (status) => {
    const map = {
      active: 'badge-success', operational: 'badge-success', available: 'badge-success',
      leave: 'badge-warning', maintenance: 'badge-warning',
      inactive: 'badge-danger', occupied: 'badge-danger', retired: 'badge-danger',
      unavailable: 'badge-danger',
    };
    return map[status] || 'badge-info';
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Hospital Operations" subtitle="Staff, beds, and equipment management" />

      {/* Tabs */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'}`}>{tab.count}</span>
            </button>
          ))}
        </div>
        {activeTab === 'staff' && (
          <button 
            onClick={() => { setEditingStaff(null); setStaffForm({ name: '', role: 'doctor', department: '', specialization: '', shift: 'Morning', phone: '' }); setShowStaffForm(true); }} 
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Add Staff
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Staff Table */}
          {activeTab === 'staff' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Shift</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Unav. Date</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {staff.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-semibold text-sm">
                              {s.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{s.name}</p>
                              {s.specialization && <p className="text-xs text-gray-400">{s.specialization}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.role}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.department}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 capitalize">{s.shift}</td>
                        <td className="px-6 py-4"><span className={statusBadge(s.status)}>{s.status}</span></td>
                        <td className="px-6 py-4">
                          {s.role === 'doctor' ? (
                            <input 
                                type="date" 
                                className="text-sm border border-gray-200 rounded p-1 outline-none text-gray-600 bg-gray-50 w-32" 
                                value={s.unavailable_date || ''} 
                                onChange={(e) => updateStaffDate(s.id, e.target.value)} 
                            />
                          ) : <span className="text-gray-400 text-xs">-</span>}
                        </td>
                        <td className="px-6 py-4 flex gap-3 items-center">
                          <button 
                            onClick={() => { setEditingStaff(s); setStaffForm({ name: s.name, role: s.role, department: s.department, specialization: s.specialization || '', shift: s.shift || '', phone: s.phone || '' }); setShowStaffForm(true); }}
                            className="text-primary-600 hover:text-primary-800 text-sm font-semibold transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => toggleStaffStatus(s.id, s.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-200'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                s.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Beds Grid */}
          {activeTab === 'beds' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 animate-slide-up">
              {beds.map((b) => (
                <div key={b.id} 
                  onClick={() => toggleBedStatus(b.id, b.status)}
                  className={`p-4 rounded-xl border-2 text-center transition-all hover:shadow-md cursor-pointer active:scale-95 group relative ${
                  b.status === 'available' ? 'border-emerald-200 bg-emerald-50' :
                  b.status === 'occupied' ? 'border-rose-200 bg-rose-50' :
                  b.status === 'unavailable' ? 'border-gray-200 bg-gray-50 opacity-60' :
                  'border-amber-200 bg-amber-50'}`}>
                  <div className="absolute top-2 right-2">
                    <div className={`h-2 w-2 rounded-full ${b.status === 'available' ? 'bg-emerald-500' : b.status === 'occupied' ? 'bg-rose-500' : 'bg-gray-400'}`}></div>
                  </div>
                  <BedDouble className={`w-6 h-6 mx-auto mb-2 transition-transform group-hover:scale-110 ${
                    b.status === 'available' ? 'text-emerald-500' : 
                    b.status === 'occupied' ? 'text-rose-500' : 
                    b.status === 'unavailable' ? 'text-gray-400' :
                    'text-amber-500'}`} />
                  <p className="font-bold text-sm text-gray-900">{b.bed_number}</p>
                  <p className="text-xs text-gray-500">{b.ward}</p>
                  <div className="mt-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{b.status}</div>
                </div>
              ))}
            </div>
          )}

          {/* Equipment Table */}
          {activeTab === 'equipment' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Next Maintenance</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {equipment.map((e) => (
                      <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-sm text-gray-900">{e.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{e.category}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{e.department}</td>
                        <td className="px-6 py-4"><span className={statusBadge(e.status)}>{e.status}</span></td>
                        <td className="px-6 py-4 text-sm text-gray-600">{e.next_maintenance ? new Date(e.next_maintenance).toLocaleDateString() : 'N/A'}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleEquipmentStatus(e.id, e.status)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              e.status === 'operational' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                e.status === 'operational' ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Staff Form Modal */}
      {showStaffForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editingStaff ? 'Edit Staff' : 'Add New Staff'}</h2>
            <form onSubmit={handleStaffFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="technician">Technician</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                  <select value={staffForm.shift} onChange={e => setStaffForm({...staffForm, shift: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="Morning">Morning</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input type="text" value={staffForm.department} onChange={e => setStaffForm({...staffForm, department: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input type="text" value={staffForm.specialization} onChange={e => setStaffForm({...staffForm, specialization: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Cardiologist" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowStaffForm(false)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-sm cursor-pointer">{editingStaff ? 'Save Changes' : 'Add Staff'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalOps;
