
const mongoose = require('mongoose');


const voitureSchema = new mongoose.Schema({

    date: {type : String, required: true, unique:false},
    immatricule: {type : String, required: true, unique:false},
    kilometrage: {type : String, required: true},
    ObservationArrivee: {type : String, required: false},
    ObservationDepart: {type : String, required: false},
    montant:{type : String, required: true},

}, {timestamps : true}); /*>This last line create automatilly : created_at, updated_at*/

const RecetteTable = mongoose.model('Recette', voitureSchema);

module.exports = RecetteTable;