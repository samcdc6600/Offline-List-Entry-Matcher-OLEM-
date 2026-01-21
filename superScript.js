
function main()
{
    const openFileButton = document.getElementById("openFileButtonId");
    const fileContent = document.getElementById("candidateList")


    openFileButton.addEventListener('click', () => {
	// Create a hidden file input
	const input = document.createElement('input');
	input.type = 'file';

	// When a file is selected
	input.addEventListener('change', () => {
	    if (input.files.length > 0) {
		const file = input.files[0];
		const reader = new FileReader();

		reader.onload = (e) => {
		    fileContent.textContent = e.target.result;
		};

		reader.readAsText(file); // or readAsArrayBuffer / readAsDataURL
	    }
	});

	input.click();
    });

    id="candidateList"
}


function scrollToIdOnClick(pageElement)
{
    pageElement.closest('div').parentNode.scrollTo({top: 0, left: 0, behavior: 'smooth'});
}


main();
