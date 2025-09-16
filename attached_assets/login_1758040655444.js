document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault(); // 👈 evita que la página se recargue

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    fetch("http://localhost/PEDIDOS_EL_REY_DE_LOS_BUNUELOS/backend/config/api/auth.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    })
    .then(res => res.text()) // primero leer como texto
    .then(text => {
        console.log("Respuesta cruda del servidor:", text);

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error("El servidor no devolvió JSON válido");
        }

        if (data.message === "Login exitoso") {
    // ✅ Guardar el usuario en localStorage
    localStorage.setItem("adminUser", JSON.stringify(data.user));

    // ✅ Redirigir al dashboard
    window.location.href = "./dashboard.html";
}

    })
    .catch(err => {
        console.error("Error:", err);
        document.getElementById("login-error").textContent = "Error de conexión con el servidor";
        document.getElementById("login-error").style.display = "block";
    });
});
