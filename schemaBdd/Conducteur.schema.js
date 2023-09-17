
const mongoose = require('mongoose');


const conducteurSchema = new mongoose.Schema({

    nom: {type : String, required: true, unique:false},
    prenoms: {type : String, required: true, unique:false},
    age: {type : String, required: true},
    experience: {type : String, required: true},
    contact: {type : String, required: true},
    adresse: {type : String, required: true},

}, {timestamps : true}); /*>This last line create automatilly : created_at, updated_at*/

const ConducteurTable = mongoose.model('Conducteur', conducteurSchema);

module.exports = ConducteurTable;