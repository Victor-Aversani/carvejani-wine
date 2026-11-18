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
- Original no repositório: `public/assets/wine-2.jpg`.
- Imagem usada nos e-mails: https://crlvjmsvyuvnsdpkwkpm.supabase.co/storage/v1/object/public/brand-assets/casillero-merlot-email-v1.jpg

O banner usa a foto original em uma composição HTML, sem gerar ou alterar rótulos. Após um teste real em que a imagem do GitHub não apareceu no Gmail, a foto foi copiada sem alterações para o bucket público brand-assets no Supabase. O download anônimo respondeu 200 como image/jpeg e seu hash correspondeu ao original. O bucket aceita somente JPEG de até 1 MB. O bucket customer-avatars continua privado. A URL da foto não contém dados do destinatário.

## Estado no Supabase

**Aplicado em 18/11/2026.** O proprietário cadastrou a credencial privada de SMTP da conta Gmail dedicada diretamente no Supabase. Foram salvos e conferidos os assuntos e os dois modelos HTML, com seus links ConfirmationURL preservados. A personalização permaneceu no plano Free, sem contratar Pro ou domínio.

Projetos Free novos podem personalizar modelos após configurar SMTP próprio. Não foi contratado plano Pro, domínio ou serviço de envio.

Para este teste foi usada uma conta Gmail dedicada, cadastrada pelo proprietário. A credencial foi preenchida diretamente no painel privado; não foi recebida no chat nem incluída no GitHub. Gmail possui cotas e não foi apresentado como infraestrutura de envio para uma loja em produção.

## Reaplicar os modelos

1. Em Authentication → Emails → Confirm sign up, usar o assunto sugerido e copiar o HTML de `confirm-email.html` para Source.
2. Em Reset password, usar o assunto sugerido e o HTML de `recover-password.html`.
3. Conferir a prévia e salvar cada modelo.
4. Enviar um teste real para o endereço autorizado. Conferir a imagem, o botão e o retorno ao site. Não compartilhar o link de recuperação nem códigos.

## Verificação realizada

- Prévia HTML de confirmação e recuperação revisada em navegador no computador e em largura móvel de 390 px.
- Foto HTTPS respondeu 200 e foi exibida nas duas prévias.
- Links dinâmicos mantêm `ConfirmationURL`, sem token de teste real ou troca do fluxo de autenticação.
- SMTP próprio habilitado e modelos salvos no painel. O primeiro envio retornou erro SMTP 535; o proprietário substituiu a credencial diretamente no painel por uma senha de app. O novo teste direto na API Auth retornou HTTP 200 em 18/11/2026, sem o erro de autenticação SMTP. O destinatário confirmou recebimento; após a troca da hospedagem da foto, confirmou também que a imagem apareceu na mensagem mais recente.

Referências: https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier · https://supabase.com/docs/guides/auth/auth-email-templates · https://supabase.com/docs/guides/auth/auth-smtp · https://support.google.com/accounts/answer/185833
