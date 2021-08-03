const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");// user defined module


const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended : true}));
app.use(express.static("public")); // to use static css styles

// connect to mongoose(MongoDB)
mongoose.connect("mongodb+srv://admin-akash:Akash2019@cluster0.asfuw.mongodb.net/todolistDB", {useUnifiedTopology: true, useNewUrlParser: true, useCreateIndex: true });

// create a Mongoose schema
const itemsSchema ={
  name : String
};

// Create the Mongoose Model based on Mongoose Schema
const Item = mongoose.model("item",itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1,item2,item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema);

app.get("/",function(req,res){

  Item.find({},function(err,foundItems){

    if(foundItems.length === 0){
      Item.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        } else {
          console.log("Successfully Saved default items to DB");
        }
        res.redirect("/");
      })
    } else {
      res.render("list",{ListTitle : "Today", newListItem : foundItems});
    }

  })

})

app.get("/:customListName",function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err,foundList){
    if(!err){
      if(!foundList){
        // Create a New List
        const list = new List({
          name : customListName,
          items : defaultItems
        });

        list.save();
        res.redirect("/"+ customListName);
      } else {
        // Show an existing List
        res.render("list", {ListTitle : foundList.name, newListItem : foundList.items});
      }
    }
  });

});

app.post("/",function(req,res){

  // take this value from the form
  const itemName = req.body.newItem;
  const listName = req.body.list;
  // create the new item
  const item = new Item({
    name : itemName
  });

  if(listName === "Today"){
    // save into the database
    item.save();

    // redirect to home route
    res.redirect("/");
  } else {
    List.findOne({name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    });
  }

  // if(req.body.list === "Work List"){
  //   workItems.push(item);
  //   res.redirect("/work");
  // }else{
  //   items.push(item);
  //   res.redirect("/");
  // }


});

app.post("/delete",function(req,res){
  const checkedItem_id = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today"){
    // if the list is main simply delete an element by id
    Item.findByIdAndRemove(checkedItem_id , function(err){
      if(err){
        console.log(err);
      } else {
        console.log("Successfully deleted the checked item");
        res.redirect("/");
      }
    });
  } else {
    // simply, first find the custom list and delete a particular element which is having that idea
    // $ sign is used in MongoDB
    // $pull is used to remove an element from an array in database
    List.findOneAndUpdate({name: listName},{$pull:{items: {_id: checkedItem_id}}},function(err,foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});

// app.get("/work",function(req,res){
//
//   res.render("list",{ListTitle : "Work List",newListItem : workItems});
//
// })
//
// app.get("/about",function(req,res){
//
//   res.render("about");
//
// })
app.listen(process.env.PORT || 3000, function(){
  console.log("Server has started Successfully! ");
})
