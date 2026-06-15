import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalAPI, extractData } from '../services/api';
import {
  ArrowLeft, Stethoscope, Clock, Award, MapPin,
  Heart, Brain, Bone, Baby, Activity, CalendarDays, ChevronRight
} from 'lucide-react';

// Department metadata with descriptions, images, and icons
const DEPARTMENT_INFO = {
  'Cardiology': {
    description: 'Our Cardiology department is equipped with state-of-the-art cardiac care technology, providing comprehensive diagnosis and treatment for all heart-related conditions. From preventive cardiology to complex interventional procedures, our team ensures the highest standard of cardiac care.',
    highlights: ['24/7 Cardiac Emergency Care', 'Advanced Echocardiography', 'Cardiac Catheterization Lab', 'Pacemaker & Defibrillator Implantation', 'Heart Failure Management Program'],
    icon: Heart,
    color: 'rose',
    gradient: 'from-rose-500 to-red-600',
    images: ['/images/departments/cardiology.png'],
  },
  'Orthopedics': {
    description: 'The Orthopedics department specializes in the diagnosis, treatment, and prevention of musculoskeletal disorders. Our surgeons perform joint replacements, arthroscopic surgeries, and fracture management using minimally invasive techniques.',
    highlights: ['Joint Replacement Surgery', 'Sports Medicine & Rehabilitation', 'Spine Surgery', 'Fracture & Trauma Care', 'Arthroscopy & Minimally Invasive Surgery'],
    icon: Bone,
    color: 'amber',
    gradient: 'from-amber-500 to-orange-600',
    images: ['/images/departments/orthopedics.png'],
  },
  'Neurology': {
    description: 'Our Neurology department offers advanced neurological care for disorders of the brain, spinal cord, nerves, and muscles. With cutting-edge imaging and diagnostic tools, we provide precise treatment plans for complex neurological conditions.',
    highlights: ['EEG & EMG Diagnostics', 'Stroke Management Unit', 'Epilepsy Monitoring', 'Movement Disorder Clinic', 'Neuro-Rehabilitation Program'],
    icon: Brain,
    color: 'purple',
    gradient: 'from-purple-500 to-violet-600',
    images: ['/images/departments/neurology.png'],
  },
  'Pediatrics': {
    description: 'The Pediatrics department provides compassionate and comprehensive healthcare for infants, children, and adolescents. Our child-friendly environment and experienced pediatricians ensure your child receives the best possible care.',
    highlights: ['Well-Child Checkups', 'Vaccination Programs', 'Pediatric Emergency Care', 'Neonatal Intensive Care Unit (NICU)', 'Growth & Development Monitoring'],
    icon: Baby,
    color: 'sky',
    gradient: 'from-sky-500 to-cyan-600',
    images: ['/images/departments/pediatrics.png'],
  },
  'General Medicine': {
    description: 'Our General Medicine department serves as the first point of contact for patients seeking medical care. Our physicians are skilled in diagnosing and managing a wide range of medical conditions, providing holistic and preventive healthcare.',
    highlights: ['Comprehensive Health Check-ups', 'Chronic Disease Management', 'Preventive Medicine', 'Infectious Disease Treatment', 'Geriatric Care'],
    icon: Stethoscope,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-600',
    images: ['/images/departments/general_medicine.png'],
  },
  'Dermatology': {
    description: 'The Dermatology department offers expert diagnosis and treatment for all skin, hair, and nail conditions. From cosmetic procedures to managing complex dermatological diseases, our specialists deliver personalized care.',
    highlights: ['Skin Allergy Testing', 'Laser Treatments', 'Cosmetic Dermatology', 'Psoriasis & Eczema Management', 'Skin Cancer Screening'],
    icon: Activity,
    color: 'pink',
    gradient: 'from-pink-500 to-fuchsia-600',
    images: ['/images/departments/dermatology.png'],
  },
};

// Fallback for departments not in the mapping
const DEFAULT_INFO = {
  description: 'This department provides specialized medical care with experienced professionals and modern equipment. Our team is committed to delivering the highest quality treatment and patient-centered care.',
  highlights: ['Expert Medical Team', 'Modern Equipment', 'Patient-Centered Care', 'Advanced Diagnostics', '24/7 Support'],
  icon: Stethoscope,
  color: 'primary',
  gradient: 'from-primary-500 to-primary-700',
  images: [],
};

const COLOR_MAP = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', ring: 'ring-amber-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-200' },
  sky: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-700', ring: 'ring-sky-200' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-700', ring: 'ring-pink-200' },
  primary: { bg: 'bg-primary-50', text: 'text-primary-600', border: 'border-primary-200', badge: 'bg-primary-100 text-primary-700', ring: 'ring-primary-200' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-violet-500 to-purple-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
];

const DepartmentDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const departmentName = decodeURIComponent(name);
  const info = DEPARTMENT_INFO[departmentName] || DEFAULT_INFO;
  const colors = COLOR_MAP[info.color] || COLOR_MAP.primary;
  const Icon = info.icon;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const res = await hospitalAPI.getDoctors(departmentName);
        const docList = extractData(res, 'doctors') || [];
        setDoctors(docList);
      } catch (err) {
        console.error('Failed to load doctors:', err);
      }
      setLoading(false);
    };
    fetchDoctors();
  }, [departmentName]);

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 font-medium mb-6 transition-colors group cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Dashboard
      </button>

      {/* Hero Banner */}
      <div className={`relative bg-gradient-to-r ${info.gradient} rounded-3xl overflow-hidden shadow-xl mb-8`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-center">
          {/* Left – Info */}
          <div className="flex-1 p-8 sm:p-12 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-semibold bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                Department
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">{departmentName}</h1>
            <p className="text-white/85 text-base sm:text-lg leading-relaxed max-w-xl">
              {info.description}
            </p>
            <button
              onClick={() => navigate(`/appointments?department=${encodeURIComponent(departmentName)}`)}
              className="mt-6 px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <CalendarDays className="w-4 h-4" />
              Book Appointment
            </button>
          </div>

          {/* Right – Image */}
          {info.images.length > 0 && (
            <div className="lg:w-2/5 p-4 lg:p-8">
              <img
                src={info.images[0]}
                alt={`${departmentName} department`}
                className="w-full h-56 sm:h-72 object-cover rounded-2xl shadow-lg border-2 border-white/20"
              />
            </div>
          )}
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Key Services */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100`}>
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Award className={`w-5 h-5 ${colors.text}`} />
            Key Services
          </h3>
          <div className="space-y-3">
            {info.highlights.map((item, idx) => (
              <div key={idx} className={`flex items-start gap-3 p-3 ${colors.bg} rounded-xl`}>
                <div className={`w-6 h-6 rounded-full ${colors.badge} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <span className="text-xs font-bold">{idx + 1}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Department Gallery */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <MapPin className={`w-5 h-5 ${colors.text}`} />
            Department Facility
          </h3>
          {info.images.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <img
                src={info.images[0]}
                alt={`${departmentName} facility`}
                className="w-full h-48 object-cover rounded-xl shadow-sm"
              />
              <div className={`${colors.bg} rounded-xl p-6 flex flex-col justify-center`}>
                <Icon className={`w-10 h-10 ${colors.text} mb-4`} />
                <h4 className="font-bold text-gray-900 mb-2">State-of-the-Art Facility</h4>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Our {departmentName} department is equipped with the latest medical technology and is staffed by highly trained professionals to ensure the best patient outcomes.
                </p>
              </div>
            </div>
          ) : (
            <div className={`${colors.bg} rounded-xl p-8 text-center`}>
              <Icon className={`w-16 h-16 ${colors.text} mx-auto mb-4`} />
              <p className="text-gray-600">Modern facilities with advanced medical equipment</p>
            </div>
          )}
        </div>
      </div>

      {/* Doctors Section */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className={`w-5 h-5 ${colors.text}`} />
            Our Specialists
          </h3>
          <span className={`text-sm font-medium px-3 py-1 rounded-full ${colors.badge}`}>
            {doctors.length} Doctor{doctors.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No doctors found in this department</p>
            <p className="text-sm mt-1">Please check back later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {doctors.map((doc, idx) => (
              <div
                key={doc.id}
                className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {/* Doctor Avatar & Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 bg-gradient-to-br ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {doc.name?.charAt(0) || 'D'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">Dr. {doc.name}</h4>
                    <p className={`text-xs font-medium ${colors.text}`}>{doc.specialization || departmentName}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2.5 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{doc.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>Shift: {doc.shift || 'Day'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Activity className="w-4 h-4 flex-shrink-0" />
                    <span className={`font-medium ${doc.status === 'active' ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {doc.status === 'active' ? '● Available' : '○ Unavailable'}
                    </span>
                  </div>
                </div>

                {/* Action */}
                <button
                  onClick={() => navigate(`/appointments?department=${encodeURIComponent(departmentName)}&doctor=${doc.id}`)}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${info.gradient} hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer`}
                >
                  Book Appointment
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DepartmentDetail;
