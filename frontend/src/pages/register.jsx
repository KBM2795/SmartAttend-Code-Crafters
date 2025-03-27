import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:3000/api/auth/register', { name, email, password });

      if (response.status === 201) {
        console.log('Registration successful:', response.data);
        navigate("/teacher-dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <p className="text-gray-400 mt-2">Create your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label htmlFor="name" className="sr-only">Name</label>
            <input 
              type="text" 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full px-4 py-3 bg-gray-800 text-white 
                         rounded-lg border border-gray-700 
                         focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
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
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 bg-green-500 text-black 
                       font-semibold rounded-lg hover:bg-green-600 
                       transition duration-300 ease-in-out"
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Sign Up'}
          </button>
          
          <div className="text-center">
            <span className="text-gray-400">
              Already have an account? 
              <a href="/login" className="text-green-500 ml-1 hover:underline">
                Sign in
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;