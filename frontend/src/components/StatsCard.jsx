import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ icon: Icon, label, value, trend, trendValue, color = 'primary', delay = 0 }) => {
  const colorMap = {
    primary: 'from-primary-500 to-primary-600',
    blue: 'from-hospital-blue to-blue-600',
    purple: 'from-hospital-purple to-purple-600',
    teal: 'from-hospital-teal to-teal-600',
    rose: 'from-hospital-rose to-rose-600',
    amber: 'from-hospital-amber to-amber-600',
    sky: 'from-hospital-sky to-sky-600',
  };

  return (
    <div className="stat-card animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg shadow-${color}-500/20`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-600' :
            trend === 'down' ? 'bg-rose-50 text-rose-600' :
            'bg-gray-50 text-gray-500'
          }`}>
            {trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
             trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
             <Minus className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
};

export default StatsCard;
