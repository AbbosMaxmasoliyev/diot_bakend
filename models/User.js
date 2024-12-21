const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: false
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    profilePicture: {
        type: String, // URL to the profile picture
        required: false
    },
    role: {
        type: String,
        enum: ["ceo", "admin", "seller"]
    },
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);


// CRUD operations

// Create a new user
async function createUser(data) {
    const user = new User(data);
    return await user.save();
}

// Read user by ID
async function getUserById(userId) {
    return await User.findById(userId);
}

// Read all users
async function getAllUsers() {
    return await User.find();
}

// Update user by ID
async function updateUser(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
}

// Delete user by ID
async function deleteUser(userId) {
    return await User.findByIdAndDelete(userId);
}

// Export CRUD functions
module.exports = {
    createUser,
    getUserById,
    getAllUsers,
    updateUser,
    deleteUser,
    User
};


