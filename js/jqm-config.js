/*
All jquery mobile configuration will be set HERE
*/
$(document).on("mobileinit", function () {
    $.mobile.defaultPageTransition = "slide";

    //for external panel
    $("#menu").panel();
});
