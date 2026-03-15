import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for existing session
        const storedUser = localStorage.getItem('opportunity_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        // In a real app, you'd validate against backend here
        // For now, we simulate a login and persist simple user data
        // If userData is null, we generate a random ID for "Guest"
        const newUser = userData || {
            id: `user-${Date.now()}`,
            name: 'Guest User',
            email: 'guest@example.com'
        };

        setUser(newUser);
        localStorage.setItem('opportunity_user', JSON.stringify(newUser));
        return newUser;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('opportunity_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
