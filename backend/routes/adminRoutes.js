const express = require("express");
const router = express.Router();
const User = require("../models/User"); // Import User model
const Poll = require("../models/Poll"); // Import Poll model

// ✅ Route to get all users without exposing passwords
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users", error });
  }
});

// ✅ Route to delete a user and all their polls
router.delete("/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // First, delete all polls created by this user
    await Poll.deleteMany({ userId });
    
    // Then delete the user
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User and all associated polls deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Route to ban a user for a specified duration
router.post("/users/:userId/ban", async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration } = req.body; // Duration in days
    
    if (!duration || duration < 1) {
      return res.status(400).json({ message: "Invalid ban duration" });
    }
    
    const banExpiresAt = new Date();
    banExpiresAt.setDate(banExpiresAt.getDate() + duration);
    
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isBanned: true,
        banExpiresAt
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error banning user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Route to get all polls
router.get("/polls", async (req, res) => {
  try {
    const polls = await Poll.find();
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: "Error fetching polls", error });
  }
});

// ✅ Route to delete a poll
router.delete("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;
    const deletedPoll = await Poll.findByIdAndDelete(pollId);

    if (!deletedPoll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.json({ message: "Poll deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting poll", error });
  }
});

// ✅ Route to modify a poll (edit question)
router.put("/polls/:pollId", async (req, res) => {
  try {
    const { pollId } = req.params;
    const { question } = req.body;

    const updatedPoll = await Poll.findByIdAndUpdate(
      pollId,
      { question },
      { new: true }
    );

    if (!updatedPoll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.json(updatedPoll);
  } catch (error) {
    res.status(500).json({ message: "Error updating poll", error });
  }
});

module.exports = router;