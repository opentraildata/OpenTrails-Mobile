var FILESYSTEM;
var MAPBOX_ID = 'rclosner.h4b32mif';

function createMapOptions(clear) {
    return {
        'clear': clear,
        'fileSystem': FILESYSTEM,
        'mapIDs': [MAPBOX_ID]
    };
}

$(document).ready(function() {

    //Real page setup on phonegap initialization
    $(document).off("deviceready").on("deviceready", function() {
    
        window.requestFileSystem(
            LocalFileSystem.PERSISTENT, 0, 
            function(fs) { //success
                FILESYSTEM = fs; //set global - sloppy, I know
                mapUtils.reloadMap(createMapOptions(false));
            },
            function() { navigator.notification.alert("Failure accessing filesystem!"); } //filesystem failure
        );
        
        $("#clear").off("click").on("click", function() {
            fileUtils.rmDir(
                FILESYSTEM,
                'tiles',
                function(){ 
                    mapUtils.reloadMap(createMapOptions(true)); 
                    navigator.notification.alert("Tiles cleared successfully"); 
                }
            );
        });

        $("#download").off("click").on("click", function() {
            fileUtils.bulkDownload(
               tileUtils.pyramid([MAPBOX_ID], 38.255, -85.73, {}), //tile urls
               'tiles',
               $("#progress_modal"),
               function() { 
                   navigator.notification.alert("Download successful!"); 
                   mapUtils.reloadMap(createMapOptions(false)); 
               }
            );
        });
    }); 
});
