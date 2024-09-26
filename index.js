const translate = require("node-google-translate-skidz");
const express = require("express");
const path = require("path");
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const app = express();
const PORT = 3000;

// ====================== Configuración de Pug ======================
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views')); 

// ====================== Middleware ======================
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Para manejar JSON
app.use(express.static(path.join(__dirname, "public"))); 

// ====================== Ruta para la página principal ======================
app.get('/', (req, res) => {
  res.render('index', { objetos: [] });
});

// ====================== Ruta para imagenExtra ======================
app.get("/imagenExtra", async (req, res) => {
  const objectId = req.query.objectId; //acá btengo el objectId de la consulta

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
    ids = ids.slice(0, Math.min(ids.length, 250)); //cantidad limite de ids

    let objetos = await objetosPromise(ids);
    
    // Traduce los objetos en paralelo
    await Promise.all(objetos.map(async (objeto) => {
      await traduccion(objeto);
    }));

    // Verifica si hay resultados
    res.json(objetos.length === 0 ? [] : objetos); //Devuelvo un arreglo vacío si no hay resultados
  } catch (error) {
    console.log('Error: ', error);
    res.status(500).send('Error interno del servidor');
  }
});

// ====================== Función de traducción ======================
async function traduccion(objeto) {
  const translationPromises = [];
  
  if (objeto.title) {
    translationPromises.push(translateText(objeto.title).then(translated => objeto.title = translated));
  }
  
  if (objeto.dynasty) {
    translationPromises.push(translateText(objeto.dynasty).then(translated => objeto.dynasty = translated));
  }
  
  if (objeto.culture) {
    translationPromises.push(translateText(objeto.culture).then(translated => objeto.culture = translated));
  }

  await Promise.all(translationPromises); //Espero todas las traducciones
}

// Función auxiliar para traducir texto
async function translateText(text) {
  const result = await translate({ text, source: "en", target: "es" });
  return result.translation;
}

// ====================== Función para traer IDs ======================
async function traerIds(url) {
  console.log("URL a la API:", url);
  try {
    let respuesta = await fetch(url);
    
    if (!respuesta.ok) {
      console.error('Error en la respuesta:', respuesta.status, respuesta.statusText);
      throw new Error('Error en la API');
    }

    let datos = await respuesta.json();
    return datos.objectIDs || [];
  } catch (error) {
    console.error('Error al traer IDs:', error);
    return []; //Acá retorno un arreglo vacío en caso de error
  }
}

// ====================== Maneja promesas en paralelo ======================
async function objetosPromise(ids) {
  if (ids.length === 0) return []; //Retorno un array vacío si no hay IDs

  const promesas = ids.map(async (id) => {
    try {
      let respuesta = await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
      if (!respuesta.ok) return null;

      return await respuesta.json();
    } catch (error) {
      console.error('Error al obtener objeto:', error);
      return null;
    }
  });

  const resultados = await Promise.all(promesas);
  return resultados.filter((resultado) => resultado !== null); //Filtrado de resultados nulos
}

// ====================== Iniciar el servidor ======================
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});