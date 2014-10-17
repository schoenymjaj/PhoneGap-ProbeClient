/*
All jquery mobile configuration will be set HERE
*/
$(document).on("mobileinit", function () {
    $.mobile.defaultPageTransition = "slide";

    $.mobile.loader.prototype.options.text = "Please wait...";
    $.mobile.loader.prototype.options.textVisible = true;
    $.mobile.loader.prototype.options.theme = "a";

    //for external panel
    $("#menu").panel();
});
