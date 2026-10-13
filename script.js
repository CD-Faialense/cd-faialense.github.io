/* Retrieve BSSL*/

fetch("https://cd-faialense-backend.vercel.app/api/standings")
    .then(response => response.text())
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Error:", error);
    });



/* Header + Footer */

fetch("header.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("afterbegin", data);
    });

fetch("footer.html")
    .then(response => response.text())
    .then(data => {
        document.body.insertAdjacentHTML("beforeend", data);
    });