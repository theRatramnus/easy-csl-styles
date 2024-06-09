let nameDelimiter = " / "
let et_al_min = 3
let shortenNames = false


export function setShortenNames(newShortenNames) {
   shortenNames = newShortenNames
}

export function setCreatorParameters(newNameDelimiter, newEtalMin, newShortenNames) {
    nameDelimiter = newNameDelimiter
    et_al_min = newEtalMin
    shortenNames = newShortenNames
}



const cslDictionary = {
    "Jahr": {
        type: "date",
        content: "date-parts=\"year\" form=\"text\" variable=\"issued\""
    },
    "Autor": "author",
    "Herausgeber": "editor",
    "Vorname": "given",
    "Name": "family",
    "Titel": "title",
    "Bandtitel": "container-title",
    "Zeitschrift": "container-title",
    "Lexikon": "container-title",
    "Reihentitel": "collection-title",
    "Bd.-Nr.": "volume",
    "Ort": "publisher-place",
    "Verlagsname": "publisher",
    "Auflage": "edition",
    "Seitenzahlen": "page",
    "Editor": "collection-editor",
    "Kurztitel": {
        type: "variable",
        content: `variable="title" form="short"`
    },
    "FN": "first-reference-note-number"
};



function parsePlaceholdersAndText(text) {
    // Regular expression to capture both placeholders and regular text
    const regex = /([{][^{}]*[}]|[[][^[\]]*[\]]|[<][^<>]*[>])|([^{}<>\[\]]+)/g;
    const matches = [];
    let match;
    console.log("Now processing " + text)
    // Iterate over each match from the regular expression
    while ((match = regex.exec(text)) !== null) {
        //console.log(match[0])
        if (match[1]) { // This is a placeholder match
            let type;
            let content = match[1].slice(1, -1); // Remove the surrounding brackets
            //console.log(match[1])
            switch (match[1][0]) { // Check the first character to determine the type
                case '{':
                    type = 'facultative';
                    console.log("HERE")
                    console.log(match[1])
                    // Recursively parse nested placeholders if they exist
                    matches.push({ content: parseNestedPlaceholders(content), styling: null, type });
                    break;
                case '[':
                    type = 'group';
                    // Recursively parse nested placeholders if they exist
                    matches.push({ content: parseNestedPlaceholders(content), styling: null, type });
                    break;
                case '<':
                    type = 'variable';
                    matches.push(createPlaceholderObject(evaluateStyling(content), type))
                    break;
                default:
                    type = 'unknown';
                    matches.push({ content, type: type})
            }
            
            
        }
        else if (match[2]) { // This is regular text
            matches.push({ content: match[2], type: 'text', styling: null });
          //  console.log(match[2])
            if (match[2].includes("<")) {
                console.warn("Found < in ", match[2])      
            }
        }
    }
    return matches;
}

function evaluateStyling(input) {

    const regex = /\(..?\)/g;
    const stylings = input.match(regex);
    const content = input.split("(")[0]
    let result = ""
    if (stylings) {
        for (const found of stylings) {
            switch (found) {
                case '(sc)':
                    result += "font-variant=\"small-caps\" "
                    break
                
                case '(i)':
                    result += "font-style=\"italic\" "
                    break

                case '(b)':
                    result += "font-weight=\"bold\" "
                    break
            }
        }
    }
    return { styling: result, content: content }
}

function createPlaceholderObject(object, type) {
    return {...object, type};
}

function parseNestedPlaceholders(content) {
    // Regular expression to capture nested placeholders
    const nestedRegex = /([{][^{}]*[}]|[[][^[\]]*[\]]|[<][^<>]*[>])/g;
    // Array to store the results
    const results = [];
    // Variable to store the match object
    let nestedMatch;
    // Variable to store the last index of a match
    let lastIndex = 0;
    // Loop through each match
    while ((nestedMatch = nestedRegex.exec(content)) !== null) {
        // Check if there is text between the last match and the current match
        if (nestedMatch.index > lastIndex) {
            // Add the text between the placeholders as type 'text'
            results.push({ content: content.substring(lastIndex, nestedMatch.index), type: 'text' });
            console.log("text oben" + content.substring(lastIndex, nestedMatch.index))
        }
        // Handle the nested placeholder
        // Check if the current match is a variable placeholder
        if (nestedMatch[0].charAt(0) === '<') {
            // Add the variable placeholder to the results array
            results.push(createPlaceholderObject(evaluateStyling(nestedMatch[0].slice(1, -1)), 'variable'));
            // Update the last index to the end of the current match
            lastIndex = nestedMatch.index + nestedMatch[0].length;
        }
        // Check if the current match is a group placeholder
        else if(nestedMatch[0].charAt(0) === '[') {
            // Recursively parse any nested placeholders in the group placeholder
            results.push({ content: parseNestedPlaceholders(nestedMatch[0].slice(1, -1)), styling: null, type: 'group' });
        }
        // If the current match is neither a variable nor a group placeholder, it is text
        else {
            // Add the text between the last match and the current match as type 'text'
            results.push({ content: content.substring(lastIndex, nestedMatch.index), type: 'text' });
            console.log("text unten" + content.substring(lastIndex, nestedMatch.index))
        }
    }
    // Check if there is any remaining text after the last match
    if (lastIndex < content.length) {
        const textCandidate = content.substring(lastIndex);
        // Add the remaining text as type 'text'
        if (!textCandidate.includes("<")) {
            results.push({ content: textCandidate, type: 'text', styling: null });
        } else {
            const newCandidate = textCandidate.split("]")[1]
            if(!newCandidate.includes("<")) {
                results.push({ content: newCandidate, type: 'text', styling: null });
            }
        }
    }
    // Return the results array if it is not empty, otherwise return the original content
    return results.length ? results : content;
}
// Example usage
/*const inputString = "[Autor<Vorname(i)(b)(sc)><Name>], <Titel(sc)>{ (<Reihentitel(b)>, }{<Bd.-Nr.>)}, <Ort(i)>: <Verlagsname>, {<Auflage>, }<Jahr>";
const placeholders = parsePlaceholdersAndText(inputString);
console.log(JSON.stringify({ placeholders }));*/
function createTextCSLBlock(placeholder) {
    return `<text value="${placeholder.content}"/>`;
}
// Create CSL block for a variable placeholder
function createVariableCSLBlock(placeholder) {
    let variableInfo = cslDictionary[placeholder.content];
    //console.log(placeholder.content)
    //console.log(variableInfo)
    if (typeof variableInfo === "string") {
        return `<text variable="${variableInfo}" ${placeholder.styling ? placeholder.styling : "" } />`;
    }
    else if (variableInfo.type === "date") {
        return `<date ${variableInfo.content} />`;
    }
    else if (variableInfo.type === "variable") { 
        return `<text ${variableInfo.content} />`
    }
}
// Create CSL blocks for an array of placeholders
function createCSLBlocks(placeholders) {
    let result = "";
    for (let placeholder of placeholders) {
        result += createCSLBlock(placeholder);
    }
    return result;
}
// Create CSL block based on placeholder type
function createCSLBlock(placeholder) {
    let result = "";
    switch (placeholder.type) {
        case 'text':
            result += createTextCSLBlock(placeholder)
            break;
        case 'variable':
            result += createVariableCSLBlock(placeholder)
            break;
        case 'group':
            result += createCSLGroupBlock(placeholder)
            break;
        case 'facultative':
            const variable = determineIfVariable(placeholder.content)
            result += `<choose><if variable="${cslDictionary[variable]}" match="any">${placeholder.content.reduce((accumulator, currentValue) => accumulator + createCSLBlock(currentValue),
  "")}</if></choose>`;
            break;
    }
    result += "\n"
    return result;
}
function determineIfVariable(content) {
    console.log(content)
    const variable = content.find((el) => el.type === "variable")
    console.log(variable)
    if (variable) {
        return variable.content
    } else {
        const name = content.find((el) => el.type === "group")
        console.log(name)
        return name.content[0].content
    }
}

// Create CSL group block for group placeholders
function createCSLGroupBlock(placeholder) {
    const nachvorvorname = placeholder.content[1].content === "Name"
    let result = `<names variable="${cslDictionary[placeholder.content[0].content]}">\n`;
    result += `<name delimiter="${nameDelimiter}" et-al-min="${et_al_min}" et-al-use-first="${1}" ${nachvorvorname ? "name-as-sort-order=\"first\"" : ""} ${shortenNames ? `initialize-with=". "` : ""} ${placeholder.content.length > 2 ? "" : `form="short"`} >` +"\n"
    for (const part of placeholder.content.slice(1)) {
        result += `<name-part name="${cslDictionary[part.content]}" ${part.styling ? part.styling : "" } />` + "\n"
    }
    result += "</name>\n</names>\n";
   // console.log(result)
    return result;
}
// Create CSL representation for all placeholders
export function createCSL(text) {
    const placeholders = parsePlaceholdersAndText(text);
    console.log(JSON.stringify(placeholders));
    let result = "";
    for (let placeholder of placeholders) {
        if (placeholder.type === "group") {
            result += createCSLGroupBlock(placeholder);
        }
        else {
            result += createCSLBlock(placeholder);
        }
    }
    return result;
}



