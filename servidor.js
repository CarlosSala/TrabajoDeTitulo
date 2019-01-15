// Carga de módulos
const http = require('http');
const url = require('url');
const fs = require('fs');
const b = require('bonescript');
const mysql = require('mysql');

// Código del servidor web / Inicializado en el puerto 8888
const mime = {
    'html': 'text/html',
    'css': 'text/css',
    'jpg': 'image/jpg',
    'ico': 'image/x-icon'
};

const servidor = http.createServer((pedido, respuesta) => {
    const objetourl = url.parse(pedido.url);
    var camino = 'static' + objetourl.pathname;
    if (camino == 'static/') camino = 'static/index.html';
    fs.stat(camino, error => {
        if (!error) {
            fs.readFile(camino, (error, contenido) => {
                if (error) {
                    respuesta.writeHead(500, {'Content-Type': 'text/plain'});
                    respuesta.write('Error interno');
                    respuesta.end();
                } else {
                    const vec = camino.split('.');
                    const extension = vec[vec.length - 1];
                    const mimearchivo = mime[extension];
                    respuesta.writeHead(200, {'Content-Type': mimearchivo});
                    respuesta.write(contenido);
                    respuesta.end();
                }
            });
        } else {
            respuesta.writeHead(404, {'Content-Type': 'text/html'});
            respuesta.write('<!doctype html><html><head></head><body>Recurso inexistente</body></html>');
            respuesta.end();
        }
    });
});

servidor.listen(8888);

// Creación y establecimiento de conexión con la base de datos MySQL
var dbconn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'ingedesa',
    database: 'usach'
});

dbconn.connect(function(err) {
    if (err) {
        console.log('Database connection error');
    } else {
        console.log('Database connection successful');
    }
});

// Pines digitales
var dir = 'P8_7';
var pul = 'P8_9';
var dir1 = 'P8_11';
var pul1 = 'P8_15';

// Pines analógicos
var sensorIzquierda = 'P9_39';
var sensorDerecha = 'P9_37';
var sensorSuperior = 'P9_33';
var sensorInferior = 'P9_35';

var paneoUsuario = 0; // Variables para el Control Manual
var inclinacionUsuario = 0;
var partida1 = 0;
var estado = 0;
var estado1 = 0;
var estado2 = 0;
var estado3 = 0;
var paneoMySQL; // Variables para el Control Automático
var inclinacionMySQL;
var indice;
var partida2 = 0;
var estado4 = 0;
var estado5 = 0;
var estado6 = 0;
var estado7 = 0;
var SI; // Variables para el Seguidor Solar
var SD;
var SA;
var SB;
var partida3 = 0;
var estado8 = 0;
var estado9 = 0;
var estado10 = 0;
var estado11 = 0;
var tiempo = 10; // Variables Comunes
var eleccionServicio;
var contadorPaneo = 0;
var contadorInclinacion = 0;

// Establecer de pines digitales como salida
b.pinMode(dir, b.OUTPUT);
b.pinMode(pul, b.OUTPUT);
b.pinMode(dir1, b.OUTPUT);
b.pinMode(pul1, b.OUTPUT);

// Establecer de pines digitales como salida
b.digitalWrite(dir, b.LOW);
b.digitalWrite(pul, b.HIGH);
b.digitalWrite(dir1, b.HIGH);
b.digitalWrite(pul1, b.HIGH);

// Carga del módulo socket.io
var io = require('socket.io').listen(servidor);
var s;

// Establecimiento de comunicación
io.on('connection', function(socket) {

    s = socket;
    socket.on('servicio', cambiarServicio); // para identificar la interfaz
    socket.on('detener', detenerSistema); // detener/reanudar setInterval
    socket.on('velocidad', velocidadMotores); // cambiar velocidad motores
    socket.on('inicioManual', manual); // iniciar Control manual
    socket.on('posicionPaneo', paneo); // posición ingresada por el usuario
    socket.on('posicionInclinacion', inclinacion); // igual al anterior 
    socket.on('inicioAutomatico', automatico); // iniciar Control automático
    socket.on('inicioSeguidor', seguidor); // iniciar Seguidor solar
});


              setInterval(monitoreo, 200);
var sistema = setInterval(principal, tiempo);
              setInterval(servicios, 1000);

// Función para detener o reanudar el setInterval principal
var algoritmo = 1;

function detenerSistema(data) {

    algoritmo = JSON.parse(data);
    if (algoritmo == 0) {
        clearInterval(sistema);
        console.log("El sistema se detuvo");
    } else {
        sistema = setInterval(principal, tiempo);
        console.log("El sistema se inició");
    }
}

// Función para cambiar velocidad de los motores
function velocidadMotores(data) {
    tiempo = JSON.parse(data);
    console.log((1000/(tiempo*2))*0.45 + "°/seg");
}

// Función para cambiar entre un servicio y otro
function cambiarServicio(data) {
    eleccionServicio = JSON.parse(data);
    console.log("Interfaz Web: " + eleccionServicio);
}

// Función de entrega de datos "paneo" que ingresó el usuario
function paneo(data) {
    paneoUsuario = JSON.parse(data);
    console.log("Valor en pasos: " + paneoUsuario);
}

// Función de entrega de datos "inclinación" que ingresó el usuario
function inclinacion(data) {
    inclinacionUsuario = JSON.parse(data);
    console.log("Valor en pasos: " + inclinacionUsuario);
}

// Función que entrega la orden de inicio (del usuario) al sist. de Ctrl Manual
function manual(data) {
    partida1 = JSON.parse(data);
    console.log("Control manual: " + partida1);
}

// Función que entrega la orden de inicio (del usuario) al sist. de Ctrl Auto.
function automatico(data) {
    partida2 = JSON.parse(data);
    console.log("Control automático: " + partida2);
}

// Función que entrega la orden de inicio (del usuario) al Seguidor Solar
function seguidor(data) {
    partida3 = JSON.parse(data);
    console.log("Control seguidor: " + partida3);
}

/* Función que envía las posiciones de los motores paso a paso y el estado de
los servicios a las distintas interfaces web cuando corresponde */
function monitoreo() {

    switch (eleccionServicio) {

        case 0:
            var estadoDelSistema = {
                'Estado': algoritmo,
                'Tiempo': tiempo
            };
            s.emit('estadoSistema', estadoDelSistema);
            break;

        case 1:
            s.emit("contadorPaneo", contadorPaneo);
            s.emit("contadorInclinacion", contadorInclinacion);
            s.emit("estadoDelServicio1", partida1);
            s.emit("proximoPaneo", paneoUsuario);
            s.emit("proximaInclinacion", inclinacionUsuario);
            break;

        case 2:
            s.emit("contadorPaneo", contadorPaneo);
            s.emit("contadorInclinacion", contadorInclinacion);
            s.emit("estadoDelServicio2", partida2);
            break;

        case 3:
            s.emit("contadorPaneo", contadorPaneo);
            s.emit("contadorInclinacion", contadorInclinacion);
            s.emit("estadoDelServicio3", partida3);
            break;
    }
}

/* Función que envía un reloj digital a la interfaz del servicio 2 y realiza 
la lectura de pines análogos para el servicio 3 */
function servicios() {

    switch (eleccionServicio) {

        case 2:
            // Consulta y envío de la hora del sistema al servicio de Ctrl Auto.
            fecha = new Date()
            hora = fecha.getHours()
            minuto = fecha.getMinutes()
            segundo = fecha.getSeconds()
            var horaCompleta = {
                "horitas": hora,
                "minutitos": minuto,
                "segunditos": segundo
            };
            s.emit("Reloj", horaCompleta);
            break;

        case 3:

            if (partida3 == 1) {
                // lectura de AIN's (conversores análogos-digitales)        
                SI = (b.analogRead(sensorIzquierda)).toFixed(1);
                console.log("Sensor Izquierda: ", SI);
                SD = (b.analogRead(sensorDerecha)).toFixed(1);
                console.log("Sensor Derecha:   ", SD);
                SA = (b.analogRead(sensorSuperior)).toFixed(1);
                console.log("Sensor Superior:  ", SA);
                SB = (b.analogRead(sensorInferior)).toFixed(1);
                console.log("Sensor Inferior:  ", SB);
            }
            break;
    }
}

// Función principal que recibe datos y genera el movimiento de los motores
function principal() {

    /* Función "switch" que segmenta y ejecuta el código correspondiente al 
       servicio que el usuario se encuentre utilizando en el momento */
    switch (eleccionServicio) {

        case 1:// PARA CONTROL MANUAL

            if (partida1 == 1) {
                // movimiento de Paneo en sentido antihorario        
                if (paneoUsuario > contadorPaneo) {
                    b.digitalWrite(dir, b.LOW);

                    switch (estado) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo++;
                            estado = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado = 0;
                            break;
                    }
                }
                // movimiento de Paneo en sentido horario    
                else if (paneoUsuario < contadorPaneo) {
                    b.digitalWrite(dir, b.HIGH);

                    switch (estado1) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo--;
                            estado1 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado1 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido antihorario   
                if (inclinacionUsuario > contadorInclinacion) {
                    b.digitalWrite(dir1, b.LOW);

                    switch (estado2) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion++;
                            estado2 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado2 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido horario 
                else if (inclinacionUsuario < contadorInclinacion) {
                    b.digitalWrite(dir1, b.HIGH);

                    switch (estado3) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion--;
                            estado3 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado3 = 0;
                            break;
                    }
                }
            }
        // Permite detener el sistema una que este acabo de posicionarse 
            if (paneoUsuario == contadorPaneo && inclinacionUsuario == contadorInclinacion) {
                partida1 = 0;
            }

            break;

        case 2:// PARA CONTROL AUTOMÁTICO

            if (partida2 == 1) {

                if (hora > 5 && hora < 24) {
                    indice = hora - 6;
                } else if (hora >= 0 && hora < 3) {
                    indice = hora + 18;
                } else {
                    indice = 0;
                }

                // Esta línea consulta las siguientes columnas de la tabla "posiciones"
                dbconn.query('SELECT paneo, inclinacion FROM posiciones', function(err, records) {
                    if (err) throw err;

                    var datos = records[indice];

                    paneoMySQL = Math.round((datos.paneo * 800) / 360);
                    inclinacionMySQL = Math.round((datos.inclinacion * 800) / 360);
                });

                //dbconn.end(function(err) {
                //Function to close database connection
                //});    

                // movimiento de Paneo en sentido antihorario         
                if (paneoMySQL > contadorPaneo) {
                    b.digitalWrite(dir, b.LOW);

                    switch (estado4) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo++;
                            estado4 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado4 = 0;
                            break;
                    }
                }
                // movimiento de Paneo en sentido horario   
                else if (paneoMySQL < contadorPaneo) {
                    b.digitalWrite(dir, b.HIGH);

                    switch (estado5) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo--;
                            estado5 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado5 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido antihorario   
                if (inclinacionMySQL > contadorInclinacion) {
                    b.digitalWrite(dir1, b.LOW);

                    switch (estado6) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion++;
                            estado6 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado6 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido horario     
                else if (inclinacionMySQL < contadorInclinacion) {
                    b.digitalWrite(dir1, b.HIGH);

                    switch (estado7) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion--;
                            estado7 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado7 = 0;
                            break;
                    }
                }
            }

            break;
            
        case 3:// PARA SEGUIDOR SOLAR

            if (partida3 == 1) {

                // movimiento de Paneo en sentido antihorario        
                if (SD < SI && contadorPaneo <= 799) {
                    b.digitalWrite(dir, b.LOW);

                    switch (estado8) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo++;
                            estado8 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado8 = 0;
                            break;
                    }
                }
                // movimiento de Paneo en sentido horario     
                else if (SD > SI && contadorPaneo > 0) {
                    b.digitalWrite(dir, b.HIGH);

                    switch (estado9) {
                        case 0:
                            b.digitalWrite(pul, b.HIGH);
                            contadorPaneo--;
                            estado9 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul, b.LOW);
                            estado9 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido antihorario    
                if (SA > SB && contadorInclinacion <= 399) {
                    b.digitalWrite(dir1, b.LOW);

                    switch (estado10) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion++;
                            estado10 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado10 = 0;
                            break;
                    }
                }
                // movimiento de Inclinación en sentido horario     
                if (SA < SB && contadorInclinacion > 0) {

                    b.digitalWrite(dir1, b.HIGH);

                    switch (estado11) {
                        case 0:
                            b.digitalWrite(pul1, b.HIGH);
                            contadorInclinacion--;
                            estado11 = 1;
                            break;

                        case 1:
                            b.digitalWrite(pul1, b.LOW);
                            estado11 = 0;
                            break;
                    }
                }
            }

            break;
    }
}

servidor.listen(console.log("Server Running ..."));