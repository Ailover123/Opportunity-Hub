import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/api';

const UserContext = createContext();


export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data } = await axios.get('/api/auth/session');
            setUser(data.user);
        } catch (err) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };


    const login = async (email, password) => {
        const { data } = await axios.post('/api/auth/login', { email, password });
        setUser(data.user);
        return data.user;
    };

    const logout = async () => {
        await axios.post('/api/auth/logout');
        setUser(null);
    };

    return (
        <UserContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
