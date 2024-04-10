const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'your_database_name'
});

// Funktion zum Berechnen der Distanz zwischen zwei Punkten
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Erdradius in Kilometern

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// Funktion zum Abrufen der letzten GPS-Daten für jeden Container
async function getLatestGPSData() {
  const query = `
    SELECT container_id, latitude, longitude
    FROM GPS_Data
    ORDER BY timestamp DESC
    LIMIT 1;
  `;

  const results = await connection.promise().query(query);

  return results[0];
}

// Funktion zum Berechnen der durchschnittlichen Bewegungsrichtung
async function getAverageDirection(containerIds) {
  const distances = [];

  for (const containerId of containerIds) {
    const previousData = await getLatestGPSData(containerId);

    // Abrufen der aktuellen GPS-Daten
    const currentData = await getLatestGPSData(containerId);

    // Berechnen der Distanz und Richtung zwischen den beiden Positionen
    const distance = getDistance(previousData.latitude, previousData.longitude, currentData.latitude, currentData.longitude);
    const direction = Math.atan2(currentData.latitude - previousData.latitude, currentData.longitude - previousData.longitude);

    distances.push({
      containerId,
      distance,
      direction
    });
  }

  // Berechnen der durchschnittlichen Richtung
  let averageDirection = 0;
  for (const distance of distances) {
    averageDirection += distance.direction;
  }

  averageDirection /= distances.length;

  return averageDirection;
}

// Funktion zum Überprüfen, ob sich ein Container von der Gruppe entfernt
async function checkForDeviation(containerId, averageDirection) {
  const previousData = await getLatestGPSData(containerId);

  // Abrufen der aktuellen GPS-Daten
  const currentData = await getLatestGPSData(containerId);

  // Berechnen der Distanz und Richtung zwischen den beiden Positionen
  const distance = getDistance(previousData.latitude, previousData.longitude, currentData.latitude, currentData.longitude);
  const direction = Math.atan2(currentData.latitude - previousData.latitude, currentData.longitude - previousData.longitude);

  // Abweichungsschwelle (z. B. 30 Grad)
  const deviationThreshold = 30 * Math.PI / 180;

  if (Math.abs(direction - averageDirection) > deviationThreshold) {
    console.log(`Container mit ID ${containerId} hat sich von der Gruppe entfernt!`);
  } else {
    console.log(`Container mit ID ${containerId} bewegt sich mit der Gruppe.`);
  }
}

// Starten der Anwendung
async function main() {
  // Abrufen aller Container-IDs
  const query = `
    SELECT container_id
    FROM Container;
  `;

  const results = await connection.promise().query(query);

  // Berechnen der durchschnittlichen Bewegungsrichtung
  const averageDirection = await getAverageDirection(results.map(r => r.container_id));

  // Überprüfen, ob sich jeder Container von der Gruppe entfernt hat
  for (const container of results)
  await checkForDeviation(container.container_id, averageDirection);
}

main();

