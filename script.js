let bluetoothDevice;
let rxCharacteristic;
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const UART_RX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

document.getElementById('connectBtn').addEventListener('click', async () => 
{
    try 
    {
        document.getElementById('status').innerText = "Status: Connecting...";
        bluetoothDevice = await navigator.bluetooth.requestDevice({filters: [{ name: 'BARQ_Robot' }], optionalServices: [UART_SERVICE_UUID]});
        
        const server = await bluetoothDevice.gatt.connect();
        const service = await server.getPrimaryService(UART_SERVICE_UUID);
        rxCharacteristic = await service.getCharacteristic(UART_RX_CHARACTERISTIC_UUID);
        
        document.getElementById('status').innerText = "Status: Connected to BARQ";
        document.getElementById('status').style.color = "#3fb950";
        document.getElementById('connectBtn').innerText = "Connected";
        document.getElementById('connectBtn').style.background = "#21262d";
        
        bluetoothDevice.addEventListener('gattserverdisconnected', onDisconnected);
    } 
    catch (error) 
    {
        console.log(error);
        document.getElementById('status').innerText = "Status: Connection Failed or Cancelled";
        document.getElementById('status').style.color = "#f85149";
    }
});

function onDisconnected() 
{
    document.getElementById('status').innerText = "Status: Disconnected";
    document.getElementById('status').style.color = "#ffc107";
    document.getElementById('connectBtn').innerText = "Connect Bluetooth";
    document.getElementById('connectBtn').style.background = "#238636";
    rxCharacteristic = null;
}

async function sendCommand(cmd) {
    if (!rxCharacteristic) 
    {
        console.log("Not connected. Command skipped: " + cmd);
        return;
    }
    try 
    {
        const encoder = new TextEncoder();
        await rxCharacteristic.writeValue(encoder.encode(cmd));
    }
    catch (error) 
    {
        console.log("Error sending command: ", error);
    }
}

function updateSpeed(val) 
{
    let speedText = val + "ms delay";
    if (val <= 10) 
    {
        speedText = "Turbo (" + val + "ms)";
    }
    else if (val <= 20) 
    {
        speedText = "Normal (" + val + "ms)";
    }
    else 
    {
        speedText = "Slow (" + val + "ms)";
    }
    
    document.getElementById('speedVal').innerText = speedText;
    sendCommand("SPD:" + val);
}

//keyboard inputs
window.addEventListener('keydown', (event) => 
{
    // Prevent firing if user is typing in inputs
    if (event.target.tagName === 'INPUT') return;

    if (event.code === 'Space') 
    {
        event.preventDefault();
        sendCommand('s');
        return;
    }

    const key = event.key.toLowerCase();
    if 
        (key === 'w') sendCommand('f');  // Forward
    else if 
        (key === 'a') sendCommand('l');  // Left
    else if 
        (key === 'd') sendCommand('r');  // Right
    else if 
        (key === 's') sendCommand('b');  // Backward
    else if 
        (key === 'c') sendCommand('c');  // Crouch
    else if 
        (key === 'x') sendCommand('i');  // Idle
    else if 
        (key === '5') sendCommand('5');  // Up / Down
    else if 
        (key === '7') sendCommand('7');  // Shake
});