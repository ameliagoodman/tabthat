// Initialize Firebase
var config = {
    apiKey: "AIzaSyDmlxp1Wq_8OYQtZNrT3Q_oOhExjbLHeI4",
    authDomain: "tabthat-20e66.firebaseapp.com",
    databaseURL: "https://tabthat-20e66.firebaseio.com",
    storageBucket: "tabthat-20e66.appspot.com",
    messagingSenderId: "244894766681"
};
firebase.initializeApp(config);
var database = firebase.database();

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
    var session = {};
    for(var i = 0; i < tabs.length; i++) {
      console.assert(typeof tabs[i].url == 'string', 'tab.url should be a string');
      var currTab = {};
      currTab['url'] = tabs[i].url;
      currTab['title']= tabs[i].title;
      session[i.toString()] = currTab;
    }
    // returns session [{'title': "Example Title", 'url':"www.google.com"}]
    callback(session);
  });
}

/*
 * Displays the session tabs in the Session Div
 */
function renderStatus(session, input) {
  var printMe = "<ul> ";
  for (var key in session) {
    printMe += "<li><a href=\"" + session[key]['url'] + "\">" + session[key]['title'] + "</a></li>";
  }
  $('#' + input).html(printMe + "</ul>");
}

/*
 * Writes session to firebase
 */
function writeSession(sessionName, session) {
  var sessionData = {};
  var user = firebase.auth().currentUser;
  if (user) {
    var userData = {};
    var userID = user.uid;
    sessionData[sessionName] = session;
    database.ref(userID).update(sessionData);
  } else {
    // No user is signed in.
  }
}

/*
 * Displays all old sessions
 */
function renderOldSessions(session, input) {
  var printMe = "";
  $.each(session, function(key, value) {
    printMe +="<li><div class=\"collapsible-header\">" + key + "</div><div class=\"collapsible-body\">";
    $.each(value, function(num, data){
      printMe += "<a href=\"" + data['url'] + "\">" + data['title'] + "</a><br>";
    });
    printMe += "</div></li>";
  });
  console.log(printMe);
  // for (var key in session) {
  //   console.log(session[key]);
  //   printMe += "<li>" + session[key] + "</li>";
  // }
  $('#' + input).html(printMe + "</ul>");
}

/*
 * Get all saved sessions
 */
function retrieveSession() {
  var user = firebase.auth().currentUser;
  if (user) {
    var userID = user.uid;
    database.ref(userID).once('value').then(function(snapshot) {
      renderOldSessions(snapshot.val(), "oldSession");
    });
  } else {
    // No user is signed in.
  }
}


window.onload = function() {
  $('.collapsible').collapsible();
  initApp();
  getCurrentWindow(function(session) {
    renderStatus(session, "session");
  });
  $('#save-session-button').click(function() {
    if ($('#title').val()) {
      getCurrentWindow(function(session) {
        writeSession($('#title').val(), session);
      });
      $('.warning').hide();
    } else {
      $('.warning').show();
    }
  });
  retrieveSession();
};
