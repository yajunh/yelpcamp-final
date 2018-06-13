var mongoose = require("mongoose");
var Campground = require("./models/campground");
var Comment = require("./models/comment");


var data = [
    {
        name: "Bryher Campsite, Isles of Scilly",
        image: "https://www.telegraph.co.uk/content/dam/Travel/2016/August/camping-st-ives-AP-TRAVEL.jpg?imwidth=1240",
        description: "Elit at imperdiet dui accumsan sit amet. Ac tincidunt vitae semper quis. Parturient montes nascetur ridiculus mus mauris vitae. Pretium fusce id velit ut tortor pretium. Amet purus gravida quis blandit turpis. Iaculis eu non diam phasellus vestibulum lorem sed risus ultricies. Duis ut diam quam nulla porttitor massa id. Molestie at elementum eu facilisis sed odio morbi. Interdum velit laoreet id donec ultrices tincidunt arcu. Posuere sollicitudin aliquam ultrices sagittis orci a. Eu scelerisque felis imperdiet proin fermentum leo vel."
    },
    {
        name: "Bay View Farm, Cornwall",
        image: "https://www.telegraph.co.uk/content/dam/Travel/2016/August/camping1.jpg?imwidth=1240",
        description: "Ipsum consequat nisl vel pretium lectus quam id. Duis tristique sollicitudin nibh sit amet commodo nulla facilisi nullam. Quisque id diam vel quam elementum pulvinar etiam. Adipiscing elit ut aliquam purus sit amet. Quam viverra orci sagittis eu volutpat odio facilisis mauris. At in tellus integer feugiat. Lectus vestibulum mattis ullamcorper velit sed ullamcorper. Adipiscing at in tellus integer feugiat scelerisque varius morbi. Nunc pulvinar sapien et ligula ullamcorper. Vestibulum lectus mauris ultrices eros in cursus turpis massa tincidunt. In mollis nunc sed id semper risus."
    },
    {
        name: "Burnbake Campsite, Dorset",
        image: "https://www.telegraph.co.uk/content/dam/Travel/2016/August/camping6.jpg?imwidth=1240",
        description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Tempor commodo ullamcorper a lacus vestibulum sed arcu non odio. Malesuada bibendum arcu vitae elementum curabitur vitae nunc sed velit. Ante metus dictum at tempor commodo ullamcorper. Sagittis id consectetur purus ut faucibus pulvinar. Velit sed ullamcorper morbi tincidunt ornare massa eget. Ullamcorper eget nulla facilisi etiam dignissim diam. Mauris pellentesque pulvinar pellentesque habitant morbi tristique senectus et. Turpis egestas sed tempus urna et. Convallis posuere morbi leo urna molestie."
    }
];



function seedDB() {
    //remove all campgrounds
    Campground.remove({}, function(err) {
        if (err) {
            console.log(err);
        }
        console.log("Campgrounds have been removed!");
        //add a few campgrounds
        data.forEach(function(seed) {
            Campground.create(seed, function(err, campground) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("added a campground");
                    //create a comment on each campground
                    Comment.create({
                                        text: "Beautiful view!!!!!",
                                        author: "HarryPotter"
                                    }, function(err, comment) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    campground.comments.push(comment);
                                                    campground.save();
                                                    console.log("created a comment");
                                                }
                                    });
                }
            });
        });
    });
    
    
    
    
    
    
    //add a few comments
}


module.exports = seedDB;


