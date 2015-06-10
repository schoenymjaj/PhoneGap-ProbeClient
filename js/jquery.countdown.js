/*
JQuery Extension Countdown
Author:      Mike Schoenfeld 5/15/15
Description: Render a countdown clock to the date/time passed in
Revisions:
Args: id           - identification for the clock countdown (string identification)
      divAnchor    - id of the div anchor that is the parent of the UL for the countdown clock.
      date         - UTC date to which the countdown clock will countdown to
      dateBufferSecs - actually pushes the displayed countdown forward the configured seconds so the player doesn't get caught in the
                       time it takes to submit and wait for the server response. Gives the player a break.
      bufferTimeSecs - number of seconds additional buffer before the clock countdown is complete and the handler runs. This
                       is a buffer of time for the qdeadline countdown only. It will give the player a buffer in seconds before the
                       countdown deadline handler goes into action. Gives the player a little break.
      clockInd     - true or false. True renders the countdown clock. false will not render clock, 
                     but will still fire event when countdown is done
      color        - color of the clock
      warningSecs  - how many seconds left before the clock turns to the warningColor
      warningColor - color the clock turns at warning time
      dateViewSecs - number of seconds from 60th second that the deadline date will be displayed rather than the countdown clock.
      auxId1        - id of the aux1 UL clock that will render the countdown if visible
      auxId2        - id of the aux2 UL clock that will render the countdown if visible

Setup: The countdown clock html must be anchored by the following HTML
    <div id="countdownClock" data-enabled="true">

        $('#countdownClock').html('<ul id="qStart" class="countdownStyle">\
            <li><span class="days"></span></li>\
            <li id="separator" class="separator"></li>\
            <li><span class="hours"></span></li>\
            <li class="separator"></li>\
            <li><span class="minutes"></span></li>\
            <li class="separator"></li>\
            <li><span class="seconds"></span></li>\
            <li><span class="tailHtmlClock"></span></li>\
        </ul>')

    NOTE: When the data-enabled attr is set to false; this interrupts the countdown and stops the clock

Example call:
    var qStartDate = new Date(Date.UTC(DateO.getFullYear(), DateO.getMonth(), DateO.getDate()+1, DateO.getHours()+1, DateO.getMinutes()+1, DateO.getSeconds()));
    $('#qStart').countdown({
        date: qStartDate, //UTC date and time needed to pass
        dateBufferSecs: 5,
	    bufferTimeSecs: 1,
        clockInd: true,
        size: '30px',
        color: 'green',
        warningSecs: 60,
        warningColor: 'red',
        dateViewSecs: 5,
        auxId1: 'listviewCountdown',
        auxId2: 'popupCountdown'
    }, function () {
        alert('Question Start Now!!!!!!!!');
    });
*/
(function ($) {
	$.fn.countdown = function (options, callback) {
	    var settings = $.extend({
            id: null,
            divAnchor: null,
            date: null,
            dateBufferSecs: 0,
            bufferTimeSecs: 0,
		    clockInd: false,
		    color: '#a7abb1',
		    warningSecs: 60,
		    warningColor: 'red',
		    dateViewSecs: 10,
	        auxId1: null,
	        auxId2: null
		}, options);

		// Throw error if date is not set
		if (!settings.date) {
			$.error('Date is not defined.');
		}

		// Throw error if date is set incorectly
		if (!Date.parse(settings.date)) {
			$.error('Incorrect date format, it should look like this, 12/24/2012 12:00:00.');
		}

		// Save container
		var containerAnchor = this;

		//container.html('hello there!');

		/**
		 * Change client's local date to match offset timezone
		 * @return {Object} Fixed Date object.
		 */
		var currentDate = function () {
			// get client's current date in UTC
			var dateC = new Date();
			var new_date = new Date(Date.UTC(dateC.getFullYear(), dateC.getMonth(), dateC.getDate(), dateC.getHours(), dateC.getMinutes(), dateC.getSeconds()));
			return new_date;
		};

        //Set the clock enabled attribute on the div anchor. This attribute will be used to stop the countdown at any time.
		$('#' + settings.divAnchor).attr('countdown-enabled-' + settings.id, 'true');

        //Set up the text to be displayed at the tail end of the clock
		var tailHtmlClock, tailHtmlClockAbrev, tailHtmlDate, tailHtmlDateAbrev, clockTitleHtml, dateTitleHtml = '';
		setTextHtml(settings);

		renderClockFullPopup();

		function setTextHtml(settings) {

		    if (settings.id == 'qstart') {

		        tailHtmlClock = ' secs to next question';
		        tailHtmlClockAbrev = ' to next question';
		        tailHtmlDate = ' to next question';
		        tailHtmlDateAbrev = ' to next question';

		        clockTitleHtml = '<span>Countdown before the<br/>next question is served up</span>';
		        dateTitleHtml = '<span>Date that the<br/>next question is served up</span>';
		    } else {

		        tailHtmlClock = ' secs to answer deadline';
		        tailHtmlClockAbrev = ' to answer deadline';
		        tailHtmlDate = ' to answer deadline';
		        tailHtmlDateAbrev = ' to answer deadline';

		        clockTitleHtml = '<span>Deadline countdown for an<br/>answer to be submitted</span>';
		        dateTitleHtml = '<span>Deadline date for an<br/>answer to be submitted</span>';
		    }


		}//function setTailHtm(settings) {

		function styleClock(difference, settings, aContainer) {
		    //Style the text - black background on the clock data only. Get rid of the text shadows
		    //that are somehow inherited from something (probably the probe theme)

		    //Will set background color and then check for number of seconds left and change color of
		    //digital timer to the warning color
		    if (new Date(difference).getTime() / 1000 < settings.warningSecs) {
		        $('.countdownStyle').css('color', settings.warningColor);
		    } else {
		        $('.countdownStyle').css('color', settings.color);
		    }

		    aContainer.find('.days').css('background-color', 'black');
		    aContainer.find('.hours').css('background-color', 'black');
		    aContainer.find('.minutes').css('background-color', 'black');
		    aContainer.find('.seconds').css('background-color', 'black');
		    aContainer.css('text-shadow', '0 0px 0');
		}//function styleClock(difference, settings, aContainer) {

		function renderClock(days, minutes, hours, seconds, aContainer) {

		    innerCountDownClockHtml = '<li><span class="days"></span></li>\
                        <li id="clockSepD"></li>\
                        <li><span class="hours"></span></li>\
                        <li id="clockSepH"></li>\
                        <li><span class="minutes"></span></li>\
                        <li id="clockSepM"></li>\
                        <li><span class="seconds"></span></li>\
                        <li><span class="tailHtml"></span></li>';
		    aContainer.html(innerCountDownClockHtml);

		    var daysV, hoursV, minutesV, secondsV;

		    // fix dates so that it will show two digits
		    daysV = days; //don't need a zero in front of single digit for days
		    hoursV = (String(hours).length <= 1 && days != 0) ? '0' + hours : hours;
		    minutesV = (String(minutes).length <= 1 && hours != 0) ? '0' + minutes : minutes;
		    secondsV = (String(seconds).length <= 1 && minutes != 0) ? '0' + seconds : seconds;

		    // set to DOM
		    iSeparator = ':';
		    iDaySeparator = '.';
		    if (days == 0) {
		        aContainer.find('.days').parent().remove();
		        aContainer.find('#clockSepD').remove();
		    } else {
		        aContainer.find('.days').text(daysV + 'd');
		        aContainer.find('#clockSepD').text(iDaySeparator);
		    }

		    if (days == 0 && hours == 0) {
		        aContainer.find('.hours').parent().remove();
		        aContainer.find('#clockSepH').remove();
		    } else {
		        aContainer.find('.hours').text(hoursV + 'h');
		        aContainer.find('#clockSepH').text(iSeparator);
		    }

		    if (days == 0 && hours == 0 && minutes == 0) {
		        aContainer.find('.minutes').parent().remove();
		        aContainer.find('#clockSepM').remove();
		    } else {
		        aContainer.find('.minutes').text(minutesV + 'm');
		        aContainer.find('#clockSepM').text(iSeparator);
		    }

		    if (days >= 1 || hours >= 1 || minutes > 1) {
		        aContainer.find('.seconds').text(secondsV);
		    } else {
		        aContainer.find('.seconds').text(secondsV);
		    }
		    //Display text after clock for description
		    if (days != 0) {
		        aContainer.find('.tailHtml').html(tailHtmlClockAbrev);
		    } else {
		        aContainer.find('.tailHtml').html(tailHtmlClock);
		    }

		}//		function renderClock(days, minutes, hours, seconds) {

		function renderClockFullPopup() {
		    //Display deadline date
		    $('#popupClockCountdownTitle').html(clockTitleHtml);
		    $('#popupClockDateTitle').html(dateTitleHtml);

		    //Display deadline date
		    settingsDateLocal = new Date(settings.date.getFullYear(), settings.date.getMonth(), settings.date.getDate(), settings.date.getHours(), settings.date.getMinutes() + settings.date.getTimezoneOffset(), settings.date.getSeconds());
		    $('#popupClockDate').html('<span>' + GetInCommmonLocaleDateString(settingsDateLocal) + '</span><br/><span>' + settingsDateLocal.toLocaleTimeString() + '</span>');

		}//function renderClockFullPopup() {

		function renderClockFull(days, minutes, hours, seconds, aContainer) {

		    innerCountDownClockHtml =
                                    '<li>\
                                    <span class="days">00</span>\
                                    <p class="days_ref">days</p>\
                                    </li>\
                                    <li class="seperator">.</li>\
                                    <li> <span class="hours">00</span>\
                                    <p class="hours_ref">hours</p>\
                                    </li>\
                                    <li class="seperator">:</li>\
                                    <li> <span class="minutes">00</span>\
                                    <p class="minutes_ref">minutes</p>\
                                    </li>\
                                    <li class="seperator">:</li>\
                                    <li> <span class="seconds">00</span>\
                                    <p class="seconds_ref">seconds</p>\
                                    </li>';

		    aContainer.html(innerCountDownClockHtml);

		    var daysV, hoursV, minutesV, secondsV;

		    // fix dates so that it will show two digits
		    daysV = (String(days).length >= 2) ? days : '0' + days;
		    hoursV = (String(hours).length >= 2) ? hours : '0' + hours;
		    minutesV = (String(minutes).length >= 2) ? minutes : '0' + minutes;
		    secondsV = (String(seconds).length >= 2) ? seconds : '0' + seconds;


		    // set to DOM
		    iSeparator = ':';
		    iDaySeparator = '.';

		    aContainer.find('.days').text(daysV);
		    aContainer.find('#clockSepD').text(iDaySeparator);

		    aContainer.find('.hours').text(hoursV);
		    aContainer.find('#clockSepH').text(iSeparator);

		    aContainer.find('.minutes').text(minutesV);
		    aContainer.find('#clockSepM').text(iSeparator);

		    aContainer.find('.seconds').text(secondsV);

		}//		function renderClockFull(days, minutes, hours, seconds) {

		/**
		 * Main countdown function that calculates everything
		 */
		function countdown() {

            //We need to refresh the container, because it's possible that the calling program will refresh and change the jQuery container (anchor).
		    var container = $('#' + containerAnchor.attr('id'));

		    if (settings.auxId1 != null) {
		        var containerAuxillary1 = $('#' + settings.auxId1);
		    }
		    if (settings.auxId2 != null) {
		        var containerAuxillary2 = $('#' + settings.auxId2);
		    }

		    //if countdown is NOT enabled, we stop the timer
		    if ($('#' + settings.divAnchor).attr('countdown-enabled-' + settings.id) != 'true') {
		        console.log('(id = ' + settings.id + ') countdown aborted!!!!!');
		        clearInterval(interval);
		        return;
		    }

            //Use buffered date and time ONLY for deadline countdowns
		    bufferDate = settings.date;
		    bufferTimeInMilliseconds = 0;
		    if (settings.id == 'qdeadline') {
		        bufferDate = settings.date - 1000 * settings.dateBufferSecs;
		        bufferTimeInMilliseconds = 1000 * settings.bufferTimeSecs;
		    }

		    var target_date = new Date(bufferDate), // set target date - we used the buffered date for this.
				current_date = currentDate(); // get fixed current date

		    // difference of dates
			var difference = target_date - current_date;

		    // if difference is negative than it's pass the target date
		    //we want to subtract the buffered seconds so it actually doesn't
		    //start the handler for that additional second. Gives the player a little break.
			if (difference < (0 - bufferTimeInMilliseconds)) {
				// stop timer
				clearInterval(interval);
				$('#' + settings.divAnchor).attr('countdown-enabled-' + settings.id, 'false'); //set countdown clock to disabled.
				if (callback && typeof callback === 'function') callback();
				return;
			}

            //if the target date is less than current date than we don't need to update countdown clock anymore
			if (difference >= 0) {

			    // basic math variables
			    var _second = 1000,
                    _minute = _second * 60,
                    _hour = _minute * 60,
                    _day = _hour * 24;

			    // calculate dates
			    var days = Math.floor(difference / _day),
                    hours = Math.floor((difference % _day) / _hour),
                    minutes = Math.floor((difference % _hour) / _minute),
                    seconds = Math.floor((difference % _minute) / _second);

			    if (settings.clockInd) {

                    //We will show just the date deadline the first configured seconds and then we will show the countdown thereafter
			        if (seconds >= (60 - settings.dateViewSecs) && seconds <= 59) {
                        //Display the date here
			            innerCountDownClockHtml = '<li><span class="tailHtml"></span></li>';
			            container.html(innerCountDownClockHtml);
			            if (settings.auxId1 != null) {
			                containerAuxillary1.html(innerCountDownClockHtml);
			            }

			            if (days != 0) {
			                tailHtmlDateNow = tailHtmlDateAbrev;
			            } else {
			                tailHtmlDateNow = tailHtmlDate;
			            }

			            settingsDateLocal = new Date(settings.date.getFullYear(), settings.date.getMonth(), settings.date.getDate(), settings.date.getHours(), settings.date.getMinutes() + settings.date.getTimezoneOffset(), settings.date.getSeconds());
			            dateLocalStr = GetInCommmonLocaleDateString(settingsDateLocal) + ' ' + settingsDateLocal.toLocaleTimeString()
			            container.find('.tailHtml').html('<span style="background-color:black">' + dateLocalStr + '</span>' + tailHtmlDateNow);
			            if (settings.auxId1 != null) {
			                containerAuxillary1.find('.tailHtml').html('<span style="background-color:black">' + dateLocalStr + '</span>' + tailHtmlDateNow);
			            }

			            if (settings.auxId2 != null) renderClockFull(days, minutes, hours, seconds, containerAuxillary2); //full


			        } else {
                        //Display countdown clock here
			            renderClock(days, minutes, hours, seconds, container); //condensed
			            if (settings.auxId1 != null) renderClock(days, minutes, hours, seconds, containerAuxillary1); //condensed
			            if (settings.auxId2 != null) renderClockFull(days, minutes, hours, seconds, containerAuxillary2); //full

			        }//if (seconds >= 50 && seconds <= 59) {

			        styleClock(difference, settings, container); 
			        if (settings.auxId1 != null) styleClock(difference, settings, containerAuxillary1);
                    if (settings.auxId2 != null) styleClock(difference, settings, containerAuxillary2);

			        console.log('countdown:(id=' + settings.id + ')'); // sec:' + secondsV + ')');
			    }//if (settings.clockInd)

			}//if(difference < 0)

		};//function countdown ()
		
		// start
		var interval = setInterval(countdown, 1000);
	};

})(jQuery);