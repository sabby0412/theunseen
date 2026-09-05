import React, { useState } from 'react';
import { User } from '../types';
import { X, Lock, Mail, User as UserIcon, ArrowRight, Loader2, Key } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const body = mode === 'login'
      ? { login: email, password }
      : { email, username, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#080808] border border-neutral-700 p-6 sm:p-8 grid-lines shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6 text-xs font-mono-code">
          <span className="text-[#ff3b00] font-bold uppercase tracking-widest flex items-center gap-2">
            <Key className="w-4 h-4" />
            {mode === 'login' ? 'PERSONAL ARCHIVE ACCESS' : 'CREATE ARCHIVIST PROFILE'}
          </span>
          <button
            onClick={onClose}
            className="p-1 border border-neutral-800 hover:border-[#ff3b00] text-neutral-400 hover:text-[#ff3b00]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h2 className="font-display text-4xl text-[#f3f2ee] uppercase mb-1">
          {mode === 'login' ? 'SIGN IN' : 'SIGN UP'}
        </h2>
        <p className="text-xs font-sans text-neutral-400 mb-6">
          {mode === 'login'
            ? 'Access your personal movie archive, watchlist, and ratings.'
            : 'Join the exhibition to save your personal movie collection.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-500/80 text-red-300 text-xs font-mono-code">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-code text-xs">
          <div>
            <label className="block text-[10px] text-neutral-500 uppercase mb-1">
              {mode === 'login' ? 'EMAIL OR USERNAME' : 'EMAIL ADDRESS'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={mode === 'login' ? 'curator@theunseen.art or username' : 'you@domain.com'}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#ff3b00] px-3 py-2.5 text-neutral-200 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase mb-1">
                USERNAME / ARCHIVIST ID
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. film_critic_99"
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#ff3b00] px-3 py-2.5 text-neutral-200 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-[10px] text-neutral-500 uppercase mb-1">
              PASSWORD
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-[#ff3b00] px-3 py-2.5 text-neutral-200 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#ff3b00] text-black font-bold uppercase tracking-wider border border-[#ff3b00] hover:bg-white transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            <span>{mode === 'login' ? 'ENTER ARCHIVE' : 'CREATE ACCOUNT'}</span>
          </button>
        </form>

        {/* Demo Fast Login Trigger */}
        <div className="mt-6 pt-4 border-t border-neutral-900 flex items-center justify-between font-mono-code text-[11px]">
          <span className="text-neutral-500">
            {mode === 'login' ? "Don't have an account?" : "Already registered?"}
          </span>
          <button
            onClick={() => {
              setError(null);
              setMode(mode === 'login' ? 'register' : 'login');
            }}
            className="text-[#ff3b00] hover:underline uppercase font-bold"
          >
            {mode === 'login' ? 'REGISTER NOW' : 'SIGN IN INSTEAD'}
          </button>
        </div>

      </div>
    </div>
  );
};
