// // import mongoose from "mongoose";
// const mongoose = require("mongoose");

// // import bcrypt from "bcryptjs";
// const bcrypt = require("bcryptjs");

// // User Schema
// const userSchema = new mongoose.Schema(
//   {
//     username: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: { type: String, enum: ["admin", "student"], required: true },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// const User = mongoose.model("User", userSchema);

// module.exports = User;

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    }, // who sent it
    text: { type: String, required: true, maxlength: 4000 },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
); // keep _id for each message (handy)

/* User Schema */
const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "student"], required: true },

    // new field: messages (array of message subdocs)
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

/* Hash password before saving */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

const User = mongoose.model("User", userSchema);
module.exports = User;

