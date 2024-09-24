let deptos = '<option value="99" selected>Ninguna opción</option>';

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