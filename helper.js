/* Set Up page: adding functionality so that the tools form element is dynamic, allowing tools to be added or removed */
function addTool() {
    let br = document.createElement("br");
    
    let newTool = document.createElement("input");
    newTool.setAttribute("list", "tool_options");
    newTool.id = "tools";
    newTool.name = "tools";
    newTool.placeholder = "Tool";

    document.getElementById("toolForm").appendChild(newTool);
    document.getElementById("toolForm").appendChild(br);
  
}

function removeTool() { 
    const toolsLst = document.getElementById("toolForm");

    if (toolsLst.hasChildNodes()) {
        toolsLst.removeChild(toolsLst.lastChild);
        toolsLst.removeChild(toolsLst.lastChild);
    }
}

/* Set Up page: adding functionality so that the topics form element is dynamic, allowing topics to be added or removed */
function addTopic() {
    let br = document.createElement("br");
    
    let newTopic = document.createElement("input");
    newTopic.type = "text";
    newTopic.id = "topics";
    newTopic.name = "topics";
    newTopic.placeholder = "Topic";

    document.getElementById("topicForm").appendChild(newTopic);
    document.getElementById("topicForm").appendChild(br);
  
}

function removeTopic() { 
    const topicsLst = document.getElementById("topicForm");

    if (topicsLst.hasChildNodes()) {
        topicsLst.removeChild(topicsLst.lastChild);
        topicsLst.removeChild(topicsLst.lastChild);
    }
}

/* ************************************************************************** */
/* Projects page: adding functionality to the carousel so the previous and next buttons will correspond to the correct actions */
let cardsIdxHelper = [];

// Previous button clicked -> display previous 3 cards
function prev(cardCollection, cardsIdx) {
    // alert(`PREV BUTTON CLICKED`);

    // Initially set cardsIdxHelper to  current indices of cards that are displayed 
    if (cardsIdxHelper.length == 0) {
        cardsIdxHelper = cardsIdx;
    }

    // Calculate the new indices of the prev set of 3 cards to be on display
    for (let i = 0; i < cardsIdxHelper.length; i++) {
        cardsIdxHelper[i] = (cardsIdxHelper[i] - 3 >= 0) ? (cardsIdxHelper[i] - 3) : ((cardCollection.length + (cardsIdxHelper[i] - 3)) % cardCollection.length);
    }

    // console.log(cardsIdxHelper);

    // Build and display the cards with the new indices
    let newCards = buildCardsHelper(cardCollection, cardsIdxHelper);
    let cards = document.querySelectorAll('.cards');

    newCards.forEach((cardHTML, idx) => {
        if (cards[idx]) {
            cards[idx].innerHTML = cardHTML;
        }
    });

}

// Next button clicked -> display next 3 cards
function next(cardCollection, cardsIdx) {
    // alert(`NEXT BUTTON CLICKED`);

    // Initially set cardsIdxHelper to  current indices of cards that are displayed 
    if (cardsIdxHelper.length == 0) {
        cardsIdxHelper = cardsIdx;
    }

    // Calculate the new indices of the next set of 3 cards to be on display
    for (let i = 0; i < cardsIdxHelper.length; i++) {
        cardsIdxHelper[i] = (cardsIdxHelper[i] + 3 >= cardCollection.length) ? ((cardsIdxHelper[i] + 3) % cardCollection.length) : (cardsIdxHelper[i] + 3);
    }

    // Build and display the cards with the new indices
    let newCards = buildCardsHelper(cardCollection, cardsIdxHelper);
    let cards = document.querySelectorAll('.cards');

    newCards.forEach((cardHTML, idx) => {
        if (cards[idx]) {
            cards[idx].innerHTML = cardHTML;
        }
    });
}

// Auxiliary function for building each card 
function buildCardsHelper(cardCollection, cardsIdx) {
    let newDisplay = [];
     
    cardsIdx.forEach(idx => {
        let card = `<div class="card-link">
                        <button type="button" class="img-button" id="img-button" onclick="flipCard('${cardCollection[idx].name}', '${cardCollection[idx].lang}')">
                            <img src="./images/dessert${cardCollection[idx].count}.png" alt="dessert${cardCollection[idx].count}">
                        </button>    
                        <div class="project-info">
                            <h2 class="project-title">${cardCollection[idx].name}</h2>
                            <p class="project-lang">${cardCollection[idx].lang}</p>
                            <p class="project-desc">${cardCollection[idx].briefDesc}</p>
                        </div>
                    </div>`;

        newDisplay.push(card);
    });

    return newDisplay;
}

/* Adds functionality for each project card, so that when it is clicked, it will display more information about the project */
function flipCard(name, lang) {
    document.getElementById("overlay").style.display = "block";
    document.getElementById("inner_proj").style.display = "block";

    // Send the project name to server.js
    fetch('/projects-receive-name', {
        method : 'POST',
        headers : {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify({ name : name })
    })
    .then(response => response.json())
    .then(data => {
        console.log("SERVER RESPONSE: ", data);

        // Fetch the fields corresponding to the name from DB
        return fetch('/project-flip-params');
    })
    .then(response => response.json())
    .then(data => {
        let topics = data.topics;
        let tools = data.tools;
        let longDesc = data.longDesc;
        let link = data.link;

        let toolsLst = `<ul>`;
        // console.log(Array.isArray(tools));
        if (Array.isArray(tools)) {
            tools.forEach(t => {
                toolsLst += `<li>${t}</li>`
            });
        } else {
            toolsLst += `<li>${tools}</li>`
        }
        
        toolsLst += `</ul>`;

        if (Array.isArray(topics)) {
            topics = topics.join(", ");
        }
   
        document.getElementById('inner_proj').innerHTML = `<div class="inner">
            <div class="in-line-title">
                <h1>${name}</h1>
                <div class="in-line-stack">
                    <p>Language: ${lang}</p>
                    <p>Topics: ${topics}</p>
                </div>

            </div>
            
            <div class="in-line-sub-title">
                <div class="tools">
                    <h3>Tools</h3>
                    ${toolsLst}
                </div>

                <div class="vertical-line"></div>

                <div class="description">
                    <h3>Description</h3>
                    <p>
                        ${longDesc}
                        <br><br>
                        <a href="${link}" target="_blank">Check out the github repo.</a>
                    </p>
                    
                </div>

                
            </div>
        </div>`;
    })
    .catch(error => console.error("Error: ", error));

    
}
  
function off() {
    document.getElementById("overlay").style.display = "none";
}
/* ************************************************************************** */
/* About page: */
function getJokeHelper() {
    fetch('/get-joke')
    .then(response => response.json())
    .then(data => {
        document.querySelector(".joke_box").innerHTML = `<p>${data.joke}</p>`;
    })
    .catch(error => console.error("Error: ", error));
}

/* Adds functionality for the collapsible menu, so that the section expands when clicked on and closes when clicked again. */
function expandMenu(num) {   
    var coll = document.getElementsByClassName("collapsible_button");
    var content = coll[num].nextElementSibling;

    coll[num].classList.toggle("active");

    if (content.style.maxHeight) {
        content.style.maxHeight = null;
    } else {
        content.style.maxHeight = content.scrollHeight + "px";
    }
}

/* Creates a type-writer effect on the header when page is loaded */


function typeWriterEffect(elementName, txt, speed=50) {
    let i = 0;

    const type = () => {
        if (i < txt.length) {
            document.getElementById(elementName).innerHTML += txt.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    };

    type()
}

window.onload = () => {
    let targetId = "";

    if (document.getElementById("type_writer_index") != null) {
        targetId = "type_writer_index";

    } else if (document.getElementById("type_writer_about") != null){
        targetId = "type_writer_about";

    } else {
        targetId = "type_writer_proj";
        
    }

    switch(targetId) {
        case "type_writer_index":
            typeWriterEffect(targetId, "Creating gentle digital experiences with thoughtful design and a dash of code.");
            break;
        case "type_writer_about":
            typeWriterEffect(targetId, "nice to meet you!");
            break;
        case "type_writer_proj":
            typeWriterEffect(targetId, "Here’s what I’ve been coding lately!");
            break;
         
    }

    
};


/* ************************************************************************** */
/* Contact page: */

/* Adds functionality for the "oven" (tab gallery), so that when a "dial" (button) is clicked, the corresponding information will be displayed in the "oven window".
    1 = Contact form (leave a message)
    2 = Send a copy of resume to user (employer)
    3 = Social media links (GitHub and LinkedIn) */
function changeWindow(dialNum) {
    // Orange: FF8811
    // Yellow: F4D06F
    alert(`Click on handle bar to "close" oven door :)`);
    let window = document.querySelector("#oven_window");
    window.style.backgroundColor = "#FF8811";

    switch (dialNum) {
        case 1:
            window.innerHTML = `<div id="contact_form_box">
                                    <h2>Get in Touch</h2>

                                    <ul>
                                        <li>
                                            <i class="fa fa-paper-plane-o"></i>
                                            <p>mhan10242019@gmail.com</p>
                                        </li>

                                        <li>
                                            <i class="fa fa-phone-square"></i>
                                            <p>443-535-3782</p>
                                        </li>
                                    </ul>
                                </div>`;
            break;
        case 2:
            window.innerHTML = `<div id="resume_form_box">
                                    <h2>R&#233;sum&#233; Options</h2>
                                    <button type="button" value="Preview" id="preview_button">
                                        <a href="./Michelle_Han.pdf" target="_blank">Preview</a>
                                    </button>
                                    <br>
                            
                                    <button type="button" value="Download" id="download_button">
                                        <a href="./Michelle_Han.pdf" download="Michelle_Han_Resume">Download</a>
                                    </button>
                                    <br>
                            
                                </div>`;
            break;
        case 3:
            window.innerHTML = `<div id="socials_box">
                                    <h2>Social Media</h2>

                                    <a href="https://www.linkedin.com/in/michelle-han-2a2629279" target="_blank" class="fa fa-linkedin"></a>

                                    <br>

                                    <a href="https://github.com/mhan1024" target="_blank" class="fa fa-github"></a>
                                </div>`;
            break;
        default:
            alert("NONE");
    }
}

function resetWindow() {
    let window = document.querySelector("#oven_window");
    window.innerHTML = `<hr class="streak">
                        <hr class="streak2">`;
    window.style.backgroundColor = "#9DD9D2";
}

/* ************************************************************************** */
/* Ensures that each card is the same height for the projects carousel. */
window.addEventListener('load', () => {
    const cards = document.querySelectorAll('.cards');
    let maxHeight = 0;

    cards.forEach(card => {
        const height = card.offsetHeight;
        if (height > maxHeight) maxHeight = height;
    });

    cards.forEach(card => {
        card.style.height = maxHeight + 'px';
    });
});