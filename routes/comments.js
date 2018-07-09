var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//=========================================================
//COMMENTS ROUTES
//=========================================================

//Comments New - Display a form to add a comment
router.get("/new", middleware.isLoggedIn, function(req, res) {
    Campground.findById(req.params.id, function(err, campground) {
        if (err || !campground) {
            req.flash("error", "Comment not found");
            res.redirect("/campgrounds");
        } else {
             res.render("comments/new", {campground: campground});
        }
    });
});


//Comments Create - add a comment to DB
router.post("/", middleware.isLoggedIn, function(req, res) {
    //lookup campgrounds using ID
    Campground.findById(req.params.id, function(err, campground) {
        if (err || !campground) {
            req.flash("error", "Comment not found");
            res.redirect("/campgrounds");
        } else {
            //create new comment
            Comment.create(req.body.comment, function(err, comment) {
                if (err || !comment) {
                    req.flash("error", "Comment not found");
                    res.redirect("/campgrounds");
                } else {
                    //add username and id to a comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    //link comment to a campground id
                    comment.campground.id = campground._id;
                    //save comments
                    comment.save();
                    //connect new comment to campground
                    campground.comments.push(comment);
                    campground.save();
                    //redirect to campgrounds show page
                    req.flash("success", "Comment is successfully added");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

//Comment edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res) {
    Campground.findById(req.params.id, function(err, foundCampground) {
        if (err || !foundCampground) {
            req.flash("error", "No campground found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment) {
            if (err) {
                req.flash("error", "Comment not found");
                res.redirect("/campgrounds");
            } else {
                res.render("comments/edit", {campground_id: req.params.id, comment: foundComment});
            }
        });
    });
});


//Comment update route
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        if (err) {
            res.redirect("back");
        } else {
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});


//Comment Destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            res.redirect("back");
        } else {
            req.flash("success", "Comment deleted");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

module.exports = router;