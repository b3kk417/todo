var express = require("express");
var session = require("express-session");
var mongoose = require("mongoose");
var app = express();
var bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "SecretCookie",
    resave: false,
    saveUninitialized: false
  })
);

mongoose.connect("mongodb://localhost:27017/todoDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: String,
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Item = mongoose.model("Item", itemSchema);
const User = mongoose.model("User", userSchema);

app.get("/", function (req, res) {
  res.render("login");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

// Umleitung auf die persönliche ToDo-Liste
app.get("/list", function (req, res) {
  res.redirect("/personal-todo-list");
});

// Anzeigen der persönlichen ToDo-Liste für den eingeloggten Benutzer
app.get("/personal-todo-list", function (req, res) {
  if (req.session.user) {
    const userId = req.session.user._id;
    const username = req.session.user.username;

    Item.find({ userID: userId }) 
      .then((items) => {
        if (items.length === 0) {
          const newItem = new Item({
            name: "Erstelle deine erste Aufgabe!",
            userID: userId
          });
          return newItem.save();
        } else {
          return items;
        }
      })
      .then((items) => {
        res.render("list", { items: items, username: username });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/login");
  }
});

// HINZUFÜGEN VON NEUEN TASKS
app.post("/add", function (req, res) {
  if (req.session.user) {
    var i = req.body.addbtn;
    const newItem = new Item({
      name: i,
      userID: req.session.user._id
    });
    newItem
      .save()
      .then(() => {
        res.redirect("/personal-todo-list");
        console.log("Task wurde gespeichert");
        console.log(newItem.name, newItem.userID);
        console.log(i, req.session.user._id);
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/");
      });
  } else {
    res.redirect("/login");
  }
});

// LÖSCHEN VON TASKS
app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;

  Item.findByIdAndRemove(itemId)
    .then(() => {
      console.log("Eintrag erfolgreich gelöscht");
      res.redirect("/personal-todo-list");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/");
    });
});

// NUTZER REGISTRIEREN
app.post("/register", function (req, res) {
  const { username, password } = req.body;
  const newUser = new User({ username, password });
  newUser
    .save()
    .then(() => {
      console.log("Benutzer erfolgreich hinzugefügt.");
      res.redirect("/login");
    })
    .catch(() => {
      console.log("Fehler beim Hinzufügen des Benutzers.");
      res.redirect("/register");
    });
});

// NUTZER LOGIN
app.post("/login", function (req, res) {
  const { username, password } = req.body;
  User.findOne({ username, password })
    .then((user) => {
      if (user) {
        req.session.user = user;
        res.redirect("/personal-todo-list");
      } else {
        console.log("Anmeldung nicht möglich");
        res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log("Anmeldung nicht möglich");
      res.redirect("/login");
    });
});

// LISTENER PORT 3000
app.listen(3000, function () {
  console.log("Server läuft auf Port 3000.");
});