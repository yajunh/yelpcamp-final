var mongoose = require("mongoose");

//CampgroundSchema setup
var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    imageId: String,
    price: Number,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {type: Date, default: Date.now },
    author: {
                id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                },
                username: String
            },
    comments: [
                {   
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "comment"
                }
              ]
});

module.exports = mongoose.model("Campground", campgroundSchema);