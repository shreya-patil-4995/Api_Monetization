const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing signup...');
    
    // Test signup
    const signupResponse = await axios.post('http://localhost:3001/api/auth/signup', {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'consumer'
    });
    
    console.log('Signup successful:', signupResponse.data);
    const token = signupResponse.data.token;
    
    console.log('\nTesting login...');
    
    // Test login
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    
    console.log('Login successful:', loginResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAuth();
