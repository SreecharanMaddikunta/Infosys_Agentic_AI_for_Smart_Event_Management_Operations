import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', college: '', category: 'Student', gender: 'Prefer not to say' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role: 'USER' };
            const res = await axios.post('http://localhost:5000/api/auth/register', payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            navigate('/student-dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[70vh]">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl w-full max-w-md mt-10"
            >
                <h2 className="text-3xl font-bold mb-2 text-center capitalize">User Sign Up</h2>
                <p className="text-center text-muted-foreground mb-6">Create your account</p>
                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-center font-medium">{error}</div>}
                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Full Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, name: e.target.value})} required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, email: e.target.value})} required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Phone</label>
                        <input 
                            type="text" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, phone: e.target.value})} required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">College / Organization</label>
                        <input 
                            type="text" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, college: e.target.value})} required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                            <select 
                                className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                <option value="Student">Student</option>
                                <option value="Working Professional">Working Professional</option>
                                <option value="VIP">VIP</option>
                                <option value="Sponsor">Sponsor</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted-foreground mb-1">Gender</label>
                            <select 
                                className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                                value={formData.gender}
                                onChange={e => setFormData({...formData, gender: e.target.value})}
                            >
                                <option value="Prefer not to say">Prefer not to say</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, password: e.target.value})} required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white rounded-lg px-4 py-3 font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20 mt-4">
                        Register
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
