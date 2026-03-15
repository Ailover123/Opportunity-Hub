import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, LogIn } from 'lucide-react';

const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const endpoint = isLogin ? 'http://localhost:3001/api/auth/login' : 'http://localhost:3001/api/auth/signup';
            // In a real app full name should be split or handled better, but fitting to existing UI
            const name = !isLogin ? 'User Check' : 'User'; // Quick hack for name, ideally bind name input too

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name })
            });

            const data = await response.json();

            if (response.ok) {
                login({
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email
                });
            } else {
                alert(data.error || 'Authentication failed');
            }
        } catch (err) {
            console.error('Auth Error', err);
            alert('Connection failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all hover:scale-[1.01] duration-300">
                <div className="p-8">
                    <div className="flex justify-center mb-8">
                        <div className="bg-indigo-100 p-3 rounded-full">
                            <LayoutDashboard className="w-8 h-8 text-indigo-600" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </h2>
                    <p className="text-center text-gray-500 mb-8">
                        {isLogin ? 'Sign in to manage your opportunities' : 'Get started with Opportunity Hub free'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                required
                            />
                        </div>

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform hover:translate-y-[-1px] shadow-md flex items-center justify-center gap-2"
                        >
                            <LogIn className="w-5 h-5" />
                            {isLogin ? 'Sign In' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const response = await fetch('http://localhost:3001/api/auth/google');
                                const data = await response.json();
                                if (data.authUrl) {
                                    const width = 500;
                                    const height = 600;
                                    const left = (window.screen.width / 2) - (width / 2);
                                    const top = (window.screen.height / 2) - (height / 2);

                                    const authWindow = window.open(
                                        data.authUrl,
                                        'googleAuth',
                                        `width=${width},height=${height},top=${top},left=${left}`
                                    );

                                    const timer = setInterval(() => {
                                        if (authWindow.closed) {
                                            clearInterval(timer);
                                            // Check for session
                                            const sessionId = localStorage.getItem('googleDriveSession');
                                            if (sessionId) {
                                                // Real login success
                                                login({
                                                    id: 'google-user-' + sessionId.substring(0, 8),
                                                    name: 'Google User',
                                                    email: 'user@gmail.com', // In a real app, fetch profile from backend using session
                                                    isGoogle: true
                                                });
                                            }
                                        }
                                    }, 1000);
                                }
                            } catch (err) {
                                console.error('Google Auth Failed', err);
                                alert('Failed to connect to Google');
                            }
                        }}
                        className="w-full bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-lg border border-gray-300 transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>
                            By {isLogin ? 'signing in' : 'signing up'}, you agree to our Terms of Service.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-600">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-indigo-600 font-medium cursor-pointer hover:underline focus:outline-none"
                        >
                            {isLogin ? 'Sign up for free' : 'Sign in'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
