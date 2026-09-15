import { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.user.role);
            
            if(res.data.user.role === 'ADMIN' || res.data.user.role === 'SUPERADMIN') {
                setError('Admins must log in through the Admin Portal.');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[70vh]">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass p-8 rounded-2xl w-full max-w-md"
            >
                <h2 className="text-3xl font-bold mb-2 text-center capitalize">User Login</h2>
                <p className="text-center text-muted-foreground mb-6">Welcome back!</p>
                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded-lg mb-4 text-center font-medium">{error}</div>}
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                        <input 
                            type="email" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            value={email} onChange={e => setEmail(e.target.value)} required 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
                        <input 
                            type="password" 
                            className="w-full bg-input border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition"
                            value={password} onChange={e => setPassword(e.target.value)} required 
                        />
                    </div>
                    <button type="submit" className="w-full bg-primary text-white rounded-lg px-4 py-3 font-semibold hover:bg-primary/90 transition shadow-lg shadow-primary/20">
                        Login
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
