(function () {

  function alertError (message, url, lineNumber) {
    alert("Error: "+message+" in "+url+" at line "+lineNumber);
  }

  function logError (message, url, lineNumber) {
    alert("Error: "+message+" in "+url+" at line "+lineNumber);
  }

  if (window.DEBUG) {
    window.onerror = alertError;  
  } else {
    window.onerror = logError;  
  }

})()
