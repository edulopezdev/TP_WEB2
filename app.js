const translate = require("node-google-translate-skidz");
const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// ====================== Configuración de Pug ======================
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); // Ubicación de los archivos Pug

// ====================== Middleware ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Para manejar JSON
app.use(express.static(path.join(__dirname, "public"))); // Archivos estáticos

// ====================== Ruta para la página principal ======================
app.get('/', (req, res) => {
  const objetos = []; // Aquí se pueden poblar datos
  res.render('index', { objetos });
});

// ====================== Ruta para imagenExtra ======================
app.get("/imagenExtra", async (req, res) => {
  const objectId = req.query.objectId; // Obtener el objectId de la consulta

  if (!objectId) {
    return res.status(400).send('Object ID no proporcionado');
  }

  try {
    const respuesta = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`);
    if (!respuesta.ok) {
      return res.status(404).send('Objeto no encontrado');
    }
    const objeto = await respuesta.json();
    
    // Renderiza la vista pasando el objeto
    res.render("imagenExtra", { objeto });
  } catch (error) {
    console.error('Error al obtener el objeto:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ====================== Ruta para manejar la búsqueda ======================
app.post("/", async (req, res) => {
  try {
    let url = req.body.url;
    console.log("URL recibida para la búsqueda:", url); 

    let ids = await traerIds(url);
    ids = ids.slice(0, Math.min(ids.length, 250)); // Limita la cantidad de IDs

    let objetos = await objetosPromise(ids);
    await traduccion(objetos); // Traduce los objetos

    // Verifica si hay resultados
    if (objetos.length === 0) {
      res.json([]); // Devuelve un arreglo vacío si no hay resultados
    } else {
      res.json(objetos); // Devuelve los objetos si hay resultados
    }
  } catch (error) {
    console.log('error: ', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ====================== Función de traducción ======================
async function traduccion(objetos) {
  for (const element of objetos) {
    const promises = [];

    // Traducción del título
    if (element.title) {
      let texto = element.title;
      promises.push(
        translate({
          text: texto,
          source: "en",
          target: "es",
        }).then((result) => {
          element.title = result.translation;
        })
      );
    }

    // Traducción de la dinastía
    if (element.dynasty) {
      let texto = element.dynasty;
      promises.push(
        translate({
          text: texto,
          source: "en",
          target: "es",
        }).then((result) => {
          element.dynasty = result.translation;
        })
      );
    }

    // Traducción de la cultura
    if (element.culture) {
      let texto = element.culture;
      promises.push(
        translate({
          text: texto,
          source: "en",
          target: "es",
        }).then((result) => {
          element.culture = result.translation;
        })
      );
    }

    // Espera todas las traducciones
    await Promise.all(promises);
  }
}

// ====================== Función para traer IDs ======================
async function traerIds(url) {
  console.log("URL a la API:", url);
  let idObj = []; // Inicializa como un arreglo vacío

  try {
    let respuesta = await fetch(url);
    console.log('Respuesta:', respuesta);

    if (respuesta.ok) {
      let datos = await respuesta.json();
      idObj = datos.objectIDs || []; // Asegúrate de que sea un arreglo
    } else {
      console.error('Error en la respuesta:', respuesta.status, respuesta.statusText);
      throw new Error('Error en la API');
    }
  } catch (error) {
    console.error('Error al traer IDs:', error);
    // Retorna un arreglo vacío en caso de error
  }

  return idObj; // Siempre devuelve un arreglo
}

// ====================== Maneja promesas en paralelo ======================
async function objetosPromise(ids) {
  if (ids.length > 0) {
    let promesas = ids.map(async (id) => {
      try {
        let respuesta = await fetch(
          `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`
        );
        if (!respuesta.ok) {
          return null;
        }

        let object = await respuesta.json();
        return object;
      } catch (error) {
        console.error('Error al obtener objeto:', error);
        return null;
      }
    });

    let resultados = await Promise.all(promesas);
    let objetos = resultados.filter((resultado) => resultado !== null);
    console.log('Resultados:', objetos); // Verifica aquí
    return objetos;
  } else {
    console.log("No se encontró ningún elemento");
    return []; // Retorna un array vacío si no hay IDs
  }
}

// ====================== Iniciar el servidor ======================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
