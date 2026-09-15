import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, User, Mail, Lock, Building, Briefcase } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    industry: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-sponsor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.token) localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        alert('Registration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error registering');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="glass p-8 rounded-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-purple-500/20 rounded-full text-purple-400">
            <UserPlus size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center mb-8">Register Sponsor</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text" name="name" required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                value={formData.name} onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="email" name="email" required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                value={formData.email} onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="password" name="password" required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                value={formData.password} onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Company Name</label>
            <div className="relative">
              <Building className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text" name="companyName" required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                value={formData.companyName} onChange={handleChange}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-slate-300">Industry</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 text-slate-400" size={20} />
              <input
                type="text" name="industry" required
                className="w-full bg-slate-950/50 border border-slate-800 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                value={formData.industry} onChange={handleChange}
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg transition-colors mt-6 shadow-lg shadow-purple-500/30"
          >
            Create Account
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-purple-400 hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
