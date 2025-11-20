const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
    getConfiguracoes,
    updatePadroesUtilizados,
} = require("../controllers/configuracoesController");

// Rotas protegidas por autenticação
router.get("/", protect, getConfiguracoes);
router.put("/padroes", protect, updatePadroesUtilizados);

module.exports = router;
