
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({

    email : {type : String, required: true, unique:true},
    password : {type : String, required: true, unique:true},

}, {timestamps : true}); /*>This last line create automatilly : created_at, updated_at*/

const UserTable = mongoose.model('User', userSchema);

module.exports = UserTable;