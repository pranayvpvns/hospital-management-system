import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { predictionAPI } from '../services/api';
import { Users, IndianRupee, Activity, Package, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Predictions = () => {
  const [inflow, setInflow] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [disease, setDisease] = useState(null);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Predictor State
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'custom'
  const [customDate, setCustomDate] = useState('');
  const [predicting, setPredicting] = useState(false);
  const [customResult, setCustomResult] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [i, r, d, res] = await Promise.all([
          predictionAPI.getPatientInflow(), predictionAPI.getRevenue(),
          predictionAPI.getDiseaseTrends(), predictionAPI.getResourceDemand()
        ]);
        setInflow(i.data); setRevenue(r.data); setDisease(d.data); setResource(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleCustomPredict = async () => {
    if (!customDate) return;
    setPredicting(true);
    try {
      const res = await predictionAPI.predictInflow(customDate);
      setCustomResult(res.data);
    } catch (err) {
      console.error(err);
      setCustomResult({ error: 'Failed to get prediction. Model may not be loaded.' });
    }
    setPredicting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div></div>;

  const trendIcon = (t) => t === 'increasing' ? <TrendingUp className="w-4 h-4 text-rose-500" /> :
    t === 'decreasing' ? <TrendingDown className="w-4 h-4 text-emerald-500" /> : <Minus className="w-4 h-4 text-gray-400" />;

  const riskColor = (r) => r === 'high' ? 'badge-danger' : r === 'medium' ? 'badge-warning' : 'badge-success';

  return (
    <div className="animate-fade-in">
      <TopBar title="AI Predictions" subtitle="ML-powered forecasting and analytics" />

      {/* Tabs */}
      <div className="flex gap-4 mb-8 mt-6">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'overview' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
        >
          Insights Overview
        </button>
        <button 
          onClick={() => setActiveTab('custom')}
          className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'custom' ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
        >
          Custom Inflow Forecast
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="space-y-8 animate-slide-up">
          {/* Prediction Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"><Users className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{inflow?.title}</h3>
                  <p className="text-xs text-gray-500">Confidence: {(inflow?.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[...(inflow?.historical?.slice(-10)||[]), ...(inflow?.predicted||[])]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{fontSize:10,fill:'#94A3B8'}} />
                  <YAxis tick={{fontSize:10,fill:'#94A3B8'}} />
                  <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E2E8F0'}} />
                  <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg mt-3">{inflow?.insight}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{animationDelay:'100ms'}}>
              <div className="flex items-center gap-3 mb-1">
                <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center"><IndianRupee className="w-4 h-4 text-emerald-600" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{revenue?.title}</h3>
                  <p className="text-xs text-gray-500">Confidence: {(revenue?.confidence * 100).toFixed(0)}%</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={[...(revenue?.historical?.slice(-10)||[]), ...(revenue?.predicted||[])]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="date" tick={{fontSize:10,fill:'#94A3B8'}} />
                  <YAxis tick={{fontSize:10,fill:'#94A3B8'}} />
                  <Tooltip contentStyle={{borderRadius:'12px',border:'1px solid #E2E8F0'}} />
                  <Line type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mt-3">{revenue?.insight}</p>
            </div>
          </div>

          {/* Disease Trends */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-5 animate-slide-up" style={{animationDelay:'200ms'}}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2"><Activity className="w-5 h-5 text-primary-500" /> {disease?.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{disease?.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {disease?.trends?.map((t, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm text-gray-900">{t.disease}</span>
                    {trendIcon(t.trend)}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Now: {t.current_cases}</span>
                    <span className="text-gray-500">Next: {t.predicted_next_week}</span>
                  </div>
                  <div className="mt-2"><span className={riskColor(t.risk_level)}>{t.risk_level} risk</span></div>
                </div>
              ))}
            </div>
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-4">{disease?.season_alert}</p>
          </div>

          {/* Resource Demand */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up" style={{animationDelay:'300ms'}}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-hospital-purple" /> {resource?.title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {resource?.resources?.map((r, i) => {
                const shortage = r.predicted_need > r.current;
                return (
                  <div key={i} className={`p-4 rounded-xl border-2 ${shortage ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
                    <p className="font-semibold text-sm text-gray-900">{r.resource}</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
                      <span>Current: {r.current} {r.unit}</span>
                      <span>Need: {r.predicted_need} {r.unit}</span>
                    </div>
                    {shortage && <p className="text-xs text-amber-700 mt-2 font-medium">⚠️ Shortage predicted</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-primary-600 bg-primary-50 px-3 py-2 rounded-lg mt-4">{resource?.insight}</p>
          </div>
        </div>
      ) : (
        <div className="animate-slide-up max-w-2xl mx-auto">
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Custom Day Forecast</h3>
            <p className="text-sm text-gray-500 mb-6">Select a date to predict the patient inflow for your hospital.</p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <input 
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-medium"
              />
              <button 
                onClick={handleCustomPredict}
                disabled={predicting || !customDate}
                className={`px-8 py-3 rounded-xl font-bold text-white transition-all shadow-lg ${predicting || !customDate ? 'bg-gray-300 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/20'}`}
              >
                {predicting ? 'Predicting...' : 'Run Forecast'}
              </button>
            </div>

            {customResult && (
              <div className="animate-fade-in">
                {customResult.error ? (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 font-medium">
                    {customResult.error}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-8 bg-primary-50 rounded-3xl text-center border border-primary-100">
                      <p className="text-primary-600 text-sm font-bold uppercase tracking-wider mb-2">Predicted Inflow for {customResult.date}</p>
                      <h2 className="text-5xl font-black text-primary-900 mb-3">{customResult.predicted_inflow}</h2>
                      <p className="text-primary-700 font-medium">Patients expected on this day.</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                      <h4 className="font-bold text-gray-900 mb-3">AI Recommendation:</h4>
                      <div className="flex gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center flex-shrink-0">
                          <Activity className="w-5 h-5 text-primary-600" />
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          Based on the forecast of {customResult.predicted_inflow} patients, we suggest 
                          {customResult.predicted_inflow > 50 ? ' increasing on-call nursery staff and ensuring ICU beds are available.' : ' normal operational capacity for this period.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Predictions;
