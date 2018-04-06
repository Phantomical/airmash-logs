
// A list of the 50 most common adjectives
const adjectives = [
    "able",
    "bad",
    "best",
    "better",
    "big",
    "certain",
    "clear",
    "different",
    "early",
    "easy",
    "economic",
    "federal",
    "free",
    "full",
    "good",
    "great",
    "hard",
    "high",
    "human",
    "important",
    "international",
    "large",
    "late",
    "little",
    "local",
    "long",
    "low",
    "major",
    "military",
    "national",
    "new",
    "old",
    "only",
    "other",
    "political",
    "possible",
    "public",
    "real",
    "recent",
    "right",
    "small",
    "social",
    "special",
    "strong",
    "sure",
    "true",
    "whole",
    "young",
];
// Some animal (creature) names
const animals = [
    "buffalo",
    "cephalopod",
    "zebra",
    "coalecanth",
    "ant",
    "whale",
    "tiger",
    "rorqual",
    "shark",
    "elephant",
    "frog",
    "fish",
    "amoeba",
    "goose",
    "penguin"
];

function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function genName() {
    return getRandomItem(adjectives) + " " + getRandomItem(animals);
}

module.exports = genName
