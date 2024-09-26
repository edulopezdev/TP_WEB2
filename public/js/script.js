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
            mostrarAlerta("Error", "No se pudieron cargar los departamentos. Código de error: " + respuesta.status, "error");
        }
    } catch (error) {
        console.error("Error al obtener departamentos:", error);
        mostrarAlerta("Error", "La API se encuentra caída. Por favor, inténtalo de nuevo más tarde.", "error");
    }
};

// Función para mostrar la alerta
const mostrarAlerta = (titulo, texto, icono) => {
    swal({
        title: titulo,
        text: texto,
        icon: icono,
        buttons: false,
    });
};

selectDepartamentos();

// ====================== Manejo de selección de departamento ======================
let deptosSeleccion = "";
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
    if (dpt != "" && palabra && localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}&DepartmentId=${dpt}`;
    } else if (dpt != "" && localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*&DepartmentId=${dpt}`;
    } else if (dpt != "" && palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}&DepartmentId=${dpt}`;
    } else if (localizacion && palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=${palabra}`;
    } else if (dpt != "") {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=*&DepartmentId=${dpt}`;
    } else if (localizacion) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?geoLocation=${localizacion}&q=*`;
    } else if (palabra) {
        url = `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${palabra}`;
    }

    return url; 
}

// ====================== Función para validar objetos ======================
function esObjetoValido(objeto) {
    return objeto.primaryImageSmall !== ""; 
}

// ====================== Función para buscar y mostrar resultados ======================

// Función para hacer vibrar los filtros
function vibrarFiltros(filtros) {
    filtros.forEach(filtro => {
        filtro.classList.add("vibrar"); 
        setTimeout(() => {
            filtro.classList.remove("vibrar"); 
        }, 1000);
    });
}
async function buscar(paginaActual = 1) {

    //controlo que haya seleccionado al menos un filtro
    const departamentoSelect = document.getElementById("department");
    const localizacionSelect = document.getElementById("location");
    const busquedaInput = document.getElementById("search");

    if(busquedaInput.value == '*'){
        swal("Aviso", "No esta permitido ingresar ese caracter.", "warning");
        busquedaInput.value = '';
        return;
    }
    //vamos a validar si hay al menos un filtro seleccionado
    const ningunoSeleccionado = 
        (deptosSeleccion === "" || !deptosSeleccion) &&
        !localSeleccion &&
        !busquedaInput.value;

    //Si no hay filtros seleccionados, hacer vibrar todos los filtros
    if (ningunoSeleccionado) {
        vibrarFiltros([departamentoSelect, localizacionSelect, busquedaInput]);
        swal("Aviso", "Por favor, selecciona al menos un filtro.", "warning");
        return;
    }    
  document.querySelector(".loader").style.display = "flex";
  
  let url = filtro();

  try {
      const respuesta = await fetch("/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
      });
      
      const datos = await respuesta.json();
      document.querySelector(".loader").style.display = "none"; 
      const galeria = document.getElementById("gallery");
      galeria.innerHTML = ""; 

      //ahora muestro un mensaje si no hay resultados
      if (datos.length === 0) {

        const mensaje = document.createElement("p");
        mensaje.textContent = "No se encontraron resultados.";
        mensaje.classList.add("no-resultados");
        galeria.innerHTML = ""; 
        galeria.appendChild(mensaje);

        //ahora reinicio los filtros
        const departamentoSelect = document.getElementById("department");
        const localizacionSelect = document.getElementById("location");
        const busquedaInput = document.getElementById("search");
        
        departamentoSelect.selectedIndex = 0;
        localizacionSelect.selectedIndex = 0;
        busquedaInput.value = "";
        
        btnPaginacion(0);
        document.getElementById('btnAnterior').style.display = "none";
        document.getElementById('btnSiguiente').style.display = "none";
        return;
    }

      listaObjetos = datos; 

      const objetosValidos = listaObjetos.filter(esObjetoValido);
      const totalResultados = objetosValidos.length;
      const totalPaginas = Math.ceil(totalResultados / resultadosPorPagina);
      const inicioSlice = (paginaActual - 1) * resultadosPorPagina;
      const slicedDatos = objetosValidos.slice(inicioSlice, inicioSlice + resultadosPorPagina);

      if (slicedDatos.length === 0) {
          const mensaje = document.createElement("p");
          mensaje.textContent = "No hay suficientes objetos válidos para mostrar.";
          galeria.appendChild(mensaje);
          return;
      }
      
      slicedDatos.forEach(element => crearCards(element));

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

    //titulo
    let titulo = document.createElement("h3");
    titulo.innerText = objeto.title || "Título: No disponible";    
    infoContainer.appendChild(titulo);

    //cultura
    let cultura = document.createElement("h4");    cultura.innerText =
      objeto.culture ? `Cultura: ${objeto.culture}` : "Cultura: No disponible";    
    infoContainer.appendChild(cultura);

    //dinastia
    let dinastia = document.createElement("h4");    dinastia.innerText =
      objeto.dynasty ? `Dinastía: ${objeto.dynasty}` : "Dinastía: No disponible";    
    infoContainer.appendChild(dinastia);

    carta.appendChild(infoContainer);

   if (objeto.additionalImages && objeto.additionalImages.length > 0) {
      let boton = document.createElement("button");
      boton.innerHTML = "+ imágenes";
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
    const paginaTexto = document.getElementById('paginaTexto');
  
    
    btnAnterior.style.display = (paginaActual === 1 || totalPaginas === 0) ? "none" : "block";
  
    
    btnSiguiente.style.display = 
        listaObjetos.slice((paginaActual - 1) * resultadosPorPagina, paginaActual * resultadosPorPagina).length === resultadosPorPagina &&
        paginaActual < totalPaginas ? "block" : "none"; 
  
    
    btnAnterior.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        buscar(paginaActual - 1);
    };
  
    
    btnSiguiente.onclick = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        buscar(paginaActual + 1);
    };
  
    
    paginaTexto.innerText = totalPaginas > 0 ? `Página ${paginaActual} de ${totalPaginas}` : "";
  };
  

document.addEventListener('DOMContentLoaded', selectDepartamentos);