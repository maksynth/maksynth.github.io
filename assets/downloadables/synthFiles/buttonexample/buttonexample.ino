int digitalPin = 2;
void setup() {
  Serial.begin(115200);
  pinMode(INPUT_PULLUP,digitalPin);

}

void loop() {
  int buttonVal;
  buttonVal = digitalRead(digitalPin);
  Serial.println(buttonVal);

}
