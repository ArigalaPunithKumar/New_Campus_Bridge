// server.js
require('dotenv').config(); // Load environment variables from .env file EARLY
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai'); // Import safety settings if needed
// const rateLimit = require('express-rate-limit'); // Optional: For rate limiting

// --- Configuration ---
const PORT = process.env.PORT || 5001; // Use port from .env or default to 5001
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-pro"; // Configurable model
const NODE_ENV = process.env.NODE_ENV || 'development'; // For CORS config

if (!GEMINI_API_KEY) {
    console.error("FATAL ERROR: GEMINI_API_KEY is not defined in the .env file.");
    process.exit(1); // Exit if the API key is missing
}

// --- Initialize Express App ---
const app = express();

// --- Middleware ---

// CORS Configuration
const corsOptions = {
    origin: NODE_ENV === 'production' ? 'YOUR_FRONTEND_URL_HERE' : '*', // Restrict in production
    methods: 'GET,POST', // Allow specific methods
};
app.use(cors(corsOptions));

// JSON Parsing
app.use(express.json({ limit: '5mb' })); // Parse JSON request bodies, increase limit slightly for code

// Optional: Rate Limiting (uncomment and configure if needed)
/*
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use('/api/', apiLimiter); // Apply rate limiting to API routes
*/

// --- Initialize Google Gemini Client ---
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Optional: Configure safety settings if needed
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Adjust as needed
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE, // Adjust as needed
    },
];

const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL_NAME,
    safetySettings // Apply safety settings here
});

// --- API Routes ---

// Simple route to test if the server is running
app.get('/', (req, res) => {
    res.send(`Campus Bridge AI Backend (${NODE_ENV}) is running!`);
});

// Main AI analysis route
app.post('/api/ai/analyze', async (req, res) => {
    console.log(`[${new Date().toISOString()}] Received POST /api/ai/analyze`);
    // console.log("Request Body:", JSON.stringify(req.body).substring(0, 500) + "..."); // Log safely truncated body

    const { code, language = 'code', analysisType = 'review' } = req.body;

    if (!code || typeof code !== 'string' || code.trim() === "") { // Added trim check
        return res.status(400).json({ success: false, error: 'Valid, non-empty code snippet is required.' });
    }

    let prompt;
    const codeBlock = `\`\`\`${language}\n${code}\n\`\`\``; // Encapsulate code

    // --- Prompt Engineering ---
    switch (analysisType) {
        case 'hint':
            prompt = `Act as an expert programming tutor. Provide ONE concise, helpful hint for the following ${language} code. Guide the user towards solving potential issues or improving their approach without giving away the direct answer. Focus on concepts, syntax, or logic flaws. Avoid conversational filler.

Code:
${codeBlock}

Hint:`;
            break;

        case 'debug':
            prompt = `Act as an expert code debugger. Analyze the following ${language} code for potential bugs, logical errors, or runtime issues. Explain the most likely primary issue clearly and suggest a specific fix or investigation path. If multiple issues exist, focus on the most critical one. Avoid conversational filler.

Code:
${codeBlock}

Debugging Analysis:`;
            break;

        case 'review':
        default: // Default to review
            prompt = `Act as an expert code reviewer. Provide a concise review of the following ${language} code based on:
1.  **Correctness & Bugs:** Identify potential errors or missed edge cases.
2.  **Clarity & Readability:** Assess code structure, comments, and naming.
3.  **Best Practices:** Check adherence to ${language} conventions.
4.  **Efficiency:** Briefly mention obvious performance issues if any.

Format the feedback clearly using markdown lists.
Conclude the review with ONLY a rating line in the format "Rating: X/10". Provide this rating even if the code is empty or incorrect. Avoid conversational filler.

Code:
${codeBlock}

Code Review:`;
            break;
    }

    // console.log("\n--- Sending Prompt to AI ---");
    // console.log(prompt); // Be careful logging prompts with potentially large code snippets
    // console.log("--------------------------\n");


    try {
        // console.log(`Generating content with model: ${GEMINI_MODEL_NAME}`);
        const result = await model.generateContent(prompt);

        // --- Check for blocked response ---
        // Note: Structure might vary slightly based on library version/response details
        if (!result.response || !result.response.candidates || result.response.candidates.length === 0 || result.response.candidates[0].finishReason !== 'STOP') {
            const blockReason = result.response?.candidates?.[0]?.finishReason || 'Unknown reason (possibly blocked)';
            const safetyRatings = result.response?.promptFeedback?.safetyRatings || [];
            console.warn(`AI generation stopped or blocked. Reason: ${blockReason}`, safetyRatings);
            let errorMessage = 'AI response blocked, possibly due to safety settings or prompt issues.';
            if (blockReason === 'SAFETY') {
                errorMessage = 'AI response blocked due to safety filters. Please modify the code or prompt.';
            } else if (blockReason === 'RECITATION') {
                errorMessage = 'AI response blocked due to potential recitation issues.';
            }
            return res.status(400).json({ success: false, error: errorMessage, blockReason, safetyRatings });
        }

        // --- Process successful response ---
        const response = result.response;
        const aiText = response.text(); // *** REMOVED await - .text() is synchronous accessor in latest versions *** Check your specific library version!

        // console.log("\n--- Received AI Response ---");
        // console.log(aiText);
        // console.log("--------------------------\n");

        // Simple check if response seems empty
        if (!aiText || aiText.trim() === "") {
            console.warn("Received empty text response from AI.");
            return res.status(500).json({ success: false, error: 'AI returned an empty response.' });
        }


        res.json({ success: true, result: aiText.trim() }); // Trim whitespace

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error calling Generative AI API:`, error);
        res.status(500).json({ success: false, error: `Failed to get response from AI service. ${error.message}` });
    }
});

// --- Catch-all for 404 Not Found ---
app.use((req, res, next) => {
    res.status(404).send("Sorry, can't find that!");
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Unhandled Error:`, err.stack);
    res.status(500).send('Something broke!');
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`AI Backend server (${NODE_ENV}) running on http://localhost:${PORT}`);
    console.log(`Using Gemini Model: ${GEMINI_MODEL_NAME}`);
});