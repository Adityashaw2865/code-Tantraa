require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const Department = require('../models/Department');
const ApprovalType = require('../models/ApprovalType');
const User = require('../models/User');

// All demo/reference data now lives in ./data/*.json instead of being
// hardcoded inline here — edit those files (or point SEED_DATA_DIR at your
// own folder) to change what gets seeded, no code changes needed.
const DATA_DIR = process.env.SEED_DATA_DIR || require('path').join(__dirname, 'data');

const DEPARTMENTS = require(require('path').join(DATA_DIR, 'departments.json'));
const APPROVAL_TYPES_BY_DEPT_CODE = require(require('path').join(DATA_DIR, 'approvalTypes.json'));
const DEMO_USERS = require(require('path').join(DATA_DIR, 'demoUsers.json'));

// Demo password is configurable via env instead of being hardcoded.
const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Passw0rd!123';

async function seed() {
  await connectDB();

  console.log('[seed] clearing existing Departments, ApprovalTypes and demo Users...');
  await Department.deleteMany({});
  await ApprovalType.deleteMany({});
  await User.deleteMany({ email: { $in: DEMO_USERS.map((u) => u.email) } });

  console.log('[seed] inserting departments...');
  const depts = await Department.insertMany(DEPARTMENTS);
  const deptByCode = Object.fromEntries(depts.map((d) => [d.shortCode, d]));

  console.log('[seed] inserting approval types...');
  await ApprovalType.insertMany(
    APPROVAL_TYPES_BY_DEPT_CODE.map(({ deptCode, ...rest }) => ({
      ...rest,
      departmentId: deptByCode[deptCode]._id
    }))
  );

  console.log('[seed] creating demo users (one per role)...');
  for (const u of DEMO_USERS) {
    const user = new User({
      name: u.name,
      email: u.email,
      mobile: u.mobile,
      role: u.role,
      designation: u.designation,
      state: u.state,
      district: u.district,
      departmentId: u.deptCode ? deptByCode[u.deptCode]._id : undefined
    });
    await user.setPassword(DEMO_PASSWORD);
    await user.save();
  }

  console.log('\n[seed] done. Demo logins (password for all: ' + DEMO_PASSWORD + '):');
  DEMO_USERS.forEach((u) => console.log(`  - ${u.role.padEnd(12)} ${u.email}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
