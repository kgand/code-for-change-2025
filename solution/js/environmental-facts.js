// Environmental Facts for Subwaste Surfer

// Array of environmental facts about waste and recycling
const environmentalFacts = [
    {
        category: "plastic",
        fact: "Over 8 million tons of plastic are dumped into our oceans every year."
    },
    {
        category: "plastic",
        fact: "Plastic bags and other plastic garbage thrown into the ocean kill as many as 1 million sea creatures every year."
    },
    {
        category: "plastic",
        fact: "A plastic bottle can take up to 450 years to decompose in the environment."
    },
    {
        category: "plastic",
        fact: "Microplastics have been found in 94% of tap water samples in the US and 93% of bottled water samples globally."
    },
    {
        category: "paper",
        fact: "Recycling one ton of paper saves 17 trees, 7,000 gallons of water, and 463 gallons of oil."
    },
    {
        category: "paper",
        fact: "The average American uses about seven trees worth of paper products each year."
    },
    {
        category: "paper",
        fact: "Paper makes up about 23% of municipal solid waste in landfills."
    },
    {
        category: "paper",
        fact: "Making recycled paper uses 65% less energy than making new paper from trees."
    },
    {
        category: "metal",
        fact: "Recycling aluminum uses 95% less energy than producing it from raw materials."
    },
    {
        category: "metal",
        fact: "An aluminum can can be recycled and back on the shelf in just 60 days."
    },
    {
        category: "metal",
        fact: "The energy saved from recycling one aluminum can is enough to run a TV for three hours."
    },
    {
        category: "metal",
        fact: "Steel is the most recycled material in the world, with over 650 million tons recycled annually."
    },
    {
        category: "general",
        fact: "The average person generates about 4.5 pounds of trash every day."
    },
    {
        category: "general",
        fact: "About 75% of the waste Americans throw away is recyclable, but only about 30% is actually recycled."
    },
    {
        category: "general",
        fact: "Composting food scraps and yard waste can reduce the amount of garbage sent to landfills by up to 30%."
    },
    {
        category: "general",
        fact: "E-waste represents 2% of America's trash in landfills, but it equals 70% of overall toxic waste."
    },
    {
        category: "general",
        fact: "The Great Pacific Garbage Patch, a collection of marine debris in the North Pacific Ocean, is estimated to be twice the size of Texas."
    },
    {
        category: "general",
        fact: "It takes about 500 years for an average sized plastic water bottle to fully decompose."
    },
    {
        category: "general",
        fact: "Glass bottles can take up to 1 million years to decompose in the environment."
    },
    {
        category: "general",
        fact: "Americans throw away enough plastic bottles each year to circle the Earth four times."
    }
];

// Function to get a random fact
function getRandomFact(category = null) {
    let filteredFacts;
    
    if (category && category !== "general") {
        filteredFacts = environmentalFacts.filter(fact => fact.category === category);
        
        // If no facts for the specific category, fall back to general
        if (filteredFacts.length === 0) {
            filteredFacts = environmentalFacts.filter(fact => fact.category === "general");
        }
    } else {
        filteredFacts = environmentalFacts;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredFacts.length);
    return filteredFacts[randomIndex].fact;
}

// Export the functions and data
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        environmentalFacts,
        getRandomFact
    };
} 