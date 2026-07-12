import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2, Eye, EyeOff, Zap, Database } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

// ─── Demo accounts ────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    role: 'Admin',
    email: 'admin@transitops.com',
    password: 'password123',
    color: 'from-amber-500 to-orange-500',
    shadow: '0 0 20px rgba(245,158,11,0.3)',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    icon: '👑',
    access: 'Full Access',
  },
  {
    role: 'Fleet Manager',
    email: 'fleet@transitops.com',
    password: 'password123',
    color: 'from-blue-500 to-blue-600',
    shadow: '0 0 20px rgba(59,130,246,0.3)',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    icon: '🚛',
    access: 'Fleet & Analytics',
  },
  {
    role: 'Dispatcher',
    email: 'dispatch@transitops.com',
    password: 'password123',
    color: 'from-green-500 to-emerald-600',
    shadow: '0 0 20px rgba(34,197,94,0.3)',
    badge: 'bg-green-500/20 text-green-300 border-green-500/30',
    icon: '📍',
    access: 'Trips & Routes',
  },
  {
    role: 'Safety Officer',
    email: 'safety@transitops.com',
    password: 'password123',
    color: 'from-rose-500 to-red-600',
    shadow: '0 0 20px rgba(239,68,68,0.3)',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    icon: '🛡️',
    access: 'Drivers & Safety',
  },
  {
    role: 'Financial Analyst',
    email: 'finance@transitops.com',
    password: 'password123',
    color: 'from-purple-500 to-violet-600',
    shadow: '0 0 20px rgba(139,92,246,0.3)',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    icon: '📈',
    access: 'Finance & Reports',
  },
];

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState(null);
  const [dbError, setDbError] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const doLogin = async (emailVal, passwordVal, label = null) => {
    setIsLoading(true);
    setDbError(false);
    if (label) setActiveDemo(label);
    try {
      await login({ email: emailVal, password: passwordVal });
      toast.success('Welcome to TransitOps!');
      navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) {
        setDbError(true);
      } else {
        toast.error(err.response?.data?.error?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
      setActiveDemo(null);
    }
  };

  const handleManualLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter your email and password');
      return;
    }
    doLogin(email, password);
  };

  const handleDemoLogin = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    doLogin(user.email, user.password, user.role);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await api.post('/seed');
      if (res.data.seeded) {
        toast.success('Database seeded! You can now log in with any demo account.', { duration: 5000 });
        setDbError(false);
      } else {
        toast.info(res.data.message);
        setDbError(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to seed database. Try running setup.bat manually.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}
    >
      <div className="p-7">
        {/* Mobile Logo */}
        <div className="flex items-center gap-2 mb-7 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <span className="text-sm">🚚</span>
          </div>
          <span className="text-white font-bold text-lg">TransitOps</span>
        </div>

        {/* Header */}
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-white mb-1">Sign in</h2>
          <p className="text-white/40 text-sm">Click a role below to get instant access</p>
        </div>

        {/* DB Not Seeded Warning */}
        {dbError && (
          <div className="mb-5 p-4 rounded-xl border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
            <p className="text-red-300 font-semibold text-sm mb-1">⚠️ Database not initialized yet</p>
            <p className="text-red-400/70 text-xs leading-relaxed mb-3">
              The demo accounts don't exist yet. Click below to set up the database automatically.
            </p>
            <button
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white
                bg-gradient-to-r from-red-500 to-rose-600
                hover:from-red-400 hover:to-rose-500
                transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSeeding ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Setting up database...</>
              ) : (
                <><Database className="h-3.5 w-3.5" /> Initialize Database &amp; Seed Demo Data</>
              )}
            </button>
          </div>
        )}

        {/* One-click Demo Login Cards */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">Quick Login</span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((user) => {
              const isActive = activeDemo === user.role;
              return (
                <button
                  key={user.role}
                  onClick={() => handleDemoLogin(user)}
                  disabled={isLoading}
                  className={`
                    group relative flex items-center gap-3 w-full p-3 rounded-xl text-left
                    transition-all duration-200 cursor-pointer
                    border border-white/[0.06] hover:border-white/20
                    ${isActive ? 'scale-[0.99]' : 'hover:bg-white/[0.04]'}
                    ${isLoading && !isActive ? 'opacity-40 pointer-events-none' : ''}
                  `}
                  style={{ background: 'rgba(255,255,255,0.025)' }}
                >
                  {/* Colored icon */}
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${user.color}
                      flex items-center justify-center text-lg shrink-0 transition-transform duration-200 group-hover:scale-105`}
                    style={{ boxShadow: isActive ? user.shadow : 'none' }}
                  >
                    {isActive ? (
                      <Loader2 className="h-4 w-4 text-white animate-spin" />
                    ) : (
                      user.icon
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{user.role}</span>
                      <span className={`hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-medium border ${user.badge}`}>
                        {user.access}
                      </span>
                    </div>
                    <span className="text-xs text-white/30 font-mono">{user.email}</span>
                  </div>

                  {/* Arrow */}
                  <span className="text-white/20 group-hover:text-white/50 transition-colors shrink-0 text-sm">→</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
          <span className="text-[11px] text-white/25 font-medium tracking-wide">or enter credentials</span>
          <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Manual Form */}
        <form onSubmit={handleManualLogin} className="space-y-3">
          <div>
            <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.com"
              disabled={isLoading}
              autoComplete="username"
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-white/20
                border border-white/10 focus:border-amber-500/50 focus:outline-none
                focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-white/40 mb-1.5 uppercase tracking-widest">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full px-4 py-2.5 pr-11 rounded-xl text-sm text-white placeholder-white/20
                  border border-white/10 focus:border-amber-500/50 focus:outline-none
                  focus:ring-2 focus:ring-amber-500/20 transition-all duration-200 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-1 rounded-xl text-sm font-semibold text-[#1a1a1a]
              bg-gradient-to-r from-amber-400 to-amber-500
              hover:from-amber-300 hover:to-amber-400
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
            style={{ boxShadow: '0 4px 24px rgba(245,158,11,0.25)' }}
          >
            {isLoading && !activeDemo ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        {/* Footer note */}
        <p className="mt-5 text-center text-[11px] text-white/20">
          All demo accounts use password: <span className="text-white/40 font-mono">password123</span>
        </p>
      </div>
    </div>
  );
};
