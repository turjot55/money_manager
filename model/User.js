// const mongoose = require('mongoose');

// const userSchema = new mongoose.Schema({
//   username: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
// });

// module.exports = mongoose.model('User', userSchema);


const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true }, // ✅ Add this
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // ✅ Email verification flag
  verificationToken: String,
});

module.exports = mongoose.model('User', userSchema);

