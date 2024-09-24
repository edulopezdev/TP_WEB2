// Inicialización de la variable deptos con la opción predeterminada
let deptos = '<option value="99" selected>Ninguna opción</option>';
let listaObjetos = [];
let pagina = 1;

// ====================== Función para obtener departamentos ======================
const selectDepartamentos = async () => {
  try {
    // Hago una solicitud para obtener los departamentos del museo
    const respuesta = await fetch(
      "https://collectionapi.metmuseum.org/public/collection/v1/departments"
    );

    if (respuesta.status === 200) {
      const museo = await respuesta.json();
      // Agrego cada departamento como opción en el elemento select
      museo.departments.forEach((element) => {
        deptos += `<option value="${element.departmentId}">${element.displayName}</option>`;
      });
      document.getElementById("department").innerHTML = deptos;
    } else if (respuesta.status === 404) {
      console.log("No existe el departamento");
    } else {
      console.log("Error general: " + respuesta.status);
    }
  } catch (error) {
    console.log(error);
  }
};

// Llamo a la función para llenar el select de departamentos
selectDepartamentos();

// ====================== Manejo de selección de departamento ======================
let deptosSeleccion = "99";

// Capturo la selección del departamento
document.getElementById("department").addEventListener("change", (event) => {
  deptosSeleccion = event.target.value;
  console.log(deptosSeleccion);
});

// ====================== Manejo de selección de localización ======================
let localSeleccion = "";

// Capturo la selección de localización
document.getElementById("location").addEventListener("change", (event) => {
  localSeleccion = event.target.value;
  console.log(localSeleccion);
});

// ====================== Función para filtrar la URL ======================
function filtro() {
  let dpt = deptosSeleccion;
  let palabra = document.getElementById("search").value;
  let localizacion = localSeleccion;
  let url;

  // Construyo la URL según las selecciones
  if (dpt != 99 && palabra != "" && localizacion != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}&DepartmentId=${dpt}`;
  } else if (dpt != 99 && localizacion != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*&DepartmentId=${dpt}`;
  } else if (dpt != 99 && palabra != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}&DepartmentId=${dpt}`;
  } else if (localizacion != "" && palabra != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}`;
  } else if (dpt != 99) {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=*&DepartmentId=${dpt}`;
  } else if (localizacion != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*`;
  } else if (palabra != "") {
    url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}`;
  }
  return url; // Devuelvo la URL construida
}

// ====================== Función para buscar y mostrar resultados ======================
function buscar(pagina = 1) {
  document.querySelector(".loader").style.display = "flex"; // Muestro el loader

  let url = filtro(); // Obtengo la URL filtrada
  fetch("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  })
    .then((respuesta) => respuesta.json())
    .then((datos) => {
      document.querySelector(".loader").style.display = "none"; // Oculto el loader
      const galeria = document.getElementById("gallery");
      galeria.innerHTML = ""; // Limpio resultados anteriores

      // Muestro un mensaje si no hay resultados
      if (datos.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No se encontraron resultados.";
        galeria.appendChild(mensaje);
      } else {
        listaObjetos = datos;
        // Determino el slice con base en la página
        let slicedDatos;
        console.log("CANTIDAD OBJETOS: " + datos.length);
        switch (pagina) {
          case 1:
            slicedDatos = datos.slice(0, 200);
            break;
          case 2:
            slicedDatos = datos.slice(200, 400);
            break;
          case 3:
            slicedDatos = datos.slice(400, 600);
            break;
          case 4:
            slicedDatos = datos.slice(600, 800);
            break;
          case 5:
            slicedDatos = datos.slice(800, 1000);
            break;
          default:
            slicedDatos = datos.slice(0, 200);
            break;
        }

        // Creo tarjetas para cada resultado (máximo 200 en cada página)
        let tarjetasCreadas = 0;

        for (const element of slicedDatos) {
          if (element.primaryImage && element.primaryImage !== "") {
            crearCards(element); // Llamo a la función que crea las tarjetas
            tarjetasCreadas++;
          }
          // Si ya he creado 20 tarjetas, termino
          if (tarjetasCreadas >= 20) {
            break;
          }
        }
        btnPaginacion(pagina);
      }
    })
    .catch((error) => {
      console.error("Error al buscar:", error);
      document.querySelector(".loader").style.display = "none"; // Oculto el loader en caso de error
    });
}

// ====================== Función para buscar anterior ======================
function buscarAnterior() {
  document.querySelector(".loader").style.display = "flex"; // Muestro el loader

  window.scrollTo({
    top: 0,
    behavior: "smooth", // Hago que el scroll sea suave
  });

  pagina--;
  console.log(pagina);
  const galeria = document.getElementById("gallery");
  galeria.innerHTML = ""; // Limpio resultados anteriores

  const datos = listaObjetos; // Asegúrate de que 'listaObjetos' esté definido

  let slicedDatos;
  switch (pagina) {
    case 1:
      slicedDatos = datos.slice(0, 50);
      break;
    case 2:
      slicedDatos = datos.slice(50, 100);
      break;
    case 3:
      slicedDatos = datos.slice(100, 150);
      break;
    case 4:
      slicedDatos = datos.slice(150, 200);
      break;
    case 5:
      slicedDatos = datos.slice(200, 250);
      break;
    default:
      slicedDatos = datos.slice(0, 200);
      break;
  }

  let tarjetasCreadas = 0;

  for (const element of slicedDatos) {
    if (element.primaryImage && element.primaryImage !== "") {
      crearCards(element); // Llamo a la función que crea las tarjetas
      tarjetasCreadas++;
      document.querySelector(".loader").style.display = "none"; // Oculto el loader
    }
    if (tarjetasCreadas >= 20) {
      document.querySelector(".loader").style.display = "none"; // Oculto el loader
      break;
    }
  }

  btnPaginacion(pagina);
}

// ====================== Función para buscar siguiente ======================
function buscarSiguiente() {
  document.querySelector(".loader").style.display = "flex"; // Muestro el loader

  window.scrollTo({
    top: 0,
    behavior: "smooth", // Hago que el scroll sea suave
  });

  pagina++;
  console.log(pagina);
  const galeria = document.getElementById("gallery");
  galeria.innerHTML = ""; // Limpio resultados anteriores

  const datos = listaObjetos; // Asegúrate de que 'listaObjetos' esté definido

  let slicedDatos;
  switch (pagina) {
    case 1:
      slicedDatos = datos.slice(0, 50);
      break;
    case 2:
      slicedDatos = datos.slice(50, 100);
      break;
    case 3:
      slicedDatos = datos.slice(100, 150);
      break;
    case 4:
      slicedDatos = datos.slice(150, 200);
      break;
    case 5:
      slicedDatos = datos.slice(200, 250);
      break;
    default:
      slicedDatos = datos.slice(0, 200);
      break;
  }

  let tarjetasCreadas = 0;

  for (const element of slicedDatos) {
    if (element.primaryImage && element.primaryImage !== "") {
      crearCards(element); // Llamo a la función que crea las tarjetas
      tarjetasCreadas++;
      document.querySelector(".loader").style.display = "none"; // Oculto el loader
    }
    if (tarjetasCreadas >= 20) {
      document.querySelector(".loader").style.display = "none"; // Oculto el loader
      break;
    }
  }

  btnPaginacion(pagina);
}

// ====================== Función para crear cartas ======================
function crearCards(objeto) {
  let galeria = document.getElementById("gallery");

  // Verifico si el objeto tiene una imagen
  if (objeto.primaryImage) {
    let carta = document.createElement("div");
    carta.classList.add("carta");

    // Creo la imagen
    let imagen = document.createElement("img");
    imagen.src =
      objeto.primaryImage !== ""
        ? objeto.primaryImage
        : "/images/sin_imagen.png";
    carta.appendChild(imagen);

    // Contenedor para el texto
    let infoContainer = document.createElement("div");
    infoContainer.classList.add("info-container");

    // Título del objeto
    let titulo = document.createElement("h3");
    titulo.innerText = objeto.title || "Título no disponible";
    infoContainer.appendChild(titulo);

    // Dinastía
    let dinastia = document.createElement("h4");
    dinastia.innerText = objeto.dynasty
      ? `Dinastía: ${objeto.dynasty}`
      : "Dinastía no disponible";
    infoContainer.appendChild(dinastia);

    // Cultura
    let cultura = document.createElement("h4");
    cultura.innerText = objeto.culture
      ? `Cultura: ${objeto.culture}`
      : "Cultura no disponible";
    infoContainer.appendChild(cultura);

    carta.appendChild(infoContainer);

    // Botón para ver imágenes extras
    if (objeto.additionalImages && objeto.additionalImages.length > 0) {
      let boton = document.createElement("button");
      boton.innerHTML = "Ver imágenes extras";
      boton.classList.add("ver-imagenes-btn");
      boton.onclick = () =>
        window.open(`imagenExtra?objectId=${objeto.objectID}`, "_blank");
      carta.appendChild(boton);
    }

    // Asigno título del objeto
    carta.title =
      objeto.objectDate !== ""
        ? "Creación: " + objeto.objectDate
        : "Creación: le faltan datos a la API";

    // Agrego la carta a la galería
    galeria.appendChild(carta);
  }
}

// ====================== Función para paginar ======================
const btnPaginacion = (pagina = 1) => {
  const totalPaginas = 5; // Total de páginas

  if (pagina === 1) {
    btnAnterior.style.display = "none"; // Oculto "Anterior" en la primera página
    btnSiguiente.style.display = "block"; // Muestro "Siguiente"
  } else if (pagina === totalPaginas) {
    btnAnterior.style.display = "block"; // Muestro "Anterior"
    btnSiguiente.style.display = "none"; // Oculto "Siguiente" en la última página
  } else {
    btnAnterior.style.display = "block"; // Muestro ambos botones en páginas intermedias
    btnSiguiente.style.display = "block";
  }
};
