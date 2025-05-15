const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const router = express.Router();

const users = new Map();
const tokens = new Set();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const TOKEN_EXPIRATION = '1h';

// Налаштування nodemailer для відправки листів
const transporter = nodemailer.createTransport({
  service: 'Gmail', // або інший поштовий сервіс
  auth: {
    user: process.env.EMAIL_USER || 'turlokosta7@gmail.com',       // поміняй на свої дані
    pass: process.env.EMAIL_PASS || 'vvij mjzg zqoe fkgz',        // або використай змінні середовища
  },
});

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (users.has(email)) {
    return res.status(400).json({ message: 'User already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.set(email, { passwordHash, confirmed: false });

  // Генеруємо токен підтвердження (термін дії 1 день)
  const confirmToken = jwt.sign({ email }, JWT_SECRET, { expiresIn: '1d' });

  // Посилання для підтвердження
  const confirmUrl = `http://localhost:5000/confirm/${confirmToken}`;

  // Відправляємо листа з підтвердженням
  try {
    await transporter.sendMail({
      from: '"No Reply" <no-reply@example.com>',
      to: email,
      subject: 'Confirm your email',
      html: `<p>Будь ласка, підтвердіть свою електронну адресу, перейшовши за посиланням нижче:</p>
             <a href="${confirmUrl}">${confirmUrl}</a>`,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error sending confirmation email', error: error.toString() });
  }

  res.status(201).json({ message: 'User registered. Please check your email to confirm.' });
});

router.get('/confirm/:token', (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.get(decoded.email);
    if (!user) {
      return res.status(400).send('Invalid token or user does not exist.');
    }
    user.confirmed = true;
    res.send('Email confirmed successfully! You can now login.');
  } catch (err) {
    res.status(400).send('Invalid or expired confirmation token.');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.get(email);
  if (!user) return res.status(400).json({ message: 'Invalid credentials' });
  if (!user.confirmed) return res.status(400).json({ message: 'Email not confirmed' });

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRATION });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false,
    maxAge: 3600000,
  });

  res.json({ message: 'Logged in' });
});

router.get('/me', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (tokens.has(token)) return res.status(401).json({ message: 'Token revoked' });
    res.json({ email: decoded.email });
  } catch {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies.token;
  if (token) {
    tokens.add(token);
  }
  res.cookie('token', '', { maxAge: 0 });
  res.json({ message: 'Logged out' });
});

module.exports = router;