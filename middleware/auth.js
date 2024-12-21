const jwt = require("jsonwebtoken");
const JWT_SECRET = 'salom124'; // Replace with an environment variable in production

function authenticateUser() {
    return async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        try {
            const payload = jwt.verify(token, JWT_SECRET);
            req.user = { id: payload.id, role: payload.role };
            next(); // Proceed to the next middleware or route handler
        } catch (error) {
            return res.status(401).json({ message: 'Invalid token' });
        }
    };
}


module.exports = { authenticateUser }