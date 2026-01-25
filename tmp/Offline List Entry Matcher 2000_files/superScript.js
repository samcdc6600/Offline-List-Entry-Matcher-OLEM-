let	selectedColumnInCandidateList = 0;
let	candidatesTableHTMLElement	= {};
let	candidatesList		= {};
let	matchedTableHTMLElement	= {};
let	fieldSeparatorStr	= "\t";
let	hideMatchingCandidateRows = true;
const	foundMatchSoundPath	= "assets/audio/affirmativeMatch_louder.wav";
const	noMatchFoundSoundPath	= "assets/audio/negativeMatch_louder.wav";

/* We need this because one Audio object can only play one sound at a time. It would be faster to
   have a pool of Audio objects, but we're trying to keep things relatively simple. This should
   probably be fast enough. */
function playSound(src)
{
    const audio = new Audio(src);
    audio.play();
}

function parseCSVData(cSVData)
{
    cSVData = cSVData.trim();
    const lines = cSVData.split("\n");             // Split into rows...
    /* Extract header row (shift removes the first element of an array). Map will apply trim() to
       each element in the array returned by split. */
    const headers = lines.shift().split(fieldSeparatorStr).map(header => header.trim());

    /* Call the lambda for each element in lines (the element is assigned to line).
       Rows should end up being filled with data like this:
       [ {rowData: { barcode: "100000000001", bin: "A1", category: "Electronics", … },
       wasMatched: false},
       {rowData: { barcode: "100000000002", bin: "A2", category: "Electronics", … },
       wasMatched: false}, ... ] */
    const rows = lines.map(line =>
	{
	    const values = line.split(fieldSeparatorStr);
	    const rowObj = {};

	    // For each element in headers assign it to header and it's index to i.
	    headers.forEach((header, i) =>
		{
		    /* Header is used as the "index" (since it's a string this is basically acting
		       like a map). */
		    rowObj[header] = values[i].trim();
		});
	    
	    return {"rowData": rowObj, "wasMatched": false};
	});

    // This syntax is actually shorthand for this "{headers: headers, rows: rows}".
    return {headers, rows};
}


function generateTable(tableData, selectedColumnInCandidateList)
{
    if(selectedColumnInCandidateList < 0 || selectedColumnInCandidateList >=
       tableData.headers.length)
    {
	// This is probably a fatal error...
	throw new Error (`Fatal (in generateTable()): selectedColumnInCandidateList \
(${selectedColumnInCandidateList}) < 0 || selectedColumnInCandidateList >= \
tableData.headers.length (${tableData.headers.length})`)
    }

    // Generate table header =======================================================================
    let tableHTMLText = `
<table class=\"dataTable\">
  <thead>
    <tr>`;
    tableData.headers.forEach((header, i) =>
	{
	    tableHTMLText += "<th class=\"tHWithButton ";
	    if(i === selectedColumnInCandidateList)
	    {
		// First column is selected by default...
		tableHTMLText += "selectedColumnHeader ";
	    }
	    /* Since our CSV data should be coming from a DB we are going to assume that each table
	       column has a uniquely named header. We can access this element from one of it's
	       button type sub-element to get "data-name", which can be used as a key into
	       candidatesList. */
	    tableHTMLText += "\"  data-name=\"" + header + "\">";
	    /* Add buttons... (we decided it was simpler to just use event handlers (onclick()s)
	       here, which are technically callbacks, but in JS "callbacks" are mean something
	       slightly different (which are also callbacks and which was the alternative to what
	       we are doing)). */
	    tableHTMLText += "<button type=\"button\" class=\"tHButton\" " +
		"onclick=\"handleHeaderNameButtonClick(this)\">" + header + "</button>" +
		"<button type=\"button\" class=\"tHButton\" " +
		"onclick=\"handleHeaderSortButtonClick(this)\">&lt;- sort</button></th>";
	});
    tableHTMLText += `
    </tr>
  </thead>
`
    // Generate table rows =========================================================================
    tableHTMLText += `
	    <tbody>
`;
    tableData.rows.forEach(row =>
	{
	    tableHTMLText += "<tr>";
	    tableData.headers.forEach((header, i) =>
		{
		    const generateCellProper = function()
		    {
			let useNormalTd = true;
			let highlitText = "";
			if(i === selectedColumnInCandidateList)
			{
			    if(!row.wasMatched)
			    {
				highlitText = " class=\"selectedCell\"";
			    }
			    else
			    {
				useNormalTd = false;
			    }
			}
			else if(row.wasMatched)
			{
			    highlitText = " class=\"selectedCell\"";
			}

			if(useNormalTd)
			{
			    tableHTMLText += "<td" + highlitText + ">" + row.rowData[header] +
				"</td>";
			}
			else
			{
			    tableHTMLText += "<td class=\"containsTriangle\">" +
				`<div class="topHalfTriangle"></div>
<div class="bottomHalfTriangle"></div>
<div class="rightHalfTriangle"></div>
<div class="leftHalfTriangle"></div><span class="doublyHighlightexTableCellText">` +
				row.rowData[header] + "</span></td>";
			}
		    };

		    if(row.wasMatched)
		    {
			if(!hideMatchingCandidateRows)
			{
			    generateCellProper();
			}
		    }
		    else
		    {
			generateCellProper();
		    }
		});
	    tableHTMLText += "</tr>";
	});

    tableHTMLText += `
	    </tbody>
</table>
`;
    
    return tableHTMLText;
}


// This version doesn't handle highlighting...
function generateMatchedTableHeader(tableData)
{
    // Generate table header =======================================================================
    let tableHTMLText = `
<table class=\"dataTable\">
  <thead>
    <tr>`;
    tableData.headers.forEach((header, i) =>
	{
	    /* Since our CSV data should be coming from a DB we are going to assume that each table
	       column has a uniquely named header. We can access this element from one of it's
	       button type sub-element to get "data-name", which can be used as a key into
	       candidatesList. */
	    tableHTMLText += "<th class=\" \"  data-name=\"" + header + "\">" + header +
		"</th>";
	});
    tableHTMLText += `
    </tr>
    <tbody>
    </tbody>
  </thead>
`

    return tableHTMLText;
}


// This version doesn't handle highlighting...
function generateTableRow(tableData, newRow)
{
    // Generate table rows =========================================================================
    let tableHTMLText = "<tr>";
    
    tableData.headers.forEach((header, i) =>
	{
	    let highlitText = "";
	    if(i === selectedColumnInCandidateList)
	    {
		highlitText = " class=\"selectedCell\"";
	    }
	    tableHTMLText += "<td" + highlitText + ">" + newRow[header] + "</td>";
	});
    tableHTMLText += "</tr>";
    
    return tableHTMLText;
}


function generateToTopOfTableButton()
{
    return `
<div class="toTopOfListButton">
  <button class="tableControlsButton tableToTopButton" onclick="scrollToIdOnClick(this)">
    To Top of List
  </button>
</div>`;
}


function handleHeaderNameButtonClick(buttonObj)
{
    /* Here we essentially just find the index of the column associated with the button and then
       regenerate the table (IDK there's probably a more optimal way to do it, but this is simple
       and the table probably isn't going to be more than a few thousand elements at most. )*/
    const tableHeader = buttonObj.parentElement;
    /* Get unique column name (as dissected above we are assuming that each column has a unique
       name!) */
    selectedColumnInCandidateList =
	candidatesList.headers.indexOf(tableHeader.getAttribute("data-name"));
    candidatesTableHTMLElement.innerHTML =
	generateTable(candidatesList, selectedColumnInCandidateList) + generateToTopOfTableButton();
}


function handleHeaderSortButtonClick(buttonObj)
{
    const tableHeader = buttonObj.parentElement;
    const tableColumnKey = tableHeader.getAttribute("data-name");
    sortTableByColumn(tableColumnKey);
    candidatesTableHTMLElement.innerHTML =
	generateTable(candidatesList, selectedColumnInCandidateList) + generateToTopOfTableButton();
}


function sortTableByColumn(colName, ascending = true)
{
    /* Here a is row n and b is row n + 1. A negative return result means that a should come before
       b and zero means that they are the same. Also note that sort() sorts the array in place (so
       there's no need for candidatesList = ...)
       Note that sort() should be stable for ES2019 and never versions of the JS spec. */
    candidatesList.rows.sort((a, b) =>
	{
            const valA = a.rowData[colName];
            const valB = b.rowData[colName];

            /* If numeric, convert strings to numbers (note that parseFloat(string) looks at the
	       start of the string and tries to convert it into a floating-point number.
	       So "3.14zfb" would become 3.14! */
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);
            if(!isNaN(numA) && !isNaN(numB))
	    {
		return ascending ? numA - numB : numB - numA;
            }

            // Otherwise, string comparison
            if(valA < valB) return ascending ? -1 : 1;
            if(valA > valB) return ascending ? 1 : -1;
            return 0;
	});
}


function checkForAndHandleMatch(searchCandidate)
{
    if(Object.keys(candidatesList).length > 0)
    {
	if(selectedColumnInCandidateList < 0 || selectedColumnInCandidateList >=
	   candidatesList.headers.length)
	{
	    // This is probably a fatal error...
	    throw new Error (`Fatal (in checkForAndHandleMatch()): selectedColumnInCandidateList \
(${selectedColumnInCandidateList}) < 0 || selectedColumnInCandidateList >= \
candidatesList.headers.length (${candidatesList.headers.length})`)
	}
	
	const columnKey = candidatesList.headers[selectedColumnInCandidateList];

	/* FindIndex is really like a for loop that calls the lambda on all elements until it finds
	   a match (which is signified by the return value of the lambda). It then returns the index
	   of the match that was found. It will return -1 if no match is found. It only finds one
	   match. */
	const index = candidatesList.rows.findIndex(row =>
	    {
		/* We are calling the hasOwnProperty() fuction associated with Object (the original,
		   unoverridden version) and passing it row as "this" and it will return true if the
		   row object has the key columnKey.
		   If row has the key (which really they all should), then we'll check if it has
		   searchCandidate too. */
		return Object.prototype.hasOwnProperty.call(row.rowData, columnKey)
		    && row.rowData[columnKey] === searchCandidate && !row.wasMatched;
	    });

	if(index !== -1)
	{
	    playSound(foundMatchSoundPath);
	    candidatesList.rows[index].wasMatched = true;
	    // if(Object.keys(matchedList).length === 0)
	    // {
	    // 	/* Use header from candidatesList for our table...
	    // 	   THIS PROBABLY SHOULDN'T BE IT AT ALL TBH. */
	    // 	matchedTableHTMLElement.innerHTML = generateMatchedTableHeader(candidatesList);
	    // }

	    /* Yes this is slow, but it's also simple and we're probably never going to be dealing
	       with a table where it's so big that it matters. */
	    candidatesTableHTMLElement.innerHTML =
		generateTable(candidatesList, selectedColumnInCandidateList) +
		generateToTopOfTableButton();

	    const tblBody = matchedTableHTMLElement.querySelector("tbody");
	    // tblBody.innerHTML += generateTableRow(candidatesList, candidatesList.rows[index].rowData);

	    tblBody.insertAdjacentHTML
	    ("afterbegin", generateTableRow(candidatesList, candidatesList.rows[index].rowData));
	}
	else
	{
	    playSound(noMatchFoundSoundPath);
	}
    }
}


// We're only supporting two field separation values, so this should be good.
function setInputOutputDataTypeTo(newFieldSeparatorVal)
{
    fieldSeparatorStr = newFieldSeparatorVal;
        console.log("setInputOutputDataTypeTo() called fieldSeparatorStr = ", fieldSeparatorStr);
}


function toggleHideMatchingCandidateRows()
{
    hideMatchingCandidateRows = !hideMatchingCandidateRows;
    candidatesTableHTMLElement.innerHTML =
	generateTable(candidatesList, selectedColumnInCandidateList) + generateToTopOfTableButton();
}


function scrollToIdOnClick(pageElement)
{
    pageElement.closest('div').parentNode.scrollTo({top: 0, left: 0, behavior: 'smooth'});
}


function main()
{
    const openFileButtonElement = document.getElementById("openFileButtonId");
    candidatesTableHTMLElement = document.getElementById("candidateTableContainerId")
    matchedTableHTMLElement = document.getElementById("matchedListContainerId");

    openFileButtonElement.addEventListener('click', () =>
	{
	    // Create a hidden file input
	    const inputFiles = document.createElement('input');
	    inputFiles.type = 'file';

	    // When a file is selected
	    inputFiles.addEventListener('change', () =>
		{
		    if(inputFiles.files.length > 0)
		    {
			const file = inputFiles.files[0];
			const reader = new FileReader();

			reader.onload = (event) =>
			{
			    selectedColumnInCandidateList = 0; // Reset to 0 for a new file...
			    candidatesList = parseCSVData(event.target.result);
			    // Generate candidate table...
			    candidatesTableHTMLElement.innerHTML = generateTable
			    (candidatesList, selectedColumnInCandidateList) +
				generateToTopOfTableButton();
			    // Generate matched table...
			    matchedTableHTMLElement.innerHTML =
				generateMatchedTableHeader(candidatesList) +
				generateToTopOfTableButton();
			};

			reader.readAsText(file);
		    }
		});

	    inputFiles.click();
	});

    const matchCandidateInputElement = document.getElementById("matchCandidateInputFieldId");

    matchCandidateInputElement.addEventListener("keydown", (event) =>
	{
	    if(event.key === "Enter")
	    {
		// Do not perform the default action for this event.
		event.preventDefault();
		const inputVal = matchCandidateInputElement.value.trim();
		checkForAndHandleMatch(inputVal);
		matchCandidateInputElement.value = "";
	    }
	});
}


main();
