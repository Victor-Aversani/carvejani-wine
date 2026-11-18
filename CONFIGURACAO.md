# Carvejani Wine — autenticação real

Esta é a nova versão com servidor. O HTML único anterior continua sendo apenas o catálogo de demonstração. Não é possível executar este backend dando dois cliques em um HTML.

## Estado da entrega

- Projeto Supabase: `crlvjmsvyuvnsdpkwkpm`, organização Carvejani Wine, região São Paulo. Criação cotada em US$ 0/mês; limites e cobrança futura dependem da conta e do uso.
- Cadastro, login, confirmação, recuperação, redefinição, perfil e logout implementados com chamadas reais ao Supabase.
- Tabela `customer_profiles` criada, com RLS e permissões por coluna. A chave pública não dá acesso anônimo aos perfis. Consultas de perfil e fotos usam o token do próprio usuário. O armazenamento remoto de sessões usa uma chave privada exclusivamente no servidor.
- Confirmação de e-mail habilitada no provedor, verificada pela API de configurações.
- Testes automatizados de segurança usam um provedor isolado de teste, sem modo de login simulado na aplicação.
- Cadastro, entrega/confirmacão do e-mail, recuperação, redefinição, login e logout tiveram testes reais locais. O usuário confirmou redefinição, acesso e novo bloqueio após sair. Ainda é necessário repetir os fluxos na hospedagem pública.

## Rodar no computador

Requer Node.js 24 ou superior, sem instalar pacotes npm. Dentro desta pasta:

```sh
node server.mjs
```

Acesse `http://localhost:3000`. A `.env` local já foi preparada neste computador e é excluída do ZIP. Em outra máquina, copie `.env.example` para `.env`, gere uma chave de sessão de 32 bytes (comando indicado no arquivo) e mantenha a chave fora do código público. Nunca use uma chave service_role no navegador.

## Configuração do Supabase e publicação

1. Em Authentication → URL Configuration, configure Site URL como `http://localhost:3000` durante o teste. Após publicar, substitua pelo endereço HTTPS da hospedagem (domínio próprio é opcional). Cadastre somente URLs de redirecionamento exatas; evite curingas em produção.
2. Opcional, recomendado para personalizar os e-mails: em Authentication → Email Templates → Confirm signup, copie o conteúdo de `supabase/confirm-email.html`.
3. Para usar os modelos personalizados: em Authentication → Email Templates → Reset password, copie `supabase/recover-password.html`. Estes modelos entregam o token_hash à aplicação, que o troca pelo backend somente depois do clique de confirmação. O retorno padrão do Supabase também é suportado: os tokens chegam no fragmento, são removidos imediatamente do endereço, enviados ao servidor e nunca persistidos no armazenamento do navegador. O servidor verifica o usuário e o par de tokens no provedor, limita a validade e registra o uso para rejeitar a repetição do callback.
4. Mantenha Confirm email habilitado. Configure a validade do OTP/link de e-mail para 1800 segundos e a política de senha com pelo menos 12 caracteres e maiúscula, minúscula e número. A política local já exige esses critérios; confirme também no provedor.
5. Configure SMTP próprio com remetente verificado, SPF/DKIM e dados do seu serviço de e-mail. Não envie senhas SMTP no chat. O envio padrão do Supabase é restrito, tem limites baixos e não substitui o serviço de e-mail da loja. Não foi contratado serviço pago.
6. Revise Authentication → Rate Limits e as notificações de mudança de senha. O servidor já limita tentativas por IP e por conta, com contadores persistentes. CAPTCHA adicional e proteção de borda são recomendados antes de abrir a loja ao público.

## Publicar

Consulte `PUBLICAR.md`. A versão preparada para Render usa Node.js 24, HTTPS e `SESSION_STORE=supabase`, com sessões criptografadas em tabelas acessíveis somente pelo servidor. Assim não requer volume pago para `data/`. Configure `HOST=0.0.0.0` e as variáveis privadas no painel da hospedagem. Publique a pasta inteira, não apenas `public/`.

APP_ORIGIN deve ser exatamente o endereço público HTTPS, sem barra final. Cookies em produção usam Secure, HttpOnly, SameSite=Strict e prefixo __Host-. Origin e cabeçalho dedicado protegem os POSTs contra CSRF. Sem CORS aberto.

O modo local `SESSION_STORE=sqlite` precisa de disco persistente e uma única instância. O modo `supabase` compartilha sessões, limites e uso único de callbacks entre reinícios do servidor. A implementação atual serializa a renovação de tokens dentro de uma instância: antes de usar várias réplicas, implemente também coordenação distribuída da renovação. Não confie em X-Forwarded-For enviado diretamente pelo cliente; a proteção de IP na borda precisa ser configurada conforme o proxy da plataforma.

## Sessões e senhas

Senhas são transitórias na requisição HTTPS e processadas pelo Supabase Auth; não são persistidas pelo servidor, navegador ou perfis. Tokens ficam criptografados com AES-256-GCM no armazenamento privado de sessões (SQLite local ou tabelas protegidas no Supabase); o cookie contém somente um identificador aleatório, cujo hash é salvo no servidor. Sem “Manter conectado”, cookie de sessão e limite de 12 horas; com a opção, até 30 dias. Sessões de recuperação duram no máximo 10 minutos e não acessam perfil ou checkout. Alterar/redefinir senha invalida todas as sessões da aplicação desse usuário e solicita revogação ao provedor. JWTs do Supabase já emitidos têm sua própria validade, por isso não são expostos ao navegador.

## Testes antes de considerar concluído

```sh
npm test
```

Depois, execute com e-mails reais:

1. Cadastro com confirmação diferente e senha fraca deve falhar; cadastro válido deve enviar e-mail e impedir login antes da confirmação.
2. Confirmar o link, tentar reutilizá-lo e testar um link expirado. Links expirados/reutilizados devem falhar.
3. Entrar, mostrar/ocultar senha e testar as duas persistências (incluindo reinício do servidor).
4. Testar dois clientes: cada um deve ver/alterar somente seu perfil, inclusive em chamadas diretas à API.
5. Solicitar recuperação para e-mail cadastrado e inexistente; respostas devem ser genéricas. Validar o e-mail recebido, redefinir, reutilizar o link e testar o prazo.
6. Alterar senha com senha atual errada/correta; verificar invalidação de sessões anteriores.
7. Acessar conta e checkout sem sessão, entrar e retornar à compra mantendo a sacola. Pagamento/frete/estoque continuam demonstrativos.
8. Sair e testar acesso com o cookie anterior; deve falhar.

Não considere confirmação, entrega de e-mail, recuperação ou login de produção aprovados somente porque os testes isolados passaram.

## Referências

- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/rate-limits
- https://supabase.com/docs/guides/database/postgres/row-level-security

## Foto de perfil

Bucket privado `customer-avatars`, com acesso limitado ao caminho `<auth.uid()>/avatar.jpg`. JPG/PNG/WebP de até10 MB no seletor são convertidos no navegador para JPEG até512px, com remoção dos metadados originais. Servidor valida JPEG, dimensões até1024px e limite de256KB; fotos não são públicas nem usam URLs permanentes assinadas. Upload e remoção exigem sessão e proteção de origem; foto e nome aparecem lado a lado. Execute a migração `supabase/avatars.sql` somente ao instalar em outro projeto; neste projeto ela já foi aplicada.
