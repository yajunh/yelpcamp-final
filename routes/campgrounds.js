var express     = require("express"),
    router      = express.Router(),
    Campground  = require("../models/campground"),
    middleware  = require("../middleware"),
    nodeGeoCoder = require("node-geocoder"),
    multer      = require('multer'),
    cloudinary  = require('cloudinary');

var options = {
    provider: "google",
    httpAdapter: "https",
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
};

var geocoder = nodeGeoCoder(options);

var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});

var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: imageFilter});

cloudinary.config({ 
    cloud_name: 'dpidx46np', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//=========================================================
//CAMPGROUNDS ROUTES
//=========================================================

//Index - show all campgrounds
router.get("/", function(req, res) {
    var noMatch = null;
    //if no search then show all campgrounds
    if (!req.query.search) {
        
        //capture the sort query and set sorting type
        var sorting;
        if(req.query.sort === "newest") {
            sorting = {"createdAt": -1};
        } else if(req.query.sort === "oldest") {
            sorting = {"createdAt": 1};
        } else if(req.query.sort === "price-asce") {
            sorting = {"price": 1};
        } else if(req.query.sort === "price-desc") {
            sorting = {"price": -1};
        }
        
        //Get all campgrounds from DB
        Campground.find({}).sort(sorting).exec(function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            } else {
                res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch, sorting: req.query.sort});  
            }
        });
    } else {
        //when search some special campgrounds
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Campground.find({name: regex}, function(err, allCampgrounds) {
            if (err) {
                console.log(err);
            //if no search input, then show nomatch message
            } else if (allCampgrounds.length < 1) {
                noMatch = "No campground found, please try again."; 
            }
            res.render("campgrounds/index", {campgrounds: allCampgrounds, page: "campgrounds", noMatch: noMatch});  
        });
    }
});

//CREATE - add new campground to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
    //get data from form and add to campground array
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var description = req.body.description;
    var author = {
                    id: req.user._id,
                    username: req.user.username
                 };
                 
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampGrounds = {name: name, image: image, price: price, description: description, author: author, location: location, lat: lat, lng: lng};
        /*Campground.create(newCampGrounds, function(err, newCampGround) {
            if (err) {
                console.log(err);
            } else {
                //redirect to campgrounds page
                res.redirect("/campgrounds");
            }
        });
        */
        //create a new campground and save to DB
        cloudinary.uploader.upload(req.file.path, function(result) {
            //add cloudinary url for the image to the campground object under image property
            newCampGrounds.image = result.secure_url;
            // add image's public_id to campground object
            newCampGrounds.imageId = result.public_id;
            Campground.create(newCampGrounds, function(err, newCampGround) {
                if (err) {
                  req.flash('error', err.message);
                  return res.redirect('back');
                }
                res.redirect('/campgrounds/' + newCampGround.id);
            });
        });
    });
});

//NEW - show form to create new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
    res.render("campgrounds/new");
});


//SHOW - show more information about one campground
router.get("/:id", function(req, res) {
    //find the campground with provided ID
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
        //console.log(pickedCampground);
        if (err || !foundCampground) {
            req.flash("error", "Campground not found");
            res.redirect("/campgrounds");
        } else {
            //render show template with that campground
            res.render("campgrounds/show", {campground: foundCampground}); 
        }
    });
});


//Edit Campgrounds route
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
        Campground.findById(req.params.id, function(err, foundCampground) {
            res.render("campgrounds/edit", {campground: foundCampground});
        });
});

//Update Campgrounds route
router.put("/:id", middleware.checkCampgroundOwnership, upload.single('image'), function(req, res) {
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var description = req.body.description;
    
    geocoder.geocode(req.body.location, function(err, data) {
        if (err ||!data.length) {
            req.flash("error", "Invalid address");
            console.log(err);
            res.redirect("/");
        }
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        
        //find and update the correct campground
        Campground.findById(req.params.id, async function(err, updatedCampground){
            if(err){
                req.flash("error", err.message);
                res.redirect("back");
            } else {
                if (req.file) {
                    //get new imaage and handle error
                    try {
                        if (updatedCampground.imageId) {
                            await cloudinary.v2.uploader.destroy(updatedCampground.imageId);
                        }
                        var result = await cloudinary.v2.uploader.upload(req.file.path);
                        updatedCampground.imageId = result.public_id;
                        updatedCampground.image = result.secure_url;
                    } catch (err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                }
                updatedCampground.name = name;
                updatedCampground.price = price;
                updatedCampground.description = description;
                updatedCampground.location = location;
                updatedCampground.lat = lat;
                updatedCampground.lng = lng;
                updatedCampground.save();
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + updatedCampground._id);
            }
        });
        /*//find and update the correct campground
            Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
            if (err) {
                req.flash("error", err.message);
                res.redirect("/campgrounds");
            } else {
                //redirect somewhere like show page
                req.flash("success","Successfully Updated!");
                res.redirect("/campgrounds/" + req.params.id);
            }
            });*/
    });
});

//destroy campgrounds route
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
    Campground.findById(req.params.id, async function(err, campground) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        try {
            await cloudinary.v2.uploader.destroy(campground.imageId);
            campground.remove();
            req.flash("success", "Campground deleted successfully!");
            res.redirect("/campgrounds");
        } catch (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

module.exports = router;