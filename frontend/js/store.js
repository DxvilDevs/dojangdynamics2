fetch("https://your-railway-backend-url/api/products")
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById("products");

    data.forEach(product => {
      const div = document.createElement("div");
      div.innerHTML = `
        <h3>${product.name}</h3>
        <p>£${product.price}</p>
        <button onclick="buyProduct('${product.id}')">
          Buy
        </button>
      `;
      container.appendChild(div);
    });
  });

function buyProduct(id) {
  fetch(`https://your-railway-backend-url/api/checkout/${id}`, {
    method: "POST"
  })
  .then(res => res.json())
  .then(data => {
    window.location.href = data.url; // Stripe checkout
  });
}
