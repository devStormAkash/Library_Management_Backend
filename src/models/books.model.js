
const mongoose = require("mongoose");

// Book Schema (includes description, stackNumber, shelfNumber)
const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Story",
        "Education",
        "Exploring",
        "Science",
        "History",
        "Novel",
        "Poetry",
        "Comics",
        "Technology",
        "Travel",
        "Art",
        "Biography",
        "Fantasy",
        "Philosophy",
        "Engineering",
        "Other",
      ],
      required: true,
    },
    copies: { type: Number, default: 1, min: 0 },
    available: { type: Boolean, default: true },

    // new fields
    description: { type: String, default: "" },
    stackNumber: { type: String, default: "" },
    shelfNumber: { type: String, default: "" },
  },
  { timestamps: true }
);

// Keep availability logic in pre('save')
bookSchema.pre("save", function (next) {
  if (this.copies == null || Number.isNaN(Number(this.copies))) {
    this.copies = 0;
  } else {
    this.copies = Number(this.copies);
  }
  this.available = this.copies > 0;
  next();
});

// index on category for faster aggregation/queries
bookSchema.index({ category: 1 });

const Book = mongoose.model("Book", bookSchema);

// export default Book;
module.exports = Book;