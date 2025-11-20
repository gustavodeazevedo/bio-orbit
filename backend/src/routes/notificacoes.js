const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
    getNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas,
    verificarVencimentos,
} = require("../controllers/notificacoesController");

// Rotas protegidas por autenticação
router.get("/", protect, getNotificacoes);
router.put("/marcar-todas-lidas", protect, marcarTodasComoLidas);
router.put("/:id/lida", protect, marcarComoLida);
router.post("/verificar-vencimentos", protect, verificarVencimentos);

module.exports = router;
