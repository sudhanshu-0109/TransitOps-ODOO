import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0A0B0F] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, #E8A33D 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
            animation: 'blob1 12s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, #2E7D5B 0%, transparent 70%)',
            bottom: '-15%',
            right: '-5%',
            animation: 'blob2 15s ease-in-out infinite alternate',
          }}
        />
        <div
          className="absolute w-[300px] h-[300px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)',
            top: '50%',
            left: '60%',
            animation: 'blob3 10s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-10 lg:gap-16 py-10">
        {/* Brand side */}
        <BrandPanel />
        {/* Form side */}
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>

      <style>{`
        @keyframes blob1 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(40px, 60px) scale(1.15); }
        }
        @keyframes blob2 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(-50px, -30px) scale(1.1); }
        }
        @keyframes blob3 {
          0% { transform: translate(0,0) scale(1); }
          100% { transform: translate(30px, 50px) scale(1.2); }
        }
      `}</style>
    </div>
  );
};

const STATS = [
  { value: '10K+', label: 'Trips Managed' },
  { value: '500+', label: 'Fleet Vehicles' },
  { value: '99.9%', label: 'Uptime' },
  { value: '5 Roles', label: 'Access Control' },
];

const FEATURES = [
  { icon: '🚛', text: 'Real-time Fleet Tracking' },
  { icon: '📊', text: 'Analytics & Reporting' },
  { icon: '🔧', text: 'Maintenance Management' },
  { icon: '⛽', text: 'Fuel & Expense Control' },
];

const BrandPanel = () => (
  <div className="flex-1 text-white hidden lg:block">
    {/* Logo */}
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
        <span className="text-xl">🚚</span>
      </div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">TransitOps</h1>
        <p className="text-xs text-white/40 font-medium tracking-widest uppercase">Fleet ERP Platform</p>
      </div>
    </div>

    {/* Headline */}
    <div className="mb-10">
      <h2 className="text-4xl font-bold leading-tight text-white mb-4">
        Smarter Fleet.<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-300">
          Seamless Operations.
        </span>
      </h2>
      <p className="text-white/60 text-base leading-relaxed max-w-sm">
        Manage your entire transport operation from one powerful platform — trips, maintenance, fuel costs and more.
      </p>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-2 gap-4 mb-10">
      {STATS.map(({ value, label }) => (
        <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <div className="text-2xl font-bold text-amber-400">{value}</div>
          <div className="text-xs text-white/50 mt-0.5">{label}</div>
        </div>
      ))}
    </div>

    {/* Features */}
    <div className="space-y-2.5">
      {FEATURES.map(({ icon, text }) => (
        <div key={text} className="flex items-center gap-3 text-sm text-white/60">
          <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-base">{icon}</span>
          {text}
        </div>
      ))}
    </div>
  </div>
);
