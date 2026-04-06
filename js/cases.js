const cases = [
    {
        id: 1,
        name: "Bella",
        status: "abused",
        image: "https://th.bing.com/th/id/OIP.1Wgk3vF4o33ZrRncluxmuQHaE8?w=282&h=188&c=7&r=0&o=7&pid=1.7&rm=3"
    },
    {
        id: 2,
        name: "Max",
        status: "injured",
        image: "https://th.bing.com/th/id/OIP.wxQEga4w7c73JlStBBfeqAHaE8?w=256&h=180&c=7&r=0&o=7&pid=1.7&rm=3"
    },
    {
        id: 3,
        name: "Luna",
        status: "sick",
        image: "https://th.bing.com/th/id/R.63a3eb3b4a330e52f204e7c04ca15299?rik=HD6Q1mY48gCBgQ&pid=ImgRaw&r=0"
    }
];

const container = document.getElementById("casesContainer");

cases.forEach(animal => {
    const card = document.createElement("div");
    card.classList.add("card");

    card.innerHTML = `
    <img src="${animal.image}" alt="${animal.name}">
    <div class="card-content">
      <h3>${animal.name}</h3>
      <span class="status ${animal.status}">${animal.status}</span>
      <button onclick="viewDetails(${animal.id})">View Details</button>
    </div>
`;

    container.appendChild(card);
});

function viewDetails(id) {
   window.location.href = `../html/cases_details.html?id=${id}`;
}