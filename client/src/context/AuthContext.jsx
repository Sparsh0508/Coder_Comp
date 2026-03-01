import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const checkUserStatus = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    // You might have a /profile or /me endpoint
                    const response = await api.get('/auth/profile');
                    setUser(response.data.user);
                } catch (error) {
                    console.error("Session expired or invalid token", error);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };

        checkUserStatus();
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return response.data;
    };

    const register = async (username, email, password) => {
        const response = await api.post('/auth/register', { username, email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        setUser(user);
        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
