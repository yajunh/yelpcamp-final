var mongoose = require("mongoose");

//CommentSchema setup
var commentSchema = new mongoose.Schema({
    text: String,
    createdAt: {type: Date, default: Date.now },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

module.exports = mongoose.model("comment", commentSchema);