import React, { useState } from 'react';
import { User } from '../types';
import { Lock } from 'lucide-react';

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNumClick = (num: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!selectedUser) return;
    if (selectedUser.pin === pin) {
      onLogin(selectedUser);
    } else {
      setError('PIN Incorreto');
      setPin('');
    }
  };

  if (!selectedUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">AuditPro 360</h1>
          <p className="text-center text-gray-500 mb-6">Selecione o seu utilizador</p>
          <div className="grid grid-cols-2 gap-4">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex flex-col items-center p-4 border rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all"
              >
                <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mb-2">
                  <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                </div>
                <span className="font-semibold text-gray-700">{u.name}</span>
                <span className="text-xs text-gray-500">{u.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
        <button onClick={() => { setSelectedUser(null); setPin(''); }} className="text-sm text-gray-500 mb-4 hover:underline">
          &larr; Voltar
        </button>
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-2">
            <img src={selectedUser.avatar} alt={selectedUser.name} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">{selectedUser.name}</h2>
          <p className="text-sm text-gray-500">Introduza o PIN de 6 dígitos</p>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border ${i < pin.length ? 'bg-blue-600 border-blue-600' : 'bg-transparent border-gray-300'}`} />
          ))}
        </div>

        {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

        <div className="grid grid-cols-3 gap-4 mb-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleNumClick(num.toString())}
              className="w-full h-14 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              {num}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleNumClick('0')}
            className="w-full h-14 rounded-full bg-gray-50 text-xl font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-full h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            ⌫
          </button>
        </div>

        <button
          onClick={handleSubmit}
          disabled={pin.length !== 6}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Entrar
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;