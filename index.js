const fs = require("fs");
const path = require("path");

const slugify = require("slugify");

const express = require("express");
const cors = require("cors");
const app = express();

const multer = require("multer");
const upload = multer();

app.use(cors({
    // origin: 'http://localhost:3000',
    // optionsSuccessStatus: 200,
    // credentials: true,
}));
app.use("/static", express.static("public"));

app.get("/api/recipes", (req, res) => {
  setTimeout(() => {
    res.sendFile(path.join(__dirname, "store", "recipes.json"));
  }, 500);
});

app.get("/api/recipes/:recipeSlug", async (req, res) => {
  const file = await readFile("store/recipes.json").catch(console.log);

  const itemBySlug = JSON.parse(file).find((recipe) => recipe.slug === req.params.recipeSlug);
  if (!itemBySlug) {
    res.send({ error: "not found" });
  }
  setTimeout(() => {
    res.send(itemBySlug);
  }, 500);
});

app.post("/api/recipes", upload.single("image"), async (req, res) => {
  let created = {};
  if (req.file) {
    await writeFile(`/public/images/${req.file.originalname}`, req.file.buffer);
    created.imageURL = req.file.originalname;
  }

  const file = await readFile("store/recipes.json").catch(console.log);
  const recipes = JSON.parse(file);
  const newItem = {
    id: uuidv4(),
    name: req.body.name,
    slug: slugify(req.body.name.toLowerCase()),
    ingredients: JSON.parse(req.body.ingredients),
    steps: JSON.parse(req.body.steps),
    ...created,
  };
  recipes.push(newItem);
  await writeFile("store/recipes.json", JSON.stringify(recipes));
  res.send(newItem);
});

app.put("/api/recipes/:id", upload.single("image"), async (req, res) => {
  const file = await readFile("store/recipes.json").catch(console.log);
  const recipes = JSON.parse(file);
  const i = recipes.findIndex((recipe) => recipe.id === req.params.id);
  if (i === -1) {
    res.send({ error: "not found" });
    return;
  }

  const updated = {};
  if (req.file) {
    await writeFile(`/public/images/${req.file.originalname}`, req.file.buffer);
    updated.imageURL = req.file.originalname;
  }

  recipes[i] = {
    id: recipes[i].id,
    name: req.body.name,
    slug: recipes[i].slug,
    ingredients: JSON.parse(req.body.ingredients),
    steps: JSON.parse(req.body.steps),
    imageURL: req.file ? req.file.originalname : recipes[i].imageURL,
  };

  await writeFile("store/recipes.json", JSON.stringify(recipes));
  res.send();
});

app.delete("/api/recipes/:id", async (req, res) => {
  const file = await readFile("store/recipes.json").catch(console.log);
  const recipes = JSON.parse(file);
  const i = recipes.findIndex((recipe) => recipe.id === req.params.id);
  if (i === -1) {
    res.send({ error: "not found" });
    return;
  }

  recipes.splice(i, 1);

  await writeFile("store/recipes.json", JSON.stringify(recipes));
  setTimeout(() => {
    res.send({ id: req.params.id });
  }, 500);
});

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

app.listen(9090, () => {
  console.log("Szerver aktív, http://localhost:9090-es porton");
});

function readFile(filePath) {
  return new Promise((res, rej) => {
    fs.readFile(path.join(__dirname, ...filePath.split("/")), (err, file) => {
      err ? rej(err) : res(file.toString());
    });
  });
}
function writeFile(filePath, content) {
  return new Promise((res, rej) => {
    fs.writeFile(path.join(__dirname, ...filePath.split("/")), content, (err) => {
      err ? rej(err) : res();
    });
  });
}
