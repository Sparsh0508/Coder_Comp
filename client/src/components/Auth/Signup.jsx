import React, { useState } from 'react';
import { Mail, Lock, User, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const data = await register(username, email, password);
            setSuccess('Account created successfully!');
            setTimeout(() => {
                if (data.user.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/dashboard');
                }
            }, 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-40px)] px-4">
            <motion.div
                className="backdrop-blur-xl border border-white/10 bg-[#121218]/85 rounded-3xl p-12 w-full max-w-[450px] shadow-2xl relative transition-transform duration-300 hover:-translate-y-1.5"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-4xl font-bold mb-2 text-center bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] bg-clip-text text-transparent">
                    Create Account
                </h1>
                <p className="text-[#a0a0b0] text-center mb-8 text-lg">Join the competition today</p>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                        <CheckCircle size={18} />
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-[#a0a0b0]">Username</label>
                        <div className="relative">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#606070]" size={20} />
                            <input
                                type="text"
                                className="w-full bg-[#1e1e28]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-base transition-all focus:border-[#3a7bd5] focus:ring-4 focus:ring-[#3a7bd5]/20 bg-slate-800/20 backdrop-blur-sm outline-none"
                                placeholder="TheBestCoder"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-[#a0a0b0]">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#606070]" size={20} />
                            <input
                                type="email"
                                className="w-full bg-[#1e1e28]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-base transition-all focus:border-[#3a7bd5] focus:ring-4 focus:ring-[#3a7bd5]/20 bg-slate-800/20 backdrop-blur-sm outline-none"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block mb-2 text-sm font-medium text-[#a0a0b0]">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#606070]" size={20} />
                            <input
                                type="password"
                                className="w-full bg-[#1e1e28]/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-base transition-all focus:border-[#3a7bd5] focus:ring-4 focus:ring-[#3a7bd5]/20 bg-slate-800/20 backdrop-blur-sm outline-none"
                                placeholder="••••••••"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full py-3.5 rounded-xl border-none bg-gradient-to-br from-[#00d2ff] to-[#3a7bd5] text-white text-base font-semibold cursor-pointer transition-all hover:brightness-110 hover:-translate-y-0.5 mt-2 shadow-[0_10px_15px_-3px_rgba(58,123,213,0.4)] hover:shadow-[0_20px_25px_-5px_rgba(58,123,213,0.5)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                        disabled={loading}
                    >
                        {loading ? 'Creating account...' : (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <UserPlus size={20} />
                                Get Started
                            </span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-[#a0a0b0] text-sm">
                    Already have an account?
                    <Link to="/login" className="text-[#3a7bd5] font-semibold ml-1 transition-colors hover:text-[#00d2ff] hover:underline">Log In</Link>
                </div>
            </motion.div>
        </div>
    );
};

export default Signup;
