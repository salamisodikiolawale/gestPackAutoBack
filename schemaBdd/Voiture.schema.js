
const mongoose = require('mongoose');


const voitureSchema = new mongoose.Schema({

    immatricule: {type : String, required: true, unique:true},
    numSerie: {type : String, required: true},
    typeDeTransport: {type : String, required: true},
    nombreDeConduteur: {type : String, required: true},
    zone:{type : String, required: true},
    couleur:{type : String, required: true},
    prix:{type : String, required: true},

}, {timestamps : true}); /*>This last line create automatilly : created_at, updated_at*/

const VoitureTable = mongoose.model('Voiture', voitureSchema);

module.exports = VoitureTable;