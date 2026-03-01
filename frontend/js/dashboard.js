document.getElementById("productForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const price = document.getElementById("price").value;

  fetch("https://your-railway-backend-url/api/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, price })
  })
  .then(res => res.json())
  .then(() => {
    alert("Product Added");
  });
});
