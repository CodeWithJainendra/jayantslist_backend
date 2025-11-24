const tokenUtils = require('../utils/tokenUtils');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access Token Required' });
    }

    const user = tokenUtils.verifyAccessToken(token);

    if (!user) {
        return res.status(403).json({ error: 'Invalid or Expired Access Token' });
    }

    req.user = user;
    next();
};

module.exports = authenticateToken;
