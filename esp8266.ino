/****************************************************
 ESP8266
 Control de aforo con 2 puertas independientes
 Sensores FC-51
****************************************************/

//-------------------- PINES -------------------------
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

const char* ssid = "PAULPT 2.4Ghz";
const char* password = "MATT5626";

const char* mqtt_server = "192.168.100.3";

WiFiClient espClient;
PubSubClient client(espClient);

#define P1_A 5
#define P1_B 4

#define P2_A 14
#define P2_B 12

#define BUZZER 13

//----------------------------------------------------

int aforo = 0;
int aforo_actual = 0;

const unsigned long TIMEOUT = 8000;

enum Estado
{
  IDLE,
  A_FIRST,
  B_FIRST,
  BOTH_FROM_A,
  BOTH_FROM_B
};

struct Puerta
{
  byte pinA;
  byte pinB;

  Estado estado;

  unsigned long tiempo;
};

Puerta puerta1 = {P1_A, P1_B, IDLE, 0};
Puerta puerta2 = {P2_A, P2_B, IDLE, 0};

//----------------------------------------------------

bool sensorA(Puerta &p)
{
  return digitalRead(p.pinA)==LOW;   // FC51 activo LOW
}

bool sensorB(Puerta &p)
{
  return digitalRead(p.pinB)==LOW;
}

//----------------------------------------------------

void procesarPuerta(Puerta &p)
{
  bool A = sensorA(p);
  bool B = sensorB(p);

  switch(p.estado)
  {

    //---------------- IDLE --------------------------

    case IDLE:

      if(A && !B)
      {
        p.estado=A_FIRST;
        p.tiempo=millis();
      }

      else if(B && !A)
      {
        p.estado=B_FIRST;
        p.tiempo=millis();
      }

    break;

    //---------------- A PRIMERO ---------------------

    case A_FIRST:

      if(A && B)
      {
        p.estado=BOTH_FROM_A;
      }

      else if(!A)
      {
        p.estado=IDLE;
      }

    break;

    //---------------- B PRIMERO ---------------------

    case B_FIRST:

      if(A && B)
      {
        p.estado=BOTH_FROM_B;
      }

      else if(!B)
      {
        p.estado=IDLE;
      }

    break;

    //---------------- ENTRANDO ----------------------

    case BOTH_FROM_A:

      if(!A && B)
      {
        // esperando liberar B
      }

      if(!A && !B)
      {
        aforo++;

        Serial.print("Ingreso   Aforo = ");
        Serial.println(aforo);

        p.estado=IDLE;
      }

    break;

    //---------------- SALIENDO ----------------------

    case BOTH_FROM_B:

      if(A && !B)
      {
      }

      if(!A && !B)
      {
        if(aforo>0)
            aforo--;

        Serial.print("Salida    Aforo = ");
        Serial.println(aforo);

        p.estado=IDLE;
      }

    break;
  }

  //---------------- Timeout -------------------------

  if(p.estado!=IDLE)
  {
      if(millis()-p.tiempo>TIMEOUT)
      {
          // Persona detenida entre sensores

          if(!A || !B)
          {
              p.estado=IDLE;
          }

          // Si sigue ocupando ambos sensores
          // simplemente espera hasta que se mueva.
      }
  }
}

//----------------------------------------------------

//RETORNO
void callback(char* topic, byte* payload, unsigned int length) {
  String canal = String(topic);
  if (canal == "alarma") {
      digitalWrite(BUZZER,HIGH);
      delay(2000);
      digitalWrite(BUZZER,LOW);
  }

  if (canal == "setear") {
    aforo_actual = atoi((char*)payload);
    aforo = aforo_actual;
    client.publish("aforo", String(aforo).c_str());
  }

}


void reconnect()
{
  while (!client.connected())
  {
    Serial.print("Conectando MQTT...");

    if (client.connect("ESP8266Client"))
    {
      Serial.println("Conectado");

      client.subscribe("alarma");
      client.subscribe("reinicio");
    }
    else
    {
      Serial.print("Error MQTT: ");
      Serial.println(client.state());

      delay(5000);
    }
  }
}

void setup()
{
  Serial.begin(115200);

  pinMode(P1_A,INPUT_PULLUP);
  pinMode(P1_B,INPUT_PULLUP);

  pinMode(P2_A,INPUT_PULLUP);
  pinMode(P2_B,INPUT_PULLUP);

  pinMode(BUZZER, OUTPUT);

  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(WiFi.localIP());
  Serial.println(WiFi.gatewayIP());
  Serial.println("Conectado a la red!");
  client.setServer(mqtt_server, 1883); // Puerto MQTT por defecto
  client.setCallback(callback);
  digitalWrite(BUZZER, LOW);
  
}

//----------------------------------------------------

void loop()
{

  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  procesarPuerta(puerta1);
  procesarPuerta(puerta2);
  if(aforo_actual != aforo) {
    aforo_actual = aforo;
    client.publish("aforo", String(aforo_actual).c_str());
  }
}