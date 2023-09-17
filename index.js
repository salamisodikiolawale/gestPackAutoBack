//Importation des bibliothèques 
const  express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const VoitureTable = require('./schemaBdd/Voiture.schema');
const RecetteTable = require('./schemaBdd/Recette.schema');
const DepenseTable = require('./schemaBdd/Depense.schema');
const ConducteurTable = require('./schemaBdd/Conducteur.schema');
const UserTable = require('./schemaBdd/User.schema');

//Création de l'application avec la bibliothèque express
const app = express();
 
//Création du port de l'application
const port = 4002;
const corsOptions ={
    origin:`*`, 
    credentials:true,
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(express.json()); 


//Fonction pour se connecter à la bdd qui est sur le cloud
const connectToDb = async () => {
    
    mongoose.set('strictQuery', false);
    mongoose.connect(`mongodb+srv://sodiki:DdsgUG1AxERFIRPJ@cluster0.0fqnn.mongodb.net/gestPackAuto?retryWrites=true&w=majority`).then( () => {

        console.log('La connexion à la base de donnée est un succès');
    })
    .catch( (error) => {
        
        console.log('Erreur lors de la connexion à la BDD ...', error);
        process.exit(1); 
    });
}

//Appel de la fonction de connexion à la bdd
connectToDb();

//Route pour créer un nouvel utilisateur
app.post('/creerUnNouvUser', async(req, res) => {
    try {
        //1-Récuperation des données et création d'un objet utilisateur
        let nouvelUtilisateur = {
            email: req.body.email,
            password: req.body.password
        }

        //2-On crypte le mdp du user
        const mdp_crypte = await crypteMotDePasse(String(nouvelUtilisateur.password));
        nouvelUtilisateur.password = mdp_crypte;
        //2-Enregistrement de l'utilisateur dans la bdd
    
        nouvelUtilisateur = new UserTable(nouvelUtilisateur);
        nouvelUtilisateur = await nouvelUtilisateur.save();
        return res.status(200).json(nouvelUtilisateur);
    } catch (error) {
        return res.status(401).json('Données incorrectes');
    }
   
});

//Route pour s'authentifier
app.post('/authentification', async(req, res) => {
    try {
        //1-Récuperation des données d'authentification
        const mdp = req.body.password;
        const email = req.body.email;

        // Vérification des données entrantes
        if (mdp==null || email==null) {
            return res.status(400).json({ error: 'Email et mot de passe sont requis.' });
        }

        //2-Requete pour vérifier si l'email existe dans la bdd
        const user = await getUserByEmail(email);

        if (user==null) {
            return res.status(404).json({ error: 'Utilisateur non trouvé.' });
        }

        // On crypte le mdp du user et on vérifie
        if (verifMotDePasse(mdp, user.password)) {
            return res.status(200).json({'email': user.email});
        } else {
            return res.status(401).json({ error: 'Mot de passe incorrect.' });
        }

    } catch (error) {
        // Gérer les erreurs inattendues
        console.error("Erreur lors de l'authentification:", error);
        return res.status(500).json({ error: 'Erreur interne du serveur.' });
    }
});

//Fonction pour recuperer un utilisateur dans la base de données
const getUserByEmail = async(email) => {
    const user = await UserTable.findOne({ 'email': email}).exec();
    return user;
}

//Fonction pour crypter un mot de passe
const crypteMotDePasse = async(value) => {
    try {
        return bcrypt.hashSync(value, bcrypt.genSaltSync(8));
        
    } catch (error) {
        
        console.log('Erreur lors du cryptage du mot de passe');
    }
}

//Fonction pour vérifier la validité du mdp
const verifMotDePasse = (passwordBody, userPassword) => {
    
    try {
        
        return bcrypt.compareSync(passwordBody, userPassword);
    } catch (error) {
        console.log('Erreur de la comparaison des mots de passe');
    }
}



/**
 * GESTION DES VEHICULES
 */

//Route créer un nouveau véhicule
app.post('/creerUnNouveauVehicule', async(req, res) => {
    try{
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let nvVoiture = {
            'immatricule': req.body.immatricule,
            'numSerie': req.body.numSerie,
            'typeDeTransport': req.body.typeDeTransport,
            'nombreDeConduteur': req.body.nombreDeConduteur,
            'zone': req.body.zone,
            'couleur':req.body.couleur,
            'prix':req.body.prix,
        }

        //2-Vérification des données entrantes
        if (nvVoiture.immatricule==null || nvVoiture.numSerie==null || nvVoiture.typeDeTransport==null || nvVoiture.nombreDeConduteur==null || nvVoiture.couleur==null || nvVoiture.prix==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }

        try {
            
            //3-Enregistrement dans bdd
            nvVoiture = new VoitureTable(nvVoiture);
            nouvelUtilisateur = await nvVoiture.save();
            return res.status(200).json('Succès');
        } catch (error) {
            
            return res.status(401).json({error:'Données incorrectes. l immatricule doit être unique'});
        }


    }catch(error){
        return res.status(500).json({error:'erreur serveur'});
    }
});

app.get('/listeDesVehicules', async(req, res) => {
    const listeDesVehicules = await VoitureTable.find();
    const sommeDesPrixVoitures = await prixTotalVehiculeAcheter(listeDesVehicules);
    return res.status(200).json({listeDesVehicules:listeDesVehicules, total: sommeDesPrixVoitures});
});

//Fonction pour calculer somme total du prix d'achat des véhicules
const prixTotalVehiculeAcheter = async (listeVehicules) => {
    let total = 0;
    for(let i=0; i<listeVehicules.length; i++){
        total = total + Number(listeVehicules[i].prix);
    }
    return total;
}

//Route pour supprimer une voiture
app.delete('/supprimerUnVehicule/:immatricule', async (req, res) => {
    try {
        
        const immatricule = req.params.immatricule;
        if(immatricule){
            const vehiculeSupprimer = await VoitureTable.deleteOne({'immatricule':immatricule}).exec();
            return res.status(200).json({msg:'Le véhicule à bien été supprimé!'});
        }
        return res.status(401).json({msg: 'l\'immatriculation est inexistant'});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

app.put('/modifierUnVehicule/:immatricule', async(req, res) => {

    try {
        
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        const immatricule = req.params.immatricule;
        let nvVoiture = {
            '_id':req.body._id,
            'immatricule': req.body.immatricule,
            'numSerie': req.body.numSerie,
            'typeDeTransport': req.body.typeDeTransport,
            'nombreDeConduteur': req.body.nombreDeConduteur,
            'zone': req.body.zone,
            'couleur':req.body.couleur,
            'prix':req.body.prix,
        }

        //2-Vérification des données entrantes
        if (nvVoiture._id==null || nvVoiture.immatricule==null || nvVoiture.numSerie==null || nvVoiture.typeDeTransport==null || nvVoiture.nombreDeConduteur==null || nvVoiture.couleur==null || nvVoiture.prix==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }
        if(immatricule){
            const vehiculeAModifier= await VoitureTable.findById({'_id':nvVoiture._id}).exec();
            if(vehiculeAModifier != null){
                const v = await VoitureTable.findByIdAndUpdate(vehiculeAModifier._id, {
                    $set: {
                        immatricule: nvVoiture.immatricule,
                        numSerie: nvVoiture.numSerie,
                        typeDeTransport: nvVoiture.typeDeTransport,
                        nombreDeConduteur: nvVoiture.nombreDeConduteur,
                        zone: nvVoiture.zone,
                        couleur:nvVoiture.couleur,
                        prix:nvVoiture.prix
                    }
                }, {new: true}).exec();
                return res.status(200).json({msg:'Le véhicule à bien été supprimé!'});
            }
            return res.status(401).json({msg: 'l\'immatriculation est inexistant'});
        }
        return res.status(401).json({msg: 'l\'immatriculation est inexistant'});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});


///////////////////////////////////////////RECETTES///////////////////////////////////


app.post('/creerUneRecette', async(req, res) => {
    try{
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let recette = {
            'date': req.body.date,
            'immatricule': req.body.immatricule,
            'kilometrage': req.body.kilometrage,
            'ObservationArrivee': req.body.ObservationArrivee,
            'ObservationDepart': req.body.ObservationDepart,
            'montant': req.body.montant,
        }

        //2-Vérification des données entrantes
        if (recette.date==null || recette.kilometrage==null || recette.montant==null || recette.immatricule==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }

        try {
            
            //3-Enregistrement dans bdd
            recette = new RecetteTable(recette);
            recette = await recette.save();
            return res.status(200).json('Succès');
        } catch (error) {
            
            return res.status(401).json({error:'Données incorrectes.'});
        }


    }catch(error){
        return res.status(500).json({error:'erreur serveur'});
    }
});

app.get('/listeDesRecettes', async(req, res) => {
    try {
        const listeDesRecettes = await RecetteTable.find();
        const sommeTotalDesRecettes = await sommeTotaleDesRecettes(listeDesRecettes);
        return res.status(200).json({listeDesRecettes:listeDesRecettes, total: sommeTotalDesRecettes});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

//Fonction pour calculer somme total du prix d'achat des véhicules
const sommeTotaleDesRecettes = async (listeRecettes) => {
    let total = 0;
    for(let i=0; i<listeRecettes.length; i++){
        total = total + Number(listeRecettes[i].montant);
    }
    return total;
}

app.put('/modifierUneRecette', async(req, res) => {

    try {
        
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        const immatricule = req.params.immatricule;
        let recette = {
            '_id': req.body._id,
            'date': req.body.date,
            'immatricule': req.body.immatricule,
            'kilometrage': req.body.kilometrage,
            'ObservationArrivee': req.body.ObservationArrivee,
            'ObservationDepart': req.body.ObservationDepart,
            'montant': req.body.montant,
        }

        //2-Vérification des données entrantes
        if (recette.date==null || recette.kilometrage==null || recette.montant==null || recette.immatricule==null || recette._id==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }
            const recetteAModifier= await RecetteTable.findById({'_id':recette._id}).exec();
            if(recetteAModifier != null){
                const v = await RecetteTable.findByIdAndUpdate(recetteAModifier._id, {
                    $set: {
                        date: req.body.date,
                        immatricule: req.body.immatricule,
                        kilometrage: req.body.kilometrage,
                        ObservationArrivee: req.body.ObservationArrivee,
                        ObservationDepart: req.body.ObservationDepart,
                        montant: req.body.montant,
                    }
                }, {new: true}).exec();
                return res.status(200).json({msg:'La recette à bien été modifiée!'});
            }
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});


///////////////////////////////////////////DEPENSES///////////////////////////////////
app.post('/creerUneDepense', async(req, res) => {
    try{
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let depense = {
            'immatricule': req.body.immatricule,
            'date': req.body.date,
            'montant': req.body.montant,
            'motif': req.body.motif,
        }

        //2-Vérification des données entrantes
        if (depense.date==null || depense.montant==null || depense.motif==null || depense.immatricule==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }

        try {
            
            //3-Enregistrement dans bdd
            depense = new DepenseTable(depense);
            depense = await depense.save();
            return res.status(200).json('Succès');
        } catch (error) {
            
            return res.status(401).json({error:'Données incorrectes.'});
        }


    }catch(error){
        return res.status(500).json({error:'erreur serveur'});
    }
});

app.get('/listeDesDepenses', async(req, res) => {
    try {
        
        const listeDesDepenses = await DepenseTable.find();
        const sommeTotalDesDepenses = await sommeTotaleDesDepenses(listeDesDepenses);
        return res.status(200).json({listeDesDepenses:listeDesDepenses, total: sommeTotalDesDepenses});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

app.get('/montantEnCaisse', async(req, res) => {
    try {
        
        const listeDesDepenses = await DepenseTable.find();
        const sommeTotalDesDepenses = await sommeTotaleDesDepenses(listeDesDepenses);
        const listeDesRecettes = await RecetteTable.find();
        const sommeTotalDesRecettes = await sommeTotaleDesRecettes(listeDesRecettes);
        const montantEnCaisse = sommeTotalDesRecettes - sommeTotalDesDepenses;
        return res.status(200).json({montantEnCaisse:montantEnCaisse});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

//Fonction pour calculer somme total des depenses
const sommeTotaleDesDepenses = async (listeDepenses) => {
    let total = 0;
    for(let i=0; i<listeDepenses.length; i++){
        total = total + Number(listeDepenses[i].montant);
    }
    return total;
}

app.put('/modifierUneDepense', async(req, res) => {

    try {
        
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let depense = {
            'immatricule': req.body.immatricule,
            '_id': req.body._id,
            'date': req.body.date,
            'montant': req.body.montant,
            'motif': req.body.motif,
        }

        //2-Vérification des données entrantes
        if (depense.date==null || depense.montant==null || depense.motif==null || depense.immatricule==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }
            const depenseAModifier= await DepenseTable.findById({'_id':depense._id}).exec();
            if(depenseAModifier != null){
                const v = await DepenseTable.findByIdAndUpdate(depenseAModifier._id, {
                    $set: {
                        immatricule: req.body.immatricule,
                        date: req.body.date,
                        montant: req.body.montant,
                        motif: req.body.motif,
                    }
                }, {new: true}).exec();
                return res.status(200).json({msg:'La depense à bien été modifiée!'});
            }
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});


///////////////////CONDUCTEUR////////////////////
app.post('/creerUnConducteur', async(req, res) => {
    try{
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let nvConducteur = {
            'nom': req.body.nom,
            'prenoms': req.body.prenoms,
            'age': req.body.age,
            'experience': req.body.experience,
            'contact': req.body.contact,
            'adresse':req.body.adresse,
        }

        //2-Vérification des données entrantes
        if (nvConducteur.nom==null || nvConducteur.prenoms==null || nvConducteur.age==null || nvConducteur.experience==null || nvConducteur.contact==null || nvConducteur.adresse==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }

        try {
            
            //3-Enregistrement dans bdd
            nvConducteur = new ConducteurTable(nvConducteur);
            nvConducteur = await nvConducteur.save();
            return res.status(200).json('Succès');
        } catch (error) {
            
            return res.status(401).json({error:'Données incorrectes. l immatricule doit être unique'});
        }


    }catch(error){
        return res.status(500).json({error:'erreur serveur'});
    }
});

app.get('/listeDesConducteurs', async(req, res) => {
    try {
        
        const listeDesConducteurs = await ConducteurTable.find();
        const sommeTotalDesConducteurs = await sommeTotaleDesConducteurs(listeDesConducteurs);
        return res.status(200).json({listeDesConducteurs:listeDesConducteurs, total: sommeTotalDesConducteurs});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

const sommeTotaleDesConducteurs = async (listeConducteurs) => {
    let total = 0;
    for(let i=0; i<listeConducteurs.length; i++){
        total = total + Number(listeConducteurs[i].montant);
    }
    return total;
}

app.put('/modifierUnConducteur/:id', async(req, res) => {

    try {
        
        //1-Récuperation des données de la nouvelle voiture pour l'enreg dans bdd
        let nvConducteur = {
            'nom': req.body.nom,
            'prenoms': req.body.prenoms,
            'age': req.body.age,
            'contact': req.body.contact,
            'experience': req.body.experience,
            'adresse': req.body.adresse,
            '_id': req.body._id
        }

        //2-Vérification des données entrantes
        if (nvConducteur.nom==null || nvConducteur.prenoms==null || nvConducteur.age==null || nvConducteur.experience==null || nvConducteur.contact==null || nvConducteur.adresse==null) {
            return res.status(400).json({ error: 'Tout les champs sont obligatoire.' });
        }
        if(nvConducteur._id){
            const conducteurAModifier= await ConducteurTable.findById({'_id':nvConducteur._id}).exec();
            if(conducteurAModifier != null){
                const v = await ConducteurTable.findByIdAndUpdate(nvConducteur._id, {
                    $set: {
                        nom: nvConducteur.nom,
                        prenoms: nvConducteur.prenoms,
                        age: nvConducteur.age,
                        contact: nvConducteur.contact,
                        experience: nvConducteur.experience,
                        adresse:nvConducteur.adresse,
                    }
                }, {new: true}).exec();
                return res.status(200).json({msg:'Le conducteur à bien été supprimé!'});
            }
            return res.status(401).json({msg: 'l\'id est inexistant'});
        }
        return res.status(401).json({msg: 'l\'id est inexistant'});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

//Route pour supprimer un conducteur
app.delete('/supprimerUnConducteur/:id', async (req, res) => {
    try {
        
        const id = req.params.id;
        if(id){
            const conducteurSupprimer = await ConducteurTable.deleteOne({'_id':id}).exec();
            return res.status(200).json({msg:'Le conducteur à bien été supprimé!'});
        }
        return res.status(401).json({msg: 'l\'id est inexistant'});
    } catch (error) {
        return res.status(500).json({error: 'erreur serveur'});
    }
});

//Lancemment de l'application sur le port 4002
app.listen(port, () => {
    console.log('Express Server is running at localhost:4002');
})
module.exports = app;