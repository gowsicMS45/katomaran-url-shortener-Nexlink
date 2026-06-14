const User = require('../models/User');
const jwt = require('jsonwebtoken');
const validator = require('validator');

// Helper function to generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please enter all fields');
    }

    if (!validator.isEmail(email)) {
      res.status(400);
      throw new Error('Please enter a valid email address');
    }

    if (password.length < 6) {
      res.status(400);
      throw new Error('Password must be at least 6 characters');
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      throw new Error('User already exists with this email');
    }

    // Create user (pre-save hook hashes password)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      name,
      email,
      password,
      verificationCode,
      verificationExpires,
    });

    console.log(`[VERIFICATION CODE LOG] Email: ${email} | Code: ${verificationCode}`);

    // Send verification email using the emailService (supports real SMTP or console fallback)
    const { sendEmail } = require('../utils/emailService');
    sendEmail({
      to: email,
      subject: 'Verify your NexLink Email Address',
      text: `Hello ${name},\n\nYour 6-digit verification code is: ${verificationCode}\n\nPlease enter this code in the console to verify your account.\n\nThank you,\nThe NexLink Team`,
      html: `<p>Hello <strong>${name}</strong>,</p><p>Your 6-digit verification code is: <strong style="font-size: 18px; color: #7c3aed;">${verificationCode}</strong></p><p>Please enter this code in the console to verify your account.</p><p>Thank you,<br/>The NexLink Team</p>`
    }).catch(err => console.error(`[EMAIL ERROR] Failed to send email: ${err.message}`));

    if (user) {
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
        },
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      res.status(400);
      throw new Error('Please enter email and password');
    }

    // Check for user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    // req.user is populated by protect middleware
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile and settings
 * @route   PUT /api/auth/settings
 * @access  Private
 */
const updateSettings = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const { name, email, password, preferences } = req.body;

    // Update name if provided
    if (name !== undefined) {
      if (!name.trim()) {
        res.status(400);
        throw new Error('Name cannot be empty');
      }
      user.name = name;
    }

    // Update email if provided
    if (email !== undefined) {
      if (!validator.isEmail(email)) {
        res.status(400);
        throw new Error('Please enter a valid email address');
      }
      // Check if email already in use
      if (email.toLowerCase() !== user.email.toLowerCase()) {
        const emailExists = await User.findOne({ email: email.toLowerCase() });
        if (emailExists) {
          res.status(400);
          throw new Error('Email is already in use by another account');
        }
        user.email = email.toLowerCase();
      }
    }

    // Update password if provided
    if (password !== undefined && password.trim() !== '') {
      if (password.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters long');
      }
      user.password = password;
    }

    // Update preferences if provided
    if (preferences !== undefined && typeof preferences === 'object') {
      Object.keys(preferences).forEach((key) => {
        user.preferences[key] = preferences[key];
      });
      user.markModified('preferences');
    }

    await user.save();

    // Exclude password from the response
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset code
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400);
      throw new Error('Please enter email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success to prevent user enumeration
    const successResponse = {
      success: true,
      message: 'If an account exists with that email, a password reset code has been sent.',
    };

    if (!user) {
      console.log(`[PASSWORD RESET REQUEST] Requested email: ${email} (User not found, simulating success response)`);
      return res.status(200).json(successResponse);
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const crypto = require('crypto');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await user.save();
    console.log(`[PASSWORD RESET LOG] Email: ${email} | Code: ${resetCode}`);

    // Send password reset email using the emailService (supports real SMTP or console fallback)
    const { sendEmail } = require('../utils/emailService');
    sendEmail({
      to: email,
      subject: 'Reset your NexLink Password',
      text: `Hello ${user.name},\n\nYour 6-digit password reset code is: ${resetCode}\n\nPlease enter this code to reset your password. This code will expire in 15 minutes.\n\nThank you,\nThe NexLink Team`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your 6-digit password reset code is: <strong style="font-size: 18px; color: #7c3aed;">${resetCode}</strong></p><p>Please enter this code to reset your password. This code will expire in 15 minutes.</p><p>Thank you,<br/>The NexLink Team</p>`
    }).catch(err => console.error(`[EMAIL ERROR] Failed to send email: ${err.message}`));

    res.status(200).json(successResponse);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using code
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, code, password } = req.body;
    if (!email || !code || !password) {
      res.status(400);
      throw new Error('Please enter email, code, and new password');
    }

    // Enforce strong password rules (min length 8, mixed character types)
    const isStrongPassword = (pass) => {
      if (pass.length < 8) return false;
      const hasUpperCase = /[A-Z]/.test(pass);
      const hasLowerCase = /[a-z]/.test(pass);
      const hasDigit = /[0-9]/.test(pass);
      const hasSpecial = /[^A-Za-z0-9]/.test(pass);
      return hasUpperCase && hasLowerCase && hasDigit && hasSpecial;
    };

    if (!isStrongPassword(password)) {
      res.status(400);
      throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    }

    const crypto = require('crypto');
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired reset code');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // Send confirmation email
    const { sendEmail } = require('../utils/emailService');
    sendEmail({
      to: user.email,
      subject: 'Your NexLink Password Has Been Changed',
      text: `Hello ${user.name},\n\nThis is a confirmation that the password for your NexLink account has been successfully changed.\n\nIf you did not make this change, please contact support immediately.\n\nThank you,\nThe NexLink Team`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>This is a confirmation that the password for your NexLink account has been successfully changed.</p><p>If you did not make this change, please contact support immediately.</p><p>Thank you,<br/>The NexLink Team</p>`
    }).catch(err => console.error(`[EMAIL ERROR] Failed to send password change confirmation email: ${err.message}`));

    res.status(200).json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify email address
 * @route   POST /api/auth/verify-email
 * @access  Private
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400);
      throw new Error('Please enter the 6-digit verification code');
    }

    const user = await User.findOne({
      _id: req.user._id,
      verificationCode: code,
      verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired verification code');
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Resend verification code
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified',
      });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = verificationCode;
    user.verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await user.save();
    console.log(`[VERIFICATION CODE RESEND LOG] Email: ${user.email} | Code: ${verificationCode}`);

    // Send verification email using the emailService (supports real SMTP or console fallback)
    const { sendEmail } = require('../utils/emailService');
    sendEmail({
      to: user.email,
      subject: 'Verify your NexLink Email Address',
      text: `Hello ${user.name},\n\nYour new 6-digit verification code is: ${verificationCode}\n\nPlease enter this code to verify your account.\n\nThank you,\nThe NexLink Team`,
      html: `<p>Hello <strong>${user.name}</strong>,</p><p>Your new 6-digit verification code is: <strong style="font-size: 18px; color: #7c3aed;">${verificationCode}</strong></p><p>Please enter this code to verify your account.</p><p>Thank you,<br/>The NexLink Team</p>`
    }).catch(err => console.error(`[EMAIL ERROR] Failed to send email: ${err.message}`));

    res.status(200).json({
      success: true,
      message: 'Verification code resent successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  updateSettings,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
};
