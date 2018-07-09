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
    },
    campground: {
            id: {   
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "campground"
                }
    }
});

module.exports = mongoose.model("comment", commentSchema);