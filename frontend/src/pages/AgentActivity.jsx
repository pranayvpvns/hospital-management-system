import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar';
import { agentAPI } from '../services/api';
import { Bot, Zap, CheckCircle, AlertTriangle, Clock, Play } from 'lucide-react';

const SCENARIOS = [
  { id: 'high_patient_load', label: 'High Patient Load', icon: '🏥' },
  { id: 'medicine_shortage', label: 'Medicine Shortage', icon: '💊' },
  { id: 'cost_optimization', label: 'Cost Optimization', icon: '💰' },
];

const AgentActivity = () => {
  const [activities, setActivities] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [triggering, setTriggering] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchActivity(); }, []);

  const fetchActivity = async () => {
    try {
      const res = await agentAPI.getActivity(30);
      setActivities(res.data.activities);
      setProfiles(res.data.profiles);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const triggerScenario = async (scenario) => {
    setTriggering(true);
    try {
      await agentAPI.trigger(scenario);
      await fetchActivity();
    } catch (err) { console.error(err); }
    setTriggering(false);
  };

  const statusIcon = (s) => {
    if (s === 'final_approval' || s === 'approved') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === 'alert' || s === 'critical') return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    return <Clock className="w-4 h-4 text-amber-500" />;
  };

  const agentColor = (a) => {
    const map = { medical: 'bg-blue-100 text-blue-600', operations: 'bg-amber-100 text-amber-600',
      finance: 'bg-emerald-100 text-emerald-600', ceo: 'bg-purple-100 text-purple-600' };
    return map[a] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="animate-fade-in">
      <TopBar title="Agent Activity" subtitle="Multi-agent system coordination & decisions" />

      {/* Trigger Scenarios */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 animate-slide-up">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-hospital-amber" /> Trigger Agent Scenario
        </h3>
        <div className="flex flex-wrap gap-3">
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => triggerScenario(s.id)} disabled={triggering}
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-200 hover:border-primary-300 transition-all text-sm font-medium disabled:opacity-50">
              <span>{s.icon}</span> {s.label}
              <Play className="w-3.5 h-3.5 text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Agent Profiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(profiles).map(([key, p]) => (
          <div key={key} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center animate-slide-up">
            <div className="text-3xl mb-2">{p.icon}</div>
            <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
            <p className="text-xs text-gray-500 mt-1">{p.domain}</p>
          </div>
        ))}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary-500" /> Activity Timeline
        </h3>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No agent activity yet</p>
            <p className="text-sm mt-1">Trigger a scenario above to see agents in action</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors animate-slide-up" style={{animationDelay:`${i*30}ms`}}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${agentColor(a.agent)}`}>
                  <span className="text-lg">{profiles[a.agent]?.icon || '🤖'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-900">{profiles[a.agent]?.name || a.agent}</span>
                    {statusIcon(a.status)}
                    <span className="text-xs text-gray-400 capitalize">{a.status}</span>
                  </div>
                  <p className="text-sm text-gray-700">{a.action}</p>
                  <p className="text-xs text-primary-600 mt-1">→ {a.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentActivity;
