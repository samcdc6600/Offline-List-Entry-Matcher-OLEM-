
function main()
{
    console.log("Start!");
    // const div = document.getElementById("myDiv");
    // div.textContent = "Hello";
}


function scrollToIdOnClick(pageElement)
{
    pageElement.closest('div').parentNode.scrollTo({top: 0, left: 0, behavior: 'smooth'});
}


main();
