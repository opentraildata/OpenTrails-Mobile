fileUtils = function() {

function rmDir(fileSystem, dirName, callback) {
    fileSystem.root.getDirectory(dirName, {create: true},
        function(dir) { //success
           dir.removeRecursively(
                function() { callback(); }, 
                function(){ navigator.notification.alert("Error deleting!"); }
            );
        }, 
        function() { navigator.notification.alert("Error deleting directory"); } //fail
    );
}

function bulkDownload(urls, targetDir, progressModal, callback) {
  /*
   * Bulk download of urls to the targetDir (relative path from root) 
   */
  window.requestFileSystem(
    LocalFileSystem.PERSISTENT, 0, 
    function(fileSystem) { //success
        var rootDir = fileSystem.root.fullPath;
        if (rootDir[rootDir.length-1] != '/') { rootDir += '/'; }
        var dirPath = rootDir + targetDir;
        
        // show modal
        progressModal.modal('show');

        //add progress bar
        var progressBar = progressModal.find(".progress-bar");
        
        downloadFile(urls, 0, dirPath, progressModal, progressBar, callback);
    },
    function() { navigator.notification.alert("Failure!"); } //filesystem failure
  );    
}

function downloadFile(urls, index, dirPath, progressModal, progressBar, callback) {
    /*
     * Helper function for bulkDownload 
     */
    
    if (index >= urls.length) { //callback if done
        //clear and hide modal
        progressModal.modal('hide');
        progressBar.width("0%");
        
        callback(); 
        return; 
    } 
    
    //update modal progress
    progressBar.css('width', (index * 100.0 / urls.length) + '%');
    
    var url = urls[index];
    
    //NOTE: THIS IS SUPER HARD-CODED
    //all urls start with: http://api.tiles.mapbox.com/v3/ - length 31
    var tail = url.slice(31); //something like ex.map-1234saf/15/8580/12610.png
    
    var fn = dirPath + '/' + tail;
  
    var fileTransfer = new FileTransfer();
    fileTransfer.download(url, fn,
        function(theFile) { 
            downloadFile(urls, index+1, dirPath, progressModal, progressBar, callback);
        },
        function(error) { navigator.notification.alert("download error code: " + error.code); }
    );    
}

return {
    'rmDir': rmDir,
    'bulkDownload': bulkDownload
};

}();
