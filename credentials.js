// Initialize Firebase
var config = {
    apiKey: "AIzaSyDmlxp1Wq_8OYQtZNrT3Q_oOhExjbLHeI4",
    authDomain: "tabthat-20e66.firebaseapp.com",
    databaseURL: "https://tabthat-20e66.firebaseio.com",
    storageBucket: "tabthat-20e66.appspot.com",
    messagingSenderId: "244894766681"
};
firebase.initializeApp(config);

/**
 * initApp handles setting up the Firebase context and registering
 * callbacks for the auth status.
 *
 * The core initialization is in firebase.App - this is the glue class
 * which stores configuration. We provide an app name here to allow
 * distinguishing multiple app instances.
 *
 * This method also registers a listener with firebase.auth().onAuthStateChanged.
 * This listener is called when the user is signed in or out, and that
 * is where we update the UI.
 *
 * When signed in, we also authenticate to the Firebase Realtime Database.
 */
function initApp() {
  // Listen for auth state changes.
  // [START authstatelistener]
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      document.getElementById('quickstart-button').textContent = 'Sign out';
      $('.content').show();
    } else {
      document.getElementById('quickstart-button').textContent = 'Sign-in with Google';
      document.getElementById('quickstart-sign-in-status').textContent = 'Signed out';
      $('.content').hide();
    }
    document.getElementById('quickstart-button').disabled = false;
  });
  // [END authstatelistener]

  document.getElementById('quickstart-button').addEventListener('click', startSignIn, false);
}

/**
 * Start the auth flow and authorizes to Firebase.
 * @param{boolean} interactive True if the OAuth flow should request with an interactive mode.
 */
function startAuth(interactive) {
  // Request an OAuth token from the Chrome Identity API.
  chrome.identity.getAuthToken({interactive: !!interactive}, function(token) {
    if (chrome.runtime.lastError && !interactive) {
      console.log('It was not possible to get a token programmatically.');
    } else if(chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else if (token) {
      // Authrorize Firebase with the OAuth Access Token.
      var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
      firebase.auth().signInWithCredential(credential).catch(function(error) {
        // The OAuth token might have been invalidated. Lets' remove it from cache.
        if (error.code === 'auth/invalid-credential') {
          chrome.identity.removeCachedAuthToken({token: token}, function() {
            startAuth(interactive);
          });
        }
      });
    } else {
      console.error('The OAuth Token was null');
    }
  });
}

/**
 * Starts the sign-in process.
 */
function startSignIn() {
  document.getElementById('quickstart-button').disabled = true;
  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    startAuth(true);
  }
}

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
  var printMe = "<ul> ";
  session.forEach(function(tab) {
    printMe += "<li><a href=\"" + tab.url + "\">" + tab['title'] + "</a></li>";
  });
  $('#session').html(printMe + "</ul>");
}

window.onload = function() {
  initApp();
  getCurrentWindow(function(session) {
    renderStatus(session);
  })
};
