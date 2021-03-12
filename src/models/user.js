const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const Task = require('./tasks')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error("Email is not value");
      }
    },
  },

  password: {
    type: String,
    required: true,
    trim: true,
    minLength: 7,
    validate(value) {
      if (value.includes("password"))
        throw new Error("Cannot include password!");
    },
  },
  age: {
    type: Number,
    default: 0,
    validate(value) {
      if (value < 0) throw new Error("Age cannot be negative");
    },
  },
  avatar: {
    type: Buffer,
  },

  tokens: [{
    token: {
      type: String,
      required: true,
    }
  }],

}, {
  timestamps: true
})


// adding virtual property for tasks of a user

userSchema.virtual('tasks', {
  ref: 'Tasks',
  localField: '_id',
  foreignField: 'owner'
})

// Method to generate auth token

userSchema.methods.generateAuthToken = async function () {

  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
  user.tokens = user.tokens.concat({ token })
  await user.save()

  return token



}


// Method to filter out sensitive data and generate a public profile of user

userSchema.methods.toJSON = function () {

  const user = this

  const userObject = user.toObject()

  delete userObject.password
  delete userObject.tokens
  delete userObject.avatar

  return userObject
}


// Math user credentials in database
userSchema.statics.findByCredentials = async (email, password) => {

  const user = await User.findOne({ email })

  if (!user) throw new Error('Unable to login')

  const isMatch = await bcrypt.compare(password, user.password)
  if (!isMatch) throw new Error("Unable to login")

  return user
}

// MiddleWare Hash Password before saving
userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

// Middleware to delete tasks if user profile is deleted

userSchema.pre('remove', async function (next) {
  const user = this
  await Task.deleteMany({ owner: user._id })
})
const User = mongoose.model("User", userSchema);

module.exports = User;
