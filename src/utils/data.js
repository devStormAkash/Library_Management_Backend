
// import Book from "../models/books.model.js";
// import User from "../models/users.model.js";

const Book = require("../models/books.model.js")
const User = require("../models/users.model.js");

const initializeData = async () => {
  try {
    const adminExists = await User.findOne({ username: "admin" });
    if (!adminExists) {
      const admin = new User({
        username: "admin",
        password: "admin123",
        role: "admin",
      });
      await admin.save();
      console.log("✅ Default admin user created");
    }

    const studentExists = await User.findOne({ username: "student" });
    if (!studentExists) {
      const student = new User({
        username: "student",
        password: "student123",
        role: "student",
      });
      await student.save();
      console.log("✅ Default student user created");
    }

    const bookCount = await Book.countDocuments();
    if (bookCount === 0) {
      const sampleBooks = [
        {
          title: "The Great Adventure",
          author: "John Smith",
          category: "Story",
          copies: 3,
          description: "An adventurous tale across continents.",
          stackNumber: "A1",
          shelfNumber: "S1-777",
        },
        {
          title: "Physics Fundamentals",
          author: "Dr. Sarah Wilson",
          category: "Education",
          copies: 5,
          description: "A concise introduction to classical physics.",
          stackNumber: "E2",
          shelfNumber: "S1-973",
        },
        {
          title: "Journey to the Unknown",
          author: "Mike Explorer",
          category: "Exploring",
          copies: 2,
          description: "Travel stories and exploration notes.",
          stackNumber: "B3",
          shelfNumber: "S2-911",
        },
        {
          title: "Quantum Mechanics",
          author: "Prof. Einstein Jr",
          category: "Science",
          copies: 4,
          description: "Advanced concepts in quantum theory.",
          stackNumber: "S5",
          shelfNumber: "S3-000",
        },
        {
          title: "Ancient Civilizations",
          author: "Historical Society",
          category: "History",
          copies: 3,
          description: "A study of early human civilizations.",
          stackNumber: "H1",
          shelfNumber: "S4-663",
        },
        {
          title: "Love in Paris",
          author: "Romance Writer",
          category: "Novel",
          copies: 6,
          description: "A romantic novel set in Paris.",
          stackNumber: "N2",
          shelfNumber: "S1-664",
        },
        {
          title: "Poems of the Heart",
          author: "Poet Laureate",
          category: "Poetry",
          copies: 2,
          description: "A collection of love poems.",
          stackNumber: "P1",
          shelfNumber: "S2-666",
        },
        {
          title: "Super Hero Adventures",
          author: "Comic Creator",
          category: "Comics",
          copies: 4,
          description: "Comic adventures of modern heroes.",
          stackNumber: "C2",
          shelfNumber: "S3-098",
        },
        {
          title: "AI and the Future",
          author: "Tech Guru",
          category: "Technology",
          copies: 3,
          description: "An overview of AI progress and implications.",
          stackNumber: "T1",
          shelfNumber: "S1-811",
        },
        {
          title: "Around the World",
          author: "Travel Expert",
          category: "Travel",
          copies: 2,
          description: "Travel guide to top destinations.",
          stackNumber: "TR1",
          shelfNumber: "S2-754",
        },
        {
          title: "Renaissance Art",
          author: "Art Historian",
          category: "Art",
          copies: 3,
          description: "Exploration of Renaissance masterpieces.",
          stackNumber: "AR1",
          shelfNumber: "S4-123",
        },
        {
          title: "Life of Gandhi",
          author: "Biographer",
          category: "Biography",
          copies: 2,
          description: "Biography of Mahatma Gandhi.",
          stackNumber: "BIO1",
          shelfNumber: "S3-654",
        },
        {
          title: "Dragons and Magic",
          author: "Fantasy Author",
          category: "Fantasy",
          copies: 4,
          description: "High fantasy with dragons and wizards.",
          stackNumber: "F1",
          shelfNumber: "S3-100",
        },
        {
          title: "Philosophy 101",
          author: "Deep Thinker",
          category: "Philosophy",
          copies: 2,
          description: "Introductory philosophy concepts.",
          stackNumber: "PH1",
          shelfNumber: "S4-200",
        },
        {
          title: "Random Thoughts",
          author: "Various Authors",
          category: "Other",
          copies: 3,
          description: "Assorted essays and short pieces.",
          stackNumber: "O1",
          shelfNumber: "S2-345",
        },
      ];

      await Book.insertMany(sampleBooks);
      console.log("✅ Sample books created");
    }
  } catch (error) {
    console.error("❌ Error initializing data:", error);
  }
};

// export default initializeData;
module.exports = initializeData;