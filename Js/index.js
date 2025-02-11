import { KEY } from "./config.js";

const chat_Input = document.querySelector("#chat-input");
const send_Button = document.querySelector("#send-btn");
const chat_Wrap = document.querySelector(".chat-wrap");
const theme_Button = document.querySelector("#theme-btn");
const delete_Button = document.querySelector("#delete-btn");

let userText = null;
const initialHeight = chat_Input.scrollHeight;

const loadDataFromLocalStorage = () => {
    const theme_Color = localStorage.getItem("theme-color")

    document.body.classList.toggle("light-mode", theme_Color === "light_mode");
    theme_Button.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode"

    const defaultText = `<div class= "default-text">
                            <h1> ChatGPT Clone [ChatBOT]</h1>
                            <p>Start a conversation and explore the power of AI.<br> Your chat history will be displayed here</p>
                        </div>`

    chat_Wrap.innerHTML = localStorage.getItem("all-chats") || defaultText;

    chat_Wrap.querySelectorAll("p").forEach(p => {
        if (p.innerHTML.trim() === "") {
            console.warn("Empty <p> detected. Reapplying Markdown.");
            p.innerHTML = marked.parse(p.textContent.trim());
        }
    });

    chat_Wrap.scrollTo(0, chat_Wrap.scrollHeight);
};
loadDataFromLocalStorage();

const createElement = (html, className) => {
    //create ne div and apply chat, specified class and set html content of div
    const chatDiv = document.createElement("div");
    chatDiv.classList.add("chat", className);
    chatDiv.innerHTML = html;
    return chatDiv; //return the created chat div
};

// Function to get chat response from Gemini API
const getBotResponse = async (botChatDiv) => {
    const pElement = document.createElement("p");

    const API_URL = `${KEY.API_URL}key=${KEY.API_KEY}`;
    const requestBody = {
        contents: [
            {
                parts: [{ text: userText }]
            }
        ]
    };

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - ${await response.text()}`);
        }

        const data = await response.json();
        const message = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response from AI, check your connection & try again";

        // Set AI bot response in the UI converting the Markdown into proper HTML
        pElement.innerHTML = marked.parse(message);
    } catch (error) {
        console.error(error);
        pElement.classList.add("error");
        pElement.textContent = "⚠️ Oops! Something went wrong while fetching response. Please try again";
    }

    botChatDiv.querySelector(".typing-animation").remove();
    botChatDiv.querySelector(".chat-details").appendChild(pElement);
    chat_Wrap.scrollTo(0, chat_Wrap.scrollHeight);
    localStorage.setItem("all-chats", chat_Wrap.innerHTML);
};

const copyResponse = (copyBtn) => {
    // Copy the text content of the response to the clipboard
    const responseTextElement = copyBtn.parentElement.querySelector("p");
    navigator.clipboard.writeText(responseTextElement.textContent);
    copyBtn.textContent = "done";
    setTimeout(() => copyBtn.textContent = "content_copy", 1000);
};

// Ensure the function copyResponse is available globally because using type="module" 
window.copyResponse = copyResponse;

const showTypingAnimation = () => {
    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="./Images/chatbot.webp" alt="" width="100px">
                        <div class="typing-animation">
                            <div class="typing-dot" style="--delay: 0.2s;"></div>
                            <div class="typing-dot" style="--delay: 0.3s;"></div>
                            <div class="typing-dot" style="--delay: 0.4s;"></div>
                        </div>
                    </div>
                    <span class="material-symbols-rounded" onclick="copyResponse(this)" >content_copy</span>
                </div>`;

    // Create an incoming chat div with typing animation and append it to chat container 
    const botChatDiv = createElement(html, "bot");
    chat_Wrap.appendChild(botChatDiv);
    chat_Wrap.scrollTo(0, chat_Wrap.scrollHeight);
    getBotResponse(botChatDiv);
};

const handleUserChat = () => {
    userText = chat_Input.value.trim(); //get chat_input value a remove extra spaces
    if (!userText) return;

    chat_Input.value = "";
    chat_Input.style.height = `${initialHeight}px`;

    const html = `<div class="chat-content">
                    <div class="chat-details">
                        <img src="./Images/user.png" alt="" width="100px">
                        <p></p>
                    </div>
                </div>`;

    // Create an outgoing chat div with user's message and append it to chat container 
    const userChatDiv = createElement(html, "user");
    userChatDiv.querySelector("p").textContent = userText;
    document.querySelector(".default-text")?.remove();
    chat_Wrap.appendChild(userChatDiv);
    chat_Wrap.scrollTo(0, chat_Wrap.scrollHeight);
    setTimeout(showTypingAnimation, 500);
};

theme_Button.addEventListener("click", () => {
    //toggle body's class for theme and save update to LS
    document.body.classList.toggle("light-mode");
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("theme-color", theme_Button.innerText);
    theme_Button.innerText = document.body.classList.contains("light-mode") ? "dark_mode" : "light_mode"
});

delete_Button.addEventListener("click", () => {
    //delete chat from storage
    if (confirm("Are you sure you want to delete all the chats?")) {
        localStorage.removeItem("all-chats");
        loadDataFromLocalStorage();
    }
});

chat_Input.addEventListener("input", () => {
    chat_Input.style.height = `${initialHeight}px`;
    chat_Input.style.height = `${chat_Input.scrollHeight}px`;
});

chat_Input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftkey && window.innerWidth > 800) {
        e.preventDefault();
        handleUserChat();
    }
});

send_Button.addEventListener("click", handleUserChat);