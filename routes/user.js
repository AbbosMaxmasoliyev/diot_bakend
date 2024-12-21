const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const jwt = require('jsonwebtoken');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Create a new user
router.post('/users', async (req, res) => {
    try {
        const { username, password, phoneNumber, dateOfBirth, profilePicture, role } = req.body;

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword,
            phoneNumber,
            dateOfBirth,
            profilePicture,
            role
        });

        const savedUser = await newUser.save();
        res.status(201).json(savedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Read all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Read user by ID
router.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user by ID
router.put('/users/:id', async (req, res) => {
    try {
        const { password, ...updateData } = req.body;

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Delete user by ID
router.delete('/users/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});





const JWT_SECRET = 'salom124'; // Replace with an environment variable in production

// Helper function to hash roles
function hashRole(role) {
    return bcrypt.hashSync(role, 10);
}


// Middleware to verify roles
function authorizeRoles(allowedRoles) {
    return (req, res, next) => {
        const { role } = req.user; // Assuming the user info is attached to req.user
        if (!allowedRoles.includes(role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next(); // Proceed if the role is allowed
    };
}

// Sign up route
router.post('/signup', async (req, res) => {
    try {
        const { username, password, phoneNumber, dateOfBirth, profilePicture, role } = req.body;

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
            phoneNumber,
            dateOfBirth,
            profilePicture,
            role
        });

        // Save the user to the database
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Login route
router.post('/login', async (req, res) => {
    console.log(req.body);

    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if the password is valid
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Example of a protected route with role-based authorization
router.get('/protected', authenticateUser(), authorizeRoles(['admin', 'ceo']), (req, res) => {
    res.status(200).json({ message: 'Welcome to the protected route!', user: req.user });
});

// Token validation route
router.get('/validate-token', authenticateUser(), (req, res) => {
    res.status(200).json({
        message: 'Token is valid',
        user: {
            id: req.user.id,
            role: req.user.role
        }
    });
});
router.get('/profile', authenticateUser(), async (req, res) => {
    try {
        const userId = req.user.id; // Assuming the decoded token contains the user's ID

        // Fetch user data from the database using the user ID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the user profile data
        res.json({
            username: user.username,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            dateOfBirth: user.dateOfBirth,
            profilePicture: user.profilePicture
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


module.exports = router;