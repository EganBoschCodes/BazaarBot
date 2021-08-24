var admin = require("firebase-admin");
var serviceAccount = require("../firebase-priv.json");

let db;

module.exports = {
    initFirebase: async () => {
        await admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://bazaar-bot-default-rtdb.firebaseio.com"
        });

        db = admin.firestore();
    },

    getCollection: async (name) => {
        return await db.collection(name);
    },

    get: async (collection, doc) => {
        let dataRef = await db.collection(collection).doc(doc).get();
        return dataRef.exists ? dataRef.data() : undefined;
    },

    set: (collection, doc, obj) => {
        db.collection(collection).doc(""+doc).set(obj);
    },

    getCollectionAsObj: async (collection) => {
        const colRef = await db.collection(collection);
        const snapshot = await colRef.get();
        let colObj = {};
        let counter = 0;

        snapshot.forEach((doc) => {
            let obj = doc.data();
            colObj[doc.id] = obj; 
            counter++;
        });

        while (counter < snapshot.size) { sleep(10); }

        return colObj;
    },

    deleteEntry: async (collection, doc) => {
        let collectionRef = db.collection(collection);
        await collectionRef.doc(""+doc).delete();
    },

    deleteCollection: async (collection) => {
        const colRef = await db.collection(collection);
        const snapshot = await colRef.get();

        snapshot.forEach(async (doc) => {
            colRef.doc(doc.id).delete();
        });
    }
}

let sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}