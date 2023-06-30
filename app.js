var express = require("express");
var mongoose = require("mongoose");
var app = express();
var bodyParser = require("body-parser");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/todoDB");
 
const itemSchema = new mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemSchema);

const Item1 = new Item({ name: "Erstelle eine Aufgabe" });

const d = [Item1];

app.get("/", function (req, res) {
  Item.find({})
    .then((f) => {
      if (f.length === 0) {
        return Item.insertMany(d);
      } else {
        res.render("list", { newListItem: f });
      }
    }) 
    // .then(() => {
    //   res.redirect("/");
    // })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/", function (req, res) {
  var i = req.body.addbtn;
  const item = new Item({
    name: i,
  });
  item.save();
  res.redirect("/");
});

app.post("/delete", function (req, res) {
  const itemId = req.body.checkbox;

  Item.findByIdAndRemove(itemId)
    .then(() => {
      console.log("Successfully deleted");
      res.redirect("/");
    })
    .catch((err) => {
      console.log(err);
    });
});

app.listen(3000, function () {
  console.log("listening to port 3000.");
});