const authService = require('../services/authService');

class AuthController {
    async register(req, res) {
        try {
            console.log('Register request body:', req.body);
            const { token, user } = await authService.register(req.body);
            console.log('Registration successful, token generated');
            res.status(201).json({ success: true, token, user });
        } catch (error) {
            console.error('Registration error:', error.message);
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            console.log('Login request:', { email, passwordProvided: !!password });
            
            if (!email || !password) {
                return res.status(400).json({ success: false, message: 'Please provide email and password' });
            }

            const { token, user } = await authService.login(email, password);
            console.log('Login successful, token generated');
            res.status(200).json({ success: true, token, user });
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(401).json({ success: false, message: error.message });
        }
    }
}

module.exports = new AuthController();
