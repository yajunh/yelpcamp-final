window.onload = function () {
    var dropDown = document.getElementById("dropdown");
    dropDown.addEventListener("change", function() {
        var dropDownValue = dropDown.value;
        //choose here when you wanna refresh the page or if you wanna redirect to another page
        window.location = "/campgrounds?sort=" + dropDownValue;
    });
}