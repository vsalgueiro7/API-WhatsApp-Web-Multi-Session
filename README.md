# API-WhatsApp-Web-Multi-Session

Este projeto é uma API para acessar o WhatsApp Web simultaneamente em várias sessões.
Ele permite enviar e receber mensagens de texto, audio e video, além de fornecer informações sobre notificações e status de conexão.

# Requerimentos

* Node.js >= v18.12.1
* Navegador compatível com WhatsApp Web

# Instalação

Clone o repositório
Execute o comando npm install para instalar as dependências
Inicie o aplicativo com o comando npm start
Api de simples uso com duas rotas /start e /send.

# Uso
A API estará disponível em http://localhost:3333/. 
É possível criar várias sessões simultâneas, basta seguir as orientações para autenticação.

Rota /start  
* Enviar o seu IdCliente(string) e UrlWebHook(string) para retorno do QrCode e informações.
* Ao ler o QrCode enviado para sua url web hook, deve-se preparar o sistema para receber 3 Parametros de Status LOADING, CONNECTED e DISCONNECTED.
* LOADING : Ocorre logo após a leitura do QrCode.
* CONNECTED : Quando estiver totalmente conectado ao WhatsApp Web.
* DISCONNECTED : Quando desconectado pelo telefone ou quando acontece algo inesperado no servidor.
	
Rota /send
* Enviar IdCliente(string), UrlWebHook(string), Number(string), Message(string), FileUrl(string) e FileNamePdf(string)
* IdCliente e UrlWebHook deve-se enviar os mesmo iniciado caso não enviado o mesmo retornar erro 500
* Number é o numero para quem será enviado a mensagem, Message é a mensagem texto.
* FileUrl é opcional, é a url do arquivo img,pdf,audio e video no formato ('jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4', 'mpeg');
* FileNamePdf é opcional, é um texto referenciando o nome de um arquivo PDF.
	
# Nota
Este projeto é apenas para fins educacionais e não deve ser utilizado para violar os termos de serviço do WhatsApp.
O desenvolvimento e uso deste projeto é de responsabilidade exclusiva do usuário.