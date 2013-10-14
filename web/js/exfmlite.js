/**
 * constant, which is used in emulating ended event
 * @type {number}
 */
var TOLLERANCE_PLAYING = 0.5;
var MAX_RETRY = 5;

String.prototype.format = function () {
    var s = this;
    for (var i = 0; i < arguments.length; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i]);
    }

    return s;
}

function log(message) {
    console.log(message);
}


var api = {};
api.constructGetSongsRequestUrl = function (username) {
    return "http://ex.fm/api/v3/user/" + username + "/loved";
}
var rowTemplate = "<tr class='song'><td class='song-artist'>{0}</td><td class='song-title'>{1}</td></tr>"

var songs = [];
var currentActiveAudioNumber = 0;

function getNextToBeActiveAudioNumber() {
    return (currentActiveAudioNumber + 1) % 2;
}

function getCurrentActiveAudio() {
    return $('#' + currentActiveAudioNumber)[0];
}

function getNextToBeActiveAudio() {
    return $('#' + getNextToBeActiveAudioNumber())[0];
}

var manualSwitchingPending = false;
/**
 * Switches active audio
 * @param index
 */
function switchActiveAudio(index) {
    function switchActiveAudio() {
        currentActiveAudioNumber = getNextToBeActiveAudioNumber();
    }

    var selected = $('.selected').removeClass('selected');
    $('.song:eq(' + index + ')').addClass('selected');

    var newSource = songs[index].url;
    var nextActiveAudio = getNextToBeActiveAudio();
    var currentActiveAudio = getCurrentActiveAudio();
    nextActiveAudio.src = newSource;
    nextActiveAudio.load();

    if (!currentActiveAudio.paused) {
        var count = 0;
        nextActiveAudio.volume = 0;
        nextActiveAudio.play();
        var volumeUpdateInterval = setInterval(function () {
            count++;
            currentActiveAudio.volume = 1 - count * 0.1;
            nextActiveAudio.volume = count * 0.1;
            if (count >= 10) {
                clearInterval(volumeUpdateInterval);
                currentActiveAudio.pause();

                currentActiveAudio.volume = 1;
                nextActiveAudio.volume = 1;
                switchActiveAudio();
            }
        }, 200);
    } else {
        nextActiveAudio.play();
        switchActiveAudio();
    }
    initialize();
}

/**
 * Creates songs list in #tbody element from global songs data
 */
function createSongsList() {
    var tbody = $('#tbody');
    for (var songNumber in songs) {
        var song = songs[songNumber];
        tbody.append(rowTemplate.format(song.artist, song.title));
    }
    $('.song').click(function () {

        var index = $('.song').index(this);
        switchActiveAudio(index);
    });
}

/**
 * Loads songs from ex.fm (all of them), which are loved be specified account
 */
function loadSongs() {
    songs = [];

    var username = $('#username').val();
    if (!username) {
        return;
        //todo
    }

    /**
     * Callback for get http method
     * @param data songs data from ex.fm
     * @param textStatus
     * @param jqXHR
     * @see getSongs
     */
    function onGetSongs(data, textStatus, jqXHR) {
        songs = songs.concat(data.songs);
        var newStart = data.songs.length + data.start;
        if (newStart < /*data.total*/30) {
            getSongs(newStart, onGetSongs)
        } else {
            createSongsList();
            //alert("END " + songs.length);
        }
    }


    function getSongs(start, success/*(data, textStatus, jqXHR)*/) {
        $.get(api.constructGetSongsRequestUrl(username),
            {start: start},
            success
        );
    }

    getSongs(0, onGetSongs);


    /* $.get(api.constructGetSongsRequestUrl(username),
     {start: 0},
     function (data, textStatus, jqXHR) {
     songs.concat(data.songs);
     var audioElement = $('#audio')[0];
     audioElement.src = data.songs[0].url;
     audioElement.play();
     }
     );*/

}

function initialize() {
    //emulating ended event (html5 version isn't working properly)
    var failedNumber = 0;      //TODO CHECK ENDED
    var currentNumber = $('.song').index($('.selected'));
    var next = songs.length > currentNumber + 1 ? currentNumber + 1 : 0;

    var endedInterval = setInterval(function () {
            var currentActiveAudio = getCurrentActiveAudio();
            var toSwitch = false;
            if (!currentActiveAudio.paused) {
                if (Math.abs(currentActiveAudio.currentTime - currentActiveAudio.duration) < TOLLERANCE_PLAYING) {
                    toSwitch = true;
                    log("Time to switch" + currentActiveAudio.currentTime + " index " + currentActiveAudioNumber);
                }
            }
            if (!currentActiveAudio.duration) {
                if (failedNumber = MAX_RETRY) {
                    toSwitch = true;
                    log("Invalid duration" + currentActiveAudio.duration + " index " + currentActiveAudioNumber);
                }
                failedNumber++;
            }

            if (toSwitch) {
                clearInterval(endedInterval);
                switchActiveAudio(next);
            }

        }, 300
    );
}