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

let nameDelimiter = " / "
let et_al_min = 3
let shortenNames = false

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
/*const inputString = "[Autor<Vorname(i)(b)(sc)><Name>], <Titel(sc)>{ (<Reihentitel(b)>, }{<Bd.-Nr.>)}, <Ort(i)>: <Verlagsname>, {<Auflage>, }<Jahr>";
const placeholders = parsePlaceholdersAndText(inputString);
console.log(JSON.stringify({ placeholders }));*/
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
    result += `<name delimiter="${nameDelimiter}" et-al-min="${et_al_min}}" et-al-use-first="${1}" ${nachvorvorname ? "name-as-sort-order=\"first\"" : ""} ${shortenNames ? `initialize-with=". "` : ""}/>` +"\n"
    for (const part of placeholder.content.slice(1)) {
        result += `<name-part name="${cslDictionary[part.content]}" ${part.styling ? part.styling : "" } />` + "\n"
    }
    result += "</names>\n";
    console.log(result)
    return result;
}
// Create CSL representation for all placeholders
function createCSL(text) {
    const placeholders = parsePlaceholdersAndText(text)
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
//console.log(createCSL(placeholders));



function createStyle(title, ID, name, summary, published, updated, book, article_journal, chapter, entry_encyclopedia, et_al_term) {
    return  `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="note" version="1.0" demote-non-dropping-particle="never" default-locale="de">
  <info>
    <locale xml:lang="de">
        <terms>
        <term name="et-al">${et_al_term}</term>
        <term name="and">/</term>
        <term name="retrieved">zugegriffen am</term>
        <term name="accessed">Zugriff:</term>
        </terms>
    </locale>
    <title>${title}</title>
    <id>${ID}</id>
    <author>
      <name>${name}</name>
    </author>
    <contributor>
      <name>Ludwig Patzold</name>
    </contributor>
    <summary>${summary}</summary>
    <published>${published}</published>
    <updated>${updated}</updated>
    <category/>
  </info>


<!--#############Hier steht die Zitation in den Fußnoten/-->
  <citation>
    <layout>
    </layout>
  </citation>
  
<!--#############Hier beginnt die Bibliographie/-->
  <bibliography>
    <layout>
      
<!--##############Hier beginnen die Angaben zum Buch/-->
        <choose>
          <if type="book" match="any">
          ${book}
          </if>
        </choose>

<!--###############Hier beginnt der Zeitschriftenartikel/-->
        <choose>
          <if type="article-journal" match="any">
            ${article_journal}
          </if>
        </choose>

<!--###############Hier beginnt der Artikel im Sammelband/-->
        <choose>
          <if type="chapter" match="any">
            ${chapter}
          </if>
        </choose>



<!--###############Hier beginnt der Lexikoneintrag/-->
        <choose>
          <if type="entry-encyclopedia" match="any">
            ${entry_encyclopedia}
          </if>
        </choose>
    </layout>
  </bibliography>
</style>
`
}


function getCurrentXMLTimestamp() {
    const now = new Date();

    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const milliseconds = String(now.getUTCMilliseconds()).padStart(3, '0');

    const timestamp = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}Z`;

    return timestamp;
}

function getCurrentYear() {
    const now = new Date();

    const year = now.getUTCFullYear();
    
    return year
}


function main() {
    document.getElementById('btn').addEventListener('click', function () {
        const ids = ["book", "article", "chapter", "encyclopedia-entry", "delimiter", "NameDesStyles", "AutorDesStyles", "BeschreibungdesStyles", "etal", "IDDesStyles", "etalLabel"]
        const results = []
        
        // Loop through each id and get the updated textContent or value
        for (const id of ids) {
            const element = document.getElementById(id);
            const result = (element.tagName === "INPUT" || element.tagName === "TEXTAREA") ? element.value : element.textContent;
            results.push(result);
            console.log(result);
        }
        
        // Using the results array to create the text
        const styleTitle = results[5]
        shortenNames = document.getElementById('AutorGekuerzt').checked
        nameDelimiter = results[4];
        et_al_min = results[8];
        const text = createStyle(styleTitle, results[9], results[6], results[7], getCurrentYear(), getCurrentXMLTimestamp(), createCSL(results[0]), createCSL(results[1]), createCSL(results[2]), createCSL(results[3]), results[10]);

        const filename = styleTitle + ".txt";

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    });
}

addEventListener("DOMContentLoaded", (event) => { main(); });
