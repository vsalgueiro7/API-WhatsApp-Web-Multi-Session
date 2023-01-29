# API-WhatsApp-Web-Multi-Session

Este projeto é uma API para acessar o WhatsApp Web simultaneamente em várias sessões com base na biblioteca [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js/).
Ele permite enviar e receber mensagens de texto, audio e video para multiplos usuario na mesma api, assim podendo ser hospedada em um servidor e fornecer para varios sistemas ao mesmo tempo. 
Essa Api é simplificada e organizada de uma maneira facil de se utilizar para um fornecimento rapido de disparo de mensagem e até mesmo para construção de um chatbot.

### 📋 Pré-requisitos

* Node.js >= v18.12.1
* Navegador compatível com WhatsApp Web

### 🔧 Instalação

* Clone o repositório
* Execute o comando npm install para instalar as dependências
* Inicie o aplicativo com o comando npm start
* Api de simples uso com duas rotas /start e /send.

## 🚀 Começando

A API estará disponível em http://localhost:3333/. 
É possível criar várias sessões simultâneas, basta seguir as orientações para autenticação.

**Rota /start**  

* Enviar o seu idCliente(string) e urlWebHook(string) para retorno do QrCode e informações.
* Para melhor Gestão o idCliente deve ser o numero do telefone selecionado no QrCode no formato 55+DD+numero.
* Deve-se prepar a urlWebHook para receber 4 parametro (meId(string), qrCode(string), status(string), msg(objeto)).
* Ao requistar a rota /start será retornado meId e qrCode por até 5x ou até que leia-se com o aplicativo do whatsapp.
* Ao ler o QrCode será enviado novamente para sua urlWebHook os status (LOADING, CONNECTED e DISCONNECTED).
* LOADING : Ocorre logo após a leitura do QrCode.
* CONNECTED : Quando estiver totalmente conectado ao WhatsApp Web.
* DISCONNECTED : Quando desconectado pelo telefone ou quando acontece algo inesperado no servidor.


	
**Rota /send**

* Envios obrigatorio idCliente(string), urlWebHook(string), number(string), type(string);
* idCliente e urlWebHook deve-se enviar os mesmo iniciado caso não enviado o mesmo retornar erro de status 500
* type é o tipo de mensagem sendo eles ( Text, Media e Location);
* message é a mensagem texto (Obrigatorio caso o type = Text).
* fileUrl é a url do arquivo img,pdf,audio e video no formato ('jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4', 'mpeg') e (Obrigatorio caso o type = Media);
* fileName é opcional, é um texto referenciando o nome de um arquivo PDF.
* latitue e longitude de formato number (é obrigatorio caso o type = Location)
* quotedMessageSerialized utilizado quando mensionar alguma mensagem ( enviado pelo campo '_serialized' no recebimento de mensagem );

**Recebimento de mensagens**

* Ao dispara mensagem pela rota /send ou ser notificado na sua urlWebHook o objeto **msg** será enviado, com a seguinte estrutura.
- type : string ('chat' || 'image' ||  "audio" || "ptt" || "video" || "document" || location')
- formMe: boolean (true = enviado por você, false = enviado a você)
- notifyName: string ( nome do enviante)
- idMenssage: string ( id da mensagem)
- _serialized: string ( dados para serem enviado caso a mensagem seja mensionar )
- from: string ( numero de quem recebeu a mensagem)
- to: string ( numero de quem enviou a mensagem)
- dateMessage: number ( data e hora em formato Unix timestamp)
- hasQuotedMsg: boolean ( se é uma mensagem mensionada = true)
Abaixo o recebimento referente a cada type de mensagem 
* type == 'chat 
    - body: string ( mensagem em texto )
* type == 'image' ||  "audio" || "ptt" || "video" || "document"
    - body: string ( texto da mida caso haja)
    - mimetype: string (tipo de midia)
    - base64: string (midia enviada em base64)
    - filename: string ( nome do arquivo para document, caso haja)
* type == 'location'
    - body: string ( texto da mida caso haja)
    - latitude: string ( numero latitude com traço de menos (-) caso haja ex: -22.968916913119195)
    - longitude: string ( numero latitude com traço de menos (-) caso haja ex: -43.18458173013338)
    - description: string ( texto caso haja)



⌨️ Desenvolvido por Vitor Salgueiro 