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