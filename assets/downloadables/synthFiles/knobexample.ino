int analogPin = A5;
void setup() {
 Serial.begin(115200);

}

void loop() {
  int potVal;
  potVal = 1023 - analogRead(analogPin);
  Serial.println(potVal); 

}
