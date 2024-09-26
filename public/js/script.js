let deptos = '<option value="" selected>Ninguna opción</option>'
let listaObjetos = [];
let pagina = 1;
const resultadosPorPagina = 20;

// ====================== Función para obtener departamentos ======================
const selectDepartamentos = async () => {
    try {
        const respuesta = await fetch("https://collectionapi.metmuseum.org/public/collection/v1/departments");
        if (respuesta.status === 200) {
            const museo = await respuesta.json();
            deptos += museo.departments.map(element => `<option value="${element.departmentId}">${element.displayName}</option>`).join('');
            document.getElementById("department").innerHTML = deptos;
        } else {
            console.log("Error general: " + respuesta.status);
        }
    } catch (error) {
        console.log(error);
    }
};

selectDepartamentos();

// ====================== Manejo de selección de departamento ======================
let deptosSeleccion = "99";
document.getElementById("department").addEventListener("change", (event) => {
    deptosSeleccion = event.target.value;
});

// ====================== Manejo de selección de localización ======================
let localSeleccion = "";
document.getElementById("location").addEventListener("change", (event) => {
    localSeleccion = event.target.value;
});

// ====================== Función para filtrar la URL ======================
function filtro() {
    let dpt = deptosSeleccion;
    let palabra = document.getElementById("search").value;
    let localizacion = localSeleccion;
    let url;

    //acá construyo la URL según las selecciones
    if (dpt != 99 && palabra && localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}&DepartmentId=${dpt}`;
    } else if (dpt != 99 && localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*&DepartmentId=${dpt}`;
    } else if (dpt != 99 && palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}&DepartmentId=${dpt}`;
    } else if (localizacion && palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}`;
    } else if (dpt != 99) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=*&DepartmentId=${dpt}`;
    } else if (localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*`;
    } else if (palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}`;
    }

    return url; //devuelvo la URL construida
}

// ====================== Función para validar objetos ======================
function esObjetoValido(objeto) {
    return objeto.primaryImageSmall !== ""; // Solo verifica si hay una imagen
}

// ====================== Función para buscar y mostrar resultados ======================

// Función para hacer vibrar los filtros
function vibrarFiltros(filtros) {
    filtros.forEach(filtro => {
        filtro.classList.add("vibrar"); // Clase que aplica la animación de vibrar
        setTimeout(() => {
            filtro.classList.remove("vibrar"); // Elimina la clase después de 1 segundo
        }, 1000);
    });
}
async function buscar(paginaActual = 1) {

    //controla que haya seleccionado al menos un filtro
    const departamentoSelect = document.getElementById("department");
    const localizacionSelect = document.getElementById("location");
    const busquedaInput = document.getElementById("search");

    // Remover clases de error antes de validar
    departamentoSelect.classList.remove("error", "red-bg");
    localizacionSelect.classList.remove("error", "red-bg");
    busquedaInput.classList.remove("error", "red-bg");

    // Valido si hay al menos un filtro seleccionado
    const ningunoSeleccionado = 
        (deptosSeleccion === "99" || !deptosSeleccion) &&
        !localSeleccion &&
        !busquedaInput.value;

    //Si no hay filtros seleccionados, hacer vibrar todos los filtros
    if (ningunoSeleccionado) {
        vibrarFiltros([departamentoSelect, localizacionSelect, busquedaInput]);
        swal("Error", "Por favor, selecciona al menos un filtro.", "error");
        return;
    }
  document.querySelector(".loader").style.display = "flex";
  let url = filtro(); //Obtengo la URL filtrada

  try {
      const respuesta = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
      });
      
      const datos = await respuesta.json();
      document.querySelector(".loader").style.display = "none"; // Oculto el loader

      const galeria = document.getElementById("gallery");
      galeria.innerHTML = ""; // Limpio resultados anteriores

      // Muestro un mensaje si no hay resultados
      if (datos.length === 0) {
          const mensaje = document.createElement("p");
          mensaje.textContent = "No se encontraron resultados.";
          galeria.appendChild(mensaje);
          btnPaginacion(0); // Oculto botones si no hay resultados
          return;
      }

      listaObjetos = datos; 
      console.log("Total de objetos encontrados:", listaObjetos.length); 

      const objetosValidos = listaObjetos.filter(esObjetoValido);
      
      console.log("Total de objetos válidos:", objetosValidos.length);
      
      const totalResultados = objetosValidos.length; // Total de resultados válidos
      const totalPaginas = Math.ceil(totalResultados / resultadosPorPagina); // Total de páginas
      
      console.log("Total de páginas calculadas:", totalPaginas); 

      // Determino el slice con base en la página actual
      const inicioSlice = (paginaActual - 1) * resultadosPorPagina;

      // Asegúrate de que no excedas el número total de objetos
      const slicedDatos = objetosValidos.slice(inicioSlice, inicioSlice + resultadosPorPagina);

      console.log("Objetos a mostrar en esta página:", slicedDatos.length); 

      //Verifico si hay suficientes objetos válidos para mostrar
      if (slicedDatos.length === 0) {
          const mensaje = document.createElement("p");
          mensaje.textContent = "No hay suficientes objetos válidos para mostrar.";
          galeria.appendChild(mensaje);
          return;
      }

      //Creo tarjetas para cada resultado válido
      slicedDatos.forEach(element => crearCards(element));

      //acá actualiza el texto de paginación
      const paginaTexto = document.getElementById('paginaTexto');
      paginaTexto.innerText = `Página ${paginaActual} de ${totalPaginas}`;
      paginaTexto.style.display = totalPaginas > 0 ? "block" : "none"; 

      btnPaginacion(paginaActual, totalPaginas); 

  } catch (error) {
      console.error("Error al buscar:", error);
      document.querySelector(".loader").style.display = "none";
  }
}


// ====================== Función para crear cartas ======================
function crearCards(objeto) {
    let galeria = document.getElementById("gallery");

    let carta = document.createElement("div");
    carta.classList.add("carta");

    let imagen = document.createElement("img");
    imagen.src =
      objeto.primaryImageSmall !== ""
      ? objeto.primaryImageSmall
      : "/images/sin_imagen.png";
    
    carta.appendChild(imagen);

    let infoContainer = document.createElement("div");
    infoContainer.classList.add("info-container");

    let titulo = document.createElement("h3");
    titulo.innerText = objeto.title || "Título no disponible";
    
    infoContainer.appendChild(titulo);

    let dinastia = document.createElement("h4");
    dinastia.innerText =
      objeto.dynasty ? `Dinastía: ${objeto.dynasty}` : "Dinastía no disponible";
    
    infoContainer.appendChild(dinastia);

    let cultura = document.createElement("h4");
    cultura.innerText =
      objeto.culture ? `Cultura: ${objeto.culture}` : "Cultura no disponible";
    
    infoContainer.appendChild(cultura);

    carta.appendChild(infoContainer);

   if (objeto.additionalImages && objeto.additionalImages.length > 0) {
      let boton = document.createElement("button");
      boton.innerHTML = "Ver imágenes extras";
      boton.classList.add("ver-imagenes-btn");
      boton.onclick = () =>
          window.open(`imagenExtra?objectId=${objeto.objectID}`, "_blank");
      carta.appendChild(boton);
   }

   carta.title =
      objeto.objectDate !== ""
          ? "Creación: " + objeto.objectDate
          : "Creación: le faltan datos a la API";

   galeria.appendChild(carta);
}

// ====================== Función para paginar ======================
const btnPaginacion = (paginaActual, totalPaginas) => {
  const btnAnterior = document.getElementById('btnAnterior');
  const btnSiguiente = document.getElementById('btnSiguiente');

  btnAnterior.style.display =
      paginaActual === 1 ? "none" : "block"; 

  btnSiguiente.style.display =
      listaObjetos.slice((paginaActual - 1) * resultadosPorPagina, paginaActual * resultadosPorPagina).length === resultadosPorPagina &&
      paginaActual < totalPaginas ? "block" : "none"; 

  btnAnterior.onclick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
      buscar(paginaActual - 1); //
  };

  btnSiguiente.onclick = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
      buscar(paginaActual + 1); 
  };
  
  
  const paginaTexto = document.getElementById('paginaTexto');
  paginaTexto.innerText = `Página ${paginaActual} de ${totalPaginas}`;
};

document.addEventListener('DOMContentLoaded', selectDepartamentos);