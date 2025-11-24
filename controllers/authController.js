const UserAccount = require('../models/UserAccount');
const tokenUtils = require('../utils/tokenUtils');

// POST /api/send-otp
exports.sendOtp = async (req, res) => {
    try {
        const { mobile_no } = req.body || {};

        if (!mobile_no) {
            return res.status(400).json({ error: 'Mobile number is required' });
        }

        // Logic to send OTP would go here (e.g., integration with SMS provider)
        // For now, we just simulate success as per requirements

        console.log(`OTP request received for mobile: ${mobile_no}`);

        return res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error in sendOtp:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/validate-otp
exports.validateOtp = async (req, res) => {
    try {
        const { mobile_no, otp } = req.body;

        if (!mobile_no || !otp) {
            return res.status(400).json({ error: 'Mobile number and OTP are required' });
        }

        // Hardcoded OTP validation
        if (otp !== '123456') {
            return res.status(400).json({ error: 'Invalid OTP' });
        }

        // Find user by mobile number
        const user = await UserAccount.findOne({ where: { mobile: mobile_no } });

        if (!user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Generate Tokens
        const accessToken = tokenUtils.generateAccessToken(user);
        const refreshToken = tokenUtils.generateRefreshToken(user);

        // Save Refresh Token to DB
        user.refresh_token = refreshToken;
        await user.save();

        // Return user details, roles, and tokens
        return res.status(200).json({
            message: 'OTP validated successfully',
            data: {
                user_account: user,
                role: user.roles,
                accessToken,
                refreshToken
            }
        });

    } catch (error) {
        console.error('Error in validateOtp:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/refresh-token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh Token is required' });
        }

        // Verify Refresh Token
        const decoded = tokenUtils.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(403).json({ error: 'Invalid or expired Refresh Token' });
        }

        // Find user and check if refresh token matches
        const user = await UserAccount.findByPk(decoded.id);
        if (!user || user.refresh_token !== refreshToken) {
            return res.status(403).json({ error: 'Invalid Refresh Token' });
        }

        // Generate new Access Token
        const newAccessToken = tokenUtils.generateAccessToken(user);

        return res.status(200).json({
            accessToken: newAccessToken
        });

    } catch (error) {
        console.error('Error in refreshToken:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};
