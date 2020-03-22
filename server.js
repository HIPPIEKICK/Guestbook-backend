import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import mongoose from "mongoose"
// import { jwt } from "jwt-simple"
import crypto from "crypto"

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/Guestbook"
mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
mongoose.Promise = Promise

const port = process.env.PORT || 8080
const app = express()

app.use(cors())
app.use(bodyParser.json())

// Model for messages
const Message = mongoose.model("Message", {
  message: {
    type: String,
    required: true,
    minlength: 5
  },
  name: {
    type: String,
    required: true
  },
  googleId: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
})

let jwt = require("jwt-simple")
const authenticateLogIn = async (req, res, next) => {
  let issuer = "accounts.google.com"
  let audience = "367774355192-9pick8lrfghtmdmb6v12d0odm6a3qk89.apps.googleusercontent.com"
  let loggedInUser

  if (req.header("Authorization") !== "null") {
    loggedInUser = await jwt.decode(req.header("Authorization"), issuer, audience)
  }
  if (loggedInUser) {
    // console.log("Logged in user:", loggedInUser)
    req.loggedInUser = loggedInUser
    next() //when to use next? (calling the next() function which allows the proteced endpoint to continue execution)
  } else {
    console.log("not logged in")
    res.status(403).json({ message: "You need to login to access this page" })
  }
}

// Get messages
app.get("/", authenticateLogIn)
app.get("/", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(20).exec()
  if (messages.length > 0) {
    res.json(messages)
  } else {
    res.status(404).json({ message: "No messages" })
  }
})

// Post new message
app.post("/", authenticateLogIn)
app.post("/", async (req, res) => {
  const googleId = req.loggedInUser.sub
  const { message, name } = req.body
  const newMessage = new Message({ message, name, googleId })
  try {
    const savedMessage = await newMessage.save()
    // console.log(savedMessage)
    res.status(201).json(savedMessage)
  }
  catch (err) {
    res.status(400).json({ errorMessage: "Couldn't save message", error: err.errors })
  }
})

// Delete message
app.delete("/messages/:id", authenticateLogIn)
app.delete("/messages/:id", async (req, res) => {
  const id = req.params.id
  const googleId = req.loggedInUser.sub
  // console.log("Delete-route, googleId: ", googleId)
  try {
    const deletedMessage = await Message.findOneAndDelete({ _id: id, googleId })
    if (deletedMessage !== null) {
      res.status(200).json({ message: `Successfully deleted message with id: ${deletedMessage._id}` })
    } else {
      res.status(400).json({ errorMessage: "Couldn't delete message" })
    }
  } catch (err) {
    res.status(400).json({ errorMessage: "Couldn't delete message", error: err.errors })
    console.log(err)
  }
})

// Edit message
app.put("/messages/:id", authenticateLogIn)
app.put("/messages/:id", async (req, res) => {
  const message = req.body.message
  const id = req.params.id
  const googleId = req.loggedInUser.sub
  // console.log("Edit-route, googleId: ", googleId)
  try {
    const editedMessage = await Message.findOneAndUpdate({ _id: id, googleId }, { message }, { new: true })
    if (editedMessage !== null) {
      res.status(200).json({ message: `Successfully edited message with id: ${editedMessage._id}` })
    } else {
      res.status(400).json({ errorMessage: "Couldn't edit message" })
    }
  } catch (err) {
    res.status(400).json({ errorMessage: "Couldn't edit message", error: err.errors })
    console.log(err)
  }
})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
