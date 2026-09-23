export default function StatsCard({ title, value, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    cyan: 'bg-cyan-50 text-cyan-600',
  };

  return (
    <div className="rounded-xl border border-stroke bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h4 className="mt-1 text-2xl font-bold text-slate-800">{value}</h4>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colorMap[color] || colorMap.blue}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}
