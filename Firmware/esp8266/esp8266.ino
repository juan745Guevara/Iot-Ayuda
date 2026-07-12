/****************************************************
 ESP8266 — Control de aforo (2 puertas, FC-51)
 Multi-sitio · topics MQTT: aforo/{sitio_id}/...
 Configura WiFi y sitio en config.h antes de subir.
****************************************************/

#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include "config.h"

char topicAforo[32];
char topicAlarma[32];
char topicSetear[32];

WiFiClient espClient;
PubSubClient client(espClient);

#define P1_A 5
#define P1_B 4
#define P2_A 14
#define P2_B 12
#define BUZZER 13

int aforo = 0;
int aforo_actual = 0;
const unsigned long TIMEOUT = 8000;

enum Estado { IDLE, A_FIRST, B_FIRST, BOTH_FROM_A, BOTH_FROM_B };

struct Puerta {
  byte pinA;
  byte pinB;
  Estado estado;
  unsigned long tiempo;
};

Puerta puerta1 = {P1_A, P1_B, IDLE, 0};
Puerta puerta2 = {P2_A, P2_B, IDLE, 0};

bool buzzerActivo = false;
unsigned long buzzerInicio = 0;
const unsigned long BUZZER_DURACION = 2000;

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
      if (!A && !B) {
        aforo++;
        Serial.print("Ingreso   Aforo = ");
        Serial.println(aforo);
        p.estado = IDLE;
      }
      break;

    case BOTH_FROM_B:
      if (!A && !B) {
        if (aforo > 0) aforo--;
        Serial.print("Salida    Aforo = ");
        Serial.println(aforo);
        p.estado = IDLE;
      }
      break;
  }

  if (p.estado != IDLE && millis() - p.tiempo > TIMEOUT) {
    if (!A || !B) p.estado = IDLE;
  }
}

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

  if (buzzerActivo && millis() - buzzerInicio >= BUZZER_DURACION) {
    digitalWrite(BUZZER, LOW);
    buzzerActivo = false;
  }

  if (aforo_actual != aforo) {
    aforo_actual = aforo;
    client.publish(topicAforo, String(aforo_actual).c_str());
  }
}
