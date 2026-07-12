/****************************************************
 ESP32-CAM (AI-Thinker) — Video en vivo por HTTP POST
 Captura JPEG y envía al backend: POST /api/camara/{id}/frame
 Edita la sección CONFIGURACIÓN antes de subir.
****************************************************/

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

//-------------------- CONFIGURACIÓN (editar antes de subir) -----------------
const char* WIFI_SSID     = "TU_RED_WIFI";
const char* WIFI_PASSWORD = "TU_CONTRASEÑA";

// IP de tu PC + puerto del backend (misma IP que MQTT_SERVER del ESP8266)
const char* SERVER_URL = "http://192.168.1.100:3000";

const int SITIO_ID = 1;
const char* CLIENT_ID = "esp32cam-sitio-1";

const unsigned long INTERVALO_MS = 250;  // ms entre frames (~4 fps)
//------------------------------------------------------------------------------

// Pinout cámara AI-Thinker ESP32-CAM
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

unsigned long ultimoFrame = 0;
char endpointUrl[128]; // URL completa del endpoint de frames

// Inicializa sensor OV2640 en modo JPEG VGA
bool iniciarCamara() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;

  // Doble buffer si hay PSRAM (mejor rendimiento)
  if (psramFound()) {
    config.fb_count = 2;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Error cámara: 0x%x\n", err);
    return false;
  }
  return true;
}

// Conexión WiFi bloqueante hasta obtener IP
void conectarWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("IP ESP32-CAM: ");
  Serial.println(WiFi.localIP());
}

// POST del frame JPEG; el backend valida X-Client-Id
bool enviarFrame(camera_fb_t* fb) {
  HTTPClient http;
  http.setTimeout(5000);
  http.begin(endpointUrl);
  http.addHeader("Content-Type", "image/jpeg");
  http.addHeader("X-Client-Id", CLIENT_ID);

  int httpCode = http.POST(fb->buf, fb->len);

  if (httpCode > 0 && httpCode < 300) {
    http.end();
    return true;
  }

  Serial.printf("Error HTTP: %d\n", httpCode);
  http.end();
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  snprintf(endpointUrl, sizeof(endpointUrl), "%s/api/camara/%d/frame", SERVER_URL, SITIO_ID);

  if (!iniciarCamara()) {
    Serial.println("No se pudo iniciar la cámara. Reiniciando...");
    delay(3000);
    ESP.restart();
  }

  conectarWiFi();
  Serial.print("Enviando frames a: ");
  Serial.println(endpointUrl);
  Serial.print("Client ID: ");
  Serial.println(CLIENT_ID);
}

void loop() {
  // Reconectar WiFi si se pierde la red
  if (WiFi.status() != WL_CONNECTED) {
    conectarWiFi();
  }

  // Limitar tasa de frames (INTERVALO_MS)
  if (millis() - ultimoFrame < INTERVALO_MS) {
    delay(10);
    return;
  }

  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Error al capturar frame");
    delay(100);
    return;
  }

  enviarFrame(fb);
  esp_camera_fb_return(fb); // Liberar buffer de la cámara
  ultimoFrame = millis();
}
