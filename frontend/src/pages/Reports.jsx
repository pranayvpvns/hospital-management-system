import React, { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { reportAPI, patientAPI, extractData } from '../services/api';
import { FileText, Calendar, Plus, UserRound, Search, X, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'doctor';
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Admin/Doctor Add/Edit Report Modal
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editReportId, setEditReportId] = useState(null);
  const [formData, setFormData] = useState({ patient_id: '', doctor_name: '', diagnosis: '', suggestions: '' });

  const fetchReports = useCallback(async () => {
    try {
      const res = await reportAPI.getAll();
      setReports(extractData(res, 'reports') || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const res = await patientAPI.getAll();
      setPatients(extractData(res, 'patients') || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchReports();
    if (isAdmin) {
      fetchPatients();
    }
  }, [isAdmin, fetchReports, fetchPatients]);

  const handleSaveReport = async (e) => {
    e.preventDefault();
    if (!formData.patient_id) {
      alert('Please select a patient');
      return;
    }
    try {
      if (isEditMode) {
        await reportAPI.update(editReportId, { ...formData, patient_id: parseInt(formData.patient_id) });
      } else {
        await reportAPI.create({ ...formData, patient_id: parseInt(formData.patient_id) });
      }
      setShowModal(false);
      setIsEditMode(false);
      setEditReportId(null);
      setFormData({ patient_id: '', doctor_name: '', diagnosis: '', suggestions: '' });
      fetchReports();
    } catch (err) {
      console.error('Failed to save report', err);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditReportId(null);
    setFormData({ patient_id: '', doctor_name: '', diagnosis: '', suggestions: '' });
    setShowModal(true);
  };

  const openEditModal = (report) => {
    setIsEditMode(true);
    setEditReportId(report.id);
    setFormData({
      patient_id: report.patient_id || '',
      doctor_name: report.doctor_name || '',
      diagnosis: report.diagnosis || '',
      suggestions: report.suggestions || ''
    });
    setShowModal(true);
  };

  const filteredReports = reports.filter(r => 
    r.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <TopBar title={isAdmin ? "Patient Reports" : "My Reports & Prescriptions"} subtitle={isAdmin ? "Create and manage patient visit reports" : "View your visit summaries, diagnosis, and doctor suggestions"} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4 mb-6 mt-6">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by diagnosis or doctor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
        
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition flex items-center gap-2 w-full md:w-auto cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Add Report
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm mt-6">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500">
            {isAdmin ? 'No reports have been created yet. Click "Add Report" to create one.' : 'Your medical reports and visit summaries will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {filteredReports.map(report => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow flex flex-col relative group">
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg mb-1">{report.diagnosis}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserRound className="w-4 h-4" />
                    Dr. {report.doctor_name}
                  </div>
                  {isAdmin && report.patient_name && (
                    <div className="text-xs text-gray-400 mt-1">Patient: {report.patient_name}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.visit_date}
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => openEditModal(report)}
                      className="p-1.5 text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-1 text-xs font-medium"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Doctor's Suggestions</h4>
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{report.suggestions}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                {isEditMode ? 'Edit Patient Report' : 'Add Patient Report'}
              </h2>
              <button 
                onClick={() => { setShowModal(false); setIsEditMode(false); setEditReportId(null); }} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveReport} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Select Patient *</label>
                <select
                  required
                  value={formData.patient_id}
                  onChange={e => setFormData({...formData, patient_id: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all bg-white"
                >
                  <option value="">-- Choose a patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.name || 'Unnamed'} (ID: {p.id})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Doctor Name *</label>
                <input required type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                  value={formData.doctor_name} onChange={e => setFormData({...formData, doctor_name: e.target.value})}
                  placeholder="Dr. John Smith" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Diagnosis *</label>
                <input required type="text"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all"
                  value={formData.diagnosis} onChange={e => setFormData({...formData, diagnosis: e.target.value})}
                  placeholder="e.g. Mild Fever, Fracture" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase ml-1 mb-1.5 block">Suggestions / Prescription *</label>
                <textarea required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none transition-all h-28 resize-none"
                  value={formData.suggestions} onChange={e => setFormData({...formData, suggestions: e.target.value})}
                  placeholder="e.g. Take rest, Paracetamol 500mg twice daily for 3 days" />
              </div>
              
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" 
                  onClick={() => { setShowModal(false); setIsEditMode(false); setEditReportId(null); }}
                  className="px-6 py-2.5 text-gray-600 font-semibold hover:bg-gray-50 rounded-xl transition-colors border border-gray-200 cursor-pointer">Cancel</button>
                <button type="submit"
                  className="px-6 py-2.5 bg-primary-600 text-white font-semibold hover:bg-primary-700 rounded-xl transition-colors shadow-md shadow-primary-500/20 cursor-pointer">
                  {isEditMode ? 'Save Changes' : 'Save Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
