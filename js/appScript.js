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
        //console.log('START app');
        /* Localstorage
        localStorage["Game"]
        localStorage["Result"]
        localStorage["GameConfig"]
        localStorage["GameQueueList"]
        localStorage["GameQueue""]
        */

        /*
        Globals
        */
        var probeVersion = '1.3.0';
        var probeVersionNumber = 5;
        var root = GetRootUrl();  //root directory of the web site serving mobile app (i.e. in-common-app.com)

        //alert('Probe Version: ' + probeVersion);
        var ProbeAPIurl = root + "api/";
        var ProbeMatchSummaryAPIurl = ProbeAPIurl + "Reports/GetPlayerMatchSummaryData/";
        var ProbeMatchDetailAPIurl = ProbeAPIurl + "Reports/GetPlayerMatchDetailData/";
        var ProbeTestDetailAPIurl = ProbeAPIurl + "Reports/GetPlayerTestDetailData/";
        var ProbeGameLMSSummaryAPIurl = ProbeAPIurl + "Reports/GetGameLMSSummaryData/";
        var ProbePlayerLMSSummaryAPIurl = ProbeAPIurl + "Reports/GetPlayerLMSSummaryData/";
        var ProbePlayerLMSDetailAPIurl = ProbeAPIurl + "Reports/GetPlayerLMSDetailData/";
        var PLAYER_NOT_NAMED = "NO-NAME";
        var RESULT_NO_ANSWER = "";
        var QUESTION_NOT_SUBMITTED = -1;
        var VAR_NONE = -1;
        var FIRST_QUESTION_NBR = 0;
        var DATE_MINIUMUM = "1/1/1900";
        var ANSWER_REASON_INCORRECT = 1;
        var ANSWER_REASON_DEADLINE = 2;
        var ANSWER_REASON_UNKNOWN = 3;
        var CORRECT_ANSWER_COLOR = "green";
        var INCORRECT_ANSWER_COLOR = "red";
        var SUBMIT_BUFFERTIME_SECS = 1;
        var CLOCKCOUNTDOWN_BUFFER_SECS = 5;
        var CONFIG_ANSWERSUCCESS = "AnswerSubmitSuccessMessage";
        var CONFIG_ANSWERFAIL = "AnswerSubmitFailMessage";
        var CONFIG_SUBMITCONFIRM = "SubmitConfirmMessage";
        var CONFIG_QUESTIMEWARN = "QuestionTimeWarningMessage";
        var CONFIG_QUESTIMEDEADLINE = "QuestionTimeDeadlineMessage";
        var SERVER_NO_ERROR = 0;
        var SERVER_UNKNOWN_ERROR = 1;
        var SERVER_GAME_NOTACTIVE = 2;
        var SERVER_PLAYER_DUP = 3;
        var SERVER_PLAYER_FNAME_INVALID = 4;
        var SERVER_PLAYER_NNAME_INVALID = 5;
        var SERVER_SUBM_MISSINGANSWERS = 6;
        var SERVER_SUBM_INVALIDANSWERS= 7;
        var SERVER_PLAYERNAME_INVALID = 8;
        var SERVER_PLAYER_LNAME_INVALID = 9;
        var SERVER_SUBM_NOT_ONTIME = 10;
        var SERVER_PLAYER_INACTIVE = 11;
        var SERVER_SUBM_TOO_EARLY = 12;
        var SERVER_GAME_STATUS_UNKNOWN = 0;
        var SERVER_GAME_STATUS_NOTSTARTED = 1;
        var SERVER_GAME_STATUS_STARTEDNOQUESTIONPASSED = 2;
        var SERVER_GAME_STATUS_ACTIVE = 3;
        var SERVER_GAME_STATUS_SUSPENDED = 4;
        var SERVER_GAME_STATUS_COMPLETED = 5;
        var DATETIME_MINIMUM = -62135596800000;
        var AJAX_TIMEOUT = 30000; //30 seconds

        var currentQuestionNbr = FIRST_QUESTION_NBR;
        var NO_ANSWER = -1;
        var result = {};
        var GameType = { "Match": "Match", "Test": "Test", "LMS": "Last Man Standing" };
        var GameState = { "Idle": 0, "Active": 1, "Submitted": 2, "ReadOnly": 3, "SubmittedActive": 4 };
        var GameStatusType = { 'Unknown': 1, 'NotStarted': 1, 'StartedButNoStatus': 2, 'Active': 3, 'Suspended': 4, 'Completed': 5 };
        var SexType = { 'Unknown': 0, 'Male': 1, 'Female': 2 };
        var ReportType = { 'MatchSummary': 0, 'MatchDetail': 1, 'TestDetail': 2, 'GameLMSSummary': 3, 'PlayerLMSSummary': 4, 'LMSDetail': 5 };
        var ConfigType = { 'Global': 0, 'Game': 1 };
        var gameState = GameState.Idle;
        var GameQueueMax = 10;  //number of submitted games save client-side
        var codeFromURL = undefined;
        var ajaxCallMaxTries = 3;  //number of tries app will make on an ajax call to server
        var aboutIFrameLoaded = false; //used specifically to display mobile loader (spinner) for About page
        var adjustedTopPadding = false //this is a hack to ensure top padding is correct the first time home page is rendered
        var minutesToCache = 5; //how long to cache global incommon configuration
        var lastUpdatedCacheDateTime = new Date('1/1/2001');
        var GASubmitToInCommonInProgress = false;

        app.init = function () {
            //this occurs after document is ready (runs once)
            //console.log('START app.init');

            //Check for v1.3 and determine if app running for the first time on device. If so - we will clear local storage
            //in order to remove any incompatibilities from v1.0 - v1.1
            if (probeVersion == '1.3.0' && localStorage["ProbeVersionNbr"] == undefined) {
                localStorage.clear();
                localStorage["ProbeVersionNbr"] = probeVersion;
            }

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
                //console.log('event doc ready');

                //override the console.log if production (disable console)
                $(function () {
                    if ($('body').data('env') == 'production') {
                        console.log = function () { };
                    }
                });

                //determine if game code has been feed from a query string parm
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
                    app.GetGameServer(codeFromURL);
                }

                //We needed to do this because mysteriously the page padding dynamically changes occassionaly. The
                //top padding is done after the pageshow
                app.AdjustPagePaddingTop(); //will check to see that padding is not off

            }); //$(document).on

            //sets the padding when window is resized. Not going to happen on a phone.
            $(window).resize(function ()
            {
                console.log('resize triggered');
                app.SetHeaderImage();
            });

        }; //app.bindings = function () {

        /*
        Set Homepage Initial Display - Listview of active game and previous games played
        */
        app.SetHomePageInitialDisplay = function () {
            console.log('START app.SetHomePageInitialDisplay w:' + $(window).width() + ' h:' + $(window).height());
            GameListQueue = app.GetGameListQueueLocalStorage();

            app.SetHeaderImage(); //need to set header based on the size of the window

            //if the game state is idle; then we just want to make sure that the Add function is
            //enabled and the Cancel function is disabled
            if (gameState == GameState.Idle) {
                $("[data-icon='plus']").removeClass('ui-disabled');
                $("[data-icon='minus']").addClass('ui-disabled');
            }

            if (new app.Game().IsGameInProgress() || GameListQueue.length > 0) {
                app.HomePageInitialDisplayListview();
            }// if (new app.Game().IsGameInProgress() || GameListQueue > 0) {
            else {
                app.HomePageInitialDisplayInstruct();
            }

            app.BindPageStaticEvents('#home');

            //dynamically bind dynamic button to About page event
            $("#aboutBtn").click(function (event) {
                app.DisplayAboutPage();
            });

            console.log('END app.SetHomePageInitialDisplay');
        };//app.SetHomePageInitialDisplay

        /*
        Set HomePageInitialDisplay- Game Listview
        */
        app.HomePageInitialDisplayListview = function () {
            console.log('START app.HomePageInitialDisplayListview');

            gameObj = new app.Game();

            //If there is an active game in the queue always pop it back into current game storage
            app.PopActiveGameFromQueueIntoCurrent();
            gameObj.StartupClockCountdown(); //start up a clock countdown if needed (only for LMS)

            GameListQueue = app.GetGameListQueueLocalStorage();

            app.SetHomePageStyle(false);
            listViewHtml = '';
            listViewHtml += '<ul id="gameList" data-role="listview" data-split-icon="bar-chart-o" data-inset="true">';

            if (gameObj.IsGameInProgress()) {
                $("[data-icon='plus']").addClass('ui-disabled');
                $("[data-icon='minus']").removeClass('ui-disabled');

                GameData = app.GetGameLocalStorage();
                result = app.GetResultLocalStorage();

                playerName = (app.GetPlayerName() != PLAYER_NOT_NAMED) ? app.GetPlayerName() : '(Player not named)';

                listViewHtml += '<li data-role="list-divider">Active Game<span class="ui-li-count">1</span></li>' +
                                '<li data-icon="' +
                                (gameObj.GetListViewReportIconHtml()) +
                                '" data-game="active"' +
                                ' data-index="-1"' +
                                '><a href="#"><span class="listviewGameName">' +
                                 GameData.Name + '</span>' +
                                '<p class="listviewPlayerName">' +
                                 playerName + '</p>' +
                                 (gameObj.GetListviewClockCountdownHtml()) +
                                 '</a>' +
                                 (gameObj.GetListViewReportBtnHtml()) +
                                 '</li>';
            } else if (app.IsGamesInQueue(GameState.Active) || app.IsGamesInQueue(GameState.SubmittedActive)) {
                $("[data-icon='plus']").addClass('ui-disabled');
                $("[data-icon='minus']").removeClass('ui-disabled');

                index = app.GetActiveGameIndexInQueue();

                listViewHtml += '<li data-role="list-divider">Active Game<span class="ui-li-count">1</span></li>' +
                                '<li data-icon="' + 
                                (gameObj.GetListViewReportIconHtml()) +
                                ' data-game="active"' +
                                ' data-index="' + app.GetActiveGameIndexInQueue() + '"' +
                                '><a href="#"><span class="listviewGameName">' +
                                 GameListQueue[index].Name + '</span>' +
                                '<p class="listviewPlayerName">' +
                                 app.GetPlayerName(GameListQueue[index].FirstName, GameListQueue[index].NickName, GameListQueue[index].LastName, GameListQueue[index].Email) +
                                 '</p>' +
                                 (gameObj.GetListviewClockCountdownHtml()) +
                                 '</a>' +
                                 (gameObj.GetListViewReportBtnHtml()) +
                                 '</li>';

            } else {
                listViewHtml += '<li data-role="list-divider">No Active Game<span class="ui-li-count">0</span></li>'
            }//if (gameObj.IsGameInProgress()) {


            if (app.IsGamesInQueue(GameState.Submitted)) {
                listViewHtml += '<li data-role="list-divider">Submitted Games<span class="ui-li-count">' + app.GetNbrGamesInQueue(GameState.Submitted) + '</span></li>';
            }
            GameListQueue.forEach(function (value, index, ar) {

                //only submitted games are displayed in the list here.
                if (value.GameState == GameState.Submitted) {

                    listViewHtml += '<li data-icon="bar-chart-o" data-game="submitted"' +
                                    ' data-index="' + index + '"' +
                                    ' data-Gameid="' + value.GameId + '"' +
                                    '><a href="#" class="gameResumeAction" ' +
                                    ' data-index="' + index + '"' +
                                    '><span class="listviewGameName">' +
                                     value.Name + '</span><br/>' +
                                     '<span class="listviewPlayerName">' +
                                     app.GetPlayerName(value.FirstName, value.NickName, value.LastName, value.Email) +
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
            $('#gameList').listview().listview("refresh").trigger("create");
            //$('#home').trigger('create');

            gameObj.RunQuesCountdownOnce(); //if neccessary the countdown clock will display static

            console.log('END app.HomePageInitialDisplayListview');
        }//app.HomePageInitialDisplayListview

        /*
        Set HomePageInitialDisplay- Instructions
        */
        app.HomePageInitialDisplayInstruct = function () {
            console.log('START app.HomePageInitialDisplayInstruct');

            //<a id="demoGameLink" data-democode="Practice Match" href="#">practice game</a> \

            app.SetHomePageStyle(true); //the only time we set bckground image to full opacity -first time
            gameInstructions = '<h3 style="text-align: center">Welcome to <i>In Common</i>!</h3>\
                               You will need a game code from a game organizer to play. No code yet! Try the: \
                               <div class="demoGameLinkDiv"><button id="demoGameLink" class="ui-btn ui-corner-all ui-btn-icon-right ui-icon-action" data-democode="Practice Match">Practice Game</button></div>\
                               <p>To enter a code, click the Add icon on the top bar. \
                               <i>In Common</i> may take a few moments to retrieve your game.</p>\
                               <p>You will be prompted for information to be recognized. Start your game then answer the question(s) and submit.</p>\
                               <div class="AboutButtonDiv"><button id="aboutBtn" class="ui-btn ui-corner-all ui-btn-icon-right ui-icon-book" data-icon="book">Want to Know More?</button></div>';

            $('#homePageContent').html(gameInstructions);
            $('#homePageContent').css('color', '#000000');
            $('#homePageContent').css('font-size', '1.2em');
            $('#homePageContent').css('font-weight', 'bold');
            $('#home').trigger('create');

            //let's kick start the 'Practice Match' game
            $("#demoGameLink").click(function (event) {
                app.SetHomePageStyle(false);
                app.GetGameServer($(this).attr("data-democode"));
            });

            console.log('END app.HomePageInitialDisplayInstruct');
        }//app.HomePageInitialDisplayInstruct

        /*
        Update the home page with a text box to enter game code
        */
        app.SetGameCodePrompt = function () {
            console.log('START app.SetGameCodePrompt');

            //Will fill in code if app started with code query string parm
            promptforCodeHtml =
                '<div style="margin-top: 10px"><label for="code" class="gameCode">Game Code</label>' +
                '<input name="code" id="gameCode" type="text" ' +
                'value="' +
                '" ' +
                'data-clear-btn="true">' +
                '<table><tr>' +
                '<td><button id="callGetPlays" class="ui-btn" data-icon="action">Find Game</button></td>' +
                '<td><button id="cancelGame" class="ui-btn" data-icon="action">Cancel</button></td>' +
                '</tr></table></div>';


            $('#homePageContent').html(promptforCodeHtml);
            $('#homePageContent').trigger("create");
            $(window).trigger('resize'); //ensure the background image covers the entire window

            $('#callGetPlays').click(function (event) {
                gameCode = $('#gameCode').val();
                if (gameCode.length > 0) { //check to see that a game code was entered

                    if ($('#gameCode').val() == 'incommon-settings') {
                        app.popUpHelper('Info'
                            , 'InCommon version =' + probeVersion + '</br>' +
                            'InCommon version =' + probeVersionNumber + '</br>' +
                            'InCommon rootUrl =' + ProbeAPIurl + '</br>' +
                            'screen width = ' + $(window).width() + '</br>' +
                            'screen height = ' + $(window).height() + '</br>' +
                            'timezone offset = ' + new Date().getTimezoneOffset() + '</br>' +
                            'browser = ' + navigator.userAgent, null);
                    } else if ($('#gameCode').val().indexOf('incommon-ping-') != -1) { //incommon-ping-<interval in seconds>
                        pingInterval = parseInt($('#gameCode').val().substr(14, $('#gameCode').val().length)) * 1000;
                        app.popUpHelper('Info', 'Ping of In Common Server starting - ping interval: ' + pingInterval, null);
                        console.log('Ping of In Common Server starting - ping interval: ' + pingInterval);
                        setInterval(function () { app.PingInCommonServer(); }, pingInterval);
                    } else {
                        app.GetGameServer($('#gameCode').val());
                    }

                } else {
                    app.popUpHelper('Error', 'The game code cannot be blank.', 'Please enter a game code.');
                }
            });

            $('#cancelGame').click(function (event) {
                app.CancelGame();
            });

            $('#gameCode').focus(); //put the focus on the game code text input

            console.log('END app.SetGameCodePrompt');
        } //app.SetGameCodePrompt

        /*
        Ping In Common Server
        */
        app.PingInCommonServer = function () {
            console.log('Ping Date: ' + new Date());
            app.GetGameStatusServer('GameStatusResponseForPing', 'Practice Match');
        }; //app.PingInCommonServer

        /*
        Get Game from Probe Server
        FYI. The GetJSON call to server is asynchronous. We wait for a good response, then
        call the next display (prompt for player info)
        */
        app.GetGameServer = function (gameCode) {
            console.log('START app.GetGameServer MNS');

            $.mobile.loading('show'); //to show the spinner
            url = ProbeAPIurl + 'Games/GetGame/' + gameCode + '/' + probeVersionNumber;

            console.log('START app.GetGameServer AJAX url:' + url);
            $.getJSON(url)
              .done(function (GameData) {
                    console.log('return GetGame success');

                    // On success, 'data' contains a Game JSON object
                    if (GameData.errorid == undefined) {
                        //SUCCESS
                        //We've got the game data; we also need the game configuration
 
                        url = ProbeAPIurl + 'GameConfigurations/GetGameConfiguration/' + GameData.Code;
                        console.log('START app.GetConfigServer AJAX url:' + url);
                        app.ajaxHelper(url, 'GET', true, null)
                          .done(function (gameConfig) {
                              console.log('return GetConfigServer success');
                              $.mobile.loading('hide'); //to hide the spinner

                              // On success, 'data' contains a GameConfiguration JSON object
                              if (gameConfig.errorid == undefined) {
                                  //SUCCESS OF THE ENTIRE SEQUENCE OF CALLS AND RESPONSES
                                  //CALL GAMES/GETGAME AND GAMECONFIGURATIONS/GETGAMECONFIGURATION

                                  app.PutGameConfigLocalStorage(gameConfig);

                                  if (!app.IsGameSubmitted(GameData.Id) || !$.parseJSON(app.GetConfigValue(ConfigType.Game, 'DeviceCanPlayGameOnlyOnce'))) {
                                      app.InitalizeGame(GameData);
                                      app.SetGamePlayerPrompt(); //SUCCESS - NEXT STEP IS FOR PLAYER TO ENTER PLAYER INFO


                                  } else {
                                      app.popUpHelper('Error', 'Game \'' + GameData.Name + '\' has already been submitted.', 'A device cannot submit the same game twice for this game type.');
                                  }//if (!app.IsGameSubmitted(GameData.Id))
                              } else {
                                  //THERE WAS A PROBE BUSINESS ERROR
                                  errorMessage = gameConfig.errormessage;
                                  switch (gameConfig.errorid) {
                                      case 1:
                                          errorMessage = 'There is no configuration for the game code entered.';
                                          break;
                                      default:
                                          errorMessage = gameConfig.errormessage;
                                          break;
                                  }
                                  app.popUpHelper('Error', errorMessage, null);
                              }//if (gameConfig.errorid == undefined) for GameConfigurations/GetGameConfiguration CALL
                          }) //done for GameConfigurations/GetGameConfiguration CALL
                          .fail(function (jqxhr, textStatus, error) {
                              console.log('return GetConfigServer fail');
                              $.mobile.loading('hide'); //to hide the spinner
                              errorMessage = app.GetAJAXFailureErrMessage('Get Game Configuration Status', textStatus, error);
                              app.popUpHelper('Error', errorMessage, null);
                          }); //fail for GameConfigurations/GetGameConfiguration CALL
                        
                    } else {
                        //THERE WAS A PROBE BUSINESS ERROR for Games/GetGame CALL
                        $.mobile.loading('hide'); //to hide the spinner
                        errorMessage = GameData.errormessage;
                        errorMessagePrompt = '';
                        switch (GameData.errorid) {
                            case 1:
                                errorMessage = 'There is no game found for the code entered.';
                                errorMessagePrompt = 'Please enter the correct code.';
                                break;
                            case 2:
                                errorMessage = 'The game found for the entered code is no longer active.';
                                break;
                            case 13: //In Common needs install
                                errorMessage = GameData.errormessage;
                                errorMessagePrompt = ''; //no prompt warranted for this message
                                break;
                            case 18:
                                errorMessage = 'The game found has been suspended.';
                                break;
                            default:
                                errorMessage = GameData.errormessage;
                                errorMessagePrompt = 'Please enter the correct code.';
                                break;
                        }
                        app.popUpHelper('Error', errorMessage, errorMessagePrompt);
                    }//if (GameData.errorid == undefined) for Games/GetGame CALL
              }) //done for Games/GetGame CALL
              .fail(function (jqxhr, textStatus, error) {
                  console.log('return GetGame fail');
                  $.mobile.loading('hide'); //to hide the spinner

                  app.popUpHelper('Error',app.GetAJAXFailureErrMessage('Get Game', textStatus, error), null);
              }); //fail Games/GetGame CALL

            console.log('END app.GetGameServer MNS');
        };//app.GetGameServer

        /*
        Get GameStatus from Probe Server 
        result["ClientReportAccess"] is recorded
        result["PlayerCount"] is recorded
        After receiving response from Probe Server, calls the passed in response handler
        */
        app.GetGameStatusServer = function (fncResponsHandlerName,gameCode) {
            console.log('START app.GetGameStatusServer');
            var clientReportAccess = false; //global within the GetGameStatusServer function
            var errorMessage = undefined;

            url = ProbeAPIurl + 'Games/GetGameByCode/' + gameCode;
            console.log('START app.GetGameStatusServer AJAX url:' + url);
            app.ajaxHelper(url, 'GET', true, null)
                .done(function (GameStatusData) {
                    console.log('return GetGameStatus success');

                    //Setup response handler function
                    respArgs = new DynamicFunctionArgs();
                    respArgs.App = app; //app pointer
                    respArgs.UserArg1 = false;  //clientReportAccess

                    // On success, 'data' contains a Game(only one level) JSON object
                    if (GameStatusData.errorid == undefined) {
                        //SUCCESS
                        result = app.GetResultLocalStorage(result);
                        clientReportAccess = GameStatusData.ClientReportAccess;
                        result["ClientReportAccess"] = GameStatusData.ClientReportAccess;
                        result["PlayerCount"] = GameStatusData.PlayerCount;
                        app.PutResultLocalStorage(result);
                        respArgs.UserArg1 = clientReportAccess;  //clientReportAccess
                    } else {
                        //THERE WAS A PROBE BUSINESS ERROR
                        errorMessage = GameStatusData.errormessage;
                        switch (GameStatusData.errorid) {
                            case 1:
                                errorMessage = 'There is no game found for the id entered.';
                                break;
                            default:
                                errorMessage = GameStatusData.errormessage;
                                break;
                        }
                        respArgs.ErrorId = GameStatusData.errorid;
                        respArgs.ErrorMessage = errorMessage;
                    }//if (GameStatusData.errorid == undefined)

                    window[fncResponsHandlerName](respArgs); //CALL FUNCTION RESPONSE HANDLER (if no error. ErrorMessage will be undefined)
                }) //done
                .fail(function (jqxhr, textStatus, error) {
                    console.log('return GetGameStatus fail');

                    errorMessage = app.GetAJAXFailureErrMessage('Get Game Play Status', textStatus, error);
                    respArgs.ErrorMessage = errorMessage;
                    window[fncResponsHandlerName](respArgs); //CALL FUNCTION RESPONSE HANDLER
                }); //fail

            console.log('END app.GetGameStatusServer');
        };//app.GetGameStatusServer 

        /*
        Submit Player and Game Answers for Player
        */
        app.PostGameAnswersServer = function () {
            console.log('START app.PostGameAnswersServer');

            returnErrMsg = null;

            result = app.GetResultLocalStorage();
            //create player object for POST
            playerDTOin = new app.Player().PlayerCreate();

            //create GameAnswers array object for POST
            playerDTOin["GameAnswer"] = new app.GameAnswers().GameAnswersCreate(playerDTOin);

            url = ProbeAPIurl + 'Players/PostPlayer';
            console.log('START app.PostGameAnswersServer AJAX url:' + url);
            app.ajaxHelper(url, 'POST', true, playerDTOin)
                .done(function (playerDTO) {
                    console.log('return POSTPlayer success');
                    returnErrMsg = new app.Game().PostGAResponse(playerDTO);

                    app.CompleteConfirmSubmit(returnErrMsg);
                })//done for POST Player
                .fail(function (jqxhr, textStatus, error) {
                    console.log('return POSTPlayer fail');

                    //set error handling
                    result = app.GetResultLocalStorage();
                    result["ServerResponse"] = SERVER_UNKNOWN_ERROR;
                    app.PutResultLocalStorage(result);
                    returnErrMsg = app.GetAJAXFailureErrMessage('Post Player', textStatus, error);

                    app.CompleteConfirmSubmit(returnErrMsg);
                }) //fail for POST Player

            console.log('END app.PostGameAnswersServer');
        };//app.PostGameAnswersServer

        /*
        Get InCommon Configuration(global) from Probe Server
        FYI. The GetJSON call to server is asynchronous. We wait for a good response, then
        call the next display (About display)
        */
        app.GetInCommonConfigServer = function () {
            console.log('START app.GetInCommonConfigServer');

            $.mobile.loading('show'); //to show the spinner
            url = ProbeAPIurl + 'GameConfigurations/GetConfiguration/incommon-code-around';

            console.log('START app.GetInCommonConfigServer AJAX url:' + url);
            $.getJSON(url)
              .done(function (configuration) {
                    console.log('return GetInCommonConfigServer success');

                    // On success, 'data' contains a configuration JSON object
                    if (configuration.errorid == undefined) {
                        //SUCCESS
                        //We prepare the new incommon configuration data and display the about page 
                        app.PutInCommonConfigLocalStorage(configuration);

                        aboutHtml = app.GetConfigValue(ConfigType.Global, "InCommon-About");
                        minutesToCache = parseInt(app.GetConfigValue(ConfigType.Global, "InCommon-CacheMinutes"));
                        $('#aboutContent').html(aboutHtml);

                        $("#accordion").accordion({
                            heightStyle: "content",
                            autoHeight: false,
                            clearStyle: true,
                        });
                        $.mobile.loading('hide'); //to hide the spinner
                    } else {
                        //THERE WAS A PROBE BUSINESS ERROR - THIS SHOULD NEVER HAPPEN FOR THIS CALL
                        $.mobile.loading('hide'); //to hide the spinner
                        errorMessage = configuration.errormessage;
                        app.popUpHelper('Error', errorMessage, 'In Common request error occurred.');
                    }

                }) //done
              .fail(function (jqxhr, textStatus, error) {
                  console.log('return GetInCommonConfigServer fail');
                  $.mobile.loading('hide'); //to hide the spinner

                  app.popUpHelper('Error', app.GetAJAXFailureErrMessage('Get InCommon Configuration', textStatus, error), null);
              }); //fail

            console.log('END app.GetInCommonConfigServer');
        };//app.GetInCommonConfigServer

        /*
        (RETURNS true if AJAX call was successful)
        Get Game Configuration for Game Code from Probe Server 
        FYI. The GetJSON call to server is synchronous
        */
        app.GetConfigServer = function (gameCode) {
            console.log('START app.GetConfigServer');
            var clientReportAccess = false; //global within the GetGameStatusServer function
            var ajaxCallTries = 0;
            var ajaxIsSuccessful = true;
            var errorMessage = "";

            do {
                errorMessage = ""; //error mess must be blank for each ajax try
                ajaxCallTries++;   //counting ajax tries
                console.log('START app.GetConfigServer ajax try:' + ajaxCallTries);

                url = ProbeAPIurl + 'GameConfigurations/GetGameConfiguration/' + gameCode;
                console.log('START app.GetConfigServer AJAX url:' + url);
                app.ajaxHelper(url, 'GET', true, null)
                  .done(function (gameConfig) {
                      console.log('return GetConfigServer success');

                      // On success, 'data' contains a GameConfiguration JSON object
                      if (gameConfig.errorid == undefined) {
                          //SUCCESS
                          app.PutGameConfigLocalStorage(gameConfig);
                          ajaxIsSuccessful = true;
                      } else {
                          //THERE WAS A PROBE BUSINESS ERROR
                          errorMessage = gameConfig.errormessage;
                          switch (gameConfig.errorid) {
                              case 1:
                                  errorMessage = 'There is no configuration for the game code entered.';
                                  break;
                              default:
                                  errorMessage = gameConfig.errormessage;
                                  break;
                          }
                          ajaxIsSuccessful = false;

                      }

                  }) //done
                  .fail(function (jqxhr, textStatus, error) {
                      console.log('return GetConfigServer fail');

                      errorMessage = app.GetAJAXFailureErrMessage('Get Game Configuration Status', textStatus, error);
                      ajaxIsSuccessful = false;

                  }); //fail

            } while (!ajaxIsSuccessful && ajaxCallTries < ajaxCallMaxTries)

            console.log('END app.GetConfigServer');
            if (errorMessage == "") {
                return true;
            } else {
                throw errorMessage;
            }
        };//app.GetConfigServer
        
        /*
        Update the home page with the game information and a prompt for first name and nickname 
        before starting the game
        */
        app.SetGamePlayerPrompt = function () {
            console.log('START app.SetGamePlayerPrompt');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            gameDescription = 'No Description';
            if (GameData.Description != null) gameDescription = GameData.Description;

            promptforPlayerHtml =
                '<div style="margin-top: 10px">' +
                '<label for="gpType">(' + GameData.GameType + ' Game)' +
                '</label>' +
                '<textarea name="gpType" id="gpType" class="gpType" disabled="disabled">' + GameData.Name + ' (' +
                gameDescription + ')</textarea>' +

                new app.JQMWidget("firstName").JQMRender() +
                new app.JQMWidget("nickName").JQMRender() +
                new app.JQMWidget("lastName").JQMRender() +
                new app.JQMWidget("email").JQMRender() +
                new app.JQMWidget("sex").JQMRender() +

                '<table><tr>' +
                '<td><button id="startGame" class="ui-btn" data-icon="action">Start Game</button></td>' +
                '<td><button id="cancelGame" class="ui-btn" data-icon="action">Cancel</button></td>' +
                '<td><button id="reportGame" class="ui-btn" data-icon="action">Results</button></td>' +
                '</tr></table></div>';

            $('#homePageContent').html(promptforPlayerHtml);

            //Setup all interactivity based on game state and game configuration
            new app.Game().PlayerPromptInteractive();

            //Hack for male radio box is showing for Android phone
            $('#sex-male').parent().css('width', '70px')

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
            $('#startGame').click(function (event) {
                console.log('#startGame event triggered');

                //Validate all the JQM prompt widgets that are enabled. 
                try {
                    app.JQMWidgetsAllValidate()
                } catch (Err) {
                    app.popUpHelper('Error', Err, 'Please enter this again.');
                    return;
                }

                //Update the current result 
                result = app.GetResultLocalStorage();
                result["FirstName"] = new app.JQMWidget("firstName").JQMGetValue();
                result["NickName"] = new app.JQMWidget("nickName").JQMGetValue();
                result["LastName"] = new app.JQMWidget("lastName").JQMGetValue();
                result["Email"] = new app.JQMWidget("email").JQMGetValue();
                result["Sex"] = new app.JQMWidget("sex").JQMGetValue();
                app.PutResultLocalStorage(result);

                defaultHackWaitmsec = 100;
                //Android - you have to wait a little longer for the soft keyboard to reset. The ipad took 100msec, Android 300
                (navigator.userAgent.match(/Android/i)) ? defaultHackWaitmsec = 1000 : defaultHackWaitmsec = 100;

                console.log('defaultHackWaitmsec for softkeyboardhack=' + defaultHackWaitmsec);
                //This is a hack for IPAD to ensure that the fixed nav bar is positioned corrected
                    //$('header, footer').css('position', 'absolute'); //MNS COMMENTED OUT 12-9-14
                    window.scrollTo($.mobile.window.scrollLeft(), $.mobile.window.scrollTop());
                    //Wait a tenth of a second to ensure the IPAD soft keyboard is down. This is a hack to
                    //ensure the fixed bottom nav bar doesnt jump up to the middle on the question page
                    setTimeout(function () {
                        new app.Game().StartGame(false);
                    }, defaultHackWaitmsec);
                //} else { //Just have to start game if your not an IPAD
                   //app.StartGame(0);
                //}

            });

            $('#cancelGame').click(function (event) {

                GameData = app.GetGameLocalStorage();
                gameObj = new app.Game();
                /*
                if the game is active; then we want to ask if they really want to cancel. 
                If the game is NOT active. Then we do a CancelGame (this does not harm since a submitted game is queued
                */
                if (gameObj.IsGameInProgress()) {
                    app.confirmDialog('Cancel', 'You\'re about to cancel the Game <span class="popupGameName">'
                                                 + GameData.Name
                                                 + '</span> that\'s in progress.<p>Are you sure?</p>',
                    function () {
                        app.CancelGame();
                    });
                } else {
                    app.CancelGame();
                }//gameObj.IsGameInProgress()


            });

            $('#reportGame').click(function (event) {
                app.DisplayReportPage();
            });

            console.log('END app.SetGamePlayerPrompt');
        };

        /*
        Initialize the Game data structure, add answer property to question, and put 
        in local storage
        */
        app.InitalizeGame = function (JSONdata) {
            console.log('START app.InitalizeGame');

            result["GameId"] = JSONdata.Id;
            result["GameCode"] = JSONdata.Code;
            result["GameType"] = JSONdata.GameType;
            result["FirstName"] = RESULT_NO_ANSWER;
            result["LastName"] = RESULT_NO_ANSWER;
            result["NickName"] = RESULT_NO_ANSWER;
            result["Email"] = RESULT_NO_ANSWER;
            result["Sex"] = SexType.Male;
            result["PlayerId"] = RESULT_NO_ANSWER;
            result["GameQuestions"] = new Array();
            result["GameState"] = GameState.Idle;
            result["NbrPlayers"] = RESULT_NO_ANSWER;
            result["NbrPlayersRemaining"] = RESULT_NO_ANSWER;
            result["PlayerActive"] = true;
            result["QuestionNbrSubmitted"] = QUESTION_NOT_SUBMITTED;
            result["ServerResponse"] = SERVER_NO_ERROR;

            /****************************ALL FOR LMS GAME***********************/
            //Let's get all the game configuration parms required for calculating time line for game
            FindGameTimeCompleteInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "FindGameTimeCompleteInSecs"));
            FirstQuestionTimeCompleteInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "FirstQuestionTimeCompleteInSecs"));
            QuestionTimeCompleteInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "QuestionTimeCompleteInSecs"));
            QuestionTimeWarningInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "QuestionTimeWarningInSecs"));
            QuestionTimeSlopeInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "QuestionTimeSlopeInSecs"));
            ServerClientTimeSyncInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "ServerClientTimeSyncInSecs"));

            //We are checking to see if the clock for the InCommon server and player's client device are close enough to proceed with playing
            //the game. If not we will adjust the question start and deadlines based on the difference between clock times of the 
            //server and the client. Note: We first check if the server and client are within a range (game config - ServerClientTimeSyncInSecs).
            //If so; then we are golden.. with NO adjustments necessary
            ClientDateSync = new Date();
            ServerDateSync = new Date(Date.parse(JSONdata.ServerNowDate));
            ServerClientDateDifInSecs = (ClientDateSync - ServerDateSync) / 1000;
            console.log('Date: Client=' + ClientDateSync + ' Server=' + ServerDateSync + 'DateDif=' + ServerClientDateDifInSecs);
            if (Math.abs(ServerClientDateDifInSecs) <= ServerClientTimeSyncInSecs || ServerClientTimeSyncInSecs == 0) {
                //This appears to be converting to local time (from UTC). Because some browswers (i.e. Safari) to support the 2015-04-12 format,
                //we convert using the Date.parse method of a 3rd party iso8601 library
                StartDate = new Date(Date.parse(JSONdata.StartDate));
            } else {
                StartDate = new Date(Date.parse(JSONdata.StartDate)); //NOT DONE - NEED TO ADD TOTAL SECONDS
                StartDate = new Date(StartDate.setSeconds(StartDate.getSeconds() + ServerClientDateDifInSecs));
            }


            console.log('Start Date=' + GetInCommmonLocaleDateString(StartDate) + ' ' + GetInCommmonLocaleTimeString(StartDate));

            questionCount = 0;
            decreaseForSlope = 0;
            questionTimeCompleteDeltaInSecs = 0;
            NextQuestionDeadlineDT = new Date(StartDate);
            NextQuestionDeadlineDT.setSeconds(NextQuestionDeadlineDT.getSeconds() + FindGameTimeCompleteInSecs);
            /************************END OF LMS GAME******************************/

            //We will record each question in the game.
            JSONdata.GameQuestions.forEach(function (value, index, ar) {
                //value.Question["Answer"] = NO_ANSWER;  //NOT NEEDED FOR 
                result["GameQuestions"][index] = {};
                result["GameQuestions"][index]["QuestionId"] = value.Question.Id;
                result["GameQuestions"][index]["SelChoiceId"] = NO_ANSWER;
                result["GameQuestions"][index]["Correct"] = false; //we will assume incorrect as a default
                result["GameQuestions"][index]["Reason"] = NO_ANSWER; //set to nothing (-1) as a default

                //In the case where the game is an LMS; we will calculate and record time/deadline information for each question. This
                //timeline information will be in local time
                if (JSONdata.GameType == GameType.LMS) {

                    questionCount++;
                    //calculate total decrease in seconds for slope. Slope only comes into play on the third question
                    //and beyond
                    if (questionCount == 1) {
                        decreaseForSlope = 0;
                        questionTimeCompleteDeltaInSecs = FirstQuestionTimeCompleteInSecs;
                    }
                    else if (questionCount == 2) {
                        decreaseForSlope = 0;
                        questionTimeCompleteDeltaInSecs = QuestionTimeCompleteInSecs;
                    }
                    else {
                        decreaseForSlope += QuestionTimeSlopeInSecs;
                        questionTimeCompleteDeltaInSecs = QuestionTimeCompleteInSecs - decreaseForSlope;
                    }

                    deltaToNextQuestionInSecs = questionTimeCompleteDeltaInSecs;

                    QuestionDeadlineDT = new Date(NextQuestionDeadlineDT.setSeconds(NextQuestionDeadlineDT.getSeconds() + deltaToNextQuestionInSecs));

                    //For the first question, the question start date goes all the way back to game start date
                    if (questionCount == 1) {
                        QuestionStartDT = new Date(StartDate);
                    } else {
                        QuestionStartDT = new Date(new Date(QuestionDeadlineDT).setSeconds(QuestionDeadlineDT.getSeconds() - questionTimeCompleteDeltaInSecs));
                    }

                    QuestionWarningDT = new Date(new Date(QuestionDeadlineDT).setSeconds(QuestionDeadlineDT.getSeconds() - QuestionTimeWarningInSecs));

                    result["GameQuestions"][index]["QuestionDeadlineDT"] = new Date(QuestionDeadlineDT);
                    result["GameQuestions"][index]["QuestionStartDT"] = new Date(QuestionStartDT);
                    result["GameQuestions"][index]["QuestionWarningDT"] = new Date(QuestionWarningDT);

                    NextQuestionDeadlineDT = QuestionDeadlineDT;

                    console.log('QuesNbr=' + index + ' QuesStartDT=' + GetInCommmonLocaleDateString(QuestionStartDT) + ' ' + GetInCommmonLocaleTimeString(QuestionStartDT));


                }//if (JSONdata.GameType == GameType.LMS)


            });//JSONdata.GameQuestions.forEach(function (value, index, ar) {

            app.PutGameLocalStorage(JSONdata);
            app.PutResultLocalStorage(result); //hold all the results

            console.log('END app.InitalizeGame');
        };//app.InitalizeGame 

        /*
        Create a test page of the api/GetPlays/{code} dump - accepts the JSON
        data from an ajax call to the Probe API and parse it, and create a test page
        */
        app.CreateGameTestPage = function (JSONdata) {
            console.log('START app.CreateGameTestPage');

            testHtml = 'GameName:' + JSONdata.Name + '<br/>' +
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

            console.log('END app.CreateGameTestPage');
        }; //app.CreateGetPlayTestPage

        /*
        Render the question page for the GameQuestion[questionNbr] in the Game dataset
        */
        app.SetQuestionPage = function (questionNbr, transitionType) {
            console.log('START app.SetQuestionPage');

            $('footer').show(); //show footer nav bar on the page

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();
            gameObj = new app.Game();

            //display question information
            gameObj.SetQuesInfo(questionNbr);

            question = GameData.GameQuestions[questionNbr].Question;
            questionText = '<span class="bodyText">' + Base64Decode(question.Text) + '?</span>';

            fieldset = '<fieldset data-role="controlgroup">';
            question.Choices.forEach(function (value, index, ar) {
                choiceText = Base64Decode(value.Text);
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

            gameObj.SetQuesChoiceSensitivity();

            //Style choice list with proper spacing
            $('#question [data-role="controlgroup"]').css("margin", ".5em 0")
            $('#question .ui-radio').css("margin", "0");

            gameObj.SetQuesCorrectionStyle(questionNbr); //sets the background of the radio box with answer
            gameObj.SetQuesNavigate(questionNbr); //sets the navigate possibilities

            gameObj.SetQuesCountdown(questionNbr, false); //sets countdown clock is necessary
            gameObj.RunQuesCountdownOnce(); //if neccessary the countdown clock will display static (perform below .SetQuesCountdown)


            //$('#question').trigger('create');

            $("input[name ='choice']").on('change', function () {

                radioButtonSelectedID = $('input[name="choice"]:checked').attr('id'); //id of the radio box

                GameData = app.GetGameLocalStorage();
                gameObj = new app.Game();
                //set choice number of answer
                result["GameQuestions"][currentQuestionNbr]["SelChoiceId"] = radioButtonSelectedID.substr(7, radioButtonSelectedID.length - 6);
                app.PutResultLocalStorage(result);
                gameObj.SetBottomNavButtons(true, true, true, true);

                gameObj.AlertPlayerComplete(currentQuestionNbr, GameData.GameQuestions.length - 1); //Determine if any user alerts are necessary for good usability
            }); //$("input[name ='choice']").on('change', function () {

            gameObj.SetBottomNavButtons(true, true, true, true); //set summary and submit button to enabled

            $(":mobile-pagecontainer").pagecontainer('change', '#question', { transition: transitionType });

            //Change the min-height if for some reason the question page min height is less than the home page
            styleHomeMinHeight = parseInt($('#home').css('min-height'));
            styleQuesMinHeight = parseInt($('#question').css('min-height'));
            console.log('homeMinHeight: ' + styleHomeMinHeight + '  questMinHeight: ' + styleQuesMinHeight);
            if (styleQuesMinHeight < styleHomeMinHeight) {
                console.log('set HOME min-height');
                $('#question').css('min-height', styleHomeMinHeight);
            }
            $('#question header').css('position', 'fixed');
            $('#question footer').css('position', 'fixed');
            $(window).trigger('resize'); //ensure the background image covers the entire window //MNS ADDED 12-9-14

            console.log('END app.SetQuestionPage');
        }; //app.SetQuestionPage

        /*
        Render the summary page
        */
        app.SetSummaryPage = function () {
            console.log('START app.SetSummaryPage');

            $('footer').show(); //show footer nav bar on the page

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();
            gameObj = new app.Game();

            summaryText = '<span class="bodyText">Questions - ' + app.NbrQuestionsAnswered() + ' out of ' + gameObj.NbrQuestions() + ' answered</span>'

            listViewHtml = '<ul data-role="listview" data-inset="true">';

            for (index = 0; index < gameObj.NbrQuestions() ; index++) {
                value = Base64Decode(GameData.GameQuestions[index].Question.Text);

                listViewHtml += '<li' +
                ((result.GameQuestions[index]["SelChoiceId"] == NO_ANSWER) ? ' data-icon="alert" ' : ' data-icon="check" ') +
                ' data-qnum=' + index + '>' +
                '<a href="#">' +
                (index + 1) + '. ' +
                value + '?' +
                '</a></li>';

            };
            listViewHtml += '</ul>';

            $('#summaryText').html(summaryText);
            $('#questionList').html(listViewHtml);

            $('#questionList').listview().trigger("create")
            $('#summary article').css("overflow", "hidden");

            //setup event handler for summary page listview to return to a specific question
            $('[data-qnum]').click(function (event) {
                currentQuestionNbr = parseInt(this.attributes["data-qnum"].value);
                app.SetQuestionPage(currentQuestionNbr, 'none');
            });

            gameObj.SetBottomNavButtons(false, false, true, false); //set summary to disabled and submit button to enabled

            $(":mobile-pagecontainer").pagecontainer('change', '#summary');
            $('#summary header').css('position', 'fixed');
            $('#summary footer').css('position', 'fixed');
            $(window).trigger('resize'); //ensure the background image covers the entire window

            console.log('END app.SetSummaryPage');
        };//app.SetSummaryPage

        /*
        Bind Page Events
        */
        app.BindPageStaticEvents = function (pageSelector) {
            console.log('START app.BindPageStaticEvents');

            switch (pageSelector) {
                case "#home":
                    $('[data-game="active"]').click(function (event) {

                        index = this.attributes["data-index"].value;

                        //if index not -1; then we need to pop from queue. This puts active game back in the current game storage
                        if (index != -1) {
                            app.PopQueueGames();

                            GameData = app.GetGameLocalStorage();
                            result = app.GetResultLocalStorage();

                        }

                        //the game state will be either Active or SubmittedActive
                        app.ResumeGame(result.GameState);
                    }); //$('[data-game="active"]').click

                    $('[data-game="submitted"] .gameResumeAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        //copy game out of queue into current game (even though it's read-only)
                        setTimeout(function () {
                            app.GameResumeAction(index);
                        }, 500);

                    }); //$('[data-game="submitted" .gameResumeAction]').click

                    $('[data-game="submitted"] .gameReportAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        setTimeout(function () {
                            app.GameReportAction(index);
                        }, 500);

                    }); //$('[data-game="submitted" .gameReportAction]').click

                    //event handler for submitted active LMS game
                    $('[data-game="active"] .gameReportAction').click(function (event) { 
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        //index will be negative one in this case
                        setTimeout(function () {
                            app.GameReportAction(index);
                        }, 500);

                    }); //$('[data-game="submitted" .gameReportAction]').click

                    break;
                case "#question":

                    //FYI. jquery would not work with #question as a pre-cursor to #backButton
                    //$('#qfooter #backButton').click(function (event) { MNS DEBUG
                    $('.backButton').click(function (event) {
                        new app.Game().BackButtonHandler();
                    });

                    $('.summaryButton').click(function (event) {
                        app.SetSummaryPage();
                    });

                    //$('#qfooter #nextButton').click(function (event) { //MNS DEBUG
                    $('.nextButton').click(function (event) {
                        new app.Game().NextButtonHandler();
                    });

                    break;
                case "#summary":

                    $('.submitButton').click(function (event) {

                        app.confirmDialog('Submit', new app.Game().ProcessMessage(CONFIG_SUBMITCONFIRM),
                            function () {
                                $.mobile.loading('show'); //to show the spinner
                                setTimeout(function () { app.ConfirmSubmit(); }, 1000 * SUBMIT_BUFFERTIME_SECS); //give a 1 second delay. So the user see's the spinner when submitting

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
                                app.PopQueueGames();
                            }

                            GameData = app.GetGameLocalStorage();
                            result = app.GetResultLocalStorage();
                            app.confirmDialog('Cancel', 'You\'re about to cancel the Game <span class="popupGameName">'
                                + GameData.Name + ' (' + app.GetPlayerName()
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

                    //bind the back return on tablereport page 
                    //NOTE: Hack to refix the top navbar. For some reason with google table the return button
                    //loses this.. So we refix it.
                    $('#tablereport header [data-icon="back"]').click(function (event) {
                        window.history.go(-1);
                        $('#chartreport header').css('position', 'fixed');
                        $('#chartreportback header').css('position', 'fixed');
                        $('#tablereport header').css('position', 'fixed');
                    });

                    $('#chartreportback header [data-icon="back"]').click(function (event) {
                        window.history.go(-1);
                        $('#chartreport header').css('position', 'fixed');
                        $('#chartreportback header').css('position', 'fixed');
                    });

                    $('#playerConsoleText').tap(function () {

                        //Only popup a countdown popup if a count down is currently happening.
                        if ($('#qCountdown').length > 0) {
                            $('#popupCountdownParent').enhanceWithin().popup().popup("open", { transition: "flip" });
                        }

                    });

                    break;
            }

            console.log('END app.BindPageStaticEvents');
        };//app.BindPageStaticEvents 

        /*
        Game Add Action
        */
        app.GameAddAction = function () {
            console.log('START app.GameAddAction');

            gameObj = new app.Game();

            $('#menu').panel("close"); //if menu open

            if (gameObj.IsGameInProgress()) {
                GameData = app.GetGameLocalStorage();
                app.popUpHelper('Error', 'Game \'' + GameData.Name + '\' is in progress', 'You must cancel this game first to start a new game.');
                return;
            } else if (app.IsGamesInQueue(GameState.Active)) {
                GameListQueue = app.GetGameListQueueLocalStorage();
                index = app.GetActiveGameIndexInQueue();
                app.popUpHelper('Error', 'Game \'' + GameListQueue[index].Name + '\' is in progress', 'You must cancel this game first to start a new game.');
                return;
            }

            /*
            the current game is not active; nor is a queued game active. So we can add a game
            */
            $("[data-icon='plus']").addClass('ui-disabled');
            $("[data-icon='minus']").removeClass('ui-disabled');
            app.SetHomePageStyle(false);
            app.SetGameCodePrompt();
            gameObj.SetGameState(GameState.Idle);
            $(":mobile-pagecontainer").pagecontainer('change', '#home');

            console.log('END app.GameAddAction');
        }//app.GameAddAction

        /*
        Game Resume Action (from Submitted State)
        */
        app.GameResumeAction = function (index) {
            console.log('START app.GameResumeAction');

            app.SetCurrentGameData(index);
            result = app.GetResultLocalStorage();
            app.GetGameStatusServer('GameStatusResponseForGameResumeAction', result.GameCode);

            console.log('END app.GameResumeAction');
        }//app.GameResumeAction
        app.CompleteGameResumeAction = function (clientReportAccess, errorId, errorMessage) {
            console.log('START app.CompleteGameResumeAction');

            $.mobile.loading('hide'); //to hide the spinner

            //we check to see if there is an error message, if not all is well
            if (errorMessage == undefined) {
                //set the home page for read-only view
                new app.Game().SetGameState(GameState.ReadOnly);

                app.SetHomePageStyle(false); //set backgrounded faded
                app.ResumeGame(GameState.ReadOnly); //resume game read-only
            } else {
                app.popUpHelper("Error", "GetGameStatusServer: " + errorMessage);
            }

            console.log('END app.CompleteGameResumeAction');
        }//app.CompleteGameResumeAction

        /*
        Game Report Action (from Submitted State)
        */
        app.GameReportAction = function (index) {
            console.log('START app.GameReportAction');

            //We only need to set the current game storage if the game is not active.
            //if the index (of selected game queue item) is undefined then we don't need to 
            if (index != -1) {
                app.SetCurrentGameData(index);
            }
            result = app.GetResultLocalStorage();
            app.GetGameStatusServer('GameStatusResponseForGameReportAction', result.GameCode);

            console.log('END app.GameReportAction');
        }//app.GameReportAction
        app.CompleteGameReportAction = function (clientReportAccess, errorId, errorMessage) {
            console.log('START app.CompleteGameReportAction');

            $.mobile.loading('hide'); //to show the spinner

            //we check to see if there is an error message, if not all is well
            if (errorMessage == undefined) {
                if (clientReportAccess) {
                    app.DisplayReportPage();
                } else {
                    app.popUpHelper("Info", "The game organizer has not made game results accessible to the players yet.");
                }
            } else {
                app.popUpHelper("Error", "GetGameStatusServer: " + errorMessage);
            }

            console.log('END app.CompleteGameReportAction');
        }//app.GameReportAction


        /*
            Set Game, Result, and GameConfig Data for Current
            Returns resultBeforePush (Result object of game before the push)
        */
        app.SetCurrentGameData = function (index)
        {
            console.log('START app.SetCurrentGameData');

            //get the game from the queue first
            GameQueueBeforPush = app.GetGameQueueLocalStorage();
            ResultQueueBeforePush = app.GetResultLocalStorage();
            GameDataBeforePush = GameQueueBeforPush[index].Game;
            resultBeforePush = GameQueueBeforPush[index].Result;
            gameConfigBeforePush = GameQueueBeforPush[index].GameConfig; //storing game configs local - MNS 4-19-15


            //if game is in progess, then we want to push active/submittedactive game onto the queue
            if (new app.Game().IsGameInProgress()) {
                app.PushQueueGames(result.GameState);
            }

            app.PutGameLocalStorage(GameDataBeforePush);
            app.PutResultLocalStorage(resultBeforePush);

            //we do this check for backward compatibility - old local games will not have game config queued up locally
            if (gameConfigBeforePush != undefined) {
                app.PutGameConfigLocalStorage(gameConfigBeforePush);
            }

            console.log('END app.SetCurrentGameData');
        }//app.SetCurrentGameData()

        /*
        Pre GAMEANSWER Submit Logic - Calls Ajax POST 
        */
        app.ConfirmSubmit = function () {
            console.log('START app.ConfirmSubmit');

            //Set the submit GA To InCommon flag is used by the question deadline handler in the exceptional cases where
            //the player submits immediately before the countdown clock for a deadline completes. In this case the handler
            //should not run
            GASubmitToInCommonInProgress = true;

            gameObj = new app.Game();
            //If for some reason; the player keeps up the confirmation popup until after the deadline, we wont
            //let the submission be processed if the deadline has passed. Also the player status must still be active.
            console.log('test deadline in ConfirmSubmit');
            if (gameObj.IsNewQuestionDeadlineNotPassed() && result.PlayerActive) {
                console.log('new question deadline not passed and player is still active - keep setting up submit');

                //Disarm countdown QUESTION DEADLINE clock (it may or may not  be armed) - only if LMS
                gameObj.SetClockCountdownEnable('qdeadline', false);

                app.PostGameAnswersServer();
                console.log('completed app.PostGameAnswersServer');

            }//if (gameObj.IsNewQuestionDeadlineNotPassed()) {

            $.mobile.loading('hide'); //to hide the spinner

            GASubmitToInCommonInProgress = false; //turn the flag off now. The Submit is complete.
            console.log('End - app.ConfirmSubmit');
        }//app.ConfirmSubmit
        /*
        Post GAMEANSWER Submit Logic - Handles Ajax POST response
        */
        app.CompleteConfirmSubmit = function () {
            console.log('START app.CompleteConfirmSubmit');

            gameObj = new app.Game();
            //Disarm countdown QUESTION DEADLINE clock (it may or may not  be armed) - only if LMS
            gameObj.SetClockCountdownEnable('qdeadline', false);

            //disable all local notifications if necessary (warning for last question)
            gameObj.ResetLocalNotifications();

            //we check if the GA response warrants a game submit. An active LMS game will be SubmittedActive
            if (gameObj.IsGameSubmit()) {
                app.SubmitSuccess();
            }

            //We have now posted the answers to the server. And received a response.
            //If returnErrMsg is not NULL, we got a problem
            //If returnErrMsg is NULL, then we have to determine where we navigate next based on a number of conditions
            gameObj.NavigateAfterGAResponse();

            $.mobile.loading('hide'); //to hide the spinner
            //We will display a message to the player depending on the GA response and the state of the player.
            gameObj.ProcessMessageForGAResponse(returnErrMsg);

            GASubmitToInCommonInProgress = false; //turn the flag off now. The Submit is complete.

            console.log('End - app.CompleteConfirmSubmit');
        }//app.CompleteConfirmSubmit

        /*
        submit success
        */
        app.SubmitSuccess = function () {
            console.log('START app.SubmitSuccess');

            result = app.GetResultLocalStorage();
            app.PutResultLocalStorage(result);

            gameObj = new app.Game();

            //Sets the appropriate game state of the game
            gameObj.SetGameStatePostSubmit();

            //Will push game onto the submitted queue and set widgets for readonly if game state is read only
            //Also means that an LMS game where gamestate is SubmittedActive will not be queued up
            if (gameState == GameState.ReadOnly) {
                gameObj.SetGamePostSubmit(gameState);
            }

            console.log('END app.SubmitSuccess');
        };//app.SubmitSuccess

        /*
        AdjustPagePaddingTop
        */
        app.AdjustPagePaddingTop = function () {
            console.log('START AdjustPagePaddingTop');
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

            console.log('END AdjustPagePaddingTop');
        }//app.AdjustPagePaddingTop

        /*
        Responsive UI approach to setting the header image
        */
        app.SetHeaderImage = function () {
            console.log('START SetHeaderImage');
            width = $(window).width();
            height = $(window).height();

            /*
             responsive header logo image   
             */
            if (height >= 2560)
            {
                $('header img').attr("src", "./images/header/header432x40.png")
            } else if (height <= 2559 && height >= 1912) {
                $('header img').attr("src", "./images/header/header324x40.png")
            } else if (height <= 1911 && height >= 1600) {
                $('header img').attr("src", "./images/header/header270x40.png")
            } else if (height <= 1599 && height >= 1180) {
                $('header img').attr("src", "./images/header/header240x40.png")
            } else if (height <= 1179 && height >= 1024) {
                $('header img').attr("src", "./images/header/header180x40.png")
            } else if (height <= 1023 && height >= 800) {
                $('header img').attr("src", "./images/header/header180x40.png")
            } else if (height <= 799 && height >= 480) {
                $('header img').attr("src", "./images/header/header180x40.png")
            } else if (height <= 479 && height >= 0) {
                $('header img').attr("src", "./images/header/header144x40.png")
            }

            console.log('END SetHeaderImage');
        }//app.SetHeaderImage

        /*
        Setup home page
        arguments
        initialState = true   //setup for original
                     = false //setup for prompts
        */
        app.SetHomePageStyle = function (initialState) {
            console.log('START app.SetHomePageStyle');
            $('footer').hide(); //hide footer on the page

            //$('#home').css("padding-top", "42px");

            //$('#home').removeClass('backimageInCommon');
            //$('#home').addClass('backimageInCommon');

            new app.Game().SetBottomNavButtons(false, false, false, false); //From the home page. Always set the bottom nav bar bottoms to disabled.

            console.log('END app.SetHomePageStyle');
        };//app.SetHomePageStyle

        /*
        Cancel game in progress
        */
        app.CancelGame = function () {
            console.log('START app.CancelGame');

            new app.Game().StopClockCountdown(); //shuts down countdowns if LMS

            $('#menu').panel("close"); //if calling from a panel

            new app.Game().ResetLocalNotifications();

            localStorage.removeItem("Game");
            localStorage.removeItem("Result");
            app.SetHomePageStyle(true);
            $('#homePageContent').html('');
            $('#homePageContent').trigger("create");
            app.EnableNewGame();
            app.SetHomePageInitialDisplay();
            $(":mobile-pagecontainer").pagecontainer('change', '#home', { transition: 'none' });

            console.log('END app.CancelGame');
        };//app.CancelGame

        /*
        Enable New Game
        */
        app.EnableNewGame = function () {
            console.log('START app.EnableNewGame');

            $("[data-icon='plus']").removeClass('ui-disabled');
            $("[data-icon='minus']").addClass('ui-disabled');
            new app.Game().SetGameState(GameState.Idle);

            console.log('END app.EnableNewGame');
        }//app.EnableNewGame

        /*
        Resume game
        arguments:
        gameStateArg
        */
        app.ResumeGame = function (gameStateArg) {
            console.log('START app.ResumeGame');
            new app.Game().SetGameState(gameStateArg);
            app.SetGamePlayerPrompt();
            console.log('END app.ResumeGame');
        };//app.ResumeGame

        /*
        Display the About (Info) page 
        */
        app.DisplayAboutPage = function () {
            console.log('START app.DisplayAboutPage');

            //check to see if we've reached the cached limit. if so then we go get the about content from the server
            //otherwise we just change the page. the content is already there.
            dateTimeToCache = new Date(lastUpdatedCacheDateTime.valueOf());
            dateTimeToCache.setMinutes(dateTimeToCache.getMinutes() + minutesToCache);

            var dateNow = new Date();
            if (dateNow > dateTimeToCache || $('#aboutContent').length == 0) {
                //change page before the asychronous ajax call - and you get the spinner 
                $(':mobile-pagecontainer').pagecontainer('change', '#about', { transition: 'none' });
                app.GetInCommonConfigServer();
                lastUpdatedCacheDateTime = new Date(dateNow.valueOf()); //update last date updated cache
            } else {
                $(':mobile-pagecontainer').pagecontainer('change', '#about', { transition: 'none' });
            }

            console.log('END app.DisplayAboutPage');
        }//app.DisplayAboutPage

        /*
        Load Google Chart Libraries
        */
        app.LoadGoogleChartLibs = function () {
            console.log('START app.LoadGoogleChartLibs');

            var jq = document.createElement('script'); jq.type = 'text/javascript';
            // Path to jquery.js file, eg. Google hosted version
            jq.src = 'https://www.google.com/jsapi';
            document.getElementsByTagName('head')[0].appendChild(jq);

            setTimeout(function () {
                google.load("visualization", "1", { packages: ["corechart", "table"] });
            }, 2000);

            console.log('END app.LoadGoogleChartLibs');
        };//app.LoadGoogleChartLibs

        /*
        DisplayReportPage
        */
        app.DisplayReportPage = function () {
            console.log('START app.DisplayReportPage');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //We need to check if google is defined. If not the result reports will not work.
            //The device was not connected when first loading the app.
            if (typeof google != 'undefined') {

                if (GameData.GameType == GameType.Match) {

                    if (result.PlayerCount >= 2) {
                        $('footer').hide(); //hide footer on the page //MNS COMMENTED 12-9-14
                        app.DrawReport(ReportType.MatchSummary, result.GameId, result.GameCode, result.PlayerId, 0, 0);
                    }
                    else {
                        app.popUpHelper("Info", "There are not enough players that have submitted their games to report on the results. Please try again later.");
                    }

                } else if (GameData.GameType == GameType.Test) { //Test Type
                    $('footer').hide();
                    app.DrawReport(ReportType.TestDetail, result.GameId, result.GameCode, result.PlayerId, 0, 0);
                } else if (GameData.GameType == GameType.LMS) {
                    $('footer').hide();
                    app.DrawReport(ReportType.GameLMSSummary, result.GameId, result.GameCode, result.PlayerId, 0, 0);
                }


            } else {
                app.confirmDialog('Error', 'Your device must be connected to display results.<br/><span style="color: #00edf0">Is your device connected now?</span><i> (you may have to confirm/retry a couple of times)</i>',
                function () {
                    location.reload(true); //will reload the page and all libraries
                });
            }

            console.log('END app.DisplayReportPage');
        };//app.DisplayReportPage

        /*
        Display the Report Generic
        */
        app.DrawReport = function (reportType, GameId, gameCode, playerId, matchedPlayerId, playerStatusFilter) {
            console.log('START app.DrawReport');

            switch (reportType) {
                case ReportType.MatchSummary:
                    url = ProbeMatchSummaryAPIurl + GameId + '/' + gameCode + '/' + playerId;
                    $(":mobile-pagecontainer").pagecontainer('change', '#chartreport', { transition: 'none' });
                    console.log('START app.DrawPlayerMatchSummary AJAX url:' + url);
                    break;
                case ReportType.MatchDetail:
                    url = ProbeMatchDetailAPIurl + GameId + '/' + gameCode + '/' + playerId + '/' + matchedPlayerId;
                    $(":mobile-pagecontainer").pagecontainer('change', '#tablereport', { transition: 'none' });
                    console.log('START app.DrawPlayerMatchDetail AJAX url:' + url);
                    break;
                case ReportType.TestDetail:
                    url = ProbeTestDetailAPIurl + GameId + '/' + gameCode + '/' + playerId;
                    $(":mobile-pagecontainer").pagecontainer('change', '#tablereport', { transition: 'none' });
                    console.log('START app.DrawPlayerTestDetail AJAX url:' + url);
                    break;
                case ReportType.GameLMSSummary:
                    url = ProbeGameLMSSummaryAPIurl + GameId + '/' + gameCode;
                    $(":mobile-pagecontainer").pagecontainer('change', '#chartreport', { transition: 'none' });
                    console.log('START app.DrawGameLMSSummary AJAX url:' + url);
                    break;
                case ReportType.PlayerLMSSummary:
                    url = ProbePlayerLMSSummaryAPIurl + GameId + '/' + gameCode + '/' + playerStatusFilter;
                    $(":mobile-pagecontainer").pagecontainer('change', '#chartreportback', { transition: 'none' });
                    console.log('START app.DrawPlayerLMSSummary AJAX url:' + url);
                    break;
                case ReportType.LMSDetail:
                    url = ProbePlayerLMSDetailAPIurl + GameId + '/' + gameCode + '/' + playerId;
                    $(":mobile-pagecontainer").pagecontainer('change', '#tablereport', { transition: 'none' });
                    console.log('START app.DrawPlayerLMSDetail AJAX url:' + url);
                    break;
            }

            $.mobile.loading('show'); //to show the spinner
            $.getJSON(url) //call is asychronous
            .done(function (data) {
                if (data.errorid == undefined) {
                    //SUCCESS

                    //Setup the divs that hold the results (report page)
                    var resize = false;
                    $('parent_chart_div').css('min-height:500px;height: 100%;width: 100%;margin:auto;background:#fff;text-align:center');
                    $('chart_div').css('min-height:500px;height: 100%;width: 100%;margin:auto;background:#fff;text-align:center');

                    $(window).off('resize'); //turn off resize event; because we are going to reload
                    switch (reportType) {
                        case ReportType.MatchSummary:

                            $(window).resize(function () {
                                console.log('resize ReportType.MatchSummary');
                                console.log('MatchSummary-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'chartreport') {
                                    resize = true;
                                    app.RenderPlayerMatchSummary(data);
                                }
                            });

                            $('#chartreport #chart_div').html(''); //erase any old chart
                            app.RenderPlayerMatchSummary(data);
                            break;
                        case ReportType.MatchDetail:

                            $(window).resize(function () {
                                console.log('MatchDetail-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'tablereport') {
                                    resize = true;
                                    app.RenderPlayerMatchDetail(data);
                                }
                            });

                            $('#table_div').html(''); //erase any old table
                            app.RenderPlayerMatchDetail(data);
                            break;
                        case ReportType.TestDetail:

                            $(window).resize(function () {
                                console.log('TestDetail-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'tablereport') {
                                    resize = true;
                                    app.RenderPlayerTestDetail(data);
                                }
                            });

                            $('#table_div').html(''); //erase any old table
                            app.RenderPlayerTestDetail(data);
                            break;
                        case ReportType.GameLMSSummary:

                            $(window).resize(function () {
                                console.log('GameLMSSummary-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'tablereport') {
                                    resize = true;
                                    app.RenderGameLMSSummary(data);
                                }
                            });

                            $('#chartreport #chart_div').html(''); //erase any old chart
                            app.RenderGameLMSSummary(data);
                            break;
                        case ReportType.PlayerLMSSummary:

                            $(window).resize(function () {
                                console.log('PlayerLMSSummary-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'tablereport') {
                                    resize = true;
                                    app.RenderPlayerLMSSummary(data);
                                }
                            });

                            $('#chartreportback #chart_div').html(''); //erase any old chart
                            app.RenderPlayerLMSSummary(data);
                            break;
                        case ReportType.LMSDetail:

                            $(window).resize(function () {
                                console.log('LMSDetail-Resize: ' + $.mobile.pageContainer.pagecontainer("getActivePage").attr('id'));
                                app.SetHeaderImage();
                                if ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id') == 'tablereport') {
                                    resize = true;
                                    app.RenderPlayerLMSDetail(data);
                                }
                            });

                            $('#table_div').html(''); //erase any old table
                            app.RenderPlayerLMSDetail(data);
                            break;
                    }

                    $.mobile.loading('hide'); //to hide the spinner
                } else {
                    $.mobile.loading('hide'); //to hide the spinner
                    errorMessage = 'There was an In Common server connection error.';
                    app.popUpHelper('Error', errorMessage, 'Please try again.');
                }
            })
            .fail(function (jqxhr, textStatus, error) {
                $.mobile.loading('hide'); //to hide the spinner

                app.popUpHelper('Error',app.GetAJAXFailureErrMessage('Reporting', textStatus, error), null);
            });

            console.log('END app.DrawReport');
        }//app.DrawReport

        /*
        Render UpperLeftButton on Report. Specify chart or table
        */
        app.RenderUpperLeftBtn = function (reportForm, homeInd) {
            console.log('START app.RenderUpperLeftBtn');

            idStr = '#chartUpperLeftButton';
            if (reportForm != 'chart') {
                idStr = '#tableUpperLeftButton';
            }

            $("idStr").each(function () {
                // First copy the attributes to remove.
                var attributes = $.map(this.attributes, function (item) {
                    return item.name;
                });
                // Now remove the attributes
                var font = $(this);
                $.each(attributes, function (i, item) {
                    $("idStr").removeAttr(item);
                });
            });

            if (homeInd) {
                $(idStr).attr('href', '#home');
                $(idStr).attr('data-icon', 'home');
                $(idStr).attr('data-iconpos', 'notext');
                $(idStr).text('Home');
            } else {
                $(idStr).attr('href', '#');
                $(idStr).attr('data-icon', 'back');
                $(idStr).attr('data-iconpos', 'notext');
                $(idStr).text('Return');
            }

            console.log('END app.RenderUpperLeftBtn');
        }//app.RenderUpperLeftBtn

        /*
        Actual rendering of the PlayerMatchSummary report
        */
        app.RenderPlayerMatchSummary = function (data) {
            console.log('START RenderPlayerMatchSummary');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //HANDLER FOR INTERACTIVITY
            selectHandler = function () {
                console.log('selectHandler');
                var selectedItem = chart.getSelection()[0]; //will get player name
                if (selectedItem) {
                    var matchedPlayerId = data[selectedItem.row].Id;
                    console.log('The player selected ' + matchedPlayerId);
                    app.DrawReport(ReportType.MatchDetail,result.GameId,result.GameCode,result.PlayerId,matchedPlayerId,0)
                }
            };//selectHandler = function ()

            try {

                /*
                SETUP REPORT HEADER
                Header will be different - dependent on the mobile indicator
                Back button will not exist if report loads within an iFrame (then its in mobile mode)
                */
                $('#chartreport #chartheader').html('<span class="reportLabel">Game :</span> ' +
                                       '<span class="reportLabelText">' + GameData.Name + '</span>' +
                                       '<br/><span class="reportLabel reportLabelMargin">Player:</span> ' +
                                       '<span class="reportLabelText">' + app.GetPlayerName()) + '</span>';

                /*
                SETUP GOOGLE CHART DATA
                */
                maxTickValue = 0;

                var dSeries = new Array(data.length + 1);
                dSeries[0] = new Array(4)
                dSeries[0][0] = 'Player';
                dSeries[0][1] = 'Matches';
                dSeries[0][2] = { role: 'annotation' };
                dSeries[0][3] = { role: 'style' };
                for (var i = 0; i < data.length; i++) {
                    dSeries[i + 1] = new Array(3)
                    dSeries[i + 1][0] = data[i].Name;
                    dSeries[i + 1][1] = data[i].Value;

                    legendStr = '(' + data[i].Value + ')';
                    legendStr = data[i].Name + '(' + data[i].Value + ')';
                    dSeries[i + 1][2] = legendStr;
                    dSeries[i + 1][3] = 'color: #262626';  //#f6f6f6

                    maxTickValue = Math.max(maxTickValue, data[i].Value);
                }
                var tdata = google.visualization.arrayToDataTable(dSeries);

                /*
                SETUP V-AXIS
                */
                var vAxisText = '# Matches out of ' + new app.Game().NbrQuestions();

                /*
                SETUP GOOGLE CHART STYLE THROUGH OPTIONS
                */

                //We're going use just 5 gridlines (vertical). The first will be 0 (doesn't count)
                //, the last will be the max
                tickArray = GetChartAxisTickets(0, maxTickValue, 4);

                var options = {};
                options = {
                    height: Math.round(90 * data.length),
                    chartArea: { left: 10, top: 25, right: 10, width: '95%', height: '75%' }, //WIDTH CONTROLS IF YOU CAN SEE THE LAST TICK NUMBER
                    colors: ['#262626'],
                    hAxis: {
                        title: vAxisText,
                        format: '#',
                        titleTextStyle: { fontSize: '20' },
                        ticks: tickArray
                    },
                    backgroundColor: 'transparent',
                    bar: { groupWidth: "75%" }, //CONTROLS SIZE OF BAR AND SPACE BETWEEN BARS
                    annotations: {
                        textStyle: {
                            fontName: 'Times-Roman',
                            fontSize: 13,
                            bold: true,
                            italic: true,
                            opacity: 0.8          // The transparency of the text.
                        }
                    },
                    legend: { position: 'top', alignment: 'end', textStyle: { color: 'black', fontSize: 16 } },
                };

                var chart = new google.visualization.BarChart($('#chartreport #chart_div')[0]); //jquery for document.getElementById
                google.visualization.events.addListener(chart, 'select', selectHandler);
                chart.draw(tdata, options);

                console.log('END func RenderPlayerMatchSummary');
            } catch (err) {
                app.popUpHelper('Error',app.GetGoogleChartFailureErrMessage('Chart Player Match Summary',err), null);
            }//try

            console.log('END RenderPlayerMatchSummary');
        };//app.RenderPlayerMatchSummary

        /*
        Actual rendering of the PlayerMatchDetail report
        */
        app.RenderPlayerMatchDetail = function (data) {
            console.log('START RenderPlayerMatchDetail');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //SET COLUMN WIDTHS
            setColumnWidths = function () {
                //we will restrict the width of these columns only if we need to
                if ($(window).width() <= 900) {
                    $('.googleReportTableHeader:contains("%")').css('width', '30px'); //set the width of the percent choice column
                    $('.googleReportTableHeader:contains("Matchup Choice")').css('width', '50px'); //set the width of the percent choice column
                } 
            };

            try {


            /*
            SETUP REPORT HEADER
            Header will be different - dependent on the mobile indicator
            */
            //$('reportGameHeader')
            if (data.length >= 1) {
                $('#tableheader').html('<span class="reportLabel" style="margin-right: 20px">Game</span>: ' +
                                       '<span class="reportLabelText">' + GameData.Name + '</span>' +
                                       '<br/><span class="reportLabel" style="margin-right: 17px">Player</span>: ' +
                                       '<span class="reportLabelText">' + data[0].PlayerName + '</span>' +
                                       '<br/><span class="reportLabel reportLabelMargin">Matchup:</span> ' +
                                       '<span class="reportLabelText">' + data[0].MatchedPlayerName) + '</span>';
                //$('.reportReturnLink').hide();
            }

            /*
            SETUP GOOGLE TABLE DATA
            */
            var tdata = new google.visualization.DataTable();

            tdata.addColumn('string', 'Question');
            tdata.addColumn('string', 'Player Choice');
            tdata.addColumn('string', 'Matchup Choice');
            //tdata.addColumn('number', 'Percnt Choice');
            tdata.addColumn('number', '%');

            rowlength = 4;
            rowVector = new Array(rowlength);

            matchCount = 0;
            for (var i = 0; i < data.length; i++) {

                cellClassName = 'googleReportCellNOWB';
                if (data[i].Match == 1) {
                    cellClassName = 'googleReportCellYESWB'
                    matchCount++;
                } else {
                    cellClassName = 'googleReportCellNOWB';
                }

                row = 0;
                rowVector[row++] = { v: data[i].Question, p: { 'className': 'googleReportCell' } };
                rowVector[row++] = { v: data[i].PlayerChoice, p: { 'className': 'googleReportCellWB' } };
                rowVector[row++] = { v: data[i].MatchedPlayerChoice, p: { 'className': cellClassName } };
                rowVector[row++] = { v: data[i].PercentChosen, p: { 'className': 'googleReportCell' } };

                tdata.addRow(rowVector);
            }

            $('.tableHeader').html(matchCount + ' Matches out of ' + data.length + ' Questions');

            var options = {
                allowHtml: true,
                alternatingRowStyle: true,
                cssClassNames: {
                    headerCell: 'googleReportTableHeader',
                    tableCell: 'googleReportTableNonHeader',
                    tableRow: 'googleReportTableNonHeader'
                },
                backgroundColor: 'transparent' //doesn't work for tables
            };

            var tableAll = new google.visualization.Table(document.getElementById('table_div'));
            google.visualization.events.addListener(tableAll, 'ready', setColumnWidths);
            tableAll.draw(tdata, options);

            app.AlignTableCellContent();

            } catch (err) {
                app.popUpHelper('Error', app.GetGoogleChartFailureErrMessage('Chart Player Match Detail', err), null);
            }//try

            console.log('END RenderPlayerMatchDetail');
        };//app.RenderPlayerMatchDetail

        /*
        Display the PlayerTestDetail report
        */
        app.RenderPlayerTestDetail = function (data) {
            console.log('START RenderPlayerTestDetail');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //HANDLER FOR INTERACTIVITY
            selectHandler = function () {
                console.log('selectHandler');
                    //no handling of an event at this time (9/4/14)
            };//selectHandler = function ()

            try {

            /*
            SETUP REPORT HEADER
               Header will be different - dependent on the mobile indicator
            */
            if (data.length >= 1) {
                $('#tableheader').html('<span class="reportLabel">Game</span> : ' +
                    '<span class="reportLabelText">' + GameData.Name + '</span>' +
                    '<br/><span class="reportLabel reportLabelMargin">Player:</span> ' +
                    '<span class="reportLabelText">' + data[0].PlayerName + '</span>' +
                    ' <span class="reportLabel reportLabelMargin">Score:</span> ' + CalcTestScore(data) + '%');
            }

            /*
            SETUP GOOGLE TABLE DATA
            */
            var tdata = new google.visualization.DataTable();

            tdata.addColumn('string', 'Question');
            tdata.addColumn('string', 'Selections');
            tdata.addColumn('string', 'Correct Choices');

            rowlength = 3;
            rowVector = new Array(rowlength);

            correctCount = 0;
            for (var i = 0; i < data.length; i++) {

                cellClassName = 'googleReportCellNOWB';
                if (data[i].QuestionCorrect == 1) {
                    cellClassName = 'googleReportCellYESWB'
                    correctCount++;
                } else {
                    cellClassName = 'googleReportCellNOWB';
                }

                row = 0;
                rowVector[row++] = { v: data[i].Question, p: { 'className': 'googleReportCell' } };
                rowVector[row++] = { v: data[i].SelectedChoices, p: { 'className': cellClassName } };
                rowVector[row++] = { v: data[i].CorrectChoices, p: { 'className': 'googleReportCellWB' } };

                tdata.addRow(rowVector);
            }

            $('.tableHeader').html(correctCount + ' Correct out of ' + data.length + ' Questions');

            var options = {
                allowHtml: true,
                cssClassNames: {
                    headerCell: 'googleReportTableHeader',
                    tableCell: 'googleReportTableNonHeader',
                    tableRow: 'googleReportTableNonHeader'
                }
            };

            var tableAll = new google.visualization.Table(document.getElementById('table_div'));
            google.visualization.events.addListener(tableAll, 'select', selectHandler);
            tableAll.draw(tdata, options);

            app.AlignTableCellContent();

            } catch (err) {
                app.popUpHelper('Error', app.GetGoogleChartFailureErrMessage('Chart Player Test Detail', err), null);
            }//try

            console.log('END RenderPlayerTestDetail');
        };//app.RenderPlayerTestDetail

        /*
        Display the Game LMS Summary report
        */
        app.RenderGameLMSSummary = function (data) {
            console.log('START RenderGameLMSSummary');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();


             //HANDLER FOR INTERACTIVITY
             selectHandler = function () {
                 console.log('selectHandler');
                 var selectedItem = chart.getSelection()[0]; //will get the playerstatusfilter either all, active, or inactive
                 if (selectedItem) {
                     var playerStatusFilter = 0;
                     if (selectedItem.row == 1) {
                         playerStatusFilter = 1;
                     } else if (selectedItem.row == 2) {
                         playerStatusFilter = 2;
                     }

                     console.log('The player selected ' + playerStatusFilter);
                     app.DrawReport(ReportType.PlayerLMSSummary,result.GameId,result.GameCode,0,0,playerStatusFilter);
                 }
             };

             //Let's start catching exceptions
             try {

                 $('#chartreport #charttitle').html('Game LMS Summary'); //Set the title

                 /*
                 SETUP REPORT HEADER
                Back button will not exist if report loads within an iFrame (then its in mobile mode)
                 */
                 switch (data.GameStatus) {
                     case SERVER_GAME_STATUS_UNKNOWN:
                         statusText = 'Unknown';
                         break;
                     case SERVER_GAME_STATUS_NOTSTARTED:
                         statusText = 'Not Started';
                         break;
                     case SERVER_GAME_STATUS_STARTEDNOQUESTIONPASSED:
                         if (data.MaxQuestionNbrSubmitted != VAR_NONE) {
                             statusText = 'Started';
                         } else {
                             statusText = 'Started - No Submissions Yet';
                         }
                         break;
                     case SERVER_GAME_STATUS_ACTIVE:
                         statusText = 'Active';
                         break;
                     case SERVER_GAME_STATUS_SUSPENDED:
                         statusText = 'Suspended';
                         break;
                     case SERVER_GAME_STATUS_COMPLETED:
                         statusText = 'Completed';
                         break;
                 };

                 //There will be data for most recent question deadline regardless of the status of the 
                 //game. If the first question's deadline HAS NOT passed then nbr will be -1.
                 if (data.MostRecentQuestionNbrDeadlinePassed != VAR_NONE) {
                     mostRecentQuestionNbrDeadlinePassed = data.MostRecentQuestionNbrDeadlinePassed + 1;
                     dateMostRecentDeadline = new Date(data.MostRecentQuestionDeadlinePassed);
                     mostRecentQuestionDeadlinePassed = (GetInCommmonLocaleDateString(dateMostRecentDeadline) + ' ' + GetInCommmonLocaleTimeString(dateMostRecentDeadline));
                 } else {
                    mostRecentQuestionNbrDeadlinePassed = "None";
                    mostRecentQuestionDeadlinePassed = "None";
                 }


                 $('#chartreport #chartheader').html('<span class="reportLabel">Game:</span> ' +
                                        '<span class="reportLabelText">' + GameData.Name + '</span>' +
                                        '<span class="reportLabel" style="margin-left:23px">Status:</span> ' +
                                        '<span class="reportLabelText">' + statusText + '</span>' +
                                        '<br/><span class="reportLabel">Question# Deadline Passed: </span>' +
                                        ' <span class="reportLabelText">' + mostRecentQuestionNbrDeadlinePassed + '</span>' +
                                        '<br/><span class="reportLabel">Deadline:</span> ' +
                                        '<span class="reportLabelText">' + mostRecentQuestionDeadlinePassed + '</span>'
                                        //'<br/><span class="reportLabel">Total Questions: </span>' +
                                        //'<span class="reportLabelText">' + data.GameNbrQuestions + '</span>'
                     );

                 //Check if there is any data
                 if (data.NbrPlayers == 0) {
                     $('#chart_div').html('<br/><br/><span class="reportNoDataText">No players have played this LMS game yet</span>');
                     return;
                 }


                 /*
                 SETUP GOOGLE CHART DATA
                 */
                 var dSeries = new Array(4)
                 dSeries[0] = new Array(4)
                 dSeries[0][0] = 'Status';
                 dSeries[0][1] = '# of Players';
                 dSeries[0][2] = { role: 'annotation' };
                 dSeries[0][3] = { role: 'style' };

                 legendStrTotal = '';
                 legendStrActive = '';
                 legendStrInactive = '';
                 dSeries[1] = new Array(3)
                 dSeries[1][0] = 'All';
                 dSeries[1][1] = data.NbrPlayers;
                 (data.NbrPlayers > 0) ? legendStrTotal = '(' + data.NbrPlayers + ')' : legendStrTotal = '';
                 dSeries[1][2] = legendStrTotal;
                 dSeries[1][3] = '#000000';

                 dSeries[2] = new Array(3)
                 dSeries[2][0] = 'Standing';
                 dSeries[2][1] = data.NbrPlayersActive;
                 (data.NbrPlayersActive > 0) ? legendStrActive = '(' + data.NbrPlayersActive + ')' : legendStrActive = '';
                 dSeries[2][2] = legendStrActive;
                 dSeries[2][3] = '#00ff00';

                 dSeries[3] = new Array(3)
                 dSeries[3][0] = 'Sitting';
                 dSeries[3][1] = data.NbrPlayersInactive;
                 (data.NbrPlayersInactive > 0) ? legendStrInactive = '(' + data.NbrPlayersInactive + ')' : legendStrInactive = '';
                 dSeries[3][2] = legendStrInactive;
                 dSeries[3][3] = '#ff0000';


                 /*
                 SETUP V-AXIS
                 */
                 var hAxisText = '#Questions Submitted';

                 var tdata = google.visualization.arrayToDataTable(dSeries);

                 /*
                 SETUP GOOGLE CHART STYLE THROUGH OPTIONS
                 */

                 var options = {};
                 options = {
                     isStacked: true,
                     height: Math.round(120 * 3),
                     chartArea: { left: 75, top: 10, width: '80%', height: '80%' },
                     colors: ['#262626'],
                     vAxis: { title: 'Player Status', titleTextStyle: { fontSize: '15' } },
                     hAxis: {
                         title: hAxisText,
                         format: '#',
                         titleTextStyle: { fontSize: '15' },
                     },
                     backgroundColor: 'transparent',
                     bar: { groupWidth: "80%" },
                     legend: { position: 'top', alignment: 'end', textStyle: { color: 'red', fontSize: 16 } },
                 };

                 var chart = new google.visualization.BarChart($('#chartreport #chart_div')[0]); //jquery for document.getElementById
                 google.visualization.events.addListener(chart, 'select', selectHandler);
                 chart.draw(tdata, options);

                 console.log('END func RenderGameLMSSummary')

             } catch (err) {
                 app.popUpHelper('Error', app.GetGoogleChartFailureErrMessage('Chart Game LMS Summary', err), null);
             }//try

             console.log('END RenderGameLMSSummary');
        }//RenderGameLMSSummary

        /*
        Display the Player LMS Summary report
        */
        app.RenderPlayerLMSSummary = function (data) {
            console.log('START RenderPlayerLMSSummary');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //HANDLER FOR INTERACTIVITY
            selectHandler = function () {
                console.log('selectHandler');
                var selectedItem = chart.getSelection()[0]; //will get player name
                if (selectedItem) {
                    var playerId = data[selectedItem.row].PlayerId;
                    console.log('The player selected ' + playerId);
                    app.DrawReport(ReportType.LMSDetail,result.GameId,result.GameCode,playerId,0,0);
                }
            };

            //Let's start catching exceptions
            try {

                $('#chartreportback #charttitle').html('Player LMS Summary'); //Set the title

                /*
                SETUP GOOGLE CHART DATA
                */
                maxTickValue = 0;
                nbrAnswersCorrect = 0;
                nbrAnswersIncorrect = 0;
                nbrAnswersNotOntime = 0;
                maxSubmittedQuestionNbr = 0;

                var dSeries = new Array(data.length + 1);
                dSeries[0] = new Array(4)
                dSeries[0][0] = 'Player';
                dSeries[0][1] = 'Correct';
                dSeries[0][2] = { role: 'annotation' };
                dSeries[0][3] = 'Incorrect';
                dSeries[0][4] = { role: 'annotation' };
                dSeries[0][5] = 'Late';
                dSeries[0][6] = { role: 'annotation' };

                for (var i = 0; i < data.length; i++) {

                    dSeries[i + 1] = new Array(3)
                    dSeries[i + 1][0] = data[i].PlayerName;

                    //Based on the player's status, number of questions submitted, and
                    //the game reason we can derive how many answers submitted were correct
                    //and if there was an incorrect answer or an answer that was not submitted in-time
                    if (data[i].PlayerStatus) {
                        nbrAnswersCorrect = data[i].QuestionNbrLastSubmitted + 1;
                        nbrAnswersIncorrect = 0;
                        nbrAnswersNotOntime = 0;
                    } else {
                        if (data[i].PlayerGameReason == ANSWER_REASON_INCORRECT) {
                            nbrAnswersCorrect = data[i].QuestionNbrLastSubmitted;
                            nbrAnswersIncorrect = 1;
                            nbrAnswersNotOntime = 0;
                        } else if (data[i].PlayerGameReason == ANSWER_REASON_DEADLINE) {
                            nbrAnswersCorrect = data[i].QuestionNbrLastSubmitted + 1;
                            nbrAnswersIncorrect = 0;
                            nbrAnswersNotOntime = 1;
                        } else {
                            nbrAnswersCorrect = data[i].QuestionNbrLastSubmitted;
                            nbrAnswersIncorrect = 1;
                            nbrAnswersNotOntime = 0;
                        }
                    }//if (data[i].PlayerStatus) {
                    maxSubmittedQuestionNbr = Math.max(maxSubmittedQuestionNbr, nbrAnswersCorrect + nbrAnswersIncorrect + nbrAnswersNotOntime);

                    dSeries[i + 1][1] = nbrAnswersCorrect;
                    (nbrAnswersCorrect > 0) ? dSeries[i + 1][2] = '(' + (nbrAnswersCorrect) + ')' : dSeries[i + 1][2] = '';

                    dSeries[i + 1][3] = nbrAnswersIncorrect;
                    (nbrAnswersIncorrect > 0) ? dSeries[i + 1][4] = '(' + (nbrAnswersIncorrect) + ')' : dSeries[i + 1][4] = '';

                    dSeries[i + 1][5] = nbrAnswersNotOntime;
                    (nbrAnswersNotOntime > 0) ? dSeries[i + 1][6] = '(' + (nbrAnswersNotOntime) + ')' : dSeries[i + 1][6] = '';

                    maxTickValue = Math.max(maxTickValue, data[i].QuestionNbrLastSubmitted + 1);

                }//for (var i = 0; i < data.length; i++) {

                /*
                SETUP REPORT HEADER
                Header will be different - dependent on the mobile indicator
                Back button will not exist if report loads within an iFrame (then its in mobile mode)
                */
                mostRecentQuestionDeadlinePassed = new Date(data[0].MostRecentQuestionDeadlinePassed);
                if (mostRecentQuestionDeadlinePassed.getTime() != DATETIME_MINIMUM) {
                    mostRecentQuestionDeadlinePassedV = GetInCommmonLocaleDateString(mostRecentQuestionDeadlinePassed) + ' ' + GetInCommmonLocaleTimeString(mostRecentQuestionDeadlinePassed);
                } else {
                    mostRecentQuestionDeadlinePassedV = "None";
                }

                $('#chartreportback #chartheader').html('<span class="reportLabel">Game:</span> ' +
                                  '<span class="reportLabelText">' + GameData.Name + '</span>' + 
                                  '<br/><span class="reportLabel">#Ques Submitted:</span> ' +
                                  '<span class="reportLabelText">' + maxSubmittedQuestionNbr + '</span> ' +
                                  '</br><span class="reportLabel">Last Ques Dead:</span> ' + 
                                  '<span class="reportLabelText">' + mostRecentQuestionDeadlinePassedV + '</span>');

                var tdata = google.visualization.arrayToDataTable(dSeries);

                /*
                SETUP V-AXIS
                */
                var hAxisText = '#Questions Submitted';

                /*
                SETUP GOOGLE CHART STYLE THROUGH OPTIONS
                */

                //We're going use just 5 gridlines (vertical). The first will be 0 (doesn't count)
                //, the last will be the max
                tickArray = GetChartAxisTickets(0, maxTickValue, 4);

                var options = {};
                options = {
                    //title: 'TITLE',
                    //width: 95%, DONT NEED THIS; WE HAVE TURNED ON RESIZING
                    height: Math.round(67 * data.length + 150),
                    chartArea: { left: 75, top: 25, width: '80%', height: '75%' }, //WIDTH CONTROLS IF YOU CAN SEE THE LAST TICK NUMBER
                    colors: ['#00ff00', '#ff0000','#000000'],
                    vAxis: { title: 'Players', titleTextStyle: { fontSize: '15' }, textStyle: {fontSize: '10'} },
                    hAxis: {
                        title: hAxisText,
                        format: '#',
                        titleTextStyle: { fontSize: '15' },
                        ticks: tickArray
                    },
                    backgroundColor: 'transparent',
                    bar: { groupWidth: "75%" }, //CONTROLS SIZE OF BAR AND SPACE BETWEEN BARS
                    isStacked: true,
                    legend: { position: 'top', alignment: 'end', textStyle: { fontSize: 11 } },
                };

                var chart = new google.visualization.BarChart($('#chartreportback #chart_div')[0]); //jquery for document.getElementById
                google.visualization.events.addListener(chart, 'select', selectHandler);
                chart.draw(tdata, options);

                console.log('END func RenderPlayerLMSSummary')

            } catch (err) {
                app.popUpHelper('Error', app.GetGoogleChartFailureErrMessage('Chart Game LMS Summary', err), null);
            }//try

            console.log('END RenderPlayerLMSSummary');
        }//RenderPlayerLMSSummary

        /*
        Display the Player LMS Detail report
        */
        app.RenderPlayerLMSDetail = function (data) {
            console.log('START RenderPlayerLMSDetail');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            //HANDLER FOR INTERACTIVITY
            selectHandler = function () {
                console.log('selectHandler');
                var selectedItem = chart.getSelection()[0]; //will get question id
                if (selectedItem) {
                    var questionId = data[selectedItem.row].QuestionId;
                    console.log('The question selected ' + questionId);

                    //no handling of an event at this time (9/4/14)
                }
            };

            //Let's start catching exceptions
            try {
                $('#tabletitle').html('Player LMS Detail'); //Set the title

                /*
                SETUP GOOGLE TABLE DATA
                */
                var tdata = new google.visualization.DataTable();

                tdata.addColumn('string', 'Question');
                tdata.addColumn('string', 'Selections');
                tdata.addColumn('string', 'Correct Choices');

                rowlength = 3;
                rowVector = new Array(rowlength);

                correctCount = 0;
                for (var i = 0; i < data.length; i++) {

                    cellClassName = 'googleReportCellNOWB';
                    if (data[i].SelectedChoices != null && data[i].SelectedChoices == data[i].CorrectChoices) {
                        cellClassName = 'googleReportCellYESWB'
                        correctCount++;
                    } else {
                        cellClassName = 'googleReportCellNOWB';
                    }

                    question = data[i].Question;
                    (data[i].SelectedChoices != null) ? selectedChoices = data[i].SelectedChoices : selectedChoices = "ANSWER NOT SUBMITTED";
                    CorrectChoices = data[i].CorrectChoices;

                    row = 0;
                    rowVector[row++] = { v: question, p: { 'className': 'googleReportCell' } };
                    rowVector[row++] = { v: selectedChoices, p: { 'className': cellClassName } };
                    rowVector[row++] = { v: CorrectChoices, p: { 'className': 'googleReportCellWB' } };

                    tdata.addRow(rowVector);
                }

                $('.tableHeader').html(correctCount + ' Correct out of ' + data.length + ' Questions');

                var options = {
                    allowHtml: true,
                    alternatingRowStyle: true,
                    cssClassNames: {
                        headerCell: 'googleReportTableHeader',
                        tableCell: 'googleReportTableNonHeader',
                        tableRow: 'googleReportTableNonHeader'
                    },
                    backgroundColor: 'transparent' //doesn't work for tables
                };

                /*
                SETUP REPORT HEADER
                   Header will be different - dependent on the mobile indicator
                   Back button will not exist if report loads within an iFrame (then its in mobile mode)
                */
                if (data.length >= 1) {
                    $('#tableheader').html('<span class="reportLabel">Game:</span> ' +
                                           '<span class="reportLabelText">' + GameData.Name + '</span>' +
                                           '<br/><span class="reportLabel reportLabelMargin">Player: </span>' +
                                           '<span class="reportLabelText">' + data[0].PlayerName + '</span>' +
                                           '<br/><span class="reportLabel reportLabelMargin">#Questions Correct: </span>' +
                                           '<span class="reportLabelText">' + correctCount + '</span>');
                }

                var tableAll = new google.visualization.Table(document.getElementById('table_div'));
                google.visualization.events.addListener(tableAll, 'select', selectHandler);
                tableAll.draw(tdata, options);

                app.AlignTableCellContent();

                console.log('END func RenderPlayerLMSDetail');
            } catch (err) {
                app.popUpHelper('Error', app.GetGoogleChartFailureErrMessage('Table Player LMS Detail', err), null);
            }//try

            console.log('END RenderPlayerLMSDetail');
        }// app.RenderPlayerLMSDetail
 
        /*
        Determines if there is any data to chart (returns true or false)
        based on game status
        */
        app.IsContentToChart = function (gameStatus) {
            console.log('START app.IsContentToChart');

            contentToChart = false;
            if (gameStatus != 0 &&
                gameStatus != 1 &&
                gameStatus != 2) {
                contentToChart = true;
            }

            console.log('END app.IsContentToChart');
            return contentToChart;

        }//app.IsContentToChart

        /*
        Dynamically align table cell content
        */
        app.AlignTableCellContent = function () {
            console.log('START app.AlignTableCellContent');

            //set the alignment of the cell contents. Can only do this after the fact
            $('.googleReportTableHeader').css('vertical-align', 'top');
            $('.googleReportCellYES').css('vertical-align', 'top');
            $('.googleReportCellNO').css('vertical-align', 'top');
            $('.googleReportCell').css('vertical-align', 'top');
            $('.googleReportCellYESWB').css('vertical-align', 'top');
            $('.googleReportCellNOWB').css('vertical-align', 'top');
            $('.googleReportCellWB').css('vertical-align', 'top');

            console.log('END app.AlignTableCellContent');
        };//app.AlignTableCellContent

        /*
        get player name
        */
        app.GetPlayerName = function (firstName, nickName, lastName, email) {
            console.log('START app.GetPlayerName');

            //if no args are passed to function we get them from the current local storage (Result)
            if (arguments.length === 0) {
                result = app.GetResultLocalStorage();
                firstName = result.FirstName;
                nickName = result.NickName;
                lastName = result.LastName;
                email = result.Email;
            }

            //support backward compatibility. LastName and Email maybe undefined
            if (lastName == undefined) { lastName = "" };
            if (email == undefined) { email = "" };

            if (firstName != "" && lastName != "") {
                return firstName + '-' + lastName;
            } else if (firstName == "" && nickName != "" && lastName != "") {
                return nickName + '-' + lastName;
            } else if (firstName != "" && lastName == "" && nickName != "") {
                return firstName + '-' + nickName;
            } else if (firstName != "" && lastName == "" && nickName == "") {
                return firstName;
            } else if (firstName == "" && lastName != "" && nickName == "") {
                return lastName;
            } else if (firstName == "" && lastName == "" && nickName != "") {
                return nickName;
            } else if (firstName == "" && lastName == "" && nickName == "" && email != "") {
                return email; //last hope
            } else {
                return PLAYER_NOT_NAMED;
            }

            console.log('END app.GetPlayerName');
        }//app.GetPlayerName

        /*
        returns number of questions answered
        */
        app.NbrQuestionsAnswered = function () {
            console.log('START app.NbrQuestionsAnswered');

            questionsAnswered = 0;
            result = app.GetResultLocalStorage();
            for (i = 0; i < GameData.GameQuestions.length; i++) {
                if (result.GameQuestions[i]["SelChoiceId"] != NO_ANSWER) questionsAnswered++;
            }

            console.log('END app.NbrQuestionsAnswered');
            return questionsAnswered;
        };//app.NbrQuestionsAnswered

        /*
        Pop Active Game into Current Game Storage (if needed)
        */
        app.PopActiveGameFromQueueIntoCurrent = function () {
            console.log('START app.PopActiveGameFromQueueIntoCurrent');

            if (app.GetActiveGameIndexInQueue() != -1) {
                app.PopQueueGames();
            }

            console.log('END app.PopActiveGameFromQueueIntoCurrent');
        }//app.PopActiveGameFromQueueIntoCurrent

        /*
        (PUSH) Queue Games Submitted/Active - Keep the last GameQueueMax
        */
        app.PushQueueGames = function (gameState) {
            console.log('START app.PushQueueGames');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();
            gameConfig = app.GetGameConfigLocalStorage();

            GameQueue = app.GetGameQueueLocalStorage();
            GameListQueue = app.GetGameListQueueLocalStorage();

            queueNbrStart = Math.min(GameQueue.length - 1, GameQueueMax - 2); //we are only going to save (GameQueueMax) submitted games

            for (var i = queueNbrStart; i >= 0; i--) {
                GameListQueue[i + 1] = {};
                GameQueue[i + 1] = {};
                GameListQueue[i + 1] = GameListQueue[i];
                GameQueue[i + 1] = GameQueue[i];
            }

            GameListQueue[0] = {};
            GameQueue[0] = {};

            //we want to save certain game data for the home page list of submitted games
            GameListQueue[0]["GameId"] = result["GameId"];
            GameListQueue[0]["GameCode"] = result["GameCode"];
            GameListQueue[0]["Name"] = GameData.Name;
            GameListQueue[0]["FirstName"] = result.FirstName;
            GameListQueue[0]["NickName"] = result.NickName;
            GameListQueue[0]["LastName"] = result.LastName;
            GameListQueue[0]["Email"] = result.Email;
            GameListQueue[0]["GameState"] = gameState;
            GameListQueue[0]["GameType"] = result.GameType;

            GameQueue[0].Game = GameData;
            GameQueue[0].Result = result;
            GameQueue[0].GameConfig = gameConfig; //storing game configs local - MNS 4-19-15
            app.PutGameListQueueLocalStorage(GameListQueue);
            app.PutGameQueueLocalStorage(GameQueue);

            console.log('END app.PushQueueGames');
        };//app.PushQueueGames

        /*
        (POP) Queue Games Submitted/Active
        */
        app.PopQueueGames = function () {
            console.log('START app.PopQueueGames');

            GameQueue = app.GetGameQueueLocalStorage();
            GameListQueue = app.GetGameListQueueLocalStorage();

            app.PutGameLocalStorage(GameQueue[0].Game);
            app.PutResultLocalStorage(GameQueue[0].Result);
            app.PutGameConfigLocalStorage(GameQueue[0].GameConfig); //storing game configs local - MNS 4-19-15

            //we want to set the correct game state
            result = app.GetResultLocalStorage();
            new app.Game().SetGameState(result.GameState);

            queueNbrStart = 0;
            for (var i = queueNbrStart; i < GameQueue.length-1; i++) {
                GameListQueue[i] = GameListQueue[i + 1];
                GameQueue[i] = GameQueue[i + 1];
            }

            //removes the last item of the game queue
            GameQueue.splice(GameQueue.length - 1, 1);
            GameListQueue.splice(GameQueue.length - 1, 1);

            //store the new order queue
            app.PutGameListQueueLocalStorage(GameListQueue);
            app.PutGameQueueLocalStorage(GameQueue);

            console.log('END app.PopQueueGames');
        };//app.PopQueueGames

        /*
        returns true if there are games in the queue
        */
        app.IsGamesInQueue = function (gameState) {
            console.log('START app.IsGamesInQueue');
            returnStatus = false;

            GameListQueue = app.GetGameListQueueLocalStorage();
            for (i = 0; i <= GameListQueue.length - 1; i++) {
                if (GameListQueue[i].GameState == gameState) {
                    returnStatus = true;
                }
                if (returnStatus) break;
            }

            console.log('END app.IsGamesInQueue');
            return returnStatus;
        };//app.IsGamesInQueue(gameState)

        /*
        Get number of games in queue for a game state.
        If no game state passed; then it will count all games in the queue
        */
        app.GetNbrGamesInQueue = function (gameState) {
            console.log('START app.GetNbrGamesInQueue');
            getAllGamesInd = false;
            if (gameState == undefined) getAllGamesInd = true;

            count = 0;
            GameListQueue = app.GetGameListQueueLocalStorage();
            for (i = 0; i <= GameListQueue.length - 1; i++) {
                if (GameListQueue[i].GameState == gameState || getAllGamesInd) {
                    count++;
                }
            }

            console.log('END app.GetNbrGamesInQueue');
            return count;
        };//app.IsGamesInQueue(gameState)

        /*
        Gets index of Active Game or SubmittedActive Game in Queue
        returns -1 if no active game in queue
        */
        app.GetActiveGameIndexInQueue = function () {
            console.log('START app.GetActiveGameIndexInQueue');
            index = -1;

            GameListQueue = app.GetGameListQueueLocalStorage();
            for (i = 0; i <= GameListQueue.length - 1; i++) {
                if (GameListQueue[i].GameState == GameState.Active || GameListQueue[i].GameState == GameState.SubmittedActive) {
                    index = i;
                }
                if (index != -1) break;
            }

            console.log('END app.GetActiveGameIndexInQueue');
            return index;
        };//app.IsGamesInQueue(gameState)

        /*
        return if the game has been submitted already (looking at the queue)
        arguments
        GameId
        */
        app.IsGameSubmitted = function (GameId) {
            console.log('START app.IsGameSubmitted');

            isSubmitted = false;

            GameListQueue = app.GetGameListQueueLocalStorage();

            for (i = 0; i < GameListQueue.length; i++) {
                if (GameListQueue[i]["GameId"] == GameId) {
                    isSubmitted = true;
                }

                if (isSubmitted) break;
            }

            console.log('END app.IsGameSubmitted');
            return isSubmitted;
        };//app.IsGameSubmitted 

        /*
        Handle AJAX Failure
        */
        app.GetAJAXFailureErrMessage = function (requestDesc, textStatus, error) {
            console.log('START app.GetAJAXFailureErrMessage');

            errorDetailDescLine = '';
            if (textStatus != 'error' || error != '') {
                errorDetailDescLine = '<br/>(' + textStatus + ", " + error + ')';
            }

            console.log('END app.GetAJAXFailureErrMessage');
            return 'There were connectivity issues for <i>' + requestDesc + '</i>.' + errorDetailDescLine;
        };//app.GetAJAXFailureErrMessage

        /*
        Handle Google Chart Failure
        */
        app.GetGoogleChartFailureErrMessage = function (requestDesc, error) {
            console.log('START app.GetGoogleChartFailureErrMessage');

            errorDetailDescLine = '';
            if (error != '') {
                errorDetailDescLine = '<br/>(' + error + ')';
            }

            console.log('END app.GetGoogleChartFailureErrMessage');
            return 'There were connectivity issues for <i>' + requestDesc + '</i>.' + errorDetailDescLine;
        };//app.GetGoogleChartFailureErrMessage

        /*
        Popup Helper
        */
        app.popUpHelper = function (header, msg1, msg2) {
            console.log('START app.popUpHelper');

            /*
            if msg2 is null, then it won't be displayed
            */

            console.log('START app.popUpHelper')
            popupArgs = new PopupArgs();
            popupArgs.header = header;
            popupArgs.msg1 = msg1;
            popupArgs.msg2 = msg2;
            app.popUp(popupArgs);

            console.log('END app.popUpHelper');
        }//app.popUpHelper

        /*
        Setup and display popup
        */
        app.popUp = function (popupArgs) { //(header, msg1, msg2, btnYesHandler, btnNoHandler) {
            console.log('START app.popUp');

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

            console.log('END app.popUp');
        };//app.popUp

        /*
        Confirmation Dialog
        */
        app.confirmDialog = function (header, text, callback) {
            console.log('START app.confirmDialog');

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

            console.log('END app.confirmDialog');
        }//app.confirmDialog 

        /*
        GetConfigurationValue (supports both game and incommon global config parms)
        */
        app.GetConfigValue = function (configType, configName) {
            console.log('START app.GetConfigValue');

            if (configType == ConfigType.Game) {
                config = app.GetGameConfigLocalStorage();
            } else {
                config = app.GetInCommonConfigLocalStorage();
            }

            parmValue = 'EmptyValue';

            for (i = 0; i < config.length; i++) {

                if (config[i].Name == configName) {
                    parmValue = config[i].Value;
                }

                if(parmValue != 'EmptyValue' ) break;
            }

            console.log('END app.GetConfigValue');
            return parmValue;
        };//app.GetConfigValue

        /*
        create Javascript Objects JSON for HTTP request
        */
        app.CreatePlayer = function () {
            console.log('START app.CreatePlayer');

            GameData = app.GetGameLocalStorage();
            result = app.GetResultLocalStorage();

            result["GameId"] = JSONdata.Id;
            result["FirstName"] = RESULT_NO_ANSWER;
            result["LastName"] = RESULT_NO_ANSWER;
            result["NickName"] = RESULT_NO_ANSWER;
            result["Email"] = RESULT_NO_ANSWER;
            result["Sex"] = SexType.Female;

            player = {};
            player["FirstName"] = result["FirstName"];
            player["LastName"] = result["LastName"];
            player["NickName"] = result["NickName"];
            player["Email"] = result["Email"];
            player["Sex"] = result["Sex"];

            console.log('END app.CreatePlayer');
            return player;
        };//app.CreatePlayer

        /*
        covert local to UTC datetime
        */
        app.DateLocalToUTC = function(dateLocal) {
            return new Date(Date.UTC(dateLocal.getFullYear(), dateLocal.getMonth(), dateLocal.getDate(), dateLocal.getHours(), dateLocal.getMinutes(), dateLocal.getSeconds()));
        }

        /*
        Decode ofuscated string from In Common server
        */
        function Base64Decode(encoded) {
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            do {
                enc1 = keyStr.indexOf(encoded.charAt(i++));
                enc2 = keyStr.indexOf(encoded.charAt(i++));
                enc3 = keyStr.indexOf(encoded.charAt(i++));
                enc4 = keyStr.indexOf(encoded.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            } while (i < encoded.length);

            return output;
        }//function Base64Decode(encoded)


        /* ***************************************************
        JavaScript Classes
        */

        /*
        Style all JQM Widgets
        Color, Focus
        */
        app.JQMWidgetsAllStyle = function (color) {
            console.log('START app.JQMWidgetsAllStyle');

            //Set color of the widgets, except we don't need to do the sex widget
            new app.JQMWidget("firstName").JQMSetCSS('color', color);
            new app.JQMWidget("nickName").JQMSetCSS('color', color);
            new app.JQMWidget("lastName").JQMSetCSS('color', color);
            new app.JQMWidget("email").JQMSetCSS('color', color);

            //Set focus of the appropriate widget (depending on precedence)
            widgetNameForFocus = "";
            //Set focus
            if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerFirstNamePrompted"))) {
                widgetNameForFocus = "firstName";
            } else if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerNickNamePrompted"))) {
                widgetNameForFocus = "nickName";
            } else if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerLastNamePrompted"))) {
                widgetNameForFocus = "lastName";
            } else {
                widgetNameForFocus = "email";
            }
            $('#' + widgetNameForFocus).focus(); //put the focus for text input

            console.log('END app.JQMWidgetsAllStyle');
        }//app.JQMWidgetsAllStyle
        /*
        Disable all widgets
        */
        app.JQMWidgetsAllDisable = function () {
            console.log('START app.JQMWidgetsAllDisable');
            new app.JQMWidget("firstName").JQMSetAttr("disabled", "disabled");
            new app.JQMWidget("nickName").JQMSetAttr("disabled", "disabled");
            new app.JQMWidget("lastName").JQMSetAttr("disabled", "disabled");
            new app.JQMWidget("email").JQMSetAttr("disabled", "disabled");
            new app.JQMWidget("sex").JQMSetAttr("disabled", "disabled");
            console.log('END app.JQMWidgetsAllDisable');
        }
        /*
        Validate all JQM Widgets that are enabled.
        If all is successful; will return true.
        If one is not successful then will throw an error
        */
        app.JQMWidgetsAllValidate = function () {
            console.log('START app.JQMWidgetsAllValidate');

            minNameLength = parseInt(app.GetConfigValue(ConfigType.Game, "MinNameLengthPrompted"));
            maxNameLength = parseInt(app.GetConfigValue(ConfigType.Game, "MaxNameLengthPrompted"));

            if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerFirstNamePrompted"))) {

                if ($('#firstName').val().length < minNameLength ||
                    $('#firstName').val().length > maxNameLength ||
                    $('#firstName').val().indexOf(" ") != -1) {
                    throw Error('The first name must be between ' + minNameLength + ' and ' + maxNameLength + ' characters and contain no spaces.');
                    return;
                }
            }

            if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerNickNamePrompted"))) {
                if ($('#nickName').val().length < minNameLength ||
                    $('#nickName').val().length > maxNameLength ||
                    $('#nickName').val().indexOf(" ") != -1) {
                    throw Error('The nickname must be between ' + minNameLength + ' and ' + maxNameLength + ' characters and contain no spaces.');
                    return;
                }
            }

            if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerLastNamePrompted"))) {
                if ($('#lastName').val().length < minNameLength ||
                    $('#lastName').val().length > maxNameLength ||
                    $('#lastName').val().indexOf(" ") != -1) {
                    throw Error('The last Name must be between ' + minNameLength + ' and ' + maxNameLength + ' characters and contain no spaces.');
                    return;
                }
            }

            console.log('END app.JQMWidgetsAllValidate');
            return true;
        }

        /*
        jQuery Mobile Widget class and methods
        */
        app.JQMRender = function () {
            console.log('START app.JQMRender');
            returnJQM = "";
            if (this.Enabled) {
                switch (this.Widget) {
                    case "firstName":
                        returnJQM = '<label for="firstName">First Name</label>' +
                        '<input name="firstName" id="firstName" type="text" value="" data-clear-btn="true">';
                        break;
                    case "nickName":
                        returnJQM = '<label for="nickName">Nickname</label>' +
                        '<input name="nickName" id="nickName" type="text" value="" data-clear-btn="true">';
                        break;
                    case "lastName":
                        returnJQM = '<label for="lastName">Last Name</label>' +
                        '<input name="lastName" id="lastName" type="text" value="" data-clear-btn="true">';
                        break;
                    case "email":
                        returnJQM = '<label for="email">Email</label>' +
                        '<input name="email" id="email" type="text" value="" data-clear-btn="true">';
                        break;
                    case "sex":
                        returnJQM = '<fieldset data-role="controlgroup" data-type="horizontal">' +
                        '<legend>Sex</legend>' +
                        '<input name="sex" id="sex-male" type="radio" checked="checked" value="on">' +
                        '<label for="sex-male" style="font-size:0.8em;color: black;font-weight:bold;text-shadow: 0 0 0;text-align:center">Male</label>' +
                        '<input name="sex" id="sex-female" type="radio">' +
                        '<label for="sex-female" style="font-size:0.8em;color: black;font-weight:bold;text-shadow: 0 0 0">Female</label>' +
                        '</fieldset>';
                        break;
                }//switch (this.Widget)
            } //if (this.Enabled)

            console.log('END app.JQMRender');
            return returnJQM;
        }//app.JQMRender
        app.JQMSetValue = function () {
            console.log('START app.JQMSetValue');
            if (this.Enabled) {

                if (this.Widget != "sex") {
                    $("input[name='" + this.Widget + "']").attr('value', this.Value);
                } else {

                    if (this.Value == SexType.Male) {
                        $('#sex-male').attr("checked", true);
                        $('#sex-female').attr("checked", false);
                    } else {
                        $('#sex-male').attr("checked", false);
                        $('#sex-female').attr("checked", true);
                    }
                }

            }
            console.log('END app.JQMSetValue');
        }// app.JQMSetValue
        app.JQMGetValue = function () {
            console.log('START app.JQMGetValue');
            this.Value = RESULT_NO_ANSWER;
            if (this.Enabled) {
                if (this.Widget != "sex") {
                    this.Value = $('#' + this.Widget).val()
                } else {
                    if ($('#sex-male').attr("checked") == "checked") {
                        this.Value = SexType.Male;
                    } else {
                        this.Value = SexType.Female;
                    }
                }
            }//if (this.Enabled)

            console.log('END app.JQMGetValue');
            return this.Value;
        }// app.JQMGetValue
        app.JQMSetCSS = function (property, color) {
            console.log('START app.JQMSetCSS');
            if (this.Enabled) {
                $('#' + this.Widget).css(property, "black");
            }

            console.log('END app.JQMSetCSS');
        }// app.JQMSetCSS
        app.JQMSetAttr = function (attr, attrValue) {
            console.log('START app.JQMSetAttr');
            if (this.Enabled) {
                $('#' + this.Widget).attr(attr, attrValue);
            }
            console.log('END app.JQMSetAttr');
        }// app.JQMSetAttr
        app.JQMWidget = function (widget) {
            console.log('START app.JQMWidget');
            _result = app.GetResultLocalStorage();
            this.Widget = widget;
            this.Enabled = false;
            this.Value = "";
            switch (this.Widget) {
                case "firstName":
                    if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerFirstNamePrompted"))) {
                        this.Enabled = true;
                        this.Value = _result.FirstName;
                    }
                    break;
                case "nickName":
                    if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerNickNamePrompted"))) {
                        this.Enabled = true;
                        this.Value = _result.NickName;
                    }
                    break;
                case "lastName":
                    if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerLastNamePrompted"))) {
                        this.Enabled = true;
                        this.Value = _result.LastName;
                    }
                    break;
                case "email":
                    if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerEmailPrompted"))) {
                        this.Enabled = true;
                        this.Value = _result.Email;
                    }
                    break;
                case "sex":
                    if ($.parseJSON(app.GetConfigValue(ConfigType.Game, "PlayerSexPrompted"))) {
                        this.Enabled = true;
                        this.Value = _result.Sex;
                    }
                    break;
            }//switch (this.Widget)

            this.JQMRender = app.JQMRender
            this.JQMSetValue = app.JQMSetValue
            this.JQMGetValue = app.JQMGetValue
            this.JQMSetAttr = app.JQMSetAttr

            console.log('END app.JQMWidget');
        }//app.RenderJQM(widget)

        /*
        Player class and methods
        */
        app.PlayerCreate = function () {
            console.log('START app.PlayerCreate');

            this._Player["GameId"] = this._result["GameId"];
            this._Player["GameCode"] = this._result["GameCode"];

            if (this._result.PlayerId == RESULT_NO_ANSWER) {
                this._Player["Id"] = 0; //no player id yet.
                //The following player properties are optionally depending on game configuration
                if (this._result["FirstName"] != RESULT_NO_ANSWER) this._Player["FirstName"] = this._result["FirstName"];
                if (this._result["NickName"] != RESULT_NO_ANSWER) this._Player["NickName"] = this._result["NickName"];
                if (this._result["LastName"] != RESULT_NO_ANSWER) this._Player["LastName"] = this._result["LastName"];
                if (this._result["Email"] != RESULT_NO_ANSWER) this._Player["Email"] = this._result["Email"];
                this._Player["Sex"] = result["Sex"];
            } else {
                //only need player id after its been recorded.
                this._Player["Id"] = this._result.PlayerId; //If the result possesses a PlayerId then playing LMS and player has already answered at least one question
            }

            this._Player["ClientVersion"] = probeVersion;

            console.log('END app.PlayerCreate');
            return this._Player;
        }
        app.Player = function () {
            console.log('START app.Player');
            this._result = app.GetResultLocalStorage();
            this._Player = {};
            this.PlayerCreate = app.PlayerCreate
            console.log('END app.Player');
        }//app.Player

        /*
        GameQuestions class and methods
        */
        app.GameAnswersCreate = function (player) {
            console.log('START app.GameAnswersCreate');

            if (this._result.GameType != GameType.LMS) {
                //submit all question-answers. we assume all questions have been answered for this game 
                for (i = 0; i < this._GameData.GameQuestions.length; i++) {
                    this._GameAnswers[i] = {};
                    this._GameAnswers[i]["PlayerId"] = player.Id;
                    this._GameAnswers[i]["GameCode"] = this._result.GameCode;
                    this._GameAnswers[i]["QuestionNbr"] = i + 1;
                    this._GameAnswers[i]["QuestionId"] = this._result.GameQuestions[i]["QuestionId"];
                    this._GameAnswers[i]["ChoiceId"] = this._result.GameQuestions[i]["SelChoiceId"];
                }
            } else {
                //submit only the current question for this LMS game. we submit one answer at a time
                this._GameAnswers[0] = {};
                this._GameAnswers[0]["PlayerId"] = player.Id;
                this._GameAnswers[0]["GameCode"] = this._result.GameCode;
                this._GameAnswers[0]["QuestionNbr"] = currentQuestionNbr + 1; //Question # will always start with 1
                this._GameAnswers[0]["QuestionId"] = this._result.GameQuestions[currentQuestionNbr]["QuestionId"];
                this._GameAnswers[0]["ChoiceId"] = this._result.GameQuestions[currentQuestionNbr]["SelChoiceId"];
            }

            console.log('END app.GameAnswersCreate');
            return this._GameAnswers
        }//app.GameAnswersCreate
        app.GameAnswers = function () {
            console.log('START app.GameAnswers');
            this._result = app.GetResultLocalStorage();
            this._GameData = app.GetGameLocalStorage();
            this._GameAnswers = new Array();
            this.GameAnswersCreate = app.GameAnswersCreate
            console.log('END app.GameAnswers');
        }//app.Player

        /*
        Game class and methods
        */
        app.ProcessMessageForGAResponse = function (returnErrMsg) {
            console.log('START app.ProcessMessageForGAResponse');
            this.GameRefresh();



            //depending on game type (LMS or not)
            if (this._result.GameType == GameType.LMS) {
                if (this._result.PlayerActive && this._result.ServerResponse == SERVER_NO_ERROR) {
                    //LMS and player is still active. That means correct answer submission
                    popupMessage = this.ProcessMessage(CONFIG_ANSWERSUCCESS);
                } else if (!this._result.PlayerActive && this._result.ServerResponse == SERVER_NO_ERROR) {
                    //LMS and player is not active. That means incorrect answer submission
                    popupMessage = this.ProcessMessage(CONFIG_ANSWERFAIL);
                } else {
                    popupMessage = returnErrMsg;
                }

                if (popupMessage != null) {
                    app.popUpHelper('Info', popupMessage, null);
                }

            } else {
                //NOT LMS game
                popupMessage = this.ProcessMessage(CONFIG_ANSWERSUCCESS);
                if (returnErrMsg == null) {
                    app.popUpHelper('Info', popupMessage, null);
                } else {
                    //This occurs if there was an exception that was unanticipated. Bad error.
                    app.popUpHelper('Error', 'The submission of the Game<br/><span class="popupGameName">' + GameData.Name + '</span><br/> was NOT successful.<p>' + returnErrMsg + '</p>', null);
                }

            }//if (this._result.GameType == GameType.LMS)

            console.log('END app.ProcessMessageForGAResponse');
        }//app.ProcessMessageForGAResponse =
        app.ProcessMessage = function (configName) {
            console.log('START app.ProcessMessage');
            this.GameRefresh();

            //process message and replace variables placed within the message
            originalMsg = app.GetConfigValue(ConfigType.Game, configName);
            returnMsg = originalMsg.replace('Game.Name', this._GameData.Name)
            returnMsg = returnMsg.replace('Player.Name', app.GetPlayerName(this._result.FirstName, this._result.NickName, this._result.LastName, this._result.Email));

            console.log('END app.ProcessMessage');
            return returnMsg;
        }
        app.GetQuesWarningDate = function (questionNbr) {
            console.log('START app.GetQuesWarningDate');
            this.GameRefresh();

            //if for some reason the questionNbr goes beyond the total questions, we make the questionNbr the last
            if (questionNbr >= this._result.GameQuestions.length) {
                questionNbr = this._result.GameQuestions.length - 1;
            }
            console.log('END app.GetQuesWarningDate');
            return new Date(this._result["GameQuestions"][questionNbr]["QuestionWarningDT"]);
        }
        app.GetQuesStartDate = function (questionNbr) {
            console.log('START app.GetQuesStartDate');
            this.GameRefresh();

            //if for some reason the questionNbr goes beyond the total questions, we make the questionNbr the last
            if (questionNbr >= this._result.GameQuestions.length) {
                questionNbr = this._result.GameQuestions.length - 1;
            }
            console.log('END app.GetQuesStartDate');
            return new Date(this._result["GameQuestions"][questionNbr]["QuestionStartDT"]);
        }
        app.GetQuesDeadlineDate = function (questionNbr) {
            console.log('START app.GetQuesDeadlineDate');
            this.GameRefresh();

            //if for some reason the questionNbr goes beyond the total questions, we make the questionNbr the last
            if (questionNbr >= this._result.GameQuestions.length) {
                questionNbr = this._result.GameQuestions.length - 1;
            }
            console.log('END app.GetQuesDeadlineDate');
            return new Date(this._result["GameQuestions"][questionNbr]["QuestionDeadlineDT"]);
        }
        app.SetQuesCorrectionStyle = function (questionNbr) {
            console.log('START app.SetQuesCorrectionStyle');
            this.GameRefresh();

            $('#questionText').css('padding-top', '6px');

            //Changing the Question Choice radiobox background color for correct/incorrect answers 
            //will only happen for LMS
            if (this._result.GameType == GameType.LMS) {
                $('#questionText').css('padding-top', '10px');

                //if (this.IsClockCountdownEnable('qstart') || this.IsClockCountdownEnable('qdeadline')) { //MNS DEBUG
                //    alert('clock countdown going!');
                //}

                selChoiceId = this._result["GameQuestions"][questionNbr]["SelChoiceId"];

                $('#playerConsoleText').html(''); //blank it out
                $('#playerConsoleText').css('font-weight', 'bold');
                $('#playerConsoleText').css('text-align', 'center');
                //Let's decide what/if anything we say about the status of the answer (if there is an answer)
                if (selChoiceId != NO_ANSWER && questionNbr <= this._result.QuestionNbrSubmitted &&
                    !(this._result["GameQuestions"][questionNbr]["Reason"] == ANSWER_REASON_DEADLINE)) {
                    if (this._result["GameQuestions"][questionNbr]["Correct"]) {
                        $('[for="choice-' + selChoiceId + '"]').css('background', CORRECT_ANSWER_COLOR);
                        $('#playerConsoleText').html('**Correct Answer**');
                        $('#playerConsoleText').css('color', CORRECT_ANSWER_COLOR);
                    } else {
                        $('[for="choice-' + selChoiceId + '"]').css('background', INCORRECT_ANSWER_COLOR);
                        $('#playerConsoleText').html('**Incorrect Answer**');
                        $('#playerConsoleText').css('color', INCORRECT_ANSWER_COLOR);
                    }
                } else if (!this._result.PlayerActive &&
                            (this._result["GameQuestions"][questionNbr]["Reason"] == ANSWER_REASON_DEADLINE)) {
                    //when answer was not submitted because a dealine violation
                    $('#playerConsoleText').html('**Answer never submitted**');
                    $('#playerConsoleText').css('color', INCORRECT_ANSWER_COLOR);
                } else {
                    $('#playerConsoleText').html('');
                }
            } else {
                $('#playerConsoleText').html('');
            }//if (this._result.GameType == GameType.LMS)

            console.log('END app.SetQuesCorrectionStyle');
        }//app.SetQuesCorrectionStyle
        app.IsNewQuestionDeadlineNotPassed = function () {
            console.log('START app.IsNewQuestionDeadlineNotPassed');
            this.GameRefresh();

            if (this._result.GameType == GameType.LMS) {

                dateCurrentQuestionDeadlineLocal = this.GetQuesDeadlineDate(this._result.QuestionNbrSubmitted + 1);
                dateCurrentLocal = new Date();
                console.log('deadline: ' + dateCurrentQuestionDeadlineLocal.getTime() + ' current:' + dateCurrentLocal.getTime());
                return (dateCurrentLocal <= dateCurrentQuestionDeadlineLocal);

            } else {
                return true;
            }

            console.log('END app.IsNewQuestionDeadlineNotPassed');
        }//app.this.IsNewQuestionTooLate = function () 
        app.SetQuesCountdown = function (questionNbr,oneTimeInd) {
            console.log('START app.SetQuesCountdown - questionNbr:' + questionNbr);
            this.GameRefresh();

            CountdownIntervalInSecs = parseInt(app.GetConfigValue(ConfigType.Game, "CountdownIntervalInSecs"));

            $('#questionText').css('padding-top', '6px');

            //We only do something if the game is LMS
            if (this._result.GameType == GameType.LMS) {
                $('#questionText').css('padding-top', '10px');

                countDownClockHtml = '<ul id="qCountdown" class="countdownStyle"></ul>';

                //Grab all these local date/time
                dateCurrentQuestionStartLocal = this.GetQuesStartDate(questionNbr);
                dateNextQuestionStartLocal = this.GetQuesStartDate(this._result.QuestionNbrSubmitted + 1); //not really next - its the new question not answered
                dateCurrentQuestionDeadlineLocal = this.GetQuesDeadlineDate(questionNbr);
                dateNextQuestionDeadlineLocal = this.GetQuesDeadlineDate(this._result.QuestionNbrSubmitted + 1); //not really next - its the new question not answered
                dateCurrentQuestionWarningLocal = this.GetQuesWarningDate(questionNbr);
                dateNextQuestionWarningLocal = this.GetQuesWarningDate(this._result.QuestionNbrSubmitted + 1);
                dateCurrentLocal = new Date();

                if (((this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED && questionNbr == 0) ||
                      questionNbr == this._result.QuestionNbrSubmitted + 1)
                    && this._result.PlayerActive
                    && dateCurrentLocal >= dateCurrentQuestionStartLocal) {

                    //let's display a COUNTDOWN QUESTION DEADLINE clock (on the current question that needs to be answered page only) and the player is still active
                    //and the current time is after the question start date. 
                    //Note: If current date is after question deadline; countdown deadline will start but immediately will call handler

                    //make sure that we stop any other countdowns
                    this.SetClockCountdownEnable('qstart', false);

                    //Added the html infrastructure for the countdown clock
                    $('#playerConsoleText').html(countDownClockHtml);

                    //We won't start another countdown if already enabled. Unless we are doing a one-time only call which really isn't a countdown
                    if (!this.IsClockCountdownEnable('qdeadline') || oneTimeInd) {
                        GASubmitToInCommonInProgress = false; //reset the in progress boolean

                        //If we are here and oneTimeInd is false; then we know that we have to start a QUESTION DEADLINE countdown.
                        //Since we know that; and this is the first question - nothing has been submitted yet.
                        //Then we also may want to set a 'warning' local notification for the QUESTION DEADLINE
                        //enable all local notifications if necessary for the game
                        if (!oneTimeInd &&
                            this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED && questionNbr == 0) {
                            new app.Game().SetLocalNotifications(dateCurrentLocal, dateCurrentQuestionWarningLocal, dateCurrentQuestionDeadlineLocal);
                        }

                        //Setup for COUNT DOWN TO QUESTION DEADLINE
                        questionDeadlineDTUTC = app.DateLocalToUTC(dateCurrentQuestionDeadlineLocal);
                        $('#qCountdown').countdown({
                            id: 'qdeadline',
                            divAnchor: 'playerConsoleText',
                            date: questionDeadlineDTUTC,
                            dateBufferSecs: CLOCKCOUNTDOWN_BUFFER_SECS,
                            bufferTimeSecs: SUBMIT_BUFFERTIME_SECS,
                            clockInd: true,
                            OneTimeInd: oneTimeInd,
                            interval: CountdownIntervalInSecs,
                            color: '#00edf0',
                            warningSecs: 60,
                            warningColor: '#00edf0',
                            dateViewSecs: 10,
                            auxId1: 'listviewCountdown',
                            auxId2: 'popupCountdown'
                        }, function () {
                            //ATTENION: When passing the game object through the self executing function
                            //the popup doesn't stay up. Everything works. So we created a game object
                            //inside the function

                            //If the GameAnwer submit is in progress for some crazy / exceptional reason.. Then we will not follow through
                            //on the deadline handler
                            if (!GASubmitToInCommonInProgress) {
                                console.log('Question Deadline Countdown function start');

                                //If the LMS (active) game is not in current game storage, we have to put it there.
                                //If there is an active game in the queue always pop it back into current game storage
                                app.PopActiveGameFromQueueIntoCurrent();

                                //Will make the player inactive and the answer incorrect since it was never submitted
                                gameObj = new app.Game();
                                gameObj._result.PlayerActive = false;
                                gameObj._result.QuestionNbrSubmitted++; //increment the question submitted although question was just unananswered
                                gameObj._result["GameQuestions"][gameObj._result.QuestionNbrSubmitted]["Correct"] = false;
                                gameObj._result["GameQuestions"][gameObj._result.QuestionNbrSubmitted]["Reason"] = ANSWER_REASON_DEADLINE;
                                app.PutResultLocalStorage(gameObj._result);

                                ////When deadline has passed for an answer, this is just like posting an incorrect answer in many ways
                                gameObj.SetGameStatePostSubmit(); //will set game state to ReadOnly
                                gameObj.SetGamePostSubmit(GameState.ReadOnly);
                                gameObj.NavigateAfterGAResponse();

                                app.popUpHelper('Info', "I'm sorry, you have run out of time. The deadline for answering and submitting the question has passed. You'll have to sit out the rest of the game.", null);
                            } else {
                                console.log('QUESTION HANDLER DID NOT RUN - SUBMIT IN PROGRESS - SUBMIT IN PROGRESS');
                            }//if (!GASubmitToInCommonInProgress)
                        });

                    } //if (!this.IsClockCountdownEnable('qdeadline')) {

                } else if (((this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED && questionNbr == 0) ||
                            questionNbr <= this._result.QuestionNbrSubmitted)
                            && this._result.PlayerActive
                            && dateCurrentLocal < dateNextQuestionStartLocal) {

                    //let's display a COUNTDOWN QUESTION START clock (on all question pages) and the player is still active
                    //and the current time is before the new question start date. 

                    //make sure that we stop any other countdowns
                    this.SetClockCountdownEnable('qdeadline', false);

                    //Added the html infrastructure for the countdown clock
                    $('#playerConsoleText').html(countDownClockHtml);

                    //We won't start another countdown if already enabled.
                    if (!this.IsClockCountdownEnable('qstart') || oneTimeInd) {

                        //If we are here and oneTimeInd is false; then we know that we have to start a QUESTION START countdown.
                        //Since we know that; we also may want to set a 'warning' local notification for the QUESTION DEADLINE
                        //enable all local notifications if necessary for the game
                        if (!oneTimeInd) {
                            new app.Game().SetLocalNotifications(dateCurrentLocal, dateNextQuestionWarningLocal, dateNextQuestionDeadlineLocal);
                        }

                        //Setup for COUNT DOWN TO QUESTION START
                        questionStartDTUTC = app.DateLocalToUTC(dateQuestionStartLocal);
                        $('#qCountdown').countdown({
                            id: 'qstart',
                            divAnchor: 'playerConsoleText',
                            date: questionStartDTUTC,
                            dateBufferSecs: CLOCKCOUNTDOWN_BUFFER_SECS,
                            bufferTimeSecs: SUBMIT_BUFFERTIME_SECS,
                            clockInd: true,
                            OneTimeInd: oneTimeInd,
                            interval: CountdownIntervalInSecs,
                            color: '#00edf0',
                            warningSecs: 60,
                            warningColor: '#00edf0',
                            dateViewSecs: 10,
                            auxId1: 'listviewCountdown',
                            auxId2: 'popupCountdown'
                        }, function () {
                            console.log('Question Start Countdown function start');

                            //If the LMS (active) game is not in current game storage, we have to put it there.
                            //If there is an active game in the queue always pop it back into current game storage
                            app.PopActiveGameFromQueueIntoCurrent();
                            app.StartGame(true);
                            app.popUpHelper('Info', "The next question in your game has been queued up for you. Go for it!", null);
                        });

                    }//if (!this.IsClockCountdownEnable('qstart')) {

                }////if ( ((this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED && questionNbr == 0) ||

            }//if (this._result.GameType == GameType.LMS)

            console.log('END app.SetQuesCountdown');
        }//app.SetQuesCountdown
        app.RunQuesCountdownOnce = function () {
            console.log('START app.RunClockCountdownOnce');
            this.GameRefresh();

            //We only run the countdown once if the game is LMS
            if (this._result.GameType == GameType.LMS) {

                questionNbrToUse = 0;

                if (this._result.QuestionNbrSubmitted != QUESTION_NOT_SUBMITTED) {
                    questionNbrToUse = this._result.QuestionNbrSubmitted;
                }

                this.SetQuesCountdown(questionNbrToUse, true);
            }

            console.log('END app.RunClockCountdownOnce');
        }//app.RunQuesCountdownOnce
        app.GetListviewClockCountdownHtml = function () {
            console.log('START app.GetListviewClockCountdownHtml');
            this.GameRefresh();

            ccHtml = '';

            if (this._result.GameType == GameType.LMS) {

                if (this.IsClockCountdownEnable('qstart') || this.IsClockCountdownEnable('qdeadline')) {
                    countDownClockHtml = '<ul id="listviewCountdown" class="countdownStyle"></ul>';

                    ccHtml = countDownClockHtml;
                }

            }//if (this._result.GameType == GameType.LMS) {

            console.log('END app.GetListviewClockCountdownHtml');
            return ccHtml;
        }//app.GetListviewClockCountdownHtml = function () {
        app.GetListViewReportBtnHtml = function () {
            console.log('START app.GetListViewReportBtnHtml');
            this.GameRefresh();

            btnHtml = '';

            if (this._result.GameType == GameType.LMS) {

                if (this._result.GameState == GameState.SubmittedActive) {
                    btnHtml = '<a href="#" class="gameReportAction"' +
                                ' data-index="-1"></a>';
                }

            }//if (this._result.GameType == GameType.LMS) {

            console.log('END app.GetListViewReportBtnHtml');
            return btnHtml;
        }//GetListViewReportBtnHtml
        app.GetListViewReportIconHtml = function () {
            console.log('START app.GetListViewReportIconHtml');
            this.GameRefresh();

            iconHtml = 'star';

            if (this._result.GameType == GameType.LMS) {

                if (this._result.GameState == GameState.SubmittedActive) {
                    iconHtml = 'bar-chart-o';
                }

            }//if (this._result.GameType == GameType.LMS) {

            console.log('END app.GetListViewReportIconHtml');
            return iconHtml;
        }//GetListViewReportIconHtml
        app.SetClockCountdownEnable = function (id, enableInd) {
            console.log('START app.SetClockCountdownEnable');
            this.GameRefresh();

            if (this._result.GameType == GameType.LMS) {
                if (enableInd) {
                    $('#playerConsoleText').attr('countdown-enabled-' + id, 'true');
                } else {
                    $('#playerConsoleText').attr('countdown-enabled-' + id, 'false');
                }
            }// if (this._result.GameType == GameType.LMS) {

            console.log('END app.SetClockCountdownEnable');
        }//app.SetClockCountdownEnable
        app.StartupClockCountdown = function () {
            console.log('START app.StartupClockCountdown');
            this.GameRefresh();

            //Countdown only happens if the game is LMS and it is active or submittedactive
            if (this._result.GameType == GameType.LMS &&
                (this._result.GameState == GameState.Active || this._result.GameState == GameState.SubmittedActive)) {
                questionNbr = this.StartQuestionNbr();
                this.SetQuesCountdown(questionNbr,false);
            }
            console.log('END app.StartupClockCountdown');
        }//
        app.StopClockCountdown = function () {
            console.log('START app.StartupClockCountdown');
            this.GameRefresh();

            if (this._result.GameType == GameType.LMS &&
                this._result.PlayerActive == true) {
                //If either countdown clock is running then we shut them down
                this.SetClockCountdownEnable('qstart', false);
                this.SetClockCountdownEnable('qdeadline', false);
            }

            console.log('END app.StartupClockCountdown');
        }
        app.IsClockCountdownEnable = function (id) {
            console.log('START app.SetClockCountdownEnable');
            this.GameRefresh();
            clockCountdownEnable = false;

            if (this._result.GameType == GameType.LMS) {
                if ($('#playerConsoleText').attr('countdown-enabled-' + id) == undefined) {
                    clockCountdownEnable = false;
                } else if ($('#playerConsoleText').attr('countdown-enabled-' + id) == 'true') {
                    clockCountdownEnable = true;
                }
            } // if (this._result.GameType == GameType.LMS) {

            console.log('END app.SetClockCountdownEnable');
            return clockCountdownEnable;
        }//app.SetClockCountdownEnable
        app.SetQuesInfo = function (questionNbr) {
            console.log('START app.SetQuesInfo');
            this.GameRefresh();

            if (this._result.GameType == GameType.LMS) {
                $('#choiceListLegend').html('<span class="bodyText">Question #' + (questionNbr + 1) +
                    (($.parseJSON(app.GetConfigValue(ConfigType.Game, "ViewNbrOfQuestionsTotal"))) ? ' of ' + this.NbrQuestions() : '') +
                    '</span>');
            } else {
                $('#choiceListLegend').html('<span class="bodyText">Question #' + (questionNbr + 1) + ' of ' + this.NbrQuestions() + '</span>');
            }
            console.log('END app.SetQuesInfo');
        }//app.SetQuesInfo
        app.SetQuesChoiceSensitivity = function () {
            console.log('START app.SetQuesChoiceSensitivity');
            this.GameRefresh();

            //the answers will be disabled when the game state is read only and when game type is LMS and the current question is less than the question
            //already submitted
            if (gameState == GameState.ReadOnly ||
                (gameState == GameState.SubmittedActive && this._result.GameType == GameType.LMS && this._result.QuestionNbrSubmitted >= currentQuestionNbr)) {
                $("input[name ='choice']").checkboxradio().checkboxradio('disable').trigger("create");
                $('[for^="choice-"]').css("color", "black"); //needs a little help with the chosen background
            } else {
                $("input[name ='choice']").checkboxradio().checkboxradio('enable').trigger("create");
            }

            console.log('END app.SetQuesChoiceSensitivity');
        }//app.SetQuesChoiceSensitivity
        app.SetQuesNavigate = function (questionNbr) {
            console.log('START app.SetQuesNavigate');
            this.GameRefresh();

            $('#question article .backButton').css('visibility', 'visible')
            $('#question article .nextButton').css('visibility', 'visible')
            //When LMS game and first question then there doesn't have to be a back button
            if (this._result.GameType == GameType.LMS)
                if (this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED ||
                    (this._result.QuestionNbrSubmitted == 0 && !this._result.PlayerActive)) {
                    $('#question article .backButton').css('visibility', 'hidden')
                    $('#question article .nextButton').css('visibility', 'hidden')
                }

            console.log('END app.SetQuesNavigate');
        }
        app.NavigateAfterGAResponse = function () {
            console.log('START app.NavigateAfterGAResponse');
            this.GameRefresh();

            if (this._result.GameType == GameType.LMS) {
                this.StartGame(true);
                //$.mobile.loading('hide'); //hide the spinner
            } else {
                app.SetHomePageStyle(false);
                app.SetHomePageInitialDisplay();
                $(":mobile-pagecontainer").pagecontainer('change', '#home', { transition: 'none' });
                //$.mobile.loading('hide'); //hide the spinner
            }

            console.log('END app.NavigateAfterGAResponse');
        }
        app.PostGAResponse = function (playerDTO) {
            console.log('START app.PostGAResponse');
            this.GameRefresh();

            //function returns a NULL means there were no fatal errors. It can also return an error string.
            //For LMS it also returns:
            //result["PlayerActive"] (true or false)
            //result["GameQuestions"][currentQuestionNbr]["Correct"] (true or false)
            //result["NbrPlayers"]
            //result["NbrPlayersRemaining"]

            returnErrMsg = null;

            // The only case that a playerDTO error exist is an unanticipated exception. This shouldn't happen unless a catastrophe
            if (playerDTO.errorid == undefined) {

                //We check PlayerGameStatus undefined for backward compatibility
                if (playerDTO.PlayerGameStatus != undefined) {

                    switch (playerDTO.PlayerGameStatus.MessageId) {
                        case SERVER_NO_ERROR:
                            this._result["PlayerId"] = playerDTO.Id; //set player id from probe DB
                            this._result["QuestionNbrSubmitted"] = currentQuestionNbr;
                            this._result["NbrPlayers"] = playerDTO.PlayerGameStatus.NbrPlayers;
                            this._result["NbrPlayersRemaining"] = playerDTO.PlayerGameStatus.NbrPlayersRemaining;

                            //certain games will return if player's game answer(s) were correct
                            if (playerDTO.PlayerGameStatus.NbrAnswersCorrect > 0) {
                                this._result["PlayerActive"] = true;
                                this._result["GameQuestions"][currentQuestionNbr]["Correct"] = true;
                            } else {
                                this._result["PlayerActive"] = false;
                                this._result["GameQuestions"][currentQuestionNbr]["Correct"] = false;
                                this._result["GameQuestions"][currentQuestionNbr]["Reason"] = ANSWER_REASON_INCORRECT;
                            }

                            this._result["ServerResponse"] = SERVER_NO_ERROR;
                            break;
                        case SERVER_GAME_NOTACTIVE:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_PLAYER_DUP:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            playerName = app.GetPlayerName(this._result.FirstName, this._result.NickName, this._result.LastName, this._result.Email)
                            returnErrMsg = 'Your player name (' + playerName + ') is already in use. ' +
                            'Please go to the HOME page and then select the active game (this game).<br/>Modify your player name and resubmit the game answer(s) to the In Common Cloud';
                            break;
                        case SERVER_PLAYER_FNAME_INVALID:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_PLAYER_NNAME_INVALID:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_SUBM_MISSINGANSWERS:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_SUBM_INVALIDANSWERS:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            break;
                        case SERVER_PLAYERNAME_INVALID:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_PLAYER_LNAME_INVALID:
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_SUBM_NOT_ONTIME:
                            this._result["PlayerActive"] = false;
                            this._result["GameQuestions"][currentQuestionNbr]["Correct"] = false;
                            this._result["GameQuestions"][currentQuestionNbr]["Reason"] = ANSWER_REASON_DEADLINE;
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = 'The player submission was beyond the question deadline. Sorry, but you will have to sit out the rest of the game.';
                            break;
                        case SERVER_PLAYER_INACTIVE:
                            this._result["PlayerActive"] = false;
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        case SERVER_SUBM_TOO_EARLY:
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                        default:
                            //Not sure what this track would be. Probably a bad track.
                            this._result["PlayerActive"] = false
                            this._result["GameQuestions"][currentQuestionNbr]["Correct"] = false;
                            this._result["GameQuestions"][currentQuestionNbr]["Reason"] = ANSWER_REASON_UNKNOWN;
                            this._result["ServerResponse"] = playerDTO.PlayerGameStatus.MessageId;
                            returnErrMsg = playerDTO.PlayerGameStatus.Message;
                            break;
                    }//switch (playerDTO.PlayerGameStatus.MessageId) {

                    //If the game is LMS and the last question is answer. The player becomes inactive.
                    //This rule trumps everything
                    if (this._result.GameType == GameType.LMS) {
                        if (this._result["QuestionNbrSubmitted"] >= this._result.GameQuestions.length - 1) {
                            this._result.PlayerActive = false;
                        }
                    }


                }//if (playerDTO.PlayerGameStatus != undefined) {


            } else {
                //THERE WAS A PROBE BUSINESS ERROR
                this._result["ServerResponse"] = playerDTO.errorid;
                //returnErrMsg = playerDTO.errormessage;
                returnErrMsg = "There was an In Common server error. Please try submitting again. If the error persists, contact In Common support."; //We have to dumb it down for the player
            }//if (playerDTO.errorid == undefined)

            app.PutResultLocalStorage(this._result);

            //we return an error message only if there is one to return
            if (returnErrMsg != null) {
                return returnErrMsg;
            }

            console.log('END app.PostGAResponse');
        }//app.PostGAResponse
        app.IsGameSubmit = function () {
            //determine if the game should be submitted based on the server response from a GameAnswer(GA) submission
            console.log('START app.IsGameSubmit');
            this.GameRefresh();

            gameSubmitInd = false;

            if (this._result["ServerResponse"] == SERVER_NO_ERROR ||
                this._result["ServerResponse"] == SERVER_SUBM_NOT_ONTIME) {
                gameSubmitInd = true;
            }

            console.log('END app.IsGameSubmit');
            return gameSubmitInd;
        }//app.IsGameSubmit 
        app.AlertPlayerComplete = function (questionNbr, questionNbrToCheck) {
            console.log('START app.AlertPlayerComplete');
            this.GameRefresh();

            //The extra alerts are only for non LMS games where you are submitting more than one answer at a time
            if (this._result.GameType != GameType.LMS) {

                if (gameState != GameState.ReadOnly) {

                    //BEGIN - MNS - ADDED FOR v1.1 - improved usability 2/8/15
                    if (questionNbr == questionNbrToCheck && this.IsAllQuestionsAnswered()) {
                        app.confirmDialog('Submit', 'You have answered all the questions for the Game <span class="popupGameName">' + this._GameData.Name + '</span>.' + '<p>Do you want to submit?</p>',
                            function () {
                                $.mobile.loading('show'); //to show the spinner
                                setTimeout(function () { app.ConfirmSubmit(); }, 1000 * SUBMIT_BUFFERTIME_SECS); //give a 1 second delay. So the user see's the spinner when submitting

                            });
                    } else if (questionNbr == questionNbrToCheck && !this.IsAllQuestionsAnswered()) {
                        app.confirmDialog('Summary', 'You have NOT answered all the questions of the Game <span class="popupGameName">' + this._GameData.Name + '</span>.' + '<p>Do you want to see the Summary page to find which questions have NOT been answered?</p>',
                            function () {
                                app.SetSummaryPage();
                            });
                    } //END - MNS - ADDED FOR v1.1 - improved usability 2/8/15

                } //if (gameState != GameState.ReadOnly) {

            }//if (this._result.GameType != GameType.LMS) {

            console.log('END app.AlertPlayerComplete');
        }//app.AlertPlayerComplete
        app.IsAllQuestionsAnswered = function () {
            console.log('START app.IsAllQuestionsAnswered');
            this.GameRefresh();

            //returns true if all questions are answered, otherwise it returns false

            allAnswered = true;
            for (i = 0; i < this.NbrQuestions() ; i++) {
                if (this._result.GameQuestions[i]["SelChoiceId"] == NO_ANSWER) allAnswered = false;

                if (!allAnswered) break;
            }

            console.log('END app.IsAllQuestionsAnswered');
            return allAnswered;
        }//app.IsAllQuestionsAnswered
        app.StartQuestionNbr = function () {
            console.log('START app.StartQuestionNbr');
            this.GameRefresh();

            startQuestionNbr = 0;
            if (this._result.GameType == GameType.LMS) {

                //Grab all these local date/time and the question start for the next question
                dateQuestionStartLocal = this.GetQuesStartDate(this._result.QuestionNbrSubmitted + 1);
                dateCurrentLocal = new Date();

                if (this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED) {
                    //no question has been submitted yet
                    startQuestionNbr = 0;
                } else if (this._result.QuestionNbrSubmitted != QUESTION_NOT_SUBMITTED && this._result.PlayerActive && dateCurrentLocal < dateQuestionStartLocal) {
                    //at least one question has been submitted, the next question cannot be queued up yet because of the question start datetime
                    startQuestionNbr = this._result.QuestionNbrSubmitted;
                } else if (this._result.QuestionNbrSubmitted != QUESTION_NOT_SUBMITTED && this._result.PlayerActive && dateCurrentLocal >= dateQuestionStartLocal) {
                    //at least one question has been submitted, the next question is queued up because of the question start datetime
                    startQuestionNbr = this._result.QuestionNbrSubmitted + 1;
                } else {
                    startQuestionNbr = this._result.QuestionNbrSubmitted;
                }

                return Math.min(startQuestionNbr, this._result.GameQuestions.length - 1);
            } else {
                return startQuestionNbr;
            }

            console.log('END app.StartQuestionNbr');
        }//app.StartQuestionNbr
        app.NbrQuestions = function () {
            console.log('START app.NbrQuestions');
            this.GameRefresh();

            NbrQuestions = 0;

            if (this._result.GameType == GameType.LMS) {

                //Grab all these local date/time and the question start for the next question
                dateQuestionStartLocal = this.GetQuesStartDate(this._result.QuestionNbrSubmitted + 1);
                dateCurrentLocal = new Date();

                if (this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED) {
                    //no question has been submitted yet
                    NbrQuestions = 1;
                } else if (this._result.QuestionNbrSubmitted != QUESTION_NOT_SUBMITTED && this._result.PlayerActive && dateCurrentLocal < dateQuestionStartLocal) {
                    //at least one question has been submitted, the next question cannot be queued up yet because of the question start datetime
                    NbrQuestions = this._result.QuestionNbrSubmitted + 1;
                } else if (this._result.QuestionNbrSubmitted != QUESTION_NOT_SUBMITTED && this._result.PlayerActive && dateCurrentLocal >= dateQuestionStartLocal) {
                    //at least one question has been submitted, the next question is queued up because of the question start datetime
                    NbrQuestions = this._result.QuestionNbrSubmitted + 2;
                } else {
                    NbrQuestions = this._result.QuestionNbrSubmitted + 1;
                }

                return Math.min(NbrQuestions, this._result.GameQuestions.length);
                return NbrQuestions;
            } else {
                NbrQuestions = this._result.GameQuestions.length;
                return NbrQuestions;
            }//if (this._result.GameType == GameType.LMS) {

            console.log('END app.NbrQuestions');
        }//app.NbrQuestions = function () 
        app.BackButtonHandler = function () {
            console.log('START app.BackButtonHandler');
            this.GameRefresh();

            (currentQuestionNbr == FIRST_QUESTION_NBR) ? currentQuestionNbr = this.NbrQuestions() - 1 : currentQuestionNbr--;
            app.SetQuestionPage(currentQuestionNbr, 'none');

            console.log('END app.BackButtonHandler');
        }//app.BackButtonHandler
        app.NextButtonHandler = function () {
            console.log('START app.NextButtonHandler');
            this.GameRefresh();

            (currentQuestionNbr == this.NbrQuestions() - 1) ? currentQuestionNbr = 0 : currentQuestionNbr++;
            app.SetQuestionPage(currentQuestionNbr, 'none');

            this.AlertPlayerComplete(currentQuestionNbr, 0); //Determine if any user alerts are necessary for good usability

            console.log('END app.NextButtonHandler');
        }//app.NextButtonHandler
        app.SetBottomNavButtons = function (backButtonInd, summaryButtonInd, submitButtonInd, nextButtonInd) {
            console.log('START app.SetBottomNavButtons');
            this.GameRefresh();

            /*
            Set Bottom Nav Bar Buttons (set them to true will enable them).Note the arguments set to false
            will override all other conditions. i.e if submit is set to true, but not all questions have been
            answered then submit be disabled. If set to false, it will be disabled no matter what.
            */

            //BACK BUTTON
            //backButton logic will be a little different if its LMS game. No backbutton if 
            //no question has been submitted yet, or if one has been submitted but player is inactive
            if (this._result.GameType == GameType.LMS) {
                if (!backButtonInd ||
                    this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED ||
                    (this._result.QuestionNbrSubmitted == 0 && !this._result.PlayerActive)) {

                    if (!$('.backButton').hasClass('ui-disabled')) {
                        $('.backButton').addClass('ui-disabled');
                    }
                } else {
                    //if the backButtonInd is TRUE
                    if ($('.backButton').hasClass('ui-disabled')) {
                        $('.backButton').removeClass('ui-disabled');
                    }
                }//if (!backButtonInd)
            } else {
                if (backButtonInd) {

                    if ($('.backButton').hasClass('ui-disabled')) {
                        $('.backButton').removeClass('ui-disabled');
                    }

                } else {

                    if (!$('.backButton').hasClass('ui-disabled')) {
                        $('.backButton').addClass('ui-disabled');
                    }
                }//if (backButtonInd)
            }//if (this._result.GameType == GameType.LMS)

            //SUMMARY BUTTON
            if (summaryButtonInd) {

                if ($('.summaryButton').hasClass('ui-disabled')) {
                    $('.summaryButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.summaryButton').hasClass('ui-disabled')) {
                    $('.summaryButton').addClass('ui-disabled');
                }
            }//if (summaryButtonInd)

            //SUBMIT BUTTON
            if (submitButtonInd && this.IsAllQuestionsAnswered() && gameState != GameState.ReadOnly) {

                if ($('.submitButton').hasClass('ui-disabled')) {
                    $('.submitButton').removeClass('ui-disabled');
                }

            } else {

                if (!$('.submitButton').hasClass('ui-disabled')) {
                    $('.submitButton').addClass('ui-disabled');
                }
            }//if (submitButtonInd)

            //NEXT BUTTON
            if (this._result.GameType == GameType.LMS) {
                if (!nextButtonInd ||
                    this._result.QuestionNbrSubmitted == QUESTION_NOT_SUBMITTED ||
                    (this._result.QuestionNbrSubmitted == 0 && !this._result.PlayerActive)) {

                    if (!$('.nextButton').hasClass('ui-disabled')) {
                        $('.nextButton').addClass('ui-disabled');
                    }
                } else {
                    //if the nextButtonInd is TRUE
                    if ($('.nextButton').hasClass('ui-disabled')) {
                        $('.nextButton').removeClass('ui-disabled');
                    }
                }//if (!nextButtonInd)
            } else {
                if (nextButtonInd) {

                    if ($('.nextButton').hasClass('ui-disabled')) {
                        $('.nextButton').removeClass('ui-disabled');
                    }

                } else {

                    if (!$('.nextButton').hasClass('ui-disabled')) {
                        $('.nextButton').addClass('ui-disabled');
                    }
                }//if (backButtonInd)
            }

            console.log('END app.SetBottomNavButtons');
        }//app.SetBottomNavButtons
        app.StartGame = function (afterPostInd) {
            console.log('START app.StartGame');
            this.GameRefresh();

            //All selected games from submitted queue will start viewing from the first question.
            //Otherwise we will use the StartQuestionNbr method of the game class to calculate what
            //question number will be viewed first.
            if (!afterPostInd && gameState == GameState.ReadOnly) {
                questionNbr = 0;
            } else {
                questionNbr = this.StartQuestionNbr();
            }

            /*
            we are starting up the game. If the game state is originally idle; then we
            know its a new game and we are going active, otherwise we are going to start in read only state
            */
            if (gameState == GameState.Idle) {
                this.SetGameState(GameState.Active);
            } else if (gameState == GameState.ReadOnly) {
                this.SetGameState(GameState.ReadOnly);
            }
            currentQuestionNbr = questionNbr;
            app.SetQuestionPage(currentQuestionNbr, 'none')

            console.log('END app.StartGame');
        }//app.StartGame
        app.IsGameInProgress = function () {
            console.log('START app.IsGameInProgress');
            this.GameRefresh();

            IsGameInProgress = false;
            if (this._result != {}) {
                if (this._result.GameState == GameState.Active || this._result.GameState == GameState.SubmittedActive) {
                    IsGameInProgress = true;
                }
            }

            console.log('END app.IsGameInProgress');
            return IsGameInProgress;
        }//app.IsGameInProgress
        app.SetGameState = function (gameStateIn) {
            console.log('START app.SetGameState');
            this.GameRefresh();

            gameState = gameStateIn;
            this._result.GameState = gameState;
            app.PutResultLocalStorage(this._result);
            console.log('END app.SetGameState');
        }
        app.SetGamePostSubmit = function (gameStateIn) {
            console.log('START app.SetGamePostSubmit');
            this.GameRefresh();

            if (gameStateIn == GameState.ReadOnly) {
                //set summary page for read-only game state
                this.SetBottomNavButtons(false, false, false, false);

                //set the newgame and cancel game buttons (enable new game, disable cancel game)
                $("[data-icon='plus']").removeClass('ui-disabled');
                $("[data-icon='minus']").addClass('ui-disabled');

                app.PushQueueGames(GameState.Submitted);
            } else {
                app.PushQueueGames(GameState.SubmittedActive);
            }

            console.log('END app.SetGamePostSubmit');
        }//app.SetGameForSubmit 
        app.SetGameStatePostSubmit = function () {
            console.log('START app.SetGameStatePostSubmit');
            this.GameRefresh();

            if (this._result.GameType != GameType.LMS) {
                gameState = GameState.ReadOnly;
            } else if (this._result.GameType == GameType.LMS && this._result.PlayerActive) {
                gameState = GameState.SubmittedActive;
            } else {
                //LMS and player inactive (must have had an incorrect answer)
                gameState = GameState.ReadOnly;
            }
            this._result.GameState = gameState;
            app.PutResultLocalStorage(this._result);

            console.log('END app.SetGameStatePostSubmit');
        }//app.SetGamePostSubmit
        app.PlayerPromptInteractive = function () {
            console.log('START app.PlayerPromptInteractive');
            this.GameRefresh();

            /*
            Dynamically update the Player Prompt based on the GameState
            */
            $('#reportGame').hide();
            if (gameState != GameState.Idle) {
                new app.JQMWidget("firstName").JQMSetValue();
                new app.JQMWidget("nickName").JQMSetValue();
                new app.JQMWidget("lastName").JQMSetValue();
                new app.JQMWidget("email").JQMSetValue();
                new app.JQMWidget("sex").JQMSetValue();

                this.PlayerPromptActions();

                //$('#cancelGame').hide(); //if game is not idle; we don't want to give the user the cancel ability here (too easy)
            }//if (gameState != GameState.Idle)

            $('#homePageContent').trigger("create");
            $(window).trigger('resize'); //ensure the background image covers the entire window

            if (gameState == GameState.ReadOnly) {
                $('#startGame,#cancelGame,#reportGame').addClass('GameReadOnlyButtons');
            }

            //when it's an LMS game and in a state of SubmittedActive; we don't want it so easy to cancel
            if (this._result.GameType == GameType.LMS && gameState == GameState.SubmittedActive) {
                $('#cancelGame').hide();
            } else {
                $('#cancelGame').show();
            }

            console.log('END app.PlayerPromptInteractive');
        }//app.PlayerPromptInteractive
        app.PlayerPromptActions = function () {
            console.log('START app.PlayerPromptActions');
            this.GameRefresh();

            if (gameState == GameState.ReadOnly) {
                app.JQMWidgetsAllDisable();

                /*
                Display the Report Button - it will only be enabled if the Game.ClientReportAccess 
                field is TRUE.
                */
                if (this._result.ClientReportAccess) {
                    $('#reportGame').removeClass('ui-disabled')
                } else {
                    $('#reportGame').addClass('ui-disabled')

                }
                $('#reportGame').show();

                $('#startGame').text('View Game');
            } else {
                $('#startGame').text('Resume Game');
            }//if (gameState == GameState.ReadOnly)

            console.log('END app.PlayerPromptActions');
        }//app.PlayerPromptActions
        app.SetLocalNotifications = function (dateNowLocal,dateWarningLocal,dateDeadlineLocal) {
            console.log('START app.SetLocalNotifications');
            this.GameRefresh();
            var isCordovaApp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

            if (this._result.GameType == GameType.LMS) {

                //Will only do a local notification if (1)//cordova - NEED TO CHECK FOR ANDROID OR IOS (ONLY SUPPORTED)
                //(2) it makes sense to give a warning within the current date and the deadline date
                if (isCordovaApp &&
                    (isMobile.Android() != null || isMobile.iOS() != null) &&
                    (dateWarningLocal > dateNowLocal) &&
                    (dateWarningLocal < dateDeadlineLocal)) { 

                    dateStr = GetInCommmonLocaleDateString(dateDeadlineLocal) + ' ' + GetInCommmonLocaleTimeString(dateDeadlineLocal);

                    cordova.plugins.notification.local.schedule(
                     {
                         id: 1,
                         title: 'Your game question is approaching its deadline.',
                         text: dateStr,
                         at: dateWarningLocal,
                         sound: null,
                         data: null
                     });

                    //setup notification click handler - to go to the game and question nearing the deadline
                    cordova.plugins.notification.local.on("click", function (notification) {
                        console.log("notification clicked on: " + notification.id);
                        app.PopActiveGameFromQueueIntoCurrent();
                        app.StartGame(true);
                    });

                    console.log('scheduled local notification at ' + GetInCommmonLocaleDateString(dateWarningLocal) + ' ' + GetInCommmonLocaleTimeString(dateWarningLocal));

                }

            }

            console.log('END app.SetLocalNotifications');
        }
        app.ResetLocalNotifications = function () {
            console.log('START app.ResetLocalNotifications');
            this.GameRefresh();
            var isCordovaApp = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1;

            if (this._result.GameType == GameType.LMS) {

                if (isCordovaApp &&
                    (isMobile.Android() != null || isMobile.iOS() != null)) { //cordova - NEED TO CHECK FOR ANDROID OR IOS (ONLY SUPPORTED)

                    cordova.plugins.notification.local.cancelAll(function () {
                        console.log('cancel all local notifications');
                    }, this);

                }

            }
            console.log('END app.ResetLocalNotifications');
        }
        app.GameRefresh = function () {
            console.log('START app.GameRefresh');

            this._result = app.GetResultLocalStorage();
            this._GameData = app.GetGameLocalStorage();
            this._app = app;

            console.log('END app.GameRefresh');
        }
        app.Game = function () {
            console.log('START app.Game');
            this._result = app.GetResultLocalStorage();
            this._GameData = app.GetGameLocalStorage();
            this._app = app;
            this.PlayerPromptInteractive = app.PlayerPromptInteractive;
            this.PlayerPromptActions = app.PlayerPromptActions;
            this.StartGame = app.StartGame;
            this.SetGamePostSubmit = app.SetGamePostSubmit;
            this.SetGameStatePostSubmit = app.SetGameStatePostSubmit;
            this.SetGameState = app.SetGameState;
            this.IsGameInProgress = app.IsGameInProgress;
            this.GetQuesWarningDate = app.GetQuesWarningDate;
            this.GetQuesStartDate = app.GetQuesStartDate;
            this.GetQuesDeadlineDate = app.GetQuesDeadlineDate;
            this.SetQuesChoiceSensitivity = app.SetQuesChoiceSensitivity;
            this.SetQuesInfo = app.SetQuesInfo;
            this.SetQuesCorrectionStyle = app.SetQuesCorrectionStyle;
            this.IsNewQuestionDeadlineNotPassed = app.IsNewQuestionDeadlineNotPassed;
            this.StartupClockCountdown = app.StartupClockCountdown;
            this.StopClockCountdown = app.StopClockCountdown;
            this.SetQuesCountdown = app.SetQuesCountdown;
            this.RunQuesCountdownOnce = app.RunQuesCountdownOnce;
            this.GetListviewClockCountdownHtml = app.GetListviewClockCountdownHtml;
            this.GetListViewReportBtnHtml = app.GetListViewReportBtnHtml;
            this.GetListViewReportIconHtml = app.GetListViewReportIconHtml;
            this.SetClockCountdownEnable = app.SetClockCountdownEnable;
            this.IsClockCountdownEnable = app.IsClockCountdownEnable;
            this.SetQuesNavigate = app.SetQuesNavigate;
            this.BackButtonHandler = app.BackButtonHandler;
            this.NextButtonHandler = app.NextButtonHandler;
            this.SetBottomNavButtons = app.SetBottomNavButtons;
            this.NbrQuestions = app.NbrQuestions;
            this.IsAllQuestionsAnswered = app.IsAllQuestionsAnswered;
            this.AlertPlayerComplete = app.AlertPlayerComplete;
            this.StartQuestionNbr = app.StartQuestionNbr;
            this.PostGAResponse = app.PostGAResponse;
            this.IsGameSubmit = app.IsGameSubmit;
            this.NavigateAfterGAResponse = app.NavigateAfterGAResponse;
            this.ProcessMessage = app.ProcessMessage;
            this.ProcessMessageForGAResponse = app.ProcessMessageForGAResponse;
            this.SetLocalNotifications = app.SetLocalNotifications;
            this.ResetLocalNotifications = app.ResetLocalNotifications;
            this.GameRefresh = app.GameRefresh;
            console.log('END app.Game');
        }//app.Game


        /* ***************************************************
        END JavaScript Classes
        */

        /* ***************************************************
        Helper routines for local storage of IncCommon(global), Game, Results,
        GameListQueue, and GameListQueue data
        */
        app.PutInCommonConfigLocalStorage = function (configuration) {
            localStorage["InCommon"] = JSON.stringify(configuration);
        };

        app.GetInCommonConfigLocalStorage = function () {
            localResult = undefined;
            if (localStorage["InCommon"] != undefined) {
                localResult = JSON.parse(localStorage["InCommon"]);
            }

            return localResult;
        };

        app.PutGameLocalStorage = function (game) {
            localStorage["Game"] = JSON.stringify(game);
        };

        app.GetGameLocalStorage = function () {
            localResult = undefined;
            if (localStorage["Game"] != undefined) {
                localResult = JSON.parse(localStorage["Game"]);
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

        app.PutGameQueueLocalStorage = function (GameQueue) {
            localStorage["GameQueue"] = JSON.stringify(GameQueue);
        };

        app.GetGameQueueLocalStorage = function () {
            GameQueue = new Array();
            if (localStorage["GameQueue"] != undefined) {
                GameQueue = JSON.parse(localStorage["GameQueue"]);
            }
            return GameQueue;
        };

        app.PutGameListQueueLocalStorage = function (GameListQueue) {
            localStorage["GameListQueue"] = JSON.stringify(GameListQueue);
        };

        app.GetGameListQueueLocalStorage = function () {
            GameListQueue = new Array();
            if (localStorage["GameListQueue"] != undefined) {
                GameListQueue = JSON.parse(localStorage["GameListQueue"]);
            }
            return GameListQueue;
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

        app.ajaxHelper = function (uri, method, asyncInp, data) {
            console.log('START app.ajaxHelper uri:' + uri);
            return $.ajax({
                type: method,
                async: asyncInp,
                timeout: AJAX_TIMEOUT,
                url: uri,
                dataType: 'json',
                contentType: 'application/json',
                data: data ? JSON.stringify(data) : null
            })
        }//function ajaxHelper
         
        /* END Helper routines********************************** */

    //initialize the Prob app
    app.init();

})(probeApp); //app

    GameStatusResponseForPing = function (args) {
        console.log('START GameStatusResponseForPing');
        //There is no additional handling of GameStatusResponse for ping
        console.log('END GameStatusResponseForPing');
    };//GameStatusResponseForPing

    GameStatusResponseForGameResumeAction = function (args) {
        console.log('START GameStatusResponseForGameResumeAction');

        theApp = args.App;
        clientReportAccess = args.UserArg1;
        errorId = args.ErrorId;
        errorMessage = args.ErrorMessage;
        theApp.CompleteGameResumeAction(clientReportAccess, errorId, errorMessage);

        console.log('END GameStatusResponseForGameResumeAction');
    };//GameStatusResponseForGameResumeAction

    GameStatusResponseForGameReportAction = function (args) {
        console.log('START GameStatusResponseForGameReportAction');

        theApp = args.App;
        clientReportAccess = args.UserArg1;
        errorId = args.ErrorId;
        errorMessage = args.ErrorMessage;
        theApp.CompleteGameReportAction(clientReportAccess, errorId, errorMessage);

        console.log('END GameStatusResponseForGameReportAction');
    };//GameStatusResponseForGameReportAction

});



