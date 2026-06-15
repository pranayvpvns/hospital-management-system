import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { predictionAPI } from '../services/api';
import { Brain, Search, Activity, RotateCcw, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';

const DiseasePrediction = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const ALL_SYMPTOMS = [
    'itching', 'skin_rash', 'nodal_skin_eruptions', 'continuous_sneezing',
    'shivering', 'chills', 'joint_pain', 'stomach_pain', 'acidity',
    'ulcers_on_tongue', 'muscle_wasting', 'vomiting', 'burning_micturition',
    'spotting_ urination', 'fatigue', 'weight_gain', 'anxiety',
    'cold_hands_and_feets', 'mood_swings', 'weight_loss'
  ];

  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
  };

  const handlePredict = async () => {
    if (selectedSymptoms.length === 0) {
      toast.warning("Please select at least one symptom.");
      return;
    }

    setLoading(true);
    setPrediction(null);
    setError(null);

    try {
      const res = await predictionAPI.predictDisease(selectedSymptoms);
      if (res.data.status === 'success') {
        setPrediction(res.data);
      } else {
        setError(res.data.error || "Failed to get prediction");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error during prediction analysis.");
    }
    setLoading(false);
  };

  const reset = () => {
    setSelectedSymptoms([]);
    setPrediction(null);
    setError(null);
  };

  return (
    <div className="animate-fade-in pb-12">
      <TopBar 
        title="AI Disease Prediction" 
        subtitle="Select your symptoms and get premium AI-driven health insights" 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Left Column: Symptom Selection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-50 rounded-full -mr-16 -mt-16 opacity-50 blur-2xl"></div>
            
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Select Symptoms</h3>
                  <p className="text-sm text-gray-500 font-medium">Choose all that apply to your current condition</p>
                </div>
              </div>
              <button 
                onClick={reset}
                className="p-2.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all cursor-pointer"
                title="Reset Selection"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {ALL_SYMPTOMS.map((symptom) => {
                const isActive = selectedSymptoms.includes(symptom);
                return (
                  <button
                    key={symptom}
                    onClick={() => toggleSymptom(symptom)}
                    className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all text-left group ${
                      isActive 
                        ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-500/20' 
                        : 'bg-gray-50 border-gray-100 text-gray-600 hover:border-primary-200 hover:bg-white'
                    }`}
                  >
                    <span className="font-semibold capitalize text-sm">
                      {symptom.replace(/_/g, ' ')}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-white border-white scale-110' 
                        : 'border-gray-200 group-hover:border-primary-400'
                    }`}>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handlePredict}
              disabled={loading || selectedSymptoms.length === 0}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl ${
                loading 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white hover:scale-[1.02] active:scale-95 shadow-primary-500/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-400 border-t-white rounded-full animate-spin"></div>
                  <span>Analyzing Symptoms...</span>
                </>
              ) : (
                <>
                  <Brain className="w-6 h-6" />
                  <span>Analyze Symptoms</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="bg-amber-50 rounded-2xl p-5 border border-amber-100 flex items-start gap-4">
             <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
               <AlertTriangle className="w-5 h-5" />
             </div>
             <div>
               <h4 className="text-sm font-bold text-amber-900 mb-1">Medical Disclaimer</h4>
               <p className="text-xs font-medium text-amber-700 leading-relaxed">
                 The results provided by this AI tool are for informational purposes only and do not constitute professional medical advice, diagnosis, or treatment. 
                 Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
               </p>
             </div>
          </div>
        </div>

        {/* Right Column: Prediction Results */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            {loading ? (
              <div className="space-y-6 animate-pulse w-full">
                <div className="w-24 h-24 bg-primary-50 rounded-full mx-auto flex items-center justify-center overflow-hidden relative">
                   <Brain className="w-12 h-12 text-primary-200" />
                   <div className="absolute inset-0 bg-primary-500/10 animate-ping"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-6 bg-gray-100 rounded-full w-3/4 mx-auto"></div>
                  <div className="h-4 bg-gray-50 rounded-full w-1/2 mx-auto"></div>
                </div>
              </div>
            ) : prediction ? (
              <div className="w-full animate-slide-up">
                <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-emerald-100 shadow-lg">
                  <Activity className="w-10 h-10" />
                </div>
                <h4 className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mb-2">Analysis Complete</h4>
                <h2 className="text-3xl font-black text-gray-900 mb-6 bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
                  {prediction.disease}
                </h2>
                
                <div className="space-y-4 text-left w-full">
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-3 px-1">Evidence Analyzed</p>
                    <div className="flex flex-wrap gap-2">
                       {prediction.matched_symptoms.map(s => (
                         <span key={s} className="px-3 py-1.5 bg-white border border-gray-100 rounded-full text-[11px] font-bold text-gray-600 shadow-sm capitalize">
                           {s.replace(/_/g, ' ')}
                         </span>
                       ))}
                    </div>
                  </div>

                  <button 
                    onClick={() => window.location.href='/appointments'}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 mt-4"
                  >
                    Consult a Doctor Now
                  </button>
                </div>
              </div>
            ) : error ? (
              <div className="animate-fade-in text-rose-500">
                <AlertTriangle className="w-16 h-16 mb-4 mx-auto" />
                <h3 className="font-bold text-lg mb-2">Analysis Failed</h3>
                <p className="text-sm text-gray-500 max-w-[200px] mx-auto">{error}</p>
                <button 
                  onClick={handlePredict}
                  className="mt-6 px-6 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs border border-rose-100 hover:bg-rose-100 transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-32 h-32 bg-gray-50 rounded-full mx-auto flex items-center justify-center relative">
                  <Brain className="w-16 h-16 text-gray-200" />
                  <div className="absolute top-2 right-2 w-4 h-4 bg-primary-100 rounded-full animate-bounce"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to start</h3>
                  <p className="text-sm text-gray-400 max-w-[240px] font-medium">Select your symptoms from the left panel to begin AI analysis.</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-hospital-purple to-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/20">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="font-bold">Next Steps</h4>
             </div>
             <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">1</div>
                  <p className="text-xs text-indigo-50 leading-relaxed font-medium">Book a consultation regardless of AI analysis if symptoms persist.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">2</div>
                  <p className="text-xs text-indigo-50 leading-relaxed font-medium">Prepare a medical history summary for your appointment.</p>
                </li>
             </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseasePrediction;
