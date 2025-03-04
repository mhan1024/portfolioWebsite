// Modules
const fs = require("fs");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require('axios');
const { ObjectId } = require("bson");

// const FormData = require("form-data");
// const Mailgun = require("mailgun.js");

// Express
const portNumber = 5500;
const app = express();
app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// MONGODB SET UP
require("dotenv").config({ path: path.resolve(__dirname, '.env') }) 
const uri = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:${process.env.MONGO_DB_PASSWORD}@cluster0.7xvdx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const databaseAndCollection = {db: process.env.MONGO_DB_NAME, collection: process.env.MONGO_COLLECTION};

const { MongoClient, ServerApiVersion } = require('mongodb');
const { send } = require("process");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

async function connectDB() {
    try {
        await client.connect();
    } catch (err) {
        console.error("Failed to connect", err);
    }
}

connectDB();
process.stdin.setEncoding("utf-8");


// GLOBAL VAR
let dessertPicsCount = 3;
let currCards = [];
let cardCollection = [];
let cardsIdx = [0, 1, 2];

let projName = "";
let joke = "haha";

console.log(`Web server started and running at http://localhost:5500`);

app.get("/", async (request, response) => {
    await getProj(client, databaseAndCollection);

    response.render("index_welcome");
});

app.get("/about", async (request, response) => {
    // joke = await getJoke();
    response.render("about", { joke });
});

app.get("/get-joke", async (request, response) => {
    joke = await getJoke();
    response.json({ joke });
});

// PROJECTS PAGE
app.get("/projects", async (request, response) => {
    // Get all document ids and add to cardIds list
    await getProj(client, databaseAndCollection);
    // Build cards for current display 
    // Default indices: 0 - 2
    await buildCards(client, databaseAndCollection, cardsIdx[0], cardsIdx[2]);

    let card1 = currCards[0];
    let card2 = currCards[1];
    let card3 = currCards[2];

    response.render("projects", { card1, card2, card3, cardCollection, cardsIdx });
});

// Server receives data (project name) sent from helper.js to be used to get the following: topics, tools, longDesc, link
app.post("/projects-receive-name", (request, response) => {
    let { name } = request.body;
    projName = name;

    response.json({ message : "SUCCESS", projName });
});

// Server gets and sends data (topics, tools, longDesc, link) to helper.js
app.get("/project-flip-params", async (request, response) => {
    let { topics, tools, longDesc, link } = await getFlipParams(client, databaseAndCollection, projName);

    response.json({ topics, tools, longDesc, link });
});

// CONTACT PAGE
app.get("/contact", (request, response) => {
    let dialNum = request.query.dialNum || 0;
    let oven_window_display = (dialNum == 2) ? `<div id="resume_form_box" style="background-color:#FF8811;">
                                                    <h2>Resume Options</h2>
                                                    <button type="button" value="Preview" id="preview_button">
                                                        <a href="./Michelle_Han.pdf" target="_blank">Preview</a>
                                                    </button>
                                                    <br>

                                                    <button type="button" value="Download" id="download_button">
                                                        <a href="./Michelle_Han.pdf" download="Michelle_Han_Resume">Download</a>
                                                    </button>
                                                    <br>

                                                </div>` : `<hr class="streak">
                                                        <hr class="streak2">`;
    response.render("contact", { oven_window_display });
});



// SET UP PAGE (HIDE LATER)
app.get("/setup", (request, response) => {
    response.render("setup");
});

app.post("/setup", async (request, response) => {
    let { projectName, projectLang, tools, topics, briefDesc, longDesc, link } = request.body;

    await insertProj(client, databaseAndCollection, projectName, projectLang, briefDesc, longDesc, tools, link, topics);

    response.render("setup");
});

app.post("/setup-removeAll", async (request, response) => {
    await removeAll(client, databaseAndCollection);
    
    response.render("setup");
});

async function insertProj(client, databaseAndCollection, name, lang, briefDesc, longDesc, tools, link, topics) {
    try {
        let docCount = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).countDocuments();

        // Calculate the dessert image to use
        let count = docCount % dessertPicsCount;
        
        // Create new document and add to database
        let newProjEntry = {
            name : name,
            lang : lang, 
            briefDesc : briefDesc,
            longDesc : longDesc, 
            tools : tools,
            link : link,
            topics : topics,
            count : count
        };

        await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newProjEntry);

        // Update card collection list
        await getProj(client, databaseAndCollection);

    } catch (e) {
        console.error(e);
    }
}

async function getProj(client, databaseAndCollection) {
    try {
        // Get all documents from database
        let results = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .find();

        if (results != null) {
            // Add ObjectIds of each document to cardIds
            for await (const doc of results) {
                if (!cardCollection.some(card => card.id === doc._id.toString()) || cardCollection.length == 0) {
                    cardCollection.push({
                        id : doc._id.toString(), 
                        name : doc.name,
                        lang : doc.lang,
                        briefDesc : doc.briefDesc,
                        count : doc.count
                    });
                }
            }
        }

    } catch (e) {
        console.error(e);
    }
}

async function buildCards(client, databaseAndCollection, start, end) {
    try {
        currCards = [];
        let card = "";

        for (let i = start; i <= end; i += 1) {
            // Build display card with HTML
            card = `<div class="card-link">
                        <button type="button" class="img-button" id="img-button" onclick="flipCard('${cardCollection[i].name}', '${cardCollection[i].lang}')">
                            <img src="./images/dessert${cardCollection[i].count}.png" alt="dessert${cardCollection[i].count}">
                        </button>    
                        <div class="project-info">
                            <h2 class="project-title">${cardCollection[i].name}</h2>
                            <p class="project-lang">${cardCollection[i].lang}</p>
                            <p class="project-desc">${cardCollection[i].briefDesc}</p>
                        </div>
                    </div>`;

            currCards.push(card);
        }

    } catch (e) {
        console.error(e);
    }
}

async function removeAll(client, databaseAndCollection) {
    try {
        await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .deleteMany();

        cardCollection = [];

    } catch (e) {
        console.error(e);
    }
}

async function getFlipParams(client, databaseAndCollection, name) {
    try {
        let filter = { name : name };
        let result = await client.db(databaseAndCollection.db)
                            .collection(databaseAndCollection.collection)
                            .findOne(filter);
        
        let topics = result.topics;
        let tools = result.tools;
        let longDesc = result.longDesc;
        let link = result.link;

        return { topics, tools, longDesc, link };

    } catch (e) {
        console.error(e);
    }
}

async function getJoke() {
	try {
        const options = {
            method: 'GET',
            url: 'https://dad-jokes-by-api-ninjas.p.rapidapi.com/v1/dadjokes',
            headers: {
            'x-rapidapi-key': 'e62ab2663dmsha7922178cca0fc6p10145ejsn2c74afb274e0',
            'x-rapidapi-host': 'dad-jokes-by-api-ninjas.p.rapidapi.com'
            }
        };
		const response = await axios.request(options);
		// console.log(response.data[0].joke);

        return response.data[0].joke;
	} catch (error) {
		console.error(error);
	}
}


// Command line interpreter
app.listen(portNumber);
const prompt = "Stop to shutdown the server: ";
process.stdout.write(prompt);

process.stdin.on("readable", function () {
    const userInput = process.stdin.read();

    if (userInput === "stop") {
        console.log("Shutting down the server");
        process.exit(0);

    } else {
        process.stdout.write(`Invalid command: ${userInput}`);
    }

    process.stdout.write(prompt);
    process.stdin.resume();
});
