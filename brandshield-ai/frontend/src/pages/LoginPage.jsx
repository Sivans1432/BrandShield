import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Share2,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { requestPasswordReset } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, googleLogin } = useAuth();

  const from = location.state?.from?.pathname || '/dashboard';

  // Mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');

  // Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register fields
  const [fullName, setFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Forgot password fields
  const [forgotEmail, setForgotEmail] = useState('');
  const [devResetUrl, setDevResetUrl] = useState(null);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };
  const regStrength = getPasswordStrength(regPassword);

  const resetErrors = () => {
    setErrorMessage('');
    setSuccessMessage('');
  };

  // 1. Submit Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    resetErrors();
    setIsLoading(true);

    try {
      await login(loginEmail, loginPassword);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit Register
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    resetErrors();

    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms of Service and Privacy Policy.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register({
        full_name: fullName,
        email: regEmail,
        password: regPassword,
        confirm_password: regConfirmPassword,
        terms_accepted: termsAccepted
      });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Submit Forgot Password
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    resetErrors();
    setDevResetUrl(null);

    if (!forgotEmail) {
      setErrorMessage('Please enter your account email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await requestPasswordReset({ email: forgotEmail });
      setSuccessMessage(res.data.message || 'Password reset link sent to your email.');
      if (res.data.dev_reset_url) {
        setDevResetUrl(res.data.dev_reset_url);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to process password reset request.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Handle Google Sign-In
  const handleGoogleClick = async () => {
    resetErrors();
    setIsLoading(true);
    try {
      await googleLogin({
        // In full OAuth redirect flow, this token comes from Google Sign-In button
        // For development fallback when GOOGLE_CLIENT_ID is not configured, auth_service throws informative setup prompt
        id_token: null
      });
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(
        err.message ||
        'Google OAuth configuration required. Please configure GOOGLE_CLIENT_ID in backend/.env.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Demo fill helper
  const fillDemoCredentials = () => {
    setLoginEmail('analyst@brandshield.ai');
    setLoginPassword('BrandShield@2026');
  };

  return (
    <div className="min-h-screen bg-[#050814] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation Brand Header */}
      <header className="px-6 lg:px-12 py-5 flex items-center justify-between border-b border-slate-800/60 bg-[#070b19]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white font-sans">
                BRAND<span className="text-cyan-400">SHIELD</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
              Digital Risk Protection Platform
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs text-slate-400">SOC Defense Engine: <span className="text-emerald-400 font-semibold">Online</span></span>
        </div>
      </header>

      {/* Main Container: 2 Columns on Desktop */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 w-full items-center">
          
          {/* LEFT SECTION: Brand Hero & Glowing Illustration */}
          <div className="lg:col-span-6 xl:col-span-7 space-y-6 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-semibold backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Next-Generation Brand Integrity & Anti-Impersonation</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Your Brand. Your Identity.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400">
                Protected.
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              BrandShield AI monitors global surface and deep web channels 24/7. Detect fake social profiles,
              fraudulent mobile applications, executive impersonation, and domain phishing attacks before they harm your reputation.
            </p>

            {/* Glowing Shield & Lock Cyber Illustration */}
            <div className="relative py-4 my-2 flex items-center justify-center lg:justify-start">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                {/* Outer Glow Circles */}
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 blur-3xl animate-pulse"></div>
                <div className="absolute w-48 h-48 rounded-full bg-blue-600/15 blur-2xl"></div>
                
                {/* Cyber Matrix Ring SVG */}
                <svg className="absolute w-full h-full text-cyan-500/20 animate-[spin_40s_linear_infinite]" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6,6" />
                  <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="12,12" />
                  <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4,8" />
                </svg>

                {/* Central Glowing Shield and Lock Badge */}
                <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-3xl bg-gradient-to-tr from-[#0a142e] via-[#0d1e44] to-[#071126] border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.35)] flex flex-col items-center justify-center text-cyan-300 group">
                  <div className="relative">
                    <Shield className="w-16 h-16 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)]" />
                    <Lock className="w-7 h-7 text-white absolute inset-0 m-auto translate-y-1 drop-shadow-md" />
                  </div>
                  <span className="text-[10px] font-mono tracking-widest text-cyan-300/80 uppercase mt-2 font-bold">
                    SECURED • 256-BIT
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 max-w-xl">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Social Intelligence</h4>
                  <p className="text-[10px] text-slate-400">Cross-Platform Audit</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">App Protection</h4>
                  <p className="text-[10px] text-slate-400">Store Rogue Detection</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Threat Detection</h4>
                  <p className="text-[10px] text-slate-400">Real-Time Takedown</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION: Authentication Card */}
          <div className="lg:col-span-6 xl:col-span-5 w-full">
            <div className="relative rounded-2xl bg-[#0c1427]/85 backdrop-blur-xl border border-cyan-500/30 shadow-[0_10px_40px_rgba(0,0,0,0.6)] p-6 sm:p-8 overflow-hidden">
              {/* Subtle Ambient Background Highlight */}
              <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>

              {/* Card Header & Mode Switcher */}
              <div className="relative mb-6">
                {mode === 'login' && (
                  <div>
                    <h2 className="text-xl font-bold text-white">Sign In to BrandShield</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your analyst credentials to access the SOC Command Center.
                    </p>
                  </div>
                )}
                {mode === 'register' && (
                  <div>
                    <h2 className="text-xl font-bold text-white">Create Analyst Account</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Register to protect enterprise assets, domains, and social channels.
                    </p>
                  </div>
                )}
                {mode === 'forgot' && (
                  <div>
                    <h2 className="text-xl font-bold text-white">Reset Account Password</h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter your verified email to receive secure recovery instructions.
                    </p>
                  </div>
                )}
              </div>

              {/* Feedback Alerts */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              {/* Development Reset URL Helper */}
              {devResetUrl && (
                <div className="mb-4 p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 text-xs space-y-2">
                  <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Dev Recovery Link Generated:</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    SMTP is in local development mode. You can test the password reset immediately:
                  </p>
                  <a
                    href={devResetUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs hover:bg-cyan-400 transition"
                  >
                    <span>Proceed to Password Reset</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* MODE 1: LOGIN */}
              {mode === 'login' && (
                <div className="space-y-4">
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2.5 transition active:scale-[0.99] disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-800 w-full"></div>
                    <span className="bg-[#0c1427] px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                      Or continue with email
                    </span>
                    <div className="border-t border-slate-800 w-full"></div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Work Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="analyst@brandshield.ai"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            resetErrors();
                            setMode('forgot');
                            setForgotEmail(loginEmail);
                          }}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type={showLoginPassword ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-9 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-white"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Gradient Sign In Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Authenticating...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In to Dashboard</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Seeded Credentials helper */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Default SOC Login:</span>
                    <button
                      type="button"
                      onClick={fillDemoCredentials}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline decoration-dotted"
                    >
                      Auto-fill Analyst Credentials
                    </button>
                  </div>

                  {/* Toggle to Create Account */}
                  <div className="pt-2 text-center text-xs text-slate-400">
                    Don’t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetErrors();
                        setMode('register');
                      }}
                      className="text-cyan-400 font-semibold hover:underline"
                    >
                      Create account
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: CREATE ACCOUNT */}
              {mode === 'register' && (
                <div className="space-y-4">
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Work Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="alex@enterprise.com"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="Min 8 chars"
                            className="w-full pl-9 pr-9 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            className="absolute right-2.5 top-3 text-slate-400 hover:text-white"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                          Confirm Password *
                        </label>
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {regPassword && (
                      <div className="space-y-1 pt-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Password Strength:</span>
                          <span className={`font-bold ${
                            regStrength <= 1 ? 'text-rose-400' : regStrength <= 2 ? 'text-amber-400' : regStrength <= 3 ? 'text-cyan-400' : 'text-emerald-400'
                          }`}>
                            {regStrength <= 1 ? 'Weak' : regStrength <= 2 ? 'Moderate' : regStrength <= 3 ? 'Strong' : 'Very Strong'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5 h-1.5">
                          <div className={`rounded-full ${regStrength >= 1 ? 'bg-rose-500' : 'bg-slate-800'}`}></div>
                          <div className={`rounded-full ${regStrength >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                          <div className={`rounded-full ${regStrength >= 3 ? 'bg-cyan-500' : 'bg-slate-800'}`}></div>
                          <div className={`rounded-full ${regStrength >= 4 ? 'bg-emerald-500' : 'bg-slate-800'}`}></div>
                        </div>
                      </div>
                    )}

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="mt-1 h-3.5 w-3.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0 cursor-pointer"
                      />
                      <label htmlFor="terms" className="text-[11px] text-slate-400 leading-tight cursor-pointer">
                        I accept the{' '}
                        <span className="text-cyan-400 hover:underline">Terms of Service</span> and{' '}
                        <span className="text-cyan-400 hover:underline">Privacy Policy</span>.
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition disabled:opacity-50 mt-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Enterprise Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Toggle back to Login */}
                  <div className="pt-2 text-center text-xs text-slate-400">
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetErrors();
                        setMode('login');
                      }}
                      className="text-cyan-400 font-semibold hover:underline"
                    >
                      Sign in
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 3: FORGOT PASSWORD */}
              {mode === 'forgot' && (
                <div className="space-y-4">
                  <form onSubmit={handleForgotSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider block">
                        Account Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="e.g. analyst@brandshield.ai"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        We will send a one-time cryptographic reset token valid for 1 hour.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-[0.99] transition disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Sending Instructions...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Reset Instructions</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="pt-2 text-center text-xs text-slate-400">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        resetErrors();
                        setMode('login');
                      }}
                      className="text-cyan-400 font-semibold hover:underline"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="px-6 py-4 border-t border-slate-800/60 bg-[#070b19]/60 text-center text-xs text-slate-500">
        <p>© 2026 BrandShield AI. Advanced Digital Risk Protection & Brand Integrity Intelligence Platform.</p>
      </footer>
    </div>
  );
}
