import React, { useState, useEffect, useCallback } from 'react';
import TopBar from '../components/TopBar';
import { appointmentAPI, hospitalAPI, extractData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, UserRound, ArrowRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-toastify';

const Appointments = () => {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Booking Flow State
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [slots, setSlots] = useState([]);
  const [slotMessage, setSlotMessage] = useState('');
  
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [preselectedFromDept, setPreselectedFromDept] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'doctor';

  const fetchAppointments = useCallback(async () => {
    try {
      const res = isAdmin ? await appointmentAPI.getAll() : await appointmentAPI.getMine();
      setAppointments(extractData(res, 'appointments') || []);
    } catch (err) {
      console.error(err);
      setAppointments([]);
    }
    setLoading(false);
  }, [isAdmin]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await hospitalAPI.getDepartments();
      setDepartments(extractData(res, 'departments') || []);
    } catch (err) {
      console.error(err);
      setDepartments([]);
    }
  }, []);

  useEffect(() => {
    fetchAppointments();
    if (!isAdmin) {
      fetchDepartments();
    }
  }, [fetchAppointments, fetchDepartments, isAdmin]);

  const fetchDoctors = async (dept) => {
    try {
      const res = await hospitalAPI.getDoctors(dept);
      setDoctors(extractData(res, 'doctors') || []);
    } catch (err) {
      console.error(err);
      setDoctors([]);
    }
  };

  const fetchSlots = async (docId, date) => {
    try {
      const res = await appointmentAPI.getSlots(docId, date);
      setSlots(extractData(res, 'slots') || []);
      setSlotMessage(res.data?.message || '');
    } catch (err) {
      console.error(err);
      setSlots([]);
      setSlotMessage('Error fetching slots. Please try again.');
    }
  };

  const handleDeptSelect = (dept) => {
    setSelectedDept(dept);
    setPreselectedFromDept(false);
    fetchDoctors(dept);
    setStep(2);
  };

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    setStep(3);
  };

  const handleDateSelect = (e) => {
    const val = e.target.value;
    setSelectedDate(val);
    if (val && selectedDoctor) {
      fetchSlots(selectedDoctor.id, val);
      setStep(4);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(5);
  };

  const handleBook = async () => {
    try {
      const payload = {
        doctor_name: `Dr. ${selectedDoctor.name}`.replace('Dr. Dr.', 'Dr.'),
        department: selectedDept,
        date: selectedDate,
        time_slot: selectedSlot,
        notes: notes || "General checkup"
      };
      
      await appointmentAPI.create(payload);
      toast.success("Appointment booked successfully");
      setStep(6);
      fetchAppointments();
    } catch (err) {
      console.error(err.response?.data || err.message);
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to book appointment");
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedDept('');
    setSelectedDoctor(null);
    setSelectedDate('');
    setSelectedSlot('');
    setNotes('');
    setPreselectedFromDept(false);
  };

  const handleCancel = (id) => {
    const confirmCancel = async () => {
      try {
        await appointmentAPI.cancel(id);
        toast.dismiss();
        toast.success("Appointment cancelled");
        fetchAppointments();
      } catch (err) {
        toast.error("Action failed");
      }
    };

    toast(
      <div>
        <p className="mb-3 text-sm font-medium text-gray-800">Cancel this appointment?</p>
        <div className="flex gap-2">
          <button className="bg-rose-500 text-white px-3 py-1 rounded text-xs hover:bg-rose-600 transition-colors cursor-pointer" onClick={confirmCancel}>Yes, Cancel</button>
          <button className="bg-gray-200 text-gray-800 px-3 py-1 rounded text-xs hover:bg-gray-300 transition-colors cursor-pointer" onClick={() => toast.dismiss()}>No</button>
        </div>
      </div>, 
      { autoClose: false, closeOnClick: false, closeButton: false }
    );
  };

  // Build stepper labels — when coming from department page, show department as pre-filled
  const getStepperLabels = () => {
    if (preselectedFromDept) {
      return ['Doctor', 'Date', 'Time Slot', 'Confirm'];
    }
    return ['Department', 'Doctor', 'Date', 'Time Slot', 'Confirm'];
  };

  // Map actual step to display step index for the stepper
  const getDisplayStep = () => {
    if (preselectedFromDept) {
      // Steps 2,3,4,5,6 map to display 1,2,3,4,5
      return step - 1;
    }
    return step;
  };

  const stepperLabels = getStepperLabels();
  const displayStep = getDisplayStep();

  return (
    <div className="animate-fade-in">
      <TopBar title="Appointments" subtitle={isAdmin ? "Manage all hospital appointments" : "Book and manage your appointments"} />

      {!isAdmin && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary-600" />
            Book a New Appointment
            {preselectedFromDept && selectedDept && (
              <span className="ml-3 text-sm font-medium px-3 py-1 rounded-full bg-primary-100 text-primary-700">
                {selectedDept}
              </span>
            )}
          </h2>
          
          {/* Stepper */}
          <div className="flex items-center mb-8 bg-gray-50 p-4 rounded-xl overflow-x-auto">
            {stepperLabels.map((label, idx) => (
              <React.Fragment key={idx}>
                <div className={`flex flex-col items-center min-w-[80px] ${displayStep > idx + 1 ? 'text-primary-600' : displayStep === idx + 1 ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${displayStep >= idx + 1 ? 'bg-primary-100 text-primary-600' : 'bg-gray-200 text-gray-500'}`}>
                    {displayStep > idx + 1 ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <span className="text-xs whitespace-nowrap">{label}</span>
                </div>
                {idx < stepperLabels.length - 1 && <div className={`flex-1 h-1 mx-2 rounded ${displayStep > idx + 1 ? 'bg-primary-500' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>

          <div className="min-h-[250px]">
            {step === 1 && (
              <div className="animate-slide-up grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {departments.map(dept => (
                  <button key={dept} onClick={() => handleDeptSelect(dept)} className="p-4 rounded-xl border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-all flex justify-between items-center text-left cursor-pointer">
                    <span className="font-medium text-gray-800">{dept}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="animate-slide-up">
                {preselectedFromDept ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>Booking for <strong className="text-gray-900">{selectedDept}</strong> department</span>
                  </div>
                ) : (
                  <button onClick={() => setStep(1)} className="text-sm text-primary-600 font-medium mb-4 cursor-pointer">&larr; Back to Departments</button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctors.length === 0 ? <p className="text-gray-500 col-span-3">No doctors available in {selectedDept}.</p> : doctors.map(doc => (
                    <button key={doc.id} onClick={() => doc.status !== 'inactive' && handleDoctorSelect(doc)} className={`p-4 rounded-xl border border-gray-200 transition-all flex items-center justify-between text-left ${doc.status === 'inactive' ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:border-primary-500 hover:bg-primary-50 cursor-pointer'}`}>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-lg font-bold">
                          {doc.name.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Dr. {doc.name}</h4>
                          <p className="text-xs text-gray-500">{doc.specialization}</p>
                        </div>
                      </div>
                      {doc.status === 'inactive' && <span className="text-xs text-rose-500 font-semibold bg-rose-50 px-2 py-1 rounded">Unavailable</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="animate-slide-up max-w-md">
                <button onClick={() => setStep(2)} className="text-sm text-primary-600 font-medium mb-4 cursor-pointer">&larr; Back to Doctors</button>
                <div className="mb-4 text-gray-700 font-medium">Select a Date for Dr. {selectedDoctor?.name}:</div>
                <input type="date" min={new Date().toISOString().split('T')[0]} value={selectedDate} onChange={handleDateSelect} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
            )}

            {step === 4 && (
              <div className="animate-slide-up">
                <button onClick={() => setStep(3)} className="text-sm text-primary-600 font-medium mb-4 cursor-pointer">&larr; Back to Date</button>
                <div className="mb-4 text-gray-700 font-medium">Available Slots on {selectedDate}:</div>
                {slots.length === 0 ? (
                   <div className="text-rose-500 bg-rose-50 p-4 rounded-xl font-medium">
                     {slotMessage.includes('unavailable') ? slotMessage : 'No slots available for this date. Please choose another date.'}
                   </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    {slots.map(slot => (
                      <button key={slot} onClick={() => handleSlotSelect(slot)} className="py-2 px-3 bg-white rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700 transition cursor-pointer">
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 5 && (
              <div className="animate-slide-up max-w-xl mx-auto bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">Confirm Appointment</h3>
                <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-gray-500 text-sm">Department</span>
                    <span className="font-semibold">{selectedDept}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-gray-500 text-sm">Doctor</span>
                    <span className="font-semibold">Dr. {selectedDoctor?.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-2">
                    <span className="text-gray-500 text-sm">Date & Time</span>
                    <span className="font-semibold text-primary-600">{selectedDate} @ {selectedSlot}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-gray-500 text-sm block mb-1">Reason (Optional)</span>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="E.g., general checkup" className="w-full text-sm p-2 bg-gray-50 rounded-lg border border-gray-200 outline-none" rows="2"></textarea>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(4)} className="flex-1 py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium hover:bg-gray-50 cursor-pointer">Back</button>
                  <button onClick={handleBook} className="flex-1 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-sm cursor-pointer">Confirm Booking</button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="animate-scale text-center py-8">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h3>
                <p className="text-gray-500 mb-6 max-w-md mx-auto">Your appointment has been successfully scheduled. We have recorded your request.</p>
                <button onClick={resetBooking} className="px-6 py-2 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 cursor-pointer">Book Another</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Appointment List Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">{isAdmin ? 'All Appointments' : 'Your Appointments'}</h2>
        </div>
        
        {loading ? (
          <div className="p-10 flex justify-center"><div className="w-8 h-8 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin"></div></div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center text-gray-500">No appointments found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  {isAdmin && <th className="p-4 font-semibold">Patient</th>}
                  <th className="p-4 font-semibold">Doctor</th>
                  <th className="p-4 font-semibold">Department</th>
                  <th className="p-4 font-semibold">Date & Time</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                    {isAdmin && <td className="p-4 text-sm text-gray-900">
                      <div className="font-medium">{appt.patient_name || 'N/A'}</div>
                      <div className="text-xs text-gray-400">ID: #{appt.patient_id}</div>
                    </td>}
                    <td className="p-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <UserRound className="w-4 h-4 text-gray-400" />
                        Dr. {appt.doctor_name}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{appt.department}</td>
                    <td className="p-4 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{appt.date && typeof appt.date === 'string' ? appt.date.substring(0,10) : appt.date}</div>
                      <div className="text-xs text-gray-500">{appt.time_slot}</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-md ${
                        appt.status === 'scheduled' ? 'bg-blue-50 text-blue-700' :
                        appt.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {appt.status === 'scheduled' && (
                        <button onClick={() => handleCancel(appt.id)} className="text-sm text-rose-600 hover:text-rose-800 font-medium cursor-pointer">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
