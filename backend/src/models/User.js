const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = ['applicant', 'officer', 'inspector', 'admin'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'applicant', required: true },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    designation: { type: String },
    avatar: { type: String },
    state: { type: String },
    district: { type: String },
    isActive: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 }, // bumped to revoke all previously issued tokens
    mobileVerified: { type: Boolean, default: false },
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function setPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plainPassword, salt);
};

userSchema.methods.comparePassword = function comparePassword(plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    role: this.role,
    departmentId: this.departmentId,
    designation: this.designation,
    avatar: this.avatar,
    state: this.state,
    district: this.district,
    mobileVerified: this.mobileVerified
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
