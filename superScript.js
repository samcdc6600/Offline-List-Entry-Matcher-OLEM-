/* Copyright (c) 2026 Samuel G Brown
   This software is free to use, modify, and distribute for non-commercial purposes, provided that
   you credit the author.
   For commercial use, you must obtain written permission from the author. */


let	selectedColumnInCandidateList = 0;
let	candidatesTableHTMLElement = {};
let	candidatesList		= {};
let	matchedTableHTMLElement	= {};
let	matchedList		= {};
let	fieldSeparatorStr	= "\t";
let	hideMatchingCandidateRows = true;
const	foundMatchSoundPath	= "assets/audio/affirmativeMatch_louder.wav";
const	noMatchFoundSoundPath	= "assets/audio/negativeMatch_louder.wav";
const	columnHeaderTitle	= "Mark this column as the match candidate column.";
const	columnSortAscendingTitle = "Sort rows by this column in ascending order.";
const	columnSortDescendingTitle = "Sort rows by this column in descending order.";
const	defaultOutputFileNamePrefix = "matchedList";
const	tSVOutputFileNamePostfix = ".tsv";
const	cSVOutputFileNamePostfix = ".csv";


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
	    headers.forEach((header, iter) =>
		{
		    /* Header is used as the "index" (since it's a string this is basically acting
		       like a map). */
		    rowObj[header] = values[iter].trim();
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
    tableData.headers.forEach((header, iter) =>
	{
	    tableHTMLText += "<th class=\"tHWithButton ";
	    if(iter === selectedColumnInCandidateList)
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
	    tableHTMLText += "<button type=\"button\" class=\"tHButton\" title=\"" +
		columnHeaderTitle + "\"" +
		"onclick=\"handleHeaderNameButtonClick(this)\">" + header + "</button>" +
		"<button type=\"button\" class=\"tHButton tHSortButton\" " +
		"title=\"" + columnSortAscendingTitle +"\"" +
		"onclick=\"handleHeaderSortButtonClickForCandidateList(this, true)\"> &uarr; " +
		"</button>" +
		"<button type=\"button\" class=\"tHButton tHSortButton\" " +
		"title=\"" + columnSortDescendingTitle +"\"" +
		"onclick=\"handleHeaderSortButtonClickForCandidateList(this, false)\"> &darr; " +
		"</button></th>";
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
	    tableData.headers.forEach((header, iter) =>
		{
		    const generateCellProper = function()
		    {
			let useNormalTd = true;
			let highlitText = "";
			if(iter === selectedColumnInCandidateList)
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
    tableData.headers.forEach(header =>
	{
	    /* Since our CSV data should be coming from a DB we are going to assume that each table
	       column has a uniquely named header. We can access this element from one of it's
	       button type sub-element to get "data-name", which can be used as a key into
	       candidatesList. */
	    tableHTMLText += "<th class=\"tHWithButton \"  data-name=\"" + header + "\">" +
		"<span class=\"tHDummyButton\">" + header + "</span>" +
		"<button type=\"button\" class=\"tHButton tHSortButton\" " +
		"title=\"" + columnSortAscendingTitle +"\"" +
		"onclick=\"handleHeaderSortButtonClickForMatchedList(this, true)\"> &uarr; " +
		"</button>" +
		"<button type=\"button\" class=\"tHButton tHSortButton\" " +
		"title=\"" + columnSortDescendingTitle +"\"" +
		"onclick=\"handleHeaderSortButtonClickForMatchedList(this, false)\"> &darr; " +
		"</button></th>";
	});
    tableHTMLText += `
    </tr>
    <tbody>
    </tbody>
  </thead>
`

    return tableHTMLText;
}


function generateTableRow(headers, newRow, matchedOnHeader)
{
    // Generate table rows =========================================================================
    let tableHTMLText = "<tr>";
    
    headers.forEach(header =>
	{
	    let highlitText = "";
	    // We want to highlight the cell that the row was matched on.
	    if(header === matchedOnHeader)
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


function handleHeaderSortButtonClickForMatchedList(buttonObj, sortInAscending)
{
    if(matchedList.rows && matchedList.rows.length > 0)
    {
	// "Zip" the arrays...
	let matchedListZipped = matchedList.rows.map((rD, iter) =>
	    ({"rowData": rD, "matchedOnHeader": matchedList.matchedOnHeader[iter]}));
	/* This packages matchedList.rows[n] with matchedList.matchedOnHeader[n].
	   Then handleHeaderSortButtonClickProper() will sort the result on
	   matchedListZipped.rowData[columnName]. Then we can assign both sets of values back to
	   their respective origins. */
	handleHeaderSortButtonClickProper(buttonObj, matchedListZipped, sortInAscending);
	// "Un zip" the arrays...
	matchedList.rows = matchedListZipped.map(element => element.rowData);
	matchedList.matchedOnHeader = matchedListZipped.map(element => element.matchedOnHeader);
	console.log(matchedList.rows);
	// Generate HTML table...
	matchedTableHTMLElement.innerHTML =
	    generateMatchedTableHeader(candidatesList);
	let tableHTMLText = "";
	matchedList.rows.forEach((row, iter) =>
	    {
		tableHTMLText += generateTableRow
		(candidatesList.headers, row, matchedList.matchedOnHeader[iter]);
	    });
	const tblBody = matchedTableHTMLElement.querySelector("tbody");
	tblBody.insertAdjacentHTML("beforeend", tableHTMLText);
	matchedTableHTMLElement.innerHTML += generateToTopOfTableButton();
    }
}


function handleHeaderSortButtonClickForCandidateList(buttonObj, sortInAscending)
{
    handleHeaderSortButtonClickProper(buttonObj, candidatesList.rows, sortInAscending);
    candidatesTableHTMLElement.innerHTML =
	generateTable(candidatesList, selectedColumnInCandidateList) + generateToTopOfTableButton();
}


function handleHeaderSortButtonClickProper(buttonObj, list, sortInAscending)
{
    const tableHeader = buttonObj.parentElement;
    const tableColumnKey = tableHeader.getAttribute("data-name");
    sortTableByColumn(tableColumnKey, list, sortInAscending);
}


function sortTableByColumn(colName, list, ascending)
{
    console.log(list);
    /* Here a is row n and b is row n + 1. A negative return result means that a should come before
       b and zero means that they are the same. Also note that sort() sorts the array in place (so
       there's no need for list = ...)
       Note that sort() should be stable for ES2019 and never versions of the JS spec. */
    list.sort((a, b) =>
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
	    /* MatchedList has to have simillar geometry to candidatesList, since we have at least
	       one function that can be passed either as an argument. Also note here that we are
	       unshift (even though it's much slower than using push()). The problem with using
	       push() is when we need to save the file it may or may not have just been sorted. If
	       it has it will be in the right order, but if not it won't. However if we sorted it,
	       but then pushed something it would also be wrong. It's simpler just to do it in the
	       right order (even though it's pretty slow, but we don't expect that we'll ever have
	       that many entries anyway). Not that if we didn't need to support the save
	       functionality it would be fine because the matched list table isn't actually
	       ever constructed from from matchedList unless a sort operation is done. */
	    if(!matchedList.matchedOnHeader || !matchedList.rows)
	    {
		/* If only one of the above is empty there's a problem TBH. We'll just initialise
		   both to be empty */
		matchedList.matchedOnHeader = [];
		matchedList.rows = [];
	    }
	    matchedList.matchedOnHeader.unshift(columnKey);
	    matchedList.rows.unshift(candidatesList.rows[index].rowData);
	    console.log(matchedList);
	    candidatesList.rows[index].wasMatched = true;
	    /* Yes this is slow, but it's also simple and we're probably never going to be dealing
	       with a table where it's so big that it matters. */
	    candidatesTableHTMLElement.innerHTML =
		generateTable(candidatesList, selectedColumnInCandidateList) +
		generateToTopOfTableButton();
	    const tblBody = matchedTableHTMLElement.querySelector("tbody");
	    // matchedTableHTMLElement.insertAdjacentHTML
	    tblBody.insertAdjacentHTML
	    ("afterbegin", generateTableRow
	     (candidatesList.headers, candidatesList.rows[index].rowData,
	      candidatesList.headers[selectedColumnInCandidateList]));
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


/* Note that this function also resets some stuff as this is called when we are loading new data and
   so all of the previous table state should be erased. */
function generateTablesFromTSVCSVTextData(textData)
{
    selectedColumnInCandidateList = 0; // Reset to 0 for a new file...
    candidatesList = parseCSVData(textData);
    matchedList = {};
    // Generate candidate table...
    candidatesTableHTMLElement.innerHTML = generateTable
    (candidatesList, selectedColumnInCandidateList) +
	generateToTopOfTableButton();
    // Generate matched table...
    matchedTableHTMLElement.innerHTML =
	generateMatchedTableHeader(candidatesList) +
	generateToTopOfTableButton();
}


function loadTableDataFromInputArea()
{
    const tSVCSVInputFieldElement = document.getElementById("tSVInputFieldId");
    generateTablesFromTSVCSVTextData(tSVCSVInputFieldElement.value);
    tSVCSVInputFieldElement.value = "";
}


function saveMatchedList()
{
    if(matchedList.rows && matchedList.rows.length > 0)
    {
	/* This probably doesn't matter too much, but we'd like the output to be fairly "clean". So
	   we'll make sure that we add a space after a "," separator, but not after a "\t"
	   separator. */
	const fieldSeparatorStrLocal = (fieldSeparatorStr === "\t") ? "\t": ", ";
	fileText = "";

	matchedList.rows.forEach(row =>
	    {
		candidatesList.headers.forEach((header, iter) =>
		    {
			fileText += row[header];
			if(iter !== candidatesList.headers.length -1)
			{
			    fileText += fieldSeparatorStrLocal;
			}
		    });
		fileText += "\n";
	    });

	/* Create a "Blob" (a Blob is an immutable container for raw data (it can be text, binary,
	   etc). The second argument is just metadata saying it’s UTF-8 text. */
	const blob = new Blob
	(
            [fileText],
            {type: "text/plain;charset=utf-8"}
	);
	/* Creates a temporary internal URL that points to the data in the Blob (it's not an actual
	   HTTP URL though). */
	const blobURL = URL.createObjectURL(blob);
	// Create a HTML link element.
	const hTMLLink = document.createElement("a");
	// Set the "href" (usually used for URLs and stuff) to the blobURL object.
	hTMLLink.href = blobURL;
	/* Set the "download" property of htMLLink to the name of the file (i.e.,
	   <a download="filename">... */
	hTMLLink.download = defaultOutputFileNamePrefix +
	    ((fieldSeparatorStr === "\t") ? tSVOutputFileNamePostfix: cSVOutputFileNamePostfix);
	// Append the link element to the end of the body of the page.
	document.body.appendChild(hTMLLink);
	// Call the click() function on hTMLLink (basically like the user had clicked on it).
	hTMLLink.click();
	/*
	  .. user interacts with the file save popup window.
	*/
	/* Remove the link from the body of the page (as we just added it so we could call click()
	   on it. */
	document.body.removeChild(hTMLLink);
	/* CreateObjectURL allocates memory for the Blob URL internally revokeObjectURL frees that
	   memory. */
	URL.revokeObjectURL(blobURL);
    }
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
			    generateTablesFromTSVCSVTextData(event.target.result);
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
