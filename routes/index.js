var express     = require("express"),
    router      = express.Router(),
    passport    = require("passport"),
    User        = require("../models/user"),
    Campground  = require("../models/campground"),
    async       = require("async"),
    nodemailer  = require("nodemailer"),
    crypto      = require("crypto");

//root route
router.get("/", function(req, res) {
   res.render("landing"); 
});

//==========================
//AUTH ROUTES
//==========================

//show register form
router.get("/register", function(req, res) {
    res.render("register", {page: "register"});
});

//handle sign up logic
router.post("/register", function(req, res) {
    var newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        avatar: req.body.avatar
    });
    /*eval(require("locus"));*/
    if (req.body.admincode === "house123") {
        newUser.isAdmin = true;
    }
    
    User.register(newUser, req.body.password, function(err, user) {
            if (err) {
                req.flash("error", err.message);
                return res.render("register", {error: err.message});
            }
            passport.authenticate("local")(req, res, function() {
                req.flash("success", "Welcome to YelpCamp, " + user.username);
                res.redirect("/campgrounds");
            });
    });
});

//show login form
router.get("/login", function(req, res) {
    res.render("login", {page: "login"});
});

//handling login logic
//middleware model: app.post("/login", middleware, callback)
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
    }), function(req, res) {
});

//logout route
router.get("/logout", function(req, res) {
    req.logout();
    req.flash("success", "You've logged out!");
    res.redirect("/campgrounds");
});

//forgot password
router.get("/forgot", function(req, res) {
    res.render("forgot");
});

router.post("/forgot", function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString("hex");
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({email: req.body.email}, function (err, user) {
                if (!user) {
                    req.flash("error", "No account with that email address exists.");
                    res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000;  //expires in 1 hour
                
                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                // service: "gmail",
                host: "debugmail.io",
                port: 9025,
                auth: {
                    user: process.env.EMAILUSER,
                    pass: process.env.EMAILPW
                }
            });
            var mailOptions = {
                from: process.env.EMAILUSER,
                to: user.email,
                subject: "Node.js Password Reset",
                text: "You are receiving this email because you (or someoneelse) have requested to reset the password." +
                "Please click on the following link, or paste this into your browser to complete the process" + "\n\n" +
                "https://" + req.headers.host + "/reset/" + token + "\n\n" +
                "If you didn not request this, please ignore this email and your password will remain unchanged."
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log("Mail Sent!");
                req.flash("success", "An email has been sent to " + user.email + "with further introductions");
                done(err, "done");
            });
        }
    ], function(err) {
        if(err) 
            return next(err);
        res.redirect("/forgot");
    });
});

//reset password
router.get("/reset/:token", function(req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
        if(err || !user) {
            req.flash("error", "Password reset token is invalid or has expired.");
            return res.redirect("/forgot");
        }
        res.render("reset", {token: req.params.token});
    });
});

router.post("/reset/:token", function(req, res) {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}}, function(err, user) {
                if(err || !user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("/forgot");
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword (req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        
                        user.save(function(err) {
                            req.logIn(user, function(err) {
                                done(err, user);
                            });
                        });
                    }) 
                } else {
                    req.flash("error", "Passwords don't match");
                    return res.redirect("back");
                }
            });
        },
        function(user, done) {
            var smtpTransport = nodemailer.createTransport ({
                /*service: "debugmail",*/
                host: "debugmail.io",
                port: 9025,
                auth: {
                    user: process.env.EMAILUSER,
                    pass: process.env.EMAILPW   
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.EMAILUSER,
                subject: "Your password has been changed",
                text: "Hello, \n\n" + "This is a confirmation that your password for your account" + user.email + "has just been changed"
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                req.flash("success", "An email has been sent to " + user.email + "with further introductions");
                done(err);
            });
        }
    ], function(err) {
        res.redirect("/campgrounds");
    });
});

//User Profile
router.get("/users/:id", function(req, res) {
    User.findById(req.params.id, function(err, foundUser) {
        if (err) {
            req.flash("error", "Something went wrong");
            res.redirect("/");
        } else {
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err, campgrounds) {
                if (err) {
                    req.flash("error", "Something went wrong");
                    res.redirect("/");
                } else {
                    res.render("users/show", {user: foundUser, campgrounds: campgrounds});
                }
            });
        }
    });
});

module.exports = router;