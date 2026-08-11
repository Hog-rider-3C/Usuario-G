# 🛡️ Segurança Escolar

Um sistema simples de monitoramento escolar criado para ajudar na segurança da escola utilizando sensores e inteligência artificial.

-------------------------------------------------------------------------------------------------------------------------------------------

# 🚀 O que o site possui?

✅ Tela inicial moderna
✅ Menu lateral interativo
✅ Modo escuro
✅ Sensor de movimento
✅ Detector de fumaça
✅ Assistente IA
✅ Interface simples e bonita

------------------------------------------------------------------------------------------------------------------------------------------

# 💻 Tecnologias usadas

* HTML
* CSS
* JavaScript
* GitHub

-----------------------------------------------------------------------------------------------------------------------------------------

# 🔥 Sensores do projeto:

🚶 Sensor de Movimento

Detecta movimentações no ambiente em tempo real.

💨 Detector de Fumaça

Detecta fumaça e gases no ambiente para aumentar a segurança.

------------------------------------------------------------------------------------------------------------------------------------------

# 🤖 Alexcio IA

Assistente virtual do sistema criado para responder perguntas sobre tecnologia.

------------------------------------------------------------------------------------------------------------------------------------------

# 🌙 Dark Mode

O sistema possui modo escuro para melhorar a experiência visual.

------------------------------------------------------------------------------------------------------------------------------------------

# 📸 Imagens do Projeto

Você pode adicionar prints do site aqui futuramente.

-----------------------------------------------------------------------------------------------------------------------------------------

# 📂 Arquivos do Projeto


monitor.html
login.html
register.html
style.css
chat-ia.js
auth.js
monitor.js
monitor-login.js
login.js
register.js


-----------------------------------------------------------------------------------------------------------------------------------------

# 👨‍💻 Desenvolvedores

Projeto desenvolvido por:

João Pedro Alves & João Gregoryo Lauriano

-----------------------------------------------------------------------------------------------------------------------------------------

# ⭐ GitHub

Se gostou do projeto:

⭐ Deixe uma estrela no repositório.

-----------------------------------------------------------------------------------------------------------------------------------------

# 🔌 Leitura do Sensor via USB (Web Serial API)

O site agora lê o sensor MQ-2 diretamente pela porta USB usando a **Web Serial API**, sem precisar de um servidor web.

## Como usar

1. Acesse o `monitor.html` usando **Chrome ou Edge** (via HTTPS ou `localhost`).
2. Vá até a seção **MQ-2**.
3. Clique em **"🔌 Conectar Sensor USB"**.
4. No seletor que aparecer, escolha a porta serial do seu Arduino/ESP.
5. O card do MQ-2 passará a mostrar os dados lidos da porta.

## Formato dos dados enviados pelo ESP8266

O ESP8266 deve enviar pela serial (`115200 baud`) linhas com **prefixo** para identificar cada sensor:

```
MQ2:valor|status
PIR:valor|status
```

**Exemplos:**
```
MQ2:120|OK
MQ2:185|ALERTA
PIR:1|OK
PIR:1|ALERTA
```

- `MQ2`: leitura do sensor de fumaça/gás (número, ex.: ppm).
- `PIR`: leitura do sensor de movimento (1 = detectou, 0 = livre).
- `status`: `OK` ou `ALERTA`.

## Exemplo de código no ESP8266

```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  int mq2 = analogRead(A0);      // leitura do MQ-2
  int pir = digitalRead(D1);     // leitura do PIR

  String mq2Status = (mq2 > 120) ? "ALERTA" : "OK";
  String pirStatus = (pir == HIGH) ? "ALERTA" : "OK";

  Serial.print("MQ2:");
  Serial.print(mq2);
  Serial.print("|");
  Serial.println(mq2Status);

  Serial.print("PIR:");
  Serial.print(pir);
  Serial.print("|");
  Serial.println(pirStatus);

  delay(1000);
}
```

## Observações

- A Web Serial API exige **HTTPS** ou **localhost** e um navegador **Chrome/Edge**.
- Se o navegador não suportar a API, o site tenta usar o endereço antigo `http://192.168.0.111/valor` como fallback.

-----------------------------------------------------------------------------------------------------------------------------------------

# ⭐ GitHub
