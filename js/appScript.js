/*
This function executes after the following events
pagebeforechange, pagebeforecreate, pagecreate, 
pageinit, pagebeforeshow, pageshow, pagechange
note: document ready occurs after all these.
*/
$(function () {

    // define the application
    var probeApp = {};

    // start the external panel
    $("[data-role=panel]").panel();
    $("[data-role=panel]").listview();
    $("[data-role=panel]").trigger("create");

    (function (app) {
        console.log('func app');
        /* Localstorage
        localStorage["GamePlay"]
        localStorage["Result"]
        localStorage["GameConfig"]
        localStorage["GamePlayQueueList"]
        localStorage["GamePlayQueue""]
        */

        /*
        Globals
        */
        var root = GetRootUrl();  //root directory of the web site serving mobile app (i.e. in-common-app.com)

        var probeVersion = '0.66';
        //alert('Probe Version: ' + probeVersion);
        var ProbeAPIurl = root + "api/";
        var ProbeMatchReporturl = root + "Reports/PlayerMatchSummary/";
        var ProbeTestReporturl = root + "Reports/PlayerTestDetail/";

        var currentQuestionNbr = 0;
        var NO_ANSWER = -1;
        var result = {};
        var GameState = { "Idle": 0, "Active": 1, "Submitted": 2, "ReadOnly": 3 };
        var SexType = { 'Unknow': 0, 'Male': 1, 'Female': 2 };
        var gameState = GameState.Idle;
        var gamePlayQueueMax = 10;  //number of submitted games save client-side
        var codeFromURL = undefined;
        var ajaxCallMaxTries = 3;  //number of tries app will make on an ajax call to server
        var aboutIFrameLoaded = false; //used specifically to display mobile loader (spinner) for About page
        var adjustedTopPadding = false //this is a hack to ensure top padding is correct the first time home page is rendered

        app.init = function () {
            //this occurs after document is ready (runs once)
            console.log('func app.init');
            app.bindings();
            //app.checkForStorage();
        };

        app.bindings = function () {

            /*
            document ready event
            Start the XMLHttpRequest (download xml and jason files) 
            when document ready event is triggered. Store documents in localStorage
            */
            $(document).on("ready", function (event) {  //jquery document ready event gets you jquery mobile styles, and data rendered
                console.log('event doc ready');

                //override the console.log if production (disable console)
                $(function () {
                    if ($('body').data('env') == 'production') {
                        console.log = function () { };
                    }
                });

                //determine if game play code has been feed from a query string parm
                codeFromURL = undefined;
                if (QryStr('code') != undefined) {
                    if (QryStr('code') != "") {
                        codeFromURL = decodeURI(QryStr('code'));
                    }
                }

                if (codeFromURL == undefined) {
                    app.SetHomePageInitialDisplay();
                }

                //bind "new game", and "go home events" - misc
                app.BindPageStaticEvents('misc');

                //bind all question page events - question paging buttons, and question answering button
                app.BindPageStaticEvents('#question');

                app.BindPageStaticEvents('#summary');

                //We need to check if a code was passed through the query string parms
                if (codeFromURL != undefined) {
                    app.SetHomePageStyle(false);
                    app.GetGamePlayServer(codeFromURL);
                }

                //We needed to do this because mysteriously the page padding dynamically changes occassionaly. The
                //top padding is done after the pageshow
                app.AdjustPagePaddingTop(); //will check to see that padding is not off

            }); //$(document).on

            //sets the padding when window is resized. Not going to happen on a phone.
            $(window).resize(function ()
            {
                app.SetHeaderImage();
            });

            /*
            the pageshow for info page bind and the iframe load bind are events bound just to show the user the spinner 
            during the about page load. This can take a while because of the round trip. Also need hack to check
            if iframe has loaded before pageshow. In this case we don't show the spinner
            */
            $(document).on('pageshow', '#info', function () {
                if (!aboutIFrameLoaded) {
                    $.mobile.loading('show'); //to show the spinner
                }
                aboutIFrameLoaded = false;
            });
            $('#infoFrameId').get(0).onload = function () {
                $.mobile.loading('hide'); //to show the spinner
                aboutIFrameLoaded = true;
            };

        }; //app.bindings = function () {

        /*
        Set Homepage Initial Display - Listview of active game and previous games played
        */
        app.SetHomePageInitialDisplay = function () {
            console.log('func app.SetHomePageInitialDisplay w:' + $(window).height() + ' h:' + $(window).height());
            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            app.SetHeaderImage(); //need to set header based on the size of the window

            //if the game state is idle; then we just want to make sure that the Add function is
            //enabled and the Cancel function is disabled
            if (gameState == GameState.Idle) {
                $("[data-icon='plus']").removeClass('ui-disabled');
                $("[data-icon='minus']").addClass('ui-disabled');
            }

            if (app.IsGameInProgress() || gamePlayListQueue.length > 0) {
                app.HomePageInitialDisplayListview();
            }// if (app.IsGameInProgress() || gamePlayListQueue > 0) {
            else {
                app.HomePageInitialDisplayInstruct();
            }

            app.BindPageStaticEvents('#home');

            //dynamically bind dynamic button to About page event
            $("#aboutBtn").click(function (event) {
                app.DisplayAboutPage();
            });

        };//app.SetHomePageInitialDisplay

        /*
        Set HomePageInitialDisplay- Game Listview
        */
        app.HomePageInitialDisplayListview = function () {
            console.log('func app.HomePageInitialDisplayListview');

            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            app.SetHomePageStyle(false);
            listViewHtml = '';
            listViewHtml += '<ul id="gameList" data-role="listview" data-split-icon="bar-chart-o" data-inset="true">';

            if (app.IsGameInProgress()) {
                $("[data-icon='plus']").addClass('ui-disabled');
                $("[data-icon='minus']").removeClass('ui-disabled');

                gamePlayData = app.GetGamePlayLocalStorage();
                result = app.GetResultLocalStorage();

                listViewHtml += '<li data-role="list-divider">Active Game<span class="ui-li-count">1</span></li>' +
                                '<li data-icon="star" data-gameplay="active"' +
                                ' data-index="-1"' +
                                '><a href="#"><span class="listviewGameName">' +
                                 gamePlayData.Name + '</span>' +
                                '<p class="listviewPlayerName">' +
                                 result.FirstName + '-' + result.NickName +
                                 '</p>' + '</a></li>';
            } else if (app.IsGamesInQueue(GameState.Active)) {
                $("[data-icon='plus']").addClass('ui-disabled');
                $("[data-icon='minus']").removeClass('ui-disabled');

                index = app.GetActiveGameIndexInQueue();

                listViewHtml += '<li data-role="list-divider">Active Game<span class="ui-li-count">1</span></li>' +
                                '<li data-icon="star" data-gameplay="active"' +
                                ' data-index="' + app.GetActiveGameIndexInQueue() + '"' +
                                '><a href="#"><span class="listviewGameName">' +
                                 gamePlayListQueue[index].Name + '</span>' +
                                '<p class="listviewPlayerName">' +
                                 gamePlayListQueue[index].FirstName + '-' + gamePlayListQueue[index].NickName +
                                 '</p>' + '</a></li>';

            } else {
                listViewHtml += '<li data-role="list-divider">No Active Game<span class="ui-li-count">0</span></li>'
            }//if (app.IsGameInProgress()) {


            if (app.IsGamesInQueue(GameState.Submitted)) {
                listViewHtml += '<li data-role="list-divider">Submitted Games<span class="ui-li-count">' + app.GetNbrGamesInQueue(GameState.Submitted) + '</span></li>';
            }
            gamePlayListQueue.forEach(function (value, index, ar) {

                //only submitted games are displayed in the list here.
                if (value.GameState == GameState.Submitted) {

                    listViewHtml += '<li data-icon="bar-chart-o" data-gameplay="submitted"' +
                                    ' data-index="' + index + '"' +
                                    ' data-gameplayid="' + value.GamePlayId + '"' +
                                    '><a href="#" class="gameResumeAction" ' +
                                    ' data-index="' + index + '"' +
                                    '><span class="listviewGameName">' +
                                     value.Name + '</span><br/>' +
                                     '<span class="listviewPlayerName">' +
                                     value.FirstName + '-' + value.NickName +
                                     '</span>' +
                                     '</a>' +
                                     '<a href="#" class="gameReportAction" ' +
                                    ' data-index="' + index + '"' +
                                     '></a>'
                    '</li>';

                }

            });


            listViewHtml += '</ul>';

            $('#homePageContent').html(listViewHtml);
            $('#homePageContent').css('color', 'black');
            $('#gameList').listview().listview("refresh").trigger("create");
            //$('#home').trigger('create');

        }//app.HomePageInitialDisplayListview

        /*
        Set HomePageInitialDisplay- Instructions
        */
        app.HomePageInitialDisplayInstruct = function () {
            console.log('func app.HomePageInitialDisplayInstruct');

            app.SetHomePageStyle(true); //the only time we set bckground image to full opacity -first time
            gameInstructions = '<h3 style="text-align: center">Welcome to the <i>In Common</i> App!</h3>' +
                               '<p>You will need a game code from a game organizer in order to play. Try the <a id="demoGameLink" data-democode="DEMO Match" href="#">demo game</a> if you don\'t have a code yet.</p>' +
                               '<p>To enter a game code, click the Add icon on the top menu bar.' +
                               ' After entering your code, you may have to wait a few moments for <i>In Common</i> to retrieve your game.</p>' +
                                '<p>Enter your first name and a nickname so you can be recognized. Answer each of the questions and click submit. Your game organizer will provide you with access to the game results.</p>' +
                                '<button id="aboutBtn" class="ui-btn" data-icon="book">Want to know more?</button>';

            $('#homePageContent').html(gameInstructions);
            $('#homePageContent').css('color', '#000000');
            $('#homePageContent').css('font-size', '1.2em');
            $('#homePageContent').css('font-weight', 'bold');
            $('#home').trigger('create');

            //let's kick start the 'DEMO Match' game
            $("#demoGameLink").click(function (event) {
                app.SetHomePageStyle(false);
                app.GetGamePlayServer($(this).attr("data-democode"));
            });
        }//app.HomePageInitialDisplayInstruct

        /*
        Update the home page with a text box to enter game play code
        */
        app.SetGamePlayCodePrompt = function () {
            console.log('func app.SetGamePlayCodePrompt');

            //Will fill in code if app started with code query string parm
            promptforCodeHtml =
                '<div style="margin-top: 10px"><label for="code" style="font-size: 1.2em; font-weight: bolder">Game Code</label>' +
                '<input name="code" id="gameCode" type="text" ' +
                'value="' +
                '" ' +
                'data-clear-btn="true">' +
                '<table><tr>' +
                '<td><button id="callGetPlays" class="ui-btn" data-icon="action">Find Game</button></td>' +
                '<td><button id="cancelGamePlay" class="ui-btn" data-icon="action">Cancel</button></td>' +
                '</tr></table></div>';


            $('#homePageContent').html(promptforCodeHtml);
            $('#homePageContent').trigger("create");

            $('#callGetPlays').click(function (event) {
                gameCode = $('#gameCode').val();
                if (gameCode.length > 0) { //check to see that a game code was entered
                    app.GetGamePlayServer($('#gameCode').val());
                } else {
                    app.popUpHelper('Error', 'The game code cannot be blank.', 'Please enter a game code.');
                }
            });

            $('#cancelGamePlay').click(function (event) {
                app.CancelGame();
            });

            $('#gameCode').focus(); //put the focus on the game code text input


        } //app.SetGamePlayCodePrompt

        /*
        Get GamePlay from Probe Server
        FYI. The GetJSON call to server is asynchronous. We wait for a good response, then
        call the next display (prompt for player info)
        */
        app.GetGamePlayServer = function (gameCode) {
            console.log('func app.GetGamePlayServer MNS');

            url = ProbeAPIurl + 'GamePlays/GetGamePlay/' + gameCode;
            $.mobile.loading('show'); //to show the spinner

            console.log('func app.GetGamePlayServer AJAX url:' + url);
            $.getJSON(url)
                .done(function (gamePlayData) {
                    console.log('return GetGamePlay success');

                    // On success, 'data' contains a GamePlay JSON object
                    if (gamePlayData.errorid == undefined) {
                        //SUCCESS
                        //We've got the game play data; we also need the game configuration
                        url = ProbeAPIurl + 'GameConfigurations/GetGameConfiguration/' + gamePlayData.Code;
                        console.log('func app.GetGamePlayServer AJAX url:' + url);
                        $.getJSON(url)
                            .done(function (gameConfig) {
                                console.log('return GetGameConfiguration success');

                                $.mobile.loading('hide'); //to hide the spinner

                                app.PutGameConfigLocalStorage(gameConfig);
                                if (gameConfig = {}) {

                                    if (!app.IsGameSubmitted(gamePlayData.Id) || !$.parseJSON(app.GetConfigValue('DeviceCanPlayGameOnlyOnce'))) {
                                        app.InitalizeGamePlay(gamePlayData);
                                        app.SetGamePlayPlayerPrompt(); //SUCCESS - NEXT STEP IS FOR PLAYER TO ENTER PLAYER INFO
                                    } else {
                                        app.popUpHelper('Error', 'Game \'' + gamePlayData.Name + '\' has already been submitted.', 'A device cannot submit the same game twice for this game type.');
                                    }//if (!app.IsGameSubmitted(gamePlayData.Id))

                                } else {
                                    app.popUpHelper("Error", 'Configuration could not be found for Game \'' + gamePlayData.Name + '\'',null);
                                }//if (gameConfig = {})

                            })
                            .fail(function (jqxhr, textStatus, error) {
                                console.log('return GetGameConfiguration fail');
                                $.mobile.loading('hide'); //to hide the spinner

                                probeError = error;
                                if (probeError == "") {
                                    probeError = "The In Common web server could not be found. There may be connectivity issues."
                                }
                                var err = textStatus + ", " + probeError;

                                app.popUpHelper("Error", 'Request Failed:' + err,null);
                            });
                        
                    } else {
                        //THERE WAS A PROBE BUSINESS ERROR
                        $.mobile.loading('hide'); //to hide the spinner
                        errorMessage = gamePlayData.errormessage;
                        switch (gamePlayData.errorid) {
                            case 1:
                                errorMessage = 'There is no game found for the code entered.';
                                break;
                            case 2:
                                errorMessage = 'The game found for the entered code is no longer active.';
                                break;
                            default:
                                errorMessage = gamePlayData.errormessage;
                                break;
                        }
                        app.popUpHelper('Error', errorMessage, 'Please enter the correct code.');
                    }

                }) //done
              .fail(function (jqxhr, textStatus, error) {
                  console.log('return GetGamePlay fail');
                  $.mobile.loading('hide'); //to hide the spinner

                  probeError = error;
                  if (probeError == "") {
                      probeError = "The In Common web server could not be found. There may be connectivity issues."
                  }
                  var err = textStatus + ", " + probeError;
                  app.popUpHelper("Error", 'Request Failed:' + err,null);
              }); //fail

        };//app.GetGamePlayServer

        /*
        (RETURNS ReportClientAccess indicator - true or false)
        result["ClientReportAccess"] is recorded
        result["PlayerCount"] is recorded
        Get GamePlayStatus from Probe Server 
        FYI. The GetJSON call to server is synchronous
        */
        app.GetGamePlayStatusServer = function (gameCode) {
            console.log('func app.GetGamePlayStatusServer');
            var clientReportAccess = false; //global within the GetGamePlayStatusServer function
            var ajaxCallTries = 0;
            var ajaxIsSuccessful = true;
            var errorMessage = "";

            do {
                errorMessage = ""; //error mess must be blank for each ajax try
                ajaxCallTries++;   //counting ajax tries
                console.log('func app.GetGamePlayStatusServer ajax try:' + ajaxCallTries);

                url = ProbeAPIurl + 'GamePlays/GetGamePlayByCode/' + gameCode;
                console.log('func app.GetGamePlayStatusServer AJAX url:' + url);
                app.ajaxHelper(url, 'GET', null)
                  .done(function (gamePlayStatusData) {
                      console.log('return GetGamePlayStatus success');

                      // On success, 'data' contains a GamePlay(only one level) JSON object
                      if (gamePlayStatusData.errorid == undefined) {
                          //SUCCESS
                          result = app.GetResultLocalStorage(result);
                          clientReportAccess = gamePlayStatusData.ClientReportAccess;
                          result["ClientReportAccess"] = gamePlayStatusData.ClientReportAccess;;
                          result["PlayerCount"] = gamePlayStatusData.PlayerCount;
                          app.PutResultLocalStorage(result);
                          ajaxIsSuccessful = true;
                      } else {
                          //THERE WAS A PROBE BUSINESS ERROR
                          errorMessage = gamePlayStatusData.errormessage;
                          switch (gamePlayStatusData.errorid) {
                              case 1:
                                  errorMessage = 'There is no game found for the id entered.';
                                  break;
                              default:
                                  errorMessage = gamePlayStatusData.errormessage;
                                  break;
                          }
                          ajaxIsSuccessful = false;

                      }

                  }) //done
                  .fail(function (jqxhr, textStatus, error) {
                      console.log('return GetGamePlayStatus fail');
                      probeError = error;
                      if (probeError == "") {
                          probeError = "The In Common web server could not be found. There may be connectivity issues."
                      }
                      errorMessage = textStatus + ", " + probeError;
                      ajaxIsSuccessful = false;

                  }); //fail

            } while (!ajaxIsSuccessful && ajaxCallTries < ajaxCallMaxTries)


            if (errorMessage == "") {
                return clientReportAccess;
            } else {
                throw errorMessage;
            }

            
        };//app.GetGamePlayStatusServer

        /*
        Submit Player and GamePlay Answers for Player
        */
        app.PostGamePlayAnswersServer = function () {
            console.log('app.PostGamePlayAnswersServer');

            returnErrMsg = null;

            result = app.GetResultLocalStorage();
            //create player object for POST
            playerDTOin = {};
            playerDTOin["GamePlayId"] = result["GamePlayId"];
            playerDTOin["GameCode"] = result["GameCode"];
            playerDTOin["FirstName"] = result["FirstName"];
            playerDTOin["NickName"] = result["NickName"];
            (result["LastName"] != {}) ? playerDTOin["LastName"] : result["LastName"]; //curently last name will always be empty 8/1/14
            playerDTOin["Sex"] = result["Sex"];

            url = ProbeAPIurl + 'Players/PostPlayer';
            console.log('func app.PostGamePlayAnswersServer AJAX url:' + url);
            app.ajaxHelper(url, 'POST', playerDTOin)
                .done(function (playerDTO) {
                    console.log('return POSTPlayer success');
                    // On success, 'playerDTO' contains a Player object
                    if (playerDTO.errorid == undefined) {
                        //SUCCESS
                        gamePlayData = app.GetGamePlayLocalStorage();
                        result = app.GetResultLocalStorage();
                        result["PlayerId"] = playerDTO.Id; //set player id from probe DB (just added)
                        app.PutResultLocalStorage(result);

                        //create gamePlayAnswers array object for POST
                        var gamePlayAnswers = new Array();
                        for (i = 0; i < gamePlayData.GameQuestions.length; i++) {
                            gamePlayAnswers[i] = {};
                            gamePlayAnswers[i]["PlayerId"] = playerDTO.Id;
                            gamePlayAnswers[i]["GameCode"] = result.GameCode;
                            gamePlayAnswers[i]["ChoiceId"] = result.GameQuestions[i]["SelChoiceId"];
                        }

                        url = ProbeAPIurl + 'GamePlayAnswers/PostGamePlayAnswers';
                    } else
                    {
                        //THERE WAS A PROBE BUSINESS ERROR
                        switch (playerDTO.errorid) {
                            case 3:
                                errorMessage = 'Your player name (first name - nickname) is already in use. ' + 
                                    'Please enter another nickname for this game. Select the active game, modify your nickname, and resubmit';
                                break;
                            default:
                                errorMessage = playerDTO.errormessage;
                                break;
                        }
                        return returnErrMsg = errorMessage;
                    }//if (playerDTO.errorid == undefined) {

                    console.log('func app.PostGamePlayAnswersServer AJAX success url:' + url);
                    app.ajaxHelper(url, 'POST', gamePlayAnswers)
                        .done(function (item) {
                            console.log('return POSTGamePlayAnswers success');

                            // On success, 'gamePlayAnswers' contains a GamePlayAnswers object
                            if (gamePlayAnswers.errorid == undefined) {
                                //SUCCESS

                                returnErrMsg = null; //successful return
                            } else {
                                //THERE WAS A PROBE BUSINESS ERROR
                                return returnErrMsg = gamePlayAnswers.errormessage + '(Error #: ' + gamePlayAnswers.errorid + ')';

                            }//if (gamePlayAnswers.errorid == undefined) {

                        })
                        .fail(function (jqxhr, textStatus, error) {
                            console.log('return POSTGamePlayAnswers fail');

                            probeError = error;
                            if (probeError == "") {
                                probeError = "The In Common web server could not be found. There may be connectivity issues."
                            }
                            return returnErrMsg = textStatus + ", " + probeError;
                        });//fail for POST GamePlayAnswers
                })//done for POST Player
                .fail(function (jqxhr, textStatus, error) {
                    console.log('return POSTPlayer fail');

                    probeError = error;
                    if (probeError == "") {
                        probeError = "The In Common web server could not be found. There may be connectivity issues."
                    }
                    return returnErrMsg = textStatus + ", " + probeError;
                }); //fail for POST Player

            return returnErrMsg;
        };//app.PostGamePlayAnswersServer
        
        /*
        Update the home page with the game play information and a prompt for first name and nick name 
        before starting the game
        */
        app.SetGamePlayPlayerPrompt = function () {
            console.log('func app.SetGamePlayPlayerPrompt');

            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            gameDescription = 'No Description';
            if (gamePlayData.Description != null) gameDescription = gamePlayData.Description;

            promptforPlayerHtml =
                '<div style="margin-top: 10px; font-weight:bold">' +
                '<label for="gpName" style="font-size: 1.2em; font-weight: bolder">(' + gamePlayData.GameType + ' Game)' +
                '</label>' +
                '<textarea name="gpName" id="gpName" disabled="disabled">' + gamePlayData.Name + ' (' +
                gameDescription + ')</textarea>' +
                '<label for="C" style="font-size: 1.2em; font-weight: bolder">First Name</label>' +
                '<input name="firstName" id="firstName" type="text" value="" data-clear-btn="true">' +
                '<label for="nickName" style="font-size: 1.2em; font-weight: bolder">Nick Name</label>' +
                '<input name="nickName" id="nickName" type="text" value="" data-clear-btn="true">' +
                '<fieldset data-role="controlgroup" data-type="horizontal">' +
                '<legend style="font-size: 1.2em; font-weight: bolder">Sex</legend>' +
                '<input name="sex" id="sex-male" type="radio" checked="checked" value="on">' +
                '<label for="sex-male">Male</label>' +
                '<input name="sex" id="sex-female" type="radio">' +
                '<label for="sex-female">Female</label>' +
                '</fieldset>' +
                '<table><tr>' +
                '<td><button id="startGamePlay" class="ui-btn" data-icon="action">Start Game</button></td>' +
                '<td><button id="cancelGamePlay" class="ui-btn" data-icon="action">Cancel</button></td>' +
                '<td><button id="reportGamePlay" class="ui-btn" data-icon="action">Results</button></td>' +
                '</tr></table></div>';

            $('#homePageContent').html(promptforPlayerHtml);

            /*
            Dynamically update the Player Prompt based on the GameState
            */
            //$('#firstName').attr("disabled", "");
            //$('#nickName').attr("disabled", "");
            $('#reportGamePlay').hide();
            if (gameState != GameState.Idle) {
                $("input[name='firstName']").attr('value', result.FirstName);
                $("input[name='nickName']").attr('value', result.NickName);
                if (result.Sex == SexType.Male) {
                    $('#sex-male').attr("checked", true);
                    $('#sex-female').attr("checked", false);
                } else {
                    $('#sex-male').attr("checked", false);
                    $('#sex-female').attr("checked", true);
                }

                if (gameState == GameState.ReadOnly) {
                    $('#firstName').attr("disabled", "disabled");
                    $('#nickName').attr("disabled", "disabled");

                    /*
                    Display the Report Button - it will only be enabled if the GamePlay.ClientReportAccess 
                    field is TRUE.
                    */
                    if (result.ClientReportAccess) {
                        $('#reportGamePlay').removeClass('ui-disabled')
                    } else {
                        $('#reportGamePlay').addClass('ui-disabled')

                    }
                    $('#reportGamePlay').show();

                    //$('[data-role="controlgroup"]').addClass('ui-disabled') //works but the legend is also greyed out
                    $('#startGamePlay').text('View Game');
                } else {
                    $('#startGamePlay').text('Resume Game');
                }

                //$('#cancelGamePlay').hide(); //if game is not idle; we don't want to give the user the cancel ability here (too easy)
            }//if (gameState != GameState.Idle)

            $('#homePageContent').trigger("create");
            if (gameState == GameState.ReadOnly) {
                $('#startGamePlay,#cancelGamePlay,#reportGamePlay').addClass('GameReadOnlyButtons');
            }

            $('#firstName').focus(); //put the focus on the firstname text input

            //toggle the sex radio boxes
            $('input[name="sex"]').on('change', function () {
                if ($(this).attr("id") == "sex-male") {
                    $('#sex-male').attr("checked", true);
                    $('#sex-female').attr("checked", false);
                } else {
                    $('#sex-male').attr("checked", false);
                    $('#sex-female').attr("checked", true);
                }
            });

            //bind event handlers to the start and cancel buttons
            $('#startGamePlay').click(function (event) {

                //error handling 
                if ($('#firstName').val().length < 3 ||
                    $('#firstName').val().length > 10 ||
                    $('#firstName').val().indexOf(" ") != -1)
                {
                    app.popUpHelper('Error', 'The first name must be between 3 and 10 characters and contain no spaces.', 'Please enter a first name again.');
                    return;
                }

                if ($('#nickName').val().length < 3 ||
                    $('#nickName').val().length > 10 ||
                    $('#nickName').val().indexOf(" ") != -1)
                {
                    app.popUpHelper('Error', 'The nick name must be between 3 and 10 characters and contain no spaces.', 'Please enter a nick name again.');
                    return;
                }

                //result = app.GetResultLocalStorage();
                result["FirstName"] = $('#firstName').val()
                result["NickName"] = $('#nickName').val()
                if ($('#sex-male').attr("checked") == "checked") {
                    result["Sex"] = SexType.Male;
                } else {
                    result["Sex"] = SexType.Female;
                }

                app.PutResultLocalStorage(result);

                app.StartGame(0);

            });

            $('#cancelGamePlay').click(function (event) {

                gamePlayData = app.GetGamePlayLocalStorage();
                /*
                if the game is active; then we want to ask if they really want to cancel. 
                If the game is NOT active. Then we do a CancelGame (this does not harm since a submitted game is queued
                */
                if (app.IsGameInProgress()) {
                    app.confirmDialog('Cancel', 'You\'re about to cancel the Game <span class="popupGameName">'
                                                 + gamePlayData.Name
                                                 + '</span> that\'s in progress.<p>Are you sure?</p>',
                    function () {
                        app.CancelGame();
                    });
                } else {
                    app.CancelGame();
                }


            });

            $('#reportGamePlay').click(function (event) {
                app.DisplayReportPage();
            });

        };

        /*
        Initialize the GamePlay data structure, add answer property to question, and put 
        in local storage
        */
        app.InitalizeGamePlay = function (JSONdata) {
            console.log('func app.InitalizeGamePlay');

            result["GamePlayId"] = JSONdata.Id;
            result["GameCode"] = JSONdata.Code;
            result["FirstName"] = {};
            result["LastName"] = {};
            result["NickName"] = {};
            result["Sex"] = SexType.Male;
            result["GameQuestions"] = new Array();
            result["DirtyFlag"] = true;

            JSONdata.GameQuestions.forEach(function (value, index, ar) {
                //value.Question["Answer"] = NO_ANSWER;  //NOT NEEDED FOR 
                result["GameQuestions"][index] = {};
                result["GameQuestions"][index]["QuestionId"] = value.Question.$id;
                result["GameQuestions"][index]["SelChoiceId"] = NO_ANSWER;
            });

            app.PutGamePlayLocalStorage(JSONdata);
            app.PutResultLocalStorage(result); //hold all the results

        };//app.InitalizeGamePlay 

        /*
        Create a test page of the api/GetPlays/{code} dump - accepts the JSON
        data from an ajax call to the Probe API and parse it, and create a test page
        */
        app.CreateGamePlayTestPage = function (JSONdata) {
            console.log('func app.CreateGamePlayTestPage');

            testHtml = 'GamePlayName:' + JSONdata.Name + '<br/>' +
           'GameName:' + JSONdata.GameName + '<br/>' +
           'Code:' + JSONdata.Code + '<br/>';

            JSONdata.GameQuestions.forEach(function (value, index, ar) {
                testHtml += 'Question ' + index + 1 + ':' + value.Question.Text + '<br/>';

                value.Question.Choices.forEach(function (value, index, ar) {
                    testHtml += 'Choice ' + index + 1 + ':' + value.Text + '<br/>';
                });
            });

            page = '<section id="testpage" data-role="page" data-title="Test Page" data-theme="a">' +
                   '<div data-role="header">' +
                    '<h1>Test Page</h1>' +
                    '</div>' +
                    '<article data-role="content">' +
                    testHtml +
                    '</article></section>';

            var newPage = $(page);

            newPage.appendTo($.mobile.pageContainer);
            $(":mobile-pagecontainer").pagecontainer('change', newPage, { transition: 'none' });


        }; //app.CreateGetPlayTestPage

        /*
        Render the question page for the GameQuestion[questionNbr] in the GamePlay dataset
        */
        app.SetQuestionPage = function (questionNbr, transitionType) {
            console.log('func app.SetQuestionPage');

            $('footer').show(); //show footer nav bar on the page

            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            $('#choiceListLegend').html('<span class="bodyText">Question #' + (questionNbr + 1) + ' of ' + app.NbrQuestions() + '</span>');

            question = gamePlayData.GameQuestions[questionNbr].Question;
            questionText = '<span class="bodyText">' + question.Text + '?</span>';

            fieldset = '<fieldset data-role="controlgroup">';
            question.Choices.forEach(function (value, index, ar) {
                choiceText = value.Text;
                choiceName = value.Name;
                selectChoiceId = value.Id;

                checkedStr = "";
                if (result["GameQuestions"][questionNbr]["SelChoiceId"] == selectChoiceId) checkedStr = ' checked';

                fieldset +=
                '<input name="choice" id="choice-' + selectChoiceId + '" type="radio" data-theme="a"' + checkedStr + '>'

                fieldset +=
                '<label for="choice-' + selectChoiceId + '" data-theme="a">' + choiceText + '</label>';
            });
            fieldset += '</fieldset>'

            $('#questionText').html(questionText);
            $('#choiceList').html(fieldset);

            if (gameState != GameState.ReadOnly)
            {
                $("input[name ='choice']").checkboxradio().checkboxradio('enable').trigger("create");

            } else {
                $("input[name ='choice']").checkboxradio().checkboxradio('disable').trigger("create");
            }

            //Style choice list with proper spacing
            $('#question [data-role="controlgroup"]').css("margin", ".5em 0")
            $('#question .ui-radio').css("margin", "0");

            //$('#question').trigger('create');

            $("input[name ='choice']").on('change', function () {

                radioButtonSelectedID = $('input[name="choice"]:checked').attr('id'); //id of the radio box

                gamePlayData = app.GetGamePlayLocalStorage();
                //set choice number of answer
                result["GameQuestions"][currentQuestionNbr]["SelChoiceId"] = radioButtonSelectedID.substr(7, radioButtonSelectedID.length - 6);
                app.PutResultLocalStorage(result);
                app.SetBottomNavButtons(true, true, true, true);

            }); //$("input[name ='choice']").on('change', function () {

            app.SetBottomNavButtons(true, true, true, true); //set summary and submit button to enabled

            $(":mobile-pagecontainer").pagecontainer('change', '#question', { transition: transitionType });

        }; //app.SetQuestionPage

        /*
        Render the summary page
        */
        app.SetSummaryPage = function () {
            console.log('func app.SetSummaryPage');

            $('footer').show(); //show footer nav bar on the page

            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            summaryText = '<span class="bodyText">Questions - ' + app.NbrQuestionsAnswered() + ' out of ' + app.NbrQuestions() + ' answered</span>'


            listViewHtml = '<ul data-role="listview" data-inset="true">';

            gamePlayData.GameQuestions.forEach(function (value, index, ar) {

                listViewHtml += '<li' +
                ((result.GameQuestions[index]["SelChoiceId"] == NO_ANSWER) ? ' data-icon="alert" ' : ' data-icon="check" ') +
                ' data-qnum=' + index + '>' +
                '<a href="#">' +
                (index + 1) + '. ' +
                value.Question.Text + '?' +
                '</a></li>';

            });
            listViewHtml += '</ul>';

            $('#summaryText h2').html(summaryText);
            $('#questionList').html(listViewHtml);

            $('#questionList').listview().trigger("create")
            $('#summary article').css("overflow", "hidden");

            //setup event handler for summary page listview to return to a specific question
            $('[data-qnum]').click(function (event) {
                currentQuestionNbr = parseInt(this.attributes["data-qnum"].value);
                app.SetQuestionPage(currentQuestionNbr, 'none');
            });

            app.SetBottomNavButtons(false, true, false, false); //set summary to disabled and submit button to enabled

            $(":mobile-pagecontainer").pagecontainer('change', '#summary');


        };//app.SetSummaryPage

        /*
        Bind Page Events
        */
        app.BindPageStaticEvents = function (pageSelector) {
            console.log('func app.BindPageStaticEvents');

            switch (pageSelector) {
                case "#home":
                    $('[data-gameplay="active"]').click(function (event) {

                        index = this.attributes["data-index"].value;

                        //if index not -1; then we need to pop from queue. This puts active game back in the current game storage
                        if (index != -1) {
                            app.PopQueueGamePlays();
                        }

                        app.ResumeGame(GameState.Active);
                    }); //$('[data-gameplay="active"]').click

                    $('[data-gameplay="submitted"] .gameResumeAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        //copy gameplay out of queue into current gameplay (even though it's read-only)
                        setTimeout(function () {
                            app.GameResumeAction(index);
                        }, 500);

                    }); //$('[data-gameplay="submitted" .gameResumeAction]').click

                    $('[data-gameplay="submitted"] .gameReportAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        setTimeout(function () {
                            app.GameReportAction(index);
                        }, 500);

                    }); //$('[data-gameplay="submitted" .gameReportAction]').click


                    break;
                case "#question":

                    //FYI. jquery would not work with #question as a pre-cursor to #backButton
                    //$('#qfooter #backButton').click(function (event) { MNS DEBUG
                    $('.backButton').click(function (event) {
                            (currentQuestionNbr == 0) ? currentQuestionNbr = result.GameQuestions.length - 1 : currentQuestionNbr--;
                        app.SetQuestionPage(currentQuestionNbr, 'none');
                    });

                    $('.summaryButton').click(function (event) {
                        app.SetSummaryPage();
                    });

                    //$('#qfooter #nextButton').click(function (event) { //MNS DEBUG
                    $('.nextButton').click(function (event) {
                            (currentQuestionNbr == result.GameQuestions.length - 1) ? currentQuestionNbr = 0 : currentQuestionNbr++;
                        app.SetQuestionPage(currentQuestionNbr, 'none');
                    });

                    break;
                case "#summary":

                    $('.submitButton').click(function (event) {

                        app.confirmDialog('Submit','You\'re about to submit the Game <span class="popupGameName">' + gamePlayData.Name + '</span>.' + '<p>Are you sure?</p>',
                            function () {
                                $.mobile.loading('show'); //to show the spinner
                                setTimeout(function () { app.ConfirmSubmit(); }, 1000); //give a 1 second delay. So the user see's the spinner when submitting

                        });

                    });//$('.submitButton').click

                    break;

                case "misc":

                    //bind all GO HOME events
                    $('[data-icon="home"]').click(function (event) {
                        $('#menu').panel("close"); //if menu open
                        app.SetHomePageStyle(false);
                        app.SetHomePageInitialDisplay();
                        $(":mobile-pagecontainer").pagecontainer('change', '#home');
                       
                    });

                    //bind all "Add Game" (plus) icons events
                    $("[data-icon='plus'],#newGame").click(function (event) {
                        app.GameAddAction();
                    });

                    //bind all "Cancel Game" (plus) icons events
                    $("[data-icon='minus']").click(function (event) {

                        if (!app.IsGameInProgress() && !app.IsGamesInQueue(GameState.Active))
                        {
                            app.popUpHelper('Error', 'There\'s no Game in progress',null);
                            return
                        } else {
                            //if the active game is on the queue; then lets pop it to the current and cancel it.
                            if (app.IsGamesInQueue(GameState.Active)) {
                                app.PopQueueGamePlays();
                            }

                            gamePlayData = app.GetGamePlayLocalStorage();
                            result = app.GetResultLocalStorage();
                            app.confirmDialog('Cancel', 'You\'re about to cancel the Game <span class="popupGameName">'
                                + gamePlayData.Name + ' (' + result.FirstName + '-' + result.NickName
                                + ')</span> that\'s in progress.<p>Are you sure?</p>',
                                function () {
                                    app.CancelGame();
                            });

                        }

                    });

                    //bind the menu "About" event
                    $("[data-icon='book']").click(function (event) {
                        app.DisplayAboutPage();
                    });

                    break;
            }
        };//app.BindPageStaticEvents 

        /*
        Game Add Action
        */
        app.GameAddAction = function () {
            console.log('func app.GameAddAction');

            $('#menu').panel("close"); //if menu open

            if (app.IsGameInProgress()) {
                gamePlayData = app.GetGamePlayLocalStorage();
                app.popUpHelper('Error', 'Game \'' + gamePlayData.Name + '\' is in progress', 'You must cancel this game first to start a new game.');
                return;
            } else if (app.IsGamesInQueue(GameState.Active)) {
                gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();
                index = app.GetActiveGameIndexInQueue();
                app.popUpHelper('Error', 'Game \'' + gamePlayListQueue[index].Name + '\' is in progress', 'You must cancel this game first to start a new game.');
                return;
            }

            /*
            the current game is not active; nor is a queued game active. So we can add a game
            */
            $("[data-icon='plus']").addClass('ui-disabled');
            $("[data-icon='minus']").removeClass('ui-disabled');
            app.SetHomePageStyle(false);
            app.SetGamePlayCodePrompt();
            gameState = GameState.Idle;
            $(":mobile-pagecontainer").pagecontainer('change', '#home');

        }//app.GameAddAction

        /*
        Game Resume Action (from Submitted State)
        */
        app.GameResumeAction = function (index) {
            console.log('func app.GameResumeAction');

            //get the game from the queue first
            gamePlayQueueBeforPush = app.GetGamePlayQueueLocalStorage();
            gamePlayDataBeforePush = gamePlayQueueBeforPush[index].GamePlay;
            resultBeforePush = gamePlayQueueBeforPush[index].Result;

            //if game is in progess, then we want to push active game onto the queue
            if (app.IsGameInProgress()) {
                app.PushQueueGamePlays(GameState.Active);
            }

            app.PutGamePlayLocalStorage(gamePlayDataBeforePush);
            app.PutResultLocalStorage(resultBeforePush);

            try {
                app.GetGamePlayStatusServer(resultBeforePush.GameCode);
                $.mobile.loading('hide'); //to show the spinner
            } catch (err) {
                $.mobile.loading('hide'); //to show the spinner
                app.popUpHelper("Error", "GetGamePlayStatusServer: " + err);
            }

            //set the home page for read-only view
            gameState = GameState.ReadOnly;
            app.SetHomePageStyle(false); //set backgrounded faded
            app.ResumeGame(GameState.ReadOnly); //resume game read-only
            $.mobile.loading('hide'); //to show the spinner
        }//

        /*
        Game Report Action (from Submitted State)
        */
        app.GameReportAction = function (index) {
            console.log('func app.GameReportAction');

            //if game is in progess, then we want to push active game onto the queue
            if (app.IsGameInProgress()) {
                app.PushQueueGamePlays(GameState.Active);
            }

            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
            gamePlayData = gamePlayQueue[index].GamePlay;
            result = gamePlayQueue[index].Result;
            app.PutGamePlayLocalStorage(gamePlayData);
            app.PutResultLocalStorage(result);

            try {
                if (app.GetGamePlayStatusServer(result.GameCode)) {
                    $.mobile.loading('hide'); //to show the spinner
                    app.DisplayReportPage();
                } else {
                    $.mobile.loading('hide'); //to show the spinner
                    app.popUpHelper("Info", "The game organizer has not made game results accessible to the players yet.");
                }
            } catch (err) {
                $.mobile.loading('hide'); //to show the spinner
                app.popUpHelper("Error", "GetGamePlayStatusServer: " + err);
            }
            $.mobile.loading('hide'); //to show the spinner
        }//app.GameReportAction

        /*
        Confirm Submit Logic
        */
        app.ConfirmSubmit = function () {
            result = app.GetResultLocalStorage();
            console.log('func submitButton.click - GamePlayId:' + result["GamePlayId"]);
            returnErrMsg = app.PostGamePlayAnswersServer();
            console.log('completed app.PostGamePlayAnswersServer');
            if (returnErrMsg == null) {
                app.SubmitSuccess();
                console.log('success - all done');
            }

            app.SetHomePageStyle(false);
            app.SetHomePageInitialDisplay();
            $(":mobile-pagecontainer").pagecontainer('change', '#home', { transition: 'none' });

            $.mobile.loading('hide'); //hide the spinner
            //depending on success or failure; we display a different popup over the home page
            if (returnErrMsg == null) {
                app.popUpHelper('Info', 'The submission of the Game<br/><span class="popupGameName">' + gamePlayData.Name + '</span><br/> was successful.', null);
            } else {
                app.popUpHelper('Error', 'The submission of the Game<br/><span class="popupGameName">' + gamePlayData.Name + '</span><br/> was NOT successful.<p>' + returnErrMsg + '</p>', null);
            }
        }//app.ConfirmSubmit

        /*
        AdjustPagePaddingTop
        */
        app.AdjustPagePaddingTop = function () {
            console.log('func AdjustPagePaddingTop');
            paddingtop = "44px";
            paddingbottom = "58px";
            badPaddingThreshold = 30;

            //we will only adjust once and only for the home page if the top-padding is less than 30
            if (!adjustedTopPadding) {
                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == "home") {
                    if (parseInt($('#home').css("padding-top")) < badPaddingThreshold) {
                        $('#home').css("padding-top", paddingtop);
                        adjustedTopPadding = true; //this won't be needed again.
                        console.log('change the padding to ' + paddingtop);
                    }
                }

            }
        }//app.AdjustPagePaddingTop


        app.SetHeaderImage = function () {

            width = $(window).width();
            height = $(window).height();

            /*
             responsive header logo image   
             */
            if (height >= 2560)
            {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 2559 && height >= 1912) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 1911 && height >= 1600) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 1599 && height >= 1180) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 1179 && height >= 1024) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 1023 && height >= 800) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 799 && height >= 480) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            } else if (height <= 479 && height >= 0) {
                $('header img').attr("src", "./images/header/header180x40.jpg")
            }

        }

        /*
        Setup home page
        arguments
        initialState = true   //setup for original
                     = false //setup for prompts
        */
        app.SetHomePageStyle = function (initialState) {
            console.log('func app.SetHomePageStyle');
            $('footer').hide(); //hide footer on the page

            //$('#home').css("padding-top", "42px");

            //$('#home').removeClass('backimageInCommon');
            //$('#home').addClass('backimageInCommon');

            app.SetBottomNavButtons(false, false, false, false); //From the home page. Always set the bottom nav bar bottoms to disabled.

        };

        /*
        Cancel game in progress
        */
        app.CancelGame = function () {
            console.log('func app.CancelGame');

            $('#menu').panel("close"); //if calling from a panel
            localStorage.removeItem("GamePlay");
            localStorage.removeItem("Result");
            app.SetHomePageStyle(true);
            $('#homePageContent').html('');
            $('#homePageContent').trigger("create");
            app.EnableNewGame();
            app.SetHomePageInitialDisplay();
            $(":mobile-pagecontainer").pagecontainer('change', '#home', { transition: 'none' });

        };

        /*
        Enable New Game
        */
        app.EnableNewGame = function() {
            $("[data-icon='plus']").removeClass('ui-disabled');
            $("[data-icon='minus']").addClass('ui-disabled');
            gameState = GameState.Idle;
        }

        /*
        Start game
        */
        app.StartGame = function (questionNbr) {
            console.log('func app.StartGame');

            /*
            we are starting up the game. If the game state is original idle; then we
            know its a new game and we are going active, otherwise we are going to stary in read only state
            */
            if (gameState == GameState.Idle) {
                gameState = GameState.Active;
            } else if (gameState == GameState.ReadOnly) {
                gameState = GameState.ReadOnly;
            }
            currentQuestionNbr = questionNbr;
            app.SetQuestionPage(currentQuestionNbr, 'none')
        };

        /*
        Resume game
        arguments:
        gameStateArg
        */
        app.ResumeGame = function (gameStateArg) {
            console.log('func app.ResumeGame');

            gameState = gameStateArg;
            app.SetGamePlayPlayerPrompt();
        };

        /*
        Display the About (Info) page 
        */
        app.DisplayAboutPage = function () {
            console.log('func app.DisplayAboutPage');

            url = root + 'Home/About/1'; //insert the portal About (for mobil) page.
            $('#infoFrameId').attr("src", url);
            setTimeout(function () {

                $(':mobile-pagecontainer').pagecontainer('change', '#info', { transition: 'none' });
                //$('#info').css("padding-top", "3em");

            }, 500);
        }

        /*
        Display the report page
        */
        app.DisplayReportPage = function () {
            console.log('func app.DisplayReportPage');

                gamePlayData = app.GetGamePlayLocalStorage();
                result = app.GetResultLocalStorage();

                if (gamePlayData.GameType == "Match") {

                    //for match report - we have to check that there are least 2 players
                    if (result.PlayerCount >= 2) {
                        $.mobile.loading('show'); //MNS

                        url = ProbeMatchReporturl +
                            result.GamePlayId +
                            '/' + result.GameCode +
                            '/' + result.PlayerId + '/1'; //with mobile indicator attached
                        window.location = url;

                    }
                    else {
                        app.popUpHelper("Info", "There are not enough players that have submitted their games to report on the results. Please try again later.");
                    }

                } else { //Test Type
                    $.mobile.loading('show'); //MNS

                    url = ProbeTestReporturl +
                        result.GamePlayId +
                        '/' + result.GameCode +
                        '/' + result.PlayerId + '/1'; //with mobile indicator attached
                    window.location = url;
                }

        };//app.DisplayReportPage

        /*
        returns true if game is in progress
        */
        app.IsGameInProgress = function () {
            console.log('func app.IsGameInProgress');

            gameInProgress = false;
            result = app.GetResultLocalStorage();
            if (result != {}) {
                if (result.DirtyFlag) {
                    gameInProgress = true;
                }
            }
            return gameInProgress;
        };

        /*
        returns true if all questions are answered, otherwise it returns false
        */
        app.IsAllQuestionsAnswered = function () {
            console.log('func app.IsAllQuestionsAnswered');

            
            allAnswered = true;
            result = app.GetResultLocalStorage();
            for (i = 0; i < gamePlayData.GameQuestions.length; i++) {
                if (result.GameQuestions[i]["SelChoiceId"] == NO_ANSWER) allAnswered = false;
                
                if (!allAnswered) break;
            }

            return allAnswered;
        };

        /*
        returns number of questions answered
        */
        app.NbrQuestionsAnswered = function () {
            console.log('func app.NbrQuestionsAnswered');

            questionsAnswered = 0;
            result = app.GetResultLocalStorage();
            for (i = 0; i < gamePlayData.GameQuestions.length; i++) {
                if (result.GameQuestions[i]["SelChoiceId"] != NO_ANSWER) questionsAnswered++;
            }

            return questionsAnswered;
        };

        /*
        returns the number of questions
        */
        app.NbrQuestions = function () {
            console.log('func app.NbrQuestions');
            result = app.GetResultLocalStorage();
            return result.GameQuestions.length;
        };

        /*
        (PUSH) Queue Games Submitted/Active - Keep the last gamePlayQueueMax
        */
        app.PushQueueGamePlays = function (gameState) {
            console.log('func app.PushQueueGamePlays');

            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            queueNbrStart = Math.min(gamePlayQueue.length - 1, gamePlayQueueMax - 2); //we are only going to save (gamePlayQueueMax) submitted games

            for (var i = queueNbrStart; i >= 0; i--) {
                gamePlayListQueue[i + 1] = {};
                gamePlayQueue[i + 1] = {};
                gamePlayListQueue[i + 1] = gamePlayListQueue[i];
                gamePlayQueue[i + 1] = gamePlayQueue[i];
            }

            gamePlayListQueue[0] = {};
            gamePlayQueue[0] = {};

            //we want to save certain game data for the home page list of submitted games
            gamePlayListQueue[0]["GamePlayId"] = result["GamePlayId"];
            gamePlayListQueue[0]["GameCode"] = result["GameCode"];
            gamePlayListQueue[0]["Name"] = gamePlayData.Name;
            gamePlayListQueue[0]["FirstName"] = result.FirstName;
            gamePlayListQueue[0]["NickName"] = result.NickName;
            gamePlayListQueue[0]["GameState"] = gameState;

            gamePlayQueue[0].GamePlay = gamePlayData;
            gamePlayQueue[0].Result = result;
            app.PutGamePlayListQueueLocalStorage(gamePlayListQueue);
            app.PutGamePlayQueueLocalStorage(gamePlayQueue);

        };//app.PushQueueGamePlays

        /*
        (POP) Queue Games Submitted/Active
        */
        app.PopQueueGamePlays = function () {
            console.log('func app.PopQueueGamePlays');

            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            app.PutGamePlayLocalStorage(gamePlayQueue[0].GamePlay);
            app.PutResultLocalStorage(gamePlayQueue[0].Result);

            queueNbrStart = 0;
            for (var i = queueNbrStart; i < gamePlayQueue.length-1; i++) {
                gamePlayListQueue[i] = gamePlayListQueue[i + 1];
                gamePlayQueue[i] = gamePlayQueue[i + 1];
            }

            //removes the last item of the game play queue
            gamePlayQueue.splice(gamePlayQueue.length - 1, 1);
            gamePlayListQueue.splice(gamePlayQueue.length - 1, 1);

            //store the new order queue
            app.PutGamePlayListQueueLocalStorage(gamePlayListQueue);
            app.PutGamePlayQueueLocalStorage(gamePlayQueue);

        };//app.PopQueueGamePlays

        /*
        returns true if there are games in the queue
        */
        app.IsGamesInQueue = function (gameState) {
            console.log('func app.IsGamesInQueue');
            returnStatus = false;

            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();
            for (i = 0; i <= gamePlayListQueue.length - 1; i++) {
                if (gamePlayListQueue[i].GameState == gameState) {
                    returnStatus = true;
                }
                if (returnStatus) break;
            }
            return returnStatus;

        };//app.IsGamesInQueue(gameState)

        /*
        Get number of games in queue
        */
        app.GetNbrGamesInQueue = function (gameState) {
            console.log('func app.GetNbrGamesInQueue');
            count = 0;

            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();
            for (i = 0; i <= gamePlayListQueue.length - 1; i++) {
                if (gamePlayListQueue[i].GameState == gameState) {
                    count++;
                }
            }
            return count;

        };//app.IsGamesInQueue(gameState)

        /*
        Gets index of Active Game in Queue
        returns -1 if no active game in queue
        */
        app.GetActiveGameIndexInQueue = function () {
            console.log('func app.GetActiveGameIndexInQueue');
            index = -1;

            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();
            for (i = 0; i <= gamePlayListQueue.length - 1; i++) {
                if (gamePlayListQueue[i].GameState == GameState.Active) {
                    index = i;
                }
                if (index != -1) break;
            }
            return index;

        };//app.IsGamesInQueue(gameState)

        /*
        return if the game has been submitted already (looking at the queue)
        arguments
        gamePlayId
        */
        app.IsGameSubmitted = function (gamePlayId) {
            console.log('func app.IsGameSubmitted');

            isSubmitted = false;

            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            for (i = 0; i < gamePlayListQueue.length; i++) {
                if (gamePlayListQueue[i]["GamePlayId"] == gamePlayId) {
                    isSubmitted = true;
                }

                if (isSubmitted) break;
            }

            return isSubmitted;
        };//app.IsGameSubmitted 

        /*
        Popup Helper
        */
        app.popUpHelper = function (header, msg1, msg2) {
            /*
            if msg2 is null, then it won't be displayed
            */

            console.log('func app.popUpHelper')
            popupArgs = new PopupArgs();
            popupArgs.header = header;
            popupArgs.msg1 = msg1;
            popupArgs.msg2 = msg2;
            app.popUp(popupArgs);
        }

        /*
        Setup and display popup
        */
        app.popUp = function (popupArgs) { //(header, msg1, msg2, btnYesHandler, btnNoHandler) {
            console.log('func app.popUp');

            /*
            header = header of popup
            msg1 = first cell of a one column table
            msg2 = second cell of a one column table (if null, it won't display)
            */

            /*
            Set the the content of the popup
            */
            contentHtml = '<table>' +
            '<tr><td>' + popupArgs.msg1 + '</td></tr>' +
            '<tr><td>' + ((popupArgs.msg2 != null) ? popupArgs.msg2 : "") + '</tr></td>' +
            '</table>';     
            $('#popMsgHeader').html(popupArgs.header); //set header
            $('#popupMsgContent').html(contentHtml); //set content

            $('#popupMsgYesBtn').show();
            $('#popupMsgYesBtn').attr('data-rel', 'back')

            //display popup
            $('#popupMsg').enhanceWithin().popup().popup("open", { transition: "fade" });

        };

        /*
        Confirmation Dialog
        */
        app.confirmDialog = function (header, text, callback) {
            console.log('func app.confirmDialog');

            var popupDialogId = 'popupDialog';
            $('<div data-role="popup" id="' + popupDialogId + '" data-confirmed="no" data-transition="fade" data-overlay-theme="a" data-theme="a" data-dismissible="false" style="max-width:500px;"> \
                    <div data-role="header" data-theme="a">\
                        <h1>' + header + '</h1>\
                    </div>\
                    <div role="main" class="ui-content popupContentFontSize" data-theme="a">\
                        <h3 class="ui-title">' + text + '</h3>\
                        <div style="text-align:right">\
                        <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a optionConfirm popupButtonFontSize" data-rel="back" data-theme="a">Yes</a>\
                        <a "href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a optionCancel popupButtonFontSize" data-rel="back" data-transition="flow" data-theme="a">No</a>\
                        <\div>\
                    </div>\
                </div>')
                .appendTo($.mobile.pageContainer);
            var popupDialogObj = $('#' + popupDialogId);
            popupDialogObj.trigger('create');
            popupDialogObj.popup({ theme: "a" }).popup({
                afterclose: function (event, ui) {
                    popupDialogObj.find(".optionConfirm").first().off('click');
                    var isConfirmed = popupDialogObj.attr('data-confirmed') === 'yes' ? true : false;
                    $(event.target).remove();
                    if (isConfirmed && callback) {
                        callback();
                    }
                }
                });
            popupDialogObj.popup('open');
            popupDialogObj.find(".optionConfirm").first().on('click', function () {
                popupDialogObj.attr('data-confirmed', 'yes');
            });
        }//app.confirmDialog 

        /*
        GetConfigurationValue
        */
        app.GetConfigValue = function (configName) {
            console.log('func app.GetConfigValue');

            gameConfig = app.GetGameConfigLocalStorage();
            parmValue = {};

            for (i = 0; i < gameConfig.length; i++) {

                if (gameConfig[i].Name == configName) {
                    parmValue = gameConfig[i].Value;
                }

                if(parmValue != {}) break;
            }
            return parmValue;
            
        };//app.GetConfigValue

        /*
        Set Bottom Nav Bar Buttons (set them to true will enable them).Note the arguments set to false
        will override all other conditions. i.e if submit is set to true, but not all questions have been
        answered then submit be disabled. If set to false, it will be disabled no matter what.
        */
        app.SetBottomNavButtons = function (summaryButtonInd, submitButtonInd, backButtonInd, nextButtonInd) {
            console.log('func app.SetBottomNavButtons');

            if (backButtonInd) {

                if ($('.backButton').hasClass('ui-disabled')) {
                    $('.backButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.backButton').hasClass('ui-disabled')) {
                    $('.backButton').addClass('ui-disabled');
                }
            }//if (backButtonInd)

            if (summaryButtonInd) {

                if ($('.summaryButton').hasClass('ui-disabled')) {
                    $('.summaryButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.summaryButton').hasClass('ui-disabled')) {
                    $('.summaryButton').addClass('ui-disabled');
                }
            }//if (summaryButtonInd)


            if (submitButtonInd && app.IsAllQuestionsAnswered() && gameState != GameState.ReadOnly) {

                if ($('.submitButton').hasClass('ui-disabled')) {
                    $('.submitButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.submitButton').hasClass('ui-disabled')) {
                    $('.submitButton').addClass('ui-disabled');
                }
            }//if (submitButtonInd)

            if (nextButtonInd) {

                if ($('.nextButton').hasClass('ui-disabled')) {
                    $('.nextButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.nextButton').hasClass('ui-disabled')) {
                    $('.nextButton').addClass('ui-disabled');
                }
            }//if (backButtonInd)

    }//app.SetBottomNavButtons

        /*
        submit success
        */
        app.SubmitSuccess = function () {
            console.log('func app.SubmitSuccess');

            //Set result data dirty flag and game state to Read Only
            result = app.GetResultLocalStorage();
            result.DirtyFlag = false; //we just submitted successfully, so the dirty flag must be reset.
            app.PutResultLocalStorage(result);

            gameState = GameState.ReadOnly;

            //set summary page for read-only game state
            app.SetBottomNavButtons(false, false, false, false);

            //set the newgame and cancel game buttons (enable new game, disable cancel game)
            $("[data-icon='plus']").removeClass('ui-disabled');
            $("[data-icon='minus']").addClass('ui-disabled');

            app.PushQueueGamePlays(GameState.Submitted);

        };//app.SubmitSuccess

        /*
        create Javascript Objects JSON for HTTP request
        */
        app.CreatePlayer = function () {
            console.log('func app.CreatePlayer');

            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            result["GamePlayId"] = JSONdata.Id;
            result["FirstName"] = "NO-NO-NO";
            result["LastName"] = "NO-NO-NO";
            result["NickName"] = "NO-NO-NO";
            result["Sex"] = SexType.Female;

            player = {};
            player["FirstName"] = result["FirstName"];
            player["LastName"] = result["LastName"];
            player["NickName"] = result["NickName"];
            player["Sex"] = result["Sex"];

            return player;
        };

    /* ***************************************************
    Helper routines for local storage of GamePlay, Results,
    GamePlayListQueue, and GamePlayListQueue data
    */
    app.PutGamePlayLocalStorage = function (gamePlay) {
        localStorage["GamePlay"] = JSON.stringify(gamePlay);
    };

    app.GetGamePlayLocalStorage = function () {
        localResult = undefined;
        if (localStorage["GamePlay"] != undefined) {
            localResult = JSON.parse(localStorage["GamePlay"]);
        }

        return localResult;
    };

    app.PutResultLocalStorage = function (result) {
        localStorage["Result"] = JSON.stringify(result);
    };

    app.GetResultLocalStorage = function () {
        localResult = {};
        if (localStorage["Result"] != undefined) {
            localResult = JSON.parse(localStorage["Result"]);
        }
        return localResult;
    };

    app.PutGamePlayQueueLocalStorage = function (gamePlayQueue) {
        localStorage["GamePlayQueue"] = JSON.stringify(gamePlayQueue);
    };

    app.GetGamePlayQueueLocalStorage = function () {
        gamePlayQueue = new Array();
        if (localStorage["GamePlayQueue"] != undefined) {
            gamePlayQueue = JSON.parse(localStorage["GamePlayQueue"]);
        }
        return gamePlayQueue;
    };

    app.PutGamePlayListQueueLocalStorage = function (gamePlayListQueue) {
        localStorage["GamePlayListQueue"] = JSON.stringify(gamePlayListQueue);
    };

    app.GetGamePlayListQueueLocalStorage = function () {
        gamePlayListQueue = new Array();
        if (localStorage["GamePlayListQueue"] != undefined) {
            gamePlayListQueue = JSON.parse(localStorage["GamePlayListQueue"]);
        }
        return gamePlayListQueue;
    };

    app.PutGameConfigLocalStorage = function (gameConfig) {
        localStorage["GameConfig"] = JSON.stringify(gameConfig);
    };

    app.GetGameConfigLocalStorage = function () {
        gameConfig = {};
        if (localStorage["GameConfig"] != undefined) {
            gameConfig = JSON.parse(localStorage["GameConfig"]);
        }
        return gameConfig;
    };

    app.ajaxHelper = function (uri, method, data) {
        console.log('func app.ajaxHelper uri:' + uri);

        return $.ajax({
            type: method,
            async: false,
            url: uri,
            dataType: 'json',
            contentType: 'application/json',
            data: data ? JSON.stringify(data) : null
        })
    }//function ajaxHelper

    /* ***************************************************** */

    //initialize the Prob app
    app.init();


})(probeApp); //app

});



