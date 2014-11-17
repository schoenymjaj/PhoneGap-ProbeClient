//We're going use just 5 gridlines (vertical). The first will be 0, the last will be the max
//
GetChartAxisTickets = function (minValue, maxValue, nbrOfTicks) {

    //if there is no difference between max and min value
    //we will return an array of one.
    if (minValue == maxValue) {
        tickArray = new Array(1);
        tickArray[0] = maxValue;
        return tickArray;
    }

    tickCount = 0;
    tickArray = new Array();
    tickArray[tickCount++] = 0;

    tickIncrement = maxValue / nbrOfTicks;

    tickValue = 0;
    while (tickValue < maxValue) {
        tickValue = tickValue + tickIncrement;
        if (Math.round(tickValue) > tickArray[tickCount - 1]) {
            tickArray[tickCount++] = Math.round(tickValue);
        }
    }

    return tickArray;
}//GetChartAxisTickets

CalcTestScore = function(data) {

    nbrCorrect = 0;
    for (var i = 0; i < data.length; i++) {
        if (data[i].QuestionCorrect == 1) nbrCorrect++;
    }
    return Math.round(nbrCorrect * 100 / data.length);
}//CalcTestScore
