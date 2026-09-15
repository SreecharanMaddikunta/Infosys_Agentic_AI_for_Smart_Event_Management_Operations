import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', college: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...formData, role: 'ADMIN' };
            const res = await axios.post('http://localhost:5000/api/auth/register', payload);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            navigate('/admin-dashboard');
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
                <h2 className="text-3xl font-bold mb-2 text-center capitalize">Admin Sign Up</h2>
                <p className="text-center text-muted-foreground mb-6">Create an organizer account</p>
                {error && <div className="bg-destructive/20 text-destructive-foreground p-3 rounded-lg mb-4 text-center">{error}</div>}
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
                        <label className="block text-sm font-medium text-muted-foreground mb-1">College</label>
                        <input 
                            type="text" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            onChange={e => setFormData({...formData, college: e.target.value})} required 
                        />
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
