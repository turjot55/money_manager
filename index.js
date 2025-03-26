// ✅ Corrected and Cleaned Full Backend (index.js)

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Entry = require('./model/Entry');
const User = require('./model/User');
require('dotenv').config();
const app = express();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);





// const app = express();
// app.use(cors());
app.use(express.json());
// const corsOptions = {
//   origin: [
//     "http://localhost:3000",
//     "https://money-manager-ym1k.onrender.com", // if deployed later
//   ],
//   credentials: true,
// };


const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://moneymanagertooltest.netlify.app", // ✅ Add your Netlify domain here
  ],
  credentials: true,
  methods: ["GET", "POST", "DELETE", "PUT"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Preflight support




const JWT_SECRET = process.env.JWT_SECRET;

app.get("/", (req, res) => {
  res.send("Backend is live");
});


// ✅ Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/money-manager', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ Connected to MongoDB'))
// .catch((err) => console.error('❌ MongoDB connection error:', err));

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch((err) => console.error('❌ MongoDB connection error:', err));


// ✅ Middleware to verify JWT
// token
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access Denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid Token' });
    req.user = user;
    next();
  });
};

// ✅ Currency Conversion Route
app.get('/convert', async (req, res) => {
  try {
    const { from, to } = req.query;
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${from}`);
    res.json({ rate: response.data.rates[to] });
  } catch (error) {
    res.status(500).json({ error: 'Conversion failed' });
  }
});

// ✅ Auth Routes
// app.post('/auth/register', async (req, res) => {
//   const { username, password } = req.body;

//   const existing = await User.findOne({ username });
//   if (existing) return res.status(400).json({ error: 'Username taken' });

//   const hashed = await bcrypt.hash(password, 10);
//   const user = new User({ username, password: hashed });
//   await user.save();

//   res.json({ message: 'User registered' });
// });

// app.post('/auth/register', async (req, res) => {
//   const { username, password } = req.body;

//   try {
//     // ✅ Step 1: Check if 20 users already exist
//     const userCount = await User.countDocuments();
//     if (userCount >= 20) {
//       return res.status(403).json({ error: '❌ Registration closed. 20 users already registered.' });
//     }

//     // ✅ Step 2: Check if username is already taken
//     const existing = await User.findOne({ username });
//     if (existing) return res.status(400).json({ error: '❌ Username is already taken.' });

//     // ✅ Step 3: Register the new user
//     const hashed = await bcrypt.hash(password, 10);
//     const user = new User({ username, password: hashed });
//     await user.save();

//     const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
//     res.json({ token });
//   } catch (error) {
//     console.error('Registration failed:', error);
//     res.status(500).json({ error: '❌ Registration failed. Try again later.' });
//   }
// });

const crypto = require('crypto');
// const nodemailer = require('nodemailer');


// const transporter = nodemailer.createTransport({
//   service: "gmail", // or your SMTP provider
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });




app.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({ $or: [ { email }] });
  if (existing) return res.status(400).json({ error: " Email taken" });

  const hashed = await bcrypt.hash(password, 10);
  const verificationToken = require("crypto").randomBytes(32).toString("hex");

  const user = new User({ username, email, password: hashed, verificationToken });
  await user.save();

  try {
    const result = await resend.emails.send({
      from: `MoneyManager <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verify your email',
      html: `<p>Click <a href="http://localhost:3000/verify?token=${verificationToken}">here</a> to verify your email.</p>`,
    });

    console.log("📨 Email sent via Resend:", result); // ✅ this line logs the send result

    res.json({ message: "Registration successful! Please check your email to verify your account." });
  } catch (err) {
    console.error("❌ Error sending email via Resend:", err);
    res.status(500).json({ error: "Registration succeeded, but email failed to send." });
  }
});



app.post("/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user || user.isVerified) {
    return res.status(400).json({ error: "User already verified or not found" });
  }

  const newToken = crypto.randomBytes(32).toString("hex");
  user.verificationToken = newToken;
  await user.save();

  const verifyLink = `https://moneymanagertooltest.netlify.app/verify?token=${newToken}`;

  // ✅ Use Resend here instead of transporter.sendMail
  await resend.emails.send({
    from: `MoneyManager <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Resend: Verify your email',
    html: `<p>Please verify your email: <a href="${verifyLink}">Click Here</a></p>`,
  });

  res.json({ message: "Verification email resent" });
});





  

// app.get("/auth/verify-email", async (req, res) => {
//   const { token } = req.query;

//   const user = await User.findOne({ verificationToken: token });
//   if (!user) return res.status(400).json({ error: "Invalid or expired token" });

//   user.isVerified = true;
//   user.verificationToken = null;
//   await user.save();

//   res.json({ message: "Email verified successfully!" });
// });

app.get("/auth/verify-email", async (req, res) => {
  const { token } = req.query;

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) return res.status(400).json({ error: "Invalid or expired token" });

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error during verification." });
  }
});




// app.post('/auth/login', async (req, res) => {
//   const { username, password, email } = req.body;

//   const user = await User.findOne({ username });

//   if (!user) {
//     return res.status(400).json({ error: "Invalid credentials" });
//   }

//   if (user.email !== email) {
//     return res.status(400).json({ error: "Email does not match registered account" });
//   }

//   const isValid = await bcrypt.compare(password, user.password);
//   if (!isValid) {
//     return res.status(400).json({ error: "Invalid credentials" });
//   }

//   if (!user.isVerified) {
//     return res.status(403).json({ error: "Please verify your email before logging in." });
//   }

//   const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
//   res.json({ token });
// });

app.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (!user) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  if (!user.isVerified) {
    return res.status(403).json({ error: "Please verify your email before logging in." });
  }

  const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
  res.json({ token });
});



// ✅ Protected Entry Routes
app.get('/entries', authenticateToken, async (req, res) => {
  const entries = await Entry.find({ userId: req.user.id }).sort({ date: -1 });
  res.json(entries);
});

app.post('/entries', authenticateToken, async (req, res) => {
  const entry = new Entry({
    ...req.body,
    userId: req.user.id,
    date: req.body.date ? new Date(req.body.date) : new Date()
  });
  // const entry = new Entry({ ...req.body, userId: req.user.id });
  const saved = await entry.save();
  res.json(saved);
  
});



app.delete('/entries/:id', authenticateToken, async (req, res) => {
  await Entry.deleteOne({ _id: req.params.id, userId: req.user.id });
  res.json({ message: 'Deleted' });
});

// ✅ Start Server
const PORT = 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));