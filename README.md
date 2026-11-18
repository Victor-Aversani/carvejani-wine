# Carvejani Wine

E-commerce de vinhos em português brasileiro, com catálogo de 150 rótulos reais, fotos documentais, layout responsivo e autenticação Supabase.

**Demonstração:** preços, estoque, frete e pagamento não representam uma operação comercial. Nenhuma compra ou cobrança é processada.

Requer Node.js 24. Configure o ambiente privado seguindo `CONFIGURACAO.md` e `PUBLICAR.md`. Nunca envie `.env`, sessões ou chaves secretas ao repositório.

```sh
node setup.mjs
node server.mjs
```

Para verificar o backend:

```sh
node --test tests/*.test.mjs
```

As fontes e licenças das fotografias estão registradas no catálogo e na página de créditos da loja. Venda exclusiva para maiores de 18 anos quando a operação for habilitada. Beba com moderação.
