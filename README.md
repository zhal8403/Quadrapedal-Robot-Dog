# BARQ Robot

> ESP32-powered 12-servo quadruped robot featuring real-time inverse kinematics, custom gaits, and a wireless browser-based controller via Bluetooth Low Energy (BLE).

---

## Features

- **Inverse Kinematics (IK):** Smooth leg path calculations for natural walking, turning, and dynamic body height adjustments.
- **Gait Management:** Supports forward, backward, left turn, right turn, crouch, pancake mode, wiggle, shake, and synchronized/alternate idle modes.
- **Wireless Web Bluetooth Control:** Connect directly from Google Chrome or Microsoft Edge without installing native desktop or mobile applications.
- **Dual Input Modes:** Drive using either on-screen touch/click buttons or physical keyboard shortcuts.
- **Dynamic Speed Control:** Real-time speed adjustment slider linked directly to the ESP32 movement loop delay.

---

## Repository Structure

```text
Barq_code/
├── Barq_code.ino            # ESP32 Arduino Firmware (Inverse Kinematics & BLE Server)
├── index.html               # Web controller user interface structure
├── style.css                # Layout and dark theme styling
└── script.js                # Web Bluetooth connection logic and keyboard handlers
```

---

## Hardware & Software Requirements

### Hardware
- ESP32 Development Board
- PCA9685 16-Channel PWM Servo Driver (Connected via I2C: SDA = GPIO 21, SCL = GPIO 22)
- 12x Servos configured across 4 legs and 4 shoulder channels

### Software & Libraries
- Arduino IDE (with the ESP32 board package installed)
- Adafruit PWM Servo Driver Library (available via the Arduino IDE Library Manager)
- A Chromium-based browser (**Google Chrome** or **Microsoft Edge**) for Web Bluetooth API support

---

## Getting Started

### Step 1: Upload the Firmware
1. Open the Arduino IDE.
2. Select your ESP32 board and active COM port under **Tools > Board** and **Tools > Port**.
3. Open `Barq_code.ino` (ensure your sketch file is inside a folder named `Barq_code`).
4. Compile and upload the sketch to your ESP32.

### Step 2: Configure the Web Controller
1. Place `index.html`, `style.css`, and `script.js` together in the same local directory.
2. Open **`index.html`** in Google Chrome or Microsoft Edge.

### Step 3: Connect and Operate
1. Power on your ESP32 quadruped robot.
2. Click the **Connect Bluetooth** button on the webpage.
3. Select **`BARQ_Robot`** from the browser device pairing dialog.
4. Use the interface or keyboard shortcuts to control the robot.

---

## Hardware Wiring & Pinout

### ESP32 to PCA9685 (I2C)
| ESP32 Pin | PCA9685 Pin | Function |
| :--- | :--- | :--- |
| **3.3V** | VCC | Logic Power |
| **GND** | GND | Common Ground |
| **GPIO 21** | SDA | I2C Data Line |
| **GPIO 22** | SCL | I2C Clock Line |
| *External 5V–6V* | V+ | Servo Motor Power |

### PCA9685 Servo Channels
| Leg Position | Joint A (Upper) | Joint B (Lower) | Shoulder |
| :--- | :--- | :--- | :--- |
| **Front Right** | Channel 0 | Channel 1 | Channel 2 |
| **Back Left** | Channel 3 | Channel 4 | Channel 5 |
| **Front Left** | Channel 6 | Channel 7 | Channel 8 |
| **Back Right** | Channel 9 | Channel 10 | Channel 11 |

---

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| **W** | Move Forward |
| **S** | Move Backward |
| **A** | Turn Left |
| **D** | Turn Right |
| **Space** | Emergency Stop |
| **C** | Crouch Mode |
| **5** | Synchronized Idle |
| **X** | Alternate Idle |
| **7** | Shake Action |

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
