const User = require('../models/User');
const jwt = require('jsonwebtoken');

class AuthService {
    async register(userData) {
        const { name, email, password, role } = userData;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role
        });

        return {
            token: this.generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    async login(email, password) {
        console.log('Attempting login for email:', email);
        const user = await User.findOne({ email }).select('+password');
        console.log('User found:', !!user);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }

        console.log('Comparing passwords...');
        const isMatch = await user.matchPassword(password);
        console.log('Password match result:', isMatch);
        
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        return {
            token: this.generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
    }

    generateToken(id) {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });
    }
}

module.exports = new AuthService();
