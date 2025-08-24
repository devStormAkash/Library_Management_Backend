
const mongoose = require("mongoose");


// Borrow Schema
const borrowSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },
    borrowedAt: { type: Date, default: Date.now },
    returnedAt: { type: Date, default: null },
    isPending: { type: Boolean, default: false },
    dueDate: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// helpful indexes for borrow queries
borrowSchema.index({ student: 1, returnedAt: 1 });
borrowSchema.index({ book: 1, returnedAt: 1 });

const Borrow = mongoose.model("Borrow", borrowSchema);

module.exports = Borrow;