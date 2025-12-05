import { Router } from "express";

const router = Router();

// Rotas para onde o Mercado Pago redireciona o usuário
router.get("/success", (req, res) => {
  // Aqui você pode renderizar uma página HTML ou redirecionar para o front-end React/Next
  // Exemplo de redirecionamento para front:
  // return res.redirect(`${process.env.FRONTEND_URL}/sucesso`);
  
  return res.status(200).send(`
    <h1>Pagamento Aprovado! ✅</h1>
    <p>Seu pedido está sendo processado.</p>
    <pre>${JSON.stringify(req.query, null, 2)}</pre>
  `);
});

router.get("/failure", (req, res) => {
  return res.status(200).send(`
    <h1>Pagamento Falhou ❌</h1>
    <p>Tente novamente.</p>
  `);
});

router.get("/pending", (req, res) => {
  return res.status(200).send(`
    <h1>Pagamento Pendente ⏳</h1>
    <p>Aguardando confirmação.</p>
  `);
});

export { router as paymentRoutes };