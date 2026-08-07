import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { supabase } from '../../lib/supabase';
import { Sparkles, Lock, Mail, ShieldCheck, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, cloudEnabled } = useERP();

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [forgotModal, setForgotModal] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveredMsg, setRecoveredMsg] = useState(false);
  const [recovering, setRecovering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    const ok = await login(email, password);
    if (!ok) setSubmitting(false);
  };

  const handleRecover = async () => {
    if (!recoveryEmail) return;
    setRecovering(true);
    if (supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail);
      if (error) {
        setRecoveredMsg(false);
      } else {
        setRecoveredMsg(true);
      }
    } else {
      setRecoveredMsg(true);
    }
    setRecovering(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#0D1117] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#161B22] border border-gray-800 rounded-3xl p-8 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 via-purple-500 to-indigo-500 flex items-center justify-center text-white shadow-xl shadow-purple-900/30 font-extrabold text-2xl tracking-wider mb-3">
            N
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">NEXUS AGÊNCIA</h1>
          <p className="text-xs text-purple-400 font-medium mt-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Gestão Financeira & Comercial
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">E-mail Corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@empresa.com.br"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-300">Senha</label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium transition-colors"
              >
                Esqueceu a senha?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#0D1117] border border-gray-800 focus:border-purple-500 rounded-xl text-sm text-white focus:outline-hidden transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            <span>{submitting ? 'Entrando...' : 'Entrar no Sistema'}</span>
          </button>
        </form>

        <div className="mt-6 text-center text-[11px] text-gray-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          {cloudEnabled ? 'Dados na nuvem segura • Autenticação protegida' : 'Acesso privado por e-mail • Conexão Segura SSL'}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-[#161B22] border border-gray-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Recuperação de Senha</h3>
            <p className="text-xs text-gray-400 mb-4">
              Informe seu e-mail cadastrado para receber o link de redefinição de acesso.
            </p>

            {recoveredMsg ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Link de recuperação enviado com sucesso para o e-mail informado! Verifique sua caixa de entrada.
                </span>
              </div>
            ) : (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Seu E-mail</label>
                  <input
                    type="email"
                    value={recoveryEmail}
                    onChange={(e) => setRecoveryEmail(e.target.value)}
                    placeholder="email@empresa.com.br"
                    className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setForgotModal(false);
                  setRecoveredMsg(false);
                }}
                className="px-3 py-2 text-xs text-gray-400 hover:text-white"
              >
                Fechar
              </button>
              {!recoveredMsg && (
                <button
                  onClick={handleRecover}
                  disabled={recovering}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-60 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                >
                  {recovering && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Enviar Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
