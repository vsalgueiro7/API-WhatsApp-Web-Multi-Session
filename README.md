# API-WhatsApp-Web-Multi-Session

Este projeto é uma API que permite acessar o WhatsApp Web simultaneamente em várias sessões. Ela oferece a capacidade de enviar e receber mensagens de texto, áudio e vídeo para múltiplos usuários, permitindo que seja hospedada em um servidor e fornecida a vários sistemas ao mesmo tempo. Com sua estrutura simplificada e organizada, essa API é fácil de usar e proporciona uma rápida entrega de mensagens, além de ser uma excelente opção para a construção de chatbots.

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

* É necessário fornecer o seu idCliente (string) e urlWebHook (string) para retorno do QrCode e informações.
* Para uma melhor gestão, o idCliente deve ser o número de telefone selecionado no QrCode, no formato 55+DD+numero.
* A urlWebHook deve estar preparada para receber 4 parâmetros (meId (string), qrCode (string), status (string), msg (objeto)).
* Ao requisitar a rota /start, serão retornados o meId e o qrCode, até 5 vezes ou até que seja lido com o aplicativo do WhatsApp. .
* Ao ler o QrCode, será enviado novamente para a urlWebHook os status LOADING, CONNECTED e DISCONNECTED.
* LOADING : Ocorre logo após a leitura do QrCode.
* CONNECTED : Quando estiver totalmente conectado ao WhatsApp Web.
* DISCONNECTED : Quando desconectado pelo telefone ou quando acontece algo inesperado no servidor.


	
**Rota /send**

* Campos Padrões 
    - idCliente(string), urlWebHook(string), number(string), type(string); (idCliente e urlWebHook deve-se enviar os mesmo iniciado na rota /start)
    - type : string ('Text' || 'Media' || Location' || Buttons)
* type == 'Text 
    - message: string
* type == Media
    - fileUrl: string ('jpg', 'jpeg', 'png', 'pdf', 'mp3', 'mp4', 'mpeg')
    - fileName: string (opcional )
* type == Location
    - latitue: number
    - longitude: number
* type == Buttons
    - title: string
    - message: string 
    - footer: string (opcional)
    - buttonsArray : array de objeto 
        - [{body: "string"}, {body: "string"}]

* quotedMessageSerialized utilizado quando mensionar alguma mensagem ( enviado pelo campo '_serialized' no recebimento de mensagem );

**Recebimento de mensagens**

* Ao dispara mensagem pela rota /send ou ser notificado na sua urlWebHook o objeto **msg** será enviado, com a seguinte estrutura.
- type : string ('chat' || 'image' ||  "audio" || "ptt" || "video" || "document" || location' || buttons || buttons_response)
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
* type == 'buttons'
    - body: string ( texto da pergunta )
    - titulo: string ( titulo da pergunta )
    - footer: string ( footer da pergunta )
    - dynamicReplyButtons: array ( array de objeto de botoes )
* type == 'buttons_response'
    - body: string ( o texto do botão clicado )
   


#### ⌨️ Desenvolvido por Vitor Salgueiro 