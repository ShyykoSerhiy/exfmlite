String.prototype.format = function () {
    var s = this;
    for (var i = 0; i < arguments.length; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i]);
    }

    return s;
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
 * @param newSource
 */
function switchActiveAudio(newSource) {
    function switchActiveAudio() {
        currentActiveAudioNumber = getNextToBeActiveAudioNumber();
    }

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
        var selected = $('.selected').removeClass('selected');

        var index = $('.song').index(this);
        $(this).addClass('selected');

        /*var audioElement = $('#')[0];
         audioElement.src = songs[index].url;
         audioElement.play();*/
        switchActiveAudio(songs[index].url);
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
        if (newStart < data.total) {
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