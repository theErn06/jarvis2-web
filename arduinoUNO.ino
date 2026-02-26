#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define DOOR_PIN 2   // One wire to D2, other to GND

LiquidCrystal_I2C lcd(0x27, 16, 2);

bool lastDoorOpen = false;
String subtitle = "";

void setup() {
  pinMode(DOOR_PIN, INPUT_PULLUP);

  lcd.init();
  lcd.backlight();

  Serial.begin(9600);

  lcd.setCursor(0, 0);
  lcd.print("JARVIS ONLINE");
  lcd.setCursor(0, 1);
  lcd.print("Awaiting...");
}

void loop() {
  handleDoor();
  handleSubtitles();
}

void handleDoor() {
  bool doorOpen = digitalRead(DOOR_PIN) == HIGH;

  if (doorOpen && !lastDoorOpen) {
    Serial.println("DOOR_OPEN");
  }

  if (!doorOpen && lastDoorOpen) {
    Serial.println("DOOR_CLOSED");
  }

  lastDoorOpen = doorOpen;
}

void handleSubtitles() {
  if (!Serial.available()) return;

  subtitle = Serial.readStringUntil('\n');
  subtitle.trim();

  displaySubtitle(subtitle);
}

void displaySubtitle(String text) {
  lcd.clear();

  if (text.length() <= 16) {
    lcd.setCursor(0, 0);
    lcd.print(text);
  }
  else if (text.length() <= 32) {
    lcd.setCursor(0, 0);
    lcd.print(text.substring(0, 16));
    lcd.setCursor(0, 1);
    lcd.print(text.substring(16));
  }
  else {
    for (int i = 0; i <= text.length() - 16; i++) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(text.substring(i, i + 16));
      delay(300);
    }
  }
}
