
/*
Converts XML text and returns an XML document
*/
StringtoXML = function (text) {
    console.log('func StringtoXML');
    if (window.ActiveXObject) {
        var doc = new ActiveXObject('Microsoft.XMLDOM');
        doc.async = 'false';
        doc.loadXML(text);
    } else {
        var parser = new DOMParser();
        var doc = parser.parseFromString(text, 'text/xml');
    }
    return doc;
}
/*
Get Query String Parms
*/
QryStr = function (key) {
    //console.log('func QryStr');
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars[key];
}

PopupArgs = function () {
    this.header = undefined;
    this.msg1 = undefined;
    this.msg2 = undefined;
    this.btnYesLabel = undefined;
    this.btnNoLabel = undefined;
    this.btnYesHandler = undefined;
    this.btnNoHandler = undefined;
    this.popupStyle = undefined;
}

/*
Var to determine mobile device
*/
var isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
    }
};

/*
display error page
*/
function handleAppError(msg, url, line) {
    console.log('func handleAppError');
    console.log('msg:' + msg);
    console.log('url:' + url);
    console.log('line:' + line);

    page = '<section id="errorpage" data-role="page" data-title="Error Page" data-theme="h">\
              <div data-role="header">\
            <a href="#home" data-icon="home">Home</a>\
                  <h1>Error Page</h1>\
              </div>\
              <article data-role="content">\
                <h3>Error Message</h3>\
                MSG\
                <h3>URL of Script</h3>\
                URLL\
                <h3>Line</h3>\
                LINE\
              </article>\
           </section>';

    var newPage = $(page);
    newPage.html(function (index, old) {
        return old
                .replace(/MSG/g, msg)
                .replace(/URLL/g, url)
                .replace(/LINE/g, line)
    }).appendTo($.mobile.pageContainer);
    $.mobile.changePage(newPage);

} //function handleAppError(msg, url, line) {
/*
Windows handler of all errors
*/
window.onerror = function (msg, url, line) {
    console.log('func oneerror');

    if (typeof msg == 'object') {
        //alert('onerror handled an error with message an Object')
        console.log('onerror handled an error with message an Object')
    } else if (msg == 'Script error.' && url == "" && line == 0)
    {
        console.log('Unknown script error, url="", line = 0');
    } else {
        handleAppError(msg, url, line);
    }
}

/*
Get root url
*/
GetRootUrl = function () {

    var originalRoot = '';
    //determine if the app is running within PhoneGap/Cordova shell
    var isCordovaApp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

    if (!isCordovaApp) {
        fullUrlSansQueryString = window.location.href.split('?')[0];
        originalRoot = fullUrlSansQueryString.substr(0, fullUrlSansQueryString.length - 16); //16 for Client/main.html
    } else {
        originalRoot = 'https://probe.azurewebsites.net/';
    }

    //SETUP URLs FOR AJAX CALLS TO PROBE SERVER
    if ($('body').data('env') == 'production') {

        if (isMobile.any()) {
            root = originalRoot.replace('localhost', '169.254.80.80'); //the IP rather than localhost is for the phone emulators
        } else {
            root = originalRoot; //localhost for testing in a browser
        }
    } else {
        if (isMobile.any()) {
            root = originalRoot.replace('localhost', '169.254.80.80');  //the IP rather than localhost is for the phone emulators
        } else {
            root = originalRoot; //localhost for testing in a browser
        }
    }

    if (QryStr('root') != undefined) {
        root = 'https://' + QryStr('root');
    }

    return root;

}

/*
    Will return 1 if the app is browser based and 2 if the app is native (cordova)
*/
GetMobileIndForAPI = function () {
    if (document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1) {
        return 2;
    } else {
        return 1;
    }
}


function DatePad(n) { return n < 10 ? "0" + n : n; }
/*
    This function will replace Date.toLocateDateString() since the support of this
    is different from browswer to browser
    Return date string 'MM/DD/YY'
*/
GetInCommmonLocaleDateString = function (dateobj) {
    return dateobj.getMonth() + 1 + "/" + DatePad(dateobj.getDate()) + "/" + dateobj.getFullYear();
}


