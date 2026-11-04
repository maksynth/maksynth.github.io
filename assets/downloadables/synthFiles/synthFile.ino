#include <Arduino.h>

const int NUM_KEYS = 12;
const int NUM_POTS = 6;

int potPins[NUM_POTS] = {A5, A4, A3, A2, A1, A0};
int keyPins[NUM_KEYS] = {2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13};

int lastKeyState[NUM_KEYS];
int lastPotVal[NUM_POTS];
int smoothPot[NUM_POTS];

const int POT_THRESHOLD = 18; 

unsigned long lastDebounce[NUM_KEYS];
int debounceDelay = 25; 

void sendPacket(int type, int id, int val) {
  Serial.print("<");
  Serial.print(type);
  Serial.print(",");
  Serial.print(id);
  Serial.print(",");
  Serial.print(val);
  Serial.println(">");
}

void setup() {
  Serial.begin(115200);

  for(int i=0; i<NUM_KEYS; i++){
    pinMode(keyPins[i], INPUT_PULLUP);
    lastKeyState[i] = digitalRead(keyPins[i]);
    lastDebounce[i] = 0;
  }

  for(int i=0; i<NUM_POTS; i++){
    int v = analogRead(potPins[i]);
    lastPotVal[i] = v;
    smoothPot[i] = v;
  }
}

void loop() {
  
  for(int i=0; i<NUM_KEYS; i++){
    int state = digitalRead(keyPins[i]);

    if(state != lastKeyState[i]){
      if((millis() - lastDebounce[i]) > debounceDelay){
        lastDebounce[i] = millis();
        lastKeyState[i] = state;

      
        int val = (state == LOW) ? 0 : 1;
        sendPacket(0, i, val);
      }
    }
  }


  for(int i=0; i<NUM_POTS; i++){
    int raw = 1023 - analogRead(potPins[i]); //change back to analogRead(potPins[i]) depending on which kit is given

 
    smoothPot[i] = (smoothPot[i] * 3 + raw) / 4;

   
    if(abs(smoothPot[i] - lastPotVal[i]) > POT_THRESHOLD){
      lastPotVal[i] = smoothPot[i];
      sendPacket(1, i, smoothPot[i]);
    }
  }

  delay(1);
}
