const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email : {type: String , unique: true},
    password :{type : String}
})

module.exports = module.model('Users',UserSchema)