#include <Wire.h>
#include <Adafruit_PWMServoDriver.h>
#include <math.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

Adafruit_PWMServoDriver pwm(0x40);

const int SERVOMIN = 120;
const int SERVOMAX = 620;

const int LEG_A_CH[4] = {0, 3, 6, 9};
const int LEG_B_CH[4] = {1, 4, 7, 10};
const float LEG_DIRECTION[4] = {1.0f, -1.0f, -1.0f, 1.0f};

const float D  = 27.5f; 
const float L1 = 80.966f;
const float L2 = 110.969f;

int currentLoopDelayMs = 15;
const float PAW_Y_RANGE_SCALE = 0.22f;
const float PAW_Y_LOWEST = -184.0f;
const float PAW_X_RANGE_SCALE = 1.7f;
const float CROUCH_HEIGHT = -210.0f;
const float PANCAKE_HEIGHT_MM = -160.0f; 
const float IDLE_Y_CENTER_MM = -170.0f;
const float IDLE_Y_AMPLITUDE_MM = 22.0f;

const int servoMin[12] = {63, 0, 13, 60, 0, 60, 20, 73, 80, 15, 63, 40};
const int servoMax[12] = {120, 60, 90, 120, 60, 120, 70, 110, 120, 63, 120, 80};
const int servoDefault[12] = {85, 40, 63, 90, 40, 82, 50, 86, 97, 45, 90, 63};
const int SHOULDER_CH[4] = {2, 5, 8, 11};

const float pawPositions[][2] = 
{
  {-8, -175}, {-7, -177}, {-6, -179}, {-5, -180},
  {-4, -181}, {-3, -182}, {-2, -183}, {-1, -183},
  { 0, -184}, { 1, -183}, { 2, -183}, { 3, -182},
  { 4, -181}, { 5, -180}, { 6, -179}, { 7, -177},
  { 8, -175}, { 7, -165}, { 6, -163}, { 5, -162}, 
  { 4, -161}, { 3, -160}, { 2, -159}, { 1, -159}, 
  { 0, -158}, {-1, -159}, {-2, -159}, {-3, -160}, 
  {-4, -161}, {-5, -162}, {-6, -163}, {-7, -165}, 
  {-8, -168}
};

const int NUM_POINTS = sizeof(pawPositions) / sizeof(pawPositions[0]);
const int LEG_PHASE_OFFSET = NUM_POINTS / 2;

float referenceA[4];
float referenceB[4];
bool referencesSet = false;

bool stopped = false;
bool isCrouched = false;
int pointIndex = 0;
int gaitDirection = 1; 
int gaitMode = 0;      

#define SERVICE_UUID           "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;
String latestCommand = "";
bool commandReceived = false;

class MyServerCallbacks: public BLEServerCallbacks 
{
    void onConnect(BLEServer* pServer) 
    {
        deviceConnected = true;
        Serial.println("BLE Connected");
    }

    void onDisconnect(BLEServer* pServer) 
    {
        deviceConnected = false;
        Serial.println("BLE Disconnected");
        pServer->startAdvertising();
    }
};

class MyCallbacks: public BLECharacteristicCallbacks 
{
    void onWrite(BLECharacteristic *pCharacteristic) 
    {
        String value = pCharacteristic->getValue();
        if (value.length() > 0) 
        {
            latestCommand = value;
            commandReceived = true;
        }
    }
};

float adjustPawX(float x) 
{ 
    return x * PAW_X_RANGE_SCALE; 
}

float adjustPawY(float y) 
{ 
    return PAW_Y_LOWEST + (y - PAW_Y_LOWEST) * PAW_Y_RANGE_SCALE; 
}

void setServo(int channel, float angle) 
{
    angle = constrain(angle, (float)servoMin[channel], (float)servoMax[channel]);
    int pulse = SERVOMIN + (int)((angle / 180.0f) * (SERVOMAX - SERVOMIN));
    pwm.setPWM(channel, 0, pulse);
}

void disableAllServos() 
{
    for (int i = 0; i < 12; i++) 
    { 
        pwm.setPWM(i, 0, 4096); 
    }
}

void lockShoulders() 
{
    setServo(2, 63); 
    setServo(5, 85); 
    setServo(8, 97); 
    setServo(11, 67);
}

float wrap180(float angle) 
{
    while (angle > 180.0f) angle -= 360.0f;
    while (angle < -180.0f) angle += 360.0f;
    return angle;
}

void executeWiggle() 
{
    int backLeft = SHOULDER_CH[1], backRight = SHOULDER_CH[3];
    int defaultBL = servoDefault[backLeft], defaultBR = servoDefault[backRight];
    setServo(SHOULDER_CH[0], servoDefault[SHOULDER_CH[0]]);
    setServo(SHOULDER_CH[2], servoDefault[SHOULDER_CH[2]]);
    int wiggleOffset = 10, steps = 15, stepDelay = 25;

    for (int cycle = 0; cycle < 3; cycle++) 
    {
        for (int s = 0; s <= steps; s++) 
        {
            setServo(backLeft, defaultBL + ((float)wiggleOffset * s / steps));
            setServo(backRight, defaultBR + ((float)wiggleOffset * s / steps));
            delay(stepDelay);
        }
        for (int s = 0; s <= steps; s++) 
        {
            setServo(backLeft, (defaultBL + wiggleOffset) - ((float)(2 * wiggleOffset) * s / steps));
            setServo(backRight, (defaultBR + wiggleOffset) - ((float)(2 * wiggleOffset) * s / steps));
            delay(stepDelay);
        }
    }
    lockShoulders();
    stopped = true;
}

void executeShake() 
{
    int backLeft = SHOULDER_CH[1], backRight = SHOULDER_CH[3];
    int defaultBL = servoDefault[backLeft], defaultBR = servoDefault[backRight];
    setServo(SHOULDER_CH[0], servoDefault[SHOULDER_CH[0]]);
    setServo(SHOULDER_CH[2], servoDefault[SHOULDER_CH[2]]);
    int shakeOffset = 15, steps = 15, stepDelay = 25;

    for (int cycle = 0; cycle < 3; cycle++)
    {
        for (int s = 0; s <= steps; s++) 
        {
            setServo(backLeft, defaultBL + ((float)shakeOffset * s / steps));
            setServo(backRight, defaultBR - ((float)shakeOffset * s / steps));
            delay(stepDelay);
        }

        for (int s = 0; s <= steps; s++) 
        {
            setServo(backLeft, (defaultBL + shakeOffset) - ((float)(2 * shakeOffset) * s / steps));
            setServo(backRight, (defaultBR - shakeOffset) + ((float)(2 * shakeOffset) * s / steps));
            delay(stepDelay);
        }
    }
    lockShoulders();
    stopped = true;
}

void handleCommand(String cmd) 
{
    if (cmd.startsWith("SPD:"))
    {
        currentLoopDelayMs = cmd.substring(4).toInt();
        return;
    }
    
    char command = cmd.charAt(0);
    if (command == 's' || command == 'S') 
    {
        stopped = true; isCrouched = false; disableAllServos();
    } 
    else if (command == 'c' || command == 'C') 
    {
        stopped = true; isCrouched = true;
    } 
    else if (command == 'f' || command == 'F') 
    {
        stopped = false; isCrouched = false; gaitMode = 0; gaitDirection = 1;
    } 
    else if (command == 'b' || command == 'B') 
    {
        stopped = false; isCrouched = false; gaitMode = 0; gaitDirection = -1;
    } 
    else if (command == 'r' || command == 'R') 
    {
        stopped = false; isCrouched = false; gaitMode = 1; gaitDirection = 1;
    } 
    else if (command == 'l' || command == 'L') 
    {
        stopped = false; isCrouched = false; gaitMode = 2; gaitDirection = 1;
    } 
    else if (command == 'w' || command == 'W') 
    {
        stopped = false; isCrouched = false; executeWiggle();
    } 
    else if (command == '7') 
    {
        stopped = false; isCrouched = false; executeShake();
    } 
    else if (command == 'i' || command == 'I') 
    {
        stopped = false; isCrouched = false; gaitMode = 5; gaitDirection = 1;
    } 
    else if (command == '5') 
    {
        stopped = false; isCrouched = false; gaitMode = 4; gaitDirection = 1;
    }
}

void checkInput() 
{
    while (Serial.available() > 0) 
    {
        String s = Serial.readStringUntil('\n');
        handleCommand(s);
    }
    if (commandReceived) 
    {
        commandReceived = false;
        handleCommand(latestCommand);
    }
}

void controlledDelay(int duration) 
{
    unsigned long start = millis();
    while (millis() - start < (unsigned long)duration) 
    {
        checkInput();
        if (stopped) return;
        delay(1);
    }
}

bool calculateUpperAngle(float x, float y, float baseX, float &angle) 
{
    float dx = x - baseX;
    float r = sqrt(dx * dx + y * y);
    if (r > L1 + L2 || r < fabs(L1 - L2) || r < 0.001f) return false;
    float a = (L1 * L1 - L2 * L2 + r * r) / (2.0f * r);
    float hSquared = L1 * L1 - a * a;
    if (hSquared < 0.0f) hSquared = 0.0f;
    float h = sqrt(hSquared);
    float ex1 = baseX + a * (dx / r) - h * (y / r);
    float ey1 = a * (y / r) + h * (dx / r);
    float ex2 = baseX + a * (dx / r) + h * (y / r);
    float ey2 = a * (y / r) - h * (dx / r);
    angle = atan2((ey1 >= ey2) ? ey1 : ey2, ((ey1 >= ey2) ? ex1 : ex2) - baseX) * 180.0f / PI;
    return true;
}

bool calculatePawAngles(float x, float y, float &angleA, float &angleB) 
{
    x = adjustPawX(x); y = adjustPawY(y);
    return calculateUpperAngle(x, y, -D / 2.0f, angleA) && calculateUpperAngle(x, y, D / 2.0f, angleB);
}

bool moveAllLegs(const int legPoint[4], bool forceCrouch = false) 
{
    float angleA[4], angleB[4];
    for (int leg = 0; leg < 4; leg++) 
    {
        float targetX = 0.0f, targetY = 0.0f;
        if (forceCrouch) 
        { 
            targetY = CROUCH_HEIGHT; 
        } 
        else if (gaitMode == 3) 
        { 
            targetY = PANCAKE_HEIGHT_MM; 
        } 
        else if (gaitMode == 4) 
        {
            float phase = (float)millis() / 1000.0f;
            targetY = IDLE_Y_CENTER_MM + sin(phase * 2.0f) * IDLE_Y_AMPLITUDE_MM;
        } 
        else if (gaitMode == 5) 
        {
            float phase = (float)millis() / 1000.0f;
            float legPhaseOffset = (leg == 1 || leg == 3) ? PI : 0.0f;
            targetY = IDLE_Y_CENTER_MM + sin(phase * 2.0f + legPhaseOffset) * IDLE_Y_AMPLITUDE_MM;
        } 
        else 
        {
            targetX = pawPositions[legPoint[leg]][0];
            targetY = pawPositions[legPoint[leg]][1];
        }
        if (!calculatePawAngles(targetX, targetY, angleA[leg], angleB[leg])) 
        {
            return false;
        }
    }

    if (!referencesSet) 
    {
        for (int leg = 0; leg < 4; leg++) { referenceA[leg] = angleA[leg]; referenceB[leg] = angleB[leg]; }
        referencesSet = true;
    }

    for (int leg = 0; leg < 4; leg++) 
    {
        setServo(LEG_A_CH[leg], servoDefault[LEG_A_CH[leg]] + LEG_DIRECTION[leg] * wrap180(angleA[leg] - referenceA[leg]));
        setServo(LEG_B_CH[leg], servoDefault[LEG_B_CH[leg]] + LEG_DIRECTION[leg] * wrap180(angleB[leg] - referenceB[leg]));
    }
    lockShoulders();
    return true;
}

void setup() 
{
    Serial.begin(115200);
    Wire.begin();
    pwm.begin();
    pwm.setPWMFreq(50);
    delay(300);

    for (int leg = 0; leg < 4; leg++) 
    {
        setServo(LEG_A_CH[leg], servoDefault[LEG_A_CH[leg]]);
        setServo(LEG_B_CH[leg], servoDefault[LEG_B_CH[leg]]);
    }
    lockShoulders();

    BLEDevice::init("BARQ_Robot");
    BLEServer *pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    BLEService *pService = pServer->createService(SERVICE_UUID);
    pCharacteristic = pService->createCharacteristic(CHARACTERISTIC_UUID_RX, BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_WRITE_NR);
    pCharacteristic->setCallbacks(new MyCallbacks());
    pService->start();
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();
}

void loop() 
{
    checkInput();
    if (stopped) 
    {
        if (isCrouched) 
        { 
            int dummy[4] = {0, 0, 0, 0}; moveAllLegs(dummy, true); 
        }
        delay(15);
        return;
    }

    lockShoulders();
    int phasePoint = (pointIndex + LEG_PHASE_OFFSET) % NUM_POINTS;
    int inversePoint = (NUM_POINTS - pointIndex) % NUM_POINTS;
    int legPoint[4];

    if (gaitMode == 1) 
    {
        legPoint[0] = inversePoint; legPoint[1] = pointIndex; 
        legPoint[2] = (LEG_PHASE_OFFSET - pointIndex + NUM_POINTS) % NUM_POINTS; legPoint[3] = inversePoint; 
    }
    else if (gaitMode == 2) 
    {
        legPoint[0] = (LEG_PHASE_OFFSET - pointIndex + NUM_POINTS) % NUM_POINTS; legPoint[1] = inversePoint; 
        legPoint[2] = inversePoint; legPoint[3] = pointIndex; 
    } 
    else if (gaitMode >= 3 && gaitMode <= 5) 
    {
        legPoint[0] = 0; legPoint[1] = 0; legPoint[2] = 0; legPoint[3] = 0;
    } 
    else 
    {
        legPoint[0] = (NUM_POINTS - pointIndex) % NUM_POINTS;     
        legPoint[1] = pointIndex;                                 
        legPoint[2] = (LEG_PHASE_OFFSET - pointIndex + NUM_POINTS) % NUM_POINTS; 
        legPoint[3] = phasePoint;                                 
    }

    if (!moveAllLegs(legPoint, false))
    { 
        stopped = true; disableAllServos(); return; 
    }

    pointIndex += gaitDirection;
    if (pointIndex >= NUM_POINTS) pointIndex = 0;
    else if (pointIndex < 0) pointIndex = NUM_POINTS - 1;

    controlledDelay(currentLoopDelayMs);
}