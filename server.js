import express from "express"
import bodyParser from "body-parser"
import cors from "cors"
import mongoose from "mongoose"

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
  createdAt: {
    type: Date,
    default: Date.now
  },
})

// Get messages
app.get("/", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 }).limit(20).exec()
  if (messages.length > 0) {
    res.json(messages)
  } else {
    res.status(404).json({ message: "No messages" })
  }
})

// Post new message
app.post("/", async (req, res) => {
  const { message } = req.body
  const newMessage = new Message({ message })
  try {
    const savedMessage = await newMessage.save()
    res.status(201).json(savedMessage)
  }
  catch (err) {
    res.status(400).json({ errorMessage: "Couldn't save message", error: err.errors })
    console.log(err)
  }

})

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`)
})
