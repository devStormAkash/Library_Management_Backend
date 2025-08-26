
// server.js
const express = require("express");
// const mongoose = require("mongoose");
// import connectDb from "./src/db/index.js";
const connectDb = require("./src/db/index.js");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());

// SECURITY: helmet + basic rate limiter (recommended)
app.use(helmet());
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // max requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS: permissive in dev, restricted in production using CLIENT_ORIGIN env
// const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
// if (process.env.NODE_ENV === "production") {
//   app.use(
//     cors({
//       origin: (origin, callback) => {
//         if (!origin) return callback(new Error("CORS: origin missing"), false);
//         if (origin === CLIENT_ORIGIN) return callback(null, true);
//         return callback(new Error("CORS: origin not allowed"), false);
//       },
//       credentials: true,
//     })
//   );
// } else {
//   // development: allow tools like Postman and local frontend
//   app.use(cors({ origin: true, credentials: true }));
// }


// const allowedOrigins = [
//   process.env.CLIENT_ORIGIN, // e.g. https://your-frontend.vercel.app
//   "http://localhost:3000", // dev
//   // add any staging URLs etc.
// ].filter(Boolean);

// app.use(
//   cors({
//     origin(origin, callback) {
//       if (!origin) return callback(null, true); // allow non-browser (Postman/server)
//       if (allowedOrigins.includes(origin)) return callback(null, true);
//       console.warn("Blocked CORS origin:", origin);
//       return callback(new Error("CORS: origin not allowed"), false);
//     },
//     credentials: true,
//   })
// );

const CLIENT_ORIGIN = "https://library-management-frontend-two-mu.vercel.app";

app.use(
  cors({
    // origin: process.env.CLIENT_ORIGIN,
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests explicitly
app.options(
  "*",
  cors({
    // origin: process.env.CLIENT_ORIGIN,
    CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection

connectDb();

// ----------------- Schemas & Models -----------------


// import User from "./src/models/users.model.js";
// import Book from "./src/models/books.model.js";
// import Borrow from "./src/models/borrows.model.js";

const User = require("./src/models/users.model.js");
const Book = require("./src/models/books.model.js");
const Borrow = require("./src/models/borrows.model.js");



// ----------------- Helpers -----------------

const sendServerError = require("./src/utils/apiError.js");
// ----------------- Auth & Middlewares -----------------

const {
  authenticateToken,
  requireAdmin,
  requireStudent,
} = require("./src/middlewares/auth.middleware.js");


// ----------------- Data Initialization -----------------

const initializeData = require("./src/utils/data.js");
initializeData();

// ----------------- AUTH ROUTES -----------------

app.post("/api/auth/register", async (req, res) => {
  try {
    const { username, password, role = "student", adminSecret } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    if (role === "admin") {
      if (!process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Admin registration is disabled" });
      }
      if (adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({ message: "Invalid admin secret" });
      }
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const user = new User({ username, password, role });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.status(201).json({
      token,
      user: { _id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return sendServerError(res, error, "POST /api/auth/register error:");
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return res.json({
      token,
      user: { _id: user._id, username: user.username, role: user.role },
    });
  } catch (error) {
    return sendServerError(res, error, "POST /api/auth/login error:");
  }
});

// ----------------- BOOK ROUTES -----------------

app.get("/api/books", authenticateToken, async (req, res) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const books = await Book.find(filter).sort({ createdAt: -1 });
    return res.json(books);
  } catch (error) {
    return sendServerError(res, error, "GET /api/books error:");
  }
});

app.get("/api/books/categories", authenticateToken, async (req, res) => {
  try {
    const categories = await Book.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res.json(categories);
  } catch (error) {
    return sendServerError(res, error, "GET /api/books/categories error:");
  }
});

app.get("/api/books/:id", authenticateToken, async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.json(book);
  } catch (error) {
    return sendServerError(res, error, "GET /api/books/:id error:");
  }
});

app.post("/api/books", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      copies = 1,
      description = "",
      stackNumber = "",
      shelfNumber = "",
    } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ message: "Title, author, and category are required" });
    }

    const book = new Book({ title, author, category, copies, description, stackNumber, shelfNumber });
    await book.save();
    return res.status(201).json(book);
  } catch (error) {
    return sendServerError(res, error, "POST /api/books error:");
  }
});

// Use findById + save so pre('save') runs and updates available properly
app.put("/api/books/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      author,
      category,
      copies,
      description,
      stackNumber,
      shelfNumber,
    } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });

    if (title !== undefined) book.title = title;
    if (author !== undefined) book.author = author;
    if (category !== undefined) book.category = category;
    if (copies !== undefined) book.copies = copies;
    if (description !== undefined) book.description = description;
    if (stackNumber !== undefined) book.stackNumber = stackNumber;
    if (shelfNumber !== undefined) book.shelfNumber = shelfNumber;

    await book.save(); // runs pre-save hook
    return res.json(book);
  } catch (error) {
    return sendServerError(res, error, "PUT /api/books/:id error:");
  }
});

app.delete("/api/books/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Check if book is currently borrowed
    const activeBorrows = await Borrow.findOne({
      book: req.params.id,
      returnedAt: null,
    });

    if (activeBorrows) {
      return res.status(400).json({ message: "Cannot delete book that is currently borrowed" });
    }

    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: "Book not found" });
    return res.json({ message: "Book deleted successfully" });
  } catch (error) {
    return sendServerError(res, error, "DELETE /api/books/:id error:");
  }
});

// ----------------- BORROW ROUTES (atomic & robust) -----------------

app.post("/api/borrows", authenticateToken, requireStudent, async (req, res) => {
  try {
    const { bookId } = req.body;
    if (!bookId) return res.status(400).json({ message: "Book ID is required" });

    // Business checks first: existing borrow & borrow limit
    const existingBorrow = await Borrow.findOne({
      student: req.user._id,
      book: bookId,
      returnedAt: null,
    });
    if (existingBorrow) return res.status(400).json({ message: "You have already borrowed this book" });

    const activeBorrows = await Borrow.countDocuments({
      student: req.user._id,
      returnedAt: null,
    });
    if (activeBorrows >= 5) {
      return res.status(400).json({ message: "You have reached the maximum borrowing limit (5 books)" });
    }

    // Atomically decrement copies if available
    const updatedBook = await Book.findOneAndUpdate(
      { _id: bookId, copies: { $gt: 0 } },
      { $inc: { copies: -1 } },
      { new: true }
    );
    if (!updatedBook) {
      return res.status(400).json({ message: "Book is not available for borrowing" });
    }

    // Create borrow record (dueDate default applies)
    const borrow = new Borrow({
      student: req.user._id,
      book: bookId,
    });
    await borrow.save();

    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate("book", "title author category copies description stackNumber shelfNumber")
      .populate("student", "username");

    return res.status(201).json(populatedBorrow);
  } catch (error) {
    return sendServerError(res, error, "POST /api/borrows error:");
  }
});

app.get("/api/borrows/my-books", authenticateToken, requireStudent, async (req, res) => {
  try {
    const borrows = await Borrow.find({ student: req.user._id })
      .populate("book", "title author category copies description stackNumber shelfNumber")
      .sort({ borrowedAt: -1 });
    return res.json(borrows);
  } catch (err) {
    return sendServerError(res, err, "GET /api/borrows/my-books error:");
  }
});

app.get("/api/borrows", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const borrows = await Borrow.find()
      .populate("book", "title author category copies description stackNumber shelfNumber")
      .populate("student", "username")
      .sort({ borrowedAt: -1 });

    return res.json(borrows);
  } catch (error) {
    return sendServerError(res, error, "GET /api/borrows error:");
  }
});

app.put("/api/borrows/:id/return", authenticateToken, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate(
      "book",
      "title author category copies description stackNumber shelfNumber"
    );

    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });

    // Authorization: student can return own, admin can return any
    if (req.user.role === "student" && borrow.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only return your own books" });
    }

    if (borrow.returnedAt) return res.status(400).json({ message: "Book has already been returned" });

    // Update borrow record
    // borrow.returnedAt = new Date();
    borrow.isPending = !borrow.isPending;
    await borrow.save();

    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate("book", "title author category copies description stackNumber shelfNumber")
      .populate("student", "username");

    return res.json(populatedBorrow);
  } catch (error) {
    return sendServerError(res, error, "PUT /api/borrows/:id/return error:");
  }
});

app.put("/api/borrows/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const borrow = await Borrow.findById(req.params.id).populate(
      "book",
      "title author category copies description stackNumber shelfNumber"
    );

    if (!borrow) return res.status(404).json({ message: "Borrow record not found" });

    if (borrow.returnedAt) return res.status(400).json({ message: "Book has already been returned" });

    // Update borrow record
    borrow.returnedAt = new Date();
    borrow.isPending = false;
    await borrow.save();

    // Increase book copies (defensive)
    if (borrow.book && borrow.book._id) {
      await Book.findByIdAndUpdate(borrow.book._id, { $inc: { copies: 1 } });
    }

    const populatedBorrow = await Borrow.findById(borrow._id)
      .populate("book", "title author category copies description stackNumber shelfNumber")
      .populate("student", "username");

    return res.json(populatedBorrow);
  } catch (error) {
    return sendServerError(res, error, "PUT /api/borrows/:id/approve error:");
  }
});



// student -> admin
app.post("/api/notification/admin", authenticateToken, requireStudent, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.toString().trim()) {
      return res.status(400).json({ message: "Notification text is required" });
    }
    const cleanText = text.toString().trim();
    if (cleanText.length > 4000) {
      return res.status(400).json({ message: "Notification text must be 4000 characters or fewer" });
    }

    // find an admin to receive the message
    const adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      return res.status(404).json({ message: "No admin user found to receive message" });
    }

    const newMessage = {
      sender: req.user._id, // ensure authenticateToken sets req.user._id
      text: cleanText,
      read: false,
      createdAt: new Date()
    };

    // Atomic push + return updated document
    const updated = await User.findByIdAndUpdate(
      adminUser._id,
      { $push: { messages: newMessage } },
      { new: true, runValidators: true }
    ).populate('messages.sender', 'username role _id');

    if (!updated) {
      return res.status(500).json({ message: "Failed to append message" });
    }

    const savedMessage = updated.messages[updated.messages.length - 1];
    return res.status(201).json({ message: "Message sent to admin", notification: savedMessage });
  } catch (err) {
    console.error("POST /api/notification/admin error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});


// admin -> student
app.post("/api/notification/user/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { text } = req.body;

    if (!text || !text.toString().trim()) {
      return res.status(400).json({ message: "Notification text is required" });
    }
    const cleanText = text.toString().trim();
    if (cleanText.length > 4000) {
      return res.status(400).json({ message: "Notification text must be 4000 characters or fewer" });
    }

    // ensure the user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ message: "Target user not found" });
    }

    const newMessage = {
      sender: req.user._id, // admin id
      text: cleanText,
      read: false,
      createdAt: new Date()
    };

    const updated = await User.findByIdAndUpdate(
      targetUserId,
      { $push: { messages: newMessage } },
      { new: true, runValidators: true }
    ).populate('messages.sender', 'username role _id');

    if (!updated) {
      return res.status(500).json({ message: "Failed to append message" });
    }

    const savedMessage = updated.messages[updated.messages.length - 1];
    return res.status(201).json({ message: "Notification sent", notification: savedMessage });
  } catch (error) {
    console.error("POST /api/notification/user/:id error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET conversation between current user and other user
// Response: { conversation: [ { _id, sender: { _id, username }, text, read, createdAt }, ... ], participants: { me: {...}, other: {...} } }
app.get("/api/notification/conversation/:otherId", authenticateToken, async (req, res) => {
  try {
    const meId = req.user._id || req.user.id;
    let otherId = req.params.otherId;

    // If client passed 'admin' as special keyword, find a real admin
    if (!otherId || otherId === "admin") {
      const adminUser = await User.findOne({ role: "admin" }).select("_id username role");
      if (!adminUser) return res.status(404).json({ message: "No admin found" });
      otherId = adminUser._id.toString();
    }

    // load both user docs and populate message sender subdocs
    const [meDoc, otherDoc] = await Promise.all([
      User.findById(meId).populate("messages.sender", "username role _id"),
      User.findById(otherId).populate("messages.sender", "username role _id"),
    ]);

    if (!meDoc || !otherDoc) {
      return res.status(404).json({ message: "User(s) not found" });
    }

    // messages where other -> me are stored in meDoc.messages with sender == otherId
    const incoming = (meDoc.messages || [])
      .filter((m) => m.sender && m.sender._id && m.sender._id.toString() === otherId)
      .map((m) => ({
        _id: m._id,
        sender: { _id: m.sender._id, username: m.sender.username, role: m.sender.role },
        text: m.text,
        read: m.read,
        createdAt: m.createdAt || m.createdAtAt || m._id.getTimestamp?.().toISOString?.(),
      }));

    // messages where me -> other are stored in otherDoc.messages with sender == meId
    const outgoing = (otherDoc.messages || [])
      .filter((m) => m.sender && m.sender._id && m.sender._id.toString() === meId.toString())
      .map((m) => ({
        _id: m._id,
        sender: { _id: m.sender._id, username: m.sender.username, role: m.sender.role },
        text: m.text,
        read: m.read,
        createdAt: m.createdAt || m.createdAtAt || m._id.getTimestamp?.().toISOString?.(),
      }));

    // merge and sort ascending by createdAt
    const merged = [...incoming, ...outgoing].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return res.json({
      conversation: merged,
      participants: {
        me: { _id: meDoc._id, username: meDoc.username, role: meDoc.role },
        other: { _id: otherDoc._id, username: otherDoc.username, role: otherDoc.role },
      },
    });
  } catch (err) {
    console.error("GET /api/notification/conversation/:otherId error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ----------------- USERS & STATS -----------------

app.get("/api/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json(users);
  } catch (error) {
    return sendServerError(res, error, "GET /api/users error:");
  }
});

app.get("/api/stats", authenticateToken, async (req, res) => {
  try {
    const stats = {};
    if (req.user.role === "admin") {
      stats.totalBooks = await Book.countDocuments();
      stats.totalUsers = await User.countDocuments({ role: "student" });
      stats.totalBorrows = await Borrow.countDocuments();
      stats.activeBorrows = await Borrow.countDocuments({ returnedAt: null });
      stats.overdueBorrows = await Borrow.countDocuments({
        returnedAt: null,
        dueDate: { $lt: new Date() },
      });
    } else {
      stats.myBorrows = await Borrow.countDocuments({ student: req.user._id });
      stats.myActiveBorrows = await Borrow.countDocuments({ student: req.user._id, returnedAt: null });
      stats.myReturnedBooks = await Borrow.countDocuments({ student: req.user._id, returnedAt: { $ne: null } });
    }
    return res.json(stats);
  } catch (error) {
    return sendServerError(res, error, "GET /api/stats error:");
  }
});

// ----------------- ERROR HANDLING & 404 -----------------

// Error handling (fallback)
app.use((error, req, res, next) => {
  console.error("Unhandled Error:", error);
  if (process.env.NODE_ENV === "production") {
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(500).json({ message: "Internal server error", error: error?.message || String(error) });
});

// 404
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ----------------- START SERVER -----------------

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);

  // Initialize default data
  await initializeData();
});

// Export for testing
module.exports = app;
