const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const userRoutes = require('./user');

const app = express();
app.use(express.json());
app.use('/api', userRoutes);

const JWT_SECRET = 'your_secret_key';

jest.mock('../models/User', () => ({
    User: {
        create: jest.fn()
    }
}));

describe('User Routes', () => {
    afterEach(() => {
        jest.clearAllMocks(); // Har bir testdan keyin mocklarni tozalash
    });

    describe('POST /signup', () => {
        it('should create a new user successfully', async () => {
            const mockUser = {
                username: 'testuser',
                password: await bcrypt.hash('password123', 10),
                phoneNumber: '123456789',
                dateOfBirth: '1990-01-01',
                profilePicture: 'url_to_picture',
                role: 'admin'
            };

            // User.create metodini mock qilish
            User.create = jest.fn().mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: 'testuser',
                    password: 'password123',
                    phoneNumber: '123456789',
                    dateOfBirth: '1990-01-01',
                    profilePicture: 'url_to_picture',
                    role: 'admin'
                });
            console.log(res.body);
            
            expect(res.status).toBe(201); // 201 holati (muvaffaqiyatli yaratilgan)
            expect(res.body.message).toBe('User created successfully'); // Xabarni tekshirish
            expect(User.create).toHaveBeenCalledTimes(1); // create metodining faolligini tekshirish
        }, 10000);

        it('should return 500 if there is a server error', async () => {
            User.create = jest.fn().mockRejectedValue(new Error('Database error')); // Server xatolikni simulyatsiya qilish

            const res = await request(app)
                .post('/api/signup')
                .send({
                    username: 'testuser',
                    password: 'password123',
                    phoneNumber: '123456789',
                    dateOfBirth: '1990-01-01',
                    profilePicture: 'url_to_picture',
                    role: 'admin'
                });

            expect(res.status).toBe(500); // 500 holati (server xatolik)
            expect(res.body.message).toBe('Database error'); // Xatolik xabarini tekshirish
        }, 10000);
    });

    describe('POST /login', () => {
        it('should login the user and return a token', async () => {
            const mockUser = {
                _id: '1234567890abcdef',
                username: 'testuser',
                password: await bcrypt.hash('password123', 10),
                role: 'admin'
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser); // Foydalanuvchini topish

            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'password123' // To'g'ri parol
                });
            console.log(res.body);


            expect(res.status).toBe(200); // 200 holati (muvaffaqiyatli login)
            expect(res.body.token).toBeDefined(); // Token qaytarilganligini tekshirish
            expect(User.findOne).toHaveBeenCalledWith({ username: 'testuser' }); // Foydalanuvchi tekshirildi
        }, 10000);

        it('should return 404 if user is not found', async () => {
            User.findOne = jest.fn().mockResolvedValue(null); // Foydalanuvchi topilmasa

            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'nonexistent', // Foydalanuvchi mavjud emas
                    password: 'password123'
                });

            expect(res.status).toBe(404); // 404 holati (foydalanuvchi topilmadi)
            expect(res.body.message).toBe('User not found'); // Xabarni tekshirish
        }, 10000);

        it('should return 401 if password is incorrect', async () => {
            const mockUser = {
                _id: '1234567890abcdef',
                username: 'testuser',
                password: await bcrypt.hash('password123', 10),
                role: 'admin'
            };

            User.findOne = jest.fn().mockResolvedValue(mockUser); // Foydalanuvchi topilsa

            const res = await request(app)
                .post('/api/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword' // Xato parol
                });

            expect(res.status).toBe(401); // 401 holati (notog'ri parol)
            expect(res.body.message).toBe('Invalid credentials'); // Xabarni tekshirish
        }, 10000);
    });
});
