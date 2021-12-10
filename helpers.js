//Helper fucntions
const findUserByEmail = (someEmail, database) => {
  for (let user in database) {
    if (database[user].email === someEmail) {
      return user;
    }
  }
};

const findPasswordByEmail = (someEmail, database) => {
  for (let user in database) {
    if (database[user].email === someEmail) {
      return database[user].password;
    }
  }
};

const findIdByEmail = (someEmail, database) => {
  for (let user in database) {
    if (database[user].email === someEmail) {
      return database[user].id;
    }
  }
};

const urlsForUser = (id, database) => {
  const userURLS = {};
  const keys = Object.keys(database);
  for (let url of keys) {
    if (database[url].userID === id) {
      userURLS[url] = { userID: id, longURL: database[url].longURL };
    }
  }
  return userURLS;
};

const generateRandomString = () => {  //Generates a random 6 digit string
  let result = "";
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

module.exports = {
  findUserByEmail,
  findIdByEmail,
  findPasswordByEmail,
  urlsForUser,
  generateRandomString
};