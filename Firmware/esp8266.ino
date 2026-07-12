/****************************************************
 ESP8266 — Control de aforo (2 puertas, sensores FC-51)
 Publica aforo por MQTT: aforo/{sitio_id}/aforo
 Recibe alarma y setear desde el backend
 Edita la sección CONFIGURACIÓN antes de subir.
****************************************************/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>

//-------------------- CONFIGURACIÓN (editar antes de subir) -----------------
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";

// IP de tu PC en la red WiFi (cmd → ipconfig → IPv4). No uses "localhost".
const char* MQTT_SERVER = "192.168.1.100";

// Debe coincidir con la tabla sitios en PostgreSQL
const int SITIO_ID = 1;
const char* CLIENT_ID = "esp8266-sitio-1";
//------------------------------------------------------------------------------

// Topics MQTT dinámicos según SITIO_ID
char topicAforo[32];
char topicAlarma[32];
char topicSetear[32];

WiFiClient espClient;
PubSubClient client(espClient);

// Pines de sensores infrarrojos FC-51 (LOW = obstáculo detectado)
#define P1_A 5   // Puerta 1 — sensor entrada
#define P1_B 4   // Puerta 1 — sensor salida
#define P2_A 14  // Puerta 2 — sensor entrada
#define P2_B 12  // Puerta 2 — sensor salida
#define BUZZER 13

int aforo = 0;         // Contador local (sensores)
int aforo_actual = 0;  // Último valor publicado por MQTT
const unsigned long TIMEOUT = 8000; // ms sin completar secuencia → reset estado

// Máquina de estados por puerta: detecta paso A→B (ingreso) o B→A (salida)
enum Estado { IDLE, A_FIRST, B_FIRST, BOTH_FROM_A, BOTH_FROM_B };

struct Puerta {
  byte pinA;
  byte pinB;
  Estado estado;
  unsigned long tiempo;
};

Puerta puerta1 = {P1_A, P1_B, IDLE, 0};
Puerta puerta2 = {P2_A, P2_B, IDLE, 0};

// Buzzer no bloqueante: se apaga en loop() tras BUZZER_DURACION
bool buzzerActivo = false;
unsigned long buzzerInicio = 0;
const unsigned long BUZZER_DURACION = 2000;

// Construye strings de topics: aforo/1/aforo, aforo/1/alarma, etc.
void construirTopics() {
  snprintf(topicAforo, sizeof(topicAforo), "aforo/%d/aforo", SITIO_ID);
  snprintf(topicAlarma, sizeof(topicAlarma), "aforo/%d/alarma", SITIO_ID);
  snprintf(topicSetear, sizeof(topicSetear), "aforo/%d/setear", SITIO_ID);
}

bool sensorA(Puerta &p) {
  return digitalRead(p.pinA) == LOW;
}

bool sensorB(Puerta &p) {
  return digitalRead(p.pinB) == LOW;
}

// Lógica de conteo por puerta: secuencia de dos sensores = un cruce
void procesarPuerta(Puerta &p) {
  bool A = sensorA(p);
  bool B = sensorB(p);

  switch (p.estado) {
    case IDLE:
      if (A && !B) { p.estado = A_FIRST; p.tiempo = millis(); }
      else if (B && !A) { p.estado = B_FIRST; p.tiempo = millis(); }
      break;

    case A_FIRST:
      if (A && B) p.estado = BOTH_FROM_A;
      else if (!A) p.estado = IDLE;
      break;

    case B_FIRST:
      if (A && B) p.estado = BOTH_FROM_B;
      else if (!B) p.estado = IDLE;
      break;

    case BOTH_FROM_A:
      // Pasó por A y luego B → ingreso
      if (!A && !B) {
        aforo++;
        Serial.print("Ingreso   Aforo = ");
        Serial.println(aforo);
        p.estado = IDLE;
      }
      break;

    case BOTH_FROM_B:
      // Pasó por B y luego A → salida
      if (!A && !B) {
        if (aforo > 0) aforo--;
        Serial.print("Salida    Aforo = ");
        Serial.println(aforo);
        p.estado = IDLE;
      }
      break;
  }

  // Timeout: abandonar secuencia incompleta
  if (p.estado != IDLE && millis() - p.tiempo > TIMEOUT) {
    if (!A || !B) p.estado = IDLE;
  }
}

// Mensajes MQTT entrantes: alarma (buzzer) o setear aforo manual
void callback(char* topic, byte* payload, unsigned int length) {
  String canal = String(topic);

  if (canal == topicAlarma) {
    digitalWrite(BUZZER, HIGH);
    buzzerActivo = true;
    buzzerInicio = millis();
  }

  if (canal == topicSetear) {
    char buf[16];
    unsigned int len = min(length, (unsigned int)(sizeof(buf) - 1));
    memcpy(buf, payload, len);
    buf[len] = '\0';
    aforo_actual = atoi(buf);
    aforo = aforo_actual;
    client.publish(topicAforo, String(aforo).c_str());
  }
}

// Reconexión MQTT con reintento cada 5 s
void reconnect() {
  while (!client.connected()) {
    Serial.print("Conectando MQTT...");

    if (client.connect(CLIENT_ID)) {
      Serial.println("Conectado");
      client.subscribe(topicAlarma);
      client.subscribe(topicSetear);
    } else {
      Serial.print("Error MQTT: ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  construirTopics();

  pinMode(P1_A, INPUT_PULLUP);
  pinMode(P1_B, INPUT_PULLUP);
  pinMode(P2_A, INPUT_PULLUP);
  pinMode(P2_B, INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(BUZZER, LOW);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP ESP8266: ");
  Serial.println(WiFi.localIP());
  Serial.print("Sitio ID: ");
  Serial.println(SITIO_ID);
  Serial.print("MQTT: ");
  Serial.println(MQTT_SERVER);

  client.setServer(MQTT_SERVER, 1883);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  procesarPuerta(puerta1);
  procesarPuerta(puerta2);

  // Apagar buzzer sin bloquear el loop (no usar delay largo)
  if (buzzerActivo && millis() - buzzerInicio >= BUZZER_DURACION) {
    digitalWrite(BUZZER, LOW);
    buzzerActivo = false;
  }

  // Publicar solo cuando el aforo local cambia
  if (aforo_actual != aforo) {
    aforo_actual = aforo;
    client.publish(topicAforo, String(aforo_actual).c_str());
  }
}
