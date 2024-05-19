"use strict";
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
    "Editor": "contributor"
};

const nameDelimiter = " / "

function parsePlaceholdersAndText(text) {
    // Regular expression to capture both placeholders and regular text
    const regex = /([{][^{}]*[}]|[[][^[\]]*[\]]|[<][^<>]*[>])|([^{}<>\[\]]+)/g;
    const matches = [];
    let match;
    // Iterate over each match from the regular expression
    while ((match = regex.exec(text)) !== null) {
        if (match[1]) { // This is a placeholder match
            let type;
            let content = match[1].slice(1, -1); // Remove the surrounding brackets
            switch (match[1][0]) { // Check the first character to determine the type
                case '{':
                    type = 'facultative';
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
                    matches.push(createPlaceholder(evaluateStyling(content), type))
                    break;
                default:
                    type = 'unknown';
                    matches.push({ content, type: type})
            }
            
            
        }
        else if (match[2]) { // This is regular text
            matches.push({ content: match[2], type: 'text', styling: null });
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

function createPlaceholder(content, styling, type) {
    return {content: content, styling, type}
}
function createPlaceholder(object, type) {
    return {...object, type};
}

function parseNestedPlaceholders(content) {
    const nestedRegex = /([{][^{}]*[}]|[[][^[\]]*[\]]|[<][^<>]*[>])/g;
    const results = [];
    let nestedMatch;
    let lastIndex = 0;
    while ((nestedMatch = nestedRegex.exec(content)) !== null) {
        // Add text between placeholders as type 'text'
        if (nestedMatch.index > lastIndex) {
            results.push({ content: content.substring(lastIndex, nestedMatch.index), type: 'text' });
        }
        // Handle the nested placeholder
        results.push(createPlaceholder(evaluateStyling(nestedMatch[0].slice(1, -1)), 'nested'))
        lastIndex = nestedMatch.index + nestedMatch[0].length;
    }
    // Add any remaining text after the last match
    if (lastIndex < content.length) {
        results.push({ content: content.substring(lastIndex), type: 'text', styling: null });
    }
    return results.length ? results : content; // Return content if no nested placeholders
}
// Example usage
const inputString = "[Autor<Vorname(i)(b)(sc)><Name>], <Titel(sc)>{ (<Reihentitel(b)>, }{<Bd.-Nr.>)}, <Ort(i)>: <Verlagsname>, {<Auflage>, }<Jahr>";
const placeholders = parsePlaceholdersAndText(inputString);
console.log(JSON.stringify({ placeholders }));
function createTextCSLBlock(placeholder) {
    return `<text value="${placeholder.content}"/>`;
}
// Create CSL block for a variable placeholder
function createVariableCSLBlock(placeholder) {
    let variableInfo = cslDictionary[placeholder.content];
    console.log(placeholder.content)
    console.log(variableInfo)
    if (typeof variableInfo === "string") {
        return `<text variable="${variableInfo}" ${placeholder.styling ? placeholder.styling : "" } />`;
    }
    else if (variableInfo.type === "date") {
        return `<date ${variableInfo.content} />`;
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
        case 'nested':
            result += createVariableCSLBlock(placeholder)
            break;
        case 'facultative':
            const variable = placeholder.content.find((el) => el.type === "nested").content;
            result += `<choose><if variable="${cslDictionary[variable]}">${placeholder.content.reduce((accumulator, currentValue) => accumulator + createCSLBlock(currentValue),
  "")}</if></choose>`;
            break;
    }
    result += "\n"
    return result;
}
// Create CSL group block for group placeholders
function createCSLGroupBlock(placeholder) {
    const nachvorvorname = placeholder.content[1].content === "Name"
    let result = `<names variable="${cslDictionary[placeholder.content[0].content]}">\n`;
    result += `<name delimiter="${nameDelimiter}" et-al-min="${3}" at-al-use-first="${1}" ${nachvorvorname ? "name-as-sort-order=\"first\"" : ""}/>` +"\n"
    for (const part of placeholder.content.slice(1)) {
        result += `<name-part name="${cslDictionary[part.content]}" ${part.styling ? part.styling : "" } />` + "\n"
    }
    result += "</names>\n";
    console.log(result)
    return result;
}
// Create CSL representation for all placeholders
function createCSL(placeholders) {
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
// Example usage assuming 'placeholders' is properly defined
console.log(createCSL(placeholders));
