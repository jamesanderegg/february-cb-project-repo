import { movableModels } from "../number2/scene/ModelFunctions/MoveableModels";

// List of phrases to ask Buggy to search for an item
const searchPhrases = [
    "can you search for {item}, please?",
    "could you find {item} for me?",
    "would you mind locating {item} for me?",
    "can you look around for {item}, please?",
    "could you check for {item} in the area?",
    "would it be possible for you to spot {item}?",
    "can you scout for {item}?",
    "could you scan the area for {item}?",
    "may you retrieve {item}?",
    "can you seek out {item}?",
    "could you hunt for {item} for me?",
    "would you be able to fetch {item}?",
    "can you explore the area for {item}?",
    "could you detect {item} somewhere?",
    "may you survey the area for {item}?",
    "can you search the vicinity for {item}?",
    "could you attempt to locate {item}?",
    "would you inspect the area for {item}?",
    "can you probe for {item}?",
    "could you look high and low for {item}?",
    "may you do a sweep for {item}?",
    "can you track down {item}?",
    "could you go and find {item} for me?",
    "would you see if {item} is around here?",
    "can you dig around for {item}?",
    "could you use your sensors to find {item}?",
    "may you comb the environment for {item}?",
    "can you scope out the area for {item}?",
    "could you navigate and search for {item}?",
    "would you mind scanning for {item}?",
    "can you initiate a search for {item}?",
    "could you use your camera to locate {item}?",
    "may you go on a hunt for {item}?",
    "can you activate your search mode for {item}?",
    "could you use your tools to find {item}?",
    "would you roam around and look for {item}?",
    "can you patrol the area for {item}?",
    "could you snoop around for {item}?",
    "may you check every corner for {item}?",
    "can you perform a detailed search for {item}?",
    "could you survey this zone for {item}?",
    "would you do a reconnaissance for {item}?",
    "can you pinpoint the location of {item}?",
    "could you roam the premises for {item}?",
    "may you explore and retrieve {item}?",
    "can you use your abilities to find {item}?",
    "could you set out to locate {item}?",
    "would you mind exploring the environment for {item}?",
    "can you carry out a mission to find {item}?",
    "could you take a look around for {item}?"
];

// Function to call Buggy to search for an item from movableModels
export default function callBuggyToSearch(modelName) {
    const model = movableModels.find(model => model.name === modelName);
    if (!model) {
        console.log(`Model named ${modelName} not found.`);
        return;
    }

    const randomIndex = Math.floor(Math.random() * searchPhrases.length);
    const phrase = searchPhrases[randomIndex].replace("{item}", modelName);
    const addPrefix = Math.random() < 0.5; // Randomly decide whether to add "Hey Buggy, "
    const command = addPrefix ? `Hey Buggy, ${phrase}` : `Buggy, ${phrase}`;

    console.log(command);
}

// Example usage
callBuggyToSearch("apple");  // You can change 'apple' to any other model name from movableModels
