"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '../UserContext';
import { User } from '../types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF } from '@fortawesome/free-brands-svg-icons';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons';

interface AdminLoginProps {
    setLoggedInAdmin: React.Dispatch<React.SetStateAction<string | null>>;
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ setLoggedInAdmin, setUsers }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [redirecting, setRedirecting] = useState(false);
    const { fetchAdminData, loginWithToken, loading, setLoading } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // If already logged in, redirect away from login page
        if (localStorage.getItem("adminToken")) {
            setRedirecting(true);
            setLoading(false);
            router.push('/secure/myaccount/tickets');
            return;
        }
        // Check for token in URL parameters
        const token = searchParams.get('token');
        if (token) {
            // Attempt to login with token
            loginWithToken(token).then(success => {
                setLoading(false);
                if (success) {
                    setRedirecting(true);
                    // Redirect to tickets page after successful token login
                    router.push('/secure/myaccount/tickets');
                } else {
                    setErrorMessage("Invalid or expired token. Please login manually.");
                }
            });
        } else {
            setLoading(false);
        }
    }, [searchParams, loginWithToken, router, setLoading]);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setErrorMessage(null);

        if (!username || !password) {
            setErrorMessage("Please enter both username and password.");
            return;
        }

        setLoading(true);
        try {
            const success = await fetchAdminData(username, password);

            if (success) {
                setRedirecting(true);
                setLoggedInAdmin(username);
                router.push('/secure/myaccount/tickets');
            } else {
                setErrorMessage("Invalid username or password. Please try again.");
                setPassword("");
            }
        } catch (error) {
            console.error('Error logging in:', error);
            setErrorMessage("An unexpected error occurred. Please try again.");
            setPassword("");
        } finally {
            setLoading(false);
        }
    };

    if (redirecting) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e6f4ff] to-[#f0f9ff] px-4 py-12">
            <div className="max-w-[440px] w-full bg-white rounded-[8px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10">
                {/* Logo Section */}
                <div className="flex justify-center mb-8">
                    <img src="/logo.png" alt="viagogo logo" className="h-[32px] w-auto" />
                </div>

                <h2 className="text-[24px] font-bold text-[#001B41] mb-6 text-center">Sign In</h2>

                {errorMessage && (
                    <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm mb-6 border border-red-100 animate-pulse">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest ml-1">Username</label>
                        <input
                            type="text"
                            placeholder="Enter username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-4 bg-[#f8f9fa] border-2 border-transparent rounded-[8px] outline-none focus:border-[#89CF28] transition-all text-[15px] font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[12px] font-bold text-gray-500 uppercase tracking-widest ml-1">Password</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-4 bg-[#f8f9fa] border-2 border-transparent rounded-[8px] outline-none focus:border-[#89CF28] transition-all text-[15px] font-medium"
                            required
                        />
                    </div>

                        <button
                        type="submit"
                        className="w-full bg-[#89CF28] text-white py-4 rounded-[8px] font-black text-lg hover:opacity-90 transition-all shadow-lg active:scale-[0.98] mt-4"
                        disabled={loading}
                    >
                        {loading ? 'SIGNING IN...' : 'SIGN IN'}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                    <div className="relative flex justify-center text-[11px] uppercase tracking-widest font-black text-gray-300 bg-white px-4">OR</div>
                </div>

                <button className="w-full bg-[#4267B2] text-white py-4 rounded-[8px] font-black text-lg hover:bg-[#365899] transition-all flex items-center justify-center shadow-md">
                    <FontAwesomeIcon icon={faFacebookF} className="mr-3" />
                    Log In with Facebook
                </button>

                <div className="mt-10 text-center">
                    <p className="text-sm text-gray-400 font-medium">
                        New to Viagogo? <button className="text-[#89CF28] font-bold hover:underline">Create an account</button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;