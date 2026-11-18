# E-mails Carvejani Wine — identidade visual

Modelos preparados em 18/11/2026. A alteração é visual: cores vinho/off-white/dourado, tipografia Georgia/Arial, banner com fotografia real, botão em destaque e leiaute fluido para celular.

- Confirm sign up: `confirm-email.html`
- Reset password: `recover-password.html`
- Assuntos sugeridos: “Confirme seu e-mail | Carvejani Wine” e “Redefina sua senha | Carvejani Wine”.

## Links e comportamento

Os dois modelos preservam `{{ .ConfirmationURL }}`, a variável usada atualmente nos e-mails deste projeto. Não mudam as rotas, senhas, validação de tokens ou sessões da loja. `{{ .SiteURL }}` é usado no link da marca. Não há campos de senha, scripts, rastreamento ou ofertas promocionais nos e-mails.

As prévias locais substituem os links por uma página de login apenas para mostrar o visual. Elas não são e-mails reais de confirmação e seus botões não confirmam contas.

## Fotografia

Foto original: Casillero del Diablo, Merlot, Chile, 2017, por Brett Jordan, distribuída sob CC BY 2.0. Crédito e licença constam no rodapé dos dois modelos.

- Fonte: https://commons.wikimedia.org/wiki/File:Casillero_del_Diablo,_Merlot,_Chile,_2017.jpg
- Licença: https://creativecommons.org/licenses/by/2.0/
- Arquivo público já existente no repositório: `public/assets/wine-2.jpg`.

O banner usa a foto original em uma composição HTML, sem gerar ou alterar rótulos. A URL HTTPS da imagem é pública e não contém dados do destinatário. Se o repositório for tornado privado ou o arquivo removido, será necessário hospedar essa imagem em outro endereço público e atualizar os modelos.

## Estado no Supabase

**Ainda não aplicado.** O painel deste projeto Free mostra “Set up custom SMTP to edit templates” e deixa Source/Save desabilitados. Com o envio padrão do Supabase, os modelos padrão continuam ativos. Nenhuma configuração de autenticação ou envio foi alterada.

Projetos Free novos podem personalizar modelos após configurar SMTP próprio. Não foi contratado plano Pro, domínio ou serviço de envio.

Uma opção para testes sem domínio próprio é uma conta Gmail elegível para SMTP com senha de app e verificação em duas etapas. A conta e a credencial devem ser configuradas pelo proprietário, diretamente nos painéis privados; nunca devem ser enviadas ao chat ou ao GitHub. Gmail possui cotas e não foi apresentado como infraestrutura de envio para uma loja em produção.

## Aplicar quando houver SMTP configurado e validado

1. Em Authentication → Emails → Confirm sign up, usar o assunto sugerido e copiar o HTML de `confirm-email.html` para Source.
2. Em Reset password, usar o assunto sugerido e o HTML de `recover-password.html`.
3. Conferir a prévia e salvar cada modelo.
4. Enviar um teste real para o endereço autorizado. Conferir a imagem, o botão e o retorno ao site. Não compartilhar o link de recuperação nem códigos.

## Verificação realizada

- Prévia HTML de confirmação e recuperação revisada em navegador no computador e em largura móvel de 390 px.
- Foto HTTPS respondeu 200 e foi exibida nas duas prévias.
- Links dinâmicos mantêm `ConfirmationURL`, sem token de teste real ou troca do fluxo de autenticação.
- Envio real e aparência no Gmail/Outlook ainda pendentes, pois o SMTP não foi configurado.

Referências: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier · https://supabase.com/docs/guides/auth/auth-email-templates · https://supabase.com/docs/guides/auth/auth-smtp · https://support.google.com/accounts/answer/185833
