var express = require("express");
var session = require("express-session");
var mongoose = require("mongoose");
var app = express();
var bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const crypto = require("crypto");
const randomBytes = crypto.randomBytes(32);
const secretKey = randomBytes.toString("hex");

app.use(
  session({
    secret: secretKey, //crypto
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
  isActive: Boolean,
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
});

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  activeFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    unique: true,
  }
});
 
const fileSchema = new mongoose.Schema({
  name: String,
  isActive: Boolean,
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}) 

const Item = mongoose.model("Item", itemSchema);
const User = mongoose.model("User", userSchema);
const File = mongoose.model ("File", fileSchema);

// User.prototype.save = function() {
//   return this.save();
// };


app.get("/", function (req, res) {
  res.render("login");
});

app.get("/login", function (req, res) {
  res.render("login");
});

app.get("/register", function (req, res) {
  res.render("register");
});

app.get("/logout", function (req, res) {
  res.render("login");
})

// Umleitung auf CREATE LIST
app.get("/addList", function (req, res) {
  res.redirect("addList");
});




// Umleitung auf die persönliche ToDo-Liste
app.get("/list", function (req, res) {
  res.redirect("/personal-todo-list");
});

app.get("/dashboard", function(req, res) {
  if (req.session.user) {
    const userID = req.session.user._id;
    const username = req.session.user.username;

    File.find({userID:userID})
      .then((files) => {
        const count = files.length;
        res.render("dashboard", {
          files: files,
          username: username,
          count: count,
        });
      })
      .catch((err)=> {
        console.log(err);
        res.redirect("login");
      })
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
      res.redirect("/login");
    });
});

// Anzeigen der persönlichen ToDo-Liste für den eingeloggten Benutzer
app.get("/personal-todo-list", function (req, res) {
  if (req.session.user) {
    const userId = req.session.user._id;
    const username = req.session.user.username;

    Item.find({ userID: userId })
      .then((items) => {
        const activeItems = items.filter((item) => item.isActive === true);
        const inactiveItems = items.filter((item) => item.isActive === false);
        return {
          activeItems: activeItems,
          inactiveItems: inactiveItems,
        };
      })
      .then((filteredItems) => {
        res.render("list", {
          activeItems: filteredItems.activeItems,
          inactiveItems: filteredItems.inactiveItems,
          username: username,
        });
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/login");
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
      isActive: true,
      userID: req.session.user._id
    });
    newItem
      .save()
      .then(() => {
        res.redirect("/personal-todo-list");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/personal-todo-list");
      });
  } else {
    res.redirect("/login");
  }
});

// ADDFILE
app.post("/addFile", function (req, res) {
  if (req.session.user) {
    var j = req.body.filename;
    const newFile = new File({
      name: j,
      userID: req.session.user._id
    });
    newFile
      .save()
      .then(() => {
        console.log("add new file");
        console.log(j);
        res.redirect("/dashboard");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/dashboard");
      });
  } else {
    res.redirect("/login");
  }
});





function updateActiveFile(fileID) {
  User.updateOne({ activeFile: fileID }, { activeFile: fileID })
    .then(() => {
      console.log("Aktive Datei erfolgreich aktualisiert");
    })
    .catch((err) => {
      console.log(err);
    });
}

app.post("/fileOps", function(req, res){
  if (req.session.user) {
    var currOps = req.body.checkbox;
    var fileID = req.body.fileID;
    var user = new User(req.session.user);

    if (currOps === "select") {

      user.activeFile = fileID;
      user.save()
          .then(() => {
          updateActiveFile(fileID);


         res.redirect("/dashboard");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/dashboard");
        });
    } else if (currOps === "delete") {
      File.findByIdAndRemove(fileID)
      .then(() => {
        console.log(fileID + "erfolgreich gelöscht");
        res.redirect("/dashboard");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/login");
      });
    } else {
      console.log(fileID);
      console.log(currOps);
    res.redirect("/dashboard");
    }
  }});




// LÖSCHEN VON FILES
app.post("/deleteFile", function(req, res) {

  const fileID = req.body.delete;
  File.findByIdAndRemove(fileID)
  .then(() => {
    console.log("File erfolgreich gelöscht");
    res.redirect("/dashboard");
  })
  .catch((err) => {
    console.log(err);
    res.redirect("/login");
  });
})

// MOVE TASKS ZU ERLEDIGT
app.post("/move", function (req, res) {
  const itemId = req.body.checkbox;
  Item.findById(itemId)
    .then((item) => {
      if (item) {
        item.isActive = false;
        return item.save();
      } else {
        throw new Error("item nicht gefunden");
      }
    })
    .then(() => {
      console.log("Eintrag erfolgreich verschoben");
      res.redirect("/personal-todo-list");
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/login");
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

app.post("/logout", (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) {
        res.status(400).send('Unable to log out')
      } else {
        console.log("Logout successful");
        res.redirect(303, "/login");
      }
    });
  } else {
    res.redirect(303, "/login");
  }
});

// app.post("/dashboard", (req, res) => {
  
// })




// LISTENER PORT 3000
app.listen(3000, function () {
  console.log("Server läuft auf Port 3000.");
});