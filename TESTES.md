# Relatório de validação — 17/11/2026

## Verificado

- Sintaxe dos scripts e testes automatizados do backend aprovados.
- Provedor isolado de teste: cookies HttpOnly/SameSite, manter conectado, logout e invalidação, CSRF por origem, senha inválida/confirmada, recuperação genérica, sessão de recovery sem acesso ao perfil/checkout, rejeição de reutilização do link, limites de tentativas.
- Supabase real: confirmação por e-mail habilitada; cadastro de teste aceito; conta registrada, inicialmente não confirmada e posteriormente confirmada por e-mail. O usuário confirmou o recebimento. Envio de recuperação registrado no Supabase.
- Supabase real: tabela com RLS, regras SELECT/UPDATE por auth.uid(), alteração do id não concedida; consulta autenticada como usuário não relacionado não revela o perfil.
- A função de cadastro teve sua execução pública restringida. A revisão atual dos avisos está descrita abaixo.
- Interface no navegador: cadastro com senhas diferentes bloqueado; área do cliente sem sessão bloqueada.

## Pendente — não validado como concluído

- Configurar e testar a expiração dos links reais no painel do Supabase. O usuário já confirmou retorno da recuperação, redefinição e login.
- Alteração de senha pela área do cliente e reutilização/expiração dos links reais. O usuário confirmou redefinição por e-mail, login e logout com novo bloqueio da área privada.
- Fluxo completo com dois clientes reais e persistência em reinício de navegador/servidor.
- HTTPS, hospedagem pública e SMTP próprio com remetente verificado.

O cadastro de teste usa senha aleatória transitória, que não foi salva. Para usar essa conta depois da configuração dos modelos, será necessário redefinir a senha pelo fluxo real de recuperação.

Nenhum teste isolado substitui esses testes reais. Pagamento, frete e estoque continuam demonstrativos.

## Foto e layout

Bucket privado customer-avatars e regras por usuário aplicados ao Supabase. Testes isolados aprovados para formato/tamanho da foto, upload com caminho derivado do usuário autenticado (ignorando IDs enviados pelo cliente), remoção e bloqueio sem sessão. Login revisado em tela móvel: botões e links com separação de pelo menos 24px no teste de 390px. Upload real verificado: uma foto privada gravada no Supabase e imagem carregada na área do cliente (384 × 512 pixels), ao lado do nome Victor. A sessão permaneceu válida após reinício do servidor local. Rechecagem em 390px: sem rolagem horizontal e intervalo de 25px após o botão Entrar.

Última revisão do Supabase apontou proteção contra senhas vazadas desabilitada. Revise esse recurso no painel conforme a disponibilidade do plano, sem contratar plano pago automaticamente. Não foram encontrados alertas nas políticas de perfil/foto.

## Preparação para hospedagem gratuita

- Testes automatizados aprovados após a adaptação assíncrona do servidor: autenticação, sessão de recuperação, logout, fotos, validação e proteção de origem.
- Novo teste de contrato com provedor isolado: sessão remota preservada entre duas instâncias sequenciais, cookie Secure/HttpOnly, tokens criptografados, ausência de senhas no armazenamento, limites/callbacks compartilhados, arquivos privados inacessíveis pela web e falha de armazenamento retornando 503 sem liberar acesso.
- Supabase real: funções de limite atômico e consumo único executadas como service_role em transação revertida. Primeiras tentativas permitidas, excedente negado, callback repetido/expirado negado.
- Supabase real: RLS habilitado nas três tabelas do servidor; anon e authenticated sem SELECT; service_role com acesso. As funções do servidor também não concedem execução a clientes.
- Security Advisors: três informações `RLS Enabled No Policy` são esperadas nas tabelas exclusivas do servidor, que deliberadamente não admitem clientes. Permanece o aviso sobre proteção contra senhas vazadas desabilitada: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- Pendente: chave secreta configurada diretamente no ambiente privado da hospedagem, teste HTTP real do armazenamento remoto, repositório, implantação Render Free e testes completos no endereço HTTPS publicado.

Os testes de reinício remotos usam um serviço isolado de teste; não foram descritos como implantação real concluída. Nenhum serviço Render foi criado nesta etapa.


## Publicação — 18/11/2026

Render Free: implantação live confirmada, com os testes automatizados aprovados durante o build. HTTPS e /healthz responderam 200. Catálogo de 150 rótulos e as 150 fotos JPEG carregaram sem falhas. Conta, status de recuperação e avatar sem sessão retornaram 401; arquivos privados retornaram 404; POST com origem externa foi bloqueado com 403. Login inválido passou pelo fluxo público e retornou 401. Configuração da URL dos e-mails e os fluxos com login/e-mail real no domínio publicado ainda aguardam validação.
