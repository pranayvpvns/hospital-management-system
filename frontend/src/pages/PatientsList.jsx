import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { patientAPI, extractData } from '../services/api';
import { Users, UserPlus, Search, X, Pencil } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const emptyForm = {
  name: '', email: '', password: '', age: '', gender: '', blood_group: '',
  dob: '', bmi: '', allergies: '', emergency_contact: ''
};

const PatientsList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ id: null, ...emptyForm });
  const [submitError, setSubmitError] = useState('');

  const fetchPatients = async () => {
    try {
      const res = await patientAPI.getAll();
      setPatients(extractData(res, 'patients') || []);
    } catch (err) {
      console.error(err);
      setPatients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // --- Register ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      await patientAPI.register(registerForm);
      setShowRegisterModal(false);
      setRegisterForm({ ...emptyForm });
      fetchPatients();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Registration failed');
    }
  };

  // --- Edit ---
  const openEditModal = (p) => {
    setEditForm({
      id: p.id,
      name: p.name || '',
      email: p.email || '',
      age: p.age ?? '',
      gender: p.gender || '',
      blood_group: p.blood_group || '',
      dob: p.dob || '',
      bmi: p.bmi ?? '',
      allergies: p.allergies || '',
      emergency_contact: p.emergency_contact || ''
    });
    setSubmitError('');
    setShowEditModal(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    try {
      const { id, email, ...data } = editForm;
      await patientAPI.update(id, data);
      setShowEditModal(false);
      fetchPatients();
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Update failed');
    }
  };

  const filteredPatients = patients.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Reusable form renderer ---
  const renderForm = (formData, setFormData, onSubmit, submitLabel, isRegister = false) => (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name *</label>
          <input required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="John Doe" />
        </div>
        {isRegister && (
          <>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email *</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="patient@email.com" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-1">Password *</label>
              <input required type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="Min 6 characters" />
            </div>
          </>
        )}
        {!isRegister && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email</label>
            <input disabled type="email" value={formData.email}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 outline-none" />
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Age</label>
            <input type="number" min="0" max="150" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="25" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Gender</label>
            <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white">
              <option value="">Select</option>
              {GENDERS.map(g => <option key={g} value={g.toLowerCase()}>{g}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Blood Group</label>
            <select value={formData.blood_group} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all bg-white">
              <option value="">Select</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-1">BMI</label>
            <input type="number" step="0.1" min="0" value={formData.bmi} onChange={(e) => setFormData({ ...formData, bmi: e.target.value })}
              className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="22.5" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Date of Birth</label>
          <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Allergies</label>
          <input type="text" value={formData.allergies} onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="e.g. Penicillin, Dust" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-1">Emergency Contact</label>
          <input type="text" value={formData.emergency_contact} onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
            className="w-full mt-1.5 px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all" placeholder="+91 9876543210" />
        </div>
      </div>

      {submitError && (
        <div className="md:col-span-2 text-sm text-rose-600 bg-rose-50 px-4 py-2 rounded-xl">{submitError}</div>
      )}

      <div className="md:col-span-2 flex justify-end gap-3 mt-2">
        <button type="button" onClick={() => { setShowRegisterModal(false); setShowEditModal(false); setSubmitError(''); }}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 border border-gray-200 transition-all">Cancel</button>
        <button type="submit"
          className="px-8 py-2.5 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-md shadow-primary-500/20 transition-all">{submitLabel}</button>
      </div>
    </form>
  );

  return (
    <div className="animate-fade-in">
      <TopBar title="Patients" subtitle="All registered patients" />

      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xl font-bold">{patients.length}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Total Patients</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{patients.filter(p => p.gender === 'male').length}</p>
              <p className="text-[10px] text-gray-400 uppercase font-semibold">Male</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>
          <button
            onClick={() => { setRegisterForm({ ...emptyForm }); setSubmitError(''); setShowRegisterModal(true); }}
            className="flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition-all shadow-md shadow-primary-500/20 whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" /> Register Patient
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center text-gray-500">
          {searchTerm ? 'No patients match your search.' : 'No patients registered yet.'}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Patient</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Age</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Gender</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Blood Group</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">BMI</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Emergency Contact</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.map((p, i) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 font-semibold text-sm">
                          {(p.name || 'P').charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{p.name || 'Patient'}</p>
                          <p className="text-xs text-gray-400">{p.email || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.age || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 capitalize">{p.gender || '-'}</td>
                    <td className="px-6 py-4"><span className="badge-info">{p.blood_group || '-'}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.bmi || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.emergency_contact || '-'}</td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openEditModal(p)}
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

      {/* Register Patient Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowRegisterModal(false); setSubmitError(''); }}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowRegisterModal(false); setSubmitError(''); }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Register New Patient</h2>
            <p className="text-gray-500 text-sm mb-8">Create a new patient account with login credentials and medical details.</p>
            {renderForm(registerForm, setRegisterForm, handleRegister, 'Register Patient', true)}
          </div>
        </div>
      )}

      {/* Edit Patient Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => { setShowEditModal(false); setSubmitError(''); }}></div>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl relative shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowEditModal(false); setSubmitError(''); }}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Edit Patient</h2>
            <p className="text-gray-500 text-sm mb-8">Update details for <strong>{editForm.name}</strong>.</p>
            {renderForm(editForm, setEditForm, handleEdit, 'Save Changes', false)}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientsList;
