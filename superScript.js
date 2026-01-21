function parseCSVData(cSVData)
{
    cSVData = cSVData.trim();
    const lines = cSVData.split("\n");             // Split into rows...
    /* Extract header row (shift removes the first element of an array). Map will apply trim() to
       each element in the array returned by split. */
    const headers = lines.shift().split(",").map(header => header.trim());

    /* Call the lambda for each element in lines (the element is assigned to line).
       Rows should end up being filled with data like this:
       [ ["100000000001", "A1", "Electronics", "Sony", "X100"],
       ["100000000002", "A2", "Electronics", "Samsung", "GalaxyS21"], ... ] */
    const rows = lines.map(line =>
	{
	    const values = line.split(",");
	    const rowObj = {};

	    // For each element in headers assign it to header and it's index to i.
	    headers.forEach((header, i) =>
		{
		    /* Header is used as the "index" (since it's a string this is basically acting
		       like a map). */
		    rowObj[header] = values[i].trim();
		});
	    return rowObj;
	});

    // This syntax is actually shorthand for this "{headers: headers, rows: rows}".
    return {headers, rows};
}


function generateTable(tableData)
{
    // Generate table header =======================================================================
    let tableHTMLText = `
<table class=\"dataTable\">
  <thead>
    <tr>`;
    tableData.headers.forEach((header, i) =>
	{
	    let sharedClasses = "tHWithButton";
	    if(i === 0)
	    {
		// First column is selected by default...
		tableHTMLText += "<th class=\"selectedColumnHeader " + sharedClasses + "\">";
	    }
	    else
	    {
		tableHTMLText +=  "<th class=\"" + sharedClasses + "\">";
	    }
	    tableHTMLText += "<button type=\"button\">" + header + "</button>" +
		"<button type=\"button\"><- sort</button></th>";
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
		    let highlitText = "";
		    if(i === 0)
		    {
			highlitText = " class=\"selectedColumn\"";
		    }
		    tableHTMLText += "<td" + highlitText + ">" + row[header] + "</td>";
		});
	    tableHTMLText += "</tr>";
	});

    tableHTMLText += `
	    </tbody>
</table>
`;
    
    return tableHTMLText;
}


function generateToTopOfTableButton()
{
    return `
<div class="toTopOfListButton">
  <button onclick="scrollToIdOnClick(this)">
    To Top of List
  </button>
</div>`;
}


function main()
{
    const openFileButton = document.getElementById("openFileButtonId");
    const tableElement = document.getElementById("candidateTableContainerId")
    let candidateList = {};


    openFileButton.addEventListener('click', () =>
	{
	    // Create a hidden file input
	    const input = document.createElement('input');
	    input.type = 'file';

	    // When a file is selected
	    input.addEventListener('change', () =>
		{
		    if(input.files.length > 0)
		    {
			const file = input.files[0];
			const reader = new FileReader();

			reader.onload = (e) =>
			{
			    candidateList = parseCSVData(e.target.result);
			    tableElement.innerHTML = generateTable(candidateList) +
				generateToTopOfTableButton();
			};

			reader.readAsText(file);
		    }
		});

	    input.click();
	});
}


function scrollToIdOnClick(pageElement)
{
    pageElement.closest('div').parentNode.scrollTo({top: 0, left: 0, behavior: 'smooth'});
}


main();
