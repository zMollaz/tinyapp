const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { findUserByEmail, findIdByEmail, findPasswordByEmail,
  urlsForUser, generateRandomString } = require("./helpers");

app.set("view engine", "ejs");

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["IOgG6x", "QbDRJf"],
}));

//Data
const urlDatabase = {};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};


//Routes
app.get("/", (req, res) => {
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    res.redirect("/urls");
  }
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {  //Renders all the urls in urlDatabase
  const user = Object.values(urlDatabase);
  const arrID = user.map(id => id.userID);
  const userOwnUrls = urlsForUser(req.session.user_id, urlDatabase);
  if (req.session.user_id) {
    for (let id of user) {
      arrID.push(id.userID)
    }

    if (arrID.includes(req.session.user_id)) {
      const templateVars = { urls: userOwnUrls, user: users[req.session.user_id], logged: true };
      res.render("urls_index", templateVars);
    }
    if (!arrID.includes(req.session.user_id)) {
      const templateVars = { urls: userOwnUrls, user: users[req.session.user_id], logged: false };
      res.render("urls_index", templateVars);
    }
  } else {
    const templateVars = { urls: userOwnUrls, user: users[req.session.user_id], error: "Register now or login to view your TinyUrls" };
    res.render("error", templateVars);
  }
});

app.get("/urls/new", (req, res) => {  //Renders a page to create a new shortUrl
  if (!req.session.user_id) {
    res.redirect("/login");
  } else {
    const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {  //Renders the tinyURL page for longURL from visiting the shortURL
  const keys = Object.keys(urlDatabase);
  const url = req.params.shortURL;
  const cookie = req.session.user_id;
  if (cookie) {
    if (keys.includes(url)) {
      if (urlDatabase[url].userID === cookie) {
        const templateVars = { user: users[cookie], shortURL: url, longURL: urlDatabase[url].longURL };
        res.render("urls_show", templateVars);
      } else {
        res.status(403);
        const templateVars = { user: users[req.session.user_id], error: "This url belongs to another user" };
        res.render("error", templateVars);
      }
    } else {
      res.status(404);
      const templateVars = { user: users[req.session.user_id], error: "This url does not exist" };
      res.render("error", templateVars);
    }
  } else {
    res.status(403);
    const templateVars = { user: users[req.session.user_id], error: "Register now or login to view this page" };
    res.render("error", templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {  //Redirects to longURL page directly
  const urlID = Object.keys(urlDatabase);
  if (urlID.includes(req.params.shortURL)) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404);
    const templateVars = { user: users[req.session.user_id], error: "This url does not exist" };
    res.render("error", templateVars);
  }
});

app.get("/register", (req, res) => {  //Renders the registration page
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("registration", templateVars);
  }
});

app.get("/login", (req, res) => {  //Renders the registration page
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render("login", templateVars);
  }
});

app.post("/urls", (req, res) => {   //Generates shortUrl for a given longUrl and saves it to urlDatabase object
  if (!req.session.user_id) {
    res.status(403);
    const templateVars = { user: users[req.session.user_id], error: "Register now or login to view this page" };
    res.render("error", templateVars);
  } else {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { userID: req.session.user_id, longURL: req.body.longURL };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { //Deletes url enteries and redirects
  const keys = Object.keys(urlDatabase);
  if (req.session.user_id) {
    if (keys.includes(req.params.shortURL)) {
      if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
        delete urlDatabase[req.params.shortURL];
        res.redirect("/urls");
      } else {
        res.status(403);
        const templateVars = { user: users[req.session.user_id], error: "You are not authorized to perform this action" };
        res.render("error", templateVars);
      }
    } else {
      res.status(404);
      const templateVars = { user: users[req.session.user_id], error: "This url does not exist" };
      res.render("error", templateVars);
    }
  } else {
    res.status(403);
    const templateVars = { user: users[req.session.user_id], error: "You have to login in order to perform this action" };
    res.render("error", templateVars);
  }
});

app.post("/urls/:shortURL", (req, res) => { //Edits shortURL to assign a new longURL
  const keys = Object.keys(urlDatabase);
  if (req.session.user_id) {
    if (keys.includes(req.params.shortURL)) {
      if (urlDatabase[req.params.shortURL].userID === req.session.user_id) {
        urlDatabase[req.params.shortURL].longURL = req.body.longURL;
        res.redirect("/urls");
      } else {
        res.status(403);
        const templateVars = { user: users[req.session.user_id], error: "This url belongs to another user" };
        res.render("error", templateVars);
      }
    } else {
      res.status(404);
      const templateVars = { user: users[req.session.user_id], error: "This url does not exist" };
      res.render("error", templateVars);
    }
  } else {
    res.status(403);
    const templateVars = { user: users[req.session.user_id], error: "You are not authorized to perform this action" };
    res.render("error", templateVars);
  }
});

app.post("/login", (req, res) => {  //Sets a new cookie with the username value
  const existingEmail = req.body.email;
  const existingPassword = req.body.password;
  if (!existingEmail || !existingPassword) {
    res.status(400);
    const templateVars = { user: users[req.session.user_id], error: "Email address and password fields can not be empty" };
    res.render("error", templateVars);
  }
  if (!findUserByEmail(existingEmail, users)) {
    res.status(403);
    const templateVars = { user: users[req.session.user_id], error: "This email address is not a registered user" };
    res.render("error", templateVars);
  }
  if (findUserByEmail(existingEmail, users)) {
    if (bcrypt.compareSync(existingPassword, findPasswordByEmail(existingEmail, users))) {
      req.session.user_id = findIdByEmail(existingEmail, users);
      res.redirect("/urls");
    } else {
      res.status(403);
      const templateVars = { user: users[req.session.user_id], error: "Password does not match our records; please try again" };
      res.render("error", templateVars);
    }
  }
});

app.post("/register", (req, res) => {  //Stores new user data and saves the user-id
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  if (!newEmail || !hashedPassword) {
    res.status(400);
    const templateVars = { user: users[req.session.user_id], error: "Email address and password fields can not be empty" };
    res.render("error", templateVars);
  }
  if (findUserByEmail(newEmail, users)) {
    res.status(400);
    const templateVars = { user: users[req.session.user_id], error: "A user with the same email address already exists" };
    res.render("error", templateVars);
  }
  if (!findUserByEmail(newEmail, users)) {
    const id = generateRandomString();
    users[id] = { id: id, email: newEmail, password: hashedPassword };
    req.session.user_id = id;
    res.redirect("/urls");
  }
});

app.post("/logout", (req, res) => {  //Clears the saved cookie
  req.session.user_id = null;
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});