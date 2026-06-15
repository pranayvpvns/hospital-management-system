import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { patientAPI, authAPI } from '../services/api';
import TopBar from '../components/TopBar';
import {
  User, Mail, Droplets, Calendar, Users2, Save,
  Edit3, X, CheckCircle2, Heart, Shield, Clock
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

const calculateAge = (dob) => {
  if (!dob) return null;
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const MyProfile = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    blood_group: '',
    dob: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await patientAPI.getProfile();
      const data = res.data?.data?.patient || res.data?.patient || null;
      setProfile(data);
      if (data) {
        setFormData({
          name: data.name || user?.name || '',
          gender: data.gender || '',
          blood_group: data.blood_group || '',
          dob: data.dob || '',
        });
      } else {
        // No profile yet — prefill from user
        setFormData({
          name: user?.name || '',
          gender: '',
          blood_group: '',
          dob: '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      // Profile doesn't exist yet, allow creation
      setFormData({
        name: user?.name || '',
        gender: '',
        blood_group: '',
        dob: '',
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const payload = {
        ...formData,
        age: calculateAge(formData.dob),
      };
      await patientAPI.updateProfile(payload);
      setSuccess(true);
      setEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert(err.response?.data?.message || 'Failed to save profile');
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || user?.name || '',
        gender: profile.gender || '',
        blood_group: profile.blood_group || '',
        dob: profile.dob || '',
      });
    }
  };



  const age = calculateAge(formData.dob);
  const isProfileIncomplete = !formData.gender || !formData.blood_group || !formData.dob;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <TopBar title="My Profile" subtitle="View and manage your personal information" />

      {/* Success Toast */}
      {success && (
        <div className="mb-6 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-3 rounded-xl animate-slide-up">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-sm font-medium">Profile updated successfully!</span>
        </div>
      )}

      {/* Incomplete Profile Banner */}
      {isProfileIncomplete && !editing && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-5 py-4 rounded-xl animate-slide-up">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium">Your profile is incomplete. Please fill in your details for better care.</span>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 px-4 py-1.5 rounded-lg cursor-pointer"
          >
            Complete Now
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Hero */}
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-hospital-purple p-8 text-center relative">
            <div className="absolute inset-0 bg-black/5"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white text-4xl font-bold mx-auto shadow-lg border-2 border-white/20">
                {formData.name?.charAt(0) || 'U'}
              </div>
              <h2 className="text-xl font-bold text-white mt-4">{formData.name || 'Your Name'}</h2>
              <p className="text-primary-200 text-sm mt-1">{user?.email}</p>
              <span className="inline-block mt-3 text-xs font-semibold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white capitalize">
                {user?.role} Account
              </span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Email</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Blood Group</p>
                <p className="text-sm font-semibold text-gray-900">{formData.blood_group || '—'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Age</p>
                <p className="text-sm font-semibold text-gray-900">{age !== null ? `${age} years` : '—'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Details Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="w-5 h-5 text-primary-600" />
              Personal Information
            </h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400" /> Full Name</span>
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{formData.name || '—'}</div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> Email</span>
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-500 font-medium">{user?.email || '—'}</div>
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><Users2 className="w-4 h-4 text-gray-400" /> Gender</span>
              </label>
              {editing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select gender</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">{formData.gender || '—'}</div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> Date of Birth</span>
              </label>
              {editing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">
                  {formData.dob || '—'}
                </div>
              )}
            </div>

            {/* Age (calculated) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Age</span>
              </label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">
                {age !== null ? (
                  <span className="flex items-center gap-2">
                    {age} years
                    <span className="text-[10px] text-gray-400 font-normal">(auto-calculated)</span>
                  </span>
                ) : '—'}
              </div>
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <span className="flex items-center gap-2"><Droplets className="w-4 h-4 text-gray-400" /> Blood Group</span>
              </label>
              {editing ? (
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select blood group</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              ) : (
                <div className="px-4 py-3 bg-gray-50 rounded-xl text-sm text-gray-900 font-medium">
                  {formData.blood_group ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center text-[10px] font-bold">
                        {formData.blood_group}
                      </span>
                      {formData.blood_group}
                    </span>
                  ) : '—'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone - Account Deletion */}
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-rose-100 p-8">
        <h3 className="text-lg font-bold text-rose-600 flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5" />
          Danger Zone
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-6 py-2.5 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
          >
            Delete Account
          </button>
        ) : (
          <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 animate-slide-up">
            <h4 className="text-sm font-bold text-rose-900 mb-2">Are you absolutely sure?</h4>
            <p className="text-xs text-rose-700 mb-4">
              This will permanently delete your user profile, personal data, and all related records from the database.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  setDeleting(true);
                  try {
                    await authAPI.deleteAccount();
                    localStorage.removeItem('mnh_token');
                    localStorage.removeItem('mnh_user');
                    window.location.href = '/login';
                  } catch (err) {
                    alert('Failed to delete account');
                    setDeleting(false);
                    setShowDeleteConfirm(false);
                  }
                }}
                disabled={deleting}
                className="px-6 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Yes, delete my account'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;
