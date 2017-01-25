// Initialize Firebase
var config = {
    var config = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    databaseURL: "YOUR_DATABASE_URL",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID"
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
    printMe +="<li><div class=\"collapsible-header\">" + key + "</div><div class=\"collapsible-body\"><div class=\"row\" id=\"links_" + key + "\">";
    var links = "";
    $.each(value, function(num, data){
      printMe += "<a href=\"" + data['url'] + "\">" + data['title'] + "</a><br>";
    });
    printMe += "</div><div class=\"row\">\
                <div class=\"col s6 center-align\"><a class=\"btn-floating btn waves-effect waves-light green open_session\" id=\"" + key + "\"><i class=\"material-icons\">open_in_browser</i></a></div>\
                <div class=\"col s6 center-align\"><a class=\"btn-floating btn waves-effect waves-light red delete_session\" id=\"" + key + "\"><i class=\"material-icons\">delete</i></a></div>\
                </div></li>";
  });
  $('#' + input).html(printMe + "</ul>");
}

/*
 * Get all saved sessions
 */
function retrieveSession() {
  var user = firebase.auth().currentUser;
  firebase.auth().onAuthStateChanged(function(user) {
    if (user) {

      var userID = user.uid;
      database.ref(userID).on('value', function(snapshot) {
        renderOldSessions(snapshot.val(), "oldSession");
      });
    } else {
      console.log("No user");
      // No user is signed in.
    }
  });
}

/*
 * sends email with session info to specified address
 */
function sendEmail(session, address) {

}


window.onload = function() {
  $('.collapsible').collapsible();
  initApp();
  retrieveSession();
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

  $('body').on('click', '.delete_session', function () {
    var sessionID = $(this).attr('id');
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var userID = user.uid;
        database.ref(userID + "/" + sessionID).remove();
      } else {
        console.log("No user");
        // No user is signed in.
      }
    });
  });

  $('body').on('click', '.open_session', function () {
    var sessionID = $(this).attr('id');
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        var userID = user.uid;
        database.ref(userID + "/" + sessionID).once('value').then(function(snapshot) {
          var session = snapshot.val();
          var urls = [];
          $.each(session, function(num, data) {
            urls.push(data['url']);
          });
          chrome.windows.create({
            url: urls,
            type: "normal",
            focused: true
          });
        });
      } else {
        console.log("No user");
        // No user is signed in.
      }
    });
  });

};
