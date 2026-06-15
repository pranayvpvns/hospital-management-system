import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalAPI, extractData } from '../services/api';
import {
  ArrowLeft, Stethoscope, Clock, MapPin, CalendarDays, ChevronRight,
  Heart, Brain, Bone, Baby, Activity, Award, Shield, CheckCircle2
} from 'lucide-react';

const DEPT_COLORS = {
  'Cardiology':       { gradient: 'from-rose-500 to-red-600',       bg: 'bg-rose-50',    text: 'text-rose-600',    badge: 'bg-rose-100 text-rose-700' },
  'Orthopedics':      { gradient: 'from-amber-500 to-orange-600',   bg: 'bg-amber-50',   text: 'text-amber-600',   badge: 'bg-amber-100 text-amber-700' },
  'Neurology':        { gradient: 'from-purple-500 to-violet-600',  bg: 'bg-purple-50',  text: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700' },
  'Pediatrics':       { gradient: 'from-sky-500 to-cyan-600',       bg: 'bg-sky-50',     text: 'text-sky-600',     badge: 'bg-sky-100 text-sky-700' },
  'General Medicine': { gradient: 'from-emerald-500 to-teal-600',   bg: 'bg-emerald-50', text: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
  'Dermatology':      { gradient: 'from-pink-500 to-fuchsia-600',   bg: 'bg-pink-50',    text: 'text-pink-600',    badge: 'bg-pink-100 text-pink-700' },
};
const DEFAULT_COLORS = { gradient: 'from-primary-500 to-primary-700', bg: 'bg-primary-50', text: 'text-primary-600', badge: 'bg-primary-100 text-primary-700' };

const DEPT_ICONS = {
  'Cardiology': Heart, 'Neurology': Brain, 'Orthopedics': Bone, 'Pediatrics': Baby,
  'General Medicine': Stethoscope, 'Dermatology': Activity,
};

const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await hospitalAPI.getStaff();
        const allStaff = extractData(res, 'staff') || [];
        const found = allStaff.find(s => s.id === parseInt(id) && s.role === 'doctor');
        setDoctor(found || null);
      } catch (err) {
        console.error('Failed to load doctor:', err);
      }
      setLoading(false);
    };
    fetchDoctor();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="animate-fade-in max-w-4xl mx-auto text-center py-20">
        <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctor Not Found</h2>
        <p className="text-gray-500 mb-6">The doctor profile you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/dashboard')} className="px-6 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const colors = DEPT_COLORS[doctor.department] || DEFAULT_COLORS;
  const DeptIcon = DEPT_ICONS[doctor.department] || Stethoscope;

  const handleBookAppointment = () => {
    navigate(`/appointments?department=${encodeURIComponent(doctor.department)}&doctor=${doctor.id}`);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Doctor Hero Card */}
      <div className={`relative bg-gradient-to-r ${colors.gradient} rounded-3xl overflow-hidden shadow-xl mb-8`}>
        <div className="absolute inset-0 bg-black/10"></div>
        {/* Decorative elements */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full"></div>
        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full"></div>

        <div className="relative z-10 p-8 sm:p-12 flex flex-col sm:flex-row items-center gap-8">
          {/* Avatar */}
          <div className="w-28 h-28 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center text-white text-5xl font-bold shadow-lg border-2 border-white/20 flex-shrink-0">
            {doctor.name?.charAt(0) || 'D'}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              Dr. {doctor.name}
            </h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-4">
              <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white flex items-center gap-1.5">
                <DeptIcon className="w-4 h-4" />
                {doctor.department}
              </span>
              <span className="text-sm font-medium bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white">
                {doctor.specialization || doctor.department}
              </span>
            </div>
            <p className="text-white/80 text-base max-w-lg">
              Experienced specialist in {doctor.department} providing expert medical care with focus on {doctor.specialization || doctor.department} patient outcomes.
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Info Card */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Shield className={`w-5 h-5 ${colors.text}`} />
            Doctor Information
          </h3>

          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <Stethoscope className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Specialization</p>
                <p className="text-sm font-semibold text-gray-900">{doctor.specialization || doctor.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <MapPin className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Department</p>
                <p className="text-sm font-semibold text-gray-900">{doctor.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center`}>
                <Clock className={`w-5 h-5 ${colors.text}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Shift</p>
                <p className="text-sm font-semibold text-gray-900">{doctor.shift || 'Day'} Shift</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${doctor.status === 'active' ? 'bg-emerald-50' : 'bg-gray-100'}`}>
                <CheckCircle2 className={`w-5 h-5 ${doctor.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Availability</p>
                <p className={`text-sm font-semibold ${doctor.status === 'active' ? 'text-emerald-600' : 'text-gray-500'}`}>
                  {doctor.status === 'active' ? 'Currently Available' : 'Not Available'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Quick Actions */}
        <div className="space-y-6">
          {/* Book Appointment CTA */}
          <div className={`${colors.bg} rounded-2xl p-6 border border-gray-100`}>
            <DeptIcon className={`w-10 h-10 ${colors.text} mb-4`} />
            <h4 className="font-bold text-gray-900 mb-2">Book an Appointment</h4>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Schedule a consultation with Dr. {doctor.name} in the {doctor.department} department.
            </p>
            <button
              onClick={handleBookAppointment}
              className={`w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${colors.gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-md`}
            >
              <CalendarDays className="w-4 h-4" />
              Book Appointment
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Department Info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Award className={`w-4 h-4 ${colors.text}`} />
              About {doctor.department}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Our {doctor.department} department is equipped with modern technology and experienced professionals committed to excellence in patient care.
            </p>
            <button
              onClick={() => navigate(`/department/${encodeURIComponent(doctor.department)}`)}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 cursor-pointer"
            >
              View Department
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile;
