/**
 * Get the current URL.
 */
function getCurrentWindow(callback) {
  // Query filter to be passed to chrome.tabs.query - see
  // https://developer.chrome.com/extensions/tabs#method-query
  var queryInfo = {
    currentWindow: true
  };

  // queries current window to grab all URLs and titles of tabs
  chrome.tabs.query(queryInfo, function(tabs) {
    var session = [];
    tabs.forEach(function(tab){
      console.assert(typeof tab.url == 'string', 'tab.url should be a string');
      var currTab = {};
      currTab['url'] = tab.url;
      currTab['title']= tab.title;
      session.push(currTab);
    });

    // returns session (an object w url and title of each tab)
    callback(session);
  });
}

function renderStatus(session) {
  var printMe = "<ul> Tabs";
  session.forEach(function(tab) {
    printMe += "<li><a href=\"" + tab.url + "\">" + tab['title'] + "</a></li>";
  });
  $('#session').html(printMe + "</ul>");
}

document.addEventListener('DOMContentLoaded', function() {
  getCurrentWindow(function(session) {
    renderStatus(session);
  }, function(errorMessage) {
      renderStatus('Cannot display image. ' + errorMessage);
  });
});
