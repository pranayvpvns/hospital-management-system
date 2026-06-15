import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { hospitalAPI, extractData } from '../services/api';
import { AlertTriangle, Package, TrendingDown, Plus, Search, X, Pencil } from 'lucide-react';

const MedicalStore = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMedicine, setNewMedicine] = useState({
    name: '', category: '', manufacturer: '', stock: '', unit_price: '', batch_number: '', expiry_date: '', reorder_level: '', supplier: ''
  });
  const [editMedicine, setEditMedicine] = useState({
    id: null, name: '', category: '', manufacturer: '', stock: '', unit_price: '', batch_number: '', expiry_date: '', reorder_level: '', supplier: ''
  });

  const fetchData = async () => {
    try {
      const res = await hospitalAPI.getMedicines();
      setMedicines(extractData(res, 'medicines') || []);
    } catch (err) { 
      console.error(err); 
      setMedicines([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await hospitalAPI.addMedicine(newMedicine);
      setShowAddModal(false);
      setNewMedicine({ name: '', category: '', manufacturer: '', stock: '', unit_price: '', batch_number: '', expiry_date: '', reorder_level: '', supplier: '' });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const openEditModal = (med) => {
    setEditMedicine({
      id: med.id,
      name: med.name || '',
      category: med.category || '',
      manufacturer: med.manufacturer || '',
      stock: med.stock ?? '',
      unit_price: med.unit_price ?? '',
      batch_number: med.batch_number || '',
      expiry_date: med.expiry_date ? med.expiry_date.substring(0, 10) : '',
      reorder_level: med.reorder_level ?? '',
      supplier: med.supplier || ''
    });
    setShowEditModal(true);
  };

  const handleEditMedicine = async (e) => {
    e.preventDefault();
    try {
      const { id, ...data } = editMedicine;
      await hospitalAPI.updateMedicine(id, data);
      setShowEditModal(false);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const updateStock = async (id, currentStock, delta) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await hospitalAPI.updateMedicine(id, { stock: newStock });
      setMedicines(medicines.map(m => m.id === id ? { ...m, stock: newStock, is_low_stock: newStock <= m.reorder_level } : m));
    } catch (err) { console.error(err); }
  };


  const filteredMedicines = medicines.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const lowStock = medicines.filter(m => m.is_low_stock);
  const expired = medicines.filter(m => m.is_expired);

  // Reusable form fields renderer for Add/Edit modals
  const renderMedicineForm = (formData, setFormData, onSubmit, submitLabel) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Medicine Name</label>
          <input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="Enter name" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Category</label>
          <input type="text" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="E.g. Antibiotics" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Stock</label>
            <input required type="number" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="0" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Unit Price (₹)</label>
            <input required type="number" value={formData.unit_price} onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="0.00" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Reorder Level</label>
          <input type="number" value={formData.reorder_level} onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="10" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Manufacturer</label>
          <input type="text" value={formData.manufacturer} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="Enter manufacturer" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Supplier</label>
          <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="Enter supplier" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Expiry Date</label>
          <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Batch Number</label>
          <input type="text" value={formData.batch_number} onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="E.g. BAT-001" />
        </div>
      </div>

      <div className="md:col-span-2 flex justify-end gap-3 mt-4">
        <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); }} className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">Cancel</button>
        <button type="submit" className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className="animate-fade-in pb-10">
      <TopBar title="Medical Store" subtitle="Medicine inventory and stock management" />

      {/* Summary Group & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{medicines.length}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Total</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{lowStock.length}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Low Stock</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-rose-600">{expired.length}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Expired</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search medicines..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20"
          >
            <Plus className="w-4 h-4" /> Add New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-slide-up">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock Management (±50)</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredMedicines.map((med) => (
                  <tr key={med.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm text-gray-900">{med.name}</p>
                      <p className="text-xs text-gray-400">{med.manufacturer}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.category}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-100">
                          <button 
                            onClick={() => updateStock(med.id, med.stock, -50)}
                            className="w-10 h-7 flex items-center justify-center hover:bg-white rounded-md text-gray-500 hover:text-rose-600 transition-all font-semibold text-xs"
                          >
                            -50
                          </button>
                          <span className="w-12 text-center text-sm font-bold text-gray-900">{med.stock}</span>
                          <button 
                            onClick={() => updateStock(med.id, med.stock, 50)}
                            className="w-10 h-7 flex items-center justify-center hover:bg-white rounded-md text-gray-500 hover:text-emerald-600 transition-all font-semibold text-xs"
                          >
                            +50
                          </button>
                        </div>
                        <div className="flex-1 min-w-[60px]">
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${med.is_low_stock ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((med.stock / (med.reorder_level * 10)) * 100, 100)}%` }}></div>
                        </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{med.unit_price}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'N/A'}</td>
                    <td className="px-6 py-4">
                      {med.is_expired ? <span className="badge-danger">Expired</span> :
                       med.is_low_stock ? <span className="badge-warning">Low Stock</span> :
                       <span className="badge-success">In Stock</span>}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEditModal(med)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-all cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Add New Medicine</h2>
            <p className="text-gray-500 text-sm mb-8">Fill in the details to add medicine to your inventory.</p>
            {renderMedicineForm(newMedicine, setNewMedicine, handleAddMedicine, 'Add Medicine')}
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Medicine</h2>
            <p className="text-gray-500 text-sm mb-8">Update the details for <strong>{editMedicine.name}</strong>.</p>
            {renderMedicineForm(editMedicine, setEditMedicine, handleEditMedicine, 'Save Changes')}
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicalStore;
