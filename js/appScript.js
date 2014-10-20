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

        
        root = GetRootUrl();

        var probeVersion = '0.61';
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
        var gamePlayQueueMax = 10;
        var codeFromURL = undefined;

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
                        codeFromURL = QryStr('code')
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



            }); //$(document).on


            //We needed to do this because mysteriously the page padding was dynamically changing to a value of 2.xxx
            //Don't know why.
            $(document).on("pagechange pagebeforechange popupafteropen popupafterclose resize", function (event) {
                console.log('event pagechange-pagebeforechange popupafteropen popupafterclose resize');
                app.AdjustPagePaddingTop();
            });

            //THESE ARE DEBUG STATEMENTS BELOW
            //$(document).on("pagecontainerchange", function (event) {
            //    console.log('pagecontainerchange');
            //    alert('pagecontainerchange');
            //});

            //$(document).on("touchend", function (event) {
            //    console.log('touchend no default,propagation');
            //    event.preventDefault();
            //    event.stopPropagation();
            //    //alert('touchend');
            //});

            //sets the padding when window is resized. Not going to happen on a phone.
            $(window).resize(function ()
            {
                app.AdjustPagePaddingTop();
            });

            /*
            pageinit on all pages - bind on pagebeforeshow event (all pages/w data-role page) - Set the Nav and Toolbars based on the page showing
            */
            $(document).on('pageinit', function () {
                console.log('event doc pageinit');

                $(document).on("pagebeforeshow", "[data-role='page']", function () {
                    //app.setNavAndToolBars($(this)); //MNS
                });

            });

        }; //app.bindings = function () {

        /*
        Set Homepage Initial Display - Listview of active game and previous games played
        */
        app.SetHomePageInitialDisplay = function () {
            console.log('func app.SetHomePageInitialDisplay');
            gamePlayListQueue = app.GetGamePlayListQueueLocalStorage();

            listViewHtml = '';

            if (app.IsGameInProgress() || gamePlayListQueue.length > 0) {
                app.SetHomePageStyle(false);

                listViewHtml += '<ul id="gameList" data-role="listview" data-split-icon="bar-chart-o" data-inset="true">';

                if (app.IsGameInProgress()) {
                    $("[data-icon='plus']").addClass('ui-disabled');
                    $("[data-icon='minus']").removeClass('ui-disabled');

                    gamePlayData = app.GetGamePlayLocalStorage();
                    result = app.GetResultLocalStorage();

                    listViewHtml += '<li data-role="list-divider">Active Game<span class="ui-li-count">1</span></li>' +
                                    '<li data-icon="star" data-gameplay="active"><a href="#"><span class="listviewGameName">' +
                                     gamePlayData.Name + '</span>' +
                                    '<p class="listviewPlayerName">' +
                                     result.FirstName + '-' + result.NickName +
                                     '</p>' + '</a></li>';
                } else {
                    listViewHtml += '<li data-role="list-divider">No Active Game<span class="ui-li-count">0</span></li>'
                }//if (app.IsGameInProgress()) {


                if (gamePlayListQueue.length > 0) {
                    listViewHtml += '<li data-role="list-divider">Submitted Games<span class="ui-li-count">' + gamePlayListQueue.length + '</span></li>';
                }
                gamePlayListQueue.forEach(function (value, index, ar) {
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

                });


                listViewHtml += '</ul>';

                $('#homePageContent').html(listViewHtml);
                $('#homePageContent').css('color', 'black');
                $('#gameList').listview().listview("refresh").trigger("create");
                $('#home').trigger('create');


            }// if (app.IsGameInProgress() || gamePlayListQueue > 0) {
            else {
                app.SetHomePageStyle(true); //the only time we set bckground image to full opacity -first time
                gameInstructions = "<h3 style='text-align: center'>Welcome to the Probe App!</h3>" +
                                   "<p>You will need a game code from the game organizer in order to play.</p>" +
                                   "<p>Click the Add icon on the top menu bar." +
                                    " After entering your code you may have to wait a few moments for Probe to retrieve your game.</p>" +
                                    "<p>Enter your first name and a nickname so you can be recognized. Answer each of the questions and click submit. Your game organizer will provide you with access to the game results.</p>";

                $('#homePageContent').html(gameInstructions);
                $('#homePageContent').css('color', '#3388cc');
                $('#home').trigger('create');

            }

            app.BindPageStaticEvents("#home");

        };//app.SetHomePageInitialDisplay

        /*
        Update the home page with a text box to enter game play code
        */
        app.SetGamePlayCodePrompt = function () {
            console.log('func app.SetGamePlayCodePrompt');

            //Will fill in code if app started with code query string parm
            promptforCodeHtml =
                '<div style="margin-top: 10px"><label for="code">Game Code</label>' +
                '<input name="code" id="gameCode" type="text" ' +
                'value="' +
                ((codeFromURL != undefined) ? codeFromURL : "") +
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
                        url = ProbeAPIurl + 'GameConfigurations/GetGameConfigurationByGame/' + gamePlayData.GameId;
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
                                        app.popUpHelper('Error', 'The Game \'' + gamePlayData.Name + '\' has already been submitted.', 'A device cannot submit the same game twice for this game type.');
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
                                    probeError = "The Probe web server could not be found. There may be connectivity issues."
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
                      probeError = "The Probe web server could not be found. There may be connectivity issues."
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
        app.GetGamePlayStatusServer = function (gamePlayId) {
            console.log('func app.GetGamePlayStatusServer');
            var clientReportAccess = false; //global within the GetGamePlayStatusServer function

            url = ProbeAPIurl + 'GamePlays/GetGamePlayById/' + gamePlayId;
            console.log('func app.GetGamePlayStatusServer AJAX url:' + url);
            app.ajaxHelper(url, 'GET', null)
              .done(function (gamePlayStatusData) {
                  console.log('return GetGamePlayStatus success');

                  // On success, 'data' contains a GamePlay(only one level) JSON object
                  if (gamePlayStatusData.errorid == undefined) {
                      //SUCCESS
                      clientReportAccess = gamePlayStatusData.ClientReportAccess;
                      result["ClientReportAccess"] = gamePlayStatusData.ClientReportAccess;;
                      result["PlayerCount"] = gamePlayStatusData.PlayerCount;
                      app.PutResultLocalStorage(result);
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
                      throw errorMessage;
                  }

              }) //done
              .fail(function (jqxhr, textStatus, error) {
                  console.log('return GetGamePlayStatus fail');
                  probeError = error;
                  if (probeError == "") {
                      probeError = "The Probe web server could not be found. There may be connectivity issues."
                  }
                  var err = textStatus + ", " + probeError;
                  throw err;
              }); //fail

            return clientReportAccess;
        };//app.GetGamePlayStatusServer

        /*
        Submit Player and GamePlay Answers for Player
        */
        app.PostGamePlayAnswersServer = function () {
            console.log('app.PostGamePlayAnswersServer');

            returnErrMsg = null;

            //create player object for POST
            player = {};
            player["GamePlayId"] = result["GamePlayId"];
            player["FirstName"] = result["FirstName"];
            player["NickName"] = result["NickName"];
            (result["LastName"] != {}) ? player["LastName"] : result["LastName"]; //curently last name will always be empty 8/1/14
            player["Sex"] = result["Sex"];

            //mns debug
            console.log('player["GamePlayId"]=' + player["GamePlayId"]);
            console.log('result["GamePlayId"]=' + result["GamePlayId"]);

            url = ProbeAPIurl + 'Players/PostPlayer';
            console.log('func app.PostGamePlayAnswersServer AJAX url:' + url);
            app.ajaxHelper(url, 'POST', player)
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
                                probeError = "The Probe web server could not be found. There may be connectivity issues."
                            }
                            return returnErrMsg = textStatus + ", " + probeError;
                        });//fail for POST GamePlayAnswers
                })//done for POST Player
                .fail(function (jqxhr, textStatus, error) {
                    console.log('return POSTPlayer fail');

                    probeError = error;
                    if (probeError == "") {
                        probeError = "The Probe web server could not be found. There may be connectivity issues."
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
                '<label for="gpName"><b>(' + gamePlayData.GameType + ' Game)</b>' +
                '</label>' +
                '<textarea name="gpName" id="gpName" disabled="disabled">' + gamePlayData.Name + ' (' +
                gameDescription + ')</textarea>' +
                '<label for="C">First Name</label>' +
                '<input name="firstName" id="firstName" type="text" value="" data-clear-btn="true">' +
                '<label for="nickName">Nick Name</label>' +
                '<input name="nickName" id="nickName" type="text" value="" data-clear-btn="true">' +
                '<fieldset data-role="controlgroup" data-type="horizontal">' +
                '<legend>Sex</legend>' +
                '<input name="sex" id="sex-male" type="radio" checked="checked" value="on">' +
                '<label for="sex-male">Male</label>' +
                '<input name="sex" id="sex-female" type="radio">' +
                '<label for="sex-female">Female</label>' +
                '</fieldset>' +
                '<table><tr>' +
                '<td><button id="startGamePlay" class="ui-btn" data-icon="action">Start Game</button></td>' +
                '<td><button id="cancelGamePlay" class="ui-btn" data-icon="action">Cancel</button></td>' +
                '<td><button id="reportGamePlay" class="ui-btn" data-icon="action">Reports</button></td>' +
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

                result = app.GetResultLocalStorage();
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
                app.CancelGame();
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

            question = gamePlayData.GameQuestions[questionNbr].Question;
            questionText = question.Text;

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

            $('#questionText h2').html(questionText + '?');
            $('#choiceListLegend').html('Question #' + (questionNbr + 1) + ' of ' + app.NbrQuestions());
            $('#choiceList').html(fieldset);

            if (gameState != GameState.ReadOnly)
            {
                $("input[name ='choice']").checkboxradio().checkboxradio('enable').trigger("create");

            } else {
                $("input[name ='choice']").checkboxradio().checkboxradio('disable').trigger("create");
            }

            $('#question').trigger('create');

            $("input[name ='choice']").on('change', function () {

                radioButtonSelectedID = $('input[name="choice"]:checked').attr('id'); //id of the radio box

                gamePlayData = app.GetGamePlayLocalStorage();
                //set choice number of answer
                result["GameQuestions"][currentQuestionNbr]["SelChoiceId"] = radioButtonSelectedID.substr(7, radioButtonSelectedID.length - 6);
                app.PutResultLocalStorage(result);
                app.SetBottomNavButtons(true, true);

            }); //$("input[name ='choice']").on('change', function () {

            app.SetBottomNavButtons(true, true); //set summary and submit button to enabled

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

            summaryText = 'Questions - ' + app.NbrQuestionsAnswered() + ' out of ' + app.NbrQuestions() + ' answered'


            listViewHtml = '<ul data-role="listview" data-inset="true">';

            gamePlayData.GameQuestions.forEach(function (value, index, ar) {

                listViewHtml += '<li' +
                ((result.GameQuestions[index]["SelChoiceId"] == NO_ANSWER) ? ' data-icon="alert" ' : ' data-icon="check" ') +
                ' data-qnum=' + index + '>' +
                '<a href="#">' +
                (index + 1) + '. ' +
                ((value.Question.Text.length <= 30) ? value.Question.Text : value.Question.Text.substr(0, 30))
                + '...</a></li>';

            });
            listViewHtml += '</ul>';

            $('#summaryText h2').html(summaryText);
            $('#questionList').html(listViewHtml);

            $('#summary').trigger('create');

            //don't need the refresh. In fact is creates a mysterious scroll bar
            //$('#questionList').listview().listview("refresh").trigger("create"); 

            //setup event handler for summary page listview to return to a specific question
            $('[data-qnum]').click(function (event) {
                currentQuestionNbr = parseInt(this.attributes["data-qnum"].value);
                app.SetQuestionPage(currentQuestionNbr, 'slide');
            });

            app.SetBottomNavButtons(false, true); //set summary to disabled and submit button to enabled

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
                        app.ResumeGame(GameState.Active);
                    }); //$('[data-gameplay="active"]').click

                    $('[data-gameplay="submitted"] .gameResumeAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        //copy gameplay out of queue into current gameplay (even though it's read-only)
                        setTimeout(function () {
                            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
                            gamePlayData = gamePlayQueue[index].GamePlay;
                            result = gamePlayQueue[index].Result;
                            app.PutGamePlayLocalStorage(gamePlayData);
                            app.PutResultLocalStorage(result);

                            try {
                                app.GetGamePlayStatusServer(result.GamePlayId);
                            } catch (err) {
                                $.mobile.loading('hide'); //to show the spinner
                                app.popUpHelper("Error", "GetGamePlayStatusServer: " + err);
                            }

                            //set the home page for read-only view
                            gameState = GameState.ReadOnly;
                            app.SetHomePageStyle(false); //set backgrounded faded
                            app.ResumeGame(GameState.ReadOnly); //resume game read-only
                            $.mobile.loading('hide'); //to show the spinner

                        }, 500);

                    }); //$('[data-gameplay="submitted" .gameResumeAction]').click

                    $('[data-gameplay="submitted"] .gameReportAction').click(function (event) {
                        $.mobile.loading('show'); //to show the spinner

                        index = this.attributes["data-index"].value;

                        setTimeout(function () {
                            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
                            gamePlayData = gamePlayQueue[index].GamePlay;
                            result = gamePlayQueue[index].Result;
                            app.PutGamePlayLocalStorage(gamePlayData);
                            app.PutResultLocalStorage(result);

                            try {
                                if (app.GetGamePlayStatusServer(result.GamePlayId)) {
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

                        }, 500);

                    }); //$('[data-gameplay="submitted" .gameReportAction]').click


                    break;
                case "#question":

                    //FYI. jquery would not work with #question as a pre-cursor to #backButton
                    //$('#qfooter #backButton').click(function (event) { MNS DEBUG
                    $('#backButton').click(function (event) {
                            (currentQuestionNbr == 0) ? currentQuestionNbr = result.GameQuestions.length - 1 : currentQuestionNbr--;
                        app.SetQuestionPage(currentQuestionNbr, 'slide');
                    });

                    $('.summaryButton').click(function (event) {
                        app.SetSummaryPage();
                    });

                    //$('#qfooter #nextButton').click(function (event) { //MNS DEBUG
                    $('#nextButton').click(function (event) {
                            (currentQuestionNbr == result.GameQuestions.length - 1) ? currentQuestionNbr = 0 : currentQuestionNbr++;
                        app.SetQuestionPage(currentQuestionNbr, 'slide');
                    });

                    break;
                case "#summary":

                    $('.submitButton').click(function (event) {

                        app.confirmDialog('You are about to submit the Game \'' + gamePlayData.Name + '\'.' + '<br/>Are you sure?',
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
                        $('#menu').panel("close"); //if menu open

                        if (app.IsGameInProgress()) {
                            gamePlayData = app.GetGamePlayLocalStorage();
                            app.popUpHelper('Error', 'There is a Game \'' + gamePlayData.Name + '\' that is in progress', 'You must cancel this game first to start a new game.');
                            return;
                        }

                        $("[data-icon='plus']").addClass('ui-disabled');
                        $("[data-icon='minus']").removeClass('ui-disabled');
                        app.SetHomePageStyle(false);
                        app.SetGamePlayCodePrompt();
                        gameState = GameState.Idle; //just added MNS 7/27
                        $(":mobile-pagecontainer").pagecontainer('change', '#home');
                        
                    });

                    //bind all "Cancel Game" (plus) icons events
                    $("[data-icon='minus']").click(function (event) {

                        if (!app.IsGameInProgress())
                        {
                            app.popUpHelper('Error', 'There is no Game in progress',null);
                            return
                        } else {
                            gamePlayData = app.GetGamePlayLocalStorage();

                            app.confirmDialog('Are you sure you want to cancel the Game \'' + gamePlayData.Name + '\' that is in progress?',
                                function () {
                                    app.CancelGame();
                            });

                        }

                    });

                    $("#menu [data-icon='info']").click(function (event) {
                        app.popUpHelper('Info', 'You are using the Probe application - version (' + probeVersion + ').', 'Powered by ProductivityEdge, Inc.');
                    });


                    break;
            }
        };//app.BindPageStaticEvents 

        app.gameResumeAction = function (index) {
            gamePlayQueue = app.GetGamePlayQueueLocalStorage();
            gamePlayData = gamePlayQueue[index].GamePlay;
            result = gamePlayQueue[index].Result;
            app.PutGamePlayLocalStorage(gamePlayData);
            app.PutResultLocalStorage(result);

            try {
                $.mobile.loading('show'); //to show the spinner
                result["ClientReportAccess"] = app.GetGamePlayStatusServer(result.GamePlayId);
                app.PutResultLocalStorage(result);
            } catch (err) {
                $.mobile.loading('hide'); //to show the spinner
                app.popUpHelper("Error", "GetGamePlayStatusServer: " + err);
            }

            //set the home page for read-only view
            gameState = GameState.ReadOnly;
            app.SetHomePageStyle(false); //set backgrounded faded
            app.ResumeGame(GameState.ReadOnly); //resume game read-only
            $.mobile.loading('hide'); //to show the spinner


        }//app.gameResumeAction

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
                app.popUpHelper('Info', 'The submission of the Game \'' + gamePlayData.Name + '\' was successful.', null);
            } else {
                app.popUpHelper('Error', 'The submission of the Game \'' + gamePlayData.Name + '\' was NOT successful.<br/>' + returnErrMsg, null);
            }
        }//app.ConfirmSubmit

        /*
        AdjustPagePaddingTop
        */
        app.AdjustPagePaddingTop = function () {
            console.log('func AdjustPagePaddingTop');

            switch ($.mobile.pageContainer.pagecontainer("getActivePage").attr('id')) {
                case "home":
                    console.log('change the padding to 44px for home');
                    $('#home').css("padding-top", "42px");
                    break;
                case "question":
                    $('#question').css("padding-top", "42px");
                    break;
                case "summary":
                    $('#summary').css("padding-top", "42px");
                    break;
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

            $('#home').css("padding-top", "42px");

            if (initialState) {
                //$('#home').css('background-image', 'url(./images/bckground/ProbeBackground.jpg)');
                $('#home').css('background-image', 'url(./images/bckground/ProbeBackground-Opacity20.jpg)');

            } else {
                $('#home').css('background-image', 'url(./images/bckground/ProbeBackground-Opacity3.jpg)');
            }

            app.SetBottomNavButtons(false, false); //From the home page. Always set the bottom nav bar bottoms to disabled.

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
            $("[data-icon='plus']").removeClass('ui-disabled');
            $("[data-icon='minus']").addClass('ui-disabled');
            gameState = GameState.Idle;
            app.SetHomePageInitialDisplay();
            $(":mobile-pagecontainer").pagecontainer('change', '#home', { transition: 'none' });

        };

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
        Display the report page
        */
        app.DisplayReportPage = function () {
            console.log('func app.DisplayReportPage');
            $.mobile.loading('show'); //MNS


            gamePlayData = app.GetGamePlayLocalStorage();
            result = app.GetResultLocalStorage();

            if (gamePlayData.GameType == "Match") {
                url = ProbeMatchReporturl +
                    +result.GamePlayId
                    + '/' + result.PlayerId + '/1'; //with mobile indicator attached
            } else {
                url = ProbeTestReporturl +
                    +result.GamePlayId
                    + '/' + result.PlayerId + '/1'; //with mobile indicator attached
            }

            window.location = url;
        };

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

            return result.GameQuestions.length;
        };

        /*
        Queue Games Submitted - Keep the last 5
        */
        app.QueueGamePlays = function () {
            console.log('func app.QueueGamePlays');

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
            gamePlayListQueue[0]["Name"] = gamePlayData.Name;
            gamePlayListQueue[0]["FirstName"] = result.FirstName;
            gamePlayListQueue[0]["NickName"] = result.NickName;

            gamePlayQueue[0].GamePlay = gamePlayData;
            gamePlayQueue[0].Result = result;
            app.PutGamePlayListQueueLocalStorage(gamePlayListQueue);
            app.PutGamePlayQueueLocalStorage(gamePlayQueue);

        };//app.QueueGamePlays

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

            app.AdjustPagePaddingTop();
        };

        /*
        Confirmation Dialog
        */
        app.confirmDialog = function (text, callback) {
            console.log('func app.confirmDialog');

            var popupDialogId = 'popupDialog';
            $('<div data-role="popup" id="' + popupDialogId + '" data-confirmed="no" data-transition="fade" data-overlay-theme="a" data-theme="a" data-dismissible="false" style="max-width:500px;"> \
                    <div data-role="header" data-theme="a">\
                        <h1>Question</h1>\
                    </div>\
                    <div role="main" class="ui-content" data-theme="a">\
                        <h3 class="ui-title">' + text + '</h3>\
                        <div style="text-align:right">\
                        <a href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a optionConfirm" data-rel="back" data-theme="a">Yes</a>\
                        <a "href="#" class="ui-btn ui-corner-all ui-shadow ui-btn-inline ui-btn-a optionCancel" data-rel="back" data-transition="flow" data-theme="a">No</a>\
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
        app.SetBottomNavButtons = function (summaryButtonInd, submitButtonInd) {
            console.log('func app.SetBottomNavButtons');

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
            app.SetBottomNavButtons(false, false);

            //set the newgame and cancel game buttons (enable new game, disable cancel game)
            $("[data-icon='plus']").removeClass('ui-disabled');
            $("[data-icon='minus']").addClass('ui-disabled');

            app.QueueGamePlays();

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



