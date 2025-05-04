const Poll = require("../models/Poll");
const User = require("../models/User");
const Category = require("../models/Category"); // ✅ Import Category model only once

// ✅ Create Poll
exports.createPoll = async (req, res) => {
  const { question, type, category, options, creatorId } = req.body;

  if (!question || !type || !category || !creatorId) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    let processedOptions = [];
    switch (type) {
      case "single-choice":
        processedOptions = options.map((option) => ({ optionText: option }));
        break;
      case "rating":
        processedOptions = [1, 2, 3, 4, 5].map((value) => ({
          optionText: value.toString(),
        }));
        break;
      case "yes/no":
        processedOptions = ["Yes", "No"].map((option) => ({
          optionText: option,
        }));
        break;
      case "image-based":
        processedOptions = options.map((url) => ({ optionText: url }));
        break;
      case "open-ended":
        processedOptions = [];
        break;
      default:
        return res.status(400).json({ message: "Invalid poll type." });
    }

    const newPoll = await Poll.create({
      question,
      type,
      category,
      options: processedOptions,
      creator: creatorId,
    });

    res.status(201).json(newPoll);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating poll", error: err.message });
  }
};

// ✅ Get Categories from Database
exports.getCategories = async (req, res) => {
  try {
    const categories = await Poll.distinct("category"); // ✅ Fetch unique categories

    if (!categories.length) {
      return res.status(200).json({ categories: [] }); // ✅ Return empty array if no categories exist
    }

    res.status(200).json({ categories: categories.map((name) => ({ name })) });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Get All Polls
exports.getAllPolls = async (req, res) => {
  const { category, page = 1, limit = 10 , creatorId } = req.query;
  const filter = {};
  console.log("filter  in  the  body ", category);
  if (category && category !== "All") {
    filter.category = category;
  }
console.log("creator",creatorId);
  if (creatorId){
    filter.creator = creatorId
  }
  console.log("no  category", filter);

  try {
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    const polls = await Poll.find(filter)
      .populate("creator", "fullName username email profileImageUrl")
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 });

    const totalPolls = await Poll.countDocuments(filter);

    res.status(200).json({
      polls,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalPolls / pageSize),
      totalPolls,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error fetching polls", error: err.message });
  }
};

// ✅ Get Poll by ID
exports.getPollById = async (req, res) => {
  const { id } = req.params;

  try {
    const poll = await Poll.findById(id)
      .populate("creator", "username email")
      .populate({
        path: "responses.voterId",
        select: "username profileImageUrl fullName",
      });
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    res.status(200).json(poll);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// ✅ Delete Poll
exports.deletePoll = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this poll." });
    }

    await Poll.findByIdAndDelete(id);
    res.status(200).json({ message: "Poll deleted successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error deleting poll", error: err.message });
  }
};
// Close Poll
exports.closePoll = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const poll = await Poll.findById(id);

    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.creator.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You are not authorized to close this poll." });
    }

    poll.closed = true;
    await poll.save();

    res.status(200).json({ message: "Poll closed successfully", poll });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// Bookmark Poll
exports.bookmarkPoll = async (req, res) => {
  const { id } = req.params; // Poll ID
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if poll is already bookmarked
    const isBookmarked = user.bookmarkedPolls.includes(id);

    if (isBookmarked) {
      // Remove poll from bookmarks
      user.bookmarkedPolls = user.bookmarkedPolls.filter(
        (pollId) => pollId.toString() !== id
      );

      await user.save();
      return res.status(200).json({
        message: "Poll removed from bookmarks",
        bookmarkedPolls: user.bookmarkedPolls,
      });
    }

    // Add poll to bookmarks
    user.bookmarkedPolls.push(id);
    await user.save();
    res.status(200).json({
      message: "Poll bookmarked successfully",
      bookmarkedPolls: user.bookmarkedPolls,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

exports.getBookmarkedPolls = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await User.findById(userId)
      .populate({
        path: "bookmarkedPolls",
        populate: {
          path: "creator",
          select: "fullName username profileImageUrl",
        },
      })
      .populate({
        path: "bookmarkedPolls",
        populate: {
          path: "responses.voterId",
          select: "fullName username profileImageUrl",
        },
      });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const bookmarkedPolls = user.bookmarkedPolls;
    // Add `userHasVoted` flag for each poll
    const updatedPolls = bookmarkedPolls.map((poll) => {
      const userHasVoted = poll.voters.some((voterId) =>
        voterId.equals(userId)
      );
      return {
        ...poll.toObject(),
        userHasVoted,
      };
    });

    res.status(200).json({ bookmarkedPolls: updatedPolls });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

exports.getVotedPolls = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  try {
    // Calculate pagination parameters
    const pageNumber = parseInt(page, 10);
    const pageSize = parseInt(limit, 10);
    const skip = (pageNumber - 1) * pageSize;

    // Fetch polls where the user has voted
    const polls = await Poll.find({ voters: userId }) // Filter by polls where the user's ID exists in the voters array
      .populate("creator", "fullName profileImageUrl username email")
      .populate({
        path: "responses.voterId",
        select: "username profileImageUrl fullName",
      })
      .skip(skip)
      .limit(pageSize);

    // Add `userHasVoted` flag for each poll
    const updatedPolls = polls.map((poll) => {
      const userHasVoted = poll.voters.some((voterId) =>
        voterId.equals(userId)
      );
      return {
        ...poll.toObject(),
        userHasVoted,
      };
    });

    // Get total count of voted polls for pagination metadata
    const totalVotedPolls = await Poll.countDocuments({ voters: userId });

    res.status(200).json({
      polls: updatedPolls,
      currentPage: pageNumber,
      totalPages: Math.ceil(totalVotedPolls / pageSize),
      totalVotedPolls,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};


exports.voteOnPoll = async (req, res) => {
  const { id } = req.params;
  const { optionIndex, voterId, responseText } = req.body;

  try {
    const poll = await Poll.findById(id);
    if (!poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    if (poll.closed) {
      return res.status(400).json({ message: "Poll is closed." });
    }

    if (poll.voters.includes(voterId)) {
      return res
        .status(400)
        .json({ message: "User has already voted on this poll." });
    }

    if (poll.type === "open-ended") {
      if (!responseText) {
        return res
          .status(400)
          .json({ message: "Response text is required for open-ended polls." });
      }
      poll.responses.push({ voterId, responseText });
    } else {
      if (
        optionIndex === undefined ||
        optionIndex < 0 ||
        optionIndex >= poll.options.length
      ) {
        return res.status(400).json({ message: "Invalid option index." });
      }
      poll.options[optionIndex].votes += 1;
    }

    poll.voters.push(voterId);
    await poll.save();

    res.status(200).json(poll);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error registering user", error: err.message });
  }
};

// ✅ Finalized module exports