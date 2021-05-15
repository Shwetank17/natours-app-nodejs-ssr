/* eslint-disable */

// This function gets called when user is successfully able to login using google's OAuth login via 'Sign In' buttion in front end. This login is happening in front end only.
function onSignIn(googleUser) {
  // After you have signed in a user with Google using the default scopes, you can access the user's Google ID, name, profile URL, and email address. Note: A Google account's email address can change, so don't use it to identify a user. Instead, use the account's ID, which you can get on the client with getBasicProfile().getId(), and on the backend from the sub claim of the ID token.
  var profile = googleUser.getBasicProfile();
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

  // only for some extra info, use below code. auth2 is initialized with gapi.auth2.init() and a user is signed in.
  // auth2 = gapi.auth2.init();
  // if (auth2.isSignedIn.get()) {
  //   var profile = auth2.currentUser.get().getBasicProfile();
  //   console.log('ID: ' + profile.getId());
  //   console.log('Full Name: ' + profile.getName());
  //   console.log('Given Name: ' + profile.getGivenName());
  //   console.log('Family Name: ' + profile.getFamilyName());
  //   console.log('Image URL: ' + profile.getImageUrl());
  //   console.log('Email: ' + profile.getEmail());
  // }

  // Code below for server side authentication
  // Use verifiable ID tokens to securely get the user IDs of signed-in users on the server side.
  var id_token = googleUser.getAuthResponse().id_token;
  var xhr = new XMLHttpRequest();
  // had to send 'localhost:3000' here because of the CORS errors Access to XMLHttpRequest at 'http://127.0.0.1:3000/api/v1/users/login' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*' when the request's credentials mode is 'include'. The credentials mode of requests initiated by the XMLHttpRequest is controlled by the withCredentials attribute.
  xhr.open('POST', 'http://localhost:3000/api/v1/users/login');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function() {
    console.log('Signed in as: ' + xhr.responseText);
  };
  xhr.send(JSON.stringify({ googleIdToken: id_token }));
}

// This function gets called when user is successfully able to Sign Out using google's OAuth Sign Out via 'Sign Out' button in front end. 'signOut' function calls GoogleAuth.signOut() method to the link's onclick event.
function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function() {
    console.log('User signed out.');
  });
}
