import React, { useState } from 'react';
import { authAPI } from '../services/api';

const TestAPI: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    try {
      const response = await authAPI.register({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'password123',
        role: 'consumer'
      });
      setResult('Signup successful: ' + JSON.stringify(response.data));
    } catch (error: any) {
      setResult('Signup error: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await authAPI.login({
        email: 'test@example.com',
        password: 'password123'
      });
      setResult('Login successful: ' + JSON.stringify(response.data));
    } catch (error: any) {
      setResult('Login error: ' + JSON.stringify(error.response?.data || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">API Test</h2>
      <div className="space-x-4 mb-4">
        <button
          onClick={testSignup}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Signup
        </button>
        <button
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
      </div>
      {loading && <p className="text-blue-600">Loading...</p>}
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre className="text-sm">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default TestAPI;
