require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./authController');

const app = express();

app.use(express.json());
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public')));

app.use('/', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));