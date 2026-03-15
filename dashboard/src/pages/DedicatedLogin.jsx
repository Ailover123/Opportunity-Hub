import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import axios from '../utils/api';



const LoginPage = () => {
    const { login } = useUser();
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const { addNotification } = useNotification();


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isLogin) {
                console.log('[Frontend] Submitting login for:', email);
                await login(email, password);
                navigate('/dashboard');
            } else {
                console.log('[Frontend] Submitting signup for:', email);
                const { data } = await axios.post('/api/auth/signup', { email, password, name });
                if (data.success) {
                    addNotification('Account created successfully! Logging you in...', 'success');
                    // AUTO LOGIN
                    await login(email, password);
                    navigate('/dashboard');
                }
            }

        } catch (err) {
            console.error('[Frontend] Auth failed:', err);
            const errorMsg = err.response?.data?.error || err.message || 'Unknown error';
            addNotification('Operation failed: ' + errorMsg, 'error');
        } finally {

            setLoading(false);
        }
    };

    return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
            <div className="card" style={{ width: 400, padding: '2.5rem' }}>
                <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontWeight: 700 }}>
                    {isLogin ? 'Welcome Back' : 'Get Started'}
                </h1>
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem', fontSize: '0.875rem' }}>
                    {isLogin ? 'Sign in to your professional console' : 'Create your free account today'}
                </p>

                <form onSubmit={handleSubmit}>
                    {!isLogin && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Full Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-light)' }}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Email Address</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-light)' }}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            style={{ width: '100%', padding: '0.75rem', borderRadius: 6, border: '1px solid var(--border-light)' }}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <span
                        style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Sign up' : 'Sign in'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
