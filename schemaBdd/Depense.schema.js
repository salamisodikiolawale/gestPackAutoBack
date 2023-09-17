
const mongoose = require('mongoose');


const depenseSchema = new mongoose.Schema({

    date: {type : String, required: true, unique:false},
    immatricule: {type : String, required: true, unique:false},
    montant: {type : String, required: true},
    motif: {type : String, required: true},

}, {timestamps : true}); /*>This last line create automatilly : created_at, updated_at*/

const DepenseTable = mongoose.model('Depense', depenseSchema);

module.exports = DepenseTable;