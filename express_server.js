const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

//Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//Data
const urlDatabase = {};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  }
};

//Helper fucntions
const findUserByEmail = (someEmail) => {
  for (let user in users) {
    if (users[user].email === someEmail) {
      return true;
    }
  }
};

const findPasswordByEmail = (someEmail) => {
  for (let user in users) {
    if (users[user].email === someEmail) {
      return users[user].password;
    }
  }
};

const findIdByEmail = (someEmail) => {
  for (let user in users) {
    if (users[user].email === someEmail) {
      return users[user].id;
    }
  }
};

const generateRandomString = () => {  //Generates a random 6 digit string
  let result = "";
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
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
  for (let id of user) {
    arrID.push(id.userID)
  } //pass a paramter to tempalte var in order to control who sees the urls
  if (arrID.includes(req.cookies.user_id)) {
    const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id], logged: true};
    console.log(urlDatabase)
    res.render("urls_index", templateVars);
  }
  if (!arrID.includes(req.cookies.user_id)) {
    const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id], logged: false};
    console.log(urlDatabase)
    res.render("urls_index", templateVars);
    //res.status(403).send("*Register now or login to view this page*");
  } 
  console.log(arrID)
  });

app.get("/urls/new", (req, res) => {  //Renders a page to create a new shortUrl
  if (!req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    const templateVars = { urls: urlDatabase, user: users[req.cookies.user_id] };
    res.render("urls_new", templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {  //Renders the tinyURL page for longURL from visiting the shortURL
  const user = Object.keys(urlDatabase); //array of shortURL
  for (let urlID of user) {
    console.log(urlID.userID)
    if (urlDatabase[urlID].userID === req.cookies.user_id) {
      console.log(urlID.userID)
      const templateVars = { user: users[req.cookies.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
      res.render("urls_show", templateVars);
    } else {
      console.log(urlID.userID)
       res.status(403).send("*This url Register now or login to view this page*");
     }

  } //pass a paramter to tempalte var in order to control who sees the urls
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
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("registration", templateVars);
});

app.get("/login", (req, res) => {  //Renders the registration page
  const templateVars = { user: users[req.cookies.user_id] };
  res.render("login", templateVars);
});

app.post("/urls", (req, res) => {   //Generates shortUrl for a given longUrl and saves it to urlDatabase object
  if (!req.cookies.user_id) {
    res.redirect("/urls");
  } else {
    console.log(req.body);  //Logs the shortURL:longURL pair in request body to the console
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { userID: req.cookies.user_id, longURL: req.body.longURL };
    res.redirect(`/urls/${shortURL}`);
  }
});

app.post("/urls/:shortURL/delete", (req, res) => { //Deletes url enteries and redirects
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => { //Edits shortURL to assign a new longURL
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {  //Sets a new cookie with the username value
  const existingEmail = req.body.email;
  const existingPassword = req.body.password;
  if (!existingEmail || !existingPassword) {
    res.status(400).send("*Email address and password fields cannot be empty*");
  }
  if (!findUserByEmail(existingEmail)) {
    res.status(403).send("*This email address is not a registered user*");
  }
  if (findUserByEmail(existingEmail)) {
    if (findPasswordByEmail(existingEmail) === existingPassword) {
      res.cookie("user_id", findIdByEmail(existingEmail));
      res.redirect("/urls");
    } else {
      res.status(403).send("*Password does not match our records; please try again*");
    }
  }
});

app.post("/logout", (req, res) => {  //Clears the saved cookie
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.post("/register", (req, res) => {  //Stores new user data and sets a cookie for user-id
  const newEmail = req.body.email;
  const newPassword = req.body.password;
  if (!newEmail || !newPassword) {
    res.status(400).send("*Email address and password fields cannot be empty*");
  }
  if (findUserByEmail(newEmail)) {
    res.status(400).send("*A user with the same email address already exists*");
  }
  if (!findUserByEmail(newEmail)) {
    const id = generateRandomString();
    users[id] = { id: id, email: newEmail, password: newPassword };
    res.cookie("user_id", id);
    res.redirect("/urls");
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});