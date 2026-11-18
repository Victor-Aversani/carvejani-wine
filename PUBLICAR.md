# Publicação da Carvejani Wine

## Arquitetura e custo

O GitHub armazena o código. A hospedagem precisa executar um **Web Service Node.js 24**, e não um site estático do GitHub Pages. O checkout permanece demonstrativo.

A configuração pretendida usa um Web Service **Free** do Render e o projeto Supabase Free já existente, sem criar outro banco ou disco pago. Os planos têm cotas e não são uma promessa de gratuidade ilimitada. Não ative upgrades, discos, serviços extras ou gastos excedentes sem revisar os valores.

No Render Free o serviço pode hibernar após 15 minutos sem tráfego e levar cerca de um minuto para voltar. As sessões criptografadas, limites e uso de callbacks ficam no Supabase, para não depender do disco temporário do Render. Fotos e perfis continuam no Supabase com acesso por usuário.

## Código e comandos

Envie esta pasta como raiz de um repositório próprio. Nunca envie `.env`, `data/`, tokens, senhas ou capturas da conta do cliente. O `.gitignore` já exclui os arquivos privados.

- Tipo: Web Service
- Runtime: Node
- Plano: Free
- Branch: main
- Build: `node --test tests/*.test.mjs`
- Start: `node server.mjs`
- Health check: `/healthz`
- Região: escolher ao criar o serviço; não existe região de São Paulo no catálogo atual de Web Services do Render.

## Variáveis privadas do serviço

Configure pelo painel ou pela integração oficial do Render, nunca pelo código público:

| Variável | Valor |
| --- | --- |
| NODE_ENV | production |
| HOST | 0.0.0.0 |
| SESSION_STORE | supabase |
| SUPABASE_URL | URL do projeto existente |
| SUPABASE_PUBLISHABLE_KEY | Chave publicável do projeto |
| SUPABASE_SECRET_KEY | Chave `sb_secret_…`, obtida diretamente do painel Supabase e inserida no campo privado do Render |
| SESSION_ENCRYPTION_KEY | 32 bytes aleatórios em hexadecimal, preservados entre implantações |

O servidor usa `RENDER_EXTERNAL_URL` automaticamente para a origem pública. `APP_ORIGIN` permite substituí-la quando houver domínio próprio; deve ser uma origem HTTPS sem barra final. Não defina `APP_ORIGIN=http://localhost:3000` na hospedagem.

O `PORT` é fornecido pelo Render. A chave secreta só é usada pelo módulo do servidor para as tabelas `carvejani_server_*`. Consultas de perfil e fotos continuam usando o token do cliente e suas regras RLS. Tabelas de sessões não concedem acesso a anon nem authenticated; RPCs de limites/uso único são restritas a service_role. Nunca coloque a chave secreta no navegador, no repositório ou no chat.

A referência SQL está em `supabase/server-store.sql`. Ela já foi aplicada ao projeto atual; não reaplique os comandos CREATE no mesmo projeto.

## Após obter o endereço público

1. Configure o Site URL e os redirecionamentos exatos em Supabase → Authentication → URL Configuration.
2. Configure o serviço de envio de e-mails e teste o remetente. O envio padrão do Supabase tem restrições e não substitui um remetente de produção.
3. Confirme `/healthz` e teste o catálogo no celular.
4. Faça login, envie/remova foto, saia e confirme o bloqueio das páginas privadas.
5. Teste cadastro/confirmação e recuperação/redefinição usando os e-mails reais no endereço publicado. Verifique também links expirados/reutilizados.
6. Verifique que uma sessão com “Manter conectado” continua válida após uma reimplantação do servidor, sem alterar a chave de criptografia.

## Estado atual

Arquivos preparados; a publicação não foi concluída. Faltam o repositório dedicado, o serviço Render, sua configuração privada e os testes no endereço público. Cadastro, confirmação, recuperação, login e logout já tiveram testes reais locais; isso não comprova esses fluxos na hospedagem.

Referências: https://render.com/docs/free · https://render.com/docs/web-services · https://supabase.com/docs/guides/getting-started/api-keys
