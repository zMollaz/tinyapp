const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
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
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/urls", (req, res) => {  //Renders the all the urls in urlDatabase
  const user = Object.values(urlDatabase);
  const arrID = user.map(id => id.userID);
  const userOwnUrls = urlsForUser(req.session.user_id, urlDatabase);

  for (let id of user) {
    arrID.push(id.userID)
  } //pass a paramter to tempalte var in order to control who sees the urls

  if (arrID.includes(req.session.user_id)) {
    const templateVars = { urls: userOwnUrls, user: users[req.session.user_id], logged: true };
    res.render("urls_index", templateVars);
  }
  if (!arrID.includes(req.session.user_id)) {
    const templateVars = { urls: userOwnUrls, user: users[req.session.user_id], logged: false };
    res.render("urls_index", templateVars);
    //res.status(403).send("*Register now or login to view this page*");
  }
});

app.get("/urls/new", (req, res) => {  //Renders a page to create a new shortUrl
  if (!req.session.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { urls: urlDatabase, user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  }
});

//the function below might still need work templateVar ???
app.get("/urls/:shortURL", (req, res) => {  //Renders the tinyURL page for longURL from visiting the shortURL
  //const userOwnUrls = urlsForUser(req.session.user_id);
  const keys = Object.keys(urlDatabase);
  const url = req.params.shortURL;
  const cookie = req.session.user_id;
  if (cookie) {
    if (keys.includes(url)) {
      if (urlDatabase[url].userID === cookie) {
        const templateVars = { user: users[cookie], shortURL: url, longURL: urlDatabase[url].longURL };
        res.render("urls_show", templateVars);
      } else {
        res.status(403).send("* This url belongs to another user*");
      }
    } else {
      res.status(403).send("* This url does not exist*");
    }
  } else {
    res.status(403).send("* Register now or login to view this page*");
  }
});

app.get("/u/:shortURL", (req, res) => {  //Redirects to longURL page directly
  const urlID = Object.keys(urlDatabase);
  if (urlID.includes(req.params.shortURL)) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.status(404).send("*Page not found*");
  }
});

app.get("/register", (req, res) => {  //Renders the registration page
  const templateVars = { user: users[req.session.user_id] };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {  //Renders the registration page
  const templateVars = { user: users[req.session.user_id] };
  res.render("login", templateVars);
});

app.post("/urls", (req, res) => {   //Generates shortUrl for a given longUrl and saves it to urlDatabase object
  if (!req.session.user_id) {
    res.status(403).send("*Register now or login to view this page*");
    res.redirect("/urls");
  } else {
    console.log(req.body);  //Logs the shortURL:longURL pair in request body to the console
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
        res.status(403).send("* This url belongs to another user*");
      }
    } else {
      res.status(403).send("* This url does not exist*");
    }
  } else {
    res.status(403).send("*You are not authorized to perform this action*");
  }
});

app.post("/urls/:shortURL", (req, res) => { //Edits shortURL to assign a new longURL
  if (!req.session.user_id) {
    res.status(403).send("*You are not authorized to perform this action*");
    res.redirect("/urls");
  } else {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {  //Sets a new cookie with the username value
  const existingEmail = req.body.email;
  const existingPassword = req.body.password;
  if (!existingEmail || !existingPassword) {
    res.status(400).send("*Email address and password fields cannot be empty*");
  }
  if (!findUserByEmail(existingEmail, users)) {
    console.log(findUserByEmail(existingEmail, urlDatabase))
    res.status(403).send("*This email address is not a registered user*");
  }
  if (findUserByEmail(existingEmail, users)) {
    if (bcrypt.compareSync(existingPassword, findPasswordByEmail(existingEmail, users))) {
      req.session.user_id = findIdByEmail(existingEmail, users);
      res.redirect("/urls");
    } else {
      res.status(403).send("*Password does not match our records; please try again*");
    }
  }
});

app.post("/register", (req, res) => {  //Stores new user data and sets a cookie for user-id
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  const hashedPassword = bcrypt.hashSync(newPassword, 10)
  if (!newEmail || !hashedPassword) {
    res.status(400).send("*Email address and password fields cannot be empty*");
  }
  if (findUserByEmail(newEmail, users)) {
    res.status(400).send("*A user with the same email address already exists*");
  }
  if (!findUserByEmail(newEmail, users)) {
    console.log(findUserByEmail(newEmail, users))
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