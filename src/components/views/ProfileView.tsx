import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { UserRole } from '../../types';
import { User, Shield, Key, CheckCircle2, Trash2, Mail, Users, Copy, UploadCloud, CloudCheck, Database, UserPlus } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { currentUser, users, updateUser, deleteUser, registerUser, cloudEnabled, companyCode, migrateLocalDataToCloud } = useERP();

  // Own profile state
  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [newPassword, setNewPassword] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // LocalStorage-mode new user form
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('Funcionário');
  const [regSaved, setRegSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const updates: Partial<typeof currentUser> = { name, avatar };
    if (newPassword && newPassword.trim() !== '') {
      updates.password = newPassword;
    }
    updateUser(currentUser.id, updates);
    setNewPassword('');
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const copyCode = async () => {
    if (!companyCode) return;
    try {
      await navigator.clipboard.writeText(companyCode);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    await migrateLocalDataToCloud();
    setMigrating(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;
    if (regPassword !== regConfirm) return;
    const ok = await registerUser({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
    });
    if (ok) {
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirm('');
      setRegRole('Funcionário');
      setRegSaved(true);
      setTimeout(() => setRegSaved(false), 3000);
    }
  };

  const canDelete = (id: string) =>
    id !== currentUser?.id &&
    users.length > 1 &&
    (currentUser?.role === 'Administrador' || !cloudEnabled);

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Meu Perfil & Equipe</h1>
        <p className="text-xs text-gray-400 mt-1">
          {cloudEnabled
            ? 'Seus dados de acesso e a gestão da equipe da sua empresa.'
            : 'Seus dados de acesso e o cadastro de novos usuários. Cada e-mail garante um acesso privado individual.'}
        </p>
      </div>

      {/* ============ Meu Perfil ============ */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* User Card */}
        <div className="flex items-center gap-4 pb-6 border-b border-gray-800">
          {avatar ? (
            <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border-2 border-purple-500" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-purple-600 text-white font-extrabold flex items-center justify-center text-2xl">
              {name.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-white">{name}</h3>
            <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-md uppercase">
              {currentUser?.role}
            </span>
            <div className="text-[11px] text-gray-400 mt-1">{currentUser?.email}</div>
          </div>
        </div>

        {cloudEnabled && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0D1117] border border-gray-800 rounded-2xl">
            <div>
              <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                <CloudCheck className="w-3.5 h-3.5" /> Dados na nuvem
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Sua empresa sincroniza em tempo real entre todos os membros da equipe.
              </div>
            </div>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="px-4 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-xl flex items-center gap-1.5 disabled:opacity-60"
              title="Envia os dados que ainda estão no navegador para a nuvem"
            >
              {migrating ? (
                <Database className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              Migrar dados do navegador
            </button>
          </div>
        )}

        {cloudEnabled && companyCode && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-purple-600/10 to-indigo-600/10 border border-purple-500/20 rounded-2xl">
            <div>
              <div className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Código da Empresa
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">
                Envie para sua equipe: eles criam o acesso com esse código e entram no mesmo sistema.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 bg-[#0D1117] border border-purple-500/30 rounded-xl text-lg font-extrabold tracking-[0.3em] text-white font-mono">
                {companyCode}
              </span>
              <button
                onClick={copyCode}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">URL do Foto Avatar</label>
            <input
              type="url"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 border-t border-gray-800">
            <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-purple-400" /> Alterar Minha Senha de Acesso
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha de segurança..."
              className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
            />
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Perfil atualizado!
              </span>
            ) : (
              <span />
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-purple-900/30"
            >
              Salvar Perfil
            </button>
          </div>
        </form>
      </div>

      {/* ============ Cadastrar Novo Usuário (modo local) ============ */}
      {!cloudEnabled && (
        <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-5">
          <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cadastrar Novo Usuário</h3>
              <p className="text-[11px] text-gray-400">Cada e-mail cria um acesso privado com senha própria.</p>
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Nome do usuário"
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">E-mail de Acesso (Login Privado)</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="usuario@empresa.com.br"
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Senha</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Senha de acesso"
                  className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  required
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className={`w-full px-3 py-2 bg-[#0D1117] border rounded-xl text-xs ${
                    regConfirm && regPassword !== regConfirm ? 'border-rose-500/60' : 'border-gray-800'
                  } text-white`}
                />
                {regConfirm && regPassword !== regConfirm && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">As senhas não coincidem.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1">Nível de Acesso</label>
              <select
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-[#0D1117] border border-gray-800 text-white rounded-xl text-xs"
              >
                <option value="Administrador">Administrador</option>
                <option value="Gerente">Gerente</option>
                <option value="Funcionário">Funcionário</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
              {regSaved && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Usuário cadastrado!
                </span>
              )}
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-900/30"
              >
                Cadastrar Usuário
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============ Equipe ============ */}
      <div className="bg-[#161B22] border border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-3 border-b border-gray-800 pb-4">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Equipe</h3>
            <p className="text-[11px] text-gray-400">
              {cloudEnabled
                ? `${users.length} membro(s) com acesso ao sistema da empresa. Novos membros entram pelo código da empresa.`
                : `${users.length} usuário(s) com acesso privado ao sistema.`}
            </p>
          </div>
        </div>

        {users.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-500 border border-dashed border-gray-800 rounded-2xl">
            Nenhum usuário cadastrado ainda. Cadastre o primeiro acesso acima.
          </div>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3.5 bg-[#0D1117] border border-gray-800/80 rounded-2xl"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded-full object-cover border border-gray-700 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-purple-600/30 text-purple-300 font-bold flex items-center justify-center text-sm shrink-0">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate flex items-center gap-2">
                        {u.name}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 bg-emerald-500/10 rounded-md">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5 truncate">
                        <Mail className="w-3 h-3 shrink-0" />
                        {u.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2.5 py-1 text-[10px] font-bold text-purple-300 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      {u.role}
                    </span>
                    {canDelete(u.id) && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Remover ${u.name} da equipe?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg transition-colors"
                        title="Remover da equipe"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cloudEnabled && !canDelete('') && currentUser?.role !== 'Administrador' && users.length > 1 && (
          <p className="text-[10px] text-gray-500">
            Apenas administradores podem remover membros da equipe.
          </p>
        )}
      </div>
    </div>
  );
};
