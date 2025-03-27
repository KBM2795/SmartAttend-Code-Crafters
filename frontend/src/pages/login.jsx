import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from "../context/authContext";
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', { email, password }

      );

      if (response.status === 200) {
        console.log('Login successful:', response.data);
        login(response.data.user, response.data.token);
        localStorage.setItem("token", response.data.token);
        if (response.data.user.role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/student-dashboard");
        } // Redirect to dashboard on success
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">
            Smart<span className="text-green-500">Attend</span>
          </h1>
          <p className="text-gray-400 mt-2">Enter your credentials to sign in</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="email" className="sr-only">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m@example.com"
              className="w-full px-4 py-3 bg-gray-800 text-white 
                         rounded-lg border border-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input 
              type="password" 
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-3 bg-gray-800 text-white 
                         rounded-lg border border-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
            <div className="text-right mt-2">
              <a href="#" className="text-green-500 text-sm hover:underline">
                Forgot password?
              </a>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-green-500 text-black 
                       font-semibold rounded-lg hover:bg-green-600 
                       transition duration-300 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
          
          <div className="text-center">
            <span className="text-gray-400">
              Don't have an account? 
              <a href="/register" className="text-green-500 ml-1 hover:underline">
                Sign up
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;